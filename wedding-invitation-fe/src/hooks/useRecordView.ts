"use client";

import { useEffect } from "react";
import { recordInvitationView } from "@/lib/api";

const VIEW_KEY = "wi-viewed";

export function useRecordView(slug: string | undefined) {
  useEffect(() => {
    if (!slug) return;
    const key = `${VIEW_KEY}:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      return;
    }
    recordInvitationView(slug).catch(() => {});
  }, [slug]);
}
