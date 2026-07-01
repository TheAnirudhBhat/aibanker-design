"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY,
  TEXT_TERTIARY,
  BG_PRIMARY,
  BG_CARD,
  BG_GLASS,
  OUTLINE_SUBTLE,
  OUTLINE_BOLD,
  VALENTINO_500,
  RED_500,
} from "../lib/colors";
import { ELEVATION_CARD } from "../lib/elevation";
import { useTheme } from "../lib/theme";
import {
  SPACE_XS,
  SPACE_S,
  SPACE_M,
  SPACE_L,
  SPACE_XL,
  SPACE_2XL,
} from "../lib/spacing";
import { RADIUS_PILL, RADIUS_CIRCLE } from "../lib/radii";
import { StatusBar, GestureNav } from "../components/AppChrome";
import { canvasPath as createBlobAnimation, wigglePreset } from "blobs/v2/animate";
import {
  WRAPPED_BEATS,
  CARD_PALETTES,
  BEAT_DATA,
  type WrappedBeat,
  type GuessChip,
} from "./fixtures/wrappedFixture";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const DURATION = 420;
const BRICOLAGE = "var(--font-bricolage), var(--font-rubik), system-ui, sans-serif";
const HERO_FONT = BRICOLAGE;

const HERO_SIZE_EXPANDED = 88;

// ── Build the flat list of screens from beats ───────────────────

type Screen =
  | { kind: "guess-q"; beatIndex: number; beat: Extract<WrappedBeat, { kind: "guess" }> }
  | { kind: "guess-r"; beatIndex: number; beat: Extract<WrappedBeat, { kind: "guess" }> }
  | { kind: "observation"; beatIndex: number; beat: Extract<WrappedBeat, { kind: "observation" }> }
  | { kind: "reveal"; beatIndex: number; beat: Extract<WrappedBeat, { kind: "reveal" }>; isClose: true };

function buildScreens(beats: WrappedBeat[], beatIndexOffset = 0): Screen[] {
  const screens: Screen[] = [];
  beats.forEach((beat, i) => {
    const beatIndex = i + beatIndexOffset;
    if (beat.kind === "guess") {
      screens.push({ kind: "guess-q", beatIndex, beat });
      screens.push({ kind: "guess-r", beatIndex, beat });
    } else if (beat.kind === "observation") {
      screens.push({ kind: "observation", beatIndex, beat });
    } else if (beat.kind === "reveal") {
      screens.push({ kind: "reveal", beatIndex, beat, isClose: true });
    }
  });
  return screens;
}

// ── Icons ──────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke={TEXT_PRIMARY} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 16V4M12 4L7 9M12 4l5 5M5 16v3a2 2 0 002 2h10a2 2 0 002-2v-3"
        stroke={TEXT_PRIMARY}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ForwardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke={TEXT_PRIMARY}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Round buttons ──────────────────────────────────────────────

function RoundButton({
  onClick,
  children,
  ariaLabel,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex items-center justify-center transition-transform active:scale-[0.95]"
      style={{
        width: 48,
        height: 48,
        borderRadius: RADIUS_CIRCLE,
        backgroundColor: BG_CARD,
        border: `1px solid ${OUTLINE_BOLD}`,
        boxShadow: ELEVATION_CARD,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

// ── Countdown timer ─────────────────────────────────────────────

const COUNTDOWN_DURATION = 8;

function CountdownTimer({ duration, onExpire, resetKey }: { duration: number; onExpire: () => void; resetKey: number }) {
  const [remaining, setRemaining] = useState(duration);
  const onExpireRef = useRef(onExpire);
  const firedRef = useRef(false);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setRemaining(duration);
    firedRef.current = false;
    const startDelay = window.setTimeout(() => {
      const interval = window.setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            if (!firedRef.current) {
              firedRef.current = true;
              window.setTimeout(() => onExpireRef.current(), 150);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      cleanupRef.current = () => clearInterval(interval);
    }, 600);
    const cleanupRef = { current: () => {} };
    return () => {
      clearTimeout(startDelay);
      cleanupRef.current();
    };
  }, [duration, resetKey]);

  const ringSize = 32;
  const sw = 3.5;
  const center = ringSize / 2;
  const radius = (ringSize - sw) / 2 - 1;
  const circumference = 2 * Math.PI * radius;
  const pct = (remaining / duration) * 100;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: 48,
        height: 48,
        backgroundColor: BG_PRIMARY,
        border: `1px solid ${OUTLINE_SUBTLE}`,
        boxShadow: "0px 2px 32px 0px rgba(0,0,0,0.05)",
      }}
    >
      <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={VALENTINO_500} strokeWidth={sw} opacity={0.15} />
        <circle
          cx={center} cy={center} r={radius} fill="none" stroke={VALENTINO_500} strokeWidth={sw}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
        <text
          x={center} y={center} textAnchor="middle" dominantBaseline="central"
          style={{ fontFamily: "var(--font-rubik), sans-serif", fontSize: 12, fontWeight: 400, letterSpacing: `${12 * 0.02}px`, fill: TEXT_PRIMARY }}
        >
          {remaining}
        </text>
      </svg>
    </div>
  );
}

