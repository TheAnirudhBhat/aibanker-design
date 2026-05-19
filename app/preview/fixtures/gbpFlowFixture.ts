/**
 * GBP Flow Fixture - Hardcoded data for the Goal-Budget Planning simulation.
 *
 * Mirrors real bank data shapes but with designer-friendly values.
 * All copy follows the GBP spec verbatim (verdict closing lines are fixed).
 */

import type { SimMessage } from "./savingsFlowFixture";
import type { ChatCardData } from "../../components/ChatCards";
import type {
  FootprintBucket,
  LadderOption,
  CategoryBudget,
  ShortfallAction,
  MergeOption,
} from "../../lib/types";

// ── User story entry states ────────────────────────────────────────

export type GBPStory =
  | "clean-start"        // Story 1: no goal, no pool
  | "goal-exists"        // Story 2: active goal, user wants more
  | "pool-exists"        // Story 3: active pool, user wants a goal
  | "both-exist"         // Story 4: cap reached
  | "impossible-amount"  // Story 5: user picks too high
  | "cashflow-blocked";  // Story 6: income ≤ obligations

export const STORY_LABELS: Record<GBPStory, string> = {
  "clean-start": "Clean start",
  "goal-exists": "Goal exists",
  "pool-exists": "Pool exists",
  "both-exist": "Both exist",
  "impossible-amount": "Impossible amount",
  "cashflow-blocked": "Cashflow blocked",
};

// ── Footprint buckets (fixture data) ───────────────────────────────

export const FOOTPRINT_BUCKETS: FootprintBucket[] = [
  {
    bucketType: "income",
    title: "Income sources",
    description: "Here's what I see coming in regularly. Confirm what's accurate so I can build your plan on solid numbers.",
    items: [
      { id: "inc-1", label: "Wipro salary", amount: 72000, type: "salary", frequency: "monthly", confirmed: false },
      { id: "inc-2", label: "Dad (family help)", amount: 10000, type: "family", frequency: "monthly", confirmed: false },
    ],
  },
  {
    bucketType: "obligations",
    title: "Obligations",
    description: "These are your committed monthly expenses. Anything missing or wrong?",
    items: [
      { id: "obl-1", label: "Rent", amount: 15000, type: "rent", frequency: "monthly", confirmed: false },
      { id: "obl-2", label: "Car EMI", amount: 8000, type: "EMI", frequency: "monthly", confirmed: false },
      { id: "obl-3", label: "Netflix", amount: 199, type: "subscription", frequency: "monthly", confirmed: false },
      { id: "obl-4", label: "Spotify", amount: 119, type: "subscription", frequency: "monthly", confirmed: false },
      { id: "obl-5", label: "SIP (Groww)", amount: 5000, type: "SIP", frequency: "monthly", confirmed: false },
    ],
  },
  {
    bucketType: "p2p",
    title: "P2P transfers",
    description: "You're moving meaningful amounts with these people. Confirming means I'll treat the net amount as a recurring flow.",
    items: [
      { id: "p2p-1", label: "Roommate (rent split back)", amount: 5000, type: "p2p", frequency: "monthly", confirmed: false },
    ],
  },
  {
    bucketType: "sporadic-income",
    title: "Sporadic income",
    description: "These look like one-offs, not something to plan around monthly. Flag any that are actually recurring.",
    items: [
      { id: "si-1", label: "Tax refund (Mar)", amount: 12000, type: "refund", frequency: "one-off", confirmed: false },
    ],
  },
  {
    bucketType: "sporadic-expense",
    title: "Sporadic expenses",
    description: "These look like one-offs, not something to plan around monthly. Flag any that are actually recurring.",
    items: [
      { id: "se-1", label: "Doctor visit (Feb)", amount: 3000, type: "medical", frequency: "one-off", confirmed: false },
      { id: "se-2", label: "Laptop repair (Jan)", amount: 4500, type: "repair", frequency: "one-off", confirmed: false },
    ],
  },
];

// ── Confirm-list widget data per bucket ────────────────────────────
// Maps FootprintBucket items → confirm-list shape (label → payee)

export const BUCKET_CONFIRM_INCOME: ChatCardData = {
  type: "confirm-list",
  label: "Income sources",
  items: [
    { id: "inc-1", payee: "Wipro salary", amount: 72000, type: "Salary" },
    { id: "inc-2", payee: "Dad (family help)", amount: 10000, type: "Family" },
  ],
};

