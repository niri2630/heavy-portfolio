"use client";

import { useSyncExternalStore } from "react";
import { chime } from "@/lib/sound";

/**
 * Achievements — tiny gamification layer. Unlocks persist in localStorage,
 * fire a glass toast + chime, and the nav shows a trophy counter.
 */

export const ACHIEVEMENTS = {
  "first-grab": "first grab — you touched the physics",
  "re-drop": "director's cut — re-dropped the title",
  "all-facts": "fact checker — popped every balloon",
  "claw-master": "claw master — opened every project",
  "tower-2m": "civil engineer — 2m skill tower",
  "buckets": "buckets — 3 hoops scored",
} as const;

export type AchievementId = keyof typeof ACHIEVEMENTS;

const KEY = "heavy-achievements";

type State = { unlocked: AchievementId[]; toast: string | null };

let state: State = { unlocked: [], toast: null };
const listeners = new Set<() => void>();
let toastTimer: ReturnType<typeof setTimeout> | null = null;
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...state, unlocked: JSON.parse(raw) as AchievementId[] };
  } catch {
    /* private mode etc. — achievements just don't persist */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function unlock(id: AchievementId): void {
  load();
  if (state.unlocked.includes(id)) return;
  state = {
    unlocked: [...state.unlocked, id],
    toast: `🏆 ${ACHIEVEMENTS[id]}`,
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state.unlocked));
  } catch {
    /* non-persistent is fine */
  }
  chime();
  emit();
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    state = { ...state, toast: null };
    emit();
  }, 3200);
}

export function isUnlocked(id: AchievementId): boolean {
  load();
  return state.unlocked.includes(id);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const empty: State = { unlocked: [], toast: null };

export function useAchievements(): State {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => empty,
  );
}

export const TOTAL = Object.keys(ACHIEVEMENTS).length;
