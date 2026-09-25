// Renders the slice grounds (debug panel → Ground), one lossless WebP per set and
// mode, the way a design tool's mesh gradient blends between colour points:
//
// - colours are OKLCH points on a coarse grid, blended in OKLab, so a tint melts
//   into white (or a shade into black) without passing through grey — the
//   2026-09-24 slice ground mixed three hues at low alpha in sRGB and read muddy;
// - the blend is a cubic B-spline (C2): no creases between grid cells, so no
//   Mach-band lines. The earlier Catmull-Rom mesh was C1, and radial gradients
//   stop dead at their radius — both show edges the eye reads as lines;
// - the sampling coordinates are gently warped, so the mesh flows instead of
//   following the grid;
// - the result is dithered before it is cut to 8 bits: random rounding, one
//   draw shared by the three channels — near black a smooth ramp is only ~20
//   levels tall, and every step showed as a contour line ("I can still see the
//   gradient lines", user pin 2026-09-24). Random rounding is unbiased and never
//   touches an exact 0 or 255, so the base stays pure white or pure black (a
//   ±1 TPDF dither clips there and lifted an eighth of the black to level 1).
//   Lossless keeps the dither.
//
//   node scripts/slice-mesh.cjs [set ...]   (duo, lilac, slate, aurora, nebula; default all)
//
// Prints, per file, the top-centre colour (the iOS status bar tint,
// --re1-amb-bar) and the bottom row's colour (--re1-skin-ground).
const path = require("node:path");
const sharp = require("sharp");

const W = 540, H = 1170; // the phone frame's aspect (360 × 780), at 1.5×
const OUT = path.join(__dirname, "../public/return-exp1/ambient/variants");

