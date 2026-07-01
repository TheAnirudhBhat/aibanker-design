// Onboarding fixture - chat-led flow with Wrapped quiz + PlanMode.
// All copy + numbers hard-coded for design review.
// Dual-voice: every Ryan message has a Byron counterpart.

import type { ChatCardData } from "../../components/ChatCards";
import { VALENTINO_500, BLUE_500, GREEN_500, RED_500, ORANGE_500 } from "../../lib/colors";
import { makeDailySpendOverview } from "../../lib/debug-fixtures";

export type Voice = "ryan" | "byron";

// ── Dual-voice helper ──────────────────────────────────────────

type DualVoice = { ryan: string; byron: string };

function dv(ryan: string, byron: string): DualVoice {
  return { ryan, byron };
}

// ── Chat sequence - dual-voice bubbles ─────────────────────────

export const PRE_WRAPPED_BUBBLES: DualVoice[] = [
  dv(
    "Three months. Three patterns. A few surprises.",
    "Three months. Three patterns you missed.",
  ),
  dv(
    "Tap each card and answer a few questions. Let's see how well you know your money.",
    "Tap each card and take a guess. Let's see if you really know your money.",
  ),
];

export const POST_WRAPPED_PRE_AA_BUBBLES: DualVoice[] = [
  dv(
    "Your slice accounts already tell me a lot. Link the rest for the full picture.",
    "Your slice accounts say plenty. Link the rest, I'll see the whole mess.",
  ),
];

export const AA_LINKED_BUBBLE: DualVoice = dv(
  "HDFC Bank ••4829 is linked. Pulling your transactions now to see where your money really goes.",
  "HDFC ••4829 linked. Pulling transactions. Stand by.",
);

// Beta: while the sync runs, Ryan teases Byron. He's a pre-tap teaser only — Byron doesn't actually
// arrive up top until the user taps the "Meet Byron" button below the line (that's what flips the
// voice toggle on). So the copy invites the tap rather than pointing at a toggle that isn't there
// yet. Masks the parse wait too.
export const BETA_BYRON_INTRO: DualVoice = dv(
  "While that lands, there's someone you should meet. Byron's my blunter half, and he skips the sugar.",
  "While that lands, you should meet my other half. I'm Byron, the one who skips the sugar.",
);

// Beta skip path: no accounts linked, so there's no sync "landing". Same Byron teaser, reworded to
// reassure that slice data alone is enough to start.
export const BETA_BYRON_INTRO_SKIP: DualVoice = dv(
  "No accounts, no problem. your slice spends are plenty to start. and there's someone you should meet. Byron's my blunter half, and he skips the sugar.",
  "Slice data's enough to read you. and you should meet my other half. I'm Byron, the one who skips the sugar.",
);

// Byron's first roast — fired as a takeover beat right after the intro (chat flips to his voice).
// References the wrapped Swiggy stat so it lands as a real, data-aware roast, not a canned line.
export const BETA_BYRON_FIRST_ROAST: DualVoice = dv(
  "143 Swiggy orders in three months. Bold. We'll get to that.",
  "143 Swiggy orders in three months. That's not a craving, it's a commitment.",
);

export const AA_POST_LINKED_CHIPS = [
  { id: "add-another", label: "Add another" },
  { id: "thats-all", label: "Remind me later" },
];

// ── Post-AA: preference collection ───────────────────────────────

export const POST_AA_PREF_BUBBLES: DualVoice[] = [
  dv(
    "Saving without a reason never sticks. Give me something concrete and I'll make it work. Let's find your reason while I crunch the numbers.",
    "Saving for 'the future' grows nothing. Give me a real target. Tell me what you want while I dig.",
  ),
];

export type QuestionOption = { id: string; label: string };
export type Question = { id: string; text: string; options: QuestionOption[] };

export const GOAL_PREFERENCE_QUESTIONS: Question[] = [
  {
    id: "goal-type",
    text: "What are you saving toward?",
    options: [
      { id: "trip", label: "A trip" },
      { id: "emergency", label: "Emergency fund" },
      { id: "purchase", label: "Big purchase" },
      { id: "save-more", label: "Just save more" },
    ],
  },
  {
    id: "destination",
    text: "Where are you headed?",
    options: [],
  },
  {
    id: "timeline",
    text: "By when?",
    options: [
      { id: "3m", label: "3 months" },
      { id: "6m", label: "6 months" },
      { id: "1y", label: "12 months" },
      { id: "flexible", label: "Flexible" },
    ],
  },
  {
    id: "amount",
    text: "Roughly how much?",
    options: [
      { id: "50k", label: "₹50k" },
      { id: "1L", label: "₹1L" },
      { id: "2L", label: "₹2L" },
      { id: "5L+", label: "₹5L+" },
    ],
  },
];

