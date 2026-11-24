import {
  Country,
  Product,
  ProductCategory,
  ProductClassification,
  Source,
  Dataset,
  EconomicFlow,
  TransportRoute,
  Infrastructure,
  ConfidenceLevel,
  FlowAnalysisSummary,
  SupplierSummary,
  AnomalyDetection,
  SankeyData,
  TimeseriesPoint,
} from '../../src/types/index.ts';
import { getAuditReport, getIngestedFiles } from './ingestion/index.ts';


// ============================================================
// 1. SOURCES & DATASETS (Lineage & Provenance)
// ============================================================
export const sources: Source[] = [
  {
    id: 'dgddi',
    provider: 'DGDDI (Douanes Françaises)',
    title: 'Statistiques du commerce extérieur de la France',
    url: 'https://lekiosque.finances.gouv.fr',
    license: 'Non vérifiée',
    provenanceStatus: 'UNVERIFIED',
    methodologyUrl: 'https://lekiosque.finances.gouv.fr/site_fr/methodologie/index.asp',
    notes: 'Référence de source potentielle ; aucune extraction de ce dépôt n’a été authentifiée.',
  },
  {
    id: 'sdes',
    provider: 'SDES / Ministère de la Transition Énergétique',
    title: 'Bilan énergétique de la France & Approvisionnements pétroliers',
    url: 'https://www.statistiques.developpement-durable.gouv.fr',
    license: 'Non vérifiée',
    provenanceStatus: 'UNVERIFIED',
    methodologyUrl: 'https://www.statistiques.developpement-durable.gouv.fr/publication-bilan-energetique',
    notes: 'Référence de source potentielle ; connecteur et données non vérifiés.',
  },
  {
    id: 'eurostat',
    provider: 'Eurostat (Commission Européenne)',
    title: 'Comext / EU Trade since 1988 by HS2, 4, 6 and CN8 (DS-045409)',
    url: 'https://ec.europa.eu/eurostat/data/database',
    license: 'Non vérifiée',
    provenanceStatus: 'UNVERIFIED',
    methodologyUrl: 'https://ec.europa.eu/eurostat/cache/metadata/en/ext_go_esms.htm',
    notes: 'Référence de source potentielle ; aucune requête Eurostat validée.',
  },
  {
    id: 'osm',
    provider: 'OpenStreetMap Contributors & Overpass API',
    title: 'Infrastructures maritimes, portuaires et de raffinage',
    url: 'https://www.openstreetmap.org',
    license: 'Non vérifiée',
    provenanceStatus: 'UNVERIFIED',
    notes: 'Référence de source potentielle ; aucune extraction Overpass authentifiée.',
  },
  {
    id: 'comtrade',
    provider: 'UN Comtrade (United Nations)',
    title: 'UN Comtrade Database',
    url: 'https://comtradeplus.un.org',
    license: 'Non vérifiée',
    provenanceStatus: 'UNVERIFIED',
    methodologyUrl: 'https://unstats.un.org/unsd/tradekb/Knowledgebase/Trade-Data-Analysis',
    notes: 'Référence de source potentielle ; aucune extraction UN Comtrade vérifiée.',
  },
  {
    id: 'jodi',
    provider: 'JODI Oil (Joint Organisations Data Initiative)',
    title: 'JODI-Oil World Database',
    url: 'https://www.jodidata.org',
    license: 'Non vérifiée',
    provenanceStatus: 'UNVERIFIED',
    notes: 'Référence de source potentielle ; aucune extraction JODI vérifiée.',
  },
  {
    id: 'eia',
    provider: 'U.S. Energy Information Administration',
    title: 'Petroleum & Other Liquids Data (US Exports by Destination)',
    url: 'https://www.eia.gov/petroleum/data.php',
    license: 'Non vérifiée',
    provenanceStatus: 'UNVERIFIED',
    notes: 'Référence de source potentielle ; aucune série EIA n’a été interrogée.',
  },
];

