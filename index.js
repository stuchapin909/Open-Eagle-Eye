#!/usr/bin/env node
/**
 * Open Eagle Eye — Bootstrap
 *
 * Fetches the latest camera registry from GitHub on startup.
 * Falls back to bundled version if GitHub is unreachable.
 * Camera data is cached in ~/.openeagleeye/
 */

import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";

const CACHE_DIR = path.join(os.homedir(), ".openeagleeye");
const GITHUB_RAW = "https://raw.githubusercontent.com/stuchapin909/Open-Eagle-Eye/master";

fs.mkdirSync(CACHE_DIR, { recursive: true });

async function fetchFile(remotePath) {
  const resp = await axios.get(`${GITHUB_RAW}/${remotePath}`, {
    timeout: 15000,
    responseType: "text",
    headers: {
      "User-Agent": "openeagleeye-bootstrap",
      "Accept": "application/json, text/plain, */*",
    },
    maxRedirects: 1,
  });
  return resp.data;
}

async function syncFile(remotePath, localPath) {
  try {
    const content = await fetchFile(remotePath);
    fs.writeFileSync(localPath, content);
    return "updated";
  } catch (e) {
    return "fallback";
  }
}

async function bootstrap() {
  console.error("[bootstrap] Syncing camera data from GitHub...");

  const camerasCache = path.join(CACHE_DIR, "cameras.json");
  const stateCache = path.join(CACHE_DIR, ".registry-state.json");

  const camerasResult = await syncFile("cameras.json", camerasCache);
  if (camerasResult === "updated") {
    console.error("  [+] cameras.json — updated");
  } else {
    console.error("  [=] cameras.json — using cached (GitHub unreachable)");
  }

  const stateResult = await syncFile(".registry-state.json", stateCache);
  if (stateResult === "updated") {
    console.error("  [+] .registry-state.json — updated");
  } else {
    console.error("  [-] .registry-state.json — skipped");
  }

  console.error("[bootstrap] Starting server...");
}

await bootstrap();
await import("./server.js");
