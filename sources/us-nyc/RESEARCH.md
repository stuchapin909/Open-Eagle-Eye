# NYC TMC (New York City Traffic Management Center)

## Summary

NYC traffic cameras via the nyctmc.org API. 953 total online cameras, 100 curated in registry.

---

## API Endpoint

- **Listing**: `https://nyctmc.org/api/cameras` (GET, returns JSON)
- **Image**: `https://nyctmc.org/api/cameras/{uuid}/image`

## How to Fetch

1. GET `https://nyctmc.org/api/cameras` — returns JSON array of camera objects
2. Each camera has a UUID field
3. Image for each camera at `/api/cameras/{uuid}/image`

## Image URL Pattern

`https://nyctmc.org/api/cameras/{uuid}/image` — direct JPEG

## Authentication

None required.

## Coordinate Format

Coordinates come from the API as lat/lng. No swap needed.

## ID Prefix Convention

`nyc-` (followed by UUID or slug)

## City Extraction

All cameras are within NYC. City = "New York".

## Pagination

None — single request returns all cameras.

## Special Headers

Standard browser User-Agent. No Sec-Fetch or Referer required.

## Known Pitfalls

- None specific to NYC TMC documented.

## Timezone

`America/New_York`
