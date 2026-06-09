"use client";

/**
 * iOS-style keyboard mock from DLS 2.0 Figma (node 276:11525).
 * Purely visual - not functional. Used in preview simulations
 * to show realistic vertical space usage.
 */

import { ALPHA_BLACK_40, ALPHA_BLACK_60, ALPHA_WHITE_90, SLATE_500, TEXT_TERTIARY } from "../lib/colors";

const ROW_1 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
const ROW_2 = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
const ROW_3 = ["z", "x", "c", "v", "b", "n", "m"];

// iOS keyboard render: frosted-glass key surfaces stay light in both modes
// (on-color alpha primitives), so the mock matches the real OS keyboard.
const KEY_BG = ALPHA_WHITE_90;
const KEY_COLOR = ALPHA_BLACK_60;
const FONT_LETTER = "'SF Compact', 'SF Pro', system-ui, sans-serif";
const FONT_UI = "'SF Pro', system-ui, sans-serif";

function LetterKey({ letter }: { letter: string }) {
  return (
    <div
      style={{
        flex: "1 0 0",
        height: 40,
        borderRadius: 5,
        backgroundColor: KEY_BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <span
        style={{
          fontFamily: FONT_LETTER,
          fontWeight: 458,
          fontSize: 23,
          color: KEY_COLOR,
          textTransform: "lowercase",
          lineHeight: "normal",
        }}
      >
        {letter}
      </span>
    </div>
  );
}

function SecondaryKey({ width, children, opacity }: { width: number; children: React.ReactNode; opacity?: number }) {
  return (
    <div
      style={{
        width,
        height: 40,
        borderRadius: 8.5,
        backgroundColor: KEY_BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        opacity: opacity ?? 1,
      }}
    >
      {children}
    </div>
  );
}

export default function MockKeyboard({ visible }: { visible: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        border: "1px solid rgba(255,255,255,0.7)",
        borderBottom: "none",
        overflow: "hidden",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 250ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Frosted glass background */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(218,218,218,0.75)",
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
          pointerEvents: "none",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          boxShadow: "inset 0px 1px 2px 0px white",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          paddingTop: 8,
          paddingLeft: 4,
          paddingRight: 4,
          paddingBottom: 80,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Key rows */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            paddingTop: 8,
            alignItems: "center",
          }}
        >
          {/* Row 1: q-p */}
          <div style={{ display: "flex", gap: 6, height: 40, width: "100%" }}>
            {ROW_1.map((k) => <LetterKey key={k} letter={k} />)}
          </div>

          {/* Row 2: a-l (indented 16px) */}
          <div style={{ display: "flex", gap: 6, height: 40, width: "100%", padding: "0 16px" }}>
            {ROW_2.map((k) => <LetterKey key={k} letter={k} />)}
          </div>

          {/* Row 3: shift + z-m + backspace */}
          <div style={{ display: "flex", gap: 10, height: 40, width: "100%", alignItems: "center" }}>
            {/* Shift */}
            <SecondaryKey width={42}>
              <span style={{ fontFamily: FONT_UI, fontWeight: 510, fontSize: 19, color: KEY_COLOR, lineHeight: "normal" }}>
                ⇧
              </span>
            </SecondaryKey>

            {/* Letter keys */}
            <div style={{ flex: "1 0 0", display: "flex", gap: 6, height: 40 }}>
              {ROW_3.map((k) => <LetterKey key={k} letter={k} />)}
            </div>

            {/* Backspace */}
            <SecondaryKey width={42}>
              <span style={{ fontFamily: FONT_UI, fontWeight: 510, fontSize: 17, color: KEY_COLOR, lineHeight: "normal" }}>
                ⌫
              </span>
            </SecondaryKey>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ height: 10, width: "100%" }} />

        {/* Row 4: 123 + space + return */}
        <div style={{ display: "flex", gap: 6, height: 40, width: "100%" }}>
          <SecondaryKey width={91}>
            <span style={{ fontFamily: FONT_UI, fontWeight: 510, fontSize: 16, color: KEY_COLOR, letterSpacing: -0.32, lineHeight: "normal" }}>
              123
            </span>
          </SecondaryKey>

          {/* Space */}
          <div
            style={{
              flex: "1 0 0",
              height: 40,
              borderRadius: 8.5,
              backgroundColor: KEY_BG,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontFamily: FONT_UI, fontWeight: 400, fontSize: 19, color: SLATE_500, lineHeight: "normal" }}>
              space
            </span>
          </div>

          {/* Return */}
          <SecondaryKey width={91} opacity={0.5}>
            <span style={{ fontFamily: FONT_UI, fontWeight: 400, fontSize: 19, color: ALPHA_BLACK_40, lineHeight: "normal" }}>
              return
            </span>
          </SecondaryKey>
        </div>

        {/* Emoji icon */}
        <div style={{ position: "absolute", bottom: 26, left: 28, fontSize: 27, lineHeight: "normal" }}>
          😊
        </div>

        {/* Mic icon */}
        <div style={{ position: "absolute", bottom: 26, right: 28, fontSize: 27, color: TEXT_TERTIARY, lineHeight: "normal" }}>
          🎙
        </div>

        {/* Gesture indicator */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: "50%",
            transform: "translateX(-50%)",
            width: 128,
            height: 4,
            borderRadius: 40,
            backgroundColor: ALPHA_BLACK_40,
          }}
        />
      </div>
    </div>
  );
}
