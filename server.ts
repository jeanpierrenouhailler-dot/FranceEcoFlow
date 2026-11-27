import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './server/api/routes.ts';
import { initializeDatabase } from './server/db/init.ts';
import { getDatabaseStatus } from './server/db/connection.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Initialize PostgreSQL / PostGIS and multi-source ingestion
  await initializeDatabase();

  const app = express();

  const portArgIndex = process.argv.indexOf('--port');
  const portFromArg = portArgIndex !== -1 ? Number(process.argv[portArgIndex + 1]) : null;
  const PORT = Number(process.env.PORT) || portFromArg || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  const configuredOrigins = new Set(
    (process.env.APP_URL || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => new URL(value).origin)
  );

  // Cross-origin API access is limited to explicitly configured application origins.
  app.use((req, res, next) => {
    const origin = req.get('origin');
    const originAllowed = Boolean(origin && (configuredOrigins.has(origin) || !isProduction));
    res.vary('Origin');
    if (origin && originAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    if (req.method === 'OPTIONS') {
      return res.sendStatus(originAllowed ? 204 : 403);
    }
    next();
  });

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    const databaseStatus = getDatabaseStatus();
    const healthy = databaseStatus.connected;
    const database = {
      ...databaseStatus,
      lastError: databaseStatus.lastError ? 'PostgreSQL/PostGIS is unavailable.' : undefined,
    };
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'healthy' : 'degraded',
      app: 'France Economic Flow Explorer',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database,
    });
  });

  // Never fall through to SPA HTML for unmatched /api/* endpoints
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Client handling
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const fs = await import('fs');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // SPA fallback in development mode
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found.' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FlowExplorer] Server running on http://0.0.0.0:${PORT} (ENV: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[FlowExplorer] Fatal server error:', err);
  process.exit(1);
});
