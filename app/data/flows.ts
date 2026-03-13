export type ChipOption = {
  id: string;
  label: string;
  value?: string;
};

export type WrappedSlide = {
  id: string;
  headline: string;
  punchline: string;
  stat?: {
    label: string;
    value: string;
    caption?: string;
  };
  receipts?: boolean;
};

export type PersonaQuestion = {
  id: string;
  text: string;
  chips: ChipOption[];
  multiSelect?: boolean;
  followUp?: PersonaQuestion;
};

// ============ PERSONA QUESTIONS ============
export const personaQuestions: PersonaQuestion[] = [
  {
    id: "q1-savings",
    text: "Honestly, how much do you save each month?",
    chips: [
      { id: "0-5", label: "0–5%", value: "0-5%" },
      { id: "5-10", label: "5–10%", value: "5-10%" },
      { id: "10-20", label: "10–20%", value: "10-20%" },
      { id: "20-plus", label: "20%+", value: "20%+" },
      { id: "no-idea", label: "No idea", value: "unknown" },
    ],
  },
  {
    id: "q2-disposable",
    text: "Once bills are paid, where does your money go?",
    chips: [
      { id: "food", label: "Food", value: "Food" },
      { id: "shopping", label: "Shopping", value: "Shopping" },
      { id: "travel", label: "Travel", value: "Travel" },
      { id: "subs", label: "Subscriptions", value: "Subscriptions" },
      { id: "nights-out", label: "Nights out", value: "Nights out" },
      { id: "other", label: "Other", value: "Other" },
    ],
    multiSelect: false,
  },
  {
    id: "q2-followup",
    text: "What's your best guess on how much?",
    chips: [
      { id: "10", label: "10%", value: "10%" },
      { id: "20", label: "20%", value: "20%" },
      { id: "30", label: "30%", value: "30%" },
      { id: "40", label: "40%+", value: "40%+" },
      { id: "no-idea", label: "No idea", value: "unknown" },
    ],
  },
  {
    id: "q3-persona",
    text: "How would you describe yourself?",
    chips: [
      { id: "disciplined", label: "Disciplined", value: "Disciplined" },
      { id: "weekend", label: "Weekend splurger", value: "Weekend splurger" },
      { id: "impulse", label: "Impulse buyer", value: "Impulse buyer" },
      { id: "convenience", label: "Convenience spender", value: "Convenience spender" },
      { id: "subs", label: "Subscription collector", value: "Subscription collector" },
      { id: "complicated", label: "I'm complicated", value: "Complicated" },
    ],
  },
  {
    id: "q4-confidence",
    text: "How sure are you about all that?",
    chips: [
      { id: "very", label: "Very", value: "very" },
      { id: "somewhat", label: "Somewhat", value: "somewhat" },
      { id: "guessing", label: "Guessing", value: "guessing" },
    ],
  },
];

// ============ GOAL SETTING ============
export const goalChips: ChipOption[] = [
  { id: "trip", label: "Trip", value: "Trip" },
  { id: "big-purchase", label: "Big purchase", value: "Big purchase" },
  { id: "emergency", label: "Emergency fund", value: "Emergency fund" },
  { id: "increase-savings", label: "Increase monthly savings", value: "Increase monthly savings" },
];

export const timelineChips: ChipOption[] = [
  { id: "3m", label: "3 months", value: "3 months" },
  { id: "6m", label: "6 months", value: "6 months" },
  { id: "1y", label: "1 year", value: "12 months" },
];

export const amountChips: ChipOption[] = [
  { id: "50k", label: "₹50k", value: "₹50k" },
  { id: "1l", label: "₹1L", value: "₹1L" },
  { id: "5l", label: "₹5L", value: "₹5L" },
  { id: "10l", label: "₹10L", value: "₹10L" },
  { id: "skip", label: "Not sure", value: "Not set" },
];

export const paceChoiceChips: ChipOption[] = [
  { id: "aggressive", label: "Aggressive" },
  { id: "balanced", label: "Balanced" },
  { id: "relaxed", label: "Relaxed" },
];

export const paceContinueChips: ChipOption[] = [
  { id: "continue", label: "Continue to plan" },
  { id: "tweak-pace", label: "Change pace" },
];

export const budgetReviewChips: ChipOption[] = [
  { id: "approve-budget", label: "Looks good" },
  { id: "edit-budget", label: "Edit budgets" },
];

export const pinnedGoalChips: ChipOption[] = [
  { id: "show-plan", label: "Show plan" },
  { id: "adjust-goal", label: "Adjust goal" },
  { id: "add-goal", label: "Add a second goal" },
];

// ============ BUDGET / PLAN HANDSHAKE ============
export const budgetDigestChips: ChipOption[] = [
  { id: "ok-pace", label: "I'm okay with this pace" },
  { id: "cut", label: "Show me what to cut" },
  { id: "soft-plan", label: "Show me a softer plan" },
];

