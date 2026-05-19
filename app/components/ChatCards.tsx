"use client";

import { useRef, useState, type ReactNode } from "react";
import { typography } from "../lib/typography";
import {
  VALENTINO_50, VALENTINO_200, VALENTINO_400, VALENTINO_500, VALENTINO_700,
  GREEN_50, GREEN_400, GREEN_500,
  RED_50, RED_400, RED_500,
  ORANGE_50, ORANGE_400, ORANGE_500, ORANGE_600,
  BLUE_50, BLUE_400, BLUE_500,
  SLATE_10, SLATE_30, SLATE_50, SLATE_300, SLATE_500, SLATE_800,
  BG_PRIMARY,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY,
  ALPHA_BLACK_20, ALPHA_BLACK_30, OUTLINE_SUBTLE,
} from "../lib/colors";
import { RADIUS_S, RADIUS_PILL, RADIUS_CIRCLE } from "../lib/radii";

// ─── Shared types ──────────────────────────────────────────

export type ChatCardData =
  | { type: "spend-overview"; month: string; amount: number; comparisonText: string; chartData: { label: string; value: number }[]; average: number; highlightIndex: number }
  | { type: "category-breakdown"; month: string; amount: number; subtext: string; showAll?: boolean; categories: { name: string; amount: number; pct: number; color: string; icon: ReactNode }[] }
  | { type: "investment-product"; productType: string; amount: number; rate: string; tenure: string; amountOptions: { label: string; value: number }[]; accountLabel: string; activated?: boolean; onContinue?: () => void; onInvest?: (amount: number) => void; onAmountSelect?: (amount: number) => void; onArrowTap?: () => void }
  | { type: "goal-progress"; name: string; pct: number; saved: number; target: number; daysLabel: string; status: "ahead" | "behind" | "on-track"; onArrowTap?: () => void }
  | { type: "savings-plan"; name: string; target: number; timeline: string; existingSavings: number; monthlyAmount: number; productType: string; productLabel: string; rate: string; pct: number; timelineLabel: string }
  | { type: "merchant-concentration"; month: string; totalSpend: number; totalMerchants?: number; merchants: { name: string; amount: number; pct: number; color: string }[] }
  | { type: "category-mom"; thisMonth: string; lastMonth: string; categories: { name: string; thisValue: number; lastValue: number; color: string }[] }
  | { type: "spending-heatmap"; month: string; year: number; startDay: number; dailySpend: (number | null)[]; maxSpend: number }
  | { type: "payment-mode-donut-v2"; month: string; totalSpend: number; modes: { name: string; amount: number; pct: number; color: string }[] }
  | { type: "transaction-table"; title: string; transactions: { date: string; merchant: string; amount: number; category: string }[] }
  | { type: "confirm-list"; label?: string; items: { id: string; payee: string; amount: number; type: string; subtext?: string }[]; monthlyIncome?: number; onSubmit?: (selected: { id: string; amount: number; type: string }[]) => void; submitted?: boolean; onArrowTap?: () => void }
  | { type: "spend-trend"; month: string; chartData: { label: string; value: number }[]; average: number; highlightIndex: number }
  | { type: "add-to-pot"; goalName: string; amount: number; fromAccount: string; activated?: boolean; onAdd?: () => void };

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
    neutral:  { bg: SLATE_10, text: SLATE_800 },
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

