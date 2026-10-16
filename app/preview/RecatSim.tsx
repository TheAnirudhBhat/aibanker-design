"use client";

// ── Transaction category update, in chat ────────────────────────────────────
// A standalone sim, kept apart from the Return exp1 feed (user call 2026-10-15:
// "keep it separate from the core flow"). The chat follows the AI Banker canon's
// "Other cases" register (2790:57504): a pink user line, cosimo's plain reply,
// hairline option rows, the Ask cosimo pill at the foot.
//
//   1. "What were my top transactions this month?" → the top ten, biggest
//      first, each with its category. Two Swiggy rows read Shopping.
//   2. "Mark all Swiggy transactions as Travel" → "I found 44 … all of them?"
//   3. Yes → every one moves. No → WHICH ones, on the Pick switch:
//        page · a full-page list rises over the chat: an ask bar where a
//               search would be (a sentence ticks the rows), filter, tick rows
//        ask  · cosimo asks first — describe them (in chat) or pick from
//               the list (the same page)
//        dock · the onboarding's card over the input holds the rows to tick
//               and the tick that applies (the question-card Dock left on
//               user pin 2026-10-16: "remove dock, it is stupid")

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { GestureNav, StatusBar } from "@/app/components/AppChrome";
import { useTypewriter } from "@/app/components/Chat";
import { useAnchoredChatScroll } from "@/app/hooks/useAnchoredChatScroll";
import BigSpendsActivity from "@/app/preview/BigSpendsActivity";
import { typography } from "@/app/lib/typography";
import { useProtoFlag } from "@/app/lib/protoFlags";
import { RADIUS_L, RADIUS_M } from "@/app/lib/radii";
import { ELEVATION_CARD } from "@/app/lib/elevation";
import {
  BG_CARD,
  BG_PRIMARY,
  BTN_BG_PRIMARY_DEFAULT,
  CHAT_USER_BUBBLE,
  EXT_BG_BOLD_REVERSE,
  OUTLINE_BOLD,
  OUTLINE_SUBTLE,
  TEXT_ON_COLOR_PRIMARY,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  VALENTINO_500,
} from "@/app/lib/colors";

