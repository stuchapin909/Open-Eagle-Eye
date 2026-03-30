# TII Ireland (Transport Infrastructure Ireland)

## Summary

Irish motorway cameras found via ArcGIS StoryMap. 53 cameras, mostly on the M50 Dublin ring road. Images served via CDN.

---

## API Endpoint

No structured listing API. Cameras discovered via ArcGIS StoryMap or TII website.

## How to Fetch

1. Camera IDs and metadata must be scraped from the TII website or ArcGIS StoryMap
2. No bulk JSON/XML listing available
3. 53 cameras, mostly concentrated on M50 Dublin ring road

## Image URL Pattern

`https://cdn.mtcc.ie/static/cctv/{id}.jpg` — direct JPEG via CDN

## Authentication

None required.

## Coordinate Format

Coordinates obtained from the StoryMap or website metadata. Standard lat/lng.

## ID Prefix Convention

`ie-tii-` (followed by camera ID)

## City Extraction

Most cameras are on the M50 Dublin ring road. City = "Dublin" for most. Some cameras on other motorways may reference other cities.

## Pagination

N/A — no listing API, ~53 cameras total.

## Special Headers

None required.

## Known Pitfalls

- **No listing API** — must manually discover camera IDs from the ArcGIS StoryMap
- **Small source** — only 53 cameras, but high quality coverage of Dublin's ring road

## Timezone

`Europe/Dublin`

## Country

`IE`
