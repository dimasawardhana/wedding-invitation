"use client";

import { useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import { TimelineEvent } from "@/hooks/useInvitation";

type Props = {
  events: TimelineEvent[];
  accentColor?: string;
};

const cardVariants: Variants = {
  hidden: (side: "left" | "right") => ({
    opacity: 0,
    x: side === "left" ? -40 : 40,
  }),
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const dotVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.22, delayChildren: 0.4 },
  },
};

type EventRowProps = {
  event: TimelineEvent;
  index: number;
};

function EventRow({ event, index }: EventRowProps) {
  const side = index % 2 === 0 ? "left" : "right";
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="relative grid grid-cols-[1fr_28px_1fr] items-center gap-x-3">
      <motion.div
        custom={side}
        variants={cardVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className={`${side === "left" ? "text-right col-start-1" : "col-start-3 text-left"}`}
      >
        <span className="block text-[11px] font-bold tracking-[0.18em] text-[#C9A96E] mb-0.5">
          {event.year}
        </span>
        <span className="block font-playfair text-base font-semibold text-stone-800 leading-snug">
          {event.title}
        </span>
        <span className="block font-sans text-xs font-light text-stone-500 mt-1 leading-relaxed">
          {event.desc}
        </span>
      </motion.div>

      {side === "right" && <div className="col-start-1" />}

      <div className="col-start-2 flex justify-center">
        <motion.div
          variants={dotVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="w-3 h-3 rounded-full bg-[#C9A96E] ring-2 ring-[#F8F5F2] ring-offset-1 ring-offset-[#C9A96E] z-10"
        />
      </div>

      {side === "left" && <div className="col-start-3" />}
    </div>
  );
}

export default function LoveJourney({ events }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: "-80px" });

  return (
    <div className="relative h-full w-full bg-[#F8F5F2] overflow-hidden flex flex-col">
      <motion.div
        className="absolute inset-0 bg-[url('/hero-default.jpg')] bg-cover bg-center opacity-[0.04]"
        initial={{ y: 0 }}
        animate={inView ? { y: -24 } : { y: 0 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />

      <div className="relative z-10 flex flex-col h-full px-4 pt-10 pb-6 overflow-y-auto scrollbar-none">
        <motion.h2
          className="font-playfair text-2xl text-stone-800 text-center mb-1 tracking-wide"
          initial={{ opacity: 0, y: -16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          Our Love Journey
        </motion.h2>
        <motion.p
          className="font-sans text-xs text-stone-400 text-center tracking-[0.18em] uppercase mb-8"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        >
          The story so far
        </motion.p>

        <div ref={containerRef} className="relative flex-1">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-[#C9A96E]/20" />

          <motion.div
            ref={lineRef}
            className="absolute left-1/2 -translate-x-1/2 top-0 w-[1px] bg-[#C9A96E] origin-top"
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{ duration: 1.6, ease: "easeInOut", delay: 0.3 }}
            style={{ height: "100%" }}
          />

          <motion.div
            className="relative z-10 flex flex-col gap-8 pb-4"
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            {events.map((event, i) => (
              <EventRow key={event.year} event={event} index={i} />
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
