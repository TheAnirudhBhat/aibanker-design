"use client";

import type { ReactNode } from "react";
import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  VALENTINO_500,
  BG_PRIMARY,
  ALPHA_WHITE_FF,
  EXT_BG_SUBTLE_MAIN,
  OUTLINE_SUBTLE,
} from "../lib/colors";
import { SPACE_2XS, SPACE_S, SPACE_XS, SPACE_M, SPACE_L, SPACE_XL } from "../lib/spacing";
// SPACE_XS used for gap in label row and product info
import { RADIUS_CIRCLE } from "../lib/radii";
import { AppBar, GestureNav, NavButton } from "./AppChrome";

// ── Placeholder icon - /public/icons/placeholder-valentino.svg (proper Figma export) ──
// Use <img> at desired size - SVG scales proportionally with correct padding per feedback_icon_export.md

const PLACEHOLDER_ICON = "/icons/placeholder-valentino.svg";

// ── Themed icon — drives a slice SVG's shape via CSS mask + tints with a themed
// colour, so it stays visible in light AND dark (per slice theming guidance). ──
function MaskIcon({ src, size = 24, color = TEXT_PRIMARY }: { src: string; size?: number; color?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

// ── Arrow right icon (24x24, white) - matches AASim ArrowRightIcon ──

function ArrowRightIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke={ALPHA_WHITE_FF}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── FAB - per reference_dls_fab.md ──

function Fab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center transition-transform active:scale-[0.95]"
      style={{
        width: 56,
        height: 56,
        borderRadius: RADIUS_CIRCLE,
        backgroundColor: VALENTINO_500,
        border: "none",
        cursor: "pointer",
        padding: SPACE_S,
      }}
    >
      <ArrowRightIcon />
    </button>
  );
}

// ── Footer with disclaimer + full-width CTA ──
// Layout per Figma node 7524:14533 (Button group). Used by Meet Ryan PDP.

