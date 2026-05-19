# What changed: 2026-05-18 to 2026-05-19

A grouped, written-up summary of every commit landed on `main` during this 48-hour window. Skim the bold headings if you want the gist, drop into the bullets for detail. Commit hashes are clickable from the GitHub UI.

## TL;DR

In two days the project added two new screens (Budget, error states), one new flow (Goal-Budget Planning), a major design-system pass that tokenised the entire codebase, three new DLS primitives (`ListItemControl`, `InputField`, `OtpInput`), four refactored components, a rebuilt AA flow against the new Figma, and a switch from a floating FAB to a beta-disclaimer + full-width CTA on the Meet Ryan PDP. Plus tooling: per-worktree dev ports, auto-derived playground status chips, and team-shared Claude memory.

---

## 1. Design system

This was the busiest area. The DLS gained components, lost untokenised hex codes, and gave us cleaner extraction points.

### 1.1 Tokenise the codebase + expand DLS palettes (`095ea66`)
Sweeping pass that removed raw hex / arbitrary spacing values across the whole app and replaced them with DLS tokens. The semantic, extended, and component palettes in `app/lib/colors.ts` were expanded to cover every colour the product actually uses, so nothing has to be inlined. This is the work that makes the `feedback_dls_design.md` rule ("never raw hex") actually enforceable.

### 1.2 New DLS primitives extracted from the questionnaire (`c902218`)
The questionnaire overlay was the only place in the codebase with its own bespoke list rows, text inputs, and OTP inputs. They got extracted into three reusable primitives and the questionnaire now consumes them:
- **`ListItemControl`** — all-purpose selection row (title + subtext + radio/checkbox). Lives in the DLS. Speccd in `reference_dls_list_item_control.md`.
- **`InputField`** — the underlined input with focus / disabled / error states. Speccd in `reference_dls_input_field.md`.
- **`OtpInput`** — segmented 4-digit and 6-digit OTP input. Speccd in `reference_dls_otp.md`.

### 1.3 AppBar centred title + new `ChatAppBar` (`6dcdff1`)
Standard `AppBar` had been left-aligning its title; centred it per Figma. Also introduced `ChatAppBar` with two variants:
- `firstTime` — used during onboarding when only Ryan is on screen.
- `degen` — used post-onboarding when the Ryan / Byron persona toggle is available. The persona switcher pill sits inside the app bar.

### 1.4 AI Banker chip component (`3e1fbe3`)
Renders the Ryan/Byron entry chip on the pay screen with three states: first-time (pulsing alert), alert (badge), and default. Speccd in `reference_dls_ai_banker_chip.md`. Used by `PayScreen`.

### 1.5 `FeedbackBar` extracted with thumbs vote + system-tone snackbar (`fa49298`)
The thumbs-up / thumbs-down / copy / share / refresh row that sits under Ryan's chat bubbles got pulled out into its own component (`FeedbackBar`). Votes now trigger a system-tone Snackbar acknowledging the feedback. Speccd in `reference_dls_feedback_bar.md`.

---

## 2. Screens and flows

### 2.1 Budget screen (`14c2a9b`)
New screen showing the current month's budget with two anchor cards: **Goal** (savings target progress) and **Pool** (discretionary spend left). Includes a "pacing" chip that says whether the user is ahead / on track / behind. Lives at `app/components/BudgetScreen.tsx`.

### 2.2 Goal-Budget Planning (GBP) flow (`2549687`)
End-to-end first-time goal setup flow. Walks the user from "set a goal" through monthly budget allocation, with design-lint pass recording wired up so the flow's playground entry shows a `confirmed` chip when it's been linted.

### 2.3 AA flow rebuilt against Figma + 2.0 branch states (`d48a7f2`)
The Account Aggregator (AA) consent flow was rebuilt to match the latest Figma. Adds **AA 2.0** branch states (consent confirmation paths, retry / failure variants) that the old implementation didn't cover. Touches `app/preview/AASim.tsx`.

### 2.4 Error states screen + reusable control-panel pattern (`c66b91a`)
Adds a full-page error state and a Snackbar-style inline error. Both go through `app/components/ErrorScreen.tsx`. As part of this work, a reusable "control panel" pattern was introduced for playground components so that prop-driven states (`disabled`, `error`, etc.) live in a side panel instead of multiplying variant chips. See `app/preview/_shared/ControlPanel.tsx`. This pattern is now the standard — see the playground feedback memory for the rule.

### 2.5 Verdict banner deprecated → Ryan chat bubble (`ebf97eb`)
The old "Verdict" banner that surfaced feasibility ("Yes you can afford this" / "No you can't") at the top of the plan screen was deprecated. Feasibility now arrives the same way every other Ryan comment does: as a chat bubble in the conversation. Removes a one-off UI surface and consolidates on the chat pattern.

### 2.6 Footprint card + deep-link anchors on playground (`1a5adeb`)
Added a new viz card type (Footprint) to the playground and gave every playground entry a deep-link anchor in the URL so a URL like `/playground/components#snackbar` jumps to that card. Useful for sharing specific component states in reviews.

### 2.7 Meet Ryan PDP: FAB → pre-release disclaimer + full-width CTA (`fef14c1`)
The Meet Ryan product detail page used to have a small floating arrow FAB in the bottom-right corner. That label was ambiguous (was tapping it joining a waitlist or actually committing?) and the screen didn't make it clear users were entering a pre-release build.

