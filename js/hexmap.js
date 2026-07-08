/* ==========================================================================
   AeroWatch — hex sensor-mesh map.
   Each hex is one neighbourhood cell in the fusion model (photo reports +
   ground sensors + satellite AOD). Colour = current AQI category.
   A soft pulse ring marks cells the model flags as hidden hotspots
   (i.e. AQI trending up with no manned sensor / dump & industrial type).
   ========================================================================== */

function hexToPixel(q, r, size){
  const x = size * 1.5 * q;
  const y = size * Math.sqrt(3) * (r + q / 2);
  return { x, y };
}

function hexPoints(cx, cy, size){
  const pts = [];
  for (let i = 0; i < 6; i++){
    const angle = Math.PI / 180 * (60 * i);
    pts.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

function renderHexMap(mountId, opts = {}){
  const mount = document.getElementById(mountId);
  if (!mount) return;
  const size = opts.hexSize || 44;
  const cells = AeroData.CELLS;
  const positions = cells.map(c => ({ cell: c, ...hexToPixel(c.q, c.r, size) }));

  const xs = positions.map(p => p.x), ys = positions.map(p => p.y);
  const pad = size * 1.6;
  const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
  const w = maxX - minX, h = maxY - minY;

  let svgCells = '';
  positions.forEach(p => {
    const aqi = AeroData.currentReading(p.cell);
    const cat = AeroData.categoryFor(aqi);
    const risk = AeroData.riskScore(p.cell);
    const isHotspot = risk.crossesThreshold;
    const cx = p.x - minX, cy = p.y - minY;

    svgCells += `
      <g data-cell="${p.cell.id}" class="hex-cell-group">
        ${isHotspot ? `<circle class="hotspot-pulse" cx="${cx}" cy="${cy}" r="0" fill="none" stroke="${cat.color}" stroke-width="2" style="animation-delay:${(p.cell.q+p.cell.r)*0.15}s"/>` : ''}
        <polygon class="hex-cell" data-cell="${p.cell.id}"
          points="${hexPoints(cx, cy, size - 2)}"
          fill="${cat.color}" fill-opacity="${isHotspot ? 0.55 : 0.28}"
          stroke="${cat.color}" stroke-width="1.5"/>
        ${!p.cell.sensor ? `<circle cx="${cx + size*0.5}" cy="${cy - size*0.55}" r="4" fill="var(--violet)"/>` : ''}
        <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="10.5"
          font-family="var(--f-mono)" fill="#0a0f1a" font-weight="700" pointer-events="none">${aqi}</text>
      </g>`;
  });

  mount.innerHTML = `
    <div class="hexmap-shell">
      <svg viewBox="0 0 ${w} ${h}" width="100%" preserveAspectRatio="xMidYMid meet">
        ${svgCells}
      </svg>
      <div class="hex-tooltip" id="${mountId}-tooltip"></div>
    </div>
  `;

  const tooltip = document.getElementById(`${mountId}-tooltip`);
  const svgEl = mount.querySelector('svg');

  svgEl.querySelectorAll('.hex-cell').forEach(poly => {
    poly.addEventListener('mouseenter', (e) => showTooltip(e, poly.dataset.cell));
    poly.addEventListener('mousemove', (e) => positionTooltip(e));
    poly.addEventListener('mouseleave', () => hideTooltip());
    poly.addEventListener('click', () => {
      svgEl.querySelectorAll('.hex-cell').forEach(p => p.classList.remove('selected'));
      poly.classList.add('selected');
      if (opts.onSelect) opts.onSelect(poly.dataset.cell);
    });
  });

  function showTooltip(e, cellId){
    const cell = AeroData.cellById(cellId);
    const aqi = AeroData.currentReading(cell);
    const cat = AeroData.categoryFor(aqi);
    const risk = AeroData.riskScore(cell);
    tooltip.innerHTML = `
      <div class="tt-title">${cell.name}</div>
      <div class="tt-row"><span>Current AQI</span><span style="color:${cat.color}">${aqi} · ${cat.label}</span></div>
      <div class="tt-row"><span>24h peak (predicted)</span><span>${risk.peak}</span></div>
      <div class="tt-row"><span>Source</span><span>${cell.sensor ? 'Ground sensor' : 'Photo + satellite only'}</span></div>
      <div class="tt-row"><span>Land use</span><span>${cell.type}</span></div>
    `;
    tooltip.classList.add('show');
    positionTooltip(e);
  }
  function positionTooltip(e){
    const rect = mount.getBoundingClientRect();
    let x = e.clientX - rect.left + 16;
    let y = e.clientY - rect.top + 16;
    if (x + 200 > rect.width) x = e.clientX - rect.left - 200;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }
  function hideTooltip(){ tooltip.classList.remove('show'); }
}
