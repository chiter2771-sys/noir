# NOIR technical audit

## Critical findings addressed
- Railway could not detect the app because runtime files were nested under `noir-project`; root `package.json`, `railway.json` and `start.sh` now expose a single deploy entrypoint.
- Static-only prototype had no production API seams; the server now has catalog, search, playback, auth-provider and balancer endpoints.
- Security was declarative only; runtime now applies CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options, CSRF cookie validation for unsafe methods and per-route in-memory rate limiting.
- Search UX was only DOM-local; `/api/search` supports sanitized live-search queries across titles, original titles, genres and actors.
- Video balancer integration lacked an executable contract; `/api/playback/:id` now returns provider, external id, translations, qualities and missing-video status.

## Remaining production backlog
1. Move sessions/rate limits from memory to Redis before multi-instance scaling.
2. Add a migration runner in CI/CD and run `001_initial_streaming_schema.sql` against Railway PostgreSQL.
3. Replace demo playback with licensed balancer adapters and signed playback URLs.
4. Add Playwright visual/accessibility regression tests when browser binaries are available in CI.
5. Split the large HTML prototype into components during the framework migration stage.
