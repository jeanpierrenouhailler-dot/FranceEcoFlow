import React from 'react';
import { Source, Dataset } from '../../types/index.ts';
import { Database, ExternalLink } from 'lucide-react';

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
          <span>Sources référencées & état de vérification</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          Ce répertoire liste des sources potentielles. Les extractions et les licences n’ont pas
          encore été vérifiées ; aucun statut de source ne vaut preuve de provenance.
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
                  <span className="block text-[11px] font-mono text-amber-400">
                    Provenance : {src.provenanceStatus || 'UNVERIFIED'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    Licence : {src.license || 'Non vérifiée'}
                  </span>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-slate-400 hover:text-white transition"
                    title="Consulter le portail de référence"
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
                          <span>Dernière extraction : {ds.lastUpdated || 'Aucune vérifiée'}</span>
                        </div>
                        <span className="text-amber-400 font-mono">
                          Provenance : {ds.provenanceStatus || 'UNVERIFIED'}
                        </span>
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
