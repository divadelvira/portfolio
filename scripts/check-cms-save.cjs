const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitFor(check, label) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await check()) return;
    await delay(300);
  }
  throw new Error(`Timeout: ${label}`);
}

(async () => {
  for (const port of [3000, 8081]) {
    let occupied = false;
    try {
      await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(500) });
      occupied = true;
    } catch {}
    assert(!occupied, `Port ${port} occupied; stop your dev server before running this check`);
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-cms-save-'));
  const content = path.join(root, 'src/content');
  const originals = new Map(fs.readdirSync(content).map(name => [name, fs.readFileSync(path.join(content, name))]));
  // Real local CMS writes are confined to this disposable copy, never the checkout.
  for (const name of ['package.json', 'vite.config.ts', 'tsconfig.json', 'index.html', 'firebase-applet-config.json', 'src', 'public', 'scripts', 'lib']) {
    fs.cpSync(path.join(root, name), path.join(dir, name), { recursive: true });
  }
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(dir, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  const child = spawn(process.execPath, ['scripts/dev.mjs'], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] });
  const exited = new Promise(resolve => child.on('exit', resolve));
  let logs = '';
  child.stdout.on('data', data => { logs += data; });
  child.stderr.on('data', data => { logs += data; });
  let browser;
  try {
    await waitFor(async () => {
      try {
        const response = await fetch('http://127.0.0.1:8081/api/v1', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'info' }),
          signal: AbortSignal.timeout(1000),
        });
        return (await response.json()).type === 'local_fs';
      } catch { return false; }
    }, 'local filesystem CMS');
    await waitFor(async () => {
      try { return (await fetch('http://127.0.0.1:3000', { signal: AbortSignal.timeout(1000) })).ok; }
      catch { return false; }
    }, 'Vite');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    await context.route('**/*', route => {
      const request = route.request();
      const host = new URL(request.url()).hostname;
      const local = ['localhost', '127.0.0.1'].includes(host);
      return !local && (!['GET', 'HEAD', 'OPTIONS'].includes(request.method()) || /github\.com$|googleapis\.com$|firebaseio\.com$/.test(host))
        ? route.abort() : route.continue();
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/admin/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Masuk', exact: true }).click({ timeout: 60000 });
    await page.getByRole('heading', { name: 'Konten website', exact: true }).waitFor();
    await page.locator('#cms-section-nav').getByRole('link', { name: 'Beranda', exact: true }).click();
    const name = page.locator('input[id^="name-field-"]').first();
    await name.waitFor();
    const file = path.join(dir, 'src/content/hero.json');
    const baseline = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(await name.inputValue(), baseline.name);
    const marker = 'CMS LOCAL SAVE TEST';
    async function save(value) {
      await name.fill(value);
      await page.getByRole('button', { name: 'Simpan', exact: true }).click();
      await page.getByText('Simpan perubahan', { exact: true }).click();
      try {
        await waitFor(() => JSON.parse(fs.readFileSync(file, 'utf8')).name === value, 'CMS save must persist hero.name');
      } catch (error) {
        throw new Error(`${error.message}\nEditor: ${await page.locator('body').innerText()}`);
      }
    }
    await save(marker);
    assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), { ...baseline, name: marker }, 'Save preserves unchanged images and bilingual fields');
    const site = await context.newPage();
    await site.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await site.getByRole('heading', { level: 1 }).filter({ hasText: marker }).waitFor();
    await site.reload();
    await site.getByRole('heading', { level: 1 }).filter({ hasText: marker }).waitFor();
    await page.reload();
    await name.waitFor({ timeout: 60000 });
    assert.equal(await name.inputValue(), marker, 'Saved change survives editor reload');
    await save(baseline.name);
    assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), baseline);
    await site.reload();
    await site.getByRole('heading', { level: 1 }).filter({ hasText: baseline.name }).waitFor();
    assert(!(await site.locator('body').innerText()).includes(marker));
    console.log('PASS: actual CMS save → filesystem → public render → reload → restore; existing images and translations preserved.');
  } catch (error) {
    console.error(logs);
    throw error;
  } finally {
    if (browser) await browser.close();
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else child.kill('SIGTERM');
    await Promise.race([exited, delay(5000).then(() => { throw new Error('Dev runner did not stop'); })]);
    for (const [name, bytes] of originals) assert(fs.readFileSync(path.join(content, name)).equals(bytes), `Original content changed: ${name}`);
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
