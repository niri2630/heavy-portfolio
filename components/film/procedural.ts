import type { SceneId } from "./types";

/**
 * Procedural frame renderer — the site is fully experienceable with ZERO media
 * files. Each frame is a deterministic function of (sceneId, frameIndex): a slow
 * hue-shifting dark gradient + deterministic film-burn flicker + a huge dim scene
 * label. Kept dark and low-saturation so the letterbox/HUD/serif stay legible.
 * (Gradients + hue are permitted here per the DESIGN LOCK placeholder exception.)
 */

const SCENE_HUE: Record<SceneId, number> = {
  "scene-a": 24, // warm ember
  "scene-b": 205, // cold steel
  "scene-c": 42, // dawn gold
};

const SCENE_LABEL: Record<SceneId, string> = {
  "scene-a": "SCENE A",
  "scene-b": "SCENE B",
  "scene-c": "SCENE C",
};

// Deterministic 0..1 hash — replaces Math.random for reproducible flicker.
function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function drawProceduralFrame(
  ctx: CanvasRenderingContext2D,
  sceneId: SceneId,
  frameIndex: number,
  frames: number,
  w: number,
  h: number,
): void {
  const t = frames > 1 ? frameIndex / (frames - 1) : 0;
  const base = SCENE_HUE[sceneId];
  const hue = (base + t * 46) % 360; // slow shift across the scene

  // Dark vertical gradient.
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, `hsl(${hue}, 16%, 6%)`);
  g.addColorStop(0.55, `hsl(${(hue + 18) % 360}, 20%, 11%)`);
  g.addColorStop(1, `hsl(${(hue + 36) % 360}, 14%, 4%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Film-burn flicker: deterministic, occasional warm bloom.
  const flick = hash(frameIndex + 1);
  if (flick > 0.85) {
    ctx.save();
    ctx.globalAlpha = (flick - 0.85) * 0.5; // up to ~0.075
    ctx.fillStyle = "hsl(32, 55%, 55%)";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Barely-perceptible vignette.
  const r = Math.max(w, h);
  const vg = ctx.createRadialGradient(w / 2, h / 2, r * 0.2, w / 2, h / 2, r * 0.75);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  // Huge dim scene label, slight drift with the scrub.
  ctx.save();
  ctx.fillStyle = "rgba(237,232,223,0.05)"; // bone at low alpha
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fs = Math.round(h * 0.24);
  ctx.font = `${fs}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  const drift = (t - 0.5) * h * 0.04;
  ctx.fillText(SCENE_LABEL[sceneId], w / 2, h / 2 + drift);
  ctx.restore();
}

/**
 * Cover-fit blit of a decoded frame (source w/h) onto the display canvas — the
 * "background-size: cover" equivalent in device pixels.
 */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sw: number,
  sh: number,
  dw: number,
  dh: number,
): void {
  const scale = Math.max(dw / sw, dh / sh);
  const w = sw * scale;
  const h = sh * scale;
  const x = (dw - w) / 2;
  const y = (dh - h) / 2;
  ctx.drawImage(source, 0, 0, sw, sh, x, y, w, h);
}
