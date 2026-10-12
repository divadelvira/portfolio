---
name: Diva Delvira — soft summer
description: Friendly engineering portfolio with flat illustration and airy pastel surfaces
colors:
  coral: "#c44832"
  coral-hover: "#ad3c29"
  sky: "#d0ebf5"
  mint: "#e5f2e8"
  butter: "#fff3d1"
  peach: "#fce6da"
  project-blue: "#e3f0f6"
  neutral-bg: "#fffefa"
  text: "#254e52"
  text-muted: "#536f70"
  line: "#c8ddda"
typography:
  display:
    fontFamily: "Lilita One, sans-serif"
    fontSize: "clamp(3.5rem, 6.4vw, 6rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: "clamp(2rem, 3.4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 700
rounded:
  control: "12px"
  action: "14px"
  panel: "16px"
spacing:
  compact: "12px"
  group: "24px"
  panel: "32px"
  section: "96px"
  admin-row-inline: "16px"
  admin-nav-inline: "14px"
components:
  button-primary:
    backgroundColor: "{colors.coral}"
    textColor: "#ffffff"
    rounded: "{rounded.action}"
    padding: "13px 18px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.coral-hover}"
    textColor: "#ffffff"
  input:
    backgroundColor: "#f7faf7"
    textColor: "{colors.text}"
    rounded: "10px"
    padding: "14px 16px"
  project-panel:
    backgroundColor: "{colors.project-blue}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  admin-button-primary:
    backgroundColor: "#16534d"
    textColor: "#ffffff"
    rounded: "5px"
    padding: "10px 14px"
    height: "40px"
  admin-index-row:
    backgroundColor: "#fcfbf7"
    textColor: "#1e2b2c"
    padding: "22px 16px"
---

# Design System: Diva Delvira

## Overview

The portfolio-wide soft-summer tokens below remain the default. The separately approved `/admin` route uses a scoped Editorial Index extension documented in `.impeccable/surfaces/public-admin-index-html.md`; it does not redefine this global experience.

**Creative North Star: "Soft summer engineering"**

A light, friendly visual world grounded in the user's summer landing-page reference. Flat engineering and analytics artwork supplies personality; real portfolio evidence remains readable and unchanged. The former navy/gold glass treatment is replaced, not embellished.

**Key Characteristics:**

- Pale blue, seafoam, butter and peach fields.
- Chunky identity lettering with rounded, readable supporting type.
- Original flat illustrations of the owner's engineering/data tools.
- Airy layouts and restrained control feedback.

## Colors

### Primary

Coral identifies primary contact and exploration actions. Deep teal carries text, navigation, and selected metric tabs.

### Secondary

Sky blue is the main summer field. Mint, butter, and peach alternate supporting sections and project panels without introducing a dark-theme break.

### Neutral

Warm white is the reading ground. Muted teal supports secondary copy; pale teal rules group related evidence.

**The Readable Pastel Rule.** Pastels belong to surfaces, not low-contrast body text. Use dark teal or the muted text token on light fields.

## Typography

**Display Font:** Lilita One, locally hosted.
**Body Font:** Nunito Sans, locally hosted in regular and bold faces.

Display lettering is chunky and friendly. Supporting headings use bold rounded sans-serif rather than italic editorial serif. Labels share the body family; monospace styling is not a visual costume.

Hero display type reaches 6rem on desktop and 3.8rem on phones. Section headings are 2–3rem, project titles 1.5–1.7rem, body copy around 0.95–1.05rem with generous leading. Long biography copy is limited to 72ch; hero introduction to 47ch. Existing compact metadata is retained, but it must not be copied as a body-text scale.

Narrative paragraphs use justified alignment with natural wrapping, automatic hyphenation, and a start-aligned final line in both languages. Keep headings, controls, dates, and short metadata in their original alignment. Authored website copy uses commas or colons instead of em dashes.

**The Heading First Rule.** Section titles lead; supporting context follows below them, not as an eyebrow.

## Layout

Use centered containers up to 1360px for the shell and 1280px for content. Desktop sections use 56px horizontal padding and approximately 96px top spacing. At 1023px and below, padding becomes 28px; phones use 24px and approximately 56px section spacing.

Two-column structures collapse in reading order on phones. Project panels vary their span: lead and final entries span both desktop columns. Keep Indonesian content free to wrap. Test widths from 320px through 1440px without hiding overflow globally.

## Elevation & Depth

Flat tonal fields do most of the work. Project panels have no decorative shadows. Mobile navigation and dialogs use soft, teal-tinted elevation to indicate that they sit above the document. The flowing hero boundary is decorative geometry, not a mask for the illustration.

**The Flat Evidence Rule.** Use spacing, color and rules to organize evidence before adding raised cards.

## Shapes

Controls use gently rounded corners, usually 10–14px. Main panels and dialogs use 16px corners. Small language controls retain their compact pill shape. Hero illustration edges are transparent; never crop the artwork with geometric masks.

## Components

### `/admin` Editorial Index (route-scoped extension)

These are observed admin-only values from `public/admin/editor.css`; they do not change public surfaces or the Firebase inbox. Locally hosted Nunito Sans regular and bold is used throughout admin controls. The desktop identity bar is 84px and the section rail is 260px; at 1000px the rail is 220px, and at 760px and below the rail becomes a labelled menu. Admin has no global display face; headings use bold Nunito Sans (34px desktop, 26px editor heading on mobile). Content rows are flat, separated by hairlines; destructive actions use the dedicated red token. Primary Add/Save controls are deep green with compact 5px corners.

### Buttons

Primary actions use coral with white text and at least 52px height. Hover darkens the fill and lifts the action by 2px; press lowers it by 1px. Secondary actions are dark-teal text with a quiet surface hover. Focus uses a 3px blue outline with 5px offset.

### Inputs

Light fields use a pale teal border, 10px corners, visible labels and 14px vertical padding. Keep placeholder contrast readable. Message textareas resize vertically. Submission feedback preserves the original success/error behavior.

### Navigation

A white sticky header uses dark-teal navigation and a coral active underline. Mobile navigation opens in an opaque floating panel. Language state remains visible without reducing inactive text opacity.

### Project panels and experience records

Project records use flat pastel surfaces, generous padding and documentation links aligned below the evidence. Experience records use a single light border; selected/open records gain a mint surface. They remain clickable and keyboard-expandable.

### Metric selector and radar

Project tabs occupy stable slots, expose their selected state, and update the existing result region. The competency chart uses mint/teal data styling and exposes its values through an accessible canvas label.

### Dialogs

Admin login and inbox use native modal dialogs for focus containment and Escape handling. Their backend operations stay unchanged. Empty, disabled, error and table/card states remain part of the interface.

## Do's and Don'ts

### Do:

- **Do** preserve all bilingual copy, factual metrics and external documentation links.
- **Do** carry the summer palette across public surfaces and private surfaces by default; `/admin` is the approved Editorial Index exception, while the Firebase inbox remains summer.
- **Do** use original engineering/data illustration rather than beach objects.
- **Do** honor reduced motion, visible keyboard focus and clear labels.

### Don't:

- **Don't** reuse the watermarked reference as a shipping asset.
- **Don't** return to navy/gold glass styling or corporate-report art direction.
- **Don't** add fabricated project claims or decorative chart values.
- **Don't** hide real content behind entrance effects.
