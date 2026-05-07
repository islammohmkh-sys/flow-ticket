import React, { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

const CREATE_TICKET_FIELD_LABELS_V65 = {
  clientName: "Client Name",
  receivedDate: "Date",
  requester: "Requester",
  module: "Module",
  subsystem: "System",
  status: "Status",
  ticketType: "Type",
  title: "Ticket Ticket Summary",
  description: "Description",
  nextAction: "Action Ticket Summary"
};

function normalizeTicketPayloadV65(ticket = {}) {
  const payload = { ...ticket };
  delete payload.label;
  delete payload.removedLabel;
  return payload;
}

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from "recharts";


const translations = {
  ar: {
    languageLabel: "العربية",
    switchLanguage: "English",
    ticketsTitle: "التذاكر",
    ticketsSubtitle: "إدارة ومتابعة كل التذاكر بشكل احترافي",
    searchPlaceholder: "ابحث برقم التذكرة، العنوان، العميل أو المسؤول...",
    all: "الكل",
    client: "العميل",
    status: "الحالة",
    priority: "الأولوية",
    owner: "المسؤول",
    type: "النوع",
    subsystem: "النظام",
    createTicket: "إنشاء تذكرة",
    emptyTitle: "لا توجد تذاكر مطابقة",
    emptyText: "جرّب تعديل البحث أو الفلاتر لعرض النتائج.",
    totalTickets: "إجمالي التذاكر",
    activeTickets: "نشطة",
    doneTickets: "منتهية",
    urgentTickets: "عاجلة",
    resetFilters: "مسح الفلاتر",
    loading: "جاري التحميل...",
    page: "صفحة",
    next: "التالي",
    previous: "السابق"
  },
  en: {
    languageLabel: "English",
    switchLanguage: "العربية",
    ticketsTitle: "Tickets",
    ticketsSubtitle: "Manage and track all issues with a professional workflow",
    searchPlaceholder: "Search ticket number, title, client, or owner...",
    all: "All",
    client: "Client",
    status: "Status",
    priority: "Priority",
    owner: "Owner",
    type: "Type",
    subsystem: "System",
    createTicket: "Create Ticket",
    emptyTitle: "No matching tickets",
    emptyText: "Try changing the search or filters to show more results.",
    totalTickets: "Total Tickets",
    activeTickets: "Active",
    doneTickets: "Done",
    urgentTickets: "Urgent",
    resetFilters: "Reset filters",
    loading: "Loading...",
    page: "Page",
    next: "Next",
    previous: "Previous"
  }
};

function getInitialLanguage() {
  return localStorage.getItem("flow_ticket_lang") || "ar";
}

function applyDocumentDirection(lang) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
  document.body.setAttribute("dir", dir);
  document.body.classList.toggle("rtl", dir === "rtl");
  document.body.classList.toggle("ltr", dir === "ltr");
}


const API = "/api";
const chartColors = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const dashboardIssueTypeColors = {
  Bug: "#ef4444",
  "Change Request": "#8b5cf6",
  Enhancement: "#10b981",
  Task: "#3b82f6",
  Story: "#06b6d4",
  "Access Request": "#f59e0b"
};

const dashboardStatusColors = {
  Backlog: "#64748b",
  "To Do": "#3b82f6",
  "In Progress": "#8b5cf6",
  "In Review": "#06b6d4",
  Testing: "#f59e0b",
  Done: "#10b981",
  Closed: "#0f172a"
};

const dashboardPriorityColors = {
  Critical: "#dc2626",
  High: "#f97316",
  Medium: "#3b82f6",
  Low: "#10b981"
};

function getDashboardChartColor(title = "", name = "", index = 0) {
  const titleText = String(title).toLowerCase();
  const key = String(name);
  if (titleText.includes("type") || String(title).includes("النوع")) {
    return dashboardIssueTypeColors[key] || chartColors[index % chartColors.length];
  }
  if (titleText.includes("status") || String(title).includes("الحالة")) {
    return dashboardStatusColors[key] || chartColors[index % chartColors.length];
  }
  if (titleText.includes("priority") || String(title).includes("الأولوية")) {
    return dashboardPriorityColors[key] || chartColors[index % chartColors.length];
  }
  return chartColors[index % chartColors.length];
}
const workflowOrder = ["Backlog", "To Do", "In Progress", "In Review", "Testing", "Done", "Closed"];

const themeOptions = [
  { key: "blue", labelAr: "أزرق", labelEn: "Blue", color: "#0052cc" },
  { key: "purple", labelAr: "بنفسجي", labelEn: "Purple", color: "#6554c0" },
  { key: "green", labelAr: "أخضر", labelEn: "Green", color: "#00875a" },
  { key: "dark", labelAr: "داكن", labelEn: "Dark", color: "#172b4d" },
  { key: "red", labelAr: "أحمر", labelEn: "Red", color: "#de350b" }
];

const labels = {
  ar: {
    dashboard: "لوحة التحكم",
    tickets: "التذاكر",
    board: "لوحة المهام",
    newTicket: "إنشاء تذكرة",
    settings: "إعدادات المشروع",
    users: "إدارة المستخدمين",
    audit: "سجل العمليات",
    backups: "النسخ الاحتياطي",
    notifications: "التنبيهات",
    errors: "الأخطاء",
    logout: "تسجيل خروج",
    language: "English",
    themeColor: "لون النظام",
    darkMode: "الوضع الليلي",
    ticketNumber: "رقم التذكرة",
    total: "إجمالي التذاكر",
    implemented: "منجزة",
    active: "نشطة",
    overdue: "متأخرة",
    closureRate: "نسبة الإنجاز",
    bySystem: "حسب النظام",
    byStatus: "حسب الحالة",
    byPriority: "حسب الأولوية",
    byType: "حسب النوع",
    email: "إيميل",
    save: "حفظ",
    create: "إنشاء",
    delete: "حذف",
    comments: "التعليقات",
    activity: "النشاط",
    details: "التفاصيل",
    statusStatistics: "إحصائية الحالات"
  },
  en: {
    dashboard: "Dashboard",
    tickets: "Issues",
    board: "Kanban Board",
    newTicket: "Create Issue",
    settings: "Project Settings",
    users: "Users Management",
    audit: "Audit Log",
    backups: "Backup",
    notifications: "Notifications",
    errors: "Errors",
    logout: "Logout",
    language: "العربية",
    themeColor: "Theme Color",
    darkMode: "Dark Mode",
    ticketNumber: "Ticket Number",
    total: "Total Issues",
    implemented: "Completed",
    active: "Active",
    overdue: "Overdue",
    closureRate: "Done Ratio",
    bySystem: "By System",
    byStatus: "By Status",
    byPriority: "By Priority",
    byType: "By Type",
    email: "Email",
    save: "Save",
    create: "Create",
    delete: "Delete",
    comments: "Comments",
    activity: "Activity",
    details: "Details",
    statusStatistics: "Status Statistics"
  }
};

