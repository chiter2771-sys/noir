# NOIR Product Discovery

## 1. Product thesis
NOIR is a premium digital cinema for people who want to choose faster and feel the value of the service before playback starts. The product is cinematic, quiet, tactile and editorial: every surface should reduce choice anxiety, surface intent, and keep the user within two actions of a meaningful watch decision.

## 2. Product principles
- **Content first**: interface supports artwork, metadata and motion instead of competing with them.
- **Two-click discovery**: from any primary screen, a user can search, filter, resume or start a title in two interactions.
- **No technical leakage**: OAuth, deployment, API and balancer implementation details stay out of customer UI.
- **Premium restraint**: dark theme, deep spacing, controlled glow, high contrast, no decorative noise.
- **Motion with purpose**: every transition confirms state, preserves context or increases perceived speed.
- **Real data only**: title cards use normalized catalog metadata, real posters, real backdrops, ratings, genres, people and countries.

## 3. Information architecture
### Global shell
- Persistent translucent top navigation with NOIR brand, ecosystem links, Spotlight search, notifications and active profile.
- Primary destinations: Home, Movies, Series, Anime, Animation, New, Top, Mood, Awards, Collections.
- Secondary destinations planned in architecture: Continue Watching, Favorites, History, My Lists, Kids, Actors, Directors, Studios, TV Channels, Live, Community, Film News, Reviews, Trailers, Premiere Calendar.

### Content surfaces
- **Home**: dynamic editorial showcase, continue watching, top chart, cinema rail, series rail, anime/animation rail.
- **Catalog**: typed and filtered grid with text query, type, genre, quality and sorting.
- **Spotlight Search**: command-palette search across titles, original titles, actors, directors and genres.
- **Watch**: player shell prepared for a Video Balancer adapter, title detail, cast, audio/subtitle/quality controls and recommendation entry points.
- **Profile**: family center with avatars, adult/kids mode, watch statistics, devices, subscription, downloads, security and quality.

## 4. Screen map
1. **Home / Showcase**
   - Hero with real backdrop, title metadata, rating, quality, age rating, watch/save/catalog actions.
   - Rails progressively reveal content and preserve horizontal scroll position.
2. **Catalog**
   - Large surface title, filter bar, responsive poster grid, keyboard-watchable cards.
3. **Spotlight**
   - Modal overlay with autofocus, Escape close, real-time result list, trending zero-query state.
4. **Watch**
   - 16:9 player stage, calm pre-play state, detail tabs, cast grid and playback preference panel.
5. **Profile**
   - Profile card, mode chips, statistics and setting tiles for family-grade account management.
6. **Responsive states**
   - Desktop/laptop: full top ecosystem navigation.
   - Tablet/mobile: compact navigation, tighter rails, large touch targets.
   - TV/ultrawide: large hero, spatial focus, oversized metadata and cards.

## 5. User scenarios
- **Resume**: user lands on Home → Continue Watching card → Play.
- **Editorial start**: user opens Home → accepts highlighted recommendation → Play.
- **Intent search**: user presses Ctrl/⌘+K → types actor/director/title → opens result.
- **Catalog filtering**: user selects Series + genre + rating sort → starts top result.
- **Family management**: user opens Profile → switches adult/kids context → reviews quality, devices and security.
- **Playback preparation**: user opens Watch → sees title context → chooses quality/audio/subtitles when balancer capabilities are connected.

## 6. Design system
### Visual language
- Near-black base with subtle violet aurora and bottom vignette.
- Matte cards and panels; glass reserved for shell, filters and overlays.
- Violet is the action color, gold is rating trust, green is availability/progress.
- Rounded geometry: soft but precise, never playful.

### Design tokens
- **Colors**: `--noir-980`, `--noir-950`, `--noir-900`, `--surface`, `--surface-2`, `--line`, `--ink`, `--muted`, `--dim`, `--violet`, `--violet-2`, `--violet-soft`, `--gold`, `--green`, `--danger`.
- **Radius**: `--r-sm` 12px, `--r-md` 18px, `--r-lg` 28px.
- **Shadow**: ambient depth, hover lift, violet action glow.
- **Typography**: Inter, heavy negative-letterspaced display titles, readable body line-height.
- **Spacing**: clamp-based page gutters from 20px to 72px.
- **Motion**: `--ease` cubic-bezier(.16,1,.3,1), 160–240ms interaction, 360ms overlays, 620ms reveal, 9s hero drift.

