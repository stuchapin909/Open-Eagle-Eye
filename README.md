# Open Eagle Eye

![License: MIT](https://img.shields.io/badge/license-MIT-blue)

MCP server that gives AI agents instant access to public webcam feeds worldwide. One HTTP GET, sub-second captures, no browser automation, no stream decoding. Built for agents — returns structured JSON and base64 images.

## Quick start

```json
{
  "mcpServers": {
    "openeagleeye": {
      "command": "npx",
      "args": ["-y", "openeagleeye"]
    }
  }
}
```

Or install globally:

```bash
npm install -g openeagleeye
openeagleeye
```

## How it works

A valid webcam URL is any endpoint that returns a JPEG or PNG on a plain HTTP GET. No JavaScript rendering, no RTSP, no ffmpeg. Most city traffic cameras, weather stations, and park cams expose exactly this. The server fetches the image and returns it as base64 data the agent can display or analyze.

## MCP Tools

| Tool | Description |
|---|---|
| `get_webcam_snapshot` | Fetch a live snapshot — returns base64 image data |
| `list_webcams` | List all cameras with filters (location, category) — returns JSON |
| `search_webcams` | Search by name, location, or category — returns JSON |
| `draft_webcam` | Add a new camera to the local registry |
| `draft_webcam_report` | Report a broken or offline camera |
| `get_config_info` | Check API key configuration status |
| `sync_registry` | Pull latest community cameras from GitHub |

### Output format

Every tool returns structured JSON. Agents can reliably parse responses without regexing text blobs. Snapshots save to disk and return the file path — the MCP server runs as a local subprocess, so the agent has filesystem access to read the file if it needs to analyze the image.

**Snapshot response** — JSON with file path and metadata:
```json
{
  "success": true,
  "file_path": "/path/to/snapshots/nyc_cam_1234.jpg",
  "size_bytes": 14579,
  "content_type": "image/jpeg",
  "camera": { "id": "nyc-bb-21-...", "name": "BB-21 North Rdwy", "location": "Manhattan, New York, USA" }
}
```

**List/Search response** — JSON with camera array:
```json
{
  "version": "6.0.0",
  "total": 524,
  "shown": 524,
  "locations": { "London, UK": 424, "Manhattan, New York, USA": 38 },
  "cameras": [
    { "id": "nyc-bb-21-...", "name": "BB-21 North Rdwy", "location": "Manhattan, New York, USA", "category": "city", "verified": true, "status": "active", "auth_required": false }
  ]
}
```

## Registry

**524 cameras** across two cities:
- 424 London TfL JamCams (all boroughs)
- 100 NYC TMC traffic cams (all 5 boroughs)

All verified, all work with zero API keys.

Cameras live in two places:
- **Curated list** (built in) — verified cameras shipped with the server
- **Community registry** (`community-registry.json`) — user-submitted cameras

## API Keys (optional)

Most cameras work out of the box. Some require a free API key. If a snapshot fails with a key error, the response tells you where to sign up and how to configure it.

Create `~/.openeagleeye/config.json`:

```json
{
  "api_keys": {
    "PROVIDER_API_KEY": "your-key-here"
  }
}
```

Use `get_config_info` to check which cameras need keys and whether yours are set.

## Adding cameras

1. Find a direct-image URL (must return `image/jpeg` or `image/png` on plain GET)
2. Use `draft_webcam` with the URL, location, and timezone
3. Test with `get_webcam_snapshot`
4. Open a PR to contribute

Good sources: city DOTs, weather stations, ski resorts, national parks, ports, airports.

## Contributing

Pull requests welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
