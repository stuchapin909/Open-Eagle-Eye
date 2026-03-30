# Finland Digitraffic (Fintraffic)

## Summary

Finnish highway weather cameras via the Digitraffic open data API. 804 camera stations with 2,223 active presets (camera angles). Each station can have multiple camera presets.

---

## API Endpoint

- **Listing**: `https://tie.digitraffic.fi/api/weathercam/v1/stations` (GET, GeoJSON)

## How to Fetch

1. GET `https://tie.digitraffic.fi/api/weathercam/v1/stations` with `Accept-Encoding: gzip` header
2. Returns GeoJSON FeatureCollection with camera stations
3. Each feature has:
   - `id`: station ID
   - `name`: road code + location (e.g., "kt51_Inkoo")
   - `geometry.coordinates`: GeoJSON `[lng, lat, 0]`
   - `presets[]`: array of camera angle presets, each with `presetId` and `inCollection` boolean
4. **Only add presets where `inCollection: true`** — 12 presets are inactive
5. Total: 804 stations, 2,223 active presets

### CRITICAL: Gzip Header Required

The API **returns 406 without `Accept-Encoding: gzip`**. Always include:

```bash
curl -H "Accept-Encoding: gzip" --compressed "https://tie.digitraffic.fi/api/weathercam/v1/stations"
```

## Image URL Pattern

`https://weathercam.digitraffic.fi/{presetId}.jpg` — direct JPEG

Mix of 1280x720 and 720x576 resolutions.

## Authentication

None required.

## Coordinate Format

**GeoJSON `[lng, lat, 0]` order** — must swap to `{lat, lng}`. Note the third element (elevation/altitude) should be ignored.

## ID Prefix Convention

`fi-{presetId}` (use preset ID, not station ID — each preset is a separate camera entry)

## City Extraction

From station `name` field. Format: `{road_code}_{location}` (e.g., "kt51_Inkoo").

**Road code mapping**:
- `vt` = valtatie (highway)
- `kt` = kantatie (regional road)
- `st` = seututie (main road)

Name format: "{road} {location} - Camera {NN}"

## Pagination

None — single request returns all stations and their presets.

## Special Headers

**`Accept-Encoding: gzip`** — required. Returns 406 "Use of gzip compression is required with Accept-Encoding: gzip header" without it. Always use `--compressed` flag with curl.

## Known Pitfalls

- **Gzip required** — bare curl returns 406. Always add `Accept-Encoding: gzip` and `--compressed` flag.
- **Stations vs Presets** — each station has multiple camera angles (presets). Use presets as individual cameras, not stations. 804 stations ≠ 804 cameras.
- **Inactive presets** — 12 presets have `inCollection: false`. Filter these out.
- **Mixed resolutions** — images are 1280x720 or 720x576.
- **Images update every ~10 minutes** — not real-time but frequently refreshed.

## Timezone

`Europe/Helsinki`

## Country

`FI`

## Category

`highway`
