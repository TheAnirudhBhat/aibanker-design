"use client";

import { useEffect, useState, type CSSProperties } from "react";
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
import { RADIUS_CIRCLE, RADIUS_SM, RADIUS_L } from "../lib/radii";
import { SPACE_S, SPACE_M, SPACE_L, SPACE_XL } from "../lib/spacing";
import { GestureNav, STATUS_BAR_HEIGHT } from "./AppChrome";

// ══════════════════════════════════════════════════════════════════
//  Questions segment — "Ask the user for more details". Canonical
//  Figma (Onboarding · 670:4594 +4, priority question 882:6082,
//  reassurance 882:6117). Screens:
//   • INTRO (step 0): dark-immersive, its own chrome (white back, no bar).
//   • QUESTIONS (steps 1-3, 5-6): ONE fixed common chrome (back + a
//     FULL-WIDTH progress bar that FILLS, canon 843:5331) over a sliding
//     content track — only the question content pushes; the chrome stays put.
//   • REASSURANCE (step 4): a dark-immersive interstitial mid-flow — the
//     goal graph draws itself left → right, then the quote settles in.
//  The progress bar continues the LINKING bar (LINK_SHARE → 1.0) across
//  the questions; the interstitial doesn't consume progress.
// ══════════════════════════════════════════════════════════════════

const INTRO_GRADIENT = "linear-gradient(155deg, #190028 0%, #3E0065 45%, #0D0021 100%)";

// Fraction of the continuous onboarding bar owned by LINKING (AASim fills 0 → this).
const LINK_SHARE = 0.5;

// Gesture-nav strip height (pt8 + 4px handle + pb8). Reserved at the bottom of every panel so the
// single fixed gesture-nav overlay (common across intro + questions) never overlaps content.
const GESTURE_NAV_HEIGHT = 20;

// The dark-immersive steps — the shell keys the surface + status-bar glyph colour off these
// (white glyphs on 0 = intro and 4 = the reassurance interstitial).
export const PITCH_QUESTIONS_DARK_STEPS = [0, 4];
const REASSURE_STEP = 4;

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
    // Canon 882:6082 — the priority question, added mid-flow.
    q: "What's your biggest financial priority right now?",
    options: ["Save more consistently", "Build an emergency fund", "Buy something important", "Building financial security"],
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

// Question index ⇄ step mapping around the interstitial: steps 1-3 are Q0-Q2, step 4 is the
// reassurance, steps 5-6 are Q3-Q4.
const stepForQuestion = (i: number) => (i <= 2 ? i + 1 : i + 2);

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

// ── Reassurance goal graph (canon 882:6117) ────────────────────────────────
// Draws itself the moment the interstitial lands: baseline first, then the modest
// "Without cosimo" curve, then the straight "with cosimo" line to the magenta dot —
// every stroke sweeping left → right (pathLength-normalised dashoffset), labels and
// dots settling in as their lines complete.
function ReassureGraph({ active }: { active: boolean }) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    if (!active) {
      setDrawn(false);
      return;
    }
    // Let the panel's slide land first, then start the sweep.
    const t = window.setTimeout(() => setDrawn(true), 420);
    return () => window.clearTimeout(t);
  }, [active]);

  const sweep = (delay: number): CSSProperties => ({
    strokeDasharray: 1,
    strokeDashoffset: drawn ? 0 : 1,
    transition: `stroke-dashoffset 1100ms cubic-bezier(0.33, 0, 0.13, 1) ${delay}ms`,
  });
  const settle = (delay: number): CSSProperties => ({
    opacity: drawn ? 1 : 0,
    transition: `opacity 420ms ease ${delay}ms`,
  });

  return (
    <div
      style={{
        position: "relative",
        borderRadius: RADIUS_L,
        backgroundColor: "rgba(255,255,255,0.08)",
        padding: SPACE_L,
      }}
    >
      <p style={{ ...typography.headerH4, color: TEXT_ON_COLOR_PRIMARY, margin: 0 }}>Your goal</p>
      <div style={{ position: "relative", marginTop: SPACE_M }}>
        <svg viewBox="0 0 272 176" width="100%" aria-hidden="true" style={{ display: "block", overflow: "visible" }}>
          {/* Dashed gridlines — fade in with the sweep. */}
          <line x1="8" y1="60" x2="264" y2="60" stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeDasharray="6 6" style={settle(150)} />
          <line x1="8" y1="100" x2="264" y2="100" stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeDasharray="6 6" style={settle(150)} />
          {/* Baseline */}
          <path d="M8 156 H264" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" pathLength={1} style={sweep(0)} />
          {/* Without cosimo — a modest, wavering climb. */}
          <path
            d="M8 156 C 52 128, 86 112, 122 108 C 150 105, 166 112, 192 109 C 216 106, 234 112, 252 104"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1.5"
            pathLength={1}
            style={sweep(180)}
          />
          {/* With cosimo — the straight climb to the goal. */}
          <path d="M8 156 L252 28" fill="none" stroke="#FFFFFF" strokeWidth="2" pathLength={1} style={sweep(360)} />
          {/* Anchor + goal dots — land as their line completes. */}
          <circle cx="8" cy="156" r="6" fill={VALENTINO_500} stroke="#FFFFFF" strokeWidth="1.5" style={settle(300)} />
          <circle cx="252" cy="28" r="6" fill={VALENTINO_500} stroke="#FFFFFF" strokeWidth="1.5" style={settle(1350)} />
        </svg>
        {/* Line labels — positioned over the plot, settling in late. */}
        <span style={{ ...typography.caption, color: TEXT_ON_COLOR_PRIMARY, position: "absolute", right: 28, top: "8%", ...settle(1250) }}>with cosimo</span>
        <span style={{ ...typography.caption, color: TEXT_ON_COLOR_SECONDARY, position: "absolute", right: 12, top: "68%", ...settle(1100) }}>Without cosimo</span>
      </div>
    </div>
  );
}

