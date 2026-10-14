# Flow Ticket Enterprise v6.9.0 – Phase Three

- Dashboard filters by creation period, owner, and status; reset filters.
- Dashboard KPIs, charts, workflow summary and recent tickets respect filters.
- CSV report download for the filtered tickets, UTF-8 with BOM for Excel Arabic compatibility.
- Due-date SLA indicators: open overdue tickets, due within 3 days, and open-ticket due-date compliance.
- SLA is based on ticket due dates, not business hours or contractual SLA policies; tickets without due dates are excluded from compliance.
- No database migration or API changes; existing `/api/dashboard` remains.
- Note: Dashboard loads at most 500 tickets from the existing tickets endpoint. For larger installations, implement server-side aggregated reporting before relying on these counts.
