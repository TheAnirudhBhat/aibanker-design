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
    id: "returnExp1V2Scene",
    personaId: "return-exp1-v2",
    label: "Top background",
    // Back in the panel on user call (it left in R73). "Off" is the default and
    // keeps the page exactly as it is: no scene attribute, so no top art at all.
    // Cut twice on the designer's call (2026-09-22): first to five, then again
    // when the whole grid/dots/pixels family went — Grid, Grid · liquid,
    // Grid · vignette, Dots ×3 and Pixels ×4 are all gone, and the set went
    // DEEP on aurora rather than wide across motifs. The generated Dawn, Halo,
    // Bokeh, Mist and Beams keep their files and their globals.css rules,
    // dormant, exactly as they sat before R73.
    // Everything but Aurora is drawn in CSS, which is the point: the canon
    // Aurora is a generated PNG and cannot be retuned, the variations can.
    options: [
      { id: "off", label: "Off", hint: "No scene — the page ground runs to the top edge" },
      { id: "aurora", label: "Aurora", hint: "The generated 2026-09-18 scene, unchanged" },
      { id: "aurora2", label: "Aurora 2", hint: "The designer's own art in light; dark redraws its composition for the night" },
      { id: "aurora-soft", label: "Aurora · soft", hint: "The lighter Aurora: the same ribbons drawn instead of loaded" },
      { id: "aurora-veil", label: "Aurora · veil", hint: "The classic curtain — four tall falls, mint through violet" },
      { id: "aurora-dusk", label: "Aurora · dusk", hint: "The warm register: rose and amber climbing into violet" },
    ],
  },
  {
    id: "returnExp1V2IconHolder",
    personaId: "return-exp1-v2",
    label: "Tracker icon holder",
    // Back on user call after briefly leaving the panel. Gone with it (git
    // history keeps them): the canon's skewed disc pair, the flat set, the four
    // frameless glyph reads and the four avatar treatments. What stays is the
    // tilted edged coin, the two holo-glass panes, the avatar at its two sizes,
    // and — back on canon 3115:92873 — the plainest of the frameless reads.
    options: [
      { id: "edge", label: "Coin · edge", hint: "A top-lit tone coin on its tinted shadow; the dark back disc peeks out as its thickness" },
      { id: "holo", label: "Holo glass", hint: "The frosted holo tile, washed in the tracker's tone, the card showing through" },
      { id: "holo-lens", label: "Holo · lens", hint: "A domed cabochon of the paper plane's glass — one big specular, colour pooling at the edge" },
      { id: "avatar", label: "Avatar", hint: "The DLS bold avatar at 48 — a flat tone disc, no tilt" },
      { id: "avatar-40", label: "Avatar · small", hint: "The same avatar at 40, so more of the ring's hole shows around it" },
      { id: "glyph", label: "Bare glyph", hint: "No holder at all — the glyph alone at the canon's 32, in the tracker's colour (3115:92873)" },
    ],
  },
  {
    id: "returnExp1V2Banks",
    personaId: "return-exp1-v2",
    label: "Linked banks",
    // user call (2026-09-23): the bank page's states — three banks (the
    // default), one bank (of its two layouts the row won; the account-as-head
    // one is gone), and three where one bank fails to fetch
    options: [
      { id: "three", label: "3 banks", hint: "The total over three linked accounts, each listed under it" },
      { id: "one-row", label: "1 bank", hint: "The page keeps its shape: a Balance head over a single Bank account row" },
      { id: "failed", label: "3 banks · 1 failed", hint: "SBI xx8846's latest fetch failed: its row shows the balance from 3 days ago on a red dot, and the total counts it" },
    ],
  },
  {
    id: "returnExp1V2BankChart",
    personaId: "return-exp1-v2",
    label: "Bank balance graph",
    // off for now (user call, 2026-09-23); on brings back canon 2943:89776's line
    options: [
      { id: "off", label: "Off", hint: "The bank page goes straight from the balance to the accounts" },
      { id: "on", label: "On", hint: "Six months of balances as one scrubbable line under the total" },
    ],
  },
  {
    id: "returnExp1V2BudgetHistory",
    personaId: "return-exp1-v2",
    label: "Budget history avatar",
    // user call (2026-09-23): the month's short name in the avatar only
    // repeated the title — none, or something the row doesn't already say
    options: [
      { id: "icon", label: "Outcome", hint: "A tick on green when the month ended under budget, the attention mark on red when it went over" },
      { id: "none", label: "None", hint: "The month's name leads the row, nothing beside it" },
      { id: "dot", label: "Dot", hint: "A small green or red dot on the month's name, the months joined by a line" },
    ],
  },
  {
    id: "returnExp1V2CashflowCard",
    personaId: "return-exp1-v2",
    label: "Cashflow card",
    // user call (2026-09-23): a nil state (the message look won over zeros and
    // ghost bars), and a month with only inflow and outflow, one of them zero
    options: [
      { id: "live", label: "Live", hint: "October: ₹50,000 in, ₹20,800 out, ₹15,000 invested" },
      { id: "nil-note", label: "Nil", hint: "No figures: “Nothing in or out yet” beside a small live-shaped chart of ghost bars on its rules" },
      { id: "no-in", label: "In & out · no inflow", hint: "Nothing invested, so Investments drops; ₹0 in against ₹20,800 out" },
      { id: "no-out", label: "In & out · no outflow", hint: "Nothing invested, so Investments drops; ₹50,000 in, ₹0 out" },
    ],
  },
  {
    id: "returnExp1V2BillsState",
    personaId: "return-exp1-v2",
    label: "Bills this month",
    // user calls (2026-09-23): all paid, the card says the month is done, a
    // success calendar on its right; no bills this month, the card is not shown
    options: [
      { id: "due", label: "Due", hint: "Bills still to go out this month; the Upcoming payments card shows the next one" },
      { id: "paid", label: "All paid", hint: "Every bill this month is out: the card says All done for this month, a success calendar on the right" },
      { id: "none", label: "None", hint: "No bills this month, so the feed drops the Upcoming payments card" },
    ],
  },
  {
    id: "returnExp1V2PaymentsDivider",
    personaId: "return-exp1-v2",
    label: "Payments divider",
    // user call (2026-09-24): with the Today line in the list, try the page
    // without the grey band under its head
    options: [
      { id: "on", label: "Divider", hint: "The 8px grey band between the head and the list" },
      { id: "off", label: "No divider", hint: "The list starts under the head; the Today line does the separating" },
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

/** Which sim screens a flag changes, so a debug surface shows only what the
 *  screen in front of you can use (user call). Screen ids are the sim's own:
 *  "home", or a detail page ("bank", "cashflow", …). A flag not listed here is
 *  common and shows on every screen. */
const FLAG_SCREENS: Record<string, string[]> = {
  returnExp1V2Scene: ["home"],
  returnExp1V2RingArt: ["home"],
  returnExp1V2IconHolder: ["home"],
  returnExp1V2CashflowCard: ["home"],
  returnExp1V2BillsState: ["home", "payments"],
  returnExp1V2PaymentsDivider: ["payments"],
  returnExp1V2Banks: ["bank"],
  returnExp1V2BankChart: ["bank"],
  returnExp1V2BudgetHistory: ["budget-history"],
};

export function protoFlagsFor(personaId: string): ProtoFlagDef[] {
  return PROTO_FLAGS.filter((f) => f.personaId === personaId);
}

/** The flags a debug surface should draw: `showWhen` gates read the live values
 *  (an unset flag counts as its default), and a screen-bound flag shows only on
 *  its screens. No screen reported (a sim that doesn't) shows everything. */
export function visibleProtoFlags(defs: ProtoFlagDef[], values: Record<string, string>, screen = ""): ProtoFlagDef[] {
  const valueOf = (id: string) => values[id] ?? PROTO_FLAGS.find((f) => f.id === id)?.options[0]?.id ?? "";
  return defs.filter(
    (d) =>
      (!d.showWhen || d.showWhen.test(valueOf(d.showWhen.flag))) &&
      (!screen || !FLAG_SCREENS[d.id] || FLAG_SCREENS[d.id].includes(screen)),
  );
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

/** The screen the sim is showing — it reports, the debug surfaces read. Not persisted. */
let screen = "";

export function setProtoScreen(id: string) {
  if (screen === id) return;
  screen = id;
  notify();
}

export function useProtoScreen(): string {
  return useSyncExternalStore(subscribe, () => screen, () => "");
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
