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
    id: "returnExp1V2Skin",
    personaId: "return-exp1-v2",
    label: "Ground",
    // 2026-09-24 (user ask): the page's ground and card shells in the register
    // of Revolut's analytics page — a soft colour haze at the top of a tinted
    // ground, flat cards lifted from it by tone alone (no hairline, no shadow),
    // slice's own radius kept. Layout and hierarchy untouched; the default is
    // the page as it stands. The two haze-only readings (Revolut · haze,
    // Revolut · slice hue) left on user call the same day, as did two of the
    // generated grounds (Violet, Colour field — "trash"); git history keeps them.
    // Transparent · galaxy leads, which makes it the default (user call
    // 2026-09-24: "make Transparent galaxy default for now"); slice is the page
    // as it stood before. Cobalt left with Violet and Colour field, then
    // Transparent style, Transparent · Valentino and Transparent · plain (user
    // call 2026-09-24: keep galaxy, slice and Indigo). Later that day slice
    // became a skin as well (user pins): a mesh ground, mostly white by day,
    // mostly black with grey by night. Then the one switch split in two (user
    // pin: "separate the grounds and cards, all options for all"): this is the
    // Ground, and Cards below takes any value over any of them. The ids stay,
    // so a saved choice keeps its ground. That evening the slice mesh became
    // three sets (user pins: muddy by day, gradient lines by night — "try
    // better, 3 sets, light and dark each, in the Ground section"); slice · duo
    // keeps the slice id. Indigo haze left on user pin ("trash").
    options: [
      { id: "slice-galaxy", label: "Galaxy", hint: "Indigo-violet with a violet bloom and a slice-blue glow low on the right by night, pale lilac-blue by day, a fine grain; pinned behind the page" },
      { id: "slice", label: "slice · duo", hint: "slice's brand pair as a mesh crown: Valentino pink and slice blue bloom out of a lilac top by day, a plum edge on navy by night — pure white or black by the second card" },
      { id: "slice-lilac", label: "slice · lilac", hint: "One violet as a mesh crown, warm at the left and cool at the right, softer and a little deeper: lilac by day, aubergine by night" },
      { id: "slice-slate", label: "slice · slate", hint: "The calmest: sky into periwinkle by day, a slate crown on pure black by night" },
    ],
  },
  {
    id: "returnExp1V2Cards",
    personaId: "return-exp1-v2",
    label: "Cards",
    // Split from the ground (user pin 2026-09-24): every card style over every
    // ground. Transparent leads, so each ground keeps the cards it had. Glass
    // rim, Outline and Tonal came in the same day (user pin: "2-3 more versions
    // of the cards"); Outline and Tonal left on user pin the same day.
    options: [
      { id: "transparent", label: "Transparent", hint: "White 78% by day with a subtle hairline, 8% by night — no shadow — so the ground shows through; the On Track tag goes translucent with them" },
      { id: "glass", label: "Glass rim", hint: "A thinner veil (white 55% by day, 5% by night) with a bright hairline rim and slice's subtle shadow — panes of glass with an edge" },
      { id: "slice", label: "slice", hint: "The canon shell: a solid card with the hairline and slice's subtle shadow (the DLS card elevation)" },
    ],
  },
  {
    id: "returnExp1V2AskTint",
    personaId: "return-exp1-v2",
    label: "Message bar",
    // the ask bar's fill (user pin 2026-09-24: "a light mode version where this
    // input box has a very subtle Valentino tint"). By day only; the chat pill
    // and the goal-setup card share the fill, so the morph never changes surface.
    options: [
      { id: "glass", label: "Glass", hint: "The bar as it stands: white 60% over a 24px frost by day" },
      { id: "valentino", label: "Valentino tint", hint: "By day only: Valentino at 5% in the same frost, through the chat and the goal-setup card too; night keeps its bar" },
    ],
  },
  // "Top background" left the panel on user pin (2026-09-24: it defaulted to
  // Off, "remove it"). Its scenes keep their files and globals.css rules,
  // dormant; git history has the switch and its options.
  // Ambient art explorations (see GENERATED_ASSETS.md). The goal card's icon is no
  // longer its own switch: it follows Card icon below, like the tracker's.
  {
    id: "returnExp1V2IconHolder",
    personaId: "return-exp1-v2",
    label: "Card icon",
    // ONE switch for the icon in every ring's hole — the Trip to Japan goal card
    // and the Swiggy tracker follow it together, so the two always read as one
    // set (user call 2026-09-23). The goal card draws the flight glyph in blue.
    // Pruned twice on user call (2026-09-23): what stays is the tilted edged
    // coin, the generated glass lens, the porcelain subject and the DLS avatar
    // (the lens's thin / dome iterations and emboss left on 2026-09-24). Gone with it (git history keeps
    // them): the two holo-glass panes, the small avatar, the bare glyph, the
    // brand marks cast in glass, the Aurora and Soft gradient renders, and the
    // CSS glass / subtle / outline / soft / gel avatars.
    options: [
      { id: "edge", label: "Coin · edge", hint: "A smooth tone pebble at 44, slightly turned: its top-lit face rolls into its side, on a tinted shadow; the brand's mark at the glyph's weight" },
      { id: "glass-lens", label: "Glass · lens", hint: "A generated disc of thick, colourless crystal — the card bends darker at its edge band, one specular — with the slice glyph laid on its face; its own day and night render" },
      { id: "glass-ceramic", label: "Porcelain", hint: "The subject as a smooth matte ceramic object — white by day, charcoal by night; no gloss. Travel and Food only" },
      { id: "avatar", label: "Avatar", hint: "The DLS bold avatar at 48 — a flat tone disc, no tilt, the glyph at 18" },
      // 2026-09-24 (user ask, agentation on the Card icon label): the flat avatar MORPHED
      // into 2.5D, several skins to compare, the glyph untouched — docs/card-icon-morph.md.
      // Drawn (CSS + SVG filters over the real glyph; any tone, both modes). The six Codex
      // re-renders (Clay, Gel, Frost, Satin, Paper, Pillow) left unrendered on user pin the
      // same day: Codex is still out of credit. Their briefs wait in the doc.
      { id: "morph-puff", label: "Puff", hint: "Drawn 2.5D — the avatar as a soft puck, the glyph swelling out of it: one specular top-left, shade at its foot" },
      { id: "morph-extrude", label: "Extrude", hint: "Drawn 2.5D — the glyph given thickness: its side in the deep tone falling down-right onto the puck, a soft shadow under it" },
      { id: "morph-deboss", label: "Deboss", hint: "Drawn 2.5D — the glyph pressed into the puck: shadow along its upper edge, light along its lower one, the face a deeper tone" },
      { id: "morph-lift", label: "Lift", hint: "Drawn 2.5D — the glyph as a cut-out floating a hair above the puck on its own soft shadow" },
      // Revolut's registers, drawn (user ask 2026-09-24, read off Mobbin screens)
      { id: "morph-rev-disc", label: "Revolut · disc", hint: "Revolut's in-app avatar — a saturated disc shading light-to-deep top to bottom, the white glyph flat on it, no shadow" },
      { id: "morph-rev-glow", label: "Revolut · glow", hint: "Revolut's Glow theme as a portal — a near-black disc lit in the tone from below, a hairline of the tone at its foot, the white glyph" },
      { id: "morph-rev-chrome", label: "Revolut · chrome", hint: "Revolut's spot-illustration register — the glyph cast in chrome, bevelled and lit top-left, on the glow ground" },
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
    // user calls (2026-09-23/24): each state is a day of the month and which
    // bills before it went unpaid; the payments page's Today line follows it.
    // All paid, the card says the month is done; no bills, it is not shown.
    options: [
      { id: "due", label: "Due", hint: "The 8th: Rent paid, Electricity and Internet to come" },
      { id: "overdue", label: "1 overdue", hint: "The 18th: Rent paid, Electricity overdue, Internet to come" },
      { id: "paid", label: "All paid", hint: "The 25th: every bill out; the card says All done for this month" },
      { id: "none", label: "None paid", hint: "The 1st: nothing out yet, all three to come (no Today line)" },
      { id: "empty", label: "No bills", hint: "No bills this month, so the feed drops the Upcoming payments card" },
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
    id: "returnExp1V2TodayLine",
    personaId: "return-exp1-v2",
    label: "Today line",
    // user calls (2026-09-24): a switch for the line, and off by default
    options: [
      { id: "off", label: "Off", hint: "The list without it" },
      { id: "on", label: "On", hint: "A dashed line at today's date, its pill rolling between TODAY and the date" },
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
  returnExp1V2Skin: ["home"],
  returnExp1V2Cards: ["home"],
  returnExp1V2IconHolder: ["home"],
  returnExp1V2CashflowCard: ["home"],
  returnExp1V2BillsState: ["home", "payments"],
  returnExp1V2PaymentsDivider: ["payments"],
  returnExp1V2TodayLine: ["payments"],
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
