import fs from "fs";
import { execSync } from "child_process";

// Download GeoJSON
const url = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";
execSync(`curl -s -L --max-time 15 "${url}" -o /tmp/world.geo.json`, { stdio: "pipe" });
const geo = JSON.parse(fs.readFileSync("/tmp/world.geo.json", "utf8"));

const cameras = JSON.parse(fs.readFileSync("/root/projects/open-public-cam/cameras.json", "utf8"));

const WIDTH = 1000;
const HEIGHT = 500;
const PADDING = 40;

function project(lat, lng) {
  const x = ((lng + 180) / 360) * (WIDTH - 2 * PADDING) + PADDING;
  const y = ((90 - lat) / 180) * (HEIGHT - 2 * PADDING) + PADDING;
  return [x, y];
}

// Build land mass paths with aggressive simplification
function processRing(ring) {
  const simplified = [ring[0]];
  for (let i = 1; i < ring.length - 1; i++) {
    const prev = simplified[simplified.length - 1];
    const dx = Math.abs(ring[i][0] - prev[0]);
    const dy = Math.abs(ring[i][1] - prev[1]);
    // 1.5 degree minimum distance = ~150km, good for background map
    if (dx > 1.5 || dy > 1.5) {
      simplified.push(ring[i]);
    }
  }
  simplified.push(ring[ring.length - 1]);
  
  let d = "";
  for (let i = 0; i < simplified.length; i++) {
    const [lng, lat] = simplified[i];
    const [x, y] = project(lat, lng);
    d += (i === 0 ? "M" : "L") + `${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d + "Z";
}

const landPaths = [];
for (const feature of geo.features) {
  if (feature.geometry.type === "Polygon") {
    landPaths.push(processRing(feature.geometry.coordinates[0]));
  } else if (feature.geometry.type === "MultiPolygon") {
    for (const polygon of feature.geometry.coordinates) {
      landPaths.push(processRing(polygon[0]));
    }
  }
}

const landPathStr = landPaths.join(" ");
console.log("Land paths:", landPaths.length, "combined:", landPathStr.length, "chars");

// Country data for camera dots
const countryData = {
  US: { lat: 39.8, lng: -98.5, labelDx: 45, labelDy: 5 },
  CA: { lat: 56.0, lng: -106.0, labelDx: 0, labelDy: 24 },
  FI: { lat: 64.0, lng: 26.0, labelDx: 0, labelDy: 22 },
  GB: { lat: 54.0, lng: -2.0, labelDx: 0, labelDy: -20 },
  IE: { lat: 53.3, lng: -10.0, labelDx: -30, labelDy: -14 },
  HK: { lat: 22.3, lng: 114.2, labelDx: 0, labelDy: -20 },
  SG: { lat: 1.3, lng: 103.8, labelDx: 0, labelDy: 20 },
  JP: { lat: 36.0, lng: 138.0, labelDx: 0, labelDy: 22 },
  AU: { lat: -25.0, lng: 134.0, labelDx: 0, labelDy: 0 },
  NZ: { lat: -41.0, lng: 174.0, labelDx: 0, labelDy: 22 },
  BR: { lat: -15.0, lng: -47.0, labelDx: 0, labelDy: 0 },
};

const colors = {
  US: "#3B82F6", CA: "#EF4444", FI: "#8B5CF6", GB: "#10B981",
  IE: "#14B8A6", HK: "#F59E0B", SG: "#A855F7", JP: "#EC4899",
  AU: "#F97316", NZ: "#06B6D4", BR: "#22C55E",
};

const counts = {};
cameras.forEach(c => { counts[c.country] = (counts[c.country] || 0) + 1; });

function radius(count) {
  return Math.max(3, Math.log10(count + 1) * 7);
}

// Build SVG
let svg = '';
svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">\n`;
svg += `  <rect width="${WIDTH}" height="${HEIGHT}" fill="#0F172A" rx="12"/>\n`;

// Land masses
svg += `  <path d="${landPathStr}" fill="#1E293B" stroke="none"/>\n`;

// Defs for glow
svg += `  <defs>\n`;
svg += `    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">\n`;
svg += `      <feGaussianBlur stdDeviation="4" result="blur"/>\n`;
svg += `      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>\n`;
svg += `    </filter>\n`;
svg += `  </defs>\n`;

// Camera dots (sorted by count, largest first)
const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

sorted.forEach(([country, count]) => {
  const d = countryData[country];
  if (!d) return;
  const [x, y] = project(d.lat, d.lng);
  const r = radius(count);
  const color = colors[country] || "#64748B";

  // Glow
  svg += `  <circle cx="${x}" cy="${y}" r="${r + 3}" fill="${color}" opacity="0.15"/>\n`;
  // Dot
  svg += `  <circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="0.85" filter="url(#glow)"/>\n`;
  
  // Label
  const lx = x + (d.labelDx || 0);
  const ly = y - r - 5 + (d.labelDy || 0);
  const label = `${country} ${count.toLocaleString()}`;
  const anchor = (d.labelDx > 20) ? "start" : ((d.labelDx < -20) ? "end" : "middle");
  svg += `  <text x="${lx}" y="${ly}" text-anchor="${anchor}" fill="#CBD5E1" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="500">${label}</text>\n`;
});

// Title
svg += `  <text x="${WIDTH / 2}" y="24" text-anchor="middle" fill="#F1F5F9" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" letter-spacing="0.5">Open Eagle Eye -- Global Camera Coverage</text>\n`;

// Subtitle
const total = cameras.length;
const numCountries = Object.keys(counts).length;
svg += `  <text x="${WIDTH / 2}" y="${HEIGHT - 10}" text-anchor="middle" fill="#64748B" font-family="system-ui, -apple-system, sans-serif" font-size="11">${total.toLocaleString()} cameras across ${numCountries} countries</text>\n`;

svg += `</svg>`;

fs.writeFileSync("/root/projects/open-public-cam/docs/coverage-map.svg", svg);
const size = fs.statSync("/root/projects/open-public-cam/docs/coverage-map.svg").size;
console.log("Wrote coverage-map.svg:", size, "bytes");
