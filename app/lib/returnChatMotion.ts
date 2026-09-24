import type { CSSProperties } from "react";

/** "current" is v1's opening. The rest are v2's Chat opening switch (debug
    panel), each drawn for a keyboard coming up with the chat (user pin
    2026-09-24: "on mobile the chat usually opens with the keyboard", so a
    small recede behind the composer was lost under it). The motion lives in
    the space above the keyboard. */
export type ReturnChatMotion = "current" | "focus" | "rise" | "recede" | "unfold" | "glow";
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Where the message bar sits in the frame, for the openings that start from
    it: Unfold grows the surface out of it, Recede sinks the page toward it. */
export type ChatMotionBar = { top: number; height: number; margin: number; frameH: number };
/** The page under the chat; `origin` takes the bar's top in the page's own box. */
type ChatPage = { opacity: number; transform?: string; origin: (barY: number) => string | undefined };

/** One spring drives surface, content and composer; closing reverses that ride,
    except for the page: a v2 close leaves it still, simply there under the
    leaving chat (user pin 2026-09-24: "It slides in. It should just be as is
    in the background"). `opening` is the spring's target. */
/** `frosted` keeps the surface's 18px backdrop blur through the morph. Off on a
    phone: that blur is a full viewport of gaussian on EVERY frame of the open
    and the close — most of the close at under 25% opacity, where it can barely
    be seen — and it is what a phone's GPU stalls on once the JS is out of the
    way. The tint ramp alone (70% → 100%) carries the same read. */
export function returnChatMotion(mode: ReturnChatMotion, value: number, background: string, frosted = true, bar?: ChatMotionBar, opening = true) {
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
  let content: number;
  let contentTransform: string;
  let page: ChatPage = { opacity: 1, origin: () => undefined };
  let rowTravel = (i: number) => 10 + 12 * i;
  if (mode === "rise") {
    // pushed up by the keyboard: the feed slides up and away, the chat rises in
    // after it with the lower rows trailing, all of it moving the keyboard's way
    Object.assign(surface, { opacity: clamp(p / 0.55), background: tint(80) });
    content = clamp((p - 0.12) / 0.6);
    contentTransform = `translateY(${(1 - content) * 48}px)`;
    page = { opacity: 1 - clamp(p / 0.6), transform: `translateY(${-p * 120}px)`, origin: () => undefined };
    rowTravel = (i) => 16 + 18 * i;
  } else if (mode === "recede") {
    // depth: the feed sinks back toward the message bar and dims under a slower
    // veil, so the sink stays in view above the keyboard; the chat comes forward
    Object.assign(surface, { opacity: clamp(p / 0.9), background: tint(55) });
    content = clamp((p - 0.3) / 0.6);
    contentTransform = `scale(${1.06 - 0.06 * content})`;
    page = { opacity: 1 - clamp((p - 0.15) / 0.85), transform: `scale(${1 - 0.12 * p})`, origin: (barY) => `50% ${barY}px` };
    rowTravel = () => 0;
  } else if (mode === "unfold" && bar) {
    // the message bar grows up into the chat: the surface starts as the bar's
    // own rect and its top edge sweeps to the top of the frame, covering the
    // feed as it passes; the chat's copy lands once the edge is by
    const inset = `inset(${lerp(bar.top, 0, p)}px ${lerp(bar.margin, 0, p)}px ${lerp(bar.frameH - bar.top - bar.height, 0, p)}px round ${lerp(bar.height / 2, 0, p)}px)`;
    Object.assign(surface, { opacity: p > 0.001 ? 1 : 0, clipPath: inset, WebkitClipPath: inset });
    content = clamp((p - 0.5) / 0.5);
    contentTransform = `translateY(${(1 - content) * 10}px)`;
    page = { opacity: 1 - clamp((p - 0.55) / 0.45), origin: () => undefined };
    rowTravel = () => 0;
  } else if (mode === "glow") {
    // cosimo wakes: a light rises out of the bar (the sim's .re1-chat-glow,
    // CSS keyframes) while the feed dissolves and the chat settles under it
    Object.assign(surface, { opacity: clamp(p / 0.8), background: tint(70) });
    content = clamp((p - 0.3) / 0.6);
    contentTransform = `translateY(${(1 - content) * 10}px)`;
    page = { opacity: 1 - clamp(p / 0.65), transform: `translateY(${-p * 8}px)`, origin: () => undefined };
    rowTravel = (i) => 6 * i;
  } else {
    // focus, the opening as it stood: the cards dissolve and step back a hair
    Object.assign(surface, { opacity: clamp(p / 0.8), background: tint(70) });
    content = clamp((p - 0.38) / 0.62);
    contentTransform = `translateY(${(1 - content) * 16}px) scale(${0.98 + content * 0.02})`;
    page = { opacity: 1 - clamp(p / 0.72), transform: `translateY(${-p * 12}px) scale(${1 - p * 0.025})`, origin: () => undefined };
  }
  // The close: the page stays put under the chat. With a see-through surface
  // it is in view from the tap, so the chat's copy (its suggestions or its
  // thread) clears in the first ~50ms, before it can sit over the cards, and
  // the veil lifts off a page that never moved. contentOpacity keeps its own
  // ramp for the app bar's crossfade, which reads fine at either speed.
  const copy = opening ? content : clamp((p - 0.7) / 0.3);
  if (!opening) page = { opacity: 1, origin: () => undefined };
  return { surface, contentOpacity: content, copyOpacity: copy, contentTransform: contentTransform as string | undefined, page, rowTravel };
}
