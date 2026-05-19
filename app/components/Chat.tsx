"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InitialPromptContent, type InitialSuggestion, type AlertScenario } from "./ChatInitialScreen";
import ChatCard, { type ChatCardData } from "./ChatCards";
import { AppBar, StatusBar, FooterInset, GestureNav, NavButton, ChatAppBar as DLSChatAppBar } from "./AppChrome";
import { typography } from "../lib/typography";
import { ILLUST_AFFORD_IT, ILLUST_MY_SPENDS, ILLUST_FEEDBACK } from "../lib/illustrations";
import {
  VALENTINO_500, VALENTINO_50, GREEN_500, GREEN_50, ORANGE_500, ORANGE_50,
  BG_PRIMARY, BG_SURFACE, BG_SURFACE_2, BG_SECONDARY, BLUE_50, RED_50,
  OUTLINE_SUBTLE, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY,
  ALPHA_BLACK_20, ALPHA_BLACK_60,
} from "../lib/colors";
import { RADIUS_M, RADIUS_PILL, RADIUS_CIRCLE } from "../lib/radii";
import { SPACE_XS, SPACE_M } from "../lib/spacing";
import FeedbackBar from "./FeedbackBar";
import { SnackbarSlotProvider, SnackbarSlotTarget } from "./SnackbarSlot";
import { highlightValues } from "../lib/chat-highlight";

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
        className="w-full bg-white shrink-0 cursor-pointer relative flex items-center"
        style={{ height: 72, paddingLeft: 24, paddingRight: 16 }}
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

export function TypeBox({
  value,
  onChange,
  onSubmit,
  placeholder,
  showElevation = false,
  leftAction,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  showElevation?: boolean;
  leftAction?: React.ReactNode;
}) {
  return (
    <>
      <FooterInset
        backgroundColor="transparent"
        paddingX={16}
        paddingTop={8}
        minBottomPadding={0}
      >
        <div className="flex items-center" style={{ gap: 12 }}>
          {leftAction}
          <div
            className="flex items-center overflow-hidden flex-1"
            style={{ height: 48, backgroundColor: BG_PRIMARY, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_CIRCLE, boxShadow: "0px 2px 32px 0px rgba(0,0,0,0.05)" }}
          >
            <div
              className="flex items-center w-full h-full"
              style={{ backgroundColor: BG_PRIMARY, borderRadius: RADIUS_CIRCLE, paddingLeft: 16, paddingRight: 8, paddingTop: 8, paddingBottom: 8 }}
            >
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSubmit()}
                placeholder={placeholder}
                className="flex-1 min-w-0 bg-transparent outline-none"
                style={{
                  ...typography.bodySmall,
                  color: TEXT_PRIMARY,
                }}
              />
              {value.trim() && (
                <button
                  onClick={onSubmit}
                  className="shrink-0 flex items-center justify-center rounded-full ml-1"
                  style={{ width: 36, height: 36, backgroundColor: BG_PRIMARY, border: `1px solid ${OUTLINE_SUBTLE}` }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 11V3M3 7l4-4 4 4" stroke={VALENTINO_500} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </FooterInset>
      <GestureNav />
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
type QuickAction = { category: string; title: string; illustration?: string; bg: string };

// Row 1: two square cards
const MOSAIC_ROW1: QuickAction[] = [
  { category: "Budget", title: "Can I afford it?", illustration: ILLUST_AFFORD_IT, bg: "linear-gradient(160deg, #ffffff 40%, #e6edf9 100%)" },
  { category: "Last month", title: "Analyse my spends", illustration: ILLUST_MY_SPENDS, bg: "linear-gradient(160deg, #ffffff 40%, #fff3e3 100%)" },
];
// Row 2 left: tall card
const MOSAIC_TALL: QuickAction = { category: "Feedback", title: "Make Ryan smarter", illustration: ILLUST_FEEDBACK, bg: "linear-gradient(160deg, #ffffff 40%, #fae2fa 100%)" };
// Row 2 right: tall card
const MOSAIC_TALL_RIGHT: QuickAction = { category: "Just for laughs", title: "Roast me", bg: "linear-gradient(160deg, #ffffff 40%, #f9e4e5 100%)" };

function MosaicCard({
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
        <span style={{ ...typography.metadata, textTransform: "uppercase", color: TEXT_SECONDARY, whiteSpace: "nowrap" }}>
          {action.category}
        </span>
        <span style={{ ...typography.headerH4, color: TEXT_PRIMARY }}>
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
                  color: ALPHA_BLACK_60,
                  backgroundColor: BG_PRIMARY,
                  border: "1px solid rgba(0,0,0,0.08)",
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
    <div
      className="relative flex h-full flex-col overflow-hidden bg-white"

      style={{ fontFamily: 'var(--font-rubik), var(--font-sans), system-ui, sans-serif', pointerEvents: 'none' }}
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
                background: "linear-gradient(to bottom, white 60%, transparent 100%)",
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
              className="absolute z-20 flex items-center justify-center rounded-full bg-white shadow-md active:scale-95 transition-all duration-200 ease-out"
              style={{
                bottom: 110,
                right: 24,
                width: 36,
                height: 36,
                border: "1px solid rgba(0,0,0,0.08)",
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
    </div>
    </SnackbarSlotProvider>
  );
}
