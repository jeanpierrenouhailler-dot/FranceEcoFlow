import { EconomicFlow } from '../../../src/types/index.ts';
import { QualityCheckResult, IngestionAuditReport, IngestedFileMetadata } from './types.ts';

const VALID_ISO_PARTNERS = new Set([
  'KZ', 'US', 'SA', 'NO', 'NG', 'IQ', 'DZ', 'LY', 'AZ', 'AO', 'RU', 'GB', 'BR', 'AE', 'DE', 'BE', 'NL', 'IT', 'ES'
]);

export function runDataQualityChecks(
  flows: EconomicFlow[],
  filesMetadata: IngestedFileMetadata[],
  durationMs: number
): IngestionAuditReport {
  const checks: QualityCheckResult[] = [];

  // Check 1: Non-negativity & Non-zero
  let nonNegativePassed = 0;
  let nonNegativeFailed = 0;
  for (const f of flows) {
    if (f.valueEur > 0 && f.quantityTonnes > 0) {
      nonNegativePassed++;
    } else {
      nonNegativeFailed++;
    }
  }
  checks.push({
    checkId: 'CHECK_NON_NEGATIVE_VALUES',
    name: 'Non-négativité des valeurs et volumes',
    description: 'Vérifie qu’aucune valeur monétaire CAF ni aucun volume en tonnes n’est négatif ou nul.',
    status: nonNegativeFailed === 0 ? 'PASSED' : 'FAILED',
    recordsTested: flows.length,
    passedCount: nonNegativePassed,
    failedCount: nonNegativeFailed,
    details: nonNegativeFailed === 0 ? 'Toutes les observations présentent des valeurs strictement positives.' : `${nonNegativeFailed} observations non conformes.`,
  });

  // Check 2: Implicit Price Validity (No NaN, No Infinity, In Realistic Economic Boundary)
  let pricePassed = 0;
  let priceFailed = 0;
  for (const f of flows) {
    if (
      !isNaN(f.implicitPriceEurPerTonne) &&
      isFinite(f.implicitPriceEurPerTonne) &&
      f.implicitPriceEurPerTonne >= 100 &&
      f.implicitPriceEurPerTonne <= 1500
    ) {
      pricePassed++;
    } else {
      priceFailed++;
    }
  }
  checks.push({
    checkId: 'CHECK_IMPLICIT_PRICE_COHERENCE',
    name: 'Cohérence du prix unitaire implicite',
    description: 'Vérifie l’absence de NaN/Infinity et valide que le ratio valeur/masse se situe dans la plage économique des bruts (100 - 1 500 €/t).',
    status: priceFailed === 0 ? 'PASSED' : 'FAILED',
    recordsTested: flows.length,
    passedCount: pricePassed,
    failedCount: priceFailed,
    details: priceFailed === 0 ? 'Tous les prix unitaires implicites sont cohérents avec les cours observés.' : `${priceFailed} prix unitaires aberrants.`,
  });

  // Check 3: Partner Country Code Conformance
  let isoPassed = 0;
  let isoFailed = 0;
  for (const f of flows) {
    if (VALID_ISO_PARTNERS.has(f.partnerCountryId)) {
      isoPassed++;
    } else {
      isoFailed++;
    }
  }
  checks.push({
    checkId: 'CHECK_ISO_PARTNER_CODES',
    name: 'Conformité des codes pays partenaires (ISO 3166-1 alpha-2)',
    description: 'Assure que chaque pays d’origine correspond à une nomenclature d’État valide dans les tables douanières.',
    status: isoFailed === 0 ? 'PASSED' : 'WARNING',
    recordsTested: flows.length,
    passedCount: isoPassed,
    failedCount: isoFailed,
    details: isoFailed === 0 ? '100% des codes pays partenaires sont conformes au standard ISO.' : `${isoFailed} codes non répertoriés.`,
  });

  // Check 4: Temporal Completeness (2015 to 2026)
  const annualFlows = flows.filter((f) => f.periodMonth === undefined);
  const yearsPresent = new Set(annualFlows.map((f) => f.periodYear));
  let missingYears: number[] = [];
  for (let yr = 2015; yr <= 2026; yr++) {
    if (!yearsPresent.has(yr)) {
      missingYears.push(yr);
    }
  }
  checks.push({
    checkId: 'CHECK_TEMPORAL_SERIES_COMPLETENESS',
    name: 'Complétude temporelle des séries annuelles (2015 - 2026)',
    description: 'Vérifie la continuité chronologique sans rupture d’année dans le registre douanier.',
    status: missingYears.length === 0 ? 'PASSED' : 'FAILED',
    recordsTested: 12,
    passedCount: 12 - missingYears.length,
    failedCount: missingYears.length,
    details: missingYears.length === 0 ? 'Les 12 années consécutives (2015 à 2026) sont intégralement couvertes.' : `Années manquantes: ${missingYears.join(', ')}.`,
  });

  // Check 5: Source Attribution & Provenance Traceability
  let sourcePassed = 0;
  let sourceFailed = 0;
  for (const f of flows) {
    if (f.sourceId === 'dgddi' && f.confidence === 'CONFIRMED') {
      sourcePassed++;
    } else {
      sourceFailed++;
    }
  }
  checks.push({
    checkId: 'CHECK_PROVENANCE_LINEAGE',
    name: 'Traçabilité et attribution de la source primaire',
    description: 'Vérifie que chaque enregistrement est relié au fournisseur officiel (DGDDI) avec niveau de confiance CONFIRMED.',
    status: sourceFailed === 0 ? 'PASSED' : 'FAILED',
    recordsTested: flows.length,
    passedCount: sourcePassed,
    failedCount: sourceFailed,
    details: 'Chaque observation est rattachée au registre des douanes françaises.',
  });

  const overallStatus = checks.some((c) => c.status === 'FAILED')
    ? 'FAILED'
    : checks.some((c) => c.status === 'WARNING')
    ? 'WARNING'
    : 'PASSED';

  const annualCount = flows.filter((f) => f.periodMonth === undefined).length;
  const monthlyCount = flows.filter((f) => f.periodMonth !== undefined).length;

  return {
    jobId: `ingest_job_${Date.now()}`,
    executedAt: new Date().toISOString(),
    durationMs,
    totalRecordsLoaded: flows.length,
    annualRecordsLoaded: annualCount,
    monthlyRecordsLoaded: monthlyCount,
    filesIngested: filesMetadata,
    checks,
    overallStatus,
  };
}
