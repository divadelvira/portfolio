const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { chromium } = require("playwright");

const BASE_URL = process.env.PORTFOLIO_URL || "http://localhost:3000";
const langs = ["en", "id"];
const expectedProjects = require("../src/content/projects.json");
const site = require("../src/content/site.json");
const profile = require("../src/content/profile.json");
const credentials = require("../src/content/credentials.json");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForConfig() {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      await fs.access("public/admin/config.yml");
      return true;
    } catch {
      await wait(1_000);
    }
  }
  return false;
}

function watchPage(page, label) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`${label} pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/Failed to load resource|ERR_BLOCKED_BY_CLIENT|net::ERR_FAILED/.test(text)) return;
    errors.push(`${label} console error: ${text}`);
  });
  return errors;
}

async function blockFirebase(context) {
  await context.route("**/*", (route) => {
    const host = new URL(route.request().url()).hostname;
    if (/firebaseio\.com$|firestore\.googleapis\.com$|identitytoolkit\.googleapis\.com$/.test(host)) {
      return route.abort("blockedbyclient");
    }
    return route.continue();
  });
}

async function gotoPortfolio(page) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page.locator("#projects").scrollIntoViewIfNeeded();
}

async function setLanguage(page, lang) {
  await page.getByRole("button", { name: lang.toUpperCase(), exact: true }).click();
  await page.locator("#projects").scrollIntoViewIfNeeded();
}

async function assertProjectCardsAndFilters(page, lang) {
  await setLanguage(page, lang);
  const expected = expectedProjects[lang].items;

  const projectFilters = page.getByRole("group", {
    name: lang === "en" ? "Filter case studies" : "Saring studi kasus",
  });
  await projectFilters.getByRole("button", { name: lang === "en" ? "All" : "Semua", exact: true }).click();
  const cards = page.locator(".summer-project-card");
  await assertCount(cards, expected.length, `${lang} all project cards`);

  const cardTitles = await cards.locator(".summer-project-card-title").allTextContents();
  assert.deepEqual(
    cardTitles.map((title) => title.trim()),
    expected.map((project) => project.title),
    `${lang} project card titles`,
  );

  for (const label of lang === "en"
    ? ["Lean & Process", "Supply Chain", "Quality"]
    : ["Lean & Proses", "Rantai Pasok", "Kualitas"]) {
    await projectFilters.getByRole("button", { name: label, exact: true }).click();
    const filteredCount = await cards.count();
    assert(filteredCount > 0, `${lang} ${label} filter should show at least one current project`);
    const first = cards.first();
    const firstTitle = (await first.locator(".summer-project-card-title").innerText()).trim();
    await first.click();
    assert.equal(await first.getAttribute("aria-pressed"), "true", `${lang} ${label} selected card`);
    await page.locator("#project-stage h3", { hasText: firstTitle }).waitFor();
  }

  await projectFilters.getByRole("button", { name: lang === "en" ? "All" : "Semua", exact: true }).click();
  for (const project of expected) {
    const card = page.locator(".summer-project-card").filter({ hasText: project.title });
    await card.click();
    await page.locator("#project-stage h3", { hasText: project.title }).waitFor();
    const primary = page.locator("#project-stage a.summer-project-link", { hasText: project.linkLabel || site[lang].viewDetails }).first();
    assert.equal(await primary.getAttribute("href"), project.link, `${lang} primary link for ${project.title}`);
    if (project.docLink) {
      const doc = page.locator("#project-stage a.summer-project-link", {
        hasText: lang === "en" ? "View Documentation" : "Lihat Dokumen",
      });
      await assertCount(doc, 1, `${lang} documentation link for ${project.title}`);
      assert.equal(await doc.getAttribute("href"), project.docLink, `${lang} doc href for ${project.title}`);
    }
  }
}

async function assertCount(locator, expected, label) {
  await locator.first().waitFor({ state: expected > 0 ? "visible" : "hidden", timeout: 10_000 }).catch(() => {});
  assert.equal(await locator.count(), expected, label);
}

async function assertCredentialsDialogs(page) {
  await page.locator("#training").scrollIntoViewIfNeeded();
  await page.locator(".credentials-training-card").first().click();
  const trainingDialog = page.getByRole("dialog", { name: credentials.training[0].title.en, exact: true });
  await trainingDialog.waitFor();
  await trainingDialog.getByRole("button", { name: /Close|Tutup/ }).click();
  await trainingDialog.waitFor({ state: "hidden" });

  await page.locator("#skills").scrollIntoViewIfNeeded();
  const skillFilters = page.getByRole("group", { name: "Filter skills" });
  await skillFilters.getByRole("button", { name: "Data & Analytics", exact: true }).click();
  assert.equal(await skillFilters.getByRole("button", { name: "Data & Analytics", exact: true }).getAttribute("aria-pressed"), "true");
  assert((await page.locator(".credentials-skill-card").count()) > 0, "skills filter should leave visible skills");
  await skillFilters.getByRole("button", { name: "All", exact: true }).click();

  await page.locator("#edu").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /View study overview|Lihat ringkasan studi/i }).click();
  const eduDialog = page.getByRole("dialog", { name: /Education overview|Ringkasan pendidikan/i });
  await eduDialog.waitFor();
  await eduDialog.getByText(/Undergraduate thesis|Tugas Akhir/).waitFor();
  await eduDialog.getByRole("button", { name: /Close|Tutup/ }).click();
  await eduDialog.waitFor({ state: "hidden" });
}

async function routeProjects(page, projects) {
  await page.route(/\/src\/content\/projects\.json(\?|$)/, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `export default ${JSON.stringify(projects)};`,
    }),
  );
}

async function assertSimulatedEmptyProjects(browser) {
  const categoryContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await blockFirebase(categoryContext);
  const categoryPage = await categoryContext.newPage();
  const categoryErrors = watchPage(categoryPage, "empty-category");
  const noLean = structuredClone(expectedProjects);
  noLean.en.items = noLean.en.items.map((project) => ({
    ...project, group: "scm",
    result: project.result.before ? { ...project.result, value: "" } : project.result,
  }));
  await routeProjects(categoryPage, noLean);
  await gotoPortfolio(categoryPage);
  const comparison = noLean.en.items.find(project => project.result.before);
  await categoryPage.locator('.summer-project-card').filter({ hasText: comparison.title })
    .getByText(comparison.result.before, { exact: true }).waitFor();
  await categoryPage.getByRole("button", { name: "Lean & Process", exact: true }).click();
  await categoryPage.waitForTimeout(500);
  assert.equal(categoryErrors.length, 0, categoryErrors.join("\n"));
  assert.equal(await categoryPage.locator(".summer-project-card").count(), 0, "empty category should show no cards without crashing");
  await categoryContext.close();

  const allEmptyContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await blockFirebase(allEmptyContext);
  const allEmptyPage = await allEmptyContext.newPage();
  const allEmptyErrors = watchPage(allEmptyPage, "all-empty-projects");
  await routeProjects(allEmptyPage, {
    en: { items: [] },
    id: { items: [] },
  });
  await gotoPortfolio(allEmptyPage);
  await allEmptyPage.waitForTimeout(500);
  assert.equal(allEmptyErrors.length, 0, allEmptyErrors.join("\n"));
  assert.equal(await allEmptyPage.locator(".summer-project-card").count(), 0, "all-empty projects should show no cards without crashing");
  await allEmptyContext.close();
}

async function assertEditableProfileAndExperience(browser) {
  for (const count of [0, 1, 3]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await blockFirebase(context);
    const page = await context.newPage();
    const errors = watchPage(page, `experience-${count}`);
    const edited = structuredClone(profile);
    edited.name = 'CMS test owner';
    edited.experience.items = Array.from({ length: count }, (_, index) => ({
      ...profile.experience.items[0], key: `cms-${index}`, company: `CMS Company ${index}`,
    }));
    await page.route(/\/src\/content\/profile\.json(\?|$)/, route => route.fulfill({
      status: 200, contentType: 'application/javascript', body: `export default ${JSON.stringify(edited)};`,
    }));
    await gotoPortfolio(page);
    await page.getByRole('heading', { level: 1, name: /CMS test owner/ }).waitFor();
    const cards = page.locator('.summer-experience-record');
    assert.equal(await cards.count(), count, `${count} CMS experience records must render`);
    for (let index = 0; index < count; index++) {
      await cards.nth(index).focus();
      await page.keyboard.press('Enter');
      assert.equal(await cards.nth(index).getAttribute('aria-expanded'), 'true');
    }
    if (count) {
      await cards.first().focus();
      await page.keyboard.press('Space');
      assert.equal(await cards.first().getAttribute('aria-expanded'), 'false');
      for (let index = 1; index < count; index++) assert.equal(await cards.nth(index).getAttribute('aria-expanded'), 'true');
    }
    assert.deepEqual(errors, [], errors.join('\n'));
    await context.close();
  }
}

async function assertAdminLoads(browser) {
  const hasConfig = await waitForConfig();
  assert(hasConfig, "public/admin/config.yml did not appear within 90s");

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = watchPage(page, "admin");
  const cmsRequests = [];
  page.on("request", (request) => {
    if (request.url().includes("decap-cms@3.16.3/dist/decap-cms.js")) cmsRequests.push(request.url());
  });
  await page.goto(`${BASE_URL}/admin`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  assert.equal(cmsRequests.length, 1, "admin should request pinned Decap CMS CDN bundle once");
  assert.equal(errors.length, 0, errors.join("\n"));
  const body = await page.locator("body").innerText();
  assert(!/config.*error|error.*config|failed to load config|failed to load entry|field.*error/i.test(body), body);
  const login = page.getByRole('button', { name: /login|github/i });
  await login.waitFor({ timeout: 30_000 });
  if ((await login.innerText()).trim() === 'Login') {
    await login.click(); // The local filesystem backend requires no credentials.
    const entry = page.getByText('Profil, kontak, pendidikan dan pengalaman', { exact: true });
    await entry.waitFor();
    await entry.click();
    const name = page.getByLabel('Nama', { exact: true });
    await name.waitFor();
    assert.equal(await name.inputValue(), profile.name, 'Local CMS must read the actual profile file');
    assert.equal(errors.length, 0, errors.join('\n'));
  }
  await context.close();
}

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await blockFirebase(context);
    const page = await context.newPage();
    const publicErrors = watchPage(page, "public");
    await gotoPortfolio(page);
    for (const lang of langs) await assertProjectCardsAndFilters(page, lang);
    await setLanguage(page, "en");
    await assertCredentialsDialogs(page);
    assert.equal(publicErrors.length, 0, publicErrors.join("\n"));
    await context.close();

    await assertSimulatedEmptyProjects(browser);
    await assertEditableProfileAndExperience(browser);
    await assertAdminLoads(browser);

    console.log(
      "PASS: bilingual content, project filters/links, credentials dialogs, empty projects, editable profile, 0/1/3 experience records, and /admin Decap load/local entry editing. Firebase endpoints blocked; no real auth or writes.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
