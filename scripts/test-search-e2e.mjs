#!/usr/bin/env node
import { spawn } from "child_process";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const LOG = "/tmp/e2e-search.txt";
const proc = spawn("node", ["server.js"], {
  cwd: new URL(".", import.meta.url).pathname,
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env }
});

let stderr = "", serverReady = false, buffer = "";
proc.stderr.on("data", (d) => { stderr += d.toString(); if (d.toString().includes("Open Eagle Eye")) serverReady = true; });
proc.stdout.on("data", (d) => { buffer += d.toString(); });
function send(msg) { proc.stdin.write(JSON.stringify(msg) + "\n"); }
function waitForServer(timeout = 30000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), timeout);
    const c = setInterval(() => { if (serverReady) { clearInterval(c); clearTimeout(t); resolve(); } }, 200);
  });
}
function readResponse(timeout = 60000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), timeout);
    const c = setInterval(() => {
      const lines = buffer.split("\n");
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        try { const msg = JSON.parse(line); buffer = lines.slice(i + 1).join("\n"); clearInterval(c); clearTimeout(t); resolve(msg); return; } catch {}
      }
    }, 100);
  });
}
function log(msg) { fs.appendFileSync(LOG, msg + "\n"); process.stderr.write(msg + "\n"); }
let pass = 0, fail = 0;
function assert(name, cond) { if (cond) { pass++; log("  PASS " + name); } else { fail++; log("  FAIL " + name); } }
async function callTool(name, args = {}) {
  send({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } });
  const resp = await readResponse();
  if (resp.error) return { error: resp.error };
  const text = resp.result?.content?.[0]?.text || "";
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function main() {
  log("=== E2E Test — Search & Discovery Upgrades ===\n");
  await waitForServer();
  send({ jsonrpc: "2.0", id: 0, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "1.0" } } });
  await readResponse();
  send({ jsonrpc: "2.0", method: "notifications/initialized" });
  await new Promise(r => setTimeout(r, 500));

  // Tool count
  log("--- Tool Count ---");
  send({ jsonrpc: "2.0", id: 0, method: "tools/list", params: {} });
  const tools = await readResponse();
  const names = (tools.result?.tools || []).map(t => t.name);
  assert("13 tools present", names.length === 13);
  const expected = ["get_snapshot", "get_snapshots", "list_cameras", "search_cameras", "nearby_cameras", "explore_cameras", "get_camera_info", "add_local_camera", "list_local", "remove_local", "submit_local", "report_camera", "check_config"];
  for (const n of expected) assert(`has ${n}`, names.includes(n));

  // === list_cameras: pagination ===
  log("\n--- list_cameras: Pagination ---");
  const page1 = await callTool("list_cameras", { limit: 5, offset: 0 });
  assert("page1 has 5 cameras", page1.cameras?.length === 5);
  assert("page1 offset=0", page1.offset === 0);
  assert("page1 limit=5", page1.limit === 5);
  assert("page1 has total", page1.total > 0);
  assert("page1 has filtered", page1.filtered != null);
  const page2 = await callTool("list_cameras", { limit: 5, offset: 5 });
  assert("page2 has 5 cameras", page2.cameras?.length === 5);
  assert("page1 and page2 have different first IDs", page1.cameras[0].id !== page2.cameras[0].id);

  // === list_cameras: country filter ===
  log("\n--- list_cameras: Country Filter ---");
  const us = await callTool("list_cameras", { country: "US", limit: 5 });
  assert("US returns cameras", (us.cameras?.length || 0) > 0);
  assert("US cameras have country field", us.cameras?.[0]?.country != null);
  assert("US filtered < total", (us.filtered || 0) < (us.total || 0));
  const jp = await callTool("list_cameras", { country: "JP", limit: 5 });
  assert("JP returns cameras", (jp.cameras?.length || 0) > 0);

  // === search_cameras: city and country ===
  log("\n--- search_cameras: City & Country Search ---");
  const citySearch = await callTool("search_cameras", { query: "Sydney" });
  assert("search 'Sydney' finds results", (citySearch.total || 0) > 0);
  // At least some should have city=Sydney
  const sydneyCams = citySearch.cameras?.filter(c => c.city?.toLowerCase() === "sydney") || [];
  assert("some results have city=Sydney", sydneyCams.length > 0);
  const countrySearch = await callTool("search_cameras", { query: "Australia" });
  assert("search 'Australia' finds results", (countrySearch.total || 0) > 0);
  // Search with limit
  const limited = await callTool("search_cameras", { query: "London", limit: 3 });
  assert("limited search returns <= 3", (limited.returned || 0) <= 3);
  assert("limited search has total > returned", (limited.total || 0) >= (limited.returned || 0));

  // === get_camera_info ===
  log("\n--- get_camera_info ---");
  // Use a known ID from page1
  const knownId = page1.cameras[0].id;
  const info = await callTool("get_camera_info", { cam_id: knownId });
  assert("get_camera_info returns data", !!info.id);
  assert("id matches", info.id === knownId);
  assert("has name", !!info.name);
  assert("has url", !!info.url);
  assert("has country field", info.country != null);
  const noInfo = await callTool("get_camera_info", { cam_id: "nonexistent-cam-xyz" });
  assert("nonexistent returns error", noInfo.error === "Camera not found");

  // === nearby_cameras ===
  log("\n--- nearby_cameras (Geographic Search) ---");
  // Times Square: 40.758, -73.985
  const nearby = await callTool("nearby_cameras", { lat: 40.758, lng: -73.985, radius_km: 5, limit: 5 });
  log("  Times Square nearby: " + (nearby.total || 0) + " cameras");
  assert("nearby returns results", (nearby.total || 0) > 0);
  assert("nearby has distance_km field", nearby.cameras?.[0]?.distance_km != null);
  assert("results are sorted by distance", nearby.cameras?.every((c, i) => i === 0 || c.distance_km >= nearby.cameras[i-1].distance_km));
  assert("all within radius", nearby.cameras?.every(c => c.distance_km <= 5));

  // Sydney Opera House: -33.8568, 151.2153
  const sydneyNear = await callTool("nearby_cameras", { lat: -33.8568, lng: 151.2153, radius_km: 10 });
  assert("Sydney nearby returns results", (sydneyNear.total || 0) > 0);

  // Category filter with geo
  const highwayNear = await callTool("nearby_cameras", { lat: 40.758, lng: -73.985, radius_km: 50, category: "highway" });
  assert("nearby with category filter works", highwayNear.cameras !== undefined);

  // === explore_cameras ===
  log("\n--- explore_cameras (Random Discovery) ---");
  const explore1 = await callTool("explore_cameras", { count: 3 });
  assert("explore returns 3 cameras", explore1.cameras?.length === 3);
  assert("has pool_size", explore1.pool_size > 0);
  const explore2 = await callTool("explore_cameras", { country: "JP", count: 2 });
  assert("explore JP returns 2", explore2.cameras?.length === 2);
  const explore3 = await callTool("explore_cameras", { category: "highway", count: 2 });
  assert("explore highway returns 2", explore3.cameras?.length === 2);
  // Verify randomness — two calls should likely give different results
  const explore4 = await callTool("explore_cameras", { count: 3 });
  const ids1 = explore1.cameras.map(c => c.id).sort();
  const ids4 = explore4.cameras.map(c => c.id).sort();
  assert("random calls give different results", JSON.stringify(ids1) !== JSON.stringify(ids4));

  // === get_snapshots (batch) ===
  log("\n--- get_snapshots (Batch) ---");
  const batchIds = [page1.cameras[0].id, page1.cameras[1].id, page1.cameras[2].id];
  const batch = await callTool("get_snapshots", { cam_ids: batchIds });
  assert("batch has requested count", batch.requested === 3);
  assert("batch has succeeded field", batch.succeeded != null);
  assert("batch has failed field", batch.failed != null);
  assert("batch has snapshots array", Array.isArray(batch.snapshots));
  assert("snapshots has 3 entries", batch.snapshots?.length === 3);
  // Check that at least some succeeded
  const successes = batch.snapshots?.filter(s => s.success) || [];
  assert("at least 1 snapshot succeeded", successes.length >= 1);
  if (successes.length > 0) {
    assert("snapshot has file_path", !!successes[0].file_path);
    assert("file exists on disk", fs.existsSync(successes[0].file_path));
    assert("has size_bytes", successes[0].size_bytes > 0);
  }

  // Batch with nonexistent ID
  const batchMixed = await callTool("get_snapshots", { cam_ids: [page1.cameras[0].id, "fake-id-123"] });
  assert("mixed batch has 2 requested", batchMixed.requested === 2);
  const mixedSuccess = batchMixed.snapshots?.filter(s => s.success).length || 0;
  const mixedFail = batchMixed.snapshots?.filter(s => s.error).length || 0;
  assert("mixed batch: 1 success + 1 fail", mixedSuccess >= 1 && mixedFail >= 1);

  // === SUMMARY ===
  log("\n========================================");
  log("RESULTS: " + pass + " passed, " + fail + " failed");
  log("========================================\n");
  proc.kill();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => {
  log("FATAL: " + e.message + "\n" + e.stack);
  log("STDERR: " + stderr.substring(stderr.length - 500));
  proc.kill();
  process.exit(1);
});
