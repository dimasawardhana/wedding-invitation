"use client";

import { useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import { WeddingEvent } from "@/hooks/useInvitation";
import { formatInvitationDate } from "@/lib/invitation-display";

type Props = {
  weddingDate: string;
  weddingEvents: WeddingEvent[];
  accentColor?: string;
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", delay: i * 0.3 },
  }),
};

function RingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 8V5m0 14v-3M8 12H5m14 0h-3" strokeLinecap="round" />
      <circle cx="12" cy="12" r="9" strokeDasharray="2 3" />
    </svg>
  );
}

function ToastIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path d="M8 22V12M16 22V12" strokeLinecap="round" />
      <path d="M5 12c0-2.5 2-4 4-5l3-5 3 5c2 1 4 2.5 4 5H5Z" strokeLinejoin="round" />
    </svg>
  );
}

type CardProps = {
  event: WeddingEvent;
  index: number;
  inView: boolean;
  accentColor: string;
};

function EventCard({ event, index, inView, accentColor }: CardProps) {
  const isAkad = event.type === "akad";

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className="bg-white rounded-xl shadow-sm border border-stone-100 px-5 py-5 flex flex-col gap-3"
    >
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${accentColor}1a`, color: accentColor }}>
          {isAkad ? <RingIcon /> : <ToastIcon />}
        </span>
        <div>
          <h3 className="font-playfair text-lg font-bold text-stone-800 leading-tight">
            {event.title}
          </h3>
          <p className="font-sans text-xs text-[#C9A96E] font-semibold tracking-widest uppercase mt-0.5">
            {event.time}
          </p>
        </div>
      </div>

      <div className="border-t border-stone-100 pt-3 flex flex-col gap-0.5">
        <p className="font-sans text-sm font-semibold text-stone-700">{event.locationName || "Lokasi akan diumumkan"}</p>
        {event.address && <p className="font-sans text-xs text-stone-400 leading-relaxed">{event.address}</p>}
      </div>

      {event.mapsUrl && <a
        href={event.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="relative z-50 mt-1 inline-flex items-center justify-center gap-2 bg-[#C9A96E] hover:bg-[#b8945a] text-white text-xs font-semibold tracking-widest uppercase px-5 py-2.5 rounded-full transition-colors self-start"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
        Lihat di Maps
      </a>}
    </motion.div>
  );
}

export default function EventDetail({ weddingDate, weddingEvents, accentColor = "#C9A96E" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const formatted = formatInvitationDate(weddingDate, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="h-full w-full bg-[#F8F5F2] flex flex-col items-center justify-center px-5 py-10">
      <motion.div
        ref={ref}
        className="w-full max-w-sm flex flex-col gap-5"
      >
        <div className="text-center mb-1">
          <motion.h2
            className="font-playfair text-2xl text-stone-800 tracking-wide"
            initial={{ opacity: 0, y: -14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            Rangkaian Acara
          </motion.h2>
          <motion.p
            className="font-sans text-xs text-stone-400 tracking-[0.18em] uppercase mt-1"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          >
            {formatted}
          </motion.p>
        </div>

        {weddingEvents.map((event, i) => (
          <EventCard key={event.type} event={event} index={i} inView={inView} accentColor={accentColor} />
        ))}
      </motion.div>
    </div>
  );
}
