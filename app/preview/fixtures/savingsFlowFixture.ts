import type { ChatCardData } from "../../components/ChatCards";
import type { PlanStep } from "../../components/PlanMode";
import type { Question } from "../../components/QuestionnaireOverlay";

// ── Types ───────────────────────────────────────────────────────

export type SimMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  card?: ChatCardData;
};

// ── Questionnaire questions ─────────────────────────────────────

export const GOAL_QUESTIONS: Question[] = [
  {
    id: "goal-type",
    text: "What are you saving toward?",
    options: [
      { id: "trip", label: "Trip" },
      { id: "big-purchase", label: "Big purchase" },
      { id: "emergency", label: "Emergency fund" },
      { id: "increase-savings", label: "Increase monthly savings" },
    ],
  },
  {
    id: "destination",
    text: "Where are you headed?",
    options: [],
  },
  {
    id: "timeline",
    text: "By when?",
    options: [
      { id: "3m", label: "3 months" },
      { id: "6m", label: "6 months" },
      { id: "1y", label: "12 months" },
    ],
  },
  {
    id: "amount",
    text: "How much do you need?",
    options: [
      { id: "50k", label: "₹50k" },
      { id: "1L", label: "₹1L" },
      { id: "2L", label: "₹2L" },
      { id: "5L", label: "₹5L" },
    ],
  },
];

// ── Pre-loaded messages ─────────────────────────────────────────

export const INITIAL_MESSAGES: SimMessage[] = [
  { id: "u1", role: "user", text: "Help me set up a savings goal" },
  { id: "a1", role: "assistant", text: "I'd love to help you get started! Let me ask you a few quick questions." },
];

// ── Clarifying questions (post-questionnaire, one at a time) ────

export type ClarifyingQuestion = {
  id: string;
  /** The bot message before showing chips */
  botText: string;
  /** Chip options for the user to pick from */
  chips: { id: string; label: string }[];
  /** Which plan step this answer completes */
  completesStep: string;
  /** Value to show in the plan step once completed */
  stepValue: string;
};

export const CLARIFYING_QUESTIONS: ClarifyingQuestion[] = [
  {
    id: "cq-obligations",
    botText: "I can see a few recurring obligations - rent, car EMI, subscriptions. Should I account for all of them or just the essentials?",
    chips: [
      { id: "all", label: "All of them" },
      { id: "essentials", label: "Just essentials" },
    ],
    completesStep: "obligations",
    stepValue: "All included",
  },
  {
    id: "cq-existing",
    botText: "You have about ₹50k in existing investments. Want to count that toward this goal?",
    chips: [
      { id: "yes", label: "Yes, include that" },
      { id: "no", label: "No, start fresh" },
    ],
    completesStep: "review",
    stepValue: "₹50k counted",
  },
  {
    id: "cq-risk",
    botText: "One more - how do you feel about risk? This helps me pick the right instrument.",
    chips: [
      { id: "safe", label: "Keep it safe" },
      { id: "balanced", label: "Balanced" },
      { id: "aggressive", label: "I can take some risk" },
    ],
    completesStep: "crunch",
    stepValue: "Low risk",
  },
];

// ── PlanMode step definitions ───────────────────────────────────

export const ALL_PLAN_STEPS = [
  { id: "gather", label: "Gathering preferences" },
  { id: "obligations", label: "Checking obligations" },
  { id: "review", label: "Reviewing finances" },
  { id: "crunch", label: "Crunching the numbers" },
  { id: "build", label: "Building your plan" },
];

/** Build a PlanStep[] snapshot given which steps are completed */
export function buildPlanSteps(completedStepIds: string[]): PlanStep[] {
  let foundActive = false;
  return ALL_PLAN_STEPS.map((s): PlanStep => {
    if (completedStepIds.includes(s.id)) {
      return { ...s, status: "completed" };
    }
    if (!foundActive) {
      foundActive = true;
      return { ...s, status: "active" };
    }
    return { ...s, status: "pending" };
  });
}

/** Fully completed steps */
export const PLAN_STEPS_COMPLETE: PlanStep[] = ALL_PLAN_STEPS.map((s): PlanStep => ({
  ...s, status: "completed",
}));

// ── Final plan summary (shown in expanded PlanMode) ─────────────

export const FINAL_PLAN_SUMMARY = {
  goalName: "Increase monthly savings",
  monthlySavings: "₹25,000/month",
  instrument: "Recurring Deposit @ 7.25% p.a.",
  tenure: "6 months",
  existingInvestments: "₹50,000 counted",
  projectedTotal: "₹2,01,875",
};

// ── Verbose plan reply (shown as a regular chat bubble once the cruncher finishes) ──
// Written to simulate what a real, unstructured model response might look like - long,
// conversational, not a neat 1-2-3 list. Replaces the plan-summary card in the cruncher.

export const VERBOSE_PLAN_TEXT = `Alright - here's what I'd put together based on what you shared.

You're aiming for ₹2L by October, which gives us about six months. With ₹50,000 already saved and some room to redirect spending, this is very doable without anything drastic.

Here's how I'd split it. First, open a Recurring Deposit at 7.25% p.a. for six months with ₹20,000 going in every month. I'm picking an RD over a regular savings account because the rate is nearly double and the auto-debit makes it easier to stay consistent. Over six months that alone compounds to about ₹1,23,000.

Next, move your existing ₹50,000 into the same RD upfront so it starts earning the same rate immediately - by October that parks at roughly ₹51,875.

Finally, trim around ₹5,000/month from discretionary spending. Looking at the last three months, you're averaging about ₹8,000/month on eating out and subscriptions, so there's comfortable room here without cutting anything essential. That adds another ₹30,000 over the six months.

Stacked together, you land at roughly ₹2,04,875 by October - a small buffer over your goal.

A few things worth knowing: the RD locks in your 7.25% rate, so even if rates drop later you're protected. If something unexpected comes up and you need to pull money out early, you can break it - though you'd lose a bit of accrued interest. I'll also set up a heads-up two weeks before each auto-debit in case you want to pause a month.

Want me to go ahead and set this up, or would you like to tweak any piece of it first?`;
