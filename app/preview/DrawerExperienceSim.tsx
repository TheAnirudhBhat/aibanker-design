"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { StatusBar } from "../components/AppChrome";
import Chat from "../components/Chat";
import { typography } from "../lib/typography";
import {
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  BG_PRIMARY,
  BG_SECONDARY,
  SLATE_50,
  ALPHA_BLACK_05,
  ALPHA_BLACK_10,
  ALPHA_BLACK_30,
  GREEN_500,
  RED_500,
  VALENTINO_500,
  GREEN_50,
  BLUE_50,
  ORANGE_50,
  VALENTINO_50,
  RED_50,
} from "../lib/colors";
import { RADIUS_S, RADIUS_M, RADIUS_L, RADIUS_CIRCLE } from "../lib/radii";
import { ELEVATION_CARD, ELEVATION_BELOW } from "../lib/elevation";
import { SPACE_S } from "../lib/spacing";

/* ─── Constants ─────────────────────────────────────────────────── */

const SHEET_EXPANDED_TOP = 100; // px from top when expanded
const SHEET_COLLAPSED_HEIGHT = 72; // pill height at bottom
const PHONE_H = 780;
const NOOP = () => {};

/* ─── Back Layer: My Money ──────────────────────────────────────── */

function MyMoneyScreen() {
  const [scrolled, setScrolled] = useState(false);

  return (
    <div style={{ background: BG_PRIMARY, height: "100%", display: "flex", flexDirection: "column" }}>
      {/* L1 App bar - nav icon + H3 title, shadow on scroll */}
      <div
        className="shrink-0"
        style={{
          background: BG_PRIMARY,
          boxShadow: scrolled ? ELEVATION_BELOW : "none",
          transition: "box-shadow 200ms ease",
          zIndex: 1,
        }}
      >
        <StatusBar />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 64,
            gap: 8,
            paddingTop: 8,
            paddingBottom: 8,
            paddingLeft: 12,
            paddingRight: 12,
          }}
        >
          {/* Leading nav icon - 48×48 touch target, 24×24 glyph */}
          <div style={{ width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <img src="/icons/chevron-left.svg" alt="Back" width={24} height={24} style={{ display: "block" }} />
          </div>
          <span style={{ ...typography.headerH3, color: TEXT_PRIMARY, flex: "1 0 0", minWidth: 1 }}>My money</span>
        </div>
      </div>

      {/* Scrollable content */}
      <div
        className="scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}
        onScroll={(e) => setScrolled((e.target as HTMLElement).scrollTop > 0)}
      >
      {/* Hero wealth - 3-line Stash pattern */}
      <div style={{ textAlign: "center", padding: "24px 24px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <p style={{ ...typography.bodySmall, color: TEXT_TERTIARY, margin: 0 }}>
          Total wealth
        </p>
        <p style={{ ...typography.displaySmall, color: TEXT_PRIMARY, margin: 0 }}>
          &#x20B9;3,90,434
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 24 }}>
          <img src="/icons/analytics-down.svg" alt="" width={16} height={16} style={{ display: "block" }} />
          <p style={{ ...typography.buttonSmall, color: RED_500, margin: 0 }}>
            &#x20B9;11 (0.0%) 1 day
          </p>
        </div>
      </div>

      {/* Goal progress card */}
      <div style={{ padding: "0 24px 16px" }}>
        <div
          style={{
            background: BG_PRIMARY,
            border: `1px solid ${ALPHA_BLACK_05}`,
            borderRadius: RADIUS_M,
            padding: 16,
            boxShadow: ELEVATION_CARD,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Top row: thumbnail + goal info */}
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: RADIUS_S,
                background: GREEN_50,
                border: `0.3px solid ${ALPHA_BLACK_05}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 24,
              }}
            >
              ✈️
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, flex: 1, minWidth: 0 }}>Trip to Japan</span>
                <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, flexShrink: 0 }}>&#x20B9;1,08,000</span>
              </div>
              <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: "4px 0 0" }}>&#x20B9;2L by October</p>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ ...typography.caption, color: TEXT_TERTIARY, flex: 1 }}>Progress</span>
              <span style={{ ...typography.caption, color: GREEN_500, fontWeight: 500 }}>54%</span>
            </div>
            <div style={{ height: 8, backgroundColor: GREEN_50, borderRadius: RADIUS_CIRCLE, overflow: "hidden" }}>
              <div style={{ width: "54%", height: "100%", backgroundColor: GREEN_500, borderRadius: RADIUS_CIRCLE, boxShadow: "0px 2px 4px rgba(211,10,215,0.2)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions - Section Header Bold + 3×2 Grid */}
      <div style={{ padding: "24px 24px 12px" }}>
        <p style={{ ...typography.headerH4, color: TEXT_PRIMARY, margin: 0 }}>
          Quick actions
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, padding: "16px 24px" }}>
        <ActionTile icon="/icons/rupees.svg" label="Afford It" bg={BLUE_50} />
        <ActionTile icon="/icons/graph.svg" label="My Spends" bg={ORANGE_50} />
        <ActionTile icon="/icons/dashboard.svg" label="My Goals" bg={GREEN_50} />
        <ActionTile icon="/icons/save-doc.svg" label="Save Taxes" bg={VALENTINO_50} />
        <ActionTile icon="/icons/spark-line.svg" label="Surprise Me" bg={SLATE_50} />
        <ActionTile icon="/icons/message.svg" label="Rate Ryan" bg={RED_50} />
      </div>

      {/* Divider */}
      <div style={{ height: 8, background: BG_SECONDARY }} />

      {/* Banner */}
      <div style={{ padding: 24 }}>
        <div
          style={{
            background: `linear-gradient(160deg, #ffffff 40%, ${VALENTINO_50} 100%)`,
            borderRadius: RADIUS_M,
            padding: "24px 24px",
            border: `1px solid ${ALPHA_BLACK_05}`,
            boxShadow: ELEVATION_CARD,
          }}
        >
          <p style={{ ...typography.headerH4, color: TEXT_PRIMARY, margin: 0 }}>Share the privilege.</p>
          <p style={{ ...typography.bodySmall, color: TEXT_SECONDARY, margin: "4px 0 16px" }}>
            Invite your friends to AI Banker.
          </p>
          <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>Invite friends &rarr;</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 8, background: BG_SECONDARY }} />

      {/* More actions - Section Header Bold */}
      <div style={{ padding: "24px 24px 12px" }}>
        <p style={{ ...typography.headerH4, color: TEXT_PRIMARY, margin: 0 }}>
          More actions
        </p>
      </div>
      <div style={{ padding: "0 24px" }}>
        <MoreRow icon="/icons/share-general.svg" label="Share your feedback" sub="Help us improve your experience" />
        <MoreRow icon="/icons/shield.svg" label="Privacy, security & FAQs" sub="Your data is for your eyes only" />
        <MoreRow icon="/icons/telephone.svg" label="Contact support" sub="Reach out for any help" />
        <MoreRow icon="/icons/settings.svg" label="Manage accounts" sub="Manage accounts on money" last />
      </div>

      {/* Bottom spacing so content isn't hidden behind collapsed pill */}
      <div style={{ height: 120 }} />
      </div>{/* end scrollable content */}
    </div>
  );
}

