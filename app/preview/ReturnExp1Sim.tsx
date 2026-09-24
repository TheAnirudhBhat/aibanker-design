"use client";

import { createContext, memo, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { typography } from "../lib/typography";
import { useDragVelocity, useScrub, type Scrub } from "../lib/scrub";
import { setBarTint, useTheme } from "../lib/theme";
import {
  VALENTINO_500,
  ALPHA_WHITE_FF,
  BLUE_500,
  DECOR_BOLD_ORANGE,
  BG_PRIMARY,
  BG_CARD,
  BG_SECONDARY,
  BG_DISABLED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  TEXT_ON_COLOR_PRIMARY,
  OUTLINE_SUBTLE,
  OUTLINE_BOLD,
  BG_OVERLAY,
  GREEN_500,
  EXT_TEXT_POSITIVE,
  ORANGE_500,
  RED_500,
  BTN_BG_PRIMARY_DEFAULT,
  CHAT_USER_BUBBLE,
  EXT_TEXT_NEGATIVE,
  BTN_BG_GREY_DEFAULT,
  EXT_BG_SUBTLE_MAIN,
} from "../lib/colors";
import { ELEVATION_CARD } from "../lib/elevation";
import { RADIUS_M, RADIUS_PILL } from "../lib/radii";
import { StatusBar, STATUS_BAR_HEIGHT } from "../components/AppChrome";
import MockKeyboard, { MOCK_KEYBOARD_HEIGHT } from "../components/MockKeyboard";
import { useTypewriter } from "../components/Chat";
import { useIsMobileProto } from "../hooks/useProtoMobile";
import { setProtoScreen, useProtoFlag } from "../lib/protoFlags";
import { animatePageSwap } from "../lib/animatePageSwap";
import { returnChatMotion, type ReturnChatMotion } from "../lib/returnChatMotion";
import { useAnchoredChatScroll } from "../hooks/useAnchoredChatScroll";
import { FluidText } from "../components/FluidText";

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
const V2_CAL_DAY = "var(--dls-text-primary)"; // calendar tile day (1528:49893 #38424F ≈ primary, themed for dark)
const V2_TILE_BORDER = "var(--dls-outline-subtle)"; // calendar tile border (1528:49892, themed)
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
// symmetric ease for motion that plays the same coming and going
// The page ride: how long the L1 sheet takes to cover or uncover home. Input is
// frozen for exactly this long, so it lives in one place — the settle below
// used to carry its own, longer number and the page sat dead after it landed.
const NAV_RIDE_MS = 420;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// exp5 (2026-08-12, revertable): on the trip page the ask pill pops in only
// AFTER the generated insight finishes typing. Flip to false to revert.
const EXP5_PILL_AFTER_TYPE = true; // R9: detail pages orchestrate heading → typing → pill + cards

/** rAF spring toward `target`. Interruptible — retargeting keeps velocity.
    `eps` is how close counts as arrived. The default is tight enough for a
    spring driving a PERCENTAGE (a sheet's translateY), where the last fraction
    is still several pixels. The morph spring can stop sooner: it otherwise runs a
    further 59ms after the eye is done, and every one of those frames re-renders
    the tree AND re-composites the blur. 0.0015 is set by the longest distance f
    drives — the hero pill's ~640px top lerp — so the stop is under a pixel. */
function useSpringValue(target: number, stiffness = 320, damping = 32, eps = 0.0005, velEps = 0.005) {
  const [value, setValue] = useState(target);
  const state = useRef({ v: target, vel: 0, raf: 0, last: 0 });
  useEffect(() => {
    const s = state.current;
    cancelAnimationFrame(s.raf);
    // Hidden document: rAF is paused, so snap — nobody sees the tween, and the
    // UI must not freeze mid-morph when the app is backgrounded mid-spring.
    if (document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      s.v = target;
      s.vel = 0;
      const snap = window.setTimeout(() => setValue(target), 0);
      return () => window.clearTimeout(snap);
    }
    s.last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - s.last) / 1000, 1 / 30);
      s.last = now;
      // Small integration steps keep the same smooth spring on slower devices.
      const steps = Math.max(1, Math.ceil(dt * 120));
      for (let i = 0; i < steps; i++) {
        const step = dt / steps;
        s.vel += (stiffness * (target - s.v) - damping * s.vel) * step;
        s.v += s.vel * step;
      }
      if (Math.abs(target - s.v) < eps && Math.abs(s.vel) < velEps) {
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
  }, [target, stiffness, damping, eps, velEps]);
  return value;
}

// ── Icons (geometry from DLS — chevron matches AppChrome NavButton, kebab is
//    Interface/Other 1306:5436 from the Figma payload, fills → currentColor) ──

/** DLS App bar "Nav icon" (the designer's own export, public/icons/nav-back.svg):
    the glyph already sits on its 48 tap frame, which is exactly ChromeChip's box. */
function ChevronIcon({ color, rotate = 0 }: { color: string; rotate?: number }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ transform: `rotate(${rotate}deg)` }}>
      <path fillRule="evenodd" clipRule="evenodd" d="M28.6033 16.3683C28.0743 15.8772 27.2168 15.8772 26.6879 16.3683L19.3967 23.1385C18.8678 23.6296 18.8678 24.4258 19.3967 24.9169L26.6286 31.6317C27.1575 32.1228 28.015 32.1228 28.544 31.6317C29.0729 31.1406 29.0729 30.3443 28.544 29.8532L22.2698 24.0276L28.6033 18.1467C29.1322 17.6556 29.1322 16.8594 28.6033 16.3683Z" fill={color} />
    </svg>
  );
}

/** DLS funnel, the L1 app bar's filter glyph (canon 2165:50912). */
function FilterGlyph({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M11.25 21.99C10.62 21.99 10 21.8001 9.46 21.4403C8.6 20.8506 8.09 19.8811 8.09 18.8416V12.4948C8.09 12.4148 8.06 12.3448 8.01 12.2849L4.26 8.16692C3.45 7.27736 3 6.11794 3 4.90855C3 3.25937 4.26 2 5.82 2H18.18C19.73 2 21 3.25937 21 4.8086C21 6.09795 20.49 7.31734 19.58 8.23688L16 11.8151C15.94 11.8751 15.91 11.955 15.91 12.035V18.2719C15.91 19.5712 15.1 20.7506 13.88 21.2104L12.38 21.7901C12.01 21.93 11.63 22 11.25 22V21.99ZM5.82 4.49875C5.65 4.49875 5.51 4.63868 5.51 4.8086C5.51 5.48826 5.73 6.04798 6.12 6.48776L9.87 10.6057C10.34 11.1254 10.6 11.7951 10.6 12.4948V18.8416C10.6 19.1414 10.78 19.3013 10.88 19.3813C10.98 19.4513 11.2 19.5612 11.48 19.4513L12.98 18.8716C13.23 18.7716 13.4 18.5317 13.4 18.2619V12.025C13.4 11.2754 13.69 10.5657 14.23 10.036L17.81 6.45777C18.25 6.01799 18.5 5.42829 18.5 4.7986C18.5 4.62869 18.36 4.48876 18.19 4.48876H5.82V4.49875Z" fill={color} fillOpacity={0.5} />
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
function ChromeChip({ flip, ghost = 0, bare = false, tone, onClick, children, ariaLabel }: {
  flip: number;
  ghost?: number;
  /** Canon L1 bar (1846:30222): bare glyphs on the bar — no circle, border or blur. */
  bare?: boolean;
  /** Overrides the on-white glyph colour. The flipped (on-brand) copy stays
      white whatever this says, so the crossfade is untouched. */
  tone?: string;
  onClick?: () => void;
  children: (color: string) => React.ReactNode;
  ariaLabel: string;
}) {
  // white share = (1 - flip) * (1 - scroll)
  const whiteShare = `calc(${(1 - flip).toFixed(4)} * (1 - var(--re1-t, 0)))`;
  return (
    <button
      type="button"
      className="re1-chrome-chip"
      data-bare={bare ? "true" : "false"}
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        width: 48,
        height: 48,
        borderRadius: 100,
        border: bare ? "none" : `1px solid ${OUTLINE_SUBTLE}`,
        // 0.16 → 1 as the chrome flips; ghost caps it at glass (0.55)
        background: bare ? "transparent" : `rgba(255,255,255, calc(${lerp(1, 0.55, ghost).toFixed(3)} - ${(lerp(1, 0.55, ghost) - 0.16).toFixed(3)} * ${whiteShare}))`,
        backdropFilter: bare ? undefined : "blur(12px)",
        WebkitBackdropFilter: bare ? undefined : "blur(12px)",
        boxShadow: bare ? "none" : ELEVATION_CARD,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: onClick ? "pointer" : "default",
        padding: 0,
        position: "relative",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
    >
      {/* stacked white/dark glyphs crossfaded so the flip stays theme-safe */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: whiteShare }}>
        {children(TEXT_ON_COLOR_PRIMARY)}
      </div>
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: `calc(1 - ${whiteShare})` }}>
        {/* bare bar glyphs read PRIMARY (canon L1 2057:31948); chipped ones stay secondary */}
        {children(tone ?? (bare ? "var(--dls-text-primary)" : "var(--dls-text-secondary)"))}
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

/** The budget page's HERO gauge (1806:22507): a 225° arc with the copy seated
    inside — month • label, the number large, pct • days under it. BLUE now: the
    sweep runs deep at its foot to transparent at the head, with a 4px dot ON the
    head; the track is a radial grey that fades to white at the feet.
    Geometry is lifted from the frame's vectors: a 340.13 art square (centre
    170.06, band 104→139 → centreline R 121.5, stroke 34.8) cropped by a
    314×209 window, which is what keeps the crown AND the feet in view. */
function BudgetHeroGauge() {
  const ART = 340.129; // the art square the canon vectors are drawn in
  const BOX_W = 314;
  const BOX_H = 209;
  const OFF_X = -13.5547; // the canon crop (frame 1806:22508 offset)
  const OFF_Y = -21.875;
  const C = ART / 2; // 170.06 — centre of the art square
  const R = 121.5; // band centreline
  const STROKE = 34.8;
  const START = 202.8; // left foot, measured off the canon endpoints
  const TOTAL = 225;
  const pct = 51.5;
  const end = START - (TOTAL * pct) / 100;
  const pt = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: C + R * Math.cos(rad), y: C - R * Math.sin(rad) };
  };
  const arc = (fromDeg: number, toDeg: number) => {
    const a = pt(fromDeg);
    const b = pt(toDeg);
    const large = fromDeg - toDeg > 180 ? 1 : 0;
    return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
  };
  const dot = pt(end);
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: BOX_W, height: BOX_H, overflow: "hidden" }}>
      <svg
        width={ART}
        height={ART}
        viewBox={`0 0 ${ART} ${ART}`}
        fill="none"
        style={{ position: "absolute", left: "50%", top: OFF_Y, marginLeft: OFF_X - BOX_W / 2, display: "block" }}
      >
        <defs>
          {/* canon: a radial that reads grey at the crown and washes out at the feet */}
          <radialGradient id="re1HeroGaugeTrack" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform={`translate(${C} 48.18) rotate(90) scale(204.986)`}>
            <stop stopColor="var(--dls-bg-disabled)" />
            <stop offset="1" stopColor="var(--dls-bg-primary)" />
          </radialGradient>
          {/* canon: deep blue at the foot → mid blue → transparent at the head */}
          <linearGradient id="re1HeroGaugeSweep" x1="210.106" y1="49.1603" x2="54.6575" y2="214.833" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2B6ACF" />
            <stop offset="0.645204" stopColor="#7BA2E1" stopOpacity="0.624459" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={arc(START, START - TOTAL)} stroke="url(#re1HeroGaugeTrack)" strokeWidth={STROKE} />
        <path d={arc(START, end)} stroke="url(#re1HeroGaugeSweep)" strokeWidth={STROKE} />
        <circle cx={dot.x} cy={dot.y} r="4" fill="#2B6ACF" />
      </svg>
      <div
        style={{
          position: "absolute",
          left: "50%",
          // canon: the copy block sits 26.9 below the box's middle
          top: "calc(50% + 26.9px)",
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
        <div style={{ position: "relative", height: 4, borderRadius: 12, background: "var(--dls-bg-disabled)", width: "100%" }}>
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
  // Canon 2198:56920 "Upcoming spends": three centred columns, each a mini
  // calendar (blue #6698FF month strip over the day) above the name and a BARE
  // Medium amount. Header is a plain tertiary H-row, no summary line.
  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      aria-label="Upcoming payments details"
      onClick={onOpen}
      onKeyDown={(e) => onOpen && e.key === "Enter" && onOpen()}
      style={{ ...base, padding: "24px 24px 12px", display: "flex", flexDirection: "column", gap: 20, cursor: onOpen ? "pointer" : "default" }}
    >
      <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 14, lineHeight: "20px", letterSpacing: 0.28, color: TEXT_TERTIARY }}>
        Upcoming spends
      </span>
      <div style={{ display: "flex", justifyContent: "center", gap: 5, flexWrap: "wrap" }}>
        {V2_PAYMENTS.map((pmt) => (
          <div key={pmt.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "12px 0", width: 94 }}>
            <div style={{ position: "relative", width: 43, height: 45, borderRadius: 12, background: "var(--dls-bg-sheet)", border: `0.82px solid ${V2_TILE_BORDER}`, boxShadow: "0px 0px 19.6px rgba(0,0,0,0.06)", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "4px 3px 2px", background: "#6698FF", display: "flex", justifyContent: "center" }}>
                <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 10, lineHeight: "12px", letterSpacing: 0.4, textTransform: "uppercase", color: "#FFFFFF" }}>OCT</span>
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 20, bottom: 0, display: "grid", placeItems: "center" }}>
                <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 16, lineHeight: "20px", letterSpacing: 0.32, color: "#38424F" }}>{pmt.day}</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ ...typography.caption, color: TEXT_TERTIARY, whiteSpace: "nowrap" }}>{pmt.name}</span>
              <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 14, lineHeight: "20px", letterSpacing: 0.28, color: TEXT_PRIMARY }}>{pmt.amount.replace("₹", "")}</span>
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
                background: `linear-gradient(to bottom, ${l.color}, transparent)`,
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

// ── V2 dashboard home (canon 1837:28496, R22) ───────────────────────────────
// The second take on the home surface: stat cards with gradient progress bars,
// an Add Goal invitation, and the Overview cashflow card. Internal pages and the
// chat are the SHARED machinery — these cards just route into it.

/** Overview → CASHFLOW card (1837:28570): the month's flows as gradient bars
    over tappable rows — same lines and routes as v1's cashflow card. */
// ── Shared list atoms for the v2 detail pages (canon List item/Deposit) ─────

/** A glyph tinted via mask, for the currentColor icon set in /icons. */
const tintedGlyph = (src: string, color: string, size = 20): React.CSSProperties => ({
  width: size,
  height: size,
  backgroundColor: color,
  WebkitMaskImage: `url(${src})`,
  maskImage: `url(${src})`,
  WebkitMaskSize: "contain",
  maskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  flexShrink: 0,
});

/** A tracked brand's own mark. It is a raster, so unlike the line icons it is
    never tinted — it only ever wears its own colour. Every merchant file carries
    a pale rgb(228,232,243) rim around its disc, 2-3px of a 112-168px canvas
    (user call: the logo "should not have a white, thin border"), so the mark is
    clipped to a circle and blown up 6% — enough to push that rim outside the
    clip on the smallest of them, and far too little to crop the mark itself. */
function BrandMark({ src, size }: { src: string; size: number }) {
  // The overscan is a TRANSFORM, not a percentage size: preflight's
  // `img { max-width: 100% }` clamps a 106% width back to the box while the
  // height goes through, and the non-square box that leaves makes object-fit
  // crop the mark itself. A scale is uniform and nothing clamps it.
  return (
    <span aria-hidden style={{ display: "block", width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
      <img src={src} alt="" draggable={false} width={size} height={size} style={{ display: "block", width: size, height: size, transform: "scale(1.06)" }} />
    </span>
  );
}

/** 48px avatar on the info tint; a thin blue arc shows the share used. */
function RingAvatar({ pct, size = 44, children }: { pct: number; size?: number; children: React.ReactNode }) {
  // 44 (user call R36f) — the ring keeps its 2px stroke inset from the edge.
  // The budget allocations run at the canon's 48 (2371:104602).
  const S = size, R = size / 2 - 1, C = 2 * Math.PI * R;
  return (
    <div style={{ position: "relative", width: S, height: S, flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--dls-ext-bg-subtle-info)", border: `1px solid ${OUTLINE_SUBTLE}` }} />
      {pct > 0 && (
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
          <circle cx={S / 2} cy={S / 2} r={R} fill="none" stroke={BLUE_500} strokeWidth={2} strokeLinecap="round" strokeDasharray={`${(pct / 100) * C} ${C}`} transform={`rotate(-90 ${S / 2} ${S / 2})`} />
        </svg>
      )}
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>{children}</div>
    </div>
  );
}

/** Section header band: 10px uppercase on the page's soft grey. */
function SectionBand({ text }: { text: string }) {
  return (
    <div style={{ background: BG_SECONDARY, padding: `8px ${PAGE_GUTTER}px` }}>
      <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 10, lineHeight: "12px", letterSpacing: 0.4, color: TEXT_TERTIARY, textTransform: "uppercase", display: "block" }}>{text}</span>
    </div>
  );
}

/** List item/Deposit: avatar, title over a caption, amount over its caption. */
function DepositRow({ avatar, title, sub, amount, amountSub, wrapTitle }: {
  avatar: React.ReactNode; title: string; sub?: string; amount: string; amountSub?: string; wrapTitle?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: `16px ${PAGE_GUTTER}px`, background: BG_PRIMARY }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        {avatar}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 16, lineHeight: "20px", letterSpacing: 0.32, color: TEXT_PRIMARY, maxWidth: wrapTitle ? 124 : undefined, whiteSpace: wrapTitle ? "normal" : "nowrap" }}>{title}</span>
          {sub && <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: TEXT_TERTIARY, whiteSpace: "nowrap" }}>{sub}</span>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0, textAlign: "right" }}>
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 16, lineHeight: "24px", letterSpacing: 0.32, color: TEXT_PRIMARY, whiteSpace: "nowrap" }}>{amount}</span>
        {/* the caption slot stays even when empty so amounts align across rows (canon keeps it at opacity 0) */}
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: TEXT_SECONDARY, whiteSpace: "nowrap", visibility: amountSub ? "visible" : "hidden" }}>{amountSub ?? " "}</span>
      </div>
    </div>
  );
}

/** Canon 2371:104570 — the progress card under the figure: a 6px track whose
    fill is the month's SPEND, and the spent / cap pair beneath it. */
function BudgetProgressCard({ spent, cap, tone }: { spent: number; cap: number; tone: string }) {
  // R54 (user call): the bar shows what is LEFT — the same reading as the home
  // card's line — the captions carry the pace and the spend, and they sit two
  // DLS steps down (caption 12/16) under the 48px figure
  // An overspent month is FULL, not empty (canon 2371:104905 fills the bar in
  // the negative colour). Reading the bar as what is LEFT (R54) sends it to 0
  // the moment the cap is passed, so the state that matters most rendered as a
  // bare grey track — "no data" rather than "you are over".
  const over = spent > cap;
  const pct = over ? 100 : Math.max(0, Math.min(100, ((cap - spent) / cap) * 100));
  const line: React.CSSProperties = { fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: TEXT_TERTIARY, whiteSpace: "nowrap" };
  return (
    <div style={{ width: "100%", background: BG_CARD, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: 16, boxShadow: ELEVATION_CARD, padding: "24px 24px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ height: 6, borderRadius: 12, background: "var(--re1-amb-track, #ededed)", overflow: "hidden" }}>
        {/* what is left SHRINKS as the month is spent (R54; the home card's line) */}
        <div
          data-budget-progress
          style={{
            height: 6,
            width: `${pct}%`,
            borderRadius: 8,
            background: tone,
          }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={line}>23 days to go</span>
        <span style={{ ...line, flex: 1, textAlign: "right" }}>₹{spent.toLocaleString("en-IN")} spent</span>
      </div>
    </div>
  );
}

/** The home theme the sim was mounted with: Ambient on the live v2 route, the
    White · Orb art look on its archived route (the debug-panel switcher left on
    user call). Provided by ReturnExp1Sim; the cards read it here. */
type Dash2HomeTheme = "ambient" | "art54orb";
const Dash2ThemeCtx = createContext<Dash2HomeTheme>("ambient");

/** The month's reading. The Budget state flag belongs to the cube themes (its
    control only shows there, R51); everywhere else the page reads the home
    card's own month — on track — so what is inside matches what is outside (R54). */
const budgetStateFor = (theme: Dash2HomeTheme, raw: string): Dash2BudgetState =>
  theme.startsWith("art54") ? ((raw as Dash2BudgetState) || "ontrack") : "ontrack";
function useBudgetState(): Dash2BudgetState {
  const [stateRaw] = useProtoFlag("returnExp1V2BudgetState");
  return budgetStateFor(useContext(Dash2ThemeCtx), stateRaw);
}

/** The month in three readings (the debug panel's Budget state). The caps are
    canon-shaped; the spends are ours. Over-budget lands on ₹4,500 overspent,
    the canon's own figure (2371:104896). */
const BUDGET_SPENDS: Record<Dash2BudgetState, number[]> = {
  ontrack: [6200, 1150, 2300, 3400, 1250], // 14,300 spent · 15,200 left
  watch: [8800, 1800, 4200, 5400, 2100], //   22,300 spent ·  7,200 left
  over: [12500, 2900, 7100, 8200, 3300], //   34,000 spent ·  4,500 over
};

// ── V2 budget page, canon 1905:19456 "Left to Spend - Dashboard" (R26) ───────
// On v2 the gauge + Budget/Cashflow switch (1806) give way to: a plain hero
// (label · month, the number, the pace line in green, an 11px bar), the status
// carousel with its dots, then the Allocation list and How it works.

/** The hero: what's left, how the month is pacing, the bar. */
function BudgetHeroV2({ onReplan, cat, catSpent }: { onReplan?: () => void; cat?: (typeof BUDGET_ALLOC)[number]; catSpent?: number }) {
  // Canon 2371:104561 "Top header": the month's name over the figure, the pace
  // line under it, then the progress card — and, once the month is overspent,
  // the Replan Budget button (2371:104917). Everything reads from the same
  // Budget state the cube card uses, so the three readings are one switch.
  const st = useBudgetState();
  // one head serves the month AND one allocation (canon 2371:105016 keeps the
  // same card, renamed and in the category's colour)
  const spent = cat ? (catSpent ?? cat.spent) : BUDGET_SPENDS[st].reduce((a, b) => a + b, 0);
  const cap = cat ? cat.cap : BUDGET_ALLOC.reduce((a, c) => a + c.cap, 0);
  const over = spent > cap;
  const figure = Math.abs(cap - spent);
  // canon paints the figure and its line NEGATIVE when the month is overspent;
  // "running hot" is ours — the amber the cube already uses for it
  const tone = over ? EXT_TEXT_NEGATIVE : cat ? cat.tone : st === "watch" ? ORANGE_500 : GREEN_500;
  const headline = over ? EXT_TEXT_NEGATIVE : TEXT_PRIMARY;
  // the page head rhythm (user call): DASH2_HEAD_TOP under the app bar, label /
  // 8 / figure / 12 / line, 32 to whatever follows — the bank page sets the
  // standard, and all three heads move together through that constant
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: 12, paddingTop: DASH2_HEAD_TOP }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
        <span style={{ ...typography.buttonSmall, color: TEXT_TERTIARY, textAlign: "center" }}>{cat ? `${cat.name} • Oct Budget` : "Oct Budget"}</span>
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 48, lineHeight: "56px", letterSpacing: -0.48, color: headline, textAlign: "center" }}>₹{figure.toLocaleString("en-IN")}</span>
      </div>
      {/* the figure's caption stays (user call R55) — only the days to go moved
          into the progress card (R54); an overspent month says so in red */}
      <div style={{ minHeight: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ ...typography.bodySmall, color: over ? EXT_TEXT_NEGATIVE : TEXT_SECONDARY, whiteSpace: "nowrap" }}>
          {over ? "Overspent" : "left to spend"}
        </span>
      </div>
      <div style={{ width: "100%", marginTop: 20 }}>
        <BudgetProgressCard spent={spent} cap={cap} tone={tone} />
      </div>
      {over && !cat && (
        <button
          type="button"
          onClick={onReplan}
          className="transition-transform active:scale-[0.99]"
          style={{ width: "100%", marginTop: 24, padding: "12px 24px", borderRadius: 100, border: "none", background: BTN_BG_GREY_DEFAULT, ...typography.buttonNormal, color: TEXT_PRIMARY, cursor: "pointer" }}
        >
          Replan Budget
        </button>
      )}
    </div>
  );
}

// The caps in numbers. What's left sums to ₹15,200, the hero's figure, to the
// rupee (spent ₹14,300 of ₹29,500 across the five).
const BUDGET_ALLOC: { id: string; icon: string; name: string; spent: number; cap: number; tone: string }[] = [
  // tone = the category's own colour in the cashflow drill, so a category reads
  // the same wherever you meet it
  { id: "food", icon: "food", name: "Food & drinks", spent: 6200, cap: 11000, tone: "#FF8400" },
  { id: "home", icon: "home", name: "Home", spent: 1150, cap: 2500, tone: "#78808B" },
  { id: "travel", icon: "flight", name: "Travel", spent: 2300, cap: 6000, tone: "#2E90FF" },
  { id: "shopping", icon: "shopping", name: "Shopping", spent: 3400, cap: 7000, tone: "#F4789F" },
  { id: "ent", icon: "tv", name: "Entertainment", spent: 1250, cap: 3000, tone: "#70835E" },
];

/** What each allocation is made of — the canon's category level (2371:105016)
    lists the month's transactions under the same head the budget wears. */
const BUDGET_CAT_TXNS: Record<string, { id: string; name: string; note: string; amount: number; tint: string; logo?: string }[]> = {
  // The food merchants are the canon's own (2790:53053) and carry its exported
  // logos; every other category still falls back to the tinted initial.
  food: [
    { id: "f1", name: "Swiggy", note: "4 Oct '26 · UPI", amount: 1400, tint: "#FC8019", logo: "swiggy" },
    { id: "f2", name: "Social", note: "2 Oct '26 · Card", amount: 1250, tint: "#E23744", logo: "social" },
    { id: "f3", name: "KFC", note: "1 Oct '26 · UPI", amount: 980, tint: "#F8CB46", logo: "kfc" },
    { id: "f4", name: "Zomato", note: "1 Oct '26 · UPI", amount: 870, tint: "#E23744", logo: "zomato" },
    { id: "f5", name: "Dominos", note: "1 Oct '26 · slice UPI", amount: 700, tint: "#0078AE", logo: "dominos" },
    { id: "f6", name: "Easydiner", note: "1 Oct '26 · Card", amount: 1000, tint: "#F26522", logo: "easydiner" },
  ],
  home: [
    { id: "h1", name: "Electricity", note: "8 Oct '26 · UPI", amount: 800, tint: "#F8CB46" },
    { id: "h2", name: "Urban Company", note: "3 Oct '26 · Card", amount: 350, tint: "#2B6ACF" },
  ],
  travel: [
    { id: "t1", name: "Uber", note: "6 Oct '26 · UPI", amount: 1300, tint: "#111111" },
    { id: "t2", name: "IRCTC", note: "2 Oct '26 · Card", amount: 1000, tint: "#2E90FF" },
  ],
  shopping: [
    { id: "s1", name: "Amazon", note: "3 Oct '26 · Card", amount: 1600, tint: "#FF9900" },
    { id: "s2", name: "Myntra", note: "1 Oct '26 · UPI", amount: 1100, tint: "#FF3F6C" },
    { id: "s3", name: "Decathlon", note: "1 Oct '26 · Card", amount: 700, tint: "#0082C3" },
  ],
  ent: [
    { id: "e1", name: "Netflix", note: "12 Oct '26 · Card", amount: 649, tint: "#E23744" },
    { id: "e2", name: "BookMyShow", note: "5 Oct '26 · UPI", amount: 601, tint: "#C4242B" },
  ],
};

/** ONE transaction row for the whole proto (canon "List item / Transaction",
    component 6820:42403): px 24 / py 16, gap 12, 40px avatar on a 1px Outline
    Subtle rim, name Regular 16/24 over a secondary caption, amount right.
    The avatar carries the merchant's own logo where the canon ships one and the
    tinted initial where it doesn't — never a letter where a logo exists.
    The tracking and budget-category pages had each grown a private copy of this
    row, which is how they drifted to 12px padding, a Medium name and a tertiary
    rail while the cashflow pages kept the canon's (user call R65). */
function Dash2TxnRow({ name, note, amount, tint, logo, onOpen }: {
  name: string; note: string; amount: number; tint: string; logo?: string; onOpen?: () => void;
}) {
  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      aria-label={onOpen ? `${name} transaction` : undefined}
      onClick={onOpen}
      onKeyDown={onOpen ? (e) => e.key === "Enter" && onOpen() : undefined}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: `16px ${PAGE_GUTTER}px`, cursor: onOpen ? "pointer" : undefined }}
    >
      {/* a logo sits on the white avatar ground; only the letter fallback wears
          the merchant's own tint */}
      <div aria-hidden style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: `1px solid ${OUTLINE_SUBTLE}`, display: "grid", placeItems: "center", background: logo ? BG_PRIMARY : `color-mix(in srgb, ${tint} 14%, transparent)` }}>
        {logo
          ? <img src={`/return-exp1/merchants/${logo}.png`} alt="" width={40} height={40} draggable={false} style={{ display: "block", objectFit: "cover" }} />
          : <span style={{ ...typography.buttonSmall, color: tint }}>{name.slice(0, 1)}</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
        <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
        <span style={{ ...typography.caption, color: TEXT_SECONDARY, whiteSpace: "nowrap" }}>{note}</span>
      </div>
      <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, whiteSpace: "nowrap" }}>{inr(amount)}</span>
    </div>
  );
}

/** One allocation, opened: the budget's own head in the category's colour, then
    the month's transactions for it (canon 2371:105016 / 2371:105069). */
function BudgetCategoryPage({ cat, spent, onOpenTxn }: { cat: (typeof BUDGET_ALLOC)[number]; spent: number; onOpenTxn?: (t: { name: string; note: string; amount: number; tint: string }) => void }) {
  const txns = BUDGET_CAT_TXNS[cat.id] ?? [];
  return (
    <div style={{ marginLeft: -PAGE_GUTTER, marginRight: -PAGE_GUTTER, display: "flex", flexDirection: "column", paddingBottom: 24 }}>
      <SectionBand text="Transactions" />
      {txns.map((t) => (
        <Dash2TxnRow key={t.id} name={t.name} note={t.note} amount={t.amount} tint={t.tint} logo={t.logo} onOpen={onOpenTxn && (() => onOpenTxn({ name: t.name, note: t.note, amount: t.amount, tint: t.tint }))} />
      ))}
      {txns.length === 0 && (
        <p style={{ ...typography.bodySmall, color: TEXT_TERTIARY, margin: 0, padding: `24px ${PAGE_GUTTER}px` }}>
          Nothing on {cat.name.toLowerCase()} yet this month. {inr(cat.cap - spent)} still set aside.
        </p>
      )}
    </div>
  );
}

/** Full-bleed page body: status carousel + dots → Allocation → How it works. */
function BudgetAllocationPageV2({ onHow, onOpenCat }: { onHow?: () => void; onOpenCat?: (id: string) => void }) {
  const [dot, setDot] = useState(0);
  const st = useBudgetState();
  const cards = budgetStatusCardsV2(st);
  const spends = BUDGET_SPENDS[st];
  // canon 2371:104892: the overspent month shows the bar and the Replan button
  // and nothing else — a "watch your pace" nudge under an overspent figure
  // contradicts itself
  const showInsights = st !== "over";
  return (
    <div style={{ marginLeft: -PAGE_GUTTER, marginRight: -PAGE_GUTTER, display: "flex", flexDirection: "column" }}>
      {showInsights && (
        <>
          <div
            className="no-scrollbar"
            onScroll={(e) => {
              const pitch = e.currentTarget.clientWidth - PAGE_GUTTER;
              setDot(Math.min(cards.length - 1, Math.round(e.currentTarget.scrollLeft / pitch)));
            }}
            // the gap IS the gutter (user call R45b): at 12 the next card showed a
            // sliver past the right margin and the live one read as cut short.
            // At 24 each card sits 24 from both edges and the next starts exactly
            // at the page's edge.
            style={{ display: "flex", gap: PAGE_GUTTER, overflowX: "auto", padding: `0 ${PAGE_GUTTER}px`, scrollbarWidth: "none", scrollSnapType: "x mandatory", scrollPaddingLeft: PAGE_GUTTER }}
          >
            {cards.map((c) => (
              <div key={c.title} style={{ scrollSnapAlign: "start", width: "100%", flexShrink: 0 }}>
                <BudgetStatusCard {...c} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
            {cards.map((c, i) => (
              <div key={c.title} style={{ width: 6, height: 6, borderRadius: 32, background: i === dot ? OUTLINE_BOLD : OUTLINE_SUBTLE, transition: "background 200ms ease" }} />
            ))}
          </div>
        </>
      )}
      {/* canon 2790:53816: a section BAND, not a heading — the list reads as a
          block of the page rather than a titled card */}
      <div style={{ marginTop: 24 }}>
        <SectionBand text="Allocations" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8, paddingBottom: 12 }}>
        {BUDGET_ALLOC.map((c, i) => {
          const spent = spends[i];
          const left = c.cap - spent;
          // canon's subtitle is what's LEFT, not what's gone (2371:104608)
          const pctLeft = Math.max(0, Math.round((left / c.cap) * 100));
          return (
            <div
              key={c.name}
              role="button"
              tabIndex={0}
              aria-label={`${c.name} spends`}
              onClick={() => onOpenCat?.(c.id)}
              onKeyDown={(e) => e.key === "Enter" && onOpenCat?.(c.id)}
              className="transition-transform active:scale-[0.99]"
              style={{ cursor: "pointer" }}
            >
              <DepositRow
                avatar={<RingAvatar size={48} pct={Math.min(100, Math.round((spent / c.cap) * 100))}><div aria-hidden style={tintedGlyph(`/return-exp1/icons/${c.icon}.svg`, BLUE_500, 16)} /></RingAvatar>}
                title={c.name}
                sub={`${pctLeft}% left`}
                amount={left < 0 ? `₹${Math.abs(left).toLocaleString("en-IN")} over` : `₹${left.toLocaleString("en-IN")} left`}
                amountSub={`of ${c.cap.toLocaleString("en-IN")}`}
              />
            </div>
          );
        })}
      </div>
      <div aria-hidden style={{ height: 8, background: BG_SECONDARY }} />
      <div
        role="button"
        tabIndex={0}
        aria-label="How it works"
        onClick={onHow}
        onKeyDown={(e) => e.key === "Enter" && onHow?.()}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: `16px ${PAGE_GUTTER}px`, marginTop: 12, cursor: "pointer" }}
      >
        <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, flex: 1 }}>How it works</span>
        <div aria-hidden style={{ width: 24, height: 24 }} />
      </div>
    </div>
  );
}

// ── Budget history (the app bar's clock glyph) ───────────────────────────────
// A story, not a list (user call): the budget carries over. What a month
// leaves rolls into the next one; what it overspends comes out of it. The
// spend is NOT a new fixture: it is the cashflow's own category history summed
// over the five allocations, so a month here agrees to the rupee with the
// month you reach by drilling the cashflow chart. The budget started in June,
// and its monthly figure is solved so September's carry lands October on
// exactly the cap the budget page reads.
const BUDGET_CAP = BUDGET_ALLOC.reduce((a, c) => a + c.cap, 0);
const BUDGET_START = 5; // June
const budgetSpent = (i: number) => BUDGET_ALLOC.reduce((a, c) => a + dash2CategoryTotal(c.id, i), 0);
const budgetHistory = () => {
  const months = DASH2_CF_MONTHS.slice(BUDGET_START, DASH2_CF_LIVE).map((_m, k) => BUDGET_START + k);
  // Oct = monthly + every month's (monthly − spent), so monthly = (cap + spends) / (months + 1)
  const monthly = Math.round((BUDGET_CAP + months.reduce((a, i) => a + budgetSpent(i), 0)) / (months.length + 1));
  let carry = 0;
  const past = months.map((i) => {
    const spent = budgetSpent(i);
    const m = { label: DASH2_MONTH_FULL[i], short: DASH2_CF_MONTHS[i].label, budget: monthly + carry, spent, left: monthly + carry - spent };
    carry = m.left;
    return m;
  });
  return past;
};

/** Past months only (user call: this is the history page, the running month
    lives on the budget page), newest first, each month's budget against its
    spend — plain rows, not joined. The carry-over lives in the budget itself
    (the monthly figure plus what the month before left or overspent). What
    leads the row is the debug panel's "Budget history avatar": the month's
    outcome as an icon (the default), nothing, or a dot on a line joining the
    months (the share-left version was tried and removed, user call). The
    month's short name used to sit there and only repeated the title (user
    call). */
function BudgetHistoryPage() {
  const past = budgetHistory();
  const [mark] = useProtoFlag("returnExp1V2BudgetHistory");
  const lead = (m: (typeof past)[number]): React.ReactNode => {
    const over = m.left < 0;
    const tone = over ? EXT_TEXT_NEGATIVE : EXT_TEXT_POSITIVE;
    const wash = over ? "var(--dls-ext-bg-subtle-negative)" : "var(--dls-ext-bg-subtle-positive)";
    const disc = (child: React.ReactNode) => (
      <div style={{ width: 48, height: 48, borderRadius: 48, flexShrink: 0, background: wash, display: "grid", placeItems: "center" }}>{child}</div>
    );
    if (mark === "icon") {
      // an overspent month gets the DLS attention mark, Status/Disclaimer
      // (594:542), not a cross (user call)
      return disc(<div aria-hidden style={tintedGlyph(over ? "/return-exp1/status-disclaimer.svg" : "/return-exp1/tick-rounded.svg", tone, 20)} />);
    }
    if (mark === "dot") {
      // the dot sits on the month's NAME, not the middle of the two lines
      // (user call): a slot as tall as the title + caption (20 + 4 + 16), the
      // dot centred on the title's 20px line, lifted over the line below
      return (
        <div style={{ position: "relative", zIndex: 1, width: 8, height: 40, flexShrink: 0 }}>
          <div aria-hidden style={{ position: "absolute", top: 6, width: 8, height: 8, borderRadius: 8, background: tone }} />
        </div>
      );
    }
    return null;
  };
  const rows = [...past].reverse();
  // the dots are joined by a line (user call): dot centre = 16 row padding +
  // 2 (the 40 text block centred on the 44 amount block) + half the 20 title
  const DOT_Y = 28;
  return (
    <div style={{ marginLeft: -PAGE_GUTTER, marginRight: -PAGE_GUTTER, paddingBottom: 24, display: "flex", flexDirection: "column" }}>
      {rows.map((m, k) => (
        <div key={m.label} style={{ position: "relative" }}>
          {mark === "dot" && rows.length > 1 && (
            <div aria-hidden style={{ position: "absolute", left: PAGE_GUTTER + 3, width: 2, background: OUTLINE_SUBTLE, top: k === 0 ? DOT_Y : 0, ...(k === rows.length - 1 ? { height: DOT_Y } : { bottom: 0 }) }} />
          )}
          <DepositRow
            avatar={lead(m)}
            title={m.label}
            sub={`${inr(m.budget)} budget`}
            amount={`${inr(Math.abs(m.left))} ${m.left < 0 ? "over" : "left"}`}
            amountSub={`${inr(m.spent)} spent`}
          />
        </div>
      ))}
    </div>
  );
}

// ── V2 goal page, canon 2198:56777 "Stash - L1" (R26) ────────────────────────
// The Japan trip in the canon's shape: saved amount as the hero with the
// interest line, a Replan goal button, the progress card, then Allocation and
// Recurring contribution lists. ₹64,500 in the FD ladder + ₹20,000 from family
// = ₹84,500 saved; ₹45,500 to go at ₹6,500 a month is 7 months, so May '27.

/** Hero: the goal, what's saved, the interest read, the replan button. */
function GoalHeroV2({ onReplan }: { onReplan: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 14, lineHeight: "20px", letterSpacing: 0.28, color: TEXT_TERTIARY }}>Trip to Japan</span>
      <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 48, lineHeight: "56px", letterSpacing: -0.48, color: TEXT_PRIMARY, marginTop: 8 }}>₹84,500</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 24, marginTop: 12 }}>
        <img src="/return-exp1/goal-v2/arrow-up.svg" alt="" aria-hidden width={16} height={16} draggable={false} />
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 14, lineHeight: "20px", letterSpacing: 0.28, color: "#00A63E" }}>₹1,140 interest earned so far</span>
      </div>
      <button
        type="button"
        onClick={onReplan}
        className="transition-transform active:scale-[0.98]"
        style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 16, lineHeight: "24px", letterSpacing: 0.32, color: TEXT_PRIMARY, width: "100%", height: 48, marginTop: 24, padding: "12px 24px", borderRadius: 100, border: "none", background: "var(--dls-btn-bg-grey-default)", cursor: "pointer" }}
      >
        Replan goal
      </button>
    </div>
  );
}

const GOAL_V2 = { saved: 84500, target: 130000 };

/** Full-bleed page body: the progress card, Allocation, Recurring contribution. */
function GoalPageBodyV2() {
  const pct = Math.round((GOAL_V2.saved / GOAL_V2.target) * 100);
  const caption: React.CSSProperties = { fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: TEXT_TERTIARY, whiteSpace: "nowrap" };
  return (
    <div style={{ marginLeft: -PAGE_GUTTER, marginRight: -PAGE_GUTTER, display: "flex", flexDirection: "column" }}>
      {/* To-do card v2: the bar, its share against the target, the estimate */}
      <div style={{ margin: `0 ${PAGE_GUTTER}px`, background: BG_CARD, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: 16, boxShadow: "0px 2px 16px rgba(0,0,0,0.05)", padding: "24px 24px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ position: "relative", height: 8 }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1, height: 6, borderRadius: 8, background: "var(--dls-bg-disabled)" }} />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: 8,
              width: `${pct}%`,
              borderRadius: 8,
              background: "#D30AD7",
              boxShadow: "0px 1px 4px rgba(211,10,215,0.24)",
              transformOrigin: "left center",
              animation: "re1v2BarGrow 640ms cubic-bezier(0.22, 1, 0.36, 1) 180ms both",
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 14, lineHeight: "20px", letterSpacing: 0.28, color: "#D30AD7" }}>{pct}%</span>
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 14, lineHeight: "20px", letterSpacing: 0.28, color: TEXT_TERTIARY, whiteSpace: "nowrap" }}>Target • ₹1,30,000</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div aria-hidden style={{ borderTop: "1px dashed var(--dls-outline-bold)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div aria-hidden style={tintedGlyph("/return-exp1/goal-v2/clock.svg", TEXT_TERTIARY, 16)} />
              <span style={caption}>Est. 7 months to go</span>
            </div>
            <span style={caption}>By 2 May ’27</span>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 8, paddingBottom: 12 }}>
        <SectionBand text="Allocation" />
        <DepositRow
          avatar={<RingAvatar pct={59}><img src="/return-exp1/goal-v2/gear.svg" alt="" aria-hidden width={20} height={20} draggable={false} /></RingAvatar>}
          title="Japan atom"
          sub="Progress 59%"
          amount="₹64,500"
          amountSub="of ₹1,10,000"
        />
        <DepositRow
          avatar={<RingAvatar pct={0}><img src="/return-exp1/goal-v2/categories.svg" alt="" aria-hidden width={20} height={20} draggable={false} /></RingAvatar>}
          title="Family contribution"
          wrapTitle
          amount="₹20,000"
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 12 }}>
        <SectionBand text="Recurring contribution" />
        <DepositRow
          avatar={<RingAvatar pct={0}><img src="/return-exp1/goal-v2/gear.svg" alt="" aria-hidden width={20} height={20} draggable={false} /></RingAvatar>}
          title="autopay"
          sub="3 transactions"
          amount="₹6,500"
          amountSub="Monthly on 2nd"
        />
      </div>
    </div>
  );
}

// ── Home cashflow glance, canon 2205:57275 (R28) ─────────────────────────────
// The canon instance is NAMED "Upcoming payments" but renders "Aug Cashflow".
// Investments joined the cashflow (2214:57905): three legend rows now, and the
// bar cluster is the selected month's own trio at 13w. Canon copy is placeholder
// (₹1,20,500 everywhere) — amounts stay the October world's, heights honest.
const DASH2_GLANCE_FLOWS = [
  { name: "Inflow", dot: "#46BE73" },
  { name: "Outflow", dot: "#DA535A" },
  { name: "Investments", dot: "#5487D8" },
];
// The cluster keeps the CHART's series order (in · invest · out, canon render);
// tones are the heads of 2886:86492-94's own gradient exports (sampled), a
// notch off the legend dots.
const DASH2_GLANCE_BARS = [
  { name: "Inflow", tone: "#3CBB6B" },
  { name: "Investments", tone: "#5E8DDB" },
  { name: "Outflow", tone: "#DA525A" },
];
/** The card's debug-panel states (user call, 2026-09-23) as the [inflow,
    outflow, investments] each one reads. Live is October. The nil state is a
    month with nothing in it — the message look won over zeros and ghost bars
    (user call; git keeps them). The last two are a month that invested
    nothing, so Investments drops out whole (the way the L1 chart drops it),
    and one of the two left is zero. */
const DASH2_GLANCE_STATES: Record<string, number[]> = {
  live: [50000, 20800, 15000],
  "nil-note": [0, 0, 0],
  "no-in": [0, 20800],
  "no-out": [50000, 0],
};
/** The nil message's ghost cluster, sketched on the track colour, in · invest
    · out, in proportion to its tallest. Shapes only, not figures. */
const DASH2_GLANCE_GHOST = [104, 48, 72];
/** "Nil · message", placed per Figma 3226:97269 (user call: its position and
    placement, not its graph). 24 over the heading, 24 to a 47 row, 20 under
    it. The row is the 110-wide headline, two H4 lines, 32, and the chart: 114
    wide against the card's right padding, standing on the row's foot and
    rising DASH2_GLANCE_NOTE_RISE above the row's top, so 86 tall. The chart
    itself is ours (user call): a live chart scaled to that height, its five
    rules with it, the ghost's tallest standing where the live tallest does
    (173 of 212). */
const DASH2_GLANCE_NOTE_W = 110;
const DASH2_GLANCE_NOTE_CHART_W = 114;
/** 12 more air on the right of the slot's graphic (user call), the nil chart
    and the All paid tick alike, so the two cards stay a pair. */
const DASH2_GLANCE_NOTE_INSET = 12;
const DASH2_GLANCE_NOTE_RISE = 39;
const DASH2_GLANCE_NOTE_H = 47 + DASH2_GLANCE_NOTE_RISE;
/** A zero series keeps its column as a nub on the baseline, in the track colour. */
const DASH2_GLANCE_NUB = 4;
/** The chart is as tall as the legend beside it: a row is the 16 label, 4, the
    32 figure, and 28 between rows — 212 for three, 132 for two, so a month
    without investments is a shorter card and a shorter chart (user call). */
const dash2GlanceChartH = (rows: number) => rows * 52 + (rows - 1) * 28;
/** The page head's first beat: 12 from the BOTTOM OF THE APP BAR to the title
    (user call). It reads 4 because every detail page already starts 8 below the
    bar — measured on the glass, not assumed, and that 8 is why the old comments
    calling this "32 under the app bar" were describing a 40 the whole time.
    Shared by every page that follows the rhythm, so they cannot drift apart. */
const DASH2_HEAD_TOP = 4;
/** The L0 glance card's bar, and the air between two of them. This was one
    width for the whole product (user call: the cashflow chart matches the L0
    card) until the designer began judging the L1 chart on its own — it has gone
    4 → 6 → 8 there while nobody has asked the CARD to move. The card keeps 6
    and the chart names its own below; say the word and they rejoin. */
const DASH2_BAR_W = 6;
const DASH2_BAR_GAP = 2;
// The L1 trio, 4 thicker than the card's (user call, "in the L1 page"), and 8
// → 10 once the bars became tap targets (user call: easier to tap). Three of
// them and their gaps still fit the 40 month.
const DASH2_TRIO_BAR_W = 10;
// On a drill the picked series is the whole page, so it gets a width of its own
// (user call: the bar should get wider on L2, that is the main thing now). It
// started as the trio's whole span, three bars and both gaps, which read as too
// thick; a gap came back and 16 was right (user call). It is TYPED, not derived
// from the trio any more: the trio's bar has since gone 4 → 6 on its own call,
// and deriving would have pushed this to 22 and undone a judgement that was
// made on this bar alone.
const DASH2_DRILL_BAR_W = 16;
const DASH2_BAR_FOOT = "linear-gradient(to bottom, #000 76%, transparent 100%)";
// Every tap on the card — legend rows included — opens the SAME cashflow
// screen (user call, R28 cont.); the rows stopped deep-linking into the drills.
function Dash2CashflowGlanceCard({ onOpen, crystal = "none" }: { onOpen: () => void; crystal?: "none" | "white" | "colour" }) {
  const themed = crystal !== "none";
  const colour = crystal === "colour";
  const kit = useV2Skin();
  const chart = useV2Chart();
  const [look] = useProtoFlag("returnExp1V2CashflowCard");
  const figures = DASH2_GLANCE_STATES[look] ?? DASH2_GLANCE_STATES.live;
  const flows = DASH2_GLANCE_FLOWS.slice(0, figures.length).map((f, i) => ({ ...f, value: figures[i] }));
  const valueOf = (name: string) => flows.find((f) => f.name === name)?.value;
  const bars = DASH2_GLANCE_BARS.filter((b) => valueOf(b.name) !== undefined);
  const peak = Math.max(...flows.map((f) => f.value));
  const note = look === "nil-note";
  // the message sits beside a short ghost chart (user call: ghost bars with
  // the message, and a chart cut down for the smaller card)
  const chartH = note ? DASH2_GLANCE_NOTE_H : dash2GlanceChartH(flows.length);
  // the tallest bar keeps the same 39 of air over it at any height
  const barMax = chartH - 39;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Cashflow details"
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className={kit.cardClass}
      style={{ ...kit.card("brand", 20), ...(themed || kit.wash ? { position: "relative", overflow: "hidden" } : {}), ...(colour ? { background: "#090B0C", border: "none", borderRadius: 20, boxShadow: "0px 8px 32px rgba(0,0,0,0.18)" } : {}), padding: note ? "24px 24px 20px" : 24, display: "flex", flexDirection: "column", gap: 24, cursor: "pointer" }}
    >
      {/* 2886:86806: the frame's wide green ellipse, most of it off the card's
          right edge, at 5% — in both modes (R74; R36 lit this card after dark only) */}
      {kit.wash && (
        <div aria-hidden style={dash2Wash(GREEN_500, 527.78, 276, "calc(50% - 95.46px)", "calc(50% - 138px)", { opacity: 0.05, filter: "blur(50px)" })} />
      )}
      {/* themed: the crystal takes the bar cluster's spot on the WHITE card
          (user call R30c), leaning in from the right edge */}
      {themed && (
        /* canon 2498:132969 geometry: a 515px square anchored at 73% of the
           card's width, top bleeding −16 — only the crystal's middle band
           crosses the right edge, at the asset's own baked diagonal (no extra
           rotation; the earlier 8° fought it) */
        <img src="/return-exp1/theme54/crystal.png" alt="" aria-hidden draggable={false} style={{ position: "absolute", left: "73%", top: -14, width: 446, height: 440, filter: "drop-shadow(0 12px 26px rgba(200,120,255,0.3))", animation: "re1CubeFloat 9s ease-in-out infinite", pointerEvents: "none" }} />
      )}
      <span style={{ position: "relative", fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 14, lineHeight: "20px", letterSpacing: 0.28, color: colour ? "rgba(255,255,255,0.5)" : TEXT_TERTIARY }}>Oct Cashflow</span>
      <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 32, width: "100%" }}>
        {/* "Nil · message": what will fill the card takes the legend's place */}
        <div style={{ flex: themed ? 1 : note ? `0 0 ${DASH2_GLANCE_NOTE_W}px` : "0 0 auto", minWidth: 0, display: "flex", flexDirection: "column", gap: 28 }}>
          {note ? (
            <span style={{ ...typography.headerH4, color: colour ? "#FFFFFF" : TEXT_PRIMARY }}>Nothing in or out yet</span>
          ) : flows.map((f) => (
            <div
              key={f.name}
              style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: f.dot }} />
                <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: colour ? "rgba(255,255,255,0.6)" : TEXT_TERTIARY }}>{f.name}</span>
              </div>
              {/* the figures are H2 24/32 (2886:86472), one register with the other cards */}
              <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 24, lineHeight: "32px", letterSpacing: 0.48, color: colour ? "#FFFFFF" : TEXT_PRIMARY, whiteSpace: "nowrap" }}>{inr(f.value)}</span>
            </div>
          ))}
        </div>
        {/* The grid fills the space beside the totals; the three 4px bars
            remain a centred group with fixed 12px gaps, each a SOLID column of
            its own tone (user call: the foot fade is gone), rounded 16 at the
            top, no head. Heights stay honest to the totals; the tallest
            takes the frame's 173. */}
        {!themed && <div style={{ position: "relative", flex: note ? `0 0 ${DASH2_GLANCE_NOTE_CHART_W}px` : 1, minWidth: 0, height: chartH, ...(note ? { marginLeft: "auto", marginRight: DASH2_GLANCE_NOTE_INSET, marginTop: -DASH2_GLANCE_NOTE_RISE } : {}) }}>
          {/* the rules, as heights over the baseline: from 20 at a 45 pitch, as
              many as fit — beside the message, all five scaled to its height */}
          {(note ? [20, 65, 110, 155, 200].map((y) => Math.round((y * chartH) / 212)) : [20, 65, 110, 155, 200].filter((y) => y <= chartH - 12)).map((y) => (
            <div key={y} aria-hidden style={{ position: "absolute", left: 0, right: 0, top: chartH - y, height: 1, backgroundImage: `repeating-linear-gradient(to right, ${OUTLINE_SUBTLE} 0 4px, transparent 4px 8px)` }} />
          ))}
          {/* keyed by the state, so a switch remounts the whole cluster and the
              bars grow in together — keyed by series alone, one that joined
              (Investments, going from in-and-out to Live) grew in by itself
              after the two already standing (user call) */}
          <div key={look} data-cashflow-glance-bars style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 12 }}>
            {bars.map((f, i) => {
              const v = valueOf(f.name)!;
              const nub = !note && v === 0;
              return (
              <div
                key={f.name}
                style={{
                  width: DASH2_BAR_W,
                  // beside the message the cluster's tallest stands where the live one does
                  height: note ? Math.round((DASH2_GLANCE_GHOST[i] / DASH2_GLANCE_GHOST[0]) * 173 * (chartH / 212)) : nub ? DASH2_GLANCE_NUB : Math.round(barMax * (v / peak)),
                  borderRadius: "16px 16px 0 0",
                  background: note || nub ? kit.track : f.tone,
                  // the same foot the drill's bars have (user call): all three
                  // settle into the baseline instead of ending on a hard line.
                  // A nub is too short to carry it and would fade to nothing.
                  ...(nub ? {} : { maskImage: DASH2_BAR_FOOT, WebkitMaskImage: DASH2_BAR_FOOT }),
                  transformOrigin: "bottom center",
                  animation: "re1v2BarGrow 640ms cubic-bezier(0.22, 1, 0.36, 1) 180ms both",
                  ...(note || nub ? {} : { ...kit.bar(f.tone), ...chart.bar(f.tone, DASH2_BAR_W) }),
                  flexShrink: 0,
                }}
              />
              );
            })}
          </div>
        </div>}
      </div>
    </div>
  );
}

// ── Home recurring spends, canon 2057:31944's 5th card ───────────────────────
// "Upcoming payments" (user calls, 2026-09-23/24; it read "Recurring spends"
// for a round): what is still to go out this month as the H2 figure, how many
// under it, a dashed rule, then each of them — the payments page has the whole
// list, paid ones included. It
// replaced R74's three calendar tiles (2886:86510) and the one-row, sentence
// and count-in-heading looks, which git keeps. The row is not dark-aware, so
// `dark` (an archived theme's) only darkens the card.
// All paid, the card says the month is done, laid out like the cashflow nil
// card with a simple tick in its chart's slot (user calls); no bills at all and
// the feed drops it.
function Dash2UpcomingListCard({ onOpen, dark }: { onOpen: () => void; dark?: boolean }) {
  const kit = useV2Skin();
  const allPaid = useDash2AllPaid();
  // every payment still to come is listed, and the figure is their total, so
  // the card's sum closes (user call); what's paid lives on the page
  const upcoming = DASH2_UPCOMING_PAYMENTS.filter((p) => !dash2Paid(p, allPaid));
  const due = upcoming.length > 0;
  const total = inr(upcoming.reduce((sum, p) => sum + p.amount, 0));
  const heading: React.CSSProperties = { position: "relative", fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 14, lineHeight: "20px", letterSpacing: 0.28, color: dark ? "rgba(255,255,255,0.5)" : TEXT_TERTIARY };
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upcoming payments details"
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className={kit.cardClass}
      style={{ ...kit.card("none", 20), ...(dark ? { background: "#090B0C", border: "none", borderRadius: 20, boxShadow: "0px 8px 32px rgba(0,0,0,0.18)" } : {}), position: "relative", overflow: "hidden", padding: due ? "24px 0" : "24px 0 20px", display: "flex", flexDirection: "column", gap: due ? 24 : 12, cursor: "pointer" }}
    >
      {/* 2886:86808-10: the canon's three small blue ellipses, at 5%, both modes */}
      {kit.wash && [-101, 2.57, 101.5].map((dx) => (
        <div key={dx} aria-hidden style={dash2Wash("#328FFE", 113.15, 110.57, `calc(50% + ${(dx - 56.57).toFixed(2)}px)`, "calc(50% - 56.78px)", { opacity: 0.05, filter: "blur(50px)" })} />
      ))}
      {due ? (<>
        <span style={{ ...heading, padding: "0 24px" }}>Upcoming payments</span>
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 4, padding: "0 24px" }}>
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 24, lineHeight: "32px", letterSpacing: 0.48, color: TEXT_PRIMARY }}>{total}</span>
          <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>{upcoming.length} upcoming transaction{upcoming.length === 1 ? "" : "s"}</span>
        </div>
        <div aria-hidden style={{ position: "relative", margin: "0 24px", borderTop: "1px dashed var(--dls-outline-bold)" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 16 }}>
          {upcoming.map((p) => <Dash2UpcomingRow key={p.name} pmt={p} style={{ padding: "0 24px" }} />)}
        </div>
      </>) : (<>
        {/* the cashflow nil card's layout (user call): the heading over a row
            of the headline at its 110 and, in the chart's slot (114 wide on
            the right padding, rising 39 over the row), a simple tick — the DLS
            check icon, for now (user call), at 64 so it carries the weight the
            nil card's ghost chart does, its tallest bar 70 (user call: bigger,
            in proportion), set 12 in from the card's right margin (user
            calls). No subtext (user call). */}
        <span style={{ ...heading, padding: "0 24px" }}>Upcoming payments</span>
        <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 32, padding: "0 24px" }}>
          <span style={{ ...typography.headerH4, color: TEXT_PRIMARY, flex: `0 0 ${DASH2_GLANCE_NOTE_W}px` }}>All done for this month</span>
          <div style={{ flex: `0 0 ${DASH2_GLANCE_NOTE_CHART_W}px`, marginLeft: "auto", marginTop: -DASH2_GLANCE_NOTE_RISE, height: DASH2_GLANCE_NOTE_H, display: "grid", placeItems: "center end" }}>
            <img src="/return-exp1/filter/check-on.svg" alt="" aria-hidden width={64} height={64} draggable={false} style={{ marginRight: DASH2_GLANCE_NOTE_INSET }} />
          </div>
        </div>
      </>)}
    </div>
  );
}

// ── Cashflow detail page (canon 2101:41393 "Analytics L1", R24) — v2 only ────
// Opened by tapping the Overview cashflow card: five months of inflow/outflow
// bar pairs (past greyed, the CURRENT month lit with a highlight band, future
// months as stubs), then Inflow and Outflow ledgers between divider bands.
// The title lives in the APP BAR ("‹ Cashflow" + a filter glyph), not the page.

// October world: honest ratios for the live month (in ₹50,000 → 176px, out
// ₹20,800 → 73px); the greyed history is texture at the canon's own heights.
// The strip is a CENTRE-SNAP month switcher (R25): whatever column rests in the
// centre IS the selected month; swiping changes it. Only past months are
// reachable — the scroll clamps with the live month centred, so the two future
// stubs stay visible texture at the right edge but can never take the centre.
/** The year, in RUPEES — the same numbers the heading and the rows read, so a
    bar's height and the figure above it can never disagree. The chart scales
    itself to the tallest real month (see Dash2MonthChart), which is what lets
    this be money instead of the pixel heights it used to be.

    A lumpy earner, not a salaried flat line (user call): a floor in the
    twenties with freelance and bonus months on top of it, so inflow runs
    ₹20,000 to ₹1.5L across the year (user call) and outflow follows it up.
    The middle of that range is filled rather than left empty: five months on
    screen at a time, so a year of spikes over a flat floor would draw most of
    them as unreadable nubs.
    October is the live month and is fixed by DASH2_IN_TXNS / DASH2_INVEST_TXNS
    and the category ledger — ₹50,000 in, ₹15,000 invested, ₹20,800 out.

    canon 2411:118534 keeps the history honest: months before investments
    arrived draw PAIRS at 20w; the trio starts with Jun. Stubs are pairs too,
    carry no value, and can never be selected (the strip clamps at the live
    month), so their figures are 0 rather than a placeholder. */
const DASH2_CF_MONTHS: { label: string; inflow: number; outflow: number; invest: number; stub?: boolean }[] = [
  { label: "Jan", inflow:  42000, outflow: 24000, invest:     0 },
  { label: "Feb", inflow:  78000, outflow: 31000, invest:     0 },
  { label: "Mar", inflow: 150000, outflow: 48000, invest:     0 },
  { label: "Apr", inflow:  55000, outflow: 26000, invest: 12000 },
  { label: "May", inflow:  20000, outflow: 15000, invest:  8000 },
  { label: "Jun", inflow: 110000, outflow: 38000, invest: 30000 },
  { label: "Jul", inflow:  64000, outflow: 29000, invest: 14000 },
  { label: "Aug", inflow: 135000, outflow: 55000, invest: 45000 },
  { label: "Sep", inflow:  92000, outflow: 33000, invest: 22000 },
  { label: "Oct", inflow:  50000, outflow: 20800, invest: 15000 },
  { label: "Nov", inflow: 0, outflow: 0, invest: 0, stub: true },
  { label: "Dec", inflow: 0, outflow: 0, invest: 0, stub: true },
];
const DASH2_CF_LIVE = 9; // Oct — the live month; everything after is future
/** A month with nothing invested drops the series entirely (user call): no
    bar, no column in the heading, no row in the ledger — and the two that
    remain spread into the space it leaves. Derived from the figure rather than
    a `pair` flag, so the chart can never draw a bar the ledger has no row for.
    (canon 2411:118534 called these PAIRS — months before investments arrived.)*/
const dash2HasInvest = (monthIdx: number) => DASH2_CF_MONTHS[monthIdx].invest > 0;
/** The month a LEAVING Investments figure keeps reading. It must not roll down
    to ₹0 on its way out — the number would change before the row or column is
    gone (user call) — so it holds the nearest month that did invest, which is
    the figure it was already showing. Backwards first (scrubbing off Oct onto
    the stubs holds Oct); the forward fallback covers Jan–Mar, which hold Apr's
    and so arrive already reading right. */
const dash2NearestInvest = (monthIdx: number) => {
  const back = DASH2_CF_MONTHS.slice(0, monthIdx + 1).findLastIndex(m => m.invest > 0);
  return back >= 0 ? back : DASH2_CF_MONTHS.findIndex(m => m.invest > 0);
};
const DASH2_CF_PITCH = 40 + 28; // column width + gap: one month of scroll travel
// How far past the last sample a flick is projected, and the glide that lands
// it: long enough to read as thrown, short enough that the months never feel
// like they are catching up with the finger.
const DASH2_CF_FLICK_MS = 180;
const DASH2_CF_GLIDE_MIN_MS = 280;
const DASH2_CF_GLIDE_MAX_MS = 600;
// A free scroll (trackpad, touch momentum) is "over" once it has been this
// quiet — then the strip glides onto the nearest month by itself.
const DASH2_CF_SETTLE_MS = 140;
// Every cashflow level closes its chart the same way: 20 between the month
// labels and the Divider/Big that opens the list (user call R58 — the levels
// had drifted to 16 / 36 / 52 and read as different pages).
const DASH2_CF_BAND_GAP = 20;

const DASH2_CF_GREEN = "#21BA54"; // the canon page's flow green
// The goal ring's own two blues (2658:47119) — canon values with no DLS token:
// the saturated run of the arc, and the head dot + its glow.
const RING_ARC = "#2388FF";
const RING_HEAD = "#328FFE";

// The month's flows (canon 2205:57302): Inflow on the green tint, Outflow on
// the red, Investments on the blue — the third line arrived with 2214:57905
// ("we have added investments in cashflow"). Live-month totals close against
// the home card (₹50,000 in, ₹20,800 out, ₹15,000 invested) and scale by the
// selected month's bar heights.
const DASH2_CF_FLOWS: { kind: "in" | "out" | "invest"; name: string; base: number; icon: string; tint: string; to: "cf-inflow" | "cf-outflow" | "cf-invest" }[] = [
  // in · invest · out — the same order the chart draws its bars in, so a row
  // and its bar are always the same distance from the left
  { kind: "in", name: "Inflow", base: 50000, icon: "money-bag", tint: "var(--dls-decor-subtle-green)", to: "cf-inflow" },
  { kind: "invest", name: "Investments", base: 15000, icon: "invest", tint: "var(--dls-decor-subtle-blue)", to: "cf-invest" },
  { kind: "out", name: "Outflow", base: 20800, icon: "pay-now", tint: "var(--dls-decor-subtle-red)", to: "cf-outflow" },
];


// ── Home layout54 cards (canon 2596:138449, was 2057:31944) ─────────────────
// The budget glance, the goal ring cards, the comet cashflow and the upcoming
// spends. All keep the refreshed L0 Large shell: translucent white on the white
// page, a black-5 hairline, the green-cast 6/16/8 shadow — dark mode keeps the
// tokenised card surface it already had (the vars split in globals.css).

const DASH2_CARD_SHELL: React.CSSProperties = {
  background: "var(--re1-v2-card-bg)",
  border: "1px solid var(--re1-v2-card-line)",
  boxShadow: "var(--re1-v2-card-shadow)",
  // ambient sets the var — everywhere else it resolves to none (no paint cost)
  backdropFilter: "var(--re1-v2-card-blur, none)",
  WebkitBackdropFilter: "var(--re1-v2-card-blur, none)",
  width: "100%",
};

// R74 (canon 2886:86407 / 2933:89513): each card's wash is the frame's own
// blurred ellipse — a radial from the card's colour to white, laid where the
// frame puts it (the budget's top-right, behind a goal's ring, off the
// cashflow's right edge, one under each upcoming column), at the frame's 7.5%
// (5% on the two wide ones) over a 54px (50px) gaussian, blending NORMALLY in
// both modes. The R48 screen blend and its mode-split opacities are retired:
// the dark frame draws the same asset at the same alpha.
const DASH2_CARD_WASH: React.CSSProperties = {
  position: "absolute",
  borderRadius: "50%",
  opacity: 0.075,
  filter: "blur(54px)",
  pointerEvents: "none",
};
/** The frame's wash ellipse: the card's colour draining to white, sized and
    placed per card (the frame's numbers, card-relative). */
const dash2Wash = (tone: string, w: number, h: number, left: string | number, top: string | number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  ...DASH2_CARD_WASH,
  width: w,
  height: h,
  left,
  top,
  background: `radial-gradient(50% 50% at 50% 50%, ${tone} 0%, #FFFFFF 100%)`,
  ...extra,
});

// ── Feed skins (R29 exploration, narrowed R29b) ──────────────────────────────
// Two treatments of the SAME feed — hierarchy, copy and card order are locked.
// "canon" is the shipped baseline; "aurora" wears frosted glass with VERY
// subtle mesh-gradient tints (user call: glass-like, colour barely-there).
// Every value rides tokens or color-mix, so both hold in light AND dark.
// Switched from the debug panel ("Feed skin").
type V2SkinId = "canon" | "ambient";
type V2SkinTint = "brand" | "blue" | "green" | "none";
type V2SkinKit = {
  id: V2SkinId;
  /** home-card shell (tint reserved for future skins; canon ignores it) */
  card: (tint?: V2SkinTint, canonRadius?: number) => React.CSSProperties;
  radius: number;
  /** progress / donut track */
  track: string;
  /** budget-bar track, when it differs from the ring track (ambient dark) */
  progressTrack?: string;
  /** head-bloom diameter for the budget bar + goal rings (canon: 73 / 45) */
  bloom?: number;
  progressH: number;
  donut: { width: number; cap: "round" | "butt"; glow?: string };
  /** glance-cluster bar restyle, laid over the canon bar */
  bar: (tone: string) => React.CSSProperties;
  /** budget progress fill restyle */
  fill: (base: React.CSSProperties) => React.CSSProperties;
  /** goal-ring hole art — replaces the percent readout (ambient, 2683:48642) */
  ringArt?: string;
  /** the arc is ONE solid colour with round caps and no head (canon
      2886:86441, R74); off, the arc melts in from the track and carries a head */
  solidArc?: boolean;
  /** the cards carry the frame's own wash ellipses (R74, was R36's full-card
      radial) INSTEAD of the head dots and blooms on the bar and the rings */
  wash?: boolean;
  /** class the CARDS take, so a dark surface flips the DLS tokens inside it */
  cardClass?: string;
  /** a denser feed: shorter cards, art at thumbnail size */
  dense?: boolean;
};
// Night/Compact/Aurora retired on user call (R31c) — git history keeps them.
// "ambient" (R33, canon 2683:48642) is the same layout on mode-split ambience:
// blush page by day / violet-black by night, charcoal-glass cards in dark (the
// .re1-ambient scope re-tints the shared shell vars), the goal OBJECT in the
// ring's hole, and white calendar tiles that stay white after dark.
const V2_SKINS: Record<V2SkinId, V2SkinKit> = {
  canon: {
    id: "canon",
    card: (_tint, canonRadius = 16) => ({ ...DASH2_CARD_SHELL, borderRadius: canonRadius }),
    radius: 16,
    track: "var(--dls-bg-disabled)",
    progressH: 4,
    donut: { width: 4, cap: "round" },
    bar: () => ({}),
    fill: (base) => base,
  },
  ambient: {
    id: "ambient",
    card: (_tint, canonRadius = 20) => ({ ...DASH2_CARD_SHELL, borderRadius: canonRadius }),
    radius: 20,
    track: "var(--re1-amb-track)",
    progressTrack: "var(--re1-amb-progress-track)",
    // R74 (canon 2886:86413): the frame's wash ellipses light the cards, so no
    // head dot or bloom rides the bar or the rings
    wash: true,
    // the bar is the canon's 4px solid green under an 8 radius (R33b's 2px and
    // the R69 melt retired, 2886:86428)
    progressH: 4,
    // the ring is the canon's 4px stroke, round-capped, one solid colour
    // (2886:86441; R33f's 2px and the R33e melt retired)
    donut: { width: 4, cap: "round" },
    solidArc: true,
    bar: () => ({}),
    fill: (base) => base,
    // dark cards wear a top-lit gradient rim instead of a uniform hairline
    cardClass: "re1-card-rim",
    ringArt: "/return-exp1/ambient/variants/gen_ring-flight.png",
  },
};
const V2SkinCtx = createContext<V2SkinKit>(V2_SKINS.canon);
const useV2Skin = () => useContext(V2SkinCtx);

// ── Chart styles (R29 exploration #2, deepened R29c) ─────────────────────────
// Five MATERIALS for the same bars + progress — representation never changes,
// but each treatment has its own anatomy and weight (user call: vary thickness,
// researched against 2026 fintech-dashboard + morphism references):
//   real    — skeuomorphic lit columns: chunky, cap highlight, floor shadow
//   glass   — glassmorphic slabs: thick, frosted, specular top edge
//   metal   — brushed cylinders: medium, hairline brushing + specular bands
//   minimal — lollipop: hairline stick under a terminal dot
//   graph   — technical: outlined columns with a 45° hatch fill
// Orthogonal to the feed skin; the canon treatment, kept as the single kit.
type V2ChartStyleId = "canon";
type V2ChartKit = {
  id: V2ChartStyleId;
  /** laid over a cluster/chart bar AFTER its canon styles; w = the canon width */
  bar: (tone: string, w: number) => React.CSSProperties;
  /** laid over the budget progress fill */
  fill: (tone: string) => React.CSSProperties;
  /** progress bar height + optional track restyle */
  progressH?: number;
  trackStyle?: React.CSSProperties;
};
// R29's five material variants were explored and dropped (user call): the canon
// bars ship. The kit stays as the seam, so a future material is one entry away.
const V2_CHARTS: Record<V2ChartStyleId, V2ChartKit> = {
  canon: { id: "canon", bar: () => ({}), fill: () => ({}) },
};
const V2ChartCtx = createContext<V2ChartKit>(V2_CHARTS.canon);
const useV2Chart = () => useContext(V2ChartCtx);



// Canon 2596:138449 (was 2180:54245) — "Oct Budget" + On Track tag, the big
// ₹ "left" figure, the green progress with its head dot + bloom, days + budget.
// ── Experimental budget card: the month as a glass cube (canon 2498:132873) ──
// The Figma cube is a flat render, so it cannot fill. This is a real CSS 3D
// cube — six faces on a preserve-3d stage — with a liquid box inside it whose
// height is the month's progress. The dichroic look is built from layered
// conic and radial gradients rather than a texture, so it holds at any size
// and the fill can rise through it.
const CUBE_S = 104; // user-directed: slightly smaller than the 116 it was drawn at
// The liquid box sits INSIDE the glass rather than flush against it. The 3px of clearance is
// what lets the slosh below tilt without a corner poking through a face: at the 3.2° cap a
// half-width of 52 crosses by 52·sin(3.2°) ≈ 2.9.
const LIQ_GAP = 3;
// Oct 8 of 31: the cube is a vessel for the MONTH, not the money, so it fills
// as the days go by and the figures underneath say where the money stands.
const OCT_MONTH_PROGRESS = 8 / 31;

/** One pane of glass. A deep indigo body that lights up at the bevels, two
    caustic pools, and above it a slow conic iridescence — smooth, the way a
    dichroic coating flares, with only a whisper of film banding on top. */
function CubeFace({ transform, w, h, background, dim, holo }: {
  transform: string; w: number; h: number; background: string; dim?: number; holo?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: w,
        height: h,
        marginLeft: -w / 2,
        marginTop: -h / 2,
        transform,
        background,
        // user-directed: rounder than the 3 it was cut at. A face is a flat pane, so the
        // roundness has to stay small enough that the three visible ones still meet at a
        // believable edge — past ~12 the cube starts reading as a pillow.
        borderRadius: 11,
        // directional bevel: the top catches the light, the sides barely, the
        // bottom not at all — no uniform outline anywhere
        boxShadow: [
          "inset 0 1.5px 0 rgba(255,255,255,0.5)",
          "inset 1.5px 0 0 rgba(255,255,255,0.2)",
          "inset -1.5px 0 0 rgba(255,255,255,0.14)",
          "inset 0 -1.5px 0 rgba(255,255,255,0.08)",
          "inset 0 0 36px rgba(120,180,255,0.28)",
        ].join(", "),
        opacity: dim ?? 0.95,
        backfaceVisibility: "visible",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "-18%",
          background: "conic-gradient(from 0deg at 44% 58%, rgba(255,60,200,0.9), rgba(255,210,60,0.85) 18%, rgba(60,255,180,0.8) 36%, rgba(60,196,255,0.9) 54%, rgba(150,60,255,0.85) 74%, rgba(255,60,200,0.9) 100%)",
          filter: "blur(20px)",
          mixBlendMode: "color-dodge",
          opacity: holo ?? 0.22,
          animation: "re1CubeHolo 14s linear infinite",
        }}
      />
      {/* the specular: one hard sweep of light across the pane */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(112deg, rgba(255,255,255,0) 22%, rgba(255,255,255,0.34) 44%, rgba(255,255,255,0.04) 56%, rgba(255,255,255,0) 72%)",
          mixBlendMode: "screen",
          opacity: 0.3,
        }}
      />
    </div>
  );
}

// The liquid SLOSHES rather than sitting still: one damped spring per tilt axis,
//
//     θ'' = −k·θ − c·θ' + drive
//
// integrated in rAF. The drive is the cube's own sway — specifically its angular
// ACCELERATION, which is what actually throws liquid about (coffee spills when the cup changes
// speed, not while it travels), so it is read off the same raised cosine re1CubeFloat uses and
// the two stay in step. k/c put ζ ≈ 0.26: underdamped, a few visible swings, then level.
// A press adds an impulse to the velocity, which is the part that reads unmistakably as mass.
//
// Deliberately NOT how the fill works. The fill is the card's actual data and stays a CSS
// transition, because a throttled pane starves rAF and the cube would simply appear full; if
// rAF never runs here the liquid just sits level, which is a degraded slosh, not a wrong level.
const SWAY_S = 9; // matches re1CubeFloat's 9s cycle
const SLOSH = {
  k: 42, // spring — ω₀ ≈ 6.5 rad/s, so a swing takes about a second
  c: 3.4, // damping — ζ ≈ 0.26
  drive: 80, // scales the sway's acceleration into ≈ 1.9° of steady lean
  kick: 18, // a press, in degrees/second of surface velocity
  max: 3.2, // the tilt the glass can hide, see LIQ_GAP
};

function useSlosh(kickRef: React.MutableRefObject<number>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const w = (2 * Math.PI) / SWAY_S;
    const st = { x: 0, vx: 0, z: 0, vz: 0 };
    let raf = 0;
    let last = performance.now();
    const t0 = last;
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); // capped, so a stalled tab can't blow up
      last = now;
      const t = (now - t0) / 1000;
      // ∝ d²/dt² of the sway's (0.5 − 0.5·cos wt); the z axis runs a quarter-cycle behind, so
      // the surface swirls instead of rocking flat
      const driveX = SLOSH.drive * Math.cos(w * t);
      const driveZ = SLOSH.drive * 0.6 * Math.cos(w * t + Math.PI / 2);
      if (kickRef.current) {
        st.vx += kickRef.current * SLOSH.kick;
        st.vz -= kickRef.current * SLOSH.kick * 0.7;
        kickRef.current = 0;
      }
      st.vx += (-SLOSH.k * st.x - SLOSH.c * st.vx + driveX) * dt;
      st.vz += (-SLOSH.k * st.z - SLOSH.c * st.vz + driveZ) * dt;
      st.x += st.vx * dt;
      st.z += st.vz * dt;
      const clamp = (v: number) => Math.max(-SLOSH.max, Math.min(SLOSH.max, v));
      // written straight to the node: a spring that re-rendered React every frame would cost
      // the whole card a commit 60 times a second for two numbers nothing else reads
      el.style.transform = `rotateX(${clamp(st.x).toFixed(3)}deg) rotateZ(${clamp(st.z).toFixed(3)}deg)`;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [kickRef]);
  return ref;
}

// The liquid tells the budget's STATE, not just the month (user call): healthy
// stays the aqua-violet, running hot goes amber, over budget goes red — the
// glass, bevels and holo never change, only what's inside.
type Dash2BudgetState = "ontrack" | "watch" | "over";
// glass = the pane's own tint (the shell drinks the liquid's colour, user call);
// bloomA/B = the light the cube throws on the card behind it.
const DASH2_LIQ_PALETTES: Record<Dash2BudgetState, { side: string; top: string; glow: string; glass: string; bloomA: string; bloomB: string }> = {
  ontrack: {
    side: `
    radial-gradient(120% 90% at 30% 110%, rgba(255,70,200,0.9), rgba(255,70,200,0) 62%),
    linear-gradient(180deg, rgba(190,235,255,0.95), rgba(90,120,255,0.95) 46%, rgba(120,60,255,0.92) 100%)`,
    top: `
    radial-gradient(120% 120% at 42% 38%, rgba(255,255,255,0.95), rgba(160,215,255,0.8) 38%, rgba(96,110,255,0.7) 100%)`,
    glow: "rgba(180,225,255,0.5)",
    glass: "70,100,255",
    bloomA: "rgba(120,90,255,0.75)",
    bloomB: "rgba(255,80,200,0.45)",
  },
  watch: {
    side: `
    radial-gradient(120% 90% at 30% 110%, rgba(255,120,50,0.9), rgba(255,120,50,0) 62%),
    linear-gradient(180deg, rgba(255,228,170,0.95), rgba(255,158,70,0.95) 46%, rgba(235,100,40,0.92) 100%)`,
    top: `
    radial-gradient(120% 120% at 42% 38%, rgba(255,255,255,0.95), rgba(255,212,150,0.8) 38%, rgba(255,140,80,0.7) 100%)`,
    glow: "rgba(255,208,150,0.55)",
    glass: "255,150,60",
    bloomA: "rgba(255,150,70,0.7)",
    bloomB: "rgba(255,205,95,0.4)",
  },
  over: {
    side: `
    radial-gradient(120% 90% at 30% 110%, rgba(255,50,150,0.95), rgba(255,50,150,0) 62%),
    linear-gradient(180deg, rgba(255,196,206,0.95), rgba(255,92,122,0.95) 46%, rgba(212,28,72,0.92) 100%)`,
    top: `
    radial-gradient(120% 120% at 42% 38%, rgba(255,255,255,0.95), rgba(255,168,185,0.8) 38%, rgba(255,92,122,0.7) 100%)`,
    glow: "rgba(255,150,170,0.6)",
    glass: "255,70,120",
    bloomA: "rgba(255,70,130,0.7)",
    bloomB: "rgba(255,125,95,0.4)",
  },
};

function Dash2BudgetCubeCard({ onOpen, fill, tone = "deep", state = "ontrack" }: { onOpen: () => void; fill: number; tone?: "deep" | "light"; state?: Dash2BudgetState }) {
  const light = tone === "light";
  // the liquid rises on arrival; a timeout rather than rAF, because throttled
  // panes starve rAF and the cube would simply appear full
  const [lvl, setLvl] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setLvl(fill), 220);
    return () => window.clearTimeout(t);
  }, [fill]);
  const kickRef = useRef(0);
  const sloshRef = useSlosh(kickRef);
  const S = CUBE_S;
  const LS = S - LIQ_GAP * 2; // the liquid's own box, clear of the glass
  const FLOOR = S / 2 - LIQ_GAP; // where that box rests inside the cube
  const h = Math.max(0.5, LS * lvl);
  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
  const liquidTrans = `transform 1500ms ${ease}, height 1500ms ${ease}`;
  // The panes are a tinted FILM that takes the LIQUID's colour (user call):
  // the body alphas sit near 0.2, so the level reads straight through, and the
  // tint follows the budget state with the rim glow carrying the glass identity.
  const LIQ = DASH2_LIQ_PALETTES[state];
  const G = LIQ.glass;
  const GLASS_TOP = `
    radial-gradient(110% 110% at 26% 14%, rgba(210,235,255,0.4), rgba(210,235,255,0) 46%),
    radial-gradient(150% 150% at 50% 50%, rgba(4,6,70,0) 48%, rgba(${G},0.24) 82%, rgba(225,240,255,0.42) 100%),
    linear-gradient(158deg, rgba(${G},0.3) 0%, rgba(${G},0.14) 62%, rgba(${G},0.22) 100%)`;
  const GLASS_LEFT = `
    radial-gradient(85% 60% at 10% 102%, rgba(255,40,170,0.38), rgba(255,40,170,0) 52%),
    radial-gradient(70% 52% at 62% 108%, rgba(40,255,190,0.3), rgba(40,255,190,0) 56%),
    radial-gradient(150% 150% at 50% 50%, rgba(4,6,70,0) 46%, rgba(${G},0.2) 80%, rgba(215,235,255,0.38) 100%),
    linear-gradient(198deg, rgba(${G},0.26) 0%, rgba(${G},0.12) 56%, rgba(${G},0.2) 100%)`;
  const GLASS_RIGHT = `
    radial-gradient(82% 66% at 98% 108%, rgba(255,196,40,0.38), rgba(255,196,40,0) 52%),
    radial-gradient(70% 56% at 54% 104%, rgba(255,70,190,0.34), rgba(255,70,190,0) 56%),
    radial-gradient(150% 150% at 50% 50%, rgba(4,6,70,0) 46%, rgba(${G},0.2) 80%, rgba(215,235,255,0.38) 100%),
    linear-gradient(158deg, rgba(${G},0.26) 0%, rgba(${G},0.12) 70%)`;
  const LIQ_SIDE = LIQ.side;
  const LIQ_TOP = LIQ.top;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Budget details"
      onClick={onOpen}
      onPointerDown={() => { kickRef.current = 1; }}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="transition-transform active:scale-[0.98]"
      style={{
        position: "relative",
        width: "100%",
        borderRadius: 20,
        overflow: "hidden",
        padding: "24px 24px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        alignItems: "center",
        cursor: "pointer",
        background: light ? BG_CARD : "linear-gradient(155deg, #0B63E5 0%, #0A4FD0 40%, #06308F 100%)",
        border: light ? `1px solid ${OUTLINE_SUBTLE}` : undefined,
        boxShadow: light ? "0px 2px 32px rgba(0,0,0,0.05)" : "0px 6px 16px 12px rgba(37,101,62,0.06)",
      }}
    >
      {/* the card's own light: the canon blob, then its grain */}
      {!light && <div aria-hidden style={{ position: "absolute", inset: "-18%", backgroundImage: "url(/return-exp1/budget-cube/bg.svg)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.85 }} />}
      {!light && <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "url(/return-exp1/budget-cube/grain.png)", backgroundSize: "512px 512px", mixBlendMode: "soft-light", opacity: 0.5 }} />}
      <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", width: "100%" }}>
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 14, lineHeight: "20px", letterSpacing: 0.28, color: light ? TEXT_TERTIARY : "#FFFFFF" }}>Oct Budget</span>
        <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "4px 8px 4px 6px", borderRadius: 12, background: light ? "var(--dls-ext-bg-subtle-positive)" : "rgba(0,0,0,0.6)" }}>
          <div aria-hidden style={{ width: 12, height: 12, backgroundColor: light ? GREEN_500 : "#FF4DD2", WebkitMaskImage: "url(/return-exp1/budget-cube/spark.svg)", maskImage: "url(/return-exp1/budget-cube/spark.svg)", WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" }} />
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 10, lineHeight: "12px", letterSpacing: 0.2, color: light ? GREEN_500 : "#FF4DD2" }}>23 days to go</span>
        </div>
      </div>

      {/* the cube: a preserve-3d stage, glass outside, liquid inside */}
      <div style={{ position: "relative", width: 189, height: 171, display: "grid", placeItems: "center", perspective: 780 }}>
        {/* the glow the cube throws: a wash behind it and a contact pool under it */}
        <div aria-hidden style={{ position: "absolute", left: "50%", top: "46%", width: 190, height: 190, marginLeft: -95, marginTop: -95, borderRadius: "50%", background: `radial-gradient(circle, ${LIQ.bloomA}, rgba(60,120,255,${light ? 0.1 : 0.3}) 45%, rgba(0,0,0,0) 72%)`, filter: "blur(26px)", opacity: light ? 0.45 : 1, transition: "background 800ms ease", pointerEvents: "none" }} />
        <div aria-hidden style={{ position: "absolute", left: "50%", top: "40%", width: 150, height: 150, marginLeft: -75, marginTop: -75, borderRadius: "50%", background: `radial-gradient(circle, ${LIQ.bloomB}, rgba(255,80,200,0) 68%)`, filter: "blur(30px)", opacity: light ? 0.45 : 1, transition: "background 800ms ease", pointerEvents: "none" }} />
        <div aria-hidden style={{ position: "absolute", left: "50%", bottom: 6, width: 150, height: 34, marginLeft: -75, borderRadius: "50%", background: light ? "radial-gradient(ellipse, rgba(90,110,220,0.28), rgba(90,110,220,0) 70%)" : "radial-gradient(ellipse, rgba(140,200,255,0.55), rgba(140,200,255,0) 70%)", filter: "blur(12px)", pointerEvents: "none" }} />
        <div
          style={{
            position: "relative",
            width: S,
            height: S,
            transformStyle: "preserve-3d",
            transform: "rotateZ(-7deg) rotateX(-19deg) rotateY(36deg)",
            animation: "re1CubeFloat 9s ease-in-out infinite",
          }}
        >
          {/* glass: back and the two hidden sides first, so sorting stays sane */}
          <CubeFace transform={`rotateY(180deg) translateZ(${S / 2}px)`} w={S} h={S} background={GLASS_LEFT} dim={0.3} holo={0.1} />
          <CubeFace transform={`rotateY(-90deg) translateZ(${S / 2}px)`} w={S} h={S} background={GLASS_RIGHT} dim={0.3} holo={0.1} />
          <CubeFace transform={`rotateX(-90deg) translateZ(${S / 2}px)`} w={S} h={S} background={GLASS_LEFT} dim={0.34} holo={0.1} />

          {/* the liquid box, anchored to the floor of the cube and pivoting there as it
             sloshes — a body of liquid rolls about its base, not its middle */}
          <div
            ref={sloshRef}
            style={{
              position: "absolute",
              inset: 0,
              transformStyle: "preserve-3d",
              transformOrigin: "50% 100%",
              willChange: "transform",
              pointerEvents: "none",
            }}
          >
            <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", animation: "re1LiqBob 5.5s ease-in-out infinite", pointerEvents: "none" }}>
            <div style={{ position: "absolute", left: "50%", top: "50%", width: LS, height: h, marginLeft: -LS / 2, marginTop: -h / 2, transform: `translateY(${FLOOR - h / 2}px) translateZ(${LS / 2}px)`, background: LIQ_SIDE, transition: liquidTrans, opacity: 0.96, borderRadius: 8, boxShadow: `0 0 20px ${LIQ.glow}` }} />
            <div style={{ position: "absolute", left: "50%", top: "50%", width: LS, height: h, marginLeft: -LS / 2, marginTop: -h / 2, transform: `translateY(${FLOOR - h / 2}px) rotateY(90deg) translateZ(${LS / 2}px)`, background: LIQ_SIDE, transition: liquidTrans, opacity: 0.96, borderRadius: 8 }} />
            <div style={{ position: "absolute", left: "50%", top: "50%", width: LS, height: h, marginLeft: -LS / 2, marginTop: -h / 2, transform: `translateY(${FLOOR - h / 2}px) rotateY(-90deg) translateZ(${LS / 2}px)`, background: LIQ_SIDE, transition: liquidTrans, opacity: 0.96, borderRadius: 8 }} />
            <div style={{ position: "absolute", left: "50%", top: "50%", width: LS, height: h, marginLeft: -LS / 2, marginTop: -h / 2, transform: `translateY(${FLOOR - h / 2}px) rotateY(180deg) translateZ(${LS / 2}px)`, background: LIQ_SIDE, transition: liquidTrans, opacity: 0.85, borderRadius: 8 }} />
            {/* the surface, and the bright meniscus where it meets the glass */}
            <div style={{ position: "absolute", left: "50%", top: "50%", width: LS, height: LS, marginLeft: -LS / 2, marginTop: -LS / 2, transform: `translateY(${FLOOR - h}px) rotateX(90deg)`, background: LIQ_TOP, backgroundSize: "160% 160%", animation: "re1LiqShimmer 7s ease-in-out infinite", transition: liquidTrans, boxShadow: `0 0 26px ${LIQ.glow}`, opacity: 0.95, borderRadius: 8 }} />
            </div>
          </div>

          {/* glass: the three faces you actually look through — kept airy so the
              liquid stays the subject (the film's own alphas do the tinting) */}
          <CubeFace transform={`translateZ(${S / 2}px)`} w={S} h={S} background={GLASS_LEFT} dim={0.85} holo={0.2} />
          <CubeFace transform={`rotateY(90deg) translateZ(${S / 2}px)`} w={S} h={S} background={GLASS_RIGHT} dim={0.85} holo={0.2} />
          <CubeFace transform={`rotateX(90deg) translateZ(${S / 2}px)`} w={S} h={S} background={GLASS_TOP} dim={0.9} holo={0.26} />
        </div>
      </div>

      <div style={{ position: "relative", width: 264, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 24, lineHeight: "32px", letterSpacing: 0.48, color: light ? TEXT_PRIMARY : "#FFFFFF" }}>₹15,200</span>
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: light ? TEXT_SECONDARY : "rgba(255,255,255,0.7)" }}>left</span>
        </div>
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: light ? TEXT_SECONDARY : "rgba(255,255,255,0.7)" }}>₹29,500</span>
      </div>
    </div>
  );
}


// ── The immersive home theme (canon 2496:131202, R30) ────────────────────────
// Every card wears the holo-render art: the budget cube, a liquid orb for the
// trip, slice-black glance/upcoming cards with an iridescent crystal.
// Grounds are CSS (sampled off the canon render); the crystal/rays are the
// canon's own exported renders in /return-exp1/theme54. The theme is
// self-coloured, so it reads the same in light and dark mode.
// The torus gauge and the Compact 3D pose retired on user call (R58) — git
// history keeps them.
/** Trip to Japan as holographic art ON THE WHITE CANON CARD (user call R30c:
    every card keeps the canon ground, the shape is the guest): the orb
    (2523:133631), floating over a soft tinted glow. */
function Dash2TripArtCard({ onOpen, ground = "white" }: { onOpen: () => void; ground?: "white" | "colour" }) {
  const colour = ground === "colour";
  // the orb is a liquid VESSEL (user call): its level rises to the goal's share
  // on arrival, same timing idiom as the cube (timeout, not rAF — throttle-safe)
  const [orbLvl, setOrbLvl] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setOrbLvl(0.65), 260);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Trip to Japan details"
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="transition-transform active:scale-[0.98]"
      style={{
        ...(colour ? {} : DASH2_CARD_SHELL),
        width: "100%",
        borderRadius: colour ? 20 : 16,
        position: "relative",
        overflow: "hidden",
        padding: "24px 24px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        cursor: "pointer",
        // colour ground = the canon 2496 card: dark olive gold under the orb,
        // with the light-rays texture
        ...(colour ? { background: "linear-gradient(180deg, #232712 0%, #1C1F10 85%)" } : {}),
      }}
    >
      {/* the art's glow on its ground */}
      <div aria-hidden style={{ position: "absolute", left: "50%", top: "46%", width: 280, height: 230, marginLeft: -140, marginTop: -115, background: colour ? "radial-gradient(50% 50% at 50% 50%, rgba(238,170,96,0.5), rgba(190,120,60,0.2) 60%, rgba(0,0,0,0) 78%)" : "radial-gradient(50% 50% at 50% 50%, rgba(255,170,120,0.35), rgba(255,140,180,0.14) 60%, rgba(255,255,255,0) 78%)", filter: "blur(20px)", pointerEvents: "none" }} />
      {colour && <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "url(/return-exp1/theme54/rays.png)", backgroundSize: "cover", backgroundPosition: "top center", mixBlendMode: "soft-light", opacity: 0.5, pointerEvents: "none" }} />}
      <span style={{ position: "relative", fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 14, lineHeight: "20px", letterSpacing: 0.28, color: colour ? "#FFFFFF" : TEXT_TERTIARY }}>Trip to Japan</span>
      {/* the orb is DRAWN, not re-blended (user call: the photo sandwich read
          as trash) — a glass ellipsoid built like the cube: dichroic rim
          light, a real liquid body rising inside the exact silhouette with a
          bright meniscus, caustics at the floor, a slow holo sheen, and hard
          speculars over the glass */}
        <div aria-hidden style={{ position: "relative", width: 238, height: 170, alignSelf: "center", animation: "re1CubeFloat 9s ease-in-out infinite" }}>
          <div
            style={{
              position: "absolute",
              left: 14,
              top: 10,
              width: 210,
              height: 150,
              borderRadius: "50%",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.45)",
              background:
                "radial-gradient(120% 120% at 30% 18%, rgba(255,255,255,0.55), rgba(255,205,240,0.14) 32%, rgba(190,130,255,0.1) 58%, rgba(255,175,225,0.28) 100%)",
              boxShadow:
                "inset 0 0 26px rgba(255,160,230,0.45), inset -10px -14px 34px rgba(190,90,255,0.4), inset 10px 12px 28px rgba(255,220,165,0.35), 0 18px 34px rgba(230,120,200,0.32)",
            }}
          >
            {/* the liquid, bobbing; the ellipse clip shapes its walls */}
            <div style={{ position: "absolute", inset: 0, animation: "re1LiqBob 5.5s ease-in-out infinite" }}>
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${orbLvl * 100}%`, transition: "height 1500ms cubic-bezier(0.22, 1, 0.36, 1)", background: "linear-gradient(180deg, rgba(255,203,233,0.92), rgba(225,131,255,0.94) 48%, rgba(167,91,255,0.95) 100%)", boxShadow: "0 0 26px rgba(255,150,225,0.6)" }}>
                {/* meniscus */}
                <div style={{ position: "absolute", left: "-6%", right: "-6%", top: -8, height: 16, borderRadius: "50%", background: "radial-gradient(50% 50% at 50% 50%, rgba(255,240,252,0.95), rgba(255,170,230,0.6) 70%, transparent)", filter: "blur(1.5px)" }} />
                {/* caustic: light focusing at the floor of the liquid */}
                <div style={{ position: "absolute", left: "22%", right: "22%", bottom: 4, height: 22, borderRadius: "50%", background: "radial-gradient(50% 50% at 50% 50%, rgba(255,235,190,0.55), transparent 75%)", filter: "blur(3px)" }} />
              </div>
            </div>
            {/* the slow dichroic sheen the cube's panes wear */}
            <div style={{ position: "absolute", inset: "-18%", background: "conic-gradient(from 0deg at 44% 58%, rgba(255,60,200,0.9), rgba(255,210,60,0.85) 18%, rgba(60,255,180,0.8) 36%, rgba(60,196,255,0.9) 54%, rgba(150,60,255,0.85) 74%, rgba(255,60,200,0.9))", filter: "blur(22px)", mixBlendMode: "color-dodge", opacity: 0.16, animation: "re1CubeHolo 14s linear infinite" }} />
          </div>
          {/* hard speculars over the glass */}
          <div style={{ position: "absolute", left: 14, top: 10, width: 210, height: 150, borderRadius: "50%", pointerEvents: "none", background: "radial-gradient(26% 18% at 30% 20%, rgba(255,255,255,0.85), transparent 70%), radial-gradient(7% 6% at 62% 14%, rgba(255,255,255,0.9), transparent 75%), radial-gradient(40% 22% at 50% 92%, rgba(255,255,255,0.2), transparent 75%)" }} />
        </div>
      <div style={{ position: "relative", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 24, lineHeight: "32px", letterSpacing: 0.48, color: colour ? "#FFFFFF" : TEXT_PRIMARY }}>₹84,500</span>
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: colour ? "rgba(255,255,255,0.7)" : TEXT_SECONDARY }}>saved of 1.3L</span>
        </div>
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: colour ? "rgba(255,255,255,0.7)" : TEXT_SECONDARY }}>65%</span>
      </div>
    </div>
  );
}

/** The budget card's bar — canon 2596:138449: a 4px SOLID fill under an 8px
    head dot, with a blurred green bloom riding the head (the tail-fade gradient
    retired). One component so the card stays the source of truth and the L1's
    hero can derive its bar from it (user call R39d). */
function Dash2ProgressBar({ pct, introFill }: { pct: number; introFill: boolean }) {
  const kit = useV2Skin();
  const chart = useV2Chart();
  const at = `${pct}%`;
  // "left to spend" REDUCES (user call R39f): the bar arrives full and settles
  // down to what's left, the head pair riding back from the full end with it.
  // The fill is always clipped by its track here, since it starts oversize.
  const ride = introFill ? { animation: `re1HeadRideBackX 900ms ${DASH2_MORPH_EASE} 250ms both` } : {};
  return (
    <div style={{ position: "relative" }}>
      {!kit.wash && (
        <div aria-hidden style={{ position: "absolute", left: at, top: "50%", width: kit.bloom ?? 73, height: kit.bloom ?? 73, margin: `${-(kit.bloom ?? 73) / 2}px 0 0 ${-(kit.bloom ?? 73) / 2}px`, borderRadius: "50%", background: `radial-gradient(circle, ${GREEN_500} 0%, #FFFFFF 100%)`, opacity: 0.3, filter: "blur(36px)", pointerEvents: "none", ...ride }} />
      )}
      <div style={{ position: "relative", height: chart.progressH ?? kit.progressH, borderRadius: 12, background: kit.progressTrack ?? kit.track, overflow: "hidden", ...chart.trackStyle }}>
        <div style={{ ...kit.fill({ width: at, height: "100%", borderRadius: 8, background: GREEN_500 }), ...chart.fill(GREEN_500), ...(introFill ? { transformOrigin: "0 50%", ["--re1-bar-full" as string]: (100 / pct).toFixed(4), animation: `re1BarShrinkX 900ms ${DASH2_MORPH_EASE} 250ms both` } : {}) }} />
      </div>
      {/* the head dot is the Original skin's; the canon bar ends flat under its
          8 radius (2886:86428, R74) */}
      {!kit.wash && (
        <div aria-hidden style={{ position: "absolute", left: at, top: "50%", width: 8, height: 8, margin: "-4px 0 0 -4px", borderRadius: "50%", background: GREEN_500, ...ride }} />
      )}
    </div>
  );
}

function Dash2BudgetCard({ onOpen }: { onOpen: () => void }) {
  const kit = useV2Skin();
  const introFill = DASH2_INTRO_FILL;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Budget details"
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className={`transition-transform active:scale-[0.99] ${kit.cardClass ?? ""}`}
      style={{ ...kit.card("green", 20), position: "relative", overflow: "hidden", padding: 24, display: "flex", flexDirection: "column", gap: 24, cursor: "pointer" }}
    >
      {/* 2886:86798: the card's own light — the frame's green ellipse in the
          top-right corner, clipped by the card */}
      {kit.wash && (
        <div aria-hidden style={dash2Wash(GREEN_500, 231.76, 145.54, 147.6, -0.29)} />
      )}
      <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 14, lineHeight: "20px", letterSpacing: 0.28, color: TEXT_TERTIARY }}>Oct Budget</span>
        <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "4px 8px 4px 6px", borderRadius: 12, background: "var(--dls-ext-bg-subtle-positive)" }}>
          <img src="/return-exp1/home54/spark-tag.svg" alt="" width={12} height={12} draggable={false} />
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 10, lineHeight: "12px", letterSpacing: 0.2, color: EXT_TEXT_POSITIVE }}>On Track</span>
        </div>
      </div>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 24, lineHeight: "32px", letterSpacing: 0.48, color: TEXT_PRIMARY }}>₹15,200</span>
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: TEXT_SECONDARY }}>left</span>
        </div>
        <Dash2ProgressBar pct={52} introFill={introFill} />
        {/* the footer reads Tertiary, like every card's subline (2886:86430) */}
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: TEXT_TERTIARY }}>
          <span>23 days to go</span>
          <span>₹14,300 spent</span>
        </div>
      </div>
    </div>
  );
}

/** The 93px ring chart both the goal cards and the tracking card wear: the
    canon's grey track, the arc whose gradient runs ALONG the sweep, and the
    head pair riding a rotator so dot and glow travel with the fill.

    The arc's fade keeps the canon's PHYSICAL length whatever the pct — the
    melt lives in the first ~8° off the tail and it is saturated by ~43°;
    stretching it across the sweep washed the arc out (R33e). The sweep angle
    is a REGISTERED property, so the opening can animate the conic 0 → value.
    Children render INSIDE the ring's hole. */
// L1 screens open in their settled state. The old progress-fill sweep was
// glitchy on mobile and added motion that does not communicate state.
const DASH2_INTRO_FILL = false;
function Dash2RingChart({ pct, introFill, arc = RING_ARC, head = RING_HEAD, children }: {
  pct: number; introFill: boolean; arc?: string; head?: string; children?: React.ReactNode;
}) {
  const kit = useV2Skin();
  const w = kit.donut.width;
  // the stroke's outer edge (plus its half-pixel feather) meets the 93 box, as
  // the canon's does at 4px (2886:86441: centreline r 44.5) — R74, was a fixed 43.5
  const r = 46 - w / 2;
  const sweep = (pct / 100) * 360;
  // full-strength band across the whole stroke, the anti-alias feather OUTSIDE
  // it (feathering inward read as a thinner stroke, R33e)
  const ringMask = `radial-gradient(circle at 50% 50%, transparent ${r - w / 2 - 0.5}px, #000 ${r - w / 2}px, #000 ${r + w / 2}px, transparent ${r + w / 2 + 0.5}px)`;
  const headAt: React.CSSProperties = { position: "absolute", left: 46.5, top: 46.5 - r };
  const grow = introFill ? { animation: `re1HeadGrow 1000ms ${DASH2_MORPH_EASE} 250ms both` } : {};
  const bloom = kit.bloom ?? 73;
  return (
    <div style={{ position: "relative", width: 93, height: 93, flexShrink: 0 }}>
      {children}
      <div aria-hidden style={{ position: "absolute", inset: 0, background: kit.track, WebkitMaskImage: ringMask, maskImage: ringMask }} />
      {/* solid (canon 2886:86441, R74): one colour end to end; otherwise the
          Original's melt — track → mid → arc over the first 8.2° / 43.2° */}
      <div aria-hidden style={{ position: "absolute", inset: 0, ["--re1-sweep" as string]: `${sweep}deg`, background: kit.solidArc
        ? `conic-gradient(from 0deg, ${arc} 0deg, ${arc} var(--re1-sweep), transparent var(--re1-sweep) 360deg)`
        : `conic-gradient(from 0deg, ${kit.track} 0deg, var(--re1-ring-mid) calc(var(--re1-sweep) * ${(Math.min(8.2, sweep * 0.19) / sweep).toFixed(4)}), ${arc} calc(var(--re1-sweep) * ${(Math.min(43.2, sweep) / sweep).toFixed(4)}), ${arc} var(--re1-sweep), transparent var(--re1-sweep) 360deg)`, WebkitMaskImage: ringMask, maskImage: ringMask, filter: kit.donut.glow, ...(introFill ? { animation: `re1RingSweepUp 1000ms ${DASH2_MORPH_EASE} 250ms both` } : {}) }} />
      {/* the round cap at the arc's TAIL — a stroke-wide dot on the 12 o'clock
          point (a conic cannot cap itself) */}
      {kit.solidArc && (
        <div aria-hidden style={{ ...headAt, width: w, height: w, margin: `${-w / 2}px 0 0 ${-w / 2}px`, borderRadius: "50%", background: arc, ...grow }} />
      )}
      {/* the head rides a ROTATOR (user call R34n): it sits at 12 o'clock and
          the wrapper turns 0 → sweep, so it travels in lockstep with the fill */}
      <div aria-hidden style={{ position: "absolute", inset: 0, transform: `rotate(${sweep}deg)`, pointerEvents: "none", ...(introFill ? { animation: `re1HeadRideSweep 1000ms ${DASH2_MORPH_EASE} 250ms both` } : {}) }}>
        {!kit.wash && (
          <div style={{ ...headAt, width: bloom, height: bloom, margin: `${-bloom / 2}px 0 0 ${-bloom / 2}px`, borderRadius: "50%", background: `radial-gradient(circle, ${head} 0%, ${ALPHA_WHITE_FF} 100%)`, opacity: 0.2, filter: "blur(36px)", ...grow }} />
        )}
        {/* solid: the arc's other round cap; melt: the Original's 8px head dot */}
        {kit.solidArc ? (
          <div style={{ ...headAt, width: w, height: w, margin: `${-w / 2}px 0 0 ${-w / 2}px`, borderRadius: "50%", background: arc, ...grow }} />
        ) : (
          <div style={{ ...headAt, width: 8, height: 8, margin: "-4px 0 0 -4px", borderRadius: "50%", background: head, ...grow }} />
        )}
      </div>
    </div>
  );
}

// Canon 2596:138449's goal card (was 2180:54270) — the stat beside a thin ring
// gauge: a 4px blue arc that MELTS into the track's grey at its tail, an 8px
// head dot, and a blurred bloom pinned to the head. The canon stacks the same
// card per goal, so one component serves the trip AND the phone goal.

/** The "Avatar" holder option (user call): the DLS bold avatar in the ring's
    hole — a flat disc in the card's tone, white glyph, no tilt — at the canon's
    48, or at 40 so more of the hole shows around it. A brand logo takes the
    whole face instead of the glyph, since it brings its own colour. */
function PlainRingAvatar({ icon, tone, size = 48, logo }: { icon: string; tone: string; size?: number; /** a tracked brand's mark, which replaces the tinted glyph */ logo?: string | null }) {
  const glyph = Math.round(size * 0.42); // the canon's 20-in-48
  return (
    <div data-re1-plain-avatar={size} aria-hidden style={{ position: "absolute", left: "50%", top: "50%", margin: -size / 2, width: size, height: size, borderRadius: "50%", background: logo ? undefined : tone, display: "grid", placeItems: "center" }}>
      {logo ? <BrandMark src={logo} size={size} /> : <span style={tintedGlyph(icon, "#FFFFFF", glyph)} />}
    </div>
  );
}

/** The "Bare glyph" holder option (canon 3115:92873): no holder at all — the
    glyph alone in the ring's hole, at the canon's 32 and in the tracker's own
    colour, so it reads as part of the arc rather than competing with it. A
    brand logo stands in at the same size, since a raster cannot be tinted. */
function PlainRingGlyph({ icon, tone, logo, size = 32 }: { icon: string; tone: string; logo?: string | null; size?: number }) {
  return (
    <div aria-hidden style={{ position: "absolute", left: "50%", top: "50%", margin: -size / 2, width: size, height: size, display: "grid", placeItems: "center", zIndex: 1 }}>
      {logo ? <BrandMark src={logo} size={size} /> : <span style={tintedGlyph(icon, tone, size)} />}
    </div>
  );
}

// the goal objects that ship a dark relight (GENERATED_ASSETS.md)
const DASH2_RING_DARK = new Set(["flight", "luggage", "passport", "globe"]);
function Dash2GoalRingCard({ onOpen, label, value, sub, pct, ariaLabel, art, introFill = DASH2_INTRO_FILL, tone, hole }: {
  onOpen: () => void; label: string; value: string; sub: string; pct: number; ariaLabel: string; art?: string;
  /** a goal that has just been set sweeps its ring up as the feed reveals it */
  introFill?: boolean;
  /** a tracker's ring wears the thing's own colour instead of the goal blue */
  tone?: string;
  /** what sits in the ring's hole when the goal object doesn't belong there */
  hole?: React.ReactNode;
}) {
  const kit = useV2Skin();
  // Travel objects plus the retained Holo glass treatment
  // (GENERATED_ASSETS.md); a per-card `art` still wins.
  const [ringArtRaw] = useProtoFlag("returnExp1V2RingArt");
  const [holderRaw] = useProtoFlag("returnExp1V2IconHolder");
  // the holders that replace the goal object outright rather than sit under it
  const swapsGoalObject = holderRaw === "glyph" || holderRaw.startsWith("avatar");
  // by night the opaque objects wear their dark relight (user call: the light
  // renders glared on the #151718 card); the holo plane is glass and needs none
  const dark = useTheme().mode === "dark";
  const flagArt = `/return-exp1/ambient/variants/gen_ring-${ringArtRaw}${dark && DASH2_RING_DARK.has(ringArtRaw) ? "-dark" : ""}.png`;
  const holeArt = kit.ringArt ? (art ?? flagArt ?? kit.ringArt) : undefined;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className={`transition-transform active:scale-[0.99] ${kit.cardClass ?? ""}`}
      style={{ ...kit.card("blue", 20), position: "relative", overflow: "hidden", padding: 24, display: "flex", gap: 16, alignItems: "center", cursor: "pointer" }}
    >
      {/* 2886:86802: the frame's blue ellipse behind the ring, clipped by the card */}
      {kit.wash && (
        <div aria-hidden style={dash2Wash("#328FFE", 208.15, 137.53, "calc(50% + 12.82px)", "calc(50% - 68.77px)")} />
      )}
      <div style={{ position: "relative", flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>
        {/* same title register as the budget card above (user call, R28) */}
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 14, lineHeight: "20px", letterSpacing: 0.28, color: TEXT_TERTIARY }}>{label}</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 24, lineHeight: "32px", letterSpacing: 0.48, color: TEXT_PRIMARY }}>{value}</span>
          {/* the subline is Tertiary (2886:86439), not the budget's "left" Secondary */}
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: TEXT_TERTIARY }}>{sub}</span>
        </div>
      </div>
      <Dash2RingChart pct={pct} introFill={introFill} arc={tone ?? RING_ARC} head={tone ?? RING_HEAD}>
        {hole}
        {/* ambient (2683:48642): the goal OBJECT sits in the ring's hole — a
            notch under the canon's 61, which crowded the ring (R33e) */}
        {!hole && holderRaw === "glyph" && <PlainRingGlyph icon="/return-exp1/icons/flight.svg" tone={BLUE_500} />}
        {!hole && holderRaw.startsWith("avatar") && <PlainRingAvatar size={holderRaw === "avatar-40" ? 40 : 48} icon="/return-exp1/icons/flight.svg" tone={BLUE_500} />}
        {!hole && !swapsGoalObject && holeArt && (
          <img src={holeArt} alt="" aria-hidden draggable={false} style={{ position: "absolute", left: "50%", top: "50%", width: 54, height: 54, margin: "-27px 0 0 -27px", pointerEvents: "none", zIndex: 1 }} />
        )}
        {!hole && !swapsGoalObject && !holeArt && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
            <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 16, lineHeight: "20px", letterSpacing: 0.32, color: TEXT_PRIMARY }}>{pct}%</span>
            <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: TEXT_SECONDARY }}>Saved</span>
          </div>
        )}
      </Dash2RingChart>
    </div>
  );
}

// ── The cashflow drill-down (canon 2186:54430, R26) ────────────────────────
// Cashflow → Outflow / Inflow → one category's spends → a single transaction.
// Every level above the transaction wears the same head: the big total, then the
// month strip. Amounts are the LIVE month's, scaled by the selected month's bar.

// Outflow splits into the categories we already budget against; the shares are
// the October world's own spend mix (₹14,300 across five categories, plus the
// ₹6,500 that goes to goals).
// pill = the row's share bar colour, straight from the canon palette
// (2165:49068: green/orange/pink/blue/olive, slate for the sixth).
const DASH2_OUT_CATS: { id: string; icon: string; name: string; amount: number; pill: string }[] = [
  { id: "food", icon: "food", name: "Food & drinks", amount: 6200, pill: "#FF8400" },
  { id: "shopping", icon: "shopping", name: "Shopping", amount: 3400, pill: "#F4789F" },
  // the trip is what the autopay feeds, so its glyph stands in here
  { id: "goals", icon: "flight", name: "Into goals", amount: 6500, pill: "#1F852F" },
  { id: "travel", icon: "flight", name: "Travel", amount: 2300, pill: "#2E90FF" },
  { id: "ent", icon: "tv", name: "Entertainment", amount: 1250, pill: "#70835E" },
  { id: "home", icon: "home", name: "Home", amount: 1150, pill: "#78808B" },
];

// Prototype monthly category patterns, Jan–Oct. These are independent spend
// histories (e.g. travel spikes versus steady goals), not scaled total outflow.
/** Each category's multiplier per month. These are not free: the six rows of a
    month must add up to that month's `outflow` above, because the drill shows
    them under the same bar. Each column keeps its old month-to-month character
    and is scaled to hit the month's total, with the drift from
    dash2CategoryTotal's rounding absorbed by the month's largest category. */
const DASH2_CATEGORY_MONTHS: Record<string, number[]> = {
  food: [1.1267, 1.6538, 2.2344, 1.1009, 0.7043, 1.8126, 1.6420, 2.1033, 1.6378, 1.0000],
  shopping: [1.7170, 1.2797, 2.2344, 2.0069, 0.4990, 1.9520, 0.9611, 3.1121, 1.7240, 1.0000],
  goals: [0.9811, 1.5751, 1.8620, 1.0321, 0.6085, 1.7397, 1.3349, 2.3594, 1.5834, 1.0000],
  travel: [0.7359, 0.7875, 3.7241, 1.2615, 1.4604, 1.2200, 1.7354, 4.5071, 1.1493, 1.0000],
  ent: [1.3491, 1.5751, 2.8965, 1.0321, 0.7302, 2.7885, 1.2014, 2.3609, 1.8676, 1.0000],
  home: [1.2264, 2.0673, 1.9655, 1.2615, 0.6085, 2.1785, 1.2014, 2.3609, 1.5085, 1.0000],
};
function dash2CategoryTotal(catId: string, monthIdx: number) {
  const cat = DASH2_OUT_CATS.find(c => c.id === catId) ?? DASH2_OUT_CATS[0];
  return Math.round(cat.amount * (DASH2_CATEGORY_MONTHS[cat.id]?.[monthIdx] ?? 0) / 10) * 10;
}

// The inflow page lists the month's actual CREDITS as transaction rows — not
// category shares (user call, R27).
const DASH2_IN_TXNS: { id: string; name: string; note: string; amount: number; tint: string }[] = [
  { id: "salary", name: "Salary", note: "1 Oct '26 · Bank transfer", amount: 48000, tint: DASH2_CF_GREEN },
  { id: "refund", name: "Refund", note: "4 Oct '26 · UPI", amount: 2000, tint: "#2E90FF" },
];

// The investments page mirrors it: the month's actual deployments, summing to
// the ledger's ₹15,000 (2214:57905 world).
const DASH2_INVEST_TXNS: { id: string; name: string; note: string; amount: number; tint: string }[] = [
  { id: "sip", name: "Mutual fund SIP", note: "2 Oct '26 · Autopay", amount: 10000, tint: "#5487D8" },
  { id: "stocks", name: "Stocks", note: "6 Oct '26 · UPI", amount: 5000, tint: "#2B6ACF" },
];

// One category's transactions. Food & drinks is the live example (₹6,200 over
// 18 orders, 11 of them delivery), so its rows carry the real merchants.
const DASH2_TXNS: Record<string, { id: string; name: string; note: string; amount: number; tint: string }[]> = {
  food: [
    { id: "swiggy", name: "Swiggy", note: "4 Oct '26 · UPI", amount: 1400, tint: "#FC8019" },
    { id: "social", name: "Social", note: "2 Oct '26 · Card", amount: 1250, tint: "#E23744" },
    { id: "blinkit", name: "Blinkit", note: "1 Oct '26 · UPI", amount: 980, tint: "#F8CB46" },
    { id: "zomato", name: "Zomato", note: "1 Oct '26 · UPI", amount: 870, tint: "#E23744" },
  ],
};
const DASH2_TXN_FALLBACK = [
  { id: "amazon", name: "Amazon", note: "3 Oct '26 · Card", amount: 1600, tint: "#FF9900" },
  { id: "myntra", name: "Myntra", note: "1 Oct '26 · UPI", amount: 1100, tint: "#FF3F6C" },
];

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// ── Setup's transaction picker (user call R43) ──────────────────────────────
// Adding an income source or a bill is not a thing you type: you point at the
// credit or the debit that already happened. Three months of history, so the
// search and the month filter both have something to do.
type PickTxn = { id: string; name: string; note: string; amount: number; month: string; tint: string };
const SETUP_PICK_TXNS: Record<"in" | "out", PickTxn[]> = {
  in: [
    { id: "i1", name: "Auto Industries", note: "1 Oct '26 · Bank transfer", amount: 29000, month: "Oct", tint: DASH2_CF_GREEN },
    { id: "i2", name: "Quess Corp", note: "1 Oct '26 · Bank transfer", amount: 26000, month: "Oct", tint: DASH2_CF_GREEN },
    { id: "i3", name: "Refund · Myntra", note: "4 Oct '26 · UPI", amount: 2000, month: "Oct", tint: "#2E90FF" },
    { id: "i4", name: "Auto Industries", note: "1 Sep '26 · Bank transfer", amount: 29000, month: "Sep", tint: DASH2_CF_GREEN },
    { id: "i5", name: "Quess Corp", note: "1 Sep '26 · Bank transfer", amount: 26000, month: "Sep", tint: DASH2_CF_GREEN },
    { id: "i6", name: "Rent from tenant", note: "5 Sep '26 · UPI", amount: 12000, month: "Sep", tint: "#5487D8" },
    { id: "i7", name: "Auto Industries", note: "1 Aug '26 · Bank transfer", amount: 29000, month: "Aug", tint: DASH2_CF_GREEN },
    { id: "i8", name: "Cashback", note: "9 Aug '26 · slice", amount: 340, month: "Aug", tint: VALENTINO_500 },
  ],
  out: [
    { id: "o1", name: "Rent", note: "5 Oct '26 · Bank transfer", amount: 11000, month: "Oct", tint: "#78808B" },
    { id: "o2", name: "Electricity", note: "8 Oct '26 · UPI", amount: 2351, month: "Oct", tint: "#F8CB46" },
    { id: "o3", name: "Netflix", note: "12 Oct '26 · Card", amount: 649, month: "Oct", tint: "#E23744" },
    { id: "o4", name: "Swiggy", note: "4 Oct '26 · UPI", amount: 1400, month: "Oct", tint: "#FC8019" },
    { id: "o5", name: "Rent", note: "5 Sep '26 · Bank transfer", amount: 11000, month: "Sep", tint: "#78808B" },
    { id: "o6", name: "Electricity", note: "8 Sep '26 · UPI", amount: 1980, month: "Sep", tint: "#F8CB46" },
    { id: "o7", name: "Airtel Postpaid", note: "14 Sep '26 · Autopay", amount: 799, month: "Sep", tint: "#E23744" },
    { id: "o8", name: "Rent", note: "5 Aug '26 · Bank transfer", amount: 11000, month: "Aug", tint: "#78808B" },
    { id: "o9", name: "Gym membership", note: "2 Aug '26 · Card", amount: 1500, month: "Aug", tint: "#2B6ACF" },
  ],
};
const SETUP_PICK_MONTHS = ["All", "Oct", "Sep", "Aug"];

/** The list setup opens: search at the top, the month filter under it, then
    every credit (income) or every debit (bills) you have. Canon 3057:92281 —
    it is an X-close page that RISES OVER the chat rather than a push inside
    the app's page stack (user pin: "this page should overlap. I see the two
    back chevrons intersecting"), and it takes as many rows as you tick, the
    footer counting them. */
function SetupTxnPicker({ flow, s, onClose, onAdd }: {
  flow: "in" | "out";
  s: number;
  onClose: () => void;
  onAdd: (rows: PickTxn[]) => void;
}) {
  const [q, setQ] = useState("");
  const [month, setMonth] = useState("All");
  const [picked, setPicked] = useState<string[]>([]);
  const rows = SETUP_PICK_TXNS[flow].filter(
    (t) => (month === "All" || t.month === month) && t.name.toLowerCase().includes(q.trim().toLowerCase()),
  );
  const noun = flow === "in" ? "credit" : "bill";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `translateY(${(1 - s) * 100}%)`,
        background: BG_PRIMARY,
        zIndex: 70,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <StatusBar backgroundColor="transparent" color={TEXT_PRIMARY} />
      {/* canon 3057:92292: the X closes it, and the title carries the count */}
      <div style={{ height: 64, display: "flex", alignItems: "center", gap: 12, padding: "0 12px", flexShrink: 0 }}>
        <ChromeChip flip={1} bare ariaLabel={`Close ${flow === "in" ? "Add income" : "Add bill"}`} onClick={onClose}>
          {(color) => <div aria-hidden style={tintedGlyph("/return-exp1/bill-picker/close.svg", color, 24)} />}
        </ChromeChip>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
          <span style={{ ...typography.headerH4, color: TEXT_PRIMARY }}>{flow === "in" ? "Add income" : "Add bill"}</span>
          {picked.length > 0 && <span style={{ ...typography.caption, color: TEXT_SECONDARY }}>{picked.length} Selected</span>}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", display: "flex", flexDirection: "column", paddingBottom: 24 }}>
      <div style={{ padding: `4px ${PAGE_GUTTER}px 12px`, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 16px", borderRadius: 100, background: BG_SECONDARY }}>
          <div aria-hidden style={{ ...tintedGlyph("/return-exp1/bill-picker/search.svg", TEXT_TERTIARY, 20), flexShrink: 0 }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={flow === "in" ? "Search your credits" : "Search your debits"}
            aria-label={flow === "in" ? "Search your credits" : "Search your debits"}
            style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", ...typography.bodySmall, color: TEXT_PRIMARY }}
          />
        </div>
        <div className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
          {SETUP_PICK_MONTHS.map((m) => {
            const on = m === month;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMonth(m)}
                className="transition-transform active:scale-[0.97]"
                style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 100, cursor: "pointer", border: `1px solid ${on ? "transparent" : OUTLINE_SUBTLE}`, background: on ? BTN_BG_GREY_DEFAULT : "transparent", ...typography.buttonSmall, color: on ? TEXT_PRIMARY : TEXT_SECONDARY }}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>
      <SectionBand text={flow === "in" ? "Credits" : "Debits"} />
      {rows.length === 0 && (
        <p style={{ ...typography.bodySmall, color: TEXT_TERTIARY, margin: 0, padding: `24px ${PAGE_GUTTER}px` }}>
          Nothing matches that. Try another month.
        </p>
      )}
      {rows.map((t) => {
        const on = picked.includes(t.id);
        return (
        <div
          key={t.id}
          role="checkbox"
          aria-checked={on}
          tabIndex={0}
          aria-label={`${t.name} ${inr(t.amount)}`}
          onClick={() => setPicked((p) => (on ? p.filter((id) => id !== t.id) : [...p, t.id]))}
          onKeyDown={(e) => e.key === "Enter" && setPicked((p) => (on ? p.filter((id) => id !== t.id) : [...p, t.id]))}
          className="transition-transform active:scale-[0.99]"
          // canon 3057:92285: a ticked row wears the subtle brand wash, nothing else
          style={{ display: "flex", alignItems: "center", gap: 12, padding: `12px ${PAGE_GUTTER}px`, cursor: "pointer", background: on ? EXT_BG_SUBTLE_MAIN : "transparent", transition: "background 160ms ease" }}
        >
          <div aria-hidden style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", background: `color-mix(in srgb, ${t.tint} 14%, transparent)`, color: t.tint, fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 16 }}>
            {t.name.charAt(0)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
            <span style={{ ...typography.bodyNormal, fontWeight: 500, color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
            <span style={{ ...typography.caption, color: TEXT_TERTIARY, whiteSpace: "nowrap" }}>{t.note}</span>
          </div>
          <span style={{ ...typography.bodyNormal, color: flow === "in" ? EXT_TEXT_POSITIVE : TEXT_PRIMARY, whiteSpace: "nowrap" }}>{inr(t.amount)}</span>
        </div>
        );
      })}
      </div>
      {/* canon 3057:92413 Button group: it arrives with the first tick, over a
          white footer whose shadow lifts it off the list */}
      {picked.length > 0 && (
        <div style={{ flexShrink: 0, padding: `16px ${PAGE_GUTTER}px 24px`, background: BG_PRIMARY, boxShadow: "0px -6px 8px 0px rgba(0,0,0,0.05)" }}>
          <button
            type="button"
            onClick={() => onAdd(SETUP_PICK_TXNS[flow].filter((t) => picked.includes(t.id)))}
            className="transition-transform active:scale-[0.98]"
            style={{ width: "100%", height: 48, border: "none", borderRadius: RADIUS_PILL, background: BTN_BG_PRIMARY_DEFAULT, color: TEXT_ON_COLOR_PRIMARY, ...typography.buttonNormal, cursor: "pointer" }}
          >
            {`Add ${picked.length} ${noun}${picked.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}

// The app bar carries each level's name — EXCEPT the inflow/outflow pages,
// whose canons (2165:50911 / 2165:49068) put the name in a centred page head
// under a bare back+filter bar.
const DASH2_BAR_TITLES: Partial<Record<DetailKind, string>> = {
  cashflow: "Cashflow",
  "cf-txn": "Transaction",
  "budget-history": "Budget history",
};
/** The detail kinds that are LEVELS of the shared cashflow page. */
const DASH2_CF_LEVELS: Partial<Record<DetailKind, Dash2Level>> = {
  cashflow: "all",
  "cf-inflow": "in",
  "cf-outflow": "out",
  "cf-invest": "invest",
  "cf-category": "cat",
};

/** How long the bar's name takes to clear on a level change. */
const DASH2_BAR_FADE = 170;
/** Levels whose bar carries the month subtitle — none since R33n (user call:
    one title only); the seam stays for a canon that brings it back. */
const DASH2_MONTH_SUB: DetailKind[] = [];
const DASH2_MONTH_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Which detail levels carry the filter funnel in the bar (all cashflow levels
// above the single transaction).
const DASH2_FILTER_KINDS: DetailKind[] = ["cashflow", "cf-outflow", "cf-inflow", "cf-invest", "cf-category"];

// ── The month chart every cashflow level shares ──────────────────────────────
// Canon 2205:57302 (the three-series Cashflow page) + 2165:50911 / 2165:49068
// (single-bar drill views). The dashed gridlines, the centre highlight band
// and the selector capsule are STATIC — the months slide beneath them, so the
// selection is always whatever rests in the centre.
// Colour story per 2214:57905: every series keeps its own tone everywhere —
// inflow green, investments blue, outflow red (sampled off the canon gradient
// exports) — and UNLIT columns drop to 12% opacity instead of the old grey
// swap, so a month lights up smoothly as it slides under the band. The drill
// views inherit the same tones (green in / red out — superseding the 2165-era
// charcoal/green) so the picked bar keeps its colour through the drill morph.
const DASH2_BAR_GREEN = "#41BD6F";
const DASH2_BAR_BLUE = "#5487D8";
const DASH2_BAR_RED = "#DA535A";
// R49 (user call: the cashflow L1 must never scroll): the chart gives up 68px —
// bars draw at 3/4 of their canon px (proportions intact), the label gap
// tightens 20 → 12, and the headroom above the tallest bar drops 48 → 32.
// The trio's own vertical scale, computed once from the data rather than from
// a tuned constant: the tallest bar any real month draws fills the chart, and
// every other bar is that many rupees below it. A fixed px-per-rupee could not
// survive a year whose fat months are nine times its lean ones.
const DASH2_TRIO_MAX = Math.max(1, ...DASH2_CF_MONTHS.filter(m => !m.stub).flatMap(m => [m.inflow, m.outflow, m.invest]));
const DASH2_CHART_H = 200;
const DASH2_MORPH_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
// Settled from the five-way exploration the debug panel used to carry (user
// call): 300ms on Soft — a long lead-in before anything moves, then one
// unhurried settle. Every part of the drill reads this, so a change here moves
// the heading, the bars, the average line and the ledger together.
const DASH2_MORPH_MS = 300;
const DASH2_MORPH_DELAY = 0;
const DASH2_MORPH_TIMING = `${DASH2_MORPH_MS}ms cubic-bezier(0.45, 0, 0.2, 1) ${DASH2_MORPH_DELAY}ms`;

// ── The ink softening that covers the figure's format flip ───────────
// ₹15K becomes ₹15,000 at DASH2_MORPH_FLIP of the clock, and the selected
// column softens around it so the substitution is not caught bare.
//
// The shape matters more than the depth. An earlier version dipped to a FLAT
// FLOOR and held it: that gave the eye three things to point at — the onset,
// the sustained floor, and the moment recovery began — and a held state is
// precisely what makes a moment locatable. You could time the swap against it.
//
// This is a raised cosine peaking exactly at the flip. Its slope is ZERO at
// the start, at the peak and at the end, so there is no onset to catch, no
// plateau to sit in, and nowhere the rate of change jumps. It is always either
// arriving or leaving, never holding, and it occupies the whole clock rather
// than a window inside it — so there is no "when" to find.
//
// Blur does the covering; opacity only keeps it reading as defocus rather than
// a glitch. Brightness is far easier to place in time than sharpness, so the
// opacity travel is deliberately small. Tune DIP_BLUR first.
// Almost at once (user call): the figure takes its full precision while it
// still has all its travelling to do, so the number that moves is the one you
// end up reading.
const DASH2_MORPH_FLIP = 0.12;
// The cover peaks LATER than the flip fires, on purpose. setTimeout schedules
// the state change, but React's re-render puts the new glyphs on screen ~21ms
// after it (measured, MutationObserver on the figure). Peaking at the timer
// would centre the cover ~21ms before the thing it is covering, so the peak is
// derived from the flip rather than tuned beside it — at 12% of a 300ms clock
// there is no room to be wrong by a frame.
const DASH2_INK_PEAK = Math.min(0.95, DASH2_MORPH_FLIP + 21 / DASH2_MORPH_MS);
const DASH2_INK_DIP_OPACITY = 0.9;
// Heavy (user call): the whole column goes soft through the middle.
const DASH2_INK_DIP_BLUR = 6.5;
// How much of a width change the run TRAVELS rather than takes in one frame.
// One budget for every scrubbed figure in the app — the bank balance and the
// cashflow heading (user call: make it 0.35, the bank's value, so the two
// scrubs feel the same).
//
// It is spent as horizontal scaleX, and the two things this figure does want
// opposite amounts of it:
//   SCRUBBING moves the value by a digit or two, so 0.35 is nearly free and
//   buys the variable-kerning travel that IS the gesture.
//   The compact->full FLIP on drill roughly doubles the width, and there the
//   same budget squashes hard — measured floors 0.35 -> scaleX 0.651
//   (visibly condensed), 0.22 -> 0.780, 0.15 -> 0.850.
// Held at the scrub's value because the scrub happens constantly and the flip
// happens once per drill, and DASH2_INK_PEAK already lays 3.2px of blur over
// exactly the frame the flip lands on.
const DASH2_FIGURE_DEFORM = 0.35;
// The cashflow heading no longer shares it. The paragraph above is the reason:
// the scrub and the drill FLIP want opposite amounts of this budget, and it was
// held at the scrub's value because the scrub happens constantly. The drill has
// now been judged on its own and takes half (user call) — travel without the
// visible condense. The bank balance, which only ever scrubs, keeps 0.35.
const DASH2_DRILL_STRETCH = 0.18;
// canon 2411:118645 does not sit the heading columns on exact fractions of the
// width — the outer two are pulled in by this much, shared out over however
// many columns the month has.
const DASH2_HEADER_INSET = 16;
// A PAIR is not in the canon — it is what is left on a month with nothing
// invested — and on the trio's fractions it read as two figures adrift at
// opposite ends (user call). They sit this far off the centre instead, close
// enough to read as one pair.
const DASH2_HEADER_PAIR = 64;
// The dropped column recedes rather than blinks (user call): it holds the
// centre slot and shrinks to this while it fades, so the pair closes OVER
// something that is visibly leaving.
// Scale and fade run together, one curve, one clock (user call) — split
// curves read as two separate events. Together they need DEPTH instead: on a
// shared curve the column is at half opacity when it is half way through the
// scale, so 0.85 spent its whole shrink under glyphs already too faint to
// measure it against. At 0.7 the number is a seventh smaller while it is still
// half there, which is the point at which the eye reads it as receding rather
// than blinking (user call, twice).
const DASH2_HEADER_GONE_SCALE = 0.7;
// Two collapsed stacks. The TRIO's is the canon's. The PAIR gets the room the
// dropped column leaves, so both its sizes lift by the same step — the label
// to the canon's own 14, which is where the SELECTED label already is, so it
// never has to shrink on drill — and the two line boxes sit 4 apart, half the
// selected stack's 8 (user call). Only the pair: at three columns the type
// stays exactly as it was. Lifting the label 4 as well keeps the block on the
// same optical centre, so the figure's Y never moves and the switch across the
// boundary is type growing in place.
const DASH2_HEADER_COMPACT = {
  trio: { label: 12, figure: 20, labelY: 14, figureY: 34 },
  pair: { label: 14, figure: 20 * (14 / 12), labelY: 10, figureY: 34 },
};
const dash2InkFrames = (blur: number) => Array.from({ length: 21 }, (_, i) => {
  const t = i / 20;
  // rise over [0, peak], fall over [peak, 1] — asymmetric, both half-cosines
  const phase = t <= DASH2_INK_PEAK
    ? (1 - Math.cos(Math.PI * (t / DASH2_INK_PEAK))) / 2
    : (1 + Math.cos(Math.PI * ((t - DASH2_INK_PEAK) / (1 - DASH2_INK_PEAK)))) / 2;
  return {
    offset: t,
    opacity: 1 - (1 - DASH2_INK_DIP_OPACITY) * phase,
    filter: `blur(${(blur * phase).toFixed(3)}px)`,
  };
});

const DASH2_INK_FRAMES = dash2InkFrames(DASH2_INK_DIP_BLUR);

/** True for the whole window the month strip is under a gesture — the drag,
    a free scroll, and the glide that lands it. Every figure on the level holds
    its vertical ROLL for that window and travels on the width spring alone:
    variable-kerning travel under the finger, which is the bank balance's scrub
    (user call). FluidText's `suppressRoll` gates only the roll, so characters
    still slide, arrive and leave while the gesture drives the value. A context
    because the heading and four kinds of row all need it, and threading a
    boolean through four row components to reach one span is not worth it. */
const Dash2ScrubCtx = createContext(false);

/** Chart variants: "all" is the cashflow trio; the rest are single-series drills. */
type Dash2ChartVariant = "all" | "in" | "out" | "invest" | "cat";

function Dash2ChartBar({ w, h, tone, dim, hide }: {
  w: number; h: number; tone: string; dim?: boolean; hide?: boolean;
}) {
  const chart = useV2Chart();
  // The comet is gone from this chart (user call R55a: "the thin one isn't
  // working, revert to the original"). R40 brought the home card's comet here
  // behind the L1-gauges flag and R50/R53 refined it; the bar shape is back to
  // the canon's plain column for both gauge settings, and the flag now
  // drives only the rings and the budget bar.
  return (
    <div
      style={{
        width: hide ? 0 : w,
        height: h,
        borderRadius: "16px 16px 0 0",
        // One block of its own colour (user call — the old full-height fade to
        // transparent is not coming back), but it must not END on a hard line:
        // the foot softens over the last quarter so the bar settles into the
        // baseline instead of being cut off by it (user call). A mask, not a
        // gradient fill, so the colour stays one value and the softening is
        // only alpha — and a proportion rather than a px ramp, so a short bar
        // is the same shape as a tall one and not all fade.
        backgroundColor: tone,
        maskImage: DASH2_BAR_FOOT,
        WebkitMaskImage: DASH2_BAR_FOOT,
        // An unlit month has to READ unselected (user call). It used to fade a
        // downward gradient, so 0.4 of it was already faint by the middle; now
        // that every knob is solid to the foot, the same 0.4 held its colour
        // the whole way up and the strip read as several months lit at once.
        // A quarter recedes properly and still counts — it is not the canon's
        // 12%, which read as switched off (user call R55a).
        opacity: hide ? 0 : dim ? 0.25 : 1,
        // the air between neighbours (user call), half on each bar — which is
        // what keeps a lone drill bar centred and collapses with a hidden one
        marginInline: hide ? 0 : DASH2_BAR_GAP / 2,
        flexShrink: 0,
        // the widen waits out the bar-title fade, then takes its time — the
        // picked series growing IS the transition's subject (R28)
        transition: `width ${DASH2_MORPH_TIMING}, height ${DASH2_MORPH_TIMING}, opacity ${DASH2_MORPH_TIMING}, margin ${DASH2_MORPH_TIMING}`,
        ...(hide ? {} : chart.bar(tone, w)),
        ...(hide ? { width: 0 } : {}),
      }}
    />
  );
}

function Dash2MonthChart({ variant, categoryId, selIdx, onSelIdx, scrub, height = DASH2_CHART_H, onDrill }: {
  variant: Dash2ChartVariant;
  categoryId?: string;
  selIdx: number;
  onSelIdx: (i: number) => void;
  /** The overview only: tapping a bar of the lit month opens that series, the
      same drill its row below and its figure above open (user report: people
      tap the bars, not the head or the rows). */
  onDrill?: (kind: "cf-outflow" | "cf-inflow" | "cf-invest") => void;
  /** The level's scrub window (app/lib/scrub). The strip opens it on the first
      movement; the glide that lands the months closes it. */
  scrub: Scrub;
  height?: number;
}) {
  const baseline = height - 36;
  // ONE instance serves every cashflow level (see Dash2CashflowLevel), so a
  // level change is a prop change on live nodes: the picked series widens to
  // the trio's whole span and the other two collapse to 0. The remaining series also expands onto
  // its own vertical scale; the same live nodes interpolate both dimensions.
  // Fluid drag physics, no CSS snap: press-drag tracks 1:1, release projects
  // the flick ~180ms out and GLIDES onto the nearest reachable month, and any
  // free scroll (trackpad, touch momentum) settles the same way once it idles.
  // The asymmetric pads clamp the scroll with the live month centred, so the
  // future stubs stay visible texture that can never take the centre.
  const stripRef = useRef<HTMLDivElement>(null);
  // `dragging` is the CURSOR's business (grab vs grabbing) and is true only
  // under a held mouse. The scrub WINDOW is wider — free scroll and the glide
  // are part of the gesture too — so the two are not interchangeable.
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; sl: number } | null>(null);
  // a mouse press that travelled is a drag, and its click must not also tap
  const dragMoved = useRef(false);
  const velocity = useDragVelocity();
  // true only while OUR glide is writing scrollLeft, so the scroll events it
  // causes are never mistaken for the user moving the strip again
  const gliding = useRef(false);
  // A finger never reaches the drag below — on touch the strip scrolls
  // NATIVELY, which is what gives it its momentum — so `dragStart` stays null
  // and the landing had nothing to tell it a gesture was still live. Any pause
  // longer than the settle fired a glide UNDER the finger, and from there our
  // rAF and the browser's own scrolling wrote scrollLeft on alternate frames:
  // measured 313 → 337 with the finger still and not moving, then 337, 346,
  // 339, 347, 340, 347 once it moved again (user report: it stutters when you
  // slide one way and suddenly switch sides — a reversal always contains a
  // pause). This is the finger's half of `dragStart`, and it has to come off
  // TOUCH events: the browser fires pointercancel the moment native scrolling
  // takes the gesture over, so a pointer-based flag would clear itself exactly
  // when it is needed.
  const touching = useRef(false);
  // every method is stable, so everything built on them is too — which is what
  // lets the once-mounted listener below close over them safely
  const { begin, end, frame, settle, cancel } = scrub;
  const stopGlide = useCallback(() => { cancel(); gliding.current = false; }, [cancel]);
  const glideTo = useCallback((target: number) => {
    const el = stripRef.current;
    if (!el) return;
    stopGlide();
    const from = el.scrollLeft;
    const dist = target - from;
    if (Math.abs(dist) < 0.5) { el.scrollLeft = target; end(); return; }
    const dur = Math.min(DASH2_CF_GLIDE_MAX_MS, Math.max(DASH2_CF_GLIDE_MIN_MS, Math.abs(dist) * 1.4));
    const t0 = performance.now();
    gliding.current = true;
    const tick = () => {
      const t = Math.min(1, (performance.now() - t0) / dur);
      el.scrollLeft = from + dist * (1 - Math.pow(1 - t, 3));
      if (t < 1) { frame(tick); return; }
      gliding.current = false;
      end();
    };
    frame(tick);
  }, [stopGlide, end, frame]);
  const nearestMonth = (sl: number) =>
    Math.max(0, Math.min(DASH2_CF_LIVE, Math.round(sl / DASH2_CF_PITCH))) * DASH2_CF_PITCH;
  const endDrag = () => {
    const el = stripRef.current;
    if (!dragStart.current || !el) return;
    dragStart.current = null;
    setDragging(false);
    glideTo(nearestMonth(el.scrollLeft - velocity.project(DASH2_CF_FLICK_MS)));
  };
  const endTouch = (e: React.TouchEvent) => {
    // one of several fingers lifting is not the end of the gesture
    if (e.touches.length) return;
    touching.current = false;
    const el = stripRef.current;
    if (!el) return;
    // Momentum may still be running, and every scroll it makes re-arms this.
    // If it is not, this is the only thing left to land the strip — no scroll
    // event follows a finger that lifts while already still.
    settle(DASH2_CF_SETTLE_MS, () => glideTo(nearestMonth(el.scrollLeft)));
  };
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    // open on the month the level was entered with (a layout effect, not rAF —
    // throttled tabs starve rAF)
    el.scrollLeft = selIdx * DASH2_CF_PITCH;
    const onScroll = () => {
      onSelIdx(Math.max(0, Math.min(DASH2_CF_LIVE, Math.round(el.scrollLeft / DASH2_CF_PITCH))));
      // the glide is ours, not a gesture — it CLOSES the window, so it must
      // never reopen it
      if (!gliding.current) begin();
      if (dragStart.current || touching.current || gliding.current) return;
      settle(DASH2_CF_SETTLE_MS, () => glideTo(nearestMonth(el.scrollLeft)));
    };
    // A wheel takes the strip off our glide. It may produce no horizontal
    // scroll at all (a vertical wheel over the chart, or one into the clamp),
    // and then no scroll event follows — so arm the landing here rather than
    // relying on one, or the strip stops between months and the scrub window
    // never closes.
    const onWheel = () => {
      stopGlide();
      settle(DASH2_CF_SETTLE_MS, () => glideTo(nearestMonth(el.scrollLeft)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: true });
    // the scrub's own handles are torn down by useScrub; only the listeners
    // are ours to remove
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Drill values come from the SAME ledger as the heading, in rupees. Using
  // category rupees with the overview's pixel scale previously overflowed the
  // chart and made averages disagree with the selected category.
  const values = DASH2_CF_MONTHS.map((_, i) => variant === "cat"
    ? dash2CategoryData(categoryId ?? "food", i).total
    : dash2FlowData(variant === "all" ? "out" : variant, i).total);
  const realValues = values.filter((_, i) => !DASH2_CF_MONTHS[i].stub);
  const scale = (baseline - 16) / Math.max(1, ...realValues);
  const trioScale = (baseline - 16) / DASH2_TRIO_MAX;
  const average = realValues.reduce((sum, value) => sum + value, 0) / realValues.length;
  const avgHeight = average * scale;
  const avgK = Math.round(average / 100) / 10;
  // What each month cell draws, in the canon's series order (in · invest · out).
  // Single-series views render the SAME three nodes with the off-series bars
  // collapsed, so the drill morph is pure CSS transitions on live elements.
  const series = (m: (typeof DASH2_CF_MONTHS)[number]) => [
    { key: "in", tone: DASH2_BAR_GREEN, px: m.inflow, pick: variant === "in" },
    { key: "invest", tone: DASH2_BAR_BLUE, px: m.invest, pick: variant === "invest" },
    { key: "out", tone: variant === "cat" ? (DASH2_OUT_CATS.find(c => c.id === categoryId)?.pill ?? DASH2_BAR_RED) : DASH2_BAR_RED, px: m.outflow, pick: variant === "out" || variant === "cat" },
  ];
  const trio = variant === "all";
  // The line's Y must not TRAVEL while it is entering or leaving. The overview
  // has no average of its own — the figure there is the outflow's — so crossing
  // the boundary moved the line about 7 down at the same moment the entrance
  // lifts it 8. The two cancelled and the move read as inverted (user call).
  // Leaving, it holds the Y of the level it came from and only sinks and fades.
  // Entering, it takes the new Y in a single frame, unseen, because the
  // crossing render leaves `top` out of the transition list. Between two drill
  // levels nothing is crossing and the Y travels as it always did.
  const liveY = baseline - Math.round(avgHeight);
  const [parked, setParked] = useState({ trio, y: liveY });
  // The extra render is the POINT: the crossing one has to commit with `top`
  // out of the transition list, so this cannot become a render-phase update —
  // React would throw that render away and commit the settled one, and the Y
  // would travel again. One render per level change, bounded.
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    if (trio) {
      if (!parked.trio) setParked(p => ({ trio: true, y: p.y }));
      return;
    }
    if (parked.trio || parked.y !== liveY) setParked({ trio: false, y: liveY });
  }, [parked, trio, liveY]);
  /* eslint-enable react-hooks/set-state-in-effect */
  const crossing = parked.trio !== trio;
  const avgY = trio ? parked.y : liveY;
  return (
    <div data-cashflow-chart style={{ position: "relative", height, margin: `0 ${PAGE_GUTTER}px` }}>
      {/* the lit month's soft column + the selector capsule — both pinned to the
          centre (band 48 wide per 2205:57324). The band paints FIRST (user call
          R60): it sits behind the gridlines, which run over it unbroken. */}
      <div aria-hidden style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: -16, height: baseline + 16, width: 48, borderRadius: 4, background: "var(--re1-cf-band)" }} />
      {/* dashed gridlines — static, canon Black a10 */}
      <svg width="100%" height={baseline - 28} viewBox="0 0 312 196" preserveAspectRatio="none" style={{ position: "absolute", top: 8, left: 0 }} aria-hidden>
        {[0, 49, 98, 147, 196].map((y) => (
          <line key={y} x1="0" x2="312" y1={y} y2={y} stroke="var(--dls-outline-bold)" strokeDasharray="3 5" />
        ))}
      </svg>
      {/* the month highlight: a static capsule at the centre of the LABEL row —
          the sliding labels pass through it, so whichever month rests in the
          centre reads selected */}
      <div aria-hidden style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: height - 24, height: 24, width: 47, borderRadius: 16, background: BG_SECONDARY }} />
      {/* The line lands with the page and only ever moves in Y after that:
          the same node stays alive across drill/category changes so their
          averages readjust, and a remount (back from a transaction) must not
          replay a rise the page slide already covers (user call; the same rule
          the head and body follow through levelSeq).
          The overview carries no average, so drilling down from it INTRODUCES
          the line and going back RETIRES it — and going back has to be the
          rise played backwards (user call), which a one-shot keyframe cannot
          do. So the node never unmounts: it holds the trio's state (down 8,
          transparent) and transitions either way. A remount still cannot
          replay anything — it mounts already at whichever end it belongs
          on, and a transition needs a change. */}
      <div data-cashflow-average aria-hidden={trio} style={{ position: "absolute", left: 0, right: 0, top: avgY, height: 1, zIndex: 2, pointerEvents: "none", opacity: trio ? 0 : 1, transform: `translateY(${trio ? 8 : 0}px)`, transition: (crossing ? ["opacity", "transform"] : ["top", "opacity", "transform"]).map(p => `${p} ${DASH2_MORPH_TIMING}`).join(", ") }}>
          <div aria-hidden style={{ position: "absolute", left: -PAGE_GUTTER + 8, right: -PAGE_GUTTER, top: 0, height: 1, background: "#B4BFCB" }} />
          <div
            style={{
              position: "absolute",
              left: -PAGE_GUTTER + 8,
              top: -10,
              zIndex: 2,
              pointerEvents: "none",
              background: "#7E7E7E",
              borderRadius: 16,
              padding: "4px 8px",
              fontFamily: "var(--font-rubik), sans-serif",
              fontWeight: 400,
              fontSize: 10,
              lineHeight: "12px",
              letterSpacing: 0.4,
              textTransform: "uppercase",
              color: "#FFFFFF",
              whiteSpace: "nowrap",
            }}
          >
            Avg {avgK}K
          </div>
      </div>
      {/* the sliding months */}
      <div
        ref={stripRef}
        className="no-scrollbar"
        /* the finger's own down/up, because pointer events are cancelled out
           from under a native scroll */
        onTouchStart={() => { touching.current = true; stopGlide(); }}
        onTouchEnd={endTouch}
        onTouchCancel={endTouch}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") return;
          const el = stripRef.current;
          if (!el) return;
          stopGlide();
          dragStart.current = { x: e.clientX, sl: el.scrollLeft };
          dragMoved.current = false;
          velocity.start(e.clientX);
          setDragging(true);
          begin();
          try { el.setPointerCapture(e.pointerId); } catch {}
        }}
        onPointerMove={(e) => {
          const d = dragStart.current;
          const el = stripRef.current;
          if (!d || !el) return;
          velocity.move(e.clientX);
          if (Math.abs(e.clientX - d.x) > 4) dragMoved.current = true;
          el.scrollLeft = d.sl - (e.clientX - d.x);
        }}
        /* A tap on a month. Resolved from the point, not e.target: a mouse
           press captures the pointer on the strip, so its click lands on the
           strip itself. A touch that scrolled fires no click at all. */
        onClick={(e) => {
          if (dragMoved.current) return;
          const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-cf-hit]");
          if (!hit) return;
          const i = Number(hit.dataset.month);
          // an unlit month comes to the centre first; the lit one opens its bar
          if (i !== selIdx) glideTo(i * DASH2_CF_PITCH);
          else onDrill?.(DASH2_CF_FLOWS.find((f) => f.kind === hit.dataset.series)!.to);
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        /* capture can be lost without either of those; the drag has still
           ended, and only endDrag clears dragStart and lands the strip */
        onLostPointerCapture={endDrag}
        style={{
          // full-bleed: the months slide edge to edge of the SCREEN (the grid
          // stays on the 312 content box); the centre pads are width-relative,
          // so the scrollLeft ↔ month mapping is unchanged.
          position: "absolute",
          top: 0,
          bottom: 0,
          left: -PAGE_GUTTER,
          right: -PAGE_GUTTER,
          display: "flex",
          gap: 28,
          alignItems: "flex-end",
          overflowX: "auto",
          overscrollBehaviorX: "contain",
          scrollbarWidth: "none",
          cursor: dragging ? "grabbing" : "grab",
          userSelect: "none",
          // % padding resolves against the 312 CONTAINER (the containing block),
          // not this full-bleed scroller — +4/−132 lands the true half-viewport
          // pads (W/2−20 left so Jan can centre, W/2−156 right so the live month
          // is the last centreable one, Dec resting 24 in from the edge).
          padding: "0 calc(50% - 132px) 0 calc(50% + 4px)",
        }}
      >
        {DASH2_CF_MONTHS.map((m, i) => {
          const on = i === selIdx;
          // one tap column per bar drawn, over the bars' whole height
          const hits = m.stub ? [] : series(m).filter((s) => (trio ? s.px > 0 : s.pick));
          return (
            <div key={m.label} style={{ position: "relative", alignSelf: "stretch", justifyContent: "flex-end", width: 40, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              {/* The bars are 8 wide, so they get columns instead. The layer
                  spans the month's whole pitch (half the gap each side) and
                  stops above the label. The outer columns flex and the inner
                  ones are one bar box wide, so every boundary falls midway
                  between two bars: a tap ON a bar always gets that bar. */}
              {hits.length > 0 && (
                <div aria-hidden style={{ position: "absolute", top: 0, bottom: 24, left: -(DASH2_CF_PITCH - 40) / 2, right: -(DASH2_CF_PITCH - 40) / 2, zIndex: 1, display: "flex" }}>
                  {hits.map((s, j) => (
                    <div
                      key={s.key}
                      data-cf-hit
                      data-month={i}
                      data-series={s.key}
                      style={{
                        flex: j === 0 || j === hits.length - 1 ? 1 : `0 0 ${DASH2_TRIO_BAR_W + DASH2_BAR_GAP}px`,
                        cursor: on && onDrill && !dragging ? "pointer" : undefined,
                      }}
                    />
                  ))}
                </div>
              )}
              {/* every view draws the same three series nodes (in · invest ·
                  out — canon 2205:57302); the drills collapse the off-series
                  bars, so the ledger-row morph animates on live elements. Stubs
                  follow the trio too (the canon's pair stubs predate the third
                  series). */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                {series(m).map((s) => (
                  <Dash2ChartBar
                    key={s.key}
                    /* One width across the TRIO, the L0 cashflow card's own line (user
                       call), and a month with nothing invested draws that same bar as
                       every other month — width never reports what is missing. The
                       drill is the exception it was always meant to be: one series
                       left, so it takes the span the three of them held. */
                    w={trio ? DASH2_TRIO_BAR_W : DASH2_DRILL_BAR_W}
                    h={Math.round((!trio && s.pick ? values[i] * scale : s.px * trioScale))}
                    tone={s.tone}
                    dim={!on}
                    /* A month with nothing to show draws NOTHING (user call) —
                       no stub nub in the future months, and no flat knob where
                       a series had no money that month. The label stays: the
                       month still exists, it just has nothing to say. */
                    hide={(!trio && !s.pick) || (trio ? s.px === 0 : values[i] === 0)}
                  />
                ))}
              </div>
              <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: on ? TEXT_PRIMARY : TEXT_TERTIARY, padding: "4px 0", transition: "color 240ms ease" }}>
                {m.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Three persistent slots: the selected total moves into the centre and grows
    with its bars. Returning reverses the same live element, without snapshots
    or competing copies of the currency text. */

// FluidText re-runs its layout effect whenever `parts` changes identity, which
// cancels the spring mid-flight and leaves the run stuck a few percent narrow.
// The bank balance avoids that with useMemo; these are built inside a map, so
// they are cached on their value instead.
const FIGURE_PARTS = new Map<string, { id: string; text: string }[]>();

function Dash2CashflowHeader({ level, catId, catName, monthIdx, onDrill }: {
  level: Dash2Level; catId: string; catName: string; monthIdx: number;
  onDrill: (kind: "cf-outflow" | "cf-inflow" | "cf-invest") => void;
}) {
  // The heading runs on Rubik's PROPORTIONAL figures, like the bank balance and
  // the ledger rows below it (user call: the same variable kerning and fluid
  // text the L1 and the bank chart have). Every digit carries its own advance,
  // so the run's width moves with WHICH digits a value contains and not only
  // how many — measured across five 5-digit values it spans 17.4px — and that
  // travel is what the scrub is made of: DASH2_FIGURE_DEFORM spends it as
  // scaleX rather than letting the width jump. Tabular figures held the width
  // still and took the gesture with it.
  // canon 2411:118645 draws the strip in SHORT forms (₹12.6L) — K under a
  // lakh, one decimal only when it earns it (user call R33n)
  const inrShort = (n: number) => {
    if (n >= 100000) return `₹${(Math.round(n / 10000) / 10).toLocaleString("en-IN")}L`;
    if (n >= 1000) return `₹${(Math.round(n / 100) / 10).toLocaleString("en-IN")}K`;
    return `₹${n.toLocaleString("en-IN")}`;
  };
  // The compact form IS the full one with its tail folded into a unit letter
  // (₹15,200 → ₹15.2K). Split on the shared stem so the stem never moves and
  // only the tail changes — the K and the zeros it stands for are one part,
  // only the tail changes. No layoutKey: that switches FluidText off its
  // spring and onto a one-shot scaleX FLIP from the old width, and compact vs
  // full differ by ~70%, so the run visibly squashed. The spring path (the one
  // the bank balance uses) clamps deformation to +/-8% and settles into place.
  const figureParts = (n: number, full: boolean) => {
    const key = `${n}|${full}`;
    const hit = FIGURE_PARTS.get(key);
    if (hit) return hit;
    const short = inrShort(n), long = inr(n);
    let i = 0;
    while (i < short.length && i < long.length && short[i] === long[i]) i++;
    const text = full ? long : short;
    const parts = i > 0 && i < text.length
      ? [{ id: "stem", text: text.slice(0, i) }, { id: "unit", text: text.slice(i) }]
      : [{ id: "stem", text }];
    FIGURE_PARTS.set(key, parts);
    return parts;
  };
  // the LEDGER's own numbers (base × month scale), not the category-rounded
  // drill totals — the strip and the rows sit on one screen and must agree
  // The overview drops the Investments column on a month with nothing invested
  // (user call) and the remaining two spread across the width — on the same
  // transform transition as every other header move, so they slide rather than
  // jump. Only the overview: on the Investments LEVEL the column is the thing
  // being looked at, and removing it would leave the header empty.
  const SLOTS = [
    { id: "in", label: "Inflow" },
    { id: "invest", label: "Investments" },
    { id: "out", label: "Outflow" },
  ] as const;
  const shown = level === "all" && !dash2HasInvest(monthIdx)
    ? SLOTS.filter(c => c.id !== "invest")
    : SLOTS;
  // canon insets the outer columns by a third of 16px across three columns;
  // the same inset over two is a half
  const inset = DASH2_HEADER_INSET / shown.length;
  const slot = (i: number) => shown.length === 2
    ? `calc(-50% ${i === 0 ? "-" : "+"} ${DASH2_HEADER_PAIR}px)`
    : `calc(${(-100 + ((i + 0.5) / shown.length) * 100).toFixed(6)}% + ${(i === 0 ? inset : i === shown.length - 1 ? -inset : 0).toFixed(6)}px)`;
  // Every slot stays MOUNTED — a dropped column that unmounts pops, and there
  // is nothing left to animate (user call). The dropped one keeps the centre
  // it held, so it fades and shrinks in place while the pair closes over it.
  const cols = SLOTS.map(c => {
    const i = shown.findIndex(s => s.id === c.id);
    return { ...c, gone: i < 0, x: i < 0 ? "-50%" : slot(i) };
  });
  const compact = DASH2_HEADER_COMPACT[shown.length === 2 ? "pair" : "trio"];
  const active = level === "cat" ? "out" : level;
  const scrubbing = useContext(Dash2ScrubCtx);
  const [expandedAmount, setExpandedAmount] = useState(active);
  const inks = useRef<Record<string, HTMLDivElement | null>>({});
  const previousActive = useRef(active);
  useLayoutEffect(() => {
    const from = previousActive.current;
    previousActive.current = active;
    if (from === active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ink = inks.current[active === "all" ? from : active];
    if (!ink) return;
    // Keep the selected heading visible through the handoff. FluidText carries
    // its measured width continuously, and the soft focus eases the new glyphs
    // into view without overlapping text copies or a blank midpoint.
    // The curve IS the keyframe list, so interpolation stays linear between
    // closely spaced samples rather than easing each segment separately.
    const animation = ink.animate(DASH2_INK_FRAMES, { duration: DASH2_MORPH_MS, delay: DASH2_MORPH_DELAY });
    return () => animation.cancel();
  }, [active]);
  useEffect(() => {
    // Keep the compact figure through the initial movement, then reveal its
    // precision while it is growing. Reverse on the same beat when returning.
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : DASH2_MORPH_DELAY + DASH2_MORPH_MS * DASH2_MORPH_FLIP;
    const timer = window.setTimeout(() => setExpandedAmount(active), delay);
    return () => window.clearTimeout(timer);
  }, [active]);
  const transition = (properties: string[]) => properties.map(p => `${p} ${DASH2_MORPH_TIMING}`).join(", ");
  return (
    <div data-cashflow-header className="re1-cashflow-header" style={{ position: "relative", height: 84, flexShrink: 0 }}>
      {cols.map(c => {
        const selected = active === c.id;
        const visible = (level === "all" && !c.gone) || selected;
        const expanded = expandedAmount === c.id;
        const total = level === "cat" && selected
          ? dash2CategoryData(catId, monthIdx).total
          : dash2FlowData(c.id, c.gone ? dash2NearestInvest(monthIdx) : monthIdx).total;
        const label = selected && level === "cat" ? `${catName} Spends` : c.label;
        // Dropping and coming back is its own move, on the slide's own clock —
        // the SAME clock the scale runs on, so the two are one gesture (user
        // call) — and the column is seen to leave and to arrive. The drill's
        // beat, which holds the other columns until the selected one has
        // travelled, would spend the whole scale-up invisible and land the
        // column already at size.
        const fade = level === "all" && c.id === "invest"
          ? `opacity ${DASH2_MORPH_TIMING}`
          : `opacity ${Math.round(DASH2_MORPH_MS * (visible ? 0.44 : 0.26))}ms ease ${level === "all" ? Math.round(DASH2_MORPH_MS * 0.35) : 0}ms`;
        return (
          <div key={c.id} data-cashflow-total={c.id} aria-hidden={!visible} style={{ position: "absolute", top: 0, left: "50%", width: "100%", height: 84, transform: `translateX(${selected ? "-50%" : c.x}) scale(${c.gone ? DASH2_HEADER_GONE_SCALE : 1})`, transformOrigin: "50% 42%", opacity: visible ? 1 : 0, pointerEvents: "none", zIndex: selected ? 1 : 0, transition: `${transition(["transform"])}, ${fade}` }}>
            <div ref={el => { inks.current[c.id] = el; }} data-cashflow-ink style={{ position: "absolute", inset: 0, top: -8 }}>
              <span data-cashflow-label style={{ position: "absolute", left: "50%", transform: `translate(-50%, ${selected ? 0 : compact.labelY}px) scale(${selected ? 1 : compact.label / 14})`, transformOrigin: "50% 0", whiteSpace: "nowrap", top: 0, fontFamily: "var(--font-rubik), sans-serif", fontWeight: expanded ? 500 : 400, fontSize: 14, lineHeight: "20px", letterSpacing: 0.24, color: selected ? TEXT_TERTIARY : TEXT_SECONDARY, transition: transition(["transform", "color"]) }}>{label}</span>
              <div data-cashflow-figure style={{ position: "absolute", top: 0, width: "100%", fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 48, lineHeight: "56px", letterSpacing: -0.48, transform: `translateY(${selected ? 28 : compact.figureY}px) scale(${selected ? 1 : compact.figure / 48})`, transformOrigin: "50% 0", transition: transition(["transform"]) }}>
                {/* No roll, ever (user call): the drill's figure changes FORMAT,
                    ₹15K to ₹15,000, and spinning digits that are not changing
                    value says the wrong thing about it. suppressRoll gates only
                    the vertical roll, so the cells still open and close on the
                    width spring — the same variable-kerning travel the scrub
                    already runs on, now the whole story for both. */}
                <FluidText parts={figureParts(total, expanded)} layoutDuration={DASH2_MORPH_MS} maxDeform={DASH2_DRILL_STRETCH} rollDigits suppressRoll rollMs={Math.round(DASH2_MORPH_MS * 0.6)} style={{ color: TEXT_PRIMARY }} />
              </div>
            </div>
            {level === "all" && !c.gone && <button type="button" aria-label={`View ${c.label}`} onClick={() => onDrill(c.id === "in" ? "cf-inflow" : c.id === "out" ? "cf-outflow" : "cf-invest")} style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "33.333333%", height: 84, border: "none", borderRadius: 12, background: "transparent", cursor: "pointer", pointerEvents: "auto" }} />}
          </div>
        );
      })}
    </div>
  );
}

/** Every ledger amount the month strip scales. The heading above these ROLLS
    its digits as the chart is scrubbed (Dash2CashflowHeader), so the rows roll
    on the same beat — one screen changing in two different ways reads as a
    glitch (user call). Parts are cached by value for the reason FIGURE_PARTS
    is: a fresh array identity restarts FluidText's layout effect and strands
    its width spring mid-flight. */
const ROW_PARTS = new Map<number, { id: string; text: string }[]>();
const rowParts = (n: number) => {
  const hit = ROW_PARTS.get(n);
  if (hit) return hit;
  const parts = [{ id: "amount", text: inr(n) }];
  ROW_PARTS.set(n, parts);
  return parts;
};

function Dash2RowAmount({ amount, color = TEXT_PRIMARY }: { amount: number; color?: string }) {
  const scrubbing = useContext(Dash2ScrubCtx);
  return (
    <span data-cashflow-row-amount style={{ flexShrink: 0 }}>
      <FluidText parts={rowParts(amount)} align="right" layoutDuration={DASH2_MORPH_MS} rollDigits suppressRoll={scrubbing} rollMs={Math.round(DASH2_MORPH_MS * 0.6)} style={{ ...typography.bodyNormal, color }} />
    </span>
  );
}

/** A category row (canon 2165:49068 List item/Standard): white 40px avatar with
    the tinted glyph, the name over a SOLID share pill (no track — its width IS
    the share), amount and share on the right. */
function Dash2ShareRow({ icon, dir, name, amount, share, tone, onOpen }: {
  icon: string; dir: "icons" | "budget"; name: string; amount: number; share: number; tone: string; onOpen?: () => void;
}) {
  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      aria-label={onOpen ? `${name} spends` : undefined}
      onClick={onOpen}
      onKeyDown={(e) => onOpen && e.key === "Enter" && onOpen()}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: `16px ${PAGE_GUTTER}px`, cursor: onOpen ? "pointer" : "default" }}
    >
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: `color-mix(in srgb, ${tone} 14%, transparent)`, border: `1px solid ${OUTLINE_SUBTLE}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
        <div style={{ width: 20, height: 20, backgroundColor: tone, WebkitMaskImage: `url(/return-exp1/${dir}/${icon}.svg)`, maskImage: `url(/return-exp1/${dir}/${icon}.svg)`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
        <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, whiteSpace: "nowrap" }}>{name}</span>
        <div style={{ padding: "4px 0" }}>
          <div style={{ width: Math.max(13, Math.round(share * 1.67)), height: 8, borderRadius: 18, background: tone }} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        <Dash2RowAmount amount={amount} />
        <span style={{ ...typography.caption, color: TEXT_SECONDARY }}>{share}%</span>
      </div>
    </div>
  );
}

/** A flow level's numbers, scaled to the month the chart rests on. The head and
    the ledger both read this, so the big total always equals the rows. */
function dash2FlowData(kind: "out" | "in" | "invest", monthIdx: number) {
  const sel = DASH2_CF_MONTHS[monthIdx];
  const live = DASH2_CF_MONTHS[DASH2_CF_LIVE];
  const k = kind === "in" ? sel.inflow / live.inflow : kind === "invest" ? sel.invest / live.invest : sel.outflow / live.outflow;
  const cats = DASH2_OUT_CATS.map((c) => ({ ...c, amt: dash2CategoryTotal(c.id, monthIdx) }));
  // Inflow and Investments list the month's actual movements (transactions,
  // not categories) — inflow credits render green, deployments stay neutral.
  const txns = (kind === "invest" ? DASH2_INVEST_TXNS : DASH2_IN_TXNS)
    .map((t) => ({ ...t, amt: Math.round((t.amount * k) / 100) * 100, note: t.note.replace("Oct", sel.label) }))
    // a month with nothing invested scales every deployment to zero; a ₹0
    // movement is not a transaction, so the month is simply empty
    .filter((t) => t.amt > 0);
  const total = kind === "out" ? cats.reduce((s, c) => s + c.amt, 0) : txns.reduce((s, t) => s + t.amt, 0);
  return { k, cats, txns, total };
}

/** One category's transactions for the month the chart rests on. */
function dash2CategoryData(catId: string, monthIdx: number) {
  const sel = DASH2_CF_MONTHS[monthIdx];
  const total = dash2CategoryTotal(catId, monthIdx);
  const source = DASH2_TXNS[catId] ?? DASH2_TXN_FALLBACK;
  const base = source.reduce((sum, txn) => sum + txn.amount, 0);
  let allocated = 0;
  const txns = source.map((t, i) => {
    const amt = i === source.length - 1 ? total - allocated : Math.round(t.amount / base * total / 10) * 10;
    allocated += amt;
    return { ...t, amt, note: t.note.replace("Oct", sel.label) };
  });
  return { txns, total };
}

/** The ledger under the chart on Outflow, Inflow and Investments — category
    shares for outflow, transaction rows otherwise. The chart and head are the
    LEVEL's (see Dash2CashflowLevel); this is body only. */
function Dash2FlowRows({ kind, monthIdx, tab, onTab, onOpenCategory, onOpenTxn }: {
  kind: "out" | "in" | "invest";
  monthIdx: number;
  tab: "cats" | "top";
  onTab: (t: "cats" | "top") => void;
  onOpenCategory: (id: string, name: string) => void;
  onOpenTxn?: (t: { name: string; note: string; amount: number; tint: string }, catName: string) => void;
}) {
  const { cats, txns, total } = dash2FlowData(kind, monthIdx);
  const rows = [...cats].sort((a, b) => b.amt - a.amt);
  // Every transaction we hold, biggest first — the "Top spends" read.
  const topSpends = DASH2_OUT_CATS.flatMap(cat => dash2CategoryData(cat.id, monthIdx).txns
    .map(t => ({ ...t, catId: cat.id, catName: cat.name })))
    .sort((a, b) => b.amt - a.amt);
  // An inflow credit or a deployment opens the same transaction page as a spend
  // (user call): the row carries the month's figure, so the page must too, and
  // the level's own name stands in for the category a credit doesn't have.
  const openTxn = (t: { name: string; note: string; amt: number; tint: string }) =>
    onOpenTxn?.({ name: t.name, note: t.note, amount: t.amt, tint: t.tint }, DASH2_CF_FLOWS.find(f => f.kind === kind)!.name);
  // Canon segmented control (2165:49204): filled chip for the active segment.
  const chipStyle = (active: boolean): React.CSSProperties => ({
    height: 32,
    padding: "8px 16px",
    borderRadius: 64,
    border: "none",
    background: active ? BG_SECONDARY : "transparent",
    fontFamily: "var(--font-rubik), sans-serif",
    fontWeight: 500,
    fontSize: 14,
    lineHeight: "20px",
    letterSpacing: 0.28,
    color: active ? TEXT_PRIMARY : TEXT_TERTIARY,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });
  return (
    <>
      {/* the Divider/Big that closes the chart block (canon 2165:49151) is the
          level shell's, not ours — it stays put across levels (R63) */}
      {kind === "out" && (
        /* canon 2165:49203: divider → 12 → the 48h control (a 32px pill with 8px
           vertical insets) → 8 → rows; with bare 32px pills that reads as 20
           above and 16 below the pill row */
        <div style={{ display: "flex", padding: `20px ${PAGE_GUTTER}px 0` }}>
          {(["cats", "top"] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => onTab(t)}
              style={{ border: "none", background: "transparent", padding: "6px 0", margin: "-6px 0", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <span style={chipStyle(tab === t)}>{t === "cats" ? "Categories" : "Top spends"}</span>
            </button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", marginTop: kind === "out" ? 16 : 12, paddingBottom: 16 }}>
        {kind !== "out"
          ? txns.map((t) => (
              <div
                key={t.id}
                role="button"
                tabIndex={0}
                aria-label={`${t.name} transaction`}
                onClick={() => openTxn(t)}
                onKeyDown={(e) => e.key === "Enter" && openTxn(t)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: `16px ${PAGE_GUTTER}px`, cursor: "pointer" }}
              >
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: `color-mix(in srgb, ${t.tint} 14%, transparent)`, border: `1px solid ${OUTLINE_SUBTLE}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <span style={{ ...typography.buttonSmall, color: t.tint }}>{t.name.slice(0, 1)}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                  <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, whiteSpace: "nowrap" }}>{t.name}</span>
                  <span style={{ ...typography.caption, color: TEXT_SECONDARY, whiteSpace: "nowrap" }}>{t.note}</span>
                </div>
                <Dash2RowAmount amount={t.amt} color={kind === "in" ? DASH2_CF_GREEN : TEXT_PRIMARY} />
              </div>
            ))
          : tab === "top"
          ? topSpends.map((t) => (
              <div
                key={`${t.catId}-${t.id}`}
                role="button"
                tabIndex={0}
                aria-label={`${t.name} transaction`}
                onClick={() => onOpenTxn?.(t, t.catName)}
                onKeyDown={(e) => e.key === "Enter" && onOpenTxn?.(t, t.catName)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: `16px ${PAGE_GUTTER}px`, cursor: "pointer" }}
              >
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: `color-mix(in srgb, ${t.tint} 14%, transparent)`, border: `1px solid ${OUTLINE_SUBTLE}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <span style={{ ...typography.buttonSmall, color: t.tint }}>{t.name.slice(0, 1)}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                  <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, whiteSpace: "nowrap" }}>{t.name}</span>
                  <span style={{ ...typography.caption, color: TEXT_SECONDARY, whiteSpace: "nowrap" }}>{t.catName} · {t.note}</span>
                </div>
                <Dash2RowAmount amount={t.amt} />
              </div>
            ))
          : rows.map((c) => (
              <Dash2ShareRow
                key={c.id}
                icon={c.icon}
                dir="icons"
                name={c.name}
                amount={c.amt}
                share={Math.round((c.amt / total) * 100)}
                tone={c.pill}
                onOpen={() => onOpenCategory(c.id, c.name)}
              />
            ))}
      </div>
    </>
  );
}

/** One category's transactions, body only (canon "Groceries Spends"). */
function Dash2CategoryRows({ catId, monthIdx, onOpenTxn }: {
  catId: string;
  monthIdx: number;
  onOpenTxn: (t: { name: string; note: string; amount: number; tint: string }) => void;
}) {
  const { txns } = dash2CategoryData(catId, monthIdx);
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 12, paddingBottom: 16 }}>
        {txns.map((t) => (
          <div
            key={t.id}
            role="button"
            tabIndex={0}
            aria-label={`${t.name} transaction`}
            onClick={() => onOpenTxn({ name: t.name, note: t.note, amount: t.amt, tint: t.tint })}
            onKeyDown={(e) => e.key === "Enter" && onOpenTxn({ name: t.name, note: t.note, amount: t.amt, tint: t.tint })}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: `16px ${PAGE_GUTTER}px`, cursor: "pointer" }}
          >
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `color-mix(in srgb, ${t.tint} 14%, transparent)`, border: `1px solid ${OUTLINE_SUBTLE}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
              <span style={{ ...typography.buttonSmall, color: t.tint }}>{t.name.slice(0, 1)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
              <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, whiteSpace: "nowrap" }}>{t.name}</span>
              <span style={{ ...typography.caption, color: TEXT_SECONDARY, whiteSpace: "nowrap" }}>{t.note}</span>
            </div>
            <Dash2RowAmount amount={t.amt} />
          </div>
        ))}
      </div>
    </>
  );
}


// ── The Rahul spend card (canon 2729:8503) — stands in for the phone goal for
// now (user call R35): a person-spend insight with the orange avatar in the
// ring's hole and the canon's magnifier riding its shoulder.
// Canon 2790:53210 recut the person card into a TRACKING card: the same ring
// chart, but the hole carries a stacked pair of skewed avatars instead of a
// letter disc, and the card sits on its own pale-blue ground. The world's own
// food story fills it (₹6,200 over 18 orders, 11 of them delivery) against the
// ₹11,000 cap, so the arc reads 56%.
// the tracker's colour is the canon's Decorative/Bold/Orange (2886:86455) —
// the arc, the avatar disc and the wash all take it
const DASH2_TRACK_ORANGE = DECOR_BOLD_ORANGE;
// The holo-glass discs the tracker's icon can sit on (generated, see
// GENERATED_ASSETS.md); keyed by the Tracker-icon-holder option.
const DASH2_HOLO_DISCS: Record<string, string> = {
  holo: "/return-exp1/ambient/variants/gen_icon-holder-tile.png",
  "holo-lens": "/return-exp1/ambient/variants/gen_holo-coin-lens.png",
};
// the pane is glass, not milk: its centre drops to a third so the card shows through
const DASH2_HOLO_PANE_MASK = "radial-gradient(circle at 50% 50%, rgba(0,0,0,.32) 0%, rgba(0,0,0,.32) 50%, #000 64%)";
function Dash2PersonCard({ onOpen }: { onOpen: () => void }) {
  const kit = useV2Skin();
  const dark = useTheme().mode === "dark";
  const [holderRaw] = useProtoFlag("returnExp1V2IconHolder");
  const tracked = DASH2_DEFAULT_TRACKER;
  const holderTone = tracked.tint;
  const introFill = DASH2_INTRO_FILL;
  // Swiggy is 1,400 of the 2,000 cap the tracking flow set — the arc tells that
  const pct = tracked.cap ? Math.min(100, (tracked.spent / tracked.cap) * 100) : 100;
  // the brand's own logo where it has one. Tracker mark, icon and colour left
  // the panel on user call (2026-09-23), settled on logo, food and the tint.
  const logoSrc = tracked.logo ? `/return-exp1/merchants/${tracked.logo}.png` : null;
  // The hole's icon holder (user call, after a round of flat discs, tilted coins
  // and holo-glass panes — git history keeps the rest): the edged coin or one of
  // two holo-glass panes, switched from the debug panel. Everything wears the
  // canon's tilt — skew -8°, turn 2°, squash 0.99.
  const iconSrc = "/return-exp1/icons/food.svg";
  const tilt = "skewX(-8deg) rotate(2deg) scaleY(0.99)";
  const face = `linear-gradient(160deg, color-mix(in srgb, ${holderTone} 80%, #FFFFFF) 0%, ${holderTone} 52%, color-mix(in srgb, ${holderTone} 86%, #000000) 100%)`;
  const rim = `color-mix(in srgb, ${holderTone} 58%, #16181B)`; // the original's back disc
  const drop = `0 10px 22px -6px color-mix(in srgb, ${holderTone} 55%, transparent)`;
  const disc = (d: number, dx: number, dy: number, extra: React.CSSProperties): React.CSSProperties => ({ position: "absolute", left: "50%", top: "50%", width: d, height: d, margin: `${-d / 2 + dy}px 0 0 ${-d / 2 + dx}px`, borderRadius: "50%", display: "grid", placeItems: "center", transform: tilt, ...extra });
  const holoSrc = DASH2_HOLO_DISCS[holderRaw];
  // The glyph on the glass: the plain icon in the tone, 18 (22 crowded the
  // pane). By night the tone alone sank into the dark glass, so it is lifted
  // toward white there. Block, not inline — a span with width/height alone
  // collapses to nothing.
  const glyphTone = dark ? `color-mix(in srgb, ${holderTone} 45%, #FFFFFF)` : holderTone;
  const holder = holderRaw === "glyph" ? (
    <PlainRingGlyph icon={iconSrc} tone={holderTone} logo={logoSrc} />
  ) : holoSrc ? (
    // Holo glass: a generated holo-glass disc with the real glyph laid on its
    // face. Pane and glyph ride ONE tilted wrapper, so they share the skew
    // exactly. Render and tone wash share one masked layer whose centre drops
    // to a third — dark card, dark glass — while the rim keeps the render's
    // strength; the wash blends by HUE, so the rim's iridescence turns into the
    // tracker's own colour family instead of flattening to one tone.
    <div style={{ position: "absolute", left: "50%", top: "50%", width: 54, height: 54, margin: "-27px 0 0 -27px", transform: tilt, display: "grid", placeItems: "center", filter: `drop-shadow(0 8px 14px color-mix(in srgb, ${holderTone} 22%, transparent))` }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, WebkitMaskImage: DASH2_HOLO_PANE_MASK, maskImage: DASH2_HOLO_PANE_MASK }}>
        <img src={holoSrc} alt="" width={54} height={54} draggable={false} style={{ position: "absolute", inset: 0, width: 54, height: 54 }} />
        <div style={{ position: "absolute", inset: 0, background: holderTone, mixBlendMode: "hue", WebkitMaskImage: `url(${holoSrc})`, maskImage: `url(${holoSrc})`, WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat" }} />
      </div>
      {logoSrc
        ? <span aria-hidden style={{ position: "relative", display: "block" }}><BrandMark src={logoSrc} size={22} /></span>
        : <span aria-hidden style={{ ...tintedGlyph(iconSrc, glyphTone, 18), display: "block", position: "relative" }} />}
    </div>
  ) : (
    // "edge" (default): the original pair relit as one coin — a top-lit face
    // on its tinted shadow, the dark back disc peeking out as the coin's
    // thickness. The glyph lies ON the face and shares its skew (a counter-
    // turned glyph read as flat on a tilted surface).
    <>
      <div aria-hidden style={disc(48, 1.6, 1.4, { background: rim })} />
      <div style={disc(48, -1.6, -1.4, { background: face, boxShadow: `${drop}, inset 0 1px 0 rgba(255,255,255,.35)` })}>
        {logoSrc ? <BrandMark src={logoSrc} size={26} /> : <span aria-hidden style={tintedGlyph(iconSrc, "#FFFFFF", 22)} />}
      </div>
    </>
  );
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${tracked.label} spends details`}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className={`transition-transform active:scale-[0.99] ${kit.cardClass ?? ""}`}
      style={{ ...kit.card("blue", 20), position: "relative", overflow: "hidden", padding: 24, display: "flex", gap: 16, alignItems: "center", cursor: "pointer" }}
    >
      {/* 2886:86804: the frame's orange ellipse behind the ring (the 2790:53210
          pale ground is gone — the card is the same white as its neighbours) */}
      {kit.wash && (
        <div aria-hidden style={dash2Wash(DASH2_TRACK_ORANGE, 207.8, 137.53, "calc(50% + 12.99px)", "calc(50% - 68.77px)")} />
      )}
      <div style={{ position: "relative", flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>
        {/* the same 14/20 title register as the goal card (2886:86447, R74) */}
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 14, lineHeight: "20px", letterSpacing: 0.28, color: TEXT_TERTIARY }}>Oct • {tracked.label} spends</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 24, lineHeight: "32px", letterSpacing: 0.48, color: TEXT_PRIMARY }}>{inr(tracked.spent)}</span>
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: TEXT_TERTIARY }}>{tracked.cap ? `of ${inr(tracked.cap)} capped` : `${tracked.count} ${tracked.noun}${tracked.count > 1 ? "s" : ""} this month`}</span>
        </div>
      </div>
      <Dash2RingChart pct={pct} introFill={introFill} arc={holderTone} head={holderTone}>
        {holderRaw.startsWith("avatar")
          ? <PlainRingAvatar size={holderRaw === "avatar-40" ? 40 : 48} icon={iconSrc} tone={holderTone} logo={logoSrc} />
          : holder}
      </Dash2RingChart>
    </div>
  );
}

// ── Stash L1, canon 2371:105221 "Zeroth state" (R35) ─────────────────────────
// The goal drill IS the Stash screen: the big magenta ring with the goal's
// stats in its hole, the ETA line, Replan Goal, then the funding ledger —
// Allocation and Recurring contribution as 80px deposit rows under secondary
// section bands. Bar stays bare; the trash chip rides the app bar.
/** What the family put in — the sheet opens on this and can replan it. */
const FAMILY_AMOUNT = 20000;

const STASH_SECTIONS: { header: string; rows: { icon: string; raw?: boolean; name: string; sub?: string; value: string; vsub?: string; sheet?: "family" }[] }[] = [
  {
    header: "Allocation",
    rows: [
      { icon: "atom-avatar", raw: true, name: "atom", sub: "Progress 13%", value: "₹10,010", vsub: "of ₹80,000" },
      { icon: "categories", name: "Family contribution", value: inr(FAMILY_AMOUNT), sheet: "family" },
    ],
  },
  {
    header: "Recurring contribution",
    rows: [{ icon: "gear", name: "autopay", sub: "3 transactions", value: "₹10,000", vsub: "Monthly on 3rd" }],
  },
];

// ── Bank accounts, canon 2943:89776 ─────────────────────────────────────────
// What the L0 bank chip opens: the accounts' total up top with how fresh it is,
// six months of closing balances drawn as ONE line, then every linked account
// as a canon "List item / Transaction" row (6820:42403). The bar's "+" adds an
// account (canon note: "should trigger bank add flow"); the refresh line under
// the total opens the sync explainer (canon note: "bank explainer
// bottomsheet"). Hovering or dragging tracks the curve continuously, while
// choosing a month updates the total immediately to that month's
// closing balance, dated. The accounts are this world's own (the filter
// sheet's three); the L0 chip reads the first one's `synced`.
const DASH2_BANK_ACCOUNTS: { logo: string; name: string; mask: string; synced: string; balance: number }[] = [
  { logo: "hdfc", name: "HDFC Bank", mask: "xx2831", synced: "3 hrs ago", balance: 4560.2 },
  { logo: "sbi", name: "SBI Bank", mask: "xx1204", synced: "12 hrs ago", balance: 2315.09 },
  { logo: "sbi", name: "SBI Bank", mask: "xx8846", synced: "12 hrs ago", balance: 1124.71 },
];
// The one-bank state (user call, 2026-09-23): the first account alone, holding
// the whole ₹8,000 so the total, the home figures and the graph still close.
const DASH2_BANK_ONE = [{ ...DASH2_BANK_ACCOUNTS[0], balance: 8000 }];
// Prototype closing balances, April → October. The live figure is the linked
// accounts' ₹8,000 total; April is only the run-in — its
// point sits past the left edge so the line arrives from off-screen the way
// the canon's does. The chart shows May → October.
const DASH2_BANK_HISTORY = [8000, 8000, 8000, 8000, 8000, 8000, 8000];
const DASH2_BANK_FIRST_MONTH = 4; // May, an index into DASH2_MONTH_FULL
const DASH2_BANK_LIVE = DASH2_BANK_HISTORY.length - 2; // October's slot among the six shown
// Prototype-only intra-month records: twelve samples between each pair of
// closing balances. Deterministic salary credits and weighted debits preserve
// every month-end anchor and the exact live account sum.
const DASH2_BANK_INTERVALS = 12;
// Different bill/purchase timing each month; negative entries are refunds.
// Normalize net debits to the salary while retaining the individual shapes.
const DASH2_BANK_DEBITS = [
  [31000, 4000, 18000, -1800, 8500, 24000, 6500, 12000, 7500, 5000, 5300],
  [16000, 26000, 4500, 6500, -2300, 13000, 9500, 21000, 4300, 8700, 6200],
  [22000, 8500, 3000, 29000, 4800, 6400, -3100, 4500, 18500, 16000, 7300],
  [35000, -4200, 6000, 8000, 14500, 3500, 22500, 4000, 9000, 5200, 16500],
  [19000, 4500, 15000, 6500, 29000, -3800, 5600, 17000, 7000, 8500, 4200],
  [28000, 6500, -2700, 19000, 4500, 11000, 7500, 28000, 3500, 5300, 6400],
];
const DASH2_BANK_SAMPLES = DASH2_BANK_HISTORY.flatMap((balance, month) => {
  const date = Date.UTC(2026, DASH2_BANK_FIRST_MONTH + month, 0);
  if (month === DASH2_BANK_HISTORY.length - 1) return [{ slot: month - 1, balance, date }];
  const nextDate = Date.UTC(2026, DASH2_BANK_FIRST_MONTH + month + 1, 0);
  // ₹1.2L salary credited once, then rent, bills and irregular everyday spend.
  // The debit weights vary by month, but always consume exactly that salary:
  // ₹8,000 carried in → ₹1,28,000 after payday → ₹8,000 carried out.
  const debits = DASH2_BANK_DEBITS[month];
  const debitTotal = debits.reduce((sum, amount) => sum + amount, 0);
  return Array.from({ length: DASH2_BANK_INTERVALS }, (_, step) => {
    const t = step / DASH2_BANK_INTERVALS;
    const spent = debits.slice(0, Math.max(0, step - 1)).reduce((sum, amount) => sum + amount, 0) / debitTotal * 120000;
    return {
      slot: month - 1 + t,
      balance: step === 0 ? balance : Math.round((balance + 120000 - spent) * 100) / 100,
      date: date + Math.round((nextDate - date) * t / 86400000) * 86400000,
    };
  });
});
// Full-bleed chart. Month labels use the cashflow page's 40px columns; resize
// the plot with its container so each point stays above its month's centre.
const DASH2_BANK_FRAME_W = 360;
const DASH2_BANK_CHART_H = 134; // the line lives in 12..122 — equal air above and below, then the months (user call)
const DASH2_BANK_PAD_Y = 12;
// Keep the line's breathing room at the right edge; the scrubber itself can
// still travel to the far-left edge when the earliest interval is selected.
const DASH2_BANK_X0 = PAGE_GUTTER + 20;

/** How long the figure and its date take to morph home once the dragger is
    let go. The trigger itself snaps back in one frame (user call), so this
    morph is the whole of what there is to see — well past the 220/280 a
    scrub's own updates run at. */
const DASH2_BANK_SETTLE_MS = 560;

/** The sync-cadence note the refresh line opens (user call). */
const DASH2_BANK_SYNC_NOTE =
  "Bank sync refreshes occur automatically every 24 hours at 12 midnight to keep your balances up to date.";

/** Catmull-Rom through the points, emitted as cubic Béziers: one smooth line. */
function dash2SmoothPath(pts: { x: number; y: number }[]) {
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/** Sample the same Bézier used by the line at an exact horizontal position.
    Inverting x keeps the marker under the pointer even at the end segments. */
function dash2SmoothPointAtX(pts: { x: number; y: number }[], x: number) {
  const end = pts.findIndex((p) => p.x >= x);
  const i = Math.max(0, (end < 0 ? pts.length - 1 : end) - 1);
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
  const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
  const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
  const bezier = (a: number, b: number, c: number, d: number, t: number) =>
    (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t ** 2 * c + t ** 3 * d;
  let lo = 0, hi = 1;
  for (let step = 0; step < 16; step++) {
    const t = (lo + hi) / 2;
    if (bezier(p1.x, c1.x, c2.x, p2.x, t) < x) lo = t;
    else hi = t;
  }
  return { x, y: bezier(p1.y, c1.y, c2.y, p2.y, (lo + hi) / 2) };
}

const dash2Ordinal = (d: number) =>
  `${d}${d % 10 === 1 && d !== 11 ? "st" : d % 10 === 2 && d !== 12 ? "nd" : d % 10 === 3 && d !== 13 ? "rd" : "th"}`;

function Dash2BankPage({ onInfo }: { onInfo: () => void }) {
  // Debug-panel states (user call, 2026-09-23): the graph stays off until it is
  // asked for; one linked bank keeps the page's shape, a single row under the
  // band (user call: the row beat the account-as-head layout); and one of the
  // three can fail to fetch — its row shows the last balance it did fetch,
  // dated "3 days ago" on the red dot, with no retry (user calls), so the
  // total still counts it and every figure closes.
  const [banksFlag] = useProtoFlag("returnExp1V2Banks");
  const [chartFlag] = useProtoFlag("returnExp1V2BankChart");
  const chart = chartFlag === "on";
  const one = banksFlag === "one-row";
  const accounts = one ? DASH2_BANK_ONE : DASH2_BANK_ACCOUNTS;
  const stale = banksFlag === "failed" ? DASH2_BANK_ACCOUNTS[2] : null;
  const bankAvatar = (logo: string) => (
    <div aria-hidden style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, border: `1px solid ${OUTLINE_SUBTLE}`, background: BG_PRIMARY, display: "grid", placeItems: "center" }}>
      <img src={`/return-exp1/filter/${logo}.svg`} alt="" width={24} height={24} draggable={false} />
    </div>
  );
  // Geometry follows the pointer continuously; text selects the nearest demo
  // record immediately. Neither waits for an animated number or snapped dot.
  const [position, setPosition] = useState(DASH2_BANK_LIVE);
  // The scrub window is open for a held pointer AND for a hovering mouse: a
  // mouse over the chart scrubs it the way a finger pressing it does, so the
  // two are one state (app/lib/scrub). `hovering` survives alongside it
  // because only IT can answer "has the pointer actually left?".
  const scrub = useScrub();
  // the crosshair exists only while a pointer is on the chart (user call)
  const [hovering, setHovering] = useState(false);
  // Set while the figure is morphing home after a release — the only motion
  // that outlives the gesture, so it is the only thing that wants a longer beat.
  const [returning, setReturning] = useState(false);
  const sel = Math.round(position);
  const sampleIndex = Math.round((position + 1) * DASH2_BANK_INTERVALS);
  const sample = DASH2_BANK_SAMPLES[sampleIndex];
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(DASH2_BANK_FRAME_W);
  const pitch = (chartWidth - 2 * DASH2_BANK_X0) / DASH2_BANK_LIVE;
  const leftPosition = Math.max(-1, -DASH2_BANK_X0 / pitch);
  const pendingPosition = useRef(DASH2_BANK_LIVE);
  // Any fresh selection owns the chart, including one made mid-morph: cancel
  // drops both a booked frame and a pending return in one call.
  const select = (i: number) => {
    scrub.cancel();
    setReturning(false);
    setPosition(Math.max(leftPosition, Math.min(DASH2_BANK_LIVE, i)));
  };
  // The trigger goes back to live in ONE FRAME (user call): sliding it home
  // across the chart read as the dragger running away. What animates is the
  // figure and its date, and on a release they take DASH2_BANK_SETTLE_MS
  // instead of a scrub's beat — nothing else is left to show the return.
  const settleToLive = () => {
    select(DASH2_BANK_LIVE);
    setReturning(true);
    scrub.settle(DASH2_BANK_SETTLE_MS, () => setReturning(false));
  };
  // A mouse still over the chart is still scrubbing, so only a pointer that has
  // actually left ends the gesture and returns the chart to live — otherwise
  // releasing a drag threw the selection to the live edge while the cursor sat
  // mid-chart.
  const releaseToLive = () => { if (!hovering) { scrub.end(); settleToLive(); } };
  useLayoutEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const measure = () => { if (el.clientWidth) setChartWidth(el.clientWidth); };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [chart]);
  const [drawn, setDrawn] = useState(false);
  // While the line draws, the marker rides its tip along the same path (user
  // call); once settled it goes back to sitting on the scrubbed point.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    // a timeout, not rAF — throttled panes starve rAF and the line would pop
    const t = window.setTimeout(() => setDrawn(true), 30);
    const s = window.setTimeout(() => setSettled(true), 30 + 900);
    return () => { window.clearTimeout(t); window.clearTimeout(s); };
  }, []);
  const live = sampleIndex === DASH2_BANK_SAMPLES.length - 1;
  const whole = Math.round(sample.balance);

  // The line: April's run-in point off the left edge, then the six shown months
  // on the month centres. Zero-based, but padded equally top and bottom (user
  // call): the monthly troughs used to run into the month labels.
  const hi = Math.max(...DASH2_BANK_SAMPLES.map(p => p.balance));
  const yFor = (v: number) => DASH2_BANK_PAD_Y + (1 - v / hi) * (DASH2_BANK_CHART_H - 2 * DASH2_BANK_PAD_Y);
  const pts = DASH2_BANK_SAMPLES.map(p => ({ x: DASH2_BANK_X0 + p.slot * pitch, y: yFor(p.balance) }));
  const d = dash2SmoothPath(pts);
  const last = pts[pts.length - 1];
  const fill = `${d} L ${last.x} ${DASH2_BANK_CHART_H} L ${pts[0].x} ${DASH2_BANK_CHART_H} Z`;

  const marker = dash2SmoothPointAtX(pts, Math.max(0, DASH2_BANK_X0 + position * pitch));
  const pick = (clientX: number, el: HTMLElement, immediate = false) => {
    const rect = el.getBoundingClientRect();
    const x = (clientX - rect.left) * (chartWidth / rect.width);
    pendingPosition.current = Math.max(leftPosition, Math.min(DASH2_BANK_LIVE, (x - DASH2_BANK_X0) / pitch));
    if (immediate) { select(pendingPosition.current); return; }
    // Coalesce high-frequency pointer events without easing behind the cursor:
    // the booked frame reads pendingPosition when it runs, so it always
    // commits the newest sample.
    scrub.frame(() => setPosition(pendingPosition.current));
  };
  const selectedDate = new Date(sample.date);
  const monthName = DASH2_MONTH_FULL[selectedDate.getUTCMonth()];
  const lineText = live ? `Last refreshed ${DASH2_BANK_ACCOUNTS[0].synced}` : `on ${dash2Ordinal(selectedDate.getUTCDate())} ${monthName}`;
  const balanceParts = useMemo(() => [
    { id: "whole", text: inr(whole), style: { fontSize: 48, lineHeight: "56px", letterSpacing: -0.48 } },
  ], [whole]);
  // Keep the date natively shaped as one run. Its natural proportional width
  // recentres smoothly, but 9th → 10th can never cross independently moving
  // digits or suffixes during fast scrubbing.
  const dateParts = useMemo(() => [{ id: live ? "refresh" : "date", text: lineText }], [live, lineText]);

  return (
    <div data-bank-page style={{ marginLeft: -PAGE_GUTTER, marginRight: -PAGE_GUTTER, paddingTop: DASH2_HEAD_TOP, paddingBottom: 16, display: "flex", flexDirection: "column" }}>
      {/* the head: label, the balance in whole rupees (Display Small), and the
          line that says when */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: `0 ${PAGE_GUTTER}px` }}>
        <span style={{ ...typography.buttonSmall, color: TEXT_TERTIARY }}>{one ? "Balance" : "Total balance"}</span>
        <div data-bank-balance style={{ width: "100%", textAlign: "center", color: TEXT_PRIMARY, fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500 }}>
          {/* Tabular figures so the width only moves when the DIGIT COUNT
              does, and a wide deform budget so that change is travelled rather
              than taken in one frame (measured 17.8px -> 3.8px of instant
              left/right movement). */}
          <FluidText parts={balanceParts} maxDeform={DASH2_FIGURE_DEFORM} rollDigits suppressRoll={scrub.active} layoutDuration={returning ? DASH2_BANK_SETTLE_MS : undefined} rollMs={returning ? DASH2_BANK_SETTLE_MS : undefined} />
        </div>
        <div style={{ position: "relative", width: "100%", marginTop: 4, minHeight: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <button
              type="button"
              onClick={onInfo}
              aria-label={live ? "About bank sync" : lineText}
              disabled={!live}
              data-bank-subtext
              style={{ width: "100%", background: "none", border: "none", padding: 0, cursor: live ? "pointer" : "default" }}
            >
              {/* the date rides the same gesture as the figure above it — it
                  would read broken if one tracked cleanly and the other wobbled */}
              <FluidText
                parts={dateParts}
                /* The scrubbed date has digits to roll. The refresh line has
                   none, and cell by cell it BLOOMED open — two dozen characters
                   each widening from zero, the loudest move on the page for the
                   quietest line on it (user call). Off, its width morphs and
                   the glyphs simply arrive. */
                rollDigits={!live}
                suppressRoll={scrub.active}
                layoutDuration={returning ? DASH2_BANK_SETTLE_MS : undefined}
                /* Live it is chrome — a tertiary caption, not a secondary body
                   line — because it is half again longer than any date it
                   replaces. Scrubbed, it is the figure's own date and keeps the
                   weight. */
                style={{ ...(live ? typography.caption : typography.bodySmall), color: live ? TEXT_TERTIARY : TEXT_SECONDARY }}
                trailingWidth={20}
                trailing={live ? <span style={tintedGlyph("/return-exp1/bank/info.svg", TEXT_TERTIARY, 16)} /> : undefined}
              />
            </button>
        </div>
      </div>
      {chart && (<>
      {/* Press and drag follows the curve continuously; vertical touch drags
          still scroll. Arrow keys and the month buttons select exact records. */}
      <div
        ref={chartRef}
        role="slider"
        tabIndex={0}
        aria-label="Balance history"
        aria-valuemin={Math.round((leftPosition + 1) * DASH2_BANK_INTERVALS)}
        aria-valuemax={DASH2_BANK_SAMPLES.length - 1}
        aria-valuenow={sampleIndex}
        aria-valuetext={`${dash2Ordinal(selectedDate.getUTCDate())} ${monthName}: ${inr(whole)}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); select((sampleIndex - 1) / DASH2_BANK_INTERVALS - 1); }
          else if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); select((sampleIndex + 1) / DASH2_BANK_INTERVALS - 1); }
          else if (e.key === "Home") { e.preventDefault(); select(leftPosition); }
          else if (e.key === "End") { e.preventDefault(); select(DASH2_BANK_LIVE); }
        }}
        onPointerDown={(e) => { scrub.begin(); e.currentTarget.setPointerCapture(e.pointerId); pick(e.clientX, e.currentTarget, true); }}
        onPointerEnter={(e) => { if (e.pointerType === "mouse") { setHovering(true); scrub.begin(); } }}
        /* leaving while the pointer is still captured is a drag that wandered
           off the chart, not the end of one */
        onPointerLeave={(e) => { setHovering(false); if (!e.currentTarget.hasPointerCapture(e.pointerId)) { scrub.end(); settleToLive(); } }}
        onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId) || e.pointerType === "mouse") pick(e.clientX, e.currentTarget); }}
        onPointerUp={(e) => {
          releaseToLive();
          if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onPointerCancel={releaseToLive}
        onLostPointerCapture={releaseToLive}
        onBlur={() => { setHovering(false); scrub.end(); settleToLive(); }}
        style={{ position: "relative", width: "100%", height: DASH2_BANK_CHART_H, marginTop: 44, touchAction: "pan-y", cursor: "ew-resize" }}
      >
        <svg width="100%" height={DASH2_BANK_CHART_H} viewBox={`0 0 ${chartWidth} ${DASH2_BANK_CHART_H}`} aria-hidden style={{ display: "block", overflow: "visible" }}>
          <defs>
            {/* the canon's wash (#E6EDF9 → white) said as the line's own blue at
                14%, so it holds after dark */}
            <linearGradient id="re1BankFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={TEXT_TERTIARY} stopOpacity={0.1} />
              <stop offset="1" stopColor={TEXT_TERTIARY} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="re1BankEdgeFade" gradientUnits="userSpaceOnUse" x1={last.x - 56} y1={0} x2={last.x} y2={0}>
              <stop offset="0" stopColor="white" />
              <stop offset="1" stopColor="black" />
            </linearGradient>
            <mask id="re1BankFillMask" maskUnits="userSpaceOnUse" x={pts[0].x} y={0} width={last.x - pts[0].x} height={DASH2_BANK_CHART_H}>
              <rect x={pts[0].x} y={0} width={last.x - pts[0].x} height={DASH2_BANK_CHART_H} fill="url(#re1BankEdgeFade)" />
            </mask>
            <linearGradient id="re1BankGuideFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="black" />
              <stop offset="0.12" stopColor="white" />
              <stop offset="0.88" stopColor="white" />
              <stop offset="1" stopColor="black" />
            </linearGradient>
            <mask id="re1BankGuideMask" maskUnits="userSpaceOnUse" x={0} y={0} width={chartWidth} height={DASH2_BANK_CHART_H}>
              <rect x={0} y={0} width={chartWidth} height={DASH2_BANK_CHART_H} fill="url(#re1BankGuideFade)" />
            </mask>
            <clipPath id="re1BankSelectedClip" clipPathUnits="userSpaceOnUse">
              <rect x={0} y={0} width={Math.max(0, marker.x)} height={DASH2_BANK_CHART_H} />
            </clipPath>
          </defs>
          <path d={fill} fill="url(#re1BankFill)" mask="url(#re1BankFillMask)" style={{ opacity: drawn ? 1 : 0, transition: "opacity 600ms ease 300ms" }} />
          {scrub.active && (
            <line data-bank-crosshair x1={marker.x} x2={marker.x} y1={0} y2={DASH2_BANK_CHART_H} stroke={BLUE_500} strokeOpacity={0.34} strokeWidth={1} vectorEffect="non-scaling-stroke" mask="url(#re1BankGuideMask)" />
          )}
          <path d={d} fill="none" stroke={TEXT_TERTIARY} strokeOpacity={0.2} strokeWidth={3} strokeLinecap="round" pathLength={1} strokeDasharray={1} style={{ strokeDashoffset: drawn ? 0 : 1, transition: `stroke-dashoffset 900ms ${DASH2_MORPH_EASE}` }} />
          <path
            d={d}
            fill="none"
            stroke={BLUE_500}
            strokeWidth={3}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            clipPath="url(#re1BankSelectedClip)"
            style={{ strokeDashoffset: drawn ? 0 : 1, transition: `stroke-dashoffset 900ms ${DASH2_MORPH_EASE}` }}
          />
          <circle
            cx={settled ? marker.x : 0}
            cy={settled ? marker.y : 0}
            r={6}
            fill={BLUE_500}
            stroke={BG_PRIMARY}
            strokeWidth={2}
            style={{
              opacity: drawn ? 1 : 0,
              offsetPath: settled ? undefined : `path("${d}")`,
              offsetRotate: "0deg",
              offsetDistance: drawn ? "100%" : "0%",
              transition: `opacity 180ms ease, offset-distance 900ms ${DASH2_MORPH_EASE}`,
            }}
          />
        </svg>
      </div>
      {/* Match the cashflow page: three-letter months on 40px caption columns. */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: `0 ${PAGE_GUTTER}px`, marginTop: 0 }}>
        {DASH2_BANK_HISTORY.slice(1).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => select(i)}
            aria-label={DASH2_MONTH_FULL[DASH2_BANK_FIRST_MONTH + i]}
            aria-pressed={i === sel}
            style={{ width: 40, height: 32, padding: "4px 0", border: "none", background: "transparent", cursor: "pointer", ...typography.caption, textAlign: "center", color: i === sel ? TEXT_PRIMARY : TEXT_TERTIARY }}
          >
            {DASH2_MONTH_FULL[DASH2_BANK_FIRST_MONTH + i].slice(0, 3)}
          </button>
        ))}
      </div>
      </>)}
      {/* without the graph the band sits the head's standard 32 under it */}
      <div style={{ marginTop: chart ? 24 : 32 }}>
        <SectionBand text={one ? "Bank account" : `Bank accounts (${accounts.length})`} />
      </div>
      {/* canon "List item / Transaction" (6820:42403): 24 / 16 padding, 40px
          avatar on a subtle rim, the name Regular 16/24 over a secondary caption
          — the mask, when it last synced, and the green sync dot — amount right */}
      <div style={{ display: "flex", flexDirection: "column", marginTop: 8, paddingBottom: 16 }}>
        {accounts.map((a) => (
          <div key={a.mask} style={{ display: "flex", alignItems: "center", gap: 12, padding: `16px ${PAGE_GUTTER}px` }}>
            {bankAvatar(a.logo)}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
              <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
              <span style={{ ...typography.caption, color: TEXT_SECONDARY, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                {a.mask} • {a === stale ? "3 days ago" : a.synced}
                <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: a === stale ? RED_500 : GREEN_500, marginLeft: 3, flexShrink: 0 }} />
              </span>
            </div>
            {/* on the name's line, not the row's middle (user call); a balance
                last fetched 3 days ago reads DISABLED, not live (user call) */}
            <span style={{ ...typography.bodyNormal, color: a === stale ? "var(--dls-text-disabled)" : TEXT_PRIMARY, whiteSpace: "nowrap", alignSelf: "flex-start" }}>{inr(Math.round(a.balance))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The 218.75 ring both L1 heads wear (canon 2198:56777 and 2790:53053): the
    grey track, the magenta arc, and whatever the page puts in its hole. It IS
    the home card's ring scaled up (user call: the cards are the source of
    truth; the L1's own SVG ring left with the L1-gauges flag). */
function Dash2BigRing({ pct, children, tone }: { pct: number; children: React.ReactNode; /** a tracker's ring wears the thing's own colour, as its card does */ tone?: string }) {
  const introFill = DASH2_INTRO_FILL;
  return (
    <div className="re1-big-ring" style={{ position: "relative", width: 218.75, height: 218.75, contain: "layout paint", willChange: introFill ? "contents" : undefined }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <div style={{ transform: `scale(${(218.75 / 93).toFixed(4)})` }}>
          <Dash2RingChart pct={pct} introFill={introFill} arc={tone ?? RING_ARC} head={tone ?? RING_HEAD} />
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 4, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        {children}
      </div>
    </div>
  );
}

/** The tracker, opened (canon 2790:53053): the month's spend on that category in
    the ring, the cap under it, Update tracking, then every transaction. */
function Dash2TrackingPage({ onUpdate, onOpenTxn, tracker }: { onUpdate: () => void; onOpenTxn?: (t: { name: string; note: string; amount: number; tint: string }) => void; /** a tracker set up in this session; without one the page is the tracker the feed ships with */ tracker?: Dash2Tracker }) {
  // without a session tracker this is the one the feed ships with, so the page
  // reads the same figures its card does
  const t = tracker ?? DASH2_DEFAULT_TRACKER;
  const txns = dash2TrackerTxns(t);
  const spent = t.spent;
  const cap = t.cap;
  const head = `Oct • ${t.label} spends`;
  const pct = cap ? Math.min(100, Math.round((spent / cap) * 100)) : 0;
  return (
    <div style={{ marginLeft: -PAGE_GUTTER, marginRight: -PAGE_GUTTER, display: "flex", flexDirection: "column", gap: 4, paddingBottom: 24 }}>
        {/* the ring starts a standard 12 under the app bar (user call R45a) — the
            column's own 12 on top of the page's put it too far down */}
      <div style={{ display: "flex", flexDirection: "column", gap: 32, alignItems: "center", padding: "0 24px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center", width: "100%" }}>
          <Dash2BigRing pct={pct} tone={t.tint}>
            <span style={{ ...typography.bodySmall, color: TEXT_SECONDARY }}>{head}</span>
            <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 32, lineHeight: "40px", color: TEXT_PRIMARY }}>{inr(spent)}</span>
            <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>{txns.length} transaction{txns.length === 1 ? "" : "s"}</span>
          </Dash2BigRing>
          <div style={{ display: "flex", gap: 4, alignItems: "center", justifyContent: "center" }}>
            {/* the canon's cap glyph (2790:53070) — an arrow into a ceiling, not
                the green trend arrow this wore until R65. Masked, so it reads
                tertiary with the label it belongs to and themes with it. */}
            <div aria-hidden style={tintedGlyph("/return-exp1/goal-v2/capping.svg", TEXT_TERTIARY, 16)} />
            <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>{cap ? `Max capping is ${cap.toLocaleString("en-IN")} per month` : "No cap — I'm just keeping count"}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onUpdate}
          className="transition-transform active:scale-[0.99]"
          style={{ width: "100%", padding: "12px 24px", borderRadius: 100, border: "none", background: BTN_BG_GREY_DEFAULT, ...typography.buttonNormal, color: TEXT_PRIMARY, cursor: "pointer" }}
        >
          Replan Goal
        </button>
      </div>
      <SectionBand text="Transactions" />
      {txns.map((t) => (
        <Dash2TxnRow key={t.id} name={t.name} note={t.note} amount={t.amount} tint={t.tint} logo={t.logo} onOpen={onOpenTxn && (() => onOpenTxn({ name: t.name, note: t.note, amount: t.amount, tint: t.tint }))} />
      ))}
    </div>
  );
}

function Dash2StashPage({ goal, family, onReplan, onOpenSheet, ledger = STASH_SECTIONS }: { goal: { label: string; value: string; sub: string; pct: number; eta: string }; family: number | null; onReplan: () => void; onOpenSheet?: (s: "family") => void; /** the funding rows — the trip's canon ledger unless the goal brings its own */ ledger?: typeof STASH_SECTIONS }) {
  // the family row shows what was replanned, and leaves once removed
  const sections = ledger.map((sec) => ({ ...sec, rows: sec.rows.flatMap((row) => (row.sheet !== "family" ? [row] : family == null ? [] : [{ ...row, value: inr(family) }])) }));
  return (
    <div style={{ marginLeft: -PAGE_GUTTER, marginRight: -PAGE_GUTTER, display: "flex", flexDirection: "column", gap: 4, paddingBottom: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 32, alignItems: "center", padding: "0 24px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center", width: "100%" }}>
          <Dash2BigRing pct={goal.pct}>
            <span style={{ ...typography.bodySmall, color: TEXT_SECONDARY }}>{goal.label}</span>
            <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 32, lineHeight: "40px", color: TEXT_PRIMARY }}>{goal.value}</span>
            <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>{goal.sub}</span>
          </Dash2BigRing>
          <div style={{ display: "flex", gap: 4, alignItems: "center", justifyContent: "center" }}>
            <img src="/return-exp1/stash/eta.svg" alt="" width={16} height={16} draggable={false} />
            {/* the canon's copy, its typo mended */}
            <span style={{ ...typography.caption, color: "#D30AD7" }}>{goal.eta}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onReplan}
          className="transition-transform active:scale-[0.99]"
          style={{ width: "100%", padding: "12px 24px", borderRadius: 100, border: "none", background: BTN_BG_GREY_DEFAULT, ...typography.buttonNormal, color: TEXT_PRIMARY, cursor: "pointer" }}
        >
          Replan Goal
        </button>
      </div>
      {sections.map((sec) => (
        <div key={sec.header} style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 12 }}>
          <div style={{ background: BG_SECONDARY, padding: "8px 24px", display: "flex", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 10, lineHeight: "12px", letterSpacing: 0.4, textTransform: "uppercase", color: TEXT_TERTIARY }}>{sec.header}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sec.rows.map((row) => (
              <div
                key={row.name}
                role={row.sheet ? "button" : undefined}
                tabIndex={row.sheet ? 0 : undefined}
                aria-label={row.sheet ? `${row.name} details` : undefined}
                onClick={row.sheet ? () => onOpenSheet?.(row.sheet!) : undefined}
                onKeyDown={row.sheet ? (e) => e.key === "Enter" && onOpenSheet?.(row.sheet!) : undefined}
                className={row.sheet ? "transition-transform active:scale-[0.99]" : undefined}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 24px", cursor: row.sheet ? "pointer" : undefined }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  {row.raw ? (
                    /* the avatar shipped with its disc BAKED at the light value
                       (#E6EDF9), so it stayed a pale blue coin after dark (user
                       report R40). The disc is the themed token now and the
                       glyph rides on top — same geometry, same 48. */
                    <div style={{ position: "relative", width: 48, height: 48, borderRadius: "50%", background: "var(--dls-decor-subtle-blue)", border: `1px solid ${OUTLINE_SUBTLE}`, flexShrink: 0 }}>
                      <img src={`/return-exp1/stash/${row.icon.replace("-avatar", "")}.svg`} alt="" width={48} height={48} draggable={false} style={{ position: "absolute", inset: 0 }} />
                    </div>
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--dls-decor-subtle-blue)", border: `1px solid ${OUTLINE_SUBTLE}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <img src={`/return-exp1/stash/${row.icon}.svg`} alt="" width={20} height={20} draggable={false} />
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                    <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 16, lineHeight: "20px", letterSpacing: 0.32, color: TEXT_PRIMARY }}>{row.name}</span>
                    {row.sub && <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>{row.sub}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
                  <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, whiteSpace: "nowrap" }}>{row.value}</span>
                  {row.vsub && <span style={{ ...typography.caption, color: TEXT_SECONDARY, whiteSpace: "nowrap" }}>{row.vsub}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** ── The cashflow family as ONE component (R28) ──────────────────────────────
    Cashflow, Inflow, Outflow, Investments and a single category are LEVELS of
    one page, not five pages, and they share a single Dash2MonthChart instance.
    A level change therefore never unmounts the chart: the picked series widens
    and the other two collapse on live nodes, the level's head slides down from
    above, and the chart glides to the Y the head leaves it. Same elements
    throughout, which is what makes the change read as one move. */
type Dash2Level = "all" | "in" | "out" | "invest" | "cat";

function Dash2CashflowLevel({ level, catId, catName, monthIdx, tab, onTab, onMonthIdx, onDrill, onOpenCategory, onOpenTxn, availableHeight }: {
  level: Dash2Level;
  catId: string;
  catName: string;
  monthIdx: number;
  tab: "cats" | "top";
  onTab: (t: "cats" | "top") => void;
  onMonthIdx: (i: number) => void;
  onDrill: (kind: "cf-outflow" | "cf-inflow" | "cf-invest") => void;
  onOpenCategory: (id: string, name: string) => void;
  onOpenTxn: (t: { name: string; note: string; amount: number; tint: string }, catName: string) => void;
  availableHeight: number;
}) {
  // Only a LEVEL change animates the head and body; the first paint rides the
  // page's own slide-in, and a month drag must not replay anything.
  const [levelSeq, setLevelSeq] = useState(0);
  // One scrub for the screen: the strip drives it, the heading and every row
  // amount read it through Dash2ScrubCtx.
  const scrub = useScrub();
  const prevLevel = useRef(level);
  useLayoutEffect(() => {
    if (prevLevel.current !== level) {
      prevLevel.current = level;
      setLevelSeq((n) => n + 1);
    }
  }, [level]);
  const variant: Dash2ChartVariant = level === "all" ? "all" : level;
  const animate = levelSeq > 0;
  // Fit the overview above the composer: reduce spare space first, then row
  // padding (never below 56px tap targets), then the proportional chart height.
  // Use the same chart size in drills so navigation cannot change its scale.
  const deficit = Math.max(0, 616 - availableHeight);
  const chartGap = 44 - Math.min(20, deficit);
  const rowPadding = 16 - Math.min(8, Math.max(0, deficit - 20) / 6);
  const chartHeight = Math.max(64, DASH2_CHART_H - Math.max(0, deficit - 68));
  const topPadding = Math.max(0, 16 - Math.max(0, deficit - 68 - (DASH2_CHART_H - 64)));
  return (
    <Dash2ScrubCtx.Provider value={scrub.active}>
    <div data-cashflow-level={level} style={{ marginLeft: -PAGE_GUTTER, marginRight: -PAGE_GUTTER, paddingTop: topPadding, display: "flex", flexDirection: "column" }}>
      <Dash2CashflowHeader level={level} catId={catId} catName={catName} monthIdx={monthIdx} onDrill={onDrill} />
      {/* the STABLE key is what keeps this one chart alive while its keyed
          siblings above and below are replaced per level */}
      <div key="chart" className="re1-cashflow-chart-slot" style={{ marginTop: chartGap }}>
        <Dash2MonthChart variant={variant} categoryId={level === "cat" ? catId : undefined} selIdx={monthIdx} onSelIdx={onMonthIdx} scrub={scrub} height={chartHeight} onDrill={level === "all" ? onDrill : undefined} />
      </div>
      {/* R63 (user call): Divider/Big closes the chart block at the same Y on
          every level, so it sits OUT here with the chart — stable key, no
          animation — instead of riding each body's rise-in */}
      <div key="band" data-cashflow-divider aria-hidden style={{ height: 8, background: BG_SECONDARY, marginTop: DASH2_CF_BAND_GAP }} />
      <div
        key={`body-${level}-${levelSeq}`}
        style={{ display: "flex", flexDirection: "column", animation: animate ? `re1CfRiseIn ${DASH2_MORPH_TIMING} both` : undefined }}
      >
        {level === "all" ? (
          <Dash2CashflowFlows selIdx={monthIdx} onDrill={onDrill} rowPadding={rowPadding} />
        ) : level === "cat" ? (
          <Dash2CategoryRows catId={catId} monthIdx={monthIdx} onOpenTxn={(t) => onOpenTxn(t, catName)} />
        ) : (
          <Dash2FlowRows kind={level} monthIdx={monthIdx} tab={tab} onTab={onTab} onOpenCategory={onOpenCategory} onOpenTxn={onOpenTxn} />
        )}
      </div>
    </div>
    </Dash2ScrubCtx.Provider>
  );
}

/** Transactions have no id of their own, and one merchant can appear three
    times on one day across three categories (Amazon, 3 Oct: Into goals,
    Shopping, Travel — same name, same note). Key on every field the page
    shows, so the only rows that can share a toggle are rows nobody could tell
    apart on screen either. */
const dash2TxnKey = (t: { name: string; note: string; amount: number; category: string }) =>
  `${t.category}·${t.name}·${t.note}·${t.amount}`;

/** A single transaction (canon screen 6): the merchant, the amount, then what
    you can do about it. */
function Dash2TxnPage({ txn, excluded, onExcluded }: {
  txn: { name: string; note: string; amount: number; tint: string; category: string };
  /** the page unmounts the moment you leave it, so the toggle is the host's
      (keyed by dash2TxnKey) or re-opening a transaction forgets the call */
  excluded: boolean;
  onExcluded: (v: boolean) => void;
}) {
  // Canon 2180:53935 rows: a 40px glyph well (the DLS avatar minus its invisible
  // white circle), Body Normal label, 72px rows.
  const row = (icon: React.ReactNode, label: string, trailing?: React.ReactNode) => (
    <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: `16px ${PAGE_GUTTER}px` }}>
      <div style={{ width: 40, height: 40, display: "grid", placeItems: "center", flexShrink: 0 }}>{icon}</div>
      <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, flex: 1, minWidth: 0 }}>{label}</span>
      {trailing}
    </div>
  );
  // Glyph strokes take the canon's neutralBold (#7D7D7D), not text-secondary.
  const glyph = (d: string) => (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d={d} stroke="#7D7D7D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <div style={{ marginLeft: -PAGE_GUTTER, marginRight: -PAGE_GUTTER, paddingTop: 16, display: "flex", flexDirection: "column" }}>
      {/* Canon 2180:53935 head, re-set to the page head rhythm (user call): 48
          avatar → 16 → name (Button Small, tertiary) → 8 → amount (Display
          48/56) → 12 → timestamp (Body Small, secondary). */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: txn.tint, display: "grid", placeItems: "center" }}>
          <span style={{ ...typography.headerH4, color: TEXT_ON_COLOR_PRIMARY }}>{txn.name.slice(0, 1)}</span>
        </div>
        <span style={{ ...typography.buttonSmall, color: TEXT_TERTIARY, marginTop: 16 }}>{txn.name}</span>
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 48, lineHeight: "56px", letterSpacing: -0.48, color: TEXT_PRIMARY, marginTop: 8 }}>{inr(txn.amount)}</span>
        <span style={{ ...typography.bodySmall, color: TEXT_SECONDARY, marginTop: 12 }}>{txn.note}</span>
      </div>
      {/* full hairline divider, 32 under the head and 12 above the rows (canon) */}
      <div aria-hidden style={{ height: 1, background: OUTLINE_SUBTLE, marginTop: 32 }} />
      <div style={{ display: "flex", flexDirection: "column", marginTop: 12 }}>
        {row(glyph("M2 6h14M2 6v8a1 1 0 001 1h12a1 1 0 001-1V6M2 6l2-3h10l2 3"), txn.category,
          <span style={{ ...typography.buttonSmall, color: "#9E2BCF" }}>Edit</span>)}
        {row(glyph("M9 2v14M4 7l5-5 5 5"), "Link refund and cashbacks")}
        {row(glyph("M3 9h12M9 3v12"), "Exclude from spends",
          <button
            type="button"
            aria-label="Exclude from spends"
            aria-pressed={excluded}
            onClick={() => onExcluded(!excluded)}
            style={{ border: "none", background: "transparent", padding: "10px 2px", margin: "-10px -2px", cursor: "pointer", display: "grid", placeItems: "center" }}
          >
            <span style={{ display: "block", boxSizing: "border-box", width: 40, height: 24, borderRadius: 100, padding: 4, background: excluded ? V2_MAGENTA : "var(--dls-toggle-track)", transition: "background 200ms ease" }}>
              <span style={{ display: "block", width: 16, height: 16, borderRadius: "50%", background: TEXT_ON_COLOR_PRIMARY, transform: `translateX(${excluded ? 16 : 0}px)`, transition: "transform 200ms cubic-bezier(0.22,1,0.36,1)" }} />
            </span>
          </button>
        )}
        {row(glyph("M3 5h1M3 9h1M3 13h1M7 5h8M7 9h8M7 13h8"), "More transaction details")}
      </div>
    </div>
  );
}

/** Divider_big, then the month's flows as avatar rows (canon 2205:57382:
    Inflow, Outflow, Investments) — body only. Tapping one changes the LEVEL,
    which converts the shared chart above into that series. */
function Dash2CashflowFlows({ selIdx, onDrill, rowPadding = 16 }: {
  selIdx: number;
  rowPadding?: number;
  onDrill?: (kind: "cf-outflow" | "cf-inflow" | "cf-invest") => void;
}) {
  return (
      <div style={{ display: "flex", flexDirection: "column", marginTop: 12, paddingBottom: 16 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {DASH2_CF_FLOWS.map((f) => {
            // A month with nothing invested drops the row, but it LEAVES rather
            // than disappears (user call): the row closes on the same clock the
            // heading and the bars change on, and Outflow rides the gap up.
            const open = f.kind !== "invest" || dash2HasInvest(selIdx);
            const live = open && !!onDrill;
            const amt = dash2FlowData(f.kind, open ? selIdx : dash2NearestInvest(selIdx)).total;
            return (
              <div
                key={f.name}
                style={{ height: open ? 40 + rowPadding * 2 : 0, overflow: "hidden", opacity: open ? 1 : 0, transition: `height ${DASH2_MORPH_TIMING}, opacity ${DASH2_MORPH_TIMING}` }}
              >
              <div
                role={live ? "button" : undefined}
                tabIndex={live ? 0 : undefined}
                aria-hidden={!open}
                aria-label={live ? `${f.name} details` : undefined}
                onClick={live ? () => onDrill(f.to) : undefined}
                onKeyDown={live ? (e) => { if (e.key === "Enter") onDrill(f.to); } : undefined}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: `${rowPadding}px ${PAGE_GUTTER}px`, background: BG_PRIMARY, cursor: live ? "pointer" : "default" }}
              >
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: f.tint, border: `1px solid ${OUTLINE_SUBTLE}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <img src={`/return-exp1/home-v2/${f.icon}.svg`} alt="" aria-hidden width={20} height={20} draggable={false} />
                </div>
                <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, flex: 1, minWidth: 0 }}>{f.name}</span>
                <Dash2RowAmount amount={amt} color={f.kind === "in" ? DASH2_CF_GREEN : TEXT_PRIMARY} />
              </div>
              </div>
            );
          })}
        </div>
      </div>
  );
}

// ── V2 bottom sheet (DLS Bottom sheet, canon 2194:56380) ─────────────────────
// White sheet off a scrim: bare rounded head (no grabber, per canon), an H2
// title, the caller's rows, then the Primary action. Enter/exit ride the same
// 300ms ease the chat surfaces use.
function Dash2Sheet({ open, onClose, title, cta, onCta, secondary, onSecondary, children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  cta: string;
  onCta: () => void;
  /** an outlined action beside the primary — the canon's Remove (2863:84643) */
  secondary?: string;
  onSecondary?: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      // a timeout, not rAF — throttled panes starve rAF and the sheet would pop
      const t = window.setTimeout(() => setVisible(true), 20);
      return () => window.clearTimeout(t);
    }
    setVisible(false);
    const t = window.setTimeout(() => setMounted(false), 300);
    return () => window.clearTimeout(t);
  }, [open]);
  if (!mounted) return null;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60 }}>
      <button
        type="button"
        aria-label={`Close ${title}`}
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: BG_OVERLAY, border: "none", padding: 0, cursor: "default", opacity: visible ? 1 : 0, transition: "opacity 250ms ease" }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          background: "var(--re1-sheet-bg, var(--dls-bg-sheet))",
          borderRadius: "16px 16px 0 0",
          display: "flex",
          flexDirection: "column",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: `transform 300ms ${DASH2_MORPH_EASE}`,
        }}
      >
        <div aria-hidden style={{ height: 20 }} />
        {/* 18px above the heading (user ask, R28) on top of the bare head zone */}
        <div style={{ padding: `18px ${PAGE_GUTTER}px 16px` }}>
          <span style={{ ...typography.headerH2, color: TEXT_PRIMARY }}>{title}</span>
        </div>
        {children}
        <div style={{ padding: `16px ${PAGE_GUTTER}px 24px`, display: "flex", gap: 12 }}>
          {secondary && (
            <button
              type="button"
              onClick={onSecondary}
              className="transition-transform active:scale-[0.98]"
              style={{ flex: 1, height: 48, borderRadius: 100, border: `1px solid ${OUTLINE_SUBTLE}`, background: "transparent", ...typography.buttonNormal, color: VALENTINO_500, cursor: "pointer" }}
            >
              {secondary}
            </button>
          )}
          <button
            type="button"
            onClick={onCta}
            className="transition-transform active:scale-[0.98]"
            style={{ flex: 1, height: 48, borderRadius: 100, border: "none", background: BTN_BG_PRIMARY_DEFAULT, ...typography.buttonNormal, color: TEXT_ON_COLOR_PRIMARY, cursor: "pointer" }}
          >
            {cta}
          </button>
        </div>
      </div>
    </div>
  );
}

// Filter Bank rows (canon 2194:56380): the user's accounts as List item/Standard
// — 40px logo avatar, the masked account, a trailing control. MULTI select
// (R28): accounts are filters you combine, not alternatives, so the control is
// a checkbox. Rest state empty, and the sheet is per-open, so the picks reset
// like the canon's rest state.
// The rest state is ALL accounts (canon 6141:15314), so an empty pick list
// means "no filter" rather than "nothing chosen". Per-account spends split the
// month's ₹20,800 outflow exactly.
const DASH2_BANKS = [
  { id: "hdfc", name: "HDFC xx2831", logo: "hdfc", spends: 11600 },
  { id: "sbi-sal", name: "SBI xx1204", logo: "sbi", spends: 6400 },
  { id: "sbi-sav", name: "SBI xx8846", logo: "sbi", spends: 2800 },
];
const DASH2_BANKS_TOTAL = DASH2_BANKS.reduce((sum, b) => sum + b.spends, 0);

/** One account row: 40px logo avatar, the masked account over its spends, then
    the selection control in a 48px tap target (canon List item / Control). */
function Dash2BankRow({ logo, name, spends, on, onToggle }: {
  logo: string; name: string; spends: string; on: boolean; onToggle: () => void;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={on}
      aria-label={name}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
      style={{ display: "flex", alignItems: "center", padding: `16px 12px 16px ${PAGE_GUTTER}px`, cursor: "pointer" }}
    >
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--dls-cat-avatar-fill)", border: `1px solid ${OUTLINE_SUBTLE}`, display: "grid", placeItems: "center", flexShrink: 0, marginRight: 12 }}>
        <img src={`/return-exp1/filter/${logo}.svg`} alt="" aria-hidden width={20} height={20} draggable={false} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0, paddingRight: 8 }}>
        <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
        <span style={{ ...typography.caption, color: TEXT_SECONDARY, whiteSpace: "nowrap" }}>{spends}</span>
      </div>
      <div style={{ width: 48, height: 48, display: "grid", placeItems: "center", flexShrink: 0 }}>
        <img
          src={on ? "/return-exp1/filter/check-on.svg" : "/return-exp1/filter/radio-empty.svg"}
          alt=""
          aria-hidden
          width={24}
          height={24}
          draggable={false}
        />
      </div>
    </div>
  );
}

function Dash2FilterBankRows({ picked, onPicked }: {
  // Empty = every account, which is the canon's rest state. Picking accounts
  // narrows it; clearing the last one falls back to all, because a filter that
  // matches nothing has nothing to show. Held by the host: Dash2Sheet drops its
  // children 300ms after it closes, so an applied filter used to come back
  // reading "All accounts" the next time it was opened.
  picked: string[];
  onPicked: (next: string[]) => void;
}) {
  const all = picked.length === 0;
  const toggle = (id: string) =>
    onPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  const inr0 = (n: number) => `Oct spends: ₹${n.toLocaleString("en-IN")}`;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Dash2BankRow
        logo="all-accounts"
        name="All accounts"
        spends={inr0(DASH2_BANKS_TOTAL)}
        on={all}
        onToggle={() => onPicked([])}
      />
      {/* Divider/Big — the canon sets "All accounts" apart from the list */}
      <div aria-hidden style={{ height: 8, background: BG_SECONDARY }} />
      {DASH2_BANKS.map((b) => (
        <Dash2BankRow
          key={b.id}
          logo={b.logo}
          name={b.name}
          spends={inr0(b.spends)}
          on={picked.includes(b.id)}
          onToggle={() => toggle(b.id)}
        />
      ))}
    </div>
  );
}

// "How it works" rows for the budget allocation sheet — copy only, no canon
// frame for the body yet, so it keeps the Filter Bank sheet's anatomy.
const DASH2_HOW_ROWS: { title: string; sub: string }[] = [
  { title: "Caps set from your habits", sub: "Cosimo reads your last 6 months and caps each category at what normal looks like." },
  { title: "Spends tracked live", sub: "Every transaction lands in its category the moment it happens." },
  { title: "Nudged before you overshoot", sub: "You get a heads-up at 80% of any cap — before it becomes a problem." },
];
function Dash2HowItWorksRows() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {DASH2_HOW_ROWS.map((r) => (
        <div key={r.title} style={{ display: "flex", flexDirection: "column", gap: 4, padding: `12px ${PAGE_GUTTER}px` }}>
          <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY }}>{r.title}</span>
          <span style={{ ...typography.bodySmall, color: TEXT_SECONDARY }}>{r.sub}</span>
        </div>
      ))}
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

// ── Budget page, canonical 1806:22503 ────────────────────────────────────────
// Under the gauge: a swipeable row of status cards, then a Budget/Cashflow
// switch over either the category caps or the month's cashflow ledger.

/** ToDo Card (1806:22519): a 312×72 status card on the page's soft grey. */
function BudgetStatusCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div
      style={{
        width: "100%",
        flexShrink: 0,
        background: BG_SECONDARY,
        borderRadius: 16,
        padding: 16,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <img src={`/return-exp1/budget/${icon}.svg`} alt="" aria-hidden width={20} height={20} draggable={false} style={{ flexShrink: 0 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 14, lineHeight: "20px", letterSpacing: 0.28, color: TEXT_PRIMARY }}>{title}</span>
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: TEXT_TERTIARY }}>{body}</span>
      </div>
    </div>
  );
}

// The status cards, in this world's terms: day 8 of October, ₹14,300 of a
// ₹29,500 budget already gone — so the lead card is the honest pace read, not
// the canon's "on track" (which would contradict the trend card right below it).
const BUDGET_STATUS_CARDS: { icon: string; title: string; body: string }[] = [
  { icon: "thumbs-up", title: "Watch your pace", body: "₹661 a day keeps you inside ₹29,500." },
  { icon: "row-goals", title: "Japan is on track", body: "₹6,500 went in on the 2nd, nothing to do." },
];

// The third status card is the canon's own FD nudge.
const budgetStatusCardsV2 = (state: Dash2BudgetState = "ontrack") => [
  // the lead card reads the month (canon's own line is the on-track one)
  state === "watch"
    ? { icon: "thumbs-up", title: "Watch your pace", body: "₹661 a day keeps you inside ₹29,500." }
    : { icon: "thumbs-up", title: "You are on track", body: "You'll have ₹4,435 extra left this month." },
  ...BUDGET_STATUS_CARDS.slice(1),
  { icon: "upgrade", title: "Build your FD ladder", body: "Book FD every 30 days" },
];

/** The month's ledger (1806:23414): income at the top, then what leaves it, and
    what's left. The rows close: 50,000 − 14,000 − 6,500 − 14,300 = 15,200. */
const BUDGET_LEDGER: { icon: string; name: string; note?: string; amount: string; positive?: boolean }[] = [
  { icon: "row-income", name: "Income", note: "salary + one refund", amount: "₹50,000", positive: true },
  { icon: "row-recurring", name: "Recurring spends", note: "3 payments", amount: "₹14,000" },
  { icon: "row-goals", name: "Into goals", note: "1 autopay", amount: "₹6,500" },
  { icon: "row-spent", name: "Spent this month", note: "5 categories", amount: "₹14,300" },
  { icon: "row-left", name: "Left to spend", amount: "₹15,200", positive: true },
];

function BudgetLedgerRow({ row }: { row: (typeof BUDGET_LEDGER)[number] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: `16px ${PAGE_GUTTER}px` }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: BG_CARD,
          border: `1px solid ${OUTLINE_SUBTLE}`,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <img src={`/return-exp1/budget/${row.icon}.svg`} alt="" aria-hidden width={20} height={20} draggable={false} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 16, lineHeight: "24px", letterSpacing: 0.32, color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {row.name}
        </span>
        {row.note && (
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "16px", letterSpacing: 0.24, color: TEXT_SECONDARY, whiteSpace: "nowrap" }}>
            {row.note}
          </span>
        )}
      </div>
      <span
        style={{
          fontFamily: "var(--font-rubik), sans-serif",
          fontWeight: 400,
          fontSize: 16,
          lineHeight: "24px",
          letterSpacing: 0.32,
          color: row.positive ? EXT_TEXT_POSITIVE : TEXT_PRIMARY,
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      >
        {row.amount}
      </span>
    </div>
  );
}

/** The whole budget page body: status carousel → Budget/Cashflow switch → the
    chosen view. Full-bleed (it un-pads the page gutter) because the canon's
    divider, tab strip and rows all run edge to edge. */
function BudgetPageBody() {
  // Cashflow leads, as the canon frame shows it.
  const [tab, setTab] = useState<"cashflow" | "budget">("cashflow");
  const tabStyle = (active: boolean): React.CSSProperties => ({
    height: 32,
    padding: "8px 16px",
    borderRadius: RADIUS_PILL,
    border: "none",
    background: active ? BG_SECONDARY : "transparent",
    fontFamily: "var(--font-rubik), sans-serif",
    fontWeight: 500,
    fontSize: 14,
    lineHeight: "20px",
    letterSpacing: 0.28,
    color: active ? TEXT_PRIMARY : TEXT_TERTIARY,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 200ms ease, color 200ms ease",
  });
  return (
    <div style={{ marginLeft: -PAGE_GUTTER, marginRight: -PAGE_GUTTER, display: "flex", flexDirection: "column" }}>
      {/* status cards — swipeable, the next one peeking past the right edge */}
      <div
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          padding: `0 ${PAGE_GUTTER}px`,
          scrollbarWidth: "none",
          scrollSnapType: "x mandatory",
          // Snapping aligns to the SNAPPORT, not the padding box, so without this
          // the first card snapped 24px left and sat flush against the edge.
          scrollPaddingLeft: PAGE_GUTTER,
        }}
      >
        {BUDGET_STATUS_CARDS.map((c) => (
          <div key={c.title} style={{ scrollSnapAlign: "start", width: "100%", flexShrink: 0 }}>
            <BudgetStatusCard {...c} />
          </div>
        ))}
      </div>
      {/* Divider/Big — the 8px band that separates the hero block from the switch */}
      <div aria-hidden style={{ height: 8, background: BG_SECONDARY, marginTop: 24 }} />
      <div style={{ display: "flex", alignItems: "center", padding: `8px ${PAGE_GUTTER}px`, marginTop: 12 }}>
        <button type="button" style={tabStyle(tab === "budget")} onClick={() => setTab("budget")}>Budget</button>
        <button type="button" style={tabStyle(tab === "cashflow")} onClick={() => setTab("cashflow")}>Cashflow</button>
      </div>
      {tab === "cashflow" ? (
        <div style={{ paddingTop: 12, paddingBottom: 8, display: "flex", flexDirection: "column" }}>
          {BUDGET_LEDGER.map((row) => <BudgetLedgerRow key={row.name} row={row} />)}
        </div>
      ) : (
        // The caps view keeps the trend read + the per-category cards, which this
        // frame doesn't replace — it only specifies the cashflow tab.
        <div style={{ padding: `12px ${PAGE_GUTTER}px 8px`, display: "flex", flexDirection: "column", gap: 16 }}>
          <SpendingSpikeCardV2 />
          {BUDGET_CATS.map((cat) => <BudgetCategoryCard key={cat.name} cat={cat} />)}
        </div>
      )}
    </div>
  );
}

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
        <div style={{ position: "relative", height: 2, borderRadius: 12, background: "var(--dls-bg-disabled)", width: "100%" }}>
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

/** What the info chip on the upcoming list says (canon 2886:87053). */
const DASH2_UPCOMING_NOTE =
  "The bills we expect this month, going by what you've paid before. They're already set aside, so what's left to spend has them covered.";

/** The canon's 40px calendar tile (2886:87067): the month on a brand cap, the
    day beneath, a soft shadow and no rim — the 48px tile at 0.8333, so the
    type scales with it (10/12 → 8.33/10, 16/20 → 13.33/16.67). */
function Dash2CalTile({ day }: { day: string }) {
  return (
    <div aria-hidden style={{ position: "relative", width: 40, height: 40, borderRadius: 10, flexShrink: 0, overflow: "hidden", background: "rgba(255,255,255,0.05)", border: "0.833px solid color-mix(in srgb, var(--dls-bg-brand, #D30AD7) 12%, transparent)" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 15, paddingTop: 2, background: VALENTINO_500, display: "grid", placeItems: "center" }}>
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 8.33, lineHeight: "10px", letterSpacing: 0.33, color: TEXT_ON_COLOR_PRIMARY, textTransform: "uppercase" }}>Oct</span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 15, bottom: 1, display: "grid", placeItems: "center" }}>
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 13.33, lineHeight: "16.67px", letterSpacing: 0.27, color: TEXT_PRIMARY }}>{day}</span>
      </div>
    </div>
  );
}

/** Canon 2886:87053 "Left to Spend - Dashboard": the month's upcoming spends as
    List item/Deposit rows — 24 side, 16 top and bottom, 4 between rows; the
    calendar tile, the name Regular 16/24 over its cadence in a tertiary
    caption, the amount right. Divider/Big → 8 → the rows → 12. */
const DASH2_UPCOMING_PAYMENTS = [
  { name: "Rent", day: 3, cadence: "monthly on the 3rd", amount: 20000 },
  { name: "Electricity", day: 15, cadence: "monthly on the 15th", amount: 2500 },
  { name: "Internet", day: 22, cadence: "monthly on the 22nd", amount: 1200 },
];
/** Today in this world (Oct 2026, the 8th): anything due before it is paid —
    or everything is, on the debug panel's "Bills this month: All paid". */
const DASH2_OCT_TODAY = 8;
const dash2Paid = (p: { day: number }, allPaid = false) => allPaid || p.day < DASH2_OCT_TODAY;
const dash2PaidCount = (allPaid: boolean) => DASH2_UPCOMING_PAYMENTS.filter((p) => dash2Paid(p, allPaid)).length;
const useDash2AllPaid = () => useProtoFlag("returnExp1V2BillsState")[0] === "paid";
/** One upcoming payment as the page lists it; the home card shows the next
    one the same way, so the two can never drift apart. The tile carries the
    payment's own day (it read 12 on every row before). */
function Dash2UpcomingRow({ pmt, paid = false, style }: { pmt: (typeof DASH2_UPCOMING_PAYMENTS)[number]; paid?: boolean; style?: React.CSSProperties }) {
  return (
    <div data-upcoming-row style={{ display: "flex", alignItems: "center", gap: 12, ...style }}>
      <Dash2CalTile day={String(pmt.day)} />
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
        <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, whiteSpace: "nowrap" }}>{pmt.name}</span>
        <span style={{ ...typography.caption, color: TEXT_TERTIARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pmt.cadence}</span>
      </div>
      {/* a paid one says so under its amount (user call) */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, alignSelf: "flex-start" }}>
        <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, whiteSpace: "nowrap" }}>{inr(pmt.amount)}</span>
        {paid && <span style={{ ...typography.caption, color: EXT_TEXT_POSITIVE, whiteSpace: "nowrap" }}>Paid</span>}
      </div>
    </div>
  );
}
function Dash2UpcomingPage() {
  const allPaid = useDash2AllPaid();
  return (
    <div data-upcoming-payments style={{ marginLeft: -PAGE_GUTTER, marginRight: -PAGE_GUTTER, display: "flex", flexDirection: "column", gap: 8, paddingBottom: 12 }}>
      <div aria-hidden style={{ height: 8, background: BG_SECONDARY }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {DASH2_UPCOMING_PAYMENTS.map((pmt) => (
          <Dash2UpcomingRow key={pmt.name} pmt={pmt} paid={dash2Paid(pmt, allPaid)} style={{ padding: `16px ${PAGE_GUTTER}px`, background: BG_PRIMARY }} />
        ))}
      </div>
      <div aria-hidden style={{ height: 76, background: BG_PRIMARY }} />
    </div>
  );
}

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

// ── The v2 feed as state (user call: add a goal, see its card; take cards off) ──
// The home stack is a list — `order` plus the goals set up here — not a fixed
// array. It lives in sessionStorage, so a reload (or a dev-server remount) keeps
// what you did and quitting the app resets it.
/** What goal setup actually sets (its beats 1, 8 and 10): the goal that lands
    on the feed the moment cosimo says "Set." ₹12k in, ₹18k a month from the
    5th — six autopays reach ₹1.2L on 5 Mar. */
const SETUP_GOAL = { label: "Japan by March", target: 120000, lump: 12000, monthly: 18000, day: 5, eta: "Reaching your goal by 5 Mar ’27" };
type Dash2Goal = { id: string; label: string; saved: number; target: number; eta: string; monthly: number; day: number };
/** A thing the tracking flow put a cap on: what it is, what it has cost this
    month, and the cap (null = watching it without one). */
type Dash2Tracker = { id: string; label: string; spent: number; count: number; noun: string; cap: number | null; tint: string; logo?: string; icon?: string };
/** `goal:<id>` cards are the goals set up in this session; "add-goal" is the
    dashed button — the one card that cannot be held and removed. */
type Dash2WidgetId = "budget" | "trip" | "tracker" | "add-goal" | "cashflow" | "upcoming" | `goal:${string}` | `track:${string}`;
type Dash2Feed = { order: Dash2WidgetId[]; goals: Dash2Goal[]; trackers: Dash2Tracker[] };
const DASH2_FEED_DEFAULT: Dash2Feed = { order: ["budget", "trip", "tracker", "add-goal", "cashflow", "upcoming"], goals: [], trackers: [] };
const DASH2_FEED_KEY = "re1.v2feed";
/** the card's own title, for the remove sheet */
const DASH2_WIDGET_LABELS: Record<string, string> = { budget: "Oct Budget", trip: "Trip to Japan", tracker: "Food spends", cashflow: "Cashflow", upcoming: "Upcoming payments" };
function dash2WidgetLabel(id: Dash2WidgetId, feed: Dash2Feed) {
  return feed.goals.find((g) => `goal:${g.id}` === id)?.label
    ?? feed.trackers.find((t) => `track:${t.id}` === id)?.label
    ?? DASH2_WIDGET_LABELS[id] ?? "this card";
}
/** What a reload brings back: the default stack with the session's goals
    spliced in above Add Goal. Removing one of the default cards lasts for the
    session you did it in (user call: "have the 3 cards by default" — a
    tracker taken down on one visit had stayed gone); goals, and taking a goal
    card off, persist. */
function dash2LoadFeed(): Dash2Feed | null {
  try {
    const raw = window.sessionStorage.getItem(DASH2_FEED_KEY);
    const f = raw ? (JSON.parse(raw) as Dash2Feed) : null;
    if (!f || !Array.isArray(f.order) || !Array.isArray(f.goals)) return null;
    const goals = f.goals.filter((g) => f.order.includes(`goal:${g.id}`));
    const trackers = (f.trackers ?? []).filter((t) => f.order.includes(`track:${t.id}`));
    const order = [...DASH2_FEED_DEFAULT.order];
    order.splice(order.indexOf("add-goal"), 0, ...goals.map((g) => `goal:${g.id}` as Dash2WidgetId), ...trackers.map((t) => `track:${t.id}` as Dash2WidgetId));
    return { order, goals, trackers };
  } catch {
    return null;
  }
}
/** ₹1,20,000 → "1.2L", the register the goal cards' sublines use */
const dash2Lakh = (n: number) => `${(n / 100000).toFixed(1).replace(/\.0$/, "")}L`;

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

/** The two prompts the UI can put in the user's mouth: replanning a goal and
    linking an account both BEGIN in the chat (user call R36f) — the card just
    says the thing the user would have typed. */
const ASK_REPLAN = "Help me replan my Trip to Japan goal";
const ASK_REPLAN_NEW = `Help me replan my ${SETUP_GOAL.label} goal`;
const ASK_ADD_BANK = "Add a bank account";
const ASK_REPLAN_BUDGET = "Help me replan my October budget";
const ASK_UPDATE_TRACKING = "Update what I'm tracking on food";

const ANSWERS: Record<string, string> = {
  [ASK_REPLAN]:
    "Sure. You're at ₹84,500 of ₹1,30,000, reaching it by 26 Mar '27.\n\nTo land it sooner I can raise the monthly autopay from ₹10,000, or move the date. What would you like to change?",
  [ASK_REPLAN_NEW]:
    "Sure. You're at ₹12,000 of ₹1,20,000, with ₹18,000 going in on the 5th from October.\n\nI can raise the monthly, or move the date. What would you like to change?",
  [ASK_UPDATE_TRACKING]:
    "Right now I cap food at ₹11,000 a month and count every order, delivery or not.\n\nI can move the cap, or stop counting dining out. What should change?",
  [ASK_REPLAN_BUDGET]:
    "You're ₹4,500 past ₹29,500 with 23 days to go.\n\nFood & drinks and Travel are both over their caps. I can raise those two and take it out of Shopping, or lift the whole budget. Which way?",
  [ASK_ADD_BANK]:
    "Let's link it. I can pull balances and spends from any UPI-linked bank, the same way I did during your setup.\n\nWhich bank should we add?",
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

// ── Goal setup, in the returning user's chat (canon 2856:72931 "Goal setup",
//    scenario "S1 · First goal, straight through") ──────────────────────────
// The setup conversation the onboarding pitch used to own now lives HERE: you
// ask for a goal, cosimo reads your last three months and confirms each credit
// and bill with you, then sets the monthly. It ends ON the feed, so the thing
// you just made is the thing you land on.

const SETUP_ENTRY = "Let's set up a goal";
/** The tracking branch's own opening line — the row that starts it (2775:17472). */
const SETUP_TRACK = "Track a merchant or category";

/** What the tracking flow can watch. Every figure is this month's own, from the
    rows the budget already lists, so a tracker agrees with the rest of the app. */
type Trackable = { id: string; label: string; spent: number; count: number; noun: string; tint: string; logo?: string; icon?: string; caps: number[] };
const TRACKABLES: Trackable[] = [
  { id: "swiggy", label: "Swiggy", spent: 1400, count: 1, noun: "order", tint: "#FC8019", logo: "swiggy", caps: [2000, 3000] },
  { id: "zomato", label: "Zomato", spent: 870, count: 1, noun: "order", tint: "#E23744", logo: "zomato", caps: [1500, 2500] },
  { id: "shopping", label: "Shopping", spent: 3400, count: 3, noun: "purchase", tint: "#F4789F", icon: "shopping", caps: [5000, 7000] },
];
/** This month's rows for a tracked thing: a category's own list, or every row
    that merchant appears in. */
/** The tracker the feed ships with (user call: the built-in card is Swiggy —
    the very thing the tracking flow picks). Figures are the world's own row,
    capped at the first cap that flow offers, so the card, the tracking page
    and the stop-tracking sheet cannot drift apart. */
const DASH2_DEFAULT_TRACKER: Dash2Tracker = { ...TRACKABLES[0], cap: TRACKABLES[0].caps[0] };

function dash2TrackerTxns(t: { id: string; label: string; icon?: string }) {
  if (t.icon) return BUDGET_CAT_TXNS[t.id] ?? [];
  return Object.values(BUDGET_CAT_TXNS).flat().filter((x) => x.name === t.label);
}
/** The three things cosimo is checking, in canon order (2856:80572). */
const SETUP_CHECKS = ["Income", "Bills & obligations", "Everyday spends"];

/** Lines that are OURS, not canon: the branches the section doesn't script yet. */
const SETUP_MANUAL = "Tell me the name and the amount, and I'll add it.";
const SETUP_BUDGET =
  "You already have one: ₹29,500 across five categories, ₹14,300 of it gone with 23 days to go.\n\nOpen it from the Oct Budget card on your feed and I'll walk the caps with you there.";

/** A hairline row — the same shape the explore suggestions use. `reply` holds the
    beat and answers; anything else moves to the next beat. */
type SetupRow = {
  icon: string; label: string; sub?: string; reply?: string; pick?: "in" | "out";
  /** hands the conversation to another scripted flow */
  goto?: ScriptId;
  /** the thing this row starts tracking */
  track?: string;
  /** the cap this row sets (null = track it without one) */
  cap?: number | null;
};
/** The scripted flows the chat can run. */
type ScriptId = "goal" | "track";

/** The card that docks above the input: one question, or one list to confirm. */
type SetupDock =
  | { kind: "ask"; title: string; sub: string; options: SetupRow[]; placeholder: string }
  | { kind: "list"; title: string; items: { name: string; amount: string }[]; positive?: boolean; actions: SetupRow[] };

type SetupBeat = {
  /** echoed as the user's own line when the beat opens */
  user?: string;
  /** cosimo's line for this beat */
  say?: string;
  /** how far "what I'm checking" has got: 0 income, 1 bills, 3 all done */
  check?: number;
  /** the beat that DRAWS the list — every later beat only moves it along */
  checklist?: boolean;
  /** hairline rows under cosimo's line */
  rows?: SetupRow[];
  /** the card above the input */
  dock?: SetupDock;
  /** the one-time contribution card and its Create atom pill */
  contribution?: { label: string; amount: string; cta: string };
  /** the month's figure for the thing being tracked, as its own card */
  stat?: { label: string; value: string; sub: string; tint: string; logo?: string; icon?: string };
  /** lands the View Money Feed card — setup ends on the feed */
  feed?: boolean;
  /** what the beat puts ON the feed as it lands */
  adds?: "goal" | "tracker";
};

const GOAL_SETUP: SetupBeat[] = [
  // 0 · M1 (2856:73704) — the ask, and the three things setup can be
  {
    user: SETUP_ENTRY,
    say: "What do you want to set up? You can run a few of these at once.",
    rows: [
      { icon: "💻", label: "Save for something", sub: "A trip, a bike, gold. Anything with a price." },
      // the budget branch hands over to the budget itself (user report: this
      // part is missing) — its own scripted beats are still to come from canon
      { icon: "💰", label: "Set up a budget", sub: "A monthly spend cap. We just track it.", reply: SETUP_BUDGET },
      { icon: "🔍", label: SETUP_TRACK, sub: "Swiggy, a category, or a tab with a friend.", goto: "track" },
    ],
  },
  // 1 · S1.1 (2856:79948) — the ask, and what I'll check
  {
    user: "I want to save for Japan, about ₹1.2 lakh, by March.",
    say: "Japan, ₹1.2L by March. Let me check what I can see first.",
    check: 0,
    checklist: true,
    dock: {
      kind: "ask",
      title: "₹29k from Auto Industries",
      sub: "Every month. Should I consider this in income?",
      options: [{ icon: "", label: "Yes, it's my salary" }, { icon: "", label: "No, don't consider" }],
      placeholder: "Suggest change",
    },
  },
  // 2 · S1.3 (2856:80266) — the credit that stopped
  {
    check: 0,
    dock: {
      kind: "ask",
      title: "₹26k from Quess Corp",
      sub: "Came in Mar, Apr and Jun. Nothing since. Still income?",
      options: [{ icon: "", label: "Yes, still income" }, { icon: "", label: "No, that's my old job" }],
      placeholder: "Suggest change",
    },
  },
  // 3 · 2856:80314 — everything read as income, in one list
  {
    check: 0,
    dock: {
      kind: "list",
      title: "Is this your income?",
      positive: true,
      items: [
        { name: "Auto Industries", amount: "₹29,000" },
        { name: "Quess Corp", amount: "₹26,000" },
      ],
      actions: [
        { icon: "➕", label: "Add income", pick: "in" },
        { icon: "👍🏼", label: "Looks right" },
      ],
    },
  },
  // 4 · S1.4 (2856:80476) — income done, on to the bills
  {
    check: 1,
    dock: {
      kind: "ask",
      title: "₹25k to Pramod Kumar",
      sub: "Every month, on the 3rd. What is this?",
      options: [{ icon: "", label: "Rent" }, { icon: "", label: "Something else" }],
      placeholder: "Suggest change",
    },
  },
  // 5 · S1.5 (2856:80524) — one the user takes out
  {
    check: 1,
    dock: {
      kind: "ask",
      title: "₹10k to Tanusha Tiwari",
      sub: "Only in Jun and Aug. Keep it as a bill?",
      options: [{ icon: "", label: "Yes, keep it" }, { icon: "", label: "No, take it out" }],
      placeholder: "Suggest change",
    },
  },
  // 6 · 2856:80390 — the bills, in one list
  {
    check: 1,
    dock: {
      kind: "list",
      title: "Are these your bills?",
      items: [
        { name: "Pramod Kumar", amount: "₹25,000" },
        { name: "L&T Finance", amount: "₹15,000" },
        { name: "Tanusha Tiwari", amount: "₹10,000" },
      ],
      actions: [
        { icon: "➕", label: "Add a bill", pick: "out" },
        { icon: "👍🏼", label: "Looks right" },
      ],
    },
  },
  // 7 · S1.6 (2856:80572) — everyday spends done, then the balance.
  // The canon section has no S1.7: S1.8 opens on the user having already said
  // "₹12k", so the question that asks for it is OURS until that frame lands.
  // The docked cards are the scan's yes/no confirmations; a question once the
  // scan is done is cosimo's to ask in the thread, like every other (user call R68).
  {
    check: 3,
    say: "That's everything I can see. You have ₹62k across your accounts right now. How much of it can go in now?",
    rows: [
      { icon: "💸", label: "₹12,000" },
      { icon: "🚫", label: "Nothing right now" },
    ],
  },
  // 8 · S1.8 (2856:79884) — lump sum, then anything later
  {
    user: "₹12k.",
    check: 3,
    say: "Anything coming later you want to count, like a bonus? I can't see FDs or mutual funds, so it helps if you tell me.",
    rows: [
      { icon: "🚫", label: "Nothing else" },
      { icon: "➕", label: "Add something coming later", reply: SETUP_MANUAL },
    ],
  },
  // 9 · S1.9 (2856:79917) — the ask, always this sentence
  {
    user: "Nothing else.",
    check: 3,
    say:
      "With ₹12k in, Japan needs ₹18k a month, out on the 5th. Set that, or a different amount? You can change it any time.\n\nWe'll place your money in atom. While it's there, it'll earn 100% of repo rate, with interest paid daily, until it's invested toward your goal",
    contribution: { label: "One-time contribution", amount: "₹12,000", cta: "Create atom" },
  },
  // 10 · S5.7 (2856:81066) — set, and the feed is where it lives now
  { check: 3, say: "Set. ₹18k to Japan on the 5th, starting Oct.", feed: true, adds: "goal" },
];

/** Tracking, in the returning user's chat (canon 2775:17472 "S11.1"): you name
    a merchant or a category, cosimo shows what it has cost this month, you set
    a cap, and it ends on the feed with the tracker on it. */
const TRACK_SETUP = (t: Trackable | null): SetupBeat[] => [
  // 0 · 2775:17472 — the ask
  {
    user: SETUP_TRACK,
    say: "What merchant or category do you want to start tracking?",
    rows: TRACKABLES.map((x) => ({
      icon: "",
      label: x.label,
      sub: `${inr(x.spent)} this month, ${x.count} ${x.noun}${x.count > 1 ? "s" : ""}`,
      track: x.id,
    })),
  },
  // 1 · 2775:17568 — the month's figure, then the cap
  ...(t
    ? [
        {
          user: t.label,
          say: "Here's this month so far. What's your maximum spending cap?",
          stat: { label: `Oct • ${t.label} spends`, value: inr(t.spent), sub: `${t.count} ${t.noun}${t.count > 1 ? "s" : ""} this month`, tint: t.tint, logo: t.logo, icon: t.icon },
          rows: [
            ...t.caps.map((c) => ({ icon: "", label: `${inr(c)} a month`, cap: c })),
            { icon: "", label: "No cap, just track it", cap: null },
          ],
        },
        // 2 · 2775:17712 — set, and the feed is where it lives
        { say: `Done. I'm tracking ${t.label} spends now, see them on your feed.`, feed: true, adds: "tracker" as const },
      ]
    : []),
];

type Turn = { id: number; role: "user" | "cosimo"; text: string; options?: ActionOption[]; feedCard?: boolean; /** the goal-setup beat whose checklist, rows and cards hang off this line */ setupAt?: number; /** which scripted flow that beat belongs to */ setupScript?: ScriptId };

/** The detail slot renders one of these, all in the same shell. */
type DetailKind =
  | "trip" | "budget" | "payments" | "cashflow" | "income" | "spends" | "networth" | "phone"
  // The v2 cashflow drill-down (canon 2186:54430): Cashflow → Outflow/Inflow →
  // one category's spends → a single transaction.
  | "cf-outflow" | "cf-inflow" | "cf-invest" | "cf-category" | "cf-txn"
  | "budget-cat" | "tracking"
  // past months read against the same cap (the home bar's clock glyph)
  | "budget-history"
  // The bank-sync status page the app-bar pill opens (canon 2371:108672)
  | "bank"
  // a goal set up in this session — one of the feed's `goal:` cards
  | "goal";

function ThinkingLine() {
  return (
    <div className="animate-chat-message-in" style={{ paddingTop: 4, paddingBottom: 4, flexShrink: 0 }}>
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

// ── Resume journey (canon 1905:32627, R23) — v2 entry ───────────────────────
// A returning user abandoned goal setup mid-way: the chat opens on a welcome-back
// recap with three ways forward, every path lands a "View Money Feed" card, and
// tapping it is THE state change — the chat morphs back into the bar (closeFull)
// with the feed revealed beneath.

const RESUME_RECAP =
  "Hey, welcome back. You were setting up a goal for your Thailand trip.\n\nYou were planning to save ₹1,20,000 over 12 months, with a ₹10,000 one-time contribution to bring down your monthly savings.";

const RESUME_OPTIONS: { icon: string; label: string }[] = [
  { icon: "🏝️", label: "Continue with this goal" },
  { icon: "✨", label: "Start a new goal" },
  { icon: "👋", label: "Not now" },
];

const RESUME_REPLIES: Record<string, string> = {
  // canon copy for the pinned path; the other two converge on the same hand-off
  "Not now": "No worries! You can set up a goal anytime. For now, let's get started with your Money Feed.",
  "Continue with this goal": "Great, picking your Thailand plan right back up. We'll finish it in a moment. First, let's get you started with your Money Feed.",
  "Start a new goal": "Fresh start it is. We'll shape the new goal in a moment. First, let's get you started with your Money Feed.",
};

/** The welcome-back opener: heading + orb, the recap typing, then the three ways
    forward (same hairline rows as the explore suggestions). */
function ResumeWelcome({ onPick }: { onPick: (label: string) => void }) {
  const [recapDone, setRecapDone] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ ...typography.headerH2, color: TEXT_PRIMARY }}>Hey, Welcome back</span>
        <img src="/return-exp1/orb.png" alt="" width={24} height={24} draggable={false} />
      </div>
      <div style={{ marginTop: 16 }}>
        <CosimoLine text={RESUME_RECAP} active={!recapDone} onDone={() => setRecapDone(true)} />
      </div>
      {recapDone && (
        <div className="animate-chat-message-in" style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 28 }}>
          {RESUME_OPTIONS.map((o, i) => (
            <div key={o.label} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {i > 0 && <div aria-hidden style={{ height: 1, marginLeft: 40, background: OUTLINE_SUBTLE }} />}
              <div
                role="button"
                tabIndex={0}
                onClick={() => onPick(o.label)}
                onKeyDown={(e) => e.key === "Enter" && onPick(o.label)}
                style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
              >
                <span aria-hidden style={{ fontSize: 20, lineHeight: "28px", width: 28, textAlign: "center", flexShrink: 0 }}>{o.icon}</span>
                <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{o.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** "View Money Feed" (canon 2827:61239): the feed sketch and its copy stack up
    the middle of the card, not side by side — 32/20 padding, 28 between the
    sketch and the words, the title at Header/H3 and the line under it at Body
    Small, both centred and both text-primary. */
function FeedHandoffCard({ onOpen }: { onOpen: () => void }) {
  // the sketch's three blocks, at the canon's proportions (92 wide, 37 tall)
  const block = (w: number | string) => (
    <div style={{ width: w, height: 37, borderRadius: 8, background: BG_DISABLED, flexShrink: 0 }} />
  );
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="View Money Feed"
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="animate-chat-message-in"
      style={{
        marginTop: 20,
        background: BG_CARD,
        border: `1px solid ${OUTLINE_SUBTLE}`,
        borderRadius: 16,
        boxShadow: "0px 2px 32px rgba(0,0,0,0.05)",
        padding: "32px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 28,
        cursor: "pointer",
      }}
    >
      <div aria-hidden style={{ width: 92, display: "flex", flexDirection: "column", gap: 6 }}>
        {block("100%")}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {block(49)}
          {block(37)}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center", textAlign: "center" }}>
        <span style={{ ...typography.headerH3, color: TEXT_PRIMARY }}>View Money Feed</span>
        {/* the canon holds this line to 218 so it breaks after "cashflow," */}
        <span style={{ ...typography.bodySmall, color: TEXT_PRIMARY, maxWidth: 218 }}>Your monthly budget, cashflow, goals all at a glance.</span>
      </div>
    </div>
  );
}

/** One hairline row — icon, label, optional subtitle. The shape the explore
    suggestions, the resume options and goal setup all share. */
function SetupRowItem({ row, onPick, live }: { row: SetupRow; onPick: (r: SetupRow) => void; live: boolean }) {
  return (
    <div
      role="button"
      tabIndex={live ? 0 : -1}
      aria-disabled={!live}
      onClick={live ? () => onPick(row) : undefined}
      onKeyDown={live ? (e) => e.key === "Enter" && onPick(row) : undefined}
      style={{ display: "flex", alignItems: "center", gap: 12, cursor: live ? "pointer" : "default" }}
    >
      <span aria-hidden style={{ fontSize: 20, lineHeight: "28px", width: 28, textAlign: "center", flexShrink: 0 }}>{row.icon}</span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{row.label}</span>
        {row.sub && <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>{row.sub}</span>}
      </span>
    </div>
  );
}

function SetupRows({ rows, onPick, live }: { rows: SetupRow[]; onPick: (r: SetupRow) => void; live: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 28 }}>
      {rows.map((r, i) => (
        <div key={r.label} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {i > 0 && <div aria-hidden style={{ height: 1, marginLeft: 40, background: OUTLINE_SUBTLE }} />}
          <SetupRowItem row={r} onPick={onPick} live={live} />
        </div>
      ))}
    </div>
  );
}

/** The done tick (canon 2856:80578) — a filled Valentino disc with a white tick. */
function SetupTick() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="10" fill={VALENTINO_500} />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.6084 6.61082C15.1305 7.13291 15.1305 7.97939 14.6084 8.50148L9.72073 13.3892C9.19864 13.9113 8.35216 13.9113 7.83007 13.3892L5.39157 10.9507C4.86948 10.4286 4.86948 9.58211 5.39157 9.06002C5.91366 8.53793 6.76014 8.53793 7.28223 9.06002L8.7754 10.5532L12.7178 6.61082C13.2399 6.08873 14.0863 6.08873 14.6084 6.61082Z"
        fill={ALPHA_WHITE_FF}
      />
    </svg>
  );
}

/** "What I'm checking" (2856:80572): income, bills, everyday spends — ticked as
    cosimo works through them, the live one spinning, the rest waiting. */
function SetupChecklist({ done }: { done: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 24 }}>
      {SETUP_CHECKS.map((label, i) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {i < done ? (
              <SetupTick />
            ) : i === done ? (
              <span
                aria-hidden
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: `2.7px solid ${OUTLINE_SUBTLE}`,
                  borderTopColor: VALENTINO_500,
                  animation: "spin 900ms linear infinite",
                }}
              />
            ) : (
              <span aria-hidden style={{ width: 10, height: 10, borderRadius: "50%", background: BG_SECONDARY }} />
            )}
          </span>
          <span style={{ ...typography.bodyNormal, color: i <= done ? TEXT_PRIMARY : TEXT_TERTIARY }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

/** The card that docks above the input — one question at a time (2856:80059),
    or one list to confirm (2856:80347). Same shell, two bodies. */
function SetupDockCard({ dock, onPick }: { dock: SetupDock; onPick: (r: SetupRow) => void }) {
  return (
    <div
      className="animate-chat-message-in re1-glass"
      style={{
        // the same glass as the message bar (user call R40) — one surface
        // vocabulary for the two things the chat asks you to touch
        background: "var(--re1-ask-bar-bg, var(--dls-bg-card))",
        border: `1px solid ${OUTLINE_SUBTLE}`,
        backdropFilter: "var(--re1-glass-filter, blur(24px))",
        WebkitBackdropFilter: "var(--re1-glass-filter, blur(24px))",
        borderRadius: RADIUS_M,
        boxShadow: "var(--re1-glass-shine), var(--re1-glass-shadow)",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: dock.kind === "ask" ? 24 : 20,
        overflow: "hidden",
        // the thread is a flex column: without this the card is SQUEEZED to a
        // sliver the moment the conversation outgrows the viewport
        flexShrink: 0,
      }}
    >
      {dock.kind === "ask" ? (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ ...typography.headerH2, color: TEXT_PRIMARY }}>{dock.title}</span>
            <span style={{ ...typography.bodySmall, color: TEXT_SECONDARY }}>{dock.sub}</span>
          </div>
          <div aria-hidden style={{ height: 1, background: OUTLINE_BOLD }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {dock.options.map((o) => (
              <div
                key={o.label}
                role="button"
                tabIndex={0}
                onClick={() => onPick(o)}
                onKeyDown={(e) => e.key === "Enter" && onPick(o)}
                style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
              >
                <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, flex: 1, minWidth: 0 }}>{o.label}</span>
                <span aria-hidden style={{ width: 24, height: 24, borderRadius: "50%", border: `1.7px solid ${TEXT_TERTIARY}`, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <span style={{ ...typography.headerH2, color: TEXT_PRIMARY }}>{dock.title}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* the rules stop at the card's padding (user call R40) — running
                them edge to edge cut the card in three */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div aria-hidden style={{ height: 1, background: OUTLINE_BOLD }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                {dock.items.map((it) => (
                  <div key={it.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
                    <span style={{ ...typography.bodySmall, color: TEXT_PRIMARY, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</span>
                    <span style={{ ...typography.bodySmall, color: dock.positive ? EXT_TEXT_POSITIVE : TEXT_PRIMARY, textAlign: "right" }}>{it.amount}</span>
                  </div>
                ))}
              </div>
              <div aria-hidden style={{ height: 1, background: OUTLINE_BOLD }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {dock.actions.map((a, i) => (
                <div key={a.label} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {i > 0 && <div aria-hidden style={{ height: 1, background: OUTLINE_SUBTLE }} />}
                  <SetupRowItem row={a} onPick={onPick} live />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** What the month has cost on the thing you're about to track (2775:17611):
    hairlines above and below, the figure on the left, the thing on the right. */
function SetupStat({ stat }: { stat: NonNullable<SetupBeat["stat"]> }) {
  return (
    <div style={{ marginTop: 20, borderTop: `1px solid ${OUTLINE_SUBTLE}`, borderBottom: `1px solid ${OUTLINE_SUBTLE}`, padding: "20px 0", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
        <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>{stat.label}</span>
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 32, lineHeight: "40px", color: TEXT_PRIMARY }}>{stat.value}</span>
        <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>{stat.sub}</span>
      </div>
      <div aria-hidden style={{ width: 64, height: 64, borderRadius: "50%", flexShrink: 0, overflow: "hidden", display: "grid", placeItems: "center", background: stat.logo ? BG_PRIMARY : stat.tint, border: stat.logo ? `1px solid ${OUTLINE_SUBTLE}` : "none" }}>
        {stat.logo
          ? <img src={`/return-exp1/merchants/${stat.logo}.png`} alt="" width={64} height={64} draggable={false} style={{ display: "block", objectFit: "cover" }} />
          : stat.icon
            ? <span style={tintedGlyph(`/return-exp1/icons/${stat.icon}.svg`, "#FFFFFF", 28)} />
            : <span style={{ ...typography.headerH2, color: "#FFFFFF" }}>{stat.label.slice(0, 1)}</span>}
      </div>
    </div>
  );
}

/** The one-time contribution and the pill that creates the atom (2856:79923). */
function SetupContribution({ label, amount, cta, onPress, live }: { label: string; amount: string; cta: string; onPress: () => void; live: boolean }) {
  // Create atom works IN the card (canon 2875:84826): the pill gives way to a
  // ring for the beat it takes, and the thread does not think (user call R68).
  const [busy, setBusy] = useState(false);
  const busyTimer = useRef<number | null>(null);
  useEffect(() => () => { if (busyTimer.current) window.clearTimeout(busyTimer.current); }, []);
  const press = () => {
    if (busy) return;
    setBusy(true);
    busyTimer.current = window.setTimeout(() => { setBusy(false); onPress(); }, 900);
  };
  return (
    <div
      style={{
        marginTop: 24,
        background: BG_CARD,
        border: `1px solid ${OUTLINE_SUBTLE}`,
        borderRadius: RADIUS_M,
        boxShadow: ELEVATION_CARD,
        padding: 20,
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
        <span style={{ ...typography.caption, color: TEXT_PRIMARY }}>{label}</span>
        <span style={{ ...typography.headerH2, color: TEXT_PRIMARY }}>{amount}</span>
      </div>
      {busy ? (
        <span
          aria-label="Creating"
          role="status"
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: `4px solid ${OUTLINE_SUBTLE}`,
            borderTopColor: VALENTINO_500,
            animation: "spin 900ms linear infinite",
            flexShrink: 0,
            // sits where the pill's centre was
            margin: "2px 12px",
          }}
        />
      ) : (
      <button
        type="button"
        disabled={!live}
        onClick={press}
        style={{
          ...typography.buttonSmall,
          color: TEXT_PRIMARY,
          // bg-secondary is #171a1f after dark, all but identical to the card it
          // sits on — the pill vanished (user report R40). bg-tertiary is the
          // same #f6f9fc by day and white-10 by night, so it reads on both.
          background: "var(--dls-bg-tertiary)",
          border: "none",
          borderRadius: RADIUS_PILL,
          padding: "8px 16px",
          flexShrink: 0,
          cursor: live ? "pointer" : "default",
        }}
      >
        {cta}
      </button>
      )}
    </div>
  );
}

/** Time-based rAF typewriter — a steady ~52 chars/sec, no chunk jitter (R10). */


/** Top-to-bottom entrance: fades/rises in with a per-row delay when its page
    becomes active; resets instantly (pre-positioned) when the page leaves.
    index 0 is the hero copy; everything below it (pill, cards) starts at 1, so the
    reader always gets the words before the cards arrive. Every arrival plays this
    same entrance — one transition, always (R11). */
function Stagger({ index, active, instant, children }: { index: number; active: boolean; instant?: boolean; children: React.ReactNode }) {
  const delay = 90 + index * 55;
  // instant (R34k): the card lands WITH the page — no rise, no per-card delay;
  // whatever moves inside it (a bar, a ring) carries the arrival instead
  if (instant) return <div style={{ opacity: active ? 1 : 0 }}>{children}</div>;
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

/** Add Goal, the way into goal setup — not a widget, so nothing to hold. A
    slim card on the feed's own shell, the feed's wash centred behind a
    Valentino label (user call, 2026-09-23: settled on this over the canon
    dashed rim, the nudges and the other button finishes). */
function Dash2AddGoal({ onClick }: { onClick: () => void }) {
  const kit = useV2Skin();
  return (
    <button type="button" onClick={onClick} className={`transition-transform active:scale-[0.98] ${kit.cardClass ?? ""}`}
      style={{ ...kit.card("none", 20), width: "100%", height: 56, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", cursor: "pointer" }}>
      {kit.wash && <div aria-hidden style={dash2Wash(VALENTINO_500, 208, 110, "calc(50% - 104px)", -27)} />}
      <span style={{ position: "relative", display: "flex", alignItems: "center", gap: 4 }}>
        <span aria-hidden style={tintedGlyph("/icons/add.svg", VALENTINO_500)} />
        <span style={{ ...typography.headerH4, color: VALENTINO_500 }}>Add goal</span>
      </span>
    </button>
  );
}

/** One card's seat on the v2 feed (user call: cards you can take off). Hold the
    card about half a second to be asked; a nudge of movement (a scroll starting)
    or letting go first cancels, and the tap the hold began as never fires. A
    card on its way out folds shut on the grid-rows trick, its 20px gap going
    with it, so the stack closes up instead of the card blinking out. */
function Dash2FeedSlot({ leaving, onHold, children }: { leaving: boolean; onHold: () => void; children: React.ReactNode }) {
  const timer = useRef<number | null>(null);
  const start = useRef({ x: 0, y: 0 });
  const held = useRef(false);
  const clear = useCallback(() => {
    if (timer.current !== null) { window.clearTimeout(timer.current); timer.current = null; }
  }, []);
  useEffect(() => clear, [clear]);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: leaving ? "0fr" : "1fr",
        marginBottom: leaving ? -20 : 0,
        opacity: leaving ? 0 : 1,
        transition: leaving ? `grid-template-rows 320ms ${DASH2_MORPH_EASE}, margin-bottom 320ms ${DASH2_MORPH_EASE}, opacity 200ms ease` : "none",
        WebkitTouchCallout: "none",
        userSelect: "none",
      } as React.CSSProperties}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        held.current = false;
        start.current = { x: e.clientX, y: e.clientY };
        clear();
        timer.current = window.setTimeout(() => { timer.current = null; held.current = true; onHold(); }, 480);
      }}
      onPointerMove={(e) => { if (timer.current !== null && Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 8) clear(); }}
      onPointerUp={clear}
      onPointerCancel={clear}
      onClickCapture={(e) => { if (held.current) { held.current = false; e.preventDefault(); e.stopPropagation(); } }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div style={{ minHeight: 0, overflow: leaving ? "hidden" : undefined }}>{children}</div>
    </div>
  );
}

// ── Page content declarations ────────────────────────────────────────────────

type PageId = "home" | "trip";


// ─────────────────────────────────────────────────────────────────────────────

export default function ReturnExp1Sim({ onExitHome, variant = "v1", homeTheme = "ambient" }: { onExitHome?: () => void; variant?: "v1" | "v2"; homeTheme?: Dash2HomeTheme } = {}) {
  // V2 (canon 1837:28496, R22): same machinery — pages, chat morph, internal
  // pages — different HOME: white ground with colour washes, ‹ Cosimo app bar,
  // All/Budget/Goals chips, the stat-card stack. Everything else is shared.
  const v2 = variant === "v2";
  // Family-values delight (selective emphasis): tapping the Cosimo title makes
  // the ground breathe once — hidden in plain sight, found by the curious.
  const [washPulse, setWashPulse] = useState(0);
  const isMobile = useIsMobileProto();
  const frameRef = useRef<HTMLDivElement>(null);
  const scrollerRefs = useRef<Record<PageId, HTMLDivElement | null>>({ home: null, trip: null });
  const welcomeRefs = useRef<Record<PageId, HTMLDivElement | null>>({ home: null, trip: null });
  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const threadContentRef = useRef<HTMLDivElement>(null);
  const threadSpacerRef = useRef<HTMLDivElement>(null);
  const detailChromeRef = useRef<HTMLDivElement>(null);

  const [frame, setFrame] = useState({ w: 360, h: 780, kb: false });
  const restingFrameHeight = useRef(0);
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
  // Feed skin (R29 exploration): five modern treatments + the canon baseline,
  // switched from the debug panel. Provided via context so the home cards
  // restyle without prop-drilling.
  // ONE Home theme (R31b): the art looks and the cube budget card hang off it —
  // art54* themes the cards directly, the skin ids ride the skin kit. It is a
  // mount prop now, not a panel switch: Ambient on the live route, White · Orb
  // on its archived one (user call).
  const themeRaw: string = homeTheme;
  const themed = themeRaw.startsWith("art54");
  const [budgetStateRaw] = useProtoFlag("returnExp1V2BudgetState");
  const budgetState = budgetStateFor(homeTheme, budgetStateRaw);
  // no bills this month and the Upcoming payments card is not shown; all paid,
  // it says the month is done (user calls, 2026-09-23)
  const [billsState] = useProtoFlag("returnExp1V2BillsState");
  const ambient = themeRaw === "ambient";
  const skinKit = ambient ? V2_SKINS.ambient : V2_SKINS.canon;
  // the Ambient scene flag: a data attribute on the frame, and globals.css
  // swaps the scene vars per value (light and dark each keep their own file)
  // Focus dissolve is the v2 chat opening (the switch left the panel, user call)
  const chatMotionMode: ReturnChatMotion = v2 ? "focus" : "current";
  // "Top background" (debug panel), back on user call. "off" leaves the
  // attribute off the frame, which is the page as it stands: no top art.
  // Every other value is a key globals.css swaps the scene vars for.
  const [sceneFlag] = useProtoFlag("returnExp1V2Scene");
  const sceneVariant = sceneFlag === "off" ? undefined : sceneFlag;
  // iOS standalone lays the page out SHORT by the top inset: that strip cannot
  // be laid out into, it IS the opaque status bar, and theme-color is the only
  // thing that paints it. A full-bleed scene therefore appears to start below a
  // flat white band unless the bar is tinted to the art's own top edge (user
  // report from the home-screen web app). Each scene publishes that colour as
  // --re1-amb-bar next to its art in globals.css.
  const barMode = useTheme().mode;
  useEffect(() => {
    const el = frameRef.current;
    if (!ambient || !sceneVariant || !el) return;
    // Read on the NEXT frame: the theme provider toggles the `.dark` class in
    // its own effect, and a parent's effect runs AFTER its children's, so
    // reading now would take the OUTGOING mode's value on every toggle.
    const id = requestAnimationFrame(() => {
      setBarTint(getComputedStyle(el).getPropertyValue("--re1-amb-bar").trim() || null);
    });
    return () => { cancelAnimationFrame(id); setBarTint(null); };
  }, [ambient, sceneVariant, barMode]);
  const artColoured = themeRaw === "art54c" || themeRaw === "art54corb";
  // "Progress fill" opening (R34k): the feed lands whole, the marks sweep
  const introFill = DASH2_INTRO_FILL;
  // "action": the hero asks something and offers a few prompts (Figma 1577:54844)
  const headerAction = headerRaw === "action";
  const pillH = PILL_REST_HEIGHT; // the canonical input is 57 tall (1697:70729)

  const [navMoving, setNavMoving] = useState(false);
  // v2 L1 pushes release the slide-in ONE frame after the page commits (user
  // report: the first push after a reload jerked, later ones did not). A CSS
  // transition's clock starts at the top of the frame that changes the style,
  // and a first push spends that frame mounting the L1, so its first painted
  // frame was already ~30px into the ride; a repeat push mounts nothing and
  // starts from 0. Parking the sheet through the mount and flipping it on the
  // next frame starts every ride from 0. Pops still snap on `active` alone.
  const [sheetIn, setSheetIn] = useState(false);
  useEffect(() => {
    if (page !== "trip") { setSheetIn(false); return; }
    if (document.hidden) { setSheetIn(true); return; } // rAF is paused; nobody sees the ride
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setSheetIn(true)); });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, [page]);
  // v2: once the home feed has shown, it STAYS shown (user call R34o) — a
  // detail slides over it and back off it, and the cards are simply there.
  const [homeEverShown, setHomeEverShown] = useState(false);
  const [full, setFull] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // The detail slot renders one of two pages (same shell): trip or budget.
  const [detailKind, setDetailKind] = useState<DetailKind>("trip");
  const detailKindRef = useRef<DetailKind>("trip");
  useEffect(() => {
    detailKindRef.current = detailKind;
  }, [detailKind]);
  // the debug panel shows only the flags this screen can use
  const protoScreen = page === "home" ? "home" : detailKind;
  useEffect(() => setProtoScreen(protoScreen), [protoScreen]);

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
  // The cashflow LEVELS count as one page here (R28). They share a mounted
  // subtree, so re-running the arrival cascade would fade the shared chart out
  // and cascade it back — which reads as opening a new page, the exact opposite
  // of the level converting in place.
  const pageKey = `${page === "home" ? "home" : `trip:${DASH2_CF_LEVELS[detailKind] ? "cf" : detailKind}`}:${settledAction ?? ""}`;

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

  const f = useSpringValue(full ? 1 : 0, 420, 41, 0.0015, 0.03);
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

  // v2 feed (user call): the stack's order plus the goals set up here. Loaded
  // after mount so the server and the first client paint agree; written back
  // whenever it changes (the untouched default is never written).
  const [feed, setFeed] = useState<Dash2Feed>(DASH2_FEED_DEFAULT);
  useEffect(() => {
    const saved = dash2LoadFeed();
    if (saved) setFeed(saved);
  }, []);
  useEffect(() => {
    if (feed === DASH2_FEED_DEFAULT) return;
    try { window.sessionStorage.setItem(DASH2_FEED_KEY, JSON.stringify(feed)); } catch { /* the feed still applies for this session */ }
  }, [feed]);
  // the goal the Stash page is open on (a `goal:` card)
  const [activeGoal, setActiveGoal] = useState<string | null>(null);
  // the tracker the tracking page is open on; null = the food one the feed ships with
  const [activeTracker, setActiveTracker] = useState<string | null>(null);
  // the goal setup just set: its ring sweeps up as the feed comes back into
  // view, once — the flag clears after the sweep so a later chat close is still
  const [freshGoal, setFreshGoal] = useState<string | null>(null);
  useEffect(() => {
    if (full || !freshGoal) return;
    const t = window.setTimeout(() => setFreshGoal(null), 1400);
    return () => window.clearTimeout(t);
  }, [full, freshGoal]);
  // Hold a card to take it off the feed: the sheet asks, the card folds away
  // (320ms) and only then leaves the list, so the stack closes up on it.
  // Which side of the scan the picker is open on, if any — it is an overlay
  // over the chat, not one of the app's pages (canon 3057:92281).
  // `pickOpen` rides the spring; `pickFlow` is the side it is showing and
  // SURVIVES the close, so the list does not swap sides on its way back down.
  const [pickOpen, setPickOpen] = useState(false);
  const [pickFlow, setPickFlow] = useState<"in" | "out">("in");
  const pickS = useSpringValue(pickOpen ? 1 : 0, 300, 30);
  const openPicker = useCallback((f: "in" | "out") => { setPickFlow(f); setPickOpen(true); }, []);
  const [removeId, setRemoveId] = useState<Dash2WidgetId | null>(null);
  const [leavingId, setLeavingId] = useState<Dash2WidgetId | null>(null);
  const removeWidget = useCallback((id: Dash2WidgetId) => {
    setLeavingId(id);
    window.setTimeout(() => {
      setFeed((f) => ({ order: f.order.filter((w) => w !== id), goals: f.goals.filter((g) => `goal:${g.id}` !== id), trackers: f.trackers.filter((t) => `track:${t.id}` !== id) }));
      setLeavingId((l) => (l === id ? null : l));
    }, 320);
  }, []);

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
  // TOP inset only — the native OS owns the bottom one (user call R33n/R33u).
  // A standalone cold start can report env(safe-area-inset-top) as 0 for the
  // first frames, and the old one-shot probe froze that 0 in (the bar stuck to
  // the physical top, R33u) — so this one retries and re-measures on any
  // viewport change, keeping state only when the value actually moves.
  const [safeTop, setSafeTop] = useState(0);
  // The bottom inset is real only when the layout viewport reaches the physical
  // bottom edge. iOS 26 home-screen web apps (translucent status bar +
  // viewport-fit=cover) lay the page out short by the TOP inset: that missing
  // strip cannot be laid out into and is painted by the root background (the
  // "band" under the ask bar, R39), while env() may still report a bottom
  // inset there (R33n's double count). A short viewport already holds the home
  // indicator in that strip, so it reserves nothing.
  const [safeBottom, setSafeBottom] = useState(0);
  useEffect(() => {
    if (!isMobile) return;
    const measure = () => {
      const probe = document.createElement("div");
      probe.style.cssText = "position:fixed;left:0;top:0;height:0;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none";
      document.body.appendChild(probe);
      const cs = getComputedStyle(probe);
      const v = parseFloat(cs.paddingTop) || 0;
      const reaches = window.innerHeight >= window.screen.height;
      const b = reaches ? parseFloat(cs.paddingBottom) || 0 : 0;
      probe.remove();
      setSafeTop((cur) => (cur === v ? cur : v));
      setSafeBottom((cur) => (cur === b ? cur : b));
    };
    measure();
    const t1 = window.setTimeout(measure, 300);
    const t2 = window.setTimeout(measure, 1200);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [isMobile]);
  // On device the app bar seats a breath BELOW the safe area (user call,
  // R33l) — the pinned scene still runs to the physical top edge; only the
  // chrome (and everything hung off chromeH) drops the extra 12.
  const statusH = isMobile ? safeTop + 12 : STATUS_BAR_HEIGHT;
  const chromeH = statusH + APP_BAR_HEIGHT;
  const heroPadTop = chromeH + (paper ? 0 : 16); // the hero header starts flush under the app bar (R13)
  const kbSpace = isMobile ? 20 : MOCK_KEYBOARD_HEIGHT + KEYBOARD_GAP;
  // On device the bar clears the real home-indicator inset when the viewport
  // reaches the bottom edge, and hugs the viewport's edge when iOS has already
  // cut that strip off (R37b/R39, see safeBottom). Only a keyboard changes
  // that: the shell is then resized to sit on the keyboard, the indicator area
  // is gone, and 16 is the gap (R34h). Opening the chat alone moves nothing
  // (user call R39c) — `full` used to stand in for the keyboard here, which
  // dropped the bar 18px on every chat open.
  const bottomPillTop = frame.h - (isMobile ? (frame.kb ? 16 : safeBottom) : 24) - pillH;
  // Bottom-bar chat is a real chat bar: the input KEEPS its spot at the very
  // bottom (no mock keyboard) and the thread grows above it (R11).
  const fullInputTop = bottomAsk ? bottomPillTop : frame.h - kbSpace - pillH;
  // ONE hero geometry for every page (max copy height wins): identical pill
  // position and hero edge everywhere, so page crossfades never double-image.
  // The hero HUGS its own copy on every page (R11) — a unified max height left
  // short pages with dead air above the fold. Per-page geometry, so the pill and
  // the hero edge sit right under whatever that page says.
  const inputRestTops = useMemo(() => ({
    home: heroPadTop + welcomeHs.home + 32,
    trip: heroPadTop + welcomeHs.trip + 32,
  }), [heroPadTop, welcomeHs]);
  const inputRestTop = inputRestTops[page];
  const heroPb = paper ? 8 : 24; // v2: tighter below the pill (R7)
  const heroRestFor = (pid: PageId) =>
    pid === "home" ? chromeH + 4 : heroPadTop + welcomeHs[pid] + heroPb;

  const measure = useCallback(() => {
    const el = frameRef.current;
    if (!el) return;
    // a frame more than 100px short of the window is the shell capped to the
    // visual viewport while the keyboard is up (R39c) — never a safe-area inset
    const inputFocused = inputRef.current === document.activeElement;
    // Android can resize innerHeight itself; compare with the unfocused frame
    // as well as the window so its keyboard gets the same 16px clearance.
    const kb = window.innerHeight - el.clientHeight > 100 ||
      (inputFocused && restingFrameHeight.current - el.clientHeight > 100);
    if (!inputFocused) restingFrameHeight.current = el.clientHeight;
    const nextFrame = { w: el.clientWidth, h: el.clientHeight, kb };
    setFrame(prev => prev.w === nextFrame.w && prev.h === nextFrame.h && prev.kb === nextFrame.kb ? prev : nextFrame);
    setWelcomeHs((prev) => {
      const next = { ...prev };
      (Object.keys(next) as PageId[]).forEach((pid) => {
        const w = welcomeRefs.current[pid];
        if (w && w.offsetHeight > 0) next[pid] = w.offsetHeight;
      });
      return next.home === prev.home && next.trip === prev.trip ? prev : next;
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
  // Two copies of the var (R39c): the FRAME's drives the shared chrome, the
  // scrolling PAGE's own drives its in-page app-bar band. A page sliding under
  // or off an opaque sheet keeps its scrolled blur until the settle, while the
  // incoming page reads its own 0 — one shared var made the outgoing page's
  // blur vanish the instant a card was tapped, a beat before the sheet arrived.
  const writeScrollVar = useCallback((t: number, pageEl?: HTMLElement | null) => {
    const clamped = Math.max(0, Math.min(1, t));
    if (Math.abs(clamped - scrollVarRef.current) < 0.004 && clamped !== 0 && clamped !== 1) return;
    scrollVarRef.current = clamped;
    const v = clamped.toFixed(3);
    frameRef.current?.style.setProperty("--re1-t", v);
    pageEl?.style.setProperty("--re1-pt", v);
  }, []);
  const makeScrollHandler = useCallback(
    (pid: PageId) => () => {
      const el = scrollerRefs.current[pid];
      if (!el) return;
      const y = el.scrollTop;
      scrollYRef.current[pid] = y; // ref only — no re-render per scroll frame
      // Fade the shared blur surface itself over 48px. An opacity below 1
      // on an ancestor creates a backdrop root, which prevents a nested
      // filter from sampling the page until the ancestor becomes opaque.
      const ambientBlur = Math.min(1, Math.max(0, y / 48)).toFixed(3);
      el.style.setProperty("--re1-ambient-blur", ambientBlur);
      if (pid !== pageRef.current || full || navMoving || detailMoveRef.current) return;
      frameRef.current?.style.setProperty("--re1-ambient-blur", ambientBlur);
      if (bottomAsk) {
        // No dock morph — the bar just washes in over the first stretch of scroll.
        writeScrollVar((y - 8) / 88, el);
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
    [writeScrollVar, welcomeHs, full, statusH, pillH, bottomAsk, navMoving],
  );

  // ── Page navigation: destination opens at its top; the outgoing page just
  // freezes and fades. The scroll-flip var resets with the new page. ──
  useEffect(() => {
    if (page === "home" && genPhase === "done") setHomeEverShown(true);
  }, [page, genPhase]);
  /** Land a new value on the SHARED top band (data-re1-top-blur) mid-move. The
      band is ONE fixed layer across BOTH pages, and which page it belongs to
      depends on which way you are going — the two directions are not
      symmetrical, and every write here goes one way or the other:

      OUT (`ride`): the page you are leaving stays whole on screen under the
      arriving sheet for the rest of the ride, so landing the destination's
      value outright read as the top blur blinking out the frame a row was
      tapped (user report). The band rides the swap's own curve across instead.

      BACK: the page you are returning to is UNCOVERED, so it owns the band from
      the first frame — fading its blur in behind the leaving sheet reads as the
      blur arriving late (user report, and the pin behind "Home blur is restored
      from the first return frame").

      The var itself always goes straight to its destination, so everything
      downstream of it is correct either way; only the band's own opacity rides,
      then releases onto the value already waiting for it. Scroll frames must
      NOT come through here, or the blur would lag the finger by a whole ride. */
  const landAmbientBlur = useCallback((to: string, ride = false) => {
    const host = frameRef.current;
    if (!host) return;
    const from = host.style.getPropertyValue("--re1-ambient-blur") || "0";
    host.style.setProperty("--re1-ambient-blur", to);
    if (!ride || from === to || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const band = host.querySelector<HTMLElement>("[data-re1-top-blur]")?.animate(
      [{ opacity: from }, { opacity: to }],
      { duration: NAV_RIDE_MS, easing: "cubic-bezier(0.32, 0.72, 0, 1)" },
    );
    // Start it by hand, the way the page swap starts its own: a throttled pane
    // starves rAF, and a fresh animation then stays PENDING at time 0 for good
    // — the band would hold the old value and never let go.
    const t0 = document.timeline.currentTime;
    if (band && t0 != null) band.startTime = t0;
  }, []);
  const goToPage = useCallback((next: PageId) => {
    if (next === pageRef.current) return;
    const destEl = scrollerRefs.current[next];
    const returningHome = next === "home";
    const preservedScroll = returningHome ? (scrollYRef.current.home ?? destEl?.scrollTop ?? 0) : 0;
    const currentAmbientBlur = frameRef.current?.style.getPropertyValue("--re1-ambient-blur") || "0";
    if (destEl && !returningHome) {
      destEl.scrollTop = 0;
      destEl.style.setProperty("--re1-pt", "0");
      destEl.style.setProperty("--re1-ambient-blur", currentAmbientBlur);
    } else if (destEl) {
      destEl.scrollTop = preservedScroll;
      destEl.style.setProperty("--re1-ambient-blur", Math.min(1, Math.max(0, preservedScroll / 48)).toFixed(3));
    }
    scrollYRef.current[next] = preservedScroll;
    // a push from home holds the shared chrome at home's scroll until the sheet
    // has covered it (the settle resets it); back reveals an unscrolled home,
    // so it resets at once (R39c)
    if (next === "home") {
      writeScrollVar(preservedScroll / 88, destEl);
      // Restore before the first return frame, not after the 470ms settle.
      landAmbientBlur(clamp01(preservedScroll / 48).toFixed(3));
    }
    setNavMoving(true);
    setPage(next);
  }, [writeScrollVar, landAmbientBlur]);

  // Settle beat: tidy the hidden page once the ride has played out. This same
  // timer holds the input gate (inert / pointer-events / overflow below), so it
  // tracks the ride and nothing longer — it inherited 820ms from the old
  // fade+stagger transition (R9b) and kept the landed page dead for ~400ms
  // after it had visibly arrived: taps and back both went nowhere. Gate and
  // tidy-up must stay on ONE timer — the tidy-up resets the shared scroll var,
  // so unlocking scroll before it runs would let it stomp a fresh scroll.
  const settleTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!navMoving) return;
    settleTimer.current = window.setTimeout(() => {
      const other: PageId = page === "trip" ? "home" : "trip";
      const otherEl = scrollerRefs.current[other];
      if (otherEl) {
        if (other === "trip") {
          otherEl.scrollTop = 0; // invisible by now — free
          otherEl.style.setProperty("--re1-pt", "0");
          otherEl.style.setProperty("--re1-ambient-blur", "0");
          scrollYRef.current[other] = 0;
        }
      }
      const arrivedY = scrollerRefs.current[page]?.scrollTop ?? 0;
      writeScrollVar((arrivedY - 8) / 88);
      frameRef.current?.style.setProperty("--re1-ambient-blur", Math.min(1, Math.max(0, arrivedY / 48)).toFixed(3));
      // the settle must respect the BOTTOM ask (user report R34q: the box
      // shifted on arriving at an L1) — only the in-flow pill rests mid-page
      setRestRect(bottomAsk
        ? { top: bottomPillTop, left: BAR_MARGIN, w: frame.w - BAR_MARGIN * 2, h: pillH }
        : { top: inputRestTop, left: PILL_MARGIN, w: frame.w - PILL_MARGIN * 2, h: pillH });
      setNavMoving(false);
    }, NAV_RIDE_MS + 50);
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
  }, [bottomAsk, bottomPillTop, frame.w, pillH, barInsight, headerAction, statusH, inputRestTops, writeScrollVar]);
  const openFullFromGesture = useCallback(() => {
    if (!isMobile) { openFull(); return; }
    // Mount and focus inside the original tap, before WebKit's user activation
    // expires. An effect or delayed focus can open the page without a keyboard.
    flushSync(() => openFull());
    inputRef.current?.focus({ preventScroll: true });
  }, [isMobile, openFull]);
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
    frameRef.current?.style.setProperty("--re1-ambient-blur", "0");
    setFull(false);
    inputRef.current?.blur();
  }, [bottomAsk, bottomPillTop, frame.w, pillH, inputRestTops, writeScrollVar]);
  // Desktop: focus once the expansion has mostly landed.
  useEffect(() => {
    if (!full || isMobile) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 380);
    return () => window.clearTimeout(t);
  }, [full, isMobile]);

  // ── Goal setup (canon 2856:72931) — the scripted flow the chat can run ──
  // Which scripted flow the chat is running, and — for tracking — the thing it
  // picked and the cap it set. The refs carry them INTO the same handler that
  // set them, since the next beat is entered before React has re-rendered.
  const [script, setScript] = useState<ScriptId>("goal");
  const scriptRef = useRef<ScriptId>("goal");
  const [trackPick, setTrackPick] = useState<string | null>(null);
  const trackPickRef = useRef<string | null>(null);
  const trackCapRef = useRef<number | null>(null);
  const beatsFor = useCallback(
    (id: ScriptId, pick: string | null = trackPick) => (id === "track" ? TRACK_SETUP(TRACKABLES.find((t) => t.id === pick) ?? null) : GOAL_SETUP),
    [trackPick],
  );
  const [setupIdx, setSetupIdx] = useState<number | null>(null);
  const setupIdxRef = useRef<number | null>(null);
  setupIdxRef.current = setupIdx;
  // The card waits a beat after the answer, so the flow reads as a reply rather
  // than a card swap.
  const [dockArmed, setDockArmed] = useState(false);
  // Walked away from a question: the scan list is done with, rather than sitting
  // in the thread for the rest of the session (user call R67).
  const [setupDismissed, setSetupDismissed] = useState(false);
  // Income and bills the user added from the picker. The scan says nothing about
  // them in the chat — they simply turn up in the list the card comes back with
  // (user call R67): while the scan runs, the checklist is the whole screen.
  const [setupAdded, setSetupAdded] = useState<{ flow: "in" | "out"; name: string; amount: number }[]>([]);
  // What the docked question takes off the BOTTOM of the thread, so the
  // conversation ends above it rather than running on behind it.
  const [dockH, setDockH] = useState(0);
  const dockRef = useRef<HTMLDivElement>(null);
  // A measured tail keeps the current message parked as replies grow. The
  // thread's outer column has no gap, so adding/removing filler cannot bounce it.
  const parkElRef = useRef<HTMLDivElement | null>(null);
  const dockTimer = useRef<number | null>(null);
  const enterBeat = useCallback((i: number, instant = false, selection?: string) => {
    const sid = scriptRef.current;
    const b = beatsFor(sid, trackPickRef.current)[i];
    if (!b) return;
    setSetupIdx(i);
    if (i === 0) { setSetupDismissed(false); setSetupAdded([]); }
    setDockArmed(false);
    if (dockTimer.current) window.clearTimeout(dockTimer.current);
    dockTimer.current = window.setTimeout(() => setDockArmed(true), 450);
    const userText = selection ?? b.user;
    if (userText) setTurns((t) => [...t, { id: ++seqRef.current, role: "user", text: userText }]);
    if (b.say) {
      const land = () => {
        setTurns((t) => [...t, { id: ++seqRef.current, role: "cosimo", text: b.say!, setupAt: i, setupScript: sid, feedCard: b.feed }]);
        // "Set." puts the goal ON the feed (user call): the card is there the
        // moment View Money Feed hands you back, slotted above Add Goal, and
        // its ring sweeps up as the chat clears
        if (b.adds) {
          const id = Date.now().toString(36);
          const t = TRACKABLES.find((x) => x.id === trackPickRef.current);
          const card: Dash2WidgetId = b.adds === "goal" ? `goal:${id}` : `track:${id}`;
          setFeed((f) => {
            const order = [...f.order];
            const at = order.indexOf("add-goal");
            order.splice(at < 0 ? order.length : at, 0, card);
            return {
              order,
              goals: b.adds === "goal"
                ? [...f.goals, { id, label: SETUP_GOAL.label, saved: SETUP_GOAL.lump, target: SETUP_GOAL.target, eta: SETUP_GOAL.eta, monthly: SETUP_GOAL.monthly, day: SETUP_GOAL.day }]
                : f.goals,
              trackers: b.adds === "tracker" && t
                ? [...f.trackers, { id, label: t.label, spent: t.spent, count: t.count, noun: t.noun, cap: trackCapRef.current, tint: t.tint, logo: t.logo, icon: t.icon }]
                : f.trackers,
            };
          });
          setFreshGoal(id);
        }
      };
      // `instant`: the wait was already spent elsewhere (the Create atom pill's
      // own loader), so the line lands without a thinking beat (user call R68)
      if (instant) { land(); return; }
      setThinking(true);
      if (replyTimer.current) window.clearTimeout(replyTimer.current);
      replyTimer.current = window.setTimeout(() => {
        setThinking(false);
        land();
      }, 900);
    }
  }, [beatsFor]);
  useEffect(() => () => { if (dockTimer.current) window.clearTimeout(dockTimer.current); }, []);
  /** Add Goal opens the chat ON the setup flow — it used to open a blank one and
      leave the user to ask for it (user call R40). */
  const startSetup = useCallback(() => {
    openFull();
    scriptRef.current = "goal";
    setScript("goal");
    enterBeat(0);
  }, [openFull, enterBeat]);

  // ── Chat ──
  // Set when an action is picked: the next reply is the outcome of THAT choice
  // rather than a line from the pool. Text already on screen never rewrites itself.
  const pendingReply = useRef<string | null>(null);
  const send = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text || thinking) return;
    if (text === SETUP_ENTRY) {
      setDraft("");
      scriptRef.current = "goal";
      setScript("goal");
      enterBeat(0);
      return;
    }
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
  }, [thinking, enterBeat]);
  useEffect(() => () => { if (replyTimer.current) window.clearTimeout(replyTimer.current); }, []);
  /** Hand a question to Cosimo: open the chat and put it in the user's mouth,
      so the flow continues in the conversation (user call R36f — replanning a
      goal and linking an account both belong there, not in a bespoke screen). */
  const askCosimo = useCallback((text: string) => {
    openFull();
    send(text);
  }, [openFull, send]);

  // ── Resume journey (R23): the v2 entry opens ON the chat, welcome-back state.
  // The Entry switch left the panel (user call): v2 always opens on the feed.
  const resumeEntry = false;
  // Boot one tick AFTER mount: the flag store hydrates localStorage in its own
  // mount effect, so deciding synchronously would always see the default and
  // open the chat even when the entry is set to "Feed".
  const resumeEntryRef = useRef(resumeEntry);
  resumeEntryRef.current = resumeEntry;
  const resumeBootRef = useRef(false);
  useEffect(() => {
    if (resumeBootRef.current) return;
    const t = window.setTimeout(() => {
      if (resumeBootRef.current) return;
      resumeBootRef.current = true;
      if (resumeEntryRef.current) openFull();
    }, 40);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /** A resume option picked: echo it, think a beat, land the reply + feed card. */
  const resumePick = useCallback((label: string) => {
    setTurns((t) => [...t, { id: ++seqRef.current, role: "user", text: label }]);
    setThinking(true);
    if (replyTimer.current) window.clearTimeout(replyTimer.current);
    replyTimer.current = window.setTimeout(() => {
      setThinking(false);
      setTurns((t) => [...t, { id: ++seqRef.current, role: "cosimo", text: RESUME_REPLIES[label], feedCard: true }]);
    }, 900);
  }, []);

  /** Wipes the thread — the chat's New chat chip. */
  const startNewChat = useCallback(() => {
    if (replyTimer.current) window.clearTimeout(replyTimer.current);
    setThinking(false);
    setTurns([]);
    setDraft("");
    setSetupIdx(null);
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


  // ── Interpolations ── (scroll-driven chrome now lives in the --re1-t CSS var)

  // The chat is a white surface — the purple has no business being there, so it
  // leaves over the first third of the expansion rather than riding it most of the
  // way up. textFlip is the same ramp inverted, and MUST stay locked to it: the
  // hero copy is white-on-purple and has to become dark exactly as the surface whitens.
  const whiten = clamp01(f / 0.32);
  const textFlip = paper ? 1 : whiten;
  // Thread appears only near full-open and is GONE before the hero starts moving
  // much on collapse — kills the mid-flight overlap jerk (R5).
  // Opening onto an ONGOING chat is a relay, not a crossfade: the cards leave first,
  // the hero copy slides down and goes with them, and only then does the thread come
  // in. Overlapping all three read as a muddy dissolve (R11).
  const chatStage = turns.length > 0 ? clamp01((f - 0.5) / 0.5) : 0; // the thread's own ramp
  // The page header leaves with its cards, including when opening an empty chat.
  const chatMul = 1 - clamp01(f / 0.35);
  // the thread (header included) arrives as the page's own copy leaves
  const chatMotion = returnChatMotion(chatMotionMode, f, paper && !ambient ? BG_CARD : BG_PRIMARY);
  const chatIn = chatMotion.contentOpacity;
  const sugF = chatIn;

  // The chat morph pill: launch spot (frozen at open) → fullscreen input.
  const chatMargin = bottomAsk ? BAR_MARGIN : CHAT_PILL_MARGIN;
  const fullPillRect = { left: chatMargin, top: fullInputTop, w: frame.w - chatMargin * 2, h: pillH };
  const pill = {
    left: lerp(restRect.left, fullPillRect.left, f),
    // The keyboard owns the bottom edge; don't ease toward a moving endpoint.
    top: bottomAsk ? fullInputTop : lerp(restRect.top, fullPillRect.top, f),
    w: lerp(restRect.w, fullPillRect.w, f),
    h: lerp(restRect.h, fullPillRect.h, f),
  };
  // Goal setup: the card only docks once cosimo's line has finished typing, so
  // the question never lands on top of the sentence that sets it up.
  const setupBeat = setupIdx == null ? null : beatsFor(script)[setupIdx];
  const lastTurn = turns[turns.length - 1];
  const setupTyped = !lastTurn || lastTurn.role === "user" || doneIds.has(lastTurn.id);
  const setupDockRaw = full && setupBeat?.dock && dockArmed && setupTyped && !thinking ? setupBeat.dock : null;
  // The list card is the scan's receipt: anything picked in the meantime is in it
  // when it comes back, which is where the confirmation used to be said out loud.
  const setupDock = useMemo(() => {
    if (setupDockRaw?.kind !== "list") return setupDockRaw;
    const flow = setupDockRaw.actions.find((a) => a.pick)?.pick;
    const mine = setupAdded.filter((a) => a.flow === flow);
    if (!flow || mine.length === 0) return setupDockRaw;
    return { ...setupDockRaw, items: [...setupDockRaw.items, ...mine.map((a) => ({ name: a.name, amount: inr(a.amount) }))] };
  }, [setupDockRaw, setupAdded]);
  // The card is as tall as its question, so the thread measures it rather than
  // guessing — that is what keeps the last line clear of the question.
  useEffect(() => {
    const el = dockRef.current;
    if (!setupDock || !el) {
      // Between two dock beats the card is only RE-ARMING (450ms). Zeroing its
      // height there grew the thread's viewport, the browser clamped the parked
      // scrollTop against the shorter content, and the whole conversation bounced
      // — the jerk every answer made (user call R67). Hold the height while the
      // flow is still on a dock beat; only a beat without a card gives it back.
      if (!setupBeat?.dock) setDockH(0);
      return;
    }
    const measure = () => setDockH(el.getBoundingClientRect().height + 16);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [setupDock, setupBeat?.dock]);
  // The user's message LEADS its beat (user call R40, the onboarding's settled
  // autoscroll): it parks at the top and the reply types beneath it. The park
  // holds for exactly ONE reply — the beat after it rides the bottom again, so a
  // scripted run keeps following the conversation.
  const lastIdx = turns.length - 1;
  // While cosimo works through income, bills and spends the SCAN leads the
  // screen: its line and "what I'm checking" park at the top and the questions
  // come and go beneath them, so that block is what's cleanly up front rather
  // than the answer above it (user call R67). It holds until the user speaks
  // again — then their own line takes the lead back, as every other beat.
  const scanIdx = setupDismissed
    ? -1
    : turns.findIndex((t) => t.setupAt != null && beatsFor(t.setupScript ?? "goal")[t.setupAt]?.checklist);
  const scanLeads = scanIdx >= 0 && (setupBeat?.check !== 3 || lastIdx === scanIdx) && !turns.slice(scanIdx + 1).some((t) => t.role === "user");
  const parkIdx =
    scanLeads
      ? scanIdx
      : turns[lastIdx]?.role === "user" ? lastIdx : turns[lastIdx - 1]?.role === "user" ? lastIdx - 1 : lastIdx;
  const parkId = parkIdx >= 0 ? turns[parkIdx].id : null;
  const stopChatScroll = useAnchoredChatScroll({
    viewport: threadRef, content: threadContentRef, spacer: threadSpacerRef,
    anchor: parkElRef, anchorId: parkId, active: full, topInset: chromeH + 12,
    viewportHeight: fullInputTop - 12 - dockH,
    contentVersion: `${turns.length}:${thinking}`,
  });
  useLayoutEffect(() => {
    if (full) frameRef.current?.style.setProperty("--re1-chat-blur", Math.min(1, (threadRef.current?.scrollTop ?? 0) / 48).toFixed(3));
  }, [full]);
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
  const restFade = draft ? 0 : 1 - f;
  const inputFade = draft ? 1 : f;
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
  // Detail pages used to be one level deep (back always went home). The v2
  // cashflow drill-down needs a stack, so back pops one page and only leaves
  // for home once the stack is empty.
  const [detailStack, setDetailStack] = useState<DetailKind[]>([]);
  // The drill-down's shared context: which month the strip rests on, which
  // category was opened, and which transaction. Lifted so back/forward keeps them.
  const [cfMonth, setCfMonth] = useState(DASH2_CF_LIVE);
  const [cfCat, setCfCat] = useState<{ id: string; name: string }>({ id: "food", name: "Food & drinks" });
  const [cfTxn, setCfTxn] = useState({ name: "Swiggy", note: "4 Oct '26 · UPI", amount: 1400, tint: "#FC8019", category: "Food & drinks" });
  // ...and which ledger the outflow level is showing. It used to live inside
  // Dash2FlowRows, which unmounts on the drill into a transaction, so back
  // always landed on Categories however you had left it (user report).
  const [cfTab, setCfTab] = useState<"cats" | "top">("cats");
  // ...which accounts the filter is narrowed to, and which transactions have
  // been left out of the budget. Same reason: the sheet and the transaction
  // page are both torn down behind you.
  const [bankFilter, setBankFilter] = useState<string[]>([]);
  const [cfExcluded, setCfExcluded] = useState<string[]>([]);
  // The bar's level name (R28). Swapping the text on the drill tap read as a
  // glitch mid-transition, so the OLD name fades out, then the new one fades
  // in — on the inflow/outflow levels the new name is empty, which is the
  // point: the bar goes bare and the page head carries the name instead.
  // Every drill level carries its name in the centred head instead (canon
  // 2165:52391), so only home and the Cashflow root title the bar.
  const barTitleTarget = page === "home" ? "Cosimo" : DASH2_BAR_TITLES[detailKind] ?? "";
  const barSubTarget =
    page !== "home" && DASH2_MONTH_SUB.includes(detailKind) ? `${DASH2_MONTH_FULL[cfMonth]} 2026` : "";
  const [barLabel, setBarLabel] = useState({ title: barTitleTarget, sub: barSubTarget, home: page === "home" });
  const [barTitleShown, setBarTitleShown] = useState(true);
  useEffect(() => {
    if (barLabel.title === barTitleTarget) {
      // same level: the month tracks the chart, so it swaps in place — dragging
      // the strip shouldn't blink the whole bar
      if (barLabel.sub !== barSubTarget) setBarLabel({ title: barTitleTarget, sub: barSubTarget, home: page === "home" });
      return;
    }
    setBarTitleShown(false);
    const t = window.setTimeout(() => {
      setBarLabel({ title: barTitleTarget, sub: barSubTarget, home: page === "home" });
      setBarTitleShown(true);
    }, DASH2_BAR_FADE);
    return () => window.clearTimeout(t);
  }, [barTitleTarget, barSubTarget, barLabel, page]);
  // The ledger-row smart-animate handoff (2214:57905 ask): the cashflow page
  // writes where its chart sat, the drill's chart morphs from there. The entry
  // self-expires, so every other route into a drill keeps the slide.
  // The v2 overlay sheet: the app-bar funnel's Filter Bank, or the budget
  // allocation page's How it works.
  const [v2Sheet, setV2Sheet] = useState<null | "filter" | "how" | "bank-info" | "upcoming-info" | "delete-goal" | "family" | "remove-widget">(null);
  // R70: the bank glyph's arrival note (Figma 2933:89257) — once, when home
  // first shows, the 24 glyph shrinks to 12 as it sweeps left to reveal when
  // the accounts last refreshed, or, in red, that some could not. It folds
  // back on its own; the glyph itself stays bare on the bar, as canon draws it.
  // (The "2 failed" red case left the panel on user call.)
  const [bankPeek, setBankPeek] = useState(false);
  const bankPeekedRef = useRef(false);
  useEffect(() => {
    if (!v2 || page !== "home" || full || navMoving || genPhase !== "done" || bankPeekedRef.current) return;
    // Give the loaded home a quiet two seconds before drawing attention to
    // sync status. Leaving home or opening chat cancels the pending arrival.
    let timer: number | undefined;
    const schedulePeek = () => {
      timer = window.setTimeout(() => {
        bankPeekedRef.current = true;
        setBankPeek(true);
      }, 2000);
    };
    if (document.readyState === "complete") schedulePeek();
    else window.addEventListener("load", schedulePeek, { once: true });
    return () => {
      window.removeEventListener("load", schedulePeek);
      window.clearTimeout(timer);
    };
  }, [v2, page, full, navMoving, genPhase]);
  useEffect(() => {
    if (!bankPeek) return;
    // Allow the shrink/sweep to land, then leave the note readable for ~3s.
    const t = setTimeout(() => setBankPeek(false), 3600);
    return () => clearTimeout(t);
  }, [bankPeek]);
  // which allocation the budget's category level is showing
  const [budgetCat, setBudgetCat] = useState("food");
  // what the family has put in (null once removed), and the sheet's draft of it
  const [familyAmt, setFamilyAmt] = useState<number | null>(FAMILY_AMOUNT);
  const [familyDraft, setFamilyDraft] = useState("");
  const familyDraftAmt = Number(familyDraft.replace(/\D/g, "")) || null;
  /** One choreography for EVERY level change off a scrolled page (user calls,
      R28): glide the viewport home FIRST — no fades, the content stays visible
      — because the shared chart must be ON SCREEN at its resting spot when the
      level converts, or the FLIP plays where nobody sees it. The change commits
      on the glide's soft tail (~96% home), so the chart/head/body motion blends
      into the same gesture instead of queueing behind a finished scroll. An
      unscrolled page commits with no ceremony. */
  const glideOutThen = useCallback((commit: () => void) => {
    const el = scrollerRefs.current[pageRef.current];
    if (!el || el.scrollTop < 8) { commit(); return; }
    const from = el.scrollTop;
    const t0 = performance.now();
    const dur = Math.min(360, Math.max(200, from * 0.45));
    let raf = 0;
    let committed = false;
    let done = false;
    const land = () => {
      if (committed) return;
      committed = true;
      commit();
    };
    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      el.scrollTop = 0;
      land();
    };
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      el.scrollTop = from * Math.pow(1 - t, 3);
      // cubic tail: at 65% time only ~4% of the distance remains — start the
      // conversion here so it overlaps the settle
      if (t >= 0.65) land();
      if (t < 1) raf = requestAnimationFrame(tick);
      else finish();
    };
    raf = requestAnimationFrame(tick);
    // throttled panes starve rAF, so the change can never be left hanging
    window.setTimeout(finish, dur + 80);
  }, []);
  const detailMoveRef = useRef(false);
  const detailMoveCleanup = useRef<(() => void) | null>(null);
  const detailScrollStack = useRef<number[]>([]);
  const [detailMoving, setDetailMoving] = useState(false);
  useEffect(() => () => detailMoveCleanup.current?.(), []);
  const slideDetail = useCallback((direction: "push" | "pop", commit: () => void, scrollTop: number) => {
    if (detailMoveRef.current) return;
    const el = scrollerRefs.current.trip;
    const host = frameRef.current;
    const land = () => {
      // One commit: the incoming header and body must never show different levels.
      flushSync(commit);
      if (el) {
        el.scrollTop = scrollTop;
        scrollYRef.current.trip = el.scrollTop;
        writeScrollVar((el.scrollTop - 8) / 88, el);
        // the chrome blur belongs to the level that is arriving, from its first
        // frame (user pin): it used to hold the outgoing level's value for the
        // whole 420ms ride and snap at onFinish — a scrolled level came back
        // bare-topped, and an unscrolled one arrived under a blur
        landAmbientBlur(clamp01(el.scrollTop / 48).toFixed(3), direction === "push");
      }
    };
    if (!el || !host || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { land(); return; }
    detailMoveRef.current = true;
    setDetailMoving(true);
    detailMoveCleanup.current = animatePageSwap({
      page: el, chrome: detailChromeRef.current, host, direction, commit: land,
      onFinish: () => {
        detailMoveRef.current = false;
        detailMoveCleanup.current = null;
        host.style.setProperty("--re1-ambient-blur", Math.min(1, Math.max(0, el.scrollTop / 48)).toFixed(3));
        setDetailMoving(false);
      },
    });
  }, [writeScrollVar, landAmbientBlur]);
  const pushNow = useCallback((kind: DetailKind) => {
    const inPage = pageRef.current === "trip";
    if (inPage) detailScrollStack.current.push(scrollerRefs.current.trip?.scrollTop ?? 0);
    else detailScrollStack.current = [];
    setDetailStack((prev) => (inPage ? [...prev, detailKindRef.current] : []));
    setDetailKind(kind);
    goToPage("trip");
  }, [goToPage]);
  /** Drill one level deeper. A push off a scrolled level (a category tapped
      deep in the outflow list) glides up + fades exactly like back does, so
      both directions read as the same move. Pushes from home keep their page
      slide. */
  const pushDetail = useCallback((kind: DetailKind) => {
    if (detailMoveRef.current) return;
    if (pageRef.current !== "trip") { pushNow(kind); return; }
    // The glide home exists so the SHARED chart is on screen when it converts
    // (R28), so it belongs to the cashflow levels and nothing else: a push
    // that LEAVES that structure — a transaction, a budget category, the bank
    // list — just slides in, and the scroller takes its top with no ceremony
    // (user call R66). It used to scroll every level to the top first, which
    // read as a move the new page had no part in.
    if (!DASH2_CF_LEVELS[detailKindRef.current] || !DASH2_CF_LEVELS[kind]) {
      slideDetail("push", () => pushNow(kind), 0);
      return;
    }
    glideOutThen(() => pushNow(kind));
  }, [glideOutThen, pushNow, slideDetail]);
  const detailStackRef = useRef<DetailKind[]>([]);
  useEffect(() => { detailStackRef.current = detailStack; }, [detailStack]);
  const popNow = useCallback(() => {
    detailScrollStack.current.pop();
    const prev = detailStackRef.current;
    if (prev.length === 0) { goToPage("home"); return; }
    setDetailKind(prev[prev.length - 1]);
    const next = prev.slice(0, -1);
    detailStackRef.current = next;
    setDetailStack(next);
  }, [goToPage]);
  /** Back out of the drill-down one level; home when there's nothing beneath.
      In v2 a pop that LEAVES the page rides the slide-out alone (user call
      R34l: no glide-to-top, no extra motion) — the glide survives only for
      in-place level pops deeper in the drill. */
  const popDetail = useCallback(() => {
    if (detailMoveRef.current) return;
    const k = detailKindRef.current;
    const back = popNow;
    if (v2 && detailStackRef.current.length === 0) { back(); return; }
    // cf-level → cf-level keeps the GLIDE (R28): those levels share one mounted
    // chart, and the glide exists so it is on screen while it converts. Sliding
    // the content out would carry the chart off with it. Every other pop is an
    // in-page drill and mirrors its push (R68).
    const beneath = detailStackRef.current[detailStackRef.current.length - 1];
    if (v2 && DASH2_CF_LEVELS[k] && DASH2_CF_LEVELS[beneath]) { glideOutThen(back); return; }
    if (v2) { slideDetail("pop", back, detailScrollStack.current.at(-1) ?? 0); return; }
    glideOutThen(back);
  }, [glideOutThen, slideDetail, popNow, v2]);
  const askPhone = useCallback(() => pushDetail("phone"), [pushDetail]);
  /** The user's own collapse. A question left unanswered takes the scan list with
      it: it used to sit in the thread for the rest of the session (user call R67). */
  const collapseFull = useCallback(() => {
    if (setupDock) setSetupDismissed(true);
    closeFull();
  }, [setupDock, closeFull]);
  /** A row or a card option picked: one carrying `reply` answers and holds the
      beat (the branch isn't scripted yet); anything else moves the flow on. */
  const setupPick = useCallback((row: SetupRow, fromSheet = false) => {
    if (row.pick) {
      // you point at the credits or the debits that already happened (user call
      // R43). The list rises OVER the chat and hands back to it (user pin) —
      // it used to close the chat and push a page into the app's own stack,
      // which put its back chevron on top of the L0 one.
      openPicker(row.pick);
      return;
    }
    // a row that hands over to another scripted flow starts it at its first beat
    if (row.goto) {
      scriptRef.current = row.goto;
      setScript(row.goto);
      trackPickRef.current = null;
      setTrackPick(null);
      trackCapRef.current = null;
      enterBeat(0, false, row.label);
      return;
    }
    if (row.track) {
      trackPickRef.current = row.track;
      setTrackPick(row.track);
    }
    if (row.cap !== undefined) trackCapRef.current = row.cap;
    if (row.reply) {
      // the rows are suggested answers: the one picked becomes the user's line
      // and the rest go with it (user call R68)
      if (!fromSheet) setTurns((t) => [...t, { id: ++seqRef.current, role: "user", text: row.label }]);
      // every cosimo line opens on the thinking beat (user call R40) — this one
      // used to appear the instant the row was tapped
      setThinking(true);
      if (replyTimer.current) window.clearTimeout(replyTimer.current);
      replyTimer.current = window.setTimeout(() => {
        setThinking(false);
        setTurns((t) => [...t, { id: ++seqRef.current, role: "cosimo", text: row.reply! }]);
      }, 900);
      return;
    }
    // Scan questions are collected in the sheet, not repeated in the thread.
    // Keeping the scan as the anchor also prevents every answer moving it away.
    enterBeat((setupIdxRef.current ?? 0) + 1, false, fromSheet ? "" : row.label);
  }, [enterBeat, openPicker]);
  /** The rows ticked on the picker: it closes, and they turn up in the card's
      own list. No echo and no "Added X as income" line — during the scan the
      chat says nothing (user call R67), and the checklist's spinner is the only
      "working on it" there is. */
  const setupPicked = useCallback((rows: PickTxn[], flow: "in" | "out") => {
    setPickOpen(false);
    setSetupAdded((prev) => [...prev, ...rows.map((t) => ({ flow, name: t.name, amount: t.amount }))]);
  }, []);

  // Memoized card stacks: stable element identity lets React bail out of the
  // whole card subtree on every spring frame (mobile perf).
  const tripCardEls = useMemo(() => {
    if (v2 && detailKind === "tracking")
      return [<Dash2TrackingPage key={`tracking-${activeTracker ?? "food"}`} tracker={feed.trackers.find((t) => t.id === activeTracker)} onUpdate={() => askCosimo(ASK_UPDATE_TRACKING)} onOpenTxn={(t) => { setCfTxn({ ...t, category: BUDGET_ALLOC[0].name }); pushDetail("cf-txn"); }} />];
    if (v2 && detailKind === "cf-txn")
      return [
        <Dash2TxnPage
          key="cf-txn"
          txn={cfTxn}
          excluded={cfExcluded.includes(dash2TxnKey(cfTxn))}
          onExcluded={(v) => setCfExcluded((prev) => {
            const key = dash2TxnKey(cfTxn);
            return v ? [...prev, key] : prev.filter((k) => k !== key);
          })}
        />,
      ];
    if (v2 && detailKind === "bank") return [<Dash2BankPage key="bank" onInfo={() => setV2Sheet("bank-info")} />];
    if (v2 && detailKind === "budget-history") return [<BudgetHistoryPage key="budget-history" />];
    // R35: the goal drills ARE the Stash L1 (canon 2371:105221, zeroth state)
    // a goal set up in this session: the same Stash page on its own numbers,
    // with the ledger the setup agreed — the one-time sum in atom, the autopay
    if (v2 && detailKind === "goal") {
      const g = feed.goals.find((x) => x.id === activeGoal) ?? feed.goals[feed.goals.length - 1];
      if (!g) return [];
      const pct = Math.round((g.saved / g.target) * 100);
      return [
        <Dash2StashPage
          key={`stash-goal-${g.id}`}
          family={null}
          onReplan={() => askCosimo(ASK_REPLAN_NEW)}
          goal={{ label: g.label, value: inr(g.saved), sub: `saved of ${dash2Lakh(g.target)}`, pct, eta: g.eta }}
          ledger={[
            { header: "Allocation", rows: [{ icon: "atom-avatar", raw: true, name: "atom", sub: `Progress ${pct}%`, value: inr(g.saved), vsub: `of ${inr(g.target)}` }] },
            { header: "Recurring contribution", rows: [{ icon: "gear", name: "autopay", sub: "Starts Oct", value: inr(g.monthly), vsub: `Monthly on ${g.day}th` }] },
          ]}
        />,
      ];
    }
    if (v2 && (detailKind === "trip" || detailKind === "phone")) {
      // the goal's saved figure carries the family contribution, so a replan moves it
      const g = detailKind === "trip"
        ? { label: "Trip to Japan", base: 64500, target: 130000, sub: "saved of 1.3L" }
        : { label: "New phone", base: 23000, target: 80000, sub: "saved of 80K" };
      const saved = g.base + (familyAmt ?? 0);
      return [
        <Dash2StashPage
          key={`stash-${detailKind}`}
          family={familyAmt}
          onReplan={() => askCosimo(ASK_REPLAN)}
          onOpenSheet={(s) => { setFamilyDraft(familyAmt == null ? "" : inr(familyAmt)); setV2Sheet(s); }}
          goal={{ label: g.label, value: inr(saved), sub: g.sub, pct: Math.round((saved / g.target) * 100), eta: "Reaching your goal by 26 Mar ’27" }}
        />,
      ];
    }
    // R28: ONE element, ONE key for every cashflow level — React keeps the
    // chart instance alive across the change, so the picked series converts in
    // place instead of a new chart arriving and imitating the old one's Y.
    if (v2 && DASH2_CF_LEVELS[detailKind])
      return [
        <Dash2CashflowLevel
          key="cf-level"
          level={DASH2_CF_LEVELS[detailKind]!}
          catId={cfCat.id}
          catName={cfCat.name}
          monthIdx={cfMonth}
          tab={cfTab}
          availableHeight={bottomPillTop - chromeH - 28}
          onTab={setCfTab}
          onMonthIdx={setCfMonth}
          onDrill={pushDetail}
          onOpenCategory={(id, name) => { setCfCat({ id, name }); pushDetail("cf-category"); }}
          onOpenTxn={(t, catName) => { setCfTxn({ ...t, category: catName }); pushDetail("cf-txn"); }}
        />,
      ];
    if (v2 && detailKind === "payments") return [<Dash2UpcomingPage key="upcoming" />];
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
    if (v2 && detailKind === "budget-cat") {
      const cat = BUDGET_ALLOC.find((c) => c.id === budgetCat) ?? BUDGET_ALLOC[0];
      const i = BUDGET_ALLOC.indexOf(cat);
      return [<BudgetCategoryPage key={`cat-${cat.id}`} cat={cat} spent={BUDGET_SPENDS[budgetState][i]} onOpenTxn={(t) => { setCfTxn({ ...t, category: cat.name }); pushDetail("cf-txn"); }} />];
    }
    if (detailKind === "budget")
      // R22 (canon 1806:22503): the gauge is the page HEADER (see the hero render)
      // and everything below it — status cards, the Budget/Cashflow switch, the
      // ledger — is one full-bleed block.
      return v2 ? [<BudgetAllocationPageV2 key="budget-alloc" onHow={() => setV2Sheet("how")} onOpenCat={(id) => { setBudgetCat(id); pushDetail("budget-cat"); }} />] : [<BudgetPageBody key="budget-body" />];
    if (v2) return [<GoalPageBodyV2 key="goal-v2" />];
    return [<DailySaverCardV2 key="saver" />, <OtherSourcesCardV2 key="sources" />];
  }, [detailKind, v2, cfMonth, cfCat, cfTxn, cfTab, cfExcluded, pushDetail, familyAmt, bottomPillTop, chromeH, feed, activeGoal, activeTracker]);
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

  // V2 home stack (canon 2057:31944 "layout54"): budget glance, the trip
  // stat + donut, Add Goal, the cashflow glance (the canon's 4th card — its
  // instance is named "Upcoming payments" but renders "Aug Cashflow"), then
  // the Upcoming spends list. Every card routes into the SAME internal pages
  // and chat the v1 home uses; the cashflow glance opens the drill-down.
  // The stack is `feed.order` now (user call): goals set up here slot in above
  // Add Goal, and any card but that button can be held and taken off.
  const v2HomeCardEls = useMemo(() => {
    const byId: Record<string, React.ReactNode> = {
      budget: themed
        ? <Dash2BudgetCubeCard key="budget" onOpen={pushBudget} fill={OCT_MONTH_PROGRESS} tone={artColoured ? "deep" : "light"} state={budgetState} />
        : <Dash2BudgetCard key="budget" onOpen={pushBudget} />,
      trip: themed
        ? <Dash2TripArtCard key="trip-donut" onOpen={pushTrip} ground={artColoured ? "colour" : "white"} />
        : <Dash2GoalRingCard key="trip-donut" onOpen={pushTrip} label="Trip to Japan" value="₹84,500" sub="saved of 1.3L" pct={65} ariaLabel="Trip to Japan details" />,
      // canon 2596:138449 stacks a ring card per goal, so the phone goal joins
      // the canon feed (the art themes keep their single trip objet)
      // the tracker opens its OWN page (canon 2790:53053) — it used to hand you
      // the phone goal, which is a different thing entirely
      tracker: themed ? null : <Dash2PersonCard key="goal-phone" onOpen={() => { setActiveTracker(null); pushDetail("tracking"); }} />,
      "add-goal": <Dash2AddGoal key="add-goal" onClick={startSetup} />,
      cashflow: <Dash2CashflowGlanceCard key="cashflow" onOpen={() => pushDetail("cashflow")} crystal={themed ? (artColoured ? "colour" : "white") : "none"} />,
      upcoming: billsState !== "none" ? <Dash2UpcomingListCard key="upcoming" onOpen={pushPayments} dark={themed && artColoured} /> : null,
    };
    return feed.order.flatMap((id) => {
      const g = id.startsWith("goal:") ? feed.goals.find((x) => `goal:${x.id}` === id) : undefined;
      const tr = id.startsWith("track:") ? feed.trackers.find((x) => `track:${x.id}` === id) : undefined;
      const el = tr
        // a thing you put a cap on this session: the same ring card in its own
        // colour, the tracked thing itself sitting in the ring's hole
        ? <Dash2GoalRingCard
            key={id}
            onOpen={() => { setActiveTracker(tr.id); pushDetail("tracking"); }}
            label={`Oct • ${tr.label} spends`}
            value={inr(tr.spent)}
            sub={tr.cap ? `of ${inr(tr.cap)} capped` : `${tr.count} ${tr.noun}${tr.count > 1 ? "s" : ""} this month`}
            pct={tr.cap ? Math.min(100, Math.round((tr.spent / tr.cap) * 100)) : 100}
            ariaLabel={`${tr.label} spends details`}
            tone={tr.tint}
            introFill={tr.id === freshGoal && !full}
            hole={tr.logo
              ? <span aria-hidden style={{ position: "absolute", left: "50%", top: "50%", margin: "-24px 0 0 -24px", zIndex: 1 }}><BrandMark src={`/return-exp1/merchants/${tr.logo}.png`} size={48} /></span>
              : <PlainRingAvatar icon={`/return-exp1/icons/${tr.icon ?? "shopping"}.svg`} tone={tr.tint} />}
          />
        : g
        // a goal set up in this session: the trip's ring card on its own
        // numbers; the one just set sweeps its ring up as the feed reveals it
        ? <Dash2GoalRingCard key={id} onOpen={() => { setActiveGoal(g.id); pushDetail("goal"); }} label={g.label} value={inr(g.saved)} sub={`saved of ${dash2Lakh(g.target)}`} pct={Math.round((g.saved / g.target) * 100)} ariaLabel={`${g.label} details`} introFill={g.id === freshGoal && !full} />
        : byId[id];
      if (!el) return [];
      // the dashed button is the way IN, not a widget — nothing to hold
      if (id === "add-goal") return [el];
      return [
        <Dash2FeedSlot key={id} leaving={leavingId === id} onHold={() => { setRemoveId(id); setV2Sheet("remove-widget"); }}>
          {el}
        </Dash2FeedSlot>,
      ];
    });
  }, [pushBudget, pushTrip, pushPayments, askPhone, pushDetail, openFull, themed, themeRaw, artColoured, budgetState, billsState, feed, freshGoal, full, leavingId]);

  const popTrip = popDetail;
  // On home the chevron exits the feed when a host wired it (the pitch persona
  // returns to the Valentino Pay screen, R17); standalone it stays inert.
  const onChevron = full ? collapseFull : page === "trip" ? popTrip : onExitHome;


  // Chat is a sibling of the page scrollers: its bounds always belong to the
  // app frame, including in the desktop preview and with a mobile keyboard.
  const renderChat = () => (
    <div
      data-re1-chat
      data-chat-motion={chatMotionMode}
      role="region"
      aria-label="Cosimo chat"
      style={{ position: "absolute", inset: 0, zIndex: 50, pointerEvents: full ? "auto" : "none" }}
    >
      <div
        data-re1-chat-surface
        aria-hidden
        style={chatMotion.surface}
      />
      {/* Suggestions — revealed once the fullscreen surface has whitened */}
      {/* the generic prompts stay away when a detail page is already asking
          something; home's alert lives in the IMPORTANT card, so its chat
          keeps the prompts (R12) */}
      {turns.length === 0 && !(headerAction && page === "trip") && (
        <div
          style={{
            position: "absolute",
            // Chat starts below its own app bar on every source page.
            top: chromeH + 24,
            left: HERO_GUTTER,
            right: HERO_GUTTER,
            zIndex: 9,
          opacity: sugF,
          transform: chatMotion.contentTransform,
            pointerEvents: full && sugF > 0.6 ? "auto" : "none",
          }}
        >
          {page === "home" && resumeEntry ? (
            <ResumeWelcome onPick={resumePick} />
          ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* the suggestions stand on their own — no opener line above them
                (user call R39b; the R18 "Hey! Ask me anything" line is gone) */}
            {/* Goal setup opens from here: the conversation the onboarding pitch
                used to own now starts in the returning user's own chat (R39). */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, transform: `translateY(${(1 - f) * 10}px)` }}>
              <div
                role="button"
                tabIndex={0}
                onClick={startSetup}
                onKeyDown={(e) => e.key === "Enter" && startSetup()}
                style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
              >
                <img src="/return-exp1/orb.png" alt="" width={28} height={28} draggable={false} style={{ flexShrink: 0 }} />
                <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{SETUP_ENTRY}</span>
              </div>
            </div>
            {SUGGESTIONS.map((sg, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 16, transform: `translateY(${(1 - f) * (22 + i * 12)}px)` }}>
                <div aria-hidden style={{ height: 1, marginLeft: 40, background: OUTLINE_SUBTLE }} />
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
          )}
        </div>
      )}

      {/* The thread fills the app frame above the composer. */}
      {(full || f > 0.01) && (
        <div
        ref={threadRef}
        data-re1-chat-thread
        onWheel={stopChatScroll}
        onTouchStart={stopChatScroll}
        onKeyDown={(event) => { if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(event.key)) stopChatScroll(); }}
        onScroll={(event) => frameRef.current?.style.setProperty("--re1-chat-blur", Math.min(1, Math.max(0, event.currentTarget.scrollTop / 48)).toFixed(3))}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            // runs to the very top of the screen and dissolves under the chrome,
            // instead of being cut off below it (R11)
            top: 0,
            height: fullInputTop - 12 - dockH,
            // above the chat surface (z-auto, later in DOM), under the pill (12)
            zIndex: 9,
            overflowY: "auto",
            scrollbarWidth: "none",
            // the chat is its own screen: the page's header doesn't come with it,
            // so the thread simply starts under the chrome (R11)
          padding: `${chromeH + 12}px ${HERO_GUTTER}px 8px`,
          overflowAnchor: "none",
          overscrollBehaviorY: "contain",
            // arrives as the page's copy leaves — a straight crossfade, no travel,
            // since the block it replaces is identical and already in place (R11)
          opacity: chatIn,
          transform: chatMotion.contentTransform,
            // an EMPTY thread must not eat taps — it sits over the suggestion
            // rows (same z, later in DOM), which made them untappable (R13)
            pointerEvents: full && turns.length > 0 ? "auto" : "none",
            display: "flex",
            flexDirection: "column",
          gap: 0,
        }}
      >
        <div ref={threadContentRef} data-re1-chat-content style={{ display: "flex", flexDirection: "column", gap: 14, flexShrink: 0 }}>
          {turns.map((turn, i) =>
            turn.role === "user" ? (
            <div key={turn.id} data-re1-user-message data-re1-chat-anchor={turn.id === parkId || undefined} ref={turn.id === parkId ? parkElRef : undefined} className="re1-chat-user-message" style={{ display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
                <div style={{ background: CHAT_USER_BUBBLE, borderRadius: RADIUS_M, padding: "10px 14px", maxWidth: "82%" }}>
                  <p style={{ ...typography.bodySmall, lineHeight: "22px", color: TEXT_PRIMARY, opacity: 0.9, margin: 0 }}>{turn.text}</p>
                </div>
              </div>
            ) : (
              <div key={turn.id} data-re1-chat-anchor={turn.id === parkId || undefined} ref={turn.id === parkId ? parkElRef : undefined} className="animate-chat-message-in" style={{ flexShrink: 0 }}>
                <CosimoLine
                  text={turn.text}
                  active={i === turns.length - 1 && !doneIds.has(turn.id)}
                  onDone={() => setDoneIds((d) => new Set(d).add(turn.id))}
                />
                {turn.setupAt != null && doneIds.has(turn.id) && (() => {
                  const b = beatsFor(turn.setupScript ?? "goal")[turn.setupAt];
                  const live = turn.setupAt === setupIdx && (turn.setupScript ?? "goal") === script;
                  if (!b) return null;
                  return (
                    <>
                      {/* the scan SCROLLS WITH THE CHAT, right under the
                          line that announces it (user call R43) — pinned at
                          the top it read as chrome laid over the thread */}
                      {b.checklist && !setupDismissed && <SetupChecklist done={setupBeat?.check ?? b.check ?? 0} />}
                      {/* the rows go with the answer (user call R40) — the
                          beat they belong to is no longer the live one */}
                      {b.stat && <SetupStat stat={b.stat} />}
                      {b.rows && live && i === turns.length - 1 && <SetupRows rows={b.rows} onPick={setupPick} live={live} />}
                      {b.contribution && (
                        <SetupContribution
                          {...b.contribution}
                          live={live}
                          onPress={() => enterBeat((setupIdxRef.current ?? 0) + 1, true)}
                        />
                      )}
                    </>
                  );
                })()}
                {turn.feedCard && doneIds.has(turn.id) && <FeedHandoffCard onOpen={closeFull} />}
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
        <div ref={threadSpacerRef} data-re1-chat-spacer aria-hidden style={{ height: 0, flexShrink: 0 }} />
        </div>
      )}

      {/* thread fades out under the input instead of clipping sharply */}
      {turns.length > 0 && (
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
  );

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
    // v2 cashflow renders NO in-page hero (its title rides the app bar), so it takes
    // home's own silhouette (chrome + 4) instead of the trip hero reserve — the month
    // strip was resting on ~180px of dead air below the chrome (R25).
    // Every v2 cashflow level renders NO hero (their name + total live in the
    // page head), so none of them reserve the trip-hero height either — the
    // drill heads were resting on ~180px of dead air below the chrome.
    const cfLevel = detailKind === "cashflow" || detailKind.startsWith("cf-");
    // the stash drills are bare-bar pages too (R35) — no in-page hero reserve
    const bareL1 = cfLevel || detailKind === "trip" || detailKind === "phone" || detailKind === "bank"
      || detailKind === "tracking" || detailKind === "goal" || detailKind === "budget-history";
    const heroRest = v2 && bareL1 && pid === "trip" ? chromeH : heroRestFor(pid);
    const heroH = heroRest;
    const tripCards = tripCardEls;
    return (
      <div
        key={pid}
        data-re1-page={pid}
        aria-hidden={!isActivePage || full}
        inert={!isActivePage || full || navMoving || detailMoving}
        ref={(el) => { scrollerRefs.current[pid] = el; }}
        onScroll={makeScrollHandler(pid)}
        style={{
          position: "absolute",
          inset: 0,
          // Frozen while a page move is in flight: a live scroller during the
          // slide is exactly what made the old transition fight itself.
          overflowY: full || navMoving || detailMoving || (v2 && pid === "trip" && detailKind === "cashflow") ? "hidden" : "auto",
          // The in-page drill parks its content a full width off to the right
          // (R68); without this the scroller offers that as sideways scroll.
          // A declared overflow-x is also what stops the browser computing it
          // back to auto from the overflow-y beside it.
          overflowX: "hidden",
          // No rubber-band at the top of the feed (R19) — the page starts firm.
          overscrollBehaviorY: "none",
          scrollbarWidth: "none",
          overflowAnchor: "none",
          // The 1738 feed grounds HOME on a soft grey so the white cards read as
          // cards (R15); internal pages stay white. v2 L1s are OPAQUE SHEETS
          // (R36): home turns back on the moment back is tapped, so a
          // see-through L1 mixed both pages for the whole 420ms ride — the
          // sheet's own ground covers home while it slides.
          background: v2 && pid === "trip" ? BG_PRIMARY : pid === "home" ? (v2 ? "transparent" : "#F3F5F6") : undefined,
          // The incoming page's SURFACE lands opaque at once and its children
          // orchestrate on top of it; only the outgoing page fades. Cross-fading both
          // left a window where each was semi-transparent and the grey page colour
          // showed through the white hero — the background flicker on page load (R11).
          // v2 never fades home under a push (R39a): the sheet is opaque and takes
          // 420ms to cover it, while home used to vanish in 200ms — so the still
          // uncovered top of home flashed from the scene to bare white, with its
          // chrome sitting solid on a page that was dissolving beneath it. Held
          // home also means back reveals a page that is already there.
          opacity: v2 ? 1 : active,
          // v2 details PUSH in from the right over the held home (user call
          // R34k) — only the chat keeps its dissolve; v1 keeps the crossfade
          transform: v2 && pid === "trip"
            ? (active && sheetIn && !navMoving ? undefined : `translateX(${active && sheetIn ? 0 : 100}%)`)
            : undefined,
          transition: v2 && pid === "trip"
            ? `transform ${NAV_RIDE_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`
            : isActivePage ? "none" : `opacity 200ms ${GENTLE}`,
          // The active destination sheet owns its whole chrome, including the
          // app bar, so it must stack above the home chrome while it arrives —
          // and it HOLDS that height for the whole ride out. It used to drop to
          // 6 the frame back was tapped, which put the leaving body under home's
          // bar (z31) while its own bar stayed at 60 above it: the two halves of
          // one sheet split across home's chrome, so the L1 bar read as gliding
          // over the page it was leaving (user report).
          // Keep the inactive trip page low so it cannot cover Home at rest.
          zIndex: pid === "trip" ? (isActivePage || navMoving ? 40 : 6) : 4,
          pointerEvents: active > 0.5 && !navMoving && !detailMoving ? "auto" : "none",
        }}
      >
        {/* Ambient scene — INSIDE the scroller so it rides away with the page
            (user call R33m, reversing the R33c pin); the flat ground stays on
            the page-fixed wash behind. Absolute children scroll with a scrolling
            containing block, so top:0 here is the content's top. */}
        {ambient && pid === "home" && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 0,
              // R36: mode-split geometry — light is the teal luminosity render
              // (2726:8186) plus its #ABFFF8→white fade strip; dark the
              // blend-flattened 360×216 export (2726:8201). No CSS tint left.
              aspectRatio: isMobile ? undefined : "var(--re1-amb-scene-ar, 360 / 295.78)",
              // Outpainted mobile artwork reserves extra sky above the scene;
              // the safe area adds height instead of eating the composition.
              height: isMobile ? frame.w * 1.5 + safeTop : undefined,
              // the scene CLEARS OUT for the chat (user call R36f): it lifts as
              // it goes, so the page reads as making way rather than the chat
              // simply landing on top of it
              opacity: 1 - f,
              transform: `translateY(${-f * 24}px)`,
              pointerEvents: "none",
            }}
          >
            <div data-ambient-art style={{ position: "absolute", left: 0, right: 0, top: 0, height: isMobile ? "100%" : "var(--re1-amb-scene-img-h, 100%)", backgroundImage: `${isMobile ? "var(--re1-amb-scene-scrim-mobile, linear-gradient(transparent, transparent))" : "var(--re1-amb-scene-scrim, linear-gradient(transparent, transparent))"}, var(--re1-amb-scene)`, backgroundSize: isMobile ? "cover" : "var(--re1-amb-scene-size, cover)", backgroundPosition: isMobile ? "top center" : "var(--re1-amb-scene-pos, bottom center)", backgroundRepeat: "no-repeat", WebkitMaskImage: isMobile ? "var(--re1-amb-scene-mask-mobile, none)" : "var(--re1-amb-scene-mask, none)", maskImage: isMobile ? "var(--re1-amb-scene-mask-mobile, none)" : "var(--re1-amb-scene-mask, none)" }} />
            {/* "Live grain" is the one scene that is drawn rather than loaded.
                It covers the same box as the image layer and takes the same
                mask the other scenes get from globals.css, so its bottom edge
                dissolves into the page instead of ending on a line. The
                container's own bg is nulled — the canvas is the whole picture. */}
            {!isMobile && <div style={{ position: "absolute", left: 0, right: 0, top: "var(--re1-amb-strip-top, 100%)", bottom: 0, background: "var(--re1-amb-strip, none)" }} />}
          </div>
        )}
        {/* v2 detail pages carry their OWN back chevron (user call R35b): it
            slides in and out WITH the page, pinned under the safe area */}
        {v2 && pid === "trip" && (
          // The L1's app bar clears for the chat EXCEPT its chevron, which is
          // the one glyph that carries through and rotates into the collapse
          // affordance (R38) — the rest of the bar fades around it.
          <div style={{ display: "none", position: "sticky", top: statusH + 8, zIndex: 40, height: 0, pointerEvents: "none" }}>
            <div style={{ position: "absolute", left: 12, top: 0, zIndex: 1, pointerEvents: "auto" }}>
              <ChromeChip flip={textFlip} ghost={f} bare ariaLabel={full ? "Collapse" : "Back"} onClick={full ? collapseFull : popDetail}>
                {(color) => <ChevronIcon color={color} rotate={f * -90} />}
              </ChromeChip>
            </div>
            {/* the level's name rides the page too (user call R35c) — it slides
                away WITH the L1 instead of fading late over Cosimo's seat */}
            <span style={{ position: "absolute", left: 60, top: 24, transform: "translateY(-50%)", ...typography.headerH3, color: TEXT_PRIMARY, whiteSpace: "nowrap", opacity: 1 - f }}>
              {DASH2_BAR_TITLES[detailKind] ?? ""}
            </span>
            {/* the trailing chip belongs to THIS page's app bar (user call R37):
                on the fixed layer it was already sitting at the top-right before
                the page had finished sliding under it */}
            <div style={{ position: "absolute", right: 12, top: 0, opacity: 1 - f, pointerEvents: full ? "none" : "auto" }}>
              {/* the tracker wears the same trash as a goal (canon 2790:53053,
                  user call R65) — it is a thing you set up, so it is a thing
                  you can take down */}
              {(detailKind === "trip" || detailKind === "phone" || detailKind === "goal" || detailKind === "tracking") && (
                <ChromeChip flip={textFlip} ghost={f} bare ariaLabel={detailKind === "tracking" ? "Stop tracking" : "Delete goal"} onClick={() => setV2Sheet("delete-goal")}>
                  {(color) => <div aria-hidden style={tintedGlyph("/return-exp1/stash/trash.svg", color, 24)} />}
                </ChromeChip>
              )}
              {/* the bank page's bar adds an account (canon 2943:89776: "should
                  trigger bank add flow"); its sync explainer moved down to the
                  refresh line under the total */}
              {detailKind === "bank" && (
                <ChromeChip flip={textFlip} ghost={f} bare ariaLabel="Add bank account" onClick={() => askCosimo(ASK_ADD_BANK)}>
                  {(color) => <div aria-hidden style={tintedGlyph("/return-exp1/home54/add.svg", color, 24)} />}
                </ChromeChip>
              )}
              {/* the upcoming list wears an info chip like the bank list does
                  (canon 2886:87053) — what these rows are and where they sit */}
              {v2 && detailKind === "payments" && (
                <ChromeChip flip={textFlip} ghost={f} bare ariaLabel="About upcoming spends" onClick={() => setV2Sheet("upcoming-info")}>
                  {(color) => <div aria-hidden style={tintedGlyph("/return-exp1/bank/info.svg", color, 24)} />}
                </ChromeChip>
              )}
              {DASH2_FILTER_KINDS.includes(detailKind) && (
                <ChromeChip flip={textFlip} ghost={f} bare ariaLabel="Filter" onClick={() => setV2Sheet("filter")}>
                  {(color) => <FilterGlyph color={color} />}
                </ChromeChip>
              )}
            </div>
          </div>
        )}
        {/* Sticky chrome wash — whitens with the scroll var; sticky so the pill
            (also sticky, higher z) pins ABOVE it inside one stacking context.
            The ambient route has no wash here: its top band is the fixed
            data-re1-top-blur element further down. A progressive-gaussian stack
            used to sit in this slot for ambient, rendering display:none on every
            ambient page — deleted 2026-09-22 (user call: "if it is not visible,
            delete it"). It is in git history if the graduated blur is rebuilt. */}
        {!ambient && (
          <div
            aria-hidden
            style={{
              position: "sticky",
              top: 0,
              height: chromeH + 12,
              marginBottom: -(chromeH + 12),
              zIndex: 10,
              background: BG_PRIMARY,
              opacity: "calc(var(--re1-pt, 0) * 0.92)",
              backdropFilter: `blur(calc(var(--re1-pt, 0) * 16px))`,
              WebkitBackdropFilter: `blur(calc(var(--re1-pt, 0) * 16px))`,
              WebkitMaskImage: "linear-gradient(to bottom, black calc(100% - 20px), transparent)",
              maskImage: "linear-gradient(to bottom, black calc(100% - 20px), transparent)",
              pointerEvents: "none",
            }}
          />
        )}

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
          {paper && !barInsight && (
            <div
              aria-hidden
              // The hero's surface keeps ALL of it — heading, insight and pill — on
              // the PAGE ground (bg-primary: white by day, slice black after dark —
              // the old bg-card read as a lighter slab atop the dark cashflow, R33b),
              // and hangs its softening into the grey 72px BELOW the hero edge, over
              // the top of the cards (R11). Closes up in chat. On the ambient HOME
              // it stays transparent at rest so the scene runs to the top edge, and
              // solidifies with the chat morph.
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: -(1 - f) * 72,
                // At rest the ambient veil is the literal keyword, not a 0% color-mix:
                // older iOS WebKit resolved color-mix-with-transparent to the opaque
                // page colour, painting a white block over the scene (R33o).
                // ambient home keeps the veil transparent at ALL f — the chat
                // ground is ONE opaque surface now (R36), not this mix
                background: `linear-gradient(to bottom, ${ambient && pid === "home" ? "transparent" : BG_PRIMARY} calc(100% - ${(1 - f) * 72}px), transparent)`,
              }}
            />
          )}
          {/* Hero copy — detail pages only: home is the dashboard, its identity
              lives in the app bar (R12, Figma 1680:67178) */}
          {/* bare-bar L1s carry their own head inside the page, so the in-flow
              hero copy stays away — one list (bareL1) now decides that AND the
              hero reserve, which had drifted apart and leaked the cashflow
              hero onto the bank page (R36d) */}
          {pid === "trip" && !(v2 && bareL1) && (
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
          <Stagger index={0} active={isActivePage} instant={v2}>
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
              // Every v2 cashflow level carries its own page head — the hero
              // region renders NOTHING for them (a bad merge once returned the
              // full drill page here too, doubling it on screen).
              if (v2 && (detailKind === "cashflow" || detailKind.startsWith("cf-"))) return null;
              // the tracker's ring IS its head (canon 2790:53053), same as the
              // picker's list is its own — neither reserves a hero
              if (v2 && detailKind === "tracking") return null;
              // R26: v2's budget and goal heroes follow 1905:19456 / 2198:56777
              if (v2 && detailKind === "budget-cat") {
                const cat = BUDGET_ALLOC.find((c) => c.id === budgetCat) ?? BUDGET_ALLOC[0];
                return <BudgetHeroV2 cat={cat} catSpent={BUDGET_SPENDS[budgetState][BUDGET_ALLOC.indexOf(cat)]} />;
              }
              if (v2 && detailKind === "budget" && !(alertOn && headerAction)) return <BudgetHeroV2 onReplan={() => askCosimo(ASK_REPLAN_BUDGET)} />;
              // canon 2886:87053: the COUNT is the label and the total the figure,
              // no pace line. Page head rhythm (user call): DASH2_HEAD_TOP under
              // the app bar, 32 to the cards — the shell's heroPb spacer gives 24
              // of the 32.
              if (v2 && detailKind === "payments" && !(alertOn && headerAction)) {
                return (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: 12, padding: `${DASH2_HEAD_TOP}px 0 8px` }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 14, lineHeight: "20px", letterSpacing: 0.28, color: TEXT_TERTIARY }}>{DASH2_UPCOMING_PAYMENTS.length} recurring payments</span>
                      {/* all paid, the figure itself says so, in positive green (user call) */}
                      <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 48, lineHeight: "56px", letterSpacing: -0.48, color: billsState === "paid" ? EXT_TEXT_POSITIVE : TEXT_PRIMARY }}>{billsState === "paid" ? "All paid" : inr(DASH2_UPCOMING_PAYMENTS.reduce((sum, pmt) => sum + pmt.amount, 0))}</span>
                    </div>
                    {/* the budget head's third line (user call): 12 under the
                        figure, 24 tall — how many are paid, how many are left;
                        all paid, how many went out this month (user call) */}
                    <div style={{ minHeight: 24, display: "flex", alignItems: "center" }}>
                      <span style={{ ...typography.bodySmall, color: TEXT_SECONDARY, whiteSpace: "nowrap" }}>
                        {billsState === "paid"
                          ? `${DASH2_UPCOMING_PAYMENTS.length} paid this month`
                          : `${dash2PaidCount(false)} paid • ${DASH2_UPCOMING_PAYMENTS.length - dash2PaidCount(false)} left`}
                      </span>
                    </div>
                  </div>
                );
              }
              if (v2 && detailKind === "trip" && !(alertOn && headerAction)) return <GoalHeroV2 onReplan={openFullFromGesture} />;
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
                    <div style={{ position: "relative", height: 6, borderRadius: 12, background: "var(--dls-bg-disabled)", width: "calc(100% - 16px)", margin: "24px 8px 0" }}>
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
                onClick={openFullFromGesture}
                onKeyDown={(e) => e.key === "Enter" && openFullFromGesture()}
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
        {/* the bank page starts flush under the bar (user call): canon 2943:89776
            puts its head at y=0 of the content frame, so no hero spacer there.
            Budget history's list meets the bar the same way (user call). */}
        <div aria-hidden style={{ height: v2 && pid === "trip" && (detailKind === "bank" || detailKind === "budget-history") ? 0 : heroPb }} />

        {/* Cards — settle back / stagger in on the fluid page switch */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            // layout54 spaces the home cards at 20; internal pages keep 16
            gap: v2 && pid === "home" ? 20 : 16,
            // bottom-bar mode: just enough tail for the last card to clear the
            // floating bar with a gap — the hero-mode air read as dead space (R11)
            // bottom placement has no pill between the copy and the cards, so the
            // header sits closer to them (R11); home's first card sits 12 under the
            // app bar — 4 (hero box) + 8 (spacer) + 0 here (R13)
            // v2 home's first card sits 16 under the bar, not 12 (2057:31944).
            // The cashflow ROOT is a fixed, self-contained screen — chart plus
            // three flow rows — so it takes only the pill's clearance and never
            // scrolls; every browsing page keeps the longer tail.
            padding: `${pid === "home" ? (v2 ? 4 : 0) : v2 && (detailKind === "bank" || detailKind === "budget-history") ? 0 : 8}px ${PAGE_GUTTER}px ${pillH + (v2 && pid === "trip" && detailKind === "cashflow" ? 12 : 64)}px`,
            // guarantees the dock detent is reachable INCLUDING this container's own
            // top padding — it was short by exactly that, so short pages rested
            // lower than home and the pill→cards gap differed per page (R8).
            // Bottom-bar mode has no dock, so no filler: short pages (trip) end
            // right under their last card, same as home (R11).
            minHeight: bottomAsk ? 0 : frame.h - (statusH + APP_BAR_HEIGHT) - (paper ? 24 : 8) + (paper ? 16 : 24),
            // cards clear out early so the thread lands on an empty page
            opacity: 1 - clamp01(f / 0.72),
            transform: `translateY(${-f * 12}px) scale(${chatMotionMode === "focus" ? 1 - f * 0.025 : 1})`,
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
          {(pid === "home" ? (v2 ? v2HomeCardEls : homeCardEls) : tripCards).map((card, i) => (
            // Detail pages are keyed by kind, so each one MOVES IN rather than
            // swapping in place. The cashflow LEVELS are the exception (R28):
            // they share one key, and therefore one mounted subtree, so the
            // month chart inside survives the level change and converts instead
            // of being rebuilt. That component owns its own per-level motion.
            <Stagger
              // v2 home cards are keyed by widget, not seat: a card taken off
              // the feed must not hand its mount state to the one below it
              key={pid === "home" ? (v2 ? String((card as React.ReactElement).key ?? i) : i) : `${DASH2_CF_LEVELS[detailKind] ? "cf-level" : detailKind}-${i}`}
              index={i + rowsBelow}
              // v2 L1 pages land WHOLE (user call R34k): the slide is the
              // transition, so nothing inside waits on the generate beat. And
              // once home has shown it never un-shows (R34o) — the L1 covers
              // it, the return reveals it, state intact.
              // v2 L1 content stays SHOWN through the slide-out too — gating on
              // isActivePage snapped the body away the moment back was tapped,
              // leaving only the sticky bar to ride the slide (user call R36)
              active={v2 && pid === "home" ? homeEverShown || (isActivePage && genPhase === "done") : v2 && pid === "trip" ? true : isActivePage && genPhase === "done"}
              instant={v2 && (pid === "trip" || introFill)}
            >
              {card}
            </Stagger>
          ))}
        </div>

      </div>
    );
  };



  return (
    <Dash2ThemeCtx.Provider value={homeTheme}>
    <PaperCtx.Provider value={paper}>
    <V2SkinCtx.Provider value={skinKit}>
    <V2ChartCtx.Provider value={V2_CHARTS.canon}>
    <div
      ref={frameRef}
      className={ambient ? "re1-ambient" : undefined}
      data-re1-scene={sceneVariant}
      /* The top wash stays off (user call: the "Top gradient" switch is gone) —
         nulling the scene vars here reaches every layer that reads them at once;
         a "Top background" scene still paints over it. */
      data-re1-top-wash="off"
        style={{
          position: "relative",
          height: "100%",
          width: "100%",
          overflow: "hidden",
          background: ambient ? "var(--re1-amb-wash)" : BG_PRIMARY,
          // Keep the ambient artwork behind the iOS safe-area/status strip as
          // well as inside the scrolling page. Without this pinned copy, the
          // top inset falls back to a white/black solid band on mobile.
          backgroundImage: ambient ? "var(--re1-amb-scene)" : undefined,
          backgroundPosition: ambient ? "top center" : undefined,
          backgroundSize: ambient ? "100% auto" : undefined,
          backgroundRepeat: ambient ? "no-repeat" : undefined,
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
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "var(--dls-bg-primary)", opacity: "var(--re1-t, 0)", zIndex: 2, pointerEvents: "none" }} />
      )}

      {/* V2 ground (1837:28497-99): white with a magenta-violet crown and two
          lavender pools — home only; internal pages ride it out with the fade. */}
      {v2 && (
        <div
          key={`wash-${washPulse}`}
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            // the chat is a plain surface — the scene dissolves with the morph
            // (it was bleeding through the dark chat, user report R35d). It no
            // longer fades for an L1 (R39a): the sheets are opaque, and the fade
            // ran out from under the sliding sheet as a flash at the top.
            opacity: 1 - f,
            transformOrigin: "50% 0%",
            animation: washPulse > 0 ? "re1v2WashBloom 900ms ease" : undefined,
            background: ambient ? "var(--re1-amb-wash)" : "var(--re1-v2-wash)",
            filter: ambient ? "var(--re1-amb-filter, none)" : undefined,
            // ambient: the scene stays PINNED through the scroll (user call) —
            // above the whitening veil (z2), still under every page (z4+)
            zIndex: ambient ? 0 : undefined,
          }}
        />
      )}

      {/* ── Pages (fluid crossfade switch — no slide) ── */}
      {renderPage("home")}
      {renderPage("trip")}
      {morphActive && renderChat()}

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
        if (v2) {
          // Canon 1837:29270: the bar's wrapper IS a white rise — solid beneath the
          // bar, clear ~28px above it — so scrolling cards dissolve, never cut.
          // Ambient wears the SAME plateau-free gradient as the top band,
          // upside down (R34f): maximal at the very bottom edge, decaying
          // continuously to nothing by the zone's top. No fill, no edge;
          // everything else keeps the plain white rise.
          if (ambient) {
            return (
              <div
                aria-hidden
                // The fade belongs to the message box, not to the feed: it stays put
                // through the morph so the chat keeps the same bottom fade L0 has
                // (user call). Holding it also means the compositor never re-groups
                // nine backdrop-filters at a moving opacity — it just sits there.
                style={{ position: "absolute", left: 0, right: 0, top: bottomPillTop - 12, bottom: 0, zIndex: 50, pointerEvents: "none", transform: "translateZ(0)" }}
              >
                {/* 2886:86538 (R74): the frame's own rise under the bar — the page
                    colour at the foot, clear by 55.65% of the zone, on top of
                    the R34f progressive blur */}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, var(--re1-amb-floor) 0%, transparent 55.65%)" }} />
                {([[28, 0, 22], [20, 10, 32], [14, 20, 42], [10, 30, 52], [7, 40, 62], [5, 50, 72], [3, 60, 82], [2, 70, 92], [1, 80, 100]] as const).map(([r, hold, fade]) => (
                  <div
                    key={r}
                    style={{
                      position: "absolute",
                      inset: 0,
                      backdropFilter: `blur(${r}px)`,
                      WebkitBackdropFilter: `blur(${r}px)`,
                      WebkitMaskImage: `linear-gradient(to top, #000 ${hold}%, transparent ${fade}%)`,
                      maskImage: `linear-gradient(to top, #000 ${hold}%, transparent ${fade}%)`,
                    }}
                  />
                ))}
              </div>
            );
          }
          return (
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: bottomPillTop - 28,
                bottom: 0,
                zIndex: 50,
                opacity: 1 - f,
                pointerEvents: "none",
                background: "linear-gradient(to bottom, transparent 0px, var(--dls-bg-primary) 44px)",
              }}
            />
          );
        }
        return (
          <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 50, opacity: 1 - f, pointerEvents: "none" }}>
            {layer("transparent", "var(--dls-bg-primary)")}
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
          data-proto-focus-target="return-exp1-chat"
          className="re1-glass"
          onClick={openFullFromGesture}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openFullFromGesture(); } }}
          style={{
            position: "absolute",
            left: BAR_MARGIN,
            right: BAR_MARGIN,
            bottom: isMobile ? (frame.kb ? 16 : safeBottom) : 24,
            height: pillH,
            borderRadius: 100,
            // v2 (R35e, user call: glass vibes): a true frosted pill — the canon's
            // 60% fill over a 24px gaussian, in BOTH lives (home bar and chat
            // input), so the morph handoff never flashes a surface change; the
            // rim is the frame's 1px Outline Subtle hairline (2886:86539, R74);
            // v1 (1738:13319): a true glass bar (white a20 over the blur)
            border: v2 ? `1px solid ${OUTLINE_SUBTLE}` : `1px solid ${OUTLINE_BOLD}`,
            background: v2 ? "var(--re1-ask-bar-bg, color-mix(in srgb, var(--dls-bg-primary) 60%, transparent))" : "rgba(255,255,255,0.2)",
            backdropFilter: v2 ? "var(--re1-glass-filter, blur(24px))" : "blur(12px)",
            WebkitBackdropFilter: v2 ? "var(--re1-glass-filter, blur(24px))" : "blur(12px)",
            // the specular rim IS the glass — a flat translucent fill reads as a
            // grey slab; the rim plus depth is what makes it a surface (R36e)
            boxShadow: v2 ? "var(--re1-glass-shine), var(--re1-glass-shadow)" : "0px 2px 32px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            cursor: "pointer",
            zIndex: 51,
            opacity: morphActive ? 0 : 1,
            // opacity:0 still costs a full 24px backdrop blur every frame — the
            // overlay's own pill has taken this one's place, so stop painting it.
            visibility: morphActive ? "hidden" : "visible",
            pointerEvents: morphActive ? "none" : "auto",
          }}
        >
          {/* the bar carries its thread, so it says so once one exists (R11) */}
          <span style={{ ...typography.bodySmall, fontSize: isMobile ? 16 : typography.bodySmall.fontSize, lineHeight: "normal", color: TEXT_PRIMARY, whiteSpace: "nowrap" }}>
            {turns.length > 0 ? "Continue your chat" : "Ask cosimo"}
          </span>
        </div>
      )}

      {/* The question RISES from the message bar (user call R42): it belongs to
          the field it answers, not to the thread behind it. The thread reserves
          its height above, so the conversation ends where the question starts. */}
      {full && setupDock && (
        <div
          ref={dockRef}
          data-re1-setup-dock
          style={{ position: "absolute", left: pill.left, width: pill.w, bottom: frame.h - pill.top + 16, zIndex: 52, animation: `re1DockRise 320ms ${GENTLE} both` }}
        >
          <SetupDockCard dock={setupDock} onPick={(row) => setupPick(row, true)} />
        </div>
      )}

      {/* ── The morphing "Ask cosimo" pill (mounted only while morphing) ── */}
      {morphActive && (
      <div
        role={full ? undefined : "button"}
        tabIndex={full ? undefined : 0}
        aria-label="Ask cosimo"
        className="re1-glass"
        // open: the whole pill is the input's hit area — the field is a 17px
        // line inside a 57px pill, and a click on the padding used to focus
        // nothing, so desktop typing went to the body (user call)
        onClick={full ? () => inputRef.current?.focus() : openFullFromGesture}
        onKeyDown={full ? undefined : (e) => e.key === "Enter" && openFullFromGesture()}
        style={{
          position: "absolute",
          left: pill.left,
          top: bottomAsk ? undefined : pill.top,
          bottom: bottomAsk ? (isMobile ? (frame.kb ? 16 : safeBottom) : 24) : undefined,
          width: pill.w,
          height: pill.h,
          borderRadius: 100,
          border: bottomAsk ? `1px solid ${OUTLINE_SUBTLE}` : `1px solid ${OUTLINE_BOLD}`,
          // In bottom mode it takes over from the frosted bar and KEEPS that
          // glass through the chat (user call R35e) — same fill, same blur,
          // same rim, both ends of the morph, so nothing ever flashes.
          background: bottomAsk
            ? "var(--re1-ask-bar-bg, color-mix(in srgb, var(--dls-bg-primary) 60%, transparent))"
            : paper
              ? BG_CARD
              : `color-mix(in srgb, var(--dls-bg-primary) ${Math.round(lerp(20, 100, textFlip))}%, transparent)`,
          backdropFilter: bottomAsk ? "var(--re1-glass-filter, blur(24px))" : undefined,
          WebkitBackdropFilter: bottomAsk ? "var(--re1-glass-filter, blur(24px))" : undefined,
          boxShadow: bottomAsk ? "var(--re1-glass-shine), var(--re1-glass-shadow)" : ELEVATION_CARD,
          // above the thread and every piece of chrome, so a tap always lands on it
          zIndex: 53,
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
        <span aria-hidden style={{ position: "absolute", left: pillLabelLeft, ...typography.bodySmall, fontSize: isMobile ? 16 : typography.bodySmall.fontSize, lineHeight: "normal", opacity: restFade }}>
          <span style={{ color: TEXT_ON_COLOR_PRIMARY, opacity: whiteTextOp, position: "absolute", inset: 0, whiteSpace: "nowrap" }}>{askLabel}</span>
          <span style={{ color: TEXT_PRIMARY, opacity: 1 - whiteTextOp, whiteSpace: "nowrap" }}>{askLabel}</span>
        </span>
        <div style={{ width: "100%", display: "flex", opacity: inputFade }}>
        <input
          id="return-exp1-chat"
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(draft)}
          placeholder={setupDock?.kind === "ask" ? setupDock.placeholder : "Ask cosimo"}
          aria-label="Message cosimo"
          enterKeyHint="send"
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            ...typography.bodySmall,
            // Safari zooms text fields below 16px when the keyboard opens.
            fontSize: isMobile ? 16 : typography.bodySmall.fontSize,
            lineHeight: "normal",
            color: TEXT_PRIMARY,
            // crossfade, never travel: the rest label and orb fade out where they
            // are, then the input fades in where IT lives — animating this padding
            // slid the placeholder 40px left on every open (R11)
            pointerEvents: full ? "auto" : "none",
            paddingRight: 44,
            paddingLeft: 0,
          }}
        />
        </div>
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
            // no draft, no button (user call): it arrives with the first
            // character rather than sitting there dimmed and unusable
            opacity: f * (draft.trim() ? 1 : 0),
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

      {/* The app bar follows the exact horizontal ride of its L1 sheet. */}
      {v2 && (
        <div
          ref={detailChromeRef}
          data-re1-detail-chrome
          aria-hidden={page !== "trip"}
          inert={page !== "trip" || navMoving || detailMoving}
          style={{
            position: "absolute", top: statusH + 8, left: 0, right: 0, height: 48,
            zIndex: 60, pointerEvents: "none",
            transform: `translateX(${page === "trip" && sheetIn ? 0 : 100}%)`,
            transition: `transform ${NAV_RIDE_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`,
          }}
        >
          {/* the back button belongs to the page it opens (user call
              2026-09-22): it rides in with the bar and lands over the chevron
              of the level it covers, instead of that level's glyph standing
              still while the new page slides under it */}
          {/* The bar hands over on the CHAT'S OWN content ramp, never ahead of
              it (user call): on raw f its title, chip and chevron were already
              done turning into the chat's bar while the chat was still nothing
              but a blur, so the bar read as changing first and the chat as
              arriving after. Held to chatIn, the page's bar stays itself while
              the surface sweeps over it and trades places with the chat's
              content in one beat. */}
          <div style={{ position: "absolute", left: 12, top: 0, pointerEvents: "auto" }}>
            <ChromeChip flip={textFlip} ghost={f} bare ariaLabel={full ? "Collapse" : "Back"} onClick={full ? collapseFull : popDetail}>
              {(color) => <ChevronIcon color={color} rotate={chatIn * -90} />}
            </ChromeChip>
          </div>
          {/* Inside the cashflow family the bar does NOT ride — the levels
              share one mounted page — so a drill swapped the name for an empty
              string in place and it blinked out (user call). It keeps reading
              "Cashflow" all the way down and only turns invisible, which is
              what gives the fade something to fade. On the bar's own 170ms
              GENTLE it still read as a blink, because that curve dumps most of
              the opacity in the first three frames and the level around it now
              takes 300 — so inside the family the title rides the DRILL's
              clock and curve instead, and leaves with the page it belongs to
              (user call). The chat morph drives chatIn per frame, and a
              transition chasing that stalls the title mid-dissolve, so it is
              off for the duration. */}
          <span style={{ position: "absolute", left: 60, top: "50%", transform: "translateY(-50%)", ...typography.headerH3, color: TEXT_PRIMARY, whiteSpace: "nowrap", opacity: (1 - chatIn) * (DASH2_BAR_TITLES[detailKind] ? 1 : 0), transition: chatIn > 0.001 ? "none" : DASH2_CF_LEVELS[detailKind] ? `opacity ${DASH2_MORPH_TIMING}` : `opacity ${DASH2_BAR_TITLES[detailKind] ? 220 : DASH2_BAR_FADE}ms ${GENTLE}` }}>
            {DASH2_BAR_TITLES[detailKind] ?? (DASH2_CF_LEVELS[detailKind] ? DASH2_BAR_TITLES.cashflow : "")}
          </span>
          <div style={{ position: "absolute", right: 12, top: 0, opacity: 1 - chatIn, pointerEvents: full ? "none" : "auto" }}>
            {(detailKind === "trip" || detailKind === "phone" || detailKind === "goal" || detailKind === "tracking") && (
              <ChromeChip flip={textFlip} ghost={f} bare ariaLabel={detailKind === "tracking" ? "Stop tracking" : "Delete goal"} onClick={() => setV2Sheet("delete-goal")}>
                {(color) => <div aria-hidden style={tintedGlyph("/return-exp1/stash/trash.svg", color, 24)} />}
              </ChromeChip>
            )}
            {detailKind === "bank" && (
              <ChromeChip flip={textFlip} ghost={f} bare ariaLabel="Add bank account" onClick={() => askCosimo(ASK_ADD_BANK)}>
                {(color) => <div aria-hidden style={tintedGlyph("/return-exp1/home54/add.svg", color, 24)} />}
              </ChromeChip>
            )}
            {/* the budget's own past: the months before this one, read against
                the same cap (user call) */}
            {detailKind === "budget" && (
              <ChromeChip flip={textFlip} ghost={f} bare tone={TEXT_TERTIARY} ariaLabel="Budget history" onClick={() => pushDetail("budget-history")}>
                {/* DLS Money/Cashback history (3187:96613). The hand-drawn glyph
                    that was here is still HistoryIcon, which the v1 chat bar
                    uses for "Chat history" — a different meaning, so only this
                    call site moves. */}
                {(color) => <div aria-hidden style={tintedGlyph("/return-exp1/home54/cashback-history.svg", color, 24)} />}
              </ChromeChip>
            )}
            {detailKind === "payments" && (
              <ChromeChip flip={textFlip} ghost={f} bare ariaLabel="About upcoming spends" onClick={() => setV2Sheet("upcoming-info")}>
                {(color) => <div aria-hidden style={tintedGlyph("/return-exp1/bank/info.svg", color, 24)} />}
              </ChromeChip>
            )}
            {DASH2_FILTER_KINDS.includes(detailKind) && (
              <ChromeChip flip={textFlip} ghost={f} bare ariaLabel="Filter" onClick={() => setV2Sheet("filter")}>
                {(color) => <FilterGlyph color={color} />}
              </ChromeChip>
            )}
          </div>
        </div>
      )}

      {/* v2's L0 bar pieces — the "Cosimo" title AND the bank pill — are L0
          CHROME (user calls R34n/R34r): they live BETWEEN the pages, above home
          (z4), below a detail (z6), so the L1 slides OVER them and back off
          them while they never move or re-enter. Chat alone fades them. */}
      {v2 && (
        <div style={{ position: "absolute", top: statusH + 8, left: 0, right: 0, height: 48, zIndex: morphActive ? 60 : 31, pointerEvents: "none" }}>
          {/* ONE chevron across the whole transition (user call R38): it used to
              cross-fade with a second, identical chevron on the fixed layer, so
              at the midpoint you saw two glyphs stacked and neither appeared to
              turn. This one stays opaque and rotates into the chat's collapse
              affordance, then back. Its job swaps at the same time. */}
          {/* ...and it hands over on the chat's content ramp, like the detail
              bar above: home's own bar holds while the surface sweeps over it
              instead of emptying ahead of a chat that isn't there yet. */}
          <div style={{ position: "absolute", left: 12, top: 0, pointerEvents: page === "home" ? "auto" : "none", opacity: page === "home" ? 1 : 1 - chatIn }}>
            <ChromeChip flip={textFlip} ghost={f} bare ariaLabel={full ? "Collapse" : "Back"} onClick={full ? collapseFull : onExitHome}>
              {(color) => <ChevronIcon color={color} rotate={chatIn * -90} />}
            </ChromeChip>
          </div>
          <span style={{ position: "absolute", left: 60, top: "50%", transform: "translateY(-50%)", ...typography.headerH3, color: TEXT_PRIMARY, opacity: 1 - chatIn }}>Cosimo</span>
          <div style={{ position: "absolute", right: 12, top: 0, opacity: 1 - chatIn, pointerEvents: page === "home" && !full ? "auto" : "none" }}>
            <ChromeChip flip={textFlip} ghost={f} bare ariaLabel="Bank accounts" onClick={() => pushDetail("bank")}>
              {() => (
                /* canon 2933:89205: the bank glyph is BARE on the bar — no disc,
                   rim or blur (user call R70; the R34o/R64 glass went with it).
                   The row keeps its natural width: the glyph scales down as
                   the row sweeps left and the text slides into view. A failed
                   sync keeps the glyph red after the note has folded. */
                <div className="re1-bank-peek" data-open={bankPeek}>
                  <div className="re1-bank-peek__icon" aria-hidden style={tintedGlyph("/return-exp1/home54/bank.svg", TEXT_SECONDARY, 24)} />
                  <span className="re1-bank-peek__text" style={{ ...typography.caption, fontSize: 10, lineHeight: "12px", letterSpacing: "0.4px", paddingTop: 2, color: TEXT_SECONDARY }}>{`Last refreshed ${DASH2_BANK_ACCOUNTS[0].synced}`}</span>
                </div>
              )}
            </ChromeChip>
          </div>
        </div>
      )}

      {/* ── Fixed chrome: status bar + chips ── */}
      {/* The lift above the L1 sheet waits for the ride to land. Taken at the
          page flip instead, this layer's scroll wash (opaque at any scroll)
          rose over the L0 bar at z31 the instant a card was tapped — so a
          scrolled home lost "Cosimo" and the bank chip for the whole slide,
          with the arriving bar still off-screen right (user report). The
          desktop status bar has its own z60 layer on a detail, so nothing
          else here needs to be over the sheet mid-ride. */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: (page === "trip" && !navMoving) || morphActive ? 50 : 30, pointerEvents: "none" }}>
        <div style={{ position: "relative" }}>
          {ambient && (
            <div
              aria-hidden
              data-re1-top-blur
              style={{
                position: "absolute",
                inset: 0,
                height: statusH + APP_BAR_HEIGHT + 96 - 16 * clamp01(f),
                zIndex: 0,
                pointerEvents: "none",
                // Opacity, mask and filter must share the same element so
                // the filter can sample the page throughout the fade.
                opacity: morphActive
                  ? `calc(var(--re1-ambient-blur, 0) * ${1 - clamp01(f)} + var(--re1-chat-blur, 0) * ${clamp01(f)})`
                  : "var(--re1-ambient-blur, 0)",
                background: "color-mix(in srgb, var(--dls-bg-primary) 58%, transparent)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 46%, transparent 100%)",
                maskImage: "linear-gradient(to bottom, #000 0%, #000 46%, transparent 100%)",
              }}
            />
          )}
          {isMobile || (v2 && page === "trip") ? (
            <div aria-hidden style={{ height: statusH }} />
          ) : (
            <>
              <div style={{ opacity: `calc(${1 - textFlip} * (1 - var(--re1-t, 0)))` }}>
                <StatusBar backgroundColor="transparent" color={TEXT_ON_COLOR_PRIMARY} />
              </div>
              <div style={{ position: "absolute", inset: 0, opacity: `calc(1 - ${1 - textFlip} * (1 - var(--re1-t, 0)))` }}>
                {/* the canon status time is Text Secondary (2886:86544), the v1 bar's primary */}
                <StatusBar backgroundColor="transparent" color={v2 ? TEXT_SECONDARY : TEXT_PRIMARY} />
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
            // v2 rides the DLS L1 bar (1846:30222): px-12, title seated at 60
            padding: v2 ? "0 12px" : "0 16px",
            position: "relative",
            zIndex: 1,
            pointerEvents: "none",
            opacity: chromeIn ? 1 : 0,
            transform: chromeIn ? "translateY(0)" : "translateY(-6px)",
            transition: `opacity 240ms ${GENTLE}, transform 360ms ${GENTLE}`,
          }}>
            {/* the app's identity, centred (1680:67323) — home only: internal pages
                keep a bare bar (R12), and the chat screen carries no header at all,
                so it rides out with the morph (R13) */}
            {v2 ? (
              /* V2 identity (canon L1 bar 2057:31948): the title sits LEFT,
                 seated beside the back chevron — "Cosimo" on home, the level's
                 name on the cashflow details. The inflow/outflow pages carry
                 their name in the page head instead, so their bar stays bare. */
              <div
                style={{
                  position: "absolute",
                  left: 60,
                  top: "50%",
                  transform: "translateY(-50%)",
                  whiteSpace: "nowrap",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  // v2 titles live IN the pages now (Cosimo on the L0 layer,
                  // level names inside each L1's slide, R35c)
                  opacity: (v2 ? 0 : barLabel.title ? 1 : 0) * (1 - f) * (barTitleShown ? 1 : 0),
                  // out faster than in, so the name is gone before the level's
                  // own head slides down over the chart. While the chat MORPH is
                  // driving (f per frame), the transition must be OFF — chasing
                  // per-frame targets is what made the title stall mid-dissolve
                  // on device (user call R34k)
                  transition: f > 0.001 ? "none" : `opacity ${barTitleShown ? 220 : DASH2_BAR_FADE}ms ${GENTLE}`,
                  pointerEvents: page === "home" && !full ? "auto" : "none",
                }}
              >
                {/* hidden delight: the title breathes the ground when tapped */}
                <span
                  style={{
                    // ONE bar title size — the standard bar's H3 (canon
                    // 2683:48571 Title Config, 20/24): home and every level
                    // alike; the old home/H4 split read wrong (user call R33s)
                    ...typography.headerH3,
                    color: TEXT_PRIMARY,
                    cursor: "default",
                    userSelect: "none",
                  }}
                  onClick={() => setWashPulse((n) => n + 1)}
                >
                  {barLabel.title}
                </span>
                {/* the month the level is reading, per canon 2124:44774's
                    subtitle — it tracks the chart, so a drag retitles the bar */}
                {barLabel.sub && (
                  <span style={{ ...typography.caption, color: TEXT_SECONDARY }}>{barLabel.sub}</span>
                )}
              </div>
            ) : (
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
            )}
            {/* v2 moved the chevron INTO the pages (user call R35b) — this
                fixed one survives only as the chat's Collapse; v1 keeps it
                permanent per 1697/R13 */}
            <div style={{ display: v2 ? "none" : undefined, pointerEvents: "auto", opacity: 1 }}>
              <ChromeChip flip={textFlip} ghost={f} bare={v2} ariaLabel={full ? "Collapse" : "Back"} onClick={onChevron}>
                {(color) => <ChevronIcon color={color} rotate={f * (bottomAsk ? -90 : 90)} />}
              </ChromeChip>
            </div>
            {/* one chip, two lives: customise (kebab) on the dashboard, new chat
                (plus) on the chat screen — the icons crossfade IN PLACE instead of
                the chip sliding out (R13). Customise is a dashboard idea, so at
                rest the chip only exists on home; history rides in beside it. */}
            <div style={{ display: "flex", gap: 8 }}>

              {/* Invisible chat-side chips must not RESERVE space on detail bars,
                  or the funnel floats toward the centre instead of sitting at
                  the right edge (canon 2165:50912). v2's chat carries NO chips
                  at all (user call R34j: history + new-chat removed); v1 keeps
                  its pair. */}
              {!v2 && (
                <div style={{ display: full || f > 0.001 ? undefined : "none", pointerEvents: full ? "auto" : "none", opacity: f, transform: `translateX(${8 * (1 - f)}px)` }}>
                  <ChromeChip flip={textFlip} ghost={f} bare={v2} ariaLabel="Chat history" onClick={() => {}}>
                    {(color) => <HistoryIcon color={color} />}
                  </ChromeChip>
                </div>
              )}
              {!v2 && (
                <div
                  style={{
                    display: page === "home" || full || f > 0.001 ? undefined : "none",
                    pointerEvents: full || page === "home" ? "auto" : "none",
                    opacity: page === "home" ? 1 : f,
                    // page moves fade the chip instead of snapping it (R13)
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* The active L1 sheet sits above the shared chrome, but the desktop
          status bar remains common to every page and must stay above the sheet. */}
      {v2 && page === "trip" && !isMobile && (
        <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: statusH, zIndex: 60, pointerEvents: "none" }}>
          <StatusBar backgroundColor="transparent" color={TEXT_SECONDARY} />
        </div>
      )}

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

      {/* ── The scan's transaction picker — rises OVER the chat and hands back
          to it, the chat and its docked card untouched underneath ── */}
      {(pickOpen || pickS > 0.002) && (
        <SetupTxnPicker
          key={pickFlow}
          flow={pickFlow}
          s={pickS}
          onClose={() => setPickOpen(false)}
          onAdd={(rows) => setupPicked(rows, pickFlow)}
        />
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

      {/* ── V2 bottom sheets: the funnel's Filter Bank (2194:56380) and the
          budget allocation page's How it works ── */}
      {v2 && (
        <>
          <Dash2Sheet open={v2Sheet === "filter"} onClose={() => setV2Sheet(null)} title="Filter Bank" cta="Apply" onCta={() => setV2Sheet(null)}>
            <Dash2FilterBankRows picked={bankFilter} onPicked={setBankFilter} />
          </Dash2Sheet>
          <Dash2Sheet open={v2Sheet === "how"} onClose={() => setV2Sheet(null)} title="How it works" cta="Got it" onCta={() => setV2Sheet(null)}>
            <Dash2HowItWorksRows />
          </Dash2Sheet>
          {/* destructive, so the sheet asks first and the CTA stays neutral —
              slice never ships a red-fill primary for a delete */}
          {/* one sheet, two things it can take down — the trash chip is shared
              with the tracker, so the copy follows the page you opened it from */}
          <Dash2Sheet
            open={v2Sheet === "delete-goal"}
            onClose={() => setV2Sheet(null)}
            title={detailKind === "tracking" ? `Stop tracking ${feed.trackers.find((t) => t.id === activeTracker)?.label ?? DASH2_DEFAULT_TRACKER.label}?` : "Delete this goal?"}
            cta={detailKind === "tracking" ? "Stop tracking" : "Delete goal"}
            // it takes the thing down for real (user call): the card leaves the
            // feed while the page slides off it. The phone goal has no card.
            onCta={() => {
              setV2Sheet(null);
              if (detailKind === "tracking") removeWidget(activeTracker ? `track:${activeTracker}` : "tracker");
              else if (detailKind === "trip") removeWidget("trip");
              else if (detailKind === "goal" && activeGoal) removeWidget(`goal:${activeGoal}`);
              popDetail();
            }}
          >
            <p style={{ ...typography.bodySmall, lineHeight: "22px", color: TEXT_SECONDARY, margin: "0 0 8px", padding: `0 ${PAGE_GUTTER}px` }}>
              {detailKind === "tracking"
                ? `Your ${feed.trackers.find((t) => t.id === activeTracker)?.label ?? DASH2_DEFAULT_TRACKER.label} spends still show up in cashflow. The cap and its nudges stop.`
                : detailKind === "goal"
                  ? `Your ${inr(feed.goals.find((g) => g.id === activeGoal)?.saved ?? SETUP_GOAL.lump)} goes back to your balance. The autopay stops.`
                  : "Your ₹84,500 goes back to your balance. The autopay and the family contribution stop."}
            </p>
          </Dash2Sheet>
          {/* Hold a feed card → this. Remove is the outlined secondary and Keep
              the primary — slice never fills a destructive button — the same
              shape as the family sheet's canon Remove (2863:84643). */}
          <Dash2Sheet
            open={v2Sheet === "remove-widget"}
            onClose={() => setV2Sheet(null)}
            title={`Remove ${removeId ? dash2WidgetLabel(removeId, feed) : "this card"}?`}
            cta="Keep"
            onCta={() => setV2Sheet(null)}
            secondary="Remove"
            onSecondary={() => { setV2Sheet(null); if (removeId) removeWidget(removeId); }}
          >
            <p style={{ ...typography.bodySmall, lineHeight: "22px", color: TEXT_SECONDARY, margin: "0 0 8px", padding: `0 ${PAGE_GUTTER}px` }}>
              Only the card leaves your feed. What it tracks carries on as it is.
            </p>
          </Dash2Sheet>
          {/* Canon 2863:84643: the contribution opens on its amount, and the
              primary renames itself to Replan the moment you change it — the
              plan has to be redone, so the button says so. */}
          <Dash2Sheet
            open={v2Sheet === "family"}
            onClose={() => setV2Sheet(null)}
            title="Family Contributions"
            cta={familyDraftAmt === familyAmt ? "Done" : "Replan"}
            onCta={() => { setFamilyAmt(familyDraftAmt); setV2Sheet(null); }}
            secondary="Remove"
            onSecondary={() => { setFamilyAmt(null); setV2Sheet(null); }}
          >
            <div style={{ padding: `0 ${PAGE_GUTTER}px`, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${OUTLINE_BOLD}`, paddingBottom: 8 }}>
                <input
                  value={familyDraft}
                  onChange={(e) => setFamilyDraft(e.target.value.replace(/[^\d,₹]/g, ""))}
                  aria-label="Family contribution amount"
                  style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", ...typography.bodyNormal, color: TEXT_PRIMARY }}
                />
                {familyDraft !== "" && (
                  <button type="button" aria-label="Clear" onClick={() => setFamilyDraft("")} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, ...typography.bodyNormal, color: TEXT_TERTIARY }}>✕</button>
                )}
              </div>
              <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>Added on 6 Oct</span>
            </div>
          </Dash2Sheet>
          <Dash2Sheet open={v2Sheet === "bank-info"} onClose={() => setV2Sheet(null)} title="Bank sync" cta="Got it" onCta={() => setV2Sheet(null)}>
            <p style={{ ...typography.bodySmall, lineHeight: "22px", color: TEXT_SECONDARY, margin: `0 0 8px`, padding: `0 ${PAGE_GUTTER}px` }}>
              {DASH2_BANK_SYNC_NOTE}
            </p>
          </Dash2Sheet>
          <Dash2Sheet open={v2Sheet === "upcoming-info"} onClose={() => setV2Sheet(null)} title="Upcoming spends" cta="Got it" onCta={() => setV2Sheet(null)}>
            <p style={{ ...typography.bodySmall, lineHeight: "22px", color: TEXT_SECONDARY, margin: `0 0 8px`, padding: `0 ${PAGE_GUTTER}px` }}>
              {DASH2_UPCOMING_NOTE}
            </p>
          </Dash2Sheet>
        </>
      )}
    </div>
    </V2ChartCtx.Provider>
    </V2SkinCtx.Provider>
    </PaperCtx.Provider>
    </Dash2ThemeCtx.Provider>
  );
}
