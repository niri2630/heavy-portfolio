"use client";

import { useEffect, useRef } from "react";
import type Matter from "matter-js";
import { usePhysicsZone } from "./PhysicsZone";

type Props = {
  /** initial center position as a fraction of zone size (0..1) or px if >1 */
  x: number;
  y: number;
  angle?: number;
  shape?: "rect" | "circle";
  density?: number;
  restitution?: number;
  frictionAir?: number;
  draggable?: boolean;
  label?: string;
  className?: string;
  onBody?: (body: Matter.Body) => void;
  onClick?: (at: { clientX: number; clientY: number }) => void;
  children: React.ReactNode;
};

/**
 * A DOM element that lives in the parent PhysicsZone's world. The outer div is
 * transform-synced by the engine; the inner .phys-skin handles squash/stretch.
 * Distinguishes click from drag by pointer travel (<6px = click).
 */
export function PhysicsBody({
  x,
  y,
  angle = 0,
  shape = "rect",
  density,
  restitution,
  frictionAir,
  draggable = true,
  label,
  className,
  onBody,
  onClick,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const zone = usePhysicsZone();
  const down = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { w, h } = zone.size();
    const px = x <= 1 ? x * w : x;
    const py = y <= 1 ? y * h : y;
    const body = zone.register(el, {
      x: px,
      y: py,
      angle,
      shape,
      density,
      restitution,
      frictionAir,
      draggable,
      label,
    });
    onBody?.(body);
    return () => zone.unregister(body);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      className={`phys-body ${className ?? ""}`}
      onPointerDown={(e) => {
        down.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        if (!down.current || !onClick) return;
        const moved = Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y);
        down.current = null;
        if (moved < 6) onClick({ clientX: e.clientX, clientY: e.clientY });
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                const r = e.currentTarget.getBoundingClientRect();
                onClick({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 });
              }
            }
          : undefined
      }
    >
      <div className="phys-skin h-full w-full">{children}</div>
    </div>
  );
}
