"use client";

import { useState } from "react";
import { Check, Music, Type, Palette, AlertCircle, Loader2 } from "lucide-react";
import {
  COLOR_SCHEMES,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_FONT_PAIR,
  FONT_PAIRS,
  fontVarsFor,
} from "@/lib/theme";
import { useInvitationStore } from "@/store/useInvitationStore";
import { patchInvitation, storeToApiPatchPayload } from "@/lib/api";

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
        <Icon className="w-4.5 h-4.5 text-[#D4AF37]" />
      </div>
      <div>
        <h2 className="font-semibold text-gray-800">{title}</h2>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}

export default function ThemeTab() {
  const { invitationId, theme, updateInvitation } = useInvitationStore();
  const [musicUrl, setMusicUrl] = useState(theme.music || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const colorScheme = COLOR_SCHEMES.some((s) => s.id === theme.colorScheme)
    ? theme.colorScheme
    : DEFAULT_COLOR_SCHEME;
  const fontPair = FONT_PAIRS.some((p) => p.id === theme.fontPair) ? theme.fontPair : DEFAULT_FONT_PAIR;

  async function handleSave() {
    if (!invitationId) {
      setSaveError("Undangan belum termuat");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await patchInvitation(invitationId, storeToApiPatchPayload(useInvitationStore.getState()));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Gagal menyimpan tema");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>
          Tema Undangan
        </h1>
        <p className="text-sm text-gray-500 mt-1">Pilih tampilan, musik, dan tipografi yang mencerminkan Anda.</p>
      </div>

      {saveError && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-600">{saveError}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <SectionHeader icon={Palette} title="Palet Warna" subtitle="Pilih tema warna undangan Anda" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {COLOR_SCHEMES.map((scheme) => (
            <button
              key={scheme.id}
              onClick={() => {
                updateInvitation({ theme: { ...theme, colorScheme: scheme.id } });
                setSaveError(null);
              }}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                colorScheme === scheme.id ? "border-[#D4AF37]" : "border-gray-100 hover:border-gray-200"
              }`}
            >
              {colorScheme === scheme.id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#D4AF37] flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="flex gap-1.5 mb-3">
                {scheme.preview.map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <p className="text-sm font-medium text-gray-800">{scheme.name}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <SectionHeader icon={Type} title="Pasangan Font" subtitle="Pilih tipografi heading dan body text" />
        <div className="space-y-3">
          {FONT_PAIRS.map((pair) => (
            <button
              key={pair.id}
              onClick={() => {
                updateInvitation({ theme: { ...theme, fontPair: pair.id } });
                setSaveError(null);
              }}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                fontPair === pair.id ? "border-[#D4AF37] bg-amber-50/30" : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div>
                <p className="text-lg text-gray-900" style={fontVarsFor(pair.id) as React.CSSProperties}>
                  {pair.heading}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Body: {pair.body}</p>
              </div>
              {fontPair === pair.id && (
                <div className="w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <SectionHeader icon={Music} title="Musik Latar" subtitle="Tempel URL file audio (mp3) untuk diputar saat undangan dibuka" />
        <input
          type="url"
          value={musicUrl}
          onChange={(e) => {
            setMusicUrl(e.target.value);
            updateInvitation({ theme: { ...theme, music: e.target.value } });
            setSaveError(null);
          }}
          placeholder="https://...mp3"
          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl outline-none transition-all focus:border-[#D4AF37]"
        />
        <p className="text-xs text-gray-400 mt-2">Kosongkan untuk menonaktifkan musik latar.</p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !invitationId}
          className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold bg-[#D4AF37] text-white hover:bg-[#b8962e] transition-colors shadow-md shadow-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saved ? "Tersimpan" : "Simpan Tema"}
        </button>
      </div>
    </div>
  );
}
