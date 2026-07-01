"use client";

import { useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../lib/theme";
import { typography } from "../lib/typography";
import {
  VALENTINO_50, VALENTINO_400, VALENTINO_500, VALENTINO_700,
  GREEN_50, GREEN_400, GREEN_500,
  RED_50, RED_400, RED_500,
  ORANGE_50, ORANGE_400, ORANGE_500, ORANGE_600,
  BLUE_50, BLUE_400, BLUE_500,
  SLATE_50, SLATE_300, SLATE_500, SLATE_800,
  EXT_BG_SUBTLE_NEUTRAL, EXT_TEXT_NEUTRAL, EXT_BG_SUBTLE_MAIN,
  BG_PRIMARY, BG_SECONDARY, BG_CARD, BG_SHEET, CHAT_USER_BUBBLE,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, TEXT_DISABLED, TEXT_ON_COLOR_PRIMARY,
  OUTLINE_SUBTLE, OUTLINE_BOLD,
  CAT_AVATAR_FILL,
} from "../lib/colors";
import { RADIUS_S, RADIUS_M, RADIUS_PILL, RADIUS_CIRCLE } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";
import { formatDateRange } from "../lib/format-date";
import type { SpendingPlan } from "../lib/types";
import BudgetSummaryViz from "./BudgetSummaryViz";
import CategoryBudgetsViz from "./CategoryBudgetsViz";
import { StatusBar } from "./AppChrome";

// ─── Shared types ──────────────────────────────────────────

export type ChatCardData =
  | { type: "spend-overview"; month: string; amount: number; comparisonText: string; chartData: { label: string; value: number; caption?: string }[]; average: number; highlightIndex: number }
  | { type: "category-breakdown"; month: string; amount: number; subtext: string; showAll?: boolean; categories: { name: string; amount: number; pct: number; color: string; icon: ReactNode }[] }
  | { type: "investment-product"; productType: string; amount: number; rate: string; tenure: string; amountOptions: { label: string; value: number }[]; accountLabel: string; activated?: boolean; variant?: "single" | "chips"; recommendedAmount?: number; onContinue?: () => void; onInvest?: (amount: number) => void; onAmountSelect?: (amount: number) => void; onArrowTap?: () => void }
  | { type: "goal-progress"; name: string; pct: number; saved: number; target: number; daysLabel: string; status: "ahead" | "behind" | "on-track"; onArrowTap?: () => void }
  | { type: "savings-plan"; name: string; target: number; timeline: string; existingSavings: number; monthlyAmount: number; productType: string; productLabel: string; rate: string; pct: number; timelineLabel: string }
  | { type: "merchant-concentration"; month: string; totalSpend: number; totalMerchants?: number; merchants: { name: string; amount: number; pct: number; color: string }[] }
  | { type: "category-mom"; thisMonth: string; lastMonth: string; categories: { name: string; thisValue: number; lastValue: number; color: string }[] }
  | { type: "spending-heatmap"; month: string; year: number; startDay: number; dailySpend: (number | null)[]; maxSpend: number }
  | { type: "payment-mode-donut-v2"; month: string; totalSpend: number; modes: { name: string; amount: number; pct: number; color: string }[] }
  | { type: "transaction-table"; title: string; transactions: { date: string; merchant: string; amount: number; category: string }[] }
  | { type: "confirm-list"; label?: string; items: { id: string; payee: string; amount: number; type: string; subtext?: string }[]; monthlyIncome?: number; onSubmit?: (selected: { id: string; amount: number; type: string }[]) => void; submitted?: boolean; defaultAllSelected?: boolean; onArrowTap?: () => void; variant?: "sheet"; onClose?: () => void; chatEdit?: { seq: number; text: string } | null }
  | { type: "spend-trend"; month: string; chartData: { label: string; value: number; caption?: string }[]; average: number; highlightIndex: number }
  | { type: "add-to-pot"; goalName: string; amount: number; fromAccount: string; activated?: boolean; variant?: "single" | "chips"; recommendedAmount?: number; amountOptions?: { label: string; value: number }[]; planNote?: string; onAdd?: (amount: number) => void; onArrowTap?: () => void }
  | { type: "budget-summary"; plan: Pick<SpendingPlan, "income" | "obligations" | "savingsTarget" | "dailyPool"> }
  | { type: "category-budgets"; plan: Pick<SpendingPlan, "categoryBudgets"> };

// ─── Taxonomy aliases ─────────────────────────────────────
// Visualizations: 8 data displays (flat on surface, no bounding box)
export type VisualizationData = Extract<
  ChatCardData,
  | { type: "spend-overview" }
  | { type: "category-breakdown" }
  | { type: "merchant-concentration" }
  | { type: "category-mom" }
  | { type: "spending-heatmap" }
  | { type: "payment-mode-donut-v2" }
  | { type: "transaction-table" }
  | { type: "spend-trend" }
  | { type: "budget-summary" }
  | { type: "category-budgets" }
>;

// Widgets: 6 actionable items (enclosed container)
export type WidgetData = Extract<
  ChatCardData,
  | { type: "investment-product" }
  | { type: "confirm-list" }
  | { type: "add-to-pot" }
  | { type: "goal-progress" }
  | { type: "savings-plan" }
>;

// ─── Helpers ───────────────────────────────────────────────

function formatINR(amount: number): string {
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }
  if (amount >= 1000) {
    const k = amount / 1000;
    return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function formatINRFull(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

// Smooth bezier path through points using cardinal spline control points
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  if (points.length === 2) return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;

  const tension = 0.4;
  let d = `M${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

// ─── DLS Tag ──────────────────────────────────────────────
// DLS 2.0 Tag: 6 intents × 2 emphasis. Pill, Metadata font, uppercase.
// Ref: reference_tags.md

export const TAG_STYLES: Record<string, Record<string, { bg: string; text: string }>> = {
  subtle: {
    positive: { bg: GREEN_50, text: GREEN_500 },
    warning:  { bg: ORANGE_50, text: ORANGE_600 },
    negative: { bg: RED_50, text: RED_500 },
    brand:    { bg: VALENTINO_50, text: VALENTINO_500 },
    info:     { bg: BLUE_50, text: BLUE_500 },
    neutral:  { bg: EXT_BG_SUBTLE_NEUTRAL, text: EXT_TEXT_NEUTRAL },
  },
  bold: {
    positive: { bg: GREEN_500, text: BG_PRIMARY },
    warning:  { bg: ORANGE_500, text: BG_PRIMARY },
    negative: { bg: RED_400, text: BG_PRIMARY },
    brand:    { bg: VALENTINO_500, text: BG_PRIMARY },
    info:     { bg: BLUE_500, text: BG_PRIMARY },
    neutral:  { bg: SLATE_800, text: BG_PRIMARY },
  },
};

const TAG_BASE: Record<string, { c500: string; c400: string }> = {
  positive: { c500: GREEN_500, c400: GREEN_400 },
  warning:  { c500: ORANGE_500, c400: ORANGE_400 },
  negative: { c500: RED_500, c400: RED_400 },
  brand:    { c500: VALENTINO_500, c400: VALENTINO_400 },
  info:     { c500: BLUE_500, c400: BLUE_400 },
  neutral:  { c500: SLATE_500, c400: SLATE_300 },
};

export function DlsTag({
  intent = "neutral",
  emphasis = "subtle",
  children,
}: {
  intent?: "positive" | "warning" | "negative" | "brand" | "info" | "neutral";
  emphasis?: "subtle" | "bold";
  children: ReactNode;
}) {
  const { mode } = useTheme();
  const isDark = mode === "dark";
  // Subtle is theme-aware — the fixed pale-50 backgrounds washed out / vanished in dark, so use a
  // translucent tint of the intent colour + a brightened (/400) text in dark. Bold keeps its preset.
  const base = TAG_BASE[intent];
  const colors = emphasis === "bold"
    ? TAG_STYLES.bold[intent]
    : { bg: `color-mix(in srgb, ${base.c500} ${isDark ? 24 : 14}%, transparent)`, text: isDark ? base.c400 : base.c500 };
  return (
    <span
      style={{
        ...typography.metadata,
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 8px",
        borderRadius: RADIUS_CIRCLE,
        backgroundColor: colors.bg,
        color: colors.text,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

// ─── Shared card shell ─────────────────────────────────────

export const CARD_RADIUS = 16;
export const CARD_PAD = "24px";
export const CARD_SHADOW = "0px 2px 32px 0px rgba(0,0,0,0.05)";
// 1px bold outline so the card stroke reads in dark mode (OUTLINE_SUBTLE = white/.05 = invisible).
export const CARD_BORDER = `1px solid ${OUTLINE_BOLD}`;

// ─── Card header (shared) ──────────────────────────────────

export function CardHeader({ label, onArrowTap, arrowInvisible }: { label: string; onArrowTap?: () => void; arrowInvisible?: boolean }) {
  const arrowIcon = (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        backgroundColor: OUTLINE_SUBTLE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        opacity: arrowInvisible ? 0 : 1,
        transition: "opacity 300ms ease",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M3 10L10 3M10 3H4.5M10 3V8.5" stroke={TEXT_TERTIARY} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <span
        style={{
          ...typography.metadata,
          textTransform: "uppercase",
          color: TEXT_TERTIARY,
        }}
      >
        {label}
      </span>
      {onArrowTap && (
        <button
          type="button"
          onClick={onArrowTap}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: arrowInvisible ? "default" : "pointer",
            pointerEvents: arrowInvisible ? "none" : "auto",
          }}
          aria-label={`Open ${label} details`}
        >
          {arrowIcon}
        </button>
      )}
    </div>
  );
}

// ─── Confirmed row (shared) ────────────────────────────────
// Shown at the bottom of an actionable card once the action is done.

function ConfirmedRow({ label, onArrowTap }: { label: string; onArrowTap?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* Green check circle */}
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          backgroundColor: GREEN_500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5L3.5 6L8 1" stroke={TEXT_ON_COLOR_PRIMARY} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, flex: 1 }}>{label}</span>
      {onArrowTap && (
        <button
          type="button"
          onClick={onArrowTap}
          style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", display: "flex" }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M3 10L10 3M10 3H4.5M10 3V8.5" stroke={TEXT_TERTIARY} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Bucket-average downsampling — collapses a long day-wise series into evenly-spaced buckets and
// plots each bucket's MEAN. Averaging out the daily/weekly noise turns a dense "barcode" of spikes
// into a smooth trend line. Buckets are kept ~a week wide (so the weekly rhythm averages away),
// capped at `target` for multi-year ranges. Short series (<= target) are returned untouched so 1-month
// cards keep their daily detail.
// Downsample a long series into buckets, plotting each bucket's MEAN. Bucket SIZE is capped at 3 days
// so density stays ~10 points/month even on long ranges. Series <= maxPoints stay raw (1-month keeps
// daily detail).
//   30d → raw 30 pts   90d → 3-day → 30 pts   182d → 3-day → ~61 pts   365d → 3-day → ~122 pts
// The 3-day mean denoises vs raw daily; the spline smooths between.
function bucketAverage<T extends { value: number }>(data: T[], maxPoints: number): T[] {
  const n = data.length;
  if (n <= maxPoints) return data;
  const size = Math.min(Math.ceil(n / maxPoints), 3); // <= 3-day buckets → keeps ~10 pts/month
  const count = Math.ceil(n / size);
  const out: T[] = [];
  for (let b = 0; b < count; b++) {
    const lo = b * size;
    const hi = Math.min(lo + size, n);
    let sum = 0, cnt = 0;
    for (let j = lo; j < hi; j++) { sum += data[j].value; cnt++; }
    const mid = data[Math.min(lo + (size >> 1), n - 1)];
    out.push({ ...mid, value: Math.round(sum / Math.max(cnt, 1)) });
  }
  return out;
}

// ─── 1. Spend Overview Card ────────────────────────────────

function SpendOverviewCard({ data }: { data: Extract<ChatCardData, { type: "spend-overview" }> }) {
  const { month, chartData, average, highlightIndex } = data;

  // Scales to any period. Series ≤ MAX_POINTS render every point (1-month keeps daily detail); longer
  // ranges bucket-AVERAGE in ≤2-day buckets so density stays ~15 points/month even on the year view
  // (see bucketAverage). MAX_POINTS is just the raw-vs-bucket threshold.
  const MAX_POINTS = 44;
  const render = bucketAverage(chartData.map((d, i) => ({ ...d, _i: i })), MAX_POINTS);
  const n = render.length;

  // Default selection = the rendered point nearest the highlighted original index.
  let defaultIndex = n - 1;
  let bestDist = Infinity;
  for (let i = 0; i < n; i++) {
    const dist = Math.abs(render[i]._i - highlightIndex);
    if (dist < bestDist) { bestDist = dist; defaultIndex = i; }
  }

  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  // Continuous scrub position: x in viewBox units, y on the rendered line, plus the nearest data
  // index. null = at rest. Selection is transient — shows only while holding/hovering, clears on leave.
  const [scrub, setScrub] = useState<{ x: number; y: number; i: number } | null>(null);
  const scrubbing = scrub !== null;
  const activeIndex = scrub ? Math.min(scrub.i, n - 1) : defaultIndex;

  // Defensive: a period with no spend data has nothing to plot (hooks above run unconditionally).
  if (n === 0) return null;

  const W = 280;
  const H = 110;
  // Edge-to-edge: no horizontal inset, so the line spans the full card-content width (flush with the
  // header text above). The card's own padding absorbs the selection dot's ring at the far edges.
  const padX = 0;
  const padTop = 16;
  const padBottom = 26;
  const chartW = W - padX * 2;
  const chartH = H - padTop - padBottom;

  // Fit the Y-scale to the data's own min–max (markets-chart style — never anchored at 0) so every
  // period fills the chart height consistently, instead of flat smoothed long-range lines hugging
  // the top. Headroom keeps the peak/trough off the edges; guards a flat (zero-range) series.
  const vals = render.map((d) => d.value);
  const lo0 = Math.min(...vals, average);
  const hi0 = Math.max(...vals, average);
  const headroom = (hi0 - lo0) * 0.18 || hi0 * 0.1 || 1;
  const lo = lo0 - headroom;
  const span = (hi0 - lo0) + headroom * 2;
  const yOf = (v: number) => padTop + chartH - ((v - lo) / span) * chartH;
  const xPositions = render.map((_, i) => padX + (chartW / Math.max(n - 1, 1)) * i);
  const points = render.map((d, i) => ({ x: xPositions[i], y: yOf(d.value) }));
  const avgY = yOf(average);
  const linePath = smoothPath(points);

  const isMonthAxis = render.some((d, i) => i > 0 && d.label === render[i - 1].label);

  // Map an ORIGINAL day index to its x on the rendered line. The line is drawn through bucket points,
  // so x is linear in render index, not in day — interpolate by each bucket's source index `_i`. This
  // lets a month label sit at the TRUE boundary (the 1st of the month), which usually falls between
  // bucket nodes, instead of snapping to the node where the bucket's mid-day happened to cross over.
  const xOfDay = (day: number) => {
    if (day <= render[0]._i) return xPositions[0];
    if (day >= render[n - 1]._i) return xPositions[n - 1];
    let a = 0;
    while (a < n - 1 && render[a + 1]._i <= day) a++;
    const span = (render[a + 1]._i - render[a]._i) || 1;
    const t = (day - render[a]._i) / span;
    return xPositions[a] + t * (xPositions[a + 1] - xPositions[a]);
  };

  // X-axis labels (dense, n > 6). Month axis (3 months+): one tick per MONTH START, placed at the
  // boundary's true x from the original daily data — exactly where the month begins on the line. A
  // partial leading month is dropped if it crowds the next start; if starts are still too dense, fall
  // back to 3 spread markers. Day axis (1 month): ~5 evenly-spaced day-number anchors.
  type AxisLabel = { label: string; leftPct: number; tx: string };
  const axisLabels: AxisLabel[] = (() => {
    if (n <= 6) return [];
    if (isMonthAxis) {
      let starts: { label: string; x: number }[] = [];
      for (let d = 0; d < chartData.length; d++) {
        if (d === 0 || chartData[d].label !== chartData[d - 1].label) {
          starts.push({ label: chartData[d].label, x: xOfDay(d) });
        }
      }
      const minGap = chartW * 0.16; // below this two labels read as crowded
      // Drop a partial leading month that sits too close to the first real month start.
      if (starts.length >= 2 && starts[1].x - starts[0].x < minGap) starts = starts.slice(1);
      let crowded = false;
      for (let k = 1; k < starts.length; k++) {
        if (starts[k].x - starts[k - 1].x < minGap) { crowded = true; break; }
      }
      let chosen = starts;
      if (crowded) {
        // 3 spread markers; shift the first in one month if a year-long span repeats the endpoint
        // month, so the two ends never read as the same label.
        const last = starts.length - 1;
        const firstI = starts[0].label === starts[last].label && last >= 1 ? 1 : 0;
        const midI = Math.round((firstI + last) / 2);
        chosen = [starts[firstI], starts[midI], starts[last]].filter((m, idx, arr) => idx === 0 || m !== arr[idx - 1]);
      }
      return chosen.map((m) => {
        const leftPct = (m.x / W) * 100;
        // Label is CENTRED on the month-start x — the 1st sits under the middle of the text. Clamp to
        // edge-align only when centring would overflow the plot edge.
        const tx = leftPct <= 6 ? "translateX(0)" : leftPct >= 94 ? "translateX(-100%)" : "translateX(-50%)";
        return { label: m.label, leftPct, tx };
      });
    }
    const c = 5;
    const set = new Set<number>();
    for (let k = 0; k < c; k++) set.add(Math.round((k / (c - 1)) * (n - 1)));
    return [...set].sort((a, b) => a - b).map((i) => {
      const leftPct = (xPositions[i] / W) * 100;
      const tx = leftPct <= 7 ? "translateX(0)" : leftPct >= 93 ? "translateX(-100%)" : "translateX(-50%)";
      return { label: render[i].label, leftPct, tx };
    });
  })().filter((lab, i, arr) => i === 0 || lab.label !== arr[i - 1].label);

  // Nearest data index to an x (viewBox units). Drives the header value/date — it snaps to a point
  // even though the handle itself rides the line continuously, so the value holds steady across the
  // small range around each point (rather than ticking with every pixel).
  const nearestIndex = (svgX: number) => {
    let closest = 0, minDist = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(svgX - xPositions[i]);
      if (d < minDist) { minDist = d; closest = i; }
    }
    return closest;
  };

  // Exact y on the rendered spline at a given x — binary search over the path length (x is monotonic
  // left→right). Lets the handle glide along the curve under the finger instead of snapping point to
  // point; falls back to the nearest point's y before the path element has mounted.
  const yOnPathAtX = (svgX: number) => {
    const path = pathRef.current;
    if (!path) return points[nearestIndex(svgX)].y;
    const total = path.getTotalLength();
    let loL = 0, hiL = total;
    for (let k = 0; k < 24; k++) {
      const mid = (loL + hiL) / 2;
      if (path.getPointAtLength(mid).x < svgX) loL = mid; else hiL = mid;
    }
    return path.getPointAtLength((loL + hiL) / 2).y;
  };

  // Continuous scrub: the dot follows the pointer x exactly (clamped to the plot), riding the line;
  // the selected DATA index snaps to the nearest point. Transient — clears on release/leave.
  const scrubTo = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    let sx = ((clientX - rect.left) / rect.width) * W;
    sx = Math.max(xPositions[0], Math.min(xPositions[n - 1], sx));
    setScrub({ x: sx, y: yOnPathAtX(sx), i: nearestIndex(sx) });
  };
  const beginScrub = (e: React.PointerEvent) => {
    try { (e.target as Element).setPointerCapture(e.pointerId); } catch {}
    scrubTo(e.clientX);
  };
  const moveScrub = (e: React.PointerEvent) => { scrubTo(e.clientX); };
  const endScrub = () => { setScrub(null); };

  const dotX = scrub ? scrub.x : points[activeIndex].x;
  const dotY = scrub ? scrub.y : points[activeIndex].y;
  const activeMonthLabel = render[activeIndex].label;
  const activeMonthValue = render[activeIndex].value;
  const activeCaption = render[activeIndex].caption;

  // Compute comparison text dynamically for any selected month
  const pctDiff = average > 0 ? Math.round(((activeMonthValue - average) / average) * 100) : 0;
  const comparisonLabel = pctDiff > 0
    ? `${pctDiff}% higher than your average`
    : pctDiff < 0
    ? `${Math.abs(pctDiff)}% lower than your average`
    : "On par with your average";

  // Color-code: green = under average, orange = slightly over (≤15%), red = significantly over
  const comparisonColor = pctDiff <= 0 ? GREEN_500 : pctDiff <= 15 ? ORANGE_500 : RED_500;

  // SVG chart height excludes month labels (those are HTML now)
  const svgH = 80;

  const chart = (
    <div>
      <svg
        ref={svgRef}
        width={W}
        height={svgH}
        viewBox={`0 0 ${W} ${svgH}`}
        style={{ width: "100%", height: "auto", overflow: "visible", display: "block", touchAction: "none" }}
        onPointerDown={beginScrub}
        onPointerMove={moveScrub}
        onPointerUp={endScrub}
        onPointerLeave={endScrub}
        onPointerCancel={endScrub}
      >
        <path ref={pathRef} d={linePath} fill="none" stroke={VALENTINO_500} strokeWidth={n > 60 ? 1.5 : 2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Average dashed line — TEXT_DISABLED: subtle in both modes (TEXT_TERTIARY read too strong;
            OUTLINE_SUBTLE was invisible on the dark surface, so this sits between). */}
        <line x1={padX} y1={avgY} x2={W - padX} y2={avgY} stroke={TEXT_DISABLED} strokeWidth="1" strokeDasharray="5 4" />

        {/* Selection — transient (holds/hovers only, clears on release). The dot rides the line under
            the finger (continuous x; y sampled on the spline) while the header value snaps to the
            nearest point. Ringed in the bg colour (white light / canvas dark) so it cuts cleanly off
            the line; the ring is a touch heavier (4px) to separate dot from line. No tooltip. */}
        <g style={{ opacity: scrubbing ? 1 : 0, transition: "opacity 120ms ease-out" }} pointerEvents="none">
          <line x1={dotX} y1={0} x2={dotX} y2={svgH} stroke={VALENTINO_500} strokeWidth="1" opacity="0.18" />
          <circle cx={dotX} cy={dotY} r={6} fill={VALENTINO_500} stroke={BG_PRIMARY} strokeWidth="4" />
        </g>
      </svg>

      {/* X labels — all-caps metadata style across the board. Sparse (monthly): every point, active
          emphasised. Dense: month-boundary (or thinned) anchors, edge-aware, never overlapping. */}
      {n <= 6 ? (
        <div style={{ display: "flex", alignItems: "center", marginTop: 12 }}>
          {render.map((d, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <span style={{ ...typography.metadata, textTransform: "uppercase", color: i === activeIndex ? TEXT_PRIMARY : TEXT_TERTIARY, fontWeight: i === activeIndex ? 500 : undefined }}>
                {d.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ position: "relative", height: 18, marginTop: 12 }}>
          {axisLabels.map((lab, k) => (
            <span
              key={k}
              style={{ position: "absolute", left: `${lab.leftPct}%`, transform: lab.tx, ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY, whiteSpace: "nowrap" }}
            >
              {lab.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  // Derive display values from active selection. Day-wise points carry a full-date caption; monthly
  // cards fall back to the label (or the card's month at the default selection).
  const displayMonth = activeCaption ?? (activeIndex === defaultIndex ? month : activeMonthLabel);
  const displayAmount = activeMonthValue;

  return (
    <div style={{ padding: "4px 0 8px" }}>
      <p style={{ ...typography.caption, color: TEXT_TERTIARY, marginBottom: 8 }}>
        {displayMonth} spends
      </p>
      <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, marginBottom: 4 }}>
        {formatINRFull(displayAmount)}
      </p>
      <p style={{ ...typography.caption, color: comparisonColor, marginBottom: 12 }}>
        {comparisonLabel}
      </p>
      {chart}
    </div>
  );
}

// ─── 2. Category Breakdown Card ────────────────────────────

// Category icons - Figma-exported SVGs from App Icons revamp (file YUtykzPm1pBjyybXESzlTK)
function CatImg({ src }: { src: string }) {
  // Tint the glyph via CSS mask so it themes — dark-grey in light, light-grey in dark —
  // rather than an <img> with baked dark strokes that vanish on the dark avatar disc.
  return (
    <div
      aria-hidden="true"
      style={{
        // DLS icons carry generous internal padding (24px glyph in a 56px box ≈ 43%). Our category
        // SVGs are tight (glyph fills the viewBox), so render them small inside the ~40px disc to
        // recreate that padding instead of letting the art touch the edges.
        width: 20,
        height: 20,
        flexShrink: 0,
        backgroundColor: TEXT_SECONDARY,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

const CAT_ICON_PATH = "/icons/categories";

export const CATEGORY_ICONS: Record<string, ReactNode> = {
  // Sentence-case display keys (canonical for rendered labels)
  "Food & drinks":              <CatImg src={`${CAT_ICON_PATH}/food-drinks.svg`} />,
  "Food & delivery":            <CatImg src={`${CAT_ICON_PATH}/food-drinks.svg`} />,
  "Food delivery (Swiggy)":     <CatImg src={`${CAT_ICON_PATH}/food-drinks.svg`} />,
  "Dining out (Swiggy Dineout)": <CatImg src={`${CAT_ICON_PATH}/food-drinks.svg`} />,
  "Food & dining":              <CatImg src={`${CAT_ICON_PATH}/food-drinks.svg`} />,
  "Food":                       <CatImg src={`${CAT_ICON_PATH}/food-drinks.svg`} />,
  "Transport":                  <CatImg src={`${CAT_ICON_PATH}/transport.svg`} />,
  "Groceries":                  <CatImg src={`${CAT_ICON_PATH}/groceries.svg`} />,
  "Groceries (Swiggy Instamart)": <CatImg src={`${CAT_ICON_PATH}/groceries.svg`} />,
  "Shopping":                   <CatImg src={`${CAT_ICON_PATH}/shopping.svg`} />,
  "Shopping (Amazon)":          <CatImg src={`${CAT_ICON_PATH}/shopping.svg`} />,
  "Entertainment":              <CatImg src={`${CAT_ICON_PATH}/entertainment.svg`} />,
  "Travel":                     <CatImg src={`${CAT_ICON_PATH}/travel.svg`} />,
  "Medical":                    <CatImg src={`${CAT_ICON_PATH}/medical.svg`} />,
  "Health":                     <CatImg src={`${CAT_ICON_PATH}/medical.svg`} />,
  "Personal":                   <CatImg src={`${CAT_ICON_PATH}/personal.svg`} />,
  "Transfers":                  <CatImg src={`${CAT_ICON_PATH}/transfers.svg`} />,
  "Cash withdrawals (ATM)":     <CatImg src={`${CAT_ICON_PATH}/transfers.svg`} />,
  "Bills":                      <CatImg src={`${CAT_ICON_PATH}/bills.svg`} />,
  "Utilities":                  <CatImg src={`${CAT_ICON_PATH}/bills.svg`} />,
  "Services":                   <CatImg src={`${CAT_ICON_PATH}/services.svg`} />,
  "Subscription":               <CatImg src={`${CAT_ICON_PATH}/subscription.svg`} />,
  "Subscriptions":              <CatImg src={`${CAT_ICON_PATH}/subscription.svg`} />,
  "Repayment":                  <CatImg src={`${CAT_ICON_PATH}/repayment.svg`} />,
  "Self transfer":              <CatImg src={`${CAT_ICON_PATH}/self-transfer.svg`} />,
  "Gaming":                     <CatImg src={`${CAT_ICON_PATH}/gaming.svg`} />,
  "Logistics":                  <CatImg src={`${CAT_ICON_PATH}/logistics.svg`} />,
  "Insurance":                  <CatImg src={`${CAT_ICON_PATH}/insurance.svg`} />,
  "Investment":                 <CatImg src={`${CAT_ICON_PATH}/investment.svg`} />,
  "Other / uncategorized":      <CatImg src={`${CAT_ICON_PATH}/miscellaneous.svg`} />,
  "Miscellaneous":              <CatImg src={`${CAT_ICON_PATH}/miscellaneous.svg`} />,
  "Misc":                       <CatImg src={`${CAT_ICON_PATH}/miscellaneous.svg`} />,
  // Title-case aliases (for upstream JSON data taxonomy compatibility)
  "Food & Drinks":              <CatImg src={`${CAT_ICON_PATH}/food-drinks.svg`} />,
  "Food Delivery (Swiggy)":     <CatImg src={`${CAT_ICON_PATH}/food-drinks.svg`} />,
  "Dining Out (Swiggy Dineout)": <CatImg src={`${CAT_ICON_PATH}/food-drinks.svg`} />,
  "Food & Dining":              <CatImg src={`${CAT_ICON_PATH}/food-drinks.svg`} />,
  "Cash Withdrawals (ATM)":     <CatImg src={`${CAT_ICON_PATH}/transfers.svg`} />,
  "Self Transfer":              <CatImg src={`${CAT_ICON_PATH}/self-transfer.svg`} />,
  "Other / Uncategorized":      <CatImg src={`${CAT_ICON_PATH}/miscellaneous.svg`} />,
};

// Bar-chart fill colors - mapped to closest DLS 2.0 primitives
export const CATEGORY_COLORS: Record<string, string> = {
  // Sentence-case display keys (canonical for rendered labels)
  "Food & drinks":              ORANGE_500,
  "Food & delivery":            ORANGE_500,
  "Food delivery (Swiggy)":     ORANGE_500,
  "Dining out (Swiggy Dineout)": RED_500,
  "Food & dining":              ORANGE_500,
  "Food":                       ORANGE_500,
  "Transport":                  VALENTINO_400,
  "Groceries":                  GREEN_500,
  "Groceries (Swiggy Instamart)": GREEN_500,
  "Shopping":                   ORANGE_600,
  "Shopping (Amazon)":          ORANGE_600,
  "Entertainment":              RED_400,
  "Travel":                     BLUE_500,
  "Medical":                    BLUE_400,
  "Health":                     GREEN_400,
  "Personal":                   VALENTINO_500,
  "Transfers":                  GREEN_400,
  "Cash withdrawals (ATM)":     SLATE_500,
  "Bills":                      BLUE_500,
  "Utilities":                  ORANGE_400,
  "Services":                   RED_400,
  "Subscription":               BLUE_400,
  "Subscriptions":              BLUE_400,
  "Repayment":                  GREEN_500,
  "Self transfer":              GREEN_400,
  "Gaming":                     SLATE_500,
  "Logistics":                  ORANGE_400,
  "Insurance":                  VALENTINO_700,
  "Investment":                 RED_400,
  "Other / uncategorized":      SLATE_300,
  "Miscellaneous":              SLATE_300,
  "Misc":                       SLATE_300,
  // Title-case aliases (for upstream JSON data taxonomy compatibility)
  "Food & Drinks":              ORANGE_500,
  "Food Delivery (Swiggy)":     ORANGE_500,
  "Dining Out (Swiggy Dineout)": RED_500,
  "Food & Dining":              ORANGE_500,
  "Cash Withdrawals (ATM)":     SLATE_500,
  "Self Transfer":              GREEN_400,
  "Other / Uncategorized":      SLATE_300,
};

// Map fill color → /50 track shade from the same DLS palette
const COLOR_TRACK: Record<string, string> = {
  [ORANGE_500]: ORANGE_50,
  [ORANGE_400]: ORANGE_50,
  [ORANGE_600]: ORANGE_50,
  [GREEN_500]: GREEN_50,
  [GREEN_400]: GREEN_50,
  [RED_500]: RED_50,
  [RED_400]: RED_50,
  [VALENTINO_400]: VALENTINO_50,
  [VALENTINO_500]: VALENTINO_50,
  [VALENTINO_700]: VALENTINO_50,
  [BLUE_400]: BLUE_50,
  [BLUE_500]: BLUE_50,
  [SLATE_500]: SLATE_50,
  [SLATE_300]: SLATE_50,
};

export function trackColor(fill: string): string {
  return COLOR_TRACK[fill] ?? SLATE_50;
}

// Dim a hex colour to a translucent tint of ITSELF — readable on both light and
// dark floors. Used for deselected donut arcs so they stay distinct by hue,
// instead of all collapsing to one SLATE_50 grey (COLOR_TRACK misses unmapped /
// lowercase hexes, which on dark read as identical pale near-white).
function dimColor(c: string, alpha = 0.4): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(c);
  if (!m) return c;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function CategoryBreakdownCard({ data }: { data: Extract<ChatCardData, { type: "category-breakdown" }> }) {
  const { month, amount, subtext, showAll, categories } = data;

  // Enforce max 5 items: if >5, show top 4 + "Other" rollup
  const capped = (() => {
    if (categories.length <= 5) return categories;
    const top4 = categories.slice(0, 4);
    const rest = categories.slice(4);
    const otherAmount = rest.reduce((s, c) => s + c.amount, 0);
    const otherPct = rest.reduce((s, c) => s + c.pct, 0);
    return [...top4, { name: "Other", amount: otherAmount, pct: otherPct, color: SLATE_300, icon: CATEGORY_ICONS["Miscellaneous"] }];
  })();

  const displayCats = showAll ? capped : capped.slice(0, 3);

  const categoryRows = (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {displayCats.map((cat) => (
        <div
          key={cat.name}
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            paddingTop: 10,
            paddingBottom: 10,
          }}
        >
          {/* Avatar — white disc in light, faint 10% disc in dark; bold 1px outline both modes. */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: RADIUS_CIRCLE,
              backgroundColor: CAT_AVATAR_FILL,
              border: `1px solid ${OUTLINE_BOLD}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {cat.icon}
          </div>

          {/* Name + progress bar */}
          <div style={{ flex: "1 0 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY, margin: 0 }}>
              {cat.name}
            </p>
            <div style={{ paddingTop: 4, paddingBottom: 4 }}>
              <div style={{ height: 8, backgroundColor: `color-mix(in srgb, ${cat.color} 10%, transparent)`, borderRadius: RADIUS_CIRCLE, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min(cat.pct, 100)}%`,
                    height: "100%",
                    backgroundColor: cat.color,
                    borderRadius: RADIUS_CIRCLE,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Amount + percentage */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
            <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY, textAlign: "right", whiteSpace: "nowrap", margin: 0 }}>
              {formatINRFull(cat.amount)}
            </p>
            <p style={{ ...typography.caption, color: TEXT_SECONDARY, textAlign: "right", whiteSpace: "nowrap", margin: 0 }}>
              {cat.pct}%
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: "4px 0 8px" }}>
      <p style={{ ...typography.caption, color: TEXT_TERTIARY, marginBottom: 8 }}>
        {month} spends
      </p>
      <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, marginBottom: 4 }}>
        {formatINRFull(amount)}
      </p>
      <p style={{ ...typography.caption, color: TEXT_TERTIARY, marginBottom: 16 }}>
        {subtext}
      </p>
      {categoryRows}
    </div>
  );
}

// ─── Amount chooser (shared, chips variant) ─────────────────
// Headline amount + suggestion chips (2 alternatives + Custom).
// Tapping a value chip swaps the headline; tapping Custom turns the
// headline into an editable numeric input that opens the device numpad.

type AmountOption = { label: string; value: number };

export function AmountChooser({
  recommendedAmount,
  amountOptions,
  metaLine,
  label,
  onChange,
}: {
  recommendedAmount: number;
  amountOptions: AmountOption[];
  metaLine?: ReactNode;
  label?: string;
  onChange: (amount: number) => void;
}) {
  const [selectedKey, setSelectedKey] = useState<string>("recommended");
  const [customValue, setCustomValue] = useState<string>("");

  const customNumber = customValue === "" ? 0 : Number(customValue) || 0;
  const isCustom = selectedKey === "custom";

  const currentAmount = isCustom
    ? customNumber
    : selectedKey === "recommended"
      ? recommendedAmount
      : Number(selectedKey);

  const lastAmountRef = useRef<number | null>(null);
  if (lastAmountRef.current !== currentAmount) {
    lastAmountRef.current = currentAmount;
    queueMicrotask(() => onChange(currentAmount));
  }

  const selectChip = (key: string) => {
    setSelectedKey(key);
    if (key !== "custom") setCustomValue("");
  };

  return (
    <>
      {/* Optional label + amount stacked on the left; keypad affordance vertically centred against
          BOTH (not just the amount). Tap the keypad to type any amount. */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {label && (
            <p style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY, margin: "0 0 4px" }}>{label}</p>
          )}
          {isCustom ? (
            <input
              autoFocus
              inputMode="numeric"
              pattern="[0-9]*"
              // Show the formatted ₹ + Indian grouping while editing (keeps the symbol + commas, doesn't
              // strip to raw digits); onChange parses the digits back out.
              value={customValue === "" ? "" : formatINRFull(customNumber)}
              onChange={(e) => setCustomValue(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="₹0"
              style={{
                ...typography.headerH1,
                // Inputs don't inherit font-family — without this the value rendered in the system font
                // at a different height, which grew the card on focus.
                fontFamily: "var(--font-rubik), sans-serif",
                // Pin the box to the exact height the static <p> renders at, so swapping <p>↔<input>
                // on focus can't reflow the card (inputs otherwise reserve UA line-box metrics).
                lineHeight: "32px",
                height: 32,
                boxSizing: "border-box",
                display: "block",
                color: TEXT_PRIMARY,
                border: "none",
                outline: "none",
                background: "transparent",
                padding: 0,
                margin: 0,
                width: "100%",
                caretColor: VALENTINO_500,
              }}
            />
          ) : (
            <p style={{ ...typography.headerH1, lineHeight: "32px", height: 32, color: TEXT_PRIMARY, margin: 0 }}>
              {formatINRFull(currentAmount)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            if (isCustom) {
              selectChip("recommended");
            } else {
              // Pre-fill with the current amount so editing starts from the suggestion, not 0.
              setCustomValue(String(Math.round(currentAmount)));
              selectChip("custom");
            }
          }}
          aria-label={isCustom ? "Use the suggested amount" : "Enter a custom amount"}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${isCustom ? VALENTINO_500 : OUTLINE_SUBTLE}`,
            backgroundColor: isCustom ? `color-mix(in srgb, ${VALENTINO_500} 16%, transparent)` : BG_PRIMARY,
            color: isCustom ? VALENTINO_500 : TEXT_TERTIARY,
            cursor: "pointer",
            padding: 0,
            transition: "all 150ms ease",
          }}
        >
          {/* Pencil (edit) glyph — signals "edit this amount", not a keypad. Tap still opens entry. */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10.8 2.7a1.1 1.1 0 0 1 1.6 0l0.9 0.9a1.1 1.1 0 0 1 0 1.6L5.6 12.9 2.5 13.5l0.6-3.1 7.7-7.7Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {metaLine ? <div style={{ marginBottom: 16 }}>{metaLine}</div> : <div style={{ marginBottom: 16 }} />}

      <div style={{ height: 1, backgroundColor: OUTLINE_SUBTLE, marginBottom: 16 }} />
    </>
  );
}


// ─── 3. Investment Product Card ────────────────────────────
// Matches Figma: Chatbot / node 16703:18825

function InvestmentProductCard({ data }: { data: Extract<ChatCardData, { type: "investment-product" }> }) {
  const { productType, amount, rate, tenure, amountOptions, accountLabel, activated, variant, recommendedAmount, onContinue, onArrowTap } = data;
  const isChips = variant === "chips";
  const baseAmount = recommendedAmount ?? amount;

  const [selectedAmount, setSelectedAmount] = useState<number>(baseAmount);
  const [tapped, setTapped] = useState(false);
  const done = activated || tapped;

  const shell = { backgroundColor: BG_PRIMARY, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: CARD_PAD, boxShadow: CARD_SHADOW };

  const rateLine = (
    <p style={{ ...typography.caption, color: GREEN_500 }}>{rate} · {tenure}</p>
  );

  return (
    <div style={shell}>
      <CardHeader label={productType} onArrowTap={onArrowTap} arrowInvisible={!done} />

      {isChips ? (
        <AmountChooser
          recommendedAmount={baseAmount}
          amountOptions={amountOptions}
          metaLine={rateLine}
          onChange={setSelectedAmount}
        />
      ) : (
        <>
          <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, marginBottom: 4 }}>
            {formatINRFull(amount)}
          </p>
          <p style={{ ...typography.caption, color: GREEN_500, marginBottom: 16 }}>
            {rate} · {tenure}
          </p>
          <div style={{ height: 1, backgroundColor: OUTLINE_SUBTLE, marginBottom: 16 }} />
        </>
      )}

      {done ? (
        <>
          <ConfirmedRow label={`${productType} set up`} onArrowTap={onArrowTap} />
          {isChips && (
            <div style={{ paddingTop: 16, marginTop: 16, borderTop: `1px solid ${OUTLINE_SUBTLE}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ ...typography.bodyNormal, color: TEXT_SECONDARY, margin: 0 }}>
                Monthly autopay
              </p>
              <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, whiteSpace: "nowrap" }}>
                {formatINRFull(selectedAmount)}<span style={{ ...typography.bodySmall, color: TEXT_TERTIARY }}>/mo</span>
              </span>
            </div>
          )}
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY, marginBottom: 4 }}>
              Paying from
            </p>
            <p style={{ ...typography.buttonSmall, color: TEXT_SECONDARY }}>
              {accountLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { if (isChips) setTapped(true); onContinue?.(); }}
            style={{
              ...typography.buttonSmall,
              border: "none",
              background: "transparent",
              color: VALENTINO_500,
              cursor: "pointer",
              padding: "4px 0",
              flexShrink: 0,
            }}
          >
            {isChips ? "Add & set up autopay" : "Set up"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Add to Pot Card (simplified one-tap action) ──────────

function AddToPotCard({ data }: { data: Extract<ChatCardData, { type: "add-to-pot" }> }) {
  const { goalName, amount, fromAccount, activated, variant, recommendedAmount, amountOptions, planNote, onAdd, onArrowTap } = data;
  const isChips = variant === "chips";
  const baseAmount = recommendedAmount ?? amount;

  const [selectedAmount, setSelectedAmount] = useState<number>(baseAmount);
  const [tapped, setTapped] = useState(false);
  const done = activated || tapped;
  const confirmedAmount = isChips ? selectedAmount : amount;

  const shell = { backgroundColor: BG_PRIMARY, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: CARD_PAD, boxShadow: CARD_SHADOW };

  // Confirmed state - collapse into a receipt (no chips, no action row)
  if (done) {
    return (
      <div style={shell}>
        {/* Label + amount stacked on the left; arrow vertically centred against BOTH (not just the label). */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY, margin: "0 0 4px" }}>{goalName}</p>
            <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0, lineHeight: 1 }}>
              {formatINRFull(confirmedAmount)}
            </p>
          </div>
          {onArrowTap && (
            <button type="button" onClick={onArrowTap} aria-label={`Open ${goalName} details`} className="animate-share-pop" style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", flexShrink: 0, transformOrigin: "center", display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36 }}>
              {/* Bare right chevron (tap-the-row affordance) — no circular container, pops in on reveal */}
              <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
                <path d="M5 3L9 7L5 11" stroke={TEXT_TERTIARY} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
        {isChips && (
          <div style={{ paddingTop: 16, marginTop: 16, borderTop: `1px solid ${OUTLINE_SUBTLE}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ ...typography.bodyNormal, color: TEXT_SECONDARY, margin: 0 }}>
              Monthly autopay
            </p>
            <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, whiteSpace: "nowrap" }}>
              {formatINRFull(baseAmount)}<span style={{ ...typography.bodySmall, color: TEXT_TERTIARY }}>/mo</span>
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={shell}>
      {/* Chips variant carries the goal label inside AmountChooser (so the keypad centres against
          label + amount); the simple variant keeps the standard CardHeader. */}
      {!isChips && <CardHeader label={goalName} />}

      {isChips ? (
        <AmountChooser
          recommendedAmount={baseAmount}
          amountOptions={amountOptions ?? []}
          label={goalName}
          onChange={setSelectedAmount}
        />
      ) : (
        <>
          <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, marginBottom: 16 }}>
            {formatINRFull(amount)}
          </p>
          <div style={{ height: 1, backgroundColor: OUTLINE_SUBTLE, marginBottom: 16 }} />
        </>
      )}

      {/* Plain-language plan: a head-start deposit now, then a monthly autopay — so the amount reads as
          a plan, not a random lump. */}
      {planNote && (
        <p style={{ ...typography.bodySmall, color: TEXT_SECONDARY, margin: "0 0 16px" }}>{planNote}</p>
      )}

      {/* Funding source is fixed (savings), so no "Change" CTA — it implied a choice that doesn't exist. */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY, marginBottom: 4 }}>
          Paying from
        </p>
        <p style={{ ...typography.buttonSmall, color: TEXT_SECONDARY }}>
          {fromAccount}
        </p>
      </div>
      {/* Filled Valentino primary pinned to the card footer — reads unmistakably as the CTA, short label
          (was a transparent two-line text label that didn't look tappable). */}
      <button
        type="button"
        onClick={() => { setTapped(true); onAdd?.(selectedAmount); }}
        className="active:scale-[0.98] transition-transform"
        style={{ ...typography.buttonNormal, width: "100%", height: 48, borderRadius: RADIUS_CIRCLE, backgroundColor: VALENTINO_500, color: TEXT_ON_COLOR_PRIMARY, border: "none", cursor: "pointer" }}
      >
        {isChips ? "Start autopay" : "Add"}
      </button>
    </div>
  );
}

