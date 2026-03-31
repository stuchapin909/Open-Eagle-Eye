# Norway Traffic Camera Research

## Summary

Norwegian traffic cameras (Statens vegvesen / Norwegian Public Roads Administration) are **not currently accessible** via a public API. The source is blocked pending reverse-engineering of the new frontend.

## Status: BLOCKED

## Investigation (2026-03-31)

### What was found

1. **Old API gone**: The legacy `webkamera.vegvesen.no` subdomain (used by open-source projects circa 2017) no longer resolves. The old URL pattern `http://webkamera.vegvesen.no/kamera?id={id}` is dead.

2. **New frontend**: The traffic site at `www.vegvesen.no/trafikk` is now a Next.js application. Camera data is loaded client-side via JavaScript. The camera layer is activated by the `ctv` query parameter: `/trafikk/hvaskjer?layers=ctv`

3. **No discoverable API endpoint**: Searched all 14 JS chunks loaded by the traffic map page for API URLs, fetch patterns, and camera-related strings. Found only:
   - App text API: `https://tekstapp.atlas.vegvesen.no/api/apptekst` (for UI translations)
   - Analytics: amplitude.com endpoints
   - No camera data endpoint found

4. **Known endpoints tested (all failed)**:
   - `https://www.vegvesen.no/ws/no/trafikkdata/kameraer` → 404
   - `https://api.vegvesen.no/kameraer` → no DNS
   - `https://webkamera.vegvesen.no/kamera?id=` → no DNS
   - `https://www.vegvesen.no/Traffikkdata/api/kameraer` → 404
   - `https://www.vegvesen.no/trafikkapi/api/v1/kameraer` → 404
   - `https://www.vegvesen.no/no/trafikkdata/datex2/kameraer` → 404
   - Next.js data route: `/trafikk/_next/data/{buildId}/hvaskjer.json` → returns 404 HTML page

### What might work

- **Browser-based scraping**: The Next.js app likely calls an internal API when rendering the map. Using a headless browser with network interception (e.g., Playwright/Puppeteer) to capture XHR/fetch requests while the map loads with the `ctv` layer would reveal the actual data endpoint.
- **Atlas internal APIs**: The site references `atlas.vegvesen.no` subdomains for auth and app text. The camera data API may be on an atlas subdomain that requires specific headers or referrer checking.
- **GitHub reference**: `orjanv/veikamera` repo shows the old URL pattern and camera IDs (2017 era). IDs in range 791209-1335902. These IDs may still work if the correct new domain/endpoint is found.

### Cameras committed

0 (blocked)

### Estimated camera count

Unknown. Norway likely has several hundred highway cameras. The old GitHub project had ~6 sample cameras from the Nordland area.
