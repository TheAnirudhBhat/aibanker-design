"use client";

import type { ReactNode, Ref } from "react";
import { BG_SHEET } from "../lib/colors";
import { ELEVATION_CARD } from "../lib/elevation";
import { RADIUS_M } from "../lib/radii";
import { SHEET_DOCK_BOTTOM } from "../lib/sheet";
import { useTheme } from "../lib/theme";

// THE docked bottom-sheet shell. The footprint confirm sheet, the budget-confirm sheet and the
// questionnaire sheet all dock in the same slot — they must share ONE shell (surface, radius,
// shadow, dock gap) or they drift apart again (they had three different elevations + paddings
// before this existed). Heading/content stay with the caller; the shell owns the chrome.
// Docked sheets share the SAME DLS card elevation as the inline chat cards (Figma 220:2563) so the
// questionnaire / budget / footprint sheets read as one surface family. One source of truth: ELEVATION_CARD.
export const SHEET_LIGHT_SHADOW = ELEVATION_CARD;

export default function SheetChrome({
  children,
  wrapperRef,
  cardRef,
}: {
  children: ReactNode;
  wrapperRef?: Ref<HTMLDivElement>; // outer padded wrapper (e.g. ConfirmListCard's rootRef)
  cardRef?: Ref<HTMLDivElement>; // the inner card — morph/clip measurements target THIS
}) {
  const { mode } = useTheme();
  return (
    <div ref={wrapperRef} className="questionnaire-overlay-entrance" style={{ padding: `0 16px ${SHEET_DOCK_BOTTOM}px` }}>
      <div
        ref={cardRef}
        style={{
          backgroundColor: BG_SHEET,
          borderRadius: RADIUS_M,
          // Same canonical card stroke as the chat cards (subtle, mode-aware via the CSS var).
          border: "var(--dls-card-border)",
          // Light: soft lift + hairline ring; dark: the BG_SHEET surface itself lifts it, no shadow.
          boxShadow: mode === "dark" ? "none" : SHEET_LIGHT_SHADOW,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
