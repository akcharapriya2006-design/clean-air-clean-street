import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { createServer as createViteServer } from 'vite';

// --- DATABASE STATE ---
interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: number;
  organization?: string;
}

interface LoginHistory {
  id: number;
  email: string;
  name: string;
  role: string;
  loginAt: number;
  userAgent?: string;
  ipAddress?: string;
}

interface CitizenReport {
  id: string;
  location: string;
  type: string;
  severity: string;
  notes?: string;
  email?: string;
  photoCount: number;
  cellId: string;
  createdAt: string;
  lat: number;
  lng: number;
}

interface HotspotAlert {
  id: string;
  cellId: string;
  title: string;
  severity: string;
  peakAqi: number;
  etaHours: number;
  status: 'open' | 'acknowledged' | 'dispatched' | 'resolved';
  createdAt: string;
  source: string;
  resource?: string;
  resourceId?: string;
  assignedResource?: string;
}

// Global Memory State backed by Local JSON files to guarantee persistence in Cloud Run
const DATA_DIR = path.join(process.cwd(), 'scratch', 'database');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LOGINS_FILE = path.join(DATA_DIR, 'logins.json');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');
const ALERTS_FILE = path.join(DATA_DIR, 'alerts.json');

function loadData<T>(file: string, fallback: T): T {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
  }
  return fallback;
}

