"use client";

import type { ReactNode } from "react";
import { BG_PRIMARY, DEVICE_BEZEL } from "../../lib/colors";
import { RADIUS_XL } from "../../lib/radii";
import { useTheme } from "../../lib/theme";

/**
 * Device frame - matches main app bezel (360×780, rounded corners, dark housing).
 * Used by Screens and Flows sections. The `.dark` class on the inner screen flips
 * all DLS semantic tokens; the bezel is the physical housing and stays dark always.
 */
export default function DeviceFrame({ children }: { children: ReactNode }) {
  const { mode } = useTheme();
  return (
    <div
      style={{
        width: 372, /* 360 + 6px padding each side */
        borderRadius: RADIUS_XL,
        backgroundColor: DEVICE_BEZEL,
        padding: 6,
        boxShadow: "none",
        flexShrink: 0,
      }}
    >
      <div
        className={mode === "dark" ? "dark" : undefined}
        style={{
          width: 360,
          aspectRatio: "360/780",
          borderRadius: 26,
          overflow: "hidden",
          // clip-path also clips transformed/composited descendants (animated
          // overlays), which overflow:hidden + border-radius alone does not —
          // keeps the screen from poking past the rounded shell corners.
          clipPath: "inset(0 round 26px)",
          WebkitClipPath: "inset(0 round 26px)",
          background: BG_PRIMARY,
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
}
