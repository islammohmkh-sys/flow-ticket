/** Calendar-safe ticket date parsing for the Date field shown in ticket forms. */
export function parseTicketDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') { const d = new Date(value); return Number.isNaN(d.getTime()) ? null : d; }
  if (typeof value !== 'string' || !value.trim()) return null;
  const raw = value.trim();
  // ISO and YYYY/MM/DD use calendar components to avoid UTC timezone shifting the month.
  const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s].*)?$/);
  const dayFirst = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (iso || dayFirst) {
    const year = Number(iso ? iso[1] : dayFirst[3]);
    const month = Number(iso ? iso[2] : dayFirst[2]);
    const day = Number(iso ? iso[3] : dayFirst[1]);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function ticketBusinessDate(ticket) {
  // The UI labels dueDate as "Date" in both Create Ticket and Ticket Details.
  // receivedDate is a separate, auto-filled record field and must not override it.
  return parseTicketDate(ticket?.dueDate) || parseTicketDate(ticket?.date) || parseTicketDate(ticket?.receivedDate) || parseTicketDate(ticket?.createdAt);
}

export function ticketMonthKey(ticket) {
  const date = ticketBusinessDate(ticket);
  return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : null;
}

export function buildTicketTrend(tickets, startMonth, months, { isCompleted, isOverdue, locale = 'ar' } = {}) {
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(startMonth.getFullYear(), startMonth.getMonth() + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthTickets = tickets.filter(ticket => ticketMonthKey(ticket) === key);
    return {
      key,
      month: new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(date),
      completed: monthTickets.filter(ticket => isCompleted(ticket)).length,
      open: monthTickets.filter(ticket => !isCompleted(ticket)).length,
      overdue: monthTickets.filter(ticket => !isCompleted(ticket) && isOverdue(ticket)).length
    };
  });
}
