"use client";

import { useState, useRef } from "react";
import SafeImage from "@/components/ui/SafeImage";
import { motion, AnimatePresence, useInView, type Variants } from "framer-motion";

type Props = {
  gallery: string[];
  videoUrl?: string;
  forceInView?: boolean;
};

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 1.04 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: "easeOut", delay: Math.min(i * 0.08, 0.4) },
  }),
};

function GImg({ src, index, shouldAnimate, onTap }: {
  src: string;
  index: number;
  shouldAnimate: boolean;
  onTap: (s: string) => void;
}) {
  return (
    <motion.div
      layoutId={`gallery-${src}`}
      custom={index}
      variants={itemVariants}
      initial="hidden"
      animate={shouldAnimate ? "visible" : "hidden"}
      className="relative w-full overflow-hidden cursor-zoom-in"
      style={{ flex: 1, minHeight: 0 }}
      onClick={(e) => { e.stopPropagation(); onTap(src); }}
    >
      <SafeImage src={src} alt={`Gallery ${index + 1}`} className="object-cover" sizes="50vw" variant="gallery" />
    </motion.div>
  );
}

function ColGroup({ images, startIndex, shouldAnimate, onTap, gap }: {
  images: string[];
  startIndex: number;
  shouldAnimate: boolean;
  onTap: (s: string) => void;
  gap: number;
}) {
  return (
    <div className="flex flex-col h-full" style={{ flex: 1, gap }}>
      {images.map((src, i) => (
        <GImg key={src} src={src} index={startIndex + i} shouldAnimate={shouldAnimate} onTap={onTap} />
      ))}
    </div>
  );
}

export default function Gallery({ gallery, videoUrl, forceInView }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const shouldAnimate = forceInView || inView;

  const images = gallery.slice(0, 10);
  const n = images.length;
  const gap = n <= 4 ? 4 : 2;

  const leftCount = Math.floor(n / 2);
  const left = images.slice(0, leftCount);
  const right = images.slice(leftCount);

  return (
    <div className="relative h-full w-full bg-[#F8F5F2] flex flex-col px-4 pt-8 pb-4 gap-3 overflow-hidden">
      <motion.p
        className="font-playfair text-center text-xs tracking-[0.3em] text-stone-400 uppercase shrink-0"
        initial={{ opacity: 0 }}
        animate={shouldAnimate ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        Captured Memories
      </motion.p>

      <div ref={ref} className="flex-1 min-h-0">
        {n === 0 && (
          <div className="flex items-center justify-center h-full text-stone-400 text-sm">
            {videoUrl ? (
              <video src={videoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover rounded-lg" />
            ) : "No photos"}
          </div>
        )}

        {n === 1 && (
          <div className="relative w-full h-full rounded-lg overflow-hidden">
            <GImg src={images[0]} index={0} shouldAnimate={shouldAnimate} onTap={setLightbox} />
          </div>
        )}

        {n >= 2 && (
          <div className="flex h-full" style={{ gap }}>
            <ColGroup images={left} startIndex={0} shouldAnimate={shouldAnimate} onTap={setLightbox} gap={gap} />
            <ColGroup images={right} startIndex={leftCount} shouldAnimate={shouldAnimate} onTap={setLightbox} gap={gap} />
          </div>
        )}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <motion.div
              layoutId={`gallery-${lightbox}`}
              className="relative w-[90vw] h-[80vh] rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <SafeImage src={lightbox} alt="Lightbox" className="object-contain" sizes="90vw" variant="gallery" />
            </motion.div>
            <button
              className="absolute top-5 right-5 text-white/70 hover:text-white text-3xl leading-none"
              onClick={() => setLightbox(null)}
              aria-label="Close"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
