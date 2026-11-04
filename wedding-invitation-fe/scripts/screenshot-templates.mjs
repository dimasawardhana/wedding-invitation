// One-off: start API on 8090, Next dev on 3101, seed 6 invitations, screenshot each.
// Run: node scripts/screenshot-templates.mjs
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import { setTimeout as sleep } from "node:timers/promises";

const API_PORT = 8090, WEB_PORT = 3101, DB_PORT = 15432;
const API_BASE = `http://localhost:${API_PORT}`;
const WEB_BASE = `http://localhost:${WEB_PORT}`;
const OUT_DIR = "/tmp/wedding-shots";
const TEMPLATE_IDS = ["storyteller", "modern-scroll", "islamic", "rustic", "minimalist", "classic"];

const COUPLE = {
  title: "The Wedding of Arga & Bunga",
  weddingDate: "2030-08-17",
  heroImage: "",
  groom: { fullName: "Arga Pratama", nickname: "Arga", fatherName: "Bapak Adi", motherName: "Ibu Ani", order: "Putra pertama dari", photo: "" },
  bride: { fullName: "Bunga Lestari", nickname: "Bunga", fatherName: "Bapak Budi", motherName: "Ibu Bela", order: "Putri kedua dari", photo: "" },
  bankAccounts: [],
  qrisAccounts: [],
};
const EVENTS = [{ type: "akad", title: "Akad Nikah", date: "2030-08-17", time: "08.00 WIB", locationName: "Gedung Bahagia", address: "Jakarta", mapsUrl: "https://maps.google.com/?q=Jakarta" }];

function start(cmd, args, opts, ready) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], ...opts });
    const check = (buf) => { if (ready(buf.toString())) resolve(p); };
    p.stdout.on("data", check); p.stderr.on("data", check);
    p.on("exit", (c) => reject(new Error(`${cmd} exited ${c}`)));
    setTimeout(() => reject(new Error(`${cmd} not ready in 90s`)), 90000);
  });
}

const api = await start("go", ["run", "."], { cwd: "../wedding-invitation-be", env: { ...process.env, PORT: String(API_PORT), DB_DSN: `host=localhost user=postgres password=secret dbname=wedding_e2e port=${DB_PORT} sslmode=disable` } }, (t) => t.includes(`:${API_PORT}`) || t.includes("Server starting"));
console.log("API up");
const web = await start("npx", ["next", "dev", "-p", String(WEB_PORT)], { env: { ...process.env, NEXT_PUBLIC_API_BASE_URL: API_BASE } }, (t) => t.includes("Ready"));
console.log("Web up");

async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`${url} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

for (const layoutId of TEMPLATE_IDS) {
  const email = `shot-${layoutId}-${Date.now()}@e2e.local`;
  const reg = await fetchJson(`${API_BASE}/api/v1/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Shot", email, password: "password123" }) });
  const token = reg.data.token;
  const slug = `shot-${layoutId}-${Date.now()}`;
  const created = await fetchJson(`${API_BASE}/api/v1/admin/invitation`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ slug, layout_id: layoutId }) });
  const inv = created.data;
  await fetchJson(`${API_BASE}/api/v1/admin/invitation/${inv.id}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ layout_id: layoutId, couple: COUPLE, events: EVENTS, stories: [{ year: "2024", title: "Pertama Bertemu", desc: "Awal kisah kami." }], gallery: [], status: "published" }) });
  await page.goto(`${WEB_BASE}/${inv.slug}?to=Tamu%20Undangan`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT_DIR}/${layoutId}.png` });
  console.log(`✓ ${layoutId} -> ${OUT_DIR}/${layoutId}.png`);
}

await browser.close();
api.kill(); web.kill();
console.log("DONE");
