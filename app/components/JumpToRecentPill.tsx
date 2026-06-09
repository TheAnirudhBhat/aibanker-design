"use client";

import { BG_PRIMARY, OUTLINE_SUBTLE, TEXT_TERTIARY } from "../lib/colors";
import { SPACE_L } from "../lib/spacing";
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
        right: SPACE_L,
        width: 36,
        height: 36,
        backgroundColor: BG_PRIMARY,
        border: `1px solid ${OUTLINE_SUBTLE}`,
        boxShadow: ELEVATION_CARD,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 200ms ease, bottom 300ms ease",
      }}
      aria-label="Jump to most recent"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 3v10M4 9l4 4 4-4"
          stroke={TEXT_TERTIARY}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
