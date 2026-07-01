/**
 * User state presets - load via ?persona=<id> on the main app route.
 *
 * Each preset is a complete UserState snapshot with optional substates.
 * Substates are partial patches applied on top of the base state,
 * toggled via the side control panel.
 */

import type { UserState } from "../lib/types";

export type PersonaSubstate = {
  id: string;
  label: string;
  patch: Partial<UserState>;
};

export type SubstateGroup = {
  label: string;
  substates: PersonaSubstate[];
};

export type PersonaId =
  | "new-user"
  | "new-user-beta"
  | "returning"
  | "new-user-jun-11"
  | "inactive";

export type PersonaPreset = {
  id: PersonaId;
  label: string;
  description: string;
  state: UserState;
  controls?: SubstateGroup[];
};

const now = new Date().toISOString();
const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

const base: UserState = {
  userId: "persona-preview",
  onboardingComplete: false,
  currentStep: "wrapped",
  goalStage: "choice",
  budgetStage: "digest",
  obligations: null,
  goal: null,
  budgetOverrides: {},
  budgetStyle: null,
  bufferAmount: 5000,
  bufferRemaining: 5000,
  products: [],
  preferences: [],
  spendRatings: [],
  nudges: [],
  voice: "ryan",
  activeFlow: null,
  lastActiveAt: now,
  createdAt: now,
};

// DEV-only fast-forward milestones, ordered in flow sequence (Start → pre-AA cards → AA prompt →
// connected → snapshot → asked). Shared by the Jun-11 and New-user "Skip to" controls so the targets
// never drift; each seeds OnboardingSim to mount directly at that milestone instead of playing the
// linear script.
const SKIP_TO_SUBSTATES: PersonaSubstate[] = [
  { id: "ms-start", label: "Start", patch: { onboardingStartMilestone: undefined, onboardingComplete: false, currentStep: "wrapped" } },
  // Pre-AA: the wrapped-cards moment, cards shown but NOT yet flipped (revealedCount 0 ⇒ face-down "?").
  { id: "ms-cards-unflipped", label: "Cards to flip", patch: { onboardingStartMilestone: "cards-unflipped", onboardingComplete: false, currentStep: "wrapped" } },
  // The AA connect/skip prompt, before any account is linked.
  { id: "ms-aa-prompt", label: "Before connecting", patch: { onboardingStartMilestone: "aa-prompt", onboardingComplete: false, currentStep: "wrapped" } },
  { id: "ms-connected", label: "Account connected", patch: { onboardingStartMilestone: "connected", onboardingComplete: false, currentStep: "wrapped" } },
  { id: "ms-snapshot", label: "Spend snapshot ready", patch: { onboardingStartMilestone: "snapshot", onboardingComplete: false, currentStep: "wrapped" } },
  { id: "ms-asked", label: "Asked a question", patch: { onboardingStartMilestone: "asked", onboardingComplete: false, currentStep: "wrapped" } },
];

// The meet-Byron beat: connected + AA data still parsing in the background, Byron introducing
// himself. Same seed as "connected" (still fetching) with Byron forced on. Slots sequentially
// right after "Account connected" in the New-user skip list.
const BYRON_FETCHING_SUBSTATE: PersonaSubstate = {
  id: "ms-byron", label: "Byron intro", patch: { onboardingStartMilestone: "byron", onboardingComplete: false, currentStep: "wrapped" },
};

// New-user only: boot the standalone goal-creation chat (GBPFlowSim). "Start" plays from the top;
// the rest jump straight to that stage of the flow (intent → tier → footprint → plan → verdict →
// locked in) so each stage can be iterated on without replaying the whole script.
const GOAL_CREATE_SUBSTATES: PersonaSubstate[] = [
  { id: "ms-goal-create", label: "Goal: start", patch: { bootGoalCreation: true, bootGoalStage: undefined, onboardingComplete: false, currentStep: "wrapped" } },
  { id: "ms-goal-intent", label: "Goal: intent", patch: { bootGoalCreation: true, bootGoalStage: "intent", onboardingComplete: false, currentStep: "wrapped" } },
  { id: "ms-goal-tier", label: "Goal: tier", patch: { bootGoalCreation: true, bootGoalStage: "tier", onboardingComplete: false, currentStep: "wrapped" } },
  { id: "ms-goal-footprint", label: "Goal: footprint", patch: { bootGoalCreation: true, bootGoalStage: "footprint", onboardingComplete: false, currentStep: "wrapped" } },
  { id: "ms-goal-plan", label: "Goal: plan", patch: { bootGoalCreation: true, bootGoalStage: "spending-plan", onboardingComplete: false, currentStep: "wrapped" } },
  { id: "ms-goal-verdict", label: "Goal: verdict", patch: { bootGoalCreation: true, bootGoalStage: "verdict", onboardingComplete: false, currentStep: "wrapped" } },
  { id: "ms-goal-locked", label: "Goal: locked in", patch: { bootGoalCreation: true, bootGoalStage: "done", onboardingComplete: false, currentStep: "wrapped" } },
];

