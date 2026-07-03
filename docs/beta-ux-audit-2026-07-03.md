# new-user-beta: end-to-end UX audit (2026-07-03)

How this was made: seven review lenses (narrative arc, interaction cost, money-math comprehension,
copy and voice, trust, edge paths, motion) walked the flow code and copy; every claim below was
checked against the actual build before it made this list. Each point is short: what hurts, what to
do instead. **[your call]** means I need a decision from you; everything else I can just fix.
Motion got the lightest treatment here because it absorbed heavy targeted polish this week.

## 1. The flow at a glance

| # | Beat | What happens | Required taps |
|---|------|--------------|---------------|
| 1 | Wrapped hook | Intro bubbles + 3 flippable spend cards | 0 (flips optional) |
| 2 | Goal ask | Type chips in chat, timeline + amount in sheet | 3 to 4 |
| 3 | AA connect | Benefit tiles + RBI note, Connect / maybe later | 1 + AA sim steps |
| 4 | Byron | Teaser, "Meet Byron" pill, takeover roast, toggle unlocks | 1 |
| 5 | Playground | Spend tiles while accounts sync | 3 (2 reveals gate the CTA) |
| 6 | Footprint walk | 4 receipt sheets, each with Edit / Looks right | 4 |
| 7 | Pace + plan | Tier sheet, crunch loader, cash-flow card | 2 |
| 8 | Budget | Category caps card in chat + Looks good, chat edits | 1 |
| 9 | Verdict + lock-in | Feasibility verdict confirm, then commit | 2 |
| 10 | Fund + unlock | AddToPot, s2s line, key card, key flies to the lock | 3 |

Happy path: roughly 20 bot lines and 24 or so required taps end to end. Six of those taps are some
variant of "Looks right", and five of the six sit in the back half. The front (wrapped, goal, AA) is
fast and earns its asks; the middle sags. That shape drives most of the high findings below.

## 2. Top pain points

