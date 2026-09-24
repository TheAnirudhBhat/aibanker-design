// Draw the flat DLS avatar for every glyph in public/return-exp1/icons — a disc in the
// card's tone with the white glyph at 42% (the canon's 20-in-48) — as the Image 1 reference
// every rendered morph starts from, and the one truth the drawn morphs are judged against.
// usage: node scripts/icon-morph/refs.cjs [outDir]   (default scripts/icon-morph/ref)
const fs = require("fs"), path = require("path");
const sharp = require(path.join(__dirname, "../../node_modules/sharp"));
const ROOT = path.join(__dirname, "../..");
const ICONS = path.join(ROOT, "public/return-exp1/icons");
// the tone each live card gives its hole icon (Dash2GoalRingCard → BLUE_500, the Swiggy tracker → its tint)
const TONES = { flight: "#2B6ACF", food: "#FC8019" };
const DEFAULT_TONE = "#2B6ACF";
const SIZE = 1024, DISC = 0.8, GLYPH = 0.42;

async function draw(glyph, tone, out) {
  const svg = fs.readFileSync(path.join(ICONS, `${glyph}.svg`), "utf8");
  const vb = /viewBox="([^"]+)"/.exec(svg)?.[1]; if (!vb) throw new Error(`${glyph}: no viewBox`);
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/currentColor/g, "#FFFFFF");
  const d = SIZE * DISC, g = d * GLYPH, o = (SIZE - g) / 2;
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${d / 2}" fill="${tone}"/>
  <svg x="${o}" y="${o}" width="${g}" height="${g}" viewBox="${vb}" preserveAspectRatio="xMidYMid meet">${inner}</svg>
</svg>`;
  await sharp(Buffer.from(doc)).flatten({ background: "#FFFFFF" }).png().toFile(out);
  return out;
}

module.exports = { draw, TONES, DEFAULT_TONE };
if (require.main === module) (async () => {
  const outDir = process.argv[2] || path.join(__dirname, "ref");
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of fs.readdirSync(ICONS).filter((f) => f.endsWith(".svg"))) {
    const glyph = f.slice(0, -4);
    console.log(await draw(glyph, TONES[glyph] ?? DEFAULT_TONE, path.join(outDir, `avatar-${glyph}.png`)));
  }
})();
