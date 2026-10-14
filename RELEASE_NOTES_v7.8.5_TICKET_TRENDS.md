# Flow Ticket Enterprise v7.8.5 — Ticket Trends Date Fix

- Trend grouping now uses ticket business date (`receivedDate` / `date`) before `createdAt`.
- Explicitly parses YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY, and ISO timestamps, preserving calendar month.
- Trend controls allow six or twelve months, and navigation backward/forward.
- All months display, including months with zero tickets. Future months show zero unless dated tickets exist.
- Existing filters still apply to trend and other dashboard indicators.
- No server, database, authentication, ticket creation, or workflow logic changed.
- No migration required.