export function DlsTag({
  intent = "neutral",
  emphasis = "subtle",
  children,
}: {
  intent?: "positive" | "warning" | "negative" | "brand" | "info" | "neutral";
  emphasis?: "subtle" | "bold";
  children: ReactNode;
}) {
  const colors = TAG_STYLES[emphasis][intent];
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
export const CARD_PAD = "16px";
export const CARD_SHADOW = "0px 2px 32px 0px rgba(0,0,0,0.05)";
export const CARD_BORDER = "1px solid rgba(0,0,0,0.08)";

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
          <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

// ─── 1. Spend Overview Card ────────────────────────────────

function SpendOverviewCard({ data }: { data: Extract<ChatCardData, { type: "spend-overview" }> }) {
  const { month, chartData, average, highlightIndex } = data;
  const [activeIndex, setActiveIndex] = useState(highlightIndex);
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);

  const W = 280;
  const H = 110;
  const padX = 18;
  const padTop = 16;
  const padBottom = 26;
  const chartW = W - padX * 2;
  const chartH = H - padTop - padBottom;

  const maxVal = Math.max(
    ...chartData.map((d) => d.value),
    average
  ) * 1.2;

  const xPositions = chartData.map((_, i) =>
    padX + (chartW / Math.max(chartData.length - 1, 1)) * i
  );

  const points = chartData.map((d, i) => ({
    x: xPositions[i],
    y: padTop + chartH - (d.value / maxVal) * chartH,
  }));

  const avgY = padTop + chartH - (average / maxVal) * chartH;
  const linePath = smoothPath(points);

  // Snap to nearest month index from pointer x in SVG coordinates
  const snapToMonth = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * W;
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < xPositions.length; i++) {
      const dist = Math.abs(svgX - xPositions[i]);
      if (dist < minDist) { minDist = dist; closest = i; }
    }
    setActiveIndex(closest);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    snapToMonth(e.clientX);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    snapToMonth(e.clientX);
  };
  const handlePointerUp = () => { isDragging.current = false; };

  const activePoint = points[activeIndex];
  const activeMonthLabel = chartData[activeIndex].label;
  const activeMonthValue = chartData[activeIndex].value;

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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <path d={linePath} fill="none" stroke={VALENTINO_500} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Average dashed line */}
        <line x1={padX} y1={avgY} x2={W - padX} y2={avgY} stroke={ALPHA_BLACK_20} strokeWidth="1" strokeDasharray="5 4" />

        {/* Handle dot with glow */}
        {activePoint && (
          <>
            <circle cx={activePoint.x} cy={activePoint.y} r={12} fill={VALENTINO_500} opacity="0.12" />
            <circle cx={activePoint.x} cy={activePoint.y} r={5} fill="#fff" stroke={VALENTINO_500} strokeWidth="2.5" />
          </>
        )}
      </svg>

      {/* Month labels - HTML row with DLS Tag for active month */}
      <div style={{ display: "flex", alignItems: "center", marginTop: 12 }}>
        {chartData.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", cursor: "pointer" }} onClick={() => setActiveIndex(i)}>
            {i === activeIndex ? (
              <DlsTag intent="brand" emphasis="bold">{d.label}</DlsTag>
            ) : (
              <span style={{ ...typography.metadata, textTransform: "uppercase", color: ALPHA_BLACK_30 }}>
                {d.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Derive display values from active selection
  const displayMonth = activeIndex === highlightIndex ? month : activeMonthLabel;
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
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" width={20} height={20} style={{ flexShrink: 0 }} />;
}

const CAT_ICON_PATH = "/icons/categories";

export const CATEGORY_ICONS: Record<string, ReactNode> = {
  "Food & Drinks":             <CatImg src={`${CAT_ICON_PATH}/food-drinks.svg`} />,
  "Food Delivery (Swiggy)":    <CatImg src={`${CAT_ICON_PATH}/food-drinks.svg`} />,
  "Dining Out (Swiggy Dineout)": <CatImg src={`${CAT_ICON_PATH}/food-drinks.svg`} />,
  "Food & Dining":             <CatImg src={`${CAT_ICON_PATH}/food-drinks.svg`} />,
  "Food":                      <CatImg src={`${CAT_ICON_PATH}/food-drinks.svg`} />,
  "Transport":                 <CatImg src={`${CAT_ICON_PATH}/transport.svg`} />,
  "Groceries":                 <CatImg src={`${CAT_ICON_PATH}/groceries.svg`} />,
  "Groceries (Swiggy Instamart)": <CatImg src={`${CAT_ICON_PATH}/groceries.svg`} />,
  "Shopping":                  <CatImg src={`${CAT_ICON_PATH}/shopping.svg`} />,
  "Shopping (Amazon)":         <CatImg src={`${CAT_ICON_PATH}/shopping.svg`} />,
  "Entertainment":             <CatImg src={`${CAT_ICON_PATH}/entertainment.svg`} />,
  "Travel":                    <CatImg src={`${CAT_ICON_PATH}/travel.svg`} />,
  "Medical":                   <CatImg src={`${CAT_ICON_PATH}/medical.svg`} />,
  "Health":                    <CatImg src={`${CAT_ICON_PATH}/medical.svg`} />,
  "Personal":                  <CatImg src={`${CAT_ICON_PATH}/personal.svg`} />,
  "Transfers":                 <CatImg src={`${CAT_ICON_PATH}/transfers.svg`} />,
  "Cash Withdrawals (ATM)":    <CatImg src={`${CAT_ICON_PATH}/transfers.svg`} />,
  "Bills":                     <CatImg src={`${CAT_ICON_PATH}/bills.svg`} />,
  "Utilities":                 <CatImg src={`${CAT_ICON_PATH}/bills.svg`} />,
  "Services":                  <CatImg src={`${CAT_ICON_PATH}/services.svg`} />,
  "Subscription":              <CatImg src={`${CAT_ICON_PATH}/subscription.svg`} />,
  "Repayment":                 <CatImg src={`${CAT_ICON_PATH}/repayment.svg`} />,
  "Self Transfer":             <CatImg src={`${CAT_ICON_PATH}/self-transfer.svg`} />,
  "Gaming":                    <CatImg src={`${CAT_ICON_PATH}/gaming.svg`} />,
  "Logistics":                 <CatImg src={`${CAT_ICON_PATH}/logistics.svg`} />,
  "Insurance":                 <CatImg src={`${CAT_ICON_PATH}/insurance.svg`} />,
  "Investment":                <CatImg src={`${CAT_ICON_PATH}/investment.svg`} />,
  "Other / Uncategorized":     <CatImg src={`${CAT_ICON_PATH}/miscellaneous.svg`} />,
  "Miscellaneous":             <CatImg src={`${CAT_ICON_PATH}/miscellaneous.svg`} />,
};

// Bar-chart fill colors - mapped to closest DLS 2.0 primitives
export const CATEGORY_COLORS: Record<string, string> = {
  "Food & Drinks":             ORANGE_500,
  "Food Delivery (Swiggy)":    ORANGE_500,
  "Dining Out (Swiggy Dineout)": RED_500,
  "Food & Dining":             ORANGE_500,
  "Food":                      ORANGE_500,
  "Transport":                 VALENTINO_400,
  "Groceries":                 GREEN_500,
  "Groceries (Swiggy Instamart)": GREEN_500,
  "Shopping":                  ORANGE_600,
  "Shopping (Amazon)":         ORANGE_600,
  "Entertainment":             RED_400,
  "Travel":                    BLUE_500,
  "Medical":                   BLUE_400,
  "Health":                    GREEN_400,
  "Personal":                  VALENTINO_500,
  "Transfers":                 GREEN_400,
  "Cash Withdrawals (ATM)":    SLATE_500,
  "Bills":                     BLUE_500,
  "Utilities":                 ORANGE_400,
  "Services":                  RED_400,
  "Subscription":              BLUE_400,
  "Repayment":                 GREEN_500,
  "Self Transfer":             GREEN_400,
  "Gaming":                    SLATE_500,
  "Logistics":                 ORANGE_400,
  "Insurance":                 VALENTINO_700,
  "Investment":                RED_400,
  "Other / Uncategorized":     SLATE_300,
  "Miscellaneous":             SLATE_300,
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
            paddingTop: 16,
            paddingBottom: 16,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: RADIUS_CIRCLE,
              backgroundColor: BG_PRIMARY,
              border: `1px solid ${SLATE_30}`,
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
            <p style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, margin: 0 }}>
              {cat.name}
            </p>
            <div style={{ paddingTop: 4, paddingBottom: 4 }}>
              <div style={{ height: 8, backgroundColor: trackColor(cat.color), borderRadius: RADIUS_CIRCLE, overflow: "hidden" }}>
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
            <p style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, textAlign: "right", whiteSpace: "nowrap", margin: 0 }}>
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

