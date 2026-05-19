# What changed since the evening push: 2026-05-19 night

A single long working session — the onboarding flow was rewired end-to-end, the verbose-plan prose bubble was replaced with the GBP spending plan + lock-in chips, and a stack of layout/interaction bugs got tracked down along the way. Everything in here is on top of `cd280e1 Add evening changelog: 2026-05-19 evening push`.

## TL;DR

The big one: the onboarding sim no longer dumps the user back to the pay screen the moment the verbose plan finishes streaming. The whole post-quiz half of the flow was replaced with the GBP fixture's footprint walk + ladder pick + spending plan + verdict + lock-in chips, rendered inline in the chat. `onComplete` now only fires when the user taps the close X *after* the plan is locked, with a Ryan/Byron confirmation line in between. Snackbars portal into a screen-scoped slot instead of position-absoluting themselves inside a scroll container. A pile of smaller paper cuts — emoji icons, mid-air toast positioning, chip leaks behind overlays, the cruncher cycle being painfully slow, the OTP autoFocus glitching the slide transition — all cleared.

---

## 1. Onboarding flow: full restructure

**Before**: AA → Wrapped → playground → quiz → clarifying questions → obligations widget → plan cruncher → verbose prose plan → ready bot bubble + post-plan chips ("Go ahead, set it up" / "Let me think about it") + input bar. Tapping either chip — or the auto-fire on `ready` — called `onComplete()` which dumped the user to the pay screen immediately.

**After** ([OnboardingSim.tsx:163-220](app/preview/OnboardingSim.tsx:163)):

```
Phase 1: PRE_WRAPPED_BUBBLES → wrapped → POST_WRAPPED_PRE_AA_BUBBLES
Phase 2: aa-chips → AA flow → AA_LINKED_BUBBLE
Phase 3: PLAYGROUND_INTRO_BUBBLES → playground (3 reveals + Roast me)
Phase 4: preferences (goal quiz overlay)
Phase 5: intro-bot → 4 × (footprint-bucket card + transition-bot)
Phase 6: intro-bot → ladder-pick (savings tier overlay)
Phase 7: intro-bot → plan-crunching
Phase 8: "Here's the plan" bot → spending-plan → verdict → lock-in
```

### Step `kind` union changes

Added: `footprint-bucket` (with `bucketIndex`), `ladder-pick`, `spending-plan`, `verdict`, `lock-in`.

Removed: `mosaic`, `obligations-widget`, `clarify-chips`, `ready`, `input-bar`.

The pause-point mechanic (user had to exit + re-enter during mosaic for `ryanReady` to flip) is retired. The new flow is linear — `ryanReady` now flips on first chat open via the effect at [OnboardingSim.tsx:562](app/preview/OnboardingSim.tsx:562). `PAUSE_STEP_INDEX` / `POST_PAUSE_STEP_INDEX` are kept as `-1` sentinels so the bot auto-advance guard and snap-scroll refs don't blow up.

### Render branches added

- **`footprint-bucket`**: renders a `confirm-list` ChatCard for bucket 0..3 of `BUCKET_CONFIRM_LIST` (Income, Obligations, P2P, One-off items). `defaultAllSelected` + `onSubmit` → confirms the bucket and advances. `userBubbleRef` is *always* attached, not gated on `isLast` — see snap-scroll fix below.
- **`ladder-pick`**: when `ladderTier` is null, renders nothing inline (the overlay handles the pick). After the user picks, renders their selection as a user bubble.
- **`spending-plan`**: renders `budget-summary` + `category-budgets` ChatCards from `SPENDING_PLAN_FIXTURE`. Auto-advances 2.2s later via the effect at [OnboardingSim.tsx:572](app/preview/OnboardingSim.tsx:572).
- **`verdict`**: renders a single Ryan/Byron line ("This works. ₹12k a month and the trip is on the calendar." / "Math checks out. ₹12k/month and you actually get there."). `onDone` advances to `lock-in`.
- **`lock-in`**: renders `LOCK_IN_CHIPS` ("Lock it in" / "Tweak something") when `lockInChoice` is null. After the user picks, renders their selection as a user bubble + a follow-up Ryan/Byron line. See section 2.

### Render branches removed

Gone: `clarify-chips`, `obligations-widget`, `mosaic`, `ready` (the old FeedbackBar terminator), `input-bar` (the old verbose-plan footer). The `bot(VERBOSE_PLAN_TEXT)` step is gone too — its replacement is the structured spending-plan card + verdict + lock-in chain.

