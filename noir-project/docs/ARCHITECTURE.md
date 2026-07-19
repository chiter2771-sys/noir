# NOIR architecture roadmap

NOIR is split into clear product domains: identity, profiles, catalog, playback, recommendations, community, billing, notifications and moderation. The current static UI is retained as a high-fidelity prototype, while the added server, configuration and database schema define the production seams for Railway now and VPS/Kubernetes later.

## Decisions
- Environment-driven config for OAuth providers, balancers, cookies, CSP and rate limits.
- External video playback uses adapter boundaries: `videoBalancers[]` stores provider, credentials and supported capabilities.
- PostgreSQL is the source of truth; Redis is planned for sessions, rate limits, search suggestions and hot catalog caches.
- All user-generated text must be validated and sanitized API-side before persistence.
- OAuth callbacks are reserved at `/auth/google/callback`, `/auth/yandex/callback` and `/auth/vk/callback`.

## Next implementation increments
1. Replace inline prototype data with `/api/catalog` and `/api/search` endpoints.
2. Add migrations runner and seed importer from TMDB/Kinopoisk-compatible sources.
3. Implement balancer adapters with a common `resolvePlayable(title, episode, profile)` contract.
4. Add RBAC middleware for admin, moderator and premium-only surfaces.
