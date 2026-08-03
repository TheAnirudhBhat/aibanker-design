"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { isPhoneViewport } from "../hooks/useProtoMobile";
import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY, TEXT_DISABLED, TEXT_ON_COLOR_PRIMARY,
  VALENTINO_500, MAIN_PRIMARY_SUBTLE, EXT_TEXT_MAIN,
  OUTLINE_BOLD, BG_SHEET, BG_SECONDARY, BG_SURFACE_2, BG_DISABLED, BG_OVERLAY,
} from "../lib/colors";
import { RADIUS_L, RADIUS_M, RADIUS_CIRCLE } from "../lib/radii";
import { SPACE_XS, SPACE_M, SPACE_L, SPACE_XL } from "../lib/spacing";
import { BOTTOM_INSET } from "./AppChrome";
import { useOverlaySlot } from "./OverlaySlot";

// "Why did you choose this rating?" — the dislike-feedback bottom sheet (canon 1092:14677 rest,
// 1115:15106 selected; spacing re-matched to the 2026-07-31 canon update). Grabber → 20/24
// Medium title → 24 → single-select reason chips (32px pills, 8px column gap, 16px row gap)
// → 32 → the slate free-text box → 24 → Submit, disabled until a reason is picked (SLATE_50 +
// 30% label → V-500 + white). Dismisses via scrim tap; carries the Primary action only (no
// cancel), per the bottom-sheet rule.

const REASONS = ["Inaccurate", "Didn't answer", "Numbers are wrong", "Off topic", "Other"];

const ENTER_MS = 300;

