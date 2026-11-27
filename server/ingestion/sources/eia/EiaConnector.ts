import { SourceConnector, ConnectorHealth, IngestionResult } from '../types.ts';
import { EconomicFlow } from '../../../../src/types/index.ts';

export class EiaConnector implements SourceConnector<EconomicFlow> {
  readonly id = 'eia';
  readonly name = 'U.S. Energy Information Administration (EIA)';
  readonly provider = 'U.S. Department of Energy (DOE)';
  readonly type = 'api';
  readonly description =
    'Source de référence envisagée : statistiques énergétiques américaines. Extraction live et valorisation en euros non implémentées.';
  readonly officialUrl = 'https://www.eia.gov';

  private apiKey: string | undefined = process.env.EIA_API_KEY;

  async fetchRaw(): Promise<any> {
    throw new Error(
      'Live source extraction is not implemented; synthetic observations are disabled.',
    );
  }

  async parse(_raw: any): Promise<EconomicFlow[]> {
    throw new Error('EIA response valuation is not implemented; no EUR values are inferred.');
  }

  async normalize(records: EconomicFlow[]): Promise<EconomicFlow[]> {
    return records.sort((a, b) => b.periodYear - a.periodYear);
  }

  async validate(records: EconomicFlow[]): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    for (const r of records) {
      if (r.quantityTonnes <= 0) errors.push(`EIA record ${r.id} has invalid non-positive mass.`);
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

  async run(): Promise<IngestionResult<EconomicFlow>> {
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
