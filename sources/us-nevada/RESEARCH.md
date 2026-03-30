# Nevada NDOT (nvroads)

## Summary

Nevada highway cameras via the nvroads DataTables POST API. 643 cameras covering Las Vegas metro, Reno-Sparks, and Elko regions. Uses the standard US state 511 DataTables pattern.

---

## API Endpoint

- **Listing**: `https://www.nvroads.com/List/GetData/Cameras` (POST)
- **Image**: `https://www.nvroads.com/map/Cctv/{id}` (GET, direct JPEG or PNG)

## How to Fetch

1. POST to `https://www.nvroads.com/List/GetData/Cameras` with DataTables JSON body
2. Paginate with `start` offset (100 per page, 7 pages)
3. Total: 643 cameras

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

`https://www.nvroads.com/map/Cctv/{id}` — mix of JPEG (4-33KB) and PNG (27KB)

## Authentication

None required.

## Coordinate Format

**WKT format**: `POINT (lng lat)` in `latLng.geography.wellKnownText` field.

Parse with regex, swap to `{lat, lng}`.

## ID Prefix Convention

`nv-{slug}`

## City Extraction

Regions: Las Vegas metro (367), Reno-Sparks (184), Elko (90). Derived from camera metadata.

Covers: I-15, I-80, I-580, I-11, I-215, I-515, US-395, US-50, US-95, US-6.

## Pagination

100 per page. Paginate with `start` offset.

## Special Headers

`Content-Type: application/json` for POST request.

## Known Pitfalls

- **Mixed image formats** — JPEG (4-33KB) and PNG (27KB) served from same endpoint

## Timezone

`America/Los_Angeles` (Nevada, except some border areas near Utah)

## Country

`US`

## Category

`highway`
