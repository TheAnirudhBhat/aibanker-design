"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { typography } from "../lib/typography";
import {
  VALENTINO_500,
  BG_PRIMARY,
  BG_CARD,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_DISABLED,
  TEXT_ON_COLOR_PRIMARY,
  OUTLINE_SUBTLE,
  BLUE_50,
  BLUE_500,
} from "../lib/colors";
import { ELEVATION_CARD } from "../lib/elevation";
import { RADIUS_M } from "../lib/radii";
import { StatusBar, STATUS_BAR_HEIGHT } from "../components/AppChrome";
import MockKeyboard, { MOCK_KEYBOARD_HEIGHT } from "../components/MockKeyboard";

// ─────────────────────────────────────────────────────────────────────────────
// Return exp1 — returning-user dashboard experiment (Figma qo0U58MJSHQ3o4E0QUaDRK
// section 1420:28634). Three states, all spring-driven:
//   rest      — V-500 gradient hero (welcome + insight) with the "Ask cosimo"
//               pill inside it, dashboard cards below.
//   docked    — on scroll, the pill morphs into a 182×48 app-bar pill; chrome
//               flips from on-brand (white glyphs) to white (dark glyphs).
//   fullscreen— on tap, the surface expands to white, the welcome copy flips
//               dark, suggestions reveal, the pill drops above the keyboard.
// The ask pill is ONE absolutely-positioned element whose rect is interpolated
// between the three states, so every transition is a real shared-element morph.
// ─────────────────────────────────────────────────────────────────────────────

// Proto-specific decorative values from the Figma frames (not DLS tokens):
const PROGRESS_INDIGO = "#6976EB"; // stat-block progress fill (1420:24428)
const PROGRESS_GROOVE = "#D9D9D9"; // stat-block progress groove (1420:24427)

const APP_BAR_HEIGHT = 64;
const CHROME_HEIGHT = STATUS_BAR_HEIGHT + APP_BAR_HEIGHT; // 108
const HERO_PADDING_TOP = CHROME_HEIGHT + 16; // 124 — Figma hero pt
const PILL_REST_HEIGHT = 57; // px-24 py-20 pill (1420:21780)
const PILL_DOCK_WIDTH = 182; // app-bar pill (1420:24788)
const PILL_DOCK_HEIGHT = 48;
const PILL_DOCK_TOP = STATUS_BAR_HEIGHT + 8; // centered in the 64px bar row
const PAGE_PADDING = 24;
const PILL_MARGIN = 20; // Figma pill is 320 wide on a 360 frame
const KEYBOARD_GAP = 28; // input bottom → keyboard top (frame 1420:22471)

// Spring: subtle life, no visible wobble (slice motion: bounce ≤ 0.2).
const SPRING = { stiffness: 320, damping: 32 };

