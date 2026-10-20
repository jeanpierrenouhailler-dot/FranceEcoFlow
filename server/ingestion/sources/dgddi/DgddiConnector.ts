import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SourceConnector, ConnectorHealth, IngestionResult } from '../types.ts';
import { EconomicFlow } from '../../../../src/types/index.ts';
import { importRawDGDDIFile } from '../../dgddi/rawImporter.ts';
import { normalizeDGDDIRows } from '../../../normalization/dgddiNormalizer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../../');

export class DgddiConnector implements SourceConnector<EconomicFlow> {
  readonly id = 'dgddi';
  readonly name = 'Direction Générale des Douanes et Droits Indirects';
  readonly provider = 'Douanes Françaises (Ministère de l’Économie et des Finances)';
  readonly type = 'file';
  readonly description = 'Statistiques officielles du commerce extérieur de la France (DAU / Single Administrative Document, code NC8 27090090 et 27090010).';
  readonly officialUrl = 'https://lekiosque.finances.gouv.fr';

  async fetchRaw(): Promise<any> {
    return importRawDGDDIFile();
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
    const start = Date.now();
    const csvPath = path.resolve(projectRoot, 'server/ingestion/raw/dgddi_dau_2015_2026.csv');
    const exists = fs.existsSync(csvPath);
    return {
      reachable: exists,
      latencyMs: Date.now() - start,
      message: exists
        ? 'Registre brut DAU DGDDI accessible sur disque (codes NC8 27090090 et 27090010 conservés).'
        : 'Fichier brut DAU introuvable.',
      lastCheckedAt: new Date().toISOString(),
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