function getNextStatus(status) {
  const index = workflowOrder.indexOf(status);
  if (index === -1 || index === workflowOrder.length - 1) return null;
  return workflowOrder[index + 1];
}

function getWorkflowActionLabel(status) {
  if (status === "In Review") return "Send to Testing";
  if (status === "Testing") return "Mark as Done";
  if (status === "Done") return "Close Issue";
  if (status === "Closed") return "Closed";
  return "Move Next";
}

function getWorkflowProgress(status) {
  const index = workflowOrder.indexOf(status);
  if (index === -1) return 0;
  return Math.round(((index + 1) / workflowOrder.length) * 100);
}

function getToken() {
  return localStorage.getItem("flow_token");
}

async function api(path, options = {}) {
  try {
    const response = await fetch(API + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...(options.headers || {})
      }
    });

    const contentType = response.headers.get("content-type") || "";
    let data = null;

    if (contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { _raw: text };
      }
    }

    if (!response.ok) {
      const message = (data && (data.error || data.message)) || data?._raw || `${response.status} ${response.statusText}`;
      const err = new Error(message);
      err.status = response.status;
      err.statusText = response.statusText;
      err.body = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.status) throw err;
    throw new Error(`Network error: ${err.message}`);
  }
}


function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.24);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.26);
  } catch {
    // Browser may block audio until first user interaction.
  }
}

function notificationTone(type, severity) {
  if (severity === "urgent" || type === "urgent") return "urgent";
  if (type === "status") return "warning";
  if (type === "ticket") return "success";
  return "info";
}

function listValues(lists, key) {
  return (lists?.[key] || []).map((item) => item.value);
}

const clientPermissions = {
  Admin: ["tickets.view", "tickets.create", "tickets.edit", "tickets.delete", "users.manage", "settings.manage", "audit.view", "errors.view", "backup.manage", "attachments.manage", "notifications.view", "notifications.manage"],
  Manager: ["tickets.view", "tickets.create", "tickets.edit", "audit.view", "attachments.manage", "notifications.view"],
  User: ["tickets.view", "tickets.create", "tickets.edit", "attachments.manage", "notifications.view"],
  Viewer: ["tickets.view"]
};

function can(role, permission) {
  return (clientPermissions[role] || []).includes(permission);
}

function buildMailto(ticket) {
  const subject = encodeURIComponent(`[${ticket.ticketNo}] ${ticket.title}`);
  const body = encodeURIComponent(
    `Ticket Number: ${ticket.ticketNo}
Title: ${ticket.title}
System: ${ticket.subsystem}
Type: ${ticket.ticketType}
Status: ${ticket.status}
Priority: ${ticket.priority}
Owner: ${ticket.owner}
Due: ${ticket.dueDate}

${ticket.description || ""}`
  );

  return `mailto:?subject=${subject}&body=${body}`;
}

function priorityClass(priority) {
  return `badge priority-${String(priority || "").replaceAll(" ", "")}`;
}

function statusClass(status) {
  if (status === "Done" || status === "Closed") return "badge status status-Done";
  if (status === "Blocked") return "badge status status-Blocked";
  if (status === "In Progress") return "badge status status-InProgress";
  return "badge status";
}