export const BUCKET_CONFIRM_OBLIGATIONS: ChatCardData = {
  type: "confirm-list",
  label: "Obligations",
  items: [
    { id: "obl-1", payee: "Rent", amount: 15000, type: "Rent" },
    { id: "obl-2", payee: "Car EMI", amount: 8000, type: "EMI" },
    { id: "obl-3", payee: "Netflix", amount: 199, type: "Subscription" },
    { id: "obl-4", payee: "Spotify", amount: 119, type: "Subscription" },
    { id: "obl-5", payee: "SIP (Groww)", amount: 5000, type: "SIP" },
  ],
};

export const BUCKET_CONFIRM_P2P: ChatCardData = {
  type: "confirm-list",
  label: "P2P transfers",
  items: [
    { id: "p2p-1", payee: "Roommate (rent split back)", amount: 5000, type: "P2P" },
  ],
};

export const BUCKET_CONFIRM_OTHERS: ChatCardData = {
  type: "confirm-list",
  label: "One-off items",
  items: [
    { id: "si-1", payee: "Tax refund", amount: 12000, type: "Refund", subtext: "Mar" },
    { id: "se-1", payee: "Doctor visit", amount: 3000, type: "Medical", subtext: "Feb" },
    { id: "se-2", payee: "Laptop repair", amount: 4500, type: "Repair", subtext: "Jan" },
  ],
};

export const BUCKET_CONFIRM_LIST = [
  BUCKET_CONFIRM_INCOME,
  BUCKET_CONFIRM_OBLIGATIONS,
  BUCKET_CONFIRM_P2P,
  BUCKET_CONFIRM_OTHERS,
];

// ── Savings ladder options ─────────────────────────────────────────

export const LADDER_OPTIONS: LadderOption[] = [
  {
    tier: "comfortable",
    monthlyAmount: 5000,
    description: "This is what you can save without changing a thing.",
    categoryCuts: 0,
  },
  {
    tier: "realistic",
    monthlyAmount: 12000,
    description: "Doable with a couple of small tightens.",
    categoryCuts: 2,
  },
  {
    tier: "stretch",
    monthlyAmount: 20000,
    description: "Ambitious. Some months will feel tight.",
    categoryCuts: 4,
  },
];

// ── Category budgets (for spending plan) ───────────────────────────

export const CATEGORY_BUDGETS: CategoryBudget[] = [
  { name: "Food & dining", cap: 8000, currentSpend: 9000, isBiggestCut: false },
  { name: "Transport", cap: 3000, currentSpend: 5000, isBiggestCut: true },
  { name: "Shopping", cap: 4000, currentSpend: 4500, isBiggestCut: false },
  { name: "Subscriptions", cap: 1200, currentSpend: 1200, isBiggestCut: false },
  { name: "Groceries", cap: 3500, currentSpend: 3000, isBiggestCut: false },
  { name: "Misc", cap: 2300, currentSpend: 2100, isBiggestCut: false },
];

// ── Shortfall actions ──────────────────────────────────────────────

export const SHORTFALL_SKIP: ShortfallAction = {
  option: "skip",
  message: "Food overspent ₹4k. You've got buffer in HDFC, no impact on trip.",
};

export const SHORTFALL_REDUCE: ShortfallAction = {
  option: "reduce-next",
  message: "Food overspent ₹4k. Drop next month's trip contribution to ₹21k? Trip slips ~1 month.",
  impact: "Trip slips ~1 month",
};

export const SHORTFALL_WITHDRAW: ShortfallAction = {
  option: "withdraw",
  message: "Food overspent ₹4k. Rent due in 3 days, both accounts short. Pull ₹4k from trip pot? Trip slips ~1 month.",
  impact: "Trip slips ~1 month",
};

// ── Merge options ──────────────────────────────────────────────────

export const MERGE_SOFT: MergeOption = {
  flavor: "soft",
  description: "Pool pauses. Monthly contribution redirects to goal. Pool balance stays put.",
  reversible: true,
};

export const MERGE_HARD: MergeOption = {
  flavor: "hard",
  description: "Pool dissolves. Balance moves into goal (head start). Contribution redirects to goal.",
  reversible: false,
};

// ── Chip sets ──────────────────────────────────────────────────────

export const TIER_CHIPS = [
  { id: "comfortable", label: "Comfortable" },
  { id: "realistic", label: "Realistic" },
  { id: "stretch", label: "Stretch" },
];

export const RATE_CHIP = { id: "rate", label: "Save X% of income" };

