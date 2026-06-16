"use client";

import { useState, type ReactNode } from "react";
import Tooltip from "./Tooltip";
import { StatusBar } from "./AppChrome";
import { typography } from "../lib/typography";
import {
  BG_BRAND,
  TEXT_ON_COLOR_PRIMARY,
  OUTLINE_ON_COLOR_SUBTLE,
  OUTLINE_ON_COLOR_BOLD,
  ALPHA_WHITE_10,
  ALPHA_WHITE_20,
  ALPHA_WHITE_50,
  SLATE_700,
} from "../lib/colors";
import { RADIUS_L, RADIUS_CIRCLE } from "../lib/radii";

// Payments L0 — "Valentino home" dialer, rebuilt from the R23 canonical recipe
// (reference_pod_payments.md · node 885:19901 in PNUz3Dr9KSlFJSnsXsC0nL). Every
// surface is a real TSX node tokenised through app/lib/colors.ts, so light mode
// renders the V-500 brand fill and dark mode flattens to pure black (#090B0C)
// — both come for free from BG_BRAND (var(--dls-bg-brand)). White glyphs
// (TEXT_ON_COLOR_PRIMARY) survive both modes; the only V-500 accent is the
// QR-scan glyph inside the always-white Pay dock FAB.

export type PayScreenState = "firstTime" | "alert" | "default";

// Kept for backward compatibility with callers that still pass pill props.
// The pill row is replaced by the canonical UPI-ID chip; these are accepted
// and ignored so PayScreenFuture / OnboardingSim / playground / [persona] keep
// type-checking against the same surface.
export type PillDef = { id: string; icon: string; label: string; tappable: boolean };

// UPI handle shown in the identity chip. Placeholder per the canonical proto —
// rename here when a real account handle is plumbed through.
const UPI_HANDLE = "rajan@sliceaxis";

const KEYPAD: string[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "backspace"],
];

const MAX_AMOUNT = 5000000; // ₹50,00,000 cap
const MAX_INT_DIGITS = 7;

// Indian-style grouping on the integer part (last 3, then every 2 going left),
// decimals left as typed: "100000.5" → "1,00,000.5". String-based so an
// in-progress decimal ("1.") is preserved during entry.
function formatINRString(amount: string): string {
  const [intRaw, decPart] = amount.split(".");
  const n = (intRaw.replace(/\D/g, "") || "0");
  const grouped =
    n.length <= 3
      ? n
      : `${n.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${n.slice(-3)}`;
  return decPart !== undefined ? `${grouped}.${decPart}` : grouped;
}

// Dynamic shrink so the amount never overflows the frame as digits grow.
function fontSizeForAmount(amount: string): number {
  const digits = amount.split(".")[0].replace(/\D/g, "").length;
  if (digits <= 3) return 80;
  if (digits === 4) return 72;
  if (digits === 5) return 64;
  if (digits === 6) return 56;
  return 48;
}

// ── Ryan entry glyph (sparkle, /icons/ryan.svg geometry, themed via color) ──
function RyanGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="1 1 22 22" fill="none" aria-hidden="true">
      <path
        d="M12.1048 2.08486L12.5574 4.12572C13.3662 7.77999 16.22 10.6338 19.8743 11.4426L21.9151 11.8952C22.0283 11.9204 22.0283 12.0796 21.9151 12.1048L19.8743 12.5574C16.22 13.3662 13.3662 16.22 12.5574 19.8743L12.1048 21.9151C12.0796 22.0283 11.9204 22.0283 11.8952 21.9151L11.4426 19.8743C10.6338 16.22 7.77999 13.3662 4.12572 12.5574L2.08486 12.1048C1.97171 12.0796 1.97171 11.9204 2.08486 11.8952L4.12572 11.4426C7.77999 10.6338 10.6338 7.77999 11.4426 4.12572L11.8952 2.08486C11.9204 1.97171 12.0796 1.97171 12.1048 2.08486Z"
        fill="currentColor"
      />
    </svg>
  );
}

