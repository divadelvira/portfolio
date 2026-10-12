const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE_URL = process.env.UI_BASE_URL || 'http://localhost:3000';
const config = JSON.parse(fs.readFileSync('public/admin/config.yml', 'utf8'));
const sectionOrder = ['hero', 'about', 'experience', 'projects', 'skills', 'awards', 'education', 'training', 'contact', 'settings'];
assert.deepEqual(config.collections.map(collection => collection.name), sectionOrder);
const projects = config.collections.find(collection => collection.name === 'projects').files[0];
const originalProjects = fs.readFileSync(projects.file, 'utf8');
const screenshots = process.env.ADMIN_SCREENSHOTS;

async function openEditor(browser, viewport) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
  const login = page.getByRole('button', { name: 'Masuk', exact: true });
  await login.waitFor({ timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  return { context, page, errors, login };
}

async function screenshot(page, filename) {
  if (!screenshots) return;
  fs.mkdirSync(screenshots, { recursive: true });
  await page.screenshot({ path: path.join(screenshots, filename), fullPage: true });
}

function assertWidth(page, label) {
  return page.evaluate(() => ({ viewport: window.innerWidth, width: document.documentElement.scrollWidth }))
    .then(({ viewport, width }) => assert(width <= viewport + 1, `${label}: horizontal overflow ${width} > ${viewport}`));
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const [label, viewport] of [
      ['desktop', { width: 1440, height: 1000 }],
      ['mobile', { width: 390, height: 844 }],
      ['small', { width: 320, height: 780 }],
    ]) {
      const { context, page, errors, login } = await openEditor(browser, viewport);
      await screenshot(page, `${label}-login.png`);
      await login.click();
      await page.getByRole('heading', { name: 'Konten website', exact: true }).waitFor();
      assert.deepEqual(await page.locator('#cms-section-nav a[data-collection]').evaluateAll(links =>
        [...new Set(links.map(link => link.dataset.collection))].filter(name => name !== 'media')), sectionOrder);
      await assertWidth(page, `${label} index`);
      await screenshot(page, `${label}.png`);
      if (viewport.width <= 760) {
        const toggle = page.getByRole('button', { name: 'Pilih bagian website' });
        await toggle.click();
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
        await page.keyboard.press('Escape');
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
        await toggle.click();
      }
      const projectLink = page.locator('#cms-section-nav').getByRole('link', { name: 'Proyek', exact: true });
      await projectLink.click();
      await page.locator('#cms-editor-title').getByText('Proyek', { exact: true }).waitFor();
      const deleteButtons = page.locator('.cms-item-delete:visible');
      await deleteButtons.first().waitFor();
      await assertWidth(page, `${label} project editor`);
      await screenshot(page, `${label}-projects.png`);
      if (label === 'desktop') {
        const count = await deleteButtons.count();
        page.once('dialog', dialog => dialog.dismiss());
        await deleteButtons.first().click();
        assert.equal(await deleteButtons.count(), count, 'Cancel must retain the item');
        page.once('dialog', dialog => dialog.accept());
        await deleteButtons.last().click();
        await page.waitForFunction(expected => [...document.querySelectorAll('.cms-item-delete')].filter(button => button.getClientRects().length && getComputedStyle(button).visibility !== 'hidden').length < expected, count);
        assert.equal(await deleteButtons.count(), count - 1, 'Confirm must remove only one item');
        const add = page.locator('#nc-root button[class*="-AddButton"]:visible').first();
        await add.click();
        await page.waitForFunction(expected => [...document.querySelectorAll('.cms-item-delete')].filter(button => button.getClientRects().length && getComputedStyle(button).visibility !== 'hidden').length >= expected, count);
        assert.equal(await deleteButtons.count(), count, 'Add must create one bilingual item');
        assert(await page.getByText('Belum disimpan', { exact: true }).isVisible());
        assert.equal(fs.readFileSync(projects.file, 'utf8'), originalProjects, 'Unsaved CRUD must not write local files');
      }
      assert.deepEqual(errors, [], `${label}: ${errors.join('\n')}`);
      await context.close();
    }
    console.log('PASS: Editorial Index login/index/editor at 1440/390/320px; website section order, mobile menu/Escape, Add/Delete/Cancel, unsaved changes, no filesystem writes.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
