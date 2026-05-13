"use client";

import { useRef } from "react";
import { BOTTOM_INSET, NavButton, StatusBar } from "./AppChrome";
import { typography } from "../lib/typography";
import { formatINR } from "../lib/financial-data";
import { GREEN_500, GREEN_50, RED_500, RED_50, ORANGE_500, ORANGE_50, TEXT_TERTIARY } from "../lib/colors";
import type { GoalIndicatorData, GoalStatus } from "./GoalTracker";

// ─── Constants ────────────────────────────────────────────────

const STATUS_COLOR: Record<GoalStatus, string> = {
  ahead: GREEN_500,
  behind: RED_500,
  "on-track": ORANGE_500,
};

const STATUS_BG: Record<GoalStatus, string> = {
  ahead: GREEN_50,
  behind: RED_50,
  "on-track": ORANGE_50,
};

// ─── Sakura / Japan Scene (inline SVG) ───────────────────────

function JapanHeroScene() {
  return (
    <svg
      viewBox="0 0 600 400"
      style={{ width: "100%", height: "100%", display: "block" }}
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Sky gradient */}
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdd9e1" />
          <stop offset="40%" stopColor="#f2a7be" />
          <stop offset="70%" stopColor="#d98bac" />
          <stop offset="100%" stopColor="#bf66a5" />
        </linearGradient>
        <linearGradient id="fuji" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a2d5e" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#3a1f4a" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      <rect width="600" height="400" fill="url(#sky)" />

      {/* Mt Fuji */}
      <polygon points="150,400 290,155 300,150 310,155 450,400" fill="url(#fuji)" />
      {/* Snow cap */}
      <polygon points="270,185 290,155 300,150 310,155 330,185 315,195 300,198 285,195" fill="white" fillOpacity="0.8" />

      {/* Cherry blossom branch — bottom left */}
      <path d="M-10,380 Q60,340 120,310 Q160,295 200,280" stroke="#5c3347" strokeWidth="3" fill="none" strokeOpacity="0.5" strokeLinecap="round" />
      <path d="M80,320 Q95,290 110,270" stroke="#5c3347" strokeWidth="2" fill="none" strokeOpacity="0.4" strokeLinecap="round" />

      {/* Sakura flowers — 5-petal clusters */}
      {/* Branch flowers */}
      {[[90, 305, 18], [135, 288, 15], [105, 268, 13], [175, 278, 14], [55, 335, 12]].map(([cx, cy, r], i) => (
        <g key={`bf${i}`} opacity={0.9 - i * 0.05}>
          {[0, 72, 144, 216, 288].map((deg) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const px = cx + Math.cos(rad) * r * 0.4;
            const py = cy + Math.sin(rad) * r * 0.4;
            return <ellipse key={deg} cx={px} cy={py} rx={r * 0.35} ry={r * 0.5} fill="#ffe6ed" transform={`rotate(${deg} ${px} ${py})`} />;
          })}
          <circle cx={cx} cy={cy} r={r * 0.12} fill="#e8899e" />
        </g>
      ))}

      {/* Sky flowers */}
      {[[80, 55, 22], [500, 70, 20], [430, 40, 16], [540, 190, 14], [180, 30, 12], [50, 150, 15]].map(([cx, cy, r], i) => (
        <g key={`sf${i}`} opacity={0.75 - i * 0.07}>
          {[0, 72, 144, 216, 288].map((deg) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const px = cx + Math.cos(rad) * r * 0.4;
            const py = cy + Math.sin(rad) * r * 0.4;
            return <ellipse key={deg} cx={px} cy={py} rx={r * 0.35} ry={r * 0.5} fill="#ffe6ed" transform={`rotate(${deg} ${px} ${py})`} />;
          })}
          <circle cx={cx} cy={cy} r={r * 0.12} fill="#e8899e" />
        </g>
      ))}

      {/* Scattered petals */}
      {[
        [120, 95, 25], [350, 65, -40], [480, 155, 55], [200, 195, -15],
        [100, 340, 40], [500, 290, -55], [300, 95, 10], [420, 240, -25],
        [60, 195, 65], [550, 340, -10], [250, 315, 35], [380, 345, -45],
      ].map(([x, y, rot], i) => (
        <ellipse
          key={`p${i}`}
          cx={x}
          cy={y}
          rx={4 + (i % 3)}
          ry={6 + (i % 3)}
          fill="#ffe0ea"
          opacity={0.3 + (i % 4) * 0.1}
          transform={`rotate(${rot} ${x} ${y})`}
        />
      ))}

      {/* Bottom gradient overlay for text */}
      <defs>
        <linearGradient id="textOverlay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="black" stopOpacity="0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <rect y="220" width="600" height="180" fill="url(#textOverlay)" />
    </svg>
  );
}

// ─── Goal Card ───────────────────────────────────────────────

// ─── Tall Card (for horizontal carousel) ────────────────────