// ── Bottom-nav glyphs (NavIcons.jsx, node 451:1116) — fill=currentColor ──
function ExploreGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19.6943 8.0957C20.4155 8.09575 21.001 8.68653 21.001 9.41406V15.7783C21.001 18.6936 18.6415 21.074 15.752 21.0742H9.44336C8.72213 21.0742 8.13672 20.4834 8.13672 19.7559C8.13688 19.0284 8.72222 18.4385 9.44336 18.4385H15.752C17.2089 18.4383 18.3877 17.2484 18.3877 15.7783V9.41406C18.3877 8.6865 18.9731 8.0957 19.6943 8.0957Z" fill="currentColor" />
      <path d="M14.5576 2.92383C15.2788 2.92387 15.8643 3.51465 15.8643 4.24219C15.8641 4.96959 15.2787 5.55953 14.5576 5.55957H8.24902C6.79199 5.55966 5.61329 6.74959 5.61328 8.21973V14.584C5.61328 15.3115 5.0278 15.9023 4.30664 15.9023C3.58541 15.9023 3 15.3115 3 14.584V8.21973C3.00001 5.30442 5.35938 2.92392 8.24902 2.92383H14.5576Z" fill="currentColor" />
      <path d="M13.8857 8.8916C14.4689 8.89169 14.9452 9.37271 14.9453 9.96094V13.9385C14.9453 14.5268 14.4689 15.0087 13.8857 15.0088H9.94238C9.35937 15.0085 8.88281 14.5266 8.88281 13.9385V9.96094C8.88288 9.37282 9.35941 8.89187 9.94238 8.8916H13.8857Z" fill="currentColor" />
    </svg>
  );
}

function CreditGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8.91797 3.1084C9.8832 2.91932 11.3373 2.9245 12.7051 3.5625C14.1631 4.24272 15.426 5.60224 15.874 7.90039C16.3415 10.2989 15.4392 12.0625 14.0957 13.1592C12.8315 14.1911 11.208 14.621 10.042 14.6211H6.65039C6.75706 15.0071 6.93915 15.461 7.20703 15.9277C7.84466 17.0384 8.89868 18.1072 10.3936 18.5674C11.0409 18.7667 11.3983 19.4615 11.208 20.1123C11.017 20.7657 10.3408 21.1463 9.69043 20.9463C7.4745 20.2641 5.9762 18.6994 5.10645 17.1846C4.671 16.4261 4.37547 15.6506 4.22266 14.9551C4.0844 14.3258 4.01308 13.5384 4.2832 12.8916C4.47331 12.4366 4.91235 12.1367 5.40332 12.1367H10.042C10.7312 12.1366 11.7976 11.8526 12.5742 11.2188C12.9304 10.928 13.2226 10.5694 13.3945 10.1172C13.566 9.66593 13.6258 9.10152 13.4863 8.38574C13.1922 6.87642 12.445 6.17336 11.6924 5.82227C10.8702 5.43874 9.9353 5.43364 9.35449 5.55273L9.31055 5.5625L9.26562 5.56738C8.19219 5.70513 7.55809 6.25075 7.14062 6.92578C6.69519 7.64619 6.49578 8.52981 6.42871 9.21777C6.36276 9.89456 5.77164 10.4004 5.0957 10.3311C4.42092 10.2618 3.94 9.64749 4.00586 8.97168C4.09348 8.07306 4.35924 6.76701 5.08105 5.59961C5.82484 4.39689 7.04759 3.36194 8.91797 3.1084ZM19.7822 7.56738C20.4611 7.56738 20.9999 8.13013 21 8.80957C21 9.48907 20.4611 10.0518 19.7822 10.0518H16.374L16.4414 9.70605C16.5675 9.05888 16.5668 8.45883 16.4775 7.9043L16.4238 7.56738H19.7822ZM18.0195 3.56934C18.6984 3.56934 19.2373 4.13202 19.2373 4.81152C19.2371 5.49089 18.6983 6.05371 18.0195 6.05371H15.9072L15.8232 5.91309C15.3821 5.17982 14.8231 4.56459 14.3076 4.06836L13.7891 3.56934H18.0195Z" fill="currentColor" />
    </svg>
  );
}

// Raw geometry is 3 vertical bars; the canonical nav renders them horizontal — rotate 90°.
function ActivityGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: "rotate(90deg)" }}>
      <path d="M5.5 10C6.32843 10 7 10.6716 7 11.5V18.5C7 19.3284 6.32843 20 5.5 20C4.67157 20 4 19.3284 4 18.5V11.5C4 10.6716 4.67157 10 5.5 10ZM12.5 2C13.3284 2 14 2.67157 14 3.5V18.5C14 19.3284 13.3284 20 12.5 20C11.6716 20 11 19.3284 11 18.5V3.5C11 2.67157 11.6716 2 12.5 2ZM19.5 14C20.3284 14 21 14.6716 21 15.5V18.5C21 19.3284 20.3284 20 19.5 20C18.6716 20 18 19.3284 18 18.5V15.5C18 14.6716 18.6716 14 19.5 14Z" fill="currentColor" />
    </svg>
  );
}

