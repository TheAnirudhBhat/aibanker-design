"use client";

// Return exp2 — a dashboard the conversation builds (persona `return-exp2`).
//
// The thesis: people don't know what to ask about their money, so the product
// leads. The home is a white, minimal dashboard of GENERATED cards; the chat is
// reachable from every point (the ask bar never leaves); and what you ask
// changes the dashboard — ask about subscriptions and a subscriptions card lands
// on the board, cap food in chat and the budget card carries the new cap.
// Follow-up chips after every answer, a topic shelf in the chat, and a proactive
// nudge card solve the "what do I ask" problem from three sides.
//
// Cards are deliberately spare: one visual idea each, few numbers, little text.
// Each card is a DIFFERENT visualization — segmented bar (cashflow), month bars
// (spends), category rings (budget), single bar (food), month timeline (bills),
// stacked bar (subscriptions), gradient progress (goal), sized rows (headroom).
//
// Visual register: pure white minimal (slice calibrated default). Language from
// Revolut (big number, avg rule, month bars), Rocket Money (bills timeline,
// save-by-cancelling), Origin (popular questions + ask input), YNAB (caps).
//
// World model: the same audited October 2026 as exp1 — income ₹50,000 closes
// exactly against spent ₹14,300 + goals ₹6,500 + upcoming ₹14,000 + left ₹15,200.
// Trip maths: ₹70,000 to go at ₹6,500/mo from 1 Nov = 11 instalments = Sep 2027;
// at ₹11,500/mo it's 7 instalments = May 2027.

import { useCallback, useEffect, useRef, useState } from "react";
import { typography } from "../lib/typography";
import {
  BG_PRIMARY,
  BG_SECONDARY,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  OUTLINE_BOLD,
  GREEN_50,
  GREEN_500,
  ORANGE_500,
  CHAT_USER_BUBBLE,
} from "../lib/colors";
import { RADIUS_M } from "../lib/radii";
import { STATUS_BAR_HEIGHT, StatusBar } from "../components/AppChrome";
import { useIsMobileProto } from "../hooks/useProtoMobile";

// ── Constants ────────────────────────────────────────────────────────────────

const GENTLE = "cubic-bezier(0.16, 1, 0.3, 1)";
const SHADOW = "0px 4px 24px rgba(0,0,0,0.08)"; // calibrated card shadow on white
const PAGE_PAD = 24;
const MAGENTA = "#D414D8"; // gradient progress tip (1528:49462 family)
const SEG_SPENT = "#23262A";
const SEG_BILLS = "#6698FF";
const SEG_GOALS = MAGENTA;
const SEG_LEFT = "#26B35B";
const NUDGE_YELLOW = "#FFC53D";

// ── The month (Oct 2026, today the 8th, 23 days left) ───────────────────────

const CATS: { icon: string; name: string; spent: number; cap: number }[] = [
  { icon: "food", name: "Food & drinks", spent: 6200, cap: 11000 },
  { icon: "shopping", name: "Shopping", spent: 3400, cap: 7000 },
  { icon: "flight", name: "Travel", spent: 2300, cap: 6000 },
  { icon: "tv", name: "Entertainment", spent: 1250, cap: 3000 },
  { icon: "home", name: "Home", spent: 1150, cap: 2500 },
];

const BILLS: { day: number; name: string }[] = [
  { day: 12, name: "Rent" },
  { day: 18, name: "Electricity" },
  { day: 25, name: "Netflix" },
];

const SUBS: { name: string; amount: number }[] = [
  { name: "Netflix", amount: 649 },
  { name: "YouTube Premium", amount: 649 },
  { name: "Spotify", amount: 149 },
];

// Nine months of spend, ₹1,000s (Feb–Oct); the dashed rule is the 8-month avg.
const MONTH_BARS: [string, number][] = [
  ["F", 11], ["M", 11], ["A", 19.3], ["M", 17.1], ["J", 20.8], ["J", 28.7], ["A", 35.2], ["S", 30.8], ["O", 14.3],
];
const USUAL_K = 21.7;

// ── The engine: question → answer text + generated cards + what to ask next ──

type CardKind = "cashflow" | "spends" | "budget" | "food" | "bills" | "subs" | "goal" | "save";

