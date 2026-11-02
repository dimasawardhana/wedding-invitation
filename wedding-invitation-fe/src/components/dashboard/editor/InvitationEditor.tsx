"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { type UseFormRegister } from "react-hook-form";
import {
  Sparkles, Heart, MapPin, Calendar, ImageIcon, Palette,
  ChevronDown, Plus, Trash2, Upload, AlertCircle, CheckCircle2, ArrowLeft, ExternalLink, X,
  Banknote, QrCode,
} from "lucide-react";
import PhoneFrame from "./PhoneFrame";
import { type InvitationData } from "@/hooks/useInvitation";
import { useInvitationStore } from "@/store/useInvitationStore";
import { TEMPLATE_REGISTRY } from "@/templates/registry";
import { COLOR_SCHEMES, FONT_PAIRS } from "@/lib/theme";
import { getInvitationBySlug, getInvitationById, createInvitation, patchInvitation, storeToApiPatchPayload, uploadImage } from "@/lib/api";

type EditorFormData = {
  title: string; slug: string; musicUrl: string; heroImage: string;
  groomFullName: string; groomNickname: string; groomFatherName: string; groomMotherName: string;
  groomOrder: string; groomPhoto: string;
  brideFullName: string; brideNickname: string; brideFatherName: string; brideMotherName: string;
  brideOrder: string; bridePhoto: string;
  journey: Array<{ year: string; title: string; desc: string }>;
  weddingDate: string;
  weddingEvents: Array<{ type: "akad" | "resepsi"; title: string; date: string; time: string; locationName: string; address: string; mapsUrl: string }>;
  gallery: Array<{ id: string; url: string; caption: string }>;
  theme: { colorScheme: string; fontPair: string; music: string };
  layoutId: string;
  bankAccounts: Array<{ bankName: string; accountNumber: string; accountHolder: string }>;
  qrisAccounts: Array<{ name: string; imageUrl: string }>;
};

function storeToFormData(s: ReturnType<typeof useInvitationStore.getState>): EditorFormData {
  return {
    title: s.title,
    slug: s.slug,
    musicUrl: s.theme.music,
    heroImage: s.heroImage,
    groomFullName: s.groom.fullName,
    groomNickname: s.groomName,
    groomFatherName: s.groom.fatherName,
    groomMotherName: s.groom.motherName,
    groomOrder: s.groom.order,
    groomPhoto: s.groom.photo,
    brideFullName: s.bride.fullName,
    brideNickname: s.brideName,
    brideFatherName: s.bride.fatherName,
    brideMotherName: s.bride.motherName,
    brideOrder: s.bride.order,
    bridePhoto: s.bride.photo,
    journey: s.events,
    weddingDate: s.weddingDate,
    weddingEvents: s.weddingEvents,
    gallery: s.galleryItems,
    theme: s.theme,
    layoutId: s.layoutId,
    bankAccounts: s.bankAccounts,
    qrisAccounts: s.qrisAccounts,
  };
}

function buildLiveData(f: EditorFormData): InvitationData {
  return {
    slug: f.slug,
    theme: f.theme,
    heroImage: f.heroImage,
    layoutId: f.layoutId,
    title: f.title,
    groomName: f.groomNickname,
    brideName: f.brideNickname,
    weddingDate: f.weddingEvents[0]?.date ?? f.weddingDate,
    groom: { fullName: f.groomFullName, photo: f.groomPhoto, fatherName: f.groomFatherName, motherName: f.groomMotherName, order: f.groomOrder },
    bride: { fullName: f.brideFullName, photo: f.bridePhoto, fatherName: f.brideFatherName, motherName: f.brideMotherName, order: f.brideOrder },
    events: f.journey,
    weddingEvents: f.weddingEvents,
    gallery: f.gallery.map((g) => g.url),
    bankAccounts: f.bankAccounts,
    qrisAccounts: f.qrisAccounts,
    wishes: [],
  };
}

type SectionId = "basics" | "couple" | "journey" | "event" | "gallery" | "theme" | "bank" | "qris";

