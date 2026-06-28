"use client";

import { useEffect, useRef, useState } from "react";

/**
 * True when the viewport is phone-sized — drives the full-bleed "prototype mode" where the
 * flow fills the screen and the dev chrome (phone-shell frame, breadcrumb, side controls) is
 * hidden. SSR-safe: returns false until mounted, so the desktop dev shell is the default and
 * there's no hydration flash on desktop.
 */
export function useIsMobileProto(breakpointPx = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpointPx]);
  return isMobile;
}

/**
 * Fires once when three (or more) fingers are pressed and held still for `holdMs` — the hidden
 * gesture that surfaces the prototype debug panel on a phone. Cancels if a finger lifts (count
 * drops below three), or the touch point travels past `moveTolerance` (so it never collides with
 * a scroll / drag). Listens on the window so the gesture works anywhere on the full-bleed flow.
 */
export function useThreeFingerHold(
  onTrigger: () => void,
  {
    enabled = true,
    holdMs = 500,
    moveTolerance = 24,
  }: { enabled?: boolean; holdMs?: number; moveTolerance?: number } = {},
) {
  const cbRef = useRef(onTrigger);
  cbRef.current = onTrigger;

  useEffect(() => {
    if (!enabled) return;
    let timer: number | null = null;
    let fired = false;
    let startX = 0;
    let startY = 0;

    const clear = () => {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
    };

    const center = (t: TouchList) => {
      let x = 0;
      let y = 0;
      for (let i = 0; i < t.length; i++) {
        x += t[i].clientX;
        y += t[i].clientY;
      }
      return { x: x / t.length, y: y / t.length };
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length >= 3) {
        fired = false;
        const c = center(e.touches);
        startX = c.x;
        startY = c.y;
        clear();
        timer = window.setTimeout(() => {
          if (!fired) {
            fired = true;
            cbRef.current();
          }
          clear();
        }, holdMs);
      } else {
        clear();
      }
    };

    const onMove = (e: TouchEvent) => {
      if (timer === null) return;
      if (e.touches.length < 3) {
        clear();
        return;
      }
      const c = center(e.touches);
      if (Math.hypot(c.x - startX, c.y - startY) > moveTolerance) clear();
    };

    const onEnd = (e: TouchEvent) => {
      if (e.touches.length < 3) clear();
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      clear();
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [enabled, holdMs, moveTolerance]);
}
