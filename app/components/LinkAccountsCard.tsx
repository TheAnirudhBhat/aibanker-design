"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { typography } from "../lib/typography";
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, BG_CARD, BG_SECONDARY, OUTLINE_SUBTLE, VALENTINO_500 } from "../lib/colors";
import { RADIUS_S } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";

// Link-accounts card, kept SIMPLE: one rising savings line (illustrative — no invented axis numbers),
// one GENUINE cited stat, and the RBI Account Aggregator guardrail. Replaces the dual-curve / two-bar
// versions and the vague "full picture" framing, which people didn't parse.
const LINE = "M8 76 C 72 72 150 40 272 14";
const AREA = "M8 76 C 72 72 150 40 272 14 L272 88 L8 88 Z";

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
        Link your accounts, save more
      </p>
      <p style={{ ...typography.caption, color: TEXT_SECONDARY, margin: "4px 0 0", ...fadeUp(80) }}>
        Your plan gets built on everything you earn and spend, not just slice.
      </p>

      {/* Simple rising savings line — illustrative (the shape carries it); the genuine number is below. */}
      <svg width="100%" viewBox="0 0 280 96" style={{ display: "block", marginTop: 14, overflow: "visible" }} aria-hidden="true">
        <defs>
          <linearGradient id="lac-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={VALENTINO_500} stopOpacity={0.16} />
            <stop offset="100%" stopColor={VALENTINO_500} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={AREA} fill="url(#lac-fill)" style={{ opacity: shown ? 1 : 0, transition: "opacity 520ms ease 360ms" }} />
        <path
          d={LINE}
          fill="none"
          stroke={VALENTINO_500}
          strokeWidth={3}
          strokeLinecap="round"
          pathLength={100}
          style={{ strokeDasharray: 100, strokeDashoffset: shown ? 0 : 100, transition: "stroke-dashoffset 820ms cubic-bezier(0.22, 1, 0.36, 1) 240ms" }}
        />
        <circle
          cx={272}
          cy={14}
          r={4}
          fill={VALENTINO_500}
          style={{ transformBox: "fill-box", transformOrigin: "center", transform: shown ? "scale(1)" : "scale(0)", transition: "transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1) 1000ms" }}
        />
        <text x={8} y={92} textAnchor="start" style={{ ...typography.metadata, fill: TEXT_TERTIARY, ...fadeUp(1040) }}>NOW</text>
        <text x={272} y={92} textAnchor="end" style={{ ...typography.metadata, fill: TEXT_TERTIARY, ...fadeUp(1040) }}>YOUR GOAL</text>
      </svg>

      {/* Genuine, cited stat — no invented numbers. */}
      <div style={{ marginTop: 14, ...fadeUp(1100) }}>
        <p style={{ ...typography.caption, color: TEXT_PRIMARY, margin: 0 }}>
          <span style={{ fontWeight: 500 }}>75%</span> of people with a savings goal save regularly. Just <span style={{ fontWeight: 500 }}>62%</span> without one do.
        </p>
        <p style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY, margin: "3px 0 0" }}>Source · NerdWallet</p>
      </div>

      {/* Guardrail — RBI Account Aggregator badge + the read-only / can't-move-money promise. */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${OUTLINE_SUBTLE}`, ...fadeUp(1160) }}>
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
