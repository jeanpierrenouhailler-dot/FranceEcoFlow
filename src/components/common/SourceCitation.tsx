import React, { useState } from 'react';
import { ExternalLink, Database, Info } from 'lucide-react';

interface SourceCitationProps {
  sourceId?: string;
  datasetName?: string;
  period?: string;
  notes?: string;
  className?: string;
}

export const SourceCitation: React.FC<SourceCitationProps> = ({
  sourceId,
  datasetName = 'Jeu de données non documenté',
  period = 'Période non vérifiée',
  notes,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(false);

  const sourceMeta: Record<
    string,
    { name: string; org: string; url: string; license: string; methodologyUrl: string }
  > = {
    dgddi: {
      name: 'Direction Générale des Douanes et Droits Indirects',
      org: 'Ministère de l’Économie, des Finances et de la Souveraineté Industrielle et Numérique',
      url: 'https://lekiosque.finances.gouv.fr',
      license: 'À vérifier pour le jeu de données utilisé',
      methodologyUrl: 'https://lekiosque.finances.gouv.fr/site_fr/methodologie/index.asp',
    },
    sdes: {
      name: 'SDES (Service des Données et Études Statistiques)',
      org: 'Ministère de la Transition Écologique et de la Cohésion des Territoires',
      url: 'https://www.statistiques.developpement-durable.gouv.fr',
      license: 'À vérifier pour le jeu de données utilisé',
      methodologyUrl: 'https://www.statistiques.developpement-durable.gouv.fr',
    },
    eurostat: {
      name: 'Eurostat / Comext DS-045409',
      org: 'Commission Européenne',
      url: 'https://ec.europa.eu/eurostat',
      license: 'À vérifier pour le jeu de données utilisé',
      methodologyUrl: 'https://ec.europa.eu/eurostat/cache/metadata/en/ext_go_esms.htm',
    },
    osm: {
      name: 'OpenStreetMap Contributors',
      org: 'OSM Foundation & Overpass API',
      url: 'https://www.openstreetmap.org',
      license: 'À vérifier pour le jeu de données utilisé',
      methodologyUrl: 'https://wiki.openstreetmap.org',
    },
  };

  const meta = sourceId
    ? sourceMeta[sourceId]
    : undefined;
  const source = meta || {
    name: 'Source non documentée',
    org: 'Producteur non déterminé',
    url: '',
    license: 'Non vérifiée',
    methodologyUrl: '',
  };

  return (
    <div className={`text-xs text-slate-400 border border-slate-800/80 rounded-md bg-slate-900/40 p-3 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>Source : {source.name}</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 font-mono text-[11px]">{period}</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-cyan-300 text-[11px] flex items-center gap-1 cursor-pointer transition"
        >
          <Info className="w-3 h-3" />
          <span>{expanded ? 'Masquer détails' : 'Traçabilité'}</span>
        </button>
      </div>

      {expanded && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/60 text-[11px] space-y-1.5 text-slate-300">
          <p>
            <strong className="text-slate-400">Jeu de données :</strong> {datasetName}
          </p>
          <p>
            <strong className="text-slate-400">Producteur :</strong> {source.org}
          </p>
          <p>
            <strong className="text-slate-400">Licence :</strong> {source.license}
          </p>
          {notes && (
            <p>
              <strong className="text-slate-400">Notes méthodologiques :</strong> {notes}
            </p>
          )}
          <div className="flex items-center gap-3 pt-1">
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Portail officiel</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {source.methodologyUrl && (
              <a
                href={source.methodologyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white flex items-center gap-1"
              >
                <span>Documentation technique</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
