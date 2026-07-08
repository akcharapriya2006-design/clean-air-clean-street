/* ==========================================================================
   AeroWatch India — operations console controller.
   Manages priority action queue, resource assignments, and live citizen feed.
   ========================================================================== */

const RESOURCES = [
  { id: 'MC-1', name: 'Smog Mist Cannon — North Zone', status: 'available' },
  { id: 'MC-2', name: 'Smog Mist Cannon — South Zone', status: 'available' },
  { id: 'MD-1', name: 'Mobile Anti-Dust Drone — West Zone', status: 'available' },
  { id: 'IN-1', name: 'Compliance Officer — East Zone', status: 'available' },
  { id: 'CC-1', name: 'Dust Mitigation Team — Central', status: 'available' },
];

document.addEventListener('DOMContentLoaded', () => {
  renderAll();
  
  const updatedTime = document.getElementById('ops-updated');
  if (updatedTime) {
    updatedTime.textContent = 'Queue updated: ' + new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  }
});

function renderAll(){
  renderStats();
  renderFeed();
  renderRoster();
  renderReports();
}

function renderStats(){
  const alerts = AeroData.getAlerts();
  document.getElementById('stat-open').textContent = alerts.filter(a => a.status === 'open').length;
  document.getElementById('stat-critical').textContent = alerts.filter(a => a.peakAqi >= 200 && a.status !== 'resolved').length;
  document.getElementById('stat-dispatched').textContent = alerts.filter(a => a.status === 'dispatched').length;
  document.getElementById('stat-resolved').textContent = alerts.filter(a => a.status === 'resolved').length;
}

function renderFeed(){
  const alerts = [...AeroData.getAlerts()].sort((a,b) => {
    const order = { open: 0, acknowledged: 1, dispatched: 2, resolved: 3 };
    return order[a.status] - order[b.status] || b.peakAqi - a.peakAqi;
  });
  const mount = document.getElementById('alert-feed');

  if (!alerts.length){
    mount.innerHTML = '<p class="text-faint" style="font-size:13.5px; padding:12px;">No regional hotspots above critical alert threshold.</p>';
    return;
  }

  mount.innerHTML = alerts.map(a => {
    const cell = AeroData.cellById(a.cellId);
    if (!cell) return '';
    
    // Severity indicators
    const isResolved = a.status === 'resolved';
    const isCritical = a.peakAqi >= 200;
    
    const sevClass = isResolved ? 'sev-resolved' : (isCritical ? 'sev-critical' : 'sev-warning');
    const pill = isResolved ? 'green' : (isCritical ? 'purple' : 'amber');
    const statusText = isResolved ? 'Resolved' : a.status.toUpperCase();
    const colorCode = isResolved ? 'var(--green)' : (isCritical ? 'var(--purple)' : 'var(--yellow)');

    return `
      <div class="alert-card ${sevClass}" data-id="${a.id}">
        <div class="alert-head">
          <div>
            <h4 style="margin: 0 0 6px 0;">${a.title}</h4>
            <span class="pill ${pill}">${statusText}</span>
            <span style="font-size:11.5px; color:var(--text-dim); margin-left:8px; font-family:var(--f-mono);">${cell.state}</span>
          </div>
          <div class="mono" style="font-size:24px; font-weight:800; color:${colorCode}">${a.peakAqi}</div>
        </div>
        <div class="alert-meta">
          <span>Predicted Peak in ${a.etaHours}h</span>
          <span>Source: ${a.source}</span>
          <span>Logged: ${new Date(a.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
          ${a.resource ? `<span style="color:var(--yellow);">Assigned: ${a.resource}</span>` : ''}
        </div>
        ${a.status !== 'resolved' ? `
          <div class="alert-actions">
            ${a.status === 'open' ? `<button class="btn btn-sm" data-action="ack" data-id="${a.id}">Acknowledge</button>` : ''}
            ${a.status !== 'dispatched' ? `
              <select class="btn btn-sm" style="padding:8px 12px; background:rgba(5,8,20,0.5);" data-action="assign-select" data-id="${a.id}">
                <option value="">Deploy Resource…</option>
                ${RESOURCES.filter(r => r.status === 'available').map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
              </select>` : ''}
            <button class="btn btn-sm btn-primary" data-action="resolve" data-id="${a.id}">Mark Resolved</button>
          </div>` : ''}
      </div>`;
  }).join('');

  // Event bindings
  mount.querySelectorAll('[data-action="ack"]').forEach(btn => btn.addEventListener('click', () => {
    AeroData.updateAlert(btn.dataset.id, { status: 'acknowledged' });
    showToast('Regional alert acknowledged.');
    renderAll();
  }));

  mount.querySelectorAll('[data-action="resolve"]').forEach(btn => btn.addEventListener('click', () => {
    const alert = AeroData.getAlerts().find(a => a.id === btn.dataset.id);
    if (alert && alert.resourceId) freeResource(alert.resourceId);
    AeroData.updateAlert(btn.dataset.id, { status: 'resolved' });
    showToast('Regional alert resolved.');
    renderAll();
  }));

  mount.querySelectorAll('[data-action="assign-select"]').forEach(sel => sel.addEventListener('change', () => {
    if (!sel.value) return;
    const res = RESOURCES.find(r => r.id === sel.value);
    res.status = 'deployed';
    AeroData.updateAlert(sel.dataset.id, { status: 'dispatched', resource: res.name, resourceId: res.id });
    showToast(`${res.name} deployed.`);
    renderAll();
  }));
}

function freeResource(id){
  const res = RESOURCES.find(r => r.id === id);
  if (res) res.status = 'available';
}

function renderRoster(){
  const mount = document.getElementById('resource-roster');
  mount.innerHTML = RESOURCES.map(r => `
    <div class="resource-row">
      <span class="resource-dot" style="background:${r.status === 'available' ? 'var(--green)' : 'var(--yellow)'}"></span>
      <span style="font-weight:500;">${r.name}</span>
      <span class="pill ${r.status === 'available' ? 'green' : 'amber'}">${r.status}</span>
    </div>`).join('');
}

function renderReports(){
  const mount = document.getElementById('ops-reports');
  const reports = AeroData.getReports().slice(0, 5);
  if (!reports.length) {
    mount.innerHTML = '<p class="text-faint" style="font-size:13px; padding:12px 4px;">No citizen reports logged yet.</p>';
    return;
  }
  
  function labelFor(v){
    const map = { smoke:'Smoke Plume', dust:'Dust Cloud', burning:'Open Burning', industrial:'Industrial Odor',
      haze:'Severe Smog', mild:'Mild', noticeable:'Elevated', severe:'Critical' };
    return map[v] || v;
  }

  mount.innerHTML = reports.map(r => `
    <div class="sensor-row" style="grid-template-columns:1fr auto; padding:12px 4px;">
      <div class="name">${labelFor(r.type)} · ${r.location}
        <span class="id">${new Date(r.createdAt).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
      </div>
      <span class="pill ${r.severity === 'severe' ? 'red' : 'amber'}">${labelFor(r.severity)}</span>
    </div>`).join('');
}