// ── Post-AA playground (chip-driven spend-analytics taster) ─────

export const PLAYGROUND_INTRO_BUBBLES: DualVoice[] = [
  dv(
    "One sec, piecing it together.",
    "One sec, crunching your numbers.",
  ),
  dv(
    "Meanwhile, see what I can do.",
    "While I work, pick one.",
  ),
];

export type PlaygroundChip = { id: string; label: string };

export const PLAYGROUND_CHIPS: PlaygroundChip[] = [
  { id: "top-categories", label: "Top categories, last 3 months" },
  { id: "month-story", label: "My month-to-month story" },
  { id: "spending-says", label: "What my spending says about me" },
  { id: "roast-byron", label: "Roast me, Byron" },
];

// Card payload + quip per chip (excluding roast-byron)
export type PlaygroundTrait = { emoji: string; label: string; line: string };

export type PlaygroundReveal = {
  card: ChatCardData;
  traits?: PlaygroundTrait[];
  quip: DualVoice;
};

export const PLAYGROUND_REVEALS: Record<string, PlaygroundReveal> = {
  "top-categories": {
    card: {
      type: "category-breakdown",
      month: "Last 3 months",
      amount: 234600,
      subtext: "across 8 categories",
      showAll: true,
      categories: [
        { name: "Food & delivery", amount: 64200, pct: 27, color: ORANGE_500, icon: "🍔" },
        { name: "Shopping", amount: 48800, pct: 21, color: VALENTINO_500, icon: "🛍️" },
        { name: "Transport", amount: 32400, pct: 14, color: BLUE_500, icon: "🚗" },
        { name: "Entertainment", amount: 19800, pct: 8, color: GREEN_500, icon: "🎬" },
        { name: "Subscriptions", amount: 9720, pct: 4, color: RED_500, icon: "📱" },
      ],
    },
    quip: dv(
      "Food's running the show. ₹64K across three months. Shopping's a close second.",
      "Food is eating you. Literally and financially. ₹64K in three months.",
    ),
  },
  "month-story": {
    card: {
      type: "spend-overview",
      month: "April",
      amount: 74900,
      comparisonText: "Down 18% from March",
      chartData: [
        { label: "Feb", value: 68400 },
        { label: "Mar", value: 91200 },
        { label: "Apr", value: 74900 },
      ],
      average: 78167,
      highlightIndex: 2,
    },
    quip: dv(
      "March got away from you. A holiday plus a few big-ticket buys. April you reined it back in.",
      "March you went feral. April you panicked. February you was the only adult in the room.",
    ),
  },
  "spend-365": {
    card: makeDailySpendOverview(365),
    quip: dv(
      "Here's every day of the last year. Drag across to land on any day.",
      "A year of you, day by day. Drag across. Brace yourself.",
    ),
  },
  "spending-says": {
    card: {
      type: "spending-heatmap",
      month: "Last month",
      year: 2025,
      startDay: 2,
      dailySpend: [
        1200, 0, 1800, 4500, 6800, 7200, 1500,
        900, 1400, 2100, 2800, 5100, 7800, 1100,
        2100, 1800, 3800, 1100, 4900, 8500, 600,
        1900, 2600, 2000, 1400, 5800, 7100, 1200,
        900, 2200,
      ],
      maxSpend: 8500,
    },
    traits: [
      { emoji: "", label: "Monday spender", line: "₹30K of your month lands on Mondays — 3× any other weekday." },
      { emoji: "", label: "Sunday creeps up", line: "Second-biggest day of the week. ₹22K across four Sundays." },
      { emoji: "", label: "Tuesday reset", line: "Your quietest day. ₹1,100 daily average after the Monday peak." },
    ],
    quip: dv(
      "Most of your spending lands in the first half of the week, then settles into a predictable rhythm that's easy to plan around.",
      "You blow most of your money before midweek, then coast. Predictable enough that I can plan around you with my eyes closed.",
    ),
  },
  "big-spends": {
    card: {
      type: "transaction-table",
      title: "Your biggest spends",
      transactions: [
        { date: "14 Apr '25", merchant: "Apple", amount: 134900, category: "Shopping" },
        { date: "2 Apr '25", merchant: "MakeMyTrip", amount: 48600, category: "Travel" },
        { date: "22 Mar '25", merchant: "Aditya", amount: 38000, category: "P2P" },
        { date: "9 Mar '25", merchant: "Croma", amount: 24990, category: "Shopping" },
        { date: "28 Feb '25", merchant: "Tanishq", amount: 18750, category: "Shopping" },
        { date: "19 Feb '25", merchant: "Indigo", amount: 12400, category: "Travel" },
        { date: "11 Feb '25", merchant: "Decathlon", amount: 9800, category: "Shopping" },
        { date: "3 Feb '25", merchant: "Cleartrip", amount: 8600, category: "Travel" },
        { date: "27 Jan '25", merchant: "Zepto", amount: 6400, category: "Food" },
        { date: "19 Jan '25", merchant: "Nykaa", amount: 5900, category: "Shopping" },
        { date: "12 Jan '25", merchant: "Rahul", amount: 5200, category: "P2P" },
        { date: "6 Jan '25", merchant: "BluSmart", amount: 4100, category: "Transport" },
        { date: "2 Jan '25", merchant: "Spotify", amount: 3800, category: "Subscriptions" },
        { date: "29 Dec '24", merchant: "Swiggy", amount: 3200, category: "Food" },
        { date: "24 Dec '24", merchant: "Uniqlo", amount: 2900, category: "Shopping" },
      ],
    },
    quip: dv(
      "These six alone are ₹2.7L. The iPhone and the Goa trip did most of the damage.",
      "Six transactions, ₹2.7L gone. One was a phone. One was a holiday. Neither was rent.",
    ),
  },
};

