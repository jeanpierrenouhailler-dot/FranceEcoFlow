import { testConnection, runMigrations, getDatabaseStatus } from './connection.ts';

export async function initializeDatabase(): Promise<void> {
  console.log('[Database] Initializing PostgreSQL / PostGIS layer...');
  const connected = await testConnection();

  if (!connected) {
    const message = getDatabaseStatus().lastError || 'PostgreSQL/PostGIS is unavailable.';
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Production startup requires a working PostgreSQL/PostGIS connection: ${message}`);
    }
    console.warn(`[Database] PostgreSQL/PostGIS unavailable; database-backed APIs will fail explicitly: ${message}`);
    return;
  }

  const migrationRes = await runMigrations();
  if (!migrationRes.success) {
    throw new Error(`Database schema migration failed: ${migrationRes.message}`);
  }
  console.log(`[Database] ${migrationRes.message}`);
}

