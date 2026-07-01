"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { typography } from "../lib/typography";
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, BG_CARD, BG_SECONDARY, OUTLINE_SUBTLE, VALENTINO_500 } from "../lib/colors";
import { RADIUS_S } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";

// Link-accounts card, kept SIMPLE: one savings curve climbing to the GOAL line, and the RBI Account
// Aggregator guardrail. The chart carries the message on its own — link everything → you reach the
// goal — with milestone dots + a haloed endpoint so it reads as a real trajectory, not a plain line.
const CURVE = "M8 90 C 80 86 150 44 262 24";
const AREA = "M8 90 C 80 86 150 44 262 24 L262 100 L8 100 Z";
// Two points sampled ON the curve (t≈0.33, 0.66) for the milestone dots.
const MILESTONES = [{ x: 80, y: 76 }, { x: 161, y: 50 }];
const GOAL_Y = 22;

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

      <svg width="100%" viewBox="0 0 280 116" style={{ display: "block", marginTop: 16, overflow: "visible" }} aria-hidden="true">
        <defs>
          <linearGradient id="lac-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={VALENTINO_500} stopOpacity={0.18} />
            <stop offset="100%" stopColor={VALENTINO_500} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Goal line the curve rises to meet */}
        <line
          x1={8} y1={GOAL_Y} x2={272} y2={GOAL_Y}
          stroke={TEXT_TERTIARY} strokeWidth={1} strokeDasharray="2 5"
          style={{ opacity: shown ? 0.5 : 0, transition: "opacity 320ms ease 120ms" }}
        />
        <text x={272} y={GOAL_Y - 6} textAnchor="end" style={{ ...typography.metadata, textTransform: "uppercase", fill: TEXT_TERTIARY, ...fadeUp(160) }}>
          Goal
        </text>

        {/* Area + savings curve */}
        <path d={AREA} fill="url(#lac-fill)" style={{ opacity: shown ? 1 : 0, transition: "opacity 520ms ease 420ms" }} />
        <path
          d={CURVE}
          fill="none"
          stroke={VALENTINO_500}
          strokeWidth={3}
          strokeLinecap="round"
          pathLength={100}
          style={{ strokeDasharray: 100, strokeDashoffset: shown ? 0 : 100, transition: "stroke-dashoffset 880ms cubic-bezier(0.22, 1, 0.36, 1) 240ms" }}
        />

        {/* Milestone dots sitting on the curve, revealing as the line passes them */}
        {MILESTONES.map((m, i) => (
          <circle
            key={i}
            cx={m.x} cy={m.y} r={2.5}
            fill={VALENTINO_500}
            style={{ opacity: shown ? 0.9 : 0, transition: `opacity 240ms ease ${640 + i * 200}ms` }}
          />
        ))}

        {/* Endpoint = reaching the goal: haloed brand dot */}
        <circle
          cx={262} cy={24} r={9} fill={VALENTINO_500}
          style={{ transformBox: "fill-box", transformOrigin: "center", opacity: shown ? 0.16 : 0, transform: shown ? "scale(1)" : "scale(0)", transition: "opacity 300ms ease 1040ms, transform 340ms cubic-bezier(0.34, 1.56, 0.64, 1) 1040ms" }}
        />
        <circle
          cx={262} cy={24} r={4.5} fill={VALENTINO_500}
          style={{ transformBox: "fill-box", transformOrigin: "center", transform: shown ? "scale(1)" : "scale(0)", transition: "transform 340ms cubic-bezier(0.34, 1.56, 0.64, 1) 1080ms" }}
        />

        <text x={8} y={112} textAnchor="start" style={{ ...typography.metadata, textTransform: "uppercase", fill: TEXT_TERTIARY, ...fadeUp(1120) }}>
          Now
        </text>
      </svg>

      {/* Guardrail — RBI Account Aggregator badge + the read-only / can't-move-money promise. */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, paddingTop: 12, borderTop: `1px solid ${OUTLINE_SUBTLE}`, ...fadeUp(1180) }}>
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
