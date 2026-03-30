# Florida FDOT (FL511)

## Summary

Florida highway cameras via the FL511 DataTables POST API. 4,700 cameras total. Uses the standard US state 511 DataTables pattern. Requires pagination and has significant offline rate.

---

## API Endpoint

- **Listing**: `https://www.fl511.com/List/GetData/Cameras` (POST)
- **Image**: `https://www.fl511.com/map/Cctv/{id}` (GET, direct JPEG)

## How to Fetch

1. POST to `https://www.fl511.com/List/GetData/Cameras` with DataTables JSON body
2. **Caps at 100 per request** — must paginate with `start` offset
3. Total: 4,700 cameras (47 pages)

### Request Body

```json
{
  "draw": 1,
  "start": OFFSET,
  "length": 100,
  "columns": [{"data": "sortOrder", "name": "sortOrder"}]
}
```

Response includes `recordsTotal` and `data[]` array.

## Image URL Pattern

`https://www.fl511.com/map/Cctv/{id}` — direct JPEG

## Authentication

None required.

## Coordinate Format

**WKT format**: `POINT (lng lat)` in `latLng.geography.wellKnownText` field.

Parse with regex: extract the numbers from `POINT (lng lat)` and construct `{lat, lng}` — note the order is longitude first, latitude second in WKT.

## ID Prefix Convention

`fl-{id}-{slug}`

**ID prefix collision warning**: `fl-` prefix can match inside `tfl-` (Transport for London) when doing prefix searches. Always use `startswith("fl-") and not startswith("tfl-")` or check for `"Florida" in location`.

## City Extraction

Derived from camera metadata fields in the response.

## Pagination

**Mandatory** — caps at 100 per request even if you send `length: 500`. Paginate with `start` offset:
- Page 0: `start: 0, length: 100`
- Page 1: `start: 100, length: 100`
- ...continue until `data[]` is empty or `start >= recordsTotal`

## Special Headers

Standard browser headers including:
- `Content-Type: application/json` (for the POST request)

## Known Pitfalls

- **~12% offline rate** — offline cameras return a 15,136 byte placeholder PNG. The nightly validator catches these.
- **Offline placeholder detection** — detect by: (PNG when expecting JPEG) OR (size matches 15,136 bytes exactly).
- **Pagination cap** — sending `length: 500` still returns only 100. Always paginate.
- **Timezone split within state** — Florida panhandle counties (Bay, Calhoun, Dixie, Franklin, Gadsden, Gulf, Holmes, Jackson, Jefferson, Lafayette, Leon, Liberty, Madison, Okaloosa, Santa Rosa, Taylor, Wakulla, Walton, Washington) use `America/Chicago`; the rest use `America/New_York`. Match by county, not latitude.
- **POST not GET** — don't assume all listing APIs are GET. Check for XHR network requests.

## Timezone

Split by county:
- Panhandle counties: `America/Chicago`
- Rest of Florida: `America/New_York`

## Country

`US`

## Category

`highway`
