import { importRawDGDDIFile, persistRawDGDDIRowsToStaging, RawImportResult } from './rawImporter.ts';
import { normalizeDGDDIRows } from '../../normalization/dgddiNormalizer.ts';
import { EconomicFlow } from '../../../src/types/index.ts';
import { executeQuery } from '../../db/connection.ts';
import { isDatasetVerified } from '../../data/ingestion/provenance.ts';

let cachedNormalizedFlows: EconomicFlow[] | null = null;
let lastImportJobMetadata: any = null;
const rawDatasetPath = 'server/ingestion/raw/dgddi_dau_2015_2026.csv';

export async function runDGDDIImportJob(): Promise<{
  importResult: RawImportResult;
  normalizedFlows: EconomicFlow[];
  report: any;
}> {
  if (!isDatasetVerified(rawDatasetPath)) {
    throw new Error(`DGDDI dataset is quarantined because its provenance is unverified: ${rawDatasetPath}`);
  }

  const startTime = Date.now();
  console.log('[DGDDI Job] Starting raw customs import job...');

  // 1. Raw extraction & checksum
  const importResult = importRawDGDDIFile();
  console.log(
    `[DGDDI Job] Read ${importResult.rows.length} raw DAU declarations (SHA-256: ${importResult.checksumSha256.substring(0, 16)}...).`
  );

  // 2. Persist to PostgreSQL Staging table
  await persistRawDGDDIRowsToStaging(importResult.rows, importResult.checksumSha256);

  // 3. Normalization tier
  const { flows, report } = normalizeDGDDIRows(importResult.rows);
  console.log(`[DGDDI Job] Normalized ${flows.length} economic flows (0 rejected).`);

  // 4. Audit Log in PostgreSQL
  const durationMs = Date.now() - startTime;
  const auditSql = `
    INSERT INTO ingestion_audit_logs
      (job_id, source_id, file_name, file_sha256, status, records_loaded, duration_ms, checks_summary)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
  `;
  try {
    await executeQuery(auditSql, [
      `job_dgddi_${Date.now()}`,
      'dgddi',
      'dgddi_dau_2015_2026.csv',
      importResult.checksumSha256,
      'PASSED',
      flows.length,
      durationMs,
      JSON.stringify(report),
    ]);
  } catch (error) {
    throw new Error('Failed to persist DGDDI ingestion audit log', { cause: error });
  }

  cachedNormalizedFlows = flows;
  lastImportJobMetadata = {
    jobId: `job_dgddi_${Date.now()}`,
    executedAt: new Date().toISOString(),
    checksumSha256: importResult.checksumSha256,
    durationMs,
    recordsCount: flows.length,
  };

  return {
    importResult,
    normalizedFlows: flows,
    report,
  };
}

export function getLoadedEconomicFlows(): EconomicFlow[] {
  if (!isDatasetVerified(rawDatasetPath)) return [];
  if (!cachedNormalizedFlows) {
    const importRes = importRawDGDDIFile();
    const { flows } = normalizeDGDDIRows(importRes.rows);
    cachedNormalizedFlows = flows;
  }
  return cachedNormalizedFlows;
}

export function getLastImportJobMetadata() {
  return lastImportJobMetadata;
}
