"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Matter from "matter-js";
import { armAudio, boing, pop, thud } from "@/lib/sound";
import { unlock } from "@/lib/achievements";

/**
 * PhysicsZone — one Matter.js world bound to a DOM section.
 *
 * Smoothness contract:
 *  - fixed 120Hz timestep with an accumulator + render interpolation
 *  - bodies sync to DOM via translate3d/rotate only (compositor-only)
 *  - engine runs ONLY while the zone is near the viewport
 *  - drag via a Matter constraint (weighty), pointer events unified
 *  - collision impacts → velocity-scaled thuds + squash-and-stretch
 */

const STEP = 1000 / 120;
const MAX_ACC = 200; // clamp spiral-of-death after tab switches

export type ZoneApi = {
  register: (
    el: HTMLElement,
    opts: {
      shape?: "rect" | "circle";
      density?: number;
      restitution?: number;
      friction?: number;
      frictionAir?: number;
      /** initial position (world px, center-based) */
      x: number;
      y: number;
      angle?: number;
      draggable?: boolean;
      label?: string;
    },
  ) => Matter.Body;
  unregister: (body: Matter.Body) => void;
  world: () => Matter.World;
  engine: () => Matter.Engine;
  /** container size in px */
  size: () => { w: number; h: number };
  /** the zone's DOM element (for custom effects) */
  host: () => HTMLElement;
  requestWake: () => void;
};

const ZoneCtx = createContext<ZoneApi | null>(null);

export function usePhysicsZone(): ZoneApi {
  const api = useContext(ZoneCtx);
  if (!api) throw new Error("usePhysicsZone must be used inside <PhysicsZone>");
  return api;
}

type Tracked = {
  body: Matter.Body;
  el: HTMLElement;
  skin: HTMLElement | null;
  shadow: HTMLElement | null;
  w: number;
  h: number;
  // interpolation state
  px: number;
  py: number;
  pa: number;
};

type Props = {
  id?: string;
  className?: string;
  /** wall thickness sides: which walls to create */
  walls?: { floor?: boolean; left?: boolean; right?: boolean; ceiling?: boolean };
  gravity?: number;
  children: React.ReactNode;
  /** called every engine tick with the api (e.g. custom logic) */
  onTick?: (api: ZoneApi) => void;
};

