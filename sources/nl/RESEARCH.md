# Netherlands (NL) Traffic Camera API Research

## Executive Summary

The Netherlands has several public camera data sources, but **none provide direct JPEG/PNG images via simple HTTP GET**. The primary camera infrastructure (Rijkswaterstaat/NDW) uses HLS streaming or requires JavaScript rendering. The most promising API source is the RWS Verkeersinfo API, which provides camera metadata and streaming URLs.

---

## Source 1: RWS Verkeersinfo API (BEST CANDIDATE)

### Overview
Rijkswaterstaat's official traffic information website (rwsverkeersinfo.nl) has a React SPA frontend backed by a REST API. The API provides camera metadata with streaming URLs.

### API Discovery
- **Config URL**: `https://www.rwsverkeersinfo.nl/config.json`
  - Contains API base URL: `https://api.rwsverkeersinfo.nl`
- **Cameras Endpoint**: `https://api.rwsverkeersinfo.nl/api/cameras/`

### Authentication
- **None required** - publicly accessible REST API

### Camera List Endpoint
```
GET https://api.rwsverkeersinfo.nl/api/cameras/
```
Returns JSON array of camera objects.

### Response Schema
Each camera object contains:
```json
{
  "id": 4,
  "latitude": "52.185241",
  "longitude": "5.41449",
  "road": "A1",
  "near": "Amersfoort",
  "location_description": "Langs de A1, net ten westen van knooppunt Hoevelaken.",
  "description": "Bedienbare HD-camera langs de A1 bij Amersfoort...",
  "attribution": "<p>INMOVES</p>",
  "stream_url": "https://stream.inmoves.nl/62/embed",
  "static_url": "https://stream.inmoves.nl/62"
}
```

### Camera Count
- **26 cameras** currently listed (as of 2026-03-31)
- Covers major highways: A1, A2, A4, A6, A9, A10, A12, A13, A16, A20, A27

### Image URL Patterns
- **Stream URL**: `https://stream.inmoves.nl/{ID}/embed` (HLS stream in embedded player)
- **Static URL**: `https://stream.inmoves.nl/{ID}` (returns HTTP 401 image/png - requires session/cookies)
- **NOT direct JPEG/PNG** - These are HLS video streams via INMOVES platform
- The `static_url` endpoint returns 401 with content-type `image/png` (likely a placeholder or requires auth)

### Roads Covered
A1, A2, A4, A6, A9, A10, A12, A13, A16, A20, A27

### Full Camera IDs & Stream IDs
| API ID | Road | Location | INMOVES Stream ID |
|--------|------|----------|-------------------|
| 4 | A1 | Amersfoort | 62 |
| 13 | A1 | knooppunt Diemen | 185 |
| 5 | A2 | Vianen | 27 |
| 6 | A2 | Zaltbommel | 6 |
| 7 | A4 | Amsterdam-Sloten | 18 |
| 8 | A4 | knooppunt De Hoek | 19 |
| 10 | A4 | Leiden | 108 |
| 9 | A4 | Roelofarendsveen | 12 |
| 11 | A4 | Vlaardingen | 39 |
| 12 | A6 | Almere-Stad | 118 |
| 15 | A9 | Amstelveen | 34 |
| 14 | A9 | knooppunt Holendrecht | 36 |
| 16 | A9 | Rottepolderplein | 87 |
| 19 | A10 | Amstel | 5 |
| 17 | A10 | Coenplein Noord | 3 |
| 18 | A10 | knooppunt Westpoort | 41 |
| 20 | A10 | Watergraafsmeer | 61 |
| 23 | A12 | knooppunt Gouwe | 11 |
| 22 | A12 | knooppunt Lunetten | 107 |
| 21 | A12 | Oudenrijn | 46 |
| 24 | A13 | Delft | 40 |
| 25 | A16 | Van Brienenoordbrug | 45 |
| 27 | A16 | Dordrecht | 121 |
| 26 | A16 | Zwijndrecht | 13 |
| 28 | A20 | Knooppunt Kethelplein | 198 |
| 29 | A27 | Gorinchem | 15 |

### Notes
- These 26 cameras are INMOVES-operated "bedienbare HD-camera" (controllable HD cameras) on major highways
- They are a SUBSET of the hundreds of RWS traffic cameras - the full RWS camera network is NOT publicly accessible via direct image URLs
- The cameras require JavaScript/HLS for viewing (not suitable for direct JPEG fetch)

---

## Source 2: NDW Open Data Portal (National Data Warehouse for Traffic)

### Overview
NDW (Nationale Databank Wegverkeersgegevens) is the central Dutch traffic data aggregator, collecting data from RWS, provinces, and municipalities.

### Portal URL
- **Open Data Portal**: `https://opendata.ndw.nu/`
- **Documentation**: `https://docs.ndw.nu/`
- **Historical Data**: `https://dexter.ndw.nu/opendata/`

### Available Real-Time Data Files (NO direct camera images)
- `actueel_beeld.xml.gz` - Current traffic situation (DATEX II v3 XML) - incidents, roadworks, speed limits
- `trafficspeed.xml.gz` - Traffic speed measurements
- `traveltime.xml.gz` - Travel time data
- `DRIPS.xml.gz` - Dynamic Route Information Panel Signs (contains base64-encoded PNG sign images, NOT traffic camera images)
- `Matrixsignaalinformatie.xml.gz` - Matrix sign information (contains base64-encoded PNG sign images)
- `measurement.xml.gz` - Traffic flow/speed measurements
- `verkeersborden_actueel_beeld.csv.gz` - Traffic sign data
- `charging_point_locations.geojson.gz` - EV charging points

