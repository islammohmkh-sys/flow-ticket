import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "..", "data", "flow_ticket.sqlite");

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

export const workflowOrder = [
  "Backlog",
  "To Do",
  "In Progress",
  "In Review",
  "Testing",
  "Done",
  "Closed"
];

const defaultLists = {
  systems: [
    "نظام الموارد البشرية",
    "نظام خطط العمليات",
    "نظام المستودعات",
    "نظام التمرير المطور",
    "نظام التكامل-النيابة العامة",
    "نظام التكامل -مستودع البيانات",
    "نظام الخدمات الالكترونية",
    "نظام قضيا المنسوبين",
    "نظام قضيا أمن الحدود"
  ],
  statuses: workflowOrder,
  priorities: ["Critical", "High", "Medium", "Low"],
  replies: ["قيد الدراسة", "تم التنفيذ"],
  owners: [
    "الدعم الفني",
    "فريق الموارد البشرية",
    "فريق العمليات",
    "فريق المستودعات",
    "فريق التكامل",
    "مدير النظام",
    "فريق الجودة"
  ],
  ticketTypes: ["Bug", "Story", "Task", "Change Request", "Enhancement", "Access Request"],
  labels: ["Production", "Integration", "UI", "Security", "Data", "Report"],
  clients: ["عميل داخلي", "وزارة الداخلية", "شركة الاتصالات", "شركة أرامكو"],
  clients: ["عميل داخلي", "وزارة الداخلية", "شركة الاتصالات", "شركة أرامكو"]
};

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'User',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL DEFAULT 1,
      ticket_no TEXT UNIQUE NOT NULL,
      received_date TEXT NOT NULL,
      requester TEXT NOT NULL,
      client_name TEXT,
      subsystem TEXT NOT NULL,
      ticket_type TEXT NOT NULL,
      module TEXT,
      title TEXT NOT NULL,
      description TEXT,
      reply TEXT DEFAULT 'قيد الدراسة',
      status TEXT DEFAULT 'Backlog',
      priority TEXT DEFAULT 'Medium',
      owner TEXT,
      due_date TEXT,
      sla_due_at TEXT,
      next_action TEXT,
      label TEXT,
      estimate INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      user_id INTEGER,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT,
      level TEXT NOT NULL DEFAULT 'info',
      is_read INTEGER NOT NULL DEFAULT 0,
      ticket_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS list_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_key TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(list_key, value)
    );
  `);

  ensureUserMigrations();
  
  try { db.prepare("ALTER TABLE tickets ADD COLUMN project_id INTEGER NOT NULL DEFAULT 1").run(); } catch {}
  try { db.prepare("ALTER TABLE tickets ADD COLUMN client_name TEXT").run(); } catch {}
  try { db.prepare("ALTER TABLE tickets ADD COLUMN sla_due_at TEXT").run(); } catch {}

  
  try {
    const projectCount = db.prepare("SELECT COUNT(*) AS count FROM projects").get().count;
    if (projectCount === 0) {
      db.prepare("INSERT INTO projects (key, name, description) VALUES (?, ?, ?)").run("TCK", "Default Project", "Default ticket project");
    }
  } catch {}

  seedUsers();
  seedLists();
  try { db.prepare("ALTER TABLE tickets ADD COLUMN client_name TEXT").run(); } catch {}
  seedTickets();
}

function ensureUserMigrations() {
  try {
    db.prepare("ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1").run();
  } catch {
    // Column already exists.
  }
}

function seedUsers() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO users (username, password_hash, display_name, role)
    VALUES (?, ?, ?, ?)
  `);

  insert.run("admin", bcrypt.hashSync("admin123", 10), "System Admin", "Admin");
  insert.run("user", bcrypt.hashSync("user123", 10), "Ticket User", "User");
}

