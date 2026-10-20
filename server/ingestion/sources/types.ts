import { EconomicFlow } from '../../../src/types/index.ts';
import { EconomicIndicator, EnergyObservation } from '../../db/repository.ts';

export type SourceType = 'api' | 'file' | 'sdmx' | 'overpass' | 'wmts';

export interface ConnectorHealth {
  reachable: boolean;
  latencyMs: number;
  message: string;
  lastCheckedAt: string;
}

export interface IngestionResult<T> {
  sourceId: string;
  recordsCount: number;
  durationMs: number;
  records: T[];
  warnings: string[];
}

export interface SourceConnector<T = any> {
  readonly id: string;
  readonly name: string;
  readonly provider: string;
  readonly type: SourceType;
  readonly description: string;
  readonly officialUrl: string;

  fetchRaw(options?: any): Promise<any>;
  parse(raw: any): Promise<T[]>;
  normalize(records: T[]): Promise<T[]>;
  validate(records: T[]): Promise<{ valid: boolean; errors: string[] }>;
  healthCheck(): Promise<ConnectorHealth>;
  run(): Promise<IngestionResult<T>>;
}