// Roasts are now computed via `buildRoast` (see app/lib/roast.ts) — single
// source of truth for both production and sims. The playground uses a fixed
// synthetic input so consecutive taps cycle through copy variants by seed.
import { buildRoast } from "../../lib/roast";

// At this onboarding stage the user hasn't set any category caps yet, so
// roasts shouldn't reference a "cap you broke". Leaving categoryBudgets out
// makes buildRoast fall to the food-heavy / top-category branches, which
// only need observational data we already have.
const PLAYGROUND_ROAST_INPUT = {
  lifestyleCategories: [
    { name: "Food & dining", totalAmount: 0, transactionCount: 0, avgPerTransaction: 0, monthlyAverage: 0, shareOfLifestyle: "42%" },
  ],
  foodBreakdown: { totalOrders: 143, totalSpend: 42000 },
};

export function getPlaygroundByronRoast(seed: number): string {
  return buildRoast(PLAYGROUND_ROAST_INPUT, "byron", seed).text;
}

// Handoff is always Ryan's voice (fires after Byron's roast). Same string in both
// keys because the consumer reads `.ryan` regardless of active persona.
export const PLAYGROUND_RYAN_HANDOFF: DualVoice = dv(
  "Byron's a bit much. But he means well. If tough love is what you like, you know where to find him.",
  "Byron's a bit much. But he means well. If tough love is what you like, you know where to find him.",
);

// Intent-first (beta): the goal is already banked, so the playground is pure explore-while-you-wait.
// Happy case — by the time this shows, the parse has finished, so it lands on "data's all in,
// let's build the plan" (no waiting / session break).
export const BETA_PLAYGROUND_READY: DualVoice = dv(
  "Read through everything. Your full picture's in. Ready to turn it into a plan?",
  "Done digging. Full picture's in. Ready for your plan?",
);

// Intent-first (beta) flow: the goal is asked up front, right after the wrapped hook. Bridges from
// the reveal ("that's where it's been going") into the goal so the turn doesn't feel like a non-sequitur.
export const BETA_GOAL_INTRO: DualVoice = dv(
  "That's your spending. Now the fun part: what do you want to save towards? You can always change it later.",
  "That's the damage. Now the fun part: what do you want to save towards? You can change it whenever.",
);

// Beta goal → AA bridge. Follows the goal answer (or a skip), so it picks up from "I've seen your
// slice side" and asks to link the rest — instead of the classic wrapped→AA line that ignores the goal.
// The line explains WHY to link (slice = a sliver; linking = real income + spending = a plan that
// fits); a "what I can see" card (LinkAccountsCard) below makes the blind spots tangible.
export const BETA_AA_INTRO: DualVoice = dv(
  "Right now I only see your slice spends. Here's what I'm missing.",
  "Right now I only see your slice spends. Here's the rest I'm blind to.",
);

