"use client";

import { createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { typography } from "../lib/typography";
import {
  VALENTINO_500,
  BG_PRIMARY,
  BG_CARD,
  BG_SECONDARY,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  TEXT_ON_COLOR_PRIMARY,
  OUTLINE_SUBTLE,
  OUTLINE_BOLD,
  GREEN_500,
  EXT_TEXT_MAIN,
  ORANGE_500,
  RED_500,
  BTN_BG_PRIMARY_DEFAULT,
  CHAT_USER_BUBBLE,
} from "../lib/colors";
import { ELEVATION_CARD } from "../lib/elevation";
import { RADIUS_M, RADIUS_PILL } from "../lib/radii";
import { StatusBar, STATUS_BAR_HEIGHT } from "../components/AppChrome";
import MockKeyboard, { MOCK_KEYBOARD_HEIGHT } from "../components/MockKeyboard";
import { useTypewriter } from "../components/Chat";
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

// ── "V2 paper" theme — white-first redesign from Figma 1528:49462. All values
// are verbatim from that frame; the theme is switchable from the debug panel
// ("Theme"), and the original Valentino treatment stays fully intact.
const V2_MAGENTA = "rgb(212, 20, 216)"; // gradient progress start (1531:50620)
const V2_CAL_BLUE = "#6698FF"; // calendar tile month strip (1528:49894)
const V2_CAL_DAY = "#38424F"; // calendar tile day (1528:49893)
const V2_TILE_BORDER = "#F0F3F5"; // calendar tile border (1528:49892)
const V2_TILE_SHADOW = "0px 0px 20px rgba(0,0,0,0.06)"; // calendar tile (1528:49892)
const V2_PEACH = "#FBE9EC"; // skipped-month cell (1532:52282)
const V2_CELL_GRAY = "#F6F7F9"; // upcoming-month cell (1532:52288)
const V2_LABEL_GRAY = "#A5B6C5"; // month label (1532:52272)
const V2_FOOT_GRAY = "#8795A7"; // projection footer (1532:52317)
// The month behind every number: Oct 2026, today the 8th, 23 days left.
// income 50,000 = spent 14,300 + into goals 6,500 + upcoming 14,000 + left 15,200

// "Needs action": something has gone wrong and cosimo wants a decision. Each page
// states ITS own version — the trip's overspend means nothing on the payments page.
type ActionOption = { img: string; text: string; crop?: React.CSSProperties };
/** cosimo's reply when the user keeps it — the header simply drops the alert. */
const SELF_REPLY = "All yours. I won't move anything, just ask if you want me back on it.";
// Row art per Figma 1577:54866 — the same three tiles, in the same order.
const OPT_SELF: ActionOption = {
  img: "suggest-categories",
  text: "I'll handle it myself",
  crop: { width: "485.63%", height: "323.05%", left: "-44.59%", top: "-47.71%" },
};
const OPT_LAST: ActionOption = {
  img: "suggest-categories",
  text: "",
  crop: { width: "520.94%", height: "347.63%", left: "-335.93%", top: "-61.47%" },
};
const ACTION_STATES: Record<string, { title: string; body: string; done: string; doneTitle: string; options: ActionOption[] }> = {
  home: {
    doneTitle: "Morning, Rajan",
    done: "The Japan pot is back on track with ₹75,000 added. You've still got ₹15,200 to spend this month, and you're running ₹7,400 under your usual — the room came from a quiet fortnight.",
    title: "Japan trip is off course",
    body: "Rajan, you've overspent by ₹15,000 against what we budgeted. Let's do some damage control while we still can.",
    options: [
      { img: "suggest-spends", text: "Add ₹75,000 to pot" },
      OPT_SELF,
      { ...OPT_LAST, text: "Show me where I overspent" },
    ],
  },
  trip: {
    doneTitle: "This trip is on track",
    done: "₹75,000 has been added, covering May’s missed instalment and the ₹15,000 gap. That puts the trip back ahead of plan.",
    title: "This trip is off course",
    body: "You're ₹15,000 over what we budgeted for it, Rajan, and May's instalment never went in. Let's fix it while there's time.",
    options: [
      { img: "suggest-spends", text: "Add ₹75,000 to pot" },
      OPT_SELF,
      { ...OPT_LAST, text: "Show me what I missed" },
    ],
  },
  budget: {
    doneTitle: "Food has room again",
    done: "₹3,000 has moved from shopping to food, so food has ₹7,800 left for the next 23 days and shopping ₹600. Everything else stays as it was.",
    title: "Food is eating the month",
    body: "You're ₹4,800 from that cap with 23 days to go, Rajan. At this pace it's gone by the 18th.",
    options: [
      { img: "suggest-spends", text: "Move ₹3,000 from shopping" },
      OPT_SELF,
      { ...OPT_LAST, text: "Show me the food spends" },
    ],
  },
  payments: {
    doneTitle: "Rent sits on the 15th now",
    done: "Rent has moved to the 15th, three days after your salary lands, so the ₹11,000 never overlaps the trip instalment. The other two are unchanged.",
    title: "Rent lands on the 12th",
    body: "₹14,000 goes out over the next two weeks, Rajan. Fine today, but it leaves nothing spare if the trip pot takes its instalment too.",
    options: [
      { img: "suggest-spends", text: "Move rent to the 15th" },
      OPT_SELF,
      { ...OPT_LAST, text: "Show me what's due" },
    ],
  },
  income: {
    doneTitle: "₹5,000 is in the pot",
    done: "₹5,000 has been added to the Japan pot, on top of October’s ₹6,500. That leaves ₹10,200 to spend for the rest of the month.",
    title: "Nothing extra came in",
    body: "Salary hit on the 1st as usual, Rajan, but with ₹15,000 of overspend the trip pot needs more than what's spare.",
    options: [
      { img: "suggest-spends", text: "Set aside ₹5,000 now" },
      OPT_SELF,
      { ...OPT_LAST, text: "Show me last month" },
    ],
  },
  spends: {
    doneTitle: "Food is capped at ₹8,000",
    done: "Food is capped at ₹8,000 from here. You’re at ₹6,200, so I’ll nudge you when there’s ₹1,000 of it left.",
    title: "Spending is below usual",
    body: "₹14,300 out this month against ₹21,700 on average, Rajan. The trip pot is still ₹15,000 behind where we planned.",
    options: [
      { img: "suggest-spends", text: "Cap food at ₹8,000" },
      OPT_SELF,
      { ...OPT_LAST, text: "Show me the big ones" },
    ],
  },
  cashflow: {
    doneTitle: "₹5,000 is set aside",
    done: "₹5,000 has been added to the Japan pot, which keeps the month’s saving rate where it is. ₹10,200 stays yours to spend.",
    title: "Cash is leaving faster",
    body: "₹34,800 has gone out or been set aside this month against ₹50,000 in, Rajan. The tightest it's been all year.",
    options: [
      { img: "suggest-spends", text: "Set aside ₹5,000 now" },
      OPT_SELF,
      { ...OPT_LAST, text: "Show me where it went" },
    ],
  },
};

/** True when the sim renders the V2 paper theme. */
const PaperCtx = createContext(false);
const usePaper = () => useContext(PaperCtx);

const APP_BAR_HEIGHT = 64;
const PILL_REST_HEIGHT = 57; // px-24 py-20 input (1420:21780)
const PAGE_PADDING = 24;
// The page sits on a 28 gutter and tightens to PAGE_PADDING (24) in the chat view,
// where the thread and suggestions live. The ask field is the one thing that keeps
// a constant 24 either side — it must not change width when it's tapped.
const PAGE_GUTTER = 24;
const HERO_GUTTER = 24; // the chat surface's gutter (thread + suggestions), same as the cards (R13)
const PILL_MARGIN = 24;
// The floating bar sits wider than the cards it rides over (bottom placements only).
const BAR_MARGIN = 20;
// Live, the field runs wider than the cards: 20 either side, the same as the
// floating bar it takes over from (R11).
const CHAT_PILL_MARGIN = 20;
const KEYBOARD_GAP = 20; // input bottom → keyboard top (R4: 8px tighter than the frame)

// "Quick but gentle" (R9): launches fast, lands like a feather — a hard ease-out
// with a long settle tail and zero overshoot.
const GENTLE = "cubic-bezier(0.16, 1, 0.3, 1)";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// exp5 (2026-08-12, revertable): on the trip page the ask pill pops in only
// AFTER the generated insight finishes typing. Flip to false to revert.
const EXP5_PILL_AFTER_TYPE = true; // R9: detail pages orchestrate heading → typing → pill + cards

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

function HistoryIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4.5 12a7.5 7.5 0 1 1 2.2 5.3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M4.5 12V8.6M4.5 12H7.9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8.5V12l2.6 1.6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NewChatIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2" strokeLinecap="round" />
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

/** 48px frosted chrome chip. Crossfades on-brand → on-white from TWO sources,
    OR-blended: the scroll flip (the --re1-t CSS var — no React involved) and the
    chat flip (`flip`, spring-driven). `ghost` turns it to visible glass in chat. */
function ChromeChip({ flip, ghost = 0, onClick, children, ariaLabel }: {
  flip: number;
  ghost?: number;
  onClick?: () => void;
  children: (color: string) => React.ReactNode;
  ariaLabel: string;
}) {
  // white share = (1 - flip) * (1 - scroll)
  const whiteShare = `calc(${(1 - flip).toFixed(4)} * (1 - var(--re1-t, 0)))`;
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
        // 0.16 → 1 as the chrome flips; ghost caps it at glass (0.55)
        background: `rgba(255,255,255, calc(${lerp(1, 0.55, ghost).toFixed(3)} - ${(lerp(1, 0.55, ghost) - 0.16).toFixed(3)} * ${whiteShare}))`,
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
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: whiteShare }}>
        {children(TEXT_ON_COLOR_PRIMARY)}
      </div>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: `calc(1 - ${whiteShare})` }}>
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
      <span style={{ ...OVERLINE, color: TEXT_PRIMARY }}>{label}</span>
      <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{value}</span>
    </div>
  );
}


/** V2 gradient progress: the fill fades out to the card, a dot floats at its end. */
/** The action rows, in the hero and again at the top of the chat. Memoised: the
    page re-renders on every frame of the chat spring, and re-rendering these rows
    (three images each) on those frames is what made the first open stutter. */
const ActionRows = memo(function ActionRows({ options, onChoose, staggered, active, interactive, padding }: {
  options: ActionOption[];
  onChoose: (text: string, index: number) => void;
  staggered: boolean;
  active: boolean;
  interactive: boolean;
  padding: string;
}) {
  return (
    <div style={{ position: "relative", zIndex: 9, display: "flex", flexDirection: "column", gap: 16, padding }}>
      {options.map((opt, i) => {
        const row = (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {i > 0 && <div style={{ height: 1, marginLeft: 40, background: OUTLINE_SUBTLE }} />}
            <div
              role="button"
              tabIndex={interactive ? 0 : -1}
              onClick={() => onChoose(opt.text, i)}
              onKeyDown={(e) => { if (e.key === "Enter") onChoose(opt.text, i); }}
              style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", pointerEvents: interactive ? "auto" : "none" }}
            >
              <div style={{ position: "relative", width: 28, height: 28, overflow: "hidden", flexShrink: 0 }}>
                <img
                  src={`/return-exp1/${opt.img}.png`}
                  alt=""
                  style={opt.crop ? { position: "absolute", maxWidth: "none", ...opt.crop } : { width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{opt.text}</span>
            </div>
          </div>
        );
        return staggered ? (
          <Stagger key={opt.text} index={1 + i} active={active}>{row}</Stagger>
        ) : (
          <div key={opt.text}>{row}</div>
        );
      })}
    </div>
  );
});





// Cashflow chart — drawn from the Figma dot geometry so points, lines, grid and
// month labels share one x-grid and stay aligned (R2 feedback: graph alignment).


// ── Trip detail cards (R2/R4 feedback — same design language) ────────────────

// Month-wise contribution cell: tick = contributed, cross = skipped, dash = due.




/** Detected lumpsum headroom → one-tap top-up (its own card per R4 feedback). */



// ── V2 paper theme cards (Figma 1528:49462) ─────────────────────────────────

/** Card header, R12 language: an UPPERCASE overline over the substance line. */
const OVERLINE: React.CSSProperties = {
  fontFamily: "var(--font-rubik), sans-serif",
  fontWeight: 500,
  fontSize: 10,
  lineHeight: "12px",
  letterSpacing: 0.4,
  textTransform: "uppercase",
};

function V2StackedHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      <span style={{ ...OVERLINE, color: TEXT_PRIMARY }}>{title}</span>
      <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>{sub}</span>
    </div>
  );
}

