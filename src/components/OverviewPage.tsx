import React from 'react';
import { Wind, ShieldAlert, ArrowRight, Camera, Cpu, Globe, AlertTriangle, TrendingUp, Inbox } from 'lucide-react';
import { getCategoryFor } from '../data';

interface OverviewPageProps {
  onExplore: () => void;
  onReport: () => void;
  activeAlertsCount: number;
  worstCellName: string;
  worstCellAqi: number;
}

export default function OverviewPage({
  onExplore,
  onReport,
  activeAlertsCount,
  worstCellName,
  worstCellAqi,
}: OverviewPageProps) {
  const worstCategory = getCategoryFor(worstCellAqi);

  // Math for gauge needle
  const gaugeMin = 0;
  const gaugeMax = 300;
  const angleStart = -120; // in degrees
  const angleEnd = 120;
  const clampedAqi = Math.max(gaugeMin, Math.min(gaugeMax, worstCellAqi));
  const percentage = (clampedAqi - gaugeMin) / (gaugeMax - gaugeMin);
  const needleAngle = angleStart + percentage * (angleEnd - angleStart);

  return (
    <div className="space-y-20 py-8 px-4 sm:px-6 md:px-8">
      {/* Hero Section */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600"></span>
            </span>
            Hyperlocal Air Quality · Real-time Database
          </div>

          <h1 className="font-sans text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            The smoke your city's{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AQI map never sees.
            </span>
          </h1>

          <p className="text-lg leading-relaxed text-slate-600">
            A garbage fire two streets over. A foundry running a night shift. A junction that traps exhaust
            every evening at six. City-wide sensors average these away — AeroWatch fuses citizen photos, ground sensors,
            and satellite imagery to catch them block by block, then predicts where the air turns bad next.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={onExplore}
              className="group flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/10 active:scale-95 shadow-md"
            >
              Open Live Map
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={onReport}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 shadow-sm"
            >
              Report Smoke or Dust
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-8">
            <div className="space-y-1">
              <span className="block font-mono text-3xl font-bold text-slate-900 sm:text-4xl">16</span>
              <span className="text-xs text-slate-500">Cells Monitored</span>
            </div>
            <div className="space-y-1">
              <span className="block font-mono text-3xl font-bold text-slate-900 sm:text-4xl">24h</span>
              <span className="text-xs text-slate-500">Forecast Horizon</span>
            </div>
            <div className="space-y-1">
              <span className="block font-mono text-3xl font-bold text-red-600 sm:text-4xl">
                {activeAlertsCount}
              </span>
              <span className="text-xs text-slate-500">Active Hotspots</span>
            </div>
          </div>
        </div>

        {/* Live Gauge Preview Card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                </span>
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                  {worstCellName} · Live Reading
                </span>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${worstCategory.bgCol} ${worstCategory.textCol}`}>
                {worstCategory.label}
              </span>
            </div>

            {/* SVG Circular Gauge */}
            <div className="relative flex flex-col items-center justify-center py-6">
              <svg className="w-56 h-56" viewBox="0 0 200 200">
                {/* Gauge Background Arch */}
                <path
                  d="M 40,160 A 70,70 0 1,1 160,160"
                  fill="none"
                  stroke="rgba(0,0,0,0.05)"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                
                {/* Colorful Segment Indicator */}
                <path
                  d="M 40,160 A 70,70 0 0,1 80,68"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M 80,68 A 70,70 0 0,1 120,68"
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M 120,68 A 70,70 0 0,1 160,160"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="12"
                  strokeLinecap="round"
                />

                {/* Dial Indicator Needle */}
                <g transform={`rotate(${needleAngle}, 100, 100)`}>
                  <polygon
                    points="97,100 100,30 103,100"
                    fill={worstCategory.color}
                    className="transition-transform duration-1000 ease-out"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
                  />
                  <circle cx="100" cy="100" r="8" fill="#ffffff" />
                  <circle cx="100" cy="100" r="4" fill={worstCategory.color} />
                </g>
              </svg>

              {/* Central Text */}
              <div className="absolute top-[52%] flex flex-col items-center text-center">
                <span className="text-4xl font-extrabold tracking-tight" style={{ color: worstCategory.color }}>
                  {worstCellAqi}
                </span>
                <span className="text-xs font-mono tracking-wide text-slate-500 font-semibold">AQI PM2.5</span>
              </div>
            </div>

            <div className="mt-2 text-center text-xs text-slate-500 leading-relaxed">
              The highest estimated air pollution index currently detected in the ground mesh.
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline Infographic Section */}
      <section className="mx-auto max-w-7xl border-t border-slate-200 pt-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="font-mono text-xs uppercase tracking-widest text-blue-600 font-bold">How It Works</span>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Three feeds in, one map out, one alert where it matters.
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="relative rounded-xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm">
            <span className="block font-mono text-xs font-bold text-blue-600">01 / DETECT</span>
            <h4 className="text-base font-bold text-slate-800">Citizens, sensors, satellites</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Residents upload photos of smoke or dust. Low-cost ground sensors stream real-time readings, while satellite passes fill spatial gaps.
            </p>
          </div>
          <div className="relative rounded-xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm">
            <span className="block font-mono text-xs font-bold text-blue-600">02 / FUSE</span>
            <h4 className="text-base font-bold text-slate-800">One grid, not three feeds</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Every input maps directly to the nearest neighborhood hex grid, letting photo reports and physical sensors correlate automatically.
            </p>
          </div>
          <div className="relative rounded-xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm">
            <span className="block font-mono text-xs font-bold text-blue-600">03 / PREDICT</span>
            <h4 className="text-base font-bold text-slate-800">24 hours ahead, not just now</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Our forecasting models project each block forward, factoring in Land Use patterns and recent volatility to anticipate severe spikes.
            </p>
          </div>
          <div className="relative rounded-xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm">
            <span className="block font-mono text-xs font-bold text-blue-600">04 / DISPATCH</span>
            <h4 className="text-base font-bold text-slate-800">Routed to the right crew</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Cells crossing alert thresholds trigger tickets in the Ops Console, routing mist cannons or inspectors to the specific street blocks.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="mx-auto max-w-7xl border-t border-slate-200 pt-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="font-mono text-xs uppercase tracking-widest text-blue-600 font-bold">Platform Features</span>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Built to illuminate industrial & urban blind spots.
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Camera className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-800">Citizen Photo Reports</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Any user can register and flag localized open burning, heavy smoke plumes, or construction dust clouds with photos and text notes.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Cpu className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-800">Continuous Sensor Mesh</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Fuses telemetry data from distributed low-cost ground stations, providing immediate and reliable PM2.5, PM10, and NO₂ values.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Globe className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-800">Satellite Aerosol Ingestion</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Provides estimated coverage over park borders and residential outer-rings where physical sensor placements are commercially unviable.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-800">Hidden Hotspot Flagging</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              The platform flags and detects un-monitored grid cells displaying persistent increases, eliminating critical municipal blind spots.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-800">24h Spike Forecasting</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Generates a rolling forecast projection for every cell in the city so public health advisories and mist cannons can be deployed proactively.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Inbox className="h-5 w-5" />
            </div>
            <h4 className="text-lg font-bold text-slate-800">Municipal Dispatch Board</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Integrated ticket system that converts detected hotspot events into actionable dispatch tasks with status trackers for mitigation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
