"use client";

import { useEffect, useState } from "react";

/** A corner readout of the main thread's frame pacing, for a phone in hand
    (open the route with ?perf=1): animation frames in the last second, the
    longest gap between two of them, how many gaps ran past two frames, and the
    worst seen. If the display steps while this holds 60/s, the stall is past
    the main thread (the compositor or the GPU); if it reads 20/s, the main
    thread is blocked, and the longest gap says by how much. */
export default function PerfReadout() {
  const [text, setText] = useState("");
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let windowStart = last;
    let gaps: number[] = [];
    let worst = 0;
    let over34Total = 0;
    const tick = (t: number) => {
      gaps.push(t - last);
      last = t;
      if (t - windowStart >= 1000) {
        const max = Math.max(...gaps);
        const over34 = gaps.filter((g) => g > 34).length;
        worst = Math.max(worst, max);
        over34Total += over34;
        setText(`${gaps.length}/s · max ${max.toFixed(0)}ms · >34ms ${over34} · worst ${worst.toFixed(0)}ms · stalls ${over34Total}`);
        gaps = [];
        windowStart = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div aria-hidden style={{ position: "fixed", top: 64, left: 8, zIndex: 9999, padding: "4px 8px", borderRadius: 8, background: "rgba(0,0,0,0.75)", color: "#7CFF9B", font: "11px/1.4 ui-monospace, Menlo, monospace", pointerEvents: "none", whiteSpace: "nowrap" }}>
      {text || "perf…"}
    </div>
  );
}
