# Virginia VDOT (511 Virginia)

## Summary

Virginia highway cameras via the 511 Virginia GeoJSON API. 1,695 cameras, all active. GeoJSON FeatureCollection format.

---

## API Endpoint

- **Listing**: `https://511.vdot.virginia.gov/services/map/layers/map/cams` (GET, returns GeoJSON)

## How to Fetch

1. GET `https://511.vdot.virginia.gov/services/map/layers/map/cams`
2. Returns a GeoJSON FeatureCollection
3. Each feature has `properties` with camera metadata and `geometry` with coordinates

## Image URL Pattern

`https://snapshot.vdotcameras.com/thumbs/{NAME}.flv.png` — redirects to `.png`, serves `image/png`

The `NAME` comes from `properties.name` (device ID like "NROCCTVI66E00501").

## Authentication

None required.

## Coordinate Format

**GeoJSON `[lng, lat]` order — must swap to `{lat, lng}`.**

## ID Prefix Convention

`va-` (followed by camera slug)

## City Extraction

Map from `properties.jurisdiction` field (VDOT district). Examples:
- "Arlington County" → Arlington
- "City of Hampton" → Hampton
- Strip "County" / "City of" prefixes

## Pagination

None — single request returns all cameras.

## Special Headers

None required.

## Known Pitfalls

- **GeoJSON coordinate swap** — `[lng, lat]` in the geometry, must swap to `{lat, lng}`
- **Image redirect** — URLs redirect from `.flv.png` to `.png`. The validator's `maxRedirects: 1` handles this.
- **Serves PNG, not JPEG** — content-type is `image/png`. This is valid.
- **Earlier "VDOT confirmed dead end" was wrong** — the initial assessment tested the wrong approach. The 511 GeoJSON endpoint works.
- **WKT coordinate format** — coordinates stored as GeoJSON, not WKT, but same swap logic applies

## Timezone

`America/New_York`

## Country

`US`

## Category

`highway`
