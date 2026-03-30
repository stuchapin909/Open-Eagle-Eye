#!/usr/bin/env node
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const CACHE_DIR = path.join(os.homedir(), ".openeagleeye");
let buffer = "";
let serverReady = false;
let stderr = "";

const proc = spawn("node", ["index.js"], {
  cwd: new URL(".", import.meta.url).pathname,
  stdio: ["pipe", "pipe", "pipe"]
});

proc.stderr.on("data", (d) => {
  stderr += d.toString();
  if (d.toString().includes("Open Eagle Eye")) serverReady = true;
});
proc.stdout.on("data", (d) => { buffer += d.toString(); });

function send(msg) { proc.stdin.write(JSON.stringify(msg) + "\n"); }
function readResp(timeout = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), timeout);
    const check = setInterval(() => {
      const lines = buffer.split("\n");
      for (let i = 0; i < lines.length - 1; i++) {
        try {
          const msg = JSON.parse(lines[i].trim());
          buffer = lines.slice(i + 1).join("\n");
          clearInterval(check); clearTimeout(timer);
          resolve(msg); return;
        } catch {}
      }
    }, 100);
  });
}

function callTool(name, args) {
  send({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } });
  return readResp();
}

await new Promise(r => {
  const check = setInterval(() => { if (serverReady) { clearInterval(check); r(); } }, 200);
});

// Initialize
send({ jsonrpc: "2.0", id: 0, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1.0" } }});
await readResp();
send({ jsonrpc: "2.0", method: "notifications/initialized" });
await new Promise(r => setTimeout(r, 500));

// get_snapshot on a known-good US camera
const resp = await callTool("get_snapshot", { cam_id: "co-i-70-mp-145-80-eb" });
console.error("SNAPSHOT RESPONSE:", JSON.stringify(resp, null, 2));

// Try list_cameras to find a US camera with a known good URL
const listResp = await callTool("list_cameras", { city: "Eagle" });
console.error("EAGLE CAMERAS:", JSON.stringify(listResp, null, 2).substring(0, 500));

// Try snapshot with direct URL
const resp2 = await callTool("get_snapshot", { cam_id: "https://cocam.carsprogram.org/Snapshots/070E14580CAM1GP2.flv.png" });
console.error("DIRECT URL RESPONSE:", JSON.stringify(resp2, null, 2));

proc.kill();
