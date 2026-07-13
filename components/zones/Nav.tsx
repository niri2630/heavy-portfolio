"use client";

import { nav } from "@/lib/content";
import { armAudio, click, toggleMute, useMuted } from "@/lib/sound";
import { TOTAL, useAchievements } from "@/lib/achievements";

/** Floating glass nav pill + trophies + sound toggle. */
export function Nav() {
  const muted = useMuted();
  const { unlocked } = useAchievements();

  return (
    <nav
      aria-label="Sections"
      className="fixed left-1/2 top-4 z-40 flex -translate-x-1/2 items-center gap-1 p-1.5 glass-pill"
    >
      <a
        href="#top"
        onClick={() => click()}
        className="label rounded-full px-4 py-2.5 text-ink transition-colors hover:bg-white/60"
      >
        heavy·
      </a>
      {nav.map((n) => (
        <a
          key={n.id}
          href={`#${n.id}`}
          onClick={() => click()}
          className="label hidden rounded-full px-4 py-2.5 text-ink-soft transition-colors hover:bg-white/60 hover:text-ink sm:block"
        >
          {n.label}
        </a>
      ))}
      <span
        className="label hidden px-3 py-2.5 text-ink-soft md:block"
        title="achievements"
      >
        🏆 {unlocked.length}/{TOTAL}
      </span>
      <button
        type="button"
        aria-pressed={!muted}
        aria-label={muted ? "Turn sound on" : "Turn sound off"}
        onClick={() => {
          armAudio();
          toggleMute();
          click(); // the mute toggle gets the last word
        }}
        className="label cursor-pointer rounded-full px-4 py-2.5 text-ink-soft transition-colors hover:bg-white/60 hover:text-ink"
      >
        {muted ? "sound: off" : "sound: on"}
      </button>
    </nav>
  );
}