export const datasets: Dataset[] = [
  {
    id: 'dgddi_nc8_monthly',
    sourceId: 'dgddi',
    name: 'Statistiques mensuelles détaillées par code NC8 et pays',
    frequency: 'monthly',
    updateFrequency: 'Mensuelle (M+45 jours)',
    provenanceStatus: 'UNVERIFIED',
    methodologyUrl: 'https://lekiosque.finances.gouv.fr/site_fr/methodologie/index.asp',
  },
  {
    id: 'dgddi_annual_series',
    sourceId: 'dgddi',
    name: 'Séries annuelles du commerce extérieur (période à vérifier)',
    frequency: 'annual',
    updateFrequency: 'Annuelle révisée',
    provenanceStatus: 'UNVERIFIED',
    methodologyUrl: 'https://lekiosque.finances.gouv.fr/site_fr/methodologie/index.asp',
  },
  {
    id: 'osm_maritime_energy',
    sourceId: 'osm',
    name: 'Extraction Overpass: Ports, terminaux liquides et raffineries',
    frequency: 'annual',
    updateFrequency: 'Trimestrielle',
    provenanceStatus: 'UNVERIFIED',
    methodologyUrl: 'https://wiki.openstreetmap.org/wiki/Tag:man_made%3Dpetroleum_well',
  },
];

// ============================================================
// 2. COUNTRIES (ISO Codes, Names, Centroids, Flags)
// ============================================================
export const countries: Country[] = [
  {
    id: 'FR',
    name: 'France',
    nameFr: 'France',
    iso3: 'FRA',
    region: 'Europe',
    subregion: 'Western Europe',
    coordinates: [2.2137, 46.2276],
    flag: '🇫🇷',
  },
  {
    id: 'KZ',
    name: 'Kazakhstan',
    nameFr: 'Kazakhstan',
    iso3: 'KAZ',
    region: 'Asia',
    subregion: 'Central Asia',
    coordinates: [66.9237, 48.0196],
    flag: '🇰🇿',
  },
  {
    id: 'US',
    name: 'United States',
    nameFr: 'États-Unis',
    iso3: 'USA',
    region: 'Americas',
    subregion: 'Northern America',
    coordinates: [-95.7129, 37.0902],
    flag: '🇺🇸',
  },
  {
    id: 'SA',
    name: 'Saudi Arabia',
    nameFr: 'Arabie Saoudite',
    iso3: 'SAU',
    region: 'Asia',
    subregion: 'Western Asia',
    coordinates: [45.0792, 23.8859],
    flag: '🇸🇦',
  },
  {
    id: 'NO',
    name: 'Norway',
    nameFr: 'Norvège',
    iso3: 'NOR',
    region: 'Europe',
    subregion: 'Northern Europe',
    coordinates: [8.4689, 60.472],
    flag: '🇳🇴',
  },
  {
    id: 'NG',
    name: 'Nigeria',
    nameFr: 'Nigéria',
    iso3: 'NGA',
    region: 'Africa',
    subregion: 'Western Africa',
    coordinates: [8.6753, 9.082],
    flag: '🇳🇬',
  },
  {
    id: 'IQ',
    name: 'Iraq',
    nameFr: 'Irak',
    iso3: 'IRQ',
    region: 'Asia',
    subregion: 'Western Asia',
    coordinates: [43.6793, 33.2232],
    flag: '🇮🇶',
  },
  {
    id: 'DZ',
    name: 'Algeria',
    nameFr: 'Algérie',
    iso3: 'DZA',
    region: 'Africa',
    subregion: 'Northern Africa',
    coordinates: [1.6596, 28.0339],
    flag: '🇩🇿',
  },
  {
    id: 'LY',
    name: 'Libya',
    nameFr: 'Libye',
    iso3: 'LBY',
    region: 'Africa',
    subregion: 'Northern Africa',
    coordinates: [17.2283, 26.3351],
    flag: '🇱🇾',
  },
  {
    id: 'AZ',
    name: 'Azerbaijan',
    nameFr: 'Azerbaïdjan',
    iso3: 'AZE',
    region: 'Asia',
    subregion: 'Western Asia',
    coordinates: [47.5769, 40.1431],
    flag: '🇦🇿',
  },
  {
    id: 'AO',
    name: 'Angola',
    nameFr: 'Angola',
    iso3: 'AGO',
    region: 'Africa',
    subregion: 'Middle Africa',
    coordinates: [17.8739, -11.2027],
    flag: '🇦🇴',
  },
  {
    id: 'RU',
    name: 'Russia',
    nameFr: 'Russie',
    iso3: 'RUS',
    region: 'Europe / Asia',
    subregion: 'Eastern Europe',
    coordinates: [105.3188, 61.524],
    flag: '🇷🇺',
  },
  {
    id: 'GB',
    name: 'United Kingdom',
    nameFr: 'Royaume-Uni',
    iso3: 'GBR',
    region: 'Europe',
    subregion: 'Northern Europe',
    coordinates: [-3.436, 55.3781],
    flag: '🇬🇧',
  },
  {
    id: 'BR',
    name: 'Brazil',
    nameFr: 'Brésil',
    iso3: 'BRA',
    region: 'Americas',
    subregion: 'South America',
    coordinates: [-51.9253, -14.235],
    flag: '🇧🇷',
  },
  {
    id: 'AE',
    name: 'United Arab Emirates',
    nameFr: 'Émirats Arabes Unis',
    iso3: 'ARE',
    region: 'Asia',
    subregion: 'Western Asia',
    coordinates: [53.8478, 23.4241],
    flag: '🇦🇪',
  },
];

