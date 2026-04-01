# Alberta 511 Traffic Cameras

## Summary

Alberta 511 (511.alberta.ca) provides 369 traffic cameras via a DataTables server-side API. **337 cameras validated** (23 offline placeholders + 4 low-quality images excluded). All have GPS coordinates, direct JPEG URLs, no authentication required.

---

## API Endpoint

- **Camera listing**: `https://511.alberta.ca/List/GetData/Cameras` (POST, DataTables server-side)
- **Image**: `https://511.alberta.ca/map/Cctv/{id}` (GET, direct JPEG)

## How to Fetch

POST request with DataTables pagination parameters:

```bash
curl -s -X POST "https://511.alberta.ca/List/GetData/Cameras" \
  -H "Content-Type: application/json" \
  -d '{"draw":1,"start":0,"length":100,"columns":[{"data":"sortOrder","name":"sortOrder"}]}'
```

Response follows the standard DataTables pattern documented in `sources/datatables-pattern/RESEARCH.md`.

## Data Structure

Each camera has:
- `id`: numeric ID (unique, sequential 1-369)
- `location`: human-readable location string
- `roadway`: road name
- `direction`: camera direction
- `region`: Calgary, Edmonton, Banff, Ft McMurray / N Central Region, South Region, Peace Region, Central Region
- `latLng.geography.wellKnownText`: WKT `POINT (lng lat)` — swap to `{lat, lng}`
- `images[0].imageUrl`: `/map/Cctv/{id}`
- `images[0].disabled`: boolean (skip if true)
- `images[0].blocked`: boolean (skip if true)

## Image URL Pattern

`https://511.alberta.ca/map/Cctv/{id}` — direct JPEG on HTTP GET

## Authentication

None required.

## Offline Placeholder Detection

Offline cameras return a PNG image at exactly **15,136 bytes** containing a white background with "No live camera feed at this time" text and a warning icon. Filter by size: skip any response <= 15,136 bytes.

23 cameras (6.2%) were offline at time of validation (2026-04-01).

## Coordinate Notes

- EPSG:4326 (WGS84)
- WKT order: `POINT (lng lat)` — must swap to `{lat, lng}`
- All cameras had valid non-zero coordinates

## City Mapping

Region field mapped to cities:
| Region | City |
|--------|------|
| Calgary | Calgary |
| Edmonton | Edmonton |
| Banff | Banff |
| Ft McMurray / N Central Region | Fort McMurray |
| South Region | Lethbridge |
| Peace Region | Grande Prairie |
| Central Region | Red Deer |

## City Distribution (337 valid cameras)

| City | Count |
|------|-------|
| Calgary | 203 |
| Fort McMurray | 36 |
| Lethbridge | 30 |
| Grande Prairie | 21 |
| Banff | 20 |
| Red Deer | 19 |
| Edmonton | 10 |

## ID Scheme

`ab-{api_id}-{slugified_location}` — no collisions with existing registry

## Integration Date

April 1, 2026 — 337 cameras added to registry
