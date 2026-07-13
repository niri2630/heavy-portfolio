/**
 * lib/content.ts — every word on the site lives here. Nothing is hardcoded in
 * components. Voice: declarative, short, filmic. (See COPY BAN LIST in spec.)
 */

export const site = {
  title: "Niriksh — Full-Stack & Mobile Developer",
  description:
    "THE LIVING FILM — a scroll-driven portfolio. Full-stack and mobile software, written, directed, and shipped by one person.",
  url: "https://niriksh.com",
  email: "hello@niriksh.com", // [EMAIL] placeholder
  github: "https://github.com/niriksh", // [GITHUB_URL] placeholder
  linkedin: "https://www.linkedin.com/in/niriksh", // [LINKEDIN_URL] placeholder
  location: "Mumbai, India",
} as const;

/** Fake runtime the timecode HUD counts toward: 02:47 (mm:ss). */
export const runtime = { minutes: 2, seconds: 47, fps: 24 } as const;

export const boot = {
  presents: ["NIRIKSH", "PRESENTS"],
  cue: "scroll to begin ↓",
} as const;

/** Scene A — title lines keyed to scrub progress (0..1). */
export const sceneA = {
  label: "SCENE A",
  lines: [
    { at: [0.1, 0.3] as const, text: "Full-stack." },
    { at: [0.35, 0.55] as const, text: "Mobile." },
    { at: [0.6, 0.9] as const, text: "Cinema-grade software." },
  ],
} as const;

export const interlude = {
  headline: ["EVERY FRAME", "MATTERS."],
  paragraph:
    "I build software the way films are made — obsessing over every frame. Apps, platforms, backends. Written, directed, and shipped by one person.",
} as const;

/** Scene B — skill captions, appear as sequential subtitles. */
export const sceneB = {
  label: "SCENE B",
  subtitles: [
    "React Native · Flutter",
    "Next.js · React · Vue",
    "FastAPI · Node.js · PostgreSQL",
    "AWS · GCP · CI/CD",
  ],
} as const;

/** Selected works — chapter cards. Structure ready for future /work/[slug]. */
export type Chapter = {
  index: string;
  slug: string;
  title: string;
  line: string;
  badge: string;
};

export const works: Chapter[] = [
  {
    index: "CH.01",
    slug: "frush",
    title: "Frush",
    line: "10-minute food delivery, cross-platform.",
    badge: "CHAPTER COMING SOON",
  },
  {
    index: "CH.02",
    slug: "claybag",
    title: "Claybag",
    line: "Branding & merch commerce for startups.",
    badge: "CHAPTER COMING SOON",
  },
  {
    index: "CH.03",
    slug: "pamperazzi",
    title: "Pamperazzi",
    line: "Luxury salon gifting platform.",
    badge: "CHAPTER COMING SOON",
  },
  {
    index: "CH.04",
    slug: "famcare",
    title: "Famcare",
    line: "Family care, built in Flutter.",
    badge: "CHAPTER COMING SOON",
  },
];

export const sceneC = {
  label: "SCENE C",
  line: "The best part of any film is what comes next.",
} as const;

/** Credits roll — ordered blocks. */
export type CreditBlock =
  | { kind: "title"; text: string }
  | { kind: "role"; role: string; name: string }
  | { kind: "list"; role: string; names: string[] }
  | { kind: "location"; text: string };

export const credits: CreditBlock[] = [
  { kind: "title", text: "A NIRIKSH PRODUCTION" },
  { kind: "role", role: "Directed by", name: "NIRIKSH" },
  { kind: "role", role: "Written by", name: "NIRIKSH" },
  { kind: "role", role: "Engineered by", name: "NIRIKSH" },
  {
    kind: "list",
    role: "Starring",
    names: ["React Native", "Flutter", "Next.js", "FastAPI", "PostgreSQL"],
  },
  {
    kind: "list",
    role: "Supporting",
    names: [
      "TypeScript",
      "Tailwind",
      "Node.js",
      "Vue.js",
      "AWS",
      "GCP",
      "Vercel",
      "Git",
      "CI/CD",
    ],
  },
  { kind: "location", text: "Filmed on location in Mumbai, India" },
];

export const cta = {
  headline: "BOOK THE SEQUEL",
  links: [
    { label: "Email", href: `mailto:${site.email}` },
    { label: "GitHub", href: site.github },
    { label: "LinkedIn", href: site.linkedin },
  ],
} as const;

export const postCredits = {
  line: "He's still shipping.",
} as const;

/** Ordered scene metadata used by the HUD scene label + anchor ids. */
export const chapters = [
  { id: "boot", label: "BOOT" },
  { id: "scene-a", label: "SCENE A" },
  { id: "interlude", label: "INTERLUDE" },
  { id: "scene-b", label: "SCENE B" },
  { id: "works", label: "SELECTED WORKS" },
  { id: "scene-c", label: "SCENE C" },
  { id: "credits", label: "CREDITS" },
] as const;
