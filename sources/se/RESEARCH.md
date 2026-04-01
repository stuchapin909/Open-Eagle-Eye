# Sweden (SE) Traffic Camera Research

**Date:** 2026-04-01
**Status:** BLOCKED — Trafikverket (Swedish Transport Administration) sites unreachable from WSL

## Summary

Swedish traffic cameras are managed by Trafikverket and various municipal authorities. Neither the main Trafikverket website nor their API is accessible from the WSL environment.

## Sources Investigated

### 1. Trafikverket (Swedish Transport Administration)
- **Main site:** `https://www.trafikverket.se` — returns 404
- **Traffic camera page:** `https://www.trafikverket.se/trafiken-i-sverige/Trafikinformation/Trafikkameror/` — returns 404
- **API:** `https://api.trafikverket.se` — DNS resolution failure (no response)
- **Known image pattern (stale):** `https://www.trafikverket.se/contentassets/c8f28e8a48a34e6ba207be5c0a66b6e4/{id}.jpg` — 404
- **Alternative image domain:** `https://images.trafikverket.se/{id}.jpg` — DNS resolution failure

Trafikverket has a SOAP API at `https://api.trafikverket.se/v2/data.xml` with a `GetTrafficCameras` endpoint, but the API domain is unreachable from WSL. The API requires a free API key.

### 2. Stockholm City Traffic Cameras (Trafik Stockholm)
- **API (stale):** `https://openparking.stockholm.se/LTF-Tolken/v1/camera` — 404
- **Alternative:** `https://webapp.trafikenforstockholm.se/cameraimages/{id}.jpg` — DNS resolution failure

### 3. Gothenburg
- No public camera API found in web research.

### 4. Trafiklab (trafiklab.se)
- Sweden's open transport data platform. Does not host traffic camera datasets.

## What Might Work

- **VPN/Proxy from Sweden:** Trafikverket sites may be geo-restricted or simply blocked from non-Swedish IPs
- **Browser-based scraping with Swedish proxy:** Load the Trafikverket traffic map and intercept network requests
- **Free API key from Trafikverket:** Requesting a key at https://api.trafikverket.se/ might work, but the API domain itself doesn't resolve from WSL

## Cameras Committed

0 (blocked)
