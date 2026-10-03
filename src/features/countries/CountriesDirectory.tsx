import React, { useState } from 'react';
import { SupplierSummary, Infrastructure } from '../../types/index.ts';
import { formatCurrencyEur, formatTonnes, formatPricePerTonne } from '../../lib/calculations.ts';
import { CountryDetailModal } from './CountryDetailModal.tsx';
import { Search, ChevronRight, Globe } from 'lucide-react';

interface CountriesDirectoryProps {
  suppliers: SupplierSummary[];
  infrastructures: Infrastructure[];
}

export const CountriesDirectory: React.FC<CountriesDirectoryProps> = ({
  suppliers,
  infrastructures,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);

  const filtered = suppliers.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.country.nameFr.toLowerCase().includes(q) ||
      s.country.name.toLowerCase().includes(q) ||
      s.country.id.toLowerCase().includes(q) ||
      s.country.region.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <span>Répertoire des pays partenaires commerciaux</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Données bilatérales consolidées avec la France pour le pétrole brut (2015-2026).
          </p>
        </div>

        <div className="relative max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher un pays..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Country Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <div
            key={s.partnerCountryId}
            onClick={() => setSelectedCountryId(s.partnerCountryId)}
            className="p-5 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/90 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl">{s.country.flag}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      {s.country.nameFr}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      Rang #{s.rank} · {s.country.region}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {s.marketSharePercent}%
                </span>
              </div>

              <div className="mt-4 space-y-1.5 text-xs border-t border-slate-800/80 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Volume total :</span>
                  <span className="font-mono text-slate-200">
                    {formatTonnes(s.totalQuantityTonnes)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Facture totale :</span>
                  <span className="font-mono text-slate-200">
                    {formatCurrencyEur(s.totalValueEur)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Prix unitaire implicite :</span>
                  <span className="font-mono text-slate-300">
                    {formatPricePerTonne(s.implicitPriceEurPerTonne)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-cyan-400 font-medium">
              <span>Voir la fiche détaillée</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Country Detail Modal */}
      <CountryDetailModal
        countryId={selectedCountryId}
        onClose={() => setSelectedCountryId(null)}
        infrastructures={infrastructures}
      />
    </div>
  );
};
