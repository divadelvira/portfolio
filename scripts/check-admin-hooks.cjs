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
const validate = sandbox.validateFieldPatterns;
const heroImage = JSON.parse(fs.readFileSync('public/admin/config.yml', 'utf8')).collections[0].files[0].fields.find(field => field.name === 'heroImage');
const image = { ...heroImage, name: 'image', label: 'Image' };
for (const value of ['', '/engineering-summer.png', '/uploads/photo.jpg', 'https://example.com/photo.jpg']) {
  assert.doesNotThrow(() => validate({ image: value }, [image]));
}
for (const value of ['//evil.example/photo.jpg', 'javascript:alert(1)', 'data:image/svg+xml,test', 'photo.jpg', '/bad path.jpg']) {
  assert.throws(() => validate({ image: value }, [image]), /Image/, `Reject unsafe raw media path: ${value}`);
}
const mediaFields = [{ name: 'group', widget: 'object', fields: [image] }, { name: 'photos', widget: 'list', field: image }];
assert.doesNotThrow(() => validate({ group: { image: '/ok.jpg' }, photos: ['/one.jpg', 'https://example.com/two.jpg'] }, mediaFields));
assert.throws(() => validate({ group: { image: '/ok.jpg' }, photos: ['//evil.example/bad.jpg'] }, mediaFields), /Image/);
assert.throws(() => validate({ items: [{ image: 'javascript:alert(1)' }] }, [{ name: 'items', widget: 'list', fields: [image] }]), /Image/);
const primitiveList = [{ name: 'skills', label: 'Skills', widget: 'list', field: { name: 'skill', widget: 'string' } }];
assert.doesNotThrow(() => validate({ skills: [] }, primitiveList));
assert.doesNotThrow(() => validate({ skills: ['SQL'] }, primitiveList));
for (const item of [null, undefined, '', '  ', 12, {}]) {
  assert.throws(() => validate({ skills: [item] }, primitiveList), /Skills/, 'Incomplete list items cannot be published');
}
const config = JSON.parse(fs.readFileSync('public/admin/config.yml', 'utf8'));
for (const collection of config.collections) {
  for (const file of collection.files) {
    assert.doesNotThrow(() => validate(JSON.parse(fs.readFileSync(file.file, 'utf8')), file.fields), `Existing content: ${file.file}`);
  }
}
console.log('PASS: hidden IDs and translations preserved; raw media patterns accept valid paths and reject unsafe URLs across nested objects/lists.');
