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
  MAIN_PRIMARY_SUBTLE,
  VALENTINO_500,
  ALPHA_BLACK_30,
} from "../lib/colors";
import { RADIUS_M } from "../lib/radii";

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

/* ── Spinning loader - branded Valentino ring ── */

function Spinner({ size = 22 }: { size?: number }) {
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: spinKeyframes }} />
      <div
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          animation: "_planCruncherSpin 1s linear infinite",
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={BG_DISABLED}
            strokeWidth={strokeWidth}
          />
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
    </>
  );
}

/* ── Static ring - spinner stops, shows full valentino ring ── */

function StaticRing({ size = 22 }: { size?: number }) {
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;

  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={VALENTINO_500}
          strokeWidth={strokeWidth}
        />
      </svg>
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

  return (
    <div
      className={`plan-cruncher-entrance${mounted ? " plan-cruncher-entered" : ""}`}
      style={{
        borderRadius: RADIUS_M,
        backgroundColor: BG_CARD,
        border: `1px solid ${OUTLINE_SUBTLE}`,
        boxShadow: "0px 6px 8px 0px rgba(0,0,0,0.05)",
        overflow: "hidden",
        cursor: completed ? "pointer" : "default",
      }}
      onClick={() => completed && setExpanded((prev) => !prev)}
    >
      {/* Compact header */}
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {completed ? <StaticRing /> : <Spinner />}

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

          {completed && (
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
              <path d="M4 6L8 10L12 6" stroke={ALPHA_BLACK_30} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}

          {!completed && onDismiss && (
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
                <path d="M4 4L12 12M12 4L4 12" stroke={ALPHA_BLACK_30} strokeWidth="1.5" strokeLinecap="round" />
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
