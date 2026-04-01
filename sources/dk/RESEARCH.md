# Denmark (DK) Traffic Camera Research

**Date:** 2026-04-01
**Status:** BLOCKED — camera data accessible only via access-controlled Google Cloud Storage buckets and geo-restricted image proxy

## Summary

Danish traffic cameras are managed by Vejdirektoratet (Danish Road Directorate) and served through the Trafikkort application (trafikkort.vejdirektoratet.dk). While the application architecture was fully reverse-engineered, the actual camera data and images are behind access controls that prevent anonymous access from outside Denmark.

## Architecture Discovered

### Trafikkort Application
- **Frontend:** Angular SPA at `https://trafikkort.vejdirektoratet.dk`
- **API Base:** `https://trafikkort-prod.appspot.com/_ah/api` (Google Cloud Endpoints)
- **Vector Tiles:** `https://tiles.trafikinfo.net`
- **Data Tiles:** `https://storage.googleapis.com/trafikkort-data-tiles` (public, but no webcam data here)
- **GeoJSON Data:** `https://storage.googleapis.com/trafikkort-data/geojson/25832/` (access denied — 403)

### Camera Image URL Pattern
The Angular app's JavaScript reveals the webcam image source pattern:
- Production: `https://trafikkort-prod.appspot.com/rest/webcam/getimage/http%3A%2F%2Fwebcam.trafikken.dk%2Fwebcam%2F{id}`
- This is a proxy to `http://webcam.trafikken.dk/webcam/{id}`
- The proxy returns 404 when tested directly
- `webcam.trafikken.dk` returns 403 Forbidden from WSL (likely geo-restricted)

### Camera Data Source
- Webcam features (with `src` property containing image URLs) are loaded from GeoJSON files at `https://storage.googleapis.com/trafikkort-data/geojson/25832/{layer-name}.point.json`
- Access to this bucket is denied (403) for anonymous requests
- Layer names follow the pattern `{layer-name}.point.json`, `{layer-name}.line.json`, etc.

### Other Vejdirektoratet APIs
- **Drupal CMS API:** `https://api.vejdirektoratet.dk/api/` — standard Drupal JSON:API, no camera data
- **Vejdirektoratet main site:** `https://www.vejdirektoratet.dk` — returns 404 for traffic camera pages

## What Might Work

- **Browser-based scraping:** Using a headless browser with Danish VPN/proxy to load trafikkort.vejdirektoratet.dk, intercept the GeoJSON data requests, and extract webcam feature data including coordinates and image URLs
- **Google Cloud authenticated access:** The storage bucket may require specific Google Cloud credentials or OAuth tokens
- **Direct webcam.trafikken.dk access from Denmark:** The 403 might be geo-restriction that works from Danish IPs

## Sources Investigated

| Source | URL | Result |
|--------|-----|--------|
| Trafikkort SPA | trafikkort.vejdirektoratet.dk | JS-rendered, architecture reverse-engineered |
| Webcam proxy | trafikkort-prod.appspot.com/rest/webcam/getimage/ | 404 |
| Webcam source | webcam.trafikken.dk | 403 Forbidden (geo-restricted) |
| GeoJSON data | storage.googleapis.com/trafikkort-data/geojson/ | 403 Access Denied |
| Drupal API | api.vejdirektoratet.dk/api/ | No camera endpoints |
| Vejdirektoratet | vejdirektoratet.dk/trafikinformation/Trafikkameraer | 404 |

## Estimated Camera Count

Unknown. The trafikkort application displays webcams as a layer category, suggesting at least dozens of highway cameras across Denmark's motorway network.

## Cameras Committed

0 (blocked)
