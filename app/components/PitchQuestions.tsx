"use client";

import { Fragment, useEffect, useState, type CSSProperties } from "react";
import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY,
  TEXT_ON_COLOR_PRIMARY,
  VALENTINO_500,
  VALENTINO_600,
  VALENTINO_50,
  OUTLINE_SUBTLE,
  SLATE_10,
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


// Fraction of the continuous onboarding bar owned by LINKING (AASim fills 0 → this).
const LINK_SHARE = 0.5;

// Gesture-nav strip height (pt8 + 4px handle + pb8). Reserved at the bottom of every panel so the
// single fixed gesture-nav overlay (common across intro + questions) never overlaps content.
const GESTURE_NAV_HEIGHT = 20;


// The dark-immersive steps — the shell keys the surface + status-bar glyph colour off these
// (white glyphs on 0 = intro and 4 = the reassurance interstitial).
// The whole flow is white now — intro, questions and the reassurance all ride the
// same living white→grey wash (R14). Kept as an export for the shell's tone gates.
export const PITCH_QUESTIONS_DARK_STEPS: number[] = [];
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

const REASSURE_TITLE = "Reach your goal 2x faster with cosimo";

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

// ── Reassurance goal graph (canon 926:6180) ────────────────────────────────
// Exact canon geometry: the card is a 5% white wash (r16, pt32 pb40 px20) with the ~260×148 plot
// cluster centred inside it. Vectors are lifted verbatim from the Figma exports — the straight
// "with cosimo" line, the #F9E4E5 wavering climb with its soft area fill, two 25%-white dashed
// gridlines over a solid baseline, and the #D723DB dots. Draw order (left → right sweeps via
// pathLength-normalised dashoffset): baseline → without-cosimo → with-cosimo, labels settling late.
function ReassureGraph({ active }: { active: boolean }) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    if (!active) {
      setDrawn(false);
      return;
    }
    const t = window.setTimeout(() => setDrawn(true), 120);
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
        padding: "32px 20px 40px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      {/* The wash presents top-to-bottom with the reveal — it isn't there from the
          start; the strokes then draw over it on their own beats. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 16,
          backgroundColor: "rgba(0,0,0,0.04)",
          clipPath: drawn ? "inset(0 0 0% 0 round 16px)" : "inset(0 0 100% 0 round 16px)",
          transition: "clip-path 640ms cubic-bezier(0.33, 0, 0.13, 1)",
        }}
      />
      <div style={{ position: "relative", width: 260, height: 148 }}>
        <svg viewBox="0 0 260 148" width="260" height="148" aria-hidden="true" style={{ display: "block", overflow: "visible" }}>
          {/* Dashed gridlines + solid baseline (canon 926:6183, offset 5.5/51.73). */}
          <g transform="translate(5.5, 51.73)">
            <path d="M0.69 0.69H254.15" stroke="black" strokeOpacity="0.12" strokeWidth="1.39" strokeLinecap="round" strokeDasharray="5.55 5.55" style={settle(150)} />
            <path d="M0.69 45.12H254.15" stroke="black" strokeOpacity="0.12" strokeWidth="1.39" strokeLinecap="round" strokeDasharray="5.55 5.55" style={settle(150)} />
            <path d="M0.69 89.55H254.15" stroke="black" strokeOpacity="0.5" strokeWidth="1.39" strokeLinecap="round" pathLength={1} style={sweep(0)} />
          </g>
          {/* Without cosimo — soft area fill under the curve (canon 926:6182), fading in late. */}
          <g transform="translate(5.91, 79.43)" style={settle(900)}>
            <path
              d="M138.392 1.65068C103.756 6.88223 35.8601 42.8654 0.813619 58.5025C-0.573987 59.2009 -0.0770636 61.2935 1.47641 61.2935H248.436V1.46524C248.436 0.797505 247.944 0.231548 247.283 0.137778C243.915 -0.366619 234.237 0.238658 222.478 6.69495C207.778 14.7653 177.082 -4.19334 138.392 1.65068Z"
              fill="url(#reassure-wave-fill)"
              fillOpacity="0.12"
            />
          </g>
          {/* Without cosimo — the wavering climb (canon 926:6188). */}
          <g transform="translate(11.57, 79.43)">
            <path
              d="M0.500124 59.0024C35.5466 43.3653 103.443 7.38213 138.078 2.15058C176.769 -3.69344 207.464 15.2652 222.164 7.19485C233.924 0.738561 243.601 0.133284 246.97 0.637682"
              fill="none"
              stroke="black"
              strokeOpacity="0.3"
              strokeWidth="1"
              strokeLinecap="round"
              pathLength={1}
              style={sweep(180)}
            />
          </g>
          {/* With cosimo — the straight climb + magenta dots (canon 926:6189). */}
          <g transform="translate(0, 5.45)">
            <path d="M10.8567 132.713L247.232 8.44512" stroke="#D723DB" strokeWidth="2" strokeLinecap="round" pathLength={1} style={sweep(360)} />
            <circle cx="6.3466" cy="135.258" r="5.65" fill="#D723DB" stroke="white" strokeWidth="1.39" style={settle(300)} />
            <circle cx="252.426" cy="6.34663" r="5.65" fill="#D723DB" stroke="white" strokeWidth="1.39" style={settle(1350)} />
          </g>
          <defs>
            <linearGradient id="reassure-wave-fill" x1="161.34" y1="-1.87" x2="221.27" y2="67.35" gradientUnits="userSpaceOnUse">
              <stop />
              <stop offset="1" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        {/* Labels at their canon offsets within the cluster — every one presents
            with the reveal, nothing sits there from the start. */}
        <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, position: "absolute", left: 2, top: 0, whiteSpace: "nowrap", ...settle(100) }}>Your goal</span>
        <span style={{ ...typography.caption, color: "rgba(0,0,0,0.55)", position: "absolute", left: 148, top: 3, whiteSpace: "nowrap", ...settle(1250) }}>with cosimo</span>
        <span style={{ ...typography.caption, color: "rgba(0,0,0,0.55)", position: "absolute", left: 159, top: 102, whiteSpace: "nowrap", ...settle(1100) }}>Without cosimo</span>
      </div>
    </div>
  );
}

