import { Router, Request, Response, NextFunction } from 'express';
import {
  sources,
  datasets,
  countries,
  products,
  productCategories,
  calculateFlowSummary,
  getSupplierRankings,
  getTimeseriesData,
  getSankeyData,
  detectAnomalies,
  FlowQueryFilter,
  getIngestionReport,
  getRawSourceFiles,
} from '../data/store.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseUnavailableError, getDatabaseStatus } from '../db/connection.ts';
import { dbRepository } from '../db/repository.ts';
import { sourceRegistry } from '../ingestion/sources/index.ts';
import { resolveProductFromNC8, getSupportedNomenclatures } from '../normalization/products.ts';
import { isDatasetVerified } from '../data/ingestion/provenance.ts';
import { validateAdminBearerToken } from './adminAuth.ts';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

const router = Router();

function logApiFailure(operation: string, error: unknown): void {
  if (error instanceof DatabaseUnavailableError) {
    console.warn(`[API] ${operation} unavailable: PostgreSQL/PostGIS is not connected.`);
    return;
  }
  const errorName = error instanceof Error ? error.name : 'UnknownError';
  console.error(`[API] ${operation} failed (${errorName}).`);
}

function requireIngestionAdmin(req: Request, res: Response, next: NextFunction): void {
  const status = validateAdminBearerToken(req.get('authorization'), process.env.INGESTION_ADMIN_TOKEN);
  if (status === 'NOT_CONFIGURED') {
    res.status(503).json({ error: 'Ingestion administration is not configured.' });
    return;
  }
  if (status !== 'VALID') {
    res.status(401).json({ error: 'Administrator authentication is required.' });
    return;
  }
  next();
}

// Helper to extract and validate query filters
function extractFilters(req: Request): FlowQueryFilter {
  return {
    reporterCountryId: (req.query.reporter as string) || 'FR',
    flowType: (req.query.flow as 'import' | 'export') || 'import',
    productId: (req.query.product as string) || 'crude_oil',
    startYear: req.query.from ? parseInt(req.query.from as string, 10) : undefined,
    endYear: req.query.to ? parseInt(req.query.to as string, 10) : undefined,
    partnerCountryId: (req.query.partner as string) || undefined,
    periodType: (req.query.periodType as 'annual' | 'monthly') || 'annual',
  };
}

async function getPublishedFlowRows(filters: FlowQueryFilter, res: Response) {
  try {
    const rows = await dbRepository.findPublishedTradeFlows(filters);
    if (rows.length > 0) return rows;
    res.status(503).json({
      error: 'No validated, provenance-linked trade-flow observations are available in PostgreSQL.',
      status: 'NOT_AVAILABLE',
    });
  } catch (error) {
    logApiFailure('read published trade flows', error);
    res.status(503).json({ error: 'Published trade-flow database is unavailable.' });
  }
  return undefined;
}

// 1. GET /api/flows
router.get('/flows', async (req: Request, res: Response) => {
  try {
    const filters = extractFilters(req);
    const flows = await getPublishedFlowRows(filters, res);
    if (!flows) return;
    res.json({
      filters,
      count: flows.length,
      data: flows,
    });
  } catch (error) {
    logApiFailure('retrieve trade flows', error);
    res.status(500).json({ error: 'Failed to retrieve trade flows' });
  }
});

// 2. GET /api/flows/summary
router.get('/flows/summary', async (req: Request, res: Response) => {
  try {
    const filters = extractFilters(req);
    const flows = await getPublishedFlowRows(filters, res);
    if (!flows) return;
    const summary = calculateFlowSummary(filters, flows);
    res.json({
      filters,
      summary,
    });
  } catch (error) {
    logApiFailure('calculate flow summary', error);
    res.status(500).json({ error: 'Failed to calculate summary' });
  }
});

// 3. GET /api/flows/timeseries
router.get('/flows/timeseries', async (req: Request, res: Response) => {
  try {
    const filters = extractFilters(req);
    const flows = await getPublishedFlowRows(filters, res);
    if (!flows) return;
    const timeseries = getTimeseriesData(filters, flows);
    res.json({
      filters,
      data: timeseries,
    });
  } catch (error) {
    logApiFailure('retrieve timeseries', error);
    res.status(500).json({ error: 'Failed to retrieve timeseries' });
  }
});

