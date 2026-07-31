"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Snackbar, { type SnackbarVariant } from "./Snackbar";
import { BOTTOM_INSET } from "./AppChrome";
import { SPACE_M } from "../lib/spacing";
import { useSnackbarSlot } from "./SnackbarSlot";

// Behavior layer for Snackbar: enter/exit animation, auto-dismiss timer, bottom-center positioning.
// Enters and exits by sliding through the screen's bottom edge at full opacity (no fade) — the
// travel covers the toast's own height plus the 44px float gap so it clears the screen entirely.

const ENTER_MS = 250;
const EXIT_MS = 260;
const ENTER_EASING = "cubic-bezier(0, 0, 0.2, 1)";
const EXIT_EASING = "cubic-bezier(0.4, 0, 1, 1)";
const OFFSCREEN = "translateY(calc(100% + 44px))";
const DEFAULT_DURATION = 4000;
// Swipe-to-dismiss: movement under the slop is a tap; past the threshold the toast is flung.
const DRAG_SLOP = 4;
const DRAG_DISMISS_PX = 24;

type SnackbarHostProps = {
  open: boolean;
  onClose: () => void;
  variant?: SnackbarVariant;
  icon?: ReactNode;
  text: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
  /** px from screen bottom. Default: 16px above the gesture nav indicator. Pass a larger value when sitting above a footer. */
  bottomOffset?: number;
  /** Informational toasts that CARRY an action (e.g. Dismiss) but should still time out on their own. */
  autoDismissWithAction?: boolean;
};

const DEFAULT_BOTTOM_OFFSET = BOTTOM_INSET + SPACE_M;

export default function SnackbarHost({
  open,
  onClose,
  variant,
  icon,
  text,
  action,
  duration = DEFAULT_DURATION,
  bottomOffset = DEFAULT_BOTTOM_OFFSET,
  autoDismissWithAction = false,
}: SnackbarHostProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  // Downward drag offset while the user is swiping the toast away; null when not dragging.
  const [dragY, setDragY] = useState<number | null>(null);
  const dragRef = useRef<{ id: number; startY: number } | null>(null);
  const renderKeyRef = useRef(0);

  // Freeze the content once closing starts: callers typically null their snackbar state to
  // close it, which would blank the text mid-slide-out otherwise.
  const frozenRef = useRef({ variant, icon, text, action });
  if (open) frozenRef.current = { variant, icon, text, action };
  const shown = open ? { variant, icon, text, action } : frozenRef.current;

  // Bump render key when text/variant change while open so the new content
  // replaces the old one (per "no stacking" rule: second snackbar replaces first).
  useEffect(() => {
    if (open) renderKeyRef.current += 1;
  }, [text, variant, open]);

  // Mount, then on the next paint flip visible so the browser sees a real
  // "off-screen" frame before transitioning in.
  useEffect(() => {
    if (open) {
      setMounted(true);
      setDragY(null);
      dragRef.current = null;
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), EXIT_MS);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Auto-dismiss timer (only when there's no action, unless explicitly opted in). A drag in
  // progress restarts it, so the toast never slips away under the user's finger.
  useEffect(() => {
    if (!open || dragY !== null || (action && !autoDismissWithAction)) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [open, dragY, action, autoDismissWithAction, duration, onClose, text, variant]);

  // Portal target — when a screen provides a SnackbarSlot the snackbar lives
  // there (naturally positioned above any bottom chrome via flex layout). When
  // no slot exists we fall back to the legacy absolute-positioned behavior so
  // existing standalone callers keep working.
  const slotEl = useSnackbarSlot();

  if (!mounted) return null;

  const handleAction = shown.action
    ? () => {
        shown.action!.onClick();
        onClose();
      }
    : undefined;

  // Swipe-to-dismiss: past the threshold the exit transition takes over from the dragged
  // offset; short of it the toast springs back. A small slop keeps taps (Dismiss) intact.
  const endDrag = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.id) return;
    dragRef.current = null;
    if (dragY !== null && dragY > DRAG_DISMISS_PX) onClose();
    else setDragY(null);
  };
  const dragging = dragRef.current !== null && dragY !== null;

  const animatedSnackbar = (
    <div
      key={renderKeyRef.current}
      onPointerDown={(e) => {
        dragRef.current = { id: e.pointerId, startY: e.clientY };
      }}
      onPointerMove={(e) => {
        const d = dragRef.current;
        if (!d || e.pointerId !== d.id) return;
        const dy = e.clientY - d.startY;
        if (dragY === null && Math.abs(dy) < DRAG_SLOP) return;
        if (dragY === null) {
          try {
            (e.currentTarget as HTMLElement).setPointerCapture(d.id);
          } catch {}
        }
        setDragY(dy < 0 ? dy * 0.2 : dy); // upward drags rubber-band
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{
        pointerEvents: "auto",
        touchAction: "none",
        width: "100%",
        transform: !visible
          ? OFFSCREEN
          : dragY !== null
            ? `translateY(${dragY}px)`
            : "translateY(0)",
        transition: dragging
          ? "none"
          : visible
            ? `transform ${ENTER_MS}ms ${ENTER_EASING}`
            : `transform ${EXIT_MS}ms ${EXIT_EASING}`,
      }}
    >
      <Snackbar
        variant={shown.variant}
        icon={shown.icon}
        text={shown.text}
        action={handleAction ? { label: shown.action!.label, onClick: handleAction } : undefined}
      />
    </div>
  );

  if (slotEl) {
    return createPortal(animatedSnackbar, slotEl);
  }

  // Legacy fallback: no slot provided. Keep the old absolute-positioned
  // behavior so callers that haven't migrated still render somewhere sensible.
  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: bottomOffset,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      {animatedSnackbar}
    </div>
  );
}
