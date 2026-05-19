"use client";

import { useRef, useState, type ReactNode } from "react";
import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY,
  TEXT_TERTIARY,
  TEXT_DISABLED,
  OUTLINE_SUBTLE,
  ALPHA_BLACK_20,
  GREEN_500,
  RED_500,
} from "../lib/colors";

// DLS 2.0 - Underlined input field (Figma node 687:7108)
// States: Empty / Focused / Typing / Filled / Disabled
// Types: Default / Help text / Error / Success

export type InputFieldStatus = "default" | "error" | "success";

export type InputFieldProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  leading?: ReactNode;
  helperText?: string;
  status?: InputFieldStatus;
  disabled?: boolean;
  onClear?: () => void;
  type?: "text" | "tel" | "number";
  maxLength?: number;
  inputMode?: "text" | "numeric" | "tel" | "email";
  autoFocus?: boolean;
  ariaLabel?: string;
};

export default function InputField({
  value,
  onChange,
  placeholder,
  leading,
  helperText,
  status = "default",
  disabled = false,
  onClear,
  type = "text",
  maxLength,
  inputMode,
  autoFocus,
  ariaLabel,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasValue = value.length > 0;
  const isActive = focused || hasValue;

  const underlineColor = (() => {
    if (disabled) return OUTLINE_SUBTLE;
    if (status === "error") return RED_500;
    if (status === "success") return GREEN_500;
    if (isActive) return ALPHA_BLACK_20;
    return OUTLINE_SUBTLE;
  })();

  const underlineHeight = !disabled && (isActive || status !== "default") ? 2 : 1;

  const helperColor =
    status === "error" ? RED_500 : status === "success" ? GREEN_500 : TEXT_TERTIARY;

  const textColor = disabled ? TEXT_DISABLED : TEXT_PRIMARY;

  return (
    <div style={{ width: "100%" }}>
      <div
        className="flex items-center"
        style={{ gap: 8, minHeight: 32, cursor: disabled ? "not-allowed" : "text" }}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {leading && (
          <span style={{ ...typography.bodyNormal, color: textColor }}>{leading}</span>
        )}

        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          inputMode={inputMode}
          autoFocus={autoFocus}
          aria-label={ariaLabel}
          className="flex-1 min-w-0 bg-transparent outline-none"
          style={{
            ...typography.bodyNormal,
            color: hasValue ? textColor : TEXT_TERTIARY,
            border: "none",
            padding: 0,
          }}
        />

        {onClear && hasValue && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
              inputRef.current?.focus();
            }}
            aria-label="Clear input"
            className="flex items-center justify-center shrink-0"
            style={{
              width: 24,
              height: 24,
              padding: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M12 4L4 12M4 4l8 8"
                stroke={TEXT_TERTIARY}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      <div
        style={{
          height: underlineHeight,
          marginTop: 12,
          backgroundColor: underlineColor,
          transition: "background-color 150ms ease, height 150ms ease",
        }}
      />

      {helperText && (
        <p
          style={{
            ...typography.caption,
            color: helperColor,
            margin: 0,
            marginTop: 12,
          }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}
