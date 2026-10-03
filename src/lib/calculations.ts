/**
 * Economic calculation utilities and formatting functions
 */

export function formatTonnes(tonnes: number, locale: string = 'fr-FR'): string {
  if (tonnes >= 1000000) {
    const mt = tonnes / 1000000;
    return `${mt.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} Mt`;
  }
  if (tonnes >= 1000) {
    const kt = tonnes / 1000;
    return `${kt.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 1 })} kt`;
  }
  return `${tonnes.toLocaleString(locale, { maximumFractionDigits: 0 })} t`;
}

export function formatCurrencyEur(eur: number, locale: string = 'fr-FR'): string {
  if (eur >= 1000000000) {
    const md = eur / 1000000000;
    return `${md.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 2 })} Md €`;
  }
  if (eur >= 1000000) {
    const m = eur / 1000000;
    return `${m.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M €`;
  }
  return `${eur.toLocaleString(locale, { maximumFractionDigits: 0 })} €`;
}

export function formatPricePerTonne(eurPerTonne: number, locale: string = 'fr-FR'): string {
  return `${eurPerTonne.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} € / t`;
}

export function formatPercent(value: number, locale: string = 'fr-FR'): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
}

/**
 * Calculates Herfindahl-Hirschman Index (HHI)
 * Sum of squares of percentage market shares: HHI = SUM((s_i)^2)
 * Ranges from near 0 to 10,000 (pure monopoly = 100^2 = 10,000)
 */
export function calculateHHI(sharesPercent: number[]): number {
  return Math.round(sharesPercent.reduce((sum, s) => sum + s * s, 0));
}

export function getHHIInterpretation(hhi: number): {
  level: 'FAIBLE' | 'MODÉRÉE' | 'ÉLEVÉE' | 'TRÈS ÉLEVÉE';
  color: string;
  description: string;
} {
  if (hhi < 1000) {
    return {
      level: 'FAIBLE',
      color: 'text-emerald-400 border-emerald-800 bg-emerald-950/40',
      description: 'Marché d’approvisionnement très diversifié (HHI < 1 000). Risque géopolitique de dépendance limité.',
    };
  }
  if (hhi < 1800) {
    return {
      level: 'MODÉRÉE',
      color: 'text-cyan-400 border-cyan-800 bg-cyan-950/40',
      description: 'Concentration modérée (1 000 ≤ HHI < 1 800). Portefeuille de fournisseurs équilibré.',
    };
  }
  if (hhi < 2500) {
    return {
      level: 'ÉLEVÉE',
      color: 'text-amber-400 border-amber-800 bg-amber-950/40',
      description: 'Forte concentration (1 800 ≤ HHI < 2 500). Vulnérabilité accrue en cas de perturbation sur les deux premiers fournisseurs.',
    };
  }
  return {
    level: 'TRÈS ÉLEVÉE',
    color: 'text-rose-400 border-rose-800 bg-rose-950/40',
    description: 'Concentration extrême (HHI ≥ 2 500). Dépendance critique envers un ou deux acteurs dominants.',
  };
}
