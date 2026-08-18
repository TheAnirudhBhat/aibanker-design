"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
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
import { SPACE_2XS, SPACE_XS, SPACE_S, SPACE_M, SPACE_L, SPACE_XL } from "../lib/spacing";
import { RADIUS_CIRCLE, RADIUS_S } from "../lib/radii";
import { GestureNav, StatusBar } from "./AppChrome";

// ══════════════════════════════════════════════════════════════════
//  Pitch screens — the "New user (pitch)" FTUE. A dark-immersive
//  Cosimo carousel (meet Cosimo → value props), then the Connect
//  explainer, then the fetching screen. The pitch runs on a deep
//  purple gradient (drawn by the shell) with white type + a white
//  pill CTA; the illustrations are exported from the canonical Figma
//  (Onboarding · 580:3268/3344/3417) into /public/pitch.
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
        width: "100%",
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
    // NO StatusBar here — the pitch container renders ONE continuous status bar above every phase, so
    // it never re-mounts (no lag/flash) across pitch → linking → fetching.
    <div className="shrink-0" style={{ position: "relative", zIndex: 2, backgroundColor: surface }}>
      {/* Collapse the bar row entirely when there's nothing to show (no close X, no progress) — e.g. the
          AA step, where the progress rides inside AASim's own app bar instead of a separate row here. */}
      {/* 64px row — matches AASim's static header exactly, so the centred bar doesn't jump when the
          linking flow hands off to the fetching screen. */}
      {(onClose || progress !== null) && (
      <div className="relative flex items-center" style={{ height: 64, paddingLeft: 12, paddingRight: 12 }}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center transition-transform active:scale-[0.9]"
            // Match the AA linking flow's back/close inset (12px row + 12px button padding → icon at 24px).
            style={{ width: 48, height: 48, background: "none", border: "none", cursor: "pointer", padding: 12 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke={fg} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
        {/* Centred progress bar — hidden when progress is null. On completion it holds a beat,
            then fades away (filled + done = nothing left to show). */}
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
              opacity: progress >= 1 ? 0 : 1,
              transition: "opacity 420ms ease 700ms",
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
      )}
    </div>
  );
}

// Art box the illustration + its floating pills are absolutely positioned inside.
// Matches the Figma art-area (296×324) so pill offsets map 1:1 from the canonical.
const ART_BOX_W = 296;
const ART_BOX_H = 324;

// Frosted-glass pill — Figma Tag recipe: white@16% fill + backdrop blur, radius 8,
// Rubik Medium 14 white. Used for the slide-2 category tags (with icon) and the
// slide-3 goal tags (text only). Rebuilt in DOM so the white label stays readable
// over the illustration (baking the glass sampled the light cards and hid the text).
function GlassPill({ label, icon, style }: { label: string; icon?: string; style: CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        display: "inline-flex",
        alignItems: "center",
        gap: icon ? 5 : 0,
        height: 29,
        padding: "4px 8px",
        borderRadius: RADIUS_S,
        background: "rgba(255,255,255,0.16)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {icon && <img src={icon} alt="" draggable={false} style={{ width: 16, height: 16, display: "block", userSelect: "none" }} />}
      <span style={{ ...typography.buttonSmall, color: TEXT_ON_COLOR_PRIMARY }}>{label}</span>
    </div>
  );
}

type Slide = {
  art: string;
  /** Illustration placement inside the ART_BOX (from the canonical Figma coords). */
  artStyle: CSSProperties;
  /** Slide 1 only — the "Meet Cosimo" title that sits above the art. */
  topTitle?: string;
  headline: string; // \n line breaks match the canonical wrapping
  body: string;
  cta: string;
};

