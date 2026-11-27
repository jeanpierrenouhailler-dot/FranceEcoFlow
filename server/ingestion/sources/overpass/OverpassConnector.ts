import { SourceConnector, ConnectorHealth, IngestionResult } from '../types.ts';
import { Infrastructure } from '../../../../src/types/index.ts';

export class OverpassConnector implements SourceConnector<Infrastructure> {
  readonly id = 'osm';
  readonly name = 'OpenStreetMap & Overpass API';
  readonly provider = 'OpenStreetMap Foundation & Contributors';
  readonly type = 'overpass';
  readonly description =
    'Source géographique de référence envisagée : infrastructures énergétiques OpenStreetMap. Extraction live non implémentée.';
  readonly officialUrl = 'https://overpass-api.de';

  // Geographic Bounding Box for Metropolitan France & Logistics Corridors
  private readonly BBOX = '41.0, -5.5, 51.5, 9.5';

  buildOverpassQuery(): string {
    return `
      [out:json][timeout:25];
      (
        node["harbour"="oil_terminal"](${this.BBOX});
        way["industrial"="refinery"](${this.BBOX});
        relation["man_made"="pipeline"]["substance"~"oil|petroleum"](${this.BBOX});
      );
      out body;
      >;
      out skel qt;
    `.trim();
  }

  async fetchRaw(): Promise<any> {
    throw new Error(
      'Live source extraction is not implemented; synthetic observations are disabled.',
    );
  }

  async parse(_raw: any): Promise<Infrastructure[]> {
    throw new Error(
      'Overpass response parsing is not implemented; no infrastructure is published.',
    );
  }

  async normalize(records: Infrastructure[]): Promise<Infrastructure[]> {
    return records.sort((a, b) => (b.capacityAnnualTonnes ?? 0) - (a.capacityAnnualTonnes ?? 0));
  }

  async validate(records: Infrastructure[]): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    for (const r of records) {
      if (!r.coordinates || r.coordinates.length !== 2) {
        errors.push(`Infrastructure ${r.id} missing valid [lon, lat] coordinates.`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  async healthCheck(): Promise<ConnectorHealth> {
    return {
      reachable: false,
      latencyMs: 0,
      message: 'Live extraction is not implemented; source was not queried.',
      lastCheckedAt: new Date().toISOString(),
      status: 'NOT_AVAILABLE',
    };
  }

  async run(): Promise<IngestionResult<Infrastructure>> {
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
