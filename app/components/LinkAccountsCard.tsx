"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { typography } from "../lib/typography";
import { TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, BG_CARD, BG_SECONDARY, OUTLINE_SUBTLE, VALENTINO_500 } from "../lib/colors";
import { RADIUS_S } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";

// AA reassurance — the TEXT is the primary element (what linking gets you), visualised as a set of
// three icon tiles: sharper budgets, true goal plans, and the secret waiting up top (the locked
// tracker chip). No pie chart — the old wedge+legend buried the point. RBI guardrail stays.
function BenefitTile({ icon, label, delay, style }: { icon: ReactNode; label: string; delay: number; style: (d: number) => CSSProperties }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", ...style(delay) }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: BG_SECONDARY, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <span style={{ ...typography.caption, color: TEXT_SECONDARY }}>{label}</span>
    </div>
  );
}

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
      {/* The point, first: what linking actually gets you. */}
      <p style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY, margin: 0, ...fadeUp(80) }}>
        Your slice spends are in. Link the rest for the full picture.
      </p>

      {/* The set of three — icon, text below. The third teases the locked chip up top. */}
      <div style={{ display: "flex", gap: 12, marginTop: 16, ...({} as CSSProperties) }}>
        <BenefitTile
          delay={200}
          style={fadeUp}
          label="Sharper budgets"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 16V9M10 16V4M16 16v-5" stroke={TEXT_SECONDARY} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          }
        />
        <BenefitTile
          delay={300}
          style={fadeUp}
          label="True goal plans"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="7" stroke={TEXT_SECONDARY} strokeWidth="1.8" />
              <circle cx="10" cy="10" r="2.4" fill={TEXT_SECONDARY} />
            </svg>
          }
        />
        <BenefitTile
          delay={400}
          style={fadeUp}
          label="A secret, up top"
          icon={
            <svg width="18" height="20" viewBox="0 0 16 18" fill="none" aria-hidden="true">
              <rect x={3} y={8} width={10} height={7} rx={1.6} stroke={VALENTINO_500} strokeWidth={1.5} />
              <path d="M5.5 8V5.5a2.5 2.5 0 0 1 5 0V8" stroke={VALENTINO_500} strokeWidth={1.5} strokeLinecap="round" />
            </svg>
          }
        />
      </div>

      {/* Guardrail — RBI Account Aggregator badge + the read-only / can't-move-money promise. */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, paddingTop: 12, borderTop: `1px solid ${OUTLINE_SUBTLE}`, ...fadeUp(520) }}>
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
