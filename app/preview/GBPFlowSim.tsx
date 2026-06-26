"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { typography } from "../lib/typography";
import {
  CHAT_USER_BUBBLE,
  OUTLINE_SUBTLE,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY,
  BG_PRIMARY, BG_SECONDARY,
} from "../lib/colors";
import { RADIUS_PILL } from "../lib/radii";
import { SPACE_XS, SPACE_S, SPACE_M, SPACE_L } from "../lib/spacing";
import { StatusBar, ChatAppBar } from "../components/AppChrome";
import { useTypewriter } from "../components/Chat";
import QuestionnaireOverlay from "../components/QuestionnaireOverlay";
import ChatCard from "../components/ChatCards";
import BudgetSummaryViz from "../components/BudgetSummaryViz";
import CategoryBudgetsViz from "../components/CategoryBudgetsViz";
import { highlightValues } from "../lib/chat-highlight";
import { SAVINGS_TIER_QUESTION } from "./fixtures/savingsTierQuestion";
import type { SimMessage } from "./fixtures/savingsFlowFixture";
import type { LadderTier, GoalStageId } from "../lib/types";
import {
  BUCKET_CONFIRM_LIST,
  LADDER_OPTIONS,
  SPENDING_PLAN_FIXTURE,
  STORY1_GOAL_SETUP,
  STORY1_LADDER_INTRO,
  STORY1_LADDER_PICKED,
  STORY1_BUCKET_INCOME,
  STORY1_BUCKET_INCOME_CONFIRMED,
  STORY1_BUCKET_OBLIGATIONS,
  STORY1_BUCKET_OBLIGATIONS_CONFIRMED,
  STORY1_BUCKET_P2P,
  STORY1_BUCKET_P2P_CONFIRMED,
  STORY1_BUCKET_SPORADIC,
  STORY1_BUCKET_SPORADIC_CONFIRMED,
  STORY1_SPENDING_PLAN,
  STORY1_VERDICT_FEASIBLE,
  STORY1_LOCK_IN,
  STORY2_ENTRY,
  STORY3_ENTRY,
  STORY3_MERGE_OFFER,
  STORY4_ENTRY,
  STORY5_ENTRY,
  STORY6_ENTRY,
  DESTINATION_CHIPS,
  LOCK_IN_CHIPS,
  INFEASIBLE_CHIPS,
  MERGE_CHIPS,
  type GBPStory,
  STORY_LABELS,
} from "./fixtures/gbpFlowFixture";

// ── Flow phases ─────────────────────────────────────────────────

type Phase =
  | "entry"              // Initial user message + system response
  | "destination-pick"   // Goal vs Pool (vague intent)
  | "ladder"             // Savings ladder (vague intent)
  | "footprint-walk"     // 5 buckets, one at a time
  | "spending-plan"      // Summary + category budgets
  | "verdict"            // Verdict banner
  | "lock-in"            // Confirmation
  | "done"               // Locked in
  | "blocked";           // Impossible / cap reached

// ── DEV: jump-to-stage seeding ──────────────────────────────────
// Lets the New-user "Skip to → Goal: <stage>" controls boot GBPFlowSim straight into a stage with
// the right accumulated transcript + UI, instead of replaying the script from the top. The history
// is composed from the SAME fixtures the live script plays, so it can't drift out of sync.

type StageSeed = {
  messages: SimMessage[];
  phase: Phase;
  showChips: boolean;
  activeChips: { id: string; label: string }[];
  chipsAnchorId: string | null;
  showLadder: boolean;
  showBucket: boolean;
  activeBucketIndex: number;
  bucketAnchorId: string | null;
  showBudgetSummary: boolean;
  showCategoryBudgets: boolean;
  planAnchorId: string | null;
};

// User confirmation echo for a bucket — mirrors handleBucketConfirm's "₹X label, looks right".
function bucketEcho(idx: number): SimMessage {
  const card = BUCKET_CONFIRM_LIST[idx];
  const total = card.type === "confirm-list" ? card.items.reduce((s, it) => s + it.amount, 0) : 0;
  const label = card.type === "confirm-list" ? (card.label ?? "") : "";
  return { id: `u-bucket-${idx}`, role: "user", text: `₹${total.toLocaleString("en-IN")} ${label.toLowerCase()}, looks right` };
}

