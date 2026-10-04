import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import RegistrationForm from "./components/RegistrationForm";
import AgeChart from "./components/AgeChart";
import {
  Users,
  UserPlus,
  LayoutDashboard,
  Search,
  Filter,
  Download,
  Bell,
  Settings,
  MoreVertical,
  Calendar,
  MapPin,
  Stethoscope,
  AlertCircle,
  X,
  Upload,
  Edit,
  Trash2,
  PieChart as PieChartIcon,
  UserCircle,
  ListX,
  CheckCircle,
  Info,
  Save,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  TableProperties,
  Check,
  ChevronDown,
  Settings2,
  Fingerprint,
  Palette,
  Columns3,
  FileSpreadsheet,
  Tag,
  Hash,
  Cake,
  Activity,
  Copy,
  Menu,
  Printer,
  Archive,
  HardDriveDownload,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Lock,
  LogOut,
  FileText,
  Shield,
  HardDrive,
  FolderOpen,
  Hourglass,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";
import { api } from "./api";
import samakameLogo from "./Logo/SAMAKAME logo.png";
import libtongLogo from "./Logo/Libtong Logo.png";

// ── Loading Skeleton Component ──────────────────────────────────
function LoadingSkeleton({ count = 3, type = "card" }) {
  if (type === "card") {
    return (
      <div className="loading-container">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-header"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line short"></div>
          </div>
        ))}
      </div>
    );
  }
  if (type === "table") {
    return (
      <div className="loading-container">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="skeleton-row">
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
            <div className="skeleton-cell"></div>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// ── Empty State Component ──────────────────────────────────
function EmptyState({ 
  title = "No Data", 
  message = "Nothing to display", 
  icon: Icon = Users,
  action = null 
}) {
  return (
    <div className="empty-state-container" role="status" aria-live="polite">
      <div className="empty-state-icon">
        <Icon size={48} opacity={0.2} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {action && (
        <button className="empty-state-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

// ── Breadcrumb Component ──────────────────────────────────
function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, idx) => (
          <li key={idx} className="breadcrumb-item">
            {item.onClick ? (
              <button
                className="breadcrumb-link"
                onClick={item.onClick}
                aria-current={idx === items.length - 1 ? "page" : undefined}
              >
                {item.label}
              </button>
            ) : (
              <span className="breadcrumb-current">{item.label}</span>
            )}
            {idx < items.length - 1 && <span className="breadcrumb-sep">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ── Undo/Redo Hook ──────────────────────────────────────
function useUndoRedo(initialValue) {
  const [state, setState] = useState(initialValue);
  const [history, setHistory] = useState([initialValue]);
  const [historyIdx, setHistoryIdx] = useState(0);

  const updateState = React.useCallback((newValue) => {
    setState(newValue);
    setHistory((h) => [...h.slice(0, historyIdx + 1), newValue]);
    setHistoryIdx((i) => i + 1);
  }, [historyIdx]);

  const undo = React.useCallback(() => {
    if (historyIdx > 0) {
      const newIdx = historyIdx - 1;
      setState(history[newIdx]);
      setHistoryIdx(newIdx);
    }
  }, [historyIdx, history]);

  const redo = React.useCallback(() => {
    if (historyIdx < history.length - 1) {
      const newIdx = historyIdx + 1;
      setState(history[newIdx]);
      setHistoryIdx(newIdx);
    }
  }, [historyIdx, history]);

  const canUndo = historyIdx > 0;
  const canRedo = historyIdx < history.length - 1;

  return { state, updateState, undo, redo, canUndo, canRedo };
}

// ── Accessibility Utilities ──────────────────────────────────
function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handler = (e) => {
      // Don't intercept if user is typing inside an input, textarea, or editable element
      const isInput =
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable;

      if (isInput) return;

      Object.entries(shortcuts).forEach(([key, callback]) => {
        // Format: "ctrl+s", "alt+n", "shift+d", etc.
        const [ctrl, alt, shift, char] = [
          key.includes("ctrl"),
          key.includes("alt"),
          key.includes("shift"),
          key.split("+").pop()
        ];
        
        if (
          e.ctrlKey === ctrl &&
          e.altKey === alt &&
          e.shiftKey === shift &&
          e.key.toLowerCase() === char.toLowerCase()
        ) {
          e.preventDefault();
          callback();
        }
      });
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}

// ── Global Toast Context ──────────────────────────────────
const ToastContext = React.createContext(null);
function useToast() {
  return React.useContext(ToastContext);
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const addToast = React.useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3500,
    );
  }, []);
  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === "success" && <CheckCircle size={16} />}
            {t.type === "error" && <AlertCircle size={16} />}
            {t.type === "info" && <Info size={16} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content confirm-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Red danger strip */}
        <div className="confirm-danger-strip">
          <div className="confirm-icon-wrap">
            <div className="confirm-icon-ring" />
            <Trash2 size={30} />
          </div>
        </div>

        <div className="confirm-body">
          <h3>Confirm Deletion</h3>
          <p className="confirm-message">{message}</p>
          <p className="confirm-warn">⚠ This action cannot be undone.</p>

          <div className="confirm-actions">
            <button className="confirm-btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button className="confirm-btn-delete" onClick={onConfirm}>
              <Trash2 size={16} /> Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [prevTab, setPrevTab] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMember, setEditingMember] = useState(null);
  const [pwdMembers, setPwdMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importSummary, setImportSummary] = useState({
    isOpen: false,
    results: null,
  });
  const [confirmModal, setConfirmModal] = useState(null);
  const [view, setView] = useState("dashboard");
  const [lastSynced, setLastSynced] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printMembers, setPrintMembers] = useState([]);
  const [printFilterLabel, setPrintFilterLabel] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [importPreview, setImportPreview] = useState({
    isOpen: false,
    data: [],
  });
  const [settings, setSettings] = useState({
    active_pattern: "03-1412",
    expired_patterns: "03-1402, 03-14-02",
    expiry_threshold: "2",
    items_per_page: "10",
    visible_columns: "name,id,status,birthday,contact,address",
    theme: "emerald",
    mapping_name: "name,pangalan,member,full name",
    mapping_id: "pwd id,pwd,id number,id,control,numero,number,no.",
    mapping_birthday: "birthday,b-day,birth,kapanganakan",
    mapping_status: "status,kalagayan",
    mapping_contact: "contact,phone,cellphone,mobile,telepono",
    mapping_address: "address,tirahan,lokasyon,baranggay,brgy",
    backup_frequency: "weekly",
    backup_path: "C:\\PWD_Backups",
  });
  const toast = useToast();

  // Wire up copy-id-toast event from table rows
  useEffect(() => {
    const handler = (e) => toast(`ID copied: ${e.detail}`, "success");
    document.addEventListener("copy-id-toast", handler);
    return () => document.removeEventListener("copy-id-toast", handler);
  }, [toast]);

  // Apply theme to body
  useEffect(() => {
    document.body.className = settings.theme || "emerald";
  }, [settings.theme]);

  // On mount: verify existing session, then load data
  useEffect(() => {
    loadMembers();
    loadSettings();
    loadActivityLog();
  }, []);


  const loadSettings = async () => {
    try {
      const data = await api.fetchSettings();
      if (data) {
        setSettings((prev) => ({
          ...prev,
          ...data,
          // Ensure defaults for core settings if they are missing in data
          active_pattern: data.active_pattern || "03-1412",
          expired_patterns: data.expired_patterns || "03-1402, 03-14-02",
          expiry_threshold: data.expiry_threshold || "2",
          items_per_page: data.items_per_page || "10",
          visible_columns: data.visible_columns || "name,id,status,birthday,contact,address",
          theme: data.theme || "emerald",
          backup_frequency: data.backup_frequency || "weekly",
          backup_path: data.backup_path || "C:\\PWD_Backups",
        }));
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  const getIDStatus = (id) => {
    if (!id || !settings) return { label: "Expired", color: "#f59e0b" };
    const cleanId = String(id).trim();

    if (cleanId.startsWith(settings.active_pattern)) {
      return { label: "Active", color: "#10b981" };
    }

    return { label: "Expired", color: "#f59e0b" };
  };

  const loadMembers = async (search = "") => {
    try {
      setLoading(true);
      const data = await api.fetchMembers(search);
      setPwdMembers(data);
      setLastSynced(new Date());
      setError(null);
    } catch (err) {
      console.error("Failed to load members:", err);
      setError(
        "Could not connect to the database. Please make sure the server is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLog = async () => {
    try {
      const data = await api.fetchActivityLog();
      setActivityLog(data || []);
    } catch (err) {
      console.error("Failed to load activity log:", err);
    }
  };

  const logActivity = async (type, member) => {
    try {
      await api.createActivityLog({
        type,
        member_id: member.id,
        member_name: member.name || member.id,
      });
      await loadActivityLog();
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  };

  const navigateTo = (tab) => {
    setPrevTab(activeTab);
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    "ctrl+d": () => navigateTo("dashboard"),
    "ctrl+m": () => navigateTo("masterlist"),
    "ctrl+n": () => navigateTo("register"),
    "alt+a": () => navigateTo("audit"),
    "ctrl+,": () => navigateTo("settings"),
    "ctrl+/": () => {
      // Show help/shortcuts
      toast("Shortcuts: Ctrl+D (Dashboard), Ctrl+M (Masterlist), Ctrl+N (New), Alt+A (Audit), Ctrl+, (Settings)", "info");
    }
  });

  const handleAddMember = async (newMember) => {
    console.log("Saving member:", newMember);
    try {
      if (editingMember) {
        await api.updateMember(editingMember.id, newMember);
        logActivity("edit", { ...editingMember, ...newMember });
        setEditingMember(null);
        toast("Member updated successfully!", "success");
      } else {
        await api.createMember(newMember);
        logActivity("add", newMember);
        toast("New member added!", "success");
      }
      await loadMembers();
      navigateTo("masterlist");
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    navigateTo("register");
  };

  const handleToggleColumn = async (colId) => {
    const colsArray = (settings.visible_columns || "")
      .split(",")
      .filter((c) => c !== "");
    const newCols = colsArray.includes(colId)
      ? colsArray.filter((c) => c !== colId)
      : [...colsArray, colId];
    const newSettings = { ...settings, visible_columns: newCols.join(",") };
    try {
      await api.updateSettings(newSettings);
      setSettings(newSettings);
    } catch (err) {
      console.error("Failed to toggle column:", err);
    }
  };

  const handleDeleteMember = (id) => {
    const memberToDelete = pwdMembers.find((m) => m.id === id);
    setConfirmModal({
      message: `Permanently remove member with ID: ${id}?`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await api.deleteMember(id);
          logActivity("delete", memberToDelete || { id, name: id });
          await loadMembers();
          toast("Member deleted.", "info");
        } catch (err) {
          toast(err.message, "error");
        }
      },
    });
  };

  const exportToCSV = () => {
    // Use the first alias from each mapping as the export column header
    const getHeader = (mappingKey, fallback) => {
      const raw = settings[mappingKey];
      if (raw) {
        const first = raw
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s)[0];
        if (first) return first; // Removed .toUpperCase() to respect user casing
      }
      return fallback;
    };

    const headers = [
      getHeader("mapping_id", "ID"),
      getHeader("mapping_name", "Name"),
      getHeader("mapping_birthday", "Birthday"),
      getHeader("mapping_status", "Status"),
      getHeader("mapping_contact", "Contact"),
      getHeader("mapping_address", "Address"),
    ];
    const rows = pwdMembers.map((m) => [
      `"${(m.id || "").replace(/"/g, '""')}"`,
      `"${(m.name || "").replace(/"/g, '""')}"`,
      `"${(m.birthday || "").replace(/"/g, '""')}"`,
      `"${(m.status || "").replace(/"/g, '""')}"`,
      `"${(m.contact || "").replace(/"/g, '""')}"`,
      `"${(m.address || "").replace(/"/g, '""')}"`,
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `PWD_Masterlist_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMassDelete = (ids) => {
    setConfirmModal({
      message: `Delete ${ids.length} selected member${ids.length > 1 ? "s" : ""}? This cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await api.bulkDelete(ids);
          await loadMembers();
          toast(
            `${ids.length} member${ids.length > 1 ? "s" : ""} deleted.`,
            "info",
          );
        } catch (err) {
          toast(err.message, "error");
        }
      },
    });
  };

  const handleImportExcel = (importedMembers) => {
    if (importedMembers.length === 0) {
      toast("No members found in the spreadsheet.", "error");
      return;
    }
    setImportPreview({ isOpen: true, data: importedMembers });
  };

  const finalizeImport = async (cleanData) => {
    setImportPreview({ isOpen: false, data: [] });
    if (cleanData.length === 0) return;

    try {
      setLoading(true);
      const existingMembersMap = new Map(
        pwdMembers.map((m) => [String(m.id).trim(), m.name]),
      );
      let newCount = 0;
      let updatedCount = 0;
      const seenInBatch = new Map();
      let fileDuplicates = 0;
      const updatedMembers = [];
      const fileDuplicateList = [];

      const membersToImport = cleanData.map((m) => {
        const id = String(m.id).trim();
        const name = (m.name || "").trim();

        if (seenInBatch.has(id)) {
          fileDuplicates++;
          fileDuplicateList.push({ id, name, firstName: seenInBatch.get(id) });
        } else {
          seenInBatch.set(id, name);
          if (existingMembersMap.has(id)) {
            updatedCount++;
            updatedMembers.push({
              id,
              name,
              oldName: existingMembersMap.get(id),
            });
          } else {
            newCount++;
          }
        }

        return {
          id,
          name: name.trim(),
          birthday: m.birthday || "",
          status: m.status || "Active",
          contact: m.contact || "",
          address: m.address || "",
        };
      });

      const res = await api.importMembers(membersToImport);
      await loadMembers();

      setImportSummary({
        isOpen: true,
        results: {
          total: cleanData.length,
          new: newCount,
          updated: updatedCount,
          duplicates: fileDuplicates,
          updatedList: updatedMembers,
          duplicateList: fileDuplicateList,
        },
      });
      toast(`Successfully imported ${cleanData.length} records.`, "success");
    } catch (err) {
      toast(`Import failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  // Search logic
  const filteredMembers = pwdMembers.filter((m) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.id && m.id.toLowerCase().includes(q)) ||
      (m.contact && m.contact.toLowerCase().includes(q)) ||
      (m.address && m.address.toLowerCase().includes(q))
    );
  });

  const activeCount = pwdMembers.filter(
    (m) => getIDStatus(m.id).label === "Active",
  ).length;
  const expiredCount = pwdMembers.filter(
    (m) => getIDStatus(m.id).label !== "Active",
  ).length;

  return (
    <div className="layout">
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo-box">
            <img
              src={samakameLogo}
              alt="SAMAKAME Logo"
              className="sidebar-logo-img"
            />
          </div>
          <div className="logo-text">
            <span>City of Meycauayan</span>
            <h2>PWD Masterlist</h2>
          </div>
        </div>

        <nav className="nav-menu" aria-label="Main navigation">
          <button
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => navigateTo("dashboard")}
            aria-current={activeTab === "dashboard" ? "page" : undefined}
            aria-label="Go to Dashboard (Ctrl+D)"
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-item ${activeTab === "masterlist" ? "active" : ""}`}
            onClick={() => navigateTo("masterlist")}
            aria-current={activeTab === "masterlist" ? "page" : undefined}
            aria-label={`Go to Masterlist (Ctrl+M) - ${pwdMembers.length} members`}
          >
            <Users size={20} />
            <span>Masterlist</span>
            {!loading && pwdMembers.length > 0 && (
              <span className="nav-badge">{pwdMembers.length}</span>
            )}
          </button>
          <button
            className={`nav-item ${activeTab === "register" ? "active" : ""}`}
            onClick={() => navigateTo("register")}
            aria-current={activeTab === "register" ? "page" : undefined}
            aria-label="Add a new member (Ctrl+N)"
          >
            <UserPlus size={20} />
            <span>Add Member</span>
          </button>
          <button
            className={`nav-item ${activeTab === "audit" ? "active" : ""}`}
            onClick={() => navigateTo("audit")}
            aria-current={activeTab === "audit" ? "page" : undefined}
            aria-label="View activity audit trail (Alt+A)"
          >
            <Activity size={20} />
            <span>Audit Trail</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => navigateTo("settings")}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content" id="main-content" role="main">
        <header className="top-bar">
          {/* Hamburger — mobile only */}
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
          {activeTab === "masterlist" ? (
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search ID or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button
                  className="search-clear-btn"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ) : (
            <div className="top-bar-page-title">
              {activeTab === "dashboard" && (
                <>
                  <LayoutDashboard size={18} /> <span>Dashboard</span>
                </>
              )}
              {activeTab === "register" && (
                <>
                  <UserPlus size={18} />{" "}
                  <span>{editingMember ? "Edit Member" : "Add Member"}</span>
                </>
              )}
              {activeTab === "audit" && (
                <>
                  <Activity size={18} /> <span>Audit Trail</span>
                </>
              )}
              {activeTab === "settings" && (
                <>
                  <Settings size={18} /> <span>Settings</span>
                </>
              )}
            </div>
          )}

          <div className="top-bar-actions" />
        </header>

        {/* Breadcrumb Navigation */}
        <Breadcrumb
          items={[
            { label: "PWD Masterlist", onClick: () => navigateTo("dashboard") },
            {
              label:
                activeTab === "dashboard"
                  ? "Dashboard"
                  : activeTab === "masterlist"
                    ? "Masterlist"
                    : activeTab === "register"
                      ? "Add Member"
                      : activeTab === "audit"
                        ? "Audit Trail"
                        : activeTab === "settings"
                          ? "Settings"
                          : "Unknown",
            },
          ]}
        />

        <div className="page-content">
          {loading && (
            <div className="skeleton-page">
              <div className="skeleton-header">
                <div className="skel skel-title" />
                <div className="skel skel-btn" />
              </div>
              <div className="skeleton-table">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="skeleton-row"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <div className="skel skel-check" />
                    <div className="skel skel-name" />
                    <div className="skel skel-id" />
                    <div className="skel skel-badge" />
                    <div className="skel skel-date" />
                    <div className="skel skel-btn-sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {error && <div className="error-banner">{error}</div>}

          {activeTab === "dashboard" && !loading && !error && (
            <div className="page-transition view-morpher" key="dashboard">
              <Dashboard
                members={pwdMembers}
                onViewAll={() => navigateTo("masterlist")}
                onAddMember={() => navigateTo("register")}
                onExport={exportToCSV}
                onImportClick={() =>
                  document.getElementById("dash-import-input").click()
                }
                getIDStatus={getIDStatus}
                lastSynced={lastSynced}
                activityLog={activityLog}
                onMemberClick={(memberName) => {
                  setSearchQuery(memberName);
                  navigateTo("masterlist");
                }}
              />
              <input
                id="dash-import-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const data = new Uint8Array(ev.target.result);
                    const wb = XLSX.read(data, {
                      type: "array",
                      cellDates: true,
                    });
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    handleImportExcel(
                      rows.slice(1).map((r) => ({
                        id: r[0],
                        name: r[1],
                        birthday: r[2],
                        status: r[3],
                        contact: r[4],
                        address: r[5],
                      })),
                    );
                  };
                  reader.readAsArrayBuffer(file);
                  e.target.value = "";
                }}
              />
            </div>
          )}
          {activeTab === "masterlist" && !loading && !error && (
            <div className="page-transition view-morpher" key="masterlist">
              {filteredMembers.length === 0 ? (
                <EmptyState
                  title="No Members Found"
                  message={searchQuery ? "No members match your search. Try a different query." : "No PWD members in the system yet. Add one to get started!"}
                  icon={Users}
                  action={
                    !searchQuery
                      ? { label: "Add First Member", onClick: () => navigateTo("register") }
                      : null
                  }
                />
              ) : (
                <Masterlist
                  members={filteredMembers}
                  onDelete={handleDeleteMember}
                  onMassDelete={handleMassDelete}
                  onEdit={handleEditMember}
                  onExport={exportToCSV}
                  onImport={handleImportExcel}
                  getIDStatus={getIDStatus}
                  itemsPerPageSetting={parseInt(settings.items_per_page)}
                  visibleColumns={settings.visible_columns.split(",")}
                  columnMappings={settings}
                  onToggleColumn={handleToggleColumn}
                  searchQuery={searchQuery}
                  onRequestPrint={(members, label) => {
                    setPrintMembers(members);
                    setPrintFilterLabel(label || null);
                    setShowPrintModal(true);
                  }}
                />
              )}
            </div>
          )}
          {activeTab === "register" && (
            <div className="page-transition view-morpher" key="register">
              <RegistrationForm
                onSubmit={handleAddMember}
                onCancel={() => {
                  navigateTo("masterlist");
                  setEditingMember(null);
                }}
                initialData={editingMember}
                existingMembers={pwdMembers}
                settings={settings}
                getIDStatus={getIDStatus}
              />
            </div>
          )}
          {activeTab === "audit" && (
            <div className="page-transition view-morpher" key="audit">
              <AuditTrailView log={activityLog} />
            </div>
          )}
          {activeTab === "settings" && (
            <div className="page-transition view-morpher" key="settings">
              <SettingsView
                settings={settings}
                activeTab={activeTab}
                memberCount={pwdMembers.length}
                onSave={async (newSettings) => {
                  try {
                    await api.updateSettings(newSettings);
                    setSettings(newSettings);
                    toast("Settings saved successfully!", "success");
                  } catch (err) {
                    toast("Failed to save settings: " + err.message, "error");
                  }
                }}
                onToast={toast}
                onRefreshMembers={loadMembers}
              />
            </div>
          )}

          {importSummary.isOpen && (
            <ImportSummaryModal
              results={importSummary.results}
              onClose={() => setImportSummary({ isOpen: false, results: null })}
            />
          )}
          {importPreview.isOpen && (
            <ImportPreviewModal
              data={importPreview.data}
              existingMembers={pwdMembers}
              onConfirm={finalizeImport}
              onCancel={() => setImportPreview({ isOpen: false, data: [] })}
            />
          )}
          {confirmModal && (
            <ConfirmModal
              message={confirmModal.message}
              onConfirm={confirmModal.onConfirm}
              onCancel={() => setConfirmModal(null)}
            />
          )}
          {showPrintModal && (
            <PrintModal
              members={printMembers}
              filterLabel={printFilterLabel}
              getIDStatus={getIDStatus}
              onClose={() => setShowPrintModal(false)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// Color map for disability type avatar rings
const DISABILITY_COLORS = {
  Orthopedic: { bg: "#dbeafe", ring: "#3b82f6", text: "#1d4ed8" }, // Blue
  Visual: { bg: "#fae8ff", ring: "#a21caf", text: "#7e22ce" }, // Purple
  Hearing: { bg: "#fef9c3", ring: "#ca8a04", text: "#a16207" }, // Yellow
  "Mental/Psycho": { bg: "#fee2e2", ring: "#ef4444", text: "#b91c1c" }, // Red
  "Chronic Illness": { bg: "#dcfce7", ring: "#16a34a", text: "#15803d" }, // Green
  Speech: { bg: "#ffedd5", ring: "#ea580c", text: "#c2410c" }, // Orange
  Learning: { bg: "#e0f2fe", ring: "#0284c7", text: "#0369a1" }, // Sky
};

function getAvatarStyle(disabilityType) {
  return (
    DISABILITY_COLORS[disabilityType] || {
      bg: "#f1f5f9",
      ring: "#94a3b8",
      text: "#64748b",
    }
  );
}

function useCountUp(target, duration = 800) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(null);

  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;

    // For 0, just set and exit
    if (target === 0) {
      setCount(0);
      return;
    }

    // For non-zero, let's animate
    let startTime = null;
    const initialCount = count;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);

      const nextCount = Math.floor(
        initialCount + (target - initialCount) * percentage,
      );
      setCount(nextCount);

      if (percentage < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return count;
}

function relativeTime(isoString) {
  const diff = Math.floor((new Date() - new Date(isoString)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function AuditTrailView({ log }) {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState(null); // Single selection or null for all

  // 1. Calculate Summary Stats
  const now = new Date();
  const last24h = log.filter((e) => now - new Date(e.timestamp) < 86400000);
  const additions = log.filter((e) => e.type === "add").length;
  const updates = log.filter((e) => e.type === "edit").length;
  const deletions = log.filter((e) => e.type === "delete").length;
  const velocity = last24h.length;

  // 2. Filter & Search Logic
  const filteredLog = log.filter((entry) => {
    const matchesSearch =
      (entry.member_name || "").toLowerCase().includes(query.toLowerCase()) ||
      (entry.member_id || "").toLowerCase().includes(query.toLowerCase()) ||
      (entry.type || "").toLowerCase().includes(query.toLowerCase());
    const matchesType = selectedType === null || entry.type === selectedType;
    return matchesSearch && matchesType;
  });

  const toggleType = (type) => {
    // If clicking the same type, deselect it (show all)
    // Otherwise, select the new type
    setSelectedType(selectedType === type ? null : type);
  };

  const getLogIcon = (type) => {
    switch (type) {
      case "add":
        return <UserPlus size={14} />;
      case "edit":
        return <Edit size={14} />;
      case "delete":
        return <Trash2 size={14} />;
      case "import":
        return <Upload size={14} />;
      default:
        return <Activity size={14} />;
    }
  };

  const getLogBadgeClass = (type) => {
    switch (type) {
      case "add":
        return "audit-badge-add";
      case "edit":
        return "audit-badge-edit";
      case "delete":
        return "audit-badge-delete";
      case "import":
        return "audit-badge-import";
      default:
        return "audit-badge-default";
    }
  };

  const getActionLabel = (type) => {
    switch (type) {
      case "add":
        return "Added";
      case "edit":
        return "Updated";
      case "delete":
        return "Removed";
      case "import":
        return "Imported";
      default:
        return type.toUpperCase();
    }
  };

  const getActionColor = (type) => {
    switch (type) {
      case "add":
        return "#10b981";
      case "edit":
        return "#f59e0b";
      case "delete":
        return "#f43f5e";
      case "import":
        return "#6366f1";
      default:
        return "#64748b";
    }
  };

  return (
    <div className="audit-view-modern page-transition">
      <div className="audit-modern-header">
        <div className="audit-header-left">
          <div className="audit-header-icon">
            <Shield size={24} />
          </div>
          <div>
            <h2>Activity Log</h2>
            <p>System modifications and events</p>
          </div>
        </div>
      </div>

      {/* Compact Stats Row */}
      <div className="audit-stats-row">
        <div className="audit-mini-stat">
          <div className="mini-stat-icon" style={{ color: "#0d9488" }}>
            <Activity size={16} />
          </div>
          <div className="mini-stat-info">
            <span className="mini-stat-value">{velocity}</span>
            <span className="mini-stat-label">Last 24h</span>
          </div>
        </div>
        <div className="audit-mini-stat">
          <div className="mini-stat-icon" style={{ color: "#10b981" }}>
            <UserPlus size={16} />
          </div>
          <div className="mini-stat-info">
            <span className="mini-stat-value">{additions}</span>
            <span className="mini-stat-label">Added</span>
          </div>
        </div>
        <div className="audit-mini-stat">
          <div className="mini-stat-icon" style={{ color: "#f59e0b" }}>
            <Edit size={16} />
          </div>
          <div className="mini-stat-info">
            <span className="mini-stat-value">{updates}</span>
            <span className="mini-stat-label">Updated</span>
          </div>
        </div>
        <div className="audit-mini-stat">
          <div className="mini-stat-icon" style={{ color: "#f43f5e" }}>
            <Trash2 size={16} />
          </div>
          <div className="mini-stat-info">
            <span className="mini-stat-value">{deletions}</span>
            <span className="mini-stat-label">Removed</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="audit-controls-modern">
        <div className="audit-search-modern">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, ID, or action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="audit-filters-modern">
          {[
            { id: "add", label: "Added", icon: <UserPlus size={12} /> },
            { id: "edit", label: "Updated", icon: <Edit size={12} /> },
            { id: "delete", label: "Removed", icon: <Trash2 size={12} /> },
            { id: "import", label: "Imported", icon: <Upload size={12} /> },
          ].map((f) => (
            <button
              key={f.id}
              className={`filter-btn-modern ${selectedType === f.id ? "active" : ""}`}
              onClick={() => toggleType(f.id)}
            >
              {f.icon}
              <span>{f.label}</span>
            </button>
          ))}
        </div>

        {(query || selectedType) && (
          <button
            className="filter-reset-modern"
            onClick={() => {
              setQuery("");
              setSelectedType(null);
            }}
            title="Clear filters"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {/* Activity List */}
      <div className="audit-list-modern">
        {filteredLog.length === 0 ? (
          <div className="audit-empty-v2">
            <Archive size={32} strokeWidth={1.5} />
            <h3>No matches</h3>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          <div className="audit-items-list">
            {filteredLog.map((entry, i) => (
              <div
                key={entry.id || i}
                className="audit-item-modern"
                style={{
                  animationDelay: `${Math.min(i * 0.04, 0.8)}s`,
                  borderLeftColor: getActionColor(entry.type),
                }}
              >
                <div className="item-marker">
                  <div
                    className="item-icon"
                    style={{
                      color: getActionColor(entry.type),
                      background: `${getActionColor(entry.type)}15`,
                    }}
                  >
                    {getLogIcon(entry.type)}
                  </div>
                </div>

                <div className="item-content">
                  <div className="item-header">
                    <div className="item-action">
                      <span
                        className={`action-badge ${getLogBadgeClass(entry.type)}`}
                      >
                        {getActionLabel(entry.type)}
                      </span>
                      <span className="item-target">
                        {entry.member_name || "System Action"}
                      </span>
                      {entry.member_id && (
                        <span className="item-id">{entry.member_id}</span>
                      )}
                    </div>
                    <span className="item-time">
                      {relativeTime(entry.timestamp)}
                    </span>
                  </div>
                  {entry.type === "edit" && (
                    <div className="item-note">
                      Database synchronized with local storage
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Dashboard({
  members,
  onViewAll,
  onAddMember,
  onExport,
  onImportClick,
  getIDStatus,
  lastSynced,
  activityLog = [],
  onMemberClick,
}) {
  const [showSeniorsModal, setShowSeniorsModal] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [showNearSeniorsModal, setShowNearSeniorsModal] = useState(false);
  const today = new Date();
  const currentMonth = today.getMonth() + 1;

  // Calculate age from birthday
  const calculateAge = (birthday) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    if (isNaN(birthDate.getTime())) return null;
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const birthdaysThisMonth = members
    .filter((m) => {
      if (!m.birthday) return false;
      return new Date(m.birthday).getMonth() + 1 === currentMonth;
    })
    .sort(
      (a, b) => new Date(a.birthday).getDate() - new Date(b.birthday).getDate(),
    );

  const expiredCount = members.filter(
    (m) => getIDStatus(m.id).label === "Expired",
  ).length;
  const activeCount = members.filter(
    (m) => getIDStatus(m.id).label === "Active",
  ).length;

  // Calculate near-seniors (age 59 - turning senior soon)
  const nearSeniorMembers = members
    .filter((m) => {
      const age = calculateAge(m.birthday);
      return age === 59;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const nearSeniorCount = nearSeniorMembers.length;

  // Calculate seniors (age 60+)
  const seniorMembers = members
    .filter((m) => {
      const age = calculateAge(m.birthday);
      return age !== null && age >= 60;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const seniorCount = seniorMembers.length;

  // Calculate expired members
  const expiredMembers = members
    .filter((m) => getIDStatus(m.id).label === "Expired")
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalCount = useCountUp(members.length);
  const activeAnim = useCountUp(activeCount);
  const expAnim = useCountUp(expiredCount);
  const nearSeniorAnim = useCountUp(nearSeniorCount);
  const seniorAnim = useCountUp(seniorCount);
  const bdayCount = useCountUp(birthdaysThisMonth.length);

  const syncLabel = lastSynced
    ? (() => {
        const diff = Math.floor((new Date() - lastSynced) / 1000);
        if (diff < 60) return "just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
      })()
    : null;

  const isTodayBirthday = (bday) => {
    const d = new Date(bday);
    return d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  };
  const isTomorrowBirthday = (bday) => {
    const d = new Date(bday);
    const tom = new Date(today);
    tom.setDate(today.getDate() + 1);
    return d.getMonth() === tom.getMonth() && d.getDate() === tom.getDate();
  };

  const monthName = today.toLocaleString("default", { month: "long" });

  return (
    <div className="dashboard dashboard-v2">
      {/* ── Top strip: greeting + sync badge + quick actions ── */}
      <div className="dash-topstrip">
        <div className="dash-greeting">
          <h1>Dashboard</h1>
          {syncLabel && <span className="sync-pill">⟳ Synced {syncLabel}</span>}
        </div>
        <div className="dash-pills">
          <button className="dash-pill primary" onClick={onAddMember}>
            <UserPlus size={14} /> Add Member
          </button>
          <button className="dash-pill" onClick={onImportClick}>
            <Upload size={14} /> Import
          </button>
          <button className="dash-pill" onClick={onExport}>
            <Download size={14} /> Export
          </button>
          <button className="dash-pill" onClick={onViewAll}>
            <Users size={14} /> Masterlist
          </button>
        </div>
      </div>

      {/* ── Main 2-column body ── */}
      <div className="dash-body">
        {/* LEFT: Stats */}
        <div className="dash-left">
          <div className="dash-stats-grid">
            <div className="dash-stat emerald">
              <div className="ds-icon">
                <Users size={20} color="white" />
              </div>
              <div className="ds-info">
                <span className="ds-val">{totalCount}</span>
                <span className="ds-label">Total PWDs</span>
              </div>
            </div>
            <div className="dash-stat blue">
              <div className="ds-icon">
                <CheckCircle size={20} color="white" />
              </div>
              <div className="ds-info">
                <span className="ds-val">{activeAnim}</span>
                <span className="ds-label">Active</span>
              </div>
            </div>
            <div
              className="dash-stat red clickable"
              onClick={() => {
                setShowSeniorsModal(false);
                setShowExpiredModal(true);
                setShowNearSeniorsModal(false);
              }}
              style={{ cursor: "pointer" }}
            >
              <div className="ds-icon">
                <AlertCircle size={20} color="white" />
              </div>
              <div className="ds-info">
                <span className="ds-val">{expAnim}</span>
                <span className="ds-label">Expired IDs</span>
              </div>
            </div>
            <div
              className="dash-stat amber clickable"
              onClick={() => {
                setShowSeniorsModal(false);
                setShowExpiredModal(false);
                setShowNearSeniorsModal(true);
              }}
              style={{ cursor: "pointer" }}
            >
              <div className="ds-icon" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                <Hourglass size={20} color="white" />
              </div>
              <div className="ds-info">
                <span className="ds-val">{nearSeniorAnim}</span>
                <span className="ds-label">Turning Senior (59)</span>
              </div>
            </div>
            <div
              className="dash-stat purple clickable"
              onClick={() => {
                setShowSeniorsModal(true);
                setShowExpiredModal(false);
                setShowNearSeniorsModal(false);
              }}
              style={{ cursor: "pointer" }}
            >
              <div className="ds-icon">
                <Users size={20} color="white" />
              </div>
              <div className="ds-info">
                <span className="ds-val">{seniorAnim}</span>
                <span className="ds-label">Seniors (60+)</span>
              </div>
            </div>
          </div>

          {/* Age Distribution Chart */}
          <div className="dash-ratio-card card mt-6">
            <div className="ratio-header">
              <span className="ratio-title">Age Distribution</span>
              <span className="ratio-total">Demographics</span>
            </div>
            <AgeChart members={members} />
          </div>
        </div>

        {/* ── Activity Feed panel (Mini-Timeline) ── */}
        <div className="card activity-feed-v2">
          <div className="af-header">
            <span className="af-title">System Activity Log</span>
            <span className="af-subtitle">Live system event monitoring</span>
          </div>
          {activityLog.length === 0 ? (
            <div className="af-empty-v2">
              <ShieldCheck size={32} opacity={0.3} />
              <p>No system activity detected.</p>
            </div>
          ) : (
            <div className="af-list-v2">
              {activityLog.slice(0, 5).map((entry, i) => (
                <div key={i} className="af-item-v2">
                  <div className="af-marker-v2">
                    <div className={`af-bullet-v2 ${entry.type}`}>
                      {entry.type === "add" && <UserPlus size={12} />}
                      {entry.type === "edit" && <Edit size={12} />}
                      {entry.type === "delete" && <Trash2 size={12} />}
                      {entry.type === "import" && <Upload size={12} />}
                    </div>
                    {i < 4 && <div className="af-line-v2" />}
                  </div>
                  <div className="af-content-v2">
                    <div className="af-top-v2">
                      <span className="af-name-v2">
                        {entry.member_name || "System Level Action"}
                      </span>
                      <span className="af-time-v2">
                        {relativeTime(entry.timestamp)}
                      </span>
                    </div>
                    <div className="af-bottom-v2">
                      <span className={`af-badge-v2 af-type-${entry.type}`}>
                        {entry.type === "add"
                          ? "Newly Registered"
                          : entry.type === "edit"
                            ? "Profile Modified"
                            : entry.type === "delete"
                              ? "Record Removed"
                              : "Data Imported"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-right card">
          <div className="bday-list-header">
            <div className="bday-list-title">
              <Calendar size={18} />
              <span>{monthName} Birthdays</span>
            </div>
            <span className="bday-list-count">
              {bdayCount} celebrant{bdayCount !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="bday-list-scroll">
            {birthdaysThisMonth.length > 0 ? (
              birthdaysThisMonth.map((m) => {
                const d = new Date(m.birthday);
                const day = d.getDate();
                const mnth = d.toLocaleString("default", { month: "short" });
                const isToday = isTodayBirthday(m.birthday);
                const isTomorrow = isTomorrowBirthday(m.birthday);
                return (
                  <div
                    key={m.id}
                    className={`bday-row ${isToday ? "bday-row-today" : isTomorrow ? "bday-row-tomorrow" : ""}`}
                  >
                    <div
                      className={`bday-date-badge ${isToday ? "today" : isTomorrow ? "tomorrow" : ""}`}
                    >
                      <span className="bdg-day">{day}</span>
                      <span className="bdg-month">{mnth}</span>
                    </div>
                    <div className="bday-name">
                      <span className="bday-fullname">
                        {m.name || "Anonymous"}
                      </span>
                      {isToday && (
                        <span className="bday-chip today">🎂 Today!</span>
                      )}
                      {isTomorrow && (
                        <span className="bday-chip tomorrow">🎁 Tomorrow</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bday-empty">
                <Calendar size={36} color="var(--border)" />
                <p>No birthdays this month.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seniors Modal */}
      {showSeniorsModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowSeniorsModal(false)}
        >
          <div
            className="modal-content seniors-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "550px", padding: 0, overflow: "hidden" }}
          >
            {/* Header */}
            <div className="seniors-modal-header">
              <div className="seniors-modal-icon">
                <Users size={24} color="white" />
              </div>
              <div>
                <h2 className="seniors-modal-title">Seniors (60+)</h2>
                <p className="seniors-modal-subtitle">
                  {seniorCount} member{seniorCount !== 1 ? "s" : ""} aged 60
                  years and above
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="seniors-modal-content">
              {seniorMembers.length === 0 ? (
                <div className="seniors-modal-empty">
                  <Users size={48} opacity={0.2} />
                  <p>No seniors in the system yet.</p>
                </div>
              ) : (
                <div className="seniors-list">
                  {seniorMembers.map((senior, idx) => {
                    const age = calculateAge(senior.birthday);
                    return (
                      <div key={senior.id} className="senior-item">
                        <div className="senior-number">{idx + 1}</div>
                        <div className="senior-info">
                          <div
                            className="senior-name"
                            style={{
                              cursor: "pointer",
                              color: "var(--primary)",
                            }}
                            onClick={() => {
                              onMemberClick(senior.name);
                              setShowSeniorsModal(false);
                            }}
                          >
                            {senior.name}
                          </div>
                          <div className="senior-meta">
                            <span>ID: {senior.id}</span>
                            {age && <span>•</span>}
                            {age && <span>{age} years old</span>}
                          </div>
                        </div>
                        <div className="senior-age-badge">{age} yrs</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="seniors-modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowSeniorsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expired Modal */}
      {showExpiredModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowExpiredModal(false)}
        >
          <div
            className="modal-content status-modal expired-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "550px", padding: 0, overflow: "hidden" }}
          >
            {/* Header */}
            <div className="status-modal-header expired-header">
              <div className="status-modal-icon expired-icon">
                <AlertCircle size={24} color="white" />
              </div>
              <div>
                <h2 className="status-modal-title">Expired IDs</h2>
                <p className="status-modal-subtitle">
                  {expiredMembers.length} member
                  {expiredMembers.length !== 1 ? "s" : ""} with expired ID
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="status-modal-content">
              {expiredMembers.length === 0 ? (
                <div className="status-modal-empty">
                  <AlertCircle size={48} opacity={0.2} />
                  <p>No expired IDs in the system.</p>
                </div>
              ) : (
                <div className="status-list">
                  {expiredMembers.map((member, idx) => (
                    <div key={member.id} className="status-item">
                      <div className="status-number">{idx + 1}</div>
                      <div className="status-info">
                        <div
                          className="status-name"
                          style={{ cursor: "pointer", color: "var(--primary)" }}
                          onClick={() => {
                            onMemberClick(member.name);
                            setShowExpiredModal(false);
                          }}
                        >
                          {member.name}
                        </div>
                        <div className="status-meta">
                          <span>ID: {member.id}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="status-modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowExpiredModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Turning Senior (Age 59) Modal */}
      {showNearSeniorsModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowNearSeniorsModal(false)}
        >
          <div
            className="modal-content status-modal near-senior-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "550px", padding: 0, overflow: "hidden" }}
          >
            {/* Header */}
            <div className="status-modal-header near-senior-header">
              <div className="status-modal-icon near-senior-icon">
                <Hourglass size={24} color="white" />
              </div>
              <div>
                <h2 className="status-modal-title">Turning Senior (Age 59)</h2>
                <p className="status-modal-subtitle">
                  {nearSeniorMembers.length} member
                  {nearSeniorMembers.length !== 1 ? "s" : ""} nearing senior
                  citizenship (age 60)
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="status-modal-content">
              {nearSeniorMembers.length === 0 ? (
                <div className="status-modal-empty">
                  <Hourglass size={48} opacity={0.2} />
                  <p>No members currently aged 59 in the system.</p>
                </div>
              ) : (
                <div className="status-list">
                  {nearSeniorMembers.map((member, idx) => (
                    <div key={member.id} className="status-item">
                      <div className="status-number">{idx + 1}</div>
                      <div className="status-info">
                        <div
                          className="status-name"
                          style={{ cursor: "pointer", color: "var(--primary)" }}
                          onClick={() => {
                            onMemberClick(member.name);
                            setShowNearSeniorsModal(false);
                          }}
                        >
                          {member.name}
                        </div>
                        <div className="status-meta">
                          <span>ID: {member.id}</span>
                          {member.birthday && (
                            <span>
                              Birthday: {new Date(member.birthday).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} (59 yrs)
                            </span>
                          )}
                          {member.contact && <span>Contact: {member.contact}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="status-modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowNearSeniorsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ImportPreviewModal({ data, onConfirm, onCancel, existingMembers }) {
  const [processedData, setProcessedData] = useState([]);

  useEffect(() => {
    const validated = data.map((item) => {
      const isDuplicate = existingMembers.some(
        (m) => String(m.id).trim() === String(item.id).trim(),
      );
      const hasInvalidDate =
        item.birthday && isNaN(new Date(item.birthday).getTime());

      let status = "valid";
      let message = "Ready to import";

      if (isDuplicate) {
        status = "duplicate";
        message = "ID already exists (Update)";
      } else if (hasInvalidDate) {
        status = "error";
        message = "Invalid date format";
      }

      return { ...item, status, message };
    });
    setProcessedData(validated);
  }, [data, existingMembers]);

  const validCount = processedData.filter((d) => d.status !== "error").length;
  const errorCount = processedData.length - validCount;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content import-preview-modal"
        style={{ maxWidth: "900px", padding: 0, overflow: "hidden" }}
      >
        <div
          className="modal-header"
          style={{
            padding: "1.5rem",
            borderBottom: "1px solid var(--border)",
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <FileSpreadsheet className="text-teal-600" size={24} />
                Import Data Staging
              </h2>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  marginTop: "0.25rem",
                }}
              >
                Review and validate records before finalizing the institutional
                update.
              </p>
            </div>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                  }}
                >
                  Total
                </div>
                <div style={{ fontSize: "1.15rem", fontWeight: 700 }}>
                  {processedData.length}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#10b981",
                    textTransform: "uppercase",
                  }}
                >
                  Ready
                </div>
                <div
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    color: "#10b981",
                  }}
                >
                  {validCount}
                </div>
              </div>
              {errorCount > 0 && (
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      color: "#ef4444",
                      textTransform: "uppercase",
                    }}
                  >
                    Issues
                  </div>
                  <div
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 700,
                      color: "#ef4444",
                    }}
                  >
                    {errorCount}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ maxHeight: "420px", overflowY: "auto" }}>
          <table
            className="audit-table"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead
              style={{
                position: "sticky",
                top: 0,
                background: "#fff",
                zIndex: 10,
              }}
            >
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ padding: "0.75rem 1rem" }}>STATUS</th>
                <th style={{ padding: "0.75rem 1rem" }}>PWD ID</th>
                <th style={{ padding: "0.75rem 1rem" }}>FULL NAME</th>
                <th style={{ padding: "0.75rem 1rem" }}>BIRTHDAY</th>
                <th style={{ padding: "0.75rem 1rem" }}>SYSTEM ACTION</th>
              </tr>
            </thead>
            <tbody>
              {processedData.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    fontSize: "0.85rem",
                  }}
                >
                  <td style={{ padding: "1rem" }}>
                    {row.status === "valid" && (
                      <CheckCircle size={18} style={{ color: "#10b981" }} />
                    )}
                    {row.status === "duplicate" && (
                      <Info size={18} style={{ color: "#3b82f6" }} />
                    )}
                    {row.status === "error" && (
                      <AlertTriangle size={18} style={{ color: "#ef4444" }} />
                    )}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      fontFamily: "monospace",
                      fontWeight: 500,
                    }}
                  >
                    {row.id}
                  </td>
                  <td style={{ padding: "1rem", fontWeight: 600 }}>
                    {row.name}
                  </td>
                  <td style={{ padding: "1rem", color: "#64748b" }}>
                    {row.birthday
                      ? isNaN(new Date(row.birthday))
                        ? row.birthday
                        : new Date(row.birthday).toLocaleDateString()
                      : "—"}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        padding: "0.2rem 0.6rem",
                        borderRadius: "999px",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        background:
                          row.status === "valid"
                            ? "#dcfce7"
                            : row.status === "duplicate"
                              ? "#dbeafe"
                              : "#fee2e2",
                        color:
                          row.status === "valid"
                            ? "#166534"
                            : row.status === "duplicate"
                              ? "#1e40af"
                              : "#991b1b",
                      }}
                    >
                      {row.message}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className="modal-footer"
          style={{
            padding: "1.5rem",
            background: "#f8fafc",
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p
            style={{ fontSize: "0.75rem", color: "#94a3b8", maxWidth: "380px" }}
          >
            <ShieldCheck
              size={14}
              style={{
                display: "inline",
                marginRight: "4px",
                verticalAlign: "text-bottom",
              }}
            />
            Institutional Validation: Duplicate IDs will be updated with new
            names from the spreadsheet. Invalid birthdates will block those
            rows.
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn btn-secondary" onClick={onCancel}>
              Abort Import
            </button>
            <button
              className="btn btn-primary"
              onClick={() =>
                onConfirm(processedData.filter((d) => d.status !== "error"))
              }
              disabled={validCount === 0}
              style={{
                padding: "0.65rem 1.5rem",
                boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.2)",
              }}
            >
              <Download size={18} style={{ marginRight: "8px" }} />
              Finalize & Import {validCount} Records
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImportSummaryModal({ results, onClose }) {
  if (!results) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content summary-modal">
        <div className="summary-header">
          <div className="success-icon-anim">
            <CheckCircle size={64} color="#10b981" />
          </div>
          <h2>Import Successfully Finished!</h2>
          <p>All records have been processed and synced with the database.</p>
        </div>

        <div className="summary-stats">
          <div className="summary-card green">
            <span className="summary-val">{results.new}</span>
            <span className="summary-label">New Members</span>
          </div>
          <div className="summary-card orange">
            <span className="summary-val">{results.updated}</span>
            <span className="summary-label">Updated Records</span>
          </div>
          <div className="summary-card red">
            <span className="summary-val">{results.duplicates}</span>
            <span className="summary-label">File Duplicates</span>
          </div>
          <div className="summary-card gold">
            <span className="summary-val">{results.total}</span>
            <span className="summary-label">Total Rows</span>
          </div>
        </div>

        {results.duplicateList && results.duplicateList.length > 0 && (
          <div className="updated-list-container duplicate">
            <h3 className="list-title">
              <AlertCircle size={16} /> Skipped Duplicates (Internal
              Spreadsheet)
            </h3>
            <div className="updated-scrollbox">
              {results.duplicateList.map((m, idx) => (
                <div key={idx} className="updated-entry">
                  <div className="entry-id">{m.id}</div>
                  <div className="entry-names-box">
                    <span className="name-old gray-text" title={m.firstName}>
                      {m.firstName}
                    </span>
                    <span className="name-arrow">→</span>
                    <span className="name-new" title={m.name}>
                      {m.name}
                    </span>
                  </div>
                  <div className="entry-tag red">Skipped</div>
                </div>
              ))}
            </div>
            <p className="internal-notice">
              An earlier row in this Excel file already used this ID. The first
              name found was kept.
            </p>
          </div>
        )}

        {results.updatedList && results.updatedList.length > 0 && (
          <div className="updated-list-container">
            <h3 className="list-title">
              <Info size={16} /> Data Updates (Existing PWDs)
            </h3>
            <div className="updated-scrollbox">
              {results.updatedList.map((m, idx) => (
                <div key={idx} className="updated-entry">
                  <div className="entry-id">{m.id}</div>
                  <div className="entry-names-box">
                    <span className="name-old" title={m.oldName}>
                      {m.oldName}
                    </span>
                    <span className="name-arrow">→</span>
                    <span className="name-new" title={m.name}>
                      {m.name}
                    </span>
                  </div>
                  <div className="entry-tag">Updated</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="summary-footer">
          <button className="btn btn-primary btn-block" onClick={onClose}>
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Change PIN Card ───────────────────────────────────
function SettingsView({
  settings,
  onSave,
  activeTab,
  memberCount = 0,
  onToast = () => {},
  onRefreshMembers = () => {},
}) {
  const [activeSection, setActiveSection] = useState("id-status");
  const [isDirty, setIsDirty] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null); // 'loading' | 'done' | 'error'
  const [restoreStatus, setRestoreStatus] = useState(null);
  const [restoreSettings, setRestoreSettings] = useState(false);
  const [lastBackup, setLastBackup] = useState(
    () => localStorage.getItem("pwd_last_backup") || null,
  );
  const restoreFileRef = useRef(null);
  const [formData, setFormData] = useState({
    active_pattern: "03-1412",
    expired_patterns: "03-1402, 03-14-02",
    expiry_threshold: "2",
    items_per_page: "10",
    theme: "emerald",
    mapping_name: "name,pangalan,member,full name",
    mapping_id: "pwd id,pwd,id number,id,control,numero,number,no.",
    mapping_birthday: "birthday,b-day,birth,kapanganakan",
    mapping_status: "status,kalagayan",
    mapping_contact: "contact,phone,cellphone,mobile,telepono",
    mapping_address: "address,tirahan,lokasyon,baranggay,brgy",
    backup_frequency: "weekly",
    backup_path: "C:\\PWD_Backups",
    ...settings,
  });

  useEffect(() => {
    setFormData((prev) => ({ ...prev, ...settings }));
    setIsDirty(false);
  }, [settings]);

  useEffect(() => {
    if (activeTab === "settings") {
      document.body.className = formData.theme || "emerald";
    }
  }, [formData.theme, activeTab]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setIsDirty(false);
    setSavedPulse(true);
    setTimeout(() => setSavedPulse(false), 2000);
  };

  const setTheme = (theme) => {
    setFormData((prev) => ({ ...prev, theme }));
    setIsDirty(true);
  };

  const toggleColumn = (colId) => {
    const colsArray = (formData.visible_columns || "")
      .split(",")
      .filter((c) => c !== "");
    const newCols = colsArray.includes(colId)
      ? colsArray.filter((c) => c !== colId)
      : [...colsArray, colId];
    setFormData((prev) => ({ ...prev, visible_columns: newCols.join(",") }));
    setIsDirty(true);
  };

  const navItems = [
    { id: "id-status", label: "ID Status", icon: <Fingerprint size={16} /> },
    { id: "display", label: "Display", icon: <Palette size={16} /> },
    { id: "columns", label: "Columns", icon: <Columns3 size={16} /> },
    {
      id: "mapping",
      label: "Excel Mapping",
      icon: <FileSpreadsheet size={16} />,
    },
    { id: "backup", label: "Backup", icon: <Archive size={16} /> },
  ];

  const columns = [
    { id: "name", label: "Full Name", icon: <Users size={14} /> },
    { id: "id", label: "ID Number", icon: <Hash size={14} /> },
    { id: "status", label: "Status", icon: <Activity size={14} /> },
    { id: "birthday", label: "Birthday", icon: <Cake size={14} /> },
    { id: "contact", label: "Contact", icon: <MapPin size={14} /> },
    { id: "address", label: "Address", icon: <MapPin size={14} /> },
  ];

  const colsArray = (formData.visible_columns || "")
    .split(",")
    .filter((c) => c !== "");

  const mappingFields = [
    {
      name: "mapping_name",
      label: "Full Name",
      icon: <Users size={15} />,
      placeholder: "name, pangalan, member",
    },
    {
      name: "mapping_id",
      label: "PWD ID",
      icon: <Hash size={15} />,
      placeholder: "pwd id, id number, control",
    },
    {
      name: "mapping_birthday",
      label: "Birthday",
      icon: <Cake size={15} />,
      placeholder: "birthday, b-day, kapanganakan",
    },
    {
      name: "mapping_status",
      label: "Status",
      icon: <Activity size={15} />,
      placeholder: "status, kalagayan",
    },
  ];

  return (
    <div className="settings-shell">
      {/* Page Header */}
      <div className="settings-page-header">
        <div className="settings-page-title">
          <div className="settings-page-icon">
            <Settings size={20} />
          </div>
          <div>
            <h1>System Configuration</h1>
            <p>
              Manage your ID patterns, display preferences, and import mappings.
            </p>
          </div>
        </div>
      </div>

      <div className="settings-layout">
        {/* LEFT NAV */}
        <nav className="settings-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`settings-nav-item ${activeSection === item.id ? "active" : ""}`}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="settings-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {activeSection === item.id && (
                <span className="settings-nav-indicator" />
              )}
            </button>
          ))}
        </nav>

        {/* RIGHT PANEL */}
        <form onSubmit={handleSubmit} className="settings-panel">
          {/* ── ID STATUS SECTION ── */}
          {activeSection === "id-status" && (
            <div className="settings-section-panel">
              <div className="section-panel-header">
                <div className="section-panel-icon emerald-gradient">
                  <Fingerprint size={18} />
                </div>
                <div>
                  <h2>ID Status Configuration</h2>
                  <p>
                    Define the ID number prefixes that determine a member's
                    status.
                  </p>
                </div>
              </div>

              <div className="settings-fields">
                <div className="settings-field-row">
                  <div className="field-meta">
                    <label>Active ID Prefix</label>
                    <small>
                      IDs beginning with this prefix will be classified as{" "}
                      <span className="badge-inline green">Active</span>
                    </small>
                  </div>
                  <div className="field-input">
                    <div className="input-with-tag">
                      <span className="input-tag green">Active</span>
                      <input
                        type="text"
                        name="active_pattern"
                        value={formData.active_pattern}
                        onChange={handleChange}
                        placeholder="e.g., 03-1412"
                      />
                    </div>
                  </div>
                </div>

                <div className="settings-field-row">
                  <div className="field-meta">
                    <label>Expired ID Prefixes</label>
                    <small>
                      Comma-separated prefixes that mark IDs as{" "}
                      <span className="badge-inline orange">Expired</span>
                    </small>
                  </div>
                  <div className="field-input">
                    <div className="input-with-tag">
                      <span className="input-tag orange">Expired</span>
                      <input
                        type="text"
                        name="expired_patterns"
                        value={formData.expired_patterns}
                        onChange={handleChange}
                        placeholder="e.g., 03-1402, 03-14-02"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── DISPLAY SECTION ── */}
          {activeSection === "display" && (
            <div className="settings-section-panel">
              <div className="section-panel-header">
                <div className="section-panel-icon accent-gradient">
                  <Palette size={18} />
                </div>
                <div>
                  <h2>Display Preferences</h2>
                  <p>
                    Control how data is presented and the look of the interface.
                  </p>
                </div>
              </div>

              <div className="settings-fields">
                <div className="settings-field-row">
                  <div className="field-meta">
                    <label>Records per Page</label>
                    <small>
                      How many members to show per page in the Masterlist.
                    </small>
                  </div>
                  <div className="field-input">
                    <div className="pagination-options">
                      {["10", "25", "50", "100"].map((val) => (
                        <button
                          key={val}
                          type="button"
                          className={`pagination-option ${formData.items_per_page === val ? "active" : ""}`}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              items_per_page: val,
                            }));
                            setIsDirty(true);
                          }}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="settings-field-row">
                  <div className="field-meta">
                    <label>Interface Theme</label>
                    <small>
                      Choose between the standard and high-visibility theme.
                    </small>
                  </div>
                  <div className="field-input">
                    <div className="theme-swatches">
                      <button
                        type="button"
                        className={`theme-swatch ${formData.theme === "emerald" ? "active" : ""}`}
                        onClick={() => setTheme("emerald")}
                      >
                        <div className="swatch-preview emerald-swatch">
                          <span />
                          <span />
                          <span />
                        </div>
                        <div className="swatch-info">
                          <strong>Bamboo Emerald</strong>
                          <small>Default green theme</small>
                        </div>
                        {formData.theme === "emerald" && (
                          <Check size={16} className="swatch-check" />
                        )}
                      </button>

                      <button
                        type="button"
                        className={`theme-swatch ${formData.theme === "high-contrast" ? "active" : ""}`}
                        onClick={() => setTheme("high-contrast")}
                      >
                        <div className="swatch-preview hc-swatch">
                          <span />
                          <span />
                          <span />
                        </div>
                        <div className="swatch-info">
                          <strong>High Contrast</strong>
                          <small>AAA accessibility mode</small>
                        </div>
                        {formData.theme === "high-contrast" && (
                          <Check size={16} className="swatch-check" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── COLUMNS SECTION ── */}
          {activeSection === "columns" && (
            <div className="settings-section-panel">
              <div className="section-panel-header">
                <div className="section-panel-icon info-gradient">
                  <Columns3 size={18} />
                </div>
                <div>
                  <h2>Visible Columns</h2>
                  <p>Choose which columns appear in the Masterlist table.</p>
                </div>
              </div>

              <div className="column-pills-grid">
                {columns.map((col) => {
                  const isActive = colsArray.includes(col.id);
                  return (
                    <button
                      key={col.id}
                      type="button"
                      className={`column-pill ${isActive ? "active" : ""}`}
                      onClick={() => toggleColumn(col.id)}
                    >
                      <span className="pill-icon">{col.icon}</span>
                      <span className="pill-label">{col.label}</span>
                      <span className="pill-toggle">
                        {isActive ? <Check size={14} /> : <X size={14} />}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="columns-hint">
                {colsArray.length === 0
                  ? "⚠ No columns selected — the table will be empty."
                  : `Showing ${colsArray.length} of ${columns.length} columns.`}
              </p>
            </div>
          )}

          {/* ── MAPPING SECTION ── */}
          {activeSection === "mapping" && (
            <div className="settings-section-panel">
              <div className="section-panel-header">
                <div className="section-panel-icon warning-gradient">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <h2>Excel Column Mapping</h2>
                  <p>
                    Define the Excel/CSV column header aliases for each field.
                    Separate multiple aliases with commas.
                  </p>
                </div>
              </div>

              <div className="mapping-fields">
                {mappingFields.map((field) => (
                  <div key={field.name} className="mapping-field-item">
                    <div className="mapping-field-label">
                      <span className="mapping-field-icon">{field.icon}</span>
                      <label>{field.label}</label>
                    </div>
                    <div className="mapping-input-wrap">
                      <Tag size={13} className="mapping-tag-icon" />
                      <input
                        type="text"
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        className="mapping-input-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── BACKUP SECTION ── */}
          {activeSection === "backup" && (
            <div className="settings-section-panel">
              <div className="section-panel-header">
                <div className="section-panel-icon backup-gradient">
                  <Archive size={18} />
                </div>
                <div>
                  <h2>Backup &amp; Restore</h2>
                  <p>
                    Export a full JSON backup of all members and settings, or
                    restore from a previous backup file.
                  </p>
                </div>
              </div>

              <div className="backup-grid">
                {/* CREATE BACKUP CARD */}
                <div className="backup-card backup-card-export">
                  <div className="bcard-icon">
                    <HardDriveDownload size={28} />
                  </div>
                  <h3>Create Backup</h3>
                  <p>
                    Downloads a <code>.json</code> file with all{" "}
                    <strong>{memberCount}</strong> member records and current
                    settings. Keep this file safe — it's your full data
                    snapshot.
                  </p>
                  {lastBackup && (
                    <div className="bcard-meta">
                      <ShieldCheck size={13} /> Last backup:{" "}
                      {relativeTime(lastBackup)}
                    </div>
                  )}
                  <button
                    type="button"
                    className="bcard-btn bcard-btn-export"
                    disabled={backupStatus === "loading"}
                    onClick={async () => {
                      setBackupStatus("loading");
                      try {
                        const data = await api.fetchBackup();
                        const json = JSON.stringify(data, null, 2);
                        const blob = new Blob([json], {
                          type: "application/json",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `PWD_Backup_${new Date().toISOString().split("T")[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        const now = new Date().toISOString();
                        localStorage.setItem("pwd_last_backup", now);
                        setLastBackup(now);
                        setBackupStatus("done");
                        onToast(
                          `Backup created — ${data.total_members} members exported.`,
                          "success",
                        );
                        setTimeout(() => setBackupStatus(null), 3000);
                      } catch (err) {
                        setBackupStatus("error");
                        onToast("Backup failed: " + err.message, "error");
                        setTimeout(() => setBackupStatus(null), 3000);
                      }
                    }}
                  >
                    {backupStatus === "loading" ? (
                      <>
                        <RotateCcw size={15} className="spin" /> Creating…
                      </>
                    ) : backupStatus === "done" ? (
                      <>
                        <ShieldCheck size={15} /> Downloaded!
                      </>
                    ) : (
                      <>
                        <HardDriveDownload size={15} /> Download Backup
                      </>
                    )}
                  </button>
                </div>

                {/* RESTORE BACKUP CARD */}
                <div className="backup-card backup-card-restore">
                  <div className="bcard-icon restore">
                    <RotateCcw size={28} />
                  </div>
                  <h3>Restore from Backup</h3>
                  <p>
                    Select a <code>PWD_Backup_*.json</code> file to restore.{" "}
                    <strong>All current member data will be replaced.</strong>
                  </p>

                  <label className="restore-settings-toggle">
                    <input
                      type="checkbox"
                      checked={restoreSettings}
                      onChange={(e) => setRestoreSettings(e.target.checked)}
                    />
                    Also restore settings from backup
                  </label>

                  <div className="restore-warning">
                    <AlertTriangle size={13} />
                    This will permanently overwrite all existing member records.
                  </div>

                  <input
                    type="file"
                    accept=".json"
                    ref={restoreFileRef}
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setRestoreStatus("loading");
                      try {
                        const text = await file.text();
                        const backupData = JSON.parse(text);
                        if (
                          !backupData.members ||
                          !Array.isArray(backupData.members)
                        ) {
                          throw new Error("Invalid backup file format.");
                        }
                        const result = await api.restoreBackup(
                          backupData,
                          restoreSettings,
                        );
                        await onRefreshMembers();
                        setRestoreStatus("done");
                        onToast(
                          `Restore complete — ${result.restored} members loaded.`,
                          "success",
                        );
                        setTimeout(() => setRestoreStatus(null), 3000);
                      } catch (err) {
                        setRestoreStatus("error");
                        onToast("Restore failed: " + err.message, "error");
                        setTimeout(() => setRestoreStatus(null), 3000);
                      }
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    className="bcard-btn bcard-btn-restore"
                    disabled={restoreStatus === "loading"}
                    onClick={() => restoreFileRef.current.click()}
                  >
                    {restoreStatus === "loading" ? (
                      <>
                        <RotateCcw size={15} className="spin" /> Restoring…
                      </>
                    ) : restoreStatus === "done" ? (
                      <>
                        <ShieldCheck size={15} /> Restored!
                      </>
                    ) : (
                      <>
                        <RotateCcw size={15} /> Select Backup File
                      </>
                    )}
                  </button>
                </div>

                {/* AUTOMATED MANAGED BACKUP CARD */}
                <div
                  className="backup-card backup-card-scheduled"
                  style={{
                    gridColumn: "span 2",
                    borderColor: "var(--primary)",
                  }}
                >
                  <div
                    className="bcard-icon"
                    style={{ background: "#dcfce7", color: "#059669" }}
                  >
                    <ShieldCheck size={28} />
                  </div>
                  <div className="bcard-body">
                    <h3
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      Institutional Managed Backup
                      <span
                        style={{
                          fontSize: "0.65rem",
                          padding: "2px 6px",
                          background: "var(--primary)",
                          color: "#fff",
                          borderRadius: "4px",
                          textTransform: "uppercase",
                        }}
                      >
                        Reliable
                      </span>
                    </h3>
                    <p>
                      Schedule automatic database snapshots to a local directory
                      or external drive. This ensures permanent data safety
                      without manual intervention.
                    </p>

                    <div
                      className="settings-fields"
                      style={{
                        marginTop: "1.5rem",
                        background: "#f8fafc",
                        padding: "1rem",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        className="settings-field-row"
                        style={{
                          border: "none",
                          padding: 0,
                          marginBottom: "1rem",
                        }}
                      >
                        <div className="field-meta">
                          <label>Backup Frequency</label>
                          <small>How often the system should auto-save.</small>
                        </div>
                        <div className="field-input">
                          <select
                            name="backup_frequency"
                            value={formData.backup_frequency}
                            onChange={handleChange}
                            style={{
                              width: "100%",
                              padding: "0.6rem",
                              borderRadius: "8px",
                              border: "1px solid #cbd5e1",
                            }}
                          >
                            <option value="daily">Daily (High Security)</option>
                            <option value="weekly">Weekly (Standard)</option>
                            <option value="monthly">Monthly (Minimum)</option>
                            <option value="off">
                              Disabled (Not Recommended)
                            </option>
                          </select>
                        </div>
                      </div>

                      <div
                        className="settings-field-row"
                        style={{ border: "none", padding: 0 }}
                      >
                        <div className="field-meta">
                          <label>Target Folder Path</label>
                          <small>
                            Absolute path (e.g., <code>D:\Backups</code>)
                          </small>
                        </div>
                        <div
                          className="field-input"
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "center",
                          }}
                        >
                          <div className="input-with-tag" style={{ flex: 1 }}>
                            <span
                              className="input-tag"
                              style={{
                                background: "#f1f5f9",
                                color: "#64748b",
                              }}
                            >
                              <HardDrive size={14} /> Path
                            </span>
                            <input
                              type="text"
                              name="backup_path"
                              value={formData.backup_path}
                              onChange={handleChange}
                              placeholder="e.g., C:\PWD_Backups"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                // Debug logging
                                console.log("selectDirectory click:", {
                                  hasElectronAPI: !!window.__electronAPI,
                                  hasSelectDirectory:
                                    !!window.__electronAPI?.selectDirectory,
                                });

                                if (!window.__electronAPI) {
                                  onToast(
                                    "This feature only works in the Electron desktop app",
                                    "error",
                                  );
                                  return;
                                }

                                if (!window.__electronAPI.selectDirectory) {
                                  onToast(
                                    "Folder selection not available - try restarting the app",
                                    "error",
                                  );
                                  return;
                                }

                                const selectedPath =
                                  await window.__electronAPI.selectDirectory();
                                if (selectedPath) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    backup_path: selectedPath,
                                  }));
                                  onToast(
                                    "Folder selected successfully",
                                    "success",
                                  );
                                }
                              } catch (err) {
                                console.error("selectDirectory error:", err);
                                onToast(
                                  `Error: ${err.message || "Failed to select folder"}`,
                                  "error",
                                );
                              }
                            }}
                            style={{
                              padding: "0.6rem 1rem",
                              borderRadius: "8px",
                              border: "1px solid #cbd5e1",
                              background: "#fff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              fontSize: "0.875rem",
                              color: "#64748b",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = "#f8fafc";
                              e.target.style.borderColor = "#94a3b8";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = "#fff";
                              e.target.style.borderColor = "#cbd5e1";
                            }}
                          >
                            <FolderOpen size={16} />
                            Browse
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "1rem",
                      display: "flex",
                      gap: "0.75rem",
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={async () => {
                        setBackupStatus("loading");
                        try {
                          await api.managedBackup(formData.backup_path);
                          onToast(
                            "Institutional backup successful!",
                            "success",
                          );
                          setBackupStatus("done");
                          setTimeout(() => setBackupStatus(null), 3000);
                        } catch (err) {
                          onToast(err.message, "error");
                          setBackupStatus("error");
                          setTimeout(() => setBackupStatus(null), 3000);
                        }
                      }}
                    >
                      {backupStatus === "loading" ? (
                        <>
                          <RotateCcw size={15} className="spin" /> Backing up…
                        </>
                      ) : backupStatus === "done" ? (
                        <>
                          <ShieldCheck size={15} /> Success!
                        </>
                      ) : (
                        <>
                          <Shield size={15} /> Run Manual Backup Now
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ── STICKY SAVE BAR ── */}
          <div className={`settings-save-bar ${isDirty ? "visible" : ""}`}>
            <span className="unsaved-dot" />
            <span className="unsaved-text">You have unsaved changes</span>
            <button
              type="submit"
              className={`btn btn-primary save-btn ${savedPulse ? "pulse" : ""}`}
            >
              {savedPulse ? (
                <>
                  <CheckCircle size={16} /> Saved!
                </>
              ) : (
                <>
                  <Save size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Highlight matching text in a string
function Highlight({ text, query }) {
  if (!query || !text) return <>{text}</>;
  const idx = String(text).toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {String(text).slice(0, idx)}
      <mark className="search-highlight">
        {String(text).slice(idx, idx + query.length)}
      </mark>
      {String(text).slice(idx + query.length)}
    </>
  );
}

// ── Birthday Formatter with Age Calculation ──
function formatBirthday(raw) {
  if (!raw) return "—";
  const date = new Date(raw);
  if (isNaN(date.getTime())) return raw;
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const hadBirthdayThisYear =
    now.getMonth() > date.getMonth() ||
    (now.getMonth() === date.getMonth() && now.getDate() >= date.getDate());
  if (!hadBirthdayThisYear) age--;
  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return { formatted, age };
}

// ── Print / PDF Modal ─────────────────────────────────
function PrintModal({ members, getIDStatus, onClose, filterLabel }) {
  const printRef = React.useRef(null);
  const [saving, setSaving] = React.useState(false);
  const [showSavePage, setShowSavePage] = React.useState(false);

  const PRINT_STYLES = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; background: #fff; }
    .print-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-bottom: 3px solid #000; }
    .print-header img { height: 80px; width: 80px; object-fit: contain; }
    .print-org { text-align: center; flex: 1; }
    .print-org h1 { font-size: 26px; font-weight: 900; color: #1a1a1a; letter-spacing: -0.5px; }
    .print-org p { font-size: 12px; color: #444; margin-top: 4px; }
    .print-title { text-align: center; font-size: 15px; font-weight: 900; padding: 14px 0 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #fff; border: 1px solid #999; padding: 6px 8px; font-size: 12px; font-weight: 900; text-align: left; text-transform: uppercase; }
    td { border: 1px solid #bbb; padding: 5px 8px; font-size: 11px; }
    .row-no { width: 36px; text-align: center; font-weight: 600; }
    .row-active-alt { background: #d4edda; color: #155724; }
    .row-expired { background: #ffe0e0; color: #c0392b; }
    .row-super { background: #ffcccc; color: #922b21; }
    @media print { @page { size: A4 portrait; margin: 15mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  `;

  const handlePrint = () => {
    const content = printRef.current;
    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(`<!DOCTYPE html><html><head>
      <title>PWD Masterlist — SAMAKAME Inc.</title>
      <style>${PRINT_STYLES}</style></head><body>
      ${content.innerHTML}
      </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 400);
  };

  // Convert an img src to a base64 data URI (so the PDF is self-contained)
  const toBase64 = async (src) => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch {
      return src;
    }
  };

  const [pdfToast, setPdfToast] = React.useState(null);
  const [pdfFilename, setPdfFilename] = React.useState(() => {
    const d = new Date();
    return `PWD-Masterlist-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  // Build and save the PDF — accepts a custom filename (without .pdf extension)
  const handleSavePDF = async (filename) => {
    if (saving) return;
    setSaving(true);
    setPdfToast({ type: "saving", msg: "Generating PDF… please wait" });
    try {
      const content = printRef.current;
      const imgs = [...content.querySelectorAll("img")];
      const b64Map = new Map();
      await Promise.all(
        imgs.map(async (img) => {
          b64Map.set(img.src, await toBase64(img.src));
        }),
      );
      const clone = content.cloneNode(true);
      clone.querySelectorAll("img").forEach((img) => {
        const b64 = b64Map.get(img.src);
        if (b64) img.src = b64;
      });
      const html = `<!DOCTYPE html><html><head>
        <meta charset="utf-8" />
        <title>${filename}</title>
        <style>${PRINT_STYLES}</style>
      </head><body>${clone.innerHTML}</body></html>`;

      if (window.__electronAPI?.isElectron) {
        const result = await window.__electronAPI.savePDF(
          html,
          (filename || "PWD-Masterlist") + ".pdf",
        );
        if (result?.success) {
          setPdfToast({
            type: "success",
            msg: `✅ Saved: ${result.path.split("\\").pop()}`,
          });
          setTimeout(() => setPdfToast(null), 5000);
        } else if (result?.canceled) {
          setPdfToast(null);
        }
      } else {
        // Browser fallback: explicitly use html2pdf to download the file directly.
        // We pass the full HTML string (which includes the PRINT_STYLES and base64 images)
        // so it renders in complete isolation without being clipped by the main app's layout.
        const opt = {
          margin: 0.6,
          filename: (filename || "PWD-Masterlist") + ".pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        };

        await html2pdf().set(opt).from(html).save();

        setPdfToast({
          type: "success",
          msg: `✅ Downloaded: ${(filename || "PWD-Masterlist") + ".pdf"}`,
        });
        setTimeout(() => setPdfToast(null), 5000);
      }
    } catch (err) {
      setPdfToast({ type: "error", msg: `❌ ${err.message}` });
      setTimeout(() => setPdfToast(null), 6000);
    } finally {
      setSaving(false);
    }
  };

  // Color logic — only Expired gets highlighted
  const getRowClass = (m) => {
    const status = getIDStatus(m.id).label;
    if (status === "Expired") return "row-expired";
    return "";
  };

  const fmtBirthday = (raw) => {
    if (!raw) return "—";
    const d = new Date(raw);
    if (isNaN(d)) return raw;
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  };

  const isElectron =
    typeof window !== "undefined" && window.__electronAPI?.isElectron;

  return (
    <div className="modal-overlay print-modal-overlay" onClick={onClose}>
      <div
        className="modal-content print-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Save PDF Page (shown overlaying or instead of preview) ──────── */}
        {showSavePage && (
          <div className="save-pdf-page">
            {/* Back header */}
            <div className="save-pdf-header">
              <button
                className="save-pdf-back"
                onClick={() => {
                  setShowSavePage(false);
                  setPdfToast(null);
                }}
              >
                <ChevronLeft size={18} /> Back to Preview
              </button>
              <span className="save-pdf-title">Save as PDF</span>
            </div>

            {/* Form card */}
            <div className="save-pdf-body">
              <div className="save-pdf-icon-wrap">
                <FileText size={48} strokeWidth={1.4} />
              </div>

              <div className="save-pdf-field">
                <label className="save-pdf-label">File Name</label>
                <div className="save-pdf-input-wrap">
                  <input
                    className="save-pdf-input"
                    type="text"
                    value={pdfFilename}
                    onChange={(e) => setPdfFilename(e.target.value)}
                    placeholder="e.g. PWD-Masterlist-2025"
                    maxLength={80}
                    disabled={saving}
                  />
                  <span className="save-pdf-ext">.pdf</span>
                </div>
                <p className="save-pdf-hint">
                  The file will be saved wherever you choose in the Save dialog.
                </p>
              </div>

              {/* Document info */}
              <div className="save-pdf-info-row">
                <div className="save-pdf-info-card">
                  <span className="save-pdf-info-val">{members.length}</span>
                  <span className="save-pdf-info-key">Members</span>
                </div>
                <div className="save-pdf-info-card">
                  <span className="save-pdf-info-val">A4</span>
                  <span className="save-pdf-info-key">Page Size</span>
                </div>
                <div className="save-pdf-info-card">
                  <span className="save-pdf-info-val">
                    {new Date().toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="save-pdf-info-key">Generated</span>
                </div>
              </div>

              {/* Status toast */}
              {pdfToast && (
                <div
                  className={`pdf-toast pdf-toast-${pdfToast.type}`}
                  style={{ borderRadius: 8, marginTop: 0 }}
                >
                  {pdfToast.type === "saving" && (
                    <span
                      className="login-spinner"
                      style={{
                        width: 14,
                        height: 14,
                        borderWidth: 2,
                        marginRight: 8,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {pdfToast.msg}
                </div>
              )}

              {/* Actions */}
              <button
                className="btn btn-primary save-pdf-btn"
                onClick={() => handleSavePDF(pdfFilename)}
                disabled={saving || !pdfFilename.trim()}
              >
                {saving ? (
                  <>
                    <span
                      className="login-spinner"
                      style={{ width: 16, height: 16, borderWidth: 2 }}
                    />{" "}
                    Generating PDF…
                  </>
                ) : (
                  <>
                    <Download size={18} />{" "}
                    {isElectron ? "Generate & Save PDF" : "Save as PDF"}
                  </>
                )}
              </button>

              {!isElectron && (
                <p
                  className="save-pdf-hint"
                  style={{
                    textAlign: "center",
                    marginTop: "-0.5rem",
                    opacity: 0.8,
                  }}
                >
                  Note: In browser mode, choose "Save as PDF" in the print
                  dialog.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Normal preview layout (hidden when save page is active) ─────── */}
        <div
          style={{
            display: showSavePage ? "none" : "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <div className="print-modal-toolbar">
            <span className="print-modal-count">
              {members.length} member{members.length !== 1 ? "s" : ""}
              {filterLabel && (
                <span style={{ marginLeft: 8, opacity: 0.7, fontWeight: 400, fontSize: "0.82em" }}>
                  — {filterLabel}
                </span>
              )}
            </span>
            <div className="print-modal-actions">
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              <button
                className="btn btn-outline"
                onClick={handlePrint}
                title="Open print dialog"
              >
                <Printer size={16} /> Print
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowSavePage(true)}
                title="Save as a PDF file"
              >
                <Download size={16} /> Save PDF File
              </button>
            </div>
          </div>

          {/* PDF status toast */}
          {pdfToast && (
            <div className={`pdf-toast pdf-toast-${pdfToast.type}`}>
              {pdfToast.msg}
            </div>
          )}

          <div className="print-preview-scroll">
            <div ref={printRef} className="print-page">
              {/* Header */}
              <div className="print-header">
                <img
                  src={samakameLogo}
                  alt="SAMAKAME Logo"
                  className="print-logo"
                />
                <div className="print-org">
                  <h1>SAMAKAME Inc.</h1>
                  <p>Samahan ng Maykapansanan ng Meycauayan Inc.</p>
                </div>
                <img
                  src={libtongLogo}
                  alt="Libtong Logo"
                  className="print-logo"
                />
              </div>

              {/* Title */}
              <div className="print-title">
                Master List of PWD Libtong Chapter
              </div>
              {filterLabel && (
                <div style={{ textAlign: "center", fontSize: 12, marginBottom: 8, color: "#555", fontStyle: "italic" }}>
                  {filterLabel}
                </div>
              )}

              {/* Table */}
              <table className="print-table">
                <thead>
                  <tr>
                    <th className="row-no">No</th>
                    <th>NAME</th>
                    <th>PWD ID</th>
                    <th>BIRTHDAY</th>
                    <th style={{ width: 42, textAlign: "center" }}>AGE</th>
                    <th>CONTACT</th>
                    <th>ADDRESS</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m, idx) => {
                    const bd = m.birthday ? new Date(m.birthday) : null;
                    let age = null;
                    if (bd && !isNaN(bd)) {
                      const today = new Date();
                      age = today.getFullYear() - bd.getFullYear();
                      const mo = today.getMonth() - bd.getMonth();
                      if (mo < 0 || (mo === 0 && today.getDate() < bd.getDate())) age--;
                    }
                    return (
                      <tr key={m.id} className={getRowClass(m)}>
                        <td className="row-no">{idx + 1}</td>
                        <td>{m.name}</td>
                        <td>{m.id}</td>
                        <td>{fmtBirthday(m.birthday)}</td>
                        <td style={{ textAlign: "center" }}>{age !== null ? age : "—"}</td>
                        <td>{m.contact || "—"}</td>
                        <td>{m.address || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Masterlist({
  members: initialMembers,
  onDelete,
  onMassDelete,
  onEdit,
  onExport,
  onImport,
  getIDStatus,
  itemsPerPageSetting = 10,
  visibleColumns = ["name", "id", "status", "birthday"],
  columnMappings = {},
  onToggleColumn,
  searchQuery = "",
  onRequestPrint,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ageFilter, setAgeFilter] = useState("All"); // "All" | "1-12"
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, dir: "asc" });
  const columnDropdownRef = useRef(null);
  const itemsPerPage = itemsPerPageSetting;
  const fileInputRef = React.useRef(null);

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
    setCurrentPage(1);
  };

  const SortIcon = ({ col }) => {
    if (sortConfig.key !== col)
      return <span className="sort-icon unsorted">⇅</span>;
    return (
      <span className="sort-icon active">
        {sortConfig.dir === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        columnDropdownRef.current &&
        !columnDropdownRef.current.contains(event.target)
      ) {
        setShowColumnDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Age helper — returns whole years or null if birthday is missing/invalid
  const calcAge = (birthday) => {
    if (!birthday) return null;
    const d = new Date(birthday);
    if (isNaN(d)) return null;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const monthDiff = today.getMonth() - d.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) age--;
    return age;
  };

  // Status Filtering Logic
  const filteredByStatus = initialMembers.filter((m) => {
    if (statusFilter === "All") return true;
    return getIDStatus(m.id).label === statusFilter;
  });

  // Age Filtering Logic
  const filteredByAge = filteredByStatus.filter((m) => {
    if (ageFilter === "All") return true;
    const age = calcAge(m.birthday);
    if (age === null) return false;
    if (ageFilter === "1-12") return age >= 1 && age <= 12;
    if (ageFilter === "59") return age === 59;
    return true;
  });

  // Sorting Logic
  const sortedMembers = React.useMemo(() => {
    if (!sortConfig.key) return filteredByAge;
    return [...filteredByAge].sort((a, b) => {
      let aVal = a[sortConfig.key] || "";
      let bVal = b[sortConfig.key] || "";
      if (sortConfig.key === "birthday") {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
        return sortConfig.dir === "asc" ? aVal - bVal : bVal - aVal;
      }
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
      if (aVal < bVal) return sortConfig.dir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredByAge, sortConfig]);

  // Reset to page 1 when members or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [initialMembers.length, statusFilter, ageFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMembers = sortedMembers.slice(startIndex, endIndex);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(currentMembers.map((m) => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleBulkDelete = () => {
    onMassDelete(selectedIds);
    setSelectedIds([]);
    if (currentMembers.length === selectedIds.length && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedIds([]);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array", cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      let headerIndex = -1;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (
          row.some((cell) => String(cell).toLowerCase().includes("name")) &&
          row.some((cell) => String(cell).toLowerCase().includes("id"))
        ) {
          headerIndex = i;
          break;
        }
      }

      if (headerIndex === -1) {
        alert(
          "Could not find 'NAME' and 'ID' columns. Please check your Excel structure!",
        );
        return;
      }

      const headers = rows[headerIndex];
      const dataRows = rows.slice(headerIndex + 1);
      const importedMembers = [];

      dataRows.forEach((row) => {
        const chunks = [
          { start: 0, end: 8 },
          { start: 9, end: 17 },
          { start: 18, end: 26 },
        ];

        chunks.forEach((chunk) => {
          const chunkData = row.slice(chunk.start, chunk.end);
          const chunkHeaders = headers.slice(chunk.start, chunk.end);

          const getVal = (possibleKeys) => {
            const idx = chunkHeaders.findIndex((h) =>
              possibleKeys.some(
                (pk) => String(h).toLowerCase().trim() === pk.toLowerCase(),
              ),
            );
            const finalIdx =
              idx !== -1
                ? idx
                : chunkHeaders.findIndex((h) =>
                    possibleKeys.some(
                      (pk) =>
                        String(h).toLowerCase().includes(pk.toLowerCase()) &&
                        pk.length > 2,
                    ),
                  );

            let val = finalIdx !== -1 ? chunkData[finalIdx] : null;
            if (val instanceof Date) {
              return val.toISOString().split("T")[0];
            }
            return val;
          };

          const parseAliases = (raw) =>
            (raw || "")
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s !== "");

          const name = getVal(
            parseAliases(
              columnMappings.mapping_name || "name,pangalan,member,full name",
            ),
          );
          const rawId = getVal(
            parseAliases(
              columnMappings.mapping_id ||
                "pwd id,pwd,id number,id,control,numero,number,no.",
            ),
          );
          const id = rawId ? String(rawId).trim() : "";

          if (name && name.trim() !== "") {
            const finalId =
              id ||
              `TEMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            importedMembers.push({
              id: finalId,
              name: name.trim(),
              disabilityType:
                getVal(
                  parseAliases(
                    columnMappings.mapping_disability ||
                      "disability,type,kategorya",
                  ),
                ) || "Orthopedic",
              birthday:
                getVal(
                  parseAliases(
                    columnMappings.mapping_birthday ||
                      "birthday,b-day,birth,kapanganakan",
                  ),
                ) || "",
              sex:
                getVal(
                  parseAliases(
                    columnMappings.mapping_sex || "sex,gender,kasarian",
                  ),
                ) || "M",
              barangay:
                getVal(
                  parseAliases(
                    columnMappings.mapping_barangay ||
                      "barangay,brgy,bgy,address",
                  ),
                ) || "",
              expiryDate:
                getVal(
                  parseAliases(
                    columnMappings.mapping_expiry || "expiry,valid,renewal",
                  ),
                ) || "",
              status:
                getVal(
                  parseAliases(
                    columnMappings.mapping_status || "status,kalagayan",
                  ),
                ) || "Active",
              contact:
                getVal(
                  parseAliases(
                    columnMappings.mapping_contact || "contact,phone,cellphone,mobile,telepono",
                  ),
                ) || "",
              address:
                getVal(
                  parseAliases(
                    columnMappings.mapping_address || "address,tirahan,lokasyon,baranggay,brgy",
                  ),
                ) || "",
              photo: null,
            });
          }
        });
      });

      onImport(importedMembers);
      setCurrentPage(1);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // ── Drag-and-drop import ──
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = React.useRef(0);

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) return;
    const fakeEvent = {
      target: { files: [file], value: "" },
      preventDefault: () => {},
    };
    // Reuse existing file handler
    handleFileChange(fakeEvent);
  };

  // ── Export selected rows ──
  const exportSelected = () => {
    const rows = sortedMembers.filter((m) => selectedIds.includes(m.id));
    const header = "ID,Name,Birthday,Status,Contact,Address";
    const lines = rows.map(
      (m) =>
        `"${(m.id || "").replace(/"/g, '""')}","${(m.name || "").replace(/"/g, '""')}","${(m.birthday || "").replace(/"/g, '""')}","${getIDStatus(m.id, m.status).label || ""}","${(m.contact || "").replace(/"/g, '""')}","${(m.address || "").replace(/"/g, '""')}"`,
    );
    const blob = new Blob([header + "\n" + lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PWD_Selected_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="masterlist"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* ── Drag-drop overlay ── */}
      {isDragging && (
        <div className="drag-drop-overlay">
          <div className="drag-drop-inner">
            <Upload size={48} className="drag-drop-icon" />
            <h2>Drop your Excel file here</h2>
            <p>.xlsx &nbsp;·&nbsp; .xls &nbsp;·&nbsp; .csv</p>
          </div>
        </div>
      )}
      {/* ── Masterlist Header ── */}
      <div className="ml-header">
        <div className="ml-title-block">
          <h1>Members</h1>
          <div className="ml-summary">
            <span className="ml-chip total">{sortedMembers.length} total</span>
            <span className="ml-chip active">
              {
                sortedMembers.filter(
                  (m) => getIDStatus(m.id).label === "Active",
                ).length
              }{" "}
              active
            </span>
            <span className="ml-chip expired">
              {
                sortedMembers.filter(
                  (m) => getIDStatus(m.id).label === "Expired",
                ).length
              }{" "}
              expired
            </span>
            {sortedMembers.filter(
              (m) => calcAge(m.birthday) === 59,
            ).length > 0 && (
              <span className="ml-chip amber" style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}>
                {
                  sortedMembers.filter(
                    (m) => calcAge(m.birthday) === 59,
                  ).length
                }{" "}
                turning senior (59)
              </span>
            )}
          </div>
        </div>

        <div className="ml-toolbar">
          {/* Left group: filters */}
          <div className="ml-toolbar-left">
            <div className="filter-group">
              {["All", "Active", "Expired"].map((status) => (
                <button
                  key={status}
                  className={`filter-badge ${statusFilter === status ? "active" : ""}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {statusFilter === status && <Check size={11} />}
                  {status}
                </button>
              ))}
            </div>
            {/* Age filter pill */}
            <div className="filter-group" style={{ marginLeft: 8 }}>
              <button
                className={`filter-badge filter-badge-age ${ageFilter === "1-12" ? "active" : ""}`}
                onClick={() => setAgeFilter(ageFilter === "1-12" ? "All" : "1-12")}
                title="Show only members aged 1–12 years old"
              >
                {ageFilter === "1-12" && <Check size={11} />}
                <Cake size={11} style={{ marginRight: 2 }} />
                Kids (1–12 yrs)
              </button>
              <button
                className={`filter-badge filter-badge-age ${ageFilter === "59" ? "active" : ""}`}
                onClick={() => setAgeFilter(ageFilter === "59" ? "All" : "59")}
                title="Show members aged 59 (turning senior citizen soon)"
                style={ageFilter === "59" ? { background: "#f59e0b", borderColor: "#f59e0b", color: "#fff" } : {}}
              >
                {ageFilter === "59" && <Check size={11} />}
                <Hourglass size={11} style={{ marginRight: 2 }} />
                Turning Senior (59)
              </button>
            </div>
          </div>

          {/* Right group: actions */}
          <div className="ml-toolbar-right">
            {selectedIds.length > 0 && (
              <button className="btn btn-danger" onClick={handleBulkDelete}>
                <Trash2 size={15} /> Delete ({selectedIds.length})
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls, .csv"
              style={{ display: "none" }}
            />
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current.click()}
            >
              <Upload size={15} /> Import
            </button>

            <div className="column-toggle-container" ref={columnDropdownRef}>
              <button
                className={`btn btn-secondary btn-sm ${showColumnDropdown ? "active" : ""}`}
                onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              >
                <Settings2 size={15} /> Columns
                <ChevronDown
                  size={12}
                  className={`chevron ${showColumnDropdown ? "rotate" : ""}`}
                />
              </button>
              {showColumnDropdown && (
                <div className="column-dropdown glass-card">
                  <div className="dropdown-header">
                    <span>Show/Hide Columns</span>
                  </div>
                  <div className="dropdown-body">
                    {[
                      { id: "name", label: "Full Name" },
                      { id: "id", label: "ID Number" },
                      { id: "status", label: "Status" },
                      { id: "birthday", label: "Birthday" },
                      { id: "contact", label: "Contact" },
                      { id: "address", label: "Address" },
                    ].map((col) => (
                      <label key={col.id} className="dropdown-item">
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(col.id)}
                          onChange={() => onToggleColumn(col.id)}
                        />
                        <span
                          className={
                            visibleColumns.includes(col.id) ? "active" : ""
                          }
                        >
                          {col.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button className="btn btn-primary btn-sm" onClick={onExport}>
              <Download size={15} /> Export
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onRequestPrint && onRequestPrint(
                sortedMembers,
                ageFilter === "1-12" ? "Ages 1–12 Years Old (Children)" : ageFilter === "59" ? "Turning Senior (59 Years Old)" : null,
              )}
            >
              <Printer size={15} /> Print{ageFilter === "1-12" ? " (Kids)" : ageFilter === "59" ? " (59 yrs)" : ""}
            </button>
          </div>
        </div>
      </div>

      <div className="card table-container">
        {/* Record range info */}
        <div className="table-meta">
          <span>
            Showing{" "}
            <strong>
              {startIndex + 1}–{Math.min(endIndex, sortedMembers.length)}
            </strong>{" "}
            of <strong>{sortedMembers.length}</strong> members
          </span>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: "36px" }}>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    selectedIds.length === currentMembers.length &&
                    currentMembers.length > 0
                  }
                />
              </th>
              <th style={{ width: "44px", textAlign: "center" }}>#</th>
              {visibleColumns.includes("name") && (
                <th className="th-sortable" onClick={() => handleSort("name")}>
                  Full Name <SortIcon col="name" />
                </th>
              )}
              {visibleColumns.includes("id") && (
                <th className="th-sortable" onClick={() => handleSort("id")}>
                  PWD ID <SortIcon col="id" />
                </th>
              )}
              {visibleColumns.includes("status") && <th>Status</th>}
              {visibleColumns.includes("birthday") && (
                <th
                  className="th-sortable"
                  onClick={() => handleSort("birthday")}
                >
                  Birthday <SortIcon col="birthday" />
                </th>
              )}
              {visibleColumns.includes("contact") && <th>Contact</th>}
              {visibleColumns.includes("address") && <th>Address</th>}
              <th style={{ width: "90px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentMembers.length > 0 ? (
              currentMembers.map((m, idx) => (
                <tr
                  key={m.id}
                  className={`spotlight-row ${selectedIds.includes(m.id) ? "selected-row" : ""}`}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
                    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
                  }}
                >
                  <td style={{ width: "36px" }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(m.id)}
                      onChange={() => toggleSelect(m.id)}
                    />
                  </td>
                  <td className="row-num">{startIndex + idx + 1}</td>
                  {visibleColumns.includes("name") && (
                    <td className="font-semibold">
                      <Highlight text={m.name} query={searchQuery} />
                    </td>
                  )}
                  {visibleColumns.includes("id") && (
                    <td>
                      <div className="id-cell">
                        <code className="id-code">
                          <Highlight text={m.id} query={searchQuery} />
                        </code>
                        <button
                          className="copy-id-btn"
                          title="Copy ID"
                          onClick={() => {
                            navigator.clipboard.writeText(m.id);
                            document.dispatchEvent(
                              new CustomEvent("copy-id-toast", {
                                detail: m.id,
                              }),
                            );
                          }}
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </td>
                  )}
                  {visibleColumns.includes("status") && (
                    <td>
                      <span
                        className={`status-badge ${
                          getIDStatus(m.id).label === "Active"
                            ? "status-updated"
                            : "status-expired"
                        }`}
                      >
                        {getIDStatus(m.id).label}
                      </span>
                    </td>
                  )}
                  {visibleColumns.includes("birthday") &&
                    (() => {
                      const bday = formatBirthday(m.birthday);
                      return (
                        <td>
                          {typeof bday === "object" ? (
                            <div className="birthday-cell">
                              <span className="bday-date">
                                {bday.formatted}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                <span className="bday-age">{bday.age} yrs</span>
                                {bday.age === 59 && (
                                  <span className="turning-senior-badge" title="Turning 60 (Senior Citizen) soon">
                                    Turning Senior
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            bday
                          )}
                        </td>
                      );
                    })()}
                  {visibleColumns.includes("contact") && (
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85em" }}>
                      {m.contact || <span style={{ opacity: 0.4 }}>—</span>}
                    </td>
                  )}
                  {visibleColumns.includes("address") && (
                    <td style={{ color: "var(--text-muted)", fontSize: "0.85em", maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={m.address || ""}>
                      {m.address || <span style={{ opacity: 0.4 }}>—</span>}
                    </td>
                  )}
                  <td>
                    <div className="row-actions">
                      <button
                        className="row-action-btn edit"
                        onClick={() => onEdit(m)}
                        title="Edit member"
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button
                        className="row-action-btn delete"
                        onClick={() => onDelete(m.id)}
                        title="Delete member"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">
                    <svg
                      className="empty-state-svg"
                      viewBox="0 0 220 180"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <ellipse
                        cx="110"
                        cy="160"
                        rx="80"
                        ry="10"
                        fill="#f1f5f9"
                      />
                      <rect
                        x="55"
                        y="40"
                        width="110"
                        height="100"
                        rx="12"
                        fill="#e2e8f0"
                      />
                      <rect
                        x="65"
                        y="55"
                        width="90"
                        height="8"
                        rx="4"
                        fill="#cbd5e1"
                      />
                      <rect
                        x="65"
                        y="72"
                        width="60"
                        height="6"
                        rx="3"
                        fill="#e2e8f0"
                      />
                      <rect
                        x="65"
                        y="86"
                        width="75"
                        height="6"
                        rx="3"
                        fill="#e2e8f0"
                      />
                      <circle
                        cx="110"
                        cy="28"
                        r="16"
                        fill="#10b981"
                        opacity="0.15"
                      />
                      <circle
                        cx="110"
                        cy="28"
                        r="10"
                        fill="#10b981"
                        opacity="0.3"
                      />
                      <path
                        d="M104 28l4 4 8-8"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <h3>No members found</h3>
                    <p>
                      Try adjusting your search or filters, or import an Excel
                      file to get started.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing <span>{sortedMembers.length > 0 ? startIndex + 1 : 0}</span>–<span>{Math.min(startIndex + itemsPerPage, sortedMembers.length)}</span> of <span>{sortedMembers.length}</span> entries
            </div>

            <div className="pagination-controls">
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                title="Previous Page"
              >
                <ChevronLeft size={16} />
                <span>Prev</span>
              </button>

              <div className="page-numbers">
                {(() => {
                  const getPages = () => {
                    if (totalPages <= 7) {
                      return Array.from({ length: totalPages }, (_, i) => i + 1);
                    }
                    if (currentPage <= 4) {
                      return [1, 2, 3, 4, 5, "...", totalPages];
                    }
                    if (currentPage >= totalPages - 3) {
                      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                    }
                    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
                  };

                  return getPages().map((page, idx) => {
                    if (page === "...") {
                      return (
                        <span key={`dots-${idx}`} className="page-dots">
                          •••
                        </span>
                      );
                    }
                    return (
                      <button
                        key={page}
                        className={`page-num ${currentPage === page ? "active" : ""}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    );
                  });
                })()}
              </div>

              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                title="Next Page"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Floating Bulk Action Bar ── */}
      {selectedIds.length > 0 && (
        <div className="bulk-action-bar">
          <div className="bulk-left">
            <span className="bulk-count">{selectedIds.length} selected</span>
            <button className="bulk-clear" onClick={() => setSelectedIds([])}>
              ✕ Clear
            </button>
          </div>
          <div className="bulk-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={exportSelected}
            >
              <Download size={14} /> Export Selected
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleBulkDelete}
            >
              <Trash2 size={14} /> Delete Selected
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AppWithToast() {
  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  );
}

export default AppWithToast;
