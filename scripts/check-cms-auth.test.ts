import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {buildHandshakeHtml, handleAuthRequest, handleCallbackRequest, type RequestLike, type ResponseLike} from '../lib/cmsOAuth';

const siteOrigin = 'https://portfolio-divadelvira.vercel.app';
const env = {
  OAUTH_GITHUB_CLIENT_ID: 'client-id',
  OAUTH_GITHUB_CLIENT_SECRET: 'client-secret',
  CMS_SITE_URL: siteOrigin,
} as NodeJS.ProcessEnv;

class MockResponse implements ResponseLike {
  statusCode = 200;
  headers = new Map<string, string | string[]>();
  body = '';

  setHeader(name: string, value: string | string[]) {
    this.headers.set(name.toLowerCase(), value);
  }

  end(body = '') {
    this.body = body;
  }

  header(name: string) {
    return this.headers.get(name.toLowerCase());
  }
}

type PopupRun = {
  messages: Array<{data: string; origin: string}>;
  listeners: Set<(event: {source: unknown; origin: string; data: string}) => void>;
  opener: {closed: boolean; postMessage(data: string, origin: string): void};
  wasClosed(): boolean;
};

function req(url: string, cookie?: string): RequestLike {
  return {method: 'GET', url, headers: cookie ? {cookie} : {}};
}

function authStart(now = 1_700_000_000_000) {
  const res = new MockResponse();
  handleAuthRequest(req('/api/auth'), res, {env, now: () => now});
  assert.equal(res.statusCode, 302);
  const location = String(res.header('location'));
  const cookie = String(res.header('set-cookie')).split(';')[0];
  const state = new URL(location).searchParams.get('state');
  assert.ok(state);
  assert.equal(new URL(location).searchParams.get('scope'), 'repo');
  assert.equal(new URL(location).searchParams.get('redirect_uri'), `${env.CMS_SITE_URL}/api/callback`);
  assert.match(String(res.header('set-cookie')), /HttpOnly; Secure; SameSite=Lax/);
  return {cookie, state};
}

function runPopupScript(html: string): PopupRun {
  const scriptMatch = html.match(/<script nonce="[^"]*">([\s\S]*)<\/script>/i);
  assert.ok(scriptMatch, 'generated callback HTML includes one inline script');

  const messages: PopupRun['messages'] = [];
  const listeners: PopupRun['listeners'] = new Set();
  let closed = false;
  const opener = {
    closed: false,
    postMessage(data: string, origin: string) {
      messages.push({data, origin});
    },
  };
  const context = vm.createContext({
    document: {
      getElementById() {
        return {textContent: ''};
      },
    },
    window: {
      opener,
      addEventListener(type: string, listener: (event: {source: unknown; origin: string; data: string}) => void) {
        assert.equal(type, 'message');
        listeners.add(listener);
      },
      removeEventListener(type: string, listener: (event: {source: unknown; origin: string; data: string}) => void) {
        assert.equal(type, 'message');
        listeners.delete(listener);
      },
      close() {
        closed = true;
      },
    },
  });

  vm.runInContext(scriptMatch[1], context);
  return {messages, listeners, opener, wasClosed: () => closed};
}

function dispatch(run: PopupRun, event: {source: unknown; origin: string; data: string}) {
  for (const listener of [...run.listeners]) {
    listener(event);
  }
}

test('auth redirects to GitHub with repo scope and state cookie', () => {
  authStart();
});

test('missing state does not exchange', async () => {
  let fetchCalled = false;
  const res = new MockResponse();
  await handleCallbackRequest(req('/api/callback?code=abc'), res, {
    env,
    fetch: (async () => {
      fetchCalled = true;
      throw new Error('should not exchange without state');
    }) as typeof fetch,
  });

  assert.equal(fetchCalled, false);
  assert.match(res.body, /authorization:github:error:/);
  assert.doesNotMatch(res.body, /authorization:github:success:/);
});

test('missing cookie state does not exchange', async () => {
  let fetchCalled = false;
  const res = new MockResponse();
  await handleCallbackRequest(req('/api/callback?code=abc&state=state-without-cookie'), res, {
    env,
    fetch: (async () => {
      fetchCalled = true;
      throw new Error('should not exchange without cookie');
    }) as typeof fetch,
  });

  assert.equal(fetchCalled, false);
  assert.match(res.body, /authorization:github:error:/);
});

test('tampered state does not exchange', async () => {
  const {cookie} = authStart();
  let fetchCalled = false;
  const res = new MockResponse();
  await handleCallbackRequest(req('/api/callback?code=abc&state=tampered', cookie), res, {
    env,
    now: () => 1_700_000_001_000,
    fetch: (async () => {
      fetchCalled = true;
      throw new Error('should not exchange with tampered state');
    }) as typeof fetch,
  });

  assert.equal(fetchCalled, false);
  assert.match(res.body, /authorization:github:error:/);
  assert.match(String(res.header('set-cookie')), /Max-Age=0/);
});

