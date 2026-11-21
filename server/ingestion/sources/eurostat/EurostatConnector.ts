import { SourceConnector, ConnectorHealth, IngestionResult } from '../types.ts';
import { EconomicFlow } from '../../../../src/types/index.ts';

export class EurostatConnector implements SourceConnector<EconomicFlow> {
  readonly id = 'eurostat';
  readonly name = 'Eurostat (Commission Européenne)';
  readonly provider = 'Eurostat — Directorate-General of the European Commission';
  readonly type = 'sdmx';
  readonly description = 'Source de référence envisagée : statistiques européennes du commerce et de l’énergie. Extraction live non implémentée.';
  readonly officialUrl = 'https://ec.europa.eu/eurostat';

  async fetchRaw(): Promise<any> { throw new Error("Live source extraction is not implemented; synthetic observations are disabled."); }

  async parse(raw: any): Promise<EconomicFlow[]> {
    const flows: EconomicFlow[] = [];

    for (const obs of raw.observations) {
      const quantityTonnes = obs.tonnesThousand * 1000;
      const valueEur = obs.valueEurMillion * 1000000;
      const implicitPriceEurPerTonne = Math.round((valueEur / quantityTonnes) * 100) / 100;

      flows.push({
        id: `eurostat_FR_${obs.partner}_${obs.year}`,
        reporterCountryId: 'FR',
        partnerCountryId: obs.partner,
        productId: 'crude_oil',
        periodYear: obs.year,
        flowType: 'import',
        valueEur,
        quantityTonnes,
        implicitPriceEurPerTonne,
        confidence: 'CONFIRMED',
        sourceId: this.id,
        datasetId: 'eurostat_nrg_ti_oil',
      });
    }

    return flows;
  }

  async normalize(records: EconomicFlow[]): Promise<EconomicFlow[]> {
    return records.sort((a, b) => b.quantityTonnes - a.quantityTonnes);
  }

  async validate(records: EconomicFlow[]): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    for (const r of records) {
      if (r.valueEur <= 0 || r.quantityTonnes <= 0) {
        errors.push(`Eurostat record ${r.id} has invalid non-positive volume or value.`);
      }
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
