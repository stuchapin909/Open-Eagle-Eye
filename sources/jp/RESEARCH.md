# NEXCO East Japan (Expressway Cameras)

## Summary

Japanese expressway traffic cameras served via the driveplaza/drivetraffic CDN. 98 verified cameras covering Hokkaido, Tohoku, Shinetsu, and Kanto expressways.

---

## API Endpoint

No listing API. Cameras discovered via the driveplaza website. Camera codes (URL IDs) are embedded in the website.

## How to Fetch

1. Camera codes must be scraped from the driveplaza website or discovered from known camera lists
2. No bulk listing API available — individual camera pages or maps must be parsed
3. 98 verified cameras covering Hokkaido, Tohoku, Shinetsu, Kanto expressways

## Image URL Pattern

`https://cdn-livecamera-pic.drivetraffic.jp/l/{CODE}.jpg` — direct JPEG, no auth, no redirect

## Authentication

None required.

## Coordinate Format

Coordinates must be obtained from the website or geocoded from camera location names. Not provided in a structured API.

## ID Prefix Convention

`jp-` (followed by camera code)

## City Extraction

Camera names are in Japanese (kanji). Must parse Japanese location names. Expressway names include region identifiers.

## Pagination

N/A — no listing API.

## Special Headers

None required.

## Known Pitfalls

- **Camera names in Japanese** — all metadata is in kanji. Need Japanese language handling.
- **NEXCO Central/West Japan** — session-restricted images, 404 on direct access. Only NEXCO East works.
- **No listing API** — must scrape individual camera pages

## Timezone

`Asia/Tokyo`

## Country

`JP`
