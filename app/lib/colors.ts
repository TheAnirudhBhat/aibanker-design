// DLS 2.0 Color Tokens - synced from Figma (file HBoBlZN1CrmVwO3rXeZjY0, node 2466:58841)

// ── Valentino (Brand Purple) ───────────────────────────────────
export const VALENTINO_50 = "#FAE2FA";
export const VALENTINO_100 = "#F3BAF4";
export const VALENTINO_200 = "#EA89EC";
export const VALENTINO_300 = "#E362E5";
export const VALENTINO_400 = "#DE45E1";
export const VALENTINO_500 = "#D30AD7";
export const VALENTINO_600 = "#A008A3";
export const VALENTINO_700 = "#87068A";
export const VALENTINO_800 = "#650567";
export const VALENTINO_900 = "#3F0341";
export const VALENTINO_950 = "#260227";

// ── Slate (Neutral Gray) ──────────────────────────────────────
export const SLATE_10 = "#F6F9FC";
export const SLATE_30 = "#F0F4F7";
export const SLATE_50 = "#EAEBED";
export const SLATE_100 = "#CDD0D4";
export const SLATE_300 = "#8E949D"; // not in Figma spec; kept for existing component use
export const SLATE_400 = "#78808B";
export const SLATE_500 = "#4E5866";
export const SLATE_600 = "#3B434E";
export const SLATE_700 = "#323841";
export const SLATE_800 = "#252A31";
export const SLATE_900 = "#171A1F";
export const SLATE_950 = "#090B0C";

// ── Blue ───────────────────────────────────────────────────────
export const BLUE_50 = "#E6EDF9";
export const BLUE_400 = "#5E8EDB";
export const BLUE_500 = "#2B6ACF";
export const BLUE_950 = "#081325";

// ── Green ──────────────────────────────────────────────────────
export const GREEN_50 = "#E0F4E8";
export const GREEN_400 = "#3DBB6C";
export const GREEN_500 = "#00A63E";
export const GREEN_950 = "#001E0B";

// ── Red ────────────────────────────────────────────────────────
export const RED_50 = "#F9E4E5";
export const RED_400 = "#DA535A";
export const RED_500 = "#CE1D26";
export const RED_950 = "#250507";

// ── Orange ─────────────────────────────────────────────────────
export const ORANGE_50 = "#FFF3E3";
export const ORANGE_400 = "#FFB24F";
export const ORANGE_500 = "#FF9A17";
export const ORANGE_600 = "#C27511";
export const ORANGE_950 = "#2E1C04";

// ── Alpha / Black ──────────────────────────────────────────────
export const ALPHA_BLACK_FF = "#000000";
export const ALPHA_BLACK_90 = "rgba(0,0,0,0.9)";
export const ALPHA_BLACK_80 = "rgba(0,0,0,0.8)";
export const ALPHA_BLACK_70 = "rgba(0,0,0,0.7)";
export const ALPHA_BLACK_60 = "rgba(0,0,0,0.6)";
export const ALPHA_BLACK_50 = "rgba(0,0,0,0.5)";
export const ALPHA_BLACK_40 = "rgba(0,0,0,0.4)";
export const ALPHA_BLACK_30 = "rgba(0,0,0,0.3)";
export const ALPHA_BLACK_20 = "rgba(0,0,0,0.2)";
export const ALPHA_BLACK_10 = "rgba(0,0,0,0.1)";
export const ALPHA_BLACK_05 = "rgba(0,0,0,0.05)";

// ── Alpha / White ──────────────────────────────────────────────
export const ALPHA_WHITE_FF = "#FFFFFF";
export const ALPHA_WHITE_90 = "rgba(255,255,255,0.9)";
export const ALPHA_WHITE_80 = "rgba(255,255,255,0.8)";
export const ALPHA_WHITE_70 = "rgba(255,255,255,0.7)";
export const ALPHA_WHITE_60 = "rgba(255,255,255,0.6)";
export const ALPHA_WHITE_50 = "rgba(255,255,255,0.5)";
export const ALPHA_WHITE_40 = "rgba(255,255,255,0.4)";
export const ALPHA_WHITE_30 = "rgba(255,255,255,0.3)";
export const ALPHA_WHITE_20 = "rgba(255,255,255,0.2)";
export const ALPHA_WHITE_10 = "rgba(255,255,255,0.1)";
export const ALPHA_WHITE_05 = "rgba(255,255,255,0.05)";
export const ALPHA_WHITE_00 = "rgba(255,255,255,0)";

// ── Semantic: Text & Icons ─────────────────────────────────────
export const TEXT_PRIMARY = ALPHA_BLACK_90;
export const TEXT_SECONDARY = ALPHA_BLACK_70;
export const TEXT_TERTIARY = ALPHA_BLACK_50;
export const TEXT_DISABLED = ALPHA_BLACK_20;

export const TEXT_ON_COLOR_PRIMARY = ALPHA_WHITE_FF;
export const TEXT_ON_COLOR_SECONDARY = ALPHA_WHITE_70;
export const TEXT_ON_COLOR_TERTIARY = ALPHA_WHITE_40;
export const TEXT_ON_COLOR_DISABLED = ALPHA_WHITE_30;

// ── Semantic: Outline ──────────────────────────────────────────
export const OUTLINE_BOLD = ALPHA_BLACK_10;
export const OUTLINE_SUBTLE = ALPHA_BLACK_05;
export const OUTLINE_ON_COLOR_BOLD = ALPHA_WHITE_30;
export const OUTLINE_ON_COLOR_SUBTLE = ALPHA_WHITE_20;

// ── Semantic: Background ───────────────────────────────────────
export const BG_PRIMARY = "#FFFFFF";
export const BG_SECONDARY = SLATE_10;
export const BG_TERTIARY = SLATE_10;
export const BG_CARD = "#FFFFFF";
export const BG_DISABLED = SLATE_50;
export const BG_BRAND = VALENTINO_500;
export const BG_OVERLAY = ALPHA_BLACK_30;

// ── Semantic: Core / Main ──────────────────────────────────────
export const MAIN_PRIMARY = VALENTINO_500;
export const MAIN_PRIMARY_BOLD = VALENTINO_700;
export const MAIN_PRIMARY_MEDIUM = VALENTINO_600;
export const MAIN_PRIMARY_SUBTLE = VALENTINO_50;

// ── Semantic: Core / Utility ───────────────────────────────────
export const UTILITY_INFO = BLUE_500;
export const UTILITY_NEGATIVE = RED_500;
export const UTILITY_POSITIVE = GREEN_500;
export const UTILITY_WARNING = ORANGE_500;

// ── Gradient ───────────────────────────────────────────────────
// DLS 2.0 brand gradient: Valentino/500 → Blue/500 (left-to-right)
export const GRADIENT_BRAND = `linear-gradient(to right, ${VALENTINO_500}, ${BLUE_500})`;

// ── Legacy aliases (keep for existing component imports) ───────
export const BG_SURFACE = SLATE_10;
export const BG_SURFACE_2 = SLATE_30;
