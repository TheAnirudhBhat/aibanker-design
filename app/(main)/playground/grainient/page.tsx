"use client";

import { useState } from "react";
import Grainient from "@/app/components/Grainient";

// Tuning bench for the pitch-questions grainient (R20): the exact props the
// questions flow uses, full-viewport, with a button that fires the same
// step-switch surge — so palette/speed/surge can be judged in isolation.
export default function GrainientPlayground() {
  const [surge, setSurge] = useState(0);
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Grainient
        timeSpeed={0.16}
        surgeKey={surge}
        surgeStrength={22}
        surgeDecayMs={850}
        color1="#FFFFFF"
        color2="#D8E2EB"
        color3="#F2C9F5"
        contrast={1.28}
        saturation={1.15}
        blendSoftness={0.12}
        grainAmount={0.06}
      />
      <button
        type="button"
        onClick={() => setSurge((s) => s + 1)}
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "12px 24px",
          borderRadius: 999,
          border: "1px solid rgba(0,0,0,0.15)",
          background: "rgba(255,255,255,0.8)",
          fontFamily: "var(--font-rubik), sans-serif",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Surge (question switch)
      </button>
    </div>
  );
}