// ─── 4. Goal Progress Card ─────────────────────────────────

function GoalProgressCard({ data }: { data: Extract<ChatCardData, { type: "goal-progress" }> }) {
  const { name, pct, saved, target, daysLabel, status, onArrowTap } = data;
  const clampedPct = Math.min(pct, 100);
  const statusIntent = status === "ahead" ? "positive" : status === "behind" ? "negative" : "warning";

  const shell = { backgroundColor: BG_PRIMARY, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: CARD_PAD, boxShadow: CARD_SHADOW } as const;

  return (
    <div style={shell}>
      {/* Header row: label left, status tag right */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY }}>
          Goal progress
        </span>
        <DlsTag intent={statusIntent} emphasis="subtle">{daysLabel}</DlsTag>
      </div>

      {/* Hero: goal name */}
      <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0, marginBottom: 16 }}>
        {name}
      </p>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: OUTLINE_SUBTLE, marginBottom: 16 }} />

      {/* Progress bar */}
      <div style={{ height: 8, backgroundColor: VALENTINO_50, borderRadius: RADIUS_CIRCLE, overflow: "hidden", marginBottom: 8 }}>
        <div
          style={{
            width: `${clampedPct}%`,
            height: "100%",
            backgroundColor: VALENTINO_500,
            borderRadius: RADIUS_CIRCLE,
            boxShadow: "0px 2px 4px rgba(211,10,215,0.2)",
          }}
        />
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ ...typography.bodyNormal, color: TEXT_TERTIARY }}>
          {formatINRFull(saved)} / {formatINRFull(target)}
        </span>
        <span style={{ ...typography.headerH4, color: TEXT_PRIMARY }}>
          {pct}%
        </span>
      </div>
    </div>
  );
}

