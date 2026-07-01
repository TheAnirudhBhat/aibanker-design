"use client";

import { typography } from "../lib/typography";
import { TEXT_TERTIARY } from "../lib/colors";

// A small, consistent reassurance line — a lock glyph + one human sentence, muted. Placed co-located
// with the scary actions (link accounts / autopay / see my spending), because reassurance only works
// when it sits ON the moment of fear, not on a trust screen scrolled past three beats ago.
export default function TrustNote({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true">
        <rect x="3.5" y="7" width="9" height="6.5" rx="1.6" stroke={TEXT_TERTIARY} strokeWidth="1.3" />
        <path d="M5.3 7V5.5a2.7 2.7 0 0 1 5.4 0V7" stroke={TEXT_TERTIARY} strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      <span style={{ ...typography.caption, color: TEXT_TERTIARY }}>{text}</span>
    </div>
  );
}
