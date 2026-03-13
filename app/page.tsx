"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import Chat, { type ChatChip, type ChatMessage } from "./components/Chat";
import PersonaQuizStack, { type RevealData } from "./components/PersonaQuizStack";
import WrappedCarousel from "./components/WrappedCarousel";
import ChatInitialScreen, { defaultSuggestions } from "./components/ChatInitialScreen";
import {
  affordAmountChips,
  amountChips,
  budgetAgreementChips,
  budgetDigestChips,
  budgetReviewChips,
  budgetStyleChips,
  goalChips,
  leakFixChips,
  onTrackChips,
  personaQuestions,
  paceChoiceChips,
  paceContinueChips,
  pinnedGoalChips,
  steadyStateChips,
  tradeoffChoiceChips,
  timelineChips,
  understandActionChips,
  understandDrilldownChips,
  understandMenuChips,
  buildDynamicAffordCategoryChips,
  type ChipOption,
} from "./data/flows";
import {
  getFDSuggestion,
  getRealityCheckText,
} from "./data/mockProfiles";
import type { PacePreset } from "./data/mockProfiles";
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
} from "./lib/financial-data";
import type {
  ChatMessage as AIChatMessage,
  FlowAssistResponse,
  FlowAction,
  PersonaStage,
  HomeSubflow,
} from "./lib/types";
import { getEffectiveBudget } from "./lib/budget-utils";
import { useUserState } from "./hooks/useUserState";

type PaceStage = "summary" | "select";
type PersonaStageKey = "q1" | "q2" | "q2-follow" | "q3" | "q4";

const personaStageOrder: PersonaStageKey[] = ["q1", "q2", "q2-follow", "q3", "q4"];
const personaQuestionMap: Record<PersonaStageKey, number> = {
  q1: 0,
  q2: 1,
  "q2-follow": 2,
  q3: 3,
  q4: 4,
};
const personaQuestionStageMap: Record<string, PersonaStageKey> = {
  "q1-savings": "q1",
  "q2-disposable": "q2",
  "q2-followup": "q2-follow",
  "q3-persona": "q3",
  "q4-confidence": "q4",
};

// Derive profile from real transaction data
const profile = deriveProfile();
const dynamicWrappedSlides = computeWrappedSlides();
const lifestyleCategories = getLifestyleCategories();
const dynamicCategoryChips = buildDynamicAffordCategoryChips(
  lifestyleCategories.map((c) => c.name)
);

// Category spending — initialized from real monthly averages (never mutates)
const categorySpending: Record<string, number> = {};
for (const cat of lifestyleCategories.slice(0, 6)) {
  categorySpending[cat.name] = cat.monthlyAverage;
}

