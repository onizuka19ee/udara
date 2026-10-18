# Udara by SMT · v1.2 — Cloudflare on-demand edition

This version preserves the responsive dashboard, automatic location detection, running popup and iOS/PWA support. It fetches official MyEQMS readings only:

- On a fresh page load / opening the app.
- When you tap Refresh or reload the page.
- When you return after more than five minutes in the background (treated as reopening).

There is no hourly job and no automatic data polling while the dashboard remains open. The one-minute display timer only updates the date and stale-data labels; it makes no network requests. Refresh cannot create a newer official station measurement.

## Update an existing Cloudflare Pages site connected to GitHub

1. Extract this ZIP. Upload the **contents** of `ipu-monitor` to your existing repository root. Keep your existing domain configuration.
2. Include the new **`functions/` and `server/` folders**, `package.json`, and the updated app files. The Function provides `/api/readings` on the same domain. Static files alone are insufficient.
3. **Replace `.github/workflows/update-and-deploy.yml` with the supplied file of the same name.** It no longer contains a schedule, collector, bot commit or GitHub Pages deployment. It only checks code on pushes or a manual run. If you created other hourly workflows or Cloudflare Cron Triggers separately, disable those too.
4. In Cloudflare Pages, open this project's build settings. Use:
   - Framework preset: **None**
   - Build command: **npm run build**
   - Build output directory: **dist**
   - Root directory: the repository root (leave blank), unless these files are in a repository subfolder.
5. Redeploy through your existing Git integration. Pages builds `functions/api/readings.js` from the project root; do not move `functions` inside `dist`.
6. Open **your-site-domain/api/readings**. It should return JSON containing `schema`, `fetchedAt`, and `stations`. An HTML page or 404 means the Function was not deployed. A JSON 502 error means the Function is running but cannot currently retrieve/validate the official source.
7. Open the dashboard and tap Refresh. The source retrieval time should change; the station observation time may remain unchanged if MyEQMS has not published a newer measurement.

**Keep your existing `data/latest.json` if you want it as an archive.** This version no longer fetches that file. The old collector script is retained for archival/manual use only and is not invoked by the build, app or workflow. Its old history is not imported automatically.

## If your Cloudflare project is a Worker with Static Assets

Use the supplied `worker.mjs` instead of Pages Functions. Edit `name` in `wrangler.workers.jsonc` to match your existing Worker (do not create a new Worker accidentally). Keep your current domain/routes configuration. Configure your Git-connected Worker:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy --config wrangler.workers.jsonc`

The config binds `dist` as `ASSETS` and routes `/api/*` through the Worker first. There are no Cron Triggers, database bindings or API keys. The web app expects hosting at the domain root.

## If you previously uploaded a static ZIP directly

A plain static upload does not install this backend. Deploy with Pages Git integration, or use Wrangler from this folder:

```bash
npm run build
npx wrangler pages deploy dist --project-name YOUR_EXISTING_PAGES_PROJECT
```

Wrangler must run from this project root so it discovers `functions/`. It will ask you to authenticate to your Cloudflare account. For Workers instead, use the explicit config command above. Cloudflare account limits and policies apply.

## What happens to the trend chart?

History is now collected in this browser's localStorage, with a rolling 48-hour retention and a 24-hour chart. Opening or refreshing records the returned observations, deduplicated by their original station timestamp. No values are invented between visits. Gaps over 90 minutes stay unconnected. History begins with this version and may differ between Safari, an installed home-screen app, and another device. Clearing website data removes it. If browser storage is blocked, readings still work and history lasts for the current page session. CSV export remains available.

## Source and data handling

`server/readings.mjs` retrieves the fixed official DOE MyEQMS endpoint defined in `core.mjs`. It accepts GET only, never accepts a user-supplied upstream URL, does not send user coordinates to DOE, validates the result, and returns non-cacheable JSON. Upstream failures return HTTP 502; previous readings already in memory retain their observation times and running advice becomes unverified. A fresh offline launch has no current readings. The service worker excludes `/api/` and `/data/` from caching.

Observation timestamps and retrieval timestamps are distinct. This particular MapServer encodes MYT wall-clock components into epoch milliseconds; the adapter subtracts eight hours, matching the official map's UTC-getter display convention. Re-check if DOE changes the endpoint. Readings over three hours old, missing timestamps, or unexpectedly future-dated are marked outdated and excluded from national totals.

IPU is the Malaysian index, not pollutant concentration or another country's AQI. The feed has station information and dominant pollutant but no concentration values, weather or forecasts. Source: https://eqms.doe.gov.my/.

## iPhone / PWA

Open the HTTPS site in Safari → Share → Add to Home Screen → enable Open as Web App if offered. The supplied Apple touch and PWA icons use Udara's existing identity. Location is requested automatically and requires your permission. The selected station and recorded history remain on your device; your precise location is not persisted. OpenStreetMap receives the selected station coordinates only when you load the map.

After upgrading, fully close old Udara browser/app windows and reopen once so the v1.2 service worker can activate. If an old icon remains, remove and add the home-screen shortcut again. The app shell can be used offline, but the IPU endpoint is always network-only.

## Running outlook

Shown after the opening location attempt and on reopening after five minutes away; accessible anytime via Running outlook. The morning/evening/night wording follows Malaysia time and does not predict future conditions. Advice uses current available IPU; it does not assess weather, heat, medical history or route conditions. No suitability recommendation is given for failed-fetch, stale, missing, unconfirmed-location or very distant (>100 km) readings.

The app's conservative running guidance is based on DOE's outdoor-activity guidance (page 9): https://www.doe.gov.my/wp-content/uploads/2021/10/General-Information-of-Air-Pollutant-Index.pdf. Running-specific wording is an interpretation, not verbatim DOE advice. This is an independent application.

## Local checks

Node.js 22 or later:

```bash
npm test
npm run build
npx wrangler pages dev dist
```

For Workers: `npx wrangler dev --config wrangler.workers.jsonc` after building. A simple Python static server is no longer sufficient for the live endpoint.

Tests cover category boundaries, distance/missing values, timestamp conversion, history, running advice and endpoint success/error/method handling. The official source has been checked from the development environment; account-specific Cloudflare deployment and device UI flows must be checked after you deploy. No changes have been made to your Cloudflare account or live site.

Cloudflare references:
- https://developers.cloudflare.com/pages/functions/routing/
- https://developers.cloudflare.com/pages/functions/deployment/
- https://developers.cloudflare.com/workers/static-assets/binding/
