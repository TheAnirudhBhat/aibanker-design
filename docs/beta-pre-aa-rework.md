# Beta pre-AA rework — belief questions, plain gate, typographic moments

Branch: `beta-pre-aa-rework` · Applies to `/app/new-user-beta` (intent-first path only; new-user-2's
goal-after-explore ordering keeps the classic AA ask). Settled over the Jul 14 design reviews.

## The shape

The stretch between the goal and the AA link is a conversation, not a pitch. Ryan asks how the
user **believes** their money behaves, then answers each belief with their **actual data**. The
third question is the one almost nobody can answer, so the bank look arrives as its solution —
framed as achievability, never as Ryan's limitation. The gate is plain: the move line sells, the
button just works.

**Beats** (worked example: Trip · Goa · ₹50k · 6 months → ₹8,333/mo):

| # | Beat | What happens |
|---|------|--------------|
| 1 | Bridge (P14 fix) | "Those 143 orders are a goal's worth of money. What do you want to save towards?" |
| 2 | Goal quiz | existing beta in-chat picker + sheet (type · destination · timeline · amount) |
| 3 | Echo + T1 | "Goa in January, love it. That's" → **₹8,333** in display type, counts up, "a month" |
| 4 | ≈2× | "Naming it was the smart part. Named plans work about twice as hard. Proven." (reacts to the act of naming) |
| 5 | Q1 | "Three questions, then your plan. First: how much do you actually save a month?" |
| 6 | Q2 | "And where does it usually slip?" |
| 7 | Q3 | "Last one. After rent and the fixed stuff, what's actually left each month?" |
| 8 | The gate | move line → **January** in display type ("on paper") → "RBI rails, nothing touched, revoke whenever." → [Link my bank] [Is this safe?] |
| 9 | Post-link | linked ack names the goal ("every feed that lands sharpens the Goa plan"), Byron roasts in goal currency, playground reveals become **early reads**, resumption pays off "on paper" |

## Copy rules

- No bubble over ~15 words. No em-dashes in product copy. Lowercase slice.
- **No deficit language.** Ryan never says "I can't see." The bank is where good things get
  confirmed and locked (ring-fencing, autopay-on-payday, "January on paper").
- Numbers come from five honest sources only: their inputs' arithmetic, their slice data, the
  cost-of-guessing (planning policy), labeled hypotheticals, and cited third-party research
  (the ≈2× = Karlan et al., Management Science 2016). Never invented stats, never effect sizes
  on the wrong base.
- Safety is **pull-only**: seven words at the gate, the full reply behind "Is this safe?".

## Reaction matrix

Reactions are pure functions of (own answer, goal math, data richness) — no cross-question
dependencies except the Q1 gap. Gap-zero (Q1 = "₹10k or more" ≥ required monthly): Q3's reply
swaps to "On your own numbers, Goa's already covered. One look makes it official."

**Q1 — how much do you actually save?** → feeds gap math
- Basically nothing → "Zero's the cleanest start. Food and transfers alone move ₹26k a month."
- Around ₹5k → "So we need ₹3,333 more. That's [share] of your food spend. Findable." (share is
  computed against the real food fixture, ₹21.4k/mo)
- ₹10k or more → "Then it's already funded, if the money moves. I'll make it automatic."
- Honestly, no clue → "Honest answer. Spending I can see. Saving, we'll pin down in a minute."

**Q2 — where does it slip?** → feeds caps / autopay
- Impulse → "Checks out. Three of your five biggest spend days: Mondays. Caps handle that, soft
  rails, not lectures." (Mondays = the heatmap card's real trait)
- Fixed costs → "We wall those off first. Your goal never fights your rent."
- Forget → "Autopay fixes that. Salary lands, the goal gets fed first."
- Vanishes → "Vanished money leaves a trail. Reading trails is the job."

**Q3 — what's actually left?** → feeds plan shape
- ₹10k, maybe → "If that's right, Goa's comfortable. One look and it's booked."
- Barely anything → "The spending side says there's slack. Let's get the true number."
- Depends → "Then the plan flexes with the months. I just need to see the rhythm."
- No idea → "Almost everyone says that. But the room for Goa is there. Your bank knows it to the rupee."

**Gate states**: Link my bank → posts as user echo → AASim. "Is this safe?" → the pull reply →
Link re-offered. AA sheet dismissed → "No rush. Goa's plan is one look away whenever you're
ready." + Link chip. **Second dismissal: silence** — the chip persists, Ryan never nags.

## Typographic moments (the delight system)

The chat is surface text: no avatars in-stream, no bot bubbles. Delight is type-led — the numbers
worth remembering land as display-type events (`BigNumber`, Rubik `headerH1`, tabular-nums,
count-up ~700ms, static under prefers-reduced-motion): the monthly at the echo, the month name at
the gate, the final monthly at resumption. One moment per beat; nothing animates while the user
reads a question. Character animation was explored and cut (no body to animate on this surface).

## Sparse slice data

The questions need zero data; only reactions degrade. Rich history → data-touch lines. Thin →
input-math only ("₹8,333 is about ₹275 a day") + promise-to-verify ("I'll set them once the
data's in"). Never fabricate a pattern line. Post-link beats run on AA data as it lands, so the
flow gets more robust after the gate. (Sparse variants are specced, not yet wired — see below.)

## What's built vs follow-ups

Built on this branch: fixture copy + the belief run (`goal-echo`, `belief-q` step kinds), the
plain gate replacing LinkAccountsCard on the intent-first path, `BigNumber`, goal-named linked
ack / roast / build-plan CTA, early-read tags + quips in the playground, resumption line,
dismissal recovery with second-dismiss silence.

Follow-ups, in rough order:
1. **Wire the feeds**: Q1 → ladder tier default, Q2 → cap tightness flag + autopay pre-select at
   lock-in, Q3 "depends" → month-pegged plan shape. Answers are already captured in state.
2. **T3 income moment**: "Income just landed" + ₹82,000 BigNumber during the post-connect sync.
3. **dataRichness tiers** gating the sparse reaction variants.
4. Goal chip in the app bar carrying fetch state (merges with audit P5's locked-chip copy).
5. Non-fixed-tenure polish: emergency/save-more get text-only echo today; give them their own
   run variant once the tier beat is rethought.
