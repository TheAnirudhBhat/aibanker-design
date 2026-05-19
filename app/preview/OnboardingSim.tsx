"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  OUTLINE_SUBTLE,
  BG_PRIMARY,
  BG_CARD,
  BG_SECONDARY,
  SLATE_10,
  VALENTINO_50,
} from "../lib/colors";
import { SPACE_XS, SPACE_M, SPACE_L } from "../lib/spacing";
import { RADIUS_M, RADIUS_CIRCLE } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";
import { StatusBar, GestureNav, ChatAppBar } from "../components/AppChrome";
import QuestionnaireOverlay from "../components/QuestionnaireOverlay";
import type { Question, QuestionOption } from "../components/QuestionnaireOverlay";
import PlanCruncherV2 from "../components/PlanCruncherV2";
import type { Persona } from "../components/PersonaToggle";
import { TypeBox } from "../components/Chat";
import ChatCard from "../components/ChatCards";

import WrappedCard from "./WrappedCard";
import WrappedStory from "./WrappedStory";
import AASim from "./AASim";
import SharedPayScreen from "../components/PayScreen";
import FeaturePDP from "../components/FeaturePDP";
import FeedbackBar from "../components/FeedbackBar";
import {
  WRAPPED_BEATS,
  PRE_WRAPPED_BUBBLES,
  POST_WRAPPED_PRE_AA_BUBBLES,
  AA_LINKED_BUBBLE,
  GOAL_PREFERENCE_QUESTIONS,
  PLAYGROUND_INTRO_BUBBLES,
  PLAYGROUND_CHIPS,
  PLAYGROUND_REVEALS,
  PLAYGROUND_BYRON_ROASTS,
  PLAYGROUND_RYAN_HANDOFF,
  PLAYGROUND_GOAL_NUDGE,
  type PlaygroundReveal,
  CLARIFYING_QUESTIONS,
  IDLE_CRUNCHER_TEXTS,
  VERBOSE_PLAN_TEXT,
  AA_DISMISS_NUDGE,
  PREF_DISMISS_NUDGE,
  REENTRY_BUBBLE,
  ONBOARDING_OBLIGATIONS,
  OBLIGATIONS_INTRO,
  POST_PLAN_CHIPS,
  DISCLAIMERS,
  type Voice,
} from "./fixtures/wrappedFixture";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const OVERLAY_DURATION = 460;

// ══════════════════════════════════════════════════════════════════
//  Helpers — copied from the locked RefreshSession pattern
// ══════════════════════════════════════════════════════════════════

const HIGHLIGHT_RE = /\*\*(.+?)\*\*|₹[\d,.]+\s*[Lk]?|[\d,.]+%/g;

