"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, type Variants } from "framer-motion";
import AddToCalendarButton from "@/components/slides/AddToCalendarButton";

type Props = {
  groomName: string;
  brideName: string;
  slug?: string;
  guestName?: string;
  weddingDate: string;
  onReplay: () => void;
};
const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (delay: number) => ({
    opacity: 1,
    transition: { duration: 1.1, ease: "easeOut", delay },
  }),
};

const heartbeat: Variants = {
  rest: { scale: 1 },
  beat: {
    scale: [1, 1.06, 1, 1.04, 1],
    transition: {
      duration: 1.8,
      repeat: Infinity,
      repeatDelay: 1.6,
      ease: "easeInOut",
    },
  },
};

export default function Closing({
  groomName,
  brideName,
  slug,
  guestName,
  weddingDate,
  onReplay,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [copied, setCopied] = useState(false);

  const shareUrl = slug ? `${window.location.origin}/${slug}` : "";
  const whatsappText = encodeURIComponent(
    `Yuk hadiri pernikahan ${groomName} & ${brideName}! 🎉${shareUrl ? `\n\n${shareUrl}` : ""}`,
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
    <div
      ref={ref}
      className="relative h-full w-full overflow-hidden flex flex-col items-center justify-between py-14 px-6 text-center"
    >
      <div className="absolute inset-0">
        <Image
          src="/hero-default.jpg"
          alt="Background"
          fill
          className="object-cover scale-105"
          priority
        />
        <div className="absolute inset-0 bg-[#F8F5F2]/80 backdrop-blur-md" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-xs mx-auto flex-1 justify-center">
        <motion.div
          className="flex flex-col items-center gap-4"
          custom={0.2}
          variants={fadeIn}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <span className="block w-8 h-px bg-[#C9A96E]/60" />
          <p className="font-sans text-[10px] tracking-[0.28em] uppercase text-stone-400">
            Dengan segala kerendahan hati
          </p>
        </motion.div>

        {guestName && (
          <p className="font-sans text-xs tracking-wide text-stone-500">
            Kepada Yth: {guestName}
          </p>
        )}
        <motion.div
          variants={heartbeat}
          initial="rest"
          animate={inView ? "beat" : "rest"}
          className="flex flex-col items-center gap-3"
        >
          <motion.h2
            custom={0.4}
            variants={fadeIn}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="font-playfair text-2xl text-stone-800 leading-snug tracking-wide"
          >
            Terima kasih atas
            <br />
            doa &amp; restu Anda
          </motion.h2>
        </motion.div>

        <motion.div
          custom={0.65}
          variants={fadeIn}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="flex flex-col items-center gap-1"
        >
          <p className="font-playfair text-3xl text-stone-700 tracking-wider italic">
            {groomName} &amp; {brideName}
          </p>
          <span className="block w-8 h-px bg-[#C9A96E]/60 mt-2" />
        </motion.div>

        <motion.div
          custom={0.85}
          variants={fadeIn}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="flex flex-col items-center gap-3 w-full"
        >
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#25D366] text-white text-xs font-semibold tracking-widest uppercase transition-opacity hover:opacity-90"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-3.5 h-3.5"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.11 1.524 5.835L0 24l6.345-1.504A11.951 11.951 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-4.997-1.367l-.358-.213-3.767.893.952-3.667-.234-.376A9.786 9.786 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z" />
            </svg>
            Bagikan via WhatsApp
          </a>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-stone-300 text-stone-500 text-xs font-semibold tracking-widest uppercase hover:border-[#C9A96E] hover:text-[#C9A96E] transition-colors bg-white/60 backdrop-blur-sm"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-3.5 h-3.5"
            >
              {copied ? (
                <path
                  d="M20 6L9 17l-5-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                <>
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </>
              )}
            </svg>
            {copied ? "Tautan Tersalin" : "Salin Tautan"}
          </button>

          <AddToCalendarButton
            title={`Pernikahan ${groomName} & ${brideName}`}
            weddingDate={weddingDate}
            description="Acara pernikahan — lihat undangan digital untuk detail lokasi dan waktu."
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-stone-300 text-stone-500 text-xs font-semibold tracking-widest uppercase hover:border-[#C9A96E] hover:text-[#C9A96E] transition-colors bg-white/60 backdrop-blur-sm"
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              onReplay();
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-stone-300 text-stone-500 text-xs font-semibold tracking-widest uppercase hover:border-[#C9A96E] hover:text-[#C9A96E] transition-colors bg-white/60 backdrop-blur-sm"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="w-3.5 h-3.5"
            >
              <path d="M2 8a6 6 0 1 1 1.5 4" strokeLinecap="round" />
              <path
                d="M2 12V8h4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Putar Ulang
          </button>
        </motion.div>
      </div>

      <motion.div
        custom={1.1}
        variants={fadeIn}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="relative z-10 flex flex-col items-center gap-1"
      >
        <p className="font-sans text-[9px] tracking-[0.22em] uppercase text-stone-400">
          Dibuat dengan ❤ oleh
        </p>
        <Link
          href="/"
          onClick={(e) => e.stopPropagation()}
          className="font-playfair text-xs text-[#C9A96E] hover:underline italic"
        >
          Lovite.id
        </Link>
      </motion.div>
    </div>
  );
}