type Reply = { text: string; cards: CardKind[]; followups: string[]; caps?: boolean };

const POPULAR = ["Why is food running hot?", "What's due this month?", "How's the Japan trip?"];

const REPLIES: Record<string, Reply> = {
  "Where did my money go?": {
    text: "₹14,300 so far, well under your usual ₹21,700. Food is the biggest slice.",
    cards: ["spends"],
    followups: ["Why is food running hot?", "Can I save more?", "How's my budget doing?"],
  },
  "Why is food running hot?": {
    text: "₹6,200 of the ₹11,000 cap is gone with 23 days left. Delivery is doing most of it.",
    cards: ["food"],
    followups: ["Cap food at ₹8,000", "Can I spend more this weekend?", "Where did my money go?"],
  },
  "Am I spending more than usual?": {
    text: "No. ₹14,300 against a ₹21,700 usual month, so you're ₹7,400 under.",
    cards: ["spends"],
    followups: ["Why is food running hot?", "Can I save more?", "What's due this month?"],
  },
  "How's my budget doing?": {
    text: "₹15,200 of ₹29,500 left. Four of five categories are on plan, food is the hot one.",
    cards: ["budget"],
    followups: ["Why is food running hot?", "Can I spend more this weekend?", "Can I save more?"],
  },
  "Can I spend more this weekend?": {
    text: "You've got ₹660 a day to stay on plan. A ₹2,000 weekend is fine, it just borrows from Monday and Tuesday.",
    cards: ["cashflow"],
    followups: ["Why is food running hot?", "How's my budget doing?", "What's due this month?"],
  },
  "How's the Japan trip?": {
    text: "₹1,30,000 of ₹2,00,000, so 65% there. October's ₹6,500 went in on time.",
    cards: ["goal"],
    followups: ["When do I hit ₹2,00,000?", "Can I save more?", "What's due this month?"],
  },
  "When do I hit ₹2,00,000?": {
    text: "September 2027 at the current pace. Put in ₹5,000 more a month and it lands in May.",
    cards: ["goal"],
    followups: ["Can I save more?", "How's my budget doing?", "Where did my money go?"],
  },
  "Can I save more?": {
    text: "About ₹5,000 a month without feeling it. Here's where it hides.",
    cards: ["save"],
    followups: ["When do I hit ₹2,00,000?", "What am I subscribed to?", "Why is food running hot?"],
  },
  "What's due this month?": {
    text: "Three payments, ₹14,000 between the 12th and the 25th. Your balance covers all of them.",
    cards: ["bills"],
    followups: ["Will my balance cover the bills?", "What am I subscribed to?", "How's my budget doing?"],
  },
  "What am I subscribed to?": {
    text: "Three subscriptions, ₹1,447 a month. One of them you haven't opened since July.",
    cards: ["subs"],
    followups: ["Can I save more?", "What's due this month?", "Where did my money go?"],
  },
  "Will my balance cover the bills?": {
    text: "Yes. ₹29,200 in the account against ₹14,000 due, and nothing overlaps the trip instalment.",
    cards: ["bills"],
    followups: ["What's due this month?", "How's the Japan trip?", "Can I save more?"],
  },
  "Cap food at ₹8,000": {
    text: "Done, food is capped at ₹8,000 from here. You're at ₹6,200, so I'll nudge you when there's ₹1,000 left. Your budget card carries the new cap.",
    cards: ["food"],
    caps: true,
    followups: ["Can I spend more this weekend?", "How's my budget doing?", "Can I save more?"],
  },
  "Show me the food spends": {
    text: "₹6,200 across 18 orders, 11 of them delivery. Weekends account for ₹3,900 of it.",
    cards: ["food"],
    followups: ["Cap food at ₹8,000", "Can I save more?", "How's my budget doing?"],
  },
};

