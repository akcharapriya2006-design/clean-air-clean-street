import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Users, 
  Radio, 
  FileSpreadsheet, 
  PlusCircle, 
  Calendar, 
  CheckCircle2, 
  Truck, 
  Sparkles, 
  Search, 
  Globe, 
  Lock, 
  UserCheck, 
  Building2, 
  HeartHandshake, 
  Trash2,
  AlertTriangle,
  UserX,
  Languages
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CELLS, CATEGORIES, getCategory, getDetailedReading, getForecast, fetchLiveOpenMeteoData } from './data';
import { CityCell, CitizenReport, HotspotTicket, LoginHistory, User } from './types';
import Speedometer from './components/Speedometer';
import AeroMap from './components/AeroMap';

// Core Translation dictionary to match Tamil Nadu / India localized requirements
const T_DICT: { [key: string]: { [lang: string]: string } } = {
  appName: { en: 'PureZone India', ta: 'ஏரோவாட்ச் இந்தியா' },
  tagline: { en: 'Air Quality & Hotspot Intelligence', ta: 'உள்ளூர் காற்றுத் தரம் & தீவிர மாசுத் தரவு' },
  navMonitor: { en: 'National Live Map', ta: 'தேசிய நேரலை வரைபடம்' },
  navReport: { en: 'File Hotspot Report', ta: 'மாசடைவை அறிவிக்க' },
  navOps: { en: 'Municipal Dispatch', ta: 'அதிகாரிகள் பணி ஒதுக்கீடு' },
  navDatabase: { en: 'User Directory & Logs', ta: 'பயனாளர் தரவுத்தளம்' },
  searchLabel: { en: 'Search States or Districts...', ta: 'மாநிலங்கள் அல்லது மாவட்டங்களை தேடுக...' },
  stateFilterAll: { en: 'All States & UTs', ta: 'அனைத்து மாநிலங்கள்' },
  selectedLocation: { en: 'Selected Neighborhood', ta: 'தேர்ந்தெடுக்கப்பட்ட பகுதி' },
  pm25Label: { en: 'Fine Dust (PM2.5)', ta: 'நுண் துகள் (PM2.5)' },
  pm10Label: { en: 'Coarse Dust (PM10)', ta: 'பெரிய துகள் (PM10)' },
  dataSource: { en: 'Data Source', ta: 'தரவு ஆதாரம்' },
  advisoryTitle: { en: 'Health Advisory & Guidance', ta: 'ஆரோக்கிய வழிகாட்டுதல்' },
  forecastTitle: { en: '24-Hour Trend Projection', ta: '24-மணி நேர முன்னறிவிப்பு' },
  sensorStations: { en: 'Ground Monitoring Sensor Mesh', ta: 'தரை உணரிகள் வலைப்பின்னல்' },
  unmonitored: { en: 'Unmonitored Zone (Photo/Satellite Only)', ta: 'உணரி இல்லா பகுதி (புகைப்படம்/செயற்கைக்கோள் மட்டும்)' },
};

