"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { MOCK_KEYBOARD_HEIGHT } from "../components/MockKeyboard";
import { BOTTOM_INSET } from "../components/AppChrome";
import { LIFT_EASE } from "../components/Chat";

// "At the lowest part of the screen" tolerance — how close to the tail the user
// must be for the conversation to ride the message box.
const AT_BOTTOM_SLOP = 80;

/**
 * Keyboard + suggestions-sheet lift for a chat surface, modelled on how a native
 * mobile chat handles the keyboard:
 *
 * - AT THE TAIL → the view stays bottom-anchored: as the scroll area shrinks
 *   (keyboard in, sheet open) the latest messages ride up with the message box.
 * - SCROLLED UP → reading history: scroll position is untouched; the keyboard or
 *   sheet simply covers the lower part of the conversation.
 *
 * Three things this has to get right, each learned from a way it broke:
 * 1. Only a SHRINK needs handling. When the area grows again (keyboard/sheet
 *    dismissed) the browser clamps scrollTop to the smaller maximum by itself,
 *    which keeps a tail-anchored view anchored — and leaves a scrolled-up reader
 *    alone. Pinning on growth can only move someone who didn't ask to move.
 * 2. "Was the user at the tail?" is judged from geometry as it was BEFORE the
 *    lift. Effects run after the DOM applies the new inset, so the shrink has to
 *    be added back (`clientHeight + shrink`) — measuring raw reports a false
 *    "not at bottom" and the chat gets left behind. Scroll events can't be used
 *    for this either: a hidden or backgrounded tab dispatches none, so a cached
 *    flag goes stale exactly when it is consulted.
 * 3. The tail is held for the duration of the motion, not snapped once: at the
 *    start of a shrink there is no scroll room yet (a one-shot scroll clamps and
 *    nothing moves), and the room appears frame by frame as the inset animates.
 *
 * Desktop: focusing the input slides the MockKeyboard sim in; kbLift raises the
 * bottom chrome by its height (minus the gesture-nav strip it replaces).
 * Real phone: the page shell hugs the visual viewport ([persona]/page.tsx
 * vvShell), so kbLift stays 0 and the same rule rides the native keyboard's
 * height delta instead.
 *
 * Consumers apply `bottom: chatLift` (transition `bottom ${LIFT_EASE}`) to the
 * chat scroll container and translate their bottom chrome by -kbLift.
 */
