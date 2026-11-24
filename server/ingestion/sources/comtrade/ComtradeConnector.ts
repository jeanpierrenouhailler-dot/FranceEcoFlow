import { SourceConnector, ConnectorHealth, IngestionResult } from '../types.ts';
import { EconomicFlow } from '../../../../src/types/index.ts';

interface ComtradeCacheEntry {
  timestamp: number;
  data: any;
}

export class ComtradeConnector implements SourceConnector<EconomicFlow> {
  readonly id = 'comtrade';
  readonly name = 'United Nations Comtrade Database';
  readonly provider = 'United Nations Statistics Division (UNSD)';
  readonly type = 'api';
  readonly description = 'Source de référence envisagée : commerce mondial de marchandises. Extraction live non implémentée.';
  readonly officialUrl = 'https://comtradeplus.un.org';

  private cache: Map<string, ComtradeCacheEntry> = new Map();
  private readonly CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour cache
  private apiKey: string | undefined = process.env.COMTRADE_API_KEY;

  async fetchRaw(): Promise<any> { throw new Error("Live source extraction is not implemented; synthetic observations are disabled."); }

  async parse(raw: any): Promise<EconomicFlow[]> {
    const flows: EconomicFlow[] = [];

    for (const item of raw.data) {
      const quantityTonnes = Math.round((item.netWgt / 1000) * 1000) / 1000;
      const implicitPriceEurPerTonne = Math.round((item.primaryValue / quantityTonnes) * 100) / 100;

      flows.push({
        id: `comtrade_FR_${item.partner2Code}_${item.period}`,
        reporterCountryId: 'FR',
        partnerCountryId: item.partner2Code,
        productId: 'crude_oil',
        periodYear: item.period,
        flowType: 'import',
        valueEur: item.primaryValue,
        quantityTonnes,
        implicitPriceEurPerTonne,
        confidence: 'UNKNOWN',
        sourceId: this.id,
        datasetId: 'un_comtrade_v1',
      });
    }

    return flows;
  }

  async normalize(records: EconomicFlow[]): Promise<EconomicFlow[]> {
    return records.sort((a, b) => b.valueEur - a.valueEur);
  }

  async validate(records: EconomicFlow[]): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    for (const r of records) {
      if (r.valueEur <= 0) errors.push(`UN Comtrade record ${r.id} invalid value.`);
      if (r.quantityTonnes <= 0) errors.push(`UN Comtrade record ${r.id} invalid mass.`);
    }
    return { valid: errors.length === 0, errors };
  }

  async healthCheck(): Promise<ConnectorHealth> { return { reachable: false, latencyMs: 0, message: "Live extraction is not implemented; source was not queried.", lastCheckedAt: new Date().toISOString(), status: "NOT_AVAILABLE" }; }

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
