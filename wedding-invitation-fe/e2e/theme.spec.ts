import { expect, test } from "@playwright/test";
import { API_BASE, TINY_PNG, fetchInvitation, loginThroughUi, openDashboard, seedAccount } from "./fixtures";

test.describe("Dashboard Tema tab", () => {
  test("saves colour scheme, font pair and music URL, and they survive a reload", async ({
    page,
    request,
  }) => {
    const account = await seedAccount(request, "tema");
    await loginThroughUi(page, account);
    await openDashboard(page, account);

    await page.getByRole("button", { name: "Tema" }).click();
    await expect(page.getByRole("heading", { name: "Tema Undangan" })).toBeVisible();

    // Nothing has been saved yet.
    const before = await fetchInvitation(request, account);
    expect(before.theme_config?.colorScheme ?? null).toBeNull();

    // --- pick a non-default scheme and font pair --------------------------
    const terracotta = page.getByRole("button", { name: /terracotta/i });
    await terracotta.click();
    await expect(terracotta).toHaveClass(/border-\[#D4AF37\]/);

    const cormorant = page.getByRole("button", { name: /cormorant garamond/i });
    await cormorant.click();
    await expect(cormorant).toHaveClass(/border-\[#D4AF37\]/);

    const music = page.getByPlaceholder("https://...mp3");
    await music.fill("https://example.com/e2e-song.mp3");

    // --- save -------------------------------------------------------------
    await page.getByRole("button", { name: /simpan tema/i }).click();
    await expect(page.getByRole("button", { name: /tersimpan/i })).toBeVisible({ timeout: 30_000 });

    await expect
      .poll(async () => (await fetchInvitation(request, account)).theme_config?.colorScheme, {
        message: "colour scheme should be persisted via PATCH",
        timeout: 30_000,
      })
      .toBe("terracotta");

    const saved = await fetchInvitation(request, account);
    expect(saved.theme_config?.fontPair).toBe("cormorant-inter");
    expect(saved.music_url).toBe("https://example.com/e2e-song.mp3");

    // --- reload: every choice is restored from the server -----------------
    await page.reload();
    await page.getByRole("button", { name: "Tema" }).click();
    await expect(page.getByRole("heading", { name: "Tema Undangan" })).toBeVisible();

    await expect(page.getByRole("button", { name: /terracotta/i })).toHaveClass(/border-\[#D4AF37\]/);
    await expect(page.getByRole("button", { name: /cormorant garamond/i })).toHaveClass(
      /border-\[#D4AF37\]/,
    );
    await expect(page.getByPlaceholder("https://...mp3")).toHaveValue("https://example.com/e2e-song.mp3");
  });

  test("loads the gallery preview in the phone frame from saved photos", async ({ page, request }) => {
    const account = await seedAccount(request, "preview");

    // Upload a real object so the preview has a URL that actually resolves.
    const upload = await request.post(`${API_BASE}/api/v1/admin/upload/image`, {
      headers: { Authorization: `Bearer ${account.token}` },
      multipart: { file: { name: "preview.png", mimeType: "image/png", buffer: TINY_PNG } },
    });
    expect(upload.ok(), `upload failed: ${await upload.text()}`).toBeTruthy();
    const { data: uploaded } = (await upload.json()) as { data: { url: string } };

    const seedRes = await request.patch(`${API_BASE}/api/v1/admin/invitation/${account.invitationId}`, {
      headers: { Authorization: `Bearer ${account.token}` },
      data: { gallery: [{ id: "seed-1", url: uploaded.url, caption: "Prewedding" }] },
    });
    expect(seedRes.ok()).toBeTruthy();

    await loginThroughUi(page, account);
    await openDashboard(page, account);
    await page.getByRole("button", { name: "Galeri" }).click();

    // One photo selected → PreviewGallery mounts and renders it with alt "Gallery 1".
    await page.getByRole("button", { name: /pratinjau/i }).click();
    await expect(page.getByRole("img", { name: "Gallery 1" })).toBeVisible({ timeout: 20_000 });

    // Closing the preview unmounts it again.
    await page.getByRole("button", { name: /tutup pratinjau/i }).click();
    await expect(page.getByRole("img", { name: "Gallery 1" })).toHaveCount(0);

    // Leave storage as we found it.
    const cleanup = await request.delete(`${API_BASE}/api/v1/admin/invitation/${account.invitationId}/media`, {
      headers: { Authorization: `Bearer ${account.token}` },
      data: { url: uploaded.url },
    });
    expect(cleanup.ok(), `media cleanup failed: ${await cleanup.text()}`).toBeTruthy();
  });
});
