import { expect, type APIRequestContext, type Page } from "@playwright/test";

// API base the browser under test talks to. Must match playwright.config.ts.
export const API_BASE = `http://localhost:${process.env.E2E_API_PORT ?? 8090}`;

/**
 * Navigation/visibility budget. Generous because `next dev` compiles each route
 * on first request, which takes tens of seconds on a cold cache.
 */
export const NAV_TIMEOUT = 60_000;

export type SeededAccount = {
  email: string;
  password: string;
  token: string;
  userId: string;
  invitationId: string;
  slug: string;
};

/** A unique-enough suffix so parallel/repeat runs never collide on slug or email. */
function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Creates a throwaway account with one invitation via the public API — the same
 * endpoints the UI uses, so the fixture cannot drift from the app contract.
 * Runs before the browser logs in, so the login screen exercises a real account.
 */
export async function seedAccount(
  request: APIRequestContext,
  label = "galeri",
): Promise<SeededAccount> {
  const suffix = uniqueSuffix();
  const email = `e2e-${label}-${suffix}@example.com`;
  const password = "e2e-password-123";
  const slug = `e2e-${label}-${suffix}`;

  const registerRes = await request.post(`${API_BASE}/api/v1/auth/register`, {
    data: { name: "E2E Owner", email, password },
  });
  expect(registerRes.ok(), `register failed: ${await registerRes.text()}`).toBeTruthy();
  const registered = (await registerRes.json()) as {
    data: { token: string; user: { id: string } };
  };
  const token = registered.data.token;

  const createRes = await request.post(`${API_BASE}/api/v1/admin/invitation`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { slug, layout_id: "storyteller" },
  });
  expect(createRes.ok(), `create invitation failed: ${await createRes.text()}`).toBeTruthy();
  const created = (await createRes.json()) as { data: { id: string } };

  return { email, password, token, userId: registered.data.user.id, invitationId: created.data.id, slug };
}

/** Signs in through the real login form and waits for the dashboard list. */
export async function loginThroughUi(page: Page, account: SeededAccount): Promise<void> {
  // `next dev` compiles /login and /dashboard on first hit; allow for that.
  await page.goto("/login", { timeout: NAV_TIMEOUT });
  await page.locator('input[type="email"], input[name="email"]').fill(account.email);
  await page.locator('input[type="password"]').fill(account.password);
  await page.getByRole("button", { name: /masuk/i }).first().click();
  await page.waitForURL(/\/dashboard/, { timeout: NAV_TIMEOUT });
}

/**
 * Opens the invitation's own dashboard (the tabbed view, not the editor).
 * The list card's "Edit" button leads to the editor, so navigate directly —
 * which also proves the deep link works after a hard load.
 */
export async function openDashboard(page: Page, account: SeededAccount): Promise<void> {
  await page.goto(`/dashboard/${account.invitationId}`, { timeout: NAV_TIMEOUT });
  await expect(page.getByRole("button", { name: "Galeri" })).toBeVisible({ timeout: NAV_TIMEOUT });
}

/** Server-side truth for assertions; the UI must agree with this. */
export async function fetchInvitation(
  request: APIRequestContext,
  account: SeededAccount,
): Promise<{
  gallery: { id: string; url: string; caption: string }[];
  theme_config: { colorScheme?: string; fontPair?: string } | null;
  music_url: string;
}> {
  const res = await request.get(`${API_BASE}/api/v1/admin/invitation/${account.invitationId}`, {
    headers: { Authorization: `Bearer ${account.token}` },
  });
  expect(res.ok(), `fetch invitation failed: ${await res.text()}`).toBeTruthy();
  const body = (await res.json()) as { data: Record<string, unknown> };
  return {
    ...body.data,
    gallery: (body.data.gallery ?? []) as { id: string; url: string; caption: string }[],
  } as never;
}

/** A 1x1 PNG — the smallest thing the upload endpoint accepts. */
export const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  "base64",
);

/** Lists stored object keys, so a delete can be proven to reach storage. */
export async function listStoredObjects(): Promise<string[]> {
  const { execFileSync } = await import("node:child_process");
  const out = execFileSync(
    "docker",
    [
      "exec",
      "wedding-invitation-be-minio-1",
      "sh",
      "-c",
      "mc alias set local http://localhost:9000 minioadmin minioadmin >/dev/null 2>&1; mc ls --recursive local/wedding-uploads",
    ],
    { encoding: "utf8" },
  );
  return out
    .split("\n")
    .map((line) => line.trim().split(/\s+/).pop() ?? "")
    .filter(Boolean);
}
