/**
 * Shared fixture data for preview variants.
 *
 * Source mock data shapes from:
 *   - app/data/mockProfiles.ts (PacePreset, InsightCard, etc.)
 *   - app/data/flows.ts (ChipOption, WrappedSlide, etc.)
 *
 * Add reusable prop objects here so multiple variants can share data
 * without duplicating it inline.
 */

import type { GoalIndicatorData } from "../components/GoalTracker";

export const singleGoal: GoalIndicatorData = {
  id: "1",
  name: "Trip to Japan",
  pct: 42,
  status: "on-track",
  icon: "plane",
  daysLabel: "4 months left",
  saved: 84000,
  target: 200000,
  ringColor: "#d30ad7",
  endDate: "Dec 2026",
  monthlyAmount: 10000,
  gradient: "linear-gradient(135deg, #fae2fa 0%, #d30ad7 100%)",
  heroEmoji: "plane",
  heroScene: "japan",
};

export const threeGoals: GoalIndicatorData[] = [
  singleGoal,
  {
    id: "2",
    name: "Emergency Fund",
    pct: 78,
    status: "ahead",
    icon: "shield",
    daysLabel: "12 days ahead",
    saved: 390000,
    target: 500000,
    ringColor: "#ff9a17",
    endDate: "Mar 2027",
    monthlyAmount: 15000,
    gradient: "linear-gradient(135deg, #fff3e3 0%, #ff9a17 100%)",
    heroEmoji: "shield",
  },
  {
    id: "3",
    name: "New Laptop",
    pct: 65,
    status: "on-track",
    icon: "laptop",
    daysLabel: "On track",
    saved: 48750,
    target: 75000,
    ringColor: "#00a63e",
    endDate: "Sep 2026",
    monthlyAmount: 5000,
    gradient: "linear-gradient(135deg, #e0f4e8 0%, #00a63e 100%)",
    heroEmoji: "laptop",
  },
];
