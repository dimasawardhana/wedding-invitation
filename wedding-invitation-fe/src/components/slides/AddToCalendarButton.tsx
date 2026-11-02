"use client";

import { useState } from "react";
import { buildInvitationIcs, downloadIcs } from "@/lib/ics";

type Props = {
  title: string;
  weddingDate: string;
  description: string;
  className?: string;
  label?: string;
};

export default function AddToCalendarButton({
  title,
  weddingDate,
  description,
  className,
  label = "Simpan ke Kalender",
}: Props) {
  const [done, setDone] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    const ics = buildInvitationIcs({ title, weddingDate, description });
    if (!ics) return;
    downloadIcs(ics, "undangan-nikah.ics");
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  }

  return (
    <button onClick={handleClick} className={className}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="w-3.5 h-3.5 shrink-0"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round" />
        <path d="M12 14v4M10 16h4" strokeLinecap="round" />
      </svg>
      {done ? "Tersimpan" : label}
    </button>
  );
}
