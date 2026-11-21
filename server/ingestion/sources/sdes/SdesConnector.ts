import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SourceConnector, ConnectorHealth, IngestionResult } from '../types.ts';
import { EnergyObservation } from '../../../db/repository.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../../');

export class SdesConnector implements SourceConnector<EnergyObservation> {
  readonly id = 'sdes';
  readonly name = 'Service des Données et Études Statistiques (SDES)';
  readonly provider = 'Ministère de la Transition Écologique et de la Cohésion des Territoires';
  readonly type = 'file';
  readonly description = 'Source de référence envisagée : bilans énergétiques français du SDES. Extraction live non implémentée.';
  readonly officialUrl = 'https://www.statistiques.developpement-durable.gouv.fr';

  async fetchRaw(): Promise<any> { throw new Error("Live source extraction is not implemented; synthetic observations are disabled."); }

  async parse(rawCsv: string): Promise<EnergyObservation[]> {
    const lines = rawCsv.split('\n').filter((l) => l.trim().length > 0);
    const observations: EnergyObservation[] = [];

    // Header: ANNEE;CODE_PORT;NOM_PORT;VOLUME_RECEPTION_TONNES;OPERATEUR;SOURCE
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(';').map((c) => c.trim());
      if (cols.length < 5) continue;

      const year = cols[0];
      const portCode = cols[1];
      const volumeTonnes = parseFloat(cols[3]);

      if (isNaN(volumeTonnes) || volumeTonnes <= 0) continue;

      observations.push({
        id: `sdes_${portCode}_${year}`,
        countryId: 'FR',
        flowMetric: 'REFINERY_INTAKE',
        productId: 'crude_oil',
        period: year,
        volumeTonnes,
        sourceId: 'sdes',
        createdAt: new Date().toISOString(),
      });
    }

    return observations;
  }

  async normalize(records: EnergyObservation[]): Promise<EnergyObservation[]> {
    return records.sort((a, b) => b.period.localeCompare(a.period));
  }

  async validate(records: EnergyObservation[]): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    for (const r of records) {
      if (!r.volumeTonnes || r.volumeTonnes <= 0) {
        errors.push(`SDES record ${r.id} invalid volume.`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  async healthCheck(): Promise<ConnectorHealth> { return { reachable: false, latencyMs: 0, message: "Live extraction is not implemented; source was not queried.", lastCheckedAt: new Date().toISOString(), status: "NOT_AVAILABLE" }; }

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