class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Unexpected application error" };
  }

  componentDidCatch(error, info) {
    console.error("Flow Ticket UI Error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-fallback" dir="auto">
          <div className="app-fallback-card">
            <h1>حدث خطأ في تحميل الواجهة</h1>
            <p>Application UI failed to load. Please refresh the page.</p>
            <code>{this.state.message}</code>
            <button onClick={() => window.location.reload()}>Reload / إعادة تحميل</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("flow_ticket_lang");
    return saved === "en" || saved === "ar" ? saved : "ar";
  });

  const t = {
    dashboard: language === "ar" ? "لوحة التحكم" : "Dashboard",
    board: language === "ar" ? "لوحة كانبان" : "Kanban Board",
    tickets: language === "ar" ? "التذاكر" : "Issues",
    newTicket: language === "ar" ? "إنشاء تذكرة" : "Create Issue",
    users: language === "ar" ? "المستخدمون" : "Users",
    settings: language === "ar" ? "الإعدادات" : "Settings",
    audit: language === "ar" ? "سجل التدقيق" : "Audit Log",
    backups: language === "ar" ? "النسخ الاحتياطي" : "Backup",
    notifications: language === "ar" ? "الإشعارات" : "Notifications",
    errors: language === "ar" ? "الأخطاء" : "Errors",
    logout: language === "ar" ? "تسجيل الخروج" : "Logout",
    language: language === "ar" ? "English" : "العربية",
    themeColor: language === "ar" ? "الثيم" : "Theme",
    darkMode: language === "ar" ? "الوضع الداكن" : "Dark Mode",
    lightMode: language === "ar" ? "الوضع الفاتح" : "Light Mode",
    soundOn: language === "ar" ? "الصوت مفعل" : "Sound On",
    soundOff: language === "ar" ? "الصوت مكتوم" : "Sound Off",
    ...(typeof translations !== "undefined" && translations?.[language] ? translations[language] : {})
  };

  const lang = language; // compatibility alias for old UI references

  useEffect(() => {
    applyDocumentDirection(language);
    localStorage.setItem("flow_ticket_lang", language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((current) => (current === "ar" ? "en" : "ar"));
  };

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("flow_user") || "null"));
  const [active, setActive] = useState("dashboard");

  const [theme, setTheme] = useState(() => localStorage.getItem("flow_theme") || "blue");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("flow_dark_mode") === "true");
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundMuted, setSoundMuted] = useState(() => localStorage.getItem("flow_notification_sound_muted") === "true");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user || !can(user.role, "notifications.view")) return;
    let alive = true;

    api("/notifications/unread-count")
      .then((data) => alive && setUnreadCount(Number(data.unreadCount || 0)))
      .catch(() => null);

    const socket = io("/", {
      auth: { token: getToken() },
      transports: ["websocket", "polling"]
    });

    socket.on("notification:new", (notification) => {
      setUnreadCount((value) => value + 1);
      setToast(notification);
      if (!soundMuted) playNotificationSound();
      window.dispatchEvent(new CustomEvent("flow:new-notification", { detail: notification }));
      window.setTimeout(() => setToast(null), 4500);
    });

    socket.on("notification:count", (data) => {
      setUnreadCount(Number(data.unreadCount || 0));
    });

    return () => {
      alive = false;
      socket.disconnect();
    };
  }, [user?.id, user?.role, soundMuted]);

  function toggleNotificationSound() {
    setSoundMuted((previous) => {
      const next = !previous;
      localStorage.setItem("flow_notification_sound_muted", String(next));
      return next;
    });
  }

  function changeTheme(value) {
    setTheme(value);
    localStorage.setItem("flow_theme", value);
  }

  function toggleDarkMode() {
    setDarkMode((previous) => {
      const next = !previous;
      localStorage.setItem("flow_dark_mode", String(next));
      return next;
    });
  }

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className={`app theme-${theme} ${darkMode ? "dark-mode" : ""}`} dir={lang === "ar" ? "rtl" : "ltr"}>
      <aside className="sidebar">
        <div className="logo">◆ Flow Ticket</div>

        <nav className="nav">
          <button className={active === "dashboard" ? "active" : ""} onClick={() => setActive("dashboard")}>{t.dashboard || "Dashboard"}</button>
          <button className={active === "board" ? "active" : ""} onClick={() => setActive("board")}>{t.board || "Kanban Board"}</button>
          <button className={active === "tickets" ? "active" : ""} onClick={() => setActive("tickets")}>{t.tickets || "Issues"}</button>
          {can(user.role, "tickets.create") && <button className={active === "new" ? "active" : ""} onClick={() => setActive("new")}>{t.newTicket || "Create Issue"}</button>}
          {can(user.role, "users.manage") && <button className={active === "users" ? "active" : ""} onClick={() => setActive("users")}>{t.users || "Users"}</button>}
          {can(user.role, "settings.manage") && <button className={active === "settings" ? "active" : ""} onClick={() => setActive("settings")}>{t.settings || "Settings"}</button>}
          {can(user.role, "audit.view") && <button className={active === "audit" ? "active" : ""} onClick={() => setActive("audit")}>{t.audit || "Audit Log"}</button>}
          {can(user.role, "backup.manage") && <button className={active === "backups" ? "active" : ""} onClick={() => setActive("backups")}>{t.backups || "Backup"}</button>}
          {can(user.role, "notifications.view") && <button className={active === "notifications" ? "active nav-with-badge" : "nav-with-badge"} onClick={() => setActive("notifications")}><span>{t.notifications || "Notifications"}</span>{unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}</button>}
          {can(user.role, "errors.view") && <button className={active === "errors" ? "active" : ""} onClick={() => setActive("errors")}>{t.errors || "Errors"}</button>}
        </nav>

        <div className="sidebar-user">
          <b>{user.name || user.username || "System Admin"}</b>
          <div style={{ opacity: 0.8 }}>{user.role || "User"}</div>

          <button className="btn ghost" style={{ width: "100%", marginTop: 12 }} onClick={() => setLanguage(lang === "ar" ? "en" : "ar")}>
            {t.language || (language === "ar" ? "English" : "العربية")}
          </button>

          <div className="theme-picker">
            <div className="theme-picker-title">{t.themeColor || "Theme"}</div>
            <div className="theme-dots">
              {themeOptions.map((option) => (
                <button
                  key={option.key}
                  className={`theme-dot ${theme === option.key ? "active" : ""}`}
                  style={{ background: option.color }}
                  title={lang === "ar" ? option.labelAr : option.labelEn}
                  onClick={() => changeTheme(option.key)}
                />
              ))}
            </div>
          </div>

          <button className={`btn ghost dark-mode-toggle ${darkMode ? "active" : ""}`} style={{ width: "100%", marginTop: 10 }} onClick={toggleDarkMode}>
            {darkMode ? "☀️ Light Mode" : "🌙 " + t.darkMode}
          </button>

          {can(user.role, "notifications.view") && (
            <button className="btn ghost" style={{ width: "100%", marginTop: 8 }} onClick={toggleNotificationSound}>
              {soundMuted ? "🔕 Sound Off" : "🔔 Sound On"}
            </button>
          )}

          <button className="btn ghost" style={{ width: "100%", marginTop: 8 }} onClick={() => {
            localStorage.removeItem("flow_token");
            localStorage.removeItem("flow_user");
            setUser(null);
          }}>
            {t.logout}
          </button>
        </div>
      </aside>

      <main className="main">
        {toast && (
          <div className={`live-toast toast-${notificationTone(toast.type, toast.severity)}`}>
            <b>{toast.title}</b>
            <span>{toast.body}</span>
          </div>
        )}
        {active === "dashboard" && <Dashboard t={t} />}
        {active === "board" && <Board t={t} />}
        {active === "tickets" && <Tickets t={t} user={user} />}
        {active === "new" && <CreateIssue t={t} setActive={setActive} />}
        {active === "users" && <UsersManagement t={t} user={user} />}
        {active === "settings" && <Settings t={t} user={user} />}
        {active === "audit" && <AuditLog t={t} />}
        {active === "backups" && <BackupCenter t={t} />}
        {active === "notifications" && <Notifications t={t} unreadCount={unreadCount} setUnreadCount={setUnreadCount} />}
        {active === "errors" && <ErrorLogs t={t} />}
      </main>
    </div>
  );
}

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("برجاء إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    try {
      setLoading(true);
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password })
      });

      localStorage.setItem("flow_token", data.token);
      localStorage.setItem("flow_user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login login-pro" dir="rtl">
      <div className="login-shell">
        <section className="login-panel">
          <div className="login-brand-mark">◆</div>
          <p className="login-eyebrow">FLOW TICKET OPERATIONS</p>
          <h1>تسجيل الدخول</h1>
          <p className="login-subtitle">
            ادخل بيانات حسابك للوصول إلى لوحة التحكم وإدارة التذاكر وسير العمل.
          </p>

          <form className="login-form login-form-pro" onSubmit={submit}>
            {error && <div className="error">{error}</div>}

            <label className="field">
              <span>اسم المستخدم</span>
              <input
                className="input"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="اكتب اسم المستخدم"
                autoComplete="username"
                autoFocus
              />
            </label>

            <label className="field">
              <span>كلمة المرور</span>
              <div className="password-wrap">
                <input
                  className="input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="اكتب كلمة المرور"
                  autoComplete="current-password"
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? "إخفاء" : "إظهار"}
                </button>
              </div>
            </label>

            <button type="submit" className="btn login-submit" disabled={loading}>
              {loading ? "جاري الدخول..." : "دخول النظام"}
            </button>
          </form>
        </section>

        <aside className="login-hero login-hero-pro">
          <div>
            <p className="login-eyebrow light">ENTERPRISE TICKET MANAGEMENT</p>
            <h2>Flow Ticket Enterprise</h2>
            <p>
              منصة احترافية لإدارة التذاكر، متابعة المهام، التحكم في الصلاحيات، وتحليل الأداء التشغيلي.
            </p>
          </div>
          <div className="login-feature-grid">
            <span>Dashboard</span>
            <span>Kanban</span>
            <span>Workflow</span>
            <span>Users</span>
          </div>
        </aside>
      </div>
    </div>
  );
}


