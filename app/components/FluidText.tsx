"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";

type Part = { id: string; text: string; style?: CSSProperties };

/** Keep native shaping intact. Separately springing character positions causes
 * collisions when a wider glyph replaces a narrow one. Instead, FLIP the width
 * of the entire shaped run: current text is immediate, only its width settles.
 * The small scale limit avoids squeezing a new digit count into an old width. */
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

  // Per-character motion, for the value RETURNING to live after a gesture.
  // Three things happen together, all measured against the run's PARENT (which
  // keeps its width) rather than the run or the viewport — the run recentres the
  // instant the text gets wider, and a run-relative FLIP cannot see its own host
  // move (measured: the ₹ jumped -36px while reporting 0px of travel).
  //   survivors  slide to their new slot, so a comma that changes grouping
  //              position travels there instead of teleporting
  //   arrivals   come in from the RIGHT and fade up
  //   departures leave the same way, as ghosts, since React has already removed
  //              them by the time this runs
  // A glyph that also CHANGED lands a vertical roll on its inner span, which is
  // a different element from the one carrying the slide, so they compose.
  const lastCells = useRef(new Map<string, { x: number; ch: string }>());
  const lastBoxW = useRef(0);
  const charAnims = useRef<Animation[]>([]);
  useLayoutEffect(() => {
    const el = run.current;
    if (!el || !rollDigits) return;
    const box = el.parentElement ?? el;
    const origin = box.getBoundingClientRect().left;
    // Cancel the previous pass BEFORE measuring, not after. getBoundingClientRect
    // returns the element where it is being ANIMATED to, not where layout put it,
    // so measuring first reads in-flight transforms as if they were positions.
    // A scrub re-enters this every frame, so that error compounds: measured
    // glyphs scattered 436px across a 312px box, gaps of 260px, a "4" stacked on
    // a "0". Cancelling first restores true layout positions, and it also stops
    // the animations piling up on one cell (7 live on a comma at worst).
    charAnims.current.forEach(a => a.cancel());
    charAnims.current = [];
    const cells = Array.from(el.querySelectorAll<HTMLElement>("[data-roll-cell]"));
    const now = new Map<string, { x: number; ch: string; el: HTMLElement }>();
    for (const c of cells) {
      now.set(c.dataset.rollCell!, { x: c.getBoundingClientRect().left - origin, ch: c.dataset.ch!, el: c });
    }
    const prev = lastCells.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Only FLIP against a measurement that is still comparable. These positions
    // were taken on a previous render, and this component lives inside a phone
    // frame that slides during page transitions: measure mid-transition and the
    // stored x values are garbage, which the next pass then faithfully animates
    // FROM. That is what scattered the glyphs across the screen and stacked a
    // "4" on a "0". If the container has resized or the travel is further than
    // the container is wide, the measurement is not trustworthy — place the
    // character and skip its animation rather than fling it.
    const boxW = box.getBoundingClientRect().width;
    const comparable = boxW > 0 && Math.abs(boxW - lastBoxW.current) < 1;

    if (prev.size && !reduced && comparable) {
      const slide: KeyframeAnimationOptions = { duration: rollMs, easing: "cubic-bezier(0.22, 1, 0.36, 1)" };
      for (const [key, cur] of now) {
        const was = prev.get(key);
        if (!was) {
          // A SEPARATOR does not arrive from off-screen — it splits off the one
          // already on screen. ₹8,000 -> ₹1,28,000 grows a lakh comma, and it
          // reads as the thousands comma duplicating and the pair settling into
          // their own places, rather than a comma appearing out of nowhere. So
          // it starts on top of its donor, at full opacity, and slides out.
          let donor = cur.ch === "," || cur.ch === "."
            ? [...prev.values()].filter(v => v.ch === cur.ch)
                .sort((a, b) => Math.abs(a.x - cur.x) - Math.abs(b.x - cur.x))[0]
            : undefined;
          if (donor && Math.abs(donor.x - cur.x) > boxW) donor = undefined;
          charAnims.current.push(cur.el.animate(donor
            ? [{ transform: `translateX(${donor.x - cur.x}px)` }, { transform: "translateX(0)" }]
            : [{ transform: "translateX(0.55em)", opacity: 0 }, { transform: "translateX(0)", opacity: 1 }], slide));
          continue;
        }
        const dx = was.x - cur.x;
        if (Math.abs(dx) >= 0.5 && Math.abs(dx) <= boxW) {
          charAnims.current.push(cur.el.animate([{ transform: `translateX(${dx}px)` }, { transform: "translateX(0)" }], slide));
        }
        const inner = cur.el.firstElementChild as HTMLElement | null;
        // The SLIDE always runs — a comma that changes grouping position has to
        // travel there whether or not a finger is down, or it disappears from
        // one place and reappears in another. Only the vertical ROLL waits for
        // the gesture to end.
        if (!suppressRoll && inner && was.ch !== cur.ch) {
          const bothDigits = /\d/.test(cur.ch) && /\d/.test(was.ch);
          const up = bothDigits ? Number(cur.ch) > Number(was.ch) : true;
          const ghost = document.createElement("span");
          ghost.textContent = was.ch;
          ghost.setAttribute("aria-hidden", "true");
          ghost.style.cssText = "display:inline-block;position:absolute;left:0;top:0";
          cur.el.appendChild(ghost);
          const g = ghost.animate([{ transform: "translateY(0)", opacity: 1 },
                                   { transform: `translateY(${up ? 1 : -1}em)`, opacity: 0 }], slide);
          g.finished.then(() => ghost.remove()).catch(() => ghost.remove());
          charAnims.current.push(g);
          charAnims.current.push(inner.animate([{ transform: `translateY(${up ? -1 : 1}em)`, opacity: 0 },
                         { transform: "translateY(0)", opacity: 1 }], slide));
        }
      }
      // departures: rebuilt as ghosts at the slot they held, then sent away.
      // A separator leaves the way it came — back INTO the one that remains, so
      // the pair merges rather than one of them just evaporating.
      for (const [key, was] of prev) {
        if (now.has(key)) continue;
        // The ghost goes in the BOX, not the run. Its x was measured against the
        // box, and the run is neither at the box's origin nor untransformed: it
        // is centred inside it (measured 73.8px over) and carries the width
        // spring's scaleX. Appending here put every departing glyph ~74px from
        // where that character actually sat, flying in from nowhere.
        const ghost = document.createElement("span");
        ghost.textContent = was.ch;
        ghost.setAttribute("aria-hidden", "true");
        const rb = el.getBoundingClientRect(), bb = box.getBoundingClientRect();
        ghost.style.cssText = `display:inline-block;position:absolute;left:${was.x}px;top:${rb.top - bb.top}px;font:inherit`;
        box.appendChild(ghost);
        let host = was.ch === "," || was.ch === "."
          ? [...now.values()].filter(v => v.ch === was.ch)
              .sort((a, b) => Math.abs(a.x - was.x) - Math.abs(b.x - was.x))[0]
          : undefined;
        if (host && Math.abs(host.x - was.x) > boxW) host = undefined;
        if (was.x < -boxW || was.x > boxW * 2) { continue; }   // stored from a bad frame
        const g = ghost.animate(host
          ? [{ transform: "translateX(0)" }, { transform: `translateX(${host.x - was.x}px)`, opacity: 0 }]
          : [{ transform: "translateX(0)", opacity: 1 }, { transform: "translateX(0.55em)", opacity: 0 }], slide);
        g.finished.then(() => ghost.remove()).catch(() => ghost.remove());
        charAnims.current.push(g);
      }
    }
    lastCells.current = new Map([...now].map(([k, v]) => [k, { x: v.x, ch: v.ch }]));
    lastBoxW.current = boxW;
  }, [parts, rollDigits, suppressRoll, rollMs]);

  return (
    <span className="re1-fluid-text" style={{ ...style, display: "block", position: "relative", width: align === "right" ? "max-content" : "100%", textAlign: "left", whiteSpace: "pre", fontVariantNumeric: "proportional-nums", fontKerning: "normal" }}>
      <span ref={run} data-fluid-run style={{ display: "inline-flex", alignItems: "baseline", position: "relative", left: align === "center" ? "50%" : undefined, transform: align === "center" ? "translateX(-50%)" : undefined, transformOrigin: align === "right" ? "100% 50%" : "50% 50%" }}>
        {parts.map(part => (
          <span key={part.id} data-fluid-part style={{ ...part.style, display: "inline-block" }}>
            {rollDigits
              ? placeKeys(part.text).map(({ key: slot, ch }) => {
                  const key = `${part.id}:${slot}`;
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
