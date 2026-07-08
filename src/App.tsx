import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import OverviewPage from './components/OverviewPage';
import DashboardPage from './components/DashboardPage';
import ReportPage from './components/ReportPage';
import OpsPage from './components/OpsPage';
import AuthPage from './components/AuthPage';
import { type User, type Report, type Alert, type CellOverride } from './types';
import { CELLS, getReadingFor, getRiskScore } from './data';
import { Info, X } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setTab] = useState<string>('overview');
  const [overrides, setOverrides] = useState<Record<string, CellOverride>>({});
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [toasts, setToasts] = useState<{ id: string; msg: string; type: 'success' | 'info' }[]>([]);

  // Show Toast helper
  const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Sync session and fetch database overrides at boot
  useEffect(() => {
    const savedUser = localStorage.getItem('aerowatch_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('aerowatch_user');
      }
    }

    // Fetch cell overrides
    fetch('/api/overrides')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setOverrides(data.overrides);
        }
      })
      .catch((err) => console.error('Error fetching overrides:', err));

    // Fetch active alerts
    fetch('/api/alerts')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setActiveAlerts(data.alerts);
        }
      })
      .catch((err) => console.error('Error fetching alerts:', err));
  }, []);

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('aerowatch_user');
    showToast('Signed out successfully.', 'info');
    setTab('overview');
  };

  // Save cell overrides to DB
  const handleSaveOverride = async (
    cellId: string,
    base: number,
    volatility: number,
    noteText: string
  ) => {
    try {
      const res = await fetch('/api/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cellId,
          base,
          volatility,
          noteText,
          savedBy: currentUser?.email || 'anonymous',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save settings.');
      }

      setOverrides((prev) => ({
        ...prev,
        [cellId]: data.override,
      }));

      showToast(`Saved overrides for cell ${cellId} to database.`);

      // Dynamic rule: If the saved override causes the cell's forecast peak to cross 150,
      // let's automatically create a database incident ticket in activeAlerts!
      const cell = CELLS.find((c) => c.id === cellId);
      if (cell) {
        const risk = getRiskScore(cell, data.override);
        if (risk.crossesThreshold) {
          const existingAlert = activeAlerts.find(
            (a) => a.cellId === cellId && a.status !== 'resolved'
          );
          if (!existingAlert) {
            // Trigger auto alert
            const alertRes = await fetch('/api/alerts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                cellId,
                cellName: cell.name,
                severity: 'critical',
                status: 'open',
              }),
            });
            const alertData = await alertRes.json();
            if (alertData.ok) {
              setActiveAlerts((prev) => [alertData.alert, ...prev]);
              showToast(`⚠️ Hotspot detected! Dispatched ticket for ${cell.name}`, 'info');
            }
          }
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Connection error while saving overrides.', 'info');
      throw err;
    }
  };

  // Add Citizen Report
  const handleAddReport = async (reportData: {
    location: string;
    type: string;
    severity: string;
    notes: string;
    email: string;
    photo: string;
    cellId: string;
  }) => {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...reportData,
        userEmail: currentUser?.email || 'anonymous',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to file report.');
    }

    showToast('Filed citizen report to database successfully!');
    return data.report;
  };

  // Update municipal alert status
  const handleUpdateAlert = async (
    id: string,
    status: 'open' | 'dispatched' | 'resolved',
    crewDispatched?: string
  ) => {
    const res = await fetch('/api/alerts/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, crewDispatched }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update alert.');
    }

    setActiveAlerts((prev) => prev.map((a) => (a.id === id ? data.alert : a)));
    showToast(`Updated alert status to: ${status}`);
    return data.alert;
  };

  // Compute stats for overview landing
  const activeAlertsCount = activeAlerts.filter((a) => a.status !== 'resolved').length;
  
  const worstCellInfo = CELLS.map((c) => {
    const cellOver = overrides[c.id];
    return { c, aqi: getReadingFor(c, 0, cellOver) };
  }).sort((a, b) => b.aqi - a.aqi)[0];

  const worstCellName = worstCellInfo?.c?.name || 'Sector 9 Industrial';
  const worstCellAqi = worstCellInfo?.aqi || 125;

  // Render correct tab view
  const renderContent = () => {
    switch (currentTab) {
      case 'overview':
        return (
          <OverviewPage
            onExplore={() => setTab('dashboard')}
            onReport={() => setTab('report')}
            activeAlertsCount={activeAlertsCount}
            worstCellName={worstCellName}
            worstCellAqi={worstCellAqi}
          />
        );
      case 'dashboard':
        return (
          <DashboardPage
            currentUser={currentUser}
            overrides={overrides}
            onSaveOverride={handleSaveOverride}
          />
        );
      case 'report':
        return <ReportPage currentUser={currentUser} onAddReport={handleAddReport} />;
      case 'ops':
        // Safe navigation guard for municipal console access
        if (!currentUser || currentUser.role !== 'municipal') {
          return (
            <div className="py-24 text-center max-w-md mx-auto space-y-4">
              <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
                <Info className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Access Denied</h2>
              <p className="text-sm text-slate-400">
                The municipal dispatch panel requires supervisor clearance. Please register/sign in using a{' '}
                <span className="font-mono text-teal-400 font-bold uppercase">Municipal Staff</span> account.
              </p>
              <button
                onClick={() => setTab('auth-login')}
                className="mt-2 rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-teal-400 transition-all"
              >
                Sign In with Municipal Account
              </button>
            </div>
          );
        }
        return <OpsPage currentUser={currentUser} onUpdateAlert={handleUpdateAlert} />;
      case 'auth-login':
        return (
          <AuthPage
            initialMode="login"
            onAuthSuccess={(u) => {
              setCurrentUser(u);
              showToast(`Logged in successfully. Welcome ${u.name}!`);
            }}
            setTab={setTab}
          />
        );
      case 'auth-register':
        return (
          <AuthPage
            initialMode="register"
            onAuthSuccess={(u) => {
              setCurrentUser(u);
              showToast(`Registered successfully. Welcome ${u.name}!`);
            }}
            setTab={setTab}
          />
        );
      default:
        return (
          <OverviewPage
            onExplore={() => setTab('dashboard')}
            onReport={() => setTab('report')}
            activeAlertsCount={activeAlertsCount}
            worstCellName={worstCellName}
            worstCellAqi={worstCellAqi}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Navbar header */}
      <Navbar
        currentUser={currentUser}
        currentTab={currentTab}
        setTab={setTab}
        onLogout={handleLogout}
      />

      {/* Main Page Layout */}
      <main className="pb-16">{renderContent()}</main>

      {/* Footer chrome */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>AeroWatch — hyperlocal air-quality monitoring. Real-time persistent account database.</span>
          <span className="font-mono text-slate-400">v1.0.0 · Full-Stack build</span>
        </div>
      </footer>

      {/* Dynamic Floating Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start justify-between gap-3 rounded-lg p-3.5 shadow-xl border text-xs leading-relaxed animate-slide-in ${
              toast.type === 'success'
                ? 'bg-white border-blue-500/30 text-blue-800 shadow-blue-500/5'
                : 'bg-white border-slate-200 text-slate-700 shadow-sm'
            }`}
          >
            <p className="flex-1 font-sans">{toast.msg}</p>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-900"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
