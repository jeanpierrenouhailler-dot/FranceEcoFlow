import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sourceRegistry } from '../server/ingestion/sources/index.ts';
import { dbRepository } from '../server/db/repository.ts';
import { getDatabaseStatus } from '../server/db/connection.ts';

describe('PostgreSQL / PostGIS & 9 Source Connectors Tests', () => {
  test('All 9 Source Connectors are properly registered', () => {
    const connectors = sourceRegistry.getAllConnectors();
    assert.equal(connectors.length, 9, 'Must have exactly 9 registered source connectors');

    const expectedIds = ['dgddi', 'insee', 'eurostat', 'comtrade', 'jodi', 'eia', 'sdes', 'osm', 'ign'];
    for (const expectedId of expectedIds) {
      const conn = sourceRegistry.getConnector(expectedId);
      assert.ok(conn, `Connector ${expectedId} must exist`);
      assert.equal(conn?.id, expectedId);
    }
  });

  test('Multi-source ingestion pipeline executes across all 9 connectors', async () => {
    const res = await sourceRegistry.runAllIngestions();
    assert.ok(res.totalRecords > 100, `Expected >100 records, got ${res.totalRecords}`);
    assert.ok(res.totalDurationMs >= 0);

    // Verify DGDDI records
    const dgddiRes = res.results['dgddi'];
    assert.ok(dgddiRes.recordsCount > 0);

    // Verify INSEE records
    const inseeRes = res.results['insee'];
    assert.ok(inseeRes.recordsCount > 0);

    // Verify JODI & SDES observations
    const jodiRes = res.results['jodi'];
    assert.ok(jodiRes.recordsCount > 0);
    const sdesRes = res.results['sdes'];
    assert.ok(sdesRes.recordsCount > 0);
  });

  test('PostGIS ST_DWithin spatial query executes and filters within radius', async () => {
    // Center at Fos-sur-Mer / Lavéra
    const fosLng = 4.885;
    const fosLat = 43.433;

    // Radius 50km should include Port de Fos, Raffinerie de Lavéra
    const closeResults = await dbRepository.findInfrastructuresWithinRadius(fosLng, fosLat, 50);
    assert.ok(closeResults.length >= 2, `Expected at least 2 facilities within 50km of Fos, got ${closeResults.length}`);

    // Radius 250km should also include Feyzin (near Lyon, ~250km north via SPSE pipeline)
    const wideResults = await dbRepository.findInfrastructuresWithinRadius(fosLng, fosLat, 300);
    assert.ok(wideResults.length > closeResults.length, '300km radius must return more facilities than 50km');
    const feyzin = wideResults.find((w) => w.name.includes('Feyzin'));
    assert.ok(feyzin, 'Feyzin refinery must be found within 300km of Fos');
  });

  test('Database connection status returns PostGIS compliant engine specifications', () => {
    const status = getDatabaseStatus();
    assert.ok(status.engine);
    assert.ok(status.postgisVersion?.includes('3.4'));
    assert.equal(typeof status.totalQueriesExecuted, 'number');
  });
});
