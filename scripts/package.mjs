/**
 * PWD Masterlist System — Windows Package Script
 * Uses @electron/packager to create a portable app folder.
 * No admin rights, no code signing, no native module compilation needed.
 *
 * Output: release/PWD Masterlist System-win32-x64/
 *   └── PWD Masterlist System.exe  ← double-click to run
 *
 * To update the office PC:
 *   1. Run this script (npm run dist)
 *   2. Copy the release folder to a USB drive
 *   3. On office PC: close the app, copy new files over old folder, done.
 *      (The database in AppData is never touched)
 */

import { packager } from '@electron/packager';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..'); // project root

const OUT_DIR = path.join(ROOT, 'release');

console.log('\n🔨 Step 1 — Building frontend with Vite...');
execSync('npm run build', { stdio: 'inherit', cwd: ROOT });
console.log('✅ Vite build complete\n');

console.log('📦 Step 2 — Packaging with electron/packager...');

// ── Binary swap: install Electron ABI-133 binary for packaging ────────────────
// Dev mode uses Node ABI-137 (scripts/better_sqlite3_node.node).
// Production (Electron) uses ABI-133   (scripts/better_sqlite3_electron.node).
// Both are stored permanently in scripts/ so swaps are always safe/idempotent.
const binaryPath         = path.join(ROOT, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node');
const nodeBinaryPath     = path.join(ROOT, 'scripts', 'better_sqlite3_node.node');
const electronBinaryPath = path.join(ROOT, 'scripts', 'better_sqlite3_electron.node');

if (!fs.existsSync(electronBinaryPath)) {
  console.error('❌ Electron binary not found at', electronBinaryPath);
  process.exit(1);
}
if (!fs.existsSync(nodeBinaryPath)) {
  console.error('❌ Node binary not found at', nodeBinaryPath);
  console.error('   Download it: https://github.com/WiseLibs/better-sqlite3/releases/download/v12.8.0/better-sqlite3-v12.8.0-node-v137-win32-x64.tar.gz');
  process.exit(1);
}

// Install the Electron binary for packaging
fs.copyFileSync(electronBinaryPath, binaryPath);
console.log('🔄 Swapped to Electron ABI-133 binary for packaging\n');

if (fs.existsSync(OUT_DIR)) {
  try {
    fs.rmSync(OUT_DIR, { recursive: true });
  } catch (e) {
    console.error('\n❌ Cannot delete old release folder — is "PWD Masterlist System.exe" still running?');
    console.error('   Close the app first, then run npm run dist again.\n');
    process.exit(1);
  }
}

const appPaths = await packager({
  dir: ROOT,
  name: 'PWD Masterlist System',
  platform: 'win32',
  arch: 'x64',
  out: OUT_DIR,
  overwrite: true,
  asar: {
    // Unpack native modules + server.cjs so they can be accessed outside the asar archive.
    // server.cjs must be outside asar since we spawn it as a child process.
    unpack: '{**/*.node,server.cjs}',
  },
  icon: path.join(ROOT, 'public', 'icon.png'),
  appVersion: '1.0.0',
  win32metadata: {
    CompanyName: 'Meycauayan City PWD Office',
    FileDescription: 'PWD Masterlist System',
    ProductName: 'PWD Masterlist System',
    InternalName: 'pwd-masterlist',
  },
  // Include only what the app needs at runtime
  ignore: [
    /^\/\.(git|github|gemini)\//,
    /^\/src\//,
    /^\/scripts\//,             // build scripts — not needed at runtime
    /^\/node_modules\/\.cache\//,
    /^\/node_modules\/@electron\/packager\//,
    /^\/node_modules\/electron-builder\//,
    /^\/node_modules\/@electron\/rebuild\//,
    /^\/node_modules\/vite\//,
    /^\/node_modules\/@vitejs\//,
    /^\/node_modules\/esbuild\//,
    /^\/node_modules\/rollup\//,
    /^\/release\//,
    /^\/\.env/,
  ],
});

console.log(`\n✅ App packaged to:\n  ${appPaths[0]}\n`);

// Note: server.cjs uses .cjs extension — no package.json type override needed.

console.log('📁 Files in release folder:');
fs.readdirSync(appPaths[0]).slice(0, 8).forEach(f => console.log('  ', f));

// ── Restore Node ABI-137 binary so npm run dev still works ───────────────────
// nodeBinaryPath is scripts/better_sqlite3_node.node — permanent store, never deleted.
fs.copyFileSync(nodeBinaryPath, binaryPath);
console.log('\n🔄 Restored Node.js ABI-137 binary — dev mode ready\n');

const exePath = path.join(appPaths[0], 'PWD Masterlist System.exe');
console.log(`🚀 To run: "${exePath}"`);
console.log('\n📋 Update process for office PC:');
console.log('  1. Run this script on dev PC');
console.log('  2. Copy the entire "PWD Masterlist System-win32-x64" folder to USB');
console.log('  3. On office PC: close app, copy folder contents over existing folder');
console.log('  4. Database in AppData is safe — never affected by updates ✅\n');