// ─── 5. Savings Plan Card ─────────────────────────────────

function SavingsPlanCard({ data }: { data: Extract<ChatCardData, { type: "savings-plan" }> }) {
  const { name, target, timeline, existingSavings, monthlyAmount, productType, rate, pct, timelineLabel } = data;
  const clampedPct = Math.min(pct, 100);

  const shell = { backgroundColor: BG_PRIMARY, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: CARD_PAD, boxShadow: CARD_SHADOW } as const;

  return (
    <div style={shell}>
      <CardHeader label="Savings plan" />

      <p style={{ ...typography.headerH4, color: TEXT_PRIMARY, marginBottom: 4 }}>
        {name}
      </p>
      <p style={{ ...typography.caption, color: TEXT_TERTIARY, marginBottom: 16 }}>
        {formatINRFull(target)} by {timeline}
      </p>

      {/* Progress bar */}
      <div style={{ height: 8, backgroundColor: VALENTINO_50, borderRadius: RADIUS_CIRCLE, overflow: "hidden", marginBottom: 16 }}>
        <div
          style={{
            width: `${clampedPct}%`,
            height: "100%",
            backgroundColor: VALENTINO_500,
            borderRadius: RADIUS_CIRCLE,
            boxShadow: "0px 2px 4px rgba(211,10,215,0.2)",
          }}
        />
      </div>

      {/* Detail rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {existingSavings > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>Existing savings applied</span>
            <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{formatINRFull(existingSavings)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>Monthly via {productType}</span>
          <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{formatINRFull(monthlyAmount)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>Rate</span>
          <span style={{ ...typography.buttonSmall, color: GREEN_500 }}>{rate}</span>
        </div>
      </div>

      {/* Hairline */}
      <div style={{ height: 1, backgroundColor: OUTLINE_SUBTLE, marginBottom: 12 }} />

      {/* Timeline label */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "4px 8px",
          borderRadius: RADIUS_CIRCLE,
          backgroundColor: BLUE_50,
        }}
      >
        <span style={{ ...typography.metadata, textTransform: "uppercase", color: BLUE_500 }}>
          {timelineLabel}
        </span>
      </div>
    </div>
  );
}

