const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ts = require('typescript');

// tsx resolves extensionless imports that the deployed Node ESM runtime rejects.
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-cms-runtime-'));
try {
  fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ type: 'module' }));
  for (const file of ['api/auth.ts', 'api/callback.ts', 'lib/cmsOAuth.ts']) {
    const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const destination = path.join(directory, file.replace(/\.ts$/, '.js'));
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, output);
  }
  fs.writeFileSync(path.join(directory, 'check.mjs'), `
    import assert from 'node:assert/strict';
    for (const endpoint of ['auth', 'callback']) {
      const { default: handler } = await import('./api/' + endpoint + '.js');
      const response = {
        statusCode: 200, body: '', setHeader() {},
        end(body = '') { this.body = body; },
      };
      await handler({ method: 'POST', url: '/api/' + endpoint }, response);
      assert.equal(response.statusCode, 405);
      assert.equal(response.body, 'Method not allowed');
    }
  `);
  const result = spawnSync(process.execPath, ['check.mjs'], { cwd: directory, encoding: 'utf8' });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `Deployed OAuth entrypoints failed to load in Node ESM:\n${result.stderr}`);
  console.log('PASS: compiled OAuth entrypoints load and handle requests in native Node ESM; no OAuth exchange or writes.');
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
