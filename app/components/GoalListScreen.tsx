"use client";

import { useRef, useState, useEffect } from "react";
import { BOTTOM_INSET, CHAT_APP_BAR_HEIGHT, NavButton, StatusBar } from "./AppChrome";
import { typography } from "../lib/typography";
import { formatINR } from "../lib/financial-data";
import { GREEN_500, GREEN_50, RED_500, RED_50, ORANGE_500, ORANGE_50, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, TEXT_ON_COLOR_SECONDARY, TEXT_ON_COLOR_PRIMARY, BG_SHEET, BG_PRIMARY, OUTLINE_BOLD, OUTLINE_SUBTLE, BG_SECONDARY, BLUE_500, CAT_AVATAR_FILL, MAIN_PRIMARY, MAIN_PRIMARY_SUBTLE, UTILITY_NEGATIVE, EXT_TEXT_WARNING, EXT_TEXT_NEGATIVE } from "../lib/colors";
import type { GoalIndicatorData, GoalStatus } from "./GoalTracker";
import { RADIUS_M, RADIUS_CIRCLE } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";
import { SPACE_3XS, SPACE_2XS, SPACE_S, SPACE_M, SPACE_L } from "../lib/spacing";
import { SPENDING_PLAN_FIXTURE, getSafeToSpendSnapshot, formatCompactK } from "../preview/fixtures/gbpFlowFixture";
import { CATEGORY_ICONS } from "./ChatCards";
import type { CategoryBudget } from "../lib/types";

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

      {/* Cherry blossom branch - bottom left */}
      <path d="M-10,380 Q60,340 120,310 Q160,295 200,280" stroke="#5c3347" strokeWidth="3" fill="none" strokeOpacity="0.5" strokeLinecap="round" />
      <path d="M80,320 Q95,290 110,270" stroke="#5c3347" strokeWidth="2" fill="none" strokeOpacity="0.4" strokeLinecap="round" />

      {/* Sakura flowers - 5-petal clusters */}
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
        borderRadius: RADIUS_M,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        border: "none",
        position: "relative",
        backgroundColor: BG_PRIMARY,
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
              stroke={TEXT_ON_COLOR_PRIMARY}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 23}
              strokeDashoffset={2 * Math.PI * 23 - (clampedPct / 100) * 2 * Math.PI * 23}
              transform="rotate(-90 28 28)"
            />
            <text x={28} y={28} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: "var(--font-rubik), sans-serif", fontSize: 14, fontWeight: 500, fill: TEXT_ON_COLOR_PRIMARY }}>
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
              borderRadius: RADIUS_CIRCLE,
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
              color: TEXT_ON_COLOR_PRIMARY,
              margin: 0,
              marginBottom: 4,
              textShadow: "0 1px 6px rgba(0,0,0,0.3)",
            }}
          >
            {goal.name}
          </p>

          {/* Save X by Y */}
          <p style={{ ...typography.caption, color: TEXT_ON_COLOR_SECONDARY, margin: 0 }}>
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
        borderRadius: RADIUS_M,
        border: `1.5px dashed ${OUTLINE_BOLD}`,
        backgroundColor: BG_PRIMARY,
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
          borderRadius: RADIUS_CIRCLE,
          backgroundColor: BG_SECONDARY,
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
  const CARD_WIDTH = 240;
  // Compact cards — the goals are a section below the safe-to-spend hero + budget,
  // not the whole screen, so they don't need to be full-bleed.
  const CARD_HEIGHT = 320;
  const CARD_GAP = 16;
  const SIDE_PAD = 60; // centers 240px in 360px viewport

  // Single goal → one big edge-to-edge card (no horizontal scroll / side padding).
  if (goals.length === 1) {
    return (
      <div style={{ flex: 1, padding: `16px ${SPACE_L}px` }}>
        <GoalCardTall goal={goals[0]} onTap={() => onGoalTap(goals[0])} />
      </div>
    );
  }

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
          paddingBottom: 16,
        }}
      >
        {/* Add-goal lives on the section heading now (no in-carousel add card). */}
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
      </div>
    </div>
  );
}

// ─── Safe-to-spend hero (the money L1 headline) ──────────────

export type SafeToSpendPlan = {
  monthly: number;       // total budget for the cycle = sum of the category caps
  spent: number;         // spent so far this cycle = sum of the category spend (drains the hero)
  source?: "full" | "slice-only";
};

