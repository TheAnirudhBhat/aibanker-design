"use client";

import { useState, useEffect, type ReactNode } from "react";
import { BOTTOM_INSET, CHAT_APP_BAR_HEIGHT, NavButton, StatusBar } from "./AppChrome";
import { typography } from "../lib/typography";
import {
  GREEN_500,
  BLUE_500,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  BG_SHEET,
  BG_PRIMARY,
  BG_SECONDARY,
  OUTLINE_BOLD,
  OUTLINE_SUBTLE,
  CAT_AVATAR_FILL,
  VALENTINO_500,
  SLATE_50,
  UTILITY_NEGATIVE,
  EXT_TEXT_NEGATIVE,
} from "../lib/colors";
import type { GoalIndicatorData } from "./GoalTracker";
import { RADIUS_S, RADIUS_M, RADIUS_CIRCLE } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";
import { SPACE_2XS, SPACE_XS, SPACE_S, SPACE_M, SPACE_L } from "../lib/spacing";
import { SPENDING_PLAN_FIXTURE, getSafeToSpendSnapshot } from "../preview/fixtures/gbpFlowFixture";
import { CATEGORY_ICONS } from "./ChatCards";
import type { CategoryBudget } from "../lib/types";

// ══════════════════════════════════════════════════════════════════
//  Left-to-spend dashboard (canon 655:4783 · frames 636:8190/8633/8415
//  + monies 655:5326). Replaces the old hero-ring goals screen:
//   • Header — "Left to spend • Aug", the amount, "% budget · days left"
//     in Valentino, a filling progress bar, and the on-track insight card.
//   • Tabs — Budget | Cashflow | Goals (DLS pills; selected = slate fill).
//   • Budget — per-category rows, a draining ring around each avatar.
//   • Cashflow — income → recurring → goals → spent → left-to-spend rows
//     (money-in and left-to-spend amounts in positive green).
//   • Goals — goal rows (tile + progress) that open the goal detail.
//   • ⓘ → the "monies" rewards explainer, pushed in from the right.
//  The old #s2s-hero-ring is gone — the peek morph measurement finds no
//  hero and falls back to its plain slide, by design.
// ══════════════════════════════════════════════════════════════════

export type SafeToSpendPlan = {
  monthly: number; // total budget for the cycle = sum of the category caps
  spent: number; // spent so far this cycle = sum of the category spend
  source?: "full" | "slice-only";
};

// ─── Sakura / Japan Scene (goal tile art) ────────────────────
function JapanHeroScene() {
  return (
    <svg viewBox="0 0 600 400" style={{ width: "100%", height: "100%", display: "block" }} preserveAspectRatio="xMidYMid slice">
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
      <polygon points="150,400 290,155 300,150 310,155 450,400" fill="url(#fuji)" />
      <polygon points="270,185 290,155 300,150 310,155 330,185 315,195 300,198 285,195" fill="white" fillOpacity="0.8" />
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
    </svg>
  );
}

// ─── Small shared pieces ─────────────────────────────────────

