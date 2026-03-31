# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-03-30

Open Public Cam — an MCP server providing access to a curated database of ~29,000 public cameras across 11 countries.

### Features
- **11 MCP tools** for camera discovery, search, filtering, and snapshot retrieval
- Camera database covering 11 countries with real-time snapshot support
- Runtime data fetching (cameras.json downloaded on demand, not shipped in repo)
- Built with Node.js, designed for use with MCP-compatible AI assistants

### Notes
- cameras.json (~12.5 MB) is fetched at runtime and excluded from version control
- Initial public release
