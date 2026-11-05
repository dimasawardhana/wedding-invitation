// Debug one template: dump innerText + console errors + network failures for guest view.
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const API_PORT = 8090, WEB_PORT = 3101, DB_PORT = 15432, MINIO_PORT = 19000;
const API_BASE = `http://localhost:${API_PORT}`;
const WEB_BASE = `http://localhost:${WEB_PORT}`;
const MINIO_BASE = `http://localhost:${MINIO_PORT}`;

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

const heroBytes = readFileSync("public/hero-default.jpg");
const api = await start("go", ["run", "."], { cwd: "../wedding-invitation-be", env: { ...process.env, PORT: String(API_PORT), DB_DSN: `host=localhost user=postgres password=secret dbname=wedding_e2e port=${DB_PORT} sslmode=disable`, S3_ENDPOINT: MINIO_BASE, S3_PUBLIC_URL: `${MINIO_BASE}/wedding-uploads`, S3_ACCESS_KEY: "minioadmin", S3_SECRET_KEY: "minioadmin", S3_BUCKET: "wedding-uploads" } }, (t) => t.includes(`:${API_PORT}`) || t.includes("Server starting"));
const web = await start("npx", ["next", "dev", "-p", String(WEB_PORT)], { env: { ...process.env, NEXT_PUBLIC_API_BASE_URL: API_BASE, NEXT_PUBLIC_MINIO_PORT: String(MINIO_PORT) } }, (t) => t.includes("Ready"));
console.log("servers up");

async function uploadImage(token, filename) {
  const fd = new FormData();
  fd.append("file", new Blob([heroBytes], { type: "image/jpeg" }), filename);
  const res = await fetch(`${API_BASE}/api/v1/admin/upload/image`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
  const body = await res.json();
  if (!res.ok) throw new Error(`upload failed: ${res.status} ${JSON.stringify(body)}`);
  return body.data.url ?? body.data;
}

const suffix = Date.now();
const email = `debug-${suffix}@e2e.local`;
const reg = await fetchJson(`${API_BASE}/api/v1/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Debug", email, password: "password123" }) });
const token = reg.data.token;
const slug = `debug-${suffix}`;
const created = await fetchJson(`${API_BASE}/api/v1/admin/invitation`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ slug, layout_id: "storyteller" }) });
const invId = created.data.id;
const heroUrl = await uploadImage(token, "hero.jpg");
console.log("heroUrl:", heroUrl);
// verify url fetchable
const head = await fetch(heroUrl);
console.log("heroUrl fetchable:", head.status, head.headers.get("content-type"));

await fetchJson(`${API_BASE}/api/v1/admin/invitation/${invId}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({
  layout_id: "storyteller", status: "published",
  couple: { title: "The Wedding of Arga & Bunga", weddingDate: "2030-08-17", heroImage: heroUrl,
    groom: { fullName: "Arga Pratama", nickname: "Arga", fatherName: "Bapak Adi", motherName: "Ibu Ani", order: "Putra pertama dari", photo: heroUrl },
    bride: { fullName: "Bunga Lestari", nickname: "Bunga", fatherName: "Bapak Budi", motherName: "Ibu Bela", order: "Putri kedua dari", photo: heroUrl },
    bankAccounts: [{ bankName: "BCA", accountNumber: "1234567890", accountHolder: "Bunga Lestari" }],
    qrisAccounts: [{ name: "QRIS Bunga", imageUrl: heroUrl }] },
  events: [{ type: "akad", title: "Akad Nikah", date: "2030-08-17", time: "08.00 WIB", locationName: "Masjid Agung", address: "Jakarta", mapsUrl: "https://maps.google.com/?q=Jakarta" }],
  stories: [{ year: "2024", title: "Pertama Bertemu", desc: "Awal kisah." }],
  gallery: [heroUrl],
}) });

// public API sanity
const pub = await fetchJson(`${API_BASE}/api/v1/public/invitation/${slug}`);
console.log("public api status ok, layout:", pub.data.layout_id, "heroImage:", (pub.data.couple?.heroImage || "").slice(0, 60));

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 500)); });
page.on("pageerror", e => consoleErrors.push("PAGEERROR: " + String(e?.stack || e).slice(0, 800)));
const failedReqs = [];
page.on("requestfailed", r => failedReqs.push(`${r.url().slice(0, 100)} :: ${r.failure()?.errorText}`));

await page.goto(`${WEB_BASE}/${slug}?to=Tamu%20Undangan`, { waitUntil: "networkidle" }).catch(e => console.log("goto error:", String(e).slice(0, 150)));
await page.waitForTimeout(2500);
const text = await page.evaluate(() => document.body.innerText);
console.log("=== innerText (first 500) ===\n" + text.slice(0, 500));
console.log("=== console errors ===\n" + consoleErrors.join("\n").slice(0, 800));
console.log("=== failed requests ===\n" + failedReqs.join("\n").slice(0, 800));
await page.screenshot({ path: "/tmp/wedding-shots/debug-storyteller.png" });

await browser.close();
api.kill(); web.kill();
console.log("DONE");
