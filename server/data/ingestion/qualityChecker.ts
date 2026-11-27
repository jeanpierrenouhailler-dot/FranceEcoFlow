import { EconomicFlow } from '../../../src/types/index.ts';
import { QualityCheckResult, IngestionAuditReport, IngestedFileMetadata } from './types.ts';

const VALID_ISO_PARTNERS = new Set([
  'KZ',
  'US',
  'SA',
  'NO',
  'NG',
  'IQ',
  'DZ',
  'LY',
  'AZ',
  'AO',
  'RU',
  'GB',
  'BR',
  'AE',
  'DE',
  'BE',
  'NL',
  'IT',
  'ES',
]);

export function runDataQualityChecks(
  flows: EconomicFlow[],
  filesMetadata: IngestedFileMetadata[],
  durationMs: number,
): IngestionAuditReport {
  const checks: QualityCheckResult[] = [];
  const hasFlowRecords = flows.length > 0;

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
    description:
      'Vérifie qu’aucune valeur monétaire CAF ni aucun volume en tonnes n’est négatif ou nul.',
    status: hasFlowRecords && nonNegativeFailed === 0 ? 'PASSED' : 'FAILED',
    recordsTested: flows.length,
    passedCount: nonNegativePassed,
    failedCount: nonNegativeFailed,
    details: !hasFlowRecords
      ? 'Aucune observation à contrôler.'
      : nonNegativeFailed === 0
        ? 'Toutes les observations présentent des valeurs strictement positives.'
        : `${nonNegativeFailed} observations non conformes.`,
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
    description:
      'Vérifie l’absence de NaN/Infinity et valide que le ratio valeur/masse se situe dans la plage économique des bruts (100 - 1 500 €/t).',
    status: hasFlowRecords && priceFailed === 0 ? 'PASSED' : 'FAILED',
    recordsTested: flows.length,
    passedCount: pricePassed,
    failedCount: priceFailed,
    details: !hasFlowRecords
      ? 'Aucune observation à contrôler.'
      : priceFailed === 0
        ? 'Tous les prix unitaires implicites respectent les seuils configurés.'
        : `${priceFailed} prix unitaires aberrants.`,
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
    description:
      'Assure que chaque pays d’origine correspond à une nomenclature d’État valide dans les tables douanières.',
    status: !hasFlowRecords ? 'FAILED' : isoFailed === 0 ? 'PASSED' : 'WARNING',
    recordsTested: flows.length,
    passedCount: isoPassed,
    failedCount: isoFailed,
    details: !hasFlowRecords
      ? 'Aucune observation à contrôler.'
      : isoFailed === 0
        ? '100% des codes pays partenaires sont conformes au standard ISO.'
        : `${isoFailed} codes non répertoriés.`,
  });

  // Check 4: Temporal Completeness
  const annualFlows = flows.filter((f) => f.periodMonth === undefined);
  const yearsPresent = new Set(annualFlows.map((f) => f.periodYear));
  const orderedYears = [...yearsPresent].sort((a, b) => a - b);
  const missingYears: number[] = [];
  if (orderedYears.length > 0) {
    for (let year = orderedYears[0]; year <= orderedYears[orderedYears.length - 1]; year++) {
      if (!yearsPresent.has(year)) {
        missingYears.push(year);
      }
    }
  }
  const hasAnnualData = orderedYears.length > 0;
  checks.push({
    checkId: 'CHECK_TEMPORAL_SERIES_COMPLETENESS',
    name: 'Continuité temporelle des séries annuelles',
    description:
      'Vérifie la continuité entre les premières et dernières années présentes dans les données.',
    status: hasAnnualData && missingYears.length === 0 ? 'PASSED' : 'FAILED',
    recordsTested: orderedYears.length,
    passedCount: Math.max(0, orderedYears.length - missingYears.length),
    failedCount: missingYears.length,
    details: !hasAnnualData
      ? 'Aucune observation annuelle à contrôler.'
      : missingYears.length === 0
        ? `Toutes les années entre ${orderedYears[0]} et ${orderedYears[orderedYears.length - 1]} sont présentes.`
        : `Années manquantes: ${missingYears.join(', ')}.`,
  });

  // Check 5: Source Attribution & Provenance Traceability
  const filesVerified =
    filesMetadata.length > 0 && filesMetadata.every((file) => file.provenanceStatus === 'VERIFIED');
  let sourcePassed = 0;
  for (const f of flows) {
    if (filesVerified && f.sourceId === 'dgddi') {
      sourcePassed++;
    }
  }
  const sourceFailed = flows.length - sourcePassed;
  checks.push({
    checkId: 'CHECK_PROVENANCE_LINEAGE',
    name: 'Traçabilité et attribution de la source primaire',
    description:
      'Vérifie que chaque observation est reliée à un fichier vérifié et attribuée à la DGDDI.',
    status: hasFlowRecords && filesVerified && sourceFailed === 0 ? 'PASSED' : 'FAILED',
    recordsTested: flows.length,
    passedCount: sourcePassed,
    failedCount: sourceFailed,
    details: filesVerified
      ? sourceFailed === 0
        ? 'Chaque observation est rattachée à un fichier dont la provenance a été vérifiée.'
        : `${sourceFailed} observations sans lignage vérifié.`
      : 'Aucun fichier ingéré ne possède actuellement un statut de provenance vérifiée.',
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