The FAB was replaced with a footer block matching Figma node `7524:14533`:
- Disclaimer line above the CTA: *"This beta may contain bugs or unfinished features"* in tertiary grey 12px Rubik Regular, with a 16×16 placeholder icon to its left.
- Full-width primary CTA: **"Join the beta"** in 16px Rubik Medium white-on-pink (`#D30AD7`), 312px wide, 48px tall, 100px radius.

New optional props on `FeaturePDP` — `footer="disclaimer-cta" | "fab"` (default `fab`), plus `disclaimerText` and `actionLabel`. Other PDPs keep the FAB. Meet Ryan opts in from both the playground entry (`app/(main)/playground/screens/page.tsx`) and the live onboarding overlay (`app/preview/OnboardingSim.tsx`).

The copy was deliberately Apple-style ("Pre-release software may contain errors…") rather than Ryan-character voice, because Ryan hasn't been introduced to the user yet at this point in the flow. slice voice (lowercase always).

---

## 3. Tooling and infrastructure

### 3.1 Remove x64 binary workaround (`2fbe329`)
Node runs native arm64 now; the old x64 binary shim in `package.json` / install scripts is gone.

### 3.2 Per-worktree dev script for parallel sessions (`a2a5217`)
Adds `scripts/dev.sh`, which finds the lowest free port starting at 3000, writes it to `.env.local` as `PORT=xxxx`, and starts Next on that port. This lets multiple git worktrees run dev servers in parallel without colliding on port 3000. The convention "always run `./scripts/dev.sh`, never `npm run dev` directly" is captured in `feedback_dev_port.md`.

### 3.3 Playground status chips are now derived from code (`0558fb2`)
Status chips on playground items (exploring / confirmed / integrated) used to be hand-toggled. Of 25 hand-set statuses at the time, 12 were lying about real state. They're now read-only and computed:
- **Integrated** if the symbol is imported anywhere outside `app/(main)/playground` and `app/preview`. Detected by `scripts/scan-playground-status.mjs`, which runs automatically via `predev` and `prebuild` hooks.
- **Confirmed** if design-lint has passed (recorded in `app/preview/_shared/lint-passes.json`) and the source hasn't been edited since (mtime check).
- **Exploring** otherwise.

Manifest: `app/preview/_shared/integration-manifest.json`. Generated state: `app/preview/_shared/status-generated.ts` (never hand-edit).

### 3.4 Team-shared Claude memory (`9e87ba9`)
Claude's project memory (design rules, DLS specs, copy rules, project context) was migrated from per-user home directory into the repo at `docs/claude-memory/`. A one-time setup script (`scripts/link-claude-memory.sh`) symlinks each developer's local Claude memory path to this folder, so the auto-load and auto-save mechanics keep working transparently.

The memory was tidied during the move:
- Three playground feedback files merged into one `feedback_playground.md`.
- `reference_dls_footer_header.md` split into `reference_dls_footer.md` and `reference_dls_header.md` to match the one-component-per-file convention.
- `docs/plan-*.md` added to `.gitignore` so one-off planning artefacts stay local.

After cloning, new teammates run:

```bash
./scripts/link-claude-memory.sh
```

See `README.md` for the full setup.

---

## 4. Notable rule / convention additions

These are codified in `docs/claude-memory/` and apply across the project:

- **"slice" and slice product names are always lowercase** (`feedback_slice_lowercase.md`). Covers slice, monies, sparks, slice in 3, and any future product line. Brand standard.
- **Never use em dashes** in any output — code, copy, .md files, chat (`feedback_no_em_dashes.md`).
- **Sentence case for UI labels** always (`feedback_sentence_case.md`).
- **`typography.metadata` always renders UPPERCASE** for tags and section headers — source strings stay sentence case (`feedback_metadata_uppercase.md`).
- **Match Figma 1:1, never improvise** (`feedback_figma_first.md`). Pulling the Figma source over the MCP is the default.
- **All chrome UI uses ShadCN defaults** — no brand colours, no raw hex, no inline styles in playground / dev chrome (`feedback_shadcn_chrome.md`).
- **Always start the dev server via `./scripts/dev.sh`** — never `npm run dev` directly (`feedback_dev_port.md`).
- **`.md` files are the designer's interface, `.ts` is Claude's job to sync** (`feedback_md_source_of_truth.md`).

---

## 5. Repo hygiene done at the end of this window

- Local main pushed to `origin/main`.
- Five stale remote branches deleted from GitHub (all were ancestors of main, no unique commits lost): `claude/competent-ritchie-ae75d3`, `claude/confident-bose-188e26`, `claude/modest-lumiere-102980`, `claude/suspicious-stonebraker-8315e2`, `feat/onboarding-playground-phase`.
- GitHub now has a single branch: `main`.

---

## Quick reference: where things live

| Thing | Path |
| --- | --- |
| DLS tokens (colours, spacing, radii, etc.) | `app/lib/*.ts` |
| Component specs (markdown) | `docs/claude-memory/reference_dls_*.md` |
| Components | `app/components/` |
| Screens | `app/components/*Screen.tsx`, `app/preview/` |
| Onboarding flow | `app/preview/OnboardingSim.tsx` |
| Playground (gallery) | `/playground/components`, `/playground/screens`, `/playground/flows`, `/playground/visualizations`, `/playground/widgets`, `/playground/dls` |
| Memory index | `docs/claude-memory/MEMORY.md` |
| Project conventions | `CLAUDE.md` (auto-loaded by Claude); design rules under `docs/claude-memory/feedback_*.md` |
