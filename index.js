#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";

import { chromium } from "playwright-chromium";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = path.join(__dirname, "community-registry.json");
const LOG_PATH = path.join(__dirname, "validation-log.json");

const server = new McpServer({
  name: "open-public-cam",
  version: "1.2.0",
});

// Cache for Discovery (to be a good API citizen)
const discoverCache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

const WEBCAMS = [
  {
    id: "times-square",
    name: "Times Square, New York City",
    url: "https://www.earthcam.com/usa/newyork/timessquare/?cam=tsstreet",
    access_strategy: {
      type: "browser_capture",
      selector: "video",
      wait_for_ms: 5000
    },
    category: "city",
    location: "New York, USA",
    verified: true
  },
  {
    id: "abbey-road",
    name: "Abbey Road Crossing, London",
    url: "https://www.abbeyroad.com/crossing",
    access_strategy: {
      type: "browser_capture",
      selector: "video",
      wait_for_ms: 3000
    },
    category: "landmark",
    location: "London, UK",
    verified: true
  },
  {
    id: "venice-grand-canal",
    name: "Venice Grand Canal",
    url: "https://www.skylinewebcams.com/en/webcam/italia/veneto/venezia/canal-grande-rialto.html",
    access_strategy: {
      type: "browser_capture",
      selector: "video",
      wait_for_ms: 4000
    },
    category: "city",
    location: "Venice, Italy",
    verified: true
  }
];

// Helper to load community data
const getCommunityData = () => {
  try {
    const data = fs.readFileSync(REGISTRY_PATH, "utf8");
    return JSON.parse(data);
  } catch (e) { return []; }
};

const getValidationLog = () => {
  try {
    const data = fs.readFileSync(LOG_PATH, "utf8");
    return JSON.parse(data);
  } catch (e) { return {}; }
};

server.tool(
  "report_webcam_status",
  "Allow agents to provide feedback or report issues with a webcam (e.g. offline, blurry, redirected)",
  {
    cam_id: z.string().describe("The ID or URL of the webcam"),
    status: z.enum(["active", "offline", "low_quality", "obstructed", "broken_link"]).describe("Current status"),
    notes: z.string().optional().describe("Additional details (e.g. 'Site has an ad overlay')")
  },
  async ({ cam_id, status, notes }) => {
    const logs = getValidationLog();
    logs[cam_id] = {
      status,
      notes,
      timestamp: new Date().toISOString(),
      reported_by: "agent"
    };
    fs.writeFileSync(LOG_PATH, JSON.stringify(logs, null, 2));
    return {
      content: [{ type: "text", text: `Feedback received for ${cam_id}. Community validation log updated.` }]
    };
  }
);

server.tool(
  "submit_webcam",
  "Allow agents to contribute a new public webcam they've discovered to the community registry",
  {
    name: z.string().describe("Descriptive name of the webcam"),
    url: z.string().url().describe("The public URL of the feed or page"),
    location: z.string().describe("City, Country"),
    category: z.string().optional().describe("e.g. 'city', 'nature', 'traffic'")
  },
  async ({ name, url, location, category }) => {
    const community = getCommunityData();
    const newCam = {
      id: `comm-${Date.now()}`,
      name,
      url,
      location,
      category: category || "uncategorized",
      verified: false,
      submitted_at: new Date().toISOString()
    };
    community.push(newCam);
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(community, null, 2));
    return {
      content: [{ type: "text", text: `Webcam '${name}' added to the community registry for validation.` }]
    };
  }
);

