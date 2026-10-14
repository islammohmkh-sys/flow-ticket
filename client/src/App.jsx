import { ticketBusinessDate, buildTicketTrend } from "./ticketDates.js";
import React, { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";





function NotificationBellIcon({ size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>;
}

function getNotificationKey(notification) {
  if (!notification) return "";
  return String(notification._id || notification.id || notification.notificationId || "");
}

function getNotificationSignature(notification) {
  if (!notification) return "";
  return [
    notification._id || notification.id || notification.notificationId || "",
    notification.ticketId || notification.issueId || "",
    notification.title || "",
    notification.message || notification.body || "",
    notification.createdAt || notification.date || ""
  ].map((x) => String(x || "").trim()).join("|");
}

function getDeletedNotificationStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem("flow_deleted_notifications_v2") || "{}");
    return {
      ids: new Set((parsed.ids || []).map(String)),
      signatures: new Set((parsed.signatures || []).map(String))
    };
  } catch {
    return { ids: new Set(), signatures: new Set() };
  }
}

function saveDeletedNotification(notificationOrId) {
  const store = getDeletedNotificationStore();
  if (typeof notificationOrId === "object") {
    const id = getNotificationKey(notificationOrId);
    const signature = getNotificationSignature(notificationOrId);
    if (id) store.ids.add(id);
    if (signature) store.signatures.add(signature);
  } else {
    const id = String(notificationOrId || "");
    if (id) store.ids.add(id);
  }
  localStorage.setItem("flow_deleted_notifications_v2", JSON.stringify({
    ids: [...store.ids],
    signatures: [...store.signatures]
  }));
}

function isNotificationDeleted(notification) {
  const store = getDeletedNotificationStore();
  const id = getNotificationKey(notification);
  const signature = getNotificationSignature(notification);
  return (id && store.ids.has(id)) || (signature && store.signatures.has(signature));
}

function filterDeletedNotifications(list = []) {
  return Array.isArray(list) ? list.filter((item) => !isNotificationDeleted(item)) : [];
}

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
  LineChart,
  Line,
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
const chartColors = ["#7DA3F7", "#8CCF9B", "#EBC274", "#D97A7A", "#B7A3F5", "#7BAFD4"];

const dashboardIssueTypeColors = {
  Bug: "#D97A7A",
  "Change Request": "#B7A3F5",
  Enhancement: "#8CCF9B",
  Task: "#7DA3F7",
  Story: "#7BAFD4",
  "Access Request": "#EBC274"
};

const dashboardStatusColors = {
  Backlog: "#64748b",
  "To Do": "#7DA3F7",
  "In Progress": "#B7A3F5",
  "In Review": "#7BAFD4",
  Testing: "#EBC274",
  Done: "#8CCF9B",
  Closed: "#243B53"
};

const dashboardPriorityColors = {
  Critical: "#D97A7A",
  High: "#D8A657",
  Medium: "#7DA3F7",
  Low: "#8CCF9B"
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
  { key: "blue", labelAr: "أزرق", labelEn: "Blue", color: "#5B8DEF" },
  { key: "purple", labelAr: "بنفسجي", labelEn: "Purple", color: "#7C8DB5" },
  { key: "green", labelAr: "أخضر", labelEn: "Green", color: "#7EBE8E" },
  { key: "dark", labelAr: "داكن", labelEn: "Dark", color: "#243B53" },
  { key: "red", labelAr: "أحمر", labelEn: "Red", color: "#D97A7A" }
];

