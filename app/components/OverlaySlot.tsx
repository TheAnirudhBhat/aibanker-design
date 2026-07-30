"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// Phone-screen-scoped portal target for full-screen overlays (scrim + bottom sheet) fired from
// components that live INSIDE the chat scroller — e.g. FeedbackBar's dislike sheet. Same contract
// as SnackbarSlot: the screen wraps its root in the provider and drops ONE <OverlaySlotTarget />
// as the last child of its root, so sheets dock to the phone frame instead of scrolling with the
// thread (position:absolute inside the scroll content was how sheets ended up mid-conversation).

const OverlaySlotContext = createContext<HTMLDivElement | null>(null);
const OverlaySlotSetterContext = createContext<((el: HTMLDivElement | null) => void) | null>(null);

export function OverlaySlotProvider({ children }: { children: ReactNode }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  return (
    <OverlaySlotContext.Provider value={el}>
      <OverlaySlotSetterContext.Provider value={setEl}>{children}</OverlaySlotSetterContext.Provider>
    </OverlaySlotContext.Provider>
  );
}

export function OverlaySlotTarget() {
  const setEl = useContext(OverlaySlotSetterContext);
  // pointer-events none so the empty slot never blocks the screen; overlays re-enable on themselves.
  return <div ref={(el) => setEl?.(el)} className="absolute inset-0 z-30" style={{ pointerEvents: "none" }} />;
}

export function useOverlaySlot() {
  return useContext(OverlaySlotContext);
}
