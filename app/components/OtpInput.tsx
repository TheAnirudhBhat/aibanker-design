"use client";

import { useEffect, useRef, useState } from "react";
import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY,
  ALPHA_BLACK_20,
  VALENTINO_500,
  RED_500,
  BG_DISABLED,
} from "../lib/colors";
import { RADIUS_CIRCLE } from "../lib/radii";

// DLS 2.0 - OTP (Figma node 791:24031)
// 4-digit: 52×52 cell, gap 16, body large digit
// 6-digit: 40×40 cell, gap 8, body small digit
// States: Default / Focused / Active / Filled / Disabled / Error

export type OtpInputProps = {
  length: 4 | 6;
  value: string;
  onChange: (v: string) => void;
  status?: "default" | "error";
  errorText?: string;
  disabled?: boolean;
  autoFocus?: boolean;
};

export default function OtpInput({
  length,
  value,
  onChange,
  status = "default",
  errorText,
  disabled = false,
  autoFocus,
}: OtpInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocus || disabled) return;
    const id = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 320);
    return () => window.clearTimeout(id);
  }, [autoFocus, disabled]);

  const cellSize = length === 4 ? 52 : 40;
  const cellGap = length === 4 ? 16 : 8;
  const digitTypography = length === 4 ? typography.bodyLarge : typography.bodySmall;

  const isError = status === "error";
  const activeIndex = Math.min(value.length, length - 1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, length);
    onChange(cleaned);
  };

  return (
    <div style={{ position: "relative", width: "fit-content" }}>
      <div
        style={{
          display: "flex",
          gap: cellGap,
          cursor: disabled ? "not-allowed" : "text",
        }}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {Array.from({ length }).map((_, i) => {
          const digit = value[i] ?? "";
          const isCurrentFocus = focused && !isError && i === activeIndex && !disabled;

          const strokeColor = (() => {
            if (disabled) return "transparent";
            if (isError) return RED_500;
            if (isCurrentFocus) return VALENTINO_500;
            return ALPHA_BLACK_20;
          })();

          return (
            <div
              key={i}
              style={{
                width: cellSize,
                height: cellSize,
                borderRadius: RADIUS_CIRCLE,
                border: disabled ? "none" : `1px solid ${strokeColor}`,
                backgroundColor: disabled ? BG_DISABLED : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "border-color 150ms ease",
              }}
            >
              {!disabled && digit && (
                <span style={{ ...digitTypography, color: TEXT_PRIMARY }}>{digit}</span>
              )}
            </div>
          );
        })}
      </div>

      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        maxLength={length}
        aria-label="One-time passcode"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          border: "none",
          background: "transparent",
          padding: 0,
          margin: 0,
          cursor: disabled ? "not-allowed" : "text",
        }}
      />

      {isError && errorText && (
        <p
          style={{
            ...typography.caption,
            color: RED_500,
            margin: 0,
            marginTop: 12,
          }}
        >
          {errorText}
        </p>
      )}
    </div>
  );
}