const labels = {
  ar: {
    dashboard: "لوحة التحكم",
    tickets: "التذاكر",
    board: "لوحة سير العمل",
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
    board: "Workflow Board",
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

// Expired or malformed cached sessions should never leave the UI in a logged-in state.
function hasUsableCachedToken() {
  const token = getToken();
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now() + 5000;
  } catch {
    return false;
  }
}

function clearCachedSession() {
  localStorage.removeItem("flow_token");
  localStorage.removeItem("flow_user");
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
      // Login failures should display their own error; expired authenticated
      // sessions must return to login rather than rendering empty dashboards.
      if (response.status === 401 && path !== "/auth/login" &&
          (data?.error === "Invalid token" || data?.error === "Unauthorized")) {
        const requestedToken = options.headers?.Authorization?.replace(/^Bearer /, "") || getToken();
        if (requestedToken && requestedToken === getToken()) {
          clearCachedSession();
          window.dispatchEvent(new Event("flow:session-expired"));
        }
      }
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
    board: language === "ar" ? "لوحة سير العمل" : "Workflow Board",
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

  const [user, setUser] = useState(() => {
    if (!hasUsableCachedToken()) {
      clearCachedSession();
      return null;
    }
    try { return JSON.parse(localStorage.getItem("flow_user") || "null"); }
    catch { clearCachedSession(); return null; }
  });

  useEffect(() => {
    const expire = () => setUser(null);
    window.addEventListener("flow:session-expired", expire);
    const check = () => {
      if (getToken() && !hasUsableCachedToken()) {
        clearCachedSession();
        setUser(null);
      }
    };
    const interval = window.setInterval(check, 30000);
    window.addEventListener("focus", check);
    return () => {
      window.removeEventListener("flow:session-expired", expire);
      window.removeEventListener("focus", check);
      window.clearInterval(interval);
    };
  }, []);
  const [active, setActive] = useState("dashboard");

  const [theme, setTheme] = useState(() => localStorage.getItem("flow_theme") || "blue");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("flow_dark_mode") === "true");
  const [unreadCount, setUnreadCount] = useState(0);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  const markNotificationRead = async (id) => {
    const notificationId = String(id || "");
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (error) {
      console.error("Mark notification read failed:", error);
    }

    setNotifications((current) =>
      current.map((item) =>
        String(item._id || item.id) === notificationId
          ? { ...item, read: true, isRead: true }
          : item
      )
    );

    setUnreadCount((current) => Math.max(0, current - 1));
  };

  const deleteNotification = async (notificationOrId) => {
    const notificationId = typeof notificationOrId === "object"
      ? getNotificationKey(notificationOrId)
      : String(notificationOrId || "");

    saveDeletedNotification(notificationOrId);

    setNotifications((current) =>
      filterDeletedNotifications(
        current.filter((item) => {
          if (typeof notificationOrId === "object") {
            return getNotificationSignature(item) !== getNotificationSignature(notificationOrId)
              && getNotificationKey(item) !== getNotificationKey(notificationOrId);
          }
          return getNotificationKey(item) !== notificationId;
        })
      )
    );

    setUnreadCount((current) => Math.max(0, current - 1));

    if (notificationId) {
      try {
        await fetch(`/api/notifications/${encodeURIComponent(notificationId)}`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
      } catch (error) {
        console.error("Delete notification failed:", error);
      }
    }
  };
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
    <div className={`app enterprise-reconciled theme-${theme} ${darkMode ? "dark-mode" : ""}`} dir={lang === "ar" ? "rtl" : "ltr"}>
      <aside className="sidebar enterprise-sidebar">
        <div className="logo enterprise-brand"><span className="brand-mark">◆</span><span>Flow Ticket<small>Enterprise</small></span></div>

        <div className="enterprise-nav-caption">{lang === "ar" ? "القائمة الرئيسية" : "MAIN MENU"}</div>
        <nav className="nav enterprise-navigation" aria-label={lang === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
          <button className={active === "dashboard" ? "active" : ""} onClick={() => setActive("dashboard")}><span className="nav-icon" aria-hidden="true"><NavigationIcon name="dashboard" /></span>{t.dashboard || "Dashboard"}</button>
          <button className={active === "board" ? "active" : ""} onClick={() => setActive("board")}><span className="nav-icon" aria-hidden="true"><NavigationIcon name="board" /></span>{t.board || "Workflow Board"}</button>
          <button className={active === "tickets" ? "active" : ""} onClick={() => setActive("tickets")}><span className="nav-icon" aria-hidden="true"><NavigationIcon name="tickets" /></span>{t.tickets || "Issues"}</button>
          {can(user.role, "tickets.create") && <button className={active === "new" ? "active" : ""} onClick={() => setActive("new")}><span className="nav-icon" aria-hidden="true"><NavigationIcon name="new" /></span>{t.newTicket || "Create Issue"}</button>}
          {can(user.role, "users.manage") && <button className={active === "users" ? "active" : ""} onClick={() => setActive("users")}><span className="nav-icon" aria-hidden="true"><NavigationIcon name="users" /></span>{t.users || "Users"}</button>}
          {can(user.role, "settings.manage") && <button className={active === "settings" ? "active" : ""} onClick={() => setActive("settings")}><span className="nav-icon" aria-hidden="true"><NavigationIcon name="settings" /></span>{t.settings || "Settings"}</button>}
          {can(user.role, "audit.view") && <button className={active === "audit" ? "active" : ""} onClick={() => setActive("audit")}><span className="nav-icon" aria-hidden="true"><NavigationIcon name="audit" /></span>{t.audit || "Audit Log"}</button>}
          {can(user.role, "backup.manage") && <button className={active === "backups" ? "active" : ""} onClick={() => setActive("backups")}><span className="nav-icon" aria-hidden="true"><NavigationIcon name="backups" /></span>{t.backups || "Backup"}</button>}
          {can(user.role, "notifications.view") && <button className={active === "notifications" ? "active nav-with-badge" : "nav-with-badge"} onClick={() => setActive("notifications")}><span className="nav-icon" aria-hidden="true"><NotificationBellIcon size={19}/></span><span>{t.notifications || "Notifications"}</span>{unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}</button>}
          {can(user.role, "errors.view") && <button className={active === "errors" ? "active" : ""} onClick={() => setActive("errors")}><span className="nav-icon" aria-hidden="true"><NavigationIcon name="errors" /></span>{t.errors || "Errors"}</button>}
        </nav>
        <div className="enterprise-sidebar-footer"><span className="enterprise-status-dot" />{lang === "ar" ? "مساحة عمل الفريق" : "Team workspace"}<small>FLOW TICKET · v7.8.2</small></div>
      </aside>

      <main className="main enterprise-workspace">
        <header className="enterprise-account-bar enterprise-global-header" aria-label={lang === "ar" ? "شريط حساب المستخدم" : "User account toolbar"}>
          <div className="enterprise-header-context"><span className="enterprise-header-product">FLOW TICKET <b>ENTERPRISE</b></span><span className="enterprise-header-separator">/</span><strong>{({dashboard:t.dashboard,board:t.board,tickets:t.tickets,new:t.newTicket,users:t.users,settings:t.settings,audit:t.audit,backups:t.backups,notifications:t.notifications,errors:t.errors})[active]}</strong></div>
          <div className="enterprise-account-tools">
            {can(user.role, "notifications.view") && <button type="button" className="account-icon-btn" title={t.notifications || "Notifications"} aria-label={t.notifications || "Notifications"} onClick={() => {setActive("notifications");setAccountMenuOpen(false);}}><NotificationBellIcon size={21}/>{unreadCount > 0 && <span className="account-count">{unreadCount}</span>}</button>}
            <button type="button" className="account-icon-btn" onClick={toggleDarkMode} title={darkMode ? (lang === "ar" ? "الوضع الفاتح" : "Light mode") : (lang === "ar" ? "الوضع الداكن" : "Dark mode")} aria-label={lang === "ar" ? "تغيير الوضع" : "Toggle dark mode"}>{darkMode ? "☀" : "☾"}</button>
            <div className="account-menu-anchor">
              <button type="button" className="account-trigger" aria-haspopup="menu" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((value) => !value)}>
                <span className="account-avatar">{String(user.name || user.username || "SA").trim().split(/\s+/).slice(0,2).map((part) => part[0]).join("").toUpperCase()}</span>
                <span className="account-trigger-name">{user.name || user.username || "System Admin"}</span><span aria-hidden="true">⌄</span>
              </button>
              {accountMenuOpen && <>
                <button type="button" className="account-menu-dismiss" aria-label="Close account menu" onClick={() => {setAccountMenuOpen(false);setAppearanceOpen(false);}} />
                <div className="account-dropdown" role="menu">
                  <div className="account-dropdown-profile"><span className="account-avatar account-avatar-lg">{String(user.name || user.username || "SA").trim().split(/\s+/).slice(0,2).map((part) => part[0]).join("").toUpperCase()}</span><span><strong>{user.name || user.username || "System Admin"}</strong><small>{user.role || "User"}</small></span></div>
                  {can(user.role,"settings.manage") && <button type="button" className="account-menu-item" role="menuitem" onClick={() => {setActive("settings");setAccountMenuOpen(false);}}><span aria-hidden="true">⚙</span>{t.settings || "Settings"}</button>}
                  <button type="button" className="account-menu-item" aria-expanded={appearanceOpen} onClick={() => setAppearanceOpen(v=>!v)}><span aria-hidden="true">◉</span>{lang === "ar" ? "تخصيص الواجهة" : "Customize appearance"}<span className="account-menu-chevron">{appearanceOpen ? "⌃" : "⌄"}</span></button>
                  {appearanceOpen && <div className="account-appearance-panel"><div className="account-setting-label">{t.themeColor || (lang === "ar" ? "لون النظام" : "Theme color")}</div><div className="account-theme-dots">{themeOptions.map((option)=><button key={option.key} type="button" className={`account-theme-dot ${theme===option.key?"selected":""}`} style={{background:option.color}} title={lang==="ar"?option.labelAr:option.labelEn} aria-label={lang==="ar"?option.labelAr:option.labelEn} aria-pressed={theme===option.key} onClick={()=>changeTheme(option.key)}/>)}</div></div>}
                  <div className="account-menu-divider" />
                  <button type="button" className="account-menu-item" onClick={() => setLanguage(lang === "ar" ? "en" : "ar")}><span aria-hidden="true">◎</span>{lang === "ar" ? "اللغة: العربية" : "Language: English"}<span className="account-menu-chevron">{lang === "ar" ? "English" : "العربية"}</span></button>
                  <button type="button" className="account-menu-item" onClick={toggleDarkMode}><span aria-hidden="true">☾</span>{lang === "ar" ? "الوضع الداكن" : "Dark mode"}<span className={`account-switch ${darkMode?"on":""}`} aria-hidden="true" /></button>
                  {can(user.role,"notifications.view") && <button type="button" className="account-menu-item" onClick={toggleNotificationSound}><NotificationBellIcon size={18}/>{lang === "ar" ? "صوت الإشعارات" : "Notification sound"}<span className={`account-switch ${!soundMuted?"on":""}`} aria-hidden="true" /></button>}
                  <div className="account-menu-divider" />
                  <button type="button" className="account-menu-item account-logout" onClick={() => {localStorage.removeItem("flow_token");localStorage.removeItem("flow_user");setAccountMenuOpen(false);setUser(null);}}><span aria-hidden="true">⇥</span>{t.logout}</button>
                </div>
              </>}
            </div>
          </div>
        </header>
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
  const [loginLang, setLoginLang] = useState("ar");
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

  const ar = loginLang === "ar";
  return (
    <main className="login login-pro login-v770" dir={ar ? "rtl" : "ltr"}>
      <div className="login-shell">
        <aside className="login-hero login-hero-pro" aria-label={ar ? "مميزات النظام" : "Platform features"}>
          <div className="login-hero-content">
            <div className="login-hero-brand"><span className="login-hero-logo" aria-hidden="true">◆</span><span>Flow Ticket <small>Enterprise</small></span></div>
            <h2>{ar ? "منصة احترافية لإدارة التذاكر" : "A smarter way to manage tickets"}</h2>
            <p>{ar ? "إدارة الطلبات، متابعة المهام وسير العمل في مكان واحد، بسهولة ووضوح." : "Manage requests, track tasks and coordinate workflows in one secure workspace."}</p>
            <div className="login-benefits">
              <div><span className="login-benefit-icon" aria-hidden="true">⌘</span><span><strong>{ar ? "سير عمل مرن" : "Flexible workflows"}</strong><small>{ar ? "تنظيم ومتابعة مراحل العمل" : "Organize and track every stage"}</small></span></div>
              <div><span className="login-benefit-icon" aria-hidden="true">▥</span><span><strong>{ar ? "متابعة لحظية" : "Real-time visibility"}</strong><small>{ar ? "لوحات تحكم وتقارير واضحة" : "Dashboards and clear reports"}</small></span></div>
              <div><span className="login-benefit-icon" aria-hidden="true">◇</span><span><strong>{ar ? "صلاحيات وأمان" : "Secure access"}</strong><small>{ar ? "إدارة المستخدمين والصلاحيات" : "Users and access controls"}</small></span></div>
              <div><span className="login-benefit-icon" aria-hidden="true">⚡</span><span><strong>{ar ? "تجربة سهلة" : "Easy to use"}</strong><small>{ar ? "واجهة عملية لتنفيذ المهام" : "A focused experience for your team"}</small></span></div>
            </div>
          </div>
          <div className="login-hero-bottom">FLOW TICKET · ENTERPRISE WORKSPACE</div>
        </aside>
        <section className="login-panel">
          <div className="login-lang-row" role="group" aria-label="Language">
            <button type="button" className={ar ? "login-language active" : "login-language"} onClick={() => setLoginLang("ar")} aria-pressed={ar}>العربية</button>
            <button type="button" className={!ar ? "login-language active" : "login-language"} onClick={() => setLoginLang("en")} aria-pressed={!ar}>English</button>
          </div>
          <div className="login-panel-content">
            <div className="login-form-brand"><span className="login-brand-mark" aria-hidden="true">◆</span><span>Flow Ticket <small>Enterprise</small></span></div>
            <p className="login-eyebrow">FLOW TICKET OPERATIONS</p>
            <h1>{ar ? "مرحباً بعودتك" : "Welcome back"}</h1>
            <p className="login-subtitle">{ar ? "سجّل الدخول للوصول إلى نظام إدارة التذاكر" : "Sign in to access your ticket management workspace"}</p>
            <form className="login-form login-form-pro" onSubmit={submit}>
              {error && <div className="error" role="alert">{error}</div>}
              <label className="field"><span>{ar ? "اسم المستخدم" : "Username"}</span>
                <div className="login-input-wrap"><span className="login-input-icon" aria-hidden="true">♙</span><input className="input" value={username} onChange={e => setUsername(e.target.value)} placeholder={ar ? "أدخل اسم المستخدم" : "Enter your username"} autoComplete="username" required autoFocus /></div>
              </label>
              <label className="field"><span>{ar ? "كلمة المرور" : "Password"}</span>
                <div className="login-input-wrap password-wrap"><span className="login-input-icon" aria-hidden="true">♧</span><input className="input" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={ar ? "أدخل كلمة المرور" : "Enter your password"} autoComplete="current-password" required /><button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? (ar ? "إخفاء كلمة المرور" : "Hide password") : (ar ? "إظهار كلمة المرور" : "Show password")}>{showPassword ? (ar ? "إخفاء" : "Hide") : (ar ? "إظهار" : "Show")}</button></div>
              </label>
              <button type="submit" className="btn login-submit" disabled={loading}>{loading ? (ar ? "جاري تسجيل الدخول..." : "Signing in...") : (ar ? "دخول النظام" : "Sign in")} <span aria-hidden="true">←</span></button>
            </form>
          </div>
          <div className="login-panel-footer">Flow Ticket Enterprise © 2026 · {ar ? "جميع الحقوق محفوظة" : "All rights reserved"}</div>
        </section>
      </div>
    </main>
  );
}


