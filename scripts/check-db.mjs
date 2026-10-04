import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

// Check dev database
const devDb = new Database('./pwd.db');
const devHash = devDb.prepare("SELECT value FROM settings WHERE key = 'auth_pin_hash'").get();
console.log('📁 Dev pwd.db PIN hash:', devHash?.value);

const DEFAULT = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';
console.log('🔑 Expected 1234 hash:', DEFAULT);
console.log('✅ Match:', devHash?.value === DEFAULT);
devDb.close();

// Check AppData database (what the packaged app uses)
const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'PWD Masterlist System', 'pwd.db');
console.log('\n📂 AppData DB path:', appDataPath);
try {
  const appDb = new Database(appDataPath);
  const appHash = appDb.prepare("SELECT value FROM settings WHERE key = 'auth_pin_hash'").get();
  console.log('🔐 AppData DB PIN hash:', appHash?.value);
  console.log('✅ Match:', appHash?.value === DEFAULT);
  appDb.close();
} catch (e) {
  console.log('⚠️  AppData DB not found:', e.message);
}
