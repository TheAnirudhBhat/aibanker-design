import type { CSSProperties } from "react";

export type ReturnChatMotion = "current" | "focus";
const clamp = (n: number) => Math.max(0, Math.min(1, n));

/** One spring drives surface, content and composer; closing reverses that ride. */
export function returnChatMotion(mode: ReturnChatMotion, value: number, background: string) {
  const p = clamp(value);
  const content = mode === "current" ? clamp((p - 0.08) / 0.72) : clamp((p - 0.38) / 0.62);
  const surface: CSSProperties = { position: "absolute", inset: 0, pointerEvents: "none", background };
  if (mode === "focus") {
    const blur = p > 0.01 ? "blur(18px)" : "none";
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
