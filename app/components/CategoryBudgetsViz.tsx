"use client";

import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY, TEXT_TERTIARY,
  BG_PRIMARY,
  OUTLINE_SUBTLE,
  VALENTINO_500,
} from "../lib/colors";
import { RADIUS_CIRCLE, RADIUS_S } from "../lib/radii";
import type { SpendingPlan, CategoryBudget } from "../lib/types";
import { CATEGORY_ICONS } from "./ChatCards";

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

// Show a spend RANGE (a band around the typical spend) rather than a single figure — reads as
// "what you usually spend" leading into the suggested budget.
function spendRange(currentSpend: number): string {
  const low = Math.floor((currentSpend * 0.85) / 500) * 500;
  const high = Math.ceil((currentSpend * 1.15) / 500) * 500;
  return `${formatINR(low)}–${formatINR(high)}`;
}

function CategoryRow({
  budget,
  editable,
  onCapChange,
}: {
  budget: CategoryBudget;
  editable?: boolean;
  onCapChange?: (name: string, cap: number) => void;
}) {
  const icon = CATEGORY_ICONS[budget.name] ?? CATEGORY_ICONS["Miscellaneous"];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        paddingTop: 10,
        paddingBottom: 10,
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
          {spendRange(budget.currentSpend)}
        </p>
      </div>

      {editable ? (
        // Editable budget cap — a small numeric input pill; the whole row's budget is what you're tuning.
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexShrink: 0,
            border: `1px solid ${OUTLINE_SUBTLE}`,
            borderRadius: RADIUS_S,
            padding: "5px 10px",
            cursor: "text",
          }}
        >
          <span style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_TERTIARY }}>₹</span>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={budget.cap ? budget.cap.toLocaleString("en-IN") : ""}
            onChange={(e) => onCapChange?.(budget.name, Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
            style={{
              ...typography.bodySmall,
              fontWeight: 500,
              color: TEXT_PRIMARY,
              fontFamily: "var(--font-rubik), sans-serif",
              border: "none",
              outline: "none",
              background: "transparent",
              padding: 0,
              margin: 0,
              width: 56,
              textAlign: "right",
              caretColor: VALENTINO_500,
            }}
          />
        </label>
      ) : (
        // Right value = the suggested budget (the cap), not a delta.
        <p style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY, textAlign: "right", whiteSpace: "nowrap", margin: 0, flexShrink: 0 }}>
          {formatINR(budget.cap)}
        </p>
      )}
    </div>
  );
}

export type CategoryBudgetsVizProps = {
  plan: Pick<SpendingPlan, "categoryBudgets">;
  editable?: boolean;
  onCapChange?: (name: string, cap: number) => void;
};

export default function CategoryBudgetsViz({ plan, editable, onCapChange }: CategoryBudgetsVizProps) {
  return (
    <div style={{ padding: 0 }}>
      <div style={{ marginBottom: 12 }}>
        {/* Heading reads like a bottom-sheet title (headerH3), sentence case. */}
        <p style={{ ...typography.headerH3, color: TEXT_PRIMARY, margin: 0 }}>
          Category budgets
        </p>
        {/* Sub-line: left-aligned under the heading, one step smaller. */}
        <p style={{ ...typography.metadata, color: TEXT_TERTIARY, margin: "2px 0 0", textAlign: "left" }}>
          {editable ? "Set a monthly budget per category" : "Spend range → suggested budget"}
        </p>
      </div>

      {plan.categoryBudgets.map((b) => (
        <CategoryRow key={b.name} budget={b} editable={editable} onCapChange={onCapChange} />
      ))}

      {/* Total of the suggested budgets — the whole monthly budget. Recomputes live as caps are edited. */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, marginTop: 4, borderTop: `1px solid ${OUTLINE_SUBTLE}` }}>
        <span style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY }}>Total</span>
        <span style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY }}>
          {formatINR(plan.categoryBudgets.reduce((sum, b) => sum + b.cap, 0))}
        </span>
      </div>
    </div>
  );
}
