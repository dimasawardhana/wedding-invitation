import { type InvitationData, type Wish } from "@/hooks/useInvitation";
import { type InvitationStoreState, type GalleryItem } from "@/store/useInvitationStore";
import { useAuthStore, type AuthUser } from "@/store/useAuthStore";

// Configurable so scripts (e2e) and deploys can point at a different backend
// without editing source. Next inlines NEXT_PUBLIC_* at build time.
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

type ApiEnvelope<T> = {
  status: "success" | "error";
  data: T;
  message: string;
};

type ApiPerson = {
  fullName: string;
  nickname: string;
  fatherName: string;
  motherName: string;
  order: string;
  photo: string;
};

type ApiCouple = {
  title?: string;
  heroImage?: string;
  weddingDate?: string;
  groom?: ApiPerson;
  bride?: ApiPerson;
  bankAccounts?: Array<{ bankName: string; accountNumber: string; accountHolder: string }>;
  qrisAccounts?: Array<{ name: string; imageUrl: string }>;
};

type ApiGalleryItem = { id: string; url: string; caption: string };

type ApiThemeConfig = {
  colorScheme?: string;
  fontPair?: string;
};

export type InvitationStatus = "draft" | "published";

export type ApiInvitation = {
  id: string;
  slug: string;
  status: InvitationStatus;
  layout_id: string | null;
  theme_config: ApiThemeConfig | null;
  music_url: string | null;
  couple: ApiCouple | null;
  events: Array<{ type: string; title: string; date: string; time: string; locationName: string; address: string; mapsUrl: string }> | null;
  stories: Array<{ year: string; title: string; desc: string }> | null;
  gallery: ApiGalleryItem[] | null;
  created_at: string;
  views: number;
  updated_at: string;
};

export type ApiRsvp = {
  id: string;
  invitation_id: string;
  guest_name: string;
  attendance_status: boolean;
  total_pax: number;
  message: string;
  created_at: string;
};

export type CreateInvitationPayload = PatchInvitationPayload & { slug: string };

export type PatchInvitationPayload = {
  slug?: string;
  layout_id?: string;
  theme_config?: ApiThemeConfig;
  music_url?: string;
  couple?: ApiCouple;
  events?: ApiInvitation["events"];
  stories?: ApiInvitation["stories"];
  gallery?: ApiGalleryItem[];
  status?: InvitationStatus;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, options);
  const json: ApiEnvelope<T> = await res.json();
  if (json.status === "error") throw new Error(json.message || "API error");
  return json.data;
}

export type ApiAuthResponse = {
  token: string;
  user: AuthUser;
};