/** Typed input → the closest canned answer; honest fallback otherwise. */
function route(raw: string): Reply {
  const t = raw.trim().toLowerCase();
  const exact = Object.keys(REPLIES).find((k) => k.toLowerCase() === t);
  if (exact) return REPLIES[exact];
  const pick = (k: string) => REPLIES[k];
  if (/food|eat|dining|delivery/.test(t)) return pick("Why is food running hot?");
  if (/subscri|netflix|spotify|youtube/.test(t)) return pick("What am I subscribed to?");
  if (/bill|due|rent|electric|upcoming|pay/.test(t)) return pick("What's due this month?");
  if (/trip|japan|goal/.test(t)) return pick("How's the Japan trip?");
  if (/save|extra|invest/.test(t)) return pick("Can I save more?");
  if (/budget|cap|left/.test(t)) return pick("How's my budget doing?");
  if (/spend|spent|where|money|went/.test(t)) return pick("Where did my money go?");
  if (/balance|cover|account/.test(t)) return pick("Will my balance cover the bills?");
  if (/cash|flow|month|october/.test(t)) return pick("Can I spend more this weekend?");
  return {
    text: "I don't have that one yet. These I can answer properly:",
    cards: [],
    followups: POPULAR,
  };
}

/** Once food is capped, the canned answers must not quote the old caps. */
function capAware(reply: Reply, capped: boolean): Reply {
  if (!capped) return reply;
  if (reply === REPLIES["How's my budget doing?"]) {
    return { ...reply, text: "₹12,200 of ₹26,500 left. Food is capped at ₹8,000, everything else is on plan." };
  }
  if (reply === REPLIES["Why is food running hot?"]) {
    return {
      ...reply,
      text: "₹6,200 of the ₹8,000 cap is gone. Delivery is doing most of it, and I'll nudge you at ₹1,000 left.",
      followups: ["Can I spend more this weekend?", "Can I save more?", "Where did my money go?"],
    };
  }
  if (reply === REPLIES["Cap food at ₹8,000"]) {
    return { ...reply, text: "Food is already capped at ₹8,000. You're at ₹6,200 of it." };
  }
  return reply;
}

const TOPICS: { id: string; label: string; questions: string[] }[] = [
  { id: "spends", label: "Spends", questions: ["Where did my money go?", "Am I spending more than usual?", "Why is food running hot?"] },
  { id: "budget", label: "Budget", questions: ["How's my budget doing?", "Can I spend more this weekend?", "Cap food at ₹8,000"] },
  { id: "goals", label: "Goals", questions: ["How's the Japan trip?", "When do I hit ₹2,00,000?", "Can I save more?"] },
  { id: "bills", label: "Bills", questions: ["What's due this month?", "What am I subscribed to?", "Will my balance cover the bills?"] },
];

// ── UI atoms ─────────────────────────────────────────────────────────────────

function Card({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div
      style={{
        background: BG_PRIMARY,
        borderRadius: RADIUS_M,
        boxShadow: SHADOW,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        animation: `cardRise 640ms ${GENTLE} ${delay}ms both`,
      }}
    >
      {children}
    </div>
  );
}

function CardLead({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>{label}</span>
      <span style={{ ...typography.headerH2, color: TEXT_PRIMARY }}>{value}</span>
      <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>{sub}</span>
    </div>
  );
}

function Bar({ pct, color, h = 5 }: { pct: number; color: string; h?: number }) {
  return (
    <div style={{ position: "relative", height: h, borderRadius: h, background: BG_SECONDARY, width: "100%" }}>
      <div style={{ position: "absolute", inset: 0, width: `${Math.min(100, pct)}%`, borderRadius: h, background: color }} />
    </div>
  );
}

function GradientBar({ pct }: { pct: number }) {
  return (
    <div style={{ position: "relative", height: 5.4, borderRadius: 12, background: "#EDEDED", width: "100%" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: `${pct}%`,
          borderRadius: 12,
          background: `linear-gradient(to left, ${MAGENTA} 6.7%, rgba(255,255,255,1) 102.6%)`,
        }}
      />
    </div>
  );
}

/** Dot + tiny label, the shared legend chip. */
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ ...typography.metadata, color: TEXT_TERTIARY }}>{label}</span>
    </div>
  );
}

function ChipButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...typography.buttonSmall,
        color: TEXT_PRIMARY,
        background: BG_PRIMARY,
        border: `1px solid ${OUTLINE_BOLD}`,
        borderRadius: 100,
        padding: "9px 14px",
        whiteSpace: "nowrap",
        cursor: "pointer",
        flexShrink: 0,
        boxShadow: SHADOW,
      }}
    >
      {label}
    </button>
  );
}

