"use client";

import type { CSSProperties, ReactNode } from "react";
import { typography } from "../lib/typography";
import { BG_PRIMARY, TEXT_SECONDARY, ALPHA_BLACK_30, TEXT_PRIMARY, OUTLINE_SUBTLE } from "../lib/colors";
import { RADIUS_CIRCLE } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";
import PersonaToggle, { type Persona } from "./PersonaToggle";

export const STATUS_BAR_HEIGHT = 44; // DLS: 8px top padding + 36px bar
export const BOTTOM_INSET = 20; // gesture nav: 8px + 4px bar + 8px

// ── Status bar (decorative) ─────────────────────────────────────────────────

export function StatusBar({ backgroundColor = BG_PRIMARY, time = "9:41" }: { backgroundColor?: string; time?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        backgroundColor,
        paddingTop: 8,
        height: STATUS_BAR_HEIGHT,
        position: "relative",
      }}
    >
      <div style={{ height: 36, position: "relative" }}>
        {/* Time — Figma: left 55px, translateX(-50%), top calc(50% - 8.33px) */}
        <p
          style={{
            position: "absolute",
            left: 55,
            top: "calc(50% - 8.33px)",
            transform: "translateX(-50%)",
            fontFamily: "'SF Pro', -apple-system, sans-serif",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: -0.4,
            color: TEXT_SECONDARY,
            whiteSpace: "nowrap",
            margin: 0,
          }}
        >
          {time}
        </p>

        {/* Status icons — Figma: right 30px, vertically centered, gap 6.436px */}
        <div
          style={{
            position: "absolute",
            right: 30,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 6.436,
          }}
        >
          {/* Cellular — 16.976×10.829 */}
          <img
            alt=""
            src="/status-cellular.svg"
            style={{ width: 16.976, height: 10.829, display: "block" }}
          />
          {/* Wi-Fi — 14.927×10.829 */}
          <img
            alt=""
            src="/status-wifi.svg"
            style={{ width: 14.927, height: 10.829, display: "block" }}
          />
          {/* Battery — 27.333×13.667 with fill overlay */}
          <div style={{ width: 27.333, height: 13.667, position: "relative" }}>
            <img
              alt=""
              src="/status-battery.svg"
              style={{ position: "absolute", width: "100%", height: "100%", display: "block" }}
            />
            <div style={{ position: "absolute", inset: "0 44.91% 0 0" }}>
              <img
                alt=""
                src="/status-battery-fill.svg"
                style={{ position: "absolute", width: "100%", height: "100%", display: "block" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Gesture nav indicator ───────────────────────────────────────────────────

export function GestureNav({ backgroundColor = "transparent" }: { backgroundColor?: string }) {
  return (
    <div
      className="shrink-0 flex items-center justify-center"
      style={{ backgroundColor, paddingTop: 8, paddingBottom: 8 }}
      aria-hidden="true"
    >
      <div
        style={{
          width: 128,
          height: 4,
          backgroundColor: ALPHA_BLACK_30,
          borderRadius: 40,
        }}
      />
    </div>
  );
}

// ── Nav button ──────────────────────────────────────────────────────────────

type NavButtonProps = {
  kind: "back" | "close";
  onClick?: () => void;
  ariaLabel?: string;
};

export function NavButton({ kind, onClick, ariaLabel }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? (kind === "back" ? "Back" : "Close")}
      style={{
        width: 48,
        height: 48,
        border: "none",
        background: "transparent",
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: 12,
      }}
    >
      {kind === "back" ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 6L9 12L15 18" stroke={TEXT_SECONDARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke={TEXT_SECONDARY} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

// ── App bar (Standard / L1+) ────────────────────────────────────────────────

type AppBarProps = {
  leading?: ReactNode;
  title?: ReactNode;
  trailing?: ReactNode;
  shadow?: boolean;
  backgroundColor?: string;
  hideStatusBar?: boolean;
};

export function AppBar({
  leading,
  title,
  trailing,
  shadow = false,
  backgroundColor = BG_PRIMARY,
  hideStatusBar = false,
}: AppBarProps) {
  return (
    <div
      className="shrink-0"
      style={{
        backgroundColor,
        boxShadow: shadow ? "0px 6px 8px rgba(0,0,0,0.05)" : "none",
      }}
    >
      {/* Status bar chrome */}
      {!hideStatusBar && <StatusBar backgroundColor={backgroundColor} />}

      {/* App bar content — title absolutely centered on bar width, leading/trailing on sides */}
      <div
        style={{
          position: "relative",
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 8,
          paddingRight: 8,
          height: 64,
        }}
      >
        {/* Title — absolutely centered on the bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 56,
            right: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: TEXT_PRIMARY,
              textAlign: "center",
              ...typography.headerH4,
            }}
          >
            {title ?? null}
          </div>
        </div>

        {/* Leading slot — left edge */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            height: 48,
            display: "flex",
            alignItems: "center",
          }}
        >
          {leading}
        </div>

        {/* Trailing slot — right edge */}
        {trailing ? (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              height: 48,
              display: "flex",
              alignItems: "center",
            }}
          >
            {trailing}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Footer inset ────────────────────────────────────────────────────────────

type FooterInsetProps = {
  children?: ReactNode;
  backgroundColor?: string;
  paddingX?: number;
  paddingTop?: number;
  minBottomPadding?: number;
  boxShadow?: string;
  style?: CSSProperties;
};

export function FooterInset({
  children,
  backgroundColor = BG_PRIMARY,
  paddingX = 24,
  paddingTop = 8,
  minBottomPadding = 12,
  boxShadow,
  style,
}: FooterInsetProps) {
  return (
    <div
      className="shrink-0"
      style={{
        backgroundColor,
        paddingLeft: paddingX,
        paddingRight: paddingX,
        paddingTop,
        paddingBottom: minBottomPadding,
        boxShadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Chat app bar (transparent overlay) ──────────────────────────────────────

export const CHAT_APP_BAR_HEIGHT = STATUS_BAR_HEIGHT + 64; // 44 status + 8 top pad + 48 button + 8 bottom pad

type ChatAppBarProps = {
  variant: "firstTime" | "degen";
  navKind?: "back" | "close";
  onNav?: () => void;
  voice: Persona;
  onVoiceChange?: (v: Persona) => void; // required for "degen"
  trailing?: ReactNode;
  hideStatusBar?: boolean;
  absolute?: boolean; // when true, positions absolutely over scroll content
  reserveSpace?: boolean; // when true (with absolute), renders a sibling spacer of bar height
};

export function ChatAppBar({
  variant,
  navKind = "close",
  onNav,
  voice,
  onVoiceChange,
  trailing,
  hideStatusBar = false,
  absolute = false,
  reserveSpace = false,
}: ChatAppBarProps) {
  const navIcon =
    navKind === "back" ? (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M15 6L9 12L15 18" stroke={TEXT_PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6l12 12" stroke={TEXT_PRIMARY} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );

  const bar = (
    <div style={{ pointerEvents: absolute ? "auto" : undefined }}>
      {!hideStatusBar && <StatusBar backgroundColor="transparent" />}
      <div
        style={{
          position: "relative",
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 8,
          paddingRight: 8,
          height: 64,
        }}
      >
        {/* Center band — title or PersonaToggle, absolutely centered on bar width */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 56,
            right: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: variant === "degen" ? "auto" : "none",
          }}
        >
          {variant === "degen" && onVoiceChange ? (
            <PersonaToggle active={voice} onToggle={onVoiceChange} />
          ) : (
            <div
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: TEXT_PRIMARY,
                textAlign: "center",
                ...typography.headerH4,
              }}
            >
              {voice === "byron" ? "Byron" : "Ryan"}
            </div>
          )}
        </div>

        {/* Leading — circular white container */}
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          <button
            type="button"
            onClick={onNav}
            aria-label={navKind === "back" ? "Back" : "Close"}
            className="flex items-center justify-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: RADIUS_CIRCLE,
              backgroundColor: BG_PRIMARY,
              border: `1px solid ${OUTLINE_SUBTLE}`,
              boxShadow: ELEVATION_CARD,
              cursor: onNav ? "pointer" : "default",
              padding: 0,
            }}
          >
            {navIcon}
          </button>
        </div>

        {/* Trailing — 48x48 slot reserved so center stays centered */}
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            minWidth: 48,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          {trailing}
        </div>
      </div>
    </div>
  );

  if (absolute) {
    return (
      <>
        <div className="absolute top-0 left-0 right-0 z-10" style={{ pointerEvents: "none" }}>
          {bar}
        </div>
        {reserveSpace && (
          <div style={{ height: CHAT_APP_BAR_HEIGHT, flexShrink: 0 }} aria-hidden="true" />
        )}
      </>
    );
  }

  return <div className="w-full shrink-0">{bar}</div>;
}
