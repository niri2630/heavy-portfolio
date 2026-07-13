"use client";

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { PhysicsZone, type ZoneApi } from "@/components/physics/PhysicsZone";
import { PhysicsBody } from "@/components/physics/PhysicsBody";
import { work, workZone, type Project } from "@/lib/content";
import { click, pop, chime } from "@/lib/sound";
import { unlock } from "@/lib/achievements";

type ClawState = "idle" | "down" | "grab" | "up";

/**
 * THE SHELF — work + GAME 02 "the claw". A gantry claw rides the top rail
 * following your pointer; click to drop it. If it lands on a crate it hauls it
 * up and the case study opens. Cheat-code buttons below skip the game (a11y +
 * impatience). Open all projects → claw-master achievement.
 */
export function Shelf({ reduced }: { reduced: boolean }) {
  const [open, setOpen] = useState<Project | null>(null);
  const [miss, setMiss] = useState(false);
  const openedRef = useRef<Set<string>>(new Set());

  const apiRef = useRef<ZoneApi | null>(null);
  const crates = useRef<Map<string, Matter.Body>>(new Map());
  const clawRef = useRef<HTMLDivElement>(null);
  const cableRef = useRef<HTMLDivElement>(null);
  const claw = useRef({
    x: 0.5, // fraction of width
    y: 0, // px descent
    state: "idle" as ClawState,
    grabbed: null as Matter.Body | null,
    constraint: null as Matter.Constraint | null,
  });

  const markOpened = (p: Project) => {
    openedRef.current.add(p.slug);
    if (openedRef.current.size === work.length) unlock("claw-master");
    setOpen(p);
  };

  // Esc closes the case card.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /** Runs every physics tick — the claw's little state machine. */
  const tick = (api: ZoneApi) => {
    const c = claw.current;
    const { w, h } = api.size();
    const clawEl = clawRef.current;
    const cableEl = cableRef.current;
    if (!clawEl || !cableEl) return;

    const maxDrop = h - 120;
    if (c.state === "down") {
      c.y = Math.min(c.y + 7, maxDrop);
      // check for a crate under the jaws
      const jawX = c.x * w;
      const jawY = c.y + 74;
      const hit = Matter.Query.point(
        [...crates.current.values()],
        { x: jawX, y: jawY },
      )[0];
      if (hit || c.y >= maxDrop) {
        if (!hit) {
          setMiss(true);
          setTimeout(() => setMiss(false), 1400);
        }
        if (hit) {
          c.grabbed = hit;
          c.constraint = Matter.Constraint.create({
            pointA: { x: jawX, y: jawY },
            bodyB: hit,
            pointB: { x: 0, y: -20 },
            stiffness: 0.08,
            damping: 0.1,
            length: 8,
          });
          Matter.World.add(api.world(), c.constraint);
          Matter.Sleeping.set(hit, false);
          pop();
        }
        c.state = c.grabbed ? "grab" : "up";
      }
    } else if (c.state === "grab" || c.state === "up") {
      c.y = Math.max(c.y - 8, 0);
      if (c.constraint) {
        c.constraint.pointA.x = c.x * w;
        c.constraint.pointA.y = c.y + 74;
      }
      if (c.y <= 0) {
        if (c.grabbed) {
          const slug = (c.grabbed as unknown as { __slug?: string }).__slug;
          const p = work.find((x) => x.slug === slug);
          if (c.constraint) Matter.World.remove(api.world(), c.constraint);
          c.constraint = null;
          c.grabbed = null;
          if (p) {
            chime();
            markOpened(p);
          }
        }
        c.state = "idle";
      }
    }

    clawEl.style.transform = `translate3d(${(c.x * w - 34).toFixed(1)}px, ${c.y.toFixed(1)}px, 0)`;
    cableEl.style.transform = `translate3d(${(c.x * w - 1).toFixed(1)}px, 0, 0) scaleY(${((c.y + 46) / 46).toFixed(3)})`;
  };

  return (
    <section id="work" className="relative mx-auto max-w-6xl px-6 py-[14vh] md:px-10">
      <p className="label mb-2 text-ink-soft">{workZone.zone}</p>
      <p className="label-sm mb-6 text-ink-soft">game 02 · the claw</p>
      <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="display">{workZone.heading}</h2>
        {!reduced && <span className="label-sm text-ink-soft">{workZone.hint}</span>}
      </div>

      {reduced ? (
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {work.map((p) => (
            <li key={p.slug}>
              <CaseCard project={p} />
            </li>
          ))}
        </ul>
      ) : (
        <>
          <div
            className="relative touch-none"
            onPointerMove={(e) => {
              if (claw.current.state !== "idle") return;
              // mouse aims on hover; touch aims while the finger is down
              if (e.pointerType !== "mouse" && e.buttons === 0) return;
              const r = e.currentTarget.getBoundingClientRect();
              claw.current.x = Math.min(Math.max((e.clientX - r.left) / r.width, 0.06), 0.94);
            }}
            onPointerDown={(e) => {
              // mouse: click drops immediately. touch: finger down starts aiming.
              if (e.pointerType === "mouse" && claw.current.state === "idle") {
                click();
                claw.current.state = "down";
              }
            }}
            onPointerUp={(e) => {
              // touch: lifting the finger drops the claw where you aimed
              if (e.pointerType !== "mouse" && claw.current.state === "idle") {
                click();
                claw.current.state = "down";
              }
            }}
          >
            {/* arcade marquee */}
            <span className="marquee clay-sm clay-tangerine label px-6 py-3 text-ink">
              ★ the claw ★
            </span>

            <PhysicsZone
              className="zone-box tint-grape h-[500px] w-full overflow-hidden md:h-[540px]"
              walls={{ floor: true, left: true, right: true }}
              onTick={tick}
            >
              {work.map((p, i) => (
                <PhysicsBody
                  key={p.slug}
                  x={(i + 0.7) / (work.length + 0.4)}
                  y={-(0.12 + (i % 3) * 0.22)}
                  angle={(i - 2) * 0.05}
                  restitution={0.25}
                  density={0.002}
                  draggable={false}
                  label={`crate-${p.slug}`}
                  onBody={(b) => {
                    (b as unknown as { __slug?: string }).__slug = p.slug;
                    crates.current.set(p.slug, b);
                  }}
                  className="!cursor-default"
                >
                  <div
                    className={`clay clay-${p.color} relative flex h-[clamp(86px,23vw,140px)] w-[clamp(86px,23vw,140px)] flex-col items-center justify-center gap-1 text-ink`}
                  >
                    {/* prize tag */}
                    <span className="glass-pill label-sm absolute -top-2 right-2 rotate-6 px-2.5 py-1 text-ink-soft">
                      prize
                    </span>
                    <span className="label-sm opacity-70">{p.emojiFree}</span>
                    <span
                      className="font-[family-name:var(--font-display)] font-semibold"
                      style={{ fontSize: "clamp(0.95rem,2.4vw,1.6rem)" }}
                    >
                      {p.title}
                    </span>
                  </div>
                </PhysicsBody>
              ))}

              {/* gantry: toothed rail + trolley + cable + claw */}
              <div
                className="pointer-events-none absolute inset-x-4 top-4 h-3 rounded-full bg-ink/20"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, rgba(42,36,56,0.35) 0 6px, transparent 6px 14px)",
                }}
              />
              <div
                ref={cableRef}
                className="pointer-events-none absolute top-6 h-[46px] w-[2px] origin-top bg-ink/50"
              />
              <div ref={clawRef} className="pointer-events-none absolute top-10 z-10 w-[68px]">
                <div className="clay-sm clay-tangerine mx-auto h-9 w-14" />
                <div className="mx-auto -mt-1 flex w-16 justify-between">
                  <span className="block h-10 w-3.5 origin-top rotate-[20deg] rounded-b-full bg-ink/80" />
                  <span className="block h-10 w-3.5 origin-top rounded-b-full bg-ink/80" />
                  <span className="block h-10 w-3.5 origin-top -rotate-[20deg] rounded-b-full bg-ink/80" />
                </div>
              </div>

              {/* cabinet glass sheen */}
              <div className="cabinet-glass" aria-hidden="true" />

              {/* coin slot hint / miss feedback */}
              <span
                className={`glass label-sm pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 ${
                  miss ? "text-coral" : "text-ink-soft"
                }`}
              >
                {miss
                  ? "✕ so close — every arcade lies a little. again!"
                  : "◉ aim · drop the claw · win a case study"}
              </span>
            </PhysicsZone>
          </div>

          {/* cheat codes: direct access (a11y + impatient recruiters) */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="label-sm text-ink-soft">no quarters?</span>
            {work.map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => {
                  click();
                  markOpened(p);
                }}
                className="glass-pill label-sm cursor-pointer px-4 py-2.5 text-ink transition-transform hover:scale-105"
              >
                {p.title}
              </button>
            ))}
          </div>
        </>
      )}

      {/* case card overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/30 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${open.title} case study`}
          onClick={() => setOpen(null)}
        >
          <div
            className="glass w-full max-w-xl p-8 md:p-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-6">
              <CaseCard project={open} bare />
              <button
                type="button"
                onClick={() => {
                  click();
                  setOpen(null);
                }}
                className="glass-pill label cursor-pointer px-4 py-2.5 transition-transform hover:scale-105"
                aria-label="Close case study"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CaseCard({ project: p, bare }: { project: Project; bare?: boolean }) {
  const inner = (
    <>
      <div className="flex items-center gap-3">
        <span className={`clay-sm clay-${p.color} label-sm px-3 py-2 text-ink`}>
          {p.emojiFree}
        </span>
        <h3 className="display-sm">{p.title}</h3>
      </div>
      <p className="body-copy mt-4 text-ink">{p.what}</p>
      <p className="label-sm mt-4 text-ink-soft">
        {p.role} · {p.stack.join(" · ")}
      </p>
      <p className="label-sm mt-2 text-ink-soft">[{p.status}]</p>
    </>
  );
  if (bare) return <div>{inner}</div>;
  return <article className="glass p-8">{inner}</article>;
}