// ── Generated cards — one visual idea each, few numbers, little text ─────────

const SEGMENTS: { label: string; value: number; color: string }[] = [
  { label: "Spent", value: 14300, color: SEG_SPENT },
  { label: "Bills", value: 14000, color: SEG_BILLS },
  { label: "Goals", value: 6500, color: SEG_GOALS },
  { label: "Left", value: 15200, color: SEG_LEFT },
];

/** Cashflow — the hero number over one segmented bar of the whole month. */
function CashflowCard({ delay = 0 }: { delay?: number }) {
  return (
    <Card delay={delay}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>Left to spend</span>
        <span style={{ ...typography.headerH1, color: TEXT_PRIMARY }}>₹15,200</span>
        <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>₹660 a day · 23 days</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 3, height: 10 }}>
          {SEGMENTS.map((seg) => (
            <div key={seg.label} style={{ flex: seg.value, borderRadius: 6, background: seg.color }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {SEGMENTS.map((seg) => (
            <LegendDot key={seg.label} color={seg.color} label={seg.label} />
          ))}
        </div>
      </div>
    </Card>
  );
}

/** Spends — nine month bars against a dashed "usual" rule. Nothing else. */
function SpendsCard({ delay = 0 }: { delay?: number }) {
  const K = 2; // px per ₹1,000
  return (
    <Card delay={delay}>
      <CardLead label="Spent · October" value="₹14,300" sub="₹7,400 under your usual month" />
      <div style={{ position: "relative", paddingTop: 4 }}>
        {/* baseline is 18px up (6px gap + 12px label); the 12px rule row centres its
            1px line, so anchor at 18 + avg·K − 6 for the line to sit exactly on avg */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 18 + USUAL_K * K - 6, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, borderTop: "1px dashed rgba(0,0,0,0.18)" }} />
          <span style={{ ...typography.metadata, color: TEXT_TERTIARY }}>USUAL</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 2px" }}>
          {MONTH_BARS.map(([label, k], i) => {
            const current = i === MONTH_BARS.length - 1;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                {current ? (
                  <img src="/return-exp1/bar-highlight.png" alt="" style={{ width: 8, height: k * K, borderRadius: "20px 20px 1px 1px" }} />
                ) : (
                  <div style={{ width: 8, height: k * K, borderRadius: "20px 20px 1px 1px", background: "#EAEBED" }} />
                )}
                <span style={{ ...typography.metadata, color: TEXT_TERTIARY }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

/** A category ring — arc = share of the cap used, icon inside. */
function Ring({ icon, frac, hot }: { icon: string; frac: number; hot?: boolean }) {
  const R = 17;
  const C = 2 * Math.PI * R;
  return (
    <div style={{ position: "relative", width: 40, height: 40 }}>
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={R} fill="none" stroke={BG_SECONDARY} strokeWidth="3.5" />
        <circle
          cx="20"
          cy="20"
          r={R}
          fill="none"
          stroke={hot ? ORANGE_500 : SEG_LEFT}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${C * Math.min(1, frac)} ${C}`}
          transform="rotate(-90 20 20)"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          margin: "auto",
          width: 15,
          height: 15,
          backgroundColor: TEXT_SECONDARY,
          WebkitMaskImage: `url(/return-exp1/icons/${icon}.svg)`,
          maskImage: `url(/return-exp1/icons/${icon}.svg)`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
    </div>
  );
}

/** Budget — five category rings; the arc is how much of each cap is used. */
function BudgetCard({ delay = 0, foodCap }: { delay?: number; foodCap: number }) {
  const capsTotal = 29500 - 11000 + foodCap;
  const leftTotal = capsTotal - 14300;
  return (
    <Card delay={delay}>
      <CardLead
        label={foodCap === 8000 ? "Budget · food capped" : "Budget · October"}
        value={`₹${leftTotal.toLocaleString("en-IN")} left`}
        sub={`of ₹${capsTotal.toLocaleString("en-IN")}`}
      />
      <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 2px 0" }}>
        {CATS.map((c) => (
          <Ring key={c.icon} icon={c.icon} frac={c.spent / (c.icon === "food" ? foodCap : c.cap)} hot={c.icon === "food"} />
        ))}
      </div>
    </Card>
  );
}

/** Food — one bar, one line. */
function FoodCard({ delay = 0, foodCap }: { delay?: number; foodCap: number }) {
  return (
    <Card delay={delay}>
      <CardLead
        label={foodCap === 8000 ? "Food & drinks · capped" : "Food & drinks"}
        value="₹6,200"
        sub={`of ₹${foodCap.toLocaleString("en-IN")}`}
      />
      <Bar pct={(6200 / foodCap) * 100} color={ORANGE_500} />
      <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>
        {foodCap === 8000 ? "I'll nudge you at ₹1,000 left." : "Mostly delivery, mostly weekends."}
      </span>
    </Card>
  );
}

/** Bills — the month as a timeline: a tick for today, a dot per payment. */
function BillsCard({ delay = 0 }: { delay?: number }) {
  const x = (day: number) => `${((day - 1) / 30) * 100}%`;
  return (
    <Card delay={delay}>
      <CardLead label="Upcoming · October" value="₹14,000" sub="balance covers all of them" />
      <div style={{ position: "relative", height: 44, margin: "0 8px" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 11, height: 2, borderRadius: 1, background: BG_SECONDARY }} />
        {/* today */}
        <div style={{ position: "absolute", left: x(8), top: 7, width: 2, height: 10, borderRadius: 1, background: TEXT_TERTIARY, transform: "translateX(-50%)" }} />
        {BILLS.map((b) => (
          <div
            key={b.name}
            style={{ position: "absolute", left: x(b.day), top: 8, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: SEG_BILLS }} />
            <span style={{ ...typography.metadata, color: TEXT_TERTIARY, whiteSpace: "nowrap" }}>
              {b.name} · {b.day}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

const SUB_COLORS = ["#23262A", "#78808B", "#CDD0D4"];

/** Subscriptions — one stacked bar, three names, one way out. */
function SubsCard({ delay = 0 }: { delay?: number }) {
  return (
    <Card delay={delay}>
      <CardLead label="Subscriptions" value="₹1,447/mo" sub="₹17,364 a year" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 3, height: 10 }}>
          {SUBS.map((sub, i) => (
            <div key={sub.name} style={{ flex: sub.amount, borderRadius: 6, background: SUB_COLORS[i] }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {SUBS.map((sub, i) => (
            <LegendDot key={sub.name} color={SUB_COLORS[i]} label={sub.name} />
          ))}
        </div>
      </div>
      <div style={{ background: GREEN_50, borderRadius: 12, padding: "10px 12px" }}>
        <span style={{ ...typography.caption, color: GREEN_500 }}>Cancel YouTube Premium, keep ₹7,788 a year.</span>
      </div>
    </Card>
  );
}

/** Goal — the gradient bar and where it lands. */
function GoalCard({ delay = 0 }: { delay?: number }) {
  return (
    <Card delay={delay}>
      <CardLead label="Trip to Japan" value="₹1,30,000" sub="of ₹2,00,000" />
      <GradientBar pct={65} />
      <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>65% · ₹6,500 a month · Sep 2027</span>
    </Card>
  );
}

/** Headroom — three sources, sized by what they'd free up. */
function SaveCard({ delay = 0 }: { delay?: number }) {
  const rows: [string, number][] = [
    ["Delivery", 2400],
    ["Shopping pace", 1950],
    ["YouTube Premium", 649],
  ];
  return (
    <Card delay={delay}>
      <CardLead label="You could save" value="₹5,000 a month" sub="without feeling it" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map(([label, amt]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ ...typography.metadata, color: TEXT_TERTIARY, width: 104, flexShrink: 0 }}>{label}</span>
            <div style={{ flex: 1 }}>
              <Bar pct={(amt / 2400) * 100} color={SEG_LEFT} h={6} />
            </div>
          </div>
        ))}
      </div>
      <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>Into the Japan pot, Sep 2027 becomes May.</span>
    </Card>
  );
}

/** The proactive nudge: one line on the board; the conversation takes it from there. */
function NudgeStrip({ onOpen, delay = 0 }: { onOpen: () => void; delay?: number }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      style={{
        background: BG_PRIMARY,
        borderRadius: RADIUS_M,
        boxShadow: SHADOW,
        padding: "14px 16px 14px 20px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        animation: `cardRise 640ms ${GENTLE} ${delay}ms both`,
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: NUDGE_YELLOW, flexShrink: 0 }} />
      <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, flex: 1 }}>Food is moving fast</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ transform: "rotate(180deg)" }}>
        <path d="M15 6L9 12L15 18" stroke={TEXT_TERTIARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ── The sim ──────────────────────────────────────────────────────────────────

type Item =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "cosimo"; text: string; cards: CardKind[] };

export default function ReturnExp2Sim() {
  const isMobile = useIsMobileProto();
  const [safeBottom, setSafeBottom] = useState(0);
  useEffect(() => {
    if (!isMobile) return;
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;left:0;bottom:0;height:0;padding-bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);
    const next = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
    probe.remove();
    const raf = requestAnimationFrame(() => setSafeBottom(next));
    return () => cancelAnimationFrame(raf);
  }, [isMobile]);

  // ── Board: what the conversation has built so far ──
  const [board, setBoard] = useState<CardKind[]>(["cashflow", "goal"]);
  const [nudgeResolved, setNudgeResolved] = useState(false);
  const [foodCap, setFoodCap] = useState(11000);
  const [freshCards, setFreshCards] = useState<Set<CardKind>>(new Set());
  // every card the conversation has generated — read at close time, so replies
  // still in flight when the chat closes are never lost to a stale closure
  const madeCards = useRef<Set<CardKind>>(new Set());

  // ── Chat ──
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLeaving, setChatLeaving] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [thinking, setThinking] = useState(false);
  const [chips, setChips] = useState<string[]>(POPULAR);
  const [chipsKey, setChipsKey] = useState(0);
  const [draft, setDraft] = useState("");
  const seq = useRef(0);
  const timers = useRef<number[]>([]);
  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const openChat = useCallback(() => {
    setChatLeaving(false);
    setChatOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    // The conversation's cards LAND on the board as the chat closes — that's the
    // whole point: asking changes the dashboard.
    setChatLeaving(true);
    later(220, () => {
      setChatOpen(false);
      setChatLeaving(false);
      setBoard((prev) => {
        const fresh = [...madeCards.current].filter((c) => !prev.includes(c));
        if (fresh.length === 0) return prev;
        // new cards land right under the cashflow hero, so the change is visible
        return [prev[0], ...fresh, ...prev.slice(1)];
      });
      setFreshCards((f) => {
        const fresh = [...madeCards.current].filter((c) => !f.has(c));
        return fresh.length === 0 ? f : new Set([...f, ...fresh]);
      });
    });
  }, [later]);

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || thinking) return; // one question at a time — no interleaved replies
      setDraft("");
      setItems((prev) => [...prev, { id: ++seq.current, role: "user", text }]);
      setChips([]);
      setThinking(true);
      const reply = capAware(route(text), foodCap === 8000);
      later(950, () => {
        setThinking(false);
        setItems((prev) => [...prev, { id: ++seq.current, role: "cosimo", text: reply.text, cards: reply.cards }]);
        reply.cards.forEach((c) => madeCards.current.add(c));
        setChips(reply.followups);
        setChipsKey((k) => k + 1);
        if (reply.caps) {
          setFoodCap(8000);
          setNudgeResolved(true);
        }
      });
    },
    [later, thinking, foodCap],
  );

  /** A nudge action or dashboard chip opens the chat already asking it. */
  const askInChat = useCallback(
    (text: string) => {
      openChat();
      later(160, () => send(text));
    },
    [openChat, send, later],
  );

  // The thread follows the conversation down.
  useEffect(() => {
    if (!chatOpen) return;
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [items, thinking, chatOpen]);

  const chromeTop = (isMobile ? 0 : STATUS_BAR_HEIGHT) + 52;
  const dockBottom = isMobile ? 12 + safeBottom : 16;

  const renderCard = (kind: CardKind, delay: number) =>
    kind === "cashflow" ? (
      <CashflowCard delay={delay} />
    ) : kind === "budget" ? (
      <BudgetCard delay={delay} foodCap={foodCap} />
    ) : kind === "food" ? (
      <FoodCard delay={delay} foodCap={foodCap} />
    ) : kind === "spends" ? (
      <SpendsCard delay={delay} />
    ) : kind === "bills" ? (
      <BillsCard delay={delay} />
    ) : kind === "subs" ? (
      <SubsCard delay={delay} />
    ) : kind === "save" ? (
      <SaveCard delay={delay} />
    ) : (
      <GoalCard delay={delay} />
    );

  return (
    <div style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden", background: BG_PRIMARY, touchAction: "manipulation" }}>
      {/* ── Chrome ── */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, background: BG_PRIMARY }}>
        {!isMobile && <StatusBar />}
        <div style={{ height: 52, display: "flex", alignItems: "center", gap: 10, padding: `0 ${PAGE_PAD}px` }}>
          <img src="/return-exp1/orb.png" alt="" style={{ width: 28, height: 28 }} />
          <span style={{ ...typography.headerH4, color: TEXT_PRIMARY, flex: 1 }}>cosimo</span>
          <span style={{ ...typography.caption, color: TEXT_SECONDARY, background: BG_SECONDARY, borderRadius: 100, padding: "5px 12px" }}>
            October
          </span>
        </div>
      </div>

      {/* ── The board: a dashboard the conversation builds ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflowY: "auto",
          scrollbarWidth: "none",
          padding: `${chromeTop + 8}px ${PAGE_PAD}px ${104 + dockBottom}px`,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px 8px 10px" }}>
          <p style={{ ...typography.headerH2, color: TEXT_PRIMARY, margin: 0 }}>Morning, Rajan</p>
          <p style={{ ...typography.bodySmall, lineHeight: "22px", color: TEXT_SECONDARY, margin: 0 }}>
            October is in good shape. The trip got its ₹6,500 on time.
          </p>
        </div>
        {!nudgeResolved && <NudgeStrip onOpen={() => askInChat("Why is food running hot?")} delay={100} />}
        {board.map((kind, i) => (
          <div key={kind}>{renderCard(kind, freshCards.has(kind) ? 120 : 60 + i * 90)}</div>
        ))}
      </div>

      {/* ── Dock: suggested questions + the ask bar (chat from anywhere) ── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 96 + dockBottom,
          background: "linear-gradient(to top, rgba(255,255,255,1) 68%, rgba(255,255,255,0))",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingBottom: dockBottom, display: "flex", flexDirection: "column", gap: 10 }}>
        <div
          role="button"
          tabIndex={0}
          aria-label="Ask cosimo"
          onClick={openChat}
          onKeyDown={(e) => e.key === "Enter" && openChat()}
          style={{
            margin: "0 20px",
            height: 56,
            borderRadius: 100,
            border: `1px solid ${OUTLINE_BOLD}`,
            background: BG_PRIMARY,
            boxShadow: SHADOW,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 16px",
            cursor: "pointer",
          }}
        >
          <img src="/return-exp1/orb.png" alt="" style={{ width: 32, height: 32 }} />
          <span style={{ ...typography.bodySmall, color: TEXT_TERTIARY }}>Ask about your money</span>
        </div>
      </div>

      {/* ── Chat: reachable from every point; what happens here edits the board ── */}
      {chatOpen && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: BG_PRIMARY,
            zIndex: 20,
            opacity: chatLeaving ? 0 : 1,
            transform: chatLeaving ? "translateY(14px)" : "translateY(0)",
            transition: `opacity 220ms ${GENTLE}, transform 220ms ${GENTLE}`,
            // the entrance animation must clear once it's done: its fill would pin
            // opacity/transform and the leave transition would never render
            animation: chatLeaving ? "none" : `cardRise 300ms ${GENTLE} both`,
            pointerEvents: chatLeaving ? "none" : "auto",
          }}
        >
          {/* chat chrome */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 4, background: BG_PRIMARY }}>
            {!isMobile && <StatusBar />}
            <div style={{ height: 52, display: "flex", alignItems: "center", gap: 10, padding: `0 ${PAGE_PAD}px` }}>
              <img src="/return-exp1/orb.png" alt="" style={{ width: 28, height: 28 }} />
              <span style={{ ...typography.headerH4, color: TEXT_PRIMARY, flex: 1 }}>cosimo</span>
              <button
                type="button"
                aria-label="Close chat"
                onClick={closeChat}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: `1px solid ${OUTLINE_BOLD}`,
                  background: BG_PRIMARY,
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  padding: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ transform: "rotate(-90deg)" }}>
                  <path d="M15 6L9 12L15 18" stroke={TEXT_SECONDARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* thread */}
          <div
            ref={threadRef}
            style={{
              position: "absolute",
              inset: 0,
              overflowY: "auto",
              scrollbarWidth: "none",
              padding: `${chromeTop + 12}px ${PAGE_PAD}px ${186 + dockBottom}px`,
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {items.length === 0 && !thinking && (
              <p className="animate-chat-message-in" style={{ ...typography.bodySmall, lineHeight: "22px", color: TEXT_SECONDARY, margin: 0 }}>
                Ask me anything about October, or start from one of these.
              </p>
            )}
            {items.map((it) =>
              it.role === "user" ? (
                <div key={it.id} className="animate-chat-message-in" style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ background: CHAT_USER_BUBBLE, borderRadius: RADIUS_M, padding: "10px 14px", maxWidth: "82%" }}>
                    <p style={{ ...typography.bodySmall, lineHeight: "22px", color: TEXT_PRIMARY, margin: 0 }}>{it.text}</p>
                  </div>
                </div>
              ) : (
                <div key={it.id} className="animate-chat-message-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <p style={{ ...typography.bodySmall, lineHeight: "22px", color: TEXT_PRIMARY, margin: 0 }}>{it.text}</p>
                  {it.cards.map((kind, i) => (
                    <div key={kind}>{renderCard(kind, 160 + i * 110)}</div>
                  ))}
                </div>
              ),
            )}
            {thinking && (
              <p
                className="animate-chat-message-in"
                style={{
                  ...typography.bodySmall,
                  color: TEXT_TERTIARY,
                  margin: 0,
                  animationName: "thinkingPulse",
                  animationDuration: "1.2s",
                  animationIterationCount: "infinite",
                }}
              >
                Thinking
              </p>
            )}
          </div>

          {/* chat dock: follow-ups → topics → input */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 186 + dockBottom,
              background: "linear-gradient(to top, rgba(255,255,255,1) 72%, rgba(255,255,255,0))",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingBottom: dockBottom, display: "flex", flexDirection: "column", gap: 10 }}>
            <div
              key={chipsKey}
              className="animate-chat-message-in"
              style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", padding: `4px ${PAGE_PAD}px` }}
            >
              {chips.map((c) => (
                <ChipButton key={c} label={c} onClick={() => send(c)} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, padding: `0 ${PAGE_PAD}px` }}>
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setChips(t.questions);
                    setChipsKey((k) => k + 1);
                  }}
                  style={{
                    ...typography.caption,
                    color: TEXT_SECONDARY,
                    background: BG_SECONDARY,
                    border: "none",
                    borderRadius: 100,
                    padding: "7px 0",
                    cursor: "pointer",
                    flex: 1,
                    textAlign: "center",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div style={{ margin: "0 20px", position: "relative" }}>
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(draft)}
                placeholder="Ask about your money"
                enterKeyHint="send"
                style={{
                  width: "100%",
                  height: 56,
                  borderRadius: 100,
                  border: `1px solid ${OUTLINE_BOLD}`,
                  background: BG_PRIMARY,
                  boxShadow: SHADOW,
                  outline: "none",
                  padding: "0 56px 0 20px",
                  ...typography.bodySmall,
                  color: TEXT_PRIMARY,
                }}
              />
              <button
                type="button"
                aria-label="Send"
                onClick={() => send(draft)}
                disabled={!draft.trim()}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: draft.trim() ? "pointer" : "default",
                  opacity: draft.trim() ? 1 : 0.45,
                }}
              >
                <img src="/return-exp1/orb.png" alt="" style={{ width: 32, height: 32, display: "block", margin: "0 auto" }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
