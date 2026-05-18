# Flow Directory

Every end-to-end user journey in the app, with entry points, steps, and preview links.

---

## Onboarding

New user's first experience — from app open to home screen.

**Steps:**
1. Month Wrapped (insight story cards)
2. Persona Quiz (swipeable quiz cards)
3. Goal Setting (see below)
4. Budget Handshake (see below)

**Explorations:** V1, V2 (chat-led + AA), V3 (PlanMode + clarifying questions)
- Preview: `/preview?component=Onboarding`
- Persona: `/?persona=new-user`, `/?persona=mid-onboarding`

---

## Account Aggregation (AA)

Bank account linking flow embedded in onboarding V2.

**Steps:**
1. Value proposition screen
2. Learn more (overlay)
3. Bank selection grid
4. OTP verification (4 digits, live countdown, Out-of-attempts error state)
5. Approve consent (with Skip)
6. Consent detail (overlay) — info tooltips on Time period and Data life

**Branch:** No accounts found → Change phone number → Phone entry → re-OTP. Two no-accounts variants: empty (illustration) and with alternate matches.

**Playground variants:** Happy / No accounts / Alternates / Out of attempts (toggle in Account aggregator card).

- Preview: `/playground/flows` → Account aggregator card

---

## Goal Setting

User sets a savings goal with Byron's guidance.

**Steps:**
1. Category choice (Trip / Big purchase / Emergency / Increase savings)
2. Destination (if Trip)
3. Timeline (3m / 6m / 1y)
4. Amount (\u20b950k / \u20b91L / \u20b95L / \u20b910L)
5. Existing savings check
6. Pace selection (Aggressive / Balanced / Relaxed)
7. Plan review card
8. Invest confirmation (RD or Auto-save)

**Entry points:** Onboarding flow, "Set a goal" chip on home, Goal Quiz overlay
- Preview: `/preview?component=PlanMode%20Savings`

---

## Budget Handshake

Post-goal flow where Byron helps set budget guardrails.

**Steps:**
1. Obligations card (confirm fixed payments)
2. Budget digest (AI summary of spending)
3. On-track / Off-track path
4. Budget levers (adjust category caps)
5. Budget style choice (Strict / Chill / Buffer bucket)
6. Big expenses acknowledgement
7. Action confirmation

**Entry point:** Automatically follows Goal Setting in onboarding
- Persona: `/?persona=post-budget`

---

## Steady State (Home)

Ongoing interactions after onboarding is complete.

### Can I Afford...
User asks if a purchase is affordable.
- Steps: Category \u2192 Amount \u2192 Affordability verdict \u2192 Suggestion

### Rate My Spends
Rate recent transactions as worth-it / regret / meh.
- Steps: Transaction list \u2192 Swipe rating \u2192 Insights

### Progress Check
Goal tracking update.
- Steps: Goal progress card \u2192 Status (ahead/behind/on-track) \u2192 Boost options

### Understand My Money
Deep dive into spending patterns.
- Steps: Menu (Patterns / Personality / Benchmarks) \u2192 Drilldown \u2192 Action

### Find Leaks
Spot recurring overspends.
- Steps: Leak insights \u2192 Investigation \u2192 Fix options (cap, alert, cancel)

- Persona: `/?persona=goal-on-track`, `/?persona=goal-behind`

---

## Refresh Session

Returning user catch-up flow.

**Steps:**
1. New Wrapped story (what happened since last visit)
2. Goal progress update
3. Re-engagement prompt

- Preview: `/preview?component=RefreshSession`
- Persona: `/?persona=returning`

---

## Active Explorations

Design variants still being iterated on:

| Exploration | Variants | Preview |
|-------------|----------|---------|
| PlanMode Savings | top, bottom | `/preview?component=PlanMode%20Savings` |
| Visualizations | v1, v2 | `/preview?component=Visualizations` |
| AppEntryPoint | full-sim | `/preview?component=AppEntryPoint` |
| DegenMode | v1 | `/preview?component=DegenMode` |
| Reddit | recording, screenshot | `/preview?component=Reddit` |
| RefreshSession | v1, v2 | `/preview?component=RefreshSession` |
| DrawerExperience | v1 | `/preview?component=DrawerExperience` |
