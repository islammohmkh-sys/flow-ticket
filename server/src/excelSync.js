import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import { db, rowToTicket } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const excelFilePath = path.join(__dirname, "..", "data", "flow_ticket_data.xlsx");

function getTicketRows() {
  let rows;
  try {
    rows = db.prepare(`
      SELECT t.*, p.name AS project_name, p.key AS project_key
      FROM tickets t
      LEFT JOIN projects p ON p.id = t.project_id
      ORDER BY t.id DESC
    `).all();
  } catch {
    rows = db.prepare("SELECT * FROM tickets ORDER BY id DESC").all();
  }
  return rows.map(rowToTicket);
}

export function syncTicketsToExcel() {
  const tickets = getTicketRows();

  const ticketRows = tickets.map((ticket) => ({
    "Ticket Number": ticket.ticketNo || "",
    "Project": ticket.projectName || "",
    "Received Date": ticket.receivedDate || "",
    "Requester": ticket.requester || "",
    "Subsystem": ticket.subsystem || "",
    "Issue Type": ticket.ticketType || "",
    "Module": ticket.module || "",
    "Summary": ticket.title || "",
    "Description": ticket.description || "",
    "Reply": ticket.reply || "",
    "Status": ticket.status || "",
    "Priority": ticket.priority || "",
    "Owner": ticket.owner || "",
    "Due Date": ticket.dueDate || "",
    "SLA Due": ticket.slaDueAt || "",
    "Next Action": ticket.nextAction || "",
    "Label": ticket.label || "",
    "Estimate": ticket.estimate || 0,
    "Created At": ticket.createdAt || "",
    "Updated At": ticket.updatedAt || ""
  }));

  let activityRows = [];
  let commentRows = [];

  try {
    activityRows = db.prepare(`
      SELECT a.id, t.ticket_no AS ticket_no, u.display_name AS user_name, a.action, a.details, a.created_at
      FROM activities a
      LEFT JOIN tickets t ON t.id = a.ticket_id
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.id DESC
    `).all().map((a) => ({
      "ID": a.id,
      "Ticket Number": a.ticket_no || "",
      "User": a.user_name || "",
      "Action": a.action || "",
      "Details": a.details || "",
      "Date": a.created_at || ""
    }));
  } catch {}

  try {
    commentRows = db.prepare(`
      SELECT c.id, t.ticket_no AS ticket_no, u.display_name AS user_name, c.body, c.created_at
      FROM comments c
      LEFT JOIN tickets t ON t.id = c.ticket_id
      LEFT JOIN users u ON u.id = c.user_id
      ORDER BY c.id DESC
    `).all().map((c) => ({
      "ID": c.id,
      "Ticket Number": c.ticket_no || "",
      "User": c.user_name || "",
      "Comment": c.body || "",
      "Date": c.created_at || ""
    }));
  } catch {}

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(ticketRows), "Tickets");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(activityRows), "Activity Log");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(commentRows), "Comments");

  XLSX.writeFile(workbook, excelFilePath);
  return { path: excelFilePath, tickets: ticketRows.length, activities: activityRows.length, comments: commentRows.length };
}
