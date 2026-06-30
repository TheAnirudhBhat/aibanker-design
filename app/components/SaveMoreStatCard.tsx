"use client";

import { useTheme } from "../lib/theme";
import { typography } from "../lib/typography";
import { RADIUS_L } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";
import { CARD_PALETTES } from "../preview/fixtures/wrappedFixture";

// Bricolage hero, same as the wrapped value-stat cards (143 / Swiggy orders) — the proto's "big
// number = the message" idiom, reused so the AA benefit reads as a familiar stat.
const BRICOLAGE = "var(--font-bricolage), var(--font-rubik), system-ui, sans-serif";

// The "+10%" benefit, visualised. Green palette = save / positive (and tinted both modes, so it
// stays legible in dark where a plain white card goes near-invisible). One stat is the hero, the
// unit baseline-sits next to it, and a small ascending-bars motif on the right reads as "growing"
// without leaning on an icon asset. "Disconnect anytime" lives in Ryan's line above, not here.
export default function SaveMoreStatCard() {
  const { mode } = useTheme();
  const isDark = mode === "dark";
  const p = CARD_PALETTES[1]; // Green
  const textColor = isDark ? p.textDark : p.text;
  const labelOpacity = isDark ? 0.92 : 0.7;
  // Four ascending bars (short → full) — the last is the "with everything linked" peak.
  const bars = [13, 21, 30, 42];

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 16,
        borderRadius: RADIUS_L,
        background: isDark ? p.bgDark : p.bg,
        padding: "18px 20px",
        boxShadow: ELEVATION_CARD,
      }}
    >
      <div className="flex flex-col">
        <span style={{ ...typography.metadata, textTransform: "uppercase", color: textColor, opacity: labelOpacity }}>
          Link everything
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
          <span style={{ fontFamily: BRICOLAGE, fontSize: 40, fontWeight: 700, lineHeight: 1, color: textColor }}>
            +10%
          </span>
          <span style={{ ...typography.buttonSmall, color: textColor, opacity: labelOpacity }}>a month</span>
        </div>
        <span style={{ ...typography.bodySmall, color: textColor, opacity: labelOpacity, marginTop: 6 }}>
          more saved, on average
        </span>
      </div>
      <div aria-hidden="true" style={{ display: "flex", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              width: 7,
              height: h,
              borderRadius: 3,
              backgroundColor: textColor,
              opacity: 0.32 + i * 0.225, // last bar ~full — the "linked" peak
            }}
          />
        ))}
      </div>
    </div>
  );
}
