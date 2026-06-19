"use client";

import { useRef, useEffect, useState } from "react";
import { canvasPath as createBlobAnimation, wigglePreset } from "blobs/v2/animate";
import { typography } from "../lib/typography";
import { SPACE_S, SPACE_M, SPACE_L } from "../lib/spacing";
import { RADIUS_L, RADIUS_M } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";
import { useTheme } from "../lib/theme";
import { WRAPPED_BEATS, CARD_PALETTES, BEAT_DATA, type WrappedBeat } from "./fixtures/wrappedFixture";
import { QM_MASK_URL } from "./fixtures/qmPatternMask";

const CARD_H = 300;
const CARD_W = 220;
const BRICOLAGE = "var(--font-bricolage), var(--font-rubik), system-ui, sans-serif";
const HERO_SIZE_SMALL = 40;
const CARD_SHADOW = ELEVATION_CARD;
const FLIP_DURATION = 600;
const FLIP_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

// ── Blob - only used on face-up cards ──────────────────────────

function CardBlob({ seed, color, size }: { seed: number; color: string; size: number }) {
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

    // A pinned timestamp provider keeps the blob completely still (the clock never advances), while
    // letting us choose WHICH frame of the wiggle it freezes on.
    let frozenAt = 0;
    const animation = createBlobAnimation(() => frozenAt);
    animRef.current = animation;

    // Static blobs read better with MORE shape complexity (no motion to exaggerate): a higher
    // randomness makes each frozen card an interesting, irregular blob rather than a near-circle.
    const blobOptions = { seed, extraPoints: 14, randomness: 4, size };
    const canvasOptions = { offsetX: 0, offsetY: 0 };

    // Static on the small cards — no wiggle (continuous motion is reserved for the full reveal).
    // But each card freezes at a DIFFERENT point in the wiggle so the five read as distinct, not
    // identical: schedule the wiggle from t=0, then pin the clock at a per-card offset and paint
    // one frame. Because frozenAt never changes again, the blob stays put at that stopping point.
    wigglePreset(animation, blobOptions, canvasOptions, { speed: 2 });
    animation.play();
    frozenAt = 500 + Math.floor(seed / 1000) * 1300; // per-card stopping point (ms into the wiggle)

    let rafId = 0;
    rafId = requestAnimationFrame(() => {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = color;
      ctx.fill(animation.renderFrame());
    });

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
        // Oversized + centred so it spans edge-to-edge, pulled up ~half (plus 68px so it doesn't
        // sit too low on the small card) so only the lower curve of the (static) blob shows.
        // minWidth: 100% keeps it spanning the full card width.
        top: -size * 0.5 - 68,
        left: "50%",
        transform: "translateX(-50%)",
        minWidth: "100%",
        // Stretched ~1.8× wider than tall so the blob ALWAYS bleeds past both card edges, even when
        // the frozen wiggle phase leans the shape to one side (a centred square canvas can gap).
        width: size * 1.8,
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
      {/* size >> card width (220) so the blob always bleeds edge-to-edge, even when the frozen
          wiggle phase leans the shape off-centre. minWidth:100% (in CardBlob) backs it up. */}
      <CardBlob seed={index * 1000 + 42} color={p.accent} size={600} />

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

function FaceDownInner({ index }: { index: number }) {
  const { mode } = useTheme();
  const isDark = mode === "dark";
  const p = CARD_PALETTES[index % CARD_PALETTES.length];
  const ink = p.text;
  // Per-card mesh gradient (both modes) — a soft multi-blob blend in the card's own hue.
  const mesh = isDark
    ? `radial-gradient(120% 115% at 20% 16%, color-mix(in srgb, ${p.textDark} 30%, transparent) 0%, transparent 55%), radial-gradient(120% 120% at 86% 88%, color-mix(in srgb, ${p.text} 16%, transparent) 0%, transparent 58%), radial-gradient(135% 130% at 86% 12%, color-mix(in srgb, ${p.bgDark} 76%, #ffffff) 0%, transparent 58%), ${p.bgDark}`
    : `radial-gradient(120% 115% at 20% 16%, color-mix(in srgb, ${p.text} 22%, transparent) 0%, transparent 55%), radial-gradient(120% 120% at 86% 90%, color-mix(in srgb, ${p.text} 12%, transparent) 0%, transparent 58%), radial-gradient(135% 130% at 88% 12%, color-mix(in srgb, #ffffff 38%, ${p.bg}) 0%, transparent 60%), ${p.bg}`;

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
      {/* Inset "card-back" frame — a plain margin of card colour + a thin border around the
          patterned panel reads as a real (flippable) card back, the way a playing-card back does,
          instead of a full-bleed swatch of texture. */}
      <div
        style={{
          position: "absolute",
          inset: 10,
          borderRadius: RADIUS_M,
          border: `1.5px solid color-mix(in srgb, ${ink} ${isDark ? "36%" : "26%"}, transparent)`,
          overflow: "hidden",
        }}
      >
        {/* Dense, interlocking "?" wallpaper — the user's reference pattern itself, as an alpha MASK
            filled with the card's accent colour. Arrangement matches the reference exactly
            (full-rotation, packed, zero overlap); hue is per-card. Tiled with a per-card offset. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: ink,
            opacity: isDark ? 0.42 : 0.28,
            WebkitMaskImage: `url(${QM_MASK_URL})`,
            maskImage: `url(${QM_MASK_URL})`,
            WebkitMaskRepeat: "repeat",
            maskRepeat: "repeat",
            WebkitMaskSize: "150px",
            maskSize: "150px",
            WebkitMaskPosition: `${index * 41}px ${index * 27}px`,
            maskPosition: `${index * 41}px ${index * 27}px`,
          }}
        />
      </div>
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
