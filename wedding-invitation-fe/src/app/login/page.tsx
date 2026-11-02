"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { Heart, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { login } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: ({ token, user }) => {
      setAuth(token, user);
      router.push("/dashboard");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="min-h-screen bg-[#F8F5F2] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37] flex items-center justify-center mb-4 shadow-lg shadow-[#D4AF37]/25">
            <Heart className="w-6 h-6 text-white" fill="white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
            Undanganku
          </h1>
          <p className="text-sm text-gray-500 mt-1">Masuk ke akun Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#D4AF37] transition-colors">
              <span className="px-3 text-gray-400"><Mail className="w-4 h-4" /></span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alice@example.com"
                required
                className="flex-1 px-2 py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#D4AF37] transition-colors">
              <span className="px-3 text-gray-400"><Lock className="w-4 h-4" /></span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="flex-1 px-2 py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          {mutation.isError && (
            <p className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {mutation.error instanceof Error ? mutation.error.message : "Login gagal"}
            </p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#D4AF37] text-white text-sm font-semibold hover:bg-[#b8962e] disabled:opacity-60 transition-colors"
          >
            {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Masuk...</> : "Masuk"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          Belum punya akun?{" "}
          <Link href="/register" className="text-[#D4AF37] font-semibold hover:underline">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
