"use client";

import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback, type ReactNode } from "react";
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
  BG_GLASS,
  SLATE_10,
  CHAT_USER_BUBBLE,
  MAIN_PRIMARY,
  DECOR_TILE_VALENTINO,
  DECOR_TILE_BLUE,
  DECOR_TILE_ORANGE,
  DECOR_TILE_GREEN,
  DECOR_TILE_RED,
  TEXT_ON_COLOR_PRIMARY,
} from "../lib/colors";
import { SPACE_XS, SPACE_S, SPACE_M, SPACE_L } from "../lib/spacing";
import { RADIUS_S, RADIUS_M, RADIUS_CIRCLE } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";
import { StatusBar, GestureNav, ChatAppBar, ChromeSuppressProvider } from "../components/AppChrome";
import QuestionnaireOverlay from "../components/QuestionnaireOverlay";
import type { Question, QuestionOption } from "../components/QuestionnaireOverlay";
import PlanCruncherV2 from "../components/PlanCruncherV2";
import type { Persona } from "../components/PersonaToggle";
import { TypeBox, MosaicCard, type QuickAction } from "../components/Chat";
import { ILLUST_MY_SPENDS, ILLUST_FEEDBACK, ILLUST_AFFORD_IT } from "../lib/illustrations";
import ChatCard from "../components/ChatCards";
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
import {
  WRAPPED_BEATS,
  PRE_WRAPPED_BUBBLES,
  POST_WRAPPED_PRE_AA_BUBBLES,
  BETA_GOAL_INTRO,
  AA_LINKED_BUBBLE,
  BETA_BYRON_INTRO,
  BETA_BYRON_INTRO_SKIP,
  AA_ASK_SUGGESTIONS,
  GOAL_PREFERENCE_QUESTIONS,
  PLAYGROUND_INTRO_BUBBLES,
  BETA_PLAYGROUND_READY,
  BETA_AA_INTRO,
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
  LOCK_IN_CHIPS,
  LADDER_OPTIONS,
  SPENDING_PLAN_FIXTURE,
} from "./fixtures/gbpFlowFixture";
import { SAVINGS_TIER_QUESTION } from "./fixtures/savingsTierQuestion";
import type { LadderTier, BetaStepId } from "../lib/types";

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
  trailing,
}: {
  onClose: () => void;
  navKind?: "close" | "back";
  mode?: "simple" | "toggle";
  activeVoice?: Voice;
  onVoiceToggle?: (v: Voice) => void;
  leadingScrolled?: boolean;
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

type Step =
  | { kind: "bot"; dv: DualVoiceRef }
  | { kind: "aa-chips" }
  | { kind: "wrapped" }
  | { kind: "preferences" }
  | { kind: "playground" }
  | { kind: "footprint-bucket"; bucketIndex: number }
  | { kind: "ladder-pick" }
  | { kind: "plan-crunching" }
  | { kind: "spending-plan" }
  | { kind: "verdict" }
  | { kind: "lock-in" };

function bot(dv: DualVoiceRef): Step { return { kind: "bot", dv }; }

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
    ryan: "Light P2P. Finally, the one-off stuff — refunds, repairs, surprise medical bills.",
    byron: "Hardly any P2P. Last bucket: the random one-offs that mess up averages.",
  }),
  { kind: "footprint-bucket", bucketIndex: 3 }, // One-off items
  // ── Phase 6: Ladder pick ──
  bot({
    ryan: "Money mapped. Now the pace, pick the one that feels right.",
    byron: "Money mapped. Three speeds, pick your poison.",
  }),
  { kind: "ladder-pick" },
  // ── Phase 7: Plan crunching ──
  bot({
    ryan: "Crunching the numbers...",
    byron: "Stress-testing your bravado. Hold.",
  }),
  { kind: "plan-crunching" },
  // ── Phase 8: Spending plan + verdict + lock-in ──
  bot({
    ryan: "Here's the plan.",
    byron: "Here's the receipt. Don't argue with it.",
  }),
  { kind: "spending-plan" },
  { kind: "verdict" },
  { kind: "lock-in" },
];

