"use client";

import { useState, useRef } from "react";
import { motion, useInView, useMotionValue, useTransform, type Variants } from "framer-motion";
import { BankAccount, QrisAccount } from "@/hooks/useInvitation";

type Props = {
  bankAccounts: BankAccount[];
  qrisAccounts: QrisAccount[];
};

const slideUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut", delay: i * 0.18 },
  }),
};

type CardProps = {
  account: BankAccount;
  index: number;
  inView: boolean;
};

function BankCard({ account, index, inView }: CardProps) {
  const [copied, setCopied] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-60, 60], [8, -8]);
  const rotateY = useTransform(mouseX, [-60, 60], [-8, 8]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    await navigator.clipboard.writeText(account.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      custom={index}
      variants={slideUp}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 800 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full rounded-2xl overflow-hidden cursor-default select-none"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#C9A96E] via-[#e8c98a] to-[#9a7340]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,255,255,0.18)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      <div className="relative z-10 px-6 py-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-[10px] tracking-[0.25em] uppercase font-sans">
            Digital Gift
          </span>
          <span className="font-playfair text-white/80 text-sm italic">
            {account.bankName}
          </span>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-sans text-[11px] text-white/50 tracking-widest uppercase mb-1">
              Nomor Rekening
            </p>
            <p className="font-sans text-xl font-semibold text-white tracking-[0.14em]">
              {account.accountNumber}
            </p>
            <p className="font-sans text-xs text-white/70 mt-1">
              a/n {account.accountHolder}
            </p>
          </div>

          <motion.button
            onClick={handleCopy}
            whileTap={{ scale: 0.92 }}
            className="relative z-50 shrink-0 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white text-[11px] font-semibold tracking-widest uppercase transition-colors"
          >
            {copied ? "✓ Copied" : "Copy"}
          </motion.button>
        </div>
      </div>

      {copied && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl z-20 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <span className="text-white font-semibold text-sm tracking-wide">Tersalin! ✓</span>
        </motion.div>
      )}
    </motion.div>
  );
}

function QRISCard({ qris, index, inView }: { qris: QrisAccount; index: number; inView: boolean }) {
  const [copied, setCopied] = useState(false);

  async function handleDownload() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      custom={index}
      variants={slideUp}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      style={{ transformStyle: "preserve-3d", perspective: 800 }}
      className="relative w-full rounded-2xl overflow-hidden cursor-default select-none"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#C9A96E] via-[#e8c98a] to-[#9a7340]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,255,255,0.18)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      <div className="relative z-10 px-6 py-5 flex flex-col items-center">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/60 text-[10px] tracking-[0.25em] uppercase font-sans">
            Digital Gift
          </span>
          <span className="font-playfair text-white/80 text-sm italic">
            {qris.name}
          </span>
        </div>

        <div className="relative w-full bg-white rounded-xl overflow-hidden flex items-center justify-center" style={{ height: 280 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qris.imageUrl}
            alt={`QRIS ${qris.name}`}
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)]" />
        </div>

        <div className="mt-4">
          <p className="font-sans text-[11px] text-white/50 tracking-widest uppercase mb-1">
            Scan untuk bayar
          </p>
          <p className="font-playfair text-white/80 text-xl font-bold tracking-[0.1em]">
            {qris.name}
          </p>
        </div>

        <motion.button
          onClick={handleDownload}
          whileTap={{ scale: 0.92 }}
          className="relative mt-6 z-50 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white text-[11px] font-semibold tracking-widest uppercase transition-colors"
        >
          {copied ? "✓ Disimpan" : "Simpan QRIS"}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function DigitalGift({ bankAccounts, qrisAccounts }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div className="h-full w-full bg-[#F8F5F2] flex flex-col items-center justify-center px-5 py-10">
      <div ref={ref} className="w-full max-w-sm flex flex-col gap-5">
        <div className="text-center mb-1">
          <motion.h2
            className="font-playfair text-2xl text-stone-800 tracking-wide"
            initial={{ opacity: 0, y: -14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            Amplop Digital
          </motion.h2>
          <motion.p
            className="font-sans text-xs text-stone-400 tracking-[0.18em] uppercase mt-1"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          >
            Doa &amp; restu adalah hadiah terbaik
          </motion.p>
        </div>

        {bankAccounts.length > 0 && (
          <>
            <div className="text-center mb-4">
              <motion.h3
                className="font-sans text-sm font-medium text-stone-600"
                initial={{ opacity: 0, y: -8 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                Transfer Bank
              </motion.h3>
            </div>
            <div className="w-full max-w-sm flex flex-col gap-4">
              {bankAccounts.map((account, i) => (
                <BankCard key={account.accountNumber} account={account} index={i} inView={inView} />
              ))}
            </div>
          </>
        )}

        {qrisAccounts.length > 0 && (
          <>
            <div className="text-center mb-4">
              <motion.h3
                className="font-sans text-sm font-medium text-stone-600"
                initial={{ opacity: 0, y: -8 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                QRIS
              </motion.h3>
            </div>
            <div className="w-full max-w-sm grid grid-cols-2 gap-4">
              {qrisAccounts.map((qris, i) => (
                <QRISCard key={i} qris={qris} index={i} inView={inView} />
              ))}
            </div>
          </>
        )}

        {bankAccounts.length === 0 && qrisAccounts.length === 0 && (
          <div className="text-center text-stone-500">
            <p>Belum ada informasi hadiah</p>
          </div>
        )}
      </div>
    </div>
  );
}
