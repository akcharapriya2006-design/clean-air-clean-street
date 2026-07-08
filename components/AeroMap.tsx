import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CityCell } from '../types';
import { getCategory, getDetailedReading } from '../data';

interface AeroMapProps {
  cells: CityCell[];
  selectedCellId: string;
  onSelectCell: (id: string) => void;
  overlayOpacity: number; // between 0 and 1
}

export default function AeroMap({
  cells,
  selectedCellId,
  onSelectCell,
  overlayOpacity
}: AeroMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const waqiLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Leaflet instance
    // Center at Tamil Nadu coordinates (approx lat: 10.8, lng: 78.5) and zoom 7 for perfect Tamil Nadu & South India view
    const initialLat = 10.85;
    const initialLng = 78.55;
    const initialZoom = 7;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      minZoom: 4,
      maxZoom: 13
    }).setView([initialLat, initialLng], initialZoom);

    mapRef.current = map;

    // High performance dark-themed open street map base tiles using standard public layers and CSS filters
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Load WAQI Tile Overlays
    // Using a reliable demo or generic token for tiles
    const token = localStorage.getItem('aerowatch_waqi_token') || 'demo';
    const waqiLayer = L.tileLayer(`https://tiles.waqi.info/tiles/usepa-aqi/{z}/{x}/{y}.png?token=${token}`, {
      attribution: 'Air Quality Tiles &copy; <a href="http://waqi.info">waqi.info</a>',
      maxZoom: 19,
      opacity: overlayOpacity
    }).addTo(map);

    waqiLayerRef.current = waqiLayer;

    // Clean up
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update WAQI Overlay Opacity
  useEffect(() => {
    if (waqiLayerRef.current) {
      waqiLayerRef.current.setOpacity(overlayOpacity);
    }
  }, [overlayOpacity]);

  // Synchronize Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker: L.Marker) => {
      marker.remove();
    });
    markersRef.current = {};

    cells.forEach(cell => {
      const detail = getDetailedReading(cell);
      const cat = getCategory(detail.aqi);
      const isSelected = cell.id === selectedCellId;

      // Custom divIcon representing beautiful neon glowing glassmorphic index indicators
      const icon = L.divIcon({
        className: 'custom-aqi-icon',
        html: `
          <div class="relative flex flex-col items-center justify-center cursor-pointer transition-transform duration-300 ${isSelected ? 'scale-110 z-[1000]' : 'hover:scale-105 z-[100]'}" style="width: 72px; height: 50px;">
            <div class="absolute inset-0 rounded-xl bg-slate-950/95 border-2 transition-all duration-300" style="
              border-color: ${cat.color}; 
              box-shadow: 0 0 12px ${cat.color}77, ${isSelected ? '0 0 0 3px #ffffff' : 'none'};
            "></div>
            <span class="relative z-10 text-[8px] font-bold text-slate-400 tracking-wider uppercase truncate max-w-[64px] leading-tight select-none">
              ${cell.id.startsWith('TN-') ? cell.id.replace('TN-', '') : cell.id}
            </span>
            <span class="relative z-10 text-lg font-black font-mono leading-none" style="color: ${cat.color}">
              ${detail.aqi}
            </span>
          </div>
        `,
        iconSize: [72, 50],
        iconAnchor: [36, 25]
      });

      const marker = L.marker([cell.lat, cell.lng], { icon })
        .on('click', () => {
          onSelectCell(cell.id);
        })
        .addTo(map);

      // Tooltip inside Leaflet
      const isDusky = cell.id.startsWith('TN-CH') || cell.id.startsWith('TN-MDU') || cell.id.includes('AV') || cell.id.includes('JP');
      marker.bindTooltip(`
        <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-xl min-w-[200px] text-slate-200">
          <div class="font-extrabold text-sm border-b border-slate-800 pb-1.5 mb-1.5 flex items-center justify-between">
            <span>${cell.name}</span>
            ${isDusky ? '<span class="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded text-[9px] text-rose-400 font-bold uppercase tracking-wider animate-pulse">Dusky Spot</span>' : ''}
          </div>
          <div class="flex justify-between text-xs py-0.5 font-mono">
            <span class="text-slate-400">District:</span>
            <span class="text-slate-100 font-semibold">${cell.district}</span>
          </div>
          <div class="flex justify-between text-xs py-0.5 font-mono">
            <span class="text-slate-400">State:</span>
            <span class="text-slate-100 font-semibold">${cell.state}</span>
          </div>
          <div class="flex justify-between text-xs py-0.5 font-mono">
            <span class="text-slate-400">AQI Index:</span>
            <span style="color: ${cat.color}; font-weight: 700;">${detail.aqi} (${cat.label})</span>
          </div>
          <div class="flex justify-between text-xs py-0.5 font-mono">
            <span class="text-slate-400">PM2.5 Conc:</span>
            <span class="text-slate-100 font-semibold">${detail.pm25} µg/m³</span>
          </div>
          <div class="flex justify-between text-xs py-0.5 font-mono">
            <span class="text-slate-400">PM10 Conc:</span>
            <span class="text-slate-100 font-semibold">${detail.pm10} µg/m³</span>
          </div>
          <p class="text-[10px] text-slate-400 mt-2 italic leading-relaxed">
            ${cell.description}
          </p>
        </div>
      `, {
        className: 'custom-leaflet-tooltip',
        direction: 'top',
        offset: [0, -15],
        opacity: 0.98
      });

      markersRef.current[cell.id] = marker;
    });
  }, [cells, selectedCellId]);

  // Handle selected cell coordinate zooming and centering
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const cell = cells.find(c => c.id === selectedCellId);
    if (cell) {
      map.setView([cell.lat, cell.lng], 9, {
        animate: true,
        duration: 1.2
      });
      
      // Auto open popup/tooltip of selected cell marker
      const marker = markersRef.current[selectedCellId];
      if (marker) {
        marker.openTooltip();
      }
    }
  }, [selectedCellId, cells]);

  return (
    <div className="relative w-full h-[520px] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full bg-slate-950" />
      <style>{`
        /* Map custom styles for sleek high-performance dark theme */
        .leaflet-container {
          background: #090d16 !important;
        }
        .leaflet-tile {
          filter: brightness(0.6) contrast(1.15) saturate(0.65) hue-rotate(205deg) invert(1) !important;
        }
        .leaflet-bar {
          border: 1px solid rgba(255,255,255,0.08) !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
        }
        .leaflet-bar a {
          background-color: rgba(15, 23, 42, 0.95) !important;
          color: #e2e8f0 !important;
          border-bottom: 1px solid rgba(255,255,255,0.08) !important;
        }
        .leaflet-bar a:hover {
          background-color: #1e293b !important;
          color: #ffffff !important;
        }
        .leaflet-tooltip-pane {
          z-index: 10000 !important;
        }
        .custom-leaflet-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .custom-leaflet-tooltip::before {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
