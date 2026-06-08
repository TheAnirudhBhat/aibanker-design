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
  | "returning"
  | "new-user-jun-11"
  | "returning-jun-11"
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
  },
  {
    id: "returning-jun-11",
    label: "Existing user - Jun 11",
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
        amount: "₹2,00,000",
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
                amount: "₹2,00,000",
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
                amount: "₹2,00,000",
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
