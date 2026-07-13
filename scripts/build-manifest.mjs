#!/usr/bin/env node
/**
 * build-manifest.mjs — scan public/film/<scene>/ folders, count webp frames,
 * read the first frame's pixel dimensions, and write public/film/manifest.json
 * with placeholder:false for any scene that has frames (placeholder:true when a
 * scene folder is empty/missing, so the site still runs procedurally).
 *
 * Usage: node scripts/build-manifest.mjs
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const filmDir = join(root, "public", "film");
const SCENES = ["scene-a", "scene-b", "scene-c"];

/** Minimal WebP dimension reader (VP8 / VP8L / VP8X) — avoids extra deps. */
function webpSize(buf) {
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") {
    return null;
  }
  const fmt = buf.toString("ascii", 12, 16);
  if (fmt === "VP8 ") {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (fmt === "VP8L") {
    const b = buf.readUInt32LE(21);
    return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
  }
  if (fmt === "VP8X") {
    const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    return { width, height };
  }
  return null;
}

const manifest = {};
for (const scene of SCENES) {
  const dir = join(filmDir, scene);
  const frames = existsSync(dir)
    ? readdirSync(dir).filter((f) => /^frame-\d+\.webp$/i.test(f)).sort()
    : [];

  if (frames.length === 0) {
    manifest[scene] = { frames: 120, width: 1280, height: 720, placeholder: true };
    console.log(`${scene}: no frames → placeholder`);
    continue;
  }

  const first = readFileSync(join(dir, frames[0]));
  const size = webpSize(first) ?? { width: 1280, height: 720 };
  manifest[scene] = {
    frames: frames.length,
    width: size.width,
    height: size.height,
    placeholder: false,
  };
  console.log(`${scene}: ${frames.length} frames @ ${size.width}x${size.height}`);
}

writeFileSync(join(filmDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("wrote public/film/manifest.json");
