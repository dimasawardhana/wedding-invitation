"use client";

/**
 * RusticTemplate — kraft-paper, botanical, earthy two-column-on-desktop
 * scrolling template: foliage accents, torn-paper section frames, serif/mono
 * pairing, muted palette. Content sections alternate background tone to give a
 * scrapbook rhythm instead of the mandatory snap-scroll of the other templates.
 */

import { useRef } from "react";
import { motion } from "framer-motion";
import TemplateGate from "@/components/engine/TemplateGate";
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

const KRAFT = "#F1E7D8";
const KRAFT_DEEP = "#E6D7C1";
const BARK = "#4E3B2A";

function Leaf({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`w-8 h-8 ${className}`}
      fill="none"
      stroke={BARK}
      strokeWidth={1.5}
      opacity={0.45}
      aria-hidden
    >
      <path d="M32 6C18 20 12 36 32 58 52 36 46 20 32 6z" />
      <path d="M32 10v46" />
      <path d="M32 22c-5 2-9 6-11 11M32 30c-4 2-7 5-8 9M32 22c5 2 9 6 11 11M32 30c4 2 7 5 8 9" />
    </svg>
  );
}

function PaperCard({ children, tint }: { children: React.ReactNode; tint?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`relative max-w-md w-full mx-auto rounded-lg px-6 py-10 shadow-md ${
        tint ? "" : "bg-[#FBF6EC]"
      }`}
      style={tint ? { backgroundColor: KRAFT_DEEP } : undefined}
    >
      {/* pin/tape corner */}
      <span
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 rounded-sm rotate-[-2deg] opacity-70"
        style={{ backgroundColor: "#D9C7A9" }}
        aria-hidden
      />
      {children}
    </motion.div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center mb-6">
      <Leaf className="mx-auto mb-2" />
      <h2 className="font-playfair text-2xl" style={{ color: BARK }}>
        {children}
      </h2>
    </div>
  );
}

export default function RusticTemplate({
  data,
  heroImage,
  theme,
  invitationId,
  guestName,
}: TemplateProps) {
  const accent = COLOR_SCHEME_MAP[theme?.colorScheme] ?? DEFAULT_ACCENT;
  const firstSectionRef = useRef<HTMLDivElement>(null);

  function scrollToContent() {
    firstSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        className="h-full w-full overflow-y-auto overflow-x-hidden"
        style={{
          ...fontVarsFor(theme?.fontPair),
          backgroundColor: KRAFT,
        } as React.CSSProperties}
      >
        <section className="min-h-screen relative" style={{ backgroundColor: KRAFT }}>
          <div className="absolute inset-0 p-3 sm:p-6">
            <div className="h-full w-full rounded-lg border-2 border-dashed overflow-hidden relative" style={{ borderColor: `${BARK}55` }}>
              <HeroCover
                title={data.title}
                weddingDate={data.weddingDate}
                heroImage={heroImage}
                accentColor={accent}
                onOpen={scrollToContent}
                guestName={guestName}
                showOpenButton={false}
              />
            </div>
          </div>
        </section>

        <div className="px-4 py-16 space-y-14 pb-24">
          <div ref={firstSectionRef}>
          <PaperCard>
            <SectionTitle>Kami Menikah</SectionTitle>
            <p className="font-sans text-sm text-stone-600 text-center leading-relaxed">
              Dengan penuh sukacita, kami mengundang {guestName ?? "Anda"} untuk menjadi bagian
              dari hari bahagia kami.
            </p>
          </PaperCard>
        </div>

        <PaperCard tint>
          <SectionTitle>Mempelai</SectionTitle>
          <CoupleDetail groom={data.groom} bride={data.bride} accentColor={BARK} />
        </PaperCard>

        {data.weddingEvents.length > 0 && (
          <PaperCard>
            <SectionTitle>Waktu &amp; Tempat</SectionTitle>
            <EventDetail
              weddingDate={data.weddingDate}
              weddingEvents={data.weddingEvents}
              accentColor={BARK}
            />
          </PaperCard>
        )}

        {data.events.length > 0 && (
          <PaperCard tint>
            <SectionTitle>Cerita Kami</SectionTitle>
            <LoveJourney events={data.events} accentColor={BARK} />
          </PaperCard>
        )}

        {data.gallery.length > 0 && (
          <PaperCard>
            <SectionTitle>Momen</SectionTitle>
            <Gallery gallery={data.gallery} videoUrl={data.videoUrl} />
          </PaperCard>
        )}

        {(data.bankAccounts.length > 0 || data.qrisAccounts.length > 0) && (
          <PaperCard tint>
            <SectionTitle>Tanda Kasih</SectionTitle>
            <DigitalGift bankAccounts={data.bankAccounts} qrisAccounts={data.qrisAccounts} />
          </PaperCard>
        )}

        <PaperCard>
          <SectionTitle>Hadir &amp; Ucapan</SectionTitle>
          <RSVPForm initialWishes={data.wishes} invitationId={invitationId} />
        </PaperCard>

        <PaperCard tint>
          <SectionTitle>Sampai Jumpa</SectionTitle>
          <Closing
            groomName={data.groomName}
            brideName={data.brideName}
            slug={data.slug}
            weddingDate={data.weddingDate}
            guestName={guestName}
            onReplay={scrollToContent}
          />
        </PaperCard>
      </div>
      </div>
      <TemplateGate
        variant="seal"
        accent={BARK}
        names={`${data.groomName} & ${data.brideName}`}
        onOpen={scrollToContent}
      />
    </div>
  );
}