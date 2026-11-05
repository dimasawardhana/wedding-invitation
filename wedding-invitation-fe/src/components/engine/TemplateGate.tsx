"use client";

/**
 * TemplateGate — a per-template opening ritual rendered as an overlay above
 * the template content. Content stays mounted underneath (DOM text remains
 * available for tests) but is visually covered until the guest performs the
 * template's signature opening gesture.
 *
 * Variants:
 *  - envelope: 3D envelope — flap opens, card rises (Modern Scroll)
 *  - arch:     ornamental emerald doors part sideways (Islamic)
 *  - seal:     kraft paper with a wax seal to crack (Rustic)
 *  - gatefold: ceremonial double doors swing open on gold hinges (Classic)
 *  - gesture:  no UI chrome — blur-to-focus on any input (Minimalist)
 */

import { useState } from "react";
import { motion } from "framer-motion";

export type GateVariant = "envelope" | "arch" | "seal" | "gatefold" | "gesture";

type Props = {
  variant: GateVariant;
  accent: string;
  names: string;
  date?: string;
  onOpen?: () => void;
};

/* ---------------------------------- Envelope ---------------------------------- */

function EnvelopeGate({ accent, names, date, onOpen }: Props) {
  const [opening, setOpening] = useState(false);

  function open() {
    if (opening) return;
    setOpening(true);
    onOpen?.();
  }

  return (
    <motion.div
      data-gate
      onClick={open}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden cursor-pointer"
      style={{ background: "radial-gradient(ellipse at 50% 35%, #2b2823 0%, #15140f 70%)" }}
      animate={opening ? { opacity: 0, scale: 1.08 } : { opacity: 1 }}
      transition={{ delay: opening ? 1.3 : 0, duration: 0.8, ease: "easeInOut" }}
    >
      <div className="relative" style={{ perspective: 900 }}>
        {/* envelope back */}
        <div
          className="relative w-[280px] h-[185px] rounded-lg overflow-hidden shadow-2xl"
          style={{ background: "linear-gradient(160deg, #3a352c, #241f18)", border: `1px solid ${accent}44` }}
        >
          {/* letter */}
          <motion.div
            className="absolute inset-x-4 top-3 bottom-3 rounded bg-[#FBF7EF] flex flex-col items-center justify-center gap-1 shadow-lg"
            initial={{ y: 24, opacity: 0 }}
            animate={opening ? { y: -150, opacity: 1, scale: 1.12 } : { y: 24, opacity: 0 }}
            transition={opening ? { delay: 0.55, duration: 0.7, ease: "easeOut" } : { duration: 0.3 }}
          >
            <span className="font-playfair text-lg text-stone-800 text-center px-4 leading-snug">{names}</span>
            {date && (
              <span className="font-sans text-[10px] tracking-[0.25em] uppercase text-stone-400">{date}</span>
            )}
            <span className="mt-1 h-px w-10" style={{ backgroundColor: `${accent}88` }} />
            <span className="font-sans text-[9px] tracking-[0.3em] uppercase mt-1" style={{ color: accent }}>
              Undangan
            </span>
          </motion.div>
        </div>

        {/* front pocket */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[62%] rounded-b-lg"
          style={{
            background: "linear-gradient(200deg, #453e31, #2b261e)",
            clipPath: "polygon(0 22%, 50% 0, 100% 22%, 100% 100%, 0 100%)",
            border: `1px solid ${accent}33`,
            borderTop: "none",
          }}
        />
        {/* flap */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-[52%] origin-top"
          style={{
            background: "linear-gradient(180deg, #4a4335, #35301f)",
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            backfaceVisibility: "hidden",
            zIndex: 20,
          }}
          animate={opening ? { rotateX: -170, zIndex: 0 } : { rotateX: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        />
        {/* wax medallion */}
        <motion.div
          className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center z-30 shadow-lg"
          style={{ background: `radial-gradient(circle at 35% 30%, ${accent}, ${accent}99)` }}
          animate={opening ? { scale: 0, opacity: 0, rotate: 90 } : { scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-[#15140f] font-playfair text-sm font-bold">&amp;</span>
        </motion.div>
      </div>

      <motion.p
        className="mt-10 font-sans text-[10px] tracking-[0.35em] uppercase text-white/40"
        animate={{ opacity: [0.25, 0.7, 0.25] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      >
        Ketuk amplop untuk membuka
      </motion.p>
    </motion.div>
  );
}

/* ------------------------------------ Arch ------------------------------------ */

function ArchGate({ accent, names, date, onOpen }: Props) {
  const [opening, setOpening] = useState(false);
  const EMERALD = "#1E5C4A";

  function open() {
    if (opening) return;
    setOpening(true);
    onOpen?.();
  }

  const panelBase =
    "absolute top-0 bottom-0 w-1/2 overflow-hidden";

  return (
    <motion.div
      data-gate
      className="absolute inset-0 z-50 overflow-hidden"
      style={{ perspective: 1200 }}
      animate={opening ? { opacity: 0 } : { opacity: 1 }}
      transition={{ delay: opening ? 0.9 : 0, duration: 0.6 }}
      onClick={open}
    >
      {/* backdrop visible once doors part */}
      <div className="absolute inset-0" style={{ backgroundColor: "#FBF7EF" }} />

      {/* left door */}
      <motion.div
        className={panelBase}
        style={{ left: 0, transformOrigin: "left center" }}
        animate={opening ? { x: "-100%", rotateY: 18 } : { x: 0 }}
        transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
      >
        <div
          className="h-full w-full rounded-tr-[3.5rem] flex items-center justify-center"
          style={{
            background: `linear-gradient(120deg, #17493a, ${EMERALD} 45%, #153f33)`,
            borderRight: `1px solid ${accent}66`,
          }}
        >
          <motion.svg
            viewBox="0 0 24 24"
            className="w-10 h-10"
            style={{ color: `${accent}cc` }}
            fill="currentColor"
            animate={{ y: [0, -5, 0], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2z" opacity={0.8} />
          </motion.svg>
        </div>
      </motion.div>

      {/* right door */}
      <motion.div
        className={panelBase}
        style={{ right: 0, transformOrigin: "right center" }}
        animate={opening ? { x: "100%", rotateY: -18 } : { x: 0 }}
        transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
      >
        <div
          className="h-full w-full rounded-tl-[3.5rem] flex flex-col items-center justify-center gap-3 px-8 text-center"
          style={{
            background: `linear-gradient(240deg, #17493a, ${EMERALD} 45%, #153f33)`,
            borderLeft: `1px solid ${accent}66`,
          }}
        >
          <p className="font-sans text-sm tracking-[0.3em]" style={{ color: `${accent}dd` }}>
            بِسْمِ اللَّهِ
          </p>
          <p className="font-playfair text-xl text-[#FBF7EF] leading-snug">{names}</p>
          {date && (
            <p className="font-sans text-[10px] tracking-[0.25em] uppercase" style={{ color: `${accent}bb` }}>
              {date}
            </p>
          )}
        </div>
      </motion.div>

      {/* hint */}
      <motion.p
        className="absolute bottom-8 left-1/2 -translate-x-1/2 font-sans text-[10px] tracking-[0.35em] uppercase z-10"
        style={{ color: `${accent}88` }}
        animate={opening ? { opacity: 0 } : { opacity: [0.3, 0.8, 0.3] }}
        transition={opening ? { duration: 0.3 } : { duration: 2.4, repeat: Infinity }}
      >
        Buka pintu
      </motion.p>
    </motion.div>
  );
}

/* ------------------------------------ Seal ------------------------------------ */

function SealGate({ names, date, onOpen }: Props) {
  const [cracking, setCracking] = useState(false);
  const [opening, setOpening] = useState(false);
  const KRAFT = "#E6D7C1";
  const BARK = "#4E3B2A";
  const WAX = "#8C3A2B";

  function open() {
    if (cracking) return;
    setCracking(true);
    setTimeout(() => {
      setOpening(true);
      onOpen?.();
    }, 700);
  }

  return (
    <motion.div
      data-gate
      className="absolute inset-0 z-50 overflow-hidden"
      onClick={open}
      animate={opening ? { y: "-100%", rotate: -2 } : { y: 0, rotate: 0 }}
      transition={{ duration: 1, ease: [0.7, 0, 0.3, 1] }}
    >
      {/* kraft paper */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center px-8"
        style={{
          background: `linear-gradient(160deg, ${KRAFT} 0%, #EDDFC9 40%, ${KRAFT} 100%)`,
        }}
      >
        {/* paper texture flecks */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#d8c4a4 1px, transparent 1px), radial-gradient(#d8c4a4 1px, transparent 1px)",
            backgroundSize: "28px 28px, 40px 40px",
            backgroundPosition: "0 0, 14px 20px",
          }}
        />
        <div
          className="relative max-w-xs w-full rounded-lg bg-[#FBF6EC] shadow-md px-6 py-10 text-center"
          style={{ border: `2px dashed ${BARK}44` }}
        >
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-stone-400 mb-3">
            Kami Menikah
          </p>
          <p className="font-playfair text-xl text-stone-800 leading-snug">{names}</p>
          {date && (
            <p className="font-sans text-[10px] tracking-[0.25em] uppercase text-stone-400 mt-2">{date}</p>
          )}
          <p className="font-sans text-[10px] text-stone-400 mt-5 tracking-wide">
            Pecahkan segel untuk membuka
          </p>
        </div>
      </div>

      {/* wax seal */}
      <motion.button
        aria-label="Buka undangan"
        onClick={(e) => {
          e.stopPropagation();
          open();
        }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full z-10 flex items-center justify-center shadow-xl cursor-pointer"
        style={{
          background: `radial-gradient(circle at 32% 28%, #B0523C, ${WAX} 55%, #6E2A20)`,
        }}
        animate={
          cracking
            ? { scale: [1, 1.3, 0.85], rotate: [0, -14, 22], opacity: [1, 1, 0] }
            : { scale: [1, 1.05, 1] }
        }
        transition={
          cracking
            ? { duration: 0.7, times: [0, 0.4, 1] }
            : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <span className="w-14 h-14 rounded-full flex items-center justify-center" style={{ border: "1.5px solid rgba(255,255,255,0.35)" }}>
          <span className="font-playfair text-xl font-bold text-[#F3D9CF]">&amp;</span>
        </span>
        {/* crack lines */}
        {cracking && (
          <>
            <motion.svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" fill="none" stroke="#4a1712" strokeWidth={2}>
              <motion.path d="M50 8 L44 40 L58 55 L46 90" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />
              <motion.path d="M18 42 L40 52 L34 72" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.08 }} />
            </motion.svg>
          </>
        )}
      </motion.button>
    </motion.div>
  );
}

/* ---------------------------------- Gatefold ---------------------------------- */

function GatefoldGate({ names, date, onOpen }: Props) {
  const [opening, setOpening] = useState(false);
  const CHAMPAGNE = "#F7F2E9";
  const BORDER = "#B9A05A";

  function open() {
    if (opening) return;
    setOpening(true);
    onOpen?.();
  }

  return (
    <motion.div
      data-gate
      className="absolute inset-0 z-50 overflow-hidden"
      style={{ perspective: 1400 }}
      animate={opening ? { opacity: 0 } : { opacity: 1 }}
      transition={{ delay: opening ? 1 : 0, duration: 0.7 }}
      onClick={open}
    >
      <div className="absolute inset-0" style={{ backgroundColor: CHAMPAGNE }} />

      {/* left leaf */}
      <motion.div
        className="absolute top-0 bottom-0 left-0 w-1/2 origin-left"
        animate={opening ? { rotateY: -105 } : { rotateY: 0 }}
        transition={{ duration: 1.2, ease: [0.65, 0, 0.35, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="h-full w-full border-r" style={{ backgroundColor: CHAMPAGNE, borderColor: BORDER }}>
          <div className="absolute inset-2 border pointer-events-none" style={{ borderColor: `${BORDER}88` }} />
          <div className="h-full flex items-center justify-center">
            <span className="text-2xl select-none" style={{ color: BORDER }}>❦</span>
          </div>
        </div>
      </motion.div>

      {/* right leaf */}
      <motion.div
        className="absolute top-0 bottom-0 right-0 w-1/2 origin-right"
        animate={opening ? { rotateY: 105 } : { rotateY: 0 }}
        transition={{ duration: 1.2, ease: [0.65, 0, 0.35, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="h-full w-full border-l" style={{ backgroundColor: CHAMPAGNE, borderColor: BORDER }}>
          <div className="absolute inset-2 border pointer-events-none" style={{ borderColor: `${BORDER}88` }} />
          <div className="h-full flex flex-col items-center justify-center gap-2 px-10 text-center">
            <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-stone-400">Undangan Pernikahan</p>
            <p className="font-playfair text-xl text-stone-800 leading-snug">{names}</p>
            {date && (
              <p className="font-sans text-[10px] tracking-[0.25em] uppercase" style={{ color: BORDER }}>
                {date}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* center medallion */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full z-10 flex items-center justify-center shadow-md"
        style={{ backgroundColor: "#F0E9DA", border: `1.5px solid ${BORDER}` }}
        animate={opening ? { scale: 0, opacity: 0, rotate: -60 } : { scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <span className="font-playfair text-2xl" style={{ color: BORDER }}>&amp;</span>
      </motion.div>
    </motion.div>
  );
}

/* ---------------------------------- Gesture ----------------------------------- */

function GestureGate({ onOpen }: Props) {
  const [opening, setOpening] = useState(false);

  function open() {
    if (opening) return;
    setOpening(true);
    onOpen?.();
  }

  return (
    <motion.div
      data-gate
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 cursor-pointer"
      style={{
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        backgroundColor: "rgba(250,250,248,0.35)",
      }}
      onClick={open}
      onWheel={open}
      onTouchStart={open}
      animate={opening ? { opacity: 0, backdropFilter: "blur(0px)" } : { opacity: 1 }}
      transition={{ duration: 1.1, ease: "easeOut" }}
    >
      <motion.div
        className="w-2 h-2 rounded-full bg-stone-800"
        animate={{ scale: [1, 1.6, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.p
        className="font-sans text-[10px] tracking-[0.4em] uppercase text-stone-500"
        animate={{ opacity: [0.35, 0.85, 0.35] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      >
        Ketuk untuk membuka
      </motion.p>
    </motion.div>
  );
}

/* ----------------------------------- Shell ------------------------------------ */

const GATES: Record<GateVariant, React.FC<Props>> = {
  envelope: EnvelopeGate,
  arch: ArchGate,
  seal: SealGate,
  gatefold: GatefoldGate,
  gesture: GestureGate,
};

// Total per-variant reveal duration (gesture + settle) after which the gate
// removes itself from the DOM.
const GATE_DURATION_MS: Record<GateVariant, number> = {
  envelope: 2300,
  arch: 1300,
  seal: 1900,
  gatefold: 1400,
  gesture: 1200,
};

export default function TemplateGate(props: Props) {
  const [removed, setRemoved] = useState(false);
  const Gate = GATES[props.variant];
  const variant = props.variant;
  const outerOpen = props.onOpen;

  function handleOpen() {
    outerOpen?.();
    setTimeout(() => setRemoved(true), GATE_DURATION_MS[variant]);
  }

  if (removed) return null;

  return <Gate {...props} onOpen={handleOpen} />;
}

export type { Props as TemplateGateProps };
