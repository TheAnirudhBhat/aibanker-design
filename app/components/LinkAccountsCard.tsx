"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { typography } from "../lib/typography";
import { TEXT_PRIMARY, TEXT_TERTIARY, BG_CARD, BG_SECONDARY, VALENTINO_500, EXT_BG_SUBTLE_MAIN } from "../lib/colors";
import { ELEVATION_CARD } from "../lib/elevation";

// AA reassurance, led by the payoff: people who link their accounts reach their goal ~1.5x faster,
// shown as a two-bar comparison (slice-only vs linked). The RBI read-only trust point rides below
// as a list item. Goal-centric copy keeps the goal in view during the connect step.
const GOAL_PHRASE: Record<string, string> = {
  "A trip": "your trip",
  "Emergency fund": "your emergency fund",
  "Big purchase": "your purchase",
  "Just save more": "your savings goal",
  "Your goal": "your goal",
};

// Bar heights (px). Linked ≈ 1.5x slice-only — the whole point of the visual.
const BAR_SLICE = 56;
const BAR_LINKED = 88;

export default function LinkAccountsCard({ goalLabel }: { goalLabel?: string }) {
  const goalPhrase = (goalLabel && GOAL_PHRASE[goalLabel]) || "your goal";
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

  const bar = (h: number, delay: number): CSSProperties => ({
    width: 52,
    height: shown ? h : 0,
    borderRadius: "8px 8px 0 0",
    transition: `height 560ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  });

  return (
    <div
      style={{
        // 4px wider than the text column on each side (chat column stretches children → negative bleed).
        marginLeft: -4,
        marginRight: -4,
        backgroundColor: BG_CARD,
        border: "var(--dls-card-border)",
        borderRadius: 16,
        padding: 24,
        boxShadow: ELEVATION_CARD,
      }}
    >
      {/* One line, one size — the stat is the whole hook. */}
      <p style={{ ...typography.headerH3, color: TEXT_PRIMARY, margin: 0, ...fadeUp(80) }}>
        Reach {goalPhrase} 1.5x faster
      </p>

      {/* Two-bar comparison: slice-only vs linked (~1.5x taller). */}
      <div
        style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 40, height: 120, marginTop: 24, ...fadeUp(200) }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ ...bar(BAR_SLICE, 200), backgroundColor: BG_SECONDARY }} />
          <span style={{ ...typography.caption, color: TEXT_TERTIARY, whiteSpace: "nowrap" }}>slice only</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, position: "relative" }}>
          {/* "1.5x faster" badge above the taller bar */}
          <div
            style={{
              padding: "3px 8px",
              borderRadius: 999,
              backgroundColor: EXT_BG_SUBTLE_MAIN,
              opacity: shown ? 1 : 0,
              transform: shown ? "translateY(0)" : "translateY(4px)",
              transition: "opacity 300ms ease 620ms, transform 300ms ease 620ms",
            }}
          >
            <span style={{ ...typography.buttonSmall, color: VALENTINO_500, whiteSpace: "nowrap" }}>1.5x faster</span>
          </div>
          <div style={{ ...bar(BAR_LINKED, 320), backgroundColor: VALENTINO_500 }} />
          <span style={{ ...typography.caption, color: TEXT_PRIMARY, fontWeight: 500, whiteSpace: "nowrap" }}>+ linked</span>
        </div>
      </div>

    </div>
  );
}
