const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

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
    if (['image', 'logo', 'profileImage', 'heroImage', 'socialImage', 'favicon'].includes(field.name)) {
      const leaves = field.widget === 'object' ? field.fields : [field];
      assert(leaves.every(item => item.widget === 'image'), `${at}: must have CMS image pickers`);
    }
    if (['photos', 'gallery'].includes(field.name)) {
      const lists = field.widget === 'object' ? field.fields : [field];
      assert(lists.every(item => item.widget === 'list' && (item.field?.widget === 'image' || item.field?.widget === 'string')),
        `${at}: expected editable photo lists`);
    }
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

function checkSchema(fields, location) {
  for (const field of fields) {
    const at = `${location}.${field.name}`;
    if (field.widget === 'object') assert(Array.isArray(field.fields), `${at}: object fields are missing`);
    if (field.widget === 'list') {
      assert(Array.isArray(field.fields) || field.field, `${at}: list item schema is missing`);
      if (field.field) assert(field.field.name, `${at}: list item field needs a name`);
    }
    if (field.widget === 'hidden' && ['id', 'key', 'uid'].includes(field.name)) {
      assert.equal(field.required, false, `${at}: IDs are generated automatically and cannot be required in the editor`);
    }
    if (field.fields) checkSchema(field.fields, at);
  }
}
for (const collection of config.collections) {
  assert.equal('folder' in collection, false, `${collection.name}: file collections cannot also define a folder`);
  assert(Array.isArray(collection.files), `${collection.name}: expected file collection`);
  for (const file of collection.files) {
    checkSchema(file.fields, `${collection.name}.${file.name}`);
    assert(file.file.startsWith('src/content/'), `Unexpected content path: ${file.file}`);
    assert(!configured.has(file.file), `Duplicate file: ${file.file}`);
    configured.add(file.file);
    checkFields(JSON.parse(fs.readFileSync(file.file, 'utf8')), file.fields, file.file);
  }
}
for (const name of fs.readdirSync('src/content')) {
  if (name.endsWith('.json')) assert(configured.has(`src/content/${name}`), `${name}: not configured in CMS`);
}
function hardcodedPublicContent(source, filename) {
  const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  // Internal Firebase operator dialogs are application controls, not portfolio content.
  const operator = source.indexOf('aria-label={lang === "en" ? "Administrator login"');
  const end = operator < 0 ? source.length : operator;
  const issues = [];
  function visit(node) {
    if (node.getStart(tree) >= end) return;
    if (ts.isVariableDeclaration(node) && ['handleAdminLogin', 'handleClearAllMessages'].includes(node.name.getText(tree))) return;
    let hardcoded = ts.isJsxText(node) && /\p{L}/u.test(node.getText(tree));
    if (ts.isJsxAttribute(node) && ['alt', 'title', 'placeholder', 'aria-label', 'src'].includes(node.name.getText(tree))) {
      hardcoded ||= Boolean(node.initializer && ts.isStringLiteral(node.initializer) && node.initializer.text);
    }
    if (ts.isConditionalExpression(node) && node.condition.getText(tree) === 'lang === "en"'
        && ts.isStringLiteral(node.whenTrue) && ts.isStringLiteral(node.whenFalse)) {
      let parent = node.parent;
      while (parent && !ts.isJsxAttribute(parent) && !ts.isArrowFunction(parent)) parent = parent.parent;
      hardcoded ||= !(parent && ts.isJsxAttribute(parent) && parent.name.getText(tree) === 'className');
    }
    if (ts.isObjectLiteralExpression(node)) {
      const keys = node.properties.filter(ts.isPropertyAssignment).map(property => property.name.getText(tree));
      hardcoded ||= keys.includes('en') && keys.includes('id') && node.properties.some(property =>
        ts.isPropertyAssignment(property) && ts.isStringLiteral(property.initializer));
    }
    if (hardcoded) issues.push(`${filename}:${tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1}: hardcoded public content`);
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return issues;
}
assert.equal(hardcodedPublicContent('const c = <h1>Fixed title</h1>', 'fixture.tsx').length, 1);
assert.equal(hardcodedPublicContent('const c = <img src="/fixed.png" />', 'fixture.tsx').length, 1);
assert.equal(hardcodedPublicContent('const c = lang === "en" ? "Fixed" : "Tetap"', 'fixture.tsx').length, 1);
for (const filename of fs.readdirSync('src', { recursive: true }).filter(name => name.endsWith('.tsx'))) {
  const file = path.join('src', filename);
  assert.deepEqual(hardcodedPublicContent(fs.readFileSync(file, 'utf8'), file), [], `${file}: move public copy/media into CMS content`);
}
const site = JSON.parse(fs.readFileSync('src/content/site.json', 'utf8'));
assert.deepEqual(Object.keys(site.en).sort(), Object.keys(site.id).sort(), 'Public labels must exist in both languages');
const sectionOrder = ['hero', 'about', 'experience', 'projects', 'skills', 'awards', 'education', 'training', 'contact', 'settings'];
assert.deepEqual(config.collections.map(collection => collection.name), sectionOrder, 'CMS sections must follow website order');
for (const collection of config.collections.slice(0, 9)) {
  assert.equal(collection.files.length, 1, `${collection.name}: expected one core content file`);
  assert.equal(collection.files[0].name, collection.name, `${collection.name}: file entry must match collection`);
  assert.equal(collection.create, false, `${collection.name}: singleton cannot be created`);
  assert.equal(collection.delete, false, `${collection.name}: singleton cannot be deleted`);
}
for (const name of ['projects', 'awards', 'training', 'experience']) {
  const data = JSON.parse(fs.readFileSync(`src/content/${name}.json`, 'utf8'));
  const items = data.items || data.experience || data.training || [];
  const ids = items.map(item => item.id || item.key);
  assert.equal(new Set(ids).size, ids.length, `${name}: stable IDs must be unique`);
}
const projects = JSON.parse(fs.readFileSync('src/content/projects.json', 'utf8')).items;
assert(projects.length > 0, 'Projects must have defaults');
assert(projects.every(project => project.id && project.title.en && project.title.id), 'Projects need stable IDs and bilingual titles');
const awards = JSON.parse(fs.readFileSync('src/content/awards.json', 'utf8')).items;
assert(awards.every(award => award.id && award.title.en && award.title.id), 'Awards need stable IDs and bilingual titles');
const hero = JSON.parse(fs.readFileSync('src/content/hero.json', 'utf8'));
assert(hero.roles.length && hero.roles.every(role => role.key && role.en && role.id), 'Rotating roles need stable IDs and bilingual values');
const original = JSON.parse(fs.readFileSync('scripts/fixtures/cms-original-defaults.json', 'utf8'));
const localize = (value, lang) => Array.isArray(value) ? value.map(item => localize(item, lang))
  : value && typeof value === 'object' && 'en' in value && 'id' in value ? localize(value[lang], lang)
    : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localize(item, lang)])) : value;