export async function login(email: string, password: string): Promise<ApiAuthResponse> {
  return request<ApiAuthResponse>("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function register(name: string, email: string, password: string): Promise<ApiAuthResponse> {
  return request<ApiAuthResponse>("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
}

export async function createInvitation(payload: CreateInvitationPayload): Promise<ApiInvitation> {
  return request<ApiInvitation>("/api/v1/admin/invitation", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

export async function listInvitations(): Promise<ApiInvitation[]> {
  return request<ApiInvitation[]>("/api/v1/admin/invitations", {
    headers: { ...authHeaders() },
  });
}

export async function getInvitationById(id: string): Promise<ApiInvitation> {
  return request<ApiInvitation>(`/api/v1/admin/invitation/${id}`, {
    headers: { ...authHeaders() },
  });
}

export async function deleteInvitation(id: string): Promise<void> {
  await request<{ deleted: boolean }>(`/api/v1/admin/invitation/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
}

export async function getInvitationBySlug(slug: string): Promise<ApiInvitation> {
  return request<ApiInvitation>(`/api/v1/public/invitation/${slug}`);
}

export async function getPublicRsvpList(slug: string): Promise<ApiRsvp[]> {
  return request<ApiRsvp[]>(`/api/v1/public/invitation/${slug}/rsvp`);
}

export async function recordInvitationView(slug: string): Promise<number> {
  const data = await request<{ views: number }>(`/api/v1/public/invitation/${slug}/view`, {
    method: "POST",
  });
  return data.views;
}

export async function patchInvitation(id: string, payload: PatchInvitationPayload): Promise<ApiInvitation> {
  return request<ApiInvitation>(`/api/v1/admin/invitation/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

export async function getRsvpList(invitationId: string): Promise<ApiRsvp[]> {
  return request<ApiRsvp[]>(`/api/v1/admin/invitation/${invitationId}/rsvp-list`, {
    headers: { ...authHeaders() },
  });
}

export async function deleteRsvp(invitationId: string, rsvpId: string): Promise<void> {
  await request<{ deleted: boolean }>(
    `/api/v1/admin/invitation/${invitationId}/rsvp/${rsvpId}`,
    {
      method: "DELETE",
      headers: { ...authHeaders() },
    }
  );
}

export async function submitRsvp(payload: {
  invitation_id: string;
  guest_name: string;
  attendance_status?: boolean;
  total_pax?: number;
  message?: string;
}): Promise<ApiRsvp> {
  return request<ApiRsvp>("/api/v1/public/rsvp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

const defaultPerson: ApiPerson = {
  fullName: "",
  nickname: "",
  fatherName: "",
  motherName: "",
  order: "",
  photo: "",
};

export function apiInvitationToInvitationData(api: ApiInvitation): InvitationData & { invitationId: string } {
  const couple = api.couple ?? {};
  const groom = couple.groom ?? defaultPerson;
  const bride = couple.bride ?? defaultPerson;
  return {
    invitationId: api.id,
    slug: api.slug,
    title: couple.title ?? "",
    groomName: groom.nickname ?? "",
    brideName: bride.nickname ?? "",
    weddingDate: couple.weddingDate ?? "",
    theme: {
      colorScheme: api.theme_config?.colorScheme ?? "gold-ivory",
      fontPair: api.theme_config?.fontPair ?? "playfair-geist",
      music: api.music_url ?? "",
    },
    heroImage: api.couple?.heroImage ?? "",
    layoutId: api.layout_id ?? "storyteller",
    groom: {
      fullName: groom.fullName ?? "",
      photo: groom.photo ?? "",
      fatherName: groom.fatherName ?? "",
      motherName: groom.motherName ?? "",
      order: groom.order ?? "",
    },
    bride: {
      fullName: bride.fullName ?? "",
      photo: bride.photo ?? "",
      fatherName: bride.fatherName ?? "",
      motherName: bride.motherName ?? "",
      order: bride.order ?? "",
    },
    events: (api.stories ?? []).map((s) => ({ year: s.year ?? "", title: s.title ?? "", desc: s.desc ?? "" })),
    weddingEvents: (api.events ?? []).map((e) => ({
      type: (e.type === "akad" || e.type === "resepsi" ? e.type : "akad") as "akad" | "resepsi",
      title: e.title ?? "",
      date: e.date ?? "",
      time: e.time ?? "",
      locationName: e.locationName ?? "",
      address: e.address ?? "",
      mapsUrl: e.mapsUrl ?? "",
    })),
    gallery: (api.gallery ?? []).map((g) => g.url),
    bankAccounts: couple.bankAccounts ?? [],
    qrisAccounts: couple.qrisAccounts ?? [],
    wishes: [],
  };
}

export function storeToApiPatchPayload(store: InvitationStoreState): PatchInvitationPayload {
  return {
    slug: store.slug,
    layout_id: store.layoutId,
    music_url: store.theme.music,
    theme_config: {
      colorScheme: store.theme.colorScheme,
      fontPair: store.theme.fontPair,
    },
    couple: {
      title: store.title,
      heroImage: store.heroImage,
      weddingDate: store.weddingDate,
      groom: {
        fullName: store.groom.fullName,
        nickname: store.groomName,
        fatherName: store.groom.fatherName,
        motherName: store.groom.motherName,
        order: store.groom.order,
        photo: store.groom.photo,
      },
      bride: {
        fullName: store.bride.fullName,
        nickname: store.brideName,
        fatherName: store.bride.fatherName,
        motherName: store.bride.motherName,
        order: store.bride.order,
        photo: store.bride.photo,
      },
      bankAccounts: store.bankAccounts,
      qrisAccounts: store.qrisAccounts,
    },
    events: store.weddingEvents,
    stories: store.events,
    gallery: store.galleryItems,
  };
}

export function apiInvitationToStoreState(api: ApiInvitation): Partial<InvitationStoreState> {
  const data = apiInvitationToInvitationData(api);
  return {
    invitationId: api.id,
    slug: api.slug,
    status: api.status,
    title: data.title,
    groomName: data.groomName,
    brideName: data.brideName,
    weddingDate: data.weddingDate,
    heroImage: api.couple?.heroImage ?? "",
    layoutId: api.layout_id ?? "storyteller",
    groom: data.groom,
    bride: data.bride,
    events: data.events,
    weddingEvents: data.weddingEvents,
    galleryItems: (api.gallery ?? []) as GalleryItem[],
    bankAccounts: data.bankAccounts,
    qrisAccounts: data.qrisAccounts,
    theme: {
      colorScheme: api.theme_config?.colorScheme ?? "gold-ivory",
      fontPair: api.theme_config?.fontPair ?? "playfair-geist",
      music: api.music_url ?? "",
    },
  };
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/api/v1/admin/upload/image`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  const json: ApiEnvelope<{ url: string }> = await res.json();
  if (json.status !== "success") throw new Error(json.message || "Upload gagal");
  return json.data.url;
}

export async function deleteMedia(invitationId: string, url: string): Promise<void> {
  await request<{ deleted: boolean }>(`/api/v1/admin/invitation/${invitationId}/media`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ url }),
  });
}

export function apiRsvpToWish(rsvp: ApiRsvp): Wish {
  return {
    id: rsvp.id,
    name: rsvp.guest_name,
    message: rsvp.message,
    attendance: rsvp.attendance_status ? "hadir" : "tidak",
    pax: rsvp.total_pax,
    timestamp: rsvp.created_at,
  };
}
