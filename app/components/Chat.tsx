"use client";

import { useEffect, useRef, useState } from "react";

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  special?: "reality-check" | "goal-pinned" | "insight" | "success";
};

export type ChatChip = {
  id: string;
  label: string;
  variant?: "primary" | "secondary" | "destructive" | "success";
};

// Assistant reply choreography (single source of truth)
// Total = pre-glow pause + glow animation + post-glow settle.
const ASSISTANT_REPLY_TOTAL_MS = 3000;
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
  isStreaming?: boolean;
  streamingText?: string;
  onProcessingStateChange?: (isProcessing: boolean) => void;
};

function VoiceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-600" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 3.75a3 3 0 0 1 3 3v4.5a3 3 0 1 1-6 0v-4.5a3 3 0 0 1 3-3Z" />
      <path d="M6.75 10.5v.75a5.25 5.25 0 0 0 10.5 0v-.75" strokeLinecap="round" />
      <path d="M12 16.5v2.75" strokeLinecap="round" />
      <path d="M9 20.25h6" strokeLinecap="round" />
    </svg>
  );
}

function PhoneHeader({
  title,
  subtitle,
  headerActions,
}: Pick<ChatProps, "title" | "subtitle" | "headerActions">) {
  return (
    <div className="px-3 pt-0 pb-2">
      <div className="relative flex h-12 items-center">
        <div className="h-10 w-10" aria-hidden="true" />

        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 text-center sm:block">
          <p className="text-sm font-medium text-zinc-900">{title}</p>
          {subtitle ? <p className="text-[10px] text-zinc-500">{subtitle}</p> : null}
        </div>

        {headerActions && headerActions.length > 0 ? (
          <div className="ml-auto flex items-center gap-2">
            {headerActions.slice(0, 2).map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                className={`rounded-full border px-3 py-1 text-[11px] transition ${
                  action.active
                    ? "border-zinc-300 bg-zinc-100 text-zinc-900"
                    : "border-zinc-200 bg-white text-zinc-600"
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const bubbleBase = isUser
    ? "ml-auto bg-[var(--chat-user-bubble)] text-[var(--chat-text-primary)]"
    : "mr-auto bg-[var(--chat-surface-soft-2)] text-[var(--chat-text-primary)]";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[264px] rounded-2xl px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.02)] ${bubbleBase}`}>
        <p className="whitespace-pre-line text-[14px] leading-5 tracking-[0.02em]">{message.text}</p>
      </div>
    </div>
  );
}

function AssistantOptionsCard({
  message,
  chips,
  onChipSelect,
  showOptions,
}: {
  message: ChatMessage;
  chips: ChatChip[];
  onChipSelect: (chip: ChatChip) => void;
  showOptions: boolean;
}) {
  return (
    <div className="mr-auto w-full max-w-[264px] rounded-2xl bg-[var(--chat-surface-soft-2)] p-2">
      <div className="px-3 pt-2 pb-2">
        <p className="whitespace-pre-line text-[14px] leading-5 tracking-[0.02em] text-[var(--chat-text-primary)]">
          {message.text}
        </p>
      </div>

      <div
        className={`overflow-hidden rounded-xl bg-white transition-[max-height,opacity,margin] duration-250 ease-out ${
          showOptions ? "mt-2 max-h-[420px] opacity-100" : "mt-0 max-h-0 opacity-0"
        }`}
      >
        {chips.slice(0, 6).map((chip, index) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => onChipSelect(chip)}
            disabled={!showOptions}
            className={`flex w-full items-center px-4 py-3 text-left text-[14px] leading-5 tracking-[0.02em] text-zinc-900 transition hover:bg-zinc-50 active:bg-zinc-100 ${
              index > 0 ? "border-t border-zinc-100" : ""
            }`}
          >
            <span>{chip.label}</span>
          </button>
        ))}
      </div>
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
    <div className={`mr-auto w-full max-w-[264px] rounded-2xl bg-[var(--chat-surface-soft-2)] p-1 ${compactTop ? "mt-1" : ""}`}>
      {!compactTop ? (
        <div className="rounded-xl bg-[var(--chat-surface-soft-2)] px-3 pt-3 pb-2">
          <div className="h-2" />
        </div>
      ) : null}
      <div className="overflow-hidden rounded-xl bg-white">
        {chips.slice(0, 6).map((chip, index) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => onChipSelect(chip)}
            className={`flex w-full items-center px-4 py-3 text-left text-[14px] tracking-[0.02em] text-zinc-900 transition hover:bg-zinc-50 active:bg-zinc-100 ${
              index > 0 ? "border-t border-zinc-100" : ""
            }`}
          >
            <span className="truncate">{chip.label}</span>
          </button>
        ))}
      </div>
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
  isStreaming,
  streamingText,
  onProcessingStateChange,
}: ChatProps) {
  const [draft, setDraft] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [showProcessingGlow, setShowProcessingGlow] = useState(false);
  const revealTimerRef = useRef<number | null>(null);
  const glowStartTimerRef = useRef<number | null>(null);
  const glowStopTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const scroller = scrollContainerRef.current;
      if (!scroller) return;
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages.length, revealedCount, chips.length, showTyping, streamingText]);

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
    const getDelayForMessage = (index: number) => {
      const current = messages[index];
      const previous = messages[index - 1];
      if (!current) return 0;
      if (!previous) return 180;
      if (current.role === "assistant" && previous.role === "user") return ASSISTANT_REPLY_TOTAL_MS;
      // If the previous assistant message has selectable options, let the options
      // collapse animate first before showing the user's selected reply bubble.
      if (current.role === "user" && previous.role === "assistant") return chips.length > 0 ? 520 : 260;
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
  }, [messages, revealedCount, isStreaming, chips.length]);

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
    !isStreaming &&
    !streamingText &&
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

    // Choreography within the assistant delay:
    // user bubble appears -> pre-glow pause -> glow runs -> post-glow settle -> assistant reply.
    const glowStartDelayMs = ASSISTANT_REPLY_PRE_GLOW_MS;
    const glowDurationMs = ASSISTANT_REPLY_GLOW_MS;

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

  const shouldRenderProcessingGlow = !streamingText && (showTyping || showProcessingGlow);

  useEffect(() => {
    onProcessingStateChange?.(shouldRenderProcessingGlow);
  }, [onProcessingStateChange, shouldRenderProcessingGlow]);

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-[18px] bg-white text-zinc-900"
      style={{
        fontFamily: 'var(--font-rubik), var(--font-sans), system-ui, sans-serif',
        paddingTop: "max(env(safe-area-inset-top), 24px)",
      }}
    >
      <PhoneHeader title={title} subtitle={subtitle} headerActions={headerActions} />

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain px-3 pb-4"
        style={{ paddingTop: 32 }}
      >
        <div className="flex min-h-full flex-col justify-end">
          {(drawerContent || pinnedContent) && (
            <div className="mb-4 space-y-2">
              {drawerContent ? (
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-xs text-zinc-700">{drawerContent}</div>
              ) : null}
              {pinnedContent ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-900">{pinnedContent}</div>
              ) : null}
            </div>
          )}

          <div className="mx-auto w-full max-w-[352px] space-y-4">
            {renderedMessages.map((message, index) => {
              const animationClass = "animate-chat-message-in";
              const renderOptionsCardHere = optionsCardIndex === index && message.role === "assistant";

              return (
                <div key={message.id} className={animationClass}>
                  {renderOptionsCardHere ? (
                    <AssistantOptionsCard
                      message={message}
                      chips={chips}
                      onChipSelect={onChipSelect}
                      showOptions={shouldShowOptionsExpanded}
                    />
                  ) : (
                    <Bubble message={message} />
                  )}
                </div>
              );
            })}

            {isStreaming && streamingText && (
              <div className="animate-fade-in">
                <div className="mr-auto max-w-[264px] rounded-2xl bg-[var(--chat-surface-soft-2)] px-4 py-3">
                <p className="whitespace-pre-line text-[14px] leading-5 tracking-[0.02em] text-zinc-900">
                  {streamingText}
                  <span className="ml-1 inline-block h-3.5 w-1 rounded bg-zinc-400 align-middle animate-pulse" />
                </p>
              </div>
            </div>
          )}

            {chips.length > 0 && renderedMessages.length === 0 ? <OptionList chips={chips} onChipSelect={onChipSelect} /> : null}

            <div ref={bottomRef} className="h-2" />
          </div>
        </div>
      </div>

    </div>
  );
}
