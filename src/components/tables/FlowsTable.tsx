import React, { useState, useMemo } from 'react';
import { SupplierSummary } from '../../types/index.ts';
import { formatCurrencyEur, formatTonnes, formatPricePerTonne } from '../../lib/calculations.ts';
import { ConfidenceBadge } from '../common/ConfidenceBadge.tsx';
import { Search, ArrowUpDown, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface FlowsTableProps {
  suppliers: SupplierSummary[];
  periodLabel: string;
  onSelectPartner?: (partnerId: string) => void;
}

type SortField = 'rank' | 'name' | 'quantity' | 'value' | 'share' | 'price';
type SortOrder = 'asc' | 'desc';

export const FlowsTable: React.FC<FlowsTableProps> = ({
  suppliers,
  periodLabel,
  onSelectPartner,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'name' ? 'asc' : 'desc');
    }
  };

  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      const q = searchTerm.toLowerCase();
      return (
        s.country.nameFr.toLowerCase().includes(q) ||
        s.country.name.toLowerCase().includes(q) ||
        s.country.id.toLowerCase().includes(q) ||
        s.country.region.toLowerCase().includes(q)
      );
    });
  }, [suppliers, searchTerm]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comp = 0;
      switch (sortField) {
        case 'rank':
          comp = a.rank - b.rank;
          break;
        case 'name':
          comp = a.country.nameFr.localeCompare(b.country.nameFr);
          break;
        case 'quantity':
          comp = a.totalQuantityTonnes - b.totalQuantityTonnes;
          break;
        case 'value':
          comp = a.totalValueEur - b.totalValueEur;
          break;
        case 'share':
          comp = a.marketSharePercent - b.marketSharePercent;
          break;
        case 'price':
          comp = a.implicitPriceEurPerTonne - b.implicitPriceEurPerTonne;
          break;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [filtered, sortField, sortOrder]);

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const exportTableCsv = () => {
    const header = 'Rang;Code;Pays;Région;Volume (Tonnes);Part (%);Valeur (Euros);Prix Implicite (EUR/t);Niveau Confiance\n';
    const rows = sorted
      .map((s) =>
        [
          s.rank,
          s.country.id,
          s.country.nameFr,
          s.country.region,
          s.totalQuantityTonnes,
          s.marketSharePercent,
          s.totalValueEur,
          s.implicitPriceEurPerTonne,
          s.confidence,
        ].join(';')
      )
      .join('\n');

    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tableau_fournisseurs_france_${periodLabel}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-5">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filtrer un pays, une région ou un code ISO..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">
            {sorted.length} fournisseur{sorted.length > 1 ? 's' : ''}
          </span>
          <button
            onClick={exportTableCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* High-density Data Table */}
      <div className="overflow-x-auto rounded border border-slate-800/80">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <th className="py-2.5 px-3 w-14">
                <button
                  onClick={() => handleSort('rank')}
                  className="flex items-center gap-1 hover:text-white"
                >
                  <span>Rang</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 hover:text-white"
                >
                  <span>Pays partenaire</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 text-right">
                <button
                  onClick={() => handleSort('quantity')}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  <span>Volume importé</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 text-right">
                <button
                  onClick={() => handleSort('share')}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  <span>Part (%)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 text-right">
                <button
                  onClick={() => handleSort('value')}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  <span>Valeur totale</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 text-right">
                <button
                  onClick={() => handleSort('price')}
                  className="inline-flex items-center gap-1 hover:text-white"
                >
                  <span>Prix unitaire implicite</span>
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="py-2.5 px-3 text-center">Niveau confiance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {paginated.map((s) => (
              <tr
                key={s.partnerCountryId}
                onClick={() => onSelectPartner?.(s.partnerCountryId)}
                className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
              >
                <td className="py-2.5 px-3 text-slate-500 font-semibold tabular-nums">
                  #{s.rank}
                </td>
                <td className="py-2.5 px-3 font-sans">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{s.country.flag}</span>
                    <span className="font-medium text-slate-200 group-hover:text-cyan-400 transition-colors">
                      {s.country.nameFr}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">({s.country.id})</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-slate-100 tabular-nums">
                  {formatTonnes(s.totalQuantityTonnes)}
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-cyan-400 tabular-nums">
                  {s.marketSharePercent}%
                </td>
                <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                  {formatCurrencyEur(s.totalValueEur)}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                  {formatPricePerTonne(s.implicitPriceEurPerTonne)}
                </td>
                <td className="py-2.5 px-3 text-center font-sans">
                  <ConfidenceBadge level={s.confidence} />
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                  Aucun résultat ne correspond à la recherche "{searchTerm}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
          <span>
            Affichage de {(page - 1) * pageSize + 1} à {Math.min(page * pageSize, sorted.length)} sur {sorted.length} partenaires
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded border border-slate-800 disabled:opacity-40 hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono">
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded border border-slate-800 disabled:opacity-40 hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
