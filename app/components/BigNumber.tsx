"use client";

// BigNumber — a typographic moment in the chat stream (beta pre-AA rework).
// The numbers worth remembering land as display-type events: they count up on
// entry (tabular numerals, no jitter), then scroll away like any other line.
// Non-numeric values ("December") fade-rise in without a count.
// Rules: only numbers worth remembering, one per beat; static under
// prefers-reduced-motion. Spec: docs/beta-pre-aa-rework.md.

import { useEffect, useRef, useState } from "react";
import { typography } from "../lib/typography";
import { TEXT_PRIMARY, TEXT_SECONDARY } from "../lib/colors";
import { SPACE_XS, SPACE_M } from "../lib/spacing";

type BigNumberProps = {
  /** Final display value: a rupee amount ("₹8,300") or a word ("December"). */
  value: string;
  /** Small caption under the numeral ("a month" · "on paper"). */
  caption?: string;
  /** Numeric target for the count-up; omit (or null) for word values. */
  countTo?: number | null;
  /** Fires once the count-up (or fade-in) settles. */
  onDone?: () => void;
};

const COUNT_MS = 700;

function formatINR(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export default function BigNumber({ value, caption, countTo, onDone }: BigNumberProps) {
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
        opacity: entered ? 1 : 0,
        transform: entered ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 360ms ease-out, transform 360ms ease-out",
      }}
    >
      <p style={{ ...typography.headerH1, color: TEXT_PRIMARY, fontVariantNumeric: "tabular-nums" }}>
        {display}
      </p>
      {caption && (
        <p style={{ ...typography.caption, color: TEXT_SECONDARY, marginTop: SPACE_XS }}>
          {caption}
        </p>
      )}
    </div>
  );
}
