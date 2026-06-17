"use client";

import React, { useState, useCallback, useEffect } from "react";
import { typography } from "../lib/typography";
import {
  VALENTINO_500,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, TEXT_DISABLED,
  BG_PRIMARY, BG_CARD, BG_DISABLED, OUTLINE_SUBTLE, OUTLINE_BOLD,
  ALPHA_BLACK_50, ALPHA_WHITE_FF,
} from "../lib/colors";
import { SPACE_2XS, SPACE_XS, SPACE_S, SPACE_M, SPACE_L, SPACE_XL, SPACE_2XL } from "../lib/spacing";
import { RADIUS_L, RADIUS_M, RADIUS_CIRCLE } from "../lib/radii";
import { ELEVATION_CARD, ELEVATION_ABOVE } from "../lib/elevation";
import { StatusBar, GestureNav } from "../components/AppChrome";
import InputField from "../components/InputField";
import OtpInput from "../components/OtpInput";
import ListItemControl from "../components/ListItemControl";
import { AA_BENEFITS, AA_LEARN_MORE, AA_CONSENT_CARDS, AA_CONSENT_DETAILS, AA_INFO_TOOLTIPS, AA_PHONE, AA_NO_ACCOUNTS, AA_OTP_ERROR, AA_FETCHED_ACCOUNTS, ONEMONEY_LOGO } from "./fixtures/onboardingFixture";

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
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M15 6l-6 6 6 6" stroke={TEXT_PRIMARY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