export const VERDICT_PROCEED_CHIPS = [
  { id: "proceed", label: "Let's do it" },
  { id: "adjust", label: "Adjust" },
];

export const INFEASIBLE_CHIPS = [
  { id: "lower", label: "Lower amount" },
  { id: "extend", label: "Extend timeline" },
];

export const DESTINATION_CHIPS = [
  { id: "goal", label: "Yes, saving toward something" },
  { id: "pool", label: "No, just save more" },
];

export const MERGE_CHIPS = [
  { id: "keep-both", label: "Keep both running" },
  { id: "soft-merge", label: "Pause pool, redirect" },
  { id: "hard-merge", label: "Dissolve pool into goal" },
];

export const SHORTFALL_CHIPS = [
  { id: "skip", label: "I've got buffer" },
  { id: "reduce", label: "Reduce next month" },
  { id: "withdraw", label: "Pull from pot" },
];

export const LOCK_IN_CHIPS = [
  { id: "lock", label: "Lock it in" },
  { id: "tweak", label: "Tweak something" },
];

// ── Sim messages - Story 1 (clean start → full journey) ────────────

export const STORY1_GOAL_SETUP: SimMessage[] = [
  { id: "s1-u1", role: "user", text: "I want to save more" },
  { id: "s1-a1", role: "assistant", text: "I can help with that. First, are you saving toward something specific, or just want to build up savings in general?" },
];

export const STORY1_LADDER_INTRO: SimMessage[] = [
  { id: "s1-u2", role: "user", text: "Just save more" },
  { id: "s1-a2", role: "assistant", text: "Got it. Based on your finances, here are three savings tiers. Pick the pace that feels right." },
];

export const STORY1_LADDER_PICKED: SimMessage[] = [
  { id: "s1-u3", role: "user", text: "Realistic" },
  { id: "s1-a3", role: "assistant", text: "₹12k/month it is. Want to name this destination? I'll call it \"Emergency fund\" for now.\n\nBefore I can tell you if this works, I need to walk through your finances. It's quick, five checks." },
];

export const STORY1_BUCKET_INCOME: SimMessage[] = [
  { id: "s1-a4", role: "assistant", text: "Here's what I see coming in regularly. Confirm what's accurate so I can build your plan on solid numbers." },
];

export const STORY1_BUCKET_INCOME_CONFIRMED: SimMessage[] = [
  { id: "s1-u4", role: "user", text: "Looks right" },
  { id: "s1-a5", role: "assistant", text: "Noted. ₹82k/month coming in. 3 more checks after this." },
];

export const STORY1_BUCKET_OBLIGATIONS: SimMessage[] = [
  { id: "s1-a6", role: "assistant", text: "These are your committed monthly expenses. Anything missing or wrong?" },
];

export const STORY1_BUCKET_OBLIGATIONS_CONFIRMED: SimMessage[] = [
  { id: "s1-u5", role: "user", text: "Looks right" },
  { id: "s1-a7", role: "assistant", text: "Noted. ₹28,318/month in obligations. 2 more checks." },
];

export const STORY1_BUCKET_P2P: SimMessage[] = [
  { id: "s1-a8", role: "assistant", text: "You're moving meaningful amounts with your roommate. Confirming means I'll treat the net ₹5k as a recurring inflow." },
];

export const STORY1_BUCKET_P2P_CONFIRMED: SimMessage[] = [
  { id: "s1-u6", role: "user", text: "Looks right" },
  { id: "s1-a9", role: "assistant", text: "Got it. 1 more check." },
];

export const STORY1_BUCKET_SPORADIC: SimMessage[] = [
  { id: "s1-a10", role: "assistant", text: "These look like one-offs, not something to plan around monthly. Flag any that are actually recurring." },
];

export const STORY1_BUCKET_SPORADIC_CONFIRMED: SimMessage[] = [
  { id: "s1-u7", role: "user", text: "Looks right" },
  { id: "s1-a11", role: "assistant", text: "All checks done. Crunching your spending plan now." },
];

export const STORY1_SPENDING_PLAN: SimMessage[] = [
  { id: "s1-a12", role: "assistant", text: "Here's how your money breaks down with ₹12k/month going to savings." },
];

export const STORY1_VERDICT_FEASIBLE: SimMessage[] = [
  { id: "s1-a13", role: "assistant", text: "₹12k/month is doable. Just need to bring food spend a bit closer to peer average. Nothing drastic." },
];

