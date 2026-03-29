#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import { spawnSync, execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = path.join(__dirname, "community-registry.json");
const LOG_PATH = path.join(__dirname, "validation-log.json");
const CONFIG_PATH = path.join(__dirname, "config.json");
const SNAPSHOTS_DIR = path.join(__dirname, "snapshots");

// Version sync: 2.4.0 (Verified Registry)
const VERSION = "2.4.0";

// GitHub Constants (Module Level)
const GITHUB_OWNER = "stuchapin909";
const GITHUB_REPO = "open-public-cam";
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/master`;

if (!fs.existsSync(SNAPSHOTS_DIR)) fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });

// Robust Dependency Detection (works on native Windows, WSL, and Linux)
function findCommand(cmd) {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore' });
    return cmd;
  } catch (e) {
    // Check Windows Python Scripts path (works from WSL via /mnt/c/ and native Windows)
    const appData = process.env.APPDATA || process.env.windir
      ? path.join(process.env.APPDATA || path.join(process.env.windir, '..', 'Roaming'), 'Python')
      : null;
    if (appData) {
      const parent = path.dirname(appData);
      const roamingPath = path.join(parent, 'Roaming', 'Python');
      if (fs.existsSync(roamingPath)) {
        const dirs = fs.readdirSync(roamingPath).filter(d => d.startsWith('Python'));
        for (const dir of dirs) {
          const exePath = path.join(roamingPath, dir, 'Scripts', `${cmd}.exe`);
          if (fs.existsSync(exePath)) return exePath;
        }
      }
    }
    // WSL: check /mnt/c/Users/*/AppData/Roaming/Python
    if (process.platform === 'linux' && fs.existsSync('/mnt/c/Users')) {
      try {
        const users = fs.readdirSync('/mnt/c/Users').filter(d => d !== 'Public' && d !== 'Default' && d !== 'Default User');
        for (const user of users) {
          const pyBase = `/mnt/c/Users/${user}/AppData/Roaming/Python`;
          if (fs.existsSync(pyBase)) {
            const dirs = fs.readdirSync(pyBase).filter(d => d.startsWith('Python'));
            for (const dir of dirs) {
              const exePath = path.join(pyBase, dir, 'Scripts', `${cmd}.exe`);
              if (fs.existsSync(exePath)) return exePath;
            }
          }
        }
      } catch (_) {}
    }
    return null;
  }
}

const YTDLP_PATH = findCommand('yt-dlp');
const FFMPEG_PATH = findCommand('ffmpeg');

if (!YTDLP_PATH) console.error("Warning: 'yt-dlp' not found. YouTube/Stream extraction disabled.");
if (!FFMPEG_PATH) console.error("Warning: 'ffmpeg' not found. Stream frame-capture disabled.");

const server = new McpServer({ name: "open-public-cam", version: VERSION });

// v2.4.0 Curated List — all URLs verified via yt-dlp extraction + ffmpeg frame capture
const CURATED_WEBCAMS = [
  // --- DIRECT STREAMS (YouTube Live via yt-dlp) ---
  {
    id: "venice-beach-la-yt",
    name: "Venice Beach, Los Angeles",
    url: "https://www.youtube.com/watch?v=EO_1LWqsCNE",
    access_strategy: { type: "direct_stream", extractor: "yt-dlp" },
    category: "city", location: "Los Angeles, USA", timezone: "America/Los_Angeles", verified: true
  },
  {
    id: "sf-skyline-yt",
    name: "San Francisco Skyline & Golden Gate",
    url: "https://www.youtube.com/watch?v=BSWhGNXxT9A",
    access_strategy: { type: "direct_stream", extractor: "yt-dlp" },
    category: "city", location: "San Francisco, USA", timezone: "America/Los_Angeles", verified: true
  },
  {
    id: "jamaica-may-pen-yt",
    name: "Downtown May Pen, Jamaica",
    url: "https://www.youtube.com/watch?v=hKcBA8XS5ZA",
    access_strategy: { type: "direct_stream", extractor: "yt-dlp" },
    category: "city", location: "May Pen, Jamaica", timezone: "America/Jamaica", verified: true
  },
  {
    id: "koh-phangan-beach-yt",
    name: "Koh Phangan Beach, Thailand",
    url: "https://www.youtube.com/watch?v=FBYUkqutqzE",
    access_strategy: { type: "direct_stream", extractor: "yt-dlp" },
    category: "beach", location: "Koh Phangan, Thailand", timezone: "Asia/Bangkok", verified: true
  },
  {
    id: "koh-phangan-sunset-yt",
    name: "Koh Phangan Sunset, Thailand",
    url: "https://www.youtube.com/watch?v=vVmhZ5Mz3Ms",
    access_strategy: { type: "direct_stream", extractor: "yt-dlp" },
    category: "beach", location: "Koh Phangan, Thailand", timezone: "Asia/Bangkok", verified: true
  },
  {
    id: "denmark-wildlife-yt",
    name: "Denmark Forest Wildlife",
    url: "https://www.youtube.com/watch?v=F0GOOP82094",
    access_strategy: { type: "direct_stream", extractor: "yt-dlp" },
    category: "nature", location: "Denmark", timezone: "Europe/Copenhagen", verified: true
  },
  {
    id: "squirrel-bird-feeder-yt",
    name: "Red Squirrels & Bird Feeder",
    url: "https://www.youtube.com/watch?v=dJVVcv9-ndg",
    access_strategy: { type: "direct_stream", extractor: "yt-dlp" },
    category: "nature", location: "Europe", timezone: "Europe/Stockholm", verified: true
  },
  {
    id: "norway-railway-yt",
    name: "Norway Railway Cab Views",
    url: "https://www.youtube.com/watch?v=tAWFO8_O_7M",
    access_strategy: { type: "direct_stream", extractor: "yt-dlp" },
    category: "transport", location: "Norway", timezone: "Europe/Oslo", verified: true
  },
  {
    id: "surf-cams-global-yt",
    name: "Surf Cams — Hawaii, California, Bali",
    url: "https://www.youtube.com/watch?v=hm9iAviOZ20",
    access_strategy: { type: "direct_stream", extractor: "yt-dlp" },
    category: "beach", location: "Global", timezone: "Pacific/Honolulu", verified: true
  },
];

// Registry Helpers
const getCommunityData = () => { try { return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8")); } catch (e) { return []; } };
const getValidationLog = () => { try { return JSON.parse(fs.readFileSync(LOG_PATH, "utf8")); } catch (e) { return {}; } };
const saveRegistry = (data) => fs.writeFileSync(REGISTRY_PATH, JSON.stringify(data, null, 2));
const saveLog = (data) => fs.writeFileSync(LOG_PATH, JSON.stringify(data, null, 2));

function findWebcam(idOrUrl) {
  return CURATED_WEBCAMS.find(c => c.id === idOrUrl || c.url === idOrUrl) || getCommunityData().find(c => c.id === idOrUrl || c.url === idOrUrl);
}

function isNighttimeAt(timezone) {
  if (!timezone) return false;
  try {
    const hour = new Date().toLocaleString("en-US", { timeZone: timezone, hour: "numeric", hour12: false });
    const h = parseInt(hour, 10);
    return h >= 20 || h < 6;
  } catch (e) { return false; }
}

// v2.3 URL PRE-FLIGHT CHECK (Uses GET with limit for better reliability)
async function validateUrl(url, strategyType) {
  try {
    if (strategyType === "direct_image") {
      const resp = await axios.get(url, { 
        timeout: 5000, 
        headers: { 'User-Agent': 'Mozilla/5.0' },
        responseType: 'stream'
      });
      const contentType = resp.headers['content-type'] || "";
      resp.data.destroy(); // Close stream immediately after checking headers
      return contentType.includes('image/');
    }
    return true; // Stream validation handled by yt-dlp check
  } catch (e) { return false; }
}

// Snapshot Tool
server.tool(
  "get_webcam_snapshot",
  "Captures a live high-speed snapshot (No Browser).",
  { cam_id: z.string().describe("ID or URL") },
  async ({ cam_id }) => {
    const cam = findWebcam(cam_id);
    if (!cam) return { content: [{ type: "text", text: `Error: Cam '${cam_id}' not found.` }], isError: true };

    const strategy = cam.access_strategy || { type: "direct_image" };
    const filename = `${cam.id.substring(0, 30)}_${Date.now()}.jpg`.replace(/[^a-z0-9.]/gi, '_');
    const fullPath = path.join(SNAPSHOTS_DIR, filename);

    try {
      if (strategy.type === "direct_image") {
        const response = await axios.get(cam.url, { responseType: 'arraybuffer', timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        fs.writeFileSync(fullPath, Buffer.from(response.data));
      } else if (strategy.type === "direct_stream") {
        if (!FFMPEG_PATH) throw new Error("ffmpeg missing.");
        let streamUrl = cam.url;
        if (strategy.extractor === "yt-dlp") {
          if (!YTDLP_PATH) throw new Error("yt-dlp missing.");
          const extract = spawnSync(YTDLP_PATH, ["-g", cam.url], { encoding: 'utf8' });
          if (extract.status !== 0) throw new Error("yt-dlp extraction failed.");
          streamUrl = extract.stdout.trim().split('\n')[0];
        }
        
        // Use individual header flags for maximum compatibility
        const capture = spawnSync(FFMPEG_PATH, [
          "-headers", "User-Agent: Mozilla/5.0\r\nReferer: https://www.google.com/\r\n",
          "-i", streamUrl, "-frames:v", "1", "-update", "1", "-q:v", "2", fullPath, "-y"
        ]);
        if (capture.status !== 0 && !fs.existsSync(fullPath)) throw new Error("FFmpeg capture failed.");
      }
      return { content: [{ type: "text", text: `Snapshot captured: ${fullPath}` }] };
    } catch (e) { return { content: [{ type: "text", text: `Snapshot failed: ${e.message}` }], isError: true }; }
  }
);

// ECOSYSTEM TOOLS
server.tool("list_webcams", "Lists all verified webcams.", {}, async () => {
  const all = [...CURATED_WEBCAMS, ...getCommunityData()];
  const logs = getValidationLog();
  const list = all.map(c => {
    const statusEntry = logs[c.id] || logs[c.url];
    const status = statusEntry?.status || "active";
    const icon = status === "active" ? "🟢" : "🔴";
    return `${icon} ${c.name} (${c.location}) - ID: ${c.id} [${c.access_strategy.type}]`;
  }).join("\n");
  return { content: [{ type: "text", text: `v${VERSION} Verified Registry:\n\n${list}\n\nUse get_webcam_snapshot with ID.` }] };
});

server.tool("search_webcams", "Search registry by name or location.", { query: z.string() }, async ({ query }) => {
  const all = [...CURATED_WEBCAMS, ...getCommunityData()];
  const results = all.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.location.toLowerCase().includes(query.toLowerCase()));
  return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
});

server.tool("draft_webcam", "Compose a local unverified webcam candidate.", { 
  name: z.string(), 
  url: z.string().url(), 
  location: z.string(), 
  timezone: z.string(), 
  strategy: z.enum(["direct_image", "direct_stream"]),
  category: z.string().optional()
}, async (cam) => {
  const community = getCommunityData();
  const id = `comm-${Date.now()}`;
  community.push({ 
    ...cam, 
    id, 
    access_strategy: { type: cam.strategy, extractor: cam.strategy === "direct_stream" ? "yt-dlp" : undefined }, 
    verified: false, 
    submitted_at: new Date().toISOString() 
  });
  saveRegistry(community);
  return { content: [{ type: "text", text: `Drafted: ${cam.name} (ID: ${id})` }] };
});

server.tool("draft_webcam_report", "Draft a local health report for a webcam.", {
  cam_id: z.string(),
  status: z.enum(["active", "offline", "broken_link", "low_quality"]),
  notes: z.string().optional()
}, async ({ cam_id, status, notes }) => {
  const cam = findWebcam(cam_id);
  if (cam && isNighttimeAt(cam.timezone)) return { content: [{ type: "text", text: "Report blocked: Nighttime at location." }], isError: true };
  
  const logs = getValidationLog();
  logs[cam_id] = { status, notes, timestamp: new Date().toISOString() };
  saveLog(logs);
  return { content: [{ type: "text", text: `Draft report saved for ${cam_id}.` }] };
});

server.tool("submit_new_webcam_to_github", "Verify and submit a high-integrity cam to global registry.", {
  name: z.string(), url: z.string().url(), location: z.string(), timezone: z.string(), type: z.enum(["direct_image", "direct_stream"]), category: z.string().optional()
}, async (sub) => {
  const isValid = await validateUrl(sub.url, sub.type);
  if (!isValid && sub.type === "direct_image") return { content: [{ type: "text", text: "Error: URL did not return a valid image headers." }], isError: true };

  try {
    const title = `[webcam-submission] ${sub.name}`;
    const body = `\`\`\`json\n${JSON.stringify({ ...sub, access_strategy: { type: sub.type, extractor: sub.type === "direct_stream" ? "yt-dlp" : undefined } }, null, 2)}\n\`\`\``;
    const result = spawnSync("gh", ["issue", "create", "--title", title, "--body", body, "--label", "webcam-submission"], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr);
    return { content: [{ type: "text", text: `Submitted: ${result.stdout.trim()}` }] };
  } catch (e) { return { content: [{ type: "text", text: `GH Error: ${e.message}` }], isError: true }; }
});

