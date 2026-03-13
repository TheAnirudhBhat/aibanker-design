import { parseINR } from "./financial-data";
import type { DerivedProfile } from "./types";

/**
 * Single source of truth for effective budget lookup.
 * Returns the user's overridden budget if set, otherwise the profile's suggested budget.
 */
export function getEffectiveBudget(
  category: string,
  budgetOverrides: Record<string, number>,
  profile: DerivedProfile
): number {
  if (budgetOverrides[category] !== undefined) {
    return budgetOverrides[category];
  }
  const cat = profile.suggested_budgets.categories.find((c) => c.name === category);
  return cat ? parseINR(cat.budget) : 0;
}