export default function PitchQuestions({
  step,
  onStepChange,
  onComplete,
  onExit,
}: {
  /** 0 = intro; 1-3 = Q1-Q3; 4 = reassurance; 5-6 = Q4-Q5. Lifted to the page. */
  step: number;
  onStepChange: (s: number) => void;
  onComplete: () => void;
  /** Back from the intro exits the segment (to linking). */
  onExit: () => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const onReassure = step === REASSURE_STEP;
  const onQuestions = step >= 1 && !onReassure;
  // Active question index within the content track. While the interstitial covers the questions,
  // the track holds its last position (Q3) so nothing shuffles behind the overlay.
  const qIndex = step <= 3 ? Math.max(0, step - 1) : step === REASSURE_STEP ? 2 : Math.min(QUESTIONS.length - 1, step - 2);
  // Questions answered/at-hand for the fill — the interstitial doesn't consume progress.
  const questionsReached = step <= 3 ? step : step === REASSURE_STEP ? 3 : step - 1;
  const progress = LINK_SHARE + (Math.max(1, questionsReached) / QUESTIONS.length) * (1 - LINK_SHARE);

  const pick = (i: number, opt: string) => {
    setAnswers((a) => ({ ...a, [i]: opt }));
    // Hold the selected state a beat, then advance — into the reassurance after Q3, onward or
    // out after the rest.
    window.setTimeout(() => {
      if (i >= QUESTIONS.length - 1) onComplete();
      else if (i === 2) onStepChange(REASSURE_STEP);
      else onStepChange(stepForQuestion(i + 1));
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
          transform: step >= 1 ? "translateX(-100%)" : "translateX(0)",
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
          <div className="flex flex-col" style={{ paddingLeft: SPACE_XL, paddingRight: SPACE_XL, gap: SPACE_S, marginTop: SPACE_XL }}>
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
          transform: step >= 1 ? "translateX(0)" : "translateX(100%)",
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

      {/* ── REASSURANCE interstitial (canon 882:6117) — dark-immersive, mid-flow ── */}
      <div
        className="absolute inset-0 flex flex-col"
        style={{
          background: INTRO_GRADIENT,
          paddingTop: STATUS_BAR_HEIGHT,
          paddingBottom: GESTURE_NAV_HEIGHT,
          transform: onReassure ? "translateX(0)" : step > REASSURE_STEP ? "translateX(-100%)" : "translateX(100%)",
          transition: "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div className="shrink-0 flex items-center" style={{ height: 64, paddingLeft: 12 }}>
          <button
            type="button"
            onClick={() => onStepChange(3)}
            aria-label="Back"
            className="flex items-center justify-center transition-transform active:scale-[0.9]"
            style={{ width: 48, height: 48, background: "none", border: "none", cursor: "pointer", padding: 12 }}
          >
            <ChevronBack color={TEXT_ON_COLOR_PRIMARY} />
          </button>
        </div>
        <div className="flex-1 min-h-0 flex flex-col" style={{ paddingLeft: SPACE_L, paddingRight: SPACE_L }}>
          <h1 style={{ ...typography.headerH1, color: TEXT_ON_COLOR_PRIMARY, margin: 0, paddingLeft: SPACE_S, paddingRight: SPACE_S, paddingTop: SPACE_XL }}>
            Reach your goal 2x faster with cosimo
          </h1>
          <div style={{ marginTop: SPACE_XL + SPACE_M }}>
            <ReassureGraph active={onReassure} />
          </div>
          <div className="flex-1" />
          {/* Commitment research quote — a quiet left-rule block above the CTA. */}
          <div style={{ borderLeft: "2px solid rgba(255,255,255,0.35)", paddingLeft: SPACE_M, marginBottom: SPACE_XL, paddingRight: SPACE_S }}>
            <p style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_ON_COLOR_PRIMARY, margin: 0 }}>
              &ldquo;People are more likely to stay committed when they&apos;re working toward a specific goal&rdquo;
            </p>
            <p style={{ ...typography.caption, color: TEXT_ON_COLOR_SECONDARY, margin: "4px 0 0" }}>- Edwin Locke &amp; Gary Latham</p>
          </div>
        </div>
        <div className="shrink-0">
          <div className="flex items-center justify-center" style={{ paddingLeft: SPACE_L, paddingRight: SPACE_L, paddingBottom: SPACE_M }}>
            <button
              type="button"
              onClick={() => onStepChange(5)}
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

      {/* Fixed gesture-nav overlay — ONE handle, common across every panel (they slide BEHIND it,
          each reserving GESTURE_NAV_HEIGHT). Handle goes light on the dark surfaces (intro +
          reassurance), dark on the white questions. The status bar is the shell's. */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, pointerEvents: "none" }}>
        <GestureNav handleColor={PITCH_QUESTIONS_DARK_STEPS.includes(step) ? "rgba(255,255,255,0.4)" : undefined} />
      </div>
    </div>
  );
}
