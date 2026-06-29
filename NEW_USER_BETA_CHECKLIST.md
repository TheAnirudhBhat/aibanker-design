# new user (beta) — checklist

Living checklist for the new-user-beta onboarding + the safe-to-spend money L1.
Shipped = compile + serve verified (tsc 0, route 200); runtime is confirmed by you walking the flow.

## Open: do next

### Major
- [ ] Runtime walk-through: connect, skip, auto-save, light + dark. (now incl. the inline goal quiz + Byron stay-on)
- [ ] **Live plan snapshot** — the L1 + tracker amount read the fixture; wire a real per-path snapshot.

### Mid — Cal AI lessons (from the Mobbin pull)
- [ ] **Reveal-as-climax** — frame the safe-to-spend L1 arrival as the payoff (Cal AI's "your plan is ready" peak): congrats beat, ring charges up, outcome line ("on track for [goal] by [date]"), "edit anytime". Fold into the shared-element transition.
- [ ] **Plan-build cruncher narration** — narrate the personalization ("reading your spends… finding your categories… setting your safe-to-spend") so the plan feels earned, not a spinner.
- [ ] **Onboarding progress affordance** — Cal AI's thin persistent bar is the anti-abandonment tool in a long flow; add a subtle perceived-progress signal.

### Mid — polish
- [ ] **Safe-to-spend explanation** — Ryan explains in chat ("this is your safe-to-spend across your budget categories, given your goal"), then the coachmark points to the tracker.
- [ ] **WrappedCard tilt** — cards tilt at ~the same angle; vary the angles + apply what makes tilted-card stacks read well.
- [ ] **Skip-path copy connection** — after the Byron roast, "No problem, you can link them later…" reads disconnected; bridge it.
- [ ] **Shared-element transition** — tracker ring ↔ L1 hero ring as one component; tap slides the page while the ring grows/scales into the hero (FLIP motion).
- [ ] **#8 Byron-mode red-tint BG** (experiment) — subtle red gradient from the top, in on Byron, out on return.
- [ ] **"remove these"** — bare nested flex in OnboardingSim; what should come out?  ·  **#C** "match the L1 style": which screen?
- [ ] Remaining ponytail cuts (4 type-prop, caller-passed); "ask me" chips real answer.

### Consider
- [ ] Byron on the "just auto-save" path (deliberately skipped today — the simple path).

## Shipped this round (compile + serve verified, not yet walked)
- **Peek-over-chat model (#209)** — tapping the tracker (or the funded-card arrow) in beta opens safe-to-spend as an overlay sliding in OVER the chat; back returns to the chat. Onboarding no longer completes on the tracker tap, so beta never lands on the returning-user home. (Non-beta keeps the old completion.) Two follow-ups: (a) the peek's goals carousel is empty until the goal is committed — wire the in-progress goal into the peek; (b) the overlay JSX is duplicated across the chat + home branches — extract a shared `goalListOverlay`.
- **Byron stays on** after the "Meet Byron" tap — no auto-flip back; the flow continues in his voice until you tap the toggle to return to Ryan.
- **Goal cards smaller** (240×320) + the **add-goal card sits first** in the carousel.
- **#4 — goal follow-up questionnaire is now an inline chat card** (timeline / amount / destination walk through in place, cross-fading) instead of a bottom-sheet. Bottom-sheet kept for the non-beta flow; layout offsets beta-aware.
- **Money L1 is a live budget tracker** — category spend-vs-cap rows whose caps sum to the safe-to-spend hero; spending drains both. AddToPotCard → right chevron + pop entrance.
- **Cal AI onboarding pulled from Mobbin** (34-screen flow) → 3 improvement items queued (reveal-as-climax, cruncher narration, progress affordance).
- Byron **orchestrated takeover**: intro → chat cross-fades to Byron's voice (toggle visibly active) → first roast (143-Swiggy, a glimpse) → holds → continues in Byron's voice. Connect + skip. (trace-verifying)
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
