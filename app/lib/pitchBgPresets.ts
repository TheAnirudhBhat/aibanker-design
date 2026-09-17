import type { GrainientProps } from "../components/Grainient";

// ══════════════════════════════════════════════════════════════════
//  Pitch-questions ground: the variants to choose between (R21).
//  Each is a full Grainient config minus surgeKey (the flow passes the
//  question step). "Original" is the tuning signed off in R20/R21 and stays
//  the default — the others are alternatives, not replacements.
//  Switchable live from the debug panel ("Question background") and cycled on
//  /playground/grainient.
// ══════════════════════════════════════════════════════════════════

// Near-white leads, a little grey, a whisper of Valentino. Grainient blends
// three colours along one axis, so the near-white sits in the MIDDLE — with
// white at a pole, one end of every frame washed out and the tone piled up on
// the other (the R20 "right heavy" fix).
export const PITCH_BG_PALETTE = ["#FBFCFE", "#DDE6EE", "#F0C3F4"];
const [NEAR_WHITE, GREY, VALENTINO] = PITCH_BG_PALETTE;

/** The palette as Grainient's three blend poles: grey → near-white → brand. */
const POLES = { color1: GREY, color2: NEAR_WHITE, color3: VALENTINO } as const;

// After dark the same three poles in the slice night register (user report
// R39e: the flow stayed a white slab on the dark shell): the page black in the
// middle, charcoal (the dark bg-secondary) for grey, a deep plum whisper for
// the brand. Spread over any preset's props to flip it.
export const PITCH_BG_PALETTE_DARK = ["#090B0C", "#171A1F", "#2E1232"];
const [NIGHT, CHARCOAL, PLUM] = PITCH_BG_PALETTE_DARK;
export const PITCH_BG_POLES_DARK = { color1: CHARCOAL, color2: NIGHT, color3: PLUM } as const;

export type PitchBgPreset = {
  id: string;
  label: string;
  hint: string;
  props: Omit<GrainientProps, "surgeKey" | "style">;
};

export const PITCH_BG_PRESETS: PitchBgPreset[] = [
  {
    id: "original",
    label: "Original",
    hint: "Signed-off tuning: diagonal field, fast synced whoosh",
    props: {
      ...POLES,
      // quiet but alive between switches
      timeSpeed: 0.16,
      // peaks at ~56x ambient as the panel starts moving, spent by ~750ms
      surgeStrength: 55,
      surgeDecayMs: 330,
      contrast: 1.28,
      saturation: 1.15,
      blendAngle: 35,
      colorBalance: 0,
      zoom: 1.15,
      blendSoftness: 0.3,
      grainAmount: 0.06,
    },
  },
  {
    id: "calm",
    label: "Calm",
    hint: "Slower, softer, wider bands — the quietest of the four",
    props: {
      ...POLES,
      timeSpeed: 0.1,
      // a swell rather than a whoosh: gentler peak over a longer window
      surgeStrength: 24,
      surgeDecayMs: 560,
      contrast: 1.18,
      saturation: 1.1,
      blendAngle: 30,
      colorBalance: 0,
      zoom: 1.28,
      // feathered wide, so the tone shifts read as light rather than as bands
      blendSoftness: 0.44,
      grainAmount: 0.05,
    },
  },
  {
    id: "bloom",
    label: "Bloom",
    hint: "Fewer, larger masses with more colour — warps more visibly",
    props: {
      ...POLES,
      timeSpeed: 0.14,
      surgeStrength: 40,
      surgeDecayMs: 420,
      contrast: 1.34,
      saturation: 1.3,
      blendAngle: 42,
      colorBalance: 0,
      // zoomed in = fewer, bigger structures
      zoom: 1.5,
      blendSoftness: 0.45,
      // broader waves, pushed further (amplitude DIVIDES the displacement, so a
      // stronger warp means raising warpStrength / lowering warpAmplitude)
      warpFrequency: 3.4,
      warpStrength: 1.45,
      grainAmount: 0.06,
    },
  },
  {
    id: "snap",
    label: "Snap",
    hint: "Nearly still, then a sharp sweep on each switch",
    props: {
      ...POLES,
      // barely moving while a question is up
      timeSpeed: 0.07,
      // very high peak, very short window — the sweep is over almost at once
      surgeStrength: 95,
      surgeDecayMs: 210,
      contrast: 1.3,
      saturation: 1.15,
      blendAngle: 35,
      colorBalance: 0,
      zoom: 1.1,
      blendSoftness: 0.26,
      grainAmount: 0.06,
    },
  },
];

/** The chosen preset, falling back to Original for an unknown/stale id. */
export function pitchBgPreset(id: string | undefined): PitchBgPreset {
  return PITCH_BG_PRESETS.find((p) => p.id === id) ?? PITCH_BG_PRESETS[0];
}
