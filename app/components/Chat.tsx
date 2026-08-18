"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InitialPromptContent, type InitialSuggestion, type AlertScenario } from "./ChatInitialScreen";
import ChatCard, { type ChatCardData } from "./ChatCards";
import { AppBar, StatusBar, FooterInset, GestureNav, NavButton, ChatAppBar as DLSChatAppBar, BOTTOM_INSET } from "./AppChrome";
import { typography } from "../lib/typography";
import { ILLUST_AFFORD_IT, ILLUST_MY_SPENDS, ILLUST_FEEDBACK } from "../lib/illustrations";
import {
  VALENTINO_50, GREEN_50,
  BG_PRIMARY, BG_CARD, BG_GLASS, BG_SURFACE, BG_SURFACE_2, BG_SECONDARY, BLUE_50, RED_50,
  OUTLINE_SUBTLE, OUTLINE_BOLD, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY,
  ALPHA_BLACK_20, MAIN_PRIMARY, VALENTINO_500, TEXT_ON_COLOR_PRIMARY, TEXT_ON_COLOR_SECONDARY,
} from "../lib/colors";
import { RADIUS_M, RADIUS_PILL, RADIUS_CIRCLE } from "../lib/radii";
import { SPACE_XS, SPACE_S, SPACE_M, SPACE_L } from "../lib/spacing";
import { MOCK_KEYBOARD_HEIGHT } from "./MockKeyboard";
import { ELEVATION_CARD } from "../lib/elevation";
import FeedbackBar from "./FeedbackBar";
import { SnackbarSlotProvider, SnackbarSlotTarget } from "./SnackbarSlot";
import { OverlaySlotProvider, OverlaySlotTarget } from "./OverlaySlot";
import { highlightValues } from "../lib/chat-highlight";
import { isPhoneViewport } from "../hooks/useProtoMobile";

// ── Token-speed typewriter for scripted assistant messages ──
// Reveals text ~3-5 chars at a time at ~30ms, matching Claude's streaming cadence.
export function useTypewriter(fullText: string, active: boolean, onComplete?: () => void) {
  const [displayed, setDisplayed] = useState(active ? "" : fullText);
  const posRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const completeCalled = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active) {
      setDisplayed(fullText);
      posRef.current = fullText.length;
      return;
    }

    // Reset for new text
    posRef.current = 0;
    completeCalled.current = false;
    setDisplayed("");

    const tick = () => {
      const chunkSize = 3 + Math.floor(Math.random() * 3); // 3-5 chars
      const nextPos = Math.min(posRef.current + chunkSize, fullText.length);
      posRef.current = nextPos;
      setDisplayed(fullText.slice(0, nextPos));

      if (nextPos >= fullText.length) {
        if (!completeCalled.current) {
          completeCalled.current = true;
          onCompleteRef.current?.();
        }
        return;
      }
      const delay = 20 + Math.random() * 20; // 20-40ms
      timerRef.current = window.setTimeout(tick, delay);
    };

    // Small initial pause before typing starts
    timerRef.current = window.setTimeout(tick, 80);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fullText, active]);

  return displayed;
}

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  special?: "reality-check" | "goal-pinned" | "insight" | "success";
  card?: ChatCardData;
  streaming?: boolean;
};

export type ChatChip = {
  id: string;
  label: string;
  variant?: "primary" | "secondary" | "destructive" | "success";
};

// ── Thinking indicator (Claude-style pulsing label) ──
function ThinkingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center" style={{ gap: 8, paddingTop: 4, paddingBottom: 4 }}>
      <p
        className="animate-thinking-pulse text-[var(--chat-text-tertiary)]"
        style={typography.bodySmall}
      >
        {label}
      </p>
    </div>
  );
}

// Assistant reply choreography (single source of truth)
// Total = pre-glow pause + glow animation + post-glow settle.
const ASSISTANT_REPLY_TOTAL_MS = 600;
const ASSISTANT_REPLY_PRE_GLOW_MS = 300;
const ASSISTANT_REPLY_POST_GLOW_MS = 300;
const ASSISTANT_REPLY_GLOW_MS = Math.max(
  0,
  ASSISTANT_REPLY_TOTAL_MS - ASSISTANT_REPLY_PRE_GLOW_MS - ASSISTANT_REPLY_POST_GLOW_MS
);

type HeaderAction = {
  id: string;
  label: string;
  onClick: () => void;
  active?: boolean;
};

type ChatProps = {
  title: string;
  subtitle?: string;
  messages: ChatMessage[];
  chips: ChatChip[];
  onChipSelect: (chip: ChatChip) => void;
  showInput?: boolean;
  inputPlaceholder?: string;
  onSubmit?: (value: string) => void;
  headerActions?: HeaderAction[];
  drawerContent?: React.ReactNode;
  pinnedContent?: React.ReactNode;
  showTyping?: boolean;
  onProcessingStateChange?: (isProcessing: boolean) => void;
  appBarDragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  onSheetClose?: () => void;
  onSheetExpand?: () => void;
  isSheetMinimized?: boolean;
  sheetTransitionProgress?: number;
  showInitialPrompt?: boolean;
  initialSuggestions?: InitialSuggestion[];
  onInitialSuggestionClick?: (id: string, title: string) => void;
  initialScreenVariant?: "new5" | "review-ontrack" | "review-completed" | "review-rent";
  goalSnapshot?: { name: string; pct: number; saved: number; target: number; status: "ahead" | "behind" | "on-track"; daysLabel: string };
  thinkingLabel?: string | null;
  goalTrailingSlot?: React.ReactNode;
  goalPlanBuilder?: React.ReactNode;
  questionnaireOverlay?: React.ReactNode;
  hideStatusBar?: boolean;
  showFeedbackRow?: boolean;
  voice?: Voice;
  onVoiceChange?: (v: Voice) => void;
  onMosaicSelect?: (title: string) => void;
};

function VoiceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={TEXT_TERTIARY} strokeWidth="2.2">
      <path d="M12 3.75a3 3 0 0 1 3 3v4.5a3 3 0 1 1-6 0v-4.5a3 3 0 0 1 3-3Z" />
      <path d="M6.75 10.5v.75a5.25 5.25 0 0 0 10.5 0v-.75" strokeLinecap="round" />
      <path d="M12 16.5v2.75" strokeLinecap="round" />
      <path d="M9 20.25h6" strokeLinecap="round" />
    </svg>
  );
}

type Voice = "ryan" | "byron";

const VOICE_NAMES: Record<Voice, string> = {
  ryan: "Ryan",
  byron: "Byron",
};

