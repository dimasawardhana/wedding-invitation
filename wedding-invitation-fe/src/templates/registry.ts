import { type ComponentType } from "react";
import dynamic from "next/dynamic";
import { type TemplateProps } from "./types";

export const TEMPLATE_REGISTRY = [
  {
    id: "storyteller",
    name: "Storyteller",
    description: "Slideshow sinematik layar penuh",
  },
  {
    id: "modern-scroll",
    name: "Modern Scroll",
    description: "Scrolling elegan, satu halaman",
  },
  {
    id: "islamic",
    name: "Islamic",
    description: "Ornamen islami, akad-first, hijau zamrud",
  },
  {
    id: "rustic",
    name: "Rustic",
    description: "Kraft paper, botani, hangat",
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Tipografi bersih, monokrom",
  },
] as const;

export type TemplateId = (typeof TEMPLATE_REGISTRY)[number]["id"];

// Code-split: each guest downloads only the template they are viewing. ssr:false
// is required anyway — every template is "use client" with browser-only
// navigation logic (wheel/touch/snap).
const loader = (importer: Promise<{ default: ComponentType<TemplateProps> }>) =>
  dynamic(() => importer, {
    ssr: false,
  }) as unknown as ComponentType<TemplateProps>;

export const TEMPLATE_MAP: Record<string, ComponentType<TemplateProps>> = {
  storyteller: loader(import("./StorytellerTemplate")),
  "modern-scroll": loader(import("./ModernScrollTemplate")),
  islamic: loader(import("./IslamicTemplate")),
  rustic: loader(import("./RusticTemplate")),
  minimalist: loader(import("./MinimalistTemplate")),
};

export const DEFAULT_TEMPLATE_ID: TemplateId = "storyteller";
