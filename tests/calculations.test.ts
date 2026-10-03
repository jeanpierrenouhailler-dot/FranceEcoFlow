import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHHI,
  getHHIInterpretation,
  formatTonnes,
  formatCurrencyEur,
  formatPricePerTonne,
  formatPercent,
} from '../src/lib/calculations.ts';

describe('Economic Flow Calculation Tests', () => {
  test('HHI calculation with equal shares', () => {
    // 4 equal partners with 25% share each: 4 * 25^2 = 4 * 625 = 2500
    const hhi = calculateHHI([25, 25, 25, 25]);
    assert.equal(hhi, 2500);
  });

  test('HHI calculation with diversified shares', () => {
    // 10 partners with 10% each: 10 * 100 = 1000
    const hhi = calculateHHI([10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
    assert.equal(hhi, 1000);
    const interp = getHHIInterpretation(hhi);
    assert.equal(interp.level, 'MODÉRÉE');
  });

  test('HHI calculation with extreme concentration (monopoly)', () => {
    // 1 single supplier 100%: 100^2 = 10000
    const hhi = calculateHHI([100]);
    assert.equal(hhi, 10000);
    const interp = getHHIInterpretation(hhi);
    assert.equal(interp.level, 'TRÈS ÉLEVÉE');
  });

  test('Implicit unit price calculation logic', () => {
    const valueEur = 2500000000; // 2.5 Md €
    const quantityTonnes = 5000000; // 5 Mt
    const implicitPrice = Math.round((valueEur / quantityTonnes) * 100) / 100;
    assert.equal(implicitPrice, 500);
    const formatted = formatPricePerTonne(implicitPrice, 'fr-FR');
    assert.ok(formatted.includes('500'));
  });

  test('Quantity formatting in Millions of Tonnes (Mt) and Kilotonnes (kt)', () => {
    assert.ok(formatTonnes(48250000, 'fr-FR').includes('Mt'));
    assert.ok(formatTonnes(750000, 'fr-FR').includes('kt'));
    assert.ok(formatTonnes(850, 'fr-FR').includes('t'));
  });

  test('Currency formatting in Milliards (€ Md) and Millions (€ M)', () => {
    assert.ok(formatCurrencyEur(32400000000, 'fr-FR').includes('Md €'));
    assert.ok(formatCurrencyEur(850000000, 'fr-FR').includes('M €'));
  });

  test('YoY percentage variation formatting', () => {
    assert.ok(formatPercent(12.4, 'fr-FR').startsWith('+'));
    assert.ok(formatPercent(-8.5, 'fr-FR').startsWith('-'));
  });
});
