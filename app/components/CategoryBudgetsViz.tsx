"use client";

import { Fragment } from "react";
import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  OUTLINE_SUBTLE,
  OUTLINE_BOLD,
  GREEN_500,
  VALENTINO_500,
  CAT_AVATAR_FILL,
} from "../lib/colors";
import { RADIUS_S, RADIUS_CIRCLE } from "../lib/radii";
// CATEGORY_ICONS is the single source of truth for category glyphs. ChatCards renders this component,
// so this is a render-only import cycle (ESM live binding, resolved by the time either renders) — safe,
// and it keeps one icon registry rather than a drifting local copy.
import { CATEGORY_ICONS } from "./ChatCards";
import type { SpendingPlan } from "../lib/types";

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

// A spend RANGE around the typical spend (compact, ₹4k–6k) reads as "what you usually spend"
// leading into the suggested budget.
function spendRange(currentSpend: number): string {
  const low = Math.floor((currentSpend * 0.85) / 500) * 500;
  const high = Math.ceil((currentSpend * 1.15) / 500) * 500;
  const k = (v: number) => { const t = v / 1000; return `${Number.isInteger(t) ? t : t.toFixed(1)}k`; };
  return `₹${k(low)}–${k(high)}`;
}

export type CategoryBudgetsVizProps = {
  plan: Pick<SpendingPlan, "categoryBudgets">;
  editable?: boolean;
  onCapChange?: (name: string, cap: number) => void;
};

// Suggested-caps card (Figma 234:126): a "Monthly budget" total header (green — the sum of the caps),
// then one divider-separated row per category — a slate avatar with the category glyph, the name +
// "usually ₹X–Yk", and the cap on the right.
export default function CategoryBudgetsViz({ plan, editable, onCapChange }: CategoryBudgetsVizProps) {
  const total = plan.categoryBudgets.reduce((sum, b) => sum + b.cap, 0);
  // "Everything else" is the catch-all remainder, not a tracked cap — hide it from the list. The
  // Monthly budget total above still reflects the full budget.
  const rows = plan.categoryBudgets.filter((b) => b.name !== "Everything else");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header — Monthly budget total (green), the sum of the caps below */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ ...typography.headerH4, color: TEXT_SECONDARY }}>Monthly budget</span>
        <span style={{ ...typography.headerH4, color: GREEN_500, whiteSpace: "nowrap" }}>{formatINR(total)}</span>
      </div>
      <div style={{ height: 0, borderTop: `1px dotted ${OUTLINE_BOLD}` }} />

      {/* Per-category rows: avatar · name + usual-spend · cap. Hairline between rows. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {rows.map((b, i) => (
          <Fragment key={b.name}>
            {i > 0 && <div style={{ height: 0, borderTop: `1px dotted ${OUTLINE_BOLD}` }} />}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                {/* Slate avatar + category glyph — DLS Avatar (32px) */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: RADIUS_CIRCLE,
                    backgroundColor: CAT_AVATAR_FILL,
                    border: `1px solid ${OUTLINE_SUBTLE}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {CATEGORY_ICONS[b.name] ?? CATEGORY_ICONS["Miscellaneous"]}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ ...typography.bodySmall, color: TEXT_PRIMARY, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {b.name}
                  </span>
                  <span style={{ ...typography.caption, color: TEXT_TERTIARY, whiteSpace: "nowrap" }}>
                    usually {spendRange(b.currentSpend)}
                  </span>
                </div>
              </div>

              {editable ? (
                // Editable cap — a small numeric input pill, right-aligned.
                <label style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 1, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_S, padding: "4px 8px", cursor: "text" }}>
                  <span style={{ ...typography.buttonSmall, color: TEXT_TERTIARY }}>₹</span>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={b.cap ? b.cap.toLocaleString("en-IN") : ""}
                    onChange={(e) => onCapChange?.(b.name, Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
                    style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, fontFamily: "var(--font-rubik), sans-serif", border: "none", outline: "none", background: "transparent", padding: 0, margin: 0, width: 52, textAlign: "right", caretColor: VALENTINO_500 }}
                  />
                </label>
              ) : (
                <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, whiteSpace: "nowrap", flexShrink: 0 }}>
                  {formatINR(b.cap)}
                </span>
              )}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