export default function FeedbackSheet({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState("");

  // Phone: focusing the textarea makes the page shell SNAP short in the same commit (the
  // anti-pan strategy in [persona]/page.tsx), which teleported this bottom-anchored sheet
  // up by the keyboard inset in one frame (IMG_3292). Counter the snap with an equal
  // translateY in that same commit, then release it, so the sheet rides up in sync with
  // the keyboard instead of jumping ahead of it.
  const [kbRide, setKbRide] = useState(0);
  const [rideSnap, setRideSnap] = useState(false);
  const rideRaf = useRef(0);
  useEffect(() => () => cancelAnimationFrame(rideRaf.current), []);
  const rideKeyboardIn = () => {
    if (!isPhoneViewport() || !window.__protoKbInset) return;
    setRideSnap(true);
    setKbRide(window.__protoKbInset);
    rideRaf.current = requestAnimationFrame(() => {
      rideRaf.current = requestAnimationFrame(() => {
        setRideSnap(false);
        setKbRide(0);
      });
    });
  };

  // Closing while the keyboard is up: drop the keyboard WITH the sheet and restore the
  // shell now (the sanctioned instant path), so whatever follows — the thank-you toast —
  // mounts on settled geometry instead of teleporting down the re-growing page.
  const releaseKeyboard = () => {
    if (!isPhoneViewport()) return;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.dispatchEvent(new Event("proto:kb:handoff"));
  };

  // Enter: mount off-screen, then slide up. Exit: slide down, then unmount.
  useEffect(() => {
    if (open) {
      setReason(null);
      setNote("");
      setMounted(true);
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => setVisible(true)); });
      return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
    }
    setVisible(false);
    const t = window.setTimeout(() => setMounted(false), ENTER_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  const slot = useOverlaySlot();
  if (!mounted) return null;

  const sheet = (
    <div className="absolute inset-0" style={{ pointerEvents: "auto" }}>
      {/* Scrim — tap to dismiss (the sheet has no cancel). */}
      <button
        type="button"
        aria-label="Close feedback"
        onClick={() => {
          releaseKeyboard();
          onClose();
        }}
        className="absolute inset-0"
        style={{
          backgroundColor: BG_OVERLAY,
          border: "none",
          padding: 0,
          cursor: "default",
          opacity: visible ? 1 : 0,
          transition: `opacity 250ms ease`,
        }}
      />
      <div
        className="absolute left-0 right-0 bottom-0"
        style={{
          backgroundColor: BG_SHEET,
          borderTopLeftRadius: RADIUS_L,
          borderTopRightRadius: RADIUS_L,
          paddingBottom: BOTTOM_INSET,
          transform: visible ? `translateY(${kbRide}px)` : "translateY(100%)",
          transition: rideSnap ? "none" : `transform ${ENTER_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        }}
      >
        {/* Grabber (canon: 44×4, 8px from the top; #E7E7E7 ≈ OUTLINE_BOLD on white, themed for dark) */}
        <div className="flex justify-center" style={{ paddingTop: SPACE_XS, paddingBottom: SPACE_XS }}>
          <div style={{ width: 44, height: 4, borderRadius: 4, backgroundColor: OUTLINE_BOLD }} />
        </div>

        <div style={{ padding: `${SPACE_M}px ${SPACE_L}px 0` }}>
          {/* Canon indents the title 4px past the chips column (28px from the sheet edge). */}
          <p style={{ ...typography.headerH3, color: TEXT_PRIMARY, margin: "0 4px" }}>Why did you choose this rating?</p>

          {/* Reason chips — single select. */}
          <div className="flex flex-wrap" style={{ marginTop: SPACE_L, columnGap: 8, rowGap: SPACE_M }}>
            {REASONS.map((r) => {
              const selected = reason === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(selected ? null : r)}
                  aria-pressed={selected}
                  className="transition-colors active:scale-[0.97]"
                  style={{
                    height: 32,
                    padding: "0 16px",
                    borderRadius: RADIUS_CIRCLE,
                    border: `1px solid ${selected ? VALENTINO_500 : OUTLINE_BOLD}`,
                    // Selected: V-50 pill ↔ V-950 in dark; label V-500 ↔ V-400 (canon shows
                    // V-600 in light — EXT_TEXT_MAIN is the nearest THEMED main-text token).
                    backgroundColor: selected ? MAIN_PRIMARY_SUBTLE : BG_SHEET,
                    ...typography.buttonSmall,
                    color: selected ? EXT_TEXT_MAIN : TEXT_PRIMARY,
                    cursor: "pointer",
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>

          {/* Free text (canon: slate box, r16, 92 tall) */}
          <textarea
            value={note}
            onFocus={rideKeyboardIn}
            onChange={(e) => {
              setNote(e.target.value);
              // Typing without picking a reason counts as "Other" — selects it and arms Submit.
              if (!reason && e.target.value) setReason("Other");
            }}
            placeholder="Provide additional feedback"
            rows={3}
            className="block w-full resize-none outline-none"
            style={{
              marginTop: SPACE_XL,
              height: 92,
              padding: "12px 16px",
              borderRadius: RADIUS_M,
              // Canon SLATE_10 well + SLATE_30 hairline — themed (Slate 900/800 in dark).
              backgroundColor: BG_SECONDARY,
              border: `1px solid ${BG_SURFACE_2}`,
              ...typography.bodySmall,
              color: TEXT_PRIMARY,
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Submit — enabled only once a reason is picked. */}
        <div style={{ padding: `${SPACE_L}px ${SPACE_L}px 0` }}>
          <button
            type="button"
            disabled={!reason}
            onClick={() => {
              if (!reason) return;
              releaseKeyboard();
              onSubmit();
            }}
            className="w-full transition-transform active:scale-[0.98]"
            style={{
              height: 48,
              borderRadius: RADIUS_CIRCLE,
              border: "none",
              backgroundColor: reason ? VALENTINO_500 : BG_DISABLED,
              ...typography.buttonNormal,
              color: reason ? TEXT_ON_COLOR_PRIMARY : TEXT_DISABLED,
              cursor: reason ? "pointer" : "default",
              transition: "background-color 180ms ease, color 180ms ease",
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );

  // Dock to the phone frame when the screen provides an overlay slot; otherwise render in place
  // (legacy fallback, same contract as SnackbarHost).
  return slot ? createPortal(sheet, slot) : sheet;
}
