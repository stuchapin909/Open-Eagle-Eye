#!/usr/bin/env node
/**
 * update-counts.js — Sync camera counts in README.md and SESSION-SUMMARY.md
 *
 * Reads cameras.json, counts total and per-country, updates docs.
 * Designed to be called by both the parallel validator and the cron job.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAMERAS_PATH = path.join(__dirname, "cameras.json");
const README_PATH = path.join(__dirname, "README.md");
const SUMMARY_PATH = path.join(__dirname, "SESSION-SUMMARY.md");

const cameras = JSON.parse(fs.readFileSync(CAMERAS_PATH, "utf8"));

// Count by country
const countryCounts = {};
for (const c of cameras) {
  const cc = c.country || "??";
  countryCounts[cc] = (countryCounts[cc] || 0) + 1;
}

const total = cameras.length;
const countryNum = Object.keys(countryCounts).length;

// Sort by count descending
const sorted = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]);

// Source details per country (hardcoded from known additions — update when new sources added)
const COUNTRY_SOURCES = {
  US: "NYC DOT, WSDOT, Caltrans CWWP2, CDOT CoTrip, VDOT 511, FDOT FL511, NCDOT, PennDOT 511PA, Arizona ADOT, Oregon ODOT, Nevada NDOT",
  FI: "Digitraffic weather cameras (Fintraffic)",
  CA: "Ontario MTO, Alberta 511",
  HK: "Hong Kong Transport Department",
  UK: "London TfL JamCams",
  NZ: "NZTA nationwide highways",
  AU: "Sydney metro, Regional NSW",
  BR: "CET Sao Paulo urban traffic",
  JP: "NEXCO East expressways",
  SG: "Singapore LTA",
  IE: "TII motorway cams (M50 Dublin)",
};

// Number word
function numWord(n) {
  const words = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen"];
  return words[n] || String(n);
}

console.log(`Registry: ${total} cameras across ${countryNum} countries`);

// --- Update README.md ---
let readme = fs.readFileSync(README_PATH, "utf8");

// Update top-line count: **22,999 cameras** across eleven countries:
readme = readme.replace(
  /\*\*[\d,]+ cameras\*\* across \w+ countries:/,
  `**${total.toLocaleString()} cameras** across ${numWord(countryNum)} countries:`
);

// Update per-country lines: "- US: 17,181 (sources)"
const countryLinePattern = /^- ([A-Z]{2}): \d[\d,]+/gm;
const newCountryLines = sorted.map(([cc, count]) => {
  const sources = COUNTRY_SOURCES[cc] || "";
  const paren = sources ? ` (${sources})` : "";
  return `- ${cc}: ${count.toLocaleString()}${paren}`;
}).join("\n");

// Find the country list block (starts with "- US:" or first "- XX:")
const countryListMatch = readme.match(/(^[ \t]*-[ \t]+[A-Z]{2}: \d[\d,]+[\s\S]*?)(\n^[ \t]*(?:- [A-Z]|\n##|\n\n))/m);
if (countryListMatch) {
  readme = readme.replace(countryListMatch[1].trimEnd(), newCountryLines);
} else {
  console.log("WARNING: Could not find country list in README.md");
}

fs.writeFileSync(README_PATH, readme);
console.log("Updated README.md");

// --- Update SESSION-SUMMARY.md ---
let summary = fs.readFileSync(SUMMARY_PATH, "utf8");

// Update header count: ## Current Registry: 22,999 cameras across 11 countries
summary = summary.replace(
  /## Current Registry: \d[\d,]+ cameras across \d+ countries/,
  `## Current Registry: ${total.toLocaleString()} cameras across ${countryNum} countries`
);

// Rebuild the country table
const tableHeader = "| Country | Count | Sources |";
const tableSeparator = "|---------|-------|---------|";

const tableRows = sorted.map(([cc, count]) => {
  const sources = COUNTRY_SOURCES[cc] || "unknown";
  return `| ${cc} | ${count.toLocaleString()} | ${sources} |`;
}).join("\n");

// Find existing table and replace it
const tablePattern = new RegExp(
  `(${tableHeader.replace(/[|]/g, '\\|')}\\n${tableSeparator.replace(/[|]/g, '\\|')}\\n)([\\s\\S]*?)(\\n\\n|\\n##)`,
  "m"
);
const tableMatch = summary.match(tablePattern);
if (tableMatch) {
  summary = summary.replace(tablePattern, `$1${tableRows}$3`);
} else {
  console.log("WARNING: Could not find country table in SESSION-SUMMARY.md");
}

// Also update any "## Key files" section that mentions the count
summary = summary.replace(
  /cameras\.json.*?(\d[\d,]+)( entries| cameras)/g,
  (match, count, suffix) => match.replace(count, total.toLocaleString())
);
summary = summary.replace(
  /cameras\.json.*?~[\d.]+MB/g,
  (match) => {
    const sizeMB = (fs.statSync(CAMERAS_PATH).size / (1024 * 1024)).toFixed(1);
    return `cameras.json — The registry (~${sizeMB}MB, ${total.toLocaleString()} entries, JSON array)`;
  }
);

fs.writeFileSync(SUMMARY_PATH, summary);
console.log("Updated SESSION-SUMMARY.md");

console.log(`\nDone. ${total.toLocaleString()} cameras across ${countryNum} countries.`);
