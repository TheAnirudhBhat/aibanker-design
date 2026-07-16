"use client";

// BigNumber — a typographic moment in the chat stream (beta pre-AA rework).
// The numbers worth remembering land as display-type events: they count up on
// entry (tabular numerals, no jitter) inside a standard chat card, then scroll
// away like any other line. Non-numeric values ("December") fade-rise in
// without a count. Rules: only numbers worth remembering, one per beat; static
// under prefers-reduced-motion. Spec: docs/beta-pre-aa-rework.md.

import { ReactNode, useEffect, useRef, useState } from "react";
import { typography } from "../lib/typography";
import { TEXT_PRIMARY, TEXT_SECONDARY, BG_PRIMARY } from "../lib/colors";
import { SPACE_M } from "../lib/spacing";
import { CARD_BORDER, CARD_RADIUS, CARD_SHADOW } from "./ChatCards";

type BigNumberProps = {
  /** Short lead-in ABOVE the number, inside the card ("Goa in October, love it. That's"). */
  lead?: string;
  /** Final display value: a rupee amount ("₹8,300") or a word ("December"). */
  value: string;
  /** Unit suffix rendered BESIDE the number ("/mo") — not a caption below it. */
  suffix?: string;
  /** Numeric target for the count-up; omit (or null) for word values. */
  countTo?: number | null;
  /** Fires once the count-up (or fade-in) settles. */
  onDone?: () => void;
  /** Extra content INSIDE the card, below the number (e.g. the named-plans 2x stat). */
  footer?: ReactNode;
};

const COUNT_MS = 700;

function formatINR(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export default function BigNumber({ lead, value, suffix, countTo, onDone, footer }: BigNumberProps) {
  const [display, setDisplay] = useState<string>(countTo != null ? formatINR(0) : value);
  const [entered, setEntered] = useState(false);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDoneRef.current?.();
    };
    // Enter on the next frame so the rise transition runs.
    const raf = requestAnimationFrame(() => setEntered(true));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (countTo == null || reduced) {
      setDisplay(value);
      const t = window.setTimeout(finish, reduced ? 0 : 380);
      return () => { cancelAnimationFrame(raf); window.clearTimeout(t); };
    }
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / COUNT_MS);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic — starts fast, settles gently
      setDisplay(formatINR(countTo * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
      else { setDisplay(value); finish(); }
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); cancelAnimationFrame(frame); };
  }, [value, countTo]);

  return (
    <div
      style={{
        marginTop: SPACE_M,
        backgroundColor: BG_PRIMARY,
        border: CARD_BORDER,
        borderRadius: CARD_RADIUS,
        boxShadow: CARD_SHADOW,
        padding: "20px 24px",
        opacity: entered ? 1 : 0,
        transform: entered ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 360ms ease-out, transform 360ms ease-out",
      }}
    >
      {lead && (
        <p style={{ ...typography.bodySmall, color: TEXT_SECONDARY, margin: "0 0 4px" }}>{lead}</p>
      )}
      <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, fontVariantNumeric: "tabular-nums" }}>
        {display}
        {suffix && (
          <span style={{ ...typography.headerH3, color: TEXT_SECONDARY, marginLeft: 2 }}>{suffix}</span>
        )}
      </p>
      {footer}
    </div>
  );
}
