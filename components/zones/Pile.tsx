"use client";

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { PhysicsZone, type ZoneApi } from "@/components/physics/PhysicsZone";
import { PhysicsBody } from "@/components/physics/PhysicsBody";
import { bricks, stackZone } from "@/lib/content";
import { click } from "@/lib/sound";
import { unlock } from "@/lib/achievements";

const PX_PER_M = 100;
const BEST_KEY = "heavy-best-tower";

/**
 * THE PILE — stack + GAME 03 "tower builder". Stack the skill bricks as high
 * as you can: a glass meter tracks the live tower height, your best is saved,
 * and the WIND button stress-tests your civil engineering. 2m = achievement.
 */
export function Pile({ reduced }: { reduced: boolean }) {
  const groups = [...new Set(bricks.map((b) => b.group))];
  const [heightM, setHeightM] = useState(0);
  const [best, setBest] = useState(0);
  const bodiesRef = useRef<Matter.Body[]>([]);
  const settleTick = useRef(0);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BEST_KEY);
      if (raw) setBest(parseFloat(raw));
    } catch {
      /* fine */
    }
  }, []);

  const tick = (api: ZoneApi) => {
    zoneRef.current = api;
    // measure ~4×/second, only counting near-resting bricks (a thrown brick
    // at the ceiling is not a tower)
    settleTick.current += 1;
    if (settleTick.current % 30 !== 0) return;
    const { h } = api.size();
    let minTop = h;
    for (const b of bodiesRef.current) {
      if (!b || b.speed > 0.35) continue;
      minTop = Math.min(minTop, b.bounds.min.y);
    }
    const m = Math.max(0, (h - minTop) / PX_PER_M);
    setHeightM(m);
    if (m >= 2) unlock("tower-2m");
    setBest((prev) => {
      if (m <= prev) return prev;
      try {
        window.localStorage.setItem(BEST_KEY, m.toFixed(2));
      } catch {
        /* fine */
      }
      return m;
    });
  };

  const wind = () => {
    click();
    for (const b of bodiesRef.current) {
      if (!b) continue;
      Matter.Sleeping.set(b, false);
      Matter.Body.applyForce(b, b.position, {
        x: (Math.random() * 0.5 + 0.5) * 0.045 * b.mass * (Math.random() > 0.5 ? 1 : -1),
        y: -Math.random() * 0.02 * b.mass,
      });
    }
  };

  const zoneRef = useRef<ZoneApi | null>(null);

  /** Stage the bricks in a neat pile on the left — ready to build. */
  const tidy = () => {
    click();
    const api = zoneRef.current;
    if (!api) return;
    const { w, h } = api.size();
    bodiesRef.current.forEach((b, i) => {
      if (!b) return;
      const col = i % 3;
      const row = Math.floor(i / 3);
      Matter.Sleeping.set(b, false);
      Matter.Body.setPosition(b, {
        x: Math.min(90 + col * (w * 0.14), w * 0.5),
        y: h - 40 - row * 52,
      });
      Matter.Body.setAngle(b, 0);
      Matter.Body.setVelocity(b, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(b, 0);
    });
  };

  return (
    <section id="stack" className="relative mx-auto max-w-6xl px-6 py-[14vh] md:px-10">
      <p className="label mb-2 text-ink-soft">{stackZone.zone}</p>
      <p className="label-sm mb-6 text-ink-soft">game 03 · tower builder</p>
      <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="display">{stackZone.heading}</h2>
        {!reduced && <span className="label-sm text-ink-soft">{stackZone.hint}</span>}
      </div>

      {reduced ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          {groups.map((g) => (
            <div key={g}>
              <h3 className="label mb-4 text-ink-soft">{g}</h3>
              <ul className="flex flex-wrap gap-2">
                {bricks
                  .filter((b) => b.group === g)
                  .map((b) => (
                    <li
                      key={b.text}
                      className={`clay-sm clay-${b.color} label-sm px-4 py-3 text-ink`}
                    >
                      {b.text}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <>
          <PhysicsZone
            className="zone-box tint-mint h-[520px] w-full overflow-hidden"
            walls={{ floor: true, left: true, right: true }}
            onTick={tick}
          >
            {/* measuring ruler + metre marks */}
            <div className="ruler" aria-hidden="true" />
            <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-9 top-0">
              {[1, 2, 3, 4].map((m) => (
                <span
                  key={m}
                  className="label-sm absolute left-0 text-ink-soft"
                  style={{ bottom: m * PX_PER_M - 8 }}
                >
                  {m}m
                </span>
              ))}
            </div>
            {/* the 2m goal line */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 flex items-center gap-3 px-10"
              style={{ bottom: 2 * PX_PER_M }}
            >
              <span className="h-0 flex-1 border-t-2 border-dashed border-ink/25" />
              <span className="clay-sm clay-coral label-sm -rotate-2 px-3 py-1.5 text-ink">
                2m goal ⚑
              </span>
            </div>
            {bricks.map((b, i) => (
              <PhysicsBody
                key={b.text}
                x={0.1 + (i % 6) * 0.16}
                y={-(0.08 + Math.floor(i / 6) * 0.35 + (i % 3) * 0.06)}
                angle={((i % 5) - 2) * 0.06}
                restitution={0.12}
                frictionAir={0.015}
                density={0.0018}
                label={`brick-${b.text}`}
                onBody={(body) => {
                  bodiesRef.current[i] = body;
                }}
              >
                <span
                  className={`clay-sm clay-${b.color} label inline-block whitespace-nowrap px-5 py-4 text-ink`}
                >
                  {b.text}
                </span>
              </PhysicsBody>
            ))}

            {/* scoreboard */}
            <div className="glass pointer-events-none absolute right-4 top-4 flex flex-col items-end gap-1 px-5 py-4">
              <span className="score-big text-ink">{heightM.toFixed(2)}m</span>
              <span className="label-sm text-ink-soft">best {best.toFixed(2)}m</span>
              <span className="label-sm text-ink-soft">goal 2.00m 🏆</span>
            </div>

            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                type="button"
                onClick={tidy}
                className="clay-sm clay-mint label cursor-pointer px-5 py-3.5 text-ink transition-transform hover:scale-105 active:scale-95"
              >
                tidy 🧹
              </button>
              <button
                type="button"
                onClick={wind}
                className="clay-sm clay-sky label cursor-pointer px-5 py-3.5 text-ink transition-transform hover:scale-105 active:scale-95"
              >
                wind 💨
              </button>
            </div>
          </PhysicsZone>

          <ul className="sr-only">
            {bricks.map((b) => (
              <li key={b.text}>
                {b.text} ({b.group})
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
