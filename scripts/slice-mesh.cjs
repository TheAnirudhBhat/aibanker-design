// Generates the slice ground's night mesh: a smooth grey field on pure black,
// the way a design tool's mesh gradient blends between colour points — bicubic
// (Catmull-Rom) interpolation over a coarse grid of grey levels, the sampling
// coordinates gently warped so the bands flow instead of following the grid.
// Radial gradients in CSS always read as round blobs or edge lights (user pins
// 2026-09-24), which is why this is an image.
//
//   node scripts/slice-mesh.cjs [outFile]
//
// Writes a 2:3 lossless WebP, cover-fit on the pinned wash by globals.css.
const path = require("node:path");
const sharp = require("sharp");

// rows top→bottom, columns left→right; 1 = the peak grey (PEAK), 0 = black.
// Grey ribbons sweep down-right with black pockets between them.
const GRID = [
  [0.9, 0.6, 0.2, 0.0],
  [0.5, 0.9, 0.5, 0.1],
  [0.0, 0.3, 0.8, 0.6],
  [0.1, 0.0, 0.3, 0.9],
  [0.6, 0.4, 0.0, 0.2],
  [0.9, 0.7, 0.3, 0.0],
];
const PEAK = 0.14; // the brightest grey, as a share of white
const W = 600, H = 900;

const cr = (p0, p1, p2, p3, t) =>
  0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

(async () => {
  const out = process.argv[2] || path.join(__dirname, "../public/return-exp1/ambient/variants/gen_slice-mesh-dark.webp");
  const rows = GRID.length, cols = GRID[0].length;
  const g = (r, c) => GRID[clamp(r, 0, rows - 1)][clamp(c, 0, cols - 1)];
  const at = (gx, gy) => {
    const ix = Math.floor(gx), iy = Math.floor(gy), tx = gx - ix, ty = gy - iy;
    const col = [-1, 0, 1, 2].map((m) => cr(g(iy + m, ix - 1), g(iy + m, ix), g(iy + m, ix + 1), g(iy + m, ix + 2), tx));
    return cr(col[0], col[1], col[2], col[3], ty);
  };
  const px = Buffer.alloc(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = x / (W - 1), v = y / (H - 1);
    const uw = clamp(u + 0.06 * Math.sin(2 * Math.PI * (v * 1.3 + 0.2)), 0, 1);
    const vw = clamp(v + 0.04 * Math.sin(2 * Math.PI * (u * 1.1 + 0.7)), 0, 1);
    let s = clamp(at(uw * (cols - 1), vw * (rows - 1)), 0, 1);
    s = s * s * (3 - 2 * s); // smoothstep: the blacks deepen, the greys stay soft
    px[y * W + x] = Math.round(s * PEAK * 255);
  }
  await sharp(px, { raw: { width: W, height: H, channels: 1 } }).blur(10).webp({ lossless: true }).toFile(out);
  // the iOS status bar tint (--re1-amb-bar) is the image's top-centre value
  const { data } = await sharp(out).extract({ left: W / 2 - 10, top: 0, width: 20, height: 4 }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const top = Math.round(data.reduce((s, v) => s + v, 0) / data.length);
  console.log(out, "top-centre", "#" + top.toString(16).padStart(2, "0").repeat(3));
})();
