"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "@/lib/gsap";
import { drawCover, drawProceduralFrame } from "./procedural";
import { useFrameSequence } from "./useFrameSequence";
import { setSceneLoading } from "./loadingStore";
import type { ManifestEntry, SceneId } from "./types";

type Props = {
  id: string;
  sceneId: SceneId;
  entry: ManifestEntry;
  /** Scroll distance the scene is pinned for (scrub length). */
  end?: string;
  children?: React.ReactNode;
};

/**
 * A single video scene: a full-bleed <canvas> pinned by ScrollTrigger and
 * scrubbed frame-by-frame. Redraws ONLY when the rounded frame index changes;
 * DPR capped at 2; fully resize-safe.
 */
export function FrameScene({ id, sceneId, entry, end = "+=350%", children }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastFrame = useRef(-1);
  const drawRef = useRef<(i: number) => void>(() => {});
  const { getBitmap, setActive, placeholder, loadProgress } = useFrameSequence(
    sceneId,
    entry,
  );

  // Surface real-media loading progress to the HUD and repaint the held frame
  // as bitmaps arrive (so a stationary viewer still sees the reel resolve).
  useEffect(() => {
    if (placeholder) return;
    setSceneLoading(sceneId, loadProgress);
    drawRef.current(lastFrame.current < 0 ? 0 : lastFrame.current);
  }, [loadProgress, placeholder, sceneId]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const canvas = canvasRef.current;
      if (!section || !canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const sizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.round(rect.width * dpr));
        canvas.height = Math.max(1, Math.round(rect.height * dpr));
      };

      const draw = (idx: number) => {
        const w = canvas.width;
        const h = canvas.height;
        const bmp = placeholder ? null : getBitmap(idx);
        if (bmp) drawCover(ctx, bmp, entry.width, entry.height, w, h);
        else drawProceduralFrame(ctx, sceneId, idx, entry.frames, w, h);
      };
      drawRef.current = draw;

      sizeCanvas();
      draw(0);
      lastFrame.current = 0;

      const pinST = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end,
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          const idx = Math.round(self.progress * (entry.frames - 1));
          if (idx !== lastFrame.current) {
            lastFrame.current = idx;
            draw(idx);
          }
        },
      });

      // Preload window: active from one viewport before entry to one after exit.
      const preloadST = ScrollTrigger.create({
        trigger: section,
        start: "top bottom+=100%",
        end: "bottom top-=100%",
        onToggle: (self) => setActive(self.isActive),
      });
      setActive(preloadST.isActive);

      const repaint = () => {
        sizeCanvas();
        draw(lastFrame.current < 0 ? 0 : lastFrame.current);
      };
      window.addEventListener("resize", repaint);
      ScrollTrigger.addEventListener("refresh", repaint);

      return () => {
        window.removeEventListener("resize", repaint);
        ScrollTrigger.removeEventListener("refresh", repaint);
        pinST.kill();
        preloadST.kill();
      };
    },
    { scope: sectionRef, dependencies: [id, placeholder] },
  );

  return (
    <section ref={sectionRef} id={id} className="relative w-full">
      <div className="relative h-svh w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 block h-full w-full"
        />
        {children}
      </div>
    </section>
  );
}
