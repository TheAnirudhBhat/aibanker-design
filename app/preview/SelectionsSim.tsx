"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { typography } from "../lib/typography";
import { VALENTINO_50, OUTLINE_SUBTLE } from "../lib/colors";
import { StatusBar, GestureNav, FooterInset } from "../components/AppChrome";

// ── Hardcoded content ───────────────────────────────────────────

const ASSISTANT_TEXT =
  "Rajan, your Japan trip is veering off course \u2014 you\u2019ve overspent by \u20B915,000 against what we budgeted. Let\u2019s do some damage control while we still can.";

const CHIP_OPTIONS = [
  "Add \u20B95,000 to pot",
  "I\u2019ll handle it myself",
  "Show me where I overspent",
];

const MOCK_RESPONSES: Record<string, string> = {
  "Add \u20B95,000 to pot":
    "Done \u2014 \u20B95,000 moved to your Japan trip pot. You\u2019re now \u20B910,000 behind instead of \u20B915,000. I\u2019ve also tightened your dining budget by \u20B92,000 this month to help close the gap faster.",
  "I\u2019ll handle it myself":
    "Got it, I\u2019ll leave it with you. Just a heads up \u2014 if the gap grows past \u20B920,000, your December target starts looking tight. I\u2019ll check in again next week.",
  "Show me where I overspent":
    "Here\u2019s the breakdown \u2014 dining out was \u20B98,200 (double your usual), shopping hit \u20B94,300, and subscriptions crept up by \u20B92,500. Dining is the big one to rein in.",
};

// ── Feedback row icons ──────────────────────────────────────────

const ICON_THUMBS_UP = "/icons/thumbs-up.svg";
const ICON_THUMBS_DOWN = "/icons/thumbs-down.svg";
const ICON_COPY = "/icons/copy.svg";
const ICON_SHARE = "/icons/share.svg";
const ICON_RETRY = "/icons/retry.svg";

