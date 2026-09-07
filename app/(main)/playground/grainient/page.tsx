"use client";

import { useState } from "react";
import Grainient from "@/app/components/Grainient";
import { PITCH_BG_PRESETS } from "@/app/lib/pitchBgPresets";

// Tuning bench for the pitch-questions ground (R20/R21): the exact configs the
// questions flow uses, full-viewport. Cycle the variants and fire the same
// step-switch surge, so ambient feel and switch feel can both be judged without
// walking the whole flow. The flow itself picks its variant from the debug panel.
export default function GrainientPlayground() {
  const [surge, setSurge] = useState(0);
  const [index, setIndex] = useState(0);
  const preset = PITCH_BG_PRESETS[index];

  const btn: React.CSSProperties = {
    padding: "12px 20px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.15)",
    background: "rgba(255,255,255,0.82)",
    fontFamily: "var(--font-rubik), sans-serif",
    fontSize: 14,
    cursor: "pointer",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#FFFFFF" }}>
      {/* Keyed on the variant so a switch starts that config cleanly rather than
          inheriting the previous one's in-flight surge. */}
      <Grainient key={preset.id} {...preset.props} surgeKey={surge} />

      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-rubik), sans-serif",
            fontSize: 12,
            color: "rgba(0,0,0,0.5)",
            background: "rgba(255,255,255,0.7)",
            padding: "4px 10px",
            borderRadius: 999,
          }}
        >
          {preset.hint}
        </span>
        <div style={{ display: "flex", gap: 12 }}>
          <button type="button" style={btn} onClick={() => setIndex((i) => (i + 1) % PITCH_BG_PRESETS.length)}>
            {preset.label} ({index + 1}/{PITCH_BG_PRESETS.length})
          </button>
          <button type="button" style={btn} onClick={() => setSurge((s) => s + 1)}>
            Surge (question switch)
          </button>
        </div>
      </div>
    </div>
  );
}
