const assert = require("node:assert/strict");
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.route(/https:\/\/[^/]*googleapis\.com\//, route => route.abort());
    await page.goto("http://localhost:3000");
    await page.getByRole("heading", { level: 1 }).waitFor();
    assert(
      !(await page.locator("main").innerText()).includes("\u2014"),
      "English copy must not contain em dashes",
    );
    await page.getByRole("button", { name: "ID", exact: true }).click();
    await page.reload();
    await page.getByRole("heading", { name: "Filosofi Kerja", exact: true }).waitFor();
    assert(
      !(await page.locator("main").innerText()).includes("\u2014"),
      "Indonesian copy must not contain em dashes",
    );
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await page.getByRole("button", { name: "MSA", exact: true }).click();
    await page.locator(".summer-metric-result").getByText("2.91%", { exact: true }).waitFor();
    await page.getByRole("button", { name: "TENDER", exact: true }).click();
    await page.locator(".summer-metric-result").getByText("10", { exact: true }).waitFor();
    const experience = page.getByRole("button", { name: /^PT Vale Indonesia Tbk/ });
    await experience.focus();
    await page.keyboard.press("Enter");
    assert.equal(await experience.getAttribute("aria-expanded"), "true");
    await page.keyboard.press("Space");
    assert.equal(await experience.getAttribute("aria-expanded"), "false");
    assert.equal(await page.locator('.summer-project-card').count(), 7);
    assert.equal(await page.locator('#project-stage a[href^="https://drive.google.com/"]').count(), 1);
    assert.equal(await page.locator(".summer-core-item").count(), 5);
    await page.locator("#contact input").nth(0).fill("UI regression check");
    await page.locator("#contact input").nth(1).fill("test@example.com");
    await page.locator("#contact textarea").fill("Offline check only; never send to Firebase.");
    await page.context().setOffline(true);
    await page.locator('#contact button[type="submit"]').click();
    await page.getByText("Transmitting failed. Try again.", { exact: true }).waitFor();
    assert.equal(
      await page.locator("#contact textarea").inputValue(),
      "Offline check only; never send to Firebase.",
    );
    await page.context().setOffline(false);
    await page.getByRole("button", { name: /© 2026 Diva Delvira/ }).click();
    const login = page.getByRole("dialog", { name: "Administrator login" });
    await login.waitFor();
    await login.getByLabel("Operator Username").fill("invalid-user");
    await login.getByLabel("Security Keyphrase").fill("invalid-password");
    await login.getByRole("button", { name: "AUTHENTICATE", exact: true }).click();
    await login.getByText("Invalid security credentials", { exact: true }).waitFor();
    if (process.argv.includes("--capture")) {
      await page.screenshot({ path: ".impeccable/review/admin-login.png" });
      await page.setViewportSize({ width: 390, height: 1000 });
      await page.screenshot({ path: ".impeccable/review/admin-login-mobile.png" });
    }
    await page.keyboard.press("Escape");
    await login.waitFor({ state: "hidden" });
    for (const width of [1440, 390, 320, 768, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.reload();
      await page.getByRole("heading", { level: 1 }).waitFor();
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `horizontal overflow at ${width}px`,
      );
      assert(
        await page
          .locator(".text-justify")
          .evaluateAll((elements) =>
            elements.every((element) => getComputedStyle(element).textAlign === "justify"),
          ),
        `Prose must be justified at ${width}px`,
      );
      if (width === 390) {
        await page.getByRole("button", { name: "Toggle Menu" }).click();
        await page.getByRole("button", { name: "Projects", exact: true }).click();
        await page
          .getByRole("button", { name: "Projects", exact: true })
          .waitFor({ state: "hidden" });
      }
      await page.evaluate(async () => {
        for (const section of document.querySelectorAll("section")) {
          section.scrollIntoView();
          await new Promise((resolve) => setTimeout(resolve, 80));
        }
        window.scrollTo({ top: 0, behavior: "instant" });
      });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(800);
      const educationGap = await page.locator('#edu button[aria-haspopup="dialog"]').first().evaluate(button => {
        const content = button.firstElementChild.getBoundingClientRect();
        const logo = button.querySelector('.summer-edu-logo').getBoundingClientRect();
        return getComputedStyle(button).flexDirection === 'row'
          ? Math.max(content.left - logo.right, logo.left - content.right)
          : Math.max(content.top - logo.bottom, logo.top - content.bottom);
      });
      assert(educationGap >= 24, `Education logo/text gap must be at least 24px at ${width}px; got ${educationGap}px`);
      if (process.argv.includes("--capture") && [1440, 390].includes(width)) {
        await page.screenshot({
          path: `.impeccable/review/${width === 1440 ? "desktop" : "mobile"}.png`,
          fullPage: true,
        });
        await page.screenshot({
          path: `.impeccable/review/${width === 1440 ? "desktop" : "mobile"}-opening.png`,
        });
      }
    }
    await page.getByRole("button", { name: "ID", exact: true }).click();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      assert(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `Indonesian overflow at ${width}px`,
      );
      if (process.argv.includes("--capture")) {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await page.waitForTimeout(300);
        await page.screenshot({
          path: `.impeccable/review/${width === 1440 ? "desktop" : "mobile"}-indonesian.png`,
        });
      }
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await page.getByText("Data-Driven Problem Solver", { exact: true }).waitFor();
    console.log(
      "PASS: language persistence, metrics, keyboard expansion, project links, core competencies, offline form, admin dialog, mobile menu, viewport overflow (320–1440px). No Firebase writes.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
