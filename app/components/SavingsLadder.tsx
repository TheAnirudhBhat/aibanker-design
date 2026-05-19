"use client";

import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY,
  VALENTINO_500, VALENTINO_50,
  ALPHA_BLACK_20,
  BG_PRIMARY,
  OUTLINE_SUBTLE,
} from "../lib/colors";
import { RADIUS_CIRCLE } from "../lib/radii";
import type { LadderOption, LadderTier } from "../lib/types";
import { DlsTag, CARD_RADIUS, CARD_PAD, CARD_SHADOW, CARD_BORDER } from "./ChatCards";

// Intent mapping: tier → DlsTag intent
const TIER_INTENT: Record<LadderTier, "positive" | "warning" | "negative"> = {
  comfortable: "positive",
  realistic: "warning",
  stretch: "negative",
};

function formatINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function SavingsLadder({
  options,
  selected,
  onSelect,
}: {
  options: LadderOption[];
  selected: LadderTier | null;
  onSelect: (tier: LadderTier) => void;
}) {
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
      {/* Header - CardHeader pattern */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
        <span style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY }}>
          Savings tiers
        </span>
      </div>

      {/* Selection rows - obligations list item pattern */}
      {options.map((opt, i) => {
        const isSelected = selected === opt.tier;

        return (
          <div key={opt.tier}>
            <button
              type="button"
              onClick={() => onSelect(opt.tier)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "16px 0",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {/* DLS checkbox - 24×24, 48×32 touch target */}
              <div style={{ width: 32, height: 48, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ transition: "transform 150ms ease", transform: isSelected ? "scale(1)" : "scale(0.9)" }}>
                  {isSelected ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill={VALENTINO_500} />
                      <circle cx="12" cy="12" r="4" fill="white" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9.5" stroke={ALPHA_BLACK_20} strokeWidth="1" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Content - tag + description */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <DlsTag intent={TIER_INTENT[opt.tier]} emphasis="subtle">
                    {opt.tier}
                  </DlsTag>
                  {opt.categoryCuts > 0 && (
                    <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>
                      {opt.categoryCuts === 1 ? "1 tweak" : `${opt.categoryCuts} tweaks`}
                    </span>
                  )}
                </div>
                <p style={{ ...typography.bodySmall, color: TEXT_SECONDARY, margin: 0 }}>
                  {opt.description}
                </p>
              </div>

              {/* Amount - right-aligned */}
              <span style={{ ...typography.headerH3, color: TEXT_PRIMARY, flexShrink: 0, marginLeft: 8 }}>
                {formatINR(opt.monthlyAmount)}
                <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>/mo</span>
              </span>
            </button>

            {/* Divider - 1px OUTLINE_SUBTLE between rows */}
            {i < options.length - 1 && (
              <div style={{ height: 1, backgroundColor: OUTLINE_SUBTLE }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