function F({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <label className="flex items-center gap-1 text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{children}{required && <span className="text-[#D4AF37]">*</span>}</label>;
}

function In({ error, className = "", ...p }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return <div><input className={`w-full px-3.5 py-2.5 text-sm border rounded-xl outline-none transition-all ${error ? "border-red-300 ring-1 ring-red-300" : "border-gray-200 focus:border-[#D4AF37]"} ${className}`} {...p} />{error && <p className="flex items-center gap-1 mt-1 text-xs text-red-500"><AlertCircle className="w-3 h-3" />{error}</p>}</div>;
}

function Sec({ id, open, onToggle, icon: Icon, title, subtitle, children, onSave, isPending, savedAt }: {
  id: SectionId; open: SectionId | null; onToggle: (id: SectionId) => void;
  icon: React.ElementType; title: string; subtitle: string; children: React.ReactNode;
  onSave: () => void; isPending: boolean; savedAt?: number;
}) {
  const isOpen = open === id;
  return (
    <div className={`rounded-2xl border transition-all ${isOpen ? "border-[#D4AF37]/40 shadow-sm" : "border-gray-100"} bg-white overflow-hidden`}>
      <button type="button" onClick={() => onToggle(id)} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50/50">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isOpen ? "bg-[#D4AF37] text-white" : "bg-gray-100 text-gray-400"}`}><Icon className="w-4 h-4" /></div>
        <div className="flex-1"><p className="text-sm font-semibold text-gray-900">{title}</p><p className="text-xs text-gray-400 mt-0.5">{subtitle}</p></div>
        {savedAt && !isOpen && <CheckCircle2 className="w-4 h-4 text-green-500" />}
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}><ChevronDown className="w-4 h-4 text-gray-400" /></motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="px-5 pb-5 pt-1 space-y-4 border-t">{children}<div className="flex justify-end pt-2"><button type="button" onClick={onSave} disabled={isPending} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#D4AF37] text-white hover:bg-[#b8962e] disabled:opacity-60">{isPending ? "Menyimpan..." : savedAt ? "Tersimpan" : "Simpan"}</button></div></div></motion.div>}
      </AnimatePresence>
    </div>
  );
}

function CoverUploader({ current, onChange }: { current: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 group cursor-pointer"
      >
        <img src={current || "/hero-default.jpg"} alt="Cover" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/hero-default.jpg"; }} />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Upload className="w-5 h-5 text-white" />
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Upload className="w-5 h-5 text-white animate-pulse" />
          </div>
        )}
      </div>
      {error && <p className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

function PersonFields({ prefix, label, register, currentPhoto, onPhotoChange }: { prefix: "groom" | "bride"; label: string; register: UseFormRegister<EditorFormData>; currentPhoto?: string; onPhotoChange?: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      onPhotoChange?.(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2">{label}</p>
      <div className="flex items-start gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 flex-shrink-0 bg-gray-50 cursor-pointer"
        >
          <img src={currentPhoto || `https://picsum.photos/seed/${prefix}/200/200`} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://picsum.photos/seed/${prefix}/200/200`; }} />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center"><Upload className="w-3.5 h-3.5 text-white" /></div>
          {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Upload className="w-3.5 h-3.5 text-white animate-pulse" /></div>}
        </div>
        <div className="grid grid-cols-2 gap-3 flex-1">
          <div className="col-span-2"><F required>Nama Lengkap</F><In {...register(`${prefix}FullName`)} placeholder={prefix === "groom" ? "Tony Wijaya, S.Kom" : "Stella Kusuma, S.E"} /></div>
          <div><F required>Nama Panggilan</F><In {...register(`${prefix}Nickname`)} placeholder={prefix === "groom" ? "Tony" : "Stella"} /></div>
          <div><F>Urutan</F><In {...register(`${prefix}Order`)} placeholder="Putra pertama dari" /></div>
          <div><F>Nama Ayah</F><In {...register(`${prefix}FatherName`)} placeholder="Bapak..." /></div>
          <div><F>Nama Ibu</F><In {...register(`${prefix}MotherName`)} placeholder="Ibu..." /></div>
        </div>
      </div>
      {error && <p className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

function EventFields({ index, label, register }: { index: number; label: string; register: UseFormRegister<EditorFormData> }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2">{label}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><F>Nama Acara</F><In {...register(`weddingEvents.${index}.title`)} placeholder={label} /></div>
        <div><F>Tanggal</F><In {...register(`weddingEvents.${index}.date`)} type="date" /></div>
        <div><F>Waktu</F><In {...register(`weddingEvents.${index}.time`)} placeholder="08.00 – 10.00" /></div>
        <div className="col-span-2"><F>Google Maps URL</F><In {...register(`weddingEvents.${index}.mapsUrl`)} placeholder="https://maps.google.com/..." /></div>
      </div>
    </div>
  );
}

function ThemeSection({ theme, onChange }: { theme: EditorFormData["theme"]; onChange: (t: EditorFormData["theme"]) => void }) {
  return (
    <div className="space-y-5">
      <div><F>Palet Warna</F>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {COLOR_SCHEMES.map((c) => <button key={c.id} onClick={() => onChange({ ...theme, colorScheme: c.id })} className={`p-3 rounded-xl border-2 ${theme.colorScheme === c.id ? "border-[#D4AF37]" : "border-gray-100"}`}><div className="flex gap-1 mb-2">{c.preview.map((c, i) => <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />)}</div><p className="text-xs font-medium text-gray-800">{c.name}</p></button>)}
        </div>
      </div>
      <div><F>Pasangan Font</F>
        <div className="space-y-2">
          {FONT_PAIRS.map((f) => <button key={f.id} onClick={() => onChange({ ...theme, fontPair: f.id })} className={`w-full p-3 rounded-xl border-2 text-left ${theme.fontPair === f.id ? "border-[#D4AF37] bg-amber-50/30" : "border-gray-100"}`}><p className="text-sm font-medium text-gray-800">{f.heading}</p><p className="text-xs text-gray-400">Body: {f.body}</p></button>)}
        </div>
      </div>
        <div><F>URL Musik</F><In value={theme.music} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...theme, music: e.target.value })} placeholder="https://...mp3" type="url" /></div>
    </div>
  );
}

function BankSection({ accounts, onChange }: { accounts: EditorFormData["bankAccounts"]; onChange: (accs: EditorFormData["bankAccounts"]) => void }) {
  const limit = 5;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{accounts.length}/{limit} rekening</span>
        <button disabled={accounts.length >= limit} onClick={() => onChange([...accounts, { bankName: "", accountNumber: "", accountHolder: "" }])} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#D4AF37] text-white hover:bg-[#b8962e] disabled:opacity-50"><Plus className="w-3 h-3" />Tambah</button>
      </div>
      {accounts.length === 0 ? (
        <div className="text-center py-8 text-xs text-gray-400">Belum ada rekening.</div>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc, idx) => <div key={idx} className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3">
              <div><F>Nama Bank</F><In defaultValue={acc.bankName} onChange={(e) => onChange(accounts.map((a, i) => i === idx ? {...a, bankName: e.target.value} : a))} /></div>
              <div><F>Nomor Rekening</F><In defaultValue={acc.accountNumber} onChange={(e) => onChange(accounts.map((a, i) => i === idx ? {...a, accountNumber: e.target.value} : a))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div><F>Nama Pemilik</F><In defaultValue={acc.accountHolder} onChange={(e) => onChange(accounts.map((a, i) => i === idx ? {...a, accountHolder: e.target.value} : a))} /></div>
              <div className="flex items-end">
                <button onClick={() => onChange(accounts.filter((_, i) => i !== idx))} className="text-red-400"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          </div>)}
        </div>
      )}
    </div>
  );
}