function seedLists() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM list_items").get().count;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT OR IGNORE INTO list_items (list_key, value)
    VALUES (?, ?)
  `);

  const tx = db.transaction(() => {
    Object.entries(defaultLists).forEach(([key, values]) => {
      values.forEach((value) => insert.run(key, value));
    });
  });

  tx();
}

function seedTickets() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM tickets").get().count;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO tickets (
      ticket_no,
      received_date,
      requester,
      subsystem,
      ticket_type,
      module,
      title,
      description,
      reply,
      status,
      priority,
      owner,
      due_date,
      next_action,
      label,
      estimate,
      created_by
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const rows = [
    [
      "TCK-0001",
      "2026-04-01",
      "ملازم أول / محمد السبيعي",
      "نظام الخدمات الالكترونية",
      "Change Request",
      "شاشة تسجيل معلومة",
      "تعديل حقل إتاحة المعلومة",
      "إظهار الرقم الإلحاقي مع الاحتفاظ برقم المعلومة الأولى.",
      "قيد الدراسة",
      "In Progress",
      "High",
      "الدعم الفني",
      "2026-04-06",
      "تحليل الطلب",
      "UI",
      5,
      1
    ],
    [
      "TCK-0002",
      "2026-04-03",
      "ملازم أول / فيصل",
      "نظام الموارد البشرية",
      "Enhancement",
      "شاشة بيانات الموظف",
      "إضافة صلاحية حسب الإدارة",
      "إضافة صلاحية عرض بيانات الموظفين حسب الإدارة.",
      "تم التنفيذ",
      "Done",
      "Medium",
      "فريق الموارد البشرية",
      "2026-04-13",
      "تم الإغلاق",
      "Security",
      8,
      1
    ],
    [
      "TCK-0003",
      "2026-04-05",
      "نقيب / عدوان",
      "نظام التكامل-النيابة العامة",
      "Bug",
      "خدمة التكامل",
      "عدم وصول بعض الطلبات",
      "بعض الطلبات لا تصل عبر خدمة التكامل.",
      "تم التنفيذ",
      "Testing",
      "Critical",
      "فريق التكامل",
      "2026-04-07",
      "اختبار الإصلاح",
      "Integration",
      3,
      1
    ],
    [
      "TCK-0004",
      "2026-04-12",
      "ملازم / فيصل",
      "نظام قضيا المنسوبين",
      "Bug",
      "تسجيل قضية جديدة",
      "لا يمكن تسجيل قضية جديدة",
      "تظهر رسالة خطأ عند محاولة تسجيل قضية جديدة.",
      "قيد الدراسة",
      "To Do",
      "High",
      "الدعم الفني",
      "2026-04-17",
      "فتح تذكرة تحليل",
      "Production",
      2,
      1
    ],
    [
      "TCK-0005",
      "2026-04-15",
      "رائد / سالم",
      "نظام المستودعات",
      "Task",
      "تقرير المخزون",
      "إضافة تقرير شهري للمخزون",
      "إنشاء تقرير شهري يوضح حركة الأصناف.",
      "قيد الدراسة",
      "Backlog",
      "Low",
      "فريق المستودعات",
      "2026-04-30",
      "انتظار الموافقة",
      "Report",
      13,
      2
    ]
  ];

  const tx = db.transaction(() => {
    rows.forEach((row) => {
      const info = insert.run(...row);
      logActivity(info.lastInsertRowid, 1, "created", "Ticket created");
    });
  });

  tx();
}

export function rowToTicket(row) {
  return {
    id: row.id,
    ticketNo: row.ticket_no,
    receivedDate: row.received_date,
    requester: row.requester,
    clientName: row.client_name,
    subsystem: row.subsystem,
    ticketType: row.ticket_type,
    module: row.module,
    title: row.title,
    description: row.description,
    reply: row.reply,
    status: row.status,
    priority: row.priority,
    owner: row.owner,
    dueDate: row.due_date,
    nextAction: row.next_action,
    label: row.label,
    estimate: row.estimate,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function logActivity(ticketId, userId, action, details = "") {
  db.prepare(`
    INSERT INTO activities (ticket_id, user_id, action, details)
    VALUES (?, ?, ?, ?)
  `).run(ticketId, userId, action, details);
}