function Dashboard({ t }) {
  const [data, setData] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [trendMonths, setTrendMonths] = useState(6);
  const [trendOffset, setTrendOffset] = useState(0);
  const isArabic = t.dashboard === "لوحة التحكم";

  async function loadDashboard() {
    setRefreshing(true);
    try {
      const [summary, issueResponse] = await Promise.all([api("/dashboard"), api("/tickets?limit=500")]);
      setData(summary);
      setTickets(Array.isArray(issueResponse) ? issueResponse : (issueResponse.data || []));
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load dashboard");
    } finally { setRefreshing(false); }
  }
  useEffect(() => { loadDashboard(); }, []);
  if (!data) return <div className="card" role="status">{error || (isArabic ? "جاري تحميل لوحة التحكم..." : "Loading dashboard...")}</div>;

  const todayISO = new Date().toISOString().slice(0, 10);
  const filteredTickets = tickets.filter(ticket => {
    const ownerMatch = ownerFilter === "all" || (ticket.owner || "") === ownerFilter;
    const statusMatch = statusFilter === "all" || (ticket.status || "") === statusFilter;
    const created = ticketBusinessDate(ticket);
    const periodMatch = period === "all" || (created && created >= new Date(Date.now() - Number(period) * 86400000));
    return ownerMatch && statusMatch && periodMatch;
  });
  const filteredTotal = filteredTickets.length;
  const completedTickets = filteredTickets.filter(ticket => ["Done", "Closed"].includes(ticket.status) || ticket.reply === "تم التنفيذ");
  const openTickets = filteredTickets.filter(ticket => !["Done", "Closed"].includes(ticket.status));
  const lateTickets = openTickets.filter(ticket => ticket.dueDate && String(ticket.dueDate).slice(0,10) < todayISO);
  const upcomingTickets = openTickets.filter(ticket => {
    if (!ticket.dueDate) return false;
    const days = Math.ceil((new Date(String(ticket.dueDate).slice(0,10) + "T00:00:00") - new Date(todayISO + "T00:00:00")) / 86400000);
    return days >= 0 && days <= 3;
  });
  const grouped = key => Object.entries(filteredTickets.reduce((acc,ticket) => {const name = ticket[key] || "Unassigned";acc[name] = (acc[name] || 0) + 1;return acc;}, {})).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  const filteredStatus = grouped("status");
  const owners = [...new Set(tickets.map(ticket=>ticket.owner).filter(Boolean))].sort();
  const statuses = [...new Set(tickets.map(ticket=>ticket.status).filter(Boolean))].sort();
  function downloadPerformanceCsv() {
    const headings = ["Ticket ID","Summary","Owner","Status","Priority","Created","Due Date","SLA"];
    const rows = filteredTickets.map(ticket => [ticket.ticketNo || "", ticket.title || "", ticket.owner || "", ticket.status || "", ticket.priority || "", ticket.receivedDate || ticket.createdAt || "", ticket.dueDate || "", !ticket.dueDate ? "No due date" : lateTickets.includes(ticket) ? "Overdue" : "Not overdue"]);
    const csv = "\uFEFF" + [headings,...rows].map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8;"}));
    const anchor = document.createElement("a");anchor.href=url;anchor.download=`flow-ticket-report-${todayISO}.csv`;anchor.click();URL.revokeObjectURL(url);
  }
  const total = filteredTotal;
  const statusData = filteredStatus;
  const statusColors = { Closed: "#7EBE8E", Done: "#7EBE8E", "To Do": "#EBC274", Backlog: "#94A3B8", "In Review": "#7BAFD4", "In Progress": "#B7A3F5" };
  // Offset 0 ends with the current month; previous/next moves the calendar window.
  const trendEnd = new Date(new Date().getFullYear(), new Date().getMonth() + trendOffset * trendMonths, 1);
  const trendStart = new Date(trendEnd.getFullYear(), trendEnd.getMonth() - trendMonths + 1, 1);
  const trendData = buildTicketTrend(filteredTickets, trendStart, trendMonths, {
    locale: isArabic ? "ar" : "en",
    isCompleted: ticket => completedTickets.includes(ticket),
    isOverdue: ticket => lateTickets.includes(ticket)
  });
  const recent = [...filteredTickets].filter(item => `${item.ticketNo || ""} ${item.title || ""}`.toLowerCase().includes(search.toLowerCase())).slice(0, 6);
  return (
    <section className="executive-dashboard" dir={isArabic ? "rtl" : "ltr"}>
      <div className="executive-heading">
        <div><div className="executive-eyebrow">FLOW TICKET ENTERPRISE</div><h1>{isArabic ? "لوحة التحكم" : "Dashboard"}</h1><p>{isArabic ? "نظرة عامة على التذاكر والحالات ومؤشرات الأداء" : "Overview of tickets, status and performance"}</p></div>
        <button className="btn secondary executive-refresh" type="button" onClick={loadDashboard} disabled={refreshing}>↻ {refreshing ? (isArabic ? "جاري التحديث" : "Refreshing") : (isArabic ? "تحديث" : "Refresh")}</button>
      </div>
      <div className="phase3-toolbar" aria-label={isArabic ? "فلاتر لوحة التحكم" : "Dashboard filters"}>
        <label>{isArabic ? "الفترة" : "Period"}<select className="input" value={period} onChange={e=>setPeriod(e.target.value)}><option value="all">{isArabic ? "كل الفترات" : "All time"}</option><option value="7">{isArabic ? "آخر 7 أيام" : "Last 7 days"}</option><option value="30">{isArabic ? "آخر 30 يومًا" : "Last 30 days"}</option><option value="90">{isArabic ? "آخر 90 يومًا" : "Last 90 days"}</option></select></label>
        <label>{isArabic ? "المسؤول" : "Owner"}<select className="input" value={ownerFilter} onChange={e=>setOwnerFilter(e.target.value)}><option value="all">{isArabic ? "جميع المسؤولين" : "All owners"}</option>{owners.map(owner=><option key={owner} value={owner}>{owner}</option>)}</select></label>
        <label>{isArabic ? "الحالة" : "Status"}<select className="input" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">{isArabic ? "كل الحالات" : "All statuses"}</option>{statuses.map(status=><option key={status} value={status}>{status}</option>)}</select></label>
        <button className="btn secondary" type="button" onClick={()=>{setPeriod("all");setOwnerFilter("all");setStatusFilter("all");}}>{isArabic ? "إعادة تعيين" : "Reset"}</button>
        <button className="btn secondary" type="button" onClick={downloadPerformanceCsv}>{isArabic ? "تنزيل التقرير CSV" : "Export CSV report"}</button>
      </div>
      {error && <p className="executive-error" role="alert">{error}</p>}
      <div className="executive-kpis dashboard-783-kpis" aria-label={isArabic ? "مؤشرات التذاكر" : "Ticket indicators"}>
        {[
          { label: isArabic ? "كل التذاكر" : "All Tickets", value: filteredTotal, icon: "▤", tone: "blue", detail: isArabic ? "إجمالي التذاكر" : "Total tickets" },
          { label: isArabic ? "مفتوحة / معلقة" : "Open / Pending", value: openTickets.length, icon: "◷", tone: "amber", detail: isArabic ? "من إجمالي التذاكر" : "Of all tickets" },
          { label: isArabic ? "المكتملة" : "Completed", value: completedTickets.length, icon: "✓", tone: "green", detail: isArabic ? "من إجمالي التذاكر" : "Of all tickets" },
          { label: isArabic ? "قيد العمل" : "In Workflow", value: openTickets.length, icon: "↻", tone: "purple", detail: isArabic ? "التذاكر غير المغلقة" : "Not yet closed" },
          { label: isArabic ? "المتأخرة" : "Overdue", value: lateTickets.length, icon: "!", tone: "red", detail: isArabic ? "تجاوزت تاريخ الاستحقاق" : "Past due date" }
        ].map(kpi => <div className={`executive-kpi dashboard-783-kpi dashboard-783-${kpi.tone}`} key={kpi.label}>
          <div className="dashboard-783-kpi-top"><span>{kpi.label}</span><span className={`executive-kpi-icon ${kpi.tone}`} aria-hidden="true">{kpi.icon}</span></div>
          <strong>{kpi.value}</strong><div className="dashboard-783-kpi-foot"><span>{kpi.detail}</span><span>{filteredTotal ? `${Math.round(Number(kpi.value) / filteredTotal * 100)}%` : "0%"}</span></div>
        </div>)}
      </div>
      <div className="dashboard-783-insights">
        <div className="executive-card dashboard-783-trend">
          <div className="executive-card-heading"><h2>{isArabic ? "اتجاه التذاكر خلال الفترة" : "Ticket Trends"}</h2><p>{isArabic ? "عدد التذاكر حسب حقل Date الظاهر في تفاصيل التذكرة" : "Tickets by the Date field shown in ticket details"}</p></div>
          <div className="ticket-trend-controls" aria-label={isArabic ? "التحكم في فترة الاتجاه" : "Trend period controls"}>
            <button type="button" className="btn secondary" onClick={() => setTrendOffset(v => v - 1)}>{isArabic ? "السابق" : "Previous"}</button>
            <select className="input" aria-label={isArabic ? "عدد الشهور" : "Months"} value={trendMonths} onChange={e => { setTrendMonths(Number(e.target.value)); setTrendOffset(0); }}><option value={6}>{isArabic ? "6 شهور" : "6 months"}</option><option value={12}>{isArabic ? "12 شهرًا" : "12 months"}</option></select>
            <button type="button" className="btn secondary" onClick={() => setTrendOffset(v => v + 1)}>{isArabic ? "التالي" : "Next"}</button>
            {trendOffset !== 0 && <button type="button" className="btn secondary" onClick={() => setTrendOffset(0)}>{isArabic ? "الفترة الحالية" : "Current period"}</button>}
          </div>
          <div className="dashboard-783-trend-legend"><span><i className="trend-complete"/>{isArabic ? "مكتملة" : "Completed"}</span><span><i className="trend-open"/>{isArabic ? "قيد العمل" : "In progress"}</span><span><i className="trend-late"/>{isArabic ? "متأخرة" : "Overdue"}</span></div>
          <div className="dashboard-783-trend-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={trendData} margin={{top:12,right:8,bottom:0,left:-25}}><CartesianGrid stroke="#e9eff8" strokeDasharray="4 5" vertical={false}/><XAxis dataKey="month" tick={{fontSize:11,fill:"#7387a4"}} tickLine={false} axisLine={false}/><YAxis allowDecimals={false} tick={{fontSize:11,fill:"#7387a4"}} tickLine={false} axisLine={false}/><Tooltip/><Line type="monotone" dataKey="completed" name={isArabic ? "مكتملة" : "Completed"} stroke="#18aa79" strokeWidth={2.5} dot={{r:3}}/><Line type="monotone" dataKey="open" name={isArabic ? "قيد العمل" : "In progress"} stroke="#6c59ed" strokeWidth={2.5} dot={{r:3}}/><Line type="monotone" dataKey="overdue" name={isArabic ? "متأخرة" : "Overdue"} stroke="#f46d74" strokeWidth={2.5} dot={{r:3}}/></LineChart></ResponsiveContainer></div>
        </div>
        <div className="executive-card dashboard-783-progress" aria-label={isArabic ? "ملخص الأداء" : "Performance overview"}>
          <div className="executive-card-heading"><h2>{isArabic ? "معدل إنجاز التذاكر" : "Ticket Completion Rate"}</h2><p>{isArabic ? "نسبة التذاكر المكتملة من إجمالي التذاكر" : "Completed tickets as a share of total"}</p></div>
          <div className="dashboard-783-progress-content"><div className="dashboard-783-ring" style={{"--progress": `${filteredTotal ? Math.round(completedTickets.length / filteredTotal * 100) : 0}%`}}><div><strong>{filteredTotal ? Math.round(completedTickets.length / filteredTotal * 100) : 0}%</strong></div></div>
          <div className="dashboard-783-progress-legend"><span><i className="trend-complete"/>{isArabic ? "مكتملة" : "Completed"}<b>{completedTickets.length}</b></span><span><i className="trend-open"/>{isArabic ? "قيد العمل" : "In progress"}<b>{openTickets.length}</b></span><span><i className="trend-late"/>{isArabic ? "متأخرة" : "Overdue"}<b>{lateTickets.length}</b></span></div></div>
          <div className="dashboard-783-progress-bottom"><span>{isArabic ? `${completedTickets.length} من أصل ${filteredTotal} تذكرة` : `${completedTickets.length} of ${filteredTotal} tickets`}</span><div className="dashboard-v750-overview-track" role="progressbar" aria-valuenow={filteredTotal ? Math.round(completedTickets.length / filteredTotal * 100) : 0} aria-valuemin="0" aria-valuemax="100"><span style={{width:`${filteredTotal ? Math.round(completedTickets.length / filteredTotal * 100) : 0}%`}}/></div></div>
        </div>
      </div>
      <div className="phase3-sla" aria-label="SLA indicators">
        <div><span>{isArabic ? "متأخرة عن موعد الاستحقاق" : "Past due"}</span><strong>{lateTickets.length}</strong><small>{isArabic ? "تذاكر مفتوحة تجاوزت تاريخ الاستحقاق" : "Open tickets beyond due date"}</small></div>
        <div><span>{isArabic ? "تستحق خلال 3 أيام" : "Due within 3 days"}</span><strong>{upcomingTickets.length}</strong><small>{isArabic ? "تذاكر مفتوحة تقترب من موعدها" : "Open tickets approaching due date"}</small></div>
        <div><span>{isArabic ? "نسبة الالتزام بالمواعيد" : "Due-date compliance"}</span><strong>{openTickets.filter(ticket=>ticket.dueDate).length ? Math.round((1-lateTickets.length/openTickets.filter(ticket=>ticket.dueDate).length)*100) : 100}%</strong><small>{isArabic ? "للتذاكر المفتوحة ذات تاريخ استحقاق" : "Among open tickets with due dates"}</small></div>
      </div>
      <div className="executive-charts">
        <div className="executive-card executive-status"><div className="executive-card-heading"><h2>{isArabic ? "التذاكر حسب الحالة" : "Tickets by Status"}</h2><p>{isArabic ? "توزيع حالات التذاكر" : "Current ticket distribution"}</p></div>
          <div className="executive-donut-layout"><div className="executive-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="83%" paddingAngle={2} stroke="#fff" strokeWidth={2}>{statusData.map((item,index)=><Cell key={item.name} fill={statusColors[item.name] || chartColors[index % chartColors.length]}/>)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="executive-donut-center"><strong>{total}</strong><span>{isArabic ? "تذكرة" : "Tickets"}</span></div></div>
          <div className="executive-status-legend">{statusData.length ? statusData.map((item,index)=><div key={item.name}><i style={{background:statusColors[item.name] || chartColors[index % chartColors.length]}}/><span>{item.name}</span><strong>{item.value} <small>({total ? Math.round(item.value/total*100) : 0}%)</small></strong></div>) : <p>{isArabic ? "لا توجد بيانات" : "No data"}</p>}</div></div>
        </div>
        <div className="executive-card"><div className="executive-card-heading"><h2>{isArabic ? "التذاكر حسب النوع" : "Tickets by Type"}</h2><p>{isArabic ? "عدد التذاكر لكل نوع" : "Number of tickets per type"}</p></div><ExecutiveBars data={grouped("ticketType")} /></div>
        <div className="executive-card"><div className="executive-card-heading"><h2>{isArabic ? "توزيع الأولويات" : "Priority Distribution"}</h2><p>{isArabic ? "التذاكر حسب الأولوية" : "Tickets by priority level"}</p></div><ExecutiveBars data={grouped("priority")} priority /></div>
      </div>
      <div className="executive-bottom">
        <div className="executive-card executive-recent"><div className="executive-card-heading executive-inline"><div><h2>{isArabic ? "أحدث التذاكر" : "Recent Tickets"}</h2><p>{isArabic ? "آخر التذاكر المسجلة" : "Latest tickets"}</p></div><input className="input executive-search" aria-label={isArabic ? "بحث في التذاكر" : "Search recent tickets"} placeholder={isArabic ? "بحث..." : "Search tickets..."} value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="executive-table-scroll"><table className="executive-table"><thead><tr><th>{isArabic ? "رقم التذكرة" : "Ticket ID"}</th><th>{isArabic ? "الملخص" : "Summary"}</th><th>{isArabic ? "النوع" : "Type"}</th><th>{isArabic ? "الأولوية" : "Priority"}</th><th>{isArabic ? "الحالة" : "Status"}</th></tr></thead><tbody>{recent.map(item=><tr key={item.id || item.ticketNo}><td className="executive-ticket-id">{item.ticketNo}</td><td className="executive-summary" title={item.title || ""}>{item.title || "—"}</td><td>{item.ticketType || "—"}</td><td><span className="executive-tag">{item.priority || "—"}</span></td><td><span className="executive-tag">{item.status || "—"}</span></td></tr>)}{!recent.length && <tr><td colSpan="5">{isArabic ? "لا توجد تذاكر" : "No tickets found"}</td></tr>}</tbody></table></div></div>
        <div className="executive-card executive-workflow"><div className="executive-card-heading"><h2>{isArabic ? "ملخص سير العمل" : "Workflow Summary"}</h2><p>{isArabic ? "الحالات الحالية للتذاكر" : "Current workflow distribution"}</p></div><div className="executive-workflow-items">{statusData.length ? statusData.map((item,index)=>{const percent=total ? Math.round(item.value/total*100):0; const color=statusColors[item.name] || chartColors[index % chartColors.length];return <div className="executive-workflow-row" key={item.name}><div className="executive-workflow-label"><span>{item.name}</span><strong>{item.value} <small>{percent}%</small></strong></div><div className="executive-track"><span style={{width:`${percent}%`,background:color}}/></div></div>}) : <p>{isArabic ? "لا توجد بيانات" : "No data"}</p>}</div></div>
      </div>
    </section>
  );
}

