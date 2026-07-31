"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// Phone-screen-scoped portal target for snackbars/toasts.
//
// Why this exists: snackbars used to render `position: absolute` inside the
// chat scroll container, so they scrolled with content (looked broken when
// fired mid-scroll). Hard-coded `bottom: Xpx` offsets also drifted whenever a
// caller forgot to bump them past an input bar / button group.
//
// New contract:
//   1. Each phone screen wraps its root in <SnackbarSlotProvider>.
//   2. The screen drops a single <SnackbarSlotTarget /> inside its bottom dock
//      (the positioned element that rides the keyboard lift). The slot anchors
//      itself to that dock's bottom edge, so the toast rides whatever lift the
//      dock rides.
//   3. SnackbarHost portals into the slot.
//
// Geometry is canon 1115:15362: the toast FLOATS 44px off the frame bottom
// with 16px side margins, overlaying the message box — it does not stack
// above the bottom chrome in flow.

const SnackbarSlotContext = createContext<HTMLDivElement | null>(null);

export function SnackbarSlotProvider({ children }: { children: ReactNode }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  return (
    <SnackbarSlotContext.Provider value={el}>
      <SnackbarSlotContextSetter setEl={setEl}>{children}</SnackbarSlotContextSetter>
    </SnackbarSlotContext.Provider>
  );
}

// Internal: the provider exposes a setter so <SnackbarSlotTarget /> can
// register itself once mounted. We don't expose the setter via the public
// context because callers should never set this manually.
const SnackbarSlotSetterContext = createContext<((el: HTMLDivElement | null) => void) | null>(null);

function SnackbarSlotContextSetter({
  setEl,
  children,
}: {
  setEl: (el: HTMLDivElement | null) => void;
  children: ReactNode;
}) {
  return (
    <SnackbarSlotSetterContext.Provider value={setEl}>{children}</SnackbarSlotSetterContext.Provider>
  );
}

export function SnackbarSlotTarget() {
  const setEl = useContext(SnackbarSlotSetterContext);
  return (
    <div
      ref={(node) => setEl?.(node)}
      data-snackbar-slot=""
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 44,
        padding: "0 16px",
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 10,
      }}
    />
  );
}

export function useSnackbarSlot(): HTMLDivElement | null {
  return useContext(SnackbarSlotContext);
}
