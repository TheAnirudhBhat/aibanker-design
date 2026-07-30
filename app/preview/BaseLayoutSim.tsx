"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { typography } from "../lib/typography";
import { BG_PRIMARY, TEXT_PRIMARY, CHAT_USER_BUBBLE } from "../lib/colors";
import { SPACE_M, SPACE_L } from "../lib/spacing";
import { RADIUS_M } from "../lib/radii";
import { ChatAppBar, CHAT_APP_BAR_HEIGHT } from "../components/AppChrome";
import MockKeyboard from "../components/MockKeyboard";
import { SuggestSheetBar, useTypewriter } from "../components/Chat";
import FeedbackBar from "../components/FeedbackBar";
import { SnackbarSlotProvider, SnackbarSlotTarget } from "../components/SnackbarSlot";
import { OverlaySlotProvider, OverlaySlotTarget } from "../components/OverlaySlot";
import { useChatLift } from "../hooks/useChatLift";
import { useIsMobileProto } from "../hooks/useProtoMobile";
import { highlightValues } from "../lib/chat-highlight";

/** The conversation's first line always sits this far below the app bar. */
const CHAT_TOP_GAP = 20;
import JumpToRecentPill from "../components/JumpToRecentPill";

// Base layout: the chat SHELL on its own — Ryan opens, then the conversation is
// whatever the user types. No scripted steps, no cards, no flow state; the point
// is to showcase the chat behaviour (suggestions sheet, keyboard handling, the
// conversation riding the message box) without an onboarding script around it.

const OPENING_LINE = "Hey, I'm Ryan. Ask me anything about your money — where it went, what's coming up, or what you could save.";

// Canned replies, cycled in order. This persona is a behaviour showcase, so the
// answers only need to be plausible turns, not real analysis.
const REPLIES = [
  "Got it. Pulling that up from your last 3 months of spends.",
  "Makes sense. Food and shopping are your two biggest levers right now.",
  "Noted. I'll keep an eye on that and flag it when it moves.",
  "That's doable. Want me to set it up as a goal?",
];

const SUGGESTIONS = ["Track my spends", "Top categories", "Spending trends", "Ways to save", "Biggest spends"];

type Turn = { id: number; role: "user" | "ryan"; text: string };

// Pulsing "Thinking" line between the question and the answer — same treatment as the main chat.
function ThinkingLine() {
  return (
    <div className="flex items-center animate-chat-message-in" style={{ gap: 8, paddingTop: 4, paddingBottom: 4 }}>
      <p className="animate-thinking-pulse text-[var(--chat-text-tertiary)]" style={typography.bodySmall}>
        Thinking
      </p>
    </div>
  );
}

function RyanLine({ text, active, onDone }: { text: string; active: boolean; onDone?: () => void }) {
  const shown = useTypewriter(text, active, onDone);
  return (
    <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY, margin: 0, whiteSpace: "pre-wrap" }}>
      {highlightValues(shown)}
    </p>
  );
}

