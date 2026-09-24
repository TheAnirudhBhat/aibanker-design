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

## The styles on the switch (2026-09-24, evening)

| Style | What it is |
|---|---|
| Pebble (default) | the shape by what the card is (user call): Coin · edge, a smooth tone pebble at 44 in the canon's tilt whose top-lit face rolls into its side, on goal cards; the same stone as a squircle at 42 on tracking cards. White glyph at 19, or the brand mark at 36 with its own disc feathered into the face (Domino's white disc gives a white pebble) |
| Pebble · soft | the same stone with its side and drop turned down to 45% (user pin: the pebbles took "way too much prominence") |
| Token · crisp | the pebble's shapes, turn and full colour, machined rather than weathered (user pin: the pebble is "a little too much" and not "the most modern thing"; keep the skew and the 3D): a near-flat face lit a touch from the top, a sharp cut edge in the deep tone, a tight contact shadow |
| Token · bevel | a flat face with a machined chamfer round it, light on the upper-left lip, dark on the lower-right, on a thin edge |
| Token · float | no edge: the flat face hovers a little above its own soft, tinted shadow |
| Token · layer | the crisp token with the glyph as its own raised layer, casting a sharp shadow onto the face |
| Avatar | the DLS bold avatar at 48 — a flat tone disc, white glyph at 18 (or the brand mark, full face) |
| Lift | the avatar drawn in 2.5D (`docs/card-icon-morph.md`) |

The colour stays full on every style: the saturated icon on the white card is what works
(user pin, 2026-09-24). A **Ring size** switch beside Card icon tries the home cards' ring at
93 (canon), 86 and 80, the stroke at 4px throughout and the icon at its own size.

Glass · lens and Porcelain left the switch that evening; what follows is how the lens was built.

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
- **Glass · lens, Porcelain, Puff, Deboss, and the river, polished and deep pebbles** — off
  the switch on user pins (2026-09-24, evening), once the Pebble became the norm. The lens
  and Puff/Deboss drawing code stays in the sim, unreachable from the switch.
- **Pebble · small, · tint and · pale, and Extrude** — off the switch on user pin the same
  evening ("not good"; "keep Pebble soft and Pebble … Avatar and Lift"); Extrude's drawing
  left with it.

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
