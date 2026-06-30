"use client";

import { useTheme } from "../lib/theme";
import { typography } from "../lib/typography";
import { TEXT_TERTIARY } from "../lib/colors";
import { RADIUS_L } from "../lib/radii";
import { ELEVATION_CARD } from "../lib/elevation";
import { CARD_PALETTES } from "../preview/fixtures/wrappedFixture";

// Bricolage hero, same as the wrapped value-stat cards (143 / Swiggy orders) — this is the proto's
// established "big number = the message" idiom, reused so the AA benefit reads as a familiar stat.
const BRICOLAGE = "var(--font-bricolage), var(--font-rubik), system-ui, sans-serif";

// The "+10%" benefit, visualised instead of buried in the AA-intro sentence. Green palette = save /
// positive; one stat per card (no second claim), reassurance sits quietly below the tinted surface.
export default function SaveMoreStatCard() {
  const { mode } = useTheme();
  const isDark = mode === "dark";
  const p = CARD_PALETTES[1]; // Green
  const textColor = isDark ? p.textDark : p.text;

  return (
    <div style={{ width: "100%" }}>
      <div
        className="flex flex-col text-left"
        style={{
          borderRadius: RADIUS_L,
          background: isDark ? p.bgDark : p.bg,
          padding: "16px 20px 20px",
          boxShadow: ELEVATION_CARD,
        }}
      >
        <span style={{ ...typography.bodySmall, color: textColor, opacity: isDark ? 0.92 : 0.6 }}>
          People who link everything
        </span>
        <span style={{ fontFamily: BRICOLAGE, fontSize: 40, fontWeight: 700, lineHeight: 1, color: textColor, marginTop: 8 }}>
          +10%
        </span>
        <span style={{ ...typography.buttonSmall, color: textColor, opacity: isDark ? 0.92 : 0.7, marginTop: 8 }}>
          saved every month, on average
        </span>
      </div>
      <p style={{ ...typography.caption, color: TEXT_TERTIARY, marginTop: 8 }}>
        Disconnect anytime.
      </p>
    </div>
  );
}
