/**
 * API Service for PWD Masterlist System
 * Authentication is disabled for single-user mode. All data routes are public.
 */

// In Electron production, the window loads from file:// so we need the full URL.
// In dev (Vite), we use the relative path which is proxied to localhost:3001.
const API_BASE = (typeof window !== 'undefined' && window.location.protocol === 'file:')
  ? 'http://127.0.0.1:3001/api'
  : '/api';

function authHeaders() {
  return {
    'Content-Type': 'application/json'
  };
}

export const api = {

  // Authentication is disabled for single-user mode.
  // All API routes are now available without login.

  // ── Members ───────────────────────────────────────────

  async fetchMembers(search = '') {
    const url = search
      ? `${API_BASE}/members?search=${encodeURIComponent(search)}`
      : `${API_BASE}/members`;
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch members');
    return res.json();
  },

  async createMember(member) {
    const res = await fetch(`${API_BASE}/members`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(member)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create member');
    return data;
  },

  async updateMember(id, member) {
    const res = await fetch(`${API_BASE}/members/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(member)
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update member');
    }
    return res.json();
  },

  async deleteMember(id) {
    const res = await fetch(`${API_BASE}/members/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete member');
    }
    return res.json();
  },

  async bulkDelete(ids) {
    const res = await fetch(`${API_BASE}/members/bulk-delete`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ ids })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to bulk delete');
    }
    return res.json();
  },

  async importMembers(members) {
    const res = await fetch(`${API_BASE}/members/import`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ members })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to import members');
    }
    return res.json();
  },

  // ── Settings ──────────────────────────────────────────

  async fetchSettings() {
    const res = await fetch(`${API_BASE}/settings`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settings) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  // ── Backup ────────────────────────────────────────────

  async fetchBackup() {
    const res = await fetch(`${API_BASE}/backup`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch backup data');
    return res.json();
  },

  async restoreBackup(backupData, restoreSettings = false) {
    const res = await fetch(`${API_BASE}/backup/restore`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        members: backupData.members,
        settings: backupData.settings,
        restore_settings: restoreSettings
      })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to restore backup');
    }
    return res.json();
  },

  // ── Activity Log ──────────────────────────────────────

  async fetchActivityLog() {
    const res = await fetch(`${API_BASE}/activity`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch activity log');
    return res.json();
  },

  async createActivityLog(logData) {
    const res = await fetch(`${API_BASE}/activity`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(logData)
    });
    if (!res.ok) throw new Error('Failed to log activity');
    return res.json();
  },

  // ── Managed Backup ────────────────────────────────────

  async managedBackup(targetPath) {
    const res = await fetch(`${API_BASE}/backup/managed`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ targetPath })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to perform managed backup');
    return data;
  }
};
