"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Heart, TrendingUp, Calendar, MapPin, Loader2 } from "lucide-react";
import { getRsvpList, apiRsvpToWish, getInvitationById } from "@/lib/api";
import { useInvitationStore } from "@/store/useInvitationStore";
import type { Wish } from "@/hooks/useInvitation";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

function useCountdown(targetDate: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  const target = new Date(targetDate).getTime();
  if (!targetDate || Number.isNaN(target)) return null;
  if (target <= now) return null;
  const diff = target - now;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
  };
}

export default function OverviewTab() {
  const { invitationId, weddingDate, weddingEvents, groomName, brideName } = useInvitationStore();

  const { data: wishes = [], isLoading, isError } = useQuery<Wish[]>({
    queryKey: ["rsvp-guests", invitationId],
    queryFn: async () => {
      if (!invitationId) return [];
      const rsvps = await getRsvpList(invitationId);
      return rsvps.map(apiRsvpToWish);
    },
    enabled: !!invitationId,
    refetchInterval: 30000,
  });

  const { data: views } = useQuery<number>({
    queryKey: ["invitation-views", invitationId],
    queryFn: () => getInvitationById(invitationId!).then((inv) => inv.views),
    enabled: !!invitationId,
    refetchInterval: 30000,
  });
  const totalHadir = wishes.filter((w) => w.attendance === "hadir").length;
  const totalPax = wishes.filter((w) => w.attendance === "hadir").reduce((s, w) => s + (w.pax ?? 0), 0);
  const totalTidakHadir = wishes.filter((w) => w.attendance === "tidak").length;
  const totalWishes = wishes.filter((w) => !!w.message).length;

  const stats = [
    {
      label: "RSVP Hadir",
      value: isLoading ? "…" : String(totalHadir),
      change: `${totalPax} tamu dijadwalkan`,
      icon: Users,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "RSVP Tidak Hadir",
      value: isLoading ? "…" : String(totalTidakHadir),
      change: "Dari konfirmasi kehadiran",
      icon: Heart,
      color: "text-red-400",
      bg: "bg-red-50",
    },
    {
      label: "Total Dilihat",
      value: views === undefined ? "…" : String(views),
      change: "Undangan dibuka tamu",
      icon: TrendingUp,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Ucapan Masuk",
      value: isLoading ? "…" : String(totalWishes),
      change: "Pesan dari tamu",
      icon: TrendingUp,
      color: "text-[#D4AF37]",
      bg: "bg-amber-50",
    },
  ];

  const countdown = useCountdown(weddingDate);
  const formattedDate = weddingDate
    ? new Date(weddingDate).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "Tanggal belum diatur";
  const venue =
    weddingEvents.find((e) => e.type === "resepsi")?.locationName ??
    weddingEvents.find((e) => e.type === "akad")?.locationName ??
    weddingEvents[0]?.locationName ??
    "Lokasi belum diatur";

  const recentRSVP = [...wishes]
    .sort((a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
          Overview
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {groomName && brideName ? `${groomName} & ${brideName}` : "Pantau perkembangan undangan Anda."}
        </p>
      </div>

      {!invitationId ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
          <p className="text-sm text-gray-500">
            Belum ada undangan dipilih. Statistik RSVP akan muncul di sini setelah undangan dibuat.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${stat.bg} mb-3`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{stat.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Calendar className="w-5 h-5 text-[#D4AF37]" />
                <h2 className="font-semibold text-gray-800">Hari Pernikahan</h2>
              </div>
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-2">{formattedDate}</p>
                {countdown ? (
                  <div className="flex items-center justify-center gap-4">
                    {[
                      { val: String(countdown.days), label: "Hari" },
                      { val: String(countdown.hours).padStart(2, "0"), label: "Jam" },
                      { val: String(countdown.minutes).padStart(2, "0"), label: "Menit" },
                    ].map((item) => (
                      <div key={item.label} className="text-center">
                        <div className="text-3xl font-bold text-[#D4AF37]">{item.val}</div>
                        <div className="text-xs text-gray-400">{item.label}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-lg font-semibold text-[#D4AF37]">Hari bahagia telah tiba! 🎉</p>
                )}
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>{venue}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-semibold text-gray-800 mb-4">RSVP Terbaru</h2>
              {isError ? (
                <p className="text-sm text-red-500">Gagal memuat RSVP.</p>
              ) : isLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Memuat…
                </div>
              ) : recentRSVP.length === 0 ? (
                <p className="text-sm text-gray-400 py-4">Belum ada konfirmasi kehadiran.</p>
              ) : (
                <div className="space-y-3">
                  {recentRSVP.map((rsvp) => (
                    <div key={rsvp.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-semibold text-sm">
                          {rsvp.name[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{rsvp.name}</p>
                          <p className="text-xs text-gray-400">{rsvp.timestamp ? relativeTime(rsvp.timestamp) : ""}</p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          rsvp.attendance === "hadir"
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-500"
                        }`}
                      >
                        {rsvp.attendance === "hadir" ? "Hadir" : "Tidak Hadir"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
