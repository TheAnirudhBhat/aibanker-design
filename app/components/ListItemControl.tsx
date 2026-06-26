"use client";

import type { ReactNode } from "react";
import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  VALENTINO_500,
  ALPHA_WHITE_FF,
  BG_CARD,
  BG_SECONDARY,
  OUTLINE_SUBTLE,
  OUTLINE_BOLD,
} from "../lib/colors";
import { RADIUS_M } from "../lib/radii";

// DLS 2.0 - List item/Control (Figma node 166:2751)
// All-purpose selection list item: title + optional subtext + trailing radio/checkbox.
// `card` wraps the row as a bordered card with an optional `leading` avatar slot
// (Figma node 648:40851 "List item / Standard").

export type ListItemControlProps = {
  title: string;
  titleTrailing?: ReactNode;
  subtext?: string;
  subtextTone?: "secondary" | "tertiary";
  trailing?: ReactNode; // far-right accessory; when set it replaces the radio/checkbox control
  kind?: "radio" | "checkbox" | "none";
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  leading?: ReactNode;
  card?: boolean;
};

export default function ListItemControl({
  title,
  titleTrailing,
  subtext,
  subtextTone = "secondary",
  trailing,
  kind = "radio",
  selected,
  disabled = false,
  onSelect,
  leading,
  card = false,
}: ListItemControlProps) {
  const cardStyle = card
    ? {
        // Lighter selected fill — a soft valentino tint over the lifted surface
        // (paler than EXT_BG_SUBTLE_MAIN in light, and lighter than #260227 in dark
        // while still dark enough for white text).
        backgroundColor: selected ? `color-mix(in srgb, ${VALENTINO_500} 8%, ${BG_SECONDARY})` : BG_CARD,
        border: `2px solid ${selected ? VALENTINO_500 : OUTLINE_SUBTLE}`,
        borderRadius: RADIUS_M,
      }
    : {};
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "16px",
        background: "transparent",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "left",
        opacity: disabled ? 0.5 : 1,
        ...cardStyle,
      }}
    >
      {leading}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY }}>
            {title}
          </span>
          {titleTrailing}
        </div>
        {subtext && (
          <p style={{ ...typography.caption, color: subtextTone === "tertiary" ? TEXT_TERTIARY : TEXT_SECONDARY, margin: 0 }}>
            {subtext}
          </p>
        )}
      </div>

      {trailing ? (
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{trailing}</div>
      ) : kind !== "none" && (
      <div
        style={{
          width: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            transition: "transform 150ms ease",
            transform: selected ? "scale(1)" : "scale(0.9)",
          }}
        >
          {kind === "radio" ? (
            selected ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill={VALENTINO_500} />
                <circle cx="12" cy="12" r="4" fill={ALPHA_WHITE_FF} />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9.5" stroke={OUTLINE_BOLD} strokeWidth="1" />
              </svg>
            )
          ) : selected ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="4" fill={VALENTINO_500} />
              <path
                d="M7 12l3.5 3.5L17 9"
                stroke={ALPHA_WHITE_FF}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="2.5" y="2.5" width="19" height="19" rx="3.5" stroke={OUTLINE_BOLD} strokeWidth="1" />
            </svg>
          )}
        </div>
      </div>
      )}
    </button>
  );
}
