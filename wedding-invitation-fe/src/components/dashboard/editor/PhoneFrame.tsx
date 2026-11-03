"use client";

import { type InvitationData } from "@/hooks/useInvitation";
import { TEMPLATE_MAP, DEFAULT_TEMPLATE_ID } from "@/templates/registry";
import { normalizeInvitationForDisplay } from "@/lib/invitation-display";

type ThemeConfig = {
  colorScheme: string;
  fontPair: string;
  music: string;
};

type GalleryItem = {
  id: string;
  url: string;
  caption: string;
};

function PreviewShell({ data, heroImage, gallery, theme, layoutId }: {
  data: InvitationData;
  heroImage?: string;
  gallery?: GalleryItem[];
  theme?: ThemeConfig;
  layoutId?: string;
}) {
  const Template = TEMPLATE_MAP[layoutId ?? ""] ?? TEMPLATE_MAP[DEFAULT_TEMPLATE_ID];
  const previewData = normalizeInvitationForDisplay({
    ...data,
    gallery: gallery?.map((g) => g.url) ?? data.gallery,
  });
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#F8F5F2]">
      <Template
        data={previewData}
        heroImage={heroImage}
        theme={theme ?? { colorScheme: "gold-ivory", fontPair: "playfair-geist", music: "" }}
      />
    </div>
  );
}

export default function PhoneFrame({ data, heroImage, gallery, theme, layoutId }: {
  data: InvitationData;
  heroImage?: string;
  gallery?: GalleryItem[];
  theme?: ThemeConfig;
  layoutId?: string;
}) {
  return (
    <div className="relative shrink-0" data-testid="template-preview">
      <div
        className="relative"
        style={{
          width: 288,
          borderRadius: 50,
          background: "linear-gradient(145deg, #2a2a2a, #111111)",
          padding: "13px 12px 16px",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.08), 0 40px 80px rgba(0,0,0,0.55), 0 0 0 1.5px #0a0a0a",
        }}
      >
        <div className="absolute rounded-l-sm bg-[#2a2a2a]" style={{ left: -3, top: 108, width: 3, height: 34 }} />
        <div className="absolute rounded-l-sm bg-[#2a2a2a]" style={{ left: -3, top: 158, width: 3, height: 34 }} />
        <div className="absolute rounded-l-sm bg-[#2a2a2a]" style={{ left: -3, top: 208, width: 3, height: 34 }} />
        <div className="absolute rounded-r-sm bg-[#2a2a2a]" style={{ right: -3, top: 148, width: 3, height: 60 }} />

        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: 38,
            height: 580,
            background: "#F8F5F2",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 375,
              height: 812,
              transform: "scale(0.704)",
              transformOrigin: "top left",
              left: 1,
              top: 0,
            }}
          >
            <PreviewShell
              data={data}
              heroImage={heroImage}
              gallery={gallery}
              theme={theme}
              layoutId={layoutId}
            />
          </div>

          <div
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 rounded-full"
            style={{ width: 100, height: 4, background: "rgba(0,0,0,0.2)" }}
          />
        </div>

        <div
          className="absolute inset-x-3 top-3 pointer-events-none rounded-t-[40px]"
          style={{
            height: "45%",
            background: "linear-gradient(to bottom, rgba(255,255,255,0.07) 0%, transparent 100%)",
          }}
        />
      </div>
    </div>
  );
}
