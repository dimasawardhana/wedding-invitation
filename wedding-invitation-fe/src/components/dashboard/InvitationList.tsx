"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Heart,
  Plus,
  PlusCircle,
  Wand2,
  Calendar,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  X,
  Loader2,
  LogOut,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
import {
  listInvitations,
  createInvitation,
  deleteInvitation,
  apiInvitationToStoreState,
  type ApiInvitation,
} from "@/lib/api";
import { useInvitationStore } from "@/store/useInvitationStore";
import { useAuthStore } from "@/store/useAuthStore";

function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const resetInvitation = useInvitationStore((s) => s.resetInvitation);
  const router = useRouter();
  return function logout() {
    clearAuth();
    resetInvitation();
    router.push("/login");
  };
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-gray-200" />
        <div className="w-16 h-6 rounded-full bg-gray-200" />
      </div>
      <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-28 bg-gray-100 rounded mb-4" />
      <div className="h-4 w-36 bg-gray-100 rounded mb-6" />
      <div className="h-9 w-full bg-gray-200 rounded-xl" />
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.11 1.524 5.835L0 24l6.345-1.504A11.951 11.951 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-4.997-1.367l-.358-.213-3.767.893.952-3.667-.234-.376A9.786 9.786 0 012.182 12C2.182 6.58 6.58 2.182 12 2.182S21.818 6.58 21.818 12 17.42 21.818 12 21.818z" />
    </svg>
  );
}

