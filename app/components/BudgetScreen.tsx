"use client";

import { useRef } from "react";
import { AppBar, BOTTOM_INSET, NavButton } from "./AppChrome";
import { typography } from "../lib/typography";
import {
  BG_PRIMARY,
  RED_500,
  RED_400,
  RED_50,
  TEXT_PRIMARY,
  TEXT_TERTIARY,
  VALENTINO_500,
  OUTLINE_BOLD,
  OUTLINE_SUBTLE,
  BG_SECONDARY,
  BG_SURFACE_2,
  ALPHA_WHITE_80,
  TEXT_ON_COLOR_PRIMARY,
} from "../lib/colors";
import { RADIUS_M, RADIUS_CIRCLE } from "../lib/radii";
import { CATEGORY_ICONS, CATEGORY_COLORS, DlsTag, trackColor } from "./ChatCards";
import { formatINR } from "../lib/financial-data";
import type { GoalIndicatorData } from "./GoalTracker";
import type { Pool } from "../lib/types";

// ─── Types ────────────────────────────────────────────────────

export type BudgetCategoryProgress = {
  name: string;
  spent: number;
  cap: number;
  color?: string;
};

export type MonthlyBudgetSnapshot = {
  monthLabel: string;
  totalSpent: number;
  totalCap: number;
  categories: BudgetCategoryProgress[];
  /** Day-of-month for "today" - used to compute pacing vs ideal burn-down. */
  daysElapsed: number;
  daysInMonth: number;
};

type PacingStatus =
  | { kind: "over" }
  | { kind: "on-track" }
  | { kind: "projected-over"; amount: number }
  | { kind: "projected-save"; amount: number };

// Forward-projection from today's burn rate to end-of-month. The unit is rupees so
// the tag reads in the same currency as the rest of the screen - avoids the
// goal-tracker's "ahead/behind" ambiguity in a spending context.
function pacingStatus(snap: MonthlyBudgetSnapshot): PacingStatus {
  if (snap.totalSpent > snap.totalCap) return { kind: "over" };
  if (snap.daysInMonth <= 0 || snap.daysElapsed <= 0) return { kind: "on-track" };
  const projected = snap.totalSpent * (snap.daysInMonth / snap.daysElapsed);
  const delta = projected - snap.totalCap;
  const tolerance = snap.totalCap * 0.05; // ±5% of cap reads as "on track"
  if (Math.abs(delta) < tolerance) return { kind: "on-track" };
  if (delta > 0) return { kind: "projected-over", amount: delta };
  return { kind: "projected-save", amount: -delta };
}

// Round to the nearest k (or L for ≥1L) - chips are glanceable; the precise number lives
// in the headline and the Spent/Budget split below.
function formatChipAmount(amount: number): string {
  if (amount >= 100000) return `₹${Math.round(amount / 100000)}L`;
  if (amount >= 1000) return `₹${Math.round(amount / 1000)}K`;
  return `₹${Math.round(amount)}`;
}

function pacingLabel(p: PacingStatus): string {
  switch (p.kind) {
    case "over": return "Over budget";
    case "on-track": return "On track";
    case "projected-over": return `Will go over by ${formatChipAmount(p.amount)}`;
    case "projected-save": return `Will save ${formatChipAmount(p.amount)}`;
  }
}

export type BudgetScreenProps = {
  goal: GoalIndicatorData | null;
  pool: Pool | null;
  budget: MonthlyBudgetSnapshot;
  onClose: () => void;
};

// ─── Formatters ───────────────────────────────────────────────