// ============================================================
// 3. PRODUCT CLASSIFICATIONS & TAXONOMY (Extensible)
// ============================================================
export const productCategories: ProductCategory[] = [
  {
    id: 'energy_hydrocarbons',
    name: 'Hydrocarbons & Petroleum',
    nameFr: 'Hydrocarbures & Pétrole',
    description: 'Pétroles bruts, carburants raffinés, fiouls et gaz de pétrole liquéfiés',
  },
  {
    id: 'energy_gas',
    name: 'Natural Gas & LNG',
    nameFr: 'Gaz naturel & GNL',
    description: 'Gaz naturel à l’état gazeux ou liquéfié',
  },
  {
    id: 'agri_food',
    name: 'Agri-food & Cereals',
    nameFr: 'Agroalimentaire & Céréales',
    description: 'Blé tendre, maïs, vins et spiritueux',
  },
];

export const productClassifications: ProductClassification[] = [
  {
    id: 'hs_2709',
    system: 'HS',
    code: '2709',
    description: 'Petroleum oils and oils obtained from bituminous minerals, crude',
  },
  {
    id: 'nc8_27090090',
    system: 'NC8',
    code: '27090090',
    description: 'Huiles brutes de pétrole ou de minéraux bitumineux (hors condensats)',
  },
  {
    id: 'nc8_27090010',
    system: 'NC8',
    code: '27090010',
    description: 'Condensats de gaz naturel',
  },
  {
    id: 'hs_2710',
    system: 'HS',
    code: '2710',
    description: 'Petroleum oils and oils from bituminous minerals (refined products)',
  },
];

export const products: Product[] = [
  {
    id: 'crude_oil',
    code: 'HS 2709',
    name: 'Crude petroleum',
    nameFr: 'Pétrole brut',
    categoryId: 'energy_hydrocarbons',
    classificationIds: ['hs_2709', 'nc8_27090090', 'nc8_27090010'],
    unit: 't',
    descriptionFr: 'Pétroles bruts issus des gisements d’extraction avant raffinage (NC8 27090090 & 27090010). Unité statistique de référence : tonne métrique nette.',
  },
  {
    id: 'refined_fuels',
    code: 'HS 2710',
    name: 'Refined petroleum products',
    nameFr: 'Produits pétroliers raffinés',
    categoryId: 'energy_hydrocarbons',
    classificationIds: ['hs_2710'],
    unit: 't',
    descriptionFr: 'Carburants automobiles (gazole, essences), fiouls domestiques, kérosène pour aviation.',
  },
  {
    id: 'lng',
    code: 'HS 271111',
    name: 'Liquefied Natural Gas (LNG)',
    nameFr: 'Gaz Naturel Liquéfié (GNL)',
    categoryId: 'energy_gas',
    classificationIds: [],
    unit: 't',
    descriptionFr: 'Gaz naturel liquéfié à basse température acheminé par méthaniers aux terminaux méthaniers.',
  },
];

// ============================================================
// No infrastructure or transport-route records are published until their provenance is verified.
export const infrastructures: Infrastructure[] = [];
export const transportRoutes: TransportRoute[] = [];

// 6. ECONOMIC FLOWS DATASET (Ingested from raw official DGDDI customs DAU declarations)
// Fully ingested via 3-tier pipeline: Raw CSV -> PostgreSQL Staging -> Normalized -> Application
// Preserves original NC8 code (27090090 / 27090010) and DAU references.
// Direct net mass (kg -> tonnes) and declared CIF value (EUR).
// Implicit unit price = declared CIF value / declared net mass.
// No Brent multiplier, no currency conversion, no simulated trigonometric formulas.
// ============================================================
export function getIngestionReport() {
  return getAuditReport();
}

