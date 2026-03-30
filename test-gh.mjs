#!/usr/bin/env node
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const LOG = "/tmp/gh-test-results.txt";
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

function readResponse(timeout = 30000) {
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

function log(msg) { fs.appendFileSync(LOG, msg + "\n"); process.stderr.write(msg + "\n"); }

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

  // 1. Add a test camera to submit
  log("=== TEST: submit_local ===");
  const add = await callTool("add_local_camera", {
    name: "E2E Submit Test Camera",
    url: "https://picsum.photos/800/600",
    city: "Testville",
    location: "Testville, Testland",
    timezone: "America/New_York",
    category: "city",
    lat: 40.71, lng: -74.01
  });
  log("Added camera: " + add.id);

  // submit_local
  log("Calling submit_local...");
  const sub = await callTool("submit_local", {});
  log("submit_local result: " + JSON.stringify(sub, null, 2));

  // 2. Add another camera to report
  log("\n=== TEST: report_camera ===");
  const add2 = await callTool("add_local_camera", {
    name: "E2E Report Test Camera",
    url: "https://example.com/broken-cam.jpg",
    city: "Nowhere",
    location: "Nowhere, Null Island",
    timezone: "UTC",
    category: "other"
  });
  log("Added camera for report: " + add2.id);

  // report_camera with broken_link status
  log("Calling report_camera...");
  const rep = await callTool("report_camera", {
    cam_id: add2.id,
    status: "broken_link",
    notes: "E2E test report — this is a fake URL for testing purposes"
  });
  log("report_camera result: " + JSON.stringify(rep, null, 2));

  log("\nDONE");
  proc.kill();
}

main().catch(e => {
  log("FATAL: " + e.message + "\n" + e.stack);
  log("STDERR tail: " + stderr.substring(stderr.length - 500));
  proc.kill();
  process.exit(1);
});