const PAGE_GUTTER = 24;
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
/** A glyph tinted via mask, for the currentColor icon sets in /icons and /return-exp1. */
const tintedGlyph = (src: string, color: string, size = 20): React.CSSProperties => ({
  width: size, height: size, flexShrink: 0, backgroundColor: color,
  WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`,
  WebkitMaskSize: "contain", maskSize: "contain",
  WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
  WebkitMaskPosition: "center", maskPosition: "center",
});
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
/** Return exp1 · v2's message box (user pins 2026-10-15: "match the message
    box from return exp1 v2", "here also"): 57 tall on a 1px Outline Subtle
    hairline, 20 in from the frame, the ambient skin's glass (white 70% by day,
    black by night, under a 24px frost with the lit rim and soft shadow) — the
    sim's root carries the re1-ambient scope so the same vars resolve here. */
const BAR_MARGIN = 20;
const MESSAGE_BOX: React.CSSProperties = {
  position: "relative",
  height: 57,
  borderRadius: 100,
  border: `1px solid ${OUTLINE_SUBTLE}`,
  background: "var(--re1-ask-bar-bg, color-mix(in srgb, var(--dls-bg-primary) 60%, transparent))",
  backdropFilter: "var(--re1-glass-filter, blur(24px))",
  WebkitBackdropFilter: "var(--re1-glass-filter, blur(24px))",
  boxShadow: "var(--re1-glass-shine), var(--re1-glass-shadow)",
  display: "flex",
  alignItems: "center",
  padding: "0 56px 0 24px",
  overflow: "hidden",
};
const THINK_MS = 700;
/** how long the picker's ask bar "thinks" before the rows change */
const ASK_MS = 3000;

// ── Data ─────────────────────────────────────────────────────────────────────
type Cat = string;
/** every category the DLS draws (/icons/categories), as the update page lists them */
const CATEGORIES: { name: string; icon: string }[] = [
  ["Bills", "bills"], ["Entertainment", "entertainment"], ["Food & drinks", "food-drinks"], ["Gaming", "gaming"],
  ["Groceries", "groceries"], ["Insurance", "insurance"], ["Investment", "investment"], ["Logistics", "logistics"],
  ["Medical", "medical"], ["Miscellaneous", "miscellaneous"], ["Personal", "personal"], ["Repayment", "repayment"],
  ["Self transfer", "self-transfer"], ["Services", "services"], ["Shopping", "shopping"], ["Subscription", "subscription"],
  ["Transfers", "transfers"], ["Transport", "transport"], ["Travel", "travel"],
].map(([name, file]) => ({ name, icon: `/icons/categories/${file}.svg` }));
const CAT_ICON: Record<Cat, string> = Object.fromEntries(CATEGORIES.map((c) => [c.name, c.icon]));
type Txn = { id: string; merchant: string; note: string; amount: number; date: Date; cat: Cat; logo?: string; tint: string };

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (d: Date) => `${d.getDate()} ${MON[d.getMonth()]}`;
const fmtDay = (d: Date) => `${DAY[d.getDay()]} ${fmtDate(d)}`;

const SWIGGY = { merchant: "Swiggy", tint: "#FC8019", logo: "swiggy" } as const;
/** Every Swiggy transaction since April, 44 of them, all read as Shopping. The
    two October ones are the top list's own; the rest are seeded so the counts
    cosimo quotes (₹428s, weekends, a month) are whatever the data says. */
const SWIGGY_TXNS: Txn[] = (() => {
  const out: Txn[] = [
    { id: "sw-oct-1", ...SWIGGY, note: "Swiggy", amount: 1420, date: new Date(2026, 9, 10), cat: "Shopping" },
    { id: "sw-oct-2", ...SWIGGY, note: "Swiggy Instamart", amount: 860, date: new Date(2026, 9, 4), cat: "Shopping" },
  ];
  const amounts = [428, 312, 540, 735, 615, 199, 745, 428, 390, 1080, 265, 299, 560, 330, 1240, 920, 480, 215];
  let seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  let day = new Date(2026, 3, 2);
  for (let i = 0; i < 42; i++) {
    // 2–4 days apart, so 42 of them land between April and mid-September
    day = new Date(day.getTime() + (2 + Math.floor(rnd() * 3)) * 86400000);
    const instamart = rnd() < 0.3;
    out.push({ id: `sw-${i}`, ...SWIGGY, note: instamart ? "Swiggy Instamart" : "Swiggy", amount: amounts[(i * 7 + Math.floor(rnd() * 3)) % amounts.length], date: day, cat: "Shopping" });
  }
  return out.sort((a, b) => b.date.getTime() - a.date.getTime());
})();

/** The month's top ten, biggest first. */
const TOP_TXNS: Txn[] = [
  { id: "t-amazon", merchant: "Amazon", note: "Card", amount: 1600, date: new Date(2026, 9, 3), cat: "Shopping", tint: "#FF9900" },
  SWIGGY_TXNS[0],
  { id: "t-uber", merchant: "Uber", note: "UPI", amount: 1300, date: new Date(2026, 9, 6), cat: "Travel", tint: "#78808B" },
  { id: "t-social", merchant: "Social", note: "Card", amount: 1250, date: new Date(2026, 9, 2), cat: "Food & drinks", tint: "#E23744", logo: "social" },
  { id: "t-myntra", merchant: "Myntra", note: "UPI", amount: 1100, date: new Date(2026, 9, 1), cat: "Shopping", tint: "#FF3F6C" },
  { id: "t-irctc", merchant: "IRCTC", note: "Card", amount: 1000, date: new Date(2026, 9, 2), cat: "Travel", tint: "#2E90FF" },
  { id: "t-kfc", merchant: "KFC", note: "UPI", amount: 980, date: new Date(2026, 9, 1), cat: "Food & drinks", tint: "#F8CB46", logo: "kfc" },
  SWIGGY_TXNS[1],
  { id: "t-dominos", merchant: "Dominos", note: "slice UPI", amount: 700, date: new Date(2026, 9, 1), cat: "Food & drinks", tint: "#0078AE", logo: "dominos" },
  { id: "t-netflix", merchant: "Netflix", note: "Card", amount: 649, date: new Date(2026, 9, 12), cat: "Entertainment", tint: "#E23744" },
];

// ── The filter a sentence becomes ────────────────────────────────────────────
// ponytail: a keyword parser stands in for the model. It reads an amount
// (428, ₹428, "above 500"), a day ("weekends", "Saturday"), a month ("in
// August") and "Instamart", and ANDs them. Swap for /api/flow-assist when the
// flow needs to read anything else.
type Filter = { test: (t: Txn) => boolean; label: string };
function parseFilter(q: string): Filter | null {
  const s = q.toLowerCase();
  const tests: ((t: Txn) => boolean)[] = [];
  const labels: string[] = [];
  const num = s.match(/(?:above|over|more than|under|below|less than)?\s*₹?\s*(\d[\d,]*)/);
  if (num) {
    const n = Number(num[1].replace(/,/g, ""));
    if (/above|over|more than/.test(s)) { tests.push((t) => t.amount > n); labels.push(`above ${inr(n)}`); }
    else if (/under|below|less than/.test(s)) { tests.push((t) => t.amount < n); labels.push(`under ${inr(n)}`); }
    else { tests.push((t) => t.amount === n); labels.push(`of ${inr(n)}`); }
  }
  const days = new Set<number>();
  if (/weekend/.test(s)) { days.add(0); days.add(6); }
  DAY.forEach((d, i) => { if (new RegExp(`\\b${d.toLowerCase()}`).test(s)) days.add(i); });
  if (days.size) {
    tests.push((t) => days.has(t.date.getDay()));
    labels.push(`on a ${[...days].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)).map((d) => DAY[d]).join(" or ")}`);
  }
  const months: number[] = [];
  MON.forEach((m, i) => { if (new RegExp(`\\b${m.toLowerCase()}`).test(s)) months.push(i); });
  if (months.length) { tests.push((t) => months.includes(t.date.getMonth())); labels.push(`in ${months.map((m) => MON[m]).join(" or ")}`); }
  if (/instamart|grocer/.test(s)) { tests.push((t) => t.note.includes("Instamart")); labels.push("from Instamart"); }
  if (!tests.length) return null;
  return { test: (t) => tests.every((f) => f(t)), label: labels.join(", ") };
}

// ── Chat ─────────────────────────────────────────────────────────────────────
type Row = { icon: string; label: string; act: string };
/** The card that docks over the input (the onboarding's, 2856:80059): one
    question, its answers as radios, and what the bar invites meanwhile. */
type Dock = { title: string; placeholder: string; /** Dock: the rows to tick sit in the card, with the tick that applies (user pin 2026-10-15) */ list: true };
const GENTLE = "cubic-bezier(0.16, 1, 0.3, 1)";
const DOCK_RISE_MS = 420;
const DOCK_SINK_MS = 260;
type Turn = { id: number; role: "user" | "cosimo"; text: string; rows?: Row[]; list?: Txn[]; moved?: Set<string>; /** where the list's "+N more" row leads */ more?: "full" | "picker"; /** the hand-off card into the picker, with how many it holds */ card?: number; /** a line after the card */ after?: string; /** the card that docks over the input once this line has typed (Pick → Dock) */ dock?: Dock };
type Phase = "start" | "top" | "confirm" | "which" | "described" | "done";

const ICON = {
  yes: "/return-exp1/setup/thumbs-up.svg",
  no: "/return-exp1/bill-picker/close.svg",
  list: "/icons/dashboard.svg",
  say: "/icons/message.svg",
  travel: "/icons/categories/travel.svg",
  update: "/icons/categories/miscellaneous.svg",
  top: "/icons/graph.svg",
};
const ASK_TOP = "What were my top transactions this month?";
const ASK_MOVE = "Mark all Swiggy transactions as Travel";
const DESCRIBE_HINT = "e.g. all of ₹428, or only on weekends";

export default function RecatSim({ pickMode }: { /** the Pick switch, when the host doesn't read the flag */ pickMode?: "page" | "ask" | "docklist" }) {
  const [flag] = useProtoFlag("recatPick");
  const mode = pickMode ?? (flag === "ask" ? "ask" : flag === "dock" ? "docklist" : "page");

  const [turns, setTurns] = useState<Turn[]>([]);
  const [phase, setPhase] = useState<Phase>("start");
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState("Ask cosimo");
  /** the category the Swiggy rows move to (user pin 2026-10-15: picked on the Update category page, or named in the line) */
  const [target, setTarget] = useState("Travel");
  const [catPage, setCatPage] = useState(false);
  /** the Swiggy rows that now read the target */
  const [moved, setMoved] = useState<Set<string>>(new Set());
  /** the subset a described filter found, waiting on a yes */
  const [found, setFound] = useState<Txn[]>([]);
  const [picker, setPicker] = useState<{ preselected: string[] } | null>(null);
  /** the top ten in full, on the proto's own list page (BigSpendsActivity) */
  const [fullList, setFullList] = useState<Txn[] | null>(null);
  const nextId = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const parkElRef = useRef<HTMLDivElement>(null);
  /** the lines that have finished typing: what hangs under one reveals then */
  const [doneIds, setDoneIds] = useState<Set<number>>(new Set());
  /** the docked card up now, and the answered one on its way down */
  const [dock, setDock] = useState<Dock | null>(null);
  const [dockLeaving, setDockLeaving] = useState<Dock | null>(null);
  const [dockH, setDockH] = useState(0);
  const dockRef = useRef<HTMLDivElement>(null);
  const sinkDock = () => {
    setDock((d) => {
      if (d) { setDockLeaving(d); window.setTimeout(() => setDockLeaving(null), DOCK_SINK_MS); }
      return null;
    });
    setDockPicked([]);
    setDockFilter(null);
  };
  /** Dock · list: what's ticked in the card, the filter the bar's words became, and the model's turn */
  const [dockPicked, setDockPicked] = useState<string[]>([]);
  const [dockFilter, setDockFilter] = useState<Filter | null>(null);
  const [dockAsking, setDockAsking] = useState(false);
  useLayoutEffect(() => {
    const el = dockRef.current;
    if (!el) { setDockH(0); return; }
    const ro = new ResizeObserver(() => setDockH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [dock, dockLeaving]);

  const say = (t: Omit<Turn, "id" | "role">) => {
    setThinking(true);
    window.setTimeout(() => {
      setThinking(false);
      setTurns((prev) => [...prev, { id: nextId.current++, role: "cosimo", ...t }]);
    }, THINK_MS);
  };
  const user = (text: string) => setTurns((prev) => [...prev, { id: nextId.current++, role: "user", text }]);

  const apply = (ids: string[]) => {
    const next = new Set(moved);
    ids.forEach((id) => next.add(id));
    setMoved(next);
    setPhase("done");
    const n = ids.length;
    const sum = SWIGGY_TXNS.filter((t) => ids.includes(t.id)).reduce((s, t) => s + t.amount, 0);
    say({
      text: `Done. ${n} Swiggy transaction${n > 1 ? "s" : ""} now read ${target}, ${inr(sum)} in all. Shopping is lighter by that much this month.`,
      list: TOP_TXNS,
      more: "full",
      moved: next,
    });
  };

  const askWhich = () => {
    setPhase("which");
    if (mode === "docklist") {
      say({
        text: "All right, which ones do we update?",
        dock: { title: "Select transactions", placeholder: DESCRIBE_HINT, list: true },
      });
    } else if (mode === "page") {
      // the card into the list, then how else to narrow it (user pin
      // 2026-10-15: "after this there should be a card, select from 44
      // transactions, like we are using at other places too, followed by you
      // can also filter by location, time, day, etc.")
      say({
        text: "All right, which ones do we update?",
        card: SWIGGY_TXNS.length - moved.size,
        after: "In there you can tick them one by one, or ask me for a set: an amount, a day of the week, a month, or just the Instamart ones.",
      });
    } else {
      say({
        text: "All right, which ones do we update? Describe them, like a day or an amount, or pick from the list.",
        rows: [
          { icon: ICON.say, label: "Describe them", act: "describe" },
          { icon: ICON.list, label: "Pick from the list", act: "pick" },
        ],
      });
    }
  };

  /** "I found 44 … mark all of them as <to>?" — from a typed line or the category page */
  const confirmMove = (to: string) => {
    setTarget(to);
    setPhase("confirm");
    const n = SWIGGY_TXNS.length - moved.size;
    say({
      text: `Okay, I found ${n} Swiggy transactions since April, all filed under Shopping. Mark all of them as ${to}?`,
      rows: [
        { icon: ICON.yes, label: `Yes, all ${n}`, act: "all" },
        { icon: ICON.no, label: "No, only some of them", act: "some" },
      ],
    });
  };

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    // an edit typed under the list card changes the card alone: nothing lands
    // in the thread, and the words stay in the bar (user pin 2026-10-16:
    // "this should not update here, only in the main bottom box, any edit entry")
    if (mode === "docklist" && dock?.list) {
      setDockAsking(true);
      setDockPicked([]);
      window.setTimeout(() => {
        setDockAsking(false);
        const f = parseFilter(text);
        setDockFilter(f ?? { test: () => false, label: text });
        setDockPicked(f ? SWIGGY_TXNS.filter((t) => !moved.has(t.id) && f.test(t)).map((t) => t.id) : []);
      }, ASK_MS);
      return;
    }
    setDraft("");
    setHint("Ask cosimo");
    sinkDock();
    user(text);
    const s = text.toLowerCase();
    if (/top|biggest|largest|most/.test(s) && /transaction|spend/.test(s)) {
      setPhase("top");
      say({
        text: "Here are your top ten this month, biggest first. Each one carries the category it's filed under.",
        list: TOP_TXNS,
        more: "full",
        moved,
        rows: moved.size ? undefined : [
          { icon: ICON.travel, label: ASK_MOVE, act: "move" },
          // the page with every category (user pin 2026-10-15): pick one and
          // the chat carries on from "Update Swiggy category to …"
          { icon: ICON.update, label: "Update category of Swiggy transactions", act: "update-cat" },
        ],
      });
      return;
    }
    // a category named in the line, by its name or its first word
    const named = CATEGORIES.find((c) => s.includes(c.name.toLowerCase()) || s.includes(c.name.toLowerCase().split(" ")[0]));
    if (/swiggy/.test(s) && named) { confirmMove(named.name); return; }
    if (phase === "confirm") {
      if (/^(yes|yeah|yep|ya|sure|ok|all|do it)/.test(s)) { apply(SWIGGY_TXNS.map((t) => t.id)); return; }
      if (/^(no|nope|not all|some|only|let me)/.test(s)) { askWhich(); return; }
    }
    if (phase === "described") {
      if (/^(yes|yeah|yep|ya|sure|ok|do it|those|these)/.test(s)) { apply(found.map((t) => t.id)); return; }
      if (/list|show|see/.test(s)) { setPicker({ preselected: found.map((t) => t.id) }); return; }
    }
    if (phase === "which" || phase === "described") {
      const f = parseFilter(text);
      if (!f) { say({ text: "I couldn't read that one. Try an amount, a day of the week, or a month." }); return; }
      const hits = SWIGGY_TXNS.filter((t) => !moved.has(t.id) && f.test(t));
      if (!hits.length) { say({ text: `Nothing ${f.label}. Try another amount, day or month.` }); return; }
      setFound(hits);
      setPhase("described");
      const sum = hits.reduce((a, t) => a + t.amount, 0);
      const n = hits.length;
      say({
        text: `That's ${n} Swiggy transaction${n > 1 ? "s" : ""} ${f.label}, ${inr(sum)} in all. Mark those as ${target}?`,
        list: hits,
        more: "picker",
        rows: [
          { icon: ICON.yes, label: `Yes, these ${n}`, act: "found" },
          // past four, the list's own "+N more" row opens the picker
          ...(n > LIST_MAX ? [] : [{ icon: ICON.list, label: "See them in the list", act: "pick-found" }]),
          { icon: ICON.no, label: "No, something else", act: "redo" },
        ],
      });
      return;
    }
    say({ text: "I don't have that one to hand. Ask me about this month's transactions, or tell me a category to fix." });
  };

  const onRow = (r: Row) => {
    if (r.act !== "pick" && r.act !== "pick-found") sinkDock();
    switch (r.act) {
      case "top": send(ASK_TOP); break;
      case "move": send(ASK_MOVE); break;
      case "update-cat": setCatPage(true); break;
      case "all": user(r.label); apply(SWIGGY_TXNS.map((t) => t.id)); break;
      case "some": user(r.label); askWhich(); break;
      case "describe": user(r.label); setHint(DESCRIBE_HINT); inputRef.current?.focus(); break;
      case "pick": user(r.label); setPicker({ preselected: [] }); break;
      case "found": user(r.label); apply(found.map((t) => t.id)); break;
      case "pick-found": user(r.label); setPicker({ preselected: found.map((t) => t.id) }); break;
      case "redo": user(r.label); setPhase("which"); setHint(DESCRIBE_HINT); say({ text: "Sure. What do the ones you mean have in common?" }); inputRef.current?.focus(); break;
      case "new": setTurns([]); setPhase("start"); setMoved(new Set()); setFound([]); setDoneIds(new Set()); break;
    }
  };

  // the user's message LEADS its beat (v2): it parks at the top and the reply
  // types beneath it; the park holds for one reply
  const lastIdx = turns.length - 1;
  const parkIdx = turns[lastIdx]?.role === "user" ? lastIdx : turns[lastIdx - 1]?.role === "user" ? lastIdx - 1 : lastIdx;
  const parkId = parkIdx >= 0 ? turns[parkIdx].id : null;
  useAnchoredChatScroll({
    viewport: threadRef, content: contentRef, spacer: spacerRef,
    anchor: parkElRef, anchorId: parkId, active: true, topInset: 8,
    viewportHeight: dockH,
    contentVersion: `${turns.length}:${thinking}:${doneIds.size}`,
  });

  const last = turns[turns.length - 1];
  const ready = !thinking && !picker;
  const placeholder = dock?.placeholder ?? dockLeaving?.placeholder ?? hint;

  return (
    <div className="re1-ambient" style={{ position: "relative", height: "100%", width: "100%", background: BG_PRIMARY, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <StatusBar backgroundColor="transparent" />
      {/* canon chat bar (2790:52457): a bare chevron-down, history and new chat */}
      <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 12px", flexShrink: 0 }}>
        <ChromeButton label="Close chat"><div aria-hidden style={{ ...tintedGlyph("/icons/chevron-left.svg", EXT_BG_BOLD_REVERSE, 24), transform: "rotate(-90deg)" }} /></ChromeButton>
        <div style={{ flex: 1 }} />
        <ChromeButton label="Chat history"><div aria-hidden style={tintedGlyph("/icons/reload.svg", EXT_BG_BOLD_REVERSE, 22)} /></ChromeButton>
        <ChromeButton label="New chat" onClick={() => { sinkDock(); onRow({ icon: "", label: "", act: "new" }); }}><div aria-hidden style={tintedGlyph("/icons/add.svg", EXT_BG_BOLD_REVERSE, 22)} /></ChromeButton>
      </div>

      <div style={{ position: "relative", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div ref={threadRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", scrollbarWidth: "none", overflowAnchor: "none", overscrollBehaviorY: "contain", padding: `8px ${PAGE_GUTTER}px ${28 + (dock || dockLeaving ? dockH + 16 : 0)}px`, display: "flex", flexDirection: "column" }}>
      <div ref={contentRef} style={{ display: "flex", flexDirection: "column", gap: 14, flexShrink: 0 }}>
        {turns.length === 0 && (
          <div className="animate-chat-message-in">
            <p style={{ ...typography.bodySmall, lineHeight: "22px", color: TEXT_PRIMARY, margin: "0 0 16px" }}>Ask me anything about your money.</p>
            <OptionRows rows={[{ icon: ICON.top, label: ASK_TOP, act: "top" }]} onPick={onRow} live />
          </div>
        )}
        {turns.map((t) =>
          t.role === "user" ? (
            <div key={t.id} ref={t.id === parkId ? parkElRef : undefined} className="re1-chat-user-message" style={{ display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
              <div style={{ background: CHAT_USER_BUBBLE, borderRadius: RADIUS_M, padding: "10px 14px", maxWidth: "82%" }}>
                <p style={{ ...typography.bodySmall, lineHeight: "22px", color: TEXT_PRIMARY, opacity: 0.9, margin: 0 }}>{t.text}</p>
              </div>
            </div>
          ) : (
            <div key={t.id} ref={t.id === parkId ? parkElRef : undefined} style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* the line types; what hangs under it comes up in one sweep once it has (v2) */}
              <CosimoLine
                text={t.text}
                active={t === last && !doneIds.has(t.id)}
                onDone={() => {
                  setDoneIds((d) => new Set(d).add(t.id));
                  if (t.dock) window.setTimeout(() => setDock(t.dock!), 120);
                }}
              />
              {doneIds.has(t.id) && (t.card != null || t.after || t.list || (t.rows && t === last)) && (
                <ChatReveal>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {t.card != null && <HandoffCard count={t.card} onOpen={() => setPicker({ preselected: [] })} />}
                    {t.after && <p style={{ ...typography.bodySmall, lineHeight: "22px", color: TEXT_PRIMARY, margin: 0 }}>{t.after}</p>}
                    {t.list && <TxnList txns={t.list} moved={t.moved ?? moved} target={target} onMore={t.more === "full" ? () => setFullList(t.list!) : t.more === "picker" ? () => setPicker({ preselected: t.list!.map((x) => x.id) }) : undefined} />}
                    {t.rows && t === last && <OptionRows rows={t.rows} onPick={onRow} live={ready} />}
                  </div>
                </ChatReveal>
              )}
            </div>
          ),
        )}
        {thinking && (
          <p className="animate-chat-message-in animate-thinking-pulse" style={{ ...typography.bodySmall, color: TEXT_TERTIARY, margin: 0, padding: "4px 0" }}>Thinking</p>
        )}
      </div>
      <div ref={spacerRef} aria-hidden style={{ height: 0, flexShrink: 0 }} />
      </div>
      <FootFade />
      {/* the card over the input (Pick → Dock): it opens up out of the bar and
          sinks back into it once answered, the answer shown chosen for a beat */}
      {(dock || dockLeaving) && (
        <div ref={dockRef} aria-hidden={dock ? undefined : true} style={{ position: "absolute", left: BAR_MARGIN, right: BAR_MARGIN, bottom: 8, zIndex: 52, pointerEvents: dock ? undefined : "none" }}>
          <DockCard
            key={(dock ?? dockLeaving)!.title}
            dock={(dock ?? dockLeaving)!}
            leaving={!dock}
            list={{
              rows: SWIGGY_TXNS.filter((t) => !moved.has(t.id) && (!dockFilter || dockFilter.test(t))),
              picked: dockPicked,
              asking: dockAsking,
              target,
              onToggle: (id) => setDockPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])),
              onAll: (ids) => setDockPicked(ids),
              onApply: () => { const ids = dockPicked; sinkDock(); user(`Mark these ${ids.length} as ${target}`); apply(ids); },
            }}
          />
        </div>
      )}
      </div>

      {/* the Ask cosimo pill, as v2 draws it */}
      <div style={{ flexShrink: 0, padding: `8px ${BAR_MARGIN}px 8px` }}>
        <div style={MESSAGE_BOX}>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => { setDraft(e.target.value); if (dock?.list && !e.target.value.trim()) setDockFilter(null); }}
            onKeyDown={(e) => e.key === "Enter" && send(draft)}
            placeholder={placeholder}
            aria-label="Message cosimo"
            enterKeyHint="send"
            style={{ width: "100%", border: "none", outline: "none", background: "transparent", ...typography.bodySmall, color: TEXT_PRIMARY }}
          />
          <SendButton show={!!draft.trim()} onClick={() => send(draft)} />
        </div>
      </div>
      <GestureNav backgroundColor={BG_PRIMARY} />

      {fullList && (
        <Rise onClose={() => setFullList(null)}>
          {(close) => (
            <BigSpendsActivity
              title="Top transactions · Oct"
              transactions={fullList.map((t) => ({ date: fmtDate(t.date), merchant: t.merchant, amount: t.amount, category: moved.has(t.id) ? target : t.cat }))}
              onClose={() => close()}
            />
          )}
        </Rise>
      )}
      {catPage && (
        <CategoryPage
          onClose={() => setCatPage(false)}
          onPick={(name) => { setCatPage(false); user(`Update Swiggy category to ${name}`); confirmMove(name); }}
        />
      )}
      {picker && (
        <Picker
          preselected={picker.preselected}
          txns={SWIGGY_TXNS.filter((t) => !moved.has(t.id))}
          onClose={() => setPicker(null)}
          target={target}
          onApply={(ids) => { setPicker(null); sinkDock(); user(`Mark these ${ids.length} as ${target}`); apply(ids); }}
        />
      )}
    </div>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────────
function ChromeButton({ label, onClick, children }: { label: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="transition-transform active:scale-[0.94]" style={{ width: 48, height: 48, display: "grid", placeItems: "center", border: "none", background: "transparent", padding: 0, cursor: "pointer" }}>
      {children}
    </button>
  );
}

function SendButton({ show, onClick }: { show: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-label="Send" onClick={onClick} disabled={!show} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 38, height: 38, borderRadius: "50%", border: "none", background: BTN_BG_PRIMARY_DEFAULT, opacity: show ? 1 : 0, cursor: show ? "pointer" : "default", display: "grid", placeItems: "center", transition: "opacity 180ms ease" }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M9 14V4M4.5 8.5L9 4L13.5 8.5" stroke={TEXT_ON_COLOR_PRIMARY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/** Hairline option rows, the canon's own shape (2371:107551): a glyph, the label, a hairline from the label's edge. */
function OptionRows({ rows, onPick, live }: { rows: Row[]; onPick: (r: Row) => void; live: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {rows.map((r, i) => (
        <div key={r.label} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {i > 0 && <div aria-hidden style={{ height: 1, marginLeft: 36, background: OUTLINE_SUBTLE }} />}
          <div role="button" tabIndex={live ? 0 : -1} onClick={() => live && onPick(r)} onKeyDown={(e) => e.key === "Enter" && live && onPick(r)} className="transition-transform active:scale-[0.99]" style={{ display: "flex", alignItems: "center", gap: 12, cursor: live ? "pointer" : "default", opacity: live ? 1 : 0.5 }}>
            <div style={{ width: 24, height: 24, display: "grid", placeItems: "center", flexShrink: 0 }}><div aria-hidden style={tintedGlyph(r.icon, TEXT_PRIMARY, 20)} /></div>
            <span style={{ ...typography.buttonSmall, color: TEXT_PRIMARY }}>{r.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Avatar({ t, size = 40, on = false }: { t: Txn; size?: number; /** ticked: the avatar goes Valentino under a tick (user pin 2026-10-15) */ on?: boolean }) {
  const [tick] = useProtoFlag("recatTick");
  return (
    <div aria-hidden style={{ position: "relative", width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: `1px solid ${on ? "transparent" : OUTLINE_SUBTLE}`, display: "grid", placeItems: "center", background: on ? VALENTINO_500 : t.logo ? BG_PRIMARY : t.tint, transition: "background 200ms ease, border-color 200ms ease" }}>
      <div style={{ display: "grid", placeItems: "center", opacity: on ? 0 : 1, transform: on ? "scale(0.6)" : "none", transition: `opacity 160ms ease, transform 200ms ${EASE}` }}>
        {t.logo
          ? <img src={`/return-exp1/merchants/${t.logo}.png`} alt="" width={size} height={size} draggable={false} style={{ display: "block", objectFit: "cover" }} />
          : <span style={{ ...typography.headerH4, color: TEXT_ON_COLOR_PRIMARY }}>{t.merchant.charAt(0)}</span>}
      </div>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: on ? 1 : 0, transform: on ? "none" : "scale(0.6)", transition: `opacity 160ms ease, transform 240ms ${EASE}` }}>
        {tick === "rounded"
          ? <div style={tintedGlyph("/return-exp1/tick-rounded.svg", TEXT_ON_COLOR_PRIMARY, 24)} />
          : tick === "double"
            ? <DoubleTick color={TEXT_ON_COLOR_PRIMARY} dim={false} />
            : <div style={{ ...tintedGlyph("/chat/tick-magenta.svg", TEXT_ON_COLOR_PRIMARY, 16), width: 17, height: 13 }} />}
      </div>
    </div>
  );
}

/** Transaction rows in the chat (canon List item/Transaction: px 0 inside the
    thread's gutter, py 12, the amount on the name's line, the category under it). */
/** how many rows a list in the chat shows before "+N more" (user pin
    2026-10-15: "only have 4 items in the list and then +4 more") */
const LIST_MAX = 4;
function TxnList({ txns, moved, target, onMore }: { txns: Txn[]; moved: Set<string>; target: string; onMore?: () => void }) {
  const overflow = txns.length - LIST_MAX;
  return (
    <div style={{ display: "flex", flexDirection: "column", marginLeft: -PAGE_GUTTER, marginRight: -PAGE_GUTTER }}>
      {txns.slice(0, LIST_MAX).map((t) => {
        const cat: Cat = moved.has(t.id) ? target : t.cat;
        const changed = moved.has(t.id);
        return (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: `12px ${PAGE_GUTTER}px` }}>
            <Avatar t={t} />
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.merchant}</span>
                <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, whiteSpace: "nowrap" }}>{inr(t.amount)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, ...typography.caption, color: changed ? VALENTINO_500 : TEXT_SECONDARY, transition: "color 320ms ease" }}>
                <div aria-hidden style={tintedGlyph(CAT_ICON[cat], changed ? VALENTINO_500 : TEXT_SECONDARY, 12)} />
                <span>{cat} · {fmtDate(t.date)}</span>
              </div>
            </div>
          </div>
        );
      })}
      {/* the TransactionTableCard's overflow row (ChatCards), as it draws it */}
      {overflow > 0 && (
        <button type="button" onClick={onMore} className="transition-opacity active:opacity-60" style={{ ...typography.caption, fontWeight: 500, color: VALENTINO_500, textAlign: "left", padding: `12px ${PAGE_GUTTER}px`, margin: 0, background: "none", border: "none", width: "100%", cursor: onMore ? "pointer" : "default" }}>
          +{overflow} more transaction{overflow > 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}

/** The chat's hand-off card (the feed's FeedHandoffCard, as it draws it): a
    caption over an H4, the merchant's mark trailing in the 44 slot, the card's
    own shell, 20 in from the frame like the bar and the docked card (user pin
    2026-10-15: "fix the proportion like the other card"). */
function HandoffCard({ count, onOpen }: { count: number; onOpen: () => void }) {
  const label = `Select from ${count} transactions`;
  return (
    <div role="button" tabIndex={0} aria-label={label} onClick={onOpen} onKeyDown={(e) => e.key === "Enter" && onOpen()} className="transition-transform active:scale-[0.99]" style={{ marginTop: 4, marginInline: BAR_MARGIN - PAGE_GUTTER, background: BG_CARD, border: `1px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_M, boxShadow: ELEVATION_CARD, padding: 20, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
      <span style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
        <span style={{ ...typography.caption, color: TEXT_PRIMARY }}>Swiggy, since April</span>
        <span style={{ ...typography.headerH4, color: TEXT_PRIMARY }}>{label}</span>
      </span>
      {/* the merchant's mark in the feed card's 44 slot, ringed like a list avatar */}
      <div aria-hidden style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: `1px solid ${OUTLINE_SUBTLE}`, background: BG_PRIMARY }}>
        <img src="/return-exp1/merchants/swiggy.png" alt="" width={44} height={44} draggable={false} style={{ display: "block", objectFit: "cover" }} />
      </div>
    </div>
  );
}

function CosimoLine({ text, active, onDone }: { text: string; active: boolean; onDone?: () => void }) {
  const shown = useTypewriter(text, active, onDone);
  return <p style={{ ...typography.bodySmall, lineHeight: "22px", color: TEXT_PRIMARY, margin: 0, whiteSpace: "pre-wrap" }}>{shown}</p>;
}

/** Everything cosimo adds under a line once it has typed comes in through
    this one sweep (v2's ChatReveal, its Sweep take): a feathered edge crosses
    the block from above while the block holds its seat. */
const REVEAL_MS = 640;
const REVEAL_FEATHER = 80;
function ChatReveal({ children }: { children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const block = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  useLayoutEffect(() => {
    const w = wrap.current, b = block.current;
    if (done || !w || !b || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const opts: KeyframeAnimationOptions = { duration: REVEAL_MS, easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", fill: "backwards" };
    const edge = w.animate([{ transform: "translateY(-100%)" }, { transform: "none" }], opts);
    const hold = b.animate([{ transform: `translateY(calc(100% + ${16 + REVEAL_FEATHER}px))` }, { transform: "none" }], opts);
    edge.pause(); hold.pause();
    const raf = requestAnimationFrame(() => { const t = performance.now(); edge.startTime = t; hold.startTime = t; });
    edge.finished.then(() => setDone(true), () => {});
    return () => { cancelAnimationFrame(raf); edge.cancel(); hold.cancel(); };
  }, [done]);
  return (
    <div ref={wrap} className={done ? undefined : "re1-chat-reveal"} style={done ? undefined : { ["--re1-reveal-f" as string]: `${REVEAL_FEATHER}px` }}>
      <div ref={block}>{children}</div>
    </div>
  );
}

/** The card that docks over the input, the onboarding's (2856:80059, v2's
    SetupDockCard): the question as an H2 over its line, a rule, the answers
    as radios; the chosen one checks, then the card sinks into the bar. */
type DockList = { rows: Txn[]; picked: string[]; asking: boolean; target: string; onToggle: (id: string) => void; onAll: (ids: string[]) => void; onApply: () => void };
function DockCard({ dock, leaving, list }: { dock: Dock; leaving: boolean; list: DockList }) {
  const sum = list.rows.filter((t) => list.picked.includes(t.id)).reduce((a, t) => a + t.amount, 0);
  return (
    <div style={{ transformOrigin: "50% 100%", animation: leaving ? `re1DockSink ${DOCK_SINK_MS}ms cubic-bezier(0.4, 0, 1, 1) both` : `re1DockRise ${DOCK_RISE_MS}ms ${GENTLE} both`, background: "var(--re1-ask-bar-bg, var(--dls-bg-card))", border: `1px solid ${OUTLINE_SUBTLE}`, backdropFilter: "var(--re1-glass-filter, blur(24px))", WebkitBackdropFilter: "var(--re1-glass-filter, blur(24px))", borderRadius: RADIUS_L, boxShadow: "var(--re1-glass-shine), var(--re1-glass-shadow)", padding: 24, display: "flex", flexDirection: "column", gap: 24, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
          <span style={{ ...typography.headerH2, color: TEXT_PRIMARY }}>{dock.title}</span>
          {/* the list card carries no line under its title (user pin 2026-10-15:
              "remove subtext"); the count takes the slot once something is ticked */}
          {list.picked.length > 0 && <span style={{ ...typography.bodySmall, color: TEXT_SECONDARY }}>{list.picked.length} selected · {inr(sum)}</span>}
        </div>
        {/* top right: the double tick selects all while nothing is ticked;
            with a tick on, the slot is the confirm, a Valentino disc under
            one tick (user pin 2026-10-15: "the CTA should be on the top right
            where the select all is, make that just a tick, no CTA at the bottom") */}
        {/* one tick, always (user pin 2026-10-16: "this should just be a tick,
            we don't need the select all here"): the DLS line tick, waiting
            dim until something is ticked, then Valentino and live */}
        {(
          <button type="button" aria-label={list.picked.length ? `Mark ${list.picked.length} as ${list.target}` : "Nothing selected yet"} onClick={list.onApply} disabled={leaving || list.picked.length === 0} className="transition-transform active:scale-[0.94]" style={{ width: 40, height: 40, margin: "-8px -8px 0 0", display: "grid", placeItems: "center", border: "none", background: "transparent", padding: 0, cursor: list.picked.length ? "pointer" : "default", flexShrink: 0 }}>
            <div aria-hidden style={{ ...tintedGlyph("/return-exp1/tick-rounded.svg", list.picked.length ? VALENTINO_500 : EXT_BG_BOLD_REVERSE, 26), opacity: list.picked.length ? 1 : 0.4, transition: "background-color 200ms ease, opacity 200ms ease" }} />
          </button>
        )}
      </div>
      <div aria-hidden style={{ height: 1, background: OUTLINE_BOLD }} />
      {(
        <>
          {/* the rows to tick, as many as fit in the card's window; the rest scroll */}
          <div style={{ maxHeight: 264, overflowY: "auto", scrollbarWidth: "none", margin: "-12px 0", display: "flex", flexDirection: "column" }}>
            {list.asking ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
                <span role="status" className="plan-cruncher-shimmer-text" style={{ ...typography.bodyNormal }}>Finding them</span>
              </div>
            ) : list.rows.length === 0 ? (
              <p style={{ ...typography.bodySmall, color: TEXT_TERTIARY, margin: 0, padding: "20px 0" }}>Nothing matches that. Clear the bar to see every row.</p>
            ) : list.rows.map((t) => {
              const on = list.picked.includes(t.id);
              return (
                <div key={t.id} role="checkbox" aria-checked={on} tabIndex={leaving ? -1 : 0} aria-label={`${t.note} ${inr(t.amount)}`} onClick={() => list.onToggle(t.id)} onKeyDown={(e) => e.key === "Enter" && list.onToggle(t.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", cursor: "pointer" }}>
                  <Avatar t={t} on={on} />
                  {/* a ticked row's name and amount take the brand ink (user pin 2026-10-16: "update the font colour to selected state") */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                    <span style={{ ...typography.bodySmall, color: on ? VALENTINO_500 : TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 200ms ease" }}>{t.note}</span>
                    <span style={{ ...typography.caption, color: TEXT_SECONDARY, whiteSpace: "nowrap" }}>{fmtDay(t.date)}</span>
                  </div>
                  <span style={{ ...typography.bodySmall, color: on ? VALENTINO_500 : TEXT_PRIMARY, whiteSpace: "nowrap", transition: "color 200ms ease" }}>{inr(t.amount)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/** Update category (user pin 2026-10-15): a clean list of every category
    with a search over it, rising over the chat; one tap picks it and the
    chat carries on from "Update Swiggy category to …". */
function CategoryPage({ onClose, onPick }: { onClose: () => void; onPick: (name: string) => void }) {
  const [q, setQ] = useState("");
  const rows = CATEGORIES.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <Rise onClose={onClose}>
      {(close) => (<>
        <StatusBar backgroundColor="transparent" />
        {/* canon App bar/Standard (3057:92292): the X, then the title flush
            after it as H4 over a short caption (user pin 2026-10-15: "this
            should be in the app bar, reduce the subtext") */}
        <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 12px", flexShrink: 0 }}>
          <ChromeButton label="Close" onClick={() => close()}><div aria-hidden style={tintedGlyph("/return-exp1/bill-picker/close.svg", EXT_BG_BOLD_REVERSE, 24)} /></ChromeButton>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
            <h2 style={{ ...typography.headerH4, color: TEXT_PRIMARY, margin: 0 }}>Update category</h2>
            <span style={{ ...typography.caption, color: TEXT_SECONDARY }}>Swiggy · {SWIGGY_TXNS.length} transactions</span>
          </div>
        </div>
        <div style={{ position: "relative", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", scrollbarWidth: "none", display: "flex", flexDirection: "column", paddingBottom: 28 }}>
            {/* canon Search (3057:91761): 48 tall inside a 2px Outline Subtle stroke */}
            <div style={{ padding: `8px ${PAGE_GUTTER}px 8px`, flexShrink: 0 }}>
              <div style={{ height: 48, display: "flex", alignItems: "center", gap: 14, padding: "0 16px 0 12px", border: `2px solid ${OUTLINE_SUBTLE}`, borderRadius: 100 }}>
                <div aria-hidden style={tintedGlyph("/return-exp1/bill-picker/search.svg", EXT_BG_BOLD_REVERSE, 20)} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search categories" aria-label="Search categories" style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", padding: 0, ...typography.bodySmall, color: TEXT_PRIMARY }} />
              </div>
            </div>
            {rows.length === 0 && <p style={{ ...typography.bodySmall, color: TEXT_TERTIARY, margin: 0, padding: `24px ${PAGE_GUTTER}px` }}>No category by that name.</p>}
            {rows.map((c) => (
              <div key={c.name} role="button" tabIndex={0} onClick={() => close(() => onPick(c.name))} onKeyDown={(e) => e.key === "Enter" && close(() => onPick(c.name))} className="transition-transform active:scale-[0.99]" style={{ display: "flex", alignItems: "center", gap: 12, padding: `14px ${PAGE_GUTTER}px`, cursor: "pointer" }}>
                <div aria-hidden style={{ width: 40, height: 40, borderRadius: "50%", border: `1px solid ${OUTLINE_SUBTLE}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <div style={tintedGlyph(c.icon, TEXT_PRIMARY, 20)} />
                </div>
                <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, flex: 1, minWidth: 0 }}>{c.name}</span>
              </div>
            ))}
          </div>
          <FootFade />
        </div>
        <GestureNav backgroundColor={BG_PRIMARY} />
      </>)}
    </Rise>
  );
}

/** The chat's foot scrim, as v2 draws it: the thread fades into the page
    colour just above the message box instead of clipping on it (user pin
    2026-10-15: "same smooth gradient fade BG like we have in chat"). */
function FootFade() {
  // 28 tall, solid only at its foot, which sits 8 above the bar (user pin
  // 2026-10-15: "the fade is too high, it should end slightly above this
  // message bar")
  return <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 28, background: `linear-gradient(to bottom, transparent, ${BG_PRIMARY})`, pointerEvents: "none", zIndex: 9 }} />;
}