type S2SState = "healthy" | "tight" | "zero" | "over";

function SafeToSpendHero({ plan, ringHidden = false }: { plan: SafeToSpendPlan; ringHidden?: boolean }) {
  const remaining = plan.monthly - plan.spent;
  const ratio = plan.monthly > 0 ? remaining / plan.monthly : remaining >= 0 ? 1 : -1;
  const state: S2SState =
    remaining < 0 ? "over" : ratio <= 0.04 ? "zero" : ratio <= 0.33 ? "tight" : "healthy";
  const negative = state === "over";
  // The headline never shows a negative number — at/over budget it bottoms out at ₹0 and the
  // status line nudges a replan. (The overage is surfaced in the status copy, not the number.)
  const heroValue = Math.max(remaining, 0);
  // Ring stays brand Valentino for the normal drain; only true over-budget goes negative-red.
  // Health is otherwise carried by the status line, keeping the ring on-brand.
  const ringFill = negative ? UTILITY_NEGATIVE : MAIN_PRIMARY;
  const ringTrack = negative ? `color-mix(in srgb, ${UTILITY_NEGATIVE} 14%, transparent)` : MAIN_PRIMARY_SUBTLE;
  const fillFrac = negative ? 1 : Math.max(0.02, Math.min(1, ratio));

  // Circular progress: the safe-to-spend amount lives in the centre, the ring drains as the
  // cycle's spending accrues. Charges up from empty on mount.
  const SIZE = 230; // 15% larger than the original 200 — the hero ring is the page's identity.
  const SW = 12;
  const r = (SIZE - SW) / 2;
  const circ = 2 * Math.PI * r;
  // In the peek (ringHidden at mount) the morph ghost does the fill animation, so the real ring is
  // pre-filled to avoid a re-charge jerk on reveal. Standalone (home) keeps the charge-up from empty.
  const [filled, setFilled] = useState(ringHidden);
  useEffect(() => {
    const t = window.setTimeout(() => setFilled(true), 240);
    return () => window.clearTimeout(t);
  }, []);
  const offset = circ - (filled ? fillFrac : 0) * circ;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: `0 ${SPACE_L}px 40px` }}>
      {/* No opacity transition: in the peek the ring snaps visible INSTANTLY under the morph ghost (which
          sits on top at full opacity and then fades to reveal it). A fade-in here would crossfade against
          the fading ghost — both mid-fade ≈ a dip → the flicker. Instant snap under the ghost = no dip. */}
      {/* Elevated circular card — the hero is the page's main element, so it sits in a disc with a
          slice card shadow + 12px margin around the ring, distinct from the flat category rings below. */}
      <div style={{ padding: 12, borderRadius: "50%", backgroundColor: BG_SHEET, border: `1px solid ${OUTLINE_SUBTLE}`, boxShadow: ELEVATION_CARD, opacity: ringHidden ? 0 : 1 }}>
        <div id="s2s-hero-ring" style={{ position: "relative", width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none" stroke={ringTrack} strokeWidth={SW} />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={r}
            fill="none"
            stroke={ringFill}
            strokeWidth={SW}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            style={{ transition: "stroke-dashoffset 720ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        </svg>
        {/* Centre: caption → amount → context */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ ...typography.caption, color: TEXT_SECONDARY }}>Monthly budget</span>
          <p style={{ ...typography.headerH1, fontSize: 40, color: negative ? UTILITY_NEGATIVE : TEXT_PRIMARY, fontVariantNumeric: "tabular-nums", margin: `${SPACE_2XS}px 0 0`, lineHeight: 1 }}>
            {`₹${formatCompactK(heroValue)}`}
          </p>
          <span style={{ ...typography.caption, color: TEXT_TERTIARY, marginTop: SPACE_2XS }}>
            {negative ? `over ₹${formatCompactK(plan.monthly)}` : `left of ₹${formatCompactK(plan.monthly)}`}
          </span>
        </div>
        </div>
      </div>
      {plan.source === "slice-only" && (
        <span style={{ ...typography.caption, color: TEXT_TERTIARY, marginTop: SPACE_3XS }}>
          Based only on your slice spends. Link more to sharpen.
        </span>
      )}
    </div>
  );
}

// Section header: a prominent heading (headerH3), optionally centred, with an optional trailing action.
function SectionHeader({ label, onAddGoal, center = false }: { label: string; onAddGoal?: () => void; center?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: center ? "center" : "space-between", padding: center ? `${SPACE_M}px 40px ${SPACE_L}px` : `${SPACE_M}px ${SPACE_L}px ${SPACE_M}px` }}>
      <span style={{ ...(center ? typography.buttonSmall : typography.headerH3), color: TEXT_PRIMARY, textAlign: center ? "center" : "left" }}>{label}</span>
      {onAddGoal && (
        <button type="button" onClick={onAddGoal} className="active:scale-[0.97] transition-transform" style={{ display: "flex", alignItems: "center", gap: SPACE_3XS, border: "none", background: "transparent", cursor: "pointer", padding: 0 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke={MAIN_PRIMARY} strokeWidth="1.6" strokeLinecap="round" /></svg>
          <span style={{ ...typography.buttonSmall, color: MAIN_PRIMARY }}>Add goal</span>
        </button>
      )}
    </div>
  );
}

// Per-category accent colours — the spend-breakdown viz gives each category its own colour.
// Category bars deliberately EXCLUDE MAIN_PRIMARY (Valentino) — that's reserved for the safe-to-spend
// hero ring + the top-right chat tracker, so the hero reads as distinct from every category row (both
// modes). These three hues are all clearly non-Valentino; over-budget rows still flip to red.
const CAT_COLORS = [BLUE_500, GREEN_500, ORANGE_500];

// Live budget tracker: each category drains its cap; the caps sum to the safe-to-spend the hero shows.
// Laid out as a 3-column grid of progress RINGS — the category avatar sits inside a ring that fills
// as the cap is used, with the name + what's left below. The ring encodes the cap proportion, so the
// text can stay compact (just what's left / over).
const USAGE_RING_SIZE = 60;
const USAGE_RING_SW = 4;
const USAGE_RING_R = (USAGE_RING_SIZE - USAGE_RING_SW) / 2;
const USAGE_RING_CIRC = 2 * Math.PI * USAGE_RING_R;

function CategoryUsageList({ categories }: { categories: CategoryBudget[] }) {
  // Charge the rings up from empty once mounted, so the grid animates in like the hero ring.
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setDrawn(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div style={{ padding: `0 ${SPACE_L}px`, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", rowGap: SPACE_L, columnGap: SPACE_S }}>
      {categories.map((c, i) => {
        const spend = c.cycleSpend ?? c.currentSpend;
        const over = spend > c.cap;
        // Ring shows what's LEFT (drains as the cap is consumed), matching the "₹X left" label.
        const left = Math.max(0, c.cap - spend);
        const frac = c.cap > 0 ? left / c.cap : 1;
        const ringColor = over ? UTILITY_NEGATIVE : CAT_COLORS[i % CAT_COLORS.length];
        return (
          <div key={c.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: SPACE_S, minWidth: 0 }}>
            {/* Progress ring around the category avatar */}
            <div style={{ position: "relative", width: USAGE_RING_SIZE, height: USAGE_RING_SIZE, flexShrink: 0 }}>
              <svg width={USAGE_RING_SIZE} height={USAGE_RING_SIZE} viewBox={`0 0 ${USAGE_RING_SIZE} ${USAGE_RING_SIZE}`} style={{ position: "absolute", inset: 0 }}>
                <circle cx={USAGE_RING_SIZE / 2} cy={USAGE_RING_SIZE / 2} r={USAGE_RING_R} fill="none" stroke={`color-mix(in srgb, ${ringColor} 14%, transparent)`} strokeWidth={USAGE_RING_SW} />
                <circle
                  cx={USAGE_RING_SIZE / 2} cy={USAGE_RING_SIZE / 2} r={USAGE_RING_R}
                  fill="none" stroke={ringColor} strokeWidth={USAGE_RING_SW} strokeLinecap="round"
                  strokeDasharray={USAGE_RING_CIRC}
                  strokeDashoffset={USAGE_RING_CIRC - (drawn ? frac : 0) * USAGE_RING_CIRC}
                  transform={`rotate(-90 ${USAGE_RING_SIZE / 2} ${USAGE_RING_SIZE / 2})`}
                  style={{ transition: `stroke-dashoffset 700ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 60}ms` }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: RADIUS_CIRCLE, backgroundColor: CAT_AVATAR_FILL, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {CATEGORY_ICONS[c.name]}
                </div>
              </div>
            </div>
            <div style={{ maxWidth: "100%", minWidth: 0, textAlign: "center" }}>
              <p style={{ ...typography.caption, fontWeight: 500, color: TEXT_PRIMARY, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</p>
              <p style={{ ...typography.metadata, color: over ? EXT_TEXT_NEGATIVE : TEXT_TERTIARY, margin: "2px 0 0", fontVariantNumeric: "tabular-nums" }}>
                {/* Ring shows the proportion; text stays compact — just what's LEFT (or OVER). */}
                {over ? `₹${formatCompactK(spend - c.cap)} over` : `₹${formatCompactK(c.cap - spend)} left`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Goals List Screen ───────────────────────────────────────

export default function GoalListScreen({
  goals,
  onGoalTap,
  onClose,
  onAddGoal,
  heroRingHidden = false,
  hideStatusBar = false,
}: {
  goals: GoalIndicatorData[];
  onGoalTap: (goal: GoalIndicatorData) => void;
  onClose: () => void;
  // "Add goal" header action — in the peek this dismisses the page (back to the chat to set one up).
  onAddGoal?: () => void;
  // During the shared-element peek transition the hero ring is hidden until the morphing ghost
  // lands on it (then it cross-fades in), so the ring isn't visible in two places at once.
  heroRingHidden?: boolean;
  // In the peek, the status bar is rendered fixed by the parent overlay — so this screen's own copy is
  // kept for layout (the app bar still sits below it) but made invisible, so it doesn't slide.
  hideStatusBar?: boolean;
}) {
  // Live budget tracker: the category budgets ARE the safe-to-spend, sliced per category. Total budget
  // = sum of caps; spending drains it. (Fixture stands in for the live snapshot.)
  const categories = SPENDING_PLAN_FIXTURE.categoryBudgets;
  const { monthly, spent } = getSafeToSpendSnapshot();
  const plan: SafeToSpendPlan = { monthly, spent, source: "full" };

  return (
    <div
      style={{ position: "relative", backgroundColor: BG_PRIMARY, display: "flex", flexDirection: "column", width: "100%", height: "100%" }}
    >
      {/* DLS Standard App Bar (Button type, no button) - scoped to this screen.
          In the peek (hideStatusBar) we render NO header here — the parent overlay floats a fixed,
          transparent copy of the chrome on top and the content scrolls UNDER it (see the scroll area's
          paddingTop). Rendering a reserved strip here would cover the scroll. Standalone (home) keeps
          its own opaque app bar; the page is still opaque (outer BG_PRIMARY) so the rising peek covers
          the chat app bar during the slide. */}
      {!hideStatusBar && (
        <div className="shrink-0" style={{ backgroundColor: BG_PRIMARY }}>
          <StatusBar />
          <div
            className="flex items-center"
            style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 12, paddingRight: 8 }}
          >
            {/* Title removed — the safe-to-spend hero below is the page's identity. */}
            <NavButton kind="close" onClick={onClose} frosted />
          </div>
        </div>
      )}

      {/* Money L1: safe-to-spend hero → budget (the why) → goals */}
      <div
        className="scrollbar-none [&::-webkit-scrollbar]:hidden"
        style={{ flex: 1, overflowY: hideStatusBar && heroRingHidden ? "hidden" : "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", paddingTop: hideStatusBar ? CHAT_APP_BAR_HEIGHT : 0, paddingBottom: BOTTOM_INSET + SPACE_L }}
      >
        <SafeToSpendHero plan={plan} ringHidden={heroRingHidden} />

        {/* Live budget tracker — each category's spend against its cap; the caps sum to the hero amount. */}
        <CategoryUsageList categories={categories} />

        {/* Goals */}
        <div style={{ marginTop: SPACE_L }}>
          <SectionHeader label="Goals" onAddGoal={onAddGoal ?? (() => {})} />
          <div style={{ height: 352, display: "flex", flexDirection: "column" }}>
            <GoalCarousel goals={goals} onGoalTap={onGoalTap} />
          </div>
        </div>
      </div>
      {/* Subtle top fade over the app-bar area — content dissolves into the bg as it scrolls under the
          transparent chrome (peek only, where the chrome floats over the scroll). Sits below the parent's
          fixed status bar + close (separate stacking context), so those glyphs stay crisp on top. */}
      {hideStatusBar && (
        <div
          aria-hidden
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: 112, pointerEvents: "none", background: `linear-gradient(to bottom, ${BG_PRIMARY} 0%, ${BG_PRIMARY} 74%, transparent 100%)` }}
        />
      )}
    </div>
  );
}
