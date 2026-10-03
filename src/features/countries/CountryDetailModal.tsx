import React, { useEffect, useState } from 'react';
import { Country, FlowAnalysisSummary, SupplierSummary, TimeseriesPoint, TransportRoute, Infrastructure } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { MetricCard } from '../../components/common/MetricCard.tsx';
import { TimeseriesChart } from '../../components/charts/TimeseriesChart.tsx';
import { ConfidenceBadge } from '../../components/common/ConfidenceBadge.tsx';
import { SourceCitation } from '../../components/common/SourceCitation.tsx';
import { formatCurrencyEur, formatTonnes, formatPricePerTonne } from '../../lib/calculations.ts';
import { X, Navigation, Anchor, ExternalLink } from 'lucide-react';

interface CountryDetailModalProps {
  countryId: string | null;
  onClose: () => void;
  infrastructures: Infrastructure[];
}

export const CountryDetailModal: React.FC<CountryDetailModalProps> = ({
  countryId,
  onClose,
  infrastructures,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    country: Country;
    summary: FlowAnalysisSummary;
    partnerRankings: SupplierSummary[];
    timeseries: TimeseriesPoint[];
    transportRoutes: TransportRoute[];
  } | null>(null);

  useEffect(() => {
    if (!countryId) return;
    setLoading(true);
    api
      .getCountryDetail(countryId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching country detail:', err);
        setLoading(false);
      });
  }, [countryId]);

  if (!countryId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl text-slate-100 space-y-6">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{data?.country.flag || '🌐'}</span>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>{data?.country.nameFr || countryId}</span>
                <span className="text-xs font-mono text-slate-400">({data?.country.iso3})</span>
              </h2>
              <span className="text-xs text-slate-400">
                Fiche pays partenaire commercial · {data?.country.region} ({data?.country.subregion})
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400 font-mono animate-pulse">
            Chargement des séries statistiques DGDDI pour ce pays...
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                label="Volume cumulé importé"
                value={formatTonnes(data.summary.totalQuantityTonnes)}
                subtext={`2015 — 2026`}
                sourceLabel="DGDDI"
                highlight
              />
              <MetricCard
                label="Facture financière totale"
                value={formatCurrencyEur(data.summary.totalValueEur)}
                subtext="Valeur CAF déclarée"
                sourceLabel="Douanes FR"
              />
              <MetricCard
                label="Prix unitaire implicite moyen"
                value={formatPricePerTonne(data.summary.averageImplicitPriceEurPerTonne)}
                subtext="Valeur / Masse nette"
                sourceLabel="Statistique dérivée"
              />
            </div>

            {/* Timeseries Evolution */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-300">
                Évolution des approvisionnements vers la France (2015 - 2026)
              </h3>
              <TimeseriesChart data={data.timeseries} height="280px" />
            </div>

            {/* Verified Logistical Transport Routes */}
            <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Itinéraire logistique documenté (Maritime / Pipeline)
                </h4>
              </div>

              {data.transportRoutes.length > 0 ? (
                data.transportRoutes.map((route) => (
                  <div key={route.id} className="text-xs space-y-2 text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-cyan-300">
                        Mode de transport : {route.mode.toUpperCase()}
                      </span>
                      <ConfidenceBadge level={route.confidence} />
                    </div>
                    <p className="leading-relaxed bg-slate-900 p-3 rounded border border-slate-800/80">
                      {route.evidence}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Anchor className="w-3.5 h-3.5 text-amber-400" />
                        <span>Terminaux français connectés :</span>
                      </span>
                      {route.associatedPortIds?.map((pid) => {
                        const port = infrastructures.find((i) => i.id === pid);
                        return (
                          <span
                            key={pid}
                            className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded font-mono text-[10px]"
                          >
                            {port?.name || pid}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">
                  Aucun itinéraire logistique spécifique n'a été formellement consigné pour ce pays. Les flux observés relèvent de la déclaration statistique d'origine.
                </p>
              )}
            </div>

            {/* Source Lineage */}
            <SourceCitation
              sourceId="dgddi"
              datasetName={`Statistiques bilatérales France - ${data.country.nameFr}`}
              period="2015 - 2026"
            />
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-rose-400">
            Impossible de charger les données du pays sélectionné.
          </div>
        )}
      </div>
    </div>
  );
};
