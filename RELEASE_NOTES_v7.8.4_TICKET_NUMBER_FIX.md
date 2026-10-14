# v7.8.4 — Ticket number collision fix

- Replaced countDocuments()+1 ticket numbering with a MongoDB atomic counter.
- Initializes/synchronizes the counter to the highest existing TCK-number before allocation.
- Preserves existing tickets, IDs, permissions, API routes, and UI.
- Duplicate key conflicts now return HTTP 409 instead of exposing raw MongoDB internals.

## Deployment verification
Create two tickets, verify their numbers are distinct, delete one, create another, and verify no number is reused. Test simultaneous creates from two accounts.
