"use client";

import { useState } from "react";
import PlaygroundCard, { useSlotControls } from "@/app/preview/_shared/PlaygroundCard";
import { useControlPanel } from "@/app/preview/_shared/ControlPanel";

// Screen components
import BudgetScreen from "@/app/components/BudgetScreen";
import PotDetail from "@/app/components/PotDetail";
import FeaturePDP from "@/app/components/FeaturePDP";
import ErrorScreen from "@/app/components/ErrorScreen";
import PayScreen from "@/app/components/PayScreen";
import PayScreenFuture from "@/app/components/PayScreenFuture";
import GoalListScreen from "@/app/components/GoalListScreen";
import ChatInitialScreen, { getSuggestions } from "@/app/components/ChatInitialScreen";

import { BUDGET_SCENARIOS, GOAL_TRACKER_SCENARIOS } from "@/app/lib/debug-fixtures";

// ── Screen definitions ────────────────────────────────────────
type ScreenDef = {
  id: string;
  label: string;
  variants: { name: string; render: (variantIdx: number) => React.ReactNode }[];
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
    id: "pay",
    label: "Pay screen",
    variants: [
      { name: "current", render: (idx) => <PayPlayground key={idx} variantIdx={idx} /> },
      { name: "future",  render: (idx) => <PayPlayground key={idx} variantIdx={idx} /> },
    ],
  },
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
            footer="disclaimer-cta"
            disclaimerText="This beta may contain bugs or unfinished features"
            actionLabel="Join the beta"
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
  {
    id: "goal-list",
    label: "Goal list",
    variants: [
      { name: "single",       render: () => <GoalListScreen goals={GOAL_TRACKER_SCENARIOS.single} onGoalTap={noop} onClose={noop} /> },
      { name: "two goals",    render: () => <GoalListScreen goals={GOAL_TRACKER_SCENARIOS.two}    onGoalTap={noop} onClose={noop} /> },
      { name: "three goals",  render: () => <GoalListScreen goals={GOAL_TRACKER_SCENARIOS.three}  onGoalTap={noop} onClose={noop} /> },
    ],
  },
  {
    id: "chat-initial",
    label: "Chat initial",
    variants: [
      { name: "no goal", render: () => <ChatInitialScreen suggestions={getSuggestions(false)} onSuggestionClick={noop} onSubmit={noop} /> },
      { name: "has goal", render: () => <ChatInitialScreen suggestions={getSuggestions(true)} onSuggestionClick={noop} onSubmit={noop} /> },
    ],
  },
];

function ScreenEntry({ screen }: { screen: ScreenDef }) {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <PlaygroundCard
      id={screen.id}
      name={screen.label}
      variants={screen.variants.map((v) => v.name)}
      activeVariantIndex={activeIdx}
      onVariantChange={setActiveIdx}
      deviceFrame
    >
      {screen.variants[activeIdx].render(activeIdx)}
    </PlaygroundCard>
  );
}

const PAY_STATE_PROPS = {
  "First time":    { pillLabel: "Meet Ryan",      animate: false, state: "firstTime" as const },
  "Ryan is ready": { pillLabel: "Ryan is ready",  animate: true,  state: "alert" as const },
  "Default":       { pillLabel: "Chat with Ryan", animate: false, state: "default" as const },
} as const;

function PayPlayground({ variantIdx }: { variantIdx: number }) {
  const [state, panel] = useControlPanel({
    state: {
      kind: "select",
      label: "State",
      options: ["First time", "Ryan is ready", "Default"] as const,
      default: "First time",
    },
  });
  useSlotControls(panel);

  const props = PAY_STATE_PROPS[state.state];
  const Screen = variantIdx === 1 ? PayScreenFuture : PayScreen;

  return <Screen pillLabel={props.pillLabel} animate={props.animate} state={props.state} onPillTap={noop} />;
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
