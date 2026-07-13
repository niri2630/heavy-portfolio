"use client";

import { useRef, useState } from "react";
import { PhysicsZone } from "@/components/physics/PhysicsZone";
import { PhysicsBody } from "@/components/physics/PhysicsBody";
import { hero } from "@/lib/content";
import { armAudio, click } from "@/lib/sound";
import { unlock } from "@/lib/achievements";
import type Matter from "matter-js";
import MatterNS from "matter-js";

/**
 * THE DROP — hero. NIRIKSH letters free-fall as clay blocks, bounce, settle.
 * Grab & throw them; the RE-DROP lever tosses everything back up and lets it
 * rain again. Static variant for reduced motion.
 */
export function Drop({ reduced }: { reduced: boolean }) {
  const bodies = useRef<Matter.Body[]>([]);
  const [drops, setDrops] = useState(0);

  if (reduced) {
    return (
      <header className="relative flex min-h-svh flex-col items-center justify-center gap-10 px-6 text-center">
        <h1 className="display-xl flex flex-wrap justify-center gap-3">
          {hero.letters.map((l, i) => (
            <span
              key={i}
              className={`clay clay-${hero.letterColors[i]} inline-grid h-[1.4em] w-[1.15em] place-items-center`}
            >
              {l}
            </span>
          ))}
        </h1>
        <Tagline />
      </header>
    );
  }

  const redrop = () => {
    armAudio();
    click();
    unlock("re-drop");
    for (const b of bodies.current) {
      MatterNS.Sleeping.set(b, false);
      MatterNS.Body.setPosition(b, {
        x: b.position.x,
        y: -100 - Math.random() * 400,
      });
      MatterNS.Body.setVelocity(b, { x: (Math.random() - 0.5) * 6, y: 0 });
      MatterNS.Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.15);
    }
    setDrops((d) => d + 1);
  };

  return (
    <header className="relative">
      {/* ambient color blobs — depth behind the toys */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="blob left-[8%] top-[18%] h-72 w-72 bg-coral" />
        <span className="blob right-[10%] top-[10%] h-80 w-80 bg-sky" />
        <span className="blob bottom-[12%] left-[38%] h-64 w-64 bg-sunflower" />
      </div>

      <PhysicsZone
        id="drop"
        className="h-svh w-full overflow-hidden"
        walls={{ floor: true, left: true, right: true }}
      >
        {hero.letters.map((letter, i) => (
          <PhysicsBody
            key={`${letter}-${i}`}
            x={0.5 + (i - 3) * 0.105}
            y={-(0.15 + i * 0.22)} // staggered rain from above
            angle={(i - 3) * 0.06}
            restitution={0.45}
            label={`letter-${letter}`}
            className="z-10"
            onBody={(b) => {
              bodies.current[i] = b;
            }}
          >
            <span
              className={`clay clay-${hero.letterColors[i]} display-xl grid h-[clamp(4.6rem,14vw,12rem)] w-[clamp(3.9rem,11.6vw,10rem)] place-items-center pb-[0.08em] text-ink`}
              style={{ fontSize: "clamp(2.6rem,8vw,7rem)" }}
            >
              {letter}
            </span>
          </PhysicsBody>
        ))}

        {/* static overlay content — never physical, always readable */}
        <div className="pointer-events-none absolute inset-x-0 top-[14svh] z-0 flex flex-col items-center gap-5 px-6 text-center">
          <Tagline />
        </div>

        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3">
          <button
            type="button"
            onClick={redrop}
            className="glass-pill label cursor-pointer px-6 py-3.5 text-ink transition-transform hover:scale-105 active:scale-95"
          >
            ↺ {hero.redrop}
            <span className="sr-only"> the letters</span>
          </button>
          <span className="label-sm hidden text-ink-soft md:block" aria-hidden="true">
            {hero.hint}
          </span>
        </div>
        {/* a11y: the name as real text for screen readers & SEO */}
        <span className="sr-only">Niriksh{` — drop count ${drops}`}</span>
      </PhysicsZone>
    </header>
  );
}

function Tagline() {
  return (
    <>
      <p className="clay-sm clay-sunflower label inline-block -rotate-2 px-5 py-3 text-ink">
        portfolio arcade · insert scroll
      </p>
      <p className="display-sm max-w-[24ch] text-ink">
        {hero.tagline}{" "}
        <span className="text-ink-soft">{hero.taglineB}</span>
      </p>
    </>
  );
}
