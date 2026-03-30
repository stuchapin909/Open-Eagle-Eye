# Brazil Traffic Camera API Research

## Summary

CET São Paulo is the only confirmed working source for Brazil. ~195 cameras in ID range 1-238. No listing API — must scan ID range. Direct JPEG images, no auth.

---

## 1. CET São Paulo (Companhia de Engenharia de Tráfego)

### Status: WORKING — Direct JPEG URLs Available

### API Endpoint

- **Listing**: No listing API. Camera metadata available from embedded JavaScript on the viewer page.
- **Image**: `https://cameras.cetsp.com.br/Cams/{id}/1.jpg` (GET, direct JPEG)

### How to Fetch

1. **Viewer page**: `https://cameras.cetsp.com.br/View/Cam.aspx` — server-rendered ASP.NET page with embedded `gCams[]` JavaScript array
2. The page shows ~11 cameras at a time (rotates). Full system has ~195 cameras.
3. **Must scan ID range** — no listing API. Scan IDs 1-238 with HEAD or small downloads.
4. Each camera in `gCams[]` has: `pasta` (ID), `titulo` (street name), `subTitulo` (cross street), `ativa` (active status), `qtdeImagens` (25-50)

### Image URL Pattern

`https://cameras.cetsp.com.br/Cams/{id}/1.jpg` — direct JPEG, no auth

Each camera has 25-50 sequential JPEGs per capture cycle (use `1.jpg` for the first). Images update every ~12-15 minutes.

### Authentication

None required.

### Coordinate Format

**No GPS coordinates available.** Old GeoServer at `cetsp1.cetsp.com.br` returns 404.

Use approximate São Paulo center: lat -23.5505, lng -46.6333 for all cameras.

### ID Prefix Convention

`br-cet-{id}`

### City Extraction

All cameras are in São Paulo. City = "São Paulo". 11 cameras have known street names from live page; 184 use numeric IDs.

### Pagination

N/A — ID range scan (1-238 with gaps).

### Special Headers

None required. No CORS headers — server-side only.

### Known Pitfalls

- **No listing API** — must scan ID range 1-238. ~195 cameras found (gaps at certain IDs).
- **No GPS** — all cameras use São Paulo center coordinates as fallback.
- **No CORS** — browser-based fetching blocked. Server-side only.
- **Rate limiting during batch validation** — parallel batch curl (5 concurrent) showed ~75% as "invalid" due to connection drops. Validate one at a time with 0.3-1s delays.
- **Landing page is just a p5.js animation** — actual viewer is at `/View/Cam.aspx`.
- **ID-range scanning technique** — when source has no listing API but images follow sequential ID pattern, scan range with HEAD or small downloads.

### Timezone

`America/Sao_Paulo`

### Country

`BR`

### Category

`urban`

---

## 2. Other Brazilian Sources (FAILED)

- **ARTESP** — highway cameras operated by private concessionaires, no public API
- **DER-SP** — no camera API found
- **BHTRANS (Belo Horizonte)** — connection refused
- **CET-Rio** — not investigated in detail
- **dados.gov.br** — no camera datasets
- **São Paulo Open Data** — blocked by PRODAM firewall

---

## Integration Reference

| Field | Value |
|-------|-------|
| Total cameras | ~195 |
| ID prefix | `br-cet-{id}` |
| Image URL | `https://cameras.cetsp.com.br/Cams/{id}/1.jpg` |
| Content-Type | `image/jpeg` |
| Auth required | No |
| GPS available | No (use -23.5505, -46.6333) |
| Refresh rate | ~12-15 minutes |
| Scan range | IDs 1-238 |

*Research conducted: 2026-03-30*
