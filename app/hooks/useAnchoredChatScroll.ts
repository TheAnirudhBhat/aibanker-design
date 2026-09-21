"use client";

import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";

/** A single scroll owner: each sent message leads its reply, and manual scroll
 * cancels the ride. Content growth updates the spacer without fighting touch. */
export function useAnchoredChatScroll({ viewport, content, spacer, anchor, anchorId, active, topInset, viewportHeight, contentVersion }: {
  viewport: RefObject<HTMLDivElement | null>;
  content: RefObject<HTMLDivElement | null>;
  spacer: RefObject<HTMLDivElement | null>;
  anchor: RefObject<HTMLDivElement | null>;
  anchorId: number | null;
  active: boolean;
  topInset: number;
  viewportHeight: number;
  contentVersion: string;
}) {
  const ride = useRef({ raf: 0, target: 0, scroll: 0, manual: false, open: false, anchorId: null as number | null });
  const stopForGesture = useCallback(() => {
    cancelAnimationFrame(ride.current.raf);
    ride.current.raf = 0;
    ride.current.manual = true;
  }, []);

  useLayoutEffect(() => {
    const state = ride.current;
    const el = viewport.current;
    const body = content.current;
    const tail = spacer.current;
    if (!active || !el || !body || !tail) {
      state.open = false;
      cancelAnimationFrame(state.raf);
      state.raf = 0;
      return;
    }
    const opening = !state.open;
    const newAnchor = state.anchorId !== anchorId;
    state.open = true;
    state.anchorId = anchorId;
    if (opening || newAnchor) state.manual = false;
    let firstMeasure = true;
    const measure = () => {
      // A shorter dock grows the viewport. The browser would clamp scrollTop
      // before ResizeObserver can replenish the tail, producing a visible
      // backwards jump. Restore the pre-layout position in this layout effect.
      const previousScroll = firstMeasure && !opening ? state.scroll : el.scrollTop;
      const node = anchor.current;
      const naturalHeight = topInset + body.offsetHeight + 8;
      // offsetTop belongs to the positioned scroll viewport, not a transformed bubble.
      const target = node ? Math.max(0, node.offsetTop - topInset) : Math.max(0, naturalHeight - el.clientHeight);
      const needed = node ? Math.max(0, target + el.clientHeight - naturalHeight) : 0;
      const preserve = Math.max(0, previousScroll + el.clientHeight - naturalHeight);
      tail.style.setProperty("height", `${Math.max(needed, preserve, state.manual ? tail.offsetHeight : 0)}px`);
      el.scrollTo({ top: previousScroll, behavior: "instant" });
      state.target = target;
      if (state.manual) return;
      if ((opening && firstMeasure) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.scrollTo({ top: target, behavior: "instant" });
        state.scroll = el.scrollTop;
      } else if (!state.raf && Math.abs(el.scrollTop - target) > 1) {
        const start = el.scrollTop;
        const startedAt = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - startedAt) / 360);
          el.scrollTo({ top: start + (state.target - start) * (1 - Math.pow(1 - p, 3)), behavior: "instant" });
          state.scroll = el.scrollTop;
          state.raf = p < 1 ? requestAnimationFrame(tick) : 0;
        };
        state.raf = requestAnimationFrame(tick);
      }
      firstMeasure = false;
    };
    measure();
    const rememberScroll = () => { state.scroll = el.scrollTop; };
    el.addEventListener("scroll", rememberScroll, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    observer.observe(el);
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", rememberScroll);
      cancelAnimationFrame(state.raf);
      state.raf = 0;
    };
  }, [active, anchorId, topInset, viewportHeight, contentVersion, viewport, content, spacer, anchor]);

  return stopForGesture;
}