function Dashboard({ t }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api("/dashboard").then(setData);
  }, []);

  if (!data) return <p>Loading...</p>;

  const total = data.total || 0;
  const statusData = data.byStatus || [];

  return (
    <>
      <section className="dashboard-hero dashboard-hero-pro">
        <div>
          <div className="eyebrow">FLOW TICKET OPERATIONS</div>
          <h1 className="hero-title">{t.dashboard || "Dashboard"}</h1>
          <p className="hero-subtitle">Executive view for tickets, SLA, workload, issue types, and workflow health.</p>
        </div>

        <div className="hero-health-card">
          <span>System Health</span>
          <strong>{data.closureRate}%</strong>
          <small>Delivery Ratio</small>
        </div>
      </section>

      <div className="kpis dashboard-kpis">
        <KpiPro title={t.total} value={data.total} hint="All issues" tone="total" />
        <KpiPro title={t.implemented} value={data.implemented} hint="Done / Closed" tone="done" />
        <KpiPro title={t.active} value={data.active} hint="In workflow" tone="active" />
        <KpiPro title={t.overdue} value={data.overdue} hint="Past due" tone="overdue" />
        <KpiPro title={t.closureRate} value={`${data.closureRate}%`} hint="Delivery ratio" tone="ratio" />
      </div>

      <div className="dashboard-layout">
        <Chart title={t.byType} data={data.byType || []} wide />
        <PieBlock title="Workflow Status" data={statusData} />

        <div className="card">
          <h3>{t.statusStatistics}</h3>
          <div className="status-list">
            {statusData.map((item, index) => {
              const percent = total ? Math.round((item.value / total) * 100) : 0;
              return (
                <div className="status-row" key={item.name}>
                  <div className="status-row-title">
                    <span className="status-dot" style={{ background: chartColors[index % chartColors.length] }} />
                    <strong>{item.name}</strong>
                    <span>{item.value}</span>
                  </div>
                  <div className="status-progress">
                    <i style={{ width: `${percent}%`, background: chartColors[index % chartColors.length] }} />
                  </div>
                  <small>{percent}%</small>
                </div>
              );
            })}
          </div>
        </div>

        <Chart title={t.byPriority} data={data.byPriority || []} />
        <Chart title="العميل / Client" data={(data.byClient || []).filter((x) => x.name && x.name !== "Unassigned")} wide />
        <Chart title="Owner Workload" data={data.byOwner || []} wide />
        <Chart title={t.bySystem} data={data.bySystem || []} wide />
      </div>
    </>
  );
}

function KpiPro({ title, value, hint, tone = "total" }) {
  return (
    <div className={`kpi-pro kpi-${tone}`}>
      <div className="kpi-pro-label">{title}</div>
      <div className="kpi-pro-value">{value}</div>
      <div className="kpi-pro-hint">{hint}</div>
    </div>
  );
}

