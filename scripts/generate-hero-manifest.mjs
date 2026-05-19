import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const framesDir = path.join(root, "apps/web/public/hero/frames");

if (!fs.existsSync(framesDir)) {
  fs.mkdirSync(framesDir, { recursive: true });
  console.log("Created", framesDir);
  console.log("Add numbered PNGs (000.png, 001.png, …) then run this script again.");
  process.exit(0);
}

const files = fs
  .readdirSync(framesDir)
  .filter((f) => /^\d+\.png$/i.test(f))
  .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

if (files.length === 0) {
  console.error("No numbered PNGs found in", framesDir);
  process.exit(1);
}

const pad = Math.max(3, String(parseInt(files[files.length - 1], 10)).length);
const manifest = {
  count: files.length,
  pad,
  frames: files.map((f) => `/hero/frames/${f}`),
};

fs.writeFileSync(
  path.join(framesDir, "manifest.json"),
  JSON.stringify(manifest, null, 2),
);

console.log(`Wrote manifest: ${files.length} frames (${files[0]} → ${files[files.length - 1]})`);
