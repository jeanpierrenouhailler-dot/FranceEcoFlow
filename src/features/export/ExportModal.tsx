import React, { useState } from 'react';
import { FlowAnalysisSummary, SupplierSummary } from '../../types/index.ts';
import { FlowParams } from '../../lib/api.ts';
import { formatCurrencyEur, formatTonnes, formatPricePerTonne } from '../../lib/calculations.ts';
import { X, Download, Printer, FileSpreadsheet, FileCode, Check } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FlowParams;
  summary: FlowAnalysisSummary;
  suppliers: SupplierSummary[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  filters,
  summary,
  suppliers,
}) => {
  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadCSV = () => {
    const csvUrl = `/api/export?format=csv&from=${filters.from || 2015}&to=${filters.to || 2026}&product=${filters.product || 'crude_oil'}&flow=${filters.flow || 'import'}`;
    const a = document.createElement('a');
    a.href = csvUrl;
    a.download = `rapport_france_flux_${filters.from || 2015}_${filters.to || 2026}.csv`;
    a.click();
    setDownloadedFormat('CSV');
    setTimeout(() => setDownloadedFormat(null), 3000);
  };

  const handleDownloadJSON = () => {
    const payload = {
      exportMetadata: {
        title: 'France Economic Flow Explorer — Rapport officiel',
        exportedAt: new Date().toISOString(),
        filters,
        summary,
      },
      partners: suppliers,
      source: 'DGDDI (Douanes Françaises) / OpenStreetMap',
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_france_flux_${filters.from || 2015}_${filters.to || 2026}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadedFormat('JSON');
    setTimeout(() => setDownloadedFormat(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl text-slate-100 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Exporter l'analyse économique</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Synthesis preview */}
        <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1.5 font-mono">
          <div className="flex justify-between text-slate-400">
            <span>Période :</span>
            <span className="text-white font-semibold">{summary.periodLabel}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Volume total :</span>
            <span className="text-cyan-400 font-semibold">{formatTonnes(summary.totalQuantityTonnes)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Facture globale :</span>
            <span className="text-white font-semibold">{formatCurrencyEur(summary.totalValueEur)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Prix unitaire moyen :</span>
            <span className="text-slate-300">{formatPricePerTonne(summary.averageImplicitPriceEurPerTonne)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Partenaires identifiés :</span>
            <span className="text-white">{suppliers.length} pays</span>
          </div>
        </div>

        {/* Export buttons */}
        <div className="space-y-2.5">
          <button
            onClick={handleDownloadCSV}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 hover:border-slate-700 transition cursor-pointer text-xs"
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <span className="font-semibold block text-slate-200">Tableur CSV officiel</span>
                <span className="text-slate-500 text-[11px]">Format universel compatible Excel / LibreOffice</span>
              </div>
            </div>
            {downloadedFormat === 'CSV' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Download className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <button
            onClick={handleDownloadJSON}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 hover:border-slate-700 transition cursor-pointer text-xs"
          >
            <div className="flex items-center gap-2.5">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <div className="text-left">
                <span className="font-semibold block text-slate-200">Fichier de données brutes JSON</span>
                <span className="text-slate-500 text-[11px]">Structure hiérarchique avec métadonnées et lignage</span>
              </div>
            </div>
            {downloadedFormat === 'JSON' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Download className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 hover:border-slate-700 transition cursor-pointer text-xs"
          >
            <div className="flex items-center gap-2.5">
              <Printer className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <span className="font-semibold block text-slate-200">Impression & Export PDF</span>
                <span className="text-slate-500 text-[11px]">Mise en page optimisée pour rapport imprimé ou PDF</span>
              </div>
            </div>
            <Printer className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="pt-2 text-center text-[11px] text-slate-500">
          Source des données douanières : Direction Générale des Douanes (DGDDI)
        </div>
      </div>
    </div>
  );
};
