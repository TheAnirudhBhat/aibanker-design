# new user (beta) — checklist

Living checklist for the new-user-beta onboarding + the safe-to-spend money L1.
Shipped = compile + serve verified (tsc 0, route 200); runtime is confirmed by you walking the flow.

## Open: do next

### Confirmed — do next
- [ ] **#4 Questionnaire → inline chat cards** (CONFIRMED) — goal follow-up quiz off the bottom-sheet, into inline chat cards. Quiz-flow restructure.
- [ ] **Returning-user-state bug** ("this state is fucked, comes back again and again") — beta keeps landing in the returning-user view after the goal is set. Disconnect the returning-user state from beta + fix the post-onboarding routing. Ties to the back-from-safe-to-spend → home bug → the **peek-over-chat model** (tracker opens safe-to-spend OVER the chat, back → chat, onboarding only completes at the real end). Architectural; investigating.

### Major
- [ ] Runtime walk-through: connect, skip, auto-save, light + dark.
- [ ] **Live plan snapshot** — the L1 + tracker amount read the fixture; wire a real per-path snapshot.

### Mid
- [ ] **Safe-to-spend explanation** — Ryan explains in chat ("this is your safe-to-spend across your budget categories, given your goal"), then the coachmark points to the tracker.
- [ ] **WrappedCard tilt** — cards tilt at ~the same angle; vary the angles + apply what makes tilted-card stacks read well.
- [ ] **Skip-path copy connection** — after the Byron roast, "No problem, you can link them later…" reads disconnected; bridge it.
- [ ] **Shared-element transition** — tracker ring ↔ L1 hero ring as one component; tap slides the page while the ring grows/scales into the hero (FLIP motion).
- [ ] **#8 Byron-mode red-tint BG** (experiment) — subtle red gradient from the top, in on Byron, out on return.
- [ ] **"remove these"** — bare nested flex in OnboardingSim; what should come out?  ·  **#C** "match the L1 style": which screen?
- [ ] Remaining ponytail cuts (4 type-prop, caller-passed); "ask me" chips real answer.

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
