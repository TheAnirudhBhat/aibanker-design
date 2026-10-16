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
import { useIsMobileProto } from "@/app/hooks/useProtoMobile";
import { useTheme } from "@/app/lib/theme";
import { RADIUS_L, RADIUS_M } from "@/app/lib/radii";
import {
  BG_PRIMARY,
  BG_SHEET,
  DECOR_BOLD_BLUE,
  DECOR_BOLD_ORANGE,
  DECOR_BOLD_RED,
  DECOR_BOLD_SLATE,
  DECOR_SUBTLE_BLUE,
  DECOR_SUBTLE_ORANGE,
  DECOR_SUBTLE_RED,
  DECOR_SUBTLE_SLATE,
  BTN_BG_PRIMARY_DEFAULT,
  CHAT_USER_BUBBLE,
  EXT_BG_BOLD_REVERSE,
  EXT_BG_SUBTLE_MAIN,
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
/** The 64 app bar. On a phone the in-app status bar is hidden and the page
    runs under the notch, so the bar carries the real top inset (as v2's
    ChatAppBar does; user pin 2026-10-16: "in mobile version this part is
    not visible"). 0 in a desktop tab. */
/** The trim over the picker's bar: one comet, a capsule faded at both ends,
    carried round the pill's outline by SVG motion (animateMotion on the
    outline's path, rotate auto — the one lap technique that has moved in
    every browser here; the CSS motion path and the dash offset keyframes
    both stood still for the user, 2026-10-16), at one pace, linear, once;
    the bar scales up a touch while it runs, for prominence. */
const TRIM_LAP_MS = 4000;
const TRIM_DELAY_MS = 600;
const COMET_LEN = 56;
function TrimRing({ scaleTarget }: { /** the bar, which gives the path its size and takes the subtle scale */ scaleTarget: React.RefObject<HTMLDivElement | null> }) {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    // a passive effect: the parent's ref is attached by now (a layout effect
    // in the child ran before it, and read null — the comet stood still)
    const el = svg.current, bar = scaleTarget.current;
    if (!el || !bar) return;
    // the pill's outline as a path, from the bar's own box, onto the motion;
    // SMIL's clock is the document's, so the lap begins from now, not from
    // a time long past
    const w = bar.offsetWidth, h = bar.offsetHeight, r = h / 2;
    el.setAttribute("viewBox", `0 0 ${w} ${h}`);
    el.setAttribute("width", `${w}`);
    el.setAttribute("height", `${h}`);
    const motion = el.querySelector("animateMotion") as SVGAnimateMotionElement | null;
    motion?.setAttribute("path", `M ${r} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`);
    motion?.beginElementAt(TRIM_DELAY_MS / 1000);
    const anims = [
      el.animate([{ opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 1, offset: 0.88 }, { opacity: 0 }], { duration: TRIM_LAP_MS, delay: TRIM_DELAY_MS, easing: "linear", fill: "both" }),
      bar.animate([{ transform: "scale(1)" }, { transform: "scale(1.02)", offset: 0.12 }, { transform: "scale(1.02)", offset: 0.85 }, { transform: "scale(1)" }], { duration: TRIM_LAP_MS, delay: TRIM_DELAY_MS, easing: "linear", fill: "both" }),
    ];
    return () => anims.forEach((a) => a.cancel());
  }, [scaleTarget]);
  return (
    <svg ref={svg} aria-hidden style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", zIndex: 1, opacity: 0, filter: "drop-shadow(0 0 4px rgba(211, 10, 215, 0.4))" }}>
      <defs>
        <linearGradient id="recat-comet" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#D30AD7" stopOpacity="0" />
          <stop offset="0.5" stopColor="#D30AD7" stopOpacity="1" />
          <stop offset="1" stopColor="#D30AD7" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* the capsule is centred on the origin, so the motion carries its middle along the outline */}
      <rect x={-COMET_LEN / 2} y={-1} width={COMET_LEN} height={2} rx={1} fill="url(#recat-comet)">
        <animateMotion dur={`${TRIM_LAP_MS}ms`} begin="indefinite" rotate="auto" calcMode="linear" fill="freeze" />
      </rect>
    </svg>
  );
}
const BAR: React.CSSProperties = { height: "calc(64px + env(safe-area-inset-top))", paddingTop: "env(safe-area-inset-top)", display: "flex", alignItems: "center", paddingLeft: 12, paddingRight: 12, flexShrink: 0, boxSizing: "border-box" };
const MESSAGE_BOX: React.CSSProperties = {
  position: "relative",
  height: 57,
  borderRadius: 100,
  border: `1px solid ${OUTLINE_SUBTLE}`,
  background: "var(--re1-ask-bar-bg, color-mix(in srgb, var(--dls-bg-primary) 60%, transparent))",
  // no backdrop blur: the box sits in flow over the page colour, so a blur
  // here would gaussian the plain ground every frame for nothing (the v2
  // chat's lesson — blurred px per frame is what a phone pays)
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
type Tone = "orange" | "blue" | "red" | "slate";
/** the DLS subtle avatar: the tone's subtle ground under its bold initial, both themed (canon 1967:18268, the dark Activity L0: #2e1700 under #ff9f3d by night) */
const TONES: Record<Tone, [ground: string, ink: string]> = {
  orange: [DECOR_SUBTLE_ORANGE, DECOR_BOLD_ORANGE],
  blue: [DECOR_SUBTLE_BLUE, DECOR_BOLD_BLUE],
  red: [DECOR_SUBTLE_RED, DECOR_BOLD_RED],
  slate: [DECOR_SUBTLE_SLATE, DECOR_BOLD_SLATE],
};
type Txn = { id: string; merchant: string; note: string; amount: number; date: Date; cat: Cat; logo?: string; tint: string; /** the avatar's DLS tone, for a row without a logo */ tone?: Tone };

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
  { id: "t-amazon", merchant: "Amazon", note: "Card", amount: 1600, date: new Date(2026, 9, 3), cat: "Shopping", tint: "#FF9900", tone: "orange" },
  SWIGGY_TXNS[0],
  { id: "t-uber", merchant: "Uber", note: "UPI", amount: 1300, date: new Date(2026, 9, 6), cat: "Travel", tint: "#78808B", tone: "slate" },
  { id: "t-social", merchant: "Social", note: "Card", amount: 1250, date: new Date(2026, 9, 2), cat: "Food & drinks", tint: "#E23744", logo: "social" },
  { id: "t-myntra", merchant: "Myntra", note: "UPI", amount: 1100, date: new Date(2026, 9, 1), cat: "Shopping", tint: "#FF3F6C", tone: "red" },
  { id: "t-irctc", merchant: "IRCTC", note: "Card", amount: 1000, date: new Date(2026, 9, 2), cat: "Travel", tint: "#2E90FF", tone: "blue" },
  { id: "t-kfc", merchant: "KFC", note: "UPI", amount: 980, date: new Date(2026, 9, 1), cat: "Food & drinks", tint: "#F8CB46", logo: "kfc" },
  SWIGGY_TXNS[1],
  { id: "t-dominos", merchant: "Dominos", note: "slice UPI", amount: 700, date: new Date(2026, 9, 1), cat: "Food & drinks", tint: "#0078AE", logo: "dominos" },
  { id: "t-netflix", merchant: "Netflix", note: "Card", amount: 649, date: new Date(2026, 9, 12), cat: "Entertainment", tint: "#E23744", tone: "red" },
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
  const range = s.match(/between\s*₹?\s*(\d[\d,]*)\s*(?:and|to|-)\s*₹?\s*(\d[\d,]*)/);
  const num = range ? null : s.match(/(?:above|over|more than|under|below|less than)?\s*₹?\s*(\d[\d,]*)/);
  if (range) {
    const lo = Number(range[1].replace(/,/g, "")), hi = Number(range[2].replace(/,/g, ""));
    tests.push((t) => t.amount >= lo && t.amount <= hi);
    labels.push(`between ${inr(lo)} and ${inr(hi)}`);
  }
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
type Row = { icon: string; label: string; act: string; /** "pick": the rows the list opens on, ticked (a found set) */ ids?: string[] };
/** The card that docks over the input (the onboarding's, 2856:80059): one
    question, its answers as radios, and what the bar invites meanwhile. */
type Dock = { title: string; placeholder: string; /** Dock: the rows to tick sit in the card, with the tick that applies (user pin 2026-10-15) */ list?: true; /** Dock: the categories to pick from sit in the card (user pin 2026-10-16: the chooser shows in the bar on its own) */ cats?: true };
const GENTLE = "cubic-bezier(0.16, 1, 0.3, 1)";
const DOCK_RISE_MS = 420;
const DOCK_SINK_MS = 260;
type Turn = { id: number; role: "user" | "cosimo"; text: string; rows?: Row[]; list?: Txn[]; moved?: Set<string>; /** where the list's "+N more" row leads */ more?: "full" | "picker";  /** a line after the card */ after?: string; /** the card that docks over the input once this line has typed (Pick → Dock) */ dock?: Dock };
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
const DESCRIBE_HINT = "Filter with cosimo";

export default function RecatSim({ pickMode }: { /** the Pick switch, when the host doesn't read the flag */ pickMode?: "page" | "docklist" }) {
  const [flag] = useProtoFlag("recatPick");
  const mode = pickMode ?? (flag === "dock" ? "docklist" : "page");

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
  const [picker, setPicker] = useState<{ preselected: string[]; /** a found set opens the list on its own rows alone (user pin 2026-10-16) */ only?: string[];  } | null>(null);
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

  const say = (t: Omit<Turn, "id" | "role">, ms = THINK_MS) => {
    setThinking(true);
    window.setTimeout(() => {
      setThinking(false);
      setTurns((prev) => [...prev, { id: nextId.current++, role: "cosimo", ...t }]);
    }, ms);
  };
  const user = (text: string) => setTurns((prev) => [...prev, { id: nextId.current++, role: "user", text }]);

  const apply = (ids: string[], to = target) => {
    setTarget(to);
    const next = new Set(moved);
    ids.forEach((id) => next.add(id));
    setMoved(next);
    setPhase("done");
    const n = ids.length;
    const sum = SWIGGY_TXNS.filter((t) => ids.includes(t.id)).reduce((s, t) => s + t.amount, 0);
    say({
      text: `Updated ${n} Swiggy transaction${n > 1 ? "s" : ""} to ${to}, ${inr(sum)} in all.`,
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
    } else {
      // a typed "no" or "some" after the review: the way into the list again,
      // as a suggested action, and how else to narrow it
      say({
        text: "All right, which ones do we update?",
        after: "You can also filter by asking. For example, \"only the weekend ones\" or \"between ₹400 and ₹500\".",
        rows: [{ icon: ICON.list, label: `Select from ${SWIGGY_TXNS.length - moved.size} transactions`, act: "pick" }],
      });
    }
  };

  /** A category picked, on the page or in the dock: it is the user's message
      (user pin 2026-10-16), and it goes where it was for. */
  const pickCat = (name: string) => {
    setCatPage(false);
    sinkDock();
    setDraft("");
    user(name);
    confirmMove(name);
  };

  /** "I found 44 …" with every way to review the selection in one step (user
      pin 2026-10-16: "skip this step, directly show a combination of this and
      the I'll select screen"): the card into the list (or the docked list),
      how to filter, and the row that takes them all. From a typed line or the
      category page. */
  const confirmMove = (to: string) => {
    setTarget(to);
    setPhase("confirm");
    const n = SWIGGY_TXNS.length - moved.size;
    // the flow, both modes (user 2026-10-16): "I found 44 transactions
    // matching Swiggy. Do you want to update all of them?" — Update all, or
    // I'll select manually (the list page, or the docked list)
    say({
      text: `I found ${n} transactions matching Swiggy. Do you want to update all of them to ${to}?`,
      rows: [
        { icon: ICON.yes, label: "Update all", act: "all" },
        { icon: ICON.list, label: "I'll select manually", act: "manual" },
      ],
    });
  };

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    // an edit typed under the list card changes the card alone: nothing lands
    // in the thread, and the words stay in the bar (user pin 2026-10-16:
    // "this should not update here, only in the main bottom box, any edit entry")
    if (dock?.cats) {
      const m = CATEGORIES.find((c) => c.name.toLowerCase().includes(text.toLowerCase()));
      if (m) pickCat(m.name);
      return;
    }
    if (mode === "docklist" && dock?.list) {
      // the box goes blank once the filter is sent (user pin 2026-10-16)
      setDraft("");
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
          { icon: ICON.travel, label: "Mark all Swiggy transactions as Munchies", act: "move-odd" },
        ],
      });
      return;
    }
    // a category named in the line, by its name or its first word
    const named = CATEGORIES.find((c) => s.includes(c.name.toLowerCase()) || s.includes(c.name.toLowerCase().split(" ")[0]));
    if (/swiggy/.test(s) && named) { confirmMove(named.name); return; }
    if (/swiggy/.test(s) && /categor|mark|move|file/.test(s)) {
      // a category cosimo doesn't have, or none named: the card into the page
      const odd = s.match(/(?:as|to|under)\s+([a-z][a-z& -]*?)\s*[.!?]?$/)?.[1];
      const shown = odd ? odd.charAt(0).toUpperCase() + odd.slice(1) : null;
      // the way into the category page is a suggested action (user pin
      // 2026-10-16: "rather than this we should have a suggested action UI
      // here, and clicking on it should open the bottom sheet")
      // the flow, both modes (user 2026-10-16): "Which category do you want
      // me to update them to?", with Select a category as the suggested option
      const text = shown ? `I don't have a category called ${shown}. Which category do you want me to update them to?` : "Which category do you want me to update them to?";
      // Dock docks the chooser on its own (user pin 2026-10-16: "in the dock
      // variant this is not required, it should directly open the bottom bar")
      if (mode === "docklist") say({ text, dock: { title: "", placeholder: "Search categories", cats: true } });
      else say({ text, rows: [{ icon: ICON.update, label: "Select a category", act: "choose-cat" }] });
      return;
    }
    if (phase === "confirm") {
      if (/^(yes|yeah|yep|ya|sure|ok|all|do it)/.test(s)) { apply(SWIGGY_TXNS.map((t) => t.id)); return; }
      if (/^(no|nope|not all|some|only|let me|i'?ll|i will)|select|choose|pick|manual/.test(s)) { onRow({ icon: "", label: "I'll select manually", act: "manual-typed" }); return; }
    }
    if (phase === "described") {
      if (/^(yes|yeah|yep|ya|sure|ok|do it|those|these)/.test(s)) { apply(found.map((t) => t.id)); return; }
      if (/list|show|see/.test(s)) { setPicker({ preselected: found.map((t) => t.id) }); return; }
    }
    if (phase === "which" || phase === "described") {
      const f = parseFilter(text);
      // every filter with cosimo takes ASK_MS, here as everywhere
      if (!f) { say({ text: "I couldn't read that one. Try an amount, a day of the week, or a month." }, ASK_MS); return; }
      const hits = SWIGGY_TXNS.filter((t) => !moved.has(t.id) && f.test(t));
      if (!hits.length) { say({ text: `Nothing ${f.label}. Try another amount, day or month.` }, ASK_MS); return; }
      setFound(hits);
      setPhase("described");
      const sum = hits.reduce((a, t) => a + t.amount, 0);
      const n = hits.length;
      // the found set opens the list on its own rows, ticked — as a suggested
      // action (user pin 2026-10-16)
      say({
        text: `That's ${n} Swiggy transaction${n > 1 ? "s" : ""} ${f.label}, ${inr(sum)} in all. Mark those as ${target}?`,
        rows: [{ icon: ICON.list, label: `Select from ${n} transactions`, act: "pick", ids: hits.map((t) => t.id) }],
      }, ASK_MS);
      return;
    }
    say({ text: "I don't have that one to hand. Ask me about this month's transactions, or tell me a category to fix." });
  };

  const onRow = (r: Row) => {
    if (r.act !== "pick" && r.act !== "pick-found") sinkDock();
    // a tapped suggestion becomes the user's message, and its rows leave with
    // the turn, so it cannot be tapped again later (user pin 2026-10-16); the
    // acts that go through send() write the line there, a typed one has it
    // "I'll select manually" and "Select a category" open a sheet and stay
    // rows until the selection lands, which is then the message (user pin
    // 2026-10-16); the rest become the message at the tap
    if (!["top", "move", "move-odd", "update-cat", "manual-typed", "manual", "choose-cat", "new"].includes(r.act)) user(r.label);
    switch (r.act) {
      case "top": send(ASK_TOP); break;
      case "move": send(ASK_MOVE); break;
      // a suggestion never opens a sheet itself (user pin 2026-10-16): it is
      // the user's line, and cosimo answers with the card into the page
      case "update-cat": send(r.label); break;
      case "choose-cat":
        if (mode === "docklist") setDock({ title: "", placeholder: "Search categories", cats: true });
        else setCatPage(true);
        break;
      case "manual-typed":
      case "manual":
        setPhase("which");
        if (mode === "docklist") setDock({ title: "Select transactions", placeholder: DESCRIBE_HINT, list: true });
        else setPicker({ preselected: [] });
        break;
      case "pick": setPicker({ preselected: r.ids ?? [], only: r.ids }); break;
      case "move-odd": send("Mark all Swiggy transactions as Munchies"); break;
      case "all": apply(SWIGGY_TXNS.map((t) => t.id)); break;
      case "some": askWhich(); break;
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
      <div style={BAR}>
        <ChromeButton label="Close chat"><div aria-hidden style={{ ...tintedGlyph("/icons/chevron-left.svg", EXT_BG_BOLD_REVERSE, 24), transform: "rotate(-90deg)" }} /></ChromeButton>
        <div style={{ flex: 1 }} />
        {/* the reload glyph restarts the flow (user pin 2026-10-16: "this should reload the flow") */}
        <ChromeButton label="Restart the flow" onClick={() => { sinkDock(); setPicker(null); setFullList(null); setCatPage(false); setTarget("Travel"); onRow({ icon: "", label: "", act: "new" }); }}><div aria-hidden style={tintedGlyph("/icons/reload.svg", EXT_BG_BOLD_REVERSE, 22)} /></ChromeButton>
        <ChromeButton label="New chat" onClick={() => { sinkDock(); onRow({ icon: "", label: "", act: "new" }); }}><div aria-hidden style={tintedGlyph("/icons/add.svg", EXT_BG_BOLD_REVERSE, 22)} /></ChromeButton>
      </div>

      <div style={{ position: "relative", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div ref={threadRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", scrollbarWidth: "none", overflowAnchor: "none", overscrollBehaviorY: "contain", padding: `8px ${PAGE_GUTTER}px ${28 + (dock || dockLeaving ? dockH + 16 : 0)}px`, display: "flex", flexDirection: "column" }}>
      <div ref={contentRef} style={{ display: "flex", flexDirection: "column", gap: 14, flexShrink: 0 }}>
        {turns.length === 0 && (
          <div className="animate-chat-message-in" style={{ display: "flex", flexDirection: "column", gap: THREAD_GAP }}>
            <p style={{ ...typography.bodySmall, lineHeight: "22px", color: TEXT_PRIMARY, margin: 0 }}>Ask me anything about your money.</p>
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
            <div key={t.id} ref={t.id === parkId ? parkElRef : undefined} style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: THREAD_GAP }}>
              {/* the line types; what hangs under it comes up in one sweep once it has (v2) */}
              <CosimoLine
                text={t.text}
                active={t === last && !doneIds.has(t.id)}
                onDone={() => {
                  setDoneIds((d) => new Set(d).add(t.id));
                  if (t.dock) window.setTimeout(() => setDock(t.dock!), 120);
                }}
              />
              {doneIds.has(t.id) && (t.after || t.list || (t.rows && t === last)) && (
                <ChatReveal>
                  <div style={{ display: "flex", flexDirection: "column", gap: THREAD_GAP }}>
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
            cats={{ query: draft, onPick: pickCat }}
            list={{
              rows: SWIGGY_TXNS.filter((t) => !moved.has(t.id) && (!dockFilter || dockFilter.test(t))),
              picked: dockPicked,
              asking: dockAsking,
              target,
              onToggle: (id) => setDockPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])),
              onAll: (ids) => setDockPicked(ids),
              onApply: () => { const ids = dockPicked; sinkDock(); user(`${ids.length} transaction${ids.length === 1 ? "" : "s"} selected`); apply(ids); },
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
          onPick={pickCat}
        />
      )}
      {picker && (
        <Picker
          preselected={picker.preselected}
          txns={SWIGGY_TXNS.filter((t) => !moved.has(t.id) && (!picker.only || picker.only.includes(t.id)))}
          onClose={() => setPicker(null)}
          target={target}
          onApply={(ids) => {
            setPicker(null);
            sinkDock();
            // the selection is the message (user pin 2026-10-16)
            user(`${ids.length} transaction${ids.length === 1 ? "" : "s"} selected`);
            apply(ids);
          }}
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

/** Hairline option rows, the canon's own shape (2371:107551): a glyph, the
    label, a hairline from the label's edge. They sit ROWS_GAP (28) under the
    line they answer, v2's SetupRows rhythm: every host lays them after the
    thread's own 16 gap, and the rows carry the remaining 12 themselves, so no
    host can seat them tighter (user pin 2026-10-16: "the spacing between the
    message and the suggested action is too low, make sure this doesn't happen
    again"). */
const ROWS_GAP = 28;
const THREAD_GAP = 16;
function OptionRows({ rows, onPick, live }: { rows: Row[]; onPick: (r: Row) => void; live: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: ROWS_GAP - THREAD_GAP }}>
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

/** How a ticked row reads (Selected switch, user pin 2026-10-16: "have a
    couple of options for the selected state"): the avatar ticks on every
    take; Ink also colours the name and amount, Wash lays the canon's subtle
    brand wash under the row, Avatar leaves the text alone. */
function useSelectedTake() {
  const [take] = useProtoFlag("recatSelected");
  return { ink: take === "ink", wash: take === "wash", subtle: take === "subtle" };
}

function Avatar({ t, size = 40, on = false }: { t: Txn; size?: number; /** ticked: the avatar goes Valentino under a tick (user pin 2026-10-15) */ on?: boolean }) {
  const [tick] = useProtoFlag("recatTick");
  const { subtle } = useSelectedTake();
  // at rest, a row without a logo wears the DLS subtle avatar: its tone's
  // subtle ground under its bold initial, themed (user 2026-10-16: "in dark
  // mode the subtle avatars should look like this", canon 1967:18268)
  const [ground, ink] = t.tone ? TONES[t.tone] : [t.tint, TEXT_ON_COLOR_PRIMARY];
  // ticked: Valentino under a white tick, or on the Subtle take the brand wash under a Valentino tick
  const onGround = subtle ? "var(--dls-main-primary-subtle)" : VALENTINO_500;
  const tickInk = subtle ? VALENTINO_500 : TEXT_ON_COLOR_PRIMARY;
  return (
    <div aria-hidden style={{ position: "relative", width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: `1px solid ${on && !subtle ? "transparent" : OUTLINE_SUBTLE}`, display: "grid", placeItems: "center", background: on ? onGround : t.logo ? BG_PRIMARY : ground, transition: "background 200ms ease, border-color 200ms ease" }}>
      <div style={{ display: "grid", placeItems: "center", opacity: on ? 0 : 1, transform: on ? "scale(0.6)" : "none", transition: `opacity 160ms ease, transform 200ms ${EASE}` }}>
        {t.logo
          ? <img src={`/return-exp1/merchants/${t.logo}.png`} alt="" width={size} height={size} draggable={false} style={{ display: "block", objectFit: "cover" }} />
          : <span style={{ ...typography.headerH4, color: ink }}>{t.merchant.charAt(0)}</span>}
      </div>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", opacity: on ? 1 : 0, transform: on ? "none" : "scale(0.6)", transition: `opacity 160ms ease, transform 240ms ${EASE}` }}>
        {tick === "rounded"
          ? <div style={tintedGlyph("/return-exp1/tick-rounded.svg", tickInk, 18)} />
          : tick === "double"
            ? <div style={{ transform: "scale(0.75)" }}><DoubleTick color={tickInk} dim={false} /></div>
            : <div style={{ ...tintedGlyph("/chat/tick-magenta.svg", tickInk, 12), width: 13, height: 10 }} />}
      </div>
    </div>
  );
}

/** A category's avatar: the bold Valentino disc under a white glyph by day
    (user pin 2026-10-16: "use bold avatar"), and by night the DLS subtle
    avatar, the brand's subtle ground under a Valentino glyph, as the dark
    Activity L0 draws its tinted discs (canon 1967:18268). */
function CategoryAvatar({ icon }: { icon: string }) {
  const { mode } = useTheme();
  const dark = mode === "dark";
  return (
    <div aria-hidden style={{ width: 40, height: 40, borderRadius: "50%", background: dark ? "var(--dls-main-primary-subtle)" : VALENTINO_500, border: dark ? `1px solid ${OUTLINE_SUBTLE}` : "none", display: "grid", placeItems: "center", flexShrink: 0 }}>
      <div style={tintedGlyph(icon, dark ? VALENTINO_500 : TEXT_ON_COLOR_PRIMARY, 16)} />
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
        // a moved row just reads its new category, no highlight (user pin 2026-10-16)
        const cat: Cat = moved.has(t.id) ? target : t.cat;
        return (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: `12px ${PAGE_GUTTER}px` }}>
            <Avatar t={t} />
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.merchant}</span>
                <span style={{ ...typography.bodyNormal, color: TEXT_PRIMARY, whiteSpace: "nowrap" }}>{inr(t.amount)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, ...typography.caption, color: TEXT_SECONDARY }}>
                <div aria-hidden style={tintedGlyph(CAT_ICON[cat], TEXT_SECONDARY, 12)} />
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
type DockCats = { query: string; onPick: (name: string) => void };
function DockCard({ dock, leaving, list, cats }: { dock: Dock; leaving: boolean; list: DockList; cats: DockCats }) {
  const sel = useSelectedTake();
  // the card floats over the thread: it keeps its frost on desktop and goes
  // opaque on a phone, where a 24px backdrop blur is the frame's cost (v2, ab8460c)
  const isMobile = useIsMobileProto();
  const sum = list.rows.filter((t) => list.picked.includes(t.id)).reduce((a, t) => a + t.amount, 0);
  // the count line keeps its last words while it closes
  const [[held, heldSum], setHeld] = useState<[number, number]>([0, 0]);
  if (list.picked.length && (held !== list.picked.length || heldSum !== sum)) setHeld([list.picked.length, sum]);
  return (
    <div style={{ transformOrigin: "50% 100%", animation: leaving ? `re1DockSink ${DOCK_SINK_MS}ms cubic-bezier(0.4, 0, 1, 1) both` : `re1DockRise ${DOCK_RISE_MS}ms ${GENTLE} both`, background: isMobile ? BG_SHEET : "var(--re1-ask-bar-bg, var(--dls-bg-card))", border: `1px solid ${OUTLINE_SUBTLE}`, backdropFilter: isMobile ? undefined : "var(--re1-glass-filter, blur(24px))", WebkitBackdropFilter: isMobile ? undefined : "var(--re1-glass-filter, blur(24px))", borderRadius: RADIUS_L, willChange: leaving ? "transform, opacity" : undefined, boxShadow: "var(--re1-glass-shine), var(--re1-glass-shadow)", padding: 24, display: "flex", flexDirection: "column", gap: dock.cats ? 16 : 24, overflow: "hidden" }}>
      {dock.title && <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
          <span style={{ ...typography.headerH2, color: TEXT_PRIMARY }}>{dock.title}</span>
          {/* the count takes the slot under the title once something is
              ticked, opening and closing on a curve rather than popping (user
              pin 2026-10-16: "appearing and disappearing of this should be
              smooth and fluid"); it keeps its last words while it closes */}
          {/* while cosimo filters, the slot says so (user pin 2026-10-16: "on
              filter, in the dock, we should have a loader with a UX copy, filtering") */}
          <div style={{ display: "grid", gridTemplateRows: dock.list && list.picked.length ? "1fr" : "0fr", opacity: dock.list && list.picked.length ? 1 : 0, transition: `grid-template-rows 240ms ${GENTLE}, opacity 200ms ease` }}>
            <span style={{ ...typography.bodySmall, color: TEXT_SECONDARY, overflow: "hidden", minHeight: 0 }}>{held} selected · {inr(heldSum)}</span>
          </div>
        </div>
        {/* top right: the double tick selects all while nothing is ticked;
            with a tick on, the slot is the confirm, a Valentino disc under
            one tick (user pin 2026-10-15: "the CTA should be on the top right
            where the select all is, make that just a tick, no CTA at the bottom") */}
        {/* one tick, always (user pin 2026-10-16: "this should just be a tick,
            we don't need the select all here"): the DLS line tick, waiting
            dim until something is ticked, then Valentino and live */}
        {dock.list && (
          <button type="button" aria-label={list.picked.length ? `Mark ${list.picked.length} as ${list.target}` : "Nothing selected yet"} onClick={list.onApply} disabled={leaving || list.picked.length === 0} className="transition-transform active:scale-[0.94]" style={{ width: 40, height: 40, margin: "-8px -8px 0 0", display: "grid", placeItems: "center", border: "none", background: "transparent", padding: 0, cursor: list.picked.length ? "pointer" : "default", flexShrink: 0 }}>
            <div aria-hidden style={{ ...tintedGlyph("/return-exp1/tick-rounded.svg", list.picked.length ? VALENTINO_500 : EXT_BG_BOLD_REVERSE, 26), opacity: list.picked.length ? 1 : 0.4, transition: "background-color 200ms ease, opacity 200ms ease" }} />
          </button>
        )}
      </div>}
      {dock.title && <div aria-hidden style={{ height: 1, background: OUTLINE_BOLD }} />}
      {dock.cats && (() => {
        const q = cats.query.trim().toLowerCase();
        const rows = CATEGORIES.filter((c) => c.name.toLowerCase().includes(q));
        // the rows start 12 under the rule (user pin 2026-10-16: "the spacing
        // below this is too much"); each category wears its glyph in
        // Valentino on the brand wash, so the avatar reads ("the avatars are
        // not visible at all"), with an inset hairline between rows
        return (
          <div style={{ maxHeight: 264, overflowY: "auto", scrollbarWidth: "none", margin: dock.title ? "-12px 0 -8px" : "-10px 0 -8px", display: "flex", flexDirection: "column" }}>
            {rows.length === 0 && <p style={{ ...typography.bodySmall, color: TEXT_TERTIARY, margin: 0, padding: "20px 0" }}>No category by that name.</p>}
            {rows.map((c, i) => (
              <div key={c.name} role="button" tabIndex={leaving ? -1 : 0} onClick={() => cats.onPick(c.name)} onKeyDown={(e) => e.key === "Enter" && cats.onPick(c.name)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", cursor: "pointer", borderTop: i ? `1px solid ${OUTLINE_SUBTLE}` : "none", borderImage: i ? `linear-gradient(to right, transparent 52px, ${OUTLINE_SUBTLE} 52px) 1` : undefined }}>
                <CategoryAvatar icon={c.icon} />
                <span style={{ ...typography.bodySmall, color: TEXT_PRIMARY, flex: 1, minWidth: 0 }}>{c.name}</span>
              </div>
            ))}
          </div>
        );
      })()}
      {dock.list && (
        <>
          {/* the rows to tick, as many as fit in the card's window; the rest scroll */}
          <div style={{ maxHeight: 264, overflowY: "auto", scrollbarWidth: "none", margin: "-12px 0", display: "flex", flexDirection: "column" }}>
            {list.asking ? (
              // user pin 2026-10-16: "in the list portion, in the centre, saying
              // filtering transactions with a circular loader"
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 0" }}>
                <div aria-hidden className="animate-spin" style={{ width: 28, height: 28, borderRadius: "50%", border: `3px solid ${OUTLINE_SUBTLE}`, borderTopColor: VALENTINO_500 }} />
                <span role="status" style={{ ...typography.bodySmall, color: TEXT_SECONDARY }}>Filtering transactions</span>
              </div>
            ) : list.rows.length === 0 ? (
              <p style={{ ...typography.bodySmall, color: TEXT_TERTIARY, margin: 0, padding: "20px 0" }}>Nothing matches that. Clear the bar to see every row.</p>
            ) : list.rows.map((t) => {
              const on = list.picked.includes(t.id);
              return (
                <div key={t.id} role="checkbox" aria-checked={on} tabIndex={leaving ? -1 : 0} aria-label={`${t.note} ${inr(t.amount)}`} onClick={() => list.onToggle(t.id)} onKeyDown={(e) => e.key === "Enter" && list.onToggle(t.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", margin: "0 -12px", borderRadius: 12, cursor: "pointer", background: on && sel.wash ? EXT_BG_SUBTLE_MAIN : "transparent", transition: "background 160ms ease" }}>
                  <Avatar t={t} on={on} />
                  {/* a ticked row's name and amount take the brand ink (user pin
                      2026-10-16); the amount sits on the name's line, not the
                      row's middle (user pin 2026-10-16, as the canon row) */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ ...typography.bodySmall, color: on && sel.ink ? VALENTINO_500 : TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 200ms ease" }}>{t.note}</span>
                      <span style={{ ...typography.bodySmall, color: on && sel.ink ? VALENTINO_500 : TEXT_PRIMARY, whiteSpace: "nowrap", transition: "color 200ms ease" }}>{inr(t.amount)}</span>
                    </div>
                    <span style={{ ...typography.caption, color: TEXT_SECONDARY, whiteSpace: "nowrap" }}>{fmtDay(t.date)}</span>
                  </div>
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
        <div style={BAR}>
          <ChromeButton label="Close" onClick={() => close()}><div aria-hidden style={tintedGlyph("/return-exp1/bill-picker/close.svg", EXT_BG_BOLD_REVERSE, 24)} /></ChromeButton>
          {/* one title (user pin 2026-10-16: "this should be a single title, select category") */}
          <h2 style={{ ...typography.headerH3, color: TEXT_PRIMARY, margin: 0, flex: 1, minWidth: 0 }}>Select category</h2>
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
                <CategoryAvatar icon={c.icon} />
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

/** Placeholder rows that shimmer: the avatar's disc, a name, a date, an
    amount, each a bar of the subtle outline with the brand wash sweeping
    through (the proto's planBuilderShimmer sweep, on themed tokens so it
    reads by night too). */
const SHIMMER: React.CSSProperties = { position: "relative", overflow: "hidden", background: OUTLINE_SUBTLE };
/** The sweep is one child per bar riding a transform (compositor only), not
    a background position repainted on thirty bars every frame. */
const Sweep = () => <div aria-hidden style={{ position: "absolute", inset: 0, width: "200%", background: "linear-gradient(90deg, transparent 0%, var(--dls-main-primary-subtle) 50%, transparent 100%)", animation: "recatSweep 1.8s ease-in-out infinite", willChange: "transform" }} />;
function ShimmerRows({ n, padding }: { n: number; padding: string }) {
  const bar = (w: number | string, h: number) => <div style={{ ...SHIMMER, width: w, height: h, borderRadius: h / 2 }}><Sweep /></div>;
  return (
    <div role="status" aria-label="Finding them" style={{ display: "flex", flexDirection: "column" }}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding }}>
          <div style={{ ...SHIMMER, width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }}><Sweep /></div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              {bar(i % 2 ? 96 : 72, 14)}
              {bar(52, 14)}
            </div>
            {bar(64, 10)}
          </div>
        </div>
      ))}
    </div>
  );
}

/** The chat's foot scrim, as v2 draws it: the thread fades into the page
    colour just above the message box instead of clipping on it (user pin
    2026-10-15: "same smooth gradient fade BG like we have in chat"). */
function FootFade({ reach = 0 }: { /** how far past its box the fade reaches, towards the bar */ reach?: number }) {
  // 28 tall, solid only at its foot, which sits 8 above the bar (user pin
  // 2026-10-15: "the fade is too high, it should end slightly above this
  // message bar")
  return <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: -reach, height: 28, background: `linear-gradient(to bottom, transparent, ${BG_PRIMARY})`, pointerEvents: "none", zIndex: 9 }} />;
}

/** A page that rises over the chat and sinks back on close; `children` gets
    the close that plays the sink first. */
function Rise({ onClose, children }: { onClose: () => void; children: (close: (then?: () => void) => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => { const r = requestAnimationFrame(() => setOpen(true)); return () => cancelAnimationFrame(r); }, []);
  const close = (then?: () => void) => { setLeaving(true); setOpen(false); window.setTimeout(then ?? onClose, 380); };
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 70, background: BG_PRIMARY, display: "flex", flexDirection: "column", transform: open ? "none" : "translateY(100%)", transition: `transform 380ms ${EASE}`, pointerEvents: leaving ? "none" : "auto", willChange: !open || leaving ? "transform" : undefined }}>
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
  const sel = useSelectedTake();
  // the bar's emphasis as the page lands, so the eye finds the filter (user
  // pin 2026-10-16: "a subtle emphasis here with a stroke trim path glow …
  // try a few, have them in the debug panel")
  const [emphasis] = useProtoFlag("recatEmphasis");
  const barRef = useRef<HTMLDivElement>(null);
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
  // the confirm keeps its last count while it fades out, so it never reads "Mark 0"
  const [ctaCount, setCtaCount] = useState(0);
  if (picked.length && picked.length !== ctaCount) setCtaCount(picked.length);

  return (
    <Rise onClose={onClose}>
      {(close) => (<>
      <StatusBar backgroundColor="transparent" />
      <div style={BAR}>
        <ChromeButton label="Close" onClick={() => close()}><div aria-hidden style={tintedGlyph("/return-exp1/bill-picker/close.svg", EXT_BG_BOLD_REVERSE, 24)} /></ChromeButton>
        {/* the X, and the update on the right once something is ticked (user
            pin 2026-10-16: "maintain the filter with cosimo here, have the
            update button on the top right") — DLS Button/Primary, Small */}
        <div style={{ flex: 1 }} />
        {/* a DLS Text button, not a Primary (user pin 2026-10-16): the label in Valentino, Button Normal, 12 in from the edge */}
        <button type="button" onClick={() => close(() => onApply(picked))} tabIndex={picked.length ? 0 : -1} aria-hidden={!picked.length} className="transition-opacity active:opacity-60" style={{ height: 48, padding: "12px 12px", border: "none", borderRadius: 100, background: "transparent", color: VALENTINO_500, ...typography.buttonNormal, cursor: picked.length ? "pointer" : "default", opacity: picked.length ? 1 : 0, pointerEvents: picked.length ? "auto" : "none", transition: "opacity 200ms ease" }}>
          Update {ctaCount}
        </button>
      </div>
      {/* the page head stays put (user pin 2026-10-16: "this should remain
          fixed, and a smooth fade below this which allows the list to scroll") */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: `8px ${PAGE_GUTTER}px 8px`, flexShrink: 0 }}>
        <h2 style={{ ...typography.headerH3, color: TEXT_PRIMARY, margin: 0 }}>Which Swiggy transactions move to {target}?</h2>
      </div>
      <div style={{ position: "relative", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      {/* the list dissolves under the head */}
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: 0, height: 24, background: `linear-gradient(to bottom, ${BG_PRIMARY}, transparent)`, pointerEvents: "none", zIndex: 9 }} />
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", scrollbarWidth: "none", display: "flex", flexDirection: "column", paddingTop: 8, paddingBottom: 57 + 16 + 28 }}>
        {/* the model's turn, then its answer, over the rows it narrowed to */}
        {/* the rows step out while the model works: the proto's spinner ring
            (OnboardingSim's) over "Finding them", centred in the list's place */}
        {/* the model's turn: the rows themselves shimmer as placeholders (user
            pin 2026-10-16: "a shimmer for these list items, not for the
            loader; the list shimmer will act as the loader") */}
        {asking && <ShimmerRows n={Math.min(rows.length || 6, 8)} padding={`16px ${PAGE_GUTTER}px`} />}
        {!asking && rows.length === 0 && <p style={{ ...typography.bodySmall, color: TEXT_TERTIARY, margin: 0, padding: `24px ${PAGE_GUTTER}px` }}>Nothing matches that. Clear the bar to see every row, or ask another way.</p>}
        {!asking && rows.map((t) => {
          const on = picked.includes(t.id);
          return (
            <div key={t.id} role="checkbox" aria-checked={on} tabIndex={0} aria-label={`${t.note} ${inr(t.amount)}`} onClick={() => toggle(t.id)} onKeyDown={(e) => e.key === "Enter" && toggle(t.id)} className="transition-transform active:scale-[0.99]" style={{ display: "flex", alignItems: "center", gap: 12, padding: `16px ${PAGE_GUTTER}px`, cursor: "pointer", background: on && sel.wash ? EXT_BG_SUBTLE_MAIN : "transparent", transition: "background 160ms ease" }}>
              {/* ticked: the avatar and, on the Selected switch, the ink or a wash carry it */}
              <Avatar t={t} on={on} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ ...typography.bodyNormal, color: on && sel.ink ? VALENTINO_500 : TEXT_PRIMARY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 200ms ease" }}>{t.note}</span>
                  <span style={{ ...typography.bodyNormal, color: on && sel.ink ? VALENTINO_500 : TEXT_PRIMARY, whiteSpace: "nowrap", transition: "color 200ms ease" }}>{inr(t.amount)}</span>
                </div>
                <span style={{ ...typography.caption, color: TEXT_SECONDARY, whiteSpace: "nowrap" }}>{fmtDay(t.date)} · {t.cat}</span>
              </div>
            </div>
          );
        })}
      </div>
      {/* v2's foot scrim, behind the bar (user 2026-10-16: "the fade behind
          the Filter with cosimo bar is not smooth, it should be like it is in
          chat in Return exp1 v2"): the list runs under the bar and dissolves
          into the page colour just above it, solid from there down */}
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 57 + 16 + 8, background: `linear-gradient(to bottom, transparent, ${BG_PRIMARY} 28px)`, pointerEvents: "none", zIndex: 9 }} />
      {/* the ask bar floats where the chat's message box does (user pin
          2026-10-15), over the scrim */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 10, padding: `8px ${BAR_MARGIN}px 8px` }}>
        {!picked.length && emphasis === "glow" && (
          <div aria-hidden style={{ position: "absolute", left: BAR_MARGIN, right: BAR_MARGIN, top: 8, height: 57, borderRadius: 100, pointerEvents: "none", animation: "recatGlow 1.1s ease-in-out 600ms 2 both" }} />
        )}
        {/* the filter bar stays through the ticking (user pin 2026-10-16); the
            comet's svg sits on its edge, overflow visible, so the glow shows */}
        <div ref={barRef} style={{ ...MESSAGE_BOX, padding: 0, overflow: "visible" }}>
          {!picked.length && emphasis === "trim" && <TrimRing scaleTarget={barRef} />}
          {/* the DLS funnel leads the bar (Shopping/Filter, Wallpaper · icon
              801:49776, exported to /recat/filter.svg at the full ink — user
              pin 2026-10-16: "use the filter symbol, this looks like settings") */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 12, padding: "0 56px 0 20px", }}>
            <div aria-hidden style={{ ...tintedGlyph("/recat/filter.svg", EXT_BG_BOLD_REVERSE, 20), animation: emphasis === "pulse" && !picked.length ? "recatPulse 900ms ease-in-out 600ms 2 both" : undefined }} />
            <input value={askDraft} onChange={(e) => { setAskDraft(e.target.value); if (!e.target.value.trim()) setAskFilter(null); }} onKeyDown={(e) => e.key === "Enter" && runAsk()} placeholder="Filter with cosimo" aria-label="Describe the transactions to select" enterKeyHint="send" readOnly={asking} style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", padding: 0, ...typography.bodySmall, color: asking ? TEXT_TERTIARY : TEXT_PRIMARY, transition: "color 200ms ease" }} />
            <SendButton show={!!askDraft.trim() && !asking} onClick={runAsk} />
          </div>
        </div>
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
