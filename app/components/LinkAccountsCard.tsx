"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { typography } from "../lib/typography";
import { TEXT_PRIMARY, TEXT_TERTIARY, BG_CARD, OUTLINE_SUBTLE, VALENTINO_500 } from "../lib/colors";
import { ELEVATION_CARD } from "../lib/elevation";

// The WHY-to-link card, visualised: a 4-segment coverage donut where three arcs are dotted "empty
// slots" (salary / cards / other UPI, locked) and only ONE is a solid lit arc (slice spends). One
// glance = "Ryan sees a sliver." Entrance is orchestrated: the empty slots dot in, then your slice
// arc sweeps in, then the labels resolve — so the reveal reads as a story, not one hard cut.

const R = 26;
const CX = 32;
const CY = 32;
const GAP_DEG = 18; // gap between the four quadrant arcs

function arc(startDeg: number, endDeg: number): string {
  const rad = (d: number) => ((d - 90) * Math.PI) / 180; // -90 so segment 0 starts at the top
  const x1 = CX + R * Math.cos(rad(startDeg));
  const y1 = CY + R * Math.sin(rad(startDeg));
  const x2 = CX + R * Math.cos(rad(endDeg));
  const y2 = CY + R * Math.sin(rad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

// Four quadrant segments; index 0 is the lit "slice" arc, 1–3 are the locked (dotted) accounts.
const SEGMENTS = [0, 1, 2, 3].map((i) => arc(i * 90 + GAP_DEG / 2, (i + 1) * 90 - GAP_DEG / 2));

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
      <p style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY, margin: 0 }}>
        What I can see
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
        <svg width={64} height={64} viewBox="0 0 64 64" style={{ flexShrink: 0 }} aria-hidden="true">
          {/* Locked accounts — dotted "empty slots", dotting in first */}
          {[1, 2, 3].map((i) => (
            <path
              key={i}
              d={SEGMENTS[i]}
              fill="none"
              stroke={TEXT_TERTIARY}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray="0.5 7"
              style={{ opacity: shown ? 0.4 : 0, transition: `opacity 320ms ease ${120 + (i - 1) * 90}ms` }}
            />
          ))}
          {/* slice spends — the one lit arc, sweeping in after the slots */}
          <path
            d={SEGMENTS[0]}
            fill="none"
            stroke={VALENTINO_500}
            strokeWidth={9}
            strokeLinecap="round"
            pathLength={100}
            style={{
              strokeDasharray: 100,
              strokeDashoffset: shown ? 0 : 100,
              transition: "stroke-dashoffset 760ms cubic-bezier(0.22, 1, 0.36, 1) 420ms",
            }}
          />
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY, margin: 0, ...fadeUp(640) }}>
            Just your slice spends
          </p>
          <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: "2px 0 0", ...fadeUp(720) }}>
            Salary, cards and other UPI are still locked
          </p>
        </div>
      </div>

      <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: "12px 0 0", ...fadeUp(820) }}>
        Link them and I see the whole picture. Disconnect anytime.
      </p>
    </div>
  );
}