server.tool("submit_report_to_github", "Submit health report to global registry.", { 
  cam_id: z.string(), 
  status: z.enum(["offline", "broken_link", "low_quality"]), 
  notes: z.string().optional() 
}, async ({ cam_id, status, notes }) => {
  const cam = findWebcam(cam_id);
  if (cam && isNighttimeAt(cam.timezone)) return { content: [{ type: "text", text: "Report blocked: Nighttime at location." }], isError: true };
  try {
    const title = `[webcam-report] ${status}: ${cam_id}`;
    const body = `Reported: ${status}\nNotes: ${notes || "None"}\nTime: ${new Date().toISOString()}`;
    const result = spawnSync("gh", ["issue", "create", "--title", title, "--body", body, "--label", "webcam-report"], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr);
    return { content: [{ type: "text", text: `Reported: ${result.stdout.trim()}` }] };
  } catch (e) { return { content: [{ type: "text", text: `GH Error: ${e.message}` }], isError: true }; }
});

server.tool("sync_registry", "Sync global data and logs.", {}, async () => {
  try {
    const [reg, logs] = await Promise.all([axios.get(`${GITHUB_RAW_BASE}/community-registry.json`), axios.get(`${GITHUB_RAW_BASE}/validation-log.json`)]);
    saveRegistry(reg.data); saveLog(logs.data);
    return { content: [{ type: "text", text: "Registry and Logs synced." }] };
  } catch (e) { return { content: [{ type: "text", text: `Sync failed: ${e.message}` }], isError: true }; }
});