// ─── 6. Merchant Concentration Bar ────────────────────────

const PALETTE = [VALENTINO_500, BLUE_500, ORANGE_500, GREEN_500, RED_500, VALENTINO_700, BLUE_400, ORANGE_400, GREEN_400, SLATE_500];

function MerchantConcentrationCard({ data }: { data: Extract<ChatCardData, { type: "merchant-concentration" }> }) {
  const { month, totalSpend, totalMerchants, merchants } = data;
  const merchantCount = totalMerchants ?? merchants.length;

  // Enforce max 5 items: if >5, show top 4 + "Other" rollup
  const displayMerchants = (() => {
    if (merchants.length <= 5) return merchants;
    const top4 = merchants.slice(0, 4);
    const rest = merchants.slice(4);
    const otherAmount = rest.reduce((s, m) => s + m.amount, 0);
    const otherPct = rest.reduce((s, m) => s + m.pct, 0);
    return [...top4, { name: "Other", amount: otherAmount, pct: otherPct, color: SLATE_300 }];
  })();

  const rows = (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {displayMerchants.map((m, i) => (
        <div key={m.name} style={{ display: "flex", gap: 12, alignItems: "center", paddingTop: 16, paddingBottom: 16 }}>
          {/* Initial avatar — neutral disc matching CategoryBreakdownCard:
             white in light, faint 10% white in dark (CAT_AVATAR_FILL). The bar
             below keeps the merchant colour. */}
          <div style={{
            width: 40, height: 40, borderRadius: RADIUS_CIRCLE,
            backgroundColor: CAT_AVATAR_FILL,
            border: `1px solid ${OUTLINE_BOLD}`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>
              {m.name.charAt(0).toUpperCase()}
            </span>
          </div>
          {/* Name + bar */}
          <div style={{ flex: "1 0 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            <p style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {m.name}
            </p>
            <div style={{ paddingTop: 4, paddingBottom: 4 }}>
              <div style={{ height: 8, backgroundColor: `color-mix(in srgb, ${m.color || PALETTE[i % PALETTE.length]} 10%, transparent)`, borderRadius: RADIUS_CIRCLE, overflow: "hidden" }}>
                <div style={{
                  width: `${(m.amount / totalSpend) * 100}%`,
                  height: "100%",
                  backgroundColor: m.color || PALETTE[i % PALETTE.length],
                  borderRadius: RADIUS_CIRCLE,
                }} />
              </div>
            </div>
          </div>
          {/* Amount + percentage */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
            <p style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, textAlign: "right", whiteSpace: "nowrap", margin: 0 }}>
              {formatINRFull(m.amount)}
            </p>
            <p style={{ ...typography.caption, color: TEXT_SECONDARY, textAlign: "right", whiteSpace: "nowrap", margin: 0 }}>{m.pct}%</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: "4px 0 8px" }}>
      <p style={{ ...typography.caption, color: TEXT_TERTIARY, marginBottom: 8 }}>
        {month} spends
      </p>
      <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, marginBottom: 4 }}>
        {formatINRFull(totalSpend)}
      </p>
      <p style={{ ...typography.caption, color: TEXT_TERTIARY, marginBottom: 16 }}>
        across {merchantCount} merchants
      </p>
      {rows}
    </div>
  );
}

// ─── 7. Category Month-over-Month Comparison ──────────────

function CategoryMomCard({ data }: { data: Extract<ChatCardData, { type: "category-mom" }> }) {
  const { thisMonth, lastMonth, categories: rawCategories } = data;

  // Enforce max 5 items: if >5, show top 4 + "Other" rollup
  const categories = (() => {
    if (rawCategories.length <= 5) return rawCategories;
    const top4 = rawCategories.slice(0, 4);
    const rest = rawCategories.slice(4);
    const otherThis = rest.reduce((s, c) => s + c.thisValue, 0);
    const otherLast = rest.reduce((s, c) => s + c.lastValue, 0);
    return [...top4, { name: "Other", thisValue: otherThis, lastValue: otherLast, color: SLATE_300 }];
  })();

  const [selectedCat, setSelectedCat] = useState<number | null>(null);

  const thisTotal = categories.reduce((s, c) => s + c.thisValue, 0);
  const lastTotal = categories.reduce((s, c) => s + c.lastValue, 0);

  // Derive display values based on selection
  const displayThisValue = selectedCat !== null ? categories[selectedCat].thisValue : thisTotal;
  const displayLastValue = selectedCat !== null ? categories[selectedCat].lastValue : lastTotal;
  const displayPctDiff = displayLastValue > 0 ? Math.round(((displayThisValue - displayLastValue) / displayLastValue) * 100) : 0;
  const displayDiffColor = displayPctDiff <= 0 ? GREEN_500 : displayPctDiff <= 15 ? ORANGE_500 : RED_500;
  const displayDiffLabel = displayPctDiff > 0
    ? `${displayPctDiff}% more than ${lastMonth}`
    : displayPctDiff < 0
    ? `${Math.abs(displayPctDiff)}% less than ${lastMonth}`
    : `Same as ${lastMonth}`;
  const displayTitle = selectedCat !== null
    ? `${thisMonth} ${categories[selectedCat].name.toLowerCase()} spends`
    : `${thisMonth} spends`;

  // SVG grouped vertical bar chart
  const W = 320;
  const chartH = 170;
  const padL = 32;
  const padR = 0;
  const padTop = 12;
  const padBottom = 8;
  const drawH = chartH - padTop - padBottom;
  const drawW = W - padL - padR;

  const maxVal = Math.max(...categories.flatMap((c) => [c.thisValue, c.lastValue])) * 1.15;
  const n = categories.length;
  const groupW = drawW / n;
  const barW = Math.min(groupW * 0.28, 16);
  const gap = 3;

  const mfs = typography.metadata.fontSize;
  const mfw = typography.metadata.fontWeight;
  const mff = typography.metadata.fontFamily;
  const mls = typography.metadata.letterSpacing;

  // Round axis labels to nearest clean number
  const roundAxis = (val: number): string => {
    if (val === 0) return "₹0";
    if (val >= 10000) return `₹${Math.round(val / 1000)}k`;
    if (val >= 1000) return `₹${Math.round(val / 1000)}k`;
    return `₹${Math.round(val)}`;
  };

  const chart = (
    <div onClick={() => setSelectedCat(null)}>
      <svg width={W} height={chartH} viewBox={`0 0 ${W} ${chartH}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {/* Y-axis labels only - no grid lines */}
        {[0, 0.5, 1].map((frac) => {
          const y = padTop + drawH - frac * drawH;
          return (
            <text key={frac} x={0} y={y + 4} textAnchor="start" fill={TEXT_TERTIARY} fontSize={mfs} fontWeight={mfw} fontFamily={mff} letterSpacing={mls}>
              {roundAxis(maxVal * frac)}
            </text>
          );
        })}
        {/* Grouped bars */}
        {categories.map((cat, i) => {
          const cx = padL + groupW * i + groupW / 2;
          const lastH = Math.max((cat.lastValue / maxVal) * drawH, 2);
          const thisH = Math.max((cat.thisValue / maxVal) * drawH, 2);
          return (
            <g key={cat.name} style={{ cursor: "pointer", opacity: selectedCat === null || selectedCat === i ? 1 : 0.25, transition: "opacity 0.15s" }} onClick={(e) => { e.stopPropagation(); setSelectedCat(selectedCat === i ? null : i); }}>
              <rect
                x={cx - barW - gap / 2} y={padTop + drawH - lastH}
                width={barW} height={lastH}
                rx={4} fill={VALENTINO_50}
              />
              <rect
                x={cx + gap / 2} y={padTop + drawH - thisH}
                width={barW} height={thisH}
                rx={4} fill={VALENTINO_500}
              />
            </g>
          );
        })}
      </svg>
      {/* Category labels - HTML row below SVG, aligned to bar groups */}
      <div style={{ display: "flex", gap: 4, marginLeft: `${(padL / W) * 100}%`, marginRight: `${(padR / W) * 100}%`, marginTop: 8 }}>
        {categories.map((cat, i) => (
          <span
            key={cat.name}
            onClick={(e) => { e.stopPropagation(); setSelectedCat(selectedCat === i ? null : i); }}
            style={{
              ...typography.metadata,
              textTransform: "uppercase",
              color: selectedCat === i ? TEXT_PRIMARY : TEXT_TERTIARY,
              fontWeight: selectedCat === i ? 500 : undefined,
              flex: 1,
              textAlign: "center",
              cursor: "pointer",
              transition: "color 0.15s",
            }}
          >
            {cat.name}
          </span>
        ))}
      </div>
      {/* Legend - below graph, all-caps metadata (matches spend overview), mini bar swatches */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 4, backgroundColor: VALENTINO_50 }} />
          <span style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY }}>{lastMonth}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 4, backgroundColor: VALENTINO_500 }} />
          <span style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY }}>{thisMonth}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "4px 0 8px" }} onClick={() => setSelectedCat(null)}>
      <p style={{ ...typography.caption, color: TEXT_TERTIARY, marginBottom: 8 }}>
        {displayTitle}
      </p>
      <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, marginBottom: 4 }}>
        {formatINRFull(displayThisValue)}
      </p>
      <p style={{ ...typography.caption, color: displayDiffColor, marginBottom: 16 }}>
        {displayDiffLabel}
      </p>
      {chart}
    </div>
  );
}

// ─── 7b. Spend Trend (bar chart version of spend overview) ─

function SpendTrendCard({ data }: { data: Extract<ChatCardData, { type: "spend-trend" }> }) {
  const { month, chartData, average, highlightIndex } = data;
  const [override, setOverride] = useState<number | null>(null);
  const activeIndex = override ?? highlightIndex;
  const setActiveIndex = setOverride;
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [scrubbing, setScrubbing] = useState(false);

  const maxVal = Math.max(...chartData.map((d) => d.value), average) * 1.15;
  const activeMonthLabel = chartData[activeIndex].label;
  const activeMonthValue = chartData[activeIndex].value;

  const pctDiff = average > 0 ? Math.round(((activeMonthValue - average) / average) * 100) : 0;
  const comparisonLabel = pctDiff > 0
    ? `${pctDiff}% higher than your average`
    : pctDiff < 0
    ? `${Math.abs(pctDiff)}% lower than your average`
    : "On par with your average";
  const comparisonColor = pctDiff <= 0 ? GREEN_500 : pctDiff <= 15 ? ORANGE_500 : RED_500;

  // Header shows the full date detail (caption) when present, falling back to the axis label.
  const displayMonth = activeIndex === highlightIndex ? month : (chartData[activeIndex].caption ?? activeMonthLabel);

  // Bar chart - matching MoM layout
  const W = 320;
  const svgH = 150;
  const padL = 32;
  const padR = 0;
  const padTop = 12;
  const padBottom = 8;
  const drawH = svgH - padTop - padBottom;
  const drawW = W - padL - padR;
  const n = chartData.length;
  const groupW = drawW / n;
  // Thinner gap when there are many bars so up to ~31 fit side by side without scrolling.
  const barW = Math.min(groupW * (n > 12 ? 0.72 : 0.5), 28);
  const avgY = padTop + drawH - (average / maxVal) * drawH;

  const mfs = typography.metadata.fontSize;
  const mfw = typography.metadata.fontWeight;
  const mff = typography.metadata.fontFamily;
  const mls = typography.metadata.letterSpacing;

  const roundAxis = (val: number): string => {
    if (val === 0) return "₹0";
    if (val >= 10000) return `₹${Math.round(val / 1000)}k`;
    if (val >= 1000) return `₹${Math.round(val / 1000)}k`;
    return `₹${Math.round(val)}`;
  };

  const indexFromClientX = (clientX: number): number => {
    const svg = svgRef.current;
    if (!svg) return activeIndex;
    const rect = svg.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * W; // viewBox space
    return Math.max(0, Math.min(n - 1, Math.floor((svgX - padL) / groupW)));
  };
  // Drag/scrub to select. With up to ~31 bars each tap target is tiny, so the pointer (mouse or
  // finger) sets the selection from its X across the whole chart instead of a per-bar tap.
  const onScrubStart = (e: ReactPointerEvent<SVGSVGElement>) => {
    setScrubbing(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setActiveIndex(indexFromClientX(e.clientX));
  };
  const onScrubMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (scrubbing) setActiveIndex(indexFromClientX(e.clientX));
  };
  const onScrubEnd = () => setScrubbing(false);

  // ≤7 bars: label every bar (active one highlighted). >7 bars: just ≤5 static anchor labels —
  // the selection lives in the header, so no moving/highlighted active label crowds the dense axis.
  const labelIndices = (() => {
    const set = new Set<number>();
    if (n <= 7) { for (let i = 0; i < n; i++) set.add(i); }
    else { const c = 5; for (let k = 0; k < c; k++) set.add(Math.round((k / (c - 1)) * (n - 1))); }
    return [...set].sort((a, b) => a - b);
  })();

  const chart = (
    <div>
      <svg
        ref={svgRef}
        width={W}
        height={svgH}
        viewBox={`0 0 ${W} ${svgH}`}
        style={{ width: "100%", height: "auto", display: "block", overflow: "visible", cursor: "pointer", touchAction: "none" }}
        onPointerDown={onScrubStart}
        onPointerMove={onScrubMove}
        onPointerUp={onScrubEnd}
        onPointerCancel={onScrubEnd}
      >
        {/* Y-axis labels */}
        {[0, 0.5, 1].map((frac) => {
          const y = padTop + drawH - frac * drawH;
          return (
            <text key={frac} x={0} y={y + 4} textAnchor="start" fill={TEXT_TERTIARY} fontSize={mfs} fontWeight={mfw} fontFamily={mff} letterSpacing={mls}>
              {roundAxis(maxVal * frac)}
            </text>
          );
        })}

        {/* Average dashed line — TEXT_DISABLED so it stays subtle in both modes */}
        <line x1={padL} y1={avgY} x2={W - padR} y2={avgY} stroke={TEXT_DISABLED} strokeWidth="1" strokeDasharray="5 4" />

        {/* Bars — selection comes from scrubbing the svg, so no per-bar hit target needed */}
        {chartData.map((d, i) => {
          const cx = padL + groupW * i + groupW / 2;
          const barH = Math.max((d.value / maxVal) * drawH, 2);
          const isActive = i === activeIndex;
          return (
            <rect
              key={i}
              x={cx - barW / 2}
              y={padTop + drawH - barH}
              width={barW}
              height={barH}
              rx={Math.min(4, barW / 2)}
              fill={VALENTINO_500}
              style={{ opacity: isActive ? 1 : 0.25, transition: "opacity 0.15s" }}
            />
          );
        })}
      </svg>

      {/* X-axis labels — sampled (≤5) + the active one, positioned under their bars */}
      <div style={{ position: "relative", height: 18, marginTop: 8 }}>
        {labelIndices.map((i) => {
          const leftPct = ((padL + groupW * i + groupW / 2) / W) * 100;
          const tx = leftPct <= 6 ? "translateX(0)" : leftPct >= 94 ? "translateX(-100%)" : "translateX(-50%)";
          return (
            <span
              key={i}
              onPointerDown={(e) => { e.stopPropagation(); setActiveIndex(i); }}
              style={{
                position: "absolute",
                left: `${leftPct}%`,
                transform: tx,
                ...typography.metadata,
                textTransform: "uppercase",
                color: n <= 7 && i === activeIndex ? TEXT_PRIMARY : TEXT_TERTIARY,
                fontWeight: n <= 7 && i === activeIndex ? 500 : undefined,
                whiteSpace: "nowrap",
                cursor: "pointer",
                transition: "color 0.15s",
              }}
            >
              {chartData[i].label}
            </span>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ padding: "4px 0 8px" }}>
      <p style={{ ...typography.caption, color: TEXT_TERTIARY, marginBottom: 8 }}>
        {displayMonth} spends
      </p>
      <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, marginBottom: 4 }}>
        {formatINRFull(activeMonthValue)}
      </p>
      <p style={{ ...typography.caption, color: comparisonColor, marginBottom: 16 }}>
        {comparisonLabel}
      </p>
      {chart}
    </div>
  );
}

// ─── 8. Spending Heatmap ──────────────────────────────────

function SpendingHeatmapCard({ data }: { data: Extract<ChatCardData, { type: "spending-heatmap" }> }) {
  const { month, year, startDay, dailySpend, maxSpend } = data;
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const daysWithSpend = dailySpend.filter((v) => v != null && v > 0).length;
  const totalSpend = dailySpend.reduce<number>((s, v) => s + (v ?? 0), 0);
  const avgDaily = daysWithSpend > 0 ? Math.round(totalSpend / daysWithSpend) : 0;

  // Find day-of-week with highest total spend
  const dayNames = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"];
  const dayTotals = [0, 0, 0, 0, 0, 0, 0];
  dailySpend.forEach((v, i) => { if (v != null) dayTotals[(startDay + i) % 7] += v; });
  const peakDay = dayNames[dayTotals.indexOf(Math.max(...dayTotals))];

  // Display values based on selection
  const displayAmount = selectedDay !== null ? (dailySpend[selectedDay] ?? 0) : avgDaily;
  const displayLabel = selectedDay !== null
    ? `${selectedDay + 1} ${month} '${String(year).slice(-2)} spends`
    : `Avg. daily spends`;
  const displaySubtext = selectedDay !== null
    ? (() => {
        const diff = (dailySpend[selectedDay] ?? 0) - avgDaily;
        const pct = avgDaily > 0 ? Math.round(Math.abs(diff) / avgDaily * 100) : 0;
        if (diff > 0) return `${pct}% above daily avg.`;
        if (diff < 0) return `${pct}% below daily avg.`;
        return "At daily avg.";
      })()
    : `Highest spends on ${peakDay}`;
  const subtextColor = selectedDay !== null
    ? ((dailySpend[selectedDay] ?? 0) > avgDaily ? RED_500 : GREEN_500)
    : VALENTINO_500;

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  const cols = 7;

  // Themed intensity scale — keeps the Valentino hue but stays gentle on a
  // near-black surface. Low steps are an on-brand subtle fill + low-opacity
  // brand (read in both modes); empty/zero cells fall back to OUTLINE_SUBTLE
  // so nothing is a harsh bright block in dark. Top step holds full brand.
  const BRAND_RGB = "211,10,215"; // VALENTINO_500 / MAIN_PRIMARY (mode-stable)
  const INTENSITY_EMPTY = OUTLINE_SUBTLE;
  const INTENSITY_1 = EXT_BG_SUBTLE_MAIN;            // subtle on-brand tint, /50↔/950
  const INTENSITY_2 = `rgba(${BRAND_RGB},0.32)`;      // soft brand
  const INTENSITY_3 = `rgba(${BRAND_RGB},0.62)`;      // medium brand
  const INTENSITY_4 = VALENTINO_500;                  // full brand

  const intensityColor = (val: number | null): string => {
    if (val === null) return "transparent";
    if (val === 0) return INTENSITY_EMPTY;
    const t = Math.min(val / maxSpend, 1);
    if (t < 0.25) return INTENSITY_1;
    if (t < 0.5) return INTENSITY_2;
    if (t < 0.75) return INTENSITY_3;
    return INTENSITY_4;
  };

  const intensityLevels = [INTENSITY_EMPTY, INTENSITY_1, INTENSITY_2, INTENSITY_3, INTENSITY_4];

  // Build grid cells: leading empties for startDay offset, then day cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let i = 0; i < dailySpend.length; i++) cells.push(i);

  const tertiary = TEXT_TERTIARY;

  const chart = (
    <div>
      {/* Day-of-week labels */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 4, marginBottom: 16 }}>
        {dayLabels.map((label, i) => (
          <span key={i} style={{ ...typography.caption, color: tertiary, textAlign: "center" }}>{label}</span>
        ))}
      </div>
      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 4 }}>
        {cells.map((cellIdx, i) => {
          if (cellIdx === null) return <div key={i} onClick={() => setSelectedDay(null)} />;
          const val = dailySpend[cellIdx];
          const isSelected = selectedDay === cellIdx;
          return (
            <div
              key={i}
              onClick={() => setSelectedDay(selectedDay === cellIdx ? null : cellIdx)}
              style={{
                aspectRatio: "1",
                borderRadius: RADIUS_S,
                backgroundColor: intensityColor(val),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                opacity: selectedDay !== null && !isSelected ? 0.25 : 1,
                transition: "opacity 0.15s ease",
              }}
            >
              {val !== null && (
                <span style={{
                  ...typography.bodySmall,
                  // On the full-brand top step use on-color text; softer steps
                  // read best with the themed primary/tertiary text.
                  color: val !== 0 && val / maxSpend >= 0.75
                    ? TEXT_ON_COLOR_PRIMARY
                    : val !== 0 && val / maxSpend >= 0.5
                      ? TEXT_PRIMARY
                      : TEXT_TERTIARY,
                }}>
                  {cellIdx + 1}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, marginTop: 24 }}>
        <span style={{ ...typography.caption, color: tertiary, marginRight: 4 }}>{"\u20B9"}</span>
        {intensityLevels.map((color) => (
          <div key={color} style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: color }} />
        ))}
        <span style={{ ...typography.caption, color: tertiary, marginLeft: 4 }}>{"\u20B9\u20B9\u20B9\u20B9"}</span>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "4px 0 8px" }} onClick={(e) => { if (e.target === e.currentTarget) setSelectedDay(null); }}>
      <div onClick={() => setSelectedDay(null)} style={{ cursor: selectedDay !== null ? "pointer" : undefined }}>
        <p style={{ ...typography.caption, color: TEXT_TERTIARY, marginBottom: 8 }}>
          {displayLabel}
        </p>
        <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, marginBottom: 4 }}>
          {formatINRFull(displayAmount)}
        </p>
        <p style={{ ...typography.caption, color: subtextColor, marginBottom: 16 }}>
          {displaySubtext}
        </p>
      </div>
      {chart}
    </div>
  );
}

