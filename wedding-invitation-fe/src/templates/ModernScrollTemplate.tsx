"use client";

import React, { useRef } from "react";
import SafeImage from "@/components/ui/SafeImage";
import { motion } from "framer-motion";
import { MapPin, Clock, Calendar, Copy, Check } from "lucide-react";
import { useState } from "react";
import { type TemplateProps } from "./types";
import { type WeddingEvent } from "@/hooks/useInvitation";
import { useCountdown, type Countdown } from "@/hooks/useCountdown";
import RSVPForm from "@/components/slides/RSVPForm";
import AddToCalendarButton from "@/components/slides/AddToCalendarButton";
import { COLOR_SCHEME_MAP, DEFAULT_ACCENT, fontVarsFor } from "@/lib/theme";
import { formatInvitationDate } from "@/lib/invitation-display";

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.65, ease: "easeOut" as const, delay },
  };
}
function CountdownUnits({
  countdown,
  accent,
  light,
}: {
  countdown: Countdown;
  accent: string;
  light?: boolean;
}) {
  const units = [
    { label: "Hari", value: countdown.days },
    { label: "Jam", value: countdown.hours },
    { label: "Menit", value: countdown.minutes },
    { label: "Detik", value: countdown.seconds },
  ];
  return (
    <div className="flex items-center justify-center gap-2">
      {units.map((u) => (
        <div key={u.label} className="flex flex-col items-center">
          <span
            className="min-w-[52px] rounded-xl px-2 py-2 font-sans text-2xl font-semibold tabular-nums text-center"
            style={{
              border: `1px solid ${light ? "rgba(255,255,255,0.35)" : `${accent}59`}`,
              color: light ? "#fff" : accent,
              background: light ? "rgba(255,255,255,0.08)" : "transparent",
            }}
          >
            {String(u.value).padStart(2, "0")}
          </span>
          <span
            className="mt-1 font-sans text-[9px] tracking-[0.2em] uppercase"
            style={{ color: light ? "rgba(255,255,255,0.6)" : "#78716c" }}
          >
            {u.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function CountdownInline({
  weddingDate,
  accent,
  className,
}: {
  weddingDate: string;
  accent: string;
  className?: string;
}) {
  const countdown = useCountdown(weddingDate);
  if (!countdown) return null;
  return (
    <div className={className}>
      <CountdownUnits countdown={countdown} accent={accent} light />
    </div>
  );
}

function HeroSection({
  data,
  heroImage,
  accent,
  onScroll,
  guestName,
}: {
  data: TemplateProps["data"];
  heroImage?: string;
  accent: string;
  onScroll: () => void;
  guestName?: string;
}) {
  return (
    <section className="relative h-screen flex flex-col items-center justify-center shrink-0 snap-start overflow-hidden">
      {heroImage ? (
        <>
          <div className="absolute inset-0">
            <SafeImage
              src={heroImage}
              alt="Cover"
              className="object-cover"
              sizes="100vw"
              variant="cover"
              priority
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>
          <div className="relative z-10 text-center px-8">
            <motion.p
              {...fadeUp(0)}
              className="font-sans text-xs tracking-[0.35em] uppercase text-white/60 mb-2"
            >
              The Wedding of
            </motion.p>
            {guestName && (
              <motion.p
                {...fadeUp(0.05)}
                className="font-sans text-sm text-white/80 mb-4"
              >
                Kepada Yth: {guestName}
              </motion.p>
            )}
            <motion.h1
              {...fadeUp(0.1)}
              className="font-playfair text-5xl text-white leading-tight mb-2"
            >
              {data.groomName}
            </motion.h1>
            <motion.p
              {...fadeUp(0.15)}
              className="font-playfair text-2xl text-white/60 italic mb-1"
            >
              &amp;
            </motion.p>
            <motion.h1
              {...fadeUp(0.2)}
              className="font-playfair text-5xl text-white leading-tight mb-6"
            >
              {data.brideName}
            </motion.h1>
            <motion.p
              {...fadeUp(0.3)}
              className="font-sans text-xs tracking-[0.25em] uppercase mb-8"
              style={{ color: accent }}
            >
              {formatInvitationDate(data.weddingDate, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </motion.p>
            <CountdownInline
              weddingDate={data.weddingDate}
              accent={accent}
              className="mb-8"
            />
            <motion.button
              {...fadeUp(0.4)}
              onClick={onScroll}
              className="px-8 py-3 rounded-full text-xs font-semibold tracking-[0.2em] uppercase border border-white/40 text-white backdrop-blur-sm hover:bg-white/10 transition-colors"
            >
              Buka Undangan
            </motion.button>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 bg-[#1A1A1A]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(201,169,110,0.08)_0%,_transparent_70%)]" />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-8">
            <motion.p
              {...fadeUp(0)}
              className="font-sans text-xs tracking-[0.35em] uppercase text-white/40 mb-4"
            >
              The Wedding of
            </motion.p>
            {guestName && (
              <motion.p
                {...fadeUp(0.05)}
                className="font-sans text-sm text-white/80 mb-4"
              >
                Kepada Yth: {guestName}
              </motion.p>
            )}
            <motion.h1
              {...fadeUp(0.1)}
              className="font-playfair text-5xl text-white leading-tight mb-2"
            >
              {data.groomName}
            </motion.h1>
            <motion.p
              {...fadeUp(0.15)}
              className="font-playfair text-2xl italic mb-1"
              style={{ color: accent }}
            >
              &amp;
            </motion.p>
            <motion.h1
              {...fadeUp(0.2)}
              className="font-playfair text-5xl text-white leading-tight mb-6"
            >
              {data.brideName}
            </motion.h1>
            <motion.p
              {...fadeUp(0.3)}
              className="font-sans text-xs tracking-[0.25em] uppercase mb-8"
              style={{ color: accent }}
            >
              {formatInvitationDate(data.weddingDate, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </motion.p>
            <CountdownInline
              weddingDate={data.weddingDate}
              accent={accent}
              className="mb-8"
            />
            <motion.button
              {...fadeUp(0.4)}
              onClick={onScroll}
              className="px-8 py-3 rounded-full text-xs font-semibold tracking-[0.2em] uppercase border text-white hover:bg-white/5 transition-colors"
              style={{ borderColor: `${accent}60` }}
            >
              Buka Undangan
            </motion.button>
          </div>
        </div>
      )}

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="w-5 h-5 text-white/40"
        >
          <path d="M3 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </section>
  );
}

function CoupleSection({
  data,
  accent,
}: {
  data: TemplateProps["data"];
  accent: string;
}) {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center snap-start bg-[#F8F5F2] px-8 py-16">
      <motion.p
        {...fadeUp(0)}
        className="font-sans text-xs tracking-[0.3em] uppercase mb-8"
        style={{ color: accent }}
      >
        Mempelai
      </motion.p>

      <div className="flex flex-col sm:flex-row gap-10 sm:gap-16 items-center w-full max-w-lg">
        {[data.groom, data.bride].map((person, idx) => (
          <motion.div
            key={idx}
            {...fadeUp(idx * 0.15)}
            className="flex flex-col items-center text-center flex-1"
          >
            <div
              className="relative w-28 h-28 rounded-full overflow-hidden bg-stone-200 mb-4 ring-2 ring-offset-4 ring-offset-[#F8F5F2]"
              style={{ "--tw-ring-color": accent } as React.CSSProperties}
            >
              {person.photo ? (
                <SafeImage
                  src={person.photo}
                  alt={person.fullName}
                  className="object-cover"
                  sizes="112px"
                  variant="photo"
                />
              ) : (
                <SafeImage
                  src=""
                  alt={person.fullName}
                  sizes="112px"
                  variant={idx === 0 ? "groom" : "bride"}
                />
              )}
            </div>
            <p className="font-playfair text-xl text-stone-800 leading-snug">
              {person.fullName}
            </p>
            <p className="font-sans text-xs text-stone-400 mt-1 leading-relaxed">
              {person.order}
            </p>
            <p className="font-sans text-xs text-stone-500 mt-1">
              {person.fatherName}
            </p>
            <p className="font-sans text-xs text-stone-500">
              &amp; {person.motherName}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function JourneySection({
  data,
  accent,
}: {
  data: TemplateProps["data"];
  accent: string;
}) {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center snap-start bg-[#1A1A1A] px-8 py-16">
      <motion.p
        {...fadeUp(0)}
        className="font-sans text-xs tracking-[0.3em] uppercase mb-10"
        style={{ color: accent }}
      >
        Our Story
      </motion.p>
      <div className="relative w-full max-w-sm">
        <div
          className="absolute left-4 top-0 bottom-0 w-px"
          style={{ background: `${accent}30` }}
        />
        <div className="space-y-8">
          {data.events.map((event, i) => (
            <motion.div key={i} {...fadeUp(i * 0.1)} className="pl-12 relative">
              <div
                className="absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: accent }}
              >
                {event.year.slice(-2)}
              </div>
              <p className="font-playfair text-base text-white leading-tight">
                {event.title}
              </p>
              <p className="font-sans text-xs text-white/50 mt-1 leading-relaxed">
                {event.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EventCard({ event, accent }: { event: WeddingEvent; accent: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 space-y-3">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}15` }}
        >
          <Calendar className="w-4 h-4" style={{ color: accent }} />
        </div>
        <p className="font-playfair text-base text-stone-800">{event.title}</p>
      </div>
      <div className="flex items-start gap-2 text-stone-500">
        <Clock
          className="w-3.5 h-3.5 mt-0.5 shrink-0"
          style={{ color: accent }}
        />
        <span className="font-sans text-xs">{event.time}</span>
      </div>
      <div className="flex items-start gap-2 text-stone-500">
        <MapPin
          className="w-3.5 h-3.5 mt-0.5 shrink-0"
          style={{ color: accent }}
        />
        <div>
          <p className="font-sans text-xs font-semibold text-stone-700">
            {event.locationName}
          </p>
          <p className="font-sans text-xs">{event.address}</p>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <a
          href={event.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-2 rounded-xl text-center text-xs font-semibold text-white transition-colors"
          style={{ background: accent }}
        >
          Buka Maps
        </a>
        <button
          onClick={() => {
            navigator.clipboard.writeText(event.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="px-3 py-2 rounded-xl border border-stone-200 text-stone-500 hover:border-stone-300 transition-colors"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

function EventsSection({
  data,
  accent,
}: {
  data: TemplateProps["data"];
  accent: string;
}) {
  const dateStr = formatInvitationDate(data.weddingDate, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <section className="min-h-screen flex flex-col items-center justify-center snap-start bg-[#F8F5F2] px-6 py-16">
      <motion.p
        {...fadeUp(0)}
        className="font-sans text-xs tracking-[0.3em] uppercase mb-1"
        style={{ color: accent }}
      >
        Detail Acara
      </motion.p>
      <motion.p
        {...fadeUp(0.05)}
        className="font-playfair text-sm text-stone-500 mb-8"
      >
        {dateStr}
      </motion.p>
      <div className="w-full max-w-sm space-y-4">
        {data.weddingEvents.map((event, i) => (
          <motion.div key={i} {...fadeUp(i * 0.12)}>
            <EventCard event={event} accent={accent} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function GallerySection({
  data,
  accent,
}: {
  data: TemplateProps["data"];
  accent: string;
}) {
  const images = data.gallery.slice(0, 10);
  const n = images.length;
  const leftCount = Math.floor(n / 2);
  const left = images.slice(0, leftCount);
  const right = images.slice(leftCount);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center snap-start bg-[#1A1A1A] px-4 py-16">
      <motion.p
        {...fadeUp(0)}
        className="font-sans text-xs tracking-[0.3em] uppercase mb-8"
        style={{ color: accent }}
      >
        Captured Memories
      </motion.p>
      {n === 0 ? (
        <div className="w-full max-w-sm flex-1 grid grid-cols-2 gap-1" style={{ minHeight: 360 }}>
          <div className="relative rounded-xl overflow-hidden">
            <SafeImage src="/defaults/gallery-1.jpg" alt="Gallery 1" className="object-cover" sizes="300px" variant="gallery" />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <SafeImage src="/defaults/gallery-2.jpg" alt="Gallery 2" className="object-cover" sizes="300px" variant="gallery-alt" />
          </div>
        </div>
      ) : (
        <div
          className="w-full max-w-sm flex-1 flex"
          style={{ gap: 4, minHeight: 360 }}
        >
          {n === 1 ? (
            <div className="relative flex-1 rounded-xl overflow-hidden">
              <SafeImage
                src={images[0]}
                alt="Gallery 1"
                className="object-cover"
                sizes="300px"
                variant="gallery"
              />
            </div>
          ) : (
            <>
              <div className="flex flex-col flex-1" style={{ gap: 4 }}>
                {left.map((src, i) => (
                  <motion.div
                    key={src}
                    {...fadeUp(i * 0.08)}
                    className="relative rounded-xl overflow-hidden"
                    style={{ flex: 1, minHeight: 0 }}
                  >
                    <SafeImage
                      src={src}
                      alt={`Gallery ${i + 1}`}
                      className="object-cover"
                      sizes="150px"
                      variant="gallery"
                    />
                  </motion.div>
                ))}
              </div>
              <div className="flex flex-col flex-1" style={{ gap: 4 }}>
                {right.map((src, i) => (
                  <motion.div
                    key={src}
                    {...fadeUp(i * 0.08 + 0.1)}
                    className="relative rounded-xl overflow-hidden"
                    style={{ flex: 1, minHeight: 0 }}
                  >
                    <SafeImage
                      src={src}
                      alt={`Gallery ${leftCount + i + 1}`}
                      className="object-cover"
                      sizes="150px"
                      variant="gallery"
                    />
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function GiftSection({
  data,
  accent,
}: {
  data: TemplateProps["data"];
  accent: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  if (data.bankAccounts.length === 0 && data.qrisAccounts.length === 0)
    return null;

  return (
    <section className="min-h-screen flex flex-col items-center justify-center snap-start bg-[#F8F5F2] px-6 py-16">
      <motion.p
        {...fadeUp(0)}
        className="font-sans text-xs tracking-[0.3em] uppercase mb-2"
        style={{ color: accent }}
      >
        Amplop Digital
      </motion.p>
      <motion.p
        {...fadeUp(0.05)}
        className="font-playfair text-sm text-stone-400 italic mb-8"
      >
        Doa &amp; restu adalah hadiah terbaik
      </motion.p>
      <div className="w-full max-w-sm space-y-3">
        {data.bankAccounts.map((acc, i) => (
          <motion.div
            key={i}
            {...fadeUp(i * 0.1)}
            className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-sans text-xs text-stone-400 uppercase tracking-widest">
                {acc.bankName}
              </span>
            </div>
            <p className="font-sans text-lg font-semibold text-stone-800 tracking-widest mt-1">
              {acc.accountNumber}
            </p>
            <p className="font-sans text-xs text-stone-500 mt-0.5">
              a/n {acc.accountHolder}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(acc.accountNumber);
                setCopied(acc.accountNumber);
                setTimeout(() => setCopied(null), 2000);
              }}
              className="mt-3 w-full py-2 rounded-xl text-xs font-semibold tracking-widest uppercase transition-colors text-white"
              style={{ background: accent }}
            >
              {copied === acc.accountNumber ? "✓ Tersalin" : "Salin Nomor"}
            </button>
          </motion.div>
        ))}
        {data.qrisAccounts.map((qris, i) => (
          <motion.div
            key={i}
            {...fadeUp(i * 0.1 + 0.15)}
            className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm"
          >
            <p className="font-sans text-xs text-stone-400 uppercase tracking-widest mb-3">
              {qris.name}
            </p>
            {qris.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qris.imageUrl}
                alt={`QRIS ${qris.name}`}
                className="w-full h-48 object-contain rounded-xl bg-stone-50"
              />
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ClosingSection({
  data,
  accent,
  onReplay,
  guestName,
}: {
  data: TemplateProps["data"];
  accent: string;
  onReplay: () => void;
  guestName?: string;
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl = data.slug ? `${window.location.origin}/${data.slug}` : "";
  const whatsappText = encodeURIComponent(
    `Yuk hadiri pernikahan ${data.groomName} & ${data.brideName}! 🎉${shareUrl ? `\n\n${shareUrl}` : ""}`,
  );

  async function handleCopy(e: React.MouseEvent) {
    if (!shareUrl) return;
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — leave button inert
    }
  }

  return (
    <section className="min-h-screen flex flex-col items-center justify-center snap-start bg-[#1A1A1A] px-8 py-16 text-center">
      <motion.div
        {...fadeUp(0)}
        className="w-16 h-px mb-10"
        style={{ background: accent }}
      />
      <motion.p
        {...fadeUp(0.05)}
        className="font-sans text-xs tracking-[0.3em] uppercase mb-4"
        style={{ color: accent }}
      >
        Terima Kasih
      </motion.p>
      {guestName && (
        <motion.p
          {...fadeUp(0.15)}
          className="font-sans text-sm text-white/80 mb-2"
        >
          Kepada Yth: {guestName}
        </motion.p>
      )}
      <motion.h2
        {...fadeUp(0.1)}
        className="font-playfair text-3xl text-white leading-snug mb-2"
      >
        {data.groomName}
      </motion.h2>
      <motion.p
        {...fadeUp(0.15)}
        className="font-playfair text-lg italic mb-2"
        style={{ color: accent }}
      >
        &amp;
      </motion.p>
      <motion.h2
        {...fadeUp(0.2)}
        className="font-playfair text-3xl text-white leading-snug mb-8"
      >
        {data.brideName}
      </motion.h2>
      <motion.p
        {...fadeUp(0.3)}
        className="font-sans text-xs text-white/40 leading-relaxed max-w-xs mb-10"
      >
        Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila
        Bapak/Ibu/Saudara/i berkenan hadir.
      </motion.p>
      <motion.div {...fadeUp(0.4)} className="flex flex-col items-center gap-3">
        <a
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#25D366] text-white text-xs font-semibold tracking-[0.2em] uppercase transition-opacity hover:opacity-90"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.11 1.524 5.835L0 24l6.345-1.504A11.951 11.951 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-4.997-1.367l-.358-.213-3.767.893.952-3.667-.234-.376A9.786 9.786 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z" />
          </svg>
          Bagikan via WhatsApp
        </a>
        <button
          onClick={handleCopy}
          className="px-6 py-2.5 rounded-full text-xs font-semibold tracking-[0.2em] uppercase border transition-colors text-white/60 hover:text-white"
          style={{ borderColor: `${accent}40` }}
        >
          {copied ? "Tautan Tersalin" : "Salin Tautan"}
        </button>
        <AddToCalendarButton
          title={`Pernikahan ${data.groomName} & ${data.brideName}`}
          weddingDate={data.weddingDate}
          description="Acara pernikahan — lihat undangan digital untuk detail lokasi dan waktu."
          className="px-6 py-2.5 rounded-full text-xs font-semibold tracking-[0.2em] uppercase border transition-colors text-white/60 hover:text-white inline-flex items-center gap-2"
        />
        <button
          onClick={onReplay}
          className="px-6 py-2.5 rounded-full text-xs font-semibold tracking-[0.2em] uppercase border transition-colors text-white/60 hover:text-white"
          style={{ borderColor: `${accent}40` }}
        >
          Putar Ulang
        </button>
      </motion.div>
    </section>
  );
}

export default function ModernScrollTemplate({
  data,
  heroImage,
  theme,
  invitationId,
  guestName,
}: TemplateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLDivElement>(null);
  const accent = COLOR_SCHEME_MAP[theme?.colorScheme] ?? DEFAULT_ACCENT;

  function scrollToContent() {
    sectionsRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function scrollToTop() {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div
      ref={containerRef}
      className="h-full min-h-full w-full overflow-y-auto overflow-x-hidden"
      style={{ ...fontVarsFor(theme?.fontPair), scrollSnapType: "y mandatory" } as React.CSSProperties}
    >
      <HeroSection
        data={data}
        heroImage={heroImage}
        accent={accent}
        onScroll={scrollToContent}
        guestName={guestName}
      />
      <div ref={sectionsRef}>
        <CoupleSection data={data} accent={accent} />
        <JourneySection data={data} accent={accent} />
        <EventsSection data={data} accent={accent} />
        <GallerySection data={data} accent={accent} />
        <section className="min-h-screen snap-start">
          <RSVPForm initialWishes={data.wishes} invitationId={invitationId} />
        </section>
        {(data.bankAccounts.length > 0 || data.qrisAccounts.length > 0) && (
          <GiftSection data={data} accent={accent} />
        )}
        <ClosingSection
          data={data}
          accent={accent}
          onReplay={scrollToTop}
          guestName={guestName}
        />
      </div>
    </div>
  );
}
