#!/usr/bin/env node
/**
 * Verify production endpoints (Render API + Vercel crowd/web).
 * Does not require local dev stack to be running.
 */
const TIMEOUT_MS = 45000;

const checks = [
  {
    name: "API",
    url: "https://q-api-hp4b.onrender.com/health",
    expect: "ok",
  },
  {
    name: "Crowd",
    url: "https://q-crowd.vercel.app/",
    expect: "html",
  },
  {
    name: "Web",
    url: "https://q-web-liart.vercel.app/",
    expect: "html",
  },
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
    return { name, ok: false, detail: msg.includes("abort") ? "timeout" : msg };
  } finally {
    clearTimeout(timer);
  }
}

console.log("Q production check\n");

const results = await Promise.all(checks.map(probe));
let failed = 0;

for (const r of results) {
  const icon = r.ok ? "✓" : "✗";
  console.log(`  ${icon} ${r.name.padEnd(6)} ${r.detail}`);
  if (!r.ok) failed++;
}

console.log("");

if (failed === 0) {
  console.log("Production stack reachable.");
  console.log("");
  console.log("Verify end-to-end:");
  console.log("  1. Desktop app (installed build) → Start gig → QR");
  console.log("  2. Phone on LTE or Wi‑Fi → scan → search + request");
  console.log("  3. Render Q_CROWD_URL must be https://q-crowd.vercel.app");
  process.exit(0);
}

console.log("Some production services failed.");
console.log("See docs/PRODUCTION-DEPLOY.md — deploy API first, then crowd + web.");
process.exit(1);
