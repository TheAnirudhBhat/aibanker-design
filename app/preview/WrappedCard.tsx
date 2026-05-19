"use client";

import { useRef, useEffect, useState } from "react";
import * as blobs2 from "blobs/v2";
import { typography } from "../lib/typography";
import { SPACE_S, SPACE_M, SPACE_L } from "../lib/spacing";
import { RADIUS_L } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";
import { WRAPPED_BEATS, CARD_PALETTES, BEAT_DATA, type WrappedBeat } from "./fixtures/wrappedFixture";

const CARD_H = 360;
const CARD_W = 240;
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
  const path = blobs2.svgPath({ seed, extraPoints: 6, randomness: 8, size });
  const pos = SMALL_BLOB_POSITIONS[seed % SMALL_BLOB_POSITIONS.length];
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: "absolute", bottom: pos.bottom, right: pos.right }}
    >
      <path d={path} fill={color} />
    </svg>
  );
}

// ── Face-up inner - revealed beat with data ─────────────────────

function FaceUpInner({ beat, index }: { beat: WrappedBeat; index: number }) {
  const data = BEAT_DATA[beat.id];
  if (!data) return null;
  const p = CARD_PALETTES[index % CARD_PALETTES.length];

  return (
    <div
      className="flex flex-col text-left"
      style={{
        width: "100%",
        height: "100%",
        borderRadius: RADIUS_L,
        background: p.bg,
        padding: SPACE_M,
        boxShadow: CARD_SHADOW,
        overflow: "hidden",
        position: "relative",
        justifyContent: "flex-end",
      }}
    >
      <CardBlob seed={index * 1000 + 42} color={p.accent} size={120} />

      <span style={{ ...typography.bodySmall, color: p.text, opacity: 0.6, position: "relative", zIndex: 1 }}>
        {data.labelAbove}
      </span>
      <span style={{ fontFamily: BRICOLAGE, fontSize: HERO_SIZE_SMALL, fontWeight: 700, lineHeight: 1, color: p.text, position: "relative", zIndex: 1, marginTop: SPACE_S }}>
        {data.number}
      </span>
      <span style={{ ...typography.buttonSmall, color: p.text, opacity: 0.7, position: "relative", zIndex: 1, marginTop: SPACE_S }}>
        {data.labelBelow}
      </span>
    </div>
  );
}

// ── Face-down inner - unrevealed, shows ? ───────────────────────

function FaceDownInner({ index }: { index: number }) {
  const p = CARD_PALETTES[index % CARD_PALETTES.length];

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        width: "100%",
        height: "100%",
        borderRadius: RADIUS_L,
        background: p.bg,
        padding: SPACE_M,
        boxShadow: CARD_SHADOW,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <span
        style={{
          fontFamily: BRICOLAGE,
          fontSize: 96,
          fontWeight: 700,
          lineHeight: 1,
          color: p.text,
          opacity: 0.2,
        }}
      >
        ?
      </span>
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
