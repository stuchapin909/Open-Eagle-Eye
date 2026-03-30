# DataTables POST API Pattern (US State 511 Sites)

## Summary

Eight confirmed US state 511 sites use the exact same DataTables server-side API structure. This pattern can be used to quickly probe and integrate new state 511 camera sources.

---

## Confirmed Working Sites

| Domain | State | Cameras | ID Prefix |
|--------|-------|---------|-----------|
| `www.fl511.com` | Florida | 4,700 | `fl-{id}-{slug}` |
| `www.511pa.com` | Pennsylvania | 1,445 | `pa-{roadway}-{direction}-{imgid}` |
| `www.az511.com` | Arizona | 604 | `az-{imgid}` |
| `www.nvroads.com` | Nevada | 643 | `nv-{slug}` |
| `udottraffic.utah.gov` | Utah | 2,026 | `ut-{id}` |
| `511wi.gov` | Wisconsin | 448 valid (482 from API) | `wi-{id}` |
| `newengland511.org` | ME/NH/VT | 408 | `ne-{state}-{roadway}-{direction}-{imgid}` |
| `511la.org` | Louisiana | 336 | (not yet integrated) |

## Common API Structure

### Endpoint

`https://{domain}/List/GetData/Cameras` — always POST

### Request Body

```json
{
  "draw": 1,
  "start": OFFSET,
  "length": 100,
  "columns": [{"data": "sortOrder", "name": "sortOrder"}]
}
```

- `draw`: request counter (increment for each request)
- `start`: offset for pagination (0, 100, 200, ...)
- `length`: page size (100 is the maximum — sending higher values is ignored by some sites like FL511)
- `columns`: required by DataTables but value doesn't matter

### Response Format

```json
{
  "draw": 1,
  "recordsTotal": 4700,
  "recordsFiltered": 4700,
  "data": [
    {
      "id": "CAMERA_ID",
      "name": "Camera Name",
      "location": "Location string",
      "latLng": {
        "geography": {
          "wellKnownText": "POINT (-81.1234 28.5678)"
        }
      },
      "sortOrder": 1,
      ...
    }
  ]
}
```

### Image URL Pattern

`https://{domain}/map/Cctv/{id}` — direct JPEG or PNG

The `id` comes from `data[].id` in the response.

### Pagination

**Mandatory** — always paginate. Some sites (FL511) cap at 100 per request even with `length: 500`.

```python
offset = 0
while True:
    response = post(f"{domain}/List/GetData/Cameras", json={
        "draw": 1, "start": offset, "length": 100,
        "columns": [{"data": "sortOrder", "name": "sortOrder"}]
    })
    data = response.json()["data"]
    if not data:
        break
    process(data)
    offset += 100
```

## WKT Coordinate Parsing

All DataTables sites store coordinates in WKT (Well-Known Text) format:

```
POINT (lng lat)
```

**Critical: WKT order is longitude first, latitude second.** The registry uses `{lat, lng}`, so you must swap.

### Parsing

```python
import re

def parse_wkt(wkt_string):
    """Parse WKT 'POINT (lng lat)' to {lat, lng} dict."""
    match = re.search(r'POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)', wkt_string)
    if match:
        lng, lat = float(match.group(1)), float(match.group(2))
        return {"lat": lat, "lng": lng}
    return None
```

### Null Coordinate Check

Some cameras return `POINT (0 0)` — these must be excluded. Always validate:
```python
coords = parse_wkt(wkt)
if coords and coords["lat"] != 0 and coords["lng"] != 0:
    # valid
```

Wisconsin had 34 cameras with null coordinates (0, 0) out of 482 total.

## Probing New State 511 Sites

When researching a new US state DOT, check if their 511 site uses this pattern:

### Method 1: Direct POST Test

```bash
curl -s -X POST "https://www.{state}511.com/List/GetData/Cameras" \
  -H "Content-Type: application/json" \
  -d '{"draw":1,"start":0,"length":100,"columns":[{"data":"sortOrder","name":"sortOrder"}]}'
```

- **Working site**: returns JSON with `recordsTotal` and `data[]` array
- **Dead/wrong site**: returns HTML 404 or error page

### Method 2: Browser Network Tab

1. Open the 511 website in a browser
2. Open DevTools → Network tab
3. Look for XHR requests to `/List/GetData/Cameras`
4. Check if it's a POST with DataTables JSON body

### Method 3: Common Domain Patterns

Try these domain patterns for each state:
- `www.{state}511.com` (e.g., az511.com, nvroads.com)
- `www.511{state}.com`
- `511.{state}.gov`
- `{state}.gov` DOT traffic pages

### Discovered via Probing

The following sites were discovered by POSTing to `/List/GetData/Cameras`:
- Wisconsin: `511wi.gov` — 482 cameras
- New England: `newengland511.org` — 408 cameras (ME/NH/VT)
- Louisiana: `511la.org` — 336 cameras
- Utah: `udottraffic.utah.gov` — 2,026 cameras

## Source-Specific Notes

### FL511
- ~12% offline rate — offline cameras return 15,136 byte placeholder PNG
- Timezone split: panhandle counties use `America/Chicago`, rest use `America/New_York`
- ID prefix collision: `fl-` matches inside `tfl-` — always use `startswith("fl-") and not startswith("tfl-")`

### 511PA
- 0% offline rate — very well maintained
- Sources: PennDOT (1,279), RWIS weather (77), PTC Turnpike (89)

### az511
- Mixed JPEG/PNG responses
- Timezone: `America/Phoenix` (no DST)

### nvroads
- Mixed JPEG/PNG responses
- Covers Las Vegas (367), Reno (184), Elko (90)

### UDOT (Utah)
- 2,026 cameras — largest DataTables site
- City extraction via UDOT area codes at end of location string
- Offline placeholder: branded PNG ("This camera is offline")
- One camera (118181) returned GIF

### 511wi (Wisconsin)
- 34 cameras with null coordinates `POINT (0 0)` — must exclude
- Use `county` field as city fallback

### New England 511
- **Control characters** in JSON — must strip null bytes and carriage returns before parsing
- Three different city extraction patterns per state (VT, ME, NH)
- 5 pages of results

### 511la (Louisiana)
- 336 cameras (not yet fully integrated)
- Same pattern as above