export function useChatLift({
  isMobile,
  scrollRef,
  sheetLift,
  tailBottom,
}: {
  isMobile: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  /** Extra lift while the suggestions sheet is open (list height + wrapper pad), else 0. */
  sheetLift: number;
  /**
   * Bottom edge of the REAL conversation tail in content coordinates (include any clearance
   * the tail should keep above the message box). Anchor-scrolling inflates the column with
   * phantom minHeight, so scrollHeight overstates where the content ends — without this the
   * pin drags a short chat up into the empty space and everything leaves the screen.
   * Defaults to scrollHeight.
   */
  tailBottom?: () => number | null;
}) {
  const [kbFocused, setKbFocused] = useState(false);

  // Where the tail actually is: the caller's measurement when given, else scrollHeight.
  const effectiveBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return 0;
    const real = tailBottom?.();
    return real != null ? Math.min(real, el.scrollHeight) : el.scrollHeight;
  }, [scrollRef, tailBottom]);

  // Hold scrollTop at max while the container's inset animates, so the tail stays
  // glued to the rising message box. The inset transition supplies the motion;
  // each snap just consumes the scroll room the transition has opened.
  const pinRafRef = useRef<number | null>(null);
  const pinEndRef = useRef<number | null>(null);
  const pinToBottomThrough = useCallback((ms: number) => {
    const el = scrollRef.current;
    if (!el) return;
    // Reveal the tail only — never yank the view further down than the real content needs,
    // and never move at all when the tail already fits in the shrunk viewport.
    const snap = () => {
      const target = effectiveBottom() - el.clientHeight;
      if (el.scrollTop < target) el.scrollTop = target;
    };
    snap(); // whatever room already exists
    if (pinRafRef.current != null) cancelAnimationFrame(pinRafRef.current);
    const t0 = performance.now();
    const tick = () => {
      snap();
      pinRafRef.current = performance.now() - t0 < ms ? requestAnimationFrame(tick) : null;
    };
    pinRafRef.current = requestAnimationFrame(tick);
    // Frames are paused in a hidden/backgrounded tab and throttled under low
    // power, so guarantee the end state with a timer too — otherwise the chat can
    // be left stranded mid-lift when the tab comes back.
    if (pinEndRef.current != null) clearTimeout(pinEndRef.current);
    pinEndRef.current = window.setTimeout(snap, ms);
  }, [scrollRef, effectiveBottom]);
  useEffect(() => () => {
    if (pinRafRef.current != null) cancelAnimationFrame(pinRafRef.current);
    if (pinEndRef.current != null) clearTimeout(pinEndRef.current);
  }, []);

  // Was the user parked at the tail when they triggered the lift? Consumers call
  // noteWillLift() from the interaction itself (sheet toggle, input focus), which
  // is the only moment the pre-lift geometry is knowable for certain: by the time
  // the effect runs, the inset may or may not have been applied yet, and guessing
  // either way strands the chat in one case or yanks a history reader in the other.
  const pendingTailRef = useRef<boolean | null>(null);
  const noteWillLift = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    pendingTailRef.current = el.scrollTop + el.clientHeight >= effectiveBottom() - AT_BOTTOM_SLOP;
  }, [scrollRef, effectiveBottom]);

  /** Ride the shrink only if the user was parked at the tail before it landed. */
  const rideShrink = useCallback((shrink: number, ms: number) => {
    const el = scrollRef.current;
    if (!el || shrink <= 0) return;
    const noted = pendingTailRef.current;
    pendingTailRef.current = null;
    // No note means the lift came from outside an interaction (a native keyboard
    // resize): fall back to live geometry, adding back a shrink the DOM has
    // already applied.
    const wasAtTail = noted ?? (el.scrollTop + el.clientHeight + shrink >= effectiveBottom() - AT_BOTTOM_SLOP);
    if (wasAtTail) pinToBottomThrough(ms);
  }, [scrollRef, pinToBottomThrough, effectiveBottom]);

  // Native keyboard (phone): the shell tracks the visual viewport 1:1.
  useEffect(() => {
    if (!isMobile) return;
    const vv = window.visualViewport;
    if (!vv) return;
    let prevH = vv.height;
    const update = () => {
      const shrink = prevH - vv.height;
      prevH = vv.height;
      rideShrink(shrink, 180);
    };
    vv.addEventListener("resize", update);
    return () => vv.removeEventListener("resize", update);
  }, [isMobile, rideShrink]);

  // The keyboard and the sheet occupy the SAME strip — the sheet replaces the
  // keyboard, it never stacks on it. So the sheet suppresses the keyboard lift
  // outright and the two combine with max(), not a sum. This is what makes the
  // swap seamless: it does not matter whether the blur or the sheet-open state
  // lands first, both orderings render the same 266px lift. (Summing them let the
  // two briefly stack at 532px between commits, which the eye caught as a scroll
  // jiggle when tapping the button with the keyboard up.)
  const keyboardVisible = !isMobile && kbFocused && sheetLift === 0;
  const kbLift = keyboardVisible ? MOCK_KEYBOARD_HEIGHT - BOTTOM_INSET : 0;
  const chatLift = Math.max(kbLift, sheetLift);

  // Ride the shrink through the inset transition (plus a settle margin).
  const prevChatLiftRef = useRef(0);
  useEffect(() => {
    const shrink = chatLift - prevChatLiftRef.current;
    prevChatLiftRef.current = chatLift;
    rideShrink(shrink, 400);
  }, [chatLift, rideShrink]);

  return { kbFocused, setKbFocused, keyboardVisible, kbLift, chatLift, noteWillLift, ease: LIFT_EASE };
}
