import { type InvitationData } from "@/hooks/useInvitation";

const FALLBACK_GROOM = "Mempelai Pria";
const FALLBACK_BRIDE = "Mempelai Wanita";

function clean(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export function validDateValue(value: string | null | undefined): string | null {
  const normalized = clean(value);
  if (!normalized) return null;
  const timestamp = new Date(normalized).getTime();
  return Number.isNaN(timestamp) ? null : normalized;
}

export function formatInvitationDate(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
  fallback = "Tanggal akan diumumkan",
): string {
  const valid = validDateValue(value);
  return valid ? new Date(valid).toLocaleDateString("id-ID", options) : fallback;
}

export function coupleDisplayName(
  nickname: string | null | undefined,
  fullName: string | null | undefined,
  fallback: string,
): string {
  return clean(nickname) || clean(fullName) || fallback;
}

/**
 * Makes incomplete drafts safe to render in both the editor preview and public
 * templates. It does not invent persisted data: fallbacks exist only in the
 * display model passed to a template.
 */
export function normalizeInvitationForDisplay(data: InvitationData): InvitationData {
  const groomName = coupleDisplayName(data.groomName, data.groom.fullName, FALLBACK_GROOM);
  const brideName = coupleDisplayName(data.brideName, data.bride.fullName, FALLBACK_BRIDE);
  const weddingDate =
    validDateValue(data.weddingDate) ??
    data.weddingEvents.map((event) => validDateValue(event.date)).find(Boolean) ??
    "";

  return {
    ...data,
    title: clean(data.title) || `The Wedding of ${groomName} & ${brideName}`,
    groomName,
    brideName,
    weddingDate,
    groom: {
      ...data.groom,
      fullName: clean(data.groom.fullName) || groomName,
      order: clean(data.groom.order) || "Putra dari",
      fatherName: clean(data.groom.fatherName) || "Keluarga mempelai pria",
      motherName: clean(data.groom.motherName),
    },
    bride: {
      ...data.bride,
      fullName: clean(data.bride.fullName) || brideName,
      order: clean(data.bride.order) || "Putri dari",
      fatherName: clean(data.bride.fatherName) || "Keluarga mempelai wanita",
      motherName: clean(data.bride.motherName),
    },
    events: data.events.filter((event) => clean(event.year) || clean(event.title) || clean(event.desc)),
    weddingEvents: data.weddingEvents.filter(
      (event) =>
        clean(event.title) ||
        validDateValue(event.date) !== null ||
        clean(event.time) ||
        clean(event.locationName) ||
        clean(event.address),
    ),
    gallery: data.gallery.filter((url) => clean(url)),
    bankAccounts: data.bankAccounts.filter(
      (account) => clean(account.bankName) || clean(account.accountNumber) || clean(account.accountHolder),
    ),
    qrisAccounts: data.qrisAccounts.filter((account) => clean(account.name) || clean(account.imageUrl)),
  };
}
