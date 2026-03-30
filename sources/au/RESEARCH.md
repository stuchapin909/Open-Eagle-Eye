# NSW Transport (Sydney, Australia)

## Summary

Sydney and regional NSW traffic cameras via the LiveTraffic data feed. 197 cameras total. GeoJSON format with coordinates. Images served via CloudFront CDN.

---

## API Endpoint

- **Listing**: `https://www.livetraffic.com/datajson/all-feeds-web.json` (GET, filter `eventType: "liveCams"`)
- **Image**: `https://webcams.transport.nsw.gov.au/livetraffic-webcams/cameras/{id}.jpeg`

## How to Fetch

1. GET `https://www.livetraffic.com/datajson/all-feeds-web.json`
2. Filter the JSON for entries where `eventCategory: "liveCams"` (or `eventType: "liveCams"`)
3. Each camera entry is GeoJSON with properties including camera ID, name, and coordinates

## Image URL Pattern

`https://webcams.transport.nsw.gov.au/livetraffic-webcams/cameras/{id}.jpeg` — direct JPEG

## Authentication

None required.

## Coordinate Format

**GeoJSON order `[lng, lat]` — must swap to `{lat, lng}`.** The API returns coordinates in standard GeoJSON order where the first element is longitude and the second is latitude.

## ID Prefix Convention

`nsw-` (followed by camera ID)

## City Extraction

- Each camera has location info in the feed
- Regional cameras (REG_NORTH, REG_SOUTH, REG_WEST) should get their suburb/town as city
- **Regional city consolidation**: towns with fewer than 3 cameras should be consolidated to "Regional NSW"

## Pagination

None — single request returns all cameras.

## Special Headers

**Sec-Fetch headers required** — the CloudFront CDN and S3 bucket reject requests without browser `Sec-Fetch-*` headers. Bare curl gets an HTML error page.

Required headers:
```
Sec-Fetch-Dest: image
Sec-Fetch-Site: cross-site
Sec-Fetch-Mode: no-cors
Referer: https://www.livetraffic.com/traffic-cameras
```

**CRITICAL**: The S3 bucket at `webcams.transport.nsw.gov.au` has hotlink protection that requires the `Referer` header specifically set to `https://www.livetraffic.com/traffic-cameras`. Even with correct Sec-Fetch headers, the Referer is still required. A Referer header alone is NOT sufficient — both Sec-Fetch headers AND Referer are needed.

Both `index.js` and `validate-registry.js` have a `DOMAIN_HEADERS` map + `getHeadersForUrl()` function to inject per-domain headers. Add this domain there.

## Known Pitfalls

- **S3 hotlink protection** — returns a 307-byte HTML error page ("camera image temporarily unavailable") without Referer header
- **Sec-Fetch CDN filtering** — without Sec-Fetch headers, returns HTML error page with `content-type: text/html` (~300 bytes)
- **Subagent header testing gap** — Sydney cameras were reported as "temporarily unavailable" because a subagent didn't send Sec-Fetch headers. Always verify critical findings yourself.
- **GeoJSON coordinate swap** — always swap `[lng, lat]` to `{lat, lng}`

## Timezone

`Australia/Sydney`
