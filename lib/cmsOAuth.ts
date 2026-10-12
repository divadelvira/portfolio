import {createHmac, randomBytes, timingSafeEqual} from 'node:crypto';

const DEFAULT_SITE_ORIGIN = 'https://portfolio-divadelvira.vercel.app';
const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const STATE_COOKIE = 'cms_oauth_state';
const STATE_TTL_MS = 10 * 60 * 1000;

export type RequestLike = {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
};

export type ResponseLike = {
  statusCode: number;
  setHeader(name: string, value: string | string[]): void;
  end(body?: string): void;
};

type OAuthConfig = {
  clientId: string;
  clientSecret: string;
  siteOrigin: string;
};

type HandlerOptions = {
  env?: NodeJS.ProcessEnv;
  fetch?: typeof fetch;
  now?: () => number;
};

type HandshakeResult =
  | {type: 'success'; token: string}
  | {type: 'error'; message: string};

type TokenResponse = {
  access_token?: unknown;
  scope?: unknown;
  error?: unknown;
  error_description?: unknown;
};

export function handleAuthRequest(req: RequestLike, res: ResponseLike, options: HandlerOptions = {}) {
  setBaseSecurityHeaders(res);

  if (req.method !== 'GET') {
    sendText(res, 405, 'Method not allowed', {'Allow': 'GET'});
    return;
  }

  const config = readConfig(options.env ?? process.env);
  if (config.ok === false) {
    sendText(res, 500, config.message);
    return;
  }

  const now = options.now ?? Date.now;
  const state = randomBytes(32).toString('base64url');
  const stateCookie = packStateCookie(state, now() + STATE_TTL_MS, config.value.clientSecret);
  const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
  authorizeUrl.searchParams.set('client_id', config.value.clientId);
  authorizeUrl.searchParams.set('redirect_uri', `${config.value.siteOrigin}/api/callback`);
  authorizeUrl.searchParams.set('scope', 'repo');
  authorizeUrl.searchParams.set('state', state);

  res.statusCode = 302;
  res.setHeader('Set-Cookie', serializeCookie(STATE_COOKIE, stateCookie, STATE_TTL_MS / 1000));
  res.setHeader('Location', authorizeUrl.toString());
  res.end();
}

export async function handleCallbackRequest(req: RequestLike, res: ResponseLike, options: HandlerOptions = {}) {
  setBaseSecurityHeaders(res);

  if (req.method !== 'GET') {
    sendText(res, 405, 'Method not allowed', {'Allow': 'GET'});
    return;
  }

  const config = readConfig(options.env ?? process.env);
  if (config.ok === false) {
    sendText(res, 500, config.message);
    return;
  }

  const url = new URL(req.url ?? '/', config.value.siteOrigin);
  const clearCookie = () => res.setHeader('Set-Cookie', serializeCookie(STATE_COOKIE, '', 0));
  const fail = (message: string) => {
    clearCookie();
    sendHandshake(res, config.value.siteOrigin, {type: 'error', message});
  };

  if (url.searchParams.has('error')) {
    fail('GitHub authorization was denied.');
    return;
  }

  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  if (!code || !returnedState) {
    fail('GitHub authorization response was missing required values.');
    return;
  }

  const cookieValue = parseCookies(req.headers?.cookie)[STATE_COOKIE];
  const storedState = unpackStateCookie(cookieValue, config.value.clientSecret, options.now ?? Date.now);
  if (!storedState || !safeEqual(storedState.state, returnedState)) {
    fail('GitHub authorization state was invalid or expired.');
    return;
  }

  try {
    const token = await exchangeCodeForToken(code, config.value, options.fetch ?? globalThis.fetch);
    clearCookie();
    sendHandshake(res, config.value.siteOrigin, {type: 'success', token});
  } catch {
    fail('GitHub token exchange failed. Please try logging in again.');
  }
}

async function exchangeCodeForToken(code: string, config: OAuthConfig, fetchImpl: typeof fetch) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch unavailable');
  }

  const response = await fetchImpl(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'portfolio-decap-oauth',
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: `${config.siteOrigin}/api/callback`,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error('GitHub token endpoint failed');
  }

  const body = await response.json() as TokenResponse;
  if (body.error || typeof body.access_token !== 'string' || body.access_token.length === 0) {
    throw new Error('GitHub token endpoint returned no token');
  }

  if (typeof body.scope === 'string' && body.scope.length > 0 && !body.scope.split(/[\s,]+/).includes('repo')) {
    throw new Error('GitHub token missing repo scope');
  }

  return body.access_token;
}

