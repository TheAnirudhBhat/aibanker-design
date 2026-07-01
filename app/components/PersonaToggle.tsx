"use client";

import { useEffect, useState } from "react";
import { typography } from "../lib/typography";
import { TEXT_PRIMARY, TEXT_SECONDARY, BG_PRIMARY, BG_SECONDARY, OUTLINE_SUBTLE } from "../lib/colors";
import { RADIUS_CIRCLE, RADIUS_M } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";

export type Persona = "ryan" | "byron";

const CHARACTER_ASSETS: Record<Persona, string> = {
  ryan: "/characters/ryan.svg",
  byron: "/characters/byron.svg",
};

const PERSONA_NAMES: Record<Persona, string> = {
  ryan: "Ryan",
  byron: "Byron",
};

// The persona switcher is a DROPDOWN, not a segmented toggle: the app-bar centre stays a compact
// pill (avatar + name), matching the firstTime title, so introducing Byron doesn't flip the bar into
// a two-tab segment. A chevron signals it opens; tapping drops a menu to switch persona.
export default function PersonaToggle({ active, onToggle }: { active: Persona; onToggle: (p: Persona) => void }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const personas: Persona[] = ["ryan", "byron"];

  useEffect(() => {
    if (!open) { setShown(false); return; }
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  return (
    <div style={{ position: "relative" }}>
      {/* Trigger — avatar + name + chevron (reads like the firstTime title, plus a dropdown affordance) */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center transition-transform active:scale-[0.97]"
        style={{ gap: 8, border: "none", background: "transparent", cursor: "pointer", padding: "0 4px" }}
      >
        <img src={CHARACTER_ASSETS[active]} alt="" width={24} height={24} style={{ borderRadius: "50%", flexShrink: 0 }} />
        <span style={{ ...typography.headerH4, color: TEXT_PRIMARY }}>{PERSONA_NAMES[active]}</span>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 220ms ease" }}
        >
          <path d="M4 6l4 4 4-4" stroke={TEXT_SECONDARY} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          {/* Click-away layer */}
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 59 }} />
          {/* Menu drops below the trigger */}
          <div
            role="menu"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: "50%",
              zIndex: 60,
              minWidth: 168,
              backgroundColor: BG_SECONDARY,
              border: `1px solid ${OUTLINE_SUBTLE}`,
              borderRadius: RADIUS_M,
              boxShadow: ELEVATION_CARD,
              padding: 4,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              transformOrigin: "top center",
              opacity: shown ? 1 : 0,
              transform: `translateX(-50%) translateY(${shown ? 0 : -6}px) scale(${shown ? 1 : 0.97})`,
              transition: "opacity 160ms ease, transform 200ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {personas.map((p) => {
              const isActive = active === p;
              return (
                <button
                  key={p}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => { onToggle(p); setOpen(false); }}
                  className="flex items-center transition-transform active:scale-[0.98]"
                  style={{
                    gap: 10,
                    height: 44,
                    padding: "0 10px",
                    borderRadius: RADIUS_CIRCLE,
                    border: "none",
                    backgroundColor: isActive ? BG_PRIMARY : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <img src={CHARACTER_ASSETS[p]} alt="" width={28} height={28} style={{ borderRadius: "50%", flexShrink: 0 }} />
                  <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, flex: 1 }}>{PERSONA_NAMES[p]}</span>
                  {isActive && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M3 8.5l3.5 3.5L13 5" stroke={TEXT_PRIMARY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
