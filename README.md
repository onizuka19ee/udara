# Udara by SMT — Malaysia Air Monitor · v1.1

A responsive, dependency-free IPU dashboard designed for GitHub Pages. No API key, paid service, or running PC is needed. This is an independent dashboard, not an official DOE application.

## Publish manually on GitHub

1. Extract this ZIP. Create a **public** GitHub repository with the default branch **main**.
2. Upload the **contents** of `ipu-monitor`, not the outer folder. `index.html` must be at the repository root. Include `data`, `scripts`, `tests`, and **`.github/workflows/update-and-deploy.yml`**. The `.github` folder may be hidden in your file manager. If browser upload skips it, use GitHub **Add file → Create new file**, enter `.github/workflows/update-and-deploy.yml`, and paste the supplied workflow text.
3. Open **Settings → Pages → Build and deployment → Source**, and select **GitHub Actions**.
4. Under **Settings → Actions → General → Workflow permissions**, allow **Read and write permissions**. The workflow stores new observations in `data/latest.json`. Repository rules must permit the workflow to push to `main`.
5. Open **Actions → Update IPU and deploy → Run workflow → main**. If the first automatic run failed before Pages was enabled, rerun it now.
6. When deployment finishes, open the URL under **Settings → Pages**: normally `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.
7. Location is requested automatically when the app opens. Allow access when prompted. Tap **Use my location** to retry if needed. On a laptop, approximate Wi-Fi positioning may be less precise than phone GPS. If permission is denied, search for a station or choose one from the table.

Do not upload the ZIP itself as the website. No npm installation or build is needed. All paths support both a repository subdirectory and a custom domain. To use your own domain, configure it under GitHub Pages settings and follow GitHub's DNS instructions.

## Data and update behaviour

- Source: https://eqms.doe.gov.my/ (the destination of the supplied Google link).
- Official public ArcGIS query: `SOURCE` in `core.mjs`. It returns station IPU, observation timestamp, dominant pollutant, category, and coordinates.
- The source's CORS headers do not allow arbitrary GitHub Pages origins. **GitHub Actions fetches on the server**, saves validated JSON, and deploys it with the site. No public CORS proxy is used.
- The workflow runs hourly at minute 17 UTC, on pushes to `main`, and on manual runs. GitHub schedules can be delayed; this is not guaranteed real-time monitoring. Refresh in the app fetches the latest **published snapshot**, not the government server directly. It also checks automatically every 5 minutes while visible.
- GitHub may disable schedules in inactive public repositories after 60 days. Check the Actions tab periodically and re-enable if needed. GitHub plan limits and policies apply.
- The archive includes a real snapshot retrieved during development, not sample readings. Its original observation and fetch timestamps are retained. The first workflow run replaces it with current available data.
- Readings older than 3 hours, missing a timestamp, or more than 15 minutes in the future are marked outdated. Outdated and missing readings are excluded from the national category totals.
- A failed source request never replaces the last saved data. The workflow emits a warning and publishes the existing snapshot with its original timestamps. If data becomes old, the site displays a warning.
- The feed does **not** supply pollutant concentrations, weather, a forecast, or complete history. None are fabricated or silently substituted with a different country's AQI scale.
- A rolling 48-hour observation history is retained; the chart displays the last 24 hours. History builds after deployment. Duplicate observation timestamps are updated rather than appended. Gaps over 90 minutes are not connected.
- Timestamp handling: this specific DOE MapServer encodes Malaysian wall-clock time into epoch components; its official map uses UTC getters to display those components. The adapter subtracts 8 hours to obtain a true UTC instant, then the UI formats it in Malaysia time. Re-check this mapping if DOE changes the endpoint.
- DOE source markers (such as `**`) are displayed verbatim; the dominant parameter text is preserved as reported. Refer to MyEQMS for marker interpretation.
- IPU categories: 0–50 Good; 51–100 Moderate; 101–200 Unhealthy; 201–300 Very unhealthy; over 300 Hazardous. Colours follow the MyEQMS interface: blue, green, yellow, orange, red.

## Features

- Nearest station using browser geolocation and great-circle distance, calculated entirely in the browser.
- Automatic location request on opening. A saved station or Putrajaya is only a labelled fallback if location is unavailable; the running popup asks you to confirm a station before assessing suitability.
- Search by station/state; state filter; highest, lowest, alphabetical and nearest sorting.
- Station timestamp, freshness, distance, dominant pollutant and site details.
- On-demand OpenStreetMap; external map link remains usable if the embed is blocked.
- Actual collected trend and CSV download; Malaysia time display, with UTC timestamps also in CSV.
- Keyboard-accessible controls, visible focus, screen-reader status messages, reduced-motion support, mobile layout, and no external JavaScript dependencies.
- No analytics, AI branding, account system, or GPS storage. Only the selected station ID is saved in localStorage. Map requests expose the selected station location to OpenStreetMap, not the user's GPS coordinates.

## Preview locally

From this folder, run:

```bash
python -m http.server 8080
```

Windows can use `py -m http.server 8080`. Open http://localhost:8080. Do not double-click `index.html`: browsers block module/fetch behaviour on `file://`. Location access requires HTTPS or localhost. Accessing a local server via a phone over plain HTTP may not support geolocation; use the HTTPS GitHub Pages URL.

