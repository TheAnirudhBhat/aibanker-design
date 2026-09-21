"use client";

import { useEffect, useRef, useState } from "react";
import { FluidNumber } from "@/app/components/FluidNumber";

// Scratch surface for the number morph. Deliberately NOT wired to the bank or
// cashflow pages: this exists so a broken intermediate can be caught here
// instead of on a screen someone is looking at.

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

// The cases that actually break things, not a tidy count: a digit changing in
// place, a place appearing, a comma moving from place to place, and the lakh
// grouping arriving.
const STEPS = [8000, 8001, 8090, 9000, 12000, 128000, 99999, 100000, 8000];

export default function FluidNumberPlayground() {
  const [value, setValue] = useState(8000);
  const [auto, setAuto] = useState(false);
  const i = useRef(0);

  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => {
      i.current = (i.current + 1) % STEPS.length;
      setValue(STEPS[i.current]);
    }, 900);
    return () => window.clearInterval(id);
  }, [auto]);

  return (
    <div style={{ padding: 40, display: "flex", flexDirection: "column", gap: 28, fontFamily: "var(--font-rubik), sans-serif" }}>
      <h1 style={{ fontSize: 20, fontWeight: 500 }}>FluidNumber</h1>

      <div data-probe style={{ width: 520, padding: "32px 24px", border: "1px solid rgba(128,128,128,0.25)", borderRadius: 16, textAlign: "center" }}>
        <FluidNumber text={inr(value)} style={{ fontSize: 48, lineHeight: "56px", fontWeight: 500, letterSpacing: -0.48 }} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {STEPS.map((n, k) => (
          <button
            key={`${n}-${k}`}
            type="button"
            onClick={() => setValue(n)}
            style={{ padding: "8px 14px", borderRadius: 100, border: "1px solid rgba(128,128,128,0.35)", background: "transparent", cursor: "pointer", fontSize: 13 }}
          >
            {inr(n)}
          </button>
        ))}
        <button
          type="button"
          data-auto
          onClick={() => setAuto(a => !a)}
          style={{ padding: "8px 14px", borderRadius: 100, border: "none", background: "#D30AD7", color: "#fff", cursor: "pointer", fontSize: 13 }}
        >
          {auto ? "Stop" : "Play"}
        </button>
      </div>

      {/* a continuous sweep, which is what a scrub actually does */}
      <input
        data-sweep
        type="range"
        min={1000}
        max={200000}
        step={137}
        value={value}
        onChange={e => setValue(Number(e.target.value))}
        style={{ width: 520 }}
      />
    </div>
  );
}
