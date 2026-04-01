# Texas Traffic Cameras - Research

## Houston TranStar (2026-04-01)

### Source
- **Organization**: Houston TranStar (Houston-Galveston Area Council / TxDOT / Harris County / Metro / City of Houston)
- **Website**: https://traffic.houstontranstar.org/
- **Camera page**: https://traffic.houstontranstar.org/cctv/transtar/

### API Details
- **Camera data**: `http://traffic.houstontranstar.org/data/layers/cctvSnapshots_out.js`
  - JavaScript file containing camera metadata as `CctvCamera` objects
  - Fields: name, monitor, roadway, location, lat, lng, direction, path, validimg
  - No authentication required
  - Updated in real-time (snapshots refresh every few minutes)
- **Image base URL**: `https://www.houstontranstar.org/snapshots/cctv/{path}`
  - Returns `image/jpeg` on plain HTTP GET
  - No authentication required
  - Path is a numeric filename (e.g., `1002.jpg`)

### Coverage
- **Total cameras in data**: 1,368 (1,090 valid, 278 marked invalid)
- **Roadways covered**: 80+ (IH-10, IH-45, IH-69, IH-610, Beltway 8, SH-99, SH-288, SH-249, US-290, Hardy Toll Road, Westpark Tollway, Fort Bend Toll Road, etc.)
- **Geographic area**: Greater Houston metropolitan area including Harris County and parts of surrounding counties
- **Cities**: Houston, Galveston, Spring, Clear Lake, Missouri City, League City

### Cameras Committed
- **Batch 1** (commit 1): 500 cameras (indices 1-500)
- **Batch 2** (commit 2): 590 cameras (indices 501-1090)
- **Total committed**: 1,090 cameras
- **Validation**: HTTP HEAD/GET checks on spread samples (every ~200th camera) - all returned valid JPEG
- **Vision check**: 3 samples confirmed real traffic camera feeds (IH-10 East @ San Jacinto, IH-10 Katy @ Fry, Spur 330)

### Blocked / Failed Sources

#### TxDOT ITS System (its.txdot.gov)
- **URL**: https://its.txdot.gov/its/District/{CODE}/
- **Districts**: AUS (Austin), DAL (Dallas), FTW (Fort Worth), HOU (Houston), SAT (San Antonio), ELP (El Paso), CRP (Corpus Christi), WAC (Waco)
- **API endpoints**:
  - `DistrictIts/GetCctvStatusListByDistrict?districtCode=XXX` - returns camera metadata with coordinates
  - `DistrictIts/GetCctvSnapshotByIcdId?icdId=XXX&districtCode=XXX` - returns base64-encoded JPEG snapshot
- **Why blocked**: Snapshots delivered via SignalR WebSocket + REST API as base64-encoded data. No direct image URL that returns JPEG/PNG on plain HTTP GET. The website embeds snapshots as `data:image/jpeg;base64,...` in the DOM.
- **Potential workaround**: Could build a proxy service, but that's outside the scope of this registry (we need direct image URLs).

#### CTRMA (Central Texas Regional Mobility Authority)
- **URL**: https://www.ctrma.org
- **Status**: No camera feeds found on website

#### NTTA (North Texas Tollway Authority)
- **URL**: https://www.ntta.org
- **Status**: No camera feeds found on website

#### HCTRA (Harris County Toll Road Authority)
- **URL**: https://www.hctra.org
- **Status**: Website returns minimal content; no camera feeds found

### Notes
- TxDOT also links to El Paso's camera system: https://www2.elpasotexas.gov/misc/externally_linked/bridges/cameras.html (not yet investigated)
- The TxDOT ITS system has a REST API with camera metadata (coordinates, names, ICD IDs) for all 8 districts - useful reference even though images aren't directly accessible
- Houston TranStar covers the largest metro area in Texas and has the most comprehensive camera network
