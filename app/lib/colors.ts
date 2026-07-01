// DLS 2.0 Color Tokens - synced from Figma (file ncGqxiE6wUOqgOURwHx6Hp)
//
// Primitives are mode-agnostic literal hex.
// Semantic tokens that change between light/dark resolve through CSS variables
// (`var(--dls-*)`, defined in app/globals.css under :root and .dark). The theme
// flips by toggling the `.dark` class on the phone-frame surface (see app/lib/theme.tsx).
// Mode-stable semantic tokens (brand purple, on-color text, info/positive/warning)
// stay literal because they are identical in both modes.

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
export const SLATE_200 = "#AAAFB6";
export const SLATE_300 = "#8E949D";
export const SLATE_400 = "#78808B";
export const SLATE_500 = "#4E5866";
export const SLATE_600 = "#3B434E";
export const SLATE_700 = "#323841";
export const SLATE_800 = "#252A31";
export const SLATE_900 = "#171A1F";
export const SLATE_950 = "#090B0C";

// ── Blue ───────────────────────────────────────────────────────
export const BLUE_50 = "#E6EDF9";
export const BLUE_100 = "#C4D5F2";
export const BLUE_200 = "#99B7E8";
export const BLUE_300 = "#77A0E0";
export const BLUE_400 = "#5E8EDB";
export const BLUE_500 = "#2B6ACF";
export const BLUE_600 = "#21519D";
export const BLUE_700 = "#1C4484";
export const BLUE_800 = "#153363";
export const BLUE_900 = "#0D203E";
export const BLUE_950 = "#081325";

// ── Green ──────────────────────────────────────────────────────
export const GREEN_50 = "#E0F4E8";
export const GREEN_100 = "#B8E6C9";
export const GREEN_200 = "#85D4A2";
export const GREEN_300 = "#5CC683";
export const GREEN_400 = "#3DBB6C";
export const GREEN_500 = "#00A63E";
export const GREEN_600 = "#007E2F";
export const GREEN_700 = "#006A28";
export const GREEN_800 = "#00501E";
export const GREEN_900 = "#003213";
export const GREEN_950 = "#001E0B";

// ── Red ────────────────────────────────────────────────────────
export const RED_50 = "#F9E4E5";
export const RED_100 = "#F1C0C2";
export const RED_200 = "#E79397";
export const RED_300 = "#E06E74";
export const RED_400 = "#DA535A";
export const RED_500 = "#CE1D26";
export const RED_600 = "#9D161D";
export const RED_700 = "#841318";
export const RED_800 = "#630E12";
export const RED_900 = "#3E090B";
export const RED_950 = "#250507";

// ── Orange ─────────────────────────────────────────────────────
export const ORANGE_50 = "#FFF0E0";
export const ORANGE_100 = "#FFDCB8";
export const ORANGE_200 = "#FFC385";
export const ORANGE_300 = "#FFAE5C";
export const ORANGE_400 = "#FF9F3D";
export const ORANGE_500 = "#FF8100";
export const ORANGE_600 = "#C26200";
export const ORANGE_700 = "#A35300";
export const ORANGE_800 = "#7A3E00";
export const ORANGE_900 = "#4D2700";
export const ORANGE_950 = "#2E1700";

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
export const ALPHA_BLACK_00 = "rgba(0,0,0,0)";

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

// ── Physical device chrome (mode-agnostic phone housing) ───────
export const DEVICE_BEZEL = "#1A1A1E";

// ═══════════════════════════════════════════════════════════════
// SEMANTIC TOKENS
// `var(--dls-*)` tokens flip between light/dark via globals.css.
// Literal tokens are identical in both modes.
// ═══════════════════════════════════════════════════════════════

// ── Semantic: Text & Icons (themed) ────────────────────────────
export const TEXT_PRIMARY = "var(--dls-text-primary)";
export const TEXT_SECONDARY = "var(--dls-text-secondary)";
export const TEXT_TERTIARY = "var(--dls-text-tertiary)";
export const TEXT_DISABLED = "var(--dls-text-disabled)";

// ── Semantic: Text & Icons / On Color (mode-stable) ────────────
export const TEXT_ON_COLOR_PRIMARY = ALPHA_WHITE_FF;
export const TEXT_ON_COLOR_SECONDARY = ALPHA_WHITE_70;
export const TEXT_ON_COLOR_TERTIARY = ALPHA_WHITE_40;
export const TEXT_ON_COLOR_DISABLED = ALPHA_WHITE_30;

// ── Semantic: Outline (themed) ─────────────────────────────────
export const OUTLINE_BOLD = "var(--dls-outline-bold)";
export const OUTLINE_SUBTLE = "var(--dls-outline-subtle)";
// On-color outlines are mode-stable
export const OUTLINE_ON_COLOR_BOLD = ALPHA_WHITE_30;
export const OUTLINE_ON_COLOR_SUBTLE = ALPHA_WHITE_20;