// ── App bar ──────────────────────────────────────────────────
function AppBar({
  onRyanTap,
  showTooltip,
  sheetOpen = false,
}: {
  onRyanTap?: () => void;
  showTooltip: boolean;
  sheetOpen?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        // 24px page margins; paddingTop 12 sits the 40px controls 56px from the phone's
        // top edge (44 status bar + 12).
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 12,
        paddingBottom: 4,
      }}
    >
      {/* Check balance — transparent fill + white-subtle outline (NOT a filled chip) */}
      <button
        type="button"
        aria-label="Check balance"
        style={{
          background: "transparent",
          border: `1px solid ${OUTLINE_ON_COLOR_BOLD}`,
          color: TEXT_ON_COLOR_PRIMARY,
          height: 40,
          display: "inline-flex",
          alignItems: "center",
          padding: "0 14px",
          borderRadius: RADIUS_CIRCLE,
          cursor: "pointer",
          outline: "none",
          ...typography.bodySmall,
        }}
      >
        Check balance
      </button>

      {/* Right cluster: Ryan entry (tap target + first-time tooltip) + photo avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ position: "relative", display: "flex" }}>
          <button
            type="button"
            onClick={onRyanTap}
            aria-label="Meet Ryan"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "transparent",
              border: `1px solid ${OUTLINE_ON_COLOR_BOLD}`,
              color: TEXT_ON_COLOR_PRIMARY,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              cursor: onRyanTap ? "pointer" : "default",
              outline: "none",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: "inline-flex",
                // The glyph turns like a gear: forward 0→360° on open, reverse 360→0° on close.
                // Slower (650ms) for a calmer single rotation; the sheet itself starts rising
                // 100ms after (transition-delay on the overlay), so the spin leads.
                transform: sheetOpen ? "rotate(360deg)" : "rotate(0deg)",
                transition: "transform 650ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <RyanGlyph size={18} />
            </span>
          </button>

          {showTooltip && (
            <Tooltip
              text="Meet Ryan"
              orientation="top-right"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 2,
                zIndex: 2,
                opacity: 0,
                animation: "payscreen-tooltip-reveal 5.5s ease-out 1.3s forwards",
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        {/* Photo avatar — user identity. avatar_only.png is a circular photo
           inset ~8% inside a transparent 192px square (opaque content 160×160),
           so the img is scaled 1.2× inside an overflow-clipped circle to fill
           the bordered container edge-to-edge. */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: `1px solid ${OUTLINE_ON_COLOR_BOLD}`,
            overflow: "hidden",
            flex: "0 0 auto",
          }}
        >
          <img
            src="/assets/avatar_only.png"
            alt=""
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transform: "scale(1.2)",
              userSelect: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Amount hero + UPI-ID chip ────────────────────────────────
function AmountHero({ amount }: { amount: string }) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
      }}
    >
      <div
        style={{
          ...typography.displayLarge,
          fontSize: fontSizeForAmount(amount),
          color: TEXT_ON_COLOR_PRIMARY,
          whiteSpace: "nowrap",
          transition: "font-size 220ms cubic-bezier(0.25,0.1,0.25,1)",
        }}
      >
        ₹{formatINRString(amount)}
      </div>

      <button
        type="button"
        aria-label="UPI ID"
        style={{
          background: ALPHA_WHITE_10,
          border: "none",
          padding: "8px 16px",
          borderRadius: RADIUS_L,
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          outline: "none",
        }}
      >
        {/* Official BHIM-UPI mark (white wordmark + tricolor arrow, transparent bg) */}
        <img
          src="/assets/upi_pill.png"
          alt="BHIM UPI"
          style={{ height: 14, width: "auto", display: "block", userSelect: "none" }}
        />
        <span style={{ ...typography.caption, color: TEXT_ON_COLOR_PRIMARY }}>
          ID: {UPI_HANDLE}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M4 2L8 6L4 10" stroke={TEXT_ON_COLOR_PRIMARY} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

// ── Keypad ───────────────────────────────────────────────────
function KeypadKey({ value, onTap }: { value: string; onTap: (v: string) => void }) {
  const isBackspace = value === "backspace";
  return (
    <button
      type="button"
      onClick={() => onTap(value)}
      aria-label={isBackspace ? "backspace" : value}
      className="payscreen-keypad-key"
      style={{
        width: 48,
        height: 48,
        background: "transparent",
        border: "none",
        outline: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: TEXT_ON_COLOR_PRIMARY,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {isBackspace ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : value === "." ? (
        <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontSize: 24, lineHeight: 1 }}>•</span>
      ) : (
        <span style={typography.headerH3}>{value}</span>
      )}
    </button>
  );
}