### State diff

Added: `footprintConfirmed: Set<number>`, `ladderTier: LadderTier | null`, `ladderQuizOpen: boolean`, `lockInChoice: "lock" | "tweak" | null`, `tweakDraft: string`, `tweakSubmitted: boolean`, `planLocked` (derived).

Removed: `obligationsSubmitted`, `clarifyPicked`, `planReplyDraft`. The `closeOverlay` reset sweep was updated to include the new state and drop the deleted state.

### Imports

`gbpFlowFixture` is now the source of truth for the footprint + plan + lock-in inputs:

```ts
import {
  BUCKET_CONFIRM_LIST,
  LOCK_IN_CHIPS,
  SPENDING_PLAN_FIXTURE,
} from "./fixtures/gbpFlowFixture";
import { SAVINGS_TIER_QUESTION } from "./fixtures/savingsTierQuestion";
import type { LadderTier } from "../lib/types";
```

Trimmed from `wrappedFixture`: `CLARIFYING_QUESTIONS`, `VERBOSE_PLAN_TEXT`, `REENTRY_BUBBLE`, `ONBOARDING_OBLIGATIONS`, `OBLIGATIONS_INTRO`, `POST_PLAN_CHIPS`.

---

## 2. Lock-in: no more abrupt unmount

**Before**: chip tap → `handlePlanConfirmed` → `onComplete()` → parent persona page mutated `onboardingComplete: true` → `OnboardingSim` unmounted mid-screen → pay screen popped in. Felt like the app died.

**After**:

- Chip tap sets `lockInChoice` (no `onComplete` yet).
- "Lock it in" → user bubble + Ryan/Byron streams the confirmation: "Locked in. Trip to Japan pot is live. I'll keep tabs and check in if anything drifts." (Byron variant: "Locked. Trip to Japan pot is live. I'll keep eyes on it and yell when you wobble.")
- "Tweak something" → user bubble + Ryan/Byron streams a prompt: "Tell me what feels off and I'll rework it." (Byron: "Sure. What needs changing?") + the bottom chrome swaps to a real `TypeBox` so the user can type. Submit → user bubble with their text + Ryan/Byron acknowledgment + the plan is locked.
- `planLocked` is the derived signal (`lockInChoice === "lock" || tweakSubmitted`).
- `closeOverlay` fires `onComplete?.()` *after* the 460ms slide-down completes if `planLocked` is true. The parent persona page then takes over (`onboardingComplete: true, currentStep: "home", goalStage: "pinned"`, goal data set).

Net behaviour: the chat sits there with the confirmation line until the user taps X to close. The slide-down animates, *then* the home view shows. No more snap-cut.

---

## 3. Goal quiz + ladder pick: shared overlay variant

The goal quiz already used `QuestionnaireOverlay`. The ladder pick was originally implemented as inline pill chips — replaced with the same overlay variant so the pattern is consistent ([OnboardingSim.tsx:1470-1495](app/preview/OnboardingSim.tsx:1470)).

`SAVINGS_TIER_QUESTION` (from `app/preview/fixtures/savingsTierQuestion.ts`) is the existing fixture that maps `LADDER_OPTIONS` into the rich `QuestionOption` shape (title = `₹{amount}/mo`, subtext = description, tag = intent-coded label). The ladder overlay auto-mounts when `STEPS[stepIndex].kind === "ladder-pick"` via an effect at [OnboardingSim.tsx:683](app/preview/OnboardingSim.tsx:683), with a 400ms delay (same as the goal quiz). On select, it sets `ladderTier`, closes the overlay, bumps `userActionCount` (for snap-scroll), and advances the step.

---

## 4. Footprint walk: between-bucket Ryan/Byron lines

Stacking four `confirm-list` cards back-to-back felt like a form, not a conversation. Added a transition bot bubble between every bucket:

| Between | Ryan | Byron |
|---|---|---|
| (intro) | "Got it. Let me walk you through your money so we're on the same page before I build the plan. First, what's coming in." | "Cool. Quick tour of your money before I commit you to anything. Starting with what shows up." |
| Income → Obligations | "Income's steady. Now let's look at what's already spoken for each month." | "Income confirmed. Now the bills you can't argue with." |
| Obligations → P2P | "That's the fixed stuff. Now the money that moves between you and people you know." | "Obligations done. Now the friend tax." |
| P2P → One-offs | "Light P2P. Finally, the one-off stuff — refunds, repairs, surprise medical bills." | "Hardly any P2P. Last bucket: the random one-offs that mess up averages." |