// Each mode: base (the page's own tone), span (the share of the page height the
// grid covers, top down; below it, the base), grid (rows top→bottom of nodes
// [OKLCH anchor [L, C, hue], strength 0–1]; 0 = the base) and warp ([amplitude,
// frequency, phase] for the horizontal shift, which varies down the page, then
// the vertical one).
const WHITE = [1, 0, 0], BLACK = [0, 0, 0];
const z = 0;
// a crown: one tone along the whole top edge (the iOS status bar is a flat strip
// of it, so the page meets the bar without a seam), blooming into the left and
// right anchors just below, behind the title, and fading to the base by the
// span. The left reaches a little lower than the right, so the lower edge is
// a slope, not a line.
const crown = (a, m, b, k = 1) => [
  [[m, k], [m, k], [m, k], [m, k], [m, k]],
  [[a, k], [a, 0.9 * k], [m, 0.8 * k], [b, 0.9 * k], [b, k]],
  [[a, 0.55 * k], [m, 0.45 * k], [m, 0.3 * k], [b, 0.4 * k], [b, 0.6 * k]],
  [[a, 0.18 * k], [m, 0.1 * k], z, z, [b, 0.15 * k]],
  [z, z, z, z, z],
];
// slate by night exactly as the user approved it (2026-09-24: "d3 dark slice
// cards bg looks good") — an earlier crown whose top edge still drifts a hair,
// kept as it is because these bytes are the approval
const S = [0.225, 0.012, 262], S2 = [0.215, 0.008, 245];
const SLATE_NIGHT = [
  [[S, 1], [S, 1], [S, 0.95], [S2, 1], [S2, 1]],
  [[S, 0.8], [S, 0.75], [S, 0.6], [S2, 0.75], [S2, 0.9]],
  [[S, 0.4], [S, 0.35], [S, 0.2], [S2, 0.3], [S2, 0.45]],
  [[S, 0.12], [S, 0.05], z, z, [S2, 0.1]],
  [z, z, z, z, z],
];
const W1 = [[0.05, 0.8, 0.1], [0.04, 0.9, 0.6]];
const day = (span, grid) => ({ base: WHITE, span, grid, warp: W1 });
const night = (span, grid) => ({ base: BLACK, span, grid, warp: W1 });
// A full-screen ground (2026-09-25): the grid covers the whole frame (span 1),
// nine rows. Under slice cards the ground shows only at the top, in the 24
// margins and 16 gaps, and at the foot, so the colour sits there — a crown, a
// pool down each edge, a bloom behind the message bar so its frost reads as
// glass — and the middle, which the cards cover, stays the base. Its three hues
// each keep their own region; they never mix at low alpha (the mud). A lone
// node peaks at under half its strength (B-spline weights 4/6 × 4/6), and a
// shade mixed into black keeps only that share of its L, so each pool is a
// pair of nodes at full strength. The palette names the crown's top edge (the
// status bar tone), c1–c3 the crown's left / middle / right just below it, p1
// the pool down the left, p2 the pool down the right, f the foot's bloom.
const FLOW = [[0.07, 1.1, 0.15], [0.045, 1.0, 0.6]];
// the Galaxy's own light ground, a lilac white
const DAY_LILAC = [0.968, 0.012, 300];
const full = (base, P) => {
  const grid = Array.from({ length: 9 }, () => [z, z, z, z, z]);
  grid[0] = grid[0].map(() => [P.crown, 1]);
  for (const [key, k, col, row] of [
    ["c1", 1, 0, 1], ["c1", 0.95, 1, 1], ["c2", 0.9, 2, 1], ["c3", 0.95, 3, 1], ["c3", 1, 4, 1],
    ["c1", 0.7, 0, 2], ["c2", 0.45, 1, 2], ["c2", 0.35, 2, 2], ["c3", 0.45, 3, 2], ["c3", 0.7, 4, 2],
    ["p1", 0.9, 0, 3], ["p1", 0.45, 1, 3],
    ["p1", 1, 0, 4], ["p1", 0.5, 1, 4], ["p2", 0.3, 4, 4],
    ["p2", 0.9, 4, 5], ["p2", 0.45, 3, 5], ["p1", 0.35, 0, 5],
    ["p2", 1, 4, 6], ["p2", 0.5, 3, 6],
    ["f", 0.5, 0, 7], ["f", 0.45, 1, 7], ["f", 0.45, 2, 7], ["f", 0.45, 3, 7], ["p2", 0.45, 4, 7],
    ["f", 0.95, 0, 8], ["f", 1, 1, 8], ["f", 1, 2, 8], ["f", 1, 3, 8], ["f", 0.95, 4, 8],
  ]) grid[row][col] = [P[key], k];
  return { base, span: 1, grid, warp: FLOW };
};
// Tints sit at L 0.92–0.935 by day (the ground they replace peaked at 0.89, the
// mud), shades at L 0.2 by night; one or two hues per set, never three (the
// full-screen sets carry three, each in its own region).
const SETS = {
  // the DLS brand pair, Valentino → blue: pink left and slice blue right out of a
  // lilac top by day; a plum edge on navy by night
  duo: {
    light: day(0.5, crown([0.925, 0.07, 330], [0.92, 0.06, 300], [0.925, 0.055, 258])),
    dark: night(0.5, crown([0.21, 0.07, 332], [0.2, 0.05, 268], [0.2, 0.055, 258])),
  },
  // one violet, warm at the left and cool at the right, reaching further and softer
  lilac: {
    light: day(0.6, crown([0.915, 0.065, 310], [0.92, 0.06, 300], [0.92, 0.06, 288], 0.9)),
    dark: night(0.6, crown([0.2, 0.05, 312], [0.2, 0.048, 298], [0.2, 0.045, 284], 0.95)),
  },
  // sky into periwinkle by day; slate on pure black by night
  slate: {
    // by day: Silver · soft, finalised on user pin 2026-09-24 ("finalise silver soft")
    // after two rounds of day sets around the approved night: round 1 (Mist, Paper,
    // Daylight, Pearl) came back "trash"; round 2 took Sky partway to grey (Steel,
    // Silver, Haze), then Silver soft / deep / long / lavender, and soft won. A cool
    // silver crown at L 0.955, barely there, into white. The night stays as approved.
    light: day(0.5, crown([0.955, 0.014, 250], [0.955, 0.014, 258], [0.955, 0.012, 266])),
    dark: night(0.5, SLATE_NIGHT),
  },
  // the full-screen grounds (user pins 2026-09-25: "a slice top BG, based on
  // transparent galaxy background", "full screen and fixed ... the subtle
  // version of aurora ... subtle colour changes to the BG black")
  // the Aurora's hues: a violet crown turning teal at the right, teal down the
  // left, violet down the right
  aurora: {
    light: full(DAY_LILAC, { crown: [0.915, 0.06, 300], c1: [0.925, 0.055, 338], c2: [0.925, 0.05, 300], c3: [0.935, 0.045, 215], p1: [0.935, 0.04, 210], p2: [0.93, 0.05, 330], f: [0.925, 0.05, 298] }),
    dark: full(BLACK, { crown: [0.23, 0.06, 280], c1: [0.28, 0.1, 305], c2: [0.25, 0.07, 270], c3: [0.28, 0.06, 195], p1: [0.25, 0.055, 195], p2: [0.25, 0.085, 300], f: [0.36, 0.13, 292] }),
  },
  // the Galaxy's hues: a violet crown, Valentino down the left, slice blue down
  // the right
  nebula: {
    light: full(DAY_LILAC, { crown: [0.91, 0.065, 303], c1: [0.915, 0.065, 312], c2: [0.915, 0.06, 302], c3: [0.92, 0.055, 285], p1: [0.93, 0.05, 340], p2: [0.93, 0.045, 245], f: [0.925, 0.05, 300] }),
    dark: full(BLACK, { crown: [0.25, 0.075, 292], c1: [0.28, 0.1, 305], c2: [0.26, 0.09, 295], c3: [0.27, 0.085, 280], p1: [0.24, 0.09, 330], p2: [0.25, 0.08, 262], f: [0.36, 0.14, 298] }),
  },
};

