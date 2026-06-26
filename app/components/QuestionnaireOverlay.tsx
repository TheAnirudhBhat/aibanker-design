"use client";

import { useState, useEffect } from "react";
import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  TEXT_ON_COLOR_PRIMARY,
  OUTLINE_BOLD,
  OUTLINE_SUBTLE,
  MAIN_PRIMARY,
  BG_SECONDARY,
  BG_PRIMARY,
} from "../lib/colors";
import { RADIUS_M, RADIUS_CIRCLE } from "../lib/radii";
import { DlsTag } from "./ChatCards";
import ListItemControl from "./ListItemControl";
import InputField from "./InputField";
import { useTheme } from "../lib/theme";

// ── Types ────────────────────────────────────────────────────────

export type QuestionOption = {
  id: string;
  label: string;
  tag?: { label: string; intent: "positive" | "warning" | "negative" | "brand" | "info" | "neutral" };
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
  inline?: boolean; // render as an inline chat card (no bottom-sheet slide-up, no dismiss header)
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
  inline = false,
}: QuestionnaireOverlayProps) {
  const [freeText, setFreeText] = useState("");
  const { mode } = useTheme();
  const isDark = mode === "dark";
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
    <div className={inline ? "" : "questionnaire-overlay-entrance"} style={{ padding: inline ? 0 : "0 16px 16px" }}>
      <div
        style={{
          // Inline reads as a chat card: white in light, dark surface in dark. The bottom-sheet
          // overlay keeps the lifted BG_SECONDARY in both modes.
          backgroundColor: inline && !isDark ? BG_PRIMARY : BG_SECONDARY,
          borderRadius: RADIUS_M,
          // Lifted secondary surface (like the suggestion sheet). Light: a soft shadow separates it
          // from the white chat; dark: the BG_SECONDARY colour itself lifts it off the BG, no shadow.
          boxShadow: isDark ? "none" : "0px 4px 40px rgba(0,0,0,0.10), 0px 0px 0px 1px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
      >
        {/* ── Header: close (leading) + pagination (trailing, only when total > 1). Hidden when
            inline (it's a chat card — no dismiss X / pager). ── */}
        {!inline && (
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
        )}

        {/* ── Question content (cross-fade on swap) ── */}
        <div key={question.id} className="q-fade-in" style={{ overflow: "hidden" }}>
          {/* ── Question text ── (inline has no header above it, so it carries the top margin) */}
          <div style={{ padding: inline ? "24px 24px 16px" : "0 24px 16px" }}>
            <h3 style={{ ...typography.headerH3, color: TEXT_PRIMARY, margin: 0 }}>
              {question.text}
            </h3>
          </div>

          {/* ── Options ── */}
          {question.options.length > 0 && (
            <div>
              {question.options.map((option, idx) => {
                const isSelected = answers[question.id] === option.id;
                const rich = isRichOption(option);

                if (rich) {
                  // Align rich rows to the 24px content margin (this 8px + ListItemControl's own 16px
                  // inset = 24px, matching the heading/free-text). A subtle hairline separates
                  // consecutive rows, inset to the same 24px so it respects the margin (not full-bleed).
                  const prevRich = idx > 0 && isRichOption(question.options[idx - 1]);
                  return (
                    <div key={option.id} style={{ padding: "0 8px" }}>
                      {prevRich && (
                        <div style={{ height: 1, background: OUTLINE_SUBTLE, margin: "0 16px" }} />
                      )}
                      <ListItemControl
                        title={option.title ?? option.label}
                        trailing={
                          option.tag ? (
                            <DlsTag intent={option.tag.intent} emphasis="subtle">
                              {option.tag.label}
                            </DlsTag>
                          ) : undefined
                        }
                        kind={option.tag ? "none" : "radio"}
                        subtext={option.tag ? undefined : option.subtext}
                        subtextTone="tertiary"
                        selected={isSelected}
                        onSelect={() => onSelectOption(question.id, option)}
                      />
                    </div>
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
                          border: `2px solid ${isSelected ? MAIN_PRIMARY : OUTLINE_BOLD}`,
                          backgroundColor: "transparent",
                          transition: "border-color 150ms ease",
                        }}
                      >
                        {isSelected && (
                          <div style={{ width: 10, height: 10, borderRadius: RADIUS_CIRCLE, backgroundColor: MAIN_PRIMARY }} />
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
                      backgroundColor: MAIN_PRIMARY,
                      border: "none",
                      cursor: "pointer",
                      marginBottom: 14,
                    }}
                    aria-label="Submit answer"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 12V4M4 8l4-4 4 4"
                        stroke={TEXT_ON_COLOR_PRIMARY}
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
