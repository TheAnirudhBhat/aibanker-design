"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { typography } from "../lib/typography";
import {
  VALENTINO_500,
  BG_PRIMARY,
  BG_CARD,
  BG_SECONDARY,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  TEXT_DISABLED,
  TEXT_ON_COLOR_PRIMARY,
  OUTLINE_SUBTLE,
  OUTLINE_BOLD,
  BLUE_50,
  BLUE_500,
  GREEN_50,
  GREEN_500,
  RED_50,
  RED_500,
  BTN_BG_PRIMARY_DEFAULT,
  CHAT_USER_BUBBLE,
  MAIN_PRIMARY_SUBTLE,
  EXT_TEXT_MAIN,
} from "../lib/colors";
import { ELEVATION_CARD } from "../lib/elevation";
import { RADIUS_M, RADIUS_PILL } from "../lib/radii";
import { StatusBar, STATUS_BAR_HEIGHT } from "../components/AppChrome";
import MockKeyboard, { MOCK_KEYBOARD_HEIGHT } from "../components/MockKeyboard";
import { useTypewriter } from "../components/Chat";
import { DlsTag } from "../components/ChatCards";
import { useIsMobileProto } from "../hooks/useProtoMobile";

// ─────────────────────────────────────────────────────────────────────────────
// Return exp1 — returning-user dashboard experiment (Figma qo0U58MJSHQ3o4E0QUaDRK
// section 1420:28634) + R2/R3 feedback (2026-08-12).
//
// States, all spring-driven:
//   rest   — V-500 gradient hero (welcome + insight) with the "Ask cosimo"
//            input inside it, dashboard cards below.
//   docked — on scroll, ONLY the ask input morphs into the 182×48 app-bar pill
//            (calibrated in R3: the whole-hero morph was rejected); chrome
//            flips from on-brand to white with a soft spring.
//   full   — on tap, the hero grows over the frame, whitens late, and becomes
//            a working chat: type or tap a suggestion, cosimo answers.
// Two pages share the shell: the dashboard and the "Trip to Japan" detail
// (tap the trip stat card) — a fluid crossfade switch (no slide), with the
// trip insight "generating" in (shimmer → typewriter). The kebab opens a
// widget sheet — toggle the dashboard cards, add new ones.
// ─────────────────────────────────────────────────────────────────────────────

// Proto-specific decorative values from the Figma frames (not DLS tokens):
const PROGRESS_INDIGO = "#6976EB"; // stat-block progress fill (1420:24428)
const PROGRESS_GROOVE = "#D9D9D9"; // stat-block progress groove (1420:24427)
const CHART_GREEN = "#04E762"; // cashflow graph line (1420:24494)
const CHART_CORAL = "#FF715B"; // cashflow graph line (1420:24494)

const APP_BAR_HEIGHT = 64;
const CHROME_HEIGHT = STATUS_BAR_HEIGHT + APP_BAR_HEIGHT; // 108
const HERO_PADDING_TOP = CHROME_HEIGHT + 16; // 124 — Figma hero pt
const PILL_REST_HEIGHT = 57; // px-24 py-20 input (1420:21780)
const PILL_DOCK_WIDTH = 182; // app-bar pill (1420:24788)
const PILL_DOCK_HEIGHT = 48;
const PILL_DOCK_TOP = STATUS_BAR_HEIGHT + 8; // centered in the 64px bar row
const PAGE_PADDING = 24;
const PILL_MARGIN = 20; // Figma pill is 320 wide on a 360 frame
const KEYBOARD_GAP = 20; // input bottom → keyboard top (R4: 8px tighter than the frame)

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// exp5 (2026-08-12, revertable): on the trip page the ask pill pops in only
// AFTER the generated insight finishes typing. Flip to false to revert.
const EXP5_PILL_AFTER_TYPE = false; // exp5 reverted (2026-08-12) — pill shows immediately again

/** rAF spring toward `target`. Interruptible — retargeting keeps velocity. */
function useSpringValue(target: number, stiffness = 320, damping = 32) {
  const [value, setValue] = useState(target);
  const state = useRef({ v: target, vel: 0, raf: 0, last: 0 });
  useEffect(() => {
    const s = state.current;
    cancelAnimationFrame(s.raf);
    // Hidden document: rAF is paused, so snap — nobody sees the tween, and the
    // UI must not freeze mid-morph when the app is backgrounded mid-spring.
    if (typeof document !== "undefined" && document.hidden) {
      s.v = target;
      s.vel = 0;
      const snap = window.setTimeout(() => setValue(target), 0);
      return () => window.clearTimeout(snap);
    }
    s.last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - s.last) / 1000, 1 / 30);
      s.last = now;
      const accel = stiffness * (target - s.v) - damping * s.vel;
      s.vel += accel * dt;
      s.v += s.vel * dt;
      if (Math.abs(target - s.v) < 0.0005 && Math.abs(s.vel) < 0.005) {
        s.v = target;
        s.vel = 0;
        setValue(target);
        return;
      }
      setValue(s.v);
      s.raf = requestAnimationFrame(tick);
    };
    s.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(s.raf);
  }, [target, stiffness, damping]);
  return value;
}

// ── Icons (geometry from DLS — chevron matches AppChrome NavButton, kebab is
//    Interface/Other 1306:5436 from the Figma payload, fills → currentColor) ──

function ChevronIcon({ color, rotate = 0 }: { color: string; rotate?: number }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M15 6L9 12L15 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KebabIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="4" viewBox="0 0 16 4" fill="none">
      <path d="M2 0C3.10857 0 4 0.891428 4 2C4 3.10857 3.10857 4 2 4C0.891428 4 0 3.10857 0 2C0 0.891429 0.891429 0 2 0Z" fill={color} />
      <path d="M8 0C9.10857 0 10 0.891428 10 2C10 3.10857 9.10857 4 8 4C6.89143 4 6 3.10857 6 2C6 0.891429 6.89143 0 8 0Z" fill={color} />
      <path d="M14 0C15.1086 0 16 0.891428 16 2C16 3.10857 15.1086 4 14 4C12.8914 4 12 3.10857 12 2C12 0.891429 12.8914 0 14 0Z" fill={color} />
    </svg>
  );
}

/** 48px frosted chrome chip that crossfades on-brand → on-white with `t`.
    `ghost` (0..1) dissolves the chip chrome — chat mode keeps just the glyph. */
