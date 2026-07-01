"use client";

import { typography } from "../lib/typography";
import { TEXT_PRIMARY, TEXT_TERTIARY, BG_CARD, OUTLINE_SUBTLE, GREEN_500 } from "../lib/colors";
import { ELEVATION_CARD } from "../lib/elevation";

// "What I can see" — the WHY-to-link card. Instead of an abstract +10% stat, it makes Ryan's blind
// spots tangible: slice spends are linked (✓), but salary / cards / other UPI are locked, so right
// now he only sees a sliver. That's the argument for connecting. Static intro card (no live connect).
const LOCKED = ["Salary account", "Credit card", "Other UPI apps"];

function CheckGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill={GREEN_500} />
      <path d="M5 8.2L7 10.2L11 5.8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.6" stroke={TEXT_TERTIARY} strokeWidth="1.3" />
      <path d="M5.3 7V5.5a2.7 2.7 0 0 1 5.4 0V7" stroke={TEXT_TERTIARY} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function Row({ label, connected }: { label: string; connected?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 9, paddingBottom: 9, opacity: connected ? 1 : 0.5 }}>
      {connected ? <CheckGlyph /> : <LockGlyph />}
      <span style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY, margin: 0, flex: 1, minWidth: 0 }}>{label}</span>
      <span style={{ ...typography.caption, color: connected ? GREEN_500 : TEXT_TERTIARY, flexShrink: 0 }}>
        {connected ? "Linked" : "Locked"}
      </span>
    </div>
  );
}

export default function LinkAccountsCard() {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: BG_CARD,
        border: `1px solid ${OUTLINE_SUBTLE}`,
        borderRadius: 16,
        padding: "14px 16px 16px",
        boxShadow: ELEVATION_CARD,
      }}
    >
      <p style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY, margin: "0 0 6px" }}>
        What I can see
      </p>
      <Row label="slice spends" connected />
      {LOCKED.map((l) => (
        <Row key={l} label={l} />
      ))}
      <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: "12px 0 0" }}>
        Link them and I see the whole picture, not just slice.
      </p>
    </div>
  );
}