function formatINRFull(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

// ─── Sakura / Japan scene (matches the main app's goal card) ──

function JapanHeroScene() {
  return (
    <svg
      viewBox="0 0 600 400"
      style={{ width: "100%", height: "100%", display: "block" }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="bs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdd9e1" />
          <stop offset="40%" stopColor="#f2a7be" />
          <stop offset="70%" stopColor="#d98bac" />
          <stop offset="100%" stopColor="#bf66a5" />
        </linearGradient>
        <linearGradient id="bs-fuji" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a2d5e" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#3a1f4a" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#bs-sky)" />
      <polygon points="150,400 290,155 300,150 310,155 450,400" fill="url(#bs-fuji)" />
      <polygon points="270,185 290,155 300,150 310,155 330,185 315,195 300,198 285,195" fill="white" fillOpacity="0.8" />
      {[[80, 55, 22], [500, 70, 20], [430, 40, 16], [540, 190, 14], [180, 30, 12], [50, 150, 15]].map(([cx, cy, r], i) => (
        <g key={`sf${i}`} opacity={0.8 - i * 0.07}>
          {[0, 72, 144, 216, 288].map((deg) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const px = cx + Math.cos(rad) * r * 0.4;
            const py = cy + Math.sin(rad) * r * 0.4;
            return <ellipse key={deg} cx={px} cy={py} rx={r * 0.35} ry={r * 0.5} fill="#ffe6ed" transform={`rotate(${deg} ${px} ${py})`} />;
          })}
          <circle cx={cx} cy={cy} r={r * 0.12} fill="#e8899e" />
        </g>
      ))}
    </svg>
  );
}

// ─── Anchor cards ─────────────────────────────────────────────

function ProgressRing({ pct, size = 44 }: { pct: number; size?: number }) {
  const clampedPct = Math.min(Math.max(pct, 0), 100);
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.2))" }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={stroke} />
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke={TEXT_ON_COLOR_PRIMARY}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (clampedPct / 100) * c}
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      <text
        x={cx} y={cx}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontFamily: "var(--font-rubik), sans-serif", fontSize: 11, fontWeight: 500, fill: TEXT_ON_COLOR_PRIMARY }}
      >
        {Math.round(clampedPct)}%
      </text>
    </svg>
  );
}

