"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { getInvitationById, apiInvitationToStoreState } from "@/lib/api";
import { useInvitationStore } from "@/store/useInvitationStore";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AuthGuard from "@/components/auth/AuthGuard";

type Props = { params: Promise<{ id: string }> };

function InvitationDashboard({ id }: { id: string }) {
  const { updateInvitation, invitationId } = useInvitationStore();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (invitationId === id) {
      Promise.resolve().then(() => setReady(true));
      return;
    }
    getInvitationById(id)
      .then((api) => {
        updateInvitation(apiInvitationToStoreState(api));
        setReady(true);
      })
      .catch(() => setError(true));
  }, [id, invitationId, updateInvitation]);

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F3F4F6]">
        <p className="text-sm text-gray-400">Undangan tidak ditemukan.</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F3F4F6]">
        <div className="w-6 h-6 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
      </div>
    );
  }

  return <DashboardLayout />;
}

export default function InvitationDashboardPage({ params }: Props) {
  const { id } = use(params);
  return (
    <AuthGuard>
      <InvitationDashboard id={id} />
    </AuthGuard>
  );
}
