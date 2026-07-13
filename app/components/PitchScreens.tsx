"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  VALENTINO_500,
  ALPHA_WHITE_FF,
  ALPHA_WHITE_20,
  EXT_BG_SUBTLE_MAIN,
  OUTLINE_SUBTLE,
  OUTLINE_BOLD,
  BG_SHEET,
  TEXT_ON_COLOR_PRIMARY,
  TEXT_ON_COLOR_SECONDARY,
} from "../lib/colors";
import { ELEVATION_CARD } from "../lib/elevation";
import { SPACE_2XS, SPACE_XS, SPACE_S, SPACE_M, SPACE_L, SPACE_XL, SPACE_3XL } from "../lib/spacing";
import { RADIUS_CIRCLE } from "../lib/radii";
import { ILLUST_MY_SPENDS, ILLUST_AFFORD_IT } from "../lib/illustrations";
import { GestureNav, StatusBar } from "./AppChrome";

// ══════════════════════════════════════════════════════════════════
//  Pitch screens — the "New user (pitch)" FTUE. A Valentino brand
//  takeover carousel (meet Ryan → value props), then a dedicated
//  Connect explainer, then the fetching screen. Brand-immersive per
//  the DLS Pay-screen language: BG_BRAND surface (V-500 light,
//  near-black in dark), on-colour white type, white status bar.
// ══════════════════════════════════════════════════════════════════

