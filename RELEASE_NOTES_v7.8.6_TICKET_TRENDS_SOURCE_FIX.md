# v7.8.6 — Ticket Trends Source Fix

## Root cause
The `Date` input on Create Ticket and Ticket Details reads and writes `dueDate`, while the trend previously preferred `receivedDate`. This auto-populated field grouped historical/future tickets into the month they were entered.

## Fix
The trend and dashboard date filter now resolve `dueDate` first, then `date`, `receivedDate`, and `createdAt` as fallbacks. No API, schema, ticket records, or SLA calculation changed.

## Regression tests
Run `node --test client/tests/ticketDates.test.mjs` from the project root.

## Important semantics
The displayed `Date` field is also used for due-date/SLA logic in the existing application. This release does not change that behavior. Trends therefore reflect the date selected in the ticket, not necessarily the creation timestamp.
