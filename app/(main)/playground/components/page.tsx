"use client";

import { useState, useEffect } from "react";
import { COMPONENT_STATUS, STATUSES } from "@/app/preview/_shared/status-registry";
import type { ItemStatus } from "@/app/preview/_shared/status-registry";
import PlaygroundCard from "@/app/preview/_shared/PlaygroundCard";

// Component imports
import QuestionnaireOverlay from "@/app/components/QuestionnaireOverlay";
import PlanCruncherV2 from "@/app/components/PlanCruncherV2";
import GoalTracker from "@/app/components/GoalTracker";
import PersonaToggle from "@/app/components/PersonaToggle";
import type { Persona } from "@/app/components/PersonaToggle";
import { StatusBar, AppBar, NavButton, GestureNav } from "@/app/components/AppChrome";

// Fixture data
import { DBG_GOAL_QUESTIONS, GOAL_TRACKER_SCENARIOS } from "@/app/lib/debug-fixtures";
import { TEXT_PRIMARY, OUTLINE_SUBTLE } from "@/app/lib/colors";
import { ELEVATION_CARD } from "@/app/lib/elevation";
import { typography } from "@/app/lib/typography";

// ── Cruncher status texts (from flows) ───────────────────────

const CRUNCHER_TEXTS = [
  "Gathering your preferences",
  "Checking monthly obligations",
  "Comparing savings instruments",
  "Optimising monthly allocation",
  "Projecting returns",
  "Crunching the numbers",
];

// ── Stateful wrappers ────────────────────────────────────────

function QuestionnaireWrapper() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white">
      <StatusBar />
      <div className="flex-1" />
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <QuestionnaireOverlay
          questions={DBG_GOAL_QUESTIONS}
          currentIndex={idx}
          answers={answers}
          onSelectOption={(qId, opt) => {
            setAnswers((prev) => ({ ...prev, [qId]: opt.id }));
            setIdx((i) => Math.min(i + 1, DBG_GOAL_QUESTIONS.length - 1));
          }}
          onSubmitFreeText={(qId, text) => {
            setAnswers((prev) => ({ ...prev, [qId]: text }));
            setIdx((i) => Math.min(i + 1, DBG_GOAL_QUESTIONS.length - 1));
          }}
          onNavigate={(dir) =>
            setIdx((i) =>
              dir === "next"
                ? Math.min(i + 1, DBG_GOAL_QUESTIONS.length - 1)
                : Math.max(i - 1, 0)
            )
          }
          onClose={() => {}}
        />
        <GestureNav />
      </div>
    </div>
  );
}

function PlanCruncherWrapper() {
  const [textIdx, setTextIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTextIdx((i) => (i + 1) % CRUNCHER_TEXTS.length), 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <PlanCruncherV2
      goalName="Trip to Japan"
      visible
      statusText={CRUNCHER_TEXTS[textIdx]}
    />
  );
}

function PersonaToggleWrapper() {
  const [active, setActive] = useState<Persona>("ryan");
  return (
    <div className="w-fit">
      <PersonaToggle active={active} onToggle={setActive} />
    </div>
  );
}

function AppChromeStandard() {
  return (
    <div className="flex h-full flex-col bg-white">
      <AppBar
        leading={<NavButton kind="back" />}
        title="Ryan"
      />
      <div className="flex flex-1 items-center justify-center">
        <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY, opacity: 0.3 }}>Screen content</p>
      </div>
      <GestureNav />
    </div>
  );
}

