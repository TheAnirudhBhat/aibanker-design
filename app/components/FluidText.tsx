"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";

type Part = { id: string; text: string; style?: CSSProperties };

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** The spring that carries the run's width. omega comes from the caller's
 *  duration; the settle thresholds are px and px/s of that width, and maxFrame
 *  stops a backgrounded tab integrating one enormous step on wake. */
const SPRING = {
  omegaFor: (durationMs: number) => 6000 / Math.max(80, durationMs),
  settledWidth: 0.015,
  settledVelocity: 0.15,
  maxFrame: 0.05,
} as const;

/** The format FLIP runs shorter than the layout it belongs to, so it finishes
 *  inside the surrounding motion rather than trailing it. */
const FORMAT_FLIP_SCALE = 0.65;

const RUN_STYLE: CSSProperties = { display: "inline-flex", alignItems: "baseline", position: "relative" };
const CELL_STYLE: CSSProperties = { display: "inline-block", position: "relative", overflow: "hidden", verticalAlign: "top" };
const GLYPH_STYLE: CSSProperties = { display: "inline-block" };

/** Split a run into characters keyed by PLACE VALUE, counted from the right and
 *  ignoring separators. Plain index-from-right looks equivalent and is not: it
 *  renumbers every glyph the moment the string changes length, so ₹8,000 ->
 *  ₹1,28,000 turns the ₹ from slot 5 into slot 8 and the whole number is torn
 *  down and rebuilt instead of sliding. By place value the ₹ is pinned, the
 *  trailing digits keep their slots, the thousands comma stays the same comma,
 *  and only the new places are new. */
function placeKeys(text: string): { key: string; ch: string }[] {
  const out: { key: string; ch: string }[] = [];
  let place = 0;
  for (let i = text.length - 1; i >= 0; i--) {
    const ch = text[i];
    if (ch >= "0" && ch <= "9") out.push({ key: `d${place++}`, ch });
    else if (i === 0) out.push({ key: "lead", ch });        // ₹ never changes rank
    else if (ch === "," || ch === ".") out.push({ key: `c${place}`, ch });
    else out.push({ key: `x${place}`, ch });
  }
  return out.reverse();
}

/** Roll one slot from `from` to `to` on the block axis with both glyphs on
 *  screen at once: the outgoing one is a throwaway clone stacked on the slot,
 *  which is clipped, so neither can escape or reach a neighbour. Rising values
 *  arrive from above, falling from below. */
function rollSlot(cell: HTMLElement, glyph: HTMLElement, from: string, to: string, opts: KeyframeAnimationOptions): Animation[] {
  const numeric = /\d/.test(to) && /\d/.test(from);
  const up = numeric ? Number(to) > Number(from) : true;
  const ghost = document.createElement("span");
  ghost.textContent = from;
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.cssText = "display:inline-block;position:absolute;left:0;top:0";
  cell.appendChild(ghost);
  const leaving = ghost.animate(
    [{ transform: "translateY(0)", opacity: 1 }, { transform: `translateY(${up ? 1 : -1}em)`, opacity: 0 }], opts);
  leaving.finished.then(() => ghost.remove()).catch(() => ghost.remove());
  const arriving = glyph.animate(
    [{ transform: `translateY(${up ? -1 : 1}em)`, opacity: 0 }, { transform: "translateY(0)", opacity: 1 }], opts);
  return [leaving, arriving];
}

/** Keep native shaping intact. Springing character positions separately causes
 *  collisions when a wider glyph replaces a narrow one, so the run's WIDTH is
 *  what springs: the text itself is immediate and only its bounds settle. */
