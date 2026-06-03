---
name: Browser tool choice (Preview vs DevTools vs Chrome)
description: Which browser tool to use - Preview by default, DevTools to diagnose, Claude in Chrome for real browser state
type: feedback
originSessionId: 7aad2bff-3b7d-4d4b-a02e-4775b174cbaf
---
Three browser surfaces exist in this environment: Preview server (Claude_Preview), Chrome DevTools (chrome-devtools), Claude in Chrome (Claude_in_Chrome). There is NO Playwright MCP. Pick deliberately:

- **Default: Preview server** for all visual verification - screenshots after a change, clicking through flows, checking variants. Fastest, lightest, tied to the dev server, has screenshot/click/fill/snapshot/console/network/resize.
- **Chrome DevTools only to diagnose *why* something renders wrong** - performance traces, Lighthouse, network failures, console error chains, layout thrash, heap. Not just to look.
- **Claude in Chrome only when the task needs real browser state** - logged-in session, real cookies, extensions, multi-tab.

Always read the port from `.env.local` (set by `./scripts/dev.sh`), never hardcode 3000.

**Why:** Tool choice had been random/inconsistent. Root cause: the screenshot-verify memory said "use Playwright" but no Playwright MCP exists, so a real tool got substituted with no rule. Past mistake was reaching for DevTools or Chrome to take plain screenshots when Preview is faster and lighter.

**How to apply:** Reach for Preview unless I genuinely need to diagnose (DevTools) or need the user's real browser (Claude in Chrome).