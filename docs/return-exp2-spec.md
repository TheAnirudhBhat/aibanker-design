# return exp2 — the dashboard the conversation builds

A reference for the **return exp2** persona: cosimo as a financial advisor whose
answers become the dashboard. It renders at `/app/return-exp2`, driven by one
self-contained simulator (**ReturnExp2Sim**). The brief (Rajan, 2026-08-14): the
main problem with finances is that people don't know what to ask, so the product
must lead; chat reachable at all points; the chat can change the dashboard; super
modern, minimal, slice.

**Inspiration set** (Mobbin, 2026-08-14): Revolut analytics (big number, avg rule,
month bars, category rows), Rocket Money ("in N days" bills, save-by-cancelling
framing), Origin (popular questions + ask input), YNAB (per-category budget bars).

---

## The idea

The home is a white, minimal **board** of generated cards. The chat is never more
than one tap away (the ask bar never leaves the bottom), and **what you ask edits
the board**:

- Ask "What am I subscribed to?" → a subscriptions card composes in the chat, and
  when the chat closes it **lands on the board**, right under the cashflow hero.
- Tell cosimo "Cap food at ₹8,000" → the budget card everywhere now carries the
  new cap (₹26,500 total, food marked "capped"), and the nudge resolves.

"People don't know what to ask" is solved from three sides:

| Mechanism | Where | What it does |
|---|---|---|
| Follow-up chips | after every answer | each reply ends with 2-3 next questions generated from what was just shown |
| Proactive nudge | on the board | a yellow-dot card when something needs a decision (food moving fast), with the actions right on it |
| Topic shelf | in the chat | Spends · Budget · Goals · Bills — tapping one fans out the questions people actually ask about it |

## Surfaces

- **Board** — chrome (orb + "cosimo" + October pill), greeting ("Morning, Rajan" +
  one-line month read), nudge card while unresolved, then the generated stack.
  Starts with cashflow · budget · goal (the returning user has goals and budgets
  set); grows as the user asks.
- **Dock** — popular-question chips + the "Ask about your money" bar. Chips open
  the chat already asking; the bar opens it blank.
- **Chat** — fullscreen surface (220ms GENTLE rise), thread of user bubbles and
  cosimo answers with inline generated cards, follow-up chips + topic shelf +
  input pinned at the bottom, down-chevron close. Closing settles the
  conversation's new cards into the board with a rise.

## Simplification pass (R1, same day)

Rajan's read: too cluttered. The response: one visual idea per card, few numbers,
as little text as possible, and a DIFFERENT visualization on every card. The board
opens with just cashflow + goal (budget is one question away), the nudge is a
single-line strip (dot · "Food is moving fast" · chevron) that opens the chat
asking, and the dashboard dock is only the ask bar — the question chips live in
the chat.

## Cards (the generated library)

All white, radius 16, calibrated shadow `0 4px 24px rgba(0,0,0,0.08)`, 20 padding,
lead = caption label / H2 value / caption sub:

| Card | Visualization | Source pattern |
|---|---|---|
| Cashflow (hero) | segmented income bar (spent/bills/goals/left) + tiny dot legend | Revolut |
| Spends | 9 month bars against a dashed USUAL rule | Revolut |
| Budget | five category rings, arc = share of cap used, food in orange | YNAB, via exp1's category circles |
| Food | one orange bar + one line | — |
| Bills | the month as a timeline: today tick + a dot per payment | Rocket Money |
| Subscriptions | one stacked bar + names + green save callout | Rocket Money |
| Goal | magenta gradient progress + "65% · ₹6,500 a month · Sep 2027" | Origin |
| Headroom | three sources as sized bars | — |
| Nudge | single-line strip: dot · title · chevron | exp1's alert, one line |

## The engine

`REPLIES` maps each question to `{ text, cards, followups }`; typed input routes by
keyword (food, bills, subs, trip, save, budget, spends, balance, cashflow) and the
fallback admits what it can't answer, re-offering the popular three. `Cap food at
₹8,000` carries `caps: true` → `foodCap` state flips to 8,000, the nudge resolves,
and Budget/Food cards render from that state on both surfaces.

## World model

The same audited October 2026 as exp1 — every number closes:
income ₹50,000 = spent ₹14,300 + goals ₹6,500 + upcoming ₹14,000 + left ₹15,200;
category spends sum to ₹14,300 and caps to ₹29,500; balance ₹29,200; trip
₹1,30,000 of ₹2,00,000 (65%); subs ₹1,447/mo. Trip projection: ₹70,000 to go at
₹6,500 a month from 1 Nov is 11 instalments (Sep 2027); at ₹11,500 it's 7 (May
2027). Once food is capped the canned budget and food answers switch to the capped
numbers (₹12,200 of ₹26,500).