// 4. GET /api/flows/partners
router.get('/flows/partners', async (req: Request, res: Response) => {
  try {
    const filters = extractFilters(req);
    const flows = await getPublishedFlowRows(filters, res);
    if (!flows) return;
    const partners = getSupplierRankings(filters, flows);
    res.json({
      filters,
      count: partners.length,
      data: partners,
    });
  } catch (error) {
    logApiFailure('retrieve partner rankings', error);
    res.status(500).json({ error: 'Failed to retrieve partner rankings' });
  }
});

// 5. GET /api/flows/sankey
router.get('/flows/sankey', async (req: Request, res: Response) => {
  try {
    const filters = extractFilters(req);
    const flows = await getPublishedFlowRows(filters, res);
    if (!flows) return;
    const sankey = getSankeyData(filters, flows);
    res.json({
      filters,
      data: sankey,
    });
  } catch (error) {
    logApiFailure('retrieve Sankey structure', error);
    res.status(500).json({ error: 'Failed to retrieve Sankey structure' });
  }
});

// 6. GET /api/flows/anomalies
router.get('/flows/anomalies', async (req: Request, res: Response) => {
  try {
    const productId = (req.query.product as string) || 'crude_oil';
    const flows = await getPublishedFlowRows(
      { reporterCountryId: 'FR', flowType: 'import', productId, periodType: 'annual' },
      res
    );
    if (!flows) return;
    const anomalies = detectAnomalies(productId, flows);
    res.json({
      productId,
      data: anomalies,
    });
  } catch (error) {
    logApiFailure('retrieve anomalies', error);
    res.status(500).json({ error: 'Failed to retrieve anomalies' });
  }
});

// 7. GET /api/countries
router.get('/countries', (_req: Request, res: Response) => {
  res.json({ count: countries.length, data: countries });
});

router.get('/countries/:id', async (req: Request, res: Response) => {
  try {
    const country = countries.find((c) => c.id.toUpperCase() === req.params.id.toUpperCase());
    if (!country) {
      return res.status(404).json({ error: `Country '${req.params.id}' not found` });
    }

    const filters = {
      reporterCountryId: 'FR',
      flowType: 'import' as const,
      productId: 'crude_oil',
      partnerCountryId: country.id,
      periodType: 'annual' as const,
    };
    const flows = await getPublishedFlowRows(filters, res);
    if (!flows) return;
    const partnerRankings = getSupplierRankings(filters, flows);
    const summary = calculateFlowSummary(filters, flows);
    const timeseries = getTimeseriesData(filters, flows);
    const relatedRoutes = (await dbRepository.findTransportRoutes()).filter((r) => r.sourcePartnerId === country.id);

    res.json({
      country,
      summary,
      partnerRankings,
      timeseries,
      flows,
      transportRoutes: relatedRoutes,
    });
  } catch (error) {
    logApiFailure('retrieve country data', error);
    res.status(500).json({ error: 'Failed to retrieve country data' });
  }
});

// 8. GET /api/products
router.get('/products', (_req: Request, res: Response) => {
  res.json({
    categories: productCategories,
    count: products.length,
    data: products,
  });
});

// GET /api/products/resolve-nc8 (Automated DGDDI NC8 -> Product normalizer)
router.get('/products/resolve-nc8', (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).json({ error: 'A nomenclature code is required.' });
  }
  const resolution = resolveProductFromNC8(code);
  res.json({ data: resolution });
});

// GET /api/products/nomenclatures (Local, unauthenticated NC8/HS mapping catalog)
router.get('/products/nomenclatures', (_req: Request, res: Response) => {
  const nomenclatures = getSupportedNomenclatures();
  res.json({ count: nomenclatures.length, data: nomenclatures });
});

router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = products.find((p) => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: `Product '${req.params.id}' not found` });
    }
    const filters = {
      reporterCountryId: 'FR',
      flowType: 'import' as const,
      productId: product.id,
      periodType: 'annual' as const,
    };
    const flows = await getPublishedFlowRows(filters, res);
    if (!flows) return;

    res.json({
      product,
      summary: calculateFlowSummary(filters, flows),
      partners: getSupplierRankings(filters, flows),
      timeseries: getTimeseriesData(filters, flows),
    });
  } catch (error) {
    logApiFailure('retrieve product data', error);
    res.status(500).json({ error: 'Failed to retrieve product data' });
  }
});

