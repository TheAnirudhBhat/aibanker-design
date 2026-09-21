# Generated placeholder assets — REDRAW before ship (visual team worklist)

Proto-only illustrations, generated 2026-09-18 with the OpenAI Codex CLI (0.155, built-in
`image_gen`), using existing artwork as edit/style references where applicable. None of these is
DLS-final: the visual team redraws whatever the designer keeps, and the `gen_` prefix +
this table is the grep-able list of what to replace. Icons are never generated — these are
illustrations only (slice-design `reference_slice_asset_generation.md`).

Where they are used: the **Ambient** home of `/app/return-exp1-v2`, behind the debug-panel
flags — **Goal object** (the object in the Trip to Japan ring's hole, drawn at 54px) and
**Ambient scene** (the atmosphere at the top of the page, 360px wide, light and dark each
their own file). The goal choices are now **Airplane** (default), **Holo glass**,
**Carry-on**, **Passport**, and **Globe**. The scene choices are **Current**, **Aurora**,
**Dawn**, **Halo**, **Bokeh**, **Mist**, and **Beams** (the 2026-09-21 atmosphere set; Silk, Prism,
Watercolour and Terraces retired). Generated scenes use a taller 4:5 display area;
Current keeps its original geometry. Light scenes reserve a pale
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
| public/return-exp1/ambient/variants/gen_scene-current-mobile-tall-light.png | current · light, top-extended phone safe-area outpaint |
| public/return-exp1/ambient/variants/gen_scene-current-mobile-tall-dark.png | current · dark, top-extended phone safe-area outpaint |
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
| public/return-exp1/ambient/variants/gen_holo-coin-lens.png | Tracker icon holder · holo glass domed cabochon coin, face-on, 256 × 256 with alpha — same refs and engine, 2026-09-21 |

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
