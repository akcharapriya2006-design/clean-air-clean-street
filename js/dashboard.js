/* ==========================================================================
   AeroWatch India — dashboard page controller.
   Loads live Open-Meteo AQI readings, handles maps, sidebar ranking lists,
   search filters, health recommendations, and token settings.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  let selectedCellId = 'DL'; // default selection: New Delhi
  
  const searchInput = document.getElementById('search-city');
  const stateFilter = document.getElementById('filter-state');
  const rankingList = document.getElementById('city-ranking');
  const sensorList = document.getElementById('sensor-list');
  const onlinePill = document.getElementById('online-pill');
  const lastUpdated = document.getElementById('last-updated');

  const opacitySlider = document.getElementById('overlay-opacity');

  // Load real-time API data
  onlinePill.textContent = '● Synchronizing…';
  onlinePill.className = 'pill amber';
  const apiLoadSuccess = await AeroData.loadLiveData();
  
  if (apiLoadSuccess) {
    onlinePill.textContent = '● Live API Active';
    onlinePill.className = 'pill green';
    showToast('Real-time Air Quality data synchronized.');
  } else {
    onlinePill.textContent = '● Simulation Fallback';
    onlinePill.className = 'pill red';
    showToast('Failed to connect to API. Loaded offline simulation.');
  }

  // Update synced timestamp
  lastUpdated.textContent = 'Last synced: ' + new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) + ' · Refreshes on reload';

  // Populate state filter options
  const uniqueStates = [...new Set(AeroData.CELLS.map(c => c.state))].sort();
  stateFilter.innerHTML += uniqueStates.map(state => `<option value="${state}">${state}</option>`).join('');

  // 1. SELECT CITY FUNCTION
  function selectCell(cellId) {
    selectedCellId = cellId;
    const cell = AeroData.cellById(cellId);
    if (!cell) return;

    // Get detailed measurements (AQI, PM2.5, PM10, source)
    const detail = AeroData.getDetailedReading(cell);
    const cat = AeroData.categoryFor(detail.aqi);

    // Update gauge
    renderGauge('detail-gauge', detail.aqi, { size: 210, location: `${cell.name}, ${cell.state}` });
    
    // Update pollutant display
    document.getElementById('val-pm25').textContent = detail.pm25;
    document.getElementById('val-pm10').textContent = detail.pm10;
    
    const sourceLabel = document.getElementById('data-source-label');
    sourceLabel.textContent = `Source: ${detail.source}`;
    if (detail.source.includes('API')) {
      sourceLabel.style.color = 'var(--accent-2)';
    } else {
      sourceLabel.style.color = 'var(--text-dim)';
    }

    // Update trend forecast chart
    document.getElementById('chart-title').textContent = `24h forecast — ${cell.name}`;
    renderForecastChart('forecast-chart', cellId);

    // Update health recommendations
    const recText = document.getElementById('rec-text');
    const recPanel = document.getElementById('recommendation-panel');
    let advisory = "";
    let glowColor = cat.color;

    if (detail.aqi <= 50) {
      advisory = "<strong>Air quality is Good.</strong> Air pollution poses little or no risk. Enjoy outdoor activities, sports, and outdoor exercise!";
    } else if (detail.aqi <= 100) {
      advisory = "<strong>Air quality is Moderate.</strong> Acceptable quality, but unusually sensitive people should consider reducing prolonged or heavy outdoor exertion.";
    } else if (detail.aqi <= 150) {
      advisory = "<strong>Unhealthy for Sensitive Groups.</strong> Active children, adults, and people with respiratory diseases should limit outdoor activity.";
    } else if (detail.aqi <= 200) {
      advisory = "<strong>Unhealthy Air.</strong> Everyone may begin to experience health effects. Wear protective masks (N95) outdoors and restrict outdoor activity.";
    } else if (detail.aqi <= 300) {
      advisory = "<strong>Very Unhealthy.</strong> Health alert. Avoid outdoor exertion, keep windows closed, and run indoor air purifiers to clean ambient air.";
    } else {
      advisory = "<strong>Hazardous Air.</strong> Emergency warning. The entire population is likely affected. Remain indoors, keep doors closed, and avoid all physical exertion.";
    }
    
    recText.innerHTML = advisory;
    recPanel.style.borderColor = cat.color + '44';
    recPanel.style.boxShadow = `0 4px 15px -2px ${cat.color}22`;

    // Highlight selected item in the list
    document.querySelectorAll('.rank-row').forEach(el => el.classList.remove('active'));
    const listItem = document.querySelector(`.rank-row[data-id="${cellId}"]`);
    if (listItem) {
      listItem.classList.add('active');
      listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Highlight selected marker on Leaflet map
    if (window.AeroMap && window.AeroMap.markers[cellId]) {
      const marker = window.AeroMap.markers[cellId];
      document.querySelectorAll('.aqi-marker-box.selected').forEach(el => el.classList.remove('selected'));
      marker.getElement()?.querySelector('.aqi-marker-box')?.classList.add('selected');
    }
  }

  // 2. RENDER MAP & INTEGRATE SELECT
  renderLeafletMap('hexmap', {
    onSelect: (cellId) => {
      selectCell(cellId);
    }
  });

  // 3. RENDER SIDEBAR LIST & FILTER/SEARCH ACTIONS
  function populateList() {
    const query = searchInput.value.toLowerCase().trim();
    const filterState = stateFilter.value;

    // Filter cities
    const filteredCells = AeroData.CELLS.filter(cell => {
      const matchQuery = cell.name.toLowerCase().includes(query) || cell.state.toLowerCase().includes(query);
      const matchState = filterState === "" || cell.state === filterState;
      return matchQuery && matchState;
    });

    // Sort by current AQI descending
    const sorted = filteredCells.map(c => {
      const detail = AeroData.getDetailedReading(c);
      return { cell: c, aqi: detail.aqi, detail };
    }).sort((a, b) => b.aqi - a.aqi);

    if (sorted.length === 0) {
      rankingList.innerHTML = '<p class="text-faint" style="padding: 12px; font-size:13.5px;">No matches found.</p>';
      return;
    }

    rankingList.innerHTML = sorted.map((x, idx) => {
      const cat = AeroData.categoryFor(x.aqi);
      const isActive = x.cell.id === selectedCellId ? 'active' : '';
      return `
        <div class="rank-row ${isActive}" data-id="${x.cell.id}">
          <div>
            <div class="rank-city">${idx + 1}. ${x.cell.name}</div>
            <div class="rank-state">${x.cell.state}</div>
          </div>
          <span class="rank-aqi" style="color:${cat.color}">${x.aqi}</span>
        </div>`;
    }).join('');

    // Attach click events to ranking items
    rankingList.querySelectorAll('.rank-row').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        selectCell(id);
        
        // Pan map to clicked city
        if (window.AeroMap) {
          const cell = AeroData.cellById(id);
          window.AeroMap.map.setView([cell.lat, cell.lng], 8, { animate: true });
        }
      });
    });
  }

  // 4. RENDER GROUND SENSOR LIST GRID (at bottom)
  function populateSensorGrid() {
    const sensors = AeroData.CELLS.filter(c => c.sensor);
    sensorList.innerHTML = sensors.map(c => {
      const detail = AeroData.getDetailedReading(c);
      const cat = AeroData.categoryFor(detail.aqi);
      return `
        <div class="panel sensor-row" style="grid-template-columns:1fr auto; padding:18px; margin-bottom:0; cursor:pointer;" data-id="${c.id}">
          <div>
            <div class="name">${c.name}
              <span class="id">STATION-${c.id} · ${c.state}</span>
            </div>
            <span class="pill" style="color:${cat.color}; border-color:${cat.color}55; background:${cat.color}0c; margin-top:8px;">${cat.label}</span>
          </div>
          <div style="text-align:right;">
            <div class="reading" style="color:${cat.color}">${detail.aqi}</div>
            <span style="font-size:10.5px; color:var(--text-dim); display:block; margin-top:2px;">AQI US</span>
          </div>
        </div>`;
    }).join('');

    sensorList.querySelectorAll('.sensor-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.dataset.id;
        selectCell(id);
        if (window.AeroMap) {
          const cell = AeroData.cellById(id);
          window.AeroMap.map.setView([cell.lat, cell.lng], 9, { animate: true });
        }
        document.getElementById('detail-gauge').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }

  // Wire search and filter actions
  searchInput.addEventListener('input', populateList);
  stateFilter.addEventListener('change', populateList);

  // Initial populate
  populateList();
  populateSensorGrid();

  // Load the worst station initially on load
  const worst = AeroData.CELLS
    .map(c => ({ c, aqi: AeroData.currentReading(c) }))
    .sort((a,b) => b.aqi - a.aqi)[0];
  selectCell(worst.c.id);

  // Settings Opacity control
  if (opacitySlider) {
    opacitySlider.addEventListener('input', (e) => {
      const opacity = e.target.value / 100;
      if (window.AeroMap && window.AeroMap.waqiLayer) {
        window.AeroMap.waqiLayer.setOpacity(opacity);
      }
    });
  }

});
