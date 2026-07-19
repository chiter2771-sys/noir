# NOIR Product Discovery

## 1. Product thesis
NOIR is a premium dark-mode digital cinema experience focused on fast content discovery, emotionally rich browsing, and a video-balancer-ready watch surface. The product language is cinematic, quiet, tactile, and precise: less interface, more intent.

## 2. Information architecture
- **Home**: editorial spotlight, continue watching, top charts, mood-led rails, premieres, anime, collections.
- **Catalog**: movies, series, anime, animation, new, coming soon, top, awards, channels, trailers.
- **Discovery**: genres, mood, studios, actors, directors, collections, recommendations.
- **Personal**: continue watching, favorites, history, lists, family profiles, kids mode, statistics.
- **Search**: command-palette style search across titles, genres, people, directors, collections, and trending queries.
- **Watch**: playback shell, translation/quality/subtitles, title metadata, episodes, cast, ratings, recommendations.
- **Profile**: avatar, family profiles, subscription, devices, downloads, quality, security, parental controls.

## 3. Screen map
1. **Global Shell**: fixed translucent navigation, horizontal ecosystem links, search trigger, notifications, profile trigger.
2. **Home / Showcase**: rotating hero with real title artwork, high-signal metadata, primary watch CTA, save CTA, editorial rails.
3. **Catalog Surface**: filterable grid with query, type, genre, country, quality, sort.
4. **Spotlight Search**: instant results with posters, metadata, suggestions, trending genres, people and directors.
5. **Watch Surface**: cinematic player contract for Video Balancer integration, metadata tabs, episodes, cast, ratings, reviews, similar titles.
6. **Profile Surface**: family profiles, viewing stats, lists, devices, subscription and settings.
7. **Reduced Motion / Mobile / TV states**: simplified transitions, larger targets, keyboard focus and spatial navigation.

## 4. Core user scenarios
- Start watching a highlighted movie from Home in one click.
- Resume a series from Continue Watching in one click.
- Search “Нолан”, see director/title matches, open or play in two clicks.
- Filter catalog to “Сериалы → Драма → rating” and start watching.
- Add a title to list/favorites and see state reflected immediately.
- Switch family profile or enable kids mode from Profile.
- Open Watch, choose translation/quality/subtitles, and continue playback through a future balancer adapter.

## 5. Design system
### Visual language
- Background: near-black layered with subtle violet aurora and radial vignettes.
- Surfaces: glass only for navigation/search/panels; matte cards elsewhere.
- Light: soft violet bloom, gold rating accents, green availability badges.
- Density: generous whitespace on desktop, compressed rails on mobile.

### Design tokens
- Color: `--noir-950`, `--noir-900`, `--ink`, `--muted`, `--violet`, `--violet-2`, `--gold`, `--green`, `--danger`.
- Radius: xs 8, sm 12, md 18, lg 28, xl 36.
- Shadow: ambient, lift, glow, focus.
- Typography: Inter with display weights; clamped display sizes.
- Motion: snap 160ms, hover 220ms, reveal 620ms, modal 360ms.

## 6. Component library
- AppShell, TopNavigation, EcosystemNav, AvatarMenu.
- HeroShowcase, HeroIndicator, MetadataStack.
- ContentRail, RailControls, PosterCard, WideProgressCard, TopRankCard.
- CatalogFilters, CatalogGrid, FilterChip.
- SpotlightSearch, SearchResult, SuggestionPill.
- PlayerShell, BalancerAdapterContract, PlayerControls, QualitySelector.
- DetailTabs, EpisodesList, CastGrid, RatingCards, ReviewFeed.
- ProfileHub, ProfileCard, SettingTile, StatsStrip.
- Skeleton, Toast, FocusRing, Empty-but-actionable state.

## 7. Animation system
- Use transform, opacity and filter only for interaction/reveal.
- Hero backdrop slow scale: 9s cubic bezier calm drift.
- Cards: translateY + scale, shadow ramp and image brightness.
- Rails: smooth native scrolling with snap and fade masks.
- Search: opacity + translateY + backdrop blur.
- Page transitions: display swap with fade/slide.
- Reduced motion: disable long transitions and scroll behavior.

## 8. Interface states
- Default, hover, active, pressed, focus-visible, loading, skeleton, disabled, saved, liked, selected, current episode, error, empty with next action.
- Every interactive element has visible focus and accessible label.

## 9. Data architecture and API
### Current source
- `src/data/catalog.json` is the local normalized content cache with real TMDB image URLs and real title metadata.

### Title schema
- id, type, title, originalTitle, year, releaseDate, ageRating, runtimeMinutes, status, country, studio, quality, genres, rating, popularity, posterUrl, backdropUrl, overview, people, externalIds, trailerUrl, optional seasons/episodes, optional progress.

### API contract
- `GET /api/catalog?type=&genre=&sort=` returns public titles and playback status.
- `GET /api/search?q=` returns matching titles and suggestions.
- `GET /api/playback/:id` returns Video Balancer adapter metadata: provider, externalId, translations, qualities, status.
- `GET /api/video-balancers` returns active adapter capabilities.

## 10. Performance plan
- Data-driven rendering from one JSON payload.
- Native lazy-loaded images with explicit dimensions/aspect ratios.
- No framework bundle; keep JS modular and defer non-critical work.
- Preconnect to image/font origins.
- Minimize CLS with fixed card ratios and reserved hero height.
- Avoid layout animations; use GPU-friendly transforms.

## 11. Accessibility plan
- Landmarks: nav, main, sections, dialogs.
- Buttons have labels and focus-visible rings.
- Search dialog supports Escape and autofocus.
- Keyboard activation for cards via Enter/Space.
- Reduced-motion media query.
- Contrast-preserving tokens and semantic headings.

## 12. Implementation plan
1. Replace static handmade rows with catalog-driven rendering.
2. Expand real catalog data with movie, series and anime entries using TMDB image assets and real metadata.
3. Upgrade global navigation into an ecosystem navigation shell.
4. Build premium hero, rails, catalog, profile, search and watch experiences on existing server/API.
5. Remove Unsplash/demo imagery from user surfaces.
6. Preserve Video Balancer abstraction and keep playback UI adapter-ready.
7. Run syntax checks and API smoke checks.