### Authentication
- **None required** - all files are publicly downloadable

### Camera Image Assessment
- **NO direct camera JPEG/PNG URLs** in any NDW dataset
- The DRIPS and Matrixsignaalinformatie files contain **sign display images** (base64-encoded PNGs of what's shown on electronic road signs), NOT camera snapshots
- NDW does NOT distribute traffic camera images

### Data Format
- DATEX II XML (versions 2.3 and 3.x)
- Updated every ~60 seconds
- Some datasets in CSV/GeoJSON format

---

## Source 3: KNMI Weather Cameras

### Overview
The Royal Netherlands Meteorological Institute (KNMI) has a webcam page.

### URLs
- **Webcam page**: `https://www.knmi.nl/webcam`
- **Sample image**: `https://cdn.knmi.nl/knmi/map/page/weer/actueel-weer/webcam/webcam.jpg`

### Authentication
- None required

### Assessment
- The KNMI webcam page shows a single webcam image
- Image URL pattern: `https://cdn.knmi.nl/knmi/map/page/weer/actueel-weer/webcam/webcam.jpg`
- Returns valid JPEG (200, ~185KB)
- Limited to a single weather station camera - not traffic-related
- **Not suitable for traffic camera registry**

---

## Source 4: Port of Rotterdam

### URL
- `https://www.portofrotterdam.com` (accessible)
- `https://api.portofrotterdam.com` (returns 403)

### Assessment
- No public camera API or direct image URLs found
- API endpoint requires authentication (403)
- Port cameras likely exist but are not publicly accessible

---

## Source 5: Amsterdam / Municipalities

### Amsterdam
- `https://data.amsterdam.nl` (accessible, Amsterdam open data portal)
- No traffic camera API found with direct image URLs

### General Municipal Note
- Dutch municipalities (Gemeenten) typically do NOT publish direct traffic camera image URLs
- Some cities have traffic management dashboards but these are usually JS-rendered

---

## Source 6: Schiphol Airport

### Assessment
- No public camera API found
- Airport cameras are security-sensitive and not publicly accessible

---

## Source 7: Provincial Road Authorities

### Assessment
- Dutch provinces (provincies) manage N-roads
- Provincial traffic data feeds into NDW
- No province-specific camera image APIs found

---

## Summary Table

| Source | API URL | Auth | Camera Count | Direct JPEG/PNG? | Notes |
|--------|---------|------|-------------|-------------------|-------|
| RWS Verkeersinfo | `https://api.rwsverkeersinfo.nl/api/cameras/` | None | 26 | ❌ (HLS streams) | INMOVES controllable HD cameras |
| NDW Open Data | `https://opendata.ndw.nu/` | None | 0 | ❌ | Traffic data only, no camera images |
| KNMI Webcam | `https://cdn.knmi.nl/knmi/map/page/weer/actueel-weer/webcam/webcam.jpg` | None | 1 | ✅ (single) | Weather camera, not traffic |
| Port of Rotterdam | `https://api.portofrotterdam.com` | Required | ? | ❌ | 403 Forbidden |
| Amsterdam Data | `https://data.amsterdam.nl` | None | 0 | ❌ | No camera API found |

---

## Key Findings

1. **No direct JPEG/PNG traffic camera API exists** for the Netherlands' main highway camera network. The RWS camera system (hundreds of cameras) does not expose direct image URLs publicly.

2. **RWS Verkeersinfo API** (`api.rwsverkeersinfo.nl/api/cameras/`) is the closest source - it provides 26 camera locations with metadata and streaming URLs, but images require HLS streaming (not HTTP GET for JPEG).

3. **NDW Open Data** provides extensive traffic data (speeds, incidents, travel times, sign displays) but explicitly does NOT include traffic camera images.

4. **KNMI** has a single weather webcam at a known JPEG URL - not traffic-related.

5. The Dutch approach to traffic cameras differs from countries like Australia or UK - rather than serving individual JPEG snapshots from each camera, the Netherlands uses centralized streaming platforms (INMOVES) for their controllable HD cameras.

---

## Recommendations for Open Eagle Eye

1. **RWS Verkeersinfo cameras**: Could be included with `stream_type: "hls"` and the INMOVES stream URLs, noting they are NOT direct JPEG. The API provides excellent metadata (coordinates, road names, descriptions).

2. **KNMI webcam**: Include as a weather camera (single location, direct JPEG).

3. **NDW DRIPS sign images**: Could potentially be extracted as a separate category (electronic road sign displays with base64 PNG images), but these are NOT traffic cameras.

4. **Do NOT include**: Port of Rotterdam (no access), Schiphol (no access), municipal cameras (no APIs found).

---

## Files Created
- `/root/projects/open-public-cam/sources/nl/RESEARCH.md` - This document
- `/root/projects/open-public-cam/sources/nl/rwsverkeersinfo-cameras-sample.json` - Sample API response with all 26 cameras
