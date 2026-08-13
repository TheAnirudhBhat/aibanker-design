"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
import { useProtoFlag } from "../lib/protoFlags";

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

// ── "V2 paper" theme — white-first redesign from Figma 1528:49462. All values
// are verbatim from that frame; the theme is switchable from the debug panel
// ("Theme"), and the original Valentino treatment stays fully intact.
const V2_PAGE_BG = "#F3F5F6"; // root page grey (1528:49462)
const V2_GROOVE = "#EDEDED"; // progress groove (1531:50619)
const V2_MAGENTA = "rgb(212, 20, 216)"; // gradient progress start (1531:50620)
const V2_BAR_GRAY = "#E8ECEF"; // spending chart bars (1528:49610)
const V2_BAR_LABEL = "#9A9A9A"; // spending chart month labels (1528:49611)
const V2_CAL_BLUE = "#6698FF"; // calendar tile month strip (1528:49894)
const V2_CAL_DAY = "#38424F"; // calendar tile day (1528:49893)
const V2_TILE_BORDER = "#F0F3F5"; // calendar tile border (1528:49892)
const V2_TILE_SHADOW = "0px 0px 20px rgba(0,0,0,0.06)"; // calendar tile (1528:49892)
const V2_PEACH = "#FBE9EC"; // skipped-month cell (1532:52282)
const V2_CELL_GRAY = "#F6F7F9"; // upcoming-month cell (1532:52288)
const V2_LABEL_GRAY = "#A5B6C5"; // month label (1532:52272)
const V2_FOOT_GRAY = "#8795A7"; // projection footer (1532:52317)
const V2_TRIP_BODY = "You're 65% done for your Trip to Japan goal. Your savings rate jumped 18% this month — your best streak yet!";

/** True when the sim renders the V2 paper theme. */
const PaperCtx = createContext(false);
const usePaper = () => useContext(PaperCtx);

const APP_BAR_HEIGHT = 64;
const PILL_REST_HEIGHT = 57; // px-24 py-20 input (1420:21780)
const PILL_DOCK_WIDTH = 182; // app-bar pill (1420:24788)
const PILL_DOCK_HEIGHT = 48;
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
    `ghost` (0..1) turns the solid chip into visible glass (chat mode): translucent
    fill, frost, hairline and shadow stay — it must still read as a button. */
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
        border: `1px solid ${OUTLINE_SUBTLE}`,
        background: `rgba(255,255,255,${lerp(lerp(0.16, 1, t), 0.55, ghost)})`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: ELEVATION_CARD,
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

/** Card chrome per theme: V2 paper cards are flat (the grey page does the lifting). */
function useCardBase(): React.CSSProperties {
  const paper = usePaper();
  return paper
    ? { ...cardBase, boxShadow: "var(--re1-card-shadow, none)", transition: "box-shadow 240ms ease" }
    : cardBase;
}

function CardHeaderRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
      <span style={{ ...typography.metadata, color: TEXT_PRIMARY, textTransform: "uppercase" }}>{label}</span>
      <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{value}</span>
    </div>
  );
}

