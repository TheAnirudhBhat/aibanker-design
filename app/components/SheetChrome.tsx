"use client";

import type { ReactNode, Ref } from "react";
import { BG_SHEET } from "../lib/colors";
import { RADIUS_M } from "../lib/radii";
import { SHEET_DOCK_BOTTOM } from "../lib/sheet";
import { useTheme } from "../lib/theme";

// THE docked bottom-sheet shell. The footprint confirm sheet, the budget-confirm sheet and the
// questionnaire sheet all dock in the same slot — they must share ONE shell (surface, radius,
// shadow, dock gap) or they drift apart again (they had three different elevations + paddings
// before this existed). Heading/content stay with the caller; the shell owns the chrome.
export const SHEET_LIGHT_SHADOW = "0px 4px 40px rgba(0,0,0,0.10), 0px 0px 0px 1px rgba(0,0,0,0.04)";

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
