"use client";

import { useState, useRef } from "react";

export type InitialSuggestion = {
  id: string;
  title: string;
  subtitle: string;
  avatarBg: string;
  icon: React.ReactNode;
};

type Props = {
  suggestions: InitialSuggestion[];
  onSuggestionClick: (id: string, title: string) => void;
  onSubmit: (text: string) => void;
};

// ── Icons ──────────────────────────────────────────────────────────────────

function CrossIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="rgba(0,0,0,0.9)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4l4 4-4 4" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Purple – credit card
function CreditCardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="5.5" width="15" height="11" rx="1.5" stroke="#9333EA" strokeWidth="1.4" />
      <path d="M2.5 9h15" stroke="#9333EA" strokeWidth="1.4" />
      <rect x="4" y="12" width="4" height="1.5" rx="0.75" fill="#9333EA" />
    </svg>
  );
}

// Green – chart/spend
function SpendChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 13.5l3.5-3.5 2.5 2.5 4-5 3.5 3" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Blue – bank/savings
function BankIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3.5 8.5l6.5-5 6.5 5" stroke="#2563EB" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="5" y="9.5" width="2" height="5" rx="0.5" fill="#2563EB" />
      <rect x="9" y="9.5" width="2" height="5" rx="0.5" fill="#2563EB" />
      <rect x="13" y="9.5" width="2" height="5" rx="0.5" fill="#2563EB" />
      <path d="M3 14.5h14" stroke="#2563EB" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ChatInitialScreen({ suggestions, onSuggestionClick, onSubmit }: Props) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue("");
    onSubmit(text);
  };

  return (
    <div
      className="relative flex flex-col h-full bg-white overflow-hidden"
      style={{ fontFamily: "var(--font-rubik), sans-serif" }}
    >
      {/* ── App Bar ── */}
      {/* 64px tall, X icon at left:12 top:8 within a 48×48 touch area */}
      <div className="relative h-16 w-full bg-white shrink-0">
        <button
          className="absolute flex items-center justify-center rounded-full"
          style={{ left: 12, top: 8, width: 48, height: 48 }}
          onClick={() => {/* no-op on initial screen */}}
        >
          <CrossIcon />
        </button>
      </div>

      {/* ── Heading ── */}
      {/* top-[120px] in the 852px screen → roughly after app bar + some space */}
      <div className="shrink-0 px-8 pb-6">
        <h1
          style={{
            fontSize: 32,
            lineHeight: "40px",
            fontWeight: 500,
            color: "rgba(0,0,0,0.9)",
            letterSpacing: 0,
          }}
        >
          What&apos;s on your mind today?
        </h1>
      </div>

      {/* Spacer — pushes list to bottom half */}
      <div className="flex-1" />

      {/* ── Suggestion List ── */}
      {/* gap-8px between items, no outer padding */}
      <div className="shrink-0 flex flex-col gap-2">
        {suggestions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSuggestionClick(s.id, s.title)}
            className="w-full flex items-center bg-white active:bg-[#f9f9f9] transition-colors text-left"
            style={{ gap: 12, paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16 }}
          >
            {/* Avatar */}
            <div
              className="shrink-0 flex items-center justify-center rounded-full"
              style={{
                width: 40,
                height: 40,
                backgroundColor: s.avatarBg,
                border: "1px solid #eef2f5",
              }}
            >
              {s.icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 flex flex-col" style={{ gap: 4 }}>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: "24px",
                  fontWeight: 400,
                  color: "rgba(0,0,0,0.9)",
                  letterSpacing: "0.32px",
                }}
              >
                {s.title}
              </p>
              <p
                style={{
                  fontSize: 12,
                  lineHeight: "16px",
                  fontWeight: 400,
                  color: "rgba(0,0,0,0.4)",
                  letterSpacing: "0.24px",
                }}
              >
                {s.subtitle}
              </p>
            </div>

            {/* Chevron */}
            <div className="shrink-0">
              <ChevronRightIcon />
            </div>
          </button>
        ))}
      </div>

      {/* ── Type Box ── */}
      {/*
        Figma: bg white wrapper py-8px, inner pill w-328px h-48px
        outer bg #f9f9f9 border #eef2f5 rounded-40px
        inner Type bar bg #f6f9fc pl-16 pr-8 py-8 rounded-40px
        placeholder: Rubik Regular 14px lh-20px tracking-0.28px rgba(0,0,0,0.4)
      */}
      <div className="shrink-0 bg-white flex flex-col items-center" style={{ paddingTop: 8, paddingBottom: 8 }}>
        <div
          className="flex items-center overflow-hidden"
          style={{
            width: 328,
            height: 48,
            backgroundColor: "#f9f9f9",
            border: "1px solid #eef2f5",
            borderRadius: 40,
          }}
        >
          <div
            className="flex items-center w-full h-full"
            style={{
              backgroundColor: "#f6f9fc",
              borderRadius: 40,
              paddingLeft: 16,
              paddingRight: 8,
              paddingTop: 8,
              paddingBottom: 8,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Start typing..."
              className="flex-1 min-w-0 bg-transparent outline-none"
              style={{
                fontSize: 14,
                lineHeight: "20px",
                fontWeight: 400,
                color: "rgba(0,0,0,0.9)",
                letterSpacing: "0.28px",
                fontFamily: "var(--font-rubik), sans-serif",
              }}
            />
            {inputValue.trim() && (
              <button
                onClick={handleSubmit}
                className="shrink-0 flex items-center justify-center rounded-full bg-black ml-1"
                style={{ width: 32, height: 32 }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 11V3M3 7l4-4 4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Gesture Bar (home indicator) ── */}
      {/* Figma: py-13px, centered, 128px wide × 4px tall, bg rgba(0,0,0,0.4), rounded-40px */}
      <div
        className="shrink-0 bg-white flex items-center justify-center"
        style={{ paddingTop: 13, paddingBottom: 13 }}
      >
        <div
          style={{
            width: 128,
            height: 4,
            backgroundColor: "rgba(0,0,0,0.4)",
            borderRadius: 40,
          }}
        />
      </div>
    </div>
  );
}

// ── Default suggestions wired to real app flows ───────────────────────────

export const defaultSuggestions: InitialSuggestion[] = [
  {
    id: "understand",
    title: "Analyse my spends",
    subtitle: "See where your money is going",
    avatarBg: "#ecf8ee",
    icon: <SpendChartIcon />,
  },
  {
    id: "goal-new",
    title: "Set a savings goal",
    subtitle: "Plan toward something you want",
    avatarBg: "#e5f1ff",
    icon: <BankIcon />,
  },
  {
    id: "leaks",
    title: "Find spending leaks",
    subtitle: "Catch categories creeping up",
    avatarBg: "#f7edfb",
    icon: <CreditCardIcon />,
  },
];
