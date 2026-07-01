"use client";

import { useEffect, useState } from "react";
import { typography } from "../lib/typography";
import { TEXT_PRIMARY, TEXT_TERTIARY } from "../lib/colors";

export type Persona = "ryan" | "byron";

const CHARACTER_ASSETS: Record<Persona, string> = {
  ryan: "/characters/ryan.svg",
  byron: "/characters/byron.svg",
};
const PERSONA_NAMES: Record<Persona, string> = { ryan: "Ryan", byron: "Byron" };

// One-click switch: the pill shows the ACTIVE persona (avatar + name) + a swap glyph. Tapping it
// flips straight to the other voice — no dropdown, no expand. The avatar+name cross-fade on switch.
// The swap glyph eases in a beat AFTER the pill first appears (so on the Byron takeover the avatar
// settles first, then the switch affordance arrives), matching how it lands from the takeover.
export default function PersonaToggle({ active, onToggle }: { active: Persona; onToggle: (p: Persona) => void }) {
  const other: Persona = active === "ryan" ? "byron" : "ryan";
  const [iconIn, setIconIn] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setIconIn(true), 320);
    return () => window.clearTimeout(t);
  }, []);

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
      {/* Swap glyph — minimal; eases in after the pill settles; one tap switches voice */}
      <svg
        width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"
        style={{
          flexShrink: 0,
          opacity: iconIn ? 1 : 0,
          transform: iconIn ? "translateX(0)" : "translateX(-4px)",
          transition: "opacity 400ms ease, transform 400ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <path d="M4.24995 10.9702H19.75C20.26 10.9702 20.7099 10.6602 20.91 10.1902C21.1 9.72024 20.99 9.18024 20.6299 8.82024L16.17 4.40024C15.78 4.01024 15.2 3.89024 14.7 4.11024C14.19 4.32024 13.87 4.81024 13.87 5.35024L13.85 8.46024H4.24995C3.55995 8.46024 2.99995 9.02024 2.99995 9.71024C2.99995 10.4002 3.55995 10.9602 4.24995 10.9602V10.9702Z" fill={TEXT_TERTIARY} />
        <path d="M19.75 13.0302H4.24995C3.73995 13.0302 3.28995 13.3402 3.08995 13.8102C2.89995 14.2802 3.00995 14.8202 3.36995 15.1802L7.83995 19.6202C8.09995 19.8702 8.43995 20.0002 8.77995 20.0002C8.95995 20.0002 9.13995 19.9602 9.30995 19.8902C9.80995 19.6802 10.13 19.1902 10.13 18.6502L10.15 15.5402H19.75C20.44 15.5402 21 14.9802 21 14.2902C21 13.6002 20.44 13.0402 19.75 13.0402V13.0302Z" fill={TEXT_TERTIARY} />
      </svg>
    </button>
  );
}
