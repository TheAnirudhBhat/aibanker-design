"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { typography } from "../lib/typography";
import { VALENTINO_50, VALENTINO_500, OUTLINE_SUBTLE, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, ALPHA_BLACK_30, BG_PRIMARY, BG_SECONDARY } from "../lib/colors";
import { SPACE_XS, SPACE_M, SPACE_L } from "../lib/spacing";
import { RADIUS_M, RADIUS_PILL, RADIUS_CIRCLE } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";
import { ILLUST_AFFORD_IT, ILLUST_MY_SPENDS, ILLUST_FEEDBACK } from "../lib/illustrations";
import { StatusBar, GestureNav, FooterInset, ChatAppBar } from "../components/AppChrome";
import GoalTracker from "../components/GoalTracker";
import type { GoalIndicatorData } from "../components/GoalTracker";

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

const FOLLOWUP_TEXT = "What else would you like to explore?";

// ── Mosaic card data (from on-track variant) ────────────────────

type QuickAction = { category: string; title: string; illustration?: string; bg: string };

const MOSAIC_ROW1: QuickAction[] = [
  { category: "Budget", title: "Can I afford it?", illustration: ILLUST_AFFORD_IT, bg: "linear-gradient(160deg, #ffffff 40%, #e6edf9 100%)" },
  { category: "Last month", title: "Analyse my spends", illustration: ILLUST_MY_SPENDS, bg: "linear-gradient(160deg, #ffffff 40%, #fff3e3 100%)" },
];
const MOSAIC_TALL: QuickAction = { category: "Feedback", title: "Make Ryan smarter", illustration: ILLUST_FEEDBACK, bg: "linear-gradient(160deg, #ffffff 40%, #fae2fa 100%)" };
const MOSAIC_HALF: QuickAction[] = [
  { category: "For you", title: "Save taxes", bg: "linear-gradient(160deg, #ffffff 40%, #e0f4e8 100%)" },
  { category: "Explore", title: "Surprise me", bg: "linear-gradient(160deg, #ffffff 40%, #e0e3e6 100%)" },
];

// ── Feedback row (inline SVGs with proper color tokens) ─────────

function FeedbackIcon({ children, viewBox = "0 0 20 20" }: { children: React.ReactNode; viewBox?: string }) {
  return <svg width="16" height="16" viewBox={viewBox} fill="none">{children}</svg>;
}

