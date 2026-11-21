import { executeQuery } from './connection.ts';
import { Infrastructure, TransportRoute } from '../../src/types/index.ts';

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

function mapInfrastructureRow(row: any): SpatialInfrastructureResult {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    countryId: row.country_id,
    operator: row.operator,
    coordinates: [Number(row.longitude), Number(row.latitude)],
    capacityAnnualTonnes: row.capacity_annual_tonnes == null ? undefined : Number(row.capacity_annual_tonnes),
    currentStatus: row.current_status,
    osmId: row.osm_id || undefined,
    confidence: row.confidence,
    sourceId: row.source_id,
    descriptionFr: row.description_fr,
    distanceKm: row.distance_km == null ? undefined : Math.round(Number(row.distance_km) * 10) / 10,
    geometryGeoJson: row.geometry_geojson ? JSON.parse(row.geometry_geojson) : undefined,
  };
}

export const dbRepository = {
  async findInfrastructuresWithinRadius(
    centerLng: number,
    centerLat: number,
    radiusKm: number
  ): Promise<SpatialInfrastructureResult[]> {
    const result = await executeQuery(
      `SELECT id, name, type, country_id, operator, capacity_annual_tonnes, current_status,
              osm_id, confidence, source_id, description_fr, ST_AsGeoJSON(geom) AS geometry_geojson,
              ST_X(ST_PointOnSurface(geom)) AS longitude,
              ST_Y(ST_PointOnSurface(geom)) AS latitude,
              ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000.0 AS distance_km
       FROM infrastructures
       WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3 * 1000)
       ORDER BY distance_km ASC;`,
      [centerLng, centerLat, radiusKm]
    );

    return result.rows.map(mapInfrastructureRow);
  },

  async findInfrastructures(type?: string): Promise<SpatialInfrastructureResult[]> {
    const result = await executeQuery(
      `SELECT id, name, type, country_id, operator, capacity_annual_tonnes, current_status,
              osm_id, confidence, source_id, description_fr, ST_AsGeoJSON(geom) AS geometry_geojson,
              ST_X(ST_PointOnSurface(geom)) AS longitude,
              ST_Y(ST_PointOnSurface(geom)) AS latitude
       FROM infrastructures${type ? ' WHERE type = $1' : ''}
       ORDER BY name;`,
      type ? [type] : undefined
    );
    return result.rows.map(mapInfrastructureRow);
  },

  async findInfrastructureById(id: string): Promise<SpatialInfrastructureResult | undefined> {
    const result = await executeQuery(
      `SELECT id, name, type, country_id, operator, capacity_annual_tonnes, current_status,
              osm_id, confidence, source_id, description_fr, ST_AsGeoJSON(geom) AS geometry_geojson,
              ST_X(ST_PointOnSurface(geom)) AS longitude,
              ST_Y(ST_PointOnSurface(geom)) AS latitude
       FROM infrastructures WHERE id = $1;`,
      [id]
    );
    return result.rows[0] ? mapInfrastructureRow(result.rows[0]) : undefined;
  },

  async findTransportRoutes(): Promise<TransportRoute[]> {
    const result = await executeQuery(
      `SELECT id, source_partner_id, destination_reporter_id, product_id, mode,
              ST_AsGeoJSON(geom) AS geom_geojson, distance_km, confidence, evidence, source_id
       FROM transport_routes;`
    );
    return result.rows.map((row: any) => ({
      id: row.id,
      sourcePartnerId: row.source_partner_id,
      destinationReporterId: row.destination_reporter_id,
      productId: row.product_id,
      mode: row.mode,
      waypoints: row.geom_geojson ? JSON.parse(row.geom_geojson).coordinates : [],
      confidence: row.confidence,
      evidence: row.evidence,
      sourceId: row.source_id,
    }));
  },

  async findInseeIndicators(code?: string): Promise<EconomicIndicator[]> {
    const result = await executeQuery(
      `SELECT id, indicator_code, provider, period, value, unit, label_fr, series_id, retrieved_at
       FROM economic_indicators${code ? ' WHERE indicator_code = $1' : ''}
       ORDER BY period DESC;`,
      code ? [code] : undefined
    );
    return result.rows.map((row: any) => ({
      id: row.id,
      indicatorCode: row.indicator_code,
      provider: row.provider,
      period: row.period,
      value: Number(row.value),
      unit: row.unit,
      labelFr: row.label_fr,
      seriesId: row.series_id || undefined,
      retrievedAt: new Date(row.retrieved_at).toISOString(),
    }));
  },

  async saveInseeIndicators(indicators: EconomicIndicator[]): Promise<void> {
    for (const indicator of indicators) {
      await executeQuery(
        `INSERT INTO economic_indicators
           (id, indicator_code, provider, period, value, unit, label_fr, series_id, retrieved_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           value = EXCLUDED.value, unit = EXCLUDED.unit, label_fr = EXCLUDED.label_fr,
           series_id = EXCLUDED.series_id, retrieved_at = EXCLUDED.retrieved_at;`,
        [
          indicator.id,
          indicator.indicatorCode,
          indicator.provider,
          indicator.period,
          indicator.value,
          indicator.unit,
          indicator.labelFr,
          indicator.seriesId ?? null,
          indicator.retrievedAt,
        ]
      );
    }
  },

  async findEnergyObservations(metric?: string): Promise<EnergyObservation[]> {
    const result = await executeQuery(
      `SELECT id, country_id, flow_metric, product_id, period, volume_kboed, volume_tonnes,
              stock_days_net_imports, source_id, created_at
       FROM energy_observations${metric ? ' WHERE flow_metric = $1' : ''}
       ORDER BY period DESC;`,
      metric ? [metric] : undefined
    );
    return result.rows.map((row: any) => ({
      id: row.id,
      countryId: row.country_id,
      flowMetric: row.flow_metric,
      productId: row.product_id,
      period: row.period,
      volumeKboed: row.volume_kboed === null ? undefined : Number(row.volume_kboed),
      volumeTonnes: row.volume_tonnes === null ? undefined : Number(row.volume_tonnes),
      stockDaysNetImports:
        row.stock_days_net_imports === null ? undefined : Number(row.stock_days_net_imports),
      sourceId: row.source_id,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  },

  async saveEnergyObservations(observations: EnergyObservation[]): Promise<void> {
    for (const observation of observations) {
      await executeQuery(
        `INSERT INTO energy_observations
           (id, country_id, flow_metric, product_id, period, volume_kboed, volume_tonnes,
            stock_days_net_imports, source_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           volume_kboed = EXCLUDED.volume_kboed, volume_tonnes = EXCLUDED.volume_tonnes,
           stock_days_net_imports = EXCLUDED.stock_days_net_imports, created_at = EXCLUDED.created_at;`,
        [
          observation.id,
          observation.countryId,
          observation.flowMetric,
          observation.productId,
          observation.period,
          observation.volumeKboed ?? null,
          observation.volumeTonnes ?? null,
          observation.stockDaysNetImports ?? null,
          observation.sourceId,
          observation.createdAt,
        ]
      );
    }
  },
};
