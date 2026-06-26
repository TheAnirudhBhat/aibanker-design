import type { Question } from "@/app/components/QuestionnaireOverlay";
import type { LadderTier } from "@/app/lib/types";
import { LADDER_OPTIONS } from "./gbpFlowFixture";

// Pace word colour-codes the trade-off: comfortable = positive (green), realistic = warning (amber),
// stretch = negative (red). The colour itself describes how hard the pace is.
const TIER_INTENT: Record<LadderTier, "positive" | "warning" | "negative"> = {
  comfortable: "positive",
  realistic: "warning",
  stretch: "negative",
};

export const SAVINGS_TIER_QUESTION: Question = {
  id: "savings-tier",
  text: "How much to save a month?",
  options: LADDER_OPTIONS.map((opt) => ({
    id: opt.tier,
    label: opt.tier,
    // Full rupee amount (e.g. ₹5,000); pace word rides as a colour-coded tag on the right.
    title: `₹${opt.monthlyAmount.toLocaleString("en-IN")}`,
    tag: { label: opt.tier, intent: TIER_INTENT[opt.tier] },
  })),
};
