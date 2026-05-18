"use client";

import React, { useState, useCallback, useEffect } from "react";
import { typography } from "../lib/typography";
import {
  VALENTINO_500,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, TEXT_DISABLED,
  BG_PRIMARY, BG_CARD, BG_DISABLED, OUTLINE_SUBTLE,
  ALPHA_BLACK_50, ALPHA_WHITE_FF, RED_500,
} from "../lib/colors";
import { SPACE_2XS, SPACE_XS, SPACE_S, SPACE_M, SPACE_L, SPACE_XL, SPACE_2XL } from "../lib/spacing";
import { RADIUS_L, RADIUS_M, RADIUS_CIRCLE } from "../lib/radii";
import { ELEVATION_CARD, ELEVATION_ABOVE, ELEVATION_BELOW } from "../lib/elevation";
import { StatusBar, GestureNav } from "../components/AppChrome";
import { AA_BENEFITS, AA_LEARN_MORE, AA_CONSENT_CARDS, AA_CONSENT_DETAILS, AA_INFO_TOOLTIPS, AA_PHONE, AA_NO_ACCOUNTS, AA_OTP_ERROR, BANKS, ONEMONEY_LOGO } from "./fixtures/onboardingFixture";

// ── Transition config ────────────────────────────────────────────

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const DURATION = 460;

// ── Inline SVG icons ─────────────────────────────────────────────

function ArrowRightIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M13 6l6 6-6 6" stroke={ALPHA_WHITE_FF} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon({ color = TEXT_TERTIARY }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 6v5c0 5.25 3.4 10.15 8 11.25 4.6-1.1 8-6 8-11.25V6l-8-4z" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkIcon({ color = TEXT_TERTIARY }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function GraphIcon({ color = TEXT_TERTIARY }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 20h18M5 17V10M9 17V7M13 17V12M17 17V5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BackIcon() {
  return (
    <img src="/icons/chevron-left.svg" alt="Back" width={24} height={24} />
  );
}

// ── AA benefit icons ─────────────────────────────────────────────

const AA_ICONS = [
  <GraphIcon key="graph" color={TEXT_TERTIARY} />,
  <SparkIcon key="spark" color={TEXT_TERTIARY} />,
  <ShieldIcon key="shield" color={TEXT_TERTIARY} />,
];

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke={TEXT_PRIMARY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon({ color = TEXT_TERTIARY }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 11V7a4 4 0 018 0v4" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ThumbsUpIcon({ color = TEXT_TERTIARY }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3m7-2V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HandIcon({ color = TEXT_TERTIARY }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M18 11V6a2 2 0 00-4 0M14 10V4a2 2 0 00-4 0v7M10 10.5V6a2 2 0 00-4 0v9l-1.76-2.64a2 2 0 00-3.24 2.34l4.5 6.3A6 6 0 0010.5 24H14a8 8 0 008-8v-5a2 2 0 00-4 0" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon({ color = TEXT_TERTIARY }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon({ color = TEXT_TERTIARY }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.72 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0122 16.92z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke={TEXT_TERTIARY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Consent-detail row icons ─────────────────────────────────────

function DocumentIcon({ color = TEXT_TERTIARY }: { color?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProfileIcon({ color = TEXT_TERTIARY, dotted = false }: { color?: string; dotted?: boolean }) {
  const dash = dotted ? "2 2.5" : undefined;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" strokeDasharray={dash} />
      <path d="M4 21a8 8 0 0116 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray={dash} />
    </svg>
  );
}

function ClockIcon({ color = TEXT_TERTIARY, dotted = false }: { color?: string; dotted?: boolean }) {
  const dash = dotted ? "2 2.5" : undefined;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" strokeDasharray={dash} />
      <path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const CONSENT_ROW_ICONS: Record<string, React.ReactNode> = {
  Purpose: <DocumentIcon />,
  "Consent type": <ProfileIcon />,
  "Time period": <ClockIcon />,
  "Statement period": <ClockIcon />,
  Frequency: <ClockIcon />,
  "Consent validity": <ClockIcon dotted />,
  "Data life": <ClockIcon dotted />,
};

// ── Purple FAB ───────────────────────────────────────────────────

function Fab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center transition-transform active:scale-[0.95]"
      style={{
        width: 56,
        height: 56,
        borderRadius: RADIUS_CIRCLE,
        backgroundColor: VALENTINO_500,
        border: "none",
        cursor: "pointer",
        boxShadow: "none",
      }}
    >
      <ArrowRightIcon />
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════

const SCREENS = ["value-prop", "learn-more", "bank-select", "otp", "no-accounts", "phone-number", "consent", "consent-detail"] as const;
type Screen = (typeof SCREENS)[number];
const OTP_LENGTH = 4;
const OTP_RESEND_SECONDS = 15;

export type AAStartState = "happy" | "no-accounts-empty" | "no-accounts-alternates" | "otp-error";

export default function AASim({
  onComplete,
  onClose,
  startState = "happy",
}: {
  onComplete?: () => void;
  onClose?: () => void;
  startState?: AAStartState;
} = {}) {
  const initialScreen: Screen =
    startState === "no-accounts-empty" || startState === "no-accounts-alternates"
      ? "no-accounts"
      : startState === "otp-error"
      ? "otp"
      : "value-prop";
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [noAccountsHasAlternates, setNoAccountsHasAlternates] = useState(startState === "no-accounts-alternates");
  const [otpErrored, setOtpErrored] = useState(startState === "otp-error");
  const [phoneValue, setPhoneValue] = useState("");
  const [prevScreen, setPrevScreen] = useState<Screen | null>(null);
  const [direction, setDirection] = useState<"left" | "right" | "up" | "down">("left");
  const [phase, setPhase] = useState<"idle" | "prep" | "go">("idle");
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState(startState === "otp-error" ? "1234" : "");
  const [consentDetailIdx, setConsentDetailIdx] = useState(0);
  const [infoSheet, setInfoSheet] = useState<string | null>(null);
  const [otpResendLeft, setOtpResendLeft] = useState(OTP_RESEND_SECONDS);

  useEffect(() => {
    if (screen !== "otp") return;
    setOtpResendLeft(OTP_RESEND_SECONDS);
    const timer = window.setInterval(() => {
      setOtpResendLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [screen]);

  // Screens that are "presented" (slide up/down) rather than "pushed" (left/right)
  const PRESENT_SCREENS: Screen[] = ["consent-detail", "learn-more"];

  const [history, setHistory] = useState<Screen[]>([]);

  const navigate = useCallback((next: Screen, dir: "left" | "right" | "up" | "down") => {
    setDirection(dir);
    setPrevScreen(screen);
    setScreen(next);
    setPhase("prep");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setPhase("go");
      setTimeout(() => {
        setPrevScreen(null);
        setPhase("idle");
      }, DURATION);
    }));
  }, [screen]);

  const goTo = useCallback((next: Screen) => {
    const isPresent = PRESENT_SCREENS.includes(next);
    const isDismiss = PRESENT_SCREENS.includes(screen);
    const dir = isPresent ? "up" : isDismiss ? "down" : "left";
    setHistory((h) => [...h, screen]);
    navigate(next, dir);
  }, [screen, navigate]);

  const goBack = useCallback(() => {
    if (history.length === 0) { onClose?.(); return; }
    const prev = history[history.length - 1];
    const isDismiss = PRESENT_SCREENS.includes(screen);
    const isPresentBack = PRESENT_SCREENS.includes(prev);
    const dir = isDismiss ? "down" : isPresentBack ? "up" : "right";
    setHistory((h) => h.slice(0, -1));
    navigate(prev, dir);
  }, [history, screen, navigate, onClose]);

  // ── Value Prop ───────────────────────────────────────────────

  function renderValueProp() {
    return (
      <div
        className="h-full w-full flex flex-col"
        style={{ backgroundColor: BG_PRIMARY }}
      >
        <StatusBar backgroundColor="transparent" />

        {/* App bar */}
        <div
          className="flex items-center shrink-0"
          style={{ height: 64, paddingLeft: SPACE_S, paddingRight: SPACE_XS, paddingTop: SPACE_XS, paddingBottom: SPACE_XS }}
        >
          <button
            type="button"
            onClick={goBack}
            className="flex items-center justify-center"
            style={{ width: 48, height: 48, background: "none", border: "none", cursor: "pointer", padding: 12 }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Header */}
        <div style={{ paddingLeft: SPACE_L, paddingRight: SPACE_L, marginTop: SPACE_XL }}>
          <h1 style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0 }}>
            Link your accounts
          </h1>
        </div>

        {/* Benefit rows */}
        <div className="flex-1" style={{ marginTop: SPACE_XL, display: "flex", flexDirection: "column" }}>
          {AA_BENEFITS.map((benefit, i) => (
            <div
              key={benefit.title}
              className="flex items-start"
              style={{ padding: `${SPACE_M}px ${SPACE_L}px`, gap: SPACE_S }}
            >
              <div className="shrink-0" style={{ width: 24, height: 24, marginTop: 2 }}>
                {AA_ICONS[i]}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: SPACE_2XS }}>
                <div style={{ display: "flex", flexDirection: "column", gap: SPACE_2XS }}>
                  <p style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, margin: 0 }}>
                    {benefit.title}
                  </p>
                  <p style={{ ...typography.bodySmall, color: TEXT_TERTIARY, margin: 0 }}>
                    {benefit.subtitle}
                  </p>
                </div>
                {(benefit as { cta?: string }).cta && (
                  <button
                    type="button"
                    onClick={() => goTo("learn-more")}
                    style={{
                      ...typography.buttonSmall,
                      color: VALENTINO_500,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      marginTop: SPACE_S,
                      textAlign: "left",
                    }}
                  >
                    {(benefit as { cta?: string }).cta}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAB + Gesture nav */}
        <div className="shrink-0">
          <div className="flex justify-end" style={{ padding: `0 ${SPACE_XL}px ${SPACE_L}px` }}>
            <Fab onClick={() => goTo("bank-select")} />
          </div>
          <GestureNav />
        </div>
      </div>
    );
  }

  // ── Learn More ──────────────────────────────────────────────

  const LEARN_MORE_ICONS = [
    <LockIcon key="lock" />,
    <ThumbsUpIcon key="thumbs" />,
    <ShieldIcon key="shield" />,
    <HandIcon key="hand" />,
  ];

  function renderLearnMore() {
    return (
      <div
        className="h-full w-full flex flex-col"
        style={{ backgroundColor: BG_PRIMARY }}
      >
        <StatusBar backgroundColor="transparent" />

        {/* App bar with close (X) */}
        <div
          className="flex items-center shrink-0"
          style={{ height: 64, paddingLeft: SPACE_S, paddingRight: SPACE_XS, paddingTop: SPACE_XS, paddingBottom: SPACE_XS }}
        >
          <button
            type="button"
            onClick={() => goTo("value-prop")}
            className="flex items-center justify-center"
            style={{ width: 48, height: 48, background: "none", border: "none", cursor: "pointer", padding: 12 }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: `0 ${SPACE_L}px` }}>
          {/* Header */}
          <div style={{ marginTop: SPACE_XL, display: "flex", flexDirection: "column", gap: SPACE_2XS }}>
            <h1 style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0 }}>
              {AA_LEARN_MORE.title}
            </h1>
            <p style={{ ...typography.bodySmall, color: TEXT_TERTIARY, margin: 0 }}>
              {AA_LEARN_MORE.subtitle}
            </p>
          </div>

          {/* Major supported banks */}
          <div style={{ marginTop: SPACE_2XL, display: "flex", flexDirection: "column", gap: SPACE_S }}>
            <p style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, margin: 0 }}>
              Major supported banks
            </p>
            <div className="flex items-center">
              {AA_LEARN_MORE.supportedBanks.map((bank, i) => (
                <div
                  key={bank.id}
                  className="flex items-center justify-center shrink-0 overflow-hidden"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: RADIUS_CIRCLE,
                    backgroundColor: BG_CARD,
                    border: `1px solid ${OUTLINE_SUBTLE}`,
                    marginLeft: i > 0 ? -12 : 0,
                    zIndex: AA_LEARN_MORE.supportedBanks.length - i,
                  }}
                >
                  <img src={bank.logo} alt="" width={28} height={28} style={{ objectFit: "contain" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div style={{ marginTop: SPACE_2XL, display: "flex", flexDirection: "column", gap: SPACE_L }}>
            {AA_LEARN_MORE.benefits.map((benefit, i) => (
              <div key={benefit.title} className="flex items-start" style={{ gap: SPACE_S }}>
                <div className="shrink-0" style={{ width: 24, height: 24 }}>
                  {LEARN_MORE_ICONS[i]}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: SPACE_2XS }}>
                  <p style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, margin: 0 }}>
                    {benefit.title}
                  </p>
                  <p style={{ ...typography.bodySmall, color: TEXT_TERTIARY, margin: 0 }}>
                    {benefit.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Account aggregators */}
          <div style={{ marginTop: SPACE_2XL, display: "flex", flexDirection: "column", gap: SPACE_S, paddingBottom: SPACE_2XL }}>
            <p style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, margin: 0 }}>
              Account aggregators
            </p>
            <div className="flex flex-wrap items-center" style={{ gap: SPACE_L, rowGap: SPACE_M }}>
              {AA_LEARN_MORE.aggregators.map((agg) => (
                <div
                  key={agg.id}
                  className="flex items-center justify-center"
                  style={{ height: 24 }}
                >
                  <img src={agg.logo} alt={agg.label} style={{ height: 24, width: "auto", objectFit: "contain" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <GestureNav />
      </div>
    );
  }

  // ── Bank Select ──────────────────────────────────────────────

  const [bankScrolled, setBankScrolled] = useState(false);
  const [bankAtBottom, setBankAtBottom] = useState(true);
  const bankScrollRef = useCallback((el: HTMLDivElement | null) => {
    if (el) setBankAtBottom(el.scrollHeight <= el.clientHeight + 2);
  }, []);

  function renderBankSelect() {
    return (
      <div
        className="h-full w-full flex flex-col"
        style={{ backgroundColor: BG_PRIMARY }}
      >
        <StatusBar backgroundColor="transparent" />

        {/* App bar — shows title + shadow on scroll */}
        <div
          className="flex items-center shrink-0"
          style={{
            height: 64,
            paddingLeft: SPACE_S,
            paddingRight: SPACE_XS,
            paddingTop: SPACE_XS,
            paddingBottom: SPACE_XS,
            backgroundColor: BG_PRIMARY,
            boxShadow: bankScrolled ? ELEVATION_BELOW : "none",
            transition: "box-shadow 200ms ease",
            zIndex: 1,
          }}
        >
          <button
            type="button"
            onClick={goBack}
            className="flex items-center justify-center"
            style={{ width: 48, height: 48, background: "none", border: "none", cursor: "pointer", padding: 12 }}
          >
            <BackIcon />
          </button>
        </div>

        {/* Scrollable content: header + grid */}
        <div
          ref={bankScrollRef}
          className="flex-1 overflow-y-auto"
          onScroll={(e) => {
            const el = e.target as HTMLDivElement;
            setBankScrolled(el.scrollTop > 40);
            setBankAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 2);
          }}
        >
          {/* Header */}
          <div style={{ paddingLeft: SPACE_L, paddingRight: SPACE_L, marginTop: SPACE_XL }}>
            <h1 style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0 }}>
              Select your primary account
            </h1>
          </div>

          {/* Bank grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: SPACE_L,
              padding: `${SPACE_2XL}px ${SPACE_L}px`,
              paddingBottom: SPACE_2XL,
            }}
          >
            {BANKS.map((bank) => (
              <button
                key={bank.id}
                type="button"
                onClick={() => {
                  setSelectedBank(bank.id);
                }}
                className="flex flex-col items-center justify-center transition-transform active:scale-[0.97]"
                style={{
                  height: 134,
                  borderRadius: RADIUS_L,
                  backgroundColor: BG_CARD,
                  border: `2px solid ${selectedBank === bank.id ? VALENTINO_500 : OUTLINE_SUBTLE}`,
                  cursor: "pointer",
                  gap: SPACE_M,
                  padding: SPACE_M,
                }}
              >
                <div
                  className="flex items-center justify-center overflow-hidden"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: RADIUS_CIRCLE,
                    backgroundColor: BG_CARD,
                    border: `1.2px solid ${OUTLINE_SUBTLE}`,
                  }}
                >
                  <img src={bank.logo} alt="" width={32} height={32} style={{ objectFit: "contain" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                </div>
                <span style={{ ...typography.buttonSmall, color: TEXT_SECONDARY, textAlign: "center" }}>
                  {bank.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="shrink-0"
          style={{ boxShadow: bankAtBottom ? "none" : ELEVATION_ABOVE, transition: "box-shadow 200ms ease" }}
        >
          <div style={{ padding: `${SPACE_M}px ${SPACE_L}px`, backgroundColor: BG_PRIMARY }}>
            <button
              type="button"
              onClick={selectedBank ? () => goTo("otp") : undefined}
              style={{
                width: "100%",
                height: 48,
                borderRadius: RADIUS_CIRCLE,
                backgroundColor: selectedBank ? VALENTINO_500 : BG_DISABLED,
                border: "none",
                cursor: selectedBank ? "pointer" : "default",
                ...typography.buttonNormal,
                color: selectedBank ? BG_PRIMARY : TEXT_DISABLED,
              }}
            >
              Continue
            </button>
          </div>
          <GestureNav />
        </div>
      </div>
    );
  }

  // ── OTP ──────────────────────────────────────────────────────

  function renderOtp() {
    return (
      <div
        className="h-full w-full flex flex-col"
        style={{ backgroundColor: BG_PRIMARY }}
      >
        <StatusBar backgroundColor="transparent" />

        {/* App bar */}
        <div
          className="flex items-center shrink-0"
          style={{ height: 64, paddingLeft: SPACE_S, paddingRight: SPACE_XS, paddingTop: SPACE_XS, paddingBottom: SPACE_XS }}
        >
          <button
            type="button"
            onClick={goBack}
            className="flex items-center justify-center"
            style={{ width: 48, height: 48, background: "none", border: "none", cursor: "pointer", padding: 12 }}
          >
            <BackIcon />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1" style={{ padding: `0 ${SPACE_L}px` }}>
          {/* Header */}
          <div style={{ marginTop: SPACE_XL, display: "flex", flexDirection: "column", gap: SPACE_S }}>
            <h1 style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0 }}>
              OTP
            </h1>
            <p style={{ ...typography.bodyNormal, color: TEXT_TERTIARY, margin: 0 }}>
              Sent to +91 8765667213
            </p>
          </div>

          {/* Input field — underlined */}
          <div style={{ marginTop: SPACE_2XL, paddingTop: SPACE_S }}>
            <div className="flex items-center" style={{ gap: SPACE_S }}>
              <input
                type="tel"
                maxLength={OTP_LENGTH}
                placeholder="Enter OTP received"
                value={otpValue}
                onChange={(e) => { setOtpValue(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH)); if (otpErrored) setOtpErrored(false); }}
                style={{
                  ...typography.bodyNormal,
                  color: TEXT_PRIMARY,
                  flex: 1,
                  minWidth: 0,
                  border: "none",
                  outline: "none",
                  padding: 0,
                  background: "transparent",
                }}
              />
              {otpValue.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setOtpValue(""); setOtpErrored(false); }}
                  aria-label="Clear OTP"
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 24, height: 24, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <CloseIcon />
                </button>
              )}
            </div>
            <div
              style={{
                height: otpErrored || otpValue.length > 0 ? 2 : 1,
                backgroundColor: otpErrored ? RED_500 : otpValue.length > 0 ? VALENTINO_500 : OUTLINE_SUBTLE,
                marginTop: SPACE_S,
              }}
            />
            {otpErrored && (
              <p style={{ ...typography.caption, color: RED_500, margin: 0, marginTop: SPACE_S, letterSpacing: "0.04em" }}>
                {AA_OTP_ERROR}
              </p>
            )}
          </div>

          {/* Resend */}
          {otpResendLeft > 0 ? (
            <p style={{ ...typography.buttonNormal, color: TEXT_DISABLED, margin: 0, marginTop: SPACE_2XL, opacity: 0.6 }}>
              Resend in 00:{otpResendLeft.toString().padStart(2, "0")}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setOtpResendLeft(OTP_RESEND_SECONDS)}
              style={{
                ...typography.buttonNormal,
                color: VALENTINO_500,
                margin: 0,
                marginTop: SPACE_2XL,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                textAlign: "left",
              }}
            >
              Resend OTP
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0">
          <div style={{ paddingTop: SPACE_M, paddingBottom: SPACE_L, paddingLeft: SPACE_L, paddingRight: SPACE_L, backgroundColor: BG_PRIMARY }}>
            {/* T&C text */}
            <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: 0, textAlign: "center", marginBottom: SPACE_2XS }}>
              By continuing, you accept Onemoney{" "}
              <span style={{ color: VALENTINO_500 }}>T&C</span>
            </p>
            {(() => {
              const enabled = otpValue.length === OTP_LENGTH && !otpErrored;
              return (
                <button
                  type="button"
                  onClick={enabled ? () => goTo("consent") : undefined}
                  style={{
                    width: "100%",
                    height: 48,
                    borderRadius: RADIUS_CIRCLE,
                    backgroundColor: enabled ? VALENTINO_500 : BG_DISABLED,
                    border: "none",
                    cursor: enabled ? "pointer" : "default",
                    ...typography.buttonNormal,
                    color: enabled ? BG_PRIMARY : TEXT_DISABLED,
                  }}
                >
                  Continue
                </button>
              );
            })()}
          </div>
          <GestureNav />
        </div>
      </div>
    );
  }

  // ── No accounts found ──────────────────────────────────────

  function renderNoAccounts() {
    return (
      <div
        className="h-full w-full flex flex-col"
        style={{ backgroundColor: BG_PRIMARY }}
      >
        <StatusBar backgroundColor="transparent" />

        {/* App bar — back + Skip */}
        <div
          className="flex items-center shrink-0"
          style={{ height: 64, paddingLeft: SPACE_S, paddingRight: SPACE_L, paddingTop: SPACE_XS, paddingBottom: SPACE_XS }}
        >
          <button
            type="button"
            onClick={goBack}
            className="flex items-center justify-center"
            style={{ width: 48, height: 48, background: "none", border: "none", cursor: "pointer", padding: 12 }}
          >
            <BackIcon />
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => onClose?.()}
            style={{
              ...typography.buttonSmall,
              color: VALENTINO_500,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: SPACE_XS,
            }}
          >
            Skip
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: `0 ${SPACE_L}px` }}>
          {/* Header */}
          <div style={{ marginTop: SPACE_XL, display: "flex", flexDirection: "column", gap: SPACE_S }}>
            <h1 style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0 }}>
              {AA_NO_ACCOUNTS.title}
            </h1>
            <p style={{ ...typography.bodyNormal, color: TEXT_TERTIARY, margin: 0 }}>
              {AA_NO_ACCOUNTS.subtitle}
            </p>
          </div>

          {noAccountsHasAlternates ? (
            <>
              {/* Inline Change phone number link */}
              <button
                type="button"
                onClick={() => goTo("phone-number")}
                className="flex items-center"
                style={{
                  gap: SPACE_S,
                  marginTop: SPACE_M,
                  padding: 0,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <PhoneIcon color={VALENTINO_500} />
                <span style={{ ...typography.buttonNormal, color: VALENTINO_500 }}>
                  {AA_NO_ACCOUNTS.primaryCta}
                </span>
              </button>

              {/* Other accounts found */}
              <div style={{ marginTop: SPACE_2XL, display: "flex", flexDirection: "column", gap: SPACE_2XS }}>
                <h2 style={{ ...typography.headerH3, color: TEXT_PRIMARY, margin: 0 }}>
                  {AA_NO_ACCOUNTS.alternatesHeading}
                </h2>
                <p style={{ ...typography.bodySmall, color: TEXT_TERTIARY, margin: 0 }}>
                  {AA_NO_ACCOUNTS.alternatesSubtitle}
                </p>
              </div>

              <div style={{ marginTop: SPACE_M, display: "flex", flexDirection: "column", gap: SPACE_M, paddingBottom: SPACE_2XL }}>
                {AA_NO_ACCOUNTS.alternates.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => goTo("consent")}
                    className="flex items-center"
                    style={{
                      backgroundColor: BG_CARD,
                      border: `1px solid ${OUTLINE_SUBTLE}`,
                      borderRadius: RADIUS_M,
                      padding: SPACE_M,
                      gap: SPACE_M,
                      cursor: "pointer",
                      width: "100%",
                      textAlign: "left",
                    }}
                  >
                    <div
                      className="flex items-center justify-center shrink-0 overflow-hidden"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: RADIUS_CIRCLE,
                        backgroundColor: BG_CARD,
                        border: `1px solid ${OUTLINE_SUBTLE}`,
                      }}
                    >
                      <img src={a.logo} alt="" width={28} height={28} style={{ objectFit: "contain" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, margin: 0 }}>
                        {a.accountMasked} · {a.accountType}
                      </p>
                      <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: 0 }}>
                        {a.bankLabel}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* Empty state — illustration */
            <div
              className="flex items-center justify-center"
              style={{ marginTop: SPACE_2XL, paddingTop: SPACE_2XL, paddingBottom: SPACE_2XL }}
            >
              <img
                src={AA_NO_ACCOUNTS.illustration}
                alt=""
                style={{ width: 240, height: 240 / AA_NO_ACCOUNTS.illustrationAspect, objectFit: "contain" }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}
        </div>

        {/* Footer — Change phone number (empty state only) */}
        {!noAccountsHasAlternates && (
          <div className="shrink-0">
            <div style={{ padding: `${SPACE_M}px ${SPACE_L}px`, backgroundColor: BG_PRIMARY }}>
              <button
                type="button"
                onClick={() => goTo("phone-number")}
                style={{
                  width: "100%",
                  height: 48,
                  borderRadius: RADIUS_CIRCLE,
                  backgroundColor: VALENTINO_500,
                  border: "none",
                  cursor: "pointer",
                  ...typography.buttonNormal,
                  color: BG_PRIMARY,
                }}
              >
                {AA_NO_ACCOUNTS.primaryCta}
              </button>
            </div>
            <GestureNav />
          </div>
        )}
        {noAccountsHasAlternates && <GestureNav />}
      </div>
    );
  }

  // ── Phone number ───────────────────────────────────────────

  function renderPhoneNumber() {
    const enabled = phoneValue.length === AA_PHONE.length;
    return (
      <div
        className="h-full w-full flex flex-col"
        style={{ backgroundColor: BG_PRIMARY }}
      >
        <StatusBar backgroundColor="transparent" />

        {/* App bar */}
        <div
          className="flex items-center shrink-0"
          style={{ height: 64, paddingLeft: SPACE_S, paddingRight: SPACE_XS, paddingTop: SPACE_XS, paddingBottom: SPACE_XS }}
        >
          <button
            type="button"
            onClick={goBack}
            className="flex items-center justify-center"
            style={{ width: 48, height: 48, background: "none", border: "none", cursor: "pointer", padding: 12 }}
          >
            <BackIcon />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1" style={{ padding: `0 ${SPACE_L}px` }}>
          <div style={{ marginTop: SPACE_XL, display: "flex", flexDirection: "column", gap: SPACE_S }}>
            <h1 style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0 }}>
              {AA_PHONE.title}
            </h1>
            <p style={{ ...typography.bodyNormal, color: TEXT_TERTIARY, margin: 0 }}>
              {AA_PHONE.subtitle}
            </p>
          </div>

          {/* Phone input — prefix + input + clear */}
          <div style={{ marginTop: SPACE_2XL, paddingTop: SPACE_S }}>
            <div className="flex items-center" style={{ gap: SPACE_2XS }}>
              <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY }}>{AA_PHONE.prefix}</span>
              <input
                type="tel"
                maxLength={AA_PHONE.length}
                placeholder={AA_PHONE.placeholder}
                value={phoneValue}
                onChange={(e) => setPhoneValue(e.target.value.replace(/\D/g, "").slice(0, AA_PHONE.length))}
                style={{
                  ...typography.bodyNormal,
                  color: TEXT_PRIMARY,
                  flex: 1,
                  minWidth: 0,
                  border: "none",
                  outline: "none",
                  padding: 0,
                  background: "transparent",
                }}
              />
              {phoneValue.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPhoneValue("")}
                  aria-label="Clear phone"
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 24, height: 24, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <CloseIcon />
                </button>
              )}
            </div>
            <div
              style={{
                height: phoneValue.length > 0 ? 2 : 1,
                backgroundColor: phoneValue.length > 0 ? VALENTINO_500 : OUTLINE_SUBTLE,
                marginTop: SPACE_S,
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0">
          <div style={{ padding: `${SPACE_M}px ${SPACE_L}px`, backgroundColor: BG_PRIMARY }}>
            <button
              type="button"
              onClick={enabled ? () => goTo("otp") : undefined}
              style={{
                width: "100%",
                height: 48,
                borderRadius: RADIUS_CIRCLE,
                backgroundColor: enabled ? VALENTINO_500 : BG_DISABLED,
                border: "none",
                cursor: enabled ? "pointer" : "default",
                ...typography.buttonNormal,
                color: enabled ? BG_PRIMARY : TEXT_DISABLED,
              }}
            >
              Continue
            </button>
          </div>
          <GestureNav />
        </div>
      </div>
    );
  }

  // ── Consent ─────────────────────────────────────────────────

  function renderConsent() {
    return (
      <div
        className="h-full w-full flex flex-col"
        style={{ backgroundColor: BG_PRIMARY }}
      >
        <StatusBar backgroundColor="transparent" />

        {/* App bar — back + Skip */}
        <div
          className="flex items-center shrink-0"
          style={{
            height: 64,
            paddingLeft: SPACE_S,
            paddingRight: SPACE_L,
            paddingTop: SPACE_XS,
            paddingBottom: SPACE_XS,
          }}
        >
          <button
            type="button"
            onClick={goBack}
            className="flex items-center justify-center"
            style={{ width: 48, height: 48, background: "none", border: "none", cursor: "pointer", padding: 12 }}
          >
            <BackIcon />
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => onClose?.()}
            style={{
              ...typography.buttonSmall,
              color: VALENTINO_500,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: SPACE_XS,
            }}
          >
            Skip
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: `0 ${SPACE_L}px` }}>
          {/* Header */}
          <h1 style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0, marginTop: SPACE_XL }}>
            Approve consent
          </h1>

          {/* Account row */}
          <div className="flex items-center" style={{ gap: SPACE_S, paddingTop: SPACE_M, paddingBottom: SPACE_M }}>
            <div
              className="flex items-center justify-center shrink-0 overflow-hidden"
              style={{
                width: 40,
                height: 40,
                borderRadius: RADIUS_CIRCLE,
                backgroundColor: BG_CARD,
                border: `1px solid ${OUTLINE_SUBTLE}`,
              }}
            >
              <img src="/icons/banks/hdfc.png" alt="" width={28} height={28} style={{ objectFit: "contain" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            </div>
            <div>
              <p style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, margin: 0 }}>HDFC xx6543</p>
              <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: 0 }}>Savings</p>
            </div>
          </div>

          {/* Consent cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: SPACE_M, marginTop: SPACE_XS }}>
            {AA_CONSENT_CARDS.map((card, i) => (
              <div
                key={card.title}
                onClick={() => { setConsentDetailIdx(i); goTo("consent-detail"); }}
                style={{
                  cursor: "pointer",
                  backgroundColor: BG_CARD,
                  border: `1px solid ${OUTLINE_SUBTLE}`,
                  borderRadius: RADIUS_M,
                  boxShadow: ELEVATION_CARD,
                  padding: `${SPACE_L}px ${SPACE_L}px ${SPACE_M}px`,
                  position: "relative",
                }}
              >
                {/* Chevron */}
                <div style={{ position: "absolute", top: SPACE_L, right: SPACE_L }}>
                  <ChevronRightIcon />
                </div>

                {/* Title + subtitle */}
                <div style={{ display: "flex", flexDirection: "column", gap: SPACE_XS }}>
                  <p style={{ ...typography.headerH4, color: TEXT_PRIMARY, margin: 0 }}>{card.title}</p>
                  <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: 0 }}>{card.subtitle}</p>
                </div>

                {/* Key-value pairs */}
                <div className="flex" style={{ gap: SPACE_L, marginTop: SPACE_M }}>
                  {card.details.map((d) => (
                    <div key={d.label} style={{ display: "flex", flexDirection: "column", gap: SPACE_2XS, paddingTop: SPACE_XS, paddingBottom: SPACE_XS }}>
                      <p style={{ ...typography.caption, color: TEXT_SECONDARY, margin: 0 }}>{d.label}</p>
                      <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY, margin: 0 }}>{d.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer — Approve + Onemoney logo */}
        <div className="shrink-0">
          <div style={{ padding: `${SPACE_M}px ${SPACE_L}px`, backgroundColor: BG_PRIMARY }}>
            <button
              type="button"
              onClick={() => onComplete?.()}
              style={{
                width: "100%",
                height: 48,
                borderRadius: RADIUS_CIRCLE,
                backgroundColor: VALENTINO_500,
                border: "none",
                cursor: "pointer",
                ...typography.buttonNormal,
                color: BG_PRIMARY,
              }}
            >
              Approve
            </button>
          </div>
          <div className="flex items-center justify-center" style={{ paddingTop: SPACE_XS, paddingBottom: SPACE_XS, backgroundColor: BG_PRIMARY }}>
            <img src={ONEMONEY_LOGO} alt="Onemoney" style={{ height: 16, width: "auto", objectFit: "contain" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          </div>
          <GestureNav />
        </div>
      </div>
    );
  }

  // ── Consent Detail ──────────────────────────────────────────

  function renderConsentDetail() {
    const detail = AA_CONSENT_DETAILS[consentDetailIdx];
    return (
      <div
        className="h-full w-full flex flex-col"
        style={{ backgroundColor: BG_PRIMARY }}
      >
        <StatusBar backgroundColor="transparent" />

        {/* App bar — X close + title */}
        <div
          className="flex items-center shrink-0"
          style={{ height: 64, paddingLeft: SPACE_S, paddingRight: SPACE_XS, paddingTop: SPACE_XS, paddingBottom: SPACE_XS }}
        >
          <button
            type="button"
            onClick={() => goTo("consent")}
            className="flex items-center justify-center"
            style={{ width: 48, height: 48, background: "none", border: "none", cursor: "pointer", padding: 12 }}
          >
            <CloseIcon />
          </button>
          <span
            style={{
              ...typography.headerH3,
              color: TEXT_PRIMARY,
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {detail.title}
          </span>
        </div>

        {/* List rows */}
        <div className="flex-1 overflow-y-auto">
          {detail.rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center"
              style={{ padding: `${SPACE_M}px ${SPACE_L}px`, gap: SPACE_M }}
            >
              {/* Row icon */}
              <div className="shrink-0" style={{ width: 24, height: 24 }}>
                {CONSENT_ROW_ICONS[row.label] ?? <DocumentIcon />}
              </div>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p style={{ ...typography.caption, color: TEXT_SECONDARY, margin: 0 }}>{row.label}</p>
                <p style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, margin: 0 }}>{row.value}</p>
              </div>
              {/* Info icon — opens bottom sheet */}
              {(row as { hasInfo?: boolean }).hasInfo && (
                <button
                  type="button"
                  onClick={() => setInfoSheet((row as { tooltipKey?: string }).tooltipKey ?? row.label)}
                  aria-label={`More info about ${row.label}`}
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 24, height: 24, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <InfoIcon color={TEXT_TERTIARY} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Onemoney logo + gesture nav */}
        <div className="shrink-0">
          <div className="flex items-center justify-center" style={{ paddingBottom: SPACE_M, backgroundColor: BG_PRIMARY }}>
            <img src={ONEMONEY_LOGO} alt="Onemoney" style={{ height: 16, width: "auto", objectFit: "contain" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          </div>
          <GestureNav />
        </div>
      </div>
    );
  }

  // ── Router ───────────────────────────────────────────────────

  function renderScreen(s: Screen) {
    switch (s) {
      case "value-prop": return renderValueProp();
      case "learn-more": return renderLearnMore();
      case "bank-select": return renderBankSelect();
      case "otp": return renderOtp();
      case "no-accounts": return renderNoAccounts();
      case "phone-number": return renderPhoneNumber();
      case "consent": return renderConsent();
      case "consent-detail": return renderConsentDetail();
    }
  }

  // Push: both screens slide left/right together.
  // Present (up): new screen slides up over old (old stays still).
  // Dismiss (down): old screen slides down revealing new (new stays still).
  const isPresent = direction === "up";
  const isDismiss = direction === "down";
  const isVertical = isPresent || isDismiss;

  const isMoving = phase !== "idle";

  function getOutgoingStyle(): React.CSSProperties {
    if (isPresent) {
      // Old screen stays still underneath
      return { position: "absolute", inset: 0, zIndex: 0 };
    }
    if (isDismiss) {
      // Old screen (the modal) slides down to dismiss
      return {
        position: "absolute", inset: 0, zIndex: 1,
        transform: phase === "go" ? "translateY(100%)" : "translateY(0)",
        transition: phase === "go" ? `transform ${DURATION}ms ${EASE}` : "none",
      };
    }
    // Push: old screen slides out horizontally
    const exitTo = direction === "left" ? "-100%" : "100%";
    return {
      position: "absolute", inset: 0,
      transform: phase === "go" ? `translateX(${exitTo})` : "translateX(0)",
      transition: phase === "go" ? `transform ${DURATION}ms ${EASE}` : "none",
    };
  }

  function getIncomingStyle(): React.CSSProperties {
    if (isPresent) {
      // New screen slides up from bottom
      return {
        position: "absolute", inset: 0, zIndex: 1,
        transform: phase === "prep" ? "translateY(100%)" : "translateY(0)",
        transition: phase === "go" ? `transform ${DURATION}ms ${EASE}` : "none",
      };
    }
    if (isDismiss) {
      // New screen just sits still underneath
      return { position: "absolute", inset: 0, zIndex: 0 };
    }
    // Push: new screen slides in horizontally
    const enterFrom = direction === "left" ? "100%" : "-100%";
    return {
      position: "absolute", inset: 0,
      transform: phase === "prep" ? `translateX(${enterFrom})` : "translateX(0)",
      transition: phase === "go" ? `transform ${DURATION}ms ${EASE}` : "none",
    };
  }

  const sheet = infoSheet ? AA_INFO_TOOLTIPS[infoSheet] : null;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Outgoing screen */}
      {isMoving && prevScreen && (
        <div style={getOutgoingStyle()}>
          {renderScreen(prevScreen)}
        </div>
      )}
      {/* Current screen */}
      <div style={getIncomingStyle()}>
        {renderScreen(screen)}
      </div>

      {/* Info bottom sheet */}
      {sheet && (
        <>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setInfoSheet(null)}
            style={{
              position: "absolute", inset: 0,
              backgroundColor: ALPHA_BLACK_50,
              border: "none", padding: 0, cursor: "pointer",
              zIndex: 2,
              animation: `aaScrimIn ${DURATION}ms ${EASE}`,
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "absolute", left: 0, right: 0, bottom: 0,
              backgroundColor: BG_PRIMARY,
              borderTopLeftRadius: RADIUS_L,
              borderTopRightRadius: RADIUS_L,
              padding: `${SPACE_L}px ${SPACE_L}px ${SPACE_2XL}px`,
              boxShadow: ELEVATION_ABOVE,
              zIndex: 3,
              animation: `aaSheetIn ${DURATION}ms ${EASE}`,
            }}
          >
            <h2 style={{ ...typography.headerH3, color: TEXT_PRIMARY, margin: 0 }}>{sheet.title}</h2>
            <p style={{ ...typography.bodyNormal, color: TEXT_TERTIARY, margin: 0, marginTop: SPACE_S }}>{sheet.body}</p>
          </div>
          <style>{`
            @keyframes aaScrimIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes aaSheetIn { from { transform: translateY(100%); } to { transform: translateY(0); } }
          `}</style>
        </>
      )}
    </div>
  );
}
