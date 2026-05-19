"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY,
  TEXT_TERTIARY,
  TEXT_SECONDARY,
  BG_PRIMARY,
  ALPHA_BLACK_05,
  ALPHA_BLACK_10,
  OUTLINE_SUBTLE,
  VALENTINO_500,
  ALPHA_WHITE_FF,
  SLATE_10,
} from "../lib/colors";
import { ELEVATION_CARD } from "../lib/elevation";
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
      className="flex items-center justify-center transition-transform active:scale-[0.95] bg-white"
      style={{
        width: 48,
        height: 48,
        borderRadius: RADIUS_CIRCLE,
        border: `1px solid ${OUTLINE_SUBTLE}`,
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
              backgroundColor: active || past ? TEXT_PRIMARY : ALPHA_BLACK_10,
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
const BLOB_POSITIONS = [
  { bottom: 60, right: -30 },
  { bottom: 120, right: -20 },
  { bottom: 40, right: 10 },
  { bottom: 90, right: -40 },
  { bottom: 150, right: -10 },
];

function CardBlob({ seed, color, size, animate = false }: { seed: number; color: string; size: number; animate?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<ReturnType<typeof createBlobAnimation> | null>(null);
  const pos = BLOB_POSITIONS[seed % BLOB_POSITIONS.length];

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

    const blobOptions = { seed, extraPoints: 6, randomness: 8, size };
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
        bottom: pos.bottom,
        right: pos.right,
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
  const palette = CARD_PALETTES[beatIndex % CARD_PALETTES.length];

  const handleSelect = (id: string) => {
    setSelected(id);
    window.setTimeout(onAnswer, 320);
  };

  return (
    <div
      className="h-full w-full flex flex-col"
      style={{ backgroundColor: BG_PRIMARY, padding: `${SPACE_L}px ${SPACE_L}px ${SPACE_M}px` }}
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
          }}
        >
          {beat.question}
        </p>
      </div>

      {/* Options - anchored to bottom */}
      <div style={{ display: "flex", flexDirection: "column", gap: SPACE_S, paddingBottom: SPACE_L }}>
        {beat.chips.map((chip) => {
          const isSelected = selected === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleSelect(chip.id)}
              className="w-full transition-colors active:scale-[0.99]"
              style={{
                ...typography.bodyNormal,
                color: isSelected ? BG_PRIMARY : TEXT_PRIMARY,
                backgroundColor: isSelected ? palette.text : BG_PRIMARY,
                border: `1px solid ${palette.text}`,
                borderRadius: RADIUS_PILL,
                padding: `14px ${SPACE_L}px`,
                textAlign: "center",
                cursor: "pointer",
                transition: "background-color 150ms ease, color 150ms ease, border-color 150ms ease",
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Card-style reveal screen (V3 - matches carousel cards) ──────

function RyanQuipBubble({ text, isActive, instant = false }: { text: string; isActive: boolean; instant?: boolean }) {
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
    }, 1000);

    return () => clearTimeout(showDelay);
  }, [isActive, text, instant]);

  if (!visible) return null;

  return (
    <div className="flex justify-start animate-chat-message-in">
      <div
        className="max-w-[75%] rounded-[16px] rounded-tl-lg"
        style={{ backgroundColor: BG_PRIMARY, padding: "12px 16px" }}
      >
        <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY, margin: 0 }}>
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
  if (!data) return null;
  const palette = CARD_PALETTES[beatIndex % CARD_PALETTES.length];
  const nSize = HERO_SIZE_EXPANDED;

  return (
    <div
      className="h-full w-full flex flex-col"
      style={{
        backgroundColor: palette.bg,
        padding: `${SPACE_L}px ${SPACE_L}px ${SPACE_M}px`,
        position: "relative",
        overflow: "hidden",
        justifyContent: "flex-end",
      }}
    >
      {/* Blob - unique per card, animates when active */}
      <CardBlob seed={beatIndex * 1000 + 42} color={palette.accent} size={240} animate={isActive} />

      {/* Spacer - pushes data to bottom, bubble sits above it */}
      <div style={{ flex: 1 }} />

      {/* Ryan quip - left-aligned chat bubble, above data stack */}
      <div style={{ position: "relative", zIndex: 1, marginBottom: SPACE_L }}>
        <RyanQuipBubble text={ryan} isActive={isActive} instant={instantQuip} />
      </div>

      {/* Content stack - bottom-anchored, same structure as small card */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <span style={{ ...typography.headerH4, color: palette.text, opacity: 0.6 }}>
          {data.labelAbove}
        </span>

        <div style={{ marginTop: SPACE_S }}>
          <span
            style={{
              fontFamily: BRICOLAGE,
              fontSize: nSize,
              fontWeight: 700,
              lineHeight: 1,
              color: palette.text,
            }}
          >
            {data.number}
          </span>
        </div>

        <span style={{ ...typography.headerH3, color: palette.text, opacity: 0.7, display: "block", marginTop: SPACE_S }}>
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
  const bgColor = isQuestion
    ? BG_PRIMARY
    : CARD_PALETTES[currentScreen?.beatIndex % CARD_PALETTES.length]?.bg ?? BG_PRIMARY;

  return (
    <div className="relative h-full w-full" style={{ backgroundColor: bgColor, overflow: "hidden", transition: `background-color ${DURATION}ms ${EASE}` }}>
      {/* Top chrome */}
      <div className="absolute top-0 left-0 w-full" style={{ zIndex: 2 }}>
        <StatusBar backgroundColor="transparent" />
        <div
          className="relative flex items-center"
          style={{ padding: "8px 12px 8px 8px", height: 64 }}
        >
          <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", zIndex: 1 }}>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="flex items-center justify-center rounded-full bg-white"
              style={{
                width: 48,
                height: 48,
                borderRadius: RADIUS_CIRCLE,
                border: `1px solid ${OUTLINE_SUBTLE}`,
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
            <div style={{ marginLeft: "auto", zIndex: 1 }}>
              <RoundButton ariaLabel="Share" onClick={() => {}}>
                <ShareIcon />
              </RoundButton>
            </div>
          )}
        </div>
      </div>

      {/* Screen stack */}
      <div
        className="absolute"
        style={{
          top: 108,
          left: 0,
          right: 0,
          bottom: 76,
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
