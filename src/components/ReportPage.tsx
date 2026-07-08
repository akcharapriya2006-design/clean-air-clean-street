import React, { useState, useEffect } from 'react';
import { type User, type Report } from '../types';
import { CELLS } from '../data';
import { Camera, MapPin, AlertTriangle, Send, ShieldCheck, Mail, FileText, CheckCircle2 } from 'lucide-react';

interface ReportPageProps {
  currentUser: User | null;
  onAddReport: (reportData: {
    location: string;
    type: string;
    severity: string;
    notes: string;
    email: string;
    photo: string;
    cellId: string;
  }) => Promise<Report>;
}

export default function ReportPage({ currentUser, onAddReport }: ReportPageProps) {
  // Form States
  const [location, setLocation] = useState<string>('');
  const [cellId, setCellId] = useState<string>('cell-9'); // defaults to Sector 9
  const [type, setType] = useState<string>('smoke');
  const [severity, setSeverity] = useState<string>('noticeable');
  const [notes, setNotes] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  
  // UI States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedReport, setSubmittedReport] = useState<Report | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState<boolean>(true);

  // Load existing reports from DB
  const fetchRecentReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.ok) {
        setRecentReports(data.reports);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchRecentReports();
    if (currentUser) {
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  // Handle Photo upload and conversion to Base64
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger geo status (simulated current location match)
  const handleGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(4);
          const lng = position.coords.longitude.toFixed(4);
          setLocation(`Geotagged Coordinates: [${lat}, ${lng}]`);
          // Randomly pick a cell that represents this area
          const randomCell = CELLS[Math.floor(Math.random() * CELLS.length)];
          setCellId(randomCell.id);
        },
        () => {
          setLocation('Downtown Central Crossing (Simulated Location)');
        }
      );
    } else {
      setLocation('Intersection Broadway & Oak (Simulated Location)');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!location.trim()) {
      setErrorMsg('Please specify the location of the hotspot.');
      return;
    }

    setIsSubmitting(true);
    try {
      const report = await onAddReport({
        location,
        type,
        severity,
        notes,
        email: email || currentUser?.email || 'anonymous',
        photo: photoBase64,
        cellId,
      });

      setSubmittedReport(report);
      // Reload reports list
      await fetchRecentReports();
      
      // Reset form fields
      setLocation('');
      setNotes('');
      setPhotoBase64('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const types = [
    { id: 'smoke', label: 'Smoke plume' },
    { id: 'dust', label: 'Dust cloud' },
    { id: 'burning', label: 'Open burning' },
    { id: 'industrial', label: 'Industrial odor' },
    { id: 'haze', label: 'Persistent haze' },
  ];

  const severities = [
    { id: 'mild', label: 'Mild / Faint' },
    { id: 'noticeable', label: 'Noticeable' },
    { id: 'severe', label: 'Severe / Toxic' },
  ];

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <span className="font-mono text-xs uppercase tracking-widest text-blue-600 font-bold">Citizen Report Ingestion</span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
          See smoke, dust, or open burning? Put it on the map.
        </h1>
        <p className="mt-2 text-slate-600 max-w-3xl text-sm leading-relaxed">
          Your geotagged reports are stored in our active database and fed directly into the spatial hexagon mesh model. If three or more reports accumulate in a specific block within a few hours, a Hotspot alert ticket is dispatched to the municipal ops console instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column - Report Ingestion Form */}
        <div className="lg:col-span-7">
          {submittedReport ? (
            <div className="rounded-2xl border border-green-200 bg-green-50/50 p-8 text-center space-y-6 shadow-sm animate-fade-in">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Report Ingested Successfully!</h2>
                <p className="text-sm text-slate-700 max-w-md mx-auto leading-relaxed">
                  Thanks — your report is registered in the database for cell{' '}
                  <span className="font-bold text-blue-600 font-mono">
                    {CELLS.find((c) => c.id === submittedReport.cellId)?.name || submittedReport.cellId}
                  </span>
                  . It has been synced into the active sensor mesh and municipal alerts system.
                </p>
              </div>

              <div className="flex justify-center gap-4 pt-4">
                <button
                  onClick={() => setSubmittedReport(null)}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 shadow-md"
                >
                  Submit Another Report
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md space-y-6">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Citizen Hotspot Disclosure Form
              </h3>

              {errorMsg && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-none" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Location Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Location description</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Street junction, landmark, or specific address"
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 pl-10 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                  />
                  <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                  <button
                    type="button"
                    onClick={handleGeoLocation}
                    className="text-blue-600 hover:underline hover:text-blue-700 font-bold"
                  >
                    📍 Use browser coordinates
                  </button>
                  <span>Auto-correlates to hex coordinate systems</span>
                </div>
              </div>

              {/* Grid cell correlation */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Match to Mesh Cell</label>
                <select
                  value={cellId}
                  onChange={(e) => setCellId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                >
                  {CELLS.map((cell) => (
                    <option key={cell.id} value={cell.id}>
                      {cell.name} ({cell.type} grid segment)
                    </option>
                  ))}
                </select>
              </div>

              {/* Category chips */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">What are you seeing?</label>
                <div className="flex flex-wrap gap-2">
                  {types.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-all ${
                        type === t.id
                          ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity chips */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">How bad is it?</label>
                <div className="flex flex-wrap gap-2">
                  {severities.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSeverity(s.id)}
                      className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-all ${
                        severity === s.id
                          ? s.id === 'severe'
                            ? 'bg-red-50 border-red-500 text-red-700 font-bold'
                            : s.id === 'noticeable'
                            ? 'bg-amber-50 border-amber-500 text-amber-700 font-bold'
                            : 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* File upload and Base64 Conversion */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Upload Photo</label>
                <div className="relative flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-blue-500/50 hover:bg-slate-100/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Camera className="h-8 w-8 text-slate-400 mb-2" />
                  <span className="text-xs text-slate-700 font-semibold">
                    Drag and drop file here, or click to browse
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">
                    Supports JPG, PNG (Stays stored securely on database uploads folder)
                  </span>
                </div>

                {/* Local photo preview */}
                {photoBase64 && (
                  <div className="mt-4 relative rounded-xl overflow-hidden border border-slate-200 bg-white p-2 max-w-xs">
                    <img src={photoBase64} alt="Upload Preview" className="h-32 w-full object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setPhotoBase64('')}
                      className="absolute top-3 right-3 rounded-full bg-slate-900/80 p-1 text-white hover:bg-slate-900"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Details Text Area */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Additional Field Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Thick black smoke, chemical odors noticed, began around 6:30 AM."
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                />
              </div>

              {/* Email updater input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Reporter Contact Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    disabled={!!currentUser}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 pl-10 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 shadow-sm"
                  />
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50 shadow-md shadow-blue-500/5"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Ingesting Report...' : 'Submit Citizen Report'}
              </button>
            </form>
          )}
        </div>

        {/* Right Column - Recent Reports and Alerts */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                Global Reports Feed
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Database Feed</span>
            </h3>

            {isLoadingReports ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Querying database...
              </div>
            ) : recentReports.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No citizen reports logged in database yet.
              </div>
            ) : (
              <div className="mt-4 divide-y divide-slate-100 space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {recentReports.map((r, index) => {
                  const cell = CELLS.find((c) => c.id === r.cellId);
                  const isSevere = r.severity === 'severe';
                  const isNoticeable = r.severity === 'noticeable';

                  return (
                    <div key={r.id} className={`pt-4 ${index === 0 ? '' : 'border-t border-slate-100'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                            REPORTED BY {r.userEmail || 'ANONYMOUS'}
                          </span>
                          <h4 className="text-sm font-bold text-slate-950 mt-0.5">{r.location}</h4>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                          isSevere 
                            ? 'bg-red-50 text-red-700 border-red-200' 
                            : isNoticeable 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {r.type} · {r.severity}
                        </span>
                      </div>

                      {/* Photo from real server uploads or base64 */}
                      {r.photoUrl && (
                        <div className="mt-3 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                          <img src={r.photoUrl} alt="Report attachment" className="h-36 w-full object-cover" />
                        </div>
                      )}

                      <p className="mt-2 text-xs text-slate-600 leading-relaxed italic">
                        "{r.notes || 'No detailed text description provided.'}"
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>Grid cell: <span className="font-bold text-slate-700">{cell?.name || r.cellId}</span></span>
                        <span>{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