/* ─── Sub-components (all static, no state) ─────────────────────── */



function ActionTile({
  icon,
  label,
  bg,
}: {
  icon: string;
  label: string;
  bg: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: RADIUS_M,
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img src={icon} alt="" width={20} height={20} style={{ display: "block" }} />
      </div>
      <p
        style={{
          ...typography.caption,
          fontWeight: 500,
          color: TEXT_PRIMARY,
          margin: 0,
          textAlign: "center",
          lineHeight: "1.2",
        }}
      >
        {label}
      </p>
    </div>
  );
}

function MoreRow({ icon, label, sub, last }: { icon: string; label: string; sub: string; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: `${SPACE_S}px 0`,
        borderBottom: last ? "none" : `1px solid ${ALPHA_BLACK_05}`,
        gap: 12,
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: RADIUS_S, background: BG_SECONDARY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <img src={icon} alt="" width={20} height={20} style={{ display: "block" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ ...typography.bodySmall, fontWeight: 500, color: TEXT_PRIMARY, margin: 0 }}>{label}</p>
        <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: 0 }}>{sub}</p>
      </div>
      <img src="/icons/chevron-right.svg" alt="" width={16} height={16} style={{ display: "block", flexShrink: 0 }} />
    </div>
  );
}

/* ─── Hardcoded Chat props ──────────────────────────────────────── */

