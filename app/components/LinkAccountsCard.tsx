"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { typography } from "../lib/typography";
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, BG_CARD, BG_SECONDARY, OUTLINE_SUBTLE, VALENTINO_500 } from "../lib/colors";
import { RADIUS_PILL } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";
import TrustNote from "./TrustNote";

// The WHY-to-link card, reframed around USER benefit but kept SIMPLE: two labelled bars comparing how
// close each plan gets you to the goal. "Full picture" (salary + cards + UPI) nearly fills the track;
// "slice only" falls well short. No invented numbers — the bar lengths carry the story. Replaces the
// earlier Cal-AI dual-curve graph, which read as too complex for a link-accounts prompt.
const BARS = [
  { id: "full", label: "Full picture", pct: 96, fill: VALENTINO_500, labelColor: TEXT_PRIMARY, labelWeight: 500 as const, goalMarker: true },
  { id: "slice", label: "slice only", pct: 42, fill: TEXT_TERTIARY, labelColor: TEXT_SECONDARY, labelWeight: 400 as const, goalMarker: false },
];

export default function LinkAccountsCard() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const fadeUp = (delay: number): CSSProperties => ({
    opacity: shown ? 1 : 0,
    transform: shown ? "translateY(0)" : "translateY(5px)",
    transition: `opacity 340ms ease ${delay}ms, transform 340ms ease ${delay}ms`,
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
      <p style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY, margin: 0, ...fadeUp(0) }}>
        A plan that gets you there
      </p>

      {/* Two bars — how close each plan gets you to the goal. The full track = the goal; the lengths
          carry the story (full picture nearly there, slice only well short). No numbers, on purpose. */}
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {BARS.map((bar, i) => (
          <div key={bar.id} style={fadeUp(120 + i * 80)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ ...typography.caption, color: bar.labelColor, fontWeight: bar.labelWeight }}>{bar.label}</span>
              {bar.goalMarker && (
                <span style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY }}>Goal</span>
              )}
            </div>
            <div style={{ height: 10, borderRadius: RADIUS_PILL, backgroundColor: BG_SECONDARY, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: shown ? `${bar.pct}%` : "0%",
                  backgroundColor: bar.fill,
                  borderRadius: RADIUS_PILL,
                  transition: `width 720ms cubic-bezier(0.22, 1, 0.36, 1) ${240 + i * 120}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <p style={{ ...typography.caption, color: TEXT_SECONDARY, margin: "16px 0 0", ...fadeUp(560) }}>
        Link salary, cards and UPI for a plan built on your real money. slice spends alone is a guess.
      </p>

      {/* Guardrail — the read-only / can't-move-money promise, right at the decision. */}
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${OUTLINE_SUBTLE}`, ...fadeUp(640) }}>
        <TrustNote text="Read-only, via RBI Account Aggregator. slice can see your money, never move it." />
      </div>
    </div>
  );
}
