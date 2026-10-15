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

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { GestureNav, StatusBar } from "@/app/components/AppChrome";
import { typography } from "@/app/lib/typography";
import { useProtoFlag } from "@/app/lib/protoFlags";
import { RADIUS_M, RADIUS_PILL } from "@/app/lib/radii";
import {
  BG_PRIMARY,
  BTN_BG_GREY_DEFAULT,
  BTN_BG_PRIMARY_DEFAULT,
  CHAT_USER_BUBBLE,
  EXT_BG_BOLD_REVERSE,
  EXT_BG_SUBTLE_MAIN,
  MAIN_PRIMARY,
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
const THINK_MS = 700;
/** how long the picker's ask bar "thinks" before the rows change */
const ASK_MS = 3000;

// ── Data ─────────────────────────────────────────────────────────────────────
type Cat = "Shopping" | "Travel" | "Food" | "Home" | "Entertainment";
const CAT_ICON: Record<Cat, string> = {
  Shopping: "/icons/categories/shopping.svg",
  Travel: "/icons/categories/travel.svg",
  Food: "/icons/categories/food-drinks.svg",
  Home: "/icons/categories/bills.svg",
  Entertainment: "/icons/categories/entertainment.svg",
};
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
  { id: "t-social", merchant: "Social", note: "Card", amount: 1250, date: new Date(2026, 9, 2), cat: "Food", tint: "#E23744", logo: "social" },
  { id: "t-myntra", merchant: "Myntra", note: "UPI", amount: 1100, date: new Date(2026, 9, 1), cat: "Shopping", tint: "#FF3F6C" },
  { id: "t-irctc", merchant: "IRCTC", note: "Card", amount: 1000, date: new Date(2026, 9, 2), cat: "Travel", tint: "#2E90FF" },
  { id: "t-kfc", merchant: "KFC", note: "UPI", amount: 980, date: new Date(2026, 9, 1), cat: "Food", tint: "#F8CB46", logo: "kfc" },
  SWIGGY_TXNS[1],
  { id: "t-dominos", merchant: "Dominos", note: "slice UPI", amount: 700, date: new Date(2026, 9, 1), cat: "Food", tint: "#0078AE", logo: "dominos" },
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
type Turn = { id: number; role: "user" | "cosimo"; text: string; rows?: Row[]; list?: Txn[]; moved?: Set<string> };
type Phase = "start" | "top" | "confirm" | "which" | "described" | "done";

const ICON = {
  yes: "/return-exp1/setup/thumbs-up.svg",
  no: "/return-exp1/bill-picker/close.svg",
  list: "/icons/dashboard.svg",
  say: "/icons/message.svg",
  travel: "/icons/categories/travel.svg",
  top: "/icons/graph.svg",
};
const ASK_TOP = "What were my top transactions this month?";
const ASK_MOVE = "Mark all Swiggy transactions as Travel";
const DESCRIBE_HINT = "e.g. all of ₹428, or only on weekends";

export default function RecatSim({ pickMode }: { /** the Pick switch, when the host doesn't read the flag */ pickMode?: "page" | "ask" }) {
  const [flag] = useProtoFlag("recatPick");
  const mode = pickMode ?? (flag === "ask" ? "ask" : "page");

  const [turns, setTurns] = useState<Turn[]>([]);
  const [phase, setPhase] = useState<Phase>("start");
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState("Ask cosimo");
  /** the Swiggy rows that now read Travel */
  const [moved, setMoved] = useState<Set<string>>(new Set());
  /** the subset a described filter found, waiting on a yes */
  const [found, setFound] = useState<Txn[]>([]);
  const [picker, setPicker] = useState<{ preselected: string[] } | null>(null);
  const nextId = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

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
      text: `Done. ${n} Swiggy transaction${n > 1 ? "s" : ""} now read Travel, ${inr(sum)} in all. Shopping is lighter by that much this month.`,
      list: TOP_TXNS,
      moved: next,
      rows: n < SWIGGY_TXNS.length ? [{ icon: ICON.travel, label: `Move the other ${SWIGGY_TXNS.length - next.size} too`, act: "rest" }] : undefined,
    });
  };

  const askWhich = () => {
    setPhase("which");
    if (mode === "page") {
      say({ text: "All right, which ones do we update? Tick them, or tell me what they have in common and I'll find them." });
      window.setTimeout(() => setPicker({ preselected: [] }), THINK_MS + 200);
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

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setDraft("");
    setHint("Ask cosimo");
    user(text);
    const s = text.toLowerCase();
    if (/top|biggest|largest|most/.test(s) && /transaction|spend/.test(s)) {
      setPhase("top");
      say({
        text: "Here are your top ten this month, biggest first. Each one carries the category it's filed under.",
        list: TOP_TXNS,
        moved,
        rows: moved.size ? undefined : [{ icon: ICON.travel, label: ASK_MOVE, act: "move" }],
      });
      return;
    }
    if (/swiggy/.test(s) && /travel/.test(s)) {
      setPhase("confirm");
      const n = SWIGGY_TXNS.length - moved.size;
      say({
        text: `Okay, I found ${n} Swiggy transactions since April, all filed under Shopping. Mark all of them as Travel?`,
        rows: [
          { icon: ICON.yes, label: `Yes, all ${n}`, act: "all" },
          { icon: ICON.no, label: "No, only some of them", act: "some" },
        ],
      });
      return;
    }
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
      say({
        text: `That's ${hits.length} Swiggy transaction${hits.length > 1 ? "s" : ""} ${f.label}, ${inr(sum)} in all. Mark those as Travel?`,
        list: hits.slice(0, 4),
        rows: [
          { icon: ICON.yes, label: `Yes, these ${hits.length}`, act: "found" },
          { icon: ICON.list, label: hits.length > 4 ? `See all ${hits.length} in the list` : "See them in the list", act: "pick-found" },
          { icon: ICON.no, label: "No, something else", act: "redo" },
        ],
      });
      return;
    }
    say({ text: "I don't have that one to hand. Ask me about this month's transactions, or tell me a category to fix." });
  };

  const onRow = (r: Row) => {
    switch (r.act) {
      case "top": send(ASK_TOP); break;
      case "move": send(ASK_MOVE); break;
      case "all": user(r.label); apply(SWIGGY_TXNS.map((t) => t.id)); break;
      case "rest": user(r.label); apply(SWIGGY_TXNS.filter((t) => !moved.has(t.id)).map((t) => t.id)); break;
      case "some": user(r.label); askWhich(); break;
      case "describe": user(r.label); setHint(DESCRIBE_HINT); inputRef.current?.focus(); break;
      case "pick": user(r.label); setPicker({ preselected: [] }); break;
      case "found": user(r.label); apply(found.map((t) => t.id)); break;
      case "pick-found": user(r.label); setPicker({ preselected: found.map((t) => t.id) }); break;
      case "redo": user(r.label); setPhase("which"); setHint(DESCRIBE_HINT); say({ text: "Sure. What do the ones you mean have in common?" }); inputRef.current?.focus(); break;
    }
  };

  useLayoutEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [turns, thinking]);

  const last = turns[turns.length - 1];
  const ready = !thinking && !picker;

  return (
    <div style={{ position: "relative", height: "100%", width: "100%", background: BG_PRIMARY, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <StatusBar backgroundColor="transparent" />
      {/* canon chat bar (2790:52457): a bare chevron-down, history and new chat */}
      <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 12px", flexShrink: 0 }}>
        <ChromeButton label="Close chat"><div aria-hidden style={{ ...tintedGlyph("/icons/chevron-left.svg", EXT_BG_BOLD_REVERSE, 24), transform: "rotate(-90deg)" }} /></ChromeButton>
        <div style={{ flex: 1 }} />
        <ChromeButton label="Chat history"><div aria-hidden style={tintedGlyph("/icons/reload.svg", EXT_BG_BOLD_REVERSE, 22)} /></ChromeButton>
        <ChromeButton label="New chat" onClick={() => { setTurns([]); setPhase("start"); setMoved(new Set()); setFound([]); }}><div aria-hidden style={tintedGlyph("/icons/add.svg", EXT_BG_BOLD_REVERSE, 22)} /></ChromeButton>
      </div>

      <div ref={threadRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", scrollbarWidth: "none", padding: `8px ${PAGE_GUTTER}px 24px`, display: "flex", flexDirection: "column", gap: 14 }}>
        {turns.length === 0 && (
          <div className="animate-chat-message-in">
            <p style={{ ...typography.bodySmall, lineHeight: "22px", color: TEXT_PRIMARY, margin: "0 0 16px" }}>Ask me anything about your money.</p>
            <OptionRows rows={[{ icon: ICON.top, label: ASK_TOP, act: "top" }]} onPick={onRow} live />
          </div>
        )}
        {turns.map((t) =>
          t.role === "user" ? (
            <div key={t.id} className="re1-chat-user-message" style={{ display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
              <div style={{ background: CHAT_USER_BUBBLE, borderRadius: RADIUS_M, padding: "10px 14px", maxWidth: "82%" }}>
                <p style={{ ...typography.bodySmall, lineHeight: "22px", color: TEXT_PRIMARY, opacity: 0.9, margin: 0 }}>{t.text}</p>
              </div>
            </div>
          ) : (
            <div key={t.id} className="animate-chat-message-in" style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ ...typography.bodySmall, lineHeight: "22px", color: TEXT_PRIMARY, margin: 0, whiteSpace: "pre-wrap" }}>{t.text}</p>
              {t.list && <TxnList txns={t.list} moved={t.moved ?? moved} />}
              {t.rows && t === last && <OptionRows rows={t.rows} onPick={onRow} live={ready} />}
            </div>
          ),
        )}
        {thinking && (
          <p className="animate-thinking-pulse" style={{ ...typography.bodySmall, color: TEXT_TERTIARY, margin: 0, padding: "4px 0" }}>Thinking</p>
        )}
      </div>

      {/* the Ask cosimo pill (2790:52457): 56 tall on a 2px Outline Subtle stroke */}
      <div style={{ flexShrink: 0, padding: `8px ${16}px 8px` }}>
        <div style={{ position: "relative", height: 56, display: "flex", alignItems: "center", border: `2px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_PILL, padding: "0 56px 0 24px", background: BG_PRIMARY }}>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(draft)}
            placeholder={hint}
            aria-label="Message cosimo"
            enterKeyHint="send"
            style={{ width: "100%", border: "none", outline: "none", background: "transparent", ...typography.bodySmall, color: TEXT_PRIMARY }}
          />
          <SendButton show={!!draft.trim()} onClick={() => send(draft)} />
        </div>
      </div>
      <GestureNav backgroundColor={BG_PRIMARY} />

      {picker && (
        <Picker
          preselected={picker.preselected}
          txns={SWIGGY_TXNS.filter((t) => !moved.has(t.id))}
          onClose={() => setPicker(null)}
          onApply={(ids) => { setPicker(null); user(`Mark these ${ids.length} as Travel`); apply(ids); }}
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

function Avatar({ t, size = 40 }: { t: Txn; size?: number }) {
  return (
    <div aria-hidden style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: `1px solid ${OUTLINE_SUBTLE}`, display: "grid", placeItems: "center", background: t.logo ? BG_PRIMARY : t.tint }}>
      {t.logo
        ? <img src={`/return-exp1/merchants/${t.logo}.png`} alt="" width={size} height={size} draggable={false} style={{ display: "block", objectFit: "cover" }} />
        : <span style={{ ...typography.headerH4, color: TEXT_ON_COLOR_PRIMARY }}>{t.merchant.charAt(0)}</span>}
    </div>
  );
}

/** Transaction rows in the chat (canon List item/Transaction: px 0 inside the
    thread's gutter, py 12, the amount on the name's line, the category under it). */
function TxnList({ txns, moved }: { txns: Txn[]; moved: Set<string> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginLeft: -PAGE_GUTTER, marginRight: -PAGE_GUTTER }}>
      {txns.map((t) => {
        const cat: Cat = moved.has(t.id) ? "Travel" : t.cat;
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
    </div>
  );
}

/** The list that rises over the chat (the canon bill picker, 3057:92281): X-close,
    an ask bar where the search was (user pin 2026-10-15: "we don't need search
    here, make this an ask AI bar"), the Filter beside it, every Swiggy row to
    tick, a counting footer. A sentence in the bar ticks the rows for you. */
function Picker({ txns, preselected, onClose, onApply }: {
  txns: Txn[]; preselected: string[]; onClose: () => void; onApply: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => { const r = requestAnimationFrame(() => setOpen(true)); return () => cancelAnimationFrame(r); }, []);
  const close = (then?: () => void) => { setLeaving(true); setOpen(false); window.setTimeout(then ?? onClose, 380); };

  const [month, setMonth] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);
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
  const months = useMemo(() => ["All", ...Array.from(new Set(txns.map((t) => MON[t.date.getMonth()])))], [txns]);

  const rows = txns.filter((t) =>
    (month === "All" || MON[t.date.getMonth()] === month) &&
    (!askFilter || askFilter.test(t)),
  );
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

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 70, background: BG_PRIMARY, display: "flex", flexDirection: "column", transform: open ? "none" : "translateY(100%)", transition: `transform 380ms ${EASE}`, pointerEvents: leaving ? "none" : "auto" }}>
      <StatusBar backgroundColor="transparent" />
      <div style={{ height: 64, display: "flex", alignItems: "center", padding: "0 12px", flexShrink: 0 }}>
        <ChromeButton label="Close" onClick={() => close()}><div aria-hidden style={tintedGlyph("/return-exp1/bill-picker/close.svg", EXT_BG_BOLD_REVERSE, 24)} /></ChromeButton>
        {/* a bare X bar: the page head below names the page (user pin
            2026-10-15: "header is not required"); the bar keeps only the
            running count once something is ticked */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {picked.length > 0 && <span style={{ ...typography.bodySmall, color: TEXT_SECONDARY }}>{picked.length} selected · {inr(sum)}</span>}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", scrollbarWidth: "none", display: "flex", flexDirection: "column", paddingBottom: 24 }}>
        {/* the page head says what the page is for (user pin 2026-10-15: "we
            should have a header on this page") — the question, then the two
            ways to answer it */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: `8px ${PAGE_GUTTER}px 16px`, flexShrink: 0 }}>
          <h2 style={{ ...typography.headerH3, color: TEXT_PRIMARY, margin: 0 }}>Which Swiggy transactions move to Travel?</h2>
          <p style={{ ...typography.bodySmall, color: TEXT_SECONDARY, margin: 0 }}>Tick them below, or tell cosimo what they have in common.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: `8px ${PAGE_GUTTER}px`, flexShrink: 0 }}>
          <div style={{ position: "relative", flex: 1, minWidth: 0, height: 48, display: "flex", alignItems: "center", gap: 12, padding: "0 48px 0 12px", border: `2px solid ${OUTLINE_SUBTLE}`, borderRadius: RADIUS_PILL }}>
            <div aria-hidden style={tintedGlyph(ICON.say, EXT_BG_BOLD_REVERSE, 20)} />
            <input value={askDraft} onChange={(e) => { setAskDraft(e.target.value); if (!e.target.value.trim()) setAskFilter(null); }} onKeyDown={(e) => e.key === "Enter" && runAsk()} placeholder="Ask cosimo, e.g. only weekends" aria-label="Describe the transactions to select" enterKeyHint="send" readOnly={asking} style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", padding: 0, ...typography.bodySmall, color: asking ? TEXT_TERTIARY : TEXT_PRIMARY, transition: "color 200ms ease" }} />
            <SendButton show={!!askDraft.trim() && !asking} onClick={runAsk} />
          </div>
          <button type="button" aria-label="Filter by month" aria-expanded={filterOpen} onClick={() => { setFilterOpen((o) => !o); setMonth("All"); }} className="transition-transform active:scale-[0.97]" style={{ width: 48, height: 48, flexShrink: 0, borderRadius: "50%", border: `2px solid ${OUTLINE_SUBTLE}`, background: filterOpen ? BTN_BG_GREY_DEFAULT : "transparent", display: "grid", placeItems: "center", padding: 0, cursor: "pointer" }}>
            <div aria-hidden style={tintedGlyph("/return-exp1/bill-picker/filter.svg", EXT_BG_BOLD_REVERSE, 20)} />
          </button>
        </div>
        {filterOpen && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", padding: `0 ${PAGE_GUTTER}px 8px`, flexShrink: 0 }}>
            {months.map((m) => {
              const on = m === month;
              return <button key={m} type="button" onClick={() => setMonth(m)} className="transition-transform active:scale-[0.97]" style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 100, cursor: "pointer", border: `1px solid ${on ? "transparent" : OUTLINE_SUBTLE}`, background: on ? BTN_BG_GREY_DEFAULT : "transparent", ...typography.buttonSmall, color: on ? TEXT_PRIMARY : TEXT_SECONDARY }}>{m}</button>;
            })}
          </div>
        )}
        {/* the model's turn, then its answer, over the rows it narrowed to */}
        {/* the rows step out while the model works: the proto's spinner ring
            (OnboardingSim's) over "Finding them", centred in the list's place */}
        {asking && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "64px 0" }}>
            <div aria-hidden className="animate-spin" style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${OUTLINE_SUBTLE}`, borderTopColor: MAIN_PRIMARY }} />
            <span role="status" style={{ ...typography.bodySmall, color: TEXT_SECONDARY }}>Finding them</span>
          </div>
        )}
        {!asking && rows.length === 0 && <p style={{ ...typography.bodySmall, color: TEXT_TERTIARY, margin: 0, padding: `24px ${PAGE_GUTTER}px` }}>Nothing matches that. Clear the bar to see every row, or ask another way.</p>}
        {!asking && rows.map((t) => {
          const on = picked.includes(t.id);
          return (
            <div key={t.id} role="checkbox" aria-checked={on} tabIndex={0} aria-label={`${t.note} ${inr(t.amount)}`} onClick={() => toggle(t.id)} onKeyDown={(e) => e.key === "Enter" && toggle(t.id)} className="transition-transform active:scale-[0.99]" style={{ display: "flex", alignItems: "center", gap: 12, padding: `16px ${PAGE_GUTTER}px`, cursor: "pointer", background: on ? EXT_BG_SUBTLE_MAIN : "transparent", transition: "background 160ms ease" }}>
              <Avatar t={t} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.note}</span>
                <span style={{ ...typography.caption, color: TEXT_SECONDARY, whiteSpace: "nowrap" }}>{fmtDay(t.date)} · {t.cat}</span>
              </div>
              <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, whiteSpace: "nowrap" }}>{inr(t.amount)}</span>
            </div>
          );
        })}
      </div>
      {picked.length > 0 && (
        <div style={{ flexShrink: 0, padding: `16px ${PAGE_GUTTER}px`, background: BG_PRIMARY, boxShadow: "0px -6px 8px 0px rgba(0,0,0,0.05)" }}>
          <button type="button" onClick={() => close(() => onApply(picked))} className="transition-transform active:scale-[0.98]" style={{ width: "100%", height: 48, border: "none", borderRadius: RADIUS_PILL, background: BTN_BG_PRIMARY_DEFAULT, color: TEXT_ON_COLOR_PRIMARY, ...typography.buttonNormal, cursor: "pointer" }}>
            Mark {picked.length} as Travel
          </button>
        </div>
      )}
      <GestureNav backgroundColor={BG_PRIMARY} />
    </div>
  );
}
