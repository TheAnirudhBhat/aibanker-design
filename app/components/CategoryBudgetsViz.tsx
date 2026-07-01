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
// "what you usually spend" leading into the suggested budget. Compact (₹4k–6k) so it sits in a column.
function spendRange(currentSpend: number): string {
  const low = Math.floor((currentSpend * 0.85) / 500) * 500;
  const high = Math.ceil((currentSpend * 1.15) / 500) * 500;
  const k = (v: number) => { const t = v / 1000; return `${Number.isInteger(t) ? t : t.toFixed(1)}k`; };
  return `₹${k(low)}–${k(high)}`;
}

// One category = one table ROW of grid cells (avatar · name · usually-spend · budget). The column
// LABELS live ONCE in the header row of the parent grid, so "usually" and "budget" aren't repeated
// on every row.
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
    <>
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
          overflow: "hidden",
        }}
      >
        {icon}
      </div>

      <span style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {budget.name}
      </span>

      <span style={{ ...typography.caption, color: TEXT_TERTIARY, textAlign: "right", whiteSpace: "nowrap" }}>
        {spendRange(budget.currentSpend)}
      </span>

      {editable ? (
        // Editable budget cap — a small numeric input pill, right-aligned under the BUDGET column.
        <label
          style={{
            justifySelf: "end",
            display: "flex",
            alignItems: "center",
            gap: 1,
            border: `1px solid ${OUTLINE_SUBTLE}`,
            borderRadius: RADIUS_S,
            padding: "4px 8px",
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
              width: 48,
              textAlign: "right",
              caretColor: VALENTINO_500,
            }}
          />
        </label>
      ) : (
        <span style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY, textAlign: "right", whiteSpace: "nowrap" }}>
          {formatINR(budget.cap)}
        </span>
      )}
    </>
  );
}

export type CategoryBudgetsVizProps = {
  plan: Pick<SpendingPlan, "categoryBudgets">;
  editable?: boolean;
  onCapChange?: (name: string, cap: number) => void;
};

const HEADER_LABEL: React.CSSProperties = { ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY, textAlign: "right" };

export default function CategoryBudgetsViz({ plan, editable, onCapChange }: CategoryBudgetsVizProps) {
  const total = plan.categoryBudgets.reduce((sum, b) => sum + b.cap, 0);

  return (
    <div style={{ padding: 0 }}>
      {/* Heading reads like a bottom-sheet title (headerH3), sentence case. */}
      <p style={{ ...typography.headerH3, color: TEXT_PRIMARY, margin: "0 0 16px" }}>
        Category budgets
      </p>

      {/* Table grid: avatar · name · usually-spend · budget. The common labels sit ONCE in the header;
          rows carry only values. Grid keeps the two value columns aligned across every row. */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", columnGap: 10, rowGap: 16, alignItems: "center" }}>
        {/* Header row — the common labels */}
        <span />
        <span />
        <span style={HEADER_LABEL}>Usually</span>
        <span style={HEADER_LABEL}>Budget</span>

        {plan.categoryBudgets.map((b) => (
          <CategoryRow key={b.name} budget={b} editable={editable} onCapChange={onCapChange} />
        ))}

        {/* Divider across the whole grid, then Total (value under the Budget column). */}
        <div style={{ gridColumn: "1 / -1", height: 1, backgroundColor: OUTLINE_SUBTLE }} />
        <span />
        <span style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY }}>Total</span>
        <span />
        <span style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY, textAlign: "right", whiteSpace: "nowrap" }}>
          {formatINR(total)}
        </span>
      </div>
    </div>
  );
}
