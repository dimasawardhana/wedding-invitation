import { expect, test, type APIRequestContext } from "@playwright/test";
import { API_BASE, NAV_TIMEOUT, loginThroughUi, seedAccount, type SeededAccount } from "./fixtures";

const TEMPLATE_IDS = [
  "storyteller",
  "modern-scroll",
  "islamic",
  "rustic",
  "minimalist",
  "classic",
] as const;

const COMPLETE_COUPLE = {
  title: "The Wedding of Arga & Bunga",
  weddingDate: "2030-08-17",
  heroImage: "",
  groom: {
    fullName: "Arga Pratama",
    nickname: "Arga",
    fatherName: "Bapak Adi",
    motherName: "Ibu Ani",
    order: "Putra pertama dari",
    photo: "",
  },
  bride: {
    fullName: "Bunga Lestari",
    nickname: "Bunga",
    fatherName: "Bapak Budi",
    motherName: "Ibu Bela",
    order: "Putri kedua dari",
    photo: "",
  },
  bankAccounts: [],
  qrisAccounts: [],
};

const EVENTS = [
  {
    type: "akad",
    title: "Akad Nikah",
    date: "2030-08-17",
    time: "08.00 WIB",
    locationName: "Gedung Bahagia",
    address: "Jakarta",
    mapsUrl: "https://maps.google.com/?q=Jakarta",
  },
];

async function updateInvitation(
  request: APIRequestContext,
  account: SeededAccount,
  data: Record<string, unknown>,
): Promise<void> {
  const response = await request.patch(
    `${API_BASE}/api/v1/admin/invitation/${account.invitationId}`,
    { headers: { Authorization: `Bearer ${account.token}` }, data },
  );
  expect(response.ok(), `PATCH failed: ${await response.text()}`).toBeTruthy();
}

test.describe("Invitation templates", () => {
  test("every registered template renders complete public content without invalid states", async ({
    page,
    request,
  }) => {
    for (const layoutId of TEMPLATE_IDS) {
      const account = await seedAccount(request, `template-${layoutId}`);
      await updateInvitation(request, account, {
        layout_id: layoutId,
        couple: COMPLETE_COUPLE,
        events: EVENTS,
        stories: [{ year: "2024", title: "Pertama Bertemu", desc: "Awal kisah kami." }],
        gallery: [],
        status: "published",
      });

      const errors: string[] = [];
      const onConsole = (message: { type(): string; text(): string }) => {
        if (message.type() === "error") errors.push(message.text());
      };
      page.on("console", onConsole);
      await page.goto(`/${account.slug}?to=Tamu%20Undangan`, { timeout: NAV_TIMEOUT });
      await expect(page.locator("body")).toContainText("Arga", { timeout: NAV_TIMEOUT });
      await expect(page.locator("body")).toContainText("Bunga");
      await expect(page.getByText(/17 Agustus 2030/).first()).toBeVisible();
      await expect(page.locator("body")).not.toContainText(/invalid date/i);
      expect(errors, `${layoutId} emitted browser console errors`).toEqual([]);
      page.off("console", onConsole);
    }
  });

  test("incomplete invitations and all phone previews use graceful display fallbacks", async ({
    page,
    request,
  }) => {
    const account = await seedAccount(request, "template-preview");
    await updateInvitation(request, account, { status: "published" });

    await page.goto(`/${account.slug}`, { timeout: NAV_TIMEOUT });
    await expect(page.getByRole("heading", { name: "The Wedding of Mempelai Pria & Mempelai Wanita" })).toBeVisible({ timeout: NAV_TIMEOUT });
    await expect(page.getByText("Tanggal akan diumumkan", { exact: true }).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/invalid date/i);

    await loginThroughUi(page, account);
    await page.evaluate(({ invitationId, slug }) => {
      localStorage.setItem(
        "wedding-invitation-store",
        JSON.stringify({
          state: {
            invitationId,
            slug,
            status: "draft",
            heroImage: "",
            title: "",
            groomName: "",
            brideName: "",
            weddingDate: "",
            layoutId: "storyteller",
            groom: { fullName: "", photo: "", fatherName: "", motherName: "", order: "" },
            bride: { fullName: "", photo: "", fatherName: "", motherName: "", order: "" },
            events: [],
            weddingEvents: [],
            galleryItems: [],
            bankAccounts: [],
            qrisAccounts: [],
            wishes: [],
            theme: { colorScheme: "gold-ivory", fontPair: "playfair-geist", music: "" },
          },
          version: 0,
        }),
      );
    }, account);
    await page.goto("/dashboard/editor", { timeout: NAV_TIMEOUT });
    const preview = page.getByTestId("template-preview");
    await expect(preview).toBeVisible({ timeout: NAV_TIMEOUT });

    for (const name of ["Storyteller", "Modern Scroll", "Islamic", "Rustic", "Minimalist", "Classic"]) {
      await page.getByRole("button", { name: new RegExp(name, "i") }).click();
      await expect(preview).toContainText("Tanggal akan diumumkan");
      await expect(preview).not.toContainText(/invalid date/i);
      await expect(preview).not.toContainText(/^\s*&\s*$/);
    }
  });
});
