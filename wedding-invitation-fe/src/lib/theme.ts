export type ColorScheme = {
  id: string;
  name: string;
  accent: string;
  preview: [string, string, string];
};

// Single source of truth for the invitation palette. Every scheme here is
// supported by the template accent maps — keep this list and the templates in sync.
export const COLOR_SCHEMES: ColorScheme[] = [
  { id: "gold-ivory", name: "Gold & Ivory", accent: "#D4AF37", preview: ["#D4AF37", "#F5F0E8", "#8B7355"] },
  { id: "blush-rose", name: "Blush & Rose", accent: "#E8A4B8", preview: ["#E8A4B8", "#F9C6D0", "#C4728A"] },
  { id: "sage-green", name: "Sage & Green", accent: "#8FAE88", preview: ["#8FAE88", "#C8DBC5", "#4A7A43"] },
  { id: "dusty-blue", name: "Dusty Blue", accent: "#7BA7BC", preview: ["#7BA7BC", "#B8D4DF", "#3D7A96"] },
  { id: "terracotta", name: "Terracotta", accent: "#C4714B", preview: ["#C4714B", "#E8B89E", "#8B4513"] },
  { id: "midnight", name: "Midnight Luxe", accent: "#C0A870", preview: ["#C0A870", "#2D2D5A", "#F5F0E8"] },
];

export const COLOR_SCHEME_MAP: Record<string, string> = Object.fromEntries(
  COLOR_SCHEMES.map((c) => [c.id, c.accent]),
);

export const DEFAULT_COLOR_SCHEME = "gold-ivory";
export const DEFAULT_ACCENT = "#D4AF37";

export type FontPair = {
  id: string;
  heading: string;
  body: string;
  /** CSS custom property the heading font is registered under in layout.tsx. */
  headingVar: string;
  /** CSS custom property the body font is registered under in layout.tsx. */
  bodyVar: string;
};

export const FONT_PAIRS: FontPair[] = [
  { id: "playfair-geist", heading: "Playfair Display", body: "Geist Sans", headingVar: "--font-playfair", bodyVar: "--font-geist-sans" },
  { id: "cormorant-inter", heading: "Cormorant Garamond", body: "Inter", headingVar: "--font-cormorant", bodyVar: "--font-inter" },
  { id: "libre-lato", heading: "Libre Baskerville", body: "Lato", headingVar: "--font-libre", bodyVar: "--font-lato" },
  { id: "montserrat-open", heading: "Montserrat", body: "Open Sans", headingVar: "--font-montserrat", bodyVar: "--font-open-sans" },
];

export const DEFAULT_FONT_PAIR = "playfair-geist";

// Templates style headings with `font-playfair` and body copy with `font-sans`,
// which compile to `var(--font-playfair)` / `var(--font-sans)`. Rebinding those
// two variables on the invitation root re-fonts the whole invitation without
// touching an element — the indirection the raw expression would not convey.
export function fontVarsFor(fontPair: string | undefined | null): Record<string, string> {
  const pair = FONT_PAIRS.find((f) => f.id === fontPair) ?? FONT_PAIRS[0];
  return {
    "--font-playfair": `var(${pair.headingVar})`,
    "--font-sans": `var(${pair.bodyVar})`,
  };
}
