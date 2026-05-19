import rawData from "../../ups_crunched.json";
import type {
  RawBankData,
  DerivedProfile,
  CategorySummary,
} from "./types";
import type { MockProfile, PacePreset } from "../data/mockProfiles";
import type { WrappedSlide } from "../data/flows";

const data = rawData as unknown as RawBankData;

// Categories to exclude from "lifestyle" analysis
const EXCLUDED_CATEGORIES = [
  "Self Transfers",
  "Real Estate (Prestige EMI)",
  "Real Estate (Eldeco)",
  "Credit Card Payments (HDFC)",
  "Credit Card Payments (Amex)",
  "Credit Card Payments (CRED)",
  "Credit Card Payments (CRED Club)",
  "Credit Card Payments (OneCard)",
  "Investments (MF via slice)",
  "Investments (SIP/Mandates)",
  "Investments (Groww)",
  "Investments (BSE/Stocks)",
  "Investment (PPF Transfer)",
];

export function parseINR(str: string): number {
  const cleaned = str.replace(/[₹,\s]/g, "");
  if (cleaned.endsWith("Cr") || cleaned.endsWith("cr"))
    return parseFloat(cleaned) * 10000000;
  if (cleaned.endsWith("L") || cleaned.endsWith("l"))
    return parseFloat(cleaned) * 100000;
  if (cleaned.endsWith("k") || cleaned.endsWith("K"))
    return parseFloat(cleaned) * 1000;
  return parseFloat(cleaned) || 0;
}

