"use client";

import { useState } from "react";
import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY,
  TEXT_ON_COLOR_PRIMARY,
  TEXT_ON_COLOR_SECONDARY,
  VALENTINO_500,
  VALENTINO_600,
  VALENTINO_50,
  OUTLINE_SUBTLE,
  SLATE_10,
  ALPHA_WHITE_FF,
} from "../lib/colors";
import { ELEVATION_CARD } from "../lib/elevation";
import { RADIUS_CIRCLE, RADIUS_SM } from "../lib/radii";
import { SPACE_S, SPACE_M, SPACE_L, SPACE_XL, SPACE_4XL } from "../lib/spacing";
import { GestureNav, STATUS_BAR_HEIGHT } from "./AppChrome";

// ══════════════════════════════════════════════════════════════════
//  Questions segment — "Ask the user for more details". Canonical
//  Figma (Onboarding · 670:4594 +4). Two screens:
//   • INTRO (step 0): dark-immersive, its own chrome (white back, no bar).
//   • QUESTIONS (steps 1-4): ONE fixed common chrome (status bar + back +
//     a FULL-WIDTH progress bar that FILLS, canon 843:5228) over a sliding
//     content track — only the question content pushes; the chrome stays put.
//  Intro ⇄ questions is a screen push (slide). The progress bar continues
//  the LINKING bar (LINK_SHARE → 1.0) across the 4 questions.
// ══════════════════════════════════════════════════════════════════

const INTRO_GRADIENT = "linear-gradient(155deg, #190028 0%, #3E0065 45%, #0D0021 100%)";

// Fraction of the continuous onboarding bar owned by LINKING (AASim fills 0 → this).
const LINK_SHARE = 0.5;

// Gesture-nav strip height (pt8 + 4px handle + pb8). Reserved at the bottom of every panel so the
// single fixed gesture-nav overlay (common across intro + questions) never overlaps content.
const GESTURE_NAV_HEIGHT = 20;

type Question = { q: string; options: string[] };

const QUESTIONS: Question[] = [
  {
    q: "How do you feel when you think about money?",
    options: ["Confident and in control", "Okay, but could be better", "Stressed and overwhelmed", "I don't really think about it"],
  },
  {
    q: "When making financial decisions, you usually...",
    options: ["Play it safe", "Take calculated risks", "Go for the highest returns", "It depends on the situation"],
  },
  {
    q: "Which sounds most like you?",
    options: ["I plan before I spend", "I like having a financial cushion", "I enjoy spending on experiences", "I usually figure things out as I go"],
  },
  {
    q: "What motivates you most to save money?",
    options: ["Feeling financially secure", "Buying things I want", "Building long-term wealth", "Having freedom and flexibility"],
  },
];

