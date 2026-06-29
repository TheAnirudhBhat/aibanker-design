"use client";

import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { typography } from "../lib/typography";
import { BG_PRIMARY, TEXT_SECONDARY, TEXT_PRIMARY, BG_CARD, BG_GLASS, OUTLINE_BOLD } from "../lib/colors";
import { RADIUS_CIRCLE } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";
import PersonaToggle, { type Persona } from "./PersonaToggle";

export const STATUS_BAR_HEIGHT = 44; // DLS: 8px top padding + 36px bar
export const BOTTOM_INSET = 20; // gesture nav: 8px + 4px bar + 8px

// ── Hoisted-chrome suppression ───────────────────────────────────────────────
// When a screen stack hoists a single fixed StatusBar + GestureNav above itself,
// the per-screen instances should reserve their layout space but paint nothing,
// so the fixed bars don't visibly slide in with each screen transition.
const ChromeSuppressContext = createContext(false);

export function ChromeSuppressProvider({ suppress, children }: { suppress: boolean; children: ReactNode }) {
  return <ChromeSuppressContext.Provider value={suppress}>{children}</ChromeSuppressContext.Provider>;
}

// ── Simulated-device-chrome hide (mobile prototype mode) ─────────────────────
// On a real phone the OS draws its own status bar AND home indicator, so the proto's
// simulated versions are redundant. When hidden: StatusBar paints nothing and reserves no
// space (the flow runs full-bleed under the real bar); GestureNav drops its handle and
// reserves only the bottom safe-area. (Named for the status bar for back-compat.)
const StatusBarHiddenContext = createContext(false);

export function StatusBarHiddenProvider({ hidden, children }: { hidden: boolean; children: ReactNode }) {
  return <StatusBarHiddenContext.Provider value={hidden}>{children}</StatusBarHiddenContext.Provider>;
}

// ── Status bar (decorative) ─────────────────────────────────────────────────