export function formatINR(amount: number): string {
  if (amount >= 100000) {
    const lakhs = amount / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)}L`;
  }
  if (amount >= 1000) {
    const k = amount / 1000;
    return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `₹${Math.round(amount)}`;
}

function getMonthCount(): number {
  const from = new Date(data.dateRange.from);
  const to = new Date(data.dateRange.to);
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / (30 * 24 * 60 * 60 * 1000)));
}

export function getLifestyleCategories(): CategorySummary[] {
  const months = getMonthCount();
  const categories: CategorySummary[] = [];
  let totalLifestyle = 0;

  for (const [name, catData] of Object.entries(data.categoryWiseSpend)) {
    if (EXCLUDED_CATEGORIES.includes(name)) continue;
    totalLifestyle += catData.totalAmount;
  }

  for (const [name, catData] of Object.entries(data.categoryWiseSpend)) {
    if (EXCLUDED_CATEGORIES.includes(name)) continue;
    categories.push({
      name,
      totalAmount: catData.totalAmount,
      transactionCount: catData.transactionCount,
      avgPerTransaction: catData.avgPerTransaction,
      monthlyAverage: Math.round(catData.totalAmount / months),
      shareOfLifestyle: `${Math.round((catData.totalAmount / totalLifestyle) * 100)}%`,
    });
  }

  return categories.sort((a, b) => b.totalAmount - a.totalAmount);
}

export function computeWrappedSlides(): WrappedSlide[] {
  const months = getMonthCount();
  const totalFlow = data.overallSummary.totalDebits + data.overallSummary.totalCredits;
  const totalFlowCr = (totalFlow / 10000000).toFixed(1);

  // --- Detect travel from ATM narrations + travel category ---
  const homeCity = "BANGALORE";
  const cashTxns = data.cashWithdrawals?.transactions || [];
  const awayAtmTxns: { date: string; amount: number; location: string }[] = [];
  for (const txn of cashTxns) {
    const narr = txn.narration.toUpperCase();
    if (narr.includes(homeCity) || narr.includes("BENGALURU")) continue;
    // Extract location from ATM narration (last segment after last dash)
    let location = "Away";
    if (narr.includes("BENTOTA")) location = "Bentota, Sri Lanka";
    else if (narr.includes("ARRIV") || narr.includes("AAIRKN")) location = "Colombo Airport";
    else if (narr.includes("BAREILLY")) location = "Bareilly";
    else {
      const parts = narr.split("-");
      const last = parts[parts.length - 1]?.trim();
      if (last && last.length > 2) location = last;
    }
    awayAtmTxns.push({ date: txn.date, amount: txn.amount, location });
  }
  // Add travel category + international markup charges
  const travelCat = data.categoryWiseSpend["Travel (International)"];
  let intlSpend = 0;
  if (travelCat) {
    for (const txn of travelCat.transactions) intlSpend += txn.amount;
  }
  // International markup charges from Other/Uncategorized
  const otherCat = data.categoryWiseSpend["Other / Uncategorized"];
  if (otherCat) {
    for (const txn of otherCat.transactions) {
      if (txn.narration.includes("INTL")) intlSpend += txn.amount;
    }
  }
  const tripTotal =
    awayAtmTxns
      .filter(
        (t) =>
          t.location.includes("Sri Lanka") ||
          t.location.includes("Colombo")
      )
      .reduce((s, t) => s + t.amount, 0) + intlSpend;

  // --- ATM binge: find the biggest single-day ATM run ---
  const atmByDate: Record<string, { count: number; total: number }> = {};
  for (const txn of cashTxns) {
    if (!atmByDate[txn.date]) atmByDate[txn.date] = { count: 0, total: 0 };
    atmByDate[txn.date].count++;
    atmByDate[txn.date].total += txn.amount;
  }
  let maxAtmDay = { date: "", count: 0, total: 0 };
  for (const [date, stats] of Object.entries(atmByDate)) {
    if (stats.count > maxAtmDay.count) {
      maxAtmDay = { date, ...stats };
    }
  }

  // --- Credit card empire ---
  const ccCategories = Object.keys(data.categoryWiseSpend).filter((k) =>
    k.startsWith("Credit Card Payments")
  );
  const ccCount = ccCategories.length;
  let ccTotal = 0;
  for (const cat of ccCategories) {
    ccTotal += data.categoryWiseSpend[cat].totalAmount;
  }

  // --- Income pattern shift ---
  const monthlyCredits: { month: string; amount: number }[] = [];
  for (const [month, mData] of Object.entries(data.monthlyBreakdown)) {
    monthlyCredits.push({ month, amount: mData.totalCredits });
  }
  monthlyCredits.sort((a, b) => a.month.localeCompare(b.month));
  const amounts = monthlyCredits.map((m) => m.amount);
  const sortedAmounts = [...amounts].sort((a, b) => a - b);
  const median = sortedAmounts[Math.floor(sortedAmounts.length / 2)];
  const peakMonths = monthlyCredits.filter((m) => m.amount > median * 1.5);
  const normalMonths = monthlyCredits.filter((m) => m.amount <= median * 1.5);
  const avgPeak =
    peakMonths.reduce((s, m) => s + m.amount, 0) /
    Math.max(1, peakMonths.length);
  const avgNormal =
    normalMonths.reduce((s, m) => s + m.amount, 0) /
    Math.max(1, normalMonths.length);
  const incomeMultiplier =
    Math.round((avgPeak / Math.max(1, avgNormal)) * 10) / 10;

  // --- Investment machine ---
  const totalInvested = (data.investmentActivity.totalInvested as number) || 0;
  const investPlatforms = Object.keys(data.investmentActivity).filter(
    (k) => k !== "totalInvested"
  ).length;
  const sipCount = data.recurringPayments.totalACHDebits;
  const investPct = Math.round(
    (totalInvested / data.overallSummary.totalCredits) * 100
  );

  // Format the max ATM day
  const atmDate = maxAtmDay.date
    ? new Date(maxAtmDay.date).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      })
    : "";

  return [
    {
      id: "wrapped-1",
      headline: "Behind the numbers",
      punchline: `${months} months\n₹${totalFlowCr}Cr\n${data.dateRange.totalTransactions} transactions\n\nHere's what we found hiding in them.`,
    },
    {
      id: "wrapped-2",
      headline: "We found your Sri Lanka trip",
      punchline:
        "Jan 29 - Colombo airport ATM\nFeb 1 - Bentota beach resort\n5 ATM runs the day you got back",
      stat: {
        label: "",
        value: formatINR(tripTotal),
        caption: `in cash and charges across the trip. Plus ${formatINR(maxAtmDay.total)} pulled from one ATM on ${atmDate}.`,
      },
    },
    {
      id: "wrapped-3",
      headline: `${ccCount} credit cards. One account.`,
      punchline:
        "HDFC. Amex. OneCard. Plus two through CRED. All draining from here.",
      stat: {
        label: "",
        value: formatINR(ccTotal),
        caption:
          "in CC payments. Your real spending life is invisible to this account.",
      },
    },
    {
      id: "wrapped-4",
      headline: "Something changed in February",
      punchline: `Your monthly inflow jumped ${incomeMultiplier}x for three months. Then quietly dropped back.`,
      stat: {
        label: "",
        value: formatINR(avgPeak),
        caption: `peak months vs ${formatINR(avgNormal)} normally. Bonus? Side income? Your account noticed.`,
      },
    },
    {
      id: "wrapped-5",
      headline: `${sipCount} debits fire without you`,
      punchline:
        "SIPs, mandates, mutual funds \u2014 your money has a day job you don\u2019t think about.",
      stat: {
        label: "",
        value: formatINR(totalInvested),
        caption: `across ${investPlatforms} platforms. ${investPct}% of every rupee earned, on autopilot.`,
      },
    },
    {
      id: "wrapped-6",
      headline: "Ready for reality?",
      punchline:
        "Tell me what you think you do. Then I\u2019ll show you the receipts.",
    },
  ];
}

