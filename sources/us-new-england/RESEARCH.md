# New England 511

## Summary

Multi-state 511 system covering New Hampshire, Maine, and Vermont. 408 cameras total via DataTables POST API. Uses the standard US state 511 DataTables pattern.

---

## API Endpoint

- **Listing**: `https://newengland511.org/List/GetData/Cameras` (POST)
- **Image**: `https://newengland511.org/map/Cctv/{id}` (GET, direct JPEG)

## How to Fetch

1. POST to `https://newengland511.org/List/GetData/Cameras` with DataTables JSON body
2. Paginate with `start` offset (100 per page, 5 pages)
3. Total: 408 cameras

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

`https://newengland511.org/map/Cctv/{id}` — direct JPEG

## Authentication

None required.

## Coordinate Format

**WKT format**: `POINT (lng lat)` in `latLng.geography.wellKnownText` field.

Parse with regex, swap to `{lat, lng}`.

## ID Prefix Convention

`ne-{state}-{roadway}-{direction}-{imgid}`

## City Extraction

City extraction varies by state:

- **Vermont**: city is the first word of location (e.g., "WATERBURY I-89 North" → Waterbury)
- **Maine**: city is in parentheses (e.g., "I-95 Mile 161 SB (Plymouth)" → Plymouth)
- **New Hampshire**: no city names in location — fall back to "New Hampshire"

### Coverage by state
- New Hampshire: 185 cameras
- Maine: 134 cameras
- Vermont: 89 cameras

### Major highways
I-89, I-91, I-93, I-95, I-295, I-395, I-293, US-2, US-3, US-4, US-5, US-7, US-302, NH-101, NH-16, VT-9, VT-100, F.E. Everett Turnpike, Spaulding Turnpike

## Pagination

100 per page. Paginate with `start` offset (5 pages).

## Special Headers

`Content-Type: application/json` for POST request.

## Known Pitfalls

- **Control characters in JSON response** — this API returns null bytes (`\x00`) and carriage returns (`\r`) in the JSON. Standard `json.loads(text, strict=False)` does NOT catch null bytes.
  - **Fix**: `curl -o file.json` then read as bytes and strip: `raw.replace(b'\x00', b'').replace(b'\r', b'')` before `json.loads()`
  - Always save to file first, then read and clean — don't try to parse directly from terminal output.
- **Different city extraction per state** — must apply different parsing logic for VT, ME, and NH cameras.
- **Three states in one API** — cameras span three states. Ensure correct state assignment in the country/region fields.

## Timezone

`America/New_York` (all three states)

## Country

`US`

## Category

`highway`
