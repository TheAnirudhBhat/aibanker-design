"use client";

import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY,
  TEXT_TERTIARY,
  OUTLINE_SUBTLE,
  BLUE_50,
  BLUE_500,
  ORANGE_50,
  ORANGE_500,
  GREEN_500,
  BG_SURFACE,
  BG_SURFACE_2,
} from "../lib/colors";
import { formatINR } from "../lib/financial-data";
import { AppBar, NavButton, GestureNav } from "./AppChrome";

// ── Props ─────────────────────────────────────────────────────────────────────

export type PotDetailProps = {
  name: string;
  saved: number;
  target: number;
  pct: number;
  status: "ahead" | "behind" | "on-track";
  daysLabel: string;
  icon?: string;
  heroScene?: string;
  onBack: () => void;
};

// ── Constants ──────────────────────────────────────────────────────────────────

const TEXT_SECONDARY = "rgba(0,0,0,0.7)";
const SHADOW_CARD = "0px 2px 32px 0px rgba(0,0,0,0.05)";

// ── Inline SVGs ────────────────────────────────────────────────────────────────

function ArrowUpIcon({ color = GREEN_500 }: { color?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 12V4M8 4L4 8M8 4l4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RecurringIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M14.5 3.5L16.5 5.5L14.5 7.5"
        stroke={TEXT_SECONDARY}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 10V9A3.5 3.5 0 0 1 7 5.5h9.5"
        stroke={TEXT_SECONDARY}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 16.5L3.5 14.5L5.5 12.5"
        stroke={TEXT_SECONDARY}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 10v1a3.5 3.5 0 0 1-3.5 3.5H3.5"
        stroke={TEXT_SECONDARY}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke="rgba(0,0,0,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Stash illustration placeholder ─────────────────────────────────────────────

function StashIcon({ icon, heroScene }: { icon?: string; heroScene?: string }) {
  // Scene-based illustration for known scenes
  if (heroScene === "japan") {
    return (
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 16,
          border: `0.54px solid ${OUTLINE_SUBTLE}`,
          backgroundColor: BLUE_50,
          overflow: "hidden",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #87CEEB 0%, #b8e6b8 60%, #6abf69 100%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 72, height: 44, borderRadius: "50% 50% 0 0", background: "linear-gradient(180deg, #5cb85c 0%, #3d8b3d 100%)" }} />
        <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderBottom: "14px solid #ff6b35" }} />
        <div style={{ position: "absolute", top: 12, left: 12, width: 20, height: 8, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.85)" }} />
      </div>
    );
  }

  // Emoji fallback
  return (
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: 16,
        border: `0.54px solid ${OUTLINE_SUBTLE}`,
        backgroundColor: BLUE_50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 36,
      }}
    >
      {icon || "💰"}
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ position: "relative", paddingLeft: 24, paddingRight: 24, paddingTop: 8, paddingBottom: 8 }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 28,
          backgroundColor: BG_SURFACE,
        }}
      />
      <p
        style={{
          ...typography.metadata,
          color: TEXT_TERTIARY,
          textTransform: "uppercase",
          margin: 0,
          position: "relative",
        }}
      >
        {label}
      </p>
    </div>
  );
}

// ── List item ──────────────────────────────────────────────────────────────────

type ListItemProps = {
  avatar?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
};

