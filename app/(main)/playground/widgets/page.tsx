"use client";

import { useMemo, useState } from "react";
import ChatCard from "@/app/components/ChatCards";
import type { ChatCardData } from "@/app/components/ChatCards";
import PlaygroundCard from "@/app/preview/_shared/PlaygroundCard";
import QuestionnaireOverlay from "@/app/components/QuestionnaireOverlay";
import { SAVINGS_TIER_QUESTION } from "@/app/preview/fixtures/savingsTierQuestion";
import {
  DBG_FD_SETUP, DBG_FD_CHIPS,
  DBG_POT_CHIPS,
  DBG_OBLIGATIONS_V2,
  DBG_GOAL_AHEAD, DBG_GOAL_BEHIND, DBG_GOAL_ONTRACK,
} from "@/app/lib/debug-fixtures";

// ── Widget playgrounds with variant switchers ────────────────

function InvestmentProductPlayground() {
  const [variantIdx, setVariantIdx] = useState(0);
  const data = variantIdx === 0 ? DBG_FD_SETUP : DBG_FD_CHIPS;
  return (
    <PlaygroundCard
      id="investment-product"
      name="Investment product"
      variants={["single", "chips"]}
      activeVariantIndex={variantIdx}
      onVariantChange={setVariantIdx}
    >
      <ChatCard card={data} />
    </PlaygroundCard>
  );
}

const POT_SINGLE_BASE: ChatCardData = {
  type: "add-to-pot",
  goalName: "Trip to Japan",
  amount: 5000,
  fromAccount: "Savings xx1234",
};

function AddToPotPlayground() {
  const [variantIdx, setVariantIdx] = useState(0);
  const data = variantIdx === 0 ? POT_SINGLE_BASE : DBG_POT_CHIPS;
  return (
    <PlaygroundCard
      id="add-to-pot"
      name="Add to pot"
      variants={["single", "chips"]}
      activeVariantIndex={variantIdx}
      onVariantChange={setVariantIdx}
    >
      <ChatCard card={data} />
    </PlaygroundCard>
  );
}

// ── Simple widget entries (no custom variant switchers) ──────

type WidgetItem = {
  type: string;
  label: string;
  fixtures: { name: string; data: ChatCardData }[];
};

const SIMPLE_WIDGET_ITEMS: WidgetItem[] = [
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
    type: "savings-plan",
    label: "Savings plan",
    fixtures: [
      {
        name: "default",
        data: {
          type: "savings-plan",
          name: "Trip to Japan",
          target: 200000,
          timeline: "6 months",
          existingSavings: 0,
          monthlyAmount: 33000,
          productType: "RD",
          productLabel: "Recurring Deposit",
          rate: "7.25%",
          pct: 0,
          timelineLabel: "6 months to go",
        },
      },
      {
        name: "with existing savings",
        data: {
          type: "savings-plan",
          name: "Trip to Japan",
          target: 200000,
          timeline: "6 months",
          existingSavings: 50000,
          monthlyAmount: 25000,
          productType: "RD",
          productLabel: "Recurring Deposit",
          rate: "7.25%",
          pct: 25,
          timelineLabel: "6 months to go",
        },
      },
    ],
  },
];

// Savings-tier question — a widget (inline questionnaire card), not a data viz.
function SavingsTierPlayground() {
  const [answer, setAnswer] = useState<string | null>(null);
  return (
    <PlaygroundCard id="savings-tier" name="Savings tier">
      <QuestionnaireOverlay
        inline
        questions={[SAVINGS_TIER_QUESTION]}
        currentIndex={0}
        answers={answer ? { [SAVINGS_TIER_QUESTION.id]: answer } : {}}
        onSelectOption={(_q, opt) => setAnswer(opt.id)}
        onSubmitFreeText={() => {}}
        onNavigate={() => {}}
        onClose={() => {}}
      />
    </PlaygroundCard>
  );
}

function InteractiveWidgetFixture({ data }: { data: ChatCardData }) {
  const [submitted, setSubmitted] = useState(false);

  const augmented = useMemo<ChatCardData>(() => {
    if (data.type === "confirm-list") {
      return {
        ...data,
        submitted: data.submitted || submitted,
        onSubmit: () => setSubmitted(true),
      };
    }
    return data;
  }, [data, submitted]);

  return <ChatCard card={augmented} />;
}

function SimpleWidgetEntry({ item }: { item: WidgetItem }) {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <PlaygroundCard
      id={item.type}
      name={item.label}
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
        <InvestmentProductPlayground />
        <SavingsTierPlayground />
        {SIMPLE_WIDGET_ITEMS.slice(0, 2).map((item) => (
          <SimpleWidgetEntry key={item.type} item={item} />
        ))}
        <AddToPotPlayground />
        {SIMPLE_WIDGET_ITEMS.slice(2).map((item) => (
          <SimpleWidgetEntry key={item.type} item={item} />
        ))}
      </div>
    </div>
  );
}
