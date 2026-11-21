import { SourceConnector, ConnectorHealth, IngestionResult } from '../types.ts';
import { EconomicIndicator } from '../../../db/repository.ts';

export class InseeConnector implements SourceConnector<EconomicIndicator> {
  readonly id = 'insee';
  readonly name = 'Institut National de la Statistique et des Études Économiques (INSEE)';
  readonly provider = 'INSEE';
  readonly type = 'api';
  readonly description = 'Source de référence envisagée : séries macroéconomiques et industrielles de l’INSEE. Extraction live non implémentée.';
  readonly officialUrl = 'https://www.insee.fr';

  async fetchRaw(): Promise<any> { throw new Error("Live source extraction is not implemented; synthetic observations are disabled."); }

  async parse(raw: any[]): Promise<EconomicIndicator[]> {
    const indicators: EconomicIndicator[] = [];

    for (const serie of raw) {
      for (const obs of serie.observations) {
        indicators.push({
          id: `insee_${serie.indicatorCode}_${obs.period}`,
          indicatorCode: serie.indicatorCode,
          provider: 'INSEE',
          period: obs.period,
          value: obs.value,
          unit: serie.unit,
          labelFr: serie.labelFr,
          seriesId: serie.seriesId,
          retrievedAt: new Date().toISOString(),
        });
      }
    }

    return indicators;
  }

  async normalize(records: EconomicIndicator[]): Promise<EconomicIndicator[]> {
    return records.sort((a, b) => b.period.localeCompare(a.period));
  }

  async validate(records: EconomicIndicator[]): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    for (const r of records) {
      if (isNaN(r.value)) errors.push(`Indicator ${r.id} has NaN value.`);
      if (!r.period) errors.push(`Indicator ${r.id} is missing period.`);
    }
    return { valid: errors.length === 0, errors };
  }

  async healthCheck(): Promise<ConnectorHealth> { return { reachable: false, latencyMs: 0, message: "Live extraction is not implemented; source was not queried.", lastCheckedAt: new Date().toISOString(), status: "NOT_AVAILABLE" }; }

  async run(): Promise<IngestionResult<EconomicIndicator>> {
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
