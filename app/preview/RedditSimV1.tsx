"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { typography } from "../lib/typography";
import {
  VALENTINO_50,
  VALENTINO_500,
  OUTLINE_SUBTLE,
  TEXT_PRIMARY,
  TEXT_TERTIARY,
  ALPHA_BLACK_30,
  BG_PRIMARY,
  BG_SECONDARY,
} from "../lib/colors";
import { SPACE_XS, SPACE_M } from "../lib/spacing";
import { RADIUS_CIRCLE, RADIUS_PILL } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";
import { StatusBar, GestureNav, ChatAppBar } from "../components/AppChrome";
import GoalTracker from "../components/GoalTracker";
import type { GoalIndicatorData } from "../components/GoalTracker";
import PlanCruncherV2 from "../components/PlanCruncherV2";
import QuestionnaireOverlay from "../components/QuestionnaireOverlay";
import type { QuestionOption } from "../components/QuestionnaireOverlay";
import MockKeyboard from "../components/MockKeyboard";
import { useTypewriter } from "../components/Chat";
import {
  INITIAL_MESSAGES,
  BYRON_ACKNOWLEDGE,
  GOAL_QUESTIONS,
  POST_QUIZ_SUMMARY,
  CLARIFYING_QUESTIONS,
  CRUNCHER_STATUS_BY_QUESTION,
  IDLE_CRUNCHER_TEXTS,
  FINAL_CRUNCHING_MSG,
  VERBOSE_PLAN_TEXT,
  type SimMessage,
} from "./fixtures/redditFixture";

// ── Flow phases ─────────────────────────────────────────────────

type Phase =
  | "boot"
  | "questionnaire"
  | "working"
  | "result";

// ── Goal data ───────────────────────────────────────────────────

const JAPAN_GOAL: GoalIndicatorData = {
  id: "1", name: "Trip to Japan", pct: 42, status: "on-track",
  icon: "plane", ringColor: VALENTINO_500, daysLabel: "4 months left",
  saved: 84000, target: 200000,
};

// ── Bubble ──────────────────────────────────────────────────────

