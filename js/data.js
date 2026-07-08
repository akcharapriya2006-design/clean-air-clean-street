/* ==========================================================================
   AeroWatch — mock data layer & simulation engine.
   Redesigned for the entire India, featuring real-time API integrations
   (Open-Meteo) and realistic mock simulations when offline.
   ========================================================================== */

const AeroData = (() => {

  // ---- Curated list of 30 major cities in India ---------------------------
  const CELLS = [
    { id:'DL', name:'New Delhi',          type:'traffic',     base:175, volatility:45, sensor:true,  lat:28.6139, lng:77.2090, state:'Delhi', index: 0 },
    { id:'MH-M', name:'Mumbai',             type:'traffic',     base:82,  volatility:20, sensor:true,  lat:19.0760, lng:72.8777, state:'Maharashtra', index: 1 },
    { id:'WB', name:'Kolkata',            type:'industrial',  base:105, volatility:28, sensor:true,  lat:22.5726, lng:88.3639, state:'West Bengal', index: 2 },
    { id:'TN', name:'Chennai',            type:'residential', base:68,  volatility:15, sensor:true,  lat:13.0827, lng:80.2707, state:'Tamil Nadu', index: 3 },
    { id:'KA', name:'Bengaluru',          type:'green',       base:52,  volatility:10, sensor:true,  lat:12.9716, lng:77.5946, state:'Karnataka', index: 4 },
    { id:'TS', name:'Hyderabad',          type:'traffic',     base:88,  volatility:22, sensor:true,  lat:17.3850, lng:78.4867, state:'Telangana', index: 5 },
    { id:'GJ-A', name:'Ahmedabad',          type:'industrial',  base:115, volatility:32, sensor:true,  lat:23.0225, lng:72.5714, state:'Gujarat', index: 6 },
    { id:'MH-P', name:'Pune',               type:'residential', base:72,  volatility:16, sensor:true,  lat:18.5204, lng:73.8567, state:'Maharashtra', index: 7 },
    { id:'UP-L', name:'Lucknow',            type:'traffic',     base:125, volatility:35, sensor:true,  lat:26.8467, lng:80.9462, state:'Uttar Pradesh', index: 8 },
    { id:'RJ', name:'Jaipur',             type:'residential', base:92,  volatility:20, sensor:true,  lat:26.9124, lng:75.7873, state:'Rajasthan', index: 9 },
    { id:'BR', name:'Patna',              type:'dump',        base:155, volatility:42, sensor:true,  lat:25.5941, lng:85.1376, state:'Bihar', index: 10 },
    { id:'AS', name:'Guwahati',           type:'industrial',  base:102, volatility:25, sensor:true,  lat:26.1445, lng:91.7362, state:'Assam', index: 11 },
    { id:'JK', name:'Srinagar',           type:'green',       base:48,  volatility:12, sensor:true,  lat:34.0837, lng:74.7973, state:'Jammu & Kashmir', index: 12 },
    { id:'MP-B', name:'Bhopal',             type:'residential', base:78,  volatility:18, sensor:true,  lat:23.2599, lng:77.4126, state:'Madhya Pradesh', index: 13 },
    { id:'MP-I', name:'Indore',             type:'traffic',     base:92,  volatility:22, sensor:true,  lat:22.7196, lng:75.8577, state:'Madhya Pradesh', index: 14 },
    { id:'JH', name:'Ranchi',             type:'industrial',  base:98,  volatility:24, sensor:true,  lat:23.3441, lng:85.3096, state:'Jharkhand', index: 15 },
    { id:'OD', name:'Bhubaneswar',        type:'green',       base:62,  volatility:14, sensor:true,  lat:20.2961, lng:85.8245, state:'Odisha', index: 16 },
    { id:'KL-T', name:'Thiruvananthapuram', type:'green',       base:38,  volatility:8,  sensor:true,  lat:8.5241,  lng:76.9366, state:'Kerala', index: 17 },
    { id:'KL-K', name:'Kochi',              type:'traffic',     base:62,  volatility:15, sensor:true,  lat:9.9312,  lng:76.2673, state:'Kerala', index: 18 },
    { id:'AP', name:'Visakhapatnam',      type:'industrial',  base:82,  volatility:20, sensor:true,  lat:17.6868, lng:83.1913, state:'Andhra Pradesh', index: 19 },
    { id:'MH-N', name:'Nagpur',             type:'residential', base:72,  volatility:15, sensor:true,  lat:21.1458, lng:79.0882, state:'Maharashtra', index: 20 },
    { id:'GJ-S', name:'Surat',              type:'industrial',  base:112, volatility:30, sensor:true,  lat:21.1702, lng:72.8311, state:'Gujarat', index: 21 },
    { id:'UP-K', name:'Kanpur',             type:'dump',        base:160, volatility:40, sensor:false, lat:26.4499, lng:80.3319, state:'Uttar Pradesh', index: 22 },
    { id:'PB', name:'Chandigarh',         type:'green',       base:58,  volatility:12, sensor:true,  lat:30.7333, lng:76.7794, state:'Punjab', index: 23 },
    { id:'UK', name:'Dehradun',           type:'green',       base:68,  volatility:14, sensor:true,  lat:30.3165, lng:78.0322, state:'Uttarakhand', index: 24 },
    { id:'CG', name:'Raipur',             type:'industrial',  base:108, volatility:26, sensor:true,  lat:21.2514, lng:81.6296, state:'Chhattisgarh', index: 25 },
    { id:'ML', name:'Shillong',           type:'green',       base:32,  volatility:8,  sensor:true,  lat:25.5788, lng:91.8833, state:'Meghalaya', index: 26 },
    { id:'TR', name:'Agartala',           type:'residential', base:78,  volatility:16, sensor:true,  lat:23.8315, lng:91.2868, state:'Tripura', index: 27 },
    { id:'MN', name:'Imphal',             type:'residential', base:72,  volatility:15, sensor:true,  lat:24.8170, lng:93.9368, state:'Manipur', index: 28 },
    { id:'GA', name:'Panaji',             type:'green',       base:42,  volatility:10, sensor:true,  lat:15.4909, lng:73.8278, state:'Goa', index: 29 },
  ];

  // Map centered on central India (Nagpur area, zoom level 5 to show all of India)
  const CITY_CENTER = { lat: 21.5, lng: 78.9629, zoom: 5 };

  const CATEGORY = [
    { max: 50,  key:'good',       label:'Good',            color:'#10b981' }, // emerald green
    { max: 100, key:'moderate',   label:'Moderate',         color:'#eab308' }, // amber yellow
    { max: 150, key:'unhealthy_s',label:'Unhealthy (Sens.)',color:'#f97316' }, // orange
    { max: 200, key:'unhealthy',  label:'Unhealthy',        color:'#ef4444' }, // red
    { max: 300, key:'very',       label:'Very Unhealthy',   color:'#ec4899' }, // magenta pink
    { max: 99999,key:'hazard',    label:'Hazardous',        color:'#a855f7' }, // purple
  ];

  let liveData = null; // Caches real-time results from Open-Meteo

  function categoryFor(aqi){
    return CATEGORY.find(c => aqi <= c.max) || CATEGORY[CATEGORY.length-1];
  }

  // deterministic-ish pseudo-random seed generator
  let seed = 42;
  function rand(){
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  // current reading = base + volatility noise + slow diurnal traffic curve
  function currentReading(cell, hourOffset = 0){
    if (liveData && liveData[cell.index] && liveData[cell.index].hourly) {
      const idx = (new Date().getHours() + hourOffset) % 24;
      const hourly = liveData[cell.index].hourly;
      if (hourly.us_aqi && hourly.us_aqi[idx] !== undefined) {
        return Math.max(1, Math.round(hourly.us_aqi[idx]));
      }
    }
    
    // Fallback simulation
    const hour = (new Date().getHours() + hourOffset) % 24;
    const trafficCurve = 1 + 0.35 * Math.sin(((hour - 8) / 24) * Math.PI * 2) ;
    const noise = (rand() - 0.5) * cell.volatility;
    let val = cell.base * (cell.type === 'traffic' ? trafficCurve : 1) + noise;
    return Math.max(8, Math.round(val));
  }

  // Pollutants breakdown helper
  function getDetailedReading(cell, hourOffset = 0) {
    const aqi = currentReading(cell, hourOffset);
    let pm25, pm10;
    let source = 'Simulation Engine';
    
    if (liveData && liveData[cell.index] && liveData[cell.index].hourly) {
      const idx = (new Date().getHours() + hourOffset) % 24;
      const hourly = liveData[cell.index].hourly;
      pm25 = hourly.pm2_5 ? Math.round(hourly.pm2_5[idx]) : undefined;
      pm10 = hourly.pm10 ? Math.round(hourly.pm10[idx]) : undefined;
      source = 'Open-Meteo live feed';
    } else {
      // Simulate PM2.5 and PM10 based on standard US AQI values
      if (aqi <= 50) {
        pm25 = Math.round(aqi * 0.24);
        pm10 = Math.round(aqi * 1.08);
      } else if (aqi <= 100) {
        pm25 = Math.round(12 + (aqi - 50) * 0.47);
        pm10 = Math.round(54 + (aqi - 50) * 1.9);
      } else {
        pm25 = Math.round(35.4 + (aqi - 100) * 0.6);
        pm10 = Math.round(150 + (aqi - 100) * 1.5);
      }
    }
    return { aqi, pm25: pm25 || 12, pm10: pm10 || 45, source };
  }

  // 24h forecast in 3‑hour steps: maps real API hourly curves if loaded
  function forecast(cell){
    const steps = [];
    const currentHour = new Date().getHours();
    
    if (liveData && liveData[cell.index] && liveData[cell.index].hourly) {
      const hourly = liveData[cell.index].hourly;
      for (let h = 0; h <= 24; h += 3){
        const idx = (currentHour + h) % 24;
        const aqi = hourly.us_aqi ? hourly.us_aqi[idx] : currentReading(cell, h);
        steps.push({ h, aqi: Math.round(aqi) });
      }
    } else {
      let carry = currentReading(cell);
      for (let h = 0; h <= 24; h += 3){
        const drift = (rand() - 0.45) * cell.volatility * 0.6;
        let spike = 0;
        if (cell.type === 'dump' && h >= 9 && h <= 15 && rand() > 0.55) spike = cell.volatility * (1.2 + rand());
        carry = Math.max(10, carry * 0.9 + (cell.base + drift + spike) * 0.1);
        steps.push({ h, aqi: Math.round(carry) });
      }
    }
    return steps;
  }

  function riskScore(cell){
    const f = forecast(cell);
    const peak = Math.max(...f.map(s => s.aqi));
    return { peak, crossesThreshold: peak >= 150, forecast: f };
  }

  // ---- Storage and Live API functions -------------------------------------
  const LS_REPORTS = 'aerowatch_reports_v2';
  const LS_ALERTS  = 'aerowatch_alerts_v2';

  function loadJSON(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ return fallback; }
  }
  function saveJSON(key, val){
    try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){ }
  }

  function getReports(){ return loadJSON(LS_REPORTS, []); }
  function addReport(report){
    const list = getReports();
    report.id = 'R' + Date.now();
    report.createdAt = new Date().toISOString();
    list.unshift(report);
    saveJSON(LS_REPORTS, list);
    return report;
  }

  function seedAlertsIfEmpty(){
    let alerts = loadJSON(LS_ALERTS, null);
    if (alerts) return alerts;
    alerts = CELLS
      .map(c => ({ cell: c, risk: riskScore(c) }))
      .filter(x => x.risk.crossesThreshold)
      .map((x, i) => ({
        id: 'AL' + (1000 + i),
        cellId: x.cell.id,
        title: `${x.risk.peak >= 200 ? 'Critical' : 'Moderate'} smog spike — ${x.cell.name}, ${x.cell.state}`,
        severity: x.risk.peak >= 200 ? 'critical' : 'warning',
        peakAqi: x.risk.peak,
        etaHours: 3 + Math.floor(rand() * 9),
        status: 'open', 
        createdAt: new Date(Date.now() - Math.floor(rand()*4)*3600*1000).toISOString(),
        source: x.cell.type === 'dump' ? 'Satellite thermal anomaly + citizen report' :
                x.cell.type === 'industrial' ? 'Ground sensor + satellite AOD' : 'Ground sensor mesh',
      }));
    saveJSON(LS_ALERTS, alerts);
    return alerts;
  }

  function getAlerts(){ return seedAlertsIfEmpty(); }
  function updateAlert(id, patch){
    const alerts = getAlerts().map(a => a.id === id ? {...a, ...patch} : a);
    saveJSON(LS_ALERTS, alerts);
    return alerts;
  }

  function cellById(id){ return CELLS.find(c => c.id === id); }

  // Async loader that batches all coordinates to Open-Meteo in one go
  async function loadLiveData() {
    try {
      const lats = CELLS.map(c => c.lat).join(',');
      const lngs = CELLS.map(c => c.lng).join(',');
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lngs}&hourly=us_aqi,pm2_5,pm10&timezone=Asia/Kolkata&forecast_days=1`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('API return code error');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        liveData = data;
        return true;
      }
      return false;
    } catch(err) {
      console.warn("Open-Meteo API load failed, using local simulation engine.", err);
      liveData = null;
      return false;
    }
  }

  return {
    CELLS, CATEGORY, CITY_CENTER, categoryFor, currentReading, getDetailedReading, forecast, riskScore,
    getReports, addReport, getAlerts, updateAlert, cellById, rand, loadLiveData,
  };
})();
