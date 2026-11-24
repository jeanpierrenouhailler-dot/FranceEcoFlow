import { EconomicFlow } from '../../src/types/index.ts';
import { RawDGDDIRow, NormalizationReport } from './types.ts';
import { resolveProductFromNC8 } from './products.ts';

export function normalizeDGDDIRows(rawRows: RawDGDDIRow[]): {
  flows: EconomicFlow[];
  report: NormalizationReport;
} {
  const startTime = Date.now();
  const flows: EconomicFlow[] = [];
  const errors: string[] = [];
  let rejected = 0;

  for (const raw of rawRows) {
    if (
      !raw.annee ||
      isNaN(raw.annee) ||
      !raw.pays_partenaire ||
      isNaN(raw.valeur_caf_euros) ||
      raw.valeur_caf_euros <= 0 ||
      isNaN(raw.masse_nette_kg) ||
      raw.masse_nette_kg <= 0
    ) {
      rejected++;
      errors.push(`Row rejected: Invalid year, partner, value or mass (${JSON.stringify(raw)})`);
      continue;
    }

    // Dynamic resolution of Product, Category and Nomenclature from raw NC8 code
    const resolvedProduct = resolveProductFromNC8(raw.code_nc8);
    if (resolvedProduct.productId === 'unknown') {
      rejected++;
      errors.push(`Row rejected: unsupported or invalid NC8 code (${raw.code_nc8}).`);
      continue;
    }

    const flowType = raw.flux === '2' || raw.flux === 'export' ? 'export' : 'import';
    const quantityTonnes = Math.round((raw.masse_nette_kg / 1000) * 1000) / 1000;
    const implicitPriceEurPerTonne = Math.round((raw.valeur_caf_euros / quantityTonnes) * 100) / 100;

    const periodMonth = raw.mois && raw.mois > 0 && raw.mois <= 12 ? raw.mois : undefined;
    const periodSuffix = periodMonth ? `_${periodMonth}` : '';
    const id = `dgddi_${raw.pays_declarant}_${raw.pays_partenaire}_${resolvedProduct.nc8Code}_${raw.annee}${periodSuffix}`;

    flows.push({
      id,
      reporterCountryId: raw.pays_declarant,
      partnerCountryId: raw.pays_partenaire,
      productId: resolvedProduct.productId, // dynamically resolved from NC8!
      periodYear: raw.annee,
      periodMonth,
      flowType,
      valueEur: raw.valeur_caf_euros,
      quantityTonnes,
      implicitPriceEurPerTonne,
      confidence: 'UNKNOWN',
      sourceId: 'dgddi',
      datasetId: periodMonth ? 'dgddi_nc8_monthly' : 'dgddi_annual_series',
      rawNcCode: resolvedProduct.nc8Code,
      rawNcDescription: resolvedProduct.nc8DescriptionFr,
      dauReference: raw.dau_reference,
    });
  }

  const duration = Date.now() - startTime;
  return {
    flows,
    report: {
      rawRowsProcessed: rawRows.length,
      normalizedFlowsCreated: flows.length,
      rejectedRows: rejected,
      errors,
      executionTimeMs: duration,
    },
  };
}
