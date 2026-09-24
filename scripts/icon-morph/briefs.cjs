// The briefs live in docs/card-icon-morph.md (the designer's file): every `### id — Label`
// heading followed by a fenced block is a style; the three bold-titled fences before them are
// the common head, the common tail and the night relight. This reads them — nothing is
// duplicated here. usage: node briefs.cjs <style> <TONE> <GROUND> <NAME> | night <NAME>
const fs = require("fs"), path = require("path");
const md = fs.readFileSync(path.join(__dirname, "../../docs/card-icon-morph.md"), "utf8");
const fences = [...md.matchAll(/\*\*([^*\n]+)\*\*[^\n]*\n\n```\n([\s\S]*?)```/g)].reduce((m, x) => (m[/tail/i.test(x[1]) ? "tail" : /night/i.test(x[1]) ? "night" : "common"] = x[2].trim(), m), {});
const styles = [...md.matchAll(/^### ([a-z-]+) — ([^\n]+)\n\n```\n([\s\S]*?)```/gm)].reduce((m, x) => (m[x[1]] = { label: x[2].trim(), brief: x[3].trim() }, m), {});
const fill = (s, v) => s.replace(/\b(TONE|GROUND|NAME)\b/g, (k) => v[k]);
function day(style, TONE, GROUND, NAME) {
  if (!styles[style]) throw new Error(`no brief for ${style}; have ${Object.keys(styles).join(", ")}`);
  return fill(`${fences.common}\n\n${styles[style].brief}\n\n${fences.tail}`, { TONE, GROUND, NAME });
}
module.exports = { styles, fences, day, night: (NAME) => fill(fences.night, { NAME }) };
if (require.main === module) {
  const [a, ...r] = process.argv.slice(2);
  process.stdout.write(a === "night" ? module.exports.night(r[0]) : a === "list" ? Object.keys(styles).join("\n") : day(a, ...r));
}