function ChatAppBar({
  dragHandleProps,
  onClose,
  onExpand,
  isSheetMinimized = false,
  hasScrolledContent = false,
  dragHandleOpacity = 1,
  hasUserMessages = false,
  floating = false,
  goalTrailingSlot,
  hideStatusBar = false,
  voice = "ryan",
  onVoiceChange,
}: {
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  onClose?: () => void;
  onExpand?: () => void;
  isSheetMinimized?: boolean;
  hasScrolledContent?: boolean;
  dragHandleOpacity?: number;
  hasUserMessages?: boolean;
  floating?: boolean;
  goalTrailingSlot?: React.ReactNode;
  hideStatusBar?: boolean;
  voice?: Voice;
  onVoiceChange?: (v: Voice) => void;
}) {
  if (isSheetMinimized) {
    return (
      <div
        className="w-full shrink-0 cursor-pointer relative flex items-center"
        style={{ height: 72, paddingLeft: 24, paddingRight: 16, background: BG_PRIMARY }}
        onClick={onExpand}
        {...dragHandleProps}
      >
        <div className="absolute top-0 left-0 right-0 flex justify-center" style={{ paddingTop: 12 }}>
          <div style={{ width: 36, height: 4, backgroundColor: ALPHA_BLACK_20, borderRadius: RADIUS_CIRCLE }} />
        </div>
        <div className="flex items-center w-full">
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <p style={{ ...typography.headerH4, color: TEXT_PRIMARY, margin: 0 }}>
              {hasUserMessages ? "Continue chat" : "Start chat"}
            </p>
          </div>
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 36, height: 36, backgroundColor: OUTLINE_SUBTLE }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 10l5-6 5 6" stroke={TEXT_TERTIARY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  const closeIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke={TEXT_PRIMARY} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  // ── Floating layout — DLS ChatAppBar (degen variant) ──
  if (floating) {
    return (
      <DLSChatAppBar
        variant="degen"
        navKind="close"
        onNav={onClose}
        voice={voice}
        onVoiceChange={(v) => onVoiceChange?.(v as Voice)}
        trailing={goalTrailingSlot}
      />
    );
  }

  // ── Non-floating layout - standard AppBar ──
  return (
    <div className="w-full shrink-0">
      <AppBar
        backgroundColor={BG_PRIMARY}
        leading={(
          <div onPointerDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close chat"
              className="flex items-center justify-center"
              style={{ width: 48, height: 48, background: "transparent", border: "none", cursor: "pointer", padding: 12 }}
            >
              {closeIcon}
            </button>
          </div>
        )}
        trailing={goalTrailingSlot}
        hideStatusBar={hideStatusBar}
      />
    </div>
  );
}

// Vertically-rolling suggestion text shown in the input when empty (in place of a static
// placeholder). Clipped to one line with a top/bottom fade mask; seamless loop.
function RollingSuggestions({ items, firstDwell = 3200 }: { items: string[]; firstDwell?: number }) {
  const [i, setI] = useState(0);
  const lineH = 20;
  const cycle = 3200;
  useEffect(() => {
    if (items.length <= 1) return;
    // First line ("Ask Ryan") lingers longer; the suggestions then cycle steadily.
    const delay = i === 0 ? firstDwell : cycle;
    const id = window.setTimeout(() => setI((p) => p + 1), delay);
    return () => window.clearTimeout(id);
  }, [i, items.length, firstDwell]);
  if (items.length === 0) return null;
  const list = [...items, items[0]]; // clone first for a seamless wrap
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        top: "50%",
        transform: "translateY(-50%)",
        height: lineH,
        overflowY: "hidden",
        pointerEvents: "none",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 35%, #000 65%, transparent)",
        maskImage: "linear-gradient(to bottom, transparent, #000 35%, #000 65%, transparent)",
      }}
    >
      <div
        style={{
          transform: `translateY(${-i * lineH}px)`,
          transition: i === 0 ? "none" : "transform 640ms cubic-bezier(0.16,1,0.3,1)",
        }}
        onTransitionEnd={() => { if (i >= items.length) requestAnimationFrame(() => setI(0)); }}
      >
        {list.map((s, idx) => (
          <div
            key={idx}
            style={{ ...typography.bodySmall, color: TEXT_TERTIARY, height: lineH, lineHeight: `${lineH}px`, whiteSpace: "nowrap" }}
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TypeBox({
  value,
  onChange,
  onSubmit,
  placeholder,
  showElevation = false,
  leftAction,
  orb = false,
  cta,
  rollingSuggestions,
  spaceSuggestion,
  bottomSlot,
  onFocusChange,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  showElevation?: boolean;
  leftAction?: React.ReactNode;
  /** Cosimo (R14): the return-exp1 CHAT-state bar — 57px pill, no leading icon,
      the orb as the send affordance (per pin: "not the one with the icon on the left"). */
  orb?: boolean;
  /** R16: the pill ITSELF becomes the magic CTA — same box, same position, the
      contents morph in place (glass → glowing gradient + label). */
  cta?: { label: string; onPress: () => void };
  rollingSuggestions?: string[];
  /** Pressing SPACE in an empty field fills this suggestion (send stays on Enter / the button). */
  spaceSuggestion?: string;
  /** Rendered between the input row and the gesture nav — the suggestions sheet docks here. */
  bottomSlot?: React.ReactNode;
  /** Fires as the input gains/loses focus — drives the keyboard sim / native-keyboard lift. */
  onFocusChange?: (focused: boolean) => void;
}) {
  // "Ask Ryan" leads the roll: it's the first line and holds ~5.5s, then the suggestions
  // start cycling. Typing hides the roll entirely; clearing the field resets to the lead.
  const hasSuggestions = !!rollingSuggestions && rollingSuggestions.length > 0;
  // Don't auto-rotate suggestions while the user is still reading the page (e.g. the bento is
  // up). Only once they ENGAGE the input (focus it) does "Ask Ryan" lead, then suggestions cycle.
  const [engaged, setEngaged] = useState(false);
  const showRolling = hasSuggestions && !value && engaged;
  const rollingItems = hasSuggestions ? [placeholder.replace(/\.+$/, ""), ...rollingSuggestions!] : [];
  return (
    <>
      <FooterInset
        backgroundColor="transparent"
        paddingX={16}
        paddingTop={8}
        // 24 = the original 4 + 12 breathing room + 8 more below the message box
        // and suggestions button (per review).
        minBottomPadding={24}
      >
        <div className="flex items-center" style={{ gap: 0 }}>
          {leftAction}
          {/* ONE pill for both lives (R17): the glass message field and the magic
              CTA share this mounted box, so the change is a true in-place morph —
              the gradient fades in over the glass while the input fades out. */}
          <div
            className="relative flex items-center overflow-hidden flex-1"
            style={{
              height: orb ? 57 : 48,
              backgroundColor: BG_GLASS,
              borderRadius: RADIUS_CIRCLE,
              border: `1px solid ${OUTLINE_BOLD}`,
              boxShadow: ELEVATION_CARD,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              animation: cta ? "viewFeedCtaGlow 1800ms ease-in-out 420ms infinite alternate" : undefined,
            }}
          >
            {cta && (
              <button
                type="button"
                onClick={cta.onPress}
                aria-label={cta.label}
                className="absolute inset-0 flex items-center justify-center transition-transform active:scale-[0.99]"
                style={{ border: "none", padding: 0, background: "transparent", cursor: "pointer", zIndex: 2, borderRadius: 999, overflow: "hidden" }}
              >
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 999,
                    background:
                      "radial-gradient(58% 95% at 50% 112%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0) 62%)," +
                      "linear-gradient(180deg, #CE4BEA 0%, #BC1FD6 52%, #9A0EC0 100%)",
                    animation: "pitchFeedIn 480ms ease both",
                  }}
                />
                {/* a living mesh drifting slowly inside the body */}
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 999,
                    background:
                      "radial-gradient(80% 160% at 0% 100%, rgba(120,20,255,0.35) 0%, rgba(120,20,255,0) 60%)," +
                      "radial-gradient(80% 160% at 100% 0%, rgba(255,150,80,0.28) 0%, rgba(255,150,80,0) 60%)",
                    backgroundSize: "220% 220%, 220% 220%",
                    backgroundRepeat: "no-repeat",
                    animation: "viewFeedMesh 5200ms ease-in-out 480ms infinite alternate",
                  }}
                />
                {/* the pulse — blooms from the bottom centre to the OUTER edge */}
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 999,
                    background: "radial-gradient(120% 200% at 50% 100%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 62%)",
                    transformOrigin: "50% 100%",
                    animation: "viewFeedRipple 2200ms ease-out 700ms infinite",
                  }}
                />
                <span style={{ position: "relative", ...typography.buttonNormal, fontWeight: 500, color: "#FFFFFF", animation: "pitchFeedIn 360ms ease 200ms both" }}>{cta.label}</span>
              </button>
            )}
            <div
              className="relative flex items-center w-full h-full"
              style={{
                backgroundColor: "transparent",
                borderRadius: RADIUS_CIRCLE,
                paddingLeft: 16,
                paddingRight: 8,
                paddingTop: 8,
                paddingBottom: 8,
                // fades out beneath the CTA as the pill morphs (R17)
                opacity: cta ? 0 : 1,
                pointerEvents: cta ? "none" : "auto",
                transition: "opacity 260ms ease",
              }}
            >
              {showRolling && <RollingSuggestions items={rollingItems} firstDwell={5500} />}
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => { setEngaged(true); onFocusChange?.(true); }}
                onBlur={() => onFocusChange?.(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { onSubmit(); return; }
                  // Space on an empty field completes the suggested reply — it does NOT send.
                  if (spaceSuggestion && e.key === " " && !value) { e.preventDefault(); onChange(spaceSuggestion); }
                }}
                // Tapping the ALREADY-FOCUSED empty box also fills the suggestion (first tap focuses,
                // second tap completes) — send still waits for Enter or the button.
                onMouseDown={(e) => {
                  if (spaceSuggestion && !value && document.activeElement === e.currentTarget) onChange(spaceSuggestion);
                }}
                placeholder={showRolling ? "" : placeholder}
                className="flex-1 min-w-0 bg-transparent outline-none"
                style={{
                  ...typography.bodySmall,
                  // 16px (not bodySmall's 14) so iOS Safari doesn't auto-zoom the page when the
                  // field is focused — the standard chat-input fix. Still reads as input text.
                  // The cosimo bar matches the feed's 14 (R15) — that surface already ships 14.
                  fontSize: orb ? 14 : 16,
                  color: TEXT_PRIMARY,
                }}
              />
              {(orb || !!value.trim()) && (
                <button
                  onClick={value.trim() ? onSubmit : undefined}
                  disabled={orb && !value.trim()}
                  // Chat-app convention: sending must NOT dismiss the keyboard. Preventing the
                  // default on pointer-down keeps focus in the input, so no blur fires — which
                  // on iOS also means the layout can't move mid-tap (a blur-driven reflow
                  // between touchstart and click made this button miss its own tap).
                  onMouseDown={(e) => e.preventDefault()}
                  className="shrink-0 flex items-center justify-center rounded-full ml-1"
                  // Cosimo (R15): the SEND button is ALWAYS there — resting disabled
                  // and dim until text arrives, then it wakes.
                  style={{ width: 36, height: 36, backgroundColor: VALENTINO_500, border: "none", opacity: orb && !value.trim() ? 0.35 : 1, transition: "opacity 180ms ease", cursor: value.trim() ? "pointer" : "default" }}
                >
                  <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                    <path d="M7 11V3M3 7l4-4 4 4" stroke={TEXT_ON_COLOR_PRIMARY} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </FooterInset>
      {bottomSlot}
      <GestureNav />
    </>
  );
}

