// Drive the running UpLine dev server with the pre-installed Chromium.
// Usage: node .claude/skills/run-upline/driver.mjs [path] [out.png]
//   path    route to open, default "/"          (e.g. "/festivals")
//   out.png screenshot file, default "upline.png"
// Env: BASE_URL overrides http://127.0.0.1:8080
import { chromium } from "@playwright/test";
import { globSync } from "node:fs";

// The repo's @playwright/test version may pin a different Chromium build than
// the one pre-installed under /opt/pw-browsers. Point straight at whatever
// chrome binary is on disk instead of triggering a download.
const [chromePath] = globSync("/opt/pw-browsers/chromium-*/chrome-linux/chrome");

const path = process.argv[2] || "/";
const out = process.argv[3] || "upline.png";
const base = process.env.BASE_URL || "http://127.0.0.1:8080";
const url = base + path;

const browser = await chromium.launch({
  executablePath: chromePath,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: out, fullPage: true });

console.log(`title: ${JSON.stringify(await page.title())}`);
console.log(`#root children: ${await page.locator("#root > *").count()}`);
console.log(`screenshot: ${out}`);
if (errors.length) console.log(`console errors:\n  ${errors.slice(0, 15).join("\n  ")}`);

await browser.close();
