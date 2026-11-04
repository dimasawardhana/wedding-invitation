"use client";

import { useState } from "react";
import Image from "next/image";

type Variant =
  | "cover"
  | "groom"
  | "bride"
  | "photo"
  | "gallery"
  | "gallery-alt";

const DEFAULTS: Record<Variant, string> = {
  cover: "/defaults/hero.jpg",
  groom: "/defaults/groom.jpg",
  bride: "/defaults/bride.jpg",
  photo: "/defaults/couple.jpg",
  gallery: "/defaults/gallery-1.jpg",
  "gallery-alt": "/defaults/gallery-2.jpg",
};

function DefaultPhoto({ variant, alt }: { variant: Variant; alt: string }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <Image
        src={DEFAULTS[variant]}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
}

type Props = {
  src?: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  variant?: Variant;
};

export default function SafeImage({
  src,
  alt,
  fill = true,
  className,
  sizes,
  priority,
  variant = "gallery",
}: Props) {
  const [error, setError] = useState(false);

  if (error || !src || !src.trim())
    return <DefaultPhoto variant={variant} alt={alt} />;

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
