"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getInvitationBySlug,
  getPublicRsvpList,
  apiInvitationToInvitationData,
  apiRsvpToWish,
} from "@/lib/api";
import { type ThemeConfig } from "@/store/useInvitationStore";

type Person = {
  fullName: string;
  photo: string;
  fatherName: string;
  motherName: string;
  order: string;
};

export type TimelineEvent = {
  year: string;
  title: string;
  desc: string;
};

export type WeddingEvent = {
  type: "akad" | "resepsi";
  title: string;
  date: string;
  time: string;
  locationName: string;
  address: string;
  mapsUrl: string;
};

export type BankAccount = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

export type QrisAccount = {
  name: string;
  imageUrl: string;
};

export type Wish = {
  id: string;
  name: string;
  message: string;
  attendance?: "hadir" | "tidak";
  pax?: number;
  timestamp?: string;
};

export type InvitationData = {
  invitationId?: string;
  slug: string;
  title: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  theme: ThemeConfig;
  heroImage: string;
  layoutId: string;
  groom: Person;
  bride: Person;
  events: TimelineEvent[];
  weddingEvents: WeddingEvent[];
  gallery: string[];
  videoUrl?: string;
  bankAccounts: BankAccount[];
  qrisAccounts: QrisAccount[];
  wishes: Wish[];
};

export function useInvitation(slug: string) {
  return useQuery<InvitationData>({
    queryKey: ["invitation", slug],
    queryFn: async () => {
      const api = await getInvitationBySlug(slug);
      const rsvps = await getPublicRsvpList(slug).catch(() => []);
      return { ...apiInvitationToInvitationData(api), wishes: rsvps.map(apiRsvpToWish) };
    },
    enabled: !!slug,
    staleTime: 60000,
  });
}