export function getRawSourceFiles() {
  return getIngestedFiles();
}


// ============================================================
// 7. QUERY AND AGGREGATION SERVICE (Pure functions & analytical engine)
// ============================================================

export interface FlowQueryFilter {
  reporterCountryId?: string; // default 'FR'
  flowType?: 'import' | 'export'; // default 'import'
  productId?: string; // default 'crude_oil'
  startYear?: number;
  endYear?: number;
  partnerCountryId?: string; // optional partner filter
  periodType?: 'annual' | 'monthly';
}

export function filterFlows(filter: FlowQueryFilter, flowRows: EconomicFlow[]): EconomicFlow[] {
  const reporter = filter.reporterCountryId || 'FR';
  const flowType = filter.flowType || 'import';
  const product = filter.productId || 'crude_oil';
  return flowRows.filter((flow) => {
    if (flow.reporterCountryId !== reporter) return false;
    if (flow.flowType !== flowType) return false;
    if (flow.productId !== product) return false;
    if (filter.startYear !== undefined && flow.periodYear < filter.startYear) return false;
    if (filter.endYear !== undefined && flow.periodYear > filter.endYear) return false;
    if (filter.partnerCountryId && filter.partnerCountryId !== 'all' && flow.partnerCountryId !== filter.partnerCountryId) {
      return false;
    }
    // If requesting annual summary, exclude monthly breakdown items to prevent double-counting
    if (filter.periodType === 'annual' && flow.periodMonth !== undefined) {
      return false;
    }
    return true;
  });
}

export function calculateFlowSummary(
  filter: FlowQueryFilter,
  flowRows: EconomicFlow[]
): FlowAnalysisSummary {
  // Always use annual records for the aggregate summary
  const flows = filterFlows({ ...filter, periodType: 'annual' }, flowRows);

  let totalQuantityTonnes = 0;
  let totalValueEur = 0;
  const partnerMap = new Map<string, { quantity: number; value: number }>();

  flows.forEach((f) => {
    totalQuantityTonnes += f.quantityTonnes;
    totalValueEur += f.valueEur;

    const current = partnerMap.get(f.partnerCountryId) || { quantity: 0, value: 0 };
    current.quantity += f.quantityTonnes;
    current.value += f.valueEur;
    partnerMap.set(f.partnerCountryId, current);
  });

  const averageImplicitPriceEurPerTonne =
    totalQuantityTonnes > 0 ? Math.round((totalValueEur / totalQuantityTonnes) * 100) / 100 : 0;

  // Supplier rankings and Herfindahl-Hirschman Index (HHI)
  // HHI is calculated as the sum of squared percentage market shares (0 to 10,000).
  // Market share is (supplier quantity / total quantity) * 100
  let hhi = 0;
  const suppliers: SupplierSummary[] = [];

  partnerMap.forEach((data, pId) => {
    const share = totalQuantityTonnes > 0 ? (data.quantity / totalQuantityTonnes) * 100 : 0;
    hhi += share * share;

    const countryObj = countries.find((c) => c.id === pId) || {
      id: pId,
      name: pId,
      nameFr: pId,
      iso3: pId,
      region: 'Unknown',
      subregion: 'Unknown',
      flag: '🌐',
    };

    suppliers.push({
      partnerCountryId: pId,
      country: countryObj,
      totalQuantityTonnes: data.quantity,
      totalValueEur: data.value,
      marketSharePercent: Math.round(share * 10) / 10,
      implicitPriceEurPerTonne:
        data.quantity > 0 ? Math.round((data.value / data.quantity) * 100) / 100 : 0,
      rank: 0,
      confidence: 'UNKNOWN',
    });
  });

  suppliers.sort((a, b) => b.totalQuantityTonnes - a.totalQuantityTonnes);
  suppliers.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  const hhiRounded = Math.round(hhi);
  let hhiClassification: 'UNCONCENTRATED' | 'MODERATE' | 'HIGH' | 'EXTREME' = 'UNCONCENTRATED';
  if (hhiRounded >= 2500) {
    hhiClassification = 'EXTREME';
  } else if (hhiRounded >= 1800) {
    hhiClassification = 'HIGH';
  } else if (hhiRounded >= 1000) {
    hhiClassification = 'MODERATE';
  }

  // YoY comparison: Calculate variation between the final year and previous year
  const availableYears = flows.map((flow) => flow.periodYear);
  const endYear = filter.endYear ?? (availableYears.length ? Math.max(...availableYears) : undefined);
  const endYearFlows = endYear === undefined ? [] : flows.filter((f) => f.periodYear === endYear);
  const prevYearFlows = endYear === undefined ? [] : flows.filter((f) => f.periodYear === endYear - 1);

  const endYearQty = endYearFlows.reduce((sum, f) => sum + f.quantityTonnes, 0);
  const prevYearQty = prevYearFlows.reduce((sum, f) => sum + f.quantityTonnes, 0);
  const yoyQuantityChangePercent =
    prevYearQty > 0 ? Math.round(((endYearQty - prevYearQty) / prevYearQty) * 1000) / 10 : 0;

  const endYearVal = endYearFlows.reduce((sum, f) => sum + f.valueEur, 0);
  const prevYearVal = prevYearFlows.reduce((sum, f) => sum + f.valueEur, 0);
  const endYearPrice = endYearQty > 0 ? endYearVal / endYearQty : 0;
  const prevYearPrice = prevYearQty > 0 ? prevYearVal / prevYearQty : 0;
  const yoyPriceChangePercent =
    prevYearPrice > 0 ? Math.round(((endYearPrice - prevYearPrice) / prevYearPrice) * 1000) / 10 : 0;

  const startYear = filter.startYear ?? (availableYears.length ? Math.min(...availableYears) : undefined);
  const periodLabel =
    startYear === undefined || endYear === undefined
      ? 'Période indisponible'
      : startYear === endYear
        ? `${startYear}`
        : `${startYear} - ${endYear}`;

  return {
    totalQuantityTonnes,
    totalValueEur,
    averageImplicitPriceEurPerTonne,
    supplierCount: suppliers.length,
    hhiIndex: hhiRounded,
    hhiClassification,
    topSupplier: suppliers.length > 0 ? suppliers[0] : null,
    periodLabel,
    yoyQuantityChangePercent,
    yoyPriceChangePercent,
  };
}

