"use client";

import { useRef, useEffect, useState } from "react";
import { canvasPath as createBlobAnimation, wigglePreset } from "blobs/v2/animate";
import { typography } from "../lib/typography";
import { SPACE_S, SPACE_M, SPACE_L } from "../lib/spacing";
import { RADIUS_L } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";
import { useTheme } from "../lib/theme";
import { WRAPPED_BEATS, CARD_PALETTES, BEAT_DATA, type WrappedBeat } from "./fixtures/wrappedFixture";

const CARD_H = 300;
const CARD_W = 220;
const BRICOLAGE = "var(--font-bricolage), var(--font-rubik), system-ui, sans-serif";
const HERO_SIZE_SMALL = 40;
const CARD_SHADOW = ELEVATION_CARD;
const FLIP_DURATION = 600;
const FLIP_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

// ── Blob - only used on face-up cards ──────────────────────────

const SMALL_BLOB_POSITIONS = [
  { bottom: SPACE_M, right: -16 },
  { bottom: SPACE_M + 20, right: -10 },
  { bottom: SPACE_M - 4, right: 4 },
  { bottom: SPACE_M + 12, right: -20 },
  { bottom: SPACE_M + 30, right: -6 },
];

function CardBlob({ seed, color, size }: { seed: number; color: string; size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<ReturnType<typeof createBlobAnimation> | null>(null);
  const pos = SMALL_BLOB_POSITIONS[seed % SMALL_BLOB_POSITIONS.length];

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

    // Wiggle preset - continuous organic morphing
    wigglePreset(animation, blobOptions, canvasOptions, { speed: 2 });
    animation.play();

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
  }, [seed, color, size]);

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

// ── Face-up inner - revealed beat with data ─────────────────────

function FaceUpInner({ beat, index }: { beat: WrappedBeat; index: number }) {
  const data = BEAT_DATA[beat.id];
  const { mode } = useTheme();
  const isDark = mode === "dark";
  if (!data) return null;
  const p = CARD_PALETTES[index % CARD_PALETTES.length];
  // Dark mode uses a lifted (/400) tint of the same hue so the hero number + labels
  // clear ~3:1 on the brighter, more-saturated bgDark surface; light mode keeps /500.
  const textColor = isDark ? p.textDark : p.text;
  // Red's bgDark (#630E12) is the darkest jewel-tone; its labels at 0.9 composite to
  // 2.99:1 — fractionally under the 3:1 large-text threshold. Lift Red labels to full
  // opacity in dark mode (~3.35:1). The other 4 hues clear 3:1 at 0.9.
  const labelOpacityDark = p.bgDark === "#630E12" ? 1 : 0.9;

  return (
    <div
      className="flex flex-col text-left"
      style={{
        width: "100%",
        height: "100%",
        // FaceUpInner sits 4px tighter than RADIUS_L (24) so the revealed face reads a touch crisper.
        borderRadius: 20,
        background: isDark ? p.bgDark : p.bg,
        // +4 on the left and bottom for a touch more breathing room.
        padding: `${SPACE_M}px ${SPACE_M}px ${SPACE_M + 4}px ${SPACE_M + 4}px`,
        boxShadow: CARD_SHADOW,
        overflow: "hidden",
        position: "relative",
        justifyContent: "flex-end",
      }}
    >
      <CardBlob seed={index * 1000 + 42} color={p.accent} size={100} />

      <span style={{ ...typography.bodySmall, color: textColor, opacity: isDark ? labelOpacityDark : 0.6, position: "relative", zIndex: 1 }}>
        {data.labelAbove}
      </span>
      <span style={{ fontFamily: BRICOLAGE, fontSize: HERO_SIZE_SMALL, fontWeight: 700, lineHeight: 1, color: textColor, position: "relative", zIndex: 1, marginTop: SPACE_S }}>
        {data.number}
      </span>
      <span style={{ ...typography.buttonSmall, color: textColor, opacity: isDark ? labelOpacityDark : 0.7, position: "relative", zIndex: 1, marginTop: SPACE_S }}>
        {data.labelBelow}
      </span>
    </div>
  );
}

