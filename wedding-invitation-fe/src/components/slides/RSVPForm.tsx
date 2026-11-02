"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence, type Variants } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Wish } from "@/hooks/useInvitation";
import { submitRsvp } from "@/lib/api";

type Props = {
  initialWishes: Wish[];
  invitationId?: string;
};

type FormData = {
  name: string;
  attendance: "hadir" | "tidak";
  guests: number;
  message: string;
};

const slideUp: Variants = {
  hidden: { opacity: 0, y: 48 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const checkVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut", delay: 0.2 },
  },
};

type FloatingInputProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
};

function FloatingInput({ label, value, onChange, type = "text" }: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const raised = focused || value.length > 0;

  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-transparent border-b border-stone-300 focus:border-[#C9A96E] pt-5 pb-1.5 text-sm text-stone-800 outline-none transition-colors peer"
      />
      <label
        className={`absolute left-0 font-sans text-stone-400 pointer-events-none transition-all duration-200 ${
          raised ? "top-0 text-[10px] tracking-widest uppercase text-[#C9A96E]" : "top-5 text-sm"
        }`}
      >
        {label}
      </label>
    </div>
  );
}

type FloatingTextareaProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
};

function FloatingTextarea({ label, value, onChange }: FloatingTextareaProps) {
  const [focused, setFocused] = useState(false);
  const raised = focused || value.length > 0;

  return (
    <div className="relative">
      <textarea
        value={value}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-transparent border-b border-stone-300 focus:border-[#C9A96E] pt-5 pb-1.5 text-sm text-stone-800 outline-none transition-colors resize-none"
      />
      <label
        className={`absolute left-0 font-sans text-stone-400 pointer-events-none transition-all duration-200 ${
          raised ? "top-0 text-[10px] tracking-widest uppercase text-[#C9A96E]" : "top-5 text-sm"
        }`}
      >
        {label}
      </label>
    </div>
  );
}

export default function RSVPForm({ initialWishes, invitationId }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: "",
    attendance: "hadir",
    guests: 1,
    message: "",
  });

  const { data: wishes } = useQuery<Wish[]>({
    queryKey: ["wishes"],
    queryFn: () => Promise.resolve(initialWishes),
    initialData: initialWishes,
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (invitationId) {
        await submitRsvp({
          invitation_id: invitationId,
          guest_name: data.name,
          attendance_status: data.attendance === "hadir",
          total_pax: data.guests,
          message: data.message,
        });
      }
    },
    onSuccess: () => setSubmitted(true),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!form.name.trim()) return;
    mutation.mutate(form);
  }

  return (
    <div
      className="h-full w-full bg-[#F8F5F2] overflow-y-auto flex flex-col px-5 py-8 gap-6"
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <motion.div
        ref={ref}
        variants={slideUp}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="w-full max-w-sm mx-auto flex flex-col gap-6"
      >
        <div className="text-center">
          <h2 className="font-playfair text-2xl text-stone-800 tracking-wide">Konfirmasi Kehadiran</h2>
          <p className="font-sans text-xs text-stone-400 tracking-[0.18em] uppercase mt-1">
            Kehadiranmu sangat berarti
          </p>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="thankyou"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center gap-4 py-6"
            >
              <div className="w-16 h-16 rounded-full bg-[#C9A96E]/10 flex items-center justify-center">
                <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
                  <circle cx="24" cy="24" r="22" stroke="#C9A96E" strokeWidth="2" />
                  <motion.path
                    d="M14 24l8 8 12-14"
                    stroke="#C9A96E"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    variants={checkVariants}
                    initial="hidden"
                    animate="visible"
                  />
                </svg>
              </div>
              <p className="font-playfair text-lg text-stone-700 text-center">
                Terima kasih, {form.name}!
              </p>
              <p className="font-sans text-xs text-stone-400 text-center leading-relaxed">
                {form.attendance === "hadir"
                  ? `Kami senang kamu akan hadir bersama ${form.guests} tamu.`
                  : "Kami mengerti. Doa dan restu kamu tetap kami nantikan."}
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FloatingInput
                label="Nama Lengkap"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              />

              <div className="flex flex-col gap-2">
                <span className="font-sans text-[10px] tracking-widest uppercase text-[#C9A96E]">
                  Kehadiran
                </span>
                <div className="flex gap-3">
                  {(["hadir", "tidak"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setForm((f) => ({ ...f, attendance: opt }));
                      }}
                      className={`flex-1 py-2.5 rounded-full border text-xs font-semibold tracking-widest uppercase transition-colors ${
                        form.attendance === opt
                          ? "bg-[#C9A96E] border-[#C9A96E] text-white"
                          : "border-stone-300 text-stone-500 bg-transparent"
                      }`}
                    >
                      {opt === "hadir" ? "Hadir ✓" : "Tidak Hadir"}
                    </button>
                  ))}
                </div>
              </div>

              {form.attendance === "hadir" && (
                <div className="flex flex-col gap-1">
                  <span className="font-sans text-[10px] tracking-widest uppercase text-[#C9A96E]">
                    Jumlah Tamu
                  </span>
                  <select
                    value={form.guests}
                    onChange={(e) => setForm((f) => ({ ...f, guests: Number(e.target.value) }))}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent border-b border-stone-300 focus:border-[#C9A96E] py-2 text-sm text-stone-700 outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n} orang</option>
                    ))}
                  </select>
                </div>
              )}

              <FloatingTextarea
                label="Pesan & Doa"
                value={form.message}
                onChange={(v) => setForm((f) => ({ ...f, message: v }))}
              />

              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                disabled={mutation.isPending}
                className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-semibold tracking-[0.2em] uppercase rounded-full transition-colors mt-1"
              >
                {mutation.isPending ? "Mengirim..." : "Kirim Konfirmasi"}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        {wishes && wishes.length > 0 && (
          <div className="flex flex-col gap-3 pt-2">
            <p className="font-sans text-[10px] tracking-[0.22em] uppercase text-stone-400 text-center">
              Ucapan Tamu
            </p>
            <div className="flex flex-col gap-2 pr-1">
              {wishes.map((wish) => (
                <div
                  key={wish.id}
                  className="bg-white rounded-xl px-4 py-3 shadow-sm border border-stone-100"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-sans text-xs font-semibold text-stone-700">{wish.name}</p>
                    {wish.attendance && (
                      <span
                        className={`font-sans text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full ${
                          wish.attendance === "hadir"
                            ? "bg-[#C9A96E]/15 text-[#C9A96E]"
                            : "bg-stone-100 text-stone-400"
                        }`}
                      >
                        {wish.attendance}
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-xs text-stone-400 mt-0.5 leading-relaxed">{wish.message}</p>
                  {wish.timestamp && (
                    <p className="font-sans text-[10px] text-stone-300 mt-1">
                      {new Date(wish.timestamp).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
