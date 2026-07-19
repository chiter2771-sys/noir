# Railway environment variables for NOIR

## Required for Video Balancer catalog sync
- `NOIR_VIDEO_BALANCER_API_KEY` — the only API key name to use in Railway.

## Optional Video Balancer variables
- `NOIR_VIDEO_BALANCER_CATALOG_URL` — JSON catalog endpoint used to pull movies, series, animation, anime, seasons and episodes.
- `NOIR_VIDEO_BALANCER_IFRAME_TEMPLATE` — iframe URL template for the custom player shell. Supported placeholders: `{id}`, `{externalId}`, `{apiKey}`.
- `NOIR_VIDEO_BALANCER_PROVIDER` — readable provider name for internal diagnostics.
- `NOIR_VIDEO_BALANCER_SYNC_INTERVAL_MS` — auto-refresh interval. Default: `1800000`.

## Behavior
- If only the API key is present, NOIR keeps the local catalog and reports the balancer as configured but not syncable until a catalog URL is provided.
- If the balancer request fails, NOIR falls back to the local catalog and keeps the site usable.
- Posters/backdrops are served through `/api/image` so metadata and playback can come from different sources without making the UI depend on one provider.
