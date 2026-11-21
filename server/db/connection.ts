import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DatabaseStatus {
  engine: 'PostgreSQL/PostGIS' | 'Unavailable';
  connected: boolean;
  version: string;
  postgisVersion?: string;
  poolActiveCount: number;
  poolIdleCount: number;
  totalQueriesExecuted: number;
  lastError?: string;
}

let pool: pg.Pool | null = null;
let isRealPostgresConnected = false;
let queriesCount = 0;
let lastConnectionError: string | undefined = undefined;
let actualPostgresVersion: string | undefined;
let actualPostgisVersion: string | undefined;

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl) {
  try {
    pool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 10000,
      max: 10,
    });

    pool.on('error', (err) => {
      console.warn('[PostgreSQL] Background pool error:', err.message);
      lastConnectionError = err.message;
      isRealPostgresConnected = false;
    });
  } catch (err: any) {
    console.warn('[PostgreSQL] Failed to initialize pg.Pool:', err.message);
    lastConnectionError = err.message;
    pool = null;
  }
}

export async function testConnection(): Promise<boolean> {
  if (!pool) {
    isRealPostgresConnected = false;
    lastConnectionError = 'DATABASE_URL is not configured.';
    return false;
  }
  try {
    const client = await pool.connect();
    try {
      const res = await client.query<{ version: string; postgis_version: string }>(
        'SELECT version(), PostGIS_Full_Version() AS postgis_version;'
      );
      actualPostgresVersion = res.rows[0]?.version;
      actualPostgisVersion = res.rows[0]?.postgis_version;
      isRealPostgresConnected = true;
      lastConnectionError = undefined;
      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    isRealPostgresConnected = false;
    actualPostgresVersion = undefined;
    actualPostgisVersion = undefined;
    lastConnectionError = err.message;
    return false;
  }
}

export async function executeQuery<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  queriesCount++;
  if (!pool || !isRealPostgresConnected) {
    throw new Error(lastConnectionError || 'PostgreSQL/PostGIS is not connected.');
  }

  try {
    return await pool.query<T>(text, params);
  } catch (err: any) {
    lastConnectionError = err.message;
    throw err;
  }
}

export function getDatabaseStatus(): DatabaseStatus {
  return {
    engine: isRealPostgresConnected ? 'PostgreSQL/PostGIS' : 'Unavailable',
    connected: isRealPostgresConnected,
    version: actualPostgresVersion || 'unavailable',
    postgisVersion: actualPostgisVersion,
    poolActiveCount: pool?.totalCount || 0,
    poolIdleCount: pool?.idleCount || 0,
    totalQueriesExecuted: queriesCount,
    lastError: lastConnectionError,
  };
}

export async function runMigrations(): Promise<{ success: boolean; message: string }> {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    return { success: false, message: 'schema.sql not found' };
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  if (!pool || !isRealPostgresConnected) {
    return { success: false, message: lastConnectionError || 'PostgreSQL/PostGIS is not connected.' };
  }

  let client: pg.PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    await client.query(schemaSql);
    await client.query('COMMIT');
    return { success: true, message: 'PostgreSQL/PostGIS schema applied successfully.' };
  } catch (err: any) {
    if (client) await client.query('ROLLBACK').catch(() => undefined);
    lastConnectionError = err.message;
    return { success: false, message: `Migration error: ${err.message}` };
  } finally {
    client?.release();
  }
}
