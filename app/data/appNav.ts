/**
 * Single source for the app-section surfaces.
 *
 * Both the desktop left-nav and the mobile debug sheet's persona switch render this list.
 * They used to keep separate hand-copied copies, which silently drifted — the sheet was
 * missing Cosimo and Base layout, so on a phone there was no way to reach them.
 *
 * Every app surface lives at `/app/<id>`, so the nav hrefs are derived rather than repeated.
 */
export const APP_PERSONAS: { id: string; label: string; archived?: boolean }[] = [
  // Live surfaces come first; everything else is a past round kept for
  // reference and folded away under "Archive" in the nav (user call).
  { id: "new-user-pitch", label: "Cosimo" },
  { id: "return-exp1-v2", label: "Return exp1 · v2" },
  { id: "new-user-jun-11", label: "Enhancements", archived: true },
  { id: "new-user", label: "New user", archived: true },
  { id: "new-user-beta", label: "New user (beta)", archived: true },
  { id: "new-user-2", label: "New user 2", archived: true },
  { id: "returning", label: "Returning user", archived: true },
  { id: "return-exp1", label: "Return exp1", archived: true },
  { id: "base-layout", label: "Base layout", archived: true },
];

const toItem = (p: (typeof APP_PERSONAS)[number]) => ({ href: `/app/${p.id}`, label: p.label });
/** The surfaces in active use — the nav shows these open. */
export const APP_ITEMS = APP_PERSONAS.filter((p) => !p.archived).map(toItem);
/** Past rounds, still reachable, folded behind the Archive heading. */
export const APP_ARCHIVED_ITEMS = APP_PERSONAS.filter((p) => p.archived).map(toItem);