function saveData<T>(file: string, data: T): void {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing ${file}:`, err);
  }
}

// In-memory collections
let users: User[] = loadData(USERS_FILE, []);
let loginHistory: LoginHistory[] = loadData(LOGINS_FILE, []);
let citizenReports: CitizenReport[] = loadData(REPORTS_FILE, []);
let hotspotAlerts: HotspotAlert[] = loadData(ALERTS_FILE, []);

const EXCEL_DB_FILE = path.join(DATA_DIR, 'aerowatch_database.xlsx');

function saveAllToExcel(): void {
  try {
    const workbook = XLSX.utils.book_new();

    // 1. Users sheet
    const usersSheet = XLSX.utils.json_to_sheet(users.map(u => ({
      'ID': u.id,
      'Name': u.name,
      'Email': u.email,
      'Password Hash': u.passwordHash,
      'Role': u.role,
      'Created At': new Date(u.createdAt).toISOString(),
      'Organization': u.organization || ''
    })));
    XLSX.utils.book_append_sheet(workbook, usersSheet, 'Users');

    // 2. Login History sheet
    const loginsSheet = XLSX.utils.json_to_sheet(loginHistory.map(l => ({
      'Login ID': l.id,
      'Email': l.email,
      'Name': l.name,
      'Role': l.role,
      'Login At': new Date(l.loginAt).toISOString(),
      'User Agent': l.userAgent || 'Unknown',
      'IP Address': l.ipAddress || '127.0.0.1'
    })));
    XLSX.utils.book_append_sheet(workbook, loginsSheet, 'Login History');

    // 3. Citizen Reports sheet
    const reportsSheet = XLSX.utils.json_to_sheet(citizenReports.map(r => ({
      'ID': r.id,
      'Location': r.location,
      'Type': r.type,
      'Severity': r.severity,
      'Notes': r.notes || '',
      'Email': r.email || '',
      'Photo Count': r.photoCount,
      'Cell ID': r.cellId,
      'Created At': r.createdAt,
      'Latitude': r.lat,
      'Longitude': r.lng
    })));
    XLSX.utils.book_append_sheet(workbook, reportsSheet, 'Citizen Reports');

    // 4. Hotspot Alerts sheet
    const alertsSheet = XLSX.utils.json_to_sheet(hotspotAlerts.map(a => ({
      'ID': a.id,
      'Cell ID': a.cellId,
      'Title': a.title,
      'Severity': a.severity,
      'Peak AQI': a.peakAqi,
      'ETA Hours': a.etaHours,
      'Status': a.status,
      'Created At': a.createdAt,
      'Source': a.source,
      'Assigned Resource': a.assignedResource || ''
    })));
    XLSX.utils.book_append_sheet(workbook, alertsSheet, 'Hotspot Alerts');

    XLSX.writeFile(workbook, EXCEL_DB_FILE);
    console.log('Successfully saved complete database state to Excel:', EXCEL_DB_FILE);
  } catch (err) {
    console.error('Error saving database state to Excel:', err);
  }
}

function loadAllFromExcel(): void {
  try {
    if (!fs.existsSync(EXCEL_DB_FILE)) {
      console.log('No Excel database found. Initializing from JSON backup files.');
      return;
    }
    const workbook = XLSX.readFile(EXCEL_DB_FILE);

    // 1. Load Users
    if (workbook.SheetNames.includes('Users')) {
      const sheet = workbook.Sheets['Users'];
      const rawUsers = XLSX.utils.sheet_to_json<any>(sheet);
      if (rawUsers.length > 0) {
        users = rawUsers.map(row => ({
          id: String(row['ID'] || ''),
          name: String(row['Name'] || ''),
          email: String(row['Email'] || ''),
          passwordHash: String(row['Password Hash'] || ''),
          role: String(row['Role'] || ''),
          createdAt: row['Created At'] ? new Date(row['Created At']).getTime() : Date.now(),
          organization: row['Organization'] ? String(row['Organization']) : undefined
        }));
      }
    }

    // 2. Load Login History
    if (workbook.SheetNames.includes('Login History')) {
      const sheet = workbook.Sheets['Login History'];
      const rawLogins = XLSX.utils.sheet_to_json<any>(sheet);
      if (rawLogins.length > 0) {
        loginHistory = rawLogins.map(row => ({
          id: Number(row['Login ID'] || 0),
          email: String(row['Email'] || ''),
          name: String(row['Name'] || ''),
          role: String(row['Role'] || ''),
          loginAt: row['Login At'] ? new Date(row['Login At']).getTime() : Date.now(),
          userAgent: row['User Agent'] ? String(row['User Agent']) : undefined,
          ipAddress: row['IP Address'] ? String(row['IP Address']) : undefined
        }));
      }
    }

    // 3. Load Citizen Reports
    if (workbook.SheetNames.includes('Citizen Reports')) {
      const sheet = workbook.Sheets['Citizen Reports'];
      const rawReports = XLSX.utils.sheet_to_json<any>(sheet);
      if (rawReports.length > 0) {
        citizenReports = rawReports.map(row => ({
          id: String(row['ID'] || ''),
          location: String(row['Location'] || ''),
          type: String(row['Type'] || ''),
          severity: String(row['Severity'] || ''),
          notes: row['Notes'] ? String(row['Notes']) : undefined,
          email: row['Email'] ? String(row['Email']) : undefined,
          photoCount: Number(row['Photo Count'] || 0),
          cellId: String(row['Cell ID'] || ''),
          createdAt: String(row['Created At'] || new Date().toISOString()),
          lat: Number(row['Latitude'] || 0),
          lng: Number(row['Longitude'] || 0)
        }));
      }
    }

    // 4. Load Hotspot Alerts
    if (workbook.SheetNames.includes('Hotspot Alerts')) {
      const sheet = workbook.Sheets['Hotspot Alerts'];
      const rawAlerts = XLSX.utils.sheet_to_json<any>(sheet);
      if (rawAlerts.length > 0) {
        hotspotAlerts = rawAlerts.map(row => ({
          id: String(row['ID'] || ''),
          cellId: String(row['Cell ID'] || ''),
          title: String(row['Title'] || ''),
          severity: String(row['Severity'] || ''),
          peakAqi: Number(row['Peak AQI'] || 0),
          etaHours: Number(row['ETA Hours'] || 0),
          status: row['Status'] as any || 'open',
          createdAt: String(row['Created At'] || new Date().toISOString()),
          source: String(row['Source'] || ''),
          assignedResource: row['Assigned Resource'] ? String(row['Assigned Resource']) : undefined
        }));
      }
    }
    console.log('Successfully loaded persistent Excel database state from:', EXCEL_DB_FILE);
  } catch (err) {
    console.error('Error loading database from Excel, falling back to JSON backup:', err);
  }
}

// Perform initial Excel load
loadAllFromExcel();

// Initial seeding of administrator
const ADMIN_EMAIL = 'admin@aerowatch.org';
if (!users.some(u => u.email === ADMIN_EMAIL)) {
  users.push({
    id: 'admin_seeded_id',
    name: 'Administrator',
    email: ADMIN_EMAIL,
    // Salted password hash of "password123admin@aerowatch.org"
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    role: 'municipal',
    createdAt: Date.now()
  });
  saveData(USERS_FILE, users);
  saveAllToExcel();
}

// Trigger initial alerts seeding if empty
if (hotspotAlerts.length === 0) {
  // Initial default alerts mapping Indian cities that often spike
  hotspotAlerts = [
    {
      id: 'AL1001',
      cellId: 'DL',
      title: 'Critical Smog Spike — New Delhi, Delhi',
      severity: 'critical',
      peakAqi: 285,
      etaHours: 3,
      status: 'open',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      source: 'Ground sensor + satellite AOD'
    },
    {
      id: 'AL1002',
      cellId: 'BR',
      title: 'Severe Particulate Outbreak — Patna, Bihar',
      severity: 'critical',
      peakAqi: 210,
      status: 'open',
      etaHours: 5,
      createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      source: 'Satellite thermal anomaly + citizen report'
    },
    {
      id: 'AL1003',
      cellId: 'UP-K',
      title: 'Moderate Smoke Spike — Kanpur, Uttar Pradesh',
      severity: 'warning',
      peakAqi: 180,
      status: 'acknowledged',
      etaHours: 8,
      createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      source: 'Citizen report mesh'
    }
  ];
  saveData(ALERTS_FILE, hotspotAlerts);
  saveAllToExcel();
}

// Helper to write database state to an Excel spreadsheet
function generateExcelSheet(): Buffer {
  const dataForSheet = loginHistory.map((row) => ({
    'Login ID': row.id,
    'Name': row.name,
    'Email': row.email,
    'Role': row.role,
    'Login Time': new Date(row.loginAt).toLocaleString('en-AU'),
    'User Agent': row.userAgent || 'Unknown',
    'IP Address': row.ipAddress || '127.0.0.1'
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Login History');
  
  // Return buffer instead of writing to restricted local filesystem path
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

// --- EXPRESS APPLICATION SETUP ---
const app = express();
app.use(cors());
app.use(express.json());

// API: Register User
app.post('/api/register', (req: Request, res: Response) => {
  const { name, email, passwordHash, role, organization } = req.body;

  if (!name || !email || !passwordHash || !role) {
    return res.status(400).json({ ok: false, error: 'All fields are required.' });
  }

  const normEmail = email.trim().toLowerCase();
  if (users.some(u => u.email.toLowerCase() === normEmail)) {
    return res.status(400).json({ ok: false, error: 'An account with that email already exists.' });
  }

  const newUser: User = {
    id: 'USR_' + Math.random().toString(36).substring(2, 11),
    name: name.trim(),
    email: normEmail,
    passwordHash,
    role,
    organization: organization || undefined,
    createdAt: Date.now()
  };

  users.push(newUser);
  saveData(USERS_FILE, users);
  saveAllToExcel();

  res.json({ ok: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
});

// API: Login User
app.post('/api/login', (req: Request, res: Response) => {
  const { email, passwordHash } = req.body;

  if (!email || !passwordHash) {
    return res.status(400).json({ ok: false, error: 'Email and password are required.' });
  }

  const normEmail = email.trim().toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === normEmail);

  if (!user) {
    return res.status(400).json({ ok: false, error: 'No account found with that email.' });
  }

  if (user.passwordHash !== passwordHash) {
    return res.status(400).json({ ok: false, error: 'Incorrect password. Please try again.' });
  }

  // Record login event
  const newLogin: LoginHistory = {
    id: loginHistory.length + 1,
    email: user.email,
    name: user.name,
    role: user.role,
    loginAt: Date.now(),
    userAgent: req.headers['user-agent'],
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1'
  };

  loginHistory.unshift(newLogin);
  saveData(LOGINS_FILE, loginHistory);
  saveAllToExcel();

  // Return session matching original Client model
  const session = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization: user.organization,
    token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    loginAt: newLogin.loginAt
  };

  res.json({ ok: true, user: session });
});

// API: Retrieve Logins list
app.get('/api/logins', (req: Request, res: Response) => {
  res.json({ ok: true, logins: loginHistory });
});

// API: Export Logins Spreadsheet as a Downloadable Buffer
app.get('/api/export-logins', (req: Request, res: Response) => {
  try {
    const fileBuffer = generateExcelSheet();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=aerowatch_login_history.xlsx');
    res.send(fileBuffer);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: 'Failed to generate spreadsheet: ' + err.message });
  }
});

// API: Export Full Database Spreadsheet
app.get('/api/export-database', (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(EXCEL_DB_FILE)) {
      saveAllToExcel();
    }
    const fileBuffer = fs.readFileSync(EXCEL_DB_FILE);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=aerowatch_complete_database.xlsx');
    res.send(fileBuffer);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: 'Failed to export complete database: ' + err.message });
  }
});

// API: Get Users Database list
app.get('/api/users', (req: Request, res: Response) => {
  // Strip password hashes for safety
  const safeUsers = users.map(({ passwordHash, ...u }) => u);
  res.json({ ok: true, users: safeUsers });
});

// API: Retrieve Citizen Reports
app.get('/api/reports', (req: Request, res: Response) => {
  res.json({ ok: true, reports: citizenReports });
});

// API: Submit Citizen Report
app.post('/api/reports', (req: Request, res: Response) => {
  const { location, type, severity, notes, email, photoCount, cellId, lat, lng } = req.body;

  if (!location || !type || !severity || !cellId) {
    return res.status(400).json({ ok: false, error: 'Missing required report fields.' });
  }

  const newReport: CitizenReport = {
    id: 'REP_' + Math.random().toString(36).substring(2, 11).toUpperCase(),
    location,
    type,
    severity,
    notes,
    email,
    photoCount: Number(photoCount) || 0,
    cellId,
    lat: Number(lat),
    lng: Number(lng),
    createdAt: new Date().toISOString()
  };

  citizenReports.unshift(newReport);
  saveData(REPORTS_FILE, citizenReports);

  // Spark Dynamic Hotspot Alert if same location gets multiple reports!
  const recentSameCell = citizenReports.filter(r => r.cellId === cellId);
  if (recentSameCell.length >= 3) {
    const isAlreadyAlerted = hotspotAlerts.some(a => a.cellId === cellId && a.status !== 'resolved');
    if (!isAlreadyAlerted) {
      const dynamicAlert: HotspotAlert = {
        id: 'AL' + (1000 + hotspotAlerts.length + 1),
        cellId,
        title: `Citizen Hotspot Influx (${recentSameCell.length} Reports) — Grid Cell ${cellId}`,
        severity: 'critical',
        peakAqi: 195,
        etaHours: 2,
        status: 'open',
        createdAt: new Date().toISOString(),
        source: 'Aggregated Citizen Report Network'
      };
      hotspotAlerts.unshift(dynamicAlert);
      saveData(ALERTS_FILE, hotspotAlerts);
    }
  }

  saveAllToExcel();

  res.json({ ok: true, report: newReport });
});

// API: Retrieve Hotspot Alerts Queue
app.get('/api/alerts', (req: Request, res: Response) => {
  res.json({ ok: true, alerts: hotspotAlerts });
});

// API: Update Alert status (Assign resources, Acknowledge, Resolve)
app.post('/api/alerts/:id/update', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, resource, resourceId } = req.body;

  const alert = hotspotAlerts.find(a => a.id === id);
  if (!alert) {
    return res.status(404).json({ ok: false, error: 'Alert not found.' });
  }

  if (status) alert.status = status;
  if (resource) alert.assignedResource = resource;

  saveData(ALERTS_FILE, hotspotAlerts);
  saveAllToExcel();
  res.json({ ok: true, alert });
});

// --- VITE AND STATIC PRODUCTION ROUTING SYSTEM ---
async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = 3000; // Hardcoded container reverse-proxy port

  if (!isProduction) {
    console.log('Starting full-stack dev server with Vite Middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving production static build from /dist...');
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===========================================================`);
    console.log(` AeroWatch Active at http://localhost:${PORT}`);
    console.log(` Mode: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`===========================================================`);
  });
}

bootstrap().catch(err => {
  console.error('Fatal Server Boot Error:', err);
});
