import React, { useState, useEffect } from 'react';
import { type User, type AeroCell, type CellOverride } from '../types';
import { CELLS, getCategoryFor, getReadingFor, getRiskScore } from '../data';
import { MapPin, Shield, Cpu, RefreshCw, Layers, Sliders, Check, ChevronRight } from 'lucide-react';

interface DashboardPageProps {
  currentUser: User | null;
  overrides: Record<string, CellOverride>;
  onSaveOverride: (cellId: string, base: number, volatility: number, noteText: string) => Promise<void>;
}

export default function DashboardPage({ currentUser, overrides, onSaveOverride }: DashboardPageProps) {
  const [selectedCellId, setSelectedCellId] = useState<string>('cell-9'); // Sector 9 defaults
  const [baseInput, setBaseInput] = useState<string>('');
  const [volatilityInput, setVolatilityInput] = useState<string>('');
  const [noteInput, setNoteInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSavedBadge, setShowSavedBadge] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  const selectedBaseCell = CELLS.find(c => c.id === selectedCellId) || CELLS[0];
  const activeOverride = overrides[selectedCellId];

  // Merge override values
  const currentCell: AeroCell = {
    ...selectedBaseCell,
    base: activeOverride?.base !== undefined ? activeOverride.base : selectedBaseCell.base,
    volatility: activeOverride?.volatility !== undefined ? activeOverride.volatility : selectedBaseCell.volatility,
  };

  const activeNote = activeOverride?.noteText || '';

  // Calculate stats
  const liveAqi = getReadingFor(selectedBaseCell, 0, activeOverride);
  const category = getCategoryFor(liveAqi);
  const risk = getRiskScore(selectedBaseCell, activeOverride);

  // Sync inputs when selected cell changes
  useEffect(() => {
    setBaseInput(currentCell.base.toString());
    setVolatilityInput(currentCell.volatility.toString());
    setNoteInput(activeNote);
  }, [selectedCellId, overrides]);

  // Sync current local time
  useEffect(() => {
    setCurrentTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const timer = setInterval(() => {
      setCurrentTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const baseNum = parseInt(baseInput) || selectedBaseCell.base;
      const voltNum = parseInt(volatilityInput) || selectedBaseCell.volatility;
      await onSaveOverride(selectedCellId, baseNum, voltNum, noteInput);
      setShowSavedBadge(true);
      setTimeout(() => setShowSavedBadge(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // --- SVG Hexagon Map Math ---
  const mapWidth = 520;
  const mapHeight = 360;
  const hexSize = 34; // Outer radius of hexagon
  const centerX = mapWidth / 2;
  const centerY = mapHeight / 2;

  // Convert axial coordinates (q, r) to pixel coordinates (cx, cy)
  const getPixelCoords = (q: number, r: number) => {
    const x = centerX + hexSize * (3/2 * q);
    const y = centerY + hexSize * (Math.sqrt(3) * (r + q/2));
    return { x, y };
  };

  // Generate hexagon coordinates for points
  const getHexPoints = (cx: number, cy: number, r: number) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);
      points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    }
    return points.join(' ');
  };

  // --- Custom Forecast SVG Chart Math ---
  const hoursOfForecast = [0, 3, 6, 9, 12, 15, 18, 21, 24];
  const chartWidth = 460;
  const chartHeight = 160;
  const paddingX = 35;
  const paddingY = 20;

  // Map AQI and index to chart pixels
  const maxChartVal = 250;
  const getChartCoords = (index: number, aqiVal: number) => {
    const x = paddingX + (index / (hoursOfForecast.length - 1)) * (chartWidth - paddingX - 15);
    const y = chartHeight - paddingY - (Math.min(maxChartVal, aqiVal) / maxChartVal) * (chartHeight - paddingY - 15);
    return { x, y };
  };

  // Build forecast data array
  const forecastPoints = hoursOfForecast.map((h, idx) => {
    const val = getReadingFor(selectedBaseCell, h, activeOverride);
    return { h, val, ...getChartCoords(idx, val) };
  });

  // Polyline points string
  const polylinePointsStr = forecastPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Gradient area points string
  const firstPoint = forecastPoints[0];
  const lastPoint = forecastPoints[forecastPoints.length - 1];
  const bottomY = chartHeight - paddingY;
  const gradientAreaPointsStr = `${firstPoint.x},${bottomY} ${polylinePointsStr} ${lastPoint.x},${bottomY}`;

  // Count active hotspots in total
  const totalHotspots = CELLS.filter(c => {
    const cellOver = overrides[c.id];
    return getRiskScore(c, cellOver).crossesThreshold;
  }).length;

  const worstCell = CELLS.map(c => {
    const cellOver = overrides[c.id];
    return { c, aqi: getReadingFor(c, 0, cellOver) };
  }).sort((a, b) => b.aqi - a.aqi)[0];

  const highestForecastPeak = Math.max(...CELLS.map(c => {
    const cellOver = overrides[c.id];
    return getRiskScore(c, cellOver).peak;
  }));

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
      {/* Dashboard Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Neighbourhood Air Quality</h1>
          <div className="mt-1 flex items-center gap-2 font-mono text-xs text-slate-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600"></span>
            </span>
            <span>Last synced {currentTimeStr} · Live DB Feed</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-mono text-slate-500 bg-white border border-slate-200 px-4 py-2.5 rounded-lg shadow-sm">
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#10b981]" /> Good</div>
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#eab308]" /> Moderate</div>
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#f97316]" /> Sensitive</div>
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#ef4444]" /> Unhealthy</div>
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#a855f7]" /> Hazard</div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-blue-500 bg-blue-50" /> Photo Coverage</div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">Cells Monitored</span>
          <span className="mt-1 block font-mono text-3xl font-extrabold text-slate-900">16</span>
          <span className="mt-1 block text-xs text-emerald-600 font-semibold font-mono">▲ All online</span>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">Active Hotspots</span>
          <span className="mt-1 block font-mono text-3xl font-extrabold text-red-600">{totalHotspots}</span>
          <span className="mt-1 block text-xs text-slate-500 font-semibold font-mono">▲ AQI Peak &gt; 150</span>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">Worst AQI Now</span>
          <span className="mt-1 block font-mono text-3xl font-extrabold text-amber-600">{worstCell.aqi}</span>
          <span className="mt-1 block text-xs text-slate-500 font-medium truncate">▲ {worstCell.c.name}</span>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">24h Peak Forecast</span>
          <span className="mt-1 block font-mono text-3xl font-extrabold text-indigo-600">{highestForecastPeak}</span>
          <span className="mt-1 block text-xs text-slate-500 font-mono">Predicted Max</span>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Left Column - Hex map (grid-row span 2) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md lg:col-span-7 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-800">
              <Layers className="h-4 w-4 text-blue-600" />
              Sensor Mesh · Click Cell to Inspect
            </h3>
            <span className="inline-flex items-center gap-1 rounded bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 font-mono">
              ● ACTIVE DB OVERRIDES
            </span>
          </div>

          {/* Hex Map container */}
          <div className="flex items-center justify-center py-6 overflow-x-auto">
            <svg width={mapWidth} height={mapHeight} className="overflow-visible select-none">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Draw hex grid */}
              {CELLS.map((cell) => {
                const cellOver = overrides[cell.id];
                const { x, y } = getPixelCoords(cell.q, cell.r);
                const aqi = getReadingFor(cell, 0, cellOver);
                const isSelected = cell.id === selectedCellId;
                const cellCat = getCategoryFor(aqi);

                return (
                  <g
                    key={cell.id}
                    transform={`translate(${x}, ${y})`}
                    onClick={() => setSelectedCellId(cell.id)}
                    className="cursor-pointer group"
                  >
                    {/* Pulsing alert ring for hotspots */}
                    {getRiskScore(cell, cellOver).crossesThreshold && (
                      <polygon
                        points={getHexPoints(0, 0, hexSize + 6)}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        className="animate-pulse"
                        opacity="0.5"
                      />
                    )}

                    {/* Outer hover boundary */}
                    <polygon
                      points={getHexPoints(0, 0, hexSize)}
                      fill={cellCat.color}
                      opacity={isSelected ? '0.85' : '0.22'}
                      stroke={isSelected ? '#2563eb' : 'rgba(0,0,0,0.06)'}
                      strokeWidth={isSelected ? '3' : '1'}
                      className="transition-all duration-200 group-hover:opacity-60"
                      style={isSelected ? { filter: 'url(#glow)' } : undefined}
                    />

                    {/* White center for styling */}
                    <polygon
                      points={getHexPoints(0, 0, hexSize - 5)}
                      fill="#ffffff"
                      opacity="0.95"
                    />

                    {/* Inner glowing core proportional to AQI */}
                    <polygon
                      points={getHexPoints(0, 0, Math.max(10, (hexSize - 8) * Math.min(1, aqi/250)))}
                      fill={cellCat.color}
                      opacity="0.85"
                      className="transition-all duration-300"
                    />

                    {/* Label/ID overlay */}
                    <text
                      textAnchor="middle"
                      dy="-2"
                      fill={isSelected ? '#0f172a' : '#334155'}
                      fontSize="9"
                      fontWeight="extrabold"
                      fontFamily="monospace"
                      opacity={isSelected ? '1' : '0.75'}
                      className="pointer-events-none"
                    >
                      {aqi}
                    </text>
                    <text
                      textAnchor="middle"
                      dy="10"
                      fill={cell.sensor ? '#64748b' : '#2563eb'}
                      fontSize="7"
                      fontFamily="monospace"
                      opacity="0.6"
                      className="pointer-events-none"
                    >
                      {cell.sensor ? 'SEN' : 'PHO'}
                    </text>

                    {/* Small dot marking non-manned satellite coverage */}
                    {!cell.sensor && (
                      <circle
                        cx="0"
                        cy={-hexSize + 8}
                        r="3"
                        fill="#2563eb"
                        stroke="#ffffff"
                        strokeWidth="1"
                        className="pointer-events-none animate-pulse"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-600">
            💡 <span className="font-semibold text-slate-800">Tip:</span> Red outlined hexagons represent cells classified as active hotspots (peak AQI &gt; 150). Blue dots represent grids covered primarily via satellite + photo uploads (no physical ground stations).
          </div>
        </div>

        {/* Right Column - Selected cell info + Forecast */}
        <div className="space-y-6 lg:col-span-5 flex flex-col justify-between">
          
          {/* Selected Cell Detail Panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-800">
                  <Sliders className="h-4 w-4 text-blue-600" />
                  Selected Cell Info
                </h3>
                {showSavedBadge && (
                  <span className="inline-flex items-center gap-1 rounded bg-green-50 border border-green-200 px-2 py-0.5 text-xs font-semibold text-green-700 animate-bounce">
                    <Check className="h-3 w-3" /> Saved to DB
                  </span>
                )}
              </div>

              {/* Cell Header and AQI block */}
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xl font-bold text-slate-900">{currentCell.name}</h4>
                  <span className="text-xs font-mono text-slate-500 uppercase font-medium">
                    {currentCell.type} · {currentCell.sensor ? 'Ground Station Mesh' : 'Satellite / Photo Coverage'}
                  </span>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${category.bgCol} ${category.textCol}`}>
                  {category.label}
                </span>
              </div>

              {/* Main AQI Display Row */}
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3 items-center rounded-xl bg-slate-50 p-4 border border-slate-200/60">
                <div className="sm:col-span-1 text-center sm:text-left">
                  <span className="block text-[10px] font-mono text-slate-500 uppercase font-semibold">Live Reading</span>
                  <span className="text-4xl font-extrabold tracking-tight" style={{ color: category.color }}>
                    {liveAqi}
                  </span>
                </div>
                <div className="sm:col-span-2 text-xs text-slate-600 space-y-1">
                  <p>PM2.5 AQI category: <span className="font-semibold text-slate-900">{category.label}</span></p>
                  <p>24h Range: <span className="font-mono text-slate-900">{risk.min}</span> to <span className="font-mono font-bold text-slate-900">{risk.peak}</span></p>
                  <p className="flex items-center gap-1.5 mt-1">
                    Hotspot: {risk.crossesThreshold ? (
                      <span className="font-bold text-red-600 animate-pulse">⚠️ Active Hotspot</span>
                    ) : (
                      <span className="text-blue-600 font-semibold">✓ Within Standard Limits</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Overrides Input Form */}
              <form onSubmit={handleSave} className="mt-6 border-t border-slate-100 pt-5 space-y-4">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-blue-600 font-bold">
                  Override Database inputs
                </span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-slate-500 font-bold">Base AQI</label>
                    <input
                      type="number"
                      min="5"
                      max="500"
                      value={baseInput}
                      onChange={(e) => setBaseInput(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-white p-2 text-sm text-slate-850 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-slate-500 font-bold">Volatility</label>
                    <input
                      type="number"
                      min="1"
                      max="150"
                      value={volatilityInput}
                      onChange={(e) => setVolatilityInput(e.target.value)}
                      className="w-full rounded border border-slate-200 bg-white p-2 text-sm text-slate-850 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-slate-500 font-bold">Field Note (Optional)</label>
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="e.g. Observed burning dust pile at 7am"
                    className="w-full rounded border border-slate-200 bg-white p-2 text-sm text-slate-850 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50 shadow-md shadow-blue-500/5"
                >
                  <RefreshCw className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
                  {isSaving ? 'Saving Changes...' : 'Save Database Overrides'}
                </button>
              </form>
            </div>
          </div>

          {/* 24h Forecast Panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
            <h3 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
              <Layers className="h-4 w-4 text-indigo-600" />
              24h Forecast — {currentCell.name}
            </h3>

            {/* Custom SVG Line Chart */}
            <div className="mt-4 flex justify-center">
              <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
                {/* Horizontal grid lines */}
                {[50, 100, 150, 200].map((gridVal) => {
                  const y = chartHeight - paddingY - (gridVal / maxChartVal) * (chartHeight - paddingY - 15);
                  return (
                    <g key={gridVal} opacity="0.08">
                      <line x1={paddingX} y1={y} x2={chartWidth - 10} y2={y} stroke="#000000" strokeWidth="1" />
                      <text x={paddingX - 6} y={y + 3} fill="#000000" fontSize="8" textAnchor="end" fontFamily="monospace">
                        {gridVal}
                      </text>
                    </g>
                  );
                })}

                {/* 150 Critical threshold dash-line */}
                {(() => {
                  const yThreshold = chartHeight - paddingY - (150 / maxChartVal) * (chartHeight - paddingY - 15);
                  return (
                    <g opacity="0.8">
                      <line
                        x1={paddingX}
                        y1={yThreshold}
                        x2={chartWidth - 10}
                        y2={yThreshold}
                        stroke="#ef4444"
                        strokeWidth="1.2"
                        strokeDasharray="4 4"
                      />
                      <text x={chartWidth - 12} y={yThreshold - 4} fill="#ef4444" fontSize="7" fontWeight="bold" textAnchor="end" fontFamily="monospace">
                        CRITICAL HOTSPOT THRESHOLD (150)
                      </text>
                    </g>
                  );
                })()}

                {/* Shading Area gradient under line */}
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={gradientAreaPointsStr} fill="url(#areaGrad)" />

                {/* Forecast Trend Line */}
                <polyline points={polylinePointsStr} fill="none" stroke="#2563eb" strokeWidth="2.5" />

                {/* Data point circles & hover triggers */}
                {forecastPoints.map((p, idx) => {
                  const isHovered = p.h === 0;
                  return (
                    <g key={idx}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? '4.5' : '3'}
                        fill="#ffffff"
                        stroke={getCategoryFor(p.val).color}
                        strokeWidth="2"
                      />
                      <text
                        x={p.x}
                        y={p.y - 8}
                        fill="#64748b"
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="bold"
                        textAnchor="middle"
                        opacity={isHovered || idx % 2 === 0 ? '1' : '0'}
                      >
                        {p.val}
                      </text>
                      <text
                        x={p.x}
                        y={chartHeight - 4}
                        fill="#64748b"
                        fontSize="8"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        +{p.h}h
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

        </div>
      </div>

      {/* Ground sensors readouts cards row */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <h3 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-4">
          <Layers className="h-4 w-4 text-blue-600" />
          Ground Station Sensor Telemetry Grid
        </h3>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {CELLS.map((base) => {
            const cellOver = overrides[base.id];
            const aqi = getReadingFor(base, 0, cellOver);
            const cat = getCategoryFor(aqi);
            const isSelected = base.id === selectedCellId;
            const hasOver = !!cellOver;

            return (
              <button
                key={base.id}
                onClick={() => setSelectedCellId(base.id)}
                className={`relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all hover:scale-102 focus:outline-none ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/30 shadow-md shadow-blue-500/5'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="truncate text-xs font-bold text-slate-800">{base.name}</span>
                    {hasOver && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" title="Has database settings override" />}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wide">
                    {base.type}
                  </span>
                </div>

                <div className="mt-3 flex items-end justify-between">
                  <span className="font-mono text-lg font-bold" style={{ color: cat.color }}>
                    {aqi}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${cat.bgCol} ${cat.textCol}`}>
                    {cat.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
