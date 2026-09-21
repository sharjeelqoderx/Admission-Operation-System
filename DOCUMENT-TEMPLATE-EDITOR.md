# Document Template Editor & View — Complete Reference

This guide documents **every option** in the document template **editor** (create/edit) and **view** (read-only preview) inside the dashboard at `/dashboard/templates`.

---

## Table of contents

1. [Pages & access](#pages--access)
2. [Template form (create & edit)](#template-form-create--edit)
3. [Editor layout (A4 sheet)](#editor-layout-a4-sheet)
4. [Toolbar — Heading](#toolbar--heading)
5. [Toolbar — Font & color](#toolbar--font--color)
6. [Toolbar — Text formatting & structure](#toolbar--text-formatting--structure)
7. [Toolbar — Images & tables](#toolbar--images--tables)
8. [Toolbar — Header & footer](#toolbar--header--footer)
9. [Toolbar — Pages & pagination](#toolbar--pages--pagination)
10. [Toolbar — Logo placement](#toolbar--logo-placement)
11. [Toolbar — Salutation & name variables](#toolbar--salutation--name-variables)
12. [Toolbar — Watermark](#toolbar--watermark)
13. [Toolbar — Date fields](#toolbar--date-fields)
14. [Toolbar — Dynamic merge fields](#toolbar--dynamic-merge-fields)
15. [Toolbar — Dynamic sections](#toolbar--dynamic-sections)
16. [Template assets library](#template-assets-library)
17. [View page (read-only)](#view-page-read-only)
18. [Pagination rules](#pagination-rules)
19. [Saved data structure](#saved-data-structure)
20. [Validation & errors](#validation--errors)

---

## Pages & access

| Route | Purpose | Who can access |
|-------|---------|----------------|
| `/dashboard/templates` | List all document templates | All dashboard roles |
| `/dashboard/templates/new` | Create a new template | Non-university roles only |
| `/dashboard/templates/[id]` | View template (preview) | All dashboard roles |
| `/dashboard/templates/[id]/edit` | Edit template | Non-university roles only |

**University role:** Can view templates and print, but **cannot create or edit**. The Edit button is hidden on the view page; visiting `/edit` redirects back to view.

**Staff/admin roles:** Full create, edit, view, and delete (where enabled on the list page).

---

## Template form (create & edit)

These fields appear **above** the editor on both **Create** and **Edit** pages.

### Back to list

Returns to `/dashboard/templates`.

- **Create page:** Uses a link back to the list.
- **Edit page:** Uses a link back to the template **view** page (`/dashboard/templates/[id]`).

### Save / Create Template

| Page | Button label | Action |
|------|--------------|--------|
| Create | **Create Template** | Saves a new template, then opens the edit page for the new ID |
| Edit | **Save Template** | Updates the template, then returns to the view page |

Shows **Saving…** while the request is in progress. Disabled during save.

### Template title

- **Required** text field.
- Internal name for the template (shown in the list and view page heading area).
- Example: `Admission Offer Letter`.

### Letter language

Dropdown with two options:

| Value | Label |
|-------|-------|
| `de` | Deutsch (German) |
| `en` | English |

Controls how **generated letters** render:

- Salutations (`{{student_greeting}}`, titles)
- Date formatting
- Checklist labels (when using locale-specific checklist variables)
- Default header contact text (when still on the default contact line)

Does **not** change the editor UI language for toolbar labels (those follow the selected letter language only where noted, e.g. header/footer panel hints).

### Offer programs

Multi-select of degree/program options.

- **Required:** At least one program must be selected before save.
- One template can be linked to **multiple programs**.
- Each program can belong to **only one** offer template at a time.
- Programs already assigned to another template are excluded from the dropdown (except the current template’s own assignments when editing).
- Selected programs appear as removable badges below the dropdown.

---

## Editor layout (A4 sheet)

The editor renders a **stack of A4 pages** (210 mm × 297 mm) on a gray canvas.

Each page has three vertical zones:

```
┌─────────────────────────────┐
│  HEADER ZONE (optional)      │  ← Fixed on every page; not editable in body
├─────────────────────────────┤
│  BODY CONTENT AREA           │  ← TipTap editor — only this area is document flow
├─────────────────────────────┤
│  FOOTER ZONE (optional)      │  ← Fixed on every page; not editable in body
└─────────────────────────────┘
```

- **Header and footer** repeat on **every page**.
- **Body content** flows automatically across pages (Google Docs / Word style).
- **View page** uses the same pagination logic so preview matches the editor.

---

## Toolbar — Heading

| Button | Action |
|--------|--------|
| **H1** | Toggle heading level 1 |
| **H2** | Toggle heading level 2 |
| **H3** | Toggle heading level 3 |
| **Normal text** (¶) | Convert block to paragraph |
| **Document title** | Inserts a pre-styled centered main heading block (`Document Title` placeholder text) |

The document title block uses the `document-main-heading` class (centered, uppercase, brand color).

---

## Toolbar — Font & color

### Font size

| Control | Action |
|---------|--------|
| **−** (minus) | Decrease font size by 1 px |
| **Dropdown** | Select size from **8 px – 72 px** (default **14 px** if unset) |
| **+** (plus) | Increase font size by 1 px |

Applies to the current text selection via TipTap `textStyle` / `fontSize`.

### Text color

Preset swatches:

| Label | Hex |
|-------|-----|
| Black | `#111827` |
| Blue | `#2563eb` |
| Red | `#dc2626` |
| Green | `#059669` |
| Gray | `#6b7280` |
| Purple | `#7c3aed` |
| Orange | `#d97706` |

| Control | Action |
|---------|--------|
| **Palette picker** | Custom color via native color input |
| **Reset style** | Removes custom font size and color from selection |

---

## Toolbar — Text formatting & structure

| Button | Action |
|--------|--------|
| **Bold** | Toggle bold |
| **Italic** | Toggle italic |
| **Underline** | Toggle underline |
| **Strikethrough** | Toggle strikethrough |
| **Bullet list** | Toggle unordered list |
| **Ordered list** | Toggle numbered list |
| **Align left** | Left-align paragraph/heading |
| **Align center** | Center-align |
| **Align right** | Right-align |
| **Justify** | Justify text |
| **Add link** | Prompts for URL; empty URL removes link |
| **Undo** | Undo last change |
| **Redo** | Redo |

---

## Toolbar — Images & tables

| Button | Action |
|--------|--------|
| **Insert table** | Inserts a 3×3 table with header row |
| **Header image** | Opens assets library → inserts a centered header image at the **top** of the document body |
| **Insert image** | Opens assets library → inserts an inline/logo-style image at cursor |

### Image behavior in the editor

- Images use the **resize** extension (drag handles).
- Min width: **48 px**, max width: **680 px**.
- Aspect ratio is preserved (`data-keep-ratio`).
- Images that no longer fit above the footer zone **move to the next page** as a whole block (not split).
- Images are loaded from the **shared template assets library** (upload once, reuse).

---

## Toolbar — Header & footer

### Toggle buttons

| Button | When shown | Action |
|--------|------------|--------|
| **Add header** | No header | Enables fixed header on every page with default fields |
| **Remove header** | Header enabled | Removes header from all pages |
| **Add footer** | No footer | Enables fixed footer on every page with default four-column text |
| **Remove footer** | Footer enabled | Removes footer from all pages |

Adding header/footer **does not create extra empty pages** — reserved space is outside the body flow.

### Header panel (when enabled)

Appears below the toggle row.

| Field | Description |
|-------|-------------|
| **Preview** | Live preview of the header layout |
| **Attach logo / Change logo** | Opens assets library (`header-logo` intent) |
| **Remove logo** | Clears the logo (shows placeholder box) |
| **Contact text (right side)** | Multi-line text shown on the right of the header |

**Layout:** Logo (left) · contact line (right). Max logo height: **52 px**.

Default contact text depends on letter language (German vs English defaults from locale config).

When letter language changes and contact text is still the **default** for the previous language, it updates to the new language’s default automatically.

### Footer panel (when enabled)

| Field | Description |
|-------|-------------|
| **Preview** | Live preview of four-column footer |
| **Address** (column 1) | Free text, multi-line |
| **Contact** (column 2) | Free text, multi-line |
| **Management** (column 3) | Free text, multi-line |
| **Legal** (column 4) | Free text, multi-line |

Default footer text is pre-filled with FHM Bielefeld address, contact, management, and register details.

---

## Toolbar — Pages & pagination

| Button | Action |
|--------|--------|
| **Page break** | Inserts a **manual page break** at the cursor; content **after** the break starts on the next page |

### Automatic pagination

- Pages are created automatically as body content grows.
- Nothing is deleted when a page fills.
- Pressing **Enter** at the last line of the body area moves the new line to the **next page** (content never enters the footer zone).
- A **trailing manual page break** with no content after it does **not** create a blank page.

### Manual vs automatic

| Type | Stored in HTML | Behavior |
|------|----------------|----------|
| Manual page break | `<div class="document-page-break" data-page-break="true">` | Always starts a new page at that point |
| Automatic (visual only) | Not saved | Applied by layout engine via margin pushes |

Legacy auto page breaks (`data-auto-page-break="true"`) in old HTML are stripped on load and ignored.

---

## Toolbar — Logo placement

For **in-body** logos (not the document header logo):

| Button | Action |
|--------|--------|
| **Logo row** | Inserts an empty logo line paragraph (for multiple logos on one row) |
| **Add logo** | Opens assets library → inserts logo at cursor into current row |
| **Align logo row — left / center / right / justify** | Sets text alignment on the current paragraph (logo row) |

**Tip:** Click **Add logo** again in the same row to place multiple logos side by side.

---

## Toolbar — Salutation & name variables

Inserts merge tags at the cursor as plain text `{{variable_name}}`. Replaced with real student/application data when the offer letter is generated.

| Button | Variable | Description |
|--------|----------|-------------|
| `{{student_greeting}}` | Full salutation line following **letter language** |
| `{{student_greeting_de}}` | Always German salutation |
| `{{student_greeting_en}}` | Always English salutation |
| `{{student_first_name}}` | Student first name |
| `{{student_last_name}}` | Student last name |
| `{{student_title}}` | Title in letter language (Herr/Frau or Mr./Mrs./Ms.) |
| `{{student_name}}` | Full name |

---

## Toolbar — Watermark

| Control | Action |
|---------|--------|
| **On / Off** | Toggles watermark visibility on every page |
| **Choose image** | Opens assets library → sets watermark image and enables watermark |
| **Remove** | Disables watermark and clears custom image |

**Defaults when enabled:**

- Opacity: **0.12**
- Size: **500 px** (placeholder favicon if no image chosen)
- Centered behind page content

Watermark settings are saved on the template record (`watermark` JSON), not inside body HTML.

---

## Toolbar — Date fields

Three-step flow: **select date type → set date (if required) → Add**.

### Date type dropdown

| Option ID | Inserts variable | Requires date picker? |
|-----------|------------------|------------------------|
| Issue date | `{{issue_date}}` | No — auto at generation |
| Date of birth | `{{student_date_of_birth}}` | No — from student profile |
| Application deadline | `{{application_deadline}}` | No — from program data |
| Intake start date | `{{intake_start_date}}` | No — from degree data |
| Program period – start | `{{program_period}}` | **Yes** — sets `program_period_start` |
| Program period – end | `{{program_period}}` | **Yes** — sets `program_period_end` |
| Classes start date | `{{classes_start_date}}` | **Yes** |
| Enrollment – start | `{{enrollment_period}}` | **Yes** — sets `enrollment_start_date` |
| Enrollment – end | `{{enrollment_period}}` | **Yes** — sets `enrollment_end_date` |
| Visa participation until | `{{visa_participation_deadline}}` | **Yes** |

**Add** is disabled until a date is picked when the selected option requires configuration.

Configured dates are stored in `template_dates` on the template (not only in HTML).

---

## Toolbar — Dynamic merge fields

Additional fields (same `{{key}}` insertion pattern):

| Variable | Label | Source at generation |
|----------|-------|----------------------|
| `{{student_address}}` | Student Address | Application / student profile |
| `{{student_signature}}` | Student Signature | Uploaded signature or placeholder |
| `{{course_name}}` | Course Name | Program |
| `{{degree_name}}` | Degree Name | Program |
| `{{university_name}}` | University Name | Institution |
| `{{application_no}}` | Application Number | Application |
| `{{fees}}` | Fees | Program / offer |
| `{{duration}}` | Course Duration | Program |

*(Salutation variables also appear in this section’s sibling group — see above.)*

---

## Toolbar — Dynamic sections

Inserts a **block-level** merge tag that expands to a full HTML section when the letter is generated.

| Button | Variable | Description |
|--------|----------|-------------|
| **Admission checklist (English)** | `{{admission_requirements_checklist}}` | English checklist; boxes auto-check from verified documents/payments |
| **Admission checklist (Deutsch)** | Same key, German labels when template language is DE | Uses German row labels |
| **Admission checklist (German)** | `{{admission_requirements_checklist_de}}` | Always German checklist |
| **Admission checklist (English)** | `{{admission_requirements_checklist_en}}` | Always English checklist |

Checklist rows come from `document_template.checklist_items` (typically 4–6 items). Document rows check when approved; tuition row checks on payment proof.

---

## Template assets library

Opened from: **Header image**, **Insert image**, **Attach logo**, **Add logo**, **Choose image** (watermark).

| Feature | Description |
|---------|-------------|
| **Browse / upload** | Upload PNG/JPG/etc. to shared template assets via API |
| **Grid select** | Click an asset to use it for the current intent |
| **Intents** | `header`, `header-logo`, `inline`, `logo`, `watermark` — same library, different placement |

Assets are stored once and reused across all templates.

---

## View page (read-only)

Route: `/dashboard/templates/[id]`

| Control | Action |
|---------|--------|
| **Back to list** | Returns to template list |
| **Edit** | Opens edit page (hidden for university role) |
| **Print / Save as PDF** | Browser print dialog; print-only DOM mirror of paginated pages |

### Preview behavior

- Renders **title** above the sheet.
- Uses **sample data** for all merge variables (German or English sample names based on template locale).
- **Paginates** body HTML the same way as print/PDF (header/footer zones respected).
- Shows **header, footer, watermark** if configured.
- **Not editable** — pure preview.

---

## Pagination rules

Summary of layout engine behavior (editor + view):

| Rule | Behavior |
|------|----------|
| Header zone | Top margin + header + **16 px gap** — never part of body flow |
| Footer zone | Footer + bottom margin — never part of body flow |
| Body overflow | Block that doesn’t fit moves entirely to next page |
| Page count | Based on **body content + manual page breaks** only |
| Header/footer alone | Never increases page count |
| Empty document | Always at least **1 page** |
| Tall unsplit block | May visually overflow one page but won’t spawn an extra empty page |

Verification script: `npx tsx scripts/verify-editor-page-flow.ts`

---

## Saved data structure

A template saves:

| Field | Content |
|-------|---------|
| `title` | Template title |
| `locale` | `de` or `en` |
| `course_ids` | Linked program IDs |
| `body_html` | Composed HTML: optional header + body wrapper + optional footer |
| `template_dates` | Configured dates for period/enrollment/visa fields |
| `watermark` | `{ enabled, image_url, opacity, size_px }` |

Body HTML **does not** include automatic page-break nodes — only manual `data-page-break="true"` markers.

---

## Validation & errors

| Error | When |
|-------|------|
| Title is required | Save with empty title |
| Select at least one program | Save with no programs selected |
| API errors | Shown via `ErrorView` under the form; toast on save failure |

---

## Quick reference — all merge variables

```
{{student_greeting}}
{{student_greeting_de}}
{{student_greeting_en}}
{{student_first_name}}
{{student_last_name}}
{{student_title}}
{{student_name}}
{{student_address}}
{{student_signature}}
{{course_name}}
{{degree_name}}
{{university_name}}
{{application_no}}
{{fees}}
{{duration}}
{{issue_date}}
{{student_date_of_birth}}
{{application_deadline}}
{{intake_start_date}}
{{program_period}}
{{classes_start_date}}
{{enrollment_period}}
{{visa_participation_deadline}}
{{admission_requirements_checklist}}
{{admission_requirements_checklist_de}}
{{admission_requirements_checklist_en}}
```

---

## Related source files

| Area | Path |
|------|------|
| Editor UI | `app/(dashboard)/dashboard/templates/_components/document-template-editor.tsx` |
| Form wrapper | `app/(dashboard)/dashboard/templates/_components/document-template-form-view.tsx` |
| A4 paginated sheet | `app/(dashboard)/dashboard/templates/_components/document-template-a4-paginated-sheet.tsx` |
| View preview | `app/(dashboard)/dashboard/templates/_components/document-template-preview.tsx` |
| Pagination logic | `lib/document-template/a4-editor-pagination.ts` |
| Merge variables | `lib/document-template/variables.ts` |
| Date variables | `lib/document-template/date-variables.ts` |
| Header/footer | `lib/document-template/header-footer.ts` |
