import { CityCell, PollutantDetail, ForecastStep } from './types';

// Curated list of Indian states, districts, and dusky/smoky hotspots (with high focus on Tamil Nadu)
export const CELLS: CityCell[] = [
  // ─── TAMIL NADU DUSKY HOTSPOTS ───
  {
    id: 'TN-CH-EN',
    name: 'Chennai (Ennore Industrial Area)',
    district: 'Chennai',
    state: 'Tamil Nadu',
    type: 'industrial',
    base: 185,
    volatility: 50,
    sensor: true,
    lat: 13.2161,
    lng: 80.3247,
    description: 'Dusky industrial zone. Features heavy fly-ash from thermal power plants and chemical emission plumes.'
  },
  {
    id: 'TN-CH-KY',
    name: 'Chennai (Koyambedu Bus Terminal)',
    district: 'Chennai',
    state: 'Tamil Nadu',
    type: 'traffic',
    base: 165,
    volatility: 40,
    sensor: true,
    lat: 13.0673,
    lng: 80.2031,
    description: 'Highly dusky traffic junction. Severe exhaust trapping due to constant heavy interstate bus and commercial truck movements.'
  },
  {
    id: 'TN-MDU-MA',
    name: 'Madurai (Mattuthavani Junction)',
    district: 'Madurai',
    state: 'Tamil Nadu',
    type: 'traffic',
    base: 155,
    volatility: 35,
    sensor: true,
    lat: 9.9405,
    lng: 78.1565,
    description: 'Major transit hub. Characterized by high road-dust suspension, exhaust fumes, and smoky parotta-stall combustion.'
  },
  {
    id: 'TN-MDU-PY',
    name: 'Madurai (Periyar Port & Town Hall)',
    district: 'Madurai',
    state: 'Tamil Nadu',
    type: 'residential',
    base: 110,
    volatility: 22,
    sensor: false,
    lat: 9.9172,
    lng: 78.1134,
    description: 'Densely populated heritage-commercial zone. Narrow lanes trap auto-rickshaw particulate smoke and garbage-pile dust.'
  },
  {
    id: 'TN-MDU-SS',
    name: 'Madurai (Sikkandar Savadi Stone Zone)',
    district: 'Madurai',
    state: 'Tamil Nadu',
    type: 'industrial',
    base: 220,
    volatility: 60,
    sensor: false,
    lat: 9.9702,
    lng: 78.1118,
    description: 'Extremely dusky quarry belt. Heavy fine silica dust suspended from surrounding stone crushing and mining works.'
  },
  {
    id: 'TN-CBE-SI',
    name: 'Coimbatore (SIDCO Industrial Estate)',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    type: 'industrial',
    base: 140,
    volatility: 30,
    sensor: true,
    lat: 10.9501,
    lng: 76.9745,
    description: 'Industrial foundry district. High concentration of cupola-furnace metal casting smoke and fine sand dust.'
  },
  {
    id: 'TN-TUT-TP',
    name: 'Tuticorin (V.O.C. Port Terminal)',
    district: 'Thoothukudi',
    state: 'Tamil Nadu',
    type: 'industrial',
    base: 150,
    volatility: 42,
    sensor: true,
    lat: 8.7533,
    lng: 78.1691,
    description: 'Coastal port and saltpan area. Subject to heavy coal unloading dust, dry salt aerosols, and thermal ash.'
  },
  {
    id: 'TN-SLM-SP',
    name: 'Salem (Steel Plant & Mining Bypass)',
    district: 'Salem',
    state: 'Tamil Nadu',
    type: 'industrial',
    base: 135,
    volatility: 28,
    sensor: false,
    lat: 11.6643,
    lng: 78.1006,
    description: 'Steel forging and mining transport zone. Visible dust clouds raised by heavy dumper transport vehicles.'
  },
  {
    id: 'TN-TRY-KK',
    name: 'Trichy (Kallukuzhi Quarry Block)',
    district: 'Tiruchirappalli',
    state: 'Tamil Nadu',
    type: 'dump',
    base: 145,
    volatility: 35,
    sensor: false,
    lat: 10.7905,
    lng: 78.6984,
    description: 'Dusky quarry and municipal solid waste sorting area. High particulate emissions from limestone grinding and open burning.'
  },

  // ─── DELHI NATIONAL CAPITAL REGION ───
  {
    id: 'DL-AV',
    name: 'Delhi (Anand Vihar Border)',
    district: 'East Delhi',
    state: 'Delhi',
    type: 'traffic',
    base: 240,
    volatility: 65,
    sensor: true,
    lat: 28.6476,
    lng: 77.3162,
    description: 'Historically highly polluted transit corridor. Massive diesel exhaust loading coupled with interstate dust.'
  },
  {
    id: 'DL-JP',
    name: 'Delhi (Jahangirpuri Wastes)',
    district: 'North Delhi',
    state: 'Delhi',
    type: 'dump',
    base: 210,
    volatility: 55,
    sensor: true,
    lat: 28.7264,
    lng: 77.1610,
    description: 'Landfill proximity site. Frequent spontaneous smoldering, releasing heavy toxic smoke and windblown soot.'
  },

  // ─── MAHARASHTRA ───
  {
    id: 'MH-CH',
    name: 'Mumbai (Chembur Refineries)',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    type: 'industrial',
    base: 130,
    volatility: 32,
    sensor: true,
    lat: 19.0618,
    lng: 72.8998,
    description: 'Petrochemical refinery zone. Industrial hydrocarbon gases, smoky flares, and coastal haze trapping.'
  },
  {
    id: 'MH-NG',
    name: 'Nagpur (Butibori MIDC)',
    district: 'Nagpur',
    state: 'Maharashtra',
    type: 'industrial',
    base: 105,
    volatility: 25,
    sensor: true,
    lat: 20.9158,
    lng: 79.0012,
    description: 'Central engineering cluster. Moderate coal power and fabrication-shop particle emissions.'
  },

  // ─── OTHER KEY INDIAN LOCATIONS ───
  {
    id: 'KA-SB',
    name: 'Bengaluru (Silk Board Junction)',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    type: 'traffic',
    base: 115,
    volatility: 30,
    sensor: true,
    lat: 12.9176,
    lng: 77.6244,
    description: 'Infamous heavy traffic corridor. Fine carbon soot and suspended dust from vehicle-braking friction.'
  },
  {
    id: 'WB-HW',
    name: 'Kolkata (Howrah Railway Hub)',
    district: 'Howrah',
    state: 'West Bengal',
    type: 'traffic',
    base: 140,
    volatility: 35,
    sensor: true,
    lat: 22.5851,
    lng: 88.3387,
    description: 'Busy transit junction. Particulate smoke from diesel locomotives, ferry boats, and public bus lines.'
  },
  {
    id: 'BR-GM',
    name: 'Patna (Gandhi Maidan Bypass)',
    district: 'Patna',
    state: 'Bihar',
    type: 'dump',
    base: 190,
    volatility: 50,
    sensor: true,
    lat: 25.6174,
    lng: 85.1438,
    description: 'Extremely dusky open space. Unpaved soils, heavy construction dust, and municipal sweepings.'
  },
  {
    id: 'UP-JJ',
    name: 'Kanpur (Jajmau Tanneries)',
    district: 'Kanpur',
    state: 'Uttar Pradesh',
    type: 'industrial',
    base: 175,
    volatility: 45,
    sensor: true,
    lat: 26.4356,
    lng: 80.4022,
    description: 'Tannery and metal smelting sector. Heavy sulfur odors, coal smoke, and unpaved bypass transport dust.'
  },
  {
    id: 'KA-GK',
    name: 'Bengaluru (Cubbon Park Eco-Zone)',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    type: 'green',
    base: 45,
    volatility: 10,
    sensor: true,
    lat: 12.9779,
    lng: 77.5952,
    description: 'Pristine botanical ecosystem. Consistently clean air with dense green foliage acting as a particulate filter.'
  },
  {
    id: 'GA-PN',
    name: 'Goa (Panaji Coast)',
    district: 'North Goa',
    state: 'Goa',
    type: 'green',
    base: 38,
    volatility: 8,
    sensor: true,
    lat: 15.4909,
    lng: 73.8278,
    description: 'Clean marine coastal air with strong wind dilution.'
  }
];

