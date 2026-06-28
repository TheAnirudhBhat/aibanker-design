"use client";

import { useRouter } from "next/navigation";
import type { SubstateGroup } from "@/app/data/userStatePresets";
import { useTheme } from "@/app/lib/theme";
import { typography } from "@/app/lib/typography";
import {
  BG_PRIMARY, BG_SECONDARY,
  TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY,
  OUTLINE_SUBTLE, MAIN_PRIMARY, TEXT_ON_COLOR_PRIMARY,
  ALPHA_BLACK_40,
} from "@/app/lib/colors";
import { RADIUS_CIRCLE } from "@/app/lib/radii";

// Mirrors the left-nav (APP_ITEMS) so the in-sheet persona switch matches the desktop nav.
const PERSONAS: { id: string; label: string }[] = [
  { id: "new-user-jun-11", label: "Enhancements" },
  { id: "new-user", label: "New user" },
  { id: "new-user-beta", label: "New user (beta)" },
  { id: "returning", label: "Returning user" },
];

type ProtoDebugSheetProps = {
  open: boolean;
  onClose: () => void;
  personaId: string;
  controls?: SubstateGroup[];
  activeSubstates: Record<string, number>;
  onSubstateChange: (groupLabel: string, idx: number) => void;
};

// A pill that reads as selected (brand fill) or not (subtle outline). Shared by persona +
// substate rows so the whole panel has one consistent control language.
function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="transition-transform active:scale-[0.97]"
      style={{
        ...typography.buttonSmall,
        color: active ? TEXT_ON_COLOR_PRIMARY : TEXT_PRIMARY,
        backgroundColor: active ? MAIN_PRIMARY : BG_SECONDARY,
        border: `1px solid ${active ? MAIN_PRIMARY : OUTLINE_SUBTLE}`,
        borderRadius: RADIUS_CIRCLE,
        padding: "7px 14px",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_TERTIARY }}>
      {children}
    </span>
  );
}

/**
 * Full-bleed prototype debug panel — surfaced by the 3-finger tap-and-hold on a phone. Bottom
 * sheet that hosts everything the desktop dev chrome shows: persona switch + per-persona substate
 * controls (Skip to / Voice / Goal / AA) + theme + reload. Dev-only chrome, not product UI.
 */
export default function ProtoDebugSheet({
  open,
  onClose,
  personaId,
  controls,
  activeSubstates,
  onSubstateChange,
}: ProtoDebugSheetProps) {
  const router = useRouter();
  const { mode, toggle } = useTheme();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col justify-end"
      style={{ backgroundColor: ALPHA_BLACK_40 }}
      onClick={onClose}
    >
      <div
        className="animate-editor-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: BG_PRIMARY,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTop: `1px solid ${OUTLINE_SUBTLE}`,
          padding: "12px 20px calc(20px + env(safe-area-inset-bottom)) 20px",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        {/* Grabber */}
        <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: OUTLINE_SUBTLE, margin: "0 auto 16px" }} />

        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <span style={{ ...typography.headerH4, color: TEXT_PRIMARY }}>Prototype controls</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center"
            style={{ width: 32, height: 32, borderRadius: RADIUS_CIRCLE, backgroundColor: BG_SECONDARY, border: `1px solid ${OUTLINE_SUBTLE}`, cursor: "pointer" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke={TEXT_PRIMARY} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Persona switch */}
        <div className="flex flex-col" style={{ gap: 10, marginBottom: 20 }}>
          <SectionLabel>Persona</SectionLabel>
          <div className="flex flex-wrap" style={{ gap: 8 }}>
            {PERSONAS.map((p) => (
              <Pill
                key={p.id}
                label={p.label}
                active={p.id === personaId}
                onClick={() => {
                  if (p.id === personaId) { onClose(); return; }
                  router.push(`/app/${p.id}`);
                  onClose();
                }}
              />
            ))}
          </div>
        </div>

        {/* Per-persona substate controls */}
        {controls?.map((group) => {
          const activeIdx = activeSubstates[group.label] ?? 0;
          return (
            <div key={group.label} className="flex flex-col" style={{ gap: 10, marginBottom: 20 }}>
              <SectionLabel>{group.label}</SectionLabel>
              <div className="flex flex-wrap" style={{ gap: 8 }}>
                {group.substates.map((s, idx) => (
                  <Pill
                    key={s.id}
                    label={s.label}
                    active={idx === activeIdx}
                    onClick={() => onSubstateChange(group.label, idx)}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Footer: theme + reload */}
        <div className="flex items-center" style={{ gap: 8, marginTop: 4 }}>
          <button
            type="button"
            onClick={() => toggle()}
            className="flex-1 transition-transform active:scale-[0.98]"
            style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, backgroundColor: BG_SECONDARY, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: 14, padding: "12px 14px", cursor: "pointer" }}
          >
            {mode === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1 transition-transform active:scale-[0.98]"
            style={{ ...typography.buttonSmall, color: TEXT_SECONDARY, backgroundColor: BG_SECONDARY, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: 14, padding: "12px 14px", cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}
