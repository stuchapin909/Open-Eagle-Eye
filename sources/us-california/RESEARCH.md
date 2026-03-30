# Caltrans CWWP2 (California Department of Transportation)

## Summary

California highway cameras via the Caltrans CWWP2 (Connected Work Zone / Web Project 2) JSON API. 3,430 cameras across 12 districts. One of the largest single-state sources.

---

## API Endpoint

- **Listing**: `https://cwwp2.dot.ca.gov/data/{district}/cctv/cctvStatusD{nn}.json` (GET, per district)
  - Districts 1-12, so `cctvStatusD01.json` through `cctvStatusD12.json`

## How to Fetch

1. Fetch each district file: `https://cwwp2.dot.ca.gov/data/{district}/cctv/cctvStatusD{nn}.json`
2. Districts 01 through 12 (13 requests total)
3. Each file contains a JSON array of cameras with GPS coordinates and metadata
4. Combine all districts into a single camera list

## Image URL Pattern

`https://cwwp2.dot.ca.gov/...` — direct JPEG URLs provided in the API response

## Authentication

None required.

## Coordinate Format

All cameras have GPS coordinates from the API in standard lat/lng format. No swap needed.

## ID Prefix Convention

`ca-caltrans-` (followed by camera ID or slug)

## City Extraction

City names derived from camera metadata. Major cities by camera count:
- San Diego (158), Sacramento (86), Anaheim (85), Oakland (59), San Jose (53), Los Angeles (51), San Francisco (36)

## Pagination

No pagination per district — each district file returns all cameras for that district. Must fetch all 12 district files.

## Special Headers

Standard browser User-Agent. No special headers required.

## Known Pitfalls

- **Must fetch all 12 districts** — no single listing endpoint covers the whole state
- **3,430 cameras total** — one of the largest sources, may hit large file write limits (>2MB JSON). Write to `/tmp/` via Python then `cp` if needed.

## Timezone

`America/Los_Angeles`

## Category

`highway`