/** The budget GAUGE (1738:14090): a speedometer arc, mouth open at the bottom —
    #E8ECEF track, a #0C9F56 sweep that fades out toward its tail, a solid dot at
    the sweep's head, and the label + number seated inside. Drawn natively so the
    sweep tracks OUR percentage. */
function FeedGauge({ pct, label, value }: { pct: number; label: string; value: string }) {
  const C = 97.5; // centre of the 195 square
  const R = 78; // stroke centreline radius (stroke 34 → outer edge ≈ 95)
  const START = 197; // lower-left foot, a touch below the horizon (per the frame)
  const TOTAL = 214; // to -17° at the lower-right foot, over the top
  const end = START - (TOTAL * Math.max(0, Math.min(100, pct))) / 100;
  const pt = (deg: number, r = R) => {
    const rad = (deg * Math.PI) / 180;
    return { x: C + r * Math.cos(rad), y: C - r * Math.sin(rad) };
  };
  const arc = (fromDeg: number, toDeg: number) => {
    const a = pt(fromDeg);
    const b = pt(toDeg);
    const large = fromDeg - toDeg > 180 ? 1 : 0;
    return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
  };
  // the dot floats OUTSIDE the band, just past the sweep's flat cut (the frame
  // seats it at r≈105 against the 95 outer edge)
  const dot = pt(end - 1.5, 105);
  return (
    <div style={{ position: "relative", width: 195, height: 131, alignSelf: "center" }}>
      <svg width="195" height="131" viewBox="0 0 195 131" fill="none" style={{ display: "block", overflow: "visible" }}>
        <defs>
          {/* both feet dissolve near the bottom, like the frame */}
          <linearGradient id="re1FeedGaugeTrack" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#E8ECEF" stopOpacity="0" />
            <stop offset="0.38" stopColor="#E8ECEF" />
            <stop offset="1" stopColor="#E8ECEF" />
          </linearGradient>
          <linearGradient id="re1FeedGaugeSweep" x1="0" y1="1" x2="0.85" y2="0">
            <stop offset="0" stopColor="#0C9F56" stopOpacity="0" />
            <stop offset="0.55" stopColor="#0C9F56" stopOpacity="0.75" />
            <stop offset="1" stopColor="#0C9F56" />
          </linearGradient>
        </defs>
        {/* flat cuts (no round caps), per 1738:14090 */}
        <path d={arc(START, START - TOTAL)} stroke="url(#re1FeedGaugeTrack)" strokeWidth="34" />
        <path d={arc(START, end)} stroke="url(#re1FeedGaugeSweep)" strokeWidth="34" />
        <circle cx={dot.x} cy={dot.y} r="3.44" fill="#0C9F56" />
      </svg>
      <div style={{ position: "absolute", left: "50%", top: 63, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 10, lineHeight: "12px", letterSpacing: 0.4, color: TEXT_TERTIARY, whiteSpace: "nowrap" }}>
          {label}
        </span>
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 20, lineHeight: "24px", letterSpacing: 0.4, color: TEXT_PRIMARY, marginTop: 2, whiteSpace: "nowrap" }}>
          {value}
        </span>
      </div>
    </div>
  );
}

/** The budget page's HERO gauge (1771:19442): a big 226° arc with the copy seated
    inside — month • label, the number large, pct • days under it. The sweep runs
    deep green at its foot to a soft mint at the head; no dot on this one. */
function BudgetHeroGauge() {
  // Drawn INSIDE its own box (an oversized art square once clipped the crown).
  // S scales the whole arc — 0.88 of the 1771 frame, per "slightly smaller" (R17).
  const S = 0.88;
  const W = Math.round(314 * S);
  const CX = 157 * S;
  const CY = 161 * S;
  const R = 140 * S; // stroke centreline (stroke 26S → crown clears the top)
  const START = 200;
  const TOTAL = 220;
  // The box CONTAINS the feet (they dip (TOTAL−180)/2 = 20° below the horizon) —
  // a fixed height kept cropping them (R17).
  const H = Math.ceil(CY + R * Math.sin(((TOTAL - 180) / 2) * (Math.PI / 180)) + (26 * S) / 2) + 1;
  const pct = 51.5;
  const end = START - (TOTAL * pct) / 100;
  const pt = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: CX + R * Math.cos(rad), y: CY - R * Math.sin(rad) };
  };
  const arc = (fromDeg: number, toDeg: number) => {
    const a = pt(fromDeg);
    const b = pt(toDeg);
    const large = fromDeg - toDeg > 180 ? 1 : 0;
    return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
  };
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: W, height: H }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        fill="none"
        style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", display: "block" }}
      >
        <defs>
          <linearGradient id="re1HeroGaugeTrack" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#E8ECEF" stopOpacity="0" />
            <stop offset="0.32" stopColor="#E8ECEF" />
            <stop offset="1" stopColor="#E8ECEF" />
          </linearGradient>
          {/* deep at the foot, soft mint at the head (1771) */}
          <linearGradient id="re1HeroGaugeSweep" x1="0" y1="0.75" x2="1" y2="0">
            {/* inverted per pin (R18): the pale head leads, deep green trails */}
            <stop offset="0" stopColor="#B9E4CD" />
            <stop offset="0.38" stopColor="#2FB06C" />
            <stop offset="1" stopColor="#089D53" />
          </linearGradient>
        </defs>
        <path d={arc(START, START - TOTAL)} stroke="url(#re1HeroGaugeTrack)" strokeWidth={26 * S} />
        <path d={arc(START, end)} stroke="url(#re1HeroGaugeSweep)" strokeWidth={26 * S} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "calc(50% + 27px)",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: TEXT_SECONDARY }}>
          Oct • Left to spend
        </span>
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 32, lineHeight: "40px", color: TEXT_PRIMARY }}>₹15,200</span>
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: TEXT_TERTIARY }}>
          51% • 23 days left
        </span>
      </div>
    </div>
  );
}

