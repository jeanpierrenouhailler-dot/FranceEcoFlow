import React, { useEffect, useRef, useState, useMemo } from 'react';
import { SupplierSummary, Infrastructure, TransportRoute } from '../../types/index.ts';
import { ConfidenceBadge } from '../common/ConfidenceBadge.tsx';
import { formatCurrencyEur, formatTonnes } from '../../lib/calculations.ts';
import { Anchor, Factory, Navigation, Layers, Info } from 'lucide-react';

interface FlowMapProps {
  suppliers: SupplierSummary[];
  infrastructures: Infrastructure[];
  routes: TransportRoute[];
  selectedPartnerId?: string;
  onSelectPartner?: (partnerId: string) => void;
  onSelectInfrastructure?: (infra: Infrastructure) => void;
}

export const FlowMap: React.FC<FlowMapProps> = ({
  suppliers,
  infrastructures,
  routes,
  selectedPartnerId,
  onSelectPartner,
  onSelectInfrastructure,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showInfrastructures, setShowInfrastructures] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [hoveredSupplier, setHoveredSupplier] = useState<SupplierSummary | null>(null);
  const [hoveredInfra, setHoveredInfra] = useState<Infrastructure | null>(null);

  // France Centroid (Western Europe hub)
  const franceCoords = { lng: 2.21, lat: 46.22 };

  // Calculate scaled arc paths
  // Map projections to SVG coordinates (Equirectangular standard viewport)
  // [lng: -110 to 80, lat: -15 to 65]
  const projectCoords = (lng: number, lat: number) => {
    // Canvas bounds
    const minLng = -105;
    const maxLng = 75;
    const minLat = -15;
    const maxLat = 65;

    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100;
    return { x, y };
  };

  const francePoint = projectCoords(franceCoords.lng, franceCoords.lat);

  // Maximum quantity for scale normalization
  const maxVolume = useMemo(() => {
    return Math.max(...suppliers.map((s) => s.totalQuantityTonnes), 1000000);
  }, [suppliers]);

  return (
    <div className="relative w-full h-[520px] lg:h-[620px] bg-slate-950 rounded-lg border border-slate-800 overflow-hidden select-none">
      {/* Map Control Toolbar */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-md border border-slate-800 text-xs text-slate-300 shadow-md">
        <span className="font-semibold text-white flex items-center gap-1 mr-1">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Couches :</span>
        </span>
        <button
          onClick={() => setShowRoutes(!showRoutes)}
          className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
            showRoutes ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50' : 'bg-slate-800 text-slate-400'
          }`}
        >
          <Navigation className="w-3 h-3" />
          <span>Itinéraires maritimes vérifiés</span>
        </button>
        <button
          onClick={() => setShowInfrastructures(!showInfrastructures)}
          className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
            showInfrastructures
              ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          <Anchor className="w-3 h-3" />
          <span>Ports & Raffineries françaises</span>
        </button>
      </div>

      {/* Legend Badge */}
      <div className="absolute bottom-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-md border border-slate-800 text-[11px] text-slate-300 shadow-md space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
          <span>Flux commercial (épaisseur $\propto$ volume)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          <span>Terminaux pétroliers (Fos, Le Havre, Donges)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm bg-purple-400 inline-block" />
          <span>Raffineries actives de France</span>
        </div>
      </div>

      {/* SVG Flow Visualization Canvas */}
      <div ref={containerRef} className="w-full h-full relative">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full absolute inset-0 pointer-events-auto"
        >
          {/* Subtle World Map Grid lines */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="#1e293b" strokeDasharray="1 2" strokeWidth="0.2" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeDasharray="1 2" strokeWidth="0.2" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="#1e293b" strokeDasharray="1 2" strokeWidth="0.2" />
          <line x1="25" y1="0" x2="25" y2="100" stroke="#1e293b" strokeDasharray="1 2" strokeWidth="0.2" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="#1e293b" strokeDasharray="1 2" strokeWidth="0.2" />
          <line x1="75" y1="0" x2="75" y2="100" stroke="#1e293b" strokeDasharray="1 2" strokeWidth="0.2" />

          {/* Trade Flow Arcs (Curved quadratic bezier from supplier centroid to France) */}
          {suppliers.map((s) => {
            const start = projectCoords(s.country.coordinates[0], s.country.coordinates[1]);
            const isSelected = selectedPartnerId === s.partnerCountryId;
            const isHovered = hoveredSupplier?.partnerCountryId === s.partnerCountryId;

            // Compute curve control point (arching above the direct chord)
            const midX = (start.x + francePoint.x) / 2;
            const midY = (start.y + francePoint.y) / 2 - 8;
            const pathD = `M ${start.x} ${start.y} Q ${midX} ${midY} ${francePoint.x} ${francePoint.y}`;

            // Scale line stroke width from 0.4 to 2.8 based on volume
            const strokeWidth = 0.4 + (s.totalQuantityTonnes / maxVolume) * 2.2;
            const strokeColor = isSelected
              ? '#38bdf8'
              : isHovered
              ? '#22d3ee'
              : s.marketSharePercent > 15
              ? '#06b6d4'
              : '#0284c7';

            return (
              <g key={s.partnerCountryId} className="cursor-pointer">
                {/* Invisible wider target for easier hover */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={strokeWidth + 2.5}
                  onMouseEnter={() => setHoveredSupplier(s)}
                  onMouseLeave={() => setHoveredSupplier(null)}
                  onClick={() => onSelectPartner?.(s.partnerCountryId)}
                />
                {/* Visible curved flow line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeOpacity={isSelected || isHovered ? 0.95 : 0.65}
                  className="transition-all duration-200"
                />
              </g>
            );
          })}

          {/* Documented transport route polyline traces (when enabled) */}
          {showRoutes &&
            routes.map((route) => {
              if (route.waypoints.length < 2) return null;
              const pointsStr = route.waypoints
                .map((wp) => {
                  const pt = projectCoords(wp[0], wp[1]);
                  return `${pt.x},${pt.y}`;
                })
                .join(' ');

              return (
                <polyline
                  key={route.id}
                  points={pointsStr}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="0.3"
                  strokeDasharray="0.8 0.6"
                  strokeOpacity="0.75"
                />
              );
            })}

          {/* Partner Nodes */}
          {suppliers.map((s) => {
            const pt = projectCoords(s.country.coordinates[0], s.country.coordinates[1]);
            const isSelected = selectedPartnerId === s.partnerCountryId;
            const isHovered = hoveredSupplier?.partnerCountryId === s.partnerCountryId;
            const radius = 1.2 + (s.totalQuantityTonnes / maxVolume) * 1.5;

            return (
              <g
                key={`node_${s.partnerCountryId}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredSupplier(s)}
                onMouseLeave={() => setHoveredSupplier(null)}
                onClick={() => onSelectPartner?.(s.partnerCountryId)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={radius + 0.8}
                  fill="#06b6d4"
                  fillOpacity={isSelected || isHovered ? 0.3 : 0.15}
                />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={radius}
                  fill={isSelected ? '#38bdf8' : '#0284c7'}
                  stroke="#ffffff"
                  strokeWidth="0.2"
                />
                <text
                  x={pt.x}
                  y={pt.y - radius - 0.8}
                  fill="#cbd5e1"
                  fontSize="2.2"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                  fontWeight="600"
                >
                  {s.country.id} ({s.marketSharePercent}%)
                </text>
              </g>
            );
          })}

          {/* French Hub Target */}
          <g>
            <circle cx={francePoint.x} cy={francePoint.y} r="3.5" fill="#38bdf8" fillOpacity="0.2" />
            <circle cx={francePoint.x} cy={francePoint.y} r="2.0" fill="#0284c7" stroke="#ffffff" strokeWidth="0.4" />
            <text
              x={francePoint.x}
              y={francePoint.y + 4.5}
              fill="#ffffff"
              fontSize="2.6"
              textAnchor="middle"
              fontWeight="bold"
            >
              FRANCE (Hub d'import)
            </text>
          </g>

          {/* French Infrastructures (Ports and Refineries) */}
          {showInfrastructures &&
            infrastructures.map((infra) => {
              const pt = projectCoords(infra.coordinates[0], infra.coordinates[1]);
              const isPort = infra.type === 'port' || infra.type === 'terminal';

              return (
                <g
                  key={infra.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredInfra(infra)}
                  onMouseLeave={() => setHoveredInfra(null)}
                  onClick={() => onSelectInfrastructure?.(infra)}
                >
                  {isPort ? (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="1.0"
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth="0.2"
                    />
                  ) : (
                    <rect
                      x={pt.x - 0.8}
                      y={pt.y - 0.8}
                      width="1.6"
                      height="1.6"
                      fill="#a855f7"
                      stroke="#ffffff"
                      strokeWidth="0.2"
                    />
                  )}
                </g>
              );
            })}
        </svg>
      </div>

      {/* Floating Tooltip for Supplier */}
      {hoveredSupplier && (
        <div className="absolute top-16 right-4 z-30 w-72 bg-slate-900/95 backdrop-blur-md rounded-lg border border-slate-700 p-4 shadow-2xl text-slate-100 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xl">{hoveredSupplier.country.flag}</span>
              <div>
                <h4 className="text-sm font-semibold">{hoveredSupplier.country.nameFr}</h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  Rang #{hoveredSupplier.rank} · {hoveredSupplier.country.region}
                </span>
              </div>
            </div>
            <ConfidenceBadge level={hoveredSupplier.confidence} />
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Volume importé :</span>
              <span className="font-mono font-semibold text-white">
                {formatTonnes(hoveredSupplier.totalQuantityTonnes)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Part de marché :</span>
              <span className="font-mono font-semibold text-cyan-400">
                {hoveredSupplier.marketSharePercent}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Valeur totale :</span>
              <span className="font-mono text-white">
                {formatCurrencyEur(hoveredSupplier.totalValueEur)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Prix unitaire implicite :</span>
              <span className="font-mono text-slate-300">
                {hoveredSupplier.implicitPriceEurPerTonne} € / t
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Cliquez pour filtrer ce partenaire</span>
            <span className="font-mono text-cyan-400">DGDDI</span>
          </div>
        </div>
      )}

      {/* Floating Tooltip for Infrastructure */}
      {hoveredInfra && (
        <div className="absolute bottom-16 right-4 z-30 w-72 bg-slate-900/95 backdrop-blur-md rounded-lg border border-slate-700 p-4 shadow-2xl text-slate-100">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            {hoveredInfra.type === 'refinery' ? (
              <Factory className="w-4 h-4 text-purple-400 shrink-0" />
            ) : (
              <Anchor className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <div className="truncate">
              <h4 className="text-xs font-semibold truncate">{hoveredInfra.name}</h4>
              <span className="text-[10px] text-slate-400 uppercase font-mono">
                {hoveredInfra.type} · {hoveredInfra.operator}
              </span>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-slate-300 line-clamp-3">
            {hoveredInfra.descriptionFr}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] flex justify-between text-slate-400">
            <span>Capacité annuelle :</span>
            <span className="font-mono text-white">
              {formatTonnes(hoveredInfra.capacityAnnualTonnes)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
