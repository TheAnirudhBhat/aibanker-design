"use client";

import { Fragment, useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback, type ReactNode } from "react";
import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  OUTLINE_SUBTLE,
  OUTLINE_BOLD,
  BG_PRIMARY,
  BG_SECONDARY,
  BG_CARD,
  BG_SHEET,
  BG_GLASS,
  SLATE_10,
  SLATE_30,
  SLATE_50,
  CHAT_USER_BUBBLE,
  MAIN_PRIMARY,
  DECOR_TILE_VALENTINO,
  DECOR_TILE_BLUE,
  DECOR_TILE_ORANGE,
  DECOR_TILE_GREEN,
  DECOR_TILE_RED,
  TEXT_ON_COLOR_PRIMARY,
  GREEN_500,
  BLUE_500,
  ORANGE_500,
  RED_500,
} from "../lib/colors";
import { SPACE_XS, SPACE_S, SPACE_M, SPACE_L, SPACE_XL } from "../lib/spacing";
import { RADIUS_S, RADIUS_M, RADIUS_L, RADIUS_CIRCLE } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";
import { SHEET_DOCK_BOTTOM } from "../lib/sheet";
import { StatusBar, GestureNav, ChatAppBar, ChromeSuppressProvider, FooterInset } from "../components/AppChrome";
import MockKeyboard from "../components/MockKeyboard";
import { useChatLift } from "../hooks/useChatLift";
import QuestionnaireOverlay from "../components/QuestionnaireOverlay";
import type { Question, QuestionOption } from "../components/QuestionnaireOverlay";
import PlanCruncherV2 from "../components/PlanCruncherV2";
import type { Persona } from "../components/PersonaToggle";
import { TypeBox, MosaicCard, SuggestSheetBar, type QuickAction } from "../components/Chat";
import { ILLUST_MY_SPENDS, ILLUST_FEEDBACK, ILLUST_AFFORD_IT } from "../lib/illustrations";
import ChatCard, { type ChatCardData } from "../components/ChatCards";
import CategoryBudgetsViz from "../components/CategoryBudgetsViz";
import LinkAccountsCard from "../components/LinkAccountsCard";
import GoalTracker from "../components/GoalTracker";
import type { GoalIndicatorData } from "../components/GoalTracker";
import { useIsMobileProto } from "../hooks/useProtoMobile";
import { highlightValues } from "../lib/chat-highlight";

import WrappedCard from "./WrappedCard";
import WrappedStory from "./WrappedStory";
import AASim from "./AASim";
import BigSpendsActivity from "./BigSpendsActivity";
import SharedPayScreen from "../components/PayScreen";
import PayScreenFuture from "../components/PayScreenFuture";
import Tooltip from "../components/Tooltip";
import FeaturePDP from "../components/FeaturePDP";
import FeedbackBar from "../components/FeedbackBar";
import JumpToRecentPill from "../components/JumpToRecentPill";
import { SnackbarSlotProvider, SnackbarSlotTarget } from "../components/SnackbarSlot";
import BigNumber from "../components/BigNumber";
import {
  WRAPPED_BEATS,
  PRE_WRAPPED_BUBBLES,
  POST_WRAPPED_PRE_AA_BUBBLES,
  BETA_NAMED_2X,
  BELIEF_QUESTIONS,
  BELIEF_SAVING_BAND,
  beliefQ1Reaction,
  BELIEF_Q2_REACTIONS,
  beliefQ3Reaction,
  BETA_GOAL_INTRO,
  AA_LINKED_BUBBLE,
  COSIMO_GREETING_1,
  COSIMO_GREETING_2,
  COSIMO_EXPLORE_PROMPT,
  BETA_BYRON_INTRO,
  BETA_BYRON_INTRO_SKIP,
  BETA_BYRON_FIRST_ROAST,
  GOAL_PREFERENCE_QUESTIONS,
  PLAYGROUND_INTRO_BUBBLES,
  BETA_PLAYGROUND_READY,
  BETA_AA_INTRO,
  BETA_AA_INTRO_NO_GOAL,
  BETA_AA_INTRO_SAVE_MORE,
  PLAYGROUND_CHIPS,
  PLAYGROUND_REVEALS,
  getPlaygroundByronRoast,
  PLAYGROUND_RYAN_HANDOFF,
  PLAYGROUND_GOAL_NUDGE,
  PLAYGROUND_BYRON_CAP_NUDGE,
  type PlaygroundReveal,
  IDLE_CRUNCHER_TEXTS,
  AA_DISMISS_NUDGE,
  PREF_DISMISS_NUDGE,
  type Voice,
} from "./fixtures/wrappedFixture";
// Footprint walk, ladder pick, spending plan, and lock-in inputs all come
// from the GBP flow fixture so the inline onboarding plan and the standalone
// GBP sim stay in sync.
import {
  BUCKET_CONFIRM_LIST,
  LADDER_OPTIONS,
  SPENDING_PLAN_FIXTURE,
  getSafeToSpendSnapshot,
  formatCompactK,
} from "./fixtures/gbpFlowFixture";
import { SAVINGS_TIER_QUESTION } from "./fixtures/savingsTierQuestion";
import { KEY_IMG } from "./fixtures/keyImage";
import type { LadderTier, BetaStepId, CategoryBudget } from "../lib/types";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const OVERLAY_DURATION = 460;

// ══════════════════════════════════════════════════════════════════
//  Helpers - copied from the locked RefreshSession pattern
// ══════════════════════════════════════════════════════════════════

function useTypewriter(fullText: string, active: boolean, onComplete?: () => void) {
  const [displayed, setDisplayed] = useState(active ? "" : fullText);
  const posRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const completeCalled = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active) {
      setDisplayed(fullText);
      posRef.current = fullText.length;
      return;
    }
    posRef.current = 0;
    completeCalled.current = false;
    setDisplayed("");

    const tick = () => {
      // Brisker than before (bigger chunks, shorter gaps) so multi-line beats don't drag — a long
      // onboarding reads faster without losing the streamed-in feel.
      const chunkSize = 4 + Math.floor(Math.random() * 4);
      const nextPos = Math.min(posRef.current + chunkSize, fullText.length);
      posRef.current = nextPos;
      setDisplayed(fullText.slice(0, nextPos));
      if (nextPos >= fullText.length) {
        if (!completeCalled.current) {
          completeCalled.current = true;
          onCompleteRef.current?.();
        }
        return;
      }
      timerRef.current = window.setTimeout(tick, 14 + Math.random() * 14);
    };
    timerRef.current = window.setTimeout(tick, 50);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [fullText, active]);

  return displayed;
}

// ══════════════════════════════════════════════════════════════════
//  Floating chat app bar — delegates to DLS ChatAppBar
// ══════════════════════════════════════════════════════════════════

function FloatingAppBar({
  onClose,
  navKind = "close",
  mode = "simple",
  activeVoice = "ryan",
  onVoiceToggle,
  leadingScrolled = true,
  leadingHidden = false,
  hideCenter = false,
  center,
  trailing,
}: {
  onClose: () => void;
  navKind?: "close" | "back";
  mode?: "simple" | "toggle";
  activeVoice?: Voice;
  onVoiceToggle?: (v: Voice) => void;
  leadingScrolled?: boolean;
  leadingHidden?: boolean;
  hideCenter?: boolean;
  center?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <ChatAppBar
      absolute
      variant={mode === "toggle" ? "degen" : "firstTime"}
      navKind={navKind}
      onNav={onClose}
      voice={activeVoice as Persona}
      onVoiceChange={onVoiceToggle ? (p) => onVoiceToggle(p as Voice) : undefined}
      leadingScrolled={leadingScrolled}
      leadingHidden={leadingHidden}
      hideCenter={hideCenter}
      center={center}
      trailing={trailing}
    />
  );
}

// ══════════════════════════════════════════════════════════════════
//  Pay screen + pill
// ══════════════════════════════════════════════════════════════════


// ══════════════════════════════════════════════════════════════════
//  Step sequence
// ══════════════════════════════════════════════════════════════════

type DualVoiceRef = { ryan: string; byron: string };

// Pitch opener: the background fetch is the FRAME for the wrapped hook — these patterns come from
// the slice account the user already has, while the other accounts crunch in the background.
const PITCH_INTRO_BUBBLE: DualVoiceRef = {
  ryan: "While I read your other accounts in the background, here's what your slice account already shows. Three months, three patterns, a few surprises.",
  byron: "Your other accounts are still loading. Your slice account already talks, though. Three months, three patterns.",
};

type Step =
  | { kind: "bot"; dv: DualVoiceRef }
  | { kind: "aa-chips" }
  | { kind: "wrapped" }
  | { kind: "fetch-card" } // Cosimo pitch: inline fetch-status card → morphs to the sync-done "Start" nudge (canon 796:6252)
  | { kind: "feasibility" } // Cosimo pitch: the goal-planning feasibility check + lever negotiation (schematic 426:1340)
  | { kind: "preferences" }
  | { kind: "playground" }
  | { kind: "footprint-bucket"; bucketIndex: number }
  | { kind: "build-plan" }
  | { kind: "ladder-pick" }
  | { kind: "plan-crunching" }
  | { kind: "spending-plan" }
  // Pitch: the lump-sum head start is asked right after the plan card (BEFORE the budget) — idle
  // cash framing, typed amount / none; a confirmed amount runs the mock atom-creation takeover.
  | { kind: "lump-sum" }
  | { kind: "budget-confirm" }
  | { kind: "verdict" }
  | { kind: "lock-in" }
  | { kind: "goal-echo" } // pitch: echo the named goal + the monthly as a typographic moment
  | { kind: "belief-q"; qIndex: number }; // pitch pre-Byron run: ask → answer → react with their data

function bot(dv: DualVoiceRef): Step { return { kind: "bot", dv }; }

// The plan-intro line, named so beta can DROP it by identity: in beta the crunch loader ending +
// the plan card's own "shape of your month" intro already do the reveal, and a third consecutive
// "Here's..." opener made the climax read like a checklist. The classic flow keeps it.
const PLAN_INTRO_STEP: Step = bot({
  ryan: "Here's the plan.",
  byron: "Here's the receipt. Don't argue with it.",
});

export type OnboardingConfig = {
  aaMode?: "required" | "optional";
  introduceByron?: boolean;
  goalRequired?: boolean;
  byronGatedByAa?: boolean;
  payScreenVariant?: "current" | "future";
  // Jun 11: onboarding ends at the AA decision. Connecting finishes onboarding;
  // skipping lands on a terminal spend-preview mosaic. No goal/budget/plan flow.
  terminalAtAa?: boolean;
  // DEV-only fast-forward chrome for the Jun-11 terminalAtAa path. When set, the
  // sim mounts already at a post-connect milestone (seeded via lazy useState)
  // instead of replaying the linear script. The three TERMINAL milestones
  // (connected/snapshot/asked) target the connect-mosaic render branch — they
  // seed aaConnected, the overlay-open chat, the playground step, etc.
  // "cards-unflipped" is different: it seeds a much lighter PRE-AA state — the
  // normal flow jumped to the wrapped-cards moment (wrapped step, revealedCount
  // 0 ⇒ face-down "?" cards), with AA NOT yet connected. Undefined ⇒ the normal
  // flow runs byte-identically.
  startMilestone?: "connected" | "byron" | "snapshot" | "asked" | "cards-unflipped" | "aa-prompt";
  // Intent-first (beta) flow: splash → wrapped → goal nudge → AA ask → explore filler → session
  // break (ends session one) → footprint → plan → lock-in. Reorders the steps; existing personas
  // are byte-identical when false.
  betaIntentFirst?: boolean;
  // DEV-only fast-forward for the beta flow — seeds the sim at the matching step.
  betaStartStep?: BetaStepId;
  // New-user-2 variant of the beta flow: the goal nudge (intro + preferences quiz) moves from right
  // after the wrapped hook to AFTER the explore playground, surfaced when the user taps "Build my
  // goal plan". Only meaningful alongside betaIntentFirst; false ⇒ default beta ordering.
  goalAfterExplore?: boolean;
  // Pitch flow: the user already linked accounts (or chose slice-only) BEFORE this sim, so drop the AA
  // ask from the beta flow and run the background-fetch cruncher from the very start (consent's given).
  // Only meaningful alongside betaIntentFirst.
  betaSkipAa?: boolean;
  // DEV: seed the background-fetch cruncher as already complete (skip the long fetch for demos).
  betaFetchDone?: boolean;
  // Cosimo pitch: force the "bills exceed income" data gap — the plan build blocks on the
  // "Can't build your plan yet" escape card (canon 414:1027) until accounts are connected (mocked).
  planDataGap?: boolean;
  // Conversational interaction model (pitch): follow-up questions are asked INSIDE Ryan's messages as
  // numbered options — the user types "1", the option text, or anything free-form into the always-on
  // chat input. No suggestion pills, no acknowledgement buttons ("Looks right" → Ryan asks and the user
  // types yes). Rich moments (wrapped, Byron, plan, budget, funding cards) stay as inline cards; the
  // ONE sheet kept is the build-plan ambiguity (it blocks a background process — must be explicit).
  // Only meaningful alongside betaIntentFirst; false ⇒ existing flows are byte-identical.
  conversational?: boolean;
};

const ALL_STEPS: Step[] = [
  // ── Phase 1: Meet Ryan - wrapped quiz ──
  ...PRE_WRAPPED_BUBBLES.map(bot),
  { kind: "wrapped" },
  ...POST_WRAPPED_PRE_AA_BUBBLES.map(bot),
  // ── Phase 2: Account aggregation ──
  { kind: "aa-chips" },
  bot(AA_LINKED_BUBBLE),
  // ── Phase 3: Spend-analytics playground while transactions fetch ──
  ...PLAYGROUND_INTRO_BUBBLES.map(bot),
  { kind: "playground" },
  // ── Phase 4: Goal preferences quiz ──
  { kind: "preferences" },
  // ── Phase 5: Footprint walk - confirm income / obligations / p2p / one-offs ──
  bot({
    ryan: "Goal set. Quick look at your money, then I build the plan. First, what's coming in.",
    byron: "Goal locked. Quick tour of your money, then I build it. Starting with what shows up.",
  }),
  { kind: "footprint-bucket", bucketIndex: 0 }, // Income
  bot({
    ryan: "Income's steady. Now let's look at what's already spoken for each month.",
    byron: "Income confirmed. Now the bills you can't argue with.",
  }),
  { kind: "footprint-bucket", bucketIndex: 1 }, // Obligations
  bot({
    ryan: "That's the fixed stuff. Now the money that moves between you and people you know.",
    byron: "Obligations done. Now the friend tax.",
  }),
  { kind: "footprint-bucket", bucketIndex: 2 }, // P2P
  bot({
    ryan: "Last one, the one-off stuff. Refunds, repairs, the odd surprise bill.",
    byron: "Last bucket: the random one-offs that skew your averages.",
  }),
  { kind: "footprint-bucket", bucketIndex: 3 }, // One-off items
  // ── Phase 6: Ladder pick ──
  bot({
    ryan: "Money's all mapped. One last call before I lock your plan.",
    byron: "Money's mapped. One call left, then the plan.",
  }),
  { kind: "ladder-pick" },
  // ── Phase 7: Plan crunching ── (no static "crunching" line — the inline loader IS the crunch,
  // cycling its own status text, so a preceding bot line would just be a redundant static duplicate)
  { kind: "plan-crunching" },
  // ── Phase 8: Spending plan + verdict + lock-in ──
  PLAN_INTRO_STEP,
  { kind: "spending-plan" },
  { kind: "budget-confirm" }, // "that's ₹X a month — fine, or tweak?" gate before the verdict
  { kind: "verdict" },
  { kind: "lock-in" },
];

// After this many roasts, retire the "Roast me, Byron" chip and lean on the
// goal-setting CTA instead. Byron's voice has been established; further
// repetition stops adding signal.
const MAX_BYRON_ROASTS = 2;

function buildStepsForConfig(config: OnboardingConfig | undefined): Step[] {
  // Intent-first (beta): wrapped hook → goal nudge (banked, optional) → AA ask → explore filler →
  // footprint → plan → lock-in. Reuses every existing screen, reordered. The footprint→lock-in tail
  // is lifted verbatim from ALL_STEPS. (Happy case: the parse finishes during explore, so we go
  // straight from "Build my plan" into the footprint walk — no session break.)
  if (config?.betaIntentFirst) {
    // The footprint walk in ALL_STEPS is: intro bot, bucket0, oblig bot, bucket1, p2p bot, bucket2,
    // one-off bot, bucket3, then the ladder-intro bot onward. Beta rewrites the footprint segment so
    // each bucket is asked as a question (then confirmed in a bottom sheet from a chip), and keeps
    // everything from the ladder-intro onward (plan → lock-in) verbatim via the slice.
    const firstBucket = ALL_STEPS.findIndex((s) => s.kind === "footprint-bucket");
    const ladderTailStart = firstBucket + 7; // the "Now the pace" ladder-intro bot
    // The goal nudge = the intro bot + the preferences quiz. Default beta asks it up front (right after
    // the wrapped hook, intent-first). New-user-2 (goalAfterExplore) moves it to AFTER the explore
    // playground, where "Build my goal plan" leads into it — the only structural difference between the two.
    const goalNudge: Step[] = [bot(BETA_GOAL_INTRO), { kind: "preferences" }];
    const goalAfterExplore = config?.goalAfterExplore ?? false;
    // Pitch: accounts were linked BEFORE this sim (in the Connect step), so drop the AA ask entirely.
    // The flow becomes wrapped → goal nudge → belief run → Byron → explore → build-plan → …, no AA.
    const skipAa = config?.betaSkipAa ?? false;
    // Pitch pre-Byron belief run: after the goal is named, echo it + the ≈2× reaction, then three
    // belief questions answered with the user's own data. Pitch has no AA gate (bank already linked),
    // so the run hands straight into "meet Byron". Only on the goal-up-front pitch path — the
    // goalAfterExplore variant has no goal banked at this point. Spec: docs/beta-pre-aa-rework.md.
    // Belief run removed from the pitch flow (was goal-echo + 2× reaction + 3 belief questions).
    const beliefRun: Step[] = [];
    // ── Cosimo pitch chat (skipAa) ──────────────────────────────────────────────
    // Accounts were linked and the personality questions answered BEFORE this sim, so there's NO wrapped
    // hook (3 insight cards), NO AA ask, and NO Byron. The chat opens on Cosimo's greeting, drops the
    // user into the explore playground while the background fetch runs, then the goal questions (reached
    // via the sync-done "Start") → build-plan → tail. (Fetch/sync-done card + persona pill: WIP.)
    if (skipAa) {
      return [
        bot(COSIMO_GREETING_1), // "Hey! I'm Cosimo" — heading line + inline avatar
        bot(COSIMO_GREETING_2), // "Thanks for connecting your accounts and answering those questions."
        { kind: "fetch-card" }, // "Fetching your transactions" card → morphs to the sync-done "Start" nudge
        bot(COSIMO_EXPLORE_PROMPT), // "While I'm working… What would you like to explore?"
        { kind: "playground" }, // explore — 3 suggestion rows (canon 796:6252)
        ...goalNudge, // goal questions (intro + preferences) — reached via the fetch card's "Start"
        { kind: "feasibility" }, // goal-planning math: verdict + lever negotiation (schematic 426:1340); fund flow skips
        { kind: "build-plan" },
        { kind: "lump-sum" }, // pitch banks the idle-cash head start before the monthly pace
        ...ALL_STEPS.slice(ladderTailStart).filter((s) => s !== PLAN_INTRO_STEP),
      ];
    }
    return [
      // Starts on the wrapped hook (no splash) — the "three patterns" text + the 3 cards. Pitch
      // reframes the opener around the background fetch: these patterns are from the SLICE account,
      // the other accounts are still crunching (the app-bar chip).
      bot(skipAa ? PITCH_INTRO_BUBBLE : PRE_WRAPPED_BUBBLES[0]),
      ...PRE_WRAPPED_BUBBLES.slice(1).map(bot),
      { kind: "wrapped" },
      ...(goalAfterExplore ? [] : goalNudge),
      ...(skipAa ? [] : [bot(BETA_AA_INTRO), { kind: "aa-chips" } as Step, bot(AA_LINKED_BUBBLE)]),
      ...beliefRun,
      bot(BETA_BYRON_INTRO), // introduce Byron (after the pitch belief run, or during the sync wait on the AA path)
      bot(BETA_BYRON_FIRST_ROAST), // Byron takeover: chat flips to his voice, he lands a first roast, then hands back
      // (No PLAYGROUND_INTRO_BUBBLES here — after the Byron takeover, "one sec, piecing your accounts
      // together" reads as nonsense; the playground's own salutation + tiles carry this beat in beta.)
      { kind: "playground" },
      ...(goalAfterExplore ? goalNudge : []),
      // Beta: no more bucket-by-bucket review sheets. Ryan "builds the plan" as a live progress stepper,
      // auto-confirming what he's sure about and only asking about genuine ambiguities inline in chat.
      { kind: "build-plan" },
      // Tail lifted verbatim MINUS the plan-intro bot line (see PLAN_INTRO_STEP for why). Pitch
      // additionally asks the lump-sum head start FIRST — before the pace question ("how much to
      // save a month") — so the idle cash is banked before any monthly math; the lock-in end then
      // only sets up the monthly autopay.
      ...(skipAa ? [{ kind: "lump-sum" } as Step] : []),
      ...ALL_STEPS.slice(ladderTailStart).filter((s) => s !== PLAN_INTRO_STEP),
    ];
  }
  // Jun 11: onboarding is terminal at the AA decision. Keep everything up to and
  // including aa-chips, then a single playground step that hosts the skip-only
  // spend mosaic. The connect path never reaches it (handleAAComplete fires
  // onComplete instead of advancing), so the goal/budget/plan steps are dropped.
  if (config?.terminalAtAa) {
    const aaIdx = ALL_STEPS.findIndex((s) => s.kind === "aa-chips");
    return [...ALL_STEPS.slice(0, aaIdx + 1), { kind: "playground" }];
  }
  // Otherwise keep the full step list so the user can opt into the goal flow via
  // an explicit tile/button even when goalRequired is false. The flag only
  // controls auto-advancement and chip labels, not step availability.
  return [...ALL_STEPS];
}

// The goal-type answer decides which follow-up questions make sense:
//   trip      → where + by when + how much
//   purchase  → what + by when + how much
//   emergency → how much only (ongoing, no deadline)
//   save-more → nothing further (straight to plan)
// Returning a path-specific list keeps the overlay's "x of N" counter honest.
function buildPrefQuestions(goalTypeId: string | undefined): Question[] {
  const byId = (id: string) => GOAL_PREFERENCE_QUESTIONS.find((q) => q.id === id)!;
  const goal = byId("goal-type");
  const dest = byId("destination");
  const timeline = byId("timeline");
  const amount = byId("amount");
  switch (goalTypeId) {
    case "trip":
      return [goal, { ...dest, text: "Where are you headed?" }, timeline, amount];
    case "purchase":
      return [goal, { ...dest, text: "What are you buying?" }, timeline, amount];
    case "emergency":
      return [goal, amount];
    case "save-more":
      return [goal];
    default:
      return [goal];
  }
}

// ── Conversational mode (pitch) helpers ─────────────────────────────────────
// Options rendered as SUGGESTION ROWS (canon 882:5873 — the "What do you want to save towards?"
// layout): optional emoji/icon + a Medium label per row, hairline dividers between. Typing "1"/"2",
// the option text, or anything free-form still routes; the rows are tappable. `icons` lines up with
// `options` (undefined slots render label-only rows). The old numbered "for example:" list is gone —
// every options ask in the Cosimo chat wears this same format.
// Option rows (and other "followups") land after their question finishes typing — they must NOT
// yank the scroll down to themselves: the reader's focus stays on the answer above, the rows just
// wait below the fold. The mount stamps this window; the stick-to-bottom follower skips it.
// (Module-scoped is fine here: only one sim is interactive at a time in the proto.)
let suppressChatFollowUntil = 0;

// Same guard for the explore suggestion rows (they're inline JSX, not InlineOptions).
function ExploreRowsGuard() {
  useEffect(() => {
    suppressChatFollowUntil = Date.now() + 700;
  }, []);
  return null;
}

function InlineOptions({ options, onPick, icons }: { options: string[]; onPick: (index: number) => void; examples?: boolean; icons?: (string | undefined)[] }) {
  useEffect(() => {
    suppressChatFollowUntil = Date.now() + 700;
  }, []);
  // Answered rows LEAVE (R14) — options that linger read as still waiting. Resets
  // when a new set of options arrives (one mounted instance serves several rounds).
  const [picked, setPicked] = useState(false);
  const optionsKey = options.join("|");
  useEffect(() => {
    setPicked(false);
  }, [optionsKey]);
  if (picked) return null;
  return (
    // 24 above the rows (R15 — 40 read as a gap between the ask and its answers).
    <div className="animate-chat-message-in" style={{ marginTop: SPACE_L, display: "flex", flexDirection: "column", gap: SPACE_M }}>
      {options.map((label, idx) => (
        <Fragment key={label}>
          <button
            type="button"
            onClick={() => { setPicked(true); onPick(idx); }}
            className="transition-transform active:scale-[0.99]"
            style={{ display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
          >
            {icons?.[idx] != null && (
              <span aria-hidden style={{ fontSize: 20, lineHeight: "28px", width: 28, textAlign: "center", flexShrink: 0 }}>{icons[idx]}</span>
            )}
            <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{label}</span>
          </button>
          {idx < options.length - 1 && <div aria-hidden style={{ height: 1, backgroundColor: OUTLINE_SUBTLE, width: "100%" }} />}
        </Fragment>
      ))}
    </div>
  );
}

// Typed-answer matching: "2" → option 2; exact label; then a loose contains-match for 3+ chars.
function matchOptionIndex(input: string, labels: string[]): number {
  const t = input.trim().toLowerCase();
  const n = Number(t);
  if (Number.isInteger(n) && n >= 1 && n <= labels.length && String(n) === t) return n - 1;
  const exact = labels.findIndex((l) => l.toLowerCase() === t);
  if (exact >= 0) return exact;
  if (t.length < 3) return -1;
  return labels.findIndex((l) => l.toLowerCase().includes(t) || t.includes(l.toLowerCase()));
}
const isYesish = (t: string) => /^(y\b|yes|yeah|yep|ya\b|sure|ok\b|okay|sounds good|looks good|looks right|go\b|do it|build|let'?s go|show me|why not|haan|done)/i.test(t);
const isNoish = (t: string) => /^(n\b|no\b|nope|nah|skip|not now|later|pass|none)/i.test(t);
// Typed rupee amounts for the funding asks: "15000", "15k", "₹25,000". Bare small digits ("1", "2")
// are rejected so numbered-option answers never read as money.
function parseTypedAmount(input: string): number | null {
  const m = input.replace(/[₹,\s]/g, "").match(/^(\d+(?:\.\d+)?)(k)?$/i);
  if (!m) return null;
  const n = parseFloat(m[1]) * (m[2] ? 1000 : 1);
  return n >= 100 ? Math.round(n) : null;
}

// One-at-a-time explore offers while the cruncher runs: instead of a row of pills, Ryan asks a single
// question per reveal; yes plays it, no moves to the next.
const CONVO_OFFER_TEXTS: Record<string, string> = {
  "top-categories": "While the cruncher works through your accounts, want to see where most of your money actually goes?",
  "month-story": "Curious if you're spending more than you used to? I can pull that up.",
  "spending-says": "Want to know what you're overspending on? I have a hunch.",
  "roast-byron": "Byron's been reading your statements. Want his take? He doesn't sugarcoat.",
};

// Quiz answer → numbers. Amounts and timelines map to figures so the plan can
// be computed from what the user actually picked (see the goal-aware derivation
// in the component). Indian-format the result so highlightValues bolds it.
const AMOUNT_MAP: Record<string, number> = { "50k": 50000, "1L": 100000, "2L": 200000, "5L+": 500000 };
const TIMELINE_MONTHS: Record<string, number> = { "3m": 3, "6m": 6, "1y": 12 };
const TIMELINE_LABELS: Record<string, string> = { "3m": "in 3 months", "6m": "in 6 months", "1y": "in 12 months" };
function formatINR(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

// "Building your plan" stepper (beta). Ryan walks these in order, auto-confirming the confident ones
// and pausing only where `q` is set (a genuine ambiguity) to ask inline. `done` is the confirmed caption.
// `q` carries a value HIERARCHY (source + value) + a short prompt, so the ambiguity reads as a
// structured inline card ("Dad" / "₹7,000–10,000" / "Count towards income?"), not a long sentence.
type BuildPlanStage = { key: string; label: string; done: string; q: { id: string; source: string; value: string; prompt: string; yes: string; no: string } | null };
const BUILD_PLAN_STAGES: BuildPlanStage[] = [
  {
    key: "income",
    label: "Income",
    done: `Salary · ${formatINR(SPENDING_PLAN_FIXTURE.income)}`,
    q: { id: "dad-income", source: "Dad", value: "₹7,000–10,000", prompt: "Count towards income?", yes: "Yes, include it", no: "No, leave it out" },
  },
  {
    key: "obligations",
    label: "Bills & obligations",
    done: `Rent, EMIs, subs · ${formatINR(SPENDING_PLAN_FIXTURE.obligations)}`,
    q: { id: "oblig-fuzzy", source: "Cult.fit", value: "₹1,200 / mo", prompt: "Fixed monthly bill?", yes: "Yes, it's regular", no: "No, it's one-off" },
  },
  { key: "spending", label: "Everyday spending", done: "Food, transport, the usual", q: null },
  { key: "plan", label: "Your plan", done: "Your full picture", q: null },
];

// Beta background-fetch cruncher — the status line cycles while the money is pulled in the background
// (the user explores meanwhile). Reads as work happening, not a blocking wait.
const AA_FETCH_TEXTS = [
  "Securely reading your accounts",
  "Sorting the last 6 months",
  "Spotting your regular bills",
  "Mapping where it all goes",
];

// Persona switch banter: the newly-picked character introduces themselves on every switch. Ryan stays
// playful and starts ribbing you if you flip too often; Byron sours by the 4th. Index clamps at the last.
const PERSONA_SWITCH_INTROS: Record<Voice, string[]> = {
  ryan: [
    "Back to me. I'll keep it kind.",
    "Ryan again. Byron's a lot, I know.",
    "Hey again. Where were we?",
    "Third time back to me. Can't make up your mind?",
    "You're just flipping us now. Pick a lane, yeah?",
  ],
  byron: [
    "Byron. I say what Ryan softens.",
    "Back for the honest read. Good.",
    "Me again. Bored of the pep talk already?",
    "Fourth switch. I'm not a party trick.",
    "Enough flipping. Decide who you actually want.",
  ],
};

// Ryan's text line - plain text, typewriter on first reveal, full text afterwards
function RyanLine({
  text,
  active,
  onDone,
}: {
  text: string;
  active: boolean;
  onDone?: () => void;
}) {
  const displayed = useTypewriter(text, active, onDone);
  return (
    <p
      className="whitespace-pre-line animate-chat-message-in"
      style={{ ...typography.bodySmall, color: TEXT_PRIMARY, marginTop: SPACE_M }}
    >
      {highlightValues(displayed)}
    </p>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Cosimo pitch chat — first-chat pieces (canon 796:6252)
// ══════════════════════════════════════════════════════════════════

// The big greeting line — Rubik Medium 24/32 (headerH2) with the 24px Cosimo avatar
// image landing inline after the text once the typewriter finishes.
function CosimoGreetingLine({ text, active, onDone }: { text: string; active: boolean; onDone?: () => void }) {
  const displayed = useTypewriter(text, active, onDone);
  const typed = displayed.length >= text.length;
  return (
    <p className="animate-chat-message-in" style={{ ...typography.headerH2, color: TEXT_PRIMARY, marginTop: SPACE_M }}>
      {displayed}
      <img
        src="/chat/cosimo-avatar.png"
        alt=""
        aria-hidden
        width={24}
        height={24}
        draggable={false}
        style={{ display: "inline-block", verticalAlign: "-3px", marginLeft: SPACE_XS, opacity: typed ? 1 : 0, transition: "opacity 240ms ease" }}
      />
    </p>
  );
}

// Fetch-status card: white card (radius 16, px20/py16, card shadow) — title + cycling
// subtitle + the dual-ellipse spinner. On sync-done it morphs into the goal nudge:
// "Transaction data updated / Start your goal plan" + a Start pill (no toast, no %).
const COSIMO_FETCH_SUBTITLES = [
  "Spotting your patterns",
  "Sorting the last 6 months",
  "Spotting your regular bills",
  "Mapping where it all goes",
];

function CosimoFetchCard({
  done,
  showStart,
  active,
  onSettled,
  onStart,
}: {
  done: boolean;
  showStart: boolean; // Start hides once the goal flow is already underway
  active: boolean;
  onSettled?: () => void; // auto-advance: the card fades in, holds a beat, then the flow moves on
  onStart: () => void;
}) {
  const [subIdx, setSubIdx] = useState(0);
  useEffect(() => {
    if (done) return;
    const iv = window.setInterval(() => setSubIdx((i) => (i + 1) % COSIMO_FETCH_SUBTITLES.length), 7000);
    return () => window.clearInterval(iv);
  }, [done]);
  useEffect(() => {
    if (!active || !onSettled) return;
    const t = window.setTimeout(onSettled, 900);
    return () => window.clearTimeout(t);
  }, [active, onSettled]);
  return (
    <div
      className="animate-chat-message-in"
      style={{
        display: "flex",
        alignItems: "center",
        gap: SPACE_XS,
        backgroundColor: BG_CARD,
        border: `1px solid ${OUTLINE_SUBTLE}`,
        borderRadius: RADIUS_M,
        padding: `${SPACE_M}px 20px`,
        boxShadow: ELEVATION_CARD,
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <p style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, margin: 0 }}>
          {done ? "Transaction data updated" : "Fetching your transactions"}
        </p>
        {/* one line, always — a wrapping subtitle changed the card's height mid-idle
            and the follow read it as new content (the reported slow drift, R15) */}
        <p style={{ ...typography.caption, color: TEXT_PRIMARY, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {done ? "Start your goal plan" : COSIMO_FETCH_SUBTITLES[subIdx]}
        </p>
      </div>
      {done ? (
        showStart && (
          // Canon "Extended" button (812:5977): compact light-slate pill, dark label (Med 12) —
          // NOT a brand-magenta CTA.
          <button
            type="button"
            onClick={onStart}
            className="transition-transform active:scale-[0.97] animate-chat-message-in"
            style={{ ...typography.caption, fontWeight: 500, color: TEXT_PRIMARY, backgroundColor: SLATE_30, border: "none", borderRadius: RADIUS_CIRCLE, padding: "7px 13px", cursor: "pointer", flexShrink: 0 }}
          >
            Start
          </button>
        )
      ) : (
        // Dual-ellipse spinner (Component 1, set 812:5314) — the exported ring + arc, spun via CSS.
        <div aria-hidden className="animate-spin" style={{ position: "relative", width: 24, height: 24, flexShrink: 0 }}>
          <img src="/chat/spinner-ring.svg" alt="" width={24} height={24} draggable={false} style={{ position: "absolute", inset: 0 }} />
          <img src="/chat/spinner-arc.svg" alt="" width={16} height={24} draggable={false} style={{ position: "absolute", left: 0, top: 0 }} />
        </div>
      )}
    </div>
  );
}

// On-scroll persona pill (canon 796:6295) — fades into the app-bar centre once the chat scrolls:
// the 24px Cosimo avatar wrapped by the dual-ellipse spinner ring, "Cosimo" (Med 16), and a live
// status subtitle. On sync-done the spinner resolves and the subtitle drops — just "Cosimo"
// (canon 812:5961). Non-interactive; hangs below the 64px bar over the scrim.
function CosimoPersonaPill({ visible, done }: { visible: boolean; done: boolean }) {
  return (
    <div
      aria-hidden={!visible}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: done ? 0 : 4,
        // R15: the PILL exists while fetching; once the fetch lands the chrome
        // dissolves and the avatar + "Cosimo" hold the same spot, bare.
        backgroundColor: done ? "rgba(255,255,255,0)" : BG_SHEET,
        border: `1px solid ${done ? "rgba(0,0,0,0)" : OUTLINE_SUBTLE}`,
        borderRadius: 48,
        boxShadow: done ? "none" : ELEVATION_CARD,
        padding: done ? "12px 14px 12px 12px" : "16px 24px 12px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-8px)",
        transition: "opacity 220ms ease, transform 220ms ease, padding 260ms ease, gap 260ms ease, background-color 260ms ease, border-color 260ms ease, box-shadow 260ms ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ position: "relative", width: 24, height: 24, flexShrink: 0 }}>
          <img
            src="/chat/cosimo-avatar.png"
            alt=""
            // Ringed by the spinner while fetching (17px inside the 24px ring); grows to 20px
            // once the ring resolves away (done).
            width={done ? 20 : 17}
            height={done ? 20 : 17}
            draggable={false}
            style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", borderRadius: "50%", transition: "width 220ms ease, height 220ms ease" }}
          />
          {/* Ring stays mounted through the resolve so it FADES out with the avatar growing into
              its place — unmounting it snapped the pill between states (the reported jarring flip). */}
          <div aria-hidden className="animate-spin" style={{ position: "absolute", inset: 0, opacity: done ? 0 : 1, transition: "opacity 260ms ease" }}>
            <img src="/chat/spinner-ring.svg" alt="" width={24} height={24} draggable={false} style={{ position: "absolute", inset: 0 }} />
            <img src="/chat/spinner-arc.svg" alt="" width={16} height={24} draggable={false} style={{ position: "absolute", left: 0, top: 0 }} />
          </div>
        </div>
        <span style={{ ...typography.headerH4, color: TEXT_PRIMARY, whiteSpace: "nowrap" }}>Cosimo</span>
      </div>
      {/* Subtitle collapses smoothly (height + width + fade together) instead of vanishing in one
          frame — maxWidth must collapse too, or the nowrap text keeps propping the pill wide. */}
      <div aria-hidden={done} style={{ maxHeight: done ? 0 : 20, maxWidth: done ? 0 : 220, opacity: done ? 0 : 1, overflow: "hidden", transition: "max-height 260ms ease, max-width 260ms ease, opacity 200ms ease" }}>
        <span style={{ ...typography.caption, color: TEXT_TERTIARY, whiteSpace: "nowrap" }}>Fetching your transactions</span>
      </div>
    </div>
  );
}

// ── Atom creation page (schematic Deployment cluster + DLS atom recipe) ─────────────────────
// Full-screen slide-up over the chat: back chevron + "atom" title, a centred amount hero with
// +preset chips, the recurring details (autopay mode), and a primary confirm. The chat's card
// flips to its done state (canon 484:3090) when this confirms.
function AtomCreateScreen({
  mode,
  baseAmount,
  potLabel,
  onConfirm,
  onBack,
}: {
  mode: "one-time" | "autopay";
  baseAmount: number;
  potLabel: string;
  onConfirm: (amount: number) => void;
  onBack: () => void;
}) {
  const [amount, setAmount] = useState(baseAmount);
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ backgroundColor: BG_PRIMARY, animation: "pitchSlideInUp 360ms cubic-bezier(0.22, 1, 0.36, 1) both" }}
    >
      <StatusBar backgroundColor="transparent" />
      <div className="shrink-0 relative flex items-center justify-center" style={{ height: 64 }}>
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="absolute flex items-center justify-center transition-transform active:scale-[0.9]"
          style={{ left: 12, width: 48, height: 48, background: "none", border: "none", cursor: "pointer", padding: 12 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 6L9 12L15 18" stroke={TEXT_PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{ ...typography.headerH4, color: TEXT_PRIMARY }}>atom</span>
      </div>
      <div className="flex-1 min-h-0 flex flex-col items-center" style={{ paddingTop: 48, paddingLeft: SPACE_L, paddingRight: SPACE_L }}>
        <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: 0 }}>
          {mode === "one-time" ? `One-time contribution · ${potLabel}` : `Monthly autopay · ${potLabel}`}
        </p>
        <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: "8px 0 0" }}>{formatINR(amount)}</p>
        {/* Preset steps (schematic: 500 / 1,000 / 5,000) — additive taps, amount stays editable. */}
        <div style={{ display: "flex", gap: 8, marginTop: SPACE_L }}>
          {[500, 1000, 5000].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount((a) => a + p)}
              className="transition-transform active:scale-[0.96]"
              style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, backgroundColor: SLATE_10, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_CIRCLE, padding: "8px 14px", cursor: "pointer" }}
            >
              +{formatINR(p)}
            </button>
          ))}
        </div>
        {mode === "autopay" && (
          <div style={{ width: "100%", marginTop: SPACE_XL, display: "flex", flexDirection: "column" }}>
            {[
              { label: "Frequency", value: "Every month" },
              { label: "Starts", value: "1st of next month" },
              { label: "Ends", value: "When the goal is met" },
            ].map((r, k, arr) => (
              <Fragment key={r.label}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
                  <span style={{ ...typography.bodySmall, color: TEXT_SECONDARY }}>{r.label}</span>
                  <span style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{r.value}</span>
                </div>
                {k < arr.length - 1 && <div aria-hidden style={{ height: 1, backgroundColor: OUTLINE_SUBTLE }} />}
              </Fragment>
            ))}
          </div>
        )}
        <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: "auto 0 0", paddingBottom: SPACE_M, textAlign: "center" }}>
          Earns 100% of repo rate, interest paid daily
        </p>
      </div>
      <div className="shrink-0" style={{ padding: `0 ${SPACE_L}px ${SPACE_M}px` }}>
        <button
          type="button"
          onClick={() => onConfirm(amount)}
          className="transition-transform active:scale-[0.98]"
          style={{ ...typography.buttonSmall, width: "100%", height: 48, color: TEXT_ON_COLOR_PRIMARY, backgroundColor: MAIN_PRIMARY, border: "none", borderRadius: RADIUS_CIRCLE, cursor: "pointer" }}
        >
          {mode === "one-time" ? "Create atom" : "Set up autopay"}
        </button>
      </div>
      <GestureNav backgroundColor="transparent" />
    </div>
  );
}

