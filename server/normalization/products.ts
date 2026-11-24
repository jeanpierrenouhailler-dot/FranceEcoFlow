import { Product, ProductCategory, ProductClassification } from '../../src/types/index.ts';

export interface ProductResolutionResult {
  productId: string;
  productName: string;
  productNameFr: string;
  categoryId: string;
  categoryNameFr: string;
  hsChapter: string;
  hsHeading: string;
  nc8Code: string;
  nc8DescriptionFr: string;
  statisticalUnit: 't' | 'm3' | 'bbl' | 'unknown';
  classificationConfidence: 'HIGH' | 'MEDIUM' | 'UNKNOWN';
}

export interface NC8Definition {
  nc8: string;
  hsHeading: string;
  descriptionFr: string;
  productId: string;
  categoryId: string;
  unit: 't' | 'm3' | 'bbl';
  energyDensityGjPerTonne?: number;
}

/**
 * Catalogue local de correspondances NC8 / SH, non authentifié ni versionné.
 * Il ne doit pas servir de preuve de provenance d'une observation économique.
 */
export const LOCAL_NC8_CATALOG: Record<string, NC8Definition> = {
  // --- Hydrocarbures bruts (SH 2709) ---
  '27090090': {
    nc8: '27090090',
    hsHeading: '2709',
    descriptionFr: 'Huiles brutes de pétrole ou de minéraux bitumineux (autres que condensats)',
    productId: 'crude_oil',
    categoryId: 'energy_hydrocarbons',
    unit: 't',
    energyDensityGjPerTonne: 42.5,
  },
  '27090010': {
    nc8: '27090010',
    hsHeading: '2709',
    descriptionFr: 'Condensats de gaz naturel',
    productId: 'crude_oil',
    categoryId: 'energy_hydrocarbons',
    unit: 't',
    energyDensityGjPerTonne: 44.0,
  },

  // --- Produits pétroliers raffinés (SH 2710) ---
  '27101245': {
    nc8: '27101245',
    hsHeading: '2710',
    descriptionFr: 'Essences pour moteurs (Supercarburants sans plomb RON 95 / 98)',
    productId: 'refined_fuels',
    categoryId: 'energy_hydrocarbons',
    unit: 't',
    energyDensityGjPerTonne: 43.8,
  },
  '27101943': {
    nc8: '27101943',
    hsHeading: '2710',
    descriptionFr: 'Gazole pour moteurs automobiles (teneur en soufre <= 10 mg/kg)',
    productId: 'refined_fuels',
    categoryId: 'energy_hydrocarbons',
    unit: 't',
    energyDensityGjPerTonne: 42.8,
  },
  '27101921': {
    nc8: '27101921',
    hsHeading: '2710',
    descriptionFr: 'Carburéacteur type kérosène (Aviation Jet Fuel A-1)',
    productId: 'refined_fuels',
    categoryId: 'energy_hydrocarbons',
    unit: 't',
    energyDensityGjPerTonne: 43.1,
  },
  '27101962': {
    nc8: '27101962',
    hsHeading: '2710',
    descriptionFr: 'Fiouls lourds d’alimentation industrielle et marine',
    productId: 'refined_fuels',
    categoryId: 'energy_hydrocarbons',
    unit: 't',
    energyDensityGjPerTonne: 41.2,
  },

  // --- Gaz Naturel & GNL (SH 2711) ---
  '27111100': {
    nc8: '27111100',
    hsHeading: '2711',
    descriptionFr: 'Gaz naturel liquéfié (GNL / LNG)',
    productId: 'lng',
    categoryId: 'energy_gas',
    unit: 't',
    energyDensityGjPerTonne: 49.0,
  },
  '27112100': {
    nc8: '27112100',
    hsHeading: '2711',
    descriptionFr: 'Gaz naturel à l’état gazeux',
    productId: 'lng',
    categoryId: 'energy_gas',
    unit: 't',
    energyDensityGjPerTonne: 48.0,
  },
};

/**
 * Valide si un code respecte la syntaxe exacte de la Nomenclature Combinée (8 chiffres)
 */
export function validateNC8Code(code: string): boolean {
  return /^\d{8}$/.test(code.trim());
}

/**
 * Moteur de normalisation automatique DGDDI :
 * Associe un code NC8 brut de déclaration douanière à l'entité Product normalisée
 */
