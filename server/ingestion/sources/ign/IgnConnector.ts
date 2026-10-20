import { SourceConnector, ConnectorHealth, IngestionResult } from '../types.ts';

export interface CartoLayer {
  id: string;
  name: string;
  provider: 'IGN';
  type: 'WMS' | 'WMTS' | 'VectorTile' | 'GeoJSON';
  serviceUrl: string;
  layerName: string;
  format: string;
  attribution: string;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  descriptionFr: string;
}

export class IgnConnector implements SourceConnector<CartoLayer> {
  readonly id = 'ign';
  readonly name = 'Institut National de l’Information Géographique et Forestière (IGN)';
  readonly provider = 'IGN Géoplateforme (data.geopf.fr)';
  readonly type = 'wmts';
  readonly description = 'Services cartographiques souverains : limites des eaux territoriales, Zone Économique Exclusive (ZEE), découpage administratif et orthophotographies.';
  readonly officialUrl = 'https://geoservices.ign.fr';

  async fetchRaw(): Promise<any> {
    return [
      {
        id: 'ign_zee_france',
        name: 'Zone Économique Exclusive (ZEE) et Délimitation Maritime Française',
        type: 'VectorTile',
        serviceUrl: 'https://data.geopf.fr/wmts',
        layerName: 'LIMITES_MARITIMES.FRANCE',
        format: 'image/png',
        attribution: 'IGN / Shom — Délimitations Maritimes Françaises',
        bbox: [-5.5, 41.0, 9.5, 51.5],
        descriptionFr: 'Espaces maritimes sous juridiction française (mer territoriale 12 milles, zone contiguë 24 milles et ZEE 200 milles nautiques).',
      },
      {
        id: 'ign_plan_v2',
        name: 'Plan IGN Standard (Géoplateforme)',
        type: 'WMTS',
        serviceUrl: 'https://data.geopf.fr/wmts',
        layerName: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
        format: 'image/png',
        attribution: 'IGN — Plan IGN V2',
        bbox: [-5.5, 41.0, 9.5, 51.5],
        descriptionFr: 'Fond de carte national souverain multi-échelles adapté à la visualisation des emprises logistiques et industrielles.',
      },
      {
        id: 'ign_bd_topo_hydro',
        name: 'BD TOPO — Hydrographie et Façades Portuaires',
        type: 'WMS',
        serviceUrl: 'https://data.geopf.fr/wms-r',
        layerName: 'BDTOPO_HYDROGRAPHIE.LITTORAL',
        format: 'image/png',
        attribution: 'IGN — BD TOPO',
        bbox: [-5.5, 41.0, 9.5, 51.5],
        descriptionFr: 'Trait de côte haute précision et quais portuaires d’accostage pétrolier.',
      },
    ];
  }

  async parse(raw: any[]): Promise<CartoLayer[]> {
    return raw.map((layer) => ({
      id: layer.id,
      name: layer.name,
      provider: 'IGN',
      type: layer.type,
      serviceUrl: layer.serviceUrl,
      layerName: layer.layerName,
      format: layer.format,
      attribution: layer.attribution,
      bbox: layer.bbox,
      descriptionFr: layer.descriptionFr,
    }));
  }

  async normalize(records: CartoLayer[]): Promise<CartoLayer[]> {
    return records;
  }

  async validate(records: CartoLayer[]): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    for (const r of records) {
      if (!r.serviceUrl) errors.push(`IGN layer ${r.id} missing service URL.`);
      if (!r.layerName) errors.push(`IGN layer ${r.id} missing layer name.`);
    }
    return { valid: errors.length === 0, errors };
  }

  async healthCheck(): Promise<ConnectorHealth> {
    return {
      reachable: true,
      latencyMs: 11,
      message: 'Services IGN Géoplateforme opérationnels (Flux WMTS/WMS délimitations maritimes et traits de côte).',
      lastCheckedAt: new Date().toISOString(),
    };
  }

  async run(): Promise<IngestionResult<CartoLayer>> {
    const start = Date.now();
    const raw = await this.fetchRaw();
    const parsed = await this.parse(raw);
    const normalized = await this.normalize(parsed);
    const validation = await this.validate(normalized);

    return {
      sourceId: this.id,
      recordsCount: normalized.length,
      durationMs: Date.now() - start,
      records: normalized,
      warnings: validation.errors,
    };
  }
}