const DRAWER_CHAT_MESSAGES = [
  {
    id: "ontrack-1",
    role: "assistant" as const,
    text: "Great going, Rajan - all your goals are **on track**. What would you like to talk about today?",
  },
  {
    id: "user-1",
    role: "user" as const,
    text: "How's my Japan trip fund looking?",
  },
  {
    id: "ontrack-2",
    role: "assistant" as const,
    text: "You've saved **₹1,08,000** of your ₹1,50,000 target - that's 72%. At your current pace, you'll hit it **18 days early**.",
  },
  {
    id: "user-2",
    role: "user" as const,
    text: "Nice! Can I skip this month's contribution?",
  },
  {
    id: "ontrack-3",
    role: "assistant" as const,
    text: "You could, but you'd lose the buffer. If you skip, you'll still make it - just with only 3 days to spare instead of 18. Want me to adjust the plan?",
  },
];

/* ─── Main Sim ──────────────────────────────────────────────────── */

/* Message reveal delays (ms) - after drawer opens, each subsequent message
   appears after a pause. Bot messages get a longer "typing" delay. */
const MESSAGE_DELAYS = [
  0,     // msg 0 - first bot greeting, visible immediately on open
  1400,  // msg 1 - user: "How's my Japan trip fund looking?"
  1800,  // msg 2 - bot: savings breakdown (longer = "thinking")
  1400,  // msg 3 - user: "Can I skip this month's contribution?"
  2000,  // msg 4 - bot: final advisory reply
];

