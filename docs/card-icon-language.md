# Card icon — the icon in a ring's hole

The Trip to Japan goal card and the Swiggy tracker each carry an icon inside a thin ring
gauge. Started 2026-09-23 (designer + Vishal) as a "holo glass" exploration; by the end of
the day the brief had moved, and this is where it stands. Generated files are listed in
`GENERATED_ASSETS.md`. Prototype only.

## What holds

- **One switch, both cards.** The debug panel's **Card icon** drives the goal card and the
  tracker together, so the two always read as one set. Each card only brings its tone
  (blue for the goal, the tracker's own colour), its slice glyph (flight, food) and, where
  one exists, its brand mark or generated render.
- **Avatars, not logos.** Every style is built on the DLS avatar — a 48 disc with the
  20 slice glyph inside. Brand marks stay out of the glass and the CSS styles (designer
  call: "only use avatars, don't use brand logos"). The one place a mark appears is
  Soft gradient · art, the render the designer kept.
- **Both modes, each tuned.** A style must hold on the white card by day and on #151718
  by night. The two may differ a little for legibility — a tone glyph lifts toward white
  by night, a surface lifts a step off the dark card — but it is the same style.
- **Drawn, not generated, where possible.** CSS styles work for any tone and any glyph,
  retune in a minute and never generate an icon (DLS: icons are never generated).

## The styles on the switch (pruned to three, designer call)

| Style | Day | Night |
|---|---|---|
| Coin · edge (default) | a smooth tone pebble at 44 in the canon's tilt, slightly turned: a top-lit face that rolls into its side, white glyph at 19 (or the brand mark at 36, its own disc feathered into the face) | same |
| Glass · lens | a generated disc of thick, colourless crystal — the white card bends darker at its edge band, one cool specular — with the slice glyph laid on its face | the same disc relit on black: dark glass, rim and specular in cool white; the glyph lifts toward white |
| Porcelain | the subject as a smooth matte white ceramic object, satin shading, no gloss | charcoal ceramic under a cool light |
| Avatar | the DLS bold avatar at 48 — a flat tone disc, white glyph at 18 (or the brand mark, full face) | same |

Glass · lens is the one generated style and the only glass that survived: colourless, no
iridescence, no tint, no glow — the glass is read by its edge band and one specular, in
both modes. It never carries a brand mark.

**Top background in the same material.** On the designer's call ("generate top backgrounds
in sync with the type of card icons, so the page stays coherent") the Top background
switch gained two colourless scenes briefed from the lens: **Glass · caustics** — the
barely-there bent-light ribbons clear glass throws, white by day and near-black by night —
and **Glass · lens edge** — one broad, soft arc across the upper middle, the edge band of
a huge lens out of focus. Same recipe as the 09-21 scenes (one tall 2:3 image per mode,
calm top quarter, the ground at the foot, WebP at 1024 wide, desktop position set from
the first lit row); no colour, no rainbow, so they sit with the glass rather than the aurora.

## Cut on 2026-09-23 (designer call)

- **Brand marks cast in see-through glass** (Swiggy, Zomato, HDFC, SBI, ICICI, Axis) —
  "trash", and logos are out of scope for the treatment. Files deleted.
- **Aurora fills** (plane and Swiggy) — "trash". Files deleted.
- **Soft gradient renders** (plane and Swiggy mark) — liked at first, cut in the final
  prune. Files deleted; the renders survive in the session scratchpad only.
- **The see-through holo plane** re-cut — unreachable once the goal card joined the
  shared switch; the original file is back.
- **CSS glass** (lens / clean / clear / heavy) — a lens on flat white has nothing to bend,
  and every light cue is white on white; the stacked-disc fix smeared through the blur.
  "Trash" — replaced by the generated lens.
- **Generated liquid / tinted / frosted glass discs** — rendered, judged by day, cut in the
  final prune with the CSS subtle / outline / soft / gel avatars, the Holo glass and
  Holo · lens panes, Avatar · small and Bare glyph.
- **Metal bezel and Crystal facet** — rendered as sibling materials to the lens, "trash",
  cut within the hour; files deleted.
- **Glass object, Glass emblem, Glass · dish, Wire, Sticker, Liquid chrome, Mesh gradient,
  Voxel** — the second prune of the afternoon ("they all look trash"); files deleted. What
  stays on the switch after the 2026-09-24 cuts (Inflated, Glass · thin / dome, Emboss):
  Coin · edge, Glass · lens, Porcelain, Avatar. A **Card icon size** switch (Inset / To the ring) was tried for the generated
  styles and settled on inset; the switch is gone (2026-09-24).

## Sibling work

The 2026-09-24 **morph** family — the flat DLS avatar taken to 2.5D by material and light
alone, keeping the glyph — lives in `docs/card-icon-morph.md` (another session's work, on the
same Card icon switch as `morph-*` options; its `render-*` options left unrendered).

## Plan

1. Designer picks between Coin · edge, Glass · lens and Avatar as the default, or asks
   for a turn on the lens (thickness, edge band, specular).
2. Production: Coin · edge and Avatar are shippable as-is (tokens + glyph); Glass · lens
   is a single 256² render per mode that the visual team redraws once, since it carries
   no brand or tone.
3. Parked: a real-time glass (three.js or SVG filter) that bends the ring or the wash —
   only worth a test if the lens direction wins and motion is wanted.