// ── Suggestions sheet bar (canon 1057:12831) ─────────────────────────────────
// The chat footer's widgets button expands the bar into a white bottom sheet of
// suggestion rows: the bar rides up as the sheet grows beneath it, the glyph
// morphs into a chevron-down, and the rows slide in from the bottom. Shared by
// every chat surface (OnboardingSim terminal bar, BaseLayoutSim) so the sheet,
// keyboard handoff and motion stay identical everywhere.

export type SuggestSheetRow = { key: string; title: string; caption: string; icon: string };

// Canonical rows (Figma list 992:4819). Icons are the canon 28px rasters
// (public/illustrations/suggest-*.png, exported from the frame). Copy is canon
// verbatim except sentence-case + typo fixes ("last month" → "Last month";
// "Getter better…" → "Get better…"; trailing period dropped).
export const SUGGEST_SHEET_ROWS: SuggestSheetRow[] = [
  { key: "big-spends", title: "Big spends", caption: "Biggest hits last month", icon: "/illustrations/suggest-big-spends.png" },
  { key: "top-categories", title: "Top categories", caption: "Last month", icon: "/illustrations/suggest-top-categories.png" },
  { key: "spending-says", title: "What your spending says", caption: "Spend personality", icon: "/illustrations/suggest-spending-says.png" },
  { key: "month-story", title: "Month on month", caption: "Get insights on daily money spending", icon: "/illustrations/suggest-month-on-month.png" },
  { key: "connect", title: "Connect other accounts", caption: "Get better insight and goal planning", icon: "/illustrations/suggest-connect-accounts.png" },
];

// ONE clock for everything that moves with the message box — sheet growth, the
// chat area's inset, the chrome lift, the keyboard slide. It is the OS keyboard's
// duration + curve because that is the one motion we don't control: matching it
// makes the sheet and the keyboard feel like the same gesture. Two reasons it must
// be a CONSTANT, not a per-state value: mixed durations made the bar bounce (up on
// the 250ms lift, down on a 420ms collapse), and a transition string that changes
// in the same commit as the value it animates cancels the transition outright (the
// chat inset jumped instead of gliding).
export const LIFT_EASE = "250ms cubic-bezier(0.4, 0, 0.2, 1)";

// The keyboard's lift is the CEILING for the message bar: the open sheet raises
// the bar to exactly the same point the keyboard takes it to (the list viewport
// is capped and scrolls inside), so the bar never rides higher than the keyboard
// would put it and the two states line up.
const SHEET_LIST_MAX = MOCK_KEYBOARD_HEIGHT - BOTTOM_INSET;

// On a real phone the equivalent ceiling is the MEASURED native keyboard inset,
// published by the iOS keyboard effect ([persona]/page.tsx). The bar sits at
// (shell bottom - chrome - grid row) in both states and the chrome terms cancel,
// so grid row == inset makes the keyboard→sheet swap pixel-stationary.
declare global { interface Window { __protoKbInset?: number } }