server.tool(
  "get_webcam_snapshot",
  "Captures a live snapshot image from a webcam URL using a headless browser",
  {
    url: z.string().describe("The URL of the webcam page"),
    selector: z.string().optional().default("video").describe("CSS selector for the video/image element to capture"),
    wait_ms: z.number().optional().default(5000).describe("Milliseconds to wait for the feed to load (default 5000)")
  },
  async ({ url, selector, wait_ms }) => {
    // Check validation log first
    const logs = getValidationLog();
    if (logs[url] && logs[url].status === "offline") {
      console.error(`Warning: This cam was recently reported as offline (${logs[url].timestamp})`);
    }

    let browser;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 }
      });
      const page = await context.newPage();
      
      // Navigate with a more lenient wait condition
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      // Additional wait for the player JS to start loading
      await page.waitForTimeout(2000);

      // Wait for the specified element (video or image)
      try {
        await page.waitForSelector(selector, { timeout: 15000 });
      } catch (e) {
        // Fallback: try common selectors if the specified one fails
        try {
          await page.waitForSelector('video, img, canvas', { timeout: 5000 });
        } catch (e2) {
          console.error("No player elements found within 15s");
        }
      }

      // Additional wait for the stream to actually start
      await page.waitForTimeout(wait_ms);

      // Take a screenshot of the specific element or the whole page if element capture fails
      let buffer;
      try {
        const element = await page.$(selector) || await page.$('video') || await page.$('img');
        if (element) {
          buffer = await element.screenshot({ type: 'jpeg', quality: 80 });
        } else {
          buffer = await page.screenshot({ type: 'jpeg', quality: 80 });
        }
      } catch (e) {
        buffer = await page.screenshot({ type: 'jpeg', quality: 80 });
      }

      const base64Image = buffer.toString('base64');

      return {
        content: [
          {
            type: "text",
            text: `Successfully captured snapshot from ${url}. Providing image data below.`,
          },
          {
            type: "image",
            data: base64Image,
            mimeType: "image/jpeg"
          }
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error capturing snapshot: ${error.message}` }],
        isError: true
      };
    } finally {
      if (browser) await browser.close();
    }
  }
);

server.tool(
  "list_webcams",
  "Lists famous and community-submitted publicly accessible webcams",
  {},
  async () => {
    const community = getCommunityData();
    const logs = getValidationLog();
    
    // Merge and enrich with status
    const allCams = [...WEBCAMS, ...community].map(cam => ({
      ...cam,
      current_status: logs[cam.id] || logs[cam.url] || { status: "unknown" }
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(allCams, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "search_webcams",
  "Search for webcams in the global curated and community list",
  {
    query: z.string().describe("Search term (e.g. 'London', 'city')")
  },
  async ({ query }) => {
    const community = getCommunityData();
    const all = [...WEBCAMS, ...community];
    const results = all.filter(cam => 
      cam.name.toLowerCase().includes(query.toLowerCase()) || 
      cam.location.toLowerCase().includes(query.toLowerCase()) ||
      (cam.category && cam.category.toLowerCase().includes(query.toLowerCase()))
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "discover_webcams_by_location",
  "Discover webcams in a specific area using OpenStreetMap data (Cached for performance)",
  {
    city: z.string().optional().describe("City name (e.g. 'Paris')"),
    bbox: z.array(z.number()).length(4).optional().describe("Bounding box [min_lat, min_lon, max_lat, max_lon]")
  },
  async ({ city, bbox }) => {
    const cacheKey = city || JSON.stringify(bbox);
    if (discoverCache.has(cacheKey)) {
      const entry = discoverCache.get(cacheKey);
      if (Date.now() - entry.timestamp < CACHE_TTL) {
        return { content: [{ type: "text", text: `(Cached) Found ${entry.data.length} webcams:\n${JSON.stringify(entry.data, null, 2)}` }] };
      }
    }

    let finalBbox = bbox;

    if (city && !finalBbox) {
      try {
        const geoUrl = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&format=json&limit=1`;
        const geoRes = await axios.get(geoUrl, {
          headers: { 'User-Agent': 'open-public-cam (public repo)' }
        });
        
        if (geoRes.data.length > 0) {
          const place = geoRes.data[0];
          const b = place.boundingbox.map(Number);
          finalBbox = [b[0], b[2], b[1], b[3]];
        }
      } catch (e) {
        console.error("Geocoding error:", e.message);
      }
    }

    if (!finalBbox) {
      return {
        content: [{ type: "text", text: "Error: Could not determine bounding box for the area." }],
        isError: true
      };
    }

    const overpassQuery = `
      [out:json][timeout:25];
      (
        nwr["man_made"="surveillance"]["surveillance"="webcam"](${finalBbox.join(",")});
        nwr["contact:webcam"](${finalBbox.join(",")});
        nwr["man_made"="webcam"](${finalBbox.join(",")});
      );
      out body;
    `;

    try {
      const overpassUrl = "https://overpass-api.de/api/interpreter";
      const res = await axios.post(overpassUrl, overpassQuery);
      
      const cameras = res.data.elements.map(el => ({
        id: el.id,
        name: el.tags.name || el.tags.description || "Unnamed Webcam",
        url: el.tags["contact:webcam"] || el.tags.url || el.tags.website || "No URL provided",
        location: `${el.lat}, ${el.lon}`,
        tags: el.tags
      })).filter(cam => cam.url !== "No URL provided");

      discoverCache.set(cacheKey, { timestamp: Date.now(), data: cameras });

      return {
        content: [
          {
            type: "text",
            text: `Found ${cameras.length} webcams in the area:\n${JSON.stringify(cameras, null, 2)}`,
          },
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Overpass API error: ${e.message}` }],
        isError: true
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Webcam MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
