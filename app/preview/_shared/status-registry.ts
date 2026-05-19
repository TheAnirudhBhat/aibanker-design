/**
 * Playground item status - derived from the codebase, not hand-toggled.
 *
 * Resolution at dev-server start (precedence top-down):
 *   1. integrated - the item's source symbol is imported (or its ChatCard type is constructed)
 *                   somewhere outside `app/(main)/playground` and `app/preview`.
 *   2. confirmed  - design-lint has passed for this id and no source file has been edited since.
 *   3. exploring  - default. Local WIP.
 *
 * The two ID sets come from `status-generated.ts`, which is regenerated on every
 * `pnpm dev`/`pnpm build` by `scripts/scan-playground-status.mjs`.
 *
 * To change a chip: change the code (integration) or run design-lint (confirmation).
 * Never edit `status-generated.ts` or this resolver by hand.
 */

import { INTEGRATED_IDS, CONFIRMED_IDS } from "./status-generated";

export type ItemStatus = "exploring" | "confirmed" | "integrated";

export function resolveStatus(id: string): ItemStatus {
  if (INTEGRATED_IDS.has(id)) return "integrated";
  if (CONFIRMED_IDS.has(id)) return "confirmed";
  return "exploring";
}
