# Canada Traffic Cameras (Ontario MTO 511 + Alberta 511)

## Summary

Two Canadian provincial 511 systems with the same API pattern. 923 cameras from Ontario, 369 from Alberta = 1,292 total. Both use redirect-based image URLs.

---

## Ontario MTO 511

### API Endpoint
- **Listing**: `https://511on.ca/api/v2/get/cameras` (GET, returns JSON)
- **Image**: `https://511on.ca/map/Cctv/{id}` (302 redirect to actual JPEG)

### How to Fetch
1. GET `https://511on.ca/api/v2/get/cameras` — returns JSON array of camera objects
2. Each camera has an ID and metadata
3. Image URL at `/map/Cctv/{id}` — this URL redirects (302) to the actual JPEG

### Coordinate Format
Standard lat/lng from API. No swap needed.

### ID Prefix Convention
`on-` (followed by camera ID)

### City Extraction
**Haversine distance** to known Ontario city centers. No city field in the API — must calculate nearest city by GPS distance.

**Small city consolidation**: Cities with fewer than 3 cameras should be consolidated to "Ontario".

### Timezone
`America/Toronto`

### Known Pitfalls
- **URL redirect** — `/map/Cctv/{id}` does a 302 redirect to the actual JPEG. The validator's `maxRedirects: 1` handles this. When testing with curl, use `-L` flag.

---

## Alberta 511

### API Endpoint
- **Listing**: `https://511.alberta.ca/api/v2/get/cameras` (GET, returns JSON)
- **Image**: `https://511.alberta.ca/map/Cctv/{id}` (302 redirect to actual JPEG)

### How to Fetch
1. GET `https://511.alberta.ca/api/v2/get/cameras` — returns JSON array
2. Same API pattern as Ontario 511 (both likely use the same 511 platform vendor)
3. Image URLs redirect to actual JPEG

### Coordinate Format
Standard lat/lng from API. No swap needed.

### ID Prefix Convention
`ab-` (followed by camera ID)

### City Extraction
**Haversine distance** to known Alberta city centers.

Major cities: Calgary (220), Edmonton (19), Banff (19), Fort McMurray (6). Small towns consolidated to "Alberta".

### Timezone
`America/Edmonton`

### Known Pitfalls
- **URL redirect** — same as Ontario, `/map/Cctv/{id}` does 302 redirect

---

## Shared Notes

- **Category**: `highway` for all cameras
- **Redirect handling**: Both provinces use `maxRedirects: 1` in the validator to allow the single 302 redirect while preventing multi-hop SSRF chains
- **No auth** required for either province
- **No pagination** — single request returns all cameras
