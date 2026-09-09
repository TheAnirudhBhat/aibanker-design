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
    id: "returnExp1V2Skin",
    personaId: "return-exp1-v2",
    label: "Feed skin",
    // R29 exploration, narrowed R29b (user call): the canon baseline and one
    // aurora skin — frosted glass with barely-there mesh tints. Both hold in
    // light and dark; hierarchy and copy never change.
    options: [
      { id: "canon", label: "Original", hint: "The shipped canon feed" },
      { id: "aurora", label: "Aurora", hint: "Frosted glass, subtle mesh tints" },
    ],
  },
  {
    id: "returnExp1V2Chart",
    personaId: "return-exp1-v2",
    label: "Chart style",
    // R29 exploration #2: five materials for the SAME bars + progress —
    // styling only, never representation.
    options: [
      { id: "canon", label: "Original", hint: "Gradient bars, soft fill" },
      { id: "real", label: "Realistic", hint: "Lit columns with depth" },
      { id: "glass", label: "Glass", hint: "Translucent bars, specular top" },
      { id: "metal", label: "Metal", hint: "Brushed specular bands" },
      { id: "minimal", label: "Minimal", hint: "Quiet thin sticks" },
      { id: "graph", label: "Graph", hint: "Technical outline bars" },
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
