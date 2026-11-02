"use client";

/**
 * MinimalistTemplate — typography-led, near-monochrome, airy scroll template:
 * no ornaments or illustrations, sections separated purely by whitespace and a
 * hairline rule, oversized numerals as section markers, generous letter-spacing.
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

const PAPER = "#FAFAF8";
const INK = "#17181A";

function Block({
  index,
  title,
  children,
  tint,
}: {
  index: string;
  title: string;
  children: React.ReactNode;
  tint?: boolean;
}) {
  return (
    <section
      className="min-h-screen flex items-center px-6 py-20"
      style={{ backgroundColor: tint ? "#F2F2F0" : PAPER }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full mx-auto"
      >
        <div className="flex items-baseline gap-4 border-b border-stone-300 pb-4 mb-10">
          <span
            className="font-sans text-5xl font-extralight leading-none select-none"
            style={{ color: `${INK}22` }}
            aria-hidden
          >
            {index}
          </span>
          <h2
            className="font-sans text-xs tracking-[0.35em] uppercase"
            style={{ color: INK }}
          >
            {title}
          </h2>
        </div>
        {children}
      </motion.div>
    </section>
  );
}

export default function MinimalistTemplate({
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
      className="h-screen w-full overflow-y-auto overflow-x-hidden"
      style={{
        ...fontVarsFor(theme?.fontPair),
        backgroundColor: PAPER,
        color: INK,
      } as React.CSSProperties}
    >
      <section className="min-h-screen relative" style={{ backgroundColor: PAPER }}>
        <HeroCover
          title={data.title}
          weddingDate={data.weddingDate}
          heroImage={heroImage}
          accentColor={accent}
          onOpen={scrollToContent}
          guestName={guestName}
        />
      </section>

      <Block index="01" title="Mempelai">
        <CoupleDetail groom={data.groom} bride={data.bride} accentColor={INK} />
      </Block>

      {data.weddingEvents.length > 0 && (
        <Block index="02" title="Acara" tint>
          <EventDetail
            weddingDate={data.weddingDate}
            weddingEvents={data.weddingEvents}
            accentColor={INK}
          />
        </Block>
      )}

      {data.events.length > 0 && (
        <Block index="03" title="Perjalanan">
          <LoveJourney events={data.events} accentColor={INK} />
        </Block>
      )}

      {data.gallery.length > 0 && (
        <Block index="04" title="Galeri" tint>
          <Gallery gallery={data.gallery} videoUrl={data.videoUrl} />
        </Block>
      )}

      {(data.bankAccounts.length > 0 || data.qrisAccounts.length > 0) && (
        <Block index="05" title="Amplop Digital">
          <DigitalGift bankAccounts={data.bankAccounts} qrisAccounts={data.qrisAccounts} />
        </Block>
      )}

      <Block index="06" title="RSVP &amp; Ucapan" tint>
        <div className="text-sm text-stone-500 mb-6">
          Mohon konfirmasi kehadiran Anda.
        </div>
        <RSVPForm initialWishes={data.wishes} invitationId={invitationId} />
      </Block>

      <Block index="07" title="Penutup">
        <Closing
          groomName={data.groomName}
          brideName={data.brideName}
          slug={data.slug}
          weddingDate={data.weddingDate}
          guestName={guestName}
          onReplay={scrollToContent}
        />
      </Block>
    </div>
  );
}