// Decide-later branch of the AA ask — no goal was set, so don't promise a "sharper goal"; pick up
// from skipping it and frame linking as the fuller picture instead.
export const BETA_AA_INTRO_NO_GOAL: DualVoice = dv(
  "No rush on the goal. Either way, I've only got your slice spends. Link your other accounts for the full picture.",
  "Goal can wait. Still just slice spends, though. Link the rest for the full picture.",
);

// Save-more branch — the user chose "save a little more" (no concrete target), so don't promise a
// "sharper goal". Acknowledge the choice and frame linking as finding more to save.
export const BETA_AA_INTRO_SAVE_MORE: DualVoice = dv(
  "Nice, saving more it is. Right now I only see your slice spends. Here's what I'm missing.",
  "Saving more, respectable. Right now I only see your slice spends. Here's the rest I'm blind to.",
);

// Beta "maybe later" → the user declined connecting now; offer the soft auto-save fallback (deferred
// until the decline), with linking still on the table whenever they want it.
export const BETA_AA_MAYBE_LATER: DualVoice = dv(
  "No rush. I can auto-save a set amount toward it for now, and you can link up whenever.",
  "Later, then. I'll auto-save a set amount for now. Link the rest whenever you like.",
);

// Slice-data prompts surfaced as chips at the AA ask (the "ask me anything" suggestions).
export const AA_ASK_SUGGESTIONS: string[] = [
  "Where's most of it going?",
  "How do my months compare?",
];

export const PLAYGROUND_GOAL_NUDGE: DualVoice = dv(
  "Every account's read in now. Looking at it only gets you so far. Want to set up a goal, or just save more?",
  "Data's all in. Staring won't grow it. Set up a goal, or just save more?",
);

// Byron's hard nudge after the roast cap is reached. Always Byron's voice
// since the user is still on him when this fires. Phrased as a question so
// the "Yes, set up a goal" chip below reads as the natural answer.
export const PLAYGROUND_BYRON_CAP_NUDGE: DualVoice = dv(
  "Alright, you've heard the worst of it. Want to actually do something about it? Set a goal.",
  "Alright, you've heard the worst of it. Want to actually do something about it? Set a goal.",
);

// ── Mosaic card data (shown during wait) ────────────────────────

export type QuickAction = { category: string; title: string; illustration?: string; bg: string };

// ── Re-entry - clarifying questions ─────────────────────────────

export const REENTRY_BUBBLE: DualVoice = dv(
  "Went through your numbers. Before I lock anything in, need to confirm a few things.",
  "Done crunching. Few things to sort out before I commit your money to anything.",
);

export type ClarifyingQuestion = {
  id: string;
  botText: DualVoice;
  chips: { id: string; label: string }[];
};

export const OBLIGATIONS_INTRO: DualVoice[] = [
  dv(
    "I can see Swiggy One at ₹1,499, Netflix at ₹649, and Cult.fit at ₹2,500. That's ₹4,648/month in subscriptions. I've already accounted for those.",
    "Swiggy One ₹1,499. Netflix ₹649. Cult.fit ₹2,500. That's ₹4,648/month on autopilot. Already counted.",
  ),
  dv(
    "There are a few other payments that show up regularly, but the amounts vary or I'm not sure if they're fixed. Can you confirm which ones to include?",
    "These other ones keep showing up but the amounts bounce around. Tell me which ones are real obligations.",
  ),
];

export const CLARIFYING_QUESTIONS: ClarifyingQuestion[] = [
  {
    id: "cq-obligations",
    botText: dv("", ""), // Not used - replaced by OBLIGATIONS_INTRO + widget
    chips: [],
  },
  {
    id: "cq-existing",
    botText: dv(
      "You have about ₹50k in existing investments. Want to count that toward this goal?",
      "There's ₹50K sitting in investments. Count it toward the goal or pretend it doesn't exist?",
    ),
    chips: [
      { id: "yes", label: "Yes, include that" },
      { id: "no", label: "No, start fresh" },
    ],
  },
  {
    id: "cq-risk",
    botText: dv(
      "One more. How do you feel about risk? This helps me pick the right instrument.",
      "Last one. How much risk can your nerves handle? This decides where your money goes.",
    ),
    chips: [
      { id: "safe", label: "Keep it safe" },
      { id: "balanced", label: "Balanced" },
      { id: "aggressive", label: "I can take some risk" },
    ],
  },
];

export const CLARIFY_CRUNCHER_STATUSES = [
  "Checking monthly obligations",
  "Reviewing your finances",
  "Analysing risk profile",
];

