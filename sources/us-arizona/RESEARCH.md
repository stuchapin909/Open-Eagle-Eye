# Arizona ADOT (az511)

## Summary

Arizona highway cameras via the az511 DataTables POST API. 604 cameras covering major interstate and state highways. Uses the standard US state 511 DataTables pattern.

---

## API Endpoint

- **Listing**: `https://www.az511.com/List/GetData/Cameras` (POST)
- **Image**: `https://www.az511.com/map/Cctv/{id}` (GET, direct JPEG or PNG)

## How to Fetch

1. POST to `https://www.az511.com/List/GetData/Cameras` with DataTables JSON body
2. Paginate with `start` offset (100 per page, ~7 pages)
3. Total: 604 cameras

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

`https://www.az511.com/map/Cctv/{id}` — mix of JPEG (27-545KB) and PNG (15KB)

## Authentication

None required.

## Coordinate Format

**WKT format**: `POINT (lng lat)` in `latLng.geography.wellKnownText` field.

Parse with regex, swap to `{lat, lng}`.

## ID Prefix Convention

`az-{imgid}`

## City Extraction

Major cities: Phoenix (395), Tucson (53), Flagstaff (17), Nogales (16), Prescott (14). Derived from camera metadata.

## Pagination

100 per page. Paginate with `start` offset.

## Special Headers

`Content-Type: application/json` for POST request.

## Known Pitfalls

- **Mixed image formats** — some cameras return JPEG, others return PNG (15KB). The 15KB PNG may be an offline placeholder.
- **Covers wide geographic area** — I-10, I-17, I-40, I-8, Loop 101/202/303, SR-51

## Timezone

`America/Phoenix` (Arizona does not observe DST)

## Country

`US`

## Category

`highway`