function AnchorCardGoal({ goal }: { goal: GoalIndicatorData }) {
  const hasScene = goal.heroScene === "japan";
  const gradient = goal.gradient ?? `linear-gradient(135deg, ${goal.ringColor}30 0%, ${goal.ringColor} 100%)`;
  const heroEmoji = goal.heroEmoji ?? goal.icon;

  return (
    <div
      style={{
        borderRadius: RADIUS_M,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: BG_PRIMARY,
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        {hasScene ? (
          <JapanHeroScene />
        ) : (
          <div style={{ width: "100%", height: "100%", background: gradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 56, lineHeight: 1, userSelect: "none", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" }}>
              {heroEmoji}
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 80,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: 100,
          background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          {goal.endDate ? (
            <span style={{ ...typography.metadata, textTransform: "uppercase", color: "rgba(255,255,255,0.85)", letterSpacing: 1 }}>
              {goal.endDate}
            </span>
          ) : <span />}
          <ProgressRing pct={goal.pct} />
        </div>

        <div>
          <p
            style={{
              ...typography.headerH3,
              color: TEXT_ON_COLOR_PRIMARY,
              margin: 0,
              marginBottom: 2,
              textShadow: "0 1px 6px rgba(0,0,0,0.3)",
            }}
          >
            {goal.name}
          </p>
          <p style={{ ...typography.caption, color: ALPHA_WHITE_80, margin: 0 }}>
            {formatINRFull(goal.saved)} / {formatINRFull(goal.target)}
          </p>
        </div>
      </div>
    </div>
  );
}

function AnchorCardPool({ pool }: { pool: Pool }) {
  const hasTarget = typeof pool.target === "number" && pool.target > 0;
  const pct = hasTarget ? Math.round((pool.saved / (pool.target as number)) * 100) : 0;
  const gradient = pool.gradient ?? `linear-gradient(135deg, ${pool.ringColor}30 0%, ${pool.ringColor} 100%)`;
  const heroEmoji = pool.heroEmoji ?? pool.icon;

  return (
    <div
      style={{
        borderRadius: RADIUS_M,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        position: "relative",
        backgroundColor: BG_PRIMARY,
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: gradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 56, lineHeight: 1, userSelect: "none", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" }}>
          {heroEmoji}
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: 80,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: 100,
          background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span />
          {hasTarget ? <ProgressRing pct={pct} /> : null}
        </div>

        <div>
          <p
            style={{
              ...typography.headerH3,
              color: TEXT_ON_COLOR_PRIMARY,
              margin: 0,
              marginBottom: 2,
              textShadow: "0 1px 6px rgba(0,0,0,0.3)",
            }}
          >
            {pool.name}
          </p>
          <p style={{ ...typography.caption, color: ALPHA_WHITE_80, margin: 0 }}>
            {hasTarget
              ? `${formatINRFull(pool.saved)} / ${formatINRFull(pool.target as number)}`
              : `${formatINRFull(pool.saved)} saved`}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyAnchorCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: RADIUS_M,
        border: `1.5px dashed ${OUTLINE_BOLD}`,
        backgroundColor: BG_PRIMARY,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: RADIUS_CIRCLE,
          backgroundColor: BG_SURFACE_2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke={TEXT_TERTIARY} strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

// ─── Anchor carousel ──────────────────────────────────────────

const CARD_WIDTH = 288;
const CARD_HEIGHT = 220;
const CARD_GAP = 16;
const SIDE_PAD = 24; // matches the app-bar back chevron's optical left edge

function AnchorCarousel({ goal, pool }: { goal: GoalIndicatorData | null; pool: Pool | null }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="[&::-webkit-scrollbar]:hidden"
      style={{
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
        scrollSnapType: "x mandatory",
        scrollPaddingLeft: SIDE_PAD, // so snap-start respects paddingLeft (otherwise the first card snaps to x=0)
        display: "flex",
        alignItems: "flex-start",
        gap: CARD_GAP,
        paddingLeft: SIDE_PAD,
        paddingRight: SIDE_PAD,
        paddingTop: 16,
        paddingBottom: 24,
        flexShrink: 0,
      }}
    >
      <div style={{ flexShrink: 0, width: CARD_WIDTH, height: CARD_HEIGHT, scrollSnapAlign: "start" }}>
        {goal ? <AnchorCardGoal goal={goal} /> : <EmptyAnchorCard />}
      </div>
      <div style={{ flexShrink: 0, width: CARD_WIDTH, height: CARD_HEIGHT, scrollSnapAlign: "start" }}>
        {pool ? <AnchorCardPool pool={pool} /> : <EmptyAnchorCard />}
      </div>
    </div>
  );
}

// ─── Progress bar with red overflow past 100% ─────────────────

// Single 8px bar, no variable-width segments. Fills 0-100% with the category color
// when under cap; flips to a full-width red fill when over.
export function BudgetBar({
  spent,
  cap,
  fillColor,
  overColor = RED_500,
}: {
  spent: number;
  cap: number;
  fillColor: string;
  overColor?: string;
}) {
  if (cap <= 0) {
    return <div style={{ height: 8, backgroundColor: trackColor(fillColor), borderRadius: RADIUS_CIRCLE }} />;
  }
  const isOver = spent > cap;
  const filledPct = Math.min(spent / cap, 1) * 100;
  const trackBg = isOver ? RED_50 : trackColor(fillColor);
  const fill = isOver ? overColor : fillColor;

  return (
    <div style={{ height: 8, backgroundColor: trackBg, borderRadius: RADIUS_CIRCLE, overflow: "hidden" }}>
      <div style={{ width: `${filledPct}%`, height: "100%", backgroundColor: fill }} />
    </div>
  );
}

// ─── Budget total - headline + bar + supporting caption ───────

function BudgetTotalBar({ snapshot }: { snapshot: MonthlyBudgetSnapshot }) {
  const { totalSpent, totalCap, monthLabel } = snapshot;
  const overflow = Math.max(totalSpent - totalCap, 0);
  const left = Math.max(totalCap - totalSpent, 0);
  const pace = pacingStatus(snapshot);
  const isOver = pace.kind === "over";

  const headlineText = isOver
    ? `Over by ${formatINRFull(overflow)}`
    : `${formatINRFull(left)} left`;

  const tagIntent: "positive" | "warning" | "neutral" =
    pace.kind === "projected-save" ? "positive"
    : pace.kind === "projected-over" ? "warning"
    : "neutral";

  return (
    <div style={{ padding: "24px 24px 24px" }}>
      {!isOver ? (
        <div style={{ marginBottom: 8 }}>
          <DlsTag intent={tagIntent} emphasis="subtle">{pacingLabel(pace)}</DlsTag>
        </div>
      ) : null}
      <p style={{ ...typography.headerH1, color: isOver ? RED_500 : TEXT_PRIMARY, margin: 0, marginBottom: 4 }}>
        {headlineText}
      </p>
      <p style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY, margin: 0, marginBottom: 16 }}>
        {monthLabel} · Monthly budget
      </p>
      <BudgetBar spent={totalSpent} cap={totalCap} fillColor={VALENTINO_500} />
    </div>
  );
}

// ─── Category row ─────────────────────────────────────────────

function BudgetCategoryRow({ row }: { row: BudgetCategoryProgress }) {
  const color = row.color ?? CATEGORY_COLORS[row.name] ?? VALENTINO_500;
  const isOver = row.spent > row.cap;
  const overflow = Math.max(row.spent - row.cap, 0);
  const remaining = Math.max(row.cap - row.spent, 0);
  const icon = CATEGORY_ICONS[row.name] ?? CATEGORY_ICONS["Miscellaneous"];

  const headlineText = isOver ? `${formatINRFull(overflow)} over` : `${formatINRFull(remaining)} left`;

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        paddingTop: 16,
        paddingBottom: 16,
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: RADIUS_CIRCLE,
          backgroundColor: BG_PRIMARY,
          border: `1px solid ${OUTLINE_SUBTLE}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {icon}
      </div>

      <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <p style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, margin: 0 }}>{row.name}</p>
        <div style={{ paddingTop: 4, paddingBottom: 4 }}>
          <BudgetBar spent={row.spent} cap={row.cap} fillColor={color} overColor={RED_400} />
        </div>
      </div>

      {/* Fixed-width trailing column so the bar's track stays the same length across every row. */}
      <div style={{ flex: "0 0 112px", display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
        <p style={{ ...typography.bodyNormal, color: isOver ? RED_400 : TEXT_PRIMARY, textAlign: "right", whiteSpace: "nowrap", margin: 0 }}>
          {headlineText}
        </p>
        <p style={{ ...typography.caption, color: TEXT_TERTIARY, textAlign: "right", whiteSpace: "nowrap", margin: 0 }}>
          {formatINRFull(row.cap)}
        </p>
      </div>
    </div>
  );
}

// ─── Sort: over-budget first (descending overshoot), then by % spent desc

function sortCategories(rows: BudgetCategoryProgress[]): BudgetCategoryProgress[] {
  return [...rows].sort((a, b) => {
    const aOver = a.spent - a.cap;
    const bOver = b.spent - b.cap;
    const aIsOver = aOver > 0;
    const bIsOver = bOver > 0;
    if (aIsOver && !bIsOver) return -1;
    if (!aIsOver && bIsOver) return 1;
    if (aIsOver && bIsOver) return bOver - aOver;
    const aPct = a.cap > 0 ? a.spent / a.cap : 0;
    const bPct = b.cap > 0 ? b.spent / b.cap : 0;
    return bPct - aPct;
  });
}

// ─── DLS Big divider (8px Slate/10 full-bleed) ────────────────

function BigDivider() {
  return <div style={{ height: 8, backgroundColor: BG_SECONDARY, width: "100%" }} />;
}

// ─── Budget screen ────────────────────────────────────────────

export default function BudgetScreen({ goal, pool, budget, onClose }: BudgetScreenProps) {
  const sorted = sortCategories(budget.categories);

  return (
    <div
      style={{ backgroundColor: BG_PRIMARY, display: "flex", flexDirection: "column", width: "100%", height: "100%" }}
    >
      <AppBar leading={<NavButton kind="back" onClick={onClose} />} />

      <div
        className="[&::-webkit-scrollbar]:hidden"
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          paddingBottom: BOTTOM_INSET + 16,
        }}
      >
        <AnchorCarousel goal={goal} pool={pool} />

        <BigDivider />
        <BudgetTotalBar snapshot={budget} />

        <div>
          {sorted.slice(0, 3).map((row) => (
            <BudgetCategoryRow key={row.name} row={row} />
          ))}
        </div>
      </div>
    </div>
  );
}
