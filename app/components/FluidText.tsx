"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";

type Part = { id: string; text: string; style?: CSSProperties };

/** Keep native shaping intact. Separately springing character positions causes
 * collisions when a wider glyph replaces a narrow one. Instead, FLIP the width
 * of the entire shaped run: current text is immediate, only its width settles.
 * The small scale limit avoids squeezing a new digit count into an old width. */
export function FluidText({ parts, style, trailing, trailingWidth = 0, layoutDuration = 220, align = "center", layoutKey, maxDeform = 0.08, tracking = false, rollDigits = false, suppressRoll = false, rollMs = 280 }: {
  parts: Part[];
  style?: CSSProperties;
  trailing?: ReactNode;
  trailingWidth?: number;
  layoutDuration?: number;
  align?: "center" | "right";
  /** Format changes use a bounded FLIP, instead of a second trailing spring. */
  layoutKey?: string;
  /** How far the run may be carried from its true width while the spring
      settles, as a fraction. This is the budget for animating the change:
      anything beyond it is taken instantly, in one frame. 0.08 keeps glyph
      deformation invisible but means a value that changes DIGIT COUNT snaps
      most of the way — measured at a 17.8px jump on the bank balance mid
      scrub. Raise it where the width moves a lot and the movement itself is
      the point; leave it low where the value only ever nudges. */
  maxDeform?: number;
  /** Render each character in its own clipped slot so a digit that CHANGES can
      roll on the block axis. Layout is untouched — the characters stay in normal
      inline flow, so the run measures and springs exactly as before. Off by
      default; the other call sites have no reason to pay for the extra spans. */
  rollDigits?: boolean;
  /** Hold the roll while a gesture is driving the value. Separate from
      `tracking` ON PURPOSE: tracking also switches the WIDTH spring off, and
      the spring is the variable-kerning travel that makes a scrub feel fluid.
      Gating the roll must not cost that. */
  suppressRoll?: boolean;
  rollMs?: number;
  /** The value is being driven by a LIVE GESTURE (a scrub, a drag), so it
      changes every frame. Take every width immediately: a spring re-targeted
      at 60Hz can never settle, so it just carries a standing deformation
      around — measured on the bank balance mid scrub at scaleX 0.92–1.09 at
      maxDeform 0.08 and 0.81–1.19 at 0.35, i.e. the knob only chooses between
      snapping and smearing. Nothing to animate while the finger IS the
      animation; drop it on release and the morph plays for real. */
  tracking?: boolean;
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
      if (!state.target || reduced.matches || tracking || formatChanged) {
        cancelAnimationFrame(state.raf); state.raf = 0;
        state.width = width; state.velocity = 0;
      } else if (Math.abs(width - state.target) > 0.01) {
        // Carry the old width into the new run so the change is travelled
        // rather than taken. Whatever falls outside maxDeform is still taken
        // in one frame — the readable value beats preserving old bounds.
        state.width = Math.max(width * (1 - maxDeform), Math.min(width * (1 + maxDeform), state.width));
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
      // Grabbing the chart mid-morph kills the spring outright, so a settle
      // from the last release can never fight the finger that interrupted it.
      if (tracking || reduced.matches) { cancelAnimationFrame(state.raf); state.raf = 0; formatAnimation.current?.cancel(); return; }
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
  }, [parts, trailingWidth, layoutDuration, align, layoutKey, maxDeform, tracking]);

  // Vertical digit roll, for the value RETURNING to live after a gesture.
  // Deliberately NOT paired with any horizontal movement of the cells: a
  // per-cell horizontal FLIP makes glyphs travel through each other's slots
  // (measured 22.4px of visible overlap growing 8,000 -> 1,28,000, and it would
  // not tune below 10.5px). Width stays the spring's job, so nothing collides.
  const lastChars = useRef(new Map<string, string>());
  useLayoutEffect(() => {
    const el = run.current;
    if (!el || !rollDigits) return;
    const cells = Array.from(el.querySelectorAll<HTMLElement>("[data-roll-cell]"));
    const prev = lastChars.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prev.size && !suppressRoll && !reduced) {
      for (const c of cells) {
        const key = c.dataset.rollCell!, ch = c.dataset.ch!, was = prev.get(key);
        const inner = c.firstElementChild as HTMLElement | null;
        if (!inner || was === undefined || was === ch) continue;
        // Any glyph that CHANGED IN PLACE rolls, not only digit-to-digit. The
        // cashflow figure's whole change is ₹15K -> ₹15,000, where the slot that
        // carries it goes "K" -> "0": a digits-only guard sat that one out and
        // nothing rolled at all. Direction follows the value where both sides
        // are numeric, and defaults to rising otherwise.
        const bothDigits = /\d/.test(ch) && /\d/.test(was);
        const up = bothDigits ? Number(ch) > Number(was) : true;
        const ghost = document.createElement("span");
        ghost.textContent = was;
        ghost.setAttribute("aria-hidden", "true");
        ghost.style.cssText = "display:inline-block;position:absolute;left:0;top:0";
        c.appendChild(ghost);
        const opts: KeyframeAnimationOptions = { duration: rollMs, easing: "cubic-bezier(0.22, 1, 0.36, 1)" };
        const g = ghost.animate([{ transform: "translateY(0)", opacity: 1 },
                                 { transform: `translateY(${up ? 1 : -1}em)`, opacity: 0 }], opts);
        g.finished.then(() => ghost.remove()).catch(() => ghost.remove());
        inner.animate([{ transform: `translateY(${up ? -1 : 1}em)`, opacity: 0 },
                       { transform: "translateY(0)", opacity: 1 }], opts);
      }
    }
    lastChars.current = new Map(cells.map(c => [c.dataset.rollCell!, c.dataset.ch!]));
  }, [parts, rollDigits, suppressRoll, rollMs]);

  return (
    <span className="re1-fluid-text" style={{ ...style, display: "block", position: "relative", width: align === "right" ? "max-content" : "100%", textAlign: "left", whiteSpace: "pre", fontVariantNumeric: "proportional-nums", fontKerning: "normal" }}>
      <span ref={run} data-fluid-run style={{ display: "inline-flex", alignItems: "baseline", position: "relative", left: align === "center" ? "50%" : undefined, transform: align === "center" ? "translateX(-50%)" : undefined, transformOrigin: align === "right" ? "100% 50%" : "50% 50%" }}>
        {parts.map(part => (
          <span key={part.id} data-fluid-part style={{ ...part.style, display: "inline-block" }}>
            {rollDigits
              // keyed from the RIGHT so a slot keeps its identity as the number
              // grows: the trailing digits stay the same digits.
              ? Array.from(part.text).map((ch, i, all) => {
                  const key = `${part.id}:${all.length - 1 - i}`;
                  return (
                    <span key={key} data-roll-cell={key} data-ch={ch}
                      style={{ display: "inline-block", position: "relative", overflow: "hidden", verticalAlign: "top" }}>
                      <span style={{ display: "inline-block" }}>{ch}</span>
                    </span>
                  );
                })
              : part.text}
          </span>
        ))}
        {trailing && <span aria-hidden style={{ width: trailingWidth, flexShrink: 0, display: "inline-flex", alignSelf: "center", justifyContent: "flex-end" }}>{trailing}</span>}
      </span>
    </span>
  );
}
