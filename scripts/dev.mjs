import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
const children = [];
let stopping = false;

function stop(code) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill();
}

function start(name, file, args = [], env = process.env) {
  const child = spawn(process.execPath, [file, ...args], { cwd: root, env, stdio: 'inherit' });
  children.push(child);
  child.on('error', error => {
    console.error(`${name} gagal dijalankan: ${error.message}`);
    stop(1);
  });
  child.on('exit', code => {
    if (!stopping) {
      console.error(`${name} berhenti. Kedua server dimatikan; cek pesan error atau port yang sedang dipakai.`);
      stop(code || 1);
    }
  });
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

// Local filesystem mode never commits or pushes; bind the unauthenticated editor to loopback only.
start('Decap CMS', require.resolve('decap-server'), [], {
  ...process.env, BIND_HOST: '127.0.0.1', PORT: '8081', MODE: 'fs', GIT_REPO_DIRECTORY: root,
});
start('Vite', join(dirname(require.resolve('vite/package.json')), 'bin/vite.js'), [
  '--port', '3000', '--host', '127.0.0.1', '--strictPort', ...process.argv.slice(2),
]);
