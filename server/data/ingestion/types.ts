import { EconomicFlow, ConfidenceLevel } from '../../../src/types/index.ts';

export interface RawCustomsRecord {
  year: number;
  month?: number;
  flowType: 'import' | 'export';
  reporterCountryId: string;
  partnerCountryId: string;
  productCode: string;
  valueCafEur: number;
  netMassKg: number;
  source: string;
}

export interface IngestedFileMetadata {
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  sha256Hash: string;
  recordCount: number;
  ingestedAt: string;
  sourceProvider: string;
}

export interface QualityCheckResult {
  checkId: string;
  name: string;
  description: string;
  status: 'PASSED' | 'WARNING' | 'FAILED';
  recordsTested: number;
  passedCount: number;
  failedCount: number;
  details?: string;
}

export interface IngestionAuditReport {
  jobId: string;
  executedAt: string;
  durationMs: number;
  totalRecordsLoaded: number;
  annualRecordsLoaded: number;
  monthlyRecordsLoaded: number;
  filesIngested: IngestedFileMetadata[];
  checks: QualityCheckResult[];
  overallStatus: 'PASSED' | 'WARNING' | 'FAILED';
}
