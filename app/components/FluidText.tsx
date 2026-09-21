"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";

type Part = { id: string; text: string; style?: CSSProperties };

/** Keep native shaping intact. Separately springing character positions causes
 * collisions when a wider glyph replaces a narrow one. Instead, FLIP the width
 * of the entire shaped run: current text is immediate, only its width settles.
 * The small scale limit avoids squeezing a new digit count into an old width. */
export function FluidText({ parts, style, trailing, trailingWidth = 0, layoutDuration = 220, align = "center", layoutKey }: {
  parts: Part[];
  style?: CSSProperties;
  trailing?: ReactNode;
  trailingWidth?: number;
  layoutDuration?: number;
  align?: "center" | "right";
  /** Format changes use a bounded FLIP, instead of a second trailing spring. */
  layoutKey?: string;
}) {
  const run = useRef<HTMLSpanElement>(null);
  const motion = useRef({ raf: 0, lastTime: 0, width: 0, target: 0, velocity: 0, omega: 28, layoutKey });
  const formatAnimation = useRef<Animation | null>(null);
  useLayoutEffect(() => () => { cancelAnimationFrame(motion.current.raf); motion.current.raf = 0; formatAnimation.current?.cancel(); }, []);

  useLayoutEffect(() => {
    const el = run.current;
    if (!el) return;
    let disposed = false;
    const state = motion.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const paint = () => {
      el.style.transform = `${align === "center" ? "translateX(-50%) " : ""}scaleX(${state.target ? state.width / state.target : 1})`;
    };
    const layout = () => {
      if (disposed) return;
      // Computed width is untransformed and fractional. Reading the scaled
      // bounding rect here would feed the animation back into its own target.
      const width = parseFloat(getComputedStyle(el).width);
      if (!width) return;
      const formatChanged = state.layoutKey !== layoutKey;
      const formatFrom = state.target;
      state.omega = 6000 / Math.max(80, layoutDuration);
      if (!state.target || reduced.matches || formatChanged) {
        cancelAnimationFrame(state.raf); state.raf = 0;
        state.width = width; state.velocity = 0;
      } else if (Math.abs(width - state.target) > 0.01) {
        // A new precision/length may be much wider. Keep deformation subtle;
        // the full readable value takes precedence over preserving old bounds.
        state.width = Math.max(width * 0.92, Math.min(width * 1.08, state.width));
      }
      state.target = width;
      state.layoutKey = layoutKey;
      paint();
      if (formatChanged) {
        formatAnimation.current?.cancel();
        if (!reduced.matches && formatFrom) {
          // The compact/full strings can differ by ~70%. Carry the previous
          // natural width into the new run, then expand/contract continuously
          // during the remaining header motion. No glyphs can cross each other.
          const prefix = align === "center" ? "translateX(-50%) " : "";
          formatAnimation.current = el.animate([
            { transform: `${prefix}scaleX(${formatFrom / width})` },
            { transform: `${prefix}scaleX(1)` },
          ], { duration: layoutDuration * 0.65, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
        }
      }
      if (reduced.matches) { cancelAnimationFrame(state.raf); state.raf = 0; formatAnimation.current?.cancel(); return; }
      if (state.raf || Math.abs(state.width - width) < 0.01) return;
      state.lastTime = performance.now();
      const tick = (now: number) => {
        const dt = Math.min((now - state.lastTime) / 1000, 0.05);
        state.lastTime = now;
        const decay = Math.exp(-state.omega * dt);
        const offset = state.width - state.target;
        const step = (state.velocity + state.omega * offset) * dt;
        state.width = state.target + (offset + step) * decay;
        state.velocity = (state.velocity - state.omega * step) * decay;
        const settled = Math.abs(state.width - state.target) < 0.015 && Math.abs(state.velocity) < 0.15;
        if (settled) { state.width = state.target; state.velocity = 0; }
        paint();
        state.raf = settled ? 0 : requestAnimationFrame(tick);
      };
      state.raf = requestAnimationFrame(tick);
    };
    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(el);
    reduced.addEventListener("change", layout);
    void document.fonts.ready.then(layout);
    return () => { disposed = true; observer.disconnect(); reduced.removeEventListener("change", layout); };
  }, [parts, trailingWidth, layoutDuration, align, layoutKey]);

  return (
    <span className="re1-fluid-text" style={{ ...style, display: "block", position: "relative", width: align === "right" ? "max-content" : "100%", textAlign: "left", whiteSpace: "pre", fontVariantNumeric: "proportional-nums", fontKerning: "normal" }}>
      <span ref={run} data-fluid-run style={{ display: "inline-flex", alignItems: "baseline", position: "relative", left: align === "center" ? "50%" : undefined, transform: align === "center" ? "translateX(-50%)" : undefined, transformOrigin: align === "right" ? "100% 50%" : "50% 50%" }}>
        {parts.map(part => <span key={part.id} data-fluid-part style={{ ...part.style, display: "inline-block" }}>{part.text}</span>)}
        {trailing && <span aria-hidden style={{ width: trailingWidth, flexShrink: 0, display: "inline-flex", alignSelf: "center", justifyContent: "flex-end" }}>{trailing}</span>}
      </span>
    </span>
  );
}
