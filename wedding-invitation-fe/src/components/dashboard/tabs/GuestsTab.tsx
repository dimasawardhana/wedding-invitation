"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Download, RefreshCw, Trash2, Users, CheckCircle2,
  MessageSquare, X, ChevronUp, ChevronDown,
} from "lucide-react";
import { useInvitationStore } from "@/store/useInvitationStore";
import { type Wish } from "@/hooks/useInvitation";
import { getRsvpList, deleteRsvp, apiRsvpToWish } from "@/lib/api";

type SortKey = "name" | "pax" | "timestamp";
type SortDir = "asc" | "desc";

function relativeTime(iso?: string): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

function exportCsv(wishes: Wish[]) {
  const headers = ["Nama", "Status", "Jumlah Tamu", "Ucapan", "Waktu"];
  const rows = wishes.map((w) => [
    `"${w.name}"`,
    w.attendance === "hadir" ? "Hadir" : w.attendance === "tidak" ? "Tidak Hadir" : "—",
    String(w.pax ?? 0),
    `"${(w.message ?? "").replace(/"/g, '""')}"`,
    w.timestamp ? new Date(w.timestamp).toLocaleString("id-ID") : "—",
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rsvp-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StatusBadge({ attendance }: { attendance?: Wish["attendance"] }) {
  if (attendance === "hadir") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        <CheckCircle2 className="w-3 h-3" /> Hadir
      </span>
    );
  }
  if (attendance === "tidak") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">
        <X className="w-3 h-3" /> Tidak Hadir
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
      —
    </span>
  );
}

function MessageCell({ message }: { message: string }) {
  const [open, setOpen] = useState(false);
  if (!message) return <span className="text-gray-300 text-sm">—</span>;
  const truncated = message.length > 60;

  return (
    <>
      <p className="text-sm text-gray-500 max-w-xs truncate">
        {message}
        {truncated && (
          <button
            onClick={() => setOpen(true)}
            className="ml-1 text-[#D4AF37] text-xs font-medium hover:underline whitespace-nowrap"
          >
            Lihat
          </button>
        )}
      </p>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <MessageSquare className="w-5 h-5 text-[#D4AF37] mt-0.5" />
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
          </div>
        </div>
      )}
    </>
  );
}

function SortBtn({ label, sortKey, current, dir, onSort }: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors select-none"
    >
      {label}
      <span className="flex flex-col">
        <ChevronUp className={`w-2.5 h-2.5 -mb-0.5 ${active && dir === "asc" ? "text-[#D4AF37]" : "text-gray-300"}`} />
        <ChevronDown className={`w-2.5 h-2.5 ${active && dir === "desc" ? "text-[#D4AF37]" : "text-gray-300"}`} />
      </span>
    </button>
  );
}

export default function GuestsTab() {
  const queryClient = useQueryClient();
  const { invitationId } = useInvitationStore();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"Semua" | "hadir" | "tidak">("Semua");
  const [sort, setSort] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data: wishes = [], isFetching } = useQuery<Wish[]>({
    queryKey: ["rsvp-guests", invitationId],
    queryFn: async () => {
      if (!invitationId) return [];
      const rsvps = await getRsvpList(invitationId);
      return rsvps.map(apiRsvpToWish);
    },
    enabled: !!invitationId,
    refetchInterval: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (!invitationId) throw new Error("Undangan tidak diketahui.");
      return deleteRsvp(invitationId, id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["rsvp-guests", invitationId] });
      const previous = queryClient.getQueryData<Wish[]>(["rsvp-guests", invitationId]);
      queryClient.setQueryData<Wish[]>(["rsvp-guests", invitationId], (prev) =>
        (prev ?? []).filter((w) => w.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context) {
        queryClient.setQueryData(["rsvp-guests", invitationId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["rsvp-guests", invitationId] });
    },
  });

  const totalHadir = wishes.filter((w) => w.attendance === "hadir").length;
  const totalPax = wishes.filter((w) => w.attendance === "hadir").reduce((s, w) => s + (w.pax ?? 0), 0);
  const totalWishes = wishes.filter((w) => !!w.message).length;

  function handleSort(key: SortKey) {
    if (sort === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSort(key); setSortDir("asc"); }
  }

  const filtered = wishes
    .filter((w) => {
      const matchSearch = w.name.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "Semua" || w.attendance === filter;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      let va: string | number = 0, vb: string | number = 0;
      if (sort === "name") { va = a.name; vb = b.name; }
      if (sort === "pax") { va = a.pax ?? 0; vb = b.pax ?? 0; }
      if (sort === "timestamp") { va = a.timestamp ?? ""; vb = b.timestamp ?? ""; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const metrics = [
    {
      label: "Total Tamu Hadir",
      value: totalPax,
      sub: "orang konfirmasi",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Konfirmasi Hadir",
      value: totalHadir,
      sub: `dari ${wishes.length} respons`,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Ucapan Masuk",
      value: totalWishes,
      sub: "pesan & doa",
      icon: MessageSquare,
      color: "text-[#D4AF37]",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
            Tamu & RSVP
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalPax} tamu konfirmasi hadir dari {wishes.length} respons.
          </p>
        </div>
        {deleteMutation.isError && (
          <p className="flex items-center gap-1.5 text-xs text-red-500 mt-2">
            <X className="w-3.5 h-3.5 shrink-0" />
            {deleteMutation.error instanceof Error
              ? deleteMutation.error.message
              : "Gagal menghapus tamu."}
          </p>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["rsvp-guests"] })}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => exportCsv(filtered)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-[#D4AF37] text-white hover:bg-[#b8962e] transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${m.bg} mb-3`}>
                <Icon className={`w-4.5 h-4.5 ${m.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{m.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{m.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{m.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama tamu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          {([
            { key: "Semua", label: "Semua" },
            { key: "hadir", label: "Hadir" },
            { key: "tidak", label: "Tidak Hadir" },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                filter === f.key
                  ? "bg-[#D4AF37] text-white"
                  : "border border-gray-200 text-gray-600 hover:border-[#D4AF37] hover:text-[#D4AF37]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-5 py-3.5">
                  <SortBtn label="Nama" sortKey="name" current={sort} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="text-left px-5 py-3.5">
                  <span className="text-xs font-semibold text-gray-500">Status</span>
                </th>
                <th className="text-left px-5 py-3.5 hidden sm:table-cell">
                  <SortBtn label="Tamu" sortKey="pax" current={sort} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="text-left px-5 py-3.5 hidden md:table-cell">
                  <span className="text-xs font-semibold text-gray-500">Ucapan</span>
                </th>
                <th className="text-left px-5 py-3.5 hidden lg:table-cell">
                  <SortBtn label="Waktu" sortKey="timestamp" current={sort} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-sm text-gray-400">
                    Tidak ada tamu yang cocok.
                  </td>
                </tr>
              ) : (
                filtered.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50/60 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] font-bold text-sm shrink-0">
                          {guest.name[0].toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-gray-900">{guest.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge attendance={guest.attendance} />
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-700">
                        {guest.pax ? `${guest.pax} orang` : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <MessageCell message={guest.message ?? ""} />
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-xs text-gray-400">{relativeTime(guest.timestamp)}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => deleteMutation.mutate(guest.id)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Hapus tamu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {wishes.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Menampilkan {filtered.length} dari {wishes.length} respons
            </p>
            {isFetching && (
              <span className="text-xs text-[#D4AF37] flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Memperbarui...
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