function computeSuggestedBudgets(): MockProfile["suggested_budgets"] {
  const months = getMonthCount();
  const categories = getLifestyleCategories();

  // Build category budgets from monthly averages (rounded up to nearest 500)
  const categoryBudgets = categories.slice(0, 6).map((cat) => {
    const monthly = cat.monthlyAverage;
    const rounded = Math.ceil(monthly / 500) * 500;
    return { name: cat.name, budget: formatINR(rounded) };
  });

  const totalBudget = categoryBudgets.reduce((sum, cat) => {
    const amt = parseFloat(cat.budget.replace(/[₹,kL]/g, "")) * (cat.budget.includes("k") ? 1000 : cat.budget.includes("L") ? 100000 : 1);
    return sum + amt;
  }, 0);

  const buffer = Math.ceil(totalBudget * 0.1 / 500) * 500;

  return {
    overall_budget: formatINR(totalBudget + buffer),
    buffer_bucket: formatINR(buffer),
    buffer_remaining: formatINR(buffer),
    categories: categoryBudgets,
  };
}

export function computePacePresets(goalAmount: number): PacePreset[] {
  const months = getMonthCount();
  const categories = getLifestyleCategories();
  const monthlySavingsNeeded3m = Math.round(goalAmount / 3);
  const monthlySavingsNeeded6m = Math.round(goalAmount / 6);
  const monthlySavingsNeeded12m = Math.round(goalAmount / 12);

  // Use real top categories for lever examples
  const topCat = categories[0];
  const secondCat = categories[1];
  const topName = topCat?.name || "Top category";
  const secondName = secondCat?.name || "Second category";

  return [
    {
      id: "aggressive",
      label: "Aggressive",
      required_monthly_cut: formatINR(monthlySavingsNeeded3m),
      pace_window: "3 months",
      feasibility_note: "This is a fast track. You'd need to cut hard each month.",
      lever_examples: [
        `Trim ${topName} by ${formatINR(Math.round(monthlySavingsNeeded3m * 0.4))}`,
        `Trim ${secondName} by ${formatINR(Math.round(monthlySavingsNeeded3m * 0.3))}`,
        `Reduce discretionary by ${formatINR(Math.round(monthlySavingsNeeded3m * 0.3))}`,
      ],
      recommended_product: {
        type: "RD",
        label: `Start a ${formatINR(monthlySavingsNeeded3m)} RD at month start`,
        copy: `Lock in ${formatINR(monthlySavingsNeeded3m)} with an RD at the start of each month. The money disappears before you can spend it.`,
      },
    },
    {
      id: "balanced",
      label: "Balanced",
      required_monthly_cut: formatINR(monthlySavingsNeeded6m),
      pace_window: "6 months",
      feasibility_note: "This is doable with a few tweaks and a small system to stay consistent.",
      lever_examples: [
        `Trim ${topName} by ${formatINR(Math.round(monthlySavingsNeeded6m * 0.4))}`,
        `Trim ${secondName} by ${formatINR(Math.round(monthlySavingsNeeded6m * 0.4))}`,
        `Cut small discretionary by ${formatINR(Math.round(monthlySavingsNeeded6m * 0.2))}`,
      ],
      recommended_product: {
        type: "RD",
        label: `Start a ${formatINR(monthlySavingsNeeded6m)} RD + light cuts`,
        copy: `Lock in ${formatINR(monthlySavingsNeeded6m)} at the start of each month with an RD. Pair it with small cuts so it doesn't feel harsh.`,
      },
    },
    {
      id: "relaxed",
      label: "Relaxed",
      required_monthly_cut: formatINR(monthlySavingsNeeded12m),
      pace_window: "1 year",
      feasibility_note: "You're already close to this pace. The key is not overspending.",
      lever_examples: [
        `Auto-save ${formatINR(Math.round(monthlySavingsNeeded12m / 30))}/day to protect the goal`,
        "Keep spending steady with a buffer bucket",
      ],
      recommended_product: {
        type: "Autosave",
        label: `Auto-save ${formatINR(Math.round(monthlySavingsNeeded12m / 30))}/day`,
        copy: `Set up ${formatINR(Math.round(monthlySavingsNeeded12m / 30))}/day auto-save. It quietly builds up (~${formatINR(monthlySavingsNeeded12m)}/month) without you noticing.`,
      },
    },
  ];
}

