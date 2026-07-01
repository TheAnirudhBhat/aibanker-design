"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { typography } from "../lib/typography";
import { VALENTINO_500, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, BG_CARD, OUTLINE_SUBTLE } from "../lib/colors";
import { ELEVATION_CARD } from "../lib/elevation";

// The "+10% more a month" benefit as a small DLS card: a title, a two-line graph (the slice
// SpendOverviewCard idiom — Valentino line, all-caps legend), and a one-line explanation. Two smooth
// paths start together and diverge ("on your own" vs "everything linked") — the widening gap IS the
// +10%. Both draw on with a staggered stroke animation. "Disconnect anytime" lives in Ryan's line above.

// Long enough to cover either path's length, so offset L→0 sweeps the whole line in.
const DASH = 340;

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

export default function SaveMoreStatCard() {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    // Kick the draw one frame after mount so the stroke-dashoffset transition actually runs.
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setDrawn(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const drawStyle = (delayMs: number): CSSProperties => ({
    strokeDasharray: DASH,
    strokeDashoffset: drawn ? 0 : DASH,
    transition: `stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms`,
  });

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
      <p style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY, margin: "0 0 12px" }}>
        Link everything, save more
      </p>

      <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
        <Legend color={TEXT_TERTIARY} label="On your own" />
        <Legend color={VALENTINO_500} label="Everything linked" />
      </div>

      <div style={{ position: "relative" }}>
        <svg viewBox="0 0 300 60" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 60 }}>
          {/* baseline — gentle climb, muted */}
          <path
            d="M2,50 C 90,48 180,43 298,39"
            fill="none"
            stroke={TEXT_TERTIARY}
            strokeWidth={2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            opacity={0.5}
            style={drawStyle(0)}
          />
          {/* everything linked — pulls ahead, brand line */}
          <path
            d="M2,50 C 90,46 180,26 298,12"
            fill="none"
            stroke={VALENTINO_500}
            strokeWidth={2.5}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={drawStyle(220)}
          />
        </svg>

        {/* +10% callout — sits over the linked line's peak, fades in once the lines have drawn */}
        <div
          style={{
            position: "absolute",
            top: -2,
            right: 0,
            textAlign: "right",
            opacity: drawn ? 1 : 0,
            transform: drawn ? "translateY(0)" : "translateY(4px)",
            transition: "opacity 360ms ease 780ms, transform 360ms ease 780ms",
          }}
        >
          <div style={{ ...typography.buttonNormal, fontWeight: 700, lineHeight: 1, color: VALENTINO_500 }}>+10%</div>
          <div style={{ ...typography.metadata, color: TEXT_TERTIARY, marginTop: 2 }}>a month</div>
        </div>
      </div>

      <p style={{ ...typography.caption, color: TEXT_SECONDARY, margin: "12px 0 0" }}>
        People who connect all their accounts save about 10% more a month, on average.
      </p>
    </div>
  );
}
