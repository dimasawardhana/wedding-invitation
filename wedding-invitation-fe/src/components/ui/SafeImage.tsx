"use client";

import { useState } from "react";
import Image from "next/image";

type Variant = "photo" | "cover" | "gallery";

function Placeholder({ variant }: { variant: Variant }) {
  if (variant === "photo") {
    return (
      <div className="w-full h-full bg-stone-200 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" className="w-1/2 h-1/2 text-stone-400" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  if (variant === "gallery") {
    return (
      <div className="w-full h-full bg-stone-200 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" className="w-1/3 h-1/3 text-stone-400" stroke="currentColor" strokeWidth={1.5}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-full h-full bg-stone-300" />
  );
}

type Props = {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  variant?: Variant;
};

export default function SafeImage({ src, alt, fill = true, className, sizes, priority, variant = "gallery" }: Props) {
  const [error, setError] = useState(false);

  if (error) return <Placeholder variant={variant} />;

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      onError={() => setError(true)}
    />
  );
}
