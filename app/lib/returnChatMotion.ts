import type { CSSProperties } from "react";

/** "current" is v1's opening and "recede" v2's, drawn for a keyboard coming
    up with the chat (user pin 2026-09-24: "on mobile the chat usually opens
    with the keyboard"): the motion lives in the space above it. v2's Chat
    opening switch left the panel on user pin the same day ("finalise recede
    and remove the rest"); Focus, Rise, Unfold and Glow are in git history. */
export type ReturnChatMotion = "current" | "recede";

/** The page under the chat; `origin` takes the bar's top in the page's own box. */
type ChatPage = { opacity: string; transform?: string; origin: (barY: number) => string | undefined };

/** A 0 → 1 ramp of `p` from `from` over `run`, clamped, as CSS. */
const ramp = (p: string, from: number, run: number) => `clamp(0, calc((${p} - ${from}) / ${run}), 1)`;

/** One spring drives surface, content, composer and page, and the close is the
    same ride run backwards. `p` is that spring's progress as a CSS <number>
    expression (the sim passes `var(--re1-f, 0)`): every value here is a CSS
    calc over it, so the spring writes one custom property per frame and
    nothing re-renders (2026-09-24 phone report: the morph stuttered on a
    render of the whole tree per frame). */
/** `frosted` keeps the surface's 18px backdrop blur while the morph is in
    flight. Off on a phone: that blur is a full viewport of gaussian on EVERY
    frame of the open and the close — most of the close at under 25% opacity,
    where it can barely be seen — and it is what a phone's GPU stalls on once
    the JS is out of the way. The tint ramp alone (70% → 100%) carries the same
    read. Off once the surface has settled too: an opaque surface blurs a
    backdrop nothing can see. */
export function returnChatMotion(mode: ReturnChatMotion, p: string, background: string, frosted = true) {
  const surface: CSSProperties = { position: "absolute", inset: 0, pointerEvents: "none", background };
  if (mode === "current") {
    surface.opacity = ramp(p, 0, 0.45);
    const content = ramp(p, 0.08, 0.72);
    return {
      surface,
      contentOpacity: content,
      copyOpacity: content,
      contentTransform: undefined as string | undefined,
      page: { opacity: `calc(1 - ${ramp(p, 0, 0.72)})`, transform: `translateY(calc(${p} * -12px))`, origin: () => undefined } as ChatPage,
      rowTravel: (i: number) => 10 + 12 * i,
    };
  }
  const blur = frosted ? "blur(18px)" : "none";
  Object.assign(surface, { backdropFilter: blur, WebkitBackdropFilter: blur });
  // depth: the feed sinks back toward the message bar and dims under a slower
  // veil, so the sink stays in view above the keyboard; the chat comes forward.
  // The close is the open run backwards (user pin 2026-09-24: its opening is
  // "super clean, but the disappearing animation is not matching. Please match
  // it"): the chat lifts off toward you and fades as the page comes back up
  // from depth, brightening out from under the veil.
  // The surface used to mix its colour from 55% to 100% under an opacity of
  // p / 0.9; the plain colour under the PRODUCT of the two is the same alpha,
  // and a solid whose only moving property is opacity is composited, never
  // repainted.
  Object.assign(surface, { opacity: `calc(${ramp(p, 0, 0.9)} * (0.55 + 0.45 * ${p}))` });
  const content = ramp(p, 0.3, 0.6);
  const page: ChatPage = { opacity: `calc(1 - ${ramp(p, 0.15, 0.85)})`, transform: `scale(calc(1 - 0.12 * ${p}))`, origin: (barY) => `50% ${barY}px` };
  return { surface, contentOpacity: content, copyOpacity: content, contentTransform: `scale(calc(1.06 - 0.06 * ${content}))` as string | undefined, page, rowTravel: () => 0 };
}
