// Deep-dive: what's actually rendered in the minimalist hero viewport?
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
const web = await start("npx", ["next", "dev", "-p", String(WEB_PORT)], { env: { ...process.env, NEXT_PUBLIC_API_BASE_URL: API_BASE } }, (t) => t.includes("Ready"));
console.log("servers up");

const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

await page.goto(`${WEB_BASE}/shot-minimalist-1793739503436?to=Tamu%20Undangan`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

const audit = await page.evaluate(() => {
  const els = document.querySelectorAll("*");
  const visible = [];
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.bottom < 0 || r.top > window.innerHeight) continue;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none") continue;
    const ownText = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent.trim()).filter(Boolean).join(" ");
    if (ownText) {
      visible.push({ tag: el.tagName, cls: (el.className||"").toString().slice(0,50), text: ownText.slice(0,80), top: Math.round(r.top), opacity: style.opacity, color: style.color, fontSize: style.fontSize });
    }
  }
  return { count: visible.length, visible: visible.slice(0, 30) };
});
console.log(JSON.stringify(audit, null, 2));

// Also check the img element
const imgInfo = await page.evaluate(() => {
  const img = document.querySelector('img[alt="Wedding hero"]');
  if (!img) return "no hero img element";
  const r = img.getBoundingClientRect();
  return { src: img.currentSrc?.slice(0, 80), loaded: img.complete && img.naturalWidth > 0, natural: `${img.naturalWidth}x${img.naturalHeight}`, rect: `${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.top)}` };
});
console.log("hero img:", JSON.stringify(imgInfo));

await browser.close();
api.kill(); web.kill();
console.log("DONE");
