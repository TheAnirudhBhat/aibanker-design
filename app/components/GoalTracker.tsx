"use client";

import { useRef } from "react";
import {
  DECOR_BOLD_VALENTINO, DECOR_BOLD_BLUE, DECOR_BOLD_GREEN,
  EXT_TEXT_POSITIVE, EXT_TEXT_NEGATIVE, EXT_TEXT_WARNING,
  DECOR_SUBTLE_GREEN, DECOR_SUBTLE_RED, DECOR_SUBTLE_ORANGE,
  UTILITY_NEGATIVE,
  BG_PRIMARY, TEXT_PRIMARY, OUTLINE_SUBTLE, BG_GLASS, OUTLINE_BOLD,
} from "../lib/colors";
import { RADIUS_CIRCLE } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";

// ─── Types ────────────────────────────────────────────────────

export type GoalStatus = "ahead" | "behind" | "on-track";
export type GoalIcon = "plane" | "shield" | "laptop" | "piggy" | "savings" | string;

export type GoalIndicatorData = {
  id: string;
  name: string;
  pct: number;
  status: GoalStatus;
  daysLabel: string;
  saved: number;
  target: number;
  icon: GoalIcon;
  ringColor: string;
  endDate?: string;
  monthlyAmount?: number;
  gradient?: string;
  heroEmoji?: string;
  heroImage?: string;
  heroScene?: string;
};

export type GoalTrackerProps = {
  goals: GoalIndicatorData[];
  onGoalTap: (goal: GoalIndicatorData) => void;
  onGoalListOpen?: () => void;
  /** Single-goal inner content: "pct" shows percentage text, "icon" shows the goal icon */
  singleVariant?: "pct" | "icon";
};

// ─── Constants ────────────────────────────────────────────────

const RING_COLORS = [DECOR_BOLD_VALENTINO, DECOR_BOLD_BLUE, DECOR_BOLD_GREEN];
const BEHIND_COLOR = UTILITY_NEGATIVE;

const STATUS_COLOR: Record<GoalStatus, string> = {
  ahead: EXT_TEXT_POSITIVE,
  behind: EXT_TEXT_NEGATIVE,
  "on-track": EXT_TEXT_WARNING,
};

const STATUS_BG: Record<GoalStatus, string> = {
  ahead: DECOR_SUBTLE_GREEN,
  behind: DECOR_SUBTLE_RED,
  "on-track": DECOR_SUBTLE_ORANGE,
};

// ─── Goal Icons (emoji) ──────────────────────────────────────

const GOAL_EMOJI: Record<string, string> = {
  plane: "✈️",
  shield: "🛡️",
  laptop: "💻",
  piggy: "🐷",
  savings: "💰",
};

function GoalIconEmoji({ icon, size = 14 }: { icon: GoalIcon; size?: number }) {
  return (
    <span style={{ fontSize: size, lineHeight: 1, userSelect: "none" }}>
      {GOAL_EMOJI[icon] ?? icon}
    </span>
  );
}

// ─── Progress Ring (single ring SVG) ─────────────────────────

function ProgressRing({
  size,
  pct,
  strokeWidth,
  color,
  trackOpacity = 0.15,
  showLabel = false,
  status,
}: {
  size: number;
  pct: number;
  strokeWidth: number;
  color: string;
  trackOpacity?: number;
  showLabel?: boolean;
  status?: GoalStatus;
}) {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2 - 1;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(pct, 0), 100);
  const offset = circumference - (clamped / 100) * circumference;
  const strokeColor = status === "behind" ? BEHIND_COLOR : color;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      {trackOpacity > 0 && (
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={trackOpacity}
        />
      )}
      {/* Fill — transitions when pct changes so a freshly-set ring charges up smoothly
          (e.g. the onboarding "goal live" reveal ramps 0 → funded). Static usages whose
          pct never changes after mount never trigger it, so they're unaffected. */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: "stroke-dashoffset 720ms cubic-bezier(0.22, 1, 0.36, 1)" }}
      />
      {/* Label */}
      {showLabel && (
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontFamily: "var(--font-rubik), sans-serif",
            // Scale the centred % with the ring so it stays readable as the ring grows.
            fontSize: Math.round(size * 0.28),
            fontWeight: 500,
            fill: TEXT_PRIMARY,
          }}
        >
          {clamped}%
        </text>
      )}
    </svg>
  );
}

// ─── Concentric Rings (Apple Watch style, up to 3) ───────────

function ConcentricRings({
  goals,
}: {
  goals: GoalIndicatorData[];
}) {
  const size = 34;
  const center = size / 2;
  // Ring specs: [radius, strokeWidth] for outer -> inner
  const ringSpecs: [number, number][] = [
    [14.5, 3.5],   // outer
    [9, 3.5],      // middle
    [3.5, 3.5],    // inner
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {goals.slice(0, 3).map((goal, i) => {
        const [radius, sw] = ringSpecs[i];
        const circumference = 2 * Math.PI * radius;
        const clamped = Math.min(Math.max(goal.pct, 0), 100);
        const offset = circumference - (clamped / 100) * circumference;
        const strokeColor = goal.status === "behind" ? BEHIND_COLOR : goal.ringColor;

        return (
          <g key={goal.id}>
            {/* Track */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth={sw}
              opacity={0.15}
            />
            {/* Fill */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth={sw}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${center} ${center})`}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Goal Dropdown ───────────────────────────────────────────

// ─── Main GoalTracker Component ──────────────────────────────

export default function GoalTracker({ goals, onGoalTap, onGoalListOpen, singleVariant = "pct", frosted = false }: GoalTrackerProps & { frosted?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (goals.length === 0) return null;

  const hasBehind = goals.some((g) => g.status === "behind");
  const isSingle = goals.length === 1;

  const handleTap = () => {
    onGoalListOpen?.();
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={handleTap}
        aria-label={isSingle ? `Goal: ${goals[0].name}` : `${goals.length} goals`}
        className="flex items-center justify-center rounded-full"
        style={{
          width: 48,
          height: 48,
          // Frosted = matches the close-X chip on the other side of the app bar (glass fill, blur,
          // bold outline) so the two top-chrome chips read as a pair. Default keeps the solid look.
          backgroundColor: frosted ? BG_GLASS : BG_PRIMARY,
          border: `1px solid ${frosted ? OUTLINE_BOLD : OUTLINE_SUBTLE}`,
          boxShadow: frosted ? ELEVATION_CARD : "0px 2px 32px 0px rgba(0,0,0,0.05)",
          backdropFilter: frosted ? "blur(12px)" : undefined,
          WebkitBackdropFilter: frosted ? "blur(12px)" : undefined,
          cursor: "pointer",
          position: "relative",
        }}
      >
        {/* Ring content */}
        {isSingle ? (
          <div style={{ position: "relative", width: 40, height: 40 }}>
            <ProgressRing
              size={40}
              pct={goals[0].pct}
              strokeWidth={4}
              color={goals[0].ringColor}
              showLabel={singleVariant === "pct"}
              status={goals[0].status}
            />
            {singleVariant === "icon" && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <GoalIconEmoji icon={goals[0].icon} size={16} />
              </div>
            )}
          </div>
        ) : (
          <ConcentricRings goals={goals} />
        )}

        {/* Alert dot */}
        {hasBehind && (
          <div
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 6,
              height: 6,
              borderRadius: RADIUS_CIRCLE,
              backgroundColor: BEHIND_COLOR,
              animation: "goal-alert-pulse 2s ease-in-out infinite",
            }}
          />
        )}
      </button>

    </div>
  );
}