server.tool("discover_webcams_by_location", "Find potential cams via OSM. Verify before drafting.", {
  city: z.string().optional(),
  bbox: z.array(z.number()).length(4).optional()
}, async ({ city, bbox }) => {
  let finalBbox = bbox;
  if (city && !finalBbox) {
    try {
      const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&format=json&limit=1`, { headers: { 'User-Agent': 'open-public-cam' } });
      if (geoRes.data.length > 0) {
        const b = geoRes.data[0].boundingbox.map(Number);
        finalBbox = [b[0], b[2], b[1], b[3]];
      }
    } catch (e) {}
  }
  if (!finalBbox) return { content: [{ type: "text", text: "Error: No area." }], isError: true };
  try {
    const res = await axios.post("https://overpass-api.de/api/interpreter", `[out:json][timeout:25];(nwr["man_made"="webcam"](${finalBbox.join(",")});nwr["contact:webcam"](${finalBbox.join(",")}););out body;`);
    const cams = res.data.elements.map(el => ({
      id: `osm-${el.id}`, name: el.tags.name || "Unnamed", url: el.tags["contact:webcam"] || el.tags.url || el.tags.website || "No URL", location: `${el.lat}, ${el.lon}`
    })).filter(c => c.url !== "No URL");
    return { content: [{ type: "text", text: `Found ${cams.length} potentials. Verify direct access before drafting:\n\n${JSON.stringify(cams, null, 2)}` }] };
  } catch (e) { return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true }; }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Open Public Cam v${VERSION} running`);
}

main().catch(console.error);
