"use client";

import { useSearchParams } from "next/navigation";
import { useInvitationStore } from "@/store/useInvitationStore";
import { useInvitation } from "@/hooks/useInvitation";
import { useRecordView } from "@/hooks/useRecordView";
import { TEMPLATE_MAP, DEFAULT_TEMPLATE_ID } from "@/templates/registry";

export default function InvitationShell({ slug: slugProp }: { slug?: string }) {
  const { slug: storeSlug } = useInvitationStore();
  const searchParams = useSearchParams();
  const guestName = searchParams.get("to") ?? undefined;
  const slug = slugProp ?? storeSlug;
  useRecordView(slug);
  const { data, isLoading, isError } = useInvitation(slug);
  const Template = data
    ? (TEMPLATE_MAP[data.layoutId] ?? TEMPLATE_MAP[DEFAULT_TEMPLATE_ID])
    : undefined;
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8F5F2]">
        <div className="w-6 h-6 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8F5F2]">
        <p className="text-sm text-stone-400">Undangan tidak ditemukan.</p>
      </div>
    );
  }

  if (!Template) return null;

  return (
    <div className="h-screen w-full overflow-hidden">
      <Template
        data={data}
        heroImage={data.heroImage || undefined}
        theme={data.theme}
        invitationId={data.invitationId}
        guestName={guestName}
      />
    </div>
  );
}
