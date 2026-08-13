"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

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
    id: "returnExp1Nav",
    personaId: "return-exp1",
    label: "Page transition",
    options: [
      { id: "push", label: "Push", hint: "Rigid slabs slide full-width, right to left" },
      { id: "drift", label: "Drift", hint: "Crossfade + short horizontal drift" },
      { id: "hero", label: "Hero holds", hint: "Hero stays put, only cards push through" },
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