export default function DrawerExperienceSim() {
  const [collapsed, setCollapsed] = useState(true);
  const [sheetTop, setSheetTop] = useState(SHEET_EXPANDED_TOP);
  const [visibleCount, setVisibleCount] = useState(1); // start with first bot msg
  const [hasSeenChat, setHasSeenChat] = useState(false);
  const simTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartTop = useRef(SHEET_EXPANDED_TOP);

  /* Clean up simulation timers on unmount */
  useEffect(() => {
    return () => simTimers.current.forEach(clearTimeout);
  }, []);

  /* Kick off the auto-play sequence: reveal messages one at a time */
  const startSimulation = useCallback(() => {
    // Clear any prior run
    simTimers.current.forEach(clearTimeout);
    simTimers.current = [];
    setVisibleCount(1); // reset to just greeting

    let cumulative = 0;
    for (let i = 1; i < DRAWER_CHAT_MESSAGES.length; i++) {
      cumulative += MESSAGE_DELAYS[i];
      const count = i + 1;
      const t = setTimeout(() => setVisibleCount(count), cumulative);
      simTimers.current.push(t);
    }
  }, []);

  const handleDragStart = useCallback(
    (clientY: number) => {
      dragging.current = true;
      dragStartY.current = clientY;
      dragStartTop.current = sheetTop;
    },
    [sheetTop],
  );

  const handleDragMove = useCallback((clientY: number) => {
    if (!dragging.current) return;
    const delta = clientY - dragStartY.current;
    const newTop = Math.max(60, Math.min(PHONE_H - SHEET_COLLAPSED_HEIGHT, dragStartTop.current + delta));
    setSheetTop(newTop);
  }, []);

  const handleDragEnd = useCallback(() => {
    dragging.current = false;
    // If dragged past midpoint → collapse, else snap back
    if (sheetTop > PHONE_H * 0.55) {
      setCollapsed(true);
      setSheetTop(SHEET_EXPANDED_TOP);
    } else {
      setSheetTop(SHEET_EXPANDED_TOP);
    }
  }, [sheetTop]);

  const handleExpand = useCallback(() => {
    if (collapsed) {
      // Start sheet from bottom, then animate up (reverse of collapse)
      const bottomTop = PHONE_H - SHEET_COLLAPSED_HEIGHT;
      setSheetTop(bottomTop);
      setCollapsed(false);
      setHasSeenChat(true);
      startSimulation(); // begin auto-play conversation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSheetTop(SHEET_EXPANDED_TOP);
        });
      });
    } else {
      // Animate sheet down to bottom, then collapse to pill
      const bottomTop = PHONE_H - SHEET_COLLAPSED_HEIGHT;
      setSheetTop(bottomTop);
      simTimers.current.forEach(clearTimeout); // stop simulation
      setTimeout(() => {
        setCollapsed(true);
        setSheetTop(SHEET_EXPANDED_TOP);
      }, 300);
    }
  }, [collapsed, startSimulation]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: BG_PRIMARY,
      }}
    >
      {/* Back layer - always rendered */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: collapsed ? "auto" : "none",
        }}
      >
        <MyMoneyScreen />
      </div>

      {/* Overlay dim when sheet is expanded */}
      {!collapsed && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: ALPHA_BLACK_30,
            opacity: Math.max(0, 1 - (sheetTop - SHEET_EXPANDED_TOP) / (PHONE_H * 0.5)),
            pointerEvents: "none",
            zIndex: 10,
            transition: dragging.current ? "none" : "opacity 0.3s ease",
          }}
        />
      )}

      {/* Collapsed pill */}
      {collapsed && (
        <button
          type="button"
          onClick={handleExpand}
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            right: 12,
            height: SHEET_COLLAPSED_HEIGHT,
            background: BG_PRIMARY,
            borderRadius: RADIUS_L,
            border: "none",
            boxShadow: `0 4px 24px ${ALPHA_BLACK_10}, 0 0 0 1px ${ALPHA_BLACK_05}`,
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            cursor: "pointer",
            zIndex: 20,
          }}
        >
          <div style={{ flex: 1, textAlign: "left", display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <p style={{ ...typography.headerH4, color: TEXT_PRIMARY, margin: 0 }}>Chat with Ryan</p>
            {hasSeenChat ? (
              <p style={{ ...typography.caption, color: TEXT_TERTIARY, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {DRAWER_CHAT_MESSAGES[visibleCount - 1]?.text.replace(/\*\*/g, "")}
              </p>
            ) : (
              <p style={{ ...typography.caption, color: VALENTINO_500, margin: 0 }}>1 new message</p>
            )}
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 15l-6-6-6 6" stroke={TEXT_TERTIARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Expanded sheet - real Chat component inside a draggable wrapper */}
      {!collapsed && (() => {
        const maxDrag = PHONE_H - SHEET_COLLAPSED_HEIGHT - SHEET_EXPANDED_TOP;
        const progress = Math.min(1, Math.max(0, (sheetTop - SHEET_EXPANDED_TOP) / maxDrag));
        const horizontalInset = progress * 12;
        const radius = 16 + progress * 4; // 16 → 20
        return (
          <div
            style={{
              position: "absolute",
              top: sheetTop,
              left: horizontalInset,
              right: horizontalInset,
              bottom: 0,
              background: BG_PRIMARY,
              borderTopLeftRadius: radius,
              borderTopRightRadius: radius,
              boxShadow: `0 -4px 24px ${ALPHA_BLACK_10}`,
              display: "flex",
              flexDirection: "column",
              zIndex: 20,
              overflow: "hidden",
              transition: dragging.current ? "none" : "all 0.3s ease",
            }}
          >
            {/* Drag handle area */}
            <div
              style={{ touchAction: "none", cursor: "grab", userSelect: "none" }}
              onPointerDown={(e) => {
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                handleDragStart(e.clientY);
              }}
              onPointerMove={(e) => handleDragMove(e.clientY)}
              onPointerUp={handleDragEnd}
            >
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 6 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: ALPHA_BLACK_10 }} />
              </div>
            </div>

            {/* Real Chat component - fade content as sheet drags to mask width shrink */}
            <div style={{ flex: 1, overflow: "hidden", opacity: progress < 0.5 ? 1 : Math.max(0, 1 - (progress - 0.5) * 4), transition: dragging.current ? "none" : "opacity 0.3s ease" }}>
              <Chat
                title="Ryan"
                messages={DRAWER_CHAT_MESSAGES.slice(0, visibleCount)}
                chips={[]}
                onChipSelect={NOOP}
                onSheetClose={() => {
                  // Animate sheet down, then collapse to pill
                  const bottomTop = PHONE_H - SHEET_COLLAPSED_HEIGHT;
                  setSheetTop(bottomTop);
                  setTimeout(() => {
                    setCollapsed(true);
                    setSheetTop(SHEET_EXPANDED_TOP);
                  }, 300);
                }}
                hideStatusBar
                showFeedbackRow={visibleCount >= DRAWER_CHAT_MESSAGES.length}
                sheetTransitionProgress={progress}
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
