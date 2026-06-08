import type { MockProfile } from "../data/mockProfiles";

// ============ UPS_CRUNCHED.JSON SCHEMA ============

export type Transaction = {
  date: string;
  amount: number;
  narration: string;
};

export type CategoryData = {
  totalAmount: number;
  transactionCount: number;
  avgPerTransaction: number;
  transactions: Transaction[];
};

export type MonthlyData = {
  totalDebits: number;
  totalCredits: number;
  netFlow: number;
  debitCount: number;
  creditCount: number;
  topCategories: Record<string, number>;
};

export type SIPPattern = {
  amount: number;
  frequency: number;
};

export type FoodBreakdownItem = {
  total: number;
  count: number;
  avg: number;
};

export type InvestmentItem = {
  total: number;
  count: number;
};

export type RawBankData = {
  description: string;
  accountInfo: {
    bank: string;
    branch: string;
    ifsc: string;
    accountType: string;
    status: string;
    openingDate: string;
    holderName: string;
    balanceAsOf: string;
    currentBalance: number;
  };
  dateRange: {
    from: string;
    to: string;
    totalTransactions: number;
  };
  overallSummary: {
    totalDebits: number;
    totalCredits: number;
    netOutflow: number;
    debitTransactions: number;
    creditTransactions: number;
    avgDebitAmount: number;
    avgCreditAmount: number;
  };
  spendBreakdown: {
    lifestyleSpending: number;
    investments: number;
    realEstate: number;
    creditCardPayments: number;
    selfTransfers: number;
    cashWithdrawals: number;
    loanEMI: number;
  };
  categoryWiseSpend: Record<string, CategoryData>;
  monthlyBreakdown: Record<string, MonthlyData>;
  topMerchants: unknown[];
  recurringPayments: {
    totalACHDebits: number;
    totalACHAmount: number;
    sipPatterns: SIPPattern[];
  };
  foodAndGroceries: {
    totalSpend: number;
    totalOrders: number;
    avgOrderValue: number;
    breakdown: Record<string, FoodBreakdownItem>;
  };
  investmentActivity: Record<string, InvestmentItem | number>;
  cashWithdrawals: {
    total: number;
    count: number;
    avg: number;
    transactions: Transaction[];
  };
};

// ============ DERIVED PROFILE ============

export type DerivedProfile = MockProfile & {
  monthlyBreakdown: Record<string, MonthlyData>;
  investmentSummary: {
    totalInvested: number;
    breakdown: Record<string, { total: number; count: number }>;
  };
  accountBalance: number;
  dataRange: { from: string; to: string; months: number; totalTransactions: number };
  lifestyleCategories: CategorySummary[];
  foodBreakdown: {
    totalSpend: number;
    totalOrders: number;
    avgOrderValue: number;
    breakdown: Record<string, FoodBreakdownItem>;
  };
};

export type CategorySummary = {
  name: string;
  totalAmount: number;
  transactionCount: number;
  avgPerTransaction: number;
  monthlyAverage: number;
  shareOfLifestyle: string;
};

// ============ API TYPES ============

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatRequest = {
  messages: ChatMessage[];
  userId: string;
  context?: {
    currentGoal?: string;
    currentPace?: string;
    currentBudgetStyle?: string;
    recentFlow?: string;
  };
};

type ChatResponse = {
  message: string;
  stream?: ReadableStream;
};

export type MemoryRequest = {
  userId: string;
  type: string;
  value: string;
};

export type Memory = {
  id: string;
  memory: string;
  created_at?: string;
};

// ============ FLOW STEP TYPES ============

type FlowStep = "wrapped" | "reality" | "goal" | "budget" | "home";

type GoalStage = "choice" | "destination" | "timeline" | "amount" | "savings-ask" | "plan" | "plan-adjust" | "pinned";
type BudgetStage = "obligations" | "digest" | "onTrack" | "lever" | "budgetChoice" | "budgetStyle" | "action" | "actionConfirm";
export type HomeSubflow =
  | "idle"
  | "afford-amount"
  | "afford-category"
  | "afford-fullpicture"
  | "afford-alternatives"
  | "swipe-rating"
  | "swipe-patterns"
  | "swipe-actions"
  | "progress-status"
  | "progress-ahead"
  | "progress-behind"
  | "progress-ontrack"
  | "understand-menu"
  | "understand-categories"
  | "understand-patterns"
  | "understand-benchmarks"
  | "understand-personality"
  | "leak-insight"
  | "leak-investigate"
  | "leak-solution"
  | "tradeoff"
  | "recap"
  | "roast";

// ============ PREFERENCE SYSTEM ============

type Preference = {
  key: string;
  type: "hard" | "soft";
  value: string;
  source: string;
  createdAt: string;
};

// ============ OBLIGATION / BIG EXPENSE TYPES ============

type ObligationItem = {
  id: string;
  payee: string;
  amount: number;
  type: string;
  frequency: string;
  seenMonths: string;
  lastPaid: string;
  confidence: number;
};

type BigExpenseItem = {
  id: string;
  payee: string;
  date: string;
  type: string;
  amount: number;
  narration?: string;
};

// ============ USER STATE (persistent) ============

