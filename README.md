# HEAVY — Niriksh's physics-playground portfolio

A portfolio you don't browse — you **play** it. Every element is a rigid body
in a Matter.js world, styled as claymorphic toys on graph paper, with
synthesized sound effects and an achievement system. Built for developer
peers: grab something and throw it.

**Stack:** Next.js 16 (App Router) · TypeScript strict · Tailwind v4 ·
Matter.js · WebAudio (zero audio files) · no component libraries.

## The games

| Zone | Game | Physics |
|---|---|---|
| The Drop (hero) | letter-rain playground, re-drop lever | gravity + throwing |
| The Desk (about) | balloon pop — collect the facts | inverted gravity (buoyancy) |
| The Shelf (work) | claw machine — win a case study | kinematic gantry + constraint |
| The Pile (stack) | tower builder — 2m goal, wind test | precision stacking |
| The Chute (contact) | hoops — rim physics, swish detection | projectile |

6 achievements persist in `localStorage` (🏆 counter in the nav).

## Engineering notes

- **Smoothness contract:** fixed 120 Hz physics timestep with accumulator +
  render interpolation; DOM sync via `translate3d`/`rotate` only; engines run
  per-zone and only near the viewport (IntersectionObserver); bodies sleep.
- **Game juice:** velocity-scaled collision thuds, squash-and-stretch,
  impact dust, screen shake, ball trails, ground shadows that detach when
  bodies go airborne (the 3D illusion).
- **Sound:** all effects synthesized with WebAudio oscillators/noise — thud,
  pop, boing, click, chime. Armed on first gesture; mute toggle in nav.
- **A11y / fallbacks:** `prefers-reduced-motion` renders every zone settled
  and static; all content is real DOM text; games never gate information
  (see the claw machine's "no quarters?" cheat codes); skip link; Esc closes
  dialogs.

## Develop

```bash
pnpm install
pnpm dev    # http://localhost:3000
pnpm build  # production build (static)
```

## Deploy

Deployed on Vercel — push to `master` and the connected project rebuilds, or:

```bash
vercel --prod
```

## Content

All copy, projects, experience, links: [`lib/content.ts`](lib/content.ts).
Placeholders to fill in when ready: `[EMAIL]`, `[GITHUB_URL]`,
`[LINKEDIN_URL]` (marked in comments there), plus a real `/public/og.jpg`.

---

Directed, written, and engineered by **Niriksh** · Mumbai, India
