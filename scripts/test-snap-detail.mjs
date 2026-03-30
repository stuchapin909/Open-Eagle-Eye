#!/usr/bin/env node
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const LOG = "/tmp/snapshot-detail.txt";
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
    const timer = setTimeout(() => reject(new Error("timeout. buffer=" + buffer.substring(0, 300))), timeout);
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

function log(msg) {
  fs.appendFileSync(LOG, msg + "\n");
  process.stderr.write(msg + "\n");
}

async function callTool(name, args = {}) {
  send({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } });
  const resp = await readResponse();
  if (resp.error) return { error: resp.error };
  const text = resp.result?.content?.[0]?.text || "";
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function main() {
  log("Starting...");
  await waitForServer();

  // Init
  send({ jsonrpc: "2.0", id: 0, method: "initialize", params: {
    protocolVersion: "2024-11-05", capabilities: {},
    clientInfo: { name: "test", version: "1.0" }
  }});
  await readResponse();
  send({ jsonrpc: "2.0", method: "notifications/initialized" });
  await new Promise(r => setTimeout(r, 500));

  // Add local camera with known-good URL
  log("=== Add local camera ===");
  const add = await callTool("add_local_camera", {
    name: "Snapshot Test", url: "https://picsum.photos/800/600",
    city: "Testville", location: "Testville, Testland",
    timezone: "America/New_York", category: "city"
  });
  log("add result: " + JSON.stringify(add));

  // Snapshot local
  log("\n=== Snapshot local ===");
  const snap1 = await callTool("get_snapshot", { cam_id: add.id });
  log("local snapshot: " + JSON.stringify(snap1, null, 2));
  if (snap1.error) {
    log("ERROR DETAIL: " + JSON.stringify(snap1.error));
  }

  // Find a real upstream camera with image_url
  log("\n=== Find upstream camera ===");
  const lc = await callTool("list_cameras", {});
  // Try to find one that's likely to work - no auth, has url
  const candidates = (lc.cameras || []).filter(c =>
    c.source === "upstream" && !c.auth_required
  );
  log("Total upstream no-auth: " + candidates.length);

  // Try first few
  for (let i = 0; i < Math.min(3, candidates.length); i++) {
    const cam = candidates[i];
    log("\n--- Try cam[" + i + "]: " + cam.id + " (" + cam.name + ") ---");
    const snap = await callTool("get_snapshot", { cam_id: cam.id });
    log("result: " + JSON.stringify(snap));
    if (snap.error) log("  ERROR: " + JSON.stringify(snap.error));
    if (snap.success && snap.file_path && fs.existsSync(snap.file_path)) {
      log("  FILE EXISTS: " + snap.file_path + " (" + fs.statSync(snap.file_path).size + " bytes)");
      // Copy to /tmp for easy access
      const dest = "/tmp/snapshot-" + cam.id.replace(/[^a-zA-Z0-9]/g, "_") + ".jpg";
      fs.copyFileSync(snap.file_path, dest);
      log("  COPIED TO: " + dest);
    }
  }

  // Also try a direct URL
  log("\n=== Snapshot by direct URL ===");
  const snapUrl = await callTool("get_snapshot", { cam_id: "https://picsum.photos/800/600" });
  log("URL snapshot: " + JSON.stringify(snapUrl));
  if (snapUrl.success && snapUrl.file_path && fs.existsSync(snapUrl.file_path)) {
    const dest = "/tmp/snapshot-direct.jpg";
    fs.copyFileSync(snapUrl.file_path, dest);
    log("COPIED TO: " + dest);
  }

  // Check snapshots dir
  log("\n=== Snapshots dir ===");
  const snapDir = path.join(CACHE_DIR, "snapshots");
  log("exists: " + fs.existsSync(snapDir));
  if (fs.existsSync(snapDir)) {
    const files = fs.readdirSync(snapDir);
    log("files: " + files.length);
    files.forEach(f => {
      const fp = path.join(snapDir, f);
      log("  " + f + " (" + fs.statSync(fp).size + " bytes)");
    });
  }

  log("\nDONE");
  proc.kill();
}

main().catch(e => {
  log("FATAL: " + e.message + "\n" + e.stack);
  log("STDERR tail: " + stderr.substring(stderr.length - 500));
  proc.kill();
  process.exit(1);
});
