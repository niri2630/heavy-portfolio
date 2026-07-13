"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

// Register plugins exactly once, guarded for HMR / repeated imports.
if (typeof window !== "undefined" && !(gsap.core as unknown as { _livingFilm?: boolean })._livingFilm) {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  (gsap.core as unknown as { _livingFilm?: boolean })._livingFilm = true;
}

export { gsap, ScrollTrigger, SplitText };
