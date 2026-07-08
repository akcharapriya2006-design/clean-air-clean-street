/* ==========================================================================
   AeroWatch — live map view (Leaflet.js + OpenStreetMap + WAQI Tiles).
   Centers on India, rendering live tiles + customized neon city markers.
   ========================================================================== */

function renderLeafletMap(mountId, opts = {}){
  const mount = document.getElementById(mountId);
  if (!mount) return;

  // Clear previous leaflet instance if any
  mount.innerHTML = `<div id="${mountId}-leaflet" class="leaflet-shell"></div>`;
  const center = AeroData.CITY_CENTER;
  const map = L.map(`${mountId}-leaflet`, { 
    zoomControl: true,
    minZoom: 4,
    maxZoom: 12
  }).setView([center.lat, center.lng], center.zoom);

  // High-performance OpenStreetMap base tiles (styled to dark in CSS via filter)
  const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  // Integrate WAQI (World Air Quality Index) live tiles overlay
  const token = localStorage.getItem('aerowatch_waqi_token') || 'demo';
  const waqiLayer = L.tileLayer(`https://tiles.waqi.info/tiles/usepa-aqi/{z}/{x}/{y}.png?token=${token}`, {
    attribution: 'Air Quality Tiles &copy; <a href="http://waqi.info">waqi.info</a>',
    maxZoom: 19,
    opacity: 0.65 // semi-transparent to blend with the dark base map
  }).addTo(map);

  const markers = {};

  AeroData.CELLS.forEach(cell => {
    // Current live AQI, PM2.5, PM10 and category classification
    const prevAqi = AeroData.currentReading(cell, -1);
    const detail = AeroData.getDetailedReading(cell);
    const aqi = detail.aqi;
    const cat = AeroData.categoryFor(aqi);
    const risk = AeroData.riskScore(cell);
    const isHotspot = risk.crossesThreshold && !cell.sensor;

    // Trend calculation
    const pctChange = prevAqi ? Math.round(((aqi - prevAqi) / prevAqi) * 100) : 0;
    const arrow = pctChange > 1 ? '↑' : pctChange < -1 ? '↓' : '→';
    const trendColor = pctChange > 1 ? 'var(--red)' : pctChange < -1 ? 'var(--green)' : 'var(--text-dim)';

    // State-of-the-art glowing glassmorphic marker
    const icon = L.divIcon({
      className: 'aqi-marker-wrap',
      html: `
        <div class="aqi-marker-box ${isHotspot ? 'hotspot' : ''}" style="--cat-color:${cat.color}; --glow-color:${cat.color}55">
          <div class="aqi-city-label">${cell.name}</div>
          <div class="aqi-num">${aqi}</div>
          <div class="aqi-sub" style="color:${trendColor}">${arrow} ${Math.abs(pctChange)}%</div>
        </div>`,
      iconSize: [80, 54],
      iconAnchor: [40, 27],
    });

    const marker = L.marker([cell.lat, cell.lng], { icon }).addTo(map);
    
    marker.bindTooltip(
      `<div class="tt-title">${cell.name}, ${cell.state}</div>
       <div class="tt-row"><span>AQI (US EPA)</span><span style="color:${cat.color}; font-weight:700;">${aqi} · ${cat.label}</span></div>
       <div class="tt-row"><span>PM2.5 Conc.</span><span>${detail.pm25} µg/m³</span></div>
       <div class="tt-row"><span>PM10 Conc.</span><span>${detail.pm10} µg/m³</span></div>
       <div class="tt-row"><span>Data source</span><span>${detail.source}</span></div>
       <div class="tt-row"><span>Sensor hardware</span><span>${cell.sensor ? 'Ground sensor online' : 'Satellite / Citizen verified'}</span></div>`,
      { className: 'hex-tooltip leaflet-aqi-tooltip', direction: 'top', offset: [0, -22] }
    );

    marker.on('click', () => {
      document.querySelectorAll('.aqi-marker-box.selected').forEach(el => el.classList.remove('selected'));
      marker.getElement()?.querySelector('.aqi-marker-box')?.classList.add('selected');
      if (opts.onSelect) opts.onSelect(cell.id);
    });

    markers[cell.id] = marker;
  });

  // Legend control, styled to match the dark glassmorphic UI
  const legend = L.control({ position: 'bottomleft' });
  legend.onAdd = function(){
    const div = L.DomUtil.create('div', 'leaflet-aqi-legend glass');
    div.innerHTML = `
      <div class="lg-title">AQI Index</div>
      ${AeroData.CATEGORY.map(c => `<div class="lg-item"><span class="sw" style="background:${c.color}"></span>${c.label} (${c.max === 99999 ? '300+' : '0-' + c.max})</div>`).join('')}
      <div class="lg-item"><span class="sw hotspot-sw"></span>Hotspot anomaly (Unmonitored)</div>
    `;
    L.DomEvent.disableClickPropagation(div);
    return div;
  };
  legend.addTo(map);

  // Store globally so the dashboard controller can zoom/pan on search
  window.AeroMap = { map, markers, waqiLayer };

  return map;
}
