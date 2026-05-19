"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
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
import { SPACE_XS, SPACE_M, SPACE_L } from "../lib/spacing";
import { RADIUS_M, RADIUS_CIRCLE } from "../lib/radii";
import { StatusBar, GestureNav, ChatAppBar } from "../components/AppChrome";
import QuestionnaireOverlay from "../components/QuestionnaireOverlay";
import type { Question, QuestionOption } from "../components/QuestionnaireOverlay";
import PlanCruncherV2 from "../components/PlanCruncherV2";
import type { Persona } from "../components/PersonaToggle";
import { TypeBox } from "../components/Chat";
import ChatCard from "../components/ChatCards";
import { highlightValues } from "../lib/chat-highlight";

import WrappedCard from "./WrappedCard";
import WrappedStory from "./WrappedStory";
import AASim from "./AASim";
import SharedPayScreen from "../components/PayScreen";
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

const STEPS: Step[] = [
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

const LAST_STEP_INDEX = STEPS.length - 1;
// Pause-point + post-pause logic is retired: the flow is now linear, no
// exit-and-re-enter beat. Sentinels kept so a couple of remaining call sites
// (auto-advance guard, snap-scroll ref) don't blow up.
const PAUSE_STEP_INDEX = -1;
const POST_PAUSE_STEP_INDEX = -1;

// Goal questionnaire step - chip "Yes, set up a goal" jumps straight here
const PREFERENCES_STEP_INDEX = STEPS.findIndex((s) => s.kind === "preferences");

// After this many roasts, retire the "Roast me, Byron" chip and lean on the
// goal-setting CTA instead. Byron's voice has been established; further
// repetition stops adding signal.
const MAX_BYRON_ROASTS = 2;

// First step after wrapped - this is where we scroll to after story closes
const POST_WRAPPED_STEP_INDEX = STEPS.findIndex((s) => s.kind === "wrapped") + 1;

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
  { title: "Spending, decoded", subtitle: "See where your money actually goes" },
  { title: "Goals on autopilot", subtitle: "Set a target, get a plan, stay on track" },
];

export default function OnboardingSim({ onComplete }: { onComplete?: () => void } = {}) {
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
  const planLocked = lockInChoice === "lock" || tweakSubmitted;

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
      const chromeHeight = cruncherVisible ? 180 : 108;
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
  }, [cruncherVisible]);

  // Map Question type for overlay
  const prefQuestions: Question[] = GOAL_PREFERENCE_QUESTIONS.map((q) => ({
    id: q.id,
    text: q.text,
    options: q.options,
  }));

  const advanceStep = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, LAST_STEP_INDEX));
  }, []);

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
        onComplete?.();
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
        setFootprintConfirmed(new Set());
        setLadderTier(null);
        setLadderQuizOpen(false);
        setLockInChoice(null);
        setTweakDraft("");
        setTweakSubmitted(false);
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
    // Advance past aa-chips to the linked bubble + linked chips
    advanceStep();
  }, [advanceStep]);

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
    const goalType = GOAL_PREFERENCE_QUESTIONS[0].options.find((o) => o.id === answers["goal-type"])?.label || "Your goal";
    const dest = answers["destination"] || "";
    setGoalLabel(dest ? `Trip to ${dest}` : goalType);
    setPrefQuizOpen(false);
    setUserActionCount((c) => c + 1);
    advanceStep();
  }, [advanceStep]);

  const handlePrefSelect = useCallback((questionId: string, option: QuestionOption) => {
    const next = { ...prefAnswers, [questionId]: option.id };
    setPrefAnswers(next);
    // Skip destination for non-trip goals
    let nextIdx = prefQuizIndex + 1;
    if (questionId === "goal-type" && option.id !== "trip") {
      // destination is index 1 - skip it
      const destIdx = prefQuestions.findIndex((q) => q.id === "destination");
      if (destIdx === nextIdx) nextIdx += 1;
    }
    if (nextIdx < prefQuestions.length) {
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
  // overlay (same QuestionnaireOverlay variant the goal quiz uses).
  useEffect(() => {
    if (STEPS[stepIndex]?.kind === "ladder-pick" && !ladderQuizOpen && ladderTier == null) {
      const t = window.setTimeout(() => setLadderQuizOpen(true), 400);
      return () => window.clearTimeout(t);
    }
  }, [stepIndex, ladderQuizOpen, ladderTier]);

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
  }, []);

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

          if (step.kind === "bot") {
            const shouldAutoAdvance = isLast && (i + 1 !== PAUSE_STEP_INDEX + 1);
            const isPostWrapped = i === POST_WRAPPED_STEP_INDEX;
            const isPostPause = i === POST_PAUSE_STEP_INDEX;
            const ref = isPostWrapped ? postWrappedRef : isPostPause ? postPauseRef : undefined;
            return (
              <div key={`bot-${i}`} ref={ref}>
                <RyanLine
                  text={step.dv[voice]}
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
                      <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>Connect other accounts</p>
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
                    {playgroundRoastIndex < MAX_BYRON_ROASTS && (
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
                      setFootprintConfirmed((prev) => {
                        const next = new Set(prev);
                        next.add(step.bucketIndex);
                        return next;
                      });
                      setUserActionCount((c) => c + 1);
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
            return (
              <div key={`plan-${i}`} className="animate-chat-message-in" style={{ marginTop: SPACE_L, display: "flex", flexDirection: "column", gap: SPACE_M }}>
                <ChatCard card={{ type: "budget-summary", plan: SPENDING_PLAN_FIXTURE }} />
                <ChatCard card={{ type: "category-budgets", plan: SPENDING_PLAN_FIXTURE }} />
              </div>
            );
          }

          if (step.kind === "verdict") {
            const verdictText = voice === "byron"
              ? "Math checks out. ₹12k/month and you actually get there."
              : "This works. ₹12k a month and the trip is on the calendar.";
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
            const followUpText = lockInChoice === "lock"
              ? (voice === "byron"
                  ? "Locked. Trip to Japan pot is live. I'll keep eyes on it and yell when you wobble."
                  : "Locked in. Trip to Japan pot is live. I'll keep tabs and check in if anything drifts.")
              : (voice === "byron"
                  ? "Sure. What needs changing?"
                  : "Tell me what feels off and I'll rework it.");
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
                      <RyanLine
                        text={voice === "byron"
                          ? "Noted. Reworked. Trip to Japan pot is live with the tweak baked in."
                          : "Got it. Updated and locked in. Trip to Japan pot is live."}
                        active
                      />
                    </div>
                  </>
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
      <SharedPayScreen onPillTap={openOverlay} pillLabel={pillLabel} animate={ryanReady} />

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