function GoalCardTall({
  goal,
  onTap,
}: {
  goal: GoalIndicatorData;
  onTap: () => void;
}) {
  const clampedPct = Math.min(Math.max(goal.pct, 0), 100);
  const hasScene = goal.heroScene === "japan";
  const gradient = goal.gradient ?? `linear-gradient(135deg, ${goal.ringColor}30 0%, ${goal.ringColor} 100%)`;
  const heroEmoji = goal.heroEmoji ?? goal.icon;

  return (
    <button
      type="button"
      onClick={onTap}
      className="text-left active:scale-[0.97] transition-transform"
      style={{
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        border: "none",
        position: "relative",
        backgroundColor: "#fff",
      }}
    >
      {/* Full-bleed background */}
      <div style={{ position: "absolute", inset: 0 }}>
        {hasScene ? (
          <JapanHeroScene />
        ) : (
          <div style={{ width: "100%", height: "100%", background: gradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 72, lineHeight: 1, userSelect: "none", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" }}>
              {heroEmoji}
            </span>
          </div>
        )}
      </div>

      {/* Top gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 100,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)",
        }}
      />

      {/* Bottom gradient */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 180,
          background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)",
        }}
      />

      {/* Content overlay */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 20,
        }}
      >
        {/* Top-right: progress ring */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <svg width={56} height={56} viewBox="0 0 56 56" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.2))" }}>
            <circle cx={28} cy={28} r={23} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={5} />
            <circle
              cx={28} cy={28} r={23}
              fill="none"
              stroke="#fff"
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 23}
              strokeDashoffset={2 * Math.PI * 23 - (clampedPct / 100) * 2 * Math.PI * 23}
              transform="rotate(-90 28 28)"
            />
            <text x={28} y={28} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: "var(--font-rubik), sans-serif", fontSize: 14, fontWeight: 500, fill: "#fff" }}>
              {goal.pct}%
            </text>
          </svg>
        </div>

        {/* Bottom: date+amount → name → status tag */}
        <div>
          {/* Status tag */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "4px 8px",
              borderRadius: 100,
              backgroundColor: STATUS_BG[goal.status],
              marginBottom: 8,
            }}
          >
            <span style={{ ...typography.metadata, textTransform: "uppercase", color: STATUS_COLOR[goal.status] }}>
              {goal.status === "ahead" ? "Ahead" : goal.status === "behind" ? "Behind" : "On track"}
            </span>
          </div>

          {/* Goal name */}
          <p
            style={{
              ...typography.headerH1,
              color: "#fff",
              margin: 0,
              marginBottom: 4,
              textShadow: "0 1px 6px rgba(0,0,0,0.3)",
            }}
          >
            {goal.name}
          </p>

          {/* Save X by Y */}
          <p style={{ ...typography.caption, color: "rgba(255,255,255,0.7)", margin: 0 }}>
            Save {formatINR(goal.target)} by {goal.endDate ?? "target date"}
          </p>
        </div>
      </div>
    </button>
  );
}

// ─── New Goal (empty) card ───────────────────────────────────

function NewGoalCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 16,
        border: `1.5px dashed rgba(0,0,0,0.12)`,
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 100,
          backgroundColor: "rgba(0,0,0,0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke={TEXT_TERTIARY} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <p style={{ ...typography.bodyNormal, color: TEXT_TERTIARY, margin: 0 }}>New goal</p>
    </div>
  );
}

// ─── V4 Carousel Layout ─────────────────────────────────────

function GoalCarousel({
  goals,
  onGoalTap,
}: {
  goals: GoalIndicatorData[];
  onGoalTap: (goal: GoalIndicatorData) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const CARD_WIDTH = 288;
  const CARD_HEIGHT = 508;
  const CARD_GAP = 16;
  const SIDE_PAD = 36; // centers 288px in 360px viewport

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div
        ref={scrollRef}
        className="scrollbar-none [&::-webkit-scrollbar]:hidden"
        style={{
          flex: 1,
          overflowX: "auto",
          overflowY: "hidden",
          WebkitOverflowScrolling: "touch",
          scrollSnapType: "x mandatory",
          display: "flex",
          alignItems: "flex-start",
          gap: CARD_GAP,
          paddingLeft: SIDE_PAD,
          paddingRight: SIDE_PAD,
          paddingTop: 16,
          paddingBottom: BOTTOM_INSET + 16,
        }}
      >
        {goals.map((goal) => (
          <div
            key={goal.id}
            style={{
              flexShrink: 0,
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              scrollSnapAlign: "center",
            }}
          >
            <GoalCardTall goal={goal} onTap={() => onGoalTap(goal)} />
          </div>
        ))}

        {/* Empty "New goal" card */}
        <div
          style={{
            flexShrink: 0,
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            scrollSnapAlign: "center",
          }}
        >
          <NewGoalCard />
        </div>
      </div>
    </div>
  );
}

// ─── Goals List Screen ───────────────────────────────────────

export default function GoalListScreen({
  goals,
  onGoalTap,
  onClose,
}: {
  goals: GoalIndicatorData[];
  onGoalTap: (goal: GoalIndicatorData) => void;
  onClose: () => void;
}) {

  return (
    <div
      style={{ backgroundColor: "#fff", display: "flex", flexDirection: "column", width: "100%", height: "100%" }}
    >
      {/* DLS Standard App Bar (Button type, no button) — scoped to this screen */}
      <div className="shrink-0" style={{ backgroundColor: "#fff" }}>
        <StatusBar />
        <div
          className="flex items-center"
          style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 12, paddingRight: 8 }}
        >
          <NavButton kind="back" onClick={onClose} />
          <span
            style={{
              ...typography.headerH3,
              color: "rgba(0,0,0,0.9)",
              flex: "1 0 0",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Goals
          </span>
        </div>
      </div>

      <GoalCarousel goals={goals} onGoalTap={onGoalTap} />
    </div>
  );
}
