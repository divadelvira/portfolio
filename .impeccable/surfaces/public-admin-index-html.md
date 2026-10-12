---
version: 1
slug: "public-admin-index-html"
primary_target: "public/admin/index.html"
related_targets: ["public/admin/editor.css", "public/admin/editor.js", "public/admin/config.yml"]
---

# Portfolio editor — Editorial Index

Mode: Operate. Audience: the nontechnical portfolio owner updating bilingual content on a laptop, with phone editing as a supported fallback. The user explicitly selected Impeccable's Pick, Editorial Index, then requested website-ordered navigation and Add/Edit/Delete.

## Direction contract

THESIS: A calm editorial index makes the actual portfolio sections recognizable and editing safe. This replaces the stock Decap/pastel admin treatment, not the public portfolio's soft-summer identity.

OWN-WORLD: Ivory #fcfbf7, ink #1e2b2c, muted #5d6967, rail #eaece5, rules #d9dcd5, selection #d8e3da, action #16534d, destructive #9b352c. Locally hosted Nunito Sans, regular and bold. UI labels remain sans, not decorative display typography. No gradients, metric cards, invented analytics, shadows on content rows, or stacked floating panels.

FIRST VIEWPORT: An 84px identity bar above a 260px section sidebar, with a clear work area. The landing index lists actual sections and what can be edited; opening Proyek shows real bilingual list items and visible Add/Edit/Delete. Fixed 34px headings, 15–16px content, 12–14px supporting text; quiet hairline separators. At 760px and below, section navigation becomes an explicitly labelled menu, and bilingual fields stack rather than overflowing. At 1000px, the rail narrows to 220px.

VISITOR PATH: Masuk locally or GitHub login online; choose Beranda, Tentang saya, Pengalaman, Proyek, Kompetensi, Penghargaan, Pendidikan, Pelatihan, or Kontak in website order; edit both languages within one item; add/reorder/delete list items; save using Simpan. Global text and SEO remain under settings. Core singleton section files are not deletable. The existing Firebase inbox is outside this route and remains unchanged.

SIGNATURE: The aligned section index becomes an equally calm item editor. Selection moves to the current section; control density and row alignment remain consistent. Motion only communicates menu/selection state, with reduced-motion support. This is a working CMS, not a decorative portfolio dashboard.

SAFETY: Cancelling deletion keeps the item. Confirming removal edits the draft only, until Simpan. Hidden stable identifiers are assigned automatically on preSave; existing evidence references cannot silently drift after reorder/delete. Local save never automatically commits/pushes. Production retains GitHub OAuth and the configured main branch.

APPROVAL: Decision key b3f3b29e, option model-pick. Fixed code-led composition reference: .impeccable/mocks/decision/admin-editorial-index.html. The reference is a nonfunctional first viewport, not a replacement for responsive editing, authenticating, saving, validation, error states, or media selection.
