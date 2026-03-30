# Singapore LTA (Land Transport Authority)

## Summary

Singapore traffic cameras via the Data.gov.sg open data API. 90 cameras with rich metadata. Images served via CloudFront CDN.

---

## API Endpoint

- **Listing + Image metadata**: `https://api.data.gov.sg/v1/transport/traffic-images` (GET)

## How to Fetch

1. GET `https://api.data.gov.sg/v1/transport/traffic-images`
2. Returns JSON with camera array including: camera ID, lat/lng, timestamps, MD5, image URL
3. All data in a single response — no separate listing endpoint needed

## Image URL Pattern

Image URLs are provided directly in the API response. They are CloudFront CDN URLs serving JPEG.

## Authentication

None required. No API key needed for this endpoint.

## Coordinate Format

Standard lat/lng provided directly in the API response. No swap needed.

## ID Prefix Convention

`sg-` (followed by camera ID)

## City Extraction

All cameras are in Singapore. City = "Singapore".

## Pagination

None — single request returns all 90 cameras.

## Special Headers

None required.

## Known Pitfalls

- **Wrong content-type** — Singapore LTA images return `application/octet-stream` instead of `image/jpeg`. The actual bytes are valid JPEG. This is handled by magic byte detection in the validator/snapshot (checks first 4 bytes for JPEG `FF D8 FF` or PNG `89 50 4E 47` signatures). When testing manually, don't rely on content-type header alone.

## Timezone

`Asia/Singapore`
