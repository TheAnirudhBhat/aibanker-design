"use client";

import { BG_SECONDARY, OUTLINE_BOLD, TEXT_SECONDARY } from "../lib/colors";
import { ELEVATION_CARD } from "../lib/elevation";

type Props = {
  visible: boolean;
  onClick: () => void;
  bottom: number;
};

export default function JumpToRecentPill({ visible, onClick, bottom }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute z-[11] flex items-center justify-center rounded-full active:scale-95"
      style={{
        bottom,
        // Horizontally centred on the screen (marginLeft offset keeps the active:scale transform intact).
        left: "50%",
        marginLeft: -22,
        width: 44,
        height: 44,
        backgroundColor: BG_SECONDARY,
        border: `1px solid ${OUTLINE_BOLD}`,
        boxShadow: ELEVATION_CARD,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 200ms ease, bottom 300ms ease",
      }}
      aria-label="Jump to most recent"
    >
      <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 3v10M4 9l4 4 4-4"
          stroke={TEXT_SECONDARY}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
