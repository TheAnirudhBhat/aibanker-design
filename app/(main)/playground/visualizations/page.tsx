"use client";

import { useState } from "react";
import ChatCard from "@/app/components/ChatCards";
import type { ChatCardData } from "@/app/components/ChatCards";
import BudgetSummaryViz from "@/app/components/BudgetSummaryViz";
import CategoryBudgetsViz from "@/app/components/CategoryBudgetsViz";
import PlaygroundCard from "@/app/preview/_shared/PlaygroundCard";
import {
  DBG_SPEND_OVERVIEW, DBG_CATEGORY_BAR,
  DBG_MERCHANT_BAR, DBG_CATEGORY_MOM, DBG_SPEND_TREND,
  DBG_HEATMAP, DBG_DONUT_V2, DBG_TXN_TABLE,
  DBG_BIG_EXPENSES,
} from "@/app/lib/debug-fixtures";
import { SPENDING_PLAN_FIXTURE } from "@/app/preview/fixtures/gbpFlowFixture";

// ── Visualization items with state variants ───────────────────
type VizFixture =
  | { name: string; data: ChatCardData }
  | { name: string; render: () => React.ReactNode };

type VizItem = {
  type: string;
  label: string;
  fixtures: VizFixture[];
};

// Deterministic daily-spend series for the dynamic spend-trend variants (no Math.random so the
// demo is stable). A weekly rhythm + periodic spikes reads like real spend data.
function makeDailyTrend(days: number): ChatCardData {
  const chartData = Array.from({ length: days }, (_, i) => {
    const wk = Math.sin((i / 7) * Math.PI * 2);
    const base = 900 + wk * 350 + (i % 5 === 0 ? 600 : 0) + (i % 3 === 0 ? 180 : 0);
    // Axis shows the bare number; header shows the full date via `caption` (May has 31 days).
    return { label: String(i + 1), value: Math.round(Math.max(120, base)), caption: `${i + 1} May` };
  });
  const average = Math.round(chartData.reduce((s, d) => s + d.value, 0) / days);
  let hi = 0;
  chartData.forEach((d, i) => { if (d.value > chartData[hi].value) hi = i; });
  return { type: "spend-trend", month: chartData[hi].caption ?? chartData[hi].label, chartData, average, highlightIndex: hi };
}

const VIZ_ITEMS: VizItem[] = [
  {
    type: "spend-overview",
    label: "Spend overview",
    fixtures: [{ name: "default", data: { ...DBG_SPEND_OVERVIEW } }],
  },
  {
    type: "category-breakdown",
    label: "Category breakdown",
    fixtures: [{ name: "default", data: { ...DBG_CATEGORY_BAR } }],
  },
  {
    type: "merchant-concentration",
    label: "Merchant concentration",
    fixtures: [{ name: "default", data: { ...DBG_MERCHANT_BAR } }],
  },
  {
    type: "category-mom",
    label: "Category month-on-month",
    fixtures: [{ name: "default", data: { ...DBG_CATEGORY_MOM } }],
  },
  {
    type: "spending-heatmap",
    label: "Spending heatmap",
    fixtures: [{ name: "default", data: { ...DBG_HEATMAP } }],
  },
  {
    type: "payment-mode-donut-v2",
    label: "Payment mode breakdown",
    fixtures: [{ name: "default", data: { ...DBG_DONUT_V2 } }],
  },
  {
    type: "transaction-table",
    label: "Transaction table",
    fixtures: [
      { name: "default", data: { ...DBG_TXN_TABLE } },
      { name: "big expenses", data: { ...DBG_BIG_EXPENSES } },
    ],
  },
  {
    type: "spend-trend",
    label: "Spend trend",
    fixtures: [
      { name: "6 months", data: { ...DBG_SPEND_TREND } },
      { name: "7 days", data: makeDailyTrend(7) },
      { name: "14 days", data: makeDailyTrend(14) },
      { name: "31 days", data: makeDailyTrend(31) },
    ],
  },
  {
    type: "budget-summary",
    label: "Budget summary",
    fixtures: [
      { name: "default", render: () => <BudgetSummaryViz plan={SPENDING_PLAN_FIXTURE} /> },
    ],
  },
  {
    type: "category-budgets",
    label: "Category budgets",
    fixtures: [
      { name: "default", render: () => <CategoryBudgetsViz plan={SPENDING_PLAN_FIXTURE} /> },
    ],
  },
];

function renderFixture(fixture: VizFixture): React.ReactNode {
  return "data" in fixture
    ? <ChatCard card={fixture.data} />
    : fixture.render();
}

function VizEntry({ item }: { item: VizItem }) {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <PlaygroundCard
      id={item.type}
      name={item.label}
      variants={item.fixtures.map((f) => f.name)}
      activeVariantIndex={activeIdx}
      onVariantChange={setActiveIdx}
    >
      {renderFixture(item.fixtures[activeIdx])}
    </PlaygroundCard>
  );
}

export default function VisualizationsPage() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Visualizations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Data visualizations for spend analysis and tracking
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {VIZ_ITEMS.map((item) => (
          <VizEntry key={item.type} item={item} />
        ))}
      </div>
    </div>
  );
}
