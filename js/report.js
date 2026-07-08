/* ==========================================================================
   AeroWatch India — citizen report page controller.
   Integrates Leaflet pin dropping, reverse geocoding, and custom chips.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  let selectedType = 'smoke';
  let selectedSeverity = 'noticeable';
  let attachedFiles = [];
  let pickerMap, clickMarker;
  let clickedCoords = null;

  const locInput = document.getElementById('loc');
  const geoStatus = document.getElementById('geo-status');

  // --- 1. INITIALIZE LOCATION-PICKER MAP ---
  const mapCenter = AeroData.CITY_CENTER; // Centered on India
  
  pickerMap = L.map('report-picker-map', {
    zoomControl: true,
    minZoom: 3,
    maxZoom: 10
  }).setView([mapCenter.lat, mapCenter.lng], 4);

  // Dark OSM Layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(pickerMap);

  // Map Click Event
  pickerMap.on('click', (e) => {
    const { lat, lng } = e.latlng;
    clickedCoords = { lat, lng };
    placeMarker(lat, lng);
    reverseGeocode(lat, lng);
  });

  function placeMarker(lat, lng) {
    if (clickMarker) {
      clickMarker.setLatLng([lat, lng]);
    } else {
      clickMarker = L.marker([lat, lng], { draggable: true }).addTo(pickerMap);
      clickMarker.on('dragend', () => {
        const pos = clickMarker.getLatLng();
        clickedCoords = { lat: pos.lat, lng: pos.lng };
        reverseGeocode(pos.lat, pos.lng);
      });
    }
  }

  // Find closest curated city from coordinate distance
  function findClosestCity(lat, lng) {
    let minDistance = Infinity;
    let closest = null;
    AeroData.CELLS.forEach(c => {
      const dist = Math.sqrt(Math.pow(c.lat - lat, 2) + Math.pow(c.lng - lng, 2));
      if (dist < minDistance) {
        minDistance = dist;
        closest = c;
      }
    });
    return closest;
  }

  // Reverse geocoding using Nominatim (completely free)
  function reverseGeocode(lat, lng) {
    geoStatus.textContent = ' — resolving address…';
    
    // Find closest curated city index for internal mapping
    const closestCity = findClosestCity(lat, lng);
    
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`;
    fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'PureZone-India-App-Client' // Nominatim politely requests a User-Agent
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.display_name) {
          // Clean up address (take first 3 segments for neatness)
          const parts = data.display_name.split(',');
          const cleanAddr = parts.slice(0, 3).join(',').trim();
          locInput.value = `${cleanAddr} (Near ${closestCity.name})`;
          geoStatus.textContent = ' — address resolved';
        } else {
          locInput.value = `${lat.toFixed(4)}, ${lng.toFixed(4)} (Near ${closestCity.name})`;
          geoStatus.textContent = ' — coordinates set';
        }
      })
      .catch(() => {
        locInput.value = `${lat.toFixed(4)}, ${lng.toFixed(4)} (Near ${closestCity.name})`;
        geoStatus.textContent = ' — coordinates set';
      });
  }

  // --- 2. GPS AUTO-DETECTION ---
  document.getElementById('use-location').addEventListener('click', () => {
    if (!navigator.geolocation){
      geoStatus.textContent = ' — geolocation not supported';
      return;
    }
    geoStatus.textContent = ' — detecting GPS coordinates…';
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        clickedCoords = { lat, lng };
        pickerMap.setView([lat, lng], 8);
        placeMarker(lat, lng);
        reverseGeocode(lat, lng);
      },
      () => { 
        geoStatus.textContent = ' — permission denied, choose on map'; 
        showToast('Location permission denied.');
      }
    );
  });

  // --- 3. WIRING CHIPS ---
  function wireChips(groupId, onPick){
    document.querySelectorAll(`#${groupId} .chip`).forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll(`#${groupId} .chip`).forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        onPick(chip.dataset.val);
      });
    });
  }
  wireChips('type-chips', v => selectedType = v);
  wireChips('severity-chips', v => selectedSeverity = v);

  // --- 4. PHOTO DROPZONE ---
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('photo');
  const previewStrip = document.getElementById('preview-strip');

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keypress', (e) => { if (e.key === 'Enter') fileInput.click(); });
  ['dragenter','dragover'].forEach(evt => dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('drag'); }));
  ['dragleave','drop'].forEach(evt => dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove('drag'); }));
  dropzone.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));
  fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

  function handleFiles(fileList){
    Array.from(fileList).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      attachedFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = file.name;
        previewStrip.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  }

  // --- 5. REPORT SUBMISSION ---
  const form = document.getElementById('report-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!locInput.value.trim()){
      locInput.focus();
      showToast('Please select a location on the map first.');
      return;
    }

    // Determine mapped city ID
    let cityId = 'DL';
    let latVal = mapCenter.lat;
    let lngVal = mapCenter.lng;
    
    if (clickedCoords) {
      const closest = findClosestCity(clickedCoords.lat, clickedCoords.lng);
      cityId = closest.id;
      latVal = clickedCoords.lat;
      lngVal = clickedCoords.lng;
    }

    const report = AeroData.addReport({
      location: locInput.value.trim(),
      type: selectedType,
      severity: selectedSeverity,
      notes: document.getElementById('notes').value.trim(),
      email: document.getElementById('email').value.trim(),
      photoCount: attachedFiles.length,
      cellId: cityId,
      lat: latVal,
      lng: lngVal
    });

    document.getElementById('confirm-title').textContent = `Report ${report.id} Created Successfully.`;
    document.getElementById('confirm-body').textContent =
      `Your report has been logged under "${labelFor(selectedType)}" with "${labelFor(selectedSeverity)}" severity at "${report.location}". ` +
      (attachedFiles.length ? `${attachedFiles.length} photo(s) submitted. ` : '') +
      `This report will trigger alerts inside the municipal ops panel and adjust live cell pollution risk indices.`;
    
    document.getElementById('confirm-panel').style.display = 'block';
    document.getElementById('confirm-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    showToast('Report submitted successfully.');
    
    // Reset Form
    form.reset();
    previewStrip.innerHTML = '';
    attachedFiles = [];
    if (clickMarker) {
      pickerMap.removeLayer(clickMarker);
      clickMarker = null;
    }
    clickedCoords = null;
    
    document.querySelectorAll('#type-chips .chip').forEach(c => c.classList.remove('active'));
    document.querySelector('#type-chips .chip[data-val="smoke"]').classList.add('active');
    selectedType = 'smoke';
    document.querySelectorAll('#severity-chips .chip').forEach(c => c.classList.remove('active'));
    document.querySelector('#severity-chips .chip[data-val="noticeable"]').classList.add('active');
    selectedSeverity = 'noticeable';

    renderRecent();
  });

  function labelFor(v){
    const map = { smoke:'Smoke Plume', dust:'Dust Cloud', burning:'Open Burning', industrial:'Industrial Odor',
      haze:'Severe Smog', mild:'Mild', noticeable:'Elevated', severe:'Critical' };
    return map[v] || v;
  }

  function renderRecent(){
    const list = AeroData.getReports().slice(0, 5);
    const mount = document.getElementById('recent-reports');
    if (!list.length){
      mount.innerHTML = '<p class="text-faint" style="font-size:13px;">No reports submitted yet.</p>';
      return;
    }
    mount.innerHTML = list.map(r => `
      <div class="sensor-row" style="grid-template-columns:1fr auto; padding:12px 4px;">
        <div class="name">${labelFor(r.type)} · ${r.location}
          <span class="id">${new Date(r.createdAt).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
        </div>
        <span class="pill ${r.severity === 'severe' ? 'red' : r.severity === 'mild' ? 'green' : 'amber'}">${labelFor(r.severity)}</span>
      </div>
    `).join('');
  }

  renderRecent();
});
