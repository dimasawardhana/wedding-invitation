"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type BankAccount,
  type QrisAccount,
  type TimelineEvent,
  type WeddingEvent,
  type Wish,
  type InvitationData,
} from "@/hooks/useInvitation";

type Person = {
  fullName: string;
  photo: string;
  fatherName: string;
  motherName: string;
  order: string;
};

export type GalleryItem = {
  id: string;
  url: string;
  caption: string;
};

export type ThemeConfig = {
  colorScheme: string;
  fontPair: string;
  music: string;
};

export type InvitationStoreState = {
  invitationId: string;
  slug: string;
  status: "draft" | "published";
  heroImage: string;
  title: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  layoutId: string;
  groom: Person;
  bride: Person;
  events: TimelineEvent[];
  weddingEvents: WeddingEvent[];
  galleryItems: GalleryItem[];
  bankAccounts: BankAccount[];
  qrisAccounts: QrisAccount[];
  wishes: Wish[];
  theme: ThemeConfig;
};

type InvitationStore = InvitationStoreState & {
  updateInvitation: (patch: Partial<InvitationStoreState>) => void;
  resetInvitation: () => void;
};

const DEFAULT_STATE: InvitationStoreState = {
  invitationId: "",
  slug: "tony-stella",
  status: "draft",
  heroImage: "",
  title: "The Wedding of Tony & Stella",
  groomName: "Tony",
  brideName: "Stella",
  weddingDate: "2025-12-12",
  layoutId: "storyteller",
  groom: {
    fullName: "Tony Wijaya, S.Kom",
    photo: "",
    fatherName: "Bapak Hendra Wijaya",
    motherName: "Ibu Ratna Wijaya",
    order: "Putra pertama dari",
  },
  bride: {
    fullName: "Stella Kusuma, S.E",
    photo: "",
    fatherName: "Bapak Darmawan Kusuma",
    motherName: "Ibu Sri Kusuma",
    order: "Putri kedua dari",
  },
  events: [
    { year: "2019", title: "First Meet", desc: "Bertemu pertama kali di kantin kampus." },
    { year: "2020", title: "Falling in Love", desc: "Dari teman menjadi lebih dari sekadar teman." },
    { year: "2023", title: "The Proposal", desc: "Di tepi pantai Nusa Penida, Tony berlutut." },
    { year: "2025", title: "Till Forever", desc: "Hari ini kami memulai babak baru bersama." },
  ],
  weddingEvents: [
    {
      type: "akad",
      title: "Akad Nikah",
      date: "2025-12-12",
      time: "08.00 – 10.00 WIB",
      locationName: "Masjid Agung Al-Azhar",
      address: "Jl. Sisingamangaraja, Kebayoran Baru, Jakarta Selatan",
      mapsUrl: "https://maps.google.com/?q=Masjid+Agung+Al-Azhar+Jakarta",
    },
    {
      type: "resepsi",
      title: "Resepsi",
      date: "2025-12-12",
      time: "11.00 – 14.00 WIB",
      locationName: "Balai Kartini",
      address: "Jl. Gatot Subroto Kav. 37, Kuningan, Jakarta Selatan",
      mapsUrl: "https://maps.google.com/?q=Balai+Kartini+Jakarta",
    },
  ],
  galleryItems: [
    { id: "1", url: "https://picsum.photos/seed/wedding1/400/500", caption: "Prewedding" },
    { id: "2", url: "https://picsum.photos/seed/wedding2/400/500", caption: "Lamaran" },
  ],
  bankAccounts: [],
  qrisAccounts: [],
  wishes: [
    { id: "1", name: "Budi Santoso", message: "Selamat menempuh hidup baru! Semoga selalu bahagia dan diberkahi. 🎉", attendance: "hadir", pax: 2, timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: "2", name: "Rina Melati", message: "Bahagia selalu ya kak Tony dan kak Stella! Langgeng sampai kakek nenek 💕", attendance: "hadir", pax: 3, timestamp: new Date(Date.now() - 5 * 3600000).toISOString() },
    { id: "3", name: "Deni Kurniawan", message: "Congrats! Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.", attendance: "tidak", pax: 0, timestamp: new Date(Date.now() - 26 * 3600000).toISOString() },
    { id: "4", name: "Sari Dewi", message: "Wish you both a lifetime of love and laughter! 🌸", attendance: "hadir", pax: 1, timestamp: new Date(Date.now() - 30 * 3600000).toISOString() },
    { id: "5", name: "Ahmad Fauzi", message: "Semoga pernikahan kalian penuh berkah!", attendance: "hadir", pax: 2, timestamp: new Date(Date.now() - 50 * 3600000).toISOString() },
    { id: "6", name: "Lestari Ningrum", message: "Semoga langgeng sampai tua dan selalu dalam lindungan-Nya!", attendance: "hadir", pax: 4, timestamp: new Date(Date.now() - 72 * 3600000).toISOString() },
    { id: "7", name: "Bambang Setiawan", message: "Maaf tidak bisa hadir, tapi doa selalu menyertai.", attendance: "tidak", pax: 0, timestamp: new Date(Date.now() - 96 * 3600000).toISOString() },
  ],
  theme: {
    colorScheme: "gold-ivory",
    fontPair: "playfair-geist",
    music: "",
  },
};

export const useInvitationStore = create<InvitationStore>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      updateInvitation: (patch) => set((state) => ({ ...state, ...patch })),
      resetInvitation: () => set(DEFAULT_STATE),
    }),
    {
      name: "wedding-invitation-store",
    }
  )
);

export function storeToInvitationData(state: InvitationStoreState): InvitationData {
  return {
    slug: state.slug,
    theme: state.theme,
    heroImage: state.heroImage,
    layoutId: state.layoutId,
    title: state.title,
    groomName: state.groomName,
    brideName: state.brideName,
    weddingDate: state.weddingDate,
    groom: state.groom,
    bride: state.bride,
    events: state.events,
    weddingEvents: state.weddingEvents,
    gallery: state.galleryItems.map((g) => g.url),
    bankAccounts: state.bankAccounts,
    qrisAccounts: state.qrisAccounts,
    wishes: state.wishes,
  };
}