function generateReceipts(): MockProfile["receipts"] {
  const receipts: MockProfile["receipts"]  = [];
  const lifestyleCategories = [
    "Food Delivery (Swiggy)",
    "Groceries (Swiggy Instamart)",
    "Dining Out (Swiggy Dineout)",
    "Shopping (Amazon)",
    "Cash Withdrawals (ATM)",
    "Other / Uncategorized",
  ];

  for (const catName of lifestyleCategories) {
    const catData = data.categoryWiseSpend[catName];
    if (!catData) continue;
    for (const txn of catData.transactions.slice(-3)) {
      const date = new Date(txn.date);
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayName = dayNames[date.getDay()];

      // Extract merchant name from narration
      let merchant = catName.split("(")[1]?.replace(")", "") || catName.split(" ")[0];
      if (txn.narration.includes("SWIGGY")) merchant = "Swiggy";
      else if (txn.narration.includes("AMAZON")) merchant = "Amazon";
      else if (txn.narration.includes("INSTAMART")) merchant = "Swiggy Instamart";

      receipts.push({
        id: `r-${txn.date}-${txn.amount}`,
        time: `${dayName} ${date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`,
        category: catName.includes("Food") || catName.includes("Groceries") || catName.includes("Dining") ? "Food & Delivery" : catName.includes("Shopping") ? "Shopping" : "Other",
        amount: formatINR(txn.amount),
        merchant,
      });
    }
  }

  return receipts.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 10);
}