// ── Themed line icon: drives a slice SVG's shape via CSS mask so it tints + themes. ──
function MaskIcon({ src, size = 24, color = VALENTINO_500 }: { src: string; size?: number; color?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
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

// Full-width Valentino CTA (used on white surfaces).
function PrimaryCta({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="transition-transform active:scale-[0.98]"
      style={{
        width: 312,
        maxWidth: "100%",
        height: 48,
        borderRadius: RADIUS_CIRCLE,
        backgroundColor: VALENTINO_500,
        border: "none",
        cursor: "pointer",
        ...typography.buttonNormal,
        color: ALPHA_WHITE_FF,
      }}
    >
      {label}
    </button>
  );
}

// Locked goal-tracker chip for the chat's top-right: goal planning stays locked until the user builds
// a goal. Same 48px chip language as the live tracker, just a clean lock glyph.
export function LockedTrackerChip() {
  return (
    <div
      aria-label="Locked — set up a goal to unlock"
      style={{
        width: 48,
        height: 48,
        borderRadius: RADIUS_CIRCLE,
        backgroundColor: BG_SHEET,
        border: `1px solid ${OUTLINE_BOLD}`,
        boxShadow: ELEVATION_CARD,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 4,
      }}
    >
      <svg width={20} height={22} viewBox="0 0 16 18" fill="none" aria-hidden="true">
        <rect x={3} y={8} width={10} height={7} rx={1.6} stroke={TEXT_SECONDARY} strokeWidth={1.4} />
        <path d="M5.5 8V5.5a2.5 2.5 0 0 1 5 0V8" stroke={TEXT_SECONDARY} strokeWidth={1.4} strokeLinecap="round" />
      </svg>
    </div>
  );
}

// Shared onboarding chrome for the full-screen pitch phases: status bar + a back button + a centered
// progress bar. Rendered ONCE by the page above the swapping content, so it never slides between pages.
// `tone` flips colours for the brand (light) vs white (dark) surfaces; `progress` is 0..1.
export function PitchOnboardingChrome({
  progress,
  tone,
  surface,
  onClose,
}: {
  /** 0..1, or null to hide the bar (e.g. the fetching screen — onboarding is effectively done). */
  progress: number | null;
  tone: "light" | "dark";
  /** Exact surface colour of the screen below, so the bar paints the same fill (no seam). */
  surface: string;
  onClose?: () => void;
}) {
  const fg = tone === "light" ? TEXT_ON_COLOR_PRIMARY : TEXT_PRIMARY;
  const track = tone === "light" ? ALPHA_WHITE_20 : OUTLINE_SUBTLE;
  const fill = tone === "light" ? TEXT_ON_COLOR_PRIMARY : VALENTINO_500;
  return (
    <div className="shrink-0" style={{ position: "relative", zIndex: 2, backgroundColor: surface }}>
      <StatusBar backgroundColor={surface} color={fg} />
      <div className="relative flex items-center" style={{ height: 56, paddingLeft: 8, paddingRight: 8 }}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center transition-transform active:scale-[0.9]"
            style={{ width: 40, height: 40, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke={fg} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
        {/* Centred progress bar — hidden when progress is null. */}
        {progress !== null && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              width: 140,
              height: 4,
              borderRadius: RADIUS_CIRCLE,
              backgroundColor: track,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`,
                height: "100%",
                borderRadius: RADIUS_CIRCLE,
                backgroundColor: fill,
                transition: "width 320ms cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

type Slide = {
  art: string;
  artSize: number;
  badge?: string;
  headline: string;
  body: string;
};

// Benefit-led pitch. Short, warm, slice voice. Copy is easy to tweak on the running proto.
const SLIDES: Slide[] = [
  {
    art: "/characters/ryan.svg",
    artSize: 150,
    badge: "Meet Ryan",
    headline: "Your money's\nsecond brain",
    body: "Ryan keeps track of every rupee, so you don't have to.",
  },
  {
    art: ILLUST_MY_SPENDS,
    artSize: 176,
    headline: "See where\nit all goes",
    body: "Every spend, sorted and explained. No spreadsheets, no guessing.",
  },
  {
    art: ILLUST_AFFORD_IT,
    artSize: 176,
    headline: "Reach your\ngoals faster",
    body: "Set a goal and Ryan builds the plan, then keeps you on pace.",
  },
];

const SWIPE_THRESHOLD = 48; // px drag before a swipe commits to the next/prev slide

export default function PitchScreens({
  index,
  onIndexChange,
  onContinue,
}: {
  index: number;
  onIndexChange: (i: number) => void;
  onContinue: () => void;
}) {
  const isLast = index === SLIDES.length - 1;

  const goTo = useCallback((i: number) => {
    onIndexChange(Math.max(0, Math.min(SLIDES.length - 1, i)));
  }, [onIndexChange]);

  const next = useCallback(() => {
    if (isLast) onContinue();
    else goTo(index + 1);
  }, [isLast, index, goTo, onContinue]);

  // ── Touch/pointer swipe ──
  const dragStartX = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => { dragStartX.current = e.clientX; };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current == null) return;
    const dx = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (dx <= -SWIPE_THRESHOLD) goTo(index + 1);
    else if (dx >= SWIPE_THRESHOLD) goTo(index - 1);
  };

  return (
    // Transparent — the shared onboarding shell (page) owns the surface colour + status bar + progress.
    <div
      className="relative h-full w-full flex flex-col"
      style={{ backgroundColor: "transparent", overflow: "hidden" }}
    >
      {/* Soft top glow for depth on the brand surface. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -160,
          left: "50%",
          transform: "translateX(-50%)",
          width: 420,
          height: 420,
          borderRadius: RADIUS_CIRCLE,
          background: "radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Sliding track — three full-width slides, translated by the active index. */}
      <div
        className="flex-1 overflow-hidden"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <div
          className="flex h-full"
          style={{
            width: `${SLIDES.length * 100}%`,
            transform: `translateX(-${index * (100 / SLIDES.length)}%)`,
            transition: "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {SLIDES.map((slide, i) => (
            <div
              key={slide.headline}
              className="h-full flex flex-col"
              style={{ width: `${100 / SLIDES.length}%`, paddingLeft: SPACE_XL, paddingRight: SPACE_XL }}
            >
              {/* Art on a solid white disc — reads cleanly on V-500 (light) and near-black (dark). */}
              <div className="flex-1 flex items-center justify-center">
                <div
                  style={{
                    width: 216,
                    height: 216,
                    flexShrink: 0,
                    aspectRatio: "1 / 1",
                    borderRadius: RADIUS_CIRCLE,
                    backgroundColor: ALPHA_WHITE_FF,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
                  }}
                >
                  <img
                    src={slide.art}
                    alt=""
                    width={slide.artSize}
                    height={slide.artSize}
                    style={{ display: "block", objectFit: "contain", transform: i === index ? "scale(1)" : "scale(0.9)", transition: "transform 420ms cubic-bezier(0.22,1,0.36,1)" }}
                  />
                </div>
              </div>

              {/* Copy block, bottom-aligned above the footer. */}
              <div className="flex flex-col" style={{ gap: SPACE_M, paddingBottom: SPACE_3XL }}>
                {slide.badge && (
                  <div
                    style={{
                      alignSelf: "flex-start",
                      padding: `${SPACE_2XS}px ${SPACE_S}px`,
                      borderRadius: RADIUS_CIRCLE,
                      backgroundColor: ALPHA_WHITE_20,
                    }}
                  >
                    <span style={{ ...typography.buttonSmall, color: TEXT_ON_COLOR_PRIMARY }}>{slide.badge}</span>
                  </div>
                )}
                <div className="flex flex-col" style={{ gap: SPACE_XS }}>
                  <h1 className="whitespace-pre-line" style={{ ...typography.headerH1, color: TEXT_ON_COLOR_PRIMARY, margin: 0 }}>
                    {slide.headline}
                  </h1>
                  <p className="whitespace-pre-line" style={{ ...typography.bodyNormal, color: TEXT_ON_COLOR_SECONDARY, margin: 0 }}>
                    {slide.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer: full-width CTA (white on brand) + gesture nav. Progress lives in the shared top chrome. */}
      <div className="shrink-0">
        <div className="flex flex-col items-center" style={{ paddingLeft: SPACE_L, paddingRight: SPACE_L, paddingBottom: SPACE_M }}>
          {/* White pill on the brand surface, Valentino label — the on-colour inverse of the standard CTA. */}
          <button
            type="button"
            onClick={next}
            className="transition-transform active:scale-[0.98]"
            style={{
              width: 312,
              maxWidth: "100%",
              height: 48,
              borderRadius: RADIUS_CIRCLE,
              backgroundColor: ALPHA_WHITE_FF,
              border: "none",
              cursor: "pointer",
              ...typography.buttonNormal,
              color: VALENTINO_500,
            }}
          >
            {isLast ? "Continue" : "Next"}
          </button>
        </div>
        <GestureNav />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Pitch connect — the "why connect" explainer. White DLS page:
//  headline + 3 benefit rows, primary Connect + secondary
//  "continue with slice account only".
// ══════════════════════════════════════════════════════════════════

// Titles only — one tight line each (no subtitles), so the page fits the shell without overflow.
const CONNECT_BENEFITS: { iconSrc: string; title: string }[] = [
  { iconSrc: "/icons/graph.svg", title: "All your spends in one place" },
  { iconSrc: "/icons/spark-line.svg", title: "Patterns you'd miss on your own" },
  { iconSrc: "/icons/shield.svg", title: "Read-only, via RBI account aggregator" },
];

export function PitchConnect({
  onConnect,
  onSliceOnly,
}: {
  onConnect: () => void;
  onSliceOnly: () => void;
}) {
  return (
    // Transparent + no app bar — the shared onboarding chrome (page) provides the status bar + back.
    <div className="relative h-full w-full flex flex-col" style={{ backgroundColor: "transparent" }}>
      {/* Content scrolls if it ever exceeds the shell, so nothing spills outside the phone. */}
      <div className="flex-1 flex flex-col overflow-y-auto" style={{ paddingLeft: SPACE_XL, paddingRight: SPACE_XL, paddingTop: SPACE_S, gap: SPACE_L, paddingBottom: SPACE_M }}>
        {/* Hero glyph on a V-100 subtle disc. */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: RADIUS_CIRCLE,
            backgroundColor: EXT_BG_SUBTLE_MAIN,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <MaskIcon src="/icons/shield.svg" size={34} color={VALENTINO_500} />
        </div>

        {/* Headline + one short line */}
        <div className="flex flex-col" style={{ gap: SPACE_XS }}>
          <h1 style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0 }}>Connect your accounts</h1>
          <p style={{ ...typography.bodyNormal, color: TEXT_SECONDARY, margin: 0 }}>
            So Ryan sees your full money picture, not just slice.
          </p>
        </div>

        {/* Benefit rows — title only */}
        <div className="flex flex-col" style={{ gap: SPACE_M }}>
          {CONNECT_BENEFITS.map((b) => (
            <div key={b.title} className="flex items-center" style={{ gap: SPACE_S }}>
              <div className="shrink-0" style={{ width: 24, height: 24 }}>
                <MaskIcon src={b.iconSrc} size={24} color={VALENTINO_500} />
              </div>
              <span style={{ ...typography.headerH4, color: TEXT_PRIMARY }}>{b.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer: primary Connect + secondary slice-only. */}
      <div className="shrink-0">
        <div
          className="flex flex-col items-center"
          style={{ paddingTop: SPACE_S, paddingLeft: SPACE_L, paddingRight: SPACE_L, paddingBottom: SPACE_2XS, gap: SPACE_2XS }}
        >
          <PrimaryCta label="Connect your accounts" onClick={onConnect} />
          <button
            type="button"
            onClick={onSliceOnly}
            className="transition-transform active:scale-[0.98]"
            style={{
              width: 312,
              maxWidth: "100%",
              height: 44,
              borderRadius: RADIUS_CIRCLE,
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              ...typography.buttonNormal,
              color: VALENTINO_500,
            }}
          >
            Continue with slice account only
          </button>
        </div>
        <GestureNav />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Pitch fetching — shown right after Connect. Ryan pulls the data in
//  the background; the primary CTA ("Explore Ryan") lets the user jump
//  straight into the chat without waiting for the fetch to finish.
// ══════════════════════════════════════════════════════════════════

const FETCH_STATUSES = [
  "Pulling your transactions",
  "Sorting them by category",
  "Spotting your patterns",
  "Building your spending snapshot",
];
const FETCH_STEP_MS = 1100; // dwell per status line (cosmetic loop, does not gate the CTA)

export function PitchFetching({ onExplore }: { onExplore: () => void }) {
  const [i, setI] = useState(0);

  // Cosmetic loop — conveys ongoing work while the CTA stays live (the fetch keeps running).
  useEffect(() => {
    const id = window.setInterval(() => setI((prev) => (prev + 1) % FETCH_STATUSES.length), FETCH_STEP_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    // Transparent — shared onboarding chrome (page) provides the surface + status bar.
    <div className="relative h-full w-full flex flex-col" style={{ backgroundColor: "transparent" }}>
      {/* Centred status block */}
      <div
        className="flex-1 flex flex-col items-center justify-center text-center"
        style={{ paddingLeft: SPACE_XL, paddingRight: SPACE_XL, gap: SPACE_L }}
      >
        <img src="/characters/ryan.svg" alt="" width={132} height={132} style={{ display: "block" }} />
        <div
          aria-hidden
          className="animate-spin"
          style={{ width: 28, height: 28, borderRadius: RADIUS_CIRCLE, border: `3px solid ${OUTLINE_SUBTLE}`, borderTopColor: VALENTINO_500 }}
        />
        <div className="flex flex-col" style={{ gap: SPACE_XS }}>
          <h1 style={{ ...typography.headerH2, color: TEXT_PRIMARY, margin: 0 }}>Your data is being fetched</h1>
          <p key={i} className="animate-chat-message-in" style={{ ...typography.bodyNormal, color: TEXT_SECONDARY, margin: 0 }}>
            {FETCH_STATUSES[i]}
          </p>
        </div>
      </div>

      {/* Footer: primary CTA (jump into chat now) + gesture nav. */}
      <div className="shrink-0">
        <div className="flex flex-col items-center" style={{ paddingLeft: SPACE_L, paddingRight: SPACE_L, paddingBottom: SPACE_M }}>
          <PrimaryCta label="Explore Ryan" onClick={onExplore} />
        </div>
        <GestureNav />
      </div>
    </div>
  );
}
