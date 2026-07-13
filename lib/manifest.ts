"use client";

import { useEffect, useState } from "react";
import manifestData from "@/public/film/manifest.json";
import type { Manifest } from "@/components/film/types";

const initial = manifestData as Manifest;

/**
 * Reads /public/film/manifest.json. Starts from the bundled copy (no flash),
 * then re-fetches at runtime so a rebuilt manifest (real frames dropped in) can
 * take over without a code change.
 */
export function useManifest(): Manifest {
  const [manifest, setManifest] = useState<Manifest>(initial);

  useEffect(() => {
    let alive = true;
    fetch("/film/manifest.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d) setManifest(d as Manifest);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return manifest;
}
