"use client";

/**
 * ClassicTemplate — traditional formal long-scroll: double border frames,
 * centered serif everything, ceremonial Indonesian phrasing, muted champagne
 * palette. Deliberately conservative — designed to read well for older guests
 * and to be printable-feeling. No snap-scroll; steady continuous flow.
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

const CHAMPAGNE = "#F7F2E9";
const BORDER = "#B9A05A";

function DoubleFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="border p-1.5 w-full" style={{ borderColor: BORDER }}>
      <div className="border px-6 py-10" style={{ borderColor: BORDER }}>
        {children}
      </div>
    </div>
  );
}

function Flourish() {
  return (
    <div className="flex items-center justify-center gap-2 my-4" aria-hidden>
      <span className="h-px w-16" style={{ backgroundColor: BORDER }} />
      <span className="text-xs" style={{ color: BORDER }}>❦</span>
      <span className="h-px w-16" style={{ backgroundColor: BORDER }} />
    </div>
  );
}

function FormalSection({
  title,
  children,
  tint,
}: {
  title: string;
  children: React.ReactNode;
  tint?: boolean;
}) {
  return (
    <section
      className="min-h-[80vh] flex items-center px-4 py-14"
      style={{ backgroundColor: tint ? "#F0E9DA" : CHAMPAGNE }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full mx-auto"
      >
        <DoubleFrame>
          <h2 className="font-playfair text-xl text-center tracking-wide text-stone-700">
            {title}
          </h2>
          <Flourish />
          {children}
        </DoubleFrame>
      </motion.div>
    </section>
  );
}

export default function ClassicTemplate({
  data,
  heroImage,
  theme,
  invitationId,
  guestName,
}: TemplateProps) {
  const accent = COLOR_SCHEME_MAP[theme?.colorScheme] ?? DEFAULT_ACCENT;
  const firstRef = useRef<HTMLDivElement>(null);

  function scrollToContent() {
    firstRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div
      className="h-full min-h-full w-full overflow-y-auto overflow-x-hidden"
      style={{
        ...fontVarsFor(theme?.fontPair),
        backgroundColor: CHAMPAGNE,
      } as React.CSSProperties}
    >
      <section className="min-h-screen relative p-4" style={{ backgroundColor: CHAMPAGNE }}>
        <div className="h-full min-h-[calc(100vh-2rem)] border p-1.5" style={{ borderColor: BORDER }}>
          <div className="h-full min-h-[calc(100vh-3.5rem)] border overflow-hidden relative" style={{ borderColor: BORDER }}>
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

      <FormalSection title="Undangan Pernikahan">
        <div className="text-center space-y-4">
          <p className="font-sans text-sm text-stone-600 leading-relaxed">
            Kepada Yth.
            <br />
            Bapak / Ibu / Saudara/i
            <br />
            <span className="font-semibold text-stone-800">{guestName ?? "Tamu Undangan"}</span>
          </p>
          <p className="font-sans text-sm text-stone-600 leading-relaxed">
            Dengan hormat, kami bermaksud mengundang Anda untuk menghadiri acara pernikahan kami:
          </p>
          <p className="font-playfair text-2xl text-stone-800">
            {data.groomName} &amp; {data.brideName}
          </p>
        </div>
      </FormalSection>

      <FormalSection title="Mempelai" tint>
        <CoupleDetail groom={data.groom} bride={data.bride} accentColor={BORDER} />
      </FormalSection>

      {data.weddingEvents.length > 0 && (
        <FormalSection title="Acara">
          <EventDetail
            weddingDate={data.weddingDate}
            weddingEvents={data.weddingEvents}
            accentColor={BORDER}
          />
        </FormalSection>
      )}

      {data.events.length > 0 && (
        <FormalSection title="Kisah Kami" tint>
          <LoveJourney events={data.events} accentColor={BORDER} />
        </FormalSection>
      )}

      {data.gallery.length > 0 && (
        <FormalSection title="Galeri">
          <Gallery gallery={data.gallery} videoUrl={data.videoUrl} />
        </FormalSection>
      )}

      {(data.bankAccounts.length > 0 || data.qrisAccounts.length > 0) && (
        <FormalSection title="Amplop Digital" tint>
          <DigitalGift bankAccounts={data.bankAccounts} qrisAccounts={data.qrisAccounts} />
        </FormalSection>
      )}

      <FormalSection title="Konfirmasi Kehadiran">
        <RSVPForm initialWishes={data.wishes} invitationId={invitationId} />
      </FormalSection>

      <FormalSection title="Penutup" tint>
        <Closing
          groomName={data.groomName}
          brideName={data.brideName}
          slug={data.slug}
          weddingDate={data.weddingDate}
          guestName={guestName}
          onReplay={scrollToContent}
        />
      </FormalSection>
    </div>
  );
}
