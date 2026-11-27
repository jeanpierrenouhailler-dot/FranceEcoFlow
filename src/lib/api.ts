import {
  Country,
  Product,
  Source,
  Dataset,
  EconomicFlow,
  TransportRoute,
  Infrastructure,
  FlowAnalysisSummary,
  SupplierSummary,
  AnomalyDetection,
  SankeyData,
  TimeseriesPoint,
  IngestionAuditReport,
  IngestedFileMetadata,
  RawCustomsSample,
  DatabaseStatus,
  SourceConnectorMeta,
  InseeIndicator,
  EnergyObservation,
} from '../types/index.ts';

export class ApiError extends Error {
  status: number;
  code?: string;
  isUnavailable: boolean;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.isUnavailable =
      status === 503 || status === 409 || code === 'NOT_AVAILABLE' || code === 'UNVERIFIED';
  }
}

async function fetchApi<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    if (isJson) {
      const payload = await response.json().catch(() => null);
      const message =
        (payload && typeof payload.error === 'string' && payload.error) ||
        `HTTP error ${response.status}`;
      const code = payload && typeof payload.status === 'string' ? payload.status : undefined;
      throw new ApiError(message, response.status, code);
    }
    throw new ApiError(`HTTP error ${response.status}`, response.status);
  }

  if (!isJson) {
    throw new ApiError(
      'Le service API ne répond pas en JSON (fallback HTML ou serveur API inactif).',
      503,
      'NOT_AVAILABLE',
    );
  }

  return response.json();
}

export interface FlowParams {
  reporter?: string;
  flow?: 'import' | 'export';
  product?: string;
  from?: number;
  to?: number;
  partner?: string;
}

function buildQuery(params?: FlowParams): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  if (params.reporter) searchParams.set('reporter', params.reporter);
  if (params.flow) searchParams.set('flow', params.flow);
  if (params.product) searchParams.set('product', params.product);
  if (params.from) searchParams.set('from', String(params.from));
  if (params.to) searchParams.set('to', String(params.to));
  if (params.partner && params.partner !== 'all') searchParams.set('partner', params.partner);
  const q = searchParams.toString();
  return q ? `?${q}` : '';
}

export const api = {
  async getSummary(params?: FlowParams): Promise<{ filters: any; summary: FlowAnalysisSummary }> {
    const q = buildQuery(params);
    return fetchApi(`/api/flows/summary${q}`);
  },

  async getPartners(
    params?: FlowParams,
  ): Promise<{ filters: any; count: number; data: SupplierSummary[] }> {
    const q = buildQuery(params);
    return fetchApi(`/api/flows/partners${q}`);
  },

  async getTimeseries(params?: FlowParams): Promise<{ filters: any; data: TimeseriesPoint[] }> {
    const q = buildQuery(params);
    return fetchApi(`/api/flows/timeseries${q}`);
  },

  async getSankey(params?: FlowParams): Promise<{ filters: any; data: SankeyData }> {
    const q = buildQuery(params);
    return fetchApi(`/api/flows/sankey${q}`);
  },

  async getAnomalies(
    product: string = 'crude_oil',
  ): Promise<{ productId: string; data: AnomalyDetection[] }> {
    return fetchApi(`/api/flows/anomalies?product=${product}`);
  },

  async getCountries(): Promise<{ count: number; data: Country[] }> {
    return fetchApi('/api/countries');
  },

  async getCountryDetail(id: string): Promise<{
    country: Country;
    summary: FlowAnalysisSummary;
    partnerRankings: SupplierSummary[];
    timeseries: TimeseriesPoint[];
    flows: EconomicFlow[];
    transportRoutes: TransportRoute[];
  }> {
    return fetchApi(`/api/countries/${id}`);
  },

  async getProducts(): Promise<{ categories: any[]; count: number; data: Product[] }> {
    return fetchApi('/api/products');
  },

  async getProductDetail(id: string): Promise<{
    product: Product;
    summary: FlowAnalysisSummary;
    partners: SupplierSummary[];
    timeseries: TimeseriesPoint[];
  }> {
    return fetchApi(`/api/products/${id}`);
  },

  async getInfrastructures(type?: string): Promise<{ count: number; data: Infrastructure[] }> {
    const q = type ? `?type=${type}` : '';
    return fetchApi(`/api/infrastructures${q}`);
  },

  async getTransportRoutes(partner?: string): Promise<{ count: number; data: TransportRoute[] }> {
    const q = partner ? `?partner=${partner}` : '';
    return fetchApi(`/api/transport-routes${q}`);
  },

  async getSources(): Promise<{ sources: Source[]; datasets: Dataset[] }> {
    return fetchApi('/api/sources');
  },

  async getIngestionReport(): Promise<{ data: IngestionAuditReport }> {
    return fetchApi('/api/ingestion/report');
  },

  async getIngestionFiles(): Promise<{ data: IngestedFileMetadata[] }> {
    return fetchApi('/api/ingestion/files');
  },

  async getRawCustomsSample(limit: number = 25): Promise<RawCustomsSample> {
    return fetchApi(`/api/ingestion/raw-sample?limit=${limit}`);
  },

  async getDatabaseStatus(): Promise<{ data: DatabaseStatus }> {
    return fetchApi('/api/database/status');
  },

  async getSpatialInfrastructuresWithin(
    lat: number,
    lng: number,
    radiusKm: number,
  ): Promise<{ center: [number, number]; radiusKm: number; count: number; data: any[] }> {
    return fetchApi(`/api/database/spatial/within?lat=${lat}&lng=${lng}&radius=${radiusKm}`);
  },

  async getSourceConnectors(): Promise<{ count: number; data: SourceConnectorMeta[] }> {
    return fetchApi('/api/sources/registry');
  },

  async getSourcesHealth(): Promise<{ data: { [sourceId: string]: any } }> {
    return fetchApi('/api/sources/health');
  },

  async getInseeIndicators(code?: string): Promise<{ count: number; data: InseeIndicator[] }> {
    const q = code ? `?code=${code}` : '';
    return fetchApi(`/api/sources/insee${q}`);
  },

  async getEnergyObservations(
    metric?: string,
  ): Promise<{ count: number; data: EnergyObservation[] }> {
    const q = metric ? `?metric=${metric}` : '';
    return fetchApi(`/api/sources/energy${q}`);
  },

  async triggerIngestion(): Promise<any> {
    return fetchApi('/api/sources/ingest', { method: 'POST' });
  },

  async resolveNC8Product(code: string): Promise<{ data: any }> {
    return fetchApi(`/api/products/resolve-nc8?code=${code}`);
  },

  async getNomenclatures(): Promise<{ count: number; data: any[] }> {
    return fetchApi('/api/products/nomenclatures');
  },
};
