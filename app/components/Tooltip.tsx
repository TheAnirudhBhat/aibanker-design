"use client";

import type { CSSProperties, ReactNode } from "react";
import { typography } from "../lib/typography";
import { ALPHA_BLACK_05, EXT_BG_BOLD_REVERSE, EXT_TEXT_REVERSE } from "../lib/colors";
import { RADIUS_S } from "../lib/radii";
import { SPACE_XS, SPACE_S } from "../lib/spacing";

// DLS 2.0 Tooltip — Figma node 352:162 (file ncGqxiE6wUOqgOURwHx6Hp)
// Black 32px-tall body, 8px pad, 8px radius, caption text, 12×6 pointer
// inset 12px from the relevant body edge.

export type TooltipOrientation =
  | "top-left"
  | "top"
  | "top-right"
  | "bottom-left"
  | "bottom"
  | "bottom-right";

type Props = {
  text: string;
  orientation?: TooltipOrientation;
  className?: string;
  style?: CSSProperties;
  /** When set, the body may wrap to multiple lines (capped at this px width) instead of the
   *  single-line 32px default — for longer explanatory copy that would otherwise run off-screen. */
  maxWidth?: number;
};

const POINTER_W = 12;
const POINTER_H = 6;

function PointerUp() {
  return (
    <svg width={POINTER_W} height={POINTER_H} viewBox="0 0 12 6" fill="none" style={{ display: "block" }}>
      <path d="M6 0L12 6H0L6 0Z" fill={EXT_BG_BOLD_REVERSE} />
    </svg>
  );
}

function PointerDown() {
  return (
    <svg width={POINTER_W} height={POINTER_H} viewBox="0 0 12 6" fill="none" style={{ display: "block" }}>
      <path d="M6 6L0 0H12L6 6Z" fill={EXT_BG_BOLD_REVERSE} />
    </svg>
  );
}

export default function Tooltip({ text, orientation = "top", className, style, maxWidth }: Props) {
  const isTop = orientation.startsWith("top");
  const isLeft = orientation.endsWith("-left");
  const isRight = orientation.endsWith("-right");

  const align: "flex-start" | "center" | "flex-end" =
    isLeft ? "flex-start" : isRight ? "flex-end" : "center";

  const pointerFrame: ReactNode = (
    <div
      style={{
        width: "100%",
        paddingLeft: SPACE_S,
        paddingRight: SPACE_S,
        display: "flex",
        justifyContent: align,
      }}
    >
      {isTop ? <PointerUp /> : <PointerDown />}
    </div>
  );

  const body: ReactNode = (
    <div
      style={{
        backgroundColor: EXT_BG_BOLD_REVERSE,
        // Single-line default keeps the 32px DLS body; a maxWidth lets long copy wrap to 2+ lines.
        height: maxWidth ? undefined : 32,
        minHeight: 32,
        maxWidth,
        padding: maxWidth ? `${SPACE_XS}px ${SPACE_S}px` : SPACE_XS,
        borderRadius: RADIUS_S,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          ...typography.caption,
          color: EXT_TEXT_REVERSE,
          whiteSpace: maxWidth ? "normal" : "nowrap",
          textAlign: "center",
        }}
      >
        {text}
      </span>
    </div>
  );

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: align,
        filter: `drop-shadow(0 2px 16px ${ALPHA_BLACK_05})`,
        ...style,
      }}
    >
      {isTop ? (
        <>
          {pointerFrame}
          {body}
        </>
      ) : (
        <>
          {body}
          {pointerFrame}
        </>
      )}
    </div>
  );
}
