import { EconomicFlow } from '../../src/types/index.ts';

export interface RawDGDDIRow {
  annee: number;
  mois: number; // 0 for annual, 1-12 for monthly
  flux: string; // '1' (import), '2' (export)
  pays_declarant: string; // 'FR'
  pays_partenaire: string; // ISO2
  code_nc8: string; // '27090090' or '27090010'
  valeur_caf_euros: number;
  masse_nette_kg: number;
  dau_reference?: string;
  source: string;
}

export interface NormalizationReport {
  rawRowsProcessed: number;
  normalizedFlowsCreated: number;
  rejectedRows: number;
  errors: string[];
  executionTimeMs: number;
}
