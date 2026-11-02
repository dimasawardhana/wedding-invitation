"use client";

import Image from "next/image";

function GImg({ src, index }: { src: string; index: number }) {
  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-gray-200" style={{ flex: 1, minHeight: 0 }}>
      <Image src={src} alt={`Gallery ${index + 1}`} fill className="object-cover" sizes="150px" />
    </div>
  );
}

function ColGroup({ images, startIndex, gap }: { images: string[]; startIndex: number; gap: number }) {
  return (
    <div className="flex flex-col h-full" style={{ flex: 1, gap }}>
      {images.map((src, i) => (
        <GImg key={src} src={src} index={startIndex + i} />
      ))}
    </div>
  );
}

function PreviewGallery({ images }: { images: string[] }) {
  const all = images.slice(0, 10);
  const n = all.length;
  const gap = n <= 4 ? 4 : 2;
  const leftCount = Math.floor(n / 2);
  const left = all.slice(0, leftCount);
  const right = all.slice(leftCount);

  return (
    <div className="h-full w-full bg-[#F8F5F2] flex flex-col px-4 pt-8 pb-4 gap-3">
      <p className="font-playfair text-center text-xs tracking-[0.3em] text-stone-400 uppercase shrink-0">
        Captured Memories
      </p>
      <div className="flex-1 min-h-0">
        {n === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-stone-400">No photos yet</p>
          </div>
        )}
        {n === 1 && (
          <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-200">
            <Image src={all[0]} alt="Gallery 1" fill className="object-cover" sizes="300px" />
          </div>
        )}
        {n >= 2 && (
          <div className="flex h-full" style={{ gap }}>
            <ColGroup images={left} startIndex={0} gap={gap} />
            <ColGroup images={right} startIndex={leftCount} gap={gap} />
          </div>
        )}
      </div>
    </div>
  );
}

export default PreviewGallery;
