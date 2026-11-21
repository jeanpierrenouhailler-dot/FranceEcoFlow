import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { EconomicFlow } from '../../../src/types/index.ts';
import { loadDGDDIAnnualFile, loadDGDDIMonthlyFile } from './dgddiLoader.ts';
import { runDataQualityChecks } from './qualityChecker.ts';
import { IngestionAuditReport, IngestedFileMetadata } from './types.ts';
import { getDatasetProvenance, isDatasetVerified } from './provenance.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root is 3 levels up from server/data/ingestion
const projectRoot = path.resolve(__dirname, '../../..');

let cachedFlows: EconomicFlow[] | null = null;
let cachedAuditReport: IngestionAuditReport | null = null;
let cachedFilesMetadata: IngestedFileMetadata[] = [];

export function ingestAllCustomsData(): {
  flows: EconomicFlow[];
  report: IngestionAuditReport;
  files: IngestedFileMetadata[];
} {
  const startTime = Date.now();
  const annualCsvPath = path.resolve(projectRoot, 'data/raw/dgddi/dgddi_flux_brut_2015_2026_annuel.csv');
  const monthlyCsvPath = path.resolve(projectRoot, 'data/raw/dgddi/dgddi_flux_brut_mensuel_2024_2026.csv');
  const datasetPaths = [
    'data/raw/dgddi/dgddi_flux_brut_2015_2026_annuel.csv',
    'data/raw/dgddi/dgddi_flux_brut_mensuel_2024_2026.csv',
    'server/ingestion/raw/dgddi_dau_2015_2026.csv',
  ];
  const provenance = datasetPaths.map((filePath) => getDatasetProvenance(filePath));
  const files = provenance.map((record) => {
    const filePath = path.resolve(projectRoot, record.path);
    const stat = fs.existsSync(filePath) ? fs.statSync(filePath) : undefined;
    return {
      fileName: path.basename(filePath),
      filePath,
      fileSizeBytes: stat?.size ?? 0,
      sha256Hash: record.sha256,
      recordCount: 0,
      sourceProvider: `Unverified claim: ${record.source}`,
      provenanceStatus: record.status,
      provenanceReason: record.reason,
    };
  });

  if (provenance.some((record) => !isDatasetVerified(record.path))) {
    const durationMs = Date.now() - startTime;
    const failedCount = provenance.filter((record) => !isDatasetVerified(record.path)).length;
    const report: IngestionAuditReport = {
      jobId: `quarantine_${Date.now()}`,
      executedAt: new Date().toISOString(),
      durationMs,
      totalRecordsLoaded: 0,
      annualRecordsLoaded: 0,
      monthlyRecordsLoaded: 0,
      filesIngested: [],
      filesQuarantined: files,
      checks: [{
        checkId: 'CHECK_DATASET_PROVENANCE',
        name: 'Authentification de la provenance des fichiers',
        description: 'Les fichiers non authentifiés restent en quarantaine et ne sont pas utilisés comme données métier.',
        status: 'FAILED',
        recordsTested: provenance.length,
        passedCount: provenance.length - failedCount,
        failedCount,
        details: provenance.filter((record) => !isDatasetVerified(record.path)).map((record) => `${record.path}: ${record.reason}`).join(' '),
      }],
      overallStatus: 'FAILED',
    };
    cachedFlows = [];
    cachedAuditReport = report;
    cachedFilesMetadata = files;
    return { flows: [], report, files };
  }

  const annualRes = loadDGDDIAnnualFile(annualCsvPath);
  const monthlyRes = fs.existsSync(monthlyCsvPath) ? loadDGDDIMonthlyFile(monthlyCsvPath) : null;
  const allFlows = [...annualRes.flows, ...(monthlyRes?.flows ?? [])];
  const durationMs = Date.now() - startTime;
  const report = runDataQualityChecks(allFlows, [annualRes.metadata, ...(monthlyRes ? [monthlyRes.metadata] : [])], durationMs);

  cachedFlows = allFlows;
  cachedAuditReport = report;
  cachedFilesMetadata = files;

  return {
    flows: allFlows,
    report,
    files,
  };
}

export function getIngestedFlows(): EconomicFlow[] {
  if (!cachedFlows) {
    ingestAllCustomsData();
  }
  return cachedFlows!;
}

export function getAuditReport(): IngestionAuditReport {
  if (!cachedAuditReport) {
    ingestAllCustomsData();
  }
  return cachedAuditReport!;
}

export function getIngestedFiles(): IngestedFileMetadata[] {
  if (cachedFilesMetadata.length === 0) {
    ingestAllCustomsData();
  }
  return cachedFilesMetadata;
}