// ── Progress dots ───────────────────────────────────────────────

function ProgressDots({ total, currentBeat }: { total: number; currentBeat: number }) {
  return (
    <div className="flex items-center justify-center" style={{ gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i === currentBeat;
        const past = i < currentBeat;
        return (
          <div
            key={i}
            style={{
              width: active ? 24 : 8,
              height: 4,
              borderRadius: 2,
              backgroundColor: active || past ? TEXT_PRIMARY : TEXT_TERTIARY,
              transition: `all ${DURATION}ms ${EASE}`,
            }}
          />
        );
      })}
    </div>
  );
}

// ── Blob - unique per card via seed ─────────────────────────────

// Seed-derived starting positions so each blob lands differently
function CardBlob({ seed, color, size, animate = false }: { seed: number; color: string; size: number; animate?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<ReturnType<typeof createBlobAnimation> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High-DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const animation = createBlobAnimation();
    animRef.current = animation;

    const blobOptions = { seed, extraPoints: 14, randomness: 2, size };
    const canvasOptions = { offsetX: 0, offsetY: 0 };

    if (animate) {
      // Wiggle preset - continuous organic morphing
      wigglePreset(animation, blobOptions, canvasOptions, { speed: 2 });
      animation.play();
    } else {
      // Static - just render one frame
      animation.transition({ duration: 0, blobOptions, canvasOptions });
    }

    let rafId: number;
    const render = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = color;
      const path = animation.renderFrame();
      ctx.fill(path);
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      animation.pause();
    };
  }, [seed, color, size, animate]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        // Anchored to the upper half (centred, pulled up ~half) so the blob divides the card and only
        // its lower curve — where the wiggle reads — shows; the rest is clipped above the card.
        // minWidth: 100% guarantees the blob always spans edge-to-edge, never inside the screen edges.
        top: -size * 0.5,
        left: "50%",
        transform: "translateX(-50%)",
        minWidth: "100%",
        width: size,
        height: size,
        pointerEvents: "none",
      }}
    />
  );
}

// ── Guess question screen (unchanged from V2) ───────────────────