The fourth bucket's label was renamed from **"Others"** → **"One-off items"** ([gbpFlowFixture.ts:122](app/preview/fixtures/gbpFlowFixture.ts:122)) — the items in it are a tax refund, a doctor visit, and a laptop repair. "Others" was a placeholder.

---

## 5. Plan cruncher: from ~10s to ~3.5s

`IDLE_CRUNCHER_TEXTS` was 6 statuses cycling at 1400ms each + a 1500ms tail = ~10s of waiting. People assumed the flow had died.

Trimmed to 3 statuses ([wrappedFixture.ts:305](app/preview/fixtures/wrappedFixture.ts:305)):

```
Comparing savings instruments
Optimising monthly allocation
Building your plan
```

Interval tightened to 900ms with an 800ms tail ([OnboardingSim.tsx:585, 594](app/preview/OnboardingSim.tsx:585)). Total ~3.5s. Still feels like work happened, doesn't feel like an infinite loop.

---

## 6. Playground tightening

### Reveal pacing
When a spend reveal lands (e.g. "What my spending says about me"), the card + traits used to appear together with Ryan/Byron's quip streaming below. Felt like a dump. Added `revealQuipReady` state + a 1.5s hold timer at [OnboardingSim.tsx:765](app/preview/OnboardingSim.tsx:765). The card lands first, the user has time to read it, *then* the quip streams.

### Roast cap
`MAX_BYRON_ROASTS = 2` ([OnboardingSim.tsx:236](app/preview/OnboardingSim.tsx:236)). After the second roast, the chip retires — both from the persistent chip set and from the post-nudge chip pair. The user is left with only "Yes, set up a goal" so the implicit push toward the goal-setting CTA is doing the work.

### Byron's cap nudge
The second roast used to leave the user staring at a roast punchline with an orphan "Yes, set up a goal" chip below. Added a follow-up Byron line that fires 800ms after the capping roast completes:

> "Alright, you've heard the worst of it. Want to actually do something about it? Set a goal."

Lives at `PLAYGROUND_BYRON_CAP_NUDGE` ([wrappedFixture.ts:233](app/preview/fixtures/wrappedFixture.ts:233)) and renders as a new `byron-cap-nudge` event kind in the playground events list. The chip below now reads as the answer to a question, not orphaned.

### Roast input data
`PLAYGROUND_ROAST_INPUT` no longer carries `categoryBudgets`. At this stage the user hasn't set any caps, so the over-cap branch was firing a roast referencing a cap that didn't exist ("Your Food & dining cap was decorative apparently. ₹6k past it."). Now the roast falls to the food-heavy branch (143 orders, ₹42k) which only uses observation data we actually have.

### Spend traits rewired to the heatmap
The "What my spending says about me" card had a spending-heatmap viz with three trait observations underneath. Two of the three didn't live in the heatmap's data domain (late-night spender = time-of-day, generous-with-friends = transfer ledger). Replaced with three observations derivable from the same calendar data ([wrappedFixture.ts:188](app/preview/fixtures/wrappedFixture.ts:188)):

- **Monday spender** — ₹30K of your month lands on Mondays — 3× any other weekday.
- **Sunday creeps up** — Second-biggest day of the week. ₹22K across four Sundays.
- **Tuesday reset** — Your quietest day. ₹1,100 daily average after the Monday peak.

Quip updated to match ("You spend like someone whose week peaks on Monday and resets by Tuesday..." / "Monday goes hard, Tuesday goes broke, Sunday undoes the rest. Your week has a personality.").

### No more emojis on trait rows
The trait list rendered `🌙 / 📅 / 🎁` as 22px characters. Replaced with the `placeholder-valentino.svg` icon ([OnboardingSim.tsx:234](app/preview/OnboardingSim.tsx:234)).

### "Yes, set up a goal" button styling
Was `backgroundColor: TEXT_PRIMARY` (black). Switched to the standard grey chip style for consistency until there's a deliberate hierarchy decision ([OnboardingSim.tsx:1199](app/preview/OnboardingSim.tsx:1199)).

---

## 7. Snackbar portal: no more mid-air toast

The snackbar inside `FeedbackBar` was rendered with `position: absolute; bottom: 16px` inside the chat scroll container. Two problems:

1. With scroll content > viewport, the snackbar was 16px from the bottom of the *scrollable content*, not the viewport — so it floated mid-screen and scrolled with content.
2. Every caller had to compute a `bottomOffset` to clear whatever bottom chrome was present (input bar, button group, footer). Always wrong somewhere.

