export type ConfidenceLevel = 'CONFIRMED' | 'DOCUMENTED' | 'PROBABLE' | 'UNKNOWN';

export type TransportMode = 'maritime' | 'pipeline' | 'rail' | 'road' | 'unknown';

export type InfrastructureType = 'port' | 'terminal' | 'refinery' | 'depot' | 'pipeline';

export type FlowType = 'import' | 'export';

export interface Country {
  id: string; // ISO 2 code: FR, KZ, US, SA, NO, etc.
  name: string;
  nameFr: string;
  iso3: string;
  region: string;
  subregion: string;
  coordinates: [number, number]; // [lng, lat]
  flag: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  nameFr: string;
  description: string;
}

export interface ProductClassification {
  id: string;
  system: 'HS' | 'NC8' | 'SITC' | 'CPA';
  code: string;
  description: string;
}

export interface Product {
  id: string;
  code: string; // e.g. HS 2709
  name: string;
  nameFr: string;
  categoryId: string;
  classificationIds: string[];
  unit: string; // 't', 'kt', 'Mt', 'bbl'
  descriptionFr: string;
}

export interface Source {
  id: string;
  provider: string; // e.g. 'DGDDI', 'Eurostat', 'SDES', 'JODI', 'EIA', 'OSM'
  title: string;
  url: string;
  license: string;
  retrievedAt: string;
  methodologyUrl?: string;
  notes?: string;
}

export interface Dataset {
  id: string;
  sourceId: string;
  name: string;
  frequency: 'monthly' | 'quarterly' | 'annual';
  updateFrequency: string;
  lastUpdated: string;
  methodologyUrl: string;
}

export interface EconomicFlow {
  id: string;
  reporterCountryId: string; // 'FR'
  partnerCountryId: string;
  productId: string;
  periodYear: number;
  periodMonth?: number; // 1-12 or undefined for annual
  flowType: FlowType;
  valueEur: number; // in Euros
  quantityTonnes: number; // in Metric Tonnes
  implicitPriceEurPerTonne: number; // calculated: valueEur / quantityTonnes
  confidence: ConfidenceLevel;
  sourceId: string;
  datasetId: string;
}

export interface TransportRoute {
  id: string;
  sourcePartnerId: string;
  destinationReporterId: string;
  productId: string;
  mode: TransportMode;
  waypoints: [number, number][]; // coordinates [lng, lat]
  confidence: ConfidenceLevel;
  evidence: string;
  sourceId: string;
  associatedPortIds?: string[];
  associatedRefineryIds?: string[];
  associatedPipelineIds?: string[];
}

export interface Infrastructure {
  id: string;
  name: string;
  type: InfrastructureType;
  countryId: string;
  operator: string;
  coordinates: [number, number]; // [lng, lat]
  capacityAnnualTonnes: number;
  currentStatus: 'active' | 'transition' | 'standby';
  descriptionFr: string;
  osmId?: string;
  confidence: ConfidenceLevel;
  sourceId: string;
}

export interface SupplierSummary {
  partnerCountryId: string;
  country: Country;
  totalQuantityTonnes: number;
  totalValueEur: number;
  marketSharePercent: number; // percentage of total
  implicitPriceEurPerTonne: number;
  rank: number;
  confidence: ConfidenceLevel;
  variationVsPrevYearPercent?: number;
  isNewSupplier?: boolean;
}

export interface FlowAnalysisSummary {
  totalQuantityTonnes: number;
  totalValueEur: number;
  averageImplicitPriceEurPerTonne: number;
  supplierCount: number;
  hhiIndex: number; // Herfindahl-Hirschman Index (0-10000)
  hhiClassification: 'UNCONCENTRATED' | 'MODERATE' | 'HIGH' | 'EXTREME';
  topSupplier: SupplierSummary | null;
  periodLabel: string;
  yoyQuantityChangePercent: number;
  yoyPriceChangePercent: number;
}

export interface AnomalyDetection {
  id: string;
  partnerCountryId: string;
  partnerCountryName: string;
  period: string;
  type: 'SPIKE' | 'DROP' | 'NEW_PARTNER' | 'EXIT_PARTNER';
  magnitudePercent: number;
  previousValue: number;
  currentValue: number;
  unit: string;
  observation: string;
  sourceId: string;
}

export interface SankeyData {
  nodes: { name: string; category?: string }[];
  links: { source: string; target: string; value: number }[];
}

export interface TimeseriesPoint {
  period: string; // '2023' or '2023-08'
  year: number;
  month?: number;
  quantityTonnes: number;
  valueEur: number;
  implicitPriceEurPerTonne: number;
}
