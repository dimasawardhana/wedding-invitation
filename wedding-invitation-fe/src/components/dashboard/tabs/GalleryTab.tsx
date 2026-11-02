"use client";

import { useState, useRef, useCallback, useId, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { Trash2, Upload, ImagePlus, GripVertical, CheckCircle2, X } from "lucide-react";
import PreviewGallery from "@/components/dashboard/editor/PreviewGallery";
import { type GalleryItem, useInvitationStore } from "@/store/useInvitationStore";
import { deleteMedia, patchInvitation, storeToApiPatchPayload, uploadImage } from "@/lib/api";

const PLAN_LIMIT = 10;

function UploadProgressCard({ filename }: { filename: string }) {
  return (
    <div className="relative rounded-2xl border-2 border-[#D4AF37]/30 bg-amber-50/40 overflow-hidden aspect-[4/5] flex flex-col items-center justify-center gap-3 p-4">
      <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
        <Upload className="w-5 h-5 text-[#D4AF37]" />
      </div>
      <p className="text-xs text-gray-500 truncate max-w-full px-2 text-center">{filename}</p>
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div className="h-full w-1/3 bg-[#D4AF37] rounded-full animate-pulse" />
      </div>
      <p className="text-xs font-semibold text-[#D4AF37]">Mengunggah…</p>
    </div>
  );
}


function ImageCard({
  image,
  index,
  totalCount,
  invitationId,
  gallery,
  onDelete,
  onCaptionChange,
  onDragStart,
  onDragOver,
  onDrop,
  isDragTarget,
}: {
  image: GalleryItem;
  index: number;
  totalCount: number;
  invitationId: string;
  gallery: GalleryItem[];
  onDelete: (id: string) => void;
  onCaptionChange: (id: string, caption: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  isDragTarget: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [captionFocused, setCaptionFocused] = useState(false);
  const [localCaption, setLocalCaption] = useState(image.caption);
  const [saved, setSaved] = useState(false);

  const captionMutation = useMutation({
    mutationFn: async (caption: string) => {
      await patchInvitation(invitationId, {
        ...storeToApiPatchPayload(useInvitationStore.getState()),
        gallery: gallery.map((g) => (g.id === image.id ? { ...g, caption } : g)),
      });
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleCaptionBlur = () => {
    setCaptionFocused(false);
    if (localCaption !== image.caption) {
      captionMutation.mutate(localCaption);
      onCaptionChange(image.id, localCaption);
    }
  };


  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative rounded-2xl border-2 overflow-hidden bg-white transition-all duration-200 cursor-grab active:cursor-grabbing ${
        isDragTarget
          ? "border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 scale-[1.02]"
          : "border-gray-100 hover:border-gray-200 hover:shadow-md"
      }`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        <Image
          src={image.url}
          alt={image.caption || `Gallery photo ${index + 1}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition-transform duration-500 ${hovered ? "scale-105" : "scale-100"}`}
          unoptimized
        />

        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-200 ${
            hovered ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="absolute top-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center cursor-grab shadow-sm">
            <GripVertical className="w-4 h-4 text-gray-500" />
          </div>
        </div>

        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <span className="text-xs text-white/80 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
            {index + 1}/{totalCount}
          </span>
        </div>

        <button
          onClick={() => onDelete(image.id)}
          className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-3 py-2.5">
        <div className="relative flex items-center gap-1.5">
          <input
            type="text"
            value={localCaption}
            onChange={(e) => setLocalCaption(e.target.value)}
            onFocus={() => setCaptionFocused(true)}
            onBlur={handleCaptionBlur}
            placeholder="Tambah keterangan..."
            className={`w-full text-xs py-1.5 px-0 bg-transparent border-b outline-none transition-colors placeholder-gray-300 text-gray-700 ${
              captionFocused ? "border-[#D4AF37]" : "border-transparent hover:border-gray-200"
            }`}
          />
          {captionMutation.isPending && (
            <div className="w-3 h-3 border border-[#D4AF37] border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          {saved && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
        </div>
      </div>
    </div>
  );
}

function DropZone({
  onFilesSelected,
  isAtLimit,
}: {
  onFilesSelected: (files: FileList) => void;
  isAtLimit: boolean;
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const labelId = useId();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (!isAtLimit && e.dataTransfer.files?.length > 0) {
        onFilesSelected(e.dataTransfer.files);
      }
    },
    [isAtLimit, onFilesSelected],
  );

  return (
    <div
      id={labelId}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleFileDrop}
      onClick={() => !isAtLimit && inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 px-6 transition-all duration-200 select-none ${
        isAtLimit
          ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
          : dragActive
          ? "border-[#D4AF37] bg-amber-50/60 cursor-copy scale-[1.01]"
          : "border-gray-200 hover:border-[#D4AF37]/60 hover:bg-amber-50/30 cursor-pointer"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
          dragActive ? "bg-[#D4AF37]" : "bg-gray-100"
        }`}
      >
        <ImagePlus className={`w-6 h-6 ${dragActive ? "text-white" : "text-gray-400"}`} />
      </div>
      <div className="text-center">
        <p className={`text-sm font-medium ${dragActive ? "text-[#D4AF37]" : "text-gray-700"}`}>
          {dragActive ? "Lepaskan untuk upload" : isAtLimit ? "Batas foto tercapai" : "Drag & drop foto ke sini"}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {isAtLimit ? `Hapus foto untuk menambah yang baru` : "atau klik untuk pilih dari perangkat · JPG, PNG, WEBP · maks. 5MB"}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        disabled={isAtLimit}
        onChange={(e) => e.target.files && onFilesSelected(e.target.files)}
      />
    </div>
  );
}

export default function GalleryTab() {
  const { invitationId, galleryItems, updateInvitation } = useInvitationStore();
  const [uploading, setUploading] = useState<{ id: string; filename: string }[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const dragIndexRef = useRef<number | null>(null);
  const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);

  useEffect(() => {
    const valid = galleryItems.filter((g) => g.url.startsWith("http"));
    if (valid.length === galleryItems.length) return;
    updateInvitation({ galleryItems: valid });
  }, [galleryItems, updateInvitation]);

  function persistGallery(next: GalleryItem[]) {
    if (!invitationId) return;
    updateInvitation({ galleryItems: next });
    patchInvitation(invitationId, { ...storeToApiPatchPayload(useInvitationStore.getState()), gallery: next })
      .then(() => setSaveError(null))
      .catch((e: unknown) => setSaveError(e instanceof Error ? e.message : "Gagal menyimpan galeri"));
  }

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const item = galleryItems.find((g) => g.id === id);
      if (item && invitationId) {
        await deleteMedia(invitationId, item.url).catch(() => undefined);
      }
      return id;
    },
    onSuccess: (id) => {
      persistGallery(galleryItems.filter((g) => g.id !== id));
    },
  });

  const handleCaptionChange = (id: string, caption: string) => {
    updateInvitation({ galleryItems: galleryItems.map((g) => (g.id === id ? { ...g, caption } : g)) });
  };

  async function handleUpload(files: FileList) {
    const remaining = PLAN_LIMIT - galleryItems.length - uploading.length;
    const toProcess = Array.from(files).slice(0, Math.max(0, remaining));
    if (toProcess.length === 0 || !invitationId) return;

    const queued = toProcess.map((file) => ({
      id: `upload-${Date.now()}-${file.name}-${Math.random()}`,
      filename: file.name,
    }));
    setUploading((prev) => [...prev, ...queued]);

    for (const [i, file] of toProcess.entries()) {
      try {
        const url = await uploadImage(file);
        const item: GalleryItem = { id: `img-${Date.now()}-${i}-${Math.random()}`, url, caption: "" };
        persistGallery([...useInvitationStore.getState().galleryItems, item]);
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "Upload gagal");
      } finally {
        setUploading((prev) => prev.filter((u) => u.id !== queued[i].id));
      }
    }
  }

  function reorder(next: GalleryItem[]) {
    updateInvitation({ galleryItems: next });
    persistGallery(next);
  }

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragTargetIndex(index);
  };

  const handleDrop = (dropIndex: number) => {
    const dragIndex = dragIndexRef.current;
    if (dragIndex === null || dragIndex === dropIndex) {
      dragIndexRef.current = null;
      setDragTargetIndex(null);
      return;
    }
    const next = [...galleryItems];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(dropIndex, 0, moved);
    reorder(next);
    dragIndexRef.current = null;
    setDragTargetIndex(null);
  };


  const totalSlots = galleryItems.length + uploading.length;
  const isAtLimit = totalSlots >= PLAN_LIMIT;
  const remaining = PLAN_LIMIT - totalSlots;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold text-gray-900"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            Galeri Foto
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola foto-foto yang ditampilkan di undangan Anda.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border ${
              isAtLimit
                ? "border-red-200 bg-red-50 text-red-500"
                : totalSlots >= PLAN_LIMIT * 0.7
                ? "border-amber-200 bg-amber-50 text-amber-600"
                : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isAtLimit ? "bg-red-400" : "bg-[#D4AF37]"}`} />
            {totalSlots}/{PLAN_LIMIT} Foto
          </div>

          <button
            disabled={isAtLimit || !invitationId}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/jpeg,image/png,image/webp";
              input.multiple = true;
              input.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                if (target.files) handleUpload(target.files);
              };
              input.click();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#D4AF37] text-white hover:bg-[#b8962e] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-[#D4AF37]/20"
          >
            <Upload className="w-4 h-4" />
            Upload Foto
          </button>

          <button
            onClick={() => setPreviewOpen((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700 hover:border-[#D4AF37]/60 hover:bg-amber-50/30 transition-all"
          >
            {previewOpen ? "Tutup Pratinjau" : "Pratinjau"}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
          <X className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-600">{saveError}</p>
        </div>
      )}

      {!isAtLimit && <DropZone onFilesSelected={handleUpload} isAtLimit={isAtLimit} />}

      {isAtLimit && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
          <X className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-600">
            Batas foto tercapai ({PLAN_LIMIT}/{PLAN_LIMIT}). Hapus foto yang ada untuk mengunggah yang baru.
          </p>
        </div>
      )}

      {!isAtLimit && remaining <= 3 && remaining > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <p className="text-sm text-amber-700">
            Anda dapat mengunggah <strong>{remaining} foto lagi</strong> sesuai paket saat ini.
          </p>
        </div>
      )}

      {galleryItems.length === 0 && uploading.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <ImagePlus className="w-8 h-8 text-gray-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Belum ada foto</p>
            <p className="text-xs text-gray-400 mt-1">Upload foto pertama Anda untuk memulai.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {galleryItems.map((image, index) => (
            <ImageCard
              key={image.id}
              image={image}
              index={index}
              totalCount={galleryItems.length}
              invitationId={invitationId}
              gallery={galleryItems}
              onDelete={(id) => deleteMutation.mutate(id)}
              onCaptionChange={handleCaptionChange}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              isDragTarget={dragTargetIndex === index}
            />
          ))}
          {uploading.map((u) => (
            <UploadProgressCard key={u.id} filename={u.filename} />
          ))}
        </div>
      )}

      {previewOpen && (
        <div className="flex justify-center">
          <div className="h-[480px] w-[240px] rounded-3xl border-4 border-gray-900 overflow-hidden shadow-xl">
            <PreviewGallery images={galleryItems.map((g) => g.url)} />
          </div>
        </div>
      )}

      {galleryItems.length > 0 && (
        <p className="text-xs text-gray-400 text-center pb-2">
          Seret kartu untuk mengubah urutan tampilan · Klik keterangan untuk mengedit
        </p>
      )}
    </div>
  );
}
