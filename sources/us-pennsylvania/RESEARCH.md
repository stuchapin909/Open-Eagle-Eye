# Pennsylvania PennDOT (511PA)

## Summary

Pennsylvania highway cameras via the 511PA DataTables POST API. 1,445 cameras. Uses the standard US state 511 DataTables pattern. Zero offline rate in validation.

---

## API Endpoint

- **Listing**: `https://www.511pa.com/List/GetData/Cameras` (POST)
- **Image**: `https://www.511pa.com/map/Cctv/{id}` (GET, direct JPEG)

## How to Fetch

1. POST to `https://www.511pa.com/List/GetData/Cameras` with DataTables JSON body
2. Paginate with `start` offset (100 per page, ~15 pages)
3. Total: 1,445 cameras

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

`https://www.511pa.com/map/Cctv/{id}` — direct JPEG, 5-50KB

## Authentication

None required.

## Coordinate Format

**WKT format**: `POINT (lng lat)` in `latLng.geography.wellKnownText` field.

Parse with regex, swap to `{lat, lng}`.

## ID Prefix Convention

`pa-{roadway}-{direction}-{imgid}`

## City Extraction

Derived from camera metadata in the response.

## Pagination

100 per page. Paginate with `start` offset until `data[]` is empty.

## Special Headers

`Content-Type: application/json` for POST request.

## Known Pitfalls

- **Zero offline rate** — very well-maintained source, no placeholder filtering needed
- **Sources mixed**: PennDOT (1,279), RWIS weather (77), PTC Turnpike (89) — all use the same image pattern

## Timezone

`America/New_York`

## Country

`US`

## Category

`highway`
