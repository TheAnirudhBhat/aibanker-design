"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";

/** A number whose CHARACTERS travel, rather than whose box is scaled.
 *
 * The approach is the one Family describes in its design notes: morph on
 * SHARED characters, so that "the commas ... shift visually from place to
 * place as the number is inputted". Two axes doing two different jobs:
 *
 * A digit that changes VALUE in a place it already holds is swapped INSTANTLY,
 * with no roll and no fade. That is measured, not assumed: sampling Family's
 * own price scrub at 6.6ms intervals, every frame shows a fully formed number.
 * Eight value changes in 140ms, not one intermediate frame among them.
 *
 * Only a glyph whose PLACE has moved travels, horizontally, to where it now
 * belongs — and in the reference that never happens at all, because the format
 * is fixed width. It happens here only because a rupee balance really does
 * change digit count, and without it the ₹ and the commas would teleport.
 *
 * Identity is by PLACE VALUE counted from the right, ignoring separators, which
 * is what makes the shared set large. ₹8,000 -> ₹1,28,000 keeps all four
 * original digits (places 0-3 hold 0,0,0,8 in both); only places 4 and 5 are
 * genuinely new, and they arrive on the left where they belong. Keying by
 * character index instead would call almost every glyph new and the whole
 * number would cross-fade.
 *
 * A comma is keyed by the place it FOLLOWS, so the thousands comma is the SAME
 * comma across the change and only the lakh comma is new. The leading symbol is
 * pinned to its own key so it is never mistaken for a digit.
 *
 * Tabular figures are required, not decorative: with proportional digits a
 * slot's width depends on which digit sits in it, so a glyph that never moved
 * would still drift. */

type Cell = { key: string; ch: string };

/** Split into cells keyed by place value, counted from the right. */
export function numberCells(text: string): Cell[] {
  const out: Cell[] = [];
  let place = 0;
  for (let i = text.length - 1; i >= 0; i--) {
    const ch = text[i];
    if (ch >= "0" && ch <= "9") out.push({ key: `d${place++}`, ch });
    else if (i === 0) out.push({ key: "lead", ch });         // the ₹ never changes rank
    else if (ch === ",") out.push({ key: `c${place}`, ch });  // the comma after this place
    else out.push({ key: `x${place}`, ch });                  // K, L, a decimal point
  }
  return out.reverse();
}

export function FluidNumber({ text, duration = 280, style }: {
  text: string;
  duration?: number;
  style?: CSSProperties;
}) {
  const host = useRef<HTMLSpanElement>(null);
  const lastX = useRef(new Map<string, number>());
  const running = useRef<Animation[]>([]);
  useLayoutEffect(() => () => { running.current.forEach(a => a.cancel()); }, []);

  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cells = Array.from(el.querySelectorAll<HTMLElement>("[data-cell]"));

    // Positions are HOST-RELATIVE, never viewport. Viewport coordinates fold in
    // every ancestor movement — a page push, a scroll, a pane resize — and the
    // FLIP would replay that as if the glyphs had moved. Measured once against
    // viewport coords: a one-character change produced a 279px slide, because
    // the phone frame itself had shifted.
    const origin = el.getBoundingClientRect().left;
    const xs = cells.map(c => c.getBoundingClientRect().left - origin);

    const prev = lastX.current;
    if (!reduced && prev.size) {
      running.current.forEach(a => a.cancel());
      running.current = cells.flatMap((c, i) => {
        const key = c.dataset.cell!;
        const from = prev.get(key);
        // A place that did not exist cannot slide from anywhere: it arrives.
        if (from === undefined) {
          return [c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: duration * 0.6, easing: "linear" })];
        }
        const out: Animation[] = [];
        const dx = from - xs[i];
        if (Math.abs(dx) >= 0.5) {
          out.push(c.animate(
            [{ transform: `translateX(${dx}px)` }, { transform: "translateX(0)" }],
            { duration, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
          ));
        }
        return out;
      });
    }
    lastX.current = new Map(cells.map((c, i) => [c.dataset.cell!, xs[i]]));
  }, [text, duration]);

  return (
    <span
      ref={host}
      style={{ display: "inline-block", whiteSpace: "pre", fontVariantNumeric: "tabular-nums", ...style }}
    >
      {numberCells(text).map(({ key, ch }) => (
        <span
          key={key}
          data-cell={key}
          data-ch={ch}
          // clipped so a rolling digit never escapes its own slot
          style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", willChange: "transform" }}
        >
          <span style={{ display: "inline-block" }}>{ch}</span>
        </span>
      ))}
    </span>
  );
}
