"use client";

import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY, TEXT_TERTIARY,
  BG_PRIMARY,
  OUTLINE_SUBTLE,
  RED_400,
  GREEN_500,
} from "../lib/colors";
import { RADIUS_CIRCLE } from "../lib/radii";
import type { SpendingPlan, CategoryBudget } from "../lib/types";
import { CATEGORY_ICONS } from "./ChatCards";

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function CategoryRow({ budget }: { budget: CategoryBudget }) {
  const icon = CATEGORY_ICONS[budget.name] ?? CATEGORY_ICONS["Miscellaneous"];

  const isOver = budget.currentSpend > budget.cap;
  const isUnder = budget.currentSpend < budget.cap;
  const delta = Math.abs(budget.currentSpend - budget.cap);

  const deltaLine = isOver
    ? { text: formatINR(delta), color: RED_400 }
    : isUnder
    ? { text: formatINR(delta), color: GREEN_500 }
    : { text: "No change", color: TEXT_TERTIARY };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        paddingTop: 14,
        paddingBottom: 14,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: RADIUS_CIRCLE,
          backgroundColor: BG_PRIMARY,
          border: `1px solid ${OUTLINE_SUBTLE}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {icon}
      </div>

      <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <p style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY, margin: 0 }}>
          {budget.name}
        </p>
        <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: 0 }}>
          {formatINR(budget.currentSpend)} → {formatINR(budget.cap)}
        </p>
      </div>

      <p style={{ ...typography.bodySmall, fontWeight: 500, color: deltaLine.color, textAlign: "right", whiteSpace: "nowrap", margin: 0, flexShrink: 0 }}>
        {deltaLine.text}
      </p>
    </div>
  );
}

export type CategoryBudgetsVizProps = {
  plan: Pick<SpendingPlan, "categoryBudgets">;
};

export default function CategoryBudgetsViz({ plan }: CategoryBudgetsVizProps) {
  return (
    <div style={{ padding: "4px 0 8px" }}>
      <div style={{ marginBottom: 8 }}>
        <span style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY }}>
          Category budgets
        </span>
        {/* First budget has no 'before' — the arrow is what you typically spend → what we suggest. */}
        <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: "4px 0 0" }}>
          Your typical spend → suggested budget
        </p>
      </div>

      {plan.categoryBudgets.map((b) => (
        <CategoryRow key={b.name} budget={b} />
      ))}
    </div>
  );
}
