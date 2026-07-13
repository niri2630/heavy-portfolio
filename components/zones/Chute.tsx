"use client";

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { PhysicsZone, type ZoneApi } from "@/components/physics/PhysicsZone";
import { PhysicsBody } from "@/components/physics/PhysicsBody";
import { contactZone } from "@/lib/content";
import { chime, click, pop } from "@/lib/sound";
import { unlock } from "@/lib/achievements";

/**
 * THE CHUTE — contact + GAME 04 "hoops". A clay ball, a real rim (two static
 * pegs + backboard), swish detection, score counter. 3 buckets = achievement.
 * The links themselves are always plain, clickable clay chips below.
 */
export function Chute({ reduced }: { reduced: boolean }) {
  const [score, setScore] = useState(0);
  const ballRef = useRef<Matter.Body | null>(null);
  const prevY = useRef(0);
  const cooldown = useRef(0);

  useEffect(() => {
    if (score >= 3) unlock("buckets");
  }, [score]);

  const setup = (api: ZoneApi) => {
    const { w, h } = api.size();
    const rimX = w * 0.78;
    const rimY = h * 0.38;
    const rimR = 52;
    const peg = { isStatic: true, restitution: 0.4, friction: 0.1 };
    Matter.World.add(api.world(), [
      Matter.Bodies.circle(rimX - rimR, rimY, 7, peg),
      Matter.Bodies.circle(rimX + rimR, rimY, 7, peg),
      // backboard
      Matter.Bodies.rectangle(rimX + rimR + 26, rimY - 60, 12, 150, peg),
    ]);
  };

  const didSetup = useRef(false);
  const lastTrail = useRef(0);

  const tick = (api: ZoneApi) => {
    if (!didSetup.current) {
      didSetup.current = true;
      setup(api);
    }
    const b = ballRef.current;
    if (!b) return;

    // speed trail — comet dots while the ball flies
    const nowMs = performance.now();
    if (b.speed > 7 && nowMs - lastTrail.current > 40) {
      lastTrail.current = nowMs;
      const dot = document.createElement("span");
      dot.className = "trail-dot";
      dot.style.left = `${b.position.x}px`;
      dot.style.top = `${b.position.y}px`;
      dot.addEventListener("animationend", () => dot.remove());
      api.host().appendChild(dot);
    }
    const { w, h } = api.size();
    const rimX = w * 0.78;
    const rimY = h * 0.38;
    const rimR = 52;

    if (cooldown.current > 0) cooldown.current -= 1;

    // swish: ball center crosses rim line downward, inside the pegs
    const y = b.position.y;
    if (
      cooldown.current === 0 &&
      prevY.current < rimY &&
      y >= rimY &&
      b.velocity.y > 0 &&
      Math.abs(b.position.x - rimX) < rimR - 18
    ) {
      cooldown.current = 90;
      chime();
      setScore((s) => s + 1);
    }
    prevY.current = y;

    // ball out cold at the floor → respawn at the throw spot
    const resting = b.speed < 0.25 && y > h - 70;
    const escaped = y > h + 200 || b.position.x < -200 || b.position.x > w + 200;
    if ((resting && Math.abs(b.position.x - w * 0.16) > w * 0.12) || escaped) {
      Matter.Body.setPosition(b, { x: w * 0.16, y: h * 0.45 });
      Matter.Body.setVelocity(b, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(b, 0);
      pop();
    }
  };

  return (
    <section id="contact" className="relative mx-auto max-w-6xl px-6 py-[14vh] md:px-10">
      <p className="label mb-2 text-ink-soft">{contactZone.zone}</p>
      <p className="label-sm mb-6 text-ink-soft">game 04 · hoops</p>
      <h2 className="display max-w-[16ch]">{contactZone.heading}</h2>
      <p className="body-copy mt-4 text-ink-soft">{contactZone.sub}</p>

      {!reduced && (
        <div className="relative mt-10">
          <PhysicsZone
            className="zone-box tint-tangerine h-[420px] w-full overflow-hidden"
            walls={{ floor: true, left: true, right: true }}
            onTick={tick}
          >
            {/* court dressing: floor line + hash marks + arc */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute inset-x-6 bottom-10 h-0 border-t-2 border-ink/15" />
              <div
                className="absolute bottom-10 left-[10%] h-16 w-24 rounded-t-full border-2 border-b-0 border-ink/12"
              />
              <span className="label-sm absolute bottom-3 left-6 text-ink-soft/70">
                free-throw line
              </span>
            </div>

            <PhysicsBody
              x={0.16}
              y={0.45}
              shape="circle"
              restitution={0.6}
              frictionAir={0.006}
              density={0.0016}
              label="ball"
              onBody={(b) => {
                ballRef.current = b;
              }}
            >
              <span className="bball grid h-[72px] w-[72px] place-items-center rounded-full" />
            </PhysicsBody>

            {/* hoop assembly: backboard + rim + net (physics pegs invisible) */}
            <div
              className="pointer-events-none absolute z-10 rounded-lg border-2 border-ink/20 bg-white/70 shadow-md"
              style={{ left: "calc(78% + 66px)", top: "calc(38% - 135px)", width: 14, height: 150 }}
            />
            <div
              className="pointer-events-none absolute z-10"
              style={{ left: "calc(78% - 56px)", top: "calc(38% - 5px)", width: 112 }}
            >
              <div className="h-3 rounded-full bg-coral shadow-[0_2px_0_rgba(42,36,56,0.35)]" />
              <div className="net mx-auto h-16 w-[88px]" />
            </div>

            {/* arcade scoreboard */}
            <div className="glass pointer-events-none absolute right-4 top-4 flex flex-col items-end gap-1 px-5 py-4">
              <span className="score-big text-ink">{String(score).padStart(2, "0")}</span>
              <span className="label-sm text-ink-soft">
                {score >= 3 ? "🏆 buckets!" : "3 = achievement 🏆"}
              </span>
            </div>

            <span className="glass label-sm pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 text-ink-soft">
              grab the ball · lob it through the rim
            </span>
          </PhysicsZone>
        </div>
      )}

      {/* the actual links — always available, physical or not */}
      <ul className="mt-10 flex flex-wrap gap-4">
        {contactZone.links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              onClick={() => click()}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className={`clay-sm clay-${l.color} group inline-flex items-baseline gap-3 px-6 py-5 text-ink transition-transform hover:scale-105 active:scale-95`}
            >
              <span className="label">{l.label}</span>
              <span className="label-sm opacity-75">{l.display}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