// ─── 9. Payment Mode Donut ────────────────────────────────

function PaymentModeDonutCardV2({ data }: { data: Extract<ChatCardData, { type: "payment-mode-donut-v2" }> }) {
  const { month, totalSpend, modes: rawModes } = data;

  // Enforce max 5 items: if >5, show top 4 + "Other" rollup
  const modes = (() => {
    if (rawModes.length <= 5) return rawModes;
    const top4 = rawModes.slice(0, 4);
    const rest = rawModes.slice(4);
    const otherAmount = rest.reduce((s, m) => s + m.amount, 0);
    const otherPct = rest.reduce((s, m) => s + m.pct, 0);
    return [...top4, { name: "Other", amount: otherAmount, pct: otherPct, color: SLATE_300 }];
  })();

  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const r = 96;
  const strokeW = 10;
  const gapPx = 14; // breathing room between rounded ends
  const circumference = 2 * Math.PI * r;

  // Bundle modes < 10% into "Others"
  const bigModes = modes.filter((m) => m.pct >= 10);
  const smallModes = modes.filter((m) => m.pct < 10);
  const othersColor = SLATE_300;
  const arcModes = smallModes.length > 0
    ? [...bigModes, { name: "Others", amount: smallModes.reduce((s, m) => s + m.amount, 0), pct: smallModes.reduce((s, m) => s + m.pct, 0), color: othersColor }]
    : bigModes;

  // Build arcs with centered gaps
  let accumulated = 0;
  const arcs = arcModes.map((m) => {
    const dashLen = (m.pct / 100) * circumference - gapPx;
    const dashGap = circumference - dashLen;
    const offset = -((accumulated / 100) * circumference) + circumference * 0.25 + gapPx / 2;
    accumulated += m.pct;
    return { ...m, dashLen, dashGap, offset };
  });

  const [selected, setSelected] = useState(0);

  const donutAndLegend = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      {/* Donut */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Arcs - selected: /500 color, deselected: /50 subtle shade */}
        {arcs.map((arc, i) => (
          <circle
            key={arc.name}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={selected === i ? arc.color : dimColor(arc.color)}
            strokeWidth={strokeW}
            strokeDasharray={`${arc.dashLen} ${arc.dashGap}`}
            strokeDashoffset={arc.offset}
            strokeLinecap="round"
            style={{ cursor: "pointer", transition: "stroke 0.2s" }}
            onClick={() => setSelected(i)}
          />
        ))}
        {/* Center amount - H1, vertically centered to ring */}
        <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="central" fill={TEXT_PRIMARY} fontSize={typography.headerH1.fontSize} fontWeight={typography.headerH1.fontWeight} letterSpacing={typography.headerH1.letterSpacing} fontFamily={typography.headerH1.fontFamily} style={{ transition: "opacity 0.2s" }}>
          {formatINR(arcModes[selected].amount)}
        </text>
        {/* Center name - Caption, below the amount */}
        <text x={cx} y={cy + 24} textAnchor="middle" fill={TEXT_TERTIARY} fontSize={typography.caption.fontSize} fontWeight={typography.caption.fontWeight} letterSpacing={typography.caption.letterSpacing} fontFamily={typography.caption.fontFamily} style={{ transition: "opacity 0.2s" }}>
          {arcModes[selected].name}
        </text>
      </svg>
      {/* Legend rows */}
      <div style={{ width: "100%" }}>
        {arcModes.map((m, i) => (
          <div
            key={m.name}
            onClick={() => setSelected(i)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 0",
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: RADIUS_CIRCLE, backgroundColor: selected === i ? m.color : dimColor(m.color), flexShrink: 0, transition: "background-color 0.2s" }} />
            <span style={{ ...(selected === i ? typography.buttonNormal : typography.bodyNormal), color: selected === i ? TEXT_PRIMARY : TEXT_TERTIARY, flex: 1, transition: "color 0.2s" }}>{m.name}</span>
            <span style={{ ...(selected === i ? typography.buttonSmall : typography.bodySmall), color: selected === i ? TEXT_PRIMARY : TEXT_TERTIARY, transition: "color 0.2s" }}>{m.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding: "4px 0 8px" }}>
      <p style={{ ...typography.caption, color: TEXT_TERTIARY, marginBottom: 8 }}>
        {month} spends
      </p>
      <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, marginBottom: 4 }}>
        {formatINRFull(totalSpend)}
      </p>
      <p style={{ ...typography.caption, color: TEXT_TERTIARY, marginBottom: 8 }}>
        across {modes.length} payment modes
      </p>
      {donutAndLegend}
    </div>
  );
}

