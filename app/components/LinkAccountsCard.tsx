"use client";

import { typography } from "../lib/typography";
import { TEXT_PRIMARY, TEXT_TERTIARY, BG_CARD, OUTLINE_SUBTLE, VALENTINO_500 } from "../lib/colors";
import { ELEVATION_CARD } from "../lib/elevation";

// The WHY-to-link card, visualised: a 4-segment coverage donut where only ONE arc is lit (slice
// spends) and three are faint (salary / cards / other UPI). One glance = "Ryan sees a sliver." The
// accounts he's blind to are named beside it. No invented stat — the proportion IS the argument.

const R = 26;
const CX = 32;
const CY = 32;
const SW = 8;
const GAP_DEG = 16; // gap between the four quadrant arcs

function arc(startDeg: number, endDeg: number): string {
  const rad = (d: number) => ((d - 90) * Math.PI) / 180; // -90 so segment 0 starts at the top
  const x1 = CX + R * Math.cos(rad(startDeg));
  const y1 = CY + R * Math.sin(rad(startDeg));
  const x2 = CX + R * Math.cos(rad(endDeg));
  const y2 = CY + R * Math.sin(rad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

// Four quadrant segments; index 0 is the lit "slice" arc, 1–3 are the locked (faint) accounts.
const SEGMENTS = [0, 1, 2, 3].map((i) => arc(i * 90 + GAP_DEG / 2, (i + 1) * 90 - GAP_DEG / 2));

export default function LinkAccountsCard() {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: BG_CARD,
        border: `1px solid ${OUTLINE_SUBTLE}`,
        borderRadius: 16,
        padding: 16,
        boxShadow: ELEVATION_CARD,
      }}
    >
      <p style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY, margin: 0 }}>
        What I can see
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
        <svg width={64} height={64} viewBox="0 0 64 64" style={{ flexShrink: 0 }} aria-hidden="true">
          {SEGMENTS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={i === 0 ? VALENTINO_500 : TEXT_TERTIARY}
              strokeWidth={SW}
              strokeLinecap="round"
              opacity={i === 0 ? 1 : 0.22}
            />
          ))}
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY, margin: 0 }}>
            Just your slice spends
          </p>
          <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: "2px 0 0" }}>
            Salary, cards and other UPI are still locked
          </p>
        </div>
      </div>

      <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: "12px 0 0" }}>
        Link them and I see the whole picture. Disconnect anytime.
      </p>
    </div>
  );
}
