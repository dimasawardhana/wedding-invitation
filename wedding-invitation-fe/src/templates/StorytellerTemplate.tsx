"use client";

import { useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HeroCover from "@/components/slides/HeroCover";
import CoupleDetail from "@/components/slides/CoupleDetail";
import LoveJourney from "@/components/slides/LoveJourney";
import EventDetail from "@/components/slides/EventDetail";
import Gallery from "@/components/slides/Gallery";
import DigitalGift from "@/components/slides/DigitalGift";
import RSVPForm from "@/components/slides/RSVPForm";
import Closing from "@/components/slides/Closing";
import { type TemplateProps } from "./types";
import { COLOR_SCHEME_MAP, DEFAULT_ACCENT, fontVarsFor } from "@/lib/theme";

const TOTAL_SLIDES = 8;

export default function StorytellerTemplate({
  data,
  heroImage,
  theme,
  invitationId,
  guestName,
}: TemplateProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const accentColor = COLOR_SCHEME_MAP[theme?.colorScheme] ?? DEFAULT_ACCENT;

  const goNext = useCallback(
    () => setCurrentIndex((i) => (i < TOTAL_SLIDES - 1 ? i + 1 : i)),
    [],
  );
  const goPrev = useCallback(
    () => setCurrentIndex((i) => (i > 0 ? i - 1 : i)),
    [],
  );

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    if (currentIndex === 0) return;
    if (e.deltaY > 0) goNext();
    else goPrev();
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (currentIndex === 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    if (e.clientY < window.innerHeight / 2) goPrev();
    else goNext();
  }

  function handleOpen() {
    goNext();
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  }

  function toggleAudio() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  }

  function renderSlide(index: number): React.ReactNode {
    switch (index) {
      case 0:
        return (
          <HeroCover
            title={data.title}
            weddingDate={data.weddingDate}
            heroImage={heroImage}
            accentColor={accentColor}
            onOpen={handleOpen}
            guestName={guestName}
          />
        );
      case 1:
        return (
          <CoupleDetail
            groom={data.groom}
            bride={data.bride}
            accentColor={accentColor}
          />
        );
      case 2:
        return <LoveJourney events={data.events} accentColor={accentColor} />;
      case 3:
        return (
          <EventDetail
            weddingDate={data.weddingDate}
            weddingEvents={data.weddingEvents}
            accentColor={accentColor}
          />
        );
      case 4:
        return <Gallery gallery={data.gallery} videoUrl={data.videoUrl} />;
      case 5:
        return (
          <RSVPForm initialWishes={data.wishes} invitationId={invitationId} />
        );
      case 6:
        return (
          <DigitalGift
            bankAccounts={data.bankAccounts}
            qrisAccounts={data.qrisAccounts}
          />
        );
      case 7:
        return (
          <Closing
            groomName={data.groomName}
            brideName={data.brideName}
            slug={data.slug}
            weddingDate={data.weddingDate}
            guestName={guestName}
            onReplay={() => setCurrentIndex(0)}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div
      className="relative h-full w-full overflow-hidden touch-none"
      style={fontVarsFor(theme?.fontPair) as React.CSSProperties}
      onWheel={handleWheel}
      onClick={handleClick}
    >
      {theme?.music && (
        <audio ref={audioRef} src={theme.music} loop preload="none" />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.06, filter: "blur(6px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.97, filter: "blur(4px)" }}
          transition={{ duration: 0.85, ease: [0.32, 0.72, 0.35, 1] }}
        >
          {renderSlide(currentIndex)}
        </motion.div>
      </AnimatePresence>

      {currentIndex > 0 && (
        <>
          <nav
            className="absolute right-3 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {Array.from({ length: TOTAL_SLIDES - 1 }).map((_, i) => {
              const slideIndex = i + 1;
              const active = slideIndex === currentIndex;
              return (
                <button
                  key={slideIndex}
                  aria-label={`Go to slide ${slideIndex + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(slideIndex);
                  }}
                  className="w-1.5 rounded-full transition-all duration-300"
                  style={{
                    height: active ? 24 : 6,
                    backgroundColor: active ? accentColor : `${accentColor}59`,
                  }}
                />
              );
            })}
          </nav>

          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              disabled={currentIndex <= 1}
              aria-label="Previous slide"
              className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center text-stone-600 hover:bg-white disabled:opacity-30 transition-all"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="w-3.5 h-3.5"
              >
                <path
                  d="M10 3L5 8l5 5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span className="font-sans text-[10px] tracking-[0.2em] text-stone-400 uppercase w-16 text-center">
              {currentIndex} / {TOTAL_SLIDES - 1}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              disabled={currentIndex >= TOTAL_SLIDES - 1}
              aria-label="Next slide"
              className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center text-stone-600 hover:bg-white disabled:opacity-30 transition-all"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="w-3.5 h-3.5"
              >
                <path
                  d="M6 3l5 5-5 5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {theme?.music && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleAudio();
              }}
              className="absolute bottom-6 right-4 z-50 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center text-stone-600 hover:bg-white transition-colors"
              aria-label={isPlaying ? "Mute music" : "Play music"}
            >
              <motion.span
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{
                  duration: 4,
                  repeat: isPlaying ? Infinity : 0,
                  ease: "linear",
                }}
                className="text-sm leading-none"
              >
                ♪
              </motion.span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
