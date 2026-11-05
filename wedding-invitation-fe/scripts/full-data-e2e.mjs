// Full-data + image E2E: seed complete invitations (uploaded hero, couple photos,
// gallery, 2 events, stories, bank + QRIS) per template, screenshot each guest
// view, and submit an RSVP through the public form.
// Run: node scripts/full-data-e2e.mjs
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const API_PORT = 8090, WEB_PORT = 3101, DB_PORT = 15432, MINIO_PORT = 19000;
const API_BASE = `http://localhost:${API_PORT}`;
const WEB_BASE = `http://localhost:${WEB_PORT}`;
const MINIO_BASE = `http://localhost:${MINIO_PORT}`;
const OUT_DIR = "/tmp/wedding-shots";
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
  if (!res.ok) throw new Error(`${url} -> ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

// Generate real JPEG images (solid colors) without deps: minimal valid JPEGs via canvas in browser later;
// simpler: use existing public/hero-default.jpg bytes for uploads.
import { readFileSync } from "node:fs";
const heroBytes = readFileSync("public/hero-default.jpg");

const api = await start("go", ["run", "."], { cwd: "../wedding-invitation-be", env: { ...process.env, PORT: String(API_PORT), DB_DSN: `host=localhost user=postgres password=secret dbname=wedding_e2e port=${DB_PORT} sslmode=disable`, S3_ENDPOINT: `${MINIO_BASE}`, S3_PUBLIC_URL: `${MINIO_BASE}/wedding-uploads`, S3_ACCESS_KEY: "minioadmin", S3_SECRET_KEY: "minioadmin", S3_BUCKET: "wedding-uploads" } }, (t) => t.includes(`:${API_PORT}`) || t.includes("Server starting"));
console.log("API up");
const web = await start("npx", ["next", "dev", "-p", String(WEB_PORT)], { env: { ...process.env, NEXT_PUBLIC_API_BASE_URL: API_BASE, NEXT_PUBLIC_MINIO_PORT: String(MINIO_PORT) } }, (t) => t.includes("Ready"));
console.log("Web up");

async function uploadImage(token, filename, bytes) {
  const fd = new FormData();
  fd.append("file", new Blob([bytes], { type: "image/jpeg" }), filename);
  const res = await fetch(`${API_BASE}/api/v1/admin/upload/image`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
  const body = await res.json();
  if (!res.ok) throw new Error(`upload failed: ${res.status} ${JSON.stringify(body)}`);
  return body.data.url ?? body.data.image_url ?? body.data;
}

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

const results = [];

for (const layoutId of TEMPLATE_IDS) {
  const suffix = Date.now();
  const email = `fulldata-${layoutId}-${suffix}@e2e.local`;
  const reg = await fetchJson(`${API_BASE}/api/v1/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Full Data", email, password: "password123" }) });
  const token = reg.data.token;
  const slug = `fulldata-${layoutId}-${suffix}`;
  const created = await fetchJson(`${API_BASE}/api/v1/admin/invitation`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ slug, layout_id: layoutId }) });
  const invId = created.data.id;

  // Upload hero, groom, bride, gallery x2, qris — all through the real upload endpoint
  const heroUrl = await uploadImage(token, "hero.jpg", heroBytes);
  const groomUrl = await uploadImage(token, "groom.jpg", heroBytes);
  const brideUrl = await uploadImage(token, "bride.jpg", heroBytes);
  const gal1 = await uploadImage(token, "gal1.jpg", heroBytes);
  const gal2 = await uploadImage(token, "gal2.jpg", heroBytes);
  const qrisUrl = await uploadImage(token, "qris.jpg", heroBytes);

  const patchBody = {
    layout_id: layoutId,
    status: "published",
    music_url: "https://example.com/song.mp3",
    couple: {
      title: "The Wedding of Arga & Bunga",
      weddingDate: "2030-08-17",
      heroImage: heroUrl,
      groom: { fullName: "Arga Pratama", nickname: "Arga", fatherName: "Bapak Adi", motherName: "Ibu Ani", order: "Putra pertama dari", photo: groomUrl },
      bride: { fullName: "Bunga Lestari", nickname: "Bunga", fatherName: "Bapak Budi", motherName: "Ibu Bela", order: "Putri kedua dari", photo: brideUrl },
      bankAccounts: [{ bankName: "BCA", accountNumber: "1234567890", accountHolder: "Bunga Lestari" }],
      qrisAccounts: [{ name: "QRIS Bunga", imageUrl: qrisUrl }],
    },
    events: [
      { type: "akad", title: "Akad Nikah", date: "2030-08-17", time: "08.00 WIB", locationName: "Masjid Agung", address: "Jl. Merdeka No. 1, Jakarta", mapsUrl: "https://maps.google.com/?q=Jakarta" },
      { type: "resepsi", title: "Resepsi", date: "2030-08-17", time: "11.00 - 14.00 WIB", locationName: "Gedung Bahagia", address: "Jl. Melati No. 9, Jakarta", mapsUrl: "https://maps.google.com/?q=Jakarta" },
    ],
    stories: [
      { year: "2019", title: "Pertama Bertemu", desc: "Kami bertemu di sebuah kampus." },
      { year: "2024", title: "Lamaran", desc: "Dia mengatakannya di bawah langit senja." },
    ],
    gallery: [gal1, gal2],
  };
  await fetchJson(`${API_BASE}/api/v1/admin/invitation/${invId}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(patchBody) });

  // Guest view
  await page.goto(`${WEB_BASE}/${slug}?to=Tamu%20Undangan`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT_DIR}/${layoutId}-full.png` });

  // Verify every image on the page actually loaded (naturalWidth > 0)
  const imgAudit = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll("img"));
    return {
      total: imgs.length,
      broken: imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.src.slice(0, 90)),
      loaded: imgs.filter(i => i.complete && i.naturalWidth > 0).length,
    };
  });

  // RSVP through the public form: find slide with form (slideshow) or scroll (scroll templates)
  let rsvpOk = false, rsvpErr = "";
  try {
    const rsvpSlide = page.locator("text=RSVP").first();
    if (await rsvpSlide.count()) {
      // try direct API-free UI path: navigate slides / scroll until form inputs visible
      for (let i = 0; i < 10 && !(await page.locator('input[placeholder*="ama"], input[name*="name" i], input[name*="guest" i]').first().isVisible().catch(() => false)); i++) {
        await page.mouse.click(210, 700);
        await page.waitForTimeout(900);
      }
      const nameInput = page.locator('input').filter({ hasNot: page.locator('[type="hidden"]') }).first();
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill("Budi Tamu");
        // attendance + pax + message: fill best-effort
        const msgBox = page.locator("textarea").first();
        if (await msgBox.isVisible().catch(() => false)) await msgBox.fill("Selamat menempuh hidup baru!");
        await page.locator('button[type="submit"], button:has-text("Kirim"), button:has-text("RSVP")').first().click();
        await page.waitForTimeout(1500);
        const stored = await fetchJson(`${API_BASE}/api/v1/public/invitation/${slug}/rsvp`);
        rsvpOk = Array.isArray(stored.data) && stored.data.some(r => r.guest_name === "Budi Tamu" || r.guestName === "Budi Tamu");
        if (!rsvpOk) rsvpErr = `rsvp list: ${JSON.stringify(stored.data).slice(0, 200)}`;
      } else { rsvpErr = "no visible name input after 10 slides"; }
    } else { rsvpErr = "no RSVP text found"; }
  } catch (e) { rsvpErr = String(e).slice(0, 200); }

  results.push({ layoutId, imgs: imgAudit, rsvpOk, rsvpErr });
  console.log(`${layoutId}: imgs loaded=${imgAudit.loaded}/${imgAudit.total} broken=${imgAudit.broken.length} rsvp=${rsvpOk ? "OK" : "FAIL " + rsvpErr}`);
}

console.log("\nSUMMARY:", JSON.stringify(results, null, 2));
await browser.close();
api.kill(); web.kill();
console.log("DONE");