/** A page that rises over the chat and sinks back on close; `children` gets
    the close that plays the sink first. */
function Rise({ onClose, children }: { onClose: () => void; children: (close: (then?: () => void) => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => { const r = requestAnimationFrame(() => setOpen(true)); return () => cancelAnimationFrame(r); }, []);
  const close = (then?: () => void) => { setLeaving(true); setOpen(false); window.setTimeout(then ?? onClose, 380); };
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 70, background: BG_PRIMARY, display: "flex", flexDirection: "column", transform: open ? "none" : "translateY(100%)", transition: `transform 380ms ${EASE}`, pointerEvents: leaving ? "none" : "auto" }}>
      {children(close)}
    </div>
  );
}

/** The list that rises over the chat (the canon bill picker, 3057:92281): X-close,
    an ask bar where the search was (user pin 2026-10-15: "we don't need search
    here, make this an ask AI bar"), the Filter beside it, every Swiggy row to
    tick, a counting footer. A sentence in the bar ticks the rows for you. */
function Picker({ txns, preselected, target, onClose, onApply }: {
  txns: Txn[]; preselected: string[]; target: string; onClose: () => void; onApply: (ids: string[]) => void;
}) {
  const [picked, setPicked] = useState<string[]>(preselected);
  const [askDraft, setAskDraft] = useState("");
  /** the filter the bar's words became; the words stay in the bar as the
      record of it (user pin 2026-10-15: "maintain search query in search bar",
      no summary line), and clearing the bar shows every row again */
  const [askFilter, setAskFilter] = useState<Filter | null>(null);
  /** the model's turn: every ask waits ASK_MS under a loader before the rows
      change (user pin 2026-10-15: "after any input here, there should be a
      loader, of 3 seconds, while this data updates") */
  const [asking, setAsking] = useState(false);
  const rows = txns.filter((t) => !askFilter || askFilter.test(t));
  /** every row on screen is ticked */
  const allOn = rows.length > 0 && rows.every((t) => picked.includes(t.id));
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const runAsk = () => {
    const q = askDraft.trim();
    if (!q || asking) return;
    setAsking(true);
    setPicked([]);
    window.setTimeout(() => {
      setAsking(false);
      const f = parseFilter(q);
      // words the parser can't read narrow to nothing, and the list says so
      setAskFilter(f ?? { test: () => false, label: q });
      if (f) setPicked(txns.filter(f.test).map((t) => t.id));
    }, ASK_MS);
  };
  const sum = txns.filter((t) => picked.includes(t.id)).reduce((s, t) => s + t.amount, 0);
  // the confirm keeps its last count while it fades out, so it never reads "Mark 0"
  const [ctaCount, setCtaCount] = useState(0);
  useEffect(() => { if (picked.length) setCtaCount(picked.length); }, [picked.length]);

  return (
    <Rise onClose={onClose}>
      {(close) => (<>
      <StatusBar backgroundColor="transparent" />
      <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 12px", flexShrink: 0 }}>
        <ChromeButton label="Close" onClick={() => close()}><div aria-hidden style={tintedGlyph("/return-exp1/bill-picker/close.svg", EXT_BG_BOLD_REVERSE, 24)} /></ChromeButton>
        {/* a bare X bar: the page head below names the page (user pin
            2026-10-15: "header is not required"); the bar keeps only the
            running count once something is ticked */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {picked.length > 0 && <span style={{ ...typography.bodySmall, color: TEXT_SECONDARY }}>{picked.length} selected · {inr(sum)}</span>}
        </div>
        {/* select all (user pin 2026-10-15: "this should be a double tick
            indicating select all"): the DLS tick twice over, lit Valentino
            once every row on screen is ticked; tapping again clears them */}
        <button type="button" aria-label={allOn ? "Clear selection" : "Select all"} aria-pressed={allOn} onClick={() => setPicked(allOn ? [] : rows.map((t) => t.id))} className="transition-transform active:scale-[0.94]" style={{ width: 48, height: 48, display: "grid", placeItems: "center", border: "none", background: "transparent", padding: 0, cursor: "pointer" }}>
          <DoubleTick color={allOn ? VALENTINO_500 : EXT_BG_BOLD_REVERSE} dim={!allOn} />
        </button>
      </div>
      <div style={{ position: "relative", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", scrollbarWidth: "none", display: "flex", flexDirection: "column", paddingBottom: 28 }}>
        {/* the page head says what the page is for (user pin 2026-10-15: "we
            should have a header on this page") — the question, then the two
            ways to answer it */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: `8px ${PAGE_GUTTER}px 16px`, flexShrink: 0 }}>
          <h2 style={{ ...typography.headerH3, color: TEXT_PRIMARY, margin: 0 }}>Which Swiggy transactions move to {target}?</h2>
        </div>
        {/* the model's turn, then its answer, over the rows it narrowed to */}
        {/* the rows step out while the model works: the proto's spinner ring
            (OnboardingSim's) over "Finding them", centred in the list's place */}
        {/* the model's turn reads as a text shimmer, the proto's own
            (plan-cruncher-shimmer-text) — user pin 2026-10-16: "on apply the
            loading should be a text shimmer" */}
        {asking && (
          <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
            <span role="status" className="plan-cruncher-shimmer-text" style={{ ...typography.bodyNormal }}>Finding them</span>
          </div>
        )}
        {!asking && rows.length === 0 && <p style={{ ...typography.bodySmall, color: TEXT_TERTIARY, margin: 0, padding: `24px ${PAGE_GUTTER}px` }}>Nothing matches that. Clear the bar to see every row, or ask another way.</p>}
        {!asking && rows.map((t) => {
          const on = picked.includes(t.id);
          return (
            <div key={t.id} role="checkbox" aria-checked={on} tabIndex={0} aria-label={`${t.note} ${inr(t.amount)}`} onClick={() => toggle(t.id)} onKeyDown={(e) => e.key === "Enter" && toggle(t.id)} className="transition-transform active:scale-[0.99]" style={{ display: "flex", alignItems: "center", gap: 12, padding: `16px ${PAGE_GUTTER}px`, cursor: "pointer" }}>
              {/* ticked: the avatar and the ink carry it, no wash (user pin 2026-10-16) */}
              <Avatar t={t} on={on} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                <span style={{ ...typography.bodyNormal, color: on ? VALENTINO_500 : TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 200ms ease" }}>{t.note}</span>
                <span style={{ ...typography.caption, color: TEXT_SECONDARY, whiteSpace: "nowrap" }}>{fmtDay(t.date)} · {t.cat}</span>
              </div>
              <span style={{ ...typography.bodyNormal, color: on ? VALENTINO_500 : TEXT_PRIMARY, whiteSpace: "nowrap", transition: "color 200ms ease" }}>{inr(t.amount)}</span>
            </div>
          );
        })}
      </div>
      <FootFade />
      </div>
      {/* the ask bar sits where the chat's message box does (user pin
          2026-10-15: "this bar can be at the bottom, same position as the chat
          message box, and should update to the confirm button once something
          has been selected"): one pill, which fills Valentino and reads the
          CTA while rows are ticked, and is the bar again if they are unticked */}
      <div style={{ flexShrink: 0, padding: `8px ${BAR_MARGIN}px 8px` }}>
        {/* ticked, the bar becomes the DLS Primary button (reference_dls_buttons:
            48 tall, 12/24 padding, pill, Valentino under white Button Normal —
            user pin 2026-10-15: "this CTA is not as per DLS"), keeping its foot */}
        <div style={{ ...MESSAGE_BOX, padding: 0, marginTop: picked.length ? 9 : 0, ...(picked.length ? { height: 48, border: "1px solid transparent", background: BTN_BG_PRIMARY_DEFAULT, boxShadow: "none" } : {}), transition: `height 240ms ${EASE}, margin-top 240ms ${EASE}, background 240ms ${EASE}, border-color 240ms ${EASE}, box-shadow 240ms ${EASE}` }}>
          {/* the filter funnel leads the bar (user pin 2026-10-15: "make the icons a filter icon") */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 12, padding: "0 56px 0 20px", opacity: picked.length ? 0 : 1, pointerEvents: picked.length ? "none" : "auto", transition: "opacity 160ms ease" }}>
            <div aria-hidden style={tintedGlyph("/return-exp1/bill-picker/filter.svg", EXT_BG_BOLD_REVERSE, 20)} />
            <input value={askDraft} onChange={(e) => { setAskDraft(e.target.value); if (!e.target.value.trim()) setAskFilter(null); }} onKeyDown={(e) => e.key === "Enter" && runAsk()} placeholder="Ask cosimo, e.g. only weekends" aria-label="Describe the transactions to select" enterKeyHint="send" readOnly={asking} tabIndex={picked.length ? -1 : 0} style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", padding: 0, ...typography.bodySmall, color: asking ? TEXT_TERTIARY : TEXT_PRIMARY, transition: "color 200ms ease" }} />
            <SendButton show={!!askDraft.trim() && !asking} onClick={runAsk} />
          </div>
          <button type="button" onClick={() => close(() => onApply(picked))} tabIndex={picked.length ? 0 : -1} className="transition-transform active:scale-[0.98]" style={{ position: "absolute", inset: 0, width: "100%", border: "none", background: "transparent", padding: "12px 24px", color: TEXT_ON_COLOR_PRIMARY, ...typography.buttonNormal, cursor: "pointer", opacity: picked.length ? 1 : 0, pointerEvents: picked.length ? "auto" : "none", transition: "opacity 160ms ease 80ms" }}>
            Mark {ctaCount} as {target}
          </button>
        </div>
      </div>
      <GestureNav backgroundColor={BG_PRIMARY} />
      </>)}
    </Rise>
  );
}

/** Two of the DLS tick (/chat/tick-magenta.svg's geometry), the second a step
    behind the first, as a read receipt draws them. */
function DoubleTick({ color, dim }: { color: string; dim: boolean }) {
  return (
    <div aria-hidden style={{ position: "relative", width: 26, height: 14, opacity: dim ? 0.6 : 1, transition: "opacity 160ms ease" }}>
      <div style={{ ...tintedGlyph("/chat/tick-magenta.svg", color, 14), position: "absolute", left: 0, top: 2, width: 15, height: 11 }} />
      <div style={{ ...tintedGlyph("/chat/tick-magenta.svg", color, 14), position: "absolute", left: 9, top: 2, width: 15, height: 11 }} />
    </div>
  );
}
