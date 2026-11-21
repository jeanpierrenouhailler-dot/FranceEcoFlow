import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ingestAllCustomsData, getIngestedFlows, getAuditReport } from '../server/data/ingestion/index.ts';
import { runDataQualityChecks } from '../server/data/ingestion/qualityChecker.ts';

describe('Quarantined historical data and provenance checks', () => {
  test('Unverified bundled files are reported and not loaded as trade flows', () => {
    const { flows, report, files } = ingestAllCustomsData();

    assert.equal(flows.length, 0);
    assert.equal(report.totalRecordsLoaded, 0);
    assert.equal(report.overallStatus, 'FAILED');
    assert.ok(files.length >= 2);
    assert.ok(files.every((file) => file.provenanceStatus === 'QUARANTINED'));
    assert.equal(report.checks.find((check) => check.checkId === 'CHECK_DATASET_PROVENANCE')?.status, 'FAILED');
  });

  test('Public ingestion accessors do not expose quarantined values', () => {
    assert.equal(getIngestedFlows().length, 0);
    assert.equal(getAuditReport().overallStatus, 'FAILED');
  });

  test('Quality checks fail rather than passing vacuously when no observations are loaded', () => {
    const report = runDataQualityChecks([], [], 0);
    assert.equal(report.overallStatus, 'FAILED');
    assert.ok(report.checks.every((check) => check.status === 'FAILED'));
  });
});
