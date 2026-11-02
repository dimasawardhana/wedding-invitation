import { type ComponentType } from "react";
import { type TemplateProps } from "./types";
import StorytellerTemplate from "./StorytellerTemplate";
import ModernScrollTemplate from "./ModernScrollTemplate";

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
] as const;

export type TemplateId = (typeof TEMPLATE_REGISTRY)[number]["id"];

export const TEMPLATE_MAP: Record<string, ComponentType<TemplateProps>> = {
  storyteller: StorytellerTemplate,
  "modern-scroll": ModernScrollTemplate,
};

export const DEFAULT_TEMPLATE_ID: TemplateId = "storyteller";