export default function PitchQuestions({
  step,
  onStepChange,
  onComplete,
  onExit,
  mobile = false,
}: {
  /** 0 = intro; 1-3 = Q1-Q3; 4 = reassurance; 5-6 = Q4-Q5. Lifted to the page. */
  step: number;
  onStepChange: (s: number) => void;
  onComplete: () => void;
  /** Back from the intro exits the segment (to linking). */
  onExit: () => void;
  /** Real device (R17): pad with env() safe-areas only — the 44px simulated-bar
      floor stacked an extra gap under the phone's own status bar. */
  mobile?: boolean;
}) {
  const flowTop = mobile ? "env(safe-area-inset-top)" : `${STATUS_BAR_HEIGHT}px`;
  const flowBottom = mobile ? "max(env(safe-area-inset-bottom), 8px)" : `${GESTURE_NAV_HEIGHT}px`;
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const onReassure = step === REASSURE_STEP;
  // Reassurance reveal order: the title TYPES first (after the panel lands), the graph sweeps
  // once it's done, and the quote settles last — one beat per element, top to bottom.
  const [reassureChars, setReassureChars] = useState(0);
  const [reassureQuote, setReassureQuote] = useState(false);
  const reassureTitleDone = reassureChars >= REASSURE_TITLE.length;
  useEffect(() => {
    if (!onReassure) {
      setReassureChars(0);
      setReassureQuote(false);
      return;
    }
    let iv: number | null = null;
    // Let the panel's slide land, then type at chat-typewriter pace.
    const start = window.setTimeout(() => {
      iv = window.setInterval(() => {
        setReassureChars((c) => {
          if (c >= REASSURE_TITLE.length) {
            if (iv !== null) window.clearInterval(iv);
            return c;
          }
          return c + 1;
        });
      }, 26);
    }, 420);
    // Quote lands after the graph's sweep has finished (~2s after the title completes).
    const quote = window.setTimeout(() => setReassureQuote(true), 420 + REASSURE_TITLE.length * 26 + 2100);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(quote);
      if (iv !== null) window.clearInterval(iv);
    };
  }, [onReassure]);
  const onQuestions = step >= 1 && !onReassure;
  // Active question index within the content track. While the interstitial covers the questions,
  // the track holds its last position (Q3) so nothing shuffles behind the overlay.
  // The track has SIX slides now — the reassurance sits between Q3 and Q4 (R15),
  // so it pushes in and out like any question: q1-3 → 0-2, reassure → 3, q4-5 → 4-5.
  const trackIndex = step <= 3 ? Math.max(0, step - 1) : step === REASSURE_STEP ? 3 : Math.min(QUESTIONS.length, step - 1);
  // Questions answered/at-hand for the fill — the interstitial doesn't consume progress.
  const questionsReached = step <= 3 ? step : step === REASSURE_STEP ? 3 : step - 1;
  const progress = LINK_SHARE + (Math.max(1, questionsReached) / QUESTIONS.length) * (1 - LINK_SHARE);

  // One live ground across the whole flow (intro + questions + reassurance):
  // WHITE (reverted from the grey silk, R18) with a handful of subtle grey blobs —
  // Figma-style layer-blurred ellipses done as soft radial gradients — so it reads
  // as a light, modern mesh. The drift loop keeps them gently moving; it never
  // reads as a colour.
  const flowWash: CSSProperties = {
    backgroundColor: "#FFFFFF",
    backgroundImage:
      `radial-gradient(44% 36% at 14% 16%, rgba(173,184,197,0.22) 0%, rgba(173,184,197,0) 72%),` +
      `radial-gradient(52% 42% at 90% 28%, rgba(186,195,207,0.18) 0%, rgba(186,195,207,0) 72%),` +
      `radial-gradient(48% 38% at 28% 90%, rgba(179,189,201,0.20) 0%, rgba(179,189,201,0) 72%),` +
      `radial-gradient(42% 34% at 80% 78%, rgba(196,204,214,0.15) 0%, rgba(196,204,214,0) 72%)`,
    backgroundSize: "165% 165%",
    // the drift loop OWNS the position — a slow diagonal wander
    animation: "pitchWashDrift 14s ease-in-out infinite",
  };

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
      {/* ONE fixed wash behind the whole flow (R19) — the panels are transparent, so
          the ground never travels with a slide: intro → Q1 used to visibly swap the
          blobs because each panel carried its own copy of the wash. */}
      <div aria-hidden className="absolute inset-0" style={flowWash} />

      {/* ── INTRO screen — white like the rest of the flow, riding the shared fixed
          wash (R14/R19) — slides out left when entering the questions ── */}
      <div
        className="absolute inset-0 flex flex-col"
        style={{
          paddingTop: flowTop,
          paddingBottom: flowBottom,
          transform: step >= 1 ? "translateX(-100%)" : "translateX(0)",
          transition: "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* The shared chrome (back + progress) is hoisted above this panel too —
            it holds across the intro as well (R15). */}
        <div className="shrink-0" style={{ height: 64 }} />
        <div className="flex-1 min-h-0 flex flex-col">
          <div style={{ flex: "0 0 22%" }} />
          <div className="flex flex-col" style={{ paddingLeft: SPACE_XL, paddingRight: SPACE_XL, gap: SPACE_S, marginTop: SPACE_XL }}>
            <h1 style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0 }}>
              Lets talk about your money habits and goals
            </h1>
            <p style={{ ...typography.bodyNormal, color: "rgba(0,0,0,0.55)", margin: 0 }}>
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
                width: "100%",
                height: 48,
                borderRadius: RADIUS_CIRCLE,
                backgroundColor: VALENTINO_500,
                border: "none",
                cursor: "pointer",
                ...typography.buttonNormal,
                color: TEXT_ON_COLOR_PRIMARY,
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      {/* ── QUESTIONS screen (white) — ONE fixed chrome + a sliding content track.
          The ground is a barely-there white→grey wash that drifts a step with each
          question, so the page feels alive without ever reading as a colour. ── */}
      <div
        className="absolute inset-0 flex flex-col"
        style={{
          paddingTop: flowTop,
          paddingBottom: flowBottom,
          transform: step >= 1 ? "translateX(0)" : "translateX(100%)",
          transition: "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* The question chrome (back + progress) is HOISTED above the panels now —
            this spacer just reserves its row so content lands below it. */}
        <div className="shrink-0" style={{ height: 64 }} />

        {/* Sliding content track — only the content moves; the chrome above stays
            put. The REASSURANCE rides the track as its own slide between Q3 and Q4
            (R15): every transition is the same clean push — the last screen slides
            fully away as the next one arrives, both directions. */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div
            className="flex h-full"
            style={{
              width: `${(QUESTIONS.length + 1) * 100}%`,
              transform: `translateX(-${trackIndex * (100 / (QUESTIONS.length + 1))}%)`,
              transition: "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {QUESTIONS.map((question, i) => (
              <Fragment key={question.q}>
                {/* the reassurance slide, seated after Q3 */}
                {i === 3 && (
                  <div key="reassure" className="h-full flex flex-col" style={{ width: `${100 / (QUESTIONS.length + 1)}%` }}>
                    <div className="flex-1 min-h-0 flex flex-col" style={{ paddingLeft: SPACE_L, paddingRight: SPACE_L }}>
                      {/* minHeight parks all three lines so the typewriter doesn't
                          push the graph around while it types. Same top offset as the
                          question titles (SPACE_XL), graph pulled up to compensate (R18). */}
                      <h1 style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0, paddingLeft: SPACE_S, paddingRight: SPACE_S, paddingTop: SPACE_XL, minHeight: 132 }}>
                        {REASSURE_TITLE.slice(0, reassureChars)}
                      </h1>
                      <div style={{ marginTop: SPACE_XL + SPACE_M, marginLeft: 8 }}>
                        <ReassureGraph active={onReassure && reassureTitleDone} />
                      </div>
                      <div className="flex-1" />
                      {/* Commitment research quote — a quiet left-rule block above the CTA, settling in last.
                          Sits 40 clear of the CTA (was 12 — read as cramped). */}
                      <div style={{ borderLeft: "2px solid rgba(0,0,0,0.2)", paddingLeft: SPACE_M, marginBottom: 40, paddingRight: SPACE_S, opacity: reassureQuote ? 1 : 0, transition: "opacity 480ms ease" }}>
                        <p style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY, margin: 0 }}>
                          &ldquo;People are more likely to stay committed when they&apos;re working toward a specific goal&rdquo;
                        </p>
                        <p style={{ ...typography.caption, color: "rgba(0,0,0,0.5)", margin: "4px 0 0" }}>- Edwin Locke &amp; Gary Latham</p>
                      </div>
                    </div>
                    {/* The CTA is the LAST thing to present — it settles in with the
                        quote, after the title has typed and the graph has drawn (R14). */}
                    <div className="shrink-0" style={{ opacity: reassureQuote ? 1 : 0, transition: "opacity 480ms ease 160ms", pointerEvents: reassureQuote ? "auto" : "none" }}>
                      <div className="flex items-center justify-center" style={{ paddingLeft: SPACE_L, paddingRight: SPACE_L, paddingBottom: SPACE_L }}>
                        <button
                          type="button"
                          onClick={() => onStepChange(5)}
                          className="transition-transform active:scale-[0.98]"
                          style={{
                            width: "100%",
                            maxWidth: "100%",
                            height: 48,
                            borderRadius: RADIUS_CIRCLE,
                            // primary CTA on the white page (DLS primary: Valentino on white)
                            backgroundColor: VALENTINO_500,
                            border: "none",
                            cursor: "pointer",
                            ...typography.buttonNormal,
                            color: TEXT_ON_COLOR_PRIMARY,
                          }}
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Top-aligned, identical on every question: app-bar → heading 32, heading → first option 44. */}
                <div className="h-full flex flex-col overflow-y-auto" style={{ width: `${100 / (QUESTIONS.length + 1)}%` }}>
                  <h1 style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0, paddingLeft: SPACE_L, paddingRight: SPACE_L, paddingTop: SPACE_XL }}>
                    {question.q}
                  </h1>
                  <div className="flex flex-col" style={{ gap: SPACE_M, paddingLeft: SPACE_L, paddingRight: SPACE_L, paddingTop: 44 }}>
                    {question.options.map((opt) => (
                      <SelectRow key={opt} label={opt} selected={answers[i] === opt} onPick={() => pick(i, opt)} />
                    ))}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── Persistent question chrome: back + progress. ONE bar shared by the
          intro, the questions AND the reassurance — the panels slide BENEATH it,
          the bar only morphs (progress fill), never travels with a page (R15). ── */}
      <div
        className="absolute left-0 right-0 flex items-center"
        style={{
          top: flowTop,
          height: 64,
          paddingLeft: 12,
          paddingRight: 36,
          zIndex: 5,
        }}
      >
        <button
          type="button"
          onClick={() => (step === 0 ? onExit() : onStepChange(step - 1))}
          aria-label="Back"
          className="flex items-center justify-center transition-transform active:scale-[0.9]"
          style={{ width: 48, height: 48, background: "none", border: "none", cursor: "pointer", padding: 12 }}
        >
          <ChevronBack color={TEXT_PRIMARY} />
        </button>
        {/* a track you can actually see against the wash (SLATE_10 vanished, R16) */}
        <div style={{ flex: 1, marginLeft: 12, height: 4, borderRadius: RADIUS_SM, background: "#E0E7EE", overflow: "hidden" }}>
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

      {/* Fixed gesture-nav overlay — ONE handle, common across every panel (they slide BEHIND it,
          each reserving GESTURE_NAV_HEIGHT). Handle goes light on the dark surfaces (intro +
          reassurance), dark on the white questions. The status bar is the shell's. */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, pointerEvents: "none" }}>
        <GestureNav handleColor={PITCH_QUESTIONS_DARK_STEPS.includes(step) ? "rgba(255,255,255,0.4)" : undefined} />
      </div>
    </div>
  );
}
