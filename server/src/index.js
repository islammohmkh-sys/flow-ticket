import "dotenv/config";
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { MongoClient, ObjectId } from "mongodb";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Server as SocketIOServer } from "socket.io";

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";
const CLIENT_URL = process.env.CLIENT_URL || "*";
const MONGO_URI = (process.env.MONGO_URI || process.env.MONGODB_URI || "").trim();

const io = new SocketIOServer(server, {
  cors: {
    origin: CLIENT_URL === "*" ? true : CLIENT_URL,
    credentials: true
  }
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error("Unauthorized socket"));
    const user = jwt.verify(token, JWT_SECRET);
    socket.user = user;
    socket.join(`user:${user.id}`);
    socket.join(`role:${user.role}`);
    return next();
  } catch {
    return next(new Error("Unauthorized socket"));
  }
});

io.on("connection", (socket) => {
  socket.emit("socket:ready", { ok: true, userId: socket.user?.id });
});


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 Server starting...");
console.log("MONGO_URI exists:", Boolean(MONGO_URI));

if (!MONGO_URI) {
  console.error("❌ Missing MONGO_URI environment variable");
}

let mongoClient;
let database;

async function connectMongo() {
  if (database) return database;

  try {
    console.log("🔌 Connecting to MongoDB...");

    if (!MONGO_URI) throw new Error("❌ Missing MONGO_URI environment variable");

    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();

    database = mongoClient.db("flow_ticket");

    await database.collection("users").createIndex({ username: 1 }, { unique: true });
    await database.collection("tickets").createIndex({ ticketNo: 1 }, { unique: true });
    await database.collection("tickets").createIndex({ status: 1 });
    await database.collection("tickets").createIndex({ clientName: 1 });
    await database.collection("list_items").createIndex({ list_key: 1, value: 1 }, { unique: true });
    await database.collection("audit_logs").createIndex({ createdAt: -1 });
    await database.collection("error_logs").createIndex({ createdAt: -1 });
    await database.collection("notifications").createIndex({ createdAt: -1 });
    await database.collection("notifications").createIndex({ ticketId: 1, createdAt: -1 });
    await database.collection("notification_users").createIndex({ userId: 1, is_deleted: 1, is_read: 1, createdAt: -1 });
    await database.collection("notification_users").createIndex({ notificationId: 1, userId: 1 }, { unique: true });
    await database.collection("backups").createIndex({ createdAt: -1 });
    await database.collection("attachments").createIndex({ ticketId: 1, createdAt: -1 });

    await seedMongo();
    console.log("✅ MongoDB connected");
    return database;
  } catch (error) {
    console.error("❌ Mongo Connection Error:", error.message);
    console.error(error);
    throw error;
  }
}