// ─── 3. Investment Product Card ────────────────────────────
// Matches Figma: Chatbot / node 16703:18825

function InvestmentProductCard({ data }: { data: Extract<ChatCardData, { type: "investment-product" }> }) {
  const { productType, amount, rate, tenure, accountLabel, activated, onContinue, onArrowTap } = data;

  const content = (
    <>
      {/* Amount */}
      <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, marginBottom: 4 }}>
        {formatINRFull(amount)}
      </p>

      {/* Rate + tenure */}
      <p style={{ ...typography.caption, color: GREEN_500, marginBottom: 16 }}>
        {rate} · {tenure}
      </p>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: OUTLINE_SUBTLE, marginBottom: 16 }} />

      {activated ? (
        <ConfirmedRow label={`${productType} set up`} onArrowTap={onArrowTap} />
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ ...typography.metadata, textTransform: "uppercase", color: ALPHA_BLACK_30, marginBottom: 4 }}>
              Paying from
            </p>
            <p style={{ ...typography.buttonSmall, color: TEXT_SECONDARY }}>
              {accountLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onContinue}
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
            Set up
          </button>
        </div>
      )}
    </>
  );

  const shell = { backgroundColor: BG_PRIMARY, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: CARD_PAD, boxShadow: CARD_SHADOW };

  return (
    <div style={shell}>
      <CardHeader label={productType} onArrowTap={onArrowTap} arrowInvisible={!activated} />
      {content}
    </div>
  );
}

