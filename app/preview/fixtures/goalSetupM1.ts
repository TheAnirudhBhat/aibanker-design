// ══════════════════════════════════════════════════════════════════
//  Goal setup, Milestone 1 (R25) — the three things a user can set up
//  Flow board: Figma 426:1340 (chat patterns), direction doc "Milestone 1:
//  A Smaller, Shippable First Cut".
//
//  Three INDEPENDENT creation flows, each its own section:
//    • Purchase  — a trip, a bike, gold. Capture, then income → obligations →
//      one funding question → the number. No feasibility verdict and no
//      safe-to-spend: Cosimo hands over the facts and the user decides.
//    • Budget    — a spend cap, nothing else. Explicit input from the user:
//      we found this much income, anything on top? Then the cap.
//    • Tracking  — pick the merchants, categories or people worth watching;
//      they land as a widget on the dashboard.
//
//  A user can run several at once, so nothing here says "the goal". Switching
//  mid-flow saves the purchase goal as an incomplete plan (see the draft beat).
//
//  Every number belongs to the closed October world:
//    in ₹50,000 · obligations ₹14,000 · spending ₹14,300 · surplus ₹21,700
// ══════════════════════════════════════════════════════════════════

export type M1GoalKind = "purchase" | "budget" | "track";

export const M1_KIND_ROWS: { id: M1GoalKind; icon: string; label: string }[] = [
  { id: "purchase", icon: "🎯", label: "Save for something" },
  { id: "budget", icon: "💸", label: "Cap my spending" },
  { id: "track", icon: "📌", label: "Track a merchant or person" },
];

// ── The world's detected money (what we can see from transactions) ──────────
export const M1_INCOME = 50000;
export const M1_OBLIGATIONS = 14000;
export const M1_SPENDING = 14300;
export const M1_SURPLUS = M1_INCOME - M1_OBLIGATIONS - M1_SPENDING; // 21,700

export const M1_INCOME_LINES: { name: string; note: string; amount: number }[] = [
  { name: "Salary", note: "1st of the month", amount: 48000 },
  { name: "Refund", note: "one off, 4 Oct", amount: 2000 },
];

export const M1_OBLIGATION_LINES: { name: string; note: string; amount: number }[] = [
  { name: "Rent", note: "12th of the month", amount: 11000 },
  { name: "Subscriptions", note: "4 of them", amount: 1300 },
  { name: "Card EMI", note: "ends in Feb", amount: 1700 },
];

// ── Purchase: capture ───────────────────────────────────────────────────────
export const M1_PURCHASE_WHAT = {
  ask: "What are you saving for?",
  rows: [
    { id: "trip", icon: "✈️", label: "A trip" },
    { id: "gadget", icon: "📱", label: "A bike or a gadget" },
    { id: "gold", icon: "🪙", label: "Gold" },
    { id: "other", icon: "🎯", label: "Something else" },
  ],
  // The label that carries into the rest of the flow.
  names: { trip: "Thailand trip", gadget: "New bike", gold: "Gold", other: "Your goal" } as Record<string, string>,
};

export const M1_PURCHASE_WHEN = {
  ask: "By when? A rough timeline is fine, we can move it later.",
  rows: [
    { id: "3m", label: "3 months", months: 3 },
    { id: "6m", label: "6 months", months: 6 },
    { id: "12m", label: "12 months", months: 12 },
  ],
};

export const M1_PURCHASE_AMOUNT = {
  ask: "And roughly how much do you need? A ballpark is fine.",
  rows: [
    { id: "50k", label: "₹50,000", amount: 50000 },
    { id: "1L", label: "₹1,00,000", amount: 100000 },
    { id: "150k", label: "₹1,50,000", amount: 150000 },
    { id: "5L", label: "₹5,00,000", amount: 500000 },
  ],
};

// ── Purchase: income (projection, plus manual entry is back in M1) ─────────
export const M1_INCOME_ROWS = [
  { id: "ok", icon: "👍", label: "That's right" },
  { id: "more", icon: "➕", label: "I have other income" },
];

export const M1_INCOME_SOURCE_ROWS = [
  { id: "connect", icon: "🏦", label: "Connect another account" },
  { id: "manual", icon: "✏️", label: "Enter it myself" },
];

export const M1_MANUAL_INCOME_ROWS = [
  { id: "5k", label: "₹5,000 a month", amount: 5000 },
  { id: "10k", label: "₹10,000 a month", amount: 10000 },
  { id: "20k", label: "₹20,000 a month", amount: 20000 },
];

// ── Purchase: obligations (detected, plus the user can add) ────────────────
export const M1_OBLIGATION_ROWS = [
  { id: "ok", icon: "👍", label: "That's all of them" },
  { id: "add", icon: "➕", label: "Add one I pay" },
];