async function seedMongo() {
  const users = database.collection("users");
  const lists = database.collection("list_items");
  const tickets = database.collection("tickets");

  const adminExists = await users.findOne({ username: "admin" });
  if (!adminExists) {
    await users.insertOne({
      username: "admin",
      passwordHash: bcrypt.hashSync("admin123", 10),
      displayName: "System Admin",
      role: "Admin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  const userExists = await users.findOne({ username: "user" });
  if (!userExists) {
    await users.insertOne({
      username: "user",
      passwordHash: bcrypt.hashSync("user123", 10),
      displayName: "User",
      role: "User",
      isActive: true,
      failedLoginAttempts: 0,
      lockUntil: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  const managerExists = await users.findOne({ username: "manager" });
  if (!managerExists) {
    await users.insertOne({
      username: "manager",
      passwordHash: bcrypt.hashSync("manager123", 10),
      displayName: "Operations Manager",
      role: "Manager",
      isActive: true,
      failedLoginAttempts: 0,
      lockUntil: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  const viewerExists = await users.findOne({ username: "viewer" });
  if (!viewerExists) {
    await users.insertOne({
      username: "viewer",
      passwordHash: bcrypt.hashSync("viewer123", 10),
      displayName: "Read Only Viewer",
      role: "Viewer",
      isActive: true,
      failedLoginAttempts: 0,
      lockUntil: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  const defaults = {
    statuses: ["Backlog", "To Do", "In Progress", "In Review", "Testing", "Done", "Closed"],
    priorities: ["Critical", "High", "Medium", "Low"],
    types: ["Bug", "Task", "Enhancement", "Change Request"],
    owners: ["الدعم الفني", "فريق التكامل", "فريق الموارد البشرية", "فريق المستودعات"],
    subsystems: ["نظام المستودعات", "نظام الخدمات الالكترونية", "نظام الموارد البشرية", "نظام التمرير المطور"],
    clients: ["FG", "عميل داخلي", "وزارة الداخلية", "شركة الاتصالات"],
  };

  for (const [key, values] of Object.entries(defaults)) {
    for (const value of values) {
      await lists.updateOne(
        { list_key: key, value },
        { $setOnInsert: { list_key: key, value, createdAt: new Date() } },
        { upsert: true }
      );
    }
  }

  const count = await tickets.countDocuments();
  if (count === 0) {
    const now = new Date();
    await tickets.insertMany([
      {
        ticketNo: "TCK-0001",
        receivedDate: "2026-04-06",
        requester: "الدعم الفني",
        clientName: "FG",
        subsystem: "نظام الخدمات الالكترونية",
        ticketType: "Change Request",
        module: "UI",
        title: "تعديل حقل إتاحة المعلومة",
        description: "تعديل حقل إتاحة المعلومة بالنظام.",
        reply: "قيد الدراسة",
        status: "In Progress",
        priority: "High",
        owner: "الدعم الفني",
        dueDate: "2026-04-06",
        nextAction: "",
        
        estimate: 0,
        createdAt: now,
        updatedAt: now
      },
      {
        ticketNo: "TCK-0002",
        receivedDate: "2026-04-13",
        requester: "فريق الموارد البشرية",
        clientName: "FG",
        subsystem: "نظام الموارد البشرية",
        ticketType: "Enhancement",
        module: "Security",
        title: "إضافة صلاحية حسب الإدارة",
        description: "إضافة صلاحية حسب الإدارة.",
        reply: "تم التنفيذ",
        status: "Done",
        priority: "Medium",
        owner: "فريق الموارد البشرية",
        dueDate: "2026-04-13",
        nextAction: "",
        
        estimate: 0,
        createdAt: now,
        updatedAt: now
      }
    ]);
  }
}

app.use(cors({ origin: CLIENT_URL === "*" ? true : CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "12mb" }));

// Security hardening: secure headers + API rate limiting.
app.use(helmet({
  contentSecurityPolicy: false
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later." }
});

app.use("/api", apiLimiter);
app.use("/api/auth/login", loginLimiter);



function sanitizeString(value, fallback = "", maxLength = 500) {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  return String(value).trim().slice(0, maxLength);
}

function requireString(value, fieldName, maxLength = 500) {
  if (typeof value !== "string" || !value.trim()) {
    const error = new Error(`${fieldName} is required`);
    error.status = 400;
    throw error;
  }
  return value.trim().slice(0, maxLength);
}

function allowedValue(value, allowed, fallback) {
  const clean = sanitizeString(value, fallback, 80);
  return allowed.includes(clean) ? clean : fallback;
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sendValidationError(res, error) {
  return res.status(error.status || 400).json({ error: error.message || "Invalid input" });
}

const allowedStatuses = ["Backlog", "To Do", "In Progress", "In Review", "Testing", "Done", "Closed"];
const allowedPriorities = ["Critical", "High", "Medium", "Low"];
const allowedTicketTypes = ["Bug", "Task", "Enhancement", "Change Request"];

const allowedRoles = ["Admin", "Manager", "User", "Viewer"];
const permissionsByRole = {
  Admin: ["tickets.view", "tickets.create", "tickets.edit", "tickets.delete", "users.manage", "settings.manage", "audit.view", "errors.view", "backup.manage", "attachments.manage", "notifications.view", "notifications.manage"],
  Manager: ["tickets.view", "tickets.create", "tickets.edit", "audit.view", "attachments.manage", "notifications.view"],
  User: ["tickets.view", "tickets.create", "tickets.edit", "attachments.manage", "notifications.view"],
  Viewer: ["tickets.view"]
};

function hasPermission(role, permission) {
  return (permissionsByRole[role] || []).includes(permission);
}

function clientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
}

async function writeAudit(req, action, entity = "system", entityId = "", details = {}) {
  try {
    const db = database || await connectMongo();
    await db.collection("audit_logs").insertOne({
      action,
      entity,
      entityId: String(entityId || ""),
      details,
      userId: req?.user?.id || "anonymous",
      username: req?.user?.username || details.username || "anonymous",
      role: req?.user?.role || "Guest",
      ip: req ? clientIp(req) : "system",
      createdAt: new Date()
    });
  } catch (error) {
    console.error("Audit log failed:", error.message);
  }
}

async function writeErrorLog(req, error, context = "api") {
  try {
    const db = database || await connectMongo();
    await db.collection("error_logs").insertOne({
      context,
      message: error?.message || String(error),
      stack: error?.stack || "",
      path: req?.originalUrl || "",
      method: req?.method || "",
      userId: req?.user?.id || "anonymous",
      username: req?.user?.username || "anonymous",
      ip: req ? clientIp(req) : "system",
      createdAt: new Date()
    });
  } catch (logError) {
    console.error("Error log failed:", logError.message);
  }
}


function serializeNotification(notification, link = {}) {
  return {
    id: String(notification._id || notification.id || link.notificationId || ""),
    title: notification.title || "Notification",
    body: notification.body || "",
    type: notification.type || "info",
    severity: notification.severity || "normal",
    ticketId: String(notification.ticketId || ""),
    meta: notification.meta || {},
    read: Boolean(link.is_read ?? notification.read),
    deleted: Boolean(link.is_deleted),
    createdAt: notification.createdAt || link.createdAt
  };
}

async function getUnreadCount(userId) {
  const db = database || await connectMongo();
  return db.collection("notification_users").countDocuments({
    userId: String(userId),
    is_read: false,
    is_deleted: { $ne: true }
  });
}

async function emitNotificationToUser(userId, payload) {
  io.to(`user:${userId}`).emit("notification:new", payload);
  const unreadCount = await getUnreadCount(userId);
  io.to(`user:${userId}`).emit("notification:count", { unreadCount });
}

async function resolveNotificationRecipients(target = "all") {
  const db = database || await connectMongo();
  if (target && target !== "all") {
    return db.collection("users").find({ _id: toId(target), isActive: { $ne: false } }).toArray();
  }
  return db.collection("users").find({
    role: { $in: ["Admin", "Manager", "User"] },
    isActive: { $ne: false }
  }).toArray();
}

async function createNotification(target, title, body, type = "info", ticketId = "", meta = {}) {
  try {
    const db = database || await connectMongo();
    const recipients = await resolveNotificationRecipients(target);
    const createdAt = new Date();
    const severity = meta.severity || (type === "urgent" ? "urgent" : type === "status" ? "warning" : type === "ticket" ? "success" : "normal");
    const notification = {
      title,
      body,
      type,
      severity,
      ticketId: String(ticketId || ""),
      meta,
      createdAt
    };
    const result = await db.collection("notifications").insertOne(notification);
    const fullNotification = { ...notification, _id: result.insertedId };

    const links = recipients.map((user) => ({
      notificationId: result.insertedId,
      userId: String(user._id),
      is_read: false,
      is_deleted: false,
      createdAt
    }));

    if (links.length) {
      await db.collection("notification_users").insertMany(links, { ordered: false }).catch(() => null);
      for (const link of links) {
        await emitNotificationToUser(link.userId, serializeNotification(fullNotification, link));
      }
    }

    return fullNotification;
  } catch (error) {
    console.error("Notification failed:", error.message);
    return null;
  }
}

async function createBackup(reason = "manual") {
  const db = await connectMongo();
  const collections = ["users", "tickets", "comments", "activities", "list_items", "attachments"];
  const data = {};
  for (const name of collections) {
    data[name] = await db.collection(name).find({}).toArray();
  }
  const doc = { reason, createdAt: new Date(), data };
  const result = await db.collection("backups").insertOne(doc);
  return { ...doc, _id: result.insertedId };
}


function toId(value) {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}

function cleanUser(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    username: user.username,
    name: user.displayName || user.name || user.username,
    role: user.role || "User",
    isActive: user.isActive !== false,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    lockUntil: user.lockUntil
  };
}

function rowToTicket(ticket) {
  if (!ticket) return null;
  return {
    ...ticket,
    id: String(ticket._id),
    ticketNo: ticket.ticketNo,
    receivedDate: ticket.receivedDate || "",
    requester: ticket.requester || "",
    clientName: ticket.clientName || "",
    subsystem: ticket.subsystem || "",
    ticketType: ticket.ticketType || "Task",
    module: ticket.module || "",
    title: ticket.title || "",
    description: ticket.description || "",
    reply: ticket.reply || "",
    status: ticket.status || "Backlog",
    priority: ticket.priority || "Medium",
    owner: ticket.owner || "",
    dueDate: ticket.dueDate || "",
    nextAction: ticket.nextAction || "",
    
    estimate: Number(ticket.estimate || 0),
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt
  };
}

function signUser(user) {
  return jwt.sign(
    {
      id: String(user._id),
      username: user.username,
      role: user.role,
      name: user.displayName || user.username
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

function adminOnly(req, res, next) {
  if (!hasPermission(req.user?.role, "users.manage")) return res.status(403).json({ error: "Forbidden" });
  next();
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!hasPermission(req.user?.role, permission)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

async function logActivity(ticketId, userId, action, details = "") {
  try {
    await database.collection("activities").insertOne({
      ticketId: String(ticketId),
      userId: String(userId || ""),
      action,
      details,
      createdAt: new Date()
    });
  } catch {}
}

function groupBy(tickets, field) {
  const map = {};
  tickets.forEach((ticket) => {
    const key = ticket[field] || "Unassigned";
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

app.get("/api/health", async (req, res) => {
  try {
    await connectMongo();
    res.json({ ok: true, db: "mongodb", time: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const db = await connectMongo();
    const { username, password } = req.body || {};

    if (typeof username !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const cleanUsername = sanitizeString(username, "", 80).toLowerCase();
    if (!cleanUsername || !password.trim()) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = await db.collection("users").findOne({ username: cleanUsername });
    const now = new Date();

    if (user?.lockUntil && new Date(user.lockUntil) > now) {
      await writeAudit(req, "LOGIN_LOCKED", "user", user._id, { username: cleanUsername });
      return res.status(423).json({ error: "Account temporarily locked. Please try again later." });
    }

    const validPassword = user && bcrypt.compareSync(password || "", user.passwordHash || "");
    if (!user || !validPassword) {
      if (user) {
        const failedLoginAttempts = Number(user.failedLoginAttempts || 0) + 1;
        const update = { failedLoginAttempts, updatedAt: now };
        if (failedLoginAttempts >= 5) update.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await db.collection("users").updateOne({ _id: user._id }, { $set: update });
      }
      await writeAudit(req, "LOGIN_FAILED", "user", user?._id || "", { username: cleanUsername });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.isActive === false) {
      await writeAudit(req, "LOGIN_DISABLED", "user", user._id, { username: cleanUsername });
      return res.status(403).json({ error: "Account is disabled" });
    }

    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { failedLoginAttempts: 0, lockUntil: null, lastLoginAt: now, updatedAt: now } }
    );
    await writeAudit(req, "LOGIN_SUCCESS", "user", user._id, { username: cleanUsername });
    res.json({ token: signUser(user), user: cleanUser(user) });
  } catch (error) {
    await writeErrorLog(req, error, "login");
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const db = await connectMongo();
    const { username, password, name } = req.body || {};
    const cleanUsername = sanitizeString(username, "", 80).toLowerCase();
    const cleanName = sanitizeString(name, "", 120);

    if (!cleanUsername || typeof password !== "string" || !password || !cleanName) {
      return res.status(400).json({ error: "Username, password and name are required" });
    }

    const user = {
      username: cleanUsername,
      passwordHash: bcrypt.hashSync(password, 10),
      displayName: cleanName,
      role: "User",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("users").insertOne(user);
    res.status(201).json({ ok: true, user: cleanUser({ ...user, _id: result.insertedId }) });
  } catch (error) {
    if (String(error.message).includes("duplicate")) return res.status(409).json({ error: "Username already exists" });
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users", authRequired, adminOnly, async (req, res) => {
  const db = await connectMongo();
  const users = await db.collection("users").find({}).sort({ createdAt: -1 }).toArray();
  res.json(users.map(cleanUser));
});

app.post("/api/users", authRequired, adminOnly, async (req, res) => {
  try {
    const db = await connectMongo();
    const { username, password, name, role } = req.body || {};
    const cleanUsername = sanitizeString(username, "", 80).toLowerCase();
    const cleanName = sanitizeString(name, "", 120);
    const cleanRole = allowedRoles.includes(role) ? role : "User";

    if (!cleanUsername || !password || !cleanName) {
      return res.status(400).json({ error: "Username, password and name are required" });
    }

    const user = {
      username: cleanUsername,
      passwordHash: bcrypt.hashSync(password, 10),
      displayName: cleanName,
      role: cleanRole,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("users").insertOne(user);
    await writeAudit(req, "USER_CREATED", "user", result.insertedId, { username: cleanUsername, role: cleanRole });
    res.status(201).json(cleanUser({ ...user, _id: result.insertedId }));
  } catch (error) {
    if (String(error.message).includes("duplicate")) return res.status(409).json({ error: "Username already exists" });
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/users/:id", authRequired, adminOnly, async (req, res) => {
  const db = await connectMongo();
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid user id" });

  const update = {};
  if (typeof req.body?.name === "string" && req.body.name.trim()) update.displayName = req.body.name.trim();
  if (allowedRoles.includes(req.body?.role)) update.role = req.body.role;
  if (req.body?.isActive !== undefined) update.isActive = Boolean(req.body.isActive);
  update.updatedAt = new Date();

  await db.collection("users").updateOne({ _id: id }, { $set: update });
  const user = await db.collection("users").findOne({ _id: id });
  await writeAudit(req, "USER_UPDATED", "user", id, update);
  res.json(cleanUser(user));
});

app.patch("/api/users/:id/password", authRequired, adminOnly, async (req, res) => {
  const db = await connectMongo();
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid user id" });

  const password = String(req.body?.password || "");
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

  await db.collection("users").updateOne(
    { _id: id },
    { $set: { passwordHash: bcrypt.hashSync(password, 10), updatedAt: new Date() } }
  );

  await writeAudit(req, "USER_PASSWORD_RESET", "user", id, {});
  res.json({ ok: true });
});

app.delete("/api/users/:id", authRequired, adminOnly, async (req, res) => {
  const db = await connectMongo();
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid user id" });
  await db.collection("users").deleteOne({ _id: id });
  await writeAudit(req, "USER_DELETED", "user", id, {});
  res.json({ ok: true });
});

app.get("/api/lists", authRequired, async (req, res) => {
  const db = await connectMongo();
  const rows = await db.collection("list_items").find({}).sort({ list_key: 1, createdAt: 1 }).toArray();
  const output = {};
  rows.forEach((row) => {
    if (!output[row.list_key]) output[row.list_key] = [];
    output[row.list_key].push({ id: String(row._id), value: row.value });
  });
  res.json(output);
});

app.post("/api/lists/:key", authRequired, requirePermission("settings.manage"), async (req, res) => {
  try {
    const db = await connectMongo();
    const value = sanitizeString(req.body?.value, "", 120);
    if (!value) return res.status(400).json({ error: "Value is required" });

    const doc = { list_key: req.params.key, value, createdAt: new Date() };
    const result = await db.collection("list_items").insertOne(doc);
    res.status(201).json({ id: String(result.insertedId), list_key: req.params.key, value });
  } catch (error) {
    if (String(error.message).includes("duplicate")) return res.status(409).json({ error: "Item already exists" });
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/lists/:key/:id", authRequired, requirePermission("settings.manage"), async (req, res) => {
  const db = await connectMongo();
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid item id" });
  await db.collection("list_items").deleteOne({ _id: id, list_key: req.params.key });
  res.json({ ok: true });
});

app.get("/api/tickets", authRequired, requirePermission("tickets.view"), async (req, res) => {
  try {
    const db = await connectMongo();

    const q = sanitizeString(req.query.q || req.query.search, "", 100);
    const status = sanitizeString(req.query.status, "All", 80);
    const priority = sanitizeString(req.query.priority, "All", 80);
    const owner = sanitizeString(req.query.owner, "All", 120);
    const type = sanitizeString(req.query.type || req.query.ticketType, "All", 80);
    const subsystem = sanitizeString(req.query.subsystem, "All", 120);
    const client = sanitizeString(req.query.client || req.query.clientName, "All", 120);

    const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
    const limit = Math.min(500, Math.max(1, Number.parseInt(req.query.limit || "100", 10) || 100));
    const skip = (page - 1) * limit;

    const filter = {};

    if (q) {
      const regex = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { ticketNo: regex },
        { title: regex },
        { description: regex },
        { requester: regex },
        { clientName: regex },
        { subsystem: regex },
        { owner: regex },
        { label: regex }
      ];
    }

    if (status && status !== "All") filter.status = status;
    if (priority && priority !== "All") filter.priority = priority;
    if (owner && owner !== "All") filter.owner = owner;
    if (type && type !== "All") filter.ticketType = type;
    if (subsystem && subsystem !== "All") filter.subsystem = subsystem;
    if (client && client !== "All") filter.clientName = client;

    const [tickets, total] = await Promise.all([
      db.collection("tickets").find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection("tickets").countDocuments(filter)
    ]);

    const data = tickets.map(rowToTicket);
    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Load tickets failed" });
  }
});

app.get("/api/tickets/:id", authRequired, requirePermission("tickets.view"), async (req, res) => {
  const db = await connectMongo();
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid ticket id" });

  const ticket = await db.collection("tickets").findOne({ _id: id });
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  const comments = await db.collection("comments").find({ ticketId: req.params.id }).sort({ createdAt: -1 }).toArray();
  const activities = await db.collection("activities").find({ ticketId: req.params.id }).sort({ createdAt: -1 }).toArray();
  const attachments = await db.collection("attachments").find({ ticketId: req.params.id }, { projection: { dataBase64: 0 } }).sort({ createdAt: -1 }).toArray();

  res.json({
    ticket: rowToTicket(ticket),
    comments: comments.map((c) => ({ ...c, id: String(c._id) })),
    activities: activities.map((a) => ({ ...a, id: String(a._id) })),
    attachments: attachments.map((a) => ({ ...a, id: String(a._id) }))
  });
});

app.post("/api/tickets", authRequired, requirePermission("tickets.create"), async (req, res) => {
  try {
    const db = await connectMongo();
    const body = req.body || {};

    const title = requireString(body.title, "Title", 180);
    const description = sanitizeString(body.description, "", 3000);

    const count = await db.collection("tickets").countDocuments();
    const ticketNo = `TCK-${String(count + 1).padStart(4, "0")}`;

    const ticket = {
      ticketNo,
      receivedDate: sanitizeString(body.receivedDate, new Date().toISOString().slice(0, 10), 20),
      requester: sanitizeString(body.requester, "", 120),
      clientName: sanitizeString(body.clientName, "", 120),
      subsystem: sanitizeString(body.subsystem, "", 120),
      ticketType: allowedValue(body.ticketType, allowedTicketTypes, "Task"),
      module: sanitizeString(body.module, "", 120),
      title,
      description,
      reply: sanitizeString(body.reply, "قيد الدراسة", 500),
      status: allowedValue(body.status, allowedStatuses, "Backlog"),
      priority: allowedValue(body.priority, allowedPriorities, "Medium"),
      owner: sanitizeString(body.owner, "", 120),
      dueDate: sanitizeString(body.dueDate, "", 20),
      nextAction: sanitizeString(body.nextAction, "", 500),
      label: sanitizeString(body.label, "", 120),
      estimate: Number(body.estimate || 0),
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("tickets").insertOne(ticket);
    await logActivity(result.insertedId, req.user.id, "created", "Ticket created");
    await writeAudit(req, "TICKET_CREATED", "ticket", result.insertedId, { ticketNo, title });
    await createNotification("all", "New ticket created", `${ticketNo} - ${title}`, "ticket", result.insertedId);
    res.status(201).json(rowToTicket({ ...ticket, _id: result.insertedId }));
  } catch (error) {
    if (error.status === 400) return sendValidationError(res, error);
    res.status(500).json({ error: error.message || "Create ticket failed" });
  }
});

app.patch("/api/tickets/:id", authRequired, requirePermission("tickets.edit"), async (req, res) => {
  try {
    const db = await connectMongo();
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid ticket id" });

    const allowedFields = [
      "receivedDate", "requester", "clientName", "subsystem", "ticketType", "module",
      "title", "description", "reply", "status", "priority", "owner", "dueDate",
      "nextAction", "label", "estimate"
    ];

    const update = {};
    for (const field of allowedFields) {
      if (req.body?.[field] !== undefined) update[field] = req.body[field];
    }

    if (update.title !== undefined) update.title = requireString(update.title, "Title", 180);
    if (update.description !== undefined) update.description = sanitizeString(update.description, "", 3000);
    if (update.status !== undefined) update.status = allowedValue(update.status, allowedStatuses, "Backlog");
    if (update.priority !== undefined) update.priority = allowedValue(update.priority, allowedPriorities, "Medium");
    if (update.ticketType !== undefined) update.ticketType = allowedValue(update.ticketType, allowedTicketTypes, "Task");

    for (const field of ["receivedDate", "requester", "clientName", "subsystem", "module", "reply", "owner", "dueDate", "nextAction", "label"]) {
      if (update[field] !== undefined) update[field] = sanitizeString(update[field], "", 500);
    }

    if (update.estimate !== undefined) update.estimate = Number(update.estimate || 0);
    update.updatedAt = new Date();

    await db.collection("tickets").updateOne({ _id: id }, { $set: update });
    await logActivity(req.params.id, req.user.id, "updated", JSON.stringify(Object.keys(update)));
    const actionName = update.status ? "TICKET_STATUS_CHANGED" : "TICKET_UPDATED";
    await writeAudit(req, actionName, "ticket", id, { updatedFields: Object.keys(update), status: update.status });
    if (update.status) await createNotification("all", "Ticket status changed", `Ticket status changed to ${update.status}`, "status", id);
    const ticket = await db.collection("tickets").findOne({ _id: id });
    res.json(rowToTicket(ticket));
  } catch (error) {
    if (error.status === 400) return sendValidationError(res, error);
    res.status(500).json({ error: error.message || "Update ticket failed" });
  }
});


app.delete("/api/tickets/:id", authRequired, requirePermission("tickets.delete"), async (req, res) => {
  const db = await connectMongo();
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid ticket id" });
  await db.collection("tickets").deleteOne({ _id: id });
  await db.collection("comments").deleteMany({ ticketId: req.params.id });
  await db.collection("activities").deleteMany({ ticketId: req.params.id });
  await db.collection("attachments").deleteMany({ ticketId: req.params.id });
  await writeAudit(req, "TICKET_DELETED", "ticket", id, {});
  res.json({ ok: true });
});

app.post("/api/tickets/:id/comments", authRequired, async (req, res) => {
  const db = await connectMongo();
  const body = String(req.body?.body || "").trim();
  if (!body) return res.status(400).json({ error: "Comment is required" });

  const comment = {
    ticketId: req.params.id,
    userId: req.user.id,
    user_name: req.user.name || req.user.username,
    body,
    createdAt: new Date()
  };

  const result = await db.collection("comments").insertOne(comment);
  await logActivity(req.params.id, req.user.id, "commented", body.slice(0, 120));
  await writeAudit(req, "COMMENT_ADDED", "ticket", req.params.id, { commentId: result.insertedId });
  res.status(201).json({ ...comment, id: String(result.insertedId) });
});


app.get("/api/audit-logs", authRequired, requirePermission("audit.view"), async (req, res) => {
  const db = await connectMongo();
  const limit = Math.min(500, Math.max(1, Number.parseInt(req.query.limit || "100", 10) || 100));
  const rows = await db.collection("audit_logs").find({}).sort({ createdAt: -1 }).limit(limit).toArray();
  res.json(rows.map((row) => ({ ...row, id: String(row._id) })));
});

app.get("/api/error-logs", authRequired, requirePermission("errors.view"), async (req, res) => {
  const db = await connectMongo();
  const rows = await db.collection("error_logs").find({}).sort({ createdAt: -1 }).limit(100).toArray();
  res.json(rows.map((row) => ({ ...row, id: String(row._id) })));
});

app.get("/api/notifications", authRequired, requirePermission("notifications.view"), async (req, res) => {
  const db = await connectMongo();
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit || "12", 10) || 12));
  const skip = (page - 1) * limit;

  const query = { userId: req.user.id, is_deleted: { $ne: true } };
  const [links, total, unreadCount] = await Promise.all([
    db.collection("notification_users").find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    db.collection("notification_users").countDocuments(query),
    getUnreadCount(req.user.id)
  ]);

  const ids = links.map((link) => link.notificationId).filter(Boolean);
  const notifications = ids.length ? await db.collection("notifications").find({ _id: { $in: ids } }).toArray() : [];
  const byId = new Map(notifications.map((item) => [String(item._id), item]));
  const data = links.map((link) => serializeNotification(byId.get(String(link.notificationId)) || {}, link));

  res.json({
    data,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
      hasMore: page * limit < total
    }
  });
});

app.get("/api/notifications/unread-count", authRequired, requirePermission("notifications.view"), async (req, res) => {
  res.json({ unreadCount: await getUnreadCount(req.user.id) });
});

app.patch("/api/notifications/read-all", authRequired, requirePermission("notifications.view"), async (req, res) => {
  const db = await connectMongo();
  await db.collection("notification_users").updateMany(
    { userId: req.user.id, is_deleted: { $ne: true } },
    { $set: { is_read: true, readAt: new Date() } }
  );
  io.to(`user:${req.user.id}`).emit("notification:count", { unreadCount: 0 });
  res.json({ ok: true, unreadCount: 0 });
});

app.patch("/api/notifications/:id/read", authRequired, requirePermission("notifications.view"), async (req, res) => {
  const db = await connectMongo();
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid notification id" });
  await db.collection("notification_users").updateOne(
    { notificationId: id, userId: req.user.id },
    { $set: { is_read: true, readAt: new Date() } }
  );
  const unreadCount = await getUnreadCount(req.user.id);
  io.to(`user:${req.user.id}`).emit("notification:count", { unreadCount });
  res.json({ ok: true, unreadCount });
});


app.get("/api/backup/export", authRequired, requirePermission("backup.manage"), async (req, res) => {
  const backup = await createBackup("manual-export");
  await writeAudit(req, "BACKUP_EXPORTED", "backup", backup._id, {});
  res.setHeader("Content-Disposition", `attachment; filename=flow-ticket-backup-${new Date().toISOString().slice(0,10)}.json`);
  res.json({ version: "6.2.0", exportedAt: new Date().toISOString(), data: backup.data });
});

app.post("/api/backup/restore", authRequired, requirePermission("backup.manage"), async (req, res) => {
  const db = await connectMongo();
  const payload = req.body?.data || req.body;
  const allowed = ["tickets", "comments", "activities", "list_items", "attachments"];
  for (const name of allowed) {
    if (Array.isArray(payload?.[name])) {
      await db.collection(name).deleteMany({});
      const docs = payload[name].map(({ _id, id, ...rest }) => rest);
      if (docs.length) await db.collection(name).insertMany(docs);
    }
  }
  await writeAudit(req, "BACKUP_RESTORED", "backup", "", { collections: allowed });
  res.json({ ok: true });
});

app.get("/api/backups", authRequired, requirePermission("backup.manage"), async (req, res) => {
  const db = await connectMongo();
  const rows = await db.collection("backups").find({}, { projection: { data: 0 } }).sort({ createdAt: -1 }).limit(30).toArray();
  res.json(rows.map((row) => ({ ...row, id: String(row._id) })));
});

app.post("/api/tickets/:id/attachments", authRequired, requirePermission("attachments.manage"), async (req, res) => {
  const db = await connectMongo();
  const ticketId = req.params.id;
  const name = sanitizeString(req.body?.name, "file", 180);
  const mimeType = sanitizeString(req.body?.mimeType, "application/octet-stream", 120);
  const dataBase64 = sanitizeString(req.body?.dataBase64, "", 8 * 1024 * 1024);
  const size = Number(req.body?.size || 0);
  if (!dataBase64) return res.status(400).json({ error: "Attachment data is required" });
  if (size > 5 * 1024 * 1024) return res.status(400).json({ error: "Attachment must be less than 5 MB" });
  const doc = { ticketId, name, mimeType, size, dataBase64, uploadedBy: req.user.id, createdAt: new Date() };
  const result = await db.collection("attachments").insertOne(doc);
  await writeAudit(req, "ATTACHMENT_UPLOADED", "ticket", ticketId, { attachmentId: result.insertedId, name, size });
  res.status(201).json({ ...doc, dataBase64: undefined, id: String(result.insertedId) });
});

app.get("/api/attachments/:id/download", authRequired, requirePermission("tickets.view"), async (req, res) => {
  const db = await connectMongo();
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid attachment id" });
  const file = await db.collection("attachments").findOne({ _id: id });
  if (!file) return res.status(404).json({ error: "Attachment not found" });
  const buffer = Buffer.from(file.dataBase64, "base64");
  res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.name || "file")}"`);
  res.send(buffer);
});

app.delete("/api/attachments/:id", authRequired, requirePermission("attachments.manage"), async (req, res) => {
  const db = await connectMongo();
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid attachment id" });
  await db.collection("attachments").deleteOne({ _id: id });
  await writeAudit(req, "ATTACHMENT_DELETED", "attachment", id, {});
  res.json({ ok: true });
});









// v6.5.3 Final notification delete persistence
app.delete("/api/notifications/:id", authRequired, async (req, res) => {
  try {
    const db = await connectMongo();
    const notificationId = String(req.params.id || "");
    const objectId = toId(notificationId);
    const query = objectId
      ? { $or: [{ _id: objectId }, { id: notificationId }, { notificationId }] }
      : { $or: [{ id: notificationId }, { notificationId }] };

    await db.collection("notifications").deleteOne(query);
    await db.collection("deleted_notifications").updateOne(
      { userId: String(req.user?.id || ""), notificationId },
      { $set: { userId: String(req.user?.id || ""), notificationId, deletedAt: new Date() } },
      { upsert: true }
    );
    await db.collection("user_notifications").updateOne(
      { userId: String(req.user?.id || ""), notificationId },
      { $set: { is_deleted: true, deletedAt: new Date() } },
      { upsert: true }
    );

    res.json({ ok: true, deleted: true, notificationId });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Delete notification failed" });
  }
});

app.get("/api/dashboard", authRequired, async (req, res) => {
  const db = await connectMongo();
  const tickets = (await db.collection("tickets").find({}).toArray()).map(rowToTicket);
  const total = tickets.length;
  const implemented = tickets.filter((ticket) => ["Done", "Closed"].includes(ticket.status) || ticket.reply === "تم التنفيذ").length;
  const active = tickets.filter((ticket) => !["Done", "Closed"].includes(ticket.status)).length;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = tickets.filter((ticket) => ticket.dueDate && ticket.dueDate < today && !["Done", "Closed"].includes(ticket.status)).length;

  res.json({
    total,
    implemented,
    active,
    overdue,
    closureRate: total ? Math.round((implemented / total) * 100) : 0,
    byClient: groupBy(tickets, "clientName").filter((x) => x.name && x.name !== "Unassigned"),
    bySubsystem: groupBy(tickets, "subsystem"),
    byStatus: groupBy(tickets, "status"),
    byPriority: groupBy(tickets, "priority"),
    byType: groupBy(tickets, "ticketType"),
    byOwner: groupBy(tickets, "owner")
  });
});

app.get("/api/excel/sync", authRequired, (req, res) => {
  res.json({ ok: true, message: "MongoDB version: data is stored permanently in MongoDB." });
});

app.get("/api/excel/download", authRequired, requirePermission("backup.manage"), async (req, res) => {
  const backup = await createBackup("excel-download-compat");
  res.setHeader("Content-Disposition", `attachment; filename=flow-ticket-backup-${new Date().toISOString().slice(0,10)}.json`);
  res.json({ version: "6.2.0", exportedAt: new Date().toISOString(), data: backup.data });
});

app.use((err, req, res, next) => {
  console.error("API ERROR:", err);
  writeErrorLog(req, err, "middleware");
  if (res.headersSent) return next(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// Render production: serve React/Vite build from the same Node service.
const clientDistPath = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDistPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server listening on port ${PORT}`);
  console.log(`Flow Ticket MongoDB running on http://localhost:${PORT}`);

  connectMongo()
    .then(() => {
      console.log("✅ App is ready and connected to MongoDB");
      createBackup("startup").catch((error) => console.error("Startup backup failed:", error.message));
      setInterval(() => createBackup("daily").catch((error) => console.error("Daily backup failed:", error.message)), 24 * 60 * 60 * 1000);
    })
    .catch((error) => {
      console.error("❌ MongoDB startup connection failed:", error.message);
      console.error(error);
    });
});
