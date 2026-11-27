import pg from 'pg';
import crypto from 'crypto';
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
        'SELECT version(), PostGIS_Full_Version() AS postgis_version;',
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

export class DatabaseUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseUnavailableError';
  }
}

export async function executeQuery<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[],
): Promise<pg.QueryResult<T>> {
  queriesCount++;
  if (!pool || !isRealPostgresConnected) {
    throw new DatabaseUnavailableError(
      lastConnectionError || 'PostgreSQL/PostGIS is not connected.',
    );
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
  if (!pool || !isRealPostgresConnected) {
    return {
      success: false,
      message: lastConnectionError || 'PostgreSQL/PostGIS is not connected.',
    };
  }

  const migrationsPath = path.resolve(__dirname, '../../database/migrations');
  if (!fs.existsSync(migrationsPath)) {
    return { success: false, message: 'Database migrations directory not found.' };
  }
  const migrationFiles = fs
    .readdirSync(migrationsPath)
    .filter((name) => /^\d+_[a-z0-9_-]+\.sql$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (migrationFiles.length === 0) {
    return { success: false, message: 'No versioned database migrations were found.' };
  }

  let client: pg.PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query("SELECT pg_advisory_lock(hashtext('franceecoflow:schema-migrations'))");
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        checksum_sha256 CHAR(64) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    let appliedCount = 0;
    for (const fileName of migrationFiles) {
      const version = fileName.slice(0, -'.sql'.length);
      const sql = fs.readFileSync(path.join(migrationsPath, fileName), 'utf-8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      const existing = await client.query<{ checksum_sha256: string }>(
        'SELECT checksum_sha256 FROM schema_migrations WHERE version = $1;',
        [version],
      );
      if (existing.rows.length > 0) {
        if (existing.rows[0].checksum_sha256.trim() !== checksum) {
          throw new Error(
            `Applied migration ${version} has changed; create a new migration instead.`,
          );
        }
        continue;
      }

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version, checksum_sha256) VALUES ($1, $2);',
          [version, checksum],
        );
        await client.query('COMMIT');
        appliedCount++;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    return {
      success: true,
      message:
        appliedCount === 0
          ? 'Database migrations are up to date.'
          : `${appliedCount} database migration(s) applied successfully.`,
    };
  } catch (err: any) {
    lastConnectionError = err.message;
    return { success: false, message: `Migration error: ${err.message}` };
  } finally {
    if (client) {
      await client
        .query("SELECT pg_advisory_unlock(hashtext('franceecoflow:schema-migrations'))")
        .catch(() => undefined);
      client.release();
    }
  }
}
