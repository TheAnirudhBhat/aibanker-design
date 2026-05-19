/**
 * GBP (Goal-Budget Planning) — Pure financial logic
 *
 * Derives footprint buckets, savings ladder, feasibility verdicts, and
 * category budgets from real bank data (ups_crunched.json).
 */

import rawData from "../../ups_crunched.json";
import type { RawBankData } from "./types";
import type {
  FootprintBucket,
  FootprintItem,
  LadderOption,
  LadderTier,
  CategoryBudget,
  SpendingPlan,
  Verdict,
} from "./types";
import { formatINR, getLifestyleCategories } from "./financial-data";

const data = rawData as unknown as RawBankData;

// ── Helpers ────────────────────────────────────────────────────────

function getMonthCount(): number {
  const from = new Date(data.dateRange.from);
  const to = new Date(data.dateRange.to);
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / (30 * 24 * 60 * 60 * 1000)));
}

function monthlyAvg(total: number): number {
  return Math.round(total / getMonthCount());
}

// ── 1. Classify bank data into 5 footprint buckets ─────────────────

export function classifyIntoBuckets(): FootprintBucket[] {
  const months = getMonthCount();
  const buckets: FootprintBucket[] = [];

  // --- Bucket 1: Income sources ---
  const incomeItems: FootprintItem[] = [];
  // Detect salary from monthly credits (largest recurring credit)
  const monthlyCredits: Record<string, number> = {};
  for (const [month, mData] of Object.entries(data.monthlyBreakdown)) {
    monthlyCredits[month] = mData.totalCredits;
  }
  const avgMonthlyCredit = Math.round(
    Object.values(monthlyCredits).reduce((s, v) => s + v, 0) / months
  );
  incomeItems.push({
    id: "income-salary",
    label: "Salary / primary income",
    amount: avgMonthlyCredit,
    type: "salary",
    frequency: "monthly",
    confirmed: false,
  });

  buckets.push({
    bucketType: "income",
    title: "Income sources",
    description: "Here's what I see coming in regularly. Confirm what's accurate so I can build your plan on solid numbers.",
    items: incomeItems,
  });

  // --- Bucket 2: Obligations ---
  const obligationItems: FootprintItem[] = [];

  // Real estate EMIs
  if (data.spendBreakdown.realEstate > 0) {
    const realEstateMonthly = monthlyAvg(data.spendBreakdown.realEstate);
    // Split by known categories
    for (const [catName, catData] of Object.entries(data.categoryWiseSpend)) {
      if (catName.includes("Real Estate")) {
        const label = catName.replace("Real Estate (", "").replace(")", "");
        obligationItems.push({
          id: `obligation-${label.toLowerCase().replace(/\s+/g, "-")}`,
          label: `${label} EMI`,
          amount: monthlyAvg(catData.totalAmount),
          type: "EMI",
          frequency: "monthly",
          confirmed: false,
        });
      }
    }
  }

  // Loan EMIs
  if (data.spendBreakdown.loanEMI > 0) {
    obligationItems.push({
      id: "obligation-loan-emi",
      label: "Loan EMI",
      amount: monthlyAvg(data.spendBreakdown.loanEMI),
      type: "EMI",
      frequency: "monthly",
      confirmed: false,
    });
  }

  // SIPs / recurring investments
  for (const sip of data.recurringPayments.sipPatterns) {
    obligationItems.push({
      id: `obligation-sip-${sip.amount}`,
      label: `SIP / mandate ₹${sip.amount.toLocaleString("en-IN")}`,
      amount: sip.amount,
      type: "SIP",
      frequency: "monthly",
      confirmed: false,
    });
  }

  // Credit card payments (recurring)
  for (const [catName, catData] of Object.entries(data.categoryWiseSpend)) {
    if (catName.startsWith("Credit Card Payments")) {
      const label = catName.replace("Credit Card Payments (", "").replace(")", "");
      const monthly = monthlyAvg(catData.totalAmount);
      if (monthly > 0) {
        obligationItems.push({
          id: `obligation-cc-${label.toLowerCase()}`,
          label: `${label} credit card`,
          amount: monthly,
          type: "Credit card",
          frequency: "monthly",
          confirmed: false,
        });
      }
    }
  }

  if (obligationItems.length > 0) {
    buckets.push({
      bucketType: "obligations",
      title: "Obligations",
      description: "These are your committed monthly expenses. Anything missing or wrong?",
      items: obligationItems,
    });
  }

  // --- Bucket 3: P2P transfers ---
  const selfTransferMonthly = monthlyAvg(data.spendBreakdown.selfTransfers);
  if (selfTransferMonthly > 5000) {
    // Only show if meaningful
    const p2pItems: FootprintItem[] = [{
      id: "p2p-self-transfers",
      label: "Self transfers (across accounts)",
      amount: selfTransferMonthly,
      type: "self-transfer",
      frequency: "monthly",
      confirmed: false,
    }];

    buckets.push({
      bucketType: "p2p",
      title: "P2P transfers",
      description: "You're moving meaningful amounts between accounts. Confirming means I'll treat the net amount as a recurring flow.",
      items: p2pItems,
    });
  }

  // --- Bucket 4: Sporadic income ---
  // Detect months with credits significantly above average
  const sporadicIncomeItems: FootprintItem[] = [];
  for (const [month, mData] of Object.entries(data.monthlyBreakdown)) {
    if (mData.totalCredits > avgMonthlyCredit * 1.5) {
      const surplus = mData.totalCredits - avgMonthlyCredit;
      sporadicIncomeItems.push({
        id: `sporadic-in-${month}`,
        label: `Unusual credit in ${new Date(month + "-01").toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`,
        amount: surplus,
        type: "bonus-or-refund",
        frequency: "one-off",
        confirmed: false,
      });
    }
  }

  if (sporadicIncomeItems.length > 0) {
    buckets.push({
      bucketType: "sporadic-income",
      title: "Sporadic income",
      description: "These look like one-offs — not something to plan around monthly. Flag any that are actually recurring.",
      items: sporadicIncomeItems,
    });
  }

  // --- Bucket 5: Sporadic expenses ---
  const sporadicExpenseItems: FootprintItem[] = [];
  // Large one-off transactions from uncategorized
  const otherCat = data.categoryWiseSpend["Other / Uncategorized"];
  if (otherCat) {
    const monthlyOther = monthlyAvg(otherCat.totalAmount);
    for (const txn of otherCat.transactions) {
      if (txn.amount > monthlyOther * 2) {
        sporadicExpenseItems.push({
          id: `sporadic-out-${txn.date}-${txn.amount}`,
          label: `Large expense on ${new Date(txn.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`,
          amount: txn.amount,
          type: "one-off",
          frequency: "one-off",
          confirmed: false,
        });
      }
    }
  }

  if (sporadicExpenseItems.length > 0) {
    buckets.push({
      bucketType: "sporadic-expense",
      title: "Sporadic expenses",
      description: "These look like one-offs — not something to plan around monthly. Flag any that are actually recurring.",
      items: sporadicExpenseItems,
    });
  }

  return buckets;
}

