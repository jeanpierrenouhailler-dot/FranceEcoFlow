import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../..');

export type ProvenanceStatus = 'VERIFIED' | 'UNVERIFIED' | 'QUARANTINED';

export interface DatasetProvenance {
  id: string;
  path: string;
  source: string;
  officialUrl: string | null;
  datasetName: string | null;
  publishedAt: string | null;
  extractedAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  license: string | null;
  version: string | null;
  sha256: string;
  status: ProvenanceStatus;
  reason?: string;
  hashMatches: boolean;
}

interface ProvenanceRegistry {
  datasets: Omit<DatasetProvenance, 'hashMatches'>[];
}

export function getDatasetProvenance(relativePath: string): DatasetProvenance {
  const registryPath = path.resolve(projectRoot, 'data/provenance.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8')) as ProvenanceRegistry;
  const record = registry.datasets.find((dataset) => dataset.path === relativePath);
  if (!record) {
    throw new Error(`No provenance record exists for dataset: ${relativePath}`);
  }

  const absolutePath = path.resolve(projectRoot, relativePath);
  const hashMatches =
    fs.existsSync(absolutePath) &&
    crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex') === record.sha256;

  return {
    ...record,
    status: hashMatches ? record.status : 'QUARANTINED',
    reason: hashMatches ? record.reason : 'File is missing or its SHA-256 hash differs from the provenance registry.',
    hashMatches,
  };
}

export function isDatasetVerified(relativePath: string): boolean {
  const provenance = getDatasetProvenance(relativePath);
  return provenance.status === 'VERIFIED' && provenance.hashMatches;
}
