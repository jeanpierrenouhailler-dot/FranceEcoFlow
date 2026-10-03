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
} from '../types/index.ts';

const CACHE_PREFIX = 'fefe_cache_';

function getLocalCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.data as T;
  } catch {
    return null;
  }
}

function setLocalCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch {
    // Ignore quota errors
  }
}

async function fetchWithCache<T>(url: string, cacheKey: string): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const json = await response.json();
    setLocalCache(cacheKey, json);
    return json;
  } catch (err) {
    const cached = getLocalCache<T>(cacheKey);
    if (cached) {
      console.warn(`[API] Network offline or request failed. Serving cached fallback for '${cacheKey}'`);
      return cached;
    }
    throw err;
  }
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
    return fetchWithCache(`/api/flows/summary${q}`, `summary_${q}`);
  },

  async getPartners(params?: FlowParams): Promise<{ filters: any; count: number; data: SupplierSummary[] }> {
    const q = buildQuery(params);
    return fetchWithCache(`/api/flows/partners${q}`, `partners_${q}`);
  },

  async getTimeseries(params?: FlowParams): Promise<{ filters: any; data: TimeseriesPoint[] }> {
    const q = buildQuery(params);
    return fetchWithCache(`/api/flows/timeseries${q}`, `timeseries_${q}`);
  },

  async getSankey(params?: FlowParams): Promise<{ filters: any; data: SankeyData }> {
    const q = buildQuery(params);
    return fetchWithCache(`/api/flows/sankey${q}`, `sankey_${q}`);
  },

  async getAnomalies(product: string = 'crude_oil'): Promise<{ productId: string; data: AnomalyDetection[] }> {
    return fetchWithCache(`/api/flows/anomalies?product=${product}`, `anomalies_${product}`);
  },

  async getCountries(): Promise<{ count: number; data: Country[] }> {
    return fetchWithCache('/api/countries', 'countries_list');
  },

  async getCountryDetail(id: string): Promise<{
    country: Country;
    summary: FlowAnalysisSummary;
    partnerRankings: SupplierSummary[];
    timeseries: TimeseriesPoint[];
    flows: EconomicFlow[];
    transportRoutes: TransportRoute[];
  }> {
    return fetchWithCache(`/api/countries/${id}`, `country_${id}`);
  },

  async getProducts(): Promise<{ categories: any[]; count: number; data: Product[] }> {
    return fetchWithCache('/api/products', 'products_list');
  },

  async getProductDetail(id: string): Promise<{
    product: Product;
    summary: FlowAnalysisSummary;
    partners: SupplierSummary[];
    timeseries: TimeseriesPoint[];
  }> {
    return fetchWithCache(`/api/products/${id}`, `product_${id}`);
  },

  async getInfrastructures(type?: string): Promise<{ count: number; data: Infrastructure[] }> {
    const q = type ? `?type=${type}` : '';
    return fetchWithCache(`/api/infrastructures${q}`, `infrastructures_${type || 'all'}`);
  },

  async getTransportRoutes(partner?: string): Promise<{ count: number; data: TransportRoute[] }> {
    const q = partner ? `?partner=${partner}` : '';
    return fetchWithCache(`/api/transport-routes${q}`, `routes_${partner || 'all'}`);
  },

  async getSources(): Promise<{ sources: Source[]; datasets: Dataset[] }> {
    return fetchWithCache('/api/sources', 'sources_list');
  },
};
