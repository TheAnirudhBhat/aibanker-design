/**
 * Single source of truth for item statuses across playground sections.
 * Update statuses here — they propagate to visualizations, widgets, screens, and flows.
 *
 * Lifecycle: Exploring → Confirmed → Integrated
 * Discarded items: commit to git, then delete from code + this registry.
 */

export type ItemStatus = "exploring" | "confirmed" | "integrated";

/** Ordered lifecycle list — used for click-to-cycle in the playground. */
export const STATUSES: ItemStatus[] = ["exploring", "confirmed", "integrated"];

// Tag rendering config — maps status to DlsTag props
export const STATUS_TAG_PROPS: Record<ItemStatus, { intent: "brand" | "positive" | "info"; emphasis: "subtle" | "bold" }> = {
  exploring:  { intent: "brand",    emphasis: "subtle" },
  confirmed:  { intent: "positive", emphasis: "subtle" },
  integrated: { intent: "info",     emphasis: "bold" },
};

// ── Visualizations ────────────────────────────────────────────
export const VIZ_STATUS: Record<string, ItemStatus> = {
  "spend-overview":         "confirmed",
  "category-breakdown":     "confirmed",
  "merchant-concentration": "exploring",
  "category-mom":           "exploring",
  "spending-heatmap":       "exploring",
  "payment-mode-donut-v2":  "exploring",
  "transaction-table":      "exploring",
  "spend-trend":            "exploring",
  "goal-progress":          "confirmed",
};

// ── Widgets ───────────────────────────────────────────────────
export const WIDGET_STATUS: Record<string, ItemStatus> = {
  "investment-product":  "confirmed",
  "obligations-list-v2": "confirmed",
  "add-to-pot":          "exploring",
};

// ── Screens ───────────────────────────────────────────────────
export const SCREEN_STATUS: Record<string, ItemStatus> = {
  "feature-pdp":    "exploring",
  "goal-list":      "confirmed",
  "pot-detail":     "confirmed",
};

// ── Flows ─────────────────────────────────────────────────────
export const FLOW_STATUS: Record<string, ItemStatus> = {
  "onboarding":        "confirmed",
  "aa":                "confirmed",
  "planmode-savings":  "exploring",
  "visualizations":    "exploring",
  "app-entry-point":   "exploring",
  "degen-mode":        "exploring",
  "reddit":            "exploring",
  "refresh-session":   "exploring",
  "drawer-experience": "exploring",
};