// 9. GET /api/infrastructures
router.get('/infrastructures', async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string | undefined;
    const list = await dbRepository.findInfrastructures(type);
    res.json({ count: list.length, data: list });
  } catch (error) {
    logApiFailure('retrieve infrastructures', error);
    res.status(503).json({ error: 'Infrastructure database is unavailable' });
  }
});

router.get('/infrastructures/:id', async (req: Request, res: Response) => {
  try {
    const item = await dbRepository.findInfrastructureById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: `Infrastructure '${req.params.id}' not found` });
    }
    res.json({ data: item });
  } catch (error) {
    logApiFailure('retrieve infrastructure', error);
    res.status(503).json({ error: 'Infrastructure database is unavailable' });
  }
});

// 10. GET /api/transport-routes
router.get('/transport-routes', async (req: Request, res: Response) => {
  try {
    const partner = req.query.partner as string;
    const allRoutes = await dbRepository.findTransportRoutes();
    const routes = partner && partner !== 'all'
      ? allRoutes.filter((route) => route.sourcePartnerId === partner)
      : allRoutes;
    res.json({ count: routes.length, data: routes });
  } catch (error) {
    logApiFailure('retrieve transport routes', error);
    res.status(503).json({ error: 'Transport route database is unavailable' });
  }
});

// 11. GET /api/sources
router.get('/sources', (_req: Request, res: Response) => {
  res.json({
    sources,
    datasets,
  });
});