## 7. Component library
- AppShell, TopNavigation, EcosystemNav, ProfileAvatar.
- HeroShowcase, MetadataPill, ActionButton.
- ContentRail, PosterCard, WideProgressCard, RankedCard.
- CatalogFilters, CatalogGrid, FilterSelect.
- SpotlightSearch, SearchResult, TrendingSuggestion.
- PlayerShell, PlaybackPreferencePanel, DetailTabs, CastGrid.
- ProfileHub, ProfileModeTabs, StatsGrid, SettingTile.
- Accessibility primitives: SkipLink, FocusRing, ReducedMotion, KeyboardCardActivation.

## 8. Animation system
- GPU-only transforms/opacity/filter for hover, modal and page transitions.
- Hero backdrop uses slow scale settling to create depth without moving layout.
- Cards lift with scale, border tint and shadow ramp; action row reveals on hover/focus.
- Search overlay uses blur-backed presence, autofocus and Escape close.
- Native horizontal rails use scroll snapping and hidden scrollbars for touch/trackpad comfort.
- Reduced-motion disables animations and smooth scroll.

## 9. Interface states
- Buttons/cards: default, hover, active, pressed, focus-visible, selected, saved.
- Data: loading, populated, filtered-empty, search-empty, rate-limited/error via API.
- Player: pre-play, playing-ready, unavailable metadata-only, quality/audio/subtitle selected.
- Profile: adult, kids, family, security attention, device active/inactive.

## 10. Data architecture and API
### Current normalized source
`src/data/catalog.json` is the local content cache with real public artwork URLs and real title metadata.

### Title schema
- `id`, `type`, `title`, `originalTitle`, `year`, `releaseDate`, `ageRating`, `runtimeMinutes`, `status`, `country`, `studio`, `quality`, `genres`, `rating`, `popularity`, `posterUrl`, `backdropUrl`, `overview`, `people`, `externalIds`, `trailerUrl`, optional `progress`.

### API contract
- `GET /api/catalog?type=&genre=&sort=` returns public titles and playback status.
- `GET /api/search?q=` returns matching titles and suggestions.
- `GET /api/playback/:id` returns adapter metadata for provider, external id, translations, qualities and status.
- `GET /api/video-balancers` returns active adapter capabilities.

## 11. Video architecture
- The customer UI says “Смотреть” and “Воспроизведение”; it never exposes implementation labels.
- Server playback endpoint is the boundary for a future Video Balancer adapter.
- Balancer provider, base URL and keys must come from the hosting environment, never from customer-facing client code.
- Watch screen consumes catalog metadata now and can later request streams, translations, subtitles, episodes and watch position through `/api/playback/:id`.

## 12. Performance plan
- Keep the current no-bundle architecture for first release increment.
- Lazy-load posters/backdrops outside hero, reserve image aspect ratios, avoid CLS.
- Serve TMDB artwork through the NOIR image proxy so deployed environments control caching, headers and resilience.
- Use a single catalog payload, no blocking third-party scripts, preconnect to image/font origins.
- Prefer native scrolling and CSS transitions over heavy JS animation.
- Keep client rendering small and data-driven; future large catalogs should add pagination/virtualized rails.

## 13. Accessibility plan
- Semantic landmarks and headings.
- Skip link, keyboard navigation, visible focus, Enter/Space card activation.
- Search dialog has role, modal semantics, Escape close and autofocus.
- Contrast-safe dark tokens and readable body copy.
- Reduced-motion media query protects motion-sensitive users.

## 14. Implementation sequence
1. Establish this Product Discovery and architecture before code.
2. Remove customer-facing technical labels from UI while preserving backend adapter contracts.
3. Upgrade customer copy, filters and empty states to feel like a finished product.
4. Add richer account/watch states without introducing fake technical blocks.
5. Run syntax/API smoke checks and commit only verified changes.

## 15. Video Balancer environment contract
- Railway variable for the API key: `NOIR_VIDEO_BALANCER_API_KEY`.
- Optional catalog endpoint: `NOIR_VIDEO_BALANCER_CATALOG_URL`.
- Optional iframe template: `NOIR_VIDEO_BALANCER_IFRAME_TEMPLATE`, with `{id}` or `{externalId}` placeholders for the balancer title id and `{apiKey}` only if the provider requires a signed/embed token in the iframe URL.
- Optional provider label: `NOIR_VIDEO_BALANCER_PROVIDER`.
- Optional auto-sync interval: `NOIR_VIDEO_BALANCER_SYNC_INTERVAL_MS`, default 30 minutes.
- NOIR must continue serving the local normalized catalog when the balancer is unavailable, rate-limited or misconfigured.
