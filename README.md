# Admission Operation System

Next.js dashboard for admissions, offers, and document templates (A4 offer letters).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Built with Next.js, Supabase, TanStack Query, ShadCN UI, and TipTap.

---

## Document template editor & view

Full documentation for **every editor toolbar option**, form field, merge variable, header/footer setting, pagination rule, and view-page control:

**[DOCUMENT-TEMPLATE-EDITOR.md](./DOCUMENT-TEMPLATE-EDITOR.md)**

Topics covered:

- Create, edit, and view page routes and role access
- Template title, letter language, and program assignment
- All toolbar sections (heading, font, formatting, images, tables, links)
- Header & footer configuration (logo, contact, four footer columns)
- Page breaks and automatic A4 pagination
- Logo row placement and alignment
- All `{{merge_variables}}` and dynamic checklist sections
- Watermark controls
- Date field picker and template date storage
- Template assets library
- View page print / PDF and sample-data preview
- Pagination zones (header / body / footer) and page-count rules

---

## Development

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npx tsc --noEmit` | Typecheck |
| `npx tsx scripts/verify-editor-page-flow.ts` | Run document pagination unit checks |

---

## UI

ShadCN preset: `npx shadcn@latest init --preset b5vp08PlQ --template next`
