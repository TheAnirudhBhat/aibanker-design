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
//   2. The screen drops a single <SnackbarSlotTarget /> at the right place in
//      its layout — typically a flex sibling that sits just above the gesture
//      nav and just above any persistent bottom chrome (input bar, button
//      group, footer). The slot inherits its on-screen position from the
//      surrounding flex/grid, so when chrome appears or disappears, the
//      snackbar moves with it automatically.
//   3. SnackbarHost portals into the slot. No hard-coded offsets.

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
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        width: "100%",
      }}
    />
  );
}

export function useSnackbarSlot(): HTMLDivElement | null {
  return useContext(SnackbarSlotContext);
}
