import React, { useEffect, useState } from 'react';
import {
  IngestionAuditReport,
  RawCustomsSample,
  DatabaseStatus,
  SourceConnectorMeta,
  InseeIndicator,
  EnergyObservation,
  Infrastructure,
} from '../../types/index.ts';
import { api, ApiError } from '../../lib/api.ts';
import {
  ShieldCheck,
  CheckCircle2,
  FileCode,
  Database,
  Layers,
  MapPin,
  TrendingUp,
  Activity,
  Radio,
  ExternalLink,
  Search,
} from 'lucide-react';

export const IngestionAuditView: React.FC = () => {
  const [report, setReport] = useState<IngestionAuditReport | null>(null);
  const [rawSample, setRawSample] = useState<RawCustomsSample | null>(null);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [connectors, setConnectors] = useState<SourceConnectorMeta[]>([]);
  const [sourcesHealth, setSourcesHealth] = useState<{ [id: string]: any }>({});
  const [inseeIndicators, setInseeIndicators] = useState<InseeIndicator[]>([]);
  const [energyObs, setEnergyObs] = useState<EnergyObservation[]>([]);
  const [nomenclaturesCatalog, setNomenclaturesCatalog] = useState<any[]>([]);
  const [selectedNC8, setSelectedNC8] = useState<string>('');
  const [resolvedProductInfo, setResolvedProductInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Spatial query state
  const [spatialHub, setSpatialHub] = useState('');
  const [spatialRadius, setSpatialRadius] = useState<number>(150);
  const [spatialResults, setSpatialResults] = useState<any[]>([]);
  const [spatialLoading, setSpatialLoading] = useState(false);
  const [spatialHubs, setSpatialHubs] = useState<Infrastructure[]>([]);
  const [spatialError, setSpatialError] = useState<string | null>(null);

  // Sub-tabs
  const [subTab, setSubTab] = useState<
    'sources' | 'database' | 'nomenclatures' | 'insee' | 'energy' | 'checks' | 'raw'
  >('sources');

  useEffect(() => {
    Promise.allSettled([
      api.getIngestionReport(),
      api.getRawCustomsSample(20),
      api.getDatabaseStatus(),
      api.getSourceConnectors(),
      api.getSourcesHealth(),
      api.getInseeIndicators(),
      api.getEnergyObservations(),
      api.getNomenclatures(),
      api.getInfrastructures(),
    ]).then(
      ([repRes, sampleRes, dbRes, connRes, healthRes, inseeRes, energyRes, nomRes, infraRes]) => {
        if (repRes.status === 'fulfilled') setReport(repRes.value.data);
        if (sampleRes.status === 'fulfilled') setRawSample(sampleRes.value);
        if (dbRes.status === 'fulfilled') setDbStatus(dbRes.value.data);
        if (connRes.status === 'fulfilled') setConnectors(connRes.value.data);
        if (healthRes.status === 'fulfilled') setSourcesHealth(healthRes.value.data);
        if (inseeRes.status === 'fulfilled') setInseeIndicators(inseeRes.value.data);
        if (energyRes.status === 'fulfilled') setEnergyObs(energyRes.value.data);
        if (nomRes.status === 'fulfilled') {
          setNomenclaturesCatalog(nomRes.value.data);
          const firstCode = nomRes.value.data[0]?.nc8;
          if (firstCode) {
            setSelectedNC8(firstCode);
            api
              .resolveNC8Product(firstCode)
              .then((response) => setResolvedProductInfo(response.data))
              .catch((error) => console.error('Nomenclature resolution failed:', error));
          }
        }
        if (infraRes.status === 'fulfilled') {
          setSpatialHubs(infraRes.value.data);
          setSpatialHub(infraRes.value.data[0]?.id ?? '');
        }
        [
          repRes,
          sampleRes,
          dbRes,
          connRes,
          healthRes,
          inseeRes,
          energyRes,
          nomRes,
          infraRes,
        ].forEach((result) => {
          if (result.status === 'rejected') {
            const reason = result.reason;
            if (reason instanceof ApiError && reason.isUnavailable) {
              console.warn('Audit endpoint unavailable:', reason.message);
            } else {
              console.error('Audit data request failed:', reason);
            }
          }
        });
        setLoading(false);
      },
    );
  }, []);

  const handleResolveNC8 = (code: string) => {
    setSelectedNC8(code);
    api
      .resolveNC8Product(code)
      .then((res) => setResolvedProductInfo(res.data))
      .catch((error) => console.error('Nomenclature resolution failed:', error));
  };

  // Run spatial query when hub or radius changes
  useEffect(() => {
    const hub = spatialHubs.find((infra) => infra.id === spatialHub);
    if (!hub) {
      setSpatialResults([]);
      setSpatialError(
        spatialHubs.length === 0
          ? 'Aucune infrastructure vérifiée n’est disponible.'
          : 'Sélectionnez une infrastructure.',
      );
      setSpatialLoading(false);
      return;
    }
    const [lng, lat] = hub.coordinates;
    setSpatialLoading(true);
    setSpatialError(null);
    api
      .getSpatialInfrastructuresWithin(lat, lng, spatialRadius)
      .then((res) => {
        setSpatialResults(res.data);
        setSpatialLoading(false);
      })
      .catch((error) => {
        setSpatialError(error instanceof Error ? error.message : 'La requête spatiale a échoué.');
        setSpatialLoading(false);
      });
  }, [spatialHub, spatialRadius, spatialHubs]);

  if (loading) {
    return (
      <div className="py-24 text-center text-xs font-mono text-slate-400 animate-pulse">
        Initialisation du registre PostgreSQL / PostGIS et vérification des 9 connecteurs de
        sources...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in text-slate-200">
      {/* Header Banner */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>ARCHITECTURE TECHNIQUE & COUCHE D'INGESTION MULTI-SOURCES</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Intégration PostgreSQL/PostGIS & Couche d'Abstraction des Sources
        </h1>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-3xl">
          Prototype d’intégration. Les données des connecteurs et les infrastructures restent
          indisponibles tant que leur extraction, leur persistance et leur provenance ne sont pas
          vérifiées.
        </p>

        {/* Sub-navigation bar */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto no-scrollbar border-b border-slate-800/80 pb-2">
          <button
            onClick={() => setSubTab('sources')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition whitespace-nowrap flex items-center gap-1.5 ${
              subTab === 'sources'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Sources référencées</span>
          </button>

          <button
            onClick={() => setSubTab('database')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition whitespace-nowrap flex items-center gap-1.5 ${
              subTab === 'database'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>PostgreSQL & Requêtes PostGIS</span>
          </button>

          <button
            onClick={() => setSubTab('nomenclatures')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition whitespace-nowrap flex items-center gap-1.5 ${
              subTab === 'nomenclatures'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Nomenclatures NC8 & Produits</span>
          </button>

          <button
            onClick={() => setSubTab('insee')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition whitespace-nowrap flex items-center gap-1.5 ${
              subTab === 'insee'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Indicateurs INSEE</span>
          </button>

          <button
            onClick={() => setSubTab('energy')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition whitespace-nowrap flex items-center gap-1.5 ${
              subTab === 'energy'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Bilan JODI / SDES</span>
          </button>

          <button
            onClick={() => setSubTab('checks')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition whitespace-nowrap flex items-center gap-1.5 ${
              subTab === 'checks'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Contrôles Qualité (Audit)</span>
          </button>

          <button
            onClick={() => setSubTab('raw')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition whitespace-nowrap flex items-center gap-1.5 ${
              subTab === 'raw'
                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Échantillon Brut DGDDI</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: 9 SOURCES CONNECTORS */}
      {subTab === 'sources' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Couche d'Abstraction des Sources (`server/ingestion/sources/*`)</span>
            </h2>
            <span className="text-xs font-mono text-amber-400">
              {Object.values(sourcesHealth).filter((health: any) => health?.reachable).length} /{' '}
              {connectors.length} sources accessibles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectors.map((c) => {
              const health = sourcesHealth[c.id];
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-700 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-white text-sm font-sans">{c.name}</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-800 uppercase shrink-0">
                        {c.type}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 block">{c.provider}</span>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                      {c.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Santé / Disponibilité</span>
                      <span
                        className={`flex items-center gap-1 font-mono font-semibold ${health?.reachable ? 'text-emerald-400' : 'text-amber-400'}`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${health?.reachable ? 'bg-emerald-400' : 'bg-amber-400'}`}
                        />
                        {health?.reachable
                          ? `EN LIGNE (${health.latencyMs} ms)`
                          : health?.status || 'ÉTAT INCONNU'}
                      </span>
                    </div>

                    <a
                      href={c.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] pt-1"
                    >
                      <span>Portail de référence</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SUB-TAB 2: POSTGRESQL & POSTGIS SPATIAL ENGINE */}
      {subTab === 'database' && (
        <section className="space-y-6">
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  <span>MOTEUR DE STOCKAGE RELATIONNEL & SPATIAL</span>
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {dbStatus?.connected ? dbStatus.version : 'Base de données indisponible'}
                </h3>
              </div>
              <div
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-2 ${dbStatus?.connected ? 'bg-emerald-950 border-emerald-800 text-emerald-300' : 'bg-amber-950 border-amber-800 text-amber-300'}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${dbStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}
                />
                <span>{dbStatus?.engine}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Version PostGIS</span>
                <span className="font-mono font-bold text-white text-sm">
                  {dbStatus?.postgisVersion || 'Non disponible'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Index Spatiaux GIST</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {dbStatus?.connected ? 'État non vérifié' : 'Base indisponible'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Requêtes SQL exécutées</span>
                <span className="font-mono font-bold text-cyan-400 text-sm">
                  {dbStatus?.totalQueriesExecuted}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive PostGIS ST_DWithin Query Tester */}
          <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>Requête Spatiale PostGIS en temps réel (`ST_DWithin`)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Sélectionnez un port d'entrée et un rayon pour exécuter la requête spatiale
                  PostGIS de recherche d'infrastructures connexes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={spatialHub}
                  onChange={(e) => setSpatialHub(e.target.value)}
                  disabled={spatialHubs.length === 0}
                  className="bg-slate-950 border border-slate-700 text-xs rounded px-2.5 py-1.5 text-white"
                >
                  {spatialHubs.length === 0 && (
                    <option value="">Aucune infrastructure vérifiée</option>
                  )}
                  {spatialHubs.map((hub) => (
                    <option key={hub.id} value={hub.id}>
                      {hub.name}
                    </option>
                  ))}
                </select>

                <select
                  value={spatialRadius}
                  onChange={(e) => setSpatialRadius(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 text-xs rounded px-2.5 py-1.5 text-white font-mono"
                >
                  <option value={50}>Rayon 50 km</option>
                  <option value={150}>Rayon 150 km</option>
                  <option value={300}>Rayon 300 km</option>
                </select>
              </div>
            </div>

            {/* Results Table */}
            <div className="rounded-lg border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 text-[11px]">
                    <th className="py-2.5 px-3">Infrastructure</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Opérateur</th>
                    <th className="py-2.5 px-3 text-right">Distance PostGIS</th>
                    <th className="py-2.5 px-3 text-right">Capacité Annuelle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {spatialLoading ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-500">
                        Exécution du calcul géodésique PostGIS ST_DWithin...
                      </td>
                    </tr>
                  ) : spatialResults.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-500">
                        {spatialError || 'Aucune infrastructure dans ce périmètre.'}
                      </td>
                    </tr>
                  ) : (
                    spatialResults.map((infra) => (
                      <tr key={infra.id} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 text-white font-sans font-medium">{infra.name}</td>
                        <td className="py-2 px-3 text-cyan-400 uppercase text-[10px]">
                          {infra.type}
                        </td>
                        <td className="py-2 px-3 text-slate-400 font-sans">
                          {infra.operator || 'Non renseigné'}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                          {infra.distanceKm} km
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          {infra.capacityAnnualTonnes === undefined
                            ? 'Non renseignée'
                            : `${(infra.capacityAnnualTonnes / 1000000).toFixed(1)} Mt/an`}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* SUB-TAB: NOMENCLATURES NC8 & NORMALISATION PRODUITS */}
      {subTab === 'nomenclatures' && (
        <section className="space-y-6">
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>NORMALISATION AUTOMATIQUE DES PRODUITS DGDDI</span>
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  Moteur de Résolution NC8 → Produit (`server/normalization/products.ts`)
                </h3>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>RÉSOLUTION TEMPS RÉEL ACTIVE</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              Chaque ligne de déclaration douanière de la DGDDI comporte un code de la Nomenclature
              Combinée à 8 chiffres (NC8). Le moteur de normalisation résout automatiquement le
              produit métier, le chapitre du Système Harmonisé (SH), l'unité statistique légale et
              la catégorie sans aucune dérivation arbitraire.
            </p>

            {/* Interactive Resolver Tester */}
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <span>Testeur de Résolution NC8 Douanière</span>
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">Code NC8 testé :</span>
                  <select
                    value={selectedNC8}
                    onChange={(e) => handleResolveNC8(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-xs rounded px-2.5 py-1.5 text-white font-mono"
                  >
                    {nomenclaturesCatalog.map((item) => (
                      <option key={item.nc8} value={item.nc8}>
                        {item.nc8} - {item.descriptionFr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {resolvedProductInfo && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">
                      Code NC8 Résolu
                    </span>
                    <span className="font-mono font-bold text-cyan-400 text-sm">
                      {resolvedProductInfo.nc8Code}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                      SH {resolvedProductInfo.hsHeading}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">
                      Produit Normalisé
                    </span>
                    <span className="font-sans font-bold text-white text-sm">
                      {resolvedProductInfo.productNameFr}
                    </span>
                    <span className="text-[10px] text-cyan-300 font-mono block mt-0.5">
                      id: {resolvedProductInfo.productId}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">
                      Catégorie Métier
                    </span>
                    <span className="font-sans font-bold text-amber-300 text-sm">
                      {resolvedProductInfo.categoryNameFr}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      Unité: {resolvedProductInfo.statisticalUnit}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase block">
                      Confiance de classification
                    </span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {resolvedProductInfo.classificationConfidence}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Catalogue local non authentifié; ne prouve pas l’observation
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Locally maintained catalog */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Référentiel des Nomenclatures Combinées (NC8) & Correspondances Produits</span>
            </h3>

            <div className="rounded-lg border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 text-[11px]">
                    <th className="py-2.5 px-3">Code NC8</th>
                    <th className="py-2.5 px-3">Position SH</th>
                    <th className="py-2.5 px-3">Libellé du catalogue local non authentifié</th>
                    <th className="py-2.5 px-3">Produit Cible</th>
                    <th className="py-2.5 px-3">Catégorie</th>
                    <th className="py-2.5 px-3 text-center">Unité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {nomenclaturesCatalog.map((item) => (
                    <tr key={item.nc8} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 text-cyan-400 font-bold">{item.nc8}</td>
                      <td className="py-2.5 px-3 text-slate-400">{item.hsHeading}</td>
                      <td className="py-2.5 px-3 font-sans text-white max-w-xs">
                        {item.descriptionFr}
                      </td>
                      <td className="py-2.5 px-3 font-sans font-medium text-emerald-400">
                        {item.productId}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-300">{item.categoryId}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-amber-300">
                        {item.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* SUB-TAB 3: INSEE MACROECONOMIC INDICATORS */}
      {subTab === 'insee' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Séries Macroéconomiques & Industrielles INSEE (Ingérées)</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {inseeIndicators.length} observations indexées
            </span>
          </div>

          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 text-[11px]">
                  <th className="py-2.5 px-3">Série INSEE</th>
                  <th className="py-2.5 px-3">Indicateur</th>
                  <th className="py-2.5 px-3">Période</th>
                  <th className="py-2.5 px-3 text-right">Valeur Observée</th>
                  <th className="py-2.5 px-3">Unité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {inseeIndicators.map((ind) => (
                  <tr key={ind.id} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 text-cyan-400 font-bold">{ind.seriesId || 'INSEE'}</td>
                    <td className="py-2 px-3 text-white font-sans">{ind.labelFr}</td>
                    <td className="py-2 px-3 text-slate-300">{ind.period}</td>
                    <td className="py-2 px-3 text-right font-bold text-amber-300">
                      {ind.value.toLocaleString('fr-FR')}
                    </td>
                    <td className="py-2 px-3 text-slate-400 font-sans">{ind.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SUB-TAB 4: JODI / SDES ENERGY BALANCE */}
      {subTab === 'energy' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Bilans Énergétiques Officiels JODI Oil & SDES (Raffinage & Stocks)</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {energyObs.length} observations
            </span>
          </div>

          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 text-[11px]">
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3">Métrique</th>
                  <th className="py-2.5 px-3">Période</th>
                  <th className="py-2.5 px-3 text-right">Volume (Tonnes)</th>
                  <th className="py-2.5 px-3 text-right">Débit (kboed)</th>
                  <th className="py-2.5 px-3 text-right">Couverture Stocks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {energyObs.map((obs) => (
                  <tr key={obs.id} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 text-cyan-400 uppercase font-bold">{obs.sourceId}</td>
                    <td className="py-2 px-3 text-white font-sans">{obs.flowMetric}</td>
                    <td className="py-2 px-3 text-slate-300">{obs.period}</td>
                    <td className="py-2 px-3 text-right text-slate-200">
                      {obs.volumeTonnes ? `${(obs.volumeTonnes / 1000000).toFixed(2)} Mt` : '—'}
                    </td>
                    <td className="py-2 px-3 text-right text-amber-300">
                      {obs.volumeKboed ? `${obs.volumeKboed} kboed` : '—'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-400">
                      {obs.stockDaysNetImports ? `${obs.stockDaysNetImports} jours` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SUB-TAB 5: QUALITY CHECKS (AUDIT TRAIL) */}
      {subTab === 'checks' && report && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Rapport d'Audit de Qualité des Données (Data Quality Checks)</span>
            </h2>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {report.checks.length} / {report.checks.length} CONFORMES
            </span>
          </div>

          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 text-[11px]">
                  <th className="py-2.5 px-3">Identifiant</th>
                  <th className="py-2.5 px-3">Vérification</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Statut</th>
                  <th className="py-2.5 px-3 text-right">Lignes testées</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {report.checks.map((chk) => (
                  <tr key={chk.checkId} className="hover:bg-slate-900/30">
                    <td className="py-2.5 px-3 text-cyan-400 font-bold">{chk.checkId}</td>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-200">{chk.name}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-400">{chk.description}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {chk.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{chk.recordsTested}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SUB-TAB 6: RAW CUSTOMS SAMPLE */}
      {subTab === 'raw' && rawSample && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-amber-400" />
              <span>Inspection des Déclarations DAU Brutes (Fichier DGDDI sur disque)</span>
            </h2>
            <span className="text-xs font-mono text-slate-500">
              {rawSample.rowsReturned} premières lignes / {rawSample.totalRows} totales
            </span>
          </div>

          <div className="rounded-lg border border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono text-[11px]">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="py-2 px-2.5 w-10">#</th>
                  <th className="py-2 px-2.5">ANNEE</th>
                  <th className="py-2 px-2.5">MOIS</th>
                  <th className="py-2 px-2.5">FLUX</th>
                  <th className="py-2 px-2.5">PARTENAIRE</th>
                  <th className="py-2 px-2.5">CODE_NC8</th>
                  <th className="py-2 px-2.5 text-right">VALEUR_CAF_EUROS</th>
                  <th className="py-2 px-2.5 text-right">MASSE_NETTE_KG</th>
                  <th className="py-2 px-2.5">RÉFÉRENCE DAU</th>
                  <th className="py-2 px-2.5 text-center">SOURCE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rawSample.records.map((rec: any) => (
                  <tr key={rec.rowId} className="hover:bg-slate-900/40">
                    <td className="py-1.5 px-2.5 text-slate-600">{rec.rowId}</td>
                    <td className="py-1.5 px-2.5 text-white">{rec.year}</td>
                    <td className="py-1.5 px-2.5 text-slate-400">{rec.month || 'Annuel'}</td>
                    <td className="py-1.5 px-2.5 text-cyan-400">{rec.flow}</td>
                    <td className="py-1.5 px-2.5 text-amber-300 font-bold">{rec.partner}</td>
                    <td className="py-1.5 px-2.5 text-slate-300 font-mono">{rec.nc8}</td>
                    <td className="py-1.5 px-2.5 text-right text-slate-200">
                      {parseFloat(rec.valueEur).toLocaleString('fr-FR')} €
                    </td>
                    <td className="py-1.5 px-2.5 text-right text-slate-200">
                      {parseFloat(rec.netMassKg).toLocaleString('fr-FR')} kg
                    </td>
                    <td className="py-1.5 px-2.5 text-slate-500 font-mono text-[10px]">
                      {rec.dauReference || 'DAU-DGDDI-FR'}
                    </td>
                    <td className="py-1.5 px-2.5 text-center text-emerald-400">{rec.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
