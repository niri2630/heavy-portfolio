"use client";

import { Nav } from "@/components/zones/Nav";
import { Drop } from "@/components/zones/Drop";
import { Desk } from "@/components/zones/Desk";
import { Shelf } from "@/components/zones/Shelf";
import { Pile } from "@/components/zones/Pile";
import { Chute } from "@/components/zones/Chute";
import { Footer } from "@/components/zones/Footer";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";
import { useAchievements } from "@/lib/achievements";

/** HEAVY — the whole world. `reduced` renders everything settled and static. */
export function Heavy() {
  const reduced = usePrefersReducedMotion();
  const { toast } = useAchievements();

  return (
    <div id="top">
      <Nav />
      {toast && (
        <div
          role="status"
          className="glass label fixed bottom-6 left-1/2 z-50 w-max max-w-[92vw] -translate-x-1/2 px-6 py-4 text-center text-ink"
        >
          {toast}
        </div>
      )}
      <main>
        <Drop reduced={reduced} />
        <Desk reduced={reduced} />
        <Shelf reduced={reduced} />
        <Pile reduced={reduced} />
        <Chute reduced={reduced} />
      </main>
      <Footer />
    </div>
  );
}
