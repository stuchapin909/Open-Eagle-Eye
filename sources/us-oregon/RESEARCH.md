# Oregon DOT TripCheck

## Summary

Oregon highway and city cameras via the TripCheck camera inventory JSON. 1,120 cameras (765 highway + 355 city). ESRI JSON format.

---

## API Endpoint

- **Listing**: `https://www.tripcheck.com/Scripts/map/data/cctvinventory.js` (GET, ESRI JSON)

## How to Fetch

1. GET `https://www.tripcheck.com/Scripts/map/data/cctvinventory.js`
2. Returns ESRI JSON with a `features[]` array
3. Each feature has:
   - `attributes` with `PID`, `RDNAME`, `TITLE`, `URL` fields
   - `geometry` with GPS coordinates
4. Single request returns all cameras

## Image URL Pattern

`https://www.tripcheck.com/Roadcams/cams/{filename}` — direct JPEG

The `filename` comes from `attributes.URL` field.

**URL encoding**: filenames from the API may contain spaces — must URL-encode them.

## Authentication

None required.

## Coordinate Format

**ESRI JSON `[lng, lat]` order in `geometry`** — must swap to `{lat, lng}`.

## ID Prefix Convention

`or-{slug}-pid{id}` (PID from `attributes.PID`)

## City Extraction

Major cities: Portland (259), Vancouver WA (137), Oregon City (78), Eugene (53), Salem (33), Bend (31), Medford (22). Derived from `attributes.TITLE` or `attributes.RDNAME`.

## Pagination

None — single request returns all cameras.

## Special Headers

None required.

## Known Pitfalls

- **URL spaces** — image filenames from the API may contain spaces. Must URL-encode them before making requests.
- **Mixed categories** — 765 highway + 355 city cameras. Check `attributes.RDNAME` to determine category.
- **ESRI JSON coordinate order** — `[lng, lat]`, must swap to `{lat, lng}`

## Timezone

`America/Los_Angeles`

## Country

`US`

## Category

`highway` or `city` (check `attributes.RDNAME`)
