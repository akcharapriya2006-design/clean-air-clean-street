/* ==========================================================================
   AeroWatch — 24h forecast chart.
   Plots the predicted AQI trend (data.js forecast()) with a threshold
   reference line and a "now" marker separating measured vs predicted.
   ========================================================================== */

function renderForecastChart(mountId, cellId){
  const mount = document.getElementById(mountId);
  if (!mount) return;
  const cell = AeroData.cellById(cellId);
  if (!cell){ mount.innerHTML = '<p class="text-faint">Select a neighbourhood cell on the map to see its forecast.</p>'; return; }

  const data = AeroData.forecast(cell);
  const w = 560, h = 220, padL = 34, padR = 12, padT = 16, padB = 26;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const maxV = Math.max(220, ...data.map(d => d.aqi) ) ;
  const minV = 0;

  function xFor(i){ return padL + (i / (data.length - 1)) * innerW; }
  function yFor(v){ return padT + innerH - ((v - minV) / (maxV - minV)) * innerH; }

  const linePts = data.map((d,i) => `${xFor(i)},${yFor(d.aqi)}`).join(' ');
  const areaPts = `${padL},${padT+innerH} ` + linePts + ` ${xFor(data.length-1)},${padT+innerH}`;

  const thresholdY = yFor(150);

  let gridLines = '';
  [0,50,100,150,200].forEach(v => {
    gridLines += `<line x1="${padL}" x2="${w-padR}" y1="${yFor(v)}" y2="${yFor(v)}" stroke="var(--border)" stroke-width="1"/>
      <text x="${padL-8}" y="${yFor(v)+3}" text-anchor="end" class="chart-axis-label">${v}</text>`;
  });

  let xLabels = '';
  data.forEach((d,i) => {
    if (i % 2 === 0){
      const label = d.h === 0 ? 'Now' : `+${d.h}h`;
      xLabels += `<text x="${xFor(i)}" y="${h-6}" text-anchor="middle" class="chart-axis-label">${label}</text>`;
    }
  });

  const cat = AeroData.categoryFor(data[0].aqi);

  mount.innerHTML = `
    <div class="chart-wrap">
      <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="24 hour air quality forecast for ${cell.name}">
        ${gridLines}
        <line x1="${padL}" x2="${w-padR}" y1="${thresholdY}" y2="${thresholdY}" stroke="var(--yellow)" stroke-width="1.5" stroke-dasharray="4 4"/>
        <text x="${w-padR}" y="${thresholdY-6}" text-anchor="end" font-size="10.5" fill="var(--yellow)" class="mono">Alert threshold · 150</text>
        <polygon points="${areaPts}" fill="url(#grad-${mountId})" opacity="0.35"/>
        <polyline points="${linePts}" fill="none" stroke="${cat.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        ${data.map((d,i) => `<circle cx="${xFor(i)}" cy="${yFor(d.aqi)}" r="${i===0?4:3}" fill="${i===0? 'var(--purple)' : cat.color}"/>`).join('')}
        <line x1="${xFor(0)}" x2="${xFor(0)}" y1="${padT}" y2="${padT+innerH}" stroke="var(--purple)" stroke-width="1" stroke-dasharray="2 3"/>
        ${xLabels}
        <defs>
          <linearGradient id="grad-${mountId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${cat.color}" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="${cat.color}" stop-opacity="0"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  `;
}
