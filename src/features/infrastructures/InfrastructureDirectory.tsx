import React, { useState } from 'react';
import { Infrastructure } from '../../types/index.ts';
import { formatTonnes } from '../../lib/calculations.ts';
import { ConfidenceBadge } from '../../components/common/ConfidenceBadge.tsx';
import { SourceCitation } from '../../components/common/SourceCitation.tsx';
import { Anchor, Factory, GitCommit, Layers, ExternalLink } from 'lucide-react';

interface InfrastructureDirectoryProps {
  infrastructures: Infrastructure[];
}

export const InfrastructureDirectory: React.FC<InfrastructureDirectoryProps> = ({
  infrastructures,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = infrastructures.filter((i) => {
    if (filterType === 'all') return true;
    return i.type === filterType;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Anchor className="w-5 h-5 text-amber-400" />
            <span>Infrastructures pétrolières et portuaires françaises</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Terminaux d'importation en eau profonde, plateformes de raffinage et oléoducs stratégiques (Source : OpenStreetMap & SDES).
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 border border-slate-800 rounded-md text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded transition cursor-pointer ${
              filterType === 'all' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Toutes ({infrastructures.length})
          </button>
          <button
            onClick={() => setFilterType('port')}
            className={`px-3 py-1 rounded transition cursor-pointer ${
              filterType === 'port' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ports & Terminaux
          </button>
          <button
            onClick={() => setFilterType('refinery')}
            className={`px-3 py-1 rounded transition cursor-pointer ${
              filterType === 'refinery' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Raffineries
          </button>
          <button
            onClick={() => setFilterType('pipeline')}
            className={`px-3 py-1 rounded transition cursor-pointer ${
              filterType === 'pipeline' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pipelines
          </button>
        </div>
      </div>

      {/* Grid of Infrastructures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-md bg-slate-800 text-cyan-400">
                    {item.type === 'refinery' ? (
                      <Factory className="w-5 h-5 text-purple-400" />
                    ) : item.type === 'pipeline' ? (
                      <GitCommit className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Anchor className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      Opérateur : {item.operator}
                    </span>
                  </div>
                </div>
                <ConfidenceBadge level={item.confidence} />
              </div>

              <p className="mt-3.5 text-xs text-slate-300 leading-relaxed">
                {item.descriptionFr}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded border border-slate-800/80">
                <div>
                  <span className="text-slate-500 block text-[11px]">Capacité annuelle</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {formatTonnes(item.capacityAnnualTonnes)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Statut opérationnel</span>
                  <span className="font-mono text-emerald-400 font-semibold uppercase text-[11px]">
                    ● {item.currentStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono">
                Coords : [{item.coordinates[0].toFixed(2)}, {item.coordinates[1].toFixed(2)}]
              </span>
              {item.osmId && (
                <a
                  href={`https://www.openstreetmap.org/${item.osmId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:underline font-mono"
                >
                  <span>OSM {item.osmId}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <SourceCitation
        sourceId="osm"
        datasetName="OpenStreetMap — Requêtes Overpass API sur les infrastructures d’hydrocarbures"
        notes="Géométries vectorielles et données de capacité vérifiées auprès des rapports d'activité des autorités portuaires (GPMM, HAROPA, Nantes Saint-Nazaire) et de l'UFIP."
      />
    </div>
  );
};
