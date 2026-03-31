# Italy (IT) Traffic Camera Research

## Executive Summary

Autostrade per l'Italia (ASPI), the largest Italian highway operator (~3,000 km network), provides a fully public API serving direct JPEG camera images. No authentication required. 714 cameras validated and committed.

---

## Source 1: Autostrade per l'Italia (ASPI) Webcams API

### Overview
ASPI operates the majority of Italian autostrade (motorways). Their traffic information website exposes a public REST API with webcam metadata and direct JPEG frame URLs.

### API Details

**Camera List Endpoint:**
```
GET https://viabilita.autostrade.it/json/webcams.json
```

**Authentication:** None required.

**Response Structure:**
```json
{
  "webcams": [
    {
      "c_tel": 5796,
      "c_str": "A12",
      "t_des_pub": "A12 km. 68,106 Itinere Sud",
      "t_des": "km. 68,106 Itinere Sud",
      "n_prg_km": 68.11,
      "n_crd_lat": 42.133,
      "n_crd_lon": 11.82084,
      "c_uuid": "533c33b9-8ef3-4e00-8911-ed17d35ec3d0-1",
      "frames": {
        "T": { "t_url": "sat/533c33b9-...-1-thumb.jpg" },
        "F_0": { "t_url": "sat/533c33b9-...-1-0.jpg" },
        "F_1": { "t_url": "sat/533c33b9-...-1-1.jpg" },
        "3": { "t_url": "sat/533c33b9-...-1.3gp" },
        "4": { "t_url": "sat/533c33b9-...-1.mp4" },
        "V": { "t_url": "sat/533c33b9-...-1.mp4" }
      }
    }
  ]
}
```

### Key Fields
| Field | Description |
|-------|-------------|
| `c_str` | Highway code (e.g., "A01", "A14") |
| `t_des_pub` | Public description (used as camera name) |
| `n_crd_lat` / `n_crd_lon` | WGS84 coordinates |
| `n_prg_km` | Kilometer marker on highway |
| `c_uuid` | Unique camera identifier |
| `frames.T.t_url` | Thumbnail JPEG path |
| `frames.F_0.t_url` | Full frame JPEG path (used) |
| `frames.3.t_url` | 3GP video path |
| `frames.4.t_url` | MP4 video path |

### Image URL Pattern
```
https://video.autostrade.it/video-frames/{frames.F_0.t_url}
```

Example: `https://video.autostrade.it/video-frames/sat/533c33b9-8ef3-4e00-8911-ed17d35ec3d0-1-0.jpg`

Returns: `image/jpeg`, typically 6-24KB per frame.

### Camera Count
- **API total:** 999 cameras listed
- **With JPEG frames (F_0):** 722 cameras
- **Validated (HTTP 200, image/jpeg, >1KB):** 714 cameras
- **Failed (404):** 7 cameras

### Highways Covered
A01 (Autostrada del Sole - main north-south), A04, A05, A07, A08, A09, A10, A11, A12, A13, A14, A16, A23, A26, A27, A30, A56 (Tangenziale di Napoli), A57 (Tangenziale di Bologna), T06 (Tangenziale di Roma)

### ID Scheme
Registry IDs follow the pattern: `aspi-{uuid-slug}`
Example: `aspi-533c33b9-8ef3-4e00-8911-ed17d35ec3d0-1`

### Validation Date
2026-03-31

### Vision Check
Sample vision analysis of A01 km. 288,0 Scandicci confirmed: real traffic camera feed showing highway with vehicles, "autostrade per l'Italia" branding, and kilometer marker overlay.

---

## Sources Investigated (Negative Results)

| Source | Result | Notes |
|--------|--------|-------|
| Telepass traffic map | No public camera API found | JS-rendered only |
| Rome (Comune di Roma) | No accessible camera APIs | |
| Milan (Comune di Milano) | No accessible camera APIs | |
| Turin (Citta di Torino) | No accessible camera APIs | |
| Italian regions (Regioni) | No direct image APIs | Data feeds into NDW-equivalent |
| ADR (Rome airports) | 403 Forbidden | |
| Malpensa Airport | No webcam page | |
| Port of Trieste | Not accessible externally | |
| Autostrada dei Fiori (A10/A6) | Webcam page exists but no API | |
| Autostrada Brennero (A22) | Webcam pages not loading externally | |
| Autovie Venete | No camera API found | |

---

## Notes

- City names are extracted from the public description field (`t_des_pub`). Some cameras (tunnels, interchanges) don't have clear city names and are tagged with city="Italy".
- The API also returns 3GP and MP4 video files for each camera, plus thumbnails. Only the F_0 JPEG frame is used in the registry.
- Frames appear to be updated regularly (timestamps in API response show same-day updates).
- The 7 failed cameras (404) likely correspond to decommissioned or temporarily offline cameras.
