# v7.7.0 — Modern Login

Based on v7.6.2, includes all unified UI and create-ticket fixes.

- Redesigned split login layout with existing enterprise-building image.
- Modern responsive form, accessible field labels, focus states, and password visibility toggle.
- Arabic and English switching.
- Preserves existing `/auth/login` request and token/session handling.
- No mock statistics, fake SSO, or non-functional password recovery links.

Deploy by copying the contents of this folder into the existing Git repository, retaining `.git`, then push. Test authentication against the configured backend before production.
