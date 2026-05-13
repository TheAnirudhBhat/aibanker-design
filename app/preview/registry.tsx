import type { ReactNode } from "react";

// ── Exploration sims ──────────────────────────────────────────
import SavingsFlowSimBottom from "./SavingsFlowSimBottom";
import AppEntryPointSim from "./AppEntryPointSim";
import DrawerExperienceSim from "../components/DrawerExperienceSim";
import OnboardingSim from "./OnboardingSim";
import RefreshSessionSimV1 from "./RefreshSessionSimV1";
import RefreshSessionSimV2 from "./RefreshSessionSimV2";
import DegenModeSimV1 from "./DegenModeSimV1";
import AASim from "./AASim";
import RedditSimV1 from "./RedditSimV1";
import RedditSimV2 from "./RedditSimV2";
import VisualizationsChatSimV1 from "./VisualizationsChatSimV1";
import VisualizationsChatSimV2 from "./VisualizationsChatSimV2";

// ── Component sims ────────────────────────────────────────────
import ChatCardsSim from "./ChatCardsSim";
import GoalTrackerSim from "./GoalTrackerSim";
import AppChromeSim from "./AppChromeSim";
import PlanModeSim from "./PlanModeSim";
import ChatSim from "./ChatSim";

export type Variant = {
  name: string;
  description: string;
  render: (autoplay?: boolean) => ReactNode;
};

export type ExplorationCategory = "components" | "flows" | "explorations";

export type Exploration = {
  component: string;
  category: ExplorationCategory;
  variants: Variant[];
  /** If true, this exploration has no active variants — shown as disabled on landing */
  empty?: boolean;
};

/**
 * Component & exploration registry for the playground.
 *
 * Categories:
 *   - "components"    — Finalized, reusable UI pieces shown in isolation
 *   - "flows"         — End-to-end user journeys (onboarding, goal setting, etc.)
 *   - "explorations"  — Active design variants still being iterated on
 *
 * Usage:
 *   1. Visit /preview to see all entries grouped by category
 *   2. Click an entry or go to /preview?component=Name to see its variants
 *   3. /preview?component=Name&fullscreen=1&variant=v1 for a clean fullscreen view
 */
export const explorations: Exploration[] = [
  // ═══════════════════════════════════════════════════════════════
  // COMPONENTS — finalized, reusable pieces
  // ═══════════════════════════════════════════════════════════════
  {
    component: "ChatCards",
    category: "components",
    variants: [{
      name: "all",
      description: "Every card type (spend, goals, investments, transactions, etc.)",
      render: () => <ChatCardsSim />,
    }],
  },
  {
    component: "GoalTracker",
    category: "components",
    variants: [{
      name: "all",
      description: "Ring scenarios: 0, 1 (pct/icon/behind), 2, and 3 goals",
      render: () => <GoalTrackerSim />,
    }],
  },
  {
    component: "AppChrome",
    category: "components",
    variants: [{
      name: "all",
      description: "Status bar, app bars, nav buttons, footer, gesture nav",
      render: () => <AppChromeSim />,
    }],
  },
  {
    component: "PlanMode",
    category: "components",
    variants: [{
      name: "all",
      description: "Step checklist: pending, in-progress, and completed states",
      render: () => <PlanModeSim />,
    }],
  },
  {
    component: "Chat",
    category: "components",
    variants: [{
      name: "all",
      description: "Bubbles, typewriter, chips, streaming, special messages",
      render: () => <ChatSim />,
    }],
  },

  // ═══════════════════════════════════════════════════════════════
  // FLOWS — end-to-end journeys
  // ═══════════════════════════════════════════════════════════════
  {
    component: "Onboarding",
    category: "flows",
    variants: [
      { name: "v1", description: "Chat-led flow with wrapped quiz, AA, and PlanMode", render: () => <OnboardingSim /> },
    ],
  },
  {
    component: "AA",
    category: "flows",
    variants: [{
      name: "v1",
      description: "AA: value prop \u2192 bank select \u2192 OTP \u2192 consent \u2192 detail \u2192 success",
      render: () => <AASim />,
    }],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXPLORATIONS — active design variants
  // ═══════════════════════════════════════════════════════════════
  {
    component: "PlanMode Savings",
    category: "explorations",
    variants: [
      {
        name: "v1",
        description: "Interactive savings goal conversation with cruncher",
        render: () => <SavingsFlowSimBottom />,
      },
    ],
  },
  {
    component: "Visualizations",
    category: "explorations",
    variants: [
      {
        name: "v1",
        description: "Staged chat showing all card types interspersed with user messages",
        render: () => <VisualizationsChatSimV1 />,
      },
      {
        name: "v2",
        description: "Visualizations chat \u2014 duplicate of V1 for iteration",
        render: () => <VisualizationsChatSimV2 />,
      },
    ],
  },
  {
    component: "AppEntryPoint",
    category: "explorations",
    variants: [{
      name: "full-sim",
      description: "Purple home screen with scrollable pills",
      render: () => <AppEntryPointSim />,
    }],
  },
  {
    component: "DegenMode",
    category: "explorations",
    variants: [{
      name: "v1",
      description: "Degen Mode \u2014 baseline (copied from RefreshSession v1)",
      render: () => <DegenModeSimV1 />,
    }],
  },
  {
    component: "Reddit",
    category: "explorations",
    variants: [
      {
        name: "screen-recording",
        description: "Full goal-setting flow \u2014 animated sim for screen recording",
        render: (autoplay) => <RedditSimV1 autoplay={autoplay} />,
      },
      {
        name: "screenshot",
        description: "Static conversation \u2014 Byron\u2019s opening reply for screenshot",
        render: () => <RedditSimV2 />,
      },
    ],
  },
  {
    component: "RefreshSession",
    category: "explorations",
    variants: [
      {
        name: "v1",
        description: "Refresh session \u2014 baseline (duplicated from Selections)",
        render: () => <RefreshSessionSimV1 />,
      },
      {
        name: "v2",
        description: "Refresh session \u2014 variant 2",
        render: () => <RefreshSessionSimV2 />,
      },
    ],
  },
  {
    component: "DrawerExperience",
    category: "explorations",
    variants: [{
      name: "v1",
      description: "Drawer push up/down \u2014 My Money back layer + Chat sheet",
      render: () => <DrawerExperienceSim />,
    }],
  },
];
