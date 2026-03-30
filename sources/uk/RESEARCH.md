# TfL London (Transport for London JamCams)

## Summary

London traffic cameras served from public AWS S3 bucket. 424 curated cameras. No API key needed despite TfL having a developer portal — the S3 URLs are directly accessible.

---

## API Endpoint

- **Listing**: No single listing API. Cameras discovered via TfL Unified API grid sweep or from known ID lists.
- **Image**: `https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/{id}.jpg`

## How to Fetch

1. Discovery requires grid sweep: lat [51.28..51.68], lon [-0.52..0.33], radius 2000m
2. TfL API key registered at `api-portal.tfl.gov.uk` (for discovery only — images are public S3)
3. Image URLs follow a simple pattern with numeric IDs

## Image URL Pattern

`https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/{id}.jpg` — direct JPEG, public S3, no key needed

## Authentication

None for image access. TfL API key only needed for camera discovery queries.

## Coordinate Format

Coordinates from TfL API in standard lat/lng. No swap needed.

## ID Prefix Convention

`tfl-` (followed by camera ID)

**ID prefix collision warning**: `fl-` prefix can match inside `tfl-` when doing prefix searches. Always use `startswith("fl-") and not startswith("tfl-")` or check for `"Florida" in location`.

## City Extraction

All cameras are in Greater London. City = "London".

## Pagination

N/A — S3 direct access by ID.

## Special Headers

None required for S3 image URLs.

## Known Pitfalls

- **TfL API timeouts** — can occur from sandbox environments. Run discovery via terminal, not execute_code.
- **TfL placeholder detection** — some TfL cameras return a gray "Camera in use" placeholder screen instead of live footage. These are valid JPEGs but not real webcam content.
- **TfL API key** — registered at api-portal.tfl.gov.uk for discovery only; images themselves need no auth.

## Timezone

`Europe/London`
