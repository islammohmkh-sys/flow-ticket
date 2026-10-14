# v7.6.2 — Create Ticket validation fix

Based on unified v7.6.1.

- Synchronize required dropdown initial values with React form state when `/lists` loads.
- Preserve valid existing form values.
- Show exact missing required field names on submission.
- Keep existing server APIs, workflow, and ticket validation unchanged.

Test by opening Create Ticket, entering Requester and Ticket Summary, checking the dropdown selections, and submitting. Confirm the ticket is saved and visible on the board.