// Plain-text ledger row (canon 463:3230 / 492:1742): a +/− prefix column and secondary label on the
// left, the amount right-aligned. The emphasis row (Monthly budget) steps up to Medium 16 in green.
function CosimoLedgerRow({ prefix, label, amount, emphasis }: { prefix?: string; label: string; amount: string; emphasis?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {prefix != null && <span style={{ ...typography.bodySmall, color: TEXT_SECONDARY, width: 8, textAlign: "center", flexShrink: 0 }}>{prefix}</span>}
        <span style={{ ...typography.bodySmall, color: TEXT_SECONDARY }}>{label}</span>
      </div>
      <span style={{ ...(emphasis ? typography.headerH4 : typography.bodySmall), color: emphasis ? GREEN_500 : TEXT_PRIMARY, whiteSpace: "nowrap" }}>{amount}</span>
    </div>
  );
}

// Goal-type icon per option (canon 882:5873 uses emoji-style icons on the rows).
const COSIMO_GOAL_ICONS: Record<string, string> = {
  trip: "🏖️",
  purchase: "💻",
  emergency: "💰",
  "save-more": "🌱",
};

// The explore entry — 3 suggestion rows (28px icon + label) split by hairlines, NOT pill chips.
const COSIMO_EXPLORE_ROWS = [
  { id: "big-spends", icon: "/chat/chip-spends.png", label: "What have been my biggest spends?" },
  { id: "top-categories", icon: "/chat/chip-categories.png", label: "My top spending categories?" },
  { id: "spending-says", icon: "/chat/chip-persona.png", label: "What your spending says about me?" },
];

// ══════════════════════════════════════════════════════════════════
//  Playground traits panel - annotations under spending-heatmap card
// ══════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════
//  Main sim
// ══════════════════════════════════════════════════════════════════

const PDP_FEATURES = [
  { title: "Spending, decoded", subtitle: "See exactly where every rupee goes", iconSrc: "/icons/graph.svg" },
  { title: "Trends, month on month", subtitle: "Watch the patterns build, not just last week", iconSrc: "/icons/spark-line.svg" },
  { title: "What your spending says", subtitle: "The habits behind the numbers, no judgement", iconSrc: "/icons/message.svg" },
];

// Skip-only mosaic shown after the user opts out of AA linking (Jun 11 terminal
// path). Three tiles surface spend-analytics previews that reveal an existing
// visualization inline (reusing PLAYGROUND_REVEALS); the fourth reconnects the
// AA flow. The on-track review variant keeps its own MOSAIC_* constants in
// Chat.tsx.
type SkipSpendTile = QuickAction & { chipId: string };
// Dummy placeholder icon for tiles that don't have a bespoke illustration yet —
// keeps every mosaic tile showing a visible icon instead of a blank box.
// Real slice illustrations + a distinct themed insight colour per tile. DECOR_TILE_* are
// pale jewels in light (the good light look) ↔ richer jewel tones in dark; text stays
// themed (dark on light, white on dark) so each tile reads cleanly in both modes.
const SKIP_SPEND_TILES: SkipSpendTile[] = [
  { chipId: "top-categories", category: "Last month", title: "Top categories", illustration: ILLUST_MY_SPENDS, bg: DECOR_TILE_ORANGE },
  { chipId: "month-story", category: "Spend trends", title: "Month on month", illustration: ILLUST_AFFORD_IT, bg: DECOR_TILE_BLUE },
  { chipId: "spending-says", category: "Spend personality", title: "What your spending says", illustration: ILLUST_FEEDBACK, bg: DECOR_TILE_VALENTINO },
  { chipId: "big-spends", category: "Biggest hits", title: "Big spends", illustration: ILLUST_AFFORD_IT, bg: DECOR_TILE_RED },
  { chipId: "spend-365", category: "Last 365 days", title: "Day by day", illustration: ILLUST_MY_SPENDS, bg: DECOR_TILE_BLUE },
];
const SKIP_CONNECT_TILE: QuickAction = { category: "Accounts", title: "Connect other accounts", illustration: ILLUST_FEEDBACK, bg: DECOR_TILE_GREEN };


// Vertical list-card variant of the spend mosaic (enhancements track). A full-width row: the tile's
// gradient lives on a small icon square on the left (same dummy illustration as the mosaic), with the
// category + title beside it on a neutral card surface. Same copies as the square mosaic, just stacked
// and easier to scan top-to-bottom.
function SpendListCard({ action, onSelect }: { action: QuickAction; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left transition-transform active:scale-[0.99]"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: RADIUS_M,
        background: BG_CARD,
        border: `1px solid ${OUTLINE_SUBTLE}`,
        boxShadow: ELEVATION_CARD,
      }}
    >
      {/* Bare icon on the left — no squircle container; keeps the row compact. */}
      {action.illustration && (
        <img src={action.illustration} alt="" style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }} />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
        <span style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY, whiteSpace: "nowrap" }}>
          {action.category}
        </span>
        <span style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY }}>{action.title}</span>
      </div>
    </button>
  );
}

// Connect (Jun 11 terminal) path: after linking, transactions take time to pull
// and parse. The cruncher cycles these while the work runs in the background;
// the user can dismiss it and explore the mosaic meanwhile, and Ryan posts a
// completion line once the snapshot is ready.
const SYNC_TEXTS = [
  "Pulling your transactions",
  "Sorting them by category",
  "Spotting your patterns",
  "Building your spending snapshot",
];
// Prompts that roll through the terminal "Ask Ryan" field and back the message
// button's suggestions sheet.
// Short 2-3 word prompts (things people might ask Ryan) — they roll after the
// "Ask Ryan" lead, so they read as quick taps rather than full questions.
const WALKTHROUGH_SUGGESTIONS = [
  "Track my spends",
  "Top categories",
  "Spending trends",
  "Ways to save",
  "Biggest spends",
];
const SYNC_DONE_LINE: DualVoiceRef = {
  ryan: "All done. I've read through your transactions and your spending snapshot is ready.",
  byron: "Finished digging. I've been through every transaction, the snapshot's ready when you are.",
};
const CONNECT_SALUTATION: DualVoiceRef = {
  ryan: "You're all set. I'm reading through your transactions now, meanwhile here are a few things you can explore.",
  byron: "Linked. I'm digging through your transactions as we speak. Amuse yourself with these while I work.",
};

export type GoalCompletionPayload = {
  type: string;
  name: string;
  amountNum?: number;
  timelineMonths?: number;
  monthly: number;
  initialFunded: number;
  paceId?: string;
};