function FeedbackRow() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowDisclaimer(true), 600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-4 animate-chat-message-in">
        <FeedbackIcon><path d="M12.3563 19.99H12.3363L5.0788 19.96C2.89954 19.96 1.04018 18.3706 0.760277 16.2813L0.0405238 11.103C-0.129418 9.91346 0.240455 8.70387 1.05018 7.78418L6.88818 1.3164C7.55795 0.426705 8.78753-0.103114 10.0171 0.0168451C11.0767 0.116811 12.0164 0.646629 12.6262 1.49634C13.236 2.34605 13.4059 3.39569 13.126 4.38535L12.5862 6.18473L14.7955 5.87484C16.4149 5.64492 17.9844 6.25471 19.004 7.48429C20.0237 8.72386 20.2836 10.3433 19.6938 11.8228L17.9144 16.3013C17.0347 18.5205 14.8055 20 12.3663 20L12.3563 19.99ZM9.68722 2.476C9.37733 2.476 9.06743 2.62595 8.8775 2.86587L2.98951 9.41363C2.66962 9.7835 2.51967 10.2833 2.57965 10.7732L3.29941 15.9514C3.41937 16.8211 4.1891 17.4709 5.08879 17.4809L12.3463 17.5109H12.3563C13.7458 17.5109 15.0154 16.6711 15.5152 15.4016L17.2946 10.9231C17.5545 10.2733 17.4346 9.57357 16.9947 9.03376C16.5549 8.49394 15.8651 8.23403 15.1553 8.324L10.9668 8.9138C10.5369 8.97378 10.0971 8.81383 9.81717 8.49394C9.52727 8.17405 9.43731 7.7342 9.55726 7.33434L10.6569 3.69558C10.7668 3.32571 10.6069 3.03581 10.5169 2.89586C10.427 2.75591 10.187 2.51599 9.78719 2.476C9.7572 2.476 9.72721 2.476 9.69722 2.476H9.68722Z" fill={TEXT_TERTIARY} /></FeedbackIcon>
        <FeedbackIcon><path d="M7.6484 0.00999641H7.66839L14.9259 0.0399876C17.1052 0.0399876 18.9645 1.62944 19.2444 3.71873L19.9642 8.89695C20.1341 10.0865 19.7642 11.2961 18.9545 12.2158L13.1165 18.6836C12.4468 19.5733 11.2172 20.1031 9.9876 19.9832C8.92796 19.8832 7.98828 19.3534 7.37849 18.5037C6.7687 17.654 6.59876 16.6043 6.87866 15.6147L7.41848 13.8153L5.20923 14.1252C3.58979 14.3551 2.02033 13.7453 1.00067 12.5157C-0.0189768 11.2761-0.278887 9.65669 0.310911 8.1772L2.0903 3.69873C2.97 1.47949 5.19924 0 7.6384 0L7.6484 0.00999641ZM10.3175 17.524C10.6274 17.524 10.9373 17.374 11.1272 17.1341L17.0152 10.5864C17.3351 10.2165 17.485 9.71667 17.425 9.22684L16.7053 4.04861C16.5853 3.17891 15.8156 2.52913 14.9159 2.51914L7.65839 2.48915H7.6484C6.25887 2.48915 4.98931 3.32886 4.48948 4.59842L2.71009 9.07689C2.45018 9.72667 2.57014 10.4264 3.00999 10.9662C3.44984 11.5061 4.1396 11.766 4.84936 11.676L9.03792 11.0862C9.46777 11.0262 9.90762 11.1862 10.1875 11.5061C10.4774 11.8259 10.5674 12.2658 10.4474 12.6657L9.34782 16.3044C9.23785 16.6743 9.3978 16.9642 9.48777 17.1041C9.57774 17.2441 9.81765 17.484 10.2175 17.524C10.2475 17.524 10.2775 17.524 10.3075 17.524H10.3175Z" fill={TEXT_TERTIARY} /></FeedbackIcon>
        <FeedbackIcon viewBox="0 0 18 18"><path fillRule="evenodd" clipRule="evenodd" d="M8.05664 3.88672C5.77725 3.88681 3.91992 5.74829 3.91992 8.0332V13.8535C3.91992 16.1384 5.77725 17.9999 8.05664 18H13.8633C16.1427 18 18 16.1385 18 13.8535V8.0332C18 5.74823 16.1427 3.88672 13.8633 3.88672H8.05664ZM13.8633 6.36816C14.777 6.36816 15.5244 7.11724 15.5244 8.0332V13.8535C15.5244 14.7695 14.777 15.5176 13.8633 15.5176H8.05664C7.14297 15.5175 6.39648 14.7694 6.39648 13.8535V8.0332C6.39648 7.1173 7.14296 6.36826 8.05664 6.36816H13.8633Z" fill={TEXT_TERTIARY} /><path d="M7.33984 0C3.29182 0 0 3.29962 0 7.35742V11.0801C0 11.7597 0.55057 12.3115 1.22852 12.3115C1.9063 12.3113 2.45605 11.7595 2.45605 11.0801V7.35742C2.45605 4.65879 4.64771 2.46191 7.33984 2.46191H11.0537C11.7314 2.46178 12.2811 1.91081 12.2812 1.23145C12.2812 0.551948 11.7315 0.000138598 11.0537 0H7.33984Z" fill={TEXT_TERTIARY} /></FeedbackIcon>
        <FeedbackIcon><path d="M15.8549 11.6642C14.5527 11.6642 13.3996 12.2839 12.6441 13.2334L8.21074 10.8046C8.26044 10.5447 8.29026 10.2749 8.29026 10.005C8.29026 9.73513 8.26044 9.46527 8.21074 9.2054L12.6441 6.77661C13.3996 7.72614 14.5527 8.34583 15.8549 8.34583C18.1412 8.34583 20 6.47676 20 4.17791C20 1.87906 18.1412 0 15.8549 0C13.5686 0 11.7097 1.86907 11.7097 4.16792C11.7097 4.25787 11.7296 4.34783 11.7396 4.43778C11.7097 4.44778 11.67 4.44778 11.6402 4.46777L7.01789 7.0065C6.27237 6.28686 5.26839 5.83708 4.15507 5.83708C1.85885 5.82709 0 7.69615 0 9.995C0 12.2939 1.85885 14.1629 4.14513 14.1629C5.25845 14.1629 6.26243 13.7131 7.00795 12.9935L11.6402 15.5322C11.6402 15.5322 11.7097 15.5622 11.7396 15.5722C11.7396 15.6622 11.7097 15.7421 11.7097 15.8321C11.7097 18.1309 13.5686 20 15.8549 20C18.1412 20 20 18.1309 20 15.8321C20 13.5332 18.1412 11.6642 15.8549 11.6642ZM15.8549 2.49875C16.7694 2.49875 17.5149 3.24838 17.5149 4.16792C17.5149 5.08746 16.7694 5.83708 15.8549 5.83708C14.9404 5.83708 14.1948 5.08746 14.1948 4.16792C14.1948 3.24838 14.9404 2.49875 15.8549 2.49875ZM4.14513 11.6642C3.23062 11.6642 2.48509 10.9145 2.48509 9.995C2.48509 9.07546 3.23062 8.32584 4.14513 8.32584C5.05964 8.32584 5.80517 9.07546 5.80517 9.995C5.80517 10.9145 5.05964 11.6642 4.14513 11.6642ZM15.8549 17.4913C14.9404 17.4913 14.1948 16.7416 14.1948 15.8221C14.1948 14.9025 14.9404 14.1529 15.8549 14.1529C16.7694 14.1529 17.5149 14.9025 17.5149 15.8221C17.5149 16.7416 16.7694 17.4913 15.8549 17.4913Z" fill={TEXT_TERTIARY} /></FeedbackIcon>
        <FeedbackIcon><path d="M10.0043 0C7.53419 0 5.16449 0.902256 3.27677 2.59649L2.98558 2.88722L2.18229 2.08521C1.97143 1.87469 1.6702 1.81454 1.38905 1.91479C1.11794 2.01504 0.917117 2.26566 0.897034 2.55639L0.545597 6.45614C0.525514 6.67669 0.605843 6.89724 0.7665 7.05764C0.927158 7.21805 1.14806 7.29825 1.36897 7.2782L5.27494 6.92732C5.56614 6.89724 5.81716 6.70677 5.91757 6.43609C6.01798 6.16541 5.9477 5.85464 5.74687 5.64411L4.77289 4.67168L5.01388 4.43108C6.3895 3.19799 8.16677 2.52632 10.0143 2.52632C13.8701 2.52632 17.1636 5.52381 17.4949 9.36341C17.5552 10.015 18.0974 10.5063 18.74 10.5063C18.7802 10.5063 18.8103 10.5063 18.8505 10.5063C19.5433 10.4461 20.0554 9.83459 19.9952 9.15288C19.5433 4.0401 15.1554 0.0300752 10.0143 0.0300752L10.0043 0Z" fill={TEXT_TERTIARY} /><path d="M18.7702 12.792L14.8642 13.1429C14.573 13.173 14.322 13.3634 14.2216 13.6341C14.1212 13.9048 14.1914 14.2156 14.3923 14.4261L15.2759 15.3083L15.0048 15.579C13.6291 16.812 11.8519 17.4837 10.0043 17.4938C6.11841 17.4938 2.82494 14.4662 2.51367 10.6065C2.45342 9.91481 1.87104 9.40353 1.15812 9.45365C0.465286 9.5138-0.0468087 10.1153 0.00339671 10.807C0.415081 15.9699 4.80303 20 9.99427 20C12.4644 20 14.8341 19.0877 16.7218 17.4035L17.0431 17.0827L17.9368 17.975C18.1476 18.1855 18.4489 18.2456 18.73 18.1454C19.0011 18.0451 19.2019 17.7945 19.222 17.5038L19.5735 13.604C19.5935 13.3835 19.5132 13.1629 19.3526 13.0025C19.1919 12.8421 18.971 12.7619 18.7501 12.782L18.7702 12.792Z" fill={TEXT_TERTIARY} /></FeedbackIcon>
      </div>
      <p
        className="whitespace-pre-line transition-opacity duration-300 ease-out"
        style={{
          ...typography.caption,
          color: TEXT_TERTIARY,
          marginTop: SPACE_M,
          textAlign: "right",
          marginLeft: "25%",
          opacity: showDisclaimer ? 1 : 0,
        }}
      >
        {"Ryan is AI and can make mistakes.\nAlways double-check responses."}
      </p>
    </div>
  );
}

