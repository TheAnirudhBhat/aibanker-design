"use client";

import { typography } from "../lib/typography";
import { TEXT_PRIMARY, TEXT_SECONDARY, BG_GLASS, BG_SECONDARY, OUTLINE_SUBTLE } from "../lib/colors";
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
        // Match the close-X circle's glass fill so it reads as a distinct chip in dark (BG_PRIMARY
        // blended into the dark canvas).
        backgroundColor: BG_GLASS,
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
              backgroundColor: isActive ? BG_SECONDARY : "transparent",
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