// Benefit-led pitch, dark-immersive Cosimo carousel. Copy + line breaks match the
// canonical Figma (Onboarding · 580:3268/3344/3417). Art is exported from those frames
// into /public/pitch; the dark gradient + atmosphere are drawn in code.
const SLIDES: Slide[] = [
  {
    art: "/pitch/cosimo.png",
    artStyle: { left: "50%", top: "46%", transform: "translate(-50%, -50%)", width: 288, height: 286 },
    topTitle: "Meet Cosimo",
    headline: "Your money's\nsecond brain",
    body: "Cosimo keeps track of\nevery rupee",
    cta: "Next",
  },
  {
    art: "/pitch/spends-cards.png",
    artStyle: { left: 52, top: 59, width: 204, height: 229 },
    headline: "See where\nit all goes",
    body: "Every spend, sorted\nand explained",
    cta: "Next",
  },
  {
    art: "/pitch/goals-planet.png",
    artStyle: { left: 10, top: 16, width: 277, height: 277 },
    headline: "Reach your\ngoals faster",
    body: "Cosimo builds the plan,\nthen keeps you on pace",
    cta: "Unlock Cosimo",
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
    // Transparent — the shared onboarding shell (page) owns the dark gradient + status bar + close.
    <div
      className="relative h-full w-full flex flex-col"
      style={{ backgroundColor: "transparent", overflow: "hidden" }}
    >
      {/* Sliding track — three full-width slides, translated by the active index. */}
      <div
        className="flex-1 min-h-0 overflow-hidden"
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
              style={{ width: `${100 / SLIDES.length}%`, paddingLeft: SPACE_XL, paddingRight: SPACE_XL, paddingTop: SPACE_S }}
            >
              {/* Slide-1 only: "Meet Cosimo" title above the art. Slides 2-3 have no title and
                  start higher — matching the canonical, where the art-area sits right below the header. */}
              {slide.topTitle && (
                <p className="shrink-0" style={{ ...typography.headerH1, color: TEXT_ON_COLOR_PRIMARY, textAlign: "center", margin: 0, paddingBottom: SPACE_XS }}>
                  {slide.topTitle}
                </p>
              )}

              {/* Art zone — illustration + floating pills, TOP-aligned per the canonical art-area. */}
              <div className="shrink-0 flex justify-center">
                <div style={{ position: "relative", width: ART_BOX_W, height: ART_BOX_H, flexShrink: 0 }}>
                  <img
                    src={slide.art}
                    alt=""
                    draggable={false}
                    style={{ position: "absolute", objectFit: "contain", userSelect: "none", ...slide.artStyle }}
                  />
                  {i === 1 && (
                    <>
                      <GlassPill label="Savings" icon="/pitch/icon-savings.png" style={{ left: 195, top: 80 }} />
                      <GlassPill label="Contributions" icon="/pitch/icon-contributions.png" style={{ left: 0, top: 168 }} />
                      <GlassPill label="Bills" icon="/pitch/icon-bills.png" style={{ left: 198, top: 234 }} />
                    </>
                  )}
                  {i === 2 && (
                    <>
                      <GlassPill label="Gadgets" style={{ left: -5, top: 134 }} />
                      <GlassPill label="Travel" style={{ left: 240, top: 134 }} />
                      <GlassPill label="Emergency" style={{ left: 102, top: 263 }} />
                    </>
                  )}
                </div>
              </div>

              {/* Copy block — headline + one short line, centered below the art. */}
              <div className="shrink-0 flex flex-col items-center text-center" style={{ gap: SPACE_XS, paddingTop: SPACE_M }}>
                <h1 className="whitespace-pre-line" style={{ ...typography.headerH1, color: TEXT_ON_COLOR_PRIMARY, margin: 0 }}>
                  {slide.headline}
                </h1>
                <p className="whitespace-pre-line" style={{ ...typography.bodyNormal, color: TEXT_ON_COLOR_SECONDARY, margin: 0 }}>
                  {slide.body}
                </p>
              </div>

              {/* Spacer — leaves the breathing room BELOW the copy (canonical keeps ~76px to the footer). */}
              <div className="flex-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer: full-width WHITE pill CTA (Next / Continue) + gesture nav. */}
      <div className="shrink-0">
        <div className="flex items-center justify-center" style={{ paddingLeft: SPACE_L, paddingRight: SPACE_L, paddingBottom: SPACE_M }}>
          <button
            type="button"
            onClick={next}
            className="transition-transform active:scale-[0.98]"
            style={{
              width: "100%",
              height: 48,
              borderRadius: RADIUS_CIRCLE,
              backgroundColor: ALPHA_WHITE_FF,
              border: "none",
              cursor: "pointer",
              ...typography.buttonNormal,
              color: TEXT_PRIMARY,
            }}
          >
            {SLIDES[index].cta}
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
              width: "100%",
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

export function PitchFetching({ onExplore }: { onExplore: (rects: { img: DOMRect | null; root: DOMRect | null }) => void }) {
  const [i, setI] = useState(0);

  // Cosmetic loop — conveys ongoing work while the CTA stays live (the fetch keeps running).
  useEffect(() => {
    const id = window.setInterval(() => setI((prev) => (prev + 1) % FETCH_STATUSES.length), FETCH_STEP_MS);
    return () => window.clearInterval(id);
  }, []);

  // On "Explore Ryan" the PARENT runs the shared-element handoff (a ghost Ryan flies from this image
  // up into the chat's app-bar pill while a backdrop covers the chat mount). This screen just reports
  // where the image + frame sit and hands off immediately — no internal animation to fight the unmount.
  const imgRef = useRef<HTMLImageElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const launch = () =>
    onExplore({
      img: imgRef.current?.getBoundingClientRect() ?? null,
      // The PITCH SHELL rect (full phone incl. status bar), not this screen's root — the ghost pill
      // computes the app-bar position from it, and this root starts below the shared chrome.
      root: (rootRef.current?.closest("[data-pitch-shell]") ?? rootRef.current)?.getBoundingClientRect() ?? null,
    });

  return (
    // Transparent — shared onboarding chrome (page) provides the surface + status bar.
    <div ref={rootRef} className="relative h-full w-full flex flex-col" style={{ backgroundColor: "transparent" }}>
      {/* Centred status block. paddingBottom offsets the taller footer (CTA + gesture nav) so the block
          sits at the OPTICAL centre of the screen, not just the centre of the space above the footer. */}
      <div
        className="flex-1 flex flex-col items-center justify-center text-center"
        style={{ paddingLeft: SPACE_XL, paddingRight: SPACE_XL, gap: SPACE_L, paddingBottom: 72 }}
      >
        <img ref={imgRef} src="/characters/ryan.svg" alt="" width={132} height={132} style={{ display: "block" }} />
        {/* No spinner — the rotating status line carries the "working" feel on its own. */}
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
          <PrimaryCta label="Explore Ryan" onClick={launch} />
        </div>
        <GestureNav />
      </div>
    </div>
  );
}
