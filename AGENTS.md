# Verification memory

Treat TDD as evidence only for the behavior actually exercised. For editor/persistence fixes, reproduce the user's failing action before editing and keep a regression through the real UI and storage boundary. Run all existing checks before release; distinguish pre-existing failures from regressions, fix in-scope failures, and name any remaining blockers instead of reporting an unqualified pass.

## CMS regression gate

For CMS schema, widget, editor-hook, or save-flow changes, run `npm run check:cms` and `npm run check:cms:save` before claiming editing works. Stop existing dev servers first. The save check edits an isolated copy through the real Decap UI, verifies public rendering and persistence after reload, then restores the original value. A passing config/unit check or an editor that merely opens is not evidence of a working save.

Decap 3.16.3 image widgets apply `pattern` to the basename, not the stored path. Keep full-path patterns in the source schema for content checks and `preSave`; strip only image-widget patterns from the runtime editor config. Preserve rejection of protocol-relative, executable, and malformed media URLs. Primitive list items must be nonempty strings; an empty list is `[]`, not `[null]`. Regression coverage must include existing unchanged images while saving another field.

Local save verification does not prove GitHub publishing or Vercel deployment. Report production writes as unverified until an approved authenticated save produces a commit, deployment, and visible public update. Preserve production content edits when syncing branches; never restore stale content from `dev` over newer `main` content.
