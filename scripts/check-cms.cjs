const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// JSON is valid YAML; keeping config.yml in JSON lets this check run without dependencies.
const config = JSON.parse(fs.readFileSync('public/admin/config.yml', 'utf8'));
assert.equal(config.backend.name, 'github');
assert.equal(config.backend.repo, 'divadelvira/portfolio');
assert.equal(config.backend.branch, 'main');
assert.equal(config.backend.auth_endpoint, 'api/auth');
assert.equal(new URL(config.backend.base_url).protocol, 'https:');
assert.equal(config.media_folder, 'public/uploads');
assert.equal(config.public_folder, '/uploads');
assert.equal(config.local_backend, true);
const configured = new Set();

function checkFields(value, fields, location) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${location}: expected object`);
  const names = fields.map(field => field.name);
  assert.equal(new Set(names).size, names.length, `${location}: duplicate fields`);
  for (const key of Object.keys(value)) assert(names.includes(key), `${location}.${key}: not editable in CMS`);
  for (const field of fields) {
    const current = value[field.name];
    const at = `${location}.${field.name}`;
    if (current === undefined) {
      assert.equal(field.required, false, `${at}: required field missing`);
      continue;
    }
    if (field.widget === 'object') checkFields(current, field.fields, at);
    else if (field.widget === 'list') {
      assert(Array.isArray(current), `${at}: expected list`);
      assert(current.length >= (field.min ?? 0), `${at}: too few items`);
      if (field.fields) current.forEach((item, i) => checkFields(item, field.fields, `${at}[${i}]`));
      else {
        assert(field.field, `${at}: primitive lists must declare a field`);
        current.forEach(item => assert.equal(typeof item, 'string', `${at}: invalid list item`));
      }
    } else if (field.widget === 'number') {
      assert(Number.isFinite(current), `${at}: expected finite number`);
      if (field.min !== undefined) assert(current >= field.min, `${at}: below minimum`);
      if (field.max !== undefined) assert(current <= field.max, `${at}: above maximum`);
    } else {
      assert.equal(typeof current, 'string', `${at}: expected string`);
      if (field.widget === 'select') {
        assert(field.options.map(option => typeof option === 'string' ? option : option.value).includes(current), `${at}: unknown option`);
      }
      if (field.required !== false) assert(current.trim().length, `${at}: required text is empty`);
      if (field.pattern && current) assert(new RegExp(field.pattern[0]).test(current), `${at}: invalid format`);
    }
  }
}

for (const collection of config.collections) {
  for (const file of collection.files) {
    assert(file.file.startsWith('src/content/'), `Unexpected content path: ${file.file}`);
    assert(!configured.has(file.file), `Duplicate file: ${file.file}`);
    configured.add(file.file);
    checkFields(JSON.parse(fs.readFileSync(file.file, 'utf8')), file.fields, file.file);
  }
}
for (const name of fs.readdirSync('src/content')) {
  if (name.endsWith('.json')) assert(configured.has(`src/content/${name}`), `${name}: not configured in CMS`);
}
const projects = JSON.parse(fs.readFileSync('src/content/projects.json', 'utf8'));
const roles = JSON.parse(fs.readFileSync('src/content/roles.json', 'utf8'));
const profile = JSON.parse(fs.readFileSync('src/content/profile.json', 'utf8'));
for (const items of [profile.experience.items, profile.leadership.items, profile.socials]) {
  assert.equal(new Set(items.map(item => item.key)).size, items.length, 'Profile list identifiers must be unique');
}
for (const lang of ['en', 'id']) {
  assert(roles[lang].items.length > 0, `${lang}: animated roles must not be empty`);
  const titles = projects[lang].items.map(project => project.title);
  assert.equal(new Set(titles).size, titles.length, `${lang}: project titles must be unique`);
  for (const project of projects[lang].items) {
    const result = project.result;
    assert(result.value || (result.before && result.after && Number.isFinite(result.ratio)), `${project.title}: missing project result`);
  }
}
const routes = JSON.parse(fs.readFileSync('vercel.json', 'utf8')).rewrites;
assert(routes.some(route => route.source === '/admin' && route.destination === '/admin/index.html'), 'Production /admin must serve standalone CMS');
assert(routes.every(route => route.source.startsWith('/admin')), 'CMS routing must not intercept API or portfolio routes');
const admin = fs.readFileSync('public/admin/index.html', 'utf8');
assert(admin.includes('decap-cms@3.16.3/dist/decap-cms.js'), 'Decap version must stay pinned');
assert(admin.includes('integrity="sha256-'), 'CMS bundle must have an integrity hash');
if (process.argv.includes('--build')) {
  for (const file of ['admin/index.html', 'admin/config.yml']) {
    assert(fs.existsSync(path.join('dist', file)), `Build missing ${file}`);
  }
}
console.log(`PASS: ${configured.size} content files, CMS field coverage/types, URLs, list bounds, project metrics, and admin assets.`);
