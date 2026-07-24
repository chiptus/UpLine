// THROWAWAY (chrome-variant prototype): mobile-viewport copy of
// .claude/skills/run-upline/driver.mjs — delete with the prototype.
import { chromium } from "@playwright/test";
import { globSync } from "node:fs";

const [chromePath] = globSync(
  "/opt/pw-browsers/chromium-*/chrome-linux/chrome",
);
if (!chromePath) {
  throw new Error("No Chromium binary found under /opt/pw-browsers");
}

const path = process.argv[2] || "/";
const out = process.argv[3] || "upline.png";
const base = process.env.BASE_URL || "http://127.0.0.1:8080";
const url = new URL(path, base).toString();

const proxyServer = process.env.HTTPS_PROXY || process.env.https_proxy;
const browser = await chromium.launch({
  executablePath: chromePath,
  args: [
    "--no-sandbox",
    "--ignore-certificate-errors",
    "--ssl-version-max=tls1.2",
    ...(proxyServer
      ? [
          `--proxy-server=${proxyServer}`,
          `--proxy-bypass-list=127.0.0.1;localhost`,
        ]
      : []),
  ],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

try {
  await page.goto(url, { waitUntil: "load", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await page
    .waitForFunction(
      () => !/Loading [^<]*\.\.\./i.test(document.body.innerText),
      { timeout: 8000 },
    )
    .catch(() => {});
  const consent = page.getByRole("button", { name: "Essential Only" });
  if (await consent.isVisible().catch(() => false)) {
    await consent.click();
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(700);
  await page.screenshot({ path: out, fullPage: false });

  console.log(`url: ${page.url()}`);
  console.log(`title: ${JSON.stringify(await page.title())}`);
  console.log(`#root children: ${await page.locator("#root > *").count()}`);
  console.log(`screenshot: ${out}`);
  if (errors.length)
    console.log(`console errors:\n  ${errors.slice(0, 10).join("\n  ")}`);
} finally {
  await browser.close();
}
