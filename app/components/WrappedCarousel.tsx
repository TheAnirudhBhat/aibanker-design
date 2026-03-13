"use client";

import { useEffect, useRef, useState } from "react";
import type { WrappedSlide } from "../data/flows";
import dynamic from "next/dynamic";

const Wrapped3DScene = dynamic(() => import("./Wrapped3DScene"), {
  ssr: false,
});

type WrappedCarouselProps = {
  slides: WrappedSlide[];
  onComplete: () => void;
};

export default function WrappedCarousel({
  slides,
  onComplete,
}: WrappedCarouselProps) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const hasAdvanced = useRef(false);

  const isLastSlide = index === slides.length - 1;
  const slide = slides[Math.min(index, slides.length - 1)];

  // Auto-advance logic - 7 seconds per slide
  useEffect(() => {
    if (isPaused) return;

    hasAdvanced.current = false;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1;

        // When reaching 100%, advance to next slide
        if (next >= 100 && !hasAdvanced.current) {
          hasAdvanced.current = true;

          if (isLastSlide) {
            setTimeout(() => onComplete(), 100);
            return 100;
          }

          setTimeout(() => {
            setIndex((i) => i + 1);
          }, 0);
          return 100;
        }

        return next;
      });
    }, 70);

    return () => clearInterval(interval);
  }, [isPaused, isLastSlide, onComplete, index]);

  // Reset progress when index changes
  useEffect(() => {
    setProgress(0);
  }, [index]);

  const goNext = () => {
    if (isLastSlide) {
      onComplete();
      return;
    }
    setIndex((prev) => Math.min(prev + 1, slides.length - 1));
    setProgress(0);
  };

  const goPrev = () => {
    if (index === 0) return;
    setIndex((prev) => Math.max(prev - 1, 0));
    setProgress(0);
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width / 3) {
      goPrev();
    } else {
      goNext();
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0].clientX;
    pressTimer.current = setTimeout(() => {
      setIsPaused(true);
    }, 200);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    setIsPaused(false);

    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) goPrev();
      else goNext();
    }
    touchStartX.current = null;
  };

  const handleMouseDown = () => {
    pressTimer.current = setTimeout(() => {
      setIsPaused(true);
    }, 200);
  };

  const handleMouseUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    setIsPaused(false);
  };

  // Color schemes for each slide
  const getColorScheme = () => {
    const schemes = [
      { bg: 'from-indigo-600 via-purple-600 to-pink-600', accent: 'from-pink-400 to-rose-500' }, // Intro
      { bg: 'from-slate-800 via-purple-900 to-indigo-950', accent: 'from-blue-400 to-cyan-500' }, // Night mode
      { bg: 'from-emerald-600 via-teal-600 to-cyan-600', accent: 'from-yellow-400 to-orange-500' }, // Two people
      { bg: 'from-rose-600 via-pink-600 to-fuchsia-600', accent: 'from-amber-400 to-red-500' }, // Thousand cuts
      { bg: 'from-red-700 via-rose-700 to-pink-700', accent: 'from-orange-400 to-red-500' }, // Danger zone
      { bg: 'from-violet-600 via-purple-600 to-fuchsia-600', accent: 'from-cyan-400 to-blue-500' }, // Ready
    ];
    return schemes[index] || schemes[0];
  };


  const colors = getColorScheme();

  return (
    <div className="relative flex h-full flex-col rounded-[28px] overflow-hidden bg-black">
      {/* Gradient background with smooth transition */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} transition-all duration-700`}>
        {/* Animated gradient overlay */}
        <div className="absolute inset-0">
          <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${colors.accent} rounded-full mix-blend-overlay filter blur-3xl opacity-40 animate-blob`} />
          <div className={`absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr ${colors.accent} rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-blob animation-delay-2000`} />
        </div>

        {/* 3D Scene */}
        <Wrapped3DScene slideIndex={index} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-6">
        {/* Progress bars */}
        <div className="flex gap-1.5 mb-8">
          {slides.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-[2px] rounded-full overflow-hidden"
              style={{ background: 'rgba(255, 255, 255, 0.25)' }}
            >
              <div
                className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                style={{
                  width: i < index ? "100%" : i === index ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Main content */}
        <div
          className="flex-1 flex flex-col justify-center cursor-pointer select-none"
          onClick={handleTap}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="space-y-6 animate-slide-up" key={index}>
            {/* Headline */}
            <h1
              className="text-[3rem] font-bold leading-[1.05] tracking-tight text-white"
              style={{
                textShadow: '0 4px 40px rgba(0, 0, 0, 0.6)',
              }}
            >
              {slide.headline}
            </h1>

            {/* Punchline */}
            <p
              className="text-[1.125rem] leading-[1.5] text-white/95 font-normal max-w-[88%]"
              style={{ textShadow: '0 2px 20px rgba(0, 0, 0, 0.5)' }}
            >
              {slide.punchline}
            </p>

            {/* Stat */}
            {slide.stat && (
              <div className="pt-8">
                {/* Stat number */}
                <div className="mb-3">
                  <div
                    className="text-[5rem] font-black leading-none tracking-tight text-white inline-block animate-count-up"
                    style={{
                      textShadow: '0 6px 40px rgba(0, 0, 0, 0.5)',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {slide.stat.value}
                  </div>
                </div>

                {/* Caption only */}
                <p className="text-lg text-white/80 font-medium">
                  {slide.stat.caption}
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Pause indicator */}
      {isPaused && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 animate-fade-in">
          <div
            className="flex gap-2.5 p-4 rounded-2xl"
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <div className="w-1.5 h-12 bg-white/95 rounded-full" />
            <div className="w-1.5 h-12 bg-white/95 rounded-full" />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes count-up {
          from {
            opacity: 0;
            transform: scale(0.85);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(-5deg);
          }
        }

        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }


        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-slow {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-count-up {
          animation: count-up 1s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }

        .animate-blob {
          animation: blob 7s infinite;
        }


        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-fade-in-slow {
          animation: fade-in-slow 1s ease-out;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
