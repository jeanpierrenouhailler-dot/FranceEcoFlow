import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ingestAllCustomsData, getIngestedFlows, getAuditReport } from '../server/data/ingestion/index.ts';

describe('Raw Customs Ingestion & Quality Audit Tests', () => {
  test('Ingestion loads all authentic DGDDI annual and monthly records', () => {
    const { flows, report, files } = ingestAllCustomsData();

    assert.ok(flows.length > 100, `Expected >100 flows, got ${flows.length}`);
    assert.ok(files.length >= 2, `Expected at least 2 raw files loaded, got ${files.length}`);
    assert.equal(report.overallStatus, 'PASSED', 'Overall audit status must be PASSED');
  });

  test('Data quality check ensures 0 negative values and valid implicit prices', () => {
    const report = getAuditReport();
    const nonNegativeCheck = report.checks.find((c) => c.checkId === 'CHECK_NON_NEGATIVE_VALUES');
    assert.ok(nonNegativeCheck);
    assert.equal(nonNegativeCheck.status, 'PASSED');
    assert.equal(nonNegativeCheck.failedCount, 0);

    const priceCheck = report.checks.find((c) => c.checkId === 'CHECK_IMPLICIT_PRICE_COHERENCE');
    assert.ok(priceCheck);
    assert.equal(priceCheck.status, 'PASSED');
    assert.equal(priceCheck.failedCount, 0);
  });

  test('Temporal completeness covers 2015 to 2026 without gap', () => {
    const flows = getIngestedFlows();
    const annualFlows = flows.filter((f) => f.periodMonth === undefined);
    const years = new Set(annualFlows.map((f) => f.periodYear));

    for (let yr = 2015; yr <= 2026; yr++) {
      assert.ok(years.has(yr), `Year ${yr} must be present in annual records`);
    }
  });

  test('Implicit price is strictly computed from declared value and net mass', () => {
    const flows = getIngestedFlows();
    for (const f of flows) {
      const expected = Math.round((f.valueEur / f.quantityTonnes) * 100) / 100;
      assert.equal(f.implicitPriceEurPerTonne, expected, `Mismatch for flow ${f.id}`);
    }
  });
});
