import { SourceConnector, ConnectorHealth, IngestionResult } from '../types.ts';
import { EnergyObservation } from '../../../db/repository.ts';

export class JodiConnector implements SourceConnector<EnergyObservation> {
  readonly id = 'jodi';
  readonly name = 'Joint Organisations Data Initiative (JODI Oil World Database)';
  readonly provider = 'IEF / IEA / OPEC / Eurostat / OLADE / APEC / UNSD / GECF';
  readonly type = 'file';
  readonly description =
    'Source de référence envisagée : statistiques mondiales du pétrole JODI. Extraction live non implémentée.';
  readonly officialUrl = 'https://www.jodidata.org';

  async fetchRaw(): Promise<any> {
    throw new Error(
      'Live source extraction is not implemented; synthetic observations are disabled.',
    );
  }

  async parse(raw: any[]): Promise<EnergyObservation[]> {
    return raw.map((item, idx) => ({
      id: `jodi_FRA_${item.metric}_${item.period}_${idx}`,
      countryId: 'FR',
      flowMetric: item.metric,
      productId: 'crude_oil',
      period: item.period,
      volumeKboed: item.volumeKboed,
      volumeTonnes: item.volumeTonnes,
      stockDaysNetImports: item.stockDaysNetImports,
      sourceId: 'jodi',
      createdAt: new Date().toISOString(),
    }));
  }

  async normalize(records: EnergyObservation[]): Promise<EnergyObservation[]> {
    return records.sort((a, b) => b.period.localeCompare(a.period));
  }

  async validate(records: EnergyObservation[]): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    for (const r of records) {
      if (r.volumeTonnes && r.volumeTonnes <= 0) {
        errors.push(`JODI record ${r.id} has invalid non-positive volume.`);
      }
      if (r.stockDaysNetImports && r.stockDaysNetImports < 0) {
        errors.push(`JODI record ${r.id} has invalid negative stock days.`);
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

  async run(): Promise<IngestionResult<EnergyObservation>> {
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
