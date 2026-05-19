"use client";

import { useMemo, useState } from "react";
import ChatCard from "@/app/components/ChatCards";
import type { ChatCardData } from "@/app/components/ChatCards";
import { resolveStatus } from "@/app/preview/_shared/status-registry";
import PlaygroundCard from "@/app/preview/_shared/PlaygroundCard";
import {
  DBG_FD_SETUP, DBG_FD_ACTIVATED,
  DBG_OBLIGATIONS_V2,
  DBG_GOAL_AHEAD, DBG_GOAL_BEHIND, DBG_GOAL_ONTRACK,
} from "@/app/lib/debug-fixtures";

// ── Widget items with state variants ──────────────────────────
type WidgetItem = {
  type: string;
  label: string;
  fixtures: { name: string; data: ChatCardData }[];
};

const WIDGET_ITEMS: WidgetItem[] = [
  {
    type: "investment-product",
    label: "Investment product",
    fixtures: [
      { name: "setup", data: { ...DBG_FD_SETUP } },
      { name: "activated", data: { ...DBG_FD_ACTIVATED } },
    ],
  },
  {
    type: "confirm-list",
    label: "Obligations list",
    fixtures: [
      { name: "unsubmitted", data: { ...DBG_OBLIGATIONS_V2 } },
      { name: "submitted", data: { ...DBG_OBLIGATIONS_V2, submitted: true } as ChatCardData },
    ],
  },
  {
    type: "goal-progress",
    label: "Goal progress",
    fixtures: [
      { name: "ahead", data: { ...DBG_GOAL_AHEAD } },
      { name: "behind", data: { ...DBG_GOAL_BEHIND } },
      { name: "on-track", data: { ...DBG_GOAL_ONTRACK } },
    ],
  },
  {
    type: "add-to-pot",
    label: "Add to pot",
    fixtures: [
      {
        name: "default",
        data: {
          type: "add-to-pot",
          goalName: "Trip to Japan",
          amount: 5000,
          fromAccount: "Savings xx1234",
        },
      },
      {
        name: "activated",
        data: {
          type: "add-to-pot",
          goalName: "Trip to Japan",
          amount: 5000,
          fromAccount: "Savings xx1234",
          activated: true,
        },
      },
    ],
  },
];

function InteractiveWidgetFixture({ data }: { data: ChatCardData }) {
  const [submitted, setSubmitted] = useState(false);
  const [activated, setActivated] = useState(false);

  const augmented = useMemo<ChatCardData>(() => {
    if (data.type === "confirm-list") {
      return {
        ...data,
        submitted: data.submitted || submitted,
        onSubmit: () => setSubmitted(true),
      };
    }
    if (data.type === "investment-product") {
      return {
        ...data,
        activated: data.activated || activated,
        onContinue: () => setActivated(true),
      };
    }
    if (data.type === "add-to-pot") {
      return {
        ...data,
        onAdd: () => setActivated(true),
      };
    }
    return data;
  }, [data, submitted, activated]);

  return <ChatCard card={augmented} />;
}

function WidgetEntry({ item }: { item: WidgetItem }) {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <PlaygroundCard
      id={item.type}
      name={item.label}
      status={resolveStatus(item.type)}
      variants={item.fixtures.map((f) => f.name)}
      activeVariantIndex={activeIdx}
      onVariantChange={setActiveIdx}
    >
      <InteractiveWidgetFixture data={item.fixtures[activeIdx].data} />
    </PlaygroundCard>
  );
}

export default function WidgetsPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Widgets</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Interactive cards for goals, investments, and savings
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {WIDGET_ITEMS.map((item) => (
          <WidgetEntry key={item.type} item={item} />
        ))}
      </div>
    </div>
  );
}