/** The budget GAUGE card (1738:13116): overline row, then the gauge. */
function BudgetHeroCard({ onOpen }: { onOpen: () => void }) {
  const base = useCardBase();
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Budget details"
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      style={{
        ...base,
        borderRadius: 16,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <span style={{ ...OVERLINE, color: TEXT_PRIMARY }}>Oct budget</span>
        <span style={{ ...OVERLINE, color: TEXT_PRIMARY }}>29,500</span>
      </div>
      <FeedGauge pct={51.5} label="left to spend" value="₹15,200" />
    </div>
  );
}

/** One goal tile (1738:13137): overline, value + /target on a baseline, then an
    "On track" line over a 4px bar — magenta for the active goal, slate for the
    paused one. */
function GoalTile({ label, value, unit, tone, pct, ariaLabel, onOpen }: {
  label: string;
  value: string;
  unit: string;
  tone: string;
  pct: number;
  ariaLabel: string;
  onOpen: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      style={{
        flex: 1,
        minWidth: 0,
        background: BG_CARD,
        border: `1px solid ${OUTLINE_SUBTLE}`,
        borderRadius: 12,
        boxShadow: "0px 2px 32px rgba(0,0,0,0.05)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 32,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ ...OVERLINE, color: TEXT_PRIMARY }}>{label}</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3, whiteSpace: "nowrap" }}>
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 20, lineHeight: "24px", color: TEXT_PRIMARY }}>{value}</span>
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 10, lineHeight: "12px", letterSpacing: 0.4, color: TEXT_SECONDARY }}>{unit}</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: tone }}>On track</span>
        <div style={{ position: "relative", height: 4, borderRadius: 12, background: "#EDEDED", width: "100%" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${pct}%`,
              borderRadius: 12,
              background: `linear-gradient(to left, ${tone} 6.7%, rgba(255,255,255,1) 117%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/** The goals, two up (1738:13136): trip (magenta) + the phone (slate). */
function GoalsRow({ onTrip, onPhone }: { onTrip: () => void; onPhone: () => void }) {
  return (
    <div style={{ display: "flex", gap: 16, width: "100%" }}>
      <GoalTile label="Trip to Japan" value="₹1.3L" unit="/2L" tone="#D723DB" pct={65} ariaLabel="Trip to Japan details" onOpen={onTrip} />
      {/* blue, not slate (R15) — the paused goal still deserves a colour */}
      <GoalTile label="New phone" value="₹43K" unit="/80K" tone="#0A4BFF" pct={53.8} ariaLabel="New phone goal" onOpen={onPhone} />
    </div>
  );
}

const NETWORTH_ROWS: [string, string][] = [
  ["Fixed deposits", "₹2,70,800"],
  ["Bank account", "₹29,200"],
  ["Mutual funds", "₹1,40,900"],
  ["Stocks", "₹1,14,000"],
];

/** Net worth as rows that close. The "Overview" heading lives in the page stack
    (homeCardEls) so it stays even when this card is toggled off (R18). */
function NetworthBlock({ onOpen }: { onOpen?: () => void }) {
  const base = useCardBase();
  const rows = NETWORTH_ROWS;
  return (
      <div
        role={onOpen ? "button" : undefined}
        tabIndex={onOpen ? 0 : undefined}
        aria-label="Net worth details"
        onClick={onOpen}
        onKeyDown={(e) => onOpen && e.key === "Enter" && onOpen()}
        style={{ ...base, padding: "24px 20px 8px", display: "flex", flexDirection: "column", cursor: onOpen ? "pointer" : "default" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingBottom: 8 }}>
          <span style={{ ...OVERLINE, color: TEXT_PRIMARY }}>Networth</span>
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 20, lineHeight: "24px", color: TEXT_PRIMARY }}>₹5,54,900</span>
        </div>
        {rows.map(([name, amount], i) => (
          <div key={name}>
            {i > 0 && <div style={{ height: 1, width: "100%", background: OUTLINE_SUBTLE }} />}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0" }}>
              <span style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{name}</span>
              <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{amount}</span>
            </div>
          </div>
        ))}
      </div>
  );
}

/** The IMPORTANT card (1680:67208): the alert lives in a card, not in a hero. */
function ImportantCard({ body, options, onChoose, resolvedBody }: {
  body: string;
  options: ActionOption[];
  onChoose: (text: string, index: number) => void;
  resolvedBody?: string | null;
}) {
  const base = useCardBase();
  return (
    <div style={{ ...base, padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: resolvedBody ? 4 : 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ ...OVERLINE, color: resolvedBody ? GREEN_500 : RED_500 }}>{resolvedBody ? "Sorted" : "Important"}</span>
        <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{resolvedBody ?? body}</span>
      </div>
      {!resolvedBody && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {options.map((opt, i) => (
            <div key={opt.text} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {i > 0 && <div style={{ height: 1, marginLeft: 28, background: OUTLINE_SUBTLE }} />}
              <div
                role="button"
                tabIndex={0}
                onClick={() => onChoose(opt.text, i)}
                onKeyDown={(e) => { if (e.key === "Enter") onChoose(opt.text, i); }}
                style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
              >
                <div style={{ position: "relative", width: 16, height: 16, overflow: "hidden", flexShrink: 0 }}>
                  <img
                    src={`/return-exp1/${opt.img}.png`}
                    alt=""
                    style={opt.crop ? { position: "absolute", maxWidth: "none", ...opt.crop } : { width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: TEXT_PRIMARY }}>
                  {opt.text}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// Scheduled bills only — groceries aren't a standing payment (R11). Sum = ₹14,000.
const V2_PAYMENTS: { day: string; name: string; amount: string }[] = [
  { day: "12", name: "Rent", amount: "₹11,000" },
  { day: "18", name: "Electricity", amount: "₹2,351" },
  { day: "25", name: "Netflix", amount: "₹649" },
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

function UpcomingPaymentsCardV2({ onOpen }: { onOpen?: () => void }) {
  const base = useCardBase();
  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      aria-label="Upcoming payments details"
      onClick={onOpen}
      onKeyDown={(e) => onOpen && e.key === "Enter" && onOpen()}
      style={{ ...base, padding: "20px 0 24px", display: "flex", flexDirection: "column", gap: 16, cursor: onOpen ? "pointer" : "default" }}
    >
      <div style={{ padding: "0 24px" }}>
        <V2StackedHeader title="Upcoming payments" sub="3 payments • ₹14,000" />
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

/** SPENDING TREND (1738:13206): overline + a spoken headline, a hairline, the
    two-legend row (This Month in blue, Average in cloud), and the canon curve
    art — blue line riding above the average, a marker at today, dotted day axis. */
function SpendingSpikeCardV2() {
  const base = useCardBase();
  const legendNum: React.CSSProperties = { fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 16, lineHeight: "20px", letterSpacing: 0.32 };
  const legendLabel: React.CSSProperties = { fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24 };
  return (
    <div style={{ ...base, borderRadius: 16, padding: "24px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ ...OVERLINE, color: TEXT_PRIMARY }}>Spending trend</span>
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 16, lineHeight: "20px", letterSpacing: 0.32, color: TEXT_PRIMARY }}>
            This month you&rsquo;re spending more than your average
          </span>
        </div>
        <div style={{ height: 1, width: "100%", background: OUTLINE_SUBTLE }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0A4BFF" }} />
              <span style={{ ...legendLabel, color: "#0A4BFF" }}>This month</span>
            </div>
            <span style={{ ...legendNum, color: "#0A4BFF" }}>₹14.3K</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#A5B6C5" }} />
              <span style={{ ...legendLabel, color: "#A5B6C5" }}>Average</span>
            </div>
            <span style={{ ...legendNum, color: "#A5B6C5" }}>₹6K</span>
          </div>
        </div>
        {/* the canon plot (1738:13213), placed by frame proportion so it rides any
            width — the today marker, the line ends and the "21" all share one
            vertical at 77% */}
        <div style={{ position: "relative", width: "100%", height: 107 }}>
          <img src="/return-exp1/feed/trend-marker.svg" alt="" draggable={false} style={{ position: "absolute", left: "77%", top: 0, height: 62, width: "auto", transform: "translateX(-50%)" }} />
          <img src="/return-exp1/feed/trend-line-b.svg" alt="" draggable={false} style={{ position: "absolute", left: 0, top: 17, width: "77.2%", height: 50 }} />
          <img src="/return-exp1/feed/trend-avg.svg" alt="" draggable={false} style={{ position: "absolute", left: 0, top: 24, width: "100%", height: 43 }} />
          <img src="/return-exp1/feed/trend-line-a.svg" alt="" draggable={false} style={{ position: "absolute", left: 0, top: 26, width: "77.3%", height: 41 }} />
          {/* 10px (canon 8) for legibility, centred on the marker */}
          <img src="/return-exp1/feed/trend-dot-a.svg" alt="" draggable={false} style={{ position: "absolute", left: "77%", top: 12, width: 10, height: 10, transform: "translateX(-50%)" }} />
          <img src="/return-exp1/feed/trend-dot-b.svg" alt="" draggable={false} style={{ position: "absolute", left: "77%", top: 22, width: 10, height: 10, transform: "translateX(-50%)" }} />
          <img src="/return-exp1/feed/trend-axis.svg" alt="" draggable={false} style={{ position: "absolute", left: "1%", right: "3%", top: 82, width: "96%", height: 5 }} />
          <span style={{ ...typography.metadata, color: "#A5B6C5", position: "absolute", left: 0, top: 95 }}>1</span>
          <span style={{ ...typography.metadata, color: "#A5B6C5", position: "absolute", left: "77%", top: 95, transform: "translateX(-50%)" }}>21</span>
          <span style={{ ...typography.metadata, color: "#A5B6C5", position: "absolute", right: 0, top: 95 }}>31</span>
        </div>
      </div>
    </div>
  );
}

// Cashflow card (Figma 1598:58079): a bar per line, then the lines themselves.
// Signed the way the money moves — and the five still close on ₹50,000 income
// (the frame shows four; goals is the fifth so the arithmetic holds).
// Four lines like the frame — spending and goals ride together, and they still
// close: 50,000 − 14,000 − 20,800 = 15,200.
const V2_CASHFLOW_LINES: { name: string; amount: string; value: number; color: string; to: DetailKind }[] = [
  { name: "Income", amount: "₹50,000", value: 50000, color: "#23262A", to: "income" },
  { name: "Upcoming", amount: "-₹14,000", value: 14000, color: V2_MAGENTA, to: "payments" },
  { name: "Spent & invested", amount: "-₹20,800", value: 20800, color: "#DE666C", to: "spends" },
  { name: "Left to spend", amount: "₹15,200", value: 15200, color: "#26B35B", to: "budget" },
];

/** Row chevron — 14px, per the frame's chevron-right. */
function RowChevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <path d="M5.25 3.5L8.75 7L5.25 10.5" stroke={TEXT_TERTIARY} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CashflowListCardV2({ onOpen, onOpenLine }: { onOpen?: () => void; onOpenLine?: (kind: DetailKind) => void }) {
  const base = useCardBase();
  const peak = Math.max(...V2_CASHFLOW_LINES.map((l) => l.value));
  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      aria-label="Cashflow details"
      onClick={onOpen}
      onKeyDown={(e) => onOpen && e.key === "Enter" && onOpen()}
      style={{ ...base, padding: "24px 20px 24px", display: "flex", flexDirection: "column", gap: 24, cursor: onOpen ? "pointer" : "default" }}
    >
      <span style={{ ...OVERLINE, color: TEXT_PRIMARY }}>Cashflow</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* bars: 105 tall, each fading out into the card (frame 1598:58083) */}
        <div style={{ height: 105, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 12px" }}>
          {V2_CASHFLOW_LINES.map((l) => (
            <div
              key={l.name}
              style={{
                width: 34,
                height: 38 + 67 * (l.value / peak),
                borderRadius: "8px 8px 0 0",
                background: `linear-gradient(to bottom, ${l.color}, rgba(255,255,255,0))`,
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {V2_CASHFLOW_LINES.map((l, i) => (
            <div key={l.name} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {i > 0 && <div style={{ height: 1, marginLeft: 16, background: OUTLINE_SUBTLE }} />}
              {/* each line is its own page — the chevron says so (R11) */}
              <div
                role={onOpenLine ? "button" : undefined}
                tabIndex={onOpenLine ? 0 : undefined}
                aria-label={onOpenLine ? `${l.name} details` : undefined}
                onClick={onOpenLine ? (e) => { e.stopPropagation(); onOpenLine(l.to); } : undefined}
                onKeyDown={onOpenLine ? (e) => { if (e.key === "Enter") { e.stopPropagation(); onOpenLine(l.to); } } : undefined}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, cursor: onOpenLine ? "pointer" : "default" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                  <span style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{l.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, whiteSpace: "nowrap" }}>{l.amount}</span>
                  <RowChevron />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// V2 trip page (Figma 1532:51461): one consolidated saver card + other sources.
type V2Month = { label: string; state: "done" | "doneAlt" | "skip" | "due" };
// ₹6,500 a month: nine paid (₹58,500), May skipped, Nov + Dec still to come.
const V2_MONTHS: V2Month[] = [
  { label: "Jan", state: "done" },
  { label: "Feb", state: "done" },
  { label: "Mar", state: "doneAlt" },
  { label: "Apr", state: "done" },
  { label: "May", state: "skip" },
  { label: "Jun", state: "done" },
  { label: "Jul", state: "done" },
  { label: "Aug", state: "doneAlt" },
  { label: "Sep", state: "done" },
  { label: "Oct", state: "done" },
  { label: "Nov", state: "due" },
  { label: "Dec", state: "due" },
];

function V2MonthCell({ m }: { m: V2Month }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      {m.state === "done" || m.state === "doneAlt" ? (
        <img src={`/return-exp1/${m.state === "done" ? "month-done" : "month-done-alt"}.svg`} alt="" style={{ width: 18, height: 18 }} />
      ) : (
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 10,
            background: m.state === "skip" ? V2_PEACH : V2_CELL_GRAY,
            display: "grid",
            placeItems: "center",
          }}
        >
          {m.state === "skip" && <img src="/return-exp1/month-x.svg" alt="" style={{ width: 11, height: 11 }} />}
        </div>
      )}
      {/* Figma uses Figtree Bold 9 here — rendered in Rubik Medium (DLS hard rule) */}
      <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 9, lineHeight: "11px", letterSpacing: 0.4, color: V2_LABEL_GRAY, textTransform: "uppercase" }}>
        {m.label}
      </span>
    </div>
  );
}

// Canonical match of the Savings card (1577:54648): 16 padding, 48 icon,
// Button-Small title row, hairline rails 20 around the month row, sparkle foot.
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
        <img src="/return-exp1/savings-icon.png" alt="" style={{ width: 48, height: 48, borderRadius: 8, border: `0.33px solid ${OUTLINE_SUBTLE}` }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>Daily saver</span>
            <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>₹58,500</span>
          </div>
          <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>Target • ₹1,00,000</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
        <div style={{ height: 1, width: "100%", background: OUTLINE_SUBTLE }} />
        {/* the six most recent instalments — the full year was a wall of dots (R11) */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
          {V2_MONTHS.slice(-6).map((m) => (
            <V2MonthCell key={m.label} m={m} />
          ))}
        </div>
        <div style={{ height: 1, width: "100%", background: OUTLINE_SUBTLE }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: 4 }}>
        <img src="/return-exp1/diamond.svg" alt="" style={{ width: 16, height: 16 }} />
        <span style={{ ...typography.caption, color: V2_FOOT_GRAY }}>₹41,500 to go, on track for May 2027.</span>
      </div>
    </div>
  );
}

// The phone's instalments, in the Japan atom's card language (R13).
const PHONE_MONTHS: V2Month[] = [
  { label: "May", state: "done" },
  { label: "Jun", state: "done" },
  { label: "Jul", state: "skip" },
  { label: "Aug", state: "done" },
  { label: "Sep", state: "done" },
  { label: "Oct", state: "done" },
];

// Same card language as the Daily saver (1577:54648); no sticker asset exists
// for the phone, so the header is the text lockup alone.
function PhoneTrackerCard() {
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
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>Phone fund</span>
          <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>₹43,000</span>
        </div>
        <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>Target • ₹80,000</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
        <div style={{ height: 1, width: "100%", background: OUTLINE_SUBTLE }} />
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
          {PHONE_MONTHS.map((m) => (
            <V2MonthCell key={m.label} m={m} />
          ))}
        </div>
        <div style={{ height: 1, width: "100%", background: OUTLINE_SUBTLE }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: 4 }}>
        <img src="/return-exp1/diamond.svg" alt="" style={{ width: 16, height: 16 }} />
        <span style={{ ...typography.caption, color: V2_FOOT_GRAY }}>₹37,000 to go. July was skipped.</span>
      </div>
    </div>
  );
}

function OtherSourcesCardV2() {
  const base = useCardBase();
  return (
    <div style={{ ...base, padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
      <span style={{ ...OVERLINE, color: TEXT_PRIMARY }}>Other sources</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {([
          ["₹21,500", "considered from family help"],
          ["₹50,000", "considered from mutual funds"],
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

// Budget detail (tap Left to spend): per-category budgets in the same language.
const BUDGET_CATS: { icon: string; name: string; spent: string; cap: string; pct: number; hot?: boolean; note: string }[] = [
  // Spends add to ₹14,300 and caps to ₹29,500 — so "₹15,200 left" is exactly what's
  // left of the budget, and the cashflow's spent/left rows agree with these (R11).
  { icon: "food", name: "Food & drinks", spent: "₹6,200", cap: "₹11,000", pct: 56.4, hot: true, note: "running hot" },
  { icon: "home", name: "Home", spent: "₹1,150", cap: "₹2,500", pct: 46, note: "rent goes out on the 12th" },
  { icon: "flight", name: "Travel", spent: "₹2,300", cap: "₹6,000", pct: 38.3, note: "" },
  { icon: "shopping", name: "Shopping", spent: "₹3,400", cap: "₹7,000", pct: 48.6, note: "" },
  { icon: "tv", name: "Entertainment", spent: "₹1,250", cap: "₹3,000", pct: 41.7, note: "" },
];

function BudgetCategoryCard({ cat }: { cat: (typeof BUDGET_CATS)[number] }) {
  const base = useCardBase();
  const left = parseInt(cat.cap.replace(/[^0-9]/g, ""), 10) - parseInt(cat.spent.replace(/[^0-9]/g, ""), 10);
  const tone = cat.hot ? ORANGE_500 : GREEN_500;
  return (
    <div style={{ ...base, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: BG_SECONDARY, display: "grid", placeItems: "center", flexShrink: 0 }}>
          <div
            style={{
              width: 20,
              height: 20,
              backgroundColor: TEXT_SECONDARY,
              WebkitMaskImage: `url(/return-exp1/icons/${cat.icon}.svg)`,
              maskImage: `url(/return-exp1/icons/${cat.icon}.svg)`,
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ ...OVERLINE, color: TEXT_PRIMARY }}>{cat.name}</span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, whiteSpace: "nowrap" }}>
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 20, lineHeight: "24px", color: TEXT_PRIMARY }}>
            ₹{left.toLocaleString("en-IN")}
          </span>
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 10, lineHeight: "12px", color: TEXT_SECONDARY }}>
            left of {cat.cap}
          </span>
        </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ position: "relative", height: 2, borderRadius: 12, background: "#EDEDED", width: "100%" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${cat.pct}%`,
              borderRadius: 12,
              background: `linear-gradient(to left, ${tone} 6.7%, rgba(255,255,255,1) 117%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Payments detail (tap 3 Upcoming payments): one card per payment.
const PAYMENT_DETAILS: { day: string; name: string; amount: string; note: string }[] = [
  { day: "12", name: "Rent", amount: "₹11,000", note: "autopay is on, goes out in the morning" },
  { day: "18", name: "Electricity", amount: "₹2,351", note: "usually lands within ₹200 of this" },
  { day: "25", name: "Netflix", amount: "₹649", note: "family plan, cancel anytime from subscriptions" },
];

function PaymentDetailCard({ pmt }: { pmt: (typeof PAYMENT_DETAILS)[number] }) {
  const base = useCardBase();
  return (
    <div style={{ ...base, padding: "20px 20px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <CalendarTile day={pmt.day} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{pmt.name}</span>
            <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{pmt.amount}</span>
          </div>
          <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>due {pmt.day} Oct</span>
        </div>
      </div>
      <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>{pmt.note}</span>
    </div>
  );
}

// Cashflow detail (tap Cashflow): inflows and outflows as their own cards.
const CASHFLOW_FLOWS: { title: string; total: string; rows: [string, string][] }[] = [
  { title: "Inflows", total: "₹50,000", rows: [["Salary", "₹48,800"], ["Amazon refund", "₹1,200"]] },
  { title: "Outflows", total: "₹34,800", rows: [["Spent this month", "₹14,300"], ["Into Goals", "₹6,500"], ["Upcoming, reserved", "₹14,000"]] },
];

const INCOME_FLOWS: { title: string; total: string; rows: [string, string][] }[] = [
  { title: "This month", total: "₹50,000", rows: [["Salary, 1 Oct", "₹48,800"], ["Amazon refund, 4 Oct", "₹1,200"]] },
  { title: "Last month", total: "₹48,800", rows: [["Salary, 1 Sep", "₹48,800"]] },
];

const SPEND_FLOWS: { title: string; total: string; rows: [string, string][] }[] = [
  {
    title: "Spent",
    total: "₹14,300",
    rows: [["Food & drinks", "₹6,200"], ["Shopping", "₹3,400"], ["Travel", "₹2,300"], ["Entertainment", "₹1,250"], ["Home", "₹1,150"]],
  },
  { title: "Invested", total: "₹6,500", rows: [["Japan atom, Oct instalment", "₹6,500"]] },
];

function FlowCard({ flow }: { flow: (typeof CASHFLOW_FLOWS)[number] }) {
  const base = useCardBase();
  return (
    <div style={{ ...base, padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ ...OVERLINE, color: TEXT_PRIMARY }}>{flow.title}</span>
        <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>{flow.total}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {flow.rows.map(([name, amount], i) => (
          <div key={name} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {i > 0 && <div style={{ height: 1, width: "100%", background: OUTLINE_SUBTLE }} />}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{name}</span>
              <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{amount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Widget catalogue (kebab → customise sheet) ───────────────────────────────


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

type WidgetId = "trip" | "spend" | "networth" | "cashflow" | "bills" | "subs" | "spendChart";
const WIDGET_META: { id: WidgetId; label: string; default: boolean }[] = [
  { id: "spend", label: "Budget", default: true },
  { id: "trip", label: "Goals", default: true },
  { id: "networth", label: "Net worth", default: true },
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
        <ChromeChip flip={1} ariaLabel="Back" onClick={onClose}>
          {(color) => <ChevronIcon color={color} />}
        </ChromeChip>
        <div style={{ position: "absolute", left: 56, right: 56, textAlign: "center", pointerEvents: "none" }}>
          <span style={{ ...typography.headerH4, color: TEXT_PRIMARY }}>Customise widgets</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: `8px ${PAGE_PADDING}px 0` }}>
        <p style={{ ...typography.caption, color: TEXT_SECONDARY, margin: "0 0 12px" }}>Drag to reorder. Toggles hide a widget without losing its spot</p>
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
    "Food and drinks tops the list at ₹6,200, then shopping at ₹3,400. Rent is the big one still to go, ₹11,000 on the 12th.",
  "My top spending categories?":
    "Food and drinks, shopping, then travel. Together they're 83% of the ₹14,300 you've spent this month.",
  "What your spending says about me?":
    "Steady on essentials, splurgy on weekends. Your savings rate says the steady side is winning.",
  "How's the new phone goal?":
    "₹43,000 of ₹80,000 saved, so 54% there. It's paused this month and Japan gets the room. Say the word and I'll resume it.",
  // the "show me" options: each one answers its own page
  "Show me where I overspent":
    "It wasn't the month, it was the trip. Two flight add-ons in July and August came to ₹9,000, and May's ₹6,500 instalment never went in. That's your ₹15,000.",
  "Show me what I missed":
    "May's ₹6,500 instalment. Everything since has gone in on time, including October's.",
  "Show me the food spends":
    "₹6,200 across 18 orders, and 11 of those were delivery. Weekends account for ₹3,900 of it.",
  "Show me what's due":
    "Rent ₹11,000 on the 12th, electricity ₹2,351 on the 18th, Netflix ₹649 on the 25th. ₹14,000 in all, and your balance covers it.",
  "Show me where it went":
    "₹14,300 spent, ₹6,500 into the Japan pot and ₹14,000 reserved for the bills. That leaves ₹15,200 to spend.",
  "Show me last month":
    "September brought in the same ₹48,800 salary and you spent ₹30,800 of it. This month is running ₹7,400 lighter so far.",
};

// Only used for things cosimo has no canned answer for, so they stay honest about
// that rather than inventing a number.
const REPLIES = [
  "Let me pull that together from your last few months.",
  "Noted. I'll keep an eye on it and tell you when it moves.",
  "Nothing in this month's numbers says that's a problem yet.",
  "I don't have that one to hand. Ask me about the trip, your spending or what's due.",
];

type Turn = { id: number; role: "user" | "cosimo"; text: string; options?: ActionOption[] };

/** The detail slot renders one of these, all in the same shell. */
type DetailKind = "trip" | "budget" | "payments" | "cashflow" | "income" | "spends" | "networth" | "phone";

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
  return <p style={{ ...typography.bodySmall, lineHeight: "22px", color: TEXT_PRIMARY, margin: 0, whiteSpace: "pre-wrap" }}>{shown}</p>;
}

/** Time-based rAF typewriter — a steady ~52 chars/sec, no chunk jitter (R10). */


/** Top-to-bottom entrance: fades/rises in with a per-row delay when its page
    becomes active; resets instantly (pre-positioned) when the page leaves.
    index 0 is the hero copy; everything below it (pill, cards) starts at 1, so the
    reader always gets the words before the cards arrive. Every arrival plays this
    same entrance — one transition, always (R11). */
function Stagger({ index, active, children }: { index: number; active: boolean; children: React.ReactNode }) {
  const delay = 90 + index * 55;
  return (
    <div
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(16px)",
        transition: active
          ? `opacity 360ms ${GENTLE} ${delay}ms, transform 520ms ${GENTLE} ${delay}ms`
          : "none",
      }}
    >
      {children}
    </div>
  );
}

// ── Page content declarations ────────────────────────────────────────────────

type PageId = "home" | "trip";


// ─────────────────────────────────────────────────────────────────────────────

export default function ReturnExp1Sim({ onExitHome }: { onExitHome?: () => void } = {}) {
  const isMobile = useIsMobileProto();
  const frameRef = useRef<HTMLDivElement>(null);
  const scrollerRefs = useRef<Record<PageId, HTMLDivElement | null>>({ home: null, trip: null });
  const welcomeRefs = useRef<Record<PageId, HTMLDivElement | null>>({ home: null, trip: null });
  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const [frame, setFrame] = useState({ w: 360, h: 780 });
  const [welcomeHs, setWelcomeHs] = useState<Record<PageId, number>>({ home: 0, trip: 92 });
  // Scroll lives in a ref — scrolling must never re-render the tree (mobile jank).
  // The overlay pill's rest endpoint is FROZEN into state at each morph start.
  const scrollYRef = useRef<Record<PageId, number>>({ home: 0, trip: 0 });
  const [restRect, setRestRect] = useState({ top: 260, left: PILL_MARGIN, w: 320, h: PILL_REST_HEIGHT });
  const [page, setPage] = useState<PageId>("home");
  const pageRef = useRef<PageId>("home");
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  // R12 (Figma 1680:67178): V2 paper + the bottom bar ARE the experiment. The theme,
  // placement and bar-insight variants are gone from the debug panel.
  const paper = true;
  const bottomAsk = true;
  const barInsight = false;
  const [billsRaw] = useProtoFlag("returnExp1Bills");
  const showBills = billsRaw === "on"; // home skips the payments card unless asked
  const [chartRaw] = useProtoFlag("returnExp1Chart");
  const showChart = chartRaw === "on"; // same for the spending chart
  const [headerRaw] = useProtoFlag("returnExp1Header");
  // "action": the hero asks something and offers a few prompts (Figma 1577:54844)
  const headerAction = headerRaw === "action";
  const pillH = PILL_REST_HEIGHT; // the canonical input is 57 tall (1697:70729)

  const [navMoving, setNavMoving] = useState(false);
  const [full, setFull] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // The detail slot renders one of two pages (same shell): trip or budget.
  const [detailKind, setDetailKind] = useState<DetailKind>("trip");
  const detailKindRef = useRef<DetailKind>("trip");
  useEffect(() => {
    detailKindRef.current = detailKind;
  }, [detailKind]);

  // The insight "generates" on every arrival: beat → dissolve in → done, and the
  // page orchestrates top-to-bottom around it. ONE machine, owned by whichever page
  // is showing, and the arrival alone decides its state — an earlier per-page pair
  // reset itself in cleanup, and a cleanup landing after the arrival timer left the
  // page stuck at "shimmer" (invisible cards, glitchy return trip).
  // What the last chosen action did. It lands on the header only once the chat is
  // closed: text you're reading never rewrites itself, but coming back to the page
  // shows where things stand now (R11).
  const [actionTaken, setActionTaken] = useState<null | "done" | "self">(null);
  // Held back until the chat closes — the header must not rewrite while you're
  // reading it — and kept from then on, so reopening never flashes the old alert.
  const [settledAction, setSettledAction] = useState<null | "done" | "self">(null);
  // actionTaken is part of the key: coming back to a page whose insight has changed
  // should read as cosimo saying something new, not as the old line silently
  // swapping for another one (R11)
  const pageKey = `${page === "home" ? "home" : `trip:${detailKind}`}:${settledAction ?? ""}`;

  useEffect(() => {
    if (full || !actionTaken) return;
    const t = window.setTimeout(() => setSettledAction(actionTaken), 0);
    return () => window.clearTimeout(t);
  }, [full, actionTaken]);
  const [gen, setGen] = useState<{ key: string; phase: "shimmer" | "type" | "done" }>(
    { key: "home", phase: "shimmer" },
  );
  useEffect(() => {
    const beat = window.setTimeout(() => setGen({ key: pageKey, phase: "shimmer" }), 0);
    // R12: no page carries an insight paragraph anymore — the machine only paces
    // the arrival cascade (a 260ms beat, then everything cues).
    const type = window.setTimeout(() => setGen({ key: pageKey, phase: "done" }), 260);
    return () => { window.clearTimeout(beat); window.clearTimeout(type); };
  }, [pageKey, page]);
  // The arrival effect commits the new key one frame in — which is exactly the
  // beat the chrome should fade back on, so it leads the cascade for free.
  const chromeIn = gen.key === pageKey;
  const genPhase = gen.key === pageKey ? gen.phase : "shimmer";

  const f = useSpringValue(full ? 1 : 0, 250, 28);
  const s = useSpringValue(sheetOpen ? 1 : 0, 300, 30);

  // Widgets — order drives the home stack; `widgets` is the on/off map.
  const [widgets, setWidgets] = useState<Record<WidgetId, boolean>>({ trip: true, spend: true, networth: false, cashflow: true, bills: false, subs: false, spendChart: true });
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(["spend", "trip", "networth", "spendChart", "cashflow"]);
  // The 1738:13113 feed (R15): budget gauge, goal tiles, then Overview = networth,
  // spending trend, cashflow. The payments card is off unless the debug panel
  // asks for it. Either way, customising widgets by hand wins from then on.
  const widgetsTouched = useRef(false);
  useEffect(() => {
    if (widgetsTouched.current) return;
    setWidgets((w) => {
      const next = { ...w, bills: showBills, spendChart: showChart };
      return next.bills === w.bills && next.spendChart === w.spendChart ? w : next;
    });
    setWidgetOrder([
      "spend",
      "trip",
      ...(showBills ? (["bills"] as WidgetId[]) : []),
      "networth",
      ...(showChart ? (["spendChart"] as WidgetId[]) : []),
      "cashflow",
    ] as WidgetId[]);
  }, [showBills, showChart]);

  // Chat
  const [turns, setTurns] = useState<Turn[]>([]);
  // The rows leave the page once an action is taken; the hero has to re-measure when
  // they do, or it keeps holding the space they used (R11).
  const actionRowsShown = page === "trip" && headerAction && settledAction !== "self" && turns.length === 0;
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
  const heroPadTop = chromeH + (paper ? 0 : 16); // the hero header starts flush under the app bar (R13)
  const kbSpace = isMobile ? 20 + safeBottom : MOCK_KEYBOARD_HEIGHT + KEYBOARD_GAP;
  const bottomPillTop = frame.h - (isMobile ? 16 + safeBottom : 24) - pillH;
  // Bottom-bar chat is a real chat bar: the input KEEPS its spot at the very
  // bottom (no mock keyboard) and the thread grows above it (R11).
  const fullInputTop = bottomAsk ? bottomPillTop : frame.h - kbSpace - pillH;
  // ONE hero geometry for every page (max copy height wins): identical pill
  // position and hero edge everywhere, so page crossfades never double-image.
  // The hero HUGS its own copy on every page (R11) — a unified max height left
  // short pages with dead air above the fold. Per-page geometry, so the pill and
  // the hero edge sit right under whatever that page says.
  const inputRestTops = {
    home: heroPadTop + welcomeHs.home + 32,
    trip: heroPadTop + welcomeHs.trip + 32,
  };
  const inputRestTop = inputRestTops[page];
  const heroPb = paper ? 8 : 24; // v2: tighter below the pill (R7)
  const heroRestFor = (pid: PageId) =>
    pid === "home" ? chromeH + 4 : heroPadTop + welcomeHs[pid] + heroPb;

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
    // the copy blocks too: any size change in the hero copy (outcome text landing,
    // action rows leaving, different wrapping) re-measures on its own
    (Object.values(welcomeRefs.current) as (HTMLDivElement | null)[]).forEach((w) => {
      if (w) ro.observe(w);
    });
    return () => ro.disconnect();
  }, [measure]);

  // Theme switches change the hero copy's height (v2 trip adds a progress bar),
  // and the TRIP page only mounts on first navigation — its copy measured as the
  // default until then, leaving the pill on top of the text (R7). Re-measure
  // whenever the mounted content can have changed.
  useEffect(() => {
    // straight away (the DOM has committed), and again next frame for anything that
    // settles late — waiting only on rAF left the hero holding space that had gone
    measure();
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
    // actionTaken/full change the insight TEXT (the outcome replaces the ask), and a
    // shorter or longer insight moves the hero's edge — measure again or the cards
    // end up sitting over the copy (R11)
  }, [paper, page, detailKind, headerAction, barInsight, bottomAsk, actionRowsShown, settledAction, full, measure]);

  // ── Snap dock (R3): an early trigger, then the scroller SNAPS past the hero
  // while the pill springs into the app bar — one coordinated gesture, not a
  // late morph. Programmatic snaps are flagged so they can't re-trigger.
  // Buttery scroll (R9): NOTHING re-renders and nothing is hijacked while the
  // user scrolls. The pill is CSS position:sticky (compositor-only), and the
  // chrome flip (bar whitening, veil, gradient fade, glyph crossfades) rides a
  // single CSS variable written straight to the DOM from the scroll listener.
  const scrollVarRef = useRef(0);
  const writeScrollVar = useCallback((t: number) => {
    const clamped = Math.max(0, Math.min(1, t));
    if (Math.abs(clamped - scrollVarRef.current) < 0.004 && clamped !== 0 && clamped !== 1) return;
    scrollVarRef.current = clamped;
    frameRef.current?.style.setProperty("--re1-t", clamped.toFixed(3));
  }, []);
  const makeScrollHandler = useCallback(
    (pid: PageId) => () => {
      const el = scrollerRefs.current[pid];
      if (!el) return;
      const y = el.scrollTop;
      scrollYRef.current[pid] = y; // ref only — no re-render per scroll frame
      if (pid !== pageRef.current || full) return;
      if (bottomAsk) {
        // No dock morph — the bar just washes in over the first stretch of scroll.
        writeScrollVar((y - 8) / 88);
        return;
      }
      // The morph completes ~40px BEFORE the pill pins in the bar, so it arrives
      // already at dock size and never clips the chips.
      // Short heroes used to put the morph's start BEHIND scroll 0, so the pill sat
      // half-docked (a small pill) before you'd scrolled at all (R11).
      const engage = inputRestTops[pid] - (statusH + 8 - (pillH - 48) / 2);
      const start = Math.max(0, engage - 128);
      writeScrollVar((y - start) / 88);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [writeScrollVar, welcomeHs, full, statusH, pillH, bottomAsk],
  );

  // ── Page navigation: destination opens at its top; the outgoing page just
  // freezes and fades. The scroll-flip var resets with the new page. ──
  const goToPage = useCallback((next: PageId) => {
    if (next === pageRef.current) return;
    const destEl = scrollerRefs.current[next];
    if (destEl) destEl.scrollTop = 0;
    scrollYRef.current[next] = 0;
    writeScrollVar(0);
    setNavMoving(true);
    setPage(next);
  }, [writeScrollVar]);

  // Settle beat: tidy the hidden page once the fade/reveal has played out.
  const settleTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!navMoving) return;
    settleTimer.current = window.setTimeout(() => {
      const other: PageId = page === "trip" ? "home" : "trip";
      const otherEl = scrollerRefs.current[other];
      if (otherEl) {
        otherEl.scrollTop = 0; // invisible by now — free
        scrollYRef.current[other] = 0;
      }
      setRestRect({ top: inputRestTop, left: PILL_MARGIN, w: frame.w - PILL_MARGIN * 2, h: pillH });
      setNavMoving(false);
    }, 820);
    return () => { if (settleTimer.current) window.clearTimeout(settleTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navMoving, page, welcomeHs]);

  // ── Fullscreen open/close ──
  const scrollHomeRaf = useRef(0);
  const openFull = useCallback(() => {
    const pid = pageRef.current;
    // Launch the morph from the pill's CURRENT scrubbed geometry — natural, mid-
    // shrink, or fully docked in the bar. The page springs home under it.
    if (bottomAsk) {
      // The bar keeps its thread: reopening continues the same conversation (R11).
      setRestRect({ top: bottomPillTop, left: BAR_MARGIN, w: frame.w - BAR_MARGIN * 2, h: pillH });
      // "1 action required" — opening the chat opens it ON that action: cosimo
      // states it and offers the same ways out the hero would have (R11).
      if (barInsight && headerAction) {
        const pageAction = ACTION_STATES[pageRef.current === "home" ? "home" : detailKindRef.current] ?? ACTION_STATES.home;
        setTurns((t) => (t.length > 0 ? t : [{ id: ++seqRef.current, role: "cosimo", text: pageAction.body, options: pageAction.options }]));
      }
    } else {
      const tNow = scrollVarRef.current;
      const dockW = 146; // label ends ~24 from the right edge (R9)
      const natural = Math.max(statusH + 8 - (pillH - 48) / 2, inputRestTops[pid] - (scrollYRef.current[pid] ?? 0));
      setRestRect({
        top: natural + (tNow * (pillH - 48)) / 2,
        left: lerp(PILL_MARGIN, (frame.w - dockW) / 2, tNow),
        w: lerp(frame.w - PILL_MARGIN * 2, dockW, tNow),
        h: lerp(pillH, 48, tNow),
      });
    }
    setFull(true);
    const el = scrollerRefs.current[pid];
    if (!el) return;
    cancelAnimationFrame(scrollHomeRaf.current);
    const start = el.scrollTop;
    if (start <= 0) {
      writeScrollVar(0);
      return;
    }
    const t0 = performance.now();
    // The dock variable rides home WITH the scroller. The scroll handler is inert
    // while the chat is open, so leaving the var behind meant collapsing back onto a
    // still-docked (small) pill even though the page was at the top (R11).
    const tStart = scrollVarRef.current;
    const step = (now: number) => {
      const t = Math.min((now - t0) / 420, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.scrollTop = start * (1 - eased);
      writeScrollVar(tStart * (1 - eased));
      if (t < 1) scrollHomeRaf.current = requestAnimationFrame(step);
    };
    scrollHomeRaf.current = requestAnimationFrame(step);
    // barInsight/headerAction matter: only that variant seeds the chat with the
    // action, and flipping placements live must not leave a stale closure behind
    // (it seeded a cosimo line that then repeated the header, R11)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [welcomeHs, bottomAsk, barInsight, headerAction, writeScrollVar]);
  useEffect(() => () => cancelAnimationFrame(scrollHomeRaf.current), []);

  const closeFull = useCallback(() => {
    // The collapse lands on the hero pill at scroll 0 (openFull sprung it home) —
    // or back onto the chat bar when the ask lives at the bottom.
    setRestRect(bottomAsk
      ? { top: bottomPillTop, left: BAR_MARGIN, w: frame.w - BAR_MARGIN * 2, h: pillH }
      : { top: inputRestTops[pageRef.current], left: PILL_MARGIN, w: frame.w - PILL_MARGIN * 2, h: pillH });
    // The chat sprang the page home when it opened, but if that rAF never ran (a
    // backgrounded tab, an interrupted open) the scroll var would still say "docked"
    // and the pill would hand back small. Guarantee both here (R11).
    const el = scrollerRefs.current[pageRef.current];
    if (el) el.scrollTop = 0;
    scrollYRef.current[pageRef.current] = 0;
    writeScrollVar(0);
    setFull(false);
    inputRef.current?.blur();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [welcomeHs, bottomAsk, writeScrollVar]);

  // Focus the input once the expansion has mostly landed — desktop only. On
  // mobile the real keyboard would burst up mid-spring; the user taps to type.
  useEffect(() => {
    if (!full || isMobile) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 380);
    return () => window.clearTimeout(t);
  }, [full, isMobile]);

  // ── Chat ──
  // Set when an action is picked: the next reply is the outcome of THAT choice
  // rather than a line from the pool. Text already on screen never rewrites itself.
  const pendingReply = useRef<string | null>(null);
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
      const reply = pendingReply.current ?? ANSWERS[text] ?? REPLIES[replyIdxRef.current++ % REPLIES.length];
      pendingReply.current = null;
      setTurns((t) => [...t, { id: ++seqRef.current, role: "cosimo", text: reply }]);
    }, 900);
  }, [thinking]);
  useEffect(() => () => { if (replyTimer.current) window.clearTimeout(replyTimer.current); }, []);

  /** Wipes the thread — the chat's New chat chip. */
  const startNewChat = useCallback(() => {
    if (replyTimer.current) window.clearTimeout(replyTimer.current);
    setThinking(false);
    setTurns([]);
    setDraft("");
  }, []);

  /** Picking one of the hero's actions sends it; cosimo answers with the outcome. */
  const chooseAction = useCallback((text: string, index: number) => {
    const state = ACTION_STATES[pageRef.current === "home" ? "home" : detailKindRef.current] ?? ACTION_STATES.home;
    pendingReply.current =
      index === 0 ? `Done. ${state.done}` : index === 1 ? SELF_REPLY : null;
    if (index === 0) setActionTaken("done");
    else if (index === 1) setActionTaken("self");
    openFull();
    send(text);
  }, [openFull, send]);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, thinking]);

  // Continuing a chat opens ON the conversation: the header is up there at the top
  // of the thread, but you land at the latest message, not back at the heading (R11).
  useEffect(() => {
    if (!full || turns.length === 0) return;
    const id = requestAnimationFrame(() => {
      const el = threadRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(id);
  }, [full, turns.length]);

  // ── Interpolations ── (scroll-driven chrome now lives in the --re1-t CSS var)

  // The chat is a white surface — the purple has no business being there, so it
  // leaves over the first third of the expansion rather than riding it most of the
  // way up. textFlip is the same ramp inverted, and MUST stay locked to it: the
  // hero copy is white-on-purple and has to become dark exactly as the surface whitens.
  const whiten = clamp01(f / 0.32);
  const gradF = paper ? 0 : 1 - whiten;
  const textFlip = paper ? 1 : whiten;
  // Thread appears only near full-open and is GONE before the hero starts moving
  // much on collapse — kills the mid-flight overlap jerk (R5).
  // Opening onto an ONGOING chat is a relay, not a crossfade: the cards leave first,
  // the hero copy slides down and goes with them, and only then does the thread come
  // in. Overlapping all three read as a muddy dissolve (R11).
  const chatStage = turns.length > 0 ? clamp01((f - 0.5) / 0.5) : 0; // the thread's own ramp
  // The heading and insight are the page's header: they hold their place when the
  // chat opens and the thread runs underneath them. In bottom+insight they don't —
  // there the chat owns the whole screen and scrolls on its own (R11).
  // Empty chat: the page's heading, insight and actions stay put — they ARE the
  // empty state, and the action rows are tappable right there. The moment a thread
  // exists they leave, on exactly the cards' ramp and distance (R11).
  const chatMul = turns.length === 0 ? 1 : 1 - clamp01(f / 0.35);
  // the thread (header included) arrives as the page's own copy leaves
  const chatIn = clamp01((f - 0.2) / 0.3);
  const sugF = clamp01((f - 0.55) / 0.45);

  // The chat morph pill: launch spot (frozen at open) → fullscreen input.
  const chatMargin = bottomAsk ? BAR_MARGIN : CHAT_PILL_MARGIN;
  const fullPillRect = { left: chatMargin, top: fullInputTop, w: frame.w - chatMargin * 2, h: pillH };
  const pill = {
    left: lerp(restRect.left, fullPillRect.left, f),
    top: lerp(restRect.top, fullPillRect.top, f),
    w: lerp(restRect.w, fullPillRect.w, f),
    h: lerp(restRect.h, fullPillRect.h, f),
  };
  const pillLabelLeft = 24; // R15: no leading orb — the label sits at the pill's padding
  // The pill's contents crossfade in place: rest label + orb leave over the first
  // quarter of the expansion, the live input arrives after them.
  // the overlay must hand off from whatever the bar was saying
  const askLabel = bottomAsk && turns.length > 0 ? "Continue your chat" : "Ask cosimo";
  // the action rows occupy the beats right under the copy; the pill and cards follow
  const actionKey = page === "home" ? "home" : detailKind;
  const actionBase = ACTION_STATES[actionKey] ?? ACTION_STATES.home;
  const outcome = settledAction === "done" ? { title: actionBase.doneTitle, body: actionBase.done } : null;
  const action = outcome ? { ...actionBase, title: outcome.title, body: outcome.body } : actionBase;
  // the alert owns the header until it's resolved or waved off
  const alertOn = headerAction && !barInsight && settledAction !== "self";
  const rowsBelow = actionRowsShown ? 1 + action.options.length : 1;
  const restFade = clamp01(1 - f / 0.25);
  const inputFade = clamp01((f - 0.35) / 0.4);
  const whiteTextOp = Math.max(0, 1 - textFlip);

  // The overlay pill exists only for the chat morph — scrolling is pure CSS sticky.
  const morphActive = full || f > 0.01;

  const pushTrip = useCallback(() => {
    setDetailKind("trip");
    goToPage("trip");
  }, [goToPage]);
  const pushBudget = useCallback(() => {
    setDetailKind("budget");
    goToPage("trip");
  }, [goToPage]);
  const pushPayments = useCallback(() => {
    setDetailKind("payments");
    goToPage("trip");
  }, [goToPage]);
  // every cashflow line opens its own page, same shell as the rest
  const pushDetail = useCallback((kind: DetailKind) => {
    setDetailKind(kind);
    goToPage("trip");
  }, [goToPage]);
  const askPhone = useCallback(() => pushDetail("phone"), [pushDetail]);

  // Memoized card stacks: stable element identity lets React bail out of the
  // whole card subtree on every spring frame (mobile perf).
  const tripCardEls = useMemo(() => {
    if (detailKind === "payments") return PAYMENT_DETAILS.map((pmt) => <PaymentDetailCard key={pmt.name} pmt={pmt} />);
    if (detailKind === "cashflow") return CASHFLOW_FLOWS.map((flow) => <FlowCard key={flow.title} flow={flow} />);
    if (detailKind === "income") return INCOME_FLOWS.map((flow) => <FlowCard key={flow.title} flow={flow} />);
    if (detailKind === "spends") return SPEND_FLOWS.map((flow) => <FlowCard key={flow.title} flow={flow} />);
    if (detailKind === "networth")
      return NETWORTH_ROWS.map(([name, amount]) => (
        <div
          key={name}
          style={{ background: BG_CARD, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: 12, boxShadow: "var(--re1-card-shadow, none)", padding: 20, display: "flex", flexDirection: "column", gap: 6 }}
        >
          <span style={{ ...OVERLINE, color: TEXT_PRIMARY }}>{name}</span>
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 20, lineHeight: "24px", color: TEXT_PRIMARY }}>{amount}</span>
        </div>
      ));
    // the tracker alone — "The plan" rows card was removed (R13)
    if (detailKind === "phone") return [<PhoneTrackerCard key="tracker" />];
    if (detailKind === "budget")
      // R15: the gauge is the page HEADER (see the hero render) — the stack is the
      // SPENDING TREND card (1738:13524), then the categories.
      return [
        <SpendingSpikeCardV2 key="trend" />,
        ...BUDGET_CATS.map((cat) => <BudgetCategoryCard key={cat.name} cat={cat} />),
      ];
    return [<DailySaverCardV2 key="saver" />, <OtherSourcesCardV2 key="sources" />];
  }, [detailKind]);
  const homeCardEls = useMemo(() => {
    const byId: Record<WidgetId, React.ReactNode> = {
      spend: <BudgetHeroCard key="spend" onOpen={pushBudget} />,
      trip: <GoalsRow key="trip" onTrip={pushTrip} onPhone={askPhone} />,
      networth: <NetworthBlock key="networth" onOpen={() => pushDetail("networth")} />,
      cashflow: <CashflowListCardV2 key="cashflow" onOpenLine={pushDetail} />,
      bills: <UpcomingPaymentsCardV2 key="bills" onOpen={pushPayments} />,
      subs: <SubscriptionsCard key="subs" />,
      spendChart: <SpendingSpikeCardV2 key="spendChart" />,
    };
    const list = widgetOrder.filter((id) => widgets[id]);
    // "Overview" heads the section below the goal tiles and stays put whichever of
    // its widgets (networth, trend, cashflow…) are on — it used to live inside the
    // networth card and vanished with it (R18).
    const firstOverview = list.find((id) => id !== "spend" && id !== "trip");
    return list.flatMap((id) =>
      id === firstOverview
        ? [
            <span key="overview-heading" style={{ ...typography.headerH4, color: TEXT_PRIMARY, padding: "16px 0 4px 8px" }}>
              Overview
            </span>,
            byId[id],
          ]
        : [byId[id]]
    );
  }, [widgetOrder, widgets, pushTrip, pushBudget, pushPayments, pushDetail, askPhone]);

  const popTrip = useCallback(() => goToPage("home"), [goToPage]);
  // On home the chevron exits the feed when a host wired it (the pitch persona
  // returns to the Valentino Pay screen, R17); standalone it stays inert.
  const onChevron = full ? closeFull : page === "trip" ? popTrip : onExitHome;


  // ── One page: gradient hero (in flow) + cards; heroes grow over the frame in fullscreen ──
  const renderPage = (pid: PageId) => {
    const isActivePage = page === pid;
    const active = isActivePage ? 1 : 0;
    // "Hero holds" (chosen 2026-08-13 over a rigid full-width push and a soft drift):
    // the hero never translates, so it reads as ONE persistent surface while the card
    // stacks push through it — forward the incoming cards arrive from the RIGHT and the
    // outgoing leave LEFT, reversing for free because g runs 1 → 0 on the way back.

    // Both pages share the hero silhouette, so heights blend and its bottom edge glides
    // instead of popping between page heights (R5).
    const heroRest = heroRestFor(pid);
    const heroH = heroRest;
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
          // No rubber-band at the top of the feed (R19) — the page starts firm.
          overscrollBehaviorY: "none",
          scrollbarWidth: "none",
          // The 1738 feed grounds HOME on a soft grey so the white cards read as
          // cards (R15); internal pages stay white.
          background: pid === "home" ? "#F3F5F6" : undefined,
          // The incoming page's SURFACE lands opaque at once and its children
          // orchestrate on top of it; only the outgoing page fades. Cross-fading both
          // left a window where each was semi-transparent and the grey page colour
          // showed through the white hero — the background flicker on page load (R11).
          opacity: active,
          transition: isActivePage ? "none" : `opacity 200ms ${GENTLE}`,
          zIndex: pid === "trip" ? 6 : 4,
          pointerEvents: active > 0.5 && !navMoving ? "auto" : "none",
        }}
      >
        {/* Sticky chrome wash — whitens with the scroll var; sticky so the pill
            (also sticky, higher z) pins ABOVE it inside one stacking context. */}
        <div
          aria-hidden
          style={{
            position: "sticky",
            top: 0,
            height: chromeH,
            marginBottom: -chromeH,
            zIndex: 10,
            background: BG_PRIMARY,
            opacity: "calc(var(--re1-t, 0) * 0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            WebkitMaskImage: "linear-gradient(to bottom, black calc(100% - 20px), transparent)",
            maskImage: "linear-gradient(to bottom, black calc(100% - 20px), transparent)",
            pointerEvents: "none",
          }}
        />

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
              opacity: `calc(${gradF} * (1 - var(--re1-t, 0)))`,
              background: `${VALENTINO_500} url(/return-exp1/gradient-v21.png) top/cover no-repeat`,
            }}
          />
          {paper && !barInsight && (
            <div
              aria-hidden
              // The hero's white keeps ALL of it — heading, insight and pill — on
              // pure white, and hangs its softening into the grey 72px BELOW the hero
              // edge, over the top of the cards (R11). Closes up in chat.
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: -(1 - f) * 72,
                background: `linear-gradient(to bottom, ${BG_CARD} calc(100% - ${(1 - f) * 72}px), rgba(255,255,255,0))`,
              }}
            />
          )}
          {/* Hero copy — detail pages only: home is the dashboard, its identity
              lives in the app bar (R12, Figma 1680:67178) */}
          {pid === "trip" && (
          <div
            ref={(el) => { welcomeRefs.current[pid] = el; }}
            style={{
              position: "absolute",
              top: heroPadTop,
              // 24, like the cards below (R12)
              left: PAGE_GUTTER,
              right: PAGE_GUTTER,
              // above the chat surface: this copy IS the empty chat's header — the
              // surface (z-auto, later in DOM) was painting over it (R12)
              zIndex: 9,
              // stays for an empty chat (it IS the empty state), leaves with the
              // cards once a thread exists — same ramp, same distance (R11)
              opacity: chatMul,
              transform: `translateY(${(turns.length > 0 ? f : 0) * 24}px)`,
            }}
          >
          <Stagger index={0} active={isActivePage}>
            {(() => {
              // the internal hero speaks the 1705 language: label · month centred,
              // the number huge, the working line in magenta, a thick bar
              // goals aren't monthly things — their heroes drop the month tag (R13)
              const hero =
                detailKind === "trip"
                  ? { label: "Trip to Japan", value: "₹1,30,000", line: "65% saved · ₹6.5K this month", pct: 65, month: false }
                  : detailKind === "budget"
                    ? { label: "Left to spend", value: "₹15,200", line: "51% budget · 23 days left", pct: 51.5, month: true }
                    : detailKind === "payments"
                      ? { label: "Upcoming", value: "₹14,000", line: "3 payments · all covered", pct: null, month: true }
                      : detailKind === "income"
                        ? { label: "Income", value: "₹50,000", line: "salary + one refund", pct: null, month: true }
                        : detailKind === "spends"
                          ? { label: "Spent & invested", value: "₹20,800", line: "₹14.3K spent · ₹6.5K invested", pct: null, month: true }
                          : detailKind === "networth"
                            ? { label: "Networth", value: "₹5,54,900", line: "across 4 assets", pct: null, month: false }
                            : detailKind === "phone"
                              ? { label: "New phone", value: "₹43,000", line: "54% saved · ₹2K this month", pct: 53.8, month: false }
                              : { label: "Cashflow", value: "₹15,200", line: "left of ₹50,000 in", pct: null, month: true };
              const heroTitle = alertOn && headerAction ? action.title : hero.label;
              // R15: the budget page's header IS the gauge (1771:19442) — the big
              // arc with the copy inside; no number/line/bar hero
              if (detailKind === "budget" && !(alertOn && headerAction)) {
                return (
                  <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                    <BudgetHeroGauge />
                  </div>
                );
              }
              return (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                  <span style={{ ...typography.buttonSmall, color: TEXT_TERTIARY }}>{heroTitle}{hero.month ? " · Oct" : ""}</span>
                  <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 44, lineHeight: "56px", color: TEXT_PRIMARY, marginTop: 8 }}>
                    {hero.value}
                  </span>
                  <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 16, lineHeight: "24px", letterSpacing: 0.32, color: V2_MAGENTA, marginTop: 4 }}>
                    {hero.line}
                  </span>
                  {hero.pct !== null && (
                    <div style={{ position: "relative", height: 6, borderRadius: 12, background: "#EDEDED", width: "calc(100% - 16px)", margin: "24px 8px 0" }}>
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${hero.pct}%`,
                          borderRadius: 12,
                          background: `linear-gradient(to left, ${V2_MAGENTA} 6.7%, rgba(255,255,255,1) 117%)`,
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })()}
          </Stagger>

          {/* "Needs action": the hero states the problem and offers the ways out
              (Figma 1577:54844). The rows ride the page's own cascade, arriving
              after the insight like every other row does. */}
          {actionRowsShown && (
            // once a choice is made the conversation carries it, so the rows go
            <ActionRows
              options={action.options}
              onChoose={chooseAction}
              staggered
              active={isActivePage && genPhase === "done"}
              interactive={isActivePage}
              padding="28px 0 16px"
            />
          )}
          </div>
          )}

          {/* Suggestions — revealed once the fullscreen surface has whitened */}
          {/* the generic prompts stay away when a detail page is already asking
              something; home's alert lives in the IMPORTANT card, so its chat
              keeps the prompts (R12) */}
          {isActivePage && turns.length === 0 && !(headerAction && pid === "trip") && (
            <div
              style={{
                position: "absolute",
                top: heroPadTop + welcomeHs[pid] + 24,
                left: HERO_GUTTER,
                right: HERO_GUTTER,
                zIndex: 9,
                opacity: sugF,
                pointerEvents: full && sugF > 0.6 ? "auto" : "none",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Cosimo opens the chat — a line before the explore options (R18). */}
                {pid === "home" && (
                  <p style={{ ...typography.bodySmall, lineHeight: "22px", color: TEXT_PRIMARY, margin: "0 0 8px" }}>
                    Hey! Ask me anything about your money, or start with one of these.
                  </p>
                )}
                {SUGGESTIONS.map((sg, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 16, transform: `translateY(${(1 - f) * (10 + i * 12)}px)` }}>
                    {i > 0 && <div style={{ height: 1, marginLeft: 40, background: OUTLINE_SUBTLE }} />}
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

          {/* Chat thread — in hero and bottom-bar placements it opens with the page's
              own header as its first block, so the heading, insight and any actions
              scroll away with the conversation instead of sitting fixed above it. */}
          {isActivePage && (full || f > 0.01) && (
            <div
              ref={threadRef}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                // runs to the very top of the screen and dissolves under the chrome,
                // instead of being cut off below it (R11)
                top: 0,
                height: fullInputTop - 12,
                // above the chat surface (z-auto, later in DOM), under the pill (12)
                zIndex: 9,
                overflowY: "auto",
                scrollbarWidth: "none",
                // the chat is its own screen: the page's header doesn't come with it,
                // so the thread simply starts under the chrome (R11)
                padding: `${chromeH + 12}px ${HERO_GUTTER}px 8px`,
                WebkitMaskImage: `linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) ${statusH}px, #000 ${chromeH}px)`,
                maskImage: `linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) ${statusH}px, #000 ${chromeH}px)`,
                // arrives as the page's copy leaves — a straight crossfade, no travel,
                // since the block it replaces is identical and already in place (R11)
                opacity: chatIn,
                // an EMPTY thread must not eat taps — it sits over the suggestion
                // rows (same z, later in DOM), which made them untappable (R13)
                pointerEvents: full && turns.length > 0 ? "auto" : "none",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {turns.map((turn, i) =>
                turn.role === "user" ? (
                  <div key={turn.id} className="animate-chat-message-in" style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ background: CHAT_USER_BUBBLE, borderRadius: RADIUS_M, padding: "10px 14px", maxWidth: "82%" }}>
                      <p style={{ ...typography.bodySmall, lineHeight: "22px", color: TEXT_PRIMARY, margin: 0 }}>{turn.text}</p>
                    </div>
                  </div>
                ) : (
                  <div key={turn.id} className="animate-chat-message-in">
                    <CosimoLine
                      text={turn.text}
                      active={i === turns.length - 1 && !doneIds.has(turn.id)}
                      onDone={() => setDoneIds((d) => new Set(d).add(turn.id))}
                    />
                    {turn.options && i === turns.length - 1 && doneIds.has(turn.id) && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 28 }}>
                        {turn.options.map((opt, oi) => (
                          <div key={opt.text} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {oi > 0 && <div style={{ height: 1, marginLeft: 40, background: OUTLINE_SUBTLE }} />}
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => send(opt.text)}
                              onKeyDown={(e) => e.key === "Enter" && send(opt.text)}
                              style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                            >
                              <div style={{ position: "relative", width: 28, height: 28, overflow: "hidden", flexShrink: 0 }}>
                                <img
                                  src={`/return-exp1/${opt.img}.png`}
                                  alt=""
                                  style={opt.crop ? { position: "absolute", maxWidth: "none", ...opt.crop } : { width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              </div>
                              <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{opt.text}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                // matches the home scrim: it starts just above the field and is solid
                // by its lower edge, so the thread reads right up to it (R11)
                top: fullInputTop - 16,
                height: pillH + 16,
                background: `linear-gradient(to bottom, transparent, ${BG_PRIMARY} 28px)`,
                opacity: chatStage,
                pointerEvents: "none",
                zIndex: 9,
              }}
            />
          )}
        </div>

        {/* Sticky ask pill (R9): CSS position:sticky pins it IN the app bar, and
            the shrink-to-centre morph is calc()-driven by the scroll var — no JS,
            no React, layout confined to this 3-node subtree. exp5: on the trip
            page it pops in only after the insight finishes typing. */}
        {!bottomAsk && (() => {
          const shown = !EXP5_PILL_AFTER_TYPE || genPhase === "done";
          const morphHidden = isActivePage && morphActive;
          const dockW = 146; // label ends ~24 from the right edge (R9)
          // dock content: avatar 12 from the left, label after it, air on the right (R9)
          const contentLeft = 12;
          const labelShift = contentLeft + 32 - (paper ? 64 : 24);
          return (
            // The WRAPPER owns the chat-morph handoff, transitionless — the overlay
            // takes over / hands back in the same frame. Fading this on the inner div
            // let the exp5 transition catch the collapse handoff → a dip (R11 flicker).
            <div style={{ position: "sticky", top: statusH + 8 - (pillH - 48) / 2, zIndex: 12, height: pillH, marginTop: -(pillH + heroPb), pointerEvents: "none", opacity: morphHidden ? 0 : 1 }}>
              {/* same beat as the first card: the pill arrives WITH the cards below
                  it, not a step ahead of them (R11) */}
              <Stagger index={rowsBelow} active={isActivePage && shown}>
              <div
                role="button"
                tabIndex={0}
                aria-label="Ask cosimo"
                onClick={openFull}
                onKeyDown={(e) => e.key === "Enter" && openFull()}
                style={{
                  position: "absolute",
                  left: `calc((1 - var(--re1-t, 0)) * ${PILL_MARGIN}px + var(--re1-t, 0) * (50% - ${dockW / 2}px))`,
                  width: `calc((1 - var(--re1-t, 0)) * (100% - ${PILL_MARGIN * 2}px) + var(--re1-t, 0) * ${dockW}px)`,
                  top: `calc(var(--re1-t, 0) * ${(pillH - 48) / 2}px)`,
                  height: `calc((1 - var(--re1-t, 0)) * ${pillH}px + var(--re1-t, 0) * 48px)`,
                  borderRadius: 100,
                  border: "1px solid rgba(0,0,0,0.1)",
                  // original: translucent on the hero, solid once docked over content
                  background: paper ? BG_CARD : "rgba(255,255,255, calc(0.2 + 0.8 * var(--re1-t, 0)))",
                  boxShadow: ELEVATION_CARD,
                  display: "flex",
                  alignItems: "center",
                  padding: paper ? "0 20px 0 16px" : "0 24px",
                  cursor: "pointer",
                  // entrance lives on the Stagger wrapper; the morph handoff on the
                  // sticky wrapper — this node stays untransitioned
                  pointerEvents: morphHidden || !shown || !isActivePage ? "none" : "auto",
                  overflow: "hidden",
                }}
              >
                {/* docked identity: the cosimo avatar fades in on the left */}
                <img
                  src="/chat/cosimo-avatar.png"
                  alt=""
                  style={{ position: "absolute", left: contentLeft, top: "50%", transform: "translateY(-50%)", width: 24, height: 24, borderRadius: "50%", opacity: "var(--re1-t, 0)" }}
                />
                {paper && <img src="/return-exp1/orb.png" alt="" style={{ width: 32, height: 32, marginRight: 16, opacity: "calc(1 - var(--re1-t, 0))" as unknown as number }} />}
                <span
                  style={{
                    position: "relative",
                    flex: 1,
                    textAlign: "left",
                    ...typography.bodySmall,
                    lineHeight: "normal",
                    whiteSpace: "nowrap",
                    transform: `translateX(calc(var(--re1-t, 0) * ${labelShift}px))`,
                  }}
                >
                  {paper ? (
                    <span style={{ color: TEXT_PRIMARY }}>Ask cosimo</span>
                  ) : (
                    <>
                      <span style={{ color: TEXT_ON_COLOR_PRIMARY, opacity: "calc(1 - var(--re1-t, 0))", position: "absolute", inset: 0 }}>Ask cosimo</span>
                      <span style={{ color: TEXT_PRIMARY, opacity: "var(--re1-t, 0)" }}>Ask cosimo</span>
                    </>
                  )}
                </span>
              </div>
              </Stagger>
            </div>
          );
        })()}
        <div aria-hidden style={{ height: heroPb }} />

        {/* Cards — settle back / stagger in on the fluid page switch */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            // bottom-bar mode: just enough tail for the last card to clear the
            // floating bar with a gap — the hero-mode air read as dead space (R11)
            // bottom placement has no pill between the copy and the cards, so the
            // header sits closer to them (R11); home's first card sits 12 under the
            // app bar — 4 (hero box) + 8 (spacer) + 0 here (R13)
            padding: `${pid === "home" ? 0 : 8}px ${PAGE_GUTTER}px ${pillH + 64}px`,
            // guarantees the dock detent is reachable INCLUDING this container's own
            // top padding — it was short by exactly that, so short pages rested
            // lower than home and the pill→cards gap differed per page (R8).
            // Bottom-bar mode has no dock, so no filler: short pages (trip) end
            // right under their last card, same as home (R11).
            minHeight: bottomAsk ? 0 : frame.h - (statusH + APP_BAR_HEIGHT) - (paper ? 24 : 8) + (paper ? 16 : 24),
            // cards clear out early so the thread lands on an empty page
            opacity: 1 - clamp01(f / 0.35),
            transform: `translateY(${f * 24}px)`,
            // children with pointerEvents:auto punch through the scroller's "none" —
            // the INVISIBLE page must stay fully inert (R9 regression)
            pointerEvents: full || !isActivePage ? "none" : "auto",
          }}
        >
          {pid === "home" && headerAction && settledAction !== "self" && (
            <Stagger index={0} active={isActivePage && genPhase === "done"}>
              <ImportantCard
                body={ACTION_STATES.home.body}
                options={ACTION_STATES.home.options}
                onChoose={chooseAction}
                resolvedBody={settledAction === "done" ? ACTION_STATES.home.done : null}
              />
            </Stagger>
          )}
          {(pid === "home" ? homeCardEls : tripCards).map((card, i) => (
            <Stagger key={i} index={i + rowsBelow} active={isActivePage && genPhase === "done"}>
              {card}
            </Stagger>
          ))}
        </div>

        {/* The chat's surface: it fades in over the page rather than the hero growing
            to cover it, so opening and closing the chat costs no layout at all. Sits
            after the cards and before the thread, so DOM order does the stacking. */}
        {isActivePage && f > 0.001 && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background: paper ? BG_CARD : BG_PRIMARY,
              opacity: clamp01(f / 0.45),
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    );
  };



  return (
    <PaperCtx.Provider value={paper}>
    <div
      ref={frameRef}
      style={{
        position: "relative",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        background: BG_PRIMARY,
        // taps act immediately and never become a double-tap zoom
        touchAction: "manipulation",
        // v2 card shadow is CONSTANT — on the grey page it is near-invisible, and
        // never flipping it means zero repaint work tied to scrolling (R9).
        ["--re1-card-shadow" as string]: "0px 2px 32px 0px rgba(0,0,0,0.05)",
      } as React.CSSProperties}
    >
      {/* v2 scroll-whitening as a static white veil (opacity is compositor-only —
          interpolating background colours repainted the whole page every frame
          and janked the pill morph + scroll on mobile, R7) */}
      {paper && (
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "#FFFFFF", opacity: "var(--re1-t, 0)", zIndex: 2, pointerEvents: "none" }} />
      )}

      {/* ── Pages (fluid crossfade switch — no slide) ── */}
      {renderPage("home")}
      {renderPage("trip")}

      {/* ── Scrim under the bottom bar: content dissolves into the page surface
          behind it, so the bar reads as chrome rather than another card. It follows
          the page's own colour — grey at rest, white once the scroll whitens the
          surface — as two stacked gradients whose crossfade is opacity-only (R11). ── */}
      {bottomAsk && (() => {
        // Starts at the bar's LOWER edge: nothing above the bar is dimmed at all, so
        // cards read at full contrast right up to it — only the strip underneath
        // dissolves into the page (R11).
        const fadeTop = pillH;
        const fadeRun = 16;
        const layer = (from: string, solid: string, extra: React.CSSProperties = {}) => (
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: bottomPillTop + fadeTop,
              bottom: 0,
              background: `linear-gradient(to bottom, ${from}, ${solid} ${fadeRun}px)`,
              pointerEvents: "none",
              ...extra,
            }}
          />
        );
        return (
          <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 24, opacity: 1 - f, pointerEvents: "none" }}>
            {layer("rgba(255,255,255,0)", "#FFFFFF")}
          </div>
        );
      })()}

      {/* ── Bottom ask bar (Figma 1577:55074) — floats over the scroll like a chat
          bar; frosted so cards read through it. Waits for the page's insight. ── */}
      {bottomAsk && (
        // Permanent chrome: it never re-enters on a page change or page open —
        // it just sits there, the way a chat bar does (R11). Only the chat morph
        // hands it off, atomically (the overlay takes over in the same frame).
        <div
          role="button"
          tabIndex={morphActive ? -1 : 0}
          aria-label="Ask cosimo"
          onClick={openFull}
          onKeyDown={(e) => e.key === "Enter" && openFull()}
          style={{
            position: "absolute",
            left: BAR_MARGIN,
            right: BAR_MARGIN,
            top: bottomPillTop,
            height: pillH,
            borderRadius: 100,
            border: "1px solid rgba(0,0,0,0.1)",
            // 1738:13319: a true glass bar (white a20 over the blur), no leading orb
            background: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0px 2px 32px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            cursor: "pointer",
            zIndex: 25,
            opacity: morphActive ? 0 : 1,
            pointerEvents: morphActive ? "none" : "auto",
          }}
        >
          {/* the bar carries its thread, so it says so once one exists (R11) */}
          <span style={{ ...typography.bodySmall, lineHeight: "normal", color: TEXT_PRIMARY, whiteSpace: "nowrap" }}>
            {turns.length > 0 ? "Continue your chat" : "Ask cosimo"}
          </span>
        </div>
      )}

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
          border: "1px solid rgba(0,0,0,0.1)",
          // In bottom mode it takes over from a frosted bar — matching that fill (and
          // blur) means the handoff can't flash a different surface (R11).
          background: bottomAsk
            ? `rgba(255,255,255,${lerp(0.2, 1, f)})`
            : paper
              ? BG_CARD
              : `rgba(255,255,255,${lerp(0.2, 1, textFlip)})`,
          backdropFilter: bottomAsk ? "blur(12px)" : undefined,
          WebkitBackdropFilter: bottomAsk ? "blur(12px)" : undefined,
          boxShadow: ELEVATION_CARD,
          // above the thread and every piece of chrome, so a tap always lands on it
          zIndex: 30,
          cursor: full ? "text" : "pointer",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
        }}
      >
        {/* R15 (1738:13319): the bar carries no leading orb any more — the label
            starts at the 24 padding, matching the static bar exactly. */}
        {/* label (rest/docked) crossfades to a live input (fullscreen) */}
        <span aria-hidden style={{ position: "absolute", left: pillLabelLeft, ...typography.bodySmall, lineHeight: "normal", opacity: restFade }}>
          <span style={{ color: TEXT_ON_COLOR_PRIMARY, opacity: whiteTextOp, position: "absolute", inset: 0, whiteSpace: "nowrap" }}>{askLabel}</span>
          <span style={{ color: TEXT_PRIMARY, opacity: 1 - whiteTextOp, whiteSpace: "nowrap" }}>{askLabel}</span>
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
            // crossfade, never travel: the rest label and orb fade out where they
            // are, then the input fades in where IT lives — animating this padding
            // slid the placeholder 40px left on every open (R11)
            opacity: inputFade,
            pointerEvents: full ? "auto" : "none",
            paddingRight: 44,
            paddingLeft: 0,
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
              <div style={{ opacity: `calc(${1 - textFlip} * (1 - var(--re1-t, 0)))` }}>
                <StatusBar backgroundColor="transparent" color={TEXT_ON_COLOR_PRIMARY} />
              </div>
              <div style={{ position: "absolute", inset: 0, opacity: `calc(1 - ${1 - textFlip} * (1 - var(--re1-t, 0)))` }}>
                <StatusBar backgroundColor="transparent" color={TEXT_PRIMARY} />
              </div>
            </>
          )}
          {/* row stays pointer-transparent so the docked pill beneath it can take taps.
              It leads the page's top-to-bottom orchestration (R11) — chips fade in
              first, then the heading, insight, pill and cards. */}
          <div style={{
            height: APP_BAR_HEIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            position: "relative",
            pointerEvents: "none",
            opacity: chromeIn ? 1 : 0,
            transform: chromeIn ? "translateY(0)" : "translateY(-6px)",
            transition: `opacity 240ms ${GENTLE}, transform 360ms ${GENTLE}`,
          }}>
            {/* the app's identity, centred (1680:67323) — home only: internal pages
                keep a bare bar (R12), and the chat screen carries no header at all,
                so it rides out with the morph (R13) */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: (page === "home" ? 1 : 0) * (1 - f),
                transition: `opacity 200ms ${GENTLE}`,
              }}
            >
              <img src="/chat/cosimo-avatar.png" alt="" draggable={false} style={{ width: 24, height: 24, borderRadius: "50%" }} />
              <span style={{ ...typography.headerH4, color: TEXT_PRIMARY }}>Cosimo</span>
            </div>
            {/* permanent chrome, per 1697 — home included (R13: it was never
                supposed to leave) */}
            <div style={{ pointerEvents: "auto" }}>
              <ChromeChip flip={textFlip} ghost={f} ariaLabel={full ? "Collapse" : "Back"} onClick={onChevron}>
                {(color) => <ChevronIcon color={color} rotate={f * (bottomAsk ? -90 : 90)} />}
              </ChromeChip>
            </div>
            {/* one chip, two lives: customise (kebab) on the dashboard, new chat
                (plus) on the chat screen — the icons crossfade IN PLACE instead of
                the chip sliding out (R13). Customise is a dashboard idea, so at
                rest the chip only exists on home; history rides in beside it. */}
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ pointerEvents: full ? "auto" : "none", opacity: f, transform: `translateX(${8 * (1 - f)}px)` }}>
                <ChromeChip flip={textFlip} ghost={f} ariaLabel="Chat history" onClick={() => {}}>
                  {(color) => <HistoryIcon color={color} />}
                </ChromeChip>
              </div>
              <div
                style={{
                  pointerEvents: full || page === "home" ? "auto" : "none",
                  opacity: page === "home" ? 1 : f,
                  // page moves fade the chip instead of snapping it (R13) — the
                  // chat morph's per-frame opacity just gets gently smoothed
                  transition: `opacity 200ms ${GENTLE}`,
                }}
              >
                <ChromeChip
                  flip={textFlip}
                  ghost={f}
                  ariaLabel={full ? "New chat" : "Customise widgets"}
                  onClick={full ? startNewChat : () => setSheetOpen(true)}
                >
                  {(color) => (
                    <div style={{ position: "relative", width: 24, height: 24 }}>
                      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: 1 - f, transform: `scale(${1 - 0.25 * f})` }}>
                        <KebabIcon color={color} />
                      </div>
                      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: f, transform: `scale(${0.75 + 0.25 * f})` }}>
                        <NewChatIcon color={color} />
                      </div>
                    </div>
                  )}
                </ChromeChip>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Keyboard — rides the fullscreen spring (desktop mock only; the
          bottom-bar chat keeps its bar at the very bottom instead) ── */}
      {!isMobile && !bottomAsk && (
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
