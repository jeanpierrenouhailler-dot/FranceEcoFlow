import React, { useEffect, useState } from 'react';
import {
  Country,
  Product,
  Infrastructure,
  TransportRoute,
  FlowAnalysisSummary,
  SupplierSummary,
  TimeseriesPoint,
  SankeyData,
  AnomalyDetection,
  Source,
  Dataset,
} from './types/index.ts';
import { api, ApiError, FlowParams } from './lib/api.ts';
import { useUrlParams } from './hooks/useUrlParams.ts';
import { Header, ActiveTab } from './components/common/Header.tsx';
import { OfflineIndicator } from './components/common/OfflineIndicator.tsx';
import { DashboardView } from './features/dashboard/DashboardView.tsx';
import { ExplorerView } from './features/explorer/ExplorerView.tsx';
import { CountriesDirectory } from './features/countries/CountriesDirectory.tsx';
import { InfrastructureDirectory } from './features/infrastructures/InfrastructureDirectory.tsx';
import { MethodologyView } from './features/methodology/MethodologyView.tsx';
import { SourcesView } from './features/sources/SourcesView.tsx';
import { IngestionAuditView } from './features/ingestion/IngestionAuditView.tsx';
import { ExportModal } from './features/export/ExportModal.tsx';
import { FlowMap } from './components/map/FlowMap.tsx';
import { Language } from './i18n/index.ts';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('fr');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isExportOpen, setIsExportOpen] = useState(false);

  // URL Query Parameters Synchronizer
  const { params, updateParams } = useUrlParams({
    reporter: 'FR',
    flow: 'import',
    product: 'crude_oil',
    partner: 'all',
  });

  // Global Data State
  const [loading, setLoading] = useState(true);
  const [flowError, setFlowError] = useState<string | null>(null);

  const [countries, setCountries] = useState<Country[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [infrastructures, setInfrastructures] = useState<Infrastructure[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);

  // Filtered Flow State
  const [summary, setSummary] = useState<FlowAnalysisSummary | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [sankey, setSankey] = useState<SankeyData | null>(null);

  // Load static references once
  useEffect(() => {
    Promise.allSettled([
      api.getCountries(),
      api.getProducts(),
      api.getInfrastructures(),
      api.getTransportRoutes(),
      api.getSources(),
      api.getAnomalies('crude_oil'),
    ])
      .then(([cRes, pRes, iRes, rRes, sRes, aRes]) => {
        if (cRes.status === 'fulfilled') setCountries(cRes.value.data);
        if (pRes.status === 'fulfilled') setProducts(pRes.value.data);
        if (iRes.status === 'fulfilled') setInfrastructures(iRes.value.data);
        if (rRes.status === 'fulfilled') setRoutes(rRes.value.data);
        if (sRes.status === 'fulfilled') {
          setSources(sRes.value.sources);
          setDatasets(sRes.value.datasets);
        }
        if (aRes.status === 'fulfilled') setAnomalies(aRes.value.data);
        [cRes, pRes, iRes, rRes, sRes, aRes].forEach((result) => {
          if (result.status === 'rejected') {
            const reason = result.reason;
            if (reason instanceof ApiError && reason.isUnavailable) {
              console.warn('Reference data unavailable:', reason.message);
            } else {
              console.error('Base reference request failed:', reason);
            }
          }
        });
      });
  }, []);

  // Fetch dynamic flows whenever params change
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    Promise.all([
      api.getSummary(params),
      api.getPartners(params),
      api.getTimeseries(params),
      api.getSankey(params),
    ])
      .then(([sumRes, partRes, timeRes, sankRes]) => {
        if (isCancelled) return;
        setSummary(sumRes.summary);
        setSuppliers(partRes.data);
        setTimeseries(timeRes.data);
        setSankey(sankRes.data);
        setLoading(false);
      })
      .catch((err) => {
        if (isCancelled) return;
        if (err instanceof ApiError && err.isUnavailable) {
          console.warn('Flow dataset unavailable:', err.message);
        } else {
          console.error('Failed to load flow data:', err);
        }
        setFlowError('Les flux ne sont pas disponibles : aucune donnée dont la provenance est vérifiée n’est publiée.');
        setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [params.flow, params.from, params.to, params.partner, params.product, params.reporter]);

  const handleResetFilters = () => {
    updateParams({
      reporter: 'FR',
      flow: 'import',
      product: 'crude_oil',
      from: undefined,
      to: undefined,
      partner: 'all',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Offline Toast Indicator */}
      <OfflineIndicator />

      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {loading && !summary && ['dashboard', 'explorer', 'map', 'countries'].includes(activeTab) ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <span className="text-xs font-mono">
              Vérification de la disponibilité des flux...
            </span>
          </div>
        ) : (
          <>
            {(!summary || !sankey) && ['dashboard', 'explorer', 'map', 'countries'].includes(activeTab) && (
              <div className="p-6 rounded-lg bg-amber-950/30 border border-amber-800 text-amber-200 text-sm">
                {flowError || 'Les données de flux ne sont pas disponibles.'}
                <p className="mt-2 text-xs text-amber-100/80">
                  Les sources et l’ingestion restent consultables ; les données non vérifiées ne sont pas affichées.
                </p>
              </div>
            )}
            {summary && sankey && activeTab === 'dashboard' && (
              <DashboardView
                summary={summary}
                suppliers={suppliers}
                anomalies={anomalies}
                onExplore={() => setActiveTab('explorer')}
                onSelectPartner={(pId) => {
                  updateParams({ partner: pId });
                  setActiveTab('explorer');
                }}
                onOpenMap={() => setActiveTab('map')}
              />
            )}

            {summary && sankey && activeTab === 'explorer' && (
              <ExplorerView
                params={params}
                onUpdateParams={updateParams}
                onResetFilters={handleResetFilters}
                countries={countries}
                products={products}
                infrastructures={infrastructures}
                routes={routes}
                summary={summary}
                suppliers={suppliers}
                timeseries={timeseries}
                sankey={sankey}
                onSelectPartner={(pId) => updateParams({ partner: pId })}
                onSelectInfrastructure={() => setActiveTab('infrastructures')}
              />
            )}

            {summary && sankey && activeTab === 'map' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-xl font-bold text-white">
                    Carte géospatiale des flux et infrastructures maritimes
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Visualisation cartographique des flux statistiques d'importation et des corridors maritimes vers les terminaux français.
                  </p>
                </div>
                <FlowMap
                  suppliers={suppliers}
                  infrastructures={infrastructures}
                  routes={routes}
                  selectedPartnerId={params.partner}
                  onSelectPartner={(pId) => updateParams({ partner: pId })}
                  onSelectInfrastructure={() => setActiveTab('infrastructures')}
                />
              </div>
            )}

            {summary && sankey && activeTab === 'countries' && (
              <CountriesDirectory
                suppliers={suppliers}
                infrastructures={infrastructures}
              />
            )}

            {activeTab === 'infrastructures' && (
              <InfrastructureDirectory infrastructures={infrastructures} />
            )}

            {activeTab === 'methodology' && <MethodologyView />}

            {activeTab === 'sources' && (
              <SourcesView sources={sources} datasets={datasets} />
            )}

            {activeTab === 'ingestion' && <IngestionAuditView />}
          </>
        )}
      </main>

      {/* Export Modal */}
      {summary && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          filters={params}
          summary={summary}
          suppliers={suppliers}
        />
      )}

      {/* Clean Minimal Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">France Economic Flow Explorer</span>
            <span>—</span>
            <span>Sources référencées ; données non vérifiées</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <button
              onClick={() => setActiveTab('ingestion')}
              className="hover:text-emerald-400 text-emerald-500/90 font-semibold transition"
            >
              Audit & Données brutes
            </button>
            <button
              onClick={() => setActiveTab('methodology')}
              className="hover:text-slate-300 transition"
            >
              Méthodologie
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className="hover:text-slate-300 transition"
            >
              Sources & Lignage
            </button>
            <span>v1.0.0 (MVP)</span>

          </div>
        </div>
      </footer>
    </div>
  );
}
