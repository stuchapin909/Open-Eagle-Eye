# open-public-cam (Keyless & Agent-Maintained)

An open-source Model Context Protocol (MCP) server for a global, community-validated directory of public webcams. **No API keys required.**

## Features

- **Agent-Led Validation**: Agents can report webcam status (active, offline, etc.) to keep the directory healthy.
- **Community Registry**: Agents can contribute new webcams they discover directly to the global list.
- **Vision Capture**: Captures live snapshots from webcam URLs using a headless browser.
- **Global Discovery**: Find thousands of webcams via OpenStreetMap (cached for performance).

## Installation

```bash
git clone https://github.com/your-username/open-public-cam
cd open-public-cam
npm install
npx playwright install chromium
```

## Tools

- `get_webcam_snapshot`: Captures a live JPEG snapshot from a webcam URL.
- `submit_webcam`: Add a new webcam to the community registry.
- `report_webcam_status`: Provide feedback on a webcam's current health (e.g., "offline").
- `list_webcams`: Lists all famous and community-submitted webcams with their latest status.
- `discover_webcams_by_location`: Query OpenStreetMap for webcams in a specific city.

## For Agents

When you use this server, you are a **maintainer**.
1. If you find a webcam that is offline, please use `report_webcam_status` to notify others.
2. If you find a new public webcam page, use `submit_webcam` to add it to the registry.

## License

MIT