function Bubble({ msg, typewrite = false, onComplete }: { msg: SimMessage; typewrite?: boolean; onComplete?: () => void }) {
  const streamed = useTypewriter(msg.text, typewrite && msg.role === "assistant", onComplete);
  const text = typewrite && msg.role === "assistant" ? streamed : msg.text;

  if (msg.role === "user") {
    return (
      <div className="flex flex-col items-end">
        <div
          className="max-w-[75%] rounded-[16px] rounded-tr-lg"
          style={{ backgroundColor: VALENTINO_50, padding: "12px 16px" }}
        >
          <p className="whitespace-pre-line text-[var(--chat-text-primary)]" style={typography.bodySmall}>
            {msg.text}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start">
      <p className="whitespace-pre-line text-[var(--chat-text-primary)] w-full" style={typography.bodySmall}>
        {text}
      </p>
    </div>
  );
}

// ── Chip list ───────────────────────────────────────────────────

function ChipList({
  chips,
  onSelect,
}: {
  chips: { id: string; label: string }[];
  onSelect: (chip: { id: string; label: string }) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onSelect(chip)}
          className="transition-transform active:scale-[0.97]"
          style={{
            ...typography.buttonSmall,
            color: TEXT_PRIMARY,
            backgroundColor: BG_SECONDARY,
            border: `1px solid ${OUTLINE_SUBTLE}`,
            borderRadius: RADIUS_PILL,
            padding: `${SPACE_XS}px ${SPACE_M}px`,
            cursor: "pointer",
          }}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

// ── Feedback row ────────────────────────────────────────────────

function FeedbackIcon({ children }: { children: React.ReactNode }) {
  return <svg width="16" height="16" viewBox="0 0 20 20" fill="none">{children}</svg>;
}

function FeedbackRow({ disclaimer }: { disclaimer: string }) {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowDisclaimer(true), 600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-4 animate-chat-message-in">
        <FeedbackIcon>
          <path d="M12.3563 19.99H12.3363L5.0788 19.96C2.89954 19.96 1.04018 18.3706 0.760277 16.2813L0.0405238 11.103C-0.129418 9.91346 0.240455 8.70387 1.05018 7.78418L6.88818 1.3164C7.55795 0.426705 8.78753-0.103114 10.0171 0.0168451C11.0767 0.116811 12.0164 0.646629 12.6262 1.49634C13.236 2.34605 13.4059 3.39569 13.126 4.38535L12.5862 6.18473L14.7955 5.87484C16.4149 5.64492 17.9844 6.25471 19.004 7.48429C20.0237 8.72386 20.2836 10.3433 19.6938 11.8228L17.9144 16.3013C17.0347 18.5205 14.8055 20 12.3663 20L12.3563 19.99ZM9.68722 2.476C9.37733 2.476 9.06743 2.62595 8.8775 2.86587L2.98951 9.41363C2.66962 9.7835 2.51967 10.2833 2.57965 10.7732L3.29941 15.9514C3.41937 16.8211 4.1891 17.4709 5.08879 17.4809L12.3463 17.5109H12.3563C13.7458 17.5109 15.0154 16.6711 15.5152 15.4016L17.2946 10.9231C17.5545 10.2733 17.4346 9.57357 16.9947 9.03376C16.5549 8.49394 15.8651 8.23403 15.1553 8.324L10.9668 8.9138C10.5369 8.97378 10.0971 8.81383 9.81717 8.49394C9.52727 8.17405 9.43731 7.7342 9.55726 7.33434L10.6569 3.69558C10.7668 3.32571 10.6069 3.03581 10.5169 2.89586C10.427 2.75591 10.187 2.51599 9.78719 2.476C9.7572 2.476 9.72721 2.476 9.69722 2.476H9.68722Z" fill={TEXT_TERTIARY} />
        </FeedbackIcon>
        <FeedbackIcon>
          <path d="M7.6484 0.00999641H7.66839L14.9259 0.0399876C17.1052 0.0399876 18.9645 1.62944 19.2444 3.71873L19.9642 8.89695C20.1341 10.0865 19.7642 11.2961 18.9545 12.2158L13.1165 18.6836C12.4468 19.5733 11.2172 20.1031 9.9876 19.9832C8.92796 19.8832 7.98828 19.3534 7.37849 18.5037C6.7687 17.654 6.59876 16.6043 6.87866 15.6147L7.41848 13.8153L5.20923 14.1252C3.58979 14.3551 2.02033 13.7453 1.00067 12.5157C-0.0189768 11.2761-0.278887 9.65669 0.310911 8.1772L2.0903 3.69873C2.97 1.47949 5.19924 0 7.6384 0L7.6484 0.00999641ZM10.3175 17.524C10.6274 17.524 10.9373 17.374 11.1272 17.1341L17.0152 10.5864C17.3351 10.2165 17.485 9.71667 17.425 9.22684L16.7053 4.04861C16.5853 3.17891 15.8156 2.52913 14.9159 2.51914L7.65839 2.48915H7.6484C6.25887 2.48915 4.98931 3.32886 4.48948 4.59842L2.71009 9.07689C2.45018 9.72667 2.57014 10.4264 3.00999 10.9662C3.44984 11.5061 4.1396 11.766 4.84936 11.676L9.03792 11.0862C9.46777 11.0262 9.90762 11.1862 10.1875 11.5061C10.4774 11.8259 10.5674 12.2658 10.4474 12.6657L9.34782 16.3044C9.23785 16.6743 9.3978 16.9642 9.48777 17.1041C9.57774 17.2441 9.81765 17.484 10.2175 17.524C10.2475 17.524 10.2775 17.524 10.3075 17.524H10.3175Z" fill={TEXT_TERTIARY} />
        </FeedbackIcon>
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <path fillRule="evenodd" clipRule="evenodd" d="M8.05664 3.88672C5.77725 3.88681 3.91992 5.74829 3.91992 8.0332V13.8535C3.91992 16.1384 5.77725 17.9999 8.05664 18H13.8633C16.1427 18 18 16.1385 18 13.8535V8.0332C18 5.74823 16.1427 3.88672 13.8633 3.88672H8.05664ZM13.8633 6.36816C14.777 6.36816 15.5244 7.11724 15.5244 8.0332V13.8535C15.5244 14.7695 14.777 15.5176 13.8633 15.5176H8.05664C7.14297 15.5175 6.39648 14.7694 6.39648 13.8535V8.0332C6.39648 7.1173 7.14296 6.36826 8.05664 6.36816H13.8633Z" fill={TEXT_TERTIARY} />
          <path d="M7.33984 0C3.29182 0 0 3.29962 0 7.35742V11.0801C0 11.7597 0.55057 12.3115 1.22852 12.3115C1.9063 12.3113 2.45605 11.7595 2.45605 11.0801V7.35742C2.45605 4.65879 4.64771 2.46191 7.33984 2.46191H11.0537C11.7314 2.46178 12.2811 1.91081 12.2812 1.23145C12.2812 0.551948 11.7315 0.000138598 11.0537 0H7.33984Z" fill={TEXT_TERTIARY} />
        </svg>
        <FeedbackIcon>
          <path d="M15.8549 11.6642C14.5527 11.6642 13.3996 12.2839 12.6441 13.2334L8.21074 10.8046C8.26044 10.5447 8.29026 10.2749 8.29026 10.005C8.29026 9.73513 8.26044 9.46527 8.21074 9.2054L12.6441 6.77661C13.3996 7.72614 14.5527 8.34583 15.8549 8.34583C18.1412 8.34583 20 6.47676 20 4.17791C20 1.87906 18.1412 0 15.8549 0C13.5686 0 11.7097 1.86907 11.7097 4.16792C11.7097 4.25787 11.7296 4.34783 11.7396 4.43778C11.7097 4.44778 11.67 4.44778 11.6402 4.46777L7.01789 7.0065C6.27237 6.28686 5.26839 5.83708 4.15507 5.83708C1.85885 5.82709 0 7.69615 0 9.995C0 12.2939 1.85885 14.1629 4.14513 14.1629C5.25845 14.1629 6.26243 13.7131 7.00795 12.9935L11.6402 15.5322C11.6402 15.5322 11.7097 15.5622 11.7396 15.5722C11.7396 15.6622 11.7097 15.7421 11.7097 15.8321C11.7097 18.1309 13.5686 20 15.8549 20C18.1412 20 20 18.1309 20 15.8321C20 13.5332 18.1412 11.6642 15.8549 11.6642ZM15.8549 2.49875C16.7694 2.49875 17.5149 3.24838 17.5149 4.16792C17.5149 5.08746 16.7694 5.83708 15.8549 5.83708C14.9404 5.83708 14.1948 5.08746 14.1948 4.16792C14.1948 3.24838 14.9404 2.49875 15.8549 2.49875ZM4.14513 11.6642C3.23062 11.6642 2.48509 10.9145 2.48509 9.995C2.48509 9.07546 3.23062 8.32584 4.14513 8.32584C5.05964 8.32584 5.80517 9.07546 5.80517 9.995C5.80517 10.9145 5.05964 11.6642 4.14513 11.6642ZM15.8549 17.4913C14.9404 17.4913 14.1948 16.7416 14.1948 15.8221C14.1948 14.9025 14.9404 14.1529 15.8549 14.1529C16.7694 14.1529 17.5149 14.9025 17.5149 15.8221C17.5149 16.7416 16.7694 17.4913 15.8549 17.4913Z" fill={TEXT_TERTIARY} />
        </FeedbackIcon>
        <FeedbackIcon>
          <path d="M10.0043 0C7.53419 0 5.16449 0.902256 3.27677 2.59649L2.98558 2.88722L2.18229 2.08521C1.97143 1.87469 1.6702 1.81454 1.38905 1.91479C1.11794 2.01504 0.917117 2.26566 0.897034 2.55639L0.545597 6.45614C0.525514 6.67669 0.605843 6.89724 0.7665 7.05764C0.927158 7.21805 1.14806 7.29825 1.36897 7.2782L5.27494 6.92732C5.56614 6.89724 5.81716 6.70677 5.91757 6.43609C6.01798 6.16541 5.9477 5.85464 5.74687 5.64411L4.77289 4.67168L5.01388 4.43108C6.3895 3.19799 8.16677 2.52632 10.0143 2.52632C13.8701 2.52632 17.1636 5.52381 17.4949 9.36341C17.5552 10.015 18.0974 10.5063 18.74 10.5063C18.7802 10.5063 18.8103 10.5063 18.8505 10.5063C19.5433 10.4461 20.0554 9.83459 19.9952 9.15288C19.5433 4.0401 15.1554 0.0300752 10.0143 0.0300752L10.0043 0Z" fill={TEXT_TERTIARY} />
          <path d="M18.7702 12.792L14.8642 13.1429C14.573 13.173 14.322 13.3634 14.2216 13.6341C14.1212 13.9048 14.1914 14.2156 14.3923 14.4261L15.2759 15.3083L15.0048 15.579C13.6291 16.812 11.8519 17.4837 10.0043 17.4938C6.11841 17.4938 2.82494 14.4662 2.51367 10.6065C2.45342 9.91481 1.87104 9.40353 1.15812 9.45365C0.465286 9.5138-0.0468087 10.1153 0.00339671 10.807C0.415081 15.9699 4.80303 20 9.99427 20C12.4644 20 14.8341 19.0877 16.7218 17.4035L17.0431 17.0827L17.9368 17.975C18.1476 18.1855 18.4489 18.2456 18.73 18.1454C19.0011 18.0451 19.2019 17.7945 19.222 17.5038L19.5735 13.604C19.5935 13.3835 19.5132 13.1629 19.3526 13.0025C19.1919 12.8421 18.971 12.7619 18.7501 12.782L18.7702 12.792Z" fill={TEXT_TERTIARY} />
        </FeedbackIcon>
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
        {disclaimer}
      </p>
    </div>
  );
}

// ── Thinking indicator ──────────────────────────────────────────

function ThinkingIndicator() {
  return (
    <div className="flex items-center" style={{ gap: 8, paddingTop: 4, paddingBottom: 4 }}>
      <p className="animate-thinking-pulse text-[var(--chat-text-tertiary)]" style={typography.bodySmall}>
        Thinking…
      </p>
    </div>
  );
}

// ── Floating AppBar — delegates to DLS ChatAppBar ────────────────

function FloatingAppBar() {
  return (
    <ChatAppBar
      absolute
      variant="degen"
      voice="byron"
      onVoiceChange={() => {}}
      trailing={<GoalTracker goals={[JAPAN_GOAL]} onGoalTap={() => {}} />}
    />
  );
}

// ── Main simulation ─────────────────────────────────────────────

export default function RedditSimV1({ autoplay = false }: { autoplay?: boolean } = {}) {
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [phase, setPhase] = useState<Phase>("boot");
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [cruncherVisible, setCruncherVisible] = useState(false);
  const [cruncherStatus, setCruncherStatus] = useState("Gathering your preferences");
  const [showThinking, setShowThinking] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [inputBarVisible, setInputBarVisible] = useState(true);

  const [clarifyIndex, setClarifyIndex] = useState(0);
  const [showClarifyChips, setShowClarifyChips] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [planDone, setPlanDone] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const didBootRef = useRef(false);
  const snappedIdsRef = useRef<Set<string>>(new Set());
  const cruncherVisibleRef = useRef(false);

  const userBubbleRef = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const id = el.getAttribute("data-msg-id");
    if (!id || snappedIdsRef.current.has(id)) return;
    snappedIdsRef.current.add(id);

    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;

    setTimeout(() => {
      const headerHeight = cruncherVisibleRef.current ? 200 : 108;
      const scrollerRect = scroller.getBoundingClientRect();
      const bubbleRect = el.getBoundingClientRect();
      const bubbleTopInScroller = bubbleRect.top - scrollerRect.top + scroller.scrollTop;
      const target = Math.max(0, bubbleTopInScroller - headerHeight - 16);

      const minHeight = target + scroller.clientHeight;
      if (content.scrollHeight < minHeight) {
        content.style.minHeight = `${minHeight}px`;
      }

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
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      });
    });
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay);
    timersRef.current.push(t);
    return t;
  }, []);

  // ── Boot sequence ─────────────────────────────────────────────
  useEffect(() => {
    if (didBootRef.current) return;
    didBootRef.current = true;

    // Show user bubble
    schedule(() => {
      setMessages([INITIAL_MESSAGES[0]]);
      scrollToBottom();
    }, 600);

    // Thinking
    schedule(() => {
      setShowThinking(true);
      scrollToBottom();
    }, 1000);

    // Byron acknowledges
    schedule(() => {
      setShowThinking(false);
      setMessages((prev) => [
        ...prev,
        { id: "a1", role: "assistant", text: BYRON_ACKNOWLEDGE },
      ]);
      scrollToBottom();
    }, 2200);

    // Launch questionnaire
    schedule(() => {
      setPhase("questionnaire");
    }, 3400);
  }, [scrollToBottom, schedule]);

  // ── Questionnaire handlers ────────────────────────────────────

  const handleSelectOption = useCallback((questionId: string, option: QuestionOption) => {
    const next = { ...quizAnswers, [questionId]: option.id };
    setQuizAnswers(next);

    schedule(() => {
      if (quizIndex < GOAL_QUESTIONS.length - 1) {
        setQuizIndex((i) => i + 1);
      } else {
        handleQuizComplete(next);
      }
    }, 350);
  }, [quizAnswers, quizIndex, schedule]);

  const handleFreeText = useCallback((questionId: string, text: string) => {
    const next = { ...quizAnswers, [questionId]: text };
    setQuizAnswers(next);

    schedule(() => {
      if (quizIndex < GOAL_QUESTIONS.length - 1) {
        setQuizIndex((i) => i + 1);
      } else {
        handleQuizComplete(next);
      }
    }, 350);
  }, [quizAnswers, quizIndex, schedule]);

  const handleNavigate = useCallback((dir: "prev" | "next") => {
    setQuizIndex((i) => {
      if (dir === "prev") return Math.max(0, i - 1);
      return Math.min(GOAL_QUESTIONS.length - 1, i + 1);
    });
  }, []);

  const handleQuizClose = useCallback(() => {
    setPhase("working");
    setMessages((prev) => [
      ...prev,
      { id: "nudge", role: "assistant", text: "No worries \u2014 whenever you are ready, just tell me and we will pick up where we left off." },
    ]);
    scrollToBottom();
  }, [scrollToBottom]);

  // ── Post-questionnaire ────────────────────────────────────────

  const handleQuizComplete = useCallback((answers: Record<string, string>) => {
    setPhase("working");

    setMessages((prev) => [
      ...prev,
      { id: "u-shared", role: "user", text: "Shared preferences" },
    ]);

    schedule(() => {
      setCruncherVisible(true);
      cruncherVisibleRef.current = true;
      setCruncherStatus("Gathering your preferences");
      setShowThinking(true);
      scrollToBottom();
    }, 600);

    schedule(() => {
      setShowThinking(false);
      setMessages((prev) => [
        ...prev,
        { id: "pq-summary", role: "assistant", text: POST_QUIZ_SUMMARY },
      ]);
      scrollToBottom();
    }, 1400);

    schedule(() => {
      setShowThinking(true);
      scrollToBottom();
    }, 2000);

    schedule(() => {
      setShowThinking(false);
      setCruncherStatus(CRUNCHER_STATUS_BY_QUESTION[0]);
      const cq = CLARIFYING_QUESTIONS[0];
      setMessages((prev) => [
        ...prev,
        { id: cq.id, role: "assistant", text: cq.botText },
      ]);
      scrollToBottom();
    }, 3000);

    schedule(() => {
      setShowClarifyChips(true);
      scrollToBottom();
    }, 4500);
  }, [scrollToBottom, schedule]);

  // ── Handle clarifying question chip selection ─────────────────

  const handleClarifyChip = useCallback((chip: { id: string; label: string }) => {
    setShowClarifyChips(false);
    const currentCQ = CLARIFYING_QUESTIONS[clarifyIndex];

    setMessages((prev) => [
      ...prev,
      { id: `u-${currentCQ.id}`, role: "user", text: chip.label },
    ]);

    setShowThinking(true);

    const nextIndex = clarifyIndex + 1;

    if (nextIndex < CLARIFYING_QUESTIONS.length) {
      schedule(() => {
        setShowThinking(false);
        setCruncherStatus(CRUNCHER_STATUS_BY_QUESTION[nextIndex]);
        const nextCQ = CLARIFYING_QUESTIONS[nextIndex];
        setMessages((prev) => [
          ...prev,
          { id: nextCQ.id, role: "assistant", text: nextCQ.botText },
        ]);
        setClarifyIndex(nextIndex);
        scrollToBottom();
      }, 1200);

      schedule(() => {
        setShowClarifyChips(true);
        scrollToBottom();
      }, 2700);
    } else {
      schedule(() => {
        setShowThinking(false);
        setInputBarVisible(false);
        setMessages((prev) => [
          ...prev,
          { id: "pq-final", role: "assistant", text: FINAL_CRUNCHING_MSG },
        ]);
        scrollToBottom();
      }, 1000);

      let delay = 1500;
      IDLE_CRUNCHER_TEXTS.forEach((text) => {
        schedule(() => {
          setCruncherStatus(text);
        }, delay);
        delay += 1400;
      });

      schedule(() => {
        setCruncherVisible(false);
        cruncherVisibleRef.current = false;
        setShowThinking(true);
        scrollToBottom();
      }, 10000);

      schedule(() => {
        setShowThinking(false);
        setPhase("result");
        setMessages((prev) => [
          ...prev,
          { id: "r1", role: "assistant", text: VERBOSE_PLAN_TEXT },
        ]);
        setInputBarVisible(true);
        scrollToBottom();
      }, 10800);
    }
  }, [clarifyIndex, scrollToBottom, schedule]);

  // ── Scroll tracking ───────────────────────────────────────────

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setHasScrolled(el.scrollTop > 0);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  // ── Autoplay - clicks through the flow automatically ────────
  useEffect(() => {
    if (!autoplay) return;
    const ap: ReturnType<typeof setTimeout>[] = [];
    const at = (fn: () => void, delay: number) => { ap.push(setTimeout(fn, delay)); };
    const click = (text: string) => {
      const btns = Array.from(document.querySelectorAll("button, [role='button'], div[class*='cursor']"));
      const el = btns.find((b) => b.textContent?.trim() === text) as HTMLElement | undefined;
      el?.click();
    };

    // Questionnaire appears at ~3400ms. Give it a beat then pick options.
    at(() => click("6 months"), 5500);
    at(() => click("₹2L"), 8500);
    // Clarifying Q1 chips appear ~4500ms after quiz complete
    at(() => click("Throw them all in"), 16000);
    // CQ2
    at(() => click("Yeah, count it"), 21000);
    // CQ3
    at(() => click("Play it safe"), 26000);

    return () => ap.forEach(clearTimeout);
  }, [autoplay]);

  // Keep scroll pinned during verbose plan streaming
  useEffect(() => {
    if (phase !== "result") return;
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;
    const ro = new ResizeObserver(() => {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, [phase]);

  const handleFocusCapture = useCallback((e: React.FocusEvent) => {
    if (e.target instanceof HTMLInputElement) setKeyboardVisible(true);
  }, []);
  const handleBlurCapture = useCallback((e: React.FocusEvent) => {
    if (e.target instanceof HTMLInputElement) {
      setTimeout(() => setKeyboardVisible(false), 100);
    }
  }, []);

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden bg-white"
      style={{ fontFamily: "var(--font-rubik), var(--font-sans), system-ui, sans-serif" }}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
    >
      <FloatingAppBar />

      {/* Top fade gradient */}
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

      {/* PlanCruncherV2 - pinned below app bar */}
      {cruncherVisible && (
        <div className="absolute top-0 left-0 right-0 z-10" style={{ pointerEvents: "none", paddingTop: 116 }}>
          <div style={{ pointerEvents: "auto", position: "relative", zIndex: 1, padding: "0 16px" }}>
            <PlanCruncherV2
              goalName="Trip to Japan"
              visible
              statusText={cruncherStatus}
            />
          </div>
        </div>
      )}

      {/* Scrollable chat area */}
      <div
        ref={scrollRef}
        className="absolute inset-0 w-full overflow-y-auto overscroll-contain scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ overflowAnchor: "none" }}
      >
        <div ref={contentRef} className="flex flex-col px-6">
          <div className="shrink-0" aria-hidden="true" style={{ height: cruncherVisible ? 216 : 132 }} />

          <div className="w-full space-y-4">
            {messages.map((msg, i) => {
              // Only typewrite the last assistant message in the list
              const isLastAssistant = msg.role === "assistant" && !messages.slice(i + 1).some((m) => m.role === "assistant");
              return (
              <div
                key={msg.id}
                data-msg-id={msg.id}
                ref={msg.role === "user" ? userBubbleRef : undefined}
                className="animate-chat-message-in"
              >
                <Bubble msg={msg} typewrite={isLastAssistant} onComplete={msg.id === "r1" ? () => setPlanDone(true) : undefined} />
                {msg.id === "r1" && planDone && (
                  <FeedbackRow disclaimer={"Byron is AI with attitude.\nStill double-check everything."} />
                )}
              </div>
              );
            })}

            {showThinking && (
              <div className="animate-chat-message-in">
                <ThinkingIndicator />
              </div>
            )}

            {showClarifyChips && clarifyIndex < CLARIFYING_QUESTIONS.length && (
              <div className="animate-chat-message-in">
                <ChipList
                  chips={CLARIFYING_QUESTIONS[clarifyIndex].chips}
                  onSelect={handleClarifyChip}
                />
              </div>
            )}
          </div>

          <div className="shrink-0" aria-hidden="true" style={{ height: 120 }} />
        </div>
      </div>

      {/* Input bar */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[15]"
        style={{
          pointerEvents: inputBarVisible ? "auto" : "none",
          transform: inputBarVisible ? "translateY(0)" : "translateY(100%)",
          opacity: inputBarVisible ? 1 : 0,
          transition: "transform 300ms ease, opacity 200ms ease",
          paddingBottom: 20,
        }}
      >
        <div style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8 }}>
          <div className="flex items-center" style={{ gap: 12 }}>
            <div
              className="flex items-center overflow-hidden flex-1"
              style={{ height: 48, backgroundColor: BG_PRIMARY, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_CIRCLE, boxShadow: ELEVATION_CARD }}
            >
              <div
                className="flex items-center w-full h-full"
                style={{ backgroundColor: BG_PRIMARY, borderRadius: RADIUS_CIRCLE, paddingLeft: 16, paddingRight: 8, paddingTop: 8, paddingBottom: 8 }}
              >
                <span className="flex-1" style={{ ...typography.bodySmall, color: ALPHA_BLACK_30 }}>
                  Reply to Byron...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gesture nav - always visible */}
      <div className="absolute bottom-0 left-0 right-0 z-[14]">
        <GestureNav />
      </div>

      {/* Questionnaire overlay */}
      {phase === "questionnaire" && (
        <div className="absolute bottom-0 left-0 right-0 z-20" style={{ pointerEvents: "auto", transition: "transform 250ms ease", transform: keyboardVisible ? "translateY(-260px)" : "translateY(-8px)" }}>
          <QuestionnaireOverlay
            questions={GOAL_QUESTIONS}
            currentIndex={quizIndex}
            answers={quizAnswers}
            onSelectOption={handleSelectOption}
            onSubmitFreeText={handleFreeText}
            onNavigate={handleNavigate}
            onClose={handleQuizClose}
          />
        </div>
      )}

      <MockKeyboard visible={keyboardVisible} />
    </div>
  );
}