const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lab = ([L, C, h]) => [L, C * Math.cos((h * Math.PI) / 180), C * Math.sin((h * Math.PI) / 180)];
// OKLab → linear sRGB, unclamped, and back
function linRgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}
function fromLin([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
const srgb = (o) => linRgb(o).map((c) => gam(clamp(c, 0, 1)) * 255);
// The pastel anchors sit just outside sRGB (a channel at 258–268). Clipping each
// pixel instead would let a channel cross 255 mid-blend, a kink in the ramp the
// eye can read as a line; so an anchor is snapped to the colour it clips to, and
// the blends between in-gamut anchors never clip.
function fit(p) {
  const c = linRgb(lab(p));
  return c.every((v) => v >= 0 && v <= 1) ? lab(p) : fromLin(c.map((v) => clamp(v, 0, 1)));
}
// uniform cubic B-spline weights
const bs = (t) => [(1 - t) ** 3 / 6, (3 * t ** 3 - 6 * t * t + 4) / 6, (-3 * t ** 3 + 3 * t * t + 3 * t + 1) / 6, t ** 3 / 6];
// a seeded PRNG, so a re-run writes the same bytes
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function render(id, mode, spec) {
  const base = lab(spec.base);
  // a node is [OKLCH anchor, strength]: the anchor mixed into the base in OKLab.
  // One base row is padded on below: a clamped B-spline's last row still carries
  // a sixth of the row above it, a faint tint that ran to the foot of the page.
  const grid = [...spec.grid, spec.grid[0].map(() => 0)].map((row) => row.map((p) => (p ? fit(p[0]).map((a, i) => base[i] + (a - base[i]) * p[1]) : base)));
  const rows = grid.length, cols = grid[0].length;
  const node = (r, c) => grid[clamp(r, 0, rows - 1)][clamp(c, 0, cols - 1)];
  const [[au, fu, pu], [av, fv, pv]] = spec.warp;
  const rand = rng(0x51ce);
  const px = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x / (W - 1), v = y / (H - 1);
      const uw = u + au * Math.sin(2 * Math.PI * (fu * v + pu));
      const vw = v + av * Math.sin(2 * Math.PI * (fv * u + pv));
      const gx = clamp(uw, 0, 1) * (cols - 1);
      const gy = clamp((vw / spec.span) * (rows - 2), 0, rows - 1);
      const ix = Math.floor(gx), iy = Math.floor(gy);
      const wx = bs(gx - ix), wy = bs(gy - iy);
      const o = [0, 0, 0];
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
        const p = node(iy + j - 1, ix + i - 1), w = wx[i] * wy[j];
        o[0] += w * p[0]; o[1] += w * p[1]; o[2] += w * p[2];
      }
      const c = srgb(o);
      const n = rand(); // random rounding, shared by the three channels
      const k = (y * W + x) * 3;
      for (let ch = 0; ch < 3; ch++) px[k + ch] = Math.min(255, Math.floor(c[ch] + n));
    }
  }
  const file = path.join(OUT, `gen_slice-${id}-${mode}.webp`);
  await sharp(px, { raw: { width: W, height: H, channels: 3 } }).webp({ lossless: true, effort: 6 }).toFile(file);
  // the mean of a strip, as hex (the dither averages out)
  const hex = (top, h, left, w) => {
    const s = [0, 0, 0];
    for (let y = top; y < top + h; y++) for (let x = left; x < left + w; x++) for (let ch = 0; ch < 3; ch++) s[ch] += px[(y * W + x) * 3 + ch];
    return "#" + s.map((v) => Math.round(v / (h * w)).toString(16).padStart(2, "0")).join("");
  };
  console.log(path.basename(file), "bar", hex(0, Math.round(H * 0.015), 0, W), "ground", hex(H - 4, 4, 0, W));
}

(async () => {
  const ids = process.argv.slice(2);
  for (const [id, set] of Object.entries(SETS)) {
    if (ids.length && !ids.includes(id)) continue;
    for (const mode of ["light", "dark"]) if (set[mode]) await render(id, mode, set[mode]);
  }
})();
