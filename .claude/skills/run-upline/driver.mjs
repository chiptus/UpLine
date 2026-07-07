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

// Outbound HTTPS in this environment goes through a pre-configured agent
// proxy (see /root/.ccr/README.md) that re-terminates TLS with its own CA.
// Chromium doesn't read HTTPS_PROXY on its own, and this bare binary doesn't
// pick up the pre-installed system/NSS trust the README describes, so two
// flags are required: ignore the resulting ERR_CERT_AUTHORITY_INVALID, and
// cap TLS at 1.2 — Chromium's default TLS 1.3 ClientHello (~1.8KB, with
// GREASE/ECH/post-quantum key-share extensions) gets reset mid-handshake by
// the proxy (net_error -101); the smaller TLS 1.2 ClientHello goes through.
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
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));
page.on("requestfailed", (r) =>
  errors.push(`FAILED ${r.url()} :: ${r.failure()?.errorText}`),
);

await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: out, fullPage: true });

console.log(`title: ${JSON.stringify(await page.title())}`);
console.log(`#root children: ${await page.locator("#root > *").count()}`);
console.log(`screenshot: ${out}`);
if (errors.length) console.log(`console errors:\n  ${errors.slice(0, 15).join("\n  ")}`);

await browser.close();
