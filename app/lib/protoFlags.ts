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
  // Ambient art explorations (see GENERATED_ASSETS.md). The goal card's icon is no
  // longer its own switch: it follows Card icon below, like the tracker's.
  {
    id: "returnExp1V2Skin",
    personaId: "return-exp1-v2",
    label: "Ground & cards",
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
    // call 2026-09-24: keep galaxy, slice and Indigo).
    options: [
      { id: "slice-galaxy", label: "Transparent · galaxy", hint: "Transparent style on the galaxy ground: indigo-violet with a violet bloom and a slice-blue glow low on the right by night, pale lilac-blue by day, the same fine grain" },
      { id: "slice", label: "slice", hint: "The page as it stood: white / slice black ground, the shell's hairline and green-cast shadow" },
      { id: "revbg-haze", label: "Indigo haze", hint: "Revolut's analytics page — charcoal with an indigo haze across the top and faint blue-grey drift below by night; periwinkle over cool off-white by day — a generated full-screen ground (Codex image_gen, 2026-09-24), pinned behind the page, the Transparent style cards over it" },
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
    // Only with Ground & cards = slice (user call 2026-09-24): every other skin brings
    // its own full-screen ground, so a top scene has nothing to sit on there.
    showWhen: { flag: "returnExp1V2Skin", test: (v) => !v || v === "slice" },
    options: [
      { id: "off", label: "Off", hint: "No scene — the page ground runs to the top edge" },
      { id: "aurora", label: "Aurora", hint: "The generated 2026-09-18 scene, unchanged" },
      { id: "aurora2", label: "Aurora 2", hint: "The designer's own art in light; dark redraws its composition for the night" },
      { id: "a2-fine", label: "Aurora 2 · fine", hint: "A variation of Aurora 2 (user ask): the same greyscale aurora with five or six slim ribbons instead of two broad waves" },
      { id: "a2-broad", label: "Aurora 2 · broad", hint: "One very wide, slow sweep of light across the middle — calmer and emptier" },
      { id: "a2-falls", label: "Aurora 2 · falls", hint: "The aurora as a curtain: tall narrow vertical falls of soft light from the upper middle" },
      { id: "a2-drift", label: "Aurora 2 · drift", hint: "The broad waves tilted to drift from the upper left down to the lower right" },
      { id: "caustic", label: "Glass · caustics", hint: "In sync with the glass card icons: the colourless bent-light pattern clear glass throws — barely-there ribbons, white by day, near-black by night" },
      { id: "lens", label: "Glass · lens edge", hint: "In sync with the glass card icons: one broad, soft arc of bent light across the upper middle — the edge band of a huge clear lens, out of focus" },
    ],
  },
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
      { id: "edge", label: "Coin · edge", hint: "A top-lit tone coin on its tinted shadow; the dark back disc peeks out as its thickness" },
      { id: "glass-lens", label: "Glass · lens", hint: "A generated disc of thick, colourless crystal — the card bends darker at its edge band, one specular — with the slice glyph laid on its face; its own day and night render" },
      { id: "glass-ceramic", label: "Porcelain", hint: "The subject as a smooth matte ceramic object — white by day, charcoal by night; no gloss. Travel and Food only" },
      { id: "avatar", label: "Avatar", hint: "The DLS bold avatar at 48 — a flat tone disc, no tilt" },
      // 2026-09-24 (user ask, agentation on the Card icon label): the flat avatar MORPHED
      // into 2.5D, several skins to compare, the glyph untouched — docs/card-icon-morph.md.
      // `morph-*` is drawn (CSS + SVG filters over the real glyph; any tone, both modes);
      // `render-*` is a Codex re-render of the same flat avatar (scripts/icon-morph/run.sh)
      // — until its file is generated the option shows the flat avatar.
      { id: "morph-puff", label: "Puff", hint: "Drawn 2.5D — the avatar as a soft puck, the glyph swelling out of it: one specular top-left, shade at its foot" },
      { id: "morph-extrude", label: "Extrude", hint: "Drawn 2.5D — the glyph given thickness: its side in the deep tone falling down-right onto the puck, a soft shadow under it" },
      { id: "morph-deboss", label: "Deboss", hint: "Drawn 2.5D — the glyph pressed into the puck: shadow along its upper edge, light along its lower one, the face a deeper tone" },
      { id: "morph-lift", label: "Lift", hint: "Drawn 2.5D — the glyph as a cut-out floating a hair above the puck on its own soft shadow" },
      // Revolut's registers, drawn (user ask 2026-09-24, read off Mobbin screens)
      { id: "morph-rev-disc", label: "Revolut · disc", hint: "Revolut's in-app avatar — a saturated disc shading light-to-deep top to bottom, the white glyph flat on it, no shadow" },
      { id: "morph-rev-glow", label: "Revolut · glow", hint: "Revolut's Glow theme as a portal — a near-black disc lit in the tone from below, a hairline of the tone at its foot, the white glyph" },
      { id: "morph-rev-chrome", label: "Revolut · chrome", hint: "Revolut's spot-illustration register — the glyph cast in chrome, bevelled and lit top-left, on the glow ground" },
      { id: "render-clay", label: "Clay · render", hint: "The flat avatar re-rendered as soft matte clay — the glyph a smooth inflated form pressed out of a shallow puck. Not yet generated (Codex out of credit 2026-09-24): shows the flat avatar until scripts/icon-morph/run.sh clay has run" },
      { id: "render-gel", label: "Gel · render", hint: "The glyph as a raised drop of milky translucent gel on a glossy disc, one bright specular. Not yet generated: flat avatar until run.sh gel" },
      { id: "render-frost", label: "Frost · render", hint: "The glyph as a slab of frosted white glass floating a hair above a matte puck, visionOS register. Not yet generated: flat avatar until run.sh frost" },
      { id: "render-satin", label: "Satin · render", hint: "The glyph cast in white-silver satin metal on a matte puck, soft one-way highlights. Not yet generated: flat avatar until run.sh satin" },
      { id: "render-paper", label: "Paper · render", hint: "The glyph cut from white card and lifted a millimetre off a matte card disc, a soft warm shadow. Not yet generated: flat avatar until run.sh paper" },
      { id: "render-pillow", label: "Pillow · render", hint: "The whole disc swelling into a soft cushion, the glyph pressed into it. Not yet generated: flat avatar until run.sh pillow" },
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
  returnExp1V2Scene: ["home"],
  returnExp1V2Skin: ["home"],
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
