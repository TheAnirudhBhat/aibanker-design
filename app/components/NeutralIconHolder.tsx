import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";

/** A neutral illustrated carrier, independent of the icon's shape or palette.
 * Pass color for a monochrome SVG mask; omit it to preserve a multicolor asset,
 * or provide children for an existing React icon. Artwork never bakes in a glyph.
 */
export default function NeutralIconHolder({ iconSrc, color, iconColor, size = 60, children }: {
  iconSrc?: string;
  color?: string;
  iconColor?: string;
  size?: number;
  children?: ReactNode;
}) {
  const glyph: CSSProperties = { width: "100%", height: "100%", display: "block" };
  return (
    <div aria-hidden data-icon-holder="tile" style={{ position: "relative", width: size, height: size, flexShrink: 0, borderRadius: "50%" }}>
      <Image src="/return-exp1/ambient/variants/gen_icon-holder-tile.png" alt="" draggable={false} width={size} height={size} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", filter: color ? `drop-shadow(0 0 0 ${color})` : undefined }} />
      {color && <div aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `linear-gradient(145deg, color-mix(in srgb, ${color} 62%, transparent), transparent 58%)`, mixBlendMode: "color", opacity: 0.8 }} />}
      <div style={{ position: "absolute", left: "25%", top: "25%", width: "50%", height: "50%", borderRadius: "50%", display: "grid", placeItems: "center", overflow: "hidden", color, background: color ? `color-mix(in srgb, ${color} 20%, white)` : undefined, boxShadow: color ? `inset 0 0 0 1px color-mix(in srgb, ${color} 28%, transparent)` : undefined, transform: "perspective(160px) rotateY(-12deg) rotateX(6deg)", filter: "drop-shadow(0 1px 0 rgba(255,255,255,.6))" }}>
        {children ?? (iconSrc && (color
          ? <span style={{ ...glyph, width: "76%", height: "76%", backgroundColor: iconColor ?? "#fff", mask: `url("${iconSrc}") center / contain no-repeat`, WebkitMask: `url("${iconSrc}") center / contain no-repeat` }} />
          : <Image src={iconSrc} alt="" width={Math.round(size * .42)} height={Math.round(size * .42)} draggable={false} style={{ ...glyph, objectFit: "contain" }} />))}
      </div>
    </div>
  );
}