function GuessQuestionScreen({
  beat,
  beatIndex,
  onAnswer,
}: {
  beat: Extract<WrappedBeat, { kind: "guess" }>;
  beatIndex: number;
  onAnswer: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [crossIn, setCrossIn] = useState(false);   // the wrong pick's cross
  const [revealIn, setRevealIn] = useState(false);  // the correct answer lighting up + its tick
  const palette = CARD_PALETTES[beatIndex % CARD_PALETTES.length];
  const hasCorrect = !!beat.correctId;

  const handleSelect = (id: string) => {
    if (selected) return; // lock after the first pick
    setSelected(id);
    if (!hasCorrect) { window.setTimeout(onAnswer, 320); return; }
    if (id === beat.correctId) {
      // Right pick: the tick lands on the chosen answer, a brief beat, then advance.
      window.setTimeout(() => setRevealIn(true), 90);
      window.setTimeout(onAnswer, 1150);
    } else {
      // Wrong pick — staged: a cross first lands on your tap (acknowledges it), then a beat later the
      // correct answer lights up + ticks in (overshoot) to pull the eye, while your pick eases down.
      window.setTimeout(() => setCrossIn(true), 90);
      window.setTimeout(() => setRevealIn(true), 440);
      window.setTimeout(onAnswer, 1550);
    }
  };

  return (
    <div
      className="h-full w-full flex flex-col"
      // Top padding clears the floating top chrome (status bar + close/progress, ~108px).
      // Bottom only needs to clear the gesture nav — forward/share buttons are hidden on
      // question screens — now that the screen stack is full-height (inset:0).
      style={{ backgroundColor: BG_PRIMARY, padding: `${108 + SPACE_M}px ${SPACE_L}px ${SPACE_2XL}px` }}
    >
      {/* Question - vertically centered, text centered */}
      <div className="flex-1 flex flex-col justify-center">
        <p
          style={{
            fontFamily: BRICOLAGE,
            fontWeight: 500,
            fontSize: 32,
            lineHeight: 1.15,
            color: palette.text,
            margin: 0,
            paddingRight: 20,
          }}
        >
          {beat.question}
        </p>
      </div>

      {/* Options - anchored to bottom */}
      <div style={{ display: "flex", flexDirection: "column", gap: SPACE_S, paddingBottom: SPACE_L }}>
        {beat.chips.map((chip) => {
          const decided = selected !== null;
          const isCorrect = chip.id === beat.correctId;
          const isSelected = selected === chip.id;
          const isWrongPick = decided && isSelected && !isCorrect;
          // Scored mode: once a pick is made the right answer always lights up (with a tick), a wrong
          // pick keeps its fill and shows a cross, and the rest dim back. Without a correctId, fall
          // back to the old behaviour (the picked option simply fills).
          // Scored, staged: the correct answer lights up (fill + tick) only once `revealIn` fires; a
          // wrong pick shows a cross first (`crossIn`) then eases down as the correct one rises. The
          // others fade back. No correctId → fall back to the picked option simply filling.
          const lit = hasCorrect ? (revealIn && isCorrect) : isSelected;
          const opacity = hasCorrect && decided && !isCorrect && !isWrongPick ? 0.4
            : (isWrongPick && revealIn) ? 0.6 : 1;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleSelect(chip.id)}
              className="w-full active:scale-[0.99]"
              style={{
                ...typography.buttonNormal,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: SPACE_S,
                // Wrong pick reads clearly wrong: a red-tint fill + red text/cross (the cross uses
                // currentColor), distinct from the neutral 14% fill of the un-chosen options.
                color: isWrongPick ? RED_500 : lit ? BG_PRIMARY : TEXT_PRIMARY,
                // Solid fill snaps in at the reveal beat (no color-mix transition — that flickered);
                // the staged motion comes from the tick/cross entrance + the opacity easing.
                backgroundColor: isWrongPick
                  ? `color-mix(in srgb, ${RED_500} 16%, transparent)`
                  : lit ? palette.text : `color-mix(in srgb, ${palette.text} 14%, transparent)`,
                border: "none",
                borderRadius: RADIUS_PILL,
                padding: `14px ${SPACE_L}px`,
                textAlign: "left",
                cursor: decided ? "default" : "pointer",
                opacity,
                transition: "opacity 300ms ease-out, transform 120ms ease",
              }}
            >
              <span>{chip.label}</span>
              {hasCorrect && decided && (isCorrect || isWrongPick) && (
                <span
                  aria-hidden
                  style={{
                    display: "inline-flex",
                    flexShrink: 0,
                    opacity: (isCorrect ? revealIn : crossIn) ? 1 : 0,
                    transform: (isCorrect ? revealIn : crossIn) ? "scale(1)" : "scale(0.5)",
                    // Tick: a confident overshoot. Cross: a calmer, no-overshoot settle.
                    transition: isCorrect
                      ? "opacity 200ms ease-out, transform 280ms cubic-bezier(0.34,1.56,0.64,1)"
                      : "opacity 160ms ease-out, transform 200ms ease-out",
                  }}
                >
                  {isCorrect ? (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9.5l3 3 7-7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5 5l8 8M13 5l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Card-style reveal screen (V3 - matches carousel cards) ──────

function RyanQuipBubble({ text, isActive, instant = false }: { text: string; isActive: boolean; instant?: boolean; palette: { text: string; bg: string; bgDark: string; textDark: string } }) {
  const { mode } = useTheme();
  const isDark = mode === "dark";
  const [visible, setVisible] = useState(instant);
  const [displayed, setDisplayed] = useState(instant ? text : "");
  const posRef = useRef(instant ? text.length : 0);
  const hasTriggered = useRef(instant);

  // Only trigger when the screen becomes active (skip if instant)
  useEffect(() => {
    if (instant || !isActive || hasTriggered.current) return;
    hasTriggered.current = true;

    const showDelay = window.setTimeout(() => {
      setVisible(true);
      window.setTimeout(() => {
        const tick = () => {
          const chunkSize = 2 + Math.floor(Math.random() * 2);
          const nextPos = Math.min(posRef.current + chunkSize, text.length);
          posRef.current = nextPos;
          setDisplayed(text.slice(0, nextPos));
          if (nextPos < text.length) {
            window.setTimeout(tick, 25 + Math.random() * 25);
          }
        };
        tick();
      }, 300);
    }, 100); // start almost immediately on open (was 1000)

    return () => clearTimeout(showDelay);
  }, [isActive, text, instant]);

  if (!visible) return null;

  return (
    <div className="flex justify-start animate-chat-message-in">
      <div
        className="max-w-[75%] rounded-[16px] rounded-tl-lg"
        style={{
          // A solid near-black speech bubble in both modes (like the chat) \u2014 no glassy tint \u2014 so the
          // quip reads clearly on the colourful reveal card.
          backgroundColor: isDark ? "#F4F4F6" : "#1C1E26",
          padding: "12px 16px",
        }}
      >
        <p style={{ ...typography.bodySmall, color: isDark ? "#1C1E26" : "#FFFFFF", margin: 0 }}>
          {displayed || "\u00A0"}
        </p>
      </div>
    </div>
  );
}

function CardRevealScreen({
  beatId,
  beatIndex,
  ryan,
  isActive,
  instantQuip = false,
}: {
  beatId: string;
  beatIndex: number;
  ryan: string;
  isActive: boolean;
  instantQuip?: boolean;
}) {
  const data = BEAT_DATA[beatId];
  const { mode } = useTheme();
  const isDark = mode === "dark";
  if (!data) return null;
  const palette = CARD_PALETTES[beatIndex % CARD_PALETTES.length];
  // Use the palette's dark-tuned text in dark mode — the light `text` sat on the dark bg and read dull.
  const textColor = isDark ? palette.textDark : palette.text;
  const nSize = HERO_SIZE_EXPANDED;

  return (
    <div
      className="h-full w-full flex flex-col"
      style={{
        backgroundColor: isDark ? palette.bgDark : palette.bg,
        // Top padding clears the floating top chrome (status bar + close/progress, ~108px);
        // bottom padding clears the floating forward button + gesture nav (~92px) since the
        // screen stack is now full-height (inset:0) for the edge-to-edge slide reveal.
        padding: `${108 + SPACE_M}px ${SPACE_L}px ${92}px`,
        position: "relative",
        overflow: "hidden",
        justifyContent: "flex-end",
      }}
    >
      {/* Blob - unique per card, animates when active */}
      <CardBlob seed={beatIndex * 1000 + 42} color={palette.accent} size={760} animate={isActive} />

      {/* Spacer - pushes data to bottom, bubble sits above it */}
      <div style={{ flex: 1 }} />

      {/* Ryan quip - left-aligned chat bubble, above data stack */}
      <div style={{ position: "relative", zIndex: 1, marginBottom: SPACE_L }}>
        <RyanQuipBubble text={ryan} isActive={isActive} instant={instantQuip} palette={palette} />
      </div>

      {/* Content stack - bottom-anchored, same structure as small card */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <span style={{ ...typography.headerH4, color: textColor, opacity: 0.85 }}>
          {data.labelAbove}
        </span>

        <div style={{ marginTop: SPACE_S }}>
          <span
            style={{
              fontFamily: BRICOLAGE,
              fontSize: nSize,
              fontWeight: 700,
              lineHeight: 1,
              color: textColor,
            }}
          >
            {data.number}
          </span>
        </div>

        <span style={{ ...typography.headerH3, color: textColor, opacity: 0.85, display: "block", marginTop: SPACE_S }}>
          {data.labelBelow}
        </span>
      </div>

    </div>
  );
}

// ── Main story component ───────────────────────────────────────

export default function WrappedStory({
  onClose,
  startFromBeat = 0,
  reviewBeatIndex,
}: {
  onClose: (revealedCount: number) => void;
  startFromBeat?: number;
  /** When set, opens in review mode showing only reveal screens for beats 0..revealedCount-1 */
  reviewBeatIndex?: number;
}) {
  const isReviewMode = reviewBeatIndex != null;
  const { mode } = useTheme();
  const isDark = mode === "dark";

  // Quiz mode: build screens for unrevealed beats (startFromBeat onward)
  // Review mode: build only reveal screens for beats 0..startFromBeat-1
  const beatsToShow = useMemo(
    () => isReviewMode ? WRAPPED_BEATS.slice(0, startFromBeat) : WRAPPED_BEATS.slice(startFromBeat),
    [startFromBeat, isReviewMode],
  );

  const screens = useMemo(() => {
    if (isReviewMode) {
      // Only reveal screens - no questions
      const revealScreens: Screen[] = [];
      beatsToShow.forEach((beat, i) => {
        if (beat.kind === "guess") {
          revealScreens.push({ kind: "guess-r", beatIndex: i, beat });
        } else if (beat.kind === "observation") {
          revealScreens.push({ kind: "observation", beatIndex: i, beat });
        } else if (beat.kind === "reveal") {
          revealScreens.push({ kind: "reveal", beatIndex: i, beat, isClose: true });
        }
      });
      return revealScreens;
    }
    return buildScreens(beatsToShow, startFromBeat);
  }, [beatsToShow, startFromBeat, isReviewMode]);

  const totalBeats = WRAPPED_BEATS.length;

  // In review mode, start at the tapped beat's position in the reveal-only list
  const initialIndex = useMemo(() => {
    if (!isReviewMode) return 0;
    const idx = screens.findIndex((s) => s.beatIndex === reviewBeatIndex);
    return idx >= 0 ? idx : 0;
  }, [isReviewMode, screens, reviewBeatIndex]);

  const [index, setIndex] = useState(initialIndex);

  const advance = useCallback(() => {
    setIndex((i) => Math.min(i + 1, screens.length - 1));
  }, [screens.length]);

  // Compute how many total beats are revealed (previous + this session)
  const computeRevealed = useCallback(() => {
    if (isReviewMode) return startFromBeat; // review doesn't reveal new beats
    const revealedThisSession = screens
      .slice(0, index + 1)
      .filter((s) => s.kind !== "guess-q")
      .length;
    return startFromBeat + revealedThisSession;
  }, [screens, index, startFromBeat, isReviewMode]);

  const handleClose = useCallback(() => {
    onClose(computeRevealed());
  }, [onClose, computeRevealed]);

  const currentScreen = screens[index];
  const isClose = currentScreen?.kind === "reveal" || index === screens.length - 1;
  const isQuestion = currentScreen?.kind === "guess-q";

  // Background color - white for questions, palette color for reveals
  const revealPalette = CARD_PALETTES[currentScreen?.beatIndex % CARD_PALETTES.length];
  const bgColor = isQuestion
    ? BG_PRIMARY
    : (isDark ? revealPalette?.bgDark : revealPalette?.bg) ?? BG_PRIMARY;

  return (
    <div className="relative h-full w-full" style={{ backgroundColor: bgColor, overflow: "hidden", transition: `background-color ${DURATION}ms ${EASE}` }}>
      {/* Top chrome */}
      <div className="absolute top-0 left-0 w-full" style={{ zIndex: 2 }}>
        <StatusBar backgroundColor="transparent" />
        <div
          className="relative flex items-center"
          style={{ padding: "8px 12px 8px 12px", height: 64 }}
        >
          <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", zIndex: 1 }}>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="flex items-center justify-center rounded-full"
              style={{
                width: 48,
                height: 48,
                borderRadius: RADIUS_CIRCLE,
                backgroundColor: BG_GLASS,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: `1px solid ${OUTLINE_BOLD}`,
                boxShadow: ELEVATION_CARD,
                cursor: "pointer",
              }}
            >
              <CloseIcon />
            </button>
          </div>
          <div className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents: "none" }}>
            <ProgressDots total={totalBeats} currentBeat={currentScreen?.beatIndex ?? 0} />
          </div>
          {/* Share button - hidden on question screens */}
          {!isQuestion && (
            <div className="animate-share-pop" style={{ marginLeft: "auto", zIndex: 1 }}>
              <RoundButton ariaLabel="Share" onClick={() => {}}>
                <ShareIcon />
              </RoundButton>
            </div>
          )}
        </div>
      </div>

      {/* Screen stack - full height so the slide reveal spans edge-to-edge.
          Top chrome + bottom forward button float above via higher z-index. */}
      <div
        className="absolute inset-0"
        style={{
          overflow: "hidden",
        }}
      >
        {screens.map((screen, i) => (
          <div
            key={`${screen.kind}-${screen.beatIndex}-${i}`}
            className="absolute inset-0"
            style={{
              transform: `translateX(${(i - index) * 100}%)`,
              transition: `transform ${DURATION}ms ${EASE}`,
            }}
          >
            {Math.abs(i - index) <= 1 && renderScreen(screen, advance, handleClose, i === index, isReviewMode)}
          </div>
        ))}
      </div>

      {/* Bottom chrome - forward button (hidden on question screens) */}
      {!isQuestion && (
        <div
          className="absolute left-0 w-full flex items-center justify-end"
          style={{
            bottom: 20,
            zIndex: 2,
            padding: "8px 12px 8px 8px",
          }}
        >
          <RoundButton ariaLabel={isClose ? "Done" : "Next"} onClick={isClose ? handleClose : advance}>
            <ForwardIcon />
          </RoundButton>
        </div>
      )}

      {/* Gesture nav */}
      <div className="absolute bottom-0 left-0 w-full" style={{ zIndex: 1 }}>
        <GestureNav />
      </div>
    </div>
  );
}

// ── Screen renderer ─────────────────────────────────────────────

function renderScreen(screen: Screen, advance: () => void, close: () => void, isActive: boolean, instantQuip = false) {
  if (screen.kind === "guess-q") {
    return <GuessQuestionScreen beat={screen.beat} beatIndex={screen.beatIndex} onAnswer={advance} />;
  }
  if (screen.kind === "guess-r") {
    return (
      <CardRevealScreen
        beatId={screen.beat.id}
        beatIndex={screen.beatIndex}
        ryan={screen.beat.reveal.quip.ryan}
        isActive={isActive}
        instantQuip={instantQuip}
      />
    );
  }
  if (screen.kind === "observation") {
    return (
      <CardRevealScreen
        beatId={screen.beat.id}
        beatIndex={screen.beatIndex}
        ryan={screen.beat.quip.ryan}
        isActive={isActive}
        instantQuip={instantQuip}
      />
    );
  }
  return (
    <CardRevealScreen
      beatId={screen.beat.id}
      beatIndex={screen.beatIndex}
      ryan={screen.beat.quip.ryan}
      isActive={isActive}
      instantQuip={instantQuip}
    />
  );
}
