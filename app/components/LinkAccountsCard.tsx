"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { typography } from "../lib/typography";
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, TEXT_ON_COLOR_PRIMARY, BG_CARD, BG_SECONDARY, OUTLINE_SUBTLE, VALENTINO_500 } from "../lib/colors";
import { RADIUS_S, RADIUS_M } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";

// AA reassurance, Cal-AI two-bar style (slice-coloured): two tracks compare how much of your money
// the plan is built on — "Without linking" fills a sliver, "With linking" nearly fills (Valentino).
// Bar heights carry the story (coverage), not an invented stat. RBI guardrail kept at the decision.
const TRACK_H = 168;
const BARS = [
  { id: "without", head: ["Without", "linking"], label: "a slice", pct: 0.28, fill: `color-mix(in srgb, ${TEXT_TERTIARY} 42%, transparent)`, labelColor: TEXT_PRIMARY, delay: 220 },
  { id: "with", head: ["With", "linking"], label: "everything", pct: 0.92, fill: VALENTINO_500, labelColor: TEXT_ON_COLOR_PRIMARY, delay: 340 },
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
      {/* Two comparison tracks */}
      <div style={{ display: "flex", gap: 12 }}>
        {BARS.map((bar) => (
          <div
            key={bar.id}
            style={{
              flex: 1,
              height: TRACK_H,
              borderRadius: RADIUS_M,
              backgroundColor: `color-mix(in srgb, ${TEXT_PRIMARY} 5%, transparent)`,
              position: "relative",
              overflow: "hidden",
              ...fadeUp(bar.id === "without" ? 0 : 80),
            }}
          >
            {/* Header at the top of the track */}
            <div style={{ position: "absolute", top: 14, left: 0, right: 0, textAlign: "center" }}>
              {bar.head.map((line) => (
                <p key={line} style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY, margin: 0, lineHeight: 1.25 }}>{line}</p>
              ))}
            </div>
            {/* Fill grows from the bottom to its share; the label sits inside it */}
            <div
              style={{
                position: "absolute",
                left: 8,
                right: 8,
                bottom: 8,
                height: shown ? (TRACK_H - 16) * bar.pct : 0,
                borderRadius: RADIUS_S,
                backgroundColor: bar.fill,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: `height 720ms cubic-bezier(0.22, 1, 0.36, 1) ${bar.delay}ms`,
              }}
            >
              <span style={{ ...typography.buttonSmall, color: bar.labelColor }}>{bar.label}</span>
            </div>
          </div>
        ))}
      </div>

      <p style={{ ...typography.caption, color: TEXT_SECONDARY, margin: "16px 0 0", ...fadeUp(560) }}>
        Link your accounts so your plan sees everything you earn and spend, not just slice.
      </p>

      {/* Guardrail — RBI Account Aggregator badge + the read-only / can't-move-money promise. */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${OUTLINE_SUBTLE}`, ...fadeUp(640) }}>
        <span
          style={{
            ...typography.metadata,
            fontWeight: 500,
            color: TEXT_SECONDARY,
            backgroundColor: BG_SECONDARY,
            border: `1px solid ${OUTLINE_SUBTLE}`,
            borderRadius: RADIUS_S,
            padding: "3px 6px",
            flexShrink: 0,
            letterSpacing: 0.5,
          }}
        >
          RBI
        </span>
        <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>
          Read-only, via RBI Account Aggregator. slice can see your money, never move it.
        </span>
      </div>
    </div>
  );
}
