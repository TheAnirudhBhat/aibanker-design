"use client";

import { useState, useRef, useEffect } from "react";
import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY,
  TEXT_TERTIARY,
  OUTLINE_SUBTLE,
  VALENTINO_500,
} from "../lib/colors";

// ── Types ────────────────────────────────────────────────────────

export type QuestionOption = {
  id: string;
  label: string;
};

export type Question = {
  id: string;
  text: string;
  options: QuestionOption[];
};

export type QuestionnaireOverlayProps = {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>;
  onSelectOption: (questionId: string, option: QuestionOption) => void;
  onSubmitFreeText: (questionId: string, text: string) => void;
  onNavigate: (direction: "prev" | "next") => void;
  onClose: () => void;
};

// ── Component ────────────────────────────────────────────────────

export default function QuestionnaireOverlay({
  questions,
  currentIndex,
  answers,
  onSelectOption,
  onSubmitFreeText,
  onNavigate,
  onClose,
}: QuestionnaireOverlayProps) {
  const [freeText, setFreeText] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const question = questions[currentIndex];

  useEffect(() => {
    if (!question) return;
    const hasOptions = question.options.length > 0;
    const stored = answers[question.id];
    setFreeText(stored && !hasOptions ? stored : "");
  }, [currentIndex, question, answers]);

  if (!question) return null;

  const total = questions.length;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;
  const currentAnswered = !!answers[question.id];
  const nextDisabled = isLast || !currentAnswered;

  const handleFreeTextSubmit = () => {
    const trimmed = freeText.trim();
    if (!trimmed) return;
    onSubmitFreeText(question.id, trimmed);
    setFreeText("");
  };

  return (
    <div className="questionnaire-overlay-entrance" style={{ padding: "0 16px 16px" }}>
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          boxShadow: "0px 4px 40px rgba(0,0,0,0.10), 0px 0px 0px 1px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
      >
        {/* ── Header: close (leading) + pagination (trailing) ── */}
        <div
          className="flex items-center"
          style={{ padding: "8px 12px", gap: 8 }}
        >
          {/* Close — DLS nav icon: 24px icon, 48px touch, leading */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center shrink-0"
            style={{
              width: 48,
              height: 48,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 12,
            }}
            aria-label="Close questionnaire"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="rgba(0,0,0,0.7)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="flex-1" />

          {/* Prev arrow */}
          <button
            type="button"
            onClick={() => onNavigate("prev")}
            disabled={isFirst}
            className="flex items-center justify-center shrink-0 transition-opacity"
            style={{
              width: 28,
              height: 28,
              opacity: isFirst ? 0.25 : 1,
            }}
            aria-label="Previous question"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M8.5 3L4.5 7L8.5 11"
                stroke={TEXT_TERTIARY}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Counter */}
          <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>
            {currentIndex + 1} of {total}
          </span>

          {/* Next arrow */}
          <button
            type="button"
            onClick={() => onNavigate("next")}
            disabled={nextDisabled}
            className="flex items-center justify-center shrink-0 transition-opacity"
            style={{
              width: 28,
              height: 28,
              opacity: nextDisabled ? 0.25 : 1,
            }}
            aria-label="Next question"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M5.5 3L9.5 7L5.5 11"
                stroke={TEXT_TERTIARY}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* ── Question text ── */}
        <div style={{ padding: "0 24px 16px" }}>
          <h3 style={{ ...typography.headerH3, color: TEXT_PRIMARY, margin: 0 }}>
            {question.text}
          </h3>
        </div>

        {/* ── Options ── */}
        {question.options.length > 0 && (
          <div style={{ padding: "0 24px" }}>
            {question.options.map((option) => {
              const isSelected = answers[question.id] === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSelectOption(question.id, option)}
                  className="flex w-full items-center text-left transition-colors duration-150"
                  style={{
                    padding: "16px 0",
                    gap: 12,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <span className="flex-1" style={{ ...typography.bodyNormal, color: TEXT_PRIMARY }}>
                    {option.label}
                  </span>
                  <div className="shrink-0 flex items-center justify-center" style={{ width: 32 }}>
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 100,
                        border: `2px solid ${isSelected ? VALENTINO_500 : "rgba(0,0,0,0.3)"}`,
                        backgroundColor: "transparent",
                        transition: "border-color 150ms ease",
                      }}
                    >
                      {isSelected && (
                        <div style={{ width: 10, height: 10, borderRadius: 100, backgroundColor: VALENTINO_500 }} />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Free-text input — DLS 2.0 Underlined Input Field ── */}
        <div style={{ padding: "16px 24px 24px" }}>
          <div
            className="flex items-center"
            style={{ gap: 10, minHeight: 32 }}
          >
            <input
              ref={inputRef}
              type="text"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFreeTextSubmit()}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Enter manually..."
              className="flex-1 min-w-0 bg-transparent outline-none"
              style={{
                ...typography.bodyNormal,
                color: freeText ? TEXT_PRIMARY : TEXT_TERTIARY,
                border: "none",
                padding: 0,
              }}
            />

            {freeText.trim() && (
              <button
                type="button"
                onClick={handleFreeTextSubmit}
                className="shrink-0 flex items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 100,
                  backgroundColor: VALENTINO_500,
                  border: "none",
                  cursor: "pointer",
                }}
                aria-label="Submit answer"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 12V4M4 8l4-4 4 4"
                    stroke="#fff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
          <div
            style={{
              height: inputFocused || freeText ? 2 : 1,
              marginTop: 12,
              backgroundColor: inputFocused || freeText ? VALENTINO_500 : OUTLINE_SUBTLE,
              transition: "background-color 150ms ease, height 150ms ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}
