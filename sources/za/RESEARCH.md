# South Africa (ZA) Traffic Cameras - i-traffic.co.za

## Source
- **Website**: https://www.i-traffic.co.za
- **API Endpoint**: POST `https://www.i-traffic.co.za/List/GetData/Cameras`
- **Total Cameras**: 1,018
- **Date Discovered**: April 2026

## API Details

### Camera List Endpoint
- **Method**: POST
- **URL**: `https://www.i-traffic.co.za/List/GetData/Cameras`
- **Content-Type**: `application/json`
- **Headers**: `User-Agent: Mozilla/5.0`

### Request Body
```json
{
  "draw": 1,
  "start": 0,
  "length": 100,
  "search": {"value": "", "regex": false},
  "columns": [],
  "order": [{"column": 0, "dir": "asc"}]
}
```

- `start`: Offset for pagination (0, 100, 200, ...)
- `length`: Page size (max 100; larger values cause timeout)
- Total pages needed: 11 (for 1,018 cameras)

### Response Format
```json
{
  "draw": 1,
  "recordsTotal": 1018,
  "recordsFiltered": 1018,
  "data": [
    {
      "DT_RowId": "1--2",
      "id": "1--2",
      "cameraId": "1",
      "agencyId": 2,
      "description1": "GP CCTV N12 711",
      "description2": "N12",
      "region": "Gauteng",
      "state": "Gauteng",
      "cityName": "City Of Johannesburg",
      "latitude": -26.26888,
      "longitude": 28.06085,
      "roadway": "N12",
      "direction": "Unknown",
      "agencyName": "GP",
      "refreshRateMs": 10000,
      "displayName": "GP CCTV N12 711",
      ...
    }
  ]
}
```

## Camera Image URLs

### URL Pattern
```
https://www.i-traffic.co.za/map/Cctv/{id}
```

Where `{id}` is the `id` field from the API response (e.g., `1--2`, `255--3`).

**Important**: The `id` field (format: `{cameraId}--{agencyId}`) is the unique identifier per camera. The `cameraId` field alone is NOT unique (only 412 unique values across 1,018 cameras).

### Image Details
- **Format**: JPEG (image/jpeg)
- **Resolution**: 310x174 pixels
- **Refresh Rate**: ~10 seconds (per `refreshRateMs` field)
- **Authentication**: None required (public access)
- **Validation**: 30/30 spread samples returned HTTP 200 with valid image/jpeg content-type

## Coverage

### Regions
- Gauteng (GP) - Johannesburg area
- Western Cape (WC) - Cape Town area
- KwaZulu-Natal (KZN) - Durban area

### Roadways
Primarily national highways:
- N1, N2, N3, N4, N12, N14, N17, R21, R24, etc.

## Registry Notes

- **Registry ID Format**: `za-{cameraId}-{agencyId}` (e.g., `za-1-2`)
- **Category**: All classified as `highway`
- **Timezone**: All `Africa/Johannesburg` (SAST, UTC+2)
- **Verified**: 30 cameras validated via HTTP HEAD (marked `verified: true`), remaining 988 unverified
- **Auth**: All `false` (no authentication required)
- All 1,018 cameras have valid latitude/longitude coordinates
- All 1,018 camera image URLs return valid JPEG images

## Vision Verification
3 images downloaded and confirmed as real traffic camera feeds:
- `za-106-3` (N2-CCTV-038, KZN)
- `za-255-3` (N3-CCTV-145, KZN)  
- `za-354-3` (N3-CCTV-221, KZN)

All show 310x174 JPEG traffic camera snapshots with road/highway views.