// 12. GET /api/export
router.get('/export', async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as string) || 'json';
    const filters = extractFilters(req);
    const flows = await getPublishedFlowRows(filters, res);
    if (!flows) return;
    const summary = calculateFlowSummary(filters, flows);
    const partners = getSupplierRankings(filters, flows);

    if (format === 'csv') {
      const csvHeader =
        'Année;Mois;Pays Déclarant;Pays Partenaire;Code Produit;Flux;Volume (Tonnes);Valeur (Euros);Prix Implicite (EUR/t);Niveau Confiance;Source\n';
      const csvRows = flows
        .map((f) =>
          [
            f.periodYear,
            f.periodMonth || 'Annuel',
            f.reporterCountryId,
            f.partnerCountryId,
            f.productId,
            f.flowType,
            f.quantityTonnes,
            f.valueEur,
            f.implicitPriceEurPerTonne,
            f.confidence,
            f.sourceId,
          ].join(';')
        )
        .join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="france_economic_flows_${filters.startYear}_${filters.endYear}.csv"`
      );
      return res.send('\uFEFF' + csvHeader + csvRows);
    }

    res.json({
      metadata: {
        exportedAt: new Date().toISOString(),
        title: 'FranceEcoFlow — export de données',
        filters,
        summary,
      },
      partners,
      flows,
      sources,
    });
  } catch (error) {
    logApiFailure('export flows', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// 13. GET /api/ingestion/report
router.get('/ingestion/report', (_req: Request, res: Response) => {
  try {
    const report = getIngestionReport();
    res.json({ data: report });
  } catch (error) {
    logApiFailure('retrieve ingestion report', error);
    res.status(500).json({ error: 'Failed to retrieve ingestion report' });
  }
});

// 14. GET /api/ingestion/files
router.get('/ingestion/files', (_req: Request, res: Response) => {
  try {
    const files = getRawSourceFiles();
    res.json({ data: files });
  } catch (error) {
    logApiFailure('retrieve ingested files', error);
    res.status(500).json({ error: 'Failed to retrieve ingested files' });
  }
});

// 15. GET /api/ingestion/raw-sample
router.get('/ingestion/raw-sample', (req: Request, res: Response) => {
  try {
    if (!isDatasetVerified('server/ingestion/raw/dgddi_dau_2015_2026.csv')) {
      return res.status(409).json({
        error: 'The bundled DGDDI file is quarantined because its provenance is unverified.',
        status: 'UNVERIFIED',
      });
    }
    const rawDauPath = path.resolve(projectRoot, 'server/ingestion/raw/dgddi_dau_2015_2026.csv');
    if (!fs.existsSync(rawDauPath)) {
      return res.status(404).json({ error: 'Raw DAU dataset not found on disk' });
    }
    const content = fs.readFileSync(rawDauPath, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    const limit = Math.min(parseInt((req.query.limit as string) || '25', 10), 100);
    const sample = lines.slice(0, limit + 1);

    res.json({
      filePath: 'server/ingestion/raw/dgddi_dau_2015_2026.csv',
      header: sample[0],
      totalRows: lines.length - 1,
      rowsReturned: sample.length - 1,
      records: sample.slice(1).map((line, idx) => {
        const cols = line.split(';');
        return {
          rowId: idx + 1,
          year: cols[0],
          month: cols[1] === '0' ? 'Annuel' : cols[1],
          flow: cols[2] === '1' ? 'Import (1)' : 'Export (2)',
          reporter: cols[3],
          partner: cols[4],
          nc8: cols[5],
          valueEur: cols[6],
          netMassKg: cols[7],
          dauReference: cols[8],
          source: cols[9],
        };
      }),
    });
  } catch (error) {
    logApiFailure('read raw sample', error);
    res.status(500).json({ error: 'Failed to read raw sample' });
  }
});


// 16. GET /api/database/status
router.get('/database/status', (_req: Request, res: Response) => {
  const { lastError, ...status } = getDatabaseStatus();
  res.json({
    data: {
      ...status,
      lastError: lastError ? 'PostgreSQL/PostGIS is unavailable.' : undefined,
    },
  });
});

// 17. GET /api/database/spatial/within (PostGIS ST_DWithin query)
router.get('/database/spatial/within', async (req: Request, res: Response) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusKm = Number(req.query.radius);
    if (
      !Number.isFinite(lat) || lat < -90 || lat > 90 ||
      !Number.isFinite(lng) || lng < -180 || lng > 180 ||
      !Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 20038
    ) {
      return res.status(400).json({ error: 'Valid lat, lng, and radius query parameters are required.' });
    }

    const results = await dbRepository.findInfrastructuresWithinRadius(lng, lat, radiusKm);
    res.json({
      center: [lng, lat],
      radiusKm,
      count: results.length,
      data: results,
    });
  } catch (err) {
    logApiFailure('run spatial query', err);
    const status = err instanceof DatabaseUnavailableError ? 503 : 500;
    res.status(status).json({ error: status === 503 ? 'Spatial database is unavailable' : 'Spatial query failed' });
  }
});

// 18. GET /api/sources/registry (All 9 Source Connectors metadata)
router.get('/sources/registry', (_req: Request, res: Response) => {
  const connectors = sourceRegistry.getAllConnectors().map((c) => ({
    id: c.id,
    name: c.name,
    provider: c.provider,
    type: c.type,
    description: c.description,
    officialUrl: c.officialUrl,
  }));
  res.json({ count: connectors.length, data: connectors });
});

// 19. GET /api/sources/health (Live health check across 9 sources)
router.get('/sources/health', async (_req: Request, res: Response) => {
  const healthResults = await sourceRegistry.checkAllConnectorsHealth();
  res.json({ data: healthResults });
});

// 20. GET /api/sources/insee (INSEE Macroeconomic series)
router.get('/sources/insee', async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    const indicators = await dbRepository.findInseeIndicators(code);
    res.json({ count: indicators.length, data: indicators });
  } catch (error) {
    logApiFailure('retrieve INSEE observations', error);
    res.status(503).json({ error: 'INSEE observations are unavailable from PostgreSQL.' });
  }
});


// 21. GET /api/sources/energy (JODI / SDES energy balance observations)
router.get('/sources/energy', async (req: Request, res: Response) => {
  try {
    const metric = req.query.metric as string;
    const observations = await dbRepository.findEnergyObservations(metric);
    res.json({ count: observations.length, data: observations });
  } catch (error) {
    logApiFailure('retrieve energy observations', error);
    res.status(503).json({ error: 'Energy observations are unavailable from PostgreSQL.' });
  }
});

// 22. POST /api/sources/ingest (Trigger on-demand multi-source ingestion)
router.post('/sources/ingest', requireIngestionAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await sourceRegistry.runAllIngestions();
    const failedSources = Object.entries(result.results)
      .filter(([, ingestion]) => ingestion.status !== 'SUCCESS' && ingestion.status !== 'PARTIAL')
      .map(([sourceId]) => sourceId);
    const success = failedSources.length === 0;
    res.status(success ? 200 : 503).json({
      success,
      message: success
        ? `Ingestion completed: ${result.totalRecords} records in ${result.totalDurationMs} ms.`
        : `Ingestion unavailable for ${failedSources.length} source(s): ${failedSources.join(', ')}.`,
      data: result,
    });
  } catch (err) {
    logApiFailure('run source ingestion', err);
    res.status(500).json({ error: 'Ingestion pipeline failed' });
  }
});

export default router;




