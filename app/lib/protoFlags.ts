"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { PITCH_BG_PRESETS } from "./pitchBgPresets";

/**
 * Prototype flags — dev-only A/B switches a simulator owns itself.
 *
 * The existing substate controls (userStatePresets) patch UserState, so they only work for
 * personas that have a preset. Some sims (return-exp1) render straight from the route with
 * static content and still need comparable variants — motion treatments, layout experiments.
 * Those register here instead, and BOTH debug surfaces render them generically:
 * the desktop control column and the mobile 3-finger sheet.
 *
 * Values persist in localStorage so a variant survives a reload while you judge it.
 */

export type ProtoFlagOption = { id: string; label: string; hint?: string };

export type ProtoFlagDef = {
  id: string;
  personaId: string;
  label: string;
  /** First option is the default. */
  options: ProtoFlagOption[];
};

export const PROTO_FLAGS: ProtoFlagDef[] = [
  {
    id: "pitchBgVariant",
    personaId: "new-user-pitch",
    label: "Question background",
    // Options mirror the presets themselves, so ids and labels can't drift.
    // Original leads, which makes it the default (see useProtoFlag's fallback).
    options: PITCH_BG_PRESETS.map((p) => ({ id: p.id, label: p.label, hint: p.hint })),
  },
  {
    id: "returnExp1V2Entry",
    personaId: "return-exp1-v2",
    label: "Entry",
    // Feed leads (user call, 2026-09-08): opening the app should land straight
    // on the dashboard; Resume journey (canon 1905:32627) stays a flag away.
    options: [
      { id: "feed", label: "Feed", hint: "Straight to the dashboard" },
      { id: "resume", label: "Resume journey", hint: "Opens on the welcome-back chat" },
    ],
  },
  {
    id: "returnExp1V2Theme",
    personaId: "return-exp1-v2",
    label: "Home theme",
    // R31c (user call): Night/Compact/Aurora removed; the immersive matrix is
    // the exploration now — the three visualisations (cube, doughnut, crystal)
    // each on WHITE cards or on the canon COLOURED grounds, with the trip
    // wearing the torus gauge or the orb vessel.
    // Ambient leads (user call, 2026-09-16): fresh loads open on the scene.
    options: [
      { id: "ambient", label: "Ambient", hint: "2683:48642 — blush day, violet night, the goal in the ring" },
      { id: "canon", label: "Original", hint: "The shipped canon feed" },
      { id: "art54", label: "White · Torus", hint: "Shapes on white cards, trip wears the doughnut gauge" },
      { id: "art54orb", label: "White · Orb", hint: "Shapes on white cards, trip wears the liquid orb" },
      // the Colour grounds retired on user call (R34j) — git history keeps them
      { id: "art54compact", label: "Compact · 3D", hint: "Pink page, short cards, objects crop the edge (2596:136588)" },
    ],
  },
  {
    id: "returnExp1V2Intro",
    personaId: "return-exp1-v2",
    label: "Opening",
    // "Progress fill" (user call R34k): the page lands whole — cards WITH the
    // background — and the arrival is carried by the progress marks sweeping
    // to value (the budget line grows, the goal rings sweep up).
    options: [
      { id: "fill", label: "Progress fill", hint: "Cards land with the page; bars and rings sweep to value" },
      { id: "stagger", label: "Stagger", hint: "The shipped staggered rise" },
    ],
  },
  {
    id: "returnExp1V2Glow",
    personaId: "return-exp1-v2",
    label: "Head glow",
    // user call R34o: a wider gaussian so the bloom breathes across the card;
    // R34p adds light-legible variants (the white-mixed bloom vanished on white)
    options: [
      { id: "wide", label: "Wide", hint: "Blur 36 — the white-mixed bloom" },
      { id: "vivid", label: "Vivid", hint: "Pure colour, no white mix — reads on light" },
      { id: "halo", label: "Halo", hint: "A third bigger, colour-heavy, blur 44" },
      { id: "soft", label: "Soft", hint: "The shipped blur 20" },
    ],
  },
  {
    id: "returnExp1V2BudgetState",
    personaId: "return-exp1-v2",
    label: "Budget state",
    // The cube's liquid tells the state: aqua-violet on track, amber running
    // hot, red over budget (user call, R30).
    options: [
      { id: "ontrack", label: "On track", hint: "Aqua-violet liquid" },
      { id: "watch", label: "Running hot", hint: "Amber liquid" },
      { id: "over", label: "Over budget", hint: "Red liquid" },
    ],
  },
  {
    id: "returnExp1Bills",
    personaId: "return-exp1",
    label: "Upcoming payments",
    options: [
      { id: "off", label: "Off", hint: "Home skips the payments card" },
      { id: "on", label: "On", hint: "Home shows the calendar-tile payments card" },
    ],
  },
  {
    id: "returnExp1Chart",
    personaId: "return-exp1",
    label: "Spending trend",
    // On leads: the 1738:13113 feed ships the trend card by default (R15).
    options: [
      { id: "on", label: "On", hint: "Home shows the spending trend card" },
      { id: "off", label: "Off", hint: "Home skips the trend card" },
    ],
  },
  {
    id: "returnExp1Header",
    personaId: "return-exp1",
    label: "Header state",
    options: [
      { id: "neutral", label: "Neutral", hint: "Just the insight — nothing needs a decision" },
      { id: "action", label: "Needs action", hint: "Hero asks and offers prompts (Figma 1577:54844)" },
    ],
  },
];

