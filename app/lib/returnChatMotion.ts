import type { CSSProperties } from "react";

export type ReturnChatMotion = "current" | "focus";
const clamp = (n: number) => Math.max(0, Math.min(1, n));

/** One spring drives surface, content and composer; closing reverses that ride. */
/** `frosted` keeps the surface's 18px backdrop blur through the morph. Off on a
    phone: that blur is a full viewport of gaussian on EVERY frame of the open
    and the close — most of the close at under 25% opacity, where it can barely
    be seen — and it is what a phone's GPU stalls on once the JS is out of the
    way. The tint ramp alone (70% → 100%) carries the same read. */
export function returnChatMotion(mode: ReturnChatMotion, value: number, background: string, frosted = true) {
  const p = clamp(value);
  const content = mode === "current" ? clamp((p - 0.08) / 0.72) : clamp((p - 0.38) / 0.62);
  const surface: CSSProperties = { position: "absolute", inset: 0, pointerEvents: "none", background };
  if (mode === "focus") {
    // The surface only needs the blur while it is SEE-THROUGH. It reaches a
    // 100%-opaque background at p=1 and the spring settles on exactly 1, so a
    // settled chat was blurring a backdrop nothing can see — a full viewport of
    // gaussian on every frame it sat open, and on every frame of a scroll.
    const blur = frosted && p > 0.01 && p < 0.999 ? "blur(18px)" : "none";
    Object.assign(surface, {
      opacity: clamp(p / 0.8),
      background: `color-mix(in srgb, ${background} ${70 + 30 * p}%, transparent)`,
      // A blur whose RADIUS moves is a fresh full-screen gaussian every frame that
      // the compositor can never reuse. One fixed radius, faded on opacity, reads
      // the same and is what keeps the morph fluid on a phone.
      backdropFilter: blur, WebkitBackdropFilter: blur,
    });
  } else {
    surface.opacity = clamp(p / 0.45);
  }
  return {
    surface,
    contentOpacity: content,
    contentTransform: mode === "current" ? undefined : `translateY(${(1 - content) * 16}px) scale(${0.98 + content * 0.02})`,
  };
}
