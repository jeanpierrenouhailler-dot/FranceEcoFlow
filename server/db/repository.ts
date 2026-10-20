import { executeQuery } from './connection.ts';
import { EconomicFlow, Infrastructure, TransportRoute } from '../../src/types/index.ts';

export interface SpatialInfrastructureResult extends Infrastructure {
  distanceKm?: number;
  geometryGeoJson?: any;
}

export interface EconomicIndicator {
  id: string;
  indicatorCode: string;
  provider: 'INSEE';
  period: string;
  value: number;
  unit: string;
  labelFr: string;
  seriesId?: string;
  retrievedAt: string;
}

export interface EnergyObservation {
  id: string;
  countryId: string;
  flowMetric: 'REFINERY_INTAKE' | 'CLOSING_STOCK' | 'CRUDE_PRODUCTION' | 'IMPORTS' | 'EXPORTS';
  productId: string;
  period: string;
  volumeKboed?: number;
  volumeTonnes?: number;
  stockDaysNetImports?: number;
  sourceId: 'jodi' | 'sdes' | 'eia';
  createdAt: string;
}

// In-Memory store for fast fallback when external PostgreSQL container is not connected
let memoryInfrastructures: SpatialInfrastructureResult[] = [];
let memoryRoutes: TransportRoute[] = [];
let memoryIndicators: EconomicIndicator[] = [];
let memoryObservations: EnergyObservation[] = [];

export const dbRepository = {
  // 1. PostGIS Spatial Query: Infrastructures within radius using Haversine / PostGIS ST_DWithin
  async findInfrastructuresWithinRadius(
    centerLng: number,
    centerLat: number,
    radiusKm: number
  ): Promise<SpatialInfrastructureResult[]> {
    const sql = `
      SELECT id, name, type, operator, capacity_annual_tonnes, osm_id, confidence, source_id, description_fr,
             ST_AsGeoJSON(geom) AS geometry_geojson,
             ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000.0 AS distance_km
      FROM infrastructures
      WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3 * 1000)
      ORDER BY distance_km ASC;
    `;

    try {
      const res = await executeQuery(sql, [centerLng, centerLat, radiusKm]);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          countryId: 'FR',
          operator: r.operator,
          coordinates: [centerLng, centerLat],
          capacityAnnualTonnes: parseFloat(r.capacity_annual_tonnes),
          currentStatus: 'active',
          osmId: r.osm_id,
          confidence: r.confidence,
          sourceId: r.source_id,
          descriptionFr: r.description_fr,
          distanceKm: Math.round(parseFloat(r.distance_km) * 10) / 10,
          geometryGeoJson: r.geometry_geojson ? JSON.parse(r.geometry_geojson) : undefined,
        }));
      }
    } catch (e) {
      // Fallback to spatial memory calculation
    }

    // Mathematical ST_DWithin calculation in SpatialMemoryEngine
    const R = 6371; // Earth radius in km
    return memoryInfrastructures
      .map((infra) => {
        const [lng, lat] = infra.coordinates;
        const dLat = ((lat - centerLat) * Math.PI) / 180;
        const dLon = ((lng - centerLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((centerLat * Math.PI) / 180) *
            Math.cos((lat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = Math.round(R * c * 10) / 10;
        return {
          ...infra,
          distanceKm,
          geometryGeoJson: {
            type: 'Point',
            coordinates: [lng, lat],
          },
        };
      })
      .filter((infra) => (infra.distanceKm ?? 0) <= radiusKm)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  },

  // 2. PostGIS Spatial Lines: Nautical corridors with ST_AsGeoJSON
  async findTransportRoutes(): Promise<TransportRoute[]> {
    const sql = `
      SELECT id, source_partner_id, destination_reporter_id, product_id, mode,
             ST_AsGeoJSON(geom) AS geom_geojson, distance_km, confidence, evidence, source_id
      FROM transport_routes;
    `;
    try {
      const res = await executeQuery(sql);
      if (res.rows && res.rows.length > 0) {
        return res.rows.map((r: any) => ({
          id: r.id,
          sourcePartnerId: r.source_partner_id,
          destinationReporterId: r.destination_reporter_id,
          productId: r.product_id,
          mode: r.mode,
          waypoints: r.geom_geojson ? JSON.parse(r.geom_geojson).coordinates : [],
          confidence: r.confidence,
          evidence: r.evidence,
          sourceId: r.source_id,
        }));
      }
    } catch (e) {
      // Fallback to memory
    }
    return memoryRoutes;
  },

  // 3. INSEE Macroeconomic Indicators
  async findInseeIndicators(code?: string): Promise<EconomicIndicator[]> {
    if (code) {
      return memoryIndicators.filter((i) => i.indicatorCode === code);
    }
    return memoryIndicators;
  },

  async saveInseeIndicators(indicators: EconomicIndicator[]): Promise<void> {
    memoryIndicators = indicators;
  },

  // 4. Energy Observations (JODI Oil / SDES / EIA)
  async findEnergyObservations(metric?: string): Promise<EnergyObservation[]> {
    if (metric) {
      return memoryObservations.filter((o) => o.flowMetric === metric);
    }
    return memoryObservations;
  },

  async saveEnergyObservations(observations: EnergyObservation[]): Promise<void> {
    memoryObservations = observations;
  },

  // Seed memory caches
  setMemoryInfrastructures(infras: Infrastructure[]) {
    memoryInfrastructures = infras;
  },

  setMemoryRoutes(routes: TransportRoute[]) {
    memoryRoutes = routes;
  },
};