function ProgressBar({ pct, from }: { pct: number; from?: string }) {
  const paper = usePaper();
  if (paper) return <GradientProgress pct={pct} from={from ?? V2_MAGENTA} />;
  return (
    <div style={{ position: "relative", height: 4, width: "100%" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 5, background: PROGRESS_GROOVE }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${pct}%`, borderRadius: 5, background: PROGRESS_INDIGO }} />
    </div>
  );
}

/** V2 gradient progress: the fill fades out to the card, a dot floats at its end. */
function GradientProgress({ pct, from }: { pct: number; from: string }) {
  return (
    <div style={{ position: "relative", height: 5.4, width: "100%", borderRadius: 12, background: V2_GROOVE }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: `${pct}%`,
          borderRadius: 12,
          background: `linear-gradient(to left, ${from} 6.7%, rgba(255,255,255,1) 102.6%)`,
        }}
      />
      <div style={{ position: "absolute", left: `calc(${pct}% - 2px)`, top: -9, width: 5, height: 5, borderRadius: "50%", background: from }} />
    </div>
  );
}

function StatCard({ onOpen }: { onOpen: () => void }) {
  const base = useCardBase();
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Trip to Japan details"
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      style={{ ...base, padding: "14px 20px 20px", display: "flex", flexDirection: "column", gap: 10, cursor: "pointer" }}
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

function CategoryAvatar({ icon, arc, size = 32 }: { icon: string; arc: number; size?: number }) {
  const R = size / 2;
  const C = 2 * Math.PI * R;
  return (
    <div style={{ position: "relative", width: size, height: size, borderRadius: "50%", background: BLUE_50, border: `1px solid ${OUTLINE_SUBTLE}` }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          margin: "auto",
          width: Math.round(size * 0.41),
          height: Math.round(size * 0.41),
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
      <svg width={size + 4} height={size + 4} viewBox={`0 0 ${size + 4} ${size + 4}`} style={{ position: "absolute", top: -2.5, left: -2.5 }}>
        <circle cx={(size + 4) / 2} cy={(size + 4) / 2} r={R} fill="none" stroke={BLUE_500} strokeWidth="1.5" strokeLinecap="round" strokeDasharray={`${C * arc} ${C}`} transform={`rotate(-90 ${(size + 4) / 2} ${(size + 4) / 2})`} />
      </svg>
    </div>
  );
}

function LeftToSpendCard() {
  const base = useCardBase();
  return (
    <div style={{ ...base, padding: "20px 20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
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
  const base = useCardBase();
  return (
    <div style={{ ...base, padding: "20px 0 24px", display: "flex", flexDirection: "column", gap: 20 }}>
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
  const base = useCardBase();
  return (
    <div style={{ ...base, padding: "24px 24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
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
  const base = useCardBase();
  const [lumpsumAdded, setLumpsumAdded] = useState(false);
  return (
    <div style={{ ...base, padding: "24px 24px 26px", display: "flex", flexDirection: "column", gap: 4 }}>
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
  const base = useCardBase();
  return (
    <div style={{ ...base, padding: "24px 24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
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
  const base = useCardBase();
  return (
    <div style={{ ...base, padding: "24px 24px 26px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <span style={{ ...typography.metadata, color: TEXT_PRIMARY, textTransform: "uppercase" }}>Pace</span>
        <DlsTag intent="positive" emphasis="subtle">12 days ahead</DlsTag>
      </div>
      <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>December&rsquo;s extra ₹6,000 put you ahead of plan — coasting works from here</span>
    </div>
  );
}

// ── V2 paper theme cards (Figma 1528:49462) ─────────────────────────────────

function V2HeaderRow({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6, width: "100%" }}>
      <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{title}</span>
      <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>{sub}</span>
    </div>
  );
}

function V2StackedHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
      <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{title}</span>
      <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>{sub}</span>
    </div>
  );
}

function TripCardV2({ onOpen }: { onOpen: () => void }) {
  const base = useCardBase();
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Trip to Japan details"
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      style={{ ...base, padding: "20px 20px 24px 24px", display: "flex", flexDirection: "column", gap: 16, cursor: "pointer" }}
    >
      <V2StackedHeader title="Trip to Japan" sub="65% done" />
      <GradientProgress pct={87.4} from={V2_MAGENTA} />
    </div>
  );
}

function LeftToSpendCardV2() {
  const base = useCardBase();
  return (
    <div style={{ ...base, padding: "20px 20px 24px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
      <V2StackedHeader title="₹30,002 left" sub="to spend in 23 days" />
      <GradientProgress pct={70.9} from={GREEN_500} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, paddingTop: 4 }}>
        {SPEND_CATS.map((c, i) => (
          <CategoryAvatar key={i} icon={c.icon} arc={c.arc} size={34} />
        ))}
      </div>
    </div>
  );
}

const V2_PAYMENTS: { day: string; name: string; amount: string }[] = [
  { day: "5", name: "Rent", amount: "₹10,000" },
  { day: "8", name: "Groceries", amount: "₹10,000" },
  { day: "12", name: "Netflix", amount: "₹10,000" },
];

function CalendarTile({ day }: { day: string }) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: BG_CARD,
        border: `0.8px solid ${V2_TILE_BORDER}`,
        boxShadow: V2_TILE_SHADOW,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", background: V2_CAL_BLUE, paddingTop: 2, display: "grid", placeItems: "center" }}>
        <span style={{ ...typography.metadata, color: TEXT_ON_COLOR_PRIMARY, textTransform: "uppercase" }}>Oct</span>
      </div>
      <span style={{ ...typography.headerH4, color: V2_CAL_DAY, lineHeight: "20px", marginTop: 2 }}>{day}</span>
    </div>
  );
}

function UpcomingPaymentsCardV2() {
  const base = useCardBase();
  return (
    <div style={{ ...base, padding: "20px 0 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ padding: "0 24px" }}>
        <V2StackedHeader title="3 Upcoming payments" sub="₹30,002" />
      </div>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {V2_PAYMENTS.map((pmt, i) => (
          <div key={pmt.name} style={{ display: "flex", flex: 1 }}>
            {i > 0 && <div style={{ width: 1, background: OUTLINE_SUBTLE, margin: "6px 0" }} />}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingTop: 8 }}>
              <CalendarTile day={pmt.day} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <span style={{ ...typography.caption, color: TEXT_PRIMARY }}>{pmt.name}</span>
                <span style={{ ...typography.metadata, color: TEXT_TERTIARY }}>{pmt.amount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Bars verbatim from the frame (heights px, labels as drawn).
const V2_BARS: [number, string][] = [
  [11, "J"], [11, "F"], [19.3, "M"], [17.1, "J"], [20.8, "J"], [28.7, "A"], [35.2, "A"], [30.8, "A"], [42, "A"],
];

function SpendingSpikeCardV2() {
  const base = useCardBase();
  return (
    <div style={{ ...base, padding: "20px 24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
      <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, maxWidth: 232 }}>
        Your spending seem to have spiked this month
      </span>
      <div style={{ position: "relative", paddingTop: 14 }}>
        {/* peak marker: dashed rule + the spike amount */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ flex: 1, borderTop: "1px dashed rgba(0,0,0,0.18)" }} />
          <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>₹44,245</span>
        </div>
        <div style={{ display: "flex", gap: 13, alignItems: "flex-end" }}>
          {V2_BARS.map(([h, label], i) => {
            const highlight = i === V2_BARS.length - 1;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                {highlight ? (
                  <img src="/return-exp1/bar-highlight.png" alt="" style={{ width: 8, height: h, borderRadius: "20px 20px 1px 1px" }} />
                ) : (
                  <div style={{ width: 8, height: h, borderRadius: "20px 20px 1px 1px", background: V2_BAR_GRAY }} />
                )}
                <span style={{ ...typography.metadata, color: V2_BAR_LABEL, textTransform: "uppercase" }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const V2_CASHFLOW_ROWS: [string, string][] = [
  ["Income", "₹50,000"],
  ["Upcoming spends", "₹4,300"],
  ["Into Goals", "₹6,500"],
  ["Spent this month", "₹12,300"],
  ["Left to spend", "₹12,300"],
];

/** Cashflow as a flat list (Figma 1532:53042; the frame placeholders every row icon). */
function CashflowListCardV2() {
  const base = useCardBase();
  return (
    <div style={{ ...base, padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
      <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>Cashflow</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {V2_CASHFLOW_ROWS.map(([name, amount], i) => (
          <div key={name} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {i > 0 && <div style={{ height: 1, width: "100%", background: OUTLINE_SUBTLE }} />}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    backgroundColor: TEXT_SECONDARY,
                    WebkitMaskImage: "url(/return-exp1/icons/home.svg)",
                    maskImage: "url(/return-exp1/icons/home.svg)",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                  }}
                />
                <span style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{name}</span>
              </div>
              <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{amount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// V2 trip page (Figma 1532:51461): one consolidated saver card + other sources.
type V2Month = { label: string; state: "done" | "doneAlt" | "skip" | "due" };
const V2_MONTHS: V2Month[] = [
  { label: "Jan", state: "done" },
  { label: "Feb", state: "done" },
  { label: "Mar", state: "doneAlt" },
  { label: "Jun", state: "skip" },
  { label: "Jul", state: "due" },
  { label: "Aug", state: "due" },
  { label: "Sep", state: "due" },
  { label: "Oct", state: "due" },
  { label: "Nov", state: "due" },
  { label: "Dec", state: "due" },
];

function V2MonthCell({ m }: { m: V2Month }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      {m.state === "done" || m.state === "doneAlt" ? (
        <img src={`/return-exp1/${m.state === "done" ? "month-done" : "month-done-alt"}.svg`} alt="" style={{ width: 14, height: 14 }} />
      ) : (
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 8,
            background: m.state === "skip" ? V2_PEACH : V2_CELL_GRAY,
            display: "grid",
            placeItems: "center",
          }}
        >
          {m.state === "skip" && <img src="/return-exp1/month-x.svg" alt="" style={{ width: 8.5, height: 8.5 }} />}
        </div>
      )}
      {/* Figma uses Figtree Bold 9 here — rendered in Rubik Medium (DLS hard rule) */}
      <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 9, lineHeight: "11px", letterSpacing: 0.4, color: V2_LABEL_GRAY, textTransform: "uppercase" }}>
        {m.label}
      </span>
    </div>
  );
}

function DailySaverCardV2() {
  return (
    <div
      style={{
        background: BG_CARD,
        border: `1px solid ${OUTLINE_SUBTLE}`,
        borderRadius: RADIUS_M,
        boxShadow: "0px 2px 16px rgba(0,0,0,0.05)",
        width: "100%",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <img src="/return-exp1/savings-icon.png" alt="" style={{ width: 44, height: 44, borderRadius: 8, border: `0.5px solid ${OUTLINE_SUBTLE}` }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>Daily saver</span>
            <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>₹10,010</span>
          </div>
          <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>Target • ₹1,00,000</span>
        </div>
      </div>
      <div style={{ height: 1, width: "100%", background: OUTLINE_SUBTLE }} />
      {/* 6-column grid spanning the card (Figma: columns at 47px pitch, rows aligned) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", rowGap: 16, justifyItems: "center", padding: "0 4px" }}>
        {V2_MONTHS.map((m) => (
          <V2MonthCell key={m.label} m={m} />
        ))}
      </div>
      <div style={{ height: 1, width: "100%", background: OUTLINE_SUBTLE }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <img src="/return-exp1/diamond.svg" alt="" style={{ width: 20, height: 20 }} />
        <span style={{ ...typography.caption, color: V2_FOOT_GRAY }}>You&rsquo;ll reach your goal by Apr 2027.</span>
      </div>
    </div>
  );
}

function OtherSourcesCardV2() {
  const base = useCardBase();
  return (
    <div style={{ ...base, padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
      <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>Other sources</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {([
          ["₹30,002", "considered from family help"],
          ["₹1,00,000", "considered from mutual funds"],
        ] as const).map(([amt, sub]) => (
          <div key={sub} style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{amt}</span>
            <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>{sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Widget catalogue (kebab → customise sheet) ───────────────────────────────

function UpcomingBillsCard() {
  const base = useCardBase();
  return (
    <div style={{ ...base, padding: "24px 24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
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
  const base = useCardBase();
  return (
    <div style={{ ...base, padding: "24px 24px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
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

type WidgetId = "trip" | "spend" | "cashflow" | "bills" | "subs" | "spendChart";
const WIDGET_META: { id: WidgetId; label: string; default: boolean }[] = [
  { id: "trip", label: "Trip to Japan", default: true },
  { id: "spend", label: "Left to spend", default: true },
  { id: "cashflow", label: "Cashflow", default: true },
  { id: "bills", label: "Upcoming bills", default: false },
  { id: "subs", label: "Subscriptions", default: false },
  { id: "spendChart", label: "Spending trend", default: false },
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
        <p style={{ ...typography.bodySmall, color, margin: 0 }}>
          {phase === "shimmer" ? "" : phase === "done" ? text : shown}
          {phase !== "done" && (
            <span
              aria-hidden
              style={{
                display: "inline-block",
                width: 2,
                height: "1em",
                marginLeft: 2,
                verticalAlign: "text-bottom",
                background: color,
                borderRadius: 1,
                animation: "returnExp1CursorBlink 1s step-end infinite",
              }}
            />
          )}
        </p>
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

  // Theme (debug panel → "Theme"): original Valentino vs V2 paper (Figma 1528:49462).
  const [themeIdRaw] = useProtoFlag("returnExp1Theme");
  const paper = themeIdRaw === "paper";
  const pillH = paper ? 64 : PILL_REST_HEIGHT; // v2 input is py-16 → 64 tall (1528:49485)

  const [navMoving, setNavMoving] = useState(false);
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
  const p = useSpringValue(docked && !full ? 1 : 0, 520, 38); // magnetic — snaps, never floats
  const f = useSpringValue(full ? 1 : 0, 250, 28);
  const g = useSpringValue(page === "trip" ? 1 : 0, 190, 26);
  const s = useSpringValue(sheetOpen ? 1 : 0, 300, 30);

  // Widgets — order drives the home stack; `widgets` is the on/off map.
  const [widgets, setWidgets] = useState<Record<WidgetId, boolean>>({ trip: true, spend: true, cashflow: true, bills: false, subs: false, spendChart: false });
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(["trip", "spend", "cashflow"]);
  // The v2 frame ships with "3 Upcoming payments" on home — follow the theme until
  // the user customises widgets themselves, then their choice wins.
  const widgetsTouched = useRef(false);
  useEffect(() => {
    if (widgetsTouched.current) return;
    // v2 home ships: trip, calendar payments, left-to-spend, cashflow list, chart
    // (Figma 1532:51185); the original keeps its three.
    setWidgets((w) => {
      const next = { ...w, bills: paper, spendChart: paper };
      return next.bills === w.bills && next.spendChart === w.spendChart ? w : next;
    });
    setWidgetOrder(paper ? ["trip", "bills", "spend", "cashflow", "spendChart"] : ["trip", "spend", "cashflow"]);
  }, [paper]);

  // Chat
  const [turns, setTurns] = useState<Turn[]>([]);
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState("");
  const [doneIds, setDoneIds] = useState<Set<number>>(new Set());
  const seqRef = useRef(0);
  const replyIdxRef = useRef(0);
  const replyTimer = useRef<number | null>(null);

  // ── Geometry ──
  // Mobile has no mock keyboard and hides the in-app status bar: the input
  // rests above the home indicator (riding the real keyboard via the frame
  // resize), and chrome metrics track the REAL top inset (0 in a browser tab,
  // the notch height standalone) instead of a phantom 44px.
  const [safeInsets, setSafeInsets] = useState({ top: 0, bottom: 0 });
  const { top: safeTop, bottom: safeBottom } = safeInsets;
  useEffect(() => {
    if (!isMobile) return;
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;left:0;bottom:0;height:0;padding-bottom:env(safe-area-inset-bottom);padding-top:env(safe-area-inset-top);visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    const next = { top: parseFloat(cs.paddingTop) || 0, bottom: parseFloat(cs.paddingBottom) || 0 };
    probe.remove();
    const raf = requestAnimationFrame(() => setSafeInsets(next));
    return () => cancelAnimationFrame(raf);
  }, [isMobile]);
  const statusH = isMobile ? safeTop : STATUS_BAR_HEIGHT;
  const chromeH = statusH + APP_BAR_HEIGHT;
  const heroPadTop = chromeH + (paper ? 0 : 16); // v2: copy sits flush under the app bar (R7)
  const dockTop = statusH + 8;
  const kbSpace = isMobile ? 20 + safeBottom : MOCK_KEYBOARD_HEIGHT + KEYBOARD_GAP;
  const fullInputTop = frame.h - kbSpace - pillH;
  const inputRestTops = {
    home: heroPadTop + welcomeHs.home + 32,
    trip: heroPadTop + welcomeHs.trip + 32,
  };
  const heroPb = paper ? 8 : 24; // v2: tighter below the pill (R7)
  const heroHs = {
    home: inputRestTops.home + pillH + heroPb,
    trip: inputRestTops.trip + pillH + heroPb,
  };

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

  // Theme switches change the hero copy's height (v2 trip adds a progress bar),
  // and the TRIP page only mounts on first navigation — its copy measured as the
  // default until then, leaving the pill on top of the text (R7). Re-measure
  // whenever the mounted content can have changed.
  useEffect(() => {
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, [paper, page, measure]);

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
      const t = Math.min((now - t0) / 280, 1);
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
      // Cards rest under the chrome once snapped — v2 breathes 24 below the frost
      // bar (R7), the original matches its Figma scrolled frame (y 116, gap 8).
      // Clamped to the reachable range: an unreachable detent left the dock
      // hovering at its own undock threshold (the "hanging" morph, R7).
      const snapEnd = Math.min(
        heroHs[pid] + (paper ? 16 : 24) - (chromeH + (paper ? 24 : 8)),
        el.scrollHeight - el.clientHeight,
      );
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
    [animateScroll, welcomeHs, full, paper, chromeH],
  );

  // ── Page navigation: freeze → move → settle ─────────────────────────────
  // The old version undocked the chrome, tweened the outgoing scroll AND ran the
  // page spring all at once — three clocks, so nothing arrived together and the
  // header "going away" read as a jerk. Now the dock CARRIES across the move
  // (like an iOS large title on a push) and the rest waits for the settle.
  // Where a page's scroll rests when docked (cards at top, under the chrome).
  const snapEndFor = useCallback((pid: PageId, el: HTMLDivElement) => {
    return Math.min(
      heroHs[pid] + (paper ? 16 : 24) - (chromeH + (paper ? 24 : 8)),
      el.scrollHeight - el.clientHeight,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [welcomeHs, paper, chromeH, pillH]);

  // State-preserving navigation (R7): a docked page transitions to a DOCKED
  // destination — cards arrive at the top, the pill never leaves the bar. An
  // undocked page rides home during the crossfade and lands hero-to-hero.
  const goToPage = useCallback((next: PageId) => {
    if (next === pageRef.current) return;
    const destEl = scrollerRefs.current[next];
    if (dockedRef.current) {
      if (destEl) {
        const se = snapEndFor(next, destEl);
        destEl.scrollTop = se;
        scrollYRef.current[next] = se;
      }
    } else {
      if (destEl) destEl.scrollTop = 0;
      scrollYRef.current[next] = 0;
      const cur = scrollerRefs.current[pageRef.current];
      if (cur && cur.scrollTop > 0) animateScroll(cur, 0);
    }
    setNavMoving(true);
    setPage(next);
  }, [animateScroll, snapEndFor]);

  // Docked arrivals: the destination scroller can mount a frame after goToPage
  // (first push) — snap it to its detent while it is still transparent.
  useEffect(() => {
    if (!navMoving || !dockedRef.current) return;
    const el = scrollerRefs.current[page];
    if (!el) return;
    const se = snapEndFor(page, el);
    if (Math.abs(el.scrollTop - se) > 1) {
      el.scrollTop = se;
      scrollYRef.current[page] = se;
    }
  }, [navMoving, page, snapEndFor]);

  // Settle beat: once the nav spring lands, tidy the hidden page to match the
  // carried state (no forced undock — the dock is part of the navigation state).
  const settleTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!navMoving) return;
    if (Math.abs(g - (page === "trip" ? 1 : 0)) > 0.01) return;
    settleTimer.current = window.setTimeout(() => {
      const other: PageId = page === "trip" ? "home" : "trip";
      const otherEl = scrollerRefs.current[other];
      if (otherEl) {
        otherEl.scrollTop = 0; // invisible by now — free
        scrollYRef.current[other] = 0;
      }
      // Follow-through (R8): after the transition lands, the page scrolls up to
      // the top insight — every screen starts from the same place.
      if (dockedRef.current) {
        dockedRef.current = false;
        setRestTop(inputRestTops[page]);
        setDocked(false);
        const el = scrollerRefs.current[page];
        if (el && el.scrollTop > 0) animateScroll(el, 0);
      } else {
        setRestTop(inputRestTops[page]);
      }
      setNavMoving(false);
    }, 0);
    return () => { if (settleTimer.current) window.clearTimeout(settleTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navMoving, g, page, welcomeHs, animateScroll]);

  // ── Fullscreen open/close ──
  const scrollHomeRaf = useRef(0);
  const openFull = useCallback(() => {
    const pid = pageRef.current;
    // The expansion owns the pill now, and the page is being sprung to its top —
    // so the dock is released here. Leaving it set made the CLOSE fly the pill
    // back into the app bar over an already-top-scrolled page.
    setRestTop(inputRestTops[pid]);
    dockedRef.current = false;
    setDocked(false);
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

  // Focus the input once the expansion has mostly landed — desktop only. On
  // mobile the real keyboard would burst up mid-spring; the user taps to type.
  useEffect(() => {
    if (!full || isMobile) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 380);
    return () => window.clearTimeout(t);
  }, [full, isMobile]);

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

  // The chat is a white surface — the purple has no business being there, so it
  // leaves over the first third of the expansion rather than riding it most of the
  // way up. textFlip is the same ramp inverted, and MUST stay locked to it: the
  // hero copy is white-on-purple and has to become dark exactly as the surface whitens.
  const whiten = clamp01(f / 0.32);
  const gradF = paper ? 0 : 1 - whiten;
  const textFlip = paper ? 1 : whiten;
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
    h: pillH,
  };
  const dockW = paper ? 140 : PILL_DOCK_WIDTH; // v2 dock: avatar + label + balanced margins (R8)
  const dockRect = { left: (frame.w - dockW) / 2, top: dockTop, w: dockW, h: PILL_DOCK_HEIGHT };
  const fullPillRect = { left: PILL_MARGIN, top: fullInputTop, w: frame.w - PILL_MARGIN * 2, h: pillH };
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
  // v2 dock: label sits after the avatar (new-user persona pill); original centres.
  const pillLabelLeft = paper ? lerp(64, 44, pEff) : lerp(24, pill.w / 2 - pillTextW / 2, pEff);
  const whiteTextOp = Math.max(0, 1 - pEff - textFlip);

  // The overlay pill exists only while morphing — at rest the pill lives IN the
  // scroller so it rides native scroll with zero lag (R3: opposite-scroll jank).
  const morphActive = docked || full || p > 0.01 || f > 0.01;

  const pushTrip = useCallback(() => goToPage("trip"), [goToPage]);

  // Memoized card stacks: stable element identity lets React bail out of the
  // whole card subtree on every spring frame (mobile perf).
  const tripCardEls = useMemo(
    () =>
      paper
        ? [<DailySaverCardV2 key="saver" />, <OtherSourcesCardV2 key="sources" />]
        : [<SipTrackerCard key="sip" />, <LumpsumCard key="lumpsum" />, <AtomTrackerCard key="atom" />, <PaceCard key="pace" />],
    [paper],
  );
  const homeCardEls = useMemo(() => {
    const byId: Record<WidgetId, React.ReactNode> = paper
      ? {
          trip: <TripCardV2 key="trip" onOpen={pushTrip} />,
          spend: <LeftToSpendCardV2 key="spend" />,
          cashflow: <CashflowListCardV2 key="cashflow" />,
          bills: <UpcomingPaymentsCardV2 key="bills" />,
          subs: <SubscriptionsCard key="subs" />,
          spendChart: <SpendingSpikeCardV2 key="spendChart" />,
        }
      : {
          trip: <StatCard key="trip" onOpen={pushTrip} />,
          spend: <LeftToSpendCard key="spend" />,
          cashflow: <CashflowCard key="cashflow" />,
          bills: <UpcomingBillsCard key="bills" />,
          subs: <SubscriptionsCard key="subs" />,
          spendChart: <SpendingSpikeCardV2 key="spendChart" />,
        };
    return widgetOrder.filter((id) => widgets[id]).map((id) => byId[id]);
  }, [widgetOrder, widgets, pushTrip, paper]);

  const popTrip = useCallback(() => goToPage("home"), [goToPage]);
  const onChevron = full ? closeFull : page === "trip" ? popTrip : undefined;


  // ── One page: gradient hero (in flow) + cards; heroes grow over the frame in fullscreen ──
  const renderPage = (pid: PageId) => {
    const active = pid === "trip" ? g : 1 - g;
    const isActivePage = page === pid;
    // "Hero holds" (chosen 2026-08-13 over a rigid full-width push and a soft drift):
    // the hero never translates, so it reads as ONE persistent surface while the card
    // stacks push through it — forward the incoming cards arrive from the RIGHT and the
    // outgoing leave LEFT, reversing for free because g runs 1 → 0 on the way back.
    const cardsX = (pid === "trip" ? 1 - g : -g) * frame.w;
    // Both pages share the hero silhouette, so heights blend and its bottom edge glides
    // instead of popping between page heights (R5).
    const heroBlendH = lerp(heroHs.home, heroHs.trip, g);
    const pillTopBlend = lerp(inputRestTops.home, inputRestTops.trip, g);
    const heroH = isActivePage ? lerp(heroBlendH, frame.h, f) : heroBlendH;
    const tripCards = tripCardEls;
    return (
      <div
        key={pid}
        ref={(el) => { scrollerRefs.current[pid] = el; }}
        onScroll={makeScrollHandler(pid)}
        style={{
          position: "absolute",
          inset: 0,
          // Frozen while a page move is in flight: a live scroller during the
          // slide is exactly what made the old transition fight itself.
          overflowY: full || navMoving ? "hidden" : "auto",
          scrollbarWidth: "none",
          opacity: active,
          zIndex: pid === "trip" ? 6 : 4,
          pointerEvents: active > 0.5 ? "auto" : "none",
          willChange: navMoving ? "opacity" : undefined,
        }}
      >
        {/* Hero — V-500 gradient card; grows over the frame and whitens on expand */}
        <div
          style={{
            position: "relative",
            height: heroH,
            borderRadius: paper ? 0 : `0 0 ${36 * (1 - f)}px ${36 * (1 - f)}px`,
            // v2 keeps overflow visible — the hero box ends just under the pill,
            // and clipping there sliced the pill's drop shadow (R7)
            overflow: paper ? "visible" : "hidden",
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
              // BOTH pages ride the global dock/expand fade — the outgoing hero
              // must not snap to full purple mid page-change (it was docked).
              opacity: gradF * (1 - pEff),
              background: `${VALENTINO_500} url(/return-exp1/gradient-v21.png) top/cover no-repeat`,
            }}
          />
          {paper && (
            <div
              aria-hidden
              // The white surface ends exactly at the ask pill's vertical centre, so the
              // hero→page edge and the pill are centre-aligned (R7). Closes up in chat.
              style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: (1 - f) * (pillH / 2 + heroPb), background: BG_CARD }}
            />
          )}
          {/* Hero copy — stacked on-brand / on-white layers, crossfaded by the whitening */}
          <div
            ref={(el) => { welcomeRefs.current[pid] = el; }}
            style={{
              position: "absolute",
              top: heroPadTop,
              left: PAGE_PADDING + 8,
              right: PAGE_PADDING + 8,
              opacity: chatMul,
            }}
          >
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, opacity: paper ? 1 : 1 - (isActivePage ? Math.max(textFlip, pEff) : 0) }}>
                <p style={{ ...typography.headerH2, color: paper ? TEXT_PRIMARY : TEXT_ON_COLOR_PRIMARY, margin: 0 }}>{HERO_COPY[pid].title}</p>
                {/* v2 trip hero carries the goal progress between title and insight (1532:52058) */}
                {paper && pid === "trip" && (
                  <div style={{ padding: "4px 0 6px" }}>
                    <GradientProgress pct={79.1} from={V2_MAGENTA} />
                  </div>
                )}
                {pid === "trip" ? (
                  <GenerativeBody
                    text={paper ? V2_TRIP_BODY : HERO_COPY.trip.body}
                    phase={tripGen}
                    color={paper ? TEXT_PRIMARY : TEXT_ON_COLOR_PRIMARY}
                    onTyped={() => setTripGen("done")}
                  />
                ) : (
                  <p style={{ ...typography.bodySmall, color: paper ? TEXT_PRIMARY : TEXT_ON_COLOR_PRIMARY, margin: 0 }}>{HERO_COPY.home.body}</p>
                )}
              </div>
              {!paper && (
                <div aria-hidden={!isActivePage || Math.max(textFlip, pEff) < 0.5} style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 8, opacity: isActivePage ? Math.max(textFlip, pEff) : 0, pointerEvents: "none" }}>
                  <p style={{ ...typography.headerH2, color: TEXT_PRIMARY, margin: 0 }}>{HERO_COPY[pid].title}</p>
                  <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY, margin: 0 }}>{HERO_COPY[pid].body}</p>
                </div>
              )}
            </div>
          </div>

          {/* Suggestions — revealed once the fullscreen surface has whitened */}
          {isActivePage && turns.length === 0 && (
            <div
              style={{
                position: "absolute",
                top: heroPadTop + welcomeHs[pid] + 24,
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
                  top: pillTopBlend,
                  left: PILL_MARGIN,
                  right: PILL_MARGIN,
                  height: pillH,
                  borderRadius: 100,
                  border: "1px solid rgba(0,0,0,0.1)",
                  background: paper ? BG_CARD : "rgba(255,255,255,0.2)",
                  boxShadow: ELEVATION_CARD,
                  display: "flex",
                  alignItems: "center",
                  padding: paper ? "0 20px 0 16px" : "0 24px",
                  cursor: "pointer",
                  opacity: morphHidden || exp5Hidden ? 0 : 1,
                  transform: `scale(${exp5Hidden ? 0.92 : 1}) translateY(${exp5Hidden ? 10 : 0}px)`,
                  // one-shot pop (spring-soft) for exp5 only; overlay handoffs are atomic
                  transition: EXP5_PILL_AFTER_TYPE && !morphHidden ? "opacity 300ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
                  pointerEvents: morphHidden || exp5Hidden ? "none" : "auto",
                }}
              >
                {paper && <img src="/return-exp1/orb.png" alt="" style={{ width: 32, height: 32, marginRight: 16 }} />}
                <span style={{ ...typography.bodySmall, lineHeight: "normal", color: paper ? TEXT_PRIMARY : TEXT_ON_COLOR_PRIMARY, whiteSpace: "nowrap", flex: 1, textAlign: "left" }}>Ask cosimo</span>
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
                top: chromeH + 4,
                height: fullInputTop - 12 - (chromeH + 4),
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
            padding: `${paper ? 16 : 24}px ${PAGE_PADDING}px ${16 + 119}px`,
            // guarantees the dock detent is reachable INCLUDING this container's own
            // top padding — it was short by exactly that, so short pages rested
            // lower than home and the pill→cards gap differed per page (R8)
            minHeight: frame.h - (statusH + APP_BAR_HEIGHT) - (paper ? 24 : 8) + (paper ? 16 : 24),
            opacity: 1 - f,
            transform: `translateX(${cardsX}px) translateY(${f * 24}px)`,
            pointerEvents: full ? "none" : "auto",
          }}
        >
          {pid === "home" ? (
            homeCardEls
          ) : (
            tripCards.map((card, i) => (
              <div
                key={i}
                style={{
                  transform: `translateX(${(1 - g) * i * 10}px)`,
                  opacity: Math.min(1, active * (1.6 - i * 0.2)),
                }}
              >
                {card}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const tripMounted = page === "trip" || g > 0.002;

  return (
    <PaperCtx.Provider value={paper}>
    <div
      ref={frameRef}
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        background: paper ? V2_PAGE_BG : BG_PRIMARY,
        // v2: cards pick up the DLS drop shadow once the page has whitened.
        // Binary + CSS transition: interpolating shadows per spring frame kept
        // repainting every card during the scroll snap (the R7 scroll jerk).
        ["--re1-card-shadow" as string]: paper && pEff > 0.5 ? "0px 2px 32px 0px rgba(0,0,0,0.05)" : "0px 2px 32px 0px rgba(0,0,0,0)",
      } as React.CSSProperties}
    >
      {/* v2 scroll-whitening as a static white veil (opacity is compositor-only —
          interpolating background colours repainted the whole page every frame
          and janked the pill morph + scroll on mobile, R7) */}
      {paper && (
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "#FFFFFF", opacity: pEff, zIndex: 2, pointerEvents: "none" }} />
      )}

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
          height: chromeH,
          background: BG_PRIMARY,
          opacity: pEff * 0.92,
          // layer turns on MID-flight (masked by motion) — flipping it at settle
          // was the post-morph hitch (R8)
          backdropFilter: pEff > 0.3 ? "blur(16px)" : undefined,
          WebkitBackdropFilter: pEff > 0.3 ? "blur(16px)" : undefined,
          // feathered bottom edge — card drop shadows fade under the bar instead
          // of getting sliced at a hard line (R7)
          WebkitMaskImage: "linear-gradient(to bottom, black calc(100% - 20px), transparent)",
          maskImage: "linear-gradient(to bottom, black calc(100% - 20px), transparent)",
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
          background: paper ? BG_CARD : `rgba(255,255,255,${lerp(0.2, 0.1, pEff)})`,
          // blur only once settled in the bar (and never for v2's solid pill) —
          // blurring mid-flight janks the morph on mobile
          backdropFilter: !paper && pEff > 0.5 ? "blur(12px)" : undefined,
          WebkitBackdropFilter: !paper && pEff > 0.5 ? "blur(12px)" : undefined,
          boxShadow: ELEVATION_CARD,
          zIndex: 20,
          cursor: full ? "text" : "pointer",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
        }}
      >
        {/* v2: the orb rides the morph too — without it the image popped back in
            at every overlay handoff (R7). It crossfades into the send orb in chat. */}
        {paper && (
          <img
            src="/return-exp1/orb.png"
            alt=""
            style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, opacity: (1 - pEff) * (1 - f), pointerEvents: "none" }}
          />
        )}
        {/* docked v2 pill = the new-user persona pill: cosimo avatar + label */}
        {paper && (
          <img
            src="/chat/cosimo-avatar.png"
            alt=""
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 24, height: 24, borderRadius: "50%", opacity: pEff, pointerEvents: "none" }}
          />
        )}
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
            paddingLeft: paper ? 40 * (1 - f) : 0,
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
          {isMobile ? (
            <div aria-hidden style={{ height: statusH }} />
          ) : (
            <>
              <div style={{ opacity: 1 - t }}>
                <StatusBar backgroundColor="transparent" color={TEXT_ON_COLOR_PRIMARY} />
              </div>
              <div style={{ position: "absolute", inset: 0, opacity: t }}>
                <StatusBar backgroundColor="transparent" color={TEXT_PRIMARY} />
              </div>
            </>
          )}
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
          onToggle={(id) => {
            widgetsTouched.current = true;
            setWidgets((w) => ({ ...w, [id]: !w[id] }));
          }}
          onAdd={(id) => {
            widgetsTouched.current = true;
            setWidgetOrder((o) => [...o, id]);
            setWidgets((w) => ({ ...w, [id]: true }));
          }}
          onReorder={(next) => {
            widgetsTouched.current = true;
            setWidgetOrder(next);
          }}
        />
      )}
    </div>
    </PaperCtx.Provider>
  );
}
