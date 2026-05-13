"use client";

import { useState } from "react";
import { SCREEN_STATUS, STATUSES } from "@/app/preview/_shared/status-registry";
import type { ItemStatus } from "@/app/preview/_shared/status-registry";
import PlaygroundCard from "@/app/preview/_shared/PlaygroundCard";

// Screen components
import GoalListScreen from "@/app/components/GoalListScreen";
import PotDetail from "@/app/components/PotDetail";
import FeaturePDP from "@/app/components/FeaturePDP";

import { GOAL_TRACKER_SCENARIOS } from "@/app/lib/debug-fixtures";

// ── Screen definitions ────────────────────────────────────────
type ScreenDef = {
  id: string;
  label: string;
  variants: { name: string; render: () => React.ReactNode }[];
};

const noop = () => {};

// Goal data shortcuts — single goal in different states
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
    id: "goal-list",
    label: "Goal list",
    variants: [
      { name: "on-track", render: () => <GoalListScreen goals={goalOnTrack} onGoalTap={noop} onClose={noop} /> },
      { name: "ahead", render: () => <GoalListScreen goals={goalAhead} onGoalTap={noop} onClose={noop} /> },
      { name: "behind", render: () => <GoalListScreen goals={goalBehind} onGoalTap={noop} onClose={noop} /> },
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
];

function ScreenEntry({ screen, status, onCycleStatus }: { screen: ScreenDef; status: ItemStatus; onCycleStatus: () => void }) {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <PlaygroundCard
      name={screen.label}
      status={status}
      onCycleStatus={onCycleStatus}
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
  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>(() => ({ ...SCREEN_STATUS }));

  const cycleStatus = (id: string) => {
    setStatuses((prev) => {
      const cur = prev[id] ?? "exploring";
      const idx = STATUSES.indexOf(cur);
      return { ...prev, [id]: STATUSES[(idx + 1) % STATUSES.length] };
    });
  };

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
          <ScreenEntry
            key={screen.id}
            screen={screen}
            status={statuses[screen.id] ?? "exploring"}
            onCycleStatus={() => cycleStatus(screen.id)}
          />
        ))}
      </div>
    </div>
  );
}