for (const lang of ['en', 'id']) {
  assert.deepEqual(projects.map(({ id: _id, ...project }) => localize(project, lang)), original.projects[lang].items, `${lang}: project migration preserves every original field`);
  assert.deepEqual(awards.map(({ id: _id, ...award }) => localize(award, lang)), original.awards[lang].items, `${lang}: award migration preserves every original field`);
  assert.deepEqual(hero.roles.map(({ key: _key, ...role }) => role[lang]), original.roles[lang].items, `${lang}: role migration preserves original values`);
}
const routes = JSON.parse(fs.readFileSync('vercel.json', 'utf8')).rewrites;
assert(routes.some(route => route.source === '/admin' && route.destination === '/admin/index.html'), 'Production /admin must serve standalone CMS');
assert(routes.every(route => route.source.startsWith('/admin')), 'CMS routing must not intercept API or portfolio routes');
const admin = fs.readFileSync('public/admin/index.html', 'utf8');
assert(admin.includes('decap-cms@3.16.3/dist/decap-cms.js'), 'Decap version must stay pinned');
assert(admin.includes('integrity="sha256-'), 'CMS bundle must have an integrity hash');
if (process.argv.includes('--build')) {
  assert(!fs.readFileSync('dist/index.html', 'utf8').includes('{{cms.'), 'Build has unresolved CMS metadata');
  for (const file of ['admin/index.html', 'admin/config.yml']) {
    assert(fs.existsSync(path.join('dist', file)), `Build missing ${file}`);
  }
}
console.log(`PASS: ${configured.size} content files, CMS field coverage/types, image pickers, hardcoded public copy/media audit, URLs, list bounds, project metrics, and admin assets.`);
