"use client";

import { useState } from "react";
import { resolveStatus } from "@/app/preview/_shared/status-registry";
import PlaygroundCard from "@/app/preview/_shared/PlaygroundCard";

// Sim imports — reused as-is
import OnboardingSim from "@/app/preview/OnboardingSim";
import AASim from "@/app/preview/AASim";
import SavingsFlowSimBottom from "@/app/preview/SavingsFlowSimBottom";
import DegenModeSimV1 from "@/app/preview/DegenModeSimV1";
import RedditSimV1 from "@/app/preview/RedditSimV1";
import RedditSimV2 from "@/app/preview/RedditSimV2";
import RefreshSessionSimV1 from "@/app/preview/RefreshSessionSimV1";
import RefreshSessionSimV2 from "@/app/preview/RefreshSessionSimV2";
import DrawerExperienceSim from "@/app/preview/DrawerExperienceSim";

// ── Flow definitions ──────────────────────────────────────────
type FlowDef = {
  id: string;
  label: string;
  description: string;
  hasAutoplay?: boolean;
  variants: { name: string; render: (autoplay?: boolean) => React.ReactNode }[];
};

const FLOWS: FlowDef[] = [
  {
    id: "onboarding",
    label: "Onboarding",
    description: "First-time user journey — quiz, chat, and plan mode",
    variants: [
      { name: "v1", render: () => <OnboardingSim /> },
    ],
  },
  {
    id: "aa",
    label: "Account aggregator",
    description: "Value prop, learn more, bank select, OTP, approve consent, consent detail",
    variants: [
      { name: "Happy", render: () => <AASim /> },
      { name: "No accounts", render: () => <AASim startState="no-accounts-empty" /> },
      { name: "Alternates", render: () => <AASim startState="no-accounts-alternates" /> },
      { name: "Out of attempts", render: () => <AASim startState="otp-error" /> },
    ],
  },
  {
    id: "planmode-savings",
    label: "Plan mode savings",
    description: "Savings goal flow with cruncher and interactive conversation",
    variants: [
      { name: "v1", render: () => <SavingsFlowSimBottom /> },
    ],
  },
  {
    id: "degen-mode",
    label: "Degen mode",
    description: "Degen mode exploration — baseline",
    variants: [
      { name: "v1", render: () => <DegenModeSimV1 /> },
    ],
  },
  {
    id: "reddit",
    label: "Reddit",
    description: "Fake leak — animated recording and static screenshot",
    hasAutoplay: true,
    variants: [
      { name: "recording", render: (autoplay) => <RedditSimV1 autoplay={autoplay} /> },
      { name: "screenshot", render: () => <RedditSimV2 /> },
    ],
  },
  {
    id: "refresh-session",
    label: "Refresh session",
    description: "Re-engagement after inactivity",
    variants: [
      { name: "v1", render: () => <RefreshSessionSimV1 /> },
      { name: "v2", render: () => <RefreshSessionSimV2 /> },
    ],
  },
  {
    id: "drawer-experience",
    label: "Drawer experience",
    description: "Drawer push up/down with back layer and chat sheet",
    variants: [
      { name: "v1", render: () => <DrawerExperienceSim /> },
    ],
  },
];

function FlowEntry({ flow }: { flow: FlowDef }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [autoplay, setAutoplay] = useState(false);

  return (
    <PlaygroundCard
      name={flow.label}
      description={flow.description}
      status={resolveStatus(flow.id)}
      variants={flow.variants.map((v) => v.name)}
      activeVariantIndex={activeIdx}
      onVariantChange={setActiveIdx}
      deviceFrame
      autoplay={flow.hasAutoplay ? autoplay : undefined}
      onToggleAutoplay={flow.hasAutoplay ? () => setAutoplay((p) => !p) : undefined}
    >
      <div key={flow.variants[activeIdx].name} className="h-full w-full">
        {flow.variants[activeIdx].render(autoplay)}
      </div>
    </PlaygroundCard>
  );
}

export default function FlowsPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Flows</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete user journeys from onboarding to daily use
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {FLOWS.map((flow) => (
          <FlowEntry key={flow.id} flow={flow} />
        ))}
      </div>
    </div>
  );
}
