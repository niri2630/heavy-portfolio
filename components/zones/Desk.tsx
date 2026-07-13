"use client";

import { useRef, useState } from "react";
import Matter from "matter-js";
import { PhysicsZone, type ZoneApi } from "@/components/physics/PhysicsZone";
import { PhysicsBody } from "@/components/physics/PhysicsBody";
import { about } from "@/lib/content";
import { pop, chime } from "@/lib/sound";
import { unlock } from "@/lib/achievements";

/**
 * THE DESK — about + GAME 01 "balloon pop". Facts float as helium balloons
 * (negative gravity — a different physics feel from every other zone). Pop a
 * balloon to collect its fact; collect all four for the achievement.
 */
export function Desk({ reduced }: { reduced: boolean }) {
  const [popped, setPopped] = useState<string[]>([]);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const balloonBodies = useRef<(Matter.Body | null)[]>([]);
  const t = useRef(0);

  // gentle idle bob so the balloons feel alive, never parked
  const tick = (_api: ZoneApi) => {
    t.current += 1 / 120;
    balloonBodies.current.forEach((b, i) => {
      if (!b) return;
      Matter.Sleeping.set(b, false);
      Matter.Body.applyForce(b, b.position, {
        x: Math.sin(t.current * 1.4 + i * 1.7) * 0.0000045 * b.mass * 120,
        y: Math.cos(t.current * 1.1 + i * 0.9) * 0.0000028 * b.mass * 120,
      });
    });
  };

  const popBalloon = (text: string, color: string) => (e?: { clientX: number; clientY: number }) => {
    pop();
    const idx = about.facts.findIndex((x) => x.text === text);
    if (idx >= 0) balloonBodies.current[idx] = null;
    setPopped((prev) => {
      const next = prev.includes(text) ? prev : [...prev, text];
      if (next.length === about.facts.length) {
        unlock("all-facts");
        chime();
      }
      return next;
    });
    if (e) {
      const id = Date.now();
      setBursts((b) => [...b, { id, x: e.clientX, y: e.clientY, color }]);
      setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 700);
    }
  };

  return (
    <section id="about" className="relative mx-auto max-w-6xl px-6 py-[14vh] md:px-10">
      <p className="label mb-2 text-ink-soft">{about.zone}</p>
      <p className="label-sm mb-6 text-ink-soft">game 01 · balloon pop</p>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
        {/* readable intro — glass sheet */}
        <div className="glass p-8 md:col-span-7 md:p-10">
          <h2 className="display mb-6">{about.heading}</h2>
          {about.body.map((p) => (
            <p key={p} className="body-copy mb-4 text-ink">
              {p}
            </p>
          ))}
          {/* collected facts land here */}
          <div className="mt-6 flex min-h-[3rem] flex-wrap gap-2">
            {about.facts.map((f) =>
              popped.includes(f.text) ? (
                <span
                  key={f.text}
                  className={`clay-sm clay-${f.color} label-sm px-4 py-3 text-ink`}
                >
                  ✓ {f.text}
                </span>
              ) : (
                <span
                  key={f.text}
                  className="label-sm rounded-full border border-dashed border-ink-soft/40 px-4 py-3 text-ink-soft"
                >
                  ?
                </span>
              ),
            )}
          </div>
        </div>

        {/* the balloon chamber */}
        <div className="md:col-span-5">
          {reduced ? (
            <ul className="flex flex-wrap gap-3">
              {about.facts.map((f) => (
                <li
                  key={f.text}
                  className={`clay-sm clay-${f.color} label px-5 py-4 text-ink`}
                >
                  {f.text}
                </li>
              ))}
            </ul>
          ) : (
            <PhysicsZone
              className="zone-box tint-sky h-[380px] w-full overflow-hidden md:h-full md:min-h-[420px]"
              walls={{ floor: true, left: true, right: true, ceiling: true }}
              gravity={-0.55}
              onTick={tick}
            >
              {/* sky set-dressing: soft clouds + sun sticker */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <span className="absolute left-[12%] top-[16%] h-8 w-24 rounded-full bg-white/70 blur-[2px]" />
                <span className="absolute left-[18%] top-[13%] h-8 w-16 rounded-full bg-white/80 blur-[2px]" />
                <span className="absolute right-[14%] top-[38%] h-7 w-20 rounded-full bg-white/60 blur-[2px]" />
                <span className="clay-sm clay-sunflower absolute right-4 top-4 grid h-12 w-12 place-items-center !rounded-full">
                  <span className="label-sm text-ink">☀</span>
                </span>
              </div>

              {about.facts.map((f, i) =>
                popped.includes(f.text) ? null : (
                  <PhysicsBody
                    key={f.text}
                    x={0.2 + i * 0.2}
                    y={0.55 + (i % 2) * 0.28}
                    shape="circle"
                    restitution={0.7}
                    frictionAir={0.035}
                    density={0.0004}
                    label={`balloon-${i}`}
                    onBody={(b) => {
                      balloonBodies.current[i] = b;
                    }}
                    onClick={(at) => popBalloon(f.text, f.color)(at)}
                  >
                    <span
                      className={`clay clay-${f.color} balloon relative grid h-[104px] w-[96px] place-items-center text-center`}
                    >
                      <span className="label-sm px-2 text-ink">{f.text}</span>
                      <span className="balloon-string" aria-hidden="true" />
                    </span>
                  </PhysicsBody>
                ),
              )}
              <span className="glass label-sm pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 text-ink-soft">
                {popped.length === about.facts.length
                  ? "✓ all facts collected"
                  : `pop the balloons · ${popped.length}/${about.facts.length} facts`}
              </span>
            </PhysicsZone>
          )}
        </div>
      </div>

      {/* confetti bursts */}
      {bursts.map((b) => (
        <span
          key={b.id}
          className="pointer-events-none fixed z-50"
          style={{ left: b.x, top: b.y }}
          aria-hidden="true"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className={`clay-sm clay-${b.color} absolute h-2.5 w-2.5`}
              style={{
                animation: `confetti-${i % 4} 0.65s ease-out forwards`,
              }}
            />
          ))}
        </span>
      ))}

      {/* experience — static, skimmable */}
      <ol className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3">
        {about.experience.map((e) => (
          <li key={e.org} className="glass p-6">
            <p className="label-sm text-ink-soft">{e.period}</p>
            <h3 className="display-sm mt-2">{e.org}</h3>
            <p className="body-copy mt-1 text-ink">{e.role}</p>
            <p className="label-sm mt-3 text-ink-soft">
              {e.where} · {e.stack}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
