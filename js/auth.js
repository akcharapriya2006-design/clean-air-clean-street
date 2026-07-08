/* ==========================================================================
   AeroWatch — Auth Manager
   Client-side auth using localStorage + Web Crypto (SHA-256) password hashing.
   No plain-text passwords are ever stored.
   ========================================================================== */

const AuthManager = (() => {

  const USERS_KEY   = 'aerowatch_users';
  const SESSION_KEY = 'aerowatch_session';
  const REMEMBER_KEY= 'aerowatch_remember';

  /* ── Crypto helpers ────────────────────────────────────────────────────── */

  async function sha256(text) {
    const buf = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(text)
    );
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function generateToken() {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* ── Storage helpers ───────────────────────────────────────────────────── */

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch { return []; }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getSession() {
    // Check sessionStorage first (non-remember), then localStorage (remember me)
    const s = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(REMEMBER_KEY);
    try { return s ? JSON.parse(s) : null; }
    catch { return null; }
  }

  function saveSession(sessionObj, remember) {
    const str = JSON.stringify(sessionObj);
    sessionStorage.setItem(SESSION_KEY, str);
    if (remember) localStorage.setItem(REMEMBER_KEY, str);
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  }

  const API_BASE = (window.location.protocol === 'file:') ? 'http://localhost:3000/api' : '/api';

  // Automatically check server connection status on load and show in the UI
  document.addEventListener('DOMContentLoaded', async () => {
    const authInfo = document.querySelector('.auth-info');
    if (!authInfo) return;

    // Create a new status chip
    const statusChip = document.createElement('div');
    statusChip.className = 'auth-info-chip';
    statusChip.id = 'backend-status-chip';
    statusChip.innerHTML = `<span style="color: #f2a93b;">●</span> Checking server...`;
    authInfo.appendChild(statusChip);

    try {
      const res = await fetch(`${API_BASE.replace('/api', '')}/api/logins`, { method: 'HEAD' });
      if (res.ok || res.status === 200 || res.status === 404) {
        statusChip.innerHTML = `<span style="color: #35c7b9;">●</span> DB + Excel Active`;
        statusChip.title = 'Connected to SQLite database and Excel logger';
      } else {
        throw new Error();
      }
    } catch {
      statusChip.innerHTML = `<span style="color: #e85c4a;">●</span> Database Offline`;
      statusChip.title = 'Using browser local storage only. Run npm start to connect database.';
    }
  });

  /* ── Public API ────────────────────────────────────────────────────────── */

  /**
   * Register a new user.
   * @returns {Promise<{ok:boolean, error?:string}>}
   */
  async function register({ name, email, password, role }) {
    const norm  = email.trim().toLowerCase();

    if (!name || name.trim().length < 2)
      return { ok: false, error: 'Please enter your full name (min 2 characters).' };
    if (!norm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm))
      return { ok: false, error: 'Please enter a valid email address.' };
    if (!password || password.length < 8)
      return { ok: false, error: 'Password must be at least 8 characters.' };

    const hash = await sha256(password + norm); // salted with email

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: norm, passwordHash: hash, role: role || 'citizen' })
      });
      const data = await response.json();
      if (!response.ok) {
        return { ok: false, error: data.error || 'Server error during registration.' };
      }
      // Sync locally to maintain continuity in UI simulations
      const users = getUsers();
      if (!users.find(u => u.email === norm)) {
        users.push({
          id: generateToken().slice(0, 16),
          name: name.trim(),
          email: norm,
          role: role || 'citizen',
          passwordHash: hash,
          createdAt: Date.now(),
          reports: 0
        });
        saveUsers(users);
      }
      return { ok: true };
    } catch (netErr) {
      console.warn('Backend server connection failed. Registering in local storage (Offline Simulator mode).', netErr);
      
      const users = getUsers();
      if (users.find(u => u.email === norm))
        return { ok: false, error: 'An account with that email already exists.' };

      const user = {
        id:        generateToken().slice(0, 16),
        name:      name.trim(),
        email:     norm,
        role:      role || 'citizen',
        passwordHash: hash,
        createdAt: Date.now(),
        reports:   0,
      };
      users.push(user);
      saveUsers(users);
      
      // Let the user know they are in fallback mode
      setTimeout(() => alert('⚠️ Warning: AeroWatch server is offline. Account created in local storage only (no Excel logs). To enable database/Excel features, run "npm start".'), 100);
      return { ok: true };
    }
  }

  /**
   * Log in an existing user.
   * @returns {Promise<{ok:boolean, user?:object, error?:string}>}
   */
  async function login({ email, password, remember }) {
    const norm  = email.trim().toLowerCase();
    const hash = await sha256(password + norm);

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: norm, passwordHash: hash })
      });
      const data = await response.json();
      if (!response.ok) {
        return { ok: false, error: data.error || 'Server error during login.' };
      }
      
      const session = data.user;
      saveSession(session, remember);
      
      // Sync locally to maintain continuity in UI simulations
      const users = getUsers();
      if (!users.find(u => u.email === norm)) {
        users.push({
          id: session.userId,
          name: session.name,
          email: session.email,
          role: session.role,
          passwordHash: hash,
          createdAt: Date.now(),
          reports: 0
        });
        saveUsers(users);
      }
      
      return { ok: true, user: session };
    } catch (netErr) {
      console.warn('Backend server connection failed. Logging in via local storage (Offline Simulator mode).', netErr);
      
      const users = getUsers();
      const user  = users.find(u => u.email === norm);

      if (!user) return { ok: false, error: 'No account found with that email. (Offline mode)' };

      if (hash !== user.passwordHash)
        return { ok: false, error: 'Incorrect password. Please try again. (Offline mode)' };

      const session = {
        userId:    user.id,
        name:      user.name,
        email:     user.email,
        role:      user.role,
        token:     generateToken(),
        loginAt:   Date.now(),
      };
      saveSession(session, remember);
      
      // Let the user know they are in fallback mode
      setTimeout(() => alert('⚠️ Warning: AeroWatch server is offline. Logged in via local storage (no Excel logs). To enable database/Excel features, run "npm start".'), 100);
      return { ok: true, user: session };
    }
  }

  /** Log out the current user and redirect to login. */
  function logout(redirect = true) {
    clearSession();
    if (redirect) window.location.href = 'login.html';
  }

  /** Return the current logged-in user object, or null. */
  function currentUser() {
    return getSession();
  }

  /** Returns true if a valid session exists. */
  function isLoggedIn() {
    return !!getSession();
  }

  /**
   * Guard: if not logged in, redirect to login.html.
   * Call at the top of every protected page.
   */
  function requireAuth(redirectBack = true) {
    if (!isLoggedIn()) {
      const target = redirectBack
        ? `login.html?next=${encodeURIComponent(location.pathname.split('/').pop() || 'dashboard.html')}`
        : 'login.html';
      window.location.href = target;
    }
  }

  /** Expose role labels for display */
  const ROLE_LABELS = {
    citizen:    'Citizen Reporter',
    municipal:  'Municipal Staff',
    researcher: 'Researcher',
  };

  function roleLabel(role) {
    return ROLE_LABELS[role] || role;
  }

  return { register, login, logout, currentUser, isLoggedIn, requireAuth, roleLabel, ROLE_LABELS, API_BASE };
})();
