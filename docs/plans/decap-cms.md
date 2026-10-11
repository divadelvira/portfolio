# Plan: Decap CMS for the portfolio

Goal: the site owner (Diva, GitHub owner of `divadelvira/portfolio`) edits text, projects,
awards and images from `/admin` without touching code. Saving commits to GitHub, and Vercel
rebuilds the site.

Stack facts:
- Vite 6 + React 19 SPA. No framework router.
- Hosted on Vercel (`portfolio-divadelvira.vercel.app`).
- Bilingual content (`en` / `id`).

## Architecture

```
/admin (static Decap page) --edits--> src/content/*.json in GitHub --push--> Vercel rebuild
        |                                                                       |
        +--login--> /api/auth -> GitHub OAuth -> /api/callback (Vercel functions)
App.tsx imports src/content/*.json at build time (no runtime fetch).
```

## Steps

1. **Extract content to JSON** (`src/content/`). Move the hardcoded data out of TSX, unchanged:
   - `translations` (src/App.tsx:166) -> `src/content/site.json` (`{ en: {...}, id: {...} }`).
   - Projects data (wherever it lives in App.tsx, near `projectGroups` at :466) -> `src/content/projects.json`.
   - `awards` (src/App.tsx:1143) -> `src/content/awards.json`.
   - `training` and `skillGroups` in `src/components/Credentials.tsx` -> `src/content/credentials.json`.
   - Any other editable lists (experience, education) -> one JSON file per section.
   - Keep the TS types and import the JSON with a type annotation. Icons and functions stay in
     code; store a string key in the JSON and map it to the icon in TSX.
   - Image paths stay as `/projects/...`, `/edu/...` strings.
   - `projectGroups` stays in code (it's structural), unless the projects reference it by key.
   - Wrap file-level objects as `{ "items": [...] }` where Decap needs a top-level object.
2. **Add Decap admin**:
   - `public/admin/index.html` loads `decap-cms` from unpkg with an exact pinned version.
     Check that the version exists first: `npm view decap-cms version`.
   - `public/admin/config.yml`:
     - `backend: { name: github, repo: divadelvira/portfolio, branch: main, base_url: <site origin>, auth_endpoint: api/auth }`
     - `local_backend: true`
     - `media_folder: public/uploads`, `public_folder: /uploads`
     - A `files` collection with one entry per JSON file from step 1. Fields mirror the JSON
       exactly, with `en` / `id` as object subfields and `list` widgets for arrays.
3. **OAuth proxy on Vercel**: `api/auth.ts` and `api/callback.ts`.
   - Implement the standard Decap GitHub OAuth flow (redirect to GitHub, exchange the code,
     `postMessage` `authorization:github:success:{token,provider}` to the opener).
   - Read `OAUTH_GITHUB_CLIENT_ID` / `OAUTH_GITHUB_CLIENT_SECRET` from env.
   - Validate the `state` parameter. Scope: `repo,user`.
   - No new npm dependencies; use global `fetch`.
   - Add `vercel.json` only if it's needed so `/admin` and `/api/*` aren't caught by an SPA
     rewrite.
4. **Docs**: add a `docs/cms.md` section covering:
   - Local editing: `npx decap-server` + `npm run dev`, then open `/admin`.
   - Human setup steps: create a GitHub OAuth App (callback `https://<site>/api/callback`),
     add the two env vars in Vercel, redeploy.

## Constraints

- Rendered site must look and read exactly the same. This is a data move, not a redesign.
- Do not touch the Firebase contact form logic, styles, fonts or `.impeccable/`.
- No new runtime dependencies in `package.json`.
- Do not commit or push. Leave changes in the working tree on `dev`.

## Acceptance

- `npm run lint` and `npm run build` pass.
- `npm run check:ui` passes if it runs without a browser setup; otherwise say so.
- `grep` shows the moved arrays no longer exist as literals in App.tsx / Credentials.tsx.
- `dist/admin/index.html` and `dist/admin/config.yml` exist after the build.
- Every file in `config.yml` maps to a real `src/content/*.json` file, and field names match
  the JSON keys. A small node script asserts this; it can be deleted afterwards.
- Report the list of human steps that remain.
