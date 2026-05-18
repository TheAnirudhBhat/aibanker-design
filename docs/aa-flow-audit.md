# AA Flow Audit

Comparison of [AASim.tsx](../app/preview/AASim.tsx) against Figma frames in `qo0U58MJSHQ3o4E0QUaDRK`. Implementation matches Figma 1:1 for structure and interactions; copy stays in the project's generic insights framing (Figma's loan framing is older and intentionally not adopted).

Preview: `/preview?component=AA`.

---

## Final flow (8 screens + 4 variant states)

Happy-path screens:

| # | Screen | Figma node | Notes |
|---|--------|------------|-------|
| 1 | Value prop | 18:26970 | Inline "Learn more" link below benefit 3 |
| 2 | Learn more (overlay) | 18:27021 | Slides up; X to close; supported banks + 4 benefits + aggregator logos |
| 3 | Bank select | 18:27174 / 18:27229 | 2-col grid, real bank logos, selected = VALENTINO_500 2px border |
| 4 | OTP | 18:27284 / 18:27311 | 4 digits, clear X button, real countdown timer with Resend button |
| 5 | Approve consent | 18:27353 | Skip CTA top-right, Approve button, Onemoney footer logo |
| 6 | Consent detail (overlay) | 18:27389 / 30:1037 | Per-row icons, Onemoney footer, info `i` opens bottom sheet |
| — | Info tooltip | 18:27411 | Bottom sheet for Statement period + Data life |

Branch screens (AA 2.0):

| # | Screen | Figma node | Notes |
|---|--------|------------|-------|
| 7 | No accounts found (empty) | 647:35828 | Illustration, Skip top-right, Change phone number CTA |
| 7b | No accounts found (alternates) | 647:35742 | "Change phone number" inline link + Other accounts found list |
| 8 | Phone number | 648:36036 / 648:36054 | 10-digit input with "+91-" prefix and clear button; reached via Change phone number tap |

Variant states (playground variants — switch via toggle in Account aggregator card):

| Variant | Start screen | Notes |
|---|---|---|
| Happy | value-prop | Default end-to-end happy path |
| No accounts | no-accounts (empty) | Lands on illustration empty state |
| Alternates | no-accounts (with list) | Lands on "Other accounts found" list |
| Out of attempts | OTP (errored) | Pre-fills "1234", shows red underline + "OUT OF ATTEMPTS" + disabled Continue |

The success screen present in the old implementation has been removed — Figma has no counterpart, and Approve now exits straight back into onboarding via `onComplete`.

---

## Per-screen diff and fixes applied

### Screen 1 — Value prop
| Aspect | Figma | Implementation | Status |
|---|---|---|---|
| Header | "Link salary account" | "Link your accounts" | Kept current (generic framing) |
| Benefits | Loan framing | Generic insights (3 rows from [AA_BENEFITS](../app/preview/fixtures/onboardingFixture.ts)) | Kept current |
| "Learn more" link | Inline purple text below benefit 3 | Wired via `cta` field on benefit 3 | ✓ Matches |
| FAB | Purple circle, arrow icon | VALENTINO_500, RADIUS_CIRCLE, 56×56 | ✓ Matches |
| Chrome | Status bar + gesture nav | Same | ✓ Matches |

### Screen 2 — Learn more (overlay)
| Aspect | Figma | Implementation | Status |
|---|---|---|---|
| Presentation | Slide-up overlay | `goTo("learn-more")` triggers vertical "present" transition | ✓ Matches |
| Close | X icon top-left | CloseIcon button | ✓ Matches |
| Title + subtitle | "Understanding account aggregator…" | [AA_LEARN_MORE](../app/preview/fixtures/onboardingFixture.ts) | ✓ Matches |
| Major supported banks | 5 overlapping circular bank logos | `<img>` per bank pulling from `/icons/banks/*.svg` | **Awaiting SVG assets** |
| 4 benefits | Safe / Trust / Privacy / Ease | Same | ✓ Matches |
| Aggregator logos | Perfios / FINVU / saafe / N@DL / Onemoney | `<img>` per logo from `/icons/aggregators/*.svg` | **Awaiting SVG assets** |

