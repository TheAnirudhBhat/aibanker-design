"use client";

import Tooltip from "./Tooltip";

export type PayScreenState = "firstTime" | "alert" | "default";

// Kept for backward compatibility with existing callers that pass pill props.
// The pill row was removed; Ryan's entry is now the icon baked into the image.
export type PillDef = { id: string; icon: string; label: string; tappable: boolean };

// Position of the Ryan entry icon (the dashed-circle placeholder in the image),
// measured from the top-left of the 360×780 device frame.
const FRAME_WIDTH = 360;
const RYAN_ICON_CENTER_X = 260;
const RYAN_ICON_CENTER_Y = 76;
const RYAN_ICON_RADIUS = 10;
const RYAN_TAP_SIZE = 36;

// Tooltip in "top-right" orientation sits below the icon with the pointer at
// the top of the body, inset 12px from the body's right edge. The pointer
// center is therefore (12 + 6 = 18px) from the body's right edge.
const POINTER_CENTER_FROM_BODY_RIGHT = 18;
const TOOLTIP_GAP_BELOW_ICON = 8;
const TOOLTIP_RIGHT = FRAME_WIDTH - (RYAN_ICON_CENTER_X + POINTER_CENTER_FROM_BODY_RIGHT);
const TOOLTIP_TOP = RYAN_ICON_CENTER_Y + RYAN_ICON_RADIUS + TOOLTIP_GAP_BELOW_ICON;

export default function PayScreen({
  onPillTap,
  animate = false,
  state,
}: {
  /** Tap handler for Ryan's entry icon. */
  onPillTap?: () => void;
  /** Shortcut for state === "alert" (legacy). */
  animate?: boolean;
  /** Explicit state; takes precedence over `animate`. */
  state?: PayScreenState;
  /** Legacy props - no longer used (pill row was removed). */
  pillLabel?: string;
  pills?: PillDef[];
}) {
  const resolvedState: PayScreenState = state ?? (animate ? "alert" : "default");

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        src="/Current.png"
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none select-none"
      />

      <button
        type="button"
        onClick={onPillTap}
        aria-label="Open Ryan"
        style={{
          position: "absolute",
          top: RYAN_ICON_CENTER_Y - RYAN_TAP_SIZE / 2,
          left: RYAN_ICON_CENTER_X - RYAN_TAP_SIZE / 2,
          width: RYAN_TAP_SIZE,
          height: RYAN_TAP_SIZE,
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: onPillTap ? "pointer" : "default",
          zIndex: 1,
        }}
      />

      {resolvedState === "firstTime" && (
        <>
          <Tooltip
            text="Meet Ryan"
            orientation="top-right"
            style={{
              position: "absolute",
              top: TOOLTIP_TOP,
              right: TOOLTIP_RIGHT,
              zIndex: 2,
              opacity: 0,
              animation: "payscreen-tooltip-reveal 5.5s ease-out forwards",
              pointerEvents: "none",
            }}
          />
          <style jsx global>{`
            @keyframes payscreen-tooltip-reveal {
              0%   { opacity: 0; transform: translateY(-4px); }
              4%   { opacity: 1; transform: translateY(0); }
              95%  { opacity: 1; transform: translateY(0); }
              100% { opacity: 0; transform: translateY(-4px); }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
