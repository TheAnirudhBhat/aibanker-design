# AI Banker v0.01 — Project Instructions

`.md` files are the single source of truth. The designer owns them — reads, edits, reviews. I create and maintain whatever `.ts` code files the codebase needs, and keep them in sync with the `.md` specs. Never reference `.ts` files in instructions or conversation as something the user should look at.

All design rules, DLS tokens, component specs, and workflow details live in the memory files. Reference `MEMORY.md` for the full index.

## Running the dev server

- Always start the dev server with `./scripts/dev.sh`, not `npm run dev` directly.
- The script picks a free port and writes it to `.env.local` as `PORT=xxxx`.
- When opening the browser or running Playwright, read the port from `.env.local` (or from the script's stdout) — don't assume 3000.
- This exists so multiple worktrees can run dev servers in parallel without colliding.