### Screen 3 + 4 — Bank select
| Aspect | Figma | Implementation | Status |
|---|---|---|---|
| Header | "Select your salary account" | "Select your primary account" | Kept current (generic) |
| Bank tiles | 2-col grid, real logos | `<img src={bank.logo}>` per tile, OUTLINE_SUBTLE border, RADIUS_L | **Awaiting SVG assets** |
| Selected state | 2px purple border | `border: 2px solid VALENTINO_500` | ✓ Matches |
| "Other bank" | Outline-bank icon | Now `/icons/banks/other.svg` (emoji removed) | **Awaiting SVG asset** |
| Continue | Disabled grey → purple when selected | BG_DISABLED → VALENTINO_500 | ✓ Matches |
| Raw hex removed | n/a | All `#xxxxxx` from BANKS fixture deleted | ✓ DLS strict |

### Screen 5 + 6 — OTP
| Aspect | Figma | Implementation | Status |
|---|---|---|---|
| Header | "OTP" | "OTP" | ✓ Matches |
| Phone subtext | "Sent to +91 8765667213" | Same | ✓ Matches |
| **Length** | **8 digits** | `OTP_LENGTH = 8` | ✓ Fixed (was 4) |
| Input style | Underlined, placeholder | Same | ✓ Matches |
| **Clear X button** | Present when filled | Renders when `otpValue.length > 0` | ✓ Added |
| Underline | Thicker + purple when filled | `2px VALENTINO_500` when filled | ✓ Matches |
| Resend timer | "Resend in 00:15" | Same | ✓ Matches |
| T&C footer | "By continuing, you accept Onemoney T&C" | Same | ✓ Matches |
| Continue gating | Enabled at 8 digits | `otpValue.length === OTP_LENGTH` | ✓ Matches |

### Screen 7 — Approve consent
| Aspect | Figma | Implementation | Status |
|---|---|---|---|
| Header | "Approve consent" | Same | ✓ Matches |
| **Skip CTA** | Purple text top-right | Added; calls `onClose` (parent treats as dismissed) | ✓ Added |
| Account row | Logo + "HDFC xx6543" + "Savings" | `<img src="/icons/banks/hdfc.svg">` + name + Savings | **Awaiting HDFC SVG** |
| Cards | "Eligibility check" / "Monitoring" | "Spending analysis" / "Ongoing tracking" (generic copy) | Kept current |
| Card subtitles | Present | Already in [AA_CONSENT_CARDS](../app/preview/fixtures/onboardingFixture.ts) | ✓ Matches |
| Chevron on cards | Present | ChevronRightIcon | ✓ Matches |
| Primary CTA | "Approve" | "Approve" → now calls `onComplete` directly | ✓ Fixed (was → success screen) |
| Onemoney footer | Centered logo | `<img src="/icons/aggregators/onemoney.svg">` | **Awaiting SVG asset** |

### Screen 8 + 9 — Consent detail (overlay)
| Aspect | Figma | Implementation | Status |
|---|---|---|---|
| Presentation | Full-screen slide-up | "present" transition via goTo | ✓ Matches |
| Close | X icon + inline title | CloseIcon + title | ✓ Matches |
| Row icons | Per-row icons (document, profile, clock variants) | DocumentIcon / ProfileIcon / ClockIcon (with `dotted` variant) via [CONSENT_ROW_ICONS](../app/preview/AASim.tsx) | ✓ Fixed (was: first letter of label) |
| Row label "Time period" | Renamed from "Statement period" | Row label now "Time period"; `tooltipKey: "Statement period"` keeps the original tooltip content | ✓ AA 2.0 update |
| Row copy | Loan-eligibility framed | Generic insights | Kept current |
| Info `i` | Tappable, opens tooltip | Wired to `setInfoSheet(row.tooltipKey ?? row.label)` | ✓ Fixed (was non-interactive) |
| Onemoney footer | Centered logo | `<img src="/icons/aggregators/onemoney.svg">` | **Awaiting SVG asset** |

### Screen 10 — Info tooltip
| Aspect | Figma | Implementation | Status |
|---|---|---|---|
| Trigger | Tap `i` on Time period (Statement period) or Data life | `setInfoSheet(row.tooltipKey ?? row.label)` | ✓ Added |
| Presentation | Bottom sheet over dimmed scrim | Scrim button at ALPHA_BLACK_50 + sheet anchored to bottom, RADIUS_L top corners, ELEVATION_ABOVE | ✓ Added |
| Statement period copy | "What is statement period? It refers to…" | [AA_INFO_TOOLTIPS](../app/preview/fixtures/onboardingFixture.ts) | ✓ Matches |
| Data life copy | "The duration for which we securely store your bank statements." | Same | ✓ Matches AA 2.0 (was placeholder) |
| Dismiss | Tap scrim | Yes | ✓ Matches |
| Animation | Slide up + fade scrim | `aaSheetIn` + `aaScrimIn` keyframes | ✓ Added |

