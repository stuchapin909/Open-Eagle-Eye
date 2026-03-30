# WSDOT (Washington State Department of Transportation)

## Summary

Washington State highway cameras via public KML feed. 1,654 cameras. The REST/JSON API requires an access code, but the KML feed is public with no auth needed.

---

## API Endpoint

- **Listing + Image URLs**: `https://www.wsdot.wa.gov/traffic/api/HighwayCameras/kml.aspx` (GET, returns KML XML)

## How to Fetch

1. GET `https://www.wsdot.wa.gov/traffic/api/HighwayCameras/kml.aspx`
2. Parse KML `<Placemark>` elements
3. Each Placemark contains: `<name>`, `<description>`, `<Point><coordinates>` (for GPS), and an image URL in the description or extended data
4. No pagination needed — single KML file

## Image URL Pattern

`https://images.wsdot.wa.gov/{region}/{filename}.jpg` — direct JPEG, no redirect needed

## Authentication

None required for the KML feed. (Note: the REST/JSON API at the same domain requires an access code — ignore it, use the KML feed instead.)

## Coordinate Format

KML coordinates are in `lng,lat,altitude` order — must swap to `{lat, lng}`.

## ID Prefix Convention

`wa-` (followed by slug)

## City Extraction

Most cameras reference highway mileposts rather than city names. City detection is hard.

**Consolidation strategy**: Most cameras get city = "Washington".

Major cities with enough cameras: Spokane (82), Woodland (15), Moses Lake (9).

## Pagination

None — single KML file returns all cameras.

## Special Headers

Standard browser User-Agent. No Sec-Fetch or Referer required.

## Known Pitfalls

- **REST API requires access code** — don't waste time on the JSON/REST API. Use the KML feed which is public.
- **Seattle DOT cameras** — found via WSDOT KML at `https://www.seattle.gov/trafficcams/images/{name}.jpg` (direct JPEG, no auth, no listing API — would need to be scraped from WSDOT KML references)
- **Categories**: highway (1,520), airport (114), ferry (20) — derive from camera name/description

## Timezone

`America/Los_Angeles`
