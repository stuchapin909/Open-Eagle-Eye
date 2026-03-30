#!/usr/bin/env node
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const LOG = "/tmp/snap-extras.txt";
const CACHE_DIR = path.join(os.homedir(), ".openeagleeye");

const proc = spawn("node", ["index.js"], {
  cwd: new URL(".", import.meta.url).pathname,
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env }
});

let stderr = "";
let serverReady = false;
let buffer = "";

proc.stderr.on("data", (d) => {
  stderr += d.toString();
  if (d.toString().includes("Open Eagle Eye")) serverReady = true;
});
proc.stdout.on("data", (d) => { buffer += d.toString(); });

function send(msg) { proc.stdin.write(JSON.stringify(msg) + "\n"); }

function waitForServer(timeout = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), timeout);
    const check = setInterval(() => {
      if (serverReady) { clearInterval(check); clearTimeout(timer); resolve(); }
    }, 200);
  });
}

function readResponse(timeout = 20000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), timeout);
    const check = setInterval(() => {
      const lines = buffer.split("\n");
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        try {
          const msg = JSON.parse(line);
          buffer = lines.slice(i + 1).join("\n");
          clearInterval(check); clearTimeout(timer);
          resolve(msg); return;
        } catch {}
      }
    }, 100);
  });
}

function log(msg) { fs.appendFileSync(LOG, msg + "\n"); process.stderr.write(msg + "\n"); }

async function callTool(name, args = {}) {
  send({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } });
  const resp = await readResponse();
  if (resp.error) return { error: resp.error };
  const text = resp.result?.content?.[0]?.text || "";
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function main() {
  await waitForServer();
  send({ jsonrpc: "2.0", id: 0, method: "initialize", params: {
    protocolVersion: "2024-11-05", capabilities: {},
    clientInfo: { name: "test", version: "1.0" }
  }});
  await readResponse();
  send({ jsonrpc: "2.0", method: "notifications/initialized" });
  await new Promise(r => setTimeout(r, 500));

  // Get cameras and find non-TFL ones in various cities
  const lc = await callTool("list_cameras", {});
  const all = lc.cameras || [];

  // Find diverse cameras: not TFL, no auth
  const nonTFL = all.filter(c => !c.id.startsWith("tfl-") && !c.auth_required);
  log("Non-TFL no-auth cameras: " + nonTFL.length);

  // Try cameras from different cities
  const cities = [...new Set(nonTFL.map(c => c.city).filter(Boolean))];
  log("Cities: " + cities.slice(0, 20).join(", "));

  // Pick first non-TFL camera from a few cities
  const targets = [];
  const seenCities = new Set();
  for (const cam of nonTFL) {
    if (cam.city && !seenCities.has(cam.city) && targets.length < 4) {
      targets.push(cam);
      seenCities.add(cam.city);
    }
  }
  log("Targets: " + targets.map(c => c.id + " (" + c.city + " - " + c.name + ")").join("\n"));

  for (const cam of targets) {
    log("\n--- " + cam.id + " ---");
    const snap = await callTool("get_snapshot", { cam_id: cam.id });
    log("result: " + JSON.stringify(snap));
    if (snap.success && snap.file_path && fs.existsSync(snap.file_path)) {
      const safeName = (cam.city || "unknown").replace(/[^a-zA-Z0-9]/g, "_") + "_" + cam.id.replace(/[^a-zA-Z0-9]/g, "_");
      const dest = "/tmp/cam-" + safeName + ".jpg";
      fs.copyFileSync(snap.file_path, dest);
      log("COPIED: " + dest + " (" + fs.statSync(dest).size + " bytes)");
    }
  }

  log("\nDONE");
  proc.kill();
}

main().catch(e => {
  log("FATAL: " + e.message);
  proc.kill();
  process.exit(1);
});
