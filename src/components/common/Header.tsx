import React from 'react';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { Download, Globe } from 'lucide-react';
import { Language } from '../../i18n/index.ts';

export type ActiveTab =
  | 'dashboard'
  | 'explorer'
  | 'map'
  | 'countries'
  | 'products'
  | 'infrastructures'
  | 'methodology'
  | 'sources';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  onOpenExport,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className="text-base sm:text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors cursor-pointer text-left whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>France Economic Flow Explorer</span>
        </button>

        {/* Zone 2: Clean 4-6 text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`transition-colors hover:text-white cursor-pointer py-1 relative ${
              activeTab === 'dashboard' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Tableau de bord
            {activeTab === 'dashboard' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('explorer')}
            className={`transition-colors hover:text-white cursor-pointer py-1 relative ${
              activeTab === 'explorer' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Explorateur
            {activeTab === 'explorer' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`transition-colors hover:text-white cursor-pointer py-1 relative ${
              activeTab === 'map' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Carte des flux
            {activeTab === 'map' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('countries')}
            className={`transition-colors hover:text-white cursor-pointer py-1 relative ${
              activeTab === 'countries' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Partenaires
            {activeTab === 'countries' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('infrastructures')}
            className={`transition-colors hover:text-white cursor-pointer py-1 relative ${
              activeTab === 'infrastructures' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Infrastructures
            {activeTab === 'infrastructures' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('methodology')}
            className={`transition-colors hover:text-white cursor-pointer py-1 relative ${
              activeTab === 'methodology' ? 'text-cyan-400 font-semibold' : ''
            }`}
          >
            Méthodologie
            {activeTab === 'methodology' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>
        </nav>

        {/* Zone 3: Primary actions */}
        <div className="flex items-center gap-2.5">
          <PWAInstallButton />

          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="Exporter l'analyse en CSV, JSON ou PDF"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Exporter</span>
          </button>

          <button
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            className="p-1.5 rounded-md text-xs font-mono border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer flex items-center gap-1"
            title="Changer de langue / Switch language"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="uppercase">{lang}</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="lg:hidden flex items-center justify-between border-t border-slate-800/80 px-4 py-2 overflow-x-auto text-xs text-slate-300 gap-4 no-scrollbar">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`whitespace-nowrap ${activeTab === 'dashboard' ? 'text-cyan-400 font-semibold' : ''}`}
        >
          Tableau
        </button>
        <button
          onClick={() => setActiveTab('explorer')}
          className={`whitespace-nowrap ${activeTab === 'explorer' ? 'text-cyan-400 font-semibold' : ''}`}
        >
          Explorateur
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`whitespace-nowrap ${activeTab === 'map' ? 'text-cyan-400 font-semibold' : ''}`}
        >
          Carte
        </button>
        <button
          onClick={() => setActiveTab('countries')}
          className={`whitespace-nowrap ${activeTab === 'countries' ? 'text-cyan-400 font-semibold' : ''}`}
        >
          Partenaires
        </button>
        <button
          onClick={() => setActiveTab('infrastructures')}
          className={`whitespace-nowrap ${activeTab === 'infrastructures' ? 'text-cyan-400 font-semibold' : ''}`}
        >
          Infrastructures
        </button>
        <button
          onClick={() => setActiveTab('methodology')}
          className={`whitespace-nowrap ${activeTab === 'methodology' ? 'text-cyan-400 font-semibold' : ''}`}
        >
          Méthodologie
        </button>
      </div>
    </header>
  );
};