// Cumulative transcript through the full footprint walk + the spending-plan message.
const HISTORY_THROUGH_PLAN: SimMessage[] = [
  ...STORY1_GOAL_SETUP, ...STORY1_LADDER_INTRO, ...STORY1_LADDER_PICKED,
  ...STORY1_BUCKET_INCOME, bucketEcho(0), ...STORY1_BUCKET_INCOME_CONFIRMED,
  ...STORY1_BUCKET_OBLIGATIONS, bucketEcho(1), ...STORY1_BUCKET_OBLIGATIONS_CONFIRMED,
  ...STORY1_BUCKET_P2P, bucketEcho(2), ...STORY1_BUCKET_P2P_CONFIRMED,
  ...STORY1_BUCKET_SPORADIC, bucketEcho(3), ...STORY1_BUCKET_SPORADIC_CONFIRMED,
  ...STORY1_SPENDING_PLAN,
];
const PLAN_ANCHOR = STORY1_SPENDING_PLAN[0].id;

function buildStageSeed(stage: GoalStageId): StageSeed {
  const base: StageSeed = {
    messages: [], phase: "entry",
    showChips: false, activeChips: [], chipsAnchorId: null,
    showLadder: false,
    showBucket: false, activeBucketIndex: 0, bucketAnchorId: null,
    showBudgetSummary: false, showCategoryBudgets: false, planAnchorId: null,
  };
  switch (stage) {
    case "intent":
      return { ...base, messages: STORY1_GOAL_SETUP, phase: "destination-pick",
        showChips: true, activeChips: DESTINATION_CHIPS, chipsAnchorId: STORY1_GOAL_SETUP[1].id };
    case "tier":
      return { ...base, messages: [...STORY1_GOAL_SETUP, ...STORY1_LADDER_INTRO], phase: "ladder", showLadder: true };
    case "footprint":
      return { ...base, messages: [...STORY1_GOAL_SETUP, ...STORY1_LADDER_INTRO, ...STORY1_LADDER_PICKED, ...STORY1_BUCKET_INCOME],
        phase: "footprint-walk", showBucket: true, activeBucketIndex: 0, bucketAnchorId: STORY1_BUCKET_INCOME[0].id };
    case "spending-plan":
      return { ...base, messages: HISTORY_THROUGH_PLAN, phase: "spending-plan",
        showBudgetSummary: true, showCategoryBudgets: true, planAnchorId: PLAN_ANCHOR };
    case "verdict":
      return { ...base, messages: [...HISTORY_THROUGH_PLAN, ...STORY1_VERDICT_FEASIBLE], phase: "verdict",
        showBudgetSummary: true, showCategoryBudgets: true, planAnchorId: PLAN_ANCHOR,
        showChips: true, activeChips: LOCK_IN_CHIPS, chipsAnchorId: STORY1_VERDICT_FEASIBLE[0].id };
    case "done":
      return { ...base, messages: [...HISTORY_THROUGH_PLAN, ...STORY1_VERDICT_FEASIBLE, ...STORY1_LOCK_IN], phase: "done",
        showBudgetSummary: true, showCategoryBudgets: true, planAnchorId: PLAN_ANCHOR };
  }
}

// ── Bubble ──────────────────────────────────────────────────────