### Screens 11–13 — AA 2.0 branch (No accounts found + Phone number)
| Aspect | Figma | Implementation | Status |
|---|---|---|---|
| **No accounts (empty)** | "No accounts found" + illustration + Skip + Change phone CTA | Illustration `<img>` (asset awaiting), Skip → onClose, Change phone → phone-number screen | ✓ Added |
| **No accounts (alternates)** | Same header + inline Change phone link + "Other accounts found" list | Phone-icon link, two account tiles (Axis + India Post) tapping → consent | ✓ Added |
| **Phone number** | Prefix "+91-" + 10-digit input + clear X + Continue | New screen, `AA_PHONE` fixture, Continue gated on 10 digits → OTP | ✓ Added |

### Screen 14 — OTP error state (Out of attempts)
| Aspect | Figma | Implementation | Status |
|---|---|---|---|
| Input | Pre-filled with previous attempt | `otpValue = "1234"` when `startState="otp-error"` | ✓ Added (4-digit per project policy) |
| Underline | Red | RED_500, 2px | ✓ Added |
| Error text | "OUT OF ATTEMPTS" red | RED_500 caption with `letterSpacing: 0.04em` | ✓ Added |
| Continue | Disabled | Gated by `!otpErrored && otpValue.length === OTP_LENGTH` | ✓ Added |
| Recovery | Type to clear error | `setOtpErrored(false)` on input or clear | ✓ Added |

---

## DLS 2.0 strict pass

| Check | Result |
|---|---|
| Raw hex `#xxxxxx` in [AASim.tsx](../app/preview/AASim.tsx) | None |
| Raw hex in [onboardingFixture.ts](../app/preview/fixtures/onboardingFixture.ts) (BANKS) | Removed (was `#004C8F`, `#97144D`, `#E8350E`, `#ED1C24`, `#6B2D8B`, `#78808B`) |
| Raw `rgba()` in JSX | None (alpha tokens only) |
| Emoji in fixture | Removed (🏦 → `/icons/banks/other.svg`) |
| Color literal "white"/"black"/"red"… | None |
| Spacing values not from DLS scale | `marginLeft: -12` (overlap of bank circles in learn-more) — measured from Figma, kept as positioning value. All other spacing on SPACE_* tokens. |
| Border widths | `1px` and `2px` standard; `1.2px` on bank tile inner circle (matches Figma) |
| Radii | RADIUS_CIRCLE / RADIUS_M / RADIUS_L throughout |
| Elevation | ELEVATION_CARD / ELEVATION_ABOVE / ELEVATION_BELOW |
| Typography | All from [typography](../app/preview/lib/typography.ts) | 

---

## Outstanding work

### Asset exports needed from Figma

The implementation references these SVG paths; please export from the Figma file `qo0U58MJSHQ3o4E0QUaDRK` and drop into the project. Until they land, those `<img>` tags render as broken icons (no fallback by design — per [no-asset-substitution](.claude/memory)).

**Bank logos** → `public/icons/banks/`
- `hdfc.svg`, `axis.svg`, `ippb.svg`, `kotak.svg`, `kvb.svg`, `other.svg`
- Plus learn-more circles: `sbi.svg`, `icici.svg`

**Aggregator logos** → `public/icons/aggregators/`
- `perfios.svg`, `finvu.svg`, `saafe.svg`, `nadl.svg`, `onemoney.svg`

**Illustration** → `public/icons/illustrations/`
- `aa-no-accounts.svg` (purple character with spilled cup — empty-state illustration on No accounts found)

### Copy confirmation
- The Data life info tooltip body is a placeholder — please review/edit [AA_INFO_TOOLTIPS](../app/preview/fixtures/onboardingFixture.ts).

### Consent-detail row icons
- Currently hand-coded as `DocumentIcon` / `ProfileIcon` / `ClockIcon` (with `dotted` variant) inside [AASim.tsx](../app/preview/AASim.tsx). Per [feedback_icon_export], these should be Figma exports. Replace when the source icons are available.

---

## Verification

- Boot `npm run dev` → navigate `/preview?component=AA`.
- Walk all 6 screens; transitions should be left/right for nav and slide-up/down for the Learn more + Consent detail overlays.
- Tap `i` on Statement period in the consent detail screen — the bottom sheet should slide up over a dimmed scrim, and tapping the scrim should dismiss.
- Tap Skip on Approve consent — should exit AA back to onboarding (no success flash).
- Tap Approve — same exit path, just via `onComplete`.