// ── Face-down inner - unrevealed, shows ? ───────────────────────

// Dense, seamless mystery-card "?" wallpaper tile — generated + synthesized to match the
// reference (big bold "?" + inverted "¿" + dots, varied size/rotation, edge-wrapped so it tiles
// with no seams). Rendered via the card's accent colour; &#191; is the inverted question mark.
const QM_TILE = 130;
const QM_PATTERN = `<text x="20" y="48" font-size="64" transform="rotate(-14 20 48)">?</text>
<text x="84" y="38" font-size="42" transform="rotate(11 84 38)">?</text>
<text x="56" y="94" font-size="72" transform="rotate(7 56 94)">?</text>
<text x="106" y="88" font-size="50" transform="rotate(-9 106 88)">?</text>
<text x="-24" y="88" font-size="50" transform="rotate(-9 -24 88)">?</text>
<text x="8" y="110" font-size="46" transform="rotate(16 8 110)">?</text>
<text x="138" y="110" font-size="46" transform="rotate(16 138 110)">?</text>
<text x="44" y="22" font-size="32" transform="rotate(13 44 22)">?</text>
<text x="44" y="152" font-size="32" transform="rotate(13 44 152)">?</text>
<text x="118" y="124" font-size="40" transform="rotate(-17 118 124)">?</text>
<text x="118" y="-6" font-size="40" transform="rotate(-17 118 -6)">?</text>
<text x="-12" y="124" font-size="40" transform="rotate(-17 -12 124)">?</text>
<text x="-12" y="-6" font-size="40" transform="rotate(-17 -12 -6)">?</text>
<text x="0" y="64" font-size="38" transform="rotate(9 0 64)">?</text>
<text x="130" y="64" font-size="38" transform="rotate(9 130 64)">?</text>
<text x="70" y="58" font-size="28" transform="rotate(-15 70 58)">&#191;</text>
<text x="34" y="126" font-size="36" transform="rotate(-7 34 126)">&#191;</text>
<text x="34" y="-4" font-size="36" transform="rotate(-7 34 -4)">&#191;</text>
<text x="86" y="114" font-size="26" transform="rotate(15 86 114)">&#191;</text>
<text x="124" y="60" font-size="30" transform="rotate(-12 124 60)">&#191;</text>
<text x="-6" y="60" font-size="30" transform="rotate(-12 -6 60)">&#191;</text>
<circle cx="50" cy="62" r="4"/>
<circle cx="96" cy="68" r="3.5"/>
<circle cx="18" cy="90" r="3.5"/>
<circle cx="118" cy="104" r="3"/>
<circle cx="64" cy="24" r="3"/>`;

function FaceDownInner({ index }: { index: number }) {
  const { mode } = useTheme();
  const isDark = mode === "dark";
  const p = CARD_PALETTES[index % CARD_PALETTES.length];
  const ink = p.text;
  // Per-card mesh gradient (both modes) — a soft multi-blob blend in the card's own hue.
  const mesh = isDark
    ? `radial-gradient(circle at 16% 20%, color-mix(in srgb, ${p.textDark} 28%, transparent) 0%, transparent 55%), radial-gradient(circle at 86% 14%, color-mix(in srgb, ${p.text} 22%, transparent) 0%, transparent 50%), radial-gradient(circle at 74% 88%, color-mix(in srgb, #000000 32%, ${p.bgDark}) 0%, transparent 60%), radial-gradient(circle at 14% 84%, color-mix(in srgb, ${p.textDark} 18%, transparent) 0%, transparent 55%), ${p.bgDark}`
    : `radial-gradient(circle at 16% 20%, color-mix(in srgb, #ffffff 60%, ${p.bg}) 0%, transparent 55%), radial-gradient(circle at 86% 14%, color-mix(in srgb, ${p.text} 26%, transparent) 0%, transparent 50%), radial-gradient(circle at 74% 88%, color-mix(in srgb, ${p.text} 16%, transparent) 0%, transparent 58%), radial-gradient(circle at 12% 86%, color-mix(in srgb, #ffffff 42%, ${p.bg}) 0%, transparent 55%), ${p.bg}`;

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        width: "100%",
        height: "100%",
        borderRadius: RADIUS_L,
        background: mesh,
        padding: SPACE_M,
        boxShadow: CARD_SHADOW,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Dense, organic "?" wallpaper — big marks, "?" + inverted "¿" + dots at varied size and
          rotation, tiled in the card's accent colour (classic mystery-card pattern). */}
      <svg aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: isDark ? 0.3 : 0.22 }}>
        <defs>
          <pattern id={`qm-${index}`} width={QM_TILE} height={QM_TILE} patternUnits="userSpaceOnUse">
            <g fill={ink} fontFamily={BRICOLAGE} fontWeight={700} dangerouslySetInnerHTML={{ __html: QM_PATTERN }} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#qm-${index})`} />
      </svg>
    </div>
  );
}