function Bubble({
  msg,
  typewrite = false,
  onStreamComplete,
}: {
  msg: SimMessage;
  typewrite?: boolean;
  onStreamComplete?: () => void;
}) {
  const active = typewrite && msg.role === "assistant";
  const streamed = useTypewriter(msg.text, active, active ? onStreamComplete : undefined);
  const text = active ? streamed : msg.text;

  if (msg.role === "user") {
    return (
      <div className="flex flex-col items-end animate-chat-message-in">
        <div
          className="max-w-[75%] rounded-[16px] rounded-tr-lg"
          style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px" }}
        >
          <p className="whitespace-pre-line" style={{ ...typography.bodySmall, color: TEXT_PRIMARY, margin: 0 }}>
            {msg.text}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start animate-chat-message-in">
      <p className="whitespace-pre-line w-full" style={{ ...typography.bodySmall, color: TEXT_PRIMARY, margin: 0 }}>
        {highlightValues(text)}
      </p>
    </div>
  );
}

// ── Chip list ───────────────────────────────────────────────────

function ChipList({
  chips,
  onSelect,
}: {
  chips: { id: string; label: string }[];
  onSelect: (chip: { id: string; label: string }) => void;
}) {
  return (
    <div className="flex flex-wrap" style={{ gap: SPACE_S, paddingTop: SPACE_XS }}>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onSelect(chip)}
          className="transition-transform active:scale-[0.97]"
          style={{
            ...typography.buttonSmall,
            color: TEXT_PRIMARY,
            backgroundColor: BG_SECONDARY,
            border: `1px solid ${OUTLINE_SUBTLE}`,
            borderRadius: RADIUS_PILL,
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

// ── Thinking indicator ──────────────────────────────────────────

function ThinkingIndicator() {
  return (
    <div className="flex items-center" style={{ gap: 8, paddingTop: 4, paddingBottom: 4 }}>
      <p className="animate-thinking-pulse" style={{ ...typography.bodySmall, color: TEXT_TERTIARY, margin: 0 }}>
        Thinking…
      </p>
    </div>
  );
}

// ── Floating AppBar — delegates to DLS ChatAppBar ────────────────

function FloatingAppBar({ onClose }: { onClose?: () => void }) {
  return <ChatAppBar absolute variant="firstTime" voice="ryan" navKind="close" onNav={onClose} />;
}

// ── Main simulation ─────────────────────────────────────────────

export default function GBPFlowSim({ story = "clean-start", bootStage, onClose }: { story?: GBPStory; bootStage?: GoalStageId; onClose?: () => void }) {
  const [messages, setMessages] = useState<SimMessage[]>([]);
  // Count of pre-seeded messages on a jump-boot — those render instantly (no typewriter); messages
  // added afterwards by the live handlers still type out.
  const [seedCount, setSeedCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("entry");
  const [showThinking, setShowThinking] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const [activeChips, setActiveChips] = useState<{ id: string; label: string }[]>([]);
  const [ladderSelected, setLadderSelected] = useState<LadderTier | null>(null);
  const [showLadder, setShowLadder] = useState(false);
  const [activeBucketIndex, setActiveBucketIndex] = useState(0);
  const [showBucket, setShowBucket] = useState(false);
  const [showBudgetSummary, setShowBudgetSummary] = useState(false);
  const [showCategoryBudgets, setShowCategoryBudgets] = useState(false);
  const [streamedIds, setStreamedIds] = useState<Set<string>>(new Set());

  // Anchor ids for streaming-gated UI: each element is tied to the assistant
  // message that must finish streaming before it appears. Once streamed, the
  // gate latches open and the element stays mounted even if a new Ryan message
  // starts streaming below.
  const [chipsAnchorId, setChipsAnchorId] = useState<string | null>(null);
  const [bucketAnchorId, setBucketAnchorId] = useState<string | null>(null);
  const [budgetSummaryAnchorId, setBudgetSummaryAnchorId] = useState<string | null>(null);
  const [categoryBudgetsAnchorId, setCategoryBudgetsAnchorId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const didBootRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    });
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay);
    timersRef.current.push(t);
    return t;
  }, []);

  const addMessages = useCallback((msgs: SimMessage[]) => {
    setMessages((prev) => [...prev, ...msgs]);
    scrollToBottom();
  }, [scrollToBottom]);

  // When a new message arrives, any previously-streaming assistant message
  // snaps to its full text (Bubble's typewrite=true only applies to the last
  // message). Mark all non-last assistant messages as streamed so anchored
  // UI tied to them isn't left waiting on an onComplete that will never fire.
  useEffect(() => {
    if (messages.length <= 1) return;
    setStreamedIds((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (let i = 0; i < messages.length - 1; i++) {
        const m = messages[i];
        if (m.role === "assistant" && !next.has(m.id)) {
          next.add(m.id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [messages]);

  // ── Reset on story change ────────────────────────────────────
  useEffect(() => {
    // Clean up timers
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];

    setMessages([]);
    setSeedCount(0);
    setPhase("entry");
    setShowThinking(false);
    setShowChips(false);
    setActiveChips([]);
    setLadderSelected(null);
    setShowLadder(false);
    setActiveBucketIndex(0);
    setShowBucket(false);
    setShowBudgetSummary(false);
    setShowCategoryBudgets(false);
    setStreamedIds(new Set());
    setChipsAnchorId(null);
    setBucketAnchorId(null);
    setBudgetSummaryAnchorId(null);
    setCategoryBudgetsAnchorId(null);
    didBootRef.current = false;
  }, [story]);

  // ── Boot sequence ────────────────────────────────────────────
  useEffect(() => {
    if (didBootRef.current) return;
    didBootRef.current = true;

    // DEV jump: seed straight into a goal-creation stage (transcript + UI already in place).
    if (bootStage) {
      const seed = buildStageSeed(bootStage);
      setMessages(seed.messages);
      setSeedCount(seed.messages.length);
      setPhase(seed.phase);
      setShowChips(seed.showChips);
      setActiveChips(seed.activeChips);
      setChipsAnchorId(seed.chipsAnchorId);
      setShowLadder(seed.showLadder);
      setShowBucket(seed.showBucket);
      setActiveBucketIndex(seed.activeBucketIndex);
      setBucketAnchorId(seed.bucketAnchorId);
      setShowBudgetSummary(seed.showBudgetSummary);
      setBudgetSummaryAnchorId(seed.planAnchorId);
      setShowCategoryBudgets(seed.showCategoryBudgets);
      setCategoryBudgetsAnchorId(seed.planAnchorId);
      // Mark every seeded assistant message as already-streamed so anchored UI shows at once.
      setStreamedIds(new Set(seed.messages.filter((m) => m.role === "assistant").map((m) => m.id)));
      scrollToBottom();
      return;
    }

    if (story === "clean-start") {
      bootStory1();
    } else if (story === "goal-exists") {
      bootStory2();
    } else if (story === "pool-exists") {
      bootStory3();
    } else if (story === "both-exist") {
      bootStory4();
    } else if (story === "impossible-amount") {
      bootStory5();
    } else if (story === "cashflow-blocked") {
      bootStory6();
    }
  }, [story, bootStage]);

  // ── Story boot functions ─────────────────────────────────────

  function bootStory1() {
    // Story 1: Clean start - vague intent → ladder → footprint → plan
    schedule(() => {
      addMessages([STORY1_GOAL_SETUP[0]]);
    }, 400);

    schedule(() => {
      setShowThinking(true);
      scrollToBottom();
    }, 800);

    schedule(() => {
      setShowThinking(false);
      addMessages([STORY1_GOAL_SETUP[1]]);
      setPhase("destination-pick");
      setActiveChips(DESTINATION_CHIPS);
      setShowChips(true);
      setChipsAnchorId(STORY1_GOAL_SETUP[1].id);
    }, 1600);
  }

  function bootStory2() {
    schedule(() => addMessages([STORY2_ENTRY[0]]), 400);
    schedule(() => { setShowThinking(true); scrollToBottom(); }, 800);
    schedule(() => {
      setShowThinking(false);
      addMessages([STORY2_ENTRY[1]]);
      setPhase("blocked");
      setActiveChips([
        { id: "accelerate", label: "Hit trip sooner" },
        { id: "stack", label: "Save for something else" },
      ]);
      setShowChips(true);
      setChipsAnchorId(STORY2_ENTRY[1].id);
    }, 1600);
  }

  function bootStory3() {
    schedule(() => addMessages([STORY3_ENTRY[0]]), 400);
    schedule(() => { setShowThinking(true); scrollToBottom(); }, 800);
    schedule(() => {
      setShowThinking(false);
      addMessages([STORY3_ENTRY[1]]);
      setPhase("blocked");
      setActiveChips(MERGE_CHIPS);
      setShowChips(true);
      setChipsAnchorId(STORY3_ENTRY[1].id);
    }, 1600);
  }

  function bootStory4() {
    schedule(() => addMessages([STORY4_ENTRY[0]]), 400);
    schedule(() => { setShowThinking(true); scrollToBottom(); }, 800);
    schedule(() => {
      setShowThinking(false);
      addMessages([STORY4_ENTRY[1]]);
      setPhase("blocked");
      setActiveChips([
        { id: "bump-goal", label: "Bump trip" },
        { id: "bump-pool", label: "Bump emergency fund" },
        { id: "wait", label: "Wait until trip's done" },
      ]);
      setShowChips(true);
      setChipsAnchorId(STORY4_ENTRY[1].id);
    }, 1600);
  }

  function bootStory5() {
    schedule(() => addMessages([STORY5_ENTRY[0]]), 400);
    schedule(() => { setShowThinking(true); scrollToBottom(); }, 800);
    schedule(() => {
      setShowThinking(false);
      addMessages([STORY5_ENTRY[1]]);
      setPhase("blocked");
      setActiveChips(INFEASIBLE_CHIPS);
      setShowChips(true);
      setChipsAnchorId(STORY5_ENTRY[1].id);
    }, 1600);
  }

  function bootStory6() {
    schedule(() => addMessages([STORY6_ENTRY[0]]), 400);
    schedule(() => { setShowThinking(true); scrollToBottom(); }, 800);
    schedule(() => {
      setShowThinking(false);
      addMessages([STORY6_ENTRY[1]]);
      setPhase("blocked");
      setActiveChips([{ id: "review", label: "Walk me through it" }]);
      setShowChips(true);
      setChipsAnchorId(STORY6_ENTRY[1].id);
    }, 1600);
  }

  // ── Chip handler (routes by phase) ───────────────────────────

  const handleChip = useCallback((chip: { id: string; label: string }) => {
    setShowChips(false);
    setChipsAnchorId(null);

    if (phase === "destination-pick") {
      // User picked "just save more" → show ladder
      addMessages([{ id: "u-dest", role: "user", text: chip.label }]);
      schedule(() => { setShowThinking(true); scrollToBottom(); }, 300);
      schedule(() => {
        setShowThinking(false);
        // Drop leading user echo - the handler already added it above.
        addMessages(STORY1_LADDER_INTRO.filter((m) => m.role !== "user"));
        setPhase("ladder");
        setShowLadder(true);
        scrollToBottom();
      }, 1200);
    } else if (phase === "verdict") {
      handleVerdictAction(chip);
    } else if (phase === "blocked") {
      // Terminal stories - just echo the choice
      addMessages([{ id: `u-blocked-${chip.id}`, role: "user", text: chip.label }]);
      setChipsAnchorId(null);
      schedule(() => { setShowThinking(true); scrollToBottom(); }, 300);
      schedule(() => {
        setShowThinking(false);
        addMessages([{
          id: "a-blocked-ack",
          role: "assistant",
          text: chip.id === "review" || chip.id === "stack"
            ? "Let's take a closer look at your finances to figure out what's possible."
            : "Got it. I'll factor that in. Let me walk through your finances first.",
        }]);
        // For stories 2-6, once user makes a choice, start the footprint walk
        startFootprintWalk();
      }, 1200);
    }
  }, [phase, scrollToBottom, schedule]);

  // ── Ladder selection handler ──────────────────────────────────

  const handleLadderSelect = useCallback((tier: LadderTier) => {
    setLadderSelected(tier);
    setShowLadder(false);

    const picked = LADDER_OPTIONS.find((o) => o.tier === tier)!;
    addMessages([
      { id: "u-ladder", role: "user", text: `₹${picked.monthlyAmount.toLocaleString("en-IN")} a month` },
    ]);

    schedule(() => { setShowThinking(true); scrollToBottom(); }, 300);
    schedule(() => {
      setShowThinking(false);
      // Drop the leading user echo - the handler already added it above.
      addMessages(STORY1_LADDER_PICKED.filter((m) => m.role !== "user"));
      scrollToBottom();
    }, 1200);

    // Start footprint walk after the ladder ack has time to stream out.
    // The ack runs ~200 chars; at ~10ms/char that's ~2s of streaming.
    schedule(() => {
      startFootprintWalk();
    }, 3600);
  }, [scrollToBottom, schedule]);

  // ── Footprint walk ───────────────────────────────────────────

  const startFootprintWalk = useCallback(() => {
    setPhase("footprint-walk");
    setActiveBucketIndex(0);
    setShowBucket(true);
    addMessages(STORY1_BUCKET_INCOME);
    setBucketAnchorId(STORY1_BUCKET_INCOME[0].id);
    // No separate chip set: the confirm-list card's own "Looks right"
    // CTA is the action. Chips below would be a redundant duplicate.
    scrollToBottom();
  }, [scrollToBottom]);

  const handleBucketConfirm = useCallback((result?: { id: string; amount: number; type: string }[]) => {
    setShowBucket(false);
    setBucketAnchorId(null);

    // Progression messages by bucket index
    const confirmMessages = [
      STORY1_BUCKET_INCOME_CONFIRMED,
      STORY1_BUCKET_OBLIGATIONS_CONFIRMED,
      STORY1_BUCKET_P2P_CONFIRMED,
      STORY1_BUCKET_SPORADIC_CONFIRMED,
    ];
    const nextBucketMessages = [
      STORY1_BUCKET_OBLIGATIONS,
      STORY1_BUCKET_P2P,
      STORY1_BUCKET_SPORADIC,
    ];

    // Tapping "Looks right" transforms the card into a short user bubble carrying the confirmed total
    // (e.g. "₹82,000 income sources, looks right") — descriptive, so it doesn't read as a duplicate of
    // the next bucket's CTA.
    const bucketTotal = (result ?? []).reduce((s, r) => s + r.amount, 0);
    const bucketLabel = BUCKET_CONFIRM_LIST[activeBucketIndex]?.label ?? "";
    addMessages([{ id: `u-bucket-${activeBucketIndex}`, role: "user", text: `₹${bucketTotal.toLocaleString("en-IN")} ${bucketLabel.toLowerCase()}, looks right` }]);
    schedule(() => { setShowThinking(true); scrollToBottom(); }, 300);

    schedule(() => {
      setShowThinking(false);
      if (confirmMessages[activeBucketIndex]) {
        addMessages(confirmMessages[activeBucketIndex]);
      }
      scrollToBottom();
    }, 1000);

    // Show next bucket or move to spending plan
    const nextIdx = activeBucketIndex + 1;
    if (nextIdx < BUCKET_CONFIRM_LIST.length) {
      schedule(() => {
        setActiveBucketIndex(nextIdx);
        const nextMsg = nextBucketMessages[activeBucketIndex];
        if (nextMsg) {
          addMessages(nextMsg);
        }
        setShowBucket(true);
        if (nextMsg) setBucketAnchorId(nextMsg[0].id);
        scrollToBottom();
      }, 2000);
    } else {
      // All buckets done → spending plan. Both vizzes are gated on the plan message finishing
      // streaming (so they appear *after* the text); the stagger between them is a deterministic
      // CSS animation-delay on the categories card, not a race against stream timing.
      schedule(() => {
        addMessages(STORY1_SPENDING_PLAN);
        setPhase("spending-plan");
        setShowBudgetSummary(true);
        setBudgetSummaryAnchorId(STORY1_SPENDING_PLAN[0].id);
        setShowCategoryBudgets(true);
        setCategoryBudgetsAnchorId(STORY1_SPENDING_PLAN[0].id);
        scrollToBottom();
      }, 2000);

      // Verdict lands as Ryan's next chat bubble, not a separate banner
      schedule(() => {
        addMessages(STORY1_VERDICT_FEASIBLE);
        setPhase("verdict");
        setActiveChips(LOCK_IN_CHIPS);
        setShowChips(true);
        setChipsAnchorId(STORY1_VERDICT_FEASIBLE[0].id);
        scrollToBottom();
      }, 4000);
    }
  }, [activeBucketIndex, scrollToBottom, schedule]);

  // ── Verdict action handler ───────────────────────────────────

  const handleVerdictAction = useCallback((chip: { id: string; label: string }) => {
    addMessages([{ id: "u-verdict", role: "user", text: chip.label }]);
    setShowChips(false);
    setChipsAnchorId(null);

    schedule(() => { setShowThinking(true); scrollToBottom(); }, 300);
    schedule(() => {
      setShowThinking(false);
      addMessages(STORY1_LOCK_IN);
      setPhase("done");
      scrollToBottom();
    }, 1200);
  }, [scrollToBottom, schedule]);

  // ── Render ───────────────────────────────────────────────────

  // Streaming gates: each piece of actionable UI is anchored to the specific
  // assistant message it follows. The gate latches open once that message is
  // fully streamed and stays open, even when a new Ryan message starts
  // streaming below. Matches the universal rule in
  // feedback_chat_streaming_scroll.md.
  const chipsReady = chipsAnchorId !== null && streamedIds.has(chipsAnchorId);
  const bucketReady = bucketAnchorId !== null && streamedIds.has(bucketAnchorId);
  const budgetSummaryReady =
    budgetSummaryAnchorId !== null && streamedIds.has(budgetSummaryAnchorId);
  const categoryBudgetsReady =
    categoryBudgetsAnchorId !== null && streamedIds.has(categoryBudgetsAnchorId);

  return (
    <div
      data-screen-root
      className="relative flex flex-col"
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: BG_PRIMARY,
        overflow: "hidden",
      }}
    >
      <FloatingAppBar onClose={onClose} />

      {/* Top fade — backs the app bar + softens content scrolling under it (matches OnboardingSim's
          enhancements fade): solid to 74%, then a gentle taper to transparent. Sits below the z-10
          app bar, above the scroll content. */}
      <div
        className="absolute left-0 right-0 z-[9]"
        style={{
          top: 0,
          height: 140,
          pointerEvents: "none",
          background: `linear-gradient(to bottom, ${BG_PRIMARY} 0%, ${BG_PRIMARY} 74%, transparent 100%)`,
        }}
      />

      {/* Scrollable content area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{
          paddingTop: 116, // below app bar (+8 so content starts a touch lower from the top)
          paddingBottom: SPACE_L,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: SPACE_M,
            padding: `0 ${SPACE_M}px`,
            paddingBottom: SPACE_L,
          }}
        >
          {/* Messages */}
          {messages.map((msg, i) => (
            <Bubble
              key={msg.id}
              msg={msg}
              typewrite={i === messages.length - 1 && i >= seedCount}
              onStreamComplete={() => {
                setStreamedIds((prev) => {
                  if (prev.has(msg.id)) return prev;
                  const next = new Set(prev);
                  next.add(msg.id);
                  return next;
                });
                scrollToBottom();
              }}
            />
          ))}

          {/* Thinking indicator */}
          {showThinking && <ThinkingIndicator />}

          {/* Confirm list (footprint walk) - waits for Ryan's text to finish
              streaming. The card's own "Looks right" CTA advances the bucket;
              there's no redundant chip set below it. */}
          {showBucket && bucketReady && BUCKET_CONFIRM_LIST[activeBucketIndex] && (
            <div key={`bucket-${activeBucketIndex}`} className="animate-card-rise">
              <ChatCard
                card={{
                  ...BUCKET_CONFIRM_LIST[activeBucketIndex],
                  defaultAllSelected: true,
                  onSubmit: (result) => handleBucketConfirm(result),
                }}
              />
            </div>
          )}

          {/* Spending plan — math first, then categories. Each gated on its anchor message. */}
          {showBudgetSummary && budgetSummaryReady && (
            <div className="animate-card-rise">
              <BudgetSummaryViz plan={SPENDING_PLAN_FIXTURE} />
            </div>
          )}
          {showCategoryBudgets && categoryBudgetsReady && (
            // Staggers a beat behind the summary. animationFillMode:both holds the pre-rise
            // (opacity 0) state through the delay so it doesn't flash in then animate.
            <div className="animate-card-rise" style={{ animationDelay: "180ms", animationFillMode: "both" }}>
              <CategoryBudgetsViz plan={SPENDING_PLAN_FIXTURE} />
            </div>
          )}

          {/* Chips - never appear before their anchor Ryan message finishes streaming */}
          {showChips && chipsReady && activeChips.length > 0 && (
            <div className="animate-chat-message-in">
              <ChipList chips={activeChips} onSelect={handleChip} />
            </div>
          )}

          {/* Savings-tier question — an inline chat card (not a bottom-sheet pop-in) */}
          {showLadder && (
            <div className="animate-card-rise">
              <QuestionnaireOverlay
                inline
                questions={[SAVINGS_TIER_QUESTION]}
                currentIndex={0}
                answers={ladderSelected ? { [SAVINGS_TIER_QUESTION.id]: ladderSelected } : {}}
                onSelectOption={(_qId, opt) => handleLadderSelect(opt.id as LadderTier)}
                onSubmitFreeText={() => {}}
                onNavigate={() => {}}
                onClose={() => setShowLadder(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