function ExecutiveBars({ data, priority = false }) {
  const colors = priority ? { Critical: "#D97A7A", High: "#EBC274", Medium: "#7DA3F7", Low: "#8CCF9B" } : {};
  return <div className="executive-bars"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{top:20,right:8,bottom:20,left:-18}}><CartesianGrid stroke="#E2E8F0" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="name" tick={{fontSize:11,fill:"#64748B"}} interval={0} tickLine={false} axisLine={false}/><YAxis allowDecimals={false} tick={{fontSize:11,fill:"#64748B"}} tickLine={false} axisLine={false}/><Tooltip/><Bar dataKey="value" maxBarSize={82} radius={[8,8,0,0]}>{data.map((item,index)=><Cell key={item.name} fill={colors[item.name] || ["#7DA3F7","#8CCF9B","#B7A3F5","#EBC274"][index%4]}/>)}</Bar></BarChart></ResponsiveContainer></div>;
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
      <Top title={t.board || "Workflow Board"} subtitle="Backlog → To Do → In Progress → In Review → Testing → Done → Closed" />

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("ticketNo");
  const [sortDirection, setSortDirection] = useState("desc");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [removingId, setRemovingId] = useState(null);

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams(filters).toString();
      const [ticketData, listData] = await Promise.all([
        api(`/tickets?${params}`),
        api("/lists")
      ]);

      setTickets(Array.isArray(ticketData) ? ticketData : (ticketData.data || []));
      setLists(listData);
    } catch (err) {
      setLoadError(err.message || "Failed to load tickets");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filters.q, filters.status, filters.priority, filters.owner, filters.type, filters.subsystem, filters.client]);

  async function remove(ticket) {
    if (!confirm("Delete issue?")) return;
    try {
      setRemovingId(ticket.id);
      await api(`/tickets/${ticket.id}`, { method: "DELETE" });
      if (selected?.id === ticket.id) setSelected(null);
      await load();
    } catch (err) { setLoadError(err.message || "Failed to delete ticket"); }
    finally { setRemovingId(null); }
  }

  const isArabic = t.tickets === "التذاكر";
  const updateFilter = (key, value) => { setPage(1); setFilters(prev => ({ ...prev, [key]: value })); };
  const clearFilters = () => {
    setSearchDraft(""); setPage(1);
    setFilters({ q: "", status: "All", priority: "All", owner: "All", type: "All", subsystem: "All", client: "All" });
  };
  const activeFilterCount = Object.entries(filters).filter(([key, value]) => key !== "q" && value !== "All").length + (filters.q ? 1 : 0);
  const ticketStats = { total: tickets.length, open: tickets.filter(x => !["Done", "Closed"].includes(x.status)).length, done: tickets.filter(x => ["Done", "Closed"].includes(x.status)).length, high: tickets.filter(x => ["High", "Critical"].includes(x.priority)).length };
  const sortedTickets = [...tickets].sort((a, b) => {
    const first = String(a[sortBy] ?? "");
    const second = String(b[sortBy] ?? "");
    const comparison = first.localeCompare(second, undefined, { numeric: true, sensitivity: "base" });
    return sortDirection === "asc" ? comparison : -comparison;
  });
  const totalPages = Math.max(1, Math.ceil(sortedTickets.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleTickets = sortedTickets.slice((safePage - 1) * pageSize, safePage * pageSize);
  const sortColumn = (key) => {
    setSortDirection(prev => sortBy === key && prev === "asc" ? "desc" : "asc");
    setSortBy(key); setPage(1);
  };
  const sortableHeader = (key, label) => <button type="button" className="tickets-v670-sort" onClick={() => sortColumn(key)} aria-label={`${label}: sort`} aria-sort={sortBy === key ? (sortDirection === "asc" ? "ascending" : "descending") : undefined}>{label}<span aria-hidden="true">{sortBy === key ? (sortDirection === "asc" ? " ↑" : " ↓") : " ↕"}</span></button>;

  return (
    <>
      <Top title={t.tickets || "Issues"} subtitle={t.tickets === "التذاكر" ? "البحث عن التذاكر ومتابعة حالاتها وأولوياتها" : "Search and manage tickets"} />

      <div className="tickets-v760-stats" aria-label={isArabic ? "ملخص التذاكر" : "Ticket summary"}>
        {[[isArabic ? "إجمالي التذاكر" : "Total tickets", ticketStats.total, "total"], [isArabic ? "قيد المتابعة" : "Active tickets", ticketStats.open, "open"], [isArabic ? "مكتملة" : "Completed", ticketStats.done, "done"], [isArabic ? "أولوية عالية" : "High priority", ticketStats.high, "high"]].map(([label, value, kind]) => <div key={kind} className={`tickets-v760-stat tickets-v760-stat-${kind}`}><span className="tickets-v760-stat-label">{label}</span><strong>{value}</strong></div>)}
      </div>
      <section className="tickets-v670-panel tickets-v760-filters-panel" aria-label={isArabic ? "البحث وتصفية التذاكر" : "Search and filter tickets"}>
        <form className="tickets-v670-search" onSubmit={(e) => { e.preventDefault(); updateFilter("q", searchDraft.trim()); }}>
          <input className="input" aria-label={isArabic ? "بحث عن التذاكر" : "Search tickets"} placeholder={isArabic ? "ابحث برقم التذكرة أو الملخص..." : "Search by ticket number or summary..."} value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} />
          <button className="btn" type="submit">{isArabic ? "بحث" : "Search"}</button>
        </form>
        <div className="tickets-v670-filters">
          {[["client", isArabic ? "العميل" : "Client", "clients"], ["subsystem", isArabic ? "النظام" : "System", "systems"], ["status", isArabic ? "الحالة" : "Status", "statuses"], ["priority", isArabic ? "الأولوية" : "Priority", "priorities"], ["owner", isArabic ? "المالك" : "Owner", "owners"], ["type", isArabic ? "النوع" : "Type", "ticketTypes"]].map(([key, label, list]) => (
            <label className="tickets-v670-filter" key={key}><span>{label}</span><Filter value={filters[key]} items={["All", ...listValues(lists || {}, list)]} onChange={(value) => updateFilter(key, value)} /></label>
          ))}
        </div>
        <div className="tickets-v670-filter-footer">
          <span role="status">{loading ? (isArabic ? "جارٍ التحميل..." : "Loading...") : `${tickets.length} ${isArabic ? "تذكرة" : "tickets"}`} {activeFilterCount > 0 && <span className="tickets-v760-filter-count">{activeFilterCount} {isArabic ? "فلتر نشط" : "active filters"}</span>}</span>
          <button type="button" className="btn secondary" onClick={clearFilters}>{isArabic ? "إعادة تعيين الفلاتر" : "Reset filters"}</button>
        </div>
      </section>
      {loadError && <div className="error" role="alert">{loadError} <button className="btn secondary" onClick={load}>{isArabic ? "إعادة المحاولة" : "Retry"}</button></div>}

      <div className="tickets-v760-table-heading"><div><h2>{isArabic ? "قائمة التذاكر" : "Ticket list"}</h2><p>{isArabic ? "استعرض التفاصيل واضغط رقم التذكرة للمتابعة" : "Select a ticket number to view details and updates"}</p></div><span className="tickets-v760-results">{sortedTickets.length} {isArabic ? "نتيجة" : "results"}</span></div>
      <div className="table-card tickets-v670-table tickets-v760-table" role="region" aria-label={isArabic ? "جدول التذاكر" : "Tickets table"} tabIndex="0">
        <table>
          <thead>
            <tr>
              <th>{sortableHeader("ticketNo", t.ticketNumber)}</th>
              <th>{sortableHeader("title", "Ticket Summary")}</th>
              <th>{sortableHeader("clientName", "Client")}</th><th>{sortableHeader("subsystem", "System")}</th>
              <th>{sortableHeader("ticketType", "Type")}</th>
              <th>{sortableHeader("status", "Status")}</th>
              <th>{sortableHeader("priority", "Priority")}</th>
              <th>{sortableHeader("owner", "Owner")}</th>
              <th>{sortableHeader("dueDate", "Due")}</th>
              <th>{t.email === "إيميل" ? "إرسال بريد" : "Send Mail"}</th>
              {can(user.role, "tickets.delete") && <th>{t.delete}</th>}
            </tr>
          </thead>
          <tbody>
            {visibleTickets.map((ticket) => (
              <tr key={ticket.id}>
                <td><button className="tickets-v760-ticket-link" onClick={() => setSelected(ticket)} aria-label={`${isArabic ? "فتح التذكرة" : "Open ticket"} ${ticket.ticketNo}`}>{ticket.ticketNo} <span aria-hidden="true">↗</span></button></td>
                <td><div className="tickets-v760-summary" title={ticket.title}><b>{ticket.title}</b>{ticket.label && <div className="muted">{ticket.label}</div>}</div></td>
                <td>{ticket.clientName || '-'}</td><td>{ticket.subsystem}</td>
                <td>{ticket.ticketType}</td>
                <td><span className={statusClass(ticket.status)}>{ticket.status}</span></td>
                <td><span className={priorityClass(ticket.priority)}>{ticket.priority}</span></td>
                <td>{ticket.owner}</td>
                <td>{ticket.dueDate}</td>
                <td><a className="btn secondary ticket-action" href={buildMailto(ticket)} title={t.email} aria-label={`${t.email}: ${ticket.ticketNo}`}><span aria-hidden="true">✉</span> <span>{t.email === "إيميل" ? "إرسال بريد" : "Send Mail"}</span></a></td>
                {can(user.role, "tickets.delete") && <td><button className="btn danger ticket-action" disabled={removingId === ticket.id} onClick={() => remove(ticket)} title={t.delete} aria-label={`${t.delete}: ${ticket.ticketNo}`}><span aria-hidden="true">▤</span> <span>{t.delete}</span></button></td>}
              </tr>
            ))}
            {!loading && !visibleTickets.length && <tr><td colSpan={can(user.role, "tickets.delete") ? 11 : 10} className="tickets-v670-empty">{isArabic ? "لا توجد تذاكر تطابق البحث الحالي" : "No tickets match your filters"}</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="tickets-v670-pagination">
        <span>{sortedTickets.length ? `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, sortedTickets.length)}` : "0"} / {sortedTickets.length}</span>
        <label>{isArabic ? "عدد الصفوف" : "Rows"} <select className="input" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></label>
        <button type="button" className="btn secondary" disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} aria-label="Previous page">‹</button>
        <span>{safePage} / {totalPages}</span>
        <button type="button" className="btn secondary" disabled={safePage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} aria-label="Next page">›</button>
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

  if (!data || !lists) return <><div className="drawer-backdrop" onClick={onClose} /><div className="drawer tickets-v760-drawer" role="dialog" aria-modal="true"><div className="tickets-v760-loading">Loading ticket details… <button className="btn secondary" onClick={onClose}>×</button></div></div></>;

  const ticket = data.ticket;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer tickets-v760-drawer" role="dialog" aria-modal="true" aria-label={`${t.ticketNumber}: ${id}`}>
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

          <button className="btn secondary tickets-v760-close" onClick={onClose} aria-label="Close ticket details">×</button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="tickets-v760-section-title">{t.details}</div>
        <div className="form-grid tickets-v760-detail-fields">
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

        <div className="tabs tickets-v760-tabs">
          <button className={tab === "details" ? "active" : ""} onClick={() => setTab("details")}>{t.details}</button>
          <button className={tab === "comments" ? "active" : ""} onClick={() => setTab("comments")}>{t.comments}</button>
          <button className={tab === "activity" ? "active" : ""} onClick={() => setTab("activity")}>{t.activity}</button>
          <button className={tab === "attachments" ? "active" : ""} onClick={() => setTab("attachments")}>Attachments</button>
        </div>

        {tab === "details" && (
          <div className="tickets-v760-detail-body">
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
  const [submitting, setSubmitting] = useState(false);
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
    let mounted = true;
    api("/lists").then((loadedLists) => {
      if (!mounted) return;
      setLists(loadedLists);
      // Native selects show their first option even when React state is empty.
      // Persist the visible defaults so validation and POST use the same values.
      setForm((previous) => {
        const next = { ...previous };
        for (const [field, listName] of [
          ["subsystem", "systems"], ["ticketType", "ticketTypes"],
          ["status", "statuses"], ["priority", "priorities"],
          ["owner", "owners"]
        ]) {
          const options = listValues(loadedLists, listName);
          if (!options.includes(next[field])) next[field] = options[0] || "";
        }
        return next;
      });
    }).catch((err) => {
      if (mounted) setError(err.message || "تعذر تحميل القوائم. يرجى تحديث الصفحة.");
    });
    return () => { mounted = false; };
  }, []);

  if (!lists) return <p>Loading...</p>;

  function setField(key, value) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const requiredFields = [
      ["requester", "Requester"], ["title", "Ticket Summary"],
      ["subsystem", "System"], ["ticketType", "Type"],
      ["status", "Status"], ["priority", "Priority"],
      ["owner", "Owner"], ["dueDate", "Date"]
    ];
    const missing = requiredFields.filter(([key]) => !String(form[key] ?? "").trim());
    if (missing.length) {
      setError(`يرجى استكمال الحقول التالية: ${missing.map(([, label]) => label).join("، ")}`);
      return;
    }
    if (!Number.isFinite(Number(form.estimate)) || Number(form.estimate) < 0) {
      setError("Estimate يجب أن يكون رقمًا غير سالب.");
      return;
    }
    setSubmitting(true);
    try {
      await api("/tickets", {
        method: "POST",
        body: JSON.stringify(normalizeTicketPayloadV65(form))
      });

      setSuccess("تم إنشاء التذكرة بنجاح");
      setTimeout(() => setActive("board"), 500);
    } catch (err) {
      setError(err.message || "Create ticket failed");
    } finally {
      setSubmitting(false);
    }
  }

  // v6.6.10: consistent, accessible outline icons (no external icon dependency).
  const iconPaths = {
    requester: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
    client: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></>,
    system: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></>,
    type: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    module: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    status: <><path d="M2 12h4l3-7 5 14 3-7h5"/></>,
    owner: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    priority: <><path d="M5 21V4m0 1c6-4 8 4 15 0v11c-7 4-9-4-15 0"/></>,
    date: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>,
    label: <><path d="M20.6 13.4 13 21l-10-10V3h8l9.6 9.6a1 1 0 0 1 0 .8Z"/><circle cx="7.5" cy="7.5" r="1"/></>,
    estimate: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    summary: <><path d="M6 2h9l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>,
    description: <><path d="M6 2h9l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>
  };
  const fieldIcon = (name) => <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">{iconPaths[name] || iconPaths.summary}</svg>;
  const formField = (label, icon, control, required = false, extraClass = "") => (
    <label className={`create-v668-field ${extraClass}`}>
      <span className="create-v668-icon" aria-hidden="true">{fieldIcon(icon)}</span>
      <span className="create-v668-field-body"><span className="create-v668-label">{label}{required && <b className="create-v668-required"> *</b>}</span>{control}</span>
    </label>
  );

  return (
    <section className="create-v668" dir="rtl">
      <div className="create-v668-heading">
        <span className="create-v668-heading-icon" aria-hidden="true">{fieldIcon("summary")}</span>
        <div><h1>{t.newTicket || "إنشاء تذكرة جديدة"}</h1><p>قم بإنشاء تذكرة جديدة مع جميع التفاصيل المطلوبة</p></div>
      </div>
      <form className="create-v668-card" onSubmit={submit}>
        <div className="create-v668-section-heading"><span className="create-v668-section-icon" aria-hidden="true">{fieldIcon("summary")}</span><div><strong>معلومات التذكرة</strong><small>قم بإدخال تفاصيل التذكرة المطلوبة بدقة</small></div></div>
        <div className="create-v668-grid">
          {formField("Requester", "requester", <input required className="input" placeholder="أدخل اسم مقدم الطلب..." value={form.requester} onChange={e => setField("requester",e.target.value)} />, true)}
          {formField("اسم العميل / Client Name", "client", <select className="input" value={form.clientName || ""} onChange={e => setField("clientName",e.target.value)}><option value="">اختر العميل</option>{listValues(lists,"clients").map(x => <option key={x} value={x}>{x}</option>)}</select>)}
          {formField("System", "system", <Select value={form.subsystem} items={listValues(lists,"systems")} onChange={v=>setField("subsystem",v)} />, true)}
          {formField("Type", "type", <Select value={form.ticketType} items={listValues(lists,"ticketTypes")} onChange={v=>setField("ticketType",v)} />, true)}
          {formField("Module", "module", <input className="input" placeholder="اختر الموديول..." value={form.module} onChange={e=>setField("module",e.target.value)} />)}
          {formField("Status", "status", <Select value={form.status} items={listValues(lists,"statuses")} onChange={v=>setField("status",v)} />, true)}
          {formField("Priority", "priority", <Select value={form.priority} items={listValues(lists,"priorities")} onChange={v=>setField("priority",v)} />, true)}
          {formField("Owner", "owner", <Select value={form.owner} items={listValues(lists,"owners")} onChange={v=>setField("owner",v)} />, true)}
          {formField("Label", "label", <Select value={form.label} items={listValues(lists,"labels")} onChange={v=>setField("label",v)} />)}
          {formField("Date", "date", <input className="input" type="date" value={form.dueDate} onChange={e=>setField("dueDate",e.target.value)} />, true)}
          {formField("Estimate", "estimate", <div className="create-v668-stepper"><button type="button" aria-label="تقليل الساعات" onClick={()=>setField("estimate",Math.max(0,Number(form.estimate||0)-1))}>−</button><input aria-label="Estimate" type="number" min="0" step="1" value={form.estimate} onChange={e=>setField("estimate",Math.max(0, Number(e.target.value) || 0))} /><button type="button" aria-label="زيادة الساعات" onClick={()=>setField("estimate",Number(form.estimate||0)+1)}>+</button></div>, false, "create-v668-estimate")}
        </div>
        <div className="create-v668-details">
          {formField("Ticket Summary", "summary", <div className="create-v668-text-wrap"><input required maxLength={500} className="input" placeholder="أدخل ملخص التذكرة..." value={form.title} onChange={e=>setField("title",e.target.value)} /><small>{form.title.length}/500</small></div>, true, "create-v668-full")}
          {formField("Description", "description", <div className="create-v668-text-wrap"><textarea className="input" rows="3" maxLength={2000} placeholder="أدخل وصف التذكرة..." value={form.description} onChange={e=>setField("description",e.target.value)} /><small>{form.description.length}/2000</small></div>, false, "create-v668-full")}
          <div className="create-v668-optional"><button type="button" onClick={e=>e.currentTarget.parentElement.classList.toggle("expanded")}>+ {"Action Summary"} <span>▾</span></button><input className="input" placeholder="Next action..." value={form.nextAction} onChange={e=>setField("nextAction",e.target.value)} /></div>
        </div>
        {error && <div className="error" role="alert">{error}</div>}
        {success && <div className="success" role="status">{success}</div>}
        <div className="create-v668-actions"><button type="submit" className="create-v668-submit" disabled={submitting}>{submitting ? "جارٍ الحفظ..." : (t.create === "إنشاء" ? "إنشاء التذكرة" : "Create Ticket")}</button><button type="button" className="create-v668-cancel" onClick={()=>setActive("board")}>✕ &nbsp; {t.create === "إنشاء" ? "إلغاء" : "Cancel"}</button></div>
      </form>
    </section>
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
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState([]);
  const [filter, setFilter] = useState("all");
  const ar = t.notifications === "التنبيهات" || t.notifications === "الإشعارات";
  const tr = (a, e) => ar ? a : e;
  const visible = rows.filter(row => filter === "all" || (filter === "unread" ? !row.read : row.read));
  const allSelected = visible.length > 0 && visible.every(row => selected.includes(row.id));

  async function load(nextPage = 1, append = false) {
    setLoading(true);
    setMessage("");
    try {
      const result = await api(`/notifications?page=${nextPage}&limit=20`);
      const data = result.data || [];
      setRows(previous => append ? [...previous, ...data.filter(item => !previous.some(old => old.id === item.id))] : data);
      setUnreadCount?.(Number(result.unreadCount || 0));
      setHasMore(Boolean(result.pagination?.hasMore));
      setPage(nextPage);
      if (!append) setSelected([]);
    } catch (err) { setMessage(err.message || "Failed to load notifications"); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    load();
    const handler = event => {
      const notification = event.detail;
      if (notification?.id) setRows(previous => [notification, ...previous.filter(item => item.id !== notification.id)]);
    };
    window.addEventListener("flow:new-notification", handler);
    return () => window.removeEventListener("flow:new-notification", handler);
  }, []);

  async function markRead(ids) {
    if (!ids.length) return;
    setBusy(true); setMessage("");
    try {
      const result = await api("/notifications/bulk-read", { method:"PATCH", body:JSON.stringify({ ids }) });
      setRows(previous => previous.map(row => ids.includes(row.id) ? {...row,read:true} : row));
      setUnreadCount?.(Number(result.unreadCount || 0));
    } catch(err) {setMessage(err.message || "Unable to mark as read");}
    finally {setBusy(false);}
  }
  async function markAllRead() {
    setBusy(true); setMessage("");
    try {
      const result = await api("/notifications/read-all", { method:"PATCH" });
      setRows(previous => previous.map(row => ({...row,read:true})));
      setUnreadCount?.(Number(result.unreadCount || 0));
    } catch(err) {setMessage(err.message || "Unable to mark all as read");}
    finally {setBusy(false);}
  }
  async function remove(ids) {
    if (!ids.length || !window.confirm(tr(`حذف ${ids.length} إشعار من صندوق الوارد الخاص بك؟`, `Delete ${ids.length} notification(s) from your inbox?`))) return;
    setBusy(true); setMessage("");
    try {
      const result = await api("/notifications/bulk-delete", {method:"POST",body:JSON.stringify({ids})});
      setRows(previous => previous.filter(row => !ids.includes(row.id)));
      setSelected(previous => previous.filter(id => !ids.includes(id)));
      setUnreadCount?.(Number(result.unreadCount || 0));
      // Reload the first page so hidden rows fill the gaps after deletion.
      await load(1, false);
    } catch(err) {setMessage(err.message || "Unable to delete notifications");}
    finally {setBusy(false);}
  }
  function toggle(id) {setSelected(previous => previous.includes(id) ? previous.filter(x => x !== id) : [...previous,id]);}
  function toggleAll() {
    const ids = visible.map(row => row.id);
    setSelected(previous => allSelected ? previous.filter(id => !ids.includes(id)) : [...new Set([...previous,...ids])]);
  }
  return <>
    <Top title={t.notifications || "Notifications"} subtitle={tr("إدارة إشعارات التذاكر وسير العمل", "Ticket and workflow notifications")} />
    <section className="nc-shell">
      <div className="nc-header">
        <div><h2>{tr("مركز الإشعارات", "Notification Center")}</h2><p>{unreadCount || 0} {tr("إشعار غير مقروء", "unread notifications")}</p></div>
        <div className="nc-tools">
          <button className="btn secondary" disabled={loading || busy} onClick={() => load()}>{tr("تحديث", "Refresh")}</button>
          <button className="btn secondary" disabled={busy || !unreadCount} onClick={markAllRead}>{tr("تحديد الكل كمقروء", "Mark all as read")}</button>
        </div>
      </div>
      <div className="nc-controls">
        <div className="nc-tabs">
          {[["all",tr("الكل","All")],["unread",tr("غير مقروء","Unread")],["read",tr("مقروء","Read")]].map(([value,label]) => <button key={value} className={filter===value?"nc-tab active":"nc-tab"} onClick={()=>{setFilter(value);setSelected([])}}>{label}</button>)}
        </div>
        <label className="nc-select"><input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={!visible.length}/>{tr("تحديد الكل المعروض", "Select visible")}</label>
        <span className="nc-count">{selected.length} {tr("محدد", "selected")}</span>
        <button className="btn secondary" disabled={busy || !selected.length} onClick={()=>markRead(selected)}>{tr("تحديد كمقروء", "Mark read")}</button>
        <button className="btn danger" disabled={busy || !selected.length} onClick={()=>remove(selected)}>{tr("حذف المحدد", "Delete selected")}</button>
      </div>
      {message && <div className="error" role="alert">{message}</div>}
      <div className="nc-list">
        {visible.map(row => {
          const tone = notificationTone(row.type,row.severity);
          return <article key={row.id} className={`nc-item ${row.read?"is-read":"is-unread"}`}>
            <input className="nc-check" type="checkbox" aria-label={tr("تحديد الإشعار", "Select notification")} checked={selected.includes(row.id)} onChange={()=>toggle(row.id)}/>
            <div className={`nc-symbol nc-${tone}`} aria-hidden="true">{tone==="warning"?"↻":tone==="success"?"+":tone==="urgent"?"!":"i"}</div>
            <div className="nc-body"><div className="nc-title"><strong>{row.title}</strong>{!row.read && <span className="nc-new">{tr("جديد", "New")}</span>}</div>
              <p>{row.body}</p><div className="nc-meta"><time>{row.createdAt ? new Date(row.createdAt).toLocaleString(ar?"ar-SA":"en-US") : ""}</time>{row.ticketId && <span>{tr("تذكرة", "Ticket")}: {row.ticketId}</span>}</div>
            </div>
            <div className="nc-actions">{!row.read && <button className="btn secondary" disabled={busy} onClick={()=>markRead([row.id])}>{tr("مقروء", "Mark read")}</button>}
              <button className="btn danger" disabled={busy} onClick={()=>remove([row.id])} title={tr("حذف الإشعار", "Delete notification")}>{tr("حذف", "Delete")}</button></div>
          </article>;
        })}
        {!loading && !visible.length && <div className="nc-empty"><span aria-hidden="true">✓</span><h3>{tr("لا توجد إشعارات", "No notifications")}</h3><p>{tr("لا توجد إشعارات مطابقة حاليًا", "No matching notifications right now")}</p></div>}
      </div>
      {loading && <p className="nc-loading">{tr("جارٍ التحميل...", "Loading...")}</p>}
      {hasMore && <button className="btn secondary load-more" disabled={loading || busy} onClick={()=>load(page+1,true)}>{tr("عرض المزيد", "Load more")}</button>}
    </section>
  </>;
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

      {user.role === "Admin" && <WorkflowDesigner />}
      <div className="list-grid">
        {["systems", "clients", "statuses", "priorities", "replies", "owners", "ticketTypes", "labels"].map((key) => (
          <ListManager key={key} listKey={key} items={lists[key] || []} canEdit={user.role === "Admin"} onReload={load} t={t} />
        ))}
      </div>
    </>
  );
}

