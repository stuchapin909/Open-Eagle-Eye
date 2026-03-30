#!/usr/bin/env node
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const LOG = "/tmp/mcp-test-results.txt";
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
  const msg = d.toString();
  // Server prints "Open Eagle Eye v8.0.0" when ready
  if (msg.includes("Open Eagle Eye")) {
    serverReady = true;
  }
});

proc.stdout.on("data", (d) => {
  buffer += d.toString();
});

function send(msg) {
  proc.stdin.write(JSON.stringify(msg) + "\n");
}

function waitForServer(timeout = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Server never started. STDERR: " + stderr.substring(stderr.length - 300))), timeout);
    const check = setInterval(() => {
      if (serverReady) {
        clearInterval(check);
        clearTimeout(timer);
        resolve();
      }
    }, 200);
  });
}

function readResponse(timeout = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout waiting for response. buffer=" + buffer.substring(0, 200))), timeout);
    const check = setInterval(() => {
      const lines = buffer.split("\n");
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        try {
          const msg = JSON.parse(line);
          buffer = lines.slice(i + 1).join("\n");
          clearInterval(check);
          clearTimeout(timer);
          resolve(msg);
          return;
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
  log("Waiting for server to start...");
  await waitForServer();
  log("Server started. STDERR tail: " + stderr.substring(stderr.length - 200));
  
  // Initialize
  log("--- Initialize ---");
  send({ jsonrpc: "2.0", id: 0, method: "initialize", params: {
    protocolVersion: "2024-11-05", capabilities: {},
    clientInfo: { name: "test", version: "1.0" }
  }});
  const init = await readResponse();
  log("Server: " + (init.result?.serverInfo?.name || "UNKNOWN") + " v" + (init.result?.serverInfo?.version || "?"));
  
  send({ jsonrpc: "2.0", method: "notifications/initialized" });
  await new Promise(r => setTimeout(r, 500));

  // List tools
  log("--- Tools ---");
  send({ jsonrpc: "2.0", id: 0, method: "tools/list", params: {} });
  const tools = await readResponse();
  const names = (tools.result?.tools || []).map(t => t.name);
  log(names.length + " tools: " + names.join(", "));

  // list_cameras
  log("--- list_cameras ---");
  const lc = await callTool("list_cameras", {});
  log("total=" + (lc.total || 0) + " shown=" + (lc.shown || 0));
  if (lc.cameras?.length > 0) {
    log("first: id=" + lc.cameras[0].id + " source=" + lc.cameras[0].source);
  }

  // search_cameras
  log("--- search_cameras ---");
  const sc = await callTool("search_cameras", { query: "Brooklyn Bridge" });
  log("results=" + (sc.total || 0));

  // add_local_camera
  log("--- add_local_camera ---");
  const add = await callTool("add_local_camera", {
    name: "E2E Test Camera", url: "https://picsum.photos/800/600",
    city: "Testville", location: "Testville, Testland",
    timezone: "America/New_York", category: "city", lat: 40.71, lng: -74.01
  });
  log("id=" + (add.id || "?") + " source=" + (add.source || "?") + " success=" + (add.success || false));
  const testId = add.id;

  // list_local
  log("--- list_local ---");
  const ll = await callTool("list_local", {});
  log("total=" + (ll.total || 0) + " found_test=" + (ll.cameras?.some(c => c.id === testId)));

  // get_snapshot (local)
  log("--- get_snapshot (local) ---");
  const snap = await callTool("get_snapshot", { cam_id: testId });
  log("success=" + (snap.success || false) + " path=" + (snap.file_path || "?") + " exists=" + (snap.file_path ? fs.existsSync(snap.file_path) : "?"));

  // Save snapshot path for screenshot
  if (snap.success && snap.file_path) {
    fs.appendFileSync(LOG, "\nSNAPSHOT_PATH_LOCAL:" + snap.file_path + "\n");
  }

  // get_snapshot (upstream)
  log("--- get_snapshot (upstream) ---");
  // Find a real camera
  const upstreamCam = lc.cameras?.find(c => c.source === "upstream" && !c.auth_required && c.id?.startsWith("co-"));
  if (upstreamCam) {
    log("testing: " + upstreamCam.id + " (" + upstreamCam.name + ")");
    const snap2 = await callTool("get_snapshot", { cam_id: upstreamCam.id });
    log("success=" + (snap2.success || false) + " size=" + (snap2.size_bytes || 0) + " path=" + (snap2.file_path || "?"));
    if (snap2.success && snap2.file_path) {
      fs.appendFileSync(LOG, "\nSNAPSHOT_PATH_UPSTREAM:" + snap2.file_path + "\n");
      fs.appendFileSync(LOG, "SNAPSHOT_CAM_NAME:" + upstreamCam.name + "\n");
      fs.appendFileSync(LOG, "SNAPSHOT_CAM_ID:" + upstreamCam.id + "\n");
    }
  }

  // check_config
  log("--- check_config ---");
  const cfg = await callTool("check_config", {});
  log("path=" + (cfg.config_path || "?") + " keys=" + (cfg.api_keys_configured || 0));

  // submit_local (no gh)
  log("--- submit_local ---");
  const sub = await callTool("submit_local", {});
  log("error=" + (sub.error?.substring(0, 60) || sub.success));

  // report_camera (broken_link)
  log("--- report_camera ---");
  const rep = await callTool("report_camera", { cam_id: testId, status: "broken_link", notes: "E2E" });
  log("saved=" + (rep.saved_locally || rep.success || false));

  // Verify auto-removed
  const after = await callTool("list_local", {});
  log("auto-removed=" + !after.cameras?.some(c => c.id === testId));

  // get_snapshot nonexistent
  log("--- get_snapshot nonexistent ---");
  const nope = await callTool("get_snapshot", { cam_id: "nope" });
  log("error=" + (nope.error || false));

  // remove_local (already removed)
  log("--- remove_local ---");
  const rem = await callTool("remove_local", { cam_id: testId });
  log("error=" + (rem.error || "none"));

  // File system
  log("--- Filesystem ---");
  log("cache_dir=" + fs.existsSync(CACHE_DIR));
  log("cameras.json=" + fs.existsSync(path.join(CACHE_DIR, "cameras.json")));
  log("local-cameras.json=" + fs.existsSync(path.join(CACHE_DIR, "local-cameras.json")));
  log("snapshots=" + fs.existsSync(path.join(CACHE_DIR, "snapshots")));
  const sz = fs.statSync(path.join(CACHE_DIR, "cameras.json")).size;
  log("cameras_size=" + (sz / 1024 / 1024).toFixed(1) + "MB");

  log("\nDONE");
  proc.kill();
}

main().catch(e => {
  log("FATAL: " + e.message + "\n" + e.stack);
  log("STDERR: " + stderr.substring(stderr.length - 500));
  proc.kill();
  process.exit(1);
});
