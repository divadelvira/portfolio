import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import metadata from '../src/content/metadata.json';
import {renderCmsMetadata} from '../lib/cmsMetadata';

const template = fs.readFileSync('index.html', 'utf8');

test('all head text and images render from editable metadata', () => {
  const edited = {...metadata, title: 'CMS title', description: 'CMS description',
    author: 'CMS author', keywords: 'CMS keywords', socialTitle: 'CMS social title',
    socialDescription: 'CMS social description', siteUrl: 'https://example.com/',
    socialImage: '/uploads/social.png', favicon: '/uploads/favicon.svg'};
  const html = renderCmsMetadata(template, edited);
  assert(!html.includes('{{cms.'));
  for (const [key, value] of Object.entries(edited)) {
    if (key !== 'socialImage') assert(html.includes(value), `${key} must be rendered`);
  }
  assert(html.includes('https://example.com/uploads/social.png'));
});

test('CMS metadata cannot break out of HTML text or attributes', () => {
  const payload = '\"><script>alert(1)</script> & \'quoted\'';
  const html = renderCmsMetadata('<title>{{cms.title}}</title><meta content="{{cms.description}}">', {
    title: payload, description: payload,
  });
  assert(!html.includes('<script>'));
  assert(html.includes('&quot;&gt;&lt;script&gt;'));
  assert(html.includes('&amp; &#39;quoted&#39;'));
});

test('missing metadata fails instead of publishing an unresolved placeholder', () => {
  assert.throws(() => renderCmsMetadata('{{cms.missing}}', metadata), /Missing CMS metadata/);
});
