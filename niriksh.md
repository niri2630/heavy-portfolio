You are building my production portfolio website: "THE LIVING FILM".
Work in phases, commit after each phase, and self-verify against the
DEFINITION OF DONE at the end. Do not ask me questions — make the call
and note it in the README. Do not add libraries beyond the listed deps.

━━━ CONCEPT ━━━
The site IS a scroll-driven short film. Scroll = playhead. Three video
scenes scrub frame-by-frame on <canvas> (Apple product-page technique),
interludes are kinetic typography, it ends in a credits roll. Dark,
letterboxed, film grain, timecode HUD. Premium and restrained — think
A24 title sequence, not a template.

━━━ PHASE 1 — SCAFFOLD ━━━
- pnpm create next-app: Next.js 15 App Router, TypeScript strict,
  Tailwind CSS v4, ESLint, src/ dir off, import alias @/*
- Deps: gsap @gsap/react lenis clsx (nothing else — no three.js, no
  framer-motion)
- Fonts via next/font/google: Instrument_Serif (display),
  Geist (body), Geist_Mono (HUD/timecode)
- Design tokens in globals.css:
  --ink:#0B0B0C (bg) --bone:#EDE8DF (text) --dim:#8A857C (captions)
  --rec:#E5484D (REC dot) letterbox bars pure #000, grain opacity .06
- lib/gsap.ts: register ScrollTrigger + SplitText once
- lib/lenis.ts: <SmoothScroll> provider — lenis instance,
  lenis.on('scroll', ScrollTrigger.update),
  gsap.ticker.add(t => lenis.raf(t*1000)), gsap.ticker.lagSmoothing(0)
- lib/content.ts: ALL copy, credits, chapter data live here — nothing
  hardcoded in components

━━━ PHASE 2 — FRAME-SCRUB ENGINE (the core) ━━━
components/film/useFrameSequence.ts + FrameScene.tsx:
- Reads /public/film/manifest.json:
  { "scene-a": { "frames":120, "width":1280, "height":720,
    "placeholder":true }, ... } for scenes a, b, c
- If placeholder:false → fetch /film/<scene>/frame-0001.webp … via
  createImageBitmap, decode lazily, per-scene loading progress shown as
  a tiny "LOADING REEL ◌" line in the HUD; release bitmaps
  (bitmap.close()) when a scene is >1 viewport away
- If placeholder:true → NO network: render procedural frames — a
  deterministic function of (sceneId, frameIndex): slow hue-shifting
  gradient + film-burn flicker + huge dim scene label ("SCENE A").
  The whole site must be fully experiencable with zero media files.
- Draw: full-bleed canvas, cover-fit math, devicePixelRatio capped at
  2, redraw ONLY when frame index changes, recompute on resize
- Each video scene: section pinned by ScrollTrigger, scrub:true,
  end:"+=350%", frameIndex = round(progress*(frames-1))
- Preload strategy: current scene + next scene only

━━━ PHASE 3 — THE FILM (scenes in order, one component each) ━━━
Persistent chrome: <Hud> (Geist Mono: timecode MM:SS:FF at 24fps
mapped from total page progress to a fake 02:47 runtime · scene label ·
blinking ● REC), <Letterbox> (black bars framing a 2.35:1 window over
video scenes, animating in/out), <Grain> (SVG turbulence overlay),
<FilmstripProgress> (right edge, sprocket-hole style progress).

00 BOOT — black; grain flickers on; SplitText staggers
   "NIRIKSH" / "PRESENTS"; then "scroll to begin ↓" pulsing in mono.
01 SCENE A [scene-a] — title rides the shot, keyed to progress:
   10–30%: "Full-stack." 35–55%: "Mobile." 60–90%: "Cinema-grade
   software." Each line blurs/tracks in via SplitText chars.
02 INTERLUDE — pinned; oversized kinetic type: "EVERY FRAME" /
   "MATTERS." then paragraph: "I build software the way films are
   made — obsessing over every frame. Apps, platforms, backends.
   Written, directed, and shipped by one person."
03 SCENE B [scene-b] — skill captions appear as subtitles, bottom
   center, sequential: "React Native · Flutter" → "Next.js · React ·
   Vue" → "FastAPI · Node.js · PostgreSQL" → "AWS · GCP · CI/CD"
04 SELECTED WORKS — horizontal scroll (ScrollTrigger
   containerAnimation), 4 chapter cards from content.ts:
   CH.01 FRUSH "10-minute food delivery, cross-platform."
   CH.02 CLAYBAG "Branding & merch commerce for startups."
   CH.03 PAMPERAZZI "Luxury salon gifting platform."
   CH.04 FAMCARE "Family care, built in Flutter."
   Each card: index, title (Instrument Serif), one-liner, badge
   "CHAPTER COMING SOON". Structure ready for future /work/[slug].
05 SCENE C [scene-c] — finale; single line near end: "The best part
   of any film is what comes next."
06 CREDITS — scroll-driven roll: "A NIRIKSH PRODUCTION" / Directed by
   NIRIKSH / Written by NIRIKSH / Engineered by NIRIKSH / STARRING:
   React Native, Flutter, Next.js, FastAPI, PostgreSQL / SUPPORTING:
   TypeScript, Tailwind, Node.js, Vue.js, AWS, GCP, Vercel, Git,
   CI/CD / FILMED ON LOCATION IN Mumbai, India / then CTA "BOOK THE
   SEQUEL" → [EMAIL], [GITHUB_URL], [LINKEDIN_URL] placeholders.
POST-CREDITS — beat of black after the roll, then small mono line:
   "He's still shipping." with a blinking cursor.

━━━ PHASE 4 — FALLBACKS, A11Y, SEO ━━━
- prefers-reduced-motion (and no-JS via <noscript>): render
  <Editorial/> instead — a clean static one-pager with ALL the same
  content; no pinning, no canvas
- Canvases aria-hidden; real text stays real text; skip-to-content
  link; anchor ids per scene (#works, #credits) reachable by keyboard
- metadata export (title "Niriksh — Full-Stack & Mobile Developer",
  description, OG tags → /public/og.jpg placeholder), sitemap.ts,
  robots.ts, favicon
- Mobile: 100svh everywhere, HUD legible at 380px, no horizontal
  overflow, test pinning on short viewports

━━━ PHASE 5 — TOOLING + VERIFY ━━━
- scripts/extract-frames.sh:
  ffmpeg -i $1.mp4 -vf "fps=24,scale=1280:-2" -c:v libwebp -quality 80
  public/film/$1/frame-%04d.webp
- scripts/build-manifest.mjs: counts frames per scene folder, reads
  dimensions, writes manifest.json with placeholder:false
- README: how to drop in the 3 real mp4s, run both scripts, deploy to
  Vercel

━━━ DEFINITION OF DONE (verify each, fix until true) ━━━
[ ] pnpm build passes, zero TS/ESLint errors
[ ] Full film scrubs smoothly with ZERO media files (procedural mode)
[ ] Frame draws only on index change; resize-safe; DPR capped
[ ] Reduced-motion path shows all content statically
[ ] 380px and 1440px both flawless; no scroll jank on mobile emulation
[ ] Timecode, REC dot, letterbox, grain, filmstrip progress all live
[ ] Credits roll + post-credits beat work end to end
[ ] Lighthouse (mobile): a11y & SEO ≥ 95, perf ≥ 85 in procedural mode
 #rules -
DESIGN LOCK — these rules override all earlier styling decisions.
When in doubt: remove, don't add.

TYPOGRAPHY (this is the whole personality — get it exact)
- Two families only. Display: Instrument Serif 400, real italics for
  emphasis words. Everything else: Geist; HUD/labels: Geist Mono.
  Never faux-bold or faux-italic.
- Fluid scale:
  display-xl clamp(3.5rem,12vw,11rem) · line-height .92 · tracking -0.02em
  display    clamp(2.25rem,6vw,5rem)  · lh .95 · tracking -0.015em
  body       clamp(1rem,1.1vw,1.125rem) · lh 1.6 · max-width 42ch
  subtitle   0.8125rem Geist · lh 1.4
  hud        0.6875rem Geist Mono · UPPERCASE · tracking +0.08em ·
             tabular-nums (font-feature "tnum" — timecode must not jitter)
- text-wrap: balance on headings, pretty on paragraphs; kill widows
  in every display line
- All-caps lives ONLY in mono HUD/labels; the serif is never set in caps

COLOR & TEXTURE
- Exactly 4 values: #0B0B0C ink · #EDE8DF bone · #8A857C dim ·
  #E5484D rec. No other hue anywhere in UI. No gradients (procedural
  placeholder frames excepted), no glassmorphism, no card shadows, no
  borders brighter than #1E1D1B, no emoji, no icon packs.
- Grain ≤ 0.05 opacity. Vignette barely perceptible.

MOTION DISCIPLINE (film cuts, not web bounces)
- Permitted eases only: power2.out entrances, power1.inOut for
  scroll-linked moves, expo.out for the boot title. Nothing elastic,
  no bounce, no yoyo, no rotation gimmicks.
- Durations 0.6–1.2s; SplitText stagger 0.04–0.08 max.
- One system animates at a time. Letterbox + HUD change only at
  scene boundaries.

LAYOUT
- 12-col grid: 24px gutters mobile, 80px margins desktop. Text sits
  ON the grid — not everything centered.
- Whitespace is the luxury: ≥30vh breathing room between text blocks.
- border-radius: 0 everywhere. Chapter cards = hairline #1E1D1B rule +
  mono index + serif title. No card backgrounds.

COPY BAN LIST (delete on sight)
"passionate", "crafting", "delightful", "pixel-perfect", "digital
experiences", "let's connect", rockets, sparkles. Voice: declarative,
short, filmic.

FINAL PASS
Typography audit: no orphans in display lines, baseline rhythm
consistent, HUD grid-aligned, timecode tabular. Screenshot every
scene at 390px and 1440px; fix anything that looks off before done.