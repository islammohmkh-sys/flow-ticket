# v7.3.0 — Workflow Designer

Based on v6.9.0 (does not incorporate separate v7.0-v7.2 branches).

- Admin-only workflow designer in Settings; add custom states and configure allowed transitions with checkboxes.
- Admin can set Manager/User transition behavior (any, configured, none). Admin always retains full control; Viewer remains read-only.
- MongoDB persisted workflow configuration, validated server-side, with audit log of changes.
- Workflow status update endpoint enforces configured transitions; ticket creation accepts configured statuses.
- Existing seven core statuses cannot be removed to preserve historical tickets and compatibility.

**Known limitations:** Workflow Board visualization and some dashboard/status filters still use the original seven core statuses; custom statuses may not appear in those views until the UI is migrated to use the workflow endpoint. This release does not include visual drag-and-drop positioning or per-transition approval forms. Test before production deployment.
