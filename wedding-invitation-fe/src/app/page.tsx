"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, Wand2, Users, Star, ArrowRight, Sparkles, Check } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const FEATURES = [
  { icon: Wand2, title: "Editor Intuitif", desc: "Desain undangan impian Anda dengan editor yang mudah digunakan." },
  { icon: Users, title: "Kelola Tamu", desc: "Pantau RSVP dan ucapan tamu secara real-time dari satu dashboard." },
  { icon: Star, title: "Template Elegan", desc: "Pilih dari koleksi template pernikahan yang indah dan bisa dikustomisasi." },
];

const PLANS = [
  {
    name: "Gratis",
    price: "Rp 0",
    per: "selamanya",
    highlight: false,
    cta: "Mulai Gratis",
    features: [
      "1 undangan aktif",
      "Template Storyteller",
      "RSVP & ucapan tamu",
      "Countdown & add-to-calendar",
    ],
  },
  {
    name: "Premium",
    price: "Rp 149.000",
    per: "sekali bayar",
    highlight: true,
    cta: "Upgrade Premium",
    features: [
      "Semua undangan aktif",
      "Semua template (termasuk Modern Scroll)",
      "Galeri foto & video tanpa batas",
      "Amplop digital (transfer bank & QRIS)",
      "Musik latar undangan",
      "Statistik kunjungan lengkap",
    ],
  },
];

export default function LandingPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (token) router.replace("/dashboard");
  }, [token, router]);

  if (token) {
    return (
      <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5F2]">
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#D4AF37] flex items-center justify-center shadow-sm">
            <Heart className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="text-sm font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>Undanganku</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Masuk</Link>
          <Link href="/register" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D4AF37] text-white text-sm font-semibold hover:bg-[#b8962e] transition-colors shadow-sm">Mulai Gratis</Link>
        </div>
      </header>

      <main>
        <section className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Undangan Digital untuk Hari Istimewa
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6" style={{ fontFamily: "var(--font-playfair)" }}>
            Buat Undangan Pernikahan{" "}<span className="text-[#D4AF37]">yang Tak Terlupakan</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Rancang, bagikan, dan kelola undangan digital pernikahan Anda dengan mudah. Tanpa perlu keahlian desain.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register" className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#D4AF37] text-white font-semibold hover:bg-[#b8962e] transition-colors shadow-lg shadow-[#D4AF37]/25 text-sm">
              Buat Undangan Sekarang <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-gray-200 bg-white text-gray-700 font-semibold hover:border-[#D4AF37] transition-colors text-sm">
              Sudah punya akun? Masuk
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: "var(--font-playfair)" }}>
              Pilih Paket Anda
            </h2>
            <p className="text-sm text-gray-500">Mulai gratis, upgrade saat Anda siap. Bayar sekali, aktif selamanya.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-3xl border p-8 flex flex-col ${
                  plan.highlight ? "border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10" : "border-gray-100 shadow-sm"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#D4AF37] text-white text-[10px] font-semibold tracking-widest uppercase">
                    Paling Populer
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-2 mb-5">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-sm text-gray-400 ml-1">{plan.per}</span>
                </p>
                <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? "bg-[#D4AF37] text-white hover:bg-[#b8962e] shadow-lg shadow-[#D4AF37]/25"
                      : "border border-gray-200 bg-white text-gray-700 hover:border-[#D4AF37]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-8">
            Pembayaran diproses setelah Anda menghubungi tim kami via WhatsApp. Integrasi pembayaran otomatis segera hadir.
          </p>
        </section>
        <section className="max-w-2xl mx-auto px-6 pb-24 text-center">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10">
            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#D4AF37]/25">
              <Heart className="w-6 h-6 text-white" fill="white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "var(--font-playfair)" }}>Siap memulai?</h2>
            <p className="text-gray-500 text-sm mb-6">Daftar gratis dan buat undangan pertama Anda dalam hitungan menit.</p>
            <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D4AF37] text-white text-sm font-semibold hover:bg-[#b8962e] transition-colors">
              Daftar Sekarang — Gratis <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-6 text-center">
        <p className="text-xs text-gray-400">© 2026 Undanganku. Dibuat dengan ❤️</p>
      </footer>
    </div>
  );
}
