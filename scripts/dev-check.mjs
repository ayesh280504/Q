#!/usr/bin/env node
/**
 * Verify local dev stack is reachable (API, crowd, web).
 * Run after `npm run dev:stack` in another terminal.
 */
const TIMEOUT_MS = 4000;

const checks = [
  { name: "API", url: "http://localhost:8787/health", expect: "ok" },
  { name: "Crowd", url: "http://localhost:5173/", expect: "html" },
  { name: "Web", url: "http://localhost:5174/", expect: "html" },
];

async function probe({ name, url, expect }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    const text = await res.text();
    if (!res.ok) {
      return { name, ok: false, detail: `HTTP ${res.status}` };
    }
    if (expect === "ok") {
      const ok = text.includes("ok") || text.includes('"status"');
      return { name, ok, detail: ok ? "healthy" : text.slice(0, 80) };
    }
    const ok = text.toLowerCase().includes("<!doctype html") || text.includes("<html");
    return { name, ok, detail: ok ? "serving" : "unexpected response" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { name, ok: false, detail: msg.includes("abort") ? "timeout (not running?)" : msg };
  } finally {
    clearTimeout(timer);
  }
}

console.log("Q local dev check\n");

const results = await Promise.all(checks.map(probe));
let failed = 0;

for (const r of results) {
  const icon = r.ok ? "✓" : "✗";
  console.log(`  ${icon} ${r.name.padEnd(6)} ${r.detail}`);
  if (!r.ok) failed++;
}

console.log("");

if (failed === 0) {
  console.log("All services up. Next:");
  console.log("  npm run dev:desktop     # Tauri booth (drag-to-deck needs this)");
  console.log("  Phone: http://<lan-ip>:5173/r/YOUR_CODE  (see docs/LOCAL-TEST.md)");
  process.exit(0);
}

console.log("Some services are down. Start the stack:");
console.log("  npm run dev:stack");
console.log("");
console.log("If phone testing fails, run:");
console.log("  npm run sync:env        # auto-detects LAN IP on Windows");
console.log("");
console.log("Full walkthrough: docs/LOCAL-TEST.md");
process.exit(1);
