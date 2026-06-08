"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, useRef, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { getPreset, applySubstate, PERSONA_PRESETS } from "@/app/data/userStatePresets";
import type { PersonaPreset, SubstateGroup } from "@/app/data/userStatePresets";
import Chat, { type ChatChip, type ChatMessage } from "@/app/components/Chat";
import ChatCard, { type ChatCardData, CATEGORY_ICONS, CATEGORY_COLORS, DlsTag } from "@/app/components/ChatCards";
import { getSuggestions } from "@/app/components/ChatInitialScreen";
import { AppBar, BOTTOM_INSET, NavButton } from "@/app/components/AppChrome";
import GoalTracker, { type GoalIndicatorData } from "@/app/components/GoalTracker";
import GoalListScreen from "@/app/components/GoalListScreen";
import PotDetail from "@/app/components/PotDetail";
import PlanMode, { type PlanStep } from "@/app/components/PlanMode";
import PayScreen from "@/app/components/PayScreen";
import QuestionnaireOverlay, { type Question, type QuestionOption } from "@/app/components/QuestionnaireOverlay";
import OnboardingSim from "@/app/preview/OnboardingSim";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button as ShadButton } from "@/components/ui/button";
import { RotateCw, Lock } from "lucide-react";
import {
  affordAmountChips,
  amountChips,
  budgetAgreementChips,
  budgetDigestChips,
  budgetStyleChips,
  goalChips,
  leakFixChips,
  onTrackChips,
  paceChoiceChips,
  planConfirmChips,
  planAdjustChips,
  pinnedGoalChips,
  steadyStateChips,
  tradeoffChoiceChips,
  timelineChips,
  understandActionChips,
  understandDrilldownChips,
  understandMenuChips,
  buildDynamicAffordCategoryChips,
  type ChipOption,
} from "@/app/data/flows";
import {
  getFDSuggestion,
} from "@/app/data/mockProfiles";
import type { PacePreset } from "@/app/data/mockProfiles";
import {
  deriveProfile,
  computeWrappedSlides,
  getLifestyleCategories,
  computePacePresets,
  computeBudgetLevers,
  computeLeakInsights,
  getRecentTransactionsForRating,
  parseINR,
  formatINR,
} from "@/app/lib/financial-data";
import type {
  ChatMessage as AIChatMessage,
  FlowAssistResponse,
  FlowAction,
  HomeSubflow,
} from "@/app/lib/types";
import { getEffectiveBudget } from "@/app/lib/budget-utils";
import { buildRoast } from "@/app/lib/roast";
import { SPENDING_PLAN_FIXTURE } from "@/app/preview/fixtures/gbpFlowFixture";
import { formatDateMonth } from "@/app/lib/format-date";
import { useUserState } from "@/app/hooks/useUserState";
import { typography } from "@/app/lib/typography";
import {
  VALENTINO_50, VALENTINO_500, BG_PRIMARY, BG_SECONDARY,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY,
  ALPHA_BLACK_20, ALPHA_BLACK_30, ALPHA_BLACK_40,
  OUTLINE_SUBTLE,
  BLUE_50, BLUE_500,
  GREEN_50, GREEN_500,
  RED_50, RED_500,
  ORANGE_50, ORANGE_500,
  SLATE_30, SLATE_800,
} from "@/app/lib/colors";
import { RADIUS_L, RADIUS_PILL, RADIUS_CIRCLE } from "@/app/lib/radii";
import {
  DBG_SPEND_OVERVIEW, DBG_CATEGORY_BAR,
  DBG_GOAL_AHEAD, DBG_GOAL_BEHIND, DBG_GOAL_ONTRACK,
  DBG_FD_SETUP, DBG_FD_ACTIVATED,
  DBG_MERCHANT_BAR, DBG_CATEGORY_MOM, DBG_SPEND_TREND,
  DBG_HEATMAP, DBG_DONUT_V2, DBG_TXN_TABLE,
  DBG_OBLIGATIONS_V2,
  DBG_GOAL_QUESTIONS,
} from "@/app/lib/debug-fixtures";

type GoalProgressCardData = Extract<ChatCardData, { type: "goal-progress" }>;
type GoalDetailSnapshot = {
  name: string;
  saved: number;
  target: number;
  pct: number;
  status: "ahead" | "behind" | "on-track";
  daysLabel: string;
  timeline: string;
  timelineMonths: number;
  monthsElapsed: number;
  monthsLeft: number;
  paceLabel: string;
  contributionAmount: number;
  contributionLabel: string;
  productLabel: string;
  amountRemaining: number;
  startedLabel: string;
};

// Derive profile from real transaction data
const profile = deriveProfile();
const dynamicWrappedSlides = computeWrappedSlides();
const lifestyleCategories = getLifestyleCategories();
const dynamicCategoryChips = buildDynamicAffordCategoryChips(
  lifestyleCategories.map((c) => c.name)
);

// Hard-coded insight slides for visual exploration
const INSIGHT_SLIDES: import("@/app/data/flows").WrappedSlide[] = [
  {
    id: "insight-1",
    headline: "January 2026",
    punchline: "6 transactions, 6 merchants",
    stat: { label: "", value: "6", caption: "Your biggest spend was ₹160 at Dilkush." },
  },
  {
    id: "insight-2",
    headline: "0% needs, 100% wants",
    punchline: "You spent ₹493 more than you earned this month.",
    stat: { label: "", value: "-₹493", caption: "Down from last month." },
  },
  {
    id: "insight-3",
    headline: "S S B Enterprises overdue",
    punchline: "S S B Enterprises is 92 days overdue.",
    stat: { label: "", value: "92", caption: "This has been regular for 3 consecutive payments - worth checking." },
  },
  {
    id: "insight-4",
    headline: "Deepak N for 3 months",
    punchline: "You've sent a total of ₹97,500 to DEEPAK N over the last 3 months!",
    stat: { label: "", value: "₹97,500" },
  },
  {
    id: "insight-5",
    headline: "17 subscriptions dropped",
    punchline: "You dropped 17 subscriptions this month, saving around ₹28,376!",
    stat: { label: "", value: "₹28,376" },
  },
];

// Category spending - initialized from real monthly averages (never mutates)
const categorySpending: Record<string, number> = {};
for (const cat of lifestyleCategories.slice(0, 6)) {
  categorySpending[cat.name] = cat.monthlyAverage;
}

// Debug fixtures imported from ./lib/debug-fixtures


// ─── Debug panel: UI helpers ────────────────────────────────────

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <Home />
    </Suspense>
  );
}