export function StatusBar({
  backgroundColor = BG_PRIMARY,
  time = "9:41",
  color = TEXT_PRIMARY,
}: {
  backgroundColor?: string;
  time?: string;
  // Content colour for time + glyphs. Themed by default (dark on light ↔ white on dark);
  // pass TEXT_ON_COLOR_PRIMARY for on-brand Valentino-500 immersive surfaces where it must read white.
  color?: string;
}) {
  const hidden = useContext(StatusBarHiddenContext);
  const suppressed = useContext(ChromeSuppressContext);
  // Mobile prototype mode: the phone shows its own status bar, so render nothing at all
  // (no reserved height) and let the flow run to the top of the device viewport.
  if (hidden) return null;
  // When the chrome is hoisted to a single fixed bar above this screen, reserve the
  // 44px of layout but paint nothing — the hoisted bar renders the glyphs instead.
  if (suppressed) return <div aria-hidden="true" style={{ height: STATUS_BAR_HEIGHT, backgroundColor }} />;

  // The status glyph SVGs bake a fixed black fill, so they vanish on dark/brand surfaces.
  // Drive their shape via CSS mask and tint with the themed `color` instead, so the bar
  // stays visible and consistent on every surface.
  const glyphMask = (src: string): CSSProperties => ({
    backgroundColor: color,
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  });

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
        {/* Time - Figma: left 55px, translateX(-50%), top calc(50% - 8.33px) */}
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
            color,
            whiteSpace: "nowrap",
            margin: 0,
          }}
        >
          {time}
        </p>

        {/* Status icons - Figma: right 30px, vertically centered, gap 6.436px */}
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
          {/* Cellular - 16.976×10.829 */}
          <div style={{ width: 16.976, height: 10.829, ...glyphMask("/status-cellular.svg") }} />
          {/* Wi-Fi - 14.927×10.829 */}
          <div style={{ width: 14.927, height: 10.829, ...glyphMask("/status-wifi.svg") }} />
          {/* Battery - 27.333×13.667 with fill overlay */}
          <div style={{ width: 27.333, height: 13.667, position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 0.35, ...glyphMask("/status-battery.svg") }} />
            <div style={{ position: "absolute", inset: "0 44.91% 0 0", ...glyphMask("/status-battery-fill.svg") }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Gesture nav indicator ───────────────────────────────────────────────────

export function GestureNav({ backgroundColor = "transparent" }: { backgroundColor?: string }) {
  const hidden = useContext(StatusBarHiddenContext);
  const suppressed = useContext(ChromeSuppressContext);
  // Mobile prototype mode: the phone draws its own home indicator, so drop the simulated handle.
  // Reserve the bottom safe-area instead so the input bar clears the real indicator (0 on desktop).
  if (hidden) return <div aria-hidden="true" style={{ height: "env(safe-area-inset-bottom)" }} />;
  return (
    <div
      className="shrink-0 flex items-center justify-center"
      style={{ backgroundColor, paddingTop: 8, paddingBottom: 8 }}
      aria-hidden="true"
    >
      {/* When hoisted, the handle box still reserves its 4px of height but paints
          nothing — the single fixed gesture nav above the stack shows the handle. */}
      <div
        style={{
          width: 128,
          height: 4,
          // 10% neutral, themed: black/.1 on light surfaces, white/.1 on dark — the
          // common gesture-nav handle colour across every screen.
          backgroundColor: suppressed ? "transparent" : OUTLINE_BOLD,
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
  // Frosted-glass chip (matches the chat screen's close): translucent fill + blur + bold outline.
  frosted?: boolean;
};

export function NavButton({ kind, onClick, ariaLabel, frosted = false }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? (kind === "back" ? "Back" : "Close")}
      style={{
        width: 48,
        height: 48,
        border: frosted ? `1px solid ${OUTLINE_BOLD}` : "none",
        borderRadius: frosted ? "50%" : undefined,
        background: frosted ? BG_GLASS : "transparent",
        backdropFilter: frosted ? "blur(12px)" : undefined,
        WebkitBackdropFilter: frosted ? "blur(12px)" : undefined,
        boxShadow: frosted ? ELEVATION_CARD : undefined,
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        justifyContent: frosted ? "center" : "flex-start",
        padding: frosted ? 0 : 12,
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
  leadingScrolled?: boolean; // when false, the leading (close/back) chip fades out — used to hide it at the top of a scroll
  leadingHidden?: boolean; // instant-hides the leading chip — used when an overlay's own fixed close swaps in at the same spot (no double-chip flicker)
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
  leadingScrolled = true,
  leadingHidden = false,
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
    // paddingTop = the notch inset (0 on desktop): with the flow running edge-to-edge under the
    // phone's status bar, this keeps the app-bar row (close / toggle) below the notch so it always
    // reads as pinned on top. On mobile the simulated StatusBar is hidden, so this is the only inset.
    <div style={{ pointerEvents: absolute ? "auto" : undefined, paddingTop: "env(safe-area-inset-top)" }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              {/* Character avatar beside the name (same asset the PersonaToggle uses). */}
              <img src={`/characters/${voice}.svg`} alt="" width={24} height={24} style={{ borderRadius: "50%", flexShrink: 0 }} />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: TEXT_PRIMARY,
                  ...typography.headerH4,
                }}
              >
                {voice === "byron" ? "Byron" : "Ryan"}
              </span>
            </div>
          )}
        </div>

        {/* Leading — the close/back icon ALWAYS shows. When floating (absolute) the
            circular container only appears once scrolled; at the top it drops away,
            leaving just the bare icon. The chip chrome matches the WrappedStory close
            button: BG_CARD fill, 1px OUTLINE_BOLD border, ELEVATION_CARD shadow. */}
        <div style={{ position: "absolute", top: 8, left: 12 }}>
          <button
            type="button"
            onClick={onNav}
            aria-label={navKind === "back" ? "Back" : "Close"}
            className="flex items-center justify-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: RADIUS_CIRCLE,
              // Always a frosted-glass chip — consistent in light + dark (BG_GLASS is translucent in
              // both, so the backdrop blur always reads). No longer a bare icon at the top.
              backgroundColor: BG_GLASS,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: `1px solid ${OUTLINE_BOLD}`,
              boxShadow: ELEVATION_CARD,
              cursor: onNav ? "pointer" : "default",
              padding: 0,
              // Instant (opacity is NOT in the transition list): when an overlay peeks open over the chat,
              // its own fixed close chip appears at this exact spot — hiding this one with no fade avoids
              // the two frosted chips overlapping for a frame (the flicker).
              opacity: leadingHidden ? 0 : 1,
              pointerEvents: leadingHidden ? "none" : undefined,
              transition: "background-color 220ms ease, border-color 220ms ease, box-shadow 220ms ease",
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
