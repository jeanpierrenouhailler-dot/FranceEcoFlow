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
  readonly description = 'Source géographique de référence envisagée : services cartographiques IGN. Extraction live non implémentée.';
  readonly officialUrl = 'https://geoservices.ign.fr';

  async fetchRaw(): Promise<any> { throw new Error("Live source extraction is not implemented; synthetic observations are disabled."); }

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

  async healthCheck(): Promise<ConnectorHealth> { return { reachable: false, latencyMs: 0, message: "Live extraction is not implemented; source was not queried.", lastCheckedAt: new Date().toISOString(), status: "NOT_AVAILABLE" }; }

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