export function protoFlagsFor(personaId: string): ProtoFlagDef[] {
  return PROTO_FLAGS.filter((f) => f.personaId === personaId);
}

const STORAGE_KEY = "proto.flags";

let values: Record<string, string> = {};
let hydrated = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Read localStorage once, AFTER mount — reading it during render would make the first
 *  client render disagree with the server's and trip a hydration mismatch. */
function hydrateOnce() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, string>;
      let changed = false;
      for (const def of PROTO_FLAGS) {
        const stored = parsed[def.id];
        // Ignore stale ids from a previous version of the flag.
        if (stored && def.options.some((o) => o.id === stored)) {
          values[def.id] = stored;
          changed = true;
        }
      }
      if (changed) notify();
    }
  } catch {
    // private mode / quota — flags just fall back to defaults
  }
}

export function setProtoFlag(flagId: string, optionId: string) {
  if (values[flagId] === optionId) return;
  values = { ...values, [flagId]: optionId };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    // non-fatal: the flag still applies for this session
  }
  notify();
}

/** Current value of a flag (its first option until something is chosen), plus a setter. */
export function useProtoFlag(flagId: string): [string, (optionId: string) => void] {
  const fallback = PROTO_FLAGS.find((f) => f.id === flagId)?.options[0]?.id ?? "";
  useEffect(() => {
    hydrateOnce();
  }, []);
  const value = useSyncExternalStore(
    subscribe,
    () => values[flagId] ?? fallback,
    () => fallback,
  );
  const set = useCallback((optionId: string) => setProtoFlag(flagId, optionId), [flagId]);
  return [value, set];
}

/** All of a persona's flags with their live values — for the debug surfaces. */
export function useProtoFlagValues(personaId: string): Record<string, string> {
  const defs = protoFlagsFor(personaId);
  useEffect(() => {
    hydrateOnce();
  }, []);
  const key = useSyncExternalStore(
    subscribe,
    () => defs.map((d) => `${d.id}:${values[d.id] ?? d.options[0]?.id}`).join("|"),
    () => defs.map((d) => `${d.id}:${d.options[0]?.id}`).join("|"),
  );
  // Rebuild from the serialized key so the returned object is stable per value-set.
  const out: Record<string, string> = {};
  for (const pair of key.split("|")) {
    if (!pair) continue;
    const idx = pair.indexOf(":");
    out[pair.slice(0, idx)] = pair.slice(idx + 1);
  }
  return out;
}
