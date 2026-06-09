"use client";

import { useState } from "react";
import PotDetail from "@/app/components/PotDetail";
import QuestionnaireOverlay from "@/app/components/QuestionnaireOverlay";
import { typography } from "@/app/lib/typography";
import { TEXT_PRIMARY, BG_PRIMARY } from "@/app/lib/colors";
import { useTheme } from "@/app/lib/theme";

const DEMO_QUESTIONS = [
  {
    id: "q1",
    text: "What are you saving toward?",
    options: [
      { id: "trip", label: "Trip" },
      { id: "purchase", label: "Big purchase" },
      { id: "emergency", label: "Emergency fund" },
      { id: "savings", label: "Increase monthly savings" },
    ],
  },
  {
    id: "q2",
    text: "How much do you want to save?",
    options: [
      { id: "50k", label: "₹50,000" },
      { id: "1l", label: "₹1,00,000" },
      { id: "2l", label: "₹2,00,000" },
      { id: "custom", label: "Custom amount" },
    ],
  },
  {
    id: "q3",
    text: "By when do you need it?",
    options: [
      { id: "3m", label: "3 months" },
      { id: "6m", label: "6 months" },
      { id: "1y", label: "1 year" },
      { id: "flex", label: "No fixed deadline" },
    ],
  },
  {
    id: "q4",
    text: "How often can you save?",
    options: [
      { id: "daily", label: "Daily" },
      { id: "weekly", label: "Weekly" },
      { id: "monthly", label: "Monthly" },
      { id: "irregular", label: "When I can" },
    ],
  },
];

export default function PotPage() {
  const { mode: themeMode } = useTheme();
  const [showQuiz, setShowQuiz] = useState(true);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f4f7] px-6 py-6" style={{ color: TEXT_PRIMARY }}>
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute bottom-8 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-white/50 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[480px]">
        <div className="mx-auto max-w-[360px]">
          <div className="relative rounded-[32px] bg-[#1a1a1e] p-[6px] shadow-[0_28px_70px_rgba(0,0,0,0.16),0_6px_18px_rgba(0,0,0,0.05)] ring-1 ring-white/5">
            <div className={`relative z-10 aspect-[360/780] w-full overflow-hidden rounded-[26px]${themeMode === "dark" ? " dark" : ""}`} style={{ background: BG_PRIMARY }}>
              <PotDetail
                name="Vacation"
                saved={10000}
                target={100000}
                pct={10}
                status="on-track"
                daysLabel="4 months left"
                heroScene="japan"
                onBack={() => {}}
              />

              {/* Questionnaire overlay preview */}
              {showQuiz && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                  }}
                >
                  <QuestionnaireOverlay
                    questions={DEMO_QUESTIONS}
                    currentIndex={quizIndex}
                    answers={answers}
                    onSelectOption={(qId, opt) => {
                      setAnswers((prev) => ({ ...prev, [qId]: opt.id }));
                      if (quizIndex < DEMO_QUESTIONS.length - 1) {
                        setTimeout(() => setQuizIndex((i) => i + 1), 300);
                      }
                    }}
                    onSubmitFreeText={(qId, text) => {
                      setAnswers((prev) => ({ ...prev, [qId]: text }));
                    }}
                    onNavigate={(dir) => {
                      setQuizIndex((i) =>
                        dir === "prev" ? Math.max(0, i - 1) : Math.min(DEMO_QUESTIONS.length - 1, i + 1)
                      );
                    }}
                    onClose={() => setShowQuiz(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
