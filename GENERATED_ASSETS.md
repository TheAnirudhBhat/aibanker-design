# Generated placeholder assets — REDRAW before ship (visual team worklist)

Proto-only illustrations, generated 2026-09-18 with the OpenAI Codex CLI (0.155, built-in
`image_gen`), using existing artwork as edit/style references where applicable. None of these is
DLS-final: the visual team redraws whatever the designer keeps, and the `gen_` prefix +
this table is the grep-able list of what to replace. Icons are never generated — these are
illustrations only (slice-design `reference_slice_asset_generation.md`).

Where they are used: the **Ambient** home of `/app/return-exp1-v2`, behind the debug-panel
flags — **Goal object** (the object in the Trip to Japan ring's hole, drawn at 54px) and
**Top background** (the atmosphere at the top of the page, 360px wide, light and dark each
their own file). The goal choices are now **Airplane** (default), **Holo glass**,
**Carry-on**, **Passport**, and **Globe**.

**Top background** is six on 2026-09-22 after four cuts (designer's call): **Off**,
**Aurora**, **Aurora 2**, and three variations — **· soft**, **· veil**, **· dusk**.

**Aurora 2** is the only entry supplied as artwork rather than drawn or generated, and as
of 2026-09-22 it is GREY in both modes (Figma 3195:96616). The designer put a luminosity
blend over the colour art so only its luminance survives — the hue never reaches the page —
and called that the better background. Neither file is `gen_` prefixed: that prefix means
generated, and these were handed over.

The blend is FLATTENED INTO THE EXPORT, not applied at runtime, which is what the canon
scene does too. A CSS `mix-blend-mode: luminosity` would depend on the art layer never
sitting in its own stacking context, and the wrapper's `opacity: 1 - f` gives it one the
moment a chat opens.

BOTH files are RELEVELLED: light to 212–255, dark to 0–52. Straight out of Figma light
ran 188–249 and dark 0–86.

They are matched in **CIE L\***, not in 8-bit levels, and that is the finding worth
keeping. An equal numeric spread does not read equal: the light wash sits beside white
cards, and the same luminance delta is far heavier against white than against black.
Matched at 95/95 the light side was immediately called too prominent while dark still read
as quiet. Matched, both sat at ΔL\* ≈ 15 from their own ground — 43 levels against white,
38 against black. Dark was then lifted to ΔL\* ≈ 22 (peak 52) deliberately: a match that
holds at full brightness does NOT hold as the screen dims, because the black end loses its
delta below the visible threshold long before the white end does, and the dark wash was
blending into the page at low brightness. The pair is matched on the white side and given
headroom on the black. To retune, pick the light floor, convert its ΔL\* from white, and solve
for the black-side value with the same ΔL\*; never move one mode alone.

Neither file is neutral grey — a flat grey beside pure white picks up a warm cast by
simultaneous contrast and was read as "feeling red". Light carries a subtle VALENTINO lean
(darkest tone 211,206,222 — R up against G, so the violet reads magenta-ward) and dark a
blue-violet one (brightest 42,47,65). A stronger 213,204,221 mix was tried and rejected: it
reads pink. The cast is per channel and anchored so the page colour is untouched, white
staying 255,255,255 and black 0,0,0, which keeps it in the ramp and out of the page. The
bar tint above follows it, so re-levelling or re-tinting means re-measuring `--re1-amb-bar`.

The files' TOP 7% is blended flat to a single tone — #e1dee8 light, #0e0f15 dark — and
`--re1-amb-bar` is that exact tone. This is the fix for "the top part is white and the
background doesn't start from the top" on an iOS home-screen web app. Two things were
wrong and both had to go: the bar tint was the mean of the top 3% of rows, but the art
lightens downward, so that mean ran 9 levels lighter than the row it actually abuts; and
row 0 varied 24 levels across the width, which no single flat bar colour can ever match.
The status bar is ONE colour and cannot carry a gradient, so the art has to arrive flat.
Measured after the change the join is within 1 level and uniform left to right.

Re-levelling or re-tinting the art invalidates both the flat tone and the bar var —
re-measure from ROW 0, never from an average of the top rows.

The art layer needs a bottom MASK, and it needs one on the phone specifically. Its own foot
lands around 249 while the page is 255, so ending flat drew a hard horizontal seam. The
phone had no mask at all — the layer hardcoded `none` for mobile — which is why this was
reported from a device while localhost looked clean; it now reads
`--re1-amb-scene-mask-mobile`, a separate var so the outpainted scenes that want no mask
keep none. Dissolving the last fifth beats chasing the file's bottom value, because
re-levelling moves it every time.

Getting there took three misses worth recording, because each was a different failure. At
228–255 the light file measured fine and loaded fine but was invisible — a remap that
lands too close to the page colour is indistinguishable from a broken asset, so measure
the PAINTED pixels (sample the rendered page, not the file) before concluding anything is
wrong. At 188–249, the Figma original, the field never resolved to white anywhere, which
is what made it read as dirty rather than dim; landing the top end on 255 matters more
than the floor does. And a gentle stretch of a source that only spans 61 levels leaves no
visible structure at all — "can't see the aurora waves" is a CONTRAST problem, not a
brightness one.

Being genuinely greyscale makes them tiny — 2.5 KB and 6.1 KB, against 88 KB and 42 KB for
the colour pair they replaced. Both modes STRETCH their file to the 4/5 field rather than
covering it, because each composition's own fade lives at its bottom edge and `cover` would
crop away exactly that. Neither carries a veil.

**Aurora** is the generated 2026-09-18 scene, unchanged. The three variations are drawn in
CSS, which is the point of having them: a PNG cannot be retuned, they can. Their bands are
flat WIDE or tall NARROW ellipses, never one many-stop linear sweep — stacked soft shapes
read as an aurora without becoming the multi-stop rainbow the DLS bans. **Veil** is the
tall-narrow (curtain) case, **soft** and **dusk** the flat-wide.

Cut across the four passes, and NOT returning without a fresh ask: Haze, Silk, Live grain,
Live opal, Dome, Drift, Sheen, Aurora · deep, Aurora · wide, Ridges, the generated
**Dawn**, **Halo**, **Bokeh**, **Mist** and **Beams**, and the whole grid/dots/pixels
family. The generated five keep their files and their `globals.css` rules, dormant, exactly
as they sat before R73; everything else was deleted outright, including the Grainient
wiring the two canvas scenes needed and the ridge SVGs. The `gen_scene-holo-*` pair stays
retired — a full spectrum.

Worth keeping from the deleted work, in case any of it returns. A liquefied pattern needs
`feTurbulence` + `feDisplacementMap` at a LOW baseFrequency and a HIGH displacement scale
(big smooth bulges, not noise), and its rect must OVERDRAW the viewport, because
displacement pulls the pattern inward and a rect drawn to the edges leaves a bare margin
that reads as a hard seam. A repeated cell must come from an inline SVG rather than a CSS
tile: `background-size` is ONE value shared by every layer, and the scene's two paints
disagree (`100% 100%` on the art layer, `100% auto` on the copy pinned behind the iOS safe
area), so a px-sized CSS tile is tiled by one and stretched by the other. Vary a field with
a MASK over one repeated cell, never hand-set cells. And watch the weight: one attempt
added 159 KB to a stylesheet every page loads, and the first Ridges cut 58 KB.

Light is NOT dark's alpha: the first pass drove both modes off one tone at one strength
and the light variants did not read, because a pale tint on white has far less to push
against than the same tint on black. Light carries deeper tones at higher alpha; the two
modes are tuned separately and neither is derived from the other. Generated scenes use a taller 4:5
display area; the canon curtain keeps its original geometry and still rides the
separate **Top gradient** switch. Light scenes reserve a pale
header for dark text; dark scenes reserve a quiet dark header for light text.
**Tracker icon holder** keeps Current and adds Holographic circle, with separate
icon/color preview controls. The rejected Pearl 2.5D option and project asset are removed.

## Atmosphere scenes (2026-09-21)

The designer kept Current and Aurora from the 2026-09-18 set and asked for newer scenes;
the four material treatments (Silk, Prism, Watercolour, Terraces) leave the selector and
stay on disk as archived explorations. This set is light and atmosphere only, in the
register of the two survivors. Each scene is ONE tall 2:3 image per mode (1024 × 1536,
top quarter calm for the status bar and app title, bottom quarter at the page ground),
served as WebP for desktop and phone alike — no separate phone outpaint. Prompts are in
[return-exp1-artwork-prompts.md](docs/return-exp1-artwork-prompts.md).

| Asset | Concept | Engine | Created | Status |
|---|---|---|---|---|
| public/return-exp1/ambient/variants/gen_scene-dawn-light.webp | First light: a peach and rose bloom lifting into lilac | built-in image_gen | 2026-09-21 | active prototype |
| public/return-exp1/ambient/variants/gen_scene-dawn-dark.webp | Dusk: an ember of rose and amber under deep violet | built-in image_gen | 2026-09-21 | active prototype |
| public/return-exp1/ambient/variants/gen_scene-halo-light.webp | One soft Valentino halo, pale and desaturated | built-in image_gen | 2026-09-21 | active prototype |
| public/return-exp1/ambient/variants/gen_scene-halo-dark.webp | One dim Valentino halo on near-black | built-in image_gen | 2026-09-21 | active prototype |
| public/return-exp1/ambient/variants/gen_scene-bokeh-light.webp | Lens bokeh: large soft discs of lilac, mint and aqua | built-in image_gen | 2026-09-21 | active prototype |
| public/return-exp1/ambient/variants/gen_scene-bokeh-dark.webp | Lens bokeh at night: dim violet, teal and magenta discs | built-in image_gen | 2026-09-21 | active prototype |
| public/return-exp1/ambient/variants/gen_scene-mist-light.webp | Mist lit from above: layered veils of lilac and mint | built-in image_gen | 2026-09-21 | active prototype |
| public/return-exp1/ambient/variants/gen_scene-mist-dark.webp | Moonlit mist: layered veils of slate blue and violet | built-in image_gen | 2026-09-21 | active prototype |
| public/return-exp1/ambient/variants/gen_scene-beams-light.webp | Soft diagonal beams of aqua and lilac from the upper left | built-in image_gen | 2026-09-21 | active prototype |
| public/return-exp1/ambient/variants/gen_scene-beams-dark.webp | Soft diagonal beams of dim teal and violet | built-in image_gen | 2026-09-21 | active prototype |

## Travel and tall-scene update

Created with the built-in `image_gen` tool. Full prompts are saved in
[return-exp1-artwork-prompts.md](docs/return-exp1-artwork-prompts.md).
The four new objects have true alpha, are served at 256 × 256, and render at 54px.
The eight new backgrounds are served at 1080 × 1350. Holo glass goal art and the
Current/Aurora scene assets are retained. Earlier alternatives remain on disk as
archived explorations, but are removed from the relevant selectors.

| Asset | Concept | Engine | Created | Status |
|---|---|---|---|---|
| public/return-exp1/ambient/variants/gen_ring-flight.png | Pearl and periwinkle airplane | built-in image_gen | 2026-09-18 | active prototype |
| public/return-exp1/ambient/variants/gen_ring-luggage.png | Lavender carry-on suitcase | built-in image_gen | 2026-09-18 | active prototype |
| public/return-exp1/ambient/variants/gen_ring-passport.png | Periwinkle passport with gold globe | built-in image_gen | 2026-09-18 | active prototype |
| public/return-exp1/ambient/variants/gen_ring-globe.png | Blue and mint travel globe | built-in image_gen | 2026-09-18 | active prototype |
| public/return-exp1/ambient/variants/gen_scene-silk-light.png | Pearlescent satin folds, light | built-in image_gen | 2026-09-18 | archived 2026-09-21 |
| public/return-exp1/ambient/variants/gen_scene-silk-dark.png | Smoky indigo satin folds, dark | built-in image_gen | 2026-09-18 | archived 2026-09-21 |
| public/return-exp1/ambient/variants/gen_scene-prism-light.png | Opal glass and refracted pastel light | built-in image_gen | 2026-09-18 | archived 2026-09-21 |
| public/return-exp1/ambient/variants/gen_scene-prism-dark.png | Obsidian glass and muted prismatic light | built-in image_gen | 2026-09-18 | archived 2026-09-21 |
| public/return-exp1/ambient/variants/gen_scene-watercolour-light.png | Soft pigment washes on warm paper | built-in image_gen | 2026-09-18 | archived 2026-09-21 |
| public/return-exp1/ambient/variants/gen_scene-watercolour-dark.png | Midnight ink washes on charcoal | built-in image_gen | 2026-09-18 | archived 2026-09-21 |
| public/return-exp1/ambient/variants/gen_scene-terraces-light.png | Sculptural pastel paper terraces | built-in image_gen | 2026-09-18 | archived 2026-09-21 |
| public/return-exp1/ambient/variants/gen_scene-terraces-dark.png | Layered slate and charcoal terraces | built-in image_gen | 2026-09-18 | archived 2026-09-21 |

## Phone safe areas and neutral icon holder

All six scenes have separate light/dark mobile outpaints. They extend upward,
reserve calm status-bar headroom, and are served as WebP without altering the
desktop originals. The phone scene also adds the measured safe-area height.
The holographic circle is a neutral illustration only: `NeutralIconHolder` overlays
existing SVG/React icons, accepting either a tint or the asset's own colors.
The rejected pearl-coin experiment is not part of the project.

| Asset | Use |
|---|---|
| public/return-exp1/ambient/variants/gen_scene-current-mobile-light.webp | current · light, phone safe-area outpaint |
| public/return-exp1/ambient/variants/gen_scene-current-mobile-dark.webp | current · dark, phone safe-area outpaint |
| public/return-exp1/ambient/variants/gen_scene-aurora-mobile-light.webp | aurora · light, phone safe-area outpaint |
| public/return-exp1/ambient/variants/gen_scene-aurora-mobile-dark.webp | aurora · dark, phone safe-area outpaint |
| public/return-exp1/ambient/variants/gen_scene-silk-mobile-light.webp | silk · light, phone safe-area outpaint (archived 2026-09-21) |
| public/return-exp1/ambient/variants/gen_scene-silk-mobile-dark.webp | silk · dark, phone safe-area outpaint (archived 2026-09-21) |
| public/return-exp1/ambient/variants/gen_scene-prism-mobile-light.webp | prism · light, phone safe-area outpaint (archived 2026-09-21) |
| public/return-exp1/ambient/variants/gen_scene-prism-mobile-dark.webp | prism · dark, phone safe-area outpaint (archived 2026-09-21) |
| public/return-exp1/ambient/variants/gen_scene-watercolour-mobile-light.webp | watercolour · light, phone safe-area outpaint (archived 2026-09-21) |
| public/return-exp1/ambient/variants/gen_scene-watercolour-mobile-dark.webp | watercolour · dark, phone safe-area outpaint (archived 2026-09-21) |
| public/return-exp1/ambient/variants/gen_scene-terraces-mobile-light.webp | terraces · light, phone safe-area outpaint (archived 2026-09-21) |
| public/return-exp1/ambient/variants/gen_scene-terraces-mobile-dark.webp | terraces · dark, phone safe-area outpaint (archived 2026-09-21) |
| public/return-exp1/ambient/variants/gen_icon-holder-tile.png | Circular holographic tile, 256 × 256 with alpha |
| public/return-exp1/ambient/variants/gen_holo-coin-lens.png | Tracker icon holder · holo glass domed cabochon coin, face-on, 256 × 256 with alpha — same refs and engine, 2026-09-21 — was the Holo · lens tracker holder; off the switch since 2026-09-23 (archived) |
| public/return-exp1/ambient/variants/gen_ring-flight-dark.png | Goal object · Airplane, relit for the #151718 card (cooler, mid-tone pearl, soft rim light), 256 × 256 with alpha — ref: gen_ring-flight.png (same object, angle, framing) + ambient/scene-dark.png (value); codex image_gen, 2026-09-21 |
| public/return-exp1/ambient/variants/gen_ring-luggage-dark.png | Goal object · Carry-on, dark relight — same recipe, 2026-09-21 |
| public/return-exp1/ambient/variants/gen_ring-passport-dark.png | Goal object · Passport, dark relight — same recipe, 2026-09-21 |
| public/return-exp1/ambient/variants/gen_ring-globe-dark.png | Goal object · Globe, dark relight — same recipe, 2026-09-21 |

## Earlier explorations

The Holo glass object and Aurora scenes below are still active. The other generated
alternatives in this table are archived; their prompts remain for reference.

| Asset | Concept | Style references given to the model | Engine | Created | Status |
|---|---|---|---|---|---|
| public/return-exp1/ambient/variants/gen_ring-holo.png | goal object · neutral holographic glass paper plane — compatible with Valentino, orange, red and green rings | prior holo plane (geometry/material reference) | built-in image_gen edit | 2026-09-18 | active prototype |
| public/return-exp1/ambient/variants/gen_ring-aurora.png | goal object · aurora — luminous AI orb with one thin orbit | return-exp1/orb.png (subject/palette); proto fy_3d_drop.png (glow); ambient/goal.png (composition) | codex image_gen | 2026-09-18 | placeholder |
| public/return-exp1/ambient/variants/gen_ring-grain.png | goal object · grain — three plain coins in the grainy brand gradient | proto fy_bg_violet.png, fy_bg_galaxy.png (texture); ambient/goal.png (composition) | codex image_gen | 2026-09-18 | placeholder |
| public/return-exp1/ambient/variants/gen_ring-clay.png | goal object · soft clay — matte clay Fuji with a cloud | ambient/goal.png, ambient/phone.png (the current soft isometric 3D) | codex image_gen | 2026-09-18 | placeholder |
| public/return-exp1/ambient/variants/gen_ring-paper.png | goal object · paper craft — origami crane, violet underside | ambient/goal.png (composition); proto fy_3d_spends.png (render finish) | codex image_gen | 2026-09-18 | placeholder |
| public/return-exp1/ambient/variants/gen_scene-holo-light.png | scene · holo glass, light — caustics through the crystal on white | theme54/orb.png, crystal.png (colour); ambient/scene-light.png (composition, fade) | codex image_gen | 2026-09-18 | placeholder |
| public/return-exp1/ambient/variants/gen_scene-holo-dark.png | scene · holo glass, dark — the same caustics, dim, on black | theme54/orb.png, crystal.png; ambient/scene-dark.png (value) | codex image_gen | 2026-09-18 | placeholder |
| public/return-exp1/ambient/variants/gen_scene-aurora-light.png | scene · aurora, light — blurred ribbons of lilac, mint, aqua on white | return-exp1/orb.png (palette); ambient/scene-light.png | codex image_gen | 2026-09-18 | placeholder |
| public/return-exp1/ambient/variants/gen_scene-aurora-dark.png | scene · aurora, dark — deep violet and teal ribbons on black | return-exp1/orb.png; ambient/scene-dark.png | codex image_gen | 2026-09-18 | placeholder |
| public/return-exp1/ambient/variants/gen_scene-grain-light.png | scene · grain, light — grainy blush-violet bloom, top centre, on white | proto fy_bg_violet.png (texture); pitch/intro-glow.png (value); ambient/scene-light.png | codex image_gen | 2026-09-18 | placeholder |
| public/return-exp1/ambient/variants/gen_scene-grain-dark.png | scene · grain, dark — faint grainy violet glow on black | proto fy_bg_galaxy.png (sky texture only); ambient/scene-dark.png | codex image_gen | 2026-09-18 | placeholder |
| public/return-exp1/ambient/variants/gen_scene-clay-light.png | scene · soft clay, light — big matte pastel clouds on white | ambient/scene-light.png (composition); ambient/goal.png (finish) | codex image_gen | 2026-09-18 | placeholder |
| public/return-exp1/ambient/variants/gen_scene-clay-dark.png | scene · soft clay, dark — indigo dusk clouds on black | ambient/scene-dark.png; ambient/goal.png | codex image_gen | 2026-09-18 | placeholder |
| public/return-exp1/ambient/variants/gen_scene-paper-light.png | scene · paper craft, light — layered paper-cut waves, lilac/blush/mint | ambient/scene-light.png | codex image_gen | 2026-09-18 | placeholder |
| public/return-exp1/ambient/variants/gen_scene-paper-dark.png | scene · paper craft, dark — charcoal paper waves, violet edge light | ambient/scene-dark.png | codex image_gen | 2026-09-18 | placeholder |

## Card icon (2026-09-23)

The icon in a ring's hole — the Trip to Japan goal card and the Swiggy tracker — follows
ONE debug switch, **Card icon**, so the two always read as one set (designer call). It
was pruned to three the same day — **Coin · edge** and **Avatar** (both drawn in CSS from
the real slice glyph) and **Glass · lens**, a generated disc of thick, colourless crystal
with the glyph laid on its face in code, so no icon is generated — and the lens, which the
designer kept ("glass clear is good"), then grew three iterations (thin, dome, dish) — all
three cut again by 2026-09-24, so the lens stands alone. A steel bezel and a faceted
crystal were rendered and cut the same hour ("trash"; files deleted). Then, on the designer's call
that the icon itself may be generated ("you don't need to have the DLS icons kept in the
centre always"), directions per card subject (flight, food) — any other tracker glyph keeps
the lens. And, on the designer's "anything apart from glass",
four non-glass materials for the same two subjects — **Porcelain** survives; Wire, Inflated
and Emboss were cut — opaque, so generated with real alpha and not keyed. Then, on "more modern, more AI era, more Gen Z", four
more for the same subjects — Sticker, Liquid chrome, Mesh gradient and Voxel — all four cut
within the hour ("they all look trash"), with the glass object, glass emblem, Glass · dish and
Wire in the same prune; files deleted, git history keeps the briefs' record here.
Rules and the plan: `docs/card-icon-language.md`.

How the lens was made: rendered on pure white, relit on pure black with the day render
as its reference, each ground removed by colour-to-alpha (a 4-level noise floor, else a
ghost square survives), both cropped to one shared box so the theme toggle does not
move the disc. The card therefore shows THROUGH the glass and bends darker at its rim.
No holographic / iridescent colour — that read as cheap in the earlier rounds.

Tried and cut the same day (designer call, files deleted): the brand marks cast in
see-through holo glass (Swiggy, Zomato, HDFC, SBI, ICICI, Axis — and brand logos are out
of scope for this treatment), the Aurora fills, the Soft gradient renders (plane and
Swiggy mark), a see-through re-cut of the holo plane, the liquid / tinted / frosted glass
discs, and the CSS glass, subtle, outline, soft and gel avatars. The Holo glass and
Holo · lens panes below (2026-09-21) left the switch too; their files stay, archived.

| Asset | Concept | Style references given to the model | Engine | Created | Status |
|---|---|---|---|---|---|
| public/return-exp1/ambient/variants/gen_gdisc-lens.png | Card icon · Glass · lens, day — a thick, gently domed disc of clear colourless crystal, the white bending darker at its edge band, one cool specular; face plain for the glyph; white keyed out, 256 × 256 | the see-through plane render (transparency only, no iridescence) | codex image_gen | 2026-09-23 | active prototype |
| public/return-exp1/ambient/variants/gen_gdisc-lens-dark.png | the same disc relit on black for the #151718 card — dark glass, rim and specular in cool white; black keyed out; shares the day file's crop | gen_gdisc-lens.png (object) | codex image_gen | 2026-09-23 | active prototype |
| public/return-exp1/ambient/variants/gen_ng-ceramic-flight.png | Card icon · Porcelain — smooth matte white ceramic by day, charcoal by night, satin shading, no gloss; subject the paper plane; generated with real alpha (opaque material, not keyed), 256 × 256 | the holo plane render (shape only) | codex image_gen | 2026-09-23 | active prototype |
| public/return-exp1/ambient/variants/gen_ng-ceramic-flight-dark.png | the same object recoloured and relit for the #151718 card; shares the day file's crop | gen_ng-ceramic-flight.png (object) | codex image_gen | 2026-09-23 | active prototype |
| public/return-exp1/ambient/variants/gen_ng-ceramic-food.png | Card icon · Porcelain — smooth matte white ceramic by day, charcoal by night, satin shading, no gloss; subject the pizza slice; generated with real alpha (opaque material, not keyed), 256 × 256 | the DLS food glyph (shape only) | codex image_gen | 2026-09-23 | active prototype |
| public/return-exp1/ambient/variants/gen_ng-ceramic-food-dark.png | the same object recoloured and relit for the #151718 card; shares the day file's crop | gen_ng-ceramic-food.png (object) | codex image_gen | 2026-09-23 | active prototype |

## Glass-light scenes (2026-09-23)

Two Top background options briefed to sit with the glass card icons (designer call: "generate
top backgrounds in sync with the type of card icons, so the page stays coherent"). Same recipe
as the 09-21 scenes — one tall 2:3 image per mode, Aurora of that mode as the softness
reference, the Current phone outpaint as the composition reference, the lens disc as the
material to echo — but COLOURLESS: no tint, no rainbow, only whites and cool greys. Straight
out of the model both sat within ~25 levels of the page colour (light floors 228–232, dark peaks
37–48) and vanished on the page, so each file is re-levelled to the range accepted for Aurora 2
(light 212–255, dark 0–52) before the WebP export. The files are CROPPED so the art starts about 2% below the top edge
(user call 2026-09-24: "the background doesn't start from the top edge" — the briefs' calm top
quarter left the phone, which shows the file whole, with a plain white or black top), then the
top 1.5% is blended to one tone with a 3% fade so the one-colour status bar can meet it. Desktop
position follows from the crop: (2 + 4) × 2 = 12%.

| Asset | Concept | Style references given to the model | Engine | Created | Status |
|---|---|---|---|---|---|
| public/return-exp1/ambient/variants/gen_scene-caustic-light.webp | Glass · caustics, light — the bent-light ribbons clear glass throws on a white wall, heavily defocused; lit rows 20–72%, pos 48% | gen_scene-aurora-light (softness); current phone outpaint (composition); gen_gdisc-lens (material) | codex image_gen | 2026-09-23 | active prototype |
| public/return-exp1/ambient/variants/gen_scene-caustic-dark.webp | the same at night — faint cool-grey ribbons on near-black; lit rows 20–75%, pos 48% | the dark counterparts | codex image_gen | 2026-09-23 | active prototype |
| public/return-exp1/ambient/variants/gen_scene-lens-light.webp | Glass · lens edge, light — one broad soft arc across the upper middle, the edge band of a huge lens out of focus; lit rows 27–60%, pos 62% | as above | codex image_gen | 2026-09-23 | active prototype |
| public/return-exp1/ambient/variants/gen_scene-lens-dark.webp | the same at night; lit rows 28–56%, pos 64% | the dark counterparts | codex image_gen | 2026-09-23 | active prototype |

## Aurora 2 variations (2026-09-23)

Four variations of the designer's Aurora 2 (user ask), generated with Aurora 2 of the same
mode as the one reference — "keep everything about its look, change only the wave
composition" — then run through Aurora 2's OWN finish so they share its whole treatment:
greyscale, re-levelled to 212–255 (light) / 0–52 (dark), the same per-channel lean (light
darkest 211,206,222; dark brightest 42,47,65, white and black untouched), the top blended
flat to the bar tone (#e1dee8 / #0e0f15) — a 1.5% HAIRLINE with a 3% fade, not Aurora 2's
original 7%: on the phone the page starts below the status bar, so 7% showed as ~40px of plain
tone before the waves began (user call 2026-09-24) — WebP at 1024 wide, stretched to the field
with the bottom dissolve. `finish_a2.cjs` in the session scratchpad does all of it. The
original `scene-aurora2-{light,dark}.webp` were rebuilt the same way from their pre-band
version (f3ce9fd^; pre-band row 0 averaged 225,222,232 / 13,15,21 against the bar tones), so
the whole Aurora 2 family now starts at the top edge.

| Asset | Concept | Style references given to the model | Engine | Created | Status |
|---|---|---|---|---|---|
| public/return-exp1/ambient/variants/gen_scene-a2-fine-light.webp | Aurora 2 · fine, light — five or six slim ribbons instead of two broad waves; Aurora 2's finish (greyscale, 212–255, the per-channel lean, top 7% flat to #e1dee8) | scene-aurora2-light.webp (the original, as the thing to vary) | codex image_gen | 2026-09-23 | active prototype |
| public/return-exp1/ambient/variants/gen_scene-a2-fine-dark.webp | Aurora 2 · fine, dark — five or six slim ribbons instead of two broad waves; Aurora 2's finish (greyscale, 0–52, the per-channel lean, top 7% flat to #0e0f15) | scene-aurora2-dark.webp (the original, as the thing to vary) | codex image_gen | 2026-09-23 | active prototype |
| public/return-exp1/ambient/variants/gen_scene-a2-broad-light.webp | Aurora 2 · broad, light — one very wide, slow sweep across the middle — calmer and emptier; Aurora 2's finish (greyscale, 212–255, the per-channel lean, top 7% flat to #e1dee8) | scene-aurora2-light.webp (the original, as the thing to vary) | codex image_gen | 2026-09-23 | active prototype |
| public/return-exp1/ambient/variants/gen_scene-a2-broad-dark.webp | Aurora 2 · broad, dark — one very wide, slow sweep across the middle — calmer and emptier; Aurora 2's finish (greyscale, 0–52, the per-channel lean, top 7% flat to #0e0f15) | scene-aurora2-dark.webp (the original, as the thing to vary) | codex image_gen | 2026-09-23 | active prototype |
| public/return-exp1/ambient/variants/gen_scene-a2-falls-light.webp | Aurora 2 · falls, light — the aurora as a curtain: tall narrow vertical falls of soft light from the upper middle; Aurora 2's finish (greyscale, 212–255, the per-channel lean, top 7% flat to #e1dee8) | scene-aurora2-light.webp (the original, as the thing to vary) | codex image_gen | 2026-09-23 | active prototype |
| public/return-exp1/ambient/variants/gen_scene-a2-falls-dark.webp | Aurora 2 · falls, dark — the aurora as a curtain: tall narrow vertical falls of soft light from the upper middle; Aurora 2's finish (greyscale, 0–52, the per-channel lean, top 7% flat to #0e0f15) | scene-aurora2-dark.webp (the original, as the thing to vary) | codex image_gen | 2026-09-23 | active prototype |
| public/return-exp1/ambient/variants/gen_scene-a2-drift-light.webp | Aurora 2 · drift, light — the broad waves tilted to drift from the upper left down to the lower right; Aurora 2's finish (greyscale, 212–255, the per-channel lean, top 7% flat to #e1dee8) | scene-aurora2-light.webp (the original, as the thing to vary) | codex image_gen | 2026-09-23 | active prototype |
| public/return-exp1/ambient/variants/gen_scene-a2-drift-dark.webp | Aurora 2 · drift, dark — the broad waves tilted to drift from the upper left down to the lower right; Aurora 2's finish (greyscale, 0–52, the per-channel lean, top 7% flat to #0e0f15) | scene-aurora2-dark.webp (the original, as the thing to vary) | codex image_gen | 2026-09-23 | active prototype |
| public/return-exp1/ambient/variants/gen_revbg-cobalt-light.webp | Ground & cards · Cobalt, light — Revolut's blue home — an electric cobalt bloom at the top sinking to midnight by night; sky blue into pale lavender by day; full-screen 2:3, pinned, never scrolls | Revolut home/analytics screens (palette, mood); gen_scene-aurora-mobile-light (restraint) | codex image_gen | 2026-09-24 | archived — cut on user call 2026-09-24 |
| public/return-exp1/ambient/variants/gen_revbg-cobalt-dark.webp | Ground & cards · Cobalt, dark — Revolut's blue home — an electric cobalt bloom at the top sinking to midnight by night; sky blue into pale lavender by day; full-screen 2:3, pinned, never scrolls | Revolut home/analytics screens (palette, mood); gen_scene-aurora-mobile-dark (restraint) | codex image_gen | 2026-09-24 | archived — cut on user call 2026-09-24 |
| public/return-exp1/ambient/variants/gen_revbg-violet-light.webp | Ground & cards · Violet, light — Revolut's purple home — a violet-magenta bloom sinking to warm charcoal by night; lilac and orchid by day; full-screen 2:3, pinned, never scrolls | Revolut home/analytics screens (palette, mood); gen_scene-aurora-mobile-light (restraint) | codex image_gen | 2026-09-24 | archived — cut on user call 2026-09-24 ("trash") |
| public/return-exp1/ambient/variants/gen_revbg-violet-dark.webp | Ground & cards · Violet, dark — Revolut's purple home — a violet-magenta bloom sinking to warm charcoal by night; lilac and orchid by day; full-screen 2:3, pinned, never scrolls | Revolut home/analytics screens (palette, mood); gen_scene-aurora-mobile-dark (restraint) | codex image_gen | 2026-09-24 | archived — cut on user call 2026-09-24 ("trash") |
| public/return-exp1/ambient/variants/gen_revbg-haze-light.webp | Ground & cards · Indigo haze, light — Revolut's analytics page — charcoal with an indigo haze across the top and faint blue-grey drift below by night; periwinkle over cool off-white by day; full-screen 2:3, pinned, never scrolls | Revolut home/analytics screens (palette, mood); gen_scene-aurora-mobile-light (restraint) | codex image_gen | 2026-09-24 | active prototype |
| public/return-exp1/ambient/variants/gen_revbg-haze-dark.webp | Ground & cards · Indigo haze, dark — Revolut's analytics page — charcoal with an indigo haze across the top and faint blue-grey drift below by night; periwinkle over cool off-white by day; full-screen 2:3, pinned, never scrolls | Revolut home/analytics screens (palette, mood); gen_scene-aurora-mobile-dark (restraint) | codex image_gen | 2026-09-24 | active prototype |
| public/return-exp1/ambient/variants/gen_revbg-field-light.webp | Ground & cards · Colour field, light — Revolut's theme picker — large defocused pools of blue, magenta and amber on navy by night; pastel sky, lilac and peach by day; full-screen 2:3, pinned, never scrolls | Revolut home/analytics screens (palette, mood); gen_scene-aurora-mobile-light (restraint) | codex image_gen | 2026-09-24 | archived — cut on user call 2026-09-24 ("trash") |
| public/return-exp1/ambient/variants/gen_revbg-field-dark.webp | Ground & cards · Colour field, dark — Revolut's theme picker — large defocused pools of blue, magenta and amber on navy by night; pastel sky, lilac and peach by day; full-screen 2:3, pinned, never scrolls | Revolut home/analytics screens (palette, mood); gen_scene-aurora-mobile-dark (restraint) | codex image_gen | 2026-09-24 | archived — cut on user call 2026-09-24 ("trash") |

## How they were briefed (so a redraw starts from the same intent)

Every prompt carried the same usage brief, then one treatment line.

- **Goal object** — "a 54px object inside a thin ring gauge on a savings-goal card; the
  light card is white, the dark card is #151718 — it must read on both. One object,
  centred, ~70% of a square canvas, soft top-left studio light. Real alpha; no backdrop,
  floor, sparkles, text, letters or currency symbols. Simple chunky silhouette."
  Objects were chosen for *Trip to Japan*: paper plane, orb-planet, coins, Fuji, crane.
- **Ambient scene** — "atmosphere only, behind white cards and a status bar, never a focal
  image. 3:2, light and interest in the upper two-thirds, brightest top-centre like stage
  light from above. No objects, characters, text, hard edges or horizon. Light: mostly
  white and low-saturation so black status text stays legible. Dark: near-black so white
  status text stays legible. Bottom third dissolves to the page ground." The page then
  masks the lower 45% to the wash itself, so the ground is never baked in.
- Sizes: objects delivered at 1024² and served at 256² (54px display); scenes delivered at
  1536×1024 and served at 1080 wide (360px display at 3×).
