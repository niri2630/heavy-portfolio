"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ManifestEntry, SceneId } from "./types";

/**
 * Loads a scene's webp frame sequence on demand and releases the decoded bitmaps
 * once the scene is out of range. In placeholder mode it does NO network work —
 * getBitmap always returns null and the caller draws procedurally.
 */
export function useFrameSequence(sceneId: SceneId, entry: ManifestEntry) {
  const placeholder = entry.placeholder;
  const bitmaps = useRef<(ImageBitmap | null)[]>([]);
  const [loadProgress, setLoadProgress] = useState(placeholder ? 1 : 0);
  const genRef = useRef(0);
  const loadedRef = useRef(false);
  const activeRef = useRef(false);

  const release = useCallback(() => {
    for (const b of bitmaps.current) b?.close();
    bitmaps.current = [];
    loadedRef.current = false;
    if (!placeholder) setLoadProgress(0);
  }, [placeholder]);

  const load = useCallback(async () => {
    if (placeholder || loadedRef.current) return;
    loadedRef.current = true;
    const gen = ++genRef.current;
    const n = entry.frames;
    bitmaps.current = new Array<ImageBitmap | null>(n).fill(null);
    let done = 0;
    for (let i = 0; i < n; i++) {
      if (gen !== genRef.current) return; // superseded / released
      const name = `/film/${sceneId}/frame-${String(i + 1).padStart(4, "0")}.webp`;
      try {
        const res = await fetch(name);
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        const bmp = await createImageBitmap(blob);
        if (gen !== genRef.current) {
          bmp.close();
          return;
        }
        bitmaps.current[i] = bmp;
      } catch {
        // leave null → procedural fallback for this frame
      }
      done += 1;
      if (done % 4 === 0 || done === n) setLoadProgress(done / n);
    }
  }, [entry.frames, placeholder, sceneId]);

  const setActive = useCallback(
    (active: boolean) => {
      if (active === activeRef.current) return;
      activeRef.current = active;
      if (active) void load();
      else release();
    },
    [load, release],
  );

  const getBitmap = useCallback((i: number) => bitmaps.current[i] ?? null, []);

  useEffect(() => {
    return () => {
      genRef.current += 1;
      release();
    };
  }, [release]);

  return { loadProgress, getBitmap, setActive, placeholder };
}
