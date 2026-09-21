# Return experiment interaction fixes

- [x] Restore actual top backdrop blur and fade it over 48px on L0 and L1.
- [x] Open budget chat across the whole app frame on desktop and mobile.
- [x] Use 90% opacity for every sent user-message text.
- [x] Slide the L1 app bar with its page; keep the outgoing page stationary.
- [x] Make Focus dissolve the default chat opening; keep only Current as an alternative (updated preference).
- [x] Apply the same top blur to chat scroll; shorten it by 16px in chat only.
- [x] Echo in-thread options; keep scan-sheet answers out of the chat history.
- [x] Fix the measured 32px dock-resize and 28px loading-to-reply scroll jumps.
- [x] Add a plain Avatar option shared by both cards, with 20px white glyphs.
- [x] Verify Figma avatar node 3020:90754 after connector access recovered: 48px flat coloured circles and existing matching flight/food glyphs. Keep the later requested smaller 20px white glyphs.
- [x] Research the recording and add proportional, spring-driven number spacing to bank and cashflow figures.
- [x] Replace independent character springs with native shaped text runs and a subtle whole-width spring (limited to ±8%). Currency marks, digits and dates cannot cross or overlap.
- [x] Remove the bank's left-edge dead zone; use a gentler 780ms return and retain right-edge space.
- [x] Give cashflow drill bars and averages their own vertical scale; synchronize heading/bar timing (refined to 480ms, with no initial delay, per latest speed request).
- [x] Remove the cashflow totals' delayed appearance animation (superseded by the persistent shared-header transition below).
- [x] Center the home cashflow glance bars with fixed 12px gaps while retaining the full-width grid.
- [x] Apply the collision-free fluid text to all three cashflow list amounts, retaining their right alignment and existing colours.
- [x] Move the selected cashflow total into the centre on a shared clock with the graph; reverse the same element on return. Reveal the full amount during the zoom.
- [x] Make all three overview totals tappable; use transform-based scaling and a subtle blur/opacity pulse around the precision handoff.
- [x] Smooth Invest specifically: continuously interpolate the measured 50px precision jump, synchronize label/amount changes, and keep the selected text visible (minimum 68% opacity) through the soft focus. No trailing spring or blank midpoint.
- [x] Fade/lift the average line from 16px below its final position, not from the graph edge; keep it mounted across drill/category changes.
- [x] Remove the opening animation from the L1 budget progress card; render its actual value immediately.
- [x] Put Inflow on the left and Outflow on the right.
- [x] Keep the header height, graph frame and divider location fixed across all cashflow levels; use the same ledger totals in header and list.
- [x] Use each category's row colour and independent monthly spending pattern; keep chart, average, heading and transaction sums consistent.
- [x] Fit the cashflow overview without vertical scrolling, retaining all three rows above the composer.
- [x] Add 12px between the bank/detail cashflow headings and their graphs.
- [x] Restore home blur at the start of returning from cashflow, not after the transition.
- [x] Keep bank refresh/date subtext centred regardless of inherited button alignment.
- [x] Model ₹1.2 lakh monthly salary credits, irregular debits and ₹8,000 month-end balances.
- [x] Give each bank month distinct bill/purchase timing and refunds instead of repeating one decline pattern.
- [x] Match upcoming-payment rows to Figma 2886:87061 using existing calendar components and theme tokens.
- [x] Apply the newer 12px avatar-to-text spacing request to upcoming payments.
- [x] Verify rendering, navigation, chat controls, themes, and viewport resizing: Chrome dark desktop, WebKit light mobile, and 568/667/844px phone heights. Production build, TypeScript and new utility lint checks pass.
- [x] Diagnose the mobile artwork: original image is mapped correctly and starts at y=0, but the tall mobile cover container crops it at 2.5× the desktop framing. Asked before changing it.
- [x] Push the completed changes to main (`0d5c557`).

Awaiting user approval: restore the desktop-style mobile artwork framing. The image mapping itself is correct; no artwork or background-layout changes were made during this pass.

Validation note: Playwright WebKit's macOS screenshot capture omits backdrop filters even in a minimal standalone example. Chrome pixel comparisons cover rendered blur; WebKit checks cover geometry and behavior. A physical iPhone remains a separate visual check.

## Number-motion research

The reference recording uses changing natural digit widths, rather than a fixed tabular grid. CSS `proportional-nums` enables proportional figures; it is distinct from arbitrarily animating `letter-spacing`. See [CSS Fonts](https://drafts.csswg.org/css-fonts/#font-variant-numeric-prop). [Number Flow's implementation](https://github.com/barvian/number-flow) and [Range geometry](https://developer.mozilla.org/en-US/docs/Web/API/Range/getBoundingClientRect) were reviewed; no dependency was added. Initial per-glyph layout springs were rejected after live QA exposed collisions during fast changes. The final implementation preserves native text shaping and applies a whole-run width spring, capped at ±8% deformation. Values update immediately, with no rolling/count interpolation; the font's proportional spacing remains intact and characters cannot overtake each other.

Regression runner: `npm run qa:return` against the local dev server. Optional `QA_BROWSER=webkit`, `QA_THEME=light`, `QA_MOBILE=1`, and `QA_BASE_URL`.
