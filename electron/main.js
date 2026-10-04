'use strict';

const { app, BrowserWindow, shell, dialog, Menu, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const isDev = !app.isPackaged;
const API_PORT = 3001;
const VITE_PORT = 5173;

let mainWindow = null;
let serverProcess = null;

// ── Path helpers ─────────────────────────────────────────
function getServerPath() {
  if (!isDev) {
    // Try multiple locations depending on the packager used:
    const candidates = [
      // 1. electron-builder extraResources → resources/server.cjs
      path.join(process.resourcesPath, 'server.cjs'),
      // 2. @electron/packager asarUnpack  → app.asar.unpacked/server.cjs
      path.join(app.getAppPath().replace('app.asar', 'app.asar.unpacked'), 'server.cjs'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    // Fallback (should not happen) — log and use first candidate
    console.error('[PWD] server.cjs not found in any expected location:', candidates);
    return candidates[0];
  }
  return path.join(__dirname, '..', 'server.cjs');
}

function getDbPath() {
  return path.join(app.getPath('userData'), 'pwd.db');
}

// ── Start Express server as child process ─────────────────
function startServer() {
  return new Promise((resolve) => {
    const dbPath     = getDbPath();
    const serverPath = getServerPath();

    // Ensure userData directory exists (where the database lives)
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    // Log file — helps debug server issues without attaching a debugger
    const logPath   = path.join(app.getPath('userData'), 'server.log');
    const logStream = fs.createWriteStream(logPath, { flags: 'a' });
    logStream.write(`\n\n=== Server start ${new Date().toISOString()} ===\n`);
    logStream.write(`serverPath: ${serverPath}\n`);
    logStream.write(`dbPath:     ${dbPath}\n`);

    // NODE_PATH points to the asar's node_modules so require() resolves
    // packages (express, cors, helmet …) even from app.asar.unpacked/server.js.
    // Electron's asar patching makes app.asar appear as a virtual directory.
    const asarNodeModules = path.join(app.getAppPath(), 'node_modules');
    logStream.write(`NODE_PATH:  ${asarNodeModules}\n`);

    serverProcess = spawn(process.execPath, [serverPath], {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',   // Electron binary acts as Node.js
        PWD_DB_PATH: dbPath,          // Where to store the database
        PORT: String(API_PORT),
        NODE_ENV: 'production',
        // Lets require() find modules bundled inside app.asar:
        NODE_PATH: asarNodeModules,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      logStream.write('[stdout] ' + msg);
      // Resolve once the Express server signals it's ready
      if (msg.includes('running at') || msg.includes('listening')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      logStream.write('[stderr] ' + data.toString());
    });

    serverProcess.on('error', (err) => {
      logStream.write('[spawn error] ' + err.message + '\n');
      dialog.showErrorBox(
        'Server Error',
        `The backend server failed to start:\n${err.message}\n\nCheck ${logPath} for details.`
      );
      app.quit();
    });

    serverProcess.on('exit', (code) => {
      logStream.write(`[exit] code ${code}\n`);
    });

    // Safety fallback: resolve after 6 seconds even if we don't see the signal
    setTimeout(resolve, 6000);
  });
}

// ── Create the main window ────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#ffffff',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  // Remove the default menu bar (looks cleaner as a desktop app)
  Menu.setApplicationMenu(null);

  // Fade in when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  if (isDev) {
    // Dev mode: connect to Vite dev server
    mainWindow.loadURL(`http://localhost:${VITE_PORT}`);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Production: load the built static files
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Open <a target="_blank"> links in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── App lifecycle ─────────────────────────────────────────
app.whenReady().then(async () => {
  if (!isDev) {
    // Production: start the Express backend before showing the window
    await startServer();
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  // Gracefully kill the server when the app closes
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM');
  }
});

// ── IPC: Select Directory ─────────────────────────────────
ipcMain.handle('select-directory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Backup Folder',
    properties: ['openDirectory', 'createDirectory']
  });
  if (canceled) return null;
  return filePaths[0];
});

// ── IPC: Save PDF file ────────────────────────────────────
// Receives full self-contained HTML from the renderer, loads it in a hidden
// BrowserWindow, uses printToPDF() to generate PDF bytes, and writes the file
// to a user-chosen location via the native Save dialog.
ipcMain.handle('save-pdf', async (event, htmlContent, defaultName) => {
  const os = require('os');
  const tmpFile = path.join(os.tmpdir(), `pwd-print-${Date.now()}.html`);
  let printWin = null;
  try {
    fs.writeFileSync(tmpFile, htmlContent, 'utf8');

    printWin = new BrowserWindow({
      show: false,
      webPreferences: { javascript: false },
    });
    await printWin.loadURL('file:///' + tmpFile.replace(/\\/g, '/'));
    // Give the browser time to render images before capturing
    await new Promise(r => setTimeout(r, 1500));

    const pdfBuffer = await printWin.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { marginType: 'custom', top: 0.6, bottom: 0.6, left: 0.6, right: 0.6 },
    });

    printWin.close();
    printWin = null;
    fs.unlinkSync(tmpFile);

    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Masterlist as PDF',
      defaultPath: defaultName || 'PWD-Masterlist.pdf',
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });

    if (!canceled && filePath) {
      fs.writeFileSync(filePath, pdfBuffer);
      return { success: true, path: filePath };
    }
    return { success: false, canceled: true };
  } catch (err) {
    if (printWin) printWin.close();
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    throw err;
  }
});
