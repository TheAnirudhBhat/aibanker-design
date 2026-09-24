import type { CSSProperties } from "react";

/** "current" is v1's opening and "recede" v2's, drawn for a keyboard coming
    up with the chat (user pin 2026-09-24: "on mobile the chat usually opens
    with the keyboard"): the motion lives in the space above it. v2's Chat
    opening switch left the panel on user pin the same day ("finalise recede
    and remove the rest"); Focus, Rise, Unfold and Glow are in git history. */
export type ReturnChatMotion = "current" | "recede";
const clamp = (n: number) => Math.max(0, Math.min(1, n));

/** The page under the chat; `origin` takes the bar's top in the page's own box. */
type ChatPage = { opacity: number; transform?: string; origin: (barY: number) => string | undefined };

/** One spring drives surface, content, composer and page, and the close is the
    same ride run backwards. */
/** `frosted` keeps the surface's 18px backdrop blur through the morph. Off on a
    phone: that blur is a full viewport of gaussian on EVERY frame of the open
    and the close — most of the close at under 25% opacity, where it can barely
    be seen — and it is what a phone's GPU stalls on once the JS is out of the
    way. The tint ramp alone (70% → 100%) carries the same read. */
export function returnChatMotion(mode: ReturnChatMotion, value: number, background: string, frosted = true) {
  const p = clamp(value);
  const surface: CSSProperties = { position: "absolute", inset: 0, pointerEvents: "none", background };
  if (mode === "current") {
    surface.opacity = clamp(p / 0.45);
    return {
      surface,
      contentOpacity: clamp((p - 0.08) / 0.72),
      copyOpacity: clamp((p - 0.08) / 0.72),
      contentTransform: undefined as string | undefined,
      page: { opacity: 1 - clamp(p / 0.72), transform: `translateY(${-p * 12}px)`, origin: () => undefined } as ChatPage,
      rowTravel: (i: number) => 10 + 12 * i,
    };
  }
  // The surface only needs the blur while it is SEE-THROUGH. It reaches a
  // 100%-opaque background at p=1 and the spring settles on exactly 1, so a
  // settled chat was blurring a backdrop nothing can see — a full viewport of
  // gaussian on every frame it sat open, and on every frame of a scroll.
  // A blur whose RADIUS moves is a fresh full-screen gaussian every frame that
  // the compositor can never reuse. One fixed radius, faded on opacity, reads
  // the same and is what keeps the morph fluid on a phone.
  const blur = frosted && p > 0.01 && p < 0.999 ? "blur(18px)" : "none";
  Object.assign(surface, { backdropFilter: blur, WebkitBackdropFilter: blur });
  const tint = (from: number) => `color-mix(in srgb, ${background} ${from + (100 - from) * p}%, transparent)`;
  // depth: the feed sinks back toward the message bar and dims under a slower
  // veil, so the sink stays in view above the keyboard; the chat comes forward.
  // The close is the open run backwards (user pin 2026-09-24: its opening is
  // "super clean, but the disappearing animation is not matching. Please match
  // it"): the chat lifts off toward you and fades as the page comes back up
  // from depth, brightening out from under the veil.
  Object.assign(surface, { opacity: clamp(p / 0.9), background: tint(55) });
  const content = clamp((p - 0.3) / 0.6);
  const page: ChatPage = { opacity: 1 - clamp((p - 0.15) / 0.85), transform: `scale(${1 - 0.12 * p})`, origin: (barY) => `50% ${barY}px` };
  return { surface, contentOpacity: content, copyOpacity: content, contentTransform: `scale(${1.06 - 0.06 * content})` as string | undefined, page, rowTravel: () => 0 };
}
