# Utah UDOT

## Summary

Utah highway cameras via the UDOT DataTables POST API. 2,026 cameras covering the entire state. Uses the standard US state 511 DataTables pattern.

---

## API Endpoint

- **Listing**: `https://udottraffic.utah.gov/List/GetData/Cameras` (POST)
- **Image**: `https://udottraffic.utah.gov/map/Cctv/{id}` (GET, mostly PNG, some JPEG)

## How to Fetch

1. POST to `https://udottraffic.utah.gov/List/GetData/Cameras` with DataTables JSON body
2. Paginate with `start` offset (100 per page, 21 pages)
3. Total: 2,026 cameras

### Request Body

```json
{
  "draw": 1,
  "start": OFFSET,
  "length": 100,
  "columns": [{"data": "sortOrder", "name": "sortOrder"}]
}
```

## Image URL Pattern

`https://udottraffic.utah.gov/map/Cctv/{id}` — mostly PNG, some JPEG

## Authentication

None required. Source: ADX.

## Coordinate Format

**WKT format**: `POINT (lng lat)` in `latLng.geography.wellKnownText` field.

Parse with regex, swap to `{lat, lng}`.

## ID Prefix Convention

`ut-{id}`

## City Extraction

Most cameras lack a `city` field. The `location` string ends with a 3-4 letter UDOT area code.

**UDOT area code mapping** (examples):
- `, SLC` → Salt Lake City
- `, PVO` → Provo
- `, OGD` → Ogden
- `, LOG` → Logan

Map common codes to city names; fall back to "Utah" for unmapped codes. ~98% of cameras get a real city this way.

## Pagination

100 per page. Paginate with `start` offset until `data[]` is empty (21 pages for 2,026 cameras).

## Special Headers

`Content-Type: application/json` for POST request.

## Known Pitfalls

- **Offline placeholder** — UDOT serves a branded PNG ("This camera is offline") for dead cameras. The nightly validator catches these.
- **One camera returned GIF** — camera 118181 returned a GIF instead of PNG/JPEG. The validator only accepts JPEG/PNG, so this would be filtered.
- **City extraction requires code mapping** — no `city` field; must parse area codes from location string. Build a lookup table for common UDOT codes.
- **Covers entire state** — I-15, I-80, I-70, I-84, I-215, US-89, US-40, US-6, US-191, US-189, US-285 and many state routes plus city cameras.

## Timezone

`America/Denver` (Utah)

## Country

`US`

## Category

`highway` or `city`
