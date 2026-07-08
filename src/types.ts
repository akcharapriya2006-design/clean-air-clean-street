export interface User {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'municipal' | 'researcher';
  createdAt: string;
}

export interface Report {
  id: string;
  location: string;
  type: string;
  severity: string;
  notes: string;
  email: string;
  photoUrl: string;
  cellId: string;
  createdAt: string;
  userEmail: string;
}

export interface Alert {
  id: string;
  cellId: string;
  cellName: string;
  severity: 'critical' | 'warning' | 'resolved';
  status: 'open' | 'dispatched' | 'resolved';
  crewDispatched?: string;
  createdAt: string;
}

export interface CellOverride {
  cellId: string;
  base: number;
  volatility: number;
  noteText: string;
  savedAt: string;
  savedBy: string;
}

export interface AeroCell {
  id: string;
  name: string;
  type: 'traffic' | 'industrial' | 'dump' | 'residential' | 'green';
  base: number;
  volatility: number;
  sensor: boolean; // physical ground sensor or satellite-only
  q: number; // axial coordinate q
  r: number; // axial coordinate r
}

export interface AeroCategory {
  label: string;
  color: string;
  textCol: string;
  bgCol: string;
}
