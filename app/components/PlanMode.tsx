"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { typography } from "../lib/typography";
import {
  VALENTINO_500,
  GREEN_500,
  GREEN_50,
  BG_SURFACE,
  BG_SURFACE_2,
  OUTLINE_SUBTLE,
  TEXT_PRIMARY,
  TEXT_TERTIARY,
  TEXT_DISABLED,
  SLATE_50,
} from "../lib/colors";

// ── Types ────────────────────────────────────────────────────────────────────

export type PlanStep = {
  id: string;
  label: string;
  value?: string;
  status: "pending" | "active" | "completed";
};

export type PlanModeProps = {
  steps: PlanStep[];
  visible: boolean;
  completed: boolean;
};

// ── SVG helpers ──────────────────────────────────────────────────────────────

function ProgressRing({
  progress,
  completed,
  size = 24,
}: {
  progress: number;
  completed: boolean;
  size?: number;
}) {
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  const color = completed ? GREEN_500 : VALENTINO_500;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={BG_SURFACE_2}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 500ms ease-out, stroke 300ms ease" }}
      />
    </svg>
  );
}

function CheckIcon({ size = 14, color = GREEN_500 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M3 8.5L6.5 12L13 4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CompletedCheckIcon({ size = 24 }: { size?: number }) {
  return (
    <div
      className="plan-builder-check-pop"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: GREEN_500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <CheckIcon size={14} color="#fff" />
    </div>
  );
}

function ChevronDown({ expanded }: { expanded: boolean }) {
  return (
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
      <path
        d="M4 6L8 10L12 6"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PulsingDot() {
  return (
    <span
      className="plan-builder-pulse"
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: VALENTINO_500,
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

// ── Celebration particles ────────────────────────────────────────────────────

function CelebrationParticles({ active }: { active: boolean }) {
  if (!active) return null;

  const particles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * 360;
    const colors = [VALENTINO_500, GREEN_500, "#FFD700", "#FF6B6B", VALENTINO_500, GREEN_500, "#5B9BD5", "#FF9A17"];
    return (
      <span
        key={i}
        className="plan-builder-particle"
        style={{
          position: "absolute",
          width: 5,
          height: 5,
          borderRadius: "50%",
          backgroundColor: colors[i],
          left: "50%",
          top: "50%",
          // @ts-expect-error CSS custom property
          "--particle-angle": `${angle}deg`,
          animationDelay: `${i * 30}ms`,
        }}
      />
    );
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      {particles}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function PlanMode({ steps, visible, completed }: PlanModeProps) {
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const prevCompletedRef = useRef(completed);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && !mounted) {
      const timer = setTimeout(() => setMounted(true), 100);
      return () => clearTimeout(timer);
    }
    if (!visible) setMounted(false);
  }, [visible, mounted]);

  useEffect(() => {
    if (completed && !prevCompletedRef.current) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 1200);
      return () => clearTimeout(timer);
    }
    prevCompletedRef.current = completed;
  }, [completed]);

  const handleBackdropClick = useCallback(() => {
    setExpanded(false);
  }, []);

  if (!visible) return null;

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const totalCount = steps.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const latestCompleted = [...steps].reverse().find((s) => s.status === "completed");
  const pillText = completed
    ? "Your plan is ready"
    : latestCompleted
      ? `${latestCompleted.label}: ${latestCompleted.value}`
      : "Building your plan...";

  return (
      <div
        ref={containerRef}
        className={`plan-builder-entrance${mounted ? " plan-builder-entered" : ""}`}
        style={{
          position: "relative",
          zIndex: 20,
          padding: "0 16px",
          marginTop: 4,
        }}
      >
        {/* Backdrop when expanded — covers the chat area below */}
        {expanded && (
          <div
            className="plan-builder-backdrop"
            style={{
              position: "absolute",
              top: 0,
              left: -16,
              right: -16,
              height: "100vh",
              backgroundColor: "rgba(0,0,0,0.15)",
              zIndex: -1,
            }}
            onClick={handleBackdropClick}
          />
        )}
        {/* Celebration particles */}
        <CelebrationParticles active={showCelebration} />

        {/* Pill (collapsed) */}
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className={showCelebration ? "plan-builder-celebrate" : ""}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            borderRadius: expanded ? "14px 14px 0 0" : 14,
            backgroundColor: completed ? GREEN_50 : BG_SURFACE,
            border: `1px solid ${completed ? GREEN_50 : OUTLINE_SUBTLE}`,
            borderBottom: expanded ? `1px solid ${BG_SURFACE_2}` : undefined,
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            transition: "background-color 300ms ease, border-color 300ms ease, border-radius 200ms ease",
          }}
        >
          {/* Progress ring or completed check */}
          {completed ? (
            <CompletedCheckIcon size={24} />
          ) : (
            <ProgressRing progress={progress} completed={false} size={24} />
          )}

          {/* Text */}
          <span
            style={{
              flex: 1,
              textAlign: "left",
              ...typography.bodySmall,
              color: completed ? GREEN_500 : TEXT_PRIMARY,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              transition: "color 300ms ease",
            }}
          >
            {pillText}
          </span>

          {/* Counter badge */}
          {!completed && (
            <span
              style={{
                ...typography.caption,
                color: TEXT_TERTIARY,
                flexShrink: 0,
              }}
            >
              {completedCount}/{totalCount}
            </span>
          )}

          {/* Chevron */}
          <ChevronDown expanded={expanded} />

          {/* Bottom progress bar */}
          {!completed && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: BG_SURFACE_2,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress * 100}%`,
                  backgroundColor: VALENTINO_500,
                  borderRadius: 1,
                  transition: "width 500ms ease-out",
                }}
              />
            </div>
          )}
        </button>

        {/* Expanded overlay */}
        <div
          className="plan-builder-expand"
          style={{
            maxHeight: expanded ? 600 : 0,
            opacity: expanded ? 1 : 0,
            overflow: "hidden",
            borderRadius: "0 0 14px 14px",
            backgroundColor: "#fff",
            border: expanded ? `1px solid ${OUTLINE_SUBTLE}` : "1px solid transparent",
            borderTop: "none",
            boxShadow: expanded ? "0 8px 24px rgba(0,0,0,0.08)" : "none",
            transition: "max-height 280ms ease-out, opacity 180ms ease-out, border-color 180ms ease, box-shadow 220ms ease",
          }}
        >
          {/* Header: X + centered title */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 14px 8px",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: BG_SURFACE_2,
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="rgba(0,0,0,0.5)" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                textAlign: "center",
                ...typography.headerH4,
                color: TEXT_PRIMARY,
                pointerEvents: "none",
              }}
            >
              Summary
            </span>
          </div>

          {/* Step list with connectors */}
          <div style={{ padding: "4px 14px 16px" }}>
            {steps.map((step, i) => (
              <div key={step.id} style={{ display: "flex", alignItems: "stretch" }}>
                {/* Icon column with connector line */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: 32,
                    flexShrink: 0,
                  }}
                >
                  {/* Icon circle */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: step.status === "completed" ? BG_SURFACE_2 : "transparent",
                      border: step.status === "completed" ? "none" : `1.5px solid ${BG_SURFACE_2}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {step.status === "completed" ? (
                      <CheckIcon size={14} />
                    ) : step.status === "active" ? (
                      <PulsingDot />
                    ) : (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor: BG_SURFACE_2,
                        }}
                      />
                    )}
                  </div>
                  {/* Vertical connector */}
                  {i < steps.length - 1 && (
                    <div
                      style={{
                        width: 1.5,
                        flex: 1,
                        minHeight: 12,
                        backgroundColor: step.status === "completed" ? OUTLINE_SUBTLE : BG_SURFACE_2,
                      }}
                    />
                  )}
                </div>

                {/* Label + chevron */}
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    paddingLeft: 10,
                    paddingBottom: i < steps.length - 1 ? 12 : 0,
                    minHeight: 36,
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      ...typography.bodySmall,
                      color:
                        step.status === "completed"
                          ? TEXT_PRIMARY
                          : step.status === "active"
                            ? TEXT_PRIMARY
                            : TEXT_DISABLED,
                    }}
                  >
                    {step.label}
                    {step.status === "completed" && step.value && (
                      <span style={{ ...typography.caption, color: TEXT_TERTIARY, marginLeft: 6 }}>
                        {step.value}
                      </span>
                    )}
                  </span>
                  {step.status === "completed" && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M9 6l6 6-6 6" stroke="rgba(0,0,0,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
}