export function deriveProfile(): DerivedProfile {
  const months = getMonthCount();
  const categories = getLifestyleCategories();
  const topCat = categories[0];
  const secondCat = categories[1];

  const totalInvested = (data.investmentActivity.totalInvested as number) || 0;
  const savingsPct = Math.round((totalInvested / data.overallSummary.totalCredits) * 100);

  const suggestedBudgets = computeSuggestedBudgets();
  const receipts = generateReceipts();

  // Investment breakdown
  const investmentBreakdown: Record<string, { total: number; count: number }> = {};
  for (const [key, val] of Object.entries(data.investmentActivity)) {
    if (key === "totalInvested") continue;
    const item = val as { total: number; count: number };
    investmentBreakdown[key] = { total: item.total, count: item.count };
  }

  const profile: DerivedProfile = {
    id: "derived-from-data",
    label: `${topCat?.name || "Lifestyle"} spender`,
    wrapped: {
      top_category_label: topCat?.name || "Uncategorized",
      top_category_share_pct: topCat?.shareOfLifestyle || "0%",
      second_category_label: secondCat?.name || "Uncategorized",
      second_category_share_pct: secondCat?.shareOfLifestyle || "0%",
      late_night_spend_flag: data.foodAndGroceries.totalOrders > 10 ? "high" : data.foodAndGroceries.totalOrders > 5 ? "med" : "low",
      late_night_intensity: `${data.foodAndGroceries.totalOrders} food/grocery orders tracked`,
      weekend_spike_flag: true,
      spike_days_per_week: "2-3",
      money_personality_label: savingsPct > 20 ? "Disciplined saver" : savingsPct > 10 ? "Weekend splurger" : "Convenience spender",
      saving_vibe: savingsPct > 15 ? "save first" : "save later",
    },
    persona: {
      user_guess_savings_pct: "20%",
      actual_savings_pct: `~${savingsPct}%`,
      savings_gap: `${savingsPct - 20} pts`,
      user_guess_category: topCat?.name || "Food",
      user_guess_category_pct: "15%",
      actual_category_pct: topCat?.shareOfLifestyle || "0%",
      category_gap: `+${parseInt(topCat?.shareOfLifestyle || "0") - 15} pts`,
      persona_guess: "Disciplined",
      persona_actual: savingsPct > 20 ? "Disciplined saver" : savingsPct > 10 ? "Weekend splurger" : "Convenience spender",
    },
    goal: {
      goal_name: "Emergency fund",
      goal_type: "Emergency fund",
      goal_amount: "₹5L",
      horizon: "12 months",
      required_savings_pct: "18%",
      current_savings_pct: `${savingsPct}%`,
      savings_gap_pct: `+${18 - savingsPct}%`,
      is_on_track: savingsPct >= 15,
      days_ahead_behind: savingsPct >= 18 ? "~3 days ahead" : `~${Math.round((18 - savingsPct) * 2)} days behind`,
      accumulated_savings: formatINR(totalInvested),
    },
    action: {
      suggested_cut_amount_month: formatINR(Math.round((topCat?.monthlyAverage || 0) * 0.25)),
      suggested_cut_category: topCat?.name || "Food",
      suggested_cut_description: `${formatINR(Math.round((topCat?.monthlyAverage || 0) * 0.25))}/month equivalent`,
      suggested_autosave_day: formatINR(Math.round(((topCat?.monthlyAverage || 0) * 0.25) / 30)),
      suggested_rd_month: formatINR(Math.round((topCat?.monthlyAverage || 0) * 0.5)),
      idle_cash_claim: formatINR(Math.round(data.accountInfo.currentBalance * 0.5)),
      bill_risk_event: "EMI due soon",
      surplus_amount: formatINR(data.accountInfo.currentBalance),
    },
    suggested_budgets: suggestedBudgets,
    receipts,
    pace_presets: computePacePresets(500000), // Default ₹5L goal
    tradeoff_rules: {
      bucket_options: [
        {
          id: "bucket-1k",
          label: "₹1k/month bucket",
          monthly_cost: "₹1k",
          extend_timeline: "Adds ~2 weeks to your goal timeline.",
          reduce_elsewhere: "Trim 1 delivery/week to keep the same timeline.",
          nudge_text: "I'll nudge you before late-night delivery to keep this on track.",
          cap_text: "Soft cap set at ₹1k/month for this category.",
        },
        {
          id: "bucket-2k",
          label: "₹2k/month bucket",
          monthly_cost: "₹2k",
          extend_timeline: "Adds ~1 month to your goal timeline.",
          reduce_elsewhere: `Trim ${topCat?.name || "Food"} by ₹2k to keep pace.`,
          nudge_text: "I'll nudge you before weekend spikes to stay on pace.",
          cap_text: "Soft cap set at ₹2k/month for this category.",
        },
        {
          id: "bucket-3k",
          label: "₹3k/month bucket",
          monthly_cost: "₹3k",
          extend_timeline: "Adds ~6 weeks to your goal timeline.",
          reduce_elsewhere: "Reduce weekend spikes by ₹3k to stay on pace.",
          nudge_text: "I'll flag bigger spends before they hit this bucket.",
          cap_text: "Soft cap set at ₹3k/month for this category.",
        },
      ],
      tradeoff_choices: {
        reduce_elsewhere: "Reduce elsewhere",
        extend_timeline: "Extend goal timeline",
      },
    },
    goal_completion_actions: [
      {
        paceId: "aggressive",
        productType: "RD",
        headline: "Start a ₹10k RD + make cuts",
        copy: "With this finalized budget, you'll need aggressive cuts.\n\nOne way to make this easier: park the savings in an RD at month start. The money's locked away before you can spend it.",
        primary_cta: "Start RD ₹10k",
        secondary_cta: "Make it smaller",
      },
      {
        paceId: "balanced",
        productType: "RD",
        headline: "Start a ₹5k RD + light cuts",
        copy: "With this finalized budget, you'll need moderate cuts.\n\nOne way to stay on track: park savings in an RD at month start. Small cuts plus automatic savings makes this pace feel doable.",
        primary_cta: "Start RD ₹5k",
        secondary_cta: "Show other amounts",
      },
      {
        paceId: "relaxed",
        productType: "Autosave",
        headline: "Auto-save daily",
        copy: "You're already close to this pace - no major cuts needed.\n\nOne way to protect your progress: set up daily auto-save. It quietly builds up without you noticing.",
        primary_cta: "Turn on auto-save",
        secondary_cta: "Make it smaller",
      },
    ],
    insights: [
      {
        id: "insight-food",
        type: "behavior",
        message: `You've spent ${formatINR(data.foodAndGroceries.totalSpend)} on food & groceries across ${data.foodAndGroceries.totalOrders} orders. Average ${formatINR(data.foodAndGroceries.avgOrderValue)} per order.`,
        chips: ["Rate my spends", "Can I afford…", "Understand my money"],
      },
      {
        id: "insight-invest",
        type: "goal",
        message: `You've invested ${formatINR(totalInvested)} total. That's ${savingsPct}% of your income going to investments. Keep it going!`,
        chips: ["Progress", "Boost goal", "Understand my money"],
      },
      {
        id: "insight-balance",
        type: "risk",
        message: `Current balance: ${formatINR(data.accountInfo.currentBalance)}. With upcoming EMIs and SIPs, keep an eye on your runway.`,
        chips: ["Can I afford…", "Show bills", "Progress"],
      },
      {
        id: "insight-categories",
        type: "opportunity",
        message: `Your top lifestyle spend is ${topCat?.name || "unknown"} at ${topCat?.shareOfLifestyle || "?"}. Want to explore ways to optimize?`,
        chips: ["Understand my money", "Rate my spends", "Can I afford…"],
      },
      {
        id: "insight-playful",
        type: "playful",
        message: `Your ${topCat?.name || "top category"} and your bank balance are in a toxic relationship. Want to mediate?`,
        chips: ["Rate my spends", "Progress", "Understand my money"],
      },
    ],

    // Extended fields
    monthlyBreakdown: data.monthlyBreakdown as DerivedProfile["monthlyBreakdown"],
    investmentSummary: {
      totalInvested,
      breakdown: investmentBreakdown,
    },
    accountBalance: data.accountInfo.currentBalance,
    dataRange: {
      from: data.dateRange.from,
      to: data.dateRange.to,
      months,
      totalTransactions: data.dateRange.totalTransactions,
    },
    lifestyleCategories: categories,
    foodBreakdown: data.foodAndGroceries,
  };

  return profile;
}

