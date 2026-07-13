"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { typography } from "../lib/typography";
import { TEXT_PRIMARY, TEXT_SECONDARY, BG_CARD, BG_SECONDARY } from "../lib/colors";
import { ELEVATION_CARD } from "../lib/elevation";

// AA reassurance (Figma 230:132) — an H3 headline + three benefit tiles: sharper budgets, true goal
// plans, and RBI read-only access (the trust point rides IN the trio, not as a separate callout).
// The tiles are 52px slate discs with a centred glyph; the third holds the RBI seal.
function BenefitTile({ icon, label, delay, style }: { icon: ReactNode; label: string; delay: number; style: (d: number) => CSSProperties }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center", ...style(delay) }}>
      <div style={{ width: 52, height: 52, borderRadius: "50%", backgroundColor: BG_SECONDARY, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
        // 4px wider than the text column on each side (text inset 24 → card inset 20). The chat
        // column stretches its children, so the negative inline margins do the bleed.
        marginLeft: -4,
        marginRight: -4,
        backgroundColor: BG_CARD,
        border: "var(--dls-card-border)",
        borderRadius: 16,
        padding: "24px 24px 20px",
        boxShadow: ELEVATION_CARD,
      }}
    >
      {/* The point, first — H3 headline. */}
      <p style={{ ...typography.headerH3, color: TEXT_PRIMARY, margin: 0, ...fadeUp(80) }}>
        Link your primary account for the full picture.
      </p>

      {/* The set of three — 52px disc, text below. The third IS the RBI trust point (seal +
          read-only), so the safety reassurance rides in the trio rather than a separate callout. */}
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <BenefitTile
          delay={200}
          style={fadeUp}
          label="Sharper budgets"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 19V11M12 19V5M19 19v-6" stroke={TEXT_SECONDARY} strokeWidth="2" strokeLinecap="round" />
            </svg>
          }
        />
        <BenefitTile
          delay={300}
          style={fadeUp}
          label="True goal plans"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" stroke={TEXT_SECONDARY} strokeWidth="2" />
              <circle cx="12" cy="12" r="3" fill={TEXT_SECONDARY} />
            </svg>
          }
        />
        <BenefitTile
          delay={400}
          style={fadeUp}
          label="Read-only access"
          icon={
            // Official RBI seal in the disc — the trust point as a tile. Whitened in dark via .rbi-seal.
            <img className="rbi-seal" src="/icons/rbi-logo.png" alt="Reserve Bank of India" width={30} height={30} style={{ display: "block" }} />
          }
        />
      </div>
    </div>
  );
}