function WorkflowDesigner() {
  const [design, setDesign] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { api("/workflow/designer").then(setDesign).catch(e => setError(e.message)); }, []);
  function toggle(from, to) {
    setDesign(old => {
      const current = old.transitions[from] || [];
      return {...old, transitions:{...old.transitions,[from]:current.includes(to) ? current.filter(v => v !== to) : [...current,to]}};
    });
  }
  function addStatus() {
    const value = newStatus.trim();
    if (!value || !/^[\p{L}\p{N} _-]{1,50}$/u.test(value) || design.statuses.includes(value) || design.statuses.length >= 20) { setError("Enter a unique status (1-50 characters; maximum 20)"); return; }
    setDesign(old => ({...old,statuses:[...old.statuses,value],transitions:{...old.transitions,[value]:[]}}));
    setNewStatus("");setError("");setMessage("");
  }
  function removeStatus(status) {
    if (["Backlog","To Do","In Progress","In Review","Testing","Done","Closed"].includes(status)) return;
    setDesign(old => ({...old,statuses:old.statuses.filter(v=>v!==status),transitions:Object.fromEntries(Object.entries(old.transitions).filter(([key])=>key!==status).map(([key,values])=>[key,values.filter(v=>v!==status)]))}));
  }
  async function save() {
    setBusy(true);setError("");setMessage("");
    try { const saved = await api("/workflow/designer",{method:"PUT",body:JSON.stringify(design)});setDesign(saved);setMessage("Workflow saved successfully / تم حفظ مسار العمل"); }
    catch(e){setError(e.message);}finally{setBusy(false);}
  }
  if (!design) return <div className="card">Workflow Designer: {error || "Loading..."}</div>;
  return <section className="card workflow-designer">
    <div className="workflow-designer-head"><div><h2>Workflow Designer · مصمم سير العمل</h2><p className="muted">Define statuses, allowed transitions and role behavior. Core statuses cannot be removed.</p></div><button className="btn" disabled={busy} onClick={save}>{busy?"Saving...":"Save Workflow · حفظ"}</button></div>
    <div className="workflow-designer-add"><input className="input" aria-label="New workflow status" placeholder="New status / حالة جديدة" value={newStatus} onChange={e=>setNewStatus(e.target.value)} /><button className="btn" onClick={addStatus}>+ Add Status</button></div>
    <div className="workflow-designer-roles"><h3>Role behavior · قواعد الأدوار</h3>{["Admin","Manager","User","Viewer"].map(role=><label key={role}><strong>{role}</strong><select className="input" disabled={role==="Admin"||role==="Viewer"} value={design.roleRules[role]} onChange={e=>setDesign(old=>({...old,roleRules:{...old.roleRules,[role]:e.target.value}}))}><option value="any">Any status</option><option value="configured">Configured transitions</option><option value="none">No transitions</option></select></label>)}</div>
    <h3>Transitions · الانتقالات المسموحة</h3><p className="muted">Select a destination from each source status. Changes apply after saving.</p>
    <div className="workflow-designer-grid">{design.statuses.map(from=><div className="workflow-designer-state" key={from}><div className="workflow-designer-state-title"><strong>{from}</strong>{!["Backlog","To Do","In Progress","In Review","Testing","Done","Closed"].includes(from)&&<button type="button" aria-label={`Remove ${from}`} onClick={()=>removeStatus(from)}>×</button>}</div><div className="workflow-designer-targets">{design.statuses.filter(to=>to!==from).map(to=><label key={to}><input type="checkbox" checked={(design.transitions[from]||[]).includes(to)} onChange={()=>toggle(from,to)}/><span>{to}</span></label>)}</div></div>)}</div>
    {error&&<p className="workflow-designer-error" role="alert">{error}</p>}{message&&<p className="workflow-designer-success" role="status">{message}</p>}
  </section>;
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
          <button className="btn settings-add" onClick={add} disabled={!value.trim()}><span aria-hidden="true">＋</span> {t.create === "إنشاء" ? "إضافة" : "Submit"}</button>
        </div>
      )}

      <div className="chips">
        {items.map((item) => (
          <span className="chip" key={item.id}>
            {item.value}
            {canEdit && <button type="button" className="chip-delete" title={`${t.delete}: ${item.value}`} aria-label={`${t.delete}: ${item.value}`} onClick={() => del(item.id)}>×</button>}
          </span>
        ))}
      </div>
    </div>
  );
}


