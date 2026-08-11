/**
 * Single source for the app-section surfaces.
 *
 * Both the desktop left-nav and the mobile debug sheet's persona switch render this list.
 * They used to keep separate hand-copied copies, which silently drifted — the sheet was
 * missing Cosimo and Base layout, so on a phone there was no way to reach them.
 *
 * Every app surface lives at `/app/<id>`, so the nav hrefs are derived rather than repeated.
 */
export const APP_PERSONAS: { id: string; label: string }[] = [
  { id: "new-user-jun-11", label: "Enhancements" },
  { id: "new-user", label: "New user" },
  { id: "new-user-beta", label: "New user (beta)" },
  { id: "new-user-2", label: "New user 2" },
  { id: "new-user-pitch", label: "Cosimo" },
  { id: "returning", label: "Returning user" },
  { id: "return-exp1", label: "Return exp1" },
  { id: "base-layout", label: "Base layout" },
];

export const APP_ITEMS = APP_PERSONAS.map((p) => ({ href: `/app/${p.id}`, label: p.label }));
