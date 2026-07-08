import React from 'react';
import { motion } from 'motion/react';
import { getCategory } from '../data';

interface SpeedometerProps {
  aqi: number;
  locationName: string;
  subLocation?: string;
  size?: number;
}

export default function Speedometer({
  aqi,
  locationName,
  subLocation,
  size = 320
}: SpeedometerProps) {
  const maxAqi = 500;
  const startAngle = -225; // degrees
  const endAngle = 45;     // degrees
  const totalSweep = endAngle - startAngle; // 270 degrees sweep

  const currentCat = getCategory(aqi);

  // Math conversions
  const angleForValue = (v: number) => {
    const ratio = Math.min(v, maxAqi) / maxAqi;
    return startAngle + ratio * totalSweep;
  };

  const needleRotation = angleForValue(aqi);

  // Generate SVG arcs for the colored thresholds
  const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + radius * Math.cos(angleInRadians),
      y: cy + radius * Math.sin(angleInRadians)
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
  };

  // Define segments for realistic dial bands
  const bands = [
    { from: 0, to: 50, color: '#10b981', label: 'Good' },
    { from: 50, to: 100, color: '#eab308', label: 'Moderate' },
    { from: 100, to: 150, color: '#f97316', label: 'Unhealthy for Sensitive' },
    { from: 150, to: 200, color: '#ef4444', label: 'Unhealthy' },
    { from: 200, to: 300, color: '#ec4899', label: 'Very Unhealthy' },
    { from: 300, to: 500, color: '#a855f7', label: 'Hazardous' }
  ];

  const ticks: React.ReactNode[] = [];
  for (let val = 0; val <= 500; val += 25) {
    const v = val; // scope limit
    if (v > 500) break;
    const tickAngle = angleForValue(v);
    const startPt = polarToCartesian(150, 150, 114, tickAngle);
    const endPt = polarToCartesian(150, 150, 122, tickAngle);
    const textPt = polarToCartesian(150, 150, 94, tickAngle);

    const isMajor = v % 100 === 0;

    ticks.push(
      <line
        key={`tick-${v}`}
        x1={startPt.x}
        y1={startPt.y}
        x2={endPt.x}
        y2={endPt.y}
        stroke={isMajor ? '#e2e8f0' : 'rgba(226, 232, 240, 0.4)'}
        strokeWidth={isMajor ? 2.5 : 1}
      />
    );

    if (isMajor) {
      ticks.push(
        <text
          key={`lbl-${v}`}
          x={textPt.x}
          y={textPt.y + 4}
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="700"
          fill="rgba(226, 232, 240, 0.7)"
          className="font-mono select-none"
        >
          {v}
        </text>
      );
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden group">
      {/* Ambient background glow mapped to current AQI classification */}
      <div 
        className="absolute inset-0 -z-10 opacity-10 blur-3xl transition-colors duration-1000"
        style={{
          background: `radial-gradient(circle at center, ${currentCat.color} 0%, transparent 70%)`
        }}
      />

      {/* Decorative metal-like outer bezel */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/2 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
      
      {/* Speedometer Header */}
      <div className="text-center mb-1">
        <span className="text-[10px] tracking-[0.2em] font-mono text-cyan-400 font-bold uppercase select-none">
          Ambient Speedometer
        </span>
      </div>

      <div className="relative" style={{ width: size, height: size }}>
        <svg 
          viewBox="0 0 300 300" 
          width="100%" 
          height="100%"
          className="drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
        >
          {/* Inner dark matte shadow dial back */}
          <circle cx="150" cy="150" r="130" fill="#0b0f19" />
          <circle cx="150" cy="150" r="128" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />

          {/* Render individual segment bands */}
          {bands.map((b, idx) => {
            const sAng = angleForValue(b.from);
            const eAng = angleForValue(b.to);
            return (
              <path
                key={`band-${idx}`}
                d={describeArc(150, 150, 115, sAng, eAng)}
                fill="none"
                stroke={b.color}
                strokeWidth="11"
                strokeLinecap="butt"
                opacity={aqi >= b.from ? "0.9" : "0.25"}
                className="transition-all duration-1000"
              />
            );
          })}

          {/* Render tick markings */}
          {ticks}

          {/* Dynamic LED Light Indicators near current status */}
          <circle 
            cx="150" 
            cy="27" 
            r="3.5" 
            fill={currentCat.color} 
            className="animate-pulse" 
            style={{ filter: `drop-shadow(0 0 4px ${currentCat.color})` }}
          />

          {/* Reflective light arc on bezel */}
          <path
            d={describeArc(150, 150, 127, -180, 0)}
            fill="none"
            stroke="url(#reflect-grad)"
            strokeWidth="1.5"
            opacity="0.3"
          />

          {/* Metallic Center Pivot cap */}
          <g>
            <circle cx="150" cy="150" r="28" fill="#1e293b" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <circle cx="150" cy="150" r="24" fill="url(#metallic-grad)" />
            <circle cx="150" cy="150" r="14" fill="#0f172a" />
          </g>

          {/* Rotatable Needle styled like premium chrome indicator */}
          <motion.g
            animate={{ rotate: needleRotation }}
            transition={{ type: 'spring', stiffness: 45, damping: 15 }}
            style={{ originX: '150px', originY: '150px' }}
          >
            {/* Real shadow backing for realistic depth */}
            <line
              x1="150"
              y1="150"
              x2="150"
              y2="42"
              stroke="rgba(0,0,0,0.6)"
              strokeWidth="4"
              strokeLinecap="round"
              transform="translate(2, 4)"
            />
            {/* The chrome sharp pointer */}
            <line
              x1="150"
              y1="150"
              x2="150"
              y2="40"
              stroke="#f1f5f9"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <polygon
              points="147.5,100 152.5,100 150,34"
              fill="#ef4444"
              style={{ filter: 'drop-shadow(0 0 2px rgba(239,68,68,0.5))' }}
            />
            {/* Center brass pin */}
            <circle cx="150" cy="150" r="5" fill="#facc15" />
          </motion.g>

          {/* Grad definitions for shiny reflections */}
          <defs>
            <linearGradient id="reflect-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
            </linearGradient>
            <radialGradient id="metallic-grad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#475569" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>
          </defs>
        </svg>

        {/* Floating Readout in Center Core */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 pointer-events-none">
          <motion.span 
            key={aqi}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-extrabold tracking-tight font-mono leading-none select-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
            style={{ color: currentCat.color }}
          >
            {aqi}
          </motion.span>
          <span 
            className="text-[10px] font-bold tracking-[0.18em] font-mono mt-2 uppercase text-center select-none"
            style={{ color: currentCat.color }}
          >
            {currentCat.label}
          </span>
        </div>
      </div>

      {/* Target Location Metadata Footer */}
      <div className="text-center mt-2 px-4 max-w-[280px]">
        <h3 className="text-lg font-bold tracking-tight text-slate-100 truncate">
          {locationName}
        </h3>
        <p className="text-xs text-slate-400 truncate mt-0.5 font-medium">
          {subLocation || 'Verified Station'}
        </p>
      </div>
    </div>
  );
}