export const M1_MANUAL_OBLIGATION_ROWS = [
  { id: "loan", label: "A loan, ₹5,000 a month", amount: 5000 },
  { id: "family", label: "Money home, ₹10,000 a month", amount: 10000 },
  { id: "insurance", label: "Insurance, ₹2,000 a month", amount: 2000 },
];

// ── Purchase: one funding question (the SIP/lump-sum waterfall collapses) ──
export const M1_FUNDING = {
  ask: "Is there any other funding you plan to bring in? I can only see your bank accounts, so if you have an FD or mutual funds, it helps if you say.",
  rows: [
    { id: "lump", icon: "💰", label: "A lump sum now" },
    { id: "later", icon: "🗓️", label: "Something a few months in" },
    { id: "sip", icon: "🔁", label: "A SIP I already run" },
    { id: "none", icon: "🚫", label: "Nothing else" },
  ],
};

export const M1_LUMP_ROWS = [
  { id: "10k", label: "₹10,000", amount: 10000 },
  { id: "25k", label: "₹25,000", amount: 25000 },
  { id: "50k", label: "₹50,000", amount: 50000 },
];

// ── Purchase: the number (facts, then the user decides) ───────────────────
export const M1_NUMBER_ROWS = {
  autopay: { id: "autopay", icon: "⚡", label: "Set up the autopay" },
  relook: { id: "relook", icon: "✏️", label: "Relook at how much I save" },
  cut: { id: "cut", icon: "🔍", label: "Where could I cut?" },
};

export const M1_RELOOK_ROWS = [
  { id: "10k", label: "₹10,000 a month", amount: 10000 },
  { id: "15k", label: "₹15,000 a month", amount: 15000 },
  { id: "20k", label: "₹20,000 a month", amount: 20000 },
];

// The biggest movers, shown when the user asks where they could cut. We show
// them and stop: M1 never suggests the cut itself.
export const M1_MOVERS: { name: string; note: string; amount: number }[] = [
  { name: "Food & drinks", note: "18 orders, 11 of them delivery", amount: 6200 },
  { name: "Shopping", note: "4 orders", amount: 3400 },
  { name: "Travel", note: "cabs, mostly weekends", amount: 2300 },
];

// ── Budget section ────────────────────────────────────────────────────────
export const M1_BUDGET_INCOME_ROWS = [
  { id: "ok", icon: "👍", label: "That's all of it" },
  { id: "more", icon: "➕", label: "Add other income" },
];

// Three-month averages by category. These sit under the world's ₹29,500 caps,
// so "your average" reads as a believable starting cap.
export const M1_BUDGET_CATS: { name: string; icon: string; avg: number }[] = [
  { name: "Food & drinks", icon: "food", avg: 9800 },
  { name: "Shopping", icon: "shopping", avg: 5900 },
  { name: "Travel", icon: "flight", avg: 4600 },
  { name: "Entertainment", icon: "tv", avg: 2400 },
  { name: "Home", icon: "home", avg: 2300 },
];

export const M1_BUDGET_AVG = M1_BUDGET_CATS.reduce((sum, c) => sum + c.avg, 0); // 25,000

export const M1_CAP_ROWS = [
  { id: "avg", label: "₹25,000, my average", amount: 25000 },
  { id: "tight", label: "₹22,000, a bit tighter", amount: 22000 },
  { id: "loose", label: "₹29,500, some room", amount: 29500 },
];

// ── Tracking section ──────────────────────────────────────────────────────
// The candidates worth watching, pulled from what the user actually spends on.
// They pick, we track: each one becomes a widget on the dashboard.
export const M1_TRACK_CANDIDATES: { id: string; icon: string; name: string; note: string; kind: string }[] = [
  { id: "swiggy", icon: "🍜", name: "Swiggy", note: "11 orders this month, ₹3,900", kind: "merchant" },
  { id: "amazon", icon: "📦", name: "Amazon", note: "4 orders this month, ₹2,600", kind: "merchant" },
  { id: "uber", icon: "🚕", name: "Uber", note: "₹1,200 this month", kind: "merchant" },
  { id: "food", icon: "🍽️", name: "Food & drinks", note: "your biggest category, ₹6,200", kind: "category" },
  { id: "rahul", icon: "👤", name: "Rahul", note: "sent ₹4,500, got back ₹2,000", kind: "person" },
];

// ── Mid-flow switch (purchase → budget) ──────────────────────────────────
export const M1_SWITCH = {
  nudge: "We're close on this one. Want to finish it first, or should I save it and we do the budget now?",
  rows: [
    { id: "finish", icon: "🎯", label: "Finish this first" },
    { id: "draft", icon: "💸", label: "Save it, set the budget" },
  ],
};

// What Cosimo says when asked for something M1 genuinely cannot see.
export const M1_OUT_OF_SCOPE =
  "Right now I can only see your bank accounts, so I can't do a deep dive on your investments or plan your retirement. That's coming soon.";
