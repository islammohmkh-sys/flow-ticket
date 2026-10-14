# Flow Ticket Enterprise v6.5.6 — Calm Enterprise UI

- Refined dashboard hero to a white executive header; removed saturated gradients.
- Reworked KPI cards with subtle tinted surfaces and legible values.
- Fixed right sidebar navigation hover, active, and text visibility; added navigation symbols.
- Applied muted borders, subtle shadows and accessible keyboard focus states.
- Preserved API calls, database logic, ticket operations and permission checks.

## Deployment
Deploy repository root to Render using existing render.yaml. Do not commit secrets or .env files.

## Verification
Run `cd client && npm install && npm run build`. Manually verify login, navigation, ticket creation, workflows, notifications, themes and RTL/LTR in a staging environment before production.
