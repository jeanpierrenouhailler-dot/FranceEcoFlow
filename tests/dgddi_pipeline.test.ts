import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getLoadedEconomicFlows, runDGDDIImportJob } from '../server/ingestion/dgddi/jobs.ts';
import { isDatasetVerified } from '../server/data/ingestion/provenance.ts';
import { normalizeDGDDIRows } from '../server/normalization/dgddiNormalizer.ts';
import { RawDGDDIRow } from '../server/normalization/types.ts';

describe('DGDDI provenance gate and normalization', () => {
  test('Bundled DAU file stays quarantined and cannot be ingested', async () => {
    assert.equal(isDatasetVerified('server/ingestion/raw/dgddi_dau_2015_2026.csv'), false);
    assert.deepEqual(getLoadedEconomicFlows(), []);
    await assert.rejects(runDGDDIImportJob(), /provenance is unverified/);
  });

  test('Normalizer derives a unit price from a single explicit fixture', () => {
    const fixture: RawDGDDIRow = {
      annee: 2024,
      mois: 1,
      flux: '1',
      pays_declarant: 'FR',
      pays_partenaire: 'US',
      code_nc8: '27090090',
      valeur_caf_euros: 2000,
      masse_nette_kg: 1000,
      dau_reference: 'TEST-FIXTURE',
      source: 'test fixture only',
    };
    const { flows, report } = normalizeDGDDIRows([fixture]);

    assert.equal(report.rejectedRows, 0);
    assert.equal(flows.length, 1);
    assert.equal(flows[0].quantityTonnes, 1);
    assert.equal(flows[0].implicitPriceEurPerTonne, 2000);
  });
});