function InfoIcon({ color = TEXT_TERTIARY, size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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

const SCREENS = ["value-prop", "learn-more", "otp", "select-accounts", "no-accounts", "phone-number", "consent", "consent-detail"] as const;
type Screen = (typeof SCREENS)[number];
type OtpContext = "discovery" | "confirm";
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
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  // Accounts carried into the consent screen (from select-accounts or alternates).
  const [consentAccounts, setConsentAccounts] = useState<typeof AA_FETCHED_ACCOUNTS>([]);
  const [otpContext, setOtpContext] = useState<OtpContext>("discovery");
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

  // Enter the OTP screen for account discovery (after value prop / phone number).
  const goToDiscoveryOtp = useCallback(() => {
    setOtpContext("discovery");
    setOtpValue("");
    setOtpErrored(false);
    goTo("otp");
  }, [goTo]);

  // Enter the OTP screen to confirm consent (after Approve).
  const goToConfirmOtp = useCallback(() => {
    setOtpContext("confirm");
    setOtpValue("");
    setOtpErrored(false);
    goTo("otp");
  }, [goTo]);

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
          style={{ height: 64, paddingLeft: 12, paddingRight: SPACE_XS, paddingTop: SPACE_XS, paddingBottom: SPACE_XS }}
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
        <div style={{ paddingLeft: SPACE_L, paddingRight: SPACE_L, marginTop: SPACE_L - 4 }}>
          <h1 style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0, marginLeft: 4 }}>
            Link your accounts
          </h1>
        </div>

        {/* Benefit rows */}
        <div
          className="flex-1"
          style={{
            marginTop: 56,
            display: "flex",
            flexDirection: "column",
            gap: SPACE_XL,
            paddingLeft: SPACE_L,
            paddingRight: SPACE_L,
          }}
        >
          {AA_BENEFITS.map((benefit, i) => (
            <div
              key={benefit.title}
              className="flex items-start"
              style={{ gap: SPACE_S }}
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
            <Fab onClick={goToDiscoveryOtp} />
          </div>
          <GestureNav />
        </div>
      </div>
    );
  }

  // ── Learn More ──────────────────────────────────────────────

  const LEARN_MORE_ICONS = [
    <LockIcon key="lock" color={TEXT_TERTIARY} />,
    <ThumbsUpIcon key="thumbs" color={TEXT_TERTIARY} />,
    <ShieldIcon key="shield" color={TEXT_TERTIARY} />,
    <HandIcon key="hand" color={TEXT_TERTIARY} />,
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
          style={{ height: 64, paddingLeft: 12, paddingRight: SPACE_XS, paddingTop: SPACE_XS, paddingBottom: SPACE_XS }}
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
        <div className="flex-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ padding: `0 ${SPACE_L}px` }}>
          {/* Header */}
          <div style={{ marginTop: SPACE_L - 4, display: "flex", flexDirection: "column", gap: SPACE_2XS }}>
            <h1 style={{ ...typography.headerH2, color: TEXT_PRIMARY, margin: 0, marginLeft: 4 }}>
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
                    backgroundColor: ALPHA_WHITE_FF,
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

  const [acctScrolled, setAcctScrolled] = useState(false);
  const [acctAtBottom, setAcctAtBottom] = useState(true);
  const acctScrollRef = useCallback((el: HTMLDivElement | null) => {
    if (el) setAcctAtBottom(el.scrollHeight <= el.clientHeight + 2);
  }, []);

  const toggleAccount = useCallback((id: string) => {
    setSelectedAccountIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  }, []);

  function renderSelectAccounts() {
    const canConfirm = selectedAccountIds.length >= 1;
    return (
      <div
        className="h-full w-full flex flex-col"
        style={{ backgroundColor: BG_PRIMARY }}
      >
        <StatusBar backgroundColor="transparent" />

        {/* App bar — soft fade (below) replaces the hard shadow line on scroll */}
        <div
          className="flex items-center shrink-0"
          style={{
            height: 64,
            paddingLeft: SPACE_S,
            paddingRight: SPACE_XS,
            paddingTop: SPACE_XS,
            paddingBottom: SPACE_XS,
            backgroundColor: BG_PRIMARY,
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

        {/* Scrollable content: header + account list */}
        <div
          ref={acctScrollRef}
          className="flex-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          onScroll={(e) => {
            const el = e.target as HTMLDivElement;
            setAcctScrolled(el.scrollTop > 40);
            setAcctAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 2);
          }}
        >
          {/* Top fade — content softly fades under the app bar instead of a sharp
              line. Sticky + negative margin so it overlays without taking space. */}
          <div
            aria-hidden="true"
            style={{
              position: "sticky",
              top: 0,
              height: 32,
              marginBottom: -32,
              zIndex: 2,
              pointerEvents: "none",
              background: `linear-gradient(to bottom, ${BG_PRIMARY} 0%, transparent 100%)`,
              opacity: acctScrolled ? 1 : 0,
              transition: "opacity 200ms ease",
            }}
          />
          {/* Header */}
          <div style={{ paddingLeft: SPACE_L, paddingRight: SPACE_L, marginTop: SPACE_L - 4, display: "flex", flexDirection: "column", gap: SPACE_XS }}>
            <h1 style={{ ...typography.headerH2, color: TEXT_PRIMARY, margin: 0, marginLeft: 4 }}>
              Link bank accounts
            </h1>
            <p style={{ ...typography.bodyNormal, color: TEXT_TERTIARY, margin: 0 }}>
              Choose the accounts you&apos;d like to link
            </p>
          </div>

          {/* Account list */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: SPACE_M,
              padding: `${SPACE_L}px ${SPACE_L}px ${SPACE_2XL}px`,
            }}
          >
            {AA_FETCHED_ACCOUNTS.map((acct) => (
              <ListItemControl
                key={acct.id}
                card
                kind="none"
                selected={selectedAccountIds.includes(acct.id)}
                onSelect={() => toggleAccount(acct.id)}
                title={`${acct.accountMasked} • ${acct.accountType}`}
                subtext={acct.bankLabel}
                leading={
                  <div
                    className="flex items-center justify-center shrink-0 overflow-hidden"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: RADIUS_CIRCLE,
                      backgroundColor: ALPHA_WHITE_FF,
                      border: `1.2px solid ${OUTLINE_SUBTLE}`,
                    }}
                  >
                    <img src={acct.logo} alt="" width={28} height={28} style={{ objectFit: "contain" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  </div>
                }
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="shrink-0"
          style={{ boxShadow: acctAtBottom ? "none" : ELEVATION_ABOVE, transition: "box-shadow 200ms ease" }}
        >
          <div style={{ padding: `${SPACE_M}px ${SPACE_L}px`, backgroundColor: BG_PRIMARY }}>
            <button
              type="button"
              onClick={canConfirm ? () => {
                setConsentAccounts(AA_FETCHED_ACCOUNTS.filter((a) => selectedAccountIds.includes(a.id)));
                goTo("consent");
              } : undefined}
              style={{
                width: "100%",
                height: 48,
                borderRadius: RADIUS_CIRCLE,
                backgroundColor: canConfirm ? VALENTINO_500 : BG_DISABLED,
                border: "none",
                cursor: canConfirm ? "pointer" : "default",
                ...typography.buttonNormal,
                color: canConfirm ? ALPHA_WHITE_FF : TEXT_DISABLED,
              }}
            >
              Confirm
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
          style={{ height: 64, paddingLeft: 12, paddingRight: SPACE_XS, paddingTop: SPACE_XS, paddingBottom: SPACE_XS }}
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
          <div style={{ marginTop: SPACE_L, display: "flex", flexDirection: "column", gap: SPACE_XS }}>
            <h1 style={{ ...typography.headerH2, color: TEXT_PRIMARY, margin: 0, marginLeft: 4 }}>
              OTP
            </h1>
            <p style={{ ...typography.bodyNormal, color: TEXT_TERTIARY, margin: 0 }}>
              Sent to +91 8765667213
            </p>
          </div>

          {/* OTP - segmented DLS input */}
          <div style={{ marginTop: SPACE_2XL, paddingTop: SPACE_S }}>
            <OtpInput
              length={OTP_LENGTH}
              value={otpValue}
              onChange={(v) => {
                setOtpValue(v);
                if (otpErrored) setOtpErrored(false);
              }}
              status={otpErrored ? "error" : "default"}
              errorText={AA_OTP_ERROR}
              autoFocus
            />
          </div>

          {/* Resend — one button, disabled (muted, no pointer) through the cooldown
              with the timer in its label, then enabled (Valentino) once it's up. */}
          <button
            type="button"
            disabled={otpResendLeft > 0}
            onClick={() => setOtpResendLeft(OTP_RESEND_SECONDS)}
            style={{
              ...typography.buttonNormal,
              color: otpResendLeft > 0 ? TEXT_DISABLED : VALENTINO_500,
              margin: 0,
              marginTop: SPACE_2XL,
              background: "none",
              border: "none",
              cursor: otpResendLeft > 0 ? "default" : "pointer",
              padding: 0,
              textAlign: "left",
            }}
          >
            {otpResendLeft > 0
              ? `Resend OTP in 00:${otpResendLeft.toString().padStart(2, "0")}`
              : "Resend OTP"}
          </button>
        </div>

        {/* Footer */}
        <div className="shrink-0">
          <div style={{ paddingTop: SPACE_M, paddingBottom: SPACE_L, paddingLeft: SPACE_L, paddingRight: SPACE_L, backgroundColor: BG_PRIMARY }}>
            {/* T&C text */}
            <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: 0, textAlign: "center", marginBottom: SPACE_M }}>
              By continuing, you accept Onemoney{" "}
              <span style={{ color: VALENTINO_500 }}>T&C</span>
            </p>
            {(() => {
              const enabled = otpValue.length === OTP_LENGTH && !otpErrored;
              const onContinue = otpContext === "confirm"
                ? () => onComplete?.()
                : () => goTo("select-accounts");
              return (
                <button
                  type="button"
                  onClick={enabled ? onContinue : undefined}
                  style={{
                    width: "100%",
                    height: 48,
                    borderRadius: RADIUS_CIRCLE,
                    backgroundColor: enabled ? VALENTINO_500 : BG_DISABLED,
                    border: "none",
                    cursor: enabled ? "pointer" : "default",
                    ...typography.buttonNormal,
                    color: enabled ? ALPHA_WHITE_FF : TEXT_DISABLED,
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

        {/* App bar - back + Skip */}
        <div
          className="flex items-center shrink-0"
          style={{ height: 64, paddingLeft: 12, paddingRight: SPACE_L, paddingTop: SPACE_XS, paddingBottom: SPACE_XS }}
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
        <div className="flex-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ padding: `0 ${SPACE_L}px` }}>
          {/* Header */}
          <div style={{ marginTop: SPACE_L - 4, display: "flex", flexDirection: "column", gap: SPACE_XS }}>
            <h1 style={{ ...typography.headerH2, color: TEXT_PRIMARY, margin: 0, marginLeft: 4 }}>
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
                  marginTop: SPACE_S,
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
              <div style={{ marginTop: SPACE_XL, display: "flex", flexDirection: "column", gap: SPACE_2XS }}>
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
                    onClick={() => { setConsentAccounts([a]); goTo("consent"); }}
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
                        backgroundColor: ALPHA_WHITE_FF,
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
            /* Empty state - illustration */
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

        {/* Footer - Change phone number (empty state only) */}
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
                  color: ALPHA_WHITE_FF,
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
          style={{ height: 64, paddingLeft: 12, paddingRight: SPACE_XS, paddingTop: SPACE_XS, paddingBottom: SPACE_XS }}
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
          <div style={{ marginTop: SPACE_L - 4, display: "flex", flexDirection: "column", gap: SPACE_XS }}>
            <h1 style={{ ...typography.headerH2, color: TEXT_PRIMARY, margin: 0, marginLeft: 4 }}>
              {AA_PHONE.title}
            </h1>
            <p style={{ ...typography.bodyNormal, color: TEXT_TERTIARY, margin: 0 }}>
              {AA_PHONE.subtitle}
            </p>
          </div>

          {/* Phone input - DLS underlined input with leading prefix */}
          <div style={{ marginTop: SPACE_2XL, paddingTop: SPACE_S }}>
            <InputField
              type="tel"
              inputMode="numeric"
              value={phoneValue}
              onChange={(v) => setPhoneValue(v.replace(/\D/g, "").slice(0, AA_PHONE.length))}
              placeholder={AA_PHONE.placeholder}
              leading={AA_PHONE.prefix}
              maxLength={AA_PHONE.length}
              onClear={() => setPhoneValue("")}
              ariaLabel="Phone number"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0">
          <div style={{ padding: `${SPACE_M}px ${SPACE_L}px`, backgroundColor: BG_PRIMARY }}>
            <button
              type="button"
              onClick={enabled ? goToDiscoveryOtp : undefined}
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

        {/* App bar - back + Deny */}
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
        <div className="flex-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ paddingLeft: SPACE_L, paddingRight: SPACE_L, paddingBottom: SPACE_XL }}>
          {/* Header */}
          <h1 style={{ ...typography.headerH2, color: TEXT_PRIMARY, margin: 0, marginTop: SPACE_L - 4, marginLeft: 4 }}>
            Approve consent
          </h1>

          {/* Linked accounts — grouped in a card so it reads as one block (no header). */}
          <div
            style={{
              marginTop: SPACE_L,
              backgroundColor: BG_CARD,
              border: `1px solid ${OUTLINE_SUBTLE}`,
              borderRadius: RADIUS_M,
              boxShadow: ELEVATION_CARD,
              padding: SPACE_L,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: SPACE_M }}>
              {consentAccounts.map((a) => (
                <div key={a.id} className="flex items-center" style={{ gap: SPACE_S }}>
                  <div
                    className="flex items-center justify-center shrink-0 overflow-hidden"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: RADIUS_CIRCLE,
                      backgroundColor: ALPHA_WHITE_FF,
                      border: `1px solid ${OUTLINE_SUBTLE}`,
                    }}
                  >
                    <img src={a.logo} alt="" width={20} height={20} style={{ objectFit: "contain" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  </div>
                  <div className="min-w-0">
                    <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY, margin: 0 }}>
                      {a.bankLabel.replace(/ Bank$/, "")} {a.accountMasked}
                    </p>
                    <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: 0 }}>{a.accountType}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consent cards — 20px below the accounts card */}
          <div style={{ display: "flex", flexDirection: "column", gap: SPACE_M, marginTop: SPACE_M + 4 }}>
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

                {/* Title + subtitle — 8px gap (line-height carries the rest) */}
                <div style={{ display: "flex", flexDirection: "column", gap: SPACE_XS, paddingRight: SPACE_L }}>
                  <p style={{ ...typography.headerH4, color: TEXT_PRIMARY, margin: 0 }}>{card.title}</p>
                  <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: 0 }}>{card.subtitle}</p>
                </div>

                {/* Key-value pairs — stacked rows with subtle dividers for clean hierarchy */}
                <div
                  style={{
                    marginTop: SPACE_M,
                    paddingTop: SPACE_XS,
                    borderTop: `1px solid ${OUTLINE_BOLD}`,
                  }}
                >
                  {card.details.map((d, di) => (
                    <div
                      key={d.label}
                      className="flex items-start justify-between"
                      style={{
                        gap: SPACE_M,
                        paddingTop: SPACE_S,
                        paddingBottom: SPACE_S,
                        borderTop: di > 0 ? `1px solid ${OUTLINE_BOLD}` : "none",
                      }}
                    >
                      <p style={{ ...typography.bodySmall, color: TEXT_SECONDARY, margin: 0, flexShrink: 0 }}>{d.label}</p>
                      <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY, margin: 0, textAlign: "right", flex: 1, minWidth: 0 }}>{d.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer - Approve + Onemoney logo */}
        <div className="shrink-0">
          <div style={{ padding: `${SPACE_M}px ${SPACE_L}px`, backgroundColor: BG_PRIMARY }}>
            <button
              type="button"
              onClick={goToConfirmOtp}
              style={{
                width: "100%",
                height: 48,
                borderRadius: RADIUS_CIRCLE,
                backgroundColor: VALENTINO_500,
                border: "none",
                cursor: "pointer",
                ...typography.buttonNormal,
                color: ALPHA_WHITE_FF,
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

        {/* App bar - X close + title */}
        <div
          className="flex items-center shrink-0"
          style={{ height: 64, paddingLeft: 12, paddingRight: SPACE_XS, paddingTop: SPACE_XS, paddingBottom: SPACE_XS }}
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
        <div className="flex-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
              {/* Text. For info rows the WHOLE label + value + icon is one tap
                  target that opens the sheet (with a press state); the icon sits
                  2px beside the value and the value wraps. */}
              {(row as { hasInfo?: boolean }).hasInfo ? (
                <button
                  type="button"
                  onClick={() => setInfoSheet((row as { tooltipKey?: string }).tooltipKey ?? row.label)}
                  aria-label={`More info about ${row.label}`}
                  className="flex-1 min-w-0 text-left transition-opacity active:opacity-60"
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                >
                  <span className="flex items-center" style={{ gap: 4 }}>
                    <p style={{ ...typography.caption, color: TEXT_SECONDARY, margin: 0 }}>{row.label}</p>
                    <span className="shrink-0 inline-flex items-center" style={{ width: 18, height: 18, position: "relative", top: -1 }}>
                      <InfoIcon color={TEXT_TERTIARY} size={12} />
                    </span>
                  </span>
                  <p style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, margin: 0 }}>{row.value}</p>
                </button>
              ) : (
                <div className="flex-1 min-w-0">
                  <p style={{ ...typography.caption, color: TEXT_SECONDARY, margin: 0 }}>{row.label}</p>
                  <p style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, margin: 0 }}>{row.value}</p>
                </div>
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
      case "select-accounts": return renderSelectAccounts();
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
