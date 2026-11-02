"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [hydrated, setHydrated] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (!useAuthStore.persist.hasHydrated()) return unsub;
    Promise.resolve().then(() => setHydrated(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace("/login");
    } else {
      Promise.resolve().then(() => setChecked(true));
    }
  }, [hydrated, token, router]);

  if (!checked) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F8F5F2]">
        <div className="w-6 h-6 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
