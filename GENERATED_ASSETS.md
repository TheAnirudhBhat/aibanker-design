# Generated placeholder assets — REDRAW before ship (visual team worklist)

Proto-only illustrations, generated 2026-09-18 with the OpenAI Codex CLI (0.155, built-in
`image_gen`) from slice's own illustration set as style references. None of these is
DLS-final: the visual team redraws whatever the designer keeps, and the `gen_` prefix +
this table is the grep-able list of what to replace. Icons are never generated — these are
illustrations only (slice-design `reference_slice_asset_generation.md`).

Where they are used: the **Ambient** home of `/app/return-exp1-v2`, behind two debug-panel
flags — **Goal object** (the object in the Trip to Japan ring's hole, drawn at 54px) and
**Ambient scene** (the atmosphere at the top of the page, 360px wide, light and dark each
their own file). "Current" on both flags is the canon export; the five treatments are
parallel across the two flags so they pair, but can be mixed.

| Asset | Concept | Style references given to the model | Engine | Created | Status |
|---|---|---|---|---|---|
| public/return-exp1/ambient/variants/gen_ring-holo.png | goal object · holo glass — iridescent glass paper plane | theme54/orb.png, theme54/crystal.png (material); ambient/goal.png (composition) | codex image_gen | 2026-09-18 | placeholder |
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
