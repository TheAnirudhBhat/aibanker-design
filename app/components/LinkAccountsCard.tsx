"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { typography } from "../lib/typography";
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, BG_CARD, OUTLINE_SUBTLE, VALENTINO_500 } from "../lib/colors";
import { ELEVATION_CARD } from "../lib/elevation";
import TrustNote from "./TrustNote";

// The WHY-to-link card, reframed around USER benefit (Cal-AI style): a projected goal-trajectory
// line graph. The Valentino line — a plan built on the WHOLE picture (salary, cards, UPI) — climbs
// to the goal; the muted dotted line — a plan on slice spends alone — falls short. No invented
// numbers: the curve shape carries the story (like Cal AI's onboarding graphs), with the goal as
// the endpoint marker. Entrance is orchestrated so it reads as "the fuller picture gets you there".

// ── Graph geometry (viewBox 0 0 280 128) ──────────────────────────
const GOAL_Y = 18;              // dashed target line near the top
// Full-picture curve rises to meet the goal; slice-only plateaus well below it.
const FULL_PATH = "M14 86 C 78 82 150 42 258 22";
const FULL_AREA = "M14 86 C 78 82 150 42 258 22 L258 100 L14 100 Z";
const SLICE_PATH = "M14 86 C 78 84 150 70 258 62";

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

      <svg width="100%" viewBox="0 0 280 128" style={{ display: "block", marginTop: 12, overflow: "visible" }} aria-hidden="true">
        <defs>
          <linearGradient id="lac-full-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={VALENTINO_500} stopOpacity={0.16} />
            <stop offset="100%" stopColor={VALENTINO_500} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Goal target line + label */}
        <line
          x1={14} y1={GOAL_Y} x2={258} y2={GOAL_Y}
          stroke={TEXT_TERTIARY} strokeWidth={1} strokeDasharray="2 4"
          style={{ opacity: shown ? 0.5 : 0, transition: "opacity 320ms ease 80ms" }}
        />
        <text x={14} y={GOAL_Y - 5} textAnchor="start" style={{ ...typography.metadata, fill: TEXT_TERTIARY, ...fadeUp(120) }}>
          GOAL
        </text>

        {/* Slice-only plan — muted dotted line that falls short of the goal */}
        <path
          d={SLICE_PATH}
          fill="none" stroke={TEXT_TERTIARY} strokeWidth={2} strokeLinecap="round" strokeDasharray="2 5"
          style={{ opacity: shown ? 0.55 : 0, transition: "opacity 460ms ease 220ms" }}
        />
        <circle
          cx={258} cy={62} r={3.5} fill="none" stroke={TEXT_TERTIARY} strokeWidth={2}
          style={{ opacity: shown ? 0.55 : 0, transition: "opacity 460ms ease 320ms" }}
        />

        {/* Full-picture plan — brand line + soft fill, sweeping up to the goal */}
        <path d={FULL_AREA} fill="url(#lac-full-fill)" style={{ opacity: shown ? 1 : 0, transition: "opacity 520ms ease 520ms" }} />
        <path
          d={FULL_PATH}
          fill="none" stroke={VALENTINO_500} strokeWidth={3} strokeLinecap="round"
          pathLength={100}
          style={{
            strokeDasharray: 100,
            strokeDashoffset: shown ? 0 : 100,
            transition: "stroke-dashoffset 840ms cubic-bezier(0.22, 1, 0.36, 1) 360ms",
          }}
        />
        <circle
          cx={258} cy={22} r={4} fill={VALENTINO_500}
          style={{
            transformBox: "fill-box", transformOrigin: "center",
            transform: shown ? "scale(1)" : "scale(0)",
            transition: "transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1) 1160ms",
          }}
        />

        {/* Inline series labels (Cal-AI style, sitting near each line) */}
        <text x={92} y={38} textAnchor="start" style={{ ...typography.metadata, fill: VALENTINO_500, fontWeight: 500, ...fadeUp(940) }}>
          FULL PICTURE
        </text>
        <text x={150} y={86} textAnchor="start" style={{ ...typography.metadata, fill: TEXT_TERTIARY, ...fadeUp(1000) }}>
          SLICE ONLY
        </text>

        {/* Time axis */}
        <text x={14} y={120} textAnchor="start" style={{ ...typography.metadata, fill: TEXT_TERTIARY, ...fadeUp(1060) }}>NOW</text>
        <text x={136} y={120} textAnchor="middle" style={{ ...typography.metadata, fill: TEXT_TERTIARY, ...fadeUp(1060) }}>3 MO</text>
        <text x={258} y={120} textAnchor="end" style={{ ...typography.metadata, fill: TEXT_TERTIARY, ...fadeUp(1060) }}>6 MO</text>
      </svg>

      <p style={{ ...typography.caption, color: TEXT_SECONDARY, margin: "12px 0 0", ...fadeUp(1120) }}>
        Link salary, cards and UPI for a plan built on your real money. slice spends alone is a guess.
      </p>

      {/* Guardrail — the read-only / can't-move-money promise, right at the decision. */}
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${OUTLINE_SUBTLE}`, ...fadeUp(1200) }}>
        <TrustNote text="Read-only, via RBI Account Aggregator. slice can see your money, never move it." />
      </div>
    </div>
  );
}
