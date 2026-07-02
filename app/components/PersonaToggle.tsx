"use client";

import { useEffect, useState } from "react";
import { typography } from "../lib/typography";
import { BG_SHEET, OUTLINE_BOLD, TEXT_PRIMARY, TEXT_TERTIARY } from "../lib/colors";
import { ELEVATION_CARD } from "../lib/elevation";

export type Persona = "ryan" | "byron";

const CHARACTER_ASSETS: Record<Persona, string> = {
  ryan: "/characters/ryan.svg",
  byron: "/characters/byron.svg",
};
const PERSONA_NAMES: Record<Persona, string> = { ryan: "Ryan", byron: "Byron" };

// The persona indicator is a PILL from the start — same chip chrome as the close cross and the
// goal-tracker chip flanking it (48px tall, BG_SHEET fill, bold outline, card shadow). Before Byron
// unlocks it's a plain badge (avatar + name, not tappable); once he's met (`canToggle`) the swap
// glyph eases in a beat later and the pill widens smoothly around it — one-click flips the voice,
// no dropdown. The avatar+name cross-fade on switch.
export default function PersonaToggle({
  active,
  onToggle,
  canToggle = true,
}: {
  active: Persona;
  onToggle?: (p: Persona) => void;
  canToggle?: boolean;
}) {
  const other: Persona = active === "ryan" ? "byron" : "ryan";
  const [iconIn, setIconIn] = useState(false);
  useEffect(() => {
    if (!canToggle) { setIconIn(false); return; }
    const t = window.setTimeout(() => setIconIn(true), 320);
    return () => window.clearTimeout(t);
  }, [canToggle]);

  return (
    <button
      type="button"
      onClick={canToggle ? () => onToggle?.(other) : undefined}
      aria-label={canToggle ? `Switch to ${PERSONA_NAMES[other]}` : PERSONA_NAMES[active]}
      className={`flex items-center ${canToggle ? "transition-transform active:scale-[0.96]" : ""}`}
      style={{
        height: 48,
        borderRadius: 24,
        backgroundColor: BG_SHEET,
        border: `1px solid ${OUTLINE_BOLD}`,
        boxShadow: ELEVATION_CARD,
        cursor: canToggle ? "pointer" : "default",
        padding: "0 14px 0 12px",
      }}
    >
      <span key={active} className="flex items-center" style={{ gap: 8, animation: "fadeIn 0.26s ease-out" }}>
        <img src={CHARACTER_ASSETS[active]} alt="" width={24} height={24} style={{ borderRadius: "50%", flexShrink: 0 }} />
        <span style={{ ...typography.headerH4, color: TEXT_PRIMARY }}>{PERSONA_NAMES[active]}</span>
      </span>
      {/* Swap glyph — width animates from 0 so the pill widens smoothly when the toggle unlocks;
          eases in a beat after so the avatar settles first. One tap switches voice. */}
      <span
        aria-hidden="true"
        className="flex items-center"
        style={{
          overflow: "hidden",
          width: iconIn ? 18 : 0,
          marginLeft: iconIn ? 6 : 0,
          opacity: iconIn ? 1 : 0,
          transform: iconIn ? "translateX(0)" : "translateX(-4px)",
          transition:
            "width 400ms cubic-bezier(0.22, 1, 0.36, 1), margin-left 400ms cubic-bezier(0.22, 1, 0.36, 1), opacity 400ms ease, transform 400ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path d="M4.24995 10.9702H19.75C20.26 10.9702 20.7099 10.6602 20.91 10.1902C21.1 9.72024 20.99 9.18024 20.6299 8.82024L16.17 4.40024C15.78 4.01024 15.2 3.89024 14.7 4.11024C14.19 4.32024 13.87 4.81024 13.87 5.35024L13.85 8.46024H4.24995C3.55995 8.46024 2.99995 9.02024 2.99995 9.71024C2.99995 10.4002 3.55995 10.9602 4.24995 10.9602V10.9702Z" fill={TEXT_TERTIARY} />
          <path d="M19.75 13.0302H4.24995C3.73995 13.0302 3.28995 13.3402 3.08995 13.8102C2.89995 14.2802 3.00995 14.8202 3.36995 15.1802L7.83995 19.6202C8.09995 19.8702 8.43995 20.0002 8.77995 20.0002C8.95995 20.0002 9.13995 19.9602 9.30995 19.8902C9.80995 19.6802 10.13 19.1902 10.13 18.6502L10.15 15.5402H19.75C20.44 15.5402 21 14.9802 21 14.2902C21 13.6002 20.44 13.0402 19.75 13.0402V13.0302Z" fill={TEXT_TERTIARY} />
        </svg>
      </span>
    </button>
  );
}