// Info ⓘ glyph (matches AASim's inline InfoIcon).
function InfoIcon({ color = TEXT_PRIMARY }: { color?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// Thumbs-up for the on-track insight card (FeedbackBar's filled path, outlined weight).
function ThumbUpIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3Zm0 0 4-7a2 2 0 0 1 2 2v3h5.2a2 2 0 0 1 1.98 2.3l-.9 6A2 2 0 0 1 17.3 19H9a2 2 0 0 1-2-2"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// CSS-mask tinted icon from public/icons (the ChatCards CatImg pattern, local copy).
function MaskIcon({ src, size = 20, tint = TEXT_SECONDARY }: { src: string; size?: number; tint?: string }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: size,
        height: size,
        backgroundColor: tint,
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

// DLS List item/Transaction (canon 592:5497): 40px avatar · title/subtitle · right-aligned value.
function ListRow({
  avatar,
  title,
  subtitle,
  value,
  valueColor = TEXT_PRIMARY,
  valueSub,
  onTap,
}: {
  avatar: ReactNode;
  title: string;
  subtitle?: string;
  value: string;
  valueColor?: string;
  valueSub?: string;
  onTap?: () => void;
}) {
  const Comp: "button" | "div" = onTap ? "button" : "div";
  return (
    <Comp
      type={onTap ? "button" : undefined}
      onClick={onTap}
      className={onTap ? "transition-transform active:scale-[0.99]" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: SPACE_S,
        width: "100%",
        padding: `${SPACE_M}px ${SPACE_L}px`,
        background: "none",
        border: "none",
        textAlign: "left",
        cursor: onTap ? "pointer" : "default",
      }}
    >
      {avatar}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
        {subtitle && <span style={{ ...typography.caption, color: TEXT_SECONDARY }}>{subtitle}</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, flexShrink: 0 }}>
        <span style={{ ...typography.bodyNormal, color: valueColor, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{value}</span>
        {valueSub && <span style={{ ...typography.caption, color: TEXT_TERTIARY, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{valueSub}</span>}
      </div>
    </Comp>
  );
}

// 40px avatar disc (white, subtle border) with a tinted 20px glyph — the DLS transaction avatar.
function AvatarDisc({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: RADIUS_CIRCLE,
        backgroundColor: CAT_AVATAR_FILL,
        border: `1px solid ${OUTLINE_SUBTLE}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

// Budget-tab avatar: the category disc wrapped by a draining progress ring (canon rows).
const ROW_RING_SIZE = 48;
const ROW_RING_SW = 3.5;
const ROW_RING_R = (ROW_RING_SIZE - ROW_RING_SW) / 2;
const ROW_RING_CIRC = 2 * Math.PI * ROW_RING_R;

function RingAvatar({ frac, color, drawn, delay, children }: { frac: number; color: string; drawn: boolean; delay: number; children: ReactNode }) {
  return (
    <div style={{ position: "relative", width: ROW_RING_SIZE, height: ROW_RING_SIZE, flexShrink: 0 }}>
      <svg width={ROW_RING_SIZE} height={ROW_RING_SIZE} viewBox={`0 0 ${ROW_RING_SIZE} ${ROW_RING_SIZE}`} style={{ position: "absolute", inset: 0 }}>
        <circle cx={ROW_RING_SIZE / 2} cy={ROW_RING_SIZE / 2} r={ROW_RING_R} fill="none" stroke={`color-mix(in srgb, ${color} 14%, transparent)`} strokeWidth={ROW_RING_SW} />
        <circle
          cx={ROW_RING_SIZE / 2}
          cy={ROW_RING_SIZE / 2}
          r={ROW_RING_R}
          fill="none"
          stroke={color}
          strokeWidth={ROW_RING_SW}
          strokeLinecap="round"
          strokeDasharray={ROW_RING_CIRC}
          strokeDashoffset={ROW_RING_CIRC - (drawn ? frac : 0) * ROW_RING_CIRC}
          transform={`rotate(-90 ${ROW_RING_SIZE / 2} ${ROW_RING_SIZE / 2})`}
          style={{ transition: `stroke-dashoffset 700ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: RADIUS_CIRCLE, backgroundColor: CAT_AVATAR_FILL, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const INR = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

// ─── The monies rewards explainer (canon 655:5326) ───────────

const MONIES_SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "1 monies per ₹1 spent",
    body: "Earn 1 monies for every ₹1 spent using slice super card",
  },
  {
    heading: "Redeem to cash",
    body: "Monies can be redeemed for cash into your slice savings account. The conversion rate starts at 1% and goes up to 3%",
  },
  {
    heading: "Exclusions from earning monies",
    body: "Transactions converted into EMIs\nMissed repayments\nRefunded transactions\nSpending in the following categories:\n• Wallet loading\n• Fuel\n• Insurance\n• Rental\n• Education\n• Online gaming & gambling\n• Taxes & government services",
  },
];

function MoniesPage({ open, onBack, hideStatusBar }: { open: boolean; onBack: () => void; hideStatusBar: boolean }) {
  return (
    <div
      className="absolute inset-0 z-10"
      style={{
        backgroundColor: BG_PRIMARY,
        transform: open ? "translateX(0%)" : "translateX(100%)",
        transition: "transform 350ms cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "transform",
        pointerEvents: open ? "auto" : "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="shrink-0" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        {!hideStatusBar ? <StatusBar /> : <div style={{ height: 44 }} aria-hidden />}
        <div className="flex items-center" style={{ height: 64, paddingLeft: 12 }}>
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="flex items-center justify-center transition-transform active:scale-[0.9]"
            style={{ width: 48, height: 48, background: "none", border: "none", cursor: "pointer", padding: 12 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6L9 12L15 18" stroke={TEXT_PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
      <div className="scrollbar-none [&::-webkit-scrollbar]:hidden" style={{ flex: 1, overflowY: "auto", padding: `${SPACE_S}px ${SPACE_L}px ${BOTTOM_INSET + SPACE_L}px` }}>
        <h1 style={{ ...typography.headerH2, color: TEXT_PRIMARY, margin: 0 }}>monies</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: SPACE_L, marginTop: SPACE_L }}>
          {MONIES_SECTIONS.map((s) => (
            <div key={s.heading} style={{ display: "flex", flexDirection: "column", gap: SPACE_XS }}>
              <p style={{ ...typography.headerH4, color: TEXT_PRIMARY, margin: 0 }}>{s.heading}</p>
              <p className="whitespace-pre-line" style={{ ...typography.bodySmall, color: TEXT_SECONDARY, margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── The dashboard ───────────────────────────────────────────

type TabId = "budget" | "cashflow" | "goals";
const TABS: { id: TabId; label: string }[] = [
  { id: "budget", label: "Budget" },
  { id: "cashflow", label: "Cashflow" },
  { id: "goals", label: "Goals" },
];

export default function GoalListScreen({
  goals,
  onGoalTap,
  onClose,
  onAddGoal,
  heroRingHidden = false, // kept for API parity — the redesign has no hero ring to hide
  hideStatusBar = false,
  budgets,
}: {
  goals: GoalIndicatorData[];
  onGoalTap: (goal: GoalIndicatorData) => void;
  onClose: () => void;
  // "Add goal" action on the Goals tab — in the peek this dismisses back to the chat to set one up.
  onAddGoal?: () => void;
  heroRingHidden?: boolean;
  // In the peek, the fixed chrome (status bar + close) is the parent overlay's; this screen only
  // adds its own ⓘ chip aligned to that chrome, and pads the scroll under it.
  hideStatusBar?: boolean;
  // The LIVE plan's category caps (tier + budget edits applied). Falls back to the fixture.
  budgets?: CategoryBudget[];
}) {
  void heroRingHidden;
  const categories = budgets ?? SPENDING_PLAN_FIXTURE.categoryBudgets;
  const { monthly, spent } = getSafeToSpendSnapshot(budgets);
  const left = Math.max(0, monthly - spent);

  const [tab, setTab] = useState<TabId>("budget");
  const [infoOpen, setInfoOpen] = useState(false);
  // Charge the header bar + rings up from empty on mount — the page draws itself in.
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setDrawn(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  // Month framing: "Left to spend • Aug", "90% budget · 23 days left".
  const now = new Date();
  const monthShort = now.toLocaleString("en-IN", { month: "short" });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(0, daysInMonth - now.getDate());
  const pctLeft = monthly > 0 ? Math.round((left / monthly) * 100) : 0;
  // On-track projection: what's left after the current daily burn runs out the month (rounded to ₹5).
  const dayOfMonth = Math.max(1, now.getDate());
  const projectedExtra = Math.max(0, Math.round((left - (spent / dayOfMonth) * daysLeft) / 5) * 5);
  const onTrack = projectedExtra > 0;

  // Cashflow rows (canon 636:8633): money-in and the final left-to-spend read positive green.
  const intoGoals = SPENDING_PLAN_FIXTURE.savingsTarget;
  const cashflowRows: { icon: string; title: string; subtitle: string; value: string; valueColor?: string }[] = [
    { icon: "/icons/categories/self-transfer.svg", title: "Income", subtitle: "1st of the month", value: INR(SPENDING_PLAN_FIXTURE.income), valueColor: GREEN_500 },
    { icon: "/icons/categories/bills.svg", title: "Recurring spends", subtitle: "Rent, EMIs, subscriptions", value: INR(SPENDING_PLAN_FIXTURE.obligations) },
    { icon: "/icons/categories/investment.svg", title: "Into Goals", subtitle: `${Math.max(1, goals.length)} autopay${goals.length > 1 ? "s" : ""}`, value: INR(intoGoals) },
    { icon: "/icons/categories/shopping.svg", title: "Spent this month", subtitle: `${categories.length} categories`, value: INR(spent) },
    { icon: "/icons/categories/personal.svg", title: "Left to spend", subtitle: `${daysLeft} days to go`, value: INR(left), valueColor: GREEN_500 },
  ];

  return (
    <div style={{ position: "relative", backgroundColor: BG_PRIMARY, display: "flex", flexDirection: "column", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* App bar — standalone renders its own (✕ left, ⓘ right); the peek keeps the parent's fixed
          close and this screen only contributes the ⓘ chip aligned into that chrome. */}
      {!hideStatusBar ? (
        <div className="shrink-0" style={{ backgroundColor: BG_PRIMARY }}>
          <StatusBar />
          <div className="flex items-center" style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 12, paddingRight: 12 }}>
            <NavButton kind="close" onClick={onClose} frosted />
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              aria-label="About monies"
              className="flex items-center justify-center transition-transform active:scale-[0.94]"
              style={{ width: 48, height: 48, borderRadius: RADIUS_CIRCLE, backgroundColor: BG_SHEET, border: `1px solid ${OUTLINE_BOLD}`, boxShadow: ELEVATION_CARD, cursor: "pointer", padding: 0 }}
            >
              <InfoIcon />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ position: "absolute", top: 0, right: 12, zIndex: 5, paddingTop: "calc(env(safe-area-inset-top, 0px) + 52px)" }}>
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            aria-label="About monies"
            className="flex items-center justify-center transition-transform active:scale-[0.94]"
            style={{ width: 48, height: 48, borderRadius: RADIUS_CIRCLE, backgroundColor: BG_SHEET, border: `1px solid ${OUTLINE_BOLD}`, boxShadow: ELEVATION_CARD, cursor: "pointer", padding: 0 }}
          >
            <InfoIcon />
          </button>
        </div>
      )}

      <div
        className="scrollbar-none [&::-webkit-scrollbar]:hidden"
        style={{ flex: 1, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", paddingTop: hideStatusBar ? CHAT_APP_BAR_HEIGHT : 0, paddingBottom: BOTTOM_INSET + SPACE_L }}
      >
        {/* ── Header: Left to spend • month → amount → budget/day framing → filling bar ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: `${SPACE_S}px ${SPACE_L}px 0` }}>
          <span style={{ ...typography.caption, color: TEXT_SECONDARY }}>{`Left to spend • ${monthShort}`}</span>
          <p style={{ ...typography.headerH1, fontSize: 40, lineHeight: 1.2, color: TEXT_PRIMARY, fontVariantNumeric: "tabular-nums", margin: `${SPACE_2XS}px 0 0` }}>
            {INR(left)}
          </p>
          <span style={{ ...typography.caption, fontWeight: 500, color: VALENTINO_500, marginTop: SPACE_2XS }}>
            {`${pctLeft}% budget · ${daysLeft} days left`}
          </span>
        </div>
        <div style={{ margin: `${SPACE_L}px 32px 0` }}>
          <div style={{ height: 11, borderRadius: RADIUS_CIRCLE, backgroundColor: SLATE_50, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${drawn ? pctLeft : 0}%`,
                borderRadius: RADIUS_CIRCLE,
                backgroundColor: VALENTINO_500,
                transition: "width 720ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          </div>
        </div>

        {/* ── On-track insight card + carousel dots (canon "ToDo Card") ── */}
        <div style={{ padding: `${SPACE_L}px ${SPACE_L}px 0` }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: SPACE_S,
              minHeight: 72,
              padding: `${SPACE_M}px ${SPACE_M}px`,
              borderRadius: RADIUS_M,
              backgroundColor: `color-mix(in srgb, ${BLUE_500} 7%, ${BG_PRIMARY})`,
            }}
          >
            <ThumbUpIcon color={BLUE_500} />
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{onTrack ? "You are on track" : "Running hot"}</span>
              <span style={{ ...typography.caption, color: TEXT_SECONDARY }}>
                {onTrack
                  ? `You'll have ${INR(projectedExtra)} extra left this month.`
                  : "At this pace the budget runs out before month end."}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: SPACE_XS, marginTop: SPACE_M }}>
            {[0, 1, 2].map((i) => (
              <span key={i} aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: i === 0 ? TEXT_TERTIARY : SLATE_50 }} />
            ))}
          </div>
        </div>

        {/* ── Divider/Big + tab pills ── */}
        <div aria-hidden style={{ height: 8, backgroundColor: BG_SECONDARY, marginTop: SPACE_S }} />
        <div style={{ display: "flex", padding: `${SPACE_XS}px ${SPACE_L}px` }}>
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className="transition-transform active:scale-[0.97]"
                style={{
                  height: 32,
                  padding: `${SPACE_XS}px ${SPACE_M}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: RADIUS_CIRCLE,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: active ? BG_SECONDARY : "transparent",
                  ...typography.buttonSmall,
                  color: active ? TEXT_PRIMARY : TEXT_TERTIARY,
                  transition: "background-color 180ms ease, color 180ms ease",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        <div style={{ paddingTop: SPACE_2XS, paddingBottom: SPACE_XS }}>
          {tab === "budget" &&
            categories.map((c, i) => {
              const catSpent = c.cycleSpend ?? c.currentSpend;
              const over = catSpent > c.cap;
              const catLeft = c.cap - catSpent;
              const frac = c.cap > 0 ? Math.min(catSpent / c.cap, 1) : catSpent > 0 ? 1 : 0;
              const pctSpent = c.cap > 0 ? Math.round((catSpent / c.cap) * 100) : 0;
              return (
                <ListRow
                  key={c.name}
                  avatar={
                    <RingAvatar frac={frac} color={over ? UTILITY_NEGATIVE : BLUE_500} drawn={drawn} delay={i * 60}>
                      {CATEGORY_ICONS[c.name]}
                    </RingAvatar>
                  }
                  title={c.name}
                  subtitle={`${pctSpent}% spent`}
                  value={over ? `${INR(catSpent - c.cap)} over` : `${INR(catLeft)} left`}
                  valueColor={over ? EXT_TEXT_NEGATIVE : TEXT_PRIMARY}
                  valueSub={`of ${Math.round(c.cap).toLocaleString("en-IN")}`}
                />
              );
            })}

          {tab === "cashflow" &&
            cashflowRows.map((r) => (
              <ListRow
                key={r.title}
                avatar={
                  <AvatarDisc>
                    <MaskIcon src={r.icon} />
                  </AvatarDisc>
                }
                title={r.title}
                subtitle={r.subtitle}
                value={r.value}
                valueColor={r.valueColor ?? TEXT_PRIMARY}
              />
            ))}

          {tab === "goals" && (
            <>
              {goals.map((goal) => {
                const hasScene = goal.heroScene === "japan";
                const gradient = goal.gradient ?? `linear-gradient(135deg, ${goal.ringColor}30 0%, ${goal.ringColor} 100%)`;
                return (
                  <ListRow
                    key={goal.id}
                    avatar={
                      <div style={{ width: 40, height: 40, borderRadius: RADIUS_S, border: `1px solid ${OUTLINE_SUBTLE}`, overflow: "hidden", flexShrink: 0 }}>
                        {hasScene ? (
                          <JapanHeroScene />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: gradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 20, lineHeight: 1, userSelect: "none" }}>{goal.heroEmoji ?? goal.icon}</span>
                          </div>
                        )}
                      </div>
                    }
                    title={goal.name}
                    subtitle={`Progress ${Math.min(Math.max(goal.pct, 0), 100)}%`}
                    value={INR(goal.saved)}
                    valueSub={`of ${Math.round(goal.target).toLocaleString("en-IN")}`}
                    onTap={() => onGoalTap(goal)}
                  />
                );
              })}
              {goals.length === 0 && (
                <p style={{ ...typography.bodySmall, color: TEXT_TERTIARY, margin: 0, padding: `${SPACE_M}px ${SPACE_L}px` }}>
                  No goals yet — set one up in the chat.
                </p>
              )}
              {onAddGoal && (
                <button
                  type="button"
                  onClick={onAddGoal}
                  className="transition-transform active:scale-[0.98]"
                  style={{ display: "flex", alignItems: "center", gap: SPACE_XS, background: "none", border: "none", cursor: "pointer", padding: `${SPACE_M}px ${SPACE_L}px` }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M8 3v10M3 8h10" stroke={VALENTINO_500} strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  <span style={{ ...typography.buttonSmall, color: VALENTINO_500 }}>Add goal</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Subtle top fade under the parent's transparent peek chrome (peek only). */}
      {hideStatusBar && (
        <div
          aria-hidden
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: 112, pointerEvents: "none", background: `linear-gradient(to bottom, ${BG_PRIMARY} 0%, ${BG_PRIMARY} 74%, transparent 100%)`, zIndex: 4 }}
        />
      )}

      {/* ⓘ → monies rewards explainer (canon 655:5326), pushed in from the right. */}
      <MoniesPage open={infoOpen} onBack={() => setInfoOpen(false)} hideStatusBar={hideStatusBar} />
    </div>
  );
}