export const IDLE_CRUNCHER_TEXTS = [
  "Checking your cashflow",
  "Optimising monthly allocation",
  "Building your plan",
];

export const VERBOSE_PLAN_TEXT: DualVoice = dv(
  `Alright, here's what I'd put together based on what you shared.

You're aiming for ₹2L by October, which gives us about six months. With ₹50,000 already saved and some room to redirect spending, this is very doable without anything drastic.

Here's how I'd split it. First, open a Recurring Deposit at 7.25% p.a. for six months with ₹20,000 going in every month. I'm picking an RD over a regular savings account because the rate is nearly double and the auto-debit makes it easier to stay consistent. Over six months that alone compounds to about ₹1,23,000.

Next, move your existing ₹50,000 into the same RD upfront so it starts earning the same rate immediately. By October that parks at roughly ₹51,875.

Finally, trim around ₹5,000/month from discretionary spending. Looking at the last three months, you're averaging about ₹8,000/month on eating out and subscriptions, so there's comfortable room here without cutting anything essential. That adds another ₹30,000 over the six months.

Stacked together, you land at roughly ₹2,04,875 by October, a small buffer over your goal.

A few things worth knowing: the RD locks in your 7.25% rate, so even if rates drop later you're protected. If something unexpected comes up and you need to pull money out early, you can break it, though you'd lose a bit of accrued interest. I'll also set up a heads-up two weeks before each auto-debit in case you want to pause a month.

Want me to go ahead and set this up, or would you like to tweak any piece of it first?`,

  `₹2L by October. Six months. Here's the play.

RD at 7.25%, ₹20K/month auto-debit. That alone gets you ₹1,23,000. The rate locks in so even if markets tank, you're covered.

Your ₹50K in investments? Move it into the same RD now. By October that's ₹51,875 doing nothing but sitting there.

Cut ₹5K/month from eating out and subscriptions. You're averaging ₹8K/month on that, so this is not exactly a sacrifice. That's another ₹30K.

Total: ₹2,04,875. A little over target. Comfortable.

If life happens and you need to pull money out early, you can break the RD. You'll lose some interest but nothing dramatic. I'll also ping you two weeks before each auto-debit so you can pause if needed.

Want me to set this up or do you want to overthink it first?`,
);

// ── Post-plan pills ─────────────────────────────────────────────

export const POST_PLAN_CHIPS = [
  { id: "go-ahead", label: "Go ahead, set it up" },
  { id: "think-about-it", label: "Let me think about it" },
];

// ── Dismiss nudge copy ──────────────────────────────────────────

export const AA_DISMISS_NUDGE: DualVoice = dv(
  "No stress. You can connect whenever. But the more accounts I see, the sharper I get.",
  "Your call. But I'm working with one eye open until you connect the rest.",
);

export const PREF_DISMISS_NUDGE: DualVoice = dv(
  "No worries. Whenever you're ready. A goal makes everything I do sharper though.",
  "Fine. But saving without a target is just hoarding with extra steps.",
);

// ── AA card states ──────────────────────────────────────────────

export const AA_CARD = {
  pending: {
    title: "Connect your account",
    subtitle: "30 seconds. Bank-grade, RBI-licensed.",
    cta: "Connect",
  },
  loading: {
    title: "Connecting…",
    subtitle: "Verifying with HDFC.",
  },
  linked: {
    bankName: "HDFC Bank",
    accountDetail: "Savings xx6543",
  },
};

// ── Persona-matched obligations ─────────────────────────────────

export const ONBOARDING_OBLIGATIONS = {
  type: "confirm-list" as const,
  items: [
    { id: "ob-1", payee: "Satya Prakashan", amount: 25000, type: "Rent/EMI" },
    { id: "ob-2", payee: "HDFC Car Loan", amount: 18000, type: "Loan EMI" },
    { id: "ob-3", payee: "Priya Sharma", amount: 8000, type: "P2P" },
  ],
  monthlyIncome: 120000,
};

// ── Wrapped story beats ────────────────────────────────────────

export type GuessChip = { id: string; label: string };

export type WrappedBeat =
  | {
      kind: "guess";
      id: string;
      question: string;
      chips: GuessChip[];
      // The right answer's chip id. When set, the guess screen scores the pick (tick on the correct
      // option, cross on a wrong pick). Omit for open guesses with no single right answer.
      correctId?: string;
      reveal: {
        hero: string;
        quip: DualVoice;
      };
      ctaLabel?: string;
    }
  | {
      kind: "observation";
      id: string;
      hero: string;
      quip: DualVoice;
    }
  | {
      kind: "reveal";
      id: string;
      hero: string;
      quip: DualVoice;
      ctaLabel: string;
    };

