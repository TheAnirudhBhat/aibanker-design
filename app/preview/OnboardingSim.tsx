"use client";

import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from "react";
import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  OUTLINE_SUBTLE,
  BG_PRIMARY,
  BG_CARD,
  BG_SECONDARY,
  SLATE_10,
  VALENTINO_50,
} from "../lib/colors";
import { SPACE_XS, SPACE_S, SPACE_M, SPACE_L } from "../lib/spacing";
import { RADIUS_S, RADIUS_M, RADIUS_CIRCLE } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";
import { StatusBar, GestureNav, ChatAppBar } from "../components/AppChrome";
import QuestionnaireOverlay from "../components/QuestionnaireOverlay";
import type { Question, QuestionOption } from "../components/QuestionnaireOverlay";
import PlanCruncherV2 from "../components/PlanCruncherV2";
import type { Persona } from "../components/PersonaToggle";
import { TypeBox, MosaicCard, type QuickAction } from "../components/Chat";
import { ILLUST_MY_SPENDS, ILLUST_FEEDBACK } from "../lib/illustrations";
import ChatCard from "../components/ChatCards";
import { highlightValues } from "../lib/chat-highlight";

import WrappedCard from "./WrappedCard";
import WrappedStory from "./WrappedStory";
import AASim from "./AASim";
import SharedPayScreen from "../components/PayScreen";
import PayScreenFuture from "../components/PayScreenFuture";
import FeaturePDP from "../components/FeaturePDP";
import FeedbackBar from "../components/FeedbackBar";
import JumpToRecentPill from "../components/JumpToRecentPill";
import { SnackbarSlotProvider, SnackbarSlotTarget } from "../components/SnackbarSlot";
import {
  WRAPPED_BEATS,
  PRE_WRAPPED_BUBBLES,
  POST_WRAPPED_PRE_AA_BUBBLES,
  AA_LINKED_BUBBLE,
  GOAL_PREFERENCE_QUESTIONS,
  PLAYGROUND_INTRO_BUBBLES,
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
import type { LadderTier } from "../lib/types";

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
      const chunkSize = 3 + Math.floor(Math.random() * 3);
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
      timerRef.current = window.setTimeout(tick, 20 + Math.random() * 20);
    };
    timerRef.current = window.setTimeout(tick, 80);
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
}: {
  onClose: () => void;
  navKind?: "close" | "back";
  mode?: "simple" | "toggle";
  activeVoice?: Voice;
  onVoiceToggle?: (v: Voice) => void;
}) {
  return (
    <ChatAppBar
      absolute
      variant={mode === "toggle" ? "degen" : "firstTime"}
      navKind={navKind}
      onNav={onClose}
      voice={activeVoice as Persona}
      onVoiceChange={onVoiceToggle ? (p) => onVoiceToggle(p as Voice) : undefined}
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
    ryan: "Got it. Let me walk you through your money so we're on the same page before I build the plan. First, what's coming in.",
    byron: "Cool. Quick tour of your money before I commit you to anything. Starting with what shows up.",
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
    ryan: "Now the pace. Pick the one that feels right.",
    byron: "Three speeds. Pick your poison.",
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
  { title: "Spending, decoded", subtitle: "See exactly where every rupee goes" },
  { title: "Trends, month on month", subtitle: "Watch the patterns build, not just last week" },
  { title: "What your spending says", subtitle: "The habits behind the numbers, no judgement" },
];

// Skip-only mosaic shown after the user opts out of AA linking (Jun 11 terminal
// path). Three tiles surface spend-analytics previews that reveal an existing
// visualization inline (reusing PLAYGROUND_REVEALS); the fourth reconnects the
// AA flow. The on-track review variant keeps its own MOSAIC_* constants in
// Chat.tsx.
type SkipSpendTile = QuickAction & { chipId: string };
const SKIP_SPEND_TILES: SkipSpendTile[] = [
  { chipId: "top-categories", category: "Last month", title: "Top categories", illustration: ILLUST_MY_SPENDS, bg: "linear-gradient(160deg, #ffffff 40%, #fff3e3 100%)" },
  { chipId: "month-story", category: "Spend trends", title: "Month on month", bg: "linear-gradient(160deg, #ffffff 40%, #e6edf9 100%)" },
  { chipId: "spending-says", category: "Spend personality", title: "What your spending says", bg: "linear-gradient(160deg, #ffffff 40%, #f9e4e5 100%)" },
];
const SKIP_CONNECT_TILE: QuickAction = { category: "Accounts", title: "Connect other accounts", illustration: ILLUST_FEEDBACK, bg: "linear-gradient(160deg, #ffffff 40%, #fae2fa 100%)" };

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
  onComplete?: (opts?: { skipGoal?: boolean; goal?: GoalCompletionPayload }) => void;
  config?: OnboardingConfig;
} = {}) {
  const STEPS = useMemo(
    () => buildStepsForConfig(config),
    [config?.goalRequired, config?.terminalAtAa],
  );
  const LAST_STEP_INDEX = STEPS.length - 1;
  const PREFERENCES_STEP_INDEX = STEPS.findIndex((s) => s.kind === "preferences");
  const LADDER_PICK_STEP_INDEX = STEPS.findIndex((s) => s.kind === "ladder-pick");
  const LADDER_INTRO_STEP_INDEX = LADDER_PICK_STEP_INDEX - 1; // the "Now the pace" bot line
  const PLAYGROUND_STEP_INDEX = STEPS.findIndex((s) => s.kind === "playground");
  const AA_CHIPS_STEP_INDEX = STEPS.findIndex((s) => s.kind === "aa-chips");
  const POST_WRAPPED_STEP_INDEX = STEPS.findIndex((s) => s.kind === "wrapped") + 1;
  const aaMode = config?.aaMode ?? "required";
  const introduceByron = config?.introduceByron ?? true;
  const goalRequired = config?.goalRequired ?? true;
  const byronGatedByAa = config?.byronGatedByAa ?? false;
  const payScreenVariant = config?.payScreenVariant ?? "current";
  const terminalAtAa = config?.terminalAtAa ?? false;

  // True once the user taps "Skip for now" on the AA chip step. Triggers the
  // skip-mosaic render path and hides the "linked" bot lines that buy time
  // during the (now non-existent) fetch.
  const [aaSkipped, setAaSkipped] = useState(false);
  // Single overlay - content swaps between "pdp" and "chat" inside it
  const [overlayScreen, setOverlayScreen] = useState<"pdp" | "chat">("pdp");
  const [pdpSeen, setPdpSeen] = useState(false); // once true, pill tap goes straight to chat
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayMounted, setOverlayMounted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [aaChipPicked, setAaChipPicked] = useState<string | null>(null);
  const [aaDismissed, setAaDismissed] = useState(false);
  const [aaNudgeStreamed, setAaNudgeStreamed] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyPhase, setStoryPhase] = useState<"idle" | "expanding" | "open" | "collapsing">("idle");
  const [reviewBeatIndex, setReviewBeatIndex] = useState<number | undefined>(undefined);
  const [aaFlowOpen, setAaFlowOpen] = useState(false);
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
  const cruncherVisibleRef = useRef(false);
  cruncherVisibleRef.current = cruncherVisible;
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
  // After the user confirms, they fund the pot + set the monthly on autopay
  // (reusing the add-to-pot widget). Only once funded do we hand control back to
  // the parent page so the home view can surface the real pot/goal.
  const [potFunded, setPotFunded] = useState(false);
  const planLocked = potFunded;
  // Captures the amount the user actually funds (defaults to the recommended
  // monthly) and the resolved goal payload, so closeOverlay can hand the real
  // goal/pot back to the parent page without depending on render-scope values.
  const fundedAmountRef = useRef<number | null>(null);
  const goalPayloadRef = useRef<GoalCompletionPayload | undefined>(undefined);
  // Once the walkthrough begins, the chat input bar is always available as a
  // visual affordance. It's intentionally inert in this scripted sim: typing
  // clears on send rather than driving a (faked) reply.
  const [walkthroughDraft, setWalkthroughDraft] = useState("");

  // Ready signal
  const [ryanReady, setRyanReady] = useState(false);
  const [pillLabel, setPillLabel] = useState("Meet Ryan");

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
  const [skipResponseStreamed, setSkipResponseStreamed] = useState(false);
  // Spend tiles the user has tapped, in order. Each renders an inline reveal
  // (reply bubble + viz + quip). Tapping a tile dismisses the mosaic; the
  // input-bar "+" menu re-surfaces the same four options.
  const [skipReveals, setSkipReveals] = useState<string[]>([]);
  // True once the latest reveal's quip has finished streaming - gates the next
  // tap so reveals don't overlap (streaming-before-actions).
  const [skipRevealDone, setSkipRevealDone] = useState(true);
  // "+" popover on the terminal-skip input bar (same 4 options as the mosaic).
  const [skipMenuOpen, setSkipMenuOpen] = useState(false);
  const isSnappingRef = useRef(false);
  const snapTimeoutRef = useRef<number | null>(null);
  const overlayAnimatingRef = useRef(false);
  const [userActionCount, setUserActionCount] = useState(0);

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
      const chromeHeight = cruncherVisibleRef.current ? 180 : 108;
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
        onComplete?.({ goal: goalPayloadRef.current });
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
        setSkipMenuOpen(false);
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
      const contentBottom = lastChild
        ? lastChild.offsetTop + lastChild.offsetHeight
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
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, delay);
    return () => window.clearTimeout(t);
  }, [stepIndex, revealedCount, cruncherDone]);

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

  // ── AA actions ────────────────────────────────────────

  const handleAAConnect = useCallback(() => {
    setAaFlowOpen(true);
  }, []);

  const handleAAComplete = useCallback(() => {
    setAaFlowOpen(false);
    // Jun 11: connecting accounts is the end of onboarding. No goal/budget/plan
    // flow to advance into, so finish straight to the home/pay screen.
    if (terminalAtAa) {
      onComplete?.({ skipGoal: true });
      return;
    }
    // Advance past aa-chips to the linked bubble + linked chips
    advanceStep();
  }, [advanceStep, terminalAtAa, onComplete]);

  const handleAAClose = useCallback(() => {
    setAaFlowOpen(false);
    if (aaChipPicked) {
      setAaDismissed(true);
    }
  }, [aaChipPicked]);

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
    setPrefDismissed(true);
    // Scroll to show the nudge after quiz overlay animates away
    window.setTimeout(() => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, OVERLAY_DURATION + 100);
  }, []);


  // When the preferences step becomes active, open the quiz (unless dismissed)
  useEffect(() => {
    if (STEPS[stepIndex]?.kind === "preferences" && !prefQuizOpen && !prefDismissed && Object.keys(prefAnswers).length === 0) {
      const t = window.setTimeout(() => setPrefQuizOpen(true), 400);
      return () => window.clearTimeout(t);
    }
  }, [stepIndex, prefQuizOpen, prefDismissed, prefAnswers]);

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

  // Append goal-nudge once roast has fired AND all 3 spend chips are consumed
  const SPEND_CHIP_IDS = ["top-categories", "month-story", "spending-says"] as const;
  useEffect(() => {
    if (STEPS[stepIndex]?.kind !== "playground") return;
    if (playgroundNudgeShown || playgroundBusy) return;
    if (!playgroundRoastFiredOnce) return;
    const allSpendDone = SPEND_CHIP_IDS.every((id) => chipsConsumed.has(id));
    if (!allSpendDone) return;
    setPlaygroundEvents((prev) => [...prev, { kind: "goal-nudge" }]);
    setPlaygroundNudgeShown(true);
    setPlaygroundBusy(true);
  }, [stepIndex, playgroundNudgeShown, playgroundBusy, playgroundRoastFiredOnce, chipsConsumed]);

  const handlePlaygroundAcceptGoal = useCallback(() => {
    setUserActionCount((c) => c + 1);
    // Skip mosaic + preface bubbles; go straight to the goal questionnaire
    setStepIndex(PREFERENCES_STEP_INDEX);
  }, [PREFERENCES_STEP_INDEX]);

  // Skip-mosaic spend tile → append an inline reveal (reply + viz + quip).
  // Ignore repeat taps and taps while the previous reveal is still streaming, so
  // reveals don't overlap. Tapping dismisses the mosaic + "+" menu.
  const pickSpendTile = useCallback((chipId: string) => {
    if (skipReveals.includes(chipId)) return;
    if (skipReveals.length > 0 && !skipRevealDone) return;
    setSkipReveals((prev) => (prev.includes(chipId) ? prev : [...prev, chipId]));
    setSkipRevealDone(false);
    setSkipMenuOpen(false);
    setUserActionCount((c) => c + 1);
  }, [skipReveals, skipRevealDone]);

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
  const topClearance = cruncherVisible ? 180 : 108;
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

          // Skip path: hide the AA_LINKED_BUBBLE and the PLAYGROUND_INTRO_BUBBLES
          // that live between aa-chips and playground. They were written to buy
          // time during the AA fetch — irrelevant when the user opted out.
          if (
            aaSkipped &&
            AA_CHIPS_STEP_INDEX >= 0 &&
            PLAYGROUND_STEP_INDEX >= 0 &&
            i > AA_CHIPS_STEP_INDEX &&
            i < PLAYGROUND_STEP_INDEX
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
                : step.dv[voice];
            return (
              <div key={`bot-${i}`} ref={ref}>
                <RyanLine
                  text={botText}
                  active={isLast}
                  onDone={shouldAutoAdvance ? advanceStep : undefined}
                />
              </div>
            );
          }

          if (step.kind === "aa-chips") {
            if (aaChipPicked) {
              return (
                <div key={`aa-chips-${i}`}>
                  <div ref={userBubbleRef} className="flex justify-end animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                    <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: VALENTINO_50, padding: "12px 16px" }}>
                      <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>
                        {aaChipPicked === "skip" ? "Skip for now" : "Connect other accounts"}
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
              <div key={`aa-chips-${i}`} className="flex flex-wrap gap-3 animate-chat-message-in" style={{ marginTop: SPACE_L }}>
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
                {aaMode === "optional" && (
                  <button
                    type="button"
                    onClick={() => {
                      setAaChipPicked("skip");
                      setAaSkipped(true);
                      setUserActionCount((c) => c + 1);
                      // Jump straight to the playground step; the in-between
                      // bot lines (AA_LINKED_BUBBLE + PLAYGROUND_INTRO_BUBBLES)
                      // get filtered out below because aaSkipped is true.
                      if (PLAYGROUND_STEP_INDEX >= 0) {
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
                    style={{ backgroundColor: VALENTINO_50, padding: "12px 16px" }}
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
                  <div className="animate-chat-message-in" style={{ marginTop: SPACE_L, display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <MosaicCard action={SKIP_SPEND_TILES[0]} onSelect={() => pickSpendTile(SKIP_SPEND_TILES[0].chipId)} style={{ aspectRatio: "1 / 1" }} />
                      <MosaicCard action={SKIP_SPEND_TILES[1]} onSelect={() => pickSpendTile(SKIP_SPEND_TILES[1].chipId)} style={{ aspectRatio: "1 / 1" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <MosaicCard action={SKIP_SPEND_TILES[2]} onSelect={() => pickSpendTile(SKIP_SPEND_TILES[2].chipId)} style={{ aspectRatio: "1 / 1" }} />
                      <MosaicCard action={SKIP_CONNECT_TILE} onSelect={() => setAaFlowOpen(true)} style={{ aspectRatio: "1 / 1" }} />
                    </div>
                  </div>
                )}
                {skipReveals.map((chipId, j) => {
                  const reveal = PLAYGROUND_REVEALS[chipId];
                  if (!reveal) return null;
                  const tile = SKIP_SPEND_TILES.find((t) => t.chipId === chipId);
                  const isLastReveal = j === skipReveals.length - 1;
                  return (
                    <div key={`skip-reveal-${chipId}`}>
                      <div
                        ref={isLastReveal ? userBubbleRef : undefined}
                        className="flex justify-end animate-chat-message-in"
                        style={{ marginTop: SPACE_L }}
                      >
                        <div
                          className="max-w-[75%] rounded-[16px] rounded-tr-lg"
                          style={{ backgroundColor: VALENTINO_50, padding: "12px 16px" }}
                        >
                          <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{tile?.title}</p>
                        </div>
                      </div>
                      <div className="animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                        <ChatCard card={reveal.card} />
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
              if (c.id === "roast-byron") return !roastCap; // persistent until the cap
              return playgroundRoastFiredOnce && !chipsConsumed.has(c.id);
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
              !goalAcceptedOrAnswered;
            const showPostNudgeChips =
              !playgroundBusy &&
              playgroundGoalNudgeDone &&
              !goalAcceptedOrAnswered;
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
                          style={{ backgroundColor: VALENTINO_50, padding: "12px 16px" }}
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
                        <ChatCard card={reveal.card} />
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
                          text={PLAYGROUND_GOAL_NUDGE[voice]}
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

                {showPostNudgeChips && (
                  <div ref={userBubbleRef} className="flex flex-wrap gap-3 animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                    {goalRequired ? (
                      <button
                        type="button"
                        onClick={handlePlaygroundAcceptGoal}
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
                        Yes, set up a goal
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handlePlaygroundTakeMeHome}
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
                        Take me home
                      </button>
                    )}
                    {(byronGatedByAa ? !aaSkipped : introduceByron) && playgroundRoastIndex < MAX_BYRON_ROASTS && (
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
            return null; // Rendered as the cruncher card chrome above the scroll
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
                <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: VALENTINO_50, padding: "12px 16px" }}>
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
            const pickLabel = lockInChoice === "lock" ? "Lock it in" : "Tweak something";
            const fund = (n: number) => Math.round(n / 500) * 500;
            const fundOptions = [
              { label: formatINR(fund(savingsAmount * 2)), value: fund(savingsAmount * 2) },
              { label: formatINR(fund(savingsAmount * 3)), value: fund(savingsAmount * 3) },
            ];
            const followUpText = lockInChoice === "lock"
              ? (voice === "byron"
                  ? `Locked. Now fund **${potLabel}** and set the autopay — that's the whole point.`
                  : `Locked in. One thing left — let's fund **${potLabel}** and put the monthly on autopay.`)
              : (voice === "byron"
                  ? "Sure. What needs changing?"
                  : "Tell me what feels off and I'll rework it.");
            const reworkLine = voice === "byron"
              ? `Noted. Reworked. Now fund **${potLabel}** and set the autopay.`
              : `Got it. Updated and locked in. Now let's fund **${potLabel}** and set the autopay.`;
            const fundedLine = voice === "byron"
              ? `Done. **${potLabel}** is live. I'll yell when you wobble.`
              : `Done — **${potLabel}** is live. I'll keep tabs and check in if anything drifts.`;
            const reworkDone = lockInChoice === "tweak" && tweakSubmitted && !!tweakDraft;
            const showFunding = lockInChoice === "lock" || reworkDone;
            return (
              <div key={`lock-in-${i}`}>
                <div
                  ref={userBubbleRef}
                  className="flex justify-end animate-chat-message-in"
                  style={{ marginTop: SPACE_L }}
                >
                  <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: VALENTINO_50, padding: "12px 16px" }}>
                    <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{pickLabel}</p>
                  </div>
                </div>
                <div style={{ marginTop: SPACE_M }}>
                  <RyanLine text={followUpText} active={!tweakSubmitted} />
                </div>
                {tweakSubmitted && tweakDraft && (
                  <>
                    <div className="flex justify-end animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                      <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: VALENTINO_50, padding: "12px 16px" }}>
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
                        onArrowTap: potFunded ? closeOverlay : undefined,
                      }}
                    />
                  </div>
                )}
                {potFunded && (
                  <div style={{ marginTop: SPACE_M }}>
                    <RyanLine text={fundedLine} active />
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}

        {/* Bottom spacer for breathing room */}
        <div className="shrink-0" aria-hidden="true" style={{ height: (prefQuizOpen || ladderQuizOpen) ? 260 : 80 }} />
      </div>
    </div>
  );

  return (
    <div
      data-phone-frame
      className="relative h-full w-full overflow-hidden"
      style={{ fontFamily: "var(--font-rubik), var(--font-sans), system-ui, sans-serif" }}
    >
      {/* Layer 0: Pay screen */}
      {payScreenVariant === "current" ? (
        <SharedPayScreen
          onPillTap={openOverlay}
          pillLabel={pillLabel}
          state={ryanReady ? "alert" : "firstTime"}
        />
      ) : (
        <PayScreenFuture onPillTap={openOverlay} pillLabel={pillLabel} animate={ryanReady} />
      )}

      {/* Layer 1: Single overlay - content swaps between PDP and chat */}
      <div
        className="absolute inset-0 z-20"
        style={{
          backgroundColor: BG_PRIMARY,
          transform: overlayOpen ? "translateY(0%)" : "translateY(100%)",
          transition: `transform ${OVERLAY_DURATION}ms ${EASE}`,
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
              onVoiceToggle={(v) => {
                if (v === voice) return;
                setContentVisible(false);
                window.setTimeout(() => {
                  setVoice(v);
                  window.setTimeout(() => setContentVisible(true), 50);
                }, 200);
              }}
            />

            {/* PlanCruncherV2 - below app bar */}
            {overlayMounted && cruncherVisible && (
              <div className="absolute left-4 right-4 z-10" style={{ top: 108 }}>
                <PlanCruncherV2
                  goalName={goalLabel}
                  visible={cruncherVisible}
                  statusText={cruncherStatus}
                  completed={cruncherDone}
                  completedSubtitle="Your spending snapshot is ready"
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
                    height: 120,
                    pointerEvents: "none",
                    background: "linear-gradient(to bottom, white 60%, transparent 100%)",
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
                  bottom={(prefQuizOpen || ladderQuizOpen) ? 340 : SPACE_L}
                />

                {/* Unified bottom chrome stack: snackbar slot sits at the top
                    of this column so it always renders just above whichever
                    chrome is active (questionnaire / input bar / gesture
                    nav). Composing via flex means we don't hard-code offsets
                    per case. */}
                {/* Terminal-skip "+" popover: same four options as the mosaic,
                    anchored above the input bar's "+" button. */}
                {terminalAtAa && aaSkipped && (
                  <>
                    {skipMenuOpen && (
                      <div
                        onClick={() => setSkipMenuOpen(false)}
                        style={{ position: "absolute", inset: 0, zIndex: 25 }}
                      />
                    )}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 80,
                        left: SPACE_M,
                        width: 240,
                        backgroundColor: BG_PRIMARY,
                        borderRadius: RADIUS_M,
                        boxShadow: `${ELEVATION_CARD}, 0px 8px 24px rgba(0,0,0,0.12)`,
                        zIndex: 30,
                        overflow: "hidden",
                        opacity: skipMenuOpen ? 1 : 0,
                        pointerEvents: skipMenuOpen ? "auto" : "none",
                        transition: "opacity 150ms ease",
                      }}
                    >
                      {[
                        ...SKIP_SPEND_TILES.map((t) => ({
                          key: t.chipId,
                          label: t.title,
                          illustration: t.illustration,
                          onSelect: () => pickSpendTile(t.chipId),
                        })),
                        {
                          key: "connect",
                          label: SKIP_CONNECT_TILE.title,
                          illustration: SKIP_CONNECT_TILE.illustration,
                          onSelect: () => {
                            setSkipMenuOpen(false);
                            setAaFlowOpen(true);
                          },
                        },
                      ].map((item) => (
                        <div
                          key={item.key}
                          onClick={item.onSelect}
                          className="transition-colors active:bg-gray-50"
                          style={{ display: "flex", alignItems: "center", gap: SPACE_S, padding: SPACE_M, cursor: "pointer" }}
                        >
                          <div
                            style={{ width: 40, height: 40, borderRadius: RADIUS_S, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
                          >
                            {item.illustration && (
                              <img src={item.illustration} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
                            )}
                          </div>
                          <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{item.label}</span>
                        </div>
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
                    // Jun 11 terminal path: the chat input bar only appears once
                    // onboarding is over - i.e. after the AA prompt, on the skip
                    // mosaic (aaSkipped). Earlier steps keep just the gesture nav.
                    !aaSkipped ? (
                      <GestureNav backgroundColor="transparent" />
                    ) : (
                    // Skip mosaic: open-ended "Ask Ryan" bar; the "+" button
                    // re-opens the same four options as the mosaic.
                    <TypeBox
                      value={walkthroughDraft}
                      onChange={setWalkthroughDraft}
                      onSubmit={() => setWalkthroughDraft("")}
                      placeholder={`Ask ${voice === "byron" ? "Byron" : "Ryan"}...`}
                      leftAction={
                        <div
                          onClick={() => setSkipMenuOpen((o) => !o)}
                          className="flex items-center justify-center rounded-full bg-white shrink-0 transition-transform active:scale-[0.97]"
                          style={{ width: 48, height: 48, border: `1px solid ${OUTLINE_SUBTLE}`, boxShadow: ELEVATION_CARD, cursor: "pointer", zIndex: 30 }}
                        >
                          <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-label="More actions" style={{ display: "block" }}>
                            <path d="M8.05762 19.99C7.96821 19.99 7.87879 19.99 7.77943 19.9598C6.32886 19.6284 4.9379 18.9554 3.76552 18.0113C3.22901 17.5794 3.13959 16.7859 3.56682 16.2436C3.99404 15.7012 4.77894 15.6108 5.31545 16.0427C6.18977 16.7458 7.23299 17.258 8.32588 17.5091C8.99156 17.6598 9.41878 18.3327 9.25981 19.0057C9.13065 19.5882 8.61401 19.9799 8.04769 19.9799L8.05762 19.99ZM11.9523 19.99C11.386 19.99 10.8793 19.5982 10.7402 19.0157C10.5912 18.3428 11.0084 17.6698 11.6741 17.5091C12.767 17.258 13.8003 16.7458 14.6846 16.0427C15.2211 15.6108 16.006 15.7012 16.4332 16.2436C16.8604 16.7859 16.771 17.5794 16.2345 18.0113C15.072 18.9554 13.6811 19.6284 12.2305 19.9699C12.1411 19.99 12.0417 20 11.9523 20V19.99ZM2.11624 15.2191C1.65922 15.2191 1.21212 14.958 0.993542 14.506C0.337804 13.13 0 11.6636 0 10.1268C0 9.4338 0.556384 8.87134 1.24193 8.87134C1.92747 8.87134 2.48386 9.4338 2.48386 10.1268C2.48386 11.2819 2.74218 12.3867 3.22901 13.4212C3.52707 14.044 3.26875 14.7973 2.65276 15.0986C2.47392 15.1789 2.29508 15.2191 2.11624 15.2191ZM17.8838 15.199C17.7049 15.199 17.5161 15.1588 17.3472 15.0785C16.7312 14.7772 16.4729 14.0239 16.771 13.4011C17.2578 12.3666 17.5161 11.2618 17.5161 10.1067C17.5161 10.0766 17.5161 10.0364 17.5161 10.0063C17.5161 9.31327 18.0725 8.78095 18.7581 8.78095C19.4436 8.78095 20 9.37354 20 10.0666C20 10.0766 20 10.0967 20 10.1168C20 11.6435 19.6622 13.1099 19.0164 14.4859C18.8077 14.9379 18.3607 15.199 17.8937 15.199H17.8838ZM2.09637 7.5355C1.91754 7.5355 1.72876 7.49533 1.55986 7.41498C0.943865 7.11366 0.675609 6.37041 0.973671 5.73764C1.61947 4.38171 2.57327 3.1664 3.73572 2.22227C4.27223 1.79038 5.05713 1.87074 5.48435 2.41311C5.91157 2.95548 5.82216 3.74895 5.29558 4.18084C4.42126 4.89395 3.69598 5.80795 3.21908 6.82238C3.01043 7.27436 2.56334 7.5355 2.09637 7.5355ZM17.8738 7.48528C17.4168 7.48528 16.9697 7.22414 16.7611 6.78221C16.2742 5.76777 15.5489 4.85378 14.6647 4.1507C14.1282 3.71882 14.0387 2.92535 14.466 2.38298C14.8932 1.8406 15.6781 1.75021 16.2146 2.1821C17.387 3.11618 18.3507 4.33149 18.9965 5.68742C19.2946 6.31015 19.0363 7.06344 18.4203 7.36476C18.2414 7.45515 18.0626 7.49533 17.8738 7.49533V7.48528ZM8.01788 2.73451C7.45156 2.73451 6.94486 2.3428 6.80576 1.76025C6.65673 1.08731 7.07402 0.414368 7.73969 0.253666C9.19026 -0.0777833 10.7402 -0.0878272 12.1808 0.243622C12.8465 0.394281 13.2737 1.06722 13.1247 1.74016C12.9757 2.41311 12.31 2.845 11.6443 2.69434C10.5514 2.44324 9.37904 2.45328 8.29608 2.70438C8.20666 2.72447 8.1073 2.73451 8.01788 2.73451Z" fill={TEXT_PRIMARY} />
                          </svg>
                        </div>
                      }
                    />
                    )
                  ) : stepIndex > PREFERENCES_STEP_INDEX ? (
                    // Money walkthrough onward: surface the chat input bar so
                    // the conversation always feels typeable (Option A: inert).
                    <TypeBox
                      value={walkthroughDraft}
                      onChange={setWalkthroughDraft}
                      onSubmit={() => setWalkthroughDraft("")}
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
            opacity: storyPhase === "expanding" ? 0 : storyPhase === "collapsing" ? 0 : 1,
            transform: storyPhase === "expanding" ? "scale(0.97)" : storyPhase === "collapsing" ? "scale(0.97)" : "scale(1)",
            transition: "opacity 250ms ease, transform 250ms ease",
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
    </div>
  );
}