function ChevronBack({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 6L9 12L15 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Single-select row (DLS card): white card + subtle outline + card drop-shadow;
// selected = V-500 border + V-50 fill + V-600 label.
function SelectRow({ label, selected, onPick }: { label: string; selected: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="transition-[background-color,border-color,box-shadow] active:scale-[0.99]"
      style={{
        width: "100%",
        minHeight: 52,
        display: "flex",
        alignItems: "center",
        textAlign: "left",
        padding: "0 16px",
        borderRadius: RADIUS_SM,
        background: selected ? VALENTINO_50 : "#FFFFFF",
        border: `1.5px solid ${selected ? VALENTINO_500 : OUTLINE_SUBTLE}`,
        boxShadow: ELEVATION_CARD,
        cursor: "pointer",
        outline: "none",
      }}
    >
      <span style={{ ...typography.bodySmall, color: selected ? VALENTINO_600 : TEXT_PRIMARY }}>{label}</span>
    </button>
  );
}

export default function PitchQuestions({
  step,
  onStepChange,
  onComplete,
  onExit,
}: {
  /** 0 = intro; 1..4 = question. Lifted to the page (kept for parity). */
  step: number;
  onStepChange: (s: number) => void;
  onComplete: () => void;
  /** Back from the intro exits the segment (to linking). */
  onExit: () => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const onQuestions = step >= 1;
  const qIndex = Math.max(0, step - 1); // active question index (0-based) within the content track
  const progress = LINK_SHARE + (Math.max(1, step) / QUESTIONS.length) * (1 - LINK_SHARE);

  const pick = (i: number, opt: string) => {
    setAnswers((a) => ({ ...a, [i]: opt }));
    // Hold the selected state a beat, then advance (or finish after the last question).
    window.setTimeout(() => {
      if (i >= QUESTIONS.length - 1) onComplete();
      else onStepChange(i + 2); // current step = i+1 → next = i+2
    }, 420);
  };

  return (
    // The segment CONTENT slides in from the right (linking → questions); the status bar is NOT here —
    // it's the shell's persistent bar, so it stays put across the flow (no slide-in). This root fills the
    // shell's content area BELOW that bar.
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ animation: "pitchSlideInRight 380ms cubic-bezier(0.22, 1, 0.36, 1) both" }}
    >
      {/* ── INTRO screen (dark) — slides out left when entering the questions ── */}
      <div
        className="absolute inset-0 flex flex-col"
        style={{
          background: INTRO_GRADIENT,
          paddingTop: STATUS_BAR_HEIGHT,
          paddingBottom: GESTURE_NAV_HEIGHT,
          transform: onQuestions ? "translateX(-100%)" : "translateX(0)",
          transition: "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Radial glow (canon 847:5351) — purple → magenta → yellow halo behind the CTA (the button
            rides on top of it). Oversized + anchored to the bottom so it bleeds off the edge with no
            hard cut; the gesture-nav strip over it is transparent so the glow shows through. */}
        <img src="/pitch/intro-glow.png" alt="" aria-hidden draggable={false} style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "165%", maxWidth: "none", pointerEvents: "none", userSelect: "none" }} />
        <div className="shrink-0 flex items-center" style={{ height: 64, paddingLeft: 12 }}>
          <button
            type="button"
            onClick={onExit}
            aria-label="Back"
            className="flex items-center justify-center transition-transform active:scale-[0.9]"
            style={{ width: 48, height: 48, background: "none", border: "none", cursor: "pointer", padding: 12 }}
          >
            <ChevronBack color={TEXT_ON_COLOR_PRIMARY} />
          </button>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          <div style={{ flex: "0 0 22%" }} />
          <div className="flex flex-col" style={{ paddingLeft: SPACE_XL, paddingRight: SPACE_XL, gap: SPACE_S }}>
            <h1 style={{ ...typography.headerH1, color: TEXT_ON_COLOR_PRIMARY, margin: 0 }}>
              Lets talk about your money habits and goals
            </h1>
            <p style={{ ...typography.bodyNormal, color: TEXT_ON_COLOR_SECONDARY, margin: 0 }}>
              Answer questions to get a recommended plan
            </p>
          </div>
          <div className="flex-1" />
        </div>
        <div className="shrink-0 relative" style={{ zIndex: 1 }}>
          <div className="flex items-center justify-center" style={{ paddingLeft: SPACE_L, paddingRight: SPACE_L, paddingBottom: SPACE_M }}>
            <button
              type="button"
              onClick={() => onStepChange(1)}
              className="transition-transform active:scale-[0.98]"
              style={{
                width: 312,
                maxWidth: "100%",
                height: 48,
                borderRadius: RADIUS_CIRCLE,
                backgroundColor: ALPHA_WHITE_FF,
                border: "none",
                cursor: "pointer",
                ...typography.buttonNormal,
                color: TEXT_PRIMARY,
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      {/* ── QUESTIONS screen (white) — ONE fixed chrome + a sliding content track ── */}
      <div
        className="absolute inset-0 flex flex-col"
        style={{
          background: "#FFFFFF",
          paddingTop: STATUS_BAR_HEIGHT,
          paddingBottom: GESTURE_NAV_HEIGHT,
          transform: onQuestions ? "translateX(0)" : "translateX(100%)",
          transition: "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* Fixed common chrome: back + full-width filling progress bar (the status bar is the shell's). */}
        <div className="shrink-0 relative flex items-center" style={{ height: 64, paddingLeft: 12, paddingRight: 36 }}>
          <button
            type="button"
            onClick={() => onStepChange(step - 1)}
            aria-label="Back"
            className="flex items-center justify-center transition-transform active:scale-[0.9]"
            style={{ width: 48, height: 48, background: "none", border: "none", cursor: "pointer", padding: 12 }}
          >
            <ChevronBack color={TEXT_PRIMARY} />
          </button>
          <div style={{ flex: 1, marginLeft: 12, height: 4, borderRadius: RADIUS_SM, background: SLATE_10, overflow: "hidden" }}>
            <div
              style={{
                width: `${progress * 100}%`,
                height: "100%",
                borderRadius: RADIUS_SM,
                background: VALENTINO_500,
                transition: "width 340ms cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
        </div>

        {/* Sliding content track — only the question content moves; the chrome above stays put. */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div
            className="flex h-full"
            style={{
              width: `${QUESTIONS.length * 100}%`,
              transform: `translateX(-${qIndex * (100 / QUESTIONS.length)}%)`,
              transition: "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {QUESTIONS.map((question, i) => (
              // Top-aligned, identical on every question: app-bar → heading 32, heading → first option 44.
              <div key={question.q} className="h-full flex flex-col overflow-y-auto" style={{ width: `${100 / QUESTIONS.length}%` }}>
                <h1 style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0, paddingLeft: SPACE_L, paddingRight: SPACE_L, paddingTop: SPACE_XL }}>
                  {question.q}
                </h1>
                <div className="flex flex-col" style={{ gap: SPACE_M, paddingLeft: SPACE_L, paddingRight: SPACE_L, paddingTop: 44 }}>
                  {question.options.map((opt) => (
                    <SelectRow key={opt} label={opt} selected={answers[i] === opt} onPick={() => pick(i, opt)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed gesture-nav overlay — ONE handle, common across the intro + questions (the panels slide
          BEHIND it, each reserving GESTURE_NAV_HEIGHT). Handle goes light on the dark intro, dark on the
          white questions. The status bar is the shell's (constant across the whole flow). */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, pointerEvents: "none" }}>
        <GestureNav handleColor={step === 0 ? "rgba(255,255,255,0.4)" : undefined} />
      </div>
    </div>
  );
}
