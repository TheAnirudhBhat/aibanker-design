// colour-to-alpha: key a render's own flat ground (255 = white, 0 = black) out, keeping any shadow it cast as alpha
// usage: node key.cjs <in.png> <out.png> <ground> [size]  — size resizes the keyed square (256 for the card icons)
const sharp = require(require("path").join(__dirname, "../../node_modules/sharp"));
const FLOOR = 4;
async function key(src, out, ground /* 255 | 0 */, size) {
  const flat = await sharp(src).flatten({ background: { r: ground, g: ground, b: ground } }).raw().toBuffer({ resolveWithObject: true });
  const { data, info } = flat, px = info.width * info.height, o = Buffer.alloc(px * 4);
  for (let p = 0; p < px; p++) {
    const c = [data[p * 3], data[p * 3 + 1], data[p * 3 + 2]];
    // generators leave <=2 levels of noise in a "flat" ground; floor it so no ghost square survives
    const a = Math.max(0, Math.max(...c.map(v => Math.abs(v - ground))) - FLOOR) / (255 - FLOOR);
    for (let i = 0; i < 3; i++) o[p * 4 + i] = a ? Math.min(255, Math.max(0, Math.round(ground + (c[i] - ground) / a))) : 0;
    o[p * 4 + 3] = Math.round(a * 255);
  }
  let img = sharp(o, { raw: { width: info.width, height: info.height, channels: 4 } });
  if (size) img = img.resize(size, size, { fit: "cover" });
  await img.png().toFile(out);
}
module.exports = key;
if (require.main === module) key(process.argv[2], process.argv[3], +process.argv[4], +process.argv[5] || undefined).then(() => console.log("keyed", process.argv[3]));
