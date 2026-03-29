# open-public-cam

An open-source MCP server for capturing snapshots from publicly accessible webcams. Direct-image only — one HTTP GET, sub-second captures. No API keys, no browser automation, no ffmpeg.

## How it works

The server captures webcams by fetching URLs that return images directly (JPEG/PNG). No JavaScript rendering, no stream decoding, no heavy dependencies.

A valid webcam URL is any endpoint that returns an image with `Content-Type: image/jpeg` or `image/png` on a plain HTTP GET.

## Installation

```bash
git clone https://github.com/stuchapin909/open-public-cam
cd open-public-cam
npm install
```

No external dependencies beyond Node.js and npm.

## MCP Tools

### `get_webcam_snapshot`
Capture a live JPEG snapshot from a registered webcam. Returns a local file path.

### `list_webcams`
List all webcams in the registry with status indicators.

### `search_webcams`
Search the registry by name or location (case-insensitive).

### `draft_webcam`
Add a webcam entry to the local community registry. Unverified — no URL validation.

### `draft_webcam_report`
Save a local health report for a webcam. Blocks reports during nighttime at the webcam's location.

### `submit_new_webcam_to_github`
Submit a webcam via GitHub issue. Validates that the URL returns an image before submitting.

### `submit_report_to_github`
Report a broken webcam via GitHub issue.

### `sync_registry`
Pull latest community registry and validation data from GitHub.

## Registry

Webcams live in two places:

- **Curated list** (in `index.js`) — verified, ships with the server
- **Community registry** (`community-registry.json`) — user-submitted, synced via GitHub

### Webcam schema

```json
{
  "id": "my-cam",
  "name": "My Webcam",
  "url": "https://example.com/webcam.jpg",
  "category": "city",
  "location": "City, Country",
  "timezone": "Europe/London",
  "verified": true
}
```

Categories: `city`, `park`, `highway`, `airport`, `port`, `weather`, `nature`, `landmark`, `other`

## For AI Agents

See [AGENT-GUIDE.md](AGENT-GUIDE.md) for instructions on discovering and adding new webcam sources. Covers what makes a valid direct-image URL, common URL patterns, and how to verify sources before adding them.

## Ethical guidelines

- Public spaces only: streets, landmarks, beaches, nature, transit
- No private property, interiors, or security cameras
- No password-protected or hidden feeds
- All sources must be publicly accessible without authentication

## License

MIT
