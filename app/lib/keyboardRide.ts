/** The keyboard's ride (user pins 2026-09-24/25: "the page should move with
    the keyboard always"). iOS animates its keyboard over a nominal 250ms on
    UIKit's keyboard curve, which it does not publish; this is the widely used
    approximation of it. The persona shell rides its own height on it as the
    keyboard comes and goes, and everything laid out against the shell's bottom
    edge — the chat's composer, the frost under it, the docked card, the
    thread's foot — follows by layout. Two knobs, shared by the shell and the
    sim: if the phone's keyboard runs longer or shorter, change them here. */
export const KB_RIDE_MS = 250;
export const KB_RIDE_EASE = "cubic-bezier(0.38, 0.7, 0.125, 1)";
