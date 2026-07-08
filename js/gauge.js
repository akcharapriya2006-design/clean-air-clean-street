/* ==========================================================================
   AeroWatch — analog-instrument AQI gauge.
   Renders a dial with tick marks + a needle, styled like a physical
   air-quality meter rather than a generic radial progress ring.
   ========================================================================== */

function renderGauge(mountId, aqi, opts = {}){
  const mount = document.getElementById(mountId);
  if (!mount) return;
  const size = opts.size || 300;
  const cx = 150, cy = 150, r = 118;
  const startAngle = -210, endAngle = 30; // degrees, sweep of 240deg
  const maxAqi = 300;

  function angleFor(v){
    const t = Math.min(v, maxAqi) / maxAqi;
    return startAngle + t * (endAngle - startAngle);
  }
  function polar(angleDeg, radius){
    const a = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  }

  // band arcs (good -> hazard)
  const bands = [
    { from:0,   to:50,  color:'#35c7b9' },
    { from:50,  to:100, color:'#a7d84a' },
    { from:100, to:150, color:'#f2a93b' },
    { from:150, to:200, color:'#e8834a' },
    { from:200, to:300, color:'#e85c4a' },
  ];

  function arcPath(a1, a2, radius){
    const p1 = polar(a1, radius), p2 = polar(a2, radius);
    const large = (a2 - a1) > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${large} 1 ${p2.x} ${p2.y}`;
  }

  let bandArcs = '';
  bands.forEach(b => {
    bandArcs += `<path d="${arcPath(angleFor(b.from), angleFor(b.to), r)}"
      stroke="${b.color}" stroke-width="14" fill="none" stroke-linecap="butt" opacity="0.9"/>`;
  });

  // ticks
  let ticks = '';
  for (let v = 0; v <= maxAqi; v += 25){
    const a = angleFor(v);
    const p1 = polar(a, r - 20), p2 = polar(a, r - 9);
    ticks += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="var(--text-faint)" stroke-width="2"/>`;
    if (v % 50 === 0){
      const lp = polar(a, r - 34);
      ticks += `<text x="${lp.x}" y="${lp.y}" text-anchor="middle" dominant-baseline="middle"
        class="chart-axis-label" font-size="11">${v}</text>`;
    }
  }

  const needleAngle = angleFor(aqi);
  const tip = polar(needleAngle, r - 26);

  mount.innerHTML = `
    <div class="gauge-wrap">
      <svg viewBox="0 0 300 300" width="${size}" height="${size}" role="img" aria-label="Air quality gauge showing ${aqi} AQI">
        <circle cx="${cx}" cy="${cy}" r="${r+18}" fill="var(--bg-card)" opacity="0.4"/>
        ${bandArcs}
        ${ticks}
        <g class="needle" style="transform: rotate(0deg)">
          <line x1="${cx}" y1="${cy}" x2="${tip.x}" y2="${tip.y}" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
          <circle cx="${cx}" cy="${cy}" r="8" fill="#fff"/>
          <circle cx="${cx}" cy="${cy}" r="3.5" fill="var(--bg)"/>
        </g>
      </svg>
      <div class="gauge-readout">
        <div class="val mono" style="color:${AeroData.categoryFor(aqi).color}">${aqi}</div>
        <div class="cat" style="color:${AeroData.categoryFor(aqi).color}">${AeroData.categoryFor(aqi).label}</div>
        ${opts.location ? `<div class="loc">${opts.location}</div>` : ''}
      </div>
    </div>
  `;
}