function InvitationCard({
  inv,
  onEdit,
  onDelete,
}: {
  inv: ApiInvitation;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const groomName = inv.couple?.groom?.nickname ?? "—";
  const brideName = inv.couple?.bride?.nickname ?? "—";
  const weddingDate = inv.couple?.weddingDate
    ? new Date(inv.couple.weddingDate).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Tanggal belum diatur";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
          <Heart className="w-5 h-5 text-[#D4AF37]" fill="currentColor" />
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          aria-label="Hapus undangan"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div>
        <h3
          className="font-semibold text-gray-900 text-base leading-snug"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          {groomName} & {brideName}
        </h3>
        <p className="text-xs text-gray-400 mt-1 font-mono">/{inv.slug}</p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
        {weddingDate}
      </div>
      <div className="flex gap-2 mt-auto pt-2">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D4AF37] text-white text-xs font-semibold hover:bg-[#b8962e] transition-colors"
        >
          <Wand2 className="w-3.5 h-3.5" />
          Edit
        </button>
        <a
          href={`/${inv.slug}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Lihat
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            `Yuk hadiri pernikahan ${groomName} & ${brideName}! 🎉\n\n${window.location.origin}/${inv.slug}`
          )}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#25D366] hover:text-[#25D366] transition-colors"
        >
          <WhatsAppIcon />
        </a>
        <button
          onClick={async (e) => {
            e.stopPropagation();
            try {
              await navigator.clipboard.writeText(`${window.location.origin}/${inv.slug}`);
              const btn = e.currentTarget;
              btn.dataset.copied = "true";
              setTimeout(() => delete btn.dataset.copied, 2000);
            } catch {
              // clipboard unavailable — leave button inert
            }
          }}
          data-copied=""
          className="group/copy flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
        >
          <Copy className="w-3.5 h-3.5 group-data-[copied=true]/copy:hidden" />
          <Check className="w-3.5 h-3.5 hidden text-green-600 group-data-[copied=true]/copy:block" />
        </button>
      </div>
    </div>
  );
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { updateInvitation } = useInvitationStore();
  const [slug, setSlug] = useState("");
  const [groomNickname, setGroomNickname] = useState("");
  const [brideNickname, setBrideNickname] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createInvitation({
        slug,
        couple: {
          groom: {
            nickname: groomNickname,
            fullName: "",
            fatherName: "",
            motherName: "",
            order: "",
            photo: "",
          },
          bride: {
            nickname: brideNickname,
            fullName: "",
            fatherName: "",
            motherName: "",
            order: "",
            photo: "",
          },
        },
      }),
    onSuccess: (api) => {
      updateInvitation(apiInvitationToStoreState(api));
      router.push("/dashboard/editor");
    },
  });

  const canSubmit = slug.trim() && groomNickname.trim() && brideNickname.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              className="text-lg font-semibold text-gray-900"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Buat Undangan Baru
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Isi detail dasar untuk memulai
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Slug URL <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#D4AF37] transition-colors">
              <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-200 shrink-0">
                undanganku.id/
              </span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                placeholder="nama-pasangan"
                className="flex-1 px-3 py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Nama Pria <span className="text-red-400">*</span>
              </label>
              <input
                value={groomNickname}
                onChange={(e) => setGroomNickname(e.target.value)}
                placeholder="Tony"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Nama Wanita <span className="text-red-400">*</span>
              </label>
              <input
                value={brideNickname}
                onChange={(e) => setBrideNickname(e.target.value)}
                placeholder="Stella"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
          </div>

          {mutation.isError && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {mutation.error instanceof Error ? mutation.error.message : "Gagal membuat undangan"}
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#D4AF37] text-white text-sm font-semibold hover:bg-[#b8962e] disabled:opacity-60 transition-colors"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Membuat...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Buat Undangan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InvitationList() {
  const router = useRouter();
  const { updateInvitation } = useInvitationStore();
  const { user } = useAuthStore();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiInvitation | null>(null);

  const logout = useLogout();

  const { data: invitations, isLoading, isError, refetch } = useQuery({
    queryKey: ["invitations"],
    queryFn: listInvitations,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInvitation(id),
    onSuccess: () => {
      setDeleteTarget(null);
      refetch();
    },
  });

  function handleEdit(inv: ApiInvitation) {
    updateInvitation(apiInvitationToStoreState(inv));
    router.push(`/dashboard/${inv.id}`);
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#D4AF37] flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" fill="white" />
          </div>
          <div>
            <p
              className="text-sm font-bold text-gray-900 leading-none"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Undanganku
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-gray-500">{user.name}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:border-red-200 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar
              </button>
            </div>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-white text-sm font-semibold hover:bg-[#b8962e] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Buat Undangan
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1
            className="text-2xl font-semibold text-gray-900"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Undangan Saya
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pilih undangan untuk mengedit atau buat yang baru.
          </p>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-gray-500 text-sm">Gagal memuat undangan.</p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Coba lagi
            </button>
          </div>
        )}

        {!isLoading && !isError && invitations && invitations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center">
              <PlusCircle className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-800">Belum ada undangan</p>
              <p className="text-sm text-gray-400 mt-1">
                Buat yang pertama untuk memulai!
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] text-white text-sm font-semibold hover:bg-[#b8962e] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Buat Undangan
            </button>
          </div>
        )}

        {!isLoading && !isError && invitations && invitations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {invitations.map((inv) => (
              <InvitationCard key={inv.id} inv={inv} onEdit={() => handleEdit(inv)} onDelete={() => setDeleteTarget(inv)} />
            ))}
            <button
              onClick={() => setShowCreate(true)}
              className="bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all p-6 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-[#D4AF37] min-h-[220px]"
            >
              <PlusCircle className="w-8 h-8" />
              <span className="text-sm font-medium">Buat Undangan Baru</span>
            </button>
          </div>
        )}
      </main>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Hapus undangan?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Undangan <span className="font-mono">/{deleteTarget.slug}</span> dan semua datanya akan dihapus permanen.
                </p>
              </div>
            </div>
            {deleteMutation.isError && (
              <p className="text-xs text-red-500 flex items-center gap-1.5 mt-4">
                <AlertCircle className="w-3.5 h-3.5" />
                {deleteMutation.error instanceof Error ? deleteMutation.error.message : "Gagal menghapus undangan"}
              </p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60 transition-colors"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  "Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
