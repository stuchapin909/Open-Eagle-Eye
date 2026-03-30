# Hong Kong Transport Department

## Summary

Hong Kong traffic cameras via the Hong Kong open data portal CSV listing. 995 cameras covering all 18 districts. Direct JPEG images, updates every 2 minutes.

---

## API Endpoint

- **Listing**: `https://static.data.gov.hk/td/traffic-snapshot-images/code/Traffic_Camera_Locations_En.csv` (GET, CSV)
- **Image**: `https://tdcctv.data.one.gov.hk/{KEY}.JPG` (GET, direct JPEG)

## How to Fetch

1. GET `https://static.data.gov.hk/td/traffic-snapshot-images/code/Traffic_Camera_Locations_En.csv`
2. **CSV encoding**: UTF-16LE with BOM — needs `iconv` conversion before parsing
3. CSV columns include: camera key, district, road name, `latitude`, `longitude`
4. Single request returns all 995 cameras

### CSV Conversion

```bash
iconv -f UTF-16LE -t UTF-8 Traffic_Camera_Locations_En.csv > cameras_utf8.csv
```

## Image URL Pattern

`https://tdcctv.data.one.gov.hk/{KEY}.JPG` — direct JPEG

May 301/302 redirect, follow it.

## Authentication

None required.

## Coordinate Format

GPS coordinates in CSV columns `latitude` and `longitude`. Standard lat/lng. No swap needed.

## ID Prefix Convention

`td-{KEY}` (KEY is the camera identifier from the CSV)

## City Extraction

All cameras are in Hong Kong. District information is in the CSV. City = "Hong Kong" (or use district names if desired). Covers all 18 districts.

## Pagination

None — single CSV file.

## Special Headers

None required.

## Known Pitfalls

- **UTF-16LE encoding** — the CSV has BOM and is UTF-16LE encoded. Must convert with `iconv` before parsing. Standard CSV parsers will fail without conversion.
- **Old endpoint returns 503** — `resource.data.one.gov.hk/td/` is dead. Use `tdcctv.data.one.gov.hk` instead.
- **301/302 redirect on images** — image URLs may redirect, follow them.
- **Updates every 2 minutes** — very frequent updates.

## Timezone

`Asia/Hong_Kong`

## Country

`HK`

## Category

`city`
