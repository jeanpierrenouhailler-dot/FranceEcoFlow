import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { importRawDGDDIFile } from '../server/ingestion/dgddi/rawImporter.ts';
import { normalizeDGDDIRows } from '../server/normalization/dgddiNormalizer.ts';
import { getLoadedEconomicFlows } from '../server/ingestion/dgddi/jobs.ts';

describe('DGDDI 3-Tier Pipeline Tests (Raw -> Staging -> Normalization)', () => {
  test('importRawDGDDIFile loads raw DAU declarations with preserved NC8 codes', () => {
    const rawResult = importRawDGDDIFile();
    assert.ok(rawResult.totalLinesRead > 150, `Expected >150 raw declarations, got ${rawResult.totalLinesRead}`);
    assert.ok(rawResult.checksumSha256.length === 64, 'Checksum must be 64-char hex SHA-256');

    // Verify all rows have raw NC8 code 27090090
    for (const r of rawResult.rows) {
      assert.ok(r.code_nc8 === '27090090' || r.code_nc8 === '27090010', `Unexpected NC code ${r.code_nc8}`);
      assert.ok(r.valeur_caf_euros > 0, 'Value must be positive');
      assert.ok(r.masse_nette_kg > 0, 'Mass must be positive');
    }
  });

  test('normalizeDGDDIRows preserves raw NC8 code and calculates strict accounting implicit price', () => {
    const rawResult = importRawDGDDIFile();
    const { flows, report } = normalizeDGDDIRows(rawResult.rows);

    assert.equal(report.rejectedRows, 0, 'No authentic rows should be rejected');
    assert.equal(flows.length, rawResult.rows.length);

    for (const flow of flows) {
      assert.ok(flow.rawNcCode, `Flow ${flow.id} must have rawNcCode`);
      assert.ok(flow.rawNcDescription, `Flow ${flow.id} must have rawNcDescription`);
      const expectedImplicit = Math.round((flow.valueEur / flow.quantityTonnes) * 100) / 100;
      assert.equal(
        flow.implicitPriceEurPerTonne,
        expectedImplicit,
        `Implicit price mismatch on flow ${flow.id}`
      );
    }
  });

  test('Monthly records are authentic individual customs declarations', () => {
    const flows = getLoadedEconomicFlows();
    const monthlyFlows = flows.filter((f) => f.periodMonth !== undefined);

    assert.ok(monthlyFlows.length >= 100, `Expected >= 100 monthly declarations, got ${monthlyFlows.length}`);

    // Verify each monthly record has a specific month 1-12 and authentic DAU reference
    for (const mf of monthlyFlows) {
      assert.ok(mf.periodMonth! >= 1 && mf.periodMonth! <= 12);
      assert.ok(mf.dauReference, `Monthly flow ${mf.id} must have dauReference`);
    }
  });
});
