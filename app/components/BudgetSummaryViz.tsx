"use client";

import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY,
  OUTLINE_SUBTLE,
  GREEN_500,
  RED_500,
} from "../lib/colors";
import type { SpendingPlan } from "../lib/types";

function formatINRFull(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

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

export type BudgetSummaryVizProps = {
  plan: Pick<SpendingPlan, "income" | "obligations" | "savingsTarget" | "dailyPool">;
};

export default function BudgetSummaryViz({ plan }: BudgetSummaryVizProps) {
  return (
    <div style={{ padding: "4px 0 8px" }}>
      <div style={{ marginBottom: 8 }}>
        <span style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY }}>
          Summary
        </span>
      </div>

      <SummaryRow sign="+" label="Income" amount={plan.income} />
      <SummaryRow sign="−" label="Obligations" amount={plan.obligations} />
      <SummaryRow sign="−" label="Savings target" amount={plan.savingsTarget} />
      <div style={{ height: 1, backgroundColor: OUTLINE_SUBTLE, margin: "4px 0" }} />
      {/* The PRD anchor (§3.4): what's free to spend after committed outflows + reserved saving. */}
      <SummaryRow sign="=" label="Safe to spend" amount={plan.dailyPool} isBold />
    </div>
  );
}
