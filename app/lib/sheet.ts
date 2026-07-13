// Docked bottom-sheet spacing — SINGLE SOURCE for the footprint / budget / questionnaire sheets.
//
// The "margin above the heading" kept regressing because three separate components each hard-coded
// their own heading top-padding (ConfirmListCard used 28, QuestionnaireOverlay drifted to 0, the
// budget sheet used 16). There was nothing to fix once, so every fix left the others behind. These
// constants are now the one place the values live — change them here and every docked sheet moves
// together.
export const SHEET_HEADING_TOP = 28; // px above a docked-sheet heading
export const SHEET_DOCK_BOTTOM = 12; // px below the sheet card, before the docked "Ask Ryan/Byron" input