function ListItem({ avatar, title, subtitle, trailing }: ListItemProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 16,
        paddingBottom: 16,
        maxHeight: 72,
      }}
    >
      {avatar && (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 100,
            backgroundColor: "#fff",
            border: `1px solid ${OUTLINE_SUBTLE}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {avatar}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" }}>
        <p style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, margin: 0 }}>{title}</p>
        {subtitle && (
          <p style={{ ...typography.caption, color: TEXT_SECONDARY, margin: 0 }}>{subtitle}</p>
        )}
      </div>
      {trailing && <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{trailing}</div>}
    </div>
  );
}

// ── Tag chip ───────────────────────────────────────────────────────────────────

function Tag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <div
      style={{
        backgroundColor: bg,
        borderRadius: 100,
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 4,
        paddingBottom: 4,
      }}
    >
      <p style={{ ...typography.metadata, color, textTransform: "uppercase", margin: 0 }}>{label}</p>
    </div>
  );
}

// ── Badge dot ──────────────────────────────────────────────────────────────────

function BadgeDot({ color = ORANGE_500 }: { color?: string }) {
  return (
    <div style={{ padding: 4, borderRadius: 100 }}>
      <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </div>
  );
}

// ── Extended button ────────────────────────────────────────────────────────────

function ExtendedButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        backgroundColor: BG_SURFACE_2,
        border: "none",
        borderRadius: 100,
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: 24,
        paddingRight: 24,
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ ...typography.buttonNormal, color: TEXT_PRIMARY }}>{label}</span>
    </button>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────────

function ProgressCard({
  percent,
  target,
}: {
  percent: number;
  target: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: `1px solid ${OUTLINE_SUBTLE}`,
        borderRadius: 16,
        padding: 24,
        boxShadow: SHADOW_CARD,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Progress bar — DLS: 8px pill, /50 track, /500 fill */}
      <div style={{ height: 8, backgroundColor: ORANGE_50, borderRadius: 100, overflow: "hidden", width: "100%" }}>
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            backgroundColor: ORANGE_500,
            borderRadius: 100,
            boxShadow: "0px 2px 4px rgba(211,10,215,0.2)",
          }}
        />
      </div>

      {/* Labels */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <p style={{ ...typography.caption, color: ORANGE_500, margin: 0 }}>{percent}%</p>
        <div style={{ flex: 1 }} />
        <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: 0, textAlign: "right" }}>
          Target • {target}
        </p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PotDetail({
  name,
  saved,
  target,
  pct,
  status,
  daysLabel,
  icon,
  heroScene,
  onBack,
}: PotDetailProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#fff",
        overflow: "hidden",
      }}
    >
      {/* App bar */}
      <AppBar leading={<NavButton kind="back" onClick={onBack} />} />

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {/* Stash heading */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            paddingTop: 16,
          }}
        >
          <StashIcon icon={icon} heroScene={heroScene} />
          <p
            style={{
              ...typography.metadata,
              color: TEXT_PRIMARY,
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            {name}
          </p>
        </div>

        {/* Balance */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            paddingTop: 32,
          }}
        >
          <p style={{ ...typography.displaySmall, color: TEXT_PRIMARY, margin: 0 }}>{formatINR(saved)}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 24 }}>
            <ArrowUpIcon />
            <p style={{ ...typography.bodySmall, color: GREEN_500, margin: 0 }}>
              Earning at 100% RBI repo
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: 12,
            paddingLeft: 24,
            paddingRight: 24,
            paddingTop: 24,
          }}
        >
          <ExtendedButton label="Transfer" />
          <ExtendedButton label="Add" />
        </div>

        {/* Progress card */}
        <div style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 24 }}>
          <ProgressCard percent={pct} target={formatINR(target)} />
        </div>

        {/* Set Rules section */}
        <div style={{ paddingTop: 24, display: "flex", flexDirection: "column", gap: 4 }}>
          <SectionHeader label="Set rules" />
          <ListItem
            avatar={<RecurringIcon />}
            title="Recurring"
            subtitle="Set daily, weekly or monthly"
            trailing={<Tag label="Setup" color={BLUE_500} bg={BLUE_50} />}
          />
        </div>

        {/* Others section */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <SectionHeader label="Others" />
          <ListItem title="Statement" trailing={<BadgeDot />} />
          <ListItem title="Edit stash" trailing={<ChevronRightIcon />} />
        </div>

        {/* Bottom spacer for gesture nav */}
        <div style={{ height: 24 }} />
      </div>

      {/* Gesture nav */}
      <GestureNav />
    </div>
  );
}
