import type { Question } from "../../components/QuestionnaireOverlay";

// ── Types ───────────────────────────────────────────────────────

export type SimMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

// ── Initial messages ────────────────────────────────────────────

export const INITIAL_MESSAGES: SimMessage[] = [
  { id: "u1", role: "user", text: "I want to plan a trip to Japan" },
];

export const BYRON_ACKNOWLEDGE =
  "Japan. Bold. Let me poke around your finances before I tell you whether this is a plan or a fantasy.";

// ── Questionnaire (skip goal-type + destination - user already said Japan) ──

export const GOAL_QUESTIONS: Question[] = [
  {
    id: "timeline",
    text: "By when are you trying to pull this off?",
    options: [
      { id: "3m", label: "3 months" },
      { id: "6m", label: "6 months" },
      { id: "1y", label: "12 months" },
    ],
  },
  {
    id: "amount",
    text: "How much are we talking?",
    options: [
      { id: "50k", label: "\u20B950k" },
      { id: "1L", label: "\u20B91L" },
      { id: "2L", label: "\u20B92L" },
      { id: "5L", label: "\u20B95L" },
    ],
  },
];

// ── Post-questionnaire summary ──────────────────────────────────

export const POST_QUIZ_SUMMARY =
  "Got it. Let me dig through your finances and see what we are actually working with.";

// ── Clarifying questions (Byron voice) ──────────────────────────

export type ClarifyingQuestion = {
  id: string;
  botText: string;
  chips: { id: string; label: string }[];
};

export const CLARIFYING_QUESTIONS: ClarifyingQuestion[] = [
  {
    id: "cq-obligations",
    botText:
      "I can see rent, a car EMI, and some subscriptions that have been billing you longer than most of your situationships. All of them or just essentials?",
    chips: [
      { id: "all", label: "Throw them all in" },
      { id: "essentials", label: "Just the non-negotiables" },
    ],
  },
  {
    id: "cq-existing",
    botText:
      "You have about \u20B950k sitting in investments. Want to count that toward Japan or pretend it does not exist?",
    chips: [
      { id: "yes", label: "Yeah, count it" },
      { id: "no", label: "Nah, start fresh" },
    ],
  },
  {
    id: "cq-risk",
    botText:
      "Last one. How do you feel about risk? This decides where I park your money.",
    chips: [
      { id: "safe", label: "Play it safe" },
      { id: "balanced", label: "Somewhere in the middle" },
      { id: "aggressive", label: "I can handle it" },
    ],
  },
];

// ── Cruncher status texts ───────────────────────────────────────

export const CRUNCHER_STATUS_BY_QUESTION = [
  "Checking monthly obligations",
  "Reviewing your finances",
  "Analysing risk profile",
];

export const IDLE_CRUNCHER_TEXTS = [
  "Comparing savings instruments",
  "Optimising monthly allocation",
  "Projecting returns",
  "Running scenarios",
  "Crunching the numbers",
  "Building your plan",
];

// ── Final crunching message ─────────────────────────────────────

export const FINAL_CRUNCHING_MSG =
  "This might take a sec. I will ping you when it is ready. Go doom-scroll or something.";

// ── Verbose plan (Byron - short, punchy) ────────────────────────

export const VERBOSE_PLAN_TEXT = `Here is the deal. You need \u20B92L by October. You have \u20B950,000 saved and zero discipline, but I have a plan.

\u20B920,000 a month into an RD at 7.25%. Auto-debit so you cannot sabotage yourself. That compounds to about \u20B91,23,000 in six months.

Your existing \u20B950,000 goes in upfront. By October that sits at roughly \u20B951,875.

Now the hard part. Cut \u20B95,000 a month from the Swiggy-and-subscriptions fund. You are averaging \u20B98,000 on eating out. Your kitchen is right there. That adds \u20B930,000.

Total: roughly \u20B92,05,000. A small buffer, because I know you.

Want me to set this up or are you going to think about it until the flights get more expensive?`;
