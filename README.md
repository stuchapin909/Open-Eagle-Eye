# Eagle Eye

Instant webcam snapshots from public cameras worldwide. One HTTP GET, sub-second captures, no API keys, no browser automation.

## Quick start

```bash
npx eagleeye
```

Or install globally:

```bash
npm install -g eagleeye
eagleeye
```

Eagle Eye runs as an MCP server. Add it to your MCP client config:

```json
{
  "mcpServers": {
    "eagle-eye": {
      "command": "npx",
      "args": ["-y", "eagleeye"]
    }
  }
}
```

## How it works

A valid webcam URL is any endpoint that returns a JPEG or PNG image on a plain HTTP GET. That's it. No JavaScript rendering, no stream decoding, no ffmpeg. Most city traffic cameras, weather stations, and park cams expose exactly this.

## MCP Tools

| Tool | Description |
|---|---|
| `get_webcam_snapshot` | Capture a live snapshot from any registered webcam |
| `list_webcams` | List all webcams with status indicators |
| `search_webcams` | Search by name or location |
| `draft_webcam` | Add a webcam entry to the local registry |
| `draft_webcam_report` | Report a broken or offline webcam |
| `sync_registry` | Pull latest community data from GitHub |

## Registry

Webcams live in two places:

- **Curated list** (built in) -- verified cameras that ship with the server
- **Community registry** (`community-registry.json`) -- user-submitted, auto-validated by GitHub Actions

Every community submission runs through automated checks: schema validation, URL liveness, content-type verification, and vision AI to confirm it's actually a webcam and not a logo or error page.

### Adding a webcam

1. Find a direct-image URL (see [AGENT-GUIDE.md](AGENT-GUIDE.md) for tips)
2. Use `draft_webcam` to add it locally
3. Verify with `get_webcam_snapshot`
4. Push or open a PR -- the GitHub Action validates automatically

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

## Contributing

Pull requests welcome. See [AGENT-GUIDE.md](AGENT-GUIDE.md) for how to discover and verify new webcam sources.

Changes to `community-registry.json` are validated automatically -- bad URLs, wrong content types, and non-webcam images get rejected.

## License

MIT
