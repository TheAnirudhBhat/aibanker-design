# new user (beta) — checklist

Living checklist for the new-user-beta onboarding redesign. I keep this current as we iterate.
Everything under "shipped" is compile + serve verified only (no Playwright); runtime is confirmed by you walking the flow.

## Open: do next

### Major
- [ ] Runtime walk-through of the full flow (compile + serve only so far): Connect, Just auto-save, and Skip paths, in light and dark.
- [ ] Push the accumulated beta changes (unpushed since the last push).

### Mid
- [ ] Give the "ask me" question chips + free-text a real answer (or a canned reply); today they post the question with no response.
- [ ] Introduce Byron on the "Just auto-save" path too (Skip path now introduces him; auto-save still jumps past).

### Consider
- [ ] Progress indicator for the long flow: the strongest "feels shorter" lever, currently fenced off as structural.
- [ ] Real social-proof stat for the verdict "why this number" line (kept reasoning-only until we have a verifiable number).
- [ ] Fine-tune the goal-tracker coachmark pointer alignment on-device.

## Shipped this round (compile + serve verified, not yet walked)
- Intent-first flow: goal-type chips to sheet, AA ask (connect / just auto-save / ask me), explore, footprint, plan, verdict, lock-in / fund.
- Goal-live tracker reveal: frosted chip, halo, ring charge, DLS tooltip coachmark; tracker and funded card both route to the goals screen.
- Mobile prototype mode: full-bleed on phones, 3-finger-hold debug sheet, edge-to-edge, no overscroll, keyboard / focus-zoom fix, no fake status bar or dragger.
- Pay screen matches Enhancements (dark mode + action bar); OTP auto-submits, no CTA.
- Wellness-onboarding principles: justify each ask, payoff reasoning, commitment + reassurance copy.
- Feels-shorter: brisker typewriter, tighter copy, momentum checkpoints ("goal set", "money mapped").
- Byron introduced during the sync; ConfirmListCard Edit fixed + subtler card; tall replies anchor to their top.
- Skip path now introduces Byron too (skip-aware copy, lands on the beat then continues; 5-path trace clean).
- Funded card / tracker opens the goals screen directly (no home chat flash behind a slide-in).
- AmountChooser: options grouped directly under the amount, divider moved below them.
- Goal-tracker ring 32 → 40px inside the chip, centred % scaled to match.