export function getSupplierRankings(
  filter: FlowQueryFilter,
  flowRows: EconomicFlow[]
): SupplierSummary[] {
  const flows = filterFlows({ ...filter, periodType: 'annual' }, flowRows);
  const totalQuantity = flows.reduce((sum, f) => sum + f.quantityTonnes, 0);

  const map = new Map<string, { quantity: number; value: number }>();
  flows.forEach((f) => {
    const cur = map.get(f.partnerCountryId) || { quantity: 0, value: 0 };
    cur.quantity += f.quantityTonnes;
    cur.value += f.valueEur;
    map.set(f.partnerCountryId, cur);
  });

  const list: SupplierSummary[] = [];
  map.forEach((data, pId) => {
    const share = totalQuantity > 0 ? (data.quantity / totalQuantity) * 100 : 0;
    const countryObj = countries.find((c) => c.id === pId) || {
      id: pId,
      name: pId,
      nameFr: pId,
      iso3: pId,
      region: 'Unknown',
      subregion: 'Unknown',
      flag: '🌐',
    };

    list.push({
      partnerCountryId: pId,
      country: countryObj,
      totalQuantityTonnes: data.quantity,
      totalValueEur: data.value,
      marketSharePercent: Math.round(share * 10) / 10,
      implicitPriceEurPerTonne:
        data.quantity > 0 ? Math.round((data.value / data.quantity) * 100) / 100 : 0,
      rank: 0,
      confidence: 'UNKNOWN',
    });
  });

  list.sort((a, b) => b.totalQuantityTonnes - a.totalQuantityTonnes);
  list.forEach((s, i) => {
    s.rank = i + 1;
  });

  return list;
}

export function getTimeseriesData(
  filter: FlowQueryFilter,
  flowRows: EconomicFlow[]
): TimeseriesPoint[] {
  const flows = filterFlows({ ...filter, periodType: 'annual' }, flowRows);
  const yearMap = new Map<number, { quantity: number; value: number }>();

  flows.forEach((f) => {
    const cur = yearMap.get(f.periodYear) || { quantity: 0, value: 0 };
    cur.quantity += f.quantityTonnes;
    cur.value += f.valueEur;
    yearMap.set(f.periodYear, cur);
  });

  const points: TimeseriesPoint[] = [];
  const years = Array.from(yearMap.keys()).sort((a, b) => a - b);

  years.forEach((yr) => {
    const d = yearMap.get(yr)!;
    points.push({
      period: `${yr}`,
      year: yr,
      quantityTonnes: d.quantity,
      valueEur: d.value,
      implicitPriceEurPerTonne:
        d.quantity > 0 ? Math.round((d.value / d.quantity) * 100) / 100 : 0,
    });
  });

  return points;
}

