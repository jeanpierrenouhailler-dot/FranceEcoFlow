import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sourceRegistry, SourceRegistry } from '../server/ingestion/sources/index.ts';
import { dbRepository } from '../server/db/repository.ts';
import { getDatabaseStatus } from '../server/db/connection.ts';
import { SourceConnector } from '../server/ingestion/sources/types.ts';

describe('Production source and database safeguards', () => {
  test('All 9 source connectors are registered', () => {
    const connectors = sourceRegistry.getAllConnectors();
    assert.equal(connectors.length, 9);

    const expectedIds = [
      'dgddi',
      'insee',
      'eurostat',
      'comtrade',
      'jodi',
      'eia',
      'sdes',
      'osm',
      'ign',
    ];
    assert.deepEqual(
      connectors.map((connector) => connector.id),
      expectedIds,
    );
  });

  test('Ingestion registry never exposes synthetic connector observations', async () => {
    const result = await sourceRegistry.runAllIngestions();

    assert.equal(result.totalRecords, 0);
    assert.equal(Object.keys(result.results).length, 9);
    for (const ingestion of Object.values(result.results)) {
      assert.equal(ingestion.status, 'NOT_AVAILABLE');
      assert.equal(ingestion.recordsCount, 0);
      assert.deepEqual(ingestion.records, []);
    }
  });

  test('Source health does not report unimplemented connectors as reachable', async () => {
    const health = await sourceRegistry.checkAllConnectorsHealth();
    for (const connectorHealth of Object.values(health)) {
      assert.equal(connectorHealth.reachable, false);
      assert.equal(connectorHealth.status, 'NOT_AVAILABLE');
    }
  });

  test('Database status contains no simulated PostgreSQL or PostGIS versions', () => {
    const status = getDatabaseStatus();
    assert.equal(status.connected, false);
    assert.equal(status.engine, 'Unavailable');
    assert.equal(status.version, 'unavailable');
    assert.equal(status.postgisVersion, undefined);
  });

  test('Database repository propagates unavailable-connection errors', async () => {
    await assert.rejects(
      dbRepository.findTransportRoutes(),
      /DATABASE_URL is not configured|PostgreSQL\/PostGIS is not connected/,
    );
  });

  test('An empty extraction is failed rather than a successful partial ingestion', async () => {
    const registry = new SourceRegistry();
    const connector: SourceConnector = {
      id: 'empty-fixture',
      liveExtractionImplemented: true,
      name: 'Empty fixture',
      provider: 'Test',
      type: 'file',
      description: 'Test connector',
      officialUrl: 'https://example.invalid',
      fetchRaw: async () => [],
      parse: async () => [],
      normalize: async (records) => records,
      validate: async () => ({ valid: true, errors: [] }),
      healthCheck: async () => ({
        reachable: true,
        latencyMs: 1,
        message: 'Test only',
        lastCheckedAt: new Date().toISOString(),
      }),
      run: async () => ({
        sourceId: 'empty-fixture',
        status: 'PARTIAL',
        recordsCount: 0,
        durationMs: 1,
        records: [],
        warnings: [],
      }),
    };
    registry.register(connector);

    const result = await registry.runAllIngestions();

    assert.equal(result.results['empty-fixture'].status, 'FAILED');
    assert.equal(result.totalRecords, 0);
  });
});
