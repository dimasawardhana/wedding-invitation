import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Ports deliberately differ from the production/dev defaults (8080/3001) so the
// suite can run next to a developer's own stack. 8080 is frequently taken by
// unrelated projects, hence 8090 for the API.
const API_PORT = Number(process.env.E2E_API_PORT ?? 8090);
const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 3101);

const API_BASE = `http://localhost:${API_PORT}`;

/**
 * Path to a system Chrome/Chromium, or null to let Playwright use its own
 * bundled browser. Set E2E_CHROME to override.
 */
function chromeExecutable(): string | undefined {
  const candidates = [
    process.env.E2E_CHROME,
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter((p): p is string => Boolean(p));
  return candidates.find((p) => existsSync(p));
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  // Generous: `next dev` compiles each route on first hit, which can take tens
  // of seconds on a cold cache.
  timeout: 180_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          // The sandbox is unavailable in many CI containers.
          args: ["--no-sandbox"],
          // Prefer a locally installed Chrome. Downloading Playwright's own
          // build needs network access that is not always available; E2E_CHROME
          // overrides the path when Chrome lives elsewhere.
          ...(chromeExecutable() ? { executablePath: chromeExecutable() } : {}),
        },
      },
    },
  ],

  // Both servers are started by the suite; infra.sh must have been run first.
  webServer: [
    {
      command: "go run .",
      cwd: "../wedding-invitation-be",
      // Port (not url) readiness: every API route requires a body, auth, or a
      // known slug, so there is no endpoint that answers a bare probe with 2xx.
      port: API_PORT,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        DB_DSN: "host=localhost user=postgres password=secret dbname=wedding_e2e port=5432 sslmode=disable",
        PORT: String(API_PORT),
        JWT_SECRET: "e2e-secret",
        S3_ENDPOINT: "http://localhost:9000",
        S3_ACCESS_KEY: "minioadmin",
        S3_SECRET_KEY: "minioadmin",
        S3_BUCKET: "wedding-uploads",
        S3_PUBLIC_URL: "http://localhost:9000/wedding-uploads",
      },
    },
    {
      // `next dev`, not a production build: `next build` needs Google Fonts,
      // which is unreachable in sandboxed/offline environments. Dev compiles a
      // route on first hit, so globalSetup warms both routes before the specs
      // run — otherwise the first navigation races the compiler.
      command: `npx next dev -p ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}/login`,
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        NEXT_PUBLIC_API_BASE_URL: API_BASE,
      },
    },
  ],

  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
});
