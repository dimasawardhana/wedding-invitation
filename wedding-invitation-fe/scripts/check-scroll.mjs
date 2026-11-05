// Inspect scroll state of minimalist & classic guest views.
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const API_PORT = 8090, WEB_PORT = 3101, DB_PORT = 15432;
const API_BASE = `http://localhost:${API_PORT}`;
const WEB_BASE = `http://localhost:${WEB_PORT}`;

function start(cmd, args, opts, ready) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], ...opts });
    const check = (buf) => { if (ready(buf.toString())) resolve(p); };
    p.stdout.on("data", check); p.stderr.on("data", check);
    setTimeout(() => reject(new Error(`${cmd} not ready in 90s`)), 90000);
  });
}

const api = await start("go", ["run", "."], { cwd: "../wedding-invitation-be", env: { ...process.env, PORT: String(API_PORT), DB_DSN: `host=localhost user=postgres password=secret dbname=wedding_e2e port=${DB_PORT} sslmode=disable` } }, (t) => t.includes(`:${API_PORT}`) || t.includes("Server starting"));
const web = await start("npx", ["next", ["dev", "-p", String(WEB_PORT)][0] ? "dev" : "dev", "-p", String(WEB_PORT)], { env: { ...process.env, NEXT_PUBLIC_API_BASE_URL: API_BASE } }, (t) => t.includes("Ready"));
console.log("servers up");

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

for (const [slug, name] of [["shot-minimalist-1793739503436", "minimalist"], ["shot-classic-1793739506175", "classic"]]) {
  await page.goto(`${WEB_BASE}/${slug}?to=Tamu%20Undangan`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const info = await page.evaluate(() => {
    const scroller = document.querySelector('[class*="overflow-y-auto"]');
    const active = document.activeElement;
    return {
      windowScrollY: window.scrollY,
      docHeight: document.documentElement.scrollHeight,
      scrollerFound: !!scroller,
      scrollerTop: scroller ? scroller.scrollTop : null,
      scrollerHeight: scroller ? scroller.scrollHeight : null,
      activeTag: active ? active.tagName + "." + (active.className || "").slice(0, 40) : null,
      heroVisibleText: (document.querySelector("h1")?.innerText || "").slice(0, 60),
    };
  });
  console.log(`\n===== ${name} =====`, JSON.stringify(info, null, 2));
  // force scroll to top of the scroller, then screenshot
  await page.evaluate(() => {
    const sc = document.querySelector('[class*="overflow-y-auto"]');
    if (sc) sc.scrollTop = 0;
    window.scrollTo(0, 0);
    document.activeElement?.blur?.();
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `/tmp/wedding-shots/${name}-top.png` });
}

await browser.close();
api.kill(); web.kill();
console.log("\nDONE");