export const WRAPPED_BEATS: WrappedBeat[] = [
  {
    kind: "guess",
    id: "swiggy-volume",
    question: "How many times did you order from Swiggy in the last 3 months?",
    chips: [
      { id: "30-50", label: "30 – 50" },
      { id: "50-100", label: "50 – 100" },
      { id: "100-150", label: "100 – 150" },
      { id: "150+", label: "150+" },
    ],
    correctId: "100-150",
    reveal: {
      hero: "143 times.",
      quip: dv("The fridge isn't doing much, is it?", "143 orders. Your kitchen is basically decorative."),
    },
  },
  {
    kind: "guess",
    id: "top-recipient",
    question: "Who did you send the most money to?",
    chips: [
      { id: "friend", label: "A friend" },
      { id: "parents", label: "Your parents" },
      { id: "merchant", label: "A merchant" },
      { id: "yourself", label: "Yourself" },
    ],
    correctId: "friend",
    reveal: {
      hero: "Aditya.",
      quip: dv("Get a joint account already, you guys!", "₹38K to one person. At this point just merge your finances."),
    },
  },
  {
    kind: "guess",
    id: "tuesday-spending",
    question: "What's the most expensive day of the week for you?",
    chips: [
      { id: "monday", label: "Monday" },
      { id: "tuesday", label: "Tuesday" },
      { id: "friday", label: "Friday" },
      { id: "saturday", label: "Saturday" },
    ],
    correctId: "tuesday",
    reveal: {
      hero: "Tuesdays are your most expensive day.",
      quip: dv("Mid-week slump? More like mid-week splurge.", "Tuesday you spends like Saturday you. Monday you pays for it."),
    },
    ctaLabel: "Let's go",
  },
];

// ── Card palettes + beat data ───────────────────────────────────

// DLS Decorative tokens - subtle (bg), bold (text/number), accent (blob at 12%)
// bg      = light pastel (light mode surface).
// bgDark  = vivid jewel-tone dark (the matching DLS /800 step) so the wrapped reveal
//           surface reads rich and saturated in dark mode, clearly lifted off black.
// text    = mid-tone hue (/500) used for hero number + labels in LIGHT mode.
// textDark = lifted hue (/400) used in DARK mode so the hero number clears ~3:1 on the
//           brighter bgDark (a plain /500 would collapse to ~2.4:1 on these surfaces).
export const CARD_PALETTES = [
  // Order matters: consecutive beats take consecutive palettes, so we alternate warm/cool for
  // maximum adjacent-card contrast. Beat 0 (Swiggy) = Valentino, beat 1 (Transferred) = Green —
  // pink vs green, instead of the pale-lilac-vs-pale-blue that read as the same card in light.
  // Richer, more saturated faces (the pales/jewels read too dull). Light deepened a step; dark
  // brightened a step (more vivid, not lighter) so the textDark labels keep their headroom.
  { bg: "#F6CEF7", bgDark: "#7A067F", accent: "rgba(211, 10, 215, 0.14)", text: VALENTINO_500, textDark: "#EC6BEE" },   // Valentino
  { bg: "#CFEDDB", bgDark: "#00662A", accent: "rgba(61, 187, 108, 0.14)", text: "#00A63E", textDark: "#4FD17E" },       // Green
  { bg: "#FFE7C7", bgDark: "#9A4E00", accent: "rgba(255, 178, 79, 0.14)", text: "#C27511", textDark: "#FFB152" },       // Orange
  { bg: "#D6E3F6", bgDark: "#1A4080", accent: "rgba(43, 106, 207, 0.14)", text: "#2B6ACF", textDark: "#7AA6E8" },       // Blue
  { bg: "#F7D2D4", bgDark: "#7D161B", accent: "rgba(218, 83, 90, 0.14)", text: "#CE1D26", textDark: "#F06A71" },        // Red
];

export const BEAT_DATA: Record<string, { number: string; labelAbove: string; labelBelow: string }> = {
  "swiggy-volume":        { number: "143",   labelAbove: "Swiggy orders", labelBelow: "in 3 months" },
  "top-recipient":        { number: "₹38K",  labelAbove: "Transferred", labelBelow: "to Aditya" },
  "tuesday-spending":     { number: "₹2.1K", labelAbove: "Tuesday spends", labelBelow: "more than any other day" },
};
