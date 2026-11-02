import { expect, test } from "@playwright/test";
import {
  TINY_PNG,
  fetchInvitation,
  listStoredObjects,
  loginThroughUi,
  openDashboard,
  seedAccount,
} from "./fixtures";

// Each test gets a fresh account + invitation, so runs never interfere and the
// suite is safe to repeat against a persistent database.
test.describe("Dashboard Galeri tab", () => {
  test("uploads a real file, persists the caption across a reload, and deletes the object", async ({
    page,
    request,
  }) => {
    const account = await seedAccount(request, "galeri");
    await loginThroughUi(page, account);
    await openDashboard(page, account);

    await page.getByRole("button", { name: "Galeri" }).click();
    await expect(page.getByRole("heading", { name: "Galeri Foto" })).toBeVisible();
    await expect(page.getByText("Belum ada foto")).toBeVisible();

    // --- upload -----------------------------------------------------------
    // The drop zone's input is display:none; setInputFiles does not need it visible.
    await page.locator('input[type="file"]').first().setInputFiles({
      name: "e2e-upload.png",
      mimeType: "image/png",
      buffer: TINY_PNG,
    });

    // The card appears only after the upload AND the PATCH both succeed.
    const card = page.locator("div.grid > div").first();
    await expect(card).toBeVisible({ timeout: 30_000 });

    await expect
      .poll(async () => (await fetchInvitation(request, account)).gallery.length, {
        message: "upload should persist one gallery item through PATCH",
        timeout: 30_000,
      })
      .toBe(1);

    const stored = await fetchInvitation(request, account);
    const storedUrl = stored.gallery[0].url;
    expect(storedUrl).toContain("localhost:9000/wedding-uploads/");

    // The object really exists in MinIO.
    await expect.poll(async () => (await listStoredObjects()).length, { timeout: 20_000 }).toBeGreaterThan(0);

    // --- caption ----------------------------------------------------------
    const caption = card.getByPlaceholder("Tambah keterangan...");
    await caption.fill("e2e caption");
    await caption.blur();

    await expect
      .poll(async () => (await fetchInvitation(request, account)).gallery[0]?.caption, {
        message: "caption should be saved via PATCH",
        timeout: 30_000,
      })
      .toBe("e2e caption");

    // --- reload: the caption survives a full document load ----------------
    await page.reload();
    await page.getByRole("button", { name: "Galeri" }).click();
    await expect(page.getByRole("heading", { name: "Galeri Foto" })).toBeVisible();
    await expect(card.getByPlaceholder("Tambah keterangan...")).toHaveValue("e2e caption");

    // --- delete: card gone AND storage object gone ------------------------
    const key = storedUrl.split("/").pop() as string;
    expect(await listStoredObjects()).toContain(`images/${key}`);

    await card.hover();
    await card.getByRole("button").click();

    await expect
      .poll(async () => (await fetchInvitation(request, account)).gallery.length, {
        message: "deleted photo should be removed from the persisted gallery",
        timeout: 30_000,
      })
      .toBe(0);

    await expect(page.getByText("Belum ada foto")).toBeVisible();
    await expect
      .poll(async () => (await listStoredObjects()).includes(`images/${key}`), {
        message: "the storage object should be deleted too",
        timeout: 30_000,
      })
      .toBe(false);
  });
});