function DisclaimerCtaFooter({
  disclaimerText,
  actionLabel,
  onAction,
}: {
  disclaimerText: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div
      style={{
        backgroundColor: BG_PRIMARY,
        paddingTop: SPACE_M,
        paddingLeft: SPACE_L,
        paddingRight: SPACE_L,
        paddingBottom: SPACE_M,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: SPACE_M,
      }}
    >
      <button
        type="button"
        onClick={onAction}
        className="transition-transform active:scale-[0.98]"
        style={{
          width: 312,
          height: 48,
          borderRadius: RADIUS_CIRCLE,
          backgroundColor: VALENTINO_500,
          border: "none",
          cursor: "pointer",
          ...typography.buttonNormal,
          color: ALPHA_WHITE_FF,
        }}
      >
        {actionLabel}
      </button>
      {/* Disclaimer sits BELOW the CTA */}
      <div className="flex items-center justify-center">
        <span
          style={{
            ...typography.caption,
            color: TEXT_TERTIARY,
            textAlign: "center",
            whiteSpace: "nowrap",
          }}
        >
          {disclaimerText}
        </span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Feature PDP - per reference_dls_feature_pdp.md
// ══════════════════════════════════════════════════════════════════

export type FeatureRow = {
  icon?: ReactNode;
  /** Path to a slice SVG icon; rendered themed via CSS mask when no `icon` node is given. */
  iconSrc?: string;
  title: string;
  subtitle: string;
};

type Props = {
  illustration?: ReactNode;
  showFeatureHeader?: boolean;
  featureText?: string;
  productName: string;
  subtitle?: string;
  features: FeatureRow[];
  onClose: () => void;
  onAction: () => void;
  footer?: "fab" | "disclaimer-cta";
  disclaimerText?: string;
  actionLabel?: string;
  /**
   * Layout variant.
   * - "default": the original three-row, full-copy PDP (kept intact for easy revert).
   * - "earlyAccess": trimmed, badge-led alternate that leans into the early-access feel.
   * To revert to the original look, pass variant="default".
   */
  variant?: "default" | "earlyAccess";
};

export default function FeaturePDP({
  illustration,
  showFeatureHeader = true,
  featureText = "Early access",
  productName,
  subtitle,
  features,
  onClose,
  onAction,
  footer = "fab",
  disclaimerText,
  actionLabel,
  variant = "earlyAccess",
}: Props) {
  return (
    <div
      className="relative h-full w-full flex flex-col"
      style={{ backgroundColor: BG_PRIMARY }}
    >
      {/* ── App bar: Standard with close icon, no title ── */}
      <AppBar
        leading={<NavButton kind="close" onClick={onClose} />}
        backgroundColor={BG_PRIMARY}
      />

      {/* ── Content container ── */}
      {variant === "earlyAccess" ? (
        // ── Alternate "early access" layout: badge-led, trimmed copy, lots of breathing room.
        //    Revert by passing variant="default".
        <div
          className="flex-1 flex flex-col"
          style={{
            paddingLeft: SPACE_XL,
            paddingRight: SPACE_XL,
            gap: SPACE_XL,
          }}
        >
          {/* Illustration - 128x128, right-aligned (shared with default) */}
          <div className="flex justify-end">
            {illustration ?? (
              <img
                src="/characters/ryan.svg"
                alt="Ryan"
                width={128}
                height={128}
                style={{ display: "block" }}
              />
            )}
          </div>

          {/* Badge leads — reads as an entry "pass": DLS pill + a tracked pass-id,
              split by a thin themed rule. No skeuomorphic ticket art, no emoji. */}
          <div className="flex flex-col" style={{ gap: SPACE_M }}>
            {showFeatureHeader && (
              <div
                style={{
                  alignSelf: "flex-start",
                  padding: `${SPACE_2XS}px ${SPACE_S}px`,
                  borderRadius: RADIUS_CIRCLE,
                  backgroundColor: EXT_BG_SUBTLE_MAIN,
                }}
              >
                <span style={{ ...typography.buttonSmall, color: VALENTINO_500 }}>
                  {featureText}
                </span>
              </div>
            )}

            {/* Bold short headline + one tight supporting line */}
            <div className="flex flex-col" style={{ gap: SPACE_XS }}>
              <h1 style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0 }}>
                {productName}
              </h1>
              {subtitle && (
                <p
                  className="whitespace-pre-line"
                  style={{ ...typography.bodyNormal, color: TEXT_SECONDARY, margin: 0 }}
                >
                  {subtitle}
                </p>
              )}
            </div>

            {/* Thin dashed stub seam — evokes a ticket tear-off, themed & tasteful */}
            <div
              aria-hidden="true"
              style={{
                marginTop: SPACE_2XS,
                borderTop: `1px dashed ${OUTLINE_SUBTLE}`,
              }}
            />
          </div>

          {/* Trimmed value points — single punchy line each, no subtitle clutter.
              All three points, titles only. */}
          {features.length > 0 && (
            <div className="flex flex-col" style={{ gap: SPACE_M }}>
              {features.slice(0, 3).map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-center"
                  style={{ gap: SPACE_S }}
                >
                  <div className="shrink-0" style={{ width: 24, height: 24 }}>
                    {feature.icon ?? (feature.iconSrc
                      ? <MaskIcon src={feature.iconSrc} size={24} color={VALENTINO_500} />
                      : <img src={PLACEHOLDER_ICON} alt="" width={24} height={24} style={{ display: "block" }} />)}
                  </div>
                  <span style={{ ...typography.headerH4, color: TEXT_PRIMARY }}>
                    {feature.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          className="flex-1 flex flex-col"
          style={{
            paddingLeft: SPACE_XL,
            paddingRight: SPACE_XL,
            gap: SPACE_L,
          }}
        >
          {/* Illustration - 128x128, right-aligned */}
          <div className="flex justify-end">
            {illustration ?? (
              <img
                src="/characters/ryan.svg"
                alt="Ryan"
                width={128}
                height={128}
                style={{ display: "block" }}
              />
            )}
          </div>

          {/* Feature highlight — DLS badge (no icon) */}
          {showFeatureHeader && (
            <div
              style={{
                alignSelf: "flex-start",
                padding: `${SPACE_2XS}px ${SPACE_S}px`,
                borderRadius: RADIUS_CIRCLE,
                backgroundColor: EXT_BG_SUBTLE_MAIN,
              }}
            >
              <span style={{ ...typography.buttonSmall, color: VALENTINO_500 }}>
                {featureText}
              </span>
            </div>
          )}

          {/* Product name + subtitle */}
          <div className="flex flex-col" style={{ gap: SPACE_XS }}>
            <h1 style={{ ...typography.headerH1, color: TEXT_PRIMARY, margin: 0 }}>
              {productName}
            </h1>
            {subtitle && (
              <p className="whitespace-pre-line" style={{ ...typography.bodyNormal, color: TEXT_TERTIARY, margin: 0 }}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Feature rows */}
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex items-start"
              style={{ gap: SPACE_S }}
            >
              <div className="shrink-0" style={{ width: 24, height: 24 }}>
                {feature.icon ?? (feature.iconSrc
                  ? <MaskIcon src={feature.iconSrc} size={24} color={VALENTINO_500} />
                  : <img src={PLACEHOLDER_ICON} alt="" width={24} height={24} style={{ display: "block" }} />)}
              </div>
              <div className="flex flex-col">
                <span style={{ ...typography.headerH4, color: TEXT_PRIMARY }}>
                  {feature.title}
                </span>
                <span style={{ ...typography.bodySmall, color: TEXT_TERTIARY }}>
                  {feature.subtitle}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Footer slot (pinned to bottom) + gesture nav ── */}
      <div className="shrink-0">
        {footer === "disclaimer-cta" ? (
          <DisclaimerCtaFooter
            disclaimerText={disclaimerText ?? ""}
            actionLabel={actionLabel ?? ""}
            onAction={onAction}
          />
        ) : (
          <div
            className="flex justify-end"
            style={{
              paddingLeft: SPACE_XL,
              paddingRight: SPACE_XL,
              paddingBottom: SPACE_L,
            }}
          >
            <Fab onClick={onAction} />
          </div>
        )}
        <GestureNav />
      </div>
    </div>
  );
}
