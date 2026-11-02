"use client";

/**
 * IslamicTemplate — full-scroll template for the Indonesian Islamic wedding
 * segment: akad-first ordering, ornamental arches, bismillah opening, warm
 * ivory-and-emerald palette independent of the user's color scheme (the accent
 * is used only for small highlights), and generous calligraphic spacing.
 */

import { useRef } from "react";
import { motion } from "framer-motion";
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

const IVORY = "#FBF7EF";
const EMERALD = "#1E5C4A";
const GOLD_LINE = "rgba(30, 92, 74, 0.25)";

function Ornament({ className = "" }: { className?: string }) {
  // Simple symmetrical divider: diamond flanked by lines.
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden>
      <span className="h-px w-12" style={{ backgroundColor: GOLD_LINE }} />
      <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ color: EMERALD }} fill="currentColor">
        <path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2z" opacity={0.7} />
      </svg>
      <span className="h-px w-12" style={{ backgroundColor: GOLD_LINE }} />
    </div>
  );
}

function Section({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="min-h-screen snap-start flex flex-col justify-center px-6 py-16"
      style={{ backgroundColor: IVORY }}
    >
      <div className="max-w-md w-full mx-auto">{children}</div>
    </section>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <motion.h2
      {...fadeUp}
      className="font-playfair text-2xl text-center mb-2"
      style={{ color: EMERALD }}
    >
      {children}
    </motion.h2>
  );
}

export default function IslamicTemplate({
  data,
  heroImage,
  theme,
  invitationId,
  guestName,
}: TemplateProps) {
  const accent = COLOR_SCHEME_MAP[theme?.colorScheme] ?? DEFAULT_ACCENT;
  const sectionsRef = useRef<HTMLDivElement>(null);

  function scrollToContent() {
    sectionsRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div
      className="h-screen w-full overflow-y-auto overflow-x-hidden"
      style={{
        ...fontVarsFor(theme?.fontPair),
        scrollSnapType: "y mandatory",
        backgroundColor: IVORY,
      } as React.CSSProperties}
    >
      {/* Opening — cover slide fills the viewport, arch-masked by ornament frame */}
      <section className="min-h-screen snap-start relative" style={{ backgroundColor: IVORY }}>
        <div className="absolute inset-0 p-3 sm:p-5">
          <div
            className="h-full w-full rounded-[2rem] border overflow-hidden relative"
            style={{ borderColor: GOLD_LINE, borderWidth: 1 }}
          >
            <HeroCover
              title={data.title}
              weddingDate={data.weddingDate}
              heroImage={heroImage}
              accentColor={accent}
              onOpen={scrollToContent}
              guestName={guestName}
            />
          </div>
        </div>
      </section>

      <div ref={sectionsRef}>
        {/* Bismillah opening */}
        <Section id="bismillah">
          <motion.div {...fadeUp} className="text-center space-y-4">
            <p className="font-sans text-sm tracking-[0.3em] uppercase" style={{ color: EMERALD }}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <p className="font-sans text-xs text-stone-500 leading-relaxed">
              Dengan memohon rahmat dan ridha Allah SWT, tanpa mengurangi rasa hormat, kami
              mengundang Bapak/Ibu/Saudara/i — {guestName ?? "Tamu Honorable"} — untuk menghadiri
              acara pernikahan kami:
            </p>
            <p className="font-playfair text-2xl text-stone-800 pt-2">
              {data.groomName} &amp; {data.brideName}
            </p>
          </motion.div>
        </Section>

        <Section id="couple">
          <SectionTitle>Mempelai</SectionTitle>
          <Ornament className="mb-6" />
          <CoupleDetail groom={data.groom} bride={data.bride} accentColor={EMERALD} />
        </Section>

        {data.events.length > 0 && (
          <Section id="events">
            <SectionTitle>Rangkaian Acara</SectionTitle>
            <Ornament className="mb-6" />
            <EventDetail
              weddingDate={data.weddingDate}
              weddingEvents={data.weddingEvents}
              accentColor={EMERALD}
            />
          </Section>
        )}

        {data.events.length > 0 && (
          <Section id="journey">
            <SectionTitle>Kisah Kami</SectionTitle>
            <Ornament className="mb-6" />
            <LoveJourney events={data.events} accentColor={EMERALD} />
          </Section>
        )}

        {data.gallery.length > 0 && (
          <Section id="gallery">
            <SectionTitle>Galeri</SectionTitle>
            <Ornament className="mb-6" />
            <Gallery gallery={data.gallery} videoUrl={data.videoUrl} />
          </Section>
        )}

        {(data.bankAccounts.length > 0 || data.qrisAccounts.length > 0) && (
          <Section id="gift">
            <SectionTitle>Amplop Digital</SectionTitle>
            <Ornament className="mb-6" />
            <DigitalGift
              bankAccounts={data.bankAccounts}
              qrisAccounts={data.qrisAccounts}
            />
          </Section>
        )}

        <Section id="rsvp">
          <SectionTitle>Konfirmasi &amp; Ucapan</SectionTitle>
          <Ornament className="mb-6" />
          <RSVPForm initialWishes={data.wishes} invitationId={invitationId} />
        </Section>

        <Section id="closing">
          <SectionTitle>Penutup</SectionTitle>
          <Ornament className="mb-6" />
          <Closing
            groomName={data.groomName}
            brideName={data.brideName}
            slug={data.slug}
            weddingDate={data.weddingDate}
            guestName={guestName}
            onReplay={scrollToContent}
          />
        </Section>
      </div>
    </div>
  );
}
