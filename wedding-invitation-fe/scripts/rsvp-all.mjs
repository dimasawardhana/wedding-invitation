// RSVP end-to-end for every template: navigate to the RSVP slide/section via UI
// gestures, fill the form, submit, verify in DB via public rsvp list.
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const API_PORT = 8090, WEB_PORT = 3101, DB_PORT = 15432;
const API_BASE = `http://localhost:${API_PORT}`;
const WEB_BASE = `http://localhost:${WEB_PORT}`;
const TEMPLATE_IDS = ["storyteller", "modern-scroll", "islamic", "rustic", "minimalist", "classic"];

function start(cmd, args, opts, ready) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], ...opts });
    const check = (buf) => { if (ready(buf.toString())) resolve(p); };
    p.stdout.on("data", check); p.stderr.on("data", check);
    setTimeout(() => reject(new Error(`${cmd} not ready in 90s`)), 90000);
  });
}
async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const text = await res.text();
  if (!res.ok) throw new Error(`${url} -> ${res.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

const api = await start("go", ["run", "."], { cwd: "../wedding-invitation-be", env: { ...process.env, PORT: String(API_PORT), DB_DSN: `host=localhost user=postgres password=secret dbname=wedding_e2e port=${DB_PORT} sslmode=disable` } }, (t) => t.includes(`:${API_PORT}`) || t.includes("Server starting"));
const web = await start("npx", ["next", "dev", "-p", String(WEB_PORT)], { env: { ...process.env, NEXT_PUBLIC_API_BASE_URL: API_BASE } }, (t) => t.includes("Ready"));
console.log("servers up");

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();

for (const layoutId of TEMPLATE_IDS) {
  const suffix = Date.now();
  const email = `rsvp-${layoutId}-${suffix}@e2e.local`;
  const reg = await fetchJson(`${API_BASE}/api/v1/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "RSVP", email, password: "password123" }) });
  const token = reg.data.token;
  const slug = `rsvp-${layoutId}-${suffix}`;
  const created = await fetchJson(`${API_BASE}/api/v1/admin/invitation`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ slug, layout_id: layoutId }) });
  const invId = created.data.id;
  await fetchJson(`${API_BASE}/api/v1/admin/invitation/${invId}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ status: "published", couple: { title: "RSVP Test", weddingDate: "2030-08-17" } }) });

  const guestName = `Tamu ${layoutId}`;
  await page.goto(`${WEB_BASE}/${slug}?to=${encodeURIComponent(guestName)}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // For scroll templates: scroll to bottom. For slideshow: wheel down through slides.
  // Strategy: loop up to 15 steps; each step, if name input visible -> fill; else scroll/wheel.
  let submitted = false, err = "";
  for (let step = 0; step < 25 && !submitted; step++) {
    // RSVP form inputs: plain <input> inside the Konfirmasi Kehadiran form
    const nameInput = page.locator('input[type="text"]').first();
    const nameVisible = await nameInput.isVisible({ timeout: 500 }).catch(() => false);
    if (nameVisible) {
      await nameInput.fill(guestName);
      const msg = page.locator("textarea").first();
      if (await msg.isVisible({ timeout: 300 }).catch(() => false)) await msg.fill(`Selamat! — ${layoutId}`).catch(() => {});
      await page.locator('button:has-text("Kirim Konfirmasi")').first().click({ timeout: 5000 }).catch(e => { err = "submit click: " + String(e).slice(0, 100); });
      await page.waitForTimeout(2000);
      const list = await fetchJson(`${API_BASE}/api/v1/public/invitation/${slug}/rsvp`);
      const rows = list.data ?? [];
      submitted = rows.some(r => (r.guest_name ?? r.guestName ?? "") === guestName);
      if (!submitted && !err) err = `rsvp rows after submit: ${JSON.stringify(rows).slice(0, 150)}`;
    } else {
      // advance: scroll-templates scroll their own container; slideshows advance on wheel
      const advanced = await page.evaluate(() => {
        const scs = Array.from(document.querySelectorAll('*')).filter(el => {
          const s = getComputedStyle(el);
          return (s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 5;
        });
        for (const sc of scs) {
          const before = sc.scrollTop;
          sc.scrollBy({ top: sc.clientHeight * 0.9 });
          if (sc.scrollTop !== before) return true;
        }
        return false;
      });
      if (!advanced) {
        // slideshow cover: the open button advances to slide 1
        const openBtn = page.locator('button:has-text("Buka Undangan")');
        if (await openBtn.isVisible({ timeout: 400 }).catch(() => false)) {
          await openBtn.click().catch(() => {});
        } else {
          await page.mouse.move(210, 450);
          await page.mouse.wheel(0, 400);
        }
      }
      await page.waitForTimeout(700);
    }
  }
  if (!submitted && !err) err = "never found name input";
  console.log(`${layoutId}: rsvp=${submitted ? "OK" : "FAIL"} ${err}`);
}

await browser.close();
api.kill(); web.kill();
console.log("DONE");