// ── Semantic: Background (themed) ──────────────────────────────
export const BG_PRIMARY = "var(--dls-bg-primary)";
export const BG_SECONDARY = "var(--dls-bg-secondary)";
export const BG_TERTIARY = "var(--dls-bg-tertiary)";
export const BG_CARD = "var(--dls-bg-card)";
// Bottom-sheet / elevated surface — solid white in light, lifted grey in dark (unlike BG_CARD which is
// translucent in dark). Use for confirm sheets + the safe-to-spend hero disc.
export const BG_SHEET = "var(--dls-bg-sheet)";
// Frosted-glass fill for floating chrome — translucent in both modes so backdrop-blur reads as glass.
export const BG_GLASS = "var(--dls-bg-glass)";
export const BG_DISABLED = "var(--dls-bg-disabled)";
export const BG_BRAND = "var(--dls-bg-brand)";
export const BG_OVERLAY = "var(--dls-bg-overlay)";

// ── Semantic: Core / Main ──────────────────────────────────────
export const MAIN_PRIMARY = VALENTINO_500; // brand purple, mode-stable
export const MAIN_PRIMARY_BOLD = VALENTINO_700;
export const MAIN_PRIMARY_MEDIUM = VALENTINO_600;
export const MAIN_PRIMARY_SUBTLE = "var(--dls-main-primary-subtle)"; // 50 ↔ 950

// ── Semantic: Core / Utility ───────────────────────────────────
export const UTILITY_INFO = BLUE_500; // mode-stable
export const UTILITY_NEGATIVE = "var(--dls-utility-negative)"; // 500 ↔ 400
export const UTILITY_POSITIVE = GREEN_500; // mode-stable
export const UTILITY_WARNING = ORANGE_500; // mode-stable

// ── Extended: Background / Bold ────────────────────────────────
export const EXT_BG_BOLD_INFO = BLUE_500;
export const EXT_BG_BOLD_MAIN = VALENTINO_500;
export const EXT_BG_BOLD_NEGATIVE = RED_400;
export const EXT_BG_BOLD_NEUTRAL = SLATE_800;
export const EXT_BG_BOLD_POSITIVE = GREEN_500;
export const EXT_BG_BOLD_WARNING = ORANGE_500;
export const EXT_BG_BOLD_REVERSE = "var(--dls-ext-bg-bold-reverse)"; // #000 ↔ #fff

// ── Extended: Background / Subtle (themed, /50 ↔ /950) ──────────
export const EXT_BG_SUBTLE_INFO = "var(--dls-ext-bg-subtle-info)";
export const EXT_BG_SUBTLE_MAIN = "var(--dls-ext-bg-subtle-main)";
// Chat user-message bubble — pale purple in light, lifted grey in dark (see globals.css).
export const CHAT_USER_BUBBLE = "var(--chat-user-bubble)";
export const EXT_BG_SUBTLE_NEGATIVE = "var(--dls-ext-bg-subtle-negative)";
export const EXT_BG_SUBTLE_NEUTRAL = "var(--dls-ext-bg-subtle-neutral)";
export const EXT_BG_SUBTLE_POSITIVE = "var(--dls-ext-bg-subtle-positive)";
export const EXT_BG_SUBTLE_WARNING = "var(--dls-ext-bg-subtle-warning)";

// ── Extended: Text & Icons (themed, /500 ↔ /400) ───────────────
export const EXT_TEXT_INFO = "var(--dls-ext-text-info)";
export const EXT_TEXT_MAIN = "var(--dls-ext-text-main)";
export const EXT_TEXT_NEGATIVE = "var(--dls-ext-text-negative)";
export const EXT_TEXT_NEUTRAL = SLATE_800; // mode-stable
export const EXT_TEXT_POSITIVE = "var(--dls-ext-text-positive)";
export const EXT_TEXT_WARNING = "var(--dls-ext-text-warning)";
export const EXT_TEXT_REVERSE = "var(--dls-ext-text-reverse)"; // #fff ↔ #000

// ── Extended: Outline (mode-stable) ────────────────────────────
export const EXT_OUTLINE_INFO = BLUE_500;
export const EXT_OUTLINE_MAIN_SELECTED = VALENTINO_500;
export const EXT_OUTLINE_NEGATIVE = RED_500;
export const EXT_OUTLINE_POSITIVE = GREEN_500;
export const EXT_OUTLINE_WARNING = ORANGE_500;

// ── Decorative: Subtle (themed, /50 ↔ /950) ────────────────────
export const DECOR_SUBTLE_BLUE = "var(--dls-decor-subtle-blue)";
export const DECOR_SUBTLE_GREEN = "var(--dls-decor-subtle-green)";
export const DECOR_SUBTLE_ORANGE = "var(--dls-decor-subtle-orange)";
export const DECOR_SUBTLE_RED = "var(--dls-decor-subtle-red)";
export const DECOR_SUBTLE_SLATE = "var(--dls-decor-subtle-slate)";
export const DECOR_SUBTLE_VALENTINO = "var(--dls-decor-subtle-valentino)";

