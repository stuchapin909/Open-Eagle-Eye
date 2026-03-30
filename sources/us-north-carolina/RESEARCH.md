# North Carolina NCDOT

## Summary

North Carolina highway cameras via the NCDOT REST API. 779 cameras. Unlike most sources, requires individual detail calls per camera — the listing endpoint returns IDs only.

---

## API Endpoint

- **Listing (IDs only)**: `https://eapps.ncdot.gov/services/traffic-prod/v1/cameras/` (GET, returns list of IDs)
- **Camera detail**: `https://eapps.ncdot.gov/services/traffic-prod/v1/cameras/{id}` (GET, per camera)

## How to Fetch

1. GET `https://eapps.ncdot.gov/services/traffic-prod/v1/cameras/` — returns a list of camera IDs only (no image URLs)
2. **For each ID**, GET `https://eapps.ncdot.gov/services/traffic-prod/v1/cameras/{id}` — returns `imageURL` and `locationName`
3. **Fetch in parallel** — use 20 concurrent threads, ~30 seconds total for all 779 cameras
4. All cameras have GPS coords from the detail endpoint

## Image URL Patterns

Three patterns observed:
1. **Primary**: `https://eapps.ncdot.gov/services/traffic-prod/v1/cameras/images?filename=X.jpg`
2. **Secondary**: `https://cfss.services.ncdot.gov/snapshots/chan-X_h.jpg`
3. **Tertiary**: `https://cfms.services.ncdot.gov/snapshots/chan-X_h.jpg`

Use whichever `imageURL` the detail endpoint returns.

## Authentication

None required.

## Coordinate Format

GPS coordinates from the detail endpoint. Standard lat/lng. No swap needed.

## ID Prefix Convention

`nc-{id}-{slug}`

## City Extraction

**No city field available from the API.** Use county if possible, or fall back to "Unknown".

## Pagination

No pagination on the listing endpoint. Individual detail calls needed per camera (parallel fetch).

## Special Headers

Standard browser User-Agent. No special headers required.

## Known Pitfalls

- **Two-step fetch required** — listing returns IDs only, must call detail endpoint for each camera. This is unusual compared to other sources.
- **Must parallelize** — sequential fetch of 779 cameras would be very slow. Use 20 concurrent connections.
- **No city field** — locationName may contain county info but not always a city name.

## Timezone

`America/New_York`

## Country

`US`

## Category

`highway`