// ─── 10. Transaction Table ────────────────────────────────

function TransactionTableCard({ data, onOpenList }: { data: Extract<ChatCardData, { type: "transaction-table" }>; onOpenList?: () => void }) {
  const { title, transactions } = data;
  const { mode } = useTheme();
  const isDark = mode === "dark";
  const MAX_ROWS = 5;
  const displayTx = transactions.slice(0, MAX_ROWS);
  const overflow = transactions.length - MAX_ROWS;

  // Compute total and date range
  const totalAmount = transactions.reduce((s, tx) => s + tx.amount, 0);
  const dates = transactions.map((tx) => tx.date);
  const dateRange = dates.length > 1
    ? formatDateRange(dates[dates.length - 1]!, dates[0]!)
    : dates[0] ?? "";

  // Assign consistent color per unique merchant
  const merchantColorMap = new Map<string, string>();
  let colorIdx = 0;
  for (const tx of transactions) {
    if (!merchantColorMap.has(tx.merchant)) {
      merchantColorMap.set(tx.merchant, PALETTE[colorIdx % PALETTE.length]);
      colorIdx++;
    }
  }

  // DLS Transaction list item rows
  const txList = (
    <div>
      {displayTx.map((tx, i) => {
        const avatarColor = merchantColorMap.get(tx.merchant) || PALETTE[0];
        return (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 0",
            borderBottom: "none",
          }}
        >
          {/* Avatar - colored initial (matches merchant concentration) */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: RADIUS_CIRCLE,
              // Dark mode follows the DLS Activity list: a subtle white-5% disc with a neutral
              // initial, not a bright per-merchant fill (which clashed on the dark canvas). Light
              // keeps the coloured initial.
              backgroundColor: isDark ? BG_CARD : avatarColor,
              border: `1px solid ${OUTLINE_SUBTLE}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ ...typography.buttonSmall, color: isDark ? TEXT_SECONDARY : TEXT_ON_COLOR_PRIMARY }}>
              {tx.merchant.charAt(0).toUpperCase()}
            </span>
          </div>
          {/* Name + subtitle */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                ...typography.bodyNormal,
                color: TEXT_PRIMARY,
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {tx.merchant}
            </p>
            <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: 0, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
              {tx.date}
              <span style={{ width: 2, height: 2, borderRadius: RADIUS_CIRCLE, backgroundColor: TEXT_TERTIARY, flexShrink: 0 }} />
              {tx.category}
            </p>
          </div>
          {/* Amount */}
          <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, flexShrink: 0, whiteSpace: "nowrap" }}>
            {formatINRFull(tx.amount)}
          </span>
        </div>
        );
      })}
      {overflow > 0 && (
        onOpenList ? (
          <button
            type="button"
            onClick={onOpenList}
            className="transition-opacity active:opacity-60"
            style={{ ...typography.caption, fontWeight: 500, color: VALENTINO_500, textAlign: "left", padding: "12px 0", margin: 0, background: "none", border: "none", width: "100%", cursor: "pointer" }}
          >
            +{overflow} more transaction{overflow > 1 ? "s" : ""}
          </button>
        ) : (
          <p style={{ ...typography.caption, color: TEXT_TERTIARY, textAlign: "left", padding: "12px 0", margin: 0 }}>
            +{overflow} more transaction{overflow > 1 ? "s" : ""}
          </p>
        )
      )}
    </div>
  );

  return (
    <div style={{ padding: "4px 0 8px" }}>
      <p style={{ ...typography.caption, color: TEXT_TERTIARY, marginBottom: 8 }}>
        {title}
      </p>
      <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, marginBottom: 4 }}>
        {formatINRFull(totalAmount)}
      </p>
      <p style={{ ...typography.caption, color: TEXT_TERTIARY, marginBottom: 16 }}>
        {dateRange}
      </p>
      {txList}
    </div>
  );
}

// ─── Income source category → DlsTag intent ──────────────
// Salary is the dependable core (positive green); family / other support reads as informational
// (blue). Neutral covers anything unmapped. The category is shown as a tag, not editable.
const INCOME_TYPE_INTENT: Record<string, "positive" | "warning" | "negative" | "brand" | "info" | "neutral"> = {
  Salary: "positive",
  Family: "info",
  Freelance: "brand",
  Business: "brand",
  Rental: "warning",
};

// ─── Obligations List V2 (inline expand/edit) ────────────

function ConfirmListCard({ data }: { data: Extract<ChatCardData, { type: "confirm-list" }> }) {
  const { items, onSubmit, submitted, defaultAllSelected, onArrowTap, label: headerLabel, variant, chatEdit } = data;
  const isSheet = variant === "sheet";
  const displayLabel = headerLabel ?? "Your items";
  const display = items.slice(0, 5);

  const [selected, setSelected] = useState<Set<string>>(() =>
    defaultAllSelected ? new Set(display.map((i) => i.id)) : new Set()
  );
  const [editedAmounts, setEditedAmounts] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState(false);
  const [editorMorphIn, setEditorMorphIn] = useState(false); // false = clipped to the sheet's rect, true = full screen
  const [editFromRect, setEditFromRect] = useState<{ top: number; right: number; bottom: number; left: number } | null>(null);
  // Sheet chat-edit: a typed request like "rent 20k" (from the docked chat box) updates that amount.
  const [editAck, setEditAck] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  // The editor is the SAME sheet growing to fill the screen — its clip-path expands from the sheet's
  // on-screen rectangle outward (bottom/right/left/top) to fullscreen, then shrinks back into it on
  // close. Not a second overlay sliding in on top.
  const openEditor = () => {
    const root = rootRef.current?.closest("[data-screen-root]");
    const sheet = rootRef.current;
    if (root && sheet) {
      const rr = root.getBoundingClientRect();
      const sr = sheet.getBoundingClientRect();
      setEditFromRect({
        top: Math.max(0, sr.top - rr.top),
        left: Math.max(0, sr.left - rr.left),
        right: Math.max(0, rr.right - sr.right),
        bottom: Math.max(0, rr.bottom - sr.bottom),
      });
    } else {
      setEditFromRect(null);
    }
    setEditing(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setEditorMorphIn(true)));
  };
  const closeEditor = () => {
    setEditorMorphIn(false);
    window.setTimeout(() => { setEditing(false); setEditFromRect(null); }, 400);
  };
  const { mode } = useTheme();
  // Match the sibling chat cards exactly (goal / add-to-pot / investment all use BG_PRIMARY) so the
  // confirm-list reads as the same card surface throughout, in both modes.
  const cardBg = BG_PRIMARY;
  // Dark mode gets a 2px outer stroke so the card edge reads clearly on the dark canvas; light stays 1px.
  const cardBorder = `${mode === "dark" ? 2 : 1}px solid ${OUTLINE_SUBTLE}`;

  const getAmount = (item: typeof display[0]) => editedAmounts[item.id] ?? item.amount;
  const getType = (item: typeof display[0]) => item.type;

  const confirmedTotal = display
    .filter((i) => selected.has(i.id))
    .reduce((s, i) => s + getAmount(i), 0);

  const handleToggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    const result = display
      .filter((i) => selected.has(i.id))
      .map((i) => ({ id: i.id, amount: getAmount(i), type: getType(i) }));
    onSubmit?.(result);
  };

  // Simulated chat-edit (no real NLU): match a source by the first word of its name + a number
  // (k / l / lakh / cr suffixes), update its amount, and echo a short Ryan-voice acknowledgement.
  const applyChatEdit = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const t = text.toLowerCase();
    const m = t.match(/([\d,]+(?:\.\d+)?)\s*(k|l|lakh|lac|cr)?/);
    let amt = m ? parseFloat(m[1].replace(/,/g, "")) : NaN;
    if (m?.[2] === "k") amt *= 1_000;
    else if (m && (m[2] === "l" || m[2] === "lakh" || m[2] === "lac")) amt *= 100_000;
    else if (m?.[2] === "cr") amt *= 10_000_000;
    // Match a named source; otherwise fall back to the first one so ANY request lands a change.
    const selectedList = display.filter((it) => selected.has(it.id));
    const target = display.find((it) => t.includes(it.payee.toLowerCase().split(" ")[0])) ?? selectedList[0] ?? display[0];
    if (target && !Number.isNaN(amt) && amt > 0) {
      const rounded = Math.round(amt);
      setEditedAmounts((p) => ({ ...p, [target.id]: rounded }));
      setSelected((p) => { const n = new Set(p); n.add(target.id); return n; });
      setEditAck(`Done — ${target.payee} is ${formatINRFull(rounded)} now.`);
    } else if (target) {
      setEditAck(`Got it — I'll factor that into ${target.payee}.`);
    } else {
      setEditAck("Got it.");
    }
  };

  // Footprint sheet: the change comes from the REAL docked chat input (below the card), routed in as a
  // { seq, text } bump so a new submission (higher seq) applies once — the card stays the pure UI layer.
  const lastChatSeq = useRef(0);
  useEffect(() => {
    if (chatEdit && chatEdit.seq > lastChatSeq.current) {
      lastChatSeq.current = chatEdit.seq;
      applyChatEdit(chatEdit.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatEdit]);

  // Confirmed state - show selected obligations without checkboxes
  if (submitted) {
    const confirmedItems = display.filter((i) => selected.has(i.id));
    return (
      <div style={{ backgroundColor: cardBg, border: cardBorder, borderRadius: CARD_RADIUS, padding: "24px 16px 16px", boxShadow: CARD_SHADOW }}>
        <CardHeader label={displayLabel} onArrowTap={onArrowTap} />
        <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0 }}>
          {formatINRFull(confirmedTotal)}<span style={{ ...typography.bodySmall, color: TEXT_TERTIARY }}>/mo</span>
        </p>
        {confirmedItems.map((item, i) => (
          <div
            key={item.id}
            style={{
              padding: i === confirmedItems.length - 1 ? "10px 0 0 0" : "10px 0",
              borderBottom: i < confirmedItems.length - 1 ? `1px solid ${OUTLINE_SUBTLE}` : "none",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY, margin: 0, flex: 1, minWidth: 0 }}>
                {item.payee}
              </p>
              <span style={{ ...typography.bodySmall, color: TEXT_PRIMARY, flexShrink: 0, whiteSpace: "nowrap", marginLeft: 8 }}>
                {formatINRFull(getAmount(item))}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <p style={{ ...typography.caption, color: TEXT_SECONDARY, margin: 0 }}>
                {item.subtext ? `${getType(item)} · ${item.subtext}` : getType(item)}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const selectedItems = display.filter((i) => selected.has(i.id));
  // Portal target: the screen-root of whatever shell hosts this card. The chat-message wrapper holds
  // a lingering transform (forwards fill), which would trap an absolute overlay inside the card — so
  // the full-page editor is portaled up to the screen root to cover the whole frame.
  const editorTarget = rootRef.current?.closest("[data-screen-root]") ?? null;

  // Read-only list of the included sources — shared by the inline-card and bottom-sheet presentations.
  const listBody = selectedItems.map((item, i) => (
    <div
      key={item.id}
      style={{
        padding: i === selectedItems.length - 1 ? "10px 0 0 0" : "10px 0",
        borderBottom: i < selectedItems.length - 1 ? `1px solid ${OUTLINE_SUBTLE}` : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY, margin: 0, flex: 1, minWidth: 0 }}>
          {item.payee}
        </p>
        <span style={{ ...typography.bodySmall, color: TEXT_PRIMARY, flexShrink: 0, whiteSpace: "nowrap", marginLeft: 8 }}>
          {formatINRFull(getAmount(item))}
        </span>
      </div>
    </div>
  ));

  // Compact CENTRED heading (label + total) — shared verbatim by the sheet and the full-page editor,
  // so tapping Edit reads as the same heading staying put while the card grows around it (L1-style,
  // not a big left-aligned total).
  const headingBlock = (
    <div style={{ padding: "16px 24px 0", textAlign: "center", flexShrink: 0 }}>
      <p style={{ ...typography.metadata, textTransform: "uppercase", letterSpacing: 0.5, color: TEXT_TERTIARY, margin: 0 }}>{displayLabel}</p>
      <p style={{ ...typography.headerH3, color: TEXT_PRIMARY, margin: "2px 0 0" }}>
        {formatINRFull(confirmedTotal)}<span style={{ ...typography.bodySmall, color: TEXT_TERTIARY }}>/mo</span>
      </p>
    </div>
  );

  // Full-page editor — portaled to the screen root (covers the whole frame): shared centred heading
  // (no close X — the Done button below is the single exit), per-source cards, Primary Done.
  const editorPortal = editing && editorTarget && createPortal(
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 60, backgroundColor: BG_SHEET, display: "flex", flexDirection: "column",
            boxShadow: ELEVATION_CARD,
            // Grow from the sheet's own rect (clip expands outward) → fullscreen; reverse on close.
            clipPath: editorMorphIn || !editFromRect
              ? "inset(0px round 0px)"
              : `inset(${editFromRect.top}px ${editFromRect.right}px ${editFromRect.bottom}px ${editFromRect.left}px round ${RADIUS_M}px)`,
            transition: "clip-path 400ms cubic-bezier(0.22, 1, 0.36, 1)",
            willChange: "clip-path",
          }}
        >
          <StatusBar backgroundColor="transparent" />
          {headingBlock}

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 24px" }}>
            {display.map((item, i) => {
              const isChecked = selected.has(item.id);
              const currentAmount = getAmount(item);
              const currentType = getType(item);
              // Each source is its own card so the editor reads as structured, not a flat list.
              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${OUTLINE_SUBTLE}`,
                    borderRadius: RADIUS_M,
                    boxShadow: mode === "dark" ? "none" : CARD_SHADOW,
                    padding: 16,
                    marginBottom: i < display.length - 1 ? 12 : 0,
                    // Excluded sources dim back so the included set reads at a glance.
                    opacity: isChecked ? 1 : 0.55,
                    transition: "opacity 0.2s ease",
                  }}
                >
                  {/* Name + include/exclude checkbox */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <p style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY, margin: 0, flex: 1, minWidth: 0 }}>{item.payee}</p>
                    <button
                      type="button"
                      onClick={() => handleToggle(item.id)}
                      aria-label={isChecked ? "Exclude" : "Include"}
                      style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "transparent", padding: 0, cursor: "pointer", flexShrink: 0 }}
                    >
                      {isChecked ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <rect x="2" y="2" width="20" height="20" rx="4" fill={VALENTINO_500} />
                          <path d="M7 12.5L10.5 16L17 9" stroke={TEXT_ON_COLOR_PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <rect x="2.5" y="2.5" width="19" height="19" rx="3.5" stroke={TEXT_DISABLED} strokeWidth="1" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Category — shown as a colour-coded tag (read-only, not a selector) */}
                  <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>Category</span>
                    <DlsTag intent={INCOME_TYPE_INTENT[currentType] ?? "neutral"}>{currentType}</DlsTag>
                  </div>

                  {/* Amount — editable; the underline marks it as a field */}
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>Amount</span>
                    <div style={{ display: "flex", alignItems: "baseline", flexShrink: 0 }}>
                      <span style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>₹</span>
                      <input
                        inputMode="numeric"
                        value={String(currentAmount)}
                        onChange={(e) => { const v = Number(e.target.value.replace(/[^0-9]/g, "")) || 0; setEditedAmounts((prev) => ({ ...prev, [item.id]: v })); }}
                        style={{ ...typography.bodySmall, color: TEXT_PRIMARY, background: "transparent", border: "none", borderBottom: `1px solid ${OUTLINE_BOLD}`, width: 80, textAlign: "right", padding: "0 0 6px", outline: "none" }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: "16px 24px 24px", flexShrink: 0 }}>
            <button
              type="button"
              onClick={closeEditor}
              style={{ ...typography.buttonNormal, width: "100%", height: 48, borderRadius: RADIUS_CIRCLE, backgroundColor: VALENTINO_500, color: TEXT_ON_COLOR_PRIMARY, border: "none", cursor: "pointer" }}
            >
              Done
            </button>
          </div>
        </div>,
        editorTarget
      );

  // Bottom-sheet presentation (beta footprint walk): auto-opened as the bucket step arrives (no chip),
  // with Edit + Looks right side by side. The dismiss X shows only when onClose is provided; in the
  // auto-open beta flow there's no onClose, so the only way out is confirming (no dismiss loop).
  if (isSheet) {
    return (
      <div ref={rootRef} className="questionnaire-overlay-entrance" style={{ padding: "0 16px 4px" }}>
        <div
          style={{
            backgroundColor: BG_SHEET,
            borderRadius: RADIUS_M,
            boxShadow: mode === "dark" ? "none" : "0px 4px 40px rgba(0,0,0,0.10), 0px 0px 0px 1px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          {/* Centred heading, no dismiss X — "Looks right" (below) is the single confirm. */}
          {headingBlock}

          <div style={{ padding: "16px 24px 24px" }}>
            {/* Clean read-only receipt — precise changes go through Edit or the chat box below. */}
            {listBody}

            {/* Edit (full editor) + Looks right (confirm), side by side. */}
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button
                type="button"
                onClick={openEditor}
                style={{ ...typography.buttonSmall, flex: 1, height: 48, borderRadius: RADIUS_CIRCLE, backgroundColor: "transparent", color: TEXT_PRIMARY, border: `1px solid ${OUTLINE_BOLD}`, cursor: "pointer" }}
              >
                Edit
              </button>
              {onSubmit && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  style={{ ...typography.buttonSmall, flex: 1, height: 48, borderRadius: RADIUS_CIRCLE, backgroundColor: VALENTINO_500, color: TEXT_ON_COLOR_PRIMARY, border: "none", cursor: "pointer" }}
                >
                  Looks right
                </button>
              )}
            </div>

            {/* Ryan's reply to a conversational edit typed in the real chat box below the sheet. */}
            {editAck && (
              <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY, margin: "16px 0 0" }}>{editAck}</p>
            )}
          </div>
        </div>
        {editorPortal}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      style={{
        backgroundColor: cardBg,
        // Subtle outline (not OUTLINE_BOLD) so the card recedes into the chat instead of
        // reading as a hard-edged panel. 2px in dark for a clear edge on the dark canvas.
        border: cardBorder,
        borderRadius: CARD_RADIUS,
        padding: "24px 16px 16px",
        boxShadow: CARD_SHADOW,
      }}
    >
      {/* Header label — clean (no in-card leading icon / hairline). Uppercase metadata so it matches the
          confirmed-state CardHeader exactly (was sentence-case caption → label changed case on submit). */}
      <p style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY, margin: "0 0 8px" }}>{displayLabel}</p>
      <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0 }}>
        {formatINRFull(confirmedTotal)}<span style={{ ...typography.bodySmall, color: TEXT_TERTIARY }}>/mo</span>
      </p>

      {listBody}

      {/* Actions — Edit (secondary) + Looks right (primary), side by side at the bottom */}
      <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
        <button
          type="button"
          onClick={openEditor}
          style={{
            ...typography.buttonSmall,
            flex: 1,
            height: 40,
            borderRadius: RADIUS_CIRCLE,
            backgroundColor: "transparent",
            color: TEXT_PRIMARY,
            border: `1px solid ${OUTLINE_BOLD}`,
            cursor: "pointer",
          }}
        >
          Edit
        </button>
        {!submitted && onSubmit && (
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              ...typography.buttonSmall,
              flex: 1,
              height: 40,
              borderRadius: RADIUS_CIRCLE,
              backgroundColor: VALENTINO_500,
              color: TEXT_ON_COLOR_PRIMARY,
              border: "none",
              cursor: "pointer",
            }}
          >
            Looks right
          </button>
        )}
      </div>

      {editorPortal}
    </div>
  );
}

// ─── Public renderer ───────────────────────────────────────

export default function ChatCard({ card, onOpenList }: { card: ChatCardData; onOpenList?: () => void }) {
  switch (card.type) {
    case "spend-overview":
      return <SpendOverviewCard data={card} />;
    case "category-breakdown":
      return <CategoryBreakdownCard data={card} />;
    case "investment-product":
      return <InvestmentProductCard data={card} />;
    case "goal-progress":
      return <GoalProgressCard data={card} />;
    case "savings-plan":
      return <SavingsPlanCard data={card} />;
    case "merchant-concentration":
      return <MerchantConcentrationCard data={card} />;
    case "category-mom":
      return <CategoryMomCard data={card} />;
    case "spend-trend":
      return <SpendTrendCard data={card} />;
    case "spending-heatmap":
      return <SpendingHeatmapCard data={card} />;
    case "payment-mode-donut-v2":
      return <PaymentModeDonutCardV2 data={card} />;
    case "transaction-table":
      return <TransactionTableCard data={card} onOpenList={onOpenList} />;
    case "confirm-list":
      return <ConfirmListCard data={card} />;
    case "add-to-pot":
      return <AddToPotCard data={card} />;
    case "budget-summary":
      return <BudgetSummaryViz plan={card.plan} />;
    case "category-budgets":
      // Wrap in the standard chat-card shell so it reads as a card like the goal card
      // (the viz itself is chrome-less; GBPFlowSim renders it directly without this wrapper).
      // Tighter vertical pad than CARD_PAD — the viz's rows carry their own rhythm.
      return (
        <div style={{ backgroundColor: BG_PRIMARY, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: "16px", boxShadow: CARD_SHADOW }}>
          <CategoryBudgetsViz plan={card.plan} />
        </div>
      );
    default:
      return null;
  }
}
