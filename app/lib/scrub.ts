"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** A scrub is a gesture that drives a value continuously: dragging the bank
 *  balance along its line, pushing the cashflow strip through its months. The
 *  two charts look nothing alike and both need the same three things, which
 *  they each used to carry their own copy of —
 *
 *  1. a WINDOW that is open for the length of the gesture,
 *  2. one commit per frame, however fast the input arrives,
 *  3. a re-armable settle timer for "the movement has stopped".
 *
 *  All three have to be torn down on unmount, and that is the part worth
 *  writing once: a stray rAF or timeout outliving its component is the bug
 *  this file exists to make unrepeatable.
 *
 *  The window is what FluidText's `suppressRoll` reads. Holding the roll for
 *  the length of the gesture leaves the width spring as the only thing moving,
 *  and that variable-kerning travel IS the scrub (user call). The roll then
 *  belongs to the changes a finger did not make — drilling into a level, or a
 *  release that jumps the value home.
 */
export type Scrub = {
  /** Open for the whole gesture. This is what `suppressRoll` wants. */
  active: boolean;
  /** Open the window. Idempotent, so it is safe on every pointer move. */
  begin: () => void;
  /** Close it. Idempotent. */
  end: () => void;
  /** Book `cb` for the next frame. While one is booked, further calls are
   *  DROPPED rather than replacing it — the booked callback reads current
   *  refs when it runs, so it already carries the newest value, and dropping
   *  is what keeps a 120Hz pointer stream to one commit per frame. Call
   *  `frame` again from inside `cb` to keep a loop running. */
  frame: (cb: () => void) => void;
  /** Run `cb` once, `ms` from now, replacing any settle already pending. */
  settle: (ms: number, cb: () => void) => void;
  /** Drop a booked frame and a pending settle. Leaves the window alone. */
  cancel: () => void;
};

export function useScrub(): Scrub {
  const [active, setActive] = useState(false);
  // 0 is "nothing booked" for both: requestAnimationFrame and setTimeout never
  // return 0, so it doubles as the empty state without a null union.
  const raf = useRef(0);
  const timer = useRef(0);

  const cancel = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    if (timer.current) window.clearTimeout(timer.current);
    raf.current = 0;
    timer.current = 0;
  }, []);

  // The one teardown. Every handle this hook hands out is cancelled here, so
  // no caller has to remember to write its own unmount effect.
  useEffect(() => cancel, [cancel]);

  const frame = useCallback((cb: () => void) => {
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      // clear BEFORE the callback, so a cb that books the next frame (a tween
      // stepping itself) is not silently dropped by its own booking
      raf.current = 0;
      cb();
    });
  }, []);

  const settle = useCallback((ms: number, cb: () => void) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = 0;
      cb();
    }, ms);
  }, []);

  const begin = useCallback(() => setActive(true), []);
  const end = useCallback(() => setActive(false), []);

  return { active, begin, end, frame, settle, cancel };
}

/** Exponential-moving-average pointer velocity, in px/ms, signed with the
 *  drag. A flick is projected off this, so it is smoothed: a single stuttering
 *  frame at the end of a drag should not decide where the strip lands. */
export function useDragVelocity() {
  const last = useRef({ x: 0, t: 0, v: 0 });
  const start = useCallback((x: number) => {
    last.current = { x, t: performance.now(), v: 0 };
  }, []);
  const move = useCallback((x: number) => {
    const now = performance.now();
    const d = last.current;
    // clamp dt: two events in the same millisecond would divide by ~0 and
    // throw an enormous velocity into the average
    const dt = Math.max(1, now - d.t);
    d.v = 0.8 * ((x - d.x) / dt) + 0.2 * d.v;
    d.x = x;
    d.t = now;
  }, []);
  /** Where the flick is heading, `ms` from the last sample. */
  const project = useCallback((ms: number) => last.current.v * ms, []);
  return { start, move, project };
}