// ── Flip card - 3D flip transition from face-down to face-up ────

function FlipCard({
  beat,
  index,
  isRevealed,
  shouldAnimate,
  onTap,
}: {
  beat: WrappedBeat;
  index: number;
  isRevealed: boolean;
  shouldAnimate: boolean;
  onTap?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="shrink-0 transition-transform active:scale-[0.97]"
      style={{
        width: CARD_W,
        height: CARD_H,
        perspective: 1200,
        border: "none",
        background: "none",
        padding: 0,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transition: shouldAnimate ? `transform ${FLIP_DURATION}ms ${FLIP_EASE}` : "none",
          transform: isRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Back face - ? card (visible when not flipped) */}
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}>
          <FaceDownInner index={index} />
        </div>
        {/* Front face - data card (visible when flipped) */}
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <FaceUpInner beat={beat} index={index} />
        </div>
      </div>
    </button>
  );
}

// ── Carousel ────────────────────────────────────────────────────

export default function WrappedCard({
  revealedCount,
  onOpen,
}: {
  revealedCount: number;
  onOpen: (beatIndex: number) => void;
}) {
  // Track previous revealed count to know which cards should animate
  const prevCountRef = useRef(revealedCount);
  const [animatingFrom, setAnimatingFrom] = useState(revealedCount);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (revealedCount !== prevCountRef.current) {
      setAnimatingFrom(prevCountRef.current);
      prevCountRef.current = revealedCount;

      // After flip animation, scroll to first unrevealed card
      if (revealedCount < WRAPPED_BEATS.length) {
        window.setTimeout(() => {
          const target = cardRefs.current[revealedCount];
          const container = scrollRef.current;
          if (target && container) {
            const containerRect = container.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const targetLeftInScroller = targetRect.left - containerRect.left + container.scrollLeft;
            const scrollTo = targetLeftInScroller - (containerRect.width / 2) + (targetRect.width / 2);
            container.scrollTo({ left: Math.max(0, scrollTo), behavior: "smooth" });
          }
        }, FLIP_DURATION + 100);
      }
    }
  }, [revealedCount]);

  return (
    <div
      ref={scrollRef}
      className="flex overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{
        gap: SPACE_M,
        marginLeft: -SPACE_L,
        marginRight: -SPACE_L,
        paddingLeft: SPACE_L,
        paddingRight: SPACE_L,
        paddingTop: 32,
        paddingBottom: 32,
        marginTop: -32,
        marginBottom: -32,
      }}
    >
      {WRAPPED_BEATS.map((beat, i) => {
        const isRevealed = i < revealedCount;
        // Animate only cards that just transitioned from unrevealed to revealed
        const shouldAnimate = isRevealed && i >= animatingFrom;

        return (
          <div key={beat.id} ref={(el) => { cardRefs.current[i] = el; }} className="shrink-0">
          <FlipCard
            beat={beat}
            index={i}
            isRevealed={isRevealed}
            shouldAnimate={shouldAnimate}
            onTap={() => onOpen(i)}
          />
          </div>
        );
      })}
    </div>
  );
}
