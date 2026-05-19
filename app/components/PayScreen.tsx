"use client";

import { typography } from "../lib/typography";
import { ALPHA_WHITE_05, ALPHA_WHITE_90, ALPHA_WHITE_FF, VALENTINO_500 } from "../lib/colors";
import { SPACE_S, SPACE_M } from "../lib/spacing";
import { RADIUS_XL } from "../lib/radii";
import AIBankerChip from "./AIBankerChip";

// ── Pill data ────────────────────────────────────────────────
export type PillDef = { id: string; icon: string; label: string; tappable: boolean };

export const DEFAULT_PILLS: PillDef[] = [
  { id: "meet-ryan", icon: "/icons/placeholder.svg", label: "Meet Ryan", tappable: true },
  { id: "sparks", icon: "/icons/spark.svg", label: "5 new sparks", tappable: false },
  { id: "fires", icon: "/icons/fire.svg", label: "3 fires left", tappable: false },
];

// ── Sparkle icon for the first pill ──────────────────────────
function PillSparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.37348 17.51C10.063 17.51 10.6126 18.07 10.6126 18.75V18.76C10.6126 19.45 10.053 20 9.37348 20H5.57612C2.49826 20 0 17.47 0 14.34V7.58C0.00999304 4.53 2.38834 2.05 5.36627 1.93V1.24C5.36627 0.55 5.91588 0 6.58542 0C7.25495 0 7.80457 0.56 7.80457 1.24V1.92H12.2015V1.24C12.2015 0.55 12.7511 0 13.4207 0C14.0902 0 14.6398 0.56 14.6398 1.24V1.93C17.6177 2.06 19.9861 4.53 19.9861 7.58V9.39C19.9861 10.06 19.4365 10.61 18.7669 10.61C18.0974 10.61 17.5478 10.06 17.5478 9.39V7.58C17.5478 5.89 16.2687 4.53 14.6398 4.41V5.11C14.6398 5.8 14.0902 6.35 13.4207 6.35C12.7511 6.35 12.2015 5.79 12.2015 5.11V4.39H7.79457V5.11C7.79457 5.8 7.24496 6.35 6.57542 6.35C5.90589 6.35 5.35627 5.79 5.35627 5.11V4.41C3.72741 4.53 2.4383 5.9 2.4383 7.58V14.34C2.4383 16.1 3.83733 17.52 5.57612 17.52H9.37348V17.51Z"
        fill={ALPHA_WHITE_FF}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.1823 15.1301C10.9325 15.2201 10.9425 15.5501 11.1823 15.6401C13.8205 16.5901 14.8498 18.5401 15.2695 19.8001C15.3594 20.0701 15.7292 20.0701 15.8191 19.8001C16.6985 17.1601 18.7071 16.0101 19.8263 15.5501C20.0661 15.4501 20.0562 15.1101 19.8063 15.0201C17.1082 14.0201 16.1089 11.9401 15.7392 10.6801C15.6592 10.4401 15.3294 10.4501 15.2595 10.6801C14.3601 13.5601 12.3415 14.7001 11.1723 15.1201V15.1401L11.1823 15.1301Z"
        fill={ALPHA_WHITE_FF}
      />
    </svg>
  );
}

// ── PayScreen ────────────────────────────────────────────────
export default function PayScreen({
  onPillTap,
  pillLabel,
  pills = DEFAULT_PILLS,
  animate = false,
}: {
  /** Called when the tappable (first) pill is pressed */
  onPillTap?: () => void;
  /** Override label for the first pill */
  pillLabel?: string;
  /** Custom pill array - defaults to Meet Ryan / sparks / fires */
  pills?: PillDef[];
  /** Bounce the first pill */
  animate?: boolean;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Full-bleed background screenshot */}
      <img
        src="/pay-screen.png"
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none select-none"
      />

      {/* Pill row - overlays the screenshot at the pill position */}
      <div style={{ position: "absolute", top: "17%", left: 0, right: 0 }}>
        <div
          className="flex items-center overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ gap: SPACE_M, paddingLeft: SPACE_M, paddingRight: SPACE_M }}
        >
          {pills.map((pill, idx) => {
            if (idx === 0 && pill.tappable) {
              return (
                <AIBankerChip
                  key={pill.id}
                  state={animate ? "alert" : "firstTime"}
                  label={pillLabel ?? pill.label}
                  onTap={onPillTap}
                />
              );
            }
            return (
              <button
                key={pill.id}
                type="button"
                onClick={pill.tappable ? onPillTap : undefined}
                className="flex items-center shrink-0 transition-transform active:scale-[0.97]"
                style={{
                  gap: 4,
                  backgroundColor: VALENTINO_500,
                  border: `1.5px solid ${ALPHA_WHITE_05}`,
                  borderRadius: RADIUS_XL,
                  padding: "10px 16px",
                  cursor: pill.tappable ? "pointer" : "default",
                }}
              >
                <img src={pill.icon} alt="" style={{ width: 16, height: 16 }} />
                <span
                  style={{
                    ...typography.caption,
                    color: ALPHA_WHITE_90,
                    whiteSpace: "nowrap",
                  }}
                >
                  {pill.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
