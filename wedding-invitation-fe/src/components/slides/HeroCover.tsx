"use client";

import SafeImage from "@/components/ui/SafeImage";
import { motion } from "framer-motion";
import { useCountdown } from "@/hooks/useCountdown";
type Props = {
  title: string;
  weddingDate: string;
  onOpen: () => void;
  heroImage?: string;
  accentColor?: string;
  guestName?: string;
};

export default function HeroCover({
  title,
  weddingDate,
  onOpen,
  heroImage,
  accentColor = "#D4AF37",
  guestName,
}: Props) {
  const formattedDate = new Date(weddingDate).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const countdown = useCountdown(weddingDate);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1 }}
        animate={{ scale: 1.12 }}
        transition={{
          duration: 20,
          ease: "linear",
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        <SafeImage
          src={heroImage || "/hero-default.jpg"}
          alt="Wedding hero"
          priority
          className="object-cover"
          variant="cover"
        />
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {guestName && (
        <motion.p
          className="text-white/85 text-sm tracking-wide mb-2"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        >
          Kepada Yth: {guestName}
        </motion.p>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-24 px-6 text-center">
        <motion.h1
          className="font-playfair text-4xl md:text-5xl text-white leading-tight tracking-wide"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
        >
          {title}
        </motion.h1>

        <motion.p
          className="mt-3 text-white/80 text-sm tracking-[0.2em] uppercase"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
        >
          {formattedDate}
        </motion.p>

        {countdown && (
          <motion.div
            className="mt-6 flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          >
            {[
              { label: "Hari", value: countdown.days },
              { label: "Jam", value: countdown.hours },
              { label: "Menit", value: countdown.minutes },
              { label: "Detik", value: countdown.seconds },
            ].map((u) => (
              <div key={u.label} className="flex flex-col items-center">
                <span
                  className="min-w-[48px] rounded-xl px-2 py-1.5 font-sans text-xl font-semibold tabular-nums text-white text-center backdrop-blur-sm"
                  style={{
                    border: `1px solid ${accentColor}59`,
                    background: "rgba(255,255,255,0.08)",
                  }}
                >
                  {String(u.value).padStart(2, "0")}
                </span>
                <span className="mt-1 font-sans text-[9px] tracking-[0.2em] uppercase text-white/60">
                  {u.label}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="relative z-50 mt-10 px-8 py-3 text-sm tracking-[0.25em] uppercase backdrop-blur-sm bg-white/10 hover:bg-white/20 transition-colors"
          style={{ border: `1px solid ${accentColor}`, color: accentColor }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9, ease: "easeOut" }}
        >
          <span
            className="absolute inset-0 rounded-sm animate-ping border opacity-60"
            style={{ borderColor: `${accentColor}4d` }}
          />
          Buka Undangan
        </motion.button>
      </div>
    </div>
  );
}
