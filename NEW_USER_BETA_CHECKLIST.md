# new user (beta) — checklist

Living checklist for the new-user-beta onboarding + the safe-to-spend money L1.
Shipped = compile + serve verified (tsc 0, route 200); runtime is confirmed by you walking the flow.

## Open: do next

### Confirm first (major — holding per your rule)
- [ ] **#1 Money L1 → live budget tracker.** Your model: Σ category budgets = safe-to-spend at month start, spending reduces each category + the hero. That reframes the L1 + turns CategoryBudgetsViz into a spent-vs-cap tracker (today it's "typical → suggested"). Confirm and I build it.
- [ ] **#4 Questionnaire → inline chat cards.** The goal follow-up quiz is a bottom-sheet today; moving it inline is a real restructure of the quiz flow. Confirm the approach.
- [ ] **#C** — "match the L1 screen style": which screen/element? (annotation was bare `<Home>`.)

### Major
- [ ] Runtime walk-through of the full flow: connect, skip, auto-save, light + dark.
- [ ] **Live plan snapshot** — the L1 + tracker amount read the spending-plan fixture; wire a real per-path snapshot (connect / skip = slice-only / auto-save / goal-skipped).

### Mid
- [ ] **#2 Section-header / page spacing** — header reads tall + page rhythm odd; likely the double "This month" + "Category budgets" labels. Tighten on a walk (kept the divider per your earlier ask, so flagging not blind-changing).
- [ ] Remaining ponytail cuts (4 type-prop ones) held — `productLabel` etc. are caller-passed, so each needs a caller edit too. Do on request.
- [ ] Byron beat: copy/timing polish after a walk.
- [ ] "ask me" chips + free-text: give a real/canned answer.

### Consider
- [ ] Progress indicator for the long flow (fenced as structural).
- [ ] Byron on the "just auto-save" path (deliberately skipped today — the simple path).

## Shipped this round (compile + serve verified, not yet walked)
- Byron **orchestrated takeover**: intro → chat cross-fades to Byron's voice (toggle visibly active) → first roast (143-Swiggy, a glimpse) → holds → cross-fades back to Ryan into the explore handoff. Connect + skip. (trace-verifying)
- Byron toggle now reveals up top exactly at the intro beat (was gated on the later playground roast).
- Skip path introduces Byron (skip-aware copy, lands on the beat).
- Safe-to-spend **money L1**: circular ring hero with the amount centred (drains, charges up) → category budgets (from the goal plan) → goals. Page-level hero, DLS tokens.
- Budget pulls from the spending plan, not placeholder constants.
- AmountChooser keypad centred against label + amount; AddToPotCard done-state arrow centred against both.
- Tracker → icon variant (goal avatar), ring wraps it edge-to-edge, no %.
- "Goals" app-bar title removed (hero is the identity).
- Copy tightened flow-wide (judge-panel), Byron terser than Ryan, em-dashes removed.
- CategoryBudgetsViz margins trimmed (card + internal).
- Pay screen matches Enhancements; OTP auto-submits.