/** rAF spring toward `target`. Interruptible — retargeting keeps velocity. */
function useSpringValue(target: number, { stiffness, damping } = SPRING) {
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

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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

/** 48px circular chrome chip that crossfades on-brand → on-white with `t`. */
function ChromeChip({ t, onClick, children, ariaLabel }: {
  t: number;
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
        background: `rgba(255,255,255,${lerp(0.1, 1, t)})`,
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

function CardHeaderRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
      <span style={{ ...typography.metadata, color: TEXT_PRIMARY, textTransform: "uppercase" }}>{label}</span>
      <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{value}</span>
    </div>
  );
}

function StatCard() {
  return (
    <div style={{ ...cardBase, padding: "14px 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
      <CardHeaderRow label="Trip to Japan" value="65%" />
      <div style={{ position: "relative", height: 4, width: "100%" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 5, background: PROGRESS_GROOVE }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "67.5%", borderRadius: 5, background: PROGRESS_INDIGO }} />
      </div>
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
    <div
      style={{
        position: "relative",
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: BLUE_50,
        border: `1px solid ${OUTLINE_SUBTLE}`,
      }}
    >
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
        <circle
          cx="18"
          cy="18"
          r={R}
          fill="none"
          stroke={BLUE_500}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={`${C * arc} ${C}`}
          transform="rotate(-90 18 18)"
        />
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

// Chart dots: [top%, left%, color] from the Figma insets (1420:24506).
const CHART_DOTS: [number, number, string][] = [
  [66.23, 8.59, "#04E762"],
  [56.71, 30.07, "#04E762"],
  [33.1, 51.19, "#04E762"],
  [30.24, 8.59, "#FF715B"],
  [24.97, 51.36, "#FF715B"],
  [13.95, 29.87, "#FF715B"],
];

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
      {/* Chart — committed Figma exports (chart-lines / chart-graph) + coded dots */}
      <div style={{ position: "relative", height: 169, width: "100%", overflow: "hidden" }}>
        <img
          src="/return-exp1/chart-lines.svg"
          alt=""
          style={{ position: "absolute", top: -22, left: 0, width: "100%", height: 173 }}
        />
        <div style={{ position: "absolute", top: 0, right: 0, width: "93.3%", height: 190.6 }}>
          <img
            src="/return-exp1/chart-graph.svg"
            alt=""
            style={{ position: "absolute", top: "-11.54%", right: "2.75%", bottom: "17.84%", left: "-7.02%", width: "104.27%", height: "93.7%" }}
          />
          <div
            style={{
              position: "absolute",
              top: 156.6,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "space-between",
              ...typography.metadata,
              color: TEXT_DISABLED,
              textTransform: "uppercase",
            }}
          >
            {["Jun", "Jul", "Aug", "Sep", "Oct"].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
        {CHART_DOTS.map(([top, left, color], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${top}%`,
              left: `${left}%`,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: BG_CARD,
              display: "grid",
              placeItems: "center",
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
          </div>
        ))}
        {/* left-edge fade (Figma 1420:28373) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: 25,
            background: `linear-gradient(to right, ${BG_CARD}, transparent)`,
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}

// ── Fullscreen suggestions (authored in the Figma frame, revealed on expand) ──

// crop: percentage rect from the Figma frame (the categories art is a sprite).
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

// ─────────────────────────────────────────────────────────────────────────────

export default function ReturnExp1Sim() {
  const frameRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pillSlotRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState({ w: 360, h: 780 });
  const [scrollY, setScrollY] = useState(0);
  const [pillSlotTop, setPillSlotTop] = useState(260);
  const [docked, setDocked] = useState(false);
  const [full, setFull] = useState(false);

  const p = useSpringValue(docked && !full ? 1 : docked ? 1 : 0); // dock progress
  const f = useSpringValue(full ? 1 : 0); // fullscreen progress

  // Measure the frame + the pill's natural slot inside the hero.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => {
      setFrame({ w: el.clientWidth, h: el.clientHeight });
      if (pillSlotRef.current) setPillSlotTop(pillSlotRef.current.offsetTop);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Scroll drives docking with hysteresis so the morph never flickers.
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const y = el.scrollTop;
    setScrollY(y);
    const naturalTop = pillSlotTop - y;
    setDocked((d) => (d ? naturalTop <= PILL_DOCK_TOP + 26 : naturalTop <= PILL_DOCK_TOP + 6));
  }, [pillSlotTop]);

  // Fullscreen: spring the scroller home so collapse always lands on the hero.
  const scrollHomeRaf = useRef(0);
  const openFull = useCallback(() => {
    setFull(true);
    const el = scrollRef.current;
    if (!el) return;
    cancelAnimationFrame(scrollHomeRaf.current);
    const start = el.scrollTop;
    if (start <= 0) return;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - t0) / 420, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.scrollTop = start * (1 - ease);
      if (t < 1) scrollHomeRaf.current = requestAnimationFrame(step);
    };
    scrollHomeRaf.current = requestAnimationFrame(step);
  }, []);
  useEffect(() => () => cancelAnimationFrame(scrollHomeRaf.current), []);

  const closeFull = useCallback(() => setFull(false), []);

  // ── Interpolated pill rect: rest (follows scroll) → docked → fullscreen ──
  const rect = useMemo(() => {
    const rest = {
      left: PILL_MARGIN,
      top: pillSlotTop - scrollY,
      w: frame.w - PILL_MARGIN * 2,
      h: PILL_REST_HEIGHT,
    };
    const dock = {
      left: (frame.w - PILL_DOCK_WIDTH) / 2,
      top: PILL_DOCK_TOP,
      w: PILL_DOCK_WIDTH,
      h: PILL_DOCK_HEIGHT,
    };
    const fullR = {
      left: PILL_MARGIN,
      top: frame.h - MOCK_KEYBOARD_HEIGHT - KEYBOARD_GAP - PILL_REST_HEIGHT,
      w: frame.w - PILL_MARGIN * 2,
      h: PILL_REST_HEIGHT,
    };
    const base = {
      left: lerp(rest.left, dock.left, p),
      top: lerp(rest.top, dock.top, p),
      w: lerp(rest.w, dock.w, p),
      h: lerp(rest.h, dock.h, p),
    };
    return {
      left: lerp(base.left, fullR.left, f),
      top: lerp(base.top, fullR.top, f),
      w: lerp(base.w, fullR.w, f),
      h: lerp(base.h, fullR.h, f),
    };
  }, [pillSlotTop, scrollY, frame, p, f]);

  // Chrome flip amount: docked or fullscreen both read dark-on-white.
  const t = Math.min(1, Math.max(p * (1 - f) + f, 0));
  const pEff = p * (1 - f); // docked text centering, undone in fullscreen
  const whiteTextOp = Math.max(0, 1 - pEff - f); // pill label on-brand share

  return (
    <div ref={frameRef} style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden", background: BG_PRIMARY }}>
      {/* ── Scrollable page: hero + cards ── */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        style={{ position: "absolute", inset: 0, overflowY: full ? "hidden" : "auto", scrollbarWidth: "none" }}
      >
        {/* Hero — V-500 gradient surface, fades to white as fullscreen opens */}
        <div
          style={{
            position: "relative",
            padding: `${HERO_PADDING_TOP}px ${PAGE_PADDING}px 24px`,
            borderRadius: `0 0 ${36 * (1 - f)}px ${36 * (1 - f)}px`,
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              opacity: 1 - f,
              background: `${VALENTINO_500} url(/return-exp1/gradient-v21.png) top/cover no-repeat`,
            }}
          />
          {/* Welcome copy — stacked on-brand / on-white layers, crossfaded by f */}
          <div style={{ position: "relative", padding: "0 8px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, opacity: 1 - f }}>
              <p style={{ ...typography.headerH2, color: TEXT_ON_COLOR_PRIMARY, margin: 0 }}>Welcome back  👋🏼</p>
              <p style={{ ...typography.bodySmall, color: TEXT_ON_COLOR_PRIMARY, margin: 0 }}>
                You&rsquo;re ₹3,200 closer to your Trip to Japan goal. Your savings rate jumped 18% this month — your best streak yet!
              </p>
            </div>
            <div aria-hidden={f < 0.5} style={{ position: "absolute", inset: "0 8px", display: "flex", flexDirection: "column", gap: 8, opacity: f, pointerEvents: "none" }}>
              <p style={{ ...typography.headerH2, color: TEXT_PRIMARY, margin: 0 }}>Welcome back  👋🏼</p>
              <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY, margin: 0 }}>
                You&rsquo;re ₹3,200 closer to your Trip to Japan goal. Your savings rate jumped 18% this month — your best streak yet!
              </p>
            </div>
          </div>
          {/* Suggestions — authored in the Figma frame, revealed in fullscreen */}
          <div
            style={{
              position: "relative",
              padding: "0 8px",
              marginTop: 20 * f,
              maxHeight: f < 0.02 ? 0 : 200,
              opacity: f,
              overflow: "hidden",
              pointerEvents: full ? "auto" : "none",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {SUGGESTIONS.map((s, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 16, transform: `translateY(${(1 - f) * (10 + i * 12)}px)` }}>
                  {i > 0 && <div style={{ height: 1, width: "100%", background: OUTLINE_SUBTLE }} />}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ position: "relative", width: 28, height: 28, overflow: "hidden", flexShrink: 0 }}>
                      <img
                        src={`/return-exp1/${s.img}.png`}
                        alt=""
                        style={s.crop ? { position: "absolute", maxWidth: "none", ...s.crop } : { width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{s.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* The pill's natural slot — the morphing pill overlays this space */}
          <div ref={pillSlotRef} style={{ height: PILL_REST_HEIGHT, marginTop: 32 }} />
        </div>

        {/* Cards — fade + drop away as fullscreen opens */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: `24px ${PAGE_PADDING}px ${16 + 119}px`,
            opacity: 1 - f,
            transform: `translateY(${f * 24}px)`,
            pointerEvents: full ? "none" : "auto",
          }}
        >
          <StatCard />
          <LeftToSpendCard />
          <CashflowCard />
        </div>
      </div>

      {/* ── Fixed chrome: status bar + app bar (on-brand ↔ on-white) ── */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 20 }}>
        <div style={{ position: "absolute", inset: 0, background: BG_PRIMARY, opacity: pEff }} />
        <div style={{ position: "relative" }}>
          {/* stacked status bars crossfaded (its own transition is tuned for page slides) */}
          <div style={{ opacity: 1 - t }}>
            <StatusBar backgroundColor="transparent" color={TEXT_ON_COLOR_PRIMARY} />
          </div>
          <div style={{ position: "absolute", inset: 0, opacity: t, pointerEvents: "none" }}>
            <StatusBar backgroundColor="transparent" color={TEXT_PRIMARY} />
          </div>
          <div style={{ height: APP_BAR_HEIGHT, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px" }}>
            <ChromeChip t={t} ariaLabel={full ? "Collapse" : "Back"} onClick={full ? closeFull : undefined}>
              {(color) => <ChevronIcon color={color} rotate={f * 90} />}
            </ChromeChip>
            <ChromeChip t={t} ariaLabel="More options">
              {(color) => <KebabIcon color={color} />}
            </ChromeChip>
          </div>
        </div>
      </div>

      {/* ── The morphing "Ask cosimo" pill ── */}
      <button
        type="button"
        onClick={full ? undefined : openFull}
        aria-label="Ask cosimo"
        style={{
          position: "absolute",
          left: rect.left,
          top: rect.top,
          width: rect.w,
          height: rect.h,
          borderRadius: 100,
          border: `1px solid rgba(0,0,0,${lerp(lerp(0.1, 0.05, pEff), 0.1, f)})`,
          background: `rgba(255,255,255,${lerp(0.2, 0.1, pEff)})`,
          boxShadow: ELEVATION_CARD,
          zIndex: 30,
          cursor: full ? "text" : "pointer",
          padding: 0,
          overflow: "hidden",
        }}
      >
        {/* label: left-anchored on-brand → centered docked → left-anchored dark */}
        <span
          style={{
            position: "absolute",
            left: lerp(24, rect.w / 2 - 36, pEff),
            top: "50%",
            transform: "translateY(-50%)",
            ...typography.bodySmall,
            lineHeight: "normal",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ color: TEXT_ON_COLOR_PRIMARY, opacity: whiteTextOp, position: "absolute", inset: 0 }}>Ask cosimo</span>
          <span style={{ color: TEXT_PRIMARY, opacity: 1 - whiteTextOp }}>Ask cosimo</span>
        </span>
      </button>

      {/* ── Keyboard — spring-ridden by the fullscreen progress ── */}
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
    </div>
  );
}
