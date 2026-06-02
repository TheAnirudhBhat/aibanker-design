## User
- [user_role.md](user_role.md) - Designer, not a coder - use design language, .md files as their interface

## Design Rules
- [feedback_dls_design.md](feedback_dls_design.md) - Always use DLS 2.0 tokens, never raw hex
- [feedback_md_source_of_truth.md](feedback_md_source_of_truth.md) - .md = user's interface, .ts = Claude's job to sync
- [feedback_figma_first.md](feedback_figma_first.md) - Match Figma specs 1:1, never improvise
- [feedback_reuse_existing.md](feedback_reuse_existing.md) - Never recreate components, always reuse
- [feedback_design_mode.md](feedback_design_mode.md) - "design mode" = frontend-only, preview route for variants
- [feedback_screenshot_verify.md](feedback_screenshot_verify.md) - Playwright screenshot after every visual change
- [feedback_transitions.md](feedback_transitions.md) - Push left/right for nav, slide up/down for overlays
- [feedback_overlay_nav_logic.md](feedback_overlay_nav_logic.md) - Single overlay slot, X for entry, back for deeper, no stacking
- [feedback_no_asset_substitution.md](feedback_no_asset_substitution.md) - Never substitute assets; ask user if missing
- [feedback_icon_export.md](feedback_icon_export.md) - Figma icon = export the exact frame as SVG, never strip/extract inner vectors
- [feedback_device_frame.md](feedback_device_frame.md) - Never add custom phone frames; use gallery's standard frame
- [feedback_screen_chrome.md](feedback_screen_chrome.md) - Every screen needs status bar, app bar, bottom safe area
- [feedback_sentence_case.md](feedback_sentence_case.md) - Always sentence case for UI labels, never Title Case
- [feedback_metadata_uppercase.md](feedback_metadata_uppercase.md) - `typography.metadata` always renders UPPERCASE (tags AND section headers); source strings stay sentence case
- [feedback_no_em_dashes.md](feedback_no_em_dashes.md) - Never use em dashes in output, code, copy, or .md files
- [feedback_slice_lowercase.md](feedback_slice_lowercase.md) - "slice" and slice product names (monies, sparks, slice in 3, etc.) are always lowercase, everywhere
- [feedback_ai_banker_alert_pulse.md](feedback_ai_banker_alert_pulse.md) - Pulse halo on Ryan chip = the canonical alert state. Never use a separate badge/dot.

## Foundation Tokens
- [reference_dls_colors.md](reference_dls_colors.md) - Primitives, semantic, extended, component color tokens
- [reference_dls_spacing.md](reference_dls_spacing.md) - Padding scale: 2px to 64px
- [reference_dls_corner_radius.md](reference_dls_corner_radius.md) - S(8), M(16), L(24), Circle(100)
- [reference_dls_elevation.md](reference_dls_elevation.md) - Card, Above, Below shadow tokens
- [reference_dls_dividers.md](reference_dls_dividers.md) - Default (solid/dashed) and Big (8px section break)
- [reference_dls_iconography.md](reference_dls_iconography.md) - Icon grid (24px/56px), 15 categories, ~236 icons

