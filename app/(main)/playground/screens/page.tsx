"use client";

import { useState } from "react";
import { resolveStatus } from "@/app/preview/_shared/status-registry";
import PlaygroundCard from "@/app/preview/_shared/PlaygroundCard";

// Screen components
import BudgetScreen from "@/app/components/BudgetScreen";
import PotDetail from "@/app/components/PotDetail";
import FeaturePDP from "@/app/components/FeaturePDP";
import ErrorScreen from "@/app/components/ErrorScreen";

import { BUDGET_SCENARIOS, GOAL_TRACKER_SCENARIOS } from "@/app/lib/debug-fixtures";

// ── Screen definitions ────────────────────────────────────────
type ScreenDef = {
  id: string;
  label: string;
  variants: { name: string; render: () => React.ReactNode }[];
};

const noop = () => {};

// Goal data shortcuts - single goal in different states
const goalOnTrack = GOAL_TRACKER_SCENARIOS.single;
const goalAhead = [{ ...GOAL_TRACKER_SCENARIOS.two[0], pct: 62, status: "ahead" as const, daysLabel: "11 days ahead", saved: 124000 }];
const goalBehind = GOAL_TRACKER_SCENARIOS["single-alert"];
const goalAheadData = goalAhead[0];
const goalBehindData = goalBehind[0];
const goalOnTrackData = goalOnTrack[0];

const PDP_FEATURES = [
  { title: "Spending, decoded", subtitle: "See where your money actually goes" },
  { title: "Goals on autopilot", subtitle: "Set a target, get a plan, stay on track" },
];

const SCREENS: ScreenDef[] = [
  {
    id: "feature-pdp",
    label: "Feature page",
    variants: [
      {
        name: "default",
        render: () => (
          <FeaturePDP
            productName="Meet Ryan"
            subtitle={"Keeps track of your money,\nso you don't have to"}
            features={PDP_FEATURES}
            onClose={noop}
            onAction={noop}
          />
        ),
      },
    ],
  },
  {
    id: "budget",
    label: "Budget",
    variants: [
      { name: "goal-only",     render: () => <BudgetScreen goal={BUDGET_SCENARIOS["goal-only"].goal}     pool={BUDGET_SCENARIOS["goal-only"].pool}     budget={BUDGET_SCENARIOS["goal-only"].budget}     onClose={noop} /> },
      { name: "goal-and-pool", render: () => <BudgetScreen goal={BUDGET_SCENARIOS["goal-and-pool"].goal} pool={BUDGET_SCENARIOS["goal-and-pool"].pool} budget={BUDGET_SCENARIOS["goal-and-pool"].budget} onClose={noop} /> },
      { name: "pool-only",     render: () => <BudgetScreen goal={BUDGET_SCENARIOS["pool-only"].goal}     pool={BUDGET_SCENARIOS["pool-only"].pool}     budget={BUDGET_SCENARIOS["pool-only"].budget}     onClose={noop} /> },
    ],
  },
  {
    id: "pot-detail",
    label: "Pot detail",
    variants: [
      { name: "on-track", render: () => <PotDetail name={goalOnTrackData.name} saved={goalOnTrackData.saved} target={goalOnTrackData.target} pct={goalOnTrackData.pct} status={goalOnTrackData.status} daysLabel={goalOnTrackData.daysLabel} icon={goalOnTrackData.heroEmoji} heroScene={goalOnTrackData.heroScene} onBack={noop} /> },
      { name: "ahead", render: () => <PotDetail name={goalAheadData.name} saved={goalAheadData.saved} target={goalAheadData.target} pct={goalAheadData.pct} status={goalAheadData.status} daysLabel={goalAheadData.daysLabel} icon={goalAheadData.heroEmoji} heroScene={goalAheadData.heroScene} onBack={noop} /> },
      { name: "behind", render: () => <PotDetail name={goalBehindData.name} saved={goalBehindData.saved} target={goalBehindData.target} pct={goalBehindData.pct} status={goalBehindData.status} daysLabel={goalBehindData.daysLabel} icon={goalBehindData.heroEmoji} heroScene={goalBehindData.heroScene} onBack={noop} /> },
    ],
  },
  {
    id: "error-state",
    label: "Error state",
    variants: [
      { name: "default", render: () => <ErrorScreen appBar reloadButton onBack={noop} onReload={noop} /> },
    ],
  },
];

function ScreenEntry({ screen }: { screen: ScreenDef }) {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <PlaygroundCard
      id={screen.id}
      name={screen.label}
      status={resolveStatus(screen.id)}
      variants={screen.variants.map((v) => v.name)}
      activeVariantIndex={activeIdx}
      onVariantChange={setActiveIdx}
      deviceFrame
    >
      {screen.variants[activeIdx].render()}
    </PlaygroundCard>
  );
}

export default function ScreensPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Screens</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Individual screens in device frames
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {SCREENS.map((screen) => (
          <ScreenEntry key={screen.id} screen={screen} />
        ))}
      </div>
    </div>
  );
}
