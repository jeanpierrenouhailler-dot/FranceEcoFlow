import React from 'react';
import { Country, Product } from '../../types/index.ts';
import { FlowParams } from '../../lib/api.ts';
import { Filter, Calendar, RefreshCw } from 'lucide-react';

interface FilterToolbarProps {
  params: FlowParams;
  onChange: (newParams: Partial<FlowParams>) => void;
  countries: Country[];
  products: Product[];
  onReset: () => void;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  params,
  onChange,
  countries,
  products,
  onReset,
}) => {
  const years = Array.from({ length: 12 }, (_, i) => 2015 + i); // 2015 to 2026

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span>Filtres de flux économiques</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Réinitialiser les filtres</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {/* 1. Reporter Country */}
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Pays déclarant</label>
          <select
            value={params.reporter || 'FR'}
            onChange={(e) => onChange({ reporter: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-slate-100 focus:border-cyan-500 focus:outline-hidden font-medium"
          >
            <option value="FR">🇫🇷 France (République française)</option>
            <option value="DE" disabled>🇩🇪 Allemagne (Phase 4 - Europe)</option>
            <option value="IT" disabled>🇮🇹 Italie (Phase 4 - Europe)</option>
          </select>
        </div>

        {/* 2. Flow Type */}
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Sens du flux</label>
          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 border border-slate-800 rounded-md">
            <button
              onClick={() => onChange({ flow: 'import' })}
              className={`py-1 text-center font-medium rounded transition cursor-pointer ${
                params.flow === 'import' || !params.flow
                  ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Importations
            </button>
            <button
              onClick={() => onChange({ flow: 'export' })}
              className={`py-1 text-center font-medium rounded transition cursor-pointer ${
                params.flow === 'export'
                  ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Exportations
            </button>
          </div>
        </div>

        {/* 3. Product */}
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Nomenclature produit</label>
          <select
            value={params.product || 'crude_oil'}
            onChange={(e) => onChange({ product: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-slate-100 focus:border-cyan-500 focus:outline-hidden font-medium"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nameFr} ({p.code})
              </option>
            ))}
          </select>
        </div>

        {/* 4. Timeline Range */}
        <div>
          <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
            <Calendar className="w-3 h-3 text-cyan-400" />
            <span>Période (Années)</span>
          </label>
          <div className="flex items-center gap-1.5">
            <select
              value={params.from || 2015}
              onChange={(e) => onChange({ from: parseInt(e.target.value, 10) })}
              className="w-1/2 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-slate-100 font-mono text-[11px] focus:border-cyan-500 focus:outline-hidden"
            >
              {years.map((y) => (
                <option key={`from_${y}`} value={y} disabled={y > (params.to || 2026)}>
                  {y}
                </option>
              ))}
            </select>
            <span className="text-slate-500">→</span>
            <select
              value={params.to || 2026}
              onChange={(e) => onChange({ to: parseInt(e.target.value, 10) })}
              className="w-1/2 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-slate-100 font-mono text-[11px] focus:border-cyan-500 focus:outline-hidden"
            >
              {years.map((y) => (
                <option key={`to_${y}`} value={y} disabled={y < (params.from || 2015)}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 5. Partner Country */}
        <div>
          <label className="block text-slate-400 mb-1 font-medium">Partenaire commercial</label>
          <select
            value={params.partner || 'all'}
            onChange={(e) => onChange({ partner: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1.5 text-slate-100 focus:border-cyan-500 focus:outline-hidden font-medium truncate"
          >
            <option value="all">Tous les pays partenaires</option>
            {countries
              .filter((c) => c.id !== 'FR')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.flag} {c.nameFr} ({c.id})
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
};