// Mosaic / spend-tile fills — light matches decor-subtle, dark is brighter.
export const DECOR_TILE_BLUE = "var(--dls-decor-tile-blue)";
export const DECOR_TILE_GREEN = "var(--dls-decor-tile-green)";
export const DECOR_TILE_ORANGE = "var(--dls-decor-tile-orange)";
export const DECOR_TILE_RED = "var(--dls-decor-tile-red)";
export const DECOR_TILE_VALENTINO = "var(--dls-decor-tile-valentino)";
// Deep jewel tiles — mode-stable dark colored cards (always white text), for the spend mosaic.
export const DECOR_DEEP_BLUE = "var(--dls-decor-deep-blue)";
export const DECOR_DEEP_GREEN = "var(--dls-decor-deep-green)";
export const DECOR_DEEP_ORANGE = "var(--dls-decor-deep-orange)";
export const DECOR_DEEP_RED = "var(--dls-decor-deep-red)";
export const DECOR_DEEP_VALENTINO = "var(--dls-decor-deep-valentino)";
// Category-avatar disc fill — white in light, faint 10% white in dark (themed).
export const CAT_AVATAR_FILL = "var(--dls-cat-avatar-fill)";

// ── Decorative: Bold (mostly mode-stable; Slate flips) ─────────
export const DECOR_BOLD_BLUE = BLUE_500;
export const DECOR_BOLD_GREEN = GREEN_400;
export const DECOR_BOLD_ORANGE = ORANGE_400;
export const DECOR_BOLD_RED = RED_400;
export const DECOR_BOLD_SLATE = "var(--dls-decor-bold-slate)"; // 400 ↔ 500
export const DECOR_BOLD_VALENTINO = VALENTINO_500;

// ── Component: Button ──────────────────────────────────────────
export const BTN_BG_GREY_DEFAULT = "var(--dls-btn-bg-grey-default)"; // Slate/30 ↔ /700
export const BTN_BG_GREY_PRESSED = "var(--dls-btn-bg-grey-pressed)"; // Slate/50 ↔ /600
export const BTN_BG_ON_COLOR_DEFAULT = ALPHA_WHITE_FF; // mode-stable
export const BTN_BG_ON_COLOR_PRESSED = SLATE_10; // mode-stable
export const BTN_BG_PRIMARY_DEFAULT = VALENTINO_500; // mode-stable
export const BTN_BG_PRIMARY_DISABLED = "var(--dls-btn-bg-primary-disabled)"; // Slate/50 ↔ black a10
export const BTN_BG_PRIMARY_PRESSED = VALENTINO_600; // mode-stable
export const BTN_BG_SECONDARY_DEFAULT = "var(--dls-btn-bg-secondary-default)"; // transparent (white↔black a00)
export const BTN_BG_SECONDARY_DISABLED = "var(--dls-btn-bg-secondary-default)";
export const BTN_BG_SECONDARY_PRESSED = "var(--dls-btn-bg-secondary-pressed)"; // Valentino/50 ↔ /950
export const BTN_BG_TERTIARY_PRESSED = "var(--dls-btn-bg-tertiary-pressed)"; // Slate/50 ↔ Valentino/500
export const BTN_TEXT_PRIMARY = VALENTINO_500; // mode-stable
export const BTN_TEXT_SECONDARY = VALENTINO_500; // mode-stable

// ── Component: Toggle ──────────────────────────────────────────
export const TOGGLE_TRACK = "var(--dls-toggle-track)"; // Slate/100 ↔ /500

// ── Component: Bottom nav ──────────────────────────────────────
export const BOTTOM_NAV_GRADIENT_START = "var(--dls-bottom-nav-gradient-start)";
export const BOTTOM_NAV_GRADIENT_STOP = "var(--dls-bottom-nav-gradient-stop)";
export const BOTTOM_NAV_PRIMARY_BG = "var(--dls-bottom-nav-primary-bg)";
export const BOTTOM_NAV_SECONDARY_BG = "var(--dls-bottom-nav-secondary-bg)";
export const BOTTOM_NAV_SELECTED = "var(--dls-bottom-nav-selected)";

// ── Gradient (mode-stable) ─────────────────────────────────────
// DLS 2.0 brand gradient: Valentino/500 → Blue/500 (left-to-right)
export const GRADIENT_BRAND = `linear-gradient(to right, ${VALENTINO_500}, ${BLUE_500})`;

// ── Legacy aliases (keep for existing component imports) ───────
export const BG_SURFACE = "var(--dls-bg-secondary)"; // was SLATE_10
export const BG_SURFACE_2 = "var(--dls-bg-surface-2)"; // was SLATE_30 → dark Slate/800
