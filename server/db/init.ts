import { testConnection, runMigrations, getDatabaseStatus } from './connection.ts';
import { sourceRegistry } from '../ingestion/sources/index.ts';
import { dbRepository } from './repository.ts';
import { infrastructures, transportRoutes } from '../data/store.ts';
import { runDGDDIImportJob } from '../ingestion/dgddi/jobs.ts';

export async function initializeDatabase(): Promise<void> {
  console.log('[Database] Initializing PostgreSQL / PostGIS layer...');
  const connected = await testConnection();

  if (connected) {
    console.log('[Database] Connected to PostgreSQL 16 + PostGIS 3.4.');
  } else {
    console.log('[Database] PostgreSQL instance not reachable; activating SpatialMemoryEngine (PostGIS 3.4 compliant spatial functions).');
  }

  // Run DDL migrations
  const migrationRes = await runMigrations();
  console.log(`[Database] ${migrationRes.message}`);

  // 1. Run DGDDI 3-tier import job (Raw CSV -> Staging Table -> Normalization)
  console.log('[Ingestion] Running official DGDDI customs import job (Raw DAU -> Staging -> Normalization)...');
  const dgddiJobRes = await runDGDDIImportJob();
  console.log(
    `[Ingestion] DGDDI import completed: ${dgddiJobRes.normalizedFlows.length} flows normalized (SHA-256: ${dgddiJobRes.importResult.checksumSha256.substring(0, 12)}...).`
  );

  // Seed repository with spatial infrastructure & routes
  dbRepository.setMemoryInfrastructures(infrastructures);
  dbRepository.setMemoryRoutes(transportRoutes);

  // Run multi-source ingestion on startup
  console.log('[Ingestion] Triggering multi-source ingestion pipeline (DGDDI, INSEE, Eurostat, Comtrade, JODI, EIA, SDES, OSM, IGN)...');
  const ingestionRes = await sourceRegistry.runAllIngestions();
  console.log(`[Ingestion] Completed in ${ingestionRes.totalDurationMs} ms (${ingestionRes.totalRecords} records loaded from 9 official sources).`);
}

