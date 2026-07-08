import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
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

export interface DatabaseSchema {
  users: User[];
  reports: Report[];
  alerts: Alert[];
  overrides: Record<string, CellOverride>;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Initialize database
async function initDb(): Promise<DatabaseSchema> {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    try {
      const data = await fs.readFile(DB_FILE, 'utf-8');
      return JSON.parse(data);
    } catch {
      // Default initial database state
      const initialDb: DatabaseSchema = {
        users: [],
        reports: [],
        alerts: [
          {
            id: 'alert-1',
            cellId: 'cell-9',
            cellName: 'Sector 9 Industrial',
            severity: 'critical',
            status: 'open',
            createdAt: new Date().toISOString()
          },
          {
            id: 'alert-2',
            cellId: 'cell-12',
            cellName: 'West Dump Yard',
            severity: 'warning',
            status: 'dispatched',
            crewDispatched: 'Mist Cannon Alpha',
            createdAt: new Date().toISOString()
          }
        ],
        overrides: {}
      };
      await writeDb(initialDb);
      return initialDb;
    }
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
}

// Atomic write to avoid data corruption
async function writeDb(data: DatabaseSchema): Promise<void> {
  const tmpFile = `${DB_FILE}.tmp`;
  await fs.mkdir(DB_DIR, { recursive: true });
  await fs.writeFile(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  await fs.rename(tmpFile, DB_FILE);
}

// Helper to hash passwords securely
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Database helper functions
export const db = {
  get: async (): Promise<DatabaseSchema> => {
    return initDb();
  },

  save: async (updater: (data: DatabaseSchema) => void | Promise<void>): Promise<DatabaseSchema> => {
    const data = await initDb();
    await updater(data);
    await writeDb(data);
    return data;
  }
};
