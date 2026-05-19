"use client";

import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY,
  OUTLINE_SUBTLE, BG_PRIMARY,
  GREEN_500,
  RED_500,
  VALENTINO_500, VALENTINO_50,
} from "../lib/colors";
import { RADIUS_CIRCLE } from "../lib/radii";
import type { SpendingPlan, CategoryBudget } from "../lib/types";
import { DlsTag, CARD_RADIUS, CARD_PAD, CARD_SHADOW, CARD_BORDER } from "./ChatCards";

function formatINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatINRFull(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

// Summary row - sign + label + amount
function SummaryRow({ sign, label, amount, isBold }: { sign: string; label: string; amount: number; isBold?: boolean }) {
  const textStyle = isBold ? typography.headerH4 : typography.bodySmall;
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "4px 0" }}>
      <span
        style={{
          ...typography.bodySmall,
          color: sign === "+" ? GREEN_500 : sign === "−" ? RED_500 : TEXT_TERTIARY,
          width: 20,
          textAlign: "center",
        }}
      >
        {sign}
      </span>
      <span style={{ ...textStyle, color: TEXT_SECONDARY, flex: 1, marginLeft: 8 }}>
        {label}
      </span>
      <span style={{ ...textStyle, color: TEXT_PRIMARY }}>
        {formatINRFull(amount)}
      </span>
    </div>
  );
}

// Category budget row - DLS progress bar + DlsTag for biggest cut
function CategoryBudgetRow({ budget, isLast }: { budget: CategoryBudget; isLast: boolean }) {
  const rangeWidth = budget.rangeMax - budget.rangeMin;
  const capPosition = rangeWidth > 0 ? ((budget.cap - budget.rangeMin) / rangeWidth) * 100 : 50;
  const barColor = budget.isBiggestCut ? RED_500 : VALENTINO_500;
  const trackColor = VALENTINO_50;

  return (
    <div
      style={{
        padding: isLast ? "16px 0 0 0" : "16px 0",
        borderBottom: isLast ? "none" : `1px solid ${OUTLINE_SUBTLE}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Left: name + optional tag */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY }}>
            {budget.name}
          </span>
          {budget.isBiggestCut && (
            <DlsTag intent="negative" emphasis="subtle">biggest cut</DlsTag>
          )}
        </div>

        {/* Right: cap amount */}
        <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, flexShrink: 0, marginLeft: 8 }}>
          {formatINR(budget.cap)}
        </span>
      </div>

      {/* DLS progress bar - 8px height, VALENTINO_50 track, colored fill */}
      <div
        style={{
          height: 8,
          backgroundColor: trackColor,
          borderRadius: RADIUS_CIRCLE,
          overflow: "hidden",
          marginTop: 8,
        }}
      >
        <div
          style={{
            width: `${capPosition}%`,
            height: "100%",
            backgroundColor: barColor,
            borderRadius: RADIUS_CIRCLE,
            boxShadow: budget.isBiggestCut ? undefined : `0px 2px 4px rgba(211,10,215,0.2)`,
          }}
        />
      </div>

      {/* Range labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY }}>
          {formatINR(budget.rangeMin)}
        </span>
        <span style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY }}>
          {formatINR(budget.rangeMax)}
        </span>
      </div>
    </div>
  );
}

export default function SpendingPlanCard({ plan }: { plan: SpendingPlan }) {
  return (
    <div
      style={{
        backgroundColor: BG_PRIMARY,
        border: CARD_BORDER,
        borderRadius: CARD_RADIUS,
        padding: CARD_PAD,
        boxShadow: CARD_SHADOW,
      }}
    >
      {/* Summary section */}
      <div style={{ marginBottom: 8 }}>
        <span style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY }}>
          Summary
        </span>
      </div>

      <SummaryRow sign="+" label="Income" amount={plan.income} />
      <SummaryRow sign="−" label="Obligations" amount={plan.obligations} />
      <SummaryRow sign="−" label="Savings target" amount={plan.savingsTarget} />
      <div style={{ height: 1, backgroundColor: OUTLINE_SUBTLE, margin: "4px 0" }} />
      <SummaryRow sign="=" label="Daily pool" amount={plan.dailyPool} isBold />

      {/* Divider between sections */}
      <div style={{ height: 1, backgroundColor: OUTLINE_SUBTLE, margin: "16px 0 8px 0" }} />

      {/* Category budgets section */}
      <div style={{ marginBottom: 8 }}>
        <span style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY }}>
          Category budgets
        </span>
      </div>

      {plan.categoryBudgets.map((b, i) => (
        <CategoryBudgetRow key={b.name} budget={b} isLast={i === plan.categoryBudgets.length - 1} />
      ))}
    </div>
  );
}