function Board({ t }) {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const result = await api("/tickets?limit=500");
      setTickets(Array.isArray(result) ? result : (result.data || []));
    } catch (err) {
      setError(err.message || "Failed to load board");
      setTickets([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function moveNext(ticket, event) {
    event?.stopPropagation?.();

    const next = getNextStatus(ticket.status);
    if (!next) return;

    try {
      setError("");
      const updated = await api(`/tickets/${ticket.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next })
      });

      setTickets((previous) => previous.map((item) => item.id === updated.id ? updated : item));

      if (selected?.id === updated.id) setSelected(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  const safeTickets = Array.isArray(tickets) ? tickets : [];

  return (
    <>
      <Top title={t.board || "Kanban Board"} subtitle="Backlog → To Do → In Progress → In Review → Testing → Done → Closed" />

      {error && <div className="error">{error}</div>}

      <div className="workflow-strip workflow-strip-pro">
        {workflowOrder.map((status, index) => (
          <div className="workflow-step" key={status}>
            <span>{index + 1}</span>
            <strong>{status}</strong>
          </div>
        ))}
      </div>

      <div className="kanban kanban-pro">
        {workflowOrder.map((status) => {
          const columnTickets = safeTickets.filter((ticket) => ticket.status === status);

          return (
            <div className={`column column-pro column-${status.replaceAll(" ", "").toLowerCase()}`} key={status}>
              <div className="column-head">
                <div>
                  <strong>{status}</strong>
                  <small>{columnTickets.length} issues</small>
                </div>
                <span className="badge">{columnTickets.length}</span>
              </div>

              {columnTickets.map((ticket) => {
                const next = getNextStatus(ticket.status);
                const progress = getWorkflowProgress(ticket.status);

                return (
                  <div className="issue-card issue-card-pro" key={ticket.id} onClick={() => setSelected(ticket)}>
                    <div className="issue-card-top">
                      <div className="issue-key">{ticket.ticketNo}</div>
                      <span className={priorityClass(ticket.priority)}>{ticket.priority}</span>
                    </div>

                    <div className="issue-title">{ticket.title}</div>
                    <div className="issue-system">{ticket.subsystem}</div>

                    <div className="workflow-progress">
                      <i style={{ width: `${progress}%` }} />
                    </div>

                    <div className="issue-meta">
                      <span className="muted">{ticket.owner || "Unassigned"}</span>
                      <span className={statusClass(ticket.status)}>{ticket.status}</span>
                    </div>

                    <div className="issue-actions">
                      {next ? (
                        <button className={`btn workflow-btn ${ticket.status === "Done" ? "danger" : ""}`} onClick={(event) => moveNext(ticket, event)}>
                          {getWorkflowActionLabel(ticket.status)}
                        </button>
                      ) : (
                        <span className="closed-pill">Closed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {selected && <IssueDrawer id={selected.id} onClose={() => setSelected(null)} onChanged={load} t={t} />}
    </>
  );
}

function Tickets({ t, user }) {
  const [tickets, setTickets] = useState([]);
  const [lists, setLists] = useState(null);
  const [filters, setFilters] = useState({
    q: "",
    status: "All",
    priority: "All",
    owner: "All",
    type: "All",
    subsystem: "All",
    client: "All"
  });
  const [selected, setSelected] = useState(null);

  async function load() {
    try {
      const params = new URLSearchParams(filters).toString();
      const [ticketData, listData] = await Promise.all([
        api(`/tickets?${params}`),
        api("/lists")
      ]);

      setTickets(Array.isArray(ticketData) ? ticketData : (ticketData.data || []));
      setLists(listData);
    } catch (err) {
      alert(err.message || "Failed to load tickets");
      setTickets([]);
    }
  }

  useEffect(() => {
    load();
  }, [filters.q, filters.status, filters.priority, filters.owner, filters.type, filters.subsystem, filters.client]);

  async function remove(ticket) {
    if (!confirm("Delete issue?")) return;
    await api(`/tickets/${ticket.id}`, { method: "DELETE" });
    load();
  }

  if (!lists) return <p>Loading...</p>;

  return (
    <>
      <div className="toolbar"><a className="btn secondary" href="/api/excel/download" target="_blank" rel="noreferrer">Download Excel</a></div>
      <Top title={t.tickets || "Issues"} subtitle="Advanced issue search and management" />

      <div className="toolbar">
        <div className="filters">
          <input className="input" placeholder="Search issues..." value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} />
          <Filter value={filters.client} items={["All", ...listValues(lists, "clients")]} onChange={(value) => setFilters({ ...filters, client: value })} />
          <Filter value={filters.subsystem} items={["All", ...listValues(lists, "systems")]} onChange={(value) => setFilters({ ...filters, subsystem: value })} />
          <Filter value={filters.status} items={["All", ...listValues(lists, "statuses")]} onChange={(value) => setFilters({ ...filters, status: value })} />
          <Filter value={filters.priority} items={["All", ...listValues(lists, "priorities")]} onChange={(value) => setFilters({ ...filters, priority: value })} />
          <Filter value={filters.owner} items={["All", ...listValues(lists, "owners")]} onChange={(value) => setFilters({ ...filters, owner: value })} />
          <Filter value={filters.type} items={["All", ...listValues(lists, "ticketTypes")]} onChange={(value) => setFilters({ ...filters, type: value })} />
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>{t.ticketNumber}</th>
              <th>Ticket Summary</th>
              <th>Client</th><th>System</th>
              <th>Type</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Owner</th>
              <th>Due</th>
              <th>Email</th>
              {can(user.role, "tickets.delete") && <th>Delete</th>}
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td><button className="btn secondary" onClick={() => setSelected(ticket)}>{ticket.ticketNo}</button></td>
                <td><b>{ticket.title}</b><div className="muted">{ticket.label}</div></td>
                <td>{ticket.clientName || '-'}</td><td>{ticket.subsystem}</td>
                <td>{ticket.ticketType}</td>
                <td><span className={statusClass(ticket.status)}>{ticket.status}</span></td>
                <td><span className={priorityClass(ticket.priority)}>{ticket.priority}</span></td>
                <td>{ticket.owner}</td>
                <td>{ticket.dueDate}</td>
                <td><a className="btn secondary" href={buildMailto(ticket)}>{t.email}</a></td>
                {can(user.role, "tickets.delete") && <td><button className="btn danger" onClick={() => remove(ticket)}>{t.delete}</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <IssueDrawer id={selected.id} onClose={() => setSelected(null)} onChanged={load} t={t} />}
    </>
  );
}

function IssueDrawer({ id, onClose, onChanged, t }) {
  const [data, setData] = useState(null);
  const [lists, setLists] = useState(null);
  const [tab, setTab] = useState("details");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const [ticketData, listData] = await Promise.all([
      api(`/tickets/${id}`),
      api("/lists")
    ]);

    setData(ticketData);
    setLists(listData);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function patch(field, value) {
    try {
      setError("");
      const updated = await api(`/tickets/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: value })
      });

      setData((previous) => ({ ...previous, ticket: updated }));
      onChanged?.();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addComment() {
    if (!comment.trim()) return;

    await api(`/tickets/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: comment })
    });

    setComment("");
    load();
  }

  if (!data || !lists) return null;

  const ticket = data.ticket;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div>
            <div className="issue-key">{t.ticketNumber}: {ticket.ticketNo}</div>
            <h2>{ticket.title}</h2>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className={statusClass(ticket.status)}>{ticket.status}</span>
              <span className={priorityClass(ticket.priority)}>{ticket.priority}</span>
              <span className="badge">{ticket.ticketType}</span>
            </div>

            <div className="drawer-workflow-actions">
              {getNextStatus(ticket.status) ? (
                <button className={`btn workflow-btn ${ticket.status === "Done" ? "danger" : ""}`} onClick={() => patch("status", getNextStatus(ticket.status))}>
                  {getWorkflowActionLabel(ticket.status)}
                </button>
              ) : (
                <span className="closed-pill">Closed</span>
              )}
            </div>
          </div>

          <button className="btn secondary" onClick={onClose}>×</button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="form-grid">
          <Field label="Status">
            <Select value={ticket.status || ""} items={listValues(lists, "statuses")} onChange={(value) => patch("status", value)} />
          </Field>
          <Field label="Priority">
            <Select value={ticket.priority || ""} items={listValues(lists, "priorities")} onChange={(value) => patch("priority", value)} />
          </Field>
          <Field label="Owner">
            <Select value={ticket.owner || ""} items={listValues(lists, "owners")} onChange={(value) => patch("owner", value)} />
          </Field>
          <Field label="Date">
            <input className="input" type="date" value={ticket.dueDate || ""} onChange={(event) => patch("dueDate", event.target.value)} />
          </Field>
        </div>

        <div className="tabs">
          <button className={tab === "details" ? "active" : ""} onClick={() => setTab("details")}>{t.details}</button>
          <button className={tab === "comments" ? "active" : ""} onClick={() => setTab("comments")}>{t.comments}</button>
          <button className={tab === "activity" ? "active" : ""} onClick={() => setTab("activity")}>{t.activity}</button>
          <button className={tab === "attachments" ? "active" : ""} onClick={() => setTab("attachments")}>Attachments</button>
        </div>

        {tab === "details" && (
          <div>
            <h3>Description</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>{ticket.description}</p>
            <h3>Action Summary</h3>
            <p>{ticket.nextAction}</p>
            <h3>System</h3>
            <p>{ticket.subsystem}</p>
          </div>
        )}

        {tab === "comments" && (
          <div>
            <textarea className="input" rows="4" placeholder="Add comment..." value={comment} onChange={(event) => setComment(event.target.value)} />
            <button className="btn" style={{ marginTop: 8 }} onClick={addComment}>Add Comment</button>

            <div style={{ marginTop: 16 }}>
              {data.comments.map((item) => (
                <div className="comment" key={item.id}>
                  <b>{item.user_name || "User"}</b>
                  <div className="muted">{item.created_at}</div>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "activity" && data.activities.map((item) => (
          <div className="activity" key={item.id}>
            <b>{item.action}</b> — {item.details}
            <div className="muted">{item.user_name || "System"} • {item.created_at || item.createdAt}</div>
          </div>
        ))}

        {tab === "attachments" && (
          <Attachments ticketId={ticket.id} files={data.attachments || []} onReload={load} />
        )}
      </div>
    </>
  );
}

function CreateIssue({ t, setActive }) {
  const [lists, setLists] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    requester: "",
    clientName: "",
    subsystem: "",
    ticketType: "Task",
    module: "",
    title: "",
    description: "",
    reply: "قيد الدراسة",
    status: "Backlog",
    priority: "Medium",
    owner: "",
    dueDate: new Date().toISOString().slice(0, 10),
    nextAction: "",
    label: "",
    estimate: 0
  });

  useEffect(() => {
    api("/lists").then(setLists);
  }, []);

  if (!lists) return <p>Loading...</p>;

  function setField(key, value) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      await api("/tickets", {
        method: "POST",
        body: JSON.stringify(normalizeTicketPayloadV65(form))
      });

      setSuccess("تم إنشاء التذكرة بنجاح");
      setTimeout(() => setActive("board"), 500);
    } catch (err) {
      setError(err.message || "Create ticket failed");
    }
  }

  return (
    <>
      <Top title={t.newTicket || "Create Issue"} subtitle="Create a professional issue with workflow metadata" />

      <form className="card" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Requester"><input required className="input" value={form.requester} onChange={(event) => setField("requester", event.target.value)} /></Field>
          <Field label="اسم العميل / Client Name">
            <select className="input" value={form.clientName || ""} onChange={(event) => setField("clientName", event.target.value)}>
              <option value="">اختر العميل</option>
              {listValues(lists, "clients").map((client) => (
                <option key={client} value={client}>{client}</option>
              ))}
            </select>
          </Field>
          <Field label="System"><Select value={form.subsystem} items={listValues(lists, "systems")} onChange={(value) => setField("subsystem", value)} /></Field>
          <Field label="Type"><Select value={form.ticketType} items={listValues(lists, "ticketTypes")} onChange={(value) => setField("ticketType", value)} /></Field>
          <Field label="Module"><input className="input" value={form.module} onChange={(event) => setField("module", event.target.value)} /></Field>
          <Field label="Status"><Select value={form.status} items={listValues(lists, "statuses")} onChange={(value) => setField("status", value)} /></Field>
          <Field label="Priority"><Select value={form.priority} items={listValues(lists, "priorities")} onChange={(value) => setField("priority", value)} /></Field>
          <Field label="Owner"><Select value={form.owner} items={listValues(lists, "owners")} onChange={(value) => setField("owner", value)} /></Field>
          <Field label="Label"><Select value={form.label} items={listValues(lists, "labels")} onChange={(value) => setField("label", value)} /></Field>
          <Field label="Date"><input className="input" type="date" value={form.dueDate} onChange={(event) => setField("dueDate", event.target.value)} /></Field>
          <Field label="Estimate"><input className="input" type="number" value={form.estimate} onChange={(event) => setField("estimate", event.target.value)} /></Field>
          <Field label="Ticket Summary" full><input required className="input" value={form.title} onChange={(event) => setField("title", event.target.value)} /></Field>
          <Field label="Description" full><textarea className="input" rows="6" value={form.description} onChange={(event) => setField("description", event.target.value)} /></Field>
          <Field label="Action Summary" full><input className="input" value={form.nextAction} onChange={(event) => setField("nextAction", event.target.value)} /></Field>
        </div>

        <br />
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
          <button type="submit" className="btn">{t.create}</button>
      </form>
    </>
  );
}


function UsersManagement({ t, user }) {
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ username: "", password: "", name: "", role: "User" });

  async function load() {
    if (user.role !== "Admin") return;
    try {
      const result = await api("/users");
      setRows(Array.isArray(result) ? result : []);
    } catch (err) {
      setMessage(err.message);
      setRows([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function setField(key, value) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function createUser(event) {
    event.preventDefault();
    setMessage("");

    try {
      await api("/users", {
        method: "POST",
        body: JSON.stringify(normalizeTicketPayloadV65(form))
      });

      setForm({ username: "", password: "", name: "", role: "User" });
      setMessage("User created successfully.");
      load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function updateUser(row, patch) {
    setMessage("");

    try {
      await api(`/users/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch)
      });

      load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function resetPassword(row) {
    const password = prompt(`New password for ${row.username}`);
    if (!password) return;

    try {
      await api(`/users/${row.id}/password`, {
        method: "PATCH",
        body: JSON.stringify({ password })
      });
      setMessage("Password updated successfully.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function deleteUser(row) {
    if (!confirm(`Delete user ${row.username}?`)) return;

    try {
      await api(`/users/${row.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  if (user.role !== "Admin") {
    return (
      <>
        <Top title={t.users || "Users Management"} subtitle="Admin only" />
        <div className="card">هذه الشاشة متاحة للـ Admin فقط.</div>
      </>
    );
  }

  return (
    <>
      <Top title={t.users || "Users Management"} subtitle="Create users, assign roles, enable/disable accounts, and reset passwords." />

      {message && <div className={message.includes("success") || message.includes("created") || message.includes("updated") ? "success" : "error"}>{message}</div>}

      <div className="card" style={{ marginBottom: 18 }}>
        <h3>Create New User</h3>
        <form className="form-grid" onSubmit={createUser}>
          <Field label="Full Name">
            <input className="input" value={form.name} onChange={(e) => setField("name", e.target.value)} />
          </Field>
          <Field label="Username">
            <input className="input" value={form.username} onChange={(e) => setField("username", e.target.value)} />
          </Field>
          <Field label="Password">
            <input className="input" type="password" value={form.password} onChange={(e) => setField("password", e.target.value)} />
          </Field>
          <Field label="Role">
            <select className="input" value={form.role} onChange={(e) => setField("role", e.target.value)}>
              <option>Admin</option>
              <option>Manager</option>
              <option>User</option>
              <option>Viewer</option>
            </select>
          </Field>
          <div>
            <button className="btn">Create User</button>
          </div>
        </form>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.username}</td>
                <td>
                  <select className="input" value={row.role} onChange={(e) => updateUser(row, { role: e.target.value })}>
                    <option>Admin</option>
                    <option>Manager</option>
                    <option>User</option>
                    <option>Viewer</option>
                  </select>
                </td>
                <td>
                  <span className={row.isActive ? "badge status-Done" : "badge priority-Critical"}>
                    {row.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
                <td>{row.createdAt}</td>
                <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn secondary" onClick={() => updateUser(row, { isActive: !row.isActive })}>
                    {row.isActive ? "Disable" : "Enable"}
                  </button>
                  <button className="btn secondary" onClick={() => resetPassword(row)}>Reset Password</button>
                  {row.username !== "admin" && <button className="btn danger" onClick={() => deleteUser(row)}>Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}





function Attachments({ ticketId, files, onReload }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage("File must be less than 5 MB");
      return;
    }
    setLoading(true);
    setMessage("");
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataBase64 = String(reader.result).split(",")[1];
        await api(`/tickets/${ticketId}/attachments`, {
          method: "POST",
          body: JSON.stringify({ name: file.name, mimeType: file.type, size: file.size, dataBase64 })
        });
        setMessage("Attachment uploaded successfully.");
        onReload?.();
      } catch (err) {
        setMessage(err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function remove(id) {
    if (!confirm("Delete attachment?")) return;
    await api(`/attachments/${id}`, { method: "DELETE" });
    onReload?.();
  }

  return (
    <div>
      <input className="input" type="file" onChange={upload} disabled={loading} />
      {message && <div className={message.includes("success") ? "success" : "error"}>{message}</div>}
      <div className="chips" style={{ marginTop: 12 }}>
        {(files || []).length === 0 && <span className="muted">No attachments yet.</span>}
        {(files || []).map((file) => (
          <span className="chip" key={file.id}>
            <a href={`/api/attachments/${file.id}/download`} target="_blank" rel="noreferrer">{file.name}</a>
            <button onClick={() => remove(file.id)}>×</button>
          </span>
        ))}
      </div>
    </div>
  );
}

function AuditLog({ t }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { api("/audit-logs").then(setRows).catch(() => setRows([])); }, []);
  return <AdminTable title={t.audit || "Audit Log"} rows={rows} columns={["createdAt", "username", "role", "action", "entity", "entityId"]} />;
}

function ErrorLogs({ t }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { api("/error-logs").then(setRows).catch(() => setRows([])); }, []);
  return <AdminTable title={t.errors || "Errors"} rows={rows} columns={["createdAt", "context", "message", "path", "username"]} />;
}

function Notifications({ t, unreadCount, setUnreadCount }) {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function load(nextPage = 1, append = false) {
    setLoading(true);
    try {
      const result = await api(`/notifications?page=${nextPage}&limit=12`);
      const data = result.data || [];
      setRows((previous) => append ? [...previous, ...data] : data);
      setUnreadCount?.(Number(result.unreadCount || 0));
      setHasMore(Boolean(result.pagination?.hasMore));
      setPage(nextPage);
    } catch (err) {
      setMessage(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, false);
    const handler = (event) => {
      const notification = event.detail;
      setRows((previous) => [notification, ...previous.filter((item) => item.id !== notification.id)]);
    };
    window.addEventListener("flow:new-notification", handler);
    return () => window.removeEventListener("flow:new-notification", handler);
  }, []);

  async function markRead(row) {
    await api(`/notifications/${row.id}/read`, { method: "PATCH" });
    setRows((previous) => previous.map((item) => item.id === row.id ? { ...item, read: true } : item));
    setUnreadCount?.(Math.max(0, unreadCount - (row.read ? 0 : 1)));
  }

  async function markAllRead() {
    const result = await api("/notifications/read-all", { method: "PATCH" });
    setRows((previous) => previous.map((item) => ({ ...item, read: true })));
    setUnreadCount?.(Number(result.unreadCount || 0));
  }

  async function remove(row) {
    if (!confirm("Delete this notification from your inbox only?")) return;
    const result = await api(`/notifications/${row.id}`, { method: "DELETE" });
    setRows((previous) => previous.filter((item) => item.id !== row.id));
    setUnreadCount?.(Number(result.unreadCount || 0));
  }

  return (
    <>
      <Top title={t.notifications || "Notifications"} subtitle="Real-time notification center with sound alerts" />

      <div className="notification-toolbar">
        <div>
          <strong>{unreadCount || 0}</strong>
          <span className="muted"> unread notifications</span>
        </div>
        <div className="toolbar-actions">
          <button className="btn secondary" onClick={() => load(1, false)} disabled={loading}>Refresh</button>
          <button className="btn" onClick={markAllRead} disabled={!unreadCount}>Mark all as read</button>
        </div>
      </div>

      {message && <div className="error">{message}</div>}

      <div className="notification-center">
        {rows.map((row) => {
          const tone = notificationTone(row.type, row.severity);
          return (
            <div className={`notification-card notification-${tone} ${row.read ? "read" : "unread"}`} key={row.id}>
              <div className="notification-icon">{tone === "urgent" ? "!" : tone === "warning" ? "↻" : tone === "success" ? "+" : "i"}</div>
              <div className="notification-body">
                <div className="notification-head">
                  <h3>{row.title}</h3>
                  {!row.read && <span className="unread-dot">New</span>}
                </div>
                <p>{row.body}</p>
                <div className="notification-meta">
                  <span>{new Date(row.createdAt).toLocaleString()}</span>
                  {row.ticketId && <span>Issue: {row.ticketId}</span>}
                </div>
                <div className="notification-actions">
                  {!row.read && <button className="btn secondary" onClick={() => markRead(row)}>Mark read</button>}
                  <button className="btn danger" onClick={() => remove(row)}>Delete for me</button>
                </div>
              </div>
            </div>
          );
        })}

        {!loading && rows.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h3>No notifications yet</h3>
            <p>New issue updates will appear here instantly.</p>
          </div>
        )}
      </div>

      {loading && <div className="skeleton-list"><div /><div /><div /></div>}
      {hasMore && <button className="btn secondary load-more" onClick={() => load(page + 1, true)} disabled={loading}>Load more</button>}
    </>
  );
}

function BackupCenter({ t }) {
  const [backups, setBackups] = useState(null);
  const [message, setMessage] = useState("");
  useEffect(() => { api("/backups").then(setBackups).catch(() => setBackups([])); }, []);

  async function restore(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!confirm("Restore backup? Current tickets/lists/comments may be replaced.")) return;
    const text = await file.text();
    await api("/backup/restore", { method: "POST", body: text });
    setMessage("Backup restored successfully.");
  }

  return (
    <>
      <Top title={t.backups || "Backup"} subtitle="Export and restore operational data" />
      {message && <div className="success">{message}</div>}
      <div className="card">
        <a className="btn" href="/api/backup/export" target="_blank" rel="noreferrer">Export JSON Backup</a>
        <label className="btn secondary" style={{ marginInlineStart: 8 }}>
          Restore JSON
          <input type="file" accept="application/json" style={{ display: "none" }} onChange={restore} />
        </label>
      </div>
      <AdminTable title="Recent Backups" rows={backups} columns={["createdAt", "reason"]} />
    </>
  );
}

function AdminTable({ title, rows, columns }) {
  if (!rows) return <p>Loading...</p>;
  return (
    <>
      <Top title={title} subtitle="Admin monitoring" />
      <div className="table-card">
        <table>
          <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={columns.length}>No data yet.</td></tr>}
            {rows.map((row) => (
              <tr key={row.id || row._id}>
                {columns.map((column) => <td key={column}>{typeof row[column] === "object" ? JSON.stringify(row[column]) : String(row[column] || "")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Settings({ t, user }) {
  const [lists, setLists] = useState(null);

  async function load() {
    setLists(await api("/lists"));
  }

  useEffect(() => {
    load();
  }, []);

  if (!lists) return <p>Loading...</p>;

  return (
    <>
      <Top title={t.settings || "Settings"} subtitle={user.role === "Admin" ? "Manage workflow lists and project metadata" : "View project lists"} />

      <div className="list-grid">
        {["systems", "clients", "statuses", "priorities", "replies", "owners", "ticketTypes", "labels"].map((key) => (
          <ListManager key={key} listKey={key} items={lists[key] || []} canEdit={user.role === "Admin"} onReload={load} t={t} />
        ))}
      </div>
    </>
  );
}

function ListManager({ listKey, items, canEdit, onReload, t }) {
  const [value, setValue] = useState("");

  async function add() {
    if (!value.trim()) return;

    await api(`/lists/${listKey}`, {
      method: "POST",
      body: JSON.stringify({ value })
    });

    setValue("");
    onReload();
  }

  async function del(id) {
    await api(`/lists/${listKey}/${id}`, { method: "DELETE" });
    onReload();
  }

  return (
    <div className="card">
      <h3>{listKey}</h3>

      {canEdit && (
        <div style={{ display: "flex", gap: 8 }}>
          <input className="input" value={value} onChange={(event) => setValue(event.target.value)} placeholder="New value..." />
          <button className="btn" onClick={add}>{t.create}</button>
        </div>
      )}

      <div className="chips">
        {items.map((item) => (
          <span className="chip" key={item.id}>
            {item.value}
            {canEdit && <button onClick={() => del(item.id)}>×</button>}
          </span>
        ))}
      </div>
    </div>
  );
}


function HeaderClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const date = now.toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="header-clock">
      <div className="clock-icon">⏱</div>
      <div>
        <div className="clock-time">{time}</div>
        <div className="clock-date">{date}</div>
      </div>
    </div>
  );
}

function Top({ title, subtitle }) {
  return (
    <div className="topbar">
      <div>
        <h1 className="title">{title}</h1>
        <div className="muted">{subtitle}</div>
      </div>
      <HeaderClock />
    </div>
  );
}

function Chart({ title, data, wide }) {
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className={`card chart-card dashboard-chart-pro ${wide ? "wide" : ""}`}>
      <div className="dashboard-chart-head">
        <div>
          <h3>{title}</h3>
          <p className="muted">Live distribution based on current tickets</p>
        </div>
      </div>

      <div style={{ height: 340 }}>
        <ResponsiveContainer>
          <BarChart data={safeData} margin={{ top: 18, right: 20, left: 8, bottom: 18 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(15, 23, 42, 0.04)" }}
              contentStyle={{ background: "#0f172a", border: "none", borderRadius: 14, color: "#ffffff", boxShadow: "0 18px 42px rgba(15,23,42,.24)" }}
              labelStyle={{ color: "#bfdbfe", fontWeight: 800 }}
            />
            <Bar dataKey="value" radius={[14, 14, 0, 0]} animationDuration={700}>
              {safeData.map((entry, index) => (
                <Cell key={`bar-${entry.name}-${index}`} fill={getDashboardChartColor(title, entry.name, index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="dashboard-chart-legend">
        {safeData.map((entry, index) => (
          <span key={`${entry.name}-${index}`}>
            <i style={{ background: getDashboardChartColor(title, entry.name, index) }} />
            {entry.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function PieBlock({ title, data }) {
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="card chart-card dashboard-chart-pro dashboard-pie-pro">
      <div className="dashboard-chart-head">
        <div>
          <h3>{title}</h3>
          <p className="muted">Workflow spread and volume</p>
        </div>
      </div>

      <div style={{ height: 320 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={safeData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={112} paddingAngle={4} label>
              {safeData.map((entry, index) => (
                <Cell key={`pie-${entry.name}-${index}`} fill={getDashboardChartColor(title, entry.name, index)} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "none", borderRadius: 14, color: "#ffffff", boxShadow: "0 18px 42px rgba(15,23,42,.24)" }}
              labelStyle={{ color: "#bfdbfe", fontWeight: 800 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="dashboard-chart-legend">
        {safeData.map((entry, index) => (
          <span key={`${entry.name}-${index}`}>
            <i style={{ background: getDashboardChartColor(title, entry.name, index) }} />
            {entry.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function Filter({ value, items, onChange }) {
  return (
    <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
      {items.map((item) => <option key={item}>{item}</option>)}
    </select>
  );
}

function Select({ value, items, onChange }) {
  return (
    <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
      {items.map((item) => <option key={item}>{item}</option>)}
    </select>
  );
}

function Field({ label, children, full }) {
  return (
    <label className={`field ${full ? "full" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}


export default function App() {
  return (
    <AppErrorBoundary>
      <AppContent />
    </AppErrorBoundary>
  );
}