export function getSankeyData(
  filter: FlowQueryFilter,
  flowRows: EconomicFlow[]
): SankeyData {
  const suppliers = getSupplierRankings(filter, flowRows);
  const product = products.find((p) => p.id === (filter.productId || 'crude_oil')) || products[0];

  const nodes: { name: string; category?: string }[] = [];
  const links: { source: string; target: string; value: number }[] = [];

  // Intermediate node: France
  const franceNode = 'France (Importateur)';
  const productNode = `${product.nameFr} (${product.code})`;

  nodes.push({ name: franceNode, category: 'reporter' });
  nodes.push({ name: productNode, category: 'product' });

  // Top 8 suppliers + "Autres fournisseurs"
  const topSuppliers = suppliers.slice(0, 8);
  const remaining = suppliers.slice(8);

  let totalVolumeMt = 0;

  topSuppliers.forEach((s) => {
    const nodeName = `${s.country.flag} ${s.country.nameFr}`;
    nodes.push({ name: nodeName, category: 'partner' });
    const volumeMt = Math.round((s.totalQuantityTonnes / 1000000) * 100) / 100;
    totalVolumeMt += volumeMt;
    links.push({
      source: nodeName,
      target: franceNode,
      value: volumeMt,
    });
  });

  if (remaining.length > 0) {
    const otherVolumeMt =
      Math.round((remaining.reduce((sum, s) => sum + s.totalQuantityTonnes, 0) / 1000000) * 100) /
      100;
    const otherName = '🌐 Autres partenaires';
    nodes.push({ name: otherName, category: 'partner' });
    totalVolumeMt += otherVolumeMt;
    links.push({
      source: otherName,
      target: franceNode,
      value: otherVolumeMt,
    });
  }

  // Link France to product
  links.push({
    source: franceNode,
    target: productNode,
    value: Math.round(totalVolumeMt * 100) / 100,
  });

  return { nodes, links };
}

export function detectAnomalies(
  productId: string = 'crude_oil',
  flowRows: EconomicFlow[]
): AnomalyDetection[] {
  const byPartnerAndYear = new Map<string, Map<number, number>>();
  for (const flow of flowRows) {
    if (flow.productId !== productId || flow.flowType !== 'import' || flow.periodMonth !== undefined) continue;
    const years = byPartnerAndYear.get(flow.partnerCountryId) ?? new Map<number, number>();
    years.set(flow.periodYear, (years.get(flow.periodYear) ?? 0) + flow.quantityTonnes);
    byPartnerAndYear.set(flow.partnerCountryId, years);
  }

  const anomalies: AnomalyDetection[] = [];
  byPartnerAndYear.forEach((years, partnerCountryId) => {
    const orderedYears = [...years.keys()].sort((a, b) => a - b);
    for (let index = 1; index < orderedYears.length; index++) {
      const previousYear = orderedYears[index - 1];
      const currentYear = orderedYears[index];
      if (currentYear !== previousYear + 1) continue;

      const previousValue = years.get(previousYear)!;
      const currentValue = years.get(currentYear)!;
      if (previousValue <= 0) continue;
      const magnitudePercent = ((currentValue - previousValue) / previousValue) * 100;
      if (Math.abs(magnitudePercent) < 30) continue;

      const country = countries.find((item) => item.id === partnerCountryId);
      anomalies.push({
        id: `flow_change_${partnerCountryId}_${previousYear}_${currentYear}`,
        partnerCountryId,
        partnerCountryName: country?.nameFr ?? partnerCountryId,
        period: `${previousYear} - ${currentYear}`,
        type: magnitudePercent < 0 ? 'DROP' : 'SPIKE',
        magnitudePercent: Math.round(magnitudePercent * 10) / 10,
        previousValue,
        currentValue,
        unit: 'tonnes',
        observation: 'Variation calculée à partir des flux annuels ingérés.',
        sourceId: 'dgddi',
      });
    }
  });
  return anomalies;
}
