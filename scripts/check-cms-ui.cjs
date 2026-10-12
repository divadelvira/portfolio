const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium } = require("playwright");

const BASE_URL = process.env.PORTFOLIO_URL || "http://localhost:3000";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sections = ["hero", "about", "experience", "projects", "skills", "awards", "education", "training", "contact", "settings"];

async function waitForConfig() {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try { await fs.access("public/admin/config.yml"); return true; } catch { await wait(1_000); }
  }
  return false;
}

function watchPage(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !/Failed to load resource|ERR_BLOCKED_BY_CLIENT|net::ERR_FAILED/.test(message.text())) errors.push(message.text());
  });
  return errors;
}

async function blockFirebase(context) {
  await context.route("**/*", (route) => /firebaseio\.com$|firestore\.googleapis\.com$|identitytoolkit\.googleapis\.com$/.test(new URL(route.request().url()).hostname)
    ? route.abort("blockedbyclient") : route.continue());
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await blockFirebase(context);
    const page = await context.newPage();
    const errors = watchPage(page);
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { level: 1 }).waitFor();
    for (const section of ["about", "experience", "projects", "skills", "edu", "training", "contact"]) {
      await page.locator(`#${section}`).waitFor();
    }
    await page.locator(".summer-honors").waitFor();
    for (const lang of ["en", "id"]) {
      await page.getByRole("button", { name: lang.toUpperCase(), exact: true }).click();
      await page.locator(".summer-project-card").first().waitFor();
      const cards = await page.locator(".summer-project-card-title").allTextContents();
      assert(cards.length > 0, `${lang}: default project list must render`);
    }
    assert.deepEqual(errors, [], errors.join("\n"));
    await context.close();

    assert(await waitForConfig(), "public/admin/config.yml did not appear within 90s");
    const config = JSON.parse(await fs.readFile("public/admin/config.yml", "utf8"));
    assert.deepEqual(config.collections.map((collection) => collection.name), sections, "CMS sidebar sections must stay in website order");
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const admin = await adminContext.newPage();
    const adminErrors = watchPage(admin);
    await admin.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded" });
    await admin.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
    await admin.getByRole("button", { name: /masuk|login|github/i }).waitFor({ timeout: 30_000 });
    assert.deepEqual(adminErrors, [], adminErrors.join("\n"));
    await adminContext.close();
    console.log("PASS: bilingual portfolio content renders, all CMS sections follow website order, and /admin loads Decap without config errors. Firebase endpoints blocked; no auth or writes.");
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
