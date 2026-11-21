import { Router, Request, Response } from 'express';
import {
  sources,
  datasets,
  countries,
  products,
  productCategories,
  filterFlows,
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
import { getDatabaseStatus } from '../db/connection.ts';
import { dbRepository } from '../db/repository.ts';
import { sourceRegistry } from '../ingestion/sources/index.ts';
import { resolveProductFromNC8, getSupportedNomenclatures } from '../normalization/products.ts';
import { isDatasetVerified } from '../data/ingestion/provenance.ts';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

const router = Router();

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

function requireVerifiedFlowData(res: Response): boolean {
  const report = getIngestionReport();
  if (report.overallStatus === 'PASSED' && report.totalRecordsLoaded > 0) return true;
  res.status(503).json({
    error: 'No provenance-verified trade-flow dataset is available.',
    status: 'NOT_AVAILABLE',
    ingestionReport: report,
  });
  return false;
}

// 1. GET /api/flows
router.get('/flows', (req: Request, res: Response) => {
  try {
    if (!requireVerifiedFlowData(res)) return;
    const filters = extractFilters(req);
    const flows = filterFlows(filters);
    res.json({
      filters,
      count: flows.length,
      data: flows,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve trade flows', details: String(error) });
  }
});

// 2. GET /api/flows/summary
router.get('/flows/summary', (req: Request, res: Response) => {
  try {
    if (!requireVerifiedFlowData(res)) return;
    const filters = extractFilters(req);
    const summary = calculateFlowSummary(filters);
    res.json({
      filters,
      summary,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate summary', details: String(error) });
  }
});

// 3. GET /api/flows/timeseries
router.get('/flows/timeseries', (req: Request, res: Response) => {
  try {
    if (!requireVerifiedFlowData(res)) return;
    const filters = extractFilters(req);
    const timeseries = getTimeseriesData(filters);
    res.json({
      filters,
      data: timeseries,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve timeseries', details: String(error) });
  }
});

// 4. GET /api/flows/partners
router.get('/flows/partners', (req: Request, res: Response) => {
  try {
    if (!requireVerifiedFlowData(res)) return;
    const filters = extractFilters(req);
    const partners = getSupplierRankings(filters);
    res.json({
      filters,
      count: partners.length,
      data: partners,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve partner rankings', details: String(error) });
  }
});

// 5. GET /api/flows/sankey
router.get('/flows/sankey', (req: Request, res: Response) => {
  try {
    if (!requireVerifiedFlowData(res)) return;
    const filters = extractFilters(req);
    const sankey = getSankeyData(filters);
    res.json({
      filters,
      data: sankey,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve Sankey structure', details: String(error) });
  }
});

// 6. GET /api/flows/anomalies
router.get('/flows/anomalies', (req: Request, res: Response) => {
  try {
    if (!requireVerifiedFlowData(res)) return;
    const productId = (req.query.product as string) || 'crude_oil';
    const anomalies = detectAnomalies(productId);
    res.json({
      productId,
      data: anomalies,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve anomalies', details: String(error) });
  }
});

// 7. GET /api/countries
router.get('/countries', (_req: Request, res: Response) => {
  res.json({ count: countries.length, data: countries });
});

router.get('/countries/:id', async (req: Request, res: Response) => {
  if (!requireVerifiedFlowData(res)) return;
  try {
    const country = countries.find((c) => c.id.toUpperCase() === req.params.id.toUpperCase());
    if (!country) {
      return res.status(404).json({ error: `Country '${req.params.id}' not found` });
    }

    const flows = filterFlows({ partnerCountryId: country.id, periodType: 'annual' });
    const partnerRankings = getSupplierRankings({ partnerCountryId: country.id });
    const summary = calculateFlowSummary({ partnerCountryId: country.id });
    const timeseries = getTimeseriesData({ partnerCountryId: country.id });
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
    res.status(500).json({ error: 'Failed to retrieve country data', details: String(error) });
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

// GET /api/products/nomenclatures (Catalog of supported NC8/HS classifications)
router.get('/products/nomenclatures', (_req: Request, res: Response) => {
  const nomenclatures = getSupportedNomenclatures();
  res.json({ count: nomenclatures.length, data: nomenclatures });
});

router.get('/products/:id', (req: Request, res: Response) => {
  if (!requireVerifiedFlowData(res)) return;
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: `Product '${req.params.id}' not found` });
  }
  const summary = calculateFlowSummary({ productId: product.id });
  const partners = getSupplierRankings({ productId: product.id });
  const timeseries = getTimeseriesData({ productId: product.id });

  res.json({
    product,
    summary,
    partners,
    timeseries,
  });
});

// 9. GET /api/infrastructures
router.get('/infrastructures', async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string | undefined;
    const list = await dbRepository.findInfrastructures(type);
    res.json({ count: list.length, data: list });
  } catch (error) {
    res.status(503).json({ error: 'Infrastructure database is unavailable', details: String(error) });
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
    res.status(503).json({ error: 'Infrastructure database is unavailable', details: String(error) });
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
    res.status(503).json({ error: 'Transport route database is unavailable', details: String(error) });
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
router.get('/export', (req: Request, res: Response) => {
  try {
    if (!requireVerifiedFlowData(res)) return;
    const format = (req.query.format as string) || 'json';
    const filters = extractFilters(req);
    const flows = filterFlows(filters);
    const summary = calculateFlowSummary(filters);
    const partners = getSupplierRankings(filters);

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
    res.status(500).json({ error: 'Export failed', details: String(error) });
  }
});

// 13. GET /api/ingestion/report
router.get('/ingestion/report', (_req: Request, res: Response) => {
  try {
    const report = getIngestionReport();
    res.json({ data: report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve ingestion report', details: String(error) });
  }
});

// 14. GET /api/ingestion/files
router.get('/ingestion/files', (_req: Request, res: Response) => {
  try {
    const files = getRawSourceFiles();
    res.json({ data: files });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve ingested files', details: String(error) });
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
    res.status(500).json({ error: 'Failed to read raw sample', details: String(error) });
  }
});


// 16. GET /api/database/status
router.get('/database/status', (_req: Request, res: Response) => {
  res.json({ data: getDatabaseStatus() });
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
    res.status(500).json({ error: 'Spatial query failed', details: String(err) });
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
    res.status(503).json({ error: 'INSEE observations are unavailable from PostgreSQL.', details: String(error) });
  }
});


// 21. GET /api/sources/energy (JODI / SDES energy balance observations)
router.get('/sources/energy', async (req: Request, res: Response) => {
  try {
    const metric = req.query.metric as string;
    const observations = await dbRepository.findEnergyObservations(metric);
    res.json({ count: observations.length, data: observations });
  } catch (error) {
    res.status(503).json({ error: 'Energy observations are unavailable from PostgreSQL.', details: String(error) });
  }
});

// 22. POST /api/sources/ingest (Trigger on-demand multi-source ingestion)
router.post('/sources/ingest', async (_req: Request, res: Response) => {
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
    res.status(500).json({ error: 'Ingestion pipeline failed', details: String(err) });
  }
});

export default router;




