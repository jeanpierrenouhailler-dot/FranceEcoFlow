import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { EconomicFlow } from '../../../src/types/index.ts';
import { IngestedFileMetadata } from './types.ts';

function computeSha256(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

export function loadDGDDIAnnualFile(filePath: string): {
  flows: EconomicFlow[];
  metadata: IngestedFileMetadata;
} {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  const flows: EconomicFlow[] = [];

  // Line 0 is header: ANNEE;FLUX;PAYS_DECLARANT;PAYS_PARTENAIRE;CODE_NC8;VALEUR_CAF_EUROS;MASSE_NETTE_KG;SOURCE
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';').map((c) => c.trim());
    if (cols.length < 7) continue;

    const year = parseInt(cols[0], 10);
    const flowType = cols[1] === 'export' ? 'export' : 'import';
    const reporterCountryId = cols[2]; // 'FR'
    const partnerCountryId = cols[3]; // 'KZ', 'US', etc.
    const productCode = cols[4]; // 27090090
    const valueCafEur = parseFloat(cols[5]);
    const netMassKg = parseFloat(cols[6]);
    const sourceProvider = cols[7] || 'DGDDI';

    if (isNaN(year) || isNaN(valueCafEur) || isNaN(netMassKg) || netMassKg <= 0) {
      continue;
    }

    // Direct, strict unit normalization from customs registration: 1 metric tonne = 1,000 kg
    const quantityTonnes = Math.round((netMassKg / 1000) * 1000) / 1000;

    // Authentic unit price calculated strictly from declared CIF value / declared net mass
    // No Brent multiplier, no currency conversion, no simulated synthetic adjustments.
    const implicitPriceEurPerTonne = Math.round((valueCafEur / quantityTonnes) * 100) / 100;

    flows.push({
      id: `dgddi_annuel_${reporterCountryId}_${partnerCountryId}_2709_${year}`,
      reporterCountryId,
      partnerCountryId,
      productId: 'crude_oil',
      periodYear: year,
      periodMonth: undefined,
      flowType,
      valueEur: valueCafEur,
      quantityTonnes,
      implicitPriceEurPerTonne,
      confidence: 'CONFIRMED',
      sourceId: 'dgddi',
      datasetId: 'dgddi_annual_series',
    });
  }

  const stat = fs.statSync(filePath);
  const metadata: IngestedFileMetadata = {
    fileName: path.basename(filePath),
    filePath,
    fileSizeBytes: stat.size,
    sha256Hash: computeSha256(filePath),
    recordCount: flows.length,
    ingestedAt: new Date().toISOString(),
    sourceProvider: 'Direction Générale des Douanes et Droits Indirects (DGDDI)',
  };

  return { flows, metadata };
}

export function loadDGDDIMonthlyFile(filePath: string): {
  flows: EconomicFlow[];
  metadata: IngestedFileMetadata;
} {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  const flows: EconomicFlow[] = [];

  // Line 0 is header: ANNEE;MOIS;FLUX;PAYS_DECLARANT;PAYS_PARTENAIRE;CODE_NC8;VALEUR_CAF_EUROS;MASSE_NETTE_KG;SOURCE
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';').map((c) => c.trim());
    if (cols.length < 8) continue;

    const year = parseInt(cols[0], 10);
    const month = parseInt(cols[1], 10);
    const flowType = cols[2] === 'export' ? 'export' : 'import';
    const reporterCountryId = cols[3]; // 'FR'
    const partnerCountryId = cols[4];
    const productCode = cols[5];
    const valueCafEur = parseFloat(cols[6]);
    const netMassKg = parseFloat(cols[7]);
    const sourceProvider = cols[8] || 'DGDDI';

    if (isNaN(year) || isNaN(month) || isNaN(valueCafEur) || isNaN(netMassKg) || netMassKg <= 0) {
      continue;
    }

    const quantityTonnes = Math.round((netMassKg / 1000) * 1000) / 1000;
    const implicitPriceEurPerTonne = Math.round((valueCafEur / quantityTonnes) * 100) / 100;

    flows.push({
      id: `dgddi_mensuel_${reporterCountryId}_${partnerCountryId}_2709_${year}_${month}`,
      reporterCountryId,
      partnerCountryId,
      productId: 'crude_oil',
      periodYear: year,
      periodMonth: month,
      flowType,
      valueEur: valueCafEur,
      quantityTonnes,
      implicitPriceEurPerTonne,
      confidence: 'CONFIRMED',
      sourceId: 'dgddi',
      datasetId: 'dgddi_nc8_monthly',
    });
  }

  const stat = fs.statSync(filePath);
  const metadata: IngestedFileMetadata = {
    fileName: path.basename(filePath),
    filePath,
    fileSizeBytes: stat.size,
    sha256Hash: computeSha256(filePath),
    recordCount: flows.length,
    ingestedAt: new Date().toISOString(),
    sourceProvider: 'DGDDI (Statistiques mensuelles au code NC8)',
  };

  return { flows, metadata };
}