// ─── Add to Pot Card (simplified one-tap action) ──────────

function AddToPotCard({ data }: { data: Extract<ChatCardData, { type: "add-to-pot" }> }) {
  const { goalName, amount, fromAccount, activated, onAdd } = data;
  const [done, setDone] = useState(activated ?? false);

  const shell = { backgroundColor: BG_PRIMARY, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: CARD_PAD, boxShadow: CARD_SHADOW };

  return (
    <div style={shell}>
      <CardHeader label={goalName} />

      {/* Amount */}
      <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, marginBottom: 16 }}>
        {formatINRFull(amount)}
      </p>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: OUTLINE_SUBTLE, marginBottom: 16 }} />

      {done ? (
        <ConfirmedRow label="Added to pot" />
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ ...typography.metadata, textTransform: "uppercase", color: ALPHA_BLACK_30, marginBottom: 4 }}>
              Adding from
            </p>
            <p style={{ ...typography.buttonSmall, color: TEXT_SECONDARY }}>
              {fromAccount}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setDone(true); onAdd?.(); }}
            style={{
              ...typography.buttonSmall,
              border: "none",
              background: VALENTINO_500,
              color: BG_PRIMARY,
              cursor: "pointer",
              padding: "8px 20px",
              borderRadius: RADIUS_CIRCLE,
              flexShrink: 0,
            }}
          >
            Add
          </button>
        </div>
      )}
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
          {/* Initial avatar */}
          <div style={{
            width: 40, height: 40, borderRadius: RADIUS_CIRCLE,
            backgroundColor: m.color || PALETTE[i % PALETTE.length],
            border: `1px solid ${SLATE_30}`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ ...typography.buttonSmall, color: BG_PRIMARY }}>
              {m.name.charAt(0).toUpperCase()}
            </span>
          </div>
          {/* Name + bar */}
          <div style={{ flex: "1 0 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            <p style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {m.name}
            </p>
            <div style={{ paddingTop: 4, paddingBottom: 4 }}>
              <div style={{ height: 8, backgroundColor: trackColor(m.color || PALETTE[i % PALETTE.length]), borderRadius: RADIUS_CIRCLE, overflow: "hidden" }}>
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
            <text key={frac} x={0} y={y + 4} textAnchor="start" fill={ALPHA_BLACK_30} fontSize={mfs} fontWeight={mfw} fontFamily={mff} letterSpacing={mls}>
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
                rx={4} fill="#fae2fa"
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
              ...typography.caption,
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
      {/* Legend - below graph, caption/sentence case, mini bar swatches */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 4, backgroundColor: VALENTINO_50 }} />
          <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>{lastMonth}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 4, backgroundColor: VALENTINO_500 }} />
          <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>{thisMonth}</span>
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
  const [activeIndex, setActiveIndex] = useState(highlightIndex);

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

  const displayMonth = activeIndex === highlightIndex ? month : activeMonthLabel;

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
  const barW = Math.min(groupW * 0.5, 28);
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

  const chart = (
    <div onClick={() => setActiveIndex(highlightIndex)}>
      <svg width={W} height={svgH} viewBox={`0 0 ${W} ${svgH}`} style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}>
        {/* Y-axis labels */}
        {[0, 0.5, 1].map((frac) => {
          const y = padTop + drawH - frac * drawH;
          return (
            <text key={frac} x={0} y={y + 4} textAnchor="start" fill={ALPHA_BLACK_30} fontSize={mfs} fontWeight={mfw} fontFamily={mff} letterSpacing={mls}>
              {roundAxis(maxVal * frac)}
            </text>
          );
        })}

        {/* Average dashed line */}
        <line x1={padL} y1={avgY} x2={W - padR} y2={avgY} stroke={ALPHA_BLACK_20} strokeWidth="1" strokeDasharray="5 4" />

        {/* Bars */}
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
              rx={4}
              fill={VALENTINO_500}
              style={{ cursor: "pointer", opacity: isActive ? 1 : 0.25, transition: "opacity 0.15s" }}
              onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
            />
          );
        })}
      </svg>

      {/* Month labels - HTML, flex:1, caption style */}
      <div style={{ display: "flex", gap: 4, marginLeft: `${(padL / W) * 100}%`, marginTop: 8 }}>
        {chartData.map((d, i) => (
          <span
            key={i}
            onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
            style={{
              ...typography.caption,
              color: i === activeIndex ? TEXT_PRIMARY : TEXT_TERTIARY,
              fontWeight: i === activeIndex ? 500 : undefined,
              flex: 1,
              textAlign: "center",
              cursor: "pointer",
              transition: "color 0.15s",
            }}
          >
            {d.label}
          </span>
        ))}
      </div>

    </div>
  );

  return (
    <div style={{ padding: "4px 0 8px" }} onClick={() => setActiveIndex(highlightIndex)}>
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
    ? `${selectedDay + 1} ${month}' ${String(year).slice(-2)} spends`
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

  const intensityColor = (val: number | null): string => {
    if (val === null) return "transparent";
    if (val === 0) return SLATE_50;
    const t = Math.min(val / maxSpend, 1);
    if (t < 0.25) return VALENTINO_50;
    if (t < 0.5) return VALENTINO_200;
    if (t < 0.75) return VALENTINO_500;
    return VALENTINO_700;
  };

  const intensityLevels = [SLATE_50, VALENTINO_50, VALENTINO_200, VALENTINO_500, VALENTINO_700];

  // Build grid cells: leading empties for startDay offset, then day cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let i = 0; i < dailySpend.length; i++) cells.push(i);

  const tertiary = ALPHA_BLACK_30;

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
                  color: val / maxSpend > 0.5 ? BG_PRIMARY : TEXT_TERTIARY,
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
            stroke={selected === i ? arc.color : trackColor(arc.color)}
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
            <div style={{ width: 12, height: 12, borderRadius: RADIUS_CIRCLE, backgroundColor: selected === i ? m.color : trackColor(m.color), flexShrink: 0, transition: "background-color 0.2s" }} />
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

function TransactionTableCard({ data }: { data: Extract<ChatCardData, { type: "transaction-table" }> }) {
  const { title, transactions } = data;
  const MAX_ROWS = 5;
  const displayTx = transactions.slice(0, MAX_ROWS);
  const overflow = transactions.length - MAX_ROWS;

  // Compute total and date range
  const totalAmount = transactions.reduce((s, tx) => s + tx.amount, 0);
  const dates = transactions.map((tx) => tx.date);
  const dateRange = dates.length > 1 ? `${dates[dates.length - 1]} – ${dates[0]}` : dates[0] ?? "";

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
              backgroundColor: avatarColor,
              border: `1px solid ${SLATE_30}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ ...typography.buttonSmall, color: BG_PRIMARY }}>
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
              <span style={{ width: 2, height: 2, borderRadius: RADIUS_CIRCLE, backgroundColor: ALPHA_BLACK_30, flexShrink: 0 }} />
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
        <p style={{ ...typography.caption, color: TEXT_TERTIARY, textAlign: "center", padding: "12px 0", margin: 0 }}>
          +{overflow} more transaction{overflow > 1 ? "s" : ""}
        </p>
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

// ─── DLS Tag Intent Map (used by V2 obligations chips) ────

const TAG_INTENT: Record<string, { bg: string; text: string }> = {
  "Rent": { bg: SLATE_10, text: SLATE_800 },
  "Loan EMI": { bg: ORANGE_50, text: ORANGE_600 },
  "Subscription": { bg: BLUE_50, text: BLUE_500 },
  "Utility": { bg: BLUE_50, text: BLUE_500 },
  "Investment": { bg: GREEN_50, text: GREEN_500 },
  "Credit Card": { bg: RED_50, text: RED_500 },
  "Food": { bg: ORANGE_50, text: ORANGE_600 },
  "Grocery": { bg: ORANGE_50, text: ORANGE_600 },
  "P2P": { bg: VALENTINO_50, text: VALENTINO_500 },
};

// ─── Obligations List V2 (inline expand/edit) ────────────

const ALL_TAG_OPTIONS = Object.keys(TAG_INTENT);

function getSnapStep(amount: number): number {
  if (amount < 500) return 50;
  if (amount < 5000) return 100;
  if (amount < 20000) return 500;
  return 1000;
}

function ConfirmListCard({ data }: { data: Extract<ChatCardData, { type: "confirm-list" }> }) {
  const { items, onSubmit, submitted, onArrowTap, label: headerLabel } = data;
  const displayLabel = headerLabel ?? "Your items";
  const display = items.slice(0, 5);

  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editedAmounts, setEditedAmounts] = useState<Record<string, number>>({});
  const [editedTypes, setEditedTypes] = useState<Record<string, string>>({});

  const handleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getAmount = (item: typeof display[0]) => editedAmounts[item.id] ?? item.amount;
  const getType = (item: typeof display[0]) => editedTypes[item.id] ?? item.type;

  const confirmedTotal = display
    .filter((i) => selected.has(i.id))
    .reduce((s, i) => s + getAmount(i), 0);

  const handleToggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setExpandedId((cur) => (cur === id ? null : cur));
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    const result = display
      .filter((i) => selected.has(i.id))
      .map((i) => ({ id: i.id, amount: getAmount(i), type: getType(i) }));
    onSubmit?.(result);
  };

  // Confirmed state - show selected obligations without checkboxes
  if (submitted) {
    const confirmedItems = display.filter((i) => selected.has(i.id));
    return (
      <div style={{ backgroundColor: BG_PRIMARY, border: CARD_BORDER, borderRadius: CARD_RADIUS, padding: CARD_PAD, boxShadow: CARD_SHADOW }}>
        <CardHeader label={displayLabel} onArrowTap={onArrowTap} />
        <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0 }}>
          {formatINRFull(confirmedTotal)}<span style={{ ...typography.bodySmall, color: TEXT_TERTIARY }}>/mo</span>
        </p>
        {confirmedItems.map((item, i) => (
          <div
            key={item.id}
            style={{
              padding: i === confirmedItems.length - 1 ? "16px 0 0 0" : "16px 0",
              borderBottom: i < confirmedItems.length - 1 ? `1px solid ${OUTLINE_SUBTLE}` : "none",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                {item.payee}
              </p>
              <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, flexShrink: 0, whiteSpace: "nowrap", marginLeft: 8 }}>
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

  return (
    <div
      style={{
        backgroundColor: BG_PRIMARY,
        border: CARD_BORDER,
        borderRadius: CARD_RADIUS,
        padding: CARD_PAD,
        boxShadow: CARD_SHADOW,
      }}
    >
      {/* Live confirmed total header */}
      <CardHeader label={displayLabel} onArrowTap={onArrowTap} />
      <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0 }}>
        {formatINRFull(confirmedTotal)}<span style={{ ...typography.bodySmall, color: TEXT_TERTIARY }}>/mo</span>
      </p>

      {display.map((item, i) => {
        const isExpanded = expandedId === item.id;
        const isChecked = selected.has(item.id);
        const currentAmount = getAmount(item);
        const currentType = getType(item);

        return (
          <div key={item.id}>
            {/* Row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: i === display.length - 1 ? "16px 0 0 0" : "16px 0",
                borderBottom: (!isExpanded && i < display.length - 1) ? `1px solid ${OUTLINE_SUBTLE}` : "none",
                transition: "border-color 200ms ease",
              }}
            >
              {/* Checkbox with scale transition */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleToggle(item.id); }}
                style={{ width: 32, height: 48, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "transparent", padding: 0, cursor: "pointer", flexShrink: 0 }}
                aria-label={isChecked ? "Deselect" : "Select"}
              >
                <div style={{ transition: "transform 150ms ease", transform: isChecked ? "scale(1)" : "scale(0.9)" }}>
                  {isChecked ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="2" width="20" height="20" rx="4" fill={VALENTINO_500} />
                      <path d="M7 12.5L10.5 16L17 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="2.5" y="2.5" width="19" height="19" rx="3.5" stroke={ALPHA_BLACK_20} strokeWidth="1" />
                    </svg>
                  )}
                </div>
              </button>
              {/* Content block */}
              <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => handleExpand(item.id)}>
                {/* Row 1: Title + Amount */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                    {item.payee}
                  </p>
                  <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, flexShrink: 0, whiteSpace: "nowrap", marginLeft: 8 }}>
                    {formatINRFull(currentAmount)}
                  </span>
                </div>
                {/* Row 2: Category (+ optional subtext) + Edit */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                  <p style={{ ...typography.caption, color: TEXT_SECONDARY, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                    {item.subtext ? `${currentType} · ${item.subtext}` : currentType}
                  </p>
                  <span
                    style={{
                      ...typography.caption,
                      fontWeight: 500,
                      color: VALENTINO_500,
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                      marginLeft: 8,
                      cursor: "pointer",
                      opacity: isExpanded ? 0 : 1,
                      transition: "opacity 200ms ease",
                      pointerEvents: isExpanded ? "none" : "auto",
                    }}
                    onClick={(e) => { e.stopPropagation(); handleExpand(item.id); }}
                  >
                    Edit
                  </span>
                </div>
              </div>
            </div>

            {/* Expanded inline edit - animated height + opacity */}
            <div
              style={{
                display: "grid",
                gridTemplateRows: isExpanded ? "1fr" : "0fr",
                opacity: isExpanded ? 1 : 0,
                transition: "grid-template-rows 250ms ease, opacity 200ms ease",
                borderBottom: (isExpanded && i < display.length - 1) ? `1px solid ${OUTLINE_SUBTLE}` : "none",
              }}
            >
              <div style={{ overflow: "hidden" }}>
                <div style={{ paddingBottom: 16 }}>
                  {/* Amount slider */}
                  <div style={{ marginBottom: 12 }}>
                    <input
                      type="range"
                      min={0}
                      max={Math.ceil((item.amount * 1.5) / getSnapStep(item.amount)) * getSnapStep(item.amount)}
                      step={getSnapStep(item.amount)}
                      value={currentAmount}
                      onChange={(e) => setEditedAmounts((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))}
                      style={{ width: "100%", accentColor: VALENTINO_500, cursor: "pointer" }}
                    />
                  </div>

                  {/* Type chips */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      overflowX: "auto",
                      flexWrap: "nowrap",
                      msOverflowStyle: "none",
                      scrollbarWidth: "none",
                      marginRight: -12,
                      paddingRight: 12,
                    }}
                  >
                    {ALL_TAG_OPTIONS.slice(0, 5).map((tag) => {
                      const isActive = currentType === tag;
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setEditedTypes((prev) => ({ ...prev, [item.id]: tag }))}
                          style={{
                            ...typography.bodySmall,
                            height: 32,
                            padding: "0 16px",
                            borderRadius: RADIUS_PILL,
                            border: isActive ? `1px solid ${VALENTINO_500}` : `1px solid ${ALPHA_BLACK_20}`,
                            backgroundColor: isActive ? VALENTINO_50 : BG_PRIMARY,
                            color: TEXT_PRIMARY,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                            transition: "all 150ms ease",
                          }}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Submit - fade in once ≥1 item selected */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: (!submitted && onSubmit && selected.size > 0) ? "1fr" : "0fr",
          opacity: (!submitted && onSubmit && selected.size > 0) ? 1 : 0,
          transition: "grid-template-rows 250ms ease, opacity 200ms ease",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div style={{ marginTop: 24 }}>
            <button
              type="button"
              onClick={handleSubmit}
              style={{
                ...typography.buttonSmall,
                height: 36,
                borderRadius: RADIUS_CIRCLE,
                backgroundColor: VALENTINO_500,
                color: BG_PRIMARY,
                border: "none",
                cursor: "pointer",
                padding: "0 16px",
                transition: "transform 150ms ease",
              }}
            >
              Looks right
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Public renderer ───────────────────────────────────────

export default function ChatCard({ card }: { card: ChatCardData }) {
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
      return <TransactionTableCard data={card} />;
    case "confirm-list":
      return <ConfirmListCard data={card} />;
    case "add-to-pot":
      return <AddToPotCard data={card} />;
    default:
      return null;
  }
}
