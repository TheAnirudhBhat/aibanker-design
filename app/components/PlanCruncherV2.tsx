"use client";

import { useState, useEffect } from "react";
import { typography } from "../lib/typography";
import {
  BG_CARD,
  BG_DISABLED,
  OUTLINE_SUBTLE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  TEXT_ON_COLOR_PRIMARY,
  BG_SECONDARY,
  MAIN_PRIMARY_SUBTLE,
  VALENTINO_500,
} from "../lib/colors";
import { RADIUS_M } from "../lib/radii";
import { useTheme } from "../lib/theme";

export type PlanSummaryItem = {
  label: string;
  value?: string;
};

export type PlanCruncherV2Props = {
  goalName: string;
  visible: boolean;
  statusText?: string;
  completed?: boolean;
  completedSubtitle?: string;
  planSummary?: PlanSummaryItem[];
  celebratoryText?: string;
  // When provided, renders a dismiss (X) affordance while crunching. Dismissing
  // hides the card; the caller is responsible for keeping the work running.
  onDismiss?: () => void;
};

/* ── Inline keyframes ── */

const spinKeyframes = `@keyframes _planCruncherSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;

/* ── Completion mark — spinning ring that morphs into a filled check ── */

// Two layers cross-fade on `completed`: the spinning Valentino arc fades + shrinks away while the
// filled disc pops in (slight overshoot) and the check strokes on. Staged + eased so the change
// reads smooth, not a jerky swap.
const CHECK_LEN = 16; // ~length of the check path, drives the draw-on

function CompletionMark({ completed = false, size = 22 }: { completed?: boolean; size?: number }) {
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div style={{ width: size, height: size, flexShrink: 0, position: "relative" }}>
      <style dangerouslySetInnerHTML={{ __html: spinKeyframes }} />

      {/* Crunching: spinning Valentino arc. On completion it fades + shrinks away. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: completed ? 0 : 1,
          transform: completed ? "scale(0.7)" : "scale(1)",
          transition: "opacity 180ms ease, transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div style={{ width: size, height: size, animation: completed ? "none" : "_planCruncherSpin 1s linear infinite" }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={BG_DISABLED} strokeWidth={strokeWidth} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={VALENTINO_500}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={circumference * 0.7}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Done: the filled Valentino disc pops in, then the check draws on. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: completed ? 1 : 0,
          transform: completed ? "scale(1)" : "scale(0.6)",
          transition: "opacity 200ms ease 60ms, transform 340ms cubic-bezier(0.34, 1.56, 0.64, 1) 60ms",
        }}
      >
        <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="11" fill={VALENTINO_500} />
          <path
            d="M6 11.5L9.5 15L16 8"
            stroke={TEXT_ON_COLOR_PRIMARY}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={CHECK_LEN}
            strokeDashoffset={completed ? 0 : CHECK_LEN}
            style={{ transition: "stroke-dashoffset 300ms cubic-bezier(0.22, 1, 0.36, 1) 220ms" }}
          />
        </svg>
      </div>
    </div>
  );
}

/* ── Main Component ── */

export default function PlanCruncherV2({
  goalName,
  visible,
  statusText,
  completed = false,
  completedSubtitle,
  planSummary,
  celebratoryText,
  onDismiss,
}: PlanCruncherV2Props) {
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { mode } = useTheme();
  const isDark = mode === "dark";

  useEffect(() => {
    if (visible && !mounted) {
      const t = setTimeout(() => setMounted(true), 80);
      return () => clearTimeout(t);
    }
    if (!visible) {
      setMounted(false);
    }
  }, [visible, mounted]);

  if (!visible) return null;

  // The card is only expandable (chevron + tap) when there's a plan summary to reveal.
  const expandable = completed && !!planSummary && planSummary.length > 0;

  return (
    <div
      className={`plan-cruncher-entrance${mounted ? " plan-cruncher-entered" : ""}`}
      style={{
        borderRadius: RADIUS_M,
        // Dark: BG_CARD is translucent (white 5%), which lets the chat show through this floating
        // card — use the opaque lifted surface (BG_SECONDARY) instead. Light keeps the white card.
        backgroundColor: isDark ? BG_SECONDARY : BG_CARD,
        border: `1px solid ${OUTLINE_SUBTLE}`,
        boxShadow: "0px 6px 8px 0px rgba(0,0,0,0.05)",
        overflow: "hidden",
        cursor: expandable ? "pointer" : "default",
      }}
      onClick={() => expandable && setExpanded((prev) => !prev)}
    >
      {/* Compact header */}
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CompletionMark completed={completed} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>
              {goalName}
            </div>

            {!completed && statusText && (
              <div style={{ ...typography.caption, color: TEXT_TERTIARY, marginTop: 2 }}>
                {statusText}
              </div>
            )}

            {completed && completedSubtitle && (
              <div style={{ ...typography.caption, color: TEXT_TERTIARY, marginTop: 2 }}>
                {completedSubtitle}
              </div>
            )}
          </div>

          {expandable && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 200ms ease",
                flexShrink: 0,
              }}
            >
              <path d="M4 6L8 10L12 6" stroke={TEXT_TERTIARY} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}

          {onDismiss && (
            <button
              type="button"
              aria-label="Dismiss"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="flex items-center justify-center shrink-0 transition-transform active:scale-[0.9]"
              style={{ width: 24, height: 24, border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke={TEXT_TERTIARY} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded area - tray color as background, white list on top */}
      <div
        style={{
          maxHeight: expanded ? 500 : 0,
          opacity: expanded ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 280ms ease-out, opacity 180ms ease-out",
          backgroundColor: celebratoryText ? MAIN_PRIMARY_SUBTLE : BG_CARD,
        }}
      >
        {/* White list area with rounded bottom corners - reveals tray behind */}
        <div
          style={{
            backgroundColor: BG_CARD,
            borderRadius: "0 0 16px 16px",
            padding: "0 14px",
          }}
        >
          {planSummary?.map((item, i) => (
            <div
              key={item.label}
              style={{
                padding: "12px 0",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                borderTop: `1px solid ${OUTLINE_SUBTLE}`,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  backgroundColor: BG_DISABLED,
                  color: TEXT_TERTIARY,
                  ...typography.caption,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <span style={{ ...typography.bodySmall, color: TEXT_SECONDARY }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Celebratory text - sits in the exposed tray area */}
        {celebratoryText && (
          <div style={{ padding: "8px 14px", textAlign: "center" }}>
            <span style={{ ...typography.caption, color: TEXT_SECONDARY }}>
              {celebratoryText}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