export function SuggestSheetBar({
  value,
  onChange,
  onSubmit,
  placeholder,
  rollingSuggestions,
  spaceSuggestion,
  open,
  onOpenChange,
  onFocusChange,
  buttonReady = true,
  rows = SUGGEST_SHEET_ROWS,
  onPickRow,
  onListHeightChange,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  rollingSuggestions?: string[];
  spaceSuggestion?: string;
  /** Sheet state — controlled so consumers can close it from scrims/handlers. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFocusChange?: (focused: boolean) => void;
  /** Gate for the leading button's slide-in (Jun-11 delays it ~3.5s after the first reveal). */
  buttonReady?: boolean;
  rows?: SuggestSheetRow[];
  /** Row tap — the sheet closes itself first, then the consumer routes the action. */
  onPickRow: (row: SuggestSheetRow) => void;
  /** Reports the list's natural height so consumers can ride the chat area up (chatLift). */
  onListHeightChange?: (h: number) => void;
}) {
  // Canon 1124:15709 — the message bar is its OWN strip sitting on the page
  // surface, and the framed panel wraps the LIST ONLY. So the bar looks identical
  // whether the keyboard or the sheet is up (nothing wraps it either way), and the
  // frame's hairline + radius belong to the panel, appearing and collapsing with
  // the rows instead of lingering around the bar after a dismiss.

  // Keyboard ↔ sheet handoff (phone): the two lifts live in DIFFERENT systems — the
  // keyboard shrinks the page shell (instant, inset px) while the sheet grows in-page
  // (animated, its own height). Swapping with both animating stacked the lifts and the
  // bar leapt above mid-screen, then dropped when the shell restored. The handoff is
  // made pixel-stationary instead: the sheet's grid row equals the measured keyboard
  // inset, the shell swap happens in the SAME commit (the "proto:kb:handoff" event), and
  // the swap itself doesn't animate — the OS keyboard sliding away IS the animation,
  // unveiling a sheet that is already in place (native attachment-panel behaviour).
  const [instant, setInstant] = useState(false);
  const instantTimer = useRef<number | null>(null);
  useEffect(() => () => { if (instantTimer.current != null) clearTimeout(instantTimer.current); }, []);
  const beginHandoff = () => {
    if (!isPhoneViewport()) return; // desktop keeps its calibrated animated handoff
    setInstant(true);
    if (instantTimer.current != null) clearTimeout(instantTimer.current);
    instantTimer.current = window.setTimeout(() => setInstant(false), 350);
  };
  // Sheet→keyboard (phone): the panel collapses in the SAME commit the shell snaps short
  // (both sized to the keyboard inset, so the bar is pixel-stationary) and the rising
  // keyboard covers the vacated strip. An attempt to keep the rows painted through the
  // rise (holdOpen) double-lifted the bar — held rows still take layout space below it.
  const listMax = isPhoneViewport() && window.__protoKbInset
    ? Math.max(180, window.__protoKbInset)
    : SHEET_LIST_MAX;

  return (
    <>
      <TypeBox
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        placeholder={placeholder}
        rollingSuggestions={rollingSuggestions}
        spaceSuggestion={spaceSuggestion}
        // Focusing summons the keyboard (mock on desktop, native on phone) and
        // collapses the sheet — canon never shows both at once.
        onFocusChange={(f) => {
          if (f && open) beginHandoff(); // sheet→keyboard: swap without animating
          if (f) onOpenChange(false);
          onFocusChange?.(f);
        }}
        leftAction={
          // The button slides in from the left and fades to 100% while the input
          // pill reduces to make room — the wrapper's width drives the pill reflow
          // so it animates smoothly (motion-skill ease).
          <div
            style={{
              width: buttonReady ? 58 : 0,
              opacity: buttonReady ? 1 : 0,
              transform: buttonReady ? "translateX(0)" : "translateX(-10px)",
              // overflow visible so the button's drop shadow isn't clipped; the
              // collapsed (width 0, opacity 0) button is made non-interactive instead.
              overflow: "visible",
              flexShrink: 0,
              pointerEvents: buttonReady ? "auto" : "none",
              transition: "width 460ms cubic-bezier(0.22, 1, 0.36, 1), opacity 460ms ease, transform 460ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <button
              type="button"
              aria-label="Suggestions"
              aria-expanded={open}
              tabIndex={buttonReady ? 0 : -1}
              // Keep focus (and therefore the layout) put until the click lands. Without
              // this, pointer-down blurs the input, the keyboard lift collapses, the button
              // drops ~266px out from under the finger, and the click never fires — the
              // "tap does nothing while the keyboard is open" bug.
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => {
                // Opening: dismiss the keyboard in the SAME commit so the bar swaps from
                // riding the keyboard to riding the sheet without moving (both lift it to
                // exactly the same point).
                if (!open && document.activeElement instanceof HTMLElement) {
                  const wasTyping = document.activeElement.tagName === "INPUT";
                  if (wasTyping) {
                    beginHandoff();
                    // The page's iOS keyboard effect restores the shell height NOW (not at
                    // its usual keyboard-settle), so shell + sheet swap in one frame and
                    // the bar holds its exact position while the keyboard slides away.
                    window.dispatchEvent(new Event("proto:kb:handoff"));
                  }
                  document.activeElement.blur();
                }
                onOpenChange(!open);
              }}
              className="flex items-center justify-center rounded-full shrink-0 transition-transform active:scale-[0.97]"
              style={{
                position: "relative",
                width: 48,
                height: 48,
                marginRight: 10,
                // Frosted-glass chrome (consistent with the input pill + close button):
                // translucent fill + backdrop blur so the glass reads in both modes.
                backgroundColor: BG_GLASS,
                border: `1px solid ${OUTLINE_BOLD}`,
                boxShadow: ELEVATION_CARD,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {/* Canon icon morph (1057:12831 mid-frames): the widgets glyph turns out as the
                  chevron-down turns in. ONE shared wrapper carries the rotation so both glyphs
                  hold the exact same transform at every instant — giving each its own rotate
                  AND scale made them spin past each other at different sizes mid-crossfade,
                  which is what read as a flicker. Locked together, the crossfade reads as one
                  control turning. The rotation runs on LIFT_EASE, the very curve and duration
                  the sheet expands on, so the morph looks caused by the sheet rather than
                  merely concurrent with it. Both vectors are official DLS paths INLINED with
                  fill:currentColor — never mask them: the source svgs bake fill-opacity, and
                  mask-alpha × tint-alpha double-dims (the widgets glyph rendered ~25% instead
                  of the intended black 50%). */}
              <div
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  // +90deg turns the right-chevron geometry into a chevron-DOWN on open.
                  transform: open ? "rotate(90deg)" : "rotate(0deg)",
                  // Constant string — a transition that changes in the same commit as the value
                  // it animates is cancelled outright (see LIFT_EASE above).
                  transition: `transform ${LIFT_EASE}`,
                  // The two glyphs inside crossfade on this SAME curve and duration, so the fade
                  // runs for the whole turn instead of finishing early (a shorter 160ms fade
                  // snapped the swap shut while the rotation was still going). Because both hold
                  // an identical transform throughout, the 50/50 midpoint reads as one glyph
                  // genuinely morphing rather than two icons dissolving past each other.
                }}
              >
              <div
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center"
                style={{ opacity: open ? 0 : 1, transition: `opacity ${LIFT_EASE}` }}
              >
                {/* Interface/Widgets library — canon tint black 50% (TEXT_TERTIARY). */}
                <svg width={20} height={20} viewBox="0 0 20 20" fill="none" style={{ display: "block", color: TEXT_TERTIARY }}>
                  <path fillRule="evenodd" clipRule="evenodd" d="M3.65864 3.59719C3.6587 3.59701 3.65859 3.59737 3.65864 3.59719L2.5488 7.01707C2.54866 7.0175 2.54853 7.01792 2.54839 7.01834C2.22148 8.03666 2.95902 9.07318 3.99218 9.07318H16.0081C17.0406 9.07318 17.7783 8.02775 17.4523 7.01955C17.4523 7.01972 17.4522 7.01938 17.4523 7.01955L16.3406 3.59406C16.1347 2.95577 15.5564 2.52802 14.897 2.52802H5.10331C4.44909 2.52802 3.86576 2.96162 3.65864 3.59719ZM1.31683 2.79776C1.85717 1.13764 3.37814 0 5.10331 0H14.897C16.6166 0 18.1422 1.12241 18.684 2.79945C18.6842 2.79993 18.6843 2.80041 18.6845 2.80089L19.7949 6.22266C20.6485 8.85969 18.7316 11.6012 16.0081 11.6012H3.99218C1.26958 11.6012 -0.647605 8.87236 0.20442 6.22556L0.205354 6.22266L1.31683 2.79776Z" fill="currentColor" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M2.19727 14.5371C2.19727 13.839 2.74986 13.2731 3.43151 13.2731H16.6667C17.3484 13.2731 17.901 13.839 17.901 14.5371C17.901 15.2352 17.3484 15.8011 16.6667 15.8011H3.43151C2.74986 15.8011 2.19727 15.2352 2.19727 14.5371Z" fill="currentColor" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M4.83008 18.736C4.83008 18.0379 5.38267 17.472 6.06432 17.472H13.9307C14.6124 17.472 15.165 18.0379 15.165 18.736C15.165 19.4341 14.6124 20 13.9307 20H6.06432C5.38267 20 4.83008 19.4341 4.83008 18.736Z" fill="currentColor" />
                </svg>
              </div>
              <div
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center"
                style={{ opacity: open ? 1 : 0, transition: `opacity ${LIFT_EASE}` }}
              >
                {/* chevron-right geometry (shared /icons/chevron-right.svg), tinted TERTIARY to
                    match the widgets glyph it swaps with — the two read as one control changing
                    state, so a heavier tint on one made the swap look like a different button. */}
                <svg width={24} height={24} viewBox="-7 -4 24 24" fill="none" style={{ display: "block", color: TEXT_TERTIARY }}>
                  <path fillRule="evenodd" clipRule="evenodd" d="M0.396716 0.368306C0.925653 -0.122784 1.78321 -0.122767 2.31212 0.368346L9.60333 7.13845C10.1322 7.62956 10.1322 8.42577 9.60331 8.91687L2.37143 15.6317C1.84251 16.1228 0.984952 16.1228 0.456023 15.6317C-0.0729062 15.1406 -0.0729115 14.3443 0.456011 13.8532L6.73022 8.02764L0.396673 2.14674C-0.132241 1.65563 -0.132222 0.859397 0.396716 0.368306Z" fill="currentColor" />
                </svg>
              </div>
              </div>
            </button>
          </div>
        }
        bottomSlot={
          // Suggestions sheet list (canon 992:4819): 28px raster icon + title +
          // Micro caption rows, hairline dividers indented past the icon column.
          // Collapses via grid-rows so the bar rides up smoothly as the sheet grows.
          <div
            style={{
              display: "grid",
              gridTemplateRows: open ? "1fr" : "0fr",
              // Collapsed rows leave the a11y/tab order too — visibility flips
              // hidden only AFTER the collapse finishes (0s delay on open).
              visibility: open ? "visible" : "hidden",
              transition: instant ? "none" : `grid-template-rows ${LIFT_EASE}, visibility 0s ${open ? "0s" : "250ms"}`,
            }}
          >
            <div style={{ overflow: "hidden", minHeight: 0, maxHeight: listMax }}>
              <div
                // Capped panels scroll internally; hide the bar (canon shows none).
                className="scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                // Measured for chatLift; reported CAPPED at the keyboard's lift, which is
                // exactly how far this panel raises the bar. Consumers ride the chat by the
                // same number, so a keyboard→sheet swap nets zero and never nudges the
                // conversation (a 16px mismatch here read as a glitchy scroll shift).
                ref={(el) => { if (el && el.offsetHeight > 0) onListHeightChange?.(Math.min(el.offsetHeight, listMax)); }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: SPACE_M,
                  maxHeight: listMax,
                  // Phone: FLOOR the panel at the keyboard inset too — grid row == inset is what
                  // makes the keyboard→sheet swap pixel-stationary, and rows measuring a little
                  // short of the inset dropped the bar ~40px a beat after the handoff (IMG_3291
                  // 0.12s). The wrapper above keeps minHeight 0, so the 0fr collapse still works.
                  minHeight: isPhoneViewport() && window.__protoKbInset ? listMax : undefined,
                  overflowY: "auto",
                  // Canon panel 1124:15732: white surface, 1.5px subtle hairline, radius 20,
                  // bleeding 1.5px off each edge like the 361-wide canon frame on a 360
                  // screen. No box-shadow: the collapse mask above clips it on every side,
                  // so declaring one would render nothing.
                  backgroundColor: BG_PRIMARY,
                  border: `1.5px solid ${OUTLINE_SUBTLE}`,
                  borderRadius: 20,
                  marginLeft: -1.5,
                  marginRight: -1.5,
                  marginBottom: -1.5,
                  // Canon pt-24 / px-24; pb-40 covers the home-indicator zone, of which the
                  // GestureNav below contributes BOTTOM_INSET, so the panel keeps the rest.
                  // No opacity fade — the rows stay solid and the collapsing grid cell masks
                  // them; the small translate makes them read as SLIDING IN from the bottom
                  // rather than unrolling in place.
                  padding: `${SPACE_L}px ${SPACE_L}px ${40 - BOTTOM_INSET}px`,
                  transform: open ? "translateY(0)" : "translateY(24px)",
                  transition: instant ? "none" : `transform ${LIFT_EASE}`,
                }}
              >
                {rows.map((row, idx) => (
                  <Fragment key={row.key}>
                    {idx > 0 && (
                      // Net-zero height like the canon h-0 divider: the hairline rides
                      // the 16px flex gaps without changing the row pitch.
                      <div aria-hidden="true" style={{ height: 1, marginTop: -0.5, marginBottom: -0.5, marginLeft: 44, backgroundColor: OUTLINE_SUBTLE }} />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onOpenChange(false);
                        onPickRow(row);
                      }}
                      className="flex items-start text-left transition-transform active:scale-[0.98]"
                      style={{ gap: SPACE_S, background: "transparent", border: "none", cursor: "pointer", width: "100%", padding: 0 }}
                    >
                      <img src={row.icon} alt="" width={28} height={28} style={{ display: "block", flexShrink: 0 }} />
                      <span className="flex flex-col" style={{ gap: 4, minWidth: 0 }}>
                        <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY, whiteSpace: "nowrap" }}>{row.title}</span>
                        {/* Canon Paragraph/Micro (10/12, +0.2px) — metadata token wears 4% tracking, canon uses 2%. */}
                        <span style={{ ...typography.metadata, letterSpacing: "0.2px", color: TEXT_TERTIARY, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.caption}</span>
                      </span>
                    </button>
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        }
      />
    </>
  );
}

function Bubble({ message, typewrite = false }: { message: ChatMessage; typewrite?: boolean }) {
  const isUser = message.role === "user";
  // For streaming messages, text updates come from state - no typewriter needed.
  // For scripted assistant messages that are the latest reveal, typewrite them.
  const shouldTypewrite = typewrite && !isUser && !message.streaming;
  const displayedText = useTypewriter(message.text, shouldTypewrite);

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`} style={{ gap: message.card ? 8 : 0 }}>
      {message.text && (
        isUser ? (
          <div
            className="max-w-[75%] rounded-[16px] rounded-tr-lg"
            style={{
              backgroundColor: VALENTINO_50,
              padding: "12px 16px",
            }}
          >
            <p className="whitespace-pre-line text-[var(--chat-text-primary)]" style={typography.bodySmall}>
              {message.text}
            </p>
          </div>
        ) : (
          <p className="whitespace-pre-line text-[var(--chat-text-primary)] w-full" style={typography.bodySmall}>
            {highlightValues(displayedText)}
          </p>
        )
      )}
      {message.card && (
        <div className="w-full">
          <ChatCard card={message.card} />
        </div>
      )}
    </div>
  );
}

function AssistantOptionsCard({
  message,
  chips,
  onChipSelect,
  showOptions,
  typewrite = false,
}: {
  message: ChatMessage;
  chips: ChatChip[];
  onChipSelect: (chip: ChatChip) => void;
  showOptions: boolean;
  typewrite?: boolean;
}) {
  const surfaceText = message.text;

  // Surface text typeswrites; options card appears once typing is done
  const [surfaceDone, setSurfaceDone] = useState(!typewrite || !surfaceText);

  const onSurfaceComplete = useCallback(() => setSurfaceDone(true), []);

  const displayedSurface = useTypewriter(surfaceText, typewrite && !!surfaceText, onSurfaceComplete);

  // Card with prompt and options appears instantly once surface text finishes
  const resolvedShowOptions = showOptions && surfaceDone;

  return (
    <div className="flex flex-col items-start w-full" style={{ gap: 16 }}>
      {surfaceText && (
        <p className="whitespace-pre-line text-[var(--chat-text-primary)] w-full" style={typography.bodySmall}>
          {highlightValues(displayedSurface)}
        </p>
      )}
      {message.card && (
        <div className="w-full">
          <ChatCard card={message.card} />
        </div>
      )}
      {(surfaceDone || !surfaceText) && (
        <div
          className={`w-full overflow-hidden transition-[max-height,opacity] duration-250 ease-out ${
            resolvedShowOptions ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-wrap gap-3">
            {chips.slice(0, 6).map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => onChipSelect(chip)}
                disabled={!resolvedShowOptions}
                className="transition-transform active:scale-[0.97]"
                style={{
                  ...typography.buttonSmall,
                  color: TEXT_PRIMARY,
                  backgroundColor: BG_SECONDARY,
                  border: `1px solid ${OUTLINE_SUBTLE}`,
                  borderRadius: RADIUS_PILL,
                  padding: `${SPACE_XS}px ${SPACE_M}px`,
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OptionList({
  chips,
  onChipSelect,
  compactTop,
}: {
  chips: ChatChip[];
  onChipSelect: (chip: ChatChip) => void;
  compactTop?: boolean;
}) {
  if (chips.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-3 ${compactTop ? "mt-1" : ""}`}>
      {chips.slice(0, 6).map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onChipSelect(chip)}
          className="transition-transform active:scale-[0.97]"
          style={{
            ...typography.buttonSmall,
            color: TEXT_PRIMARY,
            backgroundColor: BG_SECONDARY,
            border: `1px solid ${OUTLINE_SUBTLE}`,
            borderRadius: RADIUS_PILL,
            padding: `${SPACE_XS}px ${SPACE_M}px`,
          }}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

// ── New3 Alert Header - typed title + option list ──────────────
// ── New5 - Text-only with affirmative/negative/neutral options ──
const NEW5_TEXT_BY_VOICE: Record<Voice, string> = {
  ryan: "Rajan, your Japan trip is veering off course. You\u2019ve overspent by \u20B915,000 against what we budgeted. Let\u2019s do some damage control while we still can.",
  byron: "\u20B915,000 over budget on Japan. Dining out twice a day? Subscriptions you forgot existed? At this pace Japan is a 2027 problem.",
};
const NEW5_TEXT = NEW5_TEXT_BY_VOICE.ryan;

const NEW5_OPTIONS = [
  "Add ₹5,000 to pot",
  "I'll handle it myself",
  "Show me where I overspent",
];

const MOCK_RESPONSES: Record<string, string> = {
  "Add ₹5,000 to pot": "Done. \u20B95,000 moved to your Japan trip pot. You\u2019re now \u20B910,000 behind instead of \u20B915,000. I\u2019ve also tightened your dining budget by \u20B92,000 this month to help close the gap faster.",
  "I'll handle it myself": "Got it, I\u2019ll leave it with you. Just a heads up: if the gap grows past \u20B920,000, your December target starts looking tight. I\u2019ll check in again next week.",
  "Show me where I overspent": "Here\u2019s the breakdown. Dining out was \u20B98,200 (double your usual), shopping hit \u20B94,300, and subscriptions crept up by \u20B92,500. Dining is the big one to rein in.",
};

// ── Review Rent - rent-specific text-only variant ──
const RENT_TEXT = "Rajan, your rent of ₹25,000 is due in 5 days but your balance is only ₹11,200.\n\nYour salary of ₹62,000 hits 2 days later. If you can defer rent briefly, you're covered.";

const REVIEW_ONTRACK_TEXT_BY_VOICE: Record<Voice, string> = {
  ryan: "Great going, Rajan. All your goals are **on track**. What do you want to explore today?",
  byron: "Goals on track. Don\u2019t let it go to your head. What do you want to dig into?",
};
const REVIEW_ONTRACK_TEXT = REVIEW_ONTRACK_TEXT_BY_VOICE.ryan;

const REVIEW_COMPLETED_TEXT_BY_VOICE: Record<Voice, string> = {
  ryan: "You did it, Rajan. Your **Trip to Japan** goal is **100% funded**! Time to start planning what to pack. What do you want to explore next?",
  byron: "Trip to Japan. Done. Took you long enough. Now what?",
};
const REVIEW_COMPLETED_TEXT = REVIEW_COMPLETED_TEXT_BY_VOICE.ryan;

// ── Quick action cards for On Track variant ──
export type QuickAction = { category: string; title: string; illustration?: string; bg: string; onDark?: boolean };

// Row 1: two square cards
export const MOSAIC_ROW1: QuickAction[] = [
  { category: "Budget", title: "Can I afford it?", illustration: ILLUST_AFFORD_IT, bg: BG_CARD },
  { category: "Last month", title: "Analyse my spends", illustration: ILLUST_MY_SPENDS, bg: BG_CARD },
];
// Row 2 left: tall card
export const MOSAIC_TALL: QuickAction = { category: "Feedback", title: "Make Ryan smarter", illustration: ILLUST_FEEDBACK, bg: BG_CARD };
// Row 2 right: tall card
export const MOSAIC_TALL_RIGHT: QuickAction = { category: "Just for laughs", title: "Roast me", bg: BG_CARD };

export function MosaicCard({
  action,
  onSelect,
  style: extraStyle,
  className: extraClass = "",
}: {
  action: QuickAction;
  onSelect: () => void;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative text-left overflow-hidden transition-transform active:scale-[0.97] ${extraClass}`}
      style={{
        background: action.bg,
        border: "none",
        borderRadius: RADIUS_M,
        boxShadow: "0px 2px 32px 0px rgba(0,0,0,0.05)",
        ...extraStyle,
      }}
    >
      <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ ...typography.metadata, textTransform: "uppercase", color: action.onDark ? TEXT_ON_COLOR_SECONDARY : TEXT_SECONDARY, whiteSpace: "nowrap" }}>
          {action.category}
        </span>
        <span style={{ ...typography.headerH4, color: action.onDark ? TEXT_ON_COLOR_PRIMARY : TEXT_PRIMARY }}>
          {action.title}
        </span>
      </div>
      {action.illustration && (
        <img
          src={action.illustration}
          alt=""
          style={{ position: "absolute", bottom: 16, right: 16, width: 44, height: 44, objectFit: "contain" }}
        />
      )}
    </button>
  );
}

function ReviewOnTrackScreen({
  text = REVIEW_ONTRACK_TEXT,
  onMosaicSelect,
}: {
  text?: string;
  onMosaicSelect: (label: string) => void;
}) {
  return (
    <div className="shrink-0 mb-6">
      <p className="whitespace-pre-line" style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>
        {highlightValues(text)}
      </p>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Row 1: two square cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {MOSAIC_ROW1.map((a) => (
            <MosaicCard key={a.title} action={a} onSelect={() => onMosaicSelect(a.title)} style={{ aspectRatio: "1 / 1" }} />
          ))}
        </div>
        {/* Row 2: two tall cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <MosaicCard action={MOSAIC_TALL} onSelect={() => onMosaicSelect(MOSAIC_TALL.title)} style={{ aspectRatio: "1 / 1" }} />
          <MosaicCard action={MOSAIC_TALL_RIGHT} onSelect={() => onMosaicSelect(MOSAIC_TALL_RIGHT.title)} style={{ aspectRatio: "1 / 1" }} />
        </div>
      </div>
    </div>
  );
}

function New5TextOnly({
  text = NEW5_TEXT,
  options = NEW5_OPTIONS,
  mockResponses = MOCK_RESPONSES,
  onOptionSelect,
  voice = "ryan" as Voice,
}: {
  text?: string;
  options?: string[];
  mockResponses?: Record<string, string>;
  onOptionSelect: (label: string) => void;
  voice?: Voice;
}) {
  const [typingDone, setTypingDone] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [showReply, setShowReply] = useState(false);
  const [replyDone, setReplyDone] = useState(false);
  const onComplete = useCallback(() => setTypingDone(true), []);
  const onReplyComplete = useCallback(() => setReplyDone(true), []);
  const displayedText = useTypewriter(text, true, onComplete);
  const mockReply = selectedLabel ? mockResponses[selectedLabel] ?? "" : "";
  const displayedReply = useTypewriter(mockReply, showReply, onReplyComplete);

  // Stagger: user bubble appears → 500ms → reply starts typewriting
  useEffect(() => {
    if (!selectedLabel) return;
    const timer = window.setTimeout(() => setShowReply(true), 500);
    return () => window.clearTimeout(timer);
  }, [selectedLabel]);

  return (
    <div className="shrink-0 mb-6">
      <p className="whitespace-pre-line" style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>
        {highlightValues(displayedText)}
      </p>

      {options.length > 0 && !selectedLabel && (
        <div
          className={`transition-opacity duration-300 ease-out ${
            typingDone ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          style={{ marginTop: typingDone ? 28 : 0 }}
        >
          <div className="flex flex-wrap gap-3">
            {options.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => { setSelectedLabel(label); onOptionSelect(label); }}
                className="transition-transform active:scale-[0.97]"
                style={{
                  ...typography.caption,
                  color: TEXT_SECONDARY,
                  backgroundColor: BG_PRIMARY,
                  border: `1px solid ${OUTLINE_SUBTLE}`,
                  borderRadius: RADIUS_CIRCLE,
                  padding: "6px 12px",
                  boxShadow: "0px 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mock conversation after selection */}
      {selectedLabel && (
        <div className="mt-6 space-y-4">
          {/* User bubble - slides in immediately */}
          <div className="flex justify-end animate-chat-message-in">
            <div
              className="max-w-[75%] rounded-[16px] rounded-tr-lg"
              style={{ backgroundColor: VALENTINO_50, padding: "12px 16px" }}
            >
              <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>{selectedLabel}</p>
            </div>
          </div>
          {/* Assistant reply - starts after delay */}
          {showReply && (
            <div className="animate-chat-message-in">
              <p className="whitespace-pre-line" style={{ ...typography.bodySmall, color: TEXT_PRIMARY }}>
                {highlightValues(displayedReply)}
              </p>
              {replyDone && <FeedbackBar />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Chat({
  title,
  subtitle,
  messages,
  chips,
  onChipSelect,
  showInput,
  inputPlaceholder,
  onSubmit,
  headerActions = [],
  drawerContent,
  pinnedContent,
  showTyping,
  onProcessingStateChange,
  appBarDragHandleProps,
  onSheetClose,
  onSheetExpand,
  isSheetMinimized = false,
  sheetTransitionProgress = 0,
  showInitialPrompt = false,
  initialSuggestions = [],
  onInitialSuggestionClick,
  initialScreenVariant,
  goalSnapshot,
  thinkingLabel,
  goalTrailingSlot,
  goalPlanBuilder,
  questionnaireOverlay,
  hideStatusBar = false,
  showFeedbackRow: showFeedbackRowProp = false,
  voice = "ryan",
  onVoiceChange,
  onMosaicSelect,
}: ChatProps) {
  const isNewVariant = true; // All remaining variants use the new layout
  const [contentVisible, setContentVisible] = useState(true);

  // Handle voice switching with fade-out → reset → fade-in (matches DegenMode)
  const handleVoiceSwitch = useCallback((v: Voice) => {
    if (v === voice) return;
    setContentVisible(false);
    setTimeout(() => {
      onVoiceChange?.(v);
      setHasInteracted(false);
      setTimeout(() => setContentVisible(true), 50);
    }, 200);
  }, [voice, onVoiceChange]);

  const [draft, setDraft] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [revealedCount, setRevealedCount] = useState(() => (showInitialPrompt && !isNewVariant ? 0 : messages.length));
  const [showProcessingGlow, setShowProcessingGlow] = useState(false);
  const [hasScrolledContent, setHasScrolledContent] = useState(false);
  const [hasContentBelow, setHasContentBelow] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const revealTimerRef = useRef<number | null>(null);

  // Track which messages have already been typewritten so we never re-typewrite
  const typewrittenIdsRef = useRef<Set<string>>(new Set());

  // Alert state - derived from initialScreenVariant so it updates when controls change
  const alert = useMemo<AlertScenario | null>(() => {
    if (initialScreenVariant === "review-completed") {
      return {
        title: "Goal completed!",
        subtitle: "Your savings target has been reached.",
        icon: null,
        iconBg: BLUE_50,
      };
    }
    if (initialScreenVariant === "review-ontrack") {
      return {
        title: "All goals are on track.",
        subtitle: "Nothing to worry about. I'll nudge you if anything shifts.",
        icon: null,
        iconBg: BLUE_50,
      };
    }
    if (initialScreenVariant === "review-rent") {
      return {
        title: "Rajan, your rent is at risk.",
        subtitle: "You're ₹13,800 short with only 5 days to go.",
        icon: null,
        iconBg: RED_50,
      };
    }
    if (initialScreenVariant === "new5") {
      return {
        title: "Rajan, your trip to Japan is veering dangerously off course.",
        subtitle: "Want to course correct while you still can?",
        icon: null,
        iconBg: BLUE_50,
      };
    }
    return null;
  }, [initialScreenVariant]);

  // Initial prompt overlay is not used in the new layout - always false
  const initialPromptVisible = false;
  const glowStartTimerRef = useRef<number | null>(null);
  const glowStopTimerRef = useRef<number | null>(null);

  // Auto-scroll to bottom (old variant only)
  useEffect(() => {
    if (isNewVariant) return;
    const timer = setTimeout(() => {
      const scroller = scrollContainerRef.current;
      if (!scroller) return;
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [isNewVariant, messages.length, revealedCount, chips.length, showTyping]);

  // Auto-scroll as content grows - streaming / typewriter (old variant only)
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isNewVariant) return;
    const content = contentRef.current;
    const scroller = scrollContainerRef.current;
    if (!content || !scroller) return;

    let prevHeight = content.scrollHeight;
    const observer = new ResizeObserver(() => {
      const newHeight = content.scrollHeight;
      if (newHeight > prevHeight) {
        scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
      }
      prevHeight = newHeight;
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [isNewVariant, initialPromptVisible]);

  // New variant: snap-scroll when a user bubble mounts.
  // Uses a callback ref on each user message div - fires the instant React inserts it.
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const snappedIdsRef = useRef<Set<string>>(new Set());
  const userBubbleRef = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const id = el.getAttribute("data-msg-id");
    if (!id || snappedIdsRef.current.has(id)) return;
    snappedIdsRef.current.add(id);

    const scroller = scrollContainerRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;

    setTimeout(() => {
      const scrollerRect = scroller.getBoundingClientRect();
      const bubbleRect = el.getBoundingClientRect();
      const bubbleTopInScroller = bubbleRect.top - scrollerRect.top + scroller.scrollTop;
      const target = Math.max(0, bubbleTopInScroller - (scroller.clientHeight * 0.12));

      // Ensure content is tall enough to scroll to target position
      const minHeight = target + scroller.clientHeight;
      if (content.scrollHeight < minHeight) {
        content.style.minHeight = `${minHeight}px`;
      }

      // Smooth scroll animation
      const start = scroller.scrollTop;
      const distance = target - start;
      if (Math.abs(distance) < 1) return;
      const duration = 400;
      const startTime = performance.now();
      const ease = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        scroller.scrollTop = start + distance * ease(progress);
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    }, 300);
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      setRevealedCount((prev) => (prev === 0 ? prev : 0));
      setShowProcessingGlow(false);
      if (revealTimerRef.current !== null) {
        window.clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
      if (glowStartTimerRef.current !== null) {
        window.clearTimeout(glowStartTimerRef.current);
        glowStartTimerRef.current = null;
      }
      if (glowStopTimerRef.current !== null) {
        window.clearTimeout(glowStopTimerRef.current);
        glowStopTimerRef.current = null;
      }
      return;
    }

    if (revealedCount > messages.length) {
      setRevealedCount(messages.length);
      return;
    }

    if (revealedCount >= messages.length) {
      return;
    }

    const nextIndex = revealedCount;
    const nextMessage = messages[nextIndex];
    const previousMessage = messages[nextIndex - 1];

    // Streaming messages should appear immediately - no choreography delay
    if (nextMessage?.streaming) {
      setRevealedCount((prev) => prev + 1);
      return;
    }

    const getDelayForMessage = (index: number) => {
      const current = messages[index];
      const previous = messages[index - 1];
      if (!current) return 0;
      if (!previous) return 180;
      if (current.role === "assistant" && previous.role === "user") return ASSISTANT_REPLY_TOTAL_MS;
      // If the previous assistant message has selectable options, let the options
      // collapse animate first before showing the user's selected reply bubble.
      if (current.role === "user" && previous.role === "assistant") return chips.length > 0 ? 300 : 260;
      return 180;
    };
    const timeoutMs = getDelayForMessage(nextIndex);
    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
    }
    revealTimerRef.current = window.setTimeout(() => {
      setRevealedCount((prev) => Math.min(prev + 1, messages.length));
      revealTimerRef.current = null;
    }, timeoutMs);

    return () => {
      if (revealTimerRef.current !== null) {
        window.clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    };
  }, [messages, revealedCount, chips.length]);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current !== null) {
        window.clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
      if (glowStartTimerRef.current !== null) {
        window.clearTimeout(glowStartTimerRef.current);
        glowStartTimerRef.current = null;
      }
      if (glowStopTimerRef.current !== null) {
        window.clearTimeout(glowStopTimerRef.current);
        glowStopTimerRef.current = null;
      }
    };
  }, []);

  const renderedMessages = messages.slice(0, revealedCount);
  const nextPendingMessage = messages[revealedCount];
  const secondPendingMessage = messages[revealedCount + 1];
  const lastRevealedMessage = revealedCount > 0 ? messages[revealedCount - 1] : undefined;
  const latestRenderedIndex = renderedMessages.length - 1;
  const latestRenderedMessage = latestRenderedIndex >= 0 ? renderedMessages[latestRenderedIndex] : undefined;
  const previousRenderedIndex = latestRenderedIndex - 1;
  const previousRenderedMessage = previousRenderedIndex >= 0 ? renderedMessages[previousRenderedIndex] : undefined;
  const shouldQueueAssistantProcessingAfterVisibleUser =
    Boolean(nextPendingMessage && nextPendingMessage.role === "assistant" && lastRevealedMessage?.role === "user");
  const shouldCollapseOptionsBeforeUserReply =
    chips.length > 0 &&
    nextPendingMessage?.role === "user" &&
    latestRenderedMessage?.role === "assistant";
  const optionsCardIndex =
    chips.length > 0
      ? latestRenderedMessage?.role === "assistant"
        ? latestRenderedIndex
        : latestRenderedMessage?.role === "user" && previousRenderedMessage?.role === "assistant"
          ? previousRenderedIndex
          : -1
      : -1;
  const shouldShowOptionsExpanded =
    chips.length > 0 &&
    optionsCardIndex >= 0 &&
    latestRenderedMessage?.role === "assistant" &&
    !shouldCollapseOptionsBeforeUserReply;

  useEffect(() => {
    const clearGlowTimers = () => {
      if (glowStartTimerRef.current !== null) {
        window.clearTimeout(glowStartTimerRef.current);
        glowStartTimerRef.current = null;
      }
      if (glowStopTimerRef.current !== null) {
        window.clearTimeout(glowStopTimerRef.current);
        glowStopTimerRef.current = null;
      }
    };

    clearGlowTimers();
    setShowProcessingGlow(false);

    if (!shouldQueueAssistantProcessingAfterVisibleUser) {
      return;
    }

    // Choreography: glow starts immediately with thinking indicator, no pre-delay.
    const glowStartDelayMs = 0;
    const glowDurationMs = ASSISTANT_REPLY_GLOW_MS + ASSISTANT_REPLY_PRE_GLOW_MS;

    glowStartTimerRef.current = window.setTimeout(() => {
      setShowProcessingGlow(true);
      glowStartTimerRef.current = null;
    }, glowStartDelayMs);

    glowStopTimerRef.current = window.setTimeout(() => {
      setShowProcessingGlow(false);
      glowStopTimerRef.current = null;
    }, glowStartDelayMs + glowDurationMs);

    return clearGlowTimers;
  }, [shouldQueueAssistantProcessingAfterVisibleUser, revealedCount, messages]);

  const shouldRenderProcessingGlow = showTyping || showProcessingGlow;

  // Thinking indicator appears 300ms after user bubble is revealed
  const [showThinking, setShowThinking] = useState(false);
  const thinkingTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (thinkingTimerRef.current !== null) {
      window.clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
    if (shouldQueueAssistantProcessingAfterVisibleUser) {
      thinkingTimerRef.current = window.setTimeout(() => {
        setShowThinking(true);
        thinkingTimerRef.current = null;
      }, 300);
    } else {
      setShowThinking(false);
    }
    return () => {
      if (thinkingTimerRef.current !== null) {
        window.clearTimeout(thinkingTimerRef.current);
        thinkingTimerRef.current = null;
      }
    };
  }, [shouldQueueAssistantProcessingAfterVisibleUser]);

  useEffect(() => {
    onProcessingStateChange?.(shouldRenderProcessingGlow);
  }, [onProcessingStateChange, shouldRenderProcessingGlow]);

  useEffect(() => {
    if ((showInitialPrompt && !isNewVariant) || isSheetMinimized) {
      setHasScrolledContent(false);
      setHasContentBelow(false);
      return;
    }

    const scroller = scrollContainerRef.current;
    if (!scroller) return;

    const updateScrolledState = () => {
      setHasScrolledContent(scroller.scrollTop > 0);
      if (isNewVariant && messagesContainerRef.current) {
        // For new variant, check if the messages container's bottom is below the viewport
        // (ignores artificial minHeight spacer)
        const containerBottom = messagesContainerRef.current.getBoundingClientRect().bottom;
        const scrollerBottom = scroller.getBoundingClientRect().bottom;
        setHasContentBelow(containerBottom > scrollerBottom + 1);
      } else {
        setHasContentBelow(scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1);
      }
    };

    updateScrolledState();
    scroller.addEventListener("scroll", updateScrolledState, { passive: true });
    return () => scroller.removeEventListener("scroll", updateScrolledState);
  }, [showInitialPrompt, isNewVariant, isSheetMinimized, messages.length, chips.length, revealedCount]);

  const clampedTransitionProgress = Math.max(0, Math.min(1, sheetTransitionProgress));
  const bodyOpacity = Math.max(0, 1 - clampedTransitionProgress * 1.35);
  const bodyTranslateY = Math.round(clampedTransitionProgress * 10);

  return (
    <SnackbarSlotProvider>
    <OverlaySlotProvider>
    <div
      className="relative flex h-full flex-col overflow-hidden"

      style={{ fontFamily: 'var(--font-rubik), var(--font-sans), system-ui, sans-serif', pointerEvents: 'none', background: BG_PRIMARY }}
    >
      {/* AppBar in normal flow - for minimized mode and initial prompt screen */}
      {(isSheetMinimized || initialPromptVisible) && (
        <div style={{ pointerEvents: 'auto' }}>
          <ChatAppBar
            dragHandleProps={appBarDragHandleProps}
            onClose={onSheetClose}
            onExpand={onSheetExpand}
            isSheetMinimized={isSheetMinimized}
            hasScrolledContent={hasScrolledContent}
            dragHandleOpacity={1}
            hasUserMessages={messages.some((m) => m.role === "user")}
            goalTrailingSlot={goalTrailingSlot}
            hideStatusBar={hideStatusBar}
            voice={voice}
            onVoiceChange={handleVoiceSwitch}
          />
        </div>
      )}

      {/* Body - disabled when sheet is minimized so My Money behind receives all events */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{
          pointerEvents: isSheetMinimized ? 'none' : 'auto',
          opacity: bodyOpacity,
          transform: `translateY(${bodyTranslateY}px)`,
          transition: 'opacity 160ms linear, transform 220ms ease-out',
        }}
      >
        {(
          <div className="relative flex-1 overflow-hidden">
            {/* Floating app bar - overlays scroll content */}
            <div className="absolute top-0 left-0 right-0 z-10" style={{ pointerEvents: 'none' }}>
              <div style={{ pointerEvents: 'auto' }}>
                <ChatAppBar
                  onClose={onSheetClose}
                  isSheetMinimized={false}
                  hasScrolledContent={hasScrolledContent}
                  hasUserMessages={messages.some((m) => m.role === "user")}
                  floating={true}
                  voice={voice}
                  onVoiceChange={handleVoiceSwitch}
                  goalTrailingSlot={goalTrailingSlot}
                  hideStatusBar={hideStatusBar}
                />
              </div>
              {goalPlanBuilder && (
                <div style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1 }}>
                  {goalPlanBuilder}
                </div>
              )}
            </div>

            {/* Top fade gradient - visible on scroll */}
            <div
              className="absolute left-0 right-0 z-[9]"
              style={{
                top: 0,
                height: 120,
                pointerEvents: "none",
                background: `linear-gradient(to bottom, ${BG_PRIMARY} 60%, transparent 100%)`,
                opacity: hasScrolledContent ? 1 : 0,
                transition: "opacity 200ms ease",
              }}
            />

            <div
              ref={scrollContainerRef}
              className="absolute inset-0 w-full overflow-y-auto overscroll-contain scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transition-opacity duration-200 ease-out"
              style={{ paddingTop: 8, overflowAnchor: "none", opacity: contentVisible ? 1 : 0 }}
            >
              <div ref={contentRef} className="flex flex-col px-6">
                {/* Top spacer so content clears the floating close button + plan builder */}
                <div className="shrink-0" aria-hidden="true" style={{ height: goalPlanBuilder ? 160 : hideStatusBar ? 64 : 108 }} />

                {/* New5 / Review Behind - typewriter text + plain options */}
                {alert && initialScreenVariant === "new5" && (
                  <New5TextOnly
                    text={NEW5_TEXT_BY_VOICE[voice]}
                    onOptionSelect={() => { setHasInteracted(true); }}
                    voice={voice}
                  />
                )}

                {/* Review completed - celebration text + goal card */}
                {alert && initialScreenVariant === "review-completed" && (
                  <div className="shrink-0 mb-6">
                    <New5TextOnly
                      text={REVIEW_COMPLETED_TEXT_BY_VOICE[voice]}
                      options={[]}
                      onOptionSelect={() => {}}
                      voice={voice}
                    />
                    {goalSnapshot && (
                      <div className="mt-4">
                        <ChatCard card={{ type: "goal-progress", name: goalSnapshot.name, pct: goalSnapshot.pct, saved: goalSnapshot.saved, target: goalSnapshot.target, status: goalSnapshot.status, daysLabel: goalSnapshot.daysLabel }} />
                      </div>
                    )}
                  </div>
                )}

                {/* Review on-track - reassuring text + quick action cards */}
                {alert && initialScreenVariant === "review-ontrack" && !hasInteracted && (
                  <ReviewOnTrackScreen
                    text={REVIEW_ONTRACK_TEXT_BY_VOICE[voice]}
                    onMosaicSelect={(title) => {
                      setHasInteracted(true);
                      onMosaicSelect?.(title);
                    }}
                  />
                )}

                {/* Review Rent - typewriter text only, no options */}
                {alert && initialScreenVariant === "review-rent" && (
                  <New5TextOnly
                    text={RENT_TEXT}
                    options={[]}
                    onOptionSelect={() => {}}
                    voice={voice}
                  />
                )}

                {(drawerContent || pinnedContent) && (
                  <div className="mb-4 space-y-2">
                    {drawerContent ? (
                      <div className="rounded-2xl border p-3" style={{ ...typography.caption, borderColor: BG_SURFACE_2, backgroundColor: BG_SURFACE, color: TEXT_TERTIARY }}>{drawerContent}</div>
                    ) : null}
                    {pinnedContent ? (
                      <div className="rounded-2xl border p-3" style={{ ...typography.caption, borderColor: GREEN_50, backgroundColor: GREEN_50, color: TEXT_PRIMARY }}>{pinnedContent}</div>
                    ) : null}
                  </div>
                )}

                <div ref={messagesContainerRef} className="w-full space-y-4">
                  {renderedMessages.map((message, index) => {
                    const animationClass = "animate-chat-message-in";
                    const renderOptionsCardHere = optionsCardIndex === index && message.role === "assistant";
                    // Only the most recently revealed assistant message gets typewriter,
                    // and only if it hasn't been typewritten before.
                    const isLatestAssistant = index === latestRenderedIndex && message.role === "assistant";
                    const shouldTypewrite = isLatestAssistant && !typewrittenIdsRef.current.has(message.id);
                    if (shouldTypewrite) {
                      typewrittenIdsRef.current.add(message.id);
                    }
                    // Show feedback row after the last assistant message
                    const isLastAssistant = message.role === "assistant" && !renderedMessages.slice(index + 1).some((m) => m.role === "assistant");
                    return (
                      <div
                        key={message.id}
                        className={animationClass}
                        data-role={message.role}
                        data-msg-id={message.id}
                        ref={(el) => {
                          if (el && message.role === "user" && isNewVariant) userBubbleRef(el);
                        }}
                      >
                        {renderOptionsCardHere && shouldShowOptionsExpanded ? (
                          <AssistantOptionsCard
                            message={message}
                            chips={chips}
                            onChipSelect={onChipSelect}
                            showOptions={true}
                            typewrite={shouldTypewrite}
                          />
                        ) : (
                          <Bubble message={message} typewrite={shouldTypewrite} />
                        )}
                        {isLastAssistant && !message.streaming && !thinkingLabel && (!hideStatusBar || showFeedbackRowProp) && <FeedbackBar />}
                      </div>
                    );
                  })}


                  {thinkingLabel && (showThinking || shouldRenderProcessingGlow) && (
                    <div className="animate-chat-message-in">
                      <ThinkingIndicator label={thinkingLabel} />
                    </div>
                  )}

                  {chips.length > 0 && renderedMessages.length === 0 ? <OptionList chips={chips} onChipSelect={onChipSelect} /> : null}

                </div>
                {/* Spacer so last content clears the floating input bar */}
                <div className="shrink-0" aria-hidden="true" style={{ height: 120 }} />
              </div>
            </div>

            {/* Scroll-to-bottom pill (new variant only) */}
            <button
              onClick={() => {
                const scroller = scrollContainerRef.current;
                if (scroller) scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
              }}
              className="absolute z-20 flex items-center justify-center rounded-full shadow-md active:scale-95 transition-all duration-200 ease-out"
              style={{
                bottom: 110,
                right: 24,
                width: 36,
                height: 36,
                background: BG_PRIMARY,
                border: `1px solid ${OUTLINE_SUBTLE}`,
                opacity: isNewVariant && hasContentBelow && renderedMessages.length > 0 && !hideStatusBar ? 1 : 0,
                pointerEvents: isNewVariant && hasContentBelow && renderedMessages.length > 0 && !hideStatusBar ? "auto" : "none",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M4 9l4 4 4-4" stroke={TEXT_TERTIARY} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="absolute bottom-0 left-0 right-0 flex flex-col" style={{ pointerEvents: 'none' }}>
              {/* Snackbar slot sits above the input/overlay — it's a flex
                  sibling so positioning composes with whatever bottom chrome
                  is present. */}
              <SnackbarSlotTarget />
              <div style={{ pointerEvents: 'auto' }}>
                {questionnaireOverlay ?? (
                  <TypeBox
                    value={draft}
                    onChange={setDraft}
                    onSubmit={() => {
                      const text = draft.trim();
                      if (!text) return;
                      setDraft("");
                      onSubmit?.(text);
                    }}
                    placeholder={inputPlaceholder ?? (renderedMessages.length > 0 || hasInteracted ? `Reply to ${VOICE_NAMES[voice]}...` : `Ask ${VOICE_NAMES[voice]}...`)}
                    showElevation={hasContentBelow}
                    leftAction={undefined}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>{/* end body */}
      {/* Sheets fired from inside the thread (FeedbackBar's dislike sheet) dock here. */}
      <OverlaySlotTarget />
    </div>
    </OverlaySlotProvider>
    </SnackbarSlotProvider>
  );
}
