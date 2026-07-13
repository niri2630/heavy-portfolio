# HEAVY — physics-playground portfolio (design spec)

Date: 2026-07-13 · Status: approved by Niriksh (pivot from "The Living Film")

## One-liner

One continuous physical world on graph paper. Every element — letters, cards,
crates, bricks — is a rigid body in Matter.js. Visitors don't browse the
portfolio; they handle it. Audience: developer peers; the goal is reputation
and shareability. Smoothness (60fps) is a hard requirement.

## Aesthetic — clay & glass on paper

Two material languages, strictly separated:

- **Clay = play.** Every physics body (letters, crates, bricks, fact cards,
  paper ball) is claymorphic: puffy rounded shapes, saturated candy fills,
  soft double shadow (outer drop + inner top highlight), and squash-and-
  stretch scaling on impact. Clay palette (6): coral `#FF6B6B`, tangerine
  `#FF9F43`, sunflower `#FFD93D`, mint `#6BCB77`, sky `#4D96FF`, grape
  `#B39DDB`. Ink `#2A2438` for text on clay/paper.
- **Glass = chrome.** Everything you read through or navigate with — nav
  pill, physics HUD tooltip, case-study overlay, contact panel, mute toggle —
  is frosted glass: translucent white, `backdrop-blur`, 1px light border,
  soft elevation.
- **Stage:** cream paper `#FAF6EF` with a faint engineering grid `#E4DFD4`;
  the colorful clay pops against it.
- Type: Bricolage Grotesque (display), IBM Plex Mono (labels/HUD gags),
  Geist (body).
- Signature gag: while dragging any body, a glass HUD tooltip shows live
  `m=…kg · v=…px/s · θ=…°` from the engine.

## Sound (WebAudio, synthesized — no audio files)

- Impact thuds: low sine+noise burst, gain scaled by collision velocity.
- Grab pop / release boing (short pitch-bend), UI glass click, chute chime.
- Armed only after the first user gesture (autoplay policy); glass mute
  toggle in the nav; `prefers-reduced-motion` also defaults sound off.

## Zones (one page, top → bottom)

1. **THE DROP (hero)** — `NIRIKSH` letters are bodies that free-fall, bounce,
   settle into a pile. Grab/throw. `↺ RE-DROP` lever resets. Tagline stamps in:
   "Full-stack developer. Everything I build has weight."
2. **THE DESK (about)** — readable intro (taped paper, always static) + fact
   cards (Mumbai · crew of one · disciplines) as flickable bodies on a shelf line.
3. **THE SHELF (work)** — 4 project crates (Frush, Claybag, Pamperazzi,
   Famcare) on shelf lines; draggable/knockable. Click ⇒ opens a static,
   readable case card (what, role, stack, status). Chaos to play, calm to read.
4. **THE PILE (stack)** — skill tags as bricks in a stenciled bin; stack and
   topple. Groups: mobile / frontend / backend / infra.
5. **THE CHUTE (contact)** — toss the paper ball into a drawn chute ⇒ links
   unfurl (email, GitHub, LinkedIn). Plain-text links always present too.
6. **Footer sticker** — mono: `built by hand · no component library ·
   60fps or refund`.

Scroll applies a gentle impulse to on-screen bodies so the world feels
continuous while moving through it.

## Tech

- Keep: Next.js 16 App Router, TS strict, Tailwind v4, GSAP + Lenis, pnpm.
- Add: `matter-js` (+ types). No component/animation libraries (Aceternity,
  Magic UI, shadcn etc. are explicitly out — audience would clock them).
- Remove: film components (FrameScene, HUD, letterbox, grain, filmstrip…),
  `public/film/*` frames. Seedance source mp4s stay in `raw/` (gitignored);
  extraction scripts stay for potential future use.

## Smoothness contract (hard requirements)

- Fixed-timestep physics (120Hz accumulator) + render interpolation;
  DOM sync via `transform: translate3d(…) rotate(…)` only (no layout props).
- Bodies are real DOM elements (text selectable, crisp at any DPR).
- Per-zone engines; a zone's engine runs only while the zone is near the
  viewport (IntersectionObserver, margin one viewport); bodies allowed to sleep.
- ≤ 60 active bodies at any moment; pointer events unified mouse/touch.
- Drag via Matter constraint (springy, weighty feel), not position teleport.

## Fallbacks / a11y / SEO

- `prefers-reduced-motion` or no-JS: fully settled static layout, everything
  readable; physics is pure enhancement. Content is always real DOM text.
- Interactive objects also exist as plain links/buttons; the game never gates
  information. Skip link, anchor ids per zone, keyboard reachable.
- metadata/OG, sitemap.ts, robots.ts. Title: "Niriksh — Full-Stack & Mobile
  Developer".

## Definition of done

- [ ] pnpm build clean (TS + ESLint zero errors)
- [ ] Hero letters drop/settle at 60fps desktop; no visible jank on scroll
- [ ] All five interactions work with mouse AND touch
- [ ] Physics HUD gag live while dragging
- [ ] Reduced-motion path fully readable, zero motion
- [ ] 390px and 1440px flawless; no horizontal overflow
- [ ] Lighthouse (mobile): a11y & SEO ≥ 95