## Components
- [reference_dls_appbar.md](reference_dls_appbar.md) - Standard and L0 app bars
- [reference_dls_buttons.md](reference_dls_buttons.md) - Primary/Secondary/Tertiary/Grey, Regular/Small
- [reference_dls_button_group.md](reference_dls_button_group.md) - Footer action container
- [reference_dls_bottomsheet.md](reference_dls_bottomsheet.md) - Modal overlay from bottom
- [reference_dls_input_field.md](reference_dls_input_field.md) - Underlined input with states
- [reference_dls_otp.md](reference_dls_otp.md) - Segmented 4/6-digit OTP input
- [reference_dls_cards.md](reference_dls_cards.md) - L0 Large/Medium/Small, Explore cards
- [reference_dls_list_items.md](reference_dls_list_items.md) - Standard/Deposit/Setup/Transaction/Selection
- [reference_dls_list_item_control.md](reference_dls_list_item_control.md) - All-purpose selection row: title + subtext + radio/checkbox
- [reference_dls_section_header.md](reference_dls_section_header.md) - List, Bold, Bold+CTA, Pay with UPI
- [reference_dls_chips.md](reference_dls_chips.md) - Filter/selection pills
- [reference_dls_tabs.md](reference_dls_tabs.md) - 2 or 3 tab pill switcher
- [reference_dls_tags.md](reference_dls_tags.md) - Intent x Emphasis status pills
- [reference_dls_controls.md](reference_dls_controls.md) - Checkbox, Radio, Switch
- [reference_dls_progress.md](reference_dls_progress.md) - Linear progress bar
- [reference_dls_tooltip.md](reference_dls_tooltip.md) - Black tooltip with pointer
- [reference_dls_badge.md](reference_dls_badge.md) - Dot and Count badges
- [reference_dls_avatar.md](reference_dls_avatar.md) - Circular, 6 sizes, 4 types
- [reference_dls_dot_indicator.md](reference_dls_dot_indicator.md) - Carousel pagination dots
- [reference_dls_carousel.md](reference_dls_carousel.md) - Horizontal scrollable card container
- [reference_dls_bottom_nav.md](reference_dls_bottom_nav.md) - Pod-based app navigation
- [reference_dls_accordion.md](reference_dls_accordion.md) - Collapsible FAQ sections
- [reference_dls_dialer.md](reference_dls_dialer.md) - Circular radial slider (Monies + Repayment)
- [reference_dls_file_upload.md](reference_dls_file_upload.md) - Upload: Default/Loading/Image/PDF
- [reference_dls_footer.md](reference_dls_footer.md) - Footer that sits below a button group (payment logos + gesture nav)
- [reference_dls_header.md](reference_dls_header.md) - Header that sits above a button group (trust builder / T&C / disclaimer line)
- [reference_dls_search.md](reference_dls_search.md) - Pill search bar, 4 states, optional filter
- [reference_dls_slider.md](reference_dls_slider.md) - Horizontal range slider with thumb
- [reference_dls_snackbar.md](reference_dls_snackbar.md) - Toast bar: Default (dark) / Negative (red)
- [reference_dls_fab.md](reference_dls_fab.md) - Floating action button: 56px circle, 4 states, onboarding flows
- [reference_dls_feature_pdp.md](reference_dls_feature_pdp.md) - Product detail page: illustration, highlight label, 3 feature rows, FAB
- [reference_dls_feedback_bar.md](reference_dls_feedback_bar.md) - Thumbs/copy/share/refresh row + AI disclaimer under banker messages
- [reference_dls_ai_banker_chip.md](reference_dls_ai_banker_chip.md) - Ryan/Byron entry chip on pay screen: first time → alert (pulsing) → default

## Copy & Voice
- [reference_copy_voice.md](reference_copy_voice.md) - Copywriter-approved Ryan (warm) & Byron (snarky) voice guide with scenario examples

## Taxonomy
- [reference_viz_widget_taxonomy.md](reference_viz_widget_taxonomy.md) - Visualizations (10 data displays, flat on surface) vs Widgets (4 actionable, enclosed)

## Visualizations (per-viz specs)
- [reference_viz_budget_summary.md](reference_viz_budget_summary.md) - Income/obligations/savings/daily-pool math, four rows in a card
- [reference_viz_category_budgets.md](reference_viz_category_budgets.md) - Per-category caps positioned in a range, biggest-cut highlight

## Chrome & Tooling
- [feedback_shadcn_chrome.md](feedback_shadcn_chrome.md) - All chrome UI uses ShadCN defaults, no brand colors, no raw hex, no inline styles
- [feedback_dev_port.md](feedback_dev_port.md) - Always use port from `.env.local` (set by `./scripts/dev.sh`), never hardcode 3000

## Chat Behavior
- [feedback_chat_streaming_scroll.md](feedback_chat_streaming_scroll.md) - Streaming, scroll, and flow rules for onboarding chat sim

## Playground
- [feedback_playground.md](feedback_playground.md) - PlaygroundCard wrapper rules, states are controls (not variants)

## Project
- [project_reddit_leak.md](project_reddit_leak.md) - Reddit exploration: fake "leak" screenshot + recording for slice subreddit
- [project_glassy_cards_v3.md](project_glassy_cards_v3.md) - Glassy card style → explore as Visualizations V3
