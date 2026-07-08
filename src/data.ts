import { type AeroCell, type AeroCategory } from './types';

export const CELLS: AeroCell[] = [
  { id: 'cell-1', name: 'Pine & Broadway', type: 'traffic', base: 45, volatility: 25, sensor: true, q: 0, r: 0 },
  { id: 'cell-2', name: 'Industrial East', type: 'industrial', base: 110, volatility: 45, sensor: true, q: 1, r: -1 },
  { id: 'cell-3', name: 'West Dump Yard', type: 'dump', base: 130, volatility: 60, sensor: true, q: -1, r: 1 },
  { id: 'cell-4', name: 'Oakridge Residential', type: 'residential', base: 25, volatility: 10, sensor: true, q: 0, r: -1 },
  { id: 'cell-5', name: 'Riverfront Greenways', type: 'green', base: 12, volatility: 5, sensor: true, q: 1, r: 0 },
  { id: 'cell-6', name: 'Terminal 4 Shipping', type: 'industrial', base: 95, volatility: 40, sensor: false, q: -1, r: 0 },
  { id: 'cell-7', name: 'Sunset Boulevard', type: 'traffic', base: 65, volatility: 30, sensor: true, q: -2, r: 2 },
  { id: 'cell-8', name: 'Shady Grove Suburbs', type: 'residential', base: 28, volatility: 12, sensor: false, q: 2, r: -2 },
  { id: 'cell-9', name: 'Sector 9 Industrial', type: 'industrial', base: 125, volatility: 50, sensor: true, q: -2, r: 1 },
  { id: 'cell-10', name: 'Central Transit Hub', type: 'traffic', base: 85, volatility: 35, sensor: true, q: 2, r: -1 },
  { id: 'cell-11', name: 'Maplewood Valley', type: 'green', base: 15, volatility: 6, sensor: true, q: -1, r: 2 },
  { id: 'cell-12', name: 'Northside Landfill', type: 'dump', base: 140, volatility: 65, sensor: false, q: 0, r: 1 },
  { id: 'cell-13', name: 'Heights District', type: 'residential', base: 30, volatility: 15, sensor: true, q: -2, r: 0 },
  { id: 'cell-14', name: 'Forest Park Buffer', type: 'green', base: 10, volatility: 4, sensor: false, q: 2, r: 0 },
  { id: 'cell-15', name: 'East Junction Tolls', type: 'traffic', base: 90, volatility: 38, sensor: false, q: 1, r: 1 },
  { id: 'cell-16', name: 'Southeast Foundries', type: 'industrial', base: 115, volatility: 48, sensor: true, q: 0, r: 2 },
];

export function getCategoryFor(aqi: number): AeroCategory {
  if (aqi <= 50) {
    return { label: 'Good', color: '#10b981', textCol: 'text-emerald-700', bgCol: 'bg-emerald-50 border border-emerald-200' };
  } else if (aqi <= 100) {
    return { label: 'Moderate', color: '#eab308', textCol: 'text-amber-700', bgCol: 'bg-amber-50 border border-amber-200' };
  } else if (aqi <= 150) {
    return { label: 'Sensitive', color: '#f97316', textCol: 'text-orange-700', bgCol: 'bg-orange-50 border border-orange-200' };
  } else if (aqi <= 200) {
    return { label: 'Unhealthy', color: '#ef4444', textCol: 'text-red-700', bgCol: 'bg-red-50 border border-red-200' };
  } else {
    return { label: 'Hazardous', color: '#a855f7', textCol: 'text-purple-700', bgCol: 'bg-purple-50 border border-purple-200' };
  }
}

// Compute dynamic live reading based on time of day, base AQI, volatility and potential custom override
export function getReadingFor(cell: AeroCell, hourOffset: number = 0, override?: { base?: number; volatility?: number }): number {
  const base = override?.base !== undefined ? override.base : cell.base;
  const volt = override?.volatility !== undefined ? override.volatility : cell.volatility;

  // Diurnal traffic and industrial curve: peaking around 8 AM (commute) and 6 PM (commute + factory shifts)
  const date = new Date();
  const currentHour = (date.getHours() + hourOffset) % 24;
  
  // Sine wave peaking at 8 AM and 6 PM
  const timeFactor = 0.3 * Math.sin(((currentHour - 8) * Math.PI) / 6) + 
                     0.2 * Math.sin(((currentHour - 18) * Math.PI) / 6);
  
  // Pseudo-random noise based on cell ID and current hour
  const noiseSeed = cell.id.charCodeAt(cell.id.length - 1) + currentHour;
  const noise = (Math.sin(noiseSeed) * Math.cos(noiseSeed * 1.5) * 0.5);

  let finalValue = base + (volt * timeFactor) + (volt * noise * 0.4);

  // Hard clamp value between 5 and 500
  return Math.max(5, Math.min(500, Math.round(finalValue)));
}

// Compute risk parameters for 24h peak and alert threshold crossings
export function getRiskScore(cell: AeroCell, override?: { base?: number; volatility?: number }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const readings = hours.map(h => getReadingFor(cell, h, override));
  const peak = Math.max(...readings);
  const min = Math.min(...readings);
  const crossesThreshold = peak > 150;

  return { peak, min, crossesThreshold };
}