// ── Mosaic card ─────────────────────────────────────────────────

function MosaicCard({
  action,
  style: extraStyle,
}: {
  action: QuickAction;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      className="relative text-left overflow-hidden transition-transform active:scale-[0.97]"
      style={{
        background: action.bg,
        border: "none",
        borderRadius: RADIUS_M,
        boxShadow: ELEVATION_CARD,
        ...extraStyle,
      }}
    >
      <div style={{ position: "absolute", top: SPACE_M, left: SPACE_M, right: SPACE_M, display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_SECONDARY, whiteSpace: "nowrap" }}>
          {action.category}
        </span>
        <span style={{ ...typography.headerH4, color: TEXT_PRIMARY }}>
          {action.title}
        </span>
      </div>
      {action.illustration && (
        <img
          src={action.illustration}
          alt=""
          style={{ position: "absolute", bottom: SPACE_M, right: SPACE_M, width: 44, height: 44, objectFit: "contain" }}
        />
      )}
    </button>
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

// ── Goal data for trailing ring ─────────────────────────────────

const JAPAN_GOAL: GoalIndicatorData = {
  id: "1", name: "Trip to Japan", pct: 42, status: "on-track",
  icon: "plane", ringColor: VALENTINO_500, daysLabel: "4 months left",
  saved: 84000, target: 200000,
};

// ── Floating AppBar — delegates to DLS ChatAppBar ────────────────

function FloatingAppBar() {
  return (
    <ChatAppBar
      absolute
      variant="firstTime"
      voice="ryan"
      trailing={<GoalTracker goals={[JAPAN_GOAL]} onGoalTap={() => {}} />}
    />
  );
}

// ── Main simulation ─────────────────────────────────────────────

export default function RefreshSessionSimV1() {
  const [typingDone, setTypingDone] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [showReply, setShowReply] = useState(false);
  const [replyDone, setReplyDone] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [showFollowup, setShowFollowup] = useState(false);
  const [followupDone, setFollowupDone] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const followupRef = useRef<HTMLDivElement>(null);

  const onComplete = useCallback(() => setTypingDone(true), []);
  const onReplyComplete = useCallback(() => setReplyDone(true), []);
  const onFollowupComplete = useCallback(() => setFollowupDone(true), []);

  const displayedText = useTypewriter(ASSISTANT_TEXT, true, onComplete);
  const mockReply = selectedLabel ? MOCK_RESPONSES[selectedLabel] ?? "" : "";
  const displayedReply = useTypewriter(mockReply, showReply, onReplyComplete);
  const displayedFollowup = useTypewriter(FOLLOWUP_TEXT, showFollowup, onFollowupComplete);

  // Stagger: user bubble → 500ms → reply starts
  useEffect(() => {
    if (!selectedLabel) return;
    const timer = window.setTimeout(() => setShowReply(true), 500);
    return () => window.clearTimeout(timer);
  }, [selectedLabel]);

  // After refresh tapped → short pause → show followup prompt
  useEffect(() => {
    if (refreshCount === 0) return;
    // Reset followup state so cards re-animate
    setFollowupDone(false);
    setShowFollowup(false);
    const timer = window.setTimeout(() => setShowFollowup(true), 300);
    return () => window.clearTimeout(timer);
  }, [refreshCount]);

  // Auto-scroll to bottom during reply typing
  useEffect(() => {
    if (showFollowup) return; // once followup is showing, snap-scroll takes over
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [showReply, displayedReply, showFollowup]);

  // Snap-scroll followup to top — same pattern as Chat.tsx user bubble snap
  useEffect(() => {
    if (!showFollowup) return;
    const scroller = scrollRef.current;
    const content = contentRef.current;
    const el = followupRef.current;
    if (!scroller || !content || !el) return;

    setTimeout(() => {
      const scrollerRect = scroller.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const elTopInScroller = elRect.top - scrollerRect.top + scroller.scrollTop;
      const target = Math.max(0, elTopInScroller - (scroller.clientHeight * 0.12));

      // Ensure content is tall enough to scroll to target position
      const minHeight = target + scroller.clientHeight;
      if (content.scrollHeight < minHeight) {
        content.style.minHeight = `${minHeight}px`;
      }

      // Smooth eased scroll — 400ms, same as Chat.tsx
      const start = scroller.scrollTop;
      const distance = target - start;
      if (Math.abs(distance) < 1) return;
      const duration = 400;
      const startTime = performance.now();
      const ease = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        scroller.scrollTop = start + distance * ease(progress);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, 300);
  }, [showFollowup]);

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
        <div ref={contentRef} className="flex flex-col px-6">
          {/* Clearance for app bar */}
          <div className="shrink-0" aria-hidden="true" style={{ height: 108 }} />

          {/* Assistant text — typewriter */}
          <p className="whitespace-pre-line" style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>
            {highlightValues(displayedText)}
          </p>

          {/* Chip selections — fade in after typing completes, hidden once refresh tapped */}
          {!selectedLabel && refreshCount === 0 && (
            <div
              className={`transition-opacity duration-300 ease-out ${typingDone ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              style={{ marginTop: typingDone ? SPACE_L : 0 }}
            >
              <div className="flex flex-wrap gap-3">
                {CHIP_OPTIONS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSelectedLabel(label)}
                    className="transition-transform active:scale-[0.97]"
                    style={{
                      ...typography.buttonSmall,
                      color: TEXT_PRIMARY,
                      backgroundColor: BG_SECONDARY,
                      border: `1px solid ${OUTLINE_SUBTLE}`,
                      borderRadius: RADIUS_PILL,
                      padding: `${SPACE_XS}px ${SPACE_M}px`,
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
                  <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{selectedLabel}</p>
                </div>
              </div>
              {/* Assistant reply */}
              {showReply && (
                <div className="animate-chat-message-in">
                  <p className="whitespace-pre-line" style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>
                    {highlightValues(displayedReply)}
                  </p>
                  {replyDone && refreshCount === 0 && <FeedbackRow />}
                </div>
              )}
            </div>
          )}

          {/* Follow-up prompt + mosaic cards — shown when refresh is tapped */}
          {showFollowup && (
            <div ref={followupRef} className="animate-chat-message-in" style={{ paddingTop: SPACE_L }}>
              <p className="whitespace-pre-line" style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>
                {displayedFollowup}
              </p>

              {/* Mosaic grid — fade in after followup typewriter finishes */}
              <div
                key={refreshCount}
                className="transition-opacity duration-300 ease-out"
                style={{
                  marginTop: SPACE_L,
                  display: "flex",
                  flexDirection: "column",
                  gap: SPACE_M,
                  opacity: followupDone ? 1 : 0,
                  pointerEvents: followupDone ? "auto" : "none",
                }}
              >
                {/* Row 1: two square cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: SPACE_M }}>
                  {MOSAIC_ROW1.map((a) => (
                    <MosaicCard key={a.title} action={a} style={{ aspectRatio: "1 / 1" }} />
                  ))}
                </div>
                {/* Row 2: tall card + two half-height stacked */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: SPACE_M }}>
                  <MosaicCard
                    action={MOSAIC_TALL}
                    style={{ gridRow: "1 / 3", aspectRatio: "1 / 1" }}
                  />
                  {MOSAIC_HALF.map((a) => (
                    <MosaicCard key={a.title} action={a} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="shrink-0" aria-hidden="true" style={{ height: 120 }} />
        </div>
      </div>

      {/* Input bar + gesture nav */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <FooterInset backgroundColor="transparent" paddingX={16} paddingTop={8} minBottomPadding={0}>
          <div className="flex items-center" style={{ gap: 12 }}>
            {/* Refresh button — identical container to close button & goal ring */}
            <div
              onClick={() => setRefreshCount((c) => c + 1)}
              className="flex items-center justify-center rounded-full bg-white shrink-0 transition-transform active:scale-[0.97]"
              style={{
                width: 48,
                height: 48,
                border: `1px solid ${OUTLINE_SUBTLE}`,
                boxShadow: ELEVATION_CARD,
                cursor: "pointer",
              }}
            >
              <img src="/icons/reload.svg" alt="Refresh" width={20} height={20} style={{ display: "block" }} />
            </div>
            {/* Input pill */}
            <div
              className="flex items-center overflow-hidden flex-1"
              style={{ height: 48, backgroundColor: BG_PRIMARY, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_CIRCLE, boxShadow: ELEVATION_CARD }}
            >
              <div className="flex items-center w-full h-full" style={{ backgroundColor: BG_PRIMARY, borderRadius: RADIUS_CIRCLE, paddingLeft: 16, paddingRight: 8, paddingTop: 8, paddingBottom: 8 }}>
                <span className="flex-1" style={{ ...typography.bodySmall, color: ALPHA_BLACK_30 }}>
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