export default function Home() {
  // ============ PERSISTENT STATE (single source of truth) ============
  const { state: userState, mutate, resetState, resetUser, isHydrated } = useUserState(profile);

  // Derived from userState — variable names stay backward-compatible
  const step = userState?.currentStep ?? "wrapped";
  const personaStage = userState?.personaStage ?? "q1";
  const goalStage = userState?.goalStage ?? "choice";
  const budgetStage = userState?.budgetStage ?? "digest";
  const budgetOverrides = userState?.budgetOverrides ?? {};
  const bufferRemaining = userState?.bufferRemaining ?? (parseInt(profile.suggested_budgets.buffer_bucket.replace(/[₹,k]/g, "")) * 1000);
  const spendRatings = userState?.spendRatings ?? [];
  const userId = userState?.userId ?? "";

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

  // Core UI state (transient, not persisted)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeChips, setActiveChips] = useState<ChatChip[]>([]);
  const [homeSubflow, setHomeSubflow] = useState<HomeSubflow>("idle");
  const [paceStage, setPaceStage] = useState<PaceStage>("summary");
  const [subflowData, setSubflowData] = useState<Record<string, string>>({});
  const [personaDraftAnswers, setPersonaDraftAnswers] = useState<Record<string, string>>({});
  const [personaActiveIndex, setPersonaActiveIndex] = useState(0);
  const [personaCoverVisible, setPersonaCoverVisible] = useState(false);
  const [personaTransitioning, setPersonaTransitioning] = useState(false);
  const [personaSubmitting, setPersonaSubmitting] = useState(false);
  const [personaRevealVisible, setPersonaRevealVisible] = useState(false);
  const [personaRevealData, setPersonaRevealData] = useState<RevealData | undefined>();

  // Data-driven state (transient)
  const [dynamicPacePresets, setDynamicPacePresets] = useState<PacePreset[]>(profile.pace_presets);

  // UI state
  const [receiptsOpen, setReceiptsOpen] = useState(false);
  const [insightIndex, setInsightIndex] = useState(0);
  const [isAgentProcessingGlow, setIsAgentProcessingGlow] = useState(false);

  // AI Chat state
  const [aiMessages, setAiMessages] = useState<AIChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  // Swipe interface state (transient)
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [swipeQueue, setSwipeQueue] = useState<typeof profile.receipts>([]);

  // Welcome-back: hydrate transient state from persisted state
  const welcomeShownRef = useRef(false);
  const launchResetDoneRef = useRef(false);
  useEffect(() => {
    if (!isHydrated || welcomeShownRef.current) return;
    welcomeShownRef.current = true;
    // Intentionally do not auto-enter the chat on launch.
    // We force users through the wrapped/story screen first.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  // Message management - use a ref counter to guarantee unique IDs
  const msgIdRef = { current: 0 };

  const addMessage = useCallback(
    (role: "assistant" | "user", text: string, special?: ChatMessage["special"]) => {
      const id = `msg-${Date.now()}-${++msgIdRef.current}`;
      setMessages((prev) => [...prev, { id, role, text, special }]);
    },
    [],
  );

  const toChips = (options: ChipOption[]): ChatChip[] =>
    options.map((o) => ({ id: o.id, label: o.label }));

  const hydratePersonaDraftFromState = useCallback((answers: Record<string, string>, stage: PersonaStage) => {
    const draft: Record<string, string> = {};
    for (const question of personaQuestions) {
      const stageKey = personaQuestionStageMap[question.id];
      if (stageKey && answers[stageKey]) {
        draft[question.id] = answers[stageKey];
      }
    }

    setPersonaDraftAnswers(draft);

    const nextIndex = personaQuestionMap[stage] ?? 0;
    const answeredCount = Object.keys(draft).length;
    const isComplete = answeredCount >= personaQuestions.length;
    setPersonaActiveIndex(isComplete ? personaQuestions.length - 1 : nextIndex);
    setPersonaCoverVisible(answeredCount === 0 && nextIndex === 0 && !isComplete);
    setPersonaTransitioning(false);
    setPersonaSubmitting(false);
  }, []);

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
    setStreamingText("");
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

      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullResponse += chunk;
        setStreamingText(fullResponse);
      }

      // Add completed message
      setStreamingText("");
      if (fullResponse.trim()) {
        addMessage("assistant", fullResponse);
        setAiMessages((prev) => [
          ...prev,
          { role: "assistant" as const, content: fullResponse },
        ]);
      } else {
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
        "Sorry, I couldn't process that right now. Try again?"
      );
    } finally {
      setIsStreaming(false);
      setStreamingText("");
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
      // Non-critical — silently fail
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
Goal: ${goalName} — ${goalAmount}
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
Top lifestyle spend: ${topCat?.name || "unknown"} — ${topCat?.shareOfLifestyle || "?"} share, ${formatINR(topCat?.monthlyAverage || 0)}/month
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
${fullPicture.is_other ? `This is an uncategorized spend — comes from flex buffer.` : `Category budget: ${fullPicture.category_budget}\nSpent so far: ${fullPicture.spent_so_far}\nBudget remaining: ${fullPicture.budget_remaining}`}
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
Goal: ${goalName} — ${goalAmount} in ${timeline}
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

  const buildRealityCheckContext = (guesses: { savingsGuess?: string; personaGuess?: string }) => {
    const actualSavings = profile.persona.actual_savings_pct;
    const topCat = lifestyleCategories[0];
    const totalInvested = profile.investmentSummary.totalInvested;

    return `REALITY CHECK — comparing user's self-perception vs actual data:

USER'S GUESSES:
- Thinks they save: ${guesses.savingsGuess || "didn't say"}
- Identifies as: ${guesses.personaGuess || "didn't say"}

ACTUAL DATA:
- Real savings rate: ${actualSavings}
- Top spending category: ${topCat?.name || "unknown"} (${topCat?.shareOfLifestyle || "?"} of lifestyle, ${formatINR(topCat?.monthlyAverage || 0)}/month)
- Total invested: ${formatINR(totalInvested)} across ${Object.keys(profile.investmentSummary.breakdown).length} platforms
- Account balance: ${formatINR(profile.accountBalance)}
- ${profile.dataRange.totalTransactions} transactions over ${profile.dataRange.months} months
- Money personality: ${profile.wrapped.money_personality_label}

Write a punchy, surprising reveal. Start with where they were right or wrong. Make it feel like an "aha" moment, not a lecture. Keep it under 100 words. End with something that makes them curious to learn more.`;
  };

  const buildPaceContext = (paceId: string) => {
    const preset = dynamicPacePresets.find((p) => p.id === paceId) ?? dynamicPacePresets[0];
    const goalName = goalDraft.name || profile.goal.goal_name;
    const goalAmount = goalDraft.amount || profile.goal.goal_amount;

    return `PACE RECOMMENDATION:
Goal: ${goalName} — ${goalAmount} in ${goalDraft.timeline || "TBD"}
Selected pace: ${preset.label} (${preset.id})
Window: ${preset.pace_window}
Required monthly cut: ${preset.required_monthly_cut}
Feasibility: ${preset.feasibility_note}
Lever examples: ${preset.lever_examples.join(", ")}
Product: ${preset.recommended_product.type} — ${preset.recommended_product.copy}

Current savings rate: ${profile.persona.actual_savings_pct}
Top spending categories: ${lifestyleCategories.slice(0, 3).map((c) => `${c.name} (${formatINR(c.monthlyAverage)}/mo)`).join(", ")}

Explain this pace conversationally. Make the monthly cut feel tangible ("that's like skipping X per month"). Mention what's realistic based on their actual spending. Keep it under 100 words.`;
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

  const getPaceSummary = (paceId: "aggressive" | "balanced" | "relaxed") => {
    const preset = lookupPace(paceId);
    return (
      `${preset.label} pace — ${preset.pace_window}\n\n` +
      `You'd need to cut ~${preset.required_monthly_cut}/month.\n` +
      `${preset.feasibility_note}\n\n` +
      `Ways to do it:\n` +
      preset.lever_examples.map((item) => `• ${item}`).join("\n")
    );
  };

  const getGoalProductText = (paceId: "aggressive" | "balanced" | "relaxed") => {
    const preset = lookupPace(paceId);
    return preset.recommended_product.copy;
  };

  const getGoalProductChips = (paceId: "aggressive" | "balanced" | "relaxed"): ChatChip[] => {
    const preset = lookupPace(paceId);
    const product = preset.recommended_product;
    const primaryLabel = product.type === "RD"
      ? `Start RD ${preset.required_monthly_cut}`
      : `Turn on ${formatINR(Math.round(parseINR(preset.required_monthly_cut) / 30))}/day`;
    return [
      { id: "product-primary", label: primaryLabel, variant: "success" },
      { id: "product-secondary", label: product.type === "RD" ? "Show other amounts" : "Make it smaller" },
      { id: "product-change-pace", label: "Change pace" },
      { id: "product-skip", label: "I'll monitor it myself" },
    ];
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

  const getGoalPaceImpactText = (amount: string, timing: string) => {
    const paceId = selectedPaceId;
    const paceDays = paceId === "aggressive" ? 5 : paceId === "balanced" ? 3 : 2;
    return `${amount} ${timing.toLowerCase()}? Risky.\nThis would put you behind on your ${goalDraft.name || profile.goal.goal_name} by ~${paceDays} days.`;
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
      addMessage("assistant", getTradeoffPrompt(ruleId));
      setActiveChips(toChips(tradeoffChoiceChips));
      return;
    }
    setSubflowData((prev) => ({ ...prev, tradeoffStep: "bucket-select" }));
    setHomeSubflow("tradeoff");
    addMessage("assistant", "Pick a buffer bucket size:");
    setActiveChips(getBucketOptionChips());
  };

  // ============ WRAPPED COMPLETE ============
  const handleWrappedComplete = () => {
    mutate({ currentStep: "persona", personaStage: "q1" });
    setMessages([]);
    setActiveChips([]);
    setPersonaDraftAnswers({});
    setPersonaActiveIndex(0);
    setPersonaCoverVisible(true);
    setPersonaTransitioning(false);
    setPersonaSubmitting(false);
  };

  // ============ PERSONA FLOW ============
  const handlePersonaAnswer = (questionIndex: number, chip: ChipOption) => {
    if (personaTransitioning || personaSubmitting) return;
    setPersonaCoverVisible(false);

    const question = personaQuestions[questionIndex];
    if (!question) return;

    const stageKey = personaQuestionStageMap[question.id];
    const nextDraft = {
      ...personaDraftAnswers,
      [question.id]: chip.id,
    };

    setPersonaDraftAnswers(nextDraft);
    setPersonaTransitioning(true);

    const isLastQuestion = questionIndex >= personaQuestions.length - 1;
    const nextStage = !isLastQuestion ? personaStageOrder[questionIndex + 1] : "q4";

    mutate({
      personaAnswers: { ...userState?.personaAnswers, ...(stageKey ? { [stageKey]: chip.id } : {}) },
      personaStage: nextStage as PersonaStage,
    });

    window.setTimeout(() => {
      setPersonaTransitioning(false);
      if (isLastQuestion) {
        setPersonaRevealData({
          savingsGuess: nextDraft["q1-savings"] ? personaQuestions[0].chips.find(c => c.id === nextDraft["q1-savings"])?.label ?? nextDraft["q1-savings"] : profile.persona.user_guess_savings_pct,
          savingsActual: profile.persona.actual_savings_pct,
          personaGuess: nextDraft["q3-persona"] ? personaQuestions[3].chips.find(c => c.id === nextDraft["q3-persona"])?.label ?? nextDraft["q3-persona"] : profile.persona.persona_guess,
          personaActual: profile.persona.persona_actual,
        });
        setPersonaRevealVisible(true);
      } else {
        setPersonaActiveIndex(questionIndex + 1);
      }
    }, 220);
  };

  const handlePersonaBack = () => {
    if (personaTransitioning || personaSubmitting) return;

    if (personaActiveIndex === 0) return;

    const previousIndex = personaActiveIndex - 1;
    const previousQuestion = personaQuestions[previousIndex];
    if (!previousQuestion) return;

    setPersonaDraftAnswers((prev) => {
      const next = { ...prev };
      delete next[previousQuestion.id];
      return next;
    });
    setPersonaActiveIndex(previousIndex);
    mutate({
      personaStage: personaQuestionStageMap[previousQuestion.id],
      personaAnswers: (() => {
        const nextAnswers = { ...(userState?.personaAnswers || {}) };
        delete nextAnswers[personaQuestionStageMap[previousQuestion.id]];
        return nextAnswers;
      })(),
    });
  };

  const submitPersonaQuiz = (draftAnswers = personaDraftAnswers) => {
    if (personaSubmitting) return;

    const nextAnswers = { ...(userState?.personaAnswers || {}) };
    for (const question of personaQuestions) {
      const stageKey = personaQuestionStageMap[question.id];
      const answerId = draftAnswers[question.id];
      if (stageKey && answerId) {
        nextAnswers[stageKey] = answerId;
      }
    }

    mutate({ personaAnswers: nextAnswers, personaStage: "q4" });
    startReality(nextAnswers);
  };

  const startPersonaQuiz = () => {
    setPersonaCoverVisible(false);
  };

  const startReality = (answerSnapshot?: Record<string, string>) => {
    mutate({ currentStep: "reality" });

    const answers = answerSnapshot ?? userState?.personaAnswers ?? {};

    // Store persona decisions in Mem0
    storeMemoryDecision(
      "persona_quiz",
      `User thinks they save ${answers["q1"] || "unknown"}. Top category guess: ${answers["q2"] || "unknown"}. Identifies as: ${answers["q3"] || "unknown"}. Confidence: ${answers["q4"] || "unknown"}.`
    );

    // Reality check is shown on the quiz reveal card — go straight to goal flow
    startGoal();
  };

  // ============ REALITY FLOW ============
  const handleRealityChip = (chip: ChatChip) => {
    addMessage("user", chip.label);
    mutate({ personaAnswers: { ...userState?.personaAnswers, realityChoice: chip.id } });
    startGoal();
  };

  // ============ GOAL FLOW ============
  const startGoal = () => {
    mutate({ currentStep: "goal", goalStage: "choice" });
    addMessage("assistant", "Your money has habits. Let's build a better one.");
    addMessage("assistant", "What are you saving toward?");
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
    if (goalStage === "savings") {
      handleSavingsOpt(chip);
      return;
    }
    if (goalStage === "pace") {
      handlePaceChip(chip);
      return;
    }
    if (goalStage === "budget-review") {
      handleBudgetReviewChip(chip);
      return;
    }
    if (goalStage === "product") {
      handleGoalProductChip(chip);
      return;
    }
    if (goalStage === "pinned") {
      handlePinnedGoal(chip);
      return;
    }
  };

  const handleGoalChoice = (value: string) => {
    setLocalGoalDraft((prev) => ({ ...prev, name: value }));
    addMessage("user", value);
    addMessage("assistant", "When do you want this by?");
    mutate({ goalStage: "timeline" });
    setActiveChips(toChips(timelineChips));
  };

  const handleGoalTimeline = (chip: ChatChip) => {
    const timeline = chip.label;
    setLocalGoalDraft((prev) => ({ ...prev, timeline }));
    addMessage("user", timeline);
    addMessage("assistant", "How much do you think this will cost?");
    mutate({ goalStage: "amount" });
    setActiveChips(toChips(amountChips));
  };

  const handleGoalAmount = (chip: ChatChip) => {
    const amount = chip.id === "skip" ? "Not set" : chip.label;
    setLocalGoalDraft((prev) => ({ ...prev, amount }));
    addMessage("user", chip.label);

    // Store goal in Mem0
    storeMemoryDecision(
      "goal_set",
      `User set goal: ${goalDraft.name || "unnamed"}, ${amount}, ${goalDraft.timeline || "no timeline"}`
    );

    // Show savings opt-in with real investment total
    const totalInvested = profile.investmentSummary.totalInvested;
    if (totalInvested > 0) {
      mutate({ goalStage: "savings" });
      addMessage(
        "assistant",
        `You already have ${formatINR(totalInvested)} in investments. How much of that counts toward this goal?`
      );
      setActiveChips([
        { id: "savings-all", label: `All of it (${formatINR(totalInvested)})` },
        { id: "savings-none", label: "None — starting fresh" },
        { id: "savings-custom", label: "Custom amount" },
      ]);
    } else {
      // No investments — skip savings stage
      proceedToPace(amount, 0);
    }
  };

  const handleSavingsOpt = (chip: ChatChip) => {
    addMessage("user", chip.label);
    const goalAmount = goalDraft.amount || "₹5L";
    const totalInvested = profile.investmentSummary.totalInvested;

    if (chip.id === "savings-all") {
      setLocalSavingsForGoal(totalInvested);
      proceedToPace(goalAmount, totalInvested);
    } else if (chip.id === "savings-none") {
      setLocalSavingsForGoal(0);
      proceedToPace(goalAmount, 0);
    } else if (chip.id === "savings-custom") {
      // Enable text input for custom amount
      addMessage("assistant", "How much of your investments should count? (e.g. ₹5L, ₹2L)");
      // Stay on savings stage — handleGoalInput will handle text
    } else {
      // Dynamic chip — parse the amount from the chip label
      const chipAmount = parseINR(chip.label);
      if (chipAmount > 0) {
        const capped = Math.min(chipAmount, totalInvested);
        setLocalSavingsForGoal(capped);
        proceedToPace(goalAmount, capped);
      }
    }
  };

  const proceedToPace = async (goalAmount: string, savings: number) => {
    const goalNum = parseINR(goalAmount);
    const remaining = Math.max(0, goalNum - savings);

    // Compute pace presets for remaining goal amount
    const presets = computePacePresets(remaining);
    setDynamicPacePresets(presets);

    const paceId = getDefaultPaceId(goalDraft.timeline);
    setLocalPaceId(paceId);
    mutate({ goalStage: "pace" });
    setPaceStage("summary");

    if (savings > 0) {
      addMessage("assistant", `Great. With ${formatINR(savings)} already counted, you need ${formatINR(remaining)} more.`);
    }

    const response = await callFlowAssist("copy", "pace-summary", buildPaceContext(paceId));
    if (response?.message) {
      addMessage("assistant", response.message);
    } else {
      addMessage("assistant", getPaceSummaryFromPresets(presets, paceId));
    }
    setActiveChips(toChips(paceContinueChips));
  };

  const getPaceSummaryFromPresets = (presets: PacePreset[], paceId: string) => {
    const preset = presets.find((p) => p.id === paceId) ?? presets[0];
    return (
      `${preset.label} pace — ${preset.pace_window}\n\n` +
      `You'd need to cut ~${preset.required_monthly_cut}/month.\n` +
      `${preset.feasibility_note}\n\n` +
      `Ways to do it:\n` +
      preset.lever_examples.map((item) => `• ${item}`).join("\n")
    );
  };

  const showBudgetReview = () => {
    mutate({ goalStage: "budget-review" });
    const preset = lookupPace(selectedPaceId);
    const budgets = profile.suggested_budgets;
    const goalName = goalDraft.name || profile.goal.goal_name;

    // Show budget categories with any overrides applied
    const categoryLines = budgets.categories.map((cat) => {
      const override = budgetOverrides[cat.name];
      if (override !== undefined) {
        return `• ${cat.name}: ${formatINR(override)} (was ${cat.budget})`;
      }
      return `• ${cat.name}: ${cat.budget}`;
    }).join("\n");

    const savingsNote = savingsForGoal > 0
      ? `This accounts for ${formatINR(savingsForGoal)} already allocated from your investments.`
      : `Starting from scratch — no existing savings counted.`;

    const budgetText =
      `For the ${preset.label.toLowerCase()} pace on ${goalName}, here are the monthly spending assumptions:\n\n` +
      `Overall monthly spend: ${budgets.overall_budget}\n` +
      `Buffer (flex spending): ${budgets.buffer_bucket}\n\n` +
      `Category breakdown:\n` +
      categoryLines +
      `\n\n━━━━━━━━━━━━━━━━━━━\n\n` +
      savingsNote + `\n\n` +
      `Look good, or need edits?`;

    addMessage("assistant", budgetText);
    setActiveChips(toChips(budgetReviewChips));
  };

  const handleBudgetReviewChip = (chip: ChatChip) => {
    if (chip.id === "approve-budget") {
      addMessage("user", chip.label);
      addMessage("assistant", getGoalProductText(selectedPaceId));
      mutate({ goalStage: "product" });
      setActiveChips(getGoalProductChips(selectedPaceId));
      return;
    }

    if (chip.id === "edit-budget") {
      addMessage("user", chip.label);
      addMessage(
        "assistant",
        "Tell me what to change — e.g. 'reduce cash withdrawals to ₹10k' or 'set other to ₹3k'"
      );
      // Stay on budget-review stage — text input will be handled by handleBudgetEditInput
    }
  };

  const handleBudgetEditInput = async (text: string) => {
    addMessage("user", text);

    const response = await callFlowAssist("reason", "budget-review", buildBudgetContext(), text);

    if (response?.message) {
      addMessage("assistant", response.message);
      if (response.actions.length > 0) {
        applyFlowActions(response.actions);
      }
    } else {
      // Fallback: regex-based parsing
      const input = text.toLowerCase();
      const amountMatch = text.match(/₹[\d,.]+[kKlL]?/);
      const amount = amountMatch ? parseINR(amountMatch[0]) : 0;

      if (!amount) {
        addMessage("assistant", "I couldn't find an amount. Try something like 'reduce Cash Withdrawals to ₹10k'.");
        setActiveChips([
          { id: "approve-budget", label: "Looks good" },
          { id: "edit-budget", label: "Edit more" },
        ]);
        return;
      }

      let matchedCategory: string | null = null;
      for (const cat of profile.suggested_budgets.categories) {
        const catLower = cat.name.toLowerCase();
        const catWords = catLower.split(/[\s/()]+/).filter(Boolean);
        if (catWords.some((w) => w.length > 2 && input.includes(w))) {
          matchedCategory = cat.name;
          break;
        }
      }

      if (!matchedCategory) {
        addMessage("assistant", `I couldn't match a category. Available: ${profile.suggested_budgets.categories.map((c) => c.name).join(", ")}`);
        setActiveChips([
          { id: "approve-budget", label: "Looks good" },
          { id: "edit-budget", label: "Edit more" },
        ]);
        return;
      }

      mutate({ budgetOverrides: { [matchedCategory!]: amount } });
      addMessage("assistant", `Updated ${matchedCategory} to ${formatINR(amount)}.`);
    }

    setActiveChips([
      { id: "approve-budget", label: "Looks good" },
      { id: "edit-budget", label: "Edit more" },
    ]);
  };

  const handlePaceChip = async (chip: ChatChip) => {
    if (paceStage === "summary") {
      if (chip.id === "continue") {
        addMessage("user", chip.label);
        storeMemoryDecision("pace_chosen", `User chose ${selectedPaceId} pace`);
        showBudgetReview();
        return;
      }

      if (chip.id === "tweak-pace") {
        setPaceStage("select");
        addMessage("assistant", "Pick a pace that feels realistic:");
        setActiveChips(toChips(paceChoiceChips));
      }
      return;
    }

    if (paceStage === "select") {
      if (chip.id === "aggressive" || chip.id === "balanced" || chip.id === "relaxed") {
        setLocalPaceId(chip.id);
        setPaceStage("summary");
        if (userState?.goal) {
          mutate({ goal: { ...userState.goal, paceId: chip.id } });
        }

        const response = await callFlowAssist("copy", "pace-summary", buildPaceContext(chip.id));
        if (response?.message) {
          addMessage("assistant", response.message);
        } else {
          addMessage("assistant", getPaceSummary(chip.id));
        }
        setActiveChips(toChips(paceContinueChips));
      }
    }
  };

  const handleGoalProductChip = (chip: ChatChip) => {
    if (chip.id === "product-change-pace") {
      mutate({ goalStage: "pace" });
      setPaceStage("select");
      addMessage("assistant", "Pick a pace that feels realistic:");
      setActiveChips(toChips(paceChoiceChips));
      return;
    }

    if (chip.id === "product-secondary") {
      addMessage(
        "assistant",
        "Got it. I can show smaller options if you want, but this still works as a starter.",
      );
      setActiveChips(getGoalProductChips(selectedPaceId));
      return;
    }

    if (chip.id === "product-primary") {
      const preset = lookupPace(selectedPaceId);
      const eta = goalDraft.timeline || profile.goal.horizon;
      const goalName = goalDraft.name || profile.goal.goal_name;

      // Extract amount from chip label (e.g., "Start RD ₹83.3k" -> "₹83.3k")
      const amountMatch = chip.label.match(/₹[\d.]+[kKlL]?/);
      const amount = amountMatch ? amountMatch[0] : preset.required_monthly_cut;

      // Determine product type message
      let productMessage = "";
      if (preset.recommended_product.type === "RD") {
        productMessage = `An RD of ${amount} has been started.`;
      } else if (preset.recommended_product.type === "Autosave") {
        productMessage = `Auto-save of ${amount}/day has been started.`;
      }

      // Generate fun goal message
      let goalMessage = "";
      const goalLower = goalName.toLowerCase();
      if (goalLower.includes("japan")) {
        goalMessage = `I'll see you in Tokyo in ${eta}!`;
      } else if (goalLower.includes("trip") || goalLower.includes("vacation")) {
        goalMessage = `See you on your trip in ${eta}!`;
      } else if (goalLower.includes("emergency")) {
        goalMessage = `You'll have your safety net ready in ${eta}!`;
      } else {
        goalMessage = `You'll hit ${goalName} in ${eta}!`;
      }

      // Persist: save goal + product + mark onboarding complete
      const productType = preset.recommended_product.type === "RD" ? "rd" as const : "autosave" as const;
      const goalObj = {
        name: goalName,
        timeline: eta,
        timelineMonths: parseTimelineToMonths(eta),
        amount: goalDraft.amount || profile.goal.goal_amount,
        amountNum: parseINR(goalDraft.amount || profile.goal.goal_amount),
        savingsAllocated: savingsForGoal,
        paceId: selectedPaceId,
        createdAt: new Date().toISOString(),
      };
      mutate({
        onboardingComplete: true,
        currentStep: "home",
        goal: goalObj,
        budgetOverrides,
        bufferRemaining,
        products: [...(userState?.products || []), {
          type: productType,
          amount: parseINR(amount),
          frequency: productType === "rd" ? "monthly" : "daily",
          activatedAt: new Date().toISOString(),
          active: true,
        }],
      });

      addMessage("assistant", productMessage, "success");

      setTimeout(() => {
        addMessage("assistant", goalMessage);
        setTimeout(() => {
          finishBudget({ skipInsight: true });
        }, 500);
      }, 1000);
      return;
    } else if (chip.id === "product-skip") {
      const eta = goalDraft.timeline || profile.goal.horizon;
      const goalName = goalDraft.name || profile.goal.goal_name;
      addMessage(
        "assistant",
        `No worries. At your current pace, you'll hit ${goalName} in ${eta}. You can set up automation anytime.`,
      );
      // Persist: save goal + mark onboarding complete (no product)
      mutate({
        onboardingComplete: true,
        currentStep: "home",
        goal: {
          name: goalName,
          timeline: eta,
          timelineMonths: parseTimelineToMonths(eta),
          amount: goalDraft.amount || profile.goal.goal_amount,
          amountNum: parseINR(goalDraft.amount || profile.goal.goal_amount),
          savingsAllocated: savingsForGoal,
          paceId: selectedPaceId,
          createdAt: new Date().toISOString(),
        },
        budgetOverrides,
        bufferRemaining,
      });
    }

    finishBudget({ skipInsight: true });
  };

  const handlePinnedGoal = (chip: ChatChip) => {
    addMessage("user", chip.label);

    if (chip.id === "show-plan") {
      startBudget();
      return;
    }
    if (chip.id === "adjust-goal") {
      addMessage("assistant", "What would you like to change?");
      mutate({ goalStage: "choice" });
      setActiveChips(toChips(goalChips));
      return;
    }
    if (chip.id === "add-goal") {
      addMessage("assistant", "You can add more goals later. For now, let's nail this one first.");
      setActiveChips(toChips(pinnedGoalChips));
    }
  };

  const handleGoalInput = async (value: string) => {
    if (step !== "goal") return;
    if (goalStage === "choice") {
      handleGoalChoice(value);
      return;
    }
    if (goalStage === "savings") {
      addMessage("user", value);
      const amount = parseINR(value);
      if (amount > 0) {
        const totalInvested = profile.investmentSummary.totalInvested;
        const capped = Math.min(amount, totalInvested);
        setLocalSavingsForGoal(capped);
        proceedToPace(goalDraft.amount || "₹5L", capped);
      } else {
        // Non-numeric input — use AI to reason about savings allocation
        const totalInvested = profile.investmentSummary.totalInvested;
        const goalAmount = goalDraft.amount || "₹5L";
        const savingsContext = `SAVINGS ALLOCATION DECISION:
Goal: ${goalDraft.name || "unnamed"} — ${goalAmount} in ${goalDraft.timeline || "TBD"}
Total investments: ${formatINR(totalInvested)}
Investment breakdown: ${Object.entries(profile.investmentSummary.breakdown).map(([k, v]) => `${k}: ${formatINR(v.total)}`).join(", ")}
Account balance: ${formatINR(profile.accountBalance)}
Savings rate: ${profile.persona.actual_savings_pct}

The user needs to decide how much of their existing ${formatINR(totalInvested)} investments to count toward this goal.
Analyze their financial situation and suggest a specific amount with reasoning.
Consider: goal size vs total investments, whether they need an emergency buffer, liquidity of investments, and other goals they might have.
End your response by suggesting 2-3 specific amounts they could pick.`;

        const response = await callFlowAssist("reason", "savings-allocation", savingsContext, value);
        if (response?.message) {
          addMessage("assistant", response.message);
        } else {
          addMessage("assistant", `You have ${formatINR(totalInvested)} in investments. How much should count toward this goal?`);
        }

        // Show chips with AI-informed or sensible default options
        const halfGoal = Math.min(totalInvested, Math.round(parseINR(goalAmount) * 0.5 / 10000) * 10000);
        const quarterInvestments = Math.round(totalInvested * 0.25 / 10000) * 10000;
        setActiveChips([
          { id: "savings-all", label: `All (${formatINR(totalInvested)})` },
          ...(halfGoal > 0 && halfGoal < totalInvested ? [{ id: "savings-half-goal", label: formatINR(halfGoal) }] : []),
          ...(quarterInvestments > 0 && quarterInvestments < halfGoal ? [{ id: "savings-quarter", label: formatINR(quarterInvestments) }] : []),
          { id: "savings-none", label: "None — start fresh" },
        ]);
      }
      return;
    }
    if (goalStage === "budget-review") {
      handleBudgetEditInput(value);
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
            `You're on track for the ${preset.label.toLowerCase()} pace. Want to keep it steady with a small system?`,
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
            "Want me to set a soft budget so weekends don't derail the goal?",
          );
          mutate({ budgetStage: "budgetChoice" });
          setActiveChips(toChips(budgetAgreementChips));
        } else {
          addMessage("assistant", "Got it. I'll keep you posted on progress.");
          finishBudget();
        }
        break;

      case "lever":
        if (chip.id === "no-change") {
          addMessage("assistant", "Totally fair. Let's just track for now and revisit later.");
          finishBudget();
        } else {
          mutate({ personaAnswers: { ...userState?.personaAnswers, selectedLever: chip.id } });
          addMessage("assistant", "Do you want me to set a budget for this category?");
          mutate({ budgetStage: "budgetChoice" });
          setActiveChips(toChips(budgetAgreementChips));
        }
        break;

      case "budgetChoice":
        if (chip.id === "choose") {
          addMessage("assistant", "Pick a vibe — strict, chill, or buffer bucket?");
          mutate({ budgetStage: "budgetStyle" });
          setActiveChips(toChips(budgetStyleChips));
        } else {
          addMessage(
            "assistant",
            chip.id === "track"
              ? "Cool — I'll just track and surface insights."
              : "Done. I've set a soft budget for this category.",
          );
          mutate({ budgetStage: "actionConfirm" });
          setActiveChips([{ id: "continue", label: "Continue" }]);
        }
        break;

      case "budgetStyle":
        mutate({
          personaAnswers: { ...userState?.personaAnswers, budgetStyle: chip.id },
          budgetStyle: chip.id as "strict" | "chill" | "bucket",
          budgetStage: "actionConfirm",
        });
        storeMemoryDecision("budget_style", `User prefers ${chip.label.toLowerCase()} budget over strict`);
        addMessage(
          "assistant",
          `Locked in. I'll use the ${chip.label.toLowerCase()} budget style for this category.`,
        );
        setActiveChips([{ id: "continue", label: "Continue" }]);
        break;

      case "action":
        addMessage("assistant", "Budget updated. I'll keep it friendly.");
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
      addMessage("assistant", "All set. Want to check anything else?");
      setActiveChips(toChips(steadyStateChips));
      return;
    }
    const nextInsight = profile.insights[insightIndex % profile.insights.length];
    addMessage("assistant", nextInsight.message, "insight");
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
        handleProgressStatus(chip);
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
      addMessage("assistant", `Set up autosave at ${dailyAmount}/day?`);
      setActiveChips([
        { id: "confirm-auto", label: `Yes, ${dailyAmount}/day` },
        { id: "cancel", label: "Not now" },
      ]);
    } else if (chip.label.includes("RD")) {
      // RD suggestion from insight
      const rdAmount = profile.action.suggested_rd_month;
      addMessage("assistant", `Start an RD at ${rdAmount}/month?`);
      setActiveChips([
        { id: "confirm-rd", label: `Yes, ${rdAmount}/month` },
        { id: "other-amounts", label: "Other amounts" },
        { id: "cancel", label: "Not now" },
      ]);
    } else if (chip.label.includes("FD")) {
      // FD suggestion from insight
      addMessage("assistant", getFDSuggestion(profile));
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
      addMessage("assistant", "Got it. What else can I help with?");
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
    addMessage("assistant", "How much are we talking? Pick an amount.");
    setActiveChips(toChips(affordAmountChips));
  };

  const handleAffordAmount = (chip: ChatChip) => {
    setSubflowData((prev) => ({ ...prev, affordAmount: chip.label }));
    setHomeSubflow("afford-category");
    addMessage("assistant", "What's this for? (Helps me personalize recommendations)");
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
      addMessage("assistant", response.message);
    } else {
      // Fallback template
      let message = `CAN I AFFORD ${amount}?\n\n`;
      if (fullPicture.status === "safe") {
        message += `YES — You can afford this. ${fullPicture.is_other ? `Buffer: ${fullPicture.buffer_before} → ${fullPicture.buffer_after}.` : `${category}: ${fullPicture.spent_so_far} spent, budget ${fullPicture.category_budget}. After: ${fullPicture.total_after_spend}.`}`;
      } else if (fullPicture.status === "tight") {
        message += `TIGHT — Doable but it ${fullPicture.budget_excess ? `pushes ${category} ${fullPicture.budget_excess} over budget` : "eats into your buffer"}. Buffer: ${fullPicture.buffer_before} → ${fullPicture.buffer_after}.`;
      } else {
        message += `RISKY — This ${fullPicture.budget_excess ? `blows past your ${category} budget by ${fullPicture.budget_excess}` : "exhausts your buffer"}. Buffer: ${fullPicture.buffer_before} → ${fullPicture.buffer_after}.`;
      }
      if (fullPicture.upcoming_bills) message += `\n\nHeads up: ${fullPicture.upcoming_bills}`;
      addMessage("assistant", message);
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

      addMessage("assistant", `Got it! ${amount} approved.`);
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
      addMessage("assistant", `Reduced to ₹${reduceAmount}. That's more comfortable for your buffer.`);
      returnToSteadyState();
      return;
    }

    if (chip.id === "delay") {
      storeMemoryDecision("afford_decision", `User delayed ${amount} ${category} spend to protect buffer`);
      addMessage("assistant", "Smart move. Delaying gives your buffer time to recover.");
      returnToSteadyState();
      return;
    }

    if (chip.id === "set-cap") {
      addMessage(
        "assistant",
        `Setting a ${category} cap. This prevents repeat patterns and keeps ${goalName} on track.`
      );
      addMessage("assistant", `Suggested cap: ${formatINR(Math.floor(amountNum * 1.5))}/month for ${category}.`);
      returnToSteadyState();
      return;
    }

    if (chip.id === "alternatives") {
      setHomeSubflow("afford-alternatives");
      const preset = lookupPace(selectedPaceId);
      addMessage("assistant", `To afford ${amount} comfortably, you could:\n\n${preset.lever_examples.slice(0, 3).map((l, i) => `${i + 1}. ${l}`).join('\n')}`);
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

    addMessage("assistant", `Applied: ${chip.label}. Your buffer is now more comfortable.`);
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
      "Let's rate your recent spends. Swipe → for worth it, ← for regret, ↑ to skip.\n\n(Use chips to simulate swipe)"
    );
    if (receipts.length > 0) {
      showSwipeCard(receipts[0]);
    }
  };

  const showSwipeCard = (receipt: typeof profile.receipts[0]) => {
    const cardMessage = `${receipt.merchant || receipt.category}\n${receipt.amount}\n${receipt.time}\n\n${receipt.category}`;
    addMessage("assistant", cardMessage);
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
        addMessage("assistant", "Rate at least 5 spends to see patterns.");
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
      addMessage("assistant", "Not enough ratings yet. Keep rating spends to build insights.");
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
      addMessage("assistant", response.message);
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
      addMessage("assistant", msg || "No clear patterns yet.");
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

        addMessage("assistant", `${topRegretCat} = mostly regret. What should we do?`);
        setActiveChips([
          { id: "nudge-time", label: "Set spending alert" },
          { id: `reduce-${topRegretCat}`, label: `Reduce ${catShort} by ${cutAmount}` },
          { id: "nothing", label: "Nothing for now" },
        ]);
      } else {
        addMessage("assistant", "No clear regret patterns yet. Keep rating to build insights.");
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

        addMessage("assistant", "Which joy spending should we protect?");
        setActiveChips([
          { id: `allocate-${topJoyCat}`, label: `Allocate ${allocateAmount} for ${catShort}` },
          { id: "keep-flexible", label: "Keep flexible" },
          { id: "nothing", label: "Not now" },
        ]);
      } else {
        addMessage("assistant", "No clear joy patterns yet.");
        returnToSteadyState();
      }
    }
  };

  const handleSwipeActions = (chip: ChatChip) => {
    const goalName = goalDraft.name || profile.goal.goal_name;

    if (chip.id === "nothing" || chip.id === "keep-flexible") {
      addMessage("assistant", "Got it. I'll just track for now.");
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
      addMessage("assistant", `I'll nudge you when ${nudgeCategory} spending spikes to prevent regrets.`);
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
        addMessage("assistant", "Budget updated based on your rating patterns.");
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
        addMessage("assistant", "Joy spending protected.");
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
        addMessage("assistant", "Your spending is fairly stable — no major leaks detected! That's a good sign.");
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
        addMessage("assistant", response.message + "\n\nWas this joy or regret spending?");
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
      addMessage("assistant", "Got it. I'll check back later.");
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
      addMessage("assistant", "Let's plug this leak. Options:");
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
      addMessage("assistant", `Allocated ${formatINR(allocateAmount)}/month for ${leakCategory} (your joy category).`);
      returnToSteadyState();
      return;
    }

    if (chip.id === "no-allocate" || chip.id === "not-now") {
      storeMemoryDecision("leak_action", `User declined to address ${leakCategory} leak for now`);
      addMessage("assistant", "No worries. Let me know if you change your mind.");
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
      addMessage("assistant", `I'll alert you when ${leakCategory} spending spikes above average.`);
      returnToSteadyState();
      return;
    }

    if (chip.id === "reduce-category") {
      const newBudget = Math.max(0, leakMonthlyAvg - suggestedCut);
      const rounded = Math.ceil(newBudget / 500) * 500;
      mutate({ budgetOverrides: { [leakCategory]: rounded } });
      storeMemoryDecision("leak_action", `User reduced ${leakCategory} budget by ${formatINR(suggestedCut)} to plug leak`);
      addMessage("assistant", `Reduced ${leakCategory} budget by ${formatINR(suggestedCut)}. This plugs the leak.`);
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

    // Try AI copy for the status message
    const response = await callFlowAssist("copy", "progress-status", buildProgressContext());

    if (response?.message) {
      addMessage("assistant", response.message);
    } else {
      // Fallback template
      const progressPct = goalAmountNum > 0 ? Math.round((progressAmount / goalAmountNum) * 100) : 0;
      const timeline = goalDraft.timeline || profile.goal.horizon;
      const savingsPct = profile.persona.actual_savings_pct;
      const requiredPct = profile.goal.required_savings_pct;
      let statusMessage = `PROGRESS CHECK\n\n${goalName}: ${formatINR(progressAmount)} / ${goalAmount}\n${progressPct}% complete\n\nTimeline: ${timeline}\nPace: ${preset.label} (${preset.required_monthly_cut} cuts/month)\n\n`;
      if (isAhead) {
        statusMessage += `Status: ${daysNum} days AHEAD\n\nCurrent savings: ${savingsPct} (vs ${requiredPct} needed)\nYou're outperforming!`;
      } else if (isBehind) {
        statusMessage += `Status: ${Math.abs(daysNum)} days BEHIND\n\nCurrent savings: ${savingsPct} (vs ${requiredPct} needed)\nLet's adjust.`;
      } else {
        statusMessage += `Status: Exactly ON TRACK\n\nCurrent savings: ${savingsPct} (vs ${requiredPct} needed)\nPerfect pace!`;
      }
      addMessage("assistant", statusMessage);
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

  const handleProgressStatus = (chip: ChatChip) => {
    // This is just a fallback in case there are any chips at status stage
    returnToSteadyState();
  };

  const handleProgressAhead = async (chip: ChatChip) => {
    const preset = lookupPace(selectedPaceId);

    if (chip.id === "relax-pace") {
      const response = await callFlowAssist("copy", "progress-relax", buildProgressActionContext("relax-pace"));
      if (response?.message) {
        addMessage("assistant", response.message);
        if (response.actions.length > 0) applyFlowActions(response.actions);
      } else {
        const monthlyCut = parseINR(preset.required_monthly_cut);
        const relaxable = Math.round(monthlyCut * 0.15);
        addMessage("assistant", `You can reduce cuts by up to ${formatINR(relaxable)}/month and still hit your goal on time.`);
      }
      setActiveChips([
        { id: "apply-relax", label: "Sounds good" },
        { id: "cancel", label: "Keep current pace" },
      ]);
      return;
    }

    if (chip.id === "apply-relax") {
      storeMemoryDecision("progress_action", "User chose to relax pace after being ahead of goal");
      addMessage("assistant", "Pace relaxed. You're still on track with more breathing room.");
      returnToSteadyState();
      return;
    }

    if (chip.id === "finish-faster") {
      const response = await callFlowAssist("copy", "progress-faster", buildProgressActionContext("finish-faster"));
      if (response?.message) {
        addMessage("assistant", response.message);
        if (response.actions.length > 0) applyFlowActions(response.actions);
      } else {
        addMessage("assistant", "At this pace, you could finish 2 weeks early or increase your target.");
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
      addMessage("assistant", "Updated! Your plan now reflects your strong performance.");
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
      addMessage("assistant", "Autosave activated! Your progress is now protected.", "success");
      returnToSteadyState();
      return;
    }

    if (chip.id === "keep-as-is" || chip.id === "cancel") {
      addMessage("assistant", "Keeping your current plan. You're doing great!");
      returnToSteadyState();
    }
  };

  const handleProgressBehind = async (chip: ChatChip) => {
    const timeline = goalDraft.timeline || profile.goal.horizon;

    if (chip.id === "see-what-happened") {
      const response = await callFlowAssist("copy", "progress-diagnosis", buildProgressActionContext("see-what-happened"));

      if (response?.message) {
        addMessage("assistant", response.message);
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
        addMessage("assistant", `Spending vs budget:\n\n${lines.join("\n")}\n\n${overBudgetCats.join(" and ") || "Some categories"} went over.`);
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
        addMessage("assistant", `Reduced ${matchedCat.name} budget to ${formatINR(newBudget)}. This should help you catch up.`);
      } else {
        addMessage("assistant", "Budget updated. This should help you catch up.");
      }
      returnToSteadyState();
      return;
    }

    if (chip.id === "rate-spends") {
      addMessage("assistant", "Let's rate some spends to find patterns.");
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
      addMessage("assistant", `Timeline extended to ${chip.label}. Your pace is now more realistic.`);
      returnToSteadyState();
      return;
    }

    if (chip.id === "catch-up") {
      const response = await callFlowAssist("copy", "progress-catchup", buildProgressActionContext("catch-up"));
      if (response?.message) {
        addMessage("assistant", response.message);
        if (response.actions.length > 0) applyFlowActions(response.actions);
      } else {
        const preset = lookupPace(selectedPaceId);
        const monthlyCut = parseINR(preset.required_monthly_cut);
        const extraNeeded = Math.round(monthlyCut * 0.2);
        addMessage("assistant", `To catch up, you need ${formatINR(extraNeeded)} more in cuts this month.`);
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
      addMessage("assistant", "Budget adjusted. You're on the path to catching up!");
      returnToSteadyState();
      return;
    }

    if (chip.id === "change-goal") {
      addMessage("assistant", "Let's revisit your goal.");
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
      addMessage("assistant", `Set autosave at ₹${dailyAmount}/day to protect current pace?`);
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
      addMessage("assistant", "Autosave activated! Your pace is now protected.", "success");
      returnToSteadyState();
      return;
    }

    if (chip.id === "push-harder") {
      addMessage("assistant", "Want to increase your monthly cuts to finish faster?");
      setActiveChips([
        { id: "increase-cuts", label: "Increase cuts by ₹2k" },
        { id: "cancel", label: "Keep current" },
      ]);
      return;
    }

    if (chip.id === "increase-cuts") {
      addMessage("assistant", "Increased monthly cuts. You'll reach your goal faster!");
      returnToSteadyState();
      return;
    }

    if (chip.id === "keep-manual" || chip.id === "cancel") {
      addMessage("assistant", "Keeping things manual. I'll check in regularly.");
      returnToSteadyState();
      return;
    }

    if (chip.id === "adjust-goal") {
      addMessage("assistant", "Let's adjust your goal.");
      startGoal();
    }
  };

  // ============ UNDERSTAND MY MONEY (Educational flow) ============
  const startUnderstandFlow = () => {
    setHomeSubflow("understand-menu");
    addMessage("assistant", "Let's break down your money story. What would you like to explore?");
    setActiveChips(toChips(understandMenuChips));
  };

  const handleUnderstandMenu = async (chip: ChatChip) => {
    if (chip.id === "where-money-goes") {
      setHomeSubflow("understand-categories");
      const months = profile.dataRange.months;

      let catBreakdown = "";
      for (const cat of lifestyleCategories.slice(0, 6)) {
        catBreakdown += `• ${cat.name}: ~₹${cat.monthlyAverage.toLocaleString("en-IN")}/mo (${cat.shareOfLifestyle})\n`;
      }

      addMessage(
        "assistant",
        `YOUR MONEY MAP\n\nData: ${months} months, ${profile.dataRange.totalTransactions} transactions\nBalance: ₹${profile.accountBalance.toLocaleString("en-IN")}\n\nInvestments: ₹${profile.investmentSummary.totalInvested.toLocaleString("en-IN")} total (${profile.persona.actual_savings_pct} of income)\n\nLifestyle spending breakdown (monthly avg):\n${catBreakdown}\n${lifestyleCategories[0]?.name || "Top category"} is your biggest variable spend at ${lifestyleCategories[0]?.shareOfLifestyle || "?"}. That's where the most optimization opportunity is.`
      );
      setActiveChips(toChips(understandDrilldownChips));
      return;
    }

    if (chip.id === "my-patterns") {
      setHomeSubflow("understand-patterns");

      const response = await callFlowAssist("copy", "understand-patterns", buildPatternsContext());
      if (response?.message) {
        addMessage("assistant", response.message);
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
        patternsText += `Income variability: ~${creditCV}%\n${creditCV > 30 ? "Significant variation — plan for lean months" : "Relatively stable — good for budgeting"}\n\n`;
        patternsText += `Top spend: ${topCat?.name || "Top category"}\n${topCat?.shareOfLifestyle || "?"} of lifestyle spending (${formatINR(topCat?.monthlyAverage || 0)}/month)\n\n`;
        if (cashCat && cashCat.monthlyAverage > 0) {
          patternsText += `Cash withdrawals: ${formatINR(cashCat.monthlyAverage)}/month\n\n`;
        }
        patternsText += `These patterns aren't good or bad - they're just how your money behaves.`;
        addMessage("assistant", patternsText);
      }
      setActiveChips(toChips(understandDrilldownChips));
      return;
    }

    if (chip.id === "compare") {
      setHomeSubflow("understand-benchmarks");

      const response = await callFlowAssist("copy", "understand-benchmarks", buildBenchmarksContext());
      if (response?.message) {
        addMessage("assistant", response.message);
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
        benchText += `Savings Rate\nYou: ${savingsRate}% | Avg: 10-15% | Goal: 20%\n→ ${savingsRate >= 20 ? "Excellent! Well above average" : savingsRate >= 10 ? "On par with average" : "Below average — room to grow"}\n\n`;
        benchText += `${topCatName}\nYou: ${topCatShare}% of lifestyle | Typical: 20-30%\n→ ${topCatShare > 30 ? "Higher than typical" : topCatShare > 20 ? "Within normal range" : "Lower than typical (efficient!)"}\n\n`;
        benchText += `Lifestyle vs Income\nYou: ${lifestylePct}% | Avg: 40-60%\n→ ${lifestylePct > 60 ? "High — consider trimming" : lifestylePct > 40 ? "Within normal range" : "Lean lifestyle spending"}\n\n`;
        benchText += `Benchmarks are guides, not rules. What matters is whether you're hitting YOUR goals.`;
        addMessage("assistant", benchText);
      }
      setActiveChips(toChips(understandDrilldownChips));
      return;
    }

    if (chip.id === "personality") {
      setHomeSubflow("understand-personality");

      const response = await callFlowAssist("copy", "understand-personality", buildPersonalityContext());
      if (response?.message) {
        addMessage("assistant", response.message);
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
        addMessage("assistant", personalityText);
      }
      setActiveChips(toChips(understandActionChips));
    }
  };

  const handleUnderstandCategories = (chip: ChatChip) => {
    if (chip.id === "back") {
      startUnderstandFlow();
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
      addMessage("assistant", "Let's dive into your Food & Delivery spending.");
      setActiveChips([{ id: "rate-food", label: "Rate Food spends" }, { id: "back", label: "Back" }]);
      return;
    }

    if (chip.id === "see-patterns") {
      setHomeSubflow("understand-patterns");
      handleUnderstandMenu({ id: "my-patterns", label: "My spending patterns" });
      return;
    }

    if (chip.id === "rate-food") {
      addMessage("assistant", "Let's rate your Food spends to find what's worth it.");
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
      addMessage("assistant", "You're already viewing your patterns!");
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
      addMessage("assistant", `Great choice! Let's set up: ${chip.label}`);
      returnToSteadyState();
      return;
    }

    if (chip.id === "done-learning") {
      addMessage("assistant", "Hope that helped! Let me know what else I can do.");
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
        addMessage("assistant", "Done. I'll nudge you before similar spends.");
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
      addMessage("assistant", getTradeoffPrompt(chip.id));
      setActiveChips(toChips(tradeoffChoiceChips));
      return;
    }

    if (tradeoffStep === "decision") {
      const rule =
        profile.tradeoff_rules.bucket_options.find(
          (option) => option.id === subflowData.tradeoffRule,
        ) ?? profile.tradeoff_rules.bucket_options[0];
      if (chip.id === "reduce-elsewhere") {
        addMessage("assistant", rule.reduce_elsewhere);
      } else {
        addMessage("assistant", rule.extend_timeline);
      }
      returnToSteadyState();
    }
  };

  // ============ MAIN CHIP HANDLER ============
  const handleChipSelect = (chip: ChatChip) => {
    switch (step) {
      case "persona":
        break;
      case "reality":
        handleRealityChip(chip);
        break;
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

  // ============ RESET ============
  const resetFlow = () => {
    if (abortRef.current) abortRef.current.abort();
    resetState(); // Resets all persistent state (step, stages, overrides, etc.)
    // Reset transient local state
    setHomeSubflow("idle");
    setPaceStage("summary");
    setLocalGoalDraft({});
    setLocalPaceId("balanced");
    setLocalSavingsForGoal(0);
    setSubflowData({});
    setReceiptsOpen(false);
    setInsightIndex(0);
    setDynamicPacePresets(profile.pace_presets);
    setAiMessages([]);
    setIsStreaming(false);
    setStreamingText("");
    setSwipeIndex(0);
    setSwipeQueue([]);
    welcomeShownRef.current = false;
    // Load directly into chat initial screen
    mutate({ currentStep: "home" });
  };

  useEffect(() => {
    if (!isHydrated || launchResetDoneRef.current) return;
    launchResetDoneRef.current = true;
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setActiveChips([]);
    setHomeSubflow("idle");
    setPaceStage("summary");
    setLocalGoalDraft({});
    setLocalPaceId("balanced");
    setLocalSavingsForGoal(0);
    setSubflowData({});
    setReceiptsOpen(false);
    setInsightIndex(0);
    setDynamicPacePresets(profile.pace_presets);
    setAiMessages([]);
    setIsStreaming(false);
    setStreamingText("");
    setSwipeIndex(0);
    setSwipeQueue([]);
    setIsAgentProcessingGlow(false);

    // Load directly into chat (design-exploration: skip wrapped/persona story).
    mutate({ currentStep: "home" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  useEffect(() => {
    if (step !== "persona") return;
    hydratePersonaDraftFromState(userState?.personaAnswers || {}, personaStage);
  }, [hydratePersonaDraftFromState, personaStage, step, userState?.personaAnswers]);

  // ============ DRAWER CONTENT ============
  const receiptsDrawer = receiptsOpen ? (
    <div className="space-y-2">
      <p className="font-medium text-zinc-900">Recent transactions</p>
      {profile.receipts.map((r) => (
        <p key={r.id} className="text-zinc-600">
          {r.time} · {r.category} · {r.amount} {r.merchant && `· ${r.merchant}`}
        </p>
      ))}
    </div>
  ) : null;

  // ============ PINNED GOAL ============
  const pinnedGoal =
    step === "home" || (step === "budget" && budgetStage !== "digest") ? (
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50">
          <svg className="h-5 w-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-zinc-900">
            {goalDraft.name || profile.goal.goal_name}
          </p>
          <p className="text-xs text-zinc-500">
            {goalDraft.amount || profile.goal.goal_amount} · {goalDraft.timeline || profile.goal.horizon} · {lookupPace(selectedPaceId).label}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-xs font-medium text-emerald-700">{profile.goal.days_ahead_behind}</p>
          <p className="text-[10px] text-zinc-400">on track</p>
        </div>
      </div>
    ) : null;

  // ============ RENDER ============
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef0f2] px-4 py-6 text-zinc-900">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute bottom-8 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-white/50 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[360px]">
        <div className="mb-3 flex items-center justify-end gap-2 px-2">
          <div className="mr-auto text-xs font-medium text-zinc-500">slice Banker</div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetFlow}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-zinc-600 transition-all duration-200 hover:border-zinc-300 hover:text-zinc-900 hover:bg-zinc-50 active:scale-95"
            >
              Restart
            </button>
            <button
              onClick={resetUser}
              className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-red-600 transition-all duration-200 hover:border-red-300 hover:bg-red-50 active:scale-95"
            >
              New User
            </button>
          </div>
        </div>

        <div className="relative rounded-[46px] bg-[#111214] p-[8px] shadow-[0_28px_70px_rgba(0,0,0,0.16),0_6px_18px_rgba(0,0,0,0.08)] ring-1 ring-black/10">
          <div className="pointer-events-none absolute -left-[3px] top-[120px] h-14 w-[3px] rounded-full bg-zinc-700/80" />
          <div className="pointer-events-none absolute -left-[3px] top-[188px] h-20 w-[3px] rounded-full bg-zinc-700/80" />
          <div className="pointer-events-none absolute -right-[3px] top-[170px] h-24 w-[3px] rounded-full bg-zinc-700/80" />
          <div className="relative z-10 aspect-[393/852] w-full overflow-hidden rounded-[38px] bg-white">
            {step === "home" && messages.length === 0 ? (
              <ChatInitialScreen
                suggestions={defaultSuggestions}
                onSuggestionClick={(id, title) => {
                  handleChipSelect({ id, label: title });
                }}
                onSubmit={handleChatSubmit}
              />
            ) : (
            <>
              <div
                className={`pointer-events-none absolute inset-0 z-0 rounded-[38px] phone-screen-processing-band ${
                  isAgentProcessingGlow ? "is-active" : ""
                }`}
                aria-hidden="true"
              />
              <div className="relative z-10 m-[8px] h-[calc(100%-16px)] overflow-hidden rounded-[30px] bg-white">
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-12 bg-gradient-to-b from-white/70 to-transparent" />
                <Chat
                  title="slice"
                  subtitle={`${profile.label}`}
                  messages={messages}
                  chips={activeChips}
                  onChipSelect={handleChipSelect}
                  showInput={step === "home" || (step === "goal" && (goalStage === "choice" || goalStage === "savings" || goalStage === "budget-review"))}
                  inputPlaceholder={step === "home" ? "Ask me anything about your money..." : goalStage === "budget-review" ? "e.g. 'reduce cash withdrawals to ₹10k'" : goalStage === "savings" ? "e.g. ₹5L" : "Type your goal..."}
                  onSubmit={step === "home" ? handleChatSubmit : handleGoalInput}
                  isStreaming={isStreaming}
                  streamingText={streamingText}
                  onProcessingStateChange={setIsAgentProcessingGlow}
                  drawerContent={receiptsDrawer}
                  pinnedContent={pinnedGoal}
                  headerActions={[
                    {
                      id: "receipts",
                      label: "Receipts",
                      onClick: () => setReceiptsOpen((prev) => !prev),
                      active: receiptsOpen,
                    },
                  ]}
                />
              </div>
            </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
