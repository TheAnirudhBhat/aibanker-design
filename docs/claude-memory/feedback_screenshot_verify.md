---
name: Screenshot-verify every visual change
description: Screenshot via the Preview server after any frontend change - verify before reporting done
type: feedback
originSessionId: 950e5466-e9ba-4ddf-8c98-3f5039021bc0
---
After any frontend/visual change, take a screenshot using the Preview server (Claude_Preview) and verify the result before telling the user it's done. Do this proactively every time - never wait to be reminded.

**Why:** Catches layout issues, styling bugs, and rendering problems that build checks miss. User had to remind multiple times - this is non-negotiable. (Note: there is no Playwright MCP in this environment - earlier wording said "Playwright" and that was the root of inconsistent tool choice. Use the Preview server.)

**How to apply:** Edit code → start dev server if needed (`./scripts/dev.sh`) → navigate to the relevant page → screenshot → review → fix if wrong → then report done. Never skip this step. For which browser tool to use, see [feedback_browser_tool_choice.md](feedback_browser_tool_choice.md).