function readConfig(env: NodeJS.ProcessEnv): {ok: true; value: OAuthConfig} | {ok: false; message: string} {
  const clientId = env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = env.OAUTH_GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return {ok: false, message: 'CMS OAuth is not configured.'};
  }

  const siteOrigin = parseSiteOrigin(env.CMS_SITE_URL);
  if (!siteOrigin) {
    return {ok: false, message: 'CMS_SITE_URL must be an HTTPS origin with no path.'};
  }

  return {ok: true, value: {clientId, clientSecret, siteOrigin}};
}

function parseSiteOrigin(value: string | undefined) {
  if (!value) {
    return DEFAULT_SITE_ORIGIN;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function packStateCookie(state: string, expiresAt: number, secret: string) {
  const payload = Buffer.from(JSON.stringify({state, expiresAt}), 'utf8').toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

function unpackStateCookie(value: string | undefined, secret: string, now: () => number) {
  if (!value) {
    return null;
  }

  const [payload, signature, extra] = value.split('.');
  if (!payload || !signature || extra !== undefined || !safeEqual(sign(payload, secret), signature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {state?: unknown; expiresAt?: unknown};
    if (typeof parsed.state !== 'string' || typeof parsed.expiresAt !== 'number' || parsed.expiresAt < now()) {
      return null;
    }
    return {state: parsed.state};
  } catch {
    return null;
  }
}

function sign(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function parseCookies(header: string | string[] | undefined) {
  const cookies: Record<string, string> = {};
  const value = Array.isArray(header) ? header.join('; ') : header ?? '';
  for (const part of value.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) {
      continue;
    }
    const name = part.slice(0, index).trim();
    const cookieValue = part.slice(index + 1).trim();
    if (name) {
      cookies[name] = cookieValue;
    }
  }
  return cookies;
}

function serializeCookie(name: string, value: string, maxAgeSeconds: number) {
  return `${name}=${value}; Path=/api/callback; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=Lax`;
}

function sendHandshake(res: ResponseLike, siteOrigin: string, result: HandshakeResult) {
  const nonce = randomBytes(16).toString('base64url');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`);
  res.end(buildHandshakeHtml(siteOrigin, result, nonce));
}

export function buildHandshakeHtml(siteOrigin: string, result: HandshakeResult, nonce = 'test-nonce') {
  const isSuccess = result.type === 'success';
  const message = `${isSuccess ? 'authorization:github:success:' : 'authorization:github:error:'}${JSON.stringify(
    isSuccess ? {token: result.token, provider: 'github'} : {error: result.message, provider: 'github'},
  )}`;
  const bodyText = isSuccess
    ? 'Login complete. You can close this window if it does not close automatically.'
    : result.message;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>CMS GitHub login</title>
</head>
<body>
<p id="message">${escapeHtml(bodyText)}</p>
<script nonce="${escapeHtml(nonce)}">
(() => {
  "use strict";
  const targetOrigin = ${jsonForScript(siteOrigin)};
  const handshakeMessage = "authorizing:github";
  const authorizationMessage = ${jsonForScript(message)};
  const showFallback = () => {
    document.getElementById("message").textContent = ${jsonForScript(bodyText)};
  };

  if (!window.opener || window.opener.closed) {
    showFallback();
    return;
  }

  const onMessage = (event) => {
    if (event.source !== window.opener || event.origin !== targetOrigin || event.data !== handshakeMessage) {
      return;
    }
    window.removeEventListener("message", onMessage, false);
    window.opener.postMessage(authorizationMessage, targetOrigin);
  };

  window.addEventListener("message", onMessage, false);
  window.opener.postMessage(handshakeMessage, targetOrigin);
})();
</script>
</body>
</html>`;
}

function setBaseSecurityHeaders(res: ResponseLike) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

function sendText(res: ResponseLike, statusCode: number, body: string, headers: Record<string, string> = {}) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  for (const [name, value] of Object.entries(headers)) {
    res.setHeader(name, value);
  }
  res.end(body);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[char] ?? char));
}

function jsonForScript(value: string) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