function highlightValues(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = HIGHLIGHT_RE.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const boldText = match[1] ?? match[0];
    parts.push(<span key={match.index} style={typography.buttonSmall}>{boldText}</span>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
}

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
  | { kind: "mosaic" }
  | { kind: "obligations-widget" }
  | { kind: "clarify-chips"; questionIndex: number }
  | { kind: "plan-crunching" }
  | { kind: "input-bar" }
  | { kind: "ready" };

function bot(dv: DualVoiceRef): Step { return { kind: "bot", dv }; }

const STEPS: Step[] = [
  // ── Phase 1: Meet Ryan — wrapped quiz ──
  ...PRE_WRAPPED_BUBBLES.map(bot),
  { kind: "wrapped" },
  ...POST_WRAPPED_PRE_AA_BUBBLES.map(bot),
  // ── Phase 2: Account aggregation ──
  { kind: "aa-chips" },
  bot(AA_LINKED_BUBBLE),
  // ── Phase 3: Spend-analytics playground while transactions fetch ──
  ...PLAYGROUND_INTRO_BUBBLES.map(bot),
  { kind: "playground" },
  { kind: "mosaic" },
  // ── PAUSE — user exits, pill updates, user re-enters ──
  // ── Phase 4: Goal preferences ──
  { kind: "preferences" },
  // ── Phase 5: Clarifying questions with widgets ──
  bot(REENTRY_BUBBLE),
  ...OBLIGATIONS_INTRO.map(bot),
  { kind: "obligations-widget" },
  bot(CLARIFYING_QUESTIONS[1].botText),
  { kind: "clarify-chips", questionIndex: 1 },
  bot(CLARIFYING_QUESTIONS[2].botText),
  { kind: "clarify-chips", questionIndex: 2 },
  // ── Phase 6: Plan crunching + verbose plan ──
  bot({ ryan: "Thanks — give me a moment while I crunch the numbers.", byron: "Crunching. Sit tight." }),
  { kind: "plan-crunching" },
  bot(VERBOSE_PLAN_TEXT),
  { kind: "ready" },
  { kind: "input-bar" },
];

const LAST_STEP_INDEX = STEPS.length - 1;

// Pause point — the mosaic step; user must exit + re-enter after this
const PAUSE_STEP_INDEX = STEPS.findIndex((s) => s.kind === "mosaic");

// First step after pause — where we scroll to on re-entry
const POST_PAUSE_STEP_INDEX = PAUSE_STEP_INDEX + 1;

// Goal questionnaire step — chip "Yes, set up a goal" jumps straight here
const PREFERENCES_STEP_INDEX = STEPS.findIndex((s) => s.kind === "preferences");

// First step after wrapped — this is where we scroll to after story closes
const POST_WRAPPED_STEP_INDEX = STEPS.findIndex((s) => s.kind === "wrapped") + 1;

// Ryan's text line — plain text, typewriter on first reveal, full text afterwards
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
//  Playground traits panel — annotations under spending-heatmap card
// ══════════════════════════════════════════════════════════════════

function PlaygroundTraitsList({ traits }: { traits: NonNullable<PlaygroundReveal["traits"]> }) {
  return (
    <div style={{ marginTop: SPACE_M, display: "flex", flexDirection: "column", gap: SPACE_M }}>
      {traits.map((t) => (
        <div key={t.label} style={{ display: "flex", gap: SPACE_M, alignItems: "flex-start" }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>{t.emoji}</span>
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
  // Single overlay — content swaps between "pdp" and "chat" inside it
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
    | { kind: "ryan-handoff" }
    | { kind: "goal-nudge" };
  const [playgroundEvents, setPlaygroundEvents] = useState<PlaygroundEvent[]>([]);
  const [chipsConsumed, setChipsConsumed] = useState<Set<string>>(new Set());
  const [playgroundRoastFiredOnce, setPlaygroundRoastFiredOnce] = useState(false);
  const [playgroundRoastIndex, setPlaygroundRoastIndex] = useState(0);
  const [playgroundNudgeShown, setPlaygroundNudgeShown] = useState(false);
  const [playgroundGoalNudgeDone, setPlaygroundGoalNudgeDone] = useState(false);
  const [playgroundBusy, setPlaygroundBusy] = useState(false);

  // Obligations widget
  const [obligationsSubmitted, setObligationsSubmitted] = useState(false);

  // Clarifying questions
  const [clarifyPicked, setClarifyPicked] = useState<Record<number, string>>({});

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
      // Only full-reset if AA hasn't completed yet
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
        setClarifyPicked({});
        setUserActionCount(0);
        setGoalLabel("Your goal");
        setRyanReady(false);
        setPillLabel("Meet Ryan");
      }
    }, OVERLAY_DURATION);
  }, [aaChipPicked, pdpSeen]);

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
      setHasContentBelow(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
    };
    onScroll(); // initial check
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [overlayOpen, stepIndex]);

  // Auto-scroll — deferred, overlay-aware, cancellable
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

  // ── After user exits during Byron intro / mosaic — 5s pill update ──

  const isInByronPhase = stepIndex >= PAUSE_STEP_INDEX - 2 && stepIndex <= PAUSE_STEP_INDEX;
  useEffect(() => {
    if (overlayOpen || !isInByronPhase || ryanReady) return;
    const t = window.setTimeout(() => {
      setRyanReady(true);
      setPillLabel(voice === "byron" ? "Byron is ready" : "Ryan is ready");
    }, 5000);
    return () => window.clearTimeout(t);
  }, [overlayOpen, isInByronPhase, ryanReady, voice]);

  // When user re-opens overlay after pill updated, jump to preferences phase
  useEffect(() => {
    if (!overlayOpen || !ryanReady) return;
    const postPauseIndex = PAUSE_STEP_INDEX + 1;
    if (stepIndex >= PAUSE_STEP_INDEX - 2 && stepIndex <= PAUSE_STEP_INDEX) {
      // Wait for overlay slide-up to finish, THEN set the step and snap-scroll to it
      const t = window.setTimeout(() => {
        setStepIndex(postPauseIndex);
        // Snap-scroll to the post-pause text after it renders
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const el = postPauseRef.current;
          if (el) snapScrollTo(el, 0);
        }));
      }, OVERLAY_DURATION + 100);
      return () => window.clearTimeout(t);
    }
  }, [overlayOpen, ryanReady, stepIndex]);

  // Plan-crunching step — cycle idle texts then advance
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
        }, 1500);
        return;
      }
      setCruncherStatus(IDLE_CRUNCHER_TEXTS[idx]);
    }, 1400);
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
      // destination is index 1 — skip it
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

  // ── Playground: chip-tap & event handlers ────────────────────
  const appendPlaygroundEvent = useCallback((evt: PlaygroundEvent) => {
    setPlaygroundEvents((prev) => [...prev, evt]);
  }, []);

  const handlePlaygroundChip = useCallback((chipId: string) => {
    if (playgroundBusy) return;

    if (chipId === "roast-byron") {
      const roastText = PLAYGROUND_BYRON_ROASTS[playgroundRoastIndex % PLAYGROUND_BYRON_ROASTS.length];
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
          // Already on byron — append after a beat
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

  const handlePlaygroundByronRoastDone = useCallback((isFirst: boolean) => {
    if (!isFirst) {
      // Subsequent roast — stays on byron
      setPlaygroundBusy(false);
      return;
    }
    // First roast — hold on Byron, then slow fade back to Ryan with handoff line
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
  }, [appendPlaygroundEvent]);

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
  const isOnReady = STEPS[stepIndex]?.kind === "ready";

  // Fire onComplete when the sim reaches the final "ready" step
  const onCompleteCalledRef = useRef(false);
  useEffect(() => {
    if (isOnReady && onComplete && !onCompleteCalledRef.current) {
      onCompleteCalledRef.current = true;
      onComplete();
    }
  }, [isOnReady, onComplete]);

  // Top clearance increases when cruncher is visible
  const topClearance = cruncherVisible ? 180 : 108;

  const chatContent = (
    <div ref={scrollRef} className="absolute inset-0 w-full overflow-y-auto overscroll-none scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transition-opacity duration-500 ease-out" style={{ opacity: contentVisible ? 1 : 0 }}>
      <div ref={contentRef} className="flex flex-col" style={{ paddingLeft: SPACE_L, paddingRight: SPACE_L, paddingBottom: SPACE_L }}>
        {/* Clearance for floating app bar + cruncher */}
        <div className="shrink-0" aria-hidden="true" style={{ height: topClearance, transition: "height 300ms ease" }} />

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
            // Dismissed — show Ryan nudge + reopen button
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

          if (step.kind === "clarify-chips") {
            const qIdx = step.questionIndex;
            const cq = CLARIFYING_QUESTIONS[qIdx];
            if (clarifyPicked[qIdx] != null) {
              const chip = cq.chips.find((c) => c.id === clarifyPicked[qIdx]);
              return (
                <div ref={userBubbleRef} key={`clarify-${qIdx}-${i}`} className="flex justify-end animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                  <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: VALENTINO_50, padding: "12px 16px" }}>
                    <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{chip?.label}</p>
                  </div>
                </div>
              );
            }
            return (
              <div key={`clarify-${qIdx}-${i}`} className="flex flex-wrap gap-3 animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                {cq.chips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      setClarifyPicked((prev) => ({ ...prev, [qIdx]: chip.id }));
                      setUserActionCount((c) => c + 1);
                      advanceStep();
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

          if (step.kind === "playground") {
            const visibleChips = PLAYGROUND_CHIPS.filter((c) => {
              if (c.id === "roast-byron") return true; // persistent
              return playgroundRoastFiredOnce && !chipsConsumed.has(c.id);
            });
            const lastEventIdx = playgroundEvents.length - 1;
            // Find the index of the most recent user-tap event so we can attach userBubbleRef there
            let lastUserTapIdx = -1;
            for (let k = lastEventIdx; k >= 0; k--) {
              if (playgroundEvents[k].kind === "user-tap") { lastUserTapIdx = k; break; }
            }
            const showChips =
              !playgroundBusy &&
              !playgroundNudgeShown &&
              visibleChips.length > 0;
            const showPostNudgeChips = !playgroundBusy && playgroundGoalNudgeDone;
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
                    return (
                      <div key={`pg-${j}`} className="animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                        <ChatCard card={reveal.card} />
                        {reveal.traits && <PlaygroundTraitsList traits={reveal.traits} />}
                        <RyanLine
                          text={reveal.quip[voice]}
                          active={isLastEvent}
                          onDone={isLastEvent ? handlePlaygroundRevealDone : undefined}
                        />
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
                        color: BG_PRIMARY,
                        backgroundColor: TEXT_PRIMARY,
                        border: "none",
                        borderRadius: RADIUS_CIRCLE,
                        padding: `${SPACE_XS}px ${SPACE_M}px`,
                        cursor: "pointer",
                      }}
                    >
                      Yes, set up a goal
                    </button>
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
                  </div>
                )}
              </div>
            );
          }

          if (step.kind === "mosaic") {
            // Replaced by the spend-analytics playground; never rendered.
            return null;
          }

          if (step.kind === "obligations-widget") {
            return (
              <div key={`obligations-${i}`} className="animate-chat-message-in" style={{ marginTop: SPACE_L }}>
                <ChatCard
                  card={{
                    ...ONBOARDING_OBLIGATIONS,
                    submitted: obligationsSubmitted,
                    onSubmit: (selected) => {
                      setObligationsSubmitted(true);
                      setUserActionCount((c) => c + 1);
                      advanceStep();
                    },
                  }}
                />
              </div>
            );
          }

          if (step.kind === "plan-crunching") {
            return null;
          }

          if (step.kind === "ready") {
            return (
              <div key={`ready-${i}`} className="animate-chat-message-in" style={{ marginTop: SPACE_M }}>
                <FeedbackBar voice={voice} />
              </div>
            );
          }

          if (step.kind === "input-bar") {
            return null; // Rendered outside the scroll container as a fixed bottom element
          }

          return null;
        })}

        {/* Bottom spacer for breathing room */}
        <div className="shrink-0" aria-hidden="true" style={{ height: prefQuizOpen ? 260 : 80 }} />
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

      {/* Layer 1: Single overlay — content swaps between PDP and chat */}
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
          />
        )}

        {/* ── Chat screen ── */}
        {overlayScreen === "chat" && (
          <>
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

            {/* PlanCruncherV2 — below app bar */}
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
                {/* Top fade gradient — visible on scroll */}
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
                <button
                  onClick={() => {
                    const scroller = scrollRef.current;
                    if (scroller) scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
                  }}
                  className="absolute z-[11] flex items-center justify-center rounded-full bg-white active:scale-95 transition-all duration-200 ease-out"
                  style={{
                    bottom: prefQuizOpen ? 340 : 80,
                    right: SPACE_L,
                    width: 36,
                    height: 36,
                    border: `1px solid ${OUTLINE_SUBTLE}`,
                    boxShadow: ELEVATION_CARD,
                    opacity: hasContentBelow ? 1 : 0,
                    pointerEvents: hasContentBelow ? "auto" : "none",
                    transition: `opacity 200ms ease, bottom 300ms ease`,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3v10M4 9l4 4 4-4" stroke={TEXT_TERTIARY} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* QuestionnaireOverlay */}
                {prefQuizOpen && (
                  <div className="absolute bottom-0 left-0 right-0 z-20">
                    <QuestionnaireOverlay
                      questions={prefQuestions}
                      currentIndex={prefQuizIndex}
                      answers={prefAnswers}
                      onSelectOption={handlePrefSelect}
                      onSubmitFreeText={handlePrefFreeText}
                      onNavigate={handlePrefNavigate}
                      onClose={handlePrefClose}
                    />
                  </div>
                )}

                {/* Input bar — appears after verbose plan */}
                {STEPS[stepIndex]?.kind === "input-bar" && (
                  <div className="absolute bottom-0 left-0 right-0 z-20 animate-chat-message-in">
                    <div className="flex flex-wrap gap-3 px-4 pb-2">
                      {POST_PLAN_CHIPS.map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
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
                    <TypeBox
                      value=""
                      onChange={() => {}}
                      onSubmit={() => {}}
                      placeholder={`Reply to ${voice === "byron" ? "Byron" : "Ryan"}...`}
                    />
                  </div>
                )}
              </>
            )}

            {/* Gesture nav — hidden when input bar is showing */}
            {STEPS[stepIndex]?.kind !== "input-bar" && (
              <div className="absolute bottom-0 left-0 right-0">
                <GestureNav backgroundColor="transparent" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Layer 2: Wrapped story — fade crossfade */}
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
