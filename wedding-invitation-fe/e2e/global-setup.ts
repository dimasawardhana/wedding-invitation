import { chromium, type FullConfig } from "@playwright/test";

/**
 * Compiles the routes the specs navigate to before any test runs.
 *
 * `next dev` builds a route on first request; without this, the first test to
 * reach /login or /dashboard can spend most of its budget waiting on the
 * compiler. Requesting each route here moves that cost out of the test bodies.
 */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL;
  if (!baseURL) throw new Error("baseURL is not configured");

  const browser = await chromium.launch(
    config.projects[0]?.use?.launchOptions as never,
  );
  try {
    const page = await browser.newPage();
    for (const route of ["/login", "/dashboard"]) {
      await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle", timeout: 180_000 });
    }
  } finally {
    await browser.close();
  }
}