export default function BaseLayoutSim({ onClose }: { onClose?: () => void }) {
  const isMobile = useIsMobileProto();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [openingDone, setOpeningDone] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hasContentBelow, setHasContentBelow] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestListH, setSuggestListH] = useState(0);
  const seqRef = useRef(0);
  // LLM cadence: the question rides to the top, Ryan thinks, then the answer streams below it.
  const [thinking, setThinking] = useState(false);
  const [anchorId, setAnchorId] = useState<number | null>(null);
  const [doneIds, setDoneIds] = useState<Set<number>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);
  const topSpacerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const replyTimer = useRef<number | null>(null);

  // Same lift choreography as the Jun-11 terminal bar (shared hook): the chat rides
  // up with the message box for both the suggestions sheet and the keyboard, and
  // stays put when the user is scrolled up reading history.
  const { kbFocused, setKbFocused, keyboardVisible, kbLift, chatLift, noteWillLift, ease } = useChatLift({
    isMobile,
    scrollRef,
    sheetLift: suggestOpen ? suggestListH : 0,
  });

  // Top fade shows once scrolled; jump pill once there's conversation below the fold.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      setHasScrolled(el.scrollTop > 0);
      // Measure the last REAL message, not scrollHeight: anchoring a question to the top inflates
      // the column's minHeight, and that phantom space would keep the jump pill up for good.
      const content = contentRef.current;
      const kids = content ? (Array.from(content.children) as HTMLElement[]) : [];
      let bottom = el.scrollHeight;
      for (let i = kids.length - 1; i >= 0; i--) {
        if (kids[i].getAttribute("aria-hidden") === "true") continue;
        bottom = kids[i].offsetTop + kids[i].offsetHeight;
        break;
      }
      setHasContentBelow(el.scrollTop + el.clientHeight < bottom - 4);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Every LLM chat does this: the question you just sent rides to the TOP of the thread, the
  // thinking line sits under it, and the answer streams into the space below — so the whole
  // exchange reads from the top instead of creeping up off the bottom of the screen. The
  // clearance is DERIVED from the top spacer, so it tracks the app bar + CHAT_TOP_GAP on both
  // mobile and desktop rather than being a second hardcoded copy of that sum.
  useEffect(() => {
    if (anchorId === null) return;
    const apply = () => {
      const el = scrollRef.current;
      const target = anchorRef.current;
      const content = contentRef.current;
      if (!el || !target || !content) return;
      const clearance = (topSpacerRef.current?.offsetHeight ?? 128) + SPACE_L;
      const desired = Math.max(0, target.offsetTop - clearance);
      // The question can only reach the top if there's room below it to scroll into.
      const needed = desired + el.clientHeight;
      if (content.offsetHeight < needed) {
        content.style.minHeight = `${needed}px`;
        void el.scrollHeight; // force the reflow, or the scroll clamps to the stale max
      }
      // Assigned, not scrollTo({behavior:"smooth"}): the lift hook pins scrollTop on a rAF loop
      // while the message box rises, and each of those writes cancels an in-flight smooth scroll,
      // which stranded the question mid-thread. Re-assert once the lift has settled.
      el.scrollTop = desired;
    };
    const raf = requestAnimationFrame(() => requestAnimationFrame(apply));
    const settle = window.setTimeout(apply, 320);
    return () => { cancelAnimationFrame(raf); window.clearTimeout(settle); };
  }, [anchorId]);

  useEffect(() => () => { if (replyTimer.current !== null) window.clearTimeout(replyTimer.current); }, []);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const id = ++seqRef.current;
    setTurns((prev) => [...prev, { id, role: "user", text: t }]);
    setAnchorId(id);      // ride this question to the top
    setThinking(true);
    setDraft("");
    if (replyTimer.current !== null) window.clearTimeout(replyTimer.current);
    replyTimer.current = window.setTimeout(() => {
      setTurns((prev) => [...prev, { id: id + 0.5, role: "ryan", text: REPLIES[(id - 1) % REPLIES.length] }]);
      setThinking(false);
    }, 1100);
  };

  return (
    <SnackbarSlotProvider>
    <OverlaySlotProvider>
    <div className="relative h-full w-full overflow-clip" style={{ backgroundColor: BG_PRIMARY, fontFamily: "var(--font-rubik), var(--font-sans), system-ui, sans-serif" }}>
        <ChatAppBar absolute variant="firstTime" navKind="close" onNav={onClose ?? (() => {})} voice="ryan" hideStatusBar={isMobile} />

        {/* Conversation. Bottom rides chatLift so it moves WITH the message box. */}
        <div
          ref={scrollRef}
          className="absolute left-0 right-0 top-0 overflow-y-auto overscroll-none scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ bottom: chatLift, transition: `bottom ${ease}` }}
        >
          <div ref={contentRef} className="flex flex-col" style={{ paddingLeft: SPACE_L, paddingRight: SPACE_L, paddingBottom: SPACE_L, gap: SPACE_L }}>
            {/* Clearance for the floating app bar: the conversation starts exactly 20px below it.
                DERIVED, not eyeballed — the bar is env(safe-area-inset-top) + a 44px status bar
                (desktop only; hidden on mobile) + a 64px row, and this column adds `gap: SPACE_L`
                between every child, so that gap is subtracted or the first line sits 24px lower
                than asked. Was a flat 128/96, which put the desktop opening line 152px down. */}
            <div
              ref={topSpacerRef}
              className="shrink-0"
              aria-hidden="true"
              style={{
                height: isMobile
                  ? `calc(env(safe-area-inset-top) + ${64 + CHAT_TOP_GAP - SPACE_L}px)`
                  : CHAT_APP_BAR_HEIGHT + CHAT_TOP_GAP - SPACE_L,
              }}
            />

            <RyanLine text={OPENING_LINE} active={!openingDone} onDone={() => setOpeningDone(true)} />

            {turns.map((turn, i) => (
              <Fragment key={turn.id}>
                {turn.role === "user" ? (
                  <div
                    // The newest question carries the anchor the thread scrolls to.
                    ref={turn.id === anchorId ? anchorRef : undefined}
                    className="flex justify-end animate-chat-message-in"
                  >
                    <div className="max-w-[75%] rounded-[16px] rounded-tr-lg" style={{ backgroundColor: CHAT_USER_BUBBLE, padding: "12px 16px", borderRadius: RADIUS_M }}>
                      <p style={{ ...typography.bodySmall, color: TEXT_PRIMARY, margin: 0 }}>{turn.text}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <RyanLine
                      text={turn.text}
                      active={i === turns.length - 1 && !doneIds.has(turn.id)}
                      onDone={() => setDoneIds((s) => new Set(s).add(turn.id))}
                    />
                    {/* Rate the answer — same gate as the main chat: only once it's finished typing. */}
                    {(i < turns.length - 1 || doneIds.has(turn.id)) && <FeedbackBar messageId={String(turn.id)} />}
                  </div>
                )}
              </Fragment>
            ))}

            {thinking && <ThinkingLine />}

            {/* Breathing room above the input chrome */}
            <div className="shrink-0" aria-hidden="true" style={{ height: 112 }} />
          </div>
        </div>

        {/* Top fade — covers text scrolling under the transparent app bar. */}
        <div
          className="absolute left-0 right-0 z-[9]"
          style={{
            top: 0,
            height: isMobile ? "calc(env(safe-area-inset-top) + 72px)" : 132,
            pointerEvents: "none",
            background: `linear-gradient(to bottom, ${BG_PRIMARY} 0%, ${BG_PRIMARY} 74%, transparent 100%)`,
            opacity: hasScrolled ? 1 : 0,
            transition: "opacity 200ms ease",
          }}
        />

        <JumpToRecentPill
          visible={hasContentBelow}
          onClick={() => {
            const el = scrollRef.current;
            if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
          }}
          // 32px above the message box: bar bottom padding 16 + the 48px input + the 32px gap,
          // plus chatLift when the bar rises. (Was 96, which measured 24px on screen.)
          bottom={104 + chatLift}
        />

        {/* Scrim: tap anywhere outside the sheet to collapse it. */}
        {suggestOpen && (
          <button
            type="button"
            aria-label="Close suggestions"
            onClick={() => setSuggestOpen(false)}
            className="absolute inset-0"
            style={{ background: "transparent", border: "none", padding: 0, cursor: "default", zIndex: 10 }}
          />
        )}

        {/* Bottom fade behind the message box — rides chatLift (keyboard OR sheet) so the
            bar keeps the same soft white backing in every state. */}
        <div
          className="absolute left-0 right-0 z-[9]"
          style={{
            bottom: 0,
            height: 54,
            pointerEvents: "none",
            background: `linear-gradient(to top, ${BG_PRIMARY} 0%, ${BG_PRIMARY} 70%, transparent 100%)`,
            transform: chatLift ? `translateY(${-chatLift}px)` : "translateY(0)",
            transition: `transform ${ease}`,
          }}
        />

        <div
          className="absolute bottom-0 left-0 right-0 z-20 flex flex-col"
          style={{
            transform: kbLift ? `translateY(${-kbLift}px)` : "translateY(0)",
            transition: "transform 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Snackbars dock here — just above the message box, riding its lift. */}
          <SnackbarSlotTarget />
          <SuggestSheetBar
            value={draft}
            onChange={setDraft}
            onSubmit={() => send(draft)}
            placeholder="Ask Ryan..."
            rollingSuggestions={SUGGESTIONS}
            open={suggestOpen}
            // Snapshot the reading position before the lift moves anything.
            onOpenChange={(open) => { noteWillLift(); setSuggestOpen(open); }}
            onFocusChange={(f) => { noteWillLift(); setKbFocused(f); }}
            onPickRow={(row) => send(row.title)}
            onListHeightChange={setSuggestListH}
          />
        </div>

        {/* Desktop keyboard sim; phones get the native keyboard (page shell tracks it). */}
        {!isMobile && <MockKeyboard visible={keyboardVisible} />}

        {/* Full-screen overlays (the dislike-feedback sheet) dock here, over everything. */}
        <OverlaySlotTarget />
    </div>
    </OverlaySlotProvider>
    </SnackbarSlotProvider>
  );
}
