'use strict';
// Preload runs in a sandboxed renderer context.
// It can safely expose limited info to the React app via contextBridge.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('__electronAPI', {
  isElectron: true,
  platform: process.platform,
  // Save the masterlist as a PDF file to a user-chosen location
  savePDF: (html, defaultName) => ipcRenderer.invoke('save-pdf', html, defaultName),
  // Select a directory using native OS dialog
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
});
