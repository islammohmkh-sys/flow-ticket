# Flow Ticket Enterprise v6.8.0 — Phase Two

- Workflow transition rules enforced server-side for standard User accounts; Admin and Manager may correct any status. Viewer remains read-only.
- New GET /api/workflow/transitions endpoint for role-aware clients.
- Ticket status and field changes audited with before/after values, actor and timestamp via existing audit_logs.
- Assignment notifications sent to matching active users by username or displayName.
- Status notifications only when the status actually changes.
- Numeric Estimate validation on create and edit.
- Preserves all v6.7.0 screens and existing notification features.

Note: workflow rules are intentionally linear for User accounts; verify with your business workflow before deploying to production.