export const CATEGORIES = [
  { max: 50,  key: 'good',       label: 'Good',            color: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' },
  { max: 100, key: 'moderate',   label: 'Moderate',         color: '#eab308', glow: 'rgba(234, 179, 8, 0.4)' },
  { max: 150, key: 'unhealthy_s',label: 'Unhealthy (Sens.)',color: '#f97316', glow: 'rgba(249, 115, 22, 0.4)' },
  { max: 200, key: 'unhealthy',  label: 'Unhealthy',        color: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' },
  { max: 300, key: 'very',       label: 'Very Unhealthy',   color: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)' },
  { max: 99999, key: 'hazard',   label: 'Hazardous',        color: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)' },
];

export function getCategory(aqi: number) {
  return CATEGORIES.find(c => aqi <= c.max) || CATEGORIES[CATEGORIES.length - 1];
}

// Global cached live data loaded from Open-Meteo
let cachedLiveData: any[] | null = null;

export async function fetchLiveOpenMeteoData(): Promise<boolean> {
  try {
    const lats = CELLS.map(c => c.lat).join(',');
    const lngs = CELLS.map(c => c.lng).join(',');
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lngs}&hourly=us_aqi,pm2_5,pm10&timezone=Asia/Kolkata&forecast_days=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load air quality API');
    const data = await res.json();
    if (Array.isArray(data)) {
      cachedLiveData = data;
      return true;
    }
    return false;
  } catch (err) {
    console.warn('API error, relying on high-fidelity offline simulation:', err);
    cachedLiveData = null;
    return false;
  }
}

// Generate readings
export function getReading(cell: CityCell, hourOffset = 0): number {
  if (cachedLiveData && cachedLiveData[CELLS.indexOf(cell)]?.hourly) {
    const idx = (new Date().getHours() + hourOffset) % 24;
    const usAqi = cachedLiveData[CELLS.indexOf(cell)].hourly.us_aqi;
    if (usAqi && usAqi[idx] !== undefined) {
      return Math.max(5, Math.round(usAqi[idx]));
    }
  }

  // High-fidelity local simulation using diurnals and random seeds
  const hour = (new Date().getHours() + hourOffset) % 24;
  const trafficDiurnal = cell.type === 'traffic' ? (1 + 0.4 * Math.sin(((hour - 8) / 24) * Math.PI * 2)) : 1;
  const industrialDiurnal = cell.type === 'industrial' ? (hour >= 20 || hour <= 5 ? 1.3 : 0.9) : 1;
  const rawSeed = (CELLS.indexOf(cell) + 1) * 31.4159 + hourOffset;
  const noise = (Math.sin(rawSeed) * 0.5) * cell.volatility;

  const value = cell.base * trafficDiurnal * industrialDiurnal + noise;
  return Math.max(12, Math.round(value));
}

export function getDetailedReading(cell: CityCell, hourOffset = 0): PollutantDetail {
  const aqi = getReading(cell, hourOffset);
  let pm25 = 10;
  let pm10 = 25;
  let source = 'Hyperlocal simulation';

  if (cachedLiveData && cachedLiveData[CELLS.indexOf(cell)]?.hourly) {
    const idx = (new Date().getHours() + hourOffset) % 24;
    const hourly = cachedLiveData[CELLS.indexOf(cell)].hourly;
    pm25 = hourly.pm2_5 ? Math.round(hourly.pm2_5[idx]) : pm25;
    pm10 = hourly.pm10 ? Math.round(hourly.pm10[idx]) : pm10;
    source = 'Open-Meteo Live API';
  } else {
    // Math calibration
    if (aqi <= 50) {
      pm25 = Math.round(aqi * 0.24);
      pm10 = Math.round(aqi * 1.12);
    } else if (aqi <= 100) {
      pm25 = Math.round(12 + (aqi - 50) * 0.47);
      pm10 = Math.round(54 + (aqi - 50) * 1.92);
    } else {
      pm25 = Math.round(35.5 + (aqi - 100) * 0.65);
      pm10 = Math.round(150 + (aqi - 100) * 1.55);
    }
  }

  return { aqi, pm25, pm10, source };
}

export function getForecast(cell: CityCell): ForecastStep[] {
  const steps: ForecastStep[] = [];
  for (let h = 0; h <= 24; h += 3) {
    steps.push({ h, aqi: getReading(cell, h) });
  }
  return steps;
}