### New: `SnackbarSlot` portal pattern
New file: [app/components/SnackbarSlot.tsx](app/components/SnackbarSlot.tsx). Exports:

- `SnackbarSlotProvider` — wraps a screen, exposes a portal target via React Context.
- `SnackbarSlotTarget` — the actual `<div>` that snackbars portal into. Render it as a flex item in the screen's bottom chrome stack.
- `useSnackbarSlot()` — returns the slot element (or `null`).

`SnackbarHost` ([components/SnackbarHost.tsx](app/components/SnackbarHost.tsx)) now portals into the slot when one is in scope. If no slot is provided, it falls back to the legacy absolute-positioned behaviour so any caller that hasn't migrated still works.

### Wired up in
- **`Chat.tsx`** — the root is wrapped in `<SnackbarSlotProvider>`. The bottom chrome (`<div className="absolute bottom-0 ... flex flex-col">`) now has `<SnackbarSlotTarget />` as its first child, so the snackbar naturally sits above the input bar / questionnaire overlay / gesture nav.
- **`OnboardingSim.tsx`** — same treatment for the chat overlay. The entire bottom chrome stack (questionnaire ↔ input bar ↔ gesture nav) was consolidated into a single flex column with the slot at the top. No more competing `absolute bottom-0` siblings stepping on each other.

### Side effect: bottom chrome refactor in OnboardingSim
The questionnaire overlay, input bar, and gesture nav used to be three separate `<div className="absolute bottom-0">` siblings. Replaced with one flex column that conditionally renders the right child based on state (prefQuizOpen / ladderQuizOpen / lockInChoice=tweak / default gesture nav). This is what makes the snackbar slot position correctly — the slot is a flex sibling, not a fixed offset.

---

## 8. UI polish round

### FeaturePDP disclaimer one-liner
"This beta may contain bugs or unfinished features." was wrapping to two lines next to the placeholder icon. Removed the `width: 312` constraint, added `whiteSpace: "nowrap"` to the span, and added `flexShrink: 0` to the icon ([FeaturePDP.tsx:87](app/components/FeaturePDP.tsx:87)).

### WrappedStory: hide share icon on question screens
The share icon was always visible in the top-right of the story header — even on guess-q screens where there's nothing meaningful to share. Now hidden when `currentScreen.kind === "guess-q"` ([WrappedStory.tsx:605](app/preview/WrappedStory.tsx:605)).

### OTP autoFocus → preventScroll focus
The OTP screen's slide-in transition felt glitchy. Cause: the `<input autoFocus>` fired during the slide, triggering the browser's `scrollIntoView` on a focused element inside a transformed container. Replaced with a manual `useEffect` that calls `inputRef.current?.focus({ preventScroll: true })` after a 320ms delay (slide is 300ms) ([OtpInput.tsx:36](app/components/OtpInput.tsx:36)).

### QuestionnaireOverlay header: stable arrow positions
The back arrow and forward arrow were conditionally rendered only when navigation was possible. The "x of y" indicator would shift right and left as the user progressed. Both arrow slots are now always rendered when `showPagination` is true, using `opacity: 0` + `pointer-events: none` when inactive ([QuestionnaireOverlay.tsx:127](app/components/QuestionnaireOverlay.tsx:127)).

### PayScreen pill row gap
The gap between the first two pills ("Meet Ryan", "5 new sparks") looked tighter than between the rest. Bumped `gap` from `SPACE_S` (12px) to `SPACE_M` (16px) for uniform breathing room ([PayScreen.tsx:68](app/components/PayScreen.tsx:68)).

### Plan-crunching layout bounce fix
When the cruncher card appeared, the spacer at the top of the chat content grew from 108→180px over 300ms. The auto-scroll-to-bottom fired during that same window, fighting the spacer growth — a visible "bounce down then up" effect.

Fix ([OnboardingSim.tsx:886](app/preview/OnboardingSim.tsx:886)):
- Drop the `transition: "height 300ms ease"` on the spacer (it grows instantly now).
- Add a `useLayoutEffect` that bumps `scrollRef.scrollTop` by the delta in the same paint. Net: the existing chat content stays visually anchored while the spacer grows underneath.

### JumpToRecentPill: no more phantom triggers
The pill was lighting up when the user was already at the bottom of the chat. Cause: `snapScrollTo` inflates `content.style.minHeight` so the snap target can be positioned high in the viewport. That inflated `scrollHeight` past `scrollTop + clientHeight`, so the existing `hasContentBelow` check flipped to true.

