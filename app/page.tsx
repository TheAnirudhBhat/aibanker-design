"use client";

import { useCallback, useState } from "react";
import Chat, { type ChatChip, type ChatMessage } from "./components/Chat";
import WrappedCarousel from "./components/WrappedCarousel";
import {
  affordAmountChips,
  affordCategoryChips,
  affordContextualChips,
  affordOutcomeChips,
  affordPlanChips,
  affordTreatChips,
  affordTimingChips,
  amountChips,
  autosaveAmountChips,
  budgetAgreementChips,
  budgetDigestChips,
  budgetLevers,
  budgetReviewChips,
  budgetStyleChips,
  confirmChips,
  fdAmountChips,
  goalChips,
  leakFixChips,
  leakJoyRegretChips,
  leakSuspects,
  onTrackChips,
  patternActionChips,
  personaQuestions,
  paceChoiceChips,
  paceContinueChips,
  pinnedGoalChips,
  powerUpTypeChips,
  progressAdjustChips,
  progressBoostChips,
  rdAmountChips,
  realityChips,
  regretActionChips,
  regretReasonChips,
  steadyStateChips,
  swipeActionChips,
  tradeoffChoiceChips,
  timelineChips,
  understandActionChips,
  understandDrilldownChips,
  understandMenuChips,
  worthItChips,
  wrappedSlides,
  type ChipOption,
} from "./data/flows";
import {
  getAffordOutcome,
  getAutosaveSuggestion,
  getBudgetDigestText,
  getFDSuggestion,
  getOffTrackText,
  getOnTrackText,
  getGoalCompletionAction,
  getPacePreset,
  getProgressSummary,
  getRDSuggestion,
  getRealityCheckText,
} from "./data/mockProfiles";
import { defaultProfileId, getProfileById } from "./data/profiles";

// Flow steps
type FlowStep = "wrapped" | "persona" | "reality" | "goal" | "budget" | "home";

// Sub-states for each step
type PersonaStage = "q1" | "q2" | "q2-follow" | "q3" | "q4";
type GoalStage = "choice" | "timeline" | "amount" | "pace" | "budget-review" | "product" | "pinned";
type BudgetStage = "digest" | "onTrack" | "lever" | "budgetChoice" | "budgetStyle" | "action" | "actionConfirm";
type HomeSubflow =
  | "idle"
  | "afford-amount"
  | "afford-category"
  | "afford-fullpicture"
  | "afford-alternatives"
  | "swipe-rating"
  | "swipe-patterns"
  | "swipe-actions"
  | "progress-status"
  | "progress-ahead"
  | "progress-behind"
  | "progress-ontrack"
  | "understand-menu"
  | "understand-categories"
  | "understand-patterns"
  | "understand-benchmarks"
  | "understand-personality"
  | "leak-insight"
  | "leak-investigate"
  | "leak-solution"
  | "tradeoff";
type PaceStage = "summary" | "select";

const profile = getProfileById(defaultProfileId);