// Pause-point + post-pause logic is retired: the flow is now linear, no
// exit-and-re-enter beat. Sentinels kept so a couple of remaining call sites
// (auto-advance guard, snap-scroll ref) don't blow up.
const PAUSE_STEP_INDEX = -1;
const POST_PAUSE_STEP_INDEX = -1;

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
    const footprintTailStart = ALL_STEPS.findIndex((s) => s.kind === "footprint-bucket") - 1; // the "walk you through your money" intro bot
    return [
      // Starts on the wrapped hook (no splash) — the "three patterns" text + the 3 cards.
      ...PRE_WRAPPED_BUBBLES.map(bot),
      { kind: "wrapped" },
      bot(BETA_GOAL_INTRO),
      { kind: "preferences" },
      bot(BETA_AA_INTRO),
      { kind: "aa-chips" },
      bot(AA_LINKED_BUBBLE),
      bot(BETA_BYRON_INTRO), // introduce Byron during the sync wait (toggle is live by now)
      ...PLAYGROUND_INTRO_BUBBLES.map(bot),
      { kind: "playground" },
      ...ALL_STEPS.slice(footprintTailStart),
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

// Quiz answer → numbers. Amounts and timelines map to figures so the plan can
// be computed from what the user actually picked (see the goal-aware derivation
// in the component). Indian-format the result so highlightValues bolds it.
const AMOUNT_MAP: Record<string, number> = { "50k": 50000, "1L": 100000, "2L": 200000, "5L+": 500000 };
const TIMELINE_MONTHS: Record<string, number> = { "3m": 3, "6m": 6, "1y": 12 };
const TIMELINE_LABELS: Record<string, string> = { "3m": "in 3 months", "6m": "in 6 months", "1y": "in 12 months" };
function formatINR(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

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
//  Playground traits panel - annotations under spending-heatmap card
// ══════════════════════════════════════════════════════════════════

function PlaygroundTraitsList({ traits }: { traits: NonNullable<PlaygroundReveal["traits"]> }) {
  return (
    <div style={{ marginTop: SPACE_M, display: "flex", flexDirection: "column", gap: SPACE_M }}>
      {traits.map((t) => (
        <div key={t.label} style={{ display: "flex", gap: SPACE_M, alignItems: "flex-start" }}>
          <img
            src="/icons/placeholder-valentino.svg"
            alt=""
            width={22}
            height={22}
            style={{ display: "block", flexShrink: 0 }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{t.label}</span>
            <span style={{ ...typography.caption, color: TEXT_SECONDARY, marginTop: 2 }}>{t.line}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

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
  config,
}: {
  onComplete?: (opts?: { skipGoal?: boolean; goal?: GoalCompletionPayload; openGoal?: boolean }) => void;
  config?: OnboardingConfig;
} = {}) {
  const STEPS = useMemo(
    () => buildStepsForConfig(config),
    [config?.goalRequired, config?.terminalAtAa, config?.betaIntentFirst],
  );
  const LAST_STEP_INDEX = STEPS.length - 1;
  const PREFERENCES_STEP_INDEX = STEPS.findIndex((s) => s.kind === "preferences");
  // Beta resume target: the footprint intro bot (the step before the first bucket).
  const FOOTPRINT_RESUME_INDEX = STEPS.findIndex((s) => s.kind === "footprint-bucket") - 1;
  const LADDER_PICK_STEP_INDEX = STEPS.findIndex((s) => s.kind === "ladder-pick");
  const LADDER_INTRO_STEP_INDEX = LADDER_PICK_STEP_INDEX - 1; // the "Now the pace" bot line
  const PLAYGROUND_STEP_INDEX = STEPS.findIndex((s) => s.kind === "playground");
  // The Byron-intro bot line that sits between the AA chips and the playground. We keep it visible
  // on the skip path (see the terminal-path filter below) so Byron still gets introduced even when
  // the user declines to link accounts.
  const BYRON_INTRO_STEP_INDEX = STEPS.findIndex((s) => s.kind === "bot" && s.dv === BETA_BYRON_INTRO);
  const AA_CHIPS_STEP_INDEX = STEPS.findIndex((s) => s.kind === "aa-chips");
  const LOCK_IN_STEP_INDEX = STEPS.findIndex((s) => s.kind === "lock-in");
  const POST_WRAPPED_STEP_INDEX = STEPS.findIndex((s) => s.kind === "wrapped") + 1;
  const aaMode = config?.aaMode ?? "required";
  // The "byron" skip milestone IS the meet-Byron state, so Byron is forced on there regardless of
  // the Voice toggle (which otherwise feeds config.introduceByron).
  const introduceByron = config?.startMilestone === "byron" ? true : (config?.introduceByron ?? true);
  const goalRequired = config?.goalRequired ?? true;
  const byronGatedByAa = config?.byronGatedByAa ?? false;
  const payScreenVariant = config?.payScreenVariant ?? "current";
  const terminalAtAa = config?.terminalAtAa ?? false;
  const betaIntentFirst = config?.betaIntentFirst ?? false;
  const betaStartStep = betaIntentFirst ? config?.betaStartStep : undefined;
  // Phone (full-bleed) prototype mode — drives the mobile-only chrome sizing (shorter top fade,
  // since the simulated status bar is gone and the app bar sits below the notch).
  const isMobile = useIsMobileProto();
  // Targets past the AA ask seed a resolved "connect" so the AA step reads done in the transcript above.
  const betaPastAa = betaStartStep != null && ["explore", "footprint", "plan", "verdict", "lock-in"].includes(betaStartStep);
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
  // Beta boots straight into the chat overlay (its splash step IS the entry — no separate PDP).
  const [overlayScreen, setOverlayScreen] = useState<"pdp" | "chat">(() => (startMilestone != null || betaIntentFirst ? "chat" : "pdp"));
  const [pdpSeen, setPdpSeen] = useState(() => isTerminalMilestone || betaIntentFirst); // once true, pill tap goes straight to chat
  const [overlayOpen, setOverlayOpen] = useState(() => startMilestone != null || betaIntentFirst);
  const [overlayMounted, setOverlayMounted] = useState(() => startMilestone != null || betaIntentFirst);
  const [stepIndex, setStepIndex] = useState(() => {
    // Beta "Skip to" — jump straight to a beta step.
    if (betaStartStep && betaStartStep !== "splash") {
      const idx = (k: Step["kind"]) => STEPS.findIndex((s) => s.kind === k);
      switch (betaStartStep) {
        case "wrapped": return idx("wrapped");
        case "goal": return PREFERENCES_STEP_INDEX;
        case "aa": return AA_CHIPS_STEP_INDEX;
        case "explore": return PLAYGROUND_STEP_INDEX;
        case "footprint": return FOOTPRINT_RESUME_INDEX;
        case "plan": return idx("spending-plan");
        case "verdict": return idx("verdict");
        case "lock-in": return idx("lock-in");
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
  const [goalLabel, setGoalLabel] = useState("Your goal");

  // Voice / persona
  const [voice, setVoice] = useState<Voice>("ryan");
  const [appBarMode, setAppBarMode] = useState<"simple" | "toggle">("simple");
  const [contentVisible, setContentVisible] = useState(true);

  // Playground (post-AA spend-analytics taster)
  type PlaygroundEvent =
    | { kind: "user-tap"; chipId: string; label: string }
    | { kind: "reveal"; chipId: string }
    | { kind: "byron-roast"; text: string; isFirst: boolean }
    | { kind: "byron-cap-nudge" }
    | { kind: "ryan-handoff" }
    | { kind: "goal-nudge" };
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

  // Footprint walk: which bucket cards have been confirmed by the user.
  const [footprintConfirmed, setFootprintConfirmed] = useState<Set<number>>(new Set());

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
  const [tweakSubmitted, setTweakSubmitted] = useState(false);
  // Beta "Just auto-save": skip the explore/plan deep-dive and jump straight to the lock-in fund
  // step (a simple monthly auto-save). The intermediate steps are filtered from the chat history.
  const [betaAutoSave, setBetaAutoSave] = useState(false);
  // After the user confirms, they fund the pot + set the monthly on autopay
  // (reusing the add-to-pot widget). Only once funded do we hand control back to
  // the parent page so the home view can surface the real pot/goal.
  const [potFunded, setPotFunded] = useState(false);
  const planLocked = potFunded;
  // Goal tracker reveal: once the "your goal is live" line lands, a ring chip pops into the
  // app-bar top-right (trackerLive), then its ring charges 0 → funded% (trackerPct ramps).
  const [trackerLive, setTrackerLive] = useState(false);
  const [trackerPct, setTrackerPct] = useState(0);
  // Brief coachmark pointing at the freshly-revealed tracker, so the user notices it landed
  // top-right (it auto-dismisses, or clears when they tap the tracker / it's been a few seconds).
  const [trackerCoachmark, setTrackerCoachmark] = useState(false);
  // Set just before closeOverlay when the user wants to land on the goal screen (tracker tap /
  // funded-card arrow) rather than the home chat — read in closeOverlay's onComplete call.
  const openGoalOnCloseRef = useRef(false);
  // Captures the amount the user actually funds (defaults to the recommended
  // monthly) and the resolved goal payload, so closeOverlay can hand the real
  // goal/pot back to the parent page without depending on render-scope values.
  const fundedAmountRef = useRef<number | null>(null);
  const goalPayloadRef = useRef<GoalCompletionPayload | undefined>(undefined);
  // Once the walkthrough begins, the chat input bar is always available as a
  // visual affordance. It's intentionally inert in this scripted sim: typing
  // clears on send rather than driving a (faked) reply.
  const [walkthroughDraft, setWalkthroughDraft] = useState("");
  // Suggestions menu for the terminal "Ask Ryan" bar: the message button opens
  // a sheet of the same prompts that roll through the field; tapping one drops
  // it into the input.
  const [suggestMenuOpen, setSuggestMenuOpen] = useState(false);

  // Ready signal. Seeding ready=true on a fast-forward makes the pill-commit
  // effect a no-op and routes the FloatingAppBar to its "close" affordance, since
  // the chat is already open past the meet-Ryan beat.
  const [ryanReady, setRyanReady] = useState(() => startMilestone != null);
  const [pillLabel, setPillLabel] = useState(() => (startMilestone != null ? "Ryan is ready" : "Meet Ryan"));

  // Scroll refs and state
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wrappedCardRef = useRef<HTMLDivElement>(null);
  const postWrappedRef = useRef<HTMLDivElement>(null);
  const userBubbleRef = useRef<HTMLDivElement>(null);
  const byronBubbleRef = useRef<HTMLDivElement>(null);
  const ryanHandoffRef = useRef<HTMLDivElement>(null);
  const postPauseRef = useRef<HTMLDivElement>(null);
  const walkthroughBotRef = useRef<HTMLDivElement>(null);
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
  const [freeTextBubbles, setFreeTextBubbles] = useState<string[]>([]);
  const handleWalkthroughSubmit = useCallback(() => {
    const text = walkthroughDraft.trim();
    setWalkthroughDraft("");
    if (!text || !betaIntentFirst) return;
    setFreeTextBubbles((prev) => [...prev, text]);
    setUserActionCount((c) => c + 1); // triggers the snap-scroll to the new bubble
  }, [walkthroughDraft, betaIntentFirst]);
  // Post a canned message as the user's own bubble (e.g. tapping an "ask me" suggestion chip).
  const postUserMessage = useCallback((text: string) => {
    setFreeTextBubbles((prev) => [...prev, text]);
    setUserActionCount((c) => c + 1);
  }, []);

  // Snap-scroll a target element to just below the fixed chrome (app bar + cruncher), eased 400ms
  const snapScrollTo = useCallback((el: HTMLElement, delay = 300) => {
    // Cancel any pending snap-scroll
    if (snapTimeoutRef.current) window.clearTimeout(snapTimeoutRef.current);
    isSnappingRef.current = true;
    snapTimeoutRef.current = window.setTimeout(() => {
      const scroller = scrollRef.current;
      const content = contentRef.current;
      if (!scroller || !content) { isSnappingRef.current = false; return; }

      const scrollerRect = scroller.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const elTopInScroller = elRect.top - scrollerRect.top + scroller.scrollTop;
      // Position element just below the fixed chrome zone (app bar + cruncher if visible)
      const chromeHeight = topCruncherVisibleRef.current ? 180 : 108;
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

  // Branch the question set off the chosen goal type (see buildPrefQuestions).
  const prefQuestions: Question[] = useMemo(
    () => buildPrefQuestions(prefAnswers["goal-type"]),
    [prefAnswers],
  );

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
  const requiredMonthly = hasFixedTenure ? Math.round(goalAmountNum / goalMonths!) : null;
  const tierMonthly = ladderTier
    ? LADDER_OPTIONS.find((o) => o.tier === ladderTier)?.monthlyAmount ?? null
    : null;
  const savingsAmount = requiredMonthly ?? tierMonthly ?? SPENDING_PLAN_FIXTURE.savingsTarget;
  const planAvailable = SPENDING_PLAN_FIXTURE.income - SPENDING_PLAN_FIXTURE.obligations;
  const leftToSpend = planAvailable - savingsAmount;
  // Some amount+timeline combos need more than the cashflow allows (e.g. ₹2L in
  // 3 months). Flag it so the verdict doesn't falsely claim "this works".
  const isPlanTight = savingsAmount >= planAvailable;
  // What to call the pot. Never render "Just save more pot" / "Emergency fund"
  // goalLabel quirks — map to clean labels.
  const potLabel =
    goalTypeId === "emergency" ? "Emergency fund"
    : goalTypeId === "save-more" ? "Savings"
    : goalLabel;
  const spendingPlan = {
    ...SPENDING_PLAN_FIXTURE,
    savingsTarget: savingsAmount,
    dailyPool: leftToSpend,
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
  const trackerTargetPct = Math.min(100, Math.round((trackerFunded / trackerTarget) * 100));
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

  const openOverlay = useCallback(() => {
    // First time → show PDP; returning → straight to chat
    setOverlayScreen(pdpSeen ? "chat" : "pdp");
    setOverlayMounted(true);
    overlayAnimatingRef.current = true;
    window.setTimeout(() => { overlayAnimatingRef.current = false; }, OVERLAY_DURATION + 50);
    requestAnimationFrame(() => requestAnimationFrame(() => setOverlayOpen(true)));
  }, [pdpSeen]);

  const closeOverlay = useCallback(() => {
    setOverlayOpen(false);
    window.setTimeout(() => {
      setOverlayMounted(false);
      setOverlayScreen(pdpSeen ? "chat" : "pdp");
      // If the user has locked in their plan, hand control back to the parent
      // page now that the slide-down has settled — that's the moment the home
      // view with the pinned goal should take over.
      if (planLocked) {
        onComplete?.({ goal: goalPayloadRef.current, openGoal: openGoalOnCloseRef.current });
        return;
      }
      // Otherwise: full-reset only if AA hasn't completed yet, so a user who
      // bounced out before connecting accounts restarts cleanly.
      if (!aaChipPicked) {
        setStepIndex(0);
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
        setCruncherVisible(false);
        setCruncherStatus("Gathering your preferences");
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
        setLadderTier(null);
        setLadderQuizOpen(false);
        setLockInChoice(null);
        setTweakDraft("");
        setTweakSubmitted(false);
        setPotFunded(false);
        setUserActionCount(0);
        setGoalLabel("Your goal");
        setRyanReady(false);
        setPillLabel("Meet Ryan");
      }
    }, OVERLAY_DURATION);
  }, [aaChipPicked, pdpSeen, planLocked, onComplete]);

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
          if (kids[k].getAttribute("aria-hidden") !== "true") { last = kids[k]; break; }
        }
        if (last && last.offsetHeight > el.clientHeight * 0.6) { snapScrollTo(last, 0); return; }
      }
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, delay);
    return () => window.clearTimeout(t);
  }, [stepIndex, revealedCount, cruncherDone, betaIntentFirst, snapScrollTo]);

  // Snap-scroll to user's reply bubble on every user action
  useEffect(() => {
    if (userActionCount === 0) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = userBubbleRef.current;
      if (el) snapScrollTo(el);
    }));
  }, [userActionCount, snapScrollTo]);

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

  // Connect-mosaic path: park the top of the connect content (the sync cruncher)
  // just below chrome so the stepIndex auto-scroll doesn't push it under the
  // floating app bar when the mosaic reveals.
  useEffect(() => {
    if (!aaConnected) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = connectTopRef.current;
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
      setPillLabel(voice === "byron" ? "Byron is ready" : "Ryan is ready");
    }
  }, [overlayOpen, overlayScreen, ryanReady, voice]);

  // Auto-advance from the spending-plan step after the user has had a beat
  // to read the budget summary + category caps. The verdict + lock-in chips
  // follow immediately after.
  useEffect(() => {
    if (STEPS[stepIndex]?.kind !== "spending-plan") return;
    const t = window.setTimeout(() => advanceStep(), 2200);
    return () => window.clearTimeout(t);
  }, [stepIndex, advanceStep]);

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

  // Beta: the goal TYPE is chosen via in-chat chips; tapping one banks the answer and opens the
  // bottom sheet at the first follow-up (timeline/amount/destination), skipping the goal-type
  // question it just answered. "Just save more" has no follow-ups, so it completes without a sheet.
  const handleBetaGoalTypePick = useCallback((optionId: string) => {
    const next = { ...prefAnswers, "goal-type": optionId };
    setPrefAnswers(next);
    setUserActionCount((c) => c + 1);
    const questions = buildPrefQuestions(optionId);
    if (questions.length > 1) {
      setPrefQuizIndex(1);
      setPrefQuizOpen(true);
    } else {
      finishQuiz(next);
    }
  }, [prefAnswers, finishQuiz]);


  // When the preferences step becomes active, open the quiz (unless dismissed). Beta is the
  // exception: there the goal type is picked via in-chat chips, which open the sheet on tap.
  useEffect(() => {
    if (STEPS[stepIndex]?.kind === "preferences" && !betaIntentFirst && !prefQuizOpen && !prefDismissed && Object.keys(prefAnswers).length === 0) {
      const t = window.setTimeout(() => setPrefQuizOpen(true), 400);
      return () => window.clearTimeout(t);
    }
  }, [stepIndex, betaIntentFirst, prefQuizOpen, prefDismissed, prefAnswers]);

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
    if (!ladderQuizOpen && ladderTier == null) {
      const t = window.setTimeout(() => setLadderQuizOpen(true), 400);
      return () => window.clearTimeout(t);
    }
  }, [stepIndex, ladderQuizOpen, ladderTier, hasFixedTenure, advanceStep]);

  // ── Playground: chip-tap & event handlers ────────────────────
  const appendPlaygroundEvent = useCallback((evt: PlaygroundEvent) => {
    setPlaygroundEvents((prev) => [...prev, evt]);
  }, []);

  const handlePlaygroundChip = useCallback((chipId: string) => {
    if (playgroundBusy) return;

    if (chipId === "roast-byron") {
      const roastText = getPlaygroundByronRoast(playgroundRoastIndex);
      setPlaygroundRoastIndex((i) => i + 1);
      setUserActionCount((c) => c + 1);
      appendPlaygroundEvent({ kind: "user-tap", chipId, label: "Roast me, Byron" });
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
    const chip = PLAYGROUND_CHIPS.find((c) => c.id === chipId);
    if (!chip) return;
    setUserActionCount((c) => c + 1);
    appendPlaygroundEvent({ kind: "user-tap", chipId, label: chip.label });
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

  // Surface the goal-planning nudge once the user has explored their data — a roast + 2 spend
  // reveals — framed as "your data's in, set up a goal". (Spend chips only unlock after a roast, so
  // the roast is a structural prerequisite; the nudge no longer waits for all three reveals.)
  const SPEND_CHIP_IDS = ["top-categories", "month-story", "spending-says"] as const;
  useEffect(() => {
    if (STEPS[stepIndex]?.kind !== "playground") return;
    if (playgroundNudgeShown || playgroundBusy) return;
    if (!playgroundRoastFiredOnce) return;
    const spendDone = SPEND_CHIP_IDS.filter((id) => chipsConsumed.has(id)).length;
    if (spendDone < 2) return;
    setPlaygroundEvents((prev) => [...prev, { kind: "goal-nudge" }]);
    setPlaygroundNudgeShown(true);
    setPlaygroundBusy(true);
  }, [stepIndex, playgroundNudgeShown, playgroundBusy, playgroundRoastFiredOnce, chipsConsumed]);

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
  const topClearance = aaConnected && !connectCruncherDismissed ? 180 : 116;
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
    <div ref={scrollRef} className="absolute inset-0 w-full overflow-y-auto overscroll-none scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transition-opacity duration-500 ease-out" style={{ opacity: contentVisible ? 1 : 0 }}>
      <div ref={contentRef} className="flex flex-col" style={{ paddingLeft: SPACE_L, paddingRight: SPACE_L, paddingBottom: SPACE_L }}>
        {/* Clearance for floating app bar + cruncher */}
        <div className="shrink-0" aria-hidden="true" style={{ height: topClearance }} />

        {visibleSteps.map((step, i) => {
          const isLast = i === stepIndex;

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
            i !== BYRON_INTRO_STEP_INDEX
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

          if (step.kind === "bot") {
            const shouldAutoAdvance = isLast && (i + 1 !== PAUSE_STEP_INDEX + 1);
            const isPostWrapped = i === POST_WRAPPED_STEP_INDEX;
            const isPostPause = i === POST_PAUSE_STEP_INDEX;
            const ref = isPostWrapped
              ? postWrappedRef
              : isPostPause
                ? postPauseRef
                : (isLast && stepIndex > PREFERENCES_STEP_INDEX)
                  ? walkthroughBotRef
                  : undefined;
            // Fixed-tenure goals skip the tier picker, so the "Now the pace.
            // Pick one." intro makes no sense — swap in the computed monthly.
            const botText =
              i === LADDER_INTRO_STEP_INDEX && hasFixedTenure
                ? (voice === "byron"
                    ? `Fixed target, fixed deadline — that's ${formatINR(savingsAmount)}/month, no haggling. Here's the damage.`
                    : `To hit ${potLabel} ${TIMELINE_LABELS[timelineId] ?? ""}, you'll need about ${formatINR(savingsAmount)}/month. Here's how that lands.`)
                : (step.dv === BETA_BYRON_INTRO && aaSkipped)
                  // Skip path: no accounts were linked, so swap in copy that introduces Byron
                  // without referencing a sync that isn't happening.
                  ? BETA_BYRON_INTRO_SKIP[voice]
                  : step.dv[voice];
            // The Byron-intro beat lingers a touch before advancing so the user actually reads it
            // (it's a quick one-off in a fast-advancing sequence, easy to miss otherwise). On the
            // skip path it then jumps straight to the playground, past the hidden intro bubbles.
            const isByronIntro = step.dv === BETA_BYRON_INTRO;
            const advanceFromByron =
              aaSkipped && PLAYGROUND_STEP_INDEX >= 0
                ? () => setStepIndex(PLAYGROUND_STEP_INDEX)
                : advanceStep;
            const onBotDone = shouldAutoAdvance
              ? (isByronIntro ? () => window.setTimeout(advanceFromByron, 1600) : advanceStep)
              : undefined;
            return (
              <div key={`bot-${i}`} ref={ref}>
                <RyanLine
                  text={botText}
                  active={isLast}
                  onDone={onBotDone}
                />
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
                        text={AA_DISMISS_NUDGE[voice]}
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
              <div key={`aa-chips-${i}`} className="flex flex-col animate-chat-message-in" style={{ marginTop: SPACE_L, gap: 12 }}>
                <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAaChipPicked("connect");
                    setUserActionCount((c) => c + 1);
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
                {betaIntentFirst && (
                  <button
                    type="button"
                    onClick={() => {
                      // Simple auto-save: skip the explore/plan deep-dive, jump straight to the
                      // lock-in fund step (seed "lock" so the funding card shows directly). The
                      // betaAutoSave filter hides the intermediate steps from the history.
                      setAaChipPicked("autosave");
                      setBetaAutoSave(true);
                      setLockInChoice("lock");
                      setUserActionCount((c) => c + 1);
                      if (LOCK_IN_STEP_INDEX >= 0) setStepIndex(LOCK_IN_STEP_INDEX);
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
                    Just auto-save
                  </button>
                )}
                {aaMode === "optional" && (
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
                    Skip for now
                  </button>
                )}
                </div>
                {/* Beta: "ask me anything" suggestion chips — slice-data prompts that post as the
                    user's own message (no canned answer yet). Ghost styling marks them as softer
                    suggestions vs the solid connect/skip actions above. */}
                {betaIntentFirst && (
                  <div className="flex flex-wrap gap-3">
                    {AA_ASK_SUGGESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => postUserMessage(q)}
                        className="transition-transform active:scale-[0.97]"
                        style={{ ...typography.buttonSmall, color: TEXT_SECONDARY, backgroundColor: "transparent", border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_CIRCLE, padding: `${SPACE_XS}px ${SPACE_M}px`, cursor: "pointer" }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          if (step.kind === "wrapped") {
            return (
              <div key={`wrapped-${i}`} ref={wrappedCardRef} style={{ marginTop: SPACE_L }} className="animate-chat-message-in">
                <WrappedCard revealedCount={revealedCount} onOpen={openStory} />
              </div>
            );
          }

          if (step.kind === "preferences") {
            // Beta: pick the goal type in-chat. Tapping a type opens the sheet for the follow-ups;
            // "Decide later" skips the goal. Only at the live step, before anything's answered.
            if (betaIntentFirst && isLast && !prefQuizOpen && !prefDismissed && Object.keys(prefAnswers).length === 0) {
              return (
                <div
                  key={`pref-chips-${i}`}
                  ref={userBubbleRef}
                  className="flex flex-wrap gap-3 animate-chat-message-in"
                  style={{ marginTop: SPACE_L }}
                >
                  {GOAL_PREFERENCE_QUESTIONS[0].options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleBetaGoalTypePick(opt.id)}
                      className="transition-transform active:scale-[0.97]"
                      style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, backgroundColor: BG_SECONDARY, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_CIRCLE, padding: `${SPACE_XS}px ${SPACE_M}px`, cursor: "pointer" }}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handlePrefClose}
                    className="transition-transform active:scale-[0.97]"
                    style={{ ...typography.buttonSmall, color: TEXT_SECONDARY, backgroundColor: "transparent", border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_CIRCLE, padding: `${SPACE_XS}px ${SPACE_M}px`, cursor: "pointer" }}
                  >
                    Decide later
                  </button>
                </div>
              );
            }
            if (Object.keys(prefAnswers).length > 0 && !prefQuizOpen) {
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
                    <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>Shared preferences</p>
                  </div>
                </div>
              );
            }
            // Dismissed - show Ryan nudge + reopen button
            if (prefDismissed && !prefQuizOpen) {
              return (
                <div key={`pref-dismissed-${i}`}>
                  <RyanLine
                    text={PREF_DISMISS_NUDGE[voice]}
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
                    text={CONNECT_SALUTATION[voice]}
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
                      <div className="animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                        <ChatCard
                          card={reveal.card}
                          onOpenList={reveal.card.type === "transaction-table" ? () => openBigSpends(reveal.card as { title: string; transactions: { date: string; merchant: string; amount: number; category: string }[] }) : undefined}
                        />
                        {reveal.traits && <PlaygroundTraitsList traits={reveal.traits} />}
                        <RyanLine
                          text={reveal.quip[voice]}
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
                    <RyanLine text={PLAYGROUND_GOAL_NUDGE[voice]} active={false} />
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
                      <div className="animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                        <ChatCard
                          card={reveal.card}
                          onOpenList={reveal.card.type === "transaction-table" ? () => openBigSpends(reveal.card as { title: string; transactions: { date: string; merchant: string; amount: number; category: string }[] }) : undefined}
                        />
                        {reveal.traits && <PlaygroundTraitsList traits={reveal.traits} />}
                        <RyanLine
                          text={reveal.quip[voice]}
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
              !playgroundNudgeShown &&
              visibleChips.length > 0 &&
              // Beta banks the goal BEFORE the playground, so goalAcceptedOrAnswered is always true
              // here — don't let it suppress the explore chips (that was the "Meanwhile…" dead end).
              (betaIntentFirst || !goalAcceptedOrAnswered);
            const showPostNudgeChips =
              !playgroundBusy &&
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
                          <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{evt.label}</p>
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
                      <div key={`pg-${j}`} className="animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                        <ChatCard
                          card={reveal.card}
                          onOpenList={reveal.card.type === "transaction-table" ? () => openBigSpends(reveal.card as { title: string; transactions: { date: string; merchant: string; amount: number; category: string }[] }) : undefined}
                        />
                        {reveal.traits && <PlaygroundTraitsList traits={reveal.traits} />}
                        {showQuip && (
                          <RyanLine
                            text={reveal.quip[voice]}
                            active={isLastEvent}
                            onDone={isLastEvent ? handlePlaygroundRevealDone : undefined}
                          />
                        )}
                      </div>
                    );
                  }
                  if (evt.kind === "byron-roast") {
                    return (
                      <div key={`pg-${j}`} ref={isLastEvent ? byronBubbleRef : undefined}>
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
                          text={PLAYGROUND_BYRON_CAP_NUDGE[voice]}
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
                          text={betaIntentFirst ? BETA_PLAYGROUND_READY[voice] : PLAYGROUND_GOAL_NUDGE[voice]}
                          active={isLastEvent}
                          onDone={isLastEvent ? handlePlaygroundGoalNudgeDone : undefined}
                        />
                      </div>
                    );
                  }
                  return null;
                })}

                {showChips && (
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
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}

                {showPostNudgeChips && betaIntentFirst && (
                  <div ref={userBubbleRef} className="flex flex-col animate-chat-message-in" style={{ marginTop: SPACE_L, gap: 12 }}>
                    {/* Beta: goal's banked, so this isn't a dead end — keep the explore suggestions
                        available (re-tappable, masks the parse wait) plus the build-plan CTA. */}
                    <div className="flex flex-wrap gap-3">
                      {PLAYGROUND_CHIPS.filter((c) => c.id !== "roast-byron").map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handlePlaygroundChip(c.id)}
                          className="transition-transform active:scale-[0.97]"
                          style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, backgroundColor: BG_SECONDARY, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_CIRCLE, padding: `${SPACE_XS}px ${SPACE_M}px`, cursor: "pointer" }}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        // Happy case: the parse finished while exploring, so this goes straight to the
                        // plan (footprint walk) — it skips the session break, which only the slow path hits.
                        onClick={() => setStepIndex(FOOTPRINT_RESUME_INDEX)}
                        className="transition-transform active:scale-[0.97]"
                        style={{ ...typography.buttonSmall, color: TEXT_ON_COLOR_PRIMARY, backgroundColor: MAIN_PRIMARY, border: "none", borderRadius: RADIUS_CIRCLE, padding: `${SPACE_XS}px ${SPACE_M}px`, cursor: "pointer" }}
                      >
                        Build my plan
                      </button>
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
                    {(byronGatedByAa ? aaConnected : introduceByron) && playgroundRoastIndex < MAX_BYRON_ROASTS && (
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
            // Inline in the chat flow (not floating on top): the crunch card appears as a chat
            // message while the plan computes, then resolves as the spending plan arrives below it.
            return cruncherVisible ? (
              <div key={`crunch-${i}`} style={{ marginTop: SPACE_L }}>
                <PlanCruncherV2
                  goalName={goalLabel}
                  visible={cruncherVisible}
                  statusText={cruncherStatus}
                  completed={cruncherDone}
                  completedSubtitle="Your spending snapshot is ready"
                />
              </div>
            ) : null;
          }

          if (step.kind === "footprint-bucket") {
            const card = BUCKET_CONFIRM_LIST[step.bucketIndex];
            const confirmed = footprintConfirmed.has(step.bucketIndex);
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
            // The pick is captured via the QuestionnaireOverlay variant
            // (rendered in the bottom chrome). Inline we show the user's
            // selection as a chat bubble once they've answered. Always
            // attach userBubbleRef here (not gated on isLast) so the
            // snap-scroll target survives the subsequent advanceStep.
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
            // Ryan-voice text block instead of the +/−/= table — ₹ amounts auto-bold
            // via highlightValues, and the pot label is wrapped in ** so it stands out.
            const planText = isPlanTight
              ? (voice === "byron"
                  ? `${formatINR(SPENDING_PLAN_FIXTURE.income)} in, ${formatINR(SPENDING_PLAN_FIXTURE.obligations)} already spoken for. ${formatINR(savingsAmount)} into **${potLabel}** leaves you next to nothing day-to-day. That's tight.`
                  : `${formatINR(SPENDING_PLAN_FIXTURE.income)} comes in and ${formatINR(SPENDING_PLAN_FIXTURE.obligations)} is already committed. Putting ${formatINR(savingsAmount)} toward **${potLabel}** leaves almost nothing for everyday spending — that's tight.`)
              : (voice === "byron"
                  ? `${formatINR(SPENDING_PLAN_FIXTURE.income)} in, ${formatINR(SPENDING_PLAN_FIXTURE.obligations)} already spoken for, ${formatINR(savingsAmount)} into **${potLabel}**. ${formatINR(leftToSpend)} left to play with — don't blow it.`
                  : `${formatINR(SPENDING_PLAN_FIXTURE.income)} comes in, ${formatINR(SPENDING_PLAN_FIXTURE.obligations)} is already committed, and ${formatINR(savingsAmount)} goes to **${potLabel}**. That leaves ${formatINR(leftToSpend)} for everyday spending.`);
            return (
              <div key={`plan-${i}`} className="animate-chat-message-in" style={{ marginTop: SPACE_L, display: "flex", flexDirection: "column", gap: SPACE_M }}>
                <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>
                  {highlightValues(planText)}
                </p>
                <ChatCard card={{ type: "category-budgets", plan: spendingPlan }} />
              </div>
            );
          }

          if (step.kind === "verdict") {
            const amt = formatINR(savingsAmount);
            let verdictText: string;
            if (isPlanTight) {
              verdictText = voice === "byron"
                ? `Real talk: ${amt}/month is more than you've got spare after the essentials. You can force it, but it'll hurt — give it more time.`
                : `Heads up — ${amt} a month is more than your spare cash after the essentials. Doable, but tight. Stretching the timeline would ease it.`;
            } else if (goalTypeId === "purchase") {
              verdictText = voice === "byron"
                ? `Math checks out. ${amt}/month and ${goalLabel} is yours.`
                : `This works. ${amt} a month gets you ${goalLabel}.`;
            } else if (goalTypeId === "emergency") {
              verdictText = voice === "byron"
                ? `Fine. ${amt}/month and you finally have a cushion.`
                : `This works. ${amt} a month and your safety net builds steadily.`;
            } else if (goalTypeId === "save-more") {
              verdictText = voice === "byron"
                ? `Math checks out. ${amt}/month put away without you feeling it.`
                : `This works. ${amt} a month into savings, no strain on the rest.`;
            } else {
              verdictText = voice === "byron"
                ? `Math checks out. ${amt}/month and ${goalLabel} actually happens.`
                : `This works. ${amt} a month and ${goalLabel} is on the calendar.`;
            }
            // Beta: explain WHY the number is trustworthy (Headspace-style "why this recommendation").
            // Honest reasoning, not a fabricated stat — it's derived from the user's own spare cash.
            if (betaIntentFirst && !isPlanTight) {
              verdictText += voice === "byron"
                ? " It's carved from what's actually spare after your essentials, not a number I made up."
                : " And it's built from what's genuinely spare after your essentials, not a figure I pulled from thin air.";
            }
            return (
              <div key={`verdict-${i}`} style={{ marginTop: SPACE_M }}>
                <RyanLine
                  text={verdictText}
                  active={isLast}
                  onDone={isLast ? advanceStep : undefined}
                />
              </div>
            );
          }

          if (step.kind === "lock-in") {
            // Before the user picks: render the lock-in chips inline.
            if (!lockInChoice) {
              return (
                <div key={`lock-in-${i}`} className="flex flex-wrap gap-3 animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                  {LOCK_IN_CHIPS.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => {
                        setLockInChoice(chip.id === "lock" ? "lock" : "tweak");
                        setUserActionCount((c) => c + 1);
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
                      {chip.label}
                    </button>
                  ))}
                </div>
              );
            }

            // After the user picks: show their selection as a bubble + the
            // follow-up Ryan/Byron line. "Lock it in" yields a definitive
            // confirmation; "Tweak something" invites a reply via the input
            // bar (rendered in the bottom chrome below).
            // Beta "Just auto-save" reaches lock-in directly (no plan built), so the choice bubble +
            // bridge line are framed as a simple auto-save rather than "locking in" a plan.
            const pickLabel = betaAutoSave ? "Just auto-save" : lockInChoice === "lock" ? "Lock it in" : "Tweak something";
            const fund = (n: number) => Math.round(n / 500) * 500;
            const fundOptions = [
              { label: formatINR(fund(savingsAmount * 2)), value: fund(savingsAmount * 2) },
              { label: formatINR(fund(savingsAmount * 3)), value: fund(savingsAmount * 3) },
            ];
            const followUpText = betaAutoSave
              ? (voice === "byron"
                  ? `Simple it is. Pick a monthly and I'll auto-save it toward **${potLabel}**. Change or pause it whenever, nothing's locked.`
                  : `Keeping it simple. Pick a monthly amount and I'll auto-save it toward **${potLabel}**. You can change or pause it anytime, nothing's set in stone.`)
              : lockInChoice === "lock"
              ? (voice === "byron"
                  ? `Locked. Now fund **${potLabel}** and set the autopay — that's the whole point. You can change or pause it whenever.`
                  : `Locked in. One thing left — let's fund **${potLabel}** and put the monthly on autopay. You can change or pause it anytime, nothing's set in stone.`)
              : (voice === "byron"
                  ? "Sure. What needs changing?"
                  : "Tell me what feels off and I'll rework it.");
            const reworkLine = voice === "byron"
              ? `Noted. Reworked. Now fund **${potLabel}** and set the autopay.`
              : `Got it. Updated and locked in. Now let's fund **${potLabel}** and set the autopay.`;
            const fundedLine = voice === "byron"
              ? `Commitment made. **${potLabel}** is live and the auto-save's running. I'll yell when you wobble.`
              : `That's it, you're committed. **${potLabel}** is live and the auto-save's running. I'll keep tabs and nudge you if anything drifts.`;
            const reworkDone = lockInChoice === "tweak" && tweakSubmitted && !!tweakDraft;
            const showFunding = lockInChoice === "lock" || reworkDone;
            return (
              <div key={`lock-in-${i}`}>
                <div
                  ref={userBubbleRef}
                  className="flex justify-end animate-chat-message-in"
                  style={{ marginTop: SPACE_L }}
                >
                  <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
                    <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{pickLabel}</p>
                  </div>
                </div>
                <div style={{ marginTop: SPACE_M }}>
                  <RyanLine text={followUpText} active={!tweakSubmitted} />
                </div>
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
                {showFunding && (
                  <div className="animate-chat-message-in" style={{ marginTop: SPACE_L }}>
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
                        onAdd: (amt) => { fundedAmountRef.current = amt; setPotFunded(true); },
                        onArrowTap: potFunded ? () => { openGoalOnCloseRef.current = true; closeOverlay(); } : undefined,
                      }}
                    />
                  </div>
                )}
                {potFunded && (
                  <div style={{ marginTop: SPACE_M }}>
                    <RyanLine
                      text={fundedLine}
                      active
                      onDone={() => {
                        // The tracker answers ~140ms after Ryan says it's live — the eye carries
                        // from the line up to the chip popping into the corner.
                        if (!trackerLive) window.setTimeout(() => setTrackerLive(true), 140);
                      }}
                    />
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}

        {/* Beta: free-text the user typed into the chat bar, as their own bubbles at the tail
            of the conversation (the snap-scroll target is the last one). */}
        {betaIntentFirst && freeTextBubbles.map((text, i) => (
          <div
            key={`free-${i}`}
            ref={i === freeTextBubbles.length - 1 ? userBubbleRef : undefined}
            className="flex justify-end animate-chat-message-in"
            style={{ marginTop: SPACE_L }}
          >
            <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}>
              <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{text}</p>
            </div>
          </div>
        ))}

        {/* Bottom spacer for breathing room — clears the absolutely-positioned
            input bar AND leaves ~32px of gap between the last chat message and the
            bottom bar (was 80 → cramped to ~a few px above the input). */}
        <div className="shrink-0" aria-hidden="true" style={{ height: (prefQuizOpen || ladderQuizOpen) ? 260 : 112 }} />
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
      className="relative h-full w-full overflow-hidden"
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
              navKind={ryanReady ? "close" : "back"}
              mode={appBarMode}
              activeVoice={voice}
              leadingScrolled={hasScrolled}
              onVoiceToggle={(v) => {
                if (v === voice) return;
                setContentVisible(false);
                window.setTimeout(() => {
                  setVoice(v);
                  window.setTimeout(() => setContentVisible(true), 50);
                }, 200);
              }}
              trailing={trackerLive ? (
                <div style={{ position: "relative" }}>
                  <span aria-hidden className="tracker-halo" />
                  <div className="animate-tracker-land">
                    <GoalTracker
                      goals={[betaGoalData]}
                      onGoalTap={() => {}}
                      // Tapping the tracker takes the user to their goal screen (closeOverlay fires
                      // onComplete with openGoal). GoalTracker's button calls onGoalListOpen, so this
                      // is the handler that makes the chip actually clickable.
                      onGoalListOpen={() => { setTrackerCoachmark(false); openGoalOnCloseRef.current = true; closeOverlay(); }}
                      singleVariant="pct"
                      frosted
                    />
                  </div>
                </div>
              ) : undefined}
            />

            {/* Attention coachmark — the DLS Tooltip (matches the Enhancements "Meet Ryan" tooltip),
                pointing up-right at the freshly-revealed tracker. Pops in, auto-dismisses (~5s), or
                clears on tap. The button is just a transparent tap target + positioning wrapper. */}
            {trackerLive && trackerCoachmark && (
              <button
                type="button"
                onClick={() => setTrackerCoachmark(false)}
                aria-label="Your goal lives here"
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
                <Tooltip text="Your goal lives here" orientation="top-right" />
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
                <div
                  className="absolute left-0 right-0 z-[9]"
                  style={{
                    top: 0,
                    // Desktop: 140px covers the status bar + 108px app bar then tapers. Mobile: the
                    // simulated status bar is gone and the app bar is only ~64px (below the notch),
                    // so the desktop fade over-extends into the chat — size it to the notch + bar.
                    height: isMobile ? "calc(env(safe-area-inset-top) + 76px)" : 136,
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

                {chatContent}

                {/* Scroll-to-bottom pill */}
                <JumpToRecentPill
                  visible={hasContentBelow}
                  onClick={() => {
                    const scroller = scrollRef.current;
                    if (scroller) scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
                  }}
                  bottom={(prefQuizOpen || ladderQuizOpen) ? 336 : 88}
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
                  }}
                />

                {/* Suggestions sheet — same tiles + icons as the skip mosaic,
                    floated above the input bar. Translucent with a backdrop blur
                    so the chat shows through. Opened by the message button. */}
                {suggestMenuOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Close suggestions"
                      onClick={() => setSuggestMenuOpen(false)}
                      className="absolute inset-0"
                      style={{ background: "transparent", border: "none", padding: 0, cursor: "default", zIndex: 25 }}
                    />
                    <div
                      className="absolute animate-chat-message-in"
                      style={{
                        left: SPACE_M,
                        bottom: 84,
                        width: 248,
                        zIndex: 26,
                        padding: SPACE_XS,
                        // Reads as a floating overlay: sits on a LIFTED surface (bg-secondary,
                        // which is lighter than the dark canvas) at high opacity, with a bold
                        // outline + elevation. Light frost retained via the blur.
                        backgroundColor: `color-mix(in srgb, ${BG_SECONDARY} 92%, transparent)`,
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        border: `1px solid ${OUTLINE_BOLD}`,
                        borderRadius: RADIUS_M,
                        boxShadow: ELEVATION_CARD,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {[
                        ...SKIP_SPEND_TILES.map((t) => ({
                          key: t.chipId,
                          label: t.title,
                          illustration: t.illustration,
                          onSelect: () => { setSuggestMenuOpen(false); pickSpendTile(t.chipId); },
                        })),
                        {
                          key: "connect",
                          label: SKIP_CONNECT_TILE.title,
                          illustration: SKIP_CONNECT_TILE.illustration,
                          onSelect: () => { setSuggestMenuOpen(false); setAaFlowOpen(true); },
                        },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={item.onSelect}
                          className="flex items-center text-left transition-transform active:scale-[0.98]"
                          style={{ gap: SPACE_S, padding: SPACE_S, background: "transparent", border: "none", cursor: "pointer", width: "100%" }}
                        >
                          <div style={{ width: 36, height: 36, borderRadius: RADIUS_S, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                            {item.illustration && (
                              <img src={item.illustration} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
                            )}
                          </div>
                          <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col">
                  <SnackbarSlotTarget />
                  {prefQuizOpen ? (
                    <QuestionnaireOverlay
                      questions={prefQuestions}
                      currentIndex={prefQuizIndex}
                      answers={prefAnswers}
                      onSelectOption={handlePrefSelect}
                      onSubmitFreeText={handlePrefFreeText}
                      onNavigate={handlePrefNavigate}
                      onClose={handlePrefClose}
                    />
                  ) : ladderQuizOpen ? (
                    <QuestionnaireOverlay
                      questions={[SAVINGS_TIER_QUESTION]}
                      currentIndex={0}
                      answers={ladderTier ? { [SAVINGS_TIER_QUESTION.id]: ladderTier } : {}}
                      onSelectOption={(_qId, opt) => {
                        setLadderTier(opt.id as LadderTier);
                        setLadderQuizOpen(false);
                        setUserActionCount((c) => c + 1);
                        advanceStep();
                      }}
                      onSubmitFreeText={() => {}}
                      onNavigate={() => {}}
                      onClose={() => setLadderQuizOpen(false)}
                    />
                  ) : (lockInChoice === "tweak" && !tweakSubmitted) ? (
                    // User picked "Tweak something" — give them a real input
                    // bar so they can type what to change before the plan is
                    // committed.
                    <div style={{ pointerEvents: 'auto' }}>
                      <TypeBox
                        value={tweakDraft}
                        onChange={setTweakDraft}
                        onSubmit={() => {
                          if (!tweakDraft.trim()) return;
                          setTweakSubmitted(true);
                          setUserActionCount((c) => c + 1);
                        }}
                        placeholder={`Reply to ${voice === "byron" ? "Byron" : "Ryan"}...`}
                      />
                    </div>
                  ) : terminalAtAa ? (
                    // Jun 11 terminal path. The AA prompt is a conversational turn too —
                    // Ryan has just asked to connect — so keep an inert reply bar present
                    // (like the rest of the walkthrough) rather than dead-ending on a bare
                    // gesture nav. Once skipped/connected it becomes the open-ended mosaic bar.
                    !(aaSkipped || aaConnected) ? (
                      <TypeBox
                        value={walkthroughDraft}
                        onChange={setWalkthroughDraft}
                        onSubmit={() => setWalkthroughDraft("")}
                        placeholder={`Reply to ${voice === "byron" ? "Byron" : "Ryan"}...`}
                      />
                    ) : (
                    // Terminal mosaic: open-ended "Ask Ryan" bar with a leading
                    // message button — it opens the suggestions sheet (same tiles
                    // as the skip mosaic). The sheet itself renders above the chrome.
                    <TypeBox
                      value={walkthroughDraft}
                      onChange={setWalkthroughDraft}
                      onSubmit={() => setWalkthroughDraft("")}
                      placeholder={`Ask ${voice === "byron" ? "Byron" : "Ryan"}...`}
                      leftAction={
                        // ~3.5s after the first reveal the button slides in from the left and
                        // fades to 100% while the input pill reduces to make room — the wrapper's
                        // width drives the pill reflow so it animates smoothly (motion-skill ease).
                        <div
                          style={{
                            width: suggestBtnReady ? 58 : 0,
                            opacity: suggestBtnReady ? 1 : 0,
                            transform: suggestBtnReady ? "translateX(0)" : "translateX(-10px)",
                            // overflow visible so the button's drop shadow isn't clipped; the
                            // collapsed (width 0, opacity 0) button is made non-interactive instead.
                            overflow: "visible",
                            flexShrink: 0,
                            pointerEvents: suggestBtnReady ? "auto" : "none",
                            transition: "width 460ms cubic-bezier(0.22, 1, 0.36, 1), opacity 460ms ease, transform 460ms cubic-bezier(0.22, 1, 0.36, 1)",
                          }}
                        >
                        <button
                          type="button"
                          aria-label="Suggestions"
                          aria-expanded={suggestMenuOpen}
                          tabIndex={suggestBtnReady ? 0 : -1}
                          onClick={() => setSuggestMenuOpen((o) => !o)}
                          className="flex items-center justify-center rounded-full shrink-0 transition-transform active:scale-[0.97]"
                          style={{
                            width: 48,
                            height: 48,
                            marginRight: 10,
                            // Frosted-glass chrome (consistent with the input pill + close button):
                            // translucent fill + backdrop blur so the glass reads in both modes.
                            backgroundColor: BG_GLASS,
                            border: `1px solid ${OUTLINE_BOLD}`,
                            boxShadow: ELEVATION_CARD,
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          {/* message.svg bakes a black fill — drive its shape via CSS mask and
                              tint TEXT_TERTIARY (constant; does not change when the sheet opens). */}
                          <div
                            aria-hidden="true"
                            style={{
                              width: 20,
                              height: 20,
                              backgroundColor: TEXT_TERTIARY,
                              WebkitMaskImage: "url(/icons/message.svg)",
                              maskImage: "url(/icons/message.svg)",
                              WebkitMaskRepeat: "no-repeat",
                              maskRepeat: "no-repeat",
                              WebkitMaskSize: "contain",
                              maskSize: "contain",
                              WebkitMaskPosition: "center",
                              maskPosition: "center",
                            }}
                          />
                        </button>
                        </div>
                      }
                      rollingSuggestions={WALKTHROUGH_SUGGESTIONS}
                    />
                    )
                  ) : stepIndex > PREFERENCES_STEP_INDEX ? (
                    // Money walkthrough onward: surface the chat input bar so the conversation
                    // always feels typeable. Beta makes it real — what you type appears as a
                    // user bubble (handleWalkthroughSubmit); other personas stay inert.
                    <TypeBox
                      value={walkthroughDraft}
                      onChange={setWalkthroughDraft}
                      onSubmit={handleWalkthroughSubmit}
                      placeholder={`Reply to ${voice === "byron" ? "Byron" : "Ryan"}...`}
                    />
                  ) : (
                    // Default: just the gesture nav. The lock-in path keeps
                    // the chat open until the user closes the overlay.
                    <GestureNav backgroundColor="transparent" />
                  )}
                </div>
              </>
            )}
          </SnackbarSlotProvider>
        )}
      </div>

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