function FeedbackRow() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const icons = [ICON_THUMBS_UP, ICON_THUMBS_DOWN, ICON_COPY, ICON_SHARE, ICON_RETRY];

  useEffect(() => {
    const timer = window.setTimeout(() => setShowDisclaimer(true), 600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-4 animate-chat-message-in" style={{ opacity: 0.4 }}>
        {icons.map((src, i) => (
          <div key={i} className="relative shrink-0" style={{ width: 16, height: 16 }}>
            <img src={src} alt="" className="absolute inset-0 w-full h-full" />
          </div>
        ))}
      </div>
      <p
        className="transition-opacity duration-300 ease-out"
        style={{
          ...typography.caption,
          color: "rgba(0,0,0,0.3)",
          marginTop: 20,
          textAlign: "right",
          marginLeft: "25%",
          opacity: showDisclaimer ? 1 : 0,
        }}
      >
        Ryan is AI and can make mistakes. Always double-check responses.
      </p>
    </div>
  );
}

// ── Highlight ₹ values and **bold** ─────────────────────────────

const HIGHLIGHT_RE = /\*\*(.+?)\*\*|₹[\d,.]+\s*[Lk]?|[\d,.]+%/g;

function highlightValues(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = HIGHLIGHT_RE.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const boldText = match[1] ?? match[0];
    parts.push(<span key={match.index} style={typography.buttonSmall}>{boldText}</span>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
}

// ── Typewriter hook ─────────────────────────────────────────────

function useTypewriter(fullText: string, active: boolean, onComplete?: () => void) {
  const [displayed, setDisplayed] = useState(active ? "" : fullText);
  const posRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const completeCalled = useRef(false);

  useEffect(() => {
    if (!active) {
      setDisplayed(fullText);
      posRef.current = fullText.length;
      return;
    }
    posRef.current = 0;
    completeCalled.current = false;
    setDisplayed("");

    const tick = () => {
      const chunkSize = 3 + Math.floor(Math.random() * 3);
      const nextPos = Math.min(posRef.current + chunkSize, fullText.length);
      posRef.current = nextPos;
      setDisplayed(fullText.slice(0, nextPos));
      if (nextPos >= fullText.length) {
        if (!completeCalled.current) { completeCalled.current = true; onComplete?.(); }
        return;
      }
      timerRef.current = window.setTimeout(tick, 20 + Math.random() * 20);
    };
    timerRef.current = window.setTimeout(tick, 80);
    return () => { if (timerRef.current !== null) window.clearTimeout(timerRef.current); };
  }, [fullText, active, onComplete]);

  return displayed;
}

// ── Floating AppBar ─────────────────────────────────────────────

function FloatingAppBar() {
  return (
    <div className="absolute top-0 left-0 right-0 z-10" style={{ pointerEvents: "none" }}>
      <div style={{ pointerEvents: "auto" }}>
        <StatusBar backgroundColor="transparent" />
        <div className="flex items-center" style={{ padding: "8px 12px 8px 8px" }}>
          <div style={{ width: 48, height: 48, display: "flex", alignItems: "center" }}>
            <div
              className="flex items-center justify-center rounded-full bg-white"
              style={{ width: 48, height: 48, border: `1px solid ${OUTLINE_SUBTLE}`, boxShadow: "0px 2px 32px 0px rgba(0,0,0,0.05)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="rgba(0,0,0,0.7)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div style={{ flex: 1, textAlign: "center", ...typography.headerH4, color: "rgba(0,0,0,0.9)" }}>
            Ryan
          </div>
          <div style={{ width: 48, height: 48 }} />
        </div>
      </div>
    </div>
  );
}

// ── Main simulation ─────────────────────────────────────────────

export default function SelectionsSim() {
  const [typingDone, setTypingDone] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [showReply, setShowReply] = useState(false);
  const [replyDone, setReplyDone] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const onComplete = useCallback(() => setTypingDone(true), []);
  const onReplyComplete = useCallback(() => setReplyDone(true), []);

  const displayedText = useTypewriter(ASSISTANT_TEXT, true, onComplete);
  const mockReply = selectedLabel ? MOCK_RESPONSES[selectedLabel] ?? "" : "";
  const displayedReply = useTypewriter(mockReply, showReply, onReplyComplete);

  // Stagger: user bubble → 500ms → reply starts
  useEffect(() => {
    if (!selectedLabel) return;
    const timer = window.setTimeout(() => setShowReply(true), 500);
    return () => window.clearTimeout(timer);
  }, [selectedLabel]);

  // Track scroll for top fade gradient
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setHasScrolled(el.scrollTop > 0);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden bg-white"
      style={{ fontFamily: "var(--font-rubik), var(--font-sans), system-ui, sans-serif" }}
    >
      <FloatingAppBar />

      {/* Top fade gradient — visible on scroll */}
      <div
        className="absolute left-0 right-0 z-[9]"
        style={{
          top: 0,
          height: 120,
          pointerEvents: "none",
          background: "linear-gradient(to bottom, white 60%, transparent 100%)",
          opacity: hasScrolled ? 1 : 0,
          transition: "opacity 200ms ease",
        }}
      />

      <div ref={scrollRef} className="absolute inset-0 w-full overflow-y-auto overscroll-contain scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex flex-col px-6">
          {/* Clearance for app bar */}
          <div className="shrink-0" aria-hidden="true" style={{ height: 108 }} />

          {/* Assistant text — typewriter */}
          <p className="whitespace-pre-line" style={{ ...typography.bodySmall, color: "rgba(0,0,0,0.9)" }}>
            {highlightValues(displayedText)}
          </p>

          {/* Chip selections — fade in after typing completes */}
          {!selectedLabel && (
            <div
              className={`transition-opacity duration-300 ease-out ${typingDone ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              style={{ marginTop: typingDone ? 28 : 0 }}
            >
              <div className="flex flex-wrap gap-3">
                {CHIP_OPTIONS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSelectedLabel(label)}
                    className="transition-transform active:scale-[0.97]"
                    style={{
                      ...typography.caption,
                      color: "rgba(0,0,0,0.6)",
                      backgroundColor: "#ffffff",
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 100,
                      padding: "6px 12px",
                      boxShadow: "0px 1px 4px rgba(0,0,0,0.06)",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mock conversation after chip selection */}
          {selectedLabel && (
            <div className="mt-6 space-y-4">
              {/* User bubble */}
              <div className="flex justify-end animate-chat-message-in">
                <div
                  className="max-w-[75%] rounded-[16px] rounded-tr-lg"
                  style={{ backgroundColor: VALENTINO_50, padding: "12px 16px" }}
                >
                  <p style={{ ...typography.bodySmall, color: "rgba(0,0,0,0.9)" }}>{selectedLabel}</p>
                </div>
              </div>
              {/* Assistant reply */}
              {showReply && (
                <div className="animate-chat-message-in">
                  <p className="whitespace-pre-line" style={{ ...typography.bodySmall, color: "rgba(0,0,0,0.9)" }}>
                    {highlightValues(displayedReply)}
                  </p>
                  {replyDone && <FeedbackRow />}
                </div>
              )}
            </div>
          )}

          <div className="shrink-0" aria-hidden="true" style={{ height: 120 }} />
        </div>
      </div>

      {/* Input bar + gesture nav */}
      <div className="absolute bottom-0 left-0 right-0 z-15">
        <FooterInset backgroundColor="transparent" paddingX={16} paddingTop={8} minBottomPadding={0}>
          <div className="flex items-center" style={{ gap: 12 }}>
            <div
              className="flex items-center overflow-hidden flex-1"
              style={{ height: 48, backgroundColor: "#fff", border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: 100, boxShadow: "0px 2px 32px 0px rgba(0,0,0,0.05)" }}
            >
              <div className="flex items-center w-full h-full" style={{ backgroundColor: "#fff", borderRadius: 100, paddingLeft: 16, paddingRight: 8, paddingTop: 8, paddingBottom: 8 }}>
                <span className="flex-1" style={{ ...typography.bodySmall, color: "rgba(0,0,0,0.3)" }}>
                  Reply to Ryan...
                </span>
              </div>
            </div>
          </div>
        </FooterInset>
        <GestureNav />
      </div>
    </div>
  );
}
