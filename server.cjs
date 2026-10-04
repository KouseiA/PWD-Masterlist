'use strict';
const express = require('express');
const sqlite3 = require('better-sqlite3');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');
const crypto  = require('crypto');
const fs      = require('fs');
// __dirname is native in CommonJS — no fileURLToPath needed

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security constants ──────────────────────────────────
const SESSION_TTL_MS  = 8 * 60 * 60 * 1000; // 8 hours
const MAX_LOGIN_TRIES = 3;
const LOCKOUT_MS      = 30 * 1000;           // 30 seconds
// SHA-256 of "1234" — the default PIN
const DEFAULT_PIN_HASH = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

// ── In-memory session store ─────────────────────────────
// Map<token, expiresAt>
const sessions = new Map();
// Lockout tracker — Map<ip, { tries, lockedUntil }>
const loginAttempts = new Map();

// Clean up expired sessions every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, exp] of sessions) {
    if (exp < now) sessions.delete(token);
  }
}, 30 * 60 * 1000);

// ── Database setup ──────────────────────────────────────
// In Electron production, PWD_DB_PATH points to AppData (survives updates).
// In dev mode, defaults to ./pwd.db in the project folder.
const DB_PATH = process.env.PWD_DB_PATH || path.join(__dirname, 'pwd.db');
const db = new sqlite3(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    birthday TEXT,
    status TEXT DEFAULT 'Active',
    contact TEXT DEFAULT '',
    address TEXT DEFAULT '',
    disabilityType TEXT DEFAULT '',
    sex TEXT DEFAULT '',
    barangay TEXT DEFAULT '',
    expiryDate TEXT DEFAULT ''
  );`,
);

// Migration: add columns if they don't exist yet
const newCols = ['contact', 'address', 'disabilityType', 'sex', 'barangay', 'expiryDate'];
for (const col of newCols) {
  try {
    db.exec(`ALTER TABLE members ADD COLUMN ${col} TEXT DEFAULT ''`);
  } catch (e) { /* column already exists */ }
}

db.exec(`

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    member_id TEXT,
    member_name TEXT,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  -- System settings
  INSERT OR IGNORE INTO settings (key, value) VALUES ('active_pattern', '03-1412');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('expired_patterns', '03-1402, 03-14-02');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('expiry_threshold', '2');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('items_per_page', '10');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('visible_columns', 'name,id,status,birthday');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'emerald');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('mapping_name', 'name,pangalan,member,full name');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('mapping_id', 'pwd id,pwd,id number,id,control,numero,number,no.');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('mapping_birthday', 'birthday,b-day,birth,kapanganakan');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('mapping_status', 'status,kalagayan');

  -- Managed Backups settings
  INSERT OR IGNORE INTO settings (key, value) VALUES ('backup_enabled', 'false');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('backup_frequency', 'Weekly');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('backup_target_path', '');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('backup_last_run', '');

  -- Auth settings (default PIN = 1234)
  INSERT OR IGNORE INTO settings (key, value) VALUES ('auth_pin_hash', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('auth_is_default_pin', 'true');
`);

// ── Layer 3: Security headers (Helmet) ─────────────────
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for Vite dev compat
}));

// ── Layer 4: CORS — localhost only ──────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow: Vite dev server, Electron file:// (null origin), and direct localhost
    const allowed = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ];
    // null origin = file:// protocol (Electron production mode)
    if (!origin || origin === 'null' || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ── Layer 4: Reduced body limit ─────────────────────────
app.use(express.json({ limit: '5mb' }));

// ── Helpers ─────────────────────────────────────────────
function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ── Layer 1: requireAuth middleware ─────────────────────
// Authentication is disabled in this build. All API routes are public.
function requireAuth(req, res, next) {
  next();
}

// ── Layer 6: Safe error helper ──────────────────────────
function serverError(res, err, label = 'operation') {
  console.error(`[PWD Error] ${label}:`, err.message);
  res.status(500).json({ error: 'An internal error occurred. Please try again.' });
}

// ═══════════════════════════════════════════════════════
// AUTH ROUTES (public — no )
// ═══════════════════════════════════════════════════════

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { pin } = req.body;
  const ip = req.ip || 'unknown';

  if (!pin || typeof pin !== 'string') {
    return res.status(400).json({ error: 'PIN is required.' });
  }

  // Lockout check
  const attempt = loginAttempts.get(ip) || { tries: 0, lockedUntil: 0 };
  if (Date.now() < attempt.lockedUntil) {
    const remaining = Math.ceil((attempt.lockedUntil - Date.now()) / 1000);
    return res.status(429).json({ error: 'Too many attempts.', lockedFor: remaining });
  }

  // Compare PIN hash
  const storedHash = db.prepare("SELECT value FROM settings WHERE key = 'auth_pin_hash'").get()?.value || DEFAULT_PIN_HASH;
  const isDefault  = db.prepare("SELECT value FROM settings WHERE key = 'auth_is_default_pin'").get()?.value === 'true';
  const inputHash  = sha256(pin.trim());

  if (inputHash !== storedHash) {
    attempt.tries = (attempt.tries || 0) + 1;
    if (attempt.tries >= MAX_LOGIN_TRIES) {
      attempt.lockedUntil = Date.now() + LOCKOUT_MS;
      attempt.tries = 0;
    }
    loginAttempts.set(ip, attempt);
    const triesLeft = MAX_LOGIN_TRIES - attempt.tries;
    return res.status(401).json({
      error: 'Incorrect PIN.',
      triesLeft: Math.max(0, triesLeft)
    });
  }

  // Success — generate session token
  loginAttempts.delete(ip);
  const token = generateToken();
  sessions.set(token, Date.now() + SESSION_TTL_MS);

  res.json({ success: true, token, isDefaultPin: isDefault });
});

// GET /api/auth/verify
app.get('/api/auth/verify', (req, res) => {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token || !sessions.has(token)) {
    return res.json({ valid: false });
  }
  if (Date.now() > sessions.get(token)) {
    sessions.delete(token);
    return res.json({ valid: false });
  }
  const isDefault = db.prepare("SELECT value FROM settings WHERE key = 'auth_is_default_pin'").get()?.value === 'true';
  res.json({ valid: true, isDefaultPin: isDefault });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token) sessions.delete(token);
  res.json({ success: true });
});

// POST /api/auth/change-pin
app.post('/api/auth/change-pin', (req, res) => {
  const { currentPin, newPin } = req.body;
  if (!currentPin || !newPin) {
    return res.status(400).json({ error: 'Current PIN and new PIN are required.' });
  }
  if (newPin.length < 4 || newPin.length > 8 || !/^\d+$/.test(newPin)) {
    return res.status(400).json({ error: 'New PIN must be 4–8 digits.' });
  }

  const storedHash = db.prepare("SELECT value FROM settings WHERE key = 'auth_pin_hash'").get()?.value || DEFAULT_PIN_HASH;
  if (sha256(currentPin.trim()) !== storedHash) {
    return res.status(401).json({ error: 'Current PIN is incorrect.' });
  }

  const newHash = sha256(newPin.trim());
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('auth_pin_hash', ?)").run(newHash);
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('auth_is_default_pin', 'false')").run();

  // Invalidate all existing sessions after PIN change
  sessions.clear();

  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════
// PROTECTED DATA ROUTES —  applied to all
// ═══════════════════════════════════════════════════════

// Layer 5: Input validator helper
function validateMember(data) {
  const { id, name, birthday, status, contact, address, disabilityType, sex, barangay, expiryDate } = data;
  const errors = [];
  if (!id || typeof id !== 'string' || id.trim().length < 2 || id.trim().length > 60)
    errors.push('PWD ID must be 2–60 characters.');
  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 120)
    errors.push('Name must be 2–120 characters.');
  if (birthday && !/^\d{4}-\d{2}-\d{2}$/.test(birthday) && !/^\d{2}\/\d{2}\/\d{4}$/.test(birthday))
    errors.push('Birthday must be a valid date string.');
  if (status && typeof status === 'string' && status.length > 30)
    errors.push('Status must be under 30 characters.');
  if (contact && typeof contact === 'string' && contact.length > 30)
    errors.push('Contact must be under 30 characters.');
  if (address && typeof address === 'string' && address.length > 200)
    errors.push('Address must be under 200 characters.');
  if (disabilityType && typeof disabilityType === 'string' && disabilityType.length > 50)
    errors.push('Disability Type must be under 50 characters.');
  if (sex && typeof sex === 'string' && sex.length > 10)
    errors.push('Sex must be under 10 characters.');
  if (barangay && typeof barangay === 'string' && barangay.length > 100)
    errors.push('Barangay must be under 100 characters.');
  if (expiryDate && typeof expiryDate === 'string' && expiryDate.length > 50)
    errors.push('Expiry Date must be under 50 characters.');
  return errors;
}

// GET all members
app.get('/api/members', (req, res) => {
  const { search } = req.query;
  try {
    let rows;
    if (search) {
      const stmt = db.prepare('SELECT * FROM members WHERE name LIKE ? OR id LIKE ?');
      rows = stmt.all(`%${search}%`, `%${search}%`);
    } else {
      rows = db.prepare('SELECT * FROM members ORDER BY name ASC').all();
    }
    res.json(rows);
  } catch (err) { serverError(res, err, 'fetchMembers'); }
});

// GET single member
app.get('/api/members/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
    if (row) res.json(row);
    else res.status(404).json({ error: 'Member not found.' });
  } catch (err) { serverError(res, err, 'fetchMember'); }
});

// POST new member
app.post('/api/members', (req, res) => {
  const errors = validateMember(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });

  const { id, name, birthday, status, contact, address, disabilityType, sex, barangay, expiryDate } = req.body;
  try {
    db.prepare('INSERT INTO members (id, name, birthday, status, contact, address, disabilityType, sex, barangay, expiryDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      id.trim(), name.trim(), (birthday || '').trim(), (status || 'Active').trim(),
      (contact || '').trim(), (address || '').trim(), (disabilityType || '').trim(), (sex || '').trim(), (barangay || '').trim(), (expiryDate || '').trim()
    );
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'A member with this ID already exists.' });
    }
    serverError(res, err, 'createMember');
  }
});

// PUT update member
app.put('/api/members/:id', (req, res) => {
  const logMsg = `[${new Date().toISOString()}] UPDATING ID: ${req.params.id} DATA: ${JSON.stringify(req.body)}\n`;
  fs.appendFileSync('server_debug.log', logMsg);
  
  const newId = req.body.id ? req.body.id.trim() : req.params.id;
  const errors = validateMember({ id: newId, ...req.body });
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });

  const { name, birthday, status, contact, address, disabilityType, sex, barangay, expiryDate } = req.body;
  const oldId = req.params.id;
  try {
    const result = db.prepare(
      'UPDATE members SET id = ?, name = ?, birthday = ?, status = ?, contact = ?, address = ?, disabilityType = ?, sex = ?, barangay = ?, expiryDate = ? WHERE id = ?'
    ).run(newId, name.trim(), (birthday || '').trim(), (status || 'Active').trim(),
      (contact || '').trim(), (address || '').trim(), (disabilityType || '').trim(), (sex || '').trim(), (barangay || '').trim(), (expiryDate || '').trim(), oldId);
    if (result.changes > 0) res.json({ success: true, id: newId });
    else res.status(404).json({ error: 'Member not found.' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'A member with this ID already exists.' });
    }
    serverError(res, err, 'updateMember');
  }
});

// DELETE member
app.delete('/api/members/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id);
    if (result.changes > 0) res.json({ success: true });
    else res.status(404).json({ error: 'Member not found.' });
  } catch (err) { serverError(res, err, 'deleteMember'); }
});

// Bulk Delete
app.post('/api/members/bulk-delete', (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Invalid IDs list.' });
  }
  const deleteStmt = db.prepare('DELETE FROM members WHERE id = ?');
  const transaction = db.transaction((ids) => { for (const id of ids) deleteStmt.run(id); });
  try {
    transaction(ids);
    res.json({ success: true, count: ids.length });
  } catch (err) { serverError(res, err, 'bulkDelete'); }
});

// Bulk Import
app.post('/api/members/import', (req, res) => {
  const { members } = req.body;
  if (!members || !Array.isArray(members)) {
    return res.status(400).json({ error: 'Invalid members list.' });
  }
  const insertStmt = db.prepare('INSERT OR REPLACE INTO members (id, name, birthday, status, contact, address, disabilityType, sex, barangay, expiryDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const transaction = db.transaction((members) => {
    for (const m of members) insertStmt.run(m.id, m.name, m.birthday, m.status, m.contact || '', m.address || '', m.disabilityType || '', m.sex || '', m.barangay || '', m.expiryDate || '');
  });
  try {
    transaction(members);
    res.json({ success: true, count: members.length });
  } catch (err) { serverError(res, err, 'importMembers'); }
});

// GET full backup
app.get('/api/backup', (req, res) => {
  try {
    const members = db.prepare('SELECT * FROM members ORDER BY name ASC').all();
    const settingRows = db.prepare('SELECT * FROM settings').all();
    const settings = {};
    settingRows.forEach(r => settings[r.key] = r.value);
    // Strip the PIN hash from backup for safety
    delete settings.auth_pin_hash;
    res.json({
      version: '1.0',
      created_at: new Date().toISOString(),
      total_members: members.length,
      members,
      settings
    });
  } catch (err) { serverError(res, err, 'fetchBackup'); }
});

// POST restore from backup
app.post('/api/backup/restore', (req, res) => {
  const { members, settings, restore_settings } = req.body;
  if (!members || !Array.isArray(members)) {
    return res.status(400).json({ error: 'Invalid backup: members array required.' });
  }
  const deleteAll    = db.prepare('DELETE FROM members');
  const insertMember = db.prepare('INSERT OR REPLACE INTO members (id, name, birthday, status, contact, address, disabilityType, sex, barangay, expiryDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const transaction = db.transaction(() => {
    deleteAll.run();
    for (const m of members) {
      insertMember.run(m.id, m.name, m.birthday || '', m.status || 'Active', m.contact || '', m.address || '', m.disabilityType || '', m.sex || '', m.barangay || '', m.expiryDate || '');
    }
    if (restore_settings && settings && typeof settings === 'object') {
      for (const [key, value] of Object.entries(settings)) {
        if (key === 'auth_pin_hash') continue; // Never restore PIN hash from backup
        insertSetting.run(key, String(value));
      }
    }
  });
  try {
    transaction();
    res.json({ success: true, restored: members.length });
  } catch (err) { serverError(res, err, 'restoreBackup'); }
});

// GET Settings
app.get('/api/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM settings WHERE key NOT LIKE \'auth_%\'').all();
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);
    res.json(settings);
  } catch (err) { serverError(res, err, 'fetchSettings'); }
});

// POST Update Settings
app.post('/api/settings', (req, res) => {
  const settings = req.body;
  const updateStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const transaction = db.transaction((data) => {
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('auth_')) continue; // Protect auth settings
      updateStmt.run(key, String(value));
    }
  });
  try {
    transaction(settings);
    res.json({ success: true });
  } catch (err) { serverError(res, err, 'updateSettings'); }
});

// GET Activity Log
app.get('/api/activity', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM activity_log ORDER BY id DESC LIMIT 100').all();
    res.json(rows);
  } catch (err) { serverError(res, err, 'fetchActivity'); }
});

// POST Activity Log
app.post('/api/activity', (req, res) => {
  const { type, member_id, member_name } = req.body;
  if (!type) return res.status(400).json({ error: 'Log type is required.' });
  try {
    db.prepare('INSERT INTO activity_log (type, member_id, member_name, timestamp) VALUES (?, ?, ?, ?)')
      .run(type, member_id || '', member_name || '', new Date().toISOString());
    res.json({ success: true });
  } catch (err) { serverError(res, err, 'logActivity'); }
});

// POST Managed Backup
app.post('/api/backup/managed', (req, res) => {
  const { targetPath } = req.body;
  if (!targetPath) return res.status(400).json({ error: 'Target path is required.' });

  try {
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupName = `pwd_masterlist_backup_${timestamp}.db`;
    const fullDest = path.join(targetPath, backupName);

    // Simple file copy for the SQLite database
    fs.copyFileSync(DB_PATH, fullDest);

    // Update last run setting
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('backup_last_run', ?)")
      .run(new Date().toISOString());

    res.json({ success: true, path: fullDest });
  } catch (err) {
    serverError(res, err, 'managedBackup');
  }
});

// ── Layer 2: Localhost-only binding ────────────────────
app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ PWD Masterlist backend running at http://127.0.0.1:${PORT}`);
  console.log(`🔒 Bound to localhost only — LAN access is blocked`);
});
