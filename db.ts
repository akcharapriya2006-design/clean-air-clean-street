import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'citizen' | 'municipal' | 'social_work' | 'researcher';
  createdAt: number;
  organization?: string;
}

export interface Report {
  id: string;
  location: string;
  type: 'smoke' | 'dust' | 'burning' | 'industrial' | 'haze';
  severity: 'mild' | 'noticeable' | 'severe';
  notes?: string;
  email?: string;
  photoCount: number;
  cellId: string;
  lat: number;
  lng: number;
  createdAt: string;
}

export interface Ticket {
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

const DB_FILE = path.join(process.cwd(), 'aerowatch_db.json');

// Memory store fallback that syncs to JSON file
class Database {
  private data: {
    users: User[];
    reports: Report[];
    tickets: Ticket[];
  } = {
    users: [],
    reports: [],
    tickets: [],
  };

  constructor() {
    this.load();
    this.seedDefaultData();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        console.log('Successfully loaded persistent JSON database from:', DB_FILE);
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Error loading JSON database:', err);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing to JSON database:', err);
    }
  }

  private seedDefaultData() {
    // Seed default admin and representative users
    if (this.data.users.length === 0) {
      this.data.users = [
        {
          id: 'admin_1',
          name: 'Vikram Singh',
          email: 'vikram.singh@municipality.gov.in',
          passwordHash: '8d969eee63f9ae2d62d4222a7f5b15a9b75239e083c65c6c21e6c382b683d73b', // SHA256 for password123 + email
          role: 'municipal',
          createdAt: Date.now() - 1000 * 3600 * 24 * 30, // 30 days ago
          organization: 'Delhi Pollution Control Committee'
        },
        {
          id: 'social_1',
          name: 'Amrita NGO',
          email: 'amrita@cleanairindia.org',
          passwordHash: '8d969eee63f9ae2d62d4222a7f5b15a9b75239e083c65c6c21e6c382b683d73b', // password123
          role: 'social_work',
          createdAt: Date.now() - 1000 * 3600 * 24 * 15,
          organization: 'Clean Air NGO Network'
        },
        {
          id: 'citizen_1',
          name: 'Rahul Sharma',
          email: 'rahul.sharma@gmail.com',
          passwordHash: '8d969eee63f9ae2d62d4222a7f5b15a9b75239e083c65c6c21e6c382b683d73b', // password123
          role: 'citizen',
          createdAt: Date.now() - 1000 * 3600 * 24 * 5
        }
      ];
      this.save();
    }

    // Seed some reports if empty
    if (this.data.reports.length === 0) {
      this.data.reports = [
        {
          id: 'rep_101',
          location: 'Anand Vihar, Delhi',
          type: 'dust',
          severity: 'severe',
          notes: 'High dust particles blowing from metro construction site. No dust screens installed.',
          email: 'rahul.sharma@gmail.com',
          photoCount: 1,
          cellId: 'DL',
          lat: 28.6476,
          lng: 77.3162,
          createdAt: new Date(Date.now() - 1000 * 3600 * 12).toISOString() // 12h ago
        },
        {
          id: 'rep_102',
          location: 'Ghatkopar Landfill, Mumbai',
          type: 'burning',
          severity: 'severe',
          notes: 'Open burning of plastics at garbage dumping zone. Smoke is dark and smells chemically.',
          email: 'mumbai.citizen@yahoo.com',
          photoCount: 1,
          cellId: 'MH-M',
          lat: 19.0856,
          lng: 72.9082,
          createdAt: new Date(Date.now() - 1000 * 3600 * 2).toISOString() // 2h ago
        }
      ];
      this.save();
    }

    // Seed representative ops tickets
    if (this.data.tickets.length === 0) {
      this.data.tickets = [
        {
          id: 'TK-1001',
          cellId: 'DL',
          title: 'Construction Dust Spike — New Delhi',
          severity: 'critical',
          peakAqi: 245,
          etaHours: 3,
          status: 'acknowledged',
          createdAt: new Date(Date.now() - 1000 * 3600 * 6).toISOString(),
          source: 'Ground sensor mesh + Citizen report',
          assignedResource: 'Water Sprinkler Cannons'
        },
        {
          id: 'TK-1002',
          cellId: 'MH-M',
          title: 'Garbage Burning Plume — Mumbai',
          severity: 'critical',
          peakAqi: 182,
          etaHours: 5,
          status: 'open',
          createdAt: new Date(Date.now() - 1000 * 3600 * 1).toISOString(),
          source: 'Satellite thermal anomaly'
        },
        {
          id: 'TK-1003',
          cellId: 'WB',
          title: 'Industrial Exhaust Leak — Kolkata',
          severity: 'warning',
          peakAqi: 148,
          etaHours: 8,
          status: 'dispatched',
          createdAt: new Date(Date.now() - 1000 * 3600 * 18).toISOString(),
          source: 'Satellite AOD + Station WB',
          assignedResource: 'Inspection Team'
        }
      ];
      this.save();
    }
  }

  // User Actions
  getUsers(): User[] {
    return this.data.users;
  }

  getUserByEmail(email: string): User | undefined {
    const norm = email.trim().toLowerCase();
    return this.data.users.find(u => u.email.toLowerCase() === norm);
  }

  createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: 'USR_' + Math.random().toString(36).substring(2, 11),
      createdAt: Date.now()
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  // Citizen Reports Actions
  getReports(): Report[] {
    return this.data.reports;
  }

  createReport(report: Omit<Report, 'id' | 'createdAt'>): Report {
    const newReport: Report = {
      ...report,
      id: 'REP_' + Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString()
    };
    this.data.reports.unshift(newReport);
    this.save();
    return newReport;
  }

  // Tickets Actions
  getTickets(): Ticket[] {
    return this.data.tickets;
  }

  updateTicket(id: string, patch: Partial<Ticket>): Ticket | undefined {
    const idx = this.data.tickets.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.data.tickets[idx] = { ...this.data.tickets[idx], ...patch };
      this.save();
      return this.data.tickets[idx];
    }
    return undefined;
  }

  createTicket(ticket: Omit<Ticket, 'id' | 'createdAt'>): Ticket {
    const newTicket: Ticket = {
      ...ticket,
      id: 'TK_' + Math.random().toString(36).substring(2, 11).toUpperCase(),
      createdAt: new Date().toISOString()
    };
    this.data.tickets.push(newTicket);
    this.save();
    return newTicket;
  }
}

export const dbStore = new Database();