export default function OnboardingSim({
  onComplete,
  onOpenGoals,
  onOpenGoalDetail,
  onViewFeed,
  trackerHidden = false,
  config,
}: {
  onComplete?: (opts?: { skipGoal?: boolean; goal?: GoalCompletionPayload; openGoal?: boolean }) => void;
  // Beta peek model: open the safe-to-spend screen OVER the chat (this sim stays mounted),
  // so closing it returns to the chat — onboarding does NOT complete and we never land on the
  // returning-user home. Non-beta leaves this undefined and keeps the closeOverlay completion.
  // The rect is the tracker ring's screen box, so the parent can morph it into the L1 hero ring.
  // budgets = the LIVE plan's category caps (tier + edits applied) so the peek's hero/categories and
  // the morph ghost show the same numbers as the chat's budget card + tracker chip.
  onOpenGoals?: (rect?: DOMRect, goal?: GoalIndicatorData, budgets?: CategoryBudget[]) => void;
  // Open the individual goal's detail page (the AddToPotCard arrow) — distinct from the safe-to-spend
  // peek (onOpenGoals). The goal "page" is the pot/goal detail, not the budget overview.
  onOpenGoalDetail?: (goal: GoalIndicatorData) => void;
  // Cosimo pitch (R14): the end of the lock-in beat offers a "View feed" pill instead
  // of the key card — tapping it hands the chat off to the return-exp1 feed.
  onViewFeed?: () => void;
  // While the peek is open the parent hides the real tracker (the morphing ghost / hero ring
  // stands in for it) so the ring isn't visible in two places during the shared-element transition.
  trackerHidden?: boolean;
  config?: OnboardingConfig;
} = {}) {
  const STEPS = useMemo(
    () => buildStepsForConfig(config),
    [config?.goalRequired, config?.terminalAtAa, config?.betaIntentFirst, config?.goalAfterExplore],
  );
  const LAST_STEP_INDEX = STEPS.length - 1;
  const PREFERENCES_STEP_INDEX = STEPS.findIndex((s) => s.kind === "preferences");
  // Beta resume target: the footprint intro bot (the step before the first bucket).
  const FOOTPRINT_RESUME_INDEX = STEPS.findIndex((s) => s.kind === "footprint-bucket") - 1;
  // Beta replaces the footprint buckets with the "building your plan" stepper.
  const BUILD_PLAN_STEP_INDEX = STEPS.findIndex((s) => s.kind === "build-plan");
  // The "HDFC linked, pulling your data" bot line — where the beta background-fetch cruncher appears.
  const AA_LINKED_STEP_INDEX = STEPS.findIndex((s) => s.kind === "bot" && s.dv === AA_LINKED_BUBBLE);
  // Cruncher anchor: normally the AA-linked line; on the pitch path (AA skipped) it rides from the very
  // top — anchored at the first line (right below Ryan's opening heading) so it pins on top immediately
  // and stays above the chat the whole way through.
  const CRUNCHER_ANCHOR_INDEX = (config?.betaIntentFirst && config?.betaSkipAa) ? 0 : AA_LINKED_STEP_INDEX;
  const LADDER_PICK_STEP_INDEX = STEPS.findIndex((s) => s.kind === "ladder-pick");
  const LADDER_INTRO_STEP_INDEX = LADDER_PICK_STEP_INDEX - 1; // the "Now the pace" bot line
  const PLAYGROUND_STEP_INDEX = STEPS.findIndex((s) => s.kind === "playground");
  // The Byron-intro bot line that sits between the AA chips and the playground. We keep it visible
  // on the skip path (see the terminal-path filter below) so Byron still gets introduced even when
  // the user declines to link accounts.
  const BYRON_INTRO_STEP_INDEX = STEPS.findIndex((s) => s.kind === "bot" && s.dv === BETA_BYRON_INTRO);
  // Conversational folds the "named plans work 2x harder" line INTO the goal-echo card (as a small
  // stat visual), so this standalone bot step renders nothing there and auto-skips.
  const NAMED_2X_STEP_INDEX = STEPS.findIndex((s) => s.kind === "bot" && s.dv === BETA_NAMED_2X);
  // Pitch asks the lump sum BEFORE the budget (its own step); lock-in then skips its head-start beat.
  const LUMP_SUM_STEP_INDEX = STEPS.findIndex((s) => s.kind === "lump-sum");
  const BYRON_ROAST_STEP_INDEX = STEPS.findIndex((s) => s.kind === "bot" && s.dv === BETA_BYRON_FIRST_ROAST);
  const AA_CHIPS_STEP_INDEX = STEPS.findIndex((s) => s.kind === "aa-chips");
  const LOCK_IN_STEP_INDEX = STEPS.findIndex((s) => s.kind === "lock-in");
  const WRAPPED_STEP_INDEX = STEPS.findIndex((s) => s.kind === "wrapped"); // -1 on the Cosimo pitch flow (no wrapped hook)
  const POST_WRAPPED_STEP_INDEX = WRAPPED_STEP_INDEX + 1;
  const aaMode = config?.aaMode ?? "required";
  // The "byron" skip milestone IS the meet-Byron state, so Byron is forced on there regardless of
  // the Voice toggle (which otherwise feeds config.introduceByron).
  const introduceByron = config?.startMilestone === "byron" ? true : (config?.introduceByron ?? true);
  const goalRequired = config?.goalRequired ?? true;
  const byronGatedByAa = config?.byronGatedByAa ?? false;
  const payScreenVariant = config?.payScreenVariant ?? "current";
  const terminalAtAa = config?.terminalAtAa ?? false;
  const betaIntentFirst = config?.betaIntentFirst ?? false;
  // Cosimo pitch chat (canon 796:6252): single assistant, ✕ + privacy-shield app bar, heading
  // greeting, inline fetch card with the sync-done Start nudge, icon-row explore suggestions.
  const cosimoChat = betaIntentFirst && !!config?.betaSkipAa;
  // "Bills exceed income" data-gap branch (canon 414:1027) — the plan build blocks on the escape
  // card until the user "connects more accounts" (mocked) or exits.
  const planDataGap = cosimoChat && !!config?.planDataGap;
  const [planGapResolved, setPlanGapResolved] = useState(false);
  // Cosimo lock-in: the atom/autopay cards wait for their explainer lines to finish typing
  // (cards never land while the text above them is still streaming).
  const [atomIntroDone, setAtomIntroDone] = useState(false);
  const [autopayIntroDone, setAutopayIntroDone] = useState(false);
  // Atom deployment (canon 484:3090): Create atom opens the full-screen atom page; confirming flips
  // the chat card to its ticked done state, then the monthly-autopay card (Setup) commits the goal.
  const [atomCreated, setAtomCreated] = useState(false);
  // The chat's one-time-contribution card — snapped to the top when its atom lands (canon 484:3090).
  const atomCardRef = useRef<HTMLDivElement>(null);
  // The autopay section ("Your atom is ready" + card) — snapped to the top once autopay is set up.
  const autopaySectionRef = useRef<HTMLDivElement>(null);
  const [atomPageOpen, setAtomPageOpen] = useState<null | "one-time" | "autopay">(null);
  // Pitch conversational mode: every follow-up is asked inside Ryan's messages (numbered options,
  // typed answers via the always-on chat input) — no question sheets, no pills, no ack buttons.
  const conversational = betaIntentFirst && (config?.conversational ?? false);
  // New-user-2: the goal nudge sits AFTER explore (see buildStepsForConfig + the "Build my goal plan" tap).
  const goalAfterExplore = betaIntentFirst && (config?.goalAfterExplore ?? false);
  const betaStartStep = betaIntentFirst ? config?.betaStartStep : undefined;
  // Phone (full-bleed) prototype mode — drives the mobile-only chrome sizing (shorter top fade,
  // since the simulated status bar is gone and the app bar sits below the notch).
  const isMobile = useIsMobileProto();
  // Targets past the AA ask seed a resolved "connect" so the AA step reads done in the transcript above.
  // In new-user-2 the goal nudge sits after explore (so it's past AA too) — seed it resolved as well.
  const betaPastAa = betaStartStep != null && ["byron", "explore", "footprint", "plan", "budget", "verdict", "lock-in", "feed", ...(goalAfterExplore ? ["goal"] : [])].includes(betaStartStep);
  // "feed" (R14): land on the END of the lock-in beat — pot funded, safe-to-spend
  // revealed, the View feed pill waiting. Seeds the whole lock-in tail below.
  const seedFeedBeat = betaStartStep === "feed";
  // DEV fast-forward: when set, the useState initializers below seed the sim
  // straight into a post-connect milestone instead of step 0. Read before the
  // useState block so the lazy initializers can branch on it. PLAYGROUND_STEP_INDEX
  // / AA_CHIPS_STEP_INDEX are derived just above (lines ~436-437), so they are in
  // scope here too. When undefined, every seeded initializer returns its original
  // default verbatim and the linear flow is unchanged.
  const startMilestone = config?.startMilestone;
  // The three TERMINAL milestones share the post-AA-connect seed (mosaic on the
  // playground step, overlay open in chat, aaConnected true, etc.). The lighter
  // "cards-unflipped" milestone must NOT inherit any of that — it only seeds the
  // wrapped step + revealedCount 0 — so the seeds below branch on this rather
  // than `startMilestone != null`.
  const isTerminalMilestone =
    startMilestone === "connected" || startMilestone === "snapshot" || startMilestone === "asked";
  // "byron" lands on the new-user playground (branch 3) where the "Roast me, Byron" chip appears —
  // NOT the connect mosaic. So it stays aaConnected=false (branch 3 renders) but reuses the
  // post-AA seed (aaChipPicked connect + land on the playground step).
  const isByronMilestone = startMilestone === "byron";
  // The terminal connect mosaic lives on the playground step; clamp to 0 so a
  // misconfigured STEPS (no playground) can't seed a negative index.
  const seededStepIndex = Math.max(0, PLAYGROUND_STEP_INDEX);

  // True once the user taps "Skip for now" on the AA chip step. Triggers the
  // skip-mosaic render path and hides the "linked" bot lines that buy time
  // during the (now non-existent) fetch.
  const [aaSkipped, setAaSkipped] = useState(false);
  // Connect (Jun 11 terminal) path: linking lands on a terminal mosaic with a
  // background transaction-sync cruncher. `connectSyncStatus` cycles SYNC_TEXTS,
  // `connectSyncDone` flips when parsing finishes, `connectCruncherDismissed`
  // lets the user close the card while the sync keeps running.
  const [aaConnected, setAaConnected] = useState(() => isTerminalMilestone);
  const [connectSyncStatus, setConnectSyncStatus] = useState(() =>
    startMilestone === "connected" ? SYNC_TEXTS[0] : isTerminalMilestone ? SYNC_TEXTS[SYNC_TEXTS.length - 1] : SYNC_TEXTS[0],
  );
  // "connected" is the only seeded state where the sync is still running; the
  // existing cruncher effect (guarded by !connectSyncDone) then completes it on
  // its own, faithfully progressing connected → snapshot.
  const [connectSyncDone, setConnectSyncDone] = useState(() => startMilestone === "snapshot" || startMilestone === "asked");
  const [connectCruncherDismissed, setConnectCruncherDismissed] = useState(false);
  // Single overlay - content swaps between "pdp" and "chat" inside it
  // Beta STARTS on the slice home (pay screen) with the "Meet Ryan" tooltip. The first Ryan tap opens
  // the FeaturePDP ("Meet Ryan" intro), and its CTA advances to chat — same first-run experience as
  // jun-11. So a fresh beta run starts CLOSED, screen "pdp", pdpSeen false. A debug "skip to" a real
  // step (betaStartStep, excluding "splash") still opens straight into chat, bypassing the PDP.
  // Pitch (betaSkipAa) opens STRAIGHT into chat on the wrapped hook — no pay-screen/PDP base first
  // (the "Meet Ryan" pitch already played), so it's treated like a debug skip-to-step.
  const betaSkipToStep = (betaStartStep != null && betaStartStep !== "splash") || (betaIntentFirst && !!config?.betaSkipAa);
  const [overlayScreen, setOverlayScreen] = useState<"pdp" | "chat">(() => (startMilestone != null || betaSkipToStep ? "chat" : "pdp"));
  const [pdpSeen, setPdpSeen] = useState(() => isTerminalMilestone || betaSkipToStep); // once true, pill tap goes straight to chat
  const [overlayOpen, setOverlayOpen] = useState(() => startMilestone != null || betaSkipToStep);
  const [overlayMounted, setOverlayMounted] = useState(() => startMilestone != null || betaSkipToStep);
  const [stepIndex, setStepIndex] = useState(() => {
    // Beta "Skip to" — jump straight to a beta step.
    if (betaStartStep && betaStartStep !== "splash") {
      const idx = (k: Step["kind"]) => STEPS.findIndex((s) => s.kind === k);
      switch (betaStartStep) {
        case "wrapped": return idx("wrapped");
        case "goal": return PREFERENCES_STEP_INDEX;
        case "aa": return AA_CHIPS_STEP_INDEX;
        case "byron": return BYRON_INTRO_STEP_INDEX; // the Byron-intro beat (Meet Byron pill → takeover)
        case "explore": return PLAYGROUND_STEP_INDEX;
        case "footprint": return BUILD_PLAN_STEP_INDEX >= 0 ? BUILD_PLAN_STEP_INDEX : FOOTPRINT_RESUME_INDEX;
        case "plan": return idx("spending-plan");
        case "budget": return idx("budget-confirm");
        case "verdict": return idx("verdict");
        case "lock-in": return idx("lock-in");
        case "feed": return idx("lock-in"); // the beat itself; the tail states are seeded
      }
    }
    return isTerminalMilestone || isByronMilestone
      ? seededStepIndex
      : startMilestone === "cards-unflipped"
        ? POST_WRAPPED_STEP_INDEX - 1 // the { kind: "wrapped" } step itself
        : startMilestone === "aa-prompt"
          ? AA_CHIPS_STEP_INDEX // the AA connect/skip prompt, before any account is linked
          : 0;
  });
  const [aaChipPicked, setAaChipPicked] = useState<string | null>(() => (isTerminalMilestone || isByronMilestone || betaPastAa ? "connect" : null));
  const [aaDismissed, setAaDismissed] = useState(false);
  const [aaNudgeStreamed, setAaNudgeStreamed] = useState(false);
  // Pitch pre-Byron belief run. beliefAnswers is keyed by question index; each answer feeds a
  // reaction (Q1 → gap math, Q2 → the spend-day pattern, Q3 → the achievability spring).
  const [beliefAnswers, setBeliefAnswers] = useState<Record<number, string>>({});
  const [beliefStreamed, setBeliefStreamed] = useState<Record<number, boolean>>({});
  const [echoLineDone, setEchoLineDone] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyPhase, setStoryPhase] = useState<"idle" | "expanding" | "open" | "collapsing">("idle");
  const [reviewBeatIndex, setReviewBeatIndex] = useState<number | undefined>(undefined);
  const [aaFlowOpen, setAaFlowOpen] = useState(false);
  const [bigSpends, setBigSpends] = useState<{ title: string; transactions: { date: string; merchant: string; amount: number; category: string }[] } | null>(null);
  // Status-bar colour timing: the hoisted bar only flips to dark glyphs AFTER the overlay
  // has slid up to cover the Valentino top — flipping at slide-start looked glitchy (dark
  // icons over the purple floor). Lags the open by one slide duration; white until then.
  const [chromeSettled, setChromeSettled] = useState(false);
  useEffect(() => {
    const covered = overlayOpen || aaFlowOpen || !!bigSpends || storyOpen;
    if (!covered) { setChromeSettled(false); return; }
    const t = window.setTimeout(() => setChromeSettled(true), OVERLAY_DURATION);
    return () => window.clearTimeout(t);
  }, [overlayOpen, aaFlowOpen, bigSpends, storyOpen]);
  // Retain the last-opened content so the panel can slide OUT with its content
  // still mounted — a clean dismiss. Without this the child unmounts the instant
  // bigSpends → null, so the panel would slide down empty (an abrupt cut).
  const lastBigSpendsRef = useRef<typeof bigSpends>(null);
  if (bigSpends) lastBigSpendsRef.current = bigSpends;
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hasContentBelow, setHasContentBelow] = useState(false);

  // Preference questionnaire
  const [prefQuizOpen, setPrefQuizOpen] = useState(false);
  const [prefQuizIndex, setPrefQuizIndex] = useState(0);
  // Conversational mode: which goal questions have finished streaming in the chat (their numbered
  // options appear only once the asking line settles).
  const [prefQStreamed, setPrefQStreamed] = useState<Record<string, boolean>>({});
  // Whatever the user TYPES echoes verbatim ("2" stays "2" — never the resolved label); tapping an
  // option line echoes its label. Ryan's reply carries the interpretation.
  const [prefEchoes, setPrefEchoes] = useState<Record<string, string>>({});
  const [beliefEchoes, setBeliefEchoes] = useState<Record<number, string>>({});
  const [ladderEcho, setLadderEcho] = useState<string | null>(null);
  // Conversational explore: offers the user said "no" to (the one-at-a-time sequence skips them).
  const [exploreOffersPassed, setExploreOffersPassed] = useState<Set<string>>(() => new Set());
  // Conversational confirms echo the user's OWN words ("yes", "looks good") instead of a button label.
  const [planConfirmLabel, setPlanConfirmLabel] = useState("Looks right");
  const [budgetConfirmLabel, setBudgetConfirmLabel] = useState("Looks good");
  const [fundConfirmLabel, setFundConfirmLabel] = useState("Start goal");
  const [prefAnswers, setPrefAnswers] = useState<Record<string, string>>({});
  const [prefDismissed, setPrefDismissed] = useState(false);
  const [prefNudgeStreamed, setPrefNudgeStreamed] = useState(false);

  // Cruncher
  const [cruncherVisible, setCruncherVisible] = useState(false);
  // Mirror cruncherVisible into a ref so snapScrollTo can read the current
  // chrome height without taking cruncherVisible as a dependency. Otherwise the
  // function identity changes each time the cruncher toggles, which re-fires
  // every snap effect (e.g. the footprint snap yanking scroll back up).
  // True when a cruncher floats at the top (now only the jun-11 connect cruncher — the goal-flow
  // plan cruncher renders inline in the chat), so snapScrollTo parks content clear of it; otherwise
  // the new connect salutation lands under the card and isn't legible.
  const topCruncherVisibleRef = useRef(false);
  topCruncherVisibleRef.current = aaConnected && !connectCruncherDismissed;
  const [cruncherStatus, setCruncherStatus] = useState("Gathering your preferences");
  const [cruncherDone, setCruncherDone] = useState(false);
  // Beta background-fetch cruncher: appears in chat at the "account linked" moment and sticks to the
  // top on scroll while the user explores. aaFetchStartedRef gates the cycle to fire exactly once.
  const [aaFetchStatus, setAaFetchStatus] = useState(AA_FETCH_TEXTS[0]);
  const [aaFetchDone, setAaFetchDone] = useState(() => !!config?.betaFetchDone);
  // Slow-climbing percentage for the pitch app-bar chip — reads as real work, tops out at 97 (double
  // digits only; completion shows a TICK, never "100").
  const [aaFetchPct, setAaFetchPct] = useState(7);
  useEffect(() => {
    if (aaFetchDone) return;
    // Paced to the 5s fetch (R16): 7 → ~97 just as the done tick lands.
    const iv = window.setInterval(() => setAaFetchPct((p) => Math.min(97, p + 9)), 450);
    return () => window.clearInterval(iv);
  }, [aaFetchDone]);
  // On completion the chip holds a tick for a beat before handing the slot back to the lock.
  const [cruncherTickHold, setCruncherTickHold] = useState(false);
  const aaFetchDoneWasRef = useRef(aaFetchDone);
  useEffect(() => {
    if (aaFetchDone && !aaFetchDoneWasRef.current) {
      setCruncherTickHold(true);
      const t = window.setTimeout(() => setCruncherTickHold(false), 2600);
      aaFetchDoneWasRef.current = true;
      return () => window.clearTimeout(t);
    }
    aaFetchDoneWasRef.current = aaFetchDone;
  }, [aaFetchDone]);
  // Once done, the cruncher holds its ✓ for a beat, animates out (fade + collapse), then unmounts.
  const [aaCruncherGone, setAaCruncherGone] = useState(false);
  const aaFetchStartedRef = useRef(false);
  // True while the beta/pitch background-fetch cruncher is pinned on top — so snapScrollTo parks chat
  // BELOW it (otherwise text scrolls behind the pinned card). Mirrored into a ref like topCruncher.
  const pitchCruncherVisibleRef = useRef(false);
  // The pinned band only exists on BETA now (pitch carries the fetch as an app-bar chip, which adds
  // no chrome height) — betaSkipAa must not inflate the snap clearance.
  pitchCruncherVisibleRef.current = betaIntentFirst && !config?.betaSkipAa && CRUNCHER_ANCHOR_INDEX >= 0 && stepIndex >= CRUNCHER_ANCHOR_INDEX && stepIndex <= BUILD_PLAN_STEP_INDEX && !aaCruncherGone;
  const [goalLabel, setGoalLabel] = useState("Your goal");

  // Voice / persona
  const [voice, setVoice] = useState<Voice>("ryan");
  // Input-placeholder name: the Cosimo pitch chat has ONE assistant, Cosimo ("Ask Cosimo",
  // canon 796:6293 — the frame's "Ask Ryan" is stale); other flows keep the Ryan/Byron pair.
  const assistantName = cosimoChat ? "Cosimo" : voice === "byron" ? "Byron" : "Ryan";
  const [appBarMode, setAppBarMode] = useState<"simple" | "toggle">("simple");
  const [contentVisible, setContentVisible] = useState(true);

  // Playground (post-AA spend-analytics taster)
  type PlaygroundEvent =
    | { kind: "user-tap"; chipId: string; label: string }
    | { kind: "reveal"; chipId: string }
    | { kind: "byron-roast"; text: string; isFirst: boolean }
    | { kind: "byron-cap-nudge" }
    | { kind: "ryan-handoff" }
    | { kind: "goal-nudge" }
    // A persona switch made ON the playground step folds INTO this event stream (not the
    // step-level switchIntros), so the intro lands inline as the newest explore message and
    // subsequent taps/reveals stack below it — instead of being stranded under the chip row.
    | { kind: "switch-intro"; voice: Voice; text: string };
  const [playgroundEvents, setPlaygroundEvents] = useState<PlaygroundEvent[]>([]);
  // Holds the quip stream on a freshly-revealed card so the user has a beat
  // to absorb the viz before Ryan/Byron starts typing. Flipped to true by a
  // delayed effect whenever a new "reveal" event is appended.
  const [revealQuipReady, setRevealQuipReady] = useState(false);
  const [chipsConsumed, setChipsConsumed] = useState<Set<string>>(new Set());
  const [playgroundRoastFiredOnce, setPlaygroundRoastFiredOnce] = useState(false);
  const [playgroundRoastIndex, setPlaygroundRoastIndex] = useState(0);
  const [playgroundNudgeShown, setPlaygroundNudgeShown] = useState(false);
  const [playgroundGoalNudgeDone, setPlaygroundGoalNudgeDone] = useState(false);
  const [playgroundBusy, setPlaygroundBusy] = useState(false);
  // "Build my goal plan" tapped: the chips collapse into a sent user bubble and the flow moves on.
  const [buildPlanPicked, setBuildPlanPicked] = useState(false);

  // Footprint walk: which bucket cards have been confirmed by the user.
  const [footprintConfirmed, setFootprintConfirmed] = useState<Set<number>>(new Set());
  // Beta: the footprint buckets confirm in a bottom sheet (opened from a chat chip) rather than an
  // inline card. `footprintSheetBucket` is the bucket whose sheet is open (null = closed);
  // `footprintResults` captures each confirmed selection so the answer card echoed back into the
  // chat reflects any include/exclude or amount edits made inside the sheet.
  const [footprintSheetBucket, setFootprintSheetBucket] = useState<number | null>(null);
  const [footprintResults, setFootprintResults] = useState<Record<number, { id: string; amount: number; type: string }[]>>({});
  // Footprint conversational edit: the REAL docked chat input sits below the card and routes a typed
  // change into the card via a { seq, text } bump (the card owns the actual amount edit).
  const [footprintChatDraft, setFootprintChatDraft] = useState("");
  const [footprintChatEdit, setFootprintChatEdit] = useState<{ seq: number; text: string } | null>(null);
  // "Building your plan" (beta): a live progress stepper Ryan walks through, auto-confirming the
  // confident buckets and pausing only for the ambiguous ones (answered inline). buildPlanStage is how
  // far the stepper has revealed; buildPlanAnswers records the yes/no calls on the ambiguities.
  const [buildPlanStage, setBuildPlanStage] = useState(0);
  const [buildPlanAnswers, setBuildPlanAnswers] = useState<Record<string, "yes" | "no">>({});
  // Cosimo: once the inputs are confirmed the flow pauses on a "Build my plan" consent —
  // the follow-up ask under the stepper. planConsentStreamed gates its option row (options
  // never land before their question finishes typing).
  const [planConsent, setPlanConsent] = useState(false);
  const [planConsentStreamed, setPlanConsentStreamed] = useState(false);
  // The user's answer to the one-time-contribution ask, echoed back as their sent bubble
  // (typed or picked from the followup rows). lumpPromptStreamed gates those rows.
  const [lumpEcho, setLumpEcho] = useState<string | null>(null);
  const [lumpPromptStreamed, setLumpPromptStreamed] = useState(false);
  const buildPlanTimerRef = useRef<number | null>(null);
  // Beta: auto-open the confirm sheet the moment a bucket step becomes active (no "Review" chip). The
  // sheet has no dismiss X in this flow, so it only closes on confirm (onSubmit) — no re-open loop.
  useEffect(() => {
    if (!betaIntentFirst) return;
    const active = STEPS[stepIndex];
    if (active?.kind === "footprint-bucket" && !footprintConfirmed.has(active.bucketIndex) && footprintSheetBucket == null) {
      setFootprintSheetBucket(active.bucketIndex);
    }
  }, [stepIndex, betaIntentFirst, footprintConfirmed, footprintSheetBucket, STEPS]);

  // Ladder pick (savings pace tier). Selection happens through the same
  // QuestionnaireOverlay variant the goal quiz uses — the picker mounts when
  // the flow reaches the ladder-pick step.
  const [ladderTier, setLadderTier] = useState<LadderTier | null>(null);
  const [ladderQuizOpen, setLadderQuizOpen] = useState(false);

  // Lock-in outcome. "lock" → Ryan/Byron sends a confirmation line and the
  // overlay sits there until the user closes it (which then fires onComplete).
  // "tweak" → Ryan asks what they'd change and the input bar mounts so the
  // user can type a reply. Either path eventually flips planLocked, which is
  // what closeOverlay uses to fire onComplete after the slide-down animation.
  const [lockInChoice, setLockInChoice] = useState<"lock" | "tweak" | null>(null);
  const [tweakDraft, setTweakDraft] = useState("");
  // Budget-confirm gate (before the verdict): a docked bottom-sheet showing the category budgets.
  // "Looks good" confirms; edits happen conversationally ("food 6k") — no manual editor. Chat-edited
  // caps override the plan's caps everywhere downstream (spending-plan recap + goal payload).
  const [budgetSheetOpen, setBudgetSheetOpen] = useState(false); // the budget confirm sheet is docked open
  const [budgetConfirmed, setBudgetConfirmed] = useState(false); // "Looks good" tapped → echo budgets into chat
  const [budgetEditDraft, setBudgetEditDraft] = useState(""); // the "suggest an edit" input text
  const [budgetCaps, setBudgetCaps] = useState<Record<string, number> | null>(null); // per-category cap overrides
  const [planCtaReady, setPlanCtaReady] = useState(false); // cash-flow card settled → show the "Looks right" advance button (no auto-advance)
  const [planConfirmed, setPlanConfirmed] = useState(false); // "Looks right" tapped → echo the user bubble + advance
  const [tweakSubmitted, setTweakSubmitted] = useState(false);
  // Beta "Just auto-save": skip the explore/plan deep-dive and jump straight to the lock-in fund
  // step (a simple monthly auto-save). The intermediate steps are filtered from the chat history.
  const [betaAutoSave, setBetaAutoSave] = useState(false);
  // Lock-in funding sequence: an OPTIONAL head-start deposit first (null = not chosen, 0 = skipped,
  // >0 = deposited), THEN the monthly autopay — which is what actually commits the goal.
  // Pitch: headStart is CAPTURED early (the lump-sum step, before pace) but only EXECUTED at the end
  // (lock-in) — the atom-creation runs there, alongside the autopay, since it's the actual money move.
  const [headStart, setHeadStart] = useState<number | null>(null);
  const HEAD_START_AMOUNT = 10000;
  // Pitch lump-sum framing: the balance Ryan spotted sitting idle across the linked accounts.
  const IDLE_CASH_AMOUNT = 48000;
  // Pitch: the deferred head-start atom has actually run at lock-in (receipt shown, autopay next).
  const [lumpSettled, setLumpSettled] = useState(false);
  // Mock atom-creation takeover (pitch): the head-start deposit runs a two-page flow at lock-in —
  // "creating your atom" processing, then a done page — banking the money when it closes, so the
  // chat continues (receipt + autopay) on return.
  const [atomFlow, setAtomFlow] = useState<null | { amount: number; stage: "processing" | "done" }>(null);
  useEffect(() => {
    if (atomFlow?.stage !== "processing") return;
    const t = window.setTimeout(() => setAtomFlow((f) => (f ? { ...f, stage: "done" } : f)), 1900);
    return () => window.clearTimeout(t);
  }, [atomFlow?.stage]);
  // Deferred head start: when lock-in is reached and a lump sum was chosen earlier (headStart > 0)
  // but not yet executed, auto-launch the atom-creation here — the actual money move happens at
  // commit time, before the autopay. Declined (0) skips straight to the autopay.
  useEffect(() => {
    // Cosimo canon (484:3090): the atom is NEVER auto-created — the user taps "Create atom" on the
    // contribution card, configures it on the atom page, and only then the takeover runs.
    if (cosimoChat) return;
    if (LUMP_SUM_STEP_INDEX < 0 || LOCK_IN_STEP_INDEX < 0) return;
    if (stepIndex !== LOCK_IN_STEP_INDEX) return;
    if (headStart != null && headStart > 0 && !lumpSettled && !atomFlow) {
      const t = window.setTimeout(() => setAtomFlow({ amount: headStart, stage: "processing" }), 500);
      return () => window.clearTimeout(t);
    }
  }, [stepIndex, headStart, lumpSettled, atomFlow, LUMP_SUM_STEP_INDEX, LOCK_IN_STEP_INDEX, cosimoChat]);
  // True once the user taps "Decide later" on the goal — swaps the AA-ask copy to a no-goal framing
  // so it doesn't promise a "sharper goal" that doesn't exist.
  const [goalDeclined, setGoalDeclined] = useState(false);
  // After the Byron-intro line finishes, show a "Meet Byron" pill; the takeover (flip to his voice +
  // roast) fires when the user taps it, so it's self-paced instead of an auto-switch that's too quick to read.
  const [byronIntroReady, setByronIntroReady] = useState(false);
  // Tapping "Meet Byron" posts the user's own "Meet Byron" bubble before Byron's roast lands.
  const [byronMet, setByronMet] = useState(false);
  // Meet-Byron takeover choreography: Byron reveals big in the CENTRE, then flies up into the app bar.
  //  "center" = held centre reveal · "flyup" = shrinking toward the top · "done" = overlay cleared.
  const [byronReveal, setByronReveal] = useState<"idle" | "center" | "flyup" | "done">("idle");
  // One-frame-later flag so the centre reveal fades + scales IN (rather than mounting at full size).
  const [byronRevealIn, setByronRevealIn] = useState(false);
  // Persona-switch banter: each toggle appends the new character's intro line (escalating with count).
  const [switchCount, setSwitchCount] = useState(0);
  const [switchIntros, setSwitchIntros] = useState<{ voice: Voice; text: string; atStep: number }[]>([]);
  // After the user confirms, they fund the pot + set the monthly on autopay
  // (reusing the add-to-pot widget). Only once funded do we hand control back to
  // the parent page so the home view can surface the real pot/goal.
  const [potFunded, setPotFunded] = useState(seedFeedBeat);
  const planLocked = potFunded;
  // Goal tracker reveal: once the "your goal is live" line lands, a ring chip pops into the
  // app-bar top-right (trackerLive), then its ring charges 0 → funded% (trackerPct ramps).
  const [trackerLive, setTrackerLive] = useState(seedFeedBeat);
  // Safe-to-spend is introduced as its OWN beat AFTER the goal is confirmed (not bundled with it):
  // the funded line lands first, then this flips true to show a dedicated "here's your safe to spend"
  // line, and only then does the tracker reveal. (Onboarding research: one concept per beat.)
  const [s2sIntroReady, setS2sIntroReady] = useState(seedFeedBeat);
  // After the goal is confirmed, the safe-to-spend reveal waits for a USER TAP (a chip) rather than
  // auto-firing — so it reads as the natural next step of the same goal-setting moment, user-driven.
  const [s2sPromptReady, setS2sPromptReady] = useState(seedFeedBeat);
  // Between "goal's committed" and the safe-to-spend reveal, Ryan nudges into it — so safe-to-spend
  // gets its own invited beat instead of tumbling out directly with the goal.
  const [s2sNudgeReady, setS2sNudgeReady] = useState(seedFeedBeat);
  // Unlock-key flight (the END-of-flow delight). Order matters: the s2s line TALKS about the locked
  // tracker + the key first, THEN the key card appears below it; tapping flies the key to the locked
  // chip's centre, the lock opens into the live tracker, and a short confirm line lands last.
  const [keyFly, setKeyFly] = useState(false);
  const [keyFlyGo, setKeyFlyGo] = useState(false);
  const [s2sUnlocked, setS2sUnlocked] = useState(false); // lock opened → the post-unlock confirm line
  const [trackerPct, setTrackerPct] = useState(0);
  // Brief coachmark pointing at the freshly-revealed tracker, so the user notices it landed
  // top-right (it auto-dismisses, or clears when they tap the tracker / it's been a few seconds).
  const [trackerCoachmark, setTrackerCoachmark] = useState(false);
  // Tapping the LOCKED tracker chip pops a playful "stay curious" tooltip (we don't spell out what it
  // is — it's a reward for connecting). Auto-dismisses.
  const [lockedTip, setLockedTip] = useState(false);
  useEffect(() => {
    if (!lockedTip) return;
    const t = window.setTimeout(() => setLockedTip(false), 4200);
    return () => window.clearTimeout(t);
  }, [lockedTip]);
  // Set just before closeOverlay when the user wants to land on the goal screen (tracker tap /
  // funded-card arrow) rather than the home chat — read in closeOverlay's onComplete call.
  const openGoalOnCloseRef = useRef(false);
  // The tracker ring element — measured on tap so the parent can morph it into the L1 hero ring.
  const trackerRingRef = useRef<HTMLDivElement>(null);
  // Voice each message was first rendered in. Toggling Ryan/Byron only changes NEW messages — past
  // messages keep their captured voice and never rewrite. Reset on a full flow restart.
  const msgVoiceRef = useRef<Record<number, "ryan" | "byron">>({});
  // The committed/funded confirmation is terminal — once spoken it freezes to that voice so toggling
  // Ryan/Byron afterwards never rewrites a done-deal message (the active pre-funding line stays live).
  const fundedVoiceRef = useRef<"ryan" | "byron" | null>(null);
  // Captures the amount the user actually funds (defaults to the recommended
  // monthly) and the resolved goal payload, so closeOverlay can hand the real
  // goal/pot back to the parent page without depending on render-scope values.
  const fundedAmountRef = useRef<number | null>(null);
  const goalPayloadRef = useRef<GoalCompletionPayload | undefined>(undefined);
  // Once the walkthrough begins, the chat input bar is always available as a
  // visual affordance. It's intentionally inert in this scripted sim: typing
  // clears on send rather than driving a (faked) reply.
  const [walkthroughDraft, setWalkthroughDraft] = useState("");
  // Inert reply draft for the "how much to save" tier sheet — gives it the same docked chat input the
  // footprint sheets have (the tier is picked via the chips above; typing here is a conversational reply).
  const [ladderReplyDraft, setLadderReplyDraft] = useState("");
  // Docked reply bar shared by the goal + build-plan sheets, so every bottom sheet keeps the message
  // box below its options (matching the savings-tier sheet). On the goal sheet a typed answer routes
  // to the current free-text question; on build-plan (yes/no) it's an inert conversational bar.
  const [sheetReplyDraft, setSheetReplyDraft] = useState("");
  // Suggestions sheet for the terminal "Ask Ryan" bar (canon 1057:12831): the widgets button
  // expands the footer into the shared SuggestSheetBar (Chat.tsx). The sheet + keyboard lift
  // choreography lives in useChatLift — one clock for bar, sheet, keyboard and conversation.
  const [suggestMenuOpen, setSuggestMenuOpen] = useState(false);
  // Natural height of the suggestions list content (reported by SuggestSheetBar; measurable
  // even collapsed — the 0fr grid cell clips it visually but doesn't constrain the child).
  const [suggestListH, setSuggestListH] = useState(0);

  // Ready signal. Seeding ready=true on a fast-forward makes the pill-commit
  // effect a no-op and routes the FloatingAppBar to its "close" affordance, since
  // the chat is already open past the meet-Ryan beat.
  const [ryanReady, setRyanReady] = useState(() => startMilestone != null);
  const [pillLabel, setPillLabel] = useState(() => (startMilestone != null ? (cosimoChat ? "Cosimo is ready" : "Ryan is ready") : cosimoChat ? "Meet Cosimo" : "Meet Ryan"));

  // Scroll refs and state
  const scrollRef = useRef<HTMLDivElement>(null);
  // Keyboard + sheet lift (shared with BaseLayoutSim): kbLift moves the bottom chrome for the
  // desktop mock keyboard; chatLift rides the chat area up with the message box for BOTH the
  // open suggestions sheet and the keyboard; scroll compensation is handled inside the hook
  // (visual viewport on phones, chatLift deltas everywhere).
  const {
    kbFocused: chatKbFocused,
    setKbFocused: setChatKbFocused,
    keyboardVisible,
    noteWillLift,
    kbLift,
    chatLift,
    ease: suggestSheetEase,
  } = useChatLift({ isMobile, scrollRef, sheetLift: suggestMenuOpen ? suggestListH : 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const wrappedCardRef = useRef<HTMLDivElement>(null);
  const postWrappedRef = useRef<HTMLDivElement>(null);
  const userBubbleRef = useRef<HTMLDivElement>(null);
  const ryanHandoffRef = useRef<HTMLDivElement>(null);
  const walkthroughBotRef = useRef<HTMLDivElement>(null);
  // the LIVE goal question's block (R15) — the top-snap target as each one arrives
  const prefQuestionRef = useRef<HTMLDivElement>(null);
  const skipResponseRef = useRef<HTMLDivElement>(null);
  const connectTopRef = useRef<HTMLDivElement>(null);
  // Seed streamed=true when fast-forwarding so the mosaic (or a seeded reveal)
  // renders immediately instead of waiting for the salutation typewriter onDone.
  const [skipResponseStreamed, setSkipResponseStreamed] = useState(() => isTerminalMilestone);
  // Spend tiles the user has tapped, in order. Each renders an inline reveal
  // (reply bubble + viz + quip). Tapping a tile dismisses the mosaic. The "asked"
  // milestone seeds one engaged suggestion so the chat lands on an answered question.
  const [skipReveals, setSkipReveals] = useState<string[]>(() =>
    startMilestone === "asked" ? ["top-categories"] : [],
  );
  // True once the latest reveal's quip has finished streaming - gates the next
  // tap so reveals don't overlap (streaming-before-actions).
  const [skipRevealDone, setSkipRevealDone] = useState(true);
  // The suggestions button fades in ~3.5s AFTER the first spend reveal lands, so it
  // doesn't compete with the response appearing.
  const [suggestBtnReady, setSuggestBtnReady] = useState(false);
  useEffect(() => {
    if (skipReveals.length === 0) { setSuggestBtnReady(false); return; }
    const t = window.setTimeout(() => setSuggestBtnReady(true), 3500);
    return () => window.clearTimeout(t);
  }, [skipReveals.length]);
  const isSnappingRef = useRef(false);
  const snapTimeoutRef = useRef<number | null>(null);
  const overlayAnimatingRef = useRef(false);
  const [userActionCount, setUserActionCount] = useState(0);

  // Beta: free text the user types into the chat bar shows up as their own bubble (instead of
  // vanishing). Accumulates at the tail of the scripted chat. Beta-only — other personas keep
  // the inert reply bar.
  // Free-typed asides, tagged with the step they were typed AT — conversational renders each one
  // right after its step's content (typing "hmm" then answering "yes" must keep that order in the
  // transcript) with a CONTEXTUAL Ryan reply captured at submit time; beta keeps the tail rendering.
  const [freeTextBubbles, setFreeTextBubbles] = useState<{ text: string; step: number; reply?: string }[]>([]);
  // handleWalkthroughSubmit lives further down (after the pref/playground/ladder handlers it routes
  // typed conversational answers into).

  // Snap-scroll a target element to just below the fixed chrome (app bar + cruncher), eased 400ms
  const snapScrollTo = useCallback((el: HTMLElement, delay = 300) => {
    // Cancel any pending snap-scroll — and any reply-anchor glide (snaps own the beat)
    anchorBubbleRef.current = null;
    if (snapTimeoutRef.current) window.clearTimeout(snapTimeoutRef.current);
    isSnappingRef.current = true;
    snapTimeoutRef.current = window.setTimeout(() => {
      const scroller = scrollRef.current;
      const content = contentRef.current;
      if (!scroller || !content) { isSnappingRef.current = false; return; }

      const scrollerRect = scroller.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const elTopInScroller = elRect.top - scrollerRect.top + scroller.scrollTop;
      // Position element just below the fixed chrome zone (app bar + cruncher if visible). The pitch/beta
      // background-fetch cruncher is taller (app bar + its card + band), so park chat below THAT.
      const chromeHeight = pitchCruncherVisibleRef.current ? 208 : topCruncherVisibleRef.current ? 180 : 108;
      const target = Math.max(0, elTopInScroller - chromeHeight - 8);

      const minHeight = target + scroller.clientHeight;
      if (content.scrollHeight < minHeight) {
        content.style.minHeight = `${minHeight}px`;
      }

      const start = scroller.scrollTop;
      const distance = target - start;
      if (Math.abs(distance) < 1) { isSnappingRef.current = false; return; }
      const duration = 400;
      const startTime = performance.now();
      const ease = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        scroller.scrollTop = start + distance * ease(progress);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          window.setTimeout(() => { isSnappingRef.current = false; }, 200);
        }
      };
      requestAnimationFrame(step);
    }, delay);
  }, []);

  // THE reveal primitive for state-driven content (reveals with no stepIndex change: chips, cards,
  // switch intros, key moments). Waits two frames for the DOM to commit, then smooth-scrolls to the
  // bottom unless a snap is already in flight. Beats must call THIS, never hand-roll a scroll — the
  // hand-rolled copies are exactly how per-beat scroll dead zones kept appearing.
  const revealLatest = useCallback(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (isSnappingRef.current) return;
      const scroller = scrollRef.current;
      if (!scroller) return;
      // A reader parked above stays parked (R15) — reveals land below the fold
      // and the jump pill offers the way down; only TRUE bottom-riders (a 120px
      // strip) get followed.
      const distFromBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
      if (distFromBottom > 120) return;
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    }));
  }, []);

  // Branch the question set off the chosen goal type (see buildPrefQuestions).
  const prefQuestions: Question[] = useMemo(() => {
    const qs = buildPrefQuestions(prefAnswers["goal-type"]);
    if (!cosimoChat) return qs;
    // Cosimo canon (882:5873): the goal ask reads "What do you want to save towards?" with
    // friendlier labels, rendered as emoji icon-rows (same pattern as the explore suggestions).
    return qs.map((q) =>
      q.id === "goal-type"
        ? {
            ...q,
            text: "What do you want to save towards?",
            options: [
              { id: "trip", label: "Vacation" },
              { id: "purchase", label: "Big purchase" },
              { id: "emergency", label: "Emergency fund" },
              { id: "save-more", label: "Just want to build savings" },
            ],
          }
        : q,
    );
  }, [prefAnswers, cosimoChat]);

  // ── Cosimo goal-planning feasibility (schematic 426:1340) ─────────────────────────────────
  // Runs right after the goal questions on the GOAL flow (fixed amount + deadline); the FUND flow
  // (no fixed tenure) skips it — feasibility doesn't apply to an open-ended pot. When the plan is
  // Tight/Infeasible, Cosimo negotiates levers: the two money levers are CLUBBED in one ask
  // (idle-cash head start + SIP redirect — neither touches lifestyle spends), then time (extend
  // the deadline) and goal (trim the target) are asked SEQUENTIALLY, per the schematic's routing
  // note. Every accepted lever folds into the plan math downstream (pace, budget, lock-in).
  const COSIMO_SIP_TOTAL = 7500; // the index SIP already running (fixture)
  const COSIMO_SIP_REDIRECT = 3000; // the slice of it that can point at the goal instead
  const FEAS_EXTENSION_MONTHS = 3; // the deadline extension offered by the time lever
  type FeasLevers = { headStart: boolean; sip: boolean; extraMonths: number; trim: number | null };
  const [feasLevers, setFeasLevers] = useState<FeasLevers>({ headStart: false, sip: false, extraMonths: 0, trim: null });
  const [feasRounds, setFeasRounds] = useState<{ type: "money" | "time" | "trim"; prompt: string; options: string[]; picked: string | null }[]>([]);
  const [feasPhase, setFeasPhase] = useState<"math" | "verdict" | "negotiate" | "resolved">("math");
  // Per-round "prompt finished typing" flags — the option rows land only after the ask streams.
  const [feasPromptStreamed, setFeasPromptStreamed] = useState<Record<number, boolean>>({});
  const [feasResolution, setFeasResolution] = useState<string | null>(null);

  // Goal-aware plan derivation. Everything downstream of the footprint walk
  // (pace, plan numbers, verdict, lock-in copy, funding, handoff) keys off these
  // instead of the old hardcoded "Trip to Japan, ₹12k" script.
  const goalTypeId = prefAnswers["goal-type"];
  const timelineId = prefAnswers["timeline"];
  const goalAmountNum = AMOUNT_MAP[prefAnswers["amount"]];
  const goalMonths = timelineId ? TIMELINE_MONTHS[timelineId] : undefined;
  // Trip/purchase with a concrete amount AND deadline → one required monthly,
  // no pace tiers (a fixed tenure can't have tiers). Flexible/no-timeline and the
  // open-ended goals (emergency, save-more) keep the 3-tier picker.
  const hasFixedTenure =
    (goalTypeId === "trip" || goalTypeId === "purchase") && !!goalAmountNum && !!goalMonths;
  // Feasibility levers fold into the plan math: a trim reshapes the target, an extension stretches
  // the runway, the head start knocks off a lump, the SIP redirect covers part of every month —
  // so everything downstream (pace, plan, budget, lock-in) shows the NEGOTIATED number.
  const effGoalMonths = goalMonths ? goalMonths + feasLevers.extraMonths : goalMonths;
  const requiredMonthly = hasFixedTenure
    ? Math.max(
        0,
        Math.round(Math.max(0, (feasLevers.trim ?? goalAmountNum) - (feasLevers.headStart ? HEAD_START_AMOUNT : 0)) / effGoalMonths!) -
          (feasLevers.sip ? COSIMO_SIP_REDIRECT : 0),
      )
    : null;
  const tierMonthly = ladderTier
    ? LADDER_OPTIONS.find((o) => o.tier === ladderTier)?.monthlyAmount ?? null
    : null;
  const savingsAmount = requiredMonthly ?? tierMonthly ?? SPENDING_PLAN_FIXTURE.savingsTarget;
  const planAvailable = SPENDING_PLAN_FIXTURE.income - SPENDING_PLAN_FIXTURE.obligations;
  const leftToSpend = planAvailable - savingsAmount;
  // Four-way feasibility classification (schematic annotation 436:1615) on the share of the free
  // month a plan eats: ≤25% Comfortable, ≤45% Feasible, ≤75% Tight, beyond that it doesn't fit.
  const feasVerdictFor = (monthly: number): "comfortable" | "feasible" | "tight" | "infeasible" => {
    const r = monthly / planAvailable;
    return r <= 0.25 ? "comfortable" : r <= 0.45 ? "feasible" : r <= 0.75 ? "tight" : "infeasible";
  };
  // Pure lever math — used by the negotiation to preview/apply offers without touching state.
  const feasCalc = (l: FeasLevers) => {
    const amt = l.trim ?? goalAmountNum ?? 0;
    const months = (goalMonths ?? 6) + l.extraMonths;
    const monthly = Math.max(0, Math.round(Math.max(0, amt - (l.headStart ? HEAD_START_AMOUNT : 0)) / months) - (l.sip ? COSIMO_SIP_REDIRECT : 0));
    return { monthly, months, verdict: feasVerdictFor(monthly) };
  };
  // The biggest 10k-round target that still lands Feasible with the current levers — the trim offer.
  const feasTrimSuggestion = (l: FeasLevers) => {
    const months = (goalMonths ?? 6) + l.extraMonths;
    const maxMonthly = 0.45 * planAvailable + (l.sip ? COSIMO_SIP_REDIRECT : 0);
    const maxAmt = maxMonthly * months + (l.headStart ? HEAD_START_AMOUNT : 0);
    return Math.max(10000, Math.floor(maxAmt / 10000) * 10000);
  };
  // Next lever to offer, per the schematic's routing: money levers first (CLUBBED — idle cash +
  // SIP redirect in one ask), then time (extend), then goal (trim). null = nothing left to offer.
  const feasBuildRound = (l: FeasLevers): { type: "money" | "time" | "trim"; prompt: string; options: string[]; picked: null } | null => {
    if (!l.headStart && !l.sip) {
      return {
        type: "money",
        prompt: `Two ways to close the gap without touching your day-to-day: ${formatINR(HEAD_START_AMOUNT)} sitting idle across your accounts, and ${formatINR(COSIMO_SIP_REDIRECT)} of your ${formatINR(COSIMO_SIP_TOTAL)} index SIP that could point here instead.`,
        options: ["Do both", `Just the ${formatINR(HEAD_START_AMOUNT)} head start`, "Just redirect the SIP", "Neither"],
        picked: null,
      };
    }
    if (l.extraMonths === 0) {
      const preview = feasCalc({ ...l, extraMonths: FEAS_EXTENSION_MONTHS });
      const extendedTo = (goalMonths ?? 6) + FEAS_EXTENSION_MONTHS;
      return {
        type: "time",
        prompt: `Give it ${extendedTo} months instead and the ask drops to about ${formatINR(preview.monthly)} a month.`,
        options: [`Extend to ${extendedTo} months`, "Keep the deadline"],
        picked: null,
      };
    }
    if (l.trim == null) {
      const suggested = feasTrimSuggestion(l);
      return {
        type: "trim",
        prompt: `One more way: trim the target to ${formatINR(suggested)} and it fits. You can always top it up later.`,
        options: [`Trim to ${formatINR(suggested)}`, "Keep the full amount and run it tight"],
        picked: null,
      };
    }
    return null;
  };
  // Close the negotiation — either the levers made it fit, or the user chose to run it tight.
  const feasResolve = (l: FeasLevers, outcome: "fits" | "tight") => {
    const c = feasCalc(l);
    setFeasPhase("resolved");
    setFeasResolution(
      outcome === "fits"
        ? `That does it — about ${formatINR(c.monthly)} a month${l.extraMonths > 0 ? ` over ${c.months} months` : ""} gets you there. Building the plan around that.`
        : `Alright — we'll run it tight at ${formatINR(c.monthly)} a month. I'll keep an eye on it and flag the moment it slips.`,
    );
  };
  // A lever pick lands: apply it, re-run the math, and either resolve or surface the next lever.
  const handleFeasibilityPick = (optIdx: number) => {
    const current = feasRounds[feasRounds.length - 1];
    if (!current || current.picked) return;
    setFeasRounds((prev) => prev.map((r, i) => (i === prev.length - 1 ? { ...r, picked: r.options[optIdx] } : r)));
    setUserActionCount((c) => c + 1); // snap the sent bubble up like every other reply
    let next: FeasLevers = feasLevers;
    if (current.type === "money") {
      next = { ...feasLevers, headStart: optIdx === 0 || optIdx === 1, sip: optIdx === 0 || optIdx === 2 };
      // Banking the head start here makes the later lump-sum step auto-acknowledge instead of re-asking.
      if (next.headStart) setHeadStart(HEAD_START_AMOUNT);
    } else if (current.type === "time") {
      next = optIdx === 0 ? { ...feasLevers, extraMonths: FEAS_EXTENSION_MONTHS } : feasLevers;
    } else {
      if (optIdx === 0) next = { ...feasLevers, trim: feasTrimSuggestion(feasLevers) };
      else { feasResolve(feasLevers, "tight"); return; }
    }
    setFeasLevers(next);
    const c = feasCalc(next);
    if (c.verdict === "comfortable" || c.verdict === "feasible") { feasResolve(next, "fits"); return; }
    const round = feasBuildRound(next);
    if (round) setFeasRounds((prev) => [...prev, round]);
    else feasResolve(next, "tight");
  };
  // Some amount+timeline combos need more than the cashflow allows (e.g. ₹2L in
  // 3 months). Flag it so the verdict doesn't falsely claim "this works".
  const isPlanTight = savingsAmount >= planAvailable;
  // What to call the pot. Never render "Just save more pot" / "Emergency fund"
  // goalLabel quirks — map to clean labels.
  const potLabel =
    goalTypeId === "emergency" ? "Emergency fund"
    : goalTypeId === "save-more" ? "Savings"
    : goalLabel;
  // Bare goal noun for the {goal} token woven through the post-goal bot lines (AA / explore), so the
  // goal stays named across the flow instead of getting lost. Falls back to "goal" when none is set.
  const goalNoun =
    goalTypeId === "trip" ? "trip"
    : goalTypeId === "emergency" ? "emergency fund"
    : goalTypeId === "purchase" ? "purchase"
    : goalTypeId === "save-more" ? "savings"
    : "goal";
  // Swap the {goal} token in any copy (bot lines, chip labels) for the goal noun.
  const withGoal = (s: string) => s.replace(/\{goal\}/g, goalNoun);
  // Belief run (pitch): the destination-ish short name for the echo + Q3 reactions ("Goa", else the
  // clean pot label) and the target month name ("December") for the echo's "in December" line.
  const goalDest = (prefAnswers["destination"] ?? "").trim();
  const goalShort = goalDest !== "" ? goalDest : potLabel || "your goal";
  const goalMonthName = effGoalMonths
    ? new Date(new Date().setMonth(new Date().getMonth() + effGoalMonths)).toLocaleString("en-IN", { month: "long" })
    : null;
  // Gap-zero: Q1 said they already save >= the required monthly — never re-announce what the user
  // told us; the Q3 reaction swaps to "already covered, your accounts back that up".
  const statedSaving = beliefAnswers[0] != null ? BELIEF_SAVING_BAND[beliefAnswers[0]] : null;
  const beliefGapZero = statedSaving != null && requiredMonthly != null && statedSaving >= requiredMonthly;
  // Post-quiz user bubble: echo the actual selection (goal + amount), not a generic "Shared preferences".
  const prefSummary = [potLabel, goalAmountNum ? formatINR(goalAmountNum) : null].filter(Boolean).join(" · ");
  // MATH INVARIANT: Σ category caps = leftToSpend. The fixture's caps sum to it at the default
  // savings target; when a tier/goal changes savingsAmount, "Everything else" absorbs the delta so
  // the budget total, hero, and tracker all keep agreeing. Cap edits then apply on top.
  const tierDelta = savingsAmount - SPENDING_PLAN_FIXTURE.savingsTarget;
  const spendingPlan = {
    ...SPENDING_PLAN_FIXTURE,
    savingsTarget: savingsAmount,
    dailyPool: leftToSpend,
    categoryBudgets: SPENDING_PLAN_FIXTURE.categoryBudgets.map((b) => {
      const cap = b.name === "Everything else" ? Math.max(0, b.cap - tierDelta) : b.cap;
      return budgetCaps?.[b.name] != null ? { ...b, cap: budgetCaps[b.name] } : cap !== b.cap ? { ...b, cap } : b;
    }),
  };

  // Simulated conversational budget edit: "food 6k" matches a category by its first word and sets its
  // cap. Fakes the parse (keyword + K/L suffix) so the sheet feels like you can just tell Ryan a change.
  const applyBudgetEdit = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const t = text.toLowerCase();
    const m = t.match(/([\d,]+(?:\.\d+)?)\s*(k|l|lakh|lac|cr)?/);
    let amt = m ? parseFloat(m[1].replace(/,/g, "")) : NaN;
    if (m?.[2] === "k") amt *= 1_000;
    else if (m && (m[2] === "l" || m[2] === "lakh" || m[2] === "lac")) amt *= 100_000;
    else if (m?.[2] === "cr") amt *= 10_000_000;
    // Match a named category; otherwise fall back to the first so ANY request lands a change.
    const target = spendingPlan.categoryBudgets.find((b) => t.includes(b.name.toLowerCase().split(" ")[0])) ?? spendingPlan.categoryBudgets[0];
    // The updated cap on the budget viz is the confirmation — no ack line.
    if (target && !Number.isNaN(amt) && amt > 0) {
      const rounded = Math.round(amt);
      setBudgetCaps((prev) => ({ ...(prev ?? {}), [target.name]: rounded }));
    }
    setBudgetEditDraft("");
  };
  // Resolve the goal payload each render so closeOverlay can hand the real
  // goal/pot back to the parent. save-more has no target/deadline (routes to a
  // plain pot); the others carry an amount/timeline (routes to a pinned goal).
  goalPayloadRef.current = {
    type: goalTypeId ?? "save-more",
    name: potLabel,
    amountNum: goalAmountNum,
    timelineMonths: goalMonths,
    monthly: savingsAmount,
    initialFunded: fundedAmountRef.current ?? savingsAmount,
    paceId: ladderTier ?? (hasFixedTenure ? "fixed" : undefined),
  };

  // Top-right goal-tracker chip data (revealed once the goal goes live). Honest day-zero
  // progress: the just-funded amount over the real target (a concrete goal amount, or a
  // year of the monthly for open-ended pots). No floor — a brand-new goal genuinely reads
  // near-empty; the win is the tracker *appearing*, not the number.
  const trackerTarget = goalAmountNum ?? savingsAmount * 12;
  const trackerFunded = fundedAmountRef.current ?? savingsAmount;
  // Tracker ring fills to the safe-to-spend fraction so it matches the L1 hero ring (not goal funding).
  // Reads the LIVE plan (tier + cap edits), same source as the budget card + hero.
  const s2sSnap = getSafeToSpendSnapshot(spendingPlan.categoryBudgets);
  const trackerTargetPct = s2sSnap.monthly > 0 ? Math.round((s2sSnap.safe / s2sSnap.monthly) * 100) : 0;
  const betaGoalData: GoalIndicatorData = {
    id: "beta-goal",
    name: potLabel,
    pct: trackerPct,
    status: "on-track",
    icon: "savings",
    ringColor: MAIN_PRIMARY,
    daysLabel: "",
    saved: trackerFunded,
    target: trackerTarget,
    heroScene: "japan", // mountain hero on the goal card (not the emoji/text fallback)
  };

  // Once the chip has popped in, charge the ring 0 → funded% (the fill itself is CSS-tweened
  // inside ProgressRing). The short beat lets the pop land before the ring starts filling.
  // Also surface the coachmark so the user notices the chip appeared, then auto-dismiss it.
  useEffect(() => {
    if (!trackerLive) return;
    const ramp = window.setTimeout(() => setTrackerPct(trackerTargetPct), 200);
    const showCoach = window.setTimeout(() => setTrackerCoachmark(true), 360);
    const hideCoach = window.setTimeout(() => setTrackerCoachmark(false), 5200);
    return () => { window.clearTimeout(ramp); window.clearTimeout(showCoach); window.clearTimeout(hideCoach); };
  }, [trackerLive, trackerTargetPct]);

  const advanceStep = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, LAST_STEP_INDEX));
  }, [LAST_STEP_INDEX]);

  // "Building your plan" driver: while the build-plan step is live, tick through the stages on a timer,
  // pausing on any stage whose ambiguity question is unanswered; once all stages are done, advance the flow.
  const answerBuildPlan = useCallback((qid: string, val: "yes" | "no") => {
    setBuildPlanAnswers((prev) => ({ ...prev, [qid]: val }));
    // No setUserActionCount snap here — the sheet-close effect (buildPlanPendingQ → null) already
    // snap-scrolls; double-snapping within the same beat read as a scroll glitch during the build.
  }, []);
  useEffect(() => {
    if (STEPS[stepIndex]?.kind !== "build-plan") return;
    if (buildPlanTimerRef.current !== null) { window.clearTimeout(buildPlanTimerRef.current); buildPlanTimerRef.current = null; }
    if (buildPlanStage >= BUILD_PLAN_STAGES.length) {
      // Data gap (canon 414:1027): bills exceed income — the build BLOCKS on the escape card
      // (docked over the input) until "Connect more accounts" resolves it or the user exits.
      if (planDataGap && !planGapResolved) return;
      // All stages confirmed — hand off to the pace/plan tail.
      buildPlanTimerRef.current = window.setTimeout(() => advanceStep(), 800);
    } else {
      const stage = BUILD_PLAN_STAGES[buildPlanStage];
      // A stage with an unanswered question pauses here (answered inline via chips); otherwise auto-advance.
      if (!(stage.q && !buildPlanAnswers[stage.q.id])) {
        buildPlanTimerRef.current = window.setTimeout(() => setBuildPlanStage((s) => s + 1), 1000);
      }
    }
    return () => { if (buildPlanTimerRef.current !== null) { window.clearTimeout(buildPlanTimerRef.current); buildPlanTimerRef.current = null; } };
  }, [stepIndex, buildPlanStage, buildPlanAnswers, STEPS, advanceStep, planDataGap, planGapResolved, cosimoChat, planConsent]);

  // The one ambiguity Ryan stops on, if any — asked in the docked bottom sheet (like the goal), not inline.
  const buildPlanActiveStage = STEPS[stepIndex]?.kind === "build-plan" && buildPlanStage < BUILD_PLAN_STAGES.length ? BUILD_PLAN_STAGES[buildPlanStage] : null;
  // Tracks the sheet across renders so the auto-scroll effect can tell "just closed" from "closed".
  const prevBuildPlanQRef = useRef<unknown>(null);
  // Tracks the step across auto-scroll runs — the tall-block top-snap only fires on a REAL step
  // change, never on reveal-flag flips within a step (R14).
  const autoScrollStepWasRef = useRef(-1);
  const buildPlanPendingQ = buildPlanActiveStage?.q && !buildPlanAnswers[buildPlanActiveStage.q.id] ? buildPlanActiveStage.q : null;

  // Beta/pitch explore gut-checks render INLINE in the chat (no docked sheet — it ate chat-reading
  // space). See the showChips / showPostNudgeChips inline blocks in the playground render.

  // Beta: once the account is linked, run the background fetch. The transaction fetch
  // ALWAYS lands after 5 seconds (R16) — the status lines cycle quickly beneath it.
  // Fires exactly once (aaFetchStartedRef).
  useEffect(() => {
    if (!betaIntentFirst || CRUNCHER_ANCHOR_INDEX < 0 || stepIndex < CRUNCHER_ANCHOR_INDEX) return;
    if (aaFetchStartedRef.current || config?.betaFetchDone) return; // seeded-done (debug) skips the fetch cycle
    aaFetchStartedRef.current = true;
    let idx = 0;
    const iv = window.setInterval(() => {
      idx = (idx + 1) % AA_FETCH_TEXTS.length;
      setAaFetchStatus(AA_FETCH_TEXTS[idx]);
    }, 1600);
    const doneTimer = window.setTimeout(() => { window.clearInterval(iv); setAaFetchDone(true); }, 5000);
    return () => { window.clearInterval(iv); window.clearTimeout(doneTimer); };
  }, [betaIntentFirst, stepIndex, CRUNCHER_ANCHOR_INDEX]);

  // Debug "Money cruncher" toggle: react to the flag flipping LIVE — the sim is no longer remounted
  // for this (a remount wiped chat progress), so completion has to land in place.
  useEffect(() => {
    if (config?.betaFetchDone) setAaFetchDone(true);
  }, [config?.betaFetchDone]);

  // Clean finish (BETA only): hold the ✓ for a beat, then let the cruncher animate out and unmount.
  // Pitch keeps the card up (it shows the "Build my goal plan" CTA) until the plan build starts.
  useEffect(() => {
    if (!aaFetchDone || aaCruncherGone || config?.betaSkipAa) return;
    const t = window.setTimeout(() => setAaCruncherGone(true), 1700);
    return () => window.clearTimeout(t);
  }, [aaFetchDone, aaCruncherGone, config?.betaSkipAa]);

  const openOverlay = useCallback(() => {
    // First time → show PDP; returning → straight to chat
    setOverlayScreen(pdpSeen ? "chat" : "pdp");
    setOverlayMounted(true);
    overlayAnimatingRef.current = true;
    window.setTimeout(() => { overlayAnimatingRef.current = false; }, OVERLAY_DURATION + 50);
    requestAnimationFrame(() => requestAnimationFrame(() => setOverlayOpen(true)));
  }, [pdpSeen]);

  const closeOverlay = useCallback(() => {
    // Tracker / funded-card tap → go straight to the goal screen. Hand control back IMMEDIATELY
    // (no slide-down) so the parent opens the goals overlay over the still-covering onboarding,
    // instead of sliding onboarding away first — which revealed the home chat for a beat (the
    // "home then safe-to-spend" flash the first time a goal is set).
    if (planLocked && openGoalOnCloseRef.current) {
      onComplete?.({ goal: goalPayloadRef.current, openGoal: true });
      return;
    }
    setOverlayOpen(false);
    window.setTimeout(() => {
      setOverlayMounted(false);
      setOverlayScreen(pdpSeen ? "chat" : "pdp");
      // If the user has locked in their plan, hand control back to the parent
      // page now that the slide-down has settled — that's the moment the home
      // view with the pinned goal should take over.
      if (planLocked) {
        // Beta: DON'T complete onboarding. Keep OnboardingSim mounted — minimized to the pay screen + the
        // "ready" pill — so reopening (pill tap → openOverlay) restores THIS chat at the same step. The whole
        // beta flow lives inside OnboardingSim and never hands off to the returning-user home; completing here
        // would unmount us and reopen the returning-user chat = a "completely different" state (#249 follow-on).
        if (betaIntentFirst) return;
        onComplete?.({ goal: goalPayloadRef.current, openGoal: openGoalOnCloseRef.current });
        return;
      }
      // Otherwise: full-reset only if AA hasn't completed yet, so a user who
      // bounced out before connecting accounts restarts cleanly.
      if (!aaChipPicked) {
        setStepIndex(0);
        msgVoiceRef.current = {}; // restart → re-capture message voices from scratch
        fundedVoiceRef.current = null; // restart → the committed-line freeze re-captures on the next funding
        setAaChipPicked(null);
        setAaDismissed(false);
        setAaNudgeStreamed(false);
        setRevealedCount(0);
        setStoryOpen(false);
        setAaFlowOpen(false);
        setPrefQuizOpen(false);
        setPrefQuizIndex(0);
        setPrefAnswers({});
        setPrefDismissed(false);
        setPrefNudgeStreamed(false);
        setPrefQStreamed({});
        setExploreOffersPassed(new Set());
        setPlanConfirmLabel("Looks right");
        setBudgetConfirmLabel("Looks good");
        setFundConfirmLabel("Start goal");
        setPrefEchoes({});
        setBeliefEchoes({});
        setLadderEcho(null);
        setAtomFlow(null);
        setLumpSettled(false);
        setCruncherVisible(false);
        setCruncherStatus("Gathering your preferences");
        aaFetchStartedRef.current = false;
        setAaFetchDone(false);
        setAaCruncherGone(false);
        setAaFetchStatus(AA_FETCH_TEXTS[0]);
        setPlaygroundEvents([]);
        setChipsConsumed(new Set());
        setPlaygroundRoastFiredOnce(false);
        setPlaygroundRoastIndex(0);
        setPlaygroundNudgeShown(false);
        setPlaygroundGoalNudgeDone(false);
        setPlaygroundBusy(false);
        setCruncherDone(false);
        setSkipReveals([]);
        setSkipRevealDone(true);
        setFootprintConfirmed(new Set());
        setFootprintSheetBucket(null);
        setFootprintResults({});
        setBuildPlanStage(0);
        setBuildPlanAnswers({});
        setFootprintChatDraft("");
        setFootprintChatEdit(null);
        setLadderTier(null);
        setLadderQuizOpen(false);
        setLockInChoice(null);
        setTweakDraft("");
        setTweakSubmitted(false);
        setBudgetSheetOpen(false);
        setBudgetConfirmed(false);
        setBudgetEditDraft("");
        setBudgetCaps(null);
        setByronIntroReady(false);
        setByronMet(false);
        setByronReveal("idle");
        setByronRevealIn(false);
        setSwitchCount(0);
        setSwitchIntros([]);
        setBuildPlanPicked(false);
        setPotFunded(false);
        setHeadStart(null);
        setS2sIntroReady(false);
        setS2sPromptReady(false);
        setS2sNudgeReady(false);
        setS2sUnlocked(false);
        setKeyFly(false);
        setKeyFlyGo(false);
        setUserActionCount(0);
        setGoalLabel("Your goal");
        setRyanReady(false);
        setPillLabel(cosimoChat ? "Meet Cosimo" : "Meet Ryan");
      }
    }, OVERLAY_DURATION);
  }, [aaChipPicked, pdpSeen, planLocked, onComplete, betaIntentFirst]);

  // PDP → FAB tap: advance from PDP to chat within the overlay
  const handlePdpAction = useCallback(() => {
    setPdpSeen(true);
    setOverlayScreen("chat");
  }, []);

  // Chat → back to PDP (only during first-time onboarding, before "Ryan is ready")
  const handleChatBack = useCallback(() => {
    setOverlayScreen("pdp");
  }, []);

  // Track scroll for top fade gradient + scroll-to-bottom pill
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      setHasScrolled(el.scrollTop > 0);
      // Measure the bottom of the last real content element rather than
      // scrollHeight: snapScrollTo inflates the content's minHeight to allow
      // top-positioning the snap target, which would otherwise create phantom
      // "content below" and surface the jump-to-latest pill.
      const content = contentRef.current;
      const lastChild = content?.lastElementChild as HTMLElement | null;
      // The trailing breathing-room spacer is aria-hidden and shouldn't count as "content
      // below" — measure to its TOP (= bottom of the last real message) so the jump-to-latest
      // pill hides once the user is past the actual chat, not stranded by the empty spacer.
      const contentBottom = lastChild
        ? (lastChild.getAttribute("aria-hidden") === "true"
            ? lastChild.offsetTop
            : lastChild.offsetTop + lastChild.offsetHeight)
        : el.scrollHeight;
      setHasContentBelow(el.scrollTop + el.clientHeight < contentBottom - 4);
    };
    onScroll(); // initial check
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [overlayOpen, stepIndex]);

  // Auto-scroll - deferred, overlay-aware, cancellable
  useEffect(() => {
    // The docked ambiguity sheet CLOSING must not move the chat: the stepper above is mid-build and
    // the reader is parked on it — the scroll-to-bottom that used to fire here read as the whole
    // conversation "suddenly scrolling down" the moment the sheet was answered.
    const sheetJustClosed = prevBuildPlanQRef.current != null && buildPlanPendingQ == null;
    prevBuildPlanQRef.current = buildPlanPendingQ ?? null;
    // The tall-block TOP-snap is only for a freshly-arrived step. Reveal-flag flips
    // within the same step (the lock-in/s2s beats) used to re-fire it and yank the
    // reader UP mid-line — the reported "weird up scroll" (R14).
    const stepChanged = autoScrollStepWasRef.current !== stepIndex;
    autoScrollStepWasRef.current = stepIndex;
    if (sheetJustClosed && cosimoChat) return;
    if (isSnappingRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const delay = overlayAnimatingRef.current ? OVERLAY_DURATION + 100 : 50;
    const t = window.setTimeout(() => {
      if (isSnappingRef.current) return;
      // Beta: only when the newest message is TALL (dominates the screen) do we anchor its TOP
      // below the chrome, so a card/reply bigger than the viewport is read from its start instead
      // of scrolling past it. Short beats (a sentence, the sync bots) keep scrolling to the bottom
      // so the running conversation stays visible — anchoring those to the top would shove the
      // line just typed (e.g. the Byron intro) off-screen.
      if (betaIntentFirst) {
        const content = contentRef.current;
        const kids = content ? (Array.from(content.children) as HTMLElement[]) : [];
        let last: HTMLElement | undefined;
        for (let k = kids.length - 1; k >= 0; k--) {
          // Skip the near-zero footprint anchor (height:1) so we land on the real last message.
          if (kids[k].getAttribute("aria-hidden") !== "true" && kids[k].offsetHeight > 2) { last = kids[k]; break; }
        }
        // While ANY docked sheet is up (footprint / budget / tier / preferences), keep the bot's
        // question (the last real message) anchored above it — otherwise a scroll-to-bottom lands
        // behind the docked sheet. (The quiz sheets were missing here, so opening the tier sheet
        // shifted the chat behind it with no compensating scroll — the reported dead zone.)
        if ((footprintSheetBucket != null || budgetSheetOpen || prefQuizOpen || ladderQuizOpen || buildPlanPendingQ != null) && last) { snapScrollTo(last, 0); return; }
        if (stepChanged && last && last.offsetHeight > el.clientHeight * 0.6) { snapScrollTo(last, 0); return; }
      }
      // A reader PARKED above (a snap anchored a block for them) must not be
      // yanked to the bottom by the next beat — "it suddenly gets attached to the
      // bottom" (R15). Only a TRUE bottom-rider (within a 120px strip) follows;
      // half a viewport was still catching parked readers on short threads.
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distFromBottom > 120) return;
      // Release any phantom space a previous snap left behind (snapScrollTo inflates the content's
      // minHeight to park a message below the chrome and nothing ever reset it) — otherwise this
      // scroll-to-bottom lands PAST the real messages in blank space and reads as broken autoscroll.
      // The release is ANIMATED: clearing it in one frame clamps scrollTop instantly, which read as
      // "the whole chat suddenly drops to the bottom" before the next beat came in (R14).
      const contentEl = contentRef.current;
      if (contentEl && contentEl.style.minHeight) {
        contentEl.style.transition = "min-height 320ms cubic-bezier(0.22, 1, 0.36, 1)";
        contentEl.style.minHeight = "0px";
        // ONE motion: the collapse itself carries the viewport down (the clamp
        // follows it) — the bottom scroll waits for it, or the two stack into a
        // subtle double slide.
        window.setTimeout(() => {
          contentEl.style.minHeight = "";
          contentEl.style.transition = "";
          if (!isSnappingRef.current) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        }, 340);
        return;
      }
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, delay);
    return () => window.clearTimeout(t);
    // Lock-in reveals appear on state flips (funding → committed line → safe-to-spend beats), not on a
    // stepIndex change — without these deps the scroll stalled the moment you funded (the reported dead
    // zone at "you're committed").
  }, [stepIndex, revealedCount, cruncherDone, betaIntentFirst, snapScrollTo, footprintSheetBucket, budgetSheetOpen, prefQuizOpen, ladderQuizOpen, buildPlanPendingQ, potFunded, s2sNudgeReady, s2sIntroReady, s2sPromptReady, s2sUnlocked]);

  // Stick-to-bottom while bot lines stream: the typewriter grows a message a few px per tick, and
  // the step-level scroll effect only fires on step/reveal changes — so a long line (e.g. the goal
  // echo) ran on below the fold. Whenever the chat CONTENT grows and the user is already near the
  // bottom, follow it. Snaps in flight take priority; a user who scrolled up is left alone.
  useEffect(() => {
    if (!betaIntentFirst) return;
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;
    let lastH = scroller.scrollHeight;
    // The follow DEFERS one beat (80ms) before moving: a tall beat mounts, this
    // observer used to scroll-to-bottom instantly, and the 50ms step effect then
    // snapped the block's TOP back up — the reported down-then-up glitch. Waiting
    // out the step effect lets a snap claim the beat; typewriter growth still
    // follows at a smooth ~80ms cadence.
    let pending = 0;
    const ro = new ResizeObserver(() => {
      if (pending) return;
      pending = window.setTimeout(() => {
        pending = 0;
        const newH = scroller.scrollHeight;
        const growth = Math.max(0, newH - lastH);
        lastH = newH;
        if (isSnappingRef.current) return;
        // Followup rows just mounted: their growth stays below the fold (focus holds on the answer).
        if (Date.now() < suppressChatFollowUntil) return;
        // A fresh reply is ANCHORING toward the top edge (R16): glide with the
        // growing content until the bubble's top reaches the chrome line, then
        // HOLD — the rest of the reply reads downward from there.
        const anchor = anchorBubbleRef.current;
        if (anchor && anchor.isConnected) {
          const target = anchorTargetTop(anchor, scroller);
          const maxScroll = newH - scroller.clientHeight;
          const goal = Math.min(target, maxScroll);
          if (goal > scroller.scrollTop + 2) scroller.scrollTo({ top: goal, behavior: "smooth" });
          if (maxScroll >= target - 2) anchorBubbleRef.current = null; // reached — hold here
          return;
        }
        const dist = newH - scroller.scrollTop - scroller.clientHeight;
        // Follow ONLY when the user is truly pinned at the bottom edge (they're riding the newest
        // line) — and always SMOOTH (an instant branch once jumped whole blocks).
        if (dist > 2 && dist - growth < 48) {
          scroller.scrollTo({ top: newH, behavior: "smooth" });
        }
      }, 80);
    });
    ro.observe(content);
    return () => { ro.disconnect(); if (pending) window.clearTimeout(pending); };
  }, [betaIntentFirst, overlayMounted]);

  // On a FRESH user bubble, ANCHOR it toward the top edge — but only ever as far
  // as real content allows (R16). The old park inflated phantom space and jumped a
  // full screen at once ("snaps to the bottom", reported ×6); pure bottom-follow
  // left the reply mid-screen ("the top edge should be with this message"). This
  // glides: the bubble rises as the reply streams beneath it, and HOLDS once its
  // top reaches the chrome line — the rest reads downward from there.
  const bubbleCountRef = useRef(0);
  const anchorBubbleRef = useRef<HTMLElement | null>(null);
  const anchorTargetTop = useCallback((el: HTMLElement, scroller: HTMLElement) => {
    const chromeHeight = pitchCruncherVisibleRef.current ? 208 : topCruncherVisibleRef.current ? 180 : 108;
    const elTop = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
    return Math.max(0, elTop - chromeHeight - 8);
  }, []);
  useEffect(() => {
    if (userActionCount === 0) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const bubbles = contentRef.current?.querySelectorAll<HTMLElement>(".justify-end");
      const count = bubbles?.length ?? 0;
      if (count <= bubbleCountRef.current) {
        bubbleCountRef.current = count;
        return;
      }
      bubbleCountRef.current = count;
      const scroller = scrollRef.current;
      const el = bubbles && count ? bubbles[count - 1] : null;
      if (!scroller || !el) return;
      anchorBubbleRef.current = el;
      const maxScroll = scroller.scrollHeight - scroller.clientHeight;
      scroller.scrollTo({ top: Math.min(anchorTargetTop(el, scroller), maxScroll), behavior: "smooth" });
    }));
  }, [userActionCount, anchorTargetTop]);

  // Footprint walk: when a card is confirmed, park Ryan's next transition line
  // just below the chrome so the user reads it instead of it scrolling past
  // toward the following card. Fires for each bucket (income/obligations/p2p/
  // one-offs).
  useEffect(() => {
    if (footprintConfirmed.size === 0) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = walkthroughBotRef.current;
      if (el) snapScrollTo(el, 0);
    }));
  }, [footprintConfirmed, snapScrollTo]);

  // The ladder-intro line ("Money's all mapped…") sits right after the TALL build-plan stepper, so a
  // scroll-to-bottom can leave it below the fold. Snap it below the chrome when it becomes the live
  // step (mirrors the footprint-confirm snap above) — the reported dead zone at that line.
  useEffect(() => {
    if (!betaIntentFirst || LADDER_INTRO_STEP_INDEX < 0 || stepIndex !== LADDER_INTRO_STEP_INDEX) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = walkthroughBotRef.current;
      const scroller = scrollRef.current;
      if (!el || !scroller) return;
      // Already readable (the stepper above is parked, the line sits in view)?
      // Let it type in place — snapping it the last 200px read as a jerk (R15).
      const sRect = scroller.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const chromeH = pitchCruncherVisibleRef.current ? 208 : topCruncherVisibleRef.current ? 180 : 108;
      if (r.top >= sRect.top + chromeH - 8 && r.top <= sRect.bottom - 120) return;
      snapScrollTo(el, 0);
    }));
  }, [betaIntentFirst, stepIndex, LADDER_INTRO_STEP_INDEX, snapScrollTo]);

  // The build-plan stepper anchors to the TOP as it starts (R14): the three checks
  // tick in view, and the line that follows lands beneath — instead of the chat
  // riding a scroll-to-bottom that the next snap has to undo (the down-then-up).
  useEffect(() => {
    if (STEPS[stepIndex]?.kind !== "build-plan") return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = userBubbleRef.current;
      if (el) snapScrollTo(el, 0);
    }));
  }, [stepIndex, STEPS, snapScrollTo]);

  // A question with options is THE next thing to do — anchor it to the top as it
  // arrives (R15), each question of the run, so the answered exchange scrolls away
  // and the ask leads the screen. (The question block carries its own ref — the
  // preferences step never lands on walkthroughBotRef, which is why the first
  // attempt at this snap never fired.)
  useEffect(() => {
    if (!cosimoChat || STEPS[stepIndex]?.kind !== "preferences") return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = prefQuestionRef.current ?? walkthroughBotRef.current;
      if (el) snapScrollTo(el, 0);
    }));
  }, [cosimoChat, stepIndex, STEPS, prefQuizIndex, snapScrollTo]);

  // Skip-mosaic path: park Ryan's "No problem..." bubble just below chrome
  // when the skip-mosaic step reveals. Without this, the stepIndex
  // auto-scroll-to-bottom (and the shared userBubbleRef snap) pushes Ryan's
  // text up under the floating app bar once the mosaic appears.
  useEffect(() => {
    if (!aaSkipped) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = skipResponseRef.current;
      if (el) snapScrollTo(el, 0);
    }));
  }, [aaSkipped, snapScrollTo]);

  // Connect path: once accounts are linked, snap to the user's own "Connect other accounts" reply
  // (userBubbleRef) so the exchange reads from THEIR response down — Ryan's "…is linked" ack + the
  // sync flow below it. Otherwise the stepIndex auto-scroll jumps to the bottom and buries the reply.
  useEffect(() => {
    if (!aaConnected) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = userBubbleRef.current;
      if (el) snapScrollTo(el, 0);
    }));
  }, [aaConnected, snapScrollTo]);

  // Flip the pay-screen pill into its "ready" state once the user first opens
  // the chat. The old pause-based trigger (exit during mosaic, wait 5s) is
  // gone; the new flow is linear so the pill just commits the first time the
  // overlay opens to chat.
  useEffect(() => {
    if (overlayOpen && overlayScreen === "chat" && !ryanReady) {
      setRyanReady(true);
      setPillLabel(cosimoChat ? "Cosimo is ready" : voice === "byron" ? "Byron is ready" : "Ryan is ready");
    }
  }, [overlayOpen, overlayScreen, ryanReady, voice]);

  // Reveal the Ryan/Byron voice toggle exactly when Ryan introduces Byron, so the intro line's
  // Byron only arrives up top AFTER the user taps "Meet Byron" — the tap itself flips the toggle on
  // (see the Meet-Byron button). This effect is just the resume backstop: if a debug skip-to lands
  // on the roast step or later, the toggle should already be live. It must NOT fire at the intro
  // step (that's the pre-tap teaser), so it gates on the roast step, not the intro.
  useEffect(() => {
    if (!betaIntentFirst || betaAutoSave || BYRON_ROAST_STEP_INDEX < 0) return;
    if (stepIndex < BYRON_ROAST_STEP_INDEX || appBarMode !== "simple") return;
    const t = window.setTimeout(() => setAppBarMode("toggle"), 600);
    return () => window.clearTimeout(t);
  }, [stepIndex, betaIntentFirst, betaAutoSave, BYRON_ROAST_STEP_INDEX, appBarMode]);

  // The cash-flow card does NOT auto-advance — the user reads it, then taps "Looks right" to move on
  // to the full budget. We just reveal that button a beat after the card lands.
  useEffect(() => {
    if (STEPS[stepIndex]?.kind !== "spending-plan") { setPlanCtaReady(false); return; }
    const t = window.setTimeout(() => setPlanCtaReady(true), 700);
    return () => window.clearTimeout(t);
  }, [stepIndex]);

  // Plan-crunching step - cycle idle texts then advance
  useEffect(() => {
    if (STEPS[stepIndex]?.kind !== "plan-crunching") return;
    let idx = 0;
    setCruncherVisible(true);
    setCruncherStatus(IDLE_CRUNCHER_TEXTS[0]);
    const timer = window.setInterval(() => {
      idx += 1;
      if (idx >= IDLE_CRUNCHER_TEXTS.length) {
        clearInterval(timer);
        window.setTimeout(() => {
          setCruncherVisible(false);
          setCruncherDone(true);
          advanceStep();
        }, 800);
        return;
      }
      setCruncherStatus(IDLE_CRUNCHER_TEXTS[idx]);
    }, 900);
    return () => window.clearInterval(timer);
  }, [stepIndex, advanceStep]);

  // Connect path: parse transactions in the background. Runs independently of
  // the cruncher card's visibility, so dismissing the card doesn't stop the
  // work. Terminal - never advances the step; on completion the render layer
  // posts Ryan's "snapshot ready" line.
  useEffect(() => {
    if (!aaConnected || connectSyncDone) return;
    let idx = 0;
    setConnectSyncStatus(SYNC_TEXTS[0]);
    const timer = window.setInterval(() => {
      idx += 1;
      if (idx >= SYNC_TEXTS.length) {
        clearInterval(timer);
        window.setTimeout(() => setConnectSyncDone(true), 1600);
        return;
      }
      setConnectSyncStatus(SYNC_TEXTS[idx]);
    }, 1600);
    return () => window.clearInterval(timer);
  }, [aaConnected, connectSyncDone]);

  // ── AA actions ────────────────────────────────────────

  const handleAAConnect = useCallback(() => {
    setAaFlowOpen(true);
  }, []);

  const handleAAComplete = useCallback(() => {
    setAaFlowOpen(false);
    // Jun 11: connecting accounts is terminal. Rather than dropping straight to
    // the pay screen, land on the connect mosaic (playground step) where a
    // background sync cruncher runs while the user explores. Mirrors the skip
    // path so closing the overlay behaves the same.
    if (terminalAtAa) {
      setAaConnected(true);
      if (PLAYGROUND_STEP_INDEX >= 0) {
        setStepIndex(PLAYGROUND_STEP_INDEX);
      } else {
        setStepIndex((idx) => Math.min(idx + 1, LAST_STEP_INDEX));
      }
      return;
    }
    // Advance past aa-chips to the linked bubble + linked chips
    advanceStep();
  }, [advanceStep, terminalAtAa, PLAYGROUND_STEP_INDEX, LAST_STEP_INDEX]);

  const handleAAClose = useCallback(() => {
    setAaFlowOpen(false);
    if (aaChipPicked) {
      setAaDismissed(true);
    }
  }, [aaChipPicked]);

  // ── Big spends activity list ──────────────────────────
  const openBigSpends = useCallback((card: { title?: string; transactions: { date: string; merchant: string; amount: number; category: string }[] }) => {
    setBigSpends({ title: card.title ?? "Your biggest spends", transactions: card.transactions });
  }, []);
  const closeBigSpends = useCallback(() => setBigSpends(null), []);

  // ── Wrapped actions ───────────────────────────────────

  const openStory = useCallback((beatIndex: number) => {
    // Revealed card → review mode; unrevealed → quiz mode
    setReviewBeatIndex(beatIndex < revealedCount ? beatIndex : undefined);
    setStoryOpen(true);
    setStoryPhase("expanding");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setStoryPhase("open");
    }));
  }, [revealedCount]);

  const closeStory = useCallback((newRevealedCount: number) => {
    setStoryPhase("collapsing");
    window.setTimeout(() => {
      setStoryOpen(false);
      setStoryPhase("idle");
      setReviewBeatIndex(undefined);
      const allRevealed = newRevealedCount >= WRAPPED_BEATS.length;
      setRevealedCount(newRevealedCount);
      // Advance to post-wrapped flow once all 5 beats are revealed
      if (allRevealed && revealedCount < WRAPPED_BEATS.length) {
        advanceStep();
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const el = postWrappedRef.current;
          if (el) snapScrollTo(el);
        }));
      }
    }, 300);
  }, [advanceStep, revealedCount, snapScrollTo]);

  // ── Preference quiz actions ───────────────────────────

  const finishQuiz = useCallback((answers: Record<string, string>) => {
    const goalTypeId = answers["goal-type"];
    const goalType = GOAL_PREFERENCE_QUESTIONS[0].options.find((o) => o.id === goalTypeId)?.label || "Your goal";
    const detail = answers["destination"] || "";
    const label =
      goalTypeId === "trip" ? (detail ? `Trip to ${detail}` : goalType)
      : goalTypeId === "purchase" ? (detail || goalType)
      : goalType;
    setGoalLabel(label);
    setPrefQuizOpen(false);
    setUserActionCount((c) => c + 1);
    advanceStep();
  }, [advanceStep]);

  const handlePrefSelect = useCallback((questionId: string, option: QuestionOption) => {
    const next = { ...prefAnswers, [questionId]: option.id };
    setPrefAnswers(next);
    setUserActionCount((c) => c + 1); // drives the scroll-to-latest so each answer echo stays in view
    // Picking the goal type reshapes the rest of the quiz, so size the next
    // step against the freshly chosen branch rather than the stale list.
    const questions = questionId === "goal-type"
      ? buildPrefQuestions(option.id)
      : prefQuestions;
    const nextIdx = prefQuizIndex + 1;
    if (nextIdx < questions.length) {
      setPrefQuizIndex(nextIdx);
    } else {
      finishQuiz(next);
    }
  }, [prefQuizIndex, prefQuestions, prefAnswers, finishQuiz]);

  const handlePrefFreeText = useCallback((questionId: string, text: string) => {
    const next = { ...prefAnswers, [questionId]: text };
    setPrefAnswers(next);
    setUserActionCount((c) => c + 1); // drives the scroll-to-latest so each answer echo stays in view
    const nextIdx = prefQuizIndex + 1;
    if (nextIdx < prefQuestions.length) {
      setPrefQuizIndex(nextIdx);
    } else {
      finishQuiz(next);
    }
  }, [prefQuizIndex, prefQuestions, prefAnswers, finishQuiz]);

  const handlePrefNavigate = useCallback((direction: "prev" | "next") => {
    setPrefQuizIndex((prev) => {
      if (direction === "prev") return Math.max(0, prev - 1);
      return Math.min(prefQuestions.length - 1, prev + 1);
    });
  }, [prefQuestions.length]);

  const handlePrefClose = useCallback(() => {
    setPrefQuizOpen(false);
    // Beta: the goal nudge sits before AA and is optional — closing it just moves on to the AA ask,
    // rather than parking on the "set a goal later" re-open nudge (which would be a dead-end up front).
    if (betaIntentFirst) {
      setGoalDeclined(true);
      advanceStep();
      return;
    }
    setPrefDismissed(true);
    // Scroll to show the nudge after quiz overlay animates away
    window.setTimeout(() => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, OVERLAY_DURATION + 100);
  }, [betaIntentFirst, advanceStep]);

  // Conversational: the named-2x line lives inside the goal-echo card (footer visual), so its
  // standalone bot step auto-skips — but only when the card actually rendered (fixed-tenure goals).
  useEffect(() => {
    if (!conversational || !hasFixedTenure) return;
    if (NAMED_2X_STEP_INDEX < 0 || stepIndex !== NAMED_2X_STEP_INDEX) return;
    const t = window.setTimeout(advanceStep, 60);
    return () => window.clearTimeout(t);
  }, [conversational, hasFixedTenure, stepIndex, NAMED_2X_STEP_INDEX, advanceStep]);

  // When the preferences step becomes active, open the quiz (unless dismissed). Beta included now —
  // EVERY goal question (goal-type first, then its follow-ups) is asked in the sheet; answers echo in chat.
  // Conversational mode never opens the sheet: the questions live inside Ryan's messages instead.
  useEffect(() => {
    if (conversational) return;
    if (STEPS[stepIndex]?.kind === "preferences" && !prefQuizOpen && !prefDismissed && Object.keys(prefAnswers).length === 0) {
      const t = window.setTimeout(() => setPrefQuizOpen(true), 400);
      return () => window.clearTimeout(t);
    }
  }, [stepIndex, prefQuizOpen, prefDismissed, prefAnswers, conversational]);

  // When the ladder-pick step becomes active, open the savings-tier picker
  // overlay (same QuestionnaireOverlay variant the goal quiz uses) — UNLESS the
  // goal has a fixed tenure, in which case the monthly is determined and there's
  // nothing to pick: skip straight past the step.
  useEffect(() => {
    if (STEPS[stepIndex]?.kind !== "ladder-pick") return;
    if (hasFixedTenure) {
      const t = window.setTimeout(() => advanceStep(), 400);
      return () => window.clearTimeout(t);
    }
    // Conversational: the tier ask renders as numbered options inside Ryan's message, not a sheet.
    if (!conversational && !ladderQuizOpen && ladderTier == null) {
      const t = window.setTimeout(() => setLadderQuizOpen(true), 400);
      return () => window.clearTimeout(t);
    }
  }, [stepIndex, ladderQuizOpen, ladderTier, hasFixedTenure, advanceStep, conversational]);

  // ── Playground: chip-tap & event handlers ────────────────────
  const appendPlaygroundEvent = useCallback((evt: PlaygroundEvent) => {
    setPlaygroundEvents((prev) => [...prev, evt]);
  }, []);

  // echoLabel: conversational mode passes the user's TYPED words ("yes", "2") so the echo bubble
  // shows what they actually said instead of the chip's label.
  const handlePlaygroundChip = useCallback((chipId: string, echoLabel?: string) => {
    if (playgroundBusy) return;

    if (chipId === "roast-byron") {
      const roastText = getPlaygroundByronRoast(playgroundRoastIndex);
      setPlaygroundRoastIndex((i) => i + 1);
      setUserActionCount((c) => c + 1);
      appendPlaygroundEvent({ kind: "user-tap", chipId, label: echoLabel ?? "Roast me, Byron" });
      setPlaygroundBusy(true);

      const isFirst = !playgroundRoastFiredOnce;
      if (isFirst) setPlaygroundRoastFiredOnce(true);

      // Slow fade-to-byron sequence (skip the fade if already on byron)
      const needsFade = voice === "ryan";
      if (isFirst) window.setTimeout(() => setAppBarMode("toggle"), 700);

      const fadeStart = isFirst ? 1500 : 500;
      window.setTimeout(() => {
        if (needsFade) {
          setContentVisible(false);          // 500ms fade-out begins
          window.setTimeout(() => {
            setVoice("byron");
            window.setTimeout(() => {
              setContentVisible(true);       // 500ms fade-in
              window.setTimeout(() => {
                appendPlaygroundEvent({ kind: "byron-roast", text: roastText, isFirst });
              }, 800);
            }, 100);
          }, 600);
        } else {
          // Already on byron - append after a beat
          window.setTimeout(() => {
            appendPlaygroundEvent({ kind: "byron-roast", text: roastText, isFirst });
          }, 700);
        }
      }, fadeStart);
      return;
    }
    // Cosimo's suggestion rows include reveals that have no pill chip (big-spends) — any known
    // reveal id is tappable as long as the caller supplies the echo label.
    const chip = PLAYGROUND_CHIPS.find((c) => c.id === chipId);
    if (!chip && !PLAYGROUND_REVEALS[chipId]) return;
    setUserActionCount((c) => c + 1);
    appendPlaygroundEvent({ kind: "user-tap", chipId, label: echoLabel ?? chip?.label ?? "" });
    setPlaygroundBusy(true);
    setChipsConsumed((prev) => {
      const next = new Set(prev);
      next.add(chipId);
      return next;
    });
    appendPlaygroundEvent({ kind: "reveal", chipId });
  }, [appendPlaygroundEvent, playgroundRoastFiredOnce, playgroundRoastIndex, playgroundBusy, voice]);

  const handlePlaygroundRevealDone = useCallback(() => {
    setPlaygroundBusy(false);
  }, []);

  // Sync-done "Start" (Cosimo pitch): the fetch card's Start pill posts the user's intent as a
  // sent bubble ("Let's set up my goal"), then hands the flow into the goal questions — the
  // goal-intro bot sits right after the playground step in the Cosimo step list.
  const handleCosimoStart = useCallback(() => {
    if (PLAYGROUND_STEP_INDEX < 0 || stepIndex > PLAYGROUND_STEP_INDEX) return;
    appendPlaygroundEvent({ kind: "user-tap", chipId: "start-goal", label: "Let's set up my goal plan" });
    setUserActionCount((c) => c + 1); // snap the sent bubble up so the goal intro reads below it
    setStepIndex(PLAYGROUND_STEP_INDEX + 1);
  }, [stepIndex, PLAYGROUND_STEP_INDEX, appendPlaygroundEvent]);

  // ── Conversational (pitch): one chat input, every answer typed ──────────────────────────────
  // The next un-consumed, un-passed reveal to offer — ONE at a time while the cruncher runs.
  const conversationalOffer = !conversational ? null : (
    PLAYGROUND_CHIPS.find((c) => {
      if (chipsConsumed.has(c.id) || exploreOffersPassed.has(c.id)) return false;
      if (c.id === "roast-byron") return playgroundRoastIndex < MAX_BYRON_ROASTS;
      return true;
    }) ?? null
  );

  // Routes typed input to whatever Ryan just asked: numbered options (goal questions, tiers,
  // reveals), yes/no confirmations (plan, budget, ready-to-build, head-start skip), free-form
  // answers (destination). Returns true when consumed; unrouted text falls through to a bubble.
  const routeConversationalInput = (raw: string): boolean => {
    const t = raw.trim();
    const tl = t.toLowerCase();
    const active = STEPS[stepIndex];
    if (!active) return false;

    if (active.kind === "preferences") {
      const q = prefQuestions[prefQuizIndex];
      if (!q) return false;
      if (q.options.length > 0) {
        const idx = matchOptionIndex(tl, q.options.map((o) => o.label));
        if (idx >= 0) {
          setPrefEchoes((m) => ({ ...m, [q.id]: t })); // echo the TYPED words, not the label
          handlePrefSelect(q.id, q.options[idx]);
          return true;
        }
        return false; // no option matched — leave it as a bubble rather than mis-answer
      }
      handlePrefFreeText(q.id, t); // free-text question ("Where are you headed?")
      return true;
    }

    if (active.kind === "belief-q") {
      const q = BELIEF_QUESTIONS[active.qIndex];
      if (beliefAnswers[active.qIndex]) return false;
      const idx = matchOptionIndex(tl, q.options.map((o) => o.label));
      if (idx >= 0) {
        setBeliefEchoes((m) => ({ ...m, [active.qIndex]: t })); // verbatim echo
        setBeliefAnswers((m) => ({ ...m, [active.qIndex]: q.options[idx].id }));
        setUserActionCount((c) => c + 1);
        return true;
      }
      return false;
    }

    if (active.kind === "playground") {
      if (playgroundBusy) return false;
      if (playgroundGoalNudgeDone && !buildPlanPicked && isYesish(tl)) {
        setBuildPlanPicked(true);
        setStepIndex(goalAfterExplore ? PLAYGROUND_STEP_INDEX + 1 : (BUILD_PLAN_STEP_INDEX >= 0 ? BUILD_PLAN_STEP_INDEX : FOOTPRINT_RESUME_INDEX));
        return true;
      }
      // Only route yes/no to the offer while it's actually ON screen (the live offer line hides
      // once the goal nudge lands — same gate as the render, else "no" passes an invisible offer).
      if (conversationalOffer && !playgroundNudgeShown) {
        // Persist the asked offer INTO the event stream first (as a plain Ryan line) so the
        // question stays above the user's "yes"/"no" once the live offer moves to the next one.
        const offerText = withGoal(CONVO_OFFER_TEXTS[conversationalOffer.id] ?? conversationalOffer.label);
        if (isYesish(tl)) {
          appendPlaygroundEvent({ kind: "switch-intro", voice, text: offerText });
          handlePlaygroundChip(conversationalOffer.id, t);
          return true;
        }
        if (isNoish(tl)) {
          appendPlaygroundEvent({ kind: "switch-intro", voice, text: offerText });
          appendPlaygroundEvent({ kind: "user-tap", chipId: conversationalOffer.id, label: t });
          setUserActionCount((c) => c + 1);
          setExploreOffersPassed((s) => new Set(s).add(conversationalOffer.id));
          return true;
        }
      }
      const pool = PLAYGROUND_CHIPS.filter((c) => c.id !== "roast-byron" && !chipsConsumed.has(c.id));
      const idx = matchOptionIndex(tl, pool.map((c) => withGoal(c.label)));
      const wantsRoast = idx < 0 && /byron|roast/.test(tl) && playgroundRoastIndex < MAX_BYRON_ROASTS;
      if (idx >= 0 || wantsRoast) {
        // Naming a reveal (or Byron) while an offer is live: persist the offer's question first —
        // exactly like the yes/no paths — so it doesn't vanish and re-stream after the reveal. A
        // DIFFERENT pick also passes the live offer (it was asked and ignored); the roast offer is
        // never passed this way since roasts can repeat.
        if (conversationalOffer && !playgroundNudgeShown) {
          const offerText = withGoal(CONVO_OFFER_TEXTS[conversationalOffer.id] ?? conversationalOffer.label);
          appendPlaygroundEvent({ kind: "switch-intro", voice, text: offerText });
          const dispatchedId = wantsRoast ? "roast-byron" : pool[idx].id;
          if (dispatchedId !== conversationalOffer.id && conversationalOffer.id !== "roast-byron") {
            setExploreOffersPassed((s) => new Set(s).add(conversationalOffer.id));
          }
        }
        handlePlaygroundChip(wantsRoast ? "roast-byron" : pool[idx].id, t);
        return true;
      }
      return false;
    }

    if (active.kind === "ladder-pick" && ladderTier == null) {
      const byTier = matchOptionIndex(tl, LADDER_OPTIONS.map((o) => o.tier));
      const idx = byTier >= 0 ? byTier : matchOptionIndex(tl.replace(/[,₹\s]/g, ""), LADDER_OPTIONS.map((o) => String(o.monthlyAmount)));
      if (idx >= 0) {
        setLadderEcho(t); // verbatim echo
        setLadderTier(LADDER_OPTIONS[idx].tier);
        setUserActionCount((c) => c + 1);
        advanceStep();
        return true;
      }
      return false;
    }

    if (active.kind === "spending-plan" && planCtaReady && !planConfirmed) {
      if (isYesish(tl)) {
        setPlanConfirmLabel(t);
        setPlanConfirmed(true);
        setUserActionCount((c) => c + 1);
        advanceStep();
        return true;
      }
      return false;
    }

    if (active.kind === "budget-confirm" && !budgetConfirmed) {
      if (isYesish(tl)) {
        setBudgetConfirmLabel(t);
        setBudgetConfirmed(true);
        setBudgetSheetOpen(false);
        setUserActionCount((c) => c + 1);
        advanceStep();
        return true;
      }
      // "food 6k" cap edits — only when the text carries a number; plain words ("no", "hmm")
      // fall through to a normal bubble instead of being silently swallowed by the parser.
      if (budgetSheetOpen && /\d/.test(t)) { applyBudgetEdit(t); return true; }
      return false;
    }

    if (active.kind === "feasibility") {
      // Negotiation rounds answer like every other numbered ask: "1"/"2", the option text, or a
      // loose match. Anything else falls through to the gentle re-ask.
      if (feasPhase === "negotiate") {
        const current = feasRounds[feasRounds.length - 1];
        if (current && !current.picked) {
          const idx = matchOptionIndex(t, current.options);
          if (idx >= 0) { handleFeasibilityPick(idx); return true; }
        }
      }
      // Typed consent for the "Build my plan" beat ("yes", "build it", "go ahead"…).
      if (cosimoChat && feasPhase === "resolved" && !planConsent) {
        if (isYesish(tl) || /plan/.test(tl)) {
          setPlanConsent(true);
          setUserActionCount((c) => c + 1);
          advanceStep();
          return true;
        }
      }
      return false;
    }

    if (active.kind === "lump-sum" && headStart === null) {
      // Capture the head-start INTENT only — the atom-creation runs later, at lock-in. "none"/no
      // records 0; an amount (or "yes" for the suggested one) records the amount. The typed words
      // echo back as the user's bubble (they were silently swallowed before — the reported
      // "my 10,000 message is not showing").
      if (isNoish(tl)) {
        setLumpEcho(t);
        setHeadStart(0);
        setUserActionCount((c) => c + 1);
        return true;
      }
      const lumpAmt = parseTypedAmount(t);
      if (lumpAmt != null) {
        setLumpEcho(t);
        fundedAmountRef.current = lumpAmt;
        setHeadStart(lumpAmt);
        setUserActionCount((c) => c + 1);
        return true;
      }
      if (isYesish(tl)) {
        setLumpEcho(t);
        fundedAmountRef.current = HEAD_START_AMOUNT;
        setHeadStart(HEAD_START_AMOUNT);
        setUserActionCount((c) => c + 1);
        return true;
      }
      return false;
    }

    if (active.kind === "lock-in") {
      // The head start (if any) executes automatically via the deferred-atom effect; here we only
      // take the autopay confirmation. "yes" (or a typed amount) starts the goal.
      if (!potFunded) {
        if (isYesish(tl) || parseTypedAmount(t) != null) {
          setFundConfirmLabel(t);
          setPotFunded(true);
          setUserActionCount((c) => c + 1);
          return true;
        }
        return false;
      }
      return false;
    }

    return false;
  };

  // ONE contextual suggestion for the message box (shown as the placeholder; SPACE fills it in).
  // Always the most natural next reply for whatever Ryan just asked — never a list of formats.
  const conversationalSuggestion = ((): string | null => {
    if (!conversational || buildPlanPendingQ) return null;
    const active = STEPS[stepIndex];
    if (!active) return null;
    switch (active.kind) {
      case "preferences": {
        const q = prefQuestions[prefQuizIndex];
        if (!q) return null;
        // Cosimo's goal picker rows carry the options — the input hints free-form instead
        // ("Enter saving goal", canon 882:5873; wired in the placeholder fallback below).
        if (cosimoChat && q.id === "goal-type") return null;
        // Free-text hint follows the goal branch: trips suggest a destination, purchases a thing.
        return q.options.length > 0 ? q.options[0].label : (q.id === "destination" ? (prefAnswers["goal-type"] === "purchase" ? "A laptop" : "Goa") : null);
      }
      case "belief-q":
        return beliefAnswers[active.qIndex] ? null : (BELIEF_QUESTIONS[active.qIndex].options[0]?.label ?? null);
      case "playground":
        // Cosimo's explore entry is the tappable suggestion rows, not a yes/no offer — no hint.
        return playgroundBusy || cosimoChat ? null : "Yes";
      case "feasibility": {
        const cur = feasRounds[feasRounds.length - 1];
        return feasPhase === "negotiate" && cur && !cur.picked ? cur.options[0] : null;
      }
      case "ladder-pick":
        return ladderTier == null ? `${formatINR(LADDER_OPTIONS[1].monthlyAmount)}/mo` : null;
      case "spending-plan":
        return planCtaReady && !planConfirmed ? "Looks right" : null;
      case "budget-confirm":
        return !budgetConfirmed ? "Looks good" : null;
      case "lump-sum":
        return headStart === null ? formatINR(HEAD_START_AMOUNT) : null;
      case "lock-in":
        // The head start (if any) auto-executes; only the autopay needs a typed reply.
        return !potFunded && (LUMP_SUM_STEP_INDEX < 0 || headStart === 0 || lumpSettled) ? "Yes" : null;
      default:
        return null;
    }
  })();

  // When typed input doesn't route, Ryan's reply must fit the moment — a pending question gets a
  // gentle re-ask (the generic "noted" line read as broken there).
  const conversationalReask = (): string => {
    const active = STEPS[stepIndex];
    if (active?.kind === "preferences" && (prefQuestions[prefQuizIndex]?.options.length ?? 0) > 0) {
      return "All good. Pick whichever fits best: type 1, 2, 3... or tap an option above.";
    }
    if (active?.kind === "belief-q" && !beliefAnswers[active.qIndex]) {
      return "Fair enough. Give me your gut pick though: 1, 2 or 3.";
    }
    if (active?.kind === "ladder-pick" && ladderTier == null) {
      return "Whenever you're ready, pick a pace: 1, 2 or 3.";
    }
    if (active?.kind === "spending-plan" && planCtaReady && !planConfirmed) {
      return "Take your time. Say yes when it looks right, or tell me what to change.";
    }
    if (active?.kind === "budget-confirm" && !budgetConfirmed) {
      return "Say yes when the caps look right, or tweak one, like food 6k.";
    }
    if (active?.kind === "lump-sum" && headStart === null) {
      return "An amount works, like 15000 or 25k. Or just say none.";
    }
    if (active?.kind === "lock-in" && !potFunded) {
      return "Just say yes and I'll start the autopay.";
    }
    return "Good question, noted. Let me come back to that once we're through here.";
  };

  const handleWalkthroughSubmit = () => {
    const text = walkthroughDraft.trim();
    setWalkthroughDraft("");
    if (!text || !betaIntentFirst) return;
    if (conversational && routeConversationalInput(text)) return;
    setFreeTextBubbles((prev) => [...prev, { text, step: stepIndex, reply: conversationalReask() }]);
    setUserActionCount((c) => c + 1); // triggers the snap-scroll to the new bubble
  };

  // When a reveal event lands, hold the quip for a beat so the user has time
  // to look at the card before Ryan/Byron starts narrating it. The delay
  // applies to reveal events only — roasts, handoffs, etc. stream immediately.
  useEffect(() => {
    const last = playgroundEvents[playgroundEvents.length - 1];
    if (!last || last.kind !== "reveal") return;
    setRevealQuipReady(false);
    const t = window.setTimeout(() => setRevealQuipReady(true), 1500);
    return () => window.clearTimeout(t);
  }, [playgroundEvents]);

  const handlePlaygroundByronRoastDone = useCallback((isFirst: boolean) => {
    if (!isFirst) {
      // Subsequent roast - stays on byron. If this was the capping roast,
      // follow it with a hard nudge so the "Yes, set up a goal" chip below
      // reads as a clear answer instead of an orphaned button.
      if (playgroundRoastIndex >= MAX_BYRON_ROASTS) {
        window.setTimeout(() => {
          appendPlaygroundEvent({ kind: "byron-cap-nudge" });
        }, 800);
      } else {
        setPlaygroundBusy(false);
      }
      return;
    }
    // First roast - hold on Byron, then slow fade back to Ryan with handoff line
    window.setTimeout(() => {
      setContentVisible(false);              // 500ms fade-out
      window.setTimeout(() => {
        setVoice("ryan");
        window.setTimeout(() => {
          setContentVisible(true);           // 500ms fade-in
          window.setTimeout(() => {
            appendPlaygroundEvent({ kind: "ryan-handoff" });
          }, 800);
        }, 100);
      }, 600);
    }, 4500);
  }, [appendPlaygroundEvent, playgroundRoastIndex]);

  const handlePlaygroundByronCapNudgeDone = useCallback(() => {
    setPlaygroundBusy(false);
  }, []);

  const handlePlaygroundRyanHandoffDone = useCallback(() => {
    setPlaygroundBusy(false);
  }, []);

  const handlePlaygroundGoalNudgeDone = useCallback(() => {
    setPlaygroundGoalNudgeDone(true);
    setPlaygroundBusy(false);
  }, []);

  // Snap-scroll the ryan-handoff bubble into view when it lands
  useEffect(() => {
    const last = playgroundEvents[playgroundEvents.length - 1];
    if (last?.kind !== "ryan-handoff") return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = ryanHandoffRef.current;
      if (el) snapScrollTo(el, 0);
    }));
  }, [playgroundEvents, snapScrollTo]);

  // Surface the "ready to build your plan" nudge once the user has seen any 2 bot responses —
  // spend reveals and Byron roasts count the same (to the user it's one conversation, not two
  // tracks). After 2, the goal-nudge line lands and the Build-my-plan CTA opens up.
  // Conversational also nudges when the offer sequence RUNS DRY (every offer answered or declined)
  // or when the background cruncher FINISHES (money's mapped — the old banner CTA's job, now asked
  // in the chat): a typing-only user must always have a typed route into build-plan.
  useEffect(() => {
    if (STEPS[stepIndex]?.kind !== "playground") return;
    // Cosimo pitch: the sync-done CARD is the goal nudge ("Transaction data updated / Start your
    // goal plan" + Start) — no bot-line nudge, and the suggestion rows stay up until Start is tapped.
    if (cosimoChat) return;
    if (playgroundNudgeShown || playgroundBusy) return;
    const responseCount = playgroundEvents.filter(
      (e) => e.kind === "reveal" || e.kind === "byron-roast",
    ).length;
    const offersDry = conversational && (conversationalOffer == null || aaFetchDone);
    if (responseCount < 2 && !offersDry) return;
    setPlaygroundEvents((prev) => [...prev, { kind: "goal-nudge" }]);
    setPlaygroundNudgeShown(true);
    setPlaygroundBusy(true);
  }, [stepIndex, playgroundNudgeShown, playgroundBusy, playgroundEvents, conversational, conversationalOffer, aaFetchDone, cosimoChat]);

  const handlePlaygroundAcceptGoal = useCallback(() => {
    setUserActionCount((c) => c + 1);
    // Skip mosaic + preface bubbles; go straight to the goal questionnaire
    setStepIndex(PREFERENCES_STEP_INDEX);
  }, [PREFERENCES_STEP_INDEX]);

  const handlePlaygroundSaveMore = useCallback(() => {
    setUserActionCount((c) => c + 1);
    // "Just save more" = no specific target: preselect the save-more goal type and land where the
    // questionnaire exits for save-more (the footprint walk), skipping the goal-type question itself.
    setGoalLabel("Just save more");
    setPrefAnswers({ "goal-type": "save-more" });
    setStepIndex(PREFERENCES_STEP_INDEX + 1);
  }, [PREFERENCES_STEP_INDEX]);

  // Skip-mosaic spend tile → append an inline reveal (reply + viz + quip).
  // Ignore repeat taps and taps while the previous reveal is still streaming, so
  // reveals don't overlap. Tapping dismisses the mosaic.
  const pickSpendTile = useCallback((chipId: string) => {
    // Allow re-picking the same tile — each tap appends a fresh reveal (dedupe removed).
    if (skipReveals.length > 0 && !skipRevealDone) return;
    setSkipReveals((prev) => [...prev, chipId]);
    // Once the sync is done the reveal quip renders STATICALLY (no typewriter, so
    // its onDone never fires). Mark the reveal done immediately in that case, else
    // skipRevealDone stays false and permanently blocks the next tile tap. While
    // the sync is still streaming (false), the active RyanLine's onDone resets it.
    setSkipRevealDone(connectSyncDone);
    setUserActionCount((c) => c + 1);
  }, [skipReveals, skipRevealDone, connectSyncDone]);

  // If the sync finishes MID-reveal, the active RyanLine's `active` flips to false so its onDone never
  // fires — set the guard directly so a mid-stream completion can't strand skipRevealDone=false and
  // permanently lock further tile taps.
  useEffect(() => {
    if (connectSyncDone && skipReveals.length > 0 && !skipRevealDone) setSkipRevealDone(true);
  }, [connectSyncDone, skipReveals.length, skipRevealDone]);

  const handlePlaygroundTakeMeHome = useCallback(() => {
    setUserActionCount((c) => c + 1);
    onComplete?.({ skipGoal: true });
  }, [onComplete]);

  // ── Render the chat content ───────────────────────────

  const visibleSteps = STEPS.slice(0, stepIndex + 1);

  // Onboarding completes only after the user actively confirms via the
  // post-plan chips or types into the input bar. Previously this fired
  // automatically the moment the verbose plan finished streaming, which
  // dumped the user back to the pay screen before they could engage.
  const onCompleteCalledRef = useRef(false);
  const handlePlanConfirmed = useCallback(() => {
    if (onCompleteCalledRef.current) return;
    onCompleteCalledRef.current = true;
    onComplete?.();
  }, [onComplete]);

  // Top clearance increases when cruncher is visible.
  // We compensate scrollTop by the delta in a layout effect so the spacer
  // growth doesn't visibly push chat content down (which the auto-scroll
  // would then yank back up - the "bounce" the user reported).
  // Non-cruncher start clears most of the top fade without leaving too big a gap below
  // the app bar — a freshly-arriving RyanLine sits just under the soft edge of the fade.
  // Cruncher floats OVER the chat (overlay) rather than reserving space, so the chat keeps its
  // resting top-clearance whether or not the cruncher is showing (it no longer pushes messages down).
  // When the connect cruncher floats over the chat, the content needs extra top padding so the
  // first row clears the pinned card (mirrors the goal-flow cruncher's clearance).
  // Mobile hides the simulated status bar (real notch via safe-area) and the app bar is only ~64px,
  // so the desktop clearance pushed the first line too far down — give mobile a shorter clearance.
  const topClearance = aaConnected && !connectCruncherDismissed ? (isMobile ? 132 : 180) : (isMobile ? 72 : 116);
  const prevTopClearanceRef = useRef(topClearance);
  useLayoutEffect(() => {
    const prev = prevTopClearanceRef.current;
    if (prev !== topClearance) {
      const scroller = scrollRef.current;
      if (scroller && scroller.scrollTop > 0) {
        scroller.scrollTop += topClearance - prev;
      }
      prevTopClearanceRef.current = topClearance;
    }
  }, [topClearance]);

  const chatContent = (
    <div
      ref={scrollRef}
      className="absolute inset-0 w-full overflow-y-auto overscroll-none scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{
        opacity: contentVisible ? 1 : 0,
        // The chat area's bottom rides chatLift so the conversation moves up WITH the message
        // box — for the suggestions sheet AND the mock keyboard; the chatLift effect mirrors
        // the same delta into scrollTop so the tail stays pinned above the bar. (Inline
        // transition replaces the old transition-opacity class — inline style wins.)
        bottom: chatLift,
        transition: `opacity 500ms ease-out, bottom ${suggestSheetEase}`,
      }}
    >
      <div ref={contentRef} className="flex flex-col" style={{ paddingLeft: SPACE_L, paddingRight: SPACE_L, paddingBottom: SPACE_L }}>
        {/* Clearance for floating app bar + cruncher */}
        <div className="shrink-0" aria-hidden="true" style={{ height: topClearance }} />

        {visibleSteps.map((step, i) => {
          // The step body runs in an IIFE so persona-switch intros can render right AFTER the step
          // they fired on (see the Fragment below) — folding them into the stream instead of pinning
          // them to the bottom of the chat forever.
          const stepEl = ((): ReactNode => {
          const isLast = i === stepIndex;

          // ── Per-message voice freeze (SINGLE SOURCE for the whole render loop) ──
          // Only the LAST (current) message speaks the live voice — toggling Ryan/Byron updates it.
          // Every PAST message freezes to the voice it was showing when it stopped being last, so
          // scrollback never rewrites on a switch. This MUST be hoisted here (not inside the `bot`
          // branch) so EVERY branch — plan, verdict, lock-in, dismiss-nudges, playground quips,
          // connect salutation — reads `msgVoice`, not the live `voice`. Reading live `voice` in any
          // branch is the "past text changes on switch" bug.
          const msgVoice = isLast ? voice : (msgVoiceRef.current[i] ??= voice);

          // Terminal paths (skip + connect): hide the AA_LINKED_BUBBLE and the
          // PLAYGROUND_INTRO_BUBBLES between aa-chips and playground. On skip
          // they're irrelevant; on connect the sync cruncher + salutation
          // replace them. The Byron-intro line is the exception — it stays
          // visible on skip so Byron still gets introduced (with skip-aware copy).
          if (
            (aaSkipped || aaConnected) &&
            AA_CHIPS_STEP_INDEX >= 0 &&
            PLAYGROUND_STEP_INDEX >= 0 &&
            i > AA_CHIPS_STEP_INDEX &&
            i < PLAYGROUND_STEP_INDEX &&
            i !== BYRON_INTRO_STEP_INDEX &&
            i !== BYRON_ROAST_STEP_INDEX
          ) {
            return null;
          }

          // Beta "Just auto-save": hide everything between the AA chips and the lock-in fund step
          // (explore, footprint, plan, verdict) so the chat jumps straight from the choice to a
          // simple monthly auto-save.
          if (
            betaAutoSave &&
            AA_CHIPS_STEP_INDEX >= 0 &&
            LOCK_IN_STEP_INDEX >= 0 &&
            i > AA_CHIPS_STEP_INDEX &&
            i < LOCK_IN_STEP_INDEX
          ) {
            return null;
          }

          if (step.kind === "fetch-card") {
            // Cosimo pitch: the inline fetch-status card. Fades in after the greeting, holds a beat,
            // then the flow moves on while it keeps cycling. When the background fetch lands it
            // morphs into the sync-done nudge with the Start pill (→ goal questions).
            // The card leaves the stream once Start is clicked (goal flow underway) — it kept
            // sitting in the history as a stale nudge.
            if (stepIndex > PLAYGROUND_STEP_INDEX) return null;
            return (
              // Canon 807:7806: the card is 320 wide on the 360 screen — 4px past the 312 text column.
              <div key={`fetch-${i}`} style={{ marginTop: SPACE_L, marginLeft: -4, marginRight: -4 }}>
                <CosimoFetchCard
                  done={aaFetchDone}
                  showStart={stepIndex <= PLAYGROUND_STEP_INDEX}
                  active={isLast}
                  onSettled={isLast ? advanceStep : undefined}
                  onStart={handleCosimoStart}
                />
              </div>
            );
          }

          if (step.kind === "feasibility") {
            // Goal-planning feasibility (schematic 426:1340). FUND flow (no fixed amount+deadline):
            // feasibility doesn't apply to an open-ended pot — one line, straight through.
            if (!hasFixedTenure) {
              return (
                <div key={`feas-${i}`}>
                  <RyanLine
                    text="No fixed deadline on this one, so there's no pass-fail math. We'll set a pace that feels easy and step it up when you're ready."
                    active={isLast}
                    onDone={isLast ? advanceStep : undefined}
                  />
                </div>
              );
            }
            // GOAL flow: do the math in public, land a verdict, then negotiate levers if it's short.
            const base = feasCalc({ headStart: false, sip: false, extraMonths: 0, trim: null });
            const baseOk = base.verdict === "comfortable" || base.verdict === "feasible";
            const verdictLine =
              base.verdict === "comfortable" ? "That's an easy fit — plenty of headroom left in your month."
              : base.verdict === "feasible" ? "That fits. It takes intent, but nothing day-to-day has to change."
              : base.verdict === "tight" ? "That's tight — it'd squeeze every other part of your month. Let's make it easier."
              : "Honestly, that doesn't fit as-is — the month doesn't have that much room. Let's make it work.";
            return (
              <div key={`feas-${i}`}>
                <RyanLine
                  text={`${formatINR(goalAmountNum!)} ${TIMELINE_LABELS[timelineId] ?? `in ${goalMonths} months`} works out to about ${formatINR(base.monthly)} a month. After your fixed spends, your month has about ${formatINR(planAvailable)} of room.`}
                  active={isLast && feasPhase === "math"}
                  onDone={isLast && feasPhase === "math" ? () => setFeasPhase("verdict") : undefined}
                />
                {/* (Verdict badge pill removed per review — the verdict lives in the prose.) */}
                {feasPhase !== "math" && (
                  <RyanLine
                    text={verdictLine}
                    active={isLast && feasPhase === "verdict"}
                    onDone={
                      isLast && feasPhase === "verdict"
                        ? () => {
                            if (baseOk) { advanceStep(); return; }
                            const first = feasBuildRound(feasLevers);
                            if (first) { setFeasRounds([first]); setFeasPhase("negotiate"); } else advanceStep();
                          }
                        : undefined
                    }
                  />
                )}
                {feasRounds.map((round, rIdx) => {
                  const isCurrent = rIdx === feasRounds.length - 1 && feasPhase === "negotiate";
                  return (
                    <div key={`feas-round-${rIdx}`}>
                      <RyanLine
                        text={round.prompt}
                        active={isLast && isCurrent && !round.picked && !feasPromptStreamed[rIdx]}
                        onDone={isLast && isCurrent && !feasPromptStreamed[rIdx] ? () => setFeasPromptStreamed((m) => ({ ...m, [rIdx]: true })) : undefined}
                      />
                      {/* Options land only once the prompt has finished typing. */}
                      {!round.picked && isLast && isCurrent && feasPromptStreamed[rIdx] && (
                        <InlineOptions options={round.options} examples={false} onPick={handleFeasibilityPick} />
                      )}
                      {round.picked && (
                        <div className="flex justify-end animate-chat-message-in" style={{ marginTop: SPACE_M }}>
                          <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
                            <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{round.picked}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {feasPhase === "resolved" && feasResolution && (
                  // Cosimo pauses here for consent — the "Build my plan" followup below — instead of
                  // rolling straight into the build (per review). Others advance as before.
                  <RyanLine
                    text={feasResolution}
                    active={isLast && (!cosimoChat || !planConsentStreamed)}
                    onDone={isLast ? (cosimoChat ? () => setPlanConsentStreamed(true) : advanceStep) : undefined}
                  />
                )}
                {cosimoChat && feasPhase === "resolved" && planConsentStreamed && !planConsent && isLast && (
                  <InlineOptions
                    options={["Build my plan"]}
                    icons={["🚀"]}
                    onPick={() => {
                      setPlanConsent(true);
                      setUserActionCount((c) => c + 1);
                      advanceStep();
                    }}
                  />
                )}
                {cosimoChat && planConsent && (
                  <div ref={userBubbleRef} className="flex justify-end animate-chat-message-in" style={{ marginTop: SPACE_M }}>
                    <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
                      <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>Build my plan</p>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          if (step.kind === "bot") {
            const shouldAutoAdvance = isLast;
            const isPostWrapped = WRAPPED_STEP_INDEX >= 0 && i === POST_WRAPPED_STEP_INDEX;
            const ref = isPostWrapped
              ? postWrappedRef
              : (isLast && (conversational || stepIndex > PREFERENCES_STEP_INDEX))
                ? walkthroughBotRef
                : undefined;
            // Fixed-tenure goals skip the tier picker, so the "Now the pace.
            // Pick one." intro makes no sense — swap in the computed monthly. (msgVoice is hoisted to
            // the top of the map so every branch, not just this one, freezes past messages.)
            const botText = (
              i === LADDER_INTRO_STEP_INDEX && hasFixedTenure
                ? (msgVoice === "byron"
                    ? `Fixed target, fixed deadline — that's ${formatINR(savingsAmount)}/month, no haggling. Here's the damage.`
                    // effGoalMonths: a negotiated deadline extension must read here too, not the original pick.
                    : `To hit ${potLabel} in ${effGoalMonths} months, you'll need about ${formatINR(savingsAmount)}/month. Here's how that lands.`)
                : cosimoChat && step.dv === BETA_GOAL_INTRO
                  // Canon 882:5873: the goal ask is ONE plain question line — the icon-row picker
                  // below it carries the options.
                  ? "What do you want to save towards?"
                  : step.dv === BETA_BYRON_INTRO
                  // The Byron intro is RYAN introducing Byron, so it's always Ryan's voice — even after
                  // the "Meet Byron" tap flips the chat to Byron (which froze this line to the byron
                  // variant and re-wrote it to a redundant "I'm Byron, the one who skips the sugar",
                  // re-introducing him right after Ryan just did). Skip path swaps the sync reference.
                  ? (aaSkipped ? BETA_BYRON_INTRO_SKIP.ryan : BETA_BYRON_INTRO.ryan)
                  : (step.dv === BETA_AA_INTRO && goalDeclined)
                    // Decide-later: no goal set, so don't promise a "sharper goal".
                    ? BETA_AA_INTRO_NO_GOAL[msgVoice]
                    : (step.dv === BETA_AA_INTRO && goalTypeId === "save-more")
                      // Save-more: no concrete target to "sharpen" — acknowledge the choice instead.
                      ? BETA_AA_INTRO_SAVE_MORE[msgVoice]
                      : step.dv[msgVoice]
            ).replace(/\{goal\}/g, goalNoun);
            // Byron takeover choreography:
            //  • the intro line lingers, then the chat cross-fades to Byron's voice and lands on his roast
            //  • the roast holds, then the flow carries on STILL IN BYRON'S VOICE — the user switches
            //    back to Ryan manually via the toggle up top (skip jumps straight to the playground)
            const isByronIntro = step.dv === BETA_BYRON_INTRO;
            const isByronRoast = step.dv === BETA_BYRON_FIRST_ROAST;
            const crossFade = (run: () => void) => {
              // The content opacity transition is 500ms, so swap voice + step only once it's fully faded
              // out (was 200ms — the swap happened mid-fade and read as a jump). Then fade back in.
              setContentVisible(false);
              window.setTimeout(() => {
                run();
                window.setTimeout(() => setContentVisible(true), 80);
              }, 480);
            };
            let onBotDone: (() => void) | undefined;
            if (!shouldAutoAdvance) {
              onBotDone = undefined;
            } else if (isByronIntro) {
              // Don't auto-switch (too quick to read) — surface the "Meet Byron" pill below and let the
              // user trigger the takeover when they're ready.
              onBotDone = () => setByronIntroReady(true);
            } else if (isByronRoast) {
              // Stay in Byron's voice and carry on — no auto cross-fade back. The user returns
              // to Ryan only by tapping the toggle. Subsequent dual-voice lines render as Byron.
              onBotDone = () => window.setTimeout(() => {
                if (aaSkipped && PLAYGROUND_STEP_INDEX >= 0) setStepIndex(PLAYGROUND_STEP_INDEX);
                else advanceStep();
              }, 1800);
            } else {
              onBotDone = advanceStep;
            }
            // Conversational: the named-2x beat rendered inside the goal-echo card already — the
            // standalone line would repeat it (the skip effect advances past this step).
            if (conversational && hasFixedTenure && i === NAMED_2X_STEP_INDEX) return null;
            return (
              // Newly-landing bot lines get the same soft entrance as every other
              // chat block — they used to pop in with no transition (R14).
              <div key={`bot-${i}`} ref={ref} className={isLast ? "animate-chat-message-in" : undefined}>
                {cosimoChat && step.dv === COSIMO_GREETING_1 ? (
                  // The Cosimo greeting is a HEADING (Rubik Med 24/32) with the avatar image inline —
                  // not a body line (canon 796:6252).
                  <CosimoGreetingLine text={botText} active={isLast} onDone={onBotDone} />
                ) : (
                  <RyanLine
                    text={botText}
                    active={isLast}
                    onDone={onBotDone}
                  />
                )}
                {isByronIntro && byronIntroReady && !byronMet && isLast && (
                  <div className="flex animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                    <button
                      type="button"
                      onClick={() => {
                        setByronIntroReady(false);
                        setByronMet(true); // post the user's "Meet Byron" bubble before his roast lands
                        setUserActionCount((c) => c + 1); // snap that bubble up so it leads, roast reads below it
                        // Choreography: Byron reveals big in the centre, holds, then flies up into the
                        // app bar. The chat cross-fades to his roast + the app bar swaps to Byron as the
                        // flying avatar arrives up top, so it reads as one continuous handoff (no flip).
                        setByronReveal("center");
                        requestAnimationFrame(() => requestAnimationFrame(() => setByronRevealIn(true)));
                        // Hold the centre reveal ~1.6s so his intro line reads, THEN glide him up.
                        window.setTimeout(() => setByronReveal("flyup"), 1600);
                        window.setTimeout(() => {
                          crossFade(() => {
                            setVoice("byron");
                            setAppBarMode("toggle"); // Byron lands up top just as the flying avatar settles
                            if (BYRON_ROAST_STEP_INDEX >= 0) setStepIndex(BYRON_ROAST_STEP_INDEX);
                          });
                        }, 1760);
                        window.setTimeout(() => { setByronReveal("done"); setByronRevealIn(false); }, 2560);
                      }}
                      aria-label="Meet Byron"
                      className="transition-transform active:scale-[0.98]"
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: SPACE_L, borderRadius: RADIUS_M, border: "var(--dls-card-border)", backgroundColor: BG_CARD, boxShadow: ELEVATION_CARD, cursor: "pointer" }}
                    >
                      {/* Clean, minimal — just Byron (like the end key card). The line above sets it up. */}
                      <img src="/characters/byron.svg" alt="" aria-hidden="true" width={96} height={96} draggable={false} style={{ display: "block" }} />
                    </button>
                  </div>
                )}
                {isByronIntro && byronMet && (
                  <div ref={userBubbleRef} className="flex justify-end animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                    <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
                      <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>Meet Byron</p>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          if (step.kind === "goal-echo") {
            // Echo the named goal and do the math in public. The monthly lands as a
            // typographic moment (BigNumber), not buried in the sentence. Goals without a
            // fixed tenure (emergency / save-more) have no honest monthly yet: text only.
            const echoText =
              requiredMonthly != null && goalMonthName
                ? msgVoice === "byron"
                  ? `${goalShort} by ${goalMonthName}. Fine. That's`
                  : `${goalShort} in ${goalMonthName}, love it. That's`
                : msgVoice === "byron"
                  ? `${potLabel || "Saving more"}. Sensible. We'll set the pace in a bit.`
                  : `${potLabel || "Saving more"}, love it. We'll set the pace in a bit.`;
            // Conversational: the WHOLE beat lives in one card — the lead-in line, the monthly, and
            // the named-2x stat visual (the standalone lines above/after the card read as clutter).
            if (conversational && requiredMonthly != null && goalMonthName) {
              return (
                <div key={`goal-echo-${i}`}>
                  <BigNumber
                    lead={echoText}
                    value={formatINR(requiredMonthly)}
                    suffix="/mo"
                    countTo={isLast ? requiredMonthly : null}
                    onDone={() => { if (isLast) window.setTimeout(advanceStep, 420); }}
                    footer={
                      <div style={{ marginTop: SPACE_M, paddingTop: SPACE_M, borderTop: `1px solid ${OUTLINE_SUBTLE}` }}>
                        {/* Caption leads, THEN the chart (the line reads as the takeaway, the graph as proof). */}
                        <p style={{ ...typography.bodySmall, color: TEXT_SECONDARY, margin: `0 0 ${SPACE_M}px` }}>
                          Named goals get funded about 2x more often.
                        </p>
                        {/* Two savings curves — a named goal compounds ~2x faster than aimless saving. */}
                        <svg viewBox="0 0 260 72" style={{ display: "block", width: "100%", height: "auto" }} aria-hidden="true">
                          <path d="M4 66 C 80 62, 180 56, 252 46" stroke={OUTLINE_BOLD} strokeWidth="2.5" fill="none" strokeLinecap="round" />
                          <path d="M4 66 C 80 52, 170 30, 252 8" stroke={MAIN_PRIMARY} strokeWidth="2.5" fill="none" strokeLinecap="round" />
                          <circle cx="252" cy="46" r="3.5" fill={OUTLINE_BOLD} />
                          <circle cx="252" cy="8" r="3.5" fill={MAIN_PRIMARY} />
                        </svg>
                        <div style={{ display: "flex", gap: 16, marginTop: SPACE_XS }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: MAIN_PRIMARY, flexShrink: 0 }} />
                            <span style={{ ...typography.caption, color: TEXT_PRIMARY, fontWeight: 600 }}>named goal · 2x</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: OUTLINE_BOLD, flexShrink: 0 }} />
                            <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>just saving</span>
                          </div>
                        </div>
                      </div>
                    }
                  />
                </div>
              );
            }
            return (
              <div key={`goal-echo-${i}`}>
                <RyanLine
                  text={echoText}
                  active={isLast && !echoLineDone}
                  onDone={() => {
                    if (requiredMonthly != null && goalMonthName) setEchoLineDone(true);
                    else advanceStep();
                  }}
                />
                {requiredMonthly != null && goalMonthName && (echoLineDone || !isLast) && (
                  <BigNumber
                    value={formatINR(requiredMonthly)}
                    suffix="/mo"
                    countTo={isLast ? requiredMonthly : null}
                    onDone={() => { if (isLast) window.setTimeout(advanceStep, 420); }}
                  />
                )}
              </div>
            );
          }

          if (step.kind === "belief-q") {
            // The pre-Byron run: Ryan asks how the user believes their money behaves, the
            // answer echoes as a sent bubble, and the reaction meets it with their actual
            // data (gap math on Q1, the spend-day pattern on Q2, the spring on Q3).
            const q = BELIEF_QUESTIONS[step.qIndex];
            const answerId = beliefAnswers[step.qIndex];
            const answerLabel = q.options.find((o) => o.id === answerId)?.label;
            const reaction = answerId
              ? step.qIndex === 0
                ? beliefQ1Reaction(answerId, requiredMonthly ?? savingsAmount, formatINR)
                : step.qIndex === 1
                  ? BELIEF_Q2_REACTIONS[answerId]
                  : beliefQ3Reaction(answerId, goalShort, beliefGapZero)
              : null;
            const streamed = !!beliefStreamed[step.qIndex];
            return (
              <div key={`belief-${i}`}>
                <RyanLine
                  text={q.text[msgVoice]}
                  active={isLast && !streamed && !answerId}
                  onDone={() => setBeliefStreamed((m) => ({ ...m, [step.qIndex]: true }))}
                />
                {isLast && streamed && !answerId && (conversational ? (
                  // Conversational: options are part of the message (typed or tapped-as-text).
                  <InlineOptions
                    options={q.options.map((o) => o.label)}
                    onPick={(idx) => {
                      setBeliefEchoes((m) => ({ ...m, [step.qIndex]: q.options[idx].label }));
                      setBeliefAnswers((m) => ({ ...m, [step.qIndex]: q.options[idx].id }));
                      setUserActionCount((c) => c + 1);
                    }}
                  />
                ) : (
                  <div className="flex flex-wrap gap-3 animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                    {q.options.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setBeliefAnswers((m) => ({ ...m, [step.qIndex]: opt.id }));
                          setUserActionCount((c) => c + 1);
                        }}
                        className="transition-transform active:scale-[0.97]"
                        style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, backgroundColor: BG_SECONDARY, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_CIRCLE, padding: `${SPACE_XS}px ${SPACE_M}px`, cursor: "pointer" }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                ))}
                {answerId && (
                  <div ref={isLast ? userBubbleRef : undefined} className="flex justify-end animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                    <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
                      <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{conversational ? (beliefEchoes[step.qIndex] ?? answerLabel) : answerLabel}</p>
                    </div>
                  </div>
                )}
                {answerId && reaction && (
                  <RyanLine text={reaction[msgVoice]} active={isLast} onDone={isLast ? advanceStep : undefined} />
                )}
              </div>
            );
          }

          if (step.kind === "aa-chips") {
            if (aaChipPicked) {
              return (
                <div key={`aa-chips-${i}`}>
                  <div ref={userBubbleRef} className="flex justify-end animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                    <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
                      <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>
                        {aaChipPicked === "skip" ? "Skip for now" : aaChipPicked === "autosave" ? "Just auto-save" : "Connect other accounts"}
                      </p>
                    </div>
                  </div>
                  {aaDismissed && !aaFlowOpen && (
                    <div>
                      <RyanLine
                        text={AA_DISMISS_NUDGE[msgVoice]}
                        active={isLast && aaDismissed}
                        onDone={() => setAaNudgeStreamed(true)}
                      />
                      {aaNudgeStreamed && (
                      <div className="flex flex-wrap gap-3 animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                        <button
                          type="button"
                          onClick={() => {
                            setAaDismissed(false);
                            setAaNudgeStreamed(false);
                            setAaFlowOpen(true);
                          }}
                          className="transition-transform active:scale-[0.97]"
                          style={{
                            ...typography.buttonSmall,
                            color: TEXT_PRIMARY,
                            backgroundColor: BG_SECONDARY,
                            border: `1px solid ${OUTLINE_SUBTLE}`,
                            borderRadius: RADIUS_CIRCLE,
                            padding: `${SPACE_XS}px ${SPACE_M}px`,
                            cursor: "pointer",
                          }}
                        >
                          Connect other accounts
                        </button>
                      </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div key={`aa-chips-${i}`} className="flex flex-col animate-chat-message-in" style={{ marginTop: SPACE_M, gap: SPACE_L }}>
                {/* Beta: the "+10%" benefit is a stat card now (visualised), not buried in the AA-intro
                    sentence. Skipped on the decide-later branch (no goal set → no promise to make). */}
                {betaIntentFirst && !goalDeclined && <LinkAccountsCard goalLabel={goalLabel} />}
                {/* Beta FORCES connect — Connect is the only action (no maybe-later / auto-save). Non-beta
                    optional AA still gets a skip. */}
                <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAaChipPicked("connect");
                    setUserActionCount((c) => c + 1);
                    setAaFlowOpen(true);
                  }}
                  className="transition-transform active:scale-[0.97]"
                  style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, backgroundColor: BG_SECONDARY, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_CIRCLE, padding: `${SPACE_XS}px ${SPACE_M}px`, cursor: "pointer" }}
                >
                  Connect other accounts
                </button>
                {aaMode === "optional" && !betaIntentFirst && (
                  <button
                    type="button"
                    onClick={() => {
                      setAaChipPicked("skip");
                      setAaSkipped(true);
                      setUserActionCount((c) => c + 1);
                      // Land on the Byron-intro beat so it types out and introduces Byron
                      // even though no accounts were linked; it then auto-advances to the
                      // playground (the AA_LINKED_BUBBLE + PLAYGROUND_INTRO_BUBBLES lines
                      // stay filtered out because aaSkipped is true).
                      if (BYRON_INTRO_STEP_INDEX >= 0) {
                        setStepIndex(BYRON_INTRO_STEP_INDEX);
                      } else if (PLAYGROUND_STEP_INDEX >= 0) {
                        setStepIndex(PLAYGROUND_STEP_INDEX);
                      } else {
                        setStepIndex((idx) => Math.min(idx + 1, LAST_STEP_INDEX));
                      }
                    }}
                    className="transition-transform active:scale-[0.97]"
                    style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, backgroundColor: BG_SECONDARY, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_CIRCLE, padding: `${SPACE_XS}px ${SPACE_M}px`, cursor: "pointer" }}
                  >
                    Skip for now
                  </button>
                )}
                </div>
              </div>
            );
          }

          if (step.kind === "wrapped") {
            return (
              <div key={`wrapped-${i}`} ref={wrappedCardRef} style={{ marginTop: SPACE_M }} className="animate-chat-message-in">
                <WrappedCard revealedCount={revealedCount} onOpen={openStory} />
              </div>
            );
          }

          if (step.kind === "preferences") {
            // Conversational (pitch): the whole goal questionnaire runs INSIDE the chat — each question
            // is Ryan's message with numbered options (typed 1/2/3, option text, or free-form via the
            // chat input), each answer echoes as a user bubble. The goal-intro line above already asked
            // question one, so the first question shows options only (no re-ask).
            if (conversational) {
              return (
                <div key={`pref-${i}`}>
                  {prefQuestions.map((q, k) => {
                    const aId = prefAnswers[q.id];
                    const aLabel = q.options.find((o) => o.id === aId)?.label ?? aId;
                    const isCurrent = isLast && k === prefQuizIndex && !aId;
                    if (!aId && !isCurrent) return null;
                    const asked = k === 0 || prefQStreamed[q.id] || !!aId;
                    return (
                      <div key={q.id} ref={isCurrent ? prefQuestionRef : undefined}>
                        {k > 0 && (
                          <RyanLine
                            text={q.text}
                            active={isCurrent && !prefQStreamed[q.id]}
                            onDone={() => setPrefQStreamed((m) => ({ ...m, [q.id]: true }))}
                          />
                        )}
                        {isCurrent && asked && q.options.length > 0 && (
                          cosimoChat ? (
                            // Canon 882:5873: EVERY goal question renders as hairline rows — the same
                            // suggestion-row pattern as the explore entry, not a numbered list. The
                            // goal-type rows carry emoji icons; the rest are label-only.
                            <div className="flex flex-col animate-chat-message-in" style={{ marginTop: SPACE_L, gap: SPACE_M }}>
                              {q.options.map((o, idx, arr) => (
                                <Fragment key={o.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPrefEchoes((m) => ({ ...m, [q.id]: o.label }));
                                      handlePrefSelect(q.id, o);
                                    }}
                                    className="transition-transform active:scale-[0.99]"
                                    style={{ display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                                  >
                                    {q.id === "goal-type" && (
                                      <span aria-hidden style={{ fontSize: 20, lineHeight: "28px", width: 28, textAlign: "center", flexShrink: 0 }}>{COSIMO_GOAL_ICONS[o.id] ?? "🎯"}</span>
                                    )}
                                    <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{o.label}</span>
                                  </button>
                                  {idx < arr.length - 1 && <div aria-hidden style={{ height: 1, backgroundColor: OUTLINE_SUBTLE, width: "100%" }} />}
                                </Fragment>
                              ))}
                            </div>
                          ) : (
                          <InlineOptions
                            options={q.options.map((o) => o.label)}
                            onPick={(idx) => {
                              setPrefEchoes((m) => ({ ...m, [q.id]: q.options[idx].label }));
                              handlePrefSelect(q.id, q.options[idx]);
                            }}
                          />
                          )
                        )}
                        {aId && (
                          <div
                            ref={isCurrent || k === prefQuizIndex - 1 ? userBubbleRef : undefined}
                            className="flex justify-end animate-chat-message-in"
                            style={{ marginTop: SPACE_L }}
                          >
                            <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
                              {/* Verbatim: typed answers echo exactly as typed; taps echo the label. */}
                              <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{prefEchoes[q.id] ?? aLabel}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            }
            // Beta (Claude-style): every goal question is asked in the docked bottom sheet; each answer
            // echoes here as a right-aligned USER bubble the moment it's picked/typed, so the answers are
            // showcased upfront in the chat while the sheet keeps asking. Non-beta keeps the summary bubble.
            if (betaIntentFirst && (prefQuizOpen || Object.keys(prefAnswers).length > 0)) {
              const answered = prefQuestions.filter((q) => !!prefAnswers[q.id]);
              return (
                <div key={`pref-${i}`}>
                  {answered.map((q, k) => {
                    const a = prefAnswers[q.id];
                    const opt = q.options.find((o) => o.id === a);
                    return (
                      <div
                        key={q.id}
                        ref={k === answered.length - 1 ? userBubbleRef : undefined}
                        className="flex justify-end animate-chat-message-in"
                        style={{ marginTop: SPACE_L }}
                      >
                        <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
                          <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{opt ? opt.label : a}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }
            // Non-beta: single summary bubble once the quiz is answered.
            if (!betaIntentFirst && Object.keys(prefAnswers).length > 0 && !prefQuizOpen) {
              return (
                <div
                  ref={userBubbleRef}
                  key={`pref-${i}`}
                  className="flex justify-end animate-chat-message-in"
                  style={{ marginTop: SPACE_L }}
                >
                  <div
                    className="max-w-[75%] rounded-[16px] rounded-tr-lg"
                    style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}
                  >
                    <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{prefSummary}</p>
                  </div>
                </div>
              );
            }
            // Dismissed - show Ryan nudge + reopen button
            if (prefDismissed && !prefQuizOpen) {
              return (
                <div key={`pref-dismissed-${i}`}>
                  <RyanLine
                    text={PREF_DISMISS_NUDGE[msgVoice]}
                    active={isLast && prefDismissed}
                    onDone={() => setPrefNudgeStreamed(true)}
                  />
                  {prefNudgeStreamed && (
                  <div className="flex flex-wrap gap-3 animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPrefDismissed(false);
                        setPrefNudgeStreamed(false);
                        setPrefQuizOpen(true);
                      }}
                      className="transition-transform active:scale-[0.97]"
                      style={{
                        ...typography.buttonSmall,
                        color: TEXT_PRIMARY,
                        backgroundColor: BG_SECONDARY,
                        border: `1px solid ${OUTLINE_SUBTLE}`,
                        borderRadius: RADIUS_CIRCLE,
                        padding: `${SPACE_XS}px ${SPACE_M}px`,
                        cursor: "pointer",
                      }}
                    >
                      Set a goal
                    </button>
                  </div>
                  )}
                </div>
              );
            }
            return null;
          }

          if (step.kind === "playground" && aaConnected) {
            // Jun 11 terminal connect path: a background sync cruncher pinned at
            // the top, then the salutation, then a 3-tile spend mosaic. The
            // cruncher is dismissable but the sync keeps running; once it
            // finishes, Ryan posts a completion line. Tapping a tile reveals a
            // viz inline, reusing the skip path's reveal machinery.
            return (
              <div key={`connect-mosaic-${i}`} ref={connectTopRef}>
                {/* The connect cruncher is NOT inline here — it floats as an absolute overlay
                    (rendered in the chat-overlay block below, outside the scroller) so the mosaic
                    scrolls under it. topClearance reserves room so this salutation clears it. */}
                <div ref={skipResponseRef} style={{ marginTop: SPACE_L }}>
                  <RyanLine
                    text={CONNECT_SALUTATION[msgVoice]}
                    active={isLast && skipReveals.length === 0 && !connectSyncDone}
                    onDone={() => setSkipResponseStreamed(true)}
                  />
                </div>
                {skipResponseStreamed && skipReveals.length === 0 && (
                  <div className="animate-chat-message-in" style={{ marginTop: SPACE_L, display: "flex", flexDirection: "column", gap: 12 }}>
                    {SKIP_SPEND_TILES.map((t) => (
                      <SpendListCard key={t.chipId} action={t} onSelect={() => pickSpendTile(t.chipId)} />
                    ))}
                  </div>
                )}
                {skipReveals.map((chipId, j) => {
                  const reveal = PLAYGROUND_REVEALS[chipId];
                  if (!reveal) return null;
                  const tile = SKIP_SPEND_TILES.find((t) => t.chipId === chipId);
                  const isLastReveal = j === skipReveals.length - 1;
                  return (
                    <div key={`connect-reveal-${chipId}-${j}`}>
                      <div
                        ref={isLastReveal ? userBubbleRef : undefined}
                        className="flex justify-end animate-chat-message-in"
                        style={{ marginTop: SPACE_L }}
                      >
                        <div
                          className="max-w-[75%] rounded-[16px] rounded-tr-lg"
                          style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}
                        >
                          <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{tile?.title}</p>
                        </div>
                      </div>
                      <div className="animate-chat-message-in" style={{ marginTop: SPACE_M }}>
                        <ChatCard
                          card={reveal.card}
                          onOpenList={reveal.card.type === "transaction-table" ? () => openBigSpends(reveal.card as { title: string; transactions: { date: string; merchant: string; amount: number; category: string }[] }) : undefined}
                        />
                        <RyanLine
                          text={reveal.quip[msgVoice]}
                          active={isLast && isLastReveal && !connectSyncDone}
                          onDone={isLastReveal ? () => setSkipRevealDone(true) : undefined}
                        />
                      </div>
                    </div>
                  );
                })}
                {/* The connect mosaic is jun-11's terminal end. New-user only reaches it via a skip
                    seed (normal flow never sets aaConnected — it advances past, see handleAAComplete),
                    so for new-user offer the goal-creation CTA once parsing is done — otherwise these
                    states dead-end instead of proceeding to goal creation. */}
                {!terminalAtAa && connectSyncDone && (
                  <div className="animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                    <RyanLine text={PLAYGROUND_GOAL_NUDGE[msgVoice]} active={false} />
                    <div className="flex flex-wrap gap-3" style={{ marginTop: SPACE_L }}>
                      <button
                        type="button"
                        onClick={handlePlaygroundAcceptGoal}
                        className="transition-transform active:scale-[0.97]"
                        style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, backgroundColor: BG_SECONDARY, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_CIRCLE, padding: `${SPACE_XS}px ${SPACE_M}px`, cursor: "pointer" }}
                      >
                        Set up your goal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          if (step.kind === "playground" && aaSkipped) {
            // Jun 11 terminal skip path: salutation + a spend-preview mosaic.
            // Tapping a spend tile reveals an existing viz inline (reusing
            // PLAYGROUND_REVEALS); the mosaic stays visible so the user can
            // sample all three. The connect tile reopens the AA flow.
            return (
              <div key={`skip-mosaic-${i}`}>
                <div ref={skipResponseRef}>
                  <RyanLine
                    text="No problem, you can link them later. Here are a few things you can try in the meantime."
                    active={isLast && skipReveals.length === 0}
                    onDone={() => setSkipResponseStreamed(true)}
                  />
                </div>
                {skipResponseStreamed && skipReveals.length === 0 && (
                  <div className="animate-chat-message-in" style={{ marginTop: SPACE_L, display: "flex", flexDirection: "column", gap: 12 }}>
                    {SKIP_SPEND_TILES.map((t) => (
                      <SpendListCard key={t.chipId} action={t} onSelect={() => pickSpendTile(t.chipId)} />
                    ))}
                    <SpendListCard action={SKIP_CONNECT_TILE} onSelect={() => setAaFlowOpen(true)} />
                  </div>
                )}
                {skipReveals.map((chipId, j) => {
                  const reveal = PLAYGROUND_REVEALS[chipId];
                  if (!reveal) return null;
                  const tile = SKIP_SPEND_TILES.find((t) => t.chipId === chipId);
                  const isLastReveal = j === skipReveals.length - 1;
                  return (
                    <div key={`skip-reveal-${chipId}-${j}`}>
                      <div
                        ref={isLastReveal ? userBubbleRef : undefined}
                        className="flex justify-end animate-chat-message-in"
                        style={{ marginTop: SPACE_L }}
                      >
                        <div
                          className="max-w-[75%] rounded-[16px] rounded-tr-lg"
                          style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}
                        >
                          <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{tile?.title}</p>
                        </div>
                      </div>
                      <div className="animate-chat-message-in" style={{ marginTop: SPACE_M }}>
                        <ChatCard
                          card={reveal.card}
                          onOpenList={reveal.card.type === "transaction-table" ? () => openBigSpends(reveal.card as { title: string; transactions: { date: string; merchant: string; amount: number; category: string }[] }) : undefined}
                        />
                        <RyanLine
                          text={reveal.quip[msgVoice]}
                          active={isLast && isLastReveal}
                          onDone={isLastReveal ? () => setSkipRevealDone(true) : undefined}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }

          if (step.kind === "playground") {
            const roastCap = playgroundRoastIndex >= MAX_BYRON_ROASTS;
            const visibleChips = PLAYGROUND_CHIPS.filter((c) => {
              // Byron's roast is gated by AA: with byronGatedByAa it only shows once connected, so it
              // never leaks into the jun-11 skip/terminal path (Byron isn't introduced there).
              if (c.id === "roast-byron") return !roastCap && (byronGatedByAa ? aaConnected : true);
              // Beta surfaces the explore suggestions immediately (the "want to see what I can do?"
              // moment) rather than gating them behind a first Byron roast like the classic flow.
              return (betaIntentFirst || playgroundRoastFiredOnce) && !chipsConsumed.has(c.id);
            });
            const lastEventIdx = playgroundEvents.length - 1;
            // Find the index of the most recent user-tap event so we can attach userBubbleRef there
            let lastUserTapIdx = -1;
            for (let k = lastEventIdx; k >= 0; k--) {
              if (playgroundEvents[k].kind === "user-tap") { lastUserTapIdx = k; break; }
            }
            const goalAcceptedOrAnswered = prefQuizOpen || Object.keys(prefAnswers).length > 0;
            const showChips =
              !playgroundBusy &&
              !buildPlanPicked &&
              !playgroundNudgeShown &&
              visibleChips.length > 0 &&
              // Beta banks the goal BEFORE the playground, so goalAcceptedOrAnswered is always true
              // here — don't let it suppress the explore chips (that was the "Meanwhile…" dead end).
              (betaIntentFirst || !goalAcceptedOrAnswered);
            const showPostNudgeChips =
              !playgroundBusy &&
              !buildPlanPicked &&
              playgroundGoalNudgeDone &&
              // Same beta carve-out as showChips: the goal's already banked, so don't let
              // goalAcceptedOrAnswered suppress the post-line explore chips + "Build my plan"
              // (that's why suggestions stopped after the "ready to turn it into a plan?" line).
              (betaIntentFirst || !goalAcceptedOrAnswered);
            return (
              <div key={`playground-${i}`}>
                {playgroundEvents.map((evt, j) => {
                  const isLastEvent = isLast && j === lastEventIdx;
                  if (evt.kind === "user-tap") {
                    return (
                      <div
                        ref={j === lastUserTapIdx ? userBubbleRef : undefined}
                        key={`pg-${j}`}
                        className="flex justify-end animate-chat-message-in"
                        style={{ marginTop: SPACE_L }}
                      >
                        <div
                          className="max-w-[75%] rounded-[16px] rounded-tr-lg"
                          style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}
                        >
                          <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{withGoal(evt.label)}</p>
                        </div>
                      </div>
                    );
                  }
                  if (evt.kind === "reveal") {
                    const reveal = PLAYGROUND_REVEALS[evt.chipId];
                    if (!reveal) return null;
                    // Historical reveals always show their quip (instantly via
                    // RyanLine with active=false). The current reveal waits
                    // for revealQuipReady so the user can read the card first.
                    const showQuip = !isLastEvent || revealQuipReady;
                    return (
                      <div key={`pg-${j}`} className="animate-chat-message-in" style={{ marginTop: SPACE_M }}>
                        <ChatCard
                          card={reveal.card}
                          onOpenList={reveal.card.type === "transaction-table" ? () => openBigSpends(reveal.card as { title: string; transactions: { date: string; merchant: string; amount: number; category: string }[] }) : undefined}
                        />
                        {showQuip && (
                          <RyanLine
                            text={reveal.quip[msgVoice]}
                            active={isLastEvent}
                            onDone={isLastEvent ? handlePlaygroundRevealDone : undefined}
                          />
                        )}
                      </div>
                    );
                  }
                  if (evt.kind === "byron-roast") {
                    return (
                      <div key={`pg-${j}`}>
                        <RyanLine
                          text={evt.text}
                          active={isLastEvent}
                          onDone={isLastEvent ? () => handlePlaygroundByronRoastDone(evt.isFirst) : undefined}
                        />
                      </div>
                    );
                  }
                  if (evt.kind === "byron-cap-nudge") {
                    return (
                      <div key={`pg-${j}`}>
                        <RyanLine
                          text={PLAYGROUND_BYRON_CAP_NUDGE[msgVoice]}
                          active={isLastEvent}
                          onDone={isLastEvent ? handlePlaygroundByronCapNudgeDone : undefined}
                        />
                      </div>
                    );
                  }
                  if (evt.kind === "ryan-handoff") {
                    return (
                      <div key={`pg-${j}`} ref={isLastEvent ? ryanHandoffRef : undefined}>
                        <RyanLine
                          text={PLAYGROUND_RYAN_HANDOFF.ryan}
                          active={isLastEvent}
                          onDone={isLastEvent ? handlePlaygroundRyanHandoffDone : undefined}
                        />
                      </div>
                    );
                  }
                  if (evt.kind === "goal-nudge") {
                    return (
                      <div key={`pg-${j}`}>
                        <RyanLine
                          // Beta banked the goal before AA, so this isn't a goal nudge — it's the
                          // "seen enough, go build the plan" beat.
                          text={betaIntentFirst ? BETA_PLAYGROUND_READY[msgVoice] : PLAYGROUND_GOAL_NUDGE[msgVoice]}
                          active={isLastEvent}
                          onDone={isLastEvent ? handlePlaygroundGoalNudgeDone : undefined}
                        />
                      </div>
                    );
                  }
                  if (evt.kind === "switch-intro") {
                    // The intro speaks in the voice that was picked at switch time (evt.text is
                    // already that voice's line) and typewrites when it's the newest event.
                    return (
                      <div key={`pg-${j}`}>
                        <RyanLine
                          text={evt.text}
                          active={isLastEvent}
                          onDone={isLastEvent ? revealLatest : undefined}
                        />
                      </div>
                    );
                  }
                  return null;
                })}

                {/* Cosimo pitch: the explore entry is 3 suggestion ROWS — 28px icon + question,
                    split by hairlines (canon 796:6252) — not pill chips or one-at-a-time offers.
                    Tapping one echoes the question and plays its reveal; consumed rows drop out.
                    Only while explore is the ACTIVE step — the moment the flow moves on (Start →
                    goal questions typing), the suggestions leave with it. */}
                {cosimoChat && isLast && !playgroundBusy && !buildPlanPicked && !playgroundNudgeShown && (
                  <ExploreRowsGuard />
                )}
                {cosimoChat && isLast && !playgroundBusy && !buildPlanPicked && !playgroundNudgeShown && (
                  <div className="flex flex-col animate-chat-message-in" style={{ marginTop: 40, gap: SPACE_M }}>
                    {COSIMO_EXPLORE_ROWS.filter((r) => !chipsConsumed.has(r.id)).map((r, k, arr) => (
                      <Fragment key={r.id}>
                        <button
                          type="button"
                          onClick={() => handlePlaygroundChip(r.id, r.label)}
                          className="transition-transform active:scale-[0.99]"
                          style={{ display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                        >
                          <img src={r.icon} alt="" aria-hidden width={28} height={28} draggable={false} style={{ flexShrink: 0 }} />
                          <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{r.label}</span>
                        </button>
                        {k < arr.length - 1 && <div aria-hidden style={{ height: 1, backgroundColor: OUTLINE_SUBTLE, width: "100%" }} />}
                      </Fragment>
                    ))}
                  </div>
                )}

                {/* Conversational: no pill rows — Ryan offers ONE reveal at a time as a question in the
                    stream. "yes" plays it, "no" moves on; typing a reveal by name/number also works.
                    (Cosimo renders the suggestion rows above instead.) */}
                {conversational && !cosimoChat && !playgroundBusy && !buildPlanPicked && !playgroundNudgeShown && conversationalOffer && (
                  <RyanLine
                    key={`offer-${conversationalOffer.id}`}
                    text={withGoal(CONVO_OFFER_TEXTS[conversationalOffer.id] ?? conversationalOffer.label)}
                    active={isLast}
                  />
                )}

                {showChips && !conversational && (
                  <div className="flex flex-wrap gap-3 animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                    {visibleChips.map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => handlePlaygroundChip(chip.id)}
                        className="transition-transform active:scale-[0.97]"
                        style={{
                          ...typography.buttonSmall,
                          color: TEXT_PRIMARY,
                          backgroundColor: BG_SECONDARY,
                          border: `1px solid ${OUTLINE_SUBTLE}`,
                          borderRadius: RADIUS_CIRCLE,
                          padding: `${SPACE_XS}px ${SPACE_M}px`,
                          cursor: "pointer",
                        }}
                      >
                        {withGoal(chip.label)}
                      </button>
                    ))}
                  </div>
                )}

                {/* Beta/pitch post-nudge: re-tappable gut-checks INLINE (no docked sheet — it ate chat
                    space). The "Build my goal plan" CTA is inline for beta; on pitch it lives in the
                    cruncher card instead, so it's suppressed here. */}
                {showPostNudgeChips && betaIntentFirst && !conversational && (
                  <div ref={userBubbleRef} className="flex flex-col animate-chat-message-in" style={{ marginTop: SPACE_L, gap: 12 }}>
                    <div className="flex flex-wrap gap-3">
                      {PLAYGROUND_CHIPS.filter((c) => c.id !== "roast-byron" && !chipsConsumed.has(c.id)).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handlePlaygroundChip(c.id)}
                          className="transition-transform active:scale-[0.97]"
                          style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, backgroundColor: BG_SECONDARY, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_CIRCLE, padding: `${SPACE_XS}px ${SPACE_M}px`, cursor: "pointer" }}
                        >
                          {withGoal(c.label)}
                        </button>
                      ))}
                    </div>
                    {!config?.betaSkipAa && (
                      <button
                        type="button"
                        onClick={() => { setBuildPlanPicked(true); setStepIndex(goalAfterExplore ? PLAYGROUND_STEP_INDEX + 1 : (BUILD_PLAN_STEP_INDEX >= 0 ? BUILD_PLAN_STEP_INDEX : FOOTPRINT_RESUME_INDEX)); }}
                        className="transition-transform active:scale-[0.97]"
                        style={{ ...typography.buttonSmall, color: TEXT_ON_COLOR_PRIMARY, backgroundColor: MAIN_PRIMARY, border: "none", borderRadius: RADIUS_CIRCLE, padding: `${SPACE_XS}px ${SPACE_M}px`, cursor: "pointer", alignSelf: "flex-start" }}
                      >
                        Build my goal plan
                      </button>
                    )}
                  </div>
                )}

                {buildPlanPicked && (
                  <div className="flex justify-end animate-chat-message-in" style={{ marginTop: SPACE_M }}>
                    <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
                      <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>Build my goal plan</p>
                    </div>
                  </div>
                )}

                {showPostNudgeChips && !betaIntentFirst && (
                  <div ref={userBubbleRef} className="flex flex-wrap gap-3 animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                    <button
                      type="button"
                      onClick={handlePlaygroundAcceptGoal}
                      className="transition-transform active:scale-[0.97]"
                      style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, backgroundColor: BG_SECONDARY, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_CIRCLE, padding: `${SPACE_XS}px ${SPACE_M}px`, cursor: "pointer" }}
                    >
                      Set up a goal
                    </button>
                    <button
                      type="button"
                      onClick={handlePlaygroundSaveMore}
                      className="transition-transform active:scale-[0.97]"
                      style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, backgroundColor: BG_SECONDARY, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_CIRCLE, padding: `${SPACE_XS}px ${SPACE_M}px`, cursor: "pointer" }}
                    >
                      Just save more
                    </button>
                    {!goalRequired && (
                    <button
                      type="button"
                      onClick={handlePlaygroundTakeMeHome}
                      className="transition-transform active:scale-[0.97]"
                      style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, backgroundColor: BG_SECONDARY, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_CIRCLE, padding: `${SPACE_XS}px ${SPACE_M}px`, cursor: "pointer" }}
                    >
                      Take me home
                    </button>
                    )}
                    {BYRON_INTRO_STEP_INDEX >= 0 && (byronGatedByAa ? aaConnected : introduceByron) && playgroundRoastIndex < MAX_BYRON_ROASTS && (
                    <button
                      type="button"
                      onClick={() => handlePlaygroundChip("roast-byron")}
                      className="transition-transform active:scale-[0.97]"
                      style={{
                        ...typography.buttonSmall,
                        color: TEXT_PRIMARY,
                        backgroundColor: BG_SECONDARY,
                        border: `1px solid ${OUTLINE_SUBTLE}`,
                        borderRadius: RADIUS_CIRCLE,
                        padding: `${SPACE_XS}px ${SPACE_M}px`,
                        cursor: "pointer",
                      }}
                    >
                      Roast me, Byron
                    </button>
                    )}
                  </div>
                )}
              </div>
            );
          }

          if (step.kind === "plan-crunching") {
            // A Claude-style inline "thinking" line — a pulsing label whose text cycles
            // (IDLE_CRUNCHER_TEXTS) while the plan computes. NOT a card, so it never reads as tappable;
            // it just vanishes as the spending plan arrives below it.
            return cruncherVisible ? (
              <div key={`crunch-${i}`} className="flex items-center animate-chat-message-in" style={{ marginTop: SPACE_L, gap: 8, paddingTop: 4, paddingBottom: 4 }}>
                <p className="animate-thinking-pulse" style={{ ...typography.bodySmall, color: TEXT_TERTIARY }}>{cruncherStatus}</p>
              </div>
            ) : null;
          }

          if (step.kind === "build-plan") {
            // Cosimo canon (410:756 / 414:1027): three PLAIN rows in the chat (no card chrome) —
            // Income / Bills & obligations / Everyday spends. Done = magenta DLS tick, active = the
            // dual-ellipse spinner, pending = a soft slate dot. Labels Body Normal (16/24).
            if (cosimoChat) {
              const stages = BUILD_PLAN_STAGES.filter((s) => s.key !== "plan");
              return (
                <div key={`build-plan-${i}`} ref={userBubbleRef} style={{ marginTop: SPACE_M }} className="animate-chat-message-in">
                  <RyanLine text="Right, let me build your plan. I'll only stop for anything I'm unsure about." active={false} />
                  <div style={{ marginTop: SPACE_XL, display: "flex", flexDirection: "column", gap: 12 }}>
                    {stages.map((stage, idx) => {
                      const state = idx < buildPlanStage ? "done" : idx === buildPlanStage ? "active" : "pending";
                      return (
                        <div key={stage.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {state === "done" ? (
                              <img src="/chat/tick-magenta.svg" alt="" aria-hidden width={14} height={11} draggable={false} />
                            ) : state === "active" ? (
                              // Native 24px spinner art in the 20px status box (canon draws status icons
                              // larger than their box — scaling down thinned the stroke).
                              <div aria-hidden className="animate-spin" style={{ position: "relative", width: 24, height: 24, flexShrink: 0 }}>
                                <img src="/chat/spinner-ring.svg" alt="" width={24} height={24} draggable={false} style={{ position: "absolute", inset: 0 }} />
                                <img src="/chat/spinner-arc.svg" alt="" width={16} height={24} draggable={false} style={{ position: "absolute", left: 0, top: 0 }} />
                              </div>
                            ) : (
                              <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: SLATE_50 }} />
                            )}
                          </div>
                          <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY }}>
                            {stage.key === "spending" ? "Everyday spends" : stage.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Data gap resolved (post "Connect more accounts"): a short bridge, then the driver advances. */}
                  {planDataGap && planGapResolved && (
                    <div style={{ marginTop: SPACE_L }}>
                      <RyanLine text="Connected. I can see the missing income source now — carrying on." active={isLast} />
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div key={`build-plan-${i}`} ref={userBubbleRef} style={{ marginTop: SPACE_M }} className="animate-chat-message-in">
                <RyanLine text="Right, let me build your plan. I'll only stop for anything I'm unsure about." active={false} />
                {/* Live progress indicator in a QUIET card — stroke outline only (no fill, no shadow):
                    it's a status readout, not a content card like the plan widget below. */}
                <div style={{ marginTop: SPACE_L, border: "var(--dls-card-border)", borderRadius: RADIUS_M, padding: 24, marginLeft: -4, marginRight: -4 }}>
                  {BUILD_PLAN_STAGES.map((stage, idx) => {
                    const state = idx < buildPlanStage ? "done" : idx === buildPlanStage ? "active" : "pending";
                    const isLastStage = idx === BUILD_PLAN_STAGES.length - 1;
                    return (
                      <div key={stage.key} style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 18, flexShrink: 0 }}>
                          {state === "done" ? (
                            <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: MAIN_PRIMARY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke={TEXT_ON_COLOR_PRIMARY} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                          ) : state === "active" ? (
                            <div className="animate-spin" style={{ width: 18, height: 18, borderRadius: "50%", border: `2.5px solid ${OUTLINE_SUBTLE}`, borderTopColor: MAIN_PRIMARY, flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${OUTLINE_SUBTLE}`, flexShrink: 0 }} />
                          )}
                          {/* No connector lines — the stages are independent checks, not a linked chain. */}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingBottom: isLastStage ? 0 : 14, minWidth: 0 }}>
                          <span style={{ ...typography.bodySmall, fontWeight: 500, color: state === "pending" ? TEXT_TERTIARY : TEXT_PRIMARY, transition: "color 240ms ease" }}>{stage.label}</span>
                          {state === "done" && <span style={{ ...typography.caption, color: TEXT_SECONDARY }}>{stage.done}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* The one ambiguity Ryan stops on renders as an EXPLICIT docked bottom sheet (see the
                    dock chain below) — the plan build is a background process paused on this answer, so
                    the ask must block visibly rather than drift by as another chat line. */}
              </div>
            );
          }

          if (step.kind === "footprint-bucket") {
            const card = BUCKET_CONFIRM_LIST[step.bucketIndex] as Extract<ChatCardData, { type: "confirm-list" }>;
            const confirmed = footprintConfirmed.has(step.bucketIndex);

            // Beta + non-beta both confirm the bucket with an INLINE card (no chip, no opening sheet):
            // it shows Edit + Looks right side by side and flips to a read-only summary once confirmed.
            if (betaIntentFirst) {
              if (!confirmed) {
                // The confirm sheet auto-opens for this bucket (see the footprint-sheet effect) — no
                // chip to tap. Render just the scroll anchor here while the sheet is up.
                return <div key={`footprint-${step.bucketIndex}-${i}`} ref={userBubbleRef} style={{ height: 1 }} />;
              }
              // Confirmed answer card — rebuilt from the captured selection so include/exclude and
              // amount edits made in the sheet are reflected (the sheet is a separate card instance).
              const result = footprintResults[step.bucketIndex];
              const answerCard: ChatCardData = result
                ? {
                    ...card,
                    items: result.map((r) => {
                      const orig = card.items.find((it) => it.id === r.id);
                      return orig ? { ...orig, amount: r.amount, type: r.type } : { id: r.id, payee: r.id, amount: r.amount, type: r.type };
                    }),
                    submitted: true,
                    defaultAllSelected: true,
                  }
                : { ...card, submitted: true, defaultAllSelected: true };
              return (
                // The answer is the user's agreed input, so it reads as a SENT message: right-aligned and
                // narrower than full width (content stays left-aligned inside). The right-alignment IS the
                // confirmation, so no separate "Looks right" echo is needed after it.
                <div
                  ref={userBubbleRef}
                  key={`footprint-${step.bucketIndex}-${i}`}
                  className="flex justify-end animate-chat-message-in"
                  style={{ marginTop: SPACE_L }}
                >
                  <div style={{ maxWidth: "78%", minWidth: 0 }}>
                    <ChatCard card={answerCard} />
                  </div>
                </div>
              );
            }

            return (
              <div
                key={`footprint-${step.bucketIndex}-${i}`}
                // Always attach userBubbleRef so the snap-scroll survives the
                // advanceStep that happens immediately after onSubmit. With
                // multiple bucket renders sharing the ref, React assigns the
                // last one in render order — which is the most recently
                // confirmed bucket. Exactly the snap target we want.
                ref={userBubbleRef}
                className="animate-chat-message-in"
                style={{ marginTop: SPACE_L }}
              >
                <ChatCard
                  card={{
                    ...card,
                    submitted: confirmed,
                    defaultAllSelected: true,
                    onSubmit: () => {
                      // No setUserActionCount here: that would snap to the next
                      // card (shared userBubbleRef). The footprintConfirmed
                      // effect instead snaps to Ryan's transition line.
                      setFootprintConfirmed((prev) => {
                        const next = new Set(prev);
                        next.add(step.bucketIndex);
                        return next;
                      });
                      advanceStep();
                    },
                  }}
                />
              </div>
            );
          }

          if (step.kind === "ladder-pick") {
            // Conversational: the tier ask lives in the chat — Ryan's question + numbered pace options
            // (amount first, pace word after), answered by typing or tapping a line. The whole exchange
            // stays in the transcript after the pick, like any chat. Fixed-tenure goals skip the step
            // entirely (the effect auto-advances) — don't paint a question that was never asked.
            if (conversational && !hasFixedTenure) {
              return (
                <div key={`ladder-ask-${i}`}>
                  <RyanLine
                    text={SAVINGS_TIER_QUESTION.text}
                    active={isLast && !ladderTier && !prefQStreamed["savings-tier"]}
                    onDone={() => setPrefQStreamed((m) => ({ ...m, "savings-tier": true }))}
                  />
                  {(prefQStreamed["savings-tier"] || ladderTier) && (
                    <InlineOptions
                      examples={false}
                      options={LADDER_OPTIONS.map((o) => `${formatINR(o.monthlyAmount)}/mo (${o.tier})`)}
                      onPick={(idx) => {
                        if (ladderTier) return;
                        setLadderEcho(`${formatINR(LADDER_OPTIONS[idx].monthlyAmount)}/mo (${LADDER_OPTIONS[idx].tier})`);
                        setLadderTier(LADDER_OPTIONS[idx].tier);
                        setUserActionCount((c) => c + 1);
                        advanceStep();
                      }}
                    />
                  )}
                  {ladderTier && (
                    <div ref={userBubbleRef} className="flex justify-end animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                      <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
                        {/* Verbatim: typed "2" echoes as "2"; a tapped line echoes its label. */}
                        <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{ladderEcho ?? (ladderTier.charAt(0).toUpperCase() + ladderTier.slice(1))}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            // The savings-tier picker opens as an auto-rising bottom sheet (beta + non-beta), rendered
            // in the docked overlay below. Here the step renders nothing until a tier is picked, then
            // echoes the selection as a chat bubble (userBubbleRef survives the advanceStep).
            if (!ladderTier) return null;
            const tierLabel = ladderTier.charAt(0).toUpperCase() + ladderTier.slice(1);
            return (
              <div
                ref={userBubbleRef}
                key={`ladder-${i}`}
                className="flex justify-end animate-chat-message-in"
                style={{ marginTop: SPACE_L }}
              >
                <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
                  <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{tierLabel}</p>
                </div>
              </div>
            );
          }

          if (step.kind === "spending-plan") {
            // The cash-flow lives in a CARD (money in → out → free), not buried in a sentence — so the
            // text can stay one short line and there's a single thing to read. (Was a dense paragraph
            // that triggered two finicky auto-scrolls.)
            const income = SPENDING_PLAN_FIXTURE.income;
            const fixed = SPENDING_PLAN_FIXTURE.obligations;
            const free = Math.max(0, leftToSpend);
            const total = income || 1;
            const fixedPct = Math.round((fixed / total) * 100);
            const goalPct = Math.round((savingsAmount / total) * 100);
            const freePct = Math.max(0, 100 - fixedPct - goalPct);
            // Legend row: coloured dot · label · amount. The emphasis row (Monthly budget) steps up to
            // H4 and green. No minus signs — the bar + dots carry the "in vs out" story (matches Figma).
            const flowRow = (dot: string, label: string, value: number, opts?: { emphasis?: boolean }) => (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                  <span style={{ ...(opts?.emphasis ? typography.headerH4 : typography.bodySmall), color: TEXT_SECONDARY }}>{label}</span>
                </div>
                <span style={{ ...(opts?.emphasis ? typography.headerH4 : typography.bodySmall), color: opts?.emphasis ? GREEN_500 : TEXT_PRIMARY, whiteSpace: "nowrap" }}>
                  {formatINR(value)}
                </span>
              </div>
            );
            // Cosimo canon (463:3230): the cash flow is a PLAIN-TEXT ledger in the chat — no card
            // chrome, no proportion bar. +/− prefixed rows, hairline, then "Monthly budget" in green.
            if (cosimoChat) {
              const fundLabel = `Into ${goalNoun.charAt(0).toUpperCase() + goalNoun.slice(1)} fund`;
              return (
                <div key={`plan-${i}`} className="animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <CosimoLedgerRow prefix="+" label="Monthly income" amount={formatINR(income)} />
                    <CosimoLedgerRow prefix="-" label="Fixed spends" amount={formatINR(fixed)} />
                    <CosimoLedgerRow prefix="-" label={fundLabel} amount={formatINR(savingsAmount)} />
                    <div aria-hidden style={{ height: 1, backgroundColor: OUTLINE_BOLD, margin: "4px 0" }} />
                    <CosimoLedgerRow label="Monthly budget" amount={formatINR(free)} emphasis />
                  </div>
                  {(planCtaReady || planConfirmed) && (
                    <p className="animate-chat-message-in" style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY, margin: 0, marginTop: SPACE_XL }}>
                      Does this look right?
                    </p>
                  )}
                  {planConfirmed && (
                    <div ref={userBubbleRef} className="flex justify-end animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                      <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
                        <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{planConfirmLabel}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div key={`plan-${i}`} className="animate-chat-message-in" style={{ marginTop: SPACE_M }}>
                <div style={{ backgroundColor: BG_CARD, border: "var(--dls-card-border)", borderRadius: RADIUS_M, boxShadow: ELEVATION_CARD, padding: 24, marginLeft: -4, marginRight: -4 }}>
                  {/* No "Your plan" title — the card IS the plan (redundant header removed). The "runs
                      tight" signal stays as a standalone chip when relevant. */}
                  {isPlanTight && (
                    <div style={{ display: "flex", marginBottom: 12 }}>
                      <span style={{ ...typography.caption, color: ORANGE_500, backgroundColor: BG_SECONDARY, borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap" }}>Runs tight</span>
                    </div>
                  )}
                  {/* Head — Monthly income headline + a proportion bar (fixed · goal · free) */}
                  <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: 0 }}>Monthly income</p>
                  <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: "4px 0 0", whiteSpace: "nowrap" }}>{formatINR(income)}</p>
                  {/* Proportion bar — fixed (blue) · goal (orange) · free (green) */}
                  <div style={{ display: "flex", gap: 3, height: 8, margin: "12px 0 24px", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${fixedPct}%`, background: BLUE_500 }} />
                    <div style={{ width: `${goalPct}%`, background: ORANGE_500 }} />
                    <div style={{ width: `${freePct}%`, background: GREEN_500 }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {flowRow(BLUE_500, "Fixed spends", fixed)}
                    {flowRow(ORANGE_500, `Into ${potLabel}`, savingsAmount)}
                    <div style={{ height: 1, background: OUTLINE_SUBTLE }} />
                    {/* ONE name for this number everywhere — the tracker, hero, s2s line and peek
                        all call it "Monthly budget", so its first appearance must too. */}
                    {flowRow(GREEN_500, "Monthly budget", free, { emphasis: true })}
                  </div>
                </div>
                {/* Conversational: no acknowledgement button — Ryan asks, the user answers in the chat
                    input ("yes" / "looks right" advances; anything else lands as a normal reply). */}
                {conversational && (planCtaReady || planConfirmed) && (
                  <RyanLine
                    text="Does this look right to you? Say yes and I'll set up the day-to-day caps, or tell me what to change."
                    active={isLast && planCtaReady && !planConfirmed}
                  />
                )}
                {/* User taps to move on to the full budget — no auto-advance. */}
                {isLast && planCtaReady && !planConfirmed && !conversational && (
                  <div className="flex animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                    <button
                      type="button"
                      onClick={() => { setPlanConfirmed(true); setUserActionCount((c) => c + 1); advanceStep(); }}
                      className="transition-transform active:scale-[0.97]"
                      style={{ ...typography.buttonSmall, color: TEXT_ON_COLOR_PRIMARY, backgroundColor: MAIN_PRIMARY, border: "none", borderRadius: RADIUS_CIRCLE, padding: `${SPACE_XS}px ${SPACE_M}px`, cursor: "pointer" }}
                    >
                      Looks right
                    </button>
                  </div>
                )}
                {planConfirmed && (
                  // Echo the confirmation as a user bubble so it stays in the transcript (conversational
                  // echoes the user's actual words; the button path keeps its label).
                  <div ref={userBubbleRef} className="flex justify-end animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                    <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
                      <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{conversational ? planConfirmLabel : "Looks right"}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          if (step.kind === "lump-sum") {
            // Pitch: the head start is asked FIRST (before the pace), framed around the idle cash Ryan
            // spotted — but only the INTENT is captured here. The actual atom-creation runs at the end
            // (lock-in), so this step just records the amount and moves on with a light ack.
            return (
              <div key={`lump-sum-${i}`} className="animate-chat-message-in" style={{ marginTop: SPACE_M }}>
                {/* When the head start was already banked in the feasibility negotiation, the ask never
                    happened — only the ack/bridge renders. (₹ amounts auto-bold via highlightValues;
                    wrapping them in ** breaks the parser.) */}
                {!(cosimoChat && feasLevers.headStart) && (
                  <RyanLine
                    text={cosimoChat
                      // Canon 435:1550 — the one-time contribution ask, suggested amount inline.
                      ? `How much would you like to save as a one-time contribution? We suggest starting with ${formatINR(HEAD_START_AMOUNT)}, but you can choose any amount. You can also say none.`
                      : `Before we set your pace, a quick one: you've got about ${formatINR(IDLE_CASH_AMOUNT)} sitting idle across your accounts. Want to earmark some as a one-time head start for ${potLabel}? ${formatINR(HEAD_START_AMOUNT)} works, or any amount. You can also say none.`}
                    active={isLast && headStart === null && !lumpPromptStreamed}
                    onDone={isLast && headStart === null && !lumpPromptStreamed ? () => setLumpPromptStreamed(true) : undefined}
                  />
                )}
                {/* Followup rows for the ask (typed amounts still work through the composer). */}
                {cosimoChat && !feasLevers.headStart && headStart === null && lumpPromptStreamed && isLast && (
                  <InlineOptions
                    options={[`Go ahead with ${formatINR(HEAD_START_AMOUNT)}`, "No one-time contribution"]}
                    icons={["💰", "🙅"]}
                    onPick={(idx) => {
                      if (idx === 0) {
                        setLumpEcho(`Go ahead with ${formatINR(HEAD_START_AMOUNT)}`);
                        fundedAmountRef.current = HEAD_START_AMOUNT;
                        setHeadStart(HEAD_START_AMOUNT);
                      } else {
                        setLumpEcho("No one-time contribution");
                        setHeadStart(0);
                      }
                      setUserActionCount((c) => c + 1);
                    }}
                  />
                )}
                {/* The user's answer, echoed as their bubble — typed or picked. */}
                {lumpEcho && (
                  <div ref={userBubbleRef} className="flex justify-end animate-chat-message-in" style={{ marginTop: SPACE_M }}>
                    <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
                      <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{lumpEcho}</p>
                    </div>
                  </div>
                )}
                {headStart != null && headStart > 0 && (
                  <RyanLine
                    text={cosimoChat
                      // Canon 435:1554 — ack the contribution and bridge into the cash-flow ledger.
                      ? `Got it. We'll start with a ${formatINR(headStart)} one-time contribution.\n\nTo stay on track, you'll need to save ${formatINR(savingsAmount)} every month. Here's how your monthly cash flow will look after accounting for this contribution.`
                      : `${formatINR(headStart)} it is. I'll move it when we lock everything in.`}
                    active={isLast}
                    onDone={isLast ? advanceStep : undefined}
                  />
                )}
                {headStart === 0 && (
                  <RyanLine
                    text={cosimoChat
                      ? `No problem. To stay on track, you'll need to save ${formatINR(savingsAmount)} every month. Here's how your monthly cash flow will look.`
                      : "No problem, we'll build it monthly then."}
                    active={isLast}
                    onDone={isLast ? advanceStep : undefined}
                  />
                )}
              </div>
            );
          }

          if (step.kind === "budget-confirm") {
            // The budget lives IN THE CHAT (a bottom sheet felt off for a table this central): one
            // persistent card — "Looks good" inside it while unconfirmed, then it stays as the record.
            // budgetSheetOpen now only summons the docked TypeBox for conversational cap edits.
            return (
              <div key={`budget-confirm-${i}`} style={{ marginTop: SPACE_M }}>
                {/* Names its DISTINCT job (per-category caps) so it doesn't read as the plan card's
                    "look right?" asked twice — and breaks the third consecutive "Here's..." opener.
                    Cosimo canon (492:1742): "Perfect. Your goal plan is ready." + the allocation lead. */}
                <RyanLine
                  text={cosimoChat
                    ? "Perfect. Your goal plan is ready.\n\nBased on this plan, here's how your monthly budget will be allocated."
                    : conversational
                    ? (msgVoice === "byron"
                      ? "Plan's done. Now the caps that keep you honest."
                      : "Plan's set. Last thing: the caps that make it work day to day.")
                    : (msgVoice === "byron"
                      ? "Plan's done. Now the caps that keep you honest. Look right?"
                      : "Plan's set. Last thing: the caps that make it work day to day. Look right?")}
                  active={isLast}
                  onDone={isLast && !budgetConfirmed ? () => setBudgetSheetOpen(true) : undefined}
                />
                {(budgetSheetOpen || budgetConfirmed) && (
                  <>
                    {cosimoChat ? (
                      // Canon 492:1742: a plain-text allocation ledger — green total up top, hairline,
                      // then the per-category caps as − rows. No card chrome, no bar viz.
                      <div className="animate-chat-message-in" style={{ marginTop: SPACE_L, display: "flex", flexDirection: "column", gap: 16 }}>
                        <CosimoLedgerRow label="Monthly budget" amount={formatINR(Math.max(0, leftToSpend))} emphasis />
                        <div aria-hidden style={{ height: 1, backgroundColor: OUTLINE_BOLD, margin: "4px 0" }} />
                        {spendingPlan.categoryBudgets.map((c) => (
                          <CosimoLedgerRow key={c.name} prefix="-" label={c.name} amount={formatINR(c.cap)} />
                        ))}
                      </div>
                    ) : (
                      <div
                        className="animate-chat-message-in"
                        style={{ marginTop: SPACE_M, marginLeft: -4, marginRight: -4, backgroundColor: BG_CARD, border: "var(--dls-card-border)", borderRadius: RADIUS_M, padding: "24px", boxShadow: ELEVATION_CARD }}
                      >
                        <CategoryBudgetsViz plan={spendingPlan} />
                      </div>
                    )}
                    {/* Conversational: the question comes AFTER the table (you read the caps first,
                        then get asked) — answered in the chat input (yes confirms; "food 6k" edits). */}
                    {conversational && (budgetSheetOpen || budgetConfirmed) && (
                      // 32px above the confirm ask — SPACE_S read as glued to the ledger's last row.
                      <div style={{ marginTop: SPACE_XL }}>
                        <RyanLine
                          text={cosimoChat
                            ? "Does this budget look right? If you'd like to change anything, just let me know."
                            : "Do these look right? Say yes and we're done, or tweak any cap, like food 6k."}
                          active={isLast && !budgetConfirmed}
                        />
                      </div>
                    )}
                    {!budgetConfirmed && !conversational && (
                      // Confirm sits OUTSIDE the card as a chat-action pill (like "Meet Byron" / explore),
                      // reading as a conversational reply below the card rather than a footer inside it.
                      <div className="flex animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                        <button
                          type="button"
                          onClick={() => { setBudgetConfirmed(true); setBudgetSheetOpen(false); advanceStep(); }}
                          className="transition-transform active:scale-[0.97]"
                          style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, backgroundColor: BG_SECONDARY, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_CIRCLE, padding: `${SPACE_XS}px ${SPACE_M}px`, cursor: "pointer" }}
                        >
                          Looks good
                        </button>
                      </div>
                    )}
                    {budgetConfirmed && (
                      // Echo the confirmation as a user bubble below the card (conversational echoes the
                      // user's actual words; the pill path keeps its label). userBubbleRef so the typed
                      // "yes" snap-scroll anchors HERE, not the stale plan echo a tall card above.
                      <div ref={userBubbleRef} className="flex justify-end animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                        <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
                          <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{conversational ? budgetConfirmLabel : "Looks good"}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          }

          if (step.kind === "verdict") {
            const amt = formatINR(savingsAmount);
            let verdictText: string;
            if (isPlanTight) {
              verdictText = msgVoice === "byron"
                ? `${amt}/month is more than you've got spare. Doable, but it'll pinch — more time would ease it.`
                : `Heads up: ${amt} a month is more than you've got spare. Doable, but tight. A bit more time would ease it.`;
            } else {
              // The amount + budget are already confirmed by this point — don't re-justify the math,
              // just move it forward into setting up the goal.
              verdictText = msgVoice === "byron"
                ? `${amt}/month. Sorted. Let's set up ${goalLabel}.`
                : `${amt} a month, sorted. Now let's set up ${goalLabel}.`;
            }
            return (
              <div key={`verdict-${i}`} style={{ marginTop: SPACE_M }}>
                {/* No "Set it up" chip — the verdict line flows straight into the funding card (the
                    card IS the action). The unlock moment stays at the END, after funding (#296). */}
                <RyanLine
                  text={verdictText}
                  active={isLast}
                  onDone={isLast ? () => advanceStep() : undefined}
                />
              </div>
            );
          }

          if (step.kind === "lock-in") {
            // No lock/tweak fork — the plan is editable later (from the goal card), so we skip the
            // commit choice and go straight to funding with a "change anytime" reassurance in the copy.

            // After the user picks: show their selection as a bubble + the
            // follow-up Ryan/Byron line. "Lock it in" yields a definitive
            // confirmation; "Tweak something" invites a reply via the input
            // bar (rendered in the bottom chrome below).
            // Beta "Just auto-save" reaches lock-in directly (no plan built), so the choice bubble +
            // bridge line are framed as a simple auto-save rather than "locking in" a plan.
            const pickLabel = betaAutoSave ? "Just auto-save" : lockInChoice === "lock" ? "Lock it in" : "Tweak something";
            const fund = (n: number) => Math.round(n / 500) * 500;
            // The autopay card sets the MONTHLY (the head-start step above handles any one-time deposit).
            const fundOptions = [
              { label: `${formatINR(savingsAmount)}/mo`, value: savingsAmount },
              { label: `${formatINR(fund(savingsAmount * 1.5))}/mo`, value: fund(savingsAmount * 1.5) },
            ];
            const followUpText = betaAutoSave
              ? (msgVoice === "byron"
                  ? `Simple it is. Pick a monthly and I'll auto-save it toward **${potLabel}**. Change or pause it whenever, nothing's locked.`
                  : `Keeping it simple. Pick a monthly amount and I'll auto-save it toward **${potLabel}**. You can change or pause it anytime, nothing's set in stone.`)
              : (msgVoice === "byron"
                  ? `Here's your plan. Already saved for **${potLabel}**? Put it in now — the autopay covers the rest.`
                  : `Here's your plan. If you've already saved toward **${potLabel}**, add it now — the monthly autopay covers the rest.`);
            const reworkLine = msgVoice === "byron"
              ? `Noted. Reworked. Now fund **${potLabel}** and set the autopay.`
              : `Got it. Updated and locked in. Now let's fund **${potLabel}** and set the autopay.`;
            // Funded = committed = terminal: freeze this confirmation to the voice it was spoken in, so
            // toggling Ryan/Byron afterwards doesn't rewrite a done-deal message.
            const fundedVoice = potFunded ? (fundedVoiceRef.current ??= voice) : voice;
            const fundedLine = fundedVoice === "byron"
              ? `Commitment made. **${potLabel}** is live and the auto-save's running. I'll yell when you wobble.`
              : `That's it, you're committed. **${potLabel}** is live and the auto-save's running. I'll keep tabs and nudge you if anything drifts.`;
            const showFunding = true; // no lock/tweak fork — the lock-in step always proceeds to funding
            return (
              <div key={`lock-in-${i}`}>
                {/* Only auto-save shows a choice bubble (the user did tap "Just auto-save" earlier). The
                    plan path has no lock/tweak choice now, so it goes straight to Ryan's confirm + funding. */}
                {betaAutoSave && (
                  <div
                    ref={userBubbleRef}
                    className="flex justify-end animate-chat-message-in"
                    style={{ marginTop: SPACE_L }}
                  >
                    <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
                      <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{pickLabel}</p>
                    </div>
                  </div>
                )}
                {/* Beta plan path: the verdict line already said "let's set up GOAL" — repeating
                    "Here's your plan. Fund…" was redundant, so the funding card follows directly.
                    Auto-save (and non-beta) keep the bridge line: there's no verdict before them. */}
                {!(betaIntentFirst && !betaAutoSave) && (
                  <div style={{ marginTop: betaAutoSave ? SPACE_M : SPACE_L }}>
                    <RyanLine text={followUpText} active={!tweakSubmitted} />
                  </div>
                )}
                {tweakSubmitted && tweakDraft && (
                  <>
                    <div className="flex justify-end animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                      <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
                        <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{tweakDraft}</p>
                      </div>
                    </div>
                    <div style={{ marginTop: SPACE_M }}>
                      <RyanLine text={reworkLine} active />
                    </div>
                  </>
                )}
                {/* Cosimo canon (435:1527 → 484:3090): deployment = the ATOM. Explainer line, then the
                    one-time-contribution card whose "Create atom" opens the full-screen atom page; on
                    confirm the card flips to its ticked done state, "Your atom is ready" lands, and the
                    monthly-autopay card's Setup (same page, autopay mode) commits the goal. */}
                {showFunding && cosimoChat && (
                  <>
                    <div style={{ marginTop: SPACE_L }}>
                      <RyanLine
                        text={`**Perfect. Your goal plan is ready.**\n\nWe'll place your money in **atom**. While it's there, it'll earn **100% of repo rate**, with interest paid daily, until it's invested toward your goal.`}
                        active={isLast && !atomCreated && !atomIntroDone}
                        onDone={isLast && !atomIntroDone ? () => setAtomIntroDone(true) : undefined}
                      />
                    </div>
                    {(atomIntroDone || atomCreated) && (
                    <div
                      ref={atomCardRef}
                      className="animate-chat-message-in"
                      style={{ marginTop: SPACE_L, marginLeft: -4, marginRight: -4, display: "flex", alignItems: "center", gap: 4, backgroundColor: BG_CARD, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_M, padding: 20, boxShadow: ELEVATION_CARD }}
                    >
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                        <p style={{ ...typography.caption, color: TEXT_PRIMARY, margin: 0 }}>One-time contribution</p>
                        <p style={{ ...typography.headerH2, color: TEXT_PRIMARY, margin: 0 }}>
                          {formatINR(headStart != null && headStart > 0 ? headStart : HEAD_START_AMOUNT)}
                        </p>
                      </div>
                      {atomCreated ? (
                        // Done state (canon 484:1911): the button gives way to a magenta tick in a soft disc.
                        <div className="animate-chat-message-in" style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: SLATE_10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <img src="/chat/tick-magenta.svg" alt="" aria-hidden width={14} height={11} draggable={false} />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAtomPageOpen("one-time")}
                          className="transition-transform active:scale-[0.97]"
                          style={{ ...typography.caption, fontWeight: 500, color: TEXT_PRIMARY, backgroundColor: SLATE_30, border: "none", borderRadius: RADIUS_CIRCLE, padding: "7px 13px", cursor: "pointer", flexShrink: 0 }}
                        >
                          Create atom
                        </button>
                      )}
                    </div>
                    )}
                    {atomCreated && (
                      <>
                        <div ref={autopaySectionRef} style={{ marginTop: SPACE_L }}>
                          <RyanLine
                            text={`**Your atom is ready.**\n\nThe last step is to **set up your monthly AutoPay**. We'll automatically invest ${formatINR(savingsAmount)} every month, so you stay on track without having to remember it.`}
                            active={isLast && !potFunded && !autopayIntroDone}
                            onDone={isLast && !autopayIntroDone ? () => setAutopayIntroDone(true) : undefined}
                          />
                        </div>
                        {(autopayIntroDone || potFunded) && (
                        <div
                          className="animate-chat-message-in"
                          style={{ marginTop: SPACE_L, marginLeft: -4, marginRight: -4, display: "flex", alignItems: "center", gap: 4, backgroundColor: BG_CARD, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_M, padding: 20, boxShadow: ELEVATION_CARD }}
                        >
                          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                            <p style={{ ...typography.caption, color: TEXT_PRIMARY, margin: 0 }}>Monthly autopay</p>
                            <p style={{ ...typography.headerH2, color: TEXT_PRIMARY, margin: 0 }}>{formatINR(savingsAmount)}</p>
                          </div>
                          {potFunded ? (
                            <div className="animate-chat-message-in" style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: SLATE_10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <img src="/chat/tick-magenta.svg" alt="" aria-hidden width={14} height={11} draggable={false} />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAtomPageOpen("autopay")}
                              className="transition-transform active:scale-[0.97]"
                              style={{ ...typography.caption, fontWeight: 500, color: TEXT_PRIMARY, backgroundColor: SLATE_30, border: "none", borderRadius: RADIUS_CIRCLE, padding: "7px 13px", cursor: "pointer", flexShrink: 0 }}
                            >
                              Setup
                            </button>
                          )}
                        </div>
                        )}
                      </>
                    )}
                  </>
                )}
                {showFunding && !cosimoChat && (
                  <>
                    {/* Step 1 (optional, skipped for auto-save): a one-time head-start deposit CARD.
                        Pitch asks this EARLIER (the lump-sum step before the budget) — lock-in is then
                        autopay-only, so the whole head-start beat is gated out here. */}
                    {LUMP_SUM_STEP_INDEX < 0 && !betaAutoSave && headStart === null && (
                      <div key="head-start" ref={userBubbleRef} className="animate-chat-message-in" style={{ marginTop: SPACE_M }}>
                        <RyanLine text={conversational
                          ? `Let's start with a lump sum: a one-time deposit gives ${potLabel} a real head start. ${formatINR(HEAD_START_AMOUNT)} works well. How much should I move? You can also say skip.`
                          : `Let's start with a lump sum. A one-time deposit to give ${potLabel} a head start, or skip it and I'll set up the monthly autopay next.`} active />
                        {/* Conversational asks in words (typed amount / yes / skip) — the card only
                            appears as the RECEIPT once an amount lands. */}
                        {!conversational && (
                        <div style={{ marginTop: SPACE_M }}>
                          <ChatCard
                            card={{
                              type: "add-to-pot",
                              goalName: potLabel,
                              amount: HEAD_START_AMOUNT,
                              recommendedAmount: HEAD_START_AMOUNT,
                              fromAccount: "Savings xx1234",
                              variant: "chips",
                              oneTime: true,
                              amountOptions: [
                                { label: formatINR(HEAD_START_AMOUNT), value: HEAD_START_AMOUNT },
                                { label: formatINR(25000), value: 25000 },
                              ],
                              onAdd: (amt) => { fundedAmountRef.current = amt; setHeadStart(amt); },
                            }}
                          />
                        </div>
                        )}
                        {/* Conversational: no skip pill — the line above says "just say skip" and the
                            router handles it (skip / no / not now all resolve the head-start to 0). */}
                        {!conversational && (
                          <button
                            type="button"
                            onClick={() => { fundedAmountRef.current = 0; setHeadStart(0); }}
                            className="transition-transform active:scale-[0.97]"
                            style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, backgroundColor: BG_SECONDARY, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_CIRCLE, padding: `${SPACE_XS}px ${SPACE_M}px`, cursor: "pointer", marginTop: SPACE_M, alignSelf: "flex-start" }}
                          >
                            Skip for now
                          </button>
                        )}
                      </div>
                    )}
                    {/* Confirmed head-start deposit (receipt) — NON-pitch flows fund it right here. */}
                    {LUMP_SUM_STEP_INDEX < 0 && !betaAutoSave && headStart != null && headStart > 0 && (
                      <div className="animate-chat-message-in" style={{ marginTop: SPACE_M }}>
                        <ChatCard
                          card={{
                            type: "add-to-pot",
                            goalName: potLabel,
                            amount: headStart,
                            recommendedAmount: headStart,
                            fromAccount: "Savings xx1234",
                            variant: "chips",
                            oneTime: true,
                            activated: true,
                          }}
                        />
                      </div>
                    )}
                    {/* Pitch: the head start chosen earlier (before the pace) EXECUTES here — the
                        deferred atom auto-runs via effect. Ryan narrates the move; the receipt lands
                        once it settles, then the autopay follows. */}
                    {LUMP_SUM_STEP_INDEX >= 0 && headStart != null && headStart > 0 && (
                      <div key="head-start-exec" className="animate-chat-message-in" style={{ marginTop: SPACE_M }}>
                        <RyanLine text={`Locking it in. First, that ${formatINR(headStart)} head start — moving it into ${potLabel} now.`} active={!lumpSettled} />
                        {lumpSettled && (
                          <div className="animate-chat-message-in" style={{ marginTop: SPACE_M }}>
                            <ChatCard
                              card={{
                                type: "add-to-pot",
                                goalName: potLabel,
                                amount: headStart,
                                recommendedAmount: headStart,
                                fromAccount: "Savings xx1234",
                                variant: "chips",
                                oneTime: true,
                                activated: true,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    {/* Step 2: monthly autopay — commits the goal. On the pitch path it waits for the
                        head start to settle (or be declined) first. */}
                    {(betaAutoSave || headStart !== null || LUMP_SUM_STEP_INDEX >= 0)
                      && (LUMP_SUM_STEP_INDEX < 0 || headStart === 0 || lumpSettled) && (
                      <div key="autopay" ref={userBubbleRef} className="animate-chat-message-in" style={{ marginTop: SPACE_M }}>
                        {!betaAutoSave && headStart != null && headStart > 0 && !potFunded && !conversational && (
                          <div style={{ marginBottom: SPACE_M }}>
                            <RyanLine text={`${formatINR(headStart)} in — nice head start. Now the monthly autopay to keep it going.`} active />
                          </div>
                        )}
                        {/* Conversational: the autopay is ASKED, not presented as a control — the card
                            appears as the receipt once the user says yes. No head-start prefix here (the
                            exec block above already covered it). */}
                        {conversational && !potFunded ? (
                          <RyanLine
                            text={`Now the monthly autopay: ${formatINR(savingsAmount)}/mo keeps ${potLabel} on pace. Say yes and I'll start the goal.`}
                            active
                          />
                        ) : (
                          <ChatCard
                            card={{
                              type: "add-to-pot",
                              goalName: potLabel,
                              amount: savingsAmount,
                              recommendedAmount: savingsAmount,
                              fromAccount: "Savings xx1234",
                              variant: "chips",
                              amountOptions: fundOptions,
                              activated: potFunded,
                              onAdd: () => { setPotFunded(true); },
                              onArrowTap: potFunded ? () => { if (betaIntentFirst && onOpenGoalDetail) { onOpenGoalDetail(betaGoalData); } else { openGoalOnCloseRef.current = true; closeOverlay(); } } : undefined,
                            }}
                          />
                        )}
                      </div>
                    )}
                  </>
                )}
                {potFunded && !cosimoChat && (
                  // Echo the confirmation as a user bubble, above Ryan's committed line — conversational
                  // shows the user's typed words; the card tap shows its CTA label. (Cosimo canon has no
                  // echo here — the ticked cards ARE the record.)
                  <div className="flex justify-end animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                    <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
                      <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{conversational ? fundConfirmLabel : "Start goal"}</p>
                    </div>
                  </div>
                )}
                {potFunded && (
                  <div style={{ marginTop: SPACE_M }}>
                    <RyanLine
                      text={fundedLine}
                      active
                      // Goal is confirmed first. When this lands, Ryan nudges toward the safe-to-spend
                      // (below) so it gets its own beat, not tumbling out directly with the goal.
                      onDone={() => setS2sNudgeReady(true)}
                    />
                  </div>
                )}
                {potFunded && s2sNudgeReady && (
                  <div style={{ marginTop: SPACE_M }}>
                    <RyanLine
                      text={fundedVoice === "byron"
                        ? "One more number before you go, and it's the one you'll actually check."
                        : "One more number worth knowing, and it's the one you'll check the most."}
                      active
                      onDone={() => setS2sIntroReady(true)}
                    />
                  </div>
                )}
                {potFunded && s2sIntroReady && (
                  // The s2s line comes FIRST and sets up the key: it names the locked tracker up top
                  // and tells the user their goal earned the key. The key card follows it.
                  <div style={{ marginTop: SPACE_M }}>
                    <RyanLine
                      // Frame it as spent-of-budget (the SAME number the tracker chip + hero show — spent
                      // this month) so the whole sequence agrees. "What's left" wording drifted from the
                      // chip once a pace tier moved the budget (chip = spent, copy implied what's-left).
                      text={fundedVoice === "byron"
                        ? `You've spent ₹${formatCompactK(s2sSnap.spent)} of your ₹${formatCompactK(s2sSnap.monthly)} monthly budget. It's up top. Locked. Your goal just earned the key.`
                        : `You've spent ₹${formatCompactK(s2sSnap.spent)} of your ₹${formatCompactK(s2sSnap.monthly)} monthly budget. It's up top, and it's locked. Your first goal just earned the key.`}
                      active={!s2sPromptReady}
                      onDone={() => { setS2sPromptReady(true); revealLatest(); }}
                    />
                  </div>
                )}
                {potFunded && s2sPromptReady && !s2sUnlocked && (
                  onViewFeed ? (
                    // Cosimo pitch (R14): the reward is the FEED, and its CTA lives in the
                    // composer's slot (it replaces the message box) — nothing in the stream.
                    null
                  ) : (
                  // The KEY — appears right after the line that promised it. Tapping launches the key up
                  // to the locked chip's centre; the lock opens into the live tracker.
                  <button
                    type="button"
                    onClick={() => {
                      if (keyFly) return;
                      setKeyFly(true);
                      requestAnimationFrame(() => requestAnimationFrame(() => setKeyFlyGo(true)));
                      // The lock opens as the key lands (tracker goes live)…
                      window.setTimeout(() => setTrackerLive(true), 640);
                      // …then the flight clears and a short confirm line lands.
                      window.setTimeout(() => {
                        setKeyFly(false); setKeyFlyGo(false); setS2sUnlocked(true);
                        revealLatest();
                      }, 920);
                    }}
                    aria-label="Unlock my monthly budget"
                    className="animate-chat-message-in transition-transform active:scale-[0.97]"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", width: "100%", marginTop: SPACE_L,
                      padding: SPACE_L, borderRadius: RADIUS_M, border: "var(--dls-card-border)",
                      backgroundColor: BG_CARD, boxShadow: ELEVATION_CARD, cursor: "pointer",
                      opacity: keyFly ? 0 : 1, transition: "opacity 200ms ease",
                    }}
                  >
                    {/* Clean, minimal: just the key (the reward). No text — the line above sets it up. */}
                    <img src={KEY_IMG} alt="" aria-hidden="true" width={96} height={96} draggable={false} style={{ display: "block" }} />
                  </button>
                  )
                )}
                {potFunded && s2sUnlocked && (
                  // Post-unlock confirm — the practical details land once the tracker is live up top.
                  <div style={{ marginTop: SPACE_M }}>
                    <RyanLine
                      text={fundedVoice === "byron"
                        ? "Open. It resets on payday (the 3rd). Tweak it from Edit budget."
                        : "There it is. It resets on payday (the 3rd), and you can change it anytime from Edit budget."}
                      active
                    />
                  </div>
                )}
              </div>
            );
          }

          return null;
          })();

          // Persona-switch intros fold INTO the stream: each renders right after the step it fired
          // on, so later chat stacks BELOW it. Keyed Fragment (no wrapper DOM node) keeps every
          // message a direct child of the scroller — the scroll arbiter iterates those children.
          const stepIntros = switchIntros.filter((s) => s.atStep === i);
          // Background-fetch cruncher band — BETA only now. Pitch moved it to the compact progress
          // chip in the app bar's top-right slot (no pinned banner, no "money's mapped" state).
          const cruncherEl = (!config?.betaSkipAa && i === CRUNCHER_ANCHOR_INDEX && betaIntentFirst && stepIndex <= BUILD_PLAN_STEP_INDEX && !aaCruncherGone) ? (
            <div style={{
              position: "sticky", top: Math.max(0, topClearance - SPACE_M), zIndex: 10,
              marginLeft: -SPACE_L, marginRight: -SPACE_L, overflow: "hidden",
              opacity: (aaFetchDone && !config?.betaSkipAa) ? 0 : 1,
              maxHeight: (aaFetchDone && !config?.betaSkipAa) ? 0 : 400,
              transition: "opacity 400ms ease 1200ms, max-height 460ms ease 1250ms",
              WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 calc(100% - 28px), transparent 100%)",
              maskImage: "linear-gradient(to bottom, #000 0%, #000 calc(100% - 28px), transparent 100%)",
            }}>
              <div style={{ paddingLeft: SPACE_L, paddingRight: SPACE_L, paddingTop: SPACE_M, paddingBottom: SPACE_L, backgroundColor: BG_PRIMARY }}>
                <PlanCruncherV2
                  goalName={aaFetchDone ? "Your money's mapped" : aaFetchStatus}
                  visible
                  completed={aaFetchDone}
                  completedAction={config?.betaSkipAa && !buildPlanPicked ? (
                    <button
                      type="button"
                      onClick={() => { setBuildPlanPicked(true); setStepIndex(BUILD_PLAN_STEP_INDEX >= 0 ? BUILD_PLAN_STEP_INDEX : FOOTPRINT_RESUME_INDEX); }}
                      className="transition-transform active:scale-[0.97]"
                      style={{ ...typography.buttonSmall, width: "100%", color: TEXT_ON_COLOR_PRIMARY, backgroundColor: MAIN_PRIMARY, border: "none", borderRadius: RADIUS_CIRCLE, padding: `${SPACE_XS}px ${SPACE_M}px`, cursor: "pointer" }}
                    >
                      Build my goal plan
                    </button>
                  ) : undefined}
                />
              </div>
            </div>
          ) : null;
          if (stepEl == null && stepIntros.length === 0) return null;
          return (
            <Fragment key={`step-${i}`}>
              {stepEl}
              {stepIntros.map((intro, k) => (
                <div key={`switch-${i}-${k}`} style={{ marginTop: SPACE_M }}>
                  <RyanLine text={intro.text} active={intro === switchIntros[switchIntros.length - 1]} />
                </div>
              ))}
              {/* Conversational: free-typed asides render right AFTER the step they were typed at,
                  so a routed answer typed later never appears above them. Ryan acknowledges each. */}
              {conversational && freeTextBubbles.map((b, k) => b.step === i ? (
                <Fragment key={`free-step-${i}-${k}`}>
                  <div
                    ref={k === freeTextBubbles.length - 1 ? userBubbleRef : undefined}
                    className="flex justify-end animate-chat-message-in"
                    style={{ marginTop: SPACE_L }}
                  >
                    <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
                      <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{b.text}</p>
                    </div>
                  </div>
                  <RyanLine
                    text={b.reply ?? "Good question, noted. Let me come back to that once we're through here."}
                    active={k === freeTextBubbles.length - 1 && b.step === stepIndex}
                  />
                </Fragment>
              ) : null)}
              {/* Beta: cruncher rides AFTER the "linked" line (pitch already placed it above). */}
              {!config?.betaSkipAa && cruncherEl}
            </Fragment>
          );
        })}

        {/* Beta: free-text the user typed into the chat bar, as their own bubbles at the tail
            of the conversation (the snap-scroll target is the last one). Conversational renders
            them INSIDE the step stream instead (see the per-step block in the Fragment above). */}
        {betaIntentFirst && !conversational && freeTextBubbles.map((b, i) => (
          <div
            key={`free-${i}`}
            ref={i === freeTextBubbles.length - 1 ? userBubbleRef : undefined}
            className="flex justify-end animate-chat-message-in"
            style={{ marginTop: SPACE_L }}
          >
            <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
              <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{b.text}</p>
            </div>
          </div>
        ))}

        {/* Bottom spacer for breathing room — clears the absolutely-positioned
            input bar AND leaves ~32px of gap between the last chat message and the
            bottom bar (was 80 → cramped to ~a few px above the input). */}
        {/* Budget docks only the TypeBox now (the card lives in chat), so it uses the base height. */}
        <div className="shrink-0" aria-hidden="true" style={{ height: footprintSheetBucket != null ? 380 : (prefQuizOpen || ladderQuizOpen || buildPlanPendingQ != null) ? 260 : 112 }} />
      </div>
    </div>
  );

  // Any overlay covering the base PayScreen shows the single hoisted chrome — incl. the
  // WrappedStory, so the status bar is one fixed bar across every screen (its beat bg
  // tracks the theme, so the themed status glyphs always contrast).
  const chromeVisible = overlayOpen || aaFlowOpen || !!bigSpends || storyOpen;

  return (
    <div
      data-phone-frame
      // overflow-CLIP, not hidden: browsers will happily focus-scroll an overflow-hidden container
      // (scrollTop sticks, never resets) — which shoved the whole chat up: input mid-screen, the
      // jump pill "floating in the centre", autoscroll off by the phantom offset. clip forbids it.
      className="relative h-full w-full overflow-clip"
      style={{ fontFamily: "var(--font-rubik), var(--font-sans), system-ui, sans-serif" }}
    >
      <ChromeSuppressProvider suppress={chromeVisible}>
      {/* Layer 0: Pay screen */}
      {payScreenVariant === "current" ? (
        <SharedPayScreen
          onPillTap={openOverlay}
          pillLabel={pillLabel}
          state={ryanReady ? "alert" : "firstTime"}
          sheetOpen={overlayOpen}
        />
      ) : (
        <PayScreenFuture onPillTap={openOverlay} pillLabel={pillLabel} animate={ryanReady} />
      )}

      {/* Layer 1: Single overlay - content swaps between PDP and chat */}
      <div
        className="absolute inset-0 z-20"
        // Portal target for full-page card editors (e.g. ConfirmListCard's "Edit" → fullscreen).
        // Without this the editor's createPortal target is null and the button silently no-ops.
        data-screen-root
        style={{
          backgroundColor: BG_PRIMARY,
          transform: overlayOpen ? "translateY(0%)" : "translateY(100%)",
          // Open is staged: the Meet-Ryan glyph starts spinning (100ms in) and spins for ~300ms
          // BEFORE the sheet rises (400ms delay = 100ms spin-start + 300ms lead). Close is
          // immediate (no delay) so the dismiss feels responsive while the glyph eases out.
          transition: overlayOpen
            ? `transform ${OVERLAY_DURATION}ms ${EASE} 400ms`
            : `transform ${OVERLAY_DURATION}ms ${EASE}`,
          willChange: "transform",
        }}
      >
        {/* ── PDP screen ── */}
        {overlayScreen === "pdp" && overlayMounted && (
          <FeaturePDP
            productName="Meet Ryan"
            subtitle={"Keeps track of your money,\nso you don't have to"}
            features={PDP_FEATURES}
            onClose={closeOverlay}
            onAction={handlePdpAction}
            footer="disclaimer-cta"
            disclaimerText="This beta may contain bugs or unfinished features."
            actionLabel="Join the beta"
          />
        )}

        {/* ── Chat screen ── */}
        {overlayScreen === "chat" && (
          <SnackbarSlotProvider>
            <FloatingAppBar
              onClose={ryanReady ? closeOverlay : handleChatBack}
              // Cosimo chat always wears the ✕ (canon 796:6252) — there's no PDP behind it to "back" to.
              navKind={cosimoChat || ryanReady ? "close" : "back"}
              mode={appBarMode}
              activeVoice={voice}
              // Cosimo's bar: empty centre at rest; on scroll the persona pill (avatar + spinner ring
              // + "Cosimo" + live status) fades in, hanging below the bar (canon 796:6295). The
              // leading ✕ keeps its chip chrome from the start.
              hideCenter={cosimoChat}
              // R15: the pill chrome exists while FETCHING; on landing it dissolves and
              // the bare avatar + "Cosimo" hold their spot (the nudge lands beneath).
              center={cosimoChat ? <CosimoPersonaPill visible={hasScrolled} done={aaFetchDone} /> : undefined}
              leadingScrolled={cosimoChat || hasScrolled}
              // While the safe-to-spend peek is open the parent renders its own fixed close at this exact
              // spot — hide the chat's so the two frosted chips don't overlap for a frame (flicker).
              leadingHidden={trackerHidden}
              onVoiceToggle={(v) => {
                // Every switch, the newly-picked character introduces themselves in the chat, escalating
                // with the switch count (Ryan ribs frequent flippers; Byron sours by the 4th). Past
                // messages stay frozen to their original voice (msgVoice); only new lines speak as `v`.
                if (v === voice) return;
                const bank = PERSONA_SWITCH_INTROS[v];
                const intro = bank[Math.min(switchCount, bank.length - 1)];
                setSwitchCount((c) => c + 1);
                // On the playground/explore step the chat body is a live event stream with a
                // persistent chip row below it — folding the intro after the whole step block
                // strands it under the chips at the bottom. Push it INTO the stream instead so it
                // slots in inline as the newest message and further exploring continues below it.
                if (stepIndex === PLAYGROUND_STEP_INDEX && !aaSkipped && !aaConnected) {
                  appendPlaygroundEvent({ kind: "switch-intro", voice: v, text: intro });
                } else {
                  // Elsewhere the stream is linear steps, so stamp the intro with the CURRENT step —
                  // it renders inline right after that step and later steps stack below it.
                  setSwitchIntros((prev) => [...prev, { voice: v, text: intro, atStep: stepIndex }]);
                }
                setVoice(v);
                // The big centre→fly-to-top reveal is ONLY the first-time "Meet Byron" moment. Plain
                // toggles after that just swap the app-bar avatar + drop an intro line (no takeover).
                revealLatest();
              }}
              trailing={cosimoChat && onViewFeed ? (
                // R14: no goal tracker in the cosimo chat. Once the feed beat lands
                // (the "View feed" pill is up), the slot carries a quiet 3-dot menu chip.
                potFunded && s2sPromptReady ? (
                  <div className="animate-chat-message-in" style={{ position: "relative", marginRight: 4 }}>
                    <button
                      type="button"
                      aria-label="Menu"
                      className="transition-transform active:scale-[0.94]"
                      style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: BG_SHEET, border: `1px solid ${OUTLINE_BOLD}`, boxShadow: ELEVATION_CARD, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, cursor: "pointer" }}
                    >
                      {/* the DLS kebab (same geometry as the feed's customise chip) */}
                      <svg width="16" height="4" viewBox="0 0 16 4" fill="none" aria-hidden="true">
                        <path d="M2 0C3.10857 0 4 0.891428 4 2C4 3.10857 3.10857 4 2 4C0.891428 4 0 3.10857 0 2C0 0.891429 0.891429 0 2 0Z" fill={TEXT_PRIMARY} />
                        <path d="M8 0C9.10857 0 10 0.891428 10 2C10 3.10857 9.10857 4 8 4C6.89143 4 6 3.10857 6 2C6 0.891429 6.89143 0 8 0Z" fill={TEXT_PRIMARY} />
                        <path d="M14 0C15.1086 0 16 0.891428 16 2C16 3.10857 15.1086 4 14 4C12.8914 4 12 3.10857 12 2C12 0.891429 12.8914 0 14 0Z" fill={TEXT_PRIMARY} />
                      </svg>
                    </button>
                  </div>
                ) : null
              ) : trackerLive ? (
                // Hide fades (covered by the morph ghost anyway) but the REVEAL is instant: on peek
                // close the ghost lands here and fades out — the chip must already be solid beneath
                // it, or both mid-fade over the chat = the crossfade dip (the settle flicker).
                <div style={{ position: "relative", marginRight: 4, opacity: trackerHidden ? 0 : 1, transition: trackerHidden ? "opacity 160ms ease" : "none", pointerEvents: trackerHidden ? "none" : "auto" }}>
                  <span aria-hidden className="tracker-halo" />
                  <div className="animate-tracker-land" ref={trackerRingRef}>
                    <GoalTracker
                      goals={[betaGoalData]}
                      onGoalTap={() => {}}
                      // Tapping the tracker opens the safe-to-spend screen. Beta peeks it OVER the chat
                      // (onOpenGoals) so back returns to the chat and onboarding never completes into the
                      // returning-user home; non-beta keeps the closeOverlay completion. GoalTracker's
                      // button calls onGoalListOpen, so this is the handler that makes the chip clickable.
                      onGoalListOpen={() => {
                        setTrackerCoachmark(false);
                        if (betaIntentFirst && onOpenGoals) { onOpenGoals(trackerRingRef.current?.getBoundingClientRect(), betaGoalData, spendingPlan.categoryBudgets); }
                        // Cosimo (no peek handler wired yet): just minimize to the sim's home — completing
                        // onboarding here would UNMOUNT the sim, and reopening lands in the returning-user
                        // chat, a completely different state. The pill restores this exact chat.
                        else if (cosimoChat) { closeOverlay(); }
                        else { openGoalOnCloseRef.current = true; closeOverlay(); }
                      }}
                      singleVariant="amount"
                      // Shows SPENT-this-month (not safe), matching the L1 hero + the peek-morph ghost:
                      // all three now read the same number with the same draining ring, so the chip and
                      // hero never disagree (they diverged once a pace tier changed the budget — safe
                      // dropped while spent held, which read as "the numbers are all different").
                      centerLabel={formatCompactK(s2sSnap.spent)}
                      frosted
                    />
                  </div>
                </div>
              ) : cosimoChat && !trackerHidden ? (
                // Cosimo chat: no chip in this slot (R14 — the privacy shield was
                // removed; the tracker still takes the slot once live, branch above).
                null
              ) : (config?.betaSkipAa && (!aaFetchDone || cruncherTickHold) && betaIntentFirst && !trackerHidden ? (
                // Pitch: while the money cruncher runs in the background, this top-right slot carries a
                // compact progress chip (the pinned banner is gone — same spot the spend ring lives in
                // later). Tap shows the current fetch status; on completion the lock chip returns and
                // Ryan asks "ready to build your plan?" in the chat.
                <div style={{ position: "relative", marginRight: 4 }}>
                  <button
                    type="button"
                    onClick={() => setLockedTip((v) => !v)}
                    aria-label="Securely reading your accounts"
                    className="transition-transform active:scale-[0.94]"
                    style={{ position: "relative", width: 48, height: 48, borderRadius: "50%", backgroundColor: BG_SHEET, border: `1px solid ${OUTLINE_BOLD}`, boxShadow: ELEVATION_CARD, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, cursor: "pointer" }}
                  >
                    {/* Working ring + a slow-climbing percentage (double digits, small + bold);
                        completion swaps to a tick and holds a beat before the lock returns. */}
                    {aaFetchDone ? (
                      <>
                        <svg width={36} height={36} viewBox="0 0 36 36" fill="none" aria-hidden="true" style={{ position: "absolute", top: 5, left: 5 }}>
                          <circle cx="18" cy="18" r="15" stroke={MAIN_PRIMARY} strokeWidth="2.5" />
                        </svg>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M5 13l4 4L19 7" stroke={MAIN_PRIMARY} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <svg className="animate-spin" width={36} height={36} viewBox="0 0 36 36" fill="none" aria-hidden="true" style={{ position: "absolute", top: 5, left: 5 }}>
                          <circle cx="18" cy="18" r="15" stroke={OUTLINE_SUBTLE} strokeWidth="2.5" />
                          <path d="M18 3a15 15 0 0 1 15 15" stroke={MAIN_PRIMARY} strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                        <span style={{ fontSize: 10, fontWeight: 700, color: TEXT_SECONDARY, fontVariantNumeric: "tabular-nums" }}>{aaFetchPct}%</span>
                      </>
                    )}
                  </button>
                  {lockedTip && (
                    <div className="tooltip-slide-fade" style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 40, pointerEvents: "none" }}>
                      <Tooltip text={aaFetchStatus} orientation="top-right" width={280} textAlign="left" />
                    </div>
                  )}
                </div>
              ) : betaIntentFirst && !trackerHidden ? (
                // Before the tracker unlocks, a locked chip sits top-right from the start — goal planning
                // stays locked until the user connects. It becomes the live tracker once the goal's set.
                <div style={{ position: "relative", marginRight: 4 }}>
                  {/* Same 48px chip as the live tracker, but locked: a clean solid chip with just a lock
                      glyph centred on it. Tapping keeps it a secret — a playful tooltip, no spoiler. */}
                  <button
                    type="button"
                    onClick={() => setLockedTip((v) => !v)}
                    aria-label="Locked — connect your accounts to unlock"
                    className="transition-transform active:scale-[0.94]"
                    style={{ position: "relative", width: 48, height: 48, borderRadius: "50%", backgroundColor: BG_SHEET, border: `1px solid ${OUTLINE_BOLD}`, boxShadow: ELEVATION_CARD, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, cursor: "pointer" }}
                  >
                    <svg width={20} height={22} viewBox="0 0 16 18" fill="none" aria-hidden="true">
                      <rect x={3} y={8} width={10} height={7} rx={1.6} stroke={TEXT_SECONDARY} strokeWidth={1.4} />
                      <path d="M5.5 8V5.5a2.5 2.5 0 0 1 5 0V8" stroke={TEXT_SECONDARY} strokeWidth={1.4} strokeLinecap="round" />
                    </svg>
                  </button>
                  {lockedTip && (
                    <div className="tooltip-slide-fade" style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 40, pointerEvents: "none" }}>
                      <Tooltip text="This unlocks when you set up a goal." orientation="top-right" width={280} textAlign="left" />
                    </div>
                  )}
                </div>
              ) : undefined)}
            />

            {/* Unlock-key flight — the key lifts off the tapped card and lands on the CENTER of the
                locked tracker chip (44 status + 8 pad + 24 = 76px down, 8 + 4 + 24 = 36px from the
                right), shrinking to chip scale and dissolving as the lock opens into the live tracker. */}
            {keyFly && (
              <div className="absolute inset-0" style={{ zIndex: 60, pointerEvents: "none" }}>
                <div
                  style={{
                    position: "absolute",
                    // Canon 484:3566: the key TILTS (~40°) as it rises to the lock chip's corner and
                    // stays fully visible through the flight — it only fades as the lock opens.
                    left: keyFlyGo ? "calc(100% - 40px)" : "50%",
                    top: keyFlyGo ? "80px" : "70%",
                    transform: `translate(-50%, -50%) scale(${keyFlyGo ? 0.52 : 1}) rotate(${keyFlyGo ? "40deg" : "0deg"})`,
                    opacity: keyFlyGo ? 0 : 1,
                    transition: "left 640ms cubic-bezier(0.22, 1, 0.36, 1), top 640ms cubic-bezier(0.22, 1, 0.36, 1), transform 640ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease 620ms",
                  }}
                >
                  <img src={KEY_IMG} alt="" aria-hidden="true" width={72} height={72} draggable={false} style={{ display: "block" }} />
                </div>
              </div>
            )}

            {/* Meet-Byron takeover — Byron reveals big in the centre, then flies up into the app bar.
                Sits above the chat + fades (z-55) but fades out as it reaches the top, handing off to
                the app-bar Byron pill that appears beneath it. */}
            {byronReveal !== "idle" && byronReveal !== "done" && (
              <div className="absolute inset-0" style={{ zIndex: 55, pointerEvents: "none" }}>
                {/* Frosted scrim: blurs + lightly washes the chat during the reveal, clearing as Byron lifts off */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${BG_PRIMARY} 52%, transparent)`,
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    opacity: byronReveal === "center" ? 1 : 0,
                    transition: "opacity 420ms ease",
                  }}
                />
                {/* Name + his intro line — fade in during the centre hold and fade out on lift-off; they
                    don't travel, only the avatar glides up. He introduces himself before settling. */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "53%",
                    textAlign: "center",
                    padding: "0 24px",
                    opacity: byronReveal === "center" && byronRevealIn ? 1 : 0,
                    transform: byronReveal === "center" && byronRevealIn ? "translateY(0)" : "translateY(6px)",
                    transition: "opacity 260ms ease, transform 260ms ease",
                  }}
                >
                  <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0 }}>Byron</p>
                  <p style={{ ...typography.bodySmall, color: TEXT_SECONDARY, margin: "6px 0 0" }}>
                    the honest one. i say what ryan won&apos;t.
                  </p>
                </div>
                {/* Avatar — glides from centre up into the app-bar pill and settles (not thrown): a long
                    decelerating ease, fading only in the last stretch as the bar's Byron takes over. */}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: byronReveal === "flyup" ? "20%" : "40%",
                    transform: `translate(-50%, -50%) scale(${byronReveal === "flyup" ? 0.4 : byronRevealIn ? 1 : 0.82})`,
                    opacity: byronReveal === "flyup" ? 0 : byronRevealIn ? 1 : 0,
                    // Fade out EARLY into the lift (starts ~80ms in over 320ms) so Byron dissolves partway
                    // up rather than travelling all the way to the app bar and popping.
                    transition: `top 720ms cubic-bezier(0.22, 1, 0.36, 1), transform 720ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${byronReveal === "flyup" ? "320ms ease 80ms" : "260ms ease"}`,
                  }}
                >
                  <img
                    src="/characters/byron.svg"
                    alt=""
                    width={104}
                    height={104}
                    style={{ borderRadius: "50%", boxShadow: ELEVATION_CARD }}
                  />
                </div>
              </div>
            )}

            {/* Attention coachmark — the DLS Tooltip (matches the Enhancements "Meet Ryan" tooltip),
                pointing up-right at the freshly-revealed tracker. Pops in, auto-dismisses (~5s), or
                clears on tap. The button is just a transparent tap target + positioning wrapper. */}
            {trackerLive && trackerCoachmark && (
              <button
                type="button"
                onClick={() => setTrackerCoachmark(false)}
                aria-label="After your goal and fixed spends, this is your monthly budget"
                className="absolute z-30 animate-share-pop"
                style={{
                  // Sit just below the app bar: ~108px tall on desktop (status bar + bar), or
                  // notch-inset + 64px bar on mobile (simulated status bar hidden there).
                  top: isMobile ? "calc(env(safe-area-inset-top) + 60px)" : 100,
                  // right offset so the tooltip's up-pointer lands under the ~32px-from-edge tracker centre
                  right: 18,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transformOrigin: "top right",
                }}
              >
                <Tooltip text="After your goal and fixed spends, here's your monthly budget" orientation="top-right" maxWidth={220} />
              </button>
            )}

            {/* Plan cruncher now renders inline in the chat flow (see the plan-crunching step
                render above), not as a floating overlay. */}

            {/* Connect-path cruncher: floats as an absolute overlay (a sibling of the scroller,
                anchored to this overlay) so the transaction mosaic scrolls under it. Persists
                through completion until the user dismisses it via the X. */}
            {overlayMounted && aaConnected && !connectCruncherDismissed && (
              <div className="absolute left-4 right-4 z-10" style={{ top: 120 }}>
                <PlanCruncherV2
                  goalName={connectSyncDone ? "All done" : "Reading your transactions"}
                  visible
                  statusText={connectSyncStatus}
                  completed={connectSyncDone}
                  completedSubtitle="Your spending snapshot is ready"
                  onDismiss={() => setConnectCruncherDismissed(true)}
                />
              </div>
            )}

            {overlayMounted && (
              <>
                {/* Top fade gradient - visible on scroll */}
                {cosimoChat ? (
                  // ── Cosimo scrim (canon 796:6325) — a PROGRESSIVE backdrop blur + translucent white
                  // tint: scrolled content ghosts through, blurred hard at the top and progressively
                  // less toward the scrim's edge (stacked backdrop-filter layers, each masked to its
                  // own band). Deepens (140 → 208) when the sync-done nudge card pins under the bar.
                  <div
                    className="absolute left-0 right-0 z-[9]"
                    style={{
                      top: 0,
                      // Sized to end just past the chrome (status 44 + bar 64 = 108; pinned card
                      // bottom ≈ 180) — any taller and the wash swallows the first message under
                      // the bar (sent bubbles were unreadable at 140/208).
                      height: aaFetchDone && stepIndex <= PLAYGROUND_STEP_INDEX
                        ? (isMobile ? "calc(env(safe-area-inset-top) + 144px)" : 196)
                        : (isMobile ? "calc(env(safe-area-inset-top) + 70px)" : 118),
                      pointerEvents: "none",
                      opacity: hasScrolled ? 1 : 0,
                      transition: "opacity 200ms ease, height 220ms ease",
                    }}
                  >
                    {[
                      { blur: 16, mask: "linear-gradient(to bottom, black 0%, black 45%, transparent 72%)" },
                      { blur: 8, mask: "linear-gradient(to bottom, black 35%, transparent 86%)" },
                      { blur: 3, mask: "linear-gradient(to bottom, transparent 40%, black 62%, transparent 96%)" },
                    ].map((l) => (
                      <div
                        key={l.blur}
                        style={{
                          position: "absolute",
                          inset: 0,
                          backdropFilter: `blur(${l.blur}px)`,
                          WebkitBackdropFilter: `blur(${l.blur}px)`,
                          maskImage: l.mask,
                          WebkitMaskImage: l.mask,
                        }}
                      />
                    ))}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to bottom, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.7) 95%, rgba(255,255,255,0) 100%)",
                      }}
                    />
                  </div>
                ) : (
                  <div
                    className="absolute left-0 right-0 z-[9]"
                    style={{
                      top: 0,
                      // Desktop: 140px covers the status bar + 108px app bar then tapers. Mobile: the
                      // simulated status bar is gone and the app bar is only ~64px (below the notch),
                      // so the desktop fade over-extends into the chat — size it to the notch + bar.
                      height: isMobile ? "calc(env(safe-area-inset-top) + 72px)" : 132,
                      pointerEvents: "none",
                      // Flat (linear top→bottom) so the fade boundary is horizontal across the full
                      // width, not a curved ellipse. Solid backs the app-bar/title band (~104px, solid
                      // to 74%); the remaining ~36px is a long, gentle taper to transparent so the
                      // dissolve into the chat reads soft, not a hard edge. Covers text scrolling under
                      // the (transparent) bar without greying the first row (only shows once scrolled).
                      background: `linear-gradient(to bottom, ${BG_PRIMARY} 0%, ${BG_PRIMARY} 74%, transparent 100%)`,
                      opacity: hasScrolled ? 1 : 0,
                      transition: "opacity 200ms ease",
                    }}
                  />
                )}

                {/* Pinned sync-done nudge (canon 812:5929) — once the fetch lands, the "Transaction
                    data updated / Start your goal plan" card PINS under the app bar while the chat is
                    scrolled, so the Start CTA stays reachable even with the in-flow card off-screen.
                    Gone after Start (the goal flow is underway). */}
                {cosimoChat && hasScrolled && aaFetchDone && stepIndex <= PLAYGROUND_STEP_INDEX && (
                  <div
                    className="absolute left-0 right-0 z-10 flex justify-center"
                    style={{
                      top: isMobile ? "calc(env(safe-area-inset-top) + 72px)" : 116,
                      // Grows out of the pill's fetching state (delay lets the pill resolve first).
                      transformOrigin: "top center",
                      animation: "cosimoCardFromPill 380ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both",
                    }}
                  >
                    <div style={{ width: 328, maxWidth: "calc(100% - 32px)" }}>
                      <CosimoFetchCard done showStart active={false} onStart={handleCosimoStart} />
                    </div>
                  </div>
                )}

                {/* "Can't build your plan yet" escape (canon 414:1027) — bills exceed the income we can
                    see, so the plan build blocks on this card docked above the input. Connect (mocked)
                    resolves the gap and the build carries on; Exit abandons to home. */}
                {planDataGap && !planGapResolved && STEPS[stepIndex]?.kind === "build-plan" && buildPlanStage >= BUILD_PLAN_STAGES.length && (
                  <div className="absolute left-0 right-0 z-20 flex justify-center animate-chat-message-in" style={{ bottom: 88 }}>
                    <div
                      style={{
                        width: 320,
                        maxWidth: "calc(100% - 40px)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 20,
                        backgroundColor: BG_CARD,
                        border: `1px solid ${OUTLINE_SUBTLE}`,
                        borderRadius: RADIUS_M,
                        padding: 24,
                        boxShadow: ELEVATION_CARD,
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <p style={{ ...typography.headerH3, color: TEXT_PRIMARY, margin: 0 }}>Can&apos;t build your plan yet</p>
                        <p style={{ ...typography.bodySmall, color: TEXT_SECONDARY, margin: 0 }}>
                          Your monthly commitments exceed the income that we can see. That usually means a missing income source
                        </p>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                        <button
                          type="button"
                          onClick={() => { setPlanGapResolved(true); setUserActionCount((c) => c + 1); }}
                          className="transition-transform active:scale-[0.97]"
                          style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, backgroundColor: SLATE_10, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_CIRCLE, padding: "8px 16px", cursor: "pointer" }}
                        >
                          Connect more accounts
                        </button>
                        <button
                          type="button"
                          onClick={closeOverlay}
                          className="transition-transform active:scale-[0.97]"
                          style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, backgroundColor: SLATE_10, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_CIRCLE, padding: "8px 16px", cursor: "pointer" }}
                        >
                          Exit
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {chatContent}

                {/* Scroll-to-bottom pill */}
                <JumpToRecentPill
                  visible={hasContentBelow}
                  onClick={() => {
                    const scroller = scrollRef.current;
                    if (scroller) scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
                  }}
                  // chatLift keeps the pill above the risen bar (suggestions sheet / keyboard);
                  // the +8 on each base tracks the bar's bottom padding going 16 → 24.
                  bottom={(footprintSheetBucket != null ? 412 : (prefQuizOpen || ladderQuizOpen || buildPlanPendingQ != null) ? 344 : 96) + chatLift}
                />

                {/* Unified bottom chrome stack: snackbar slot sits at the top
                    of this column so it always renders just above whichever
                    chrome is active (questionnaire / input bar / gesture
                    nav). Composing via flex means we don't hard-code offsets
                    per case. */}
                {/* Bottom fade gradient - mirrors the top fade so messages fade
                    out into the input area. Sits behind the chat input /
                    suggestion buttons, edge-to-edge, same softness as the top. */}
                <div
                  className="absolute left-0 right-0 z-[9]"
                  style={{
                    bottom: 0,
                    // Backs the input chrome with a short taper that goes fully transparent BELOW the
                    // chat text (height 54, solid to 70%) so the last message isn't greyed/covered.
                    height: 54,
                    pointerEvents: "none",
                    background: `linear-gradient(to top, ${BG_PRIMARY} 0%, ${BG_PRIMARY} 70%, transparent 100%)`,
                    // Rides chatLift — i.e. whatever raised the bar, keyboard OR sheet — so the
                    // message box keeps the same soft white backing in every state (canon's
                    // #fefefe bar strip). Tying it to the keyboard alone left the bar unbacked
                    // with the sheet open and chat content bled around it.
                    transform: chatLift ? `translateY(${-chatLift}px)` : "translateY(0)",
                    transition: "transform 250ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />

                {/* Suggestions sheet scrim — invisible, tap anywhere outside the sheet to
                    collapse it. The sheet itself docks inside the bottom chrome (canon
                    1057:12831: the input bar rides up as the sheet grows beneath it). */}
                {suggestMenuOpen && (
                  <button
                    type="button"
                    aria-label="Close suggestions"
                    onClick={() => setSuggestMenuOpen(false)}
                    className="absolute inset-0"
                    style={{ background: "transparent", border: "none", padding: 0, cursor: "default", zIndex: 10 }}
                  />
                )}

                <div
                  className="absolute bottom-0 left-0 right-0 z-20 flex flex-col"
                  style={{
                    // Rides the keyboard: matches MockKeyboard's slide exactly (same duration +
                    // curve) so bar and keyboard travel as one surface; on a phone it follows
                    // the native keyboard's visual-viewport inset with the same easing.
                    transform: kbLift ? `translateY(${-kbLift}px)` : "translateY(0)",
                    transition: "transform 250ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}>
                  <SnackbarSlotTarget />
                  {footprintSheetBucket != null ? (
                    // Beta footprint bucket confirmed via a DLS bottom sheet that AUTO-OPENS as the step
                    // arrives (no chip, no dismiss X). The card floats ABOVE the real chat input; typing a
                    // change there ("rent 20k") routes into the card. "Looks right" captures + advances.
                    <div className="flex flex-col" style={{ pointerEvents: "auto" }}>
                      {/* Keyed per bucket so each step's sheet REMOUNTS: the grow-up entrance replays and
                          the receipt fades in fresh (no instant content swap, no state bleed across buckets). */}
                      <ChatCard
                        key={`footprint-sheet-${footprintSheetBucket}`}
                        card={{
                          ...BUCKET_CONFIRM_LIST[footprintSheetBucket],
                          variant: "sheet",
                          defaultAllSelected: true,
                          chatEdit: footprintChatEdit,
                          onSubmit: (result) => {
                            const bucket = footprintSheetBucket;
                            setFootprintResults((prev) => ({ ...prev, [bucket]: result }));
                            setFootprintConfirmed((prev) => {
                              const next = new Set(prev);
                              next.add(bucket);
                              return next;
                            });
                            setFootprintSheetBucket(null);
                            setFootprintChatDraft("");
                            setFootprintChatEdit(null);
                            advanceStep();
                          },
                        }}
                      />
                      <TypeBox
                        orb={cosimoChat}
                        value={footprintChatDraft}
                        onChange={setFootprintChatDraft}
                        onSubmit={() => {
                          const t = footprintChatDraft.trim();
                          if (!t) return;
                          setFootprintChatEdit((p) => ({ seq: (p?.seq ?? 0) + 1, text: t }));
                          setFootprintChatDraft("");
                        }}
                        placeholder="Suggest a change…"
                      />
                    </div>
                  ) : buildPlanPendingQ ? (
                    // Build-plan ambiguity: an EXPLICIT bottom sheet — the plan build runs in the
                    // background and pauses on this answer, so the ask blocks visibly. Value hierarchy
                    // (source · amount · prompt) + Yes/No, with the chat input below (typed yes/no works).
                    <div className="flex flex-col" style={{ pointerEvents: "auto" }}>
                      {/* Cosimo: the card sits 8px above the composer (was SHEET_DOCK_BOTTOM). */}
                      <div className="questionnaire-overlay-entrance" style={{ padding: `0 16px ${cosimoChat ? 8 : SHEET_DOCK_BOTTOM}px` }}>
                        <div style={{ backgroundColor: BG_SHEET, borderRadius: cosimoChat ? RADIUS_L : RADIUS_M, border: `1px solid ${OUTLINE_SUBTLE}`, overflow: "hidden", boxShadow: cosimoChat ? ELEVATION_CARD : undefined }}>
                          {cosimoChat ? (
                            // Canon 433:1225 — ONE bold line ("₹8,500 from Dad", H3) with the question as
                            // a small secondary subtitle, then a hairline into the option rows.
                            <div style={{ padding: `${SPACE_L}px ${SPACE_L}px 0` }}>
                              <p style={{ ...typography.headerH3, color: TEXT_PRIMARY, margin: 0 }}>{`${buildPlanPendingQ.value} from ${buildPlanPendingQ.source}`}</p>
                              <p style={{ ...typography.bodySmall, color: TEXT_SECONDARY, margin: "6px 0 0" }}>{buildPlanPendingQ.prompt}</p>
                              <div aria-hidden style={{ height: 1, backgroundColor: OUTLINE_SUBTLE, marginTop: SPACE_L }} />
                            </div>
                          ) : (
                            /* Value hierarchy header — same language as the viz cards (caption label +
                               headerH1 number), with the QUESTION at questionnaire-heading size. */
                            <div style={{ padding: `${SPACE_L}px ${SPACE_L}px ${SPACE_M}px` }}>
                              <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: 0 }}>{buildPlanPendingQ.source}</p>
                              <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: "4px 0 0" }}>{buildPlanPendingQ.value}</p>
                              <p style={{ ...typography.headerH3, color: TEXT_PRIMARY, margin: `${SPACE_M}px 0 0` }}>{buildPlanPendingQ.prompt}</p>
                            </div>
                          )}
                          {/* Options as stacked full-width rows with trailing radios — the same option
                              language the goal-questionnaire sheet uses (not pill chips). */}
                          <div style={{ paddingBottom: SPACE_S }}>
                            {([{ v: "yes" as const, label: buildPlanPendingQ.yes }, { v: "no" as const, label: buildPlanPendingQ.no }]).map((o) => (
                              <button
                                key={o.v}
                                type="button"
                                onClick={() => answerBuildPlan(buildPlanPendingQ.id, o.v)}
                                className="flex w-full items-center text-left transition-colors duration-150"
                                style={{ padding: `16px ${SPACE_L}px`, gap: 12, background: "transparent", border: "none", cursor: "pointer" }}
                              >
                                <span className="flex-1" style={{ ...typography.bodyNormal, color: TEXT_PRIMARY }}>{o.label}</span>
                                <div className="shrink-0 flex items-center justify-center" style={{ width: 32 }}>
                                  <div style={{ width: 24, height: 24, borderRadius: RADIUS_CIRCLE, border: `2px solid ${OUTLINE_BOLD}` }} />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <TypeBox
                        orb={cosimoChat}
                        value={sheetReplyDraft}
                        onChange={setSheetReplyDraft}
                        onSubmit={() => {
                          const t = sheetReplyDraft.trim().toLowerCase();
                          setSheetReplyDraft("");
                          if (!t) return;
                          if (/^(y|yes|yeah|yep|count|sure|ok|okay|1)/.test(t)) answerBuildPlan(buildPlanPendingQ.id, "yes");
                          else if (/^(n|no|nope|nah|skip|leave|2)/.test(t)) answerBuildPlan(buildPlanPendingQ.id, "no");
                        }}
                        placeholder={`Reply to ${assistantName}...`}
                      />
                    </div>
                  ) : budgetSheetOpen && !conversational ? (
                    // Budget lives IN THE CHAT now — the dock only offers the real input for
                    // conversational cap edits ("food 6k" retargets a cap on the inline card).
                    // Conversational mode keeps the ROUTED walkthrough input instead (yes confirms,
                    // "food 6k" edits) — this dedicated box would swallow the confirmation.
                    <div style={{ pointerEvents: "auto" }}>
                      <TypeBox
                        orb={cosimoChat}
                        value={budgetEditDraft}
                        onChange={setBudgetEditDraft}
                        onSubmit={() => { const t = budgetEditDraft.trim(); if (!t) return; applyBudgetEdit(t); }}
                        placeholder="Suggest a change…"
                      />
                    </div>
                  ) : prefQuizOpen ? (
                    <div className="flex flex-col" style={{ pointerEvents: "auto" }}>
                      {/* Claude-style: EVERY goal follow-up is asked in this sheet (options + free text);
                          each answer echoes upfront in the chat above. Beta = must-answer (no dismiss X,
                          no pager); non-beta keeps the X + pager. */}
                      <QuestionnaireOverlay
                        questions={prefQuestions}
                        currentIndex={prefQuizIndex}
                        answers={prefAnswers}
                        onSelectOption={handlePrefSelect}
                        onSubmitFreeText={handlePrefFreeText}
                        onNavigate={handlePrefNavigate}
                        onClose={betaIntentFirst ? undefined : handlePrefClose}
                        pager={!betaIntentFirst}
                        hideFreeText={betaIntentFirst}
                      />
                      {/* Docked message box, kept below the options like the savings-tier sheet. A typed
                          answer routes to the current question (answers free-text ones like "where to?"). */}
                      {betaIntentFirst && (
                        <TypeBox
                          orb={cosimoChat}
                          value={sheetReplyDraft}
                          onChange={setSheetReplyDraft}
                          onSubmit={() => {
                            const t = sheetReplyDraft.trim();
                            if (!t) return;
                            const q = prefQuestions[prefQuizIndex];
                            if (q) handlePrefFreeText(q.id, t);
                            setSheetReplyDraft("");
                          }}
                          placeholder={`Reply to ${assistantName}...`}
                        />
                      )}
                    </div>
                  ) : ladderQuizOpen ? (
                    <div className="flex flex-col" style={{ pointerEvents: "auto" }}>
                      <QuestionnaireOverlay
                        questions={[SAVINGS_TIER_QUESTION]}
                        currentIndex={0}
                        answers={ladderTier ? { [SAVINGS_TIER_QUESTION.id]: ladderTier } : {}}
                        onSelectOption={(_qId, opt) => {
                          setLadderTier(opt.id as LadderTier);
                          setLadderQuizOpen(false);
                          setLadderReplyDraft("");
                          setUserActionCount((c) => c + 1);
                          advanceStep();
                        }}
                        onSubmitFreeText={() => {}}
                        onNavigate={() => {}}
                        // Beta: must-answer sheet (no dismiss X, no reopen loop); non-beta keeps the X.
                        onClose={betaIntentFirst ? undefined : () => setLadderQuizOpen(false)}
                      />
                      {/* Docked chat input, matching the footprint sheets — the tier is picked via the
                          chips above, so this is an inert conversational reply bar. */}
                      <TypeBox
                        orb={cosimoChat}
                        value={ladderReplyDraft}
                        onChange={setLadderReplyDraft}
                        onSubmit={() => setLadderReplyDraft("")}
                        placeholder={`Reply to ${assistantName}...`}
                      />
                    </div>
                  ) : (lockInChoice === "tweak" && !tweakSubmitted) ? (
                    // User picked "Tweak something" — give them a real input
                    // bar so they can type what to change before the plan is
                    // committed.
                    <div style={{ pointerEvents: 'auto' }}>
                      <TypeBox
                        orb={cosimoChat}
                        value={tweakDraft}
                        onChange={setTweakDraft}
                        onSubmit={() => {
                          if (!tweakDraft.trim()) return;
                          setTweakSubmitted(true);
                          setUserActionCount((c) => c + 1);
                        }}
                        placeholder={`Reply to ${assistantName}...`}
                      />
                    </div>
                  ) : terminalAtAa ? (
                    // Jun 11 terminal path. The AA prompt is a conversational turn too —
                    // Ryan has just asked to connect — so keep an inert reply bar present
                    // (like the rest of the walkthrough) rather than dead-ending on a bare
                    // gesture nav. Once skipped/connected it becomes the open-ended mosaic bar.
                    !(aaSkipped || aaConnected) ? (
                      <TypeBox
                        orb={cosimoChat}
                        value={walkthroughDraft}
                        onChange={setWalkthroughDraft}
                        onSubmit={() => setWalkthroughDraft("")}
                        placeholder={`Reply to ${assistantName}...`}
                      />
                    ) : (
                    // Terminal mosaic: open-ended "Ask Ryan" bar — the shared SuggestSheetBar
                    // (canon 1057:12831): the widgets button expands the footer into the white
                    // suggestions sheet; rows fire the same actions as the skip-mosaic tiles.
                    <SuggestSheetBar
                      value={walkthroughDraft}
                      onChange={setWalkthroughDraft}
                      onSubmit={() => setWalkthroughDraft("")}
                      placeholder={`Ask ${assistantName}...`}
                      rollingSuggestions={WALKTHROUGH_SUGGESTIONS}
                      open={suggestMenuOpen}
                      // Snapshot the reading position before the lift moves anything.
                      onOpenChange={(open) => { noteWillLift(); setSuggestMenuOpen(open); }}
                      onFocusChange={(f) => { noteWillLift(); setChatKbFocused(f); }}
                      buttonReady={suggestBtnReady}
                      onPickRow={(row) => {
                        if (row.key === "connect") setAaFlowOpen(true);
                        else pickSpendTile(row.key);
                      }}
                      onListHeightChange={setSuggestListH}
                    />
                    )
                  ) : (conversational || stepIndex > PREFERENCES_STEP_INDEX) ? (
                    // Money walkthrough onward: surface the chat input bar so the conversation
                    // always feels typeable. Beta makes it real — what you type appears as a
                    // user bubble (handleWalkthroughSubmit); other personas stay inert.
                    // Conversational: the input is up from the FIRST message (it's the only way to
                    // answer), and the placeholder hints at what Ryan just asked.
                    <TypeBox
                      orb={cosimoChat}
                      // R16: setup done → the message box ITSELF morphs into the magic
                      // "View feed" pill — same box, same position, contents swap in place.
                      cta={cosimoChat && onViewFeed && potFunded && s2sPromptReady && !s2sUnlocked ? { label: "View feed", onPress: onViewFeed } : undefined}
                      value={walkthroughDraft}
                      onChange={setWalkthroughDraft}
                      onSubmit={handleWalkthroughSubmit}
                      // ONE contextual suggestion, shown plain (it's an option, not an instruction) —
                      // SPACE or a tap on the focused empty box fills it; Enter/button sends.
                      placeholder={
                        conversational && conversationalSuggestion
                          ? conversationalSuggestion
                          : cosimoChat
                            ? (STEPS[stepIndex]?.kind === "preferences" && prefQuestions[prefQuizIndex]?.id === "goal-type" && !prefAnswers["goal-type"]
                                ? "Enter saving goal" // canon 882:5873 — free-form hint under the goal picker
                                : "Ask Cosimo") // canon 796:6293 (frame says "Ask Ryan" — stale persona name)
                            : `Reply to ${assistantName}...`
                      }
                      spaceSuggestion={conversational ? conversationalSuggestion ?? undefined : undefined}
                    />
                  ) : (
                    // Default: just the gesture nav. The lock-in path keeps
                    // the chat open until the user closes the overlay.
                    <GestureNav backgroundColor="transparent" />
                  )}
                </div>

                {/* Desktop keyboard sim (canon Keyboard/iOS): slides in when the terminal chat
                    input focuses, and the bottom chrome above rides it via kbLift. Real phones
                    skip the mock — the native keyboard appears and kbLift follows the visual
                    viewport instead, so the two never double up. */}
                {!isMobile && <MockKeyboard visible={keyboardVisible} />}
              </>
            )}
          </SnackbarSlotProvider>
        )}
      </div>

      {/* Layer: Atom creation page (canon deployment) — slides up over the chat; confirming flips
          the chat's contribution/autopay card to its ticked done state (484:3090). */}
      {atomPageOpen && (
        <div className="absolute inset-0 z-30">
          <AtomCreateScreen
            // Keyed by mode: flipping one-time → autopay without an unmount in between would keep
            // the previous instance's amount state (stale head start shown as the monthly).
            key={atomPageOpen}
            mode={atomPageOpen}
            baseAmount={atomPageOpen === "one-time" ? (headStart != null && headStart > 0 ? headStart : HEAD_START_AMOUNT) : savingsAmount}
            potLabel={potLabel}
            onBack={() => setAtomPageOpen(null)}
            onConfirm={(amt) => {
              setAtomPageOpen(null);
              if (atomPageOpen === "one-time") {
                // Configure → the "creating your atom" takeover runs → Done flips the chat card.
                setHeadStart(amt);
                setAtomFlow({ amount: amt, stage: "processing" });
              } else {
                setFundConfirmLabel("Setup");
                setPotFunded(true);
                // Anchor the autopay section ("Your atom is ready" + ticked card) at the TOP once
                // the takeover clears, and hold the follower off while the wrap-up streams beneath.
                suppressChatFollowUntil = Date.now() + 6000;
                requestAnimationFrame(() => requestAnimationFrame(() => {
                  if (autopaySectionRef.current) snapScrollTo(autopaySectionRef.current, 0);
                }));
              }
            }}
          />
        </div>
      )}

      {/* Layer 2: Wrapped story - fade crossfade */}
      {storyOpen && (
        <div
          className="absolute inset-0 z-30"
          style={{
            // Pure opacity crossfade — NO scale. scale(0.97) was shifting WrappedStory's close
            // button off the (pixel-identical) chat close beneath it during the transition, which
            // read as a doubled / left-shifted cross. Fading in place keeps it one steady cross.
            opacity: storyPhase === "expanding" || storyPhase === "collapsing" ? 0 : 1,
            transition: "opacity 250ms ease",
          }}
        >
          <WrappedStory onClose={closeStory} startFromBeat={revealedCount} reviewBeatIndex={reviewBeatIndex} />
        </div>
      )}

      {/* Layer 2.5: Atom creation (pitch lump-sum) — a mock two-page takeover. Page 1 spins while the
          "atom" is created, page 2 confirms; Done banks the head start and returns to the chat, which
          then continues (receipt + budget). Rises from the bottom like the linking flow. */}
      {atomFlow && (
        <div className="absolute inset-0 z-30" style={{ backgroundColor: BG_PRIMARY, animation: "pitchSlideInUp 380ms cubic-bezier(0.22, 1, 0.36, 1) both" }}>
          <StatusBar backgroundColor={BG_PRIMARY} />
          <div className="flex flex-col items-center justify-center text-center" style={{ position: "absolute", inset: 0, paddingLeft: SPACE_XL, paddingRight: SPACE_XL, gap: SPACE_L }}>
            {atomFlow.stage === "processing" ? (
              <>
                <div className="animate-spin" style={{ width: 56, height: 56, borderRadius: RADIUS_CIRCLE, border: `4px solid ${OUTLINE_SUBTLE}`, borderTopColor: MAIN_PRIMARY }} />
                <div className="flex flex-col" style={{ gap: SPACE_XS }}>
                  <h1 style={{ ...typography.headerH2, color: TEXT_PRIMARY, margin: 0 }}>Creating your atom</h1>
                  <p style={{ ...typography.bodyNormal, color: TEXT_SECONDARY, margin: 0 }}>
                    Moving {formatINR(atomFlow.amount)} from Savings xx1234
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="animate-chat-message-in" style={{ width: 56, height: 56, borderRadius: RADIUS_CIRCLE, backgroundColor: MAIN_PRIMARY, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke={TEXT_ON_COLOR_PRIMARY} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div className="flex flex-col animate-chat-message-in" style={{ gap: SPACE_XS }}>
                  <h1 style={{ ...typography.headerH2, color: TEXT_PRIMARY, margin: 0 }}>Atom created</h1>
                  <p style={{ ...typography.bodyNormal, color: TEXT_SECONDARY, margin: 0 }}>
                    {formatINR(atomFlow.amount)} parked for {potLabel}
                  </p>
                </div>
              </>
            )}
          </div>
          {atomFlow.stage === "done" && (
            <div className="absolute left-0 right-0 flex flex-col items-center animate-chat-message-in" style={{ bottom: 28, paddingLeft: SPACE_L, paddingRight: SPACE_L }}>
              <button
                type="button"
                onClick={() => {
                  // The deferred head start finished creating its atom — mark it settled (the chat's
                  // receipt + autopay follow) and return to the lock-in step. Cosimo: the chat card
                  // flips to its ticked done state instead (canon 484:3090).
                  fundedAmountRef.current = atomFlow.amount;
                  setAtomFlow(null);
                  setLumpSettled(true);
                  if (cosimoChat) setAtomCreated(true);
                  // Anchor the freshly-ticked contribution card at the TOP of the chat (below the
                  // chrome) so the autopay beat reads below it — the bubble snap left it stranded.
                  // The follower stays off while the section streams into view beneath the anchor
                  // (its card mounting used to yank the page back down — the reported glitch).
                  suppressChatFollowUntil = Date.now() + 6000;
                  requestAnimationFrame(() => requestAnimationFrame(() => {
                    if (atomCardRef.current) snapScrollTo(atomCardRef.current, 0);
                    else setUserActionCount((c) => c + 1);
                  }));
                }}
                className="transition-transform active:scale-[0.98]"
                style={{ width: 312, maxWidth: "100%", height: 48, borderRadius: RADIUS_CIRCLE, backgroundColor: MAIN_PRIMARY, border: "none", cursor: "pointer", ...typography.buttonNormal, color: TEXT_ON_COLOR_PRIMARY }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}

      {/* Layer 3: AA flow */}
      <div
        className="absolute inset-0 z-30"
        style={{
          transform: aaFlowOpen ? "translateY(0%)" : "translateY(100%)",
          transition: `transform ${OVERLAY_DURATION}ms ${EASE}`,
          willChange: "transform",
          pointerEvents: aaFlowOpen ? "auto" : "none",
        }}
      >
        {aaFlowOpen && <AASim onComplete={handleAAComplete} onClose={handleAAClose} />}
      </div>

      {/* Layer 4: Big spends activity list */}
      <div
        className="absolute inset-0 z-30"
        style={{
          transform: bigSpends ? "translateY(0%)" : "translateY(100%)",
          transition: `transform ${OVERLAY_DURATION}ms ${EASE}`,
          willChange: "transform",
          pointerEvents: bigSpends ? "auto" : "none",
        }}
      >
        {lastBigSpendsRef.current && (
          <BigSpendsActivity
            title={lastBigSpendsRef.current.title}
            transactions={lastBigSpendsRef.current.transactions}
            onClose={closeBigSpends}
          />
        )}
      </div>
      </ChromeSuppressProvider>

      {/* ── Common, fixed chrome ──────────────────────────────────────────────
          One status bar + one gesture nav, hoisted above every overlay layer so
          they stay put while screens slide underneath (per-screen bars are
          suppressed to space-only via ChromeSuppressProvider). Shown only while an
          overlay covers the base PayScreen — which keeps its own brand chrome. */}
      {chromeVisible && (
        <>
          <div className="absolute top-0 left-0 right-0 z-40" style={{ pointerEvents: "none" }}>
            {/* White glyphs while the Valentino floor is still uncovered during the open
                slide; flips to themed (dark on light) once the overlay covers the top. */}
            <StatusBar backgroundColor="transparent" color={chromeSettled ? TEXT_PRIMARY : TEXT_ON_COLOR_PRIMARY} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-40" style={{ pointerEvents: "none" }}>
            <GestureNav backgroundColor="transparent" />
          </div>
        </>
      )}
    </div>
  );
}
