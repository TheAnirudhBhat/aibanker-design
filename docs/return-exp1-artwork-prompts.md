# Return exp1 artwork prompts

Generated with the built-in image_gen tool. Project assets are recorded in GENERATED_ASSETS.md.

## Atmosphere scenes (2026-09-21)

Direction: the designer kept Current and Aurora out of the 2026-09-18 set and dropped the
four material treatments (Silk, Prism, Watercolour, Terraces), so this set is light and
atmosphere only — no fabric, glass, paper, texture or objects. Each scene is generated
ONCE per mode as a tall 2:3 image (1024 × 1536) whose top quarter is calm headroom, so
the same file serves the 4:5 desktop field (bottom-anchored, the headroom cropped) and
the phone (shown whole). Served as WebP under `gen_scene-<scene>-<mode>.webp`.

Run: `codex exec --skip-git-repo-check -s workspace-write -i ref/aurora-<mode>.png
-i ref/current-<mode>.png - < p_<scene>-<mode>.txt` — Image 1 is the existing Aurora
desktop scene of that mode (softness/restraint), Image 2 the existing Current phone
outpaint of that mode (composition: calm top quarter, event mid, ground at the foot).

### Shared brief — light

```text
Use case: stylized-concept.
Asset: ONE full-bleed abstract atmospheric background for the top of a mobile finance app's home page, light mode. Portrait orientation, 1024 by 1536 pixels.

Image 1 is a STYLE reference only. Match its softness: heavy defocus, smooth continuous colour fields, no visible texture, grain, brushwork, fabric, paper, glass or any other material, no hard edges anywhere; and match its restraint: pastel colour on a white ground, never saturated. Do NOT reuse its subject (its ribbons).
Image 2 is a COMPOSITION reference only. Like it: the TOP QUARTER of the canvas is nearly plain and near-white (#FFFFFF to #F6FDFD) because a phone's status bar and app title sit there in black text; the visual event lives in the MIDDLE band (roughly 25% to 65% of the height); the BOTTOM QUARTER dissolves to plain pure white so the artwork joins the app surface. Do NOT reuse its subject (its curtain bands).

Subject: <see the scene below>

Constraints: atmosphere and light only. No objects, figures, horizon line, landscape, water surface, buildings, stars, sparkles or lens-flare shapes with hard edges. No text, icons, UI, borders, frames, rounded corners, vignette, watermark, noise or film grain. Overall value stays light and airy; nothing darker than a mid pastel. Full bleed on all four sides.

Copy the final PNG to ./out/<scene>-<mode>.png (create the file yourself) and reply with only that path.
```

### Shared brief — dark

```text
Use case: stylized-concept.
Asset: ONE full-bleed abstract atmospheric background for the top of a mobile finance app's home page, dark mode. Portrait orientation, 1024 by 1536 pixels.

Image 1 is a STYLE reference only. Match its softness: heavy defocus, smooth continuous colour fields, no visible texture, grain, brushwork, fabric, paper, glass or any other material, no hard edges anywhere; and match its restraint: dim, muted colour glowing out of a near-black ground, never neon. Do NOT reuse its subject (its ribbons).
Image 2 is a COMPOSITION reference only. Like it: the TOP QUARTER of the canvas is nearly plain and near-black (#000000 to #0A0A0E) because a phone's status bar and app title sit there in white text; the visual event lives in the MIDDLE band (roughly 25% to 65% of the height); the BOTTOM QUARTER dissolves to plain near-black (#050108) so the artwork joins the app surface. Do NOT reuse its subject (its curtain bands).

Subject: <see the scene below>

Constraints: atmosphere and light only. No objects, figures, horizon line, landscape, water surface, buildings, stars, sparkles or lens-flare shapes with hard edges. No text, icons, UI, borders, frames, rounded corners, vignette, watermark, noise or film grain. Overall value stays dark; the glow is soft and never reaches pure white. Full bleed on all four sides.

Copy the final PNG to ./out/<scene>-<mode>.png (create the file yourself) and reply with only that path.
```

### Subjects

