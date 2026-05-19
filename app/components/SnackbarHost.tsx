"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Snackbar, { type SnackbarVariant } from "./Snackbar";
import { BOTTOM_INSET } from "./AppChrome";
import { SPACE_M } from "../lib/spacing";
import { useSnackbarSlot } from "./SnackbarSlot";

// Behavior layer for Snackbar: enter/exit animation, auto-dismiss timer, bottom-center positioning.
// Material Design timings: enter 250ms ease-out, exit 200ms ease-in, auto-dismiss 4000ms (no action only).

const ENTER_MS = 250;
const EXIT_MS = 200;
const ENTER_EASING = "cubic-bezier(0, 0, 0.2, 1)";
const EXIT_EASING = "cubic-bezier(0.4, 0, 1, 1)";
const DEFAULT_DURATION = 4000;

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
}: SnackbarHostProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const renderKeyRef = useRef(0);

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

  // Auto-dismiss timer (only when there's no action).
  useEffect(() => {
    if (!open || action) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [open, action, duration, onClose, text, variant]);

  // Portal target — when a screen provides a SnackbarSlot the snackbar lives
  // there (naturally positioned above any bottom chrome via flex layout). When
  // no slot exists we fall back to the legacy absolute-positioned behavior so
  // existing standalone callers keep working.
  const slotEl = useSnackbarSlot();

  if (!mounted) return null;

  const handleAction = action
    ? () => {
        action.onClick();
        onClose();
      }
    : undefined;

  const animatedSnackbar = (
    <div
      key={renderKeyRef.current}
      style={{
        pointerEvents: "auto",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: visible
          ? `opacity ${ENTER_MS}ms ${ENTER_EASING}, transform ${ENTER_MS}ms ${ENTER_EASING}`
          : `opacity ${EXIT_MS}ms ${EXIT_EASING}, transform ${EXIT_MS}ms ${EXIT_EASING}`,
      }}
    >
      <Snackbar
        variant={variant}
        icon={icon}
        text={text}
        action={handleAction ? { label: action!.label, onClick: handleAction } : undefined}
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
        left: 0,
        right: 0,
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
