"use client";

import { useSyncExternalStore } from "react";

/**
 * Synthesized sound effects — zero audio files. A shared AudioContext is
 * created lazily on the first user gesture (autoplay policy). Every effect is
 * built from oscillators + filtered noise, kept short (<250ms) and quiet.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let lastThud = 0;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function toggleMute(): void {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 1;
  emit();
}

export function useMuted(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => muted,
    () => false,
  );
}

/** Create (or resume) the context. Call from within a user gesture. */
export function armAudio(): void {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
}

function now(): number {
  return ctx ? ctx.currentTime : 0;
}

function env(node: GainNode, t0: number, peak: number, decay: number) {
  node.gain.setValueAtTime(0.0001, t0);
  node.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0011), t0 + 0.008);
  node.gain.exponentialRampToValueAtTime(0.001, t0 + decay);
}

function noiseBuffer(): AudioBuffer {
  const c = ctx!;
  const buf = c.createBuffer(1, c.sampleRate * 0.12, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

let cachedNoise: AudioBuffer | null = null;

/** Collision thud — gain and pitch scale with impact 0..1. Rate-limited. */
export function thud(impact: number): void {
  if (!ctx || !master || muted) return;
  const t = performance.now();
  if (t - lastThud < 50) return; // avoid machine-gun on pile settles
  lastThud = t;

  const t0 = now();
  const i = Math.min(Math.max(impact, 0.05), 1);

  // body: low sine knock
  const osc = ctx.createOscillator();
  const og = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(90 + i * 60, t0);
  osc.frequency.exponentialRampToValueAtTime(45, t0 + 0.12);
  env(og, t0, 0.25 * i, 0.14);
  osc.connect(og).connect(master);
  osc.start(t0);
  osc.stop(t0 + 0.16);

  // texture: filtered noise tap
  cachedNoise ??= noiseBuffer();
  const src = ctx.createBufferSource();
  src.buffer = cachedNoise;
  const filt = ctx.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.value = 700 + i * 900;
  const ng = ctx.createGain();
  env(ng, t0, 0.12 * i, 0.08);
  src.connect(filt).connect(ng).connect(master);
  src.start(t0);
}

/** Grab pop — tiny upward blip. */
export function pop(): void {
  if (!ctx || !master || muted) return;
  const t0 = now();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(320, t0);
  osc.frequency.exponentialRampToValueAtTime(620, t0 + 0.06);
  env(g, t0, 0.12, 0.09);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + 0.1);
}

/** Release boing — springy pitch wobble, scaled by throw speed 0..1. */
export function boing(speed: number): void {
  if (!ctx || !master || muted) return;
  const t0 = now();
  const s = Math.min(Math.max(speed, 0.1), 1);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(220 + s * 160, t0);
  osc.frequency.exponentialRampToValueAtTime(140, t0 + 0.18);
  env(g, t0, 0.1 * s, 0.2);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + 0.22);
}

/** UI glass click. */
export function click(): void {
  if (!ctx || !master || muted) return;
  const t0 = now();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(1800, t0);
  env(g, t0, 0.05, 0.03);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + 0.04);
}

/** Chute chime — two-note success. */
export function chime(): void {
  if (!ctx || !master || muted) return;
  const t0 = now();
  [523.25, 783.99].forEach((f, idx) => {
    const osc = ctx!.createOscillator();
    const g = ctx!.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    const start = t0 + idx * 0.09;
    env(g, start, 0.14, 0.35);
    osc.connect(g).connect(master!);
    osc.start(start);
    osc.stop(start + 0.4);
  });
}
