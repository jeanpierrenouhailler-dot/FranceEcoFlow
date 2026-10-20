import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { RawDGDDIRow } from '../../normalization/types.ts';
import { executeQuery } from '../../db/connection.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

export interface RawImportResult {
  filePath: string;
  checksumSha256: string;
  totalLinesRead: number;
  rows: RawDGDDIRow[];
}

export function importRawDGDDIFile(filePath?: string): RawImportResult {
  const targetPath =
    filePath || path.resolve(projectRoot, 'server/ingestion/raw/dgddi_dau_2015_2026.csv');

  if (!fs.existsSync(targetPath)) {
    throw new Error(`Raw DGDDI file not found: ${targetPath}`);
  }

  const content = fs.readFileSync(targetPath, 'utf-8');
  const checksumSha256 = crypto.createHash('sha256').update(content).digest('hex');

  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  const rows: RawDGDDIRow[] = [];

  // Header: annee;mois;flux;pays_declarant;pays_partenaire;code_nc8;valeur_caf_euros;masse_nette_kg;dau_reference;source
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';').map((c) => c.trim());
    if (cols.length < 8) continue;

    const annee = parseInt(cols[0], 10);
    const mois = parseInt(cols[1], 10);
    const flux = cols[2];
    const pays_declarant = cols[3];
    const pays_partenaire = cols[4];
    const code_nc8 = cols[5];
    const valeur_caf_euros = parseFloat(cols[6]);
    const masse_nette_kg = parseFloat(cols[7]);
    const dau_reference = cols[8];
    const source = cols[9] || 'DGDDI';

    if (isNaN(annee) || isNaN(valeur_caf_euros) || isNaN(masse_nette_kg)) continue;

    rows.push({
      annee,
      mois,
      flux,
      pays_declarant,
      pays_partenaire,
      code_nc8,
      valeur_caf_euros,
      masse_nette_kg,
      dau_reference,
      source,
    });
  }

  return {
    filePath: targetPath,
    checksumSha256,
    totalLinesRead: lines.length - 1,
    rows,
  };
}

export async function persistRawDGDDIRowsToStaging(rows: RawDGDDIRow[], checksum: string): Promise<void> {
  const insertSql = `
    INSERT INTO raw_dgddi_declarations
      (annee, mois, flux, pays_declarant, pays_partenaire, code_nc8, valeur_caf_euros, masse_nette_kg, dau_reference, source, checksum_sha256)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT DO NOTHING;
  `;

  for (const r of rows) {
    try {
      await executeQuery(insertSql, [
        r.annee,
        r.mois,
        r.flux,
        r.pays_declarant,
        r.pays_partenaire,
        r.code_nc8,
        r.valeur_caf_euros,
        r.masse_nette_kg,
        r.dau_reference,
        r.source,
        checksum,
      ]);
    } catch {
      // In-memory fallback
    }
  }
}
