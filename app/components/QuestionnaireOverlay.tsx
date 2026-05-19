"use client";

import { useState, useEffect } from "react";
import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  ALPHA_BLACK_30,
  VALENTINO_500,
  BG_PRIMARY,
} from "../lib/colors";
import { RADIUS_M, RADIUS_CIRCLE } from "../lib/radii";
import { DlsTag } from "./ChatCards";
import ListItemControl from "./ListItemControl";
import InputField from "./InputField";

// ── Types ────────────────────────────────────────────────────────

export type QuestionOption = {
  id: string;
  label: string;
  tag?: { label: string; intent: "positive" | "warning" | "negative" };
  subtext?: string;
  title?: string;
};

function isRichOption(o: QuestionOption): boolean {
  return !!(o.tag || o.subtext || o.title);
}

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
  const showPagination = total > 1;
  const showPrev = showPagination && !isFirst;
  const showNext = showPagination && !isLast && currentAnswered;

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
          backgroundColor: BG_PRIMARY,
          borderRadius: RADIUS_M,
          boxShadow: "0px 4px 40px rgba(0,0,0,0.10), 0px 0px 0px 1px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
      >
        {/* ── Header: close (leading) + pagination (trailing, only when total > 1) ── */}
        <div
          className="flex items-center"
          style={{ padding: "8px 12px", gap: 8 }}
        >
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
                stroke={TEXT_SECONDARY}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="flex-1" />

          {showPagination && (
            <button
              type="button"
              onClick={showPrev ? () => onNavigate("prev") : undefined}
              disabled={!showPrev}
              className="flex items-center justify-center shrink-0"
              style={{
                width: 28,
                height: 28,
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: showPrev ? "pointer" : "default",
                opacity: showPrev ? 1 : 0,
                pointerEvents: showPrev ? "auto" : "none",
              }}
              aria-label="Previous question"
              aria-hidden={!showPrev}
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
          )}

          {showPagination && (
            <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>
              {currentIndex + 1} of {total}
            </span>
          )}

          {showPagination && (
            <button
              type="button"
              onClick={showNext ? () => onNavigate("next") : undefined}
              disabled={!showNext}
              className="flex items-center justify-center shrink-0"
              style={{
                width: 28,
                height: 28,
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: showNext ? "pointer" : "default",
                opacity: showNext ? 1 : 0,
                pointerEvents: showNext ? "auto" : "none",
              }}
              aria-label="Next question"
              aria-hidden={!showNext}
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
          )}
        </div>

        {/* ── Question content (cross-fade on swap) ── */}
        <div key={question.id} className="q-fade-in" style={{ overflow: "hidden" }}>
          {/* ── Question text ── */}
          <div style={{ padding: "0 24px 16px" }}>
            <h3 style={{ ...typography.headerH3, color: TEXT_PRIMARY, margin: 0 }}>
              {question.text}
            </h3>
          </div>

          {/* ── Options ── */}
          {question.options.length > 0 && (
            <div>
              {question.options.map((option) => {
                const isSelected = answers[question.id] === option.id;
                const rich = isRichOption(option);

                if (rich) {
                  return (
                    <ListItemControl
                      key={option.id}
                      title={option.title ?? option.label}
                      titleTrailing={
                        option.tag ? (
                          <DlsTag intent={option.tag.intent} emphasis="subtle">
                            {option.tag.label}
                          </DlsTag>
                        ) : undefined
                      }
                      subtext={option.subtext}
                      selected={isSelected}
                      onSelect={() => onSelectOption(question.id, option)}
                    />
                  );
                }

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onSelectOption(question.id, option)}
                    className="flex w-full items-center text-left transition-colors duration-150"
                    style={{
                      padding: "16px 24px",
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
                          borderRadius: RADIUS_CIRCLE,
                          border: `2px solid ${isSelected ? VALENTINO_500 : ALPHA_BLACK_30}`,
                          backgroundColor: "transparent",
                          transition: "border-color 150ms ease",
                        }}
                      >
                        {isSelected && (
                          <div style={{ width: 10, height: 10, borderRadius: RADIUS_CIRCLE, backgroundColor: VALENTINO_500 }} />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Free-text input - hidden when any option is rich ── */}
          {!question.options.some(isRichOption) && (
            <div style={{ padding: "16px 24px 24px" }}>
              <div className="flex items-end" style={{ gap: 10 }}>
                <div className="flex-1 min-w-0">
                  <InputField
                    value={freeText}
                    onChange={setFreeText}
                    placeholder="Enter manually..."
                    ariaLabel="Free-text answer"
                  />
                </div>
                {freeText.trim() && (
                  <button
                    type="button"
                    onClick={handleFreeTextSubmit}
                    className="shrink-0 flex items-center justify-center"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: RADIUS_CIRCLE,
                      backgroundColor: VALENTINO_500,
                      border: "none",
                      cursor: "pointer",
                      marginBottom: 14,
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
            </div>
          )}
        </div>{/* end animated question content */}
      </div>
    </div>
  );
}
