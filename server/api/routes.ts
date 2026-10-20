import { Router, Request, Response } from 'express';
import {
  sources,
  datasets,
  countries,
  products,
  productCategories,
  infrastructures,
  transportRoutes,
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
    startYear: req.query.from ? parseInt(req.query.from as string, 10) : 2015,
    endYear: req.query.to ? parseInt(req.query.to as string, 10) : 2026,
    partnerCountryId: (req.query.partner as string) || undefined,
    periodType: (req.query.periodType as 'annual' | 'monthly') || 'annual',
  };
}

// 1. GET /api/flows
router.get('/flows', (req: Request, res: Response) => {
  try {
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

router.get('/countries/:id', (req: Request, res: Response) => {
  const country = countries.find((c) => c.id.toUpperCase() === req.params.id.toUpperCase());
  if (!country) {
    return res.status(404).json({ error: `Country '${req.params.id}' not found` });
  }

  // Country specific flows with France
  const flows = filterFlows({ partnerCountryId: country.id, periodType: 'annual' });
  const partnerRankings = getSupplierRankings({ partnerCountryId: country.id });
  const summary = calculateFlowSummary({ partnerCountryId: country.id });
  const timeseries = getTimeseriesData({ partnerCountryId: country.id });
  const relatedRoutes = transportRoutes.filter((r) => r.sourcePartnerId === country.id);

  res.json({
    country,
    summary,
    partnerRankings,
    timeseries,
    flows,
    transportRoutes: relatedRoutes,
  });
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
  const code = (req.query.code as string) || '27090090';
  const resolution = resolveProductFromNC8(code);
  res.json({ data: resolution });
});

// GET /api/products/nomenclatures (Catalog of supported NC8/HS classifications)
router.get('/products/nomenclatures', (_req: Request, res: Response) => {
  const nomenclatures = getSupportedNomenclatures();
  res.json({ count: nomenclatures.length, data: nomenclatures });
});

router.get('/products/:id', (req: Request, res: Response) => {

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
router.get('/infrastructures', (req: Request, res: Response) => {
  const type = req.query.type as string;
  let list = infrastructures;
  if (type) {
    list = list.filter((i) => i.type === type);
  }
  res.json({ count: list.length, data: list });
});

router.get('/infrastructures/:id', (req: Request, res: Response) => {
  const item = infrastructures.find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: `Infrastructure '${req.params.id}' not found` });
  }
  res.json({ data: item });
});

// 10. GET /api/transport-routes
router.get('/transport-routes', (req: Request, res: Response) => {
  const partner = req.query.partner as string;
  let routes = transportRoutes;
  if (partner && partner !== 'all') {
    routes = routes.filter((r) => r.sourcePartnerId === partner);
  }
  res.json({ count: routes.length, data: routes });
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
        title: 'France Economic Flow Explorer — Export officiel',
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
    const lat = parseFloat((req.query.lat as string) || '43.433'); // default Fos-sur-Mer
    const lng = parseFloat((req.query.lng as string) || '4.885');
    const radiusKm = parseFloat((req.query.radius as string) || '150');

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
  const code = req.query.code as string;
  const indicators = await dbRepository.findInseeIndicators(code);
  res.json({ count: indicators.length, data: indicators });
});


// 21. GET /api/sources/energy (JODI / SDES energy balance observations)
router.get('/sources/energy', async (req: Request, res: Response) => {
  const metric = req.query.metric as string;
  const observations = await dbRepository.findEnergyObservations(metric);
  res.json({ count: observations.length, data: observations });
});

// 22. POST /api/sources/ingest (Trigger on-demand multi-source ingestion)
router.post('/sources/ingest', async (_req: Request, res: Response) => {
  try {
    const result = await sourceRegistry.runAllIngestions();
    res.json({
      success: true,
      message: `Ingestion completed: ${result.totalRecords} records across 9 sources in ${result.totalDurationMs} ms.`,
      data: result,
    });
  } catch (err) {
    res.status(500).json({ error: 'Ingestion pipeline failed', details: String(err) });
  }
});

export default router;