**P1. Byron narrates every money beat after the takeover.** HIGH, M. **[your call]**
You chose stay-on-Byron after "Meet Byron" (#205), and the toggle is discoverable. But "Meet Byron"
is mandatory, so 100% of users get the roast persona voicing the bills confirm, the plan reveal
("Here's the receipt. Don't argue with it.") and the autopay commitment, unless they find the toggle.
Roast-tone at the commit-real-money moment is the one place it can cost trust.
Options: (a) keep as is, it's a personality bet; (b) Byron hands back to Ryan just for the funding
and lock-in beats; (c) hand back right after the first roast, Byron stays a toggle.

**P2. The goal ask cannot be skipped, but the flow believes it can.** HIGH, S.
The chips offer trip / emergency / purchase / save-more only. The code comment says "Decide later
skips the goal", and a full no-goal branch exists downstream (BETA_AA_INTRO_NO_GOAL), but no chip
reaches it: the branch is dead and the ask is silently mandatory, right after copy that promises
"you can always change it later". I suspect this is also what your parked note "other options should
also be here" (#240) meant. Fix: add a quiet "Decide later" chip that takes the existing no-goal
path. **[your call only on whether beta should allow a goalless run at all]**

**P3. Chat budget edits can hit the wrong category.** HIGH, S.
"Suggest a change" accepts free text, but an unmatched category name with a number silently edits
Food & dining (the parser falls back to the first category), and input with no number is swallowed
with zero acknowledgment. Wrong-money edits in a money product is the worst demo failure mode.
Fix: match against all category words, fall back to "Everything else" with an ack line, and answer
unparseable input with a nudge like "tell me a category and a number, like food 6k".

**P4. The playground is a hidden toll gate.** MEDIUM, S. **[your call]**
"Build my goal plan" only appears after the user consumes 2 reveals or roasts, a rule they are never
told, and in beta the chips land with no framing line at all. The wait-cover rationale mostly does
not apply (the parse finishes during explore in the happy case), so a goal-committed user makes two
detour taps to proceed. Fix: one salutation line plus the CTA visible from the first chip render.
Your call: is one guaranteed wow-reveal worth protecting before the footprint stretch?

**P5. The locked chip promises the wrong key.** MEDIUM, S.
Tooltip and aria-label say "Connect to unlock it", but connecting happens at beat 3 and the chip
stays locked until the goal is funded, around 20 beats later. A curious user sees a broken promise,
which cheapens the key-flight payoff. Fix: progressive copy. Pre-connect: "Locked for now. It opens
as we go." Post-connect: "Almost. Your first goal earns the key." The payoff line then lands as a
promise kept.

**P6. Four identical footprint confirms, back to back, right after the playground.** MEDIUM, M.
Question, sheet, "Looks right", four times, with the copy itself deprecating half the content
("Light on P2P", "the random stuff"). Two options: **[your call]** (a) merge P2P + one-offs into one
"everything else" receipt (walk drops to 3 beats); (b) keep 4 buckets but give each transition line
a micro-payoff so every confirm buys an insight, e.g. "Obligations are 35% of income. Healthy."
(b) is copy-only and I can do it regardless.

**P7. The climax is three same-shaped lines and two adjacent confirms.** MEDIUM, S.
"Here's the plan." then "Here's the shape of your month." then "Here's where your spending lands
each month. Look right?", with Looks right and Looks good buttons back to back. Fix: cut the
"Here's the plan." bot line in beta (the crunch loader + card intro already do the reveal) and
reframe the budget line to name its distinct job: "Plan's set. Last thing: the caps that make it
work day to day."

**P8. Verdict confirm and lock-in are two rubber stamps in a row.** MEDIUM, S. **[your call]**
The verdict gained its own Looks-good gate (#286) and lock-in follows immediately. Real decisions
happened earlier (tier, caps); these two both mean "proceed". Proposal: fold them, the verdict card
carries the single commit CTA. Say no if you want the verdict to stay a standalone breathing beat.

**P9. "Meet Byron" is a hard gate.** MEDIUM, M. **[your call]**
The pill is the only way forward: no decline, no timeout, and the user is mid-wait to see their own
freshly-connected data. Proposal: a quieter "Maybe later" chip that advances to the playground;
Byron stays re-offerable via the existing "Roast me, Byron" chip, which can run the same takeover on
first fire. Decide: if declined, does the toggle stay hidden until that chip, or unlock silently?

**P10. The funding card never explains its own math.** MEDIUM, M. **[your call, existing #282]**
AddToPot asks for 20% now plus a monthly autopay with no line about why that split exists. This is
your open #282, but it now collides with the tuned unlock choreography (funded line, s2s, key,
flight). Decide: explain in-card with one caption line (cheap, keeps choreography), or convert to a
bottom sheet with a reply affordance (original #282 shape, choreography needs re-sequencing).

**P11. The squeeze is invisible and the budget has two names.** MEDIUM, S.
"Everything else" gets a cap of 19,682 against a usual 21,000 with no acknowledgment that this is
where the plan bites; the card reads self-contradictory to a careful reader. And the plan card
labels the number "Free to spend" while the tracker, hero, s2s line and peek all call it "Monthly
budget": two names for the same rupee figure two beats apart. Fix: rename the row to "Monthly
budget" and add one caption under the caps card: "Caps add up to your 41,682. The squeeze lands on
Transport and Everything else."

**P12. One stat, one gag, three times.** LOW, S.
143 Swiggy orders powers the wrapped reveal, Byron's takeover roast, and the playground roast, with
a fridge/kitchen joke each time. By the third telling Byron reads canned, which is the opposite of
his pitch. Fix: point the takeover roast at a different wrapped stat (the 38K to Aditya, or the
Tuesday pattern) and have the playground roast skip stats already roasted.

**P13. "Goal set." is a stale callback.** LOW, S.
The footprint intro opens with "Goal set." but in beta the goal was banked around 10 beats earlier;
the immediate antecedent is the "Build my goal plan" tap. Fix: bridge from the tap instead: "On it.
First, here's what lands each month. Look right?"

**P14. The goal bridge throws away the insight it just earned.** LOW, S.
"That's your spending. Now the fun part" pivots without converting any wrapped insight into motive,
and implies the wrapped was not fun. Fix: one connective clause using a real stat, e.g. "Those 143
orders are a goal's worth of money. What do you want to save towards?"

**P15. Docked-sheet heights are magic numbers.** LOW, M.
The chat spacer and jump-pill offsets hardcode sheet heights (380 / 260 / 112 and 404 / 336 / 88).
Any content change in a sheet silently breaks scroll clearance. Fix: measure the docked sheet via a
ref and drive both from one value. Already tracked inside the consistency pass (#319).

**P16. Reduced motion is partial.** LOW, S.
Editor cards respect prefers-reduced-motion; the key flight, clip-path morphs and takeover reveal do
not. Cheap blanket fix: transition-none overrides on the big choreographies under the media query.

## 3. Smaller fixes (I will just do these)

- Byron intro skip line has a capital "Slice" (hard brand ban) plus two lowercase sentence starts
  ("your slice spends are plenty...", "and there's someone...").
- Remaining copy-audit rewrites from last week: funded line, re-entry lines, PDP subtitle, goal
  nudge, skip salutation.
- Locked chip aria-label rides along with P5.
- P7 line cut, P11 rename + caption, P12, P13, P14 as scoped above.

## 4. Decisions I need from you

1. **Byron's mic (P1):** keep him narrating post-takeover, hand back for money beats only, or hand
   back right after the first roast?
2. **Goalless run (P2):** should "Decide later" exist in beta? The no-goal branch is already built.
3. **Playground gate (P4):** CTA live immediately, or keep one guaranteed reveal first?
4. **Footprint length (P6):** merge P2P + one-offs into one receipt, or keep 4 with payoff lines?
5. **Verdict + lock-in (P8):** fold into one commit moment, or keep both?
6. **Byron gate (P9):** add "Maybe later"? If declined, toggle hidden until "Roast me" or unlocked
   silently?
7. **AddToPot (P10 / #282):** caption in the card, or full bottom-sheet conversion?
8. **#295 month-tracker storyline:** Edit budget currently dead-ends into the peek; needs your
   storyline direction before I remap the chat flow.
9. **#240:** confirm P2 is what you meant; if yes I close it with the Decide-later chip.
10. **Parked experiments, kill or keep:** #212 skip-path copy bridge (partly covered by P13),
    #214 Byron red-tint background, #215 reveal-as-climax on the peek, #216 cruncher narration,
    #217 thin progress bar (would also soften P6 fatigue), #288 locked progress from the start,
    #211 wrapped tilt variation, #246 ring flicker (likely fixed by this week's shadow work,
    needs a device check).

## 5. What's already working (do not touch)

- The trust ladder: wrapped proof first, goal before AA, benefit tiles + RBI read-only note at the
  connect ask. The ask feels earned.
- The plant-and-payoff spine: locked chip up top from the start, key earned at the end, flight into
  the lock. (P5 fixes the one crack in it.)
- Money math is now a single source: caps sum to the budget, tier and cap edits thread through to
  the tracker, ghost, peek and copy. The numbers agree everywhere.
- The receipt language: footprint sheets, editor morph, category pills, circular checks. Consistent
  and slice-flavoured.
- Recovery paths: chat close is minimize + restore, past messages freeze their persona voice,
  must-answer sheets cannot strand you half-answered.
