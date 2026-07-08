export type UserRole = 'citizen' | 'municipal' | 'social_work' | 'researcher';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: number;
  organization?: string;
}

export interface CityCell {
  id: string;
  name: string;
  state: string;
  district: string;
  type: 'traffic' | 'industrial' | 'dump' | 'residential' | 'green';
  base: number;
  volatility: number;
  sensor: boolean;
  lat: number;
  lng: number;
  description: string;
}

export interface PollutantDetail {
  aqi: number;
  pm25: number;
  pm10: number;
  source: string;
}

export interface ForecastStep {
  h: number;
  aqi: number;
}

export interface CitizenReport {
  id: string;
  location: string;
  type: 'smoke' | 'dust' | 'burning' | 'industrial' | 'haze';
  severity: 'mild' | 'noticeable' | 'severe';
  notes?: string;
  email?: string;
  photoCount: number;
  cellId: string;
  createdAt: string;
  lat: number;
  lng: number;
}

export interface HotspotTicket {
  id: string;
  cellId: string;
  title: string;
  severity: 'critical' | 'warning' | 'resolved';
  peakAqi: number;
  etaHours: number;
  status: 'open' | 'acknowledged' | 'dispatched' | 'resolved';
  createdAt: string;
  source: string;
  assignedResource?: string;
}

export interface LoginHistory {
  id: number;
  email: string;
  name: string;
  role: string;
  loginAt: number;
  userAgent?: string;
  ipAddress?: string;
}
