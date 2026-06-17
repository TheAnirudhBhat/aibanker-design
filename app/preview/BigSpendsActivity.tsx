"use client";

import React, { useState } from "react";
import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY,
  TEXT_TERTIARY,
  TEXT_ON_COLOR_PRIMARY,
  BG_PRIMARY,
  OUTLINE_SUBTLE,
  ALPHA_BLACK_30,
  VALENTINO_500, VALENTINO_700,
  BLUE_400, BLUE_500,
  ORANGE_400, ORANGE_500,
  GREEN_400, GREEN_500,
  RED_500,
  SLATE_500,
} from "../lib/colors";
import { SPACE_XS, SPACE_S, SPACE_L, SPACE_XL } from "../lib/spacing";
import { RADIUS_CIRCLE } from "../lib/radii";
import { StatusBar, GestureNav } from "../components/AppChrome";
import { formatDateRange } from "../lib/format-date";

// ── INR (Indian grouping) — same one-liner used in ChatCards/BudgetScreen ──
function formatINRFull(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

// Same per-merchant palette the TransactionTableCard uses, so the list reads
// as a visual continuation of the card.
const PALETTE = [VALENTINO_500, BLUE_500, ORANGE_500, GREEN_500, RED_500, VALENTINO_700, BLUE_400, ORANGE_400, GREEN_400, SLATE_500];

// Close (X) glyph — identical to AASim's CloseIcon.
function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke={TEXT_PRIMARY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Txn = { date: string; merchant: string; amount: number; category: string };

export default function BigSpendsActivity({
  title,
  transactions,
  onClose,
}: {
  title: string;
  transactions: Txn[];
  onClose: () => void;
}) {
  // Assign a consistent color per unique merchant (matches the card).
  const merchantColorMap = new Map<string, string>();
  let colorIdx = 0;
  for (const tx of transactions) {
    if (!merchantColorMap.has(tx.merchant)) {
      merchantColorMap.set(tx.merchant, PALETTE[colorIdx % PALETTE.length]);
      colorIdx++;
    }
  }

  // Header echoes the source TransactionTableCard: total + date range. Same
  // computation (newest is index 0, oldest is last) so the page reads as a
  // continuation of the card the user tapped.
  const total = transactions.reduce((s, tx) => s + tx.amount, 0);
  const dateRange =
    transactions.length > 1
      ? formatDateRange(transactions[transactions.length - 1]!.date, transactions[0]!.date)
      : (transactions[0]?.date ?? "");

  // App-bar elevation kicks in once the list scrolls off the top.
  const [scrolled, setScrolled] = useState(false);

  return (
    <div className="h-full w-full flex flex-col" style={{ backgroundColor: BG_PRIMARY }}>
      <StatusBar backgroundColor="transparent" />

      {/* App bar - X close only. The page title lives in the content header
          below (mirrors the source card), so we don't repeat it up here. */}
      <div
        className="flex items-center shrink-0"
        style={{
          height: 64, paddingLeft: 12, paddingRight: SPACE_XS, paddingTop: SPACE_XS, paddingBottom: SPACE_XS,
          backgroundColor: BG_PRIMARY,
          position: "relative",
          zIndex: 1,
          boxShadow: scrolled ? "0px 6px 8px rgba(0,0,0,0.05)" : "none",
          transition: "box-shadow 200ms ease",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex items-center justify-center transition-opacity active:opacity-60"
          style={{ width: 48, height: 48, background: "none", border: "none", cursor: "pointer", padding: 12 }}
        >
          <CloseIcon />
        </button>
      </div>

      {/* Transaction list */}
      <div onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)} className="flex-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Content header — centred to match the DLS "Top header" (node 6670:52816):
            14px Medium title, Display/Small amount, 12px caption date; gaps 8 then 4. */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: `0 ${SPACE_L}px`, marginBottom: SPACE_XL }}>
          <p style={{ ...typography.buttonSmall, color: TEXT_TERTIARY, margin: 0, marginBottom: 8, textAlign: "center", width: "100%" }}>
            {title}
          </p>
          <p style={{ ...typography.displaySmall, color: TEXT_PRIMARY, margin: 0, marginBottom: 4, textAlign: "center", width: "100%", whiteSpace: "nowrap" }}>
            {formatINRFull(total)}
          </p>
          <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: 0, textAlign: "center", width: "100%" }}>
            {dateRange}
          </p>
        </div>

        {transactions.map((tx, i) => {
          const avatarColor = merchantColorMap.get(tx.merchant) || PALETTE[0];
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: `16px ${SPACE_L}px`,
              }}
            >
              {/* Leading avatar - colored merchant monogram */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: RADIUS_CIRCLE,
                  backgroundColor: avatarColor,
                  border: `1px solid ${OUTLINE_SUBTLE}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ ...typography.buttonSmall, color: TEXT_ON_COLOR_PRIMARY }}>
                  {tx.merchant.charAt(0).toUpperCase()}
                </span>
              </div>
              {/* Merchant + subtitle */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    ...typography.bodyNormal,
                    color: TEXT_PRIMARY,
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tx.merchant}
                </p>
                <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: 0, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  {tx.date}
                  <span style={{ width: 2, height: 2, borderRadius: RADIUS_CIRCLE, backgroundColor: ALPHA_BLACK_30, flexShrink: 0 }} />
                  {tx.category}
                </p>
              </div>
              {/* Trailing amount */}
              <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, flexShrink: 0, whiteSpace: "nowrap" }}>
                {formatINRFull(tx.amount)}
              </span>
            </div>
          );
        })}
      </div>

      <GestureNav />
    </div>
  );
}