export function PhysicsZone({
  id,
  className,
  walls = { floor: true, left: true, right: true },
  gravity = 1,
  children,
  onTick,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const stateRef = useRef<{
    engine: Matter.Engine;
    tracked: Map<number, Tracked>;
    running: boolean;
    raf: number;
    last: number;
    acc: number;
    wallBodies: Matter.Body[];
    mouseConstraint: Matter.Constraint | null;
    dragBody: Matter.Body | null;
    hudEl: HTMLDivElement | null;
  } | null>(null);

  // Stable API handed to children.
  const api = useMemo<ZoneApi>(() => {
    return {
      register(el, opts) {
        const s = stateRef.current!;
        const rect = el.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        const common = {
          density: opts.density ?? 0.0012,
          restitution: opts.restitution ?? 0.38,
          friction: opts.friction ?? 0.42,
          frictionAir: opts.frictionAir ?? 0.012,
          angle: opts.angle ?? 0,
          label: opts.label ?? "body",
        };
        const body =
          opts.shape === "circle"
            ? Matter.Bodies.circle(opts.x, opts.y, Math.max(w, h) / 2, common)
            : Matter.Bodies.rectangle(opts.x, opts.y, w, h, {
                ...common,
                chamfer: { radius: Math.min(18, h / 2 - 1, w / 2 - 1) },
              });
        (body as unknown as { __el?: HTMLElement }).__el = el;
        (body as unknown as { __draggable?: boolean }).__draggable =
          opts.draggable !== false;
        Matter.World.add(s.engine.world, body);
        // ground shadow — lives as a sibling behind all bodies
        const shadow = document.createElement("div");
        shadow.className = "phys-shadow";
        shadow.style.width = `${w * 0.9}px`;
        el.parentElement?.insertBefore(shadow, el.parentElement.firstChild);
        s.tracked.set(body.id, {
          body,
          el,
          skin: el.querySelector<HTMLElement>(".phys-skin"),
          shadow,
          w,
          h,
          px: body.position.x,
          py: body.position.y,
          pa: body.angle,
        });
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        return body;
      },
      unregister(body) {
        const s = stateRef.current;
        if (!s) return;
        Matter.World.remove(s.engine.world, body);
        s.tracked.get(body.id)?.shadow?.remove();
        s.tracked.delete(body.id);
      },
      world: () => stateRef.current!.engine.world,
      engine: () => stateRef.current!.engine,
      size: () => {
        const el = hostRef.current!;
        return { w: el.clientWidth, h: el.clientHeight };
      },
      host: () => hostRef.current!,
      requestWake() {
        const s = stateRef.current;
        if (!s) return;
        for (const t of s.tracked.values()) Matter.Sleeping.set(t.body, false);
      },
    };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const engine = Matter.Engine.create({
      enableSleeping: true,
      gravity: { x: 0, y: gravity, scale: 0.001 },
    });

    stateRef.current = {
      engine,
      tracked: new Map(),
      running: false,
      raf: 0,
      last: 0,
      acc: 0,
      wallBodies: [],
      mouseConstraint: null,
      dragBody: null,
      hudEl: null,
    };
    const s = stateRef.current;

    /* ── walls ── */
    const T = 200; // wall thickness (off-screen)
    const buildWalls = () => {
      const { clientWidth: w, clientHeight: h } = host;
      s.wallBodies.forEach((b) => Matter.World.remove(engine.world, b));
      s.wallBodies = [];
      const opts = { isStatic: true, friction: 0.6, restitution: 0.2 };
      if (walls.floor)
        s.wallBodies.push(Matter.Bodies.rectangle(w / 2, h + T / 2, w * 3, T, opts));
      if (walls.ceiling)
        s.wallBodies.push(Matter.Bodies.rectangle(w / 2, -T / 2, w * 3, T, opts));
      if (walls.left)
        s.wallBodies.push(Matter.Bodies.rectangle(-T / 2, h / 2, T, h * 6, opts));
      if (walls.right)
        s.wallBodies.push(Matter.Bodies.rectangle(w + T / 2, h / 2, T, h * 6, opts));
      Matter.World.add(engine.world, s.wallBodies);
    };
    buildWalls();

    /* ── collisions → sound + squash + dust + shake (game juice) ── */
    let lastDust = 0;
    const spawnDust = (x: number, y: number, impact: number) => {
      const now = performance.now();
      if (now - lastDust < 90) return;
      lastDust = now;
      const n = 4 + Math.round(impact * 4);
      for (let i = 0; i < n; i++) {
        const d = document.createElement("span");
        d.className = "dust";
        const ang = Math.random() * Math.PI * 2;
        const dist = 18 + Math.random() * 30 * impact;
        d.style.setProperty("--dx", `${Math.cos(ang) * dist}px`);
        d.style.setProperty("--dy", `${-Math.abs(Math.sin(ang)) * dist - 6}px`);
        d.style.left = `${x}px`;
        d.style.top = `${y}px`;
        d.addEventListener("animationend", () => d.remove());
        host.appendChild(d);
      }
    };

    Matter.Events.on(engine, "collisionStart", (ev) => {
      for (const pair of ev.pairs) {
        const speed =
          Math.hypot(
            pair.bodyA.velocity.x - pair.bodyB.velocity.x,
            pair.bodyA.velocity.y - pair.bodyB.velocity.y,
          ) || 0;
        if (speed < 1.4) continue;
        const impact = Math.min(speed / 14, 1);
        thud(impact);

        // dust puff at the contact point
        const support = pair.collision.supports[0];
        if (support && impact > 0.3) spawnDust(support.x, support.y, impact);

        // screen shake on heavy hits
        if (impact > 0.55) {
          const amp = 2 + impact * 4;
          host.animate(
            [
              { transform: "translate(0,0)" },
              { transform: `translate(${amp}px, ${-amp * 0.7}px)` },
              { transform: `translate(${-amp * 0.7}px, ${amp * 0.5}px)` },
              { transform: "translate(0,0)" },
            ],
            { duration: 150, easing: "ease-out" },
          );
        }

        // squash the non-static participant(s)
        for (const b of [pair.bodyA, pair.bodyB]) {
          if (b.isStatic) continue;
          const t = s.tracked.get(b.id);
          if (t?.skin && impact > 0.18) {
            const sq = 1 + impact * 0.18;
            const st = 1 - impact * 0.14;
            t.skin.style.scale = `${sq} ${st}`;
            setTimeout(() => {
              if (t.skin) t.skin.style.scale = "1 1";
            }, 90);
          }
        }
      }
    });

    /* ── pointer drag via constraint ── */
    const pt = { x: 0, y: 0 };
    const toLocal = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pt.x = e.clientX - r.left;
      pt.y = e.clientY - r.top;
      return pt;
    };

    const hud = document.createElement("div");
    hud.className = "glass label-sm pointer-events-none fixed z-50 hidden px-3 py-2";
    hud.style.borderRadius = "10px";
    document.body.appendChild(hud);
    s.hudEl = hud;

    const onDown = (e: PointerEvent) => {
      armAudio();
      const p = toLocal(e);
      const hits = Matter.Query.point(
        [...s.tracked.values()].map((t) => t.body),
        p,
      );
      const body = hits.find(
        (b) => (b as unknown as { __draggable?: boolean }).__draggable,
      );
      if (!body) return;
      e.preventDefault();
      // NOTE: no pointer capture — window-level move/up handle the drag, and
      // capturing would swallow the pointerup children use for click-vs-drag.
      Matter.Sleeping.set(body, false);
      const constraint = Matter.Constraint.create({
        pointA: { x: p.x, y: p.y },
        bodyB: body,
        pointB: {
          x: p.x - body.position.x,
          y: p.y - body.position.y,
        },
        stiffness: 0.12,
        damping: 0.12,
        length: 0,
      });
      Matter.World.add(engine.world, constraint);
      s.mouseConstraint = constraint;
      s.dragBody = body;
      pop();
      unlock("first-grab");
      hud.classList.remove("hidden");
    };

    const onMove = (e: PointerEvent) => {
      if (!s.mouseConstraint) return;
      const p = toLocal(e);
      s.mouseConstraint.pointA.x = p.x;
      s.mouseConstraint.pointA.y = p.y;
      // physics HUD gag
      const b = s.dragBody!;
      const v = Math.hypot(b.velocity.x, b.velocity.y) * 60;
      const deg = ((b.angle * 180) / Math.PI) % 360;
      hud.textContent = `m=${(b.mass).toFixed(1)}kg · v=${v.toFixed(0)}px/s · θ=${deg.toFixed(0)}°`;
      hud.style.left = `${e.clientX + 14}px`;
      hud.style.top = `${e.clientY + 14}px`;
    };

    const endDrag = () => {
      if (!s.mouseConstraint) return;
      const b = s.dragBody;
      Matter.World.remove(engine.world, s.mouseConstraint);
      s.mouseConstraint = null;
      s.dragBody = null;
      hud.classList.add("hidden");
      if (b) {
        const speed = Math.hypot(b.velocity.x, b.velocity.y);
        boing(Math.min(speed / 18, 1));
      }
    };

    host.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    /* ── scroll impulse: a gentle nudge, rate-limited so it can't stack ── */
    let lastScroll = window.scrollY;
    let lastKick = 0;
    const onScroll = () => {
      const dy = window.scrollY - lastScroll;
      lastScroll = window.scrollY;
      const now = performance.now();
      if (!s.running || Math.abs(dy) < 24 || now - lastKick < 220) return;
      lastKick = now;
      const kick = Math.min(Math.abs(dy) / 4000, 0.0012);
      for (const t of s.tracked.values()) {
        if (t.body.isStatic || t.body === s.dragBody) continue;
        Matter.Sleeping.set(t.body, false);
        Matter.Body.applyForce(t.body, t.body.position, {
          x: (Math.random() - 0.5) * kick * t.body.mass * 0.3,
          y: -Math.sign(dy) * kick * t.body.mass,
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ── fixed-timestep loop + interpolation ── */
    const loop = (t: number) => {
      s.raf = requestAnimationFrame(loop);
      if (!s.last) s.last = t;
      s.acc = Math.min(s.acc + (t - s.last), MAX_ACC);
      s.last = t;

      let stepped = false;
      while (s.acc >= STEP) {
        // snapshot previous state for interpolation
        for (const tr of s.tracked.values()) {
          tr.px = tr.body.position.x;
          tr.py = tr.body.position.y;
          tr.pa = tr.body.angle;
        }
        Matter.Engine.update(engine, STEP);
        s.acc -= STEP;
        stepped = true;
      }

      // escape net: anything that leaves the world re-enters from the top
      if (stepped) {
        const W = host.clientWidth;
        const H = host.clientHeight;
        for (const tr of s.tracked.values()) {
          const b = tr.body;
          if (b.isStatic || b === s.dragBody) continue;
          if (
            b.position.y < -H * 1.6 ||
            b.position.y > H + 400 ||
            b.position.x < -300 ||
            b.position.x > W + 300
          ) {
            // re-enter mid-zone (works for normal AND inverted gravity)
            Matter.Body.setPosition(b, {
              x: W * (0.15 + Math.random() * 0.7),
              y: H * 0.45,
            });
            Matter.Body.setVelocity(b, { x: 0, y: 0 });
            Matter.Body.setAngularVelocity(b, 0);
          }
        }
      }
      if (stepped && onTick) onTick(api);

      const alpha = s.acc / STEP;
      const floorY = host.clientHeight;
      for (const tr of s.tracked.values()) {
        const { body, el, w, h } = tr;
        const cx = tr.px + (body.position.x - tr.px) * alpha;
        const cy = tr.py + (body.position.y - tr.py) * alpha;
        const a = tr.pa + (body.angle - tr.pa) * alpha;
        el.style.transform = `translate3d(${(cx - w / 2).toFixed(2)}px, ${(cy - h / 2).toFixed(2)}px, 0) rotate(${a.toFixed(4)}rad)`;

        // ground shadow: detaches + shrinks + fades with altitude (3D depth)
        if (tr.shadow) {
          const alt = Math.max(0, floorY - (cy + h / 2)); // px above floor
          const k = Math.max(0, 1 - alt / (floorY * 0.9)); // 1 grounded → 0 high
          const sw = 0.55 + 0.45 * k;
          tr.shadow.style.transform = `translate3d(${(cx - (w * 0.9) / 2).toFixed(2)}px, ${(floorY - 8).toFixed(2)}px, 0) scale(${sw.toFixed(3)}, ${(0.5 + 0.5 * k).toFixed(3)})`;
          tr.shadow.style.opacity = (0.15 + 0.55 * k).toFixed(3);
        }

        // drag tilt: lean into velocity, only for the held body
        if (tr.skin) {
          if (body === s.dragBody) {
            const tx = Math.max(-10, Math.min(10, body.velocity.x * 1.4));
            const ty = Math.max(-10, Math.min(10, -body.velocity.y * 1.4));
            tr.skin.style.transform = `rotateY(${tx.toFixed(2)}deg) rotateX(${ty.toFixed(2)}deg) translateZ(6px)`;
          } else if (tr.skin.style.transform) {
            tr.skin.style.transform = "";
          }
        }
      }
    };

    /* ── run only near the viewport ── */
    const io = new IntersectionObserver(
      ([entry]) => {
        const want = entry.isIntersecting;
        if (want && !s.running) {
          s.running = true;
          s.last = 0;
          s.acc = 0;
          s.raf = requestAnimationFrame(loop);
        } else if (!want && s.running) {
          s.running = false;
          cancelAnimationFrame(s.raf);
        }
      },
      { rootMargin: "60% 0px 60% 0px" },
    );
    io.observe(host);

    const onResize = () => buildWalls();
    window.addEventListener("resize", onResize);

    setReady(true);

    return () => {
      io.disconnect();
      cancelAnimationFrame(s.raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      host.removeEventListener("pointerdown", onDown);
      hud.remove();
      Matter.Engine.clear(engine);
      stateRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id={id} ref={hostRef} className={`relative ${className ?? ""}`}>
      <ZoneCtx.Provider value={api}>{ready ? children : null}</ZoneCtx.Provider>
    </div>
  );
}
