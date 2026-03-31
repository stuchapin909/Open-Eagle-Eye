# Louisiana LADOTD (511 Louisiana)

## Summary

Louisiana highway cameras via the 511 Louisiana DataTables POST API. 336 cameras from the API. 214 matched existing registry entries (format migrated to flat lat/lng), 122 new cameras added. 82 stale entries from prior runs retained (API no longer returns them). Total LA cameras in registry: 418.

Uses the standard US state 511 DataTables pattern.

---

## API Endpoint

- **Listing**: `https://511la.org/List/GetData/Cameras` (POST)

## How to Fetch

1. POST to `https://511la.org/List/GetData/Cameras` with DataTables JSON body
2. Paginate with `start` offset (100 per page, 4 pages)
3. **Stop condition**: `start >= recordsTotal` (336). The API wraps around if you paginate past the total.
4. Total: 336 cameras

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

`https://511la.org/map/Cctv/{id}` — direct JPEG

The `id` comes from `data[].images[0].id`.

## Authentication

None required. Source: LADOTD.

## Coordinate Format

**WKT format**: `POINT (lng lat)` in `latLng.geography.wellKnownText` field.

Parse with regex, swap to `{lat, lng}`.

## ID Prefix Convention

`la-{imgid}-{slug}`

## City Extraction

No city field in the API. Haversine distance to known Louisiana city centers (30+ cities mapped).

Major cities: Baton Rouge (32), Lake Charles (18), Destrehan (11), New Orleans (7), Crowley (7), Metairie (6), Prairieville (6), Shreveport (5), Houma (4).

## Pagination

100 per page. **Must stop at `start >= recordsTotal`** — the API wraps around and returns data from the beginning if you paginate past 336.

## Special Headers

`Content-Type: application/json` for POST request.

## Known Pitfalls

- **API wraps around** — does not return empty `data[]` past the total. Must check `start >= recordsTotal` to stop.
- **No city field** — must use haversine distance to city centers.
- **82 stale entries** — 82 cameras from a prior integration run are in the registry but no longer returned by the API. Left in place; the nightly validator will catch any that go offline.
- **Source system**: SKYLINE (Iteris Navigator platform)

## Validation Results

- **HTTP + magic bytes**: 50/50 passed (all JPEG, 6.5KB-45KB)
- **Vision analysis**: 10/10 confirmed real traffic webcam feeds
- **Zero offline rate** in sample

## Timezone

`America/Chicago`

## Country

`US`

## Category

`highway`

## Validation Date

2026-03-31
