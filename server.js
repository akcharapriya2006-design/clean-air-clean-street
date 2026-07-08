const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS so the file:// frontend can talk to it if needed
app.use(cors());
app.use(express.json());

// Serve static files from the current folder (aerowatch)
app.use(express.static(__dirname));

// Initialize SQLite database
const dbPath = path.join(__dirname, 'aerowatch.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to the database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeDatabase();
  }
});

// Setup database tables
function initializeDatabase() {
  db.serialize(() => {
    // 1. Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        role TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      )
    `);

    // 2. Login History Table
    db.run(`
      CREATE TABLE IF NOT EXISTS login_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        loginAt INTEGER NOT NULL,
        userAgent TEXT,
        ipAddress TEXT
      )
    `);

    // 3. Seed default admin user if not exists
    const adminEmail = 'admin@aerowatch.org';
    db.get('SELECT * FROM users WHERE email = ?', [adminEmail], (err, row) => {
      if (err) {
        console.error('Error checking for admin user:', err);
        return;
      }
      if (!row) {
        // Compute SHA-256 of "password123" + "admin@aerowatch.org"
        const password = 'password123';
        const hashInput = password + adminEmail;
        const passwordHash = crypto.createHash('sha256').update(hashInput).digest('hex');
        
        const adminUser = {
          id: 'admin_seeded_id',
          name: 'Administrator',
          email: adminEmail,
          passwordHash: passwordHash,
          role: 'municipal',
          createdAt: Date.now()
        };

        db.run(
          `INSERT INTO users (id, name, email, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
          [adminUser.id, adminUser.name, adminUser.email, adminUser.passwordHash, adminUser.role, adminUser.createdAt],
          (insertErr) => {
            if (insertErr) {
              console.error('Error seeding admin user:', insertErr.message);
            } else {
              console.log('Successfully seeded admin account: admin@aerowatch.org / password123');
            }
          }
        );
      }
    });

    // 4. Update initial Excel sheet once tables are ready
    db.run('SELECT 1 FROM login_history LIMIT 1', [], (err) => {
      updateExcelFile();
    });
  });
}

// Helper to generate the Excel file from database history
function updateExcelFile() {
  db.all('SELECT * FROM login_history ORDER BY loginAt DESC', [], (err, rows) => {
    if (err) {
      console.error('Failed to retrieve login history for Excel:', err.message);
      return;
    }

    try {
      const dataForSheet = rows.map((row) => ({
        'Login ID': row.id,
        'Name': row.name,
        'Email': row.email,
        'Role': row.role,
        'Login Time': new Date(row.loginAt).toLocaleString(),
        'User Agent': row.userAgent,
        'IP Address': row.ipAddress
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Login History');

      const excelPath = 'C:\\Users\\acer\\OneDrive\\Desktop\\logins.xlsx';
      XLSX.writeFile(workbook, excelPath);
      console.log('Updated Excel sheet successfully at:', excelPath);
    } catch (excelErr) {
      console.error('Error writing Excel file:', excelErr.message);
    }
  });
}

// ── API Routes ──────────────────────────────────────────────────────────────

// Register Endpoint
app.post('/api/register', (req, res) => {
  const { name, email, passwordHash, role } = req.body;

  if (!name || !email || !passwordHash || !role) {
    return res.status(400).json({ ok: false, error: 'All fields are required.' });
  }

  const userId = crypto.randomBytes(8).toString('hex');
  const createdAt = Date.now();

  db.run(
    `INSERT INTO users (id, name, email, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, name, email, passwordHash, role, createdAt],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ ok: false, error: 'An account with that email already exists.' });
        }
        return res.status(500).json({ ok: false, error: 'Database error: ' + err.message });
      }
      res.json({ ok: true });
    }
  );
});

// Login Endpoint
app.post('/api/login', (req, res) => {
  const { email, passwordHash } = req.body;

  if (!email || !passwordHash) {
    return res.status(400).json({ ok: false, error: 'Email and password hash are required.' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()], (err, user) => {
    if (err) {
      return res.status(500).json({ ok: false, error: 'Database error: ' + err.message });
    }
    if (!user) {
      return res.status(400).json({ ok: false, error: 'No account found with that email.' });
    }
    if (user.passwordHash !== passwordHash) {
      return res.status(400).json({ ok: false, error: 'Incorrect password. Please try again.' });
    }

    // Insert to Login History
    const loginAt = Date.now();
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

    db.run(
      `INSERT INTO login_history (email, name, role, loginAt, userAgent, ipAddress) VALUES (?, ?, ?, ?, ?, ?)`,
      [user.email, user.name, user.role, loginAt, userAgent, ipAddress],
      function (historyErr) {
        if (historyErr) {
          console.error('Error inserting to login history:', historyErr.message);
        } else {
          // Trigger Excel regeneration
          updateExcelFile();
        }

        // Return session object matching frontend expectations
        const session = {
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: crypto.randomBytes(16).toString('hex'),
          loginAt: loginAt
        };

        res.json({ ok: true, user: session });
      }
    );
  });
});

// Retrieve Login History Endpoint
app.get('/api/logins', (req, res) => {
  db.all('SELECT * FROM login_history ORDER BY loginAt DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ ok: false, error: 'Database error: ' + err.message });
    }
    res.json({ ok: true, logins: rows });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`AeroWatch server running on http://localhost:${PORT}`);
  console.log(`Static UI served from localhost:${PORT}`);
  console.log(`==================================================`);
});