function ChromeChip({ t, ghost = 0, onClick, children, ariaLabel }: {
  t: number;
  ghost?: number;
  onClick?: () => void;
  children: (color: string) => React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        width: 48,
        height: 48,
        borderRadius: 100,
        border: ghost > 0.5 ? "1px solid transparent" : `1px solid ${OUTLINE_SUBTLE}`,
        background: `rgba(255,255,255,${lerp(lerp(0.16, 1, t), 0, ghost)})`,
        backdropFilter: ghost > 0.5 ? undefined : "blur(12px)",
        WebkitBackdropFilter: ghost > 0.5 ? undefined : "blur(12px)",
        boxShadow: ghost > 0.5 ? "none" : ELEVATION_CARD,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: onClick ? "pointer" : "default",
        padding: 0,
        position: "relative",
      }}
    >
      {/* stacked white/dark glyphs crossfaded so the flip stays theme-safe */}
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: 1 - t }}>
        {children(TEXT_ON_COLOR_PRIMARY)}
      </div>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: t }}>
        {children("var(--dls-text-secondary)")}
      </div>
    </button>
  );
}

// ── Dashboard cards (content per Figma 1420:21632) ──────────────────────────

const cardBase: React.CSSProperties = {
  background: BG_CARD,
  border: `1px solid ${OUTLINE_SUBTLE}`,
  borderRadius: RADIUS_M,
  boxShadow: ELEVATION_CARD,
  width: "100%",
};

function CardHeaderRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
      <span style={{ ...typography.metadata, color: TEXT_PRIMARY, textTransform: "uppercase" }}>{label}</span>
      <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{value}</span>
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div style={{ position: "relative", height: 4, width: "100%" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 5, background: PROGRESS_GROOVE }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${pct}%`, borderRadius: 5, background: PROGRESS_INDIGO }} />
    </div>
  );
}

function StatCard({ onOpen }: { onOpen: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Trip to Japan details"
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      style={{ ...cardBase, padding: "14px 20px 20px", display: "flex", flexDirection: "column", gap: 10, cursor: "pointer" }}
    >
      <CardHeaderRow label="Trip to Japan" value="65%" />
      <ProgressBar pct={67.5} />
    </div>
  );
}

// Category circles with per-category progress arcs (Figma "Deposit stages").
const SPEND_CATS: { icon: string; arc: number }[] = [
  { icon: "food", arc: 0.25 },
  { icon: "home", arc: 1 },
  { icon: "flight", arc: 0.6 },
  { icon: "flight", arc: 0.6 },
  { icon: "flight", arc: 0.6 },
  { icon: "shopping", arc: 0.55 },
  { icon: "tv", arc: 0.9 },
  { icon: "home", arc: 1 },
];

function CategoryAvatar({ icon, arc }: { icon: string; arc: number }) {
  const R = 16;
  const C = 2 * Math.PI * R;
  return (
    <div style={{ position: "relative", width: 32, height: 32, borderRadius: "50%", background: BLUE_50, border: `1px solid ${OUTLINE_SUBTLE}` }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          margin: "auto",
          width: 13,
          height: 13,
          backgroundColor: BLUE_500,
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
      <svg width="36" height="36" viewBox="0 0 36 36" style={{ position: "absolute", top: -2.5, left: -2.5 }}>
        <circle cx="18" cy="18" r={R} fill="none" stroke={BLUE_500} strokeWidth="1.5" strokeLinecap="round" strokeDasharray={`${C * arc} ${C}`} transform="rotate(-90 18 18)" />
      </svg>
    </div>
  );
}

function LeftToSpendCard() {
  return (
    <div style={{ ...cardBase, padding: "20px 20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <CardHeaderRow label="Left to spend" value="₹16,900" />
        <div style={{ height: 1, width: "100%", background: OUTLINE_SUBTLE }} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {SPEND_CATS.map((c, i) => (
          <CategoryAvatar key={i} icon={c.icon} arc={c.arc} />
        ))}
      </div>
    </div>
  );
}

// Cashflow chart — drawn from the Figma dot geometry so points, lines, grid and
// month labels share one x-grid and stay aligned (R2 feedback: graph alignment).
const CHART_W = 312;
const CHART_H = 169;
const CHART_XS = [33, 99.5, 166, 232.5, 299]; // JUN..OCT centers
const GREEN_PTS: [number, number][] = [[33, 117.9], [99.5, 101.8], [166, 61.9]];
const CORAL_PTS: [number, number][] = [[33, 57.1], [99.2, 29.6], [166, 48.2]];
const GREEN_PROJ: [number, number][] = [[166, 61.9], [232.5, 48], [299, 40]];
const CORAL_PROJ: [number, number][] = [[166, 48.2], [232.5, 58], [299, 50]];

const toPath = (pts: [number, number][]) => pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");

function CashflowCard() {
  return (
    <div style={{ ...cardBase, padding: "20px 0 24px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0 24px" }}>
        {([
          ["Cashflow", "₹26,000", "flex-start"],
          ["Income", "₹80,000", "center"],
          ["Spent", "₹26,543", "flex-end"],
        ] as const).map(([label, value, align]) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: align }}>
            <span style={{ ...typography.metadata, color: TEXT_PRIMARY, textTransform: "uppercase" }}>{label}</span>
            <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{ height: 1, width: "100%", background: OUTLINE_SUBTLE }} />
      <div style={{ position: "relative", height: CHART_H, width: "100%", overflow: "hidden" }}>
        <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          {CHART_XS.map((x) => (
            <line key={x} x1={x} y1={8} x2={x} y2={132} stroke="rgba(0,0,0,0.07)" strokeDasharray="3 4" />
          ))}
          <line x1={CHART_XS[2]} y1={8} x2={CHART_XS[2]} y2={132} stroke={CHART_CORAL} strokeDasharray="4 4" strokeWidth="1.2" />
          <path d={toPath(GREEN_PROJ)} fill="none" stroke={CHART_GREEN} strokeWidth="1.6" strokeDasharray="4 5" opacity="0.35" />
          <path d={toPath(CORAL_PROJ)} fill="none" stroke={CHART_CORAL} strokeWidth="1.6" strokeDasharray="4 5" opacity="0.35" />
          <path d={toPath(GREEN_PTS)} fill="none" stroke={CHART_GREEN} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
          <path d={toPath(CORAL_PTS)} fill="none" stroke={CHART_CORAL} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
          {[...GREEN_PTS.map((pt) => [pt, CHART_GREEN] as const), ...CORAL_PTS.map((pt) => [pt, CHART_CORAL] as const)].map(([[x, y], c], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="6" fill={BG_CARD} />
              <circle cx={x} cy={y} r="4" fill={c} />
            </g>
          ))}
        </svg>
        {["Jun", "Jul", "Aug", "Sep", "Oct"].map((m, i) => (
          <span
            key={m}
            style={{
              position: "absolute",
              top: 148,
              left: CHART_XS[i] - 18,
              width: 36,
              textAlign: "center",
              ...typography.metadata,
              color: TEXT_DISABLED,
              textTransform: "uppercase",
            }}
          >
            {m}
          </span>
        ))}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 25, background: `linear-gradient(to right, ${BG_CARD}, transparent)`, pointerEvents: "none" }} />
      </div>
    </div>
  );
}

// ── Trip detail cards (R2/R4 feedback — same design language) ────────────────

// Month-wise contribution cell: tick = contributed, cross = skipped, dash = due.
type MonthState = "done" | "skip" | "due";

function MonthDot({ label, state }: { label: string; state: MonthState }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: state === "done" ? GREEN_50 : state === "skip" ? RED_50 : "transparent",
          border: state === "due" ? `1px dashed ${OUTLINE_BOLD}` : "none",
          display: "grid",
          placeItems: "center",
        }}
      >
        {state === "done" && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.5L5 9L9.5 3.5" stroke={GREEN_500} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {state === "skip" && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 2L8 8M8 2L2 8" stroke={RED_500} strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <span style={{ ...typography.metadata, color: TEXT_TERTIARY, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

function MonthGrid({ months }: { months: [string, MonthState][] }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
      {months.map(([label, state], i) => (
        <MonthDot key={`${label}-${i}`} label={label} state={state} />
      ))}
    </div>
  );
}

function SipTrackerCard() {
  return (
    <div style={{ ...cardBase, padding: "24px 24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      <CardHeaderRow label="SIP contributions" value="8 of 12" />
      <ProgressBar pct={66.7} />
      <MonthGrid
        months={[["J", "done"], ["F", "done"], ["M", "done"], ["A", "done"], ["M", "skip"], ["J", "done"], ["J", "done"], ["A", "done"]]}
      />
      <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>May was skipped — 4 SIPs of ₹9,000 to go</span>
    </div>
  );
}

/** Detected lumpsum headroom → one-tap top-up (its own card per R4 feedback). */
function LumpsumCard() {
  const [lumpsumAdded, setLumpsumAdded] = useState(false);
  return (
    <div style={{ ...cardBase, padding: "24px 24px 26px", display: "flex", flexDirection: "column", gap: 4 }}>
      {lumpsumAdded ? (
        <>
          <span style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>₹6,000 lumpsum queued</span>
          <span style={{ ...typography.caption, color: GREEN_500 }}>it goes in with tomorrow&rsquo;s batch</span>
        </>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>₹6,000 lumpsum looks doable</span>
            <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>this month&rsquo;s spends left you headroom</span>
          </div>
          <button
            type="button"
            onClick={() => setLumpsumAdded(true)}
            style={{
              border: "none",
              background: MAIN_PRIMARY_SUBTLE,
              borderRadius: RADIUS_PILL,
              padding: "8px 16px",
              ...typography.buttonSmall,
              fontSize: 12,
              color: EXT_TEXT_MAIN,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Add lumpsum
          </button>
        </div>
      )}
    </div>
  );
}

function AtomTrackerCard() {
  return (
    <div style={{ ...cardBase, padding: "24px 24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      <CardHeaderRow label="Atom contributions" value="₹53,000" />
      <MonthGrid
        months={[["M", "done"], ["A", "done"], ["M", "skip"], ["J", "done"], ["J", "skip"], ["A", "done"], ["S", "due"]]}
      />
      <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>4 atoms invested — auto-invested from spare change</span>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>Counted from your Mutual Fund SIP</span>
        <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>₹5,000/mo</span>
      </div>
    </div>
  );
}

function PaceCard() {
  return (
    <div style={{ ...cardBase, padding: "24px 24px 26px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <span style={{ ...typography.metadata, color: TEXT_PRIMARY, textTransform: "uppercase" }}>Pace</span>
        <DlsTag intent="positive" emphasis="subtle">12 days ahead</DlsTag>
      </div>
      <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>December&rsquo;s extra ₹6,000 put you ahead of plan — coasting works from here</span>
    </div>
  );
}

// ── Widget catalogue (kebab → customise sheet) ───────────────────────────────

function UpcomingBillsCard() {
  return (
    <div style={{ ...cardBase, padding: "24px 24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      <CardHeaderRow label="Upcoming bills" value="₹22,349" />
      {([
        ["Rent", "due 1 Sep", "₹21,700"],
        ["Netflix", "due 15 Aug", "₹649"],
      ] as const).map(([name, due, amt], i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{name}</span>
            <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>{due}</span>
          </div>
          <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{amt}</span>
        </div>
      ))}
    </div>
  );
}

function SubscriptionsCard() {
  return (
    <div style={{ ...cardBase, padding: "24px 24px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
      <CardHeaderRow label="Subscriptions" value="₹1,447/mo" />
      {([
        ["Netflix", "₹649"],
        ["YouTube Premium", "₹649"],
        ["Spotify", "₹149"],
      ] as const).map(([name, amt], i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{name}</span>
          <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{amt}</span>
        </div>
      ))}
    </div>
  );
}

type WidgetId = "trip" | "spend" | "cashflow" | "bills" | "subs";
const WIDGET_META: { id: WidgetId; label: string; default: boolean }[] = [
  { id: "trip", label: "Trip to Japan", default: true },
  { id: "spend", label: "Left to spend", default: true },
  { id: "cashflow", label: "Cashflow", default: true },
  { id: "bills", label: "Upcoming bills", default: false },
  { id: "subs", label: "Subscriptions", default: false },
];

/** DLS-style switch (Controls) — track flips to brand purple when on. */
function DlsSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      style={{
        width: 44,
        height: 26,
        borderRadius: RADIUS_PILL,
        border: "none",
        padding: 2,
        background: on ? BTN_BG_PRIMARY_DEFAULT : OUTLINE_BOLD,
        transition: "background 200ms cubic-bezier(0.22, 1, 0.36, 1)",
        cursor: "pointer",
        display: "flex",
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: TEXT_ON_COLOR_PRIMARY,
          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
          transform: `translateX(${on ? 18 : 0}px)`,
          transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </button>
  );
}

// Reorder handle — standard three-line grip, drawn as strokes.
function GripIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
      <path d="M1 1H15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M1 5H15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M1 9H15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const WIDGET_ROW_H = 56;

/** Full-page widget customiser (R4): toggle, drag-reorder, add. */
function WidgetsPage({ s, onClose, order, enabled, onToggle, onAdd, onReorder }: {
  s: number;
  onClose: () => void;
  order: WidgetId[];
  enabled: Record<WidgetId, boolean>;
  onToggle: (id: WidgetId) => void;
  onAdd: (id: WidgetId) => void;
  onReorder: (next: WidgetId[]) => void;
}) {
  const [drag, setDrag] = useState<{ idx: number; dy: number } | null>(null);
  const startY = useRef(0);
  const labelOf = (id: WidgetId) => WIDGET_META.find((m) => m.id === id)?.label ?? id;
  const addable = WIDGET_META.filter((m) => !order.includes(m.id));
  const target = drag ? Math.max(0, Math.min(order.length - 1, drag.idx + Math.round(drag.dy / WIDGET_ROW_H))) : -1;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `translateY(${(1 - s) * 100}%)`,
        background: BG_PRIMARY,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <StatusBar backgroundColor="transparent" color={TEXT_PRIMARY} />
      <div style={{ height: 64, position: "relative", display: "flex", alignItems: "center", padding: "0 16px", flexShrink: 0 }}>
        <ChromeChip t={1} ariaLabel="Back" onClick={onClose}>
          {(color) => <ChevronIcon color={color} />}
        </ChromeChip>
        <div style={{ position: "absolute", left: 56, right: 56, textAlign: "center", pointerEvents: "none" }}>
          <span style={{ ...typography.headerH4, color: TEXT_PRIMARY }}>Customise widgets</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: `8px ${PAGE_PADDING}px 0` }}>
        <p style={{ ...typography.caption, color: TEXT_SECONDARY, margin: "0 0 12px" }}>Drag to reorder — toggles hide a widget without losing its spot</p>
        <div style={{ position: "relative" }}>
          {order.map((id, i) => {
            const isDragged = drag?.idx === i;
            const shift = drag && !isDragged ? (i > drag.idx && i <= target ? -WIDGET_ROW_H : i < drag.idx && i >= target ? WIDGET_ROW_H : 0) : 0;
            return (
              <div
                key={id}
                style={{
                  height: WIDGET_ROW_H,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: BG_PRIMARY,
                  borderBottom: `1px solid ${isDragged ? "transparent" : OUTLINE_SUBTLE}`,
                  transform: `translateY(${isDragged ? drag.dy : shift}px)`,
                  transition: isDragged ? "none" : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
                  position: "relative",
                  zIndex: isDragged ? 2 : 1,
                  boxShadow: isDragged ? ELEVATION_CARD : "none",
                  borderRadius: isDragged ? RADIUS_M : 0,
                }}
              >
                <div
                  aria-label={`Reorder ${labelOf(id)}`}
                  style={{ touchAction: "none", cursor: "grab", padding: "8px 2px" }}
                  onPointerDown={(e) => {
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    startY.current = e.clientY;
                    setDrag({ idx: i, dy: 0 });
                  }}
                  onPointerMove={(e) => {
                    setDrag((d) => (d ? { ...d, dy: e.clientY - startY.current } : d));
                  }}
                  onPointerUp={() => {
                    setDrag((d) => {
                      if (d) {
                        const to = Math.max(0, Math.min(order.length - 1, d.idx + Math.round(d.dy / WIDGET_ROW_H)));
                        if (to !== d.idx) {
                          const next = [...order];
                          const [moved] = next.splice(d.idx, 1);
                          next.splice(to, 0, moved);
                          onReorder(next);
                        }
                      }
                      return null;
                    });
                  }}
                >
                  <GripIcon color={TEXT_TERTIARY} />
                </div>
                <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, flex: 1 }}>{labelOf(id)}</span>
                <DlsSwitch on={enabled[id]} onToggle={() => onToggle(id)} />
              </div>
            );
          })}
        </div>
        {addable.length > 0 && (
          <>
            <p style={{ ...typography.metadata, color: TEXT_TERTIARY, textTransform: "uppercase", margin: "20px 0 4px" }}>Add widgets</p>
            {addable.map((wm) => (
              <div key={wm.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
                <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY }}>{wm.label}</span>
                <button
                  type="button"
                  onClick={() => onAdd(wm.id)}
                  style={{
                    border: "none",
                    background: BG_SECONDARY,
                    borderRadius: RADIUS_PILL,
                    padding: "7px 14px",
                    ...typography.buttonSmall,
                    fontSize: 12,
                    color: TEXT_PRIMARY,
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            ))}
          </>
        )}
      </div>
      <div style={{ padding: PAGE_PADDING, flexShrink: 0 }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            height: 52,
            border: "none",
            borderRadius: RADIUS_PILL,
            background: BTN_BG_PRIMARY_DEFAULT,
            color: TEXT_ON_COLOR_PRIMARY,
            ...typography.buttonNormal,
            cursor: "pointer",
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

// ── Chat content (the fullscreen ask is a working chat) ─────────────────────

const SUGGESTIONS: { img: string; text: string; crop?: React.CSSProperties }[] = [
  { img: "suggest-spends", text: "What have been my biggest spends?" },
  {
    img: "suggest-categories",
    text: "My top spending categories?",
    crop: { width: "485.63%", height: "323.05%", left: "-44.59%", top: "-47.71%" },
  },
  {
    img: "suggest-categories",
    text: "What your spending says about me?",
    crop: { width: "520.94%", height: "347.63%", left: "-335.93%", top: "-61.47%" },
  },
];

const ANSWERS: Record<string, string> = {
  "What have been my biggest spends?":
    "Rent tops the list at ₹21,700, then last week's ₹4,300 flight add-on. Food delivery is the quiet one — ₹8,400 this month.",
  "My top spending categories?":
    "Food & delivery, shopping, transport — in that order. Together they're 67% of this month's spends.",
  "What your spending says about me?":
    "Steady on essentials, splurgy on weekends. Your savings rate says the steady side is winning.",
};

const REPLIES = [
  "On it — pulling that from your last 3 months.",
  "Noted. I'll track that and nudge you when it moves.",
  "You're covered — the trip plan absorbs it if you keep the SIPs going.",
  "Done. Anything else on your mind?",
];

type Turn = { id: number; role: "user" | "cosimo"; text: string };

function ThinkingLine() {
  return (
    <div className="animate-chat-message-in" style={{ paddingTop: 4, paddingBottom: 4 }}>
      <p className="animate-thinking-pulse" style={{ ...typography.bodySmall, color: TEXT_TERTIARY, margin: 0 }}>
        Thinking
      </p>
    </div>
  );
}

function CosimoLine({ text, active, onDone }: { text: string; active: boolean; onDone?: () => void }) {
  const shown = useTypewriter(text, active, onDone);
  return <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY, margin: 0, whiteSpace: "pre-wrap" }}>{shown}</p>;
}

/** Hero insight that "generates": shimmer bars, then the copy types in. */
function GenerativeBody({ text, phase, color, onTyped }: {
  text: string;
  phase: "shimmer" | "type" | "done";
  color: string;
  onTyped: () => void;
}) {
  const shown = useTypewriter(text, phase === "type", onTyped);
  return (
    <div style={{ position: "relative" }}>
      {/* invisible sizer keeps the hero height stable through shimmer → typing */}
      <p aria-hidden style={{ ...typography.bodySmall, margin: 0, visibility: "hidden" }}>{text}</p>
      <div style={{ position: "absolute", inset: 0 }}>
        {phase === "shimmer" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 3 }}>
            {[100, 62].map((w) => (
              <div
                key={w}
                style={{
                  height: 12,
                  width: `${w}%`,
                  borderRadius: 6,
                  background: "linear-gradient(90deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.42) 50%, rgba(255,255,255,0.18) 100%)",
                  backgroundSize: "200% 100%",
                  animation: "planBuilderShimmer 1.4s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ) : (
          <p style={{ ...typography.bodySmall, color, margin: 0 }}>{phase === "done" ? text : shown}</p>
        )}
      </div>
    </div>
  );
}

// ── Page content declarations ────────────────────────────────────────────────

type PageId = "home" | "trip";

const HERO_COPY: Record<PageId, { title: string; body: string }> = {
  home: {
    title: "Welcome back  👋🏼",
    body: "You're ₹3,200 closer to your Trip to Japan goal. Your savings rate jumped 18% this month — your best streak yet!",
  },
  trip: {
    title: "Trip to Japan",
    body: "₹1,30,000 saved of ₹2,00,000 — 65% there. Keep this pace and you're booking flights by Dec '26.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────

export default function ReturnExp1Sim() {
  const isMobile = useIsMobileProto();
  const frameRef = useRef<HTMLDivElement>(null);
  const scrollerRefs = useRef<Record<PageId, HTMLDivElement | null>>({ home: null, trip: null });
  const welcomeRefs = useRef<Record<PageId, HTMLDivElement | null>>({ home: null, trip: null });
  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const [frame, setFrame] = useState({ w: 360, h: 780 });
  const [welcomeHs, setWelcomeHs] = useState<Record<PageId, number>>({ home: 108, trip: 92 });
  // Scroll lives in a ref — scrolling must never re-render the tree (mobile jank).
  // The overlay pill's rest endpoint is FROZEN into state at each morph start.
  const scrollYRef = useRef<Record<PageId, number>>({ home: 0, trip: 0 });
  const [restTop, setRestTop] = useState(260);
  const [page, setPage] = useState<PageId>("home");
  const pageRef = useRef<PageId>("home");
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const [docked, setDocked] = useState(false);
  const dockedRef = useRef(false);
  useEffect(() => {
    dockedRef.current = docked;
  }, [docked]);
  const [full, setFull] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Trip insight "generates" on every visit: shimmer beat → typewriter.
  const [tripGen, setTripGen] = useState<"shimmer" | "type" | "done">("shimmer");
  useEffect(() => {
    if (page !== "trip") return;
    const t = window.setTimeout(() => setTripGen("type"), 680);
    return () => {
      window.clearTimeout(t);
      setTripGen("shimmer"); // reset so the next visit generates again
    };
  }, [page]);

  // Springs: dock keeps pace with the 380ms scroll snap — a slow spring here
  // leaves the white chrome hanging after the snap lands (R3 feedback).
  const p = useSpringValue(docked && !full ? 1 : 0, 280, 30);
  const f = useSpringValue(full ? 1 : 0, 250, 28);
  const g = useSpringValue(page === "trip" ? 1 : 0, 190, 26);
  const s = useSpringValue(sheetOpen ? 1 : 0, 300, 30);

  // Widgets — order drives the home stack; `widgets` is the on/off map.
  const [widgets, setWidgets] = useState<Record<WidgetId, boolean>>({ trip: true, spend: true, cashflow: true, bills: false, subs: false });
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(["trip", "spend", "cashflow"]);

  // Chat
  const [turns, setTurns] = useState<Turn[]>([]);
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState("");
  const [doneIds, setDoneIds] = useState<Set<number>>(new Set());
  const seqRef = useRef(0);
  const replyIdxRef = useRef(0);
  const replyTimer = useRef<number | null>(null);

  // ── Geometry ──
  const inputRestTops = {
    home: HERO_PADDING_TOP + welcomeHs.home + 32,
    trip: HERO_PADDING_TOP + welcomeHs.trip + 32,
  };
  const heroHs = {
    home: inputRestTops.home + PILL_REST_HEIGHT + 24,
    trip: inputRestTops.trip + PILL_REST_HEIGHT + 24,
  };
  const kbSpace = isMobile ? 16 : MOCK_KEYBOARD_HEIGHT + KEYBOARD_GAP;
  const fullInputTop = frame.h - kbSpace - PILL_REST_HEIGHT;

  const measure = useCallback(() => {
    const el = frameRef.current;
    if (!el) return;
    setFrame({ w: el.clientWidth, h: el.clientHeight });
    setWelcomeHs((prev) => {
      const next = { ...prev };
      (Object.keys(next) as PageId[]).forEach((pid) => {
        const w = welcomeRefs.current[pid];
        if (w && w.offsetHeight > 0) next[pid] = w.offsetHeight;
      });
      return next;
    });
  }, []);

  useEffect(() => {
    measure();
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  // ── Snap dock (R3): an early trigger, then the scroller SNAPS past the hero
  // while the pill springs into the app bar — one coordinated gesture, not a
  // late morph. Programmatic snaps are flagged so they can't re-trigger.
  const DOCK_TRIGGER_Y = 72;
  const snapRaf = useRef(0);
  const snapping = useRef(false);
  const animateScroll = useCallback((el: HTMLDivElement, to: number) => {
    cancelAnimationFrame(snapRaf.current);
    snapping.current = true;
    const from = el.scrollTop;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - t0) / 380, 1);
      el.scrollTop = from + (to - from) * (1 - Math.pow(1 - t, 3));
      if (t < 1) {
        snapRaf.current = requestAnimationFrame(step);
      } else {
        snapping.current = false;
      }
    };
    snapRaf.current = requestAnimationFrame(step);
  }, []);
  useEffect(() => () => cancelAnimationFrame(snapRaf.current), []);

  const makeScrollHandler = useCallback(
    (pid: PageId) => () => {
      const el = scrollerRefs.current[pid];
      if (!el) return;
      const y = el.scrollTop;
      scrollYRef.current[pid] = y; // ref only — no re-render per scroll frame
      if (pid !== pageRef.current || snapping.current || full) return;
      // Cards rest just under the chrome once snapped (Figma scrolled frame: y 116).
      const snapEnd = heroHs[pid] - 92;
      if (!dockedRef.current && y > DOCK_TRIGGER_Y) {
        dockedRef.current = true;
        setRestTop(inputRestTops[pid] - y); // launch the morph from here
        setDocked(true);
        if (y < snapEnd) animateScroll(el, snapEnd);
      } else if (dockedRef.current && y < snapEnd - 24) {
        // Undock the moment the user scrolls up past the snapped resting point —
        // the morph starts WITH the gesture instead of waiting near the top (R3).
        dockedRef.current = false;
        setRestTop(inputRestTops[pid]); // landing spot once scroll hits 0
        setDocked(false);
        animateScroll(el, 0);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [animateScroll, welcomeHs, full],
  );

  // Recompute dock when the active page flips (fluid switch).
  useEffect(() => {
    const y = scrollerRefs.current[page]?.scrollTop ?? 0;
    setRestTop(inputRestTops[page] - y);
    setDocked(y > DOCK_TRIGGER_Y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ── Fullscreen open/close ──
  const scrollHomeRaf = useRef(0);
  const openFull = useCallback(() => {
    const pid = pageRef.current;
    // Freeze the launch rect and release the dock — the expansion owns the pill now.
    setRestTop(inputRestTops[pid] - (scrollerRefs.current[pid]?.scrollTop ?? 0));
    setFull(true);
    const el = scrollerRefs.current[pid];
    if (!el) return;
    cancelAnimationFrame(scrollHomeRaf.current);
    const start = el.scrollTop;
    if (start <= 0) return;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - t0) / 420, 1);
      el.scrollTop = start * (1 - (1 - Math.pow(1 - t, 3)));
      if (t < 1) scrollHomeRaf.current = requestAnimationFrame(step);
    };
    scrollHomeRaf.current = requestAnimationFrame(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [welcomeHs]);
  useEffect(() => () => cancelAnimationFrame(scrollHomeRaf.current), []);

  const closeFull = useCallback(() => {
    // The collapse lands on the hero pill at scroll 0 (openFull sprung it home).
    setRestTop(inputRestTops[pageRef.current]);
    setFull(false);
    inputRef.current?.blur();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [welcomeHs]);

  // Focus the input once the expansion has mostly landed.
  useEffect(() => {
    if (!full) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 380);
    return () => window.clearTimeout(t);
  }, [full]);

  // ── Chat ──
  const send = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text || thinking) return;
    const uid = ++seqRef.current;
    setTurns((t) => [...t, { id: uid, role: "user", text }]);
    setDraft("");
    setThinking(true);
    if (replyTimer.current) window.clearTimeout(replyTimer.current);
    replyTimer.current = window.setTimeout(() => {
      setThinking(false);
      const reply = ANSWERS[text] ?? REPLIES[replyIdxRef.current++ % REPLIES.length];
      setTurns((t) => [...t, { id: ++seqRef.current, role: "cosimo", text: reply }]);
    }, 900);
  }, [thinking]);
  useEffect(() => () => { if (replyTimer.current) window.clearTimeout(replyTimer.current); }, []);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, thinking]);

  // ── Interpolations ──
  const pEff = p * (1 - f);
  const gradF = 1 - clamp01((f - 0.35) / 0.5); // gradient survives the first stretch of the grow
  const textFlip = clamp01((f - 0.35) / 0.5); // hero copy flips dark late, with the whitening
  const t = Math.max(pEff, textFlip); // chrome flip (docked or fullscreen = dark-on-white)
  // Thread appears only near full-open and is GONE before the hero starts moving
  // much on collapse — kills the mid-flight overlap jerk (R5).
  const chatStage = turns.length > 0 ? clamp01((f - 0.55) / 0.45) : 0;
  const chatMul = 1 - chatStage; // hero copy yields to the thread when chatting
  const sugF = clamp01((f - 0.55) / 0.45);

  // The morphing ask pill: rest endpoint frozen at morph start (restTop) →
  // docked → fullscreen input. At rest the overlay doesn't exist at all.
  const restRect = {
    left: PILL_MARGIN,
    top: restTop,
    w: frame.w - PILL_MARGIN * 2,
    h: PILL_REST_HEIGHT,
  };
  const dockRect = { left: (frame.w - PILL_DOCK_WIDTH) / 2, top: PILL_DOCK_TOP, w: PILL_DOCK_WIDTH, h: PILL_DOCK_HEIGHT };
  const fullPillRect = { left: PILL_MARGIN, top: fullInputTop, w: frame.w - PILL_MARGIN * 2, h: PILL_REST_HEIGHT };
  const base = {
    left: lerp(restRect.left, dockRect.left, p),
    top: lerp(restRect.top, dockRect.top, p),
    w: lerp(restRect.w, dockRect.w, p),
    h: lerp(restRect.h, dockRect.h, p),
  };
  const pill = {
    left: lerp(base.left, fullPillRect.left, f),
    top: lerp(base.top, fullPillRect.top, f),
    w: lerp(base.w, fullPillRect.w, f),
    h: lerp(base.h, fullPillRect.h, f),
  };
  const pillTextW = 72; // "Ask cosimo" at 14px — for the rest→dock label centering
  const pillLabelLeft = lerp(24, pill.w / 2 - pillTextW / 2, pEff);
  const whiteTextOp = Math.max(0, 1 - pEff - textFlip);

  // The overlay pill exists only while morphing — at rest the pill lives IN the
  // scroller so it rides native scroll with zero lag (R3: opposite-scroll jank).
  const morphActive = docked || full || p > 0.01 || f > 0.01;

  const pushTrip = useCallback(() => setPage("trip"), []);

  // Memoized card stacks: stable element identity lets React bail out of the
  // whole card subtree on every spring frame (mobile perf).
  const tripCardEls = useMemo(
    () => [<SipTrackerCard key="sip" />, <LumpsumCard key="lumpsum" />, <AtomTrackerCard key="atom" />, <PaceCard key="pace" />],
    [],
  );
  const homeCardEls = useMemo(() => {
    const byId: Record<WidgetId, React.ReactNode> = {
      trip: <StatCard key="trip" onOpen={pushTrip} />,
      spend: <LeftToSpendCard key="spend" />,
      cashflow: <CashflowCard key="cashflow" />,
      bills: <UpcomingBillsCard key="bills" />,
      subs: <SubscriptionsCard key="subs" />,
    };
    return widgetOrder.filter((id) => widgets[id]).map((id) => byId[id]);
  }, [widgetOrder, widgets, pushTrip]);

  const popTrip = useCallback(() => setPage("home"), []);
  const onChevron = full ? closeFull : page === "trip" ? popTrip : undefined;


  // ── One page: gradient hero (in flow) + cards; heroes grow over the frame in fullscreen ──
  const renderPage = (pid: PageId) => {
    const active = pid === "trip" ? g : 1 - g;
    const isActivePage = page === pid;
    const heroH = isActivePage ? lerp(heroHs[pid], frame.h, f) : heroHs[pid];
    const tripCards = tripCardEls;
    return (
      <div
        key={pid}
        ref={(el) => { scrollerRefs.current[pid] = el; }}
        onScroll={makeScrollHandler(pid)}
        style={{
          position: "absolute",
          inset: 0,
          overflowY: full ? "hidden" : "auto",
          scrollbarWidth: "none",
          opacity: active,
          background: BG_PRIMARY,
          zIndex: pid === "trip" ? 6 : 4,
          pointerEvents: active > 0.5 ? "auto" : "none",
        }}
      >
        {/* Hero — V-500 gradient card; grows over the frame and whitens on expand */}
        <div
          style={{
            position: "relative",
            height: heroH,
            borderRadius: `0 0 ${36 * (1 - f)}px ${36 * (1 - f)}px`,
            overflow: "hidden",
          }}
        >
          {/* Gradient fades out as the pill docks too (Figma scrolled frame is a
              white hero) — a whole-surface fade, never a white band cutting the
              colour under the chrome. */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              opacity: isActivePage ? gradF * (1 - pEff) : 1,
              background: `${VALENTINO_500} url(/return-exp1/gradient-v21.png) top/cover no-repeat`,
            }}
          />
          {/* Hero copy — stacked on-brand / on-white layers, crossfaded by the whitening */}
          <div
            ref={(el) => { welcomeRefs.current[pid] = el; }}
            style={{
              position: "absolute",
              top: HERO_PADDING_TOP,
              left: PAGE_PADDING + 8,
              right: PAGE_PADDING + 8,
              opacity: chatMul,
            }}
          >
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, opacity: 1 - (isActivePage ? Math.max(textFlip, pEff) : 0) }}>
                <p style={{ ...typography.headerH2, color: TEXT_ON_COLOR_PRIMARY, margin: 0 }}>{HERO_COPY[pid].title}</p>
                {pid === "trip" ? (
                  <GenerativeBody
                    text={HERO_COPY.trip.body}
                    phase={tripGen}
                    color={TEXT_ON_COLOR_PRIMARY}
                    onTyped={() => setTripGen("done")}
                  />
                ) : (
                  <p style={{ ...typography.bodySmall, color: TEXT_ON_COLOR_PRIMARY, margin: 0 }}>{HERO_COPY.home.body}</p>
                )}
              </div>
              <div aria-hidden={!isActivePage || Math.max(textFlip, pEff) < 0.5} style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 8, opacity: isActivePage ? Math.max(textFlip, pEff) : 0, pointerEvents: "none" }}>
                <p style={{ ...typography.headerH2, color: TEXT_PRIMARY, margin: 0 }}>{HERO_COPY[pid].title}</p>
                <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY, margin: 0 }}>{HERO_COPY[pid].body}</p>
              </div>
            </div>
          </div>

          {/* Suggestions — revealed once the fullscreen surface has whitened */}
          {isActivePage && turns.length === 0 && (
            <div
              style={{
                position: "absolute",
                top: HERO_PADDING_TOP + welcomeHs[pid] + 24,
                left: PAGE_PADDING + 8,
                right: PAGE_PADDING + 8,
                opacity: sugF,
                pointerEvents: full && sugF > 0.6 ? "auto" : "none",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {SUGGESTIONS.map((sg, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 16, transform: `translateY(${(1 - f) * (10 + i * 12)}px)` }}>
                    {i > 0 && <div style={{ height: 1, width: "100%", background: OUTLINE_SUBTLE }} />}
                    <div role="button" tabIndex={0} onClick={() => send(sg.text)} onKeyDown={(e) => e.key === "Enter" && send(sg.text)} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                      <div style={{ position: "relative", width: 28, height: 28, overflow: "hidden", flexShrink: 0 }}>
                        <img
                          src={`/return-exp1/${sg.img}.png`}
                          alt=""
                          style={sg.crop ? { position: "absolute", maxWidth: "none", ...sg.crop } : { width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                      <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{sg.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In-flow ask pill — the real thing at rest; hands off to the overlay while morphing.
              exp5: on the trip page it pops in only after the insight finishes typing. */}
          {(() => {
            const exp5Hidden = EXP5_PILL_AFTER_TYPE && pid === "trip" && tripGen !== "done";
            const morphHidden = isActivePage && morphActive;
            return (
              <div
                role="button"
                tabIndex={0}
                aria-label="Ask cosimo"
                onClick={openFull}
                onKeyDown={(e) => e.key === "Enter" && openFull()}
                style={{
                  position: "absolute",
                  top: inputRestTops[pid],
                  left: PILL_MARGIN,
                  right: PILL_MARGIN,
                  height: PILL_REST_HEIGHT,
                  borderRadius: 100,
                  border: "1px solid rgba(0,0,0,0.1)",
                  background: "rgba(255,255,255,0.2)",
                  boxShadow: ELEVATION_CARD,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 24px",
                  cursor: "pointer",
                  opacity: morphHidden || exp5Hidden ? 0 : 1,
                  transform: `scale(${exp5Hidden ? 0.92 : 1}) translateY(${exp5Hidden ? 10 : 0}px)`,
                  // one-shot pop (spring-soft); instant during overlay handoffs
                  transition: morphHidden ? "none" : "opacity 300ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                  pointerEvents: morphHidden || exp5Hidden ? "none" : "auto",
                }}
              >
                <span style={{ ...typography.bodySmall, lineHeight: "normal", color: TEXT_ON_COLOR_PRIMARY, whiteSpace: "nowrap" }}>Ask cosimo</span>
              </div>
            );
          })()}

          {/* Chat thread */}
          {isActivePage && turns.length > 0 && (
            <div
              ref={threadRef}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: CHROME_HEIGHT + 4,
                height: fullInputTop - 12 - (CHROME_HEIGHT + 4),
                overflowY: "auto",
                scrollbarWidth: "none",
                padding: `8px ${PAGE_PADDING}px`,
                opacity: chatStage,
                pointerEvents: full ? "auto" : "none",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {turns.map((turn, i) =>
                turn.role === "user" ? (
                  <div key={turn.id} className="animate-chat-message-in" style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ background: CHAT_USER_BUBBLE, borderRadius: RADIUS_M, padding: "10px 14px", maxWidth: "82%" }}>
                      <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY, margin: 0 }}>{turn.text}</p>
                    </div>
                  </div>
                ) : (
                  <div key={turn.id} className="animate-chat-message-in">
                    <CosimoLine
                      text={turn.text}
                      active={i === turns.length - 1 && !doneIds.has(turn.id)}
                      onDone={() => setDoneIds((d) => new Set(d).add(turn.id))}
                    />
                  </div>
                ),
              )}
              {thinking && <ThinkingLine />}
            </div>
          )}

          {/* thread fades out under the input instead of clipping sharply */}
          {isActivePage && turns.length > 0 && (
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: fullInputTop - 72,
                height: 72,
                background: `linear-gradient(to bottom, transparent, ${BG_PRIMARY})`,
                opacity: chatStage,
                pointerEvents: "none",
                zIndex: 2,
              }}
            />
          )}
        </div>

        {/* Cards — settle back / stagger in on the fluid page switch */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: `24px ${PAGE_PADDING}px ${16 + 119}px`,
            opacity: 1 - f,
            transform: `translateY(${f * 24 + (1 - active) * (pid === "trip" ? 40 : -24)}px)`,
            pointerEvents: full ? "none" : "auto",
          }}
        >
          {pid === "home" ? (
            homeCardEls
          ) : (
            tripCards.map((card, i) => (
              <div key={i} style={{ transform: `translateY(${(1 - g) * i * 28}px)`, opacity: Math.min(1, active * (1.6 - i * 0.2)) }}>{card}</div>
            ))
          )}
        </div>
      </div>
    );
  };

  const tripMounted = page === "trip" || g > 0.002;

  return (
    <div ref={frameRef} style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden", background: BG_PRIMARY }}>
      {/* ── Pages (fluid crossfade switch — no slide) ── */}
      {renderPage("home")}
      {tripMounted && renderPage("trip")}

      {/* ── Chrome background — frosted, so the fade has no hard edge ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: CHROME_HEIGHT,
          background: BG_PRIMARY,
          opacity: pEff * 0.92,
          backdropFilter: pEff > 0.02 ? "blur(16px)" : undefined,
          WebkitBackdropFilter: pEff > 0.02 ? "blur(16px)" : undefined,
          boxShadow: `0 1px 0 rgba(0,0,0,${0.05 * pEff})`,
          zIndex: 8,
        }}
      />

      {/* ── The morphing "Ask cosimo" pill (mounted only while morphing) ── */}
      {morphActive && (
      <div
        role={full ? undefined : "button"}
        tabIndex={full ? undefined : 0}
        aria-label="Ask cosimo"
        onClick={full ? undefined : openFull}
        onKeyDown={full ? undefined : (e) => e.key === "Enter" && openFull()}
        style={{
          position: "absolute",
          left: pill.left,
          top: pill.top,
          width: pill.w,
          height: pill.h,
          borderRadius: 100,
          border: `1px solid rgba(0,0,0,${lerp(lerp(0.1, 0.05, pEff), 0.1, textFlip)})`,
          background: `rgba(255,255,255,${lerp(0.2, 0.1, pEff)})`,
          // constant blur — animating the radius forces per-frame repaints on mobile
          backdropFilter: pEff > 0.05 ? "blur(12px)" : undefined,
          WebkitBackdropFilter: pEff > 0.05 ? "blur(12px)" : undefined,
          boxShadow: ELEVATION_CARD,
          zIndex: 20,
          cursor: full ? "text" : "pointer",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
        }}
      >
        {/* label (rest/docked) crossfades to a live input (fullscreen) */}
        <span aria-hidden style={{ position: "absolute", left: pillLabelLeft, ...typography.bodySmall, lineHeight: "normal", opacity: 1 - f }}>
          <span style={{ color: TEXT_ON_COLOR_PRIMARY, opacity: whiteTextOp, position: "absolute", inset: 0, whiteSpace: "nowrap" }}>Ask cosimo</span>
          <span style={{ color: TEXT_PRIMARY, opacity: 1 - whiteTextOp, whiteSpace: "nowrap" }}>Ask cosimo</span>
        </span>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(draft)}
          placeholder="Ask cosimo"
          enterKeyHint="send"
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            ...typography.bodySmall,
            lineHeight: "normal",
            color: TEXT_PRIMARY,
            opacity: f,
            pointerEvents: full ? "auto" : "none",
            paddingRight: 44,
          }}
        />
        {/* send — rides the expansion in, lights up with a draft */}
        <button
          type="button"
          aria-label="Send"
          onClick={() => send(draft)}
          disabled={!draft.trim()}
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: "none",
            background: BTN_BG_PRIMARY_DEFAULT,
            opacity: f * (draft.trim() ? 1 : 0.35),
            pointerEvents: full ? "auto" : "none",
            cursor: draft.trim() ? "pointer" : "default",
            display: "grid",
            placeItems: "center",
            transition: "opacity 180ms ease",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 14V4M4.5 8.5L9 4L13.5 8.5" stroke={TEXT_ON_COLOR_PRIMARY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      )}

      {/* ── Fixed chrome: status bar + chips ── */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 30, pointerEvents: "none" }}>
        <div style={{ position: "relative" }}>
          <div style={{ opacity: 1 - t }}>
            <StatusBar backgroundColor="transparent" color={TEXT_ON_COLOR_PRIMARY} />
          </div>
          <div style={{ position: "absolute", inset: 0, opacity: t }}>
            <StatusBar backgroundColor="transparent" color={TEXT_PRIMARY} />
          </div>
          {/* row stays pointer-transparent so the docked pill beneath it can take taps */}
          <div style={{ height: APP_BAR_HEIGHT, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", pointerEvents: "none" }}>
            <div style={{ pointerEvents: "auto" }}>
              <ChromeChip t={t} ghost={f} ariaLabel={full ? "Collapse" : "Back"} onClick={onChevron}>
                {(color) => <ChevronIcon color={color} rotate={f * 90} />}
              </ChromeChip>
            </div>
            {/* the customise chip doesn't belong on the chat screen — it rides out with the expansion */}
            <div style={{ pointerEvents: full ? "none" : "auto", opacity: 1 - f, transform: `translateY(${-12 * f}px)` }}>
              <ChromeChip t={t} ariaLabel="Customise widgets" onClick={() => setSheetOpen(true)}>
                {(color) => <KebabIcon color={color} />}
              </ChromeChip>
            </div>
          </div>
        </div>
      </div>

      {/* ── Keyboard — rides the fullscreen spring (desktop mock only) ── */}
      {!isMobile && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: MOCK_KEYBOARD_HEIGHT,
            transform: `translateY(${(1 - f) * 100}%)`,
            zIndex: 40,
            pointerEvents: "none",
          }}
        >
          <MockKeyboard visible />
        </div>
      )}

      {/* ── Widget customise page (kebab) — full page, toggle + reorder + add ── */}
      {(sheetOpen || s > 0.002) && (
        <WidgetsPage
          s={s}
          onClose={() => setSheetOpen(false)}
          order={widgetOrder}
          enabled={widgets}
          onToggle={(id) => setWidgets((w) => ({ ...w, [id]: !w[id] }))}
          onAdd={(id) => {
            setWidgetOrder((o) => [...o, id]);
            setWidgets((w) => ({ ...w, [id]: true }));
          }}
          onReorder={setWidgetOrder}
        />
      )}
    </div>
  );
}