// ── 2. Savings ladder (3 tiers) ────────────────────────────────────

export function calculateLadder(
  monthlyIncome: number,
  monthlyObligations: number
): LadderOption[] {
  const discretionary = monthlyIncome - monthlyObligations;
  const categories = getLifestyleCategories();

  // Comfortable: ~10-15% of discretionary, no cuts needed
  const comfortable = Math.round(discretionary * 0.12);

  // Realistic: ~20-25% of discretionary, 1-2 category cuts
  const realistic = Math.round(discretionary * 0.22);

  // Stretch: ~35-40% of discretionary, 3+ category cuts
  const stretch = Math.round(discretionary * 0.38);

  return [
    {
      tier: "comfortable" as LadderTier,
      monthlyAmount: Math.ceil(comfortable / 500) * 500,
      description: "This is what you can save without changing a thing.",
      categoryCuts: 0,
    },
    {
      tier: "realistic" as LadderTier,
      monthlyAmount: Math.ceil(realistic / 500) * 500,
      description: "Doable with a couple of small tightens.",
      categoryCuts: 2,
    },
    {
      tier: "stretch" as LadderTier,
      monthlyAmount: Math.ceil(stretch / 500) * 500,
      description: "Ambitious — some months will feel tight.",
      categoryCuts: Math.min(categories.length, 4),
    },
  ];
}

// ── 3. Goal-derived monthly amount ─────────────────────────────────

export function goalToMonthly(targetAmount: number, months: number): number {
  return Math.ceil(targetAmount / months);
}

// ── 4. Rate to monthly amount ──────────────────────────────────────

export function rateToMonthly(ratePct: number, monthlyIncome: number): number {
  return Math.round(monthlyIncome * (ratePct / 100));
}

// ── 5. Feasibility check → verdict + category budgets ──────────────

