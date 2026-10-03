import React from 'react';
import { Source, Dataset } from '../../types/index.ts';
import { Database, ExternalLink, ShieldCheck } from 'lucide-react';

interface SourcesViewProps {
  sources: Source[];
  datasets: Dataset[];
}

export const SourcesView: React.FC<SourcesViewProps> = ({ sources, datasets }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in text-slate-200">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Database className="w-6 h-6 text-cyan-400" />
          <span>Répertoire des sources officielles & Registre de lignage</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          Toutes les données présentées dans l'application proviennent exclusivement de registres douaniers, d'agences statistiques nationales ou internationales et de cartographies libres vérifiées.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {sources.map((src) => {
          const relatedDatasets = datasets.filter((d) => d.sourceId === src.id);

          return (
            <div
              key={src.id}
              className="p-5 rounded-lg bg-slate-900/50 border border-slate-800 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{src.provider}</span>
                    <span className="text-[11px] font-mono text-cyan-400 font-normal">
                      [{src.id.toUpperCase()}]
                    </span>
                  </h3>
                  <span className="text-xs text-slate-400">{src.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    Licence : {src.license}
                  </span>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-slate-400 hover:text-white transition"
                    title="Accéder au portail officiel"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {src.notes && <p className="text-xs text-slate-300 leading-relaxed">{src.notes}</p>}

              {relatedDatasets.length > 0 && (
                <div className="pt-2 text-xs space-y-2">
                  <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider block">
                    Jeux de données associés (Datasets) :
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {relatedDatasets.map((ds) => (
                      <div
                        key={ds.id}
                        className="bg-slate-950 p-3 rounded border border-slate-800/80 text-[11px] space-y-1"
                      >
                        <span className="font-semibold text-slate-200 block">{ds.name}</span>
                        <div className="flex items-center justify-between text-slate-500 font-mono">
                          <span>Fréquence : {ds.frequency}</span>
                          <span>Dernière rév. : {ds.lastUpdated}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
