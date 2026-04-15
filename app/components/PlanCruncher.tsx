"use client";

import { useState, useEffect } from "react";
import { typography } from "../lib/typography";
import {
  BG_SURFACE,
  BG_SURFACE_2,
  MAIN_PRIMARY,
  MAIN_PRIMARY_SUBTLE,
  OUTLINE_SUBTLE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from "../lib/colors";

export type PlanSummaryItem = {
  label: string;
  value?: string;
};

export type PlanCruncherProps = {
  goalName: string;
  visible: boolean;
  /** Current status text — controlled by the parent */
  statusText?: string;
  /** When true, show the completed compact state */
  completed?: boolean;
  /** Subtitle shown in completed state */
  completedSubtitle?: string;
  /** Items shown when expanded */
  planSummary?: PlanSummaryItem[];
};

export default function PlanCruncher({
  goalName,
  visible,
  statusText,
  completed = false,
  completedSubtitle,
  planSummary,
}: PlanCruncherProps) {
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
        borderRadius: 16,
        backgroundColor: BG_SURFACE,
        border: `1px solid ${OUTLINE_SUBTLE}`,
        boxShadow: "0px 2px 32px 0px rgba(0,0,0,0.05)",
        overflow: "hidden",
        cursor: completed ? "pointer" : "default",
      }}
      onClick={() => completed && setExpanded((prev) => !prev)}
    >
      {/* ── Compact card — always visible ── */}
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>
              {goalName}
            </div>

            {/* Crunching: parent-controlled status with shimmer */}
            {!completed && statusText && (
              <div style={{ ...typography.caption, color: TEXT_TERTIARY, marginTop: 2 }}>
                <span className="plan-cruncher-shimmer-text">{statusText}</span>
              </div>
            )}

            {/* Completed subtitle */}
            {completed && completedSubtitle && (
              <div style={{ ...typography.caption, color: TEXT_TERTIARY, marginTop: 2 }}>
                {completedSubtitle}
              </div>
            )}
          </div>

          {/* Chevron — only when completed */}
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
              <path d="M4 6L8 10L12 6" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      {/* ── Expanded list — slides open below the compact card ── */}
      <div
        style={{
          maxHeight: expanded ? 500 : 0,
          opacity: expanded ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 280ms ease-out, opacity 180ms ease-out",
        }}
      >
        <div style={{ borderTop: `1px solid ${BG_SURFACE_2}`, padding: "8px 14px 12px" }}>
          {planSummary?.map((item, i) => {
            const isLast = i === (planSummary?.length ?? 0) - 1;
            return (
              <div
                key={item.label}
                style={{
                  padding: "8px 0",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                {!isLast ? (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: MAIN_PRIMARY_SUBTLE,
                      color: MAIN_PRIMARY,
                      ...typography.caption,
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {i + 1}
                  </div>
                ) : (
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  />
                )}
                <span style={{ ...typography.bodySmall, color: isLast ? TEXT_SECONDARY : TEXT_PRIMARY }}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
