"use client";

import { useState, useRef, useEffect } from "react";
import { ChatAppBar, GestureNav } from "./AppChrome";
import { typography } from "../lib/typography";
import {
  BG_SURFACE, BG_SURFACE_2,
  VALENTINO_500, VALENTINO_50,
  GREEN_500, GREEN_50,
  RED_500, RED_50,
  BLUE_500, BLUE_50,
  ORANGE_500, ORANGE_50,
  TEXT_PRIMARY, TEXT_TERTIARY,
} from "../lib/colors";

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
  variant?: "new5" | "review-ontrack" | "review-rent";
};

// ── Icons ──────────────────────────────────────────────────────────────────

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 4l4 4-4 4" stroke={TEXT_TERTIARY} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Green – bar chart for "Analyse my spends"
function AnalyseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="11" width="3" height="6" rx="0.75" fill="#00a63e" />
      <rect x="8.5" y="7" width="3" height="10" rx="0.75" fill="#00a63e" />
      <rect x="14" y="4" width="3" height="13" rx="0.75" fill="#00a63e" />
    </svg>
  );
}

// Blue – target/bullseye for "Set a savings goal"
function GoalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke="#2b6acf" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="4" stroke="#2b6acf" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="1.5" fill="#2b6acf" />
    </svg>
  );
}

// Purple – water drop for "Find spending leaks"
function LeakIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 3C10 3 4.5 9.5 4.5 13a5.5 5.5 0 0 0 11 0C15.5 9.5 10 3 10 3z" stroke={VALENTINO_500} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

// ── Card icons (monochrome, 16px) ─────────────────────────────────────────

const CARD_ICONS: Record<string, React.ReactNode> = {
  understand: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="9" width="2.5" height="5" rx="0.5" fill={TEXT_PRIMARY} />
      <rect x="6.75" y="6" width="2.5" height="8" rx="0.5" fill={TEXT_PRIMARY} />
      <rect x="11.5" y="3" width="2.5" height="11" rx="0.5" fill={TEXT_PRIMARY} />
    </svg>
  ),
  "goal-new": (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={TEXT_PRIMARY} strokeWidth="1.2" />
      <circle cx="8" cy="8" r="3" stroke={TEXT_PRIMARY} strokeWidth="1.2" />
      <circle cx="8" cy="8" r="1" fill={TEXT_PRIMARY} />
    </svg>
  ),
  "review-goal": (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={TEXT_PRIMARY} strokeWidth="1.2" />
      <circle cx="8" cy="8" r="3" stroke={TEXT_PRIMARY} strokeWidth="1.2" />
      <circle cx="8" cy="8" r="1" fill={TEXT_PRIMARY} />
    </svg>
  ),
  leaks: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2C8 2 3.5 7.5 3.5 10.5a4.5 4.5 0 0 0 9 0C12.5 7.5 8 2 8 2z" stroke={TEXT_PRIMARY} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  ),
  budget: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={TEXT_PRIMARY} strokeWidth="1.2" />
      <path d="M8 2v6h6" stroke={TEXT_PRIMARY} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  txns: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="3" y="2" width="10" height="12" rx="1.2" stroke={TEXT_PRIMARY} strokeWidth="1.2" />
      <line x1="5.5" y1="5.5" x2="10.5" y2="5.5" stroke={TEXT_PRIMARY} strokeWidth="1" strokeLinecap="round" />
      <line x1="5.5" y1="8" x2="10.5" y2="8" stroke={TEXT_PRIMARY} strokeWidth="1" strokeLinecap="round" />
      <line x1="5.5" y1="10.5" x2="8.5" y2="10.5" stroke={TEXT_PRIMARY} strokeWidth="1" strokeLinecap="round" />
    </svg>
  ),
  networth: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <polyline points="2,12 5.5,7 8.5,9 14,4" stroke={TEXT_PRIMARY} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="11,4 14,4 14,7" stroke={TEXT_PRIMARY} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// ── New design variant ────────────────────────────────────────────────────

export type AlertScenario = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
};

// Rent — house icon, red tint
function RentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 10l7-7 7 7" stroke="#ce1d26" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9v6a1 1 0 001 1h8a1 1 0 001-1V9" stroke="#ce1d26" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Salary — clock icon, orange tint
function SalaryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke="#ff9a17" strokeWidth="1.5" />
      <path d="M10 6v4l3 2" stroke="#ff9a17" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Access — lock icon, blue tint
function AccessIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="5" y="9" width="10" height="7" rx="1.5" stroke="#2b6acf" strokeWidth="1.5" />
      <path d="M7 9V7a3 3 0 016 0v2" stroke="#2b6acf" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Spending — flame icon, orange tint
function SpendingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2c0 0-5 5-5 9a5 5 0 0010 0c0-4-5-9-5-9z" stroke="#ff9a17" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 12c0 0-2 1.5-2 3a2 2 0 004 0c0-1.5-2-3-2-3z" stroke="#ff9a17" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// Savings goal — target icon, blue tint
function GoalAlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke="#2b6acf" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="4" stroke="#2b6acf" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="1.5" fill="#2b6acf" />
    </svg>
  );
}

export function InitialPromptContent({ suggestions, onSuggestionClick, onSubmit, variant = "new5" }: Props) {
  return null; // InitialPromptContent is no longer rendered — new variants use inline Chat layout
}

export default function ChatInitialScreen({ suggestions, onSuggestionClick, onSubmit }: Props) {
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden bg-white"
      style={{ fontFamily: "var(--font-rubik), sans-serif" }}
    >
      <ChatAppBar variant="firstTime" navKind="close" voice="ryan" />

      <InitialPromptContent
        suggestions={suggestions}
        onSuggestionClick={onSuggestionClick}
        onSubmit={onSubmit}
      />

      <GestureNav />
    </div>
  );
}

// ── Default suggestions wired to real app flows ───────────────────────────

const defaultSuggestions: InitialSuggestion[] = [
  {
    id: "understand",
    title: "Analyse my spends",
    subtitle: "See where your money is going",
    avatarBg: GREEN_50,
    icon: <AnalyseIcon />,
  },
  {
    id: "goal-new",
    title: "Set a savings goal",
    subtitle: "Plan toward something you want",
    avatarBg: BLUE_50,
    icon: <GoalIcon />,
  },
  {
    id: "leaks",
    title: "Find spending leaks",
    subtitle: "Catch categories creeping up",
    avatarBg: VALENTINO_50,
    icon: <LeakIcon />,
  },
];

export function getSuggestions(hasGoal: boolean): InitialSuggestion[] {
  if (!hasGoal) {
    return defaultSuggestions;
  }

  const reviewGoalSuggestion = defaultSuggestions.find((s) => s.id === "goal-new");
  const otherSuggestions = defaultSuggestions.filter((s) => s.id !== "goal-new");

  if (!reviewGoalSuggestion) {
    return defaultSuggestions;
  }

  return [
    {
      ...reviewGoalSuggestion,
      id: "review-goal",
      title: "Review my savings goal",
      subtitle: "Check your progress",
    },
    ...otherSuggestions,
  ];
}