export const STORY1_LOCK_IN: SimMessage[] = [
  { id: "s1-u8", role: "user", text: "Let's do it" },
  { id: "s1-a14", role: "assistant", text: "Locked in. Your emergency fund pool is live at ₹12k/month. Budgets set across 6 categories. I'll keep an eye on things." },
];

// ── Sim messages - Story 2 (goal exists, wants more) ───────────────

export const STORY2_ENTRY: SimMessage[] = [
  { id: "s2-u1", role: "user", text: "I want to save more" },
  { id: "s2-a1", role: "assistant", text: "You've got the Europe trip running at ₹25k/month. Want to hit it sooner, or save for something else too?" },
];

// ── Sim messages - Story 3 (pool exists, wants a goal) ─────────────

export const STORY3_ENTRY: SimMessage[] = [
  { id: "s3-u1", role: "user", text: "I want to save for a trip" },
  { id: "s3-a1", role: "assistant", text: "You've got your emergency fund running at ₹5k/month. Want to bump the pool, stack a goal alongside it, or merge the pool into the goal?" },
];

export const STORY3_MERGE_OFFER: SimMessage[] = [
  { id: "s3-a2", role: "assistant", text: "₹25k/month is doable but tight. Redirecting your ₹5k emergency fund would loosen this. Pool pauses, resumes after trip." },
];

// ── Sim messages - Story 4 (both exist, cap reached) ───────────────

export const STORY4_ENTRY: SimMessage[] = [
  { id: "s4-u1", role: "user", text: "I want to save more" },
  { id: "s4-a1", role: "assistant", text: "You've got the trip and your emergency fund running. Want to bump one of them, or wait until the trip's done?" },
];

// ── Sim messages - Story 5 (impossible amount) ─────────────────────

export const STORY5_ENTRY: SimMessage[] = [
  { id: "s5-u1", role: "user", text: "I want to save ₹50k/month" },
  { id: "s5-a1", role: "assistant", text: "₹50k/month would leave less than ₹0 for daily spending. The most you could realistically save is ₹14k/month, which already needs cuts on food, subs, and dining. Want to start at ₹14k, or extend the timeline / lower target so it works at a smaller monthly amount?" },
];

// ── Sim messages - Story 6 (cashflow blocked) ──────────────────────

export const STORY6_ENTRY: SimMessage[] = [
  { id: "s6-u1", role: "user", text: "I want to save more" },
  { id: "s6-a1", role: "assistant", text: "Your monthly bills (rent, EMIs, SIPs) come to ₹42k against ₹40k income. Saving more isn't possible until something gives. Pause an SIP, refinance an EMI, or earn more. Want to walk through what's eating the income?" },
];

// ── Spending plan fixture (for the summary card) ───────────────────

export const SPENDING_PLAN_FIXTURE = {
  income: 82000,
  obligations: 28318,
  savingsTarget: 12000,
  dailyPool: 41682,
  categoryBudgets: CATEGORY_BUDGETS,
  verdict: { verdict: "feasible" as const },
};

// ── Post-journey proactive messages ────────────────────────────────

export const PROACTIVE_SALARY_LANDED: SimMessage = {
  id: "pro-salary", role: "assistant",
  text: "Salary's in. Move ₹25k+ to slice by Wed for your trip pot.",
};

export const PROACTIVE_SLICE_SHORT: SimMessage = {
  id: "pro-short", role: "assistant",
  text: "Trip pot didn't fund. slice was short. Move money over and tap 'Trigger now' to catch up.",
};

export const PROACTIVE_UNDERSPEND: SimMessage = {
  id: "pro-under", role: "assistant",
  text: "Food was ₹3k under budget. Move it to your trip pot to reach faster?",
};

export const PROACTIVE_GOAL_COMPLETE: SimMessage = {
  id: "pro-done", role: "assistant",
  text: "Your trip pot is full. ₹2L! ₹25k/month is freed. Hold in pot, plan a new goal, or send back to main?",
};

export const PROACTIVE_INCOME_UP: SimMessage = {
  id: "pro-inc-up", role: "assistant",
  text: "Income up ₹15k. Bump trip contribution to reach faster, or add to pool?",
};

export const PROACTIVE_INCOME_DOWN: SimMessage = {
  id: "pro-inc-down", role: "assistant",
  text: "Income dropped ₹10k. Combined commitments now exceed what's available. Reduce pool, reduce trip and slip deadline, or pause one?",
};