// New-user-beta "Skip to": jump the intent-first flow to any step, in flow order.
const BETA_SKIP_SUBSTATES: PersonaSubstate[] = [
  { id: "bt-start", label: "Start", patch: { onboardingBetaStep: undefined, onboardingComplete: false, currentStep: "wrapped" } },
  { id: "bt-wrapped", label: "Wrapped", patch: { onboardingBetaStep: "wrapped", onboardingComplete: false, currentStep: "wrapped" } },
  { id: "bt-goal", label: "Goal nudge", patch: { onboardingBetaStep: "goal", onboardingComplete: false, currentStep: "wrapped" } },
  { id: "bt-aa", label: "AA ask", patch: { onboardingBetaStep: "aa", onboardingComplete: false, currentStep: "wrapped" } },
  { id: "bt-byron", label: "Meet Byron", patch: { onboardingBetaStep: "byron", onboardingComplete: false, currentStep: "wrapped" } },
  { id: "bt-explore", label: "Explore", patch: { onboardingBetaStep: "explore", onboardingComplete: false, currentStep: "wrapped" } },
  { id: "bt-footprint", label: "Footprint", patch: { onboardingBetaStep: "footprint", onboardingComplete: false, currentStep: "wrapped" } },
  { id: "bt-plan", label: "Plan", patch: { onboardingBetaStep: "plan", onboardingComplete: false, currentStep: "wrapped" } },
  { id: "bt-budget", label: "Budget", patch: { onboardingBetaStep: "budget", onboardingComplete: false, currentStep: "wrapped" } },
  { id: "bt-verdict", label: "Verdict", patch: { onboardingBetaStep: "verdict", onboardingComplete: false, currentStep: "wrapped" } },
  { id: "bt-locked", label: "Lock in", patch: { onboardingBetaStep: "lock-in", onboardingComplete: false, currentStep: "wrapped" } },
];