export function resolveProductFromNC8(nc8Input: string): ProductResolutionResult {
  const cleanCode = nc8Input.trim().replace(/\s+/g, '');
  const unknownProduct: ProductResolutionResult = {
    productId: 'unknown',
    productName: 'Unknown product',
    productNameFr: 'Produit non déterminé',
    categoryId: 'unknown',
    categoryNameFr: 'Catégorie non déterminée',
    hsChapter: cleanCode.substring(0, 2),
    hsHeading: cleanCode.substring(0, 4),
    nc8Code: cleanCode,
    nc8DescriptionFr: 'Code produit non reconnu dans le catalogue local.',
    statisticalUnit: 'unknown',
    classificationConfidence: 'UNKNOWN',
  };
  if (!/^\d{8}$/.test(cleanCode)) return unknownProduct;

  // 1. Recherche exacte dans le catalogue local
  const match = LOCAL_NC8_CATALOG[cleanCode];
  if (match) {
    const categoryNameFr =
      match.categoryId === 'energy_hydrocarbons'
        ? 'Hydrocarbures & Pétrole'
        : match.categoryId === 'energy_gas'
        ? 'Gaz naturel & GNL'
        : 'Autres';

    const productName =
      match.productId === 'crude_oil'
        ? 'Crude petroleum'
        : match.productId === 'refined_fuels'
        ? 'Refined petroleum products'
        : 'Liquefied Natural Gas (LNG)';

    const productNameFr =
      match.productId === 'crude_oil'
        ? 'Pétrole brut'
        : match.productId === 'refined_fuels'
        ? 'Produits pétroliers raffinés'
        : 'Gaz Naturel Liquéfié (GNL)';

    return {
      productId: match.productId,
      productName,
      productNameFr,
      categoryId: match.categoryId,
      categoryNameFr,
      hsChapter: cleanCode.substring(0, 2),
      hsHeading: match.hsHeading,
      nc8Code: match.nc8,
      nc8DescriptionFr: match.descriptionFr,
      statisticalUnit: match.unit,
      classificationConfidence: 'HIGH',
    };
  }

  // 2. Recherche par préfixe HS (Harmonized System 4 chiffres)
  const hsHeading = cleanCode.substring(0, 4);
  if (hsHeading === '2709') {
    return {
      productId: 'crude_oil',
      productName: 'Crude petroleum',
      productNameFr: 'Pétrole brut',
      categoryId: 'energy_hydrocarbons',
      categoryNameFr: 'Hydrocarbures & Pétrole',
      hsChapter: '27',
      hsHeading: '2709',
      nc8Code: cleanCode,
      nc8DescriptionFr: 'Huiles brutes de pétrole ou de minéraux bitumineux (dérivation SH 2709)',
      statisticalUnit: 't',
      classificationConfidence: 'MEDIUM',
    };
  }

  if (hsHeading === '2710') {
    return {
      productId: 'refined_fuels',
      productName: 'Refined petroleum products',
      productNameFr: 'Produits pétroliers raffinés',
      categoryId: 'energy_hydrocarbons',
      categoryNameFr: 'Hydrocarbures & Pétrole',
      hsChapter: '27',
      hsHeading: '2710',
      nc8Code: cleanCode,
      nc8DescriptionFr: 'Produits pétroliers raffinés (dérivation SH 2710)',
      statisticalUnit: 't',
      classificationConfidence: 'MEDIUM',
    };
  }

  if (hsHeading === '2711') {
    return {
      productId: 'lng',
      productName: 'Liquefied Natural Gas (LNG)',
      productNameFr: 'Gaz Naturel Liquéfié (GNL)',
      categoryId: 'energy_gas',
      categoryNameFr: 'Gaz naturel & GNL',
      hsChapter: '27',
      hsHeading: '2711',
      nc8Code: cleanCode,
      nc8DescriptionFr: 'Gaz de pétrole et autres hydrocarbures gazeux (dérivation SH 2711)',
      statisticalUnit: 't',
      classificationConfidence: 'MEDIUM',
    };
  }

  return unknownProduct;
}

/**
 * Retourne le catalogue local (non authentifié) des nomenclatures renseignées
 */
export function getSupportedNomenclatures(): NC8Definition[] {
  return Object.values(LOCAL_NC8_CATALOG);
}
