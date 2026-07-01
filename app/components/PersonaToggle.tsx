"use client";

import { useState } from "react";
import { typography } from "../lib/typography";
import { TEXT_PRIMARY, TEXT_SECONDARY, BG_PRIMARY, BG_SECONDARY, OUTLINE_SUBTLE } from "../lib/colors";
import { RADIUS_CIRCLE } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";

export type Persona = "ryan" | "byron";

const CHARACTER_ASSETS: Record<Persona, string> = {
  ryan: "/characters/ryan.svg",
  byron: "/characters/byron.svg",
};
const PERSONA_NAMES: Record<Persona, string> = { ryan: "Ryan", byron: "Byron" };
const PERSONAS: Persona[] = ["ryan", "byron"];

// The persona switcher expands IN PLACE rather than dropping a menu. Collapsed it's a compact pill
// (active avatar + name + chevron, matching the firstTime title); tapping expands it to reveal BOTH
// voices side by side as a mini segment. Tapping the other switches + collapses; tapping the active
// one (or outside) just collapses. Showing both on expand makes it obvious a second voice exists —
// and how to get back to it — which the old dropdown didn't.
export default function PersonaToggle({ active, onToggle }: { active: Persona; onToggle: (p: Persona) => void }) {
  const [expanded, setExpanded] = useState(false);

  const handleTap = (p: Persona) => {
    if (!expanded) { setExpanded(true); return; } // first tap opens the switch
    if (p !== active) onToggle(p);                 // tapping the other voice switches
    setExpanded(false);                            // any tap while open collapses
  };

  return (
    <div style={{ position: "relative", display: "inline-flex", justifyContent: "center" }}>
      <div
        className="flex items-center"
        style={{
          position: "relative",
          zIndex: expanded ? 60 : undefined,
          gap: expanded ? 2 : 0,
          padding: expanded ? 3 : 0,
          borderRadius: RADIUS_CIRCLE,
          backgroundColor: expanded ? BG_SECONDARY : "transparent",
          border: `1px solid ${expanded ? OUTLINE_SUBTLE : "transparent"}`,
          boxShadow: expanded ? ELEVATION_CARD : "none",
          transition: "gap 240ms ease, padding 240ms ease, background-color 220ms ease, border-color 220ms ease, box-shadow 220ms ease",
        }}
      >
        {PERSONAS.map((p) => {
          const isActive = p === active;
          const visible = expanded || isActive; // collapsed → only the active voice shows
          return (
            <button
              key={p}
              type="button"
              aria-label={isActive ? `${PERSONA_NAMES[p]}, tap to switch voice` : `Switch to ${PERSONA_NAMES[p]}`}
              aria-pressed={isActive}
              onClick={() => handleTap(p)}
              className="flex items-center transition-transform active:scale-[0.97]"
              style={{
                gap: 8,
                height: 36,
                maxWidth: visible ? 160 : 0,
                opacity: visible ? 1 : 0,
                overflow: "hidden",
                padding: expanded ? "0 12px 0 6px" : "0 4px",
                borderRadius: RADIUS_CIRCLE,
                backgroundColor: expanded && isActive ? BG_PRIMARY : "transparent",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "max-width 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease, padding 240ms ease, background-color 200ms ease",
              }}
            >
              <img src={CHARACTER_ASSETS[p]} alt="" width={24} height={24} style={{ borderRadius: "50%", flexShrink: 0 }} />
              <span style={{ ...typography.headerH4, color: TEXT_PRIMARY }}>{PERSONA_NAMES[p]}</span>
              {!expanded && isActive && (
                <svg
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                  style={{ flexShrink: 0, marginLeft: -2 }}
                >
                  <path d="M4 6l4 4 4-4" stroke={TEXT_SECONDARY} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {expanded && (
        // Click-away layer — collapses the switch when tapping anywhere else.
        <div onClick={() => setExpanded(false)} style={{ position: "fixed", inset: 0, zIndex: 59 }} />
      )}
    </div>
  );
}