function QrisSection({ accounts, onChange }: { accounts: EditorFormData["qrisAccounts"]; onChange: (accs: EditorFormData["qrisAccounts"]) => void }) {
  const limit = 5;

  function addBlank() {
    onChange([...accounts, { name: "", imageUrl: "" }]);
  }

  function updateName(idx: number, name: string) {
    onChange(accounts.map((a, i) => i === idx ? { ...a, name } : a));
  }

  function updateImageUrl(idx: number, imageUrl: string) {
    onChange(accounts.map((a, i) => i === idx ? { ...a, imageUrl } : a));
  }

  function remove(idx: number) {
    onChange(accounts.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{accounts.length}/{limit} QRIS</span>
        <button disabled={accounts.length >= limit} onClick={addBlank} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#D4AF37] text-white hover:bg-[#b8962e] disabled:opacity-50"><Plus className="w-3 h-3" />Tambah</button>
      </div>
      {accounts.length === 0 ? (
        <div className="text-center py-8 text-xs text-gray-400">Belum ada QRIS.</div>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc, idx) => (
            <QrisCard
              key={idx}
              acc={acc}
              onNameChange={(v) => updateName(idx, v)}
              onImageUrl={(v) => updateImageUrl(idx, v)}
              onRemove={() => remove(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QrisCard({ acc, onNameChange, onImageUrl, onRemove }: {
  acc: { name: string; imageUrl: string };
  onNameChange: (v: string) => void;
  onImageUrl: (v: string) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlMode, setUrlMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      onImageUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div
          className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#D4AF37] transition-colors shrink-0"
          onClick={() => !uploading && fileRef.current?.click()}
        >
          {acc.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={acc.imageUrl} alt="QRIS preview" className="w-full h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-gray-400">
              <Upload className="w-5 h-5" />
              <span className="text-[9px] text-center leading-tight">Upload<br />gambar</span>
            </div>
          )}
          {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Upload className="w-4 h-4 text-white animate-pulse" /></div>}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
        </div>

        <div className="flex-1 space-y-2">
          <div><F>Nama Layanan</F><In value={acc.name} onChange={(e) => onNameChange(e.target.value)} placeholder="GoPay, OVO, dll" /></div>
          <button
            type="button"
            onClick={() => setUrlMode((v) => !v)}
            className="text-[10px] text-[#D4AF37] underline underline-offset-2"
          >
            {urlMode ? "Tutup URL" : "Atau masukkan URL gambar"}
          </button>
          {urlMode && (
            <In
              value={acc.imageUrl.startsWith("blob:") ? "" : acc.imageUrl}
              onChange={(e) => onImageUrl(e.target.value)}
              placeholder="https://..."
            />
          )}
          {error && <p className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="w-3 h-3" />{error}</p>}
        </div>

        <button onClick={onRemove} className="text-red-400 shrink-0 mt-1"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

function GallerySection({ images, onChange }: { images: EditorFormData["gallery"]; onChange: (imgs: EditorFormData["gallery"]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const limit = 10;
  const handleUpload = async (file: File) => { setUploading(true); setError(null); try { const url = await uploadImage(file); onChange([...images, { id: `img-${Date.now()}`, url, caption: "" }]); } catch (e) { setError(e instanceof Error ? e.message : "Upload gagal"); } finally { setUploading(false); } };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{images.length}/{limit} foto</span>
        <button disabled={images.length >= limit} onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#D4AF37] text-white hover:bg-[#b8962e] disabled:opacity-50"><Upload className="w-3 h-3" />Tambah</button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const files = e.target.files; if (files) Array.from(files).slice(0, limit - images.length).forEach(handleUpload); }} />
      </div>
      {images.length === 0 ? <div className="text-center py-8 text-xs text-gray-400">Belum ada foto.</div> : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"><img src={img.url} alt="" className="w-full h-full object-cover" /><button onClick={() => onChange(images.filter((x) => x.id !== img.id))} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button></div>)}
        </div>
      )}
      {uploading && <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg"><Upload className="w-4 h-4 text-[#D4AF37] animate-pulse" /><span className="text-xs text-[#D4AF37]">Mengupload...</span></div>}
      {error && <p className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

function TemplateSelector({ layoutId, onChange }: { layoutId: string; onChange: (id: string) => void }) {
  const layoutMutation = useMutation({
    mutationFn: async (id: string) => {
      await new Promise((r) => setTimeout(r, 300));
      return id;
    },
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-[#D4AF37] flex items-center justify-center">
          <Palette className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Layout Template</p>
          <p className="text-xs text-gray-400">Pilih tampilan undangan</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {TEMPLATE_REGISTRY.map((tpl) => {
          const active = layoutId === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => {
                onChange(tpl.id);
                layoutMutation.mutate(tpl.id);
              }}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${active ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-gray-100 hover:border-gray-200"}`}
            >
              {active && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#D4AF37] flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="w-full h-16 rounded-lg bg-gray-100 mb-3 overflow-hidden flex items-center justify-center">
                {tpl.id === "storyteller" ? (
                  <div className="flex flex-col gap-1 w-full h-full p-2">
                    <div className="h-1.5 w-3/4 rounded bg-gray-300" />
                    <div className="h-1 w-1/2 rounded bg-gray-200" />
                    <div className="flex-1 rounded bg-gray-200 mt-1" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 w-full h-full p-2">
                    <div className="h-1 w-full rounded bg-gray-300" />
                    <div className="h-1 w-4/5 rounded bg-gray-200" />
                    <div className="h-1 w-full rounded bg-gray-200" />
                    <div className="h-1 w-3/5 rounded bg-gray-200" />
                  </div>
                )}
              </div>
              <p className="text-xs font-semibold text-gray-800">{tpl.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{tpl.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function InvitationEditor() {
  const store = useInvitationStore();
  const { updateInvitation } = store;
  const invitationId = useInvitationStore((s) => s.invitationId);
  const slug = useInvitationStore((s) => s.slug);
  const backHref = invitationId ? `/dashboard/${invitationId}` : "/dashboard";

  const [openSection, setOpenSection] = useState<SectionId | null>("basics");
  const [savedTimes, setSavedTimes] = useState<Record<SectionId, number>>({ basics: 0, couple: 0, journey: 0, event: 0, gallery: 0, theme: 0, bank: 0, qris: 0 });
  const [allSaved, setAllSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const form = useForm<EditorFormData>({ defaultValues: storeToFormData(useInvitationStore.getState()) });
  const { register, handleSubmit, watch, control, trigger, reset } = form;
  const { fields: journeyFields, append: appendJourney, remove: removeJourney } = useFieldArray({ control, name: "journey" });
  const watchedValues = watch();
  const liveData = buildLiveData(watchedValues);

  useEffect(() => {
    setHydrated(true);
    const state = useInvitationStore.getState();
    reset(storeToFormData(state));
    async function ensureInvitation() {
      const s = useInvitationStore.getState();
      if (s.invitationId) {
        try {
          await getInvitationById(s.invitationId);
        } catch {
          updateInvitation({ invitationId: "" });
          if (s.slug) {
            try {
              const api = await getInvitationBySlug(s.slug);
              updateInvitation({ invitationId: api.id });
              return;
            } catch {}
          }
          try {
            const api = await createInvitation({ ...storeToApiPatchPayload(useInvitationStore.getState()), slug: s.slug });
            updateInvitation({ invitationId: api.id });
          } catch {}
        }
        return;
      }
      if (s.slug) {
        try {
          const api = await getInvitationBySlug(s.slug);
          updateInvitation({ invitationId: api.id });
          return;
        } catch {}
      }
      try {
        const api = await createInvitation({ ...storeToApiPatchPayload(useInvitationStore.getState()), slug: s.slug });
        updateInvitation({ invitationId: api.id });
      } catch {}
    }
    ensureInvitation();
  }, [reset, updateInvitation]);

  async function persistSection(f: EditorFormData) {
    const patch = {
      title: f.title,
      slug: f.slug,
      heroImage: f.heroImage,
      groomName: f.groomNickname,
      brideName: f.brideNickname,
      weddingDate: f.weddingEvents[0]?.date ?? f.weddingDate,
      groom: { fullName: f.groomFullName, photo: f.groomPhoto, fatherName: f.groomFatherName, motherName: f.groomMotherName, order: f.groomOrder },
      bride: { fullName: f.brideFullName, photo: f.bridePhoto, fatherName: f.brideFatherName, motherName: f.brideMotherName, order: f.brideOrder },
      events: f.journey,
      weddingEvents: f.weddingEvents,
      galleryItems: f.gallery,
      theme: f.theme,
      layoutId: f.layoutId,
      bankAccounts: f.bankAccounts,
      qrisAccounts: f.qrisAccounts,
    };
    updateInvitation(patch);
    const id = useInvitationStore.getState().invitationId;
    if (id) {
      await patchInvitation(id, storeToApiPatchPayload(useInvitationStore.getState()));
    }
  }

  const basicsMutation = useMutation({ mutationFn: () => persistSection(form.getValues()), onSuccess: () => { setSavedTimes((p) => ({ ...p, basics: Date.now() })); } });
  const coupleMutation = useMutation({ mutationFn: () => persistSection(form.getValues()), onSuccess: () => { setSavedTimes((p) => ({ ...p, couple: Date.now() })); } });
  const journeyMutation = useMutation({ mutationFn: () => persistSection(form.getValues()), onSuccess: () => { setSavedTimes((p) => ({ ...p, journey: Date.now() })); } });
  const eventMutation = useMutation({ mutationFn: () => persistSection(form.getValues()), onSuccess: () => { setSavedTimes((p) => ({ ...p, event: Date.now() })); } });
  const galleryMutation = useMutation({ mutationFn: () => persistSection(form.getValues()), onSuccess: () => { setSavedTimes((p) => ({ ...p, gallery: Date.now() })); } });
  const themeMutation = useMutation({ mutationFn: () => persistSection(form.getValues()), onSuccess: () => { setSavedTimes((p) => ({ ...p, theme: Date.now() })); } });
  const bankMutation = useMutation({ mutationFn: () => persistSection(form.getValues()), onSuccess: () => { setSavedTimes((p) => ({ ...p, bank: Date.now() })); } });
  const qrisMutation = useMutation({ mutationFn: () => persistSection(form.getValues()), onSuccess: () => { setSavedTimes((p) => ({ ...p, qris: Date.now() })); } });
  const allMutation = useMutation({ mutationFn: () => persistSection(form.getValues()), onSuccess: () => {
    const f = form.getValues();
    setSavedTimes({ basics: Date.now(), couple: Date.now(), journey: Date.now(), event: Date.now(), gallery: Date.now(), theme: Date.now(), bank: Date.now(), qris: Date.now() });
    setAllSaved(true);
    reset(f);
  }});

  const handleSave = async (section: SectionId) => {
    const m: Record<SectionId, { mutate: () => void }> = { basics: basicsMutation, couple: coupleMutation, journey: journeyMutation, event: eventMutation, gallery: galleryMutation, theme: themeMutation, bank: bankMutation, qris: qrisMutation };
    await trigger(["title"]); m[section].mutate();
  };

  const isDirty = form.formState.isDirty;
  const isPending = basicsMutation.isPending || coupleMutation.isPending || journeyMutation.isPending || eventMutation.isPending || galleryMutation.isPending || themeMutation.isPending || bankMutation.isPending || qrisMutation.isPending || allMutation.isPending;
  const saveError = [basicsMutation, coupleMutation, journeyMutation, eventMutation, galleryMutation, themeMutation, bankMutation, qrisMutation, allMutation]
    .find((m) => m.isError)?.error;
  const saveErrorMessage = saveError instanceof Error ? saveError.message : "Gagal menyimpan. Periksa koneksi lalu coba lagi.";
  const clearSaveError = () => {
    basicsMutation.reset(); coupleMutation.reset(); journeyMutation.reset(); eventMutation.reset();
    galleryMutation.reset(); themeMutation.reset(); bankMutation.reset(); qrisMutation.reset(); allMutation.reset();
  };

  if (!hydrated) return null;

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:flex-row">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:w-[480px] xl:w-[540px]">
          <header className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 bg-white/80 backdrop-blur-sm border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2 lg:gap-3">
              <Link href={backHref} className="flex items-center gap-1 text-xs lg:text-sm text-gray-500 hover:text-[#D4AF37]"><ArrowLeft className="w-3.5 h-3.5 lg:w-4 h-4" />Dashboard</Link>
              <span className="text-gray-300">/</span>
              <span className="text-xs lg:text-sm font-semibold text-gray-800">Editor</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmit(() => allMutation.mutate())}
                disabled={allMutation.isPending}
                className="flex items-center gap-1.5 px-3 lg:px-4 py-1.5 rounded-lg bg-[#D4AF37] text-white text-xs font-semibold hover:bg-[#b8962e] disabled:opacity-70 transition-colors"
              >
                {allMutation.isPending ? "Menyimpan..." : "Simpan & Preview"}
              </button>
              <a href={slug ? `/${slug}` : "#"} target="_blank" className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-[#D4AF37] hover:text-[#D4AF37]"><ExternalLink className="w-3 h-3 lg:w-3.5 h-3.5" /><span className="hidden sm:inline">Buka</span></a>
            </div>
          </header>
          {saveError && (
            <div className="flex items-center justify-between gap-3 mx-4 lg:mx-6 mt-3 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200">
              <p className="flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {saveErrorMessage}
              </p>
              <button type="button" onClick={clearSaveError} className="text-red-400 hover:text-red-600 shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 lg:py-6 space-y-3">
            <TemplateSelector
              layoutId={watchedValues.layoutId}
              onChange={(id) => form.setValue("layoutId", id, { shouldDirty: true })}
            />
            <Sec id="basics" open={openSection} onToggle={setOpenSection} icon={Sparkles} title="The Basics" subtitle="Judul, slug, cover" onSave={() => handleSave("basics")} isPending={basicsMutation.isPending} savedAt={savedTimes.basics}><div><F required>Judul</F><In {...register("title")} placeholder="The Wedding of..." /></div><div><F>Slug</F><div className="flex items-center border rounded-xl overflow-hidden border-gray-200"><span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r">undanganku.id/</span><input {...register("slug")} placeholder="tony-stella" className="flex-1 px-3 py-2.5 text-sm outline-none" /></div></div><div><F>Foto Cover</F><CoverUploader current={watchedValues.heroImage} onChange={(url) => form.setValue("heroImage", url, { shouldDirty: true })} /></div></Sec>
            <Sec id="couple" open={openSection} onToggle={setOpenSection} icon={Heart} title="The Couple" subtitle="Mempelai" onSave={() => handleSave("couple")} isPending={coupleMutation.isPending} savedAt={savedTimes.couple}><PersonFields prefix="groom" label="Mempelai Pria" register={register} currentPhoto={watchedValues.groomPhoto} onPhotoChange={(url) => form.setValue("groomPhoto", url, { shouldDirty: true })} /><PersonFields prefix="bride" label="Mempelai Wanita" register={register} currentPhoto={watchedValues.bridePhoto} onPhotoChange={(url) => form.setValue("bridePhoto", url, { shouldDirty: true })} /></Sec>
            <Sec id="journey" open={openSection} onToggle={setOpenSection} icon={MapPin} title="The Journey" subtitle="Timeline cinta" onSave={() => handleSave("journey")} isPending={journeyMutation.isPending} savedAt={savedTimes.journey}><div className="space-y-3">{journeyFields.map((field, i) => <div key={field.id} className="bg-gray-50 rounded-xl p-4"><div className="flex justify-between"><span className="text-xs font-bold text-gray-400">Momen {i + 1}</span>{journeyFields.length > 1 && <button onClick={() => removeJourney(i)} className="text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>}</div><div className="grid grid-cols-3 gap-2 mt-2"><div><F>Tahun</F><In {...register(`journey.${i}.year`)} placeholder="2019" /></div><div className="col-span-2"><F>Judul</F><In {...register(`journey.${i}.title`)} placeholder="First Meet" /></div><div className="col-span-3"><F>Deskripsi</F><textarea {...register(`journey.${i}.desc`)} rows={2} className="w-full px-3 py-2 border rounded-xl" /></div></div></div>)}<button onClick={() => appendJourney({ year: "", title: "", desc: "" })} className="flex items-center gap-2 text-xs text-[#D4AF37] font-semibold"><Plus className="w-3.5 h-3.5" />Tambah</button></div></Sec>
            <Sec id="event" open={openSection} onToggle={setOpenSection} icon={Calendar} title="The Event" subtitle="Akad & Resepsi" onSave={() => handleSave("event")} isPending={eventMutation.isPending} savedAt={savedTimes.event}><EventFields index={0} label="Akad Nikah" register={register} /><EventFields index={1} label="Resepsi" register={register} /></Sec>
            <Sec id="gallery" open={openSection} onToggle={setOpenSection} icon={ImageIcon} title="The Gallery" subtitle="Foto" onSave={() => handleSave("gallery")} isPending={galleryMutation.isPending} savedAt={savedTimes.gallery}><GallerySection images={watchedValues.gallery} onChange={(imgs) => form.setValue("gallery", imgs, { shouldDirty: true })} /></Sec>
            <Sec id="theme" open={openSection} onToggle={setOpenSection} icon={Palette} title="The Theme" subtitle="Warna, font, musik" onSave={() => handleSave("theme")} isPending={themeMutation.isPending} savedAt={savedTimes.theme}><ThemeSection theme={watchedValues.theme} onChange={(t) => form.setValue("theme", t, { shouldDirty: true })} /></Sec>
            <Sec id="bank" open={openSection} onToggle={setOpenSection} icon={Banknote} title="Bank Transfer" subtitle="Nomor rekening" onSave={() => handleSave("bank")} isPending={bankMutation.isPending} savedAt={savedTimes.bank}><BankSection accounts={watchedValues.bankAccounts} onChange={(accs) => form.setValue("bankAccounts", accs, { shouldDirty: true })} /></Sec>
            <Sec id="qris" open={openSection} onToggle={setOpenSection} icon={QrCode} title="QRIS" subtitle="Scan untuk bayar" onSave={() => handleSave("qris")} isPending={qrisMutation.isPending} savedAt={savedTimes.qris}><QrisSection accounts={watchedValues.qrisAccounts} onChange={(accs) => form.setValue("qrisAccounts", accs, { shouldDirty: true })} /></Sec>
            <div className="h-24" />
          </div>
        </div>
        
        <div className="hidden lg:flex shrink-0 w-[380px] xl:w-[420px] items-start justify-center bg-gradient-to-b from-gray-100 to-gray-200 border-l border-gray-200 p-8 overflow-y-auto">
          <div className="flex flex-col items-center gap-4 sticky top-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-full"><Sparkles className="w-3 h-3 text-[#D4AF37]" /><p className="text-xs font-semibold text-gray-600">Live Preview</p></div>
            <PhoneFrame data={liveData} heroImage={watchedValues.heroImage || undefined} gallery={watchedValues.gallery} theme={watchedValues.theme} layoutId={watchedValues.layoutId} />
            <p className="text-xs text-gray-400">Preview diperbarui secara real-time</p>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {(isDirty || isPending) && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <button onClick={handleSubmit(() => allMutation.mutate())} disabled={isPending} className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-semibold text-white bg-[#D4AF37] hover:bg-[#b8962e] shadow-xl disabled:opacity-70">
              {isPending ? "Menyimpan..." : allSaved ? "Tersimpan" : "Simpan Semua"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}