"use client";

import { useRef, useState, useCallback } from "react";
import { typography } from "../lib/typography";
import Chat from "../components/Chat";
import GoalTracker from "../components/GoalTracker";
import type { GoalIndicatorData } from "../components/GoalTracker";

// ── Pill data ───────────────────────────────────────────────────

const PILLS = [
  { id: "ryan", icon: "/icons/ryan.svg", label: "Chat with Ryan" },
  { id: "sparks", icon: "/icons/spark.svg", label: "5 new sparks" },
  { id: "fires", icon: "/icons/fire.svg", label: "3 fires left" },
];

// ── Goal tracker data (three goals, all on track) ───────────────

const THREE_GOALS: GoalIndicatorData[] = [
  { id: "1", name: "Trip to Japan", pct: 42, status: "on-track", icon: "✈️", daysLabel: "4 months left", saved: 84000, target: 200000, ringColor: "#d30ad7", endDate: "Dec 2026", monthlyAmount: 10000, gradient: "linear-gradient(135deg, #fae2fa 0%, #d30ad7 100%)", heroEmoji: "✈️", heroScene: "japan" },
  { id: "2", name: "Emergency Fund", pct: 78, status: "ahead", icon: "🛡️", daysLabel: "12 days ahead", saved: 390000, target: 500000, ringColor: "#ff9a17", endDate: "Mar 2027", monthlyAmount: 15000, gradient: "linear-gradient(135deg, #fff3e3 0%, #ff9a17 100%)", heroEmoji: "🛡️" },
  { id: "3", name: "New Laptop", pct: 65, status: "on-track", icon: "💻", daysLabel: "On track", saved: 48750, target: 75000, ringColor: "#00a63e", endDate: "Sep 2026", monthlyAmount: 5000, gradient: "linear-gradient(135deg, #e0f4e8 0%, #00a63e 100%)", heroEmoji: "💻" },
];

// ── Main component ──────────────────────────────────────────────

export default function AppEntryPointSim() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [chatPhase, setChatPhase] = useState<"closed" | "entering" | "open" | "exiting">("closed");

  const openChat = useCallback(() => {
    setChatPhase("entering");
    requestAnimationFrame(() => requestAnimationFrame(() => setChatPhase("open")));
  }, []);

  const closeChat = useCallback(() => {
    setChatPhase("exiting");
    setTimeout(() => setChatPhase("closed"), 460);
  }, []);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ fontFamily: "var(--font-rubik), var(--font-sans), system-ui, sans-serif" }}
    >
      {/* Pay screen background */}
      <img
        src="/pay-screen.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-top"
      />

      {/* Pills row */}
      <div
        style={{
          position: "absolute",
          top: "17%",
          left: 0,
          right: 0,
        }}
      >
        <div
          ref={scrollRef}
          className="flex items-center gap-3 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ paddingLeft: 16, paddingRight: 16 }}
        >
          {PILLS.map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={pill.id === "ryan" ? openChat : undefined}
              className="flex items-center shrink-0 transition-transform active:scale-[0.97]"
              style={{
                gap: 4,
                backgroundColor: "#d827dc",
                border: "1.5px solid rgba(255,255,255,0.05)",
                borderRadius: 32,
                padding: "10px 16px",
              }}
            >
              <img src={pill.icon} alt="" style={{ width: 16, height: 16 }} />
              <span
                style={{
                  ...typography.caption,
                  color: "rgba(255,255,255,0.9)",
                  whiteSpace: "nowrap",
                }}
              >
                {pill.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat overlay — slides up from bottom, dismisses top to bottom */}
      {chatPhase !== "closed" && (
        <div
          className="absolute inset-0 z-20"
          style={{
            overflow: "hidden",
            backgroundColor: "white",
            transform: chatPhase === "open" ? "translateY(0%)" : "translateY(100%)",
            opacity: chatPhase === "open" ? 1 : 0.98,
            transition: "transform 460ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease-out",
            willChange: "transform, opacity",
            pointerEvents: chatPhase === "exiting" ? "none" : "auto",
          }}
        >
          <Chat
            title="slice"
            isSheetMinimized={false}
            sheetTransitionProgress={0}
            subtitle=""
            messages={[]}
            chips={[]}
            onChipSelect={() => {}}
            showInitialPrompt={true}
            initialScreenVariant="review-ontrack"
            initialSuggestions={[]}
            onInitialSuggestionClick={() => {}}
            showInput={true}
            inputPlaceholder="Ask Ryan..."
            onSubmit={() => {}}
            showTyping={false}
            thinkingLabel=""
            drawerContent={null}
            pinnedContent={null}
            headerActions={[]}
            onSheetClose={closeChat}
            onSheetExpand={() => {}}
            appBarDragHandleProps={{}}
            goalTrailingSlot={
              <GoalTracker
                goals={THREE_GOALS}
                onGoalTap={() => {}}
              />
            }
          />
        </div>
      )}
    </div>
  );
}
