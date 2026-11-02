import { type InvitationData } from "@/hooks/useInvitation";
import { type ThemeConfig } from "@/store/useInvitationStore";

export type TemplateProps = {
  data: InvitationData;
  heroImage?: string;
  theme: ThemeConfig;
  invitationId?: string;
  guestName?: string;
};
