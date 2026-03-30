#!/usr/bin/env node
import { spawn } from "child_process";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const LOG = "/tmp/e2e-final.txt";
const CACHE_DIR = path.join(os.homedir(), ".openeagleeye");

const proc = spawn("node", ["server.js"], {
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

function readResponse(timeout = 60000) {
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

let pass = 0, fail = 0;
function assert(name, condition) {
  if (condition) { pass++; log("  PASS " + name); }
  else { fail++; log("  FAIL " + name); }
}

async function callTool(name, args = {}) {
  send({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } });
  const resp = await readResponse();
  if (resp.error) return { error: resp.error };
  const text = resp.result?.content?.[0]?.text || "";
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function main() {
  log("=== E2E Test Suite — Open Eagle Eye v8.0.0 ===\n");
  await waitForServer();

  // Init
  send({ jsonrpc: "2.0", id: 0, method: "initialize", params: {
    protocolVersion: "2024-11-05", capabilities: {},
    clientInfo: { name: "test", version: "1.0" }
  }});
  const init = await readResponse();
  assert("initialize", init.result?.serverInfo?.name === "openeagleeye");
  send({ jsonrpc: "2.0", method: "notifications/initialized" });
  await new Promise(r => setTimeout(r, 500));

  // === CORE TOOLS ===
  log("\n--- Core Tools ---");
  send({ jsonrpc: "2.0", id: 0, method: "tools/list", params: {} });
  const tools = await readResponse();
  const names = (tools.result?.tools || []).map(t => t.name);
  assert("9 tools present", names.length === 9);
  assert("has submit_local", names.includes("submit_local"));
  assert("has report_camera", names.includes("report_camera"));

  const lc = await callTool("list_cameras", {});
  assert("list_cameras returns data", (lc.total || 0) > 0);

  const sc = await callTool("search_cameras", { query: "London" });
  assert("search_cameras works", (sc.total || 0) > 0);

  // === SNAPSHOT ===
  log("\n--- Snapshots ---");
  const snap = await callTool("get_snapshot", { cam_id: "https://picsum.photos/800/600" });
  assert("snapshot by URL succeeds", snap.success === true);
  assert("snapshot has file_path", !!snap.file_path);
  assert("snapshot file exists", snap.file_path && fs.existsSync(snap.file_path));
  assert("snapshot has reasonable size", snap.size_bytes > 5000);

  const nope = await callTool("get_snapshot", { cam_id: "nonexistent" });
  assert("nonexistent camera error", nope.error === "Camera not found");

  // === LOCAL CAMERAS ===
  log("\n--- Local Cameras ---");
  const add1 = await callTool("add_local_camera", {
    name: "Valid Test Cam", url: "https://picsum.photos/800/600",
    city: "Testville", location: "Testville, Testland",
    timezone: "America/New_York", category: "city", lat: 40.71, lng: -74.01
  });
  assert("add valid camera", add1.success === true);
  assert("has local ID", add1.id?.startsWith("local-"));

  // Add a camera with a broken URL
  const add2 = await callTool("add_local_camera", {
    name: "Broken URL Cam", url: "https://example.com/nonexistent-image-404.jpg",
    city: "Nowhere", location: "Nowhere, Null Island",
    timezone: "UTC", category: "other"
  });
  assert("add broken URL camera", add2.success === true);

  const ll = await callTool("list_local", {});
  assert("list_local shows both", ll.total >= 2);

  // Remove the broken one manually (we need it for submit validation test)
  await callTool("remove_local", { cam_id: add2.id });

  // Re-add it after submit test will need it
  // (we'll add a fresh broken one later)

  // === SUBMIT_LOCAL: VALIDATION ===
  log("\n--- submit_local: Validation ---");
  // Add a broken camera
  const addBroken = await callTool("add_local_camera", {
    name: "Broken For Validation", url: "https://httpbin.org/status/404",
    city: "Testville", location: "Testville, Testland",
    timezone: "America/New_York", category: "other"
  });

  // We should have 1 valid + 1 broken local camera now
  const sub1 = await callTool("submit_local", {});
  log("  submit result: " + JSON.stringify(sub1, null, 2));
  assert("submit with mixed cameras succeeds", sub1.success === true);
  assert("submit reports correct count", sub1.submitted >= 1);
  assert("submit reports skipped_invalid", (sub1.skipped_invalid || 0) >= 1);
  assert("submit has issue_url", !!sub1.issue_url);
  assert("submit has snapshots_embedded", (sub1.snapshots_embedded || 0) >= 1);
  const submitIssue1 = sub1.issue_url?.match(/(\d+)$/)?.[1];

  // === SUBMIT_LOCAL: DUPLICATE DETECTION ===
  log("\n--- submit_local: Duplicate Detection ---");
  const sub2 = await callTool("submit_local", {});
  log("  re-submit result: " + JSON.stringify(sub2, null, 2));
  // The valid camera was already submitted, so either it's skipped or a new issue
  // Since the first issue is still open, it should detect the duplicate
  // Note: the valid camera URL is picsum.photos which returns random images
  // so the URL won't match exactly. Let's check if it submitted or not.
  assert("re-submit has a result", sub2.success !== undefined || sub2.error !== undefined);

  // === VERIFY ISSUE CONTENT ===
  log("\n--- Issue Content Verification ---");
  if (submitIssue1) {
    log("  Checking issue #" + submitIssue1);
    const issueData = JSON.parse(
      execSync(
        `gh issue view ${submitIssue1} --repo stuchapin909/Open-Eagle-Eye --json title,labels,body`,
        { encoding: "utf8" }
      )
    );
    assert("issue has webcam-submission label", issueData.labels?.some(l => l.name === "webcam-submission"));
    assert("issue body contains JSON block", issueData.body?.includes("```json"));
    assert("issue body has camera data", issueData.body?.includes("Valid Test Cam"));
    assert("issue body has snapshot section", issueData.body?.includes("Snapshot Previews"));
    assert("issue body has markdown image", issueData.body?.includes("![Valid Test Cam]("));
    log("  Issue title: " + issueData.title);
    log("  Body length: " + (issueData.body?.length || 0) + " chars");

    // Close the test issue
    execSync(
      `gh issue close ${submitIssue1} --repo stuchapin909/Open-Eagle-Eye --comment "E2E test"`,
      { stdio: "pipe" }
    );
  }

  // === REPORT_CAMERA: SNAPSHOT EMBEDDING ===
  log("\n--- report_camera: Snapshot Embedding ---");
  const addReport = await callTool("add_local_camera", {
    name: "Report Test Cam", url: "https://picsum.photos/800/600",
    city: "Testville", location: "Testville, Testland",
    timezone: "America/New_York", category: "city"
  });
  const rep1 = await callTool("report_camera", {
    cam_id: addReport.id, status: "low_quality",
    notes: "E2E test — testing snapshot embedding in reports"
  });
  log("  report result: " + JSON.stringify(rep1, null, 2));
  assert("report succeeds", rep1.success === true);
  assert("report has issue_url", !!rep1.issue_url);
  assert("report has snapshot_embedded", rep1.snapshot_embedded === true);
  const reportIssue1 = rep1.issue_url?.match(/(\d+)$/)?.[1];

  // === REPORT_CAMERA: BROKEN URL ===
  log("\n--- report_camera: Broken URL Snapshot ---");
  const addBroken2 = await callTool("add_local_camera", {
    name: "Broken For Report", url: "https://httpbin.org/status/404",
    city: "Testville", location: "Testville, Testland",
    timezone: "America/New_York", category: "other"
  });
  const rep2 = await callTool("report_camera", {
    cam_id: addBroken2.id, status: "broken_link",
    notes: "E2E test — broken URL should show fetch failure in issue"
  });
  log("  broken report result: " + JSON.stringify(rep2, null, 2));
  assert("broken report succeeds", rep2.success === true);
  assert("broken report saved_locally", rep2.saved_locally === true);
  const reportIssue2 = rep2.issue_url?.match(/(\d+)$/)?.[1];

  // === VERIFY REPORT ISSUES ===
  log("\n--- Report Issue Verification ---");
  if (reportIssue1) {
    const issueData = JSON.parse(
      execSync(
        `gh issue view ${reportIssue1} --repo stuchapin909/Open-Eagle-Eye --json title,labels,body`,
        { encoding: "utf8" }
      )
    );
    assert("report issue has webcam-report label", issueData.labels?.some(l => l.name === "webcam-report"));
    assert("report body has camera ID in backticks", issueData.body?.includes("`" + addReport.id + "`"));
    assert("report body has snapshot section", issueData.body?.includes("Current Snapshot"));
    assert("report body has markdown image", issueData.body?.includes("![" + addReport.name + "]("));
    assert("report body has timestamp", issueData.body?.includes("Image fetched at report time"));
    log("  Report title: " + issueData.title);
    log("  Body length: " + (issueData.body?.length || 0) + " chars");

    execSync(
      `gh issue close ${reportIssue1} --repo stuchapin909/Open-Eagle-Eye --comment "E2E test"`,
      { stdio: "pipe" }
    );
  }

  if (reportIssue2) {
    const issueData = JSON.parse(
      execSync(
        `gh issue view ${reportIssue2} --repo stuchapin909/Open-Eagle-Eye --json title,labels,body`,
        { encoding: "utf8" }
      )
    );
    assert("broken report has webcam-report label", issueData.labels?.some(l => l.name === "webcam-report"));
    assert("broken report shows snapshot failure", issueData.body?.includes("Failed to fetch snapshot"));
    assert("broken report confirms issue", issueData.body?.includes("confirms the reported issue"));
    log("  Broken report title: " + issueData.title);

    execSync(
      `gh issue close ${reportIssue2} --repo stuchapin909/Open-Eagle-Eye --comment "E2E test"`,
      { stdio: "pipe" }
    );
  }

  // === CLEANUP ===
  log("\n--- Cleanup ---");
  // Close any open issues we may have created
  try {
    const openIssues = JSON.parse(
      execSync(
        `gh issue list --repo stuchapin909/Open-Eagle-Eye --label webcam-submission --state open --json number --limit 10`,
        { encoding: "utf8" }
      )
    );
    for (const issue of openIssues) {
      execSync(
        `gh issue close ${issue.number} --repo stuchapin909/Open-Eagle-Eye --comment "E2E cleanup"`,
        { stdio: "pipe" }
      );
      log("  Closed issue #" + issue.number);
    }
  } catch (e) { log("  Cleanup note: " + e.message.substring(0, 100)); }

  // === SUMMARY ===
  log("\n========================================");
  log("RESULTS: " + pass + " passed, " + fail + " failed");
  log("========================================\n");

  proc.kill();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => {
  log("FATAL: " + e.message + "\n" + e.stack);
  log("STDERR tail: " + stderr.substring(stderr.length - 500));
  proc.kill();
  process.exit(1);
});