export function FluidText({
  parts,
  style,
  trailing,
  trailingWidth = 0,
  layoutDuration = 220,
  align = "center",
  layoutKey,
  maxDeform = 0.08,
  tracking = false,
  rollDigits = false,
  suppressRoll = false,
  rollMs = 280,
}: {
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
  /** Hold the vertical ROLL while a gesture is driving the value — and only the
      roll. Characters still slide, arrive and leave under the finger, because a
      comma that changes grouping position must be seen to travel there.
      Separate from `tracking` ON PURPOSE: tracking also switches the WIDTH
      spring off, and that spring is the variable-kerning travel that makes a
      scrub feel fluid. Gating the roll must not cost either of those. */
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
    const reduced = window.matchMedia(REDUCED_MOTION);
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
      state.omega = SPRING.omegaFor(layoutDuration);
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
          ], { duration: layoutDuration * FORMAT_FLIP_SCALE, easing: EASE });
        }
      }
      // Grabbing the chart mid-morph kills the spring outright, so a settle
      // from the last release can never fight the finger that interrupted it.
      if (tracking || reduced.matches) { cancelAnimationFrame(state.raf); state.raf = 0; formatAnimation.current?.cancel(); return; }
      if (state.raf || Math.abs(state.width - width) < 0.01) return;
      state.lastTime = performance.now();
      const tick = (now: number) => {
        const dt = Math.min((now - state.lastTime) / 1000, SPRING.maxFrame);
        state.lastTime = now;
        const decay = Math.exp(-state.omega * dt);
        const offset = state.width - state.target;
        const step = (state.velocity + state.omega * offset) * dt;
        state.width = state.target + (offset + step) * decay;
        state.velocity = (state.velocity - state.omega * step) * decay;
        const settled = Math.abs(state.width - state.target) < SPRING.settledWidth
          && Math.abs(state.velocity) < SPRING.settledVelocity;
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

  // Per-character motion.
  //
  // The characters that STAY are never transformed. That is the whole trick.
  // A FLIP moves layout to its final state and then flies each glyph across to
  // catch up, so glyphs pass THROUGH each other — every version of that here
  // overlapped, from 33px down to 24.5px, and it was never a tuning value.
  // Instead the ARRIVING character animates its own WIDTH up from zero. Layout
  // then opens progressively, and every other character slides because inline
  // flow carries it. Inline flow cannot overlap, so the crossing is gone by
  // construction rather than by timing.
  //
  // A digit that changes in place still rolls on the block axis, which is a
  // different element and cannot collide with anything.
  const lastChars = useRef(new Map<string, string>());
  const charAnims = useRef<Animation[]>([]);
  useLayoutEffect(() => {
    const el = run.current;
    if (!el || !rollDigits) return;
    charAnims.current.forEach(a => a.cancel());
    charAnims.current = [];
    const cells = Array.from(el.querySelectorAll<HTMLElement>("[data-roll-cell]"));
    const prev = lastChars.current;
    const reduced = window.matchMedia(REDUCED_MOTION).matches;

    if (prev.size && !reduced) {
      const opts: KeyframeAnimationOptions = { duration: rollMs, easing: EASE };
      for (const c of cells) {
        const key = c.dataset.rollCell!, ch = c.dataset.ch!;
        const was = prev.get(key);
        if (was === undefined) {
          // offsetWidth, not getBoundingClientRect: the run carries the width
          // spring's scaleX and a scaled target would open the wrong gap.
          const w = c.offsetWidth;
          if (w > 0) {
            charAnims.current.push(c.animate(
              [{ width: "0px", opacity: 0 }, { width: `${w}px`, opacity: 1 }], opts));
          }
          continue;
        }
        const glyph = c.firstElementChild as HTMLElement | null;
        if (glyph && was !== ch && !suppressRoll) {
          charAnims.current.push(...rollSlot(c, glyph, was, ch, opts));
        }
      }
    }
    lastChars.current = new Map(cells.map(c => [c.dataset.rollCell!, c.dataset.ch!]));
  }, [parts, rollDigits, suppressRoll, rollMs]);

  return (
    <span className="re1-fluid-text" style={{ ...style, display: "block", position: "relative", width: align === "right" ? "max-content" : "100%", textAlign: "left", whiteSpace: "pre", fontVariantNumeric: "proportional-nums", fontKerning: "normal" }}>
      <span ref={run} data-fluid-run style={{ ...RUN_STYLE, left: align === "center" ? "50%" : undefined, transform: align === "center" ? "translateX(-50%)" : undefined, transformOrigin: align === "right" ? "100% 50%" : "50% 50%" }}>
        {parts.map(part => (
          <span key={part.id} data-fluid-part style={{ ...part.style, display: "inline-block" }}>
            {rollDigits
              ? placeKeys(part.text).map(({ key: slot, ch }) => {
                  const key = `${part.id}:${slot}`;
                  return (
                    <span key={key} data-roll-cell={key} data-ch={ch} style={CELL_STYLE}>
                      <span style={GLYPH_STYLE}>{ch}</span>
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