export const onTrackChips: ChipOption[] = [
  { id: "auto", label: "Make it automatic" },
  { id: "keep-posted", label: "Just keep me posted" },
  { id: "backup", label: "Set a backup buffer" },
];

export const budgetAgreementChips: ChipOption[] = [
  { id: "yes-set", label: "Yes, set it" },
  { id: "track", label: "No, just track" },
  { id: "choose", label: "Let me choose" },
];

export const budgetStyleChips: ChipOption[] = [
  { id: "strict", label: "Strict" },
  { id: "chill", label: "Chill" },
  { id: "bucket", label: "Buffer bucket" },
];

// ============ STEADY STATE ============
export const steadyStateChips: ChipOption[] = [
  { id: "afford", label: "Can I afford…" },
  { id: "worth", label: "Rate my spends" },
  { id: "progress", label: "Progress" },
  { id: "understand", label: "Understand my money" },
];

// ============ SUBFLOW: CAN I AFFORD ============
export const affordAmountChips: ChipOption[] = [
  { id: "amt-500", label: "₹500" },
  { id: "amt-1500", label: "₹1,500" },
  { id: "amt-3000", label: "₹3,000" },
  { id: "amt-5000", label: "₹5,000" },
  { id: "amt-custom", label: "Other amount" },
];

// ============ SUBFLOW: LEAKS ============
export const leakFixChips: ChipOption[] = [
  { id: "cap", label: "Set a cap" },
  { id: "bucket", label: "Update buffer" },
  { id: "nudge", label: "Nudge before" },
  { id: "mute", label: "Mute this" },
];

// ============ SUBFLOW: TRADEOFF ============
export const tradeoffChoiceChips: ChipOption[] = [
  { id: "reduce-elsewhere", label: "Reduce elsewhere" },
  { id: "extend-timeline", label: "Extend goal timeline" },
];

// ============ NEW: UNDERSTAND MY MONEY ============
export const understandMenuChips: ChipOption[] = [
  { id: "where-money-goes", label: "Where does my money go?" },
  { id: "my-patterns", label: "My spending patterns" },
  { id: "compare", label: "How do I compare?" },
  { id: "personality", label: "My money personality" },
];

export const understandActionChips: ChipOption[] = [
  { id: "apply-strategies", label: "Apply these strategies" },
  { id: "done-learning", label: "Done learning" },
  { id: "explore-more", label: "Explore more" },
];

export const understandDrilldownChips: ChipOption[] = [
  { id: "why-matters", label: "Why does this matter?" },
  { id: "explore-category", label: "Explore this category" },
  { id: "see-patterns", label: "See my patterns" },
  { id: "back", label: "Back" },
];

// ============ DYNAMIC BUILDERS ============

export type ComputedStats = {
  months: number;
  totalTransactions: number;
  topCategory: string;
  topCategoryAmount: string;
  topCategoryShare: string;
  smallTxnCount: number;
  smallTxnDays: number;
  weekendPct: number;
  weekendTotal: string;
  foodTotal: string;
  foodOrders: number;
  foodAvg: string;
};

export function buildWrappedSlides(stats: ComputedStats): WrappedSlide[] {
  return [
    {
      id: "wrapped-1",
      headline: "Your money wrapped",
      punchline: `${stats.months} months analyzed. ${stats.totalTransactions} transactions. Here's what you need to see.`,
    },
    {
      id: "wrapped-2",
      headline: stats.topCategory,
      punchline: "Your biggest lifestyle spend.",
      stat: {
        label: "",
        value: stats.topCategoryAmount,
        caption: `${stats.topCategoryShare} of your lifestyle spending over ${stats.months} months`,
      },
    },
    {
      id: "wrapped-3",
      headline: "Death by a thousand cuts",
      punchline: `${stats.smallTxnCount} purchases under ₹500. Each felt like nothing.`,
      stat: {
        label: "",
        value: `${stats.smallTxnDays} days`,
        caption: "Of your average monthly income gone on small spends",
      },
    },
    {
      id: "wrapped-4",
      headline: "Weekend warrior?",
      punchline: `Weekends account for ${stats.weekendPct}% of your lifestyle spending.`,
      stat: {
        label: "",
        value: stats.weekendTotal,
        caption: `Total weekend spending over ${stats.months} months`,
      },
    },
    {
      id: "wrapped-5",
      headline: "Food & delivery",
      punchline: `${stats.foodOrders} orders, avg ${stats.foodAvg} each.`,
      stat: {
        label: "",
        value: stats.foodTotal,
        caption: "Swiggy + Instamart + Dineout combined",
      },
    },
    {
      id: "wrapped-6",
      headline: "Ready for reality?",
      punchline: "Tell me what you think you do. Then I'll show you the receipts.",
    },
  ];
}

export function buildDynamicAffordCategoryChips(categories: string[]): ChipOption[] {
  const chips: ChipOption[] = categories.slice(0, 4).map((cat, i) => ({
    id: `cat-${i}`,
    label: cat,
    value: cat,
  }));
  chips.push({ id: "other", label: "Other", value: "Other" });
  return chips;
}
