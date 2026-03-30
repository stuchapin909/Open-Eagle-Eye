# NZTA (New Zealand Transport Agency / Traffic NZ)

## Summary

New Zealand traffic cameras via the NZTA journeys open data portal. 251 online cameras with full coordinates and descriptions.

---

## API Endpoint

- **Listing**: `https://journeys.nzta.govt.nz/assets/map-data-cache/cameras.json` (GET, returns JSON)
- **Image**: `https://www.trafficnz.info/camera/thumb/{id}.jpg`

## How to Fetch

1. GET `https://journeys.nzta.govt.nz/assets/map-data-cache/cameras.json`
2. Returns JSON with camera objects including: ID, description, GPS coordinates
3. Single request returns all cameras

## Image URL Pattern

`https://www.trafficnz.info/camera/thumb/{id}.jpg` — direct JPEG, no redirect

## Authentication

None required.

## Coordinate Format

Standard lat/lng from the API. No swap needed.

## ID Prefix Convention

`nz-nzta-` (followed by camera ID)

## City Extraction

Derived from camera descriptions in the API. All cameras are in New Zealand — extract town/city from description text.

## Pagination

None — single request returns all cameras.

## Special Headers

Standard browser User-Agent. No special headers required.

## Known Pitfalls

- **251 of 320 online** — some cameras in the dataset may be offline. Validate image URLs before adding.

## Timezone

`Pacific/Auckland`

## Country

`NZ`
