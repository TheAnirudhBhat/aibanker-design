"use client";

import { typography } from "../lib/typography";
import { TEXT_PRIMARY, TEXT_TERTIARY } from "../lib/colors";

export type Persona = "ryan" | "byron";

const CHARACTER_ASSETS: Record<Persona, string> = {
  ryan: "/characters/ryan.svg",
  byron: "/characters/byron.svg",
};
const PERSONA_NAMES: Record<Persona, string> = { ryan: "Ryan", byron: "Byron" };

// One-click switch: the pill shows the ACTIVE persona (avatar + name) + a swap glyph. Tapping it
// flips straight to the other voice — no dropdown, no expand. The avatar+name cross-fade on switch
// (keyed remount → fadeIn) so the change reads without a menu.
export default function PersonaToggle({ active, onToggle }: { active: Persona; onToggle: (p: Persona) => void }) {
  const other: Persona = active === "ryan" ? "byron" : "ryan";

  return (
    <button
      type="button"
      onClick={() => onToggle(other)}
      aria-label={`Switch to ${PERSONA_NAMES[other]}`}
      className="flex items-center transition-transform active:scale-[0.96]"
      style={{ gap: 8, border: "none", background: "transparent", cursor: "pointer", padding: "0 4px" }}
    >
      <span key={active} className="flex items-center" style={{ gap: 8, animation: "fadeIn 0.26s ease-out" }}>
        <img src={CHARACTER_ASSETS[active]} alt="" width={24} height={24} style={{ borderRadius: "50%", flexShrink: 0 }} />
        <span style={{ ...typography.headerH4, color: TEXT_PRIMARY }}>{PERSONA_NAMES[active]}</span>
      </span>
      {/* Swap glyph — minimal; one tap switches voice */}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
        <path d="M4 6.5H12M9.5 4L12 6.5L9.5 9" stroke={TEXT_TERTIARY} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 9.5H4M6.5 7L4 9.5L6.5 12" stroke={TEXT_TERTIARY} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
