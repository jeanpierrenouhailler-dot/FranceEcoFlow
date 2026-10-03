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
} from '../data/store.ts';

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

export default router;
