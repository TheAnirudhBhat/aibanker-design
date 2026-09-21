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
  /** Draw this flag only while another flag's value passes `test` — a control
      that only means something on some variants is noise on the rest (R51). */
  showWhen?: { flag: string; test: (value: string) => boolean };
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
  // Ambient art explorations (see GENERATED_ASSETS.md). Goal objects are
  // travel-related; the scene is an independent choice.
  {
    id: "returnExp1V2RingArt",
    personaId: "return-exp1-v2",
    label: "Goal object",
    options: [
      { id: "flight", label: "Airplane", hint: "Pearl and periwinkle airliner" },
      { id: "holo", label: "Holo glass", hint: "Iridescent glass paper plane — the theme54 material" },
      { id: "luggage", label: "Carry-on", hint: "A soft lavender roller suitcase" },
      { id: "passport", label: "Passport", hint: "Periwinkle passport with a gold globe" },
      { id: "globe", label: "Globe", hint: "Blue and mint globe, looking toward Asia" },
    ],
  },
  {
    id: "returnExp1V2IconHolder",
    personaId: "return-exp1-v2",
    label: "Tracker icon holder",
    // The canon's skewed disc pair and the holographic tile are gone (user
    // call: confetti); of the flat set only the coin held up, of the tilted
    // coins only the edged one, and the holo glass once it took the tracker's
    // tone. Same /icons glyph throughout.
    options: [
      { id: "edge", label: "Coin · edge", hint: "A top-lit tone coin on its tinted shadow; the dark back disc peeks out as its thickness" },
      { id: "holo", label: "Holo glass", hint: "The frosted holo tile already in the tree, washed in the tracker's tone" },
      { id: "holo-lens", label: "Holo · lens", hint: "A domed cabochon of the same glass — one big specular, colour pooling at the edge" },
    ],
  },
  {
    id: "returnExp1V2HolderIcon",
    personaId: "return-exp1-v2",
    label: "Tracker icon",
    options: [
      { id: "food", label: "Food" },
      { id: "home", label: "Home" },
      { id: "flight", label: "Travel" },
      { id: "shopping", label: "Shopping" },
      { id: "tv", label: "Entertainment" },
    ],
  },
  {
    id: "returnExp1V2HolderColor",
    personaId: "return-exp1-v2",
    label: "Tracker colour",
    options: [
      { id: "valentino", label: "Valentino" },
      { id: "green", label: "Green" },
      { id: "red", label: "Red" },
      { id: "orange", label: "Orange" },
    ],
  },
  {
    id: "returnExp1V2Scene",
    personaId: "return-exp1-v2",
    label: "Ambient scene",
    options: [
      { id: "canon", label: "Current", hint: "The canon curtain — teal by day, charcoal by night" },
      { id: "aurora", label: "Aurora", hint: "Blurred ribbons of lilac, mint and aqua" },
      { id: "dawn", label: "Dawn", hint: "A soft bloom of first light, peach and rose lifting into lilac" },
      { id: "halo", label: "Halo", hint: "One soft Valentino glow with no edge" },
      { id: "bokeh", label: "Bokeh", hint: "Big out-of-focus discs of lilac, mint and aqua light" },
      { id: "mist", label: "Mist", hint: "Layered veils of pale light thinning into the sky" },
      { id: "beams", label: "Beams", hint: "Broad blurred shafts of aqua and lilac light" },
    ],
  },
  {
    id: "returnExp1V2BudgetState",
    // the White · Orb look lives on its own archived route now (user call: the
    // Home theme switcher left the panel; Ambient is the live page)
    personaId: "return-exp1-v2-orb",
    label: "Budget state",
    // The cube's liquid tells the state: aqua-violet on track, amber running
    // hot, red over budget (user call, R30).
    // R51 (user call): only the cube themes have a liquid to tint.
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

/** The flags a debug surface should draw: `showWhen` gates read the live values
 *  (an unset flag counts as its default). */
export function visibleProtoFlags(defs: ProtoFlagDef[], values: Record<string, string>): ProtoFlagDef[] {
  const valueOf = (id: string) => values[id] ?? PROTO_FLAGS.find((f) => f.id === id)?.options[0]?.id ?? "";
  return defs.filter((d) => !d.showWhen || d.showWhen.test(valueOf(d.showWhen.flag)));
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