export const PERSONA_PRESETS: PersonaPreset[] = [
  {
    id: "new-user",
    label: "New user",
    description: "Iterate on the onboarding flow: AA, Byron, and goal can each be turned on or off",
    state: {
      ...base,
      onboardingAaMode: "optional",
      onboardingIntroduceByron: false,
      onboardingGoalRequired: false,
    },
    controls: [
      // Shared dev fast-forward + a Byron-intro beat (after connect) + New-user-only "Goal: <stage>"
      // targets (every goal-creation stage). Byron is inserted sequentially after "Account connected".
      { label: "Skip to", substates: [...SKIP_TO_SUBSTATES.slice(0, 4), BYRON_FETCHING_SUBSTATE, ...SKIP_TO_SUBSTATES.slice(4), ...GOAL_CREATE_SUBSTATES] },
      {
        label: "Account aggregator",
        substates: [
          { id: "aa-optional", label: "Optional", patch: { onboardingAaMode: "optional" } },
          { id: "aa-required", label: "Required", patch: { onboardingAaMode: "required" } },
        ],
      },
      {
        label: "Voice",
        substates: [
          { id: "ryan-only", label: "Ryan only", patch: { onboardingIntroduceByron: false } },
          { id: "ryan-byron", label: "Ryan + Byron", patch: { onboardingIntroduceByron: true } },
        ],
      },
      {
        label: "Goal setup",
        substates: [
          { id: "goal-optional", label: "Optional", patch: { onboardingGoalRequired: false } },
          { id: "goal-required", label: "Required", patch: { onboardingGoalRequired: true } },
        ],
      },
    ],
  },
  {
    // Intent-first clone of "new user". Same screens, reordered flow (driven by betaIntentFirst in
    // the page → OnboardingSim): splash → wrapped → goal nudge → AA + explore filler → session break
    // → footprint → plan → lock-in. No "Skip to" control (its milestones are tied to the classic order).
    id: "new-user-beta",
    label: "New user (beta)",
    description: "Intent-first flow: splash → wrapped → goal nudge → AA + explore filler → session break → footprint → plan",
    state: {
      ...base,
      onboardingAaMode: "optional",
      onboardingIntroduceByron: false,
      onboardingGoalRequired: false,
    },
    controls: [
      { label: "Skip to", substates: BETA_SKIP_SUBSTATES },
      {
        label: "Account aggregator",
        substates: [
          { id: "aa-optional", label: "Optional", patch: { onboardingAaMode: "optional" } },
          { id: "aa-required", label: "Required", patch: { onboardingAaMode: "required" } },
        ],
      },
      {
        label: "Voice",
        substates: [
          { id: "ryan-only", label: "Ryan only", patch: { onboardingIntroduceByron: false } },
          { id: "ryan-byron", label: "Ryan + Byron", patch: { onboardingIntroduceByron: true } },
        ],
      },
      {
        label: "Goal setup",
        substates: [
          { id: "goal-optional", label: "Optional", patch: { onboardingGoalRequired: false } },
          { id: "goal-required", label: "Required", patch: { onboardingGoalRequired: true } },
        ],
      },
    ],
  },
  {
    id: "returning",
    label: "Returning user",
    description: "Review goal states, explore what else Ryan can do",
    state: {
      ...base,
      onboardingComplete: true,
      currentStep: "home",
      goalStage: "pinned",
      budgetStage: "action",
      budgetStyle: "chill",
      goal: {
        name: "Trip to Japan",
        timeline: "Dec '26",
        timelineMonths: 8,
        amount: "\u20b92,00,000",
        amountNum: 200000,
        savingsAllocated: 90000,
        paceId: "balanced",
        createdAt: threeMonthsAgo,
      },
      obligations: {
        confirmed: [
          { payee: "Rent", amount: 21700, type: "Rent/EMI" },
          { payee: "Delhi Metro", amount: 1500, type: "Utility" },
          { payee: "Netflix", amount: 649, type: "Subscription" },
        ],
        totalFixed: 23849,
        remainingAfterFixed: 3151,
      },
      products: [
        { type: "rd", amount: 10000, frequency: "monthly", activatedAt: threeMonthsAgo, active: true },
      ],
      createdAt: threeMonthsAgo,
    },
    controls: [
      {
        label: "Goal status",
        substates: [
          { id: "on-track", label: "On track", patch: {} },
          {
            id: "behind",
            label: "Behind",
            patch: {
              budgetStyle: "strict",
              goal: {
                name: "Trip to Japan",
                timeline: "Dec '26",
                timelineMonths: 8,
                amount: "\u20b92,00,000",
                amountNum: 200000,
                savingsAllocated: 15000,
                paceId: "aggressive",
                createdAt: threeMonthsAgo,
              },
              obligations: {
                confirmed: [
                  { payee: "Rent", amount: 21700, type: "Rent/EMI" },
                  { payee: "Delhi Metro", amount: 1500, type: "Utility" },
                ],
                totalFixed: 23200,
                remainingAfterFixed: 3800,
              },
              budgetOverrides: {
                "Food & Delivery": 15000,
                "Shopping": 8000,
              },
              products: [
                { type: "rd", amount: 15000, frequency: "monthly", activatedAt: threeMonthsAgo, active: true },
              ],
              nudges: [
                { type: "spending-alert", category: "Food & Delivery", threshold: 15000, active: true },
                { type: "soft-cap", category: "Shopping", threshold: 8000, active: true },
              ],
            },
          },
          {
            id: "completed",
            label: "Completed",
            patch: {
              goal: {
                name: "Trip to Japan",
                timeline: "Dec '26",
                timelineMonths: 8,
                amount: "\u20b92,00,000",
                amountNum: 200000,
                savingsAllocated: 200000,
                paceId: "balanced",
                createdAt: threeMonthsAgo,
              },
            },
          },
        ],
      },
      {
        label: "Goals",
        substates: [
          { id: "single", label: "Single", patch: {} },
          {
            id: "multiple",
            label: "Multiple",
            patch: {
              products: [
                { type: "rd", amount: 10000, frequency: "monthly", activatedAt: threeMonthsAgo, active: true },
                { type: "rd", amount: 15000, frequency: "monthly", activatedAt: threeMonthsAgo, active: true },
                { type: "rd", amount: 5000, frequency: "monthly", activatedAt: threeMonthsAgo, active: true },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: "new-user-jun-11",
    label: "New user - Jun 11",
    description: "Jun 11 onboarding: AA optional, goal optional, Byron only if AA connected",
    state: {
      ...base,
      onboardingAaMode: "optional",
      onboardingGoalRequired: false,
      onboardingByronGatedByAa: true,
    },
    controls: [
      // DEV-only fast-forward — shared SKIP_TO_SUBSTATES (Start → cards → connected → snapshot → asked).
      { label: "Skip to", substates: SKIP_TO_SUBSTATES },
    ],
  },
  {
    id: "inactive",
    label: "Inactive user",
    description: "Hasn't opened app in 2+ weeks - re-engagement state",
    state: {
      ...base,
      onboardingComplete: true,
      currentStep: "home",
      goalStage: "pinned",
      goal: {
        name: "Emergency Fund",
        timeline: "Mar '27",
        timelineMonths: 12,
        amount: "\u20b95,00,000",
        amountNum: 500000,
        savingsAllocated: 175000,
        paceId: "relaxed",
        createdAt: threeMonthsAgo,
      },
      products: [
        { type: "rd", amount: 15000, frequency: "monthly", activatedAt: threeMonthsAgo, active: true },
      ],
      lastActiveAt: twoWeeksAgo,
      createdAt: threeMonthsAgo,
    },
  },
];

export function getPreset(id: string): PersonaPreset | undefined {
  return PERSONA_PRESETS.find((p) => p.id === id);
}

/** Apply a substate patch on top of a base state */
export function applySubstate(baseState: UserState, patch: Partial<UserState>): UserState {
  return { ...baseState, ...patch };
}