export default function App() {
  const [lang, setLang] = useState<'en' | 'ta'>('en');
  const [activeTab, setActiveTab] = useState<'monitor' | 'report' | 'ops' | 'database'>('monitor');

  // --- Filter and Selection states ---
  const [selectedCellId, setSelectedCellId] = useState<string>('TN-CH-EN'); // Default to Chennai Ennore
  const [stateFilter, setStateFilter] = useState<string>('Tamil Nadu'); // Default filter Tamil Nadu to show local dusky places
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.65);

  // --- API State data fetched from Express server ---
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loginsList, setLoginHistory] = useState<LoginHistory[]>([]);
  const [reportsList, setReportsList] = useState<CitizenReport[]>([]);
  const [alertsList, setAlertsList] = useState<HotspotTicket[]>([]);
  const [apiOnline, setApiOnline] = useState<boolean>(true);

  // --- Auth Session ---
  const [session, setSession] = useState<{
    userId: string;
    name: string;
    email: string;
    role: string;
    organization?: string;
    token: string;
  } | null>(null);

  // --- Registration / Login Forms State ---
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState<'citizen' | 'municipal' | 'social_work' | 'researcher'>('citizen');
  const [orgInput, setOrgInput] = useState('');
  const [authError, setAuthModeError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // --- Citizen Report Form State ---
  const [reportLoc, setReportLoc] = useState('');
  const [reportType, setReportType] = useState<'smoke' | 'dust' | 'burning' | 'industrial' | 'haze'>('smoke');
  const [reportSeverity, setReportSeverity] = useState<'mild' | 'noticeable' | 'severe'>('noticeable');
  const [reportNotes, setReportNotes] = useState('');
  const [reportEmail, setReportEmail] = useState('');
  const [reportSuccessMsg, setReportSuccessMsg] = useState('');

  const t = (key: string) => T_DICT[key]?.[lang] || key;

  // Load backend collections on mount
  useEffect(() => {
    syncServerData();
    // Cache local session
    const stored = sessionStorage.getItem('aerowatch_react_session');
    if (stored) {
      try {
        setSession(JSON.parse(stored));
      } catch (err) {}
    }
  }, []);

  const syncServerData = async () => {
    // 1. Fetch live Open-Meteo feeds
    const openMeteoSuccess = await fetchLiveOpenMeteoData();
    setApiOnline(openMeteoSuccess);

    // 2. Fetch Users
    try {
      const resUsers = await fetch('/api/users');
      if (resUsers.ok) {
        const data = await resUsers.json();
        setUsersList(data.users);
      }
      
      // 3. Fetch Logins
      const resLogins = await fetch('/api/logins');
      if (resLogins.ok) {
        const data = await resLogins.json();
        setLoginHistory(data.logins);
      }

      // 4. Fetch Citizen Reports
      const resReports = await fetch('/api/reports');
      if (resReports.ok) {
        const data = await resReports.json();
        setReportsList(data.reports);
      }

      // 5. Fetch Hotspot alerts queue
      const resAlerts = await fetch('/api/alerts');
      if (resAlerts.ok) {
        const data = await resAlerts.json();
        setAlertsList(data.alerts);
      }
    } catch (err) {
      console.error('Server sync error. Ensure node backend is running.', err);
    }
  };

  // --- Auth Handlers ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthModeError('');
    setAuthSuccess('');

    if (!nameInput.trim() || !emailInput.trim() || !passwordInput) {
      setAuthModeError('Please fill out all required credentials.');
      return;
    }

    try {
      const hashInput = passwordInput + emailInput.toLowerCase().trim();
      // Simple client-side SHA256 simulation matching original behavior
      const encoder = new TextEncoder();
      const data = encoder.encode(hashInput);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.trim(),
          email: emailInput.toLowerCase().trim(),
          passwordHash,
          role: roleInput,
          organization: orgInput.trim() || undefined
        })
      });

      const body = await response.json();
      if (!response.ok) {
        setAuthModeError(body.error || 'Server registration failure.');
      } else {
        setAuthSuccess('✓ Registration successful! You can now log in.');
        setAuthMode('login');
        // Clear registration fields
        setNameInput('');
        setOrgInput('');
      }
      syncServerData();
    } catch (err: any) {
      setAuthModeError('Network communication failed: ' + err.message);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthModeError('');
    setAuthSuccess('');

    if (!emailInput.trim() || !passwordInput) {
      setAuthModeError('Both email and password are required.');
      return;
    }

    try {
      const hashInput = passwordInput + emailInput.toLowerCase().trim();
      const encoder = new TextEncoder();
      const data = encoder.encode(hashInput);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.toLowerCase().trim(),
          passwordHash
        })
      });

      const body = await response.json();
      if (!response.ok) {
        setAuthModeError(body.error || 'Invalid credentials. Try again.');
      } else {
        setSession(body.user);
        sessionStorage.setItem('aerowatch_react_session', JSON.stringify(body.user));
        setAuthMode(null);
        setAuthSuccess('');
        setEmailInput('');
        setPasswordInput('');
      }
      syncServerData();
    } catch (err: any) {
      setAuthModeError('Network communication failed: ' + err.message);
    }
  };

  const handleLogout = () => {
    setSession(null);
    sessionStorage.removeItem('aerowatch_react_session');
  };

  // --- Hotspot Submission Handler ---
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportSuccessMsg('');

    if (!reportLoc.trim()) {
      alert('Please specify landmark or address location.');
      return;
    }

    const currentCell = CELLS.find(c => c.id === selectedCellId);
    if (!currentCell) return;

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: reportLoc.trim(),
          type: reportType,
          severity: reportSeverity,
          notes: reportNotes,
          email: reportEmail,
          photoCount: Math.floor(Math.random() * 2) + 1, // simulates image evidence upload count
          cellId: currentCell.id,
          lat: currentCell.lat + (Math.random() - 0.5) * 0.04, // disperse coordinates slightly around the city core
          lng: currentCell.lng + (Math.random() - 0.5) * 0.04
        })
      });

      if (response.ok) {
        setReportSuccessMsg(`✓ Report logged under ${reportType.toUpperCase()} with ${reportSeverity.toUpperCase()} severity. Mapped immediately onto ${currentCell.name}!`);
        setReportLoc('');
        setReportNotes('');
        setReportEmail('');
        syncServerData();
      } else {
        const body = await response.json();
        alert('Failed to log citizen report: ' + (body.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Network failure: ' + err.message);
    }
  };

  // --- Dispatch Ticket Handlers ---
  const updateAlertStatus = async (id: string, nextStatus: 'acknowledged' | 'dispatched' | 'resolved', resource?: string) => {
    try {
      const payload: any = { status: nextStatus };
      if (resource) payload.resource = resource;

      const response = await fetch(`/api/alerts/${id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        syncServerData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter cells based on user's query and state selection
  const filteredCells = CELLS.filter(c => {
    const matchState = !stateFilter || c.state.toLowerCase() === stateFilter.toLowerCase();
    const matchQuery = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       c.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       c.state.toLowerCase().includes(searchQuery.toLowerCase());
    return matchState && matchQuery;
  });

  const selectedCell = CELLS.find(c => c.id === selectedCellId) || CELLS[0];
  const detailReading = getDetailedReading(selectedCell);
  const selectedForecast = getForecast(selectedCell);
  const currentCategory = getCategory(detailReading.aqi);

  // Health recommendation advisor calculations
  const getAdvisoryContent = (aqi: number) => {
    if (aqi <= 50) return {
      text: 'Air quality is considered satisfactory, and air pollution poses little or no risk. Safe for standard outdoor walks, exercises, and general sports.',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    };
    if (aqi <= 100) return {
      text: 'Air quality is acceptable. However, highly sensitive individuals (e.g. asthmatics) should monitor minor throat irritation and reduce heavy prolonged activities.',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    };
    if (aqi <= 150) return {
      text: 'Members of sensitive groups may experience health effects. General public is less likely to be affected. Keep air purifier active in residential spaces.',
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20'
    };
    if (aqi <= 200) return {
      text: 'Unhealthy air. Everyone may begin to experience adverse health effects. Wear protective double-layer N95 masks when walking outside near transit junctions.',
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    };
    if (aqi <= 300) return {
      text: 'Very unhealthy index. Active health alert. Minimize all outdoor physical tasks. Municipality teams are dispatching active water spraying cannons.',
      color: 'text-pink-400 bg-pink-500/10 border-pink-500/20'
    };
    return {
      text: 'Hazardous air conditions. Health warnings of emergency conditions. Remain strictly indoors, seal windows, run air filtration at high speed.',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    };
  };

  const advisory = getAdvisoryContent(detailReading.aqi);

  // Unique States list for filter dropdown
  const uniqueStates = Array.from(new Set(CELLS.map(c => c.state))).sort();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-cyan-500/30 selection:text-white">
      {/* Header Chrome Brand */}
      <header className="sticky top-0 z-[1000] border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-lg shadow-lg shadow-cyan-500/20">
              🌀
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white font-display">
                  {t('appName')}
                </h1>
                <span className="hidden sm:inline-block rounded-full bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold text-cyan-400 border border-cyan-500/20 uppercase tracking-widest">
                  India State Core
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none mt-0.5">
                {t('tagline')}
              </p>
            </div>
          </div>

          {/* Core Navigation Controls */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('monitor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeTab === 'monitor' 
                  ? 'bg-white/5 text-cyan-400 border-b-2 border-cyan-400' 
                  : 'text-slate-400 hover:text-white hover:bg-white/2'
              }`}
            >
              <Radio className="h-4 w-4" />
              {t('navMonitor')}
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeTab === 'report' 
                  ? 'bg-white/5 text-cyan-400 border-b-2 border-cyan-400' 
                  : 'text-slate-400 hover:text-white hover:bg-white/2'
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              {t('navReport')}
            </button>
            <button
              onClick={() => setActiveTab('ops')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeTab === 'ops' 
                  ? 'bg-white/5 text-cyan-400 border-b-2 border-cyan-400' 
                  : 'text-slate-400 hover:text-white hover:bg-white/2'
              }`}
            >
              <Truck className="h-4 w-4" />
              {t('navOps')}
              {alertsList.filter(a => a.status === 'open').length > 0 && (
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeTab === 'database' 
                  ? 'bg-white/5 text-cyan-400 border-b-2 border-cyan-400' 
                  : 'text-slate-400 hover:text-white hover:bg-white/2'
              }`}
            >
              <Users className="h-4 w-4" />
              {t('navDatabase')}
            </button>
          </nav>

          <div className="flex items-center gap-2">
            {/* Language Toggle Button */}
            <button
              onClick={() => setLang(l => l === 'en' ? 'ta' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 bg-slate-900 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              <Languages className="h-3.5 w-3.5 text-cyan-400" />
              <span>{lang === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>

            {/* Profile Action / Login Button */}
            {session ? (
              <div className="flex items-center gap-3 pl-2 border-l border-white/5">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                    {session.name}
                  </p>
                  <p className="text-[10px] text-cyan-400 font-mono tracking-wider leading-none mt-0.5 uppercase">
                    {session.role.replace('_', ' ')}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg bg-red-950/40 hover:bg-red-900/50 px-3 py-1.5 text-xs font-extrabold text-red-400 border border-red-500/20 transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthMode('login')}
                className="flex items-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 px-4 py-2 shadow-lg shadow-cyan-500/10 active:scale-95 transition-all"
              >
                <Lock className="h-3.5 w-3.5" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sticky Tab bar */}
      <div className="lg:hidden sticky top-16 z-50 bg-slate-900 border-b border-white/5 p-2 flex overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`flex-none px-3.5 py-1.5 rounded-md text-xs font-bold tracking-wide transition-all ${
            activeTab === 'monitor' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 bg-slate-950/40'
          }`}
        >
          {t('navMonitor')}
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`flex-none px-3.5 py-1.5 rounded-md text-xs font-bold tracking-wide transition-all ${
            activeTab === 'report' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 bg-slate-950/40'
          }`}
        >
          {t('navReport')}
        </button>
        <button
          onClick={() => setActiveTab('ops')}
          className={`flex-none px-3.5 py-1.5 rounded-md text-xs font-bold tracking-wide transition-all ${
            activeTab === 'ops' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 bg-slate-950/40'
          }`}
        >
          {t('navOps')}
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`flex-none px-3.5 py-1.5 rounded-md text-xs font-bold tracking-wide transition-all ${
            activeTab === 'database' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 bg-slate-950/40'
          }`}
        >
          {t('navDatabase')}
        </button>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* --- DYNAMIC FLASH ANNOUNCEMENT --- */}
        {apiOnline ? (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-slate-900/40 border border-emerald-500/20 px-4 py-3 text-xs font-medium text-emerald-400">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span><strong>Live Open-Meteo API Connected:</strong> Pulling genuine meteorological particulate metrics in real-time across states.</span>
            </div>
            <span className="hidden sm:inline-block font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">Active</span>
          </div>
        ) : (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-slate-900/40 border border-amber-500/20 px-4 py-3 text-xs font-medium text-amber-400">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <span><strong>Offline Simulator Engaged:</strong> Utilizing local mathematical diurnal and weather cycles to compute index values.</span>
            </div>
            <span className="font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[10px]">Simulating</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* TAB 1: LIVE NATIONAL MONITOR */}
          {activeTab === 'monitor' && (
            <motion.div
              key="monitor"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: List and Filters */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Search & State Filter Panel */}
                <div className="rounded-3xl bg-slate-900/50 p-6 border border-white/5 shadow-xl flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
                      <Search className="h-3.5 w-3.5 text-cyan-400" />
                      Filter Grid
                    </h3>
                    <span className="text-[10px] font-mono text-cyan-400/80 font-bold bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10">
                      {filteredCells.length} matching
                    </span>
                  </div>

                  {/* Dropdown State Filter */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select State</label>
                    <select
                      value={stateFilter}
                      onChange={(e) => {
                        setStateFilter(e.target.value);
                        // Reset selection to the first cell in that state if available
                        const inState = CELLS.find(c => !e.target.value || c.state.toLowerCase() === e.target.value.toLowerCase());
                        if (inState) setSelectedCellId(inState.id);
                      }}
                      className="bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-cyan-500 transition-all"
                    >
                      <option value="">{t('stateFilterAll')}</option>
                      {uniqueStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  {/* Search query string */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t('searchLabel')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-950 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 outline-none w-full focus:border-cyan-500 transition-all placeholder:text-slate-500 font-medium"
                    />
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  </div>
                </div>

                {/* City and Dusky List Directory */}
                <div className="rounded-3xl bg-slate-900/50 border border-white/5 p-6 shadow-xl flex flex-col gap-4 flex-1 max-h-[500px] overflow-y-auto">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5 border-b border-white/5 pb-3">
                    <MapPin className="h-3.5 w-3.5 text-rose-400" />
                    Neighborhood Indexes
                  </h3>

                  <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                    {filteredCells.map(cell => {
                      const det = getDetailedReading(cell);
                      const cat = getCategory(det.aqi);
                      const isSelected = cell.id === selectedCellId;
                      const isDuskyTN = cell.id.startsWith('TN-') && cell.type !== 'green' && cell.type !== 'residential';

                      return (
                        <button
                          key={cell.id}
                          onClick={() => setSelectedCellId(cell.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${
                            isSelected 
                              ? 'bg-gradient-to-r from-slate-900 to-slate-900/60 border-cyan-400 shadow-md' 
                              : 'bg-slate-950/40 border-white/2 hover:bg-slate-900 hover:border-white/10'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                                {cell.name}
                              </span>
                              {isDuskyTN && (
                                <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.2 rounded font-bold uppercase shrink-0">
                                  Dusky Spot
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold font-mono uppercase tracking-wider block mt-0.5">
                              {cell.district} · {cell.state}
                            </span>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <span 
                              className="text-sm font-black font-mono"
                              style={{ color: cat.color }}
                            >
                              {det.aqi}
                            </span>
                            <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Center Column: Live Map and Settings */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Visualizer Map Container */}
                <div className="relative">
                  <AeroMap
                    cells={CELLS}
                    selectedCellId={selectedCellId}
                    onSelectCell={(id) => setSelectedCellId(id)}
                    overlayOpacity={overlayOpacity}
                  />

                  {/* Overlaid floating controller */}
                  <div className="absolute bottom-4 right-4 bg-slate-950/90 border border-white/10 p-4 rounded-2xl shadow-xl z-[400] max-w-[200px] backdrop-blur-md">
                    <label className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest block mb-2">
                      WAQI Layer Opacity ({Math.round(overlayOpacity * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={overlayOpacity}
                      onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 h-1.5 rounded-lg bg-slate-800"
                    />
                  </div>
                </div>

                {/* Details list of all dusky ground stations in TAMIL NADU */}
                <div className="rounded-3xl bg-slate-900/50 p-6 border border-white/5 shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">
                      {t('sensorStations')} (Tamil Nadu Grid)
                    </h3>
                    <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">
                      TAMIL NADU EXCLUSIVE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {CELLS.filter(c => c.state === 'Tamil Nadu').map(c => {
                      const rd = getDetailedReading(c);
                      const ct = getCategory(rd.aqi);
                      return (
                        <div 
                          key={c.id} 
                          onClick={() => setSelectedCellId(c.id)}
                          className="p-3 rounded-xl bg-slate-950 border border-white/2 hover:border-cyan-500/30 cursor-pointer flex items-center justify-between transition-all"
                        >
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-200 truncate">{c.name}</p>
                            <p className="text-[9px] text-slate-400 font-semibold font-mono uppercase tracking-wider mt-0.5">{c.district}</p>
                          </div>
                          <span className="text-sm font-black font-mono ml-2 shrink-0" style={{ color: ct.color }}>
                            {rd.aqi}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Right Column: Speedometer Dial & Projected Trend */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                
                {/* Premium Interactive Speedometer */}
                <Speedometer
                  aqi={detailReading.aqi}
                  locationName={selectedCell.name}
                  subLocation={`${selectedCell.district}, ${selectedCell.state}`}
                />

                {/* Health Guidance Advisories */}
                <div className={`p-5 rounded-3xl border shadow-xl flex flex-col gap-2.5 transition-all duration-1000 ${advisory.color}`}>
                  <h4 className="text-xs font-mono font-black tracking-widest uppercase flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    {t('advisoryTitle')}
                  </h4>
                  <p className="text-xs font-semibold leading-relaxed">
                    {advisory.text}
                  </p>
                  <div className="flex justify-between items-center text-[10px] opacity-75 font-mono pt-1">
                    <span>Source: WHO & NAAQS India</span>
                    <span className="font-bold">AQI {detailReading.aqi}</span>
                  </div>
                </div>

                {/* Interactive responsive SVG Spark Chart */}
                <div className="rounded-3xl bg-slate-900/50 p-6 border border-white/5 shadow-xl flex flex-col gap-4">
                  <h4 className="text-xs font-mono font-black text-slate-400 tracking-widest uppercase border-b border-white/5 pb-2">
                    {t('forecastTitle')}
                  </h4>

                  {/* SVG line projection */}
                  <div className="w-full h-32 relative">
                    <svg viewBox="0 0 300 120" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={currentCategory.color} stopOpacity="0.4" />
                          <stop offset="100%" stopColor={currentCategory.color} stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Threshold alert gridline at AQI 150 */}
                      <line 
                        x1="0" 
                        y1="45" 
                        x2="300" 
                        y2="45" 
                        stroke="#f97316" 
                        strokeDasharray="3,3" 
                        strokeWidth="1.2"
                        className="opacity-70"
                      />
                      <text x="290" y="40" textAnchor="end" className="text-[8px] fill-orange-400 font-mono">Alert Limit (150)</text>

                      {/* Spark graph */}
                      <polyline
                        fill="url(#chartGrad)"
                        stroke="none"
                        points={`
                          0,120 
                          ${selectedForecast.map((f, i) => `${(i / (selectedForecast.length - 1)) * 300}, ${110 - (f.aqi / 500) * 110}`).join(' ')} 
                          300,120
                        `}
                      />
                      <polyline
                        fill="none"
                        stroke={currentCategory.color}
                        strokeWidth="2.5"
                        points={selectedForecast.map((f, i) => `${(i / (selectedForecast.length - 1)) * 300}, ${110 - (f.aqi / 500) * 110}`).join(' ')}
                      />

                      {/* Coordinate circle plots */}
                      {selectedForecast.map((f, i) => {
                        const cx = (i / (selectedForecast.length - 1)) * 300;
                        const cy = 110 - (f.aqi / 500) * 110;
                        return (
                          <circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r={i === 0 ? "4.5" : "3.2"}
                            fill={i === 0 ? '#ffffff' : currentCategory.color}
                            stroke={i === 0 ? currentCategory.color : '#090d16'}
                            strokeWidth="1.5"
                          />
                        );
                      })}
                    </svg>

                    {/* Chart axis intervals */}
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 mt-2">
                      <span>Now</span>
                      <span>+6h</span>
                      <span>+12h</span>
                      <span>+18h</span>
                      <span>+24h</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed italic">
                    Forecast model tracks rolling humidity, traffic cycles, and industrial night operations.
                  </p>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 2: CITIZEN HOTSPOT REPORTER */}
          {activeTab === 'report' && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Form card */}
              <div className="lg:col-span-7 rounded-3xl bg-slate-900/50 p-6 md:p-8 border border-white/5 shadow-xl flex flex-col gap-6">
                <div>
                  <h3 className="text-xl font-black font-display text-white">
                    Submit Hyperlocal Pollution Report
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Flag smoke plumes, dust clouds, industrial discharges, or spontaneous landfill fires. Your report feeds directly into the dispatch queue of municipality staffs and social networks.
                  </p>
                </div>

                {reportSuccessMsg && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
                    {reportSuccessMsg}
                  </div>
                )}

                <form onSubmit={handleReportSubmit} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Location detail */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        📍 Specific Landmark or Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Madurai Mattuthavani main bus platform"
                        value={reportLoc}
                        onChange={(e) => setReportLoc(e.target.value)}
                        className="bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                      />
                    </div>

                    {/* Associated Grid Cell mapping */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Map Reference Grid Cell *
                      </label>
                      <select
                        value={selectedCellId}
                        onChange={(e) => setSelectedCellId(e.target.value)}
                        className="bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                      >
                        {CELLS.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.state})</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* Emission source classification */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-300">What are you seeing?</label>
                    <div className="flex flex-wrap gap-2">
                      {(['smoke', 'dust', 'burning', 'industrial', 'haze'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setReportType(type)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            reportType === type 
                              ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-md shadow-cyan-500/10' 
                              : 'bg-slate-950/60 border-white/5 text-slate-300 hover:border-white/10'
                          }`}
                        >
                          {type.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Severity indicator */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-300">Severity Level</label>
                    <div className="flex flex-wrap gap-2">
                      {(['mild', 'noticeable', 'severe'] as const).map(sev => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setReportSeverity(sev)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            reportSeverity === sev 
                              ? 'bg-rose-500 border-rose-400 text-white shadow-md' 
                              : 'bg-slate-950/60 border-white/5 text-slate-300 hover:border-white/10'
                          }`}
                        >
                          {sev.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Description notes */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-300">Detailed observations (Optional)</label>
                    <textarea
                      placeholder="e.g. Parotta stall stove burning coal in open street. Black residue settling on parked vehicles."
                      value={reportNotes}
                      onChange={(e) => setReportNotes(e.target.value)}
                      rows={3}
                      className="bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>

                  {/* Optional email mapping */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-300">Email for action updates (Optional)</label>
                    <input
                      type="email"
                      placeholder="praveen@gmail.com"
                      value={reportEmail}
                      onChange={(e) => setReportEmail(e.target.value)}
                      className="bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-xs font-black uppercase tracking-wider text-slate-950 py-3.5 rounded-xl font-display active:scale-95 transition-all shadow-lg"
                  >
                    🚀 Submit Hyperlocal Report onto Grid
                  </button>
                </form>
              </div>

              {/* Right column: Instructions + Past Submitted reports list */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Core instructions info block */}
                <div className="rounded-3xl bg-slate-900/50 p-6 border border-white/5 shadow-xl flex flex-col gap-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">
                    Neighborhood reporting guidelines
                  </h3>
                  <ul className="text-xs text-slate-300 flex flex-col gap-3 list-disc pl-4 leading-relaxed font-medium">
                    <li>Reports are categorized instantly by coordinates and tied to the closest Indian district sensor.</li>
                    <li><strong>Hotspot trigger threshold:</strong> If three distinct general people or social workers file reports in the same zone within a 12 hour window, the system fires an automatic *SMOG SPIKE ALERT* inside the municipal ops queue.</li>
                    <li>Uploaded reports can be read and verified by logged-in municipality personnel for active cannon deployment.</li>
                  </ul>
                </div>

                {/* User's recent device logs */}
                <div className="rounded-3xl bg-slate-900/50 p-6 border border-white/5 shadow-xl flex flex-col gap-4 max-h-[400px] overflow-y-auto">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono border-b border-white/5 pb-2">
                    Recent Submitted Reports ({reportsList.length})
                  </h3>

                  {reportsList.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <UserX className="h-8 w-8 mx-auto stroke-1" />
                      <p className="text-xs font-bold mt-2">No citizen reports registered on database.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {reportsList.map((r, i) => (
                        <div key={r.id || i} className="p-4 bg-slate-950 rounded-2xl border border-white/2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider font-mono">
                                {r.type}
                              </span>
                              <h4 className="text-xs font-bold text-slate-100 mt-1">
                                {r.location}
                              </h4>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono ${
                              r.severity === 'severe' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              r.severity === 'noticeable' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {r.severity}
                            </span>
                          </div>
                          {r.notes && (
                            <p className="text-[11px] text-slate-400 mt-2 italic bg-slate-900/50 p-2 rounded-lg leading-relaxed">
                              &ldquo;{r.notes}&rdquo;
                            </p>
                          )}
                          <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-2 border-t border-white/5 pt-1.5">
                            <span>Grid cell: {r.cellId}</span>
                            <span>{new Date(r.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 3: MUNICIPAL DISPATCH & ACTION PORTAL */}
          {activeTab === 'ops' && (
            <motion.div
              key="ops"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Tickets Queue */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="rounded-3xl bg-slate-900/50 p-6 md:p-8 border border-white/5 shadow-xl">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-4 mb-6">
                    <div>
                      <h3 className="text-xl font-black font-display text-white">
                        Priority Hotspot Dispatch Queue
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 font-medium">
                        Live priority alarms raised by ground monitors, satellite anomalies, or grouped citizen photo reports.
                      </p>
                    </div>

                    <button 
                      onClick={syncServerData}
                      className="px-3 py-1.5 rounded-lg border border-white/5 hover:border-cyan-500/30 text-xs font-bold text-slate-300 hover:text-cyan-400 transition-all font-mono"
                    >
                      🔄 Force Sync Queue
                    </button>
                  </div>

                  {alertsList.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 border border-dashed border-white/5 rounded-3xl bg-slate-950/20">
                      <CheckCircle2 className="h-12 w-12 mx-auto stroke-1 text-emerald-400 animate-bounce" />
                      <p className="text-sm font-bold text-white mt-4">All State Districts are normal.</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto">No alerts reported currently in the queue above threshold.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {alertsList.map(a => {
                        const cell = CELLS.find(c => c.id === a.cellId);
                        const isCritical = a.peakAqi >= 180;
                        const isResolved = a.status === 'resolved';

                        return (
                          <div 
                            key={a.id} 
                            className={`p-5 rounded-2xl border transition-all ${
                              isResolved 
                                ? 'bg-slate-950/20 border-white/2 opacity-60' 
                                : isCritical 
                                  ? 'bg-rose-950/5 border-rose-500/20 hover:border-rose-500/40' 
                                  : 'bg-amber-950/5 border-amber-500/20 hover:border-amber-500/40'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono ${
                                    isResolved ? 'bg-slate-800 text-slate-400' :
                                    isCritical ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                                  }`}>
                                    {a.status}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                                    Ticket ID: {a.id}
                                  </span>
                                </div>
                                <h4 className="text-base font-bold text-slate-100 mt-2 font-display">
                                  {a.title}
                                </h4>
                                <p className="text-xs text-slate-400 mt-1 font-semibold flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                  <span>{cell ? `${cell.name}, ${cell.district}` : 'Unknown Location'}</span>
                                </p>
                              </div>

                              <div className="text-left sm:text-right shrink-0">
                                <div className="text-xs font-semibold text-slate-400">Peak Projected</div>
                                <div className={`text-3xl font-black font-mono leading-none mt-1 ${
                                  isResolved ? 'text-slate-400' : isCritical ? 'text-red-400' : 'text-amber-400'
                                }`}>
                                  {a.peakAqi}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-1">ETA: {a.etaHours} hours</div>
                              </div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4 pt-4 border-t border-white/5 text-[11px] font-mono text-slate-500">
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 font-medium">
                                <span>Source: <strong>{a.source}</strong></span>
                                <span>Logged: {new Date(a.createdAt).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                                {a.assignedResource && (
                                  <span className="text-cyan-400 flex items-center gap-1 font-bold">
                                    <Truck className="h-3 w-3" />
                                    Assigned: {a.assignedResource}
                                  </span>
                                )}
                              </div>

                              {/* Interactive controls mapping if logged in */}
                              {!isResolved && (
                                <div className="flex gap-2 shrink-0">
                                  {a.status === 'open' && (
                                    <button
                                      onClick={() => updateAlertStatus(a.id, 'acknowledged')}
                                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold transition-all text-[10px]"
                                    >
                                      Acknowledge
                                    </button>
                                  )}
                                  {a.status !== 'dispatched' && (
                                    <select
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          updateAlertStatus(a.id, 'dispatched', e.target.value);
                                        }
                                      }}
                                      className="px-2 py-1 bg-slate-900 border border-white/5 text-slate-200 text-[10px] rounded font-mono outline-none focus:border-cyan-500"
                                    >
                                      <option value="">Deploy Crew...</option>
                                      <option value="Mist Cannon North">Mist Cannon (North TN)</option>
                                      <option value="Smog Sweeper Madurai">Smog Sweeper (MDU-District)</option>
                                      <option value="Anti-Dust Drone Chennai">Anti-Dust Drone (Chennai Coastal)</option>
                                      <option value="Environmental Compliance Team">Environmental Compliance Team</option>
                                    </select>
                                  )}
                                  <button
                                    onClick={() => updateAlertStatus(a.id, 'resolved')}
                                    className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded transition-all text-[10px]"
                                  >
                                    Mark Resolved
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Asset Roster Overview */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Dedicated Resource Availability panel */}
                <div className="rounded-3xl bg-slate-900/50 p-6 border border-white/5 shadow-xl flex flex-col gap-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono border-b border-white/5 pb-2">
                    Municipal Asset Status
                  </h3>

                  <div className="flex flex-col gap-3 text-xs font-medium">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-slate-200">Mist Cannon (Chennai Ennore)</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">Available</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-slate-200">Anti-Dust Drone (Koyambedu)</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">Available</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                        <span className="text-slate-200">Madurai Stone Crusher Patrol</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-orange-400">Active Duty</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-slate-200">Coimbatore SIDCO Air Team</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">Standby</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-slate-900/50 p-6 border border-white/5 shadow-xl flex flex-col gap-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono">
                    System Control Privileges
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                    Municipality dispatch teams and licensed NGO administrators have permissions to update status, assign water sweeper machinery, or mark regional warnings as cleared.
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    Please log in utilizing standard municipality or social work credential structures.
                  </p>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 4: COMPLETE USER REGISTER & LOGIN TELEMETRY DATABASE */}
          {activeTab === 'database' && (
            <motion.div
              key="database"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-8"
            >
              
              {/* Header and Exporter Banner */}
              <div className="rounded-3xl bg-slate-900/50 p-6 md:p-8 border border-white/5 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h3 className="text-2xl font-black font-display text-white">
                    Aerowatch Verified User Directory
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed font-medium">
                    Persistent database containing registered **Municipality Staffs**, **Social Workers / NGOs**, and **General Public Users**. Includes dynamic automated telemetry capture.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {/* Download Logins Spreadsheet Button */}
                  <a
                    href="/api/export-logins"
                    download="aerowatch_login_history.xlsx"
                    className="flex items-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 border border-white/5 text-emerald-400 hover:bg-slate-800 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase font-display select-none transition-all shadow-lg active:scale-95 shrink-0"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Export Logins
                  </a>

                  {/* Download Entire Spreadsheet Database Button */}
                  <a
                    href="/api/export-database"
                    download="aerowatch_complete_database.xlsx"
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-4 py-2.5 rounded-xl text-xs font-black uppercase text-slate-950 font-display select-none transition-all shadow-lg active:scale-95 shrink-0"
                  >
                    <Sparkles className="h-4 w-4 text-slate-950" />
                    Download Full Excel DB
                  </a>
                  
                  <button 
                    onClick={syncServerData}
                    className="px-3.5 py-2.5 rounded-xl border border-white/5 hover:border-cyan-500/20 text-xs font-bold text-slate-300 transition-all font-mono shrink-0"
                  >
                    🔄 Sync DB
                  </button>
                </div>
              </div>

              {/* Grid Database split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Users List Directory */}
                <div className="lg:col-span-7 rounded-3xl bg-slate-900/50 p-6 border border-white/5 shadow-xl flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-emerald-400" />
                      Users Database State
                    </h4>
                    <span className="text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-mono">
                      {usersList.length} Accounts
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                    {usersList.map((user, i) => (
                      <div 
                        key={user.id || i}
                        className="p-4 bg-slate-950/60 rounded-2xl border border-white/2 hover:border-white/5 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-bold text-slate-100">{user.name}</h5>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider font-mono ${
                              user.role === 'municipal' ? 'bg-indigo-500/10 text-indigo-400' :
                              user.role === 'social_work' ? 'bg-emerald-500/10 text-emerald-400' :
                              user.role === 'researcher' ? 'bg-purple-500/10 text-purple-400' :
                              'bg-slate-800 text-slate-300'
                            }`}>
                              {user.role.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-400 font-mono mt-0.5">
                            {user.email}
                          </p>

                          {user.organization && (
                            <p className="text-xs font-semibold text-cyan-400 flex items-center gap-1 mt-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {user.organization}
                            </p>
                          )}
                        </div>

                        <div className="text-left sm:text-right shrink-0 text-[10px] font-mono text-slate-500">
                          <div>UID: {user.id}</div>
                          <div className="mt-1 flex items-center gap-1 sm:justify-end text-slate-400">
                            <Calendar className="h-3 w-3" />
                            Registered: {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Login Telemetry Streams */}
                <div className="lg:col-span-5 rounded-3xl bg-slate-900/50 p-6 border border-white/5 shadow-xl flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
                      <Radio className="h-4 w-4 text-rose-400" />
                      Database Login Stream (Telemetry)
                    </h4>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                    {loginsList.length === 0 ? (
                      <p className="text-xs font-bold text-slate-500 text-center py-12">No login logs saved in database yet.</p>
                    ) : (
                      loginsList.map((log, i) => (
                        <div key={log.id || i} className="p-3 bg-slate-950 rounded-xl border border-white/2 text-xs flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-slate-200">{log.name}</span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(log.loginAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                            </span>
                          </div>
                          <div className="flex justify-between font-mono text-[9px] text-slate-400 leading-none">
                            <span>{log.email}</span>
                            <span className="text-cyan-400 uppercase font-black">{log.role}</span>
                          </div>
                          {log.ipAddress && (
                            <div className="text-[9px] font-mono text-slate-500 leading-none flex items-center gap-1 border-t border-white/5 pt-1.5 mt-0.5">
                              <span>IP Target: <strong>{log.ipAddress}</strong></span>
                            </div>
                          )}
                          {log.userAgent && (
                            <p className="text-[8px] font-mono text-slate-500 truncate mt-0.5" title={log.userAgent}>
                              Browser: {log.userAgent}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* FOOTER */}
      <footer className="mt-20 border-t border-white/5 bg-slate-950/60 py-12 text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-300 font-display">
              🌀 PureZone India Grid Portal
            </span>
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
              v4.0 Full-Stack SQLite & JSON State
            </span>
          </div>
          
          <p className="text-xs max-w-xl leading-relaxed font-semibold">
            PureZone fuses ground monitors, satellite thermal anomaly sweeps, and aggregated citizen reports to detect hyperlocal air pollution hotspots. Built for robust monitoring block by block.
          </p>

          <p className="text-[10px] font-mono text-slate-600">
            &copy; 2026 PureZone India. All air measurements loaded live from Open-Meteo or simulation fallbacks. Developed with exceptional care for Chennai, Madurai, and all India states.
          </p>
        </div>
      </footer>

      {/* --- FLOATING AUTH DIALOG (MODAL) --- */}
      {authMode && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-slate-900 border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative"
          >
            <button 
              onClick={() => {
                setAuthMode(null);
                setAuthModeError('');
                setAuthSuccess('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white font-mono text-sm"
            >
              ✕
            </button>

            {authMode === 'login' ? (
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="text-lg font-black font-display text-white">Sign In to Aerowatch</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Log in using your verified credentials to publish reports and authorize resource dispatches.
                  </p>
                </div>

                {authSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-medium">
                    {authSuccess}
                  </div>
                )}

                {authError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-medium">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="praveen@gmail.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-xs font-black uppercase tracking-wider text-slate-950 py-3 rounded-xl active:scale-95 transition-all shadow-lg mt-2"
                  >
                    Enter Database
                  </button>
                </form>

                <div className="text-center text-xs text-slate-400 mt-2 font-medium">
                  Don&apos;t have an account?{' '}
                  <button 
                    onClick={() => {
                      setAuthMode('register');
                      setAuthModeError('');
                    }}
                    className="text-cyan-400 hover:underline font-bold"
                  >
                    Register free here
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="text-lg font-black font-display text-white">Register Verified Account</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Create your profile inside the persistent Aerowatch directory database.
                  </p>
                </div>

                {authError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-medium">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Praveen Kumar"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="praveen@gmail.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300">Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="At least 8 characters"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-300">Your Role *</label>
                      <select
                        value={roleInput}
                        onChange={(e) => setRoleInput(e.target.value as any)}
                        className="bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
                      >
                        <option value="citizen">General Public</option>
                        <option value="municipal">Municipality Staff</option>
                        <option value="social_work">Social Worker / NGO</option>
                        <option value="researcher">Researcher</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-300">Organization</label>
                      <input
                        type="text"
                        placeholder="e.g. TN Pollution NGO"
                        value={orgInput}
                        onChange={(e) => setOrgInput(e.target.value)}
                        className="bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-xs font-black uppercase tracking-wider text-slate-950 py-3 rounded-xl active:scale-95 transition-all shadow-lg mt-2"
                  >
                    Register Database Account
                  </button>
                </form>

                <div className="text-center text-xs text-slate-400 mt-2 font-medium">
                  Already have an account?{' '}
                  <button 
                    onClick={() => {
                      setAuthMode('login');
                      setAuthModeError('');
                    }}
                    className="text-cyan-400 hover:underline font-bold"
                  >
                    Log in here
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

    </div>
  );
}
