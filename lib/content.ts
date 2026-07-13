/**
 * lib/content.ts — every word on the site lives here; components stay dumb.
 * Voice: playful, confident, short. This is a physics toy that happens to be
 * a portfolio — copy should wink, never beg.
 */

export const site = {
  title: "Niriksh — Full-Stack & Mobile Developer",
  description:
    "HEAVY — a physics playground portfolio. Niriksh builds full-stack and mobile software end to end. Grab something and throw it.",
  url: "https://niriksh.com",
  email: "hello@niriksh.com", // [EMAIL] placeholder
  github: "https://github.com/niriksh", // [GITHUB_URL] placeholder
  linkedin: "https://www.linkedin.com/in/niriksh", // [LINKEDIN_URL] placeholder
  location: "Mumbai, India",
} as const;

export type ClayColor =
  | "coral"
  | "tangerine"
  | "sunflower"
  | "mint"
  | "sky"
  | "grape";

/* ─────────────── THE DROP (hero) ─────────────── */

export const hero = {
  letters: ["N", "I", "R", "I", "K", "S", "H"] as const,
  letterColors: [
    "coral",
    "tangerine",
    "sunflower",
    "mint",
    "sky",
    "grape",
    "coral",
  ] as ClayColor[],
  tagline: "Full-stack developer.",
  taglineB: "Everything I build has weight.",
  hint: "grab a letter · throw it · nothing breaks",
  redrop: "re-drop",
} as const;

/* ─────────────── THE DESK (about) ─────────────── */

export const about = {
  zone: "01 · the desk",
  heading: "One person. Whole products.",
  body: [
    "I'm Niriksh — a full-stack and mobile developer, currently a Software Engineer at Claybag. I design, build, and ship complete products end to end: mobile apps, web platforms, and the backends that run them.",
    "No hand-offs. No gaps between design and engineering. Just one person who cares about how software feels — right down to how much it weighs.",
  ],
  facts: [
    { text: "SWE @ Claybag", color: "coral" as ClayColor },
    { text: "Based in Mumbai", color: "sky" as ClayColor },
    { text: "Mobile + Web + Backend", color: "mint" as ClayColor },
    { text: "Ships end to end", color: "sunflower" as ClayColor },
  ],
  experience: [
    {
      period: "Mar 2026 — now",
      role: "Software Engineer",
      org: "Claybag",
      where: "claybag.com",
      stack: "Full stack · Commerce",
    },
    {
      period: "Aug 2025 — Mar 2026",
      role: "Software Engineer",
      org: "Frush",
      where: "Bengaluru",
      stack: "React Native · Flutter · Laravel",
    },
    {
      period: "Feb — Aug 2025",
      role: "Full-Stack Intern",
      org: "Terabite",
      where: "Bengaluru",
      stack: "Full stack · System design · Scalability",
    },
    {
      period: "Mar — Aug 2024",
      role: "Technical Intern",
      org: "Sellingly",
      where: "Remote",
      stack: "Firebase · AngularJS · CSS",
    },
  ],
} as const;

/* ─────────────── THE SHELF (work) ─────────────── */

export type Project = {
  slug: string;
  title: string;
  emojiFree: string; // short mono glyph label for the crate face
  what: string;
  role: string;
  stack: string[];
  status: string;
  color: ClayColor;
};

export const workZone = {
  zone: "02 · the shelf",
  heading: "Things I've shipped.",
  hint: "drag a crate · click to open",
} as const;

export const work: Project[] = [
  {
    slug: "frush",
    title: "Frush",
    emojiFree: "FR",
    what: "A 10-minute food delivery app — real-time ordering, live tracking, and dispatch, built cross-platform for iOS and Android.",
    role: "Software Engineer",
    stack: ["React Native", "Flutter", "Laravel"],
    status: "shipped",
    color: "coral",
  },
  {
    slug: "bitez",
    title: "Bitez",
    emojiFree: "BZ",
    what: "A mobile app for discovering and ordering food — designed, built, and shipped as a personal product.",
    role: "Creator",
    stack: ["React Native", "Node.js", "MongoDB"],
    status: "case study soon",
    color: "sunflower",
  },
  {
    slug: "claybag",
    title: "Claybag",
    emojiFree: "CB",
    what: "Branding and merch commerce for early-stage startups — storefront, catalog, and checkout in one platform. Where I work now.",
    role: "Software Engineer",
    stack: ["Next.js", "FastAPI", "PostgreSQL"],
    status: "shipping now",
    color: "sky",
  },
  {
    slug: "pamperazzi",
    title: "Pamperazzi",
    emojiFree: "PZ",
    what: "A luxury salon gifting platform — bookings and gift experiences designed for premium salons.",
    role: "Full-stack & mobile",
    stack: ["Flutter", "FastAPI", "PostgreSQL"],
    status: "case study soon",
    color: "grape",
  },
  {
    slug: "famcare",
    title: "Famcare",
    emojiFree: "FC",
    what: "Family care, built in Flutter — coordinating everyday care for the people who matter.",
    role: "Mobile",
    stack: ["Flutter", "GCP"],
    status: "case study soon",
    color: "mint",
  },
];

/* ─────────────── THE PILE (stack) ─────────────── */

export const stackZone = {
  zone: "03 · the pile",
  heading: "The bricks I build with.",
  hint: "stack them · knock them over",
} as const;

export const bricks: { text: string; group: string; color: ClayColor }[] = [
  { text: "React Native", group: "mobile", color: "coral" },
  { text: "Flutter", group: "mobile", color: "sky" },
  { text: "Android", group: "mobile", color: "mint" },
  { text: "iOS", group: "mobile", color: "grape" },
  { text: "Next.js", group: "frontend", color: "mint" },
  { text: "React", group: "frontend", color: "sunflower" },
  { text: "TypeScript", group: "frontend", color: "tangerine" },
  { text: "Tailwind", group: "frontend", color: "sky" },
  { text: "Node.js", group: "backend", color: "coral" },
  { text: "Laravel", group: "backend", color: "tangerine" },
  { text: "FastAPI", group: "backend", color: "mint" },
  { text: "MongoDB", group: "backend", color: "grape" },
  { text: "PostgreSQL", group: "backend", color: "sky" },
  { text: "Firebase", group: "backend", color: "sunflower" },
  { text: "AWS", group: "infra", color: "tangerine" },
  { text: "GCP", group: "infra", color: "sky" },
  { text: "System Design", group: "infra", color: "coral" },
  { text: "CI/CD", group: "infra", color: "mint" },
];

/* ─────────────── THE CHUTE (contact) ─────────────── */

export const contactZone = {
  zone: "04 · the chute",
  heading: "Got something heavy to build?",
  sub: "Toss me a line. I read everything.",
  links: [
    { label: "email", href: `mailto:${site.email}`, display: "hello@niriksh.com", color: "coral" as ClayColor },
    { label: "github", href: site.github, display: "github.com/niriksh", color: "sky" as ClayColor },
    { label: "linkedin", href: site.linkedin, display: "in/niriksh", color: "mint" as ClayColor },
  ],
} as const;

export const footer = {
  sticker: "built by hand · no component library · 60fps or refund",
  copyright: `© ${new Date().getFullYear()} Niriksh · Mumbai, India`,
} as const;

/** Nav — glass pill anchors. */
export const nav = [
  { id: "about", label: "about" },
  { id: "work", label: "work" },
  { id: "stack", label: "stack" },
  { id: "contact", label: "contact" },
] as const;