function Home() {
  // ============ PERSONA FROM ROUTE (/app/:personaId) =====================
  const params = useParams<{ persona: string }>();
  const personaId = params.persona;
  const personaPreset = personaId ? getPreset(personaId) : undefined;

  // ============ PERSISTENT STATE (single source of truth) ============
  const { state: userState, mutate, replaceState, resetState, resetUser, isHydrated } = useUserState(
    profile,
    personaPreset?.state ?? undefined,
  );

  // Derived from userState - variable names stay backward-compatible
  const step = userState?.currentStep ?? "wrapped";
  const goalStage = userState?.goalStage ?? "choice";
  const budgetStage = userState?.budgetStage ?? "digest";
  const budgetOverrides = userState?.budgetOverrides ?? {};
  const bufferRemaining = userState?.bufferRemaining ?? (parseInt(profile.suggested_budgets.buffer_bucket.replace(/[₹,k]/g, "")) * 1000);
  const spendRatings = userState?.spendRatings ?? [];
  const userId = userState?.userId ?? "";

  // ── Substate control panel ──
  const hasControls = !!(personaPreset?.controls?.length);
  const [activeSubstates, setActiveSubstates] = useState<Record<string, number>>({});

  const handleSubstateChange = useCallback((groupLabel: string, substateIndex: number) => {
    if (!personaPreset) return;
    setActiveSubstates((prev) => {
      const nextMap = { ...prev, [groupLabel]: substateIndex };
      // Rebuild full state: base + all active substate patches
      let merged = { ...personaPreset.state };
      for (const group of personaPreset.controls ?? []) {
        const idx = nextMap[group.label] ?? 0;
        const patch = group.substates[idx]?.patch;
        if (patch) merged = applySubstate(merged, patch);
      }
      replaceState(merged);
      return nextMap;
    });
  }, [personaPreset, replaceState]);

  // Goal-related: local state during onboarding, derived from userState after
  const [localGoalDraft, setLocalGoalDraft] = useState<{ name?: string; timeline?: string; amount?: string }>({});
  const [localPaceId, setLocalPaceId] = useState<"aggressive" | "balanced" | "relaxed">("balanced");
  const [localSavingsForGoal, setLocalSavingsForGoal] = useState(0);

  const goalDraft = useMemo(() => {
    if (userState?.goal) {
      return { name: userState.goal.name, timeline: userState.goal.timeline, amount: userState.goal.amount };
    }
    return localGoalDraft;
  }, [userState?.goal?.name, userState?.goal?.timeline, userState?.goal?.amount, localGoalDraft]);

  const selectedPaceId = userState?.goal?.paceId ?? localPaceId;
  const savingsForGoal = userState?.goal?.savingsAllocated ?? localSavingsForGoal;

  // Goal plan builder: tracks whether the invest-confirm celebration just happened
  const [goalPlanCompleted, setGoalPlanCompleted] = useState(false);

  const goalPlanSteps = useMemo((): PlanStep[] => {
    if (step !== "goal" && !goalPlanCompleted) return [];

    const isTrip = localGoalDraft.name === "Trip" || (localGoalDraft.name?.startsWith("Trip to") ?? false);
    const hasInvestments = profile.investmentSummary.totalInvested > 0;

    const stages: { stageId: string; label: string; value?: string }[] = [
      { stageId: "choice", label: "Saving for", value: goalDraft.name },
    ];
    if (isTrip) {
      const dest = goalDraft.name?.startsWith("Trip to ") ? goalDraft.name.slice(8) : undefined;
      stages.push({ stageId: "destination", label: "Destination", value: dest });
    }
    stages.push({ stageId: "timeline", label: "Timeline", value: goalDraft.timeline });
    stages.push({ stageId: "amount", label: "Target amount", value: goalDraft.amount });
    if (hasInvestments) {
      const savingsVal = goalStage === "plan" || goalStage === "plan-adjust" || goalPlanCompleted
        ? (localSavingsForGoal > 0 ? `₹${(localSavingsForGoal / 1000).toFixed(0)}k counted` : "Starting fresh")
        : undefined;
      stages.push({ stageId: "savings-ask", label: "Existing savings", value: savingsVal });
    }
    const planValue = goalPlanCompleted && userState?.products?.length
      ? (() => {
          const latest = userState.products[userState.products.length - 1];
          const productLabel = latest.type === "rd" ? "RD" : "Auto-save";
          return `₹${(latest.amount / 1000).toFixed(0)}k/mo ${productLabel}`;
        })()
      : undefined;
    stages.push({ stageId: "plan", label: "Monthly plan", value: planValue });

    const stageIds = stages.map((s) => s.stageId);
    const effectiveStage = goalStage === "plan-adjust" ? "plan" : goalStage;
    const rawIdx = stageIds.indexOf(effectiveStage);
    const currentIdx = goalPlanCompleted ? stageIds.length : (rawIdx === -1 ? stageIds.length : rawIdx);

    return stages.map((s, i): PlanStep => ({
      id: s.stageId,
      label: s.label,
      value: s.value,
      status: i < currentIdx ? "completed" : i === currentIdx ? "active" : "pending",
    }));
  }, [step, goalStage, localGoalDraft, goalDraft, goalPlanCompleted, localSavingsForGoal, profile.investmentSummary.totalInvested, userState?.products]);

  const goalPlanVisible = step === "goal" || goalPlanCompleted;

  // Core UI state (transient, not persisted)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "m1", role: "user", text: "How much did I spend last month?" },
    {
      id: "m2", role: "assistant",
      text: "February was a bit heavier than usual - ₹78,400 total, about 12% above your average.",
      card: {
        type: "spend-overview",
        month: "Feb",
        amount: 78400,
        comparisonText: "12% higher than your average",
        chartData: [
          { label: "Sep", value: 58000 },
          { label: "Oct", value: 63200 },
          { label: "Nov", value: 71000 },
          { label: "Dec", value: 89500 },
          { label: "Jan", value: 66800 },
          { label: "Feb", value: 78400 },
        ],
        average: 67200,
        highlightIndex: 5,
      },
    },
    { id: "m3", role: "user", text: "Where did it all go?" },
    {
      id: "m4", role: "assistant",
      text: "Food and shopping led the month. Here's the full breakdown.",
      card: {
        type: "category-breakdown",
        month: "Feb",
        amount: 78400,
        subtext: "across 12 categories",
        categories: [
          { name: "Food & delivery", amount: 22400, pct: 29, color: CATEGORY_COLORS["Food & delivery"], icon: CATEGORY_ICONS["Food & delivery"] },
          { name: "Shopping", amount: 18600, pct: 24, color: CATEGORY_COLORS["Shopping"], icon: CATEGORY_ICONS["Shopping"] },
          { name: "Transport", amount: 11200, pct: 14, color: CATEGORY_COLORS["Transport"], icon: CATEGORY_ICONS["Transport"] },
          { name: "Subscriptions", amount: 8400, pct: 11, color: CATEGORY_COLORS["Subscription"], icon: CATEGORY_ICONS["Subscription"] },
          { name: "Other", amount: 17800, pct: 23, color: CATEGORY_COLORS["Other / uncategorized"], icon: CATEGORY_ICONS["Other / uncategorized"] },
        ],
      },
    },
    { id: "m5", role: "user", text: "How's my Japan trip goal going?" },
    {
      id: "m6", role: "assistant",
      text: "You're ahead of pace - the extra saving in December helped.",
      card: {
        type: "goal-progress",
        name: "Trip to Japan",
        pct: 62,
        saved: 93000,
        target: 150000,
        daysLabel: "11 days ahead",
        status: "ahead",
      },
    },
    { id: "m7", role: "user", text: "Can I park some savings somewhere?" },
    {
      id: "m8", role: "assistant",
      text: "You have ₹18,000 sitting idle. A short FD makes sense here.",
      card: {
        type: "investment-product",
        productType: "Fixed Deposit",
        amount: 15000,
        rate: "7.25% p.a.",
        tenure: "1 year",
        amountOptions: [
          { label: "₹10k", value: 10000 },
          { label: "₹15k", value: 15000 },
          { label: "₹18k", value: 18000 },
        ],
        accountLabel: "Savings xx1234",
      },
    },
  ]);
  const [activeChips, setActiveChips] = useState<ChatChip[]>([]);
  const [homeSubflow, setHomeSubflow] = useState<HomeSubflow>("idle");
  const [subflowData, setSubflowData] = useState<Record<string, string>>({});
  const [roastSeed, setRoastSeed] = useState(0);
  const [insightsMode, setInsightsMode] = useState(false);

  // Data-driven state (transient)
  const [dynamicPacePresets, setDynamicPacePresets] = useState<PacePreset[]>(profile.pace_presets);

  // UI state
  const [receiptsOpen, setReceiptsOpen] = useState(false);
  const [isAgentProcessingGlow, setIsAgentProcessingGlow] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatScreenPhase, setChatScreenPhase] = useState<"closed" | "entering" | "open" | "exiting">("closed");
  const [reviewMessages, setReviewMessages] = useState<ChatMessage[] | null>(null);
  const [goalDetail, setGoalDetail] = useState<GoalDetailSnapshot | null>(null);
  const [showInitialScreen, setShowInitialScreen] = useState(true);
  const [rdDetailVisible, setRdDetailVisible] = useState(false);
  const [goalListOpen, setGoalListOpen] = useState(false);
  const [goalListPhase, setGoalListPhase] = useState<"closed" | "open" | "exiting">("closed");
  const [potDetail, setPotDetail] = useState<{ name: string; saved: number; target: number; pct: number; status: "ahead" | "behind" | "on-track"; daysLabel: string; icon?: string; heroScene?: string } | null>(null);
  const [potDetailPhase, setPotDetailPhase] = useState<"closed" | "open" | "exiting">("closed");
  const [goalDetailPhase, setGoalDetailPhase] = useState<"closed" | "open" | "exiting">("closed");
  const [rdDetailPhase, setRdDetailPhase] = useState<"closed" | "open" | "exiting">("closed");
  const [fdSheetPhase, setFdSheetPhase] = useState<"closed" | "entering" | "open">("closed");
  const [fdSheetData, setFdSheetData] = useState<Extract<ChatCardData, { type: "investment-product" }> | null>(null);
  const [fdSelectedAmount, setFdSelectedAmount] = useState(0);

  // ── Goal questionnaire overlay state ──
  const [goalQuizActive, setGoalQuizActive] = useState(false);
  const [goalQuizIndex, setGoalQuizIndex] = useState(0);
  const [goalQuizAnswers, setGoalQuizAnswers] = useState<Record<string, string>>({});

  // ── Obligation detail sheet state ──
  const [obligSheetPhase, setObligSheetPhase] = useState<"closed" | "entering" | "open">("closed");
  const [obligSheetItem, setObligSheetItem] = useState<{ id: string; payee: string; amount: number; type: string; seenMonths: string; lastPaid: string } | null>(null);
  const [obligEditAmount, setObligEditAmount] = useState(0);
  // Track which suggested items are selected + edited amounts for obligations card
  const [obligSelectedIds, setObligSelectedIds] = useState<Set<string>>(new Set());
  const [obligEditedAmounts, setObligEditedAmounts] = useState<Record<string, number>>({});
  const [obligSubmitted, setObligSubmitted] = useState(false);

  // ── Chat sheet drag state ──────────────────────────────────────────────
  const SNAP_THRESHOLD = 60;
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameHeight, setFrameHeight] = useState(760); // sensible default before measurement

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFrameHeight(el.clientHeight));
    ro.observe(el);
    setFrameHeight(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  // Snap points derived from frame height
  const PILL_HEIGHT = 72;   // floating bar height when minimized
  const PILL_MARGIN = 16;   // left / right / bottom margin in minimized state
  const SHEET_MAX_OFFSET = Math.round(frameHeight * 0.10);  // 90% height visible (default)
  const SHEET_MIN_OFFSET = frameHeight - PILL_HEIGHT - PILL_MARGIN; // floating pill at bottom

  const [sheetOffset, setSheetOffset] = useState(SHEET_MAX_OFFSET);

  // Reset to default position whenever frame height is (re)measured
  const prevFrameHeightRef = useRef(0);
  useEffect(() => {
    if (frameHeight !== prevFrameHeightRef.current) {
      prevFrameHeightRef.current = frameHeight;
      setSheetOffset(SHEET_MIN_OFFSET);
    }
  }, [frameHeight, SHEET_MIN_OFFSET]);

  const chatTransitionTimerRef = useRef<number | null>(null);
  const chatTransitionFrameRef = useRef<number | null>(null);

  const clearChatTransitionTimers = useCallback(() => {
    if (chatTransitionTimerRef.current !== null) {
      window.clearTimeout(chatTransitionTimerRef.current);
      chatTransitionTimerRef.current = null;
    }
    if (chatTransitionFrameRef.current !== null) {
      window.cancelAnimationFrame(chatTransitionFrameRef.current);
      chatTransitionFrameRef.current = null;
    }
  }, []);

  const showChatOverlay = useCallback((showLauncher: boolean) => {
    clearChatTransitionTimers();
    setReviewMessages(null);
    setGoalDetail(null);
    setShowInitialScreen(showLauncher);
    setSheetOffset(SHEET_MAX_OFFSET);
    setChatVisible(true);
    setChatScreenPhase("entering");
    chatTransitionFrameRef.current = window.requestAnimationFrame(() => {
      chatTransitionFrameRef.current = window.requestAnimationFrame(() => {
        setChatScreenPhase("open");
        chatTransitionFrameRef.current = null;
      });
    });
  }, [SHEET_MAX_OFFSET, clearChatTransitionTimers]);

  const openChatOverlay = useCallback(() => {
    showChatOverlay(true);
  }, [showChatOverlay]);

  const closeChatOverlay = useCallback(() => {
    clearChatTransitionTimers();
    setReviewMessages(null);
    setGoalDetail(null);
    setChatScreenPhase("exiting");
    chatTransitionTimerRef.current = window.setTimeout(() => {
      setChatVisible(false);
      setChatScreenPhase("closed");
      chatTransitionTimerRef.current = null;
    }, 460);
  }, [clearChatTransitionTimers]);

  useEffect(() => {
    return () => {
      clearChatTransitionTimers();
    };
  }, [clearChatTransitionTimers]);

  // AI Chat state
  const [aiMessages, setAiMessages] = useState<AIChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Swipe interface state (transient)
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [swipeQueue, setSwipeQueue] = useState<typeof profile.receipts>([]);

  const launchResetDoneRef = useRef(false);

  // Message management - use a ref counter to guarantee unique IDs
  const msgIdRef = { current: 0 };

  const addMessage = useCallback(
    (role: "assistant" | "user", text: string, special?: ChatMessage["special"], card?: ChatCardData) => {
      const id = `msg-${Date.now()}-${++msgIdRef.current}`;
      setMessages((prev) => [...prev, { id, role, text, special, card }]);
    },
    [],
  );

  // ── Message queue: assistant messages appear staggered, not all at once ──
  type QueuedMsg = { role: "assistant" | "user"; text: string; special?: ChatMessage["special"]; card?: ChatCardData };
  const msgQueueRef = useRef<QueuedMsg[]>([]);
  const msgQueueDrainingRef = useRef(false);
  const msgQueueTimerRef = useRef<number | null>(null);
  const goalOnboardingTimerRef = useRef<number | null>(null);

  const drainMsgQueue = useCallback(() => {
    if (msgQueueRef.current.length === 0) {
      msgQueueDrainingRef.current = false;
      return;
    }
    const next = msgQueueRef.current.shift()!;
    addMessage(next.role, next.text, next.special, next.card);
    // Continue draining remaining items immediately - Chat's reveal choreography handles pacing
    if (msgQueueRef.current.length > 0) {
      msgQueueTimerRef.current = window.setTimeout(drainMsgQueue, 0);
    } else {
      msgQueueDrainingRef.current = false;
    }
  }, [addMessage]);

  const queueMessage = useCallback(
    (role: "assistant" | "user", text: string, special?: ChatMessage["special"], card?: ChatCardData) => {
      msgQueueRef.current.push({ role, text, special, card });
      if (!msgQueueDrainingRef.current) {
        msgQueueDrainingRef.current = true;
        drainMsgQueue();
      }
    },
    [drainMsgQueue],
  );

  // Clear queue on full reset
  const clearMsgQueue = useCallback(() => {
    msgQueueRef.current = [];
    msgQueueDrainingRef.current = false;
    if (msgQueueTimerRef.current !== null) {
      window.clearTimeout(msgQueueTimerRef.current);
      msgQueueTimerRef.current = null;
    }
    if (goalOnboardingTimerRef.current !== null) {
      window.clearTimeout(goalOnboardingTimerRef.current);
      goalOnboardingTimerRef.current = null;
    }
  }, []);

  const toChips = (options: ChipOption[]): ChatChip[] =>
    options.map((o) => ({ id: o.id, label: o.label }));

  // ============ AI CHAT HANDLER ============
  const handleChatSubmit = async (text: string) => {
    if (isStreaming) return;

    // Add user message to UI
    addMessage("user", text);

    // Build AI message history
    const newAiMessages: AIChatMessage[] = [
      ...aiMessages,
      { role: "user" as const, content: text },
    ];
    setAiMessages(newAiMessages);
    setIsStreaming(true);
    setActiveChips([]);

    try {
      abortRef.current = new AbortController();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newAiMessages,
          userId,
          context: {
            currentGoal: goalDraft.name
              ? `${goalDraft.name} - ${goalDraft.amount || "amount TBD"} in ${goalDraft.timeline || "timeline TBD"}`
              : undefined,
            currentPace: selectedPaceId,
            currentBudgetStyle: userState?.budgetStyle || undefined,
            recentFlow: homeSubflow !== "idle" ? homeSubflow : undefined,
          },
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      // Create a placeholder message and stream tokens into it
      const streamMsgId = `msg-${Date.now()}-${++msgIdRef.current}`;
      setMessages((prev) => [...prev, { id: streamMsgId, role: "assistant", text: "", streaming: true }]);

      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullResponse += chunk;
        const captured = fullResponse;
        setMessages((prev) =>
          prev.map((m) => (m.id === streamMsgId ? { ...m, text: captured } : m))
        );
      }

      // Mark streaming complete
      if (fullResponse.trim()) {
        setMessages((prev) =>
          prev.map((m) => (m.id === streamMsgId ? { ...m, text: fullResponse, streaming: false } : m))
        );
        setAiMessages((prev) => [
          ...prev,
          { role: "assistant" as const, content: fullResponse },
        ]);
        // Store conversation in Mem0 (fire-and-forget)
        if (userId) {
          fetch("/api/memory/conversation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, userMessage: text, assistantMessage: fullResponse }),
          }).catch(() => {});
        }
      } else {
        // Remove empty placeholder, show error
        setMessages((prev) => prev.filter((m) => m.id !== streamMsgId));
        addMessage(
          "assistant",
          "I'm having trouble connecting right now. Make sure API keys are configured in .env.local."
        );
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("Chat error:", error);
      addMessage(
        "assistant",
        "Something went wrong. Try again."
      );
    } finally {
      setIsStreaming(false);
        setActiveChips(toChips(steadyStateChips));
    }
  };

  // ============ MEMORY STORAGE HELPER ============
  const storeMemoryDecision = (type: string, value: string) => {
    if (!userId) return;
    fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, type, value }),
    }).catch(() => {
      // Non-critical - silently fail
    });
  };

  // ============ FLOW ASSIST HELPER ============
  const callFlowAssist = async (
    mode: "reason" | "copy",
    flowStage: string,
    dataContext: string,
    userText?: string
  ): Promise<FlowAssistResponse | null> => {
    setIsStreaming(true);
    try {
      const res = await fetch("/api/flow-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, mode, flowStage, dataContext, userText }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    } finally {
      setIsStreaming(false);
    }
  };

  const applyFlowActions = (actions: FlowAction[]) => {
    for (const action of actions) {
      switch (action.type) {
        case "set_budget":
          mutate({ budgetOverrides: { [action.category]: action.amount } });
          break;
        case "set_pace":
          setLocalPaceId(action.paceId);
          if (userState?.goal) {
            mutate({ goal: { ...userState.goal, paceId: action.paceId } });
          }
          break;
        case "set_timeline":
          setLocalGoalDraft((prev) => ({ ...prev, timeline: `${action.months} months` }));
          if (userState?.goal) {
            mutate({ goal: { ...userState.goal, timeline: `${action.months} months`, timelineMonths: action.months } });
          }
          break;
        case "store_preference":
          mutate({
            preferences: [...(userState?.preferences || []), {
              key: action.key,
              type: action.preferenceType,
              value: action.value,
              source: "flow-assist",
              createdAt: new Date().toISOString(),
            }]
          });
          storeMemoryDecision("preference", `${action.preferenceType}: ${action.value}`);
          break;
      }
    }
  };

  const buildBudgetContext = () => {
    const preset = lookupPace(selectedPaceId);
    return `CURRENT STATE:
Goal: ${goalDraft.name || profile.goal.goal_name}, ${goalDraft.amount || profile.goal.goal_amount}, ${goalDraft.timeline || profile.goal.horizon}
Pace: ${preset.label} (${preset.required_monthly_cut}/month cuts needed)
Savings allocated: ${formatINR(savingsForGoal)}
Remaining: ${formatINR(parseINR(goalDraft.amount || profile.goal.goal_amount) - savingsForGoal)}

CURRENT BUDGETS:
${profile.suggested_budgets.categories.map((c) => {
  const override = budgetOverrides[c.name];
  const actual = lifestyleCategories.find((l) => l.name === c.name);
  return `${c.name}: ${override !== undefined ? formatINR(override) : c.budget} (avg actual: ${formatINR(actual?.monthlyAverage || 0)})`;
}).join("\n")}

PACE OPTIONS:
${dynamicPacePresets.map((p) => `${p.label} (${p.id}): ${p.required_monthly_cut}/month over ${p.pace_window}`).join("\n")}`;
  };

  const buildProgressContext = () => {
    const goalName = goalDraft.name || profile.goal.goal_name;
    const goalAmount = goalDraft.amount || profile.goal.goal_amount;
    const goalAmountNum = parseINR(goalAmount);
    const timeline = goalDraft.timeline || profile.goal.horizon;
    const preset = lookupPace(selectedPaceId);
    const progressAmount = savingsForGoal;
    const progressPct = goalAmountNum > 0 ? Math.round((progressAmount / goalAmountNum) * 100) : 0;
    const monthlyCut = parseINR(preset.required_monthly_cut);
    const expectedSavings = monthlyCut * Math.min(profile.dataRange.months, 3);
    const daysNum = monthlyCut > 0 ? Math.round(((progressAmount - expectedSavings) / monthlyCut) * 30) : 0;

    return `GOAL PROGRESS:
Goal: ${goalName} - ${goalAmount}
Progress: ${formatINR(progressAmount)} / ${goalAmount} (${progressPct}%)
Timeline: ${timeline}
Pace: ${preset.label} (${preset.required_monthly_cut}/month)
Status: ${daysNum > 0 ? `${daysNum} days AHEAD` : daysNum < 0 ? `${Math.abs(daysNum)} days BEHIND` : "ON TRACK"}
Current savings rate: ${profile.persona.actual_savings_pct} (required: ${profile.goal.required_savings_pct})

BUDGET VS ACTUAL (monthly):
${profile.suggested_budgets.categories.slice(0, 5).map((cat) => {
  const actual = lifestyleCategories.find((c) => c.name === cat.name);
  const effectiveBudget = getEffectiveBudget(cat.name, budgetOverrides, profile);
  const actualMonthly = actual?.monthlyAverage || 0;
  const diff = actualMonthly - effectiveBudget;
  return `${cat.name}: actual ${formatINR(actualMonthly)} vs budget ${formatINR(effectiveBudget)} (${diff > 0 ? `+${formatINR(diff)} over` : "on track"})`;
}).join("\n")}`;
  };

  const buildPatternsContext = () => {
    const totalInvested = profile.investmentSummary.totalInvested;
    const months = profile.dataRange.months;
    const investRate = profile.persona.actual_savings_pct;
    const monthEntries = Object.entries(profile.monthlyBreakdown);
    const creditAmounts = monthEntries.map(([, m]) => m.totalCredits);
    const avgCredit = creditAmounts.reduce((s, a) => s + a, 0) / creditAmounts.length;
    const creditVariance = creditAmounts.reduce((s, a) => s + (a - avgCredit) ** 2, 0) / creditAmounts.length;
    const creditCV = avgCredit > 0 ? Math.round(Math.sqrt(creditVariance) / avgCredit * 100) : 0;
    const cashCat = lifestyleCategories.find((c) => c.name.includes("Cash Withdrawal"));
    const topCat = lifestyleCategories[0];

    return `SPENDING PATTERNS DATA:
Investment: ${formatINR(totalInvested)} over ${months} months (${investRate} of income)
Platforms: ${Object.keys(profile.investmentSummary.breakdown).join(", ")}
Income variability: ${creditCV}% coefficient of variation
Top category: ${topCat?.name || "unknown"} at ${topCat?.shareOfLifestyle || "?"} of lifestyle (${formatINR(topCat?.monthlyAverage || 0)}/month)
${cashCat ? `Cash withdrawals: ${formatINR(cashCat.monthlyAverage)}/month from ATMs` : "No significant cash withdrawals"}

TOP 5 CATEGORIES (monthly avg):
${lifestyleCategories.slice(0, 5).map((c) => `${c.name}: ${formatINR(c.monthlyAverage)} (${c.shareOfLifestyle})`).join("\n")}`;
  };

  const buildPersonalityContext = () => {
    const savingsRate = parseInt(profile.persona.actual_savings_pct.replace(/[~%]/g, "")) || 0;
    const totalInvested = profile.investmentSummary.totalInvested;
    const investPlatforms = Object.keys(profile.investmentSummary.breakdown);
    const topCat = lifestyleCategories[0];
    const cashCat = lifestyleCategories.find((c) => c.name.includes("Cash"));

    return `PERSONALITY DERIVATION DATA:
Savings rate: ${savingsRate}%
Total invested: ${formatINR(totalInvested)}
Investment platforms (${investPlatforms.length}): ${investPlatforms.join(", ")}
Top lifestyle spend: ${topCat?.name || "unknown"} - ${topCat?.shareOfLifestyle || "?"} share, ${formatINR(topCat?.monthlyAverage || 0)}/month
Cash usage: ${cashCat ? `${formatINR(cashCat.monthlyAverage)}/month (${cashCat.shareOfLifestyle})` : "minimal"}
Transactions: ${profile.dataRange.totalTransactions} in ${profile.dataRange.months} months
Current label: ${profile.wrapped.money_personality_label}

Derive a money personality type and describe it conversationally. Include traits, strengths, growth areas, and strategies.`;
  };

  const buildBenchmarksContext = () => {
    const savingsRate = parseInt(profile.persona.actual_savings_pct.replace(/[~%]/g, "")) || 0;
    const topCat = lifestyleCategories[0];
    const topCatShare = parseInt(topCat?.shareOfLifestyle?.replace("%", "") || "0");
    const totalDebits = Object.values(profile.monthlyBreakdown).reduce((s, m) => s + m.totalDebits, 0);
    const lifestyleTotal = lifestyleCategories.reduce((s, c) => s + c.totalAmount, 0);
    const lifestylePct = totalDebits > 0 ? Math.round((lifestyleTotal / totalDebits) * 100) : 0;

    return `BENCHMARK DATA:
User savings rate: ${savingsRate}% (avg Indian: 10-15%, ideal: 20%)
Top category: ${topCat?.name || "unknown"} at ${topCatShare}% of lifestyle (typical: 20-30%)
Lifestyle vs income: ${lifestylePct}% (typical: 40-60%)
Balance: ₹${profile.accountBalance.toLocaleString("en-IN")}

Compare the user's financial metrics to common benchmarks. Be conversational, not a report.`;
  };

  const buildLeakContext = () => {
    const leaks = computeLeakInsights();
    if (leaks.length === 0) return "No significant spending leaks detected. Spending is fairly stable.";

    const topLeak = leaks[0];
    const monthlyCut = parseINR(lookupPace(selectedPaceId).required_monthly_cut);
    const daysImpact = monthlyCut > 0 ? Math.round((topLeak.suggestedCut / monthlyCut) * 30) : 0;

    return `LEAK DATA:
Category: ${topLeak.category}
Monthly average: ${formatINR(topLeak.monthlyAvg)}
Peak: ${formatINR(topLeak.peakAmount)} (${topLeak.peakMonth})
Trough: ${formatINR(topLeak.troughAmount)} (${topLeak.troughMonth})
Suggested cut: ${formatINR(topLeak.suggestedCut)}
Goal impact: ~${daysImpact} days
Volatility ratio: ${(topLeak.peakAmount / Math.max(topLeak.troughAmount, 1)).toFixed(1)}x

${leaks.length > 1 ? `Other volatile categories: ${leaks.slice(1).map((l) => `${l.category} (avg ${formatINR(l.monthlyAvg)})`).join(", ")}` : ""}

Describe this spending leak conversationally. Make it feel like a discovery, not a scolding.`;
  };

  const buildAffordContext = (amount: number, category: string) => {
    const fullPicture = getAffordFullPicture(amount, category);
    const goalName = goalDraft.name || profile.goal.goal_name;
    const preset = lookupPace(selectedPaceId);
    const impact = calculateGoalImpact(amount);
    const pattern = detectSpendingPattern(category, amount);

    return `AFFORDABILITY ANALYSIS REQUEST:
Spend: ${formatINR(amount)} on ${category}
Goal: ${goalName} (${goalDraft.amount || profile.goal.goal_amount} in ${goalDraft.timeline || profile.goal.horizon})
Pace: ${preset.label} (${preset.required_monthly_cut}/month cuts)

BUDGET STATUS:
${fullPicture.is_other ? `This is an uncategorized spend - comes from flex buffer.` : `Category budget: ${fullPicture.category_budget}\nSpent so far: ${fullPicture.spent_so_far}\nBudget remaining: ${fullPicture.budget_remaining}`}
${fullPicture.budget_excess ? `Over budget by: ${fullPicture.budget_excess}` : "Within budget"}

BUFFER:
Before: ${fullPicture.buffer_before}
After: ${fullPicture.buffer_after}
${fullPicture.buffer_impact ? `Buffer impact: ${fullPicture.buffer_impact}` : "No buffer impact"}

GOAL IMPACT:
${impact.days_impact} days impact → ${impact.message}

${fullPicture.upcoming_bills ? `UPCOMING BILLS: ${fullPicture.upcoming_bills}` : ""}
${pattern.detected ? `PATTERN: ${pattern.message}` : ""}

VERDICT: ${fullPicture.status.toUpperCase()}

Give a clear yes/no/maybe verdict with reasoning. Be specific about numbers. Mention goal impact if significant. If there's a spending pattern, call it out. End with a brief recommendation.`;
  };

  const buildProgressActionContext = (actionType: string) => {
    const goalName = goalDraft.name || profile.goal.goal_name;
    const goalAmount = goalDraft.amount || profile.goal.goal_amount;
    const timeline = goalDraft.timeline || profile.goal.horizon;
    const preset = lookupPace(selectedPaceId);
    const monthlyCut = parseINR(preset.required_monthly_cut);
    const progressAmount = savingsForGoal;
    const expectedSavings = monthlyCut * Math.min(profile.dataRange.months, 3);
    const daysNum = monthlyCut > 0 ? Math.round(((progressAmount - expectedSavings) / monthlyCut) * 30) : 0;

    let actionContext = `PROGRESS ACTION: ${actionType}
Goal: ${goalName} - ${goalAmount} in ${timeline}
Pace: ${preset.label} (${preset.required_monthly_cut}/month)
Status: ${daysNum > 0 ? `${daysNum} days ahead` : daysNum < 0 ? `${Math.abs(daysNum)} days behind` : "on track"}
Savings rate: ${profile.persona.actual_savings_pct} (required: ${profile.goal.required_savings_pct})
Savings so far: ${formatINR(progressAmount)}

BUDGET VS ACTUAL (monthly):
${profile.suggested_budgets.categories.slice(0, 5).map((cat) => {
  const actual = lifestyleCategories.find((c) => c.name === cat.name);
  const effectiveBudget = getEffectiveBudget(cat.name, budgetOverrides, profile);
  const actualMonthly = actual?.monthlyAverage || 0;
  const diff = actualMonthly - effectiveBudget;
  return `${cat.name}: actual ${formatINR(actualMonthly)} vs budget ${formatINR(effectiveBudget)} (${diff > 0 ? `+${formatINR(diff)} over` : "ok"})`;
}).join("\n")}

PACE OPTIONS:
${dynamicPacePresets.map((p) => `${p.label} (${p.id}): ${p.required_monthly_cut}/month over ${p.pace_window}`).join("\n")}
`;

    if (actionType === "see-what-happened") {
      actionContext += `\nAnalyze WHY the user fell behind. Look at which categories went over budget, whether it was a one-time spike or pattern, and what's the most impactful fix. Be specific with numbers.`;
    } else if (actionType === "relax-pace") {
      actionContext += `\nUser is AHEAD and wants to relax. Suggest specific categories where they can add back spending, with exact amounts. Explain how much slack they have without derailing the goal.`;
    } else if (actionType === "finish-faster") {
      actionContext += `\nUser is AHEAD and wants to finish faster. Calculate how many weeks/months they could shave off. Or suggest increasing the target amount. Give 2-3 concrete options with numbers.`;
    } else if (actionType === "catch-up") {
      actionContext += `\nUser is BEHIND and wants to catch up. Suggest realistic ways to increase monthly savings. Look at which budget categories have the most room. Give specific, actionable cuts with amounts.`;
    }

    return actionContext;
  };

  const buildSwipeAnalysisContext = (ratings: { category: string; amount: string; rating: string; time_of_day: string }[]) => {
    const regrets = ratings.filter((r) => r.rating === "regret");
    const worths = ratings.filter((r) => r.rating === "worth");
    const mehs = ratings.filter((r) => r.rating === "meh");

    const categoryBreakdown: Record<string, { worth: number; regret: number; meh: number; totalAmount: number }> = {};
    for (const r of ratings) {
      if (!categoryBreakdown[r.category]) {
        categoryBreakdown[r.category] = { worth: 0, regret: 0, meh: 0, totalAmount: 0 };
      }
      categoryBreakdown[r.category][r.rating as "worth" | "regret" | "meh"]++;
      categoryBreakdown[r.category].totalAmount += parseInt(r.amount.replace(/[₹,]/g, "")) || 0;
    }

    const lateNight = ratings.filter((r) => r.time_of_day === "late_night");
    const lateNightRegrets = lateNight.filter((r) => r.rating === "regret");

    return `SPEND RATING ANALYSIS:
Total rated: ${ratings.length}
Worth it: ${worths.length} | Regret: ${regrets.length} | Meh: ${mehs.length}

BY CATEGORY:
${Object.entries(categoryBreakdown).map(([cat, data]) => `${cat}: ${data.worth}W/${data.regret}R/${data.meh}M (total ${formatINR(data.totalAmount)})`).join("\n")}

TIMING PATTERNS:
Late night (10pm+): ${lateNight.length} spends, ${lateNightRegrets.length} regrets
${lateNight.length > 0 ? `Late night regret rate: ${Math.round((lateNightRegrets.length / lateNight.length) * 100)}%` : ""}

REGRET DETAILS:
${regrets.map((r) => `${r.category} ${r.amount} (${r.time_of_day})`).join(", ") || "None"}

Analyze these spending patterns conversationally. Look for:
- Categories with high regret rates → suggest cutting
- Categories with high joy rates → suggest protecting
- Time-of-day patterns (late night regrets)
- Non-obvious correlations
Be insightful, not just descriptive.`;
  };

  const parseTimelineToMonths = (timeline: string): number => {
    if (timeline.includes("year") || timeline === "1y") return 12;
    const match = timeline.match(/(\d+)/);
    return match ? parseInt(match[1]) : 6;
  };

  const getDefaultPaceId = (timeline?: string) => {
    if (!timeline) return "balanced";
    if (timeline === "3 months") return "aggressive";
    if (timeline === "6 months") return "balanced";
    if (timeline === "12 months" || timeline === "1 year") return "relaxed";
    return "balanced";
  };

  const lookupPace = (paceId: "aggressive" | "balanced" | "relaxed") => {
    return dynamicPacePresets.find((p) => p.id === paceId) ?? dynamicPacePresets[0];
  };

  const getBucketOptionChips = (): ChatChip[] => {
    return profile.tradeoff_rules.bucket_options.map((option) => ({
      id: option.id,
      label: option.label,
    }));
  };

  const getTradeoffPrompt = (optionId: string): string => {
    const option =
      profile.tradeoff_rules.bucket_options.find((item) => item.id === optionId) ??
      profile.tradeoff_rules.bucket_options[0];
    const goalName = goalDraft.name || profile.goal.goal_name;
    return (
      `A ${option.monthly_cost} bucket means:\n` +
      `• ${option.extend_timeline} for ${goalName}\n\n` +
      `If you don't want to extend the timeline, we can:\n` +
      `• ${option.reduce_elsewhere}\n\n` +
      `Which should we do?`
    );
  };

  // Helper: Calculate goal impact for expenses
  const calculateGoalImpact = (amount: number) => {
    const preset = lookupPace(selectedPaceId);
    const requiredMonthlyCut = parseINR(preset.required_monthly_cut);
    const daysImpact = Math.round((amount / requiredMonthlyCut) * 30);
    const currentDays = parseInt(profile.goal.days_ahead_behind.replace(/[~\s]/g, "").split(" ")[0]) || 0;
    const newStatus = currentDays - daysImpact;

    return {
      days_impact: daysImpact,
      new_status: newStatus,
      message: `${daysImpact} days ${newStatus < 0 ? 'behind' : 'ahead'}`,
    };
  };

  // Helper: Detect spending pattern (e.g., 3rd similar expense)
  const detectSpendingPattern = (category: string, amount: number) => {
    const recentSimilar = profile.receipts.filter(
      (r) =>
        r.category === category &&
        parseInt(r.amount.replace(/[₹,]/g, "")) >= amount * 0.8
    ).length;

    if (recentSimilar >= 2) {
      return {
        detected: true,
        count: recentSimilar + 1,
        message: `This is your ${recentSimilar + 1}${recentSimilar === 1 ? 'nd' : 'rd'} ${category} expense recently. Pattern emerging?`,
      };
    }
    return { detected: false, count: 0, message: "" };
  };

  // Helper: Get full picture for Can I Afford
  const getAffordFullPicture = (amount: number, category: string) => {
    const upcomingBills = profile.action.bill_risk_event;

    const formatAmount = (amt: number) => {
      const k = amt / 1000;
      return k % 1 === 0 ? `₹${k}k` : `₹${k.toFixed(1)}k`;
    };

    // Special handling for "Other" category - comes directly from buffer
    if (category === "Other") {
      const newBuffer = bufferRemaining - amount;
      let status: "safe" | "tight" | "risky";

      if (amount <= bufferRemaining * 0.5) {
        status = "safe";
      } else if (amount <= bufferRemaining) {
        status = "tight";
      } else {
        status = "risky";
      }

      return {
        status,
        is_other: true,
        spent_so_far: formatAmount(0),
        category_budget: null,
        budget_remaining: null,
        total_after_spend: formatAmount(amount),
        budget_excess: null,
        buffer_before: formatAmount(bufferRemaining),
        buffer_after: formatAmount(newBuffer),
        buffer_impact: formatAmount(amount),
        upcoming_bills: upcomingBills,
      };
    }

    // Get category budget and spending
    const categoryBudget = profile.suggested_budgets.categories.find(
      (cat) => cat.name === category
    );
    const budgetAmount = categoryBudget
      ? parseInt(categoryBudget.budget.replace(/[₹,k]/g, "")) * 1000
      : 0;

    const spentSoFar = categorySpending[category] || 0;
    const totalAfterSpend = spentSoFar + amount;
    const budgetExcess = totalAfterSpend - budgetAmount;
    const budgetRemaining = budgetAmount - spentSoFar;

    // Calculate buffer impact
    const bufferImpact = budgetExcess > 0 ? budgetExcess : 0;
    const newBuffer = bufferRemaining - bufferImpact;

    // Determine status based on budget and buffer impact
    let status: "safe" | "tight" | "risky";

    if (amount <= budgetRemaining && bufferImpact === 0) {
      // Within category budget, no buffer impact
      status = "safe";
    } else if (budgetExcess > 0 && newBuffer > bufferRemaining * 0.3) {
      // Exceeds budget but buffer remains healthy (>30%)
      status = "tight";
    } else {
      // Exhausts most/all buffer or goes negative
      status = "risky";
    }

    return {
      status,
      is_other: false,
      spent_so_far: formatAmount(spentSoFar),
      category_budget: formatAmount(budgetAmount),
      budget_remaining: formatAmount(budgetRemaining),
      total_after_spend: formatAmount(totalAfterSpend),
      budget_excess: budgetExcess > 0 ? formatAmount(budgetExcess) : null,
      buffer_before: formatAmount(bufferRemaining),
      buffer_after: formatAmount(newBuffer),
      buffer_impact: bufferImpact > 0 ? formatAmount(bufferImpact) : null,
      upcoming_bills: upcomingBills,
    };
  };


  const startBucketTradeoff = (ruleId?: string) => {
    if (ruleId) {
      setSubflowData((prev) => ({ ...prev, tradeoffRule: ruleId, tradeoffStep: "decision" }));
      setHomeSubflow("tradeoff");
      queueMessage("assistant", getTradeoffPrompt(ruleId));
      setActiveChips(toChips(tradeoffChoiceChips));
      return;
    }
    setSubflowData((prev) => ({ ...prev, tradeoffStep: "bucket-select" }));
    setHomeSubflow("tradeoff");
    queueMessage("assistant", "Pick a buffer bucket size:");
    setActiveChips(getBucketOptionChips());
  };

  // ============ WRAPPED / INSIGHTS ============
  const openWrappedStories = useCallback(() => {
    setChatVisible(false);
    setChatScreenPhase("closed");
    setReviewMessages(null);
    setGoalDetail(null);
    setRdDetailVisible(false);
    setMessages([]);
    setActiveChips([]);
    setInsightsMode(false);
    mutate({ currentStep: "home" });
  }, [mutate]);

  const openInsights = useCallback(() => {
    setChatVisible(false);
    setChatScreenPhase("closed");
    setReviewMessages(null);
    setGoalDetail(null);
    setRdDetailVisible(false);
    setMessages([]);
    setActiveChips([]);
    setInsightsMode(true);
    mutate({ currentStep: "home" });
  }, [mutate]);

  // ============ GOAL REVIEW ============
  const getGoalContributionSummary = useCallback(() => {
    const product = userState?.products?.find((p) => p.active);
    if (!product) {
      return {
        productLabel: "Manual savings",
        contributionAmount: 0,
        contributionLabel: "No active automation yet",
      };
    }

    const productLabel = product.type === "rd"
      ? "Recurring Deposit"
      : product.type === "autosave"
        ? "Auto-save"
        : "Fixed Deposit";

    if (product.type === "autosave") {
      return {
        productLabel,
        contributionAmount: product.amount * 30,
        contributionLabel: `${formatINR(product.amount)}/day running`,
      };
    }

    if (product.type === "rd") {
      return {
        productLabel,
        contributionAmount: product.amount,
        contributionLabel: `${formatINR(product.amount)}/month running`,
      };
    }

    return {
      productLabel,
      contributionAmount: product.amount,
      contributionLabel: `${formatINR(product.amount)} parked`,
    };
  }, [userState?.products]);

  const getGoalReviewPayload = useCallback(() => {
    const goal = userState?.goal;
    if (!goal) return null;

    const monthsElapsed = Math.max(1, Math.round((Date.now() - new Date(goal.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)));
    const { contributionAmount } = getGoalContributionSummary();
    const monthlySaved = contributionAmount;
    const totalSaved = goal.savingsAllocated + (monthlySaved * monthsElapsed);
    const pct = goal.amountNum > 0 ? Math.min(100, Math.round((totalSaved / goal.amountNum) * 100)) : 0;
    const monthsLeft = Math.max(0, goal.timelineMonths - monthsElapsed);

    const status: "ahead" | "behind" | "on-track" =
      pct >= ((monthsElapsed / goal.timelineMonths) * 100) + 5 ? "ahead"
      : pct <= ((monthsElapsed / goal.timelineMonths) * 100) - 5 ? "behind"
      : "on-track";

    const daysLabel = status === "ahead" ? "Ahead of schedule"
      : status === "behind" ? "Behind schedule"
      : "On track";

    const goalNameForCopy = goal.name
      ? `${goal.name.charAt(0).toLowerCase()}${goal.name.slice(1)}`
      : goal.name;
    const monthsWord = monthsLeft === 1 ? "month" : "months";
    const message = status === "on-track"
      ? `Everything looks good. You're on track with ${monthsLeft} ${monthsWord} to go.`
      : status === "ahead"
      ? `You're ahead of schedule for ${goalNameForCopy}. ${monthsLeft} ${monthsWord} left and looking strong.`
      : `You're a bit behind on ${goalNameForCopy}. ${monthsLeft} ${monthsWord} left - might be worth adjusting.`;

    return {
      message,
      card: {
        type: "goal-progress" as const,
        name: goal.name,
        pct,
        saved: totalSaved,
        target: goal.amountNum,
        daysLabel: `${daysLabel} · ${monthsLeft} months left`,
        status,
      },
    };
  }, [userState?.goal, getGoalContributionSummary]);

  // ── Derive GoalTracker data from live userState ──
  const goalTrackerGoals: GoalIndicatorData[] = useMemo(() => {
    const goal = userState?.goal;
    if (!goal) return [];

    const monthsElapsed = Math.max(1, Math.round((Date.now() - new Date(goal.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)));
    const { contributionAmount } = getGoalContributionSummary();
    const totalSaved = goal.savingsAllocated + (contributionAmount * monthsElapsed);
    const pct = goal.amountNum > 0 ? Math.min(100, Math.round((totalSaved / goal.amountNum) * 100)) : 0;
    const monthsLeft = Math.max(0, goal.timelineMonths - monthsElapsed);

    const status: "ahead" | "behind" | "on-track" =
      pct >= 100 ? "ahead"
      : pct >= ((monthsElapsed / goal.timelineMonths) * 100) + 5 ? "ahead"
      : pct <= ((monthsElapsed / goal.timelineMonths) * 100) - 5 ? "behind"
      : "on-track";

    const daysLabel = pct >= 100 ? "Completed"
      : status === "ahead" ? "Ahead of schedule"
      : status === "behind" ? "Behind schedule"
      : `${monthsLeft} months left`;

    const primary: GoalIndicatorData = {
      id: "1",
      name: goal.name ?? "Goal",
      pct,
      status,
      icon: "✈️",
      daysLabel,
      saved: totalSaved,
      target: goal.amountNum,
      ringColor: VALENTINO_500,
      endDate: goal.timeline,
      monthlyAmount: contributionAmount,
      gradient: "linear-gradient(135deg, #fae2fa 0%, #d30ad7 100%)",
      heroEmoji: "✈️",
      heroScene: "japan",
    };

    // If multiple goals active, add fixture secondary goals
    const isMultipleGoals = (userState?.products?.length ?? 0) >= 3;
    if (isMultipleGoals) {
      return [
        primary,
        { id: "2", name: "Emergency Fund", pct: 35, status: "on-track" as const, icon: "🛡️", daysLabel: "On track", saved: 175000, target: 500000, ringColor: "#ff9a17", endDate: "Mar '27", monthlyAmount: 15000, gradient: "linear-gradient(135deg, #fff3e3 0%, #ff9a17 100%)", heroEmoji: "🛡️" },
        { id: "3", name: "New Laptop", pct: 65, status: "on-track" as const, icon: "💻", daysLabel: "On track", saved: 48750, target: 75000, ringColor: "#00a63e", endDate: "Sep '26", monthlyAmount: 5000, gradient: "linear-gradient(135deg, #e0f4e8 0%, #00a63e 100%)", heroEmoji: "💻" },
      ];
    }

    return [primary];
  }, [userState?.goal, userState?.products, getGoalContributionSummary]);

  // ── Derive initial screen variant from goal status ──
  const initialScreenVariant = useMemo<"new5" | "review-ontrack" | "review-completed" | "review-rent">(() => {
    const goal = userState?.goal;
    if (!goal) return "new5";
    const monthsElapsed = Math.max(1, Math.round((Date.now() - new Date(goal.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)));
    const { contributionAmount } = getGoalContributionSummary();
    const totalSaved = goal.savingsAllocated + (contributionAmount * monthsElapsed);
    const pct = goal.amountNum > 0 ? Math.min(100, Math.round((totalSaved / goal.amountNum) * 100)) : 0;
    if (pct >= 100) return "review-completed"; // goal fully funded
    const expectedPct = (monthsElapsed / goal.timelineMonths) * 100;
    if (pct <= expectedPct - 5) return "new5"; // behind → overspend alert
    return "review-ontrack"; // on-track or ahead
  }, [userState?.goal, getGoalContributionSummary]);

  const openGoalDetail = useCallback((card: GoalProgressCardData) => {
    const goal = userState?.goal;
    const paceMap = {
      aggressive: "Aggressive pace",
      balanced: "Balanced pace",
      relaxed: "Relaxed pace",
    } as const;

    const timeline = goal?.timeline ?? "Current plan";
    const timelineMonths = goal?.timelineMonths ?? Math.max(1, Math.round((card.target / Math.max(card.saved, 1)) * 12));
    const monthsElapsed = goal
      ? Math.max(1, Math.round((Date.now() - new Date(goal.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)))
      : Math.max(1, timelineMonths - Math.max(0, parseInt(card.daysLabel.match(/(\d+)\s+months?\s+left/) ? card.daysLabel.match(/(\d+)\s+months?\s+left/)?.[1] || "0" : "0", 10)));
    const monthsLeftFromLabel = card.daysLabel.match(/(\d+)\s+months?\s+left/);
    const monthsLeft = goal
      ? Math.max(0, goal.timelineMonths - monthsElapsed)
      : monthsLeftFromLabel ? parseInt(monthsLeftFromLabel[1], 10) : Math.max(0, timelineMonths - monthsElapsed);
    const { contributionAmount, contributionLabel, productLabel } = getGoalContributionSummary();
    const amountRemaining = Math.max(0, card.target - card.saved);
    const startedLabel = goal ? formatDateMonth(goal.createdAt) : "Latest snapshot";

    setGoalDetail({
      name: goal?.name ?? card.name,
      saved: card.saved,
      target: card.target,
      pct: card.pct,
      status: card.status,
      daysLabel: card.daysLabel,
      timeline,
      timelineMonths: goal?.timelineMonths ?? timelineMonths,
      monthsElapsed,
      monthsLeft,
      paceLabel: goal ? paceMap[goal.paceId] : "Current pace",
      contributionAmount,
      contributionLabel,
      productLabel,
      amountRemaining,
      startedLabel,
    });
    requestAnimationFrame(() => requestAnimationFrame(() => setGoalDetailPhase("open")));
  }, [userState?.goal, getGoalContributionSummary]);

  const showGoalReview = () => {
    const payload = getGoalReviewPayload();
    if (!payload) return;

    queueMessage("assistant", payload.message, undefined, payload.card);
    setActiveChips([]);
  };

  const openGoalReviewShortcut = useCallback((title: string) => {
    const payload = getGoalReviewPayload();
    if (!payload) return;

    setReviewMessages([
      {
        id: `review-user-${Date.now()}`,
        role: "user",
        text: title,
      },
      {
        id: `review-assistant-${Date.now() + 1}`,
        role: "assistant",
        text: payload.message,
        card: payload.card,
      },
    ]);
    setShowInitialScreen(false);
  }, [getGoalReviewPayload]);

  // ============ GOAL FLOW ============
  const startGoal = () => {
    mutate({ currentStep: "goal", goalStage: "choice" });
    queueMessage("assistant", "What are you saving toward?");
    setActiveChips(toChips(goalChips));
  };

  const handleGoalChip = (chip: ChatChip) => {
    if (goalStage === "choice") {
      handleGoalChoice(chip.label);
      return;
    }
    if (goalStage === "timeline") {
      handleGoalTimeline(chip);
      return;
    }
    if (goalStage === "amount") {
      handleGoalAmount(chip);
      return;
    }
    if (goalStage === "savings-ask") {
      handleSavingsAskChip(chip);
      return;
    }
    if (goalStage === "plan") {
      handlePlanChip(chip);
      return;
    }
    if (goalStage === "plan-adjust") {
      handlePlanAdjustChip(chip);
      return;
    }
    if (goalStage === "pinned") {
      handlePinnedGoal(chip);
      return;
    }
  };

  // Step 1: What are you saving toward?
  const handleGoalChoice = (value: string) => {
    setLocalGoalDraft((prev) => ({ ...prev, name: value }));
    addMessage("user", value);

    if (value === "Trip") {
      queueMessage("assistant", "Where are you headed?");
      mutate({ goalStage: "destination" });
      setActiveChips([]);
    } else {
      queueMessage("assistant", "By when?");
      mutate({ goalStage: "timeline" });
      setActiveChips(toChips(timelineChips));
    }
  };

  // Step 1b: Where are you headed? (Trip only)
  const handleGoalDestination = (value: string) => {
    setLocalGoalDraft((prev) => ({ ...prev, name: `Trip to ${value}` }));
    addMessage("user", value);
    queueMessage("assistant", "By when?");
    mutate({ goalStage: "timeline" });
    setActiveChips(toChips(timelineChips));
  };

  // Step 2: By when?
  const handleGoalTimeline = (chip: ChatChip) => {
    const timeline = chip.label;
    setLocalGoalDraft((prev) => ({ ...prev, timeline }));
    addMessage("user", timeline);
    queueMessage("assistant", "How much do you need?");
    mutate({ goalStage: "amount" });
    setActiveChips(toChips(amountChips));
  };

  // Step 3: How much? → check for existing investments, then show plan
  const handleGoalAmount = (chip: ChatChip) => {
    const amount = chip.label;
    setLocalGoalDraft((prev) => ({ ...prev, amount }));
    addMessage("user", amount);

    storeMemoryDecision(
      "goal_set",
      `User set goal: ${goalDraft.name || "unnamed"}, ${amount}, ${goalDraft.timeline || "no timeline"}`
    );

    const goalName = goalDraft.name || "Savings goal";
    const timeline = goalDraft.timeline || "6 months";
    const totalInvested = profile.investmentSummary.totalInvested;

    if (totalInvested > 0) {
      mutate({ goalStage: "savings-ask" });
      queueMessage("assistant", `${goalName}. ${amount}. ${timeline}. Got it. I can see you have ${formatINR(totalInvested)} in investments - would you like to count that toward this goal?`);
      setTimeout(() => {
        setActiveChips([
          { id: "savings-yes", label: "Yes, include that too" },
          { id: "savings-no", label: "No, start from scratch" },
        ]);
      }, 800);
    } else {
      // No investments - go straight to plan
      queueMessage("assistant", `${goalName}. ${amount}. ${timeline}. Got it.`);
      setTimeout(() => {
        showPlanCard(amount, timeline, goalName, undefined, 0);
      }, 800);
    }
  };

  // Step 3b: Savings ask - yes or no
  const handleSavingsAskChip = (chip: ChatChip) => {
    addMessage("user", chip.label);
    const amount = goalDraft.amount || "₹5L";
    const timeline = goalDraft.timeline || "6 months";
    const goalName = goalDraft.name || "Savings goal";
    const totalInvested = profile.investmentSummary.totalInvested;

    if (chip.id === "savings-yes") {
      showPlanCard(amount, timeline, goalName, undefined, totalInvested);
    } else {
      showPlanCard(amount, timeline, goalName, undefined, 0);
    }
  };

  // Show investment product card for the user to confirm
  const showPlanCard = (goalAmount: string, timeline: string, goalName: string, paceOverride?: string, savingsOverride?: number) => {
    const goalNum = parseINR(goalAmount);
    const existingSavings = savingsOverride ?? 0;
    const remaining = Math.max(0, goalNum - existingSavings);

    setLocalSavingsForGoal(existingSavings);

    const presets = computePacePresets(remaining);
    setDynamicPacePresets(presets);

    const paceId = (paceOverride || getDefaultPaceId(timeline)) as "aggressive" | "balanced" | "relaxed";
    setLocalPaceId(paceId);

    const preset = presets.find((p) => p.id === paceId) ?? presets[0];
    const monthlyAmount = parseINR(preset.required_monthly_cut);
    const productType = preset.recommended_product.type;
    const rate = productType === "RD" ? "7.25% p.a." : "~4% p.a.";

    mutate({ goalStage: "plan" });

    const productName = productType === "RD" ? "a monthly RD" : "daily auto-save";
    const savingsLine = existingSavings > 0
      ? `With ${formatINR(existingSavings)} already counted in, you'd need ${formatINR(monthlyAmount)}/month to get there.`
      : `You'd need to put away ${formatINR(monthlyAmount)}/month to get there.`;
    const summaryLine = `${savingsLine} I'd recommend ${productName} at ${rate}.`;

    // Show investment product card with Invest CTA
    const baseAmount = monthlyAmount;
    const amountOptions = [
      { label: formatINR(baseAmount), value: baseAmount },
      { label: formatINR(Math.round(baseAmount * 1.5 / 1000) * 1000), value: Math.round(baseAmount * 1.5 / 1000) * 1000 },
      { label: formatINR(baseAmount * 2), value: baseAmount * 2 },
    ];

    addMessage(
      "assistant",
      summaryLine,
      undefined,
      {
        type: "investment-product",
        productType: productType === "RD" ? "Recurring Deposit" : "Auto-save",
        amount: baseAmount,
        rate,
        tenure: timeline,
        amountOptions,
        accountLabel: "Savings xx1234",
        onInvest: (investAmount: number) => {
          handleInvestConfirm(investAmount, goalName, timeline, existingSavings, goalNum, paceId, productType);
        },
      },
    );
    // No chips - the card's "Invest" button is the CTA
    setActiveChips([]);
  };

  // User tapped "Invest" on the product card → persist goal + show savings-plan confirmation
  const handleInvestConfirm = (
    investAmount: number,
    goalName: string,
    timeline: string,
    existingSavings: number,
    goalNum: number,
    paceId: "aggressive" | "balanced" | "relaxed",
    productType: string,
  ) => {
    const prodType = productType === "RD" ? "rd" as const : "autosave" as const;
    const timelineMonths = parseTimelineToMonths(timeline);

    // Persist goal + product
    const goalObj = {
      name: goalName,
      timeline,
      timelineMonths,
      amount: goalDraft.amount || "₹5L",
      amountNum: goalNum,
      savingsAllocated: existingSavings,
      paceId,
      createdAt: new Date().toISOString(),
    };

    mutate({
      onboardingComplete: true,
      currentStep: "home",
      goal: goalObj,
      budgetOverrides,
      bufferRemaining,
      products: [...(userState?.products || []), {
        type: prodType,
        amount: investAmount,
        frequency: prodType === "rd" ? "monthly" : "daily",
        activatedAt: new Date().toISOString(),
        active: true,
      }],
    });

    // Flip the existing investment-product card to activated state
    setMessages((prev) => prev.map((msg) => {
      if (msg.card?.type === "investment-product" && !msg.card.activated) {
        return { ...msg, card: { ...msg.card, activated: true, amount: investAmount, onInvest: undefined, onArrowTap: () => { setRdDetailVisible(true); requestAnimationFrame(() => requestAnimationFrame(() => setRdDetailPhase("open"))); } } };
      }
      return msg;
    }));

    queueMessage("assistant", "Congratulations on taking the first step toward achieving your savings goal!");
    setActiveChips([]);
    setGoalPlanCompleted(true);
  };

  // Step 4: Adjust (only reachable if we add adjust chips back later)
  const handlePlanChip = (chip: ChatChip) => {
    addMessage("user", chip.label);

    if (chip.id === "adjust-plan") {
      mutate({ goalStage: "plan-adjust" });
      queueMessage("assistant", "What would you like to change?");
      setActiveChips(toChips(planAdjustChips));
      return;
    }
  };

  // Adjust sub-options
  const handlePlanAdjustChip = (chip: ChatChip) => {
    addMessage("user", chip.label);

    if (chip.id === "change-pace") {
      queueMessage("assistant", "Pick a pace:");
      setActiveChips(toChips(paceChoiceChips));
      // Stay on plan-adjust - pace selection handled below
      return;
    }

    if (chip.id === "aggressive" || chip.id === "balanced" || chip.id === "relaxed") {
      // Re-show plan with new pace
      showPlanCard(
        goalDraft.amount || "₹5L",
        goalDraft.timeline || "6 months",
        goalDraft.name || "Savings goal",
        chip.id,
      );
      return;
    }

    if (chip.id === "less-savings") {
      // Set savings to 0 and recompute
      setLocalSavingsForGoal(0);
      const goalNum = parseINR(goalDraft.amount || "₹5L");
      const presets = computePacePresets(goalNum);
      setDynamicPacePresets(presets);

      const paceId = selectedPaceId;
      const preset = presets.find((p) => p.id === paceId) ?? presets[0];
      const monthlyAmount = parseINR(preset.required_monthly_cut);
      const productType = preset.recommended_product.type;
      const rate = productType === "RD" ? "7.25% p.a." : "~4% p.a.";
      const timelineMonths = parseTimelineToMonths(goalDraft.timeline || "6 months");

      mutate({ goalStage: "plan" });
      addMessage(
        "assistant",
        "Starting fresh - no existing savings applied.",
        undefined,
        {
          type: "savings-plan",
          name: goalDraft.name || "Savings goal",
          target: goalNum,
          timeline: goalDraft.timeline || "6 months",
          existingSavings: 0,
          monthlyAmount,
          productType: productType === "RD" ? "RD" : "Auto-save",
          productLabel: preset.recommended_product.label,
          rate,
          pct: 0,
          timelineLabel: `${timelineMonths} months to go`,
        },
      );
      setActiveChips(toChips(planConfirmChips));
      return;
    }

    if (chip.id === "skip-auto") {
      // Save goal without product
      const goalName = goalDraft.name || "Savings goal";
      const timeline = goalDraft.timeline || "6 months";

      mutate({
        onboardingComplete: true,
        currentStep: "home",
        goal: {
          name: goalName,
          timeline,
          timelineMonths: parseTimelineToMonths(timeline),
          amount: goalDraft.amount || "₹5L",
          amountNum: parseINR(goalDraft.amount || "₹5L"),
          savingsAllocated: savingsForGoal,
          paceId: selectedPaceId,
          createdAt: new Date().toISOString(),
        },
        budgetOverrides,
        bufferRemaining,
      });

      queueMessage("assistant", `${goalName} is set. You can turn on automation anytime.`);
      finishBudget({ skipInsight: true });
      return;
    }
  };

  const handlePinnedGoal = (chip: ChatChip) => {
    addMessage("user", chip.label);

    if (chip.id === "show-plan") {
      startBudget();
      return;
    }
    if (chip.id === "adjust-goal") {
      queueMessage("assistant", "What would you like to change?");
      mutate({ goalStage: "choice" });
      setActiveChips(toChips(goalChips));
      return;
    }
    if (chip.id === "add-goal") {
      queueMessage("assistant", "You can add more goals later. For now, let's nail this one first.");
      setActiveChips(toChips(pinnedGoalChips));
    }
  };

  const handleGoalInput = async (value: string) => {
    if (step !== "goal") return;
    if (goalStage === "choice") {
      handleGoalChoice(value);
      return;
    }
    if (goalStage === "destination") {
      handleGoalDestination(value);
      return;
    }
  };

  // ============ BUDGET FLOW ============
  const startBudget = () => {
    mutate({ currentStep: "budget", budgetStage: "digest" });
    const preset = lookupPace(selectedPaceId);
    addMessage(
      "assistant",
      `Based on your current habits:\n\n• You're saving ~${profile.goal.current_savings_pct} right now.\n• To hit the ${preset.label.toLowerCase()} pace, you'd need to cut about ${preset.required_monthly_cut}/month.\n\nYou can either keep going (if you're already on track) or change one thing.`,
    );
    setActiveChips(toChips(budgetDigestChips));
  };

  const handleBudgetChip = (chip: ChatChip) => {
    addMessage("user", chip.label);

    switch (budgetStage) {
      case "digest":
        {
          const preset = lookupPace(selectedPaceId);
        if (chip.id === "ok-pace") {
          addMessage(
            "assistant",
            `You're on track for the ${preset.label.toLowerCase()} pace. Want to add a system to stay consistent?`,
          );
          mutate({ budgetStage: "onTrack" });
          setActiveChips(toChips(onTrackChips));
        } else {
          const monthlyCut = parseINR(preset.required_monthly_cut);
          const levers = computeBudgetLevers(monthlyCut);
          const leverChips: ChipOption[] = levers.slice(0, 4).map((l) => ({
            id: l.id,
            label: l.label,
          }));
          leverChips.push({ id: "no-change", label: "Don't change anything" });
          addMessage(
            "assistant",
            `To hit the ${preset.label.toLowerCase()} pace, we need to free up about ${preset.required_monthly_cut}/month. Pick one lever that feels realistic:`,
          );
          mutate({ budgetStage: "lever" });
          setActiveChips(toChips(leverChips));
        }
        break;
        }

      case "onTrack":
        if (chip.id === "auto" || chip.id === "backup") {
          addMessage(
            "assistant",
            "Want to set a soft budget for weekends to protect the goal?",
          );
          mutate({ budgetStage: "budgetChoice" });
          setActiveChips(toChips(budgetAgreementChips));
        } else {
          queueMessage("assistant", "Noted. I'll track progress.");
          finishBudget();
        }
        break;

      case "lever":
        if (chip.id === "no-change") {
          queueMessage("assistant", "Tracking only for now.");
          finishBudget();
        } else {
          queueMessage("assistant", "Do you want me to set a budget for this category?");
          mutate({ budgetStage: "budgetChoice" });
          setActiveChips(toChips(budgetAgreementChips));
        }
        break;

      case "budgetChoice":
        if (chip.id === "choose") {
          queueMessage("assistant", "Choose a budget style:");
          mutate({ budgetStage: "budgetStyle" });
          setActiveChips(toChips(budgetStyleChips));
        } else {
          addMessage(
            "assistant",
            chip.id === "track"
              ? "Tracking only."
              : "Soft budget set for this category.",
          );
          mutate({ budgetStage: "actionConfirm" });
          setActiveChips([{ id: "continue", label: "Continue" }]);
        }
        break;

      case "budgetStyle":
        mutate({
          budgetStyle: chip.id as "strict" | "chill" | "bucket",
          budgetStage: "actionConfirm",
        });
        storeMemoryDecision("budget_style", `User prefers ${chip.label.toLowerCase()} budget over strict`);
        addMessage(
          "assistant",
          `${chip.label} budget style set for this category.`,
        );
        setActiveChips([{ id: "continue", label: "Continue" }]);
        break;

      case "action":
        queueMessage("assistant", "Budget updated.");
        mutate({ budgetStage: "actionConfirm" });
        setActiveChips([{ id: "continue", label: "Continue" }]);
        break;

      case "actionConfirm":
        finishBudget();
        break;
    }
  };

  const finishBudget = (options?: { skipInsight?: boolean }) => {
    mutate({ currentStep: "home" });
    setHomeSubflow("idle");
    if (options?.skipInsight) {
      queueMessage("assistant", "Done. What would you like to check next?");
      setActiveChips(toChips(steadyStateChips));
      return;
    }
    const nextInsight = profile.insights[0];
    queueMessage("assistant", nextInsight.message, "insight");
    setActiveChips(
      nextInsight.chips.length > 0
        ? nextInsight.chips.map((c, i) => ({ id: `insight-${i}`, label: c }))
        : toChips(steadyStateChips)
    );
  };

  // ============ HOME / STEADY STATE ============
  const handleHomeChip = (chip: ChatChip) => {
    addMessage("user", chip.label);

    // Check if this is a steady state chip action
    const steadyStateActions: Record<string, () => void> = {
      "afford": () => startAffordFlow(),
      "worth": () => startWorthFlow(),
      "progress": () => startProgressFlow(),
      "understand": () => startUnderstandFlow(),
      "goal-new": () => startGoal(),
      "review-goal": () => showGoalReview(),
      "budget-flow": () => startBudget(),
      "leaks": () => { setHomeSubflow("leak-insight"); handleLeakInsight({ id: "investigate", label: "Investigate" }); },
    };

    if (steadyStateActions[chip.id]) {
      steadyStateActions[chip.id]();
      return;
    }

    // Handle subflow-specific chips
    switch (homeSubflow) {
      case "afford-amount":
        handleAffordAmount(chip);
        break;
      case "afford-category":
        handleAffordCategory(chip);
        break;
      case "afford-fullpicture":
        handleAffordFullPicture(chip);
        break;
      case "afford-alternatives":
        handleAffordAlternatives(chip);
        break;
      case "swipe-rating":
        handleSwipeRating(chip);
        break;
      case "swipe-patterns":
        handleSwipePatterns(chip);
        break;
      case "swipe-actions":
        handleSwipeActions(chip);
        break;
      case "progress-status":
        returnToSteadyState();
        break;
      case "progress-ahead":
        handleProgressAhead(chip);
        break;
      case "progress-behind":
        handleProgressBehind(chip);
        break;
      case "progress-ontrack":
        handleProgressOnTrack(chip);
        break;
      case "understand-menu":
        handleUnderstandMenu(chip);
        break;
      case "understand-categories":
        handleUnderstandCategories(chip);
        break;
      case "understand-patterns":
        handleUnderstandPatterns(chip);
        break;
      case "understand-benchmarks":
        handleUnderstandBenchmarks(chip);
        break;
      case "understand-personality":
        handleUnderstandPersonality(chip);
        break;
      case "leak-insight":
        handleLeakInsight(chip);
        break;
      case "leak-investigate":
        handleLeakInvestigate(chip);
        break;
      case "leak-solution":
        handleLeakSolution(chip);
        break;
      case "tradeoff":
        handleTradeoffChip(chip);
        break;
      case "recap":
        handleRecapChip(chip);
        break;
      case "roast":
        handleRoastChip(chip);
        break;
      default:
        // Handle insight chip clicks or return to steady state
        handleInsightChip(chip);
    }
  };

  const handleInsightChip = (chip: ChatChip) => {
    // Map insight chip labels to actions
    if (chip.label === "Can I afford…") {
      startAffordFlow();
    } else if (chip.label === "Worth it?" || chip.label === "Worth it" || chip.label === "Rate my spends") {
      startWorthFlow();
    } else if (chip.label === "Progress" || chip.label === "Show progress") {
      startProgressFlow();
    } else if (chip.label === "Understand my money") {
      startUnderstandFlow();
    } else if (chip.label.includes("Auto-save") || chip.label.includes("auto")) {
      // Autosave suggestion from insight - simplified flow
      const dailyAmount = profile.action.suggested_autosave_day;
      queueMessage("assistant", `Set up autosave at ${dailyAmount}/day?`);
      setActiveChips([
        { id: "confirm-auto", label: `Yes, ${dailyAmount}/day` },
        { id: "cancel", label: "Not now" },
      ]);
    } else if (chip.label.includes("RD")) {
      // RD suggestion from insight
      const rdAmount = profile.action.suggested_rd_month;
      queueMessage("assistant", `Start an RD at ${rdAmount}/month?`);
      setActiveChips([
        { id: "confirm-rd", label: `Yes, ${rdAmount}/month` },
        { id: "other-amounts", label: "Other amounts" },
        { id: "cancel", label: "Not now" },
      ]);
    } else if (chip.label.includes("FD")) {
      // FD suggestion from insight
      queueMessage("assistant", getFDSuggestion(profile));
      setActiveChips([
        { id: "create-fd", label: "Create FD" },
        { id: "keep-liquid", label: "Keep liquid" },
        { id: "cancel", label: "Not now" },
      ]);
    } else if (chip.label === "Lock it in" || chip.label === "Boost goal") {
      // Route to progress flow
      startProgressFlow();
    } else if (chip.label.includes("Joy") || chip.label.includes("Regret")) {
      // Route to leak investigation
      setHomeSubflow("leak-insight");
      handleLeakInsight({ id: "investigate", label: "Investigate" });
    } else {
      // Generic response and return to steady state
      queueMessage("assistant", "Got it. What else can I help with?");
      returnToSteadyState();
    }
  };

  const returnToSteadyState = () => {
    setHomeSubflow("idle");
    setActiveChips(toChips(steadyStateChips));
  };

  // ============ SUBFLOW: CAN I AFFORD (REDESIGNED) ============
  const startAffordFlow = () => {
    setHomeSubflow("afford-amount");
    queueMessage("assistant", "How much?");
    setActiveChips(toChips(affordAmountChips));
  };

  const handleAffordAmount = (chip: ChatChip) => {
    setSubflowData((prev) => ({ ...prev, affordAmount: chip.label }));
    setHomeSubflow("afford-category");
    queueMessage("assistant", "What category?");
    setActiveChips(toChips(dynamicCategoryChips));
  };

  const handleAffordCategory = async (chip: ChatChip) => {
    const amount = subflowData.affordAmount || "₹1,500";
    const category = chip.label || "Other";
    const amountNum = parseInt(amount.replace(/[₹,]/g, ""));

    setSubflowData((prev) => ({ ...prev, affordCategory: category }));
    setHomeSubflow("afford-fullpicture");

    const fullPicture = getAffordFullPicture(amountNum, category);

    // Try AI analysis
    const response = await callFlowAssist("copy", "afford-analysis", buildAffordContext(amountNum, category));

    if (response?.message) {
      queueMessage("assistant", response.message);
    } else {
      // Fallback template
      let message = `CAN I AFFORD ${amount}?\n\n`;
      if (fullPicture.status === "safe") {
        message += `YES - You can afford this. ${fullPicture.is_other ? `Buffer: ${fullPicture.buffer_before} → ${fullPicture.buffer_after}.` : `${category}: ${fullPicture.spent_so_far} spent, budget ${fullPicture.category_budget}. After: ${fullPicture.total_after_spend}.`}`;
      } else if (fullPicture.status === "tight") {
        message += `TIGHT - Doable but it ${fullPicture.budget_excess ? `pushes ${category} ${fullPicture.budget_excess} over budget` : "eats into your buffer"}. Buffer: ${fullPicture.buffer_before} → ${fullPicture.buffer_after}.`;
      } else {
        message += `RISKY - This ${fullPicture.budget_excess ? `blows past your ${category} budget by ${fullPicture.budget_excess}` : "exhausts your buffer"}. Buffer: ${fullPicture.buffer_before} → ${fullPicture.buffer_after}.`;
      }
      if (fullPicture.upcoming_bills) message += `\n\nHeads up: ${fullPicture.upcoming_bills}`;
      queueMessage("assistant", message);
    }

    // Chips still determined by status
    if (fullPicture.status === "safe") {
      setActiveChips([
        { id: "go-for-it", label: "Go for it" },
        { id: "back", label: "Back to home" },
      ]);
    } else if (fullPicture.status === "tight") {
      const reduceAmount = Math.floor(amountNum * 0.6);
      setActiveChips([
        { id: "go-anyway", label: "Go for it anyway" },
        { id: "reduce-amount", label: `Reduce to ₹${reduceAmount}` },
        { id: "alternatives", label: "Show me alternatives" },
        { id: "back", label: "Cancel" },
      ]);
    } else {
      setActiveChips([
        { id: "go-anyway", label: "Go for it anyway" },
        { id: "delay", label: "Delay till next week" },
        { id: "alternatives", label: "Show alternatives" },
        { id: "back", label: "Cancel" },
      ]);
    }

    setSubflowData((prev) => ({
      ...prev,
      affordStatus: fullPicture.status,
      affordAmountNum: String(amountNum),
    }));
  };

  const handleAffordFullPicture = (chip: ChatChip) => {
    const amount = subflowData.affordAmount || "₹1,500";
    const amountNum = parseInt(subflowData.affordAmountNum || "1500");
    const category = subflowData.affordCategory || "General";
    const goalName = goalDraft.name || profile.goal.goal_name;

    if (chip.id === "go-for-it" || chip.id === "go-anyway") {
      mutate({ bufferRemaining: bufferRemaining - amountNum });
      const impact = calculateGoalImpact(amountNum);
      storeMemoryDecision("afford_decision", `User approved ${amount} spend on ${category}${chip.id === "go-anyway" ? " despite budget risk" : ""}`);

      queueMessage("assistant", `${amount} approved.`);
      if (impact.days_impact > 0) {
        addMessage(
          "assistant",
          `You're now ${impact.new_status >= 0 ? Math.abs(impact.new_status) + ' days ahead' : Math.abs(impact.new_status) + ' days behind'} on ${goalName}.`
        );
      }
      returnToSteadyState();
      return;
    }

    if (chip.id === "reduce-amount") {
      const reduceAmount = Math.floor(amountNum * 0.6);
      mutate({ bufferRemaining: bufferRemaining - reduceAmount });
      storeMemoryDecision("afford_decision", `User reduced ${amount} to ₹${reduceAmount} on ${category} to protect buffer`);
      queueMessage("assistant", `Reduced to ₹${reduceAmount}. Buffer stays intact.`);
      returnToSteadyState();
      return;
    }

    if (chip.id === "delay") {
      storeMemoryDecision("afford_decision", `User delayed ${amount} ${category} spend to protect buffer`);
      queueMessage("assistant", "Noted. Buffer has more time to recover before the spend.");
      returnToSteadyState();
      return;
    }

    if (chip.id === "set-cap") {
      addMessage(
        "assistant",
        `Setting a ${category} cap. This prevents repeat patterns and keeps ${goalName} on track.`
      );
      queueMessage("assistant", `Suggested cap: ${formatINR(Math.floor(amountNum * 1.5))}/month for ${category}.`);
      returnToSteadyState();
      return;
    }

    if (chip.id === "alternatives") {
      setHomeSubflow("afford-alternatives");
      const preset = lookupPace(selectedPaceId);
      queueMessage("assistant", `To afford ${amount} comfortably, you could:\n\n${preset.lever_examples.slice(0, 3).map((l, i) => `${i + 1}. ${l}`).join('\n')}`);
      setActiveChips([
        { id: "lever-0", label: preset.lever_examples[0] },
        { id: "lever-1", label: preset.lever_examples[1] || "Extend goal" },
        { id: "extend-goal", label: "Extend goal by 1 week" },
        { id: "back", label: "Never mind" },
      ]);
      return;
    }

    if (chip.id === "back") {
      returnToSteadyState();
    }
  };

  const handleAffordAlternatives = (chip: ChatChip) => {
    if (chip.id === "back") {
      returnToSteadyState();
      return;
    }

    queueMessage("assistant", `Applied: ${chip.label}.`);
    returnToSteadyState();
  };

  // ============ SUBFLOW: RATE MY SPENDS (REDESIGNED with swipe interface) ============
  const startWorthFlow = () => {
    // Load real transactions for rating
    const realTxns = getRecentTransactionsForRating();
    const receipts = realTxns.map((t) => ({
      id: t.id,
      time: t.time,
      category: t.category,
      amount: t.amount,
      merchant: t.merchant,
    }));
    setSwipeQueue(receipts);
    setSwipeIndex(0);
    setHomeSubflow("swipe-rating");
    addMessage(
      "assistant",
      "Rate your recent spends. Swipe → worth it, ← regret, ↑ skip."
    );
    if (receipts.length > 0) {
      showSwipeCard(receipts[0]);
    }
  };

  const showSwipeCard = (receipt: typeof profile.receipts[0]) => {
    const cardMessage = `${receipt.merchant || receipt.category}\n${receipt.amount}\n${receipt.time}\n\n${receipt.category}`;
    queueMessage("assistant", cardMessage);
    setActiveChips([
      { id: "swipe-right", label: "→ Worth it" },
      { id: "swipe-left", label: "← Regret" },
      { id: "swipe-up", label: "↑ Skip" },
      { id: "done-swiping", label: "Done rating" },
    ]);
  };

  const handleSwipeRating = (chip: ChatChip) => {
    const currentReceipt = swipeQueue[swipeIndex];
    if (!currentReceipt) {
      analyzeSwipePatterns();
      return;
    }

    // Record rating
    if (chip.id !== "done-swiping") {
      const rating =
        chip.id === "swipe-right" ? "worth" : chip.id === "swipe-left" ? "regret" : "meh";

      const hour = parseInt(currentReceipt.time.split(":")[0]?.split(" ").pop() || "12");
      const time_of_day =
        hour >= 22 || hour < 6
          ? "late_night"
          : hour >= 12 && hour < 17
          ? "afternoon"
          : hour >= 17 && hour < 22
          ? "evening"
          : "morning";

      const newRating = {
        txnId: currentReceipt.id,
        category: currentReceipt.category,
        amount: parseINR(currentReceipt.amount),
        rating: rating as "worth" | "regret" | "meh",
        timeOfDay: time_of_day,
        ratedAt: new Date().toISOString(),
      };

      mutate({ spendRatings: [...spendRatings, newRating] });
    }

    // Move to next card or analyze patterns
    const nextIndex = swipeIndex + 1;
    if (chip.id === "done-swiping" || nextIndex >= swipeQueue.length || nextIndex >= 10) {
      if (spendRatings.length + (chip.id !== "done-swiping" ? 1 : 0) >= 5) {
        analyzeSwipePatterns();
      } else {
        queueMessage("assistant", "Rate at least 5 spends to see patterns.");
        returnToSteadyState();
      }
    } else {
      setSwipeIndex(nextIndex);
      showSwipeCard(swipeQueue[nextIndex]);
    }
  };

  const analyzeSwipePatterns = async () => {
    setHomeSubflow("swipe-patterns");

    // Store spend ratings in Mem0
    const regrets = spendRatings.filter((r) => r.rating === "regret");
    const worths = spendRatings.filter((r) => r.rating === "worth");
    if (regrets.length > 0) {
      storeMemoryDecision(
        "spend_ratings",
        `User rated ${regrets.length} spends as regret: ${regrets.map((r) => `${r.category} ${formatINR(r.amount)}`).join(", ")}`
      );
    }
    if (worths.length > 0) {
      storeMemoryDecision(
        "spend_ratings",
        `User rated ${worths.length} spends as worth it: ${worths.map((r) => `${r.category} ${formatINR(r.amount)}`).join(", ")}`
      );
    }

    if (spendRatings.length < 3) {
      queueMessage("assistant", "Not enough ratings yet. Keep rating spends to build insights.");
      returnToSteadyState();
      return;
    }

    // Try AI analysis
    const ratingsForContext = spendRatings.map((r) => ({
      category: r.category,
      amount: formatINR(r.amount),
      rating: r.rating,
      time_of_day: r.timeOfDay,
    }));
    const response = await callFlowAssist("copy", "swipe-analysis", buildSwipeAnalysisContext(ratingsForContext));

    if (response?.message) {
      queueMessage("assistant", response.message);
    } else {
      // Fallback: basic pattern detection
      const categoryRatings: Record<string, { worth: number; regret: number; meh: number; total: number }> = {};
      spendRatings.forEach((r) => {
        if (!categoryRatings[r.category]) categoryRatings[r.category] = { worth: 0, regret: 0, meh: 0, total: 0 };
        categoryRatings[r.category][r.rating]++;
        categoryRatings[r.category].total++;
      });

      let msg = `Rated ${spendRatings.length} spends: ${worths.length} worth it, ${regrets.length} regret.\n\n`;
      for (const [cat, data] of Object.entries(categoryRatings)) {
        if (data.total >= 2) {
          if (data.regret / data.total >= 0.6) msg += `${cat}: mostly regret.\n`;
          else if (data.worth / data.total >= 0.6) msg += `${cat}: mostly joy.\n`;
        }
      }
      queueMessage("assistant", msg || "No clear patterns yet.");
    }

    if (regrets.length > 0 || worths.length > 0) {
      setActiveChips([
        ...(regrets.length > 0 ? [{ id: "optimize-regrets", label: "Fix regret patterns" }] : []),
        ...(worths.length > 0 ? [{ id: "protect-joy", label: "Protect joy patterns" }] : []),
        { id: "not-now", label: "Not now" },
      ]);
    } else {
      returnToSteadyState();
    }
  };

  const handleSwipePatterns = (chip: ChatChip) => {
    if (chip.id === "not-now") {
      returnToSteadyState();
      return;
    }

    setHomeSubflow("swipe-actions");

    if (chip.id === "optimize-regrets") {
      // Find top regret categories from actual ratings
      const regretCats = spendRatings
        .filter((r) => r.rating === "regret")
        .reduce<Record<string, number>>((acc, r) => {
          acc[r.category] = (acc[r.category] || 0) + 1;
          return acc;
        }, {});
      const topRegretEntries = Object.entries(regretCats).sort((a, b) => b[1] - a[1]);

      if (topRegretEntries.length > 0) {
        const topRegretCat = topRegretEntries[0][0];
        const actual = lifestyleCategories.find((c) => c.name === topRegretCat);
        const cutAmount = actual ? formatINR(Math.round(actual.monthlyAverage * 0.25)) : "₹2k";
        const catShort = topRegretCat.split("(")[0].trim();

        queueMessage("assistant", `${topRegretCat} = mostly regret. What should we do?`);
        setActiveChips([
          { id: "nudge-time", label: "Set spending alert" },
          { id: `reduce-${topRegretCat}`, label: `Reduce ${catShort} by ${cutAmount}` },
          { id: "nothing", label: "Nothing for now" },
        ]);
      } else {
        queueMessage("assistant", "No clear regret patterns yet. Keep rating to build insights.");
        returnToSteadyState();
      }
    } else if (chip.id === "protect-joy") {
      // Find top joy categories
      const joyCats = spendRatings
        .filter((r) => r.rating === "worth")
        .reduce<Record<string, number>>((acc, r) => {
          acc[r.category] = (acc[r.category] || 0) + 1;
          return acc;
        }, {});
      const topJoyEntries = Object.entries(joyCats).sort((a, b) => b[1] - a[1]);

      if (topJoyEntries.length > 0) {
        const topJoyCat = topJoyEntries[0][0];
        const actual = lifestyleCategories.find((c) => c.name === topJoyCat);
        const allocateAmount = actual ? formatINR(Math.ceil(actual.monthlyAverage * 0.8 / 500) * 500) : "₹2k";
        const catShort = topJoyCat.split("(")[0].trim();

        queueMessage("assistant", "Which joy spending should we protect?");
        setActiveChips([
          { id: `allocate-${topJoyCat}`, label: `Allocate ${allocateAmount} for ${catShort}` },
          { id: "keep-flexible", label: "Keep flexible" },
          { id: "nothing", label: "Not now" },
        ]);
      } else {
        queueMessage("assistant", "No clear joy patterns yet.");
        returnToSteadyState();
      }
    }
  };

  const handleSwipeActions = (chip: ChatChip) => {
    const goalName = goalDraft.name || profile.goal.goal_name;

    if (chip.id === "nothing" || chip.id === "keep-flexible") {
      queueMessage("assistant", "Got it. I'll just track for now.");
      returnToSteadyState();
      return;
    }

    if (chip.id === "nudge-time") {
      // Find top regret category for the nudge
      const regretCats = spendRatings
        .filter((r) => r.rating === "regret")
        .reduce<Record<string, number>>((acc, r) => {
          acc[r.category] = (acc[r.category] || 0) + 1;
          return acc;
        }, {});
      const topRegretCat = Object.entries(regretCats).sort((a, b) => b[1] - a[1])[0];
      const nudgeCategory = topRegretCat ? topRegretCat[0] : "General";
      mutate({
        nudges: [...(userState?.nudges || []), {
          type: "spending-alert" as const,
          category: nudgeCategory,
          active: true,
        }],
      });
      storeMemoryDecision("nudge_set", `User set spending nudge for ${nudgeCategory} from swipe actions`);
      queueMessage("assistant", `I'll nudge you when ${nudgeCategory} spending spikes to prevent regrets.`);
      returnToSteadyState();
      return;
    }

    if (chip.id.startsWith("reduce-")) {
      // Find which category to reduce using regret pattern data
      const regretCats = spendRatings
        .filter((r) => r.rating === "regret")
        .reduce<Record<string, number>>((acc, r) => {
          acc[r.category] = (acc[r.category] || 0) + 1;
          return acc;
        }, {});
      const topRegretCat = Object.entries(regretCats).sort((a, b) => b[1] - a[1])[0];

      // Find the real category and its budget
      if (topRegretCat) {
        const catName = topRegretCat[0];
        const actual = lifestyleCategories.find((c) => c.name === catName);
        const currentBudget = profile.suggested_budgets.categories.find((c) => c.name === catName);
        const currentBudgetNum = currentBudget ? parseINR(currentBudget.budget) : (actual?.monthlyAverage || 0);
        const reducedBudget = Math.ceil((currentBudgetNum * 0.75) / 500) * 500;
        const savings = currentBudgetNum - reducedBudget;

        mutate({ budgetOverrides: { [catName]: reducedBudget } });

        addMessage(
          "assistant",
          `UPDATED YOUR PLAN\n\nReduced ${catName}: ${formatINR(currentBudgetNum)} → ${formatINR(reducedBudget)}\n(Trimming regret patterns)\n\nSavings: ${formatINR(savings)}/month toward ${goalName}`
        );
      } else {
        queueMessage("assistant", "Budget updated based on your rating patterns.");
      }
      returnToSteadyState();
      return;
    }

    if (chip.id.startsWith("allocate-")) {
      // Find joy category and allocate budget
      const joyCats = spendRatings
        .filter((r) => r.rating === "worth")
        .reduce<Record<string, number>>((acc, r) => {
          acc[r.category] = (acc[r.category] || 0) + 1;
          return acc;
        }, {});
      const topJoyCat = Object.entries(joyCats).sort((a, b) => b[1] - a[1])[0];

      if (topJoyCat) {
        const catName = topJoyCat[0];
        const actual = lifestyleCategories.find((c) => c.name === catName);
        const monthlyAvg = actual?.monthlyAverage || 0;
        const allocateAmount = Math.ceil(monthlyAvg * 0.8 / 500) * 500;

        mutate({ budgetOverrides: { [catName]: allocateAmount } });

        addMessage(
          "assistant",
          `Allocated ${formatINR(allocateAmount)}/month for ${catName} (your joy category).\n\nThis protects what you value while keeping ${goalName} on track.`
        );
      } else {
        queueMessage("assistant", "Joy spending protected.");
      }
      returnToSteadyState();
      return;
    }

    returnToSteadyState();
  };

  // ============ LEAK INSIGHTS (System-initiated, not user chip) ============
  const handleLeakInsight = async (chip: ChatChip) => {
    if (chip.id === "investigate") {
      setHomeSubflow("leak-investigate");

      const leaks = computeLeakInsights();
      const topLeak = leaks[0];

      if (!topLeak) {
        queueMessage("assistant", "Your spending is fairly stable - no major leaks detected! That's a good sign.");
        returnToSteadyState();
        return;
      }

      // Store leak data for subsequent chips regardless of AI/fallback
      const monthlyCut = parseINR(lookupPace(selectedPaceId).required_monthly_cut);
      const daysImpact = monthlyCut > 0 ? Math.round((topLeak.suggestedCut / monthlyCut) * 30) : 0;
      setSubflowData((prev) => ({
        ...prev,
        leakCategory: topLeak.category,
        leakSuggestedCut: String(topLeak.suggestedCut),
        leakMonthlyAvg: String(topLeak.monthlyAvg),
      }));

      // Try AI copy
      const response = await callFlowAssist("copy", "leak-insight", buildLeakContext());
      if (response?.message) {
        queueMessage("assistant", response.message + "\n\nWas this joy or regret spending?");
      } else {
        // Fallback template
        addMessage(
          "assistant",
          `Here's what I found:\n\n• ${topLeak.category} is volatile\n• Average: ${formatINR(topLeak.monthlyAvg)}/month\n• Peak: ${formatINR(topLeak.peakAmount)} (${topLeak.peakMonth})\n• Low: ${formatINR(topLeak.troughAmount)} (${topLeak.troughMonth})\n• Impact: ~${daysImpact} days on your goal\n\nWas this joy or regret spending?`
        );
      }

      setActiveChips([
        { id: "joy", label: "Joy" },
        { id: "regret", label: "Regret" },
        { id: "mixed", label: "Mixed" },
      ]);
      return;
    }

    if (chip.id === "ignore") {
      queueMessage("assistant", "Got it. I'll check back later.");
      returnToSteadyState();
    }
  };

  const handleLeakInvestigate = (chip: ChatChip) => {
    setHomeSubflow("leak-solution");
    const leakCategory = subflowData.leakCategory || "unknown";
    const suggestedCut = parseInt(subflowData.leakSuggestedCut || "0");
    const leakMonthlyAvg = parseInt(subflowData.leakMonthlyAvg || "0");
    const allocateAmount = Math.round(leakMonthlyAvg * 0.7 / 500) * 500; // allocate 70% as joy budget

    if (chip.id === "joy") {
      addMessage(
        "assistant",
        `Fair enough! Want to budget for ${leakCategory} joy?\n\nAllocate ${formatINR(allocateAmount)}/month for ${leakCategory}?`
      );
      setActiveChips([
        { id: "allocate", label: `Yes, allocate ${formatINR(allocateAmount)}` },
        { id: "no-allocate", label: "No, I'll cut it" },
      ]);
      return;
    }

    if (chip.id === "regret" || chip.id === "mixed") {
      queueMessage("assistant", "Let's plug this leak. Options:");
      setActiveChips([
        { id: "nudge-time", label: "Set a spending alert" },
        { id: "reduce-category", label: `Reduce ${leakCategory.split("(")[0].trim()} by ${formatINR(suggestedCut)}` },
        { id: "not-now", label: "Not now" },
      ]);
    }
  };

  const handleLeakSolution = (chip: ChatChip) => {
    const leakCategory = subflowData.leakCategory || "unknown";
    const suggestedCut = parseInt(subflowData.leakSuggestedCut || "0");
    const leakMonthlyAvg = parseInt(subflowData.leakMonthlyAvg || "0");
    const allocateAmount = Math.round(leakMonthlyAvg * 0.7 / 500) * 500;

    if (chip.id === "allocate") {
      mutate({ budgetOverrides: { [leakCategory]: allocateAmount } });
      storeMemoryDecision("leak_action", `User allocated ${formatINR(allocateAmount)}/month as joy budget for ${leakCategory}`);
      queueMessage("assistant", `Allocated ${formatINR(allocateAmount)}/month for ${leakCategory} (your joy category).`);
      returnToSteadyState();
      return;
    }

    if (chip.id === "no-allocate" || chip.id === "not-now") {
      storeMemoryDecision("leak_action", `User declined to address ${leakCategory} leak for now`);
      queueMessage("assistant", "No worries. Let me know if you change your mind.");
      returnToSteadyState();
      return;
    }

    if (chip.id === "nudge-time") {
      mutate({
        nudges: [...(userState?.nudges || []), {
          type: "spending-alert",
          category: leakCategory,
          active: true,
        }],
      });
      storeMemoryDecision("leak_action", `User set spending alert for ${leakCategory} spikes`);
      queueMessage("assistant", `I'll alert you when ${leakCategory} spending spikes above average.`);
      returnToSteadyState();
      return;
    }

    if (chip.id === "reduce-category") {
      const newBudget = Math.max(0, leakMonthlyAvg - suggestedCut);
      const rounded = Math.ceil(newBudget / 500) * 500;
      mutate({ budgetOverrides: { [leakCategory]: rounded } });
      storeMemoryDecision("leak_action", `User reduced ${leakCategory} budget by ${formatINR(suggestedCut)} to plug leak`);
      queueMessage("assistant", `Reduced ${leakCategory} budget by ${formatINR(suggestedCut)}. This plugs the leak.`);
      returnToSteadyState();
    }
  };

  // ============ SUBFLOW: PROGRESS (REDESIGNED with ahead/behind/on-track paths) ============
  const startProgressFlow = async () => {
    setHomeSubflow("progress-status");
    const goalName = goalDraft.name || profile.goal.goal_name;
    const goalAmount = goalDraft.amount || profile.goal.goal_amount;
    const goalAmountNum = parseINR(goalAmount);
    const preset = lookupPace(selectedPaceId);

    const progressAmount = savingsForGoal;
    const monthlyCut = parseINR(preset.required_monthly_cut);
    const expectedSavings = monthlyCut * Math.min(profile.dataRange.months, 3);
    const daysNum = monthlyCut > 0 ? Math.round(((progressAmount - expectedSavings) / monthlyCut) * 30) : 0;
    const isAhead = daysNum > 0;
    const isBehind = daysNum < 0;

    const progressPct = goalAmountNum > 0 ? Math.round((progressAmount / goalAmountNum) * 100) : 0;
    const status: "ahead" | "behind" | "on-track" = isAhead ? "ahead" : isBehind ? "behind" : "on-track";
    const daysLabel = isAhead
      ? `${daysNum} days ahead`
      : isBehind
        ? `${Math.abs(daysNum)} days behind`
        : "On track";

    // Try AI copy for the status message
    const response = await callFlowAssist("copy", "progress-status", buildProgressContext());

    const progressCard: ChatCardData = {
      type: "goal-progress",
      name: goalName,
      pct: progressPct,
      saved: progressAmount,
      target: goalAmountNum,
      daysLabel,
      status,
    };

    if (response?.message) {
      queueMessage("assistant", response.message, undefined, progressCard);
    } else {
      const timeline = goalDraft.timeline || profile.goal.horizon;
      let statusText = "";
      if (isAhead) {
        statusText = `You're ${daysNum} days ahead on ${goalName}. Keep it up!`;
      } else if (isBehind) {
        statusText = `You're ${Math.abs(daysNum)} days behind on ${goalName}. Let's adjust.`;
      } else {
        statusText = `You're exactly on track for ${goalName}. Perfect pace!`;
      }
      queueMessage("assistant", statusText, undefined, progressCard);
    }

    // Chips determined by state machine (same as before)
    if (isAhead) {
      setHomeSubflow("progress-ahead");
      setActiveChips([
        { id: "relax-pace", label: "Relax my pace" },
        { id: "finish-faster", label: "Finish faster" },
        { id: "lock-it", label: "Lock it in" },
        { id: "keep-as-is", label: "Keep as is" },
      ]);
    } else if (isBehind) {
      setHomeSubflow("progress-behind");
      setActiveChips([
        { id: "see-what-happened", label: "See what happened" },
        { id: "adjust-timeline", label: "Adjust timeline" },
        { id: "catch-up", label: "Help me catch up" },
        { id: "change-goal", label: "Change my goal" },
      ]);
    } else {
      setHomeSubflow("progress-ontrack");
      setActiveChips([
        { id: "automate", label: "Automate pace" },
        { id: "push-harder", label: "Push harder" },
        { id: "keep-manual", label: "Keep manual" },
        { id: "adjust-goal", label: "Adjust goal" },
      ]);
    }
  };

  const handleProgressAhead = async (chip: ChatChip) => {
    const preset = lookupPace(selectedPaceId);

    if (chip.id === "relax-pace") {
      const response = await callFlowAssist("copy", "progress-relax", buildProgressActionContext("relax-pace"));
      if (response?.message) {
        queueMessage("assistant", response.message);
        if (response.actions.length > 0) applyFlowActions(response.actions);
      } else {
        const monthlyCut = parseINR(preset.required_monthly_cut);
        const relaxable = Math.round(monthlyCut * 0.15);
        queueMessage("assistant", `You can reduce cuts by up to ${formatINR(relaxable)}/month and still hit your goal on time.`);
      }
      setActiveChips([
        { id: "apply-relax", label: "Sounds good" },
        { id: "cancel", label: "Keep current pace" },
      ]);
      return;
    }

    if (chip.id === "apply-relax") {
      storeMemoryDecision("progress_action", "User chose to relax pace after being ahead of goal");
      queueMessage("assistant", "Pace relaxed. You're still on track with more breathing room.");
      returnToSteadyState();
      return;
    }

    if (chip.id === "finish-faster") {
      const response = await callFlowAssist("copy", "progress-faster", buildProgressActionContext("finish-faster"));
      if (response?.message) {
        queueMessage("assistant", response.message);
        if (response.actions.length > 0) applyFlowActions(response.actions);
      } else {
        queueMessage("assistant", "At this pace, you could finish 2 weeks early or increase your target.");
      }
      setActiveChips([
        { id: "finish-early", label: "Finish early" },
        { id: "increase-target", label: "Increase target" },
        { id: "cancel", label: "Keep current" },
      ]);
      return;
    }

    if (chip.id === "finish-early" || chip.id === "increase-target") {
      storeMemoryDecision("progress_action", `User chose to ${chip.label.toLowerCase()} after being ahead`);
      queueMessage("assistant", "Updated! Your plan now reflects your strong performance.");
      returnToSteadyState();
      return;
    }

    if (chip.id === "lock-it") {
      const dailyAmount = Math.floor(
        (parseInt(preset.required_monthly_cut.replace(/[₹,k]/g, "")) * 1000) / 30
      );
      addMessage(
        "assistant",
        `Turn on ₹${dailyAmount}/day autosave? This protects your progress automatically.`
      );
      setActiveChips([
        { id: "confirm-auto", label: `Yes, ₹${dailyAmount}/day` },
        { id: "cancel", label: "Cancel" },
      ]);
      return;
    }

    if (chip.id === "confirm-auto") {
      const dailyAmt = Math.floor(
        (parseInt(lookupPace(selectedPaceId).required_monthly_cut.replace(/[₹,k]/g, "")) * 1000) / 30
      );
      mutate({
        products: [...(userState?.products || []), {
          type: "autosave",
          amount: dailyAmt,
          frequency: "daily",
          activatedAt: new Date().toISOString(),
          active: true,
        }],
      });
      storeMemoryDecision("autosave_activated", `User set up autosave based on ${selectedPaceId} pace`);
      queueMessage("assistant", "Autosave activated! Your progress is now protected.", "success");
      returnToSteadyState();
      return;
    }

    if (chip.id === "keep-as-is" || chip.id === "cancel") {
      queueMessage("assistant", "Keeping your current plan. You're doing great!");
      returnToSteadyState();
    }
  };

  const handleProgressBehind = async (chip: ChatChip) => {
    const timeline = goalDraft.timeline || profile.goal.horizon;

    if (chip.id === "see-what-happened") {
      const response = await callFlowAssist("copy", "progress-diagnosis", buildProgressActionContext("see-what-happened"));

      if (response?.message) {
        queueMessage("assistant", response.message);
      } else {
        // Fallback
        const budgets = profile.suggested_budgets;
        const lines: string[] = [];
        const overBudgetCats: string[] = [];
        for (const cat of budgets.categories.slice(0, 5)) {
          const effectiveBudget = getEffectiveBudget(cat.name, budgetOverrides, profile);
          const actual = lifestyleCategories.find((c) => c.name === cat.name);
          const actualMonthly = actual?.monthlyAverage || 0;
          const diff = actualMonthly - effectiveBudget;
          if (diff > 0) {
            lines.push(`${cat.name}: ${formatINR(actualMonthly)} vs ${formatINR(effectiveBudget)} (+${formatINR(diff)} over)`);
            overBudgetCats.push(cat.name);
          }
        }
        queueMessage("assistant", `Spending vs budget:\n\n${lines.join("\n")}\n\n${overBudgetCats.join(" and ") || "Some categories"} went over.`);
      }

      // Still build dynamic chips from over-budget categories
      const overBudgetCats: string[] = [];
      for (const cat of profile.suggested_budgets.categories.slice(0, 5)) {
        const effectiveBudget = getEffectiveBudget(cat.name, budgetOverrides, profile);
        const actual = lifestyleCategories.find((c) => c.name === cat.name);
        if (actual && actual.monthlyAverage > effectiveBudget) {
          overBudgetCats.push(cat.name);
        }
      }
      const tightenChips: ChatChip[] = overBudgetCats.slice(0, 2).map((name) => ({
        id: `tighten-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        label: `Tighten ${name.split("(")[0].trim()}`,
      }));
      tightenChips.push({ id: "rate-spends", label: "Rate recent spends" });
      tightenChips.push({ id: "adjust-timeline", label: "Adjust timeline instead" });
      setActiveChips(tightenChips);
      return;
    }

    if (chip.id.startsWith("tighten-")) {
      const matchedCat = lifestyleCategories.find((c) => {
        const catId = `tighten-${c.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
        return chip.id === catId;
      });
      if (matchedCat) {
        const newBudget = Math.ceil(matchedCat.monthlyAverage * 0.85 / 500) * 500;
        mutate({ budgetOverrides: { [matchedCat.name]: newBudget } });
        storeMemoryDecision("budget_tightened", `Tightened ${matchedCat.name} to ${formatINR(newBudget)} after falling behind on goal`);
        queueMessage("assistant", `Reduced ${matchedCat.name} budget to ${formatINR(newBudget)}. This should help you catch up.`);
      } else {
        queueMessage("assistant", "Budget updated. This should help you catch up.");
      }
      returnToSteadyState();
      return;
    }

    if (chip.id === "rate-spends") {
      queueMessage("assistant", "Let's rate some spends to find patterns.");
      startWorthFlow();
      return;
    }

    if (chip.id === "adjust-timeline") {
      const timelineMonths = timeline === "12 months" ? 12 : 6;
      const newTimeline = timelineMonths + 1;
      addMessage(
        "assistant",
        `To keep your current pace realistic, extend to ${newTimeline} months? (from ${timelineMonths})\n\nSame monthly cuts, just longer timeline.`
      );
      setActiveChips([
        { id: `extend-${newTimeline}`, label: `Extend to ${newTimeline}mo` },
        { id: `extend-${newTimeline + 1}`, label: `Extend to ${newTimeline + 1}mo` },
        { id: "cancel", label: "Cancel" },
      ]);
      return;
    }

    if (chip.id.startsWith("extend-")) {
      const newMonths = parseInt(chip.id.replace("extend-", ""));
      if (userState?.goal && !isNaN(newMonths)) {
        mutate({
          goal: {
            ...userState.goal,
            timeline: `${newMonths} months`,
            timelineMonths: newMonths,
          },
        });
      }
      storeMemoryDecision("timeline_extended", `Extended goal timeline to ${newMonths} months after falling behind`);
      queueMessage("assistant", `Timeline extended to ${chip.label}. Your pace is now more realistic.`);
      returnToSteadyState();
      return;
    }

    if (chip.id === "catch-up") {
      const response = await callFlowAssist("copy", "progress-catchup", buildProgressActionContext("catch-up"));
      if (response?.message) {
        queueMessage("assistant", response.message);
        if (response.actions.length > 0) applyFlowActions(response.actions);
      } else {
        const preset = lookupPace(selectedPaceId);
        const monthlyCut = parseINR(preset.required_monthly_cut);
        const extraNeeded = Math.round(monthlyCut * 0.2);
        queueMessage("assistant", `To catch up, you need ${formatINR(extraNeeded)} more in cuts this month.`);
      }
      setActiveChips([
        { id: "apply-catchup", label: "Apply suggestions" },
        { id: "rate-spends", label: "Rate spends instead" },
        { id: "cancel", label: "Not now" },
      ]);
      return;
    }

    if (chip.id === "apply-catchup") {
      storeMemoryDecision("catchup_applied", "User applied catch-up budget suggestions after falling behind");
      queueMessage("assistant", "Budget adjusted. You're on the path to catching up!");
      returnToSteadyState();
      return;
    }

    if (chip.id === "change-goal") {
      queueMessage("assistant", "Let's revisit your goal.");
      startGoal();
      return;
    }

    if (chip.id === "back" || chip.id === "cancel") {
      returnToSteadyState();
    }
  };

  const handleProgressOnTrack = (chip: ChatChip) => {
    const preset = lookupPace(selectedPaceId);

    if (chip.id === "automate") {
      const dailyAmount = Math.floor(
        (parseInt(preset.required_monthly_cut.replace(/[₹,k]/g, "")) * 1000) / 30
      );
      queueMessage("assistant", `Set autosave at ₹${dailyAmount}/day to protect current pace?`);
      setActiveChips([
        { id: "confirm-auto", label: `Yes, ₹${dailyAmount}/day` },
        { id: "cancel", label: "Cancel" },
      ]);
      return;
    }

    if (chip.id === "confirm-auto") {
      const dailyAmt = Math.floor(
        (parseInt(preset.required_monthly_cut.replace(/[₹,k]/g, "")) * 1000) / 30
      );
      mutate({
        products: [...(userState?.products || []), {
          type: "autosave" as const,
          amount: dailyAmt,
          frequency: "daily" as const,
          activatedAt: new Date().toISOString(),
          active: true,
        }],
      });
      storeMemoryDecision("autosave_activated", `User set up autosave at ₹${dailyAmt}/day from on-track progress`);
      queueMessage("assistant", "Autosave activated! Your pace is now protected.", "success");
      returnToSteadyState();
      return;
    }

    if (chip.id === "push-harder") {
      queueMessage("assistant", "Want to increase your monthly cuts to finish faster?");
      setActiveChips([
        { id: "increase-cuts", label: "Increase cuts by ₹2k" },
        { id: "cancel", label: "Keep current" },
      ]);
      return;
    }

    if (chip.id === "increase-cuts") {
      queueMessage("assistant", "Increased monthly cuts. You'll reach your goal faster!");
      returnToSteadyState();
      return;
    }

    if (chip.id === "keep-manual" || chip.id === "cancel") {
      queueMessage("assistant", "Keeping things manual. I'll check in regularly.");
      returnToSteadyState();
      return;
    }

    if (chip.id === "adjust-goal") {
      queueMessage("assistant", "Let's adjust your goal.");
      startGoal();
    }
  };

  // ============ LAST MONTH RECAP (from on-track mosaic) ============
  const startRecapFlow = () => {
    setHomeSubflow("recap");
    queueMessage("assistant", "Here's last month at a glance.");
    queueMessage("assistant", "", undefined, {
      type: "budget-summary",
      plan: SPENDING_PLAN_FIXTURE,
    });
    queueMessage("assistant", "", undefined, {
      type: "category-budgets",
      plan: SPENDING_PLAN_FIXTURE,
    });
    setActiveChips([
      { id: "recap-understand", label: "Why is dining so high?" },
      { id: "recap-done", label: "Done" },
    ]);
  };

  const handleRecapChip = (chip: ChatChip) => {
    if (chip.id === "recap-understand") {
      startUnderstandFlow();
      return;
    }
    returnToSteadyState();
  };

  // ============ ROAST ME (from on-track mosaic) ============
  const runRoast = (seed: number) => {
    const voice = userState?.voice ?? "ryan";
    const result = buildRoast(
      {
        lifestyleCategories: profile.lifestyleCategories,
        foodBreakdown: profile.foodBreakdown,
        categoryBudgets: SPENDING_PLAN_FIXTURE.categoryBudgets,
      },
      voice,
      seed,
    );
    queueMessage("assistant", result.text);
    if (result.viz === "summary") {
      queueMessage("assistant", "", undefined, {
        type: "budget-summary",
        plan: SPENDING_PLAN_FIXTURE,
      });
    } else if (result.viz === "categories") {
      queueMessage("assistant", "", undefined, {
        type: "category-budgets",
        plan: SPENDING_PLAN_FIXTURE,
      });
    }
  };

  const startRoastFlow = () => {
    setHomeSubflow("roast");
    setRoastSeed(0);
    runRoast(0);
    setActiveChips([
      { id: "roast-again", label: "Again" },
      { id: "roast-done", label: "Done" },
    ]);
  };

  const handleRoastChip = (chip: ChatChip) => {
    if (chip.id === "roast-again") {
      const next = roastSeed + 1;
      setRoastSeed(next);
      runRoast(next);
      return;
    }
    returnToSteadyState();
  };

  // ============ MOSAIC DISPATCH (on-track "what can Ryan do" cards) ============
  // No user echo bubble: the tapped card already signals intent, and the
  // user→assistant transition would otherwise fire the processing edge glow.
  const handleMosaicSelect = (title: string) => {
    switch (title) {
      case "Can I afford it?":
        startAffordFlow();
        return;
      case "Analyse my spends":
        startRecapFlow();
        return;
      case "Roast me":
        startRoastFlow();
        return;
      case "Make Ryan smarter":
        queueMessage("assistant", "Soon. Keep using me for now — every tap teaches me what to surface next.");
        returnToSteadyState();
        return;
      default:
        returnToSteadyState();
    }
  };

  // ============ UNDERSTAND MY MONEY (Educational flow) ============
  const startUnderstandFlow = () => {
    setHomeSubflow("understand-menu");
    queueMessage("assistant", "Let's break down your money story. What would you like to explore?");
    setActiveChips(toChips(understandMenuChips));
  };

  const handleUnderstandMenu = async (chip: ChatChip) => {
    if (chip.id === "where-money-goes") {
      setHomeSubflow("understand-categories");

      // Build spend overview chart from monthly breakdown
      const monthEntries = Object.entries(profile.monthlyBreakdown)
        .sort(([a], [b]) => a.localeCompare(b));
      const recentMonths = monthEntries.slice(-5);
      const chartData = recentMonths.map(([m, d]) => {
        const date = new Date(m + "-01");
        return { label: formatDateMonth(date), value: d.totalDebits };
      });
      const avgSpend = chartData.length > 0
        ? Math.round(chartData.reduce((s, d) => s + d.value, 0) / chartData.length)
        : 0;
      const latestMonth = recentMonths[recentMonths.length - 1];
      const latestLabel = latestMonth
        ? formatDateMonth(new Date(latestMonth[0] + "-01"))
        : "Recent";
      const latestAmount = latestMonth ? latestMonth[1].totalDebits : 0;
      const pctDiff = avgSpend > 0 ? Math.round(((latestAmount - avgSpend) / avgSpend) * 100) : 0;
      const compText = pctDiff > 0
        ? `${pctDiff}% higher than your monthly average`
        : pctDiff < 0
          ? `${Math.abs(pctDiff)}% lower than your monthly average`
          : "Right at your monthly average";

      addMessage(
        "assistant",
        "You're spending a bit more than you usually do! Your shopping and food expenses are what pushed it up.",
        undefined,
        {
          type: "spend-overview",
          month: latestLabel,
          amount: latestAmount,
          comparisonText: compText,
          chartData,
          average: avgSpend,
          highlightIndex: chartData.length - 1,
        },
      );
      queueMessage("assistant", "Want me to bring out your top spends?");
      setActiveChips([
        { id: "show-top-spends", label: "Yes" },
        { id: "back", label: "Not now" },
      ]);
      return;
    }

    if (chip.id === "my-patterns") {
      setHomeSubflow("understand-patterns");

      const response = await callFlowAssist("copy", "understand-patterns", buildPatternsContext());
      if (response?.message) {
        queueMessage("assistant", response.message);
      } else {
        // Fallback template
        const totalInvested = profile.investmentSummary.totalInvested;
        const months = profile.dataRange.months;
        const investRate = profile.persona.actual_savings_pct;
        const monthEntries = Object.entries(profile.monthlyBreakdown);
        const creditAmounts = monthEntries.map(([, m]) => m.totalCredits);
        const avgCredit = creditAmounts.reduce((s, a) => s + a, 0) / creditAmounts.length;
        const creditVariance = creditAmounts.reduce((s, a) => s + (a - avgCredit) ** 2, 0) / creditAmounts.length;
        const creditCV = avgCredit > 0 ? Math.round(Math.sqrt(creditVariance) / avgCredit * 100) : 0;
        const cashCat = lifestyleCategories.find((c) => c.name.includes("Cash Withdrawal"));
        const topCat = lifestyleCategories[0];

        let patternsText = `YOUR PATTERNS\n\n`;
        patternsText += `Investment machine\n${formatINR(totalInvested)} invested across ${months} months (${investRate} of income)\n\n`;
        patternsText += `Income variability: ~${creditCV}%\n${creditCV > 30 ? "Significant variation - plan for lean months" : "Relatively stable - good for budgeting"}\n\n`;
        patternsText += `Top spend: ${topCat?.name || "Top category"}\n${topCat?.shareOfLifestyle || "?"} of lifestyle spending (${formatINR(topCat?.monthlyAverage || 0)}/month)\n\n`;
        if (cashCat && cashCat.monthlyAverage > 0) {
          patternsText += `Cash withdrawals: ${formatINR(cashCat.monthlyAverage)}/month\n\n`;
        }
        patternsText += `These patterns aren't good or bad - they're just how your money behaves.`;
        queueMessage("assistant", patternsText);
      }
      setActiveChips(toChips(understandDrilldownChips));
      return;
    }

    if (chip.id === "compare") {
      setHomeSubflow("understand-benchmarks");

      const response = await callFlowAssist("copy", "understand-benchmarks", buildBenchmarksContext());
      if (response?.message) {
        queueMessage("assistant", response.message);
      } else {
        // Fallback template
        const savingsRate = parseInt(profile.persona.actual_savings_pct.replace(/[~%]/g, "")) || 0;
        const topCat = lifestyleCategories[0];
        const topCatShare = parseInt(topCat?.shareOfLifestyle?.replace("%", "") || "0");
        const topCatName = topCat?.name || "Top category";
        const totalDebits = Object.values(profile.monthlyBreakdown).reduce((s, m) => s + m.totalDebits, 0);
        const lifestyleTotal = lifestyleCategories.reduce((s, c) => s + c.totalAmount, 0);
        const lifestylePct = totalDebits > 0 ? Math.round((lifestyleTotal / totalDebits) * 100) : 0;

        let benchText = `BENCHMARKS\n\n`;
        benchText += `Savings Rate\nYou: ${savingsRate}% | Avg: 10-15% | Goal: 20%\n→ ${savingsRate >= 20 ? "Excellent! Well above average" : savingsRate >= 10 ? "On par with average" : "Below average - room to grow"}\n\n`;
        benchText += `${topCatName}\nYou: ${topCatShare}% of lifestyle | Typical: 20-30%\n→ ${topCatShare > 30 ? "Higher than typical" : topCatShare > 20 ? "Within normal range" : "Lower than typical (efficient!)"}\n\n`;
        benchText += `Lifestyle vs Income\nYou: ${lifestylePct}% | Avg: 40-60%\n→ ${lifestylePct > 60 ? "High - consider trimming" : lifestylePct > 40 ? "Within normal range" : "Lean lifestyle spending"}\n\n`;
        benchText += `Benchmarks are guides, not rules. What matters is whether you're hitting YOUR goals.`;
        queueMessage("assistant", benchText);
      }
      setActiveChips(toChips(understandDrilldownChips));
      return;
    }

    if (chip.id === "personality") {
      setHomeSubflow("understand-personality");

      const response = await callFlowAssist("copy", "understand-personality", buildPersonalityContext());
      if (response?.message) {
        queueMessage("assistant", response.message);
      } else {
        // Fallback template
        const savingsRate = parseInt(profile.persona.actual_savings_pct.replace(/[~%]/g, "")) || 0;
        const totalInvested = profile.investmentSummary.totalInvested;
        const investPlatforms = Object.keys(profile.investmentSummary.breakdown).length;
        const topCat = lifestyleCategories[0];
        const cashCat = lifestyleCategories.find((c) => c.name.includes("Cash"));

        let personalityLabel = "Balanced Spender";
        let traits: string[] = [];
        let strengths: string[] = [];
        let growthAreas: string[] = [];
        let strategies: string[] = [];

        if (savingsRate > 20 && investPlatforms >= 3) {
          personalityLabel = "Stealth Builder";
          traits = [
            `Invests ${profile.persona.actual_savings_pct} of income automatically`,
            `Uses ${investPlatforms} investment platforms`,
            `${formatINR(totalInvested)} invested total`,
          ];
          strengths = ["Strong savings discipline", "Diversified investment approach"];
          growthAreas = [`${topCat?.name || "Top spend"} could be trimmed`];
          strategies = ["Keep investment automation running", `Optimize ${topCat?.name || "top spend"}`];
        } else if (cashCat && cashCat.monthlyAverage > 10000) {
          personalityLabel = "Cash Operator";
          traits = [`${formatINR(cashCat.monthlyAverage)}/month in ATM withdrawals`];
          strengths = ["Natural spending friction with cash"];
          growthAreas = ["Cash spending is invisible to tracking"];
          strategies = ["Set a weekly ATM limit", "Move one cash category to UPI"];
        } else {
          personalityLabel = profile.wrapped.money_personality_label;
          traits = [`Saves ${profile.persona.actual_savings_pct} of income`, `Top spend: ${topCat?.name || "unknown"}`];
          strengths = [savingsRate > 10 ? "Decent savings rate" : "Awareness of spending"];
          growthAreas = [savingsRate < 15 ? "Savings rate could improve" : "Optimize category spending"];
          strategies = ["Automate savings at month start", `Set budget for ${topCat?.name || "top spend"}`];
        }

        const personalityText =
          `YOUR MONEY PERSONALITY\n\nYou're a "${personalityLabel}"\n\n` +
          `Traits:\n${traits.map((t) => `• ${t}`).join("\n")}\n\n` +
          `Strengths:\n${strengths.map((s) => `+ ${s}`).join("\n")}\n\n` +
          `Growth areas:\n${growthAreas.map((g) => `- ${g}`).join("\n")}\n\n` +
          `Best strategies:\n${strategies.map((s) => `• ${s}`).join("\n")}`;
        queueMessage("assistant", personalityText);
      }
      setActiveChips(toChips(understandActionChips));
    }
  };

  const handleUnderstandCategories = (chip: ChatChip) => {
    if (chip.id === "back") {
      startUnderstandFlow();
      return;
    }

    if (chip.id === "show-top-spends") {
      // Build category breakdown card from real data
      const monthEntries = Object.entries(profile.monthlyBreakdown).sort(([a], [b]) => a.localeCompare(b));
      const latestMonth = monthEntries[monthEntries.length - 1];
      const latestLabel = latestMonth
        ? formatDateMonth(new Date(latestMonth[0] + "-01"))
        : "Recent";
      const latestAmount = latestMonth ? latestMonth[1].totalDebits : 0;
      const topCatName = lifestyleCategories[0]?.name || "Top category";
      const subtext = `Looking good comes at a cost, ${topCatName.toLowerCase().split("(")[0].trim()} was your biggest spend`;

      const categories = lifestyleCategories.slice(0, 5).map((cat) => {
        const shortName = cat.name.replace(/\s*\(.*\)/, "");
        return {
          name: shortName,
          amount: cat.monthlyAverage,
          pct: parseInt(cat.shareOfLifestyle.replace("%", "")) || 0,
          color: CATEGORY_COLORS[cat.name] || CATEGORY_COLORS[shortName] || CATEGORY_COLORS["Miscellaneous"],
          icon: CATEGORY_ICONS[cat.name] || CATEGORY_ICONS[shortName] || CATEGORY_ICONS["Other / Uncategorized"],
        };
      });

      addMessage(
        "assistant",
        "",
        undefined,
        {
          type: "category-breakdown",
          month: latestLabel,
          amount: latestAmount,
          subtext,
          categories,
        },
      );
      setActiveChips(toChips(understandDrilldownChips));
      return;
    }

    if (chip.id === "why-matters") {
      addMessage(
        "assistant",
        "Understanding where your money goes helps you identify opportunities to optimize without sacrificing what you value."
      );
      setActiveChips(toChips(understandDrilldownChips));
      return;
    }

    if (chip.id === "explore-category") {
      queueMessage("assistant", "Let's dive into your Food & Delivery spending.");
      setActiveChips([{ id: "rate-food", label: "Rate Food spends" }, { id: "back", label: "Back" }]);
      return;
    }

    if (chip.id === "see-patterns") {
      setHomeSubflow("understand-patterns");
      handleUnderstandMenu({ id: "my-patterns", label: "My spending patterns" });
      return;
    }

    if (chip.id === "rate-food") {
      queueMessage("assistant", "Let's rate your Food spends to find what's worth it.");
      startWorthFlow();
    }
  };

  const handleUnderstandPatterns = (chip: ChatChip) => {
    if (chip.id === "back") {
      startUnderstandFlow();
      return;
    }

    if (chip.id === "why-matters") {
      addMessage(
        "assistant",
        "Patterns reveal your money habits. Once you know them, you can work with them instead of against them."
      );
      setActiveChips(toChips(understandDrilldownChips));
      return;
    }

    if (chip.id === "see-patterns") {
      queueMessage("assistant", "You're already viewing your patterns!");
      setActiveChips(toChips(understandActionChips));
    }
  };

  const handleUnderstandBenchmarks = (chip: ChatChip) => {
    if (chip.id === "back") {
      startUnderstandFlow();
      return;
    }

    if (chip.id === "why-matters") {
      addMessage(
        "assistant",
        "Benchmarks give context, but your personal goals matter more than averages."
      );
      setActiveChips(toChips(understandDrilldownChips));
    }
  };

  const handleUnderstandPersonality = (chip: ChatChip) => {
    if (chip.id === "apply-strategies") {
      addMessage(
        "assistant",
        "Which strategy would you like to try?\n\n1. Set weekend spending cap\n2. Automate savings before weekend\n3. Plan low-cost weekend"
      );
      setActiveChips([
        { id: "weekend-cap", label: "Set weekend cap" },
        { id: "automate-savings", label: "Automate savings" },
        { id: "plan-weekend", label: "Plan low-cost weekend" },
        { id: "back", label: "Back" },
      ]);
      return;
    }

    if (chip.id === "weekend-cap" || chip.id === "automate-savings" || chip.id === "plan-weekend") {
      queueMessage("assistant", `Great choice! Let's set up: ${chip.label}`);
      returnToSteadyState();
      return;
    }

    if (chip.id === "done-learning") {
      queueMessage("assistant", "Hope that helped! Let me know what else I can do.");
      returnToSteadyState();
      return;
    }

    if (chip.id === "explore-more") {
      startUnderstandFlow();
    }
  };

  const handleTradeoffChip = (chip: ChatChip) => {
    const tradeoffStep = subflowData.tradeoffStep;
    if (tradeoffStep === "treat-choice") {
      if (chip.id === "bucket") {
        startBucketTradeoff();
        return;
      }
      if (chip.id === "cap") {
        addMessage(
          "assistant",
          `I can set a soft cap, but it affects your ${goalDraft.name || profile.goal.goal_name} pace. Choose the tradeoff:`,
        );
        startBucketTradeoff("bucket-2k");
        return;
      }
      if (chip.id === "nudge") {
        queueMessage("assistant", "Done. I'll nudge you before similar spends.");
        returnToSteadyState();
      }
    }

    if (tradeoffStep === "plan-choice") {
      if (chip.id === "add-goal") {
        addMessage(
          "assistant",
          "Got it. I'll fold this into your goal plan and keep you posted.",
        );
        returnToSteadyState();
        return;
      }
      if (chip.id === "reduce") {
        addMessage(
          "assistant",
          "We can reduce elsewhere. Pick one lever to keep the pace.",
        );
        setHomeSubflow("leak-solution");
        setActiveChips(toChips(leakFixChips));
        return;
      }
      if (chip.id === "extend") {
        addMessage(
          "assistant",
          `Okay. Extending the ${goalDraft.name || profile.goal.goal_name} timeline keeps things realistic.`,
        );
        returnToSteadyState();
        return;
      }
    }

    if (tradeoffStep === "bucket-select") {
      setSubflowData((prev) => ({
        ...prev,
        tradeoffRule: chip.id,
        tradeoffStep: "decision",
      }));
      queueMessage("assistant", getTradeoffPrompt(chip.id));
      setActiveChips(toChips(tradeoffChoiceChips));
      return;
    }

    if (tradeoffStep === "decision") {
      const rule =
        profile.tradeoff_rules.bucket_options.find(
          (option) => option.id === subflowData.tradeoffRule,
        ) ?? profile.tradeoff_rules.bucket_options[0];
      if (chip.id === "reduce-elsewhere") {
        queueMessage("assistant", rule.reduce_elsewhere);
      } else {
        queueMessage("assistant", rule.extend_timeline);
      }
      returnToSteadyState();
    }
  };

  // ============ MAIN CHIP HANDLER ============
  const handleChipSelect = (chip: ChatChip) => {
    switch (step) {
      case "goal":
        handleGoalChip(chip);
        break;
      case "budget":
        handleBudgetChip(chip);
        break;
      case "home":
        handleHomeChip(chip);
        break;
    }
  };

  // ============ DEBUG: GOAL QUESTIONNAIRE ============
  const launchGoalQuiz = useCallback(() => {
    clearMsgQueue();
    if (abortRef.current) abortRef.current.abort();
    setGoalQuizActive(false);
    setGoalQuizIndex(0);
    setGoalQuizAnswers({});
    showChatOverlay(false);
    setReviewMessages([
      { id: "gq-user", role: "user", text: "I want to start saving for a goal" },
      { id: "gq-agent", role: "assistant", text: "Let\u2019s set one up. I\u2019ll ask a few quick questions." },
    ]);
    setTimeout(() => setGoalQuizActive(true), 600);
  }, [clearMsgQueue, showChatOverlay]);

  const handleGoalQuizAnswer = useCallback(
    (questionId: string, answer: string) => {
      const wasAlreadyAnswered = !!goalQuizAnswers[questionId];
      setGoalQuizAnswers((prev) => ({ ...prev, [questionId]: answer }));

      if (wasAlreadyAnswered) return;

      const nextIdx = goalQuizIndex + 1;
      if (nextIdx < DBG_GOAL_QUESTIONS.length) {
        setGoalQuizIndex(nextIdx);
      } else {
        setGoalQuizActive(false);
        setReviewMessages((prev) =>
          prev
            ? [
                ...prev,
                {
                  id: `gq-shared-${Date.now()}`,
                  role: "user" as const,
                  text: "Shared my preferences",
                },
                {
                  id: `gq-done-${Date.now()}`,
                  role: "assistant" as const,
                  text: "Got it - let me put together a plan for you.",
                },
              ]
            : prev,
        );
      }
    },
    [goalQuizIndex, goalQuizAnswers],
  );

  // ============ DEBUG CARD PREVIEW ============
  const injectCardPreview = useCallback(
    (card: ChatCardData, prompt: string) => {
      clearMsgQueue();
      if (abortRef.current) abortRef.current.abort();
      showChatOverlay(false);
      setReviewMessages([
        { id: "dbg-user", role: "user", text: prompt },
        { id: "dbg-card", role: "assistant", text: "", card },
      ]);
    },
    [clearMsgQueue, showChatOverlay],
  );

  const openFdSheet = useCallback((card: Extract<ChatCardData, { type: "investment-product" }>) => {
    setFdSheetData(card);
    setFdSelectedAmount(card.amount);
    setFdSheetPhase("entering");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFdSheetPhase("open");
      });
    });
  }, []);

  const confirmFdSetup = useCallback(() => {
    const updater = (msgs: ChatMessage[]) =>
      msgs.map((m) =>
        m.card?.type === "investment-product"
          ? { ...m, card: { ...(m.card as Extract<ChatCardData, { type: "investment-product" }>), amount: fdSelectedAmount, activated: true } }
          : m
      );
    setMessages((prev) => updater(prev));
    setReviewMessages((prev) => (prev ? updater(prev) : prev));
    setFdSheetPhase("entering");
    setTimeout(() => setFdSheetPhase("closed"), 360);
  }, [fdSelectedAmount]);

  // ── Obligation detail sheet handlers ──
  const openObligSheet = useCallback((item: { id: string; payee: string; amount: number; type: string; seenMonths: string; lastPaid: string }) => {
    setObligSheetItem(item);
    setObligEditAmount(obligEditedAmounts[item.id] ?? item.amount);
    setObligSheetPhase("entering");
    requestAnimationFrame(() => { requestAnimationFrame(() => { setObligSheetPhase("open"); }); });
  }, [obligEditedAmounts]);

  const closeObligSheet = useCallback(() => {
    setObligSheetPhase("entering");
    setTimeout(() => setObligSheetPhase("closed"), 360);
  }, []);

  const confirmObligInclude = useCallback(() => {
    if (!obligSheetItem) return;
    setObligSelectedIds((prev) => { const next = new Set(prev); next.add(obligSheetItem.id); return next; });
    setObligEditedAmounts((prev) => ({ ...prev, [obligSheetItem.id]: obligEditAmount }));
    closeObligSheet();
  }, [obligSheetItem, obligEditAmount, closeObligSheet]);

  const confirmObligRemove = useCallback(() => {
    if (!obligSheetItem) return;
    setObligSelectedIds((prev) => { const next = new Set(prev); next.delete(obligSheetItem.id); return next; });
    closeObligSheet();
  }, [obligSheetItem, closeObligSheet]);

  useEffect(() => {
    if (!isHydrated || launchResetDoneRef.current) return;
    launchResetDoneRef.current = true;
    clearMsgQueue();
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setActiveChips([]);
    setHomeSubflow("idle");
    setLocalGoalDraft({});
    setLocalPaceId("balanced");
    setLocalSavingsForGoal(0);
    setSubflowData({});
    setReceiptsOpen(false);
    setDynamicPacePresets(profile.pace_presets);
    setAiMessages([]);
    setIsStreaming(false);
    setSwipeIndex(0);
    setSwipeQueue([]);
    setIsAgentProcessingGlow(false);

    // Only force home for non-preset users - presets define their own currentStep
    if (!personaPreset) {
      mutate({ currentStep: "home" });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  // ============ DRAWER CONTENT ============
  const receiptsDrawer = receiptsOpen ? (
    <div className="space-y-2">
      <p style={{ ...typography.headerH4, color: TEXT_PRIMARY }}>Recent transactions</p>
      {profile.receipts.map((r) => (
        <p key={r.id} style={{ ...typography.caption, color: TEXT_TERTIARY }}>
          {r.time} · {r.category} · {r.amount} {r.merchant && `· ${r.merchant}`}
        </p>
      ))}
    </div>
  ) : null;

  // ============ PINNED GOAL ============
  const activeGoalProduct = userState?.products?.find((product) => product.active);
  const goalAutomationCard = useMemo<Extract<ChatCardData, { type: "investment-product" }> | null>(() => {
    if (!activeGoalProduct || !goalDetail) return null;

    const productType = activeGoalProduct.type === "rd"
      ? "Recurring Deposit"
      : activeGoalProduct.type === "autosave"
        ? "Auto-save"
        : "Fixed Deposit";
    const amount = activeGoalProduct.type === "autosave"
      ? goalDetail.contributionAmount
      : activeGoalProduct.amount;
    const rate = activeGoalProduct.type === "autosave" ? "~4% p.a." : "7.25% p.a.";

    return {
      type: "investment-product",
      productType,
      amount,
      rate,
      tenure: goalDetail.timeline,
      amountOptions: [],
      accountLabel: "Savings xx1234",
      activated: true,
      onArrowTap: activeGoalProduct.type === "rd" ? () => { setRdDetailVisible(true); requestAnimationFrame(() => requestAnimationFrame(() => setRdDetailPhase("open"))); } : undefined,
    };
  }, [activeGoalProduct, goalDetail]);
  const displayedMessages = useMemo(
    () => (reviewMessages ?? messages).map((message) => {
      const card = message.card;

      if (card?.type === "goal-progress") {
        return {
          ...message,
          card: {
            ...card,
            onArrowTap: () => openGoalDetail(card as Extract<ChatCardData, { type: "goal-progress" }>),
          },
        };
      }
      if (card?.type === "investment-product" && !card.activated) {
        return {
          ...message,
          card: {
            ...card,
            onContinue: () => openFdSheet(card as Extract<ChatCardData, { type: "investment-product" }>),
          },
        };
      }
      if (card?.type === "confirm-list") {
        return {
          ...message,
          card: {
            ...card,
            submitted: obligSubmitted,
            onSubmit: (selected: { id: string; amount: number; type: string }[]) => {
              console.log("V2 obligations confirmed:", selected);
              setObligSubmitted(true);
            },
          },
        };
      }
      return card ? { ...message, card } : message;
    }),
    [reviewMessages, messages, openGoalDetail, openFdSheet, openObligSheet, obligSelectedIds, obligEditedAmounts, obligSubmitted]
  );
  const displayedChips = reviewMessages ? [] : activeChips;
  const showChatInput = !reviewMessages && (step === "home" || (step === "goal" && (goalStage === "choice" || goalStage === "destination")));

  // ============ THINKING LABEL ============
  const thinkingLabel = useMemo(() => {
    if (isStreaming) return "Thinking...";

    // Map subflows to contextual labels
    const subflowLabels: Partial<Record<HomeSubflow, string>> = {
      "afford-amount": "Checking if you can afford this...",
      "afford-category": "Checking if you can afford this...",
      "afford-fullpicture": "Checking your budget...",
      "afford-alternatives": "Slicing the numbers...",
      "swipe-rating": "Looking at your spends...",
      "swipe-patterns": "Spotting patterns...",
      "swipe-actions": "Analyzing your habits...",
      "progress-status": "Calculating progress toward your goal...",
      "progress-ahead": "Calculating progress toward your goal...",
      "progress-behind": "Calculating progress toward your goal...",
      "progress-ontrack": "Calculating progress toward your goal...",
      "understand-menu": "Slicing the numbers...",
      "understand-categories": "Looking at your spends...",
      "understand-patterns": "Spotting patterns...",
      "understand-benchmarks": "Checking your budget...",
      "understand-personality": "Analyzing your habits...",
      "leak-insight": "Spotting patterns...",
      "leak-investigate": "Looking at your spends...",
      "leak-solution": "Slicing the numbers...",
      "tradeoff": "Checking your budget...",
    };

    if (homeSubflow !== "idle" && subflowLabels[homeSubflow]) {
      return subflowLabels[homeSubflow]!;
    }

    // Goal stages (only while actively processing, not at rest)
    if (step === "goal" && isStreaming) {
      return "Working out a savings plan...";
    }

    return null;
  }, [isStreaming, homeSubflow, step]);

  // ============ RENDER ============

  const isLocked = chatVisible;

  return (
    <div className="flex h-full flex-col">
      {/* ── Top bar ── */}
      <div className="flex shrink-0 items-center justify-end px-4 py-2">
        <ShadButton
          variant="ghost"
          size="sm"
          onClick={() => window.location.reload()}
        >
          <RotateCw className="size-3.5" />
          Reload
        </ShadButton>
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 items-start justify-center overflow-y-auto px-6 py-4">
        <div className="relative flex items-start justify-center gap-10" style={{ width: "100%", maxWidth: personaPreset ? 720 : 480 }}>
          {/* ── Device column ── */}
          <div style={{ width: 360, flexShrink: 0 }}>
          <div className="relative rounded-[32px] bg-[#1a1a1e] p-[6px] shadow-[0_28px_70px_rgba(0,0,0,0.16),0_6px_18px_rgba(0,0,0,0.05)] ring-1 ring-white/5">
          <div ref={frameRef} className="relative z-10 aspect-[360/780] w-full overflow-hidden rounded-[26px] bg-white">
            {/* ── V3 Onboarding (pre-onboarding users) ── */}
            {!userState?.onboardingComplete && (step === "wrapped" || step === "goal") ? (
              <OnboardingSim
                key={`${userState?.onboardingAaMode ?? "required"}-${userState?.onboardingIntroduceByron ?? true}-${userState?.onboardingGoalRequired ?? true}-${userState?.onboardingByronGatedByAa ?? false}`}
                config={{
                  aaMode: userState?.onboardingAaMode,
                  introduceByron: userState?.onboardingIntroduceByron,
                  goalRequired: userState?.onboardingGoalRequired,
                  byronGatedByAa: userState?.onboardingByronGatedByAa,
                }}
                onComplete={(opts) => {
                  if (opts?.skipGoal) {
                    mutate({
                      onboardingComplete: true,
                      currentStep: "home",
                      goalStage: "choice",
                      goal: null,
                    });
                    return;
                  }
                  mutate({
                    onboardingComplete: true,
                    currentStep: "home",
                    goalStage: "pinned",
                    goal: {
                      name: "Trip to Japan",
                      timeline: "Dec '26",
                      timelineMonths: 8,
                      amount: "\u20b92,00,000",
                      amountNum: 200000,
                      savingsAllocated: 0,
                      paceId: "balanced",
                      createdAt: new Date().toISOString(),
                    },
                  });
                }}
              />
            ) : (
            <>
              {/* ── Pay screen (default landing layer) ── */}
              <div className="absolute inset-0">
                <PayScreen onPillTap={openChatOverlay} pillLabel={userState?.goal ? `Chat with ${userState.voice === "byron" ? "Byron" : "Ryan"}` : undefined} />
              </div>

              {/* ── Chat (full-screen overlay) ── */}
              {chatVisible && (
              <div
                className="absolute inset-0 z-20"
                style={{
                  overflow: "hidden",
                  backgroundColor: BG_PRIMARY,
                  transform: chatScreenPhase === "open" ? "translateY(0%)" : "translateY(100%)",
                  opacity: chatScreenPhase === "open" ? 1 : 0.98,
                  transition: "transform 460ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease-out",
                  willChange: "transform, opacity",
                  pointerEvents: chatScreenPhase === "exiting" ? "none" : "auto",
                }}
              >
                {/* Processing glow */}
                <div
                  className={`pointer-events-none absolute inset-0 z-30 phone-screen-processing-band ${isAgentProcessingGlow ? "is-active" : ""}`}
                  style={{ borderRadius: RADIUS_L }}
                  aria-hidden="true"
                />
                <Chat
                  title="slice"
                  isSheetMinimized={false}
                  sheetTransitionProgress={0}
                  subtitle={`${profile.label}`}
                  messages={displayedMessages}
                  chips={displayedChips}
                  onChipSelect={handleChipSelect}
                  onMosaicSelect={handleMosaicSelect}
                  showInitialPrompt={showInitialScreen}
                  initialScreenVariant={initialScreenVariant}
                  goalSnapshot={goalTrackerGoals[0] ? { name: goalTrackerGoals[0].name, pct: goalTrackerGoals[0].pct, saved: goalTrackerGoals[0].saved, target: goalTrackerGoals[0].target, status: goalTrackerGoals[0].status, daysLabel: goalTrackerGoals[0].daysLabel } : undefined}
                  voice={userState?.voice ?? "ryan"}
                  onVoiceChange={(v) => {
                    mutate({ voice: v });
                    // Reset conversation when voice changes
                    setMessages([]);
                    setReviewMessages(null);
                    setShowInitialScreen(true);
                  }}
                  initialSuggestions={getSuggestions(!!userState?.goal)}
                  onInitialSuggestionClick={(id, title) => {
                    if (id === "review-goal") {
                      openGoalReviewShortcut(title);
                    } else {
                      setReviewMessages(null);
                      setShowInitialScreen(false);
                      handleChipSelect({ id, label: title });
                    }
                  }}
                  showInput={showChatInput}
                  inputPlaceholder={undefined as unknown as string}
                  onSubmit={(value) => {
                    setReviewMessages(null);
                    setShowInitialScreen(false);

                    if (step === "home") {
                      handleChatSubmit(value);
                    } else {
                      handleGoalInput(value);
                    }
                  }}
                  onProcessingStateChange={setIsAgentProcessingGlow}

                  showTyping={isStreaming}
                  thinkingLabel={thinkingLabel}
                  drawerContent={receiptsDrawer}
                  pinnedContent={null}
                  headerActions={[
                    {
                      id: "receipts",
                      label: "Receipts",
                      onClick: () => setReceiptsOpen((prev) => !prev),
                      active: receiptsOpen,
                    },
                  ]}
                  onSheetClose={closeChatOverlay}
                  onSheetExpand={() => {}}
                  appBarDragHandleProps={{}}
                  goalTrailingSlot={
                    goalTrackerGoals.length > 0 ? (
                      <GoalTracker
                        goals={goalTrackerGoals}
                        singleVariant="pct"
                        onGoalTap={(goal) => {
                          openGoalDetail({
                            type: "goal-progress",
                            name: goal.name,
                            pct: goal.pct,
                            saved: goal.saved,
                            target: goal.target,
                            daysLabel: goal.daysLabel,
                            status: goal.status,
                          });
                        }}
                        onGoalListOpen={() => {
                          setGoalListOpen(true);
                          requestAnimationFrame(() => requestAnimationFrame(() => setGoalListPhase("open")));
                        }}
                      />
                    ) : undefined
                  }
                  goalPlanBuilder={
                    goalPlanVisible ? (
                      <PlanMode
                        steps={goalPlanSteps}
                        visible={goalPlanVisible}
                        completed={goalPlanCompleted}
                      />
                    ) : undefined
                  }
                  questionnaireOverlay={
                    goalQuizActive ? (
                      <QuestionnaireOverlay
                        questions={DBG_GOAL_QUESTIONS}
                        currentIndex={goalQuizIndex}
                        answers={goalQuizAnswers}
                        onSelectOption={(qId, opt) => handleGoalQuizAnswer(qId, opt.id)}
                        onSubmitFreeText={(qId, text) => handleGoalQuizAnswer(qId, text)}
                        onNavigate={(dir) => {
                          setGoalQuizIndex((i) =>
                            dir === "prev"
                              ? Math.max(0, i - 1)
                              : Math.min(DBG_GOAL_QUESTIONS.length - 1, i + 1),
                          );
                        }}
                        onClose={() => setGoalQuizActive(false)}
                      />
                    ) : undefined
                  }
                />
              </div>
              )}

              {/* ── FD Setup bottom sheet ── */}
              {fdSheetPhase !== "closed" && fdSheetData && (
                <div
                  className="absolute inset-0 z-30"
                  style={{
                    backgroundColor: fdSheetPhase === "open" ? ALPHA_BLACK_40 : "rgba(0,0,0,0)",
                    transition: "background-color 300ms ease",
                  }}
                  onClick={() => {
                    setFdSheetPhase("entering");
                    setTimeout(() => setFdSheetPhase("closed"), 360);
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: BG_PRIMARY,
                      borderRadius: "24px 24px 0 0",
                      padding: "16px 24px 40px",
                      transform: fdSheetPhase === "open" ? "translateY(0)" : "translateY(100%)",
                      transition: "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Handle */}
                    <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: ALPHA_BLACK_20, margin: "0 auto 24px" }} />

                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                      <p style={{ ...typography.headerH4, color: TEXT_PRIMARY }}>
                        Set up {fdSheetData.productType}
                      </p>
                      <button
                        type="button"
                        onClick={() => { setFdSheetPhase("entering"); setTimeout(() => setFdSheetPhase("closed"), 360); }}
                        style={{ border: "none", background: "transparent", padding: "4px", cursor: "pointer", color: ALPHA_BLACK_30, ...typography.buttonSmall }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Amount label */}
                    <p style={{ ...typography.metadata, textTransform: "uppercase", color: ALPHA_BLACK_30, marginBottom: 8 }}>
                      AMOUNT
                    </p>

                    {/* Amount chips */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
                      {fdSheetData.amountOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFdSelectedAmount(opt.value)}
                          style={{
                            ...typography.bodySmall,
                            padding: "8px 16px",
                            borderRadius: RADIUS_PILL,
                            border: fdSelectedAmount === opt.value ? `1px solid ${VALENTINO_500}` : `1px solid ${ALPHA_BLACK_20}`,
                            color: TEXT_PRIMARY,
                            backgroundColor: fdSelectedAmount === opt.value ? VALENTINO_50 : BG_PRIMARY,
                            cursor: "pointer",
                            transition: "all 150ms ease",
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Rate + Tenure */}
                    <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
                      <div>
                        <p style={{ ...typography.metadata, textTransform: "uppercase", color: ALPHA_BLACK_30, marginBottom: 4 }}>RATE</p>
                        <p style={{ ...typography.buttonSmall, color: GREEN_500 }}>{fdSheetData.rate}</p>
                      </div>
                      <div>
                        <p style={{ ...typography.metadata, textTransform: "uppercase", color: ALPHA_BLACK_30, marginBottom: 4 }}>TENURE</p>
                        <p style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{fdSheetData.tenure}</p>
                      </div>
                    </div>

                    {/* Paying from */}
                    <p style={{ ...typography.metadata, textTransform: "uppercase", color: ALPHA_BLACK_30, marginBottom: 4 }}>
                      PAYING FROM
                    </p>
                    <p style={{ ...typography.buttonSmall, color: TEXT_SECONDARY, marginBottom: 24 }}>
                      {fdSheetData.accountLabel}
                    </p>

                    {/* CTA */}
                    <button
                      type="button"
                      onClick={confirmFdSetup}
                      style={{
                        ...typography.buttonNormal,
                        width: "100%",
                        padding: "12px 24px",
                        borderRadius: RADIUS_CIRCLE,
                        backgroundColor: VALENTINO_500,
                        color: BG_PRIMARY,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Set up · {formatINR(fdSelectedAmount)}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Obligation detail bottom sheet ── */}
              {obligSheetPhase !== "closed" && obligSheetItem && (
                <div
                  className="absolute inset-0 z-30"
                  style={{
                    backgroundColor: obligSheetPhase === "open" ? ALPHA_BLACK_40 : "rgba(0,0,0,0)",
                    transition: "background-color 300ms ease",
                  }}
                  onClick={closeObligSheet}
                >
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: BG_PRIMARY,
                      borderRadius: "24px 24px 0 0",
                      padding: "16px 24px 40px",
                      transform: obligSheetPhase === "open" ? "translateY(0)" : "translateY(100%)",
                      transition: "transform 360ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Handle */}
                    <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: ALPHA_BLACK_20, margin: "0 auto 24px" }} />

                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                      <p style={{ ...typography.headerH3, color: TEXT_PRIMARY, margin: 0 }}>
                        {obligSheetItem.payee}
                      </p>
                      <button
                        type="button"
                        onClick={closeObligSheet}
                        style={{ border: "none", background: "transparent", padding: "4px", cursor: "pointer", color: ALPHA_BLACK_30, ...typography.buttonSmall }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Type tag */}
                    <div style={{ marginBottom: 24 }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: RADIUS_CIRCLE,
                          backgroundColor: obligSheetItem.type === "Rent/EMI" ? BG_SECONDARY : obligSheetItem.type === "Subscription" ? BLUE_50 : obligSheetItem.type === "Utility" ? BLUE_50 : VALENTINO_50,
                          color: obligSheetItem.type === "Rent/EMI" ? SLATE_800 : obligSheetItem.type === "Subscription" ? BLUE_500 : obligSheetItem.type === "Utility" ? BLUE_500 : VALENTINO_500,
                          ...typography.metadata,
                          textTransform: "uppercase",
                        }}
                      >
                        {obligSheetItem.type}
                      </span>
                    </div>

                    {/* Details grid */}
                    <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
                      <div>
                        <p style={{ ...typography.metadata, textTransform: "uppercase", color: ALPHA_BLACK_30, marginBottom: 4, margin: 0 }}>AVERAGE</p>
                        <p style={{ ...typography.headerH4, color: TEXT_PRIMARY, margin: 0 }}>{formatINR(obligSheetItem.amount)}</p>
                      </div>
                      <div>
                        <p style={{ ...typography.metadata, textTransform: "uppercase", color: ALPHA_BLACK_30, marginBottom: 4, margin: 0 }}>FREQUENCY</p>
                        <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY, margin: 0 }}>{obligSheetItem.seenMonths}</p>
                      </div>
                      <div>
                        <p style={{ ...typography.metadata, textTransform: "uppercase", color: ALPHA_BLACK_30, marginBottom: 4, margin: 0 }}>LAST PAID</p>
                        <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY, margin: 0 }}>{obligSheetItem.lastPaid}</p>
                      </div>
                    </div>

                    {/* Editable amount */}
                    <p style={{ ...typography.metadata, textTransform: "uppercase", color: ALPHA_BLACK_30, marginBottom: 8, margin: "0 0 8px" }}>
                      USE AMOUNT
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32, borderBottom: `2px solid ${VALENTINO_500}`, height: 48 }}>
                      <span style={{ ...typography.headerH4, color: TEXT_PRIMARY }}>₹</span>
                      <input
                        type="number"
                        value={obligEditAmount || ""}
                        onChange={(e) => setObligEditAmount(Number(e.target.value) || 0)}
                        style={{
                          ...typography.headerH4,
                          color: TEXT_PRIMARY,
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          width: "100%",
                          height: 48,
                          padding: 0,
                        }}
                      />
                    </div>

                    {/* Action buttons - DLS Primary + Grey, Regular 48px */}
                    <div style={{ display: "flex", gap: 12 }}>
                      <button
                        type="button"
                        onClick={confirmObligInclude}
                        style={{
                          ...typography.buttonNormal,
                          flex: 1,
                          height: 48,
                          padding: "0 24px",
                          borderRadius: RADIUS_CIRCLE,
                          backgroundColor: VALENTINO_500,
                          color: BG_PRIMARY,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Include {formatINR(obligEditAmount)}
                      </button>
                      <button
                        type="button"
                        onClick={confirmObligRemove}
                        style={{
                          ...typography.buttonNormal,
                          flex: 1,
                          height: 48,
                          padding: "0 24px",
                          borderRadius: RADIUS_CIRCLE,
                          backgroundColor: SLATE_30,
                          color: TEXT_PRIMARY,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Goals List screen (push right-to-left navigation) ── */}
              {goalListOpen && (
                <div
                  className="absolute inset-0 z-40"
                  style={{
                    transform: goalListPhase === "open" ? "translateX(0%)" : goalListPhase === "exiting" ? "translateX(100%)" : "translateX(100%)",
                    transition: "transform 350ms cubic-bezier(0.22, 1, 0.36, 1)",
                    willChange: "transform",
                    pointerEvents: goalListPhase === "exiting" ? "none" : "auto",
                  }}
                  onTransitionEnd={() => {
                    if (goalListPhase === "exiting") {
                      setGoalListOpen(false);
                      setGoalListPhase("closed");
                    }
                  }}
                >
                  <GoalListScreen
                    goals={goalTrackerGoals}
                    onGoalTap={(goal) => {
                      setPotDetail({
                        name: goal.name,
                        saved: goal.saved,
                        target: goal.target,
                        pct: goal.pct,
                        status: goal.status,
                        daysLabel: goal.daysLabel,
                        icon: goal.heroEmoji || goal.icon,
                        heroScene: goal.heroScene,
                      });
                      requestAnimationFrame(() => requestAnimationFrame(() => setPotDetailPhase("open")));
                    }}
                    onClose={() => setGoalListPhase("exiting")}
                  />
                </div>
              )}

              {/* ── Pot / Stash Detail screen (push right-to-left) ── */}
              {potDetail && (
                <div
                  className="absolute inset-0 z-50"
                  style={{
                    transform: potDetailPhase === "open" ? "translateX(0%)" : "translateX(100%)",
                    transition: "transform 350ms cubic-bezier(0.22, 1, 0.36, 1)",
                    willChange: "transform",
                    pointerEvents: potDetailPhase === "exiting" ? "none" : "auto",
                    backgroundColor: BG_PRIMARY,
                  }}
                  onTransitionEnd={() => {
                    if (potDetailPhase === "exiting") {
                      setPotDetail(null);
                      setPotDetailPhase("closed");
                    }
                  }}
                >
                  <PotDetail
                    name={potDetail.name}
                    saved={potDetail.saved}
                    target={potDetail.target}
                    pct={potDetail.pct}
                    status={potDetail.status}
                    daysLabel={potDetail.daysLabel}
                    icon={potDetail.icon}
                    heroScene={potDetail.heroScene}
                    onBack={() => setPotDetailPhase("exiting")}
                  />
                </div>
              )}

              {/* ── Goal Detail screen (push right-to-left) ── */}
              {goalDetail && (
                <div
                  className="absolute inset-0 z-40"
                  style={{
                    backgroundColor: BG_PRIMARY,
                    display: "flex",
                    flexDirection: "column",
                    transform: goalDetailPhase === "open" ? "translateX(0%)" : "translateX(100%)",
                    transition: "transform 350ms cubic-bezier(0.22, 1, 0.36, 1)",
                    willChange: "transform",
                    pointerEvents: goalDetailPhase === "exiting" ? "none" : "auto",
                  }}
                  onTransitionEnd={() => {
                    if (goalDetailPhase === "exiting") {
                      setGoalDetail(null);
                      setGoalDetailPhase("closed");
                    }
                  }}
                >
                  <AppBar
                    title="Goal"
                    leading={<NavButton kind="back" onClick={() => setGoalDetailPhase("exiting")} ariaLabel="Back" />}
                  />

                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: "28px 24px",
                      paddingBottom: BOTTOM_INSET + 32,
                      display: "flex",
                      flexDirection: "column",
                      gap: 32,
                    }}
                  >
                    {/* ── Name + target ── */}
                    <div>
                      <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, marginBottom: 4 }}>
                        {goalDetail.name}
                      </p>
                    </div>

                    {/* ── Progress ── */}
                    <div>
                      {/* Bar */}
                      <div style={{ height: 12, backgroundColor: OUTLINE_SUBTLE, borderRadius: RADIUS_CIRCLE, overflow: "hidden", marginBottom: 16 }}>
                        <div
                          style={{
                            width: `${Math.min(goalDetail.pct, 100)}%`,
                            height: "100%",
                            backgroundColor: VALENTINO_500,
                            borderRadius: RADIUS_CIRCLE,
                          }}
                        />
                      </div>

                      {/* Progress summary */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                        <span style={{ ...typography.bodySmall, color: TEXT_TERTIARY }}>
                          {formatINR(goalDetail.saved)} / {formatINR(goalDetail.target)}
                        </span>
                        <span style={{ ...typography.headerH2, color: "rgba(0,0,0,0.88)" }}>
                          {goalDetail.pct}%
                        </span>
                      </div>

                      {/* Status pill */}
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 8px",
                          borderRadius: RADIUS_CIRCLE,
                          backgroundColor: goalDetail.status === "ahead"
                            ? GREEN_50
                            : goalDetail.status === "behind"
                              ? RED_50
                              : ORANGE_50,
                        }}
                      >
                        <span
                          style={{
                            ...typography.metadata,
                            textTransform: "uppercase",
                            color: goalDetail.status === "ahead"
                              ? GREEN_500
                              : goalDetail.status === "behind"
                                ? RED_500
                                : ORANGE_500,
                          }}
                        >
                          {goalDetail.daysLabel}
                        </span>
                      </div>
                    </div>

                    {goalAutomationCard ? (
                      <div>
                        <ChatCard card={goalAutomationCard} />
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* ── RD Detail screen (push right-to-left) ── */}
              {rdDetailVisible && (
                <div
                  className="absolute inset-0 z-50"
                  style={{
                    backgroundColor: BG_PRIMARY,
                    display: "flex",
                    flexDirection: "column",
                    transform: rdDetailPhase === "open" ? "translateX(0%)" : "translateX(100%)",
                    transition: "transform 350ms cubic-bezier(0.22, 1, 0.36, 1)",
                    willChange: "transform",
                    pointerEvents: rdDetailPhase === "exiting" ? "none" : "auto",
                  }}
                  onTransitionEnd={() => {
                    if (rdDetailPhase === "exiting") {
                      setRdDetailVisible(false);
                      setRdDetailPhase("closed");
                    }
                  }}
                >
                  <AppBar
                    title="Recurring Deposit"
                    leading={<NavButton kind="back" onClick={() => setRdDetailPhase("exiting")} ariaLabel="Back" />}
                  />

                  {/* Content */}
                  <div
                    style={{
                      padding: "24px 24px",
                      paddingBottom: BOTTOM_INSET + 24,
                      display: "flex",
                      flexDirection: "column",
                      gap: 24,
                    }}
                  >
                    <div>
                      <p style={{ ...typography.caption, color: TEXT_TERTIARY, textTransform: "uppercase", marginBottom: 8 }}>Monthly amount</p>
                      <p style={{ ...typography.headerH1, color: TEXT_PRIMARY }}>
                        {userState?.products?.find((p) => p.type === "rd")
                          ? formatINR(userState.products.find((p) => p.type === "rd")!.amount)
                          : "-"}/month
                      </p>
                    </div>
                    <div style={{ height: 1, backgroundColor: OUTLINE_SUBTLE }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ ...typography.bodySmall, color: TEXT_TERTIARY }}>Rate</span>
                        <span style={{ ...typography.buttonSmall, color: GREEN_500 }}>7.25% p.a.</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ ...typography.bodySmall, color: TEXT_TERTIARY }}>Tenure</span>
                        <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{userState?.goal?.timeline ?? "-"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ ...typography.bodySmall, color: TEXT_TERTIARY }}>Paying from</span>
                        <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>Savings xx1234</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ ...typography.bodySmall, color: TEXT_TERTIARY }}>Status</span>
                        <span style={{ ...typography.buttonSmall, color: GREEN_500 }}>Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
            )}
          </div>
          </div>
        </div>{/* /device column */}

        {/* ── Control panel (right side) ── */}
        {personaPreset && (
          <div className="w-[280px] shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{personaPreset?.label}</CardTitle>
                <CardDescription>{personaPreset?.description}</CardDescription>
              </CardHeader>

              {hasControls && (
              <CardContent className="flex flex-col gap-5">
                {personaPreset?.controls?.map((group, gi) => {
                  const activeIdx = activeSubstates[group.label] ?? 0;
                  const activeId = group.substates[activeIdx]?.id ?? group.substates[0]?.id;
                  return (
                    <div key={group.label}>
                      {gi > 0 && <Separator className="mb-5" />}
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">{group.label}</Label>
                          {isLocked && <Lock className="size-3 text-muted-foreground" />}
                        </div>
                        <ToggleGroup
                          type="single"
                          value={activeId}
                          disabled={isLocked}
                          onValueChange={(val) => {
                            if (!val || isLocked) return;
                            const idx = group.substates.findIndex((s) => s.id === val);
                            if (idx >= 0) handleSubstateChange(group.label, idx);
                          }}
                          variant="outline"
                          size="sm"
                          className="justify-start flex-wrap"
                        >
                          {group.substates.map((s) => (
                            <ToggleGroupItem
                              key={s.id}
                              value={s.id}
                              className="text-xs"
                            >
                              {s.label}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </div>
                    </div>
                  );
                })}

                {isLocked && (
                  <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                    <Lock className="size-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Hit reload to change state
                    </p>
                  </div>
                )}
              </CardContent>
              )}
            </Card>
          </div>
        )}

        </div>
      </div>
    </div>
  );
}