function AppChromeDegen() {
  const [persona, setPersona] = useState<Persona>("byron");

  return (
    <div className="relative flex h-full flex-col bg-white">
      {/* Floating app bar — matches DegenModeSimV1 */}
      <div className="absolute top-0 left-0 right-0 z-10" style={{ pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto" }}>
          <StatusBar backgroundColor="transparent" />
          <div className="flex items-center" style={{ padding: "8px 12px 8px 8px" }}>
            <div style={{ width: 48, height: 48, display: "flex", alignItems: "center" }}>
              <div
                className="flex items-center justify-center rounded-full bg-white"
                style={{ width: 48, height: 48, border: `1px solid ${OUTLINE_SUBTLE}`, boxShadow: ELEVATION_CARD }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke={TEXT_PRIMARY} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <PersonaToggle active={persona} onToggle={setPersona} />
            </div>
            <GoalTracker goals={GOAL_TRACKER_SCENARIOS.single} onGoalTap={() => {}} singleVariant="icon" />
          </div>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY, opacity: 0.3 }}>Screen content</p>
      </div>
      <GestureNav />
    </div>
  );
}

// ── Component definitions ────────────────────────────────────

type ComponentDef = {
  id: string;
  label: string;
  description: string;
  deviceFrame?: boolean;
  variants: { name: string; render: () => React.ReactNode }[];
};

const COMPONENTS: ComponentDef[] = [
  {
    id: "questionnaire-overlay",
    label: "Questionnaire overlay",
    description: "Multi-question form with radio options",
    deviceFrame: true,
    variants: [
      { name: "v1", render: () => <QuestionnaireWrapper /> },
    ],
  },
  {
    id: "plan-cruncher-v2",
    label: "Plan cruncher",
    description: "Spinning status card during goal planning",
    variants: [
      { name: "v1", render: () => <PlanCruncherWrapper /> },
    ],
  },
  {
    id: "goal-tracker",
    label: "Goal tracker",
    description: "Compact progress ring indicator for app bar trailing slot",
    variants: [
      {
        name: "single",
        render: () => (
          <GoalTracker goals={GOAL_TRACKER_SCENARIOS.single} onGoalTap={() => {}} singleVariant="pct" />
        ),
      },
      {
        name: "multi",
        render: () => (
          <GoalTracker goals={GOAL_TRACKER_SCENARIOS.three} onGoalTap={() => {}} />
        ),
      },
    ],
  },
  {
    id: "persona-toggle",
    label: "Persona toggle",
    description: "Ryan/Byron character switcher",
    variants: [
      { name: "v1", render: () => <PersonaToggleWrapper /> },
    ],
  },
  {
    id: "app-chrome",
    label: "App chrome",
    description: "Status bar, app bar, and gesture nav compositions",
    deviceFrame: true,
    variants: [
      { name: "standard", render: () => <AppChromeStandard /> },
      { name: "degen", render: () => <AppChromeDegen /> },
    ],
  },
];

// ── Page ──────────────────────────────────────────────────────

function ComponentEntry({
  comp,
  status,
  onCycleStatus,
}: {
  comp: ComponentDef;
  status: ItemStatus;
  onCycleStatus: () => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <PlaygroundCard
      name={comp.label}
      description={comp.description}
      status={status}
      onCycleStatus={onCycleStatus}
      variants={comp.variants.map((v) => v.name)}
      activeVariantIndex={activeIdx}
      onVariantChange={setActiveIdx}
      deviceFrame={comp.deviceFrame}
    >
      {comp.variants[activeIdx].render()}
    </PlaygroundCard>
  );
}

export default function ComponentsPage() {
  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>(
    () => ({ ...COMPONENT_STATUS })
  );

  const cycleStatus = (id: string) => {
    setStatuses((prev) => {
      const cur = prev[id] ?? "exploring";
      const idx = STATUSES.indexOf(cur);
      return { ...prev, [id]: STATUSES[(idx + 1) % STATUSES.length] };
    });
  };

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Components</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Standalone UI components — overlays, trackers, toggles, and chrome
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {COMPONENTS.map((comp) => (
          <ComponentEntry
            key={comp.id}
            comp={comp}
            status={statuses[comp.id] ?? "exploring"}
            onCycleStatus={() => cycleStatus(comp.id)}
          />
        ))}
      </div>
    </div>
  );
}
