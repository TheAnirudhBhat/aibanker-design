"use client";

import { typography } from "../lib/typography";
import { TEXT_PRIMARY, TEXT_SECONDARY, BG_PRIMARY, BG_SECONDARY, OUTLINE_SUBTLE } from "../lib/colors";
import { RADIUS_CIRCLE } from "../lib/radii";
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

export default function PersonaToggle({ active, onToggle }: { active: Persona; onToggle: (p: Persona) => void }) {
  const tabs: Persona[] = ["ryan", "byron"];

  return (
    <div
      className="flex items-center"
      style={{
        borderRadius: RADIUS_CIRCLE,
        border: `1px solid ${OUTLINE_SUBTLE}`,
        boxShadow: ELEVATION_CARD,
        padding: 3,
        // Match the close-X / tracker chips (opaque BG_SECONDARY) so the three top-chrome elements read
        // as one family; the active tab pops on top with the raised BG_PRIMARY fill.
        backgroundColor: BG_SECONDARY,
        gap: 2,
      }}
    >
      {tabs.map((p) => {
        const isActive = active === p;
        return (
          <div
            key={p}
            onClick={() => onToggle(p)}
            className="flex items-center transition-all duration-200 ease-out"
            style={{
              height: 44,
              borderRadius: RADIUS_CIRCLE,
              backgroundColor: isActive ? BG_PRIMARY : "transparent",
              padding: isActive ? (p === "ryan" ? "0 12px 0 4px" : "0 4px 0 12px") : "0 14px",
              gap: 6,
              cursor: "pointer",
              ...typography.buttonSmall,
              color: isActive ? TEXT_PRIMARY : TEXT_SECONDARY,
              opacity: isActive ? 1 : 0.6,
            }}
          >
            {isActive && p === "ryan" && (
              <img src={CHARACTER_ASSETS[p]} alt="" width={36} height={36} style={{ borderRadius: "50%", flexShrink: 0, animation: "fadeIn 0.3s ease-out" }} />
            )}
            {PERSONA_NAMES[p]}
            {isActive && p === "byron" && (
              <img src={CHARACTER_ASSETS[p]} alt="" width={36} height={36} style={{ borderRadius: "50%", flexShrink: 0, animation: "fadeIn 0.3s ease-out" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
