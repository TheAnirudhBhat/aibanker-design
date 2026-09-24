# Card icon · morphs — one flat avatar, many 2.5D skins

The DLS avatar is the standard: a 48 tone disc with the 20 slice glyph in white. For the
icon in a ring's hole (Trip to Japan, the Swiggy tracker) the designer wants the SAME avatar
taken to 2.5D — modern, light and dark, the glyph untouched. This is the system for that
(started 2026-09-24). It sits behind the debug panel's **Card icon** switch beside the
2026-09-23 styles (`docs/card-icon-language.md`). Prototype only.

## Two ways to skin the same avatar

| | Drawn morphs | Rendered morphs |
|---|---|---|
| How | CSS + SVG filters over the real glyph SVG | Codex `image_gen`, the flat avatar handed in as Image 1 |
| Glyph | the file itself, masked — geometry exact | "keep the silhouette exactly" — checked by eye, not guaranteed |
| Tone | any, from the card | baked per render |
| Modes | one style, both modes | a day render, then the same object relit on black |
| Cost | none; retune in a minute | 2 renders per style per glyph, ~2–3 min each |
| Ship | as-is | the visual team redraws what the designer keeps |

Both start from the same thing — `scripts/icon-morph/refs.cjs` draws the flat DLS avatar for
every glyph in `public/return-exp1/icons/` (disc in the card's tone, white glyph at 42%) —
so the two families always compare against one truth.

## Drawn morphs (on the switch now)

All four share one **puck**: the disc lit from the top-left, a rim that darkens toward the
foot, a tinted shadow under it by day and a plain one by night. Then the glyph:

| Style | The glyph |
|---|---|
| Puff | swells out of the puck — a soft rounded form, one specular top-left, shade at its foot |
| Extrude | given thickness — its side in the deep tone falling down-right, a soft shadow on the puck |
| Deboss | pressed into the puck — shadow along its upper edge, light along its lower one, the face a deeper tone |
| Lift | a cut-out floating a hair above the puck on its own soft shadow |

## Revolut register (drawn, added the same day)

The designer asked for "a Revolut-style icon based on our icons". Revolut runs two
registers, read off its live screens on Mobbin (2026-09-24), and both are drawn here:

| Style | What Revolut does | What we draw |
|---|---|---|
| Revolut · disc | the in-app avatar: a saturated disc shading light-to-deep top to bottom (Cash blue, Interest orange, Crypto violet), a white SOLID glyph, no shadow | the same vertical two-tone in the card's tone, our line glyph in white, flat |
| Revolut · glow | the "Glow" theme: a near-black ground lit from below by one colour — read as a portal | a near-black disc, the tone blooming up from its foot, a hairline of the tone on the lower rim, white glyph |
| Revolut · chrome | the spot illustrations: chrome and silver objects (the R coin, the gold bars, the robo-advisor eye) on black | the glyph cast in chrome — a silver gradient through the mask, bevel and specular from the Puff filter — on the glow ground |

Sources: [wealth list](https://mobbin.com/screens/5ba63fd5-6d4c-4149-a1d9-2ac6b6aec32d),
[home products](https://mobbin.com/screens/a2d088dd-3c73-4d57-a905-420857a2aa7a),
[Glow backgrounds](https://mobbin.com/screens/d898938f-4a71-40c8-8d15-eef60b4d9e38),
[R coin](https://mobbin.com/screens/728e3b53-7050-4a14-8349-c4555bb0c3fa),
[gold bars](https://mobbin.com/screens/ecb68f1d-8d70-4b09-9279-99b5caff9507). Revolut's
glyphs are solid fills at ~50% of the disc; ours stay the DLS line glyph at 42% — the point
is our icon in their light, not their icon.

## Rendered morphs (briefs)

`scripts/icon-morph/run.sh <style…>` reads the briefs below (the `### id — Label` heading
plus its fenced block), renders each live glyph (flight, food) by day on pure white, relights
it by night on pure black, keys each ground out (`key.cjs`) and writes
`public/return-exp1/ambient/variants/gen_morph-<style>-<glyph>[-dark].png` at 256².
Each render is then listed in `GENERATED_ASSETS.md`. **Off the switch until rendered** (user
pin 2026-09-24: "if you can't, please remove them"): with the Codex workspace out of credit
every option only showed the flat avatar. Once the files exist, bring the options back — git
history has the `render-*` options and their `<img>` branch in `MorphRingAvatar`.

**Common brief (prepended to every style):**

```
Image 1 is the icon to re-render: a round disc of colour TONE with a white pictogram on it.
Keep EXACTLY as in Image 1: the disc's circular silhouette and how much of the frame it fills,
the pictogram's shape, size, proportion and position, the disc colour, the pictogram's white.
Viewed straight on — no tilt, no perspective, no rotation. Change ONLY the material and the
lighting, as follows.
```

**Common tail:**

```
Background: flat, uniform, pure GROUND — no vignette, no floor, no cast shadow outside the
disc, no text, no extra objects, no sparkles, no environment reflections, no outline.
Square, 1024 by 1024. Copy the final PNG to ./out/NAME.png and reply with only that path.
```

**Night relight (Image 1 = the day render):**

```
Image 1 is a finished icon. Re-render the identical object — same shape, angle, framing and
material — on a flat, uniform, pure black #000000 background. Change only the lighting: a
cooler, dimmer key from the top-left, so the object reads on a near-black card. Nothing
else changes. Square, 1024 by 1024. Copy the final PNG to ./out/NAME.png and reply with
only that path.
```

### clay — Clay

```
Material: soft matte clay. The disc is a shallow puck with gently rounded edges; the
pictogram is raised out of it as a smooth, slightly inflated form with rounded edges, like
clay pressed by a thumb. Matte everywhere — no gloss, no specular dot, no outline. One soft
key light from the top-left, a soft contact shadow where the pictogram meets the disc.
```

### gel — Gel

```
Material: glossy translucent gel. The disc is smooth and glossy in its colour; the pictogram
is a raised drop of milky-white translucent gel, domed, with one bright soft specular at its
upper-left and a faint glow where the disc colour shows through its base. Clean and wet, not
sticky; no bubbles, no outline.
```

### frost — Frost

```
Material: frosted glass. The pictogram is a slab of thick frosted white glass, about a
tenth of the disc's diameter thick, floating a hair above the disc, its edges catching a
soft light and its underside casting a soft contact shadow on the disc. The disc is a matte
puck in its colour. Calm, in the register of visionOS icons; no iridescence, no outline.
```

### satin — Satin

```
Material: brushed satin metal. The pictogram is cast in white-silver satin metal, raised
slightly off the disc, with soft anisotropic highlights running one way and a faint darker
edge where it meets the disc. The disc is a matte puck in its colour. Restrained — no chrome
mirror, no rainbow, no outline.
```

### paper — Paper

```
Material: layered card stock. The disc is a smooth matte card in its colour; the pictogram
is cut from white card and lifted a millimetre above it, casting a soft, slightly warm
shadow onto the disc. Smooth card — no fibre, no texture, no folds, no outline.
```

### pillow — Pillow

```
Material: a soft cushion. The whole disc swells into a puffed pillow in its colour, its
rim rounding down toward the edge, and the pictogram is pressed INTO the cushion as a
soft deboss, read by the shadow along its upper edge and the light along its lower one.
Matte, soft, no gloss, no seams, no outline.
```

## Cut

- **Clay, Gel, Frost, Satin, Paper and Pillow · render** (2026-09-24) — never rendered (Codex
  out of credit), so off the switch on user pin; the briefs above stay for a later run.