## Manual collection / verification

Node.js 22 or later:

```bash
node --test tests/*.test.mjs
node scripts/update-data.mjs
```

Tests cover category boundaries, missing data, distances, stale data, rejected source payloads and history deduplication. The development environment did not provide a supported browser QA tool, so visual rendering and geolocation permission flows must be checked on your laptop/phone after deployment. Deployment to your own GitHub repository was intentionally not performed.

## Troubleshooting

- **No new readings:** check the latest Action's `Retrieve official readings` log. Source availability or schema changes can require adapter updates. Check the official portal.
- **403 when saving observations:** enable workflow write permissions and ensure branch protection permits the bot's commit. The workflow will stop rather than discard history.
- **Pages deployment fails:** select GitHub Actions as the Pages source and check environment protection rules.
- **Location denied:** enable site location permission in browser/device settings, then tap Use my location again. Manual station selection always remains available.
- **Very distant station:** this app monitors Malaysian stations only. A distance warning appears above 100 km. Nearest does not guarantee representative conditions.
- **Blank chart:** at least two distinct timestamped readings within 24 hours are needed. It is normal immediately after first deployment.

## File guide

`index.html` layout; `style.css` responsive visual design; `app.mjs` interactions; `core.mjs` source adapter and calculations; `data/latest.json` snapshot plus collected history; `scripts/update-data.mjs` collector; `.github/workflows/update-and-deploy.yml` updates and deployment; `tests/core.test.mjs` data tests.

Official source: https://eqms.doe.gov.my/
GitHub Pages workflow reference: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
GitHub scheduled workflow reference: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule


## Updating your existing deployment to v1.1

Upload and replace the supplied application files **and** `.github/workflows/update-and-deploy.yml`. The workflow now copies the PWA icons, manifest, service worker and running-advice module. **Keep your repository's existing `data/latest.json`** when updating to preserve your collected history; do not overwrite it with the snapshot in this ZIP. Keep any existing custom-domain settings or CNAME file. Run the workflow after updating.

New files: `running.mjs`, `manifest.webmanifest`, `sw.js`, `icons/`, and `tests/running.test.mjs`.

### iPhone installation

Open your HTTPS site in Safari → Share → Add to Home Screen → enable Open as Web App if offered → Add. The opaque 180px Apple touch icon is supplied alongside 192px, 512px and maskable PWA icons. The installed app opens in standalone mode. If an old home-screen shortcut retains its icon, remove that shortcut and add the updated site again. Browser permission is still required for location; automatic detection cannot bypass it.

### Running popup

Shows on each fresh page opening, after the location attempt, and when returning after more than five minutes in the background. Reopen anytime using **Running outlook** beneath the current reading. Morning, afternoon, evening and night labels use Malaysia time; they do not predict future air quality. Dismiss using the close button, Back to dashboard, Escape, or outside the sheet. Reduced-motion preferences disable animations.

Advice is a conservative running interpretation of DOE outdoor-activity guidance. At IPU 0–50, outdoor running is generally suitable from an air-quality perspective; at 51–100 the app suggests comfortable effort; at 101–200 it suggests a cleaner indoor alternative; above 200 it advises avoiding outdoor running. Missing, stale, failed-fetch, unconfirmed-location or over-100km station readings receive no suitability recommendation. A manually chosen station can be used if location permission is declined. Personal conditions, weather, heat and route safety are not evaluated.

Source: https://www.doe.gov.my/wp-content/uploads/2021/10/General-Information-of-Air-Pollutant-Index.pdf (outdoor activity guidance, page 9). Running-specific wording and intensity choices are this app's conservative interpretation, not verbatim DOE recommendations.

### Offline and updates

The service worker caches the app shell only. Air-quality data is never cached by the service worker: an offline launch shows unavailable data instead of implying a fresh reading. If already open when the network fails, previously loaded values retain their timestamps and running advice is marked unverified. Shell updates are checked over the network; a future service worker version takes over after all older app windows are closed.

The mobile first screen prioritizes the current IPU card and location controls. Larger accessibility text, very short landscape windows and browser permission overlays can still require scrolling; the page never locks scrolling or clips the reading to force a fit.
