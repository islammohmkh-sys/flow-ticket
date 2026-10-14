# Flow Ticket Enterprise v6.6.2 — Authentication session fix

Based on v6.6.1 Executive Dashboard. Fixes cached JWT session handling:
- Detect expired or malformed JWT at application startup and return to login.
- On authenticated API 401 Invalid token/Unauthorized, clear stale credentials and show login.
- Check session expiration on window focus and periodically.
- Avoid clearing a newly issued token in response to a stale request.
- Preserve login error handling, existing dashboard design and business workflows.

Server JWT expiration remains 2 hours; users must log in again after expiry.
JWT_SECRET must remain consistent between Render deployments and across instances.
No database or backend API schema changes.

Test: login, wait/expire token, refresh, invalid token, dashboard API calls, logout, login errors.