// ============ DATA-DRIVEN HELPERS ============

export type BudgetLever = {
  id: string;
  label: string;
  category: string;
  currentMonthly: number;
  suggestedMonthly: number;
  savings: number;
};

export function computeBudgetLevers(monthlyCutNeeded: number): BudgetLever[] {
  const categories = getLifestyleCategories();
  const levers: BudgetLever[] = [];

  // Propose ~30% trims on real top-spend categories
  for (const cat of categories.slice(0, 5)) {
    const trimPct = 0.3;
    const suggestedMonthly = Math.ceil((cat.monthlyAverage * (1 - trimPct)) / 500) * 500;
    const savings = cat.monthlyAverage - suggestedMonthly;
    if (savings > 0) {
      levers.push({
        id: `trim-${cat.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        label: `Trim ${cat.name} ${formatINR(cat.monthlyAverage)}→${formatINR(suggestedMonthly)}`,
        category: cat.name,
        currentMonthly: cat.monthlyAverage,
        suggestedMonthly,
        savings,
      });
    }
  }

  return levers;
}

export type LeakInsight = {
  category: string;
  monthlyAvg: number;
  volatility: number; // coefficient of variation
  peakMonth: string;
  peakAmount: number;
  troughMonth: string;
  troughAmount: number;
  suggestion: string;
  suggestedCut: number;
};

export function computeLeakInsights(): LeakInsight[] {
  const months = getMonthCount();
  const insights: LeakInsight[] = [];

  // Analyze spending volatility per category across months
  for (const [catName, catData] of Object.entries(data.categoryWiseSpend)) {
    if (EXCLUDED_CATEGORIES.includes(catName)) continue;
    if (catData.transactionCount < 3) continue;

    // Group transactions by month
    const monthlyTotals: Record<string, number> = {};
    for (const txn of catData.transactions) {
      const month = txn.date.substring(0, 7); // "YYYY-MM"
      monthlyTotals[month] = (monthlyTotals[month] || 0) + txn.amount;
    }

    const monthAmounts = Object.entries(monthlyTotals);
    if (monthAmounts.length < 2) continue;

    const amounts = monthAmounts.map(([, a]) => a);
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const variance = amounts.reduce((s, a) => s + (a - avg) ** 2, 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const cv = avg > 0 ? stdDev / avg : 0; // coefficient of variation

    // Only flag categories with high volatility (CV > 0.4)
    if (cv < 0.4) continue;

    // Find peak and trough months
    const sorted = [...monthAmounts].sort((a, b) => b[1] - a[1]);
    const peakEntry = sorted[0];
    const troughEntry = sorted[sorted.length - 1];

    const suggestedCut = Math.round(avg * 0.25);
    insights.push({
      category: catName,
      monthlyAvg: Math.round(avg),
      volatility: Math.round(cv * 100) / 100,
      peakMonth: peakEntry[0],
      peakAmount: Math.round(peakEntry[1]),
      troughMonth: troughEntry[0],
      troughAmount: Math.round(troughEntry[1]),
      suggestion: `${catName} swings between ${formatINR(troughEntry[1])} and ${formatINR(peakEntry[1])} monthly. Stabilize at ~${formatINR(Math.round(avg))} to save ${formatINR(suggestedCut)}/month.`,
      suggestedCut,
    });
  }

  // Sort by volatility (most volatile first)
  return insights.sort((a, b) => b.volatility - a.volatility);
}

type RatingTransaction = {
  id: string;
  time: string;
  category: string;
  amount: string;
  amountNum: number;
  merchant: string;
  date: string;
};

export function getRecentTransactionsForRating(): RatingTransaction[] {
  const transactions: RatingTransaction[] = [];

  // Pull actual transactions from all lifestyle categories
  for (const [catName, catData] of Object.entries(data.categoryWiseSpend)) {
    if (EXCLUDED_CATEGORIES.includes(catName)) continue;

    for (const txn of catData.transactions.slice(-5)) {
      const date = new Date(txn.date);
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayName = dayNames[date.getDay()];

      let merchant = catName.split("(")[1]?.replace(")", "") || catName.split(" ")[0];
      if (txn.narration.includes("SWIGGY")) merchant = "Swiggy";
      else if (txn.narration.includes("AMAZON")) merchant = "Amazon";
      else if (txn.narration.includes("INSTAMART")) merchant = "Instamart";

      transactions.push({
        id: `rtxn-${txn.date}-${txn.amount}`,
        time: `${dayName} ${date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`,
        category: catName,
        amount: formatINR(txn.amount),
        amountNum: txn.amount,
        merchant,
        date: txn.date,
      });
    }
  }

  // Sort by date descending, take most recent 15
  return transactions
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 15);
}

// Export raw data for AI system prompt
export function getFinancialSummaryForAI(): string {
  const months = getMonthCount();
  const categories = getLifestyleCategories();
  const food = data.foodAndGroceries;

  let summary = `FINANCIAL DATA SUMMARY (${data.dateRange.from} to ${data.dateRange.to}, ${months} months, ${data.dateRange.totalTransactions} transactions)\n\n`;

  summary += `ACCOUNT: ${data.accountInfo.bank} ${data.accountInfo.accountType}, Balance: ₹${data.accountInfo.currentBalance.toLocaleString("en-IN")}\n\n`;

  summary += `OVERVIEW:\n`;
  summary += `- Total Credits: ₹${data.overallSummary.totalCredits.toLocaleString("en-IN")} (${data.overallSummary.creditTransactions} txns)\n`;
  summary += `- Total Debits: ₹${data.overallSummary.totalDebits.toLocaleString("en-IN")} (${data.overallSummary.debitTransactions} txns)\n`;
  summary += `- Net Outflow: ₹${data.overallSummary.netOutflow.toLocaleString("en-IN")}\n\n`;

  summary += `SPEND BREAKDOWN:\n`;
  summary += `- Lifestyle: ₹${data.spendBreakdown.lifestyleSpending.toLocaleString("en-IN")}\n`;
  summary += `- Investments: ₹${data.spendBreakdown.investments.toLocaleString("en-IN")}\n`;
  summary += `- Real Estate: ₹${data.spendBreakdown.realEstate.toLocaleString("en-IN")}\n`;
  summary += `- Credit Card Payments: ₹${data.spendBreakdown.creditCardPayments.toLocaleString("en-IN")}\n`;
  summary += `- Cash Withdrawals: ₹${data.spendBreakdown.cashWithdrawals.toLocaleString("en-IN")}\n`;
  summary += `- Loan EMI: ₹${data.spendBreakdown.loanEMI.toLocaleString("en-IN")}\n\n`;

  summary += `LIFESTYLE CATEGORIES (excl. transfers, CC payments, investments, real estate):\n`;
  for (const cat of categories) {
    summary += `- ${cat.name}: ₹${cat.totalAmount.toLocaleString("en-IN")} (${cat.transactionCount} txns, avg ₹${Math.round(cat.avgPerTransaction).toLocaleString("en-IN")}/txn, ~₹${cat.monthlyAverage.toLocaleString("en-IN")}/month, ${cat.shareOfLifestyle})\n`;
  }

  summary += `\nFOOD & GROCERIES DETAIL:\n`;
  summary += `- Total: ₹${food.totalSpend.toLocaleString("en-IN")} across ${food.totalOrders} orders (avg ₹${food.avgOrderValue.toLocaleString("en-IN")}/order)\n`;
  for (const [name, item] of Object.entries(food.breakdown)) {
    summary += `  - ${name}: ₹${item.total.toLocaleString("en-IN")} (${item.count} orders, avg ₹${item.avg.toLocaleString("en-IN")})\n`;
  }

  summary += `\nINVESTMENTS:\n`;
  summary += `- Total Invested: ₹${((data.investmentActivity.totalInvested as number) || 0).toLocaleString("en-IN")}\n`;
  for (const [key, val] of Object.entries(data.investmentActivity)) {
    if (key === "totalInvested") continue;
    const item = val as { total: number; count: number };
    summary += `  - ${key}: ₹${item.total.toLocaleString("en-IN")} (${item.count} txns)\n`;
  }

  summary += `\nRECURRING PAYMENTS:\n`;
  summary += `- Total ACH: ${data.recurringPayments.totalACHDebits} debits, ₹${data.recurringPayments.totalACHAmount.toLocaleString("en-IN")}\n`;
  summary += `- SIP Patterns: ${data.recurringPayments.sipPatterns.map((s) => `₹${s.amount} x${s.frequency}`).join(", ")}\n`;

  return summary;
}
