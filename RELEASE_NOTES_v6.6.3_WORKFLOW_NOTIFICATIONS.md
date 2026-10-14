# v6.6.3 — Workflow Board & Notification Center

- Renamed Kanban Board to Workflow Board / لوحة سير العمل in UI navigation and headings.
- Rebuilt notification view as a compact single-column inbox with read/unread filters, select visible, bulk read and bulk delete, per-item actions and loading/error states.
- Fixed deletion persistence: notification_users is the authoritative per-user link collection. Earlier DELETE removed a shared notification and wrote to a different collection, leaving visible links behind.
- Deletion now soft-deletes ONLY the requesting user’s notification link; shared notification events remain intact for other users.
- Added POST /api/notifications/bulk-delete and PATCH /api/notifications/bulk-read, with authentication, per-user scoping and 500-item limits.
- Preserved dashboard, ticket screens, server data model and workflows.

Deploy both client AND server; otherwise the new bulk endpoints will not exist. Test in staging, including refresh persistence and multi-user isolation.
