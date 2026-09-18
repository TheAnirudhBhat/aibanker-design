import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";

/** A neutral illustrated carrier, independent of the icon's shape or palette.
 * Pass color for a monochrome SVG mask; omit it to preserve a multicolor asset,
 * or provide children for an existing React icon. Artwork never bakes in a glyph.
 */
export default function NeutralIconHolder({ iconSrc, color, size = 60, children }: {
  iconSrc?: string;
  color?: string;
  size?: number;
  children?: ReactNode;
}) {
  const glyph: CSSProperties = { width: "100%", height: "100%", display: "block" };
  return (
    <div aria-hidden data-icon-holder="tile" style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <Image src="/return-exp1/ambient/variants/gen_icon-holder-tile.png" alt="" draggable={false} width={size} height={size} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      <div style={{ position: "absolute", left: "29%", top: "29%", width: "42%", height: "42%", display: "grid", placeItems: "center", color, transform: "perspective(160px) rotateY(-12deg) rotateX(6deg)", filter: "drop-shadow(0 1px 0 rgba(255,255,255,.6))" }}>
        {children ?? (iconSrc && (color
          ? <span style={{ ...glyph, backgroundColor: color, mask: `url("${iconSrc}") center / contain no-repeat`, WebkitMask: `url("${iconSrc}") center / contain no-repeat` }} />
          : <Image src={iconSrc} alt="" width={Math.round(size * .42)} height={Math.round(size * .42)} draggable={false} style={{ ...glyph, objectFit: "contain" }} />))}
      </div>
    </div>
  );
}
