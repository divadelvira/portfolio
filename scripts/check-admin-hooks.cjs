const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('public/admin/editor.js', 'utf8'), sandbox);
const patchesFor = sandbox.missingIdPatches;
const fields = [{ name: 'items', widget: 'list', fields: [
  { name: 'id', widget: 'hidden', required: false },
  { name: 'title', widget: 'object', fields: [
    { name: 'en', widget: 'string' }, { name: 'id', widget: 'string' },
  ] },
  { name: 'photos', widget: 'list', field: { widget: 'image' } },
] }];
const data = { items: [
  { id: 'existing-id', title: { en: 'Existing', id: 'Asli' }, photos: ['/photo.jpg'] },
  { title: { en: 'New', id: 'Baru' }, photos: [] },
  { id: 'existing-id', title: { en: 'Copy', id: 'Salinan' }, photos: [] },
] };
const original = JSON.stringify(data);
let counter = 0;
const patches = JSON.parse(JSON.stringify(patchesFor(data, fields, () => `generated-${++counter}`)));
assert.deepEqual(patches, [
  { path: ['items', 1, 'id'], value: 'generated-1' },
  { path: ['items', 2, 'id'], value: 'generated-2' },
]);
assert.equal(JSON.stringify(data), original, 'ID generation cannot mutate editor data or translations');
assert.deepEqual(JSON.parse(JSON.stringify(patchesFor({ items: [] }, fields))), []);
assert.deepEqual(JSON.parse(JSON.stringify(patchesFor({ items: [data.items[0]] }, fields))), []);
const nested = [{ name: 'group', widget: 'object', fields }];
assert.deepEqual(JSON.parse(JSON.stringify(patchesFor({ group: { items: [data.items[1]] } }, nested, () => 'nested-id'))), [
  { path: ['group', 'items', 0, 'id'], value: 'nested-id' },
]);
const bilingualList = [{ name: 'items', widget: 'list', fields: [{ name: 'en', widget: 'string' }, { name: 'id', widget: 'string' }] }];
assert.deepEqual(JSON.parse(JSON.stringify(patchesFor({ items: [{ en: 'Role', id: 'Profesi' }] }, bilingualList))), [], 'Language id is never a technical identifier');
console.log('PASS: automatic hidden IDs, nested lists, duplicates, empty lists; existing IDs/translations/media stay untouched.');
