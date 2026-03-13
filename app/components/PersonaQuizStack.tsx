"use client";

import type { ChipOption, PersonaQuestion } from "../data/flows";

export type RevealData = {
  savingsGuess: string;
  savingsActual: string;
  personaGuess: string;
  personaActual: string;
};

type PersonaQuizStackProps = {
  questions: PersonaQuestion[];
  activeIndex: number;
  showCover: boolean;
  showReveal: boolean;
  revealData?: RevealData;
  isTransitioning: boolean;
  onStart: () => void;
  onSelect: (questionIndex: number, chip: ChipOption) => void;
  onBack: () => void;
  onRevealDone: () => void;
};

const STACK_STYLES = [
  { rotate: "2deg",    translateY: "6px" },
  { rotate: "-1.5deg", translateY: "12px" },
];

export default function PersonaQuizStack({
  questions,
  activeIndex,
  showCover,
  showReveal,
  revealData,
  isTransitioning,
  onStart,
  onSelect,
  onBack,
  onRevealDone,
}: PersonaQuizStackProps) {
  const activeQuestion = questions[activeIndex];

  // Full deck: cover + questions + reveal
  const totalCards = questions.length + 2;
  const currentPosition = showReveal ? totalCards - 1 : showCover ? 0 : activeIndex + 1;
  const stackCount = Math.min(2, totalCards - currentPosition - 1);

  return (
    <div
      className="relative flex h-full flex-col rounded-[18px] bg-[radial-gradient(circle_at_top,#fff_0%,#f7f8fb_45%,#edf0f5_100%)] text-zinc-900"
      style={{
        fontFamily: "var(--font-rubik), var(--font-sans), system-ui, sans-serif",
        paddingTop: "max(env(safe-area-inset-top), 24px)",
      }}
    >
      <div className="flex-1 px-5 py-5">
        <div className="relative mx-auto h-full max-w-[332px]">
          {/* Stack background cards */}
          {Array.from({ length: stackCount }, (_, i) => i).reverse().map((slot, stackOffset) => {
            const depth = stackCount - stackOffset;
            const style = STACK_STYLES[slot] ?? STACK_STYLES[0];
            return (
              <div
                key={slot}
                className="absolute inset-x-0 rounded-[30px] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm"
                style={{
                  top: 12,
                  bottom: 80,
                  left: 16,
                  right: 16,
                  transform: `translateY(${style.translateY}) rotate(${style.rotate})`,
                  opacity: 0.85 - depth * 0.1,
                  transformOrigin: "center center",
                  zIndex: 10 - depth,
                }}
                aria-hidden="true"
              >
                <div className="flex h-full flex-col justify-between p-6">
                  <div className="space-y-3">
                    <div className="h-2 w-16 rounded-full bg-zinc-200" />
                    <div className="space-y-2">
                      <div className="h-4 w-4/5 rounded-full bg-zinc-200" />
                      <div className="h-4 w-3/5 rounded-full bg-zinc-100" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-10 rounded-2xl bg-zinc-100" />
                    <div className="h-10 rounded-2xl bg-zinc-100" />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Active card */}
          <div
            className={`absolute inset-x-0 top-3 bottom-20 rounded-[32px] p-6 shadow-[0_32px_90px_rgba(15,23,42,0.14)] backdrop-blur transition-opacity duration-200 ${isTransitioning ? "opacity-0" : "opacity-100"} ${showReveal ? "bg-[radial-gradient(circle_at_top,#c03de0_0%,#8b20b5_50%,#5c1278_100%)]" : "bg-white"}`}
            style={{ zIndex: 20 }}
          >
            {showReveal && revealData ? (
              <div className="flex h-full flex-col">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">Reality check</p>
                  <h2 className="mt-3 text-[28px] font-semibold leading-[1.05] tracking-[-0.04em] text-white">
                    Here's what your money actually does.
                  </h2>
                </div>

                <div className="mt-6 space-y-4">
                  <p className="text-[15px] leading-relaxed text-white/70">
                    Here's how close you were 👀
                  </p>
                  <p className="text-[15px] leading-relaxed text-white/70">
                    Savings: you guessed <span className="font-semibold text-white">{revealData.savingsGuess}</span> → actual <span className="font-semibold text-white">{revealData.savingsActual}</span>.
                  </p>
                  <p className="text-[15px] leading-relaxed text-white/70">
                    Persona: you called yourself a <span className="font-semibold text-white">"{revealData.personaGuess}"</span> → reality is <span className="font-semibold text-white">"{revealData.personaActual}"</span> 😅
                  </p>
                  <p className="text-[15px] leading-relaxed text-white/70">
                    Good news: you're not bad with money — your money just has habits.
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-end pt-6">
                  <button
                    type="button"
                    onClick={onRevealDone}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white focus-visible:outline-none active:scale-95"
                  >
                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="#c03de0" strokeWidth="2">
                      <path d="M4.5 10h9" strokeLinecap="round" />
                      <path d="m10.5 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : showCover ? (
              <div className="flex h-full flex-col">
                <div className="space-y-4">
                  <h2 className="max-w-[270px] text-[30px] font-semibold leading-[1.04] tracking-[-0.04em] text-zinc-950">
                    Tell me how you think your money behaves.
                  </h2>
                </div>

                <div className="mt-auto flex items-center justify-end pt-6">
                  <button
                    type="button"
                    onClick={onStart}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c03de0] focus-visible:outline-none active:scale-95"
                  >
                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="white" strokeWidth="2">
                      <path d="M4.5 10h9" strokeLinecap="round" />
                      <path d="m10.5 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : activeQuestion ? (
              <div className="flex h-full flex-col">
                <div className="space-y-4">
                  <h2 className="max-w-[260px] text-[30px] font-semibold leading-[1.05] tracking-[-0.04em] text-zinc-950">
                    {activeQuestion.text}
                  </h2>
                </div>

                <div className="mt-auto space-y-2.5 overflow-y-auto pr-1 pt-6">
                  {activeQuestion.chips.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => onSelect(activeIndex, chip)}
                      disabled={isTransitioning}
                      className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left shadow-[0_10px_30px_rgba(148,163,184,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="text-[15px] font-medium tracking-[-0.01em] text-zinc-900">{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
