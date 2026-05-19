---
name: DLS 2.0 Feedback bar
description: Two-icon thumbs feedback row under the last banker message. Tap a thumb to vote, a snackbar confirms.
type: reference
originSessionId: 51c31c01-d080-452c-b99a-e82f766f4293
---
Sits under the last banker (assistant) message. Just the icon row.

## Container
- Wrapper: `mt-4` above the row
- Row: `flex items-center gap-4`, entry animation `animate-chat-message-in`

## Icons
| # | Icon | viewBox |
|---|------|---------|
| 1 | Thumbs up   | 0 0 20 20 |
| 2 | Thumbs down | 0 0 20 20 |

- Size: 16x16
- Default (unselected): filled silhouette in `TEXT_TERTIARY` (muted gray)
- Selected: same filled silhouette in `TEXT_PRIMARY` (full contrast)
- Each icon wrapped in a `<button>` with `aria-label` and `aria-pressed` for accessibility

Note: V1 uses a color-only swap, not outline-vs-fill. If outline assets are wanted for the unselected state, the designer needs to supply separate outline SVG paths. Never derive an outline by stroking the filled silhouette (per `feedback_no_asset_substitution.md`).

## Interaction
- **Tap an unselected thumb**: that thumb fills, the other clears, snackbar slides up with the matching persona copy.
- **Tap the currently-selected thumb**: unvote silently. Thumb returns to outline, no snackbar.
- **Switch votes** (e.g. up was on, tap down): old thumb clears, new thumb fills, snackbar fires the new copy.
- **Persistence**: V1 is in-memory only. Vote resets on reload.
- **Per message**: vote state is per-component-instance. Each banker message has its own bar with its own vote.

## Copy
Snackbar is a system acknowledgment, not the persona replying. Same string for both 👍 and 👎.

| Vote | Copy |
|------|------|
| 👍 / 👎 | "Thank you for your feedback!" |

Leading tick icon (20x20, white stroke) precedes the message. Stored as `FEEDBACK_COPY` in the component file. The user is rating the bot, so the bot does not respond, the product does.

## Snackbar
Matches [reference_dls_snackbar.md](reference_dls_snackbar.md) Default (dark) variant. Lives in `Snackbar.tsx`.

- Position: `absolute, bottom: 24px, center` so it anchors to the nearest positioned ancestor (the phone-screen container, in the playground or the real chat screen)
- Width: 328px (caps at container width minus 32px)
- Background: `SLATE_800`, radius 12, padding 16, `ELEVATION_CARD` shadow
- Text: `ALPHA_WHITE_FF`, `typography.bodySmall`
- Auto-dismiss after 3000ms
- Entry: 250ms ease-out slide-up + fade-in. Exit: reverse.
- `role="status"`, `aria-live="polite"` for screen readers
- No icon, no action button in V1
- Ancestor must have `position: relative` and no `overflow: hidden` in the chain (the device frame's inner screen and the chat screen container both qualify).

## Props
- `messageId` (optional): passed through to `onVote` so a parent can later associate the vote with a specific message
- `onVote(vote, messageId)` (optional): fired on every state change including unvote. Default is no-op.

## Out of scope (future)
- localStorage or backend persistence
- Bottom sheet for "what was off?" reasons
- Multi-select reason chips
- Filled fade/scale animation on tap (V1 snaps on)
- Distinct outline SVG assets. V1 strokes the existing silhouette path.

Playground entry: `/playground/components` -> **Feedback bar** (status: exploring).
