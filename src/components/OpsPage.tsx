import React, { useState, useEffect } from 'react';
import { type User, type Alert, type Report } from '../types';
import { CELLS } from '../data';
import { ClipboardList, ShieldAlert, Truck, CheckCircle2, UserCheck, RefreshCw, AlertTriangle, Inbox } from 'lucide-react';

interface OpsPageProps {
  currentUser: User | null;
  onUpdateAlert: (id: string, status: 'open' | 'dispatched' | 'resolved', crewDispatched?: string) => Promise<Alert>;
}

export default function OpsPage({ currentUser, onUpdateAlert }: OpsPageProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [crewNames, setCrewNames] = useState<Record<string, string>>({});
  const [updatingAlertId, setUpdatingAlertId] = useState<string | null>(null);

  const fetchAlertsAndReports = async () => {
    setIsLoading(true);
    try {
      // Parallel fetch
      const [alertsRes, reportsRes] = await Promise.all([
        fetch('/api/alerts'),
        fetch('/api/reports')
      ]);
      
      const alertsData = await alertsRes.json();
      const reportsData = await reportsRes.json();

      if (alertsData.ok) {
        setAlerts(alertsData.alerts);
      }
      if (reportsData.ok) {
        setReports(reportsData.reports);
      }
    } catch (err) {
      console.error('Ops fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsAndReports();
  }, []);

  const handleUpdateStatus = async (alertId: string, status: 'open' | 'dispatched' | 'resolved') => {
    setUpdatingAlertId(alertId);
    try {
      const crew = crewNames[alertId] || 'Unassigned Inspection Unit';
      await onUpdateAlert(alertId, status, status === 'dispatched' ? crew : undefined);
      // Refresh list
      await fetchAlertsAndReports();
    } catch (err) {
      console.error('Failed to update alert state:', err);
    } finally {
      setUpdatingAlertId(null);
    }
  };

  const handleCrewNameChange = (alertId: string, val: string) => {
    setCrewNames(prev => ({ ...prev, [alertId]: val }));
  };

  // Compute stat metrics
  const openAlerts = alerts.filter(a => a.status === 'open').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;
  const activeDispatches = alerts.filter(a => a.status === 'dispatched').length;
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved').length;

  // Static field crews roster status
  const fieldCrews = [
    { name: 'Mist Cannon Alpha', status: 'On-Route', location: 'West Dump Yard' },
    { name: 'Inspection Unit 3', status: 'Idle / On-Standby', location: 'Central Headquarters' },
    { name: 'Water Tanker Charlie', status: 'Active Mitigations', location: 'Industrial East' },
    { name: 'Drone Recon Beta', status: 'Scanning', location: 'Sunset Boulevard' },
  ];

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
      {/* Top Header toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-blue-600 font-bold">Municipal Dispatch Queue</span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">Operational Dispatch Console</h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time, server-side synced supervisor interface for assigning mist cannons, field crews, and resolving hotspots.
          </p>
        </div>

        <button
          onClick={fetchAlertsAndReports}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
          <span>Manual Sync Feed</span>
        </button>
      </div>

      {/* Ops KPI Metrics Strip */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-500">Open Alerts</span>
          <span className="mt-1 block font-mono text-3xl font-bold text-red-600">{openAlerts}</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-500">Critical Severity</span>
          <span className="mt-1 block font-mono text-3xl font-bold text-amber-600">{criticalAlerts}</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-500">Crews Dispatched</span>
          <span className="mt-1 block font-mono text-3xl font-bold text-blue-600">{activeDispatches}</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-500">Resolved Today</span>
          <span className="mt- block font-mono text-3xl font-bold text-slate-500">{resolvedAlerts}</span>
        </div>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Left Column - Active Alerts Ingestion Queue */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-md space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-blue-600" />
              Active Alert Incident Queue
            </h3>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-500">
              <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Syncing operations log...
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-500 space-y-2">
              <Inbox className="h-8 w-8 text-slate-400 mx-auto" />
              <p>No active incidents registered in database.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => {
                const cell = CELLS.find(c => c.id === alert.cellId);
                const isOpen = alert.status === 'open';
                const isDispatched = alert.status === 'dispatched';
                const isResolved = alert.status === 'resolved';

                return (
                  <div
                    key={alert.id}
                    className={`rounded-xl border p-5 space-y-4 transition-all ${
                      isResolved
                        ? 'border-slate-100 bg-slate-50/50 opacity-70'
                        : isOpen
                        ? 'border-red-100 bg-red-50/20'
                        : 'border-amber-100 bg-amber-50/20'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                            INCIDENT {alert.id}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase border ${
                            alert.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {alert.severity} Severity
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-950 mt-1">
                          {alert.cellName} (Segment: {cell?.type || 'urban'})
                        </h4>
                      </div>

                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold border ${
                        isResolved
                          ? 'bg-slate-50 text-slate-500 border-slate-200'
                          : isOpen
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {isResolved ? '✓ Resolved' : isOpen ? '● Open Alert' : '⚙ Dispatched'}
                      </span>
                    </div>

                    {/* Operational Details */}
                    <div className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2 text-xs text-slate-600">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400">Incident coordinates:</span>
                        <p className="font-semibold text-slate-800">Grid Segment ID {alert.cellId}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-400">Registered on:</span>
                        <p className="font-semibold text-slate-800">
                          {new Date(alert.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>

                    {/* Action Block */}
                    <div className="border-t border-slate-100 pt-4">
                      {isResolved ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Incident mitigated successfully by crew: <span className="text-slate-900">{alert.crewDispatched}</span></span>
                        </div>
                      ) : isOpen ? (
                        <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                          <div className="w-full sm:flex-1 space-y-1">
                            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                              Assign Field Mitigation Crew
                            </label>
                            <input
                              type="text"
                              value={crewNames[alert.id] || ''}
                              onChange={(e) => handleCrewNameChange(alert.id, e.target.value)}
                              placeholder="e.g. Mist Cannon Alpha, Inspection Unit 3"
                              className="w-full rounded border border-slate-200 bg-white p-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                            />
                          </div>
                          <button
                            type="button"
                            disabled={updatingAlertId === alert.id}
                            onClick={() => handleUpdateStatus(alert.id, 'dispatched')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-amber-500/10 cursor-pointer"
                          >
                            <Truck className="h-3.5 w-3.5" />
                            Dispatch Crew
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <div className="text-xs text-slate-700">
                            Crew deployed: <span className="font-bold text-amber-700">{alert.crewDispatched}</span>
                          </div>
                          <button
                            type="button"
                            disabled={updatingAlertId === alert.id}
                            onClick={() => handleUpdateStatus(alert.id, 'resolved')}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-blue-500/10 cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Mitigate & Resolve
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

        {/* Right Column - Field Crews & Citizen reports feed */}
        <div className="lg:col-span-4 space-y-6 col-span-1">
          {/* Active Crews list */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-4 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-600" />
              Field Mitigation Crews
            </h3>

            <div className="mt-4 divide-y divide-slate-100 space-y-3">
              {fieldCrews.map((crew, i) => (
                <div key={i} className={`pt-3 ${i === 0 ? '' : 'border-t border-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{crew.name}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-mono uppercase font-bold border ${
                      crew.status === 'On-Route' 
                        ? 'bg-amber-50 text-amber-700 border-amber-100' 
                        : crew.status === 'Active Mitigations' 
                        ? 'bg-blue-50 text-blue-700 border-blue-100' 
                        : 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                      {crew.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">Sector: {crew.location}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Citizen cross-references */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-4 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-blue-600" />
              Citizen Reports Audit
            </h3>

            {isLoading ? (
              <div className="py-6 text-center text-xs text-slate-400">Querying database...</div>
            ) : reports.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No report updates logged.</div>
            ) : (
              <div className="mt-4 divide-y divide-slate-100 space-y-3 max-h-[220px] overflow-y-auto pr-2">
                {reports.slice(0, 4).map((rep) => (
                  <div key={rep.id} className="pt-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate max-w-[150px]">{rep.location}</span>
                      <span className="text-[9px] font-mono text-slate-400">{new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[10px] text-slate-600 leading-relaxed truncate">"{rep.notes || 'Photo upload report'}"</p>
                    <span className="block font-mono text-[9px] text-blue-600 font-bold">Segment ID: {rep.cellId}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
