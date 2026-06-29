# new user (beta) — checklist

Living checklist for the new-user-beta onboarding + the safe-to-spend money L1.
Shipped = compile + serve verified (tsc 0, route 200); runtime is confirmed by you walking the flow.

## Open: do next

### Major
- [ ] Runtime walk-through of the full flow: connect, skip, auto-save, in light + dark.
- [ ] **Clarify #C** — "make this canonically match the L1 screen style": which screen/element did you mean? (annotation was on `<Home>`, ambiguous.) Holding per the confirm-before-major-change rule.
- [ ] **Live plan snapshot** — the money L1 reads the spending-plan fixture today; wire a real per-path snapshot (connect / skip = slice-only / auto-save / goal-skipped) so the numbers + the tracker ring reflect what the user actually did.

### Mid
- [ ] Tracker ring → track **safe-to-spend remaining** (the real metric) once the snapshot feeds it; ring is goal-progress for now.
- [ ] Review **ponytail** audit findings: apply safe cuts, bring major removals to you first.
- [ ] Byron beat: copy polish on the first-roast + the back-to-Ryan handoff if the timing/words need it after a walk.
- [ ] "ask me" question chips + free-text: give a real (or canned) answer; today they post with no reply.

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