| Scene | Light | Dark |
|---|---|---|
| dawn | First light. A soft bloom of pale peach and rose rising from low in the middle band, lifting through faint lilac into near-white above: the sky a minute before sunrise, completely out of focus. Warm and quiet. | Dusk. A dim ember of deep rose and muted amber glowing low in the middle band, lifting through deep violet into near-black above: the sky a minute after sundown, completely out of focus. Warm and quiet. |
| bokeh | Lens bokeh. A loose scatter of large, soft, out-of-focus discs of light in lilac, mint and aqua, most of them in the middle band, a few overlapping, every edge very soft, on a white ground. Airy and modern. | Lens bokeh at night. A loose scatter of large, soft, out-of-focus discs of dim violet, teal and a little magenta light, most of them in the middle band, a few overlapping, every edge very soft, on a near-black ground. |
| nebula (generated, not shipped: its light image read as a second Mist) | A soft cosmic haze. Billowing, heavily blurred clouds of pale lavender, mint and a whisper of magenta drifting through the middle band, seen completely out of focus, on a white ground. | A nebula at night. Billowing, heavily blurred clouds of deep violet, teal and a little magenta glowing gently through the middle band, seen completely out of focus, on a near-black ground. |
| mist | Banks of soft mist lit from above. Layered, heavily blurred veils of pale lilac and mint light resting low in the middle band and thinning to white above, on a white ground. | Moonlit mist. Layered, heavily blurred veils of slate blue and dim violet resting low in the middle band and thinning to near-black above, on a near-black ground. |
| halo | One large soft halo. A single gentle radial glow centred in the upper part of the middle band: a magenta-violet core (the #D30AD7 family, kept pale and desaturated) fading through lilac to white with no visible edge, on a white ground. Nothing else. | One large soft halo at night. A single gentle radial glow centred in the upper part of the middle band: a dim magenta-violet core (the #D30AD7 family, muted) fading to near-black with no visible edge, on a near-black ground. Nothing else. |
| beams | Soft diagonal beams. Two or three broad, heavily blurred shafts of pale aqua and lilac light entering below the top quarter from the upper left, falling down through the middle band and fading out, on a white ground. | Soft diagonal beams at night. Two or three broad, heavily blurred shafts of dim teal and violet light entering below the top quarter from the upper left, falling down through the middle band and fading out, on a near-black ground. |

## Neutral icon-holder framework

Output: `public/return-exp1/ambient/variants/gen_icon-holder-tile.png` (256 × 256, transparent). Built-in image_gen; the DLS glyph stays a live overlay in NeutralIconHolder.tsx. Replaces the rejected pearl-coin experiment.

```text
Use case: stylized-concept. Create one circular, softly rounded holographic glass tile on a genuinely transparent background. It is an EMPTY supporting illustration for a finance app's existing colored icon, overlaid in code at 24px. No icon, symbol, lettering or text in the image. Nearly front-on with slight 2.5D depth, translucent cyan/violet/pale-pink sheen, milky center, broad blank face, no coin or metallic medallion. Square canvas, centered complete object at 84% of canvas width, crisp at 56px. No progress ring, pedestal, frame, chrome, black outline, hard shadow, extra object or watermark. True transparent alpha outside the holder.
```

## Phone safe-area outpaints

Built-in image_gen edits, with each existing scene as the edit target. Served as WebP at up to 1080px wide without cropping the generated result. Desktop assets are retained. Phone layout reserves 1.5 × width plus the measured safe-area height.

### current · light

Output: `public/return-exp1/ambient/variants/gen_scene-current-mobile-light.webp`.

```text
Use case: precise-object-edit.
Input image: edit target, the existing light-mode background artwork at the top of a mobile finance app.
Primary request: extend the canvas vertically UPWARD with approximately 35% additional image height above the existing top edge. Outpaint new artwork at the TOP, not a stretched or zoomed crop. Keep the original lower portion's curtain-like vertical atmospheric bands, exact soft teal and pale mint palette, lighting and blurred texture. Seamlessly continue the same scene into the new top headroom so phone safe areas and status icons sit over a quiet area without consuming the original composition.
Output framing: a taller portrait background, full bleed on all four sides, preserving the entire old composition in the lower part. Keep the new top portion very pale, low-contrast mint for legible black status and app-bar text.
Constraints: no text, no icons, no UI, no new objects, no borders, no rounded corners, no black or white padding strips, no harsh seam, no watermark. Extend the existing visual language naturally; do not replace it with a different style.
```

### current · dark

Output: `public/return-exp1/ambient/variants/gen_scene-current-mobile-dark.webp`.

```text
Use case: precise-object-edit.
Input image: edit target, the existing dark-mode background artwork at the top of a mobile finance app.
Primary request: extend the canvas vertically UPWARD with approximately 35% additional image height above the existing top edge. Outpaint new artwork at the TOP, not a stretched or zoomed crop. Keep the original lower portion's curtain-like vertical atmospheric bands, exact charcoal and near-black palette, lighting and blurred texture. Seamlessly continue the same scene into the new top headroom so phone safe areas and status icons sit over a quiet area without consuming the original composition.
Output framing: a taller portrait background, full bleed on all four sides, preserving the entire old composition in the lower part. Keep the new top portion near black, low contrast for legible white status and app-bar text.
Constraints: no text, no icons, no UI, no new objects, no borders, no rounded corners, no black or white padding strips, no harsh seam, no watermark. Extend the existing visual language naturally; do not replace it with a different style.
```

### aurora · light

Output: `public/return-exp1/ambient/variants/gen_scene-aurora-mobile-light.webp`.

```text
Use case: precise-object-edit.
Input image: edit target, the existing aurora light-mode decorative header artwork.
Primary request: extend this artwork vertically UPWARD to create additional calm headroom for a mobile phone's safe area, status bar and app bar. Outpaint a taller 2:3 portrait canvas. Preserve the original artwork's distinctive soft blurred pastel light ribbons, palette, material finish, lighting and composition in the lower part. Put approximately one third of the extended canvas into NEW naturally continued artwork above the old top edge. Do not simply scale, stretch or crop the old image.
Composition: tall 2:3 portrait background, full bleed without borders. New upper headroom is quiet very pale and low-contrast, suitable behind black text. Seamlessly continue the existing forms into this new space. Keep the original lower fade into white so it joins the app surface.
Constraints: only extend this background, not a new design. Preserve the original style and colour identity. No text, icons, UI, objects, high-contrast details in the new top area, hard seam, padding strips, watermark, rounded corners or border.
```

### aurora · dark

Output: `public/return-exp1/ambient/variants/gen_scene-aurora-mobile-dark.webp`.

```text
Use case: precise-object-edit.
Input image: edit target, the existing aurora dark-mode decorative header artwork.
Primary request: extend this artwork vertically UPWARD to create additional calm headroom for a mobile phone's safe area, status bar and app bar. Outpaint a taller 2:3 portrait canvas. Preserve the original artwork's distinctive soft blurred pastel light ribbons, palette, material finish, lighting and composition in the lower part. Put approximately one third of the extended canvas into NEW naturally continued artwork above the old top edge. Do not simply scale, stretch or crop the old image.
Composition: tall 2:3 portrait background, full bleed without borders. New upper headroom is quiet very dark and low-contrast, suitable behind white text. Seamlessly continue the existing forms into this new space. Keep the original lower fade into near black so it joins the app surface.
Constraints: only extend this background, not a new design. Preserve the original style and colour identity. No text, icons, UI, objects, high-contrast details in the new top area, hard seam, padding strips, watermark, rounded corners or border.
```

### silk · light

Output: `public/return-exp1/ambient/variants/gen_scene-silk-mobile-light.webp`.

```text
Use case: precise-object-edit.
Input image: edit target, the existing silk light-mode decorative header artwork.
Primary request: extend this artwork vertically UPWARD to create additional calm headroom for a mobile phone's safe area, status bar and app bar. Outpaint a taller 2:3 portrait canvas. Preserve the original artwork's distinctive pearlescent fabric folds, palette, material finish, lighting and composition in the lower part. Put approximately one third of the extended canvas into NEW naturally continued artwork above the old top edge. Do not simply scale, stretch or crop the old image.
Composition: tall 2:3 portrait background, full bleed without borders. New upper headroom is quiet very pale and low-contrast, suitable behind black text. Seamlessly continue the existing forms into this new space. Keep the original lower fade into white so it joins the app surface.
Constraints: only extend this background, not a new design. Preserve the original style and colour identity. No text, icons, UI, objects, high-contrast details in the new top area, hard seam, padding strips, watermark, rounded corners or border.
```

### silk · dark

Output: `public/return-exp1/ambient/variants/gen_scene-silk-mobile-dark.webp`.

```text
Use case: precise-object-edit.
Input image: edit target, the existing silk dark-mode decorative header artwork.
Primary request: extend this artwork vertically UPWARD to create additional calm headroom for a mobile phone's safe area, status bar and app bar. Outpaint a taller 2:3 portrait canvas. Preserve the original artwork's distinctive pearlescent fabric folds, palette, material finish, lighting and composition in the lower part. Put approximately one third of the extended canvas into NEW naturally continued artwork above the old top edge. Do not simply scale, stretch or crop the old image.
Composition: tall 2:3 portrait background, full bleed without borders. New upper headroom is quiet very dark and low-contrast, suitable behind white text. Seamlessly continue the existing forms into this new space. Keep the original lower fade into near black so it joins the app surface.
Constraints: only extend this background, not a new design. Preserve the original style and colour identity. No text, icons, UI, objects, high-contrast details in the new top area, hard seam, padding strips, watermark, rounded corners or border.
```

### prism · light

Output: `public/return-exp1/ambient/variants/gen_scene-prism-mobile-light.webp`.

```text
Use case: precise-object-edit.
Input image: edit target, the existing prism light-mode decorative header artwork.
Primary request: extend this artwork vertically UPWARD to create additional calm headroom for a mobile phone's safe area, status bar and app bar. Outpaint a taller 2:3 portrait canvas. Preserve the original artwork's distinctive frosted glass arcs and refracted light, palette, material finish, lighting and composition in the lower part. Put approximately one third of the extended canvas into NEW naturally continued artwork above the old top edge. Do not simply scale, stretch or crop the old image.
Composition: tall 2:3 portrait background, full bleed without borders. New upper headroom is quiet very pale and low-contrast, suitable behind black text. Seamlessly continue the existing forms into this new space. Keep the original lower fade into white so it joins the app surface.
Constraints: only extend this background, not a new design. Preserve the original style and colour identity. No text, icons, UI, objects, high-contrast details in the new top area, hard seam, padding strips, watermark, rounded corners or border.
```

### prism · dark

Output: `public/return-exp1/ambient/variants/gen_scene-prism-mobile-dark.webp`.

```text
Use case: precise-object-edit.
Input image: edit target, the existing prism dark-mode decorative header artwork.
Primary request: extend this artwork vertically UPWARD to create additional calm headroom for a mobile phone's safe area, status bar and app bar. Outpaint a taller 2:3 portrait canvas. Preserve the original artwork's distinctive frosted glass arcs and refracted light, palette, material finish, lighting and composition in the lower part. Put approximately one third of the extended canvas into NEW naturally continued artwork above the old top edge. Do not simply scale, stretch or crop the old image.
Composition: tall 2:3 portrait background, full bleed without borders. New upper headroom is quiet very dark and low-contrast, suitable behind white text. Seamlessly continue the existing forms into this new space. Keep the original lower fade into near black so it joins the app surface.
Constraints: only extend this background, not a new design. Preserve the original style and colour identity. No text, icons, UI, objects, high-contrast details in the new top area, hard seam, padding strips, watermark, rounded corners or border.
```

### watercolour · light

Output: `public/return-exp1/ambient/variants/gen_scene-watercolour-mobile-light.webp`.

```text
Use case: precise-object-edit.
Input image: edit target, the existing watercolour light-mode decorative header artwork.
Primary request: extend this artwork vertically UPWARD to create additional calm headroom for a mobile phone's safe area, status bar and app bar. Outpaint a taller 2:3 portrait canvas. Preserve the original artwork's distinctive organic pigment washes and subtle paper, palette, material finish, lighting and composition in the lower part. Put approximately one third of the extended canvas into NEW naturally continued artwork above the old top edge. Do not simply scale, stretch or crop the old image.
Composition: tall 2:3 portrait background, full bleed without borders. New upper headroom is quiet very pale and low-contrast, suitable behind black text. Seamlessly continue the existing forms into this new space. Keep the original lower fade into white so it joins the app surface.
Constraints: only extend this background, not a new design. Preserve the original style and colour identity. No text, icons, UI, objects, high-contrast details in the new top area, hard seam, padding strips, watermark, rounded corners or border.
```

### watercolour · dark

Output: `public/return-exp1/ambient/variants/gen_scene-watercolour-mobile-dark.webp`.

```text
Use case: precise-object-edit.
Input image: edit target, the existing watercolour dark-mode decorative header artwork.
Primary request: extend this artwork vertically UPWARD to create additional calm headroom for a mobile phone's safe area, status bar and app bar. Outpaint a taller 2:3 portrait canvas. Preserve the original artwork's distinctive organic pigment washes and subtle paper, palette, material finish, lighting and composition in the lower part. Put approximately one third of the extended canvas into NEW naturally continued artwork above the old top edge. Do not simply scale, stretch or crop the old image.
Composition: tall 2:3 portrait background, full bleed without borders. New upper headroom is quiet very dark and low-contrast, suitable behind white text. Seamlessly continue the existing forms into this new space. Keep the original lower fade into near black so it joins the app surface.
Constraints: only extend this background, not a new design. Preserve the original style and colour identity. No text, icons, UI, objects, high-contrast details in the new top area, hard seam, padding strips, watermark, rounded corners or border.
```

### terraces · light

Output: `public/return-exp1/ambient/variants/gen_scene-terraces-mobile-light.webp`.

```text
Use case: precise-object-edit.
Input image: edit target, the existing terraces light-mode decorative header artwork.
Primary request: extend this artwork vertically UPWARD to create additional calm headroom for a mobile phone's safe area, status bar and app bar. Outpaint a taller 2:3 portrait canvas. Preserve the original artwork's distinctive sculptural layered paper terraces, palette, material finish, lighting and composition in the lower part. Put approximately one third of the extended canvas into NEW naturally continued artwork above the old top edge. Do not simply scale, stretch or crop the old image.
Composition: tall 2:3 portrait background, full bleed without borders. New upper headroom is quiet very pale and low-contrast, suitable behind black text. Seamlessly continue the existing forms into this new space. Keep the original lower fade into white so it joins the app surface.
Constraints: only extend this background, not a new design. Preserve the original style and colour identity. No text, icons, UI, objects, high-contrast details in the new top area, hard seam, padding strips, watermark, rounded corners or border.
```

### terraces · dark

Output: `public/return-exp1/ambient/variants/gen_scene-terraces-mobile-dark.webp`.

```text
Use case: precise-object-edit.
Input image: edit target, the existing terraces dark-mode decorative header artwork.
Primary request: extend this artwork vertically UPWARD to create additional calm headroom for a mobile phone's safe area, status bar and app bar. Outpaint a taller 2:3 portrait canvas. Preserve the original artwork's distinctive sculptural layered paper terraces, palette, material finish, lighting and composition in the lower part. Put approximately one third of the extended canvas into NEW naturally continued artwork above the old top edge. Do not simply scale, stretch or crop the old image.
Composition: tall 2:3 portrait background, full bleed without borders. New upper headroom is quiet very dark and low-contrast, suitable behind white text. Seamlessly continue the existing forms into this new space. Keep the original lower fade into near black so it joins the app surface.
Constraints: only extend this background, not a new design. Preserve the original style and colour identity. No text, icons, UI, objects, high-contrast details in the new top area, hard seam, padding strips, watermark, rounded corners or border.
```

## Travel goal objects

### Neutral Holo glass

Output: `public/return-exp1/ambient/variants/gen_ring-holo.png` (256 × 256, transparent). Built-in image_gen edit of the earlier plane; saturated rainbow was removed so it works with Valentino, orange, red and green ring accents.

```text
Use case: precise-object-edit. Preserve the exact paper-plane silhouette, angle, transparent canvas, proportions and soft glass material, but replace saturated rainbow cyan/pink/yellow with restrained pearlescent clear glass, soft silver, pale smoke grey and a subtle cool lavender tint. Keep gentle translucent refraction and highlights, with no vivid rainbow. Change only the material color treatment; preserve geometry and true alpha. No text, logo, extra object, ring, card, background or watermark.
```

### Airplane

Output: `public/return-exp1/ambient/variants/gen_ring-flight.png` (256 × 256, transparent).

```text
Use case: stylized-concept.
Asset type: transparent PNG 3D travel-object illustration for a travel savings goal inside a mobile finance app's progress ring, displayed at just 54 by 54 pixels.
Primary request: Create ONE isolated travel object, with a simple recognizable chunky silhouette and refined miniature 3D product-illustration finish.
Scene/backdrop: genuinely transparent alpha background, absolutely no backdrop, floor, pedestal, ground plane, background shadow, vignette or checkerboard.
Composition: square canvas, centered entire object, three-quarter isometric view, object occupies 80–85% of the square's longest dimension, nothing cropped. Generous clear edge margins, visual weight balanced about the center.
Style: beautifully modeled smooth rounded geometry, satin ceramic and softly polished material, premium friendly fintech illustration, crisp readable edges, restrained detail, soft studio light from top left and subtle neutral rim light so it reads on both white and charcoal #151718 cards.
Constraints: one object only, no surrounding accessories, no progress ring, no card or UI, no lettering, no numbers, no words, no watermark, no logos, no sparkle decoration. Real transparency is essential.
Subject: a small commercial passenger airplane in flight, banked gently with its nose pointing toward upper right. Pearlescent ivory fuselage, soft periwinkle-blue wings and tail, blue cockpit window, two simple rounded engines below the wings. A charming streamlined toy-like airliner, unmistakably travel, NOT a paper airplane. A compact broad-wing silhouette, no contrails or clouds.
```

### Carry-on

Output: `public/return-exp1/ambient/variants/gen_ring-luggage.png` (256 × 256, transparent).

```text
Use case: stylized-concept.
Asset type: transparent PNG 3D travel-object illustration for a travel savings goal inside a mobile finance app's progress ring, displayed at just 54 by 54 pixels.
Primary request: Create ONE isolated travel object, with a simple recognizable chunky silhouette and refined miniature 3D product-illustration finish.
Scene/backdrop: genuinely transparent alpha background, absolutely no backdrop, floor, pedestal, ground plane, background shadow, vignette or checkerboard.
Composition: square canvas, centered entire object, three-quarter isometric view, object occupies 80–85% of the square's longest dimension, nothing cropped. Generous clear edge margins, visual weight balanced about the center.
Style: beautifully modeled smooth rounded geometry, satin ceramic and softly polished material, premium friendly fintech illustration, crisp readable edges, restrained detail, soft studio light from top left and subtle neutral rim light so it reads on both white and charcoal #151718 cards.
Constraints: one object only, no surrounding accessories, no progress ring, no card or UI, no lettering, no numbers, no words, no watermark, no logos, no sparkle decoration. Real transparency is essential.
Subject: a single stylish carry-on roller suitcase, slightly tilted at a three-quarter view, with rounded corners, a short raised telescopic handle, two tiny integrated wheels and three broad molded vertical ribs. Muted lavender-blue satin shell with a soft lilac side, pale silver handle and dark violet wheels. One coherent suitcase object, no tags or stickers or nearby accessories.
```

### Passport

Output: `public/return-exp1/ambient/variants/gen_ring-passport.png` (256 × 256, transparent).

```text
Use case: stylized-concept.
Asset type: transparent PNG 3D travel-object illustration for a travel savings goal inside a mobile finance app's progress ring, displayed at just 54 by 54 pixels.
Primary request: Create ONE isolated travel object, with a simple recognizable chunky silhouette and refined miniature 3D product-illustration finish.
Scene/backdrop: genuinely transparent alpha background, absolutely no backdrop, floor, pedestal, ground plane, background shadow, vignette or checkerboard.
Composition: square canvas, centered entire object, three-quarter isometric view, object occupies 80–85% of the square's longest dimension, nothing cropped. Generous clear edge margins, visual weight balanced about the center.
Style: beautifully modeled smooth rounded geometry, satin ceramic and softly polished material, premium friendly fintech illustration, crisp readable edges, restrained detail, soft studio light from top left and subtle neutral rim light so it reads on both white and charcoal #151718 cards.
Constraints: one object only, no surrounding accessories, no progress ring, no card or UI, no lettering, no numbers, no words, no watermark, no logos, no sparkle decoration. Real transparency is essential.
Subject: one closed travel passport booklet, slightly tilted in a three-quarter isometric view, with softly rounded corners and a clearly visible cream page block. Rich periwinkle-indigo satin leather cover, one simple embossed pale gold globe emblem centered on the cover, very subtle spine detail. A passport without any text, letters, country emblems, boarding passes or tickets. A bold clean booklet silhouette, no fine patterns.
```

### Globe

Output: `public/return-exp1/ambient/variants/gen_ring-globe.png` (256 × 256, transparent).

```text
Use case: stylized-concept.
Asset type: transparent PNG 3D travel-object illustration for a travel savings goal inside a mobile finance app's progress ring, displayed at just 54 by 54 pixels.
Primary request: Create ONE isolated travel object, with a simple recognizable chunky silhouette and refined miniature 3D product-illustration finish.
Scene/backdrop: genuinely transparent alpha background, absolutely no backdrop, floor, pedestal, ground plane, background shadow, vignette or checkerboard.
Composition: square canvas, centered entire object, three-quarter isometric view, object occupies 80–85% of the square's longest dimension, nothing cropped. Generous clear edge margins, visual weight balanced about the center.
Style: beautifully modeled smooth rounded geometry, satin ceramic and softly polished material, premium friendly fintech illustration, crisp readable edges, restrained detail, soft studio light from top left and subtle neutral rim light so it reads on both white and charcoal #151718 cards.
Constraints: one object only, no surrounding accessories, no progress ring, no card or UI, no lettering, no numbers, no words, no watermark, no logos, no sparkle decoration. Real transparency is essential.
Subject: one compact miniature globe of the Earth, floating alone without a stand or orbit. Satin sky-blue ocean and slightly raised smooth mint-jade land masses, Asia and the Pacific turned toward the viewer, subtle darker blue lower edge and soft milky highlights. It must read instantly as a travel globe, not an abstract orb. No route lines, map pins, airplane, outlines, latitude grid, labels or stars.
```

## Taller ambient scenes

### Silk — light

Output: `public/return-exp1/ambient/variants/gen_scene-silk-light.png` (1080 × 1350).

```text
Use case: stylized-concept.
Asset type: a tall ambient background illustration behind a mobile finance dashboard, not a UI mockup.
Primary request: one beautiful restrained background with a distinct material style, portrait 4:5 composition. Generate a portrait image, approximately 1024 by 1280. This background will span about 450px high at a phone width of 360px, noticeably taller than a short header banner.
Composition: a continuous immersive vertical field, visual interest in the outer edges and middle third, a calm low-detail full-width top 25% reserved for a status bar and page title, and the bottom 30% gradually dissolving to a perfectly uniform page ground. No hard horizon, framing, objects or focal point.
Constraints: no UI, no device mockup, no typography or letters, no logos, no borders, no grain that looks dirty, no tiny busy detail, no high contrast directly behind the header. It should feel premium, spacious, soft and atmospheric.
Material style: softly lit flowing silk, broad translucent satin folds descending vertically and gently curving across the edges, beautiful pearlescent highlights, very soft sculptural depth. Light palette: pearl ivory with cool periwinkle, lilac and a hint of mint. Dark palette: smoky indigo silk with muted teal and violet folds; faint pearlescent edges, no white hotspots.
Render the LIGHT MODE version only. High-key and softly colored. The entire top quarter must be a very light pearl-white wash, minimum visual contrast, so near-black #171a1f typography is clearly readable everywhere over it. The richer pastel material lives below that top quarter and toward the outer edges. Finish the bottom 30% in pure white #ffffff. Do not render the dark palette.
```

### Silk — dark

Output: `public/return-exp1/ambient/variants/gen_scene-silk-dark.png` (1080 × 1350).

```text
Use case: stylized-concept.
Asset type: a tall ambient background illustration behind a mobile finance dashboard, not a UI mockup.
Primary request: one beautiful restrained background with a distinct material style, portrait 4:5 composition. Generate a portrait image, approximately 1024 by 1280. This background will span about 450px high at a phone width of 360px, noticeably taller than a short header banner.
Composition: a continuous immersive vertical field, visual interest in the outer edges and middle third, a calm low-detail full-width top 25% reserved for a status bar and page title, and the bottom 30% gradually dissolving to a perfectly uniform page ground. No hard horizon, framing, objects or focal point.
Constraints: no UI, no device mockup, no typography or letters, no logos, no borders, no grain that looks dirty, no tiny busy detail, no high contrast directly behind the header. It should feel premium, spacious, soft and atmospheric.
Material style: softly lit flowing silk, broad translucent satin folds descending vertically and gently curving across the edges, beautiful pearlescent highlights, very soft sculptural depth. Light palette: pearl ivory with cool periwinkle, lilac and a hint of mint. Dark palette: smoky indigo silk with muted teal and violet folds; faint pearlescent edges, no white hotspots.
Render the DARK MODE version only. Low-key with controlled dim colored light. The entire top quarter must be a very dark charcoal/navy wash, smooth and even, so light #f5f5f5 typography is clearly readable everywhere over it. Keep the same type of material and placement as the described light version, adapted to night. Finish the bottom 30% in near-black #050108. Do not render the light palette.
```

### Prism — light

Output: `public/return-exp1/ambient/variants/gen_scene-prism-light.png` (1080 × 1350).

```text
Use case: stylized-concept.
Asset type: a tall ambient background illustration behind a mobile finance dashboard, not a UI mockup.
Primary request: one beautiful restrained background with a distinct material style, portrait 4:5 composition. Generate a portrait image, approximately 1024 by 1280. This background will span about 450px high at a phone width of 360px, noticeably taller than a short header banner.
Composition: a continuous immersive vertical field, visual interest in the outer edges and middle third, a calm low-detail full-width top 25% reserved for a status bar and page title, and the bottom 30% gradually dissolving to a perfectly uniform page ground. No hard horizon, framing, objects or focal point.
Constraints: no UI, no device mockup, no typography or letters, no logos, no borders, no grain that looks dirty, no tiny busy detail, no high contrast directly behind the header. It should feel premium, spacious, soft and atmospheric.
Material style: translucent frosted glass arcs and broad refracted caustic light, overlapping smooth lens-like sweeps, blurred prismatic spectral light rather than solid objects. Light palette: milky opal white, ice blue, pale peach and pale lilac, luminous and airy. Dark palette: obsidian glass atmosphere, deep blue and plum with controlled muted aqua and violet edge light, not bright neon.
Render the LIGHT MODE version only. High-key and softly colored. The entire top quarter must be a very light pearl-white wash, minimum visual contrast, so near-black #171a1f typography is clearly readable everywhere over it. The richer pastel material lives below that top quarter and toward the outer edges. Finish the bottom 30% in pure white #ffffff. Do not render the dark palette.
```

### Prism — dark

Output: `public/return-exp1/ambient/variants/gen_scene-prism-dark.png` (1080 × 1350).

```text
Use case: stylized-concept.
Asset type: a tall ambient background illustration behind a mobile finance dashboard, not a UI mockup.
Primary request: one beautiful restrained background with a distinct material style, portrait 4:5 composition. Generate a portrait image, approximately 1024 by 1280. This background will span about 450px high at a phone width of 360px, noticeably taller than a short header banner.
Composition: a continuous immersive vertical field, visual interest in the outer edges and middle third, a calm low-detail full-width top 25% reserved for a status bar and page title, and the bottom 30% gradually dissolving to a perfectly uniform page ground. No hard horizon, framing, objects or focal point.
Constraints: no UI, no device mockup, no typography or letters, no logos, no borders, no grain that looks dirty, no tiny busy detail, no high contrast directly behind the header. It should feel premium, spacious, soft and atmospheric.
Material style: translucent frosted glass arcs and broad refracted caustic light, overlapping smooth lens-like sweeps, blurred prismatic spectral light rather than solid objects. Light palette: milky opal white, ice blue, pale peach and pale lilac, luminous and airy. Dark palette: obsidian glass atmosphere, deep blue and plum with controlled muted aqua and violet edge light, not bright neon.
Render the DARK MODE version only. Low-key with controlled dim colored light. The entire top quarter must be a very dark charcoal/navy wash, smooth and even, so light #f5f5f5 typography is clearly readable everywhere over it. Keep the same type of material and placement as the described light version, adapted to night. Finish the bottom 30% in near-black #050108. Do not render the light palette.
```

### Watercolour — light

Output: `public/return-exp1/ambient/variants/gen_scene-watercolour-light.png` (1080 × 1350).

```text
Use case: stylized-concept.
Asset type: a tall ambient background illustration behind a mobile finance dashboard, not a UI mockup.
Primary request: one beautiful restrained background with a distinct material style, portrait 4:5 composition. Generate a portrait image, approximately 1024 by 1280. This background will span about 450px high at a phone width of 360px, noticeably taller than a short header banner.
Composition: a continuous immersive vertical field, visual interest in the outer edges and middle third, a calm low-detail full-width top 25% reserved for a status bar and page title, and the bottom 30% gradually dissolving to a perfectly uniform page ground. No hard horizon, framing, objects or focal point.
Constraints: no UI, no device mockup, no typography or letters, no logos, no borders, no grain that looks dirty, no tiny busy detail, no high contrast directly behind the header. It should feel premium, spacious, soft and atmospheric.
Material style: atmospheric hand-painted watercolour, generous organic wet-on-wet pigment blooms and a very fine cold-press paper texture, diffuse overlapping washes, naturally irregular soft edges; no illustrated objects. Light palette: pale sage, blue-grey, blush and apricot on warm-white paper. Dark palette: deep midnight ink washes in indigo, petrol blue and muted plum on charcoal, subtle paper texture, elegant and low contrast.
Render the LIGHT MODE version only. High-key and softly colored. The entire top quarter must be a very light pearl-white wash, minimum visual contrast, so near-black #171a1f typography is clearly readable everywhere over it. The richer pastel material lives below that top quarter and toward the outer edges. Finish the bottom 30% in pure white #ffffff. Do not render the dark palette.
```

### Watercolour — dark

Output: `public/return-exp1/ambient/variants/gen_scene-watercolour-dark.png` (1080 × 1350).

```text
Use case: stylized-concept.
Asset type: a tall ambient background illustration behind a mobile finance dashboard, not a UI mockup.
Primary request: one beautiful restrained background with a distinct material style, portrait 4:5 composition. Generate a portrait image, approximately 1024 by 1280. This background will span about 450px high at a phone width of 360px, noticeably taller than a short header banner.
Composition: a continuous immersive vertical field, visual interest in the outer edges and middle third, a calm low-detail full-width top 25% reserved for a status bar and page title, and the bottom 30% gradually dissolving to a perfectly uniform page ground. No hard horizon, framing, objects or focal point.
Constraints: no UI, no device mockup, no typography or letters, no logos, no borders, no grain that looks dirty, no tiny busy detail, no high contrast directly behind the header. It should feel premium, spacious, soft and atmospheric.
Material style: atmospheric hand-painted watercolour, generous organic wet-on-wet pigment blooms and a very fine cold-press paper texture, diffuse overlapping washes, naturally irregular soft edges; no illustrated objects. Light palette: pale sage, blue-grey, blush and apricot on warm-white paper. Dark palette: deep midnight ink washes in indigo, petrol blue and muted plum on charcoal, subtle paper texture, elegant and low contrast.
Render the DARK MODE version only. Low-key with controlled dim colored light. The entire top quarter must be a very dark charcoal/navy wash, smooth and even, so light #f5f5f5 typography is clearly readable everywhere over it. Keep the same type of material and placement as the described light version, adapted to night. Finish the bottom 30% in near-black #050108. Do not render the light palette.
```

### Terraces — light

Output: `public/return-exp1/ambient/variants/gen_scene-terraces-light.png` (1080 × 1350).

```text
Use case: stylized-concept.
Asset type: a tall ambient background illustration behind a mobile finance dashboard, not a UI mockup.
Primary request: one beautiful restrained background with a distinct material style, portrait 4:5 composition. Generate a portrait image, approximately 1024 by 1280. This background will span about 450px high at a phone width of 360px, noticeably taller than a short header banner.
Composition: a continuous immersive vertical field, visual interest in the outer edges and middle third, a calm low-detail full-width top 25% reserved for a status bar and page title, and the bottom 30% gradually dissolving to a perfectly uniform page ground. No hard horizon, framing, objects or focal point.
Constraints: no UI, no device mockup, no typography or letters, no logos, no borders, no grain that looks dirty, no tiny busy detail, no high contrast directly behind the header. It should feel premium, spacious, soft and atmospheric.
Material style: sculptural layered paper landscape made only of broad abstract smooth curving terraces, large rounded cut-paper layers with gentle diffuse shadow and tactile matte material, contours enter from the sides below the top quarter, no literal hills, sun or buildings. Light palette: chalk white, pale glacier blue, pale lavender and desaturated mint. Dark palette: charcoal, slate blue and subdued violet layers with subtle soft edge light, no brilliant white areas.
Render the LIGHT MODE version only. High-key and softly colored. The entire top quarter must be a very light pearl-white wash, minimum visual contrast, so near-black #171a1f typography is clearly readable everywhere over it. The richer pastel material lives below that top quarter and toward the outer edges. Finish the bottom 30% in pure white #ffffff. Do not render the dark palette.
```

### Terraces — dark

Output: `public/return-exp1/ambient/variants/gen_scene-terraces-dark.png` (1080 × 1350).

```text
Use case: stylized-concept.
Asset type: a tall ambient background illustration behind a mobile finance dashboard, not a UI mockup.
Primary request: one beautiful restrained background with a distinct material style, portrait 4:5 composition. Generate a portrait image, approximately 1024 by 1280. This background will span about 450px high at a phone width of 360px, noticeably taller than a short header banner.
Composition: a continuous immersive vertical field, visual interest in the outer edges and middle third, a calm low-detail full-width top 25% reserved for a status bar and page title, and the bottom 30% gradually dissolving to a perfectly uniform page ground. No hard horizon, framing, objects or focal point.
Constraints: no UI, no device mockup, no typography or letters, no logos, no borders, no grain that looks dirty, no tiny busy detail, no high contrast directly behind the header. It should feel premium, spacious, soft and atmospheric.
Material style: sculptural layered paper landscape made only of broad abstract smooth curving terraces, large rounded cut-paper layers with gentle diffuse shadow and tactile matte material, contours enter from the sides below the top quarter, no literal hills, sun or buildings. Light palette: chalk white, pale glacier blue, pale lavender and desaturated mint. Dark palette: charcoal, slate blue and subdued violet layers with subtle soft edge light, no brilliant white areas.
Render the DARK MODE version only. Low-key with controlled dim colored light. The entire top quarter must be a very dark charcoal/navy wash, smooth and even, so light #f5f5f5 typography is clearly readable everywhere over it. Keep the same type of material and placement as the described light version, adapted to night. Finish the bottom 30% in near-black #050108. Do not render the light palette.
```

## 2026-09-24 — Revolut-style full-screen grounds (Ground & cards)

One 2:3 file per mode, cover-fit on the pinned wash layer. Shared preamble, then the per-brief line. Refs passed with `-i`: two Revolut screens (palette, mood) and the Aurora phone outpaint of the same mode (restraint). **Shipped:** cobalt, violet, haze, field. **Waiting on Codex credits:** aurora, mesh, spot (the workspace ran dry after eight renders).

**Preamble (every brief):**

> Generate ONE image, portrait orientation, 1024 by 1536 pixels. It is the FULL-SCREEN background of a modern fintech mobile app, in the visual register of Revolut: pure atmosphere — soft light and colour only. Rules: no objects, no text, no UI, no logos, no horizon, no people, no stars, no material texture (no silk, paper, glass, fabric, metal), no hard edges, no visible banding, no vignette frame. Heavy defocus everywhere, like a gaussian-blurred colour field. The colour must fill the ENTIRE frame from the very top edge to the very bottom edge — never fade to a plain flat band at the top or the bottom. The middle 60% of the frame must stay calm and low-contrast because translucent cards and white or black text will sit on it; put the brightest and most saturated light in the top third. Image 1 and Image 2 are palette and mood references only — do NOT copy their layout, cards, icons or any UI. Image 3 shows the degree of softness and restraint wanted.

- **cobalt · dark** — A deep, saturated electric cobalt blue glow at the top centre, like Revolut's blue home, sinking smoothly through royal blue and midnight navy to a near-black charcoal (#0e1018) at the bottom. One soft bright bloom in the top third. Dark mode: the lower two thirds stay very dark so white text reads.
- **cobalt · light** — The daylight reading of a cobalt-blue home: a soft sky-blue and periwinkle bloom at the top third, sinking smoothly into pale powder blue and a very pale cool lavender-white that continues to the very bottom edge. Light mode: keep everything light enough that black text reads everywhere, but never plain white — colour reaches the bottom edge.
- **violet · dark** — A deep violet-magenta glow at the top centre, like Revolut's purple home, sinking smoothly through royal purple and deep indigo to a near-black warm charcoal (#12101a) at the bottom. One soft bright violet bloom in the top third. Dark mode: the lower two thirds stay very dark so white text reads.
- **violet · light** — The daylight reading of a violet home: a soft lilac and orchid bloom at the top third, sinking smoothly into pale lavender and a very pale warm lilac-white that continues to the very bottom edge. Light mode: black text must read everywhere, never plain white — colour reaches the bottom edge.
- **haze · dark** — A charcoal near-black ground (#1a1b22) with a deep indigo-blue haze bloomed across the top third, like a blurred indigo light behind dark glass, thinning into faint blue-grey drift over the lower two thirds so the whole frame carries a little tone. Dark mode, very restrained.
- **haze · light** — A cool off-white ground (#f2f3f7) with a soft periwinkle-blue haze bloomed across the top third, like a blurred indigo light behind frosted glass, thinning into faint blue-grey drift over the lower two thirds so the whole frame carries a little tone. Light mode, very restrained, black text must read.
- **field · dark** — Revolut's blurred colour field: three or four very large, heavily defocused pools of colour — deep blue, magenta-violet, a warm amber-orange — melting into each other on a deep navy-black ground; the pools sit mostly in the top half and thin toward the bottom, but the bottom edge still carries colour. Dark mode.
- **field · light** — The daylight reading of a blurred colour field: three or four very large, heavily defocused pastel pools — sky blue, lilac, a warm peach — melting into each other on a pale white-lavender ground; pools mostly in the top half, thinning toward the bottom, but the bottom edge still carries colour. Light mode, black text must read.
- **aurora · dark** — Aurora ribbons running the FULL height of the frame on a warm near-black ground (#17141c): two or three broad, very soft ribbons of violet-magenta (#d30ad7 leaning), teal and mint, drifting diagonally from the top down to the very bottom edge, so no band of the frame is plain. Dark mode; ribbons stay dim in the middle third.
- **aurora · light** — Aurora ribbons running the FULL height of the frame on an off-white ground (#f7f4f9): two or three broad, very soft ribbons of lilac, aqua and mint drifting diagonally from the top down to the very bottom edge, so no band of the frame is plain. Light mode; black text must read everywhere.
- **mesh · dark** — A modern two-hue mesh gradient: deep Valentino violet-magenta (#d30ad7 darkened) and deep royal blue folding into each other over a near-black ground, with a very fine, even film grain across the whole frame. Only those two hues plus black. The mesh is brightest in the top third and quietens over the rest, but colour reaches the bottom edge. Dark mode.
- **mesh · light** — A modern two-hue mesh gradient in daylight: pale Valentino pink-lilac and pale sky blue folding into each other over a white ground, with a very fine, even film grain across the whole frame. Only those two hues plus white. Brightest colour in the top third, quieter below, but colour reaches the bottom edge. Light mode, black text must read.
- **spot · dark** — A near-black ground (#0b0c12) with one soft, cool white-blue spotlight glow blooming from the top centre — like a single light above a dark stage — fading into deep blue-black by the middle and staying a very deep, faintly blue black to the bottom edge. Dark mode, cinematic, restrained.
- **spot · light** — A pale cool-white ground with one soft, warm-white spotlight glow blooming from the top centre and a faint cool blue-grey shade gathering toward the edges and the bottom, so the frame reads lit from above and never plain flat white. Light mode, cinematic, restrained.