// v7.8.1: consistent navigation artwork; visual only, no routing changes.
const navigationPaths = {
  dashboard: <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 9v12"/></>,
  board: <><rect x="3" y="4" width="7" height="16" rx="2"/><rect x="14" y="4" width="7" height="8" rx="2"/><path d="M14 16h7M14 20h7"/></>,
  tickets: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
  new: <><path d="M12 5v14M5 12h14"/><circle cx="12" cy="12" r="9"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M10 2h4l.7 2.4 2 .9 2.2-1.2 2.8 2.8-1.2 2.2.9 2L24 12l-2.6.9-.9 2 1.2 2.2-2.8 2.8-2.2-1.2-2 .9L14 22h-4l-.7-2.4-2-.9-2.2 1.2-2.8-2.8 1.2-2.2-.9-2L0 12l2.6-.9.9-2-1.2-2.2 2.8-2.8 2.2 1.2 2-.9z" transform="translate(2 2) scale(.83)"/></>,
  audit: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
  backups: <><path d="M4 7h16v13H4zM8 7V4h8v3M8 12h8M8 16h5"/></>,
  errors: <><path d="M12 3 2 21h20L12 3zM12 9v5M12 18h.01"/></>
};
function NavigationIcon({ name }) {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{navigationPaths[name]}</svg>;
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
    <div className="topbar enterprise-page-heading">
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
              contentStyle={{ background: "#243B53", border: "none", borderRadius: 14, color: "#ffffff", boxShadow: "0 18px 42px rgba(15,23,42,.24)" }}
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
              contentStyle={{ background: "#243B53", border: "none", borderRadius: 14, color: "#ffffff", boxShadow: "0 18px 42px rgba(15,23,42,.24)" }}
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
