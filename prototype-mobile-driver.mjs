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
const [vw, vh] = (process.env.VIEWPORT || "390x844").split("x").map(Number);
const page = await browser.newPage({ viewport: { width: vw, height: vh } });

const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

// Pre-seed the chrome-variant choice: router redirects strip ?variant=
// before the lazily-loaded prototype module can read it.
const variantParam = new URL(url).searchParams.get("variant");
if (variantParam) {
  await page.addInitScript((v) => {
    window.sessionStorage.setItem("prototype-chrome-variant", v);
  }, variantParam);
}

// Pre-seed GDPR consent so the banner never renders (its buttons can be
// covered by the prototype's floating variant pill, breaking clicks).
await page.addInitScript(() => {
  window.localStorage.setItem(
    "gdpr-consent",
    JSON.stringify({
      essential: true,
      analytics: false,
      preferences: false,
      marketing: false,
      version: "1.0",
      timestamp: 1,
    }),
  );
});

try {
  await page.goto(url, { waitUntil: "load", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await page
    .waitForFunction(
      () => !/Loading [^<]*\.\.\./i.test(document.body.innerText),
      { timeout: 8000 },
    )
    .catch(() => {});
  await page.waitForTimeout(700);
  const scrollY = Number(process.env.SCROLL || 0);
  if (scrollY > 0) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(400);
  }
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