export default function Home() {
  // Core state
  const [step, setStep] = useState<FlowStep>("wrapped");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeChips, setActiveChips] = useState<ChatChip[]>([]);

  // Sub-step states
  const [personaStage, setPersonaStage] = useState<PersonaStage>("q1");
  const [goalStage, setGoalStage] = useState<GoalStage>("choice");
  const [budgetStage, setBudgetStage] = useState<BudgetStage>("digest");
  const [homeSubflow, setHomeSubflow] = useState<HomeSubflow>("idle");
  const [paceStage, setPaceStage] = useState<PaceStage>("summary");

  // User responses
  const [userResponses, setUserResponses] = useState<Record<string, string>>({});
  const [goalDraft, setGoalDraft] = useState<{ name?: string; timeline?: string; amount?: string }>({});
  const [subflowData, setSubflowData] = useState<Record<string, string>>({});
  const [selectedPaceId, setSelectedPaceId] = useState<"aggressive" | "balanced" | "relaxed">("balanced");

  // UI state
  const [receiptsOpen, setReceiptsOpen] = useState(false);
  const [insightIndex, setInsightIndex] = useState(0);

  // Pattern learning and swipe interface state
  type SpendRating = {
    txn_id: string;
    category: string;
    amount: string;
    timestamp: Date;
    time_of_day: "morning" | "afternoon" | "evening" | "late_night";
    day_of_week: string;
    rating: "worth" | "regret" | "meh";
    rated_at: Date;
  };
  const [spendRatings, setSpendRatings] = useState<SpendRating[]>([]);
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [swipeQueue, setSwipeQueue] = useState<typeof profile.receipts>([]);

  // Buffer tracking (single buffer system)
  const [bufferRemaining, setBufferRemaining] = useState(
    parseInt(profile.suggested_budgets.buffer_bucket.replace(/[₹,k]/g, "")) * 1000
  );

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

  const getDefaultPaceId = (timeline?: string) => {
    if (!timeline) return "balanced";
    if (timeline === "3 months" || timeline === "6 months") return "aggressive";
    if (timeline === "12 months") return "balanced";
    return "relaxed";
  };

  const getPaceSummary = (paceId: "aggressive" | "balanced" | "relaxed") => {
    const preset = getPacePreset(profile, paceId);
    return (
      `Pace: ${preset.label} (${preset.pace_window})\n` +
      `To make this real, you'd need to cut about ${preset.required_monthly_cut}/month.\n\n` +
      `${preset.feasibility_note}\n\n` +
      `Top ways to pull it off:\n` +
      preset.lever_examples.map((item) => `• ${item}`).join("\n") +
      `\n\nSuggested action: ${preset.recommended_product.label}\n` +
      preset.recommended_product.copy
    );
  };


  const getLeverReviewText = (paceId: "aggressive" | "balanced" | "relaxed") => {
    const preset = getPacePreset(profile, paceId);
    const goalName = goalDraft.name || profile.goal.goal_name;
    return (
      `If you want the ${preset.label.toLowerCase()} pace for ${goalName}, here are the most realistic levers:\n` +
      preset.lever_examples.map((item) => `• ${item}`).join("\n")
    );
  };

  const getGoalProductText = (paceId: "aggressive" | "balanced" | "relaxed") => {
    const action = getGoalCompletionAction(profile, paceId);
    return `${action.headline}\n${action.copy}`;
  };


  const getGoalProductChips = (paceId: "aggressive" | "balanced" | "relaxed"): ChatChip[] => {
    const action = getGoalCompletionAction(profile, paceId);
    return [
      { id: "product-primary", label: action.primary_cta, variant: "success" },
      { id: "product-secondary", label: action.secondary_cta },
      { id: "product-change-pace", label: "Change pace" },
      { id: "product-skip", label: "Skip for now" },
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
    const preset = getPacePreset(profile, selectedPaceId);
    const requiredMonthlyCut = parseInt(preset.required_monthly_cut.replace(/[₹,k]/g, "")) * 1000;
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
    const impact = calculateGoalImpact(amount);
    const pattern = detectSpendingPattern(category, amount);
    const newBuffer = bufferRemaining - amount;
    const upcomingBills = profile.action.bill_risk_event;

    let status: "safe" | "tight" | "risky";
    if (amount <= bufferRemaining * 0.5 && impact.days_impact <= 1) {
      status = "safe";
    } else if (amount <= bufferRemaining && impact.days_impact <= 3) {
      status = "tight";
    } else {
      status = "risky";
    }

    const formatAmount = (amt: number) => `₹${(amt / 1000).toFixed(1)}k`;

    return {
      status,
      buffer_before: formatAmount(bufferRemaining),
      buffer_after: formatAmount(newBuffer),
      goal_impact: impact.message,
      upcoming_bills: upcomingBills,
      pattern: pattern.detected ? pattern.message : null,
      recent_similar: pattern.count,
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
    setStep("persona");
    setPersonaStage("q1");
    setMessages([
      { id: "persona-intro", role: "assistant", text: "Alright, let's see how well you know yourself." },
      { id: "persona-q1", role: "assistant", text: personaQuestions[0].text },
    ]);
    setActiveChips(toChips(personaQuestions[0].chips));
  };

  // ============ PERSONA FLOW ============
  const handlePersonaChip = (chip: ChatChip) => {
    addMessage("user", chip.label);

    // Store response
    setUserResponses((prev) => ({ ...prev, [personaStage]: chip.id }));

    // Determine next stage
    const stages: PersonaStage[] = ["q1", "q2", "q2-follow", "q3", "q4"];
    const currentIdx = stages.indexOf(personaStage);

    if (currentIdx >= stages.length - 1) {
      // Done with persona - go to reality check
      startReality();
      return;
    }

    const nextStage = stages[currentIdx + 1];
    setPersonaStage(nextStage);

    // Find the question for the next stage
    const questionMap: Record<PersonaStage, number> = {
      "q1": 0,
      "q2": 1,
      "q2-follow": 2,
      "q3": 3,
      "q4": 4,
    };

    const question = personaQuestions[questionMap[nextStage]];
    addMessage("assistant", question.text);
    setActiveChips(toChips(question.chips));
  };

  const startReality = () => {
    setStep("reality");
    
    const realityText = getRealityCheckText(profile, {
      savingsGuess: userResponses["q1"] || undefined,
      personaGuess: userResponses["q3"] || undefined,
    });

    addMessage("assistant", realityText, "reality-check");
    setActiveChips(toChips(realityChips));
  };

  // ============ REALITY FLOW ============
  const handleRealityChip = (chip: ChatChip) => {
    addMessage("user", chip.label);
    setUserResponses((prev) => ({ ...prev, realityChoice: chip.id }));
    startGoal();
  };

  // ============ GOAL FLOW ============
  const startGoal = () => {
    setStep("goal");
    setGoalStage("choice");
    addMessage("assistant", "Now tell me what we're building toward. Pick one or type your own.");
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
    setGoalDraft((prev) => ({ ...prev, name: value }));
    addMessage("user", value);
    addMessage("assistant", "When do you want this by?");
    setGoalStage("timeline");
    setActiveChips(toChips(timelineChips));
  };

  const handleGoalTimeline = (chip: ChatChip) => {
    const timeline = chip.label;
    setGoalDraft((prev) => ({ ...prev, timeline }));
    addMessage("user", timeline);
    addMessage("assistant", "If you know the amount, drop it. Or skip.");
    setGoalStage("amount");
    setActiveChips(toChips(amountChips));
  };

  const handleGoalAmount = (chip: ChatChip) => {
    const amount = chip.id === "skip" ? "Not set" : chip.label;
    setGoalDraft((prev) => ({ ...prev, amount }));
    addMessage("user", chip.label);

    const paceId = getDefaultPaceId(goalDraft.timeline);
    setSelectedPaceId(paceId);
    setGoalStage("pace");
    setPaceStage("summary");
    addMessage("assistant", getPaceSummary(paceId));
    setActiveChips(toChips(paceContinueChips));
  };

  const showBudgetReview = () => {
    setGoalStage("budget-review");
    const budgets = profile.suggested_budgets;
    const budgetText = 
      `Based on your last few months, I've set up these budgets:\n\n` +
      `Overall monthly budget: ${budgets.overall_budget}\n` +
      `Buffer bucket (miscellaneous): ${budgets.buffer_bucket}\n\n` +
      `Category budgets:\n` +
      budgets.categories.map((cat) => `• ${cat.name}: ${cat.budget}`).join("\n") +
      `\n\nThis keeps you on track for your goal. Any edits?`;
    addMessage("assistant", budgetText);
    setActiveChips(toChips(budgetReviewChips));
  };

  const handleBudgetReviewChip = (chip: ChatChip) => {
    if (chip.id === "approve-budget") {
      addMessage("user", chip.label);
      addMessage("assistant", getGoalProductText(selectedPaceId));
      setGoalStage("product");
      setActiveChips(getGoalProductChips(selectedPaceId));
      return;
    }

    if (chip.id === "edit-budget") {
      addMessage("user", chip.label);
      addMessage(
        "assistant",
        "Type your edit (e.g., 'update Food to ₹10k' or 'update buffer to ₹5k'):"
      );
      setGoalStage("budget-review");
      // In a real implementation, we'd handle free text input here
      // For now, we'll just go back to review
      setTimeout(() => {
        addMessage("assistant", "Got it. Budgets updated.");
        addMessage("assistant", getGoalProductText(selectedPaceId));
        setGoalStage("product");
        setActiveChips(getGoalProductChips(selectedPaceId));
      }, 100);
    }
  };

  const handlePaceChip = (chip: ChatChip) => {
    if (paceStage === "summary") {
      if (chip.id === "continue") {
        addMessage("assistant", getLeverReviewText(selectedPaceId));
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
        setSelectedPaceId(chip.id);
        setPaceStage("summary");
        addMessage("assistant", getPaceSummary(chip.id));
        setActiveChips(toChips(paceContinueChips));
      }
    }
  };

  const handleGoalProductChip = (chip: ChatChip) => {
    if (chip.id === "product-change-pace") {
      setGoalStage("pace");
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
      const action = getGoalCompletionAction(profile, selectedPaceId);
      const eta = goalDraft.timeline || profile.goal.horizon;
      const goalName = goalDraft.name || profile.goal.goal_name;
      addMessage(
        "assistant",
        `${action.headline} is now active.\n\nYou'll hit ${goalName} in ${eta}.`,
        "success",
      );
    } else if (chip.id === "product-skip") {
      const eta = goalDraft.timeline || profile.goal.horizon;
      const goalName = goalDraft.name || profile.goal.goal_name;
      addMessage(
        "assistant",
        `No worries. At your current pace, you'll hit ${goalName} in ${eta}. You can set up automation anytime.`,
      );
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
      setGoalStage("choice");
      setActiveChips(toChips(goalChips));
      return;
    }
    if (chip.id === "add-goal") {
      addMessage("assistant", "You can add more goals later. For now, let's nail this one first.");
      setActiveChips(toChips(pinnedGoalChips));
    }
  };

  const handleGoalInput = (value: string) => {
    if (step !== "goal" || goalStage !== "choice") return;
    handleGoalChoice(value);
  };

  // ============ BUDGET FLOW ============
  const startBudget = () => {
    setStep("budget");
    setBudgetStage("digest");
    const preset = getPacePreset(profile, selectedPaceId);
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
          const preset = getPacePreset(profile, selectedPaceId);
        if (chip.id === "ok-pace") {
          addMessage(
            "assistant",
            `You're on track for the ${preset.label.toLowerCase()} pace. Want to keep it steady with a small system?`,
          );
          setBudgetStage("onTrack");
          setActiveChips(toChips(onTrackChips));
        } else {
          addMessage(
            "assistant",
            `To hit the ${preset.label.toLowerCase()} pace, we need to free up about ${preset.required_monthly_cut}/month. Pick one lever that feels realistic:`,
          );
          setBudgetStage("lever");
          setActiveChips(toChips(budgetLevers));
        }
        break;
        }

      case "onTrack":
        if (chip.id === "auto" || chip.id === "backup") {
          addMessage(
            "assistant",
            "Want me to set a soft budget so weekends don't derail the goal?",
          );
          setBudgetStage("budgetChoice");
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
          setUserResponses((prev) => ({ ...prev, selectedLever: chip.id }));
          addMessage("assistant", "Do you want me to set a budget for this category?");
          setBudgetStage("budgetChoice");
          setActiveChips(toChips(budgetAgreementChips));
        }
        break;

      case "budgetChoice":
        if (chip.id === "choose") {
          addMessage("assistant", "Pick a vibe — strict, chill, or buffer bucket?");
          setBudgetStage("budgetStyle");
          setActiveChips(toChips(budgetStyleChips));
        } else {
          addMessage(
            "assistant",
            chip.id === "track"
              ? "Cool — I'll just track and surface insights."
              : "Done. I've set a soft budget for this category.",
          );
          setBudgetStage("actionConfirm");
          setActiveChips([{ id: "continue", label: "Continue" }]);
        }
        break;

      case "budgetStyle":
        setUserResponses((prev) => ({ ...prev, budgetStyle: chip.id }));
        addMessage(
          "assistant",
          `Locked in. I'll use the ${chip.label.toLowerCase()} budget style for this category.`,
        );
        setBudgetStage("actionConfirm");
        setActiveChips([{ id: "continue", label: "Continue" }]);
        break;

      case "action":
        addMessage("assistant", "Budget updated. I'll keep it friendly.");
        setBudgetStage("actionConfirm");
        setActiveChips([{ id: "continue", label: "Continue" }]);
        break;

      case "actionConfirm":
        finishBudget();
        break;
    }
  };

  const finishBudget = (options?: { skipInsight?: boolean }) => {
    setStep("home");
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
    setActiveChips(toChips(affordCategoryChips));
  };

  const handleAffordCategory = (chip: ChatChip) => {
    const amount = subflowData.affordAmount || "₹1,500";
    const category = chip.value === "Skip" ? "General" : chip.value || "General";
    const amountNum = parseInt(amount.replace(/[₹,]/g, ""));

    setSubflowData((prev) => ({ ...prev, affordCategory: category }));
    setHomeSubflow("afford-fullpicture");

    // Get full picture analysis
    const fullPicture = getAffordFullPicture(amountNum, category);

    // Display full picture
    let message = `CAN I AFFORD ${amount}?\n\n`;

    if (fullPicture.status === "safe") {
      message += `✓ YES - here's the full picture:\n\n`;
    } else if (fullPicture.status === "tight") {
      message += `⚠ TIGHT - here's the full picture:\n\n`;
    } else {
      message += `⚠ RISKY - here's the full picture:\n\n`;
    }

    message += `💰 Your buffer: ${fullPicture.buffer_before} → ${fullPicture.buffer_after} after\n`;
    message += `📊 Goal impact: ${fullPicture.goal_impact}\n`;
    if (fullPicture.upcoming_bills) {
      message += `🚨 Upcoming: ${fullPicture.upcoming_bills}\n`;
    }
    if (fullPicture.pattern) {
      message += `📈 ${fullPicture.pattern}\n`;
    }

    addMessage("assistant", message);

    // Offer contextual options based on status
    if (fullPicture.status === "safe") {
      addMessage("assistant", "You're good to go!");
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
      // Risky
      if (fullPicture.pattern) {
        setActiveChips([
          { id: "go-anyway", label: "Go for it anyway" },
          { id: "set-cap", label: `Set ${category} cap` },
          { id: "alternatives", label: "Show alternatives" },
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
    }

    setSubflowData((prev) => ({
      ...prev,
      affordStatus: fullPicture.status,
      affordAmountNum: amountNum,
    }));
  };

  const handleAffordFullPicture = (chip: ChatChip) => {
    const amount = subflowData.affordAmount || "₹1,500";
    const amountNum = subflowData.affordAmountNum || 1500;
    const category = subflowData.affordCategory || "General";
    const goalName = goalDraft.name || profile.goal.goal_name;

    if (chip.id === "go-for-it" || chip.id === "go-anyway") {
      // Update buffer
      setBufferRemaining((prev) => prev - amountNum);
      const impact = calculateGoalImpact(amountNum);

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
      setBufferRemaining((prev) => prev - reduceAmount);
      addMessage("assistant", `Reduced to ₹${reduceAmount}. That's more comfortable for your buffer.`);
      returnToSteadyState();
      return;
    }

    if (chip.id === "delay") {
      addMessage("assistant", "Smart move. Delaying gives your buffer time to recover.");
      returnToSteadyState();
      return;
    }

    if (chip.id === "set-cap") {
      addMessage(
        "assistant",
        `Setting a ${category} cap. This prevents repeat patterns and keeps ${goalName} on track.`
      );
      const preset = getPacePreset(profile, selectedPaceId);
      addMessage("assistant", `Suggested cap: ₹${Math.floor(amountNum * 1.5)}/month for ${category}.`);
      returnToSteadyState();
      return;
    }

    if (chip.id === "alternatives") {
      setHomeSubflow("afford-alternatives");
      const preset = getPacePreset(profile, selectedPaceId);
      addMessage("assistant", `To afford ${amount} comfortably, you could:\n\n${preset.lever_examples.slice(0, 3).map((l, i) => `${i + 1}. ${l}`).join('\n')}`);
      setActiveChips([
        { id: "trim-food", label: preset.lever_examples[0] },
        { id: "trim-shopping", label: preset.lever_examples[1] },
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
    // Load last 10 unrated receipts
    const unrated = profile.receipts.slice(0, Math.min(10, profile.receipts.length));
    setSwipeQueue(unrated);
    setSwipeIndex(0);
    setHomeSubflow("swipe-rating");
    addMessage(
      "assistant",
      "Let's rate your recent spends. Swipe → for worth it, ← for regret, ↑ to skip.\n\n(Use chips to simulate swipe)"
    );
    if (unrated.length > 0) {
      showSwipeCard(unrated[0]);
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

      const newRating: SpendRating = {
        txn_id: currentReceipt.id,
        category: currentReceipt.category,
        amount: currentReceipt.amount,
        timestamp: new Date(),
        time_of_day,
        day_of_week: currentReceipt.time.split(" ")[0] || "Unknown",
        rating,
        rated_at: new Date(),
      };

      setSpendRatings((prev) => [...prev, newRating]);
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

  const analyzeSwipePatterns = () => {
    setHomeSubflow("swipe-patterns");

    // Analyze patterns from ratings
    const lateNightRatings = spendRatings.filter((r) => r.time_of_day === "late_night");
    const lateNightRegrets = lateNightRatings.filter((r) => r.rating === "regret").length;
    const lateNightTotal = lateNightRatings.length;

    const categoryRatings: Record<string, { worth: number; regret: number; meh: number; total: number }> =
      {};
    spendRatings.forEach((r) => {
      if (!categoryRatings[r.category]) {
        categoryRatings[r.category] = { worth: 0, regret: 0, meh: 0, total: 0 };
      }
      categoryRatings[r.category][r.rating]++;
      categoryRatings[r.category].total++;
    });

    let patternsMessage = "PATTERNS DETECTED 🔍\n\n";
    let hasPatterns = false;

    // Late-night pattern
    if (lateNightTotal >= 3 && lateNightRegrets / lateNightTotal >= 0.6) {
      hasPatterns = true;
      const totalAmount = lateNightRatings.reduce(
        (sum, r) => sum + parseInt(r.amount.replace(/[₹,]/g, "")),
        0
      );
      patternsMessage += `📉 REGRET PATTERN\nLate-night spends (after 10pm)\n${lateNightRegrets} out of ${lateNightTotal} rated as regret\nTotal: ₹${(totalAmount / 1000).toFixed(1)}k last week\n\n`;
    }

    // Category patterns
    Object.entries(categoryRatings).forEach(([cat, ratings]) => {
      if (ratings.total >= 3) {
        if (ratings.worth / ratings.total >= 0.7) {
          hasPatterns = true;
          patternsMessage += `📈 JOY PATTERN\n${cat}\n${ratings.worth} out of ${ratings.total} rated as worth it\n\n`;
        } else if (ratings.regret / ratings.total >= 0.7) {
          hasPatterns = true;
          patternsMessage += `📉 REGRET PATTERN\n${cat}\n${ratings.regret} out of ${ratings.total} rated as regret\n\n`;
        }
      }
    });

    if (!hasPatterns) {
      patternsMessage = "No clear patterns yet. Keep rating spends to build insights.";
      addMessage("assistant", patternsMessage);
      returnToSteadyState();
      return;
    }

    addMessage("assistant", patternsMessage);
    addMessage("assistant", "Want to optimize based on these patterns?");
    setActiveChips([
      { id: "optimize-regrets", label: "Fix regret patterns" },
      { id: "protect-joy", label: "Protect joy patterns" },
      { id: "not-now", label: "Not now" },
    ]);
  };

  const handleSwipePatterns = (chip: ChatChip) => {
    if (chip.id === "not-now") {
      returnToSteadyState();
      return;
    }

    setHomeSubflow("swipe-actions");

    if (chip.id === "optimize-regrets") {
      const lateNightRegrets = spendRatings.filter(
        (r) => r.time_of_day === "late_night" && r.rating === "regret"
      );
      if (lateNightRegrets.length >= 3) {
        addMessage(
          "assistant",
          "Late-night delivery = mostly regret. What should we do?"
        );
        setActiveChips([
          { id: "nudge-time", label: "Nudge after 10pm" },
          { id: "reduce-food", label: "Reduce Food budget by ₹2k" },
          { id: "nothing", label: "Nothing for now" },
        ]);
      } else {
        addMessage("assistant", "Let's reduce the regret category budget.");
        setActiveChips([
          { id: "reduce-food", label: "Reduce Food by ₹2k" },
          { id: "reduce-shopping", label: "Reduce Shopping by ₹2k" },
          { id: "nothing", label: "Nothing for now" },
        ]);
      }
    } else if (chip.id === "protect-joy") {
      addMessage("assistant", "Which joy spending should we protect?");
      setActiveChips([
        { id: "allocate-weekend", label: "Allocate ₹2k for weekend shopping" },
        { id: "keep-flexible", label: "Keep flexible" },
        { id: "nothing", label: "Not now" },
      ]);
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
      addMessage("assistant", "I'll nudge you before late-night orders to prevent regrets.");
      returnToSteadyState();
      return;
    }

    if (chip.id === "reduce-food" || chip.id === "reduce-shopping") {
      const category = chip.id === "reduce-food" ? "Food & Delivery" : "Shopping";
      const oldBudget = category === "Food & Delivery" ? "₹8k" : "₹5k";
      const newBudget = category === "Food & Delivery" ? "₹6k" : "₹3k";

      addMessage(
        "assistant",
        `UPDATED YOUR PLAN ✓\n\nReduced ${category}: ${oldBudget} → ${newBudget}\n(Trimming regret patterns)\n\nGoal impact:\nYou're now 4 days AHEAD on ${goalName}\n(was 2 days ahead)`
      );
      returnToSteadyState();
      return;
    }

    if (chip.id === "allocate-weekend") {
      addMessage(
        "assistant",
        `Allocated ₹2k/month for weekend shopping (your joy category).\n\nThis protects what you value while keeping ${goalName} on track.`
      );
      returnToSteadyState();
      return;
    }

    returnToSteadyState();
  };

  // ============ LEAK INSIGHTS (System-initiated, not user chip) ============
  const handleLeakInsight = (chip: ChatChip) => {
    if (chip.id === "investigate") {
      setHomeSubflow("leak-investigate");
      addMessage(
        "assistant",
        `Here's what I found:\n\n• 5 late-night orders (after 10pm)\n• Total: ₹1,820 last week\n• Usual: ₹900/week average\n• Impact: 3 days behind on your goal\n\nWas this joy or regret spending?`
      );
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

    if (chip.id === "joy") {
      addMessage(
        "assistant",
        "Fair enough! Want to budget for late-night joy?\n\nAllocate ₹2k/month for late-night delivery?"
      );
      setActiveChips([
        { id: "allocate", label: "Yes, allocate ₹2k" },
        { id: "no-allocate", label: "No, I'll cut it" },
      ]);
      return;
    }

    if (chip.id === "regret" || chip.id === "mixed") {
      addMessage("assistant", "Let's plug this leak. Options:");
      setActiveChips([
        { id: "nudge-time", label: "Nudge after 10pm" },
        { id: "reduce-food", label: "Reduce Food by ₹2k" },
        { id: "not-now", label: "Not now" },
      ]);
    }
  };

  const handleLeakSolution = (chip: ChatChip) => {
    if (chip.id === "allocate") {
      addMessage("assistant", "Allocated ₹2k/month for late-night delivery (your joy category).");
      returnToSteadyState();
      return;
    }

    if (chip.id === "no-allocate" || chip.id === "not-now") {
      addMessage("assistant", "No worries. Let me know if you change your mind.");
      returnToSteadyState();
      return;
    }

    if (chip.id === "nudge-time") {
      addMessage("assistant", "I'll nudge you before late-night orders to prevent regrets.");
      returnToSteadyState();
      return;
    }

    if (chip.id === "reduce-food") {
      addMessage("assistant", "Reduced Food budget by ₹2k. This plugs the leak.");
      returnToSteadyState();
    }
  };

  // ============ SUBFLOW: PROGRESS (REDESIGNED with ahead/behind/on-track paths) ============
  const startProgressFlow = () => {
    setHomeSubflow("progress-status");
    const goalName = goalDraft.name || profile.goal.goal_name;
    const goalAmount = goalDraft.amount || profile.goal.goal_amount;
    const timeline = goalDraft.timeline || profile.goal.horizon;
    const pace = getPacePreset(profile, selectedPaceId).label;
    const daysStatus = profile.goal.days_ahead_behind;
    const savingsPct = profile.goal.current_savings_pct;
    const requiredPct = profile.goal.required_savings_pct;

    // Parse days ahead/behind
    const daysNum = parseInt(daysStatus.replace(/[~\s]/g, "").split(" ")[0]) || 0;
    const isAhead = daysStatus.includes("ahead");
    const isBehind = daysStatus.includes("behind");

    let statusMessage = `PROGRESS CHECK 📊\n\n${goalName}: ₹2.8L / ${goalAmount}\n28% complete\n\nTimeline: ${timeline}\nPace: ${pace} (${getPacePreset(profile, selectedPaceId).required_monthly_cut} cuts/month)\n\n`;

    if (isAhead) {
      statusMessage += `Status: ${daysNum} days AHEAD ✓\n\nCurrent savings: ${savingsPct} (vs ${requiredPct} needed)\nYou're outperforming!`;
      addMessage("assistant", statusMessage);
      addMessage("assistant", "You're ahead of pace! Want to make a change?");
      setHomeSubflow("progress-ahead");
      setActiveChips([
        { id: "relax-pace", label: "Relax my pace" },
        { id: "finish-faster", label: "Finish faster" },
        { id: "lock-it", label: "Lock it in" },
        { id: "keep-as-is", label: "Keep as is" },
      ]);
    } else if (isBehind) {
      statusMessage += `Status: ${Math.abs(daysNum)} days BEHIND ⚠️\n\nCurrent savings: ${savingsPct} (vs ${requiredPct} needed)\nLet's adjust.`;
      addMessage("assistant", statusMessage);
      addMessage("assistant", `You're ${Math.abs(daysNum)} days behind pace. What would you like to do?`);
      setHomeSubflow("progress-behind");
      setActiveChips([
        { id: "see-what-happened", label: "See what happened" },
        { id: "adjust-timeline", label: "Adjust timeline" },
        { id: "catch-up", label: "Help me catch up" },
        { id: "change-goal", label: "Change my goal" },
      ]);
    } else {
      statusMessage += `Status: Exactly ON TRACK ✓\n\nCurrent savings: ${savingsPct} (vs ${requiredPct} needed)\nPerfect pace!`;
      addMessage("assistant", statusMessage);
      addMessage("assistant", "You're exactly on track! Want to protect this pace?");
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

  const handleProgressAhead = (chip: ChatChip) => {
    const goalName = goalDraft.name || profile.goal.goal_name;
    const preset = getPacePreset(profile, selectedPaceId);

    if (chip.id === "relax-pace") {
      addMessage(
        "assistant",
        `You can reduce cuts by up to ₹1.5k/month and still hit your goal on time.\n\nOptions to ease your pace:\n• Add back ₹1k to Food budget (₹6k → ₹7k)\n• Add back ₹500 to Entertainment\n\nWhich would you like?`
      );
      setActiveChips([
        { id: "add-food", label: "Add ₹1k to Food" },
        { id: "add-entertainment", label: "Add ₹500 to Entertainment" },
        { id: "cancel", label: "Keep current pace" },
      ]);
      return;
    }

    if (chip.id === "add-food" || chip.id === "add-entertainment") {
      const category = chip.id === "add-food" ? "Food" : "Entertainment";
      const amount = chip.id === "add-food" ? "₹1k" : "₹500";
      addMessage("assistant", `Added ${amount} back to ${category}. Your pace is now more relaxed while staying on track.`);
      returnToSteadyState();
      return;
    }

    if (chip.id === "finish-faster") {
      addMessage(
        "assistant",
        `At this pace, you could finish 2 weeks early. Or increase your target?\n\nOptions:\n• Finish by [2 weeks early]\n• Increase target to ₹11L\n• Split: 1 week early + ₹10.5L target`
      );
      setActiveChips([
        { id: "finish-early", label: "Finish 2 weeks early" },
        { id: "increase-target", label: "Increase to ₹11L" },
        { id: "split", label: "Split the difference" },
        { id: "cancel", label: "Keep current" },
      ]);
      return;
    }

    if (chip.id === "finish-early" || chip.id === "increase-target" || chip.id === "split") {
      addMessage("assistant", `Updated! Your new goal timeline reflects your strong performance.`);
      returnToSteadyState();
      return;
    }

    if (chip.id === "lock-it") {
      const dailyAmount = Math.floor(
        (parseInt(preset.required_monthly_cut.replace(/[₹,k]/g, "")) * 1000) / 30
      );
      addMessage(
        "assistant",
        `Turn on ₹${dailyAmount}/day autosave? (Based on your current pace)\n\nThis protects your progress automatically.`
      );
      setActiveChips([
        { id: "confirm-auto", label: `Yes, ₹${dailyAmount}/day` },
        { id: "adjust-amount", label: "Adjust amount" },
        { id: "cancel", label: "Cancel" },
      ]);
      return;
    }

    if (chip.id === "confirm-auto") {
      addMessage("assistant", "Autosave activated! Your progress is now protected.", "success");
      returnToSteadyState();
      return;
    }

    if (chip.id === "keep-as-is" || chip.id === "cancel") {
      addMessage("assistant", "Keeping your current plan. You're doing great!");
      returnToSteadyState();
    }
  };

  const handleProgressBehind = (chip: ChatChip) => {
    const goalName = goalDraft.name || profile.goal.goal_name;
    const timeline = goalDraft.timeline || profile.goal.horizon;

    if (chip.id === "see-what-happened") {
      addMessage(
        "assistant",
        `Here's your spending vs budgets last month:\n\n• Food & Delivery: ₹8.5k (budget: ₹6k) 🔴 +₹2.5k over\n• Shopping: ₹6k (budget: ₹5k) 🟡 +₹1k over\n• Entertainment: ₹2k (budget: ₹2k) ✓ On track\n\nFood and Shopping went over. Want to fix these?`
      );
      setActiveChips([
        { id: "tighten-food", label: "Tighten Food budget" },
        { id: "rate-spends", label: "Rate recent spends" },
        { id: "adjust-timeline", label: "Adjust timeline instead" },
        { id: "back", label: "Back" },
      ]);
      return;
    }

    if (chip.id === "tighten-food") {
      addMessage("assistant", "Reduced Food budget to ₹7k. This should help you catch up.");
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
      const months = chip.label;
      addMessage("assistant", `Timeline extended to ${months}. Your pace is now more realistic.`);
      returnToSteadyState();
      return;
    }

    if (chip.id === "catch-up") {
      const preset = getPacePreset(profile, selectedPaceId);
      addMessage(
        "assistant",
        `To catch up, you need ₹1.7k more in cuts this month.\n\nOptions:\n1. ${preset.lever_examples[0]}\n2. ${preset.lever_examples[1]}\n3. One-time budget boost`
      );
      setActiveChips([
        { id: "lever-1", label: preset.lever_examples[0] },
        { id: "lever-2", label: preset.lever_examples[1] },
        { id: "boost", label: "One-time boost" },
        { id: "cancel", label: "Not now" },
      ]);
      return;
    }

    if (chip.id === "lever-1" || chip.id === "lever-2" || chip.id === "boost") {
      addMessage("assistant", `Applied: ${chip.label}. You're back on track!`);
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
    const preset = getPacePreset(profile, selectedPaceId);

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

  const handleUnderstandMenu = (chip: ChatChip) => {
    if (chip.id === "where-money-goes") {
      setHomeSubflow("understand-categories");
      const budgets = profile.suggested_budgets;
      const income = "₹60k"; // Could be from profile
      addMessage(
        "assistant",
        `YOUR MONEY MAP 💰\n\nIncome: ${income}/month\n\nFixed (50%): ₹30k\n• Rent: ₹15k\n• Bills: ₹5k\n• EMIs: ₹10k\n\nVariable (42%): ₹25k\n• Food & Delivery: ₹8k (32%)\n• Shopping: ₹5k (20%)\n• Entertainment: ₹3k (12%)\n• Transport: ₹3k (12%)\n• Subscriptions: ₹1.5k (6%)\n• Other: ₹4.5k (18%)\n\nSavings (8%): ₹5k\n• Goal fund: ₹3k\n• Buffer: ₹2k\n\nFood & Delivery is your biggest variable spend at 32%. That's pretty common for city dwellers.`
      );
      setActiveChips(toChips(understandDrilldownChips));
      return;
    }

    if (chip.id === "my-patterns") {
      setHomeSubflow("understand-patterns");
      addMessage(
        "assistant",
        `YOUR PATTERNS 📈\n\n🌙 Late-night spender\n68% of your Food & Delivery happens after 10pm (₹5.4k/month)\n→ This is often convenience-driven\n\n🎉 Weekend warrior\nFridays-Sundays account for 45% of your Shopping (₹2.2k/week)\n→ Social context influences this\n\n💳 Card preference\nYou use Credit Card for 80% of discretionary spends\n→ Delayed payment = less friction\n\n📊 Savings habit\nYour savings rate: 8%\nIt varies between 5-12% monthly\n→ Inconsistent = need automation\n\nThese patterns aren't good or bad - they're just how your money behaves. Understanding them helps you make better choices.`
      );
      setActiveChips(toChips(understandDrilldownChips));
      return;
    }

    if (chip.id === "compare") {
      setHomeSubflow("understand-benchmarks");
      addMessage(
        "assistant",
        `BENCHMARKS 📊\n\nSavings Rate\nYou: 8% | Avg: 10-15% | Goal: 20%\n→ You're slightly below average\n\nFood & Delivery\nYou: 32% | Avg: 20-25%\n→ Higher than typical\n\nFixed Costs\nYou: 50% | Avg: 40-50% | Ideal: <40%\n→ Within normal range\n\nSubscriptions\nYou: 6% | Avg: 8-12%\n→ Lower than typical (good!)\n\nBenchmarks are guides, not rules. What matters is whether you're hitting YOUR goals.`
      );
      setActiveChips(toChips(understandDrilldownChips));
      return;
    }

    if (chip.id === "personality") {
      setHomeSubflow("understand-personality");
      addMessage(
        "assistant",
        `YOUR MONEY PERSONALITY 🎭\n\nYou're a "Weekend Splurger"\n\nTraits:\n• Disciplined Mon-Thu\n• Loosen up Fri-Sun\n• Social spending triggers you\n• Prefer flexibility over budgets\n\nStrengths:\n✓ Can control spending when needed\n✓ Value experiences over things\n✓ Self-aware about patterns\n\nGrowth areas:\n• Weekend spends add up fast\n• Hard to say no in social settings\n• Savings inconsistent\n\nBest strategies for your type:\n• Set weekend spending cap\n• Automate savings before weekend\n• Plan one low-cost weekend/month`
      );
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
        setHomeSubflow("leaks-fix");
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
        handlePersonaChip(chip);
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
    setStep("wrapped");
    setMessages([]);
    setActiveChips([]);
    setPersonaStage("q1");
    setGoalStage("choice");
    setBudgetStage("digest");
    setHomeSubflow("idle");
    setPaceStage("summary");
    setUserResponses({});
    setGoalDraft({});
    setSubflowData({});
    setReceiptsOpen(false);
    setInsightIndex(0);
    setSelectedPaceId("balanced");
  };

  // ============ DRAWER CONTENT ============
  const receiptsDrawer = receiptsOpen ? (
    <div className="space-y-2">
      <p className="text-white/90 font-medium">Recent transactions</p>
      {profile.receipts.map((r) => (
        <p key={r.id} className="text-white/60">
          {r.time} · {r.category} · {r.amount} {r.merchant && `· ${r.merchant}`}
        </p>
      ))}
    </div>
  ) : null;

  // ============ PINNED GOAL ============
  const pinnedGoal =
    step === "home" || (step === "budget" && budgetStage !== "digest") ? (
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {goalDraft.name || profile.goal.goal_name}
          </p>
          <p className="text-xs text-white/50">
            {goalDraft.amount || profile.goal.goal_amount} · {goalDraft.timeline || profile.goal.horizon} · {getPacePreset(profile, selectedPaceId).label}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-xs font-medium text-emerald-400">{profile.goal.days_ahead_behind}</p>
          <p className="text-[10px] text-white/40">on track</p>
        </div>
      </div>
    ) : null;

  // ============ RENDER ============
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-6 text-white">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px] rounded-[36px] border border-white/10 bg-zinc-950/80 p-3 shadow-[0_25px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        {/* Device frame header */}
        <div className="mb-3 flex items-center justify-between px-2 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500/60 animate-pulse" />
            <span className="font-medium">slice Banker</span>
          </div>
          <button
            onClick={resetFlow}
            className="rounded-full border border-white/10 px-3 py-1.5 text-white/60 hover:border-white/30 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-95"
          >
            Restart
          </button>
        </div>

        {/* Main content */}
        <div className="h-[700px]">
          {step === "wrapped" ? (
            <WrappedCarousel slides={wrappedSlides} onComplete={handleWrappedComplete} />
          ) : (
            <Chat
              title="slice"
              subtitle={`${profile.label}`}
              messages={messages}
              chips={activeChips}
              onChipSelect={handleChipSelect}
              showInput={step === "goal" && goalStage === "choice"}
              inputPlaceholder="Type your goal..."
              onSubmit={handleGoalInput}
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
          )}
        </div>
      </div>
    </div>
  );
}