export function calculateFeasibility(
  monthlyIncome: number,
  monthlyObligations: number,
  monthlySavingsTarget: number
): SpendingPlan {
  const dailyPool = monthlyIncome - monthlyObligations - monthlySavingsTarget;
  const categories = getLifestyleCategories();
  const months = getMonthCount();

  // Determine verdict
  let verdict: Verdict;
  let maxAchievable: number | undefined;

  if (monthlyIncome <= monthlyObligations) {
    verdict = "impossible";
  } else if (dailyPool < 0) {
    verdict = "infeasible";
    // Calculate what's actually achievable (stretch = 38% of discretionary)
    const discretionary = monthlyIncome - monthlyObligations;
    maxAchievable = Math.ceil(discretionary * 0.38 / 500) * 500;
  } else {
    // How much of lifestyle spending needs to be cut?
    const totalLifestyle = categories.reduce((s, c) => s + c.monthlyAverage, 0);
    const cutNeeded = totalLifestyle - dailyPool;

    if (cutNeeded <= 0) {
      verdict = "comfortable";
    } else {
      const cutPct = cutNeeded / totalLifestyle;
      if (cutPct <= 0.15) {
        verdict = "feasible";
      } else if (cutPct <= 0.35) {
        verdict = "tight";
      } else {
        verdict = "infeasible";
        maxAchievable = Math.ceil((monthlyIncome - monthlyObligations) * 0.38 / 500) * 500;
      }
    }
  }

  // Build category budgets
  const categoryBudgets: CategoryBudget[] = [];
  const totalLifestyle = categories.reduce((s, c) => s + c.monthlyAverage, 0);
  const scaleFactor = dailyPool > 0 && totalLifestyle > 0
    ? Math.min(1, dailyPool / totalLifestyle)
    : 1;

  let biggestCutAmount = 0;
  let biggestCutIndex = -1;

  for (let i = 0; i < Math.min(categories.length, 6); i++) {
    const cat = categories[i];
    const cap = Math.ceil((cat.monthlyAverage * scaleFactor) / 500) * 500;
    const rangeMin = Math.ceil(cap * 0.75 / 500) * 500;
    const rangeMax = Math.ceil(cap * 1.25 / 500) * 500;
    const cutAmount = cat.monthlyAverage - cap;

    if (cutAmount > biggestCutAmount) {
      biggestCutAmount = cutAmount;
      biggestCutIndex = i;
    }

    categoryBudgets.push({
      name: cat.name,
      cap,
      rangeMin,
      rangeMax,
      isBiggestCut: false,
    });
  }

  // Mark biggest cut
  if (biggestCutIndex >= 0) {
    categoryBudgets[biggestCutIndex].isBiggestCut = true;
  }

  return {
    income: monthlyIncome,
    obligations: monthlyObligations,
    savingsTarget: monthlySavingsTarget,
    dailyPool: Math.max(0, dailyPool),
    categoryBudgets,
    verdict: {
      verdict,
      maxAchievable,
    },
  };
}

// ── 6. External balance seeding suggestion ─────────────────────────

export function shouldSuggestSeed(
  verdict: Verdict,
  externalBalance: number,
  monthlyObligations: number
): { suggest: boolean; seedAmount: number; reason: string } {
  // Never suggest if balance is too low (≤ 1 month of obligations)
  const buffer = monthlyObligations;
  const surplus = externalBalance - buffer;

  if (surplus <= 0 || verdict === "comfortable" || verdict === "impossible") {
    return { suggest: false, seedAmount: 0, reason: "" };
  }

  const seedAmount = Math.floor(surplus * 0.7 / 1000) * 1000; // 70% of surplus, rounded

  if (verdict === "infeasible") {
    return {
      suggest: true,
      seedAmount,
      reason: `A one-time ${formatINR(seedAmount)} transfer from HDFC could bring your goal into range.`,
    };
  }

  return {
    suggest: true,
    seedAmount,
    reason: `Move ${formatINR(seedAmount)} from HDFC to bring your goal forward.`,
  };
}

// ── 7. Safety warnings ─────────────────────────────────────────────

export function checkSafetyWarnings(
  monthlyIncome: number,
  totalSavingsCommitment: number
): string | null {
  const pct = (totalSavingsCommitment / monthlyIncome) * 100;
  if (pct > 30) {
    return `You're committing ${Math.round(pct)}% of income to savings. Works in normal months but a bad month leaves little room. Continue?`;
  }
  return null;
}
