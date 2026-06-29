# new user (beta) — checklist

Living checklist for the new-user-beta onboarding + the safe-to-spend money L1.
Shipped = compile + serve verified (tsc 0, route 200); runtime is confirmed by you walking the flow.

## Open: do next

### Confirm first (major — holding per your rule; pick and I build)
- [ ] **Budget reframe** (now directed): header → "Category budgets", remove the typical→suggested viz, show **total budget + current usage** as a live spent-vs-cap tracker (Σ category budgets = safe-to-spend at month start, spending drains each + the hero). Proposed build: total budget + used summary + per-category usage bars.
- [ ] **Shared-element transition**: tracker ring and the L1 hero ring as one shared component — tapping the chip slides the page while the ring stays, grows, and scales into the hero. A FLIP/shared-element motion; focused build.
- [ ] **Back-from-safe-to-spend → home bug**: right fix is to open the safe-to-spend screen as a peek OVER the chat (back → chat), NOT complete onboarding. Re-architects the tracker-tap (currently completes + opens at rest). Confirm the peek model.
- [ ] **#4 Questionnaire → inline chat cards** (bottom-sheet → inline; quiz-flow restructure).
- [ ] **"remove these"** — annotation was a bare nested flex in OnboardingSim; what should come out?
- [ ] **#C** — "match the L1 screen style": which screen/element? (bare `<Home>`.)

### Major
- [ ] Runtime walk-through: connect, skip, auto-save, light + dark.
- [ ] **Live plan snapshot** — the L1 + tracker amount read the fixture; wire a real per-path snapshot.

### Mid
- [ ] **#8 Byron-mode red-tint BG** (experiment) — subtle red gradient from the top, fades in on switch to Byron, out on return. Queued.
- [ ] **#2 Section-header / page spacing** — header reads tall + odd rhythm (likely the double "This month" + viz label). Folds into the budget reframe.
- [ ] Remaining ponytail cuts (4 type-prop ones; caller-passed, need caller edits).
- [ ] "ask me" chips + free-text: real/canned answer.

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
