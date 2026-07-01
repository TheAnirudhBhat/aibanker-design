# Beta onboarding — meeting feedback (2026-07-01)

Batch of 14 feedback items on `/app/new-user-beta`, captured from a review meeting. Each item: **the ask → interpretation/context → solution + status.** Files referenced live under `app/preview/` (OnboardingSim, WrappedStory, WrappedCard, fixtures) and `app/components/` (LinkAccountsCard, CategoryBudgetsViz, ChatCards, PersonaToggle, TrustNote).

Status legend: ✅ done · 🔨 in progress · ⏳ planned · ❓ needs a call.

---

## 1. Wrapped guess — wrong answer should look "more wrong"
- **Context:** `WrappedStory.tsx` `GuessQuestionScreen`. A wrong guess isn't visually punchy enough.
- **Solution:** strengthen the wrong-answer state — red fill/border + a clear cross, distinct from the muted "not chosen" options. ⏳

## 2. Wrapped cards — stack them
- **Context:** `WrappedCard.tsx` renders the 3 beats in a horizontal flex row that overflows.
- **Solution:** stack the cards vertically (or a stacked-deck), so they don't overflow the chat width. ⏳

## 3. LinkAccountsCard — say what connecting DOES + what we WON'T do
- **Ask:** "connecting all your accounts = X% more accuracy" + "what we won't do".
- **Tension:** earlier the user rejected an invented "+10%" stat, and we moved to the honest "what I can see" coverage donut. Re-introducing a hard "X% accuracy" number cuts against that.
- **Solution (proposed):** keep the coverage donut; add a value line framed as a *benefit* ("a plan built on your whole picture, not a slice") + the "what we won't do" (already have the read-only TrustNote). Avoid fabricating a hard %. ❓ (confirm whether the user wants a literal % anyway.)

## 4. "Meet Byron" — better takeover animation
- **Context:** tap "Meet Byron" → user bubble → `crossFade` (content fade-out → voice switch → stepIndex jump → fade-in) → roast (`OnboardingSim.tsx` ~1760).
- **Solution:** orchestrate the takeover — stagger the fade, sync the app-bar avatar/voice swap, maybe a brief "handing over" beat. ⏳

## 5. PersonaToggle — users don't get how to go back (to Ryan)
- **Context:** `PersonaToggle` in the chat app bar; appears after the Meet-Byron tap.
- **Solution:** clearer affordance — labelled Ryan/Byron segments + a one-time hint/coachmark ("tap to switch back") the first time Byron takes over. ⏳

## 6. "Tweak budgets" — should post a response in chat
- **Context:** budget-confirm step (`OnboardingSim.tsx` ~2496); tapping "Tweak budgets" reveals the editable rows in place, with no user bubble.
- **Solution:** on tap, post a "Tweak budgets" user bubble (like other chat responses), then reveal the editor. ⏳

## 7. AddToPotCard — "pay more now" vs a different autopay
- **Ask:** support a scenario: add a larger amount right now (one-time) AND set a different, smaller recurring autopay.
- **Context:** `ChatCards.tsx` AddToPotCard chips variant currently has a single amount → "Start autopay".
- **Solution:** split into two amounts — an "add now" one-time and a "monthly autopay" recurring. Substantial; needs a two-field funding UI. ⏳

## 8. AddToPotCard "Change" (Paying from) — always savings
- **Context:** the small "Change" text CTA I added beside "Paying from savings".
- **Solution:** remove it (source is fixed = savings; the CTA implies a choice that doesn't exist). ✅ (see below)

## 9/10/11. CategoryBudgetsViz — spend RANGE → suggested budget
- **Ask:** sub-line should show a spend **range** (not a single "typical spend"), and the RIGHT value should be the **suggested budget** (the cap), not the delta.
- **Context:** `CategoryBudgetsViz.tsx` CategoryRow: sub-line `₹currentSpend → ₹cap`, right = delta. `CategoryBudget` has `currentSpend` + `cap` (no range yet).
- **Solution:** show `₹low–₹high` spend range in the sub-line (derive a band around currentSpend, or add min/max to the fixture) and move the **cap** to the right as the suggested budget; drop the delta as the right value. ⏳

## 12. Playground explore chips — don't reappear once tapped
- **Context:** `OnboardingSim.tsx` playground; `chipsConsumed` exists, but the post-nudge chip block re-renders `PLAYGROUND_CHIPS` without filtering consumed ones.
- **Solution:** filter `chipsConsumed` in every chip render (incl. the post-nudge block) so a tapped chip never returns. ⏳

## 13. TrustNote at the wrapped reveal — "not working here"
- **Context:** the privacy TrustNote I added below the WrappedCard in the wrapped step.
- **Solution:** the wrapped card is a horizontal/overflow layout, so a full-width note under it reads oddly. Reposition or remove it there (privacy reassurance can move to a cleaner spot). ⏳

## 14. ConfirmListCard editor — still needs improvement
- **Context:** the `animate-editor-in` full-page editor (income/obligations edit) in `ChatCards.tsx`. Feedback is non-specific.
- **Solution:** inspect + polish (header, spacing, inputs, save/cancel affordance). ❓ (identify concrete issues first.)

---

---

## Progress log

**Shipped 2026-07-01:**
- ✅ #8 — removed AddToPotCard "Change" CTA (`3888acf`)
- ✅ #13 — removed the wrapped TrustNote (`3888acf`)
- ✅ #12 — post-nudge chips filter `chipsConsumed` (`3888acf`)
- ✅ #9/10/11 — CategoryBudgetsViz "spend range → suggested budget" (`3888acf`)
- ✅ #1 — wrong guess answer reads clearly wrong (red fill + red cross) (`5501d70`)
- ✅ #6 — "Tweak budgets" posts a user chat bubble before the editor (`5501d70`)

**Still open (bigger / decision):**
- ⏳ #2 stack wrapped cards · ⏳ #4 Meet-Byron animation · ⏳ #5 PersonaToggle back affordance · ⏳ #7 pay-more-now vs autopay (substantial) · ❓ #3 accuracy-% framing (tension) · ❓ #14 ConfirmListCard editor (identify specifics)

---

### Cross-cutting notes
- Reassurance system (from the prior trust pass): reusable `TrustNote` (lock + one line) at the scary moments — link accounts (read-only, RBI Account Aggregator), autopay (money stays yours), and the budget-confirm ("guides, not limits").
- Honest-data principle: no invented stats (why #3 is flagged).
