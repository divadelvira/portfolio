const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');

async function waitFor(url, options) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(1_000) });
      if (response.ok) return response;
    } catch {}
    await delay(200);
  }
  throw new Error(`Server tidak siap: ${url}`);
}

(async () => {
  for (const port of [3000, 8081]) {
    let occupied = false;
    try { await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(500) }); occupied = true; } catch {}
    assert(!occupied, `Stop server port ${port} sebelum menjalankan check:dev`);
  }
  const child = spawn(process.execPath, ['scripts/dev.mjs'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = '';
  child.stdout.on('data', data => { logs += data; });
  child.stderr.on('data', data => { logs += data; });
  const exited = new Promise(resolve => child.on('exit', resolve));
  try {
    const site = await waitFor('http://127.0.0.1:3000');
    assert((await site.text()).includes('id="root"'), 'Portfolio harus berjalan');
    const admin = await waitFor('http://127.0.0.1:3000/admin');
    assert((await admin.text()).includes('decap-cms@'), '/admin harus membuka CMS, bukan SPA');
    const proxy = await waitFor('http://127.0.0.1:8081/api/v1', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'info' }),
    });
    assert.equal((await proxy.json()).type, 'local_fs', 'Editor harus memakai file lokal tanpa GitHub');
  } catch (error) {
    console.error(logs);
    throw error;
  } finally {
    if (process.platform === 'win32') {
      const cleanup = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      await new Promise(resolve => cleanup.on('exit', resolve));
    } else child.kill('SIGTERM');
    await Promise.race([exited, delay(5_000).then(() => { throw new Error('Dev runner tidak berhenti'); })]);
  }
  for (const port of [3000, 8081]) {
    await assert.rejects(fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(1_000) }), `Port ${port} harus berhenti bersama runner`);
  }
  console.log('PASS: one dev command starts portfolio + local CMS without GitHub; test cleanup leaves both ports closed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