test('expired state does not exchange', async () => {
  const {cookie, state} = authStart();
  let fetchCalled = false;
  const res = new MockResponse();
  await handleCallbackRequest(req(`/api/callback?code=abc&state=${state}`, cookie), res, {
    env,
    now: () => 1_700_000_700_001,
    fetch: (async () => {
      fetchCalled = true;
      throw new Error('should not exchange with expired state');
    }) as typeof fetch,
  });

  assert.equal(fetchCalled, false);
  assert.match(res.body, /authorization:github:error:/);
});

test('denied authorization returns Decap error handshake page', async () => {
  const {cookie, state} = authStart();
  let fetchCalled = false;
  const res = new MockResponse();
  await handleCallbackRequest(req(`/api/callback?error=access_denied&state=${state}`, cookie), res, {
    env,
    fetch: (async () => {
      fetchCalled = true;
      throw new Error('should not exchange denied auth');
    }) as typeof fetch,
  });

  assert.equal(fetchCalled, false);
  assert.match(res.body, /authorization:github:error:/);
  assert.match(res.body, /GitHub authorization was denied/);
});

test('exchange failure reports error without leaking token', async () => {
  const {cookie, state} = authStart();
  const res = new MockResponse();
  await handleCallbackRequest(req(`/api/callback?code=bad-code&state=${state}`, cookie), res, {
    env,
    now: () => 1_700_000_001_000,
    fetch: (async () => new Response(JSON.stringify({error: 'bad_verification_code'}), {status: 200})) as typeof fetch,
  });

  assert.match(res.body, /authorization:github:error:/);
  assert.doesNotMatch(res.body, /gho_/);
});

test('successful exchange fetches with timeout and returns safe Decap popup protocol', async () => {
  const {cookie, state} = authStart();
  const calls: Array<{url: string; init?: RequestInit}> = [];
  const res = new MockResponse();
  await handleCallbackRequest(req(`/api/callback?code=good-code&state=${state}`, cookie), res, {
    env,
    now: () => 1_700_000_001_000,
    fetch: (async (url, init) => {
      calls.push({url: String(url), init});
      return new Response(JSON.stringify({access_token: 'gho_secret_token', scope: 'repo'}), {status: 200});
    }) as typeof fetch,
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://github.com/login/oauth/access_token');
  assert.equal(JSON.parse(String(calls[0].init?.body)).client_secret, env.OAUTH_GITHUB_CLIENT_SECRET);
  assert.ok(calls[0].init?.signal instanceof AbortSignal);
  assert.match(res.body, /authorization:github:success:/);
  assert.match(String(res.header('content-security-policy')), /frame-ancestors 'none'/);
  assert.equal(res.header('cache-control'), 'no-store, max-age=0');
  assert.equal(res.header('referrer-policy'), 'no-referrer');

  const popup = runPopupScript(res.body);
  assert.deepEqual(popup.messages, [{data: 'authorizing:github', origin: siteOrigin}], 'initial message is handshake only');
  assert.equal(popup.wasClosed(), false, 'Decap parent closes the popup after final auth');

  dispatch(popup, {source: {}, origin: siteOrigin, data: 'authorizing:github'});
  dispatch(popup, {source: popup.opener, origin: 'https://evil.example', data: 'authorizing:github'});
  dispatch(popup, {source: popup.opener, origin: siteOrigin, data: 'not-authorizing:github'});
  assert.equal(popup.messages.length, 1, 'bad handshake replies are ignored');

  dispatch(popup, {source: popup.opener, origin: siteOrigin, data: 'authorizing:github'});
  assert.equal(popup.messages.length, 2);
  assert.equal(popup.messages[1].origin, siteOrigin);
  assert.match(popup.messages[1].data, /^authorization:github:success:/);
  assert.deepEqual(JSON.parse(popup.messages[1].data.replace(/^authorization:github:success:/, '')), {
    token: 'gho_secret_token',
    provider: 'github',
  });
  assert.equal(popup.listeners.size, 0, 'listener removed after legitimate reply');
  assert.equal(popup.wasClosed(), false, 'popup still does not close itself after final auth');
});

test('inline script JSON escapes less-than so malicious tokens cannot close the script', () => {
  const html = buildHandshakeHtml(siteOrigin, {type: 'success', token: '</script><script>alert(1)</script>'}, 'nonce');
  assert.equal((html.match(/<\/script>/gi) ?? []).length, 1);
  assert.match(html, /\\u003c\/script>/);

  const popup = runPopupScript(html);
  assert.deepEqual(popup.messages, [{data: 'authorizing:github', origin: siteOrigin}]);
  dispatch(popup, {source: popup.opener, origin: siteOrigin, data: 'authorizing:github'});
  assert.deepEqual(JSON.parse(popup.messages[1].data.replace(/^authorization:github:success:/, '')), {
    token: '</script><script>alert(1)</script>',
    provider: 'github',
  });
});

test('method checks', async () => {
  const authRes = new MockResponse();
  handleAuthRequest({method: 'POST', url: '/api/auth', headers: {}}, authRes, {env});
  assert.equal(authRes.statusCode, 405);
  assert.equal(authRes.header('allow'), 'GET');

  const callbackRes = new MockResponse();
  await handleCallbackRequest({method: 'POST', url: '/api/callback', headers: {}}, callbackRes, {env});
  assert.equal(callbackRes.statusCode, 405);
  assert.equal(callbackRes.header('allow'), 'GET');
});
