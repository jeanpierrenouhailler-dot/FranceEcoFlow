import path from 'path';
import { fileURLToPath } from 'url';
import { SourceConnector, ConnectorHealth, IngestionResult } from '../types.ts';
import { EconomicFlow } from '../../../../src/types/index.ts';
import { normalizeDGDDIRows } from '../../../normalization/dgddiNormalizer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const _projectRoot = path.resolve(__dirname, '../../../../');

export class DgddiConnector implements SourceConnector<EconomicFlow> {
  readonly id = 'dgddi';
  readonly name = 'Direction Générale des Douanes et Droits Indirects';
  readonly provider = 'Douanes Françaises (Ministère de l’Économie et des Finances)';
  readonly type = 'file';
  readonly description =
    'Source de référence envisagée : statistiques douanières françaises. Extraction live non implémentée ; fichiers historiques en quarantaine.';
  readonly officialUrl = 'https://lekiosque.finances.gouv.fr';

  async fetchRaw(): Promise<any> {
    throw new Error(
      'Live source extraction is not implemented; synthetic observations are disabled.',
    );
  }

  async parse(rawResult: any): Promise<EconomicFlow[]> {
    const { flows } = normalizeDGDDIRows(rawResult.rows);
    return flows;
  }

  async normalize(records: EconomicFlow[]): Promise<EconomicFlow[]> {
    return records.sort((a, b) => b.periodYear - a.periodYear || b.valueEur - a.valueEur);
  }

  async validate(records: EconomicFlow[]): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    for (const r of records) {
      if (r.valueEur <= 0) errors.push(`Record ${r.id} has invalid non-positive value.`);
      if (r.quantityTonnes <= 0) errors.push(`Record ${r.id} has invalid non-positive mass.`);
      if (isNaN(r.implicitPriceEurPerTonne)) errors.push(`Record ${r.id} has NaN implicit price.`);
      if (!r.rawNcCode) errors.push(`Record ${r.id} is missing preserved raw NC8 code.`);
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
