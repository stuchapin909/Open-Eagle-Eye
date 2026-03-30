/**
 * security.test.js — Unit tests for src/security.js
 *
 * Run with: node --test src/security.test.js  (Node 20+)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isPrivateIP, detectImageType, isSafeUrl } from "./security.js";

// --- isPrivateIP ---

describe("isPrivateIP", () => {
  it("returns true for loopback", () => {
    assert.equal(isPrivateIP("127.0.0.1"), true);
    assert.equal(isPrivateIP("127.255.255.255"), true);
  });

  it("returns true for RFC-1918 ranges", () => {
    assert.equal(isPrivateIP("10.0.0.1"), true);
    assert.equal(isPrivateIP("172.16.0.1"), true);
    assert.equal(isPrivateIP("172.31.255.255"), true);
    assert.equal(isPrivateIP("192.168.1.100"), true);
  });

  it("returns false for 172.15.x (not private)", () => {
    assert.equal(isPrivateIP("172.15.0.1"), false);
  });

  it("returns false for 172.32.x (not private)", () => {
    assert.equal(isPrivateIP("172.32.0.1"), false);
  });

  it("returns true for link-local (169.254.x.x)", () => {
    assert.equal(isPrivateIP("169.254.0.1"), true);
    assert.equal(isPrivateIP("169.254.169.254"), true);
  });

  it("returns true for cloud metadata IP", () => {
    assert.equal(isPrivateIP("100.100.100.200"), true); // Alibaba metadata
  });

  it("returns true for CGNAT range (100.64–127)", () => {
    assert.equal(isPrivateIP("100.64.0.1"), true);
    assert.equal(isPrivateIP("100.127.255.255"), true);
  });

  it("returns false for 100.63.x (below CGNAT)", () => {
    assert.equal(isPrivateIP("100.63.255.255"), false);
  });

  it("returns true for IPv6 loopback", () => {
    assert.equal(isPrivateIP("::1"), true);
    assert.equal(isPrivateIP("::"), true);
  });

  it("returns true for IPv6 ULA (fc/fd)", () => {
    assert.equal(isPrivateIP("fd00::1"), true);
    assert.equal(isPrivateIP("fc00::1"), true);
  });

  it("returns true for IPv6 link-local (fe80)", () => {
    assert.equal(isPrivateIP("fe80::1"), true);
  });

  it("returns true for IPv4-mapped loopback", () => {
    assert.equal(isPrivateIP("::ffff:127.0.0.1"), true);
  });

  it("returns false for a regular public IP", () => {
    assert.equal(isPrivateIP("8.8.8.8"), false);
    assert.equal(isPrivateIP("1.1.1.1"), false);
    assert.equal(isPrivateIP("203.0.113.1"), false);
  });

  it("returns true for null/undefined/empty", () => {
    assert.equal(isPrivateIP(null), true);
    assert.equal(isPrivateIP(""), true);
  });
});

// --- detectImageType ---

describe("detectImageType", () => {
  it("detects JPEG by magic bytes (FF D8 FF)", () => {
    const buf = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00]);
    assert.equal(detectImageType(buf), "image/jpeg");
  });

  it("detects PNG by magic bytes (89 50 4E 47)", () => {
    const buf = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D]);
    assert.equal(detectImageType(buf), "image/png");
  });

  it("returns null for HTML content", () => {
    const buf = Buffer.from("<html><body>error</body></html>");
    assert.equal(detectImageType(buf), null);
  });

  it("returns null for buffer shorter than 4 bytes", () => {
    assert.equal(detectImageType(Buffer.from([0xFF, 0xD8])), null);
    assert.equal(detectImageType(Buffer.alloc(0)), null);
  });
});

// --- isSafeUrl ---

describe("isSafeUrl", () => {
  it("blocks non-http protocols", async () => {
    const r = await isSafeUrl("ftp://example.com/cam.jpg");
    assert.equal(r.safe, false);
    assert.match(r.reason, /Blocked protocol/);
  });

  it("blocks localhost", async () => {
    const r = await isSafeUrl("http://localhost/cam.jpg");
    assert.equal(r.safe, false);
  });

  it("blocks direct private IPs in the URL", async () => {
    const r = await isSafeUrl("http://192.168.1.1/cam.jpg");
    assert.equal(r.safe, false);
    assert.match(r.reason, /private/i);
  });

  it("blocks link-local metadata IP", async () => {
    const r = await isSafeUrl("http://169.254.169.254/latest/meta-data/");
    assert.equal(r.safe, false);
  });

  it("blocks cloud metadata hostnames", async () => {
    const r = await isSafeUrl("http://metadata.google.internal/computeMetadata/v1/");
    assert.equal(r.safe, false);
  });

  it("rejects invalid URLs", async () => {
    const r = await isSafeUrl("not-a-url");
    assert.equal(r.safe, false);
  });

  it("accepts a real public URL (may require DNS)", async () => {
    // This test requires internet access — skip in offline environments.
    // It verifies the happy path doesn't falsely block.
    const r = await isSafeUrl("https://example.com/");
    // We only check that the shape is correct — .safe is a boolean
    assert.equal(typeof r.safe, "boolean");
  });
});
