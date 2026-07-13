"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny external store for the HUD's "LOADING REEL ◌" line. Only real-media
 * scenes ever write to it; in procedural mode it stays empty. Snapshot is a
 * primitive string so useSyncExternalStore never loops.
 */
let reel = "";
const listeners = new Set<() => void>();

export function setSceneLoading(_id: string, p: number): void {
  const next = p > 0 && p < 1 ? `LOADING REEL ◌ ${Math.round(p * 100)}%` : "";
  if (next === reel) return;
  reel = next;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

const getSnapshot = () => reel;
const getServerSnapshot = () => "";

export function useLoadingReel(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
