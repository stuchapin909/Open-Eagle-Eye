# Wales (GB) Traffic Camera Research

**Date:** 2026-04-01
**Status:** SUCCESS — 134 cameras committed

## Summary

Traffic Wales (Welsh Government) operates a network of 134 CCTV cameras on Welsh motorways and trunk roads. Camera images are served as direct JPEG files from `https://members.traffic.wales/cctvimages/camera{ID}.jpg` with no authentication required.

## Source Details

### Traffic Wales CCTV

- **Website:** https://traffic.wales/road-cameras
- **Image URL pattern:** `https://members.traffic.wales/cctvimages/camera{ID}.jpg`
- **Method:** HTTP GET, no auth required
- **Content-Type:** image/jpeg
- **Image sizes:** 30-55 KB per snapshot
- **Server:** Microsoft-IIS/10.0
- **Update frequency:** Images appear to update every 5 minutes (Last-Modified headers observed)

### Roads Covered

| Road | Cameras | Description |
|------|---------|-------------|
| M4 | 87 | Main Welsh motorway (Newport-Swansea corridor) |
| A470 | 24 | North-South trunk road (Cardiff-Heads of the Valleys) |
| A449 | 5 | Newport-Abergavenny corridor |
| A4232 | 4 | Cardiff peripheral distributor road |
| A48M | 3 | Cardiff motorway spur |
| M48 | 3 | Severn Bridge approach |
| A4042 | 3 | Cwmbran corridor |
| A48 | 2 | South Wales coast road |
| A477 | 2 | Carmarthen-Pembroke Dock |
| A468 | 1 | Newport-Caerphilly link |

### Data Collection Method

1. Scraped road listing page at https://traffic.wales/road-cameras to get 17 road links
2. Scraped each road page (e.g., https://traffic.wales/cctv-cameras/m4) to extract `<img>` tags
3. Extracted camera ID, image URL, and name from `alt` text attributes
4. Geocoded camera locations using Nominatim API (87/134 direct match, 35/134 via junction-based queries, 12/134 manual approximation)

### Validation

- All 134 URLs validated with HTTP GET: return 200 with `image/jpeg` content-type
- 20 random samples checked for valid JPEG magic bytes (FF D8 FF) — all passed
- Image sizes range 30-55 KB, consistent with live camera snapshots

### Coordinates

- 87 cameras geocoded directly via Nominatim from place names
- 35 cameras geocoded via junction-based queries (e.g., "M4 junction 32, Wales")
- 12 cameras given approximate coordinates based on known road routing (M4 J29-J33 Cardiff area)

### City Distribution

| City | Count |
|------|-------|
| Newport | 79 |
| Cardiff | 41 |
| Pontypridd | 6 |
| Cwmbran | 3 |
| Chepstow | 3 |
| Carmarthen | 2 |

### Roads Investigated But Empty

The following roads had listing pages but no camera images:
- A40, A44, A465, A468, A477, A494, A55, A550 (listing pages returned no `<img>` tags for camera images)

## Recommendations

1. The camera listing pages are server-rendered HTML (Drupal CMS), not API-driven — may need re-scraping if the page structure changes
2. Camera IDs are not sequential (range from single digits to 8000+) — likely legacy from different installation phases
3. Some cameras may be seasonal or temporarily offline
4. No API endpoint discovered — scraping HTML is the only data collection method