export type UserState = {
  userId: string;
  onboardingComplete: boolean;
  currentStep: FlowStep;
  goalStage: GoalStage;
  budgetStage: BudgetStage;

  obligations: {
    confirmed: { payee: string; amount: number; type: string }[];
    totalFixed: number;
    remainingAfterFixed: number;
  } | null;

  goal: {
    name: string;
    timeline: string;
    timelineMonths: number;
    amount: string;
    amountNum: number;
    savingsAllocated: number;
    paceId: "aggressive" | "balanced" | "relaxed";
    createdAt: string;
  } | null;

  budgetOverrides: Record<string, number>;
  budgetStyle: "strict" | "chill" | "bucket" | null;
  bufferAmount: number;
  bufferRemaining: number;

  products: Array<{
    type: "autosave" | "rd" | "fd";
    amount: number;
    frequency: "daily" | "monthly" | "once";
    activatedAt: string;
    active: boolean;
  }>;

  preferences: Preference[];

  spendRatings: Array<{
    txnId: string;
    category: string;
    amount: number;
    rating: "worth" | "regret" | "meh";
    timeOfDay: string;
    ratedAt: string;
  }>;

  nudges: Array<{
    type: "spending-alert" | "time-cap" | "soft-cap";
    category: string;
    threshold?: number;
    active: boolean;
  }>;

  activeFlow: {
    homeSubflow: HomeSubflow;
    subflowData: Record<string, string>;
  } | null;

  voice: "ryan" | "byron";

  onboardingAaMode?: "required" | "optional";
  onboardingIntroduceByron?: boolean;
  onboardingGoalRequired?: boolean;
  onboardingByronGatedByAa?: boolean;

  lastActiveAt: string;
  createdAt: string;
};

// ============ ANCHOR UNITS (Goal + Pool) ============

// Per gbp_flow.md §2: one Goal + one Pool can be active at a time.
// Goal: has deadline + target. Pool: open-ended, optional target.
export type Pool = {
  id: string;
  name: string;
  saved: number;
  target?: number;
  monthlyAmount: number;
  icon: string;
  ringColor: string;
  gradient?: string;
  heroEmoji?: string;
  heroScene?: string;
};

// ============ GBP (Goal-Budget Planning) TYPES ============

/** Two destination types - max 1 of each active at a time */
export type DestinationType = "goal" | "pool";

export type GBPGoal = {
  name: string;
  targetAmount: number;
  deadline: string; // ISO date
  monthlyContribution: number;
  createdAt: string;
};

export type GBPPool = {
  name: string;
  monthlyContribution: number;
  balance: number;
  targetAmount?: number; // optional for pools
  status: "active" | "paused" | "dissolved";
  createdAt: string;
};

/** How the user expressed "how much" */
export type AmountMethod = "goal-derived" | "ladder" | "rate";

/** Savings ladder tiers for vague intent */
export type LadderTier = "comfortable" | "realistic" | "stretch";

export type LadderOption = {
  tier: LadderTier;
  monthlyAmount: number;
  description: string;
  categoryCuts: number; // how many categories need adjustment
};

/** Five verdicts from feasibility check */
export type Verdict = "comfortable" | "feasible" | "tight" | "infeasible" | "impossible";

export type VerdictResult = {
  verdict: Verdict;
  maxAchievable?: number; // for infeasible
  postponedDeadline?: string; // for infeasible alt
  reducedTarget?: number; // for infeasible alt
};

/** Financial footprint - 5 buckets */
export type FootprintBucketType = "income" | "obligations" | "p2p" | "sporadic-income" | "sporadic-expense";

export type FootprintItem = {
  id: string;
  label: string;
  amount: number;
  type: string; // "salary", "rent", "EMI", etc.
  frequency: string; // "monthly", "one-off"
  confirmed: boolean;
};

export type FootprintBucket = {
  bucketType: FootprintBucketType;
  title: string;
  description: string;
  items: FootprintItem[];
};

/** Category budget — new cap vs. user's current monthly spend */
export type CategoryBudget = {
  name: string;
  cap: number;
  currentSpend: number;
  isBiggestCut: boolean;
};

/** Full spending plan */
export type SpendingPlan = {
  income: number;
  obligations: number;
  savingsTarget: number;
  dailyPool: number;
  categoryBudgets: CategoryBudget[];
  verdict: VerdictResult;
};

/** Merge flavors when Pool + Goal coexist */
export type MergeFlavor = "soft" | "hard";

export type MergeOption = {
  flavor: MergeFlavor;
  description: string;
  reversible: boolean;
};

/** Shortfall handling */
export type ShortfallOption = "skip" | "reduce-next" | "withdraw";

export type ShortfallAction = {
  option: ShortfallOption;
  message: string;
  impact?: string; // e.g. "Trip slips ~1 month"
};

/** GBP journey step (4-step linear) */
export type GBPStep = "goal-setup" | "footprint-walk" | "spending-plan" | "lock-in";

/** GBP flow state */
export type GBPFlowState = {
  step: GBPStep;
  destinationType: DestinationType;
  amountMethod: AmountMethod;
  activeBucket: number; // 0-4 index into footprint walk
  goal: GBPGoal | null;
  pool: GBPPool | null;
  spendingPlan: SpendingPlan | null;
  ladderSelection: LadderTier | null;
  ratePercentage: number | null;
  footprintBuckets: FootprintBucket[];
  locked: boolean;
};

// ============ FLOW ASSIST TYPES ============

export type FlowAction =
  | { type: "set_budget"; category: string; amount: number }
  | { type: "set_pace"; paceId: "aggressive" | "balanced" | "relaxed" }
  | { type: "set_timeline"; months: number }
  | { type: "store_preference"; key: string; preferenceType: "hard" | "soft"; value: string };

export type FlowAssistRequest = {
  userId: string;
  mode: "reason" | "copy";
  userText?: string;
  flowStage: string;
  dataContext: string;
  conversationHistory?: ChatMessage[];
};

export type FlowAssistResponse = {
  message: string;
  actions: FlowAction[];
};
