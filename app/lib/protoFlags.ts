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
  /** A heading the debug surfaces draw over a run of flags (user pin
      2026-09-25). A section's flags sit together, after the persona's
      unsectioned ones. */
  section?: string;
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
    // kept the slice id. Indigo haze left on user pin ("trash"), then slice ·
    // duo (user pin: "remove slice duo from ground"); a saved duo falls back
    // to Galaxy. slice · aurora and slice · nebula came in on 2026-09-25 (user
    // pins: "a slice top BG, based on transparent galaxy background", "full
    // screen and fixed ... the subtle version of aurora"): full-screen, pinned.
    options: [
      { id: "slice-galaxy", label: "Galaxy", hint: "Indigo-violet with a violet bloom and a slice-blue glow low on the right by night, pale lilac-blue by day, a fine grain; pinned behind the page" },
      { id: "slice-aurora", label: "slice · aurora", hint: "Full-screen and pinned, like Galaxy, in the Aurora's hues: a violet crown turning teal at the right, teal down the left, violet down the right and a violet bloom behind the message bar; lilac white by day, black by night" },
      { id: "slice-nebula", label: "slice · nebula", hint: "Full-screen and pinned, like Galaxy, in the Galaxy's own hues: a violet crown, Valentino down the left, slice blue down the right and a violet bloom behind the message bar; lilac white by day, black by night" },
      { id: "slice-lilac", label: "slice · lilac", hint: "One violet as a mesh crown, warm at the left and cool at the right, softer and a little deeper: lilac by day, aubergine by night" },
      { id: "slice-slate", label: "slice · slate", hint: "The calmest: sky into periwinkle by day, a slate crown on pure black by night" },
    ],
  },
  // "Slate by day" left the panel on user pin (2026-09-24: "finalise silver soft"):
  // slate's day is Silver · soft now; git history keeps the switch and its sets.
  {
    id: "returnExp1V2Cards",
    personaId: "return-exp1-v2",
    label: "Cards",
    // Split from the ground (user pin 2026-09-24): every card style over every
    // ground. slice leads since the user pin of the same day ("make slice cards
    // the default ones"); Transparent had led, so each ground kept the cards it
    // had. Glass
    // rim, Outline and Tonal came in the same day (user pin: "2-3 more versions
    // of the cards") and all three left on user pins the same day ("Glass rim
    // is trash"); git history keeps them.
    options: [
      { id: "slice", label: "slice", hint: "The canon shell: a solid card with the hairline and slice's subtle shadow (the DLS card elevation)" },
      { id: "transparent", label: "Transparent", hint: "White 78% by day with a subtle hairline, 8% by night — no shadow — so the ground shows through; the On Track tag goes translucent with them" },
    ],
  },
  // "Message bar" left the panel on user pin (2026-09-24: "edge seems the best
  // one, let's finalise it and remove the rest"): Edge is the light bar's own
  // recipe in globals.css now, and Glass, Lift, Float and Glow (and the Valentino
  // tint before them) are in git history. It came back that evening with colour
  // in the bar (Lilac, Slate, Valentino line) and left again on the next pin,
  // Edge the default once more.
  // "Chat opening" left the panel on user pin (2026-09-24: "finalise recede and
  // remove the rest"): v2's chat recedes, and Focus, Rise, Unfold and Glow are
  // in git history.
  // "Top background" left the panel on user pin (2026-09-24: it defaulted to
  // Off, "remove it"). Its scenes keep their files and globals.css rules,
  // dormant; git history has the switch and its options.
  // Ambient art explorations (see GENERATED_ASSETS.md). The goal card's icon is no
  // longer its own switch: it follows Card icon below, like the tracker's.
  {
    id: "returnExp1V2Tier",
    personaId: "return-exp1-v2",
    label: "Device tier",
    // user ask (2026-09-25): "optimise for performance in the lowest end
    // device". Auto reads the phone (4GB or less, or four cores or fewer, is
    // Low); Low and High force it, so the low tier can be judged on any
    // device. The tier drives data-re1-tier on the frame and the low-tier
    // rules in globals.css.
    options: [
      { id: "auto", label: "Auto", hint: "The phone decides: 4GB or less, or four cores or fewer, gets the low tier" },
      { id: "low", label: "Low", hint: "The costliest paint off: the top band is a plain fill, the ask bar and chat pill a near-solid one, the cards lose their blurred washes" },
      { id: "high", label: "High", hint: "Every effect on, whatever the phone" },
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
      // the default (user pin 2026-09-24, on the five neater-edge options: "this is nice, make it
      // default"): Pebble · soft crisp, the quieter stone with the crisp edge
      { id: "pebble-softcrisp", label: "Pebble · soft crisp", hint: "The default: Pebble · soft's quieter depth with the crisp edge, a clean side, a thin lip and a neutral contact shadow; the coin on goal cards, the squircle on tracking cards" },
      // the norm (user call 2026-09-24): the shape by what the card is, Coin · edge on goal
      // cards and the squircle on tracking cards. Pruned on user pin the same day to Pebble,
      // Pebble · soft, Avatar and Lift ("remove all the rest"): the river, polished, deep,
      // small, tint and pale pebbles, the glass lens, Porcelain, Puff, Deboss and Extrude are
      // in git history.
      { id: "edge", label: "Pebble", hint: "Coin · edge on goal cards and the squircle pebble on tracking cards: one smooth, slightly turned stone, the shape by what the card is" },
      { id: "pebble-soft", label: "Pebble · soft", hint: "Full size, but a thin side and a quiet drop: the stone sits closer to the card" },
      // neater edges (user pin 2026-09-24: "the bottom right edge... not differentiable, make them
      // neater", then "select the best 5, and I select the final one"): a clean side, a thin lip
      // and a split shadow, one character each (DASH2_PEBBLE_EDGES in the sim)
      { id: "pebble-crisp", label: "Pebble · crisp", hint: "The fix alone: the side one clean curve, a thin lip where the face turns, a neutral contact shadow and a soft ambient" },
      { id: "pebble-contour", label: "Pebble · contour", hint: "Crisp, and the side's outer curve drawn a step darker: the most defined edge" },
      { id: "pebble-deep", label: "Pebble · deep", hint: "A thicker side and a stronger step from face to side: more 3D, still clean" },
      { id: "pebble-diecut", label: "Pebble · die-cut", hint: "The side one flat deep tone: a graphic, die-cut edge" },
      // tokens (user pin: the pebble is "a little too much" and not "the most modern thing";
      // keep the skew and the 3D): the same shapes and full colour, machined. Token · bevel,
      // · float and · layer left with Avatar and Lift on user pin ("remove all of these"); their
      // drawing stays in the sim, unreachable from the switch
      { id: "token-crisp", label: "Token · crisp", hint: "A near-flat face lit a touch from the top, a sharp cut edge in the deep tone and a tight contact shadow" },
    ],
  },
  {
    id: "returnExp1V2AddGoal",
    personaId: "return-exp1-v2",
    label: "Add goal",
    // A CTA, not a card (user pin 2026-09-24: "this should be a CTA not shape,
    // the colour can be the same"); Card leads, the styling the card had. Of
    // the five finishes offered that day, Card and Primary stay (user pin:
    // "keep card and primary, remove the rest"); the DLS Secondary, the DLS
    // Tertiary and a Valentino tint are in git history.
    options: [
      { id: "card", label: "Card", hint: "The feed's own material as a 48 pill: the cards' shell with the Valentino wash behind a Valentino plus and label" },
      { id: "primary", label: "Primary", hint: "The DLS Primary: a Valentino fill, the plus and label in white" },
    ],
  },
  // "Ring size" left the panel on user pin (2026-09-24: "93 is best, keep and
  // remove the rest"): the home rings are the canon 93 (2886:86441), and 86 and
  // 80 are in git history.
  // "Ring opening" left the panel on user pin (2026-09-25: "remove ring opening
  // for now … it looking horrible, scrap it"): an L1's ring is there as the
  // page lands; the Pebble opening is in git history.
  {
    id: "returnExp1V2ChatReveal",
    personaId: "return-exp1-v2",
    label: "Chat reveal",
    // How what cosimo adds under a line comes in (user pins 2026-09-25: it
    // "just appears"; three mask sweeps "all look the same … I just want the
    // best performance", so it went to a plain fade-up; then "not smooth
    // appearing like it was doing before, try 4-5 variations … super smooth,
    // all of them have something to do with the mask"). Every take is a
    // feathered mask edge moved on the compositor (CHAT_REVEALS); Sweep, the
    // look of the first sweeps, leads. The sweep and rise ids come back as
    // they were, so a pick stored then holds.
    options: [
      { id: "sweep", label: "Sweep", hint: "An 80px soft edge runs down the block and it is there; nothing moves" },
      { id: "rise", label: "Rise", hint: "The same edge, the block coming up 14px into its seat under it" },
      { id: "mist", label: "Mist", hint: "A 200px edge over a slower 820ms: the block condenses out of a long gradient" },
      { id: "veil", label: "Veil", hint: "The same edge, the block brightening from 30% as it passes" },
      { id: "glide", label: "Glide", hint: "A 120px edge, the block drifting down 8px into its seat as the edge pulls it" },
    ],
  },
  {
    id: "returnExp1V2QuickTap",
    personaId: "return-exp1-v2",
    label: "Quick action tap",
    // (user pin 2026-09-25: "when I tap on one of the quick actions, it should
    // smoothly go to the message area and become the message … one clean
    // animation, and the scroll should be cleanly orchestrated … an option to
    // turn it off"; then, on that straight flight: "try a few other
    // animations, I like the one on iMessage … a curved motion … to the right
    // and up"). Curve leads; Straight keeps the first cut's "fly" id, so a
    // stored pick of it holds.
    options: [
      { id: "curve", label: "Curve", hint: "iMessage's arc: the words swing right quickly while the thread's scroll lifts them, so they curve up into the message" },
      { id: "spring", label: "Curve · spring", hint: "The same arc, the swing right running a touch past and settling back" },
      { id: "fly", label: "Straight", hint: "The words travel a straight line into the message, across and up in step with the scroll" },
      { id: "off", label: "Off", hint: "The list goes at once and the message slides in, as before" },
    ],
  },
  // "Money Feed card" left the panel on user pin (2026-09-25: "we are only
  // keeping rows, not the others"): Widget and Pill are in git history.
  {
    id: "returnExp1V2Banks",
    personaId: "return-exp1-v2",
    label: "Linked banks",
    // user call (2026-09-23): the bank page's states — three banks (the
    // default), one bank (of its two layouts the row won; the account-as-head
    // one is gone), and three where one bank fails to fetch
    options: [
      { id: "three", label: "3 banks", hint: "The total over three linked accounts, each listed under it" },
      { id: "one-row", label: "1 bank", hint: "The page keeps its shape: the Total balance head over a single Bank account row, slice small finance bank, which leaves the balance and the refresh time to the head" },
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
      { id: "nil-note", label: "Nil", hint: "No figures: “No money in or out so far” beside a small live-shaped chart of ghost bars on its rules" },
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
    // user calls (2026-09-24): a switch for the line, and off by default. Its
    // look settled on Avg · faint in Valentino (user pins: "update avg faint,
    // and remove the rest"); git history keeps Avg, Avg · left and Outline.
    // On keeps the avg-faint id: hydration drops unknown ids to Off, and the
    // stored pick is that one
    options: [
      { id: "off", label: "Off", hint: "The list without it" },
      { id: "avg-faint", label: "On", hint: "A faint Valentino dashed line at today's date, its Valentino pill rolling between TODAY and the date" },
    ],
  },
  // Card status (user pins 2026-09-25): "if you are overspending in tracking
  // or you're lagging in your goal, there should be some sort of nudge
  // upfront"; then, on a first round (a subline alert, a tag in its place and
  // a ring badge, a set per card type): "the logic has to be consistent for
  // all cards ... I need an all-positive look and an all-behind look", and
  // "Tag + bar is perfect for the budget card. Lock it". So every card runs
  // the budget card's logic: a tag names the state, and the progress (the
  // bar, the ring) turns red with an issue ("the ring should also match the
  // color of the label and be red"). The first round is in git history.
  {
    id: "returnExp1V2CardStatus",
    personaId: "return-exp1-v2",
    section: "Card status",
    label: "State",
    options: [
      { id: "ontrack", label: "All on track", hint: "Every card on track, each with a green On track tag: the budget ₹15,200 left, Trip to Japan on plan, Swiggy ₹1,400 of its ₹2,000 cap" },
      { id: "behind", label: "All behind", hint: "An issue on every card, its tag and its bar or ring red: the budget ₹4,500 over, Trip to Japan behind plan, every capped tracker a fifth past its cap (Swiggy ₹2,400 of ₹2,000). Their pages and cosimo's summaries read the same" },
    ],
  },
  {
    id: "returnExp1V2CardStatusTag",
    personaId: "return-exp1-v2",
    section: "Card status",
    label: "Tag",
    options: [
      { id: "corner", label: "Corner", hint: "Top right on every card, the budget card's own place: the goal and tracking cards take its header, the title and the tag across the top, the figure and the ring under it" },
      { id: "top", label: "Top", hint: "Every card's first line, over its title, where the DLS puts a card's tag" },
      { id: "ring", label: "On the ring", hint: "Hung on the ring's foot on the goal and tracking cards; the budget card, with no ring, keeps its corner" },
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
 *  "home", "chat" (the chat, open over any page), or a detail page ("bank",
 *  "cashflow", …). A flag not listed here is common and shows on every screen. */
const FLAG_SCREENS: Record<string, string[]> = {
  returnExp1V2QuickTap: ["chat"],
  returnExp1V2ChatReveal: ["chat"],
  returnExp1V2Skin: ["home"],
  returnExp1V2Cards: ["home"],
  returnExp1V2IconHolder: ["home"],
  returnExp1V2AddGoal: ["home"],
  returnExp1V2CashflowCard: ["home"],
  returnExp1V2BillsState: ["home", "payments"],
  returnExp1V2PaymentsDivider: ["payments"],
  returnExp1V2TodayLine: ["payments"],
  returnExp1V2Banks: ["bank"],
  returnExp1V2BankChart: ["bank"],
  returnExp1V2BudgetHistory: ["budget-history"],
  returnExp1V2CardStatus: ["home", "tracking", "budget", "budget-cat"],
  returnExp1V2CardStatusTag: ["home"],
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
