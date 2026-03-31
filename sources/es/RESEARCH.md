# Spain (ES) Traffic Camera Research

## Summary

Spain's Direccion General de Trafico (DGT) operates 1,787 validated public traffic cameras across all major highways and autovias. Cameras serve direct JPEG images via a simple, authenticated-free HTTP GET pattern.

## Status: SUCCESS

## API Details

- **Source**: DGT (Direccion General de Trafico)
- **Camera List URL**: `https://www.dgt.es/.content/.assets/json/camaras.json`
- **Image URL Pattern**: `https://infocar.dgt.es/etraffic/data/camaras/{id}.jpg`
- **Authentication**: None required
- **Content-Type**: `image/jpeg`
- **Cache**: `max-age=120` (images refresh every 2 minutes)
- **Validation Date**: 2026-03-31

## Camera Data Schema (DGT source)

```json
{
  "fecha": "2024/10/25 14:27:06",
  "latitud": "42.0676",
  "longitud": "-4.2227",
  "sentido": "-",
  "imagen": "https://infocar.dgt.es/etraffic/data/camaras/2.jpg",
  "carretera": "A-62",
  "id": "2",
  "pk": "57.9",
  "provincia": "34"
}
```

Fields: fecha (last update), latitud/longitud (WGS84), sentido (direction: +/-/*/-), imagen (JPEG URL), carretera (road name), id (camera ID), pk (kilometer point), provincia (2-digit province code).

## Coverage

- **Total cameras in DGT JSON**: 1,801
- **Validated (HTTP 200 + image/jpeg)**: 1,787
- **Failed (HTTP 404)**: 14
- **Provinces covered**: 46 (out of 50 Spanish provinces + 2 autonomous cities)
- **Timezone**: Europe/Madrid (all validated cameras are in peninsular Spain/Balearics)

## Top Cities by Camera Count

| City | Cameras |
|------|---------|
| Madrid | 364 |
| Valencia | 118 |
| Malaga | 117 |
| A Coruna | 108 |
| Zaragoza | 78 |
| Toledo | 67 |
| Leon | 64 |
| Oviedo | 63 |
| Pontevedra | 63 |
| Lugo | 62 |

## Validation Results

- Tested 5 sample images with vision AI: all confirmed as real DGT traffic cameras showing highway/road scenes
- Tested 20 parallel HEAD requests: all valid JPEGs returned 200 with content-type image/jpeg
- 14 cameras returned 404 (likely decommissioned or not yet deployed)
- Image dimensions vary: 853x480, 1280x720, 587x480 (different camera hardware)

## Failed Camera IDs (404)

166058, 167598, 167801, 167841, 169168, 169205, 169206, 169207, 169208, 169475, 169538, 169539, 169663, 176266

## Registry Entry Format

- ID prefix: `es-dgt-{dgt_id}`
- Category: `highway`
- Country: `ES`
- City: Province capital (from province code mapping)
- Location: `{road}, {province_name}, Spain`
- Timezone: `Europe/Madrid`

## Commits

- Batch 1: 500 cameras (IDs 2-168490)
- Batch 2: 500 cameras
- Batch 3: 500 cameras
- Batch 4: 287 cameras (total 1,787)