function Keypad({ onTap }: { onTap: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
      {KEYPAD.map((row, ri) => (
        <div
          key={ri}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 36px" }}
        >
          {row.map((key, i) => (
            <KeypadKey key={`${ri}-${i}`} value={key} onTap={onTap} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Request | Transfer row ───────────────────────────────────
// Disabled until an amount is entered (per reference_pod_payments.md — the
// Tertiary pills dim while ₹0 is unentered, restore once a value is typed).
function ActionPill({ label, disabled = false }: { label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={label.toLowerCase()}
      style={{
        flex: 1,
        background: ALPHA_WHITE_20,
        color: TEXT_ON_COLOR_PRIMARY,
        border: "none",
        padding: "12px 24px",
        borderRadius: RADIUS_CIRCLE,
        cursor: disabled ? "default" : "pointer",
        outline: "none",
        opacity: disabled ? 0.4 : 1,
        transition: "opacity 160ms cubic-bezier(0.25,0.1,0.25,1)",
        ...typography.buttonNormal,
      }}
    >
      {label}
    </button>
  );
}

// Pay-active scan glyph (canonical PayCenter geometry, node 451:1116) — currentColor
// so it themes V-500 in light, #090B0C in dark via the white FAB's color.
function PayScanGlyph({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M3.22 9.305C3.89 9.305 4.44 8.755 4.44 8.086V6.786C4.44 5.487 5.49 4.437 6.8 4.437H8.11C8.78 4.437 9.33 3.888 9.33 3.218C9.33 2.548 8.78 1.999 8.11 1.999H6.8C4.15 1.999 2 4.147 2 6.786V8.086C2 8.755 2.55 9.305 3.22 9.305Z" fill="currentColor" />
      <path fillRule="evenodd" clipRule="evenodd" d="M8.11 19.548H6.8C5.49 19.548 4.44 18.489 4.44 17.189V15.89C4.44 15.22 3.89 14.671 3.22 14.671C2.55 14.671 2 15.22 2 15.89V17.189C2 19.838 4.15 21.977 6.8 21.977H8.11C8.78 21.977 9.33 21.427 9.33 20.758C9.33 20.088 8.78 19.538 8.11 19.538V19.548Z" fill="currentColor" />
      <path fillRule="evenodd" clipRule="evenodd" d="M20.78 14.682C20.11 14.682 19.56 15.232 19.56 15.902V17.201C19.56 18.5 18.51 19.56 17.2 19.56H15.89C15.22 19.56 14.67 20.11 14.67 20.779C14.67 21.449 15.22 21.999 15.89 21.999H17.2C19.85 21.999 22 19.85 22 17.211V15.912C22 15.242 21.45 14.692 20.78 14.692V14.682Z" fill="currentColor" />
      <path fillRule="evenodd" clipRule="evenodd" d="M17.2 1.999H15.89C15.22 1.999 14.67 2.548 14.67 3.218C14.67 3.888 15.22 4.438 15.89 4.438H17.2C18.51 4.438 19.56 5.497 19.56 6.786V8.086C19.56 8.755 20.11 9.305 20.78 9.305C21.45 9.305 22 8.755 22 8.086V6.786C22 4.138 19.85 1.999 17.2 1.999Z" fill="currentColor" />
      <path d="M7.2 12H16.8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

// ── Bottom nav — faithful static replica of the canonical slice DLS BottomNav
// (skill proto src/components/BottomNav.jsx · R23). Pay is the active pod on the
// Valentino home: 5 items in natural order, flex+gap (24) so edge-to-edge spacing
// is uniform, centred so Pay lands mid-phone. Immersive medallions = white-20 +
// V-500 punched-out glyph (→ white in dark, via .paydock-medallion). The gesture
// bar lives inside the nav, per canonical. ──
function NavMedallion({ children }: { children: ReactNode }) {
  return (
    <div
      className="paydock-medallion"
      style={{
        flex: "0 0 auto",
        width: 44,
        height: 44,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
}

function PayDock() {
  return (
    <div aria-hidden="true">
      {/* Item row — centred, gap 24. align-items:center lifts the 72px Pay ring
          14px above the 44px inactive medallions (the canonical "pop into centre"). */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, paddingTop: 8 }}>
        {/* Banking — inactive slot renders the ₹balance, not a glyph */}
        <div
          className="paydock-medallion"
          style={{
            flex: "0 0 auto",
            width: 44,
            height: 44,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontFamily: "var(--font-rubik), sans-serif", fontWeight: 500, fontSize: 13, lineHeight: 1 }}>
            ₹3K
          </span>
        </div>

        <NavMedallion><ExploreGlyph /></NavMedallion>

        {/* Pay — active: 72px white ring + 56px white disc + scan glyph (V-500 / #090B0C). */}
        <div style={{ flex: "0 0 auto", position: "relative", width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
            <circle cx="36" cy="36" r="34" stroke={TEXT_ON_COLOR_PRIMARY} strokeWidth="4" />
          </svg>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: TEXT_ON_COLOR_PRIMARY,
              color: BG_BRAND,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PayScanGlyph size={32} />
          </div>
        </div>

        <NavMedallion><CreditGlyph /></NavMedallion>
        <NavMedallion><ActivityGlyph /></NavMedallion>
      </div>

      {/* Home indicator — Apple HIG: thin pill (~134×5) pinned near the bottom
          edge with ~8px clearance. White-55 on the brand floor. paddingTop is the
          breathing room BELOW the dock buttons (keeps the dragger low per Apple
          while the buttons get space above it). */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 20, paddingBottom: 12 }}>
        <div style={{ width: 134, height: 5, borderRadius: 40, background: ALPHA_WHITE_50 }} />
      </div>
    </div>
  );
}

// ── Screen ───────────────────────────────────────────────────
export default function PayScreen({
  onPillTap,
  animate = false,
  state,
  sheetOpen = false,
}: {
  /** Tap handler for Ryan's entry (top-right). */
  onPillTap?: () => void;
  /** Shortcut for state === "alert" (legacy). */
  animate?: boolean;
  /** Explicit state; takes precedence over `animate`. */
  state?: PayScreenState;
  /** Whether the chat sheet is open — drives the Ryan glyph's gear rotation
      (forward as it opens, reverse as it closes), synced to the sheet slide. */
  sheetOpen?: boolean;
  /** Legacy props — accepted for caller compatibility, no longer rendered. */
  pillLabel?: string;
  pills?: PillDef[];
}) {
  const resolvedState: PayScreenState = state ?? (animate ? "alert" : "default");
  const [amount, setAmount] = useState("0");

  const handleKey = (key: string) => {
    setAmount((prev) => {
      if (key === "backspace") return prev.length <= 1 ? "0" : prev.slice(0, -1);
      if (key === ".") return prev.includes(".") ? prev : prev + ".";
      if (prev === "0") return key;
      const [intPart, decPart] = prev.split(".");
      if (decPart === undefined) {
        if (Number(intPart + key) > MAX_AMOUNT) return prev;
        if ((intPart + key).length > MAX_INT_DIGITS) return prev;
      }
      return prev + key;
    });
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: BG_BRAND, display: "flex", flexDirection: "column" }}
    >
      <StatusBar backgroundColor="transparent" color={TEXT_ON_COLOR_PRIMARY} />
      <AppBar onRyanTap={onPillTap} showTooltip={resolvedState === "firstTime"} sheetOpen={sheetOpen} />
      <AmountHero amount={amount} />

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Keypad onTap={handleKey} />
        <div style={{ display: "flex", gap: 16, padding: "0 24px" }}>
          <ActionPill label="Request" disabled={Number(amount) === 0} />
          <ActionPill label="Transfer" disabled={Number(amount) === 0} />
        </div>
        <PayDock />
      </div>

      <style jsx global>{`
        .payscreen-keypad-key:active {
          background: ${ALPHA_WHITE_10};
          border-radius: 50%;
        }
        /* Immersive nav medallions — glyph/balance = the floor colour "punched
           out" via var(--dls-bg-brand): V-500 in light, #090B0C in dark. Fill is a
           translucent-white chip in light, a disabled grey in dark. Class-driven
           so .dark wins by source order. */
        .paydock-medallion { color: ${BG_BRAND}; background: ${ALPHA_WHITE_20}; }
        .dark .paydock-medallion { background: ${SLATE_700}; }
        @keyframes payscreen-tooltip-reveal {
          0% { opacity: 0; transform: translateY(-4px); }
          4% { opacity: 1; transform: translateY(0); }
          95% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
        @keyframes payscreen-ryan-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
