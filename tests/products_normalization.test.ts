import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveProductFromNC8,
  validateNC8Code,
  getSupportedNomenclatures,
} from '../server/normalization/products.ts';
import { normalizeDGDDIRows } from '../server/normalization/dgddiNormalizer.ts';

describe('Automatic Product Normalization & NC8 Mapping Tests', () => {
  test('validateNC8Code checks 8-digit syntax strictly', () => {
    assert.equal(validateNC8Code('27090090'), true);
    assert.equal(validateNC8Code('27090010'), true);
    assert.equal(validateNC8Code('2709'), false);
    assert.equal(validateNC8Code('ABCDEFGH'), false);
  });

  test('resolveProductFromNC8 maps 27090090 to crude_oil in energy_hydrocarbons', () => {
    const res = resolveProductFromNC8('27090090');
    assert.equal(res.productId, 'crude_oil');
    assert.equal(res.categoryId, 'energy_hydrocarbons');
    assert.equal(res.hsHeading, '2709');
    assert.equal(res.statisticalUnit, 't');
    assert.equal(res.classificationConfidence, 'HIGH');
    assert.ok(res.nc8DescriptionFr.includes('Huiles brutes de pétrole'));
  });

  test('resolveProductFromNC8 maps 27090010 to crude_oil (condensats)', () => {
    const res = resolveProductFromNC8('27090010');
    assert.equal(res.productId, 'crude_oil');
    assert.equal(res.categoryId, 'energy_hydrocarbons');
    assert.equal(res.hsHeading, '2709');
    assert.equal(res.statisticalUnit, 't');
    assert.equal(res.classificationConfidence, 'HIGH');
  });

  test('resolveProductFromNC8 maps refined fuels (27101245 & 27101943) to refined_fuels', () => {
    const gasoline = resolveProductFromNC8('27101245');
    assert.equal(gasoline.productId, 'refined_fuels');
    assert.equal(gasoline.hsHeading, '2710');

    const diesel = resolveProductFromNC8('27101943');
    assert.equal(diesel.productId, 'refined_fuels');
    assert.equal(diesel.hsHeading, '2710');
  });

  test('resolveProductFromNC8 maps LNG (27111100) to lng in energy_gas', () => {
    const lng = resolveProductFromNC8('27111100');
    assert.equal(lng.productId, 'lng');
    assert.equal(lng.categoryId, 'energy_gas');
    assert.equal(lng.hsHeading, '2711');
  });

  test('resolveProductFromNC8 infers product for unlisted code by HS chapter', () => {
    const inferred = resolveProductFromNC8('27099999');
    assert.equal(inferred.productId, 'crude_oil');
    assert.equal(inferred.classificationConfidence, 'MEDIUM');
    assert.equal(resolveProductFromNC8('99999999').classificationConfidence, 'UNKNOWN');
  });

  test('resolveProductFromNC8 does not classify unknown codes as crude oil', () => {
    assert.equal(resolveProductFromNC8('99999999').productId, 'unknown');
    assert.equal(resolveProductFromNC8('2709').productId, 'unknown');
  });

  test('getSupportedNomenclatures returns entries from the local NC8 catalog', () => {
    const catalog = getSupportedNomenclatures();
    assert.ok(catalog.length >= 8);
    const codes = catalog.map((c) => c.nc8);
    assert.ok(codes.includes('27090090'));
    assert.ok(codes.includes('27090010'));
    assert.ok(codes.includes('27101245'));
    assert.ok(codes.includes('27111100'));
  });

  test('DGDDI normalizer dynamically assigns productId from NC8 resolution', () => {
    const dummyRaw = [
      {
        annee: 2024,
        mois: 0,
        flux: '1',
        pays_declarant: 'FR',
        pays_partenaire: 'US',
        code_nc8: '27090090',
        valeur_caf_euros: 5000000,
        masse_nette_kg: 10000000,
        source: 'DGDDI',
      },
    ];

    const { flows } = normalizeDGDDIRows(dummyRaw);
    assert.equal(flows.length, 1);
    assert.equal(flows[0].productId, 'crude_oil');
    assert.equal(flows[0].rawNcCode, '27090090');
    assert.equal(flows[0].confidence, 'UNKNOWN');
  });

  test('DGDDI normalizer rejects unknown product codes instead of assigning crude oil', () => {
    const { flows, report } = normalizeDGDDIRows([
      {
        annee: 2024,
        mois: 0,
        flux: '1',
        pays_declarant: 'FR',
        pays_partenaire: 'US',
        code_nc8: '99999999',
        valeur_caf_euros: 5000000,
        masse_nette_kg: 10000000,
        source: 'DGDDI',
      },
    ]);

    assert.equal(flows.length, 0);
    assert.equal(report.rejectedRows, 1);
  });
});
