# Colorado CDOT (CoTrip CARS Program)

## Summary

Colorado highway cameras via the CARS (Connected Vehicle / Roadway) Program API at CoTrip. 1,023 cameras, all active. Two camera types with different URL fields but same image pattern.

---

## API Endpoint

- **Listing**: `https://cotg.carsprogram.org/cameras_v1/api/cameras` (GET, returns JSON array)

## How to Fetch

1. GET `https://cotg.carsprogram.org/cameras_v1/api/cameras`
2. Returns JSON array with GPS coords and camera metadata
3. Single request returns all 1,023 cameras

## Image URL Pattern

`https://cocam.carsprogram.org/Snapshots/{CAM_ID}.flv.png` — serves `image/jpeg` despite the `.flv.png` extension

Two camera types in the API:
- **WMP** (810 cameras): use `views[0].videoPreviewUrl`
- **STILL_IMAGE** (218 cameras): use `views[0].url`
- Both resolve to the same pattern: `https://cocam.carsprogram.org/Snapshots/{CAM_ID}.flv.png`

## Authentication

None required.

## Coordinate Format

GPS coordinates provided directly in the API JSON. Standard lat/lng. No swap needed.

## ID Prefix Convention

`co-` (followed by camera ID or slug)

## City Extraction

City extracted from `location.cityReference` field. The field contains freeform text with patterns like:
- "in Denver" → Denver
- "near Eagle" → Eagle
- "X miles west of the Golden area" → Golden

**Use targeted regex** — require minimum 3-char city name length to avoid single-letter false matches. Print top N `cityReference` values first to understand the data distribution before bulk-processing.

## Pagination

None — single request returns all cameras.

## Special Headers

None required.

## Known Pitfalls

- **Misleading file extension** — images are served as `image/jpeg` despite `.flv.png` extension
- **WMP vs STILL_IMAGE types** — must check both `url` and `videoPreviewUrl` fields. Always check for both fields in the API response.
- **CARS Program API** — same API pattern (`{state}.carsprogram.org/cameras_v1/api/cameras`) was tested for other states but only works for Colorado
- **JSON control characters** — CoTrip API may return JSON with control characters (null bytes `\x00`, carriage returns `\r`). Fix: `raw.replace(b'\x00', b'').replace(b'\r', b'')` before parsing.
- **Earlier "CDOT dead end" was wrong** — the initial assessment tested the wrong endpoint. The CARS Program API works.

## Timezone

`America/Denver`

## Country

`US`

## Category

`highway`
