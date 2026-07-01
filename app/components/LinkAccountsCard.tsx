"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { typography } from "../lib/typography";
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, BG_CARD, BG_SECONDARY, OUTLINE_SUBTLE, VALENTINO_500 } from "../lib/colors";
import { RADIUS_S } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";

// AA reassurance, playing on the name: a circle where only ONE lit wedge (Valentino) is filled — your
// "slice" — and the rest sits faint + dotted (uncoupled). Two points spell out what's in vs locked.
// Connecting unlocks a goal plan slice-only data can't build. RBI guardrail kept at the decision.
// Pie geometry: centre (48,48), r=42, a ~100° wedge lit from the top.
const WEDGE = "M48 48 L48 6 A42 42 0 0 1 89.36 55.29 Z";

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
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Circle: faint dotted whole (uncoupled) + one lit Valentino wedge (your slice) */}
        <svg width={92} height={92} viewBox="0 0 96 96" style={{ flexShrink: 0 }} aria-hidden="true">
          <circle cx={48} cy={48} r={42} fill={`color-mix(in srgb, ${TEXT_PRIMARY} 5%, transparent)`} />
          <circle cx={48} cy={48} r={42} fill="none" stroke={TEXT_TERTIARY} strokeWidth={1.5} strokeDasharray="2 5" style={{ opacity: shown ? 0.5 : 0, transition: "opacity 320ms ease 120ms" }} />
          <path
            d={WEDGE}
            fill={VALENTINO_500}
            style={{ transformBox: "fill-box", transformOrigin: "48px 48px", opacity: shown ? 1 : 0, transform: shown ? "scale(1)" : "scale(0.6)", transition: "opacity 360ms ease 200ms, transform 460ms cubic-bezier(0.34, 1.56, 0.64, 1) 200ms" }}
          />
        </svg>

        {/* Two points: what's in (lit) vs what's locked */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, ...fadeUp(320) }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: VALENTINO_500, flexShrink: 0 }} />
            <span style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY }}>Your slice spends</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, ...fadeUp(420) }}>
            <svg width={14} height={16} viewBox="0 0 16 18" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
              <rect x={3} y={8} width={10} height={7} rx={1.6} stroke={TEXT_TERTIARY} strokeWidth={1.3} />
              <path d="M5.5 8V5.5a2.5 2.5 0 0 1 5 0V8" stroke={TEXT_TERTIARY} strokeWidth={1.3} strokeLinecap="round" />
            </svg>
            <span style={{ ...typography.bodySmall, color: TEXT_TERTIARY }}>Salary, cards & UPI — locked</span>
          </div>
        </div>
      </div>

      <p style={{ ...typography.caption, color: TEXT_SECONDARY, margin: "16px 0 0", ...fadeUp(520) }}>
        We&apos;ve got your slice. Connect the rest to unlock a goal plan slice alone can&apos;t build.
      </p>

      {/* Guardrail — RBI Account Aggregator badge + the read-only / can't-move-money promise. */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${OUTLINE_SUBTLE}`, ...fadeUp(600) }}>
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