Fixed by measuring the bottom of the last *real* content child instead of `scrollHeight` ([OnboardingSim.tsx:518](app/preview/OnboardingSim.tsx:518)).

### Snap-scroll target survives `advanceStep`
On `footprint-bucket` and `ladder-pick` and `lock-in`, the `userBubbleRef` used to be gated on `isLast`. The flow goes: user taps chip → `setUserActionCount` (scheduled snap-scroll with 300ms delay) → `advanceStep` → the step is no longer last → React's ref callback fires with null → by the time the snap-scroll runs, `userBubbleRef.current` is null and it bails.

All three steps now attach `userBubbleRef` unconditionally. With multiple steps potentially attaching the same ref, React assigns it to whichever rendered last in document order — which is exactly the most recent user action. The snap-scroll now reliably lands the user's signed action just below the chrome.

### Bottom spacer accounts for `ladderQuizOpen`
The chat content had a bottom spacer that grew to 260px when the goal quiz was open (so the user could scroll the last bot bubble above the overlay). Extended to also fire on `ladderQuizOpen` so the bot text introducing the ladder pick has room to clear the overlay ([OnboardingSim.tsx:1320](app/preview/OnboardingSim.tsx:1320)).

### JumpToRecentPill bottom dodge
Same overlay logic applied to the pill's `bottom` prop ([OnboardingSim.tsx:1412](app/preview/OnboardingSim.tsx:1412)).

---

## 9. Cleanup

- The `closeOverlay` reset sweep referenced `setClarifyPicked` for state that was deleted. Replaced with resets for the new state (`footprintConfirmed`, `ladderTier`, `ladderQuizOpen`, `lockInChoice`, `tweakDraft`, `tweakSubmitted`) and removed the dead reference ([OnboardingSim.tsx:454](app/preview/OnboardingSim.tsx:454)).
- Removed unused imports from `wrappedFixture` (CLARIFYING_QUESTIONS, VERBOSE_PLAN_TEXT, REENTRY_BUBBLE, ONBOARDING_OBLIGATIONS, OBLIGATIONS_INTRO, POST_PLAN_CHIPS).
- `JumpToRecentPill bottom={...}` no longer references the deleted `input-bar` / `ready` step kinds.

---

## 10. Known follow-ups

- **Goal pill on the pay-screen app bar + carousel on tap**: per the design intent, after `onboardingComplete: true` the home view should sprout a goal pill (top-right of the app bar) that opens a carousel showing the Trip to Japan card + the budget that was just set. The persona page already passes `goalSnapshot` into the Chat overlay, but the pay-screen app bar itself doesn't render anything goal-related yet. Not built in this pass.
- **Pot vs Pool inference**: the goal quiz answer ("A trip" / "Emergency fund" / "Big purchase" / "Just save more") implicitly chooses Pot (concrete) vs Pool (open-ended). The parent persona page currently hardcodes a Pot regardless. The inference logic needs to be wired into the `onComplete` callback so "Just save more" lands the user on a Pool, not a Pot.
- **Container naming in the lock-in copy**: Ryan/Byron's confirmation says "Trip to Japan pot is live." Once Pot vs Pool inference is wired, the copy should swap to "pool" appropriately.

---

## Touched files

- `app/preview/OnboardingSim.tsx` — major restructure
- `app/preview/fixtures/wrappedFixture.ts` — copy edits, IDLE_CRUNCHER_TEXTS trim, PLAYGROUND_BYRON_CAP_NUDGE added, roast input pruned, spending-says traits rewired, trait emojis removed
- `app/preview/fixtures/gbpFlowFixture.ts` — "Others" → "One-off items"
- `app/preview/WrappedStory.tsx` — share icon hidden on question screens
- `app/preview/_shared/status-generated.ts` — regenerated
- `app/components/OnboardingSim` related imports
- `app/components/Chat.tsx` — wrapped in SnackbarSlotProvider, bottom chrome converted to flex column with snackbar slot
- `app/components/SnackbarHost.tsx` — portals into slot when available, legacy fallback preserved
- `app/components/SnackbarSlot.tsx` — new file: provider, target, hook
- `app/components/FeaturePDP.tsx` — disclaimer one-liner
- `app/components/OtpInput.tsx` — preventScroll focus
- `app/components/PayScreen.tsx` — pill row gap
- `app/components/QuestionnaireOverlay.tsx` — pagination arrow slots fixed
