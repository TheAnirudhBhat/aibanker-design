"use client";

import type { ReactNode } from "react";
import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY,
  TEXT_TERTIARY,
  VALENTINO_500,
  BG_PRIMARY,
  ALPHA_WHITE_FF,
} from "../lib/colors";
import { SPACE_2XS, SPACE_S, SPACE_XS, SPACE_M, SPACE_L, SPACE_XL } from "../lib/spacing";
// SPACE_XS used for gap in label row and product info
import { RADIUS_CIRCLE } from "../lib/radii";
import { AppBar, GestureNav, NavButton } from "./AppChrome";

// ── Placeholder icon - /public/icons/placeholder-valentino.svg (proper Figma export) ──
// Use <img> at desired size - SVG scales proportionally with correct padding per feedback_icon_export.md

const PLACEHOLDER_ICON = "/icons/placeholder-valentino.svg";

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
      <div
        className="flex items-center justify-center"
        style={{
          paddingTop: SPACE_XS,
          gap: SPACE_2XS,
        }}
      >
        <img
          src={PLACEHOLDER_ICON}
          alt=""
          width={16}
          height={16}
          style={{ display: "block", flexShrink: 0 }}
        />
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
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  Feature PDP - per reference_dls_feature_pdp.md
// ══════════════════════════════════════════════════════════════════

export type FeatureRow = {
  icon?: ReactNode;
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

        {/* Feature highlight label (optional) */}
        {showFeatureHeader && (
          <div className="flex items-center" style={{ gap: SPACE_XS }}>
            <img src={PLACEHOLDER_ICON} alt="" width={16} height={16} style={{ display: "block" }} />
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
              {feature.icon ?? <img src={PLACEHOLDER_ICON} alt="" width={24} height={24} style={{ display: "block" }} />}
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
