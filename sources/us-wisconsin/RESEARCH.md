# Wisconsin WisDOT

## Summary

Wisconsin highway cameras via the 511wi.gov DataTables POST API. 482 cameras from API, 448 valid. Uses the standard US state 511 DataTables pattern.

---

## API Endpoint

- **Listing**: `https://511wi.gov/List/GetData/Cameras` (POST)
- **Image**: `https://511wi.gov/map/Cctv/{id}` (GET, direct PNG)

## How to Fetch

1. POST to `https://511wi.gov/List/GetData/Cameras` with DataTables JSON body
2. Paginate with `start` offset (100 per page, 5 pages)
3. Total: 482 cameras from API, 448 valid after filtering

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

`https://511wi.gov/map/Cctv/{id}` — direct PNG

Source: ATMS.

## Authentication

None required.

## Coordinate Format

**WKT format**: `POINT (lng lat)` in `latLng.geography.wellKnownText` field.

Parse with regex, swap to `{lat, lng}`.

## ID Prefix Convention

`wi-{id}`

## City Extraction

**No `city` field** — use `county` field as city fallback.

Top counties: Milwaukee (136), Dane (53), Waukesha (42), Brown (31).

## Pagination

100 per page. Paginate with `start` offset (5 pages).

## Special Headers

`Content-Type: application/json` for POST request.

## Known Pitfalls

- **Null coordinate pitfall** — 34 cameras return `POINT (0 0)` in WKT. These must be **excluded** from the registry since valid GPS is required. Check that lat != 0 and lng != 0 after parsing.
- **All images are PNG** — not JPEG. This is fine for the validator.
- **Covers major routes** — I-41, I-43, I-90, I-94, US-41, US-51, US-151, US-14, US-18, WIS-29

## Timezone

`America/Chicago`

## Country

`US`

## Category

`highway`
