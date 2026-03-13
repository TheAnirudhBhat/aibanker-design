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

export type ChatResponse = {
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

export type FlowStep = "wrapped" | "persona" | "reality" | "goal" | "budget" | "home";

export type PersonaStage = "q1" | "q2" | "q2-follow" | "q3" | "q4";
export type GoalStage = "choice" | "timeline" | "amount" | "savings" | "pace" | "budget-review" | "product" | "pinned";
export type BudgetStage = "digest" | "onTrack" | "lever" | "budgetChoice" | "budgetStyle" | "action" | "actionConfirm";
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
  | "tradeoff";

// ============ PREFERENCE SYSTEM ============

export type Preference = {
  key: string;
  type: "hard" | "soft";
  value: string;
  source: string;
  createdAt: string;
};

// ============ USER STATE (persistent) ============

export type UserState = {
  userId: string;
  onboardingComplete: boolean;
  currentStep: FlowStep;
  personaStage: PersonaStage;
  goalStage: GoalStage;
  budgetStage: BudgetStage;
  personaAnswers: Record<string, string>;

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

  lastActiveAt: string;
  createdAt: string;
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
