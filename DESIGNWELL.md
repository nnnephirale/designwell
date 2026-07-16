# designwell — living doc of interface craft

A personal, continuously-updated reference site compiling good UI / design-engineering
practice, with live reproductions of every technique. v1 content = Jakub Krehel's
"Details That Make Interfaces Feel Better" (12 techniques), rewritten in the doc's own
voice with per-section credit chips linking to the originals. Emil Kowalski's articles
(clip-path, 7 animation tips, train your judgement) are the planned v2 feed, entered
through the site's own editor.

**Copyright stance:** prose is original (techniques/facts aren't copyrightable, article
text is); demos are re-implemented from scratch; every section credits + links the source.

## Stack & layout

Vite + React + TS. Static build (`base: './'`) → GitHub Pages via Actions
(`.github/workflows/deploy.yml`). No router — one long document.

- `src/content/seed.json` — the bundled doc (topics + sections + blocks). Also the
  first-paint fallback and the backup target (Settings → export downloads `content.json`;
  commit it back here periodically).
- `src/types.ts` — Doc/Section/Block model. Section = `{title, topicId, source{author,article,url}, blocks[]}`.
- `src/lib/store.ts` — localStorage-first store (`dwd-doc` key), mutations, quiet-undo
  stack (6s pill), export. localStorage is the **source of truth**.
- `src/lib/sync.ts` — Supabase layered on top (Deposits pattern, never a dependency).
  One row (`dwd_document`, id `main`) = whole doc JSON; last-write-wins on `updatedAt`;
  pull-on-open + ~1.2s debounced push (only when signed in).
- `src/lib/groups.ts` — shared grouping for TOC + canvas (topic mode / author→article mode).
- `src/components/` — Sidebar (TOC, scroll-spy), SectionView (credit chip + block list +
  edit chrome), BlockView (all block renderers, read+edit), AddMenu (video-style add-block
  dropdown), SettingsSheet (OTP sign-in, sync now, export).
- `src/demos/` — the 12 built-in live reproductions, registered in `registry.tsx`.
  A demo block is either `demoId` (registry) or custom `html` in a sandboxed srcdoc
  iframe with an "inherit site styles" toggle (default on; off = respect the original's
  own fonts/spacing — the sanctioned exception to the unified look, same as iframe blocks).

## Auth / sync (Deposits pattern — see 19_DEPOSITS handover for full rationale)

- Email OTP **typed code, never magic link** (iOS home-screen container issue).
  Don't hardcode code length (project setting; hers is 8 digits).
- `persistSession + autoRefreshToken` → one sign-in per device/surface, permanent.
- Shared Supabase project `uauqqdaalnddedgjdgcg` (same as SSaved/Deposits — keeps the
  free tier alive; the keep-alive cron lives in the deposits repo).
- RLS: **public read** (live site shows latest edits without redeploy), **write only for
  `marilyn@wearemakerlab.com`** (open OTP signups would otherwise let anyone write).
  Run `supabase-setup.sql` once in the shared project's SQL editor — still pending as of
  16 Jul 2026. Until then the app is pure-local (sync silently offline).
- Edit mode gating: the read/edit toggle appears when signed in (always in local dev).

## Editing model

Notion-lite blocks: heading, text (md-ish inline: **bold**, *italic*, `code`, [link](url);
deliberately no ~strikethrough~), code (copy button, tiny regex highlighter), image (url),
quote, callout (soft card / pull quote / highlight), demo, iframe, spacer, divider.
Hover-revealed chrome (↑ ↓ × per block, "+ add" gaps); nudge buttons chosen over drag for
v1 reliability. Optimistic deletes with a 6s undo pill (rose accent). Section metadata
(topic, credit) edited inline above the title; sections nudge-reorder within the doc order.

TOC modes: TOPIC (groups by `doc.topics` order) and AUTHOR (first-appearance order,
subdivided by article). Mode persisted (`dwd-toc-mode`). Scroll-spy threshold 130px.
Mobile: sidebar becomes a slide-over sheet, header auto-hides on scroll down.

## Design DNA (16 Jul 2026 — jakub.kr / Cursor restyle)

**Deliberately diverges from the global warm-mono/serif preferences** — this doc
mirrors its sources so the live examples feel native (self-reference only, not distributed).

- Palette lifted from jakub.kr: flat `#fcfcfc` page, greys `#f6f6f6/#f0f0f0/#e8e8e8`,
  ink `#202020`, paragraph `#424242`, secondary `#646464/#838383`. Rose still = undo only.
- Type: **Cursor Gothic** self-hosted (`public/fonts/`, static 400/700 only — no mediums;
  @font-face lives INLINE in index.html with `./fonts/` relative paths because `base:'./'`
  breaks absolute `/fonts` urls in bundled CSS on Pages). Has `tnum` (tabular demo needs it).
- jakub's signature scale: headings same 16px as body, weight carries hierarchy
  (his font-[550] ≈ our 700), tracking -0.01em body / -0.014em headings (cursor.com cue).
- Spacing per jakub exactly: 692px column (`max-w-173`), 64px collapsed margins between
  sections (margin-top, NOT padding, so the last block's margin collapses into it), demo
  cards ±32px, heading→body gap 8px. No ruled borders between sections — air only.
  Divider block = his three-dash 56×2px motif with 64px margins.
- Demo shells = his preview-card: white, 12px radius, ring shadow
  (`0 0 0 1px #0000000f, 0 1px 2px -1px #0000000f, 0 2px 4px #0000000a`), caption bar
  `#fcfcfc` + `#e8e8e8` top hairline, captions 13px `#838383` centered.
- Kept from the old DNA: frosted blur header, round segmented tabs, ease-out expo,
  grey muted buttons, ghost inputs, dark status pill.
- Code blocks are light now (white card, mono = SF Mono stack), not dark.
- The custom-demo iframe base (BlockView `CUSTOM_DEMO_BASE`) injects Cursor Gothic via
  absolute runtime URLs (srcdoc iframes have no base URL).

## Dev / deploy

- `npm run dev` (preview launch config "designwell", port 5183; `autoPort` on and
  vite.config reads `PORT`, so parallel sessions get their own port). Seed content is the
  permanent mock data. localStorage edits shadow the seed — clear `dwd-doc` to reset.
- Deploy = push to `main` → Actions builds → Pages. **Verify the build actually served**
  (builds silently stall): `curl -s https://nnnephirale.github.io/designwell/ | grep assets/index`
  and compare the bundle hash with `dist/`.

## Open items

1. Run `supabase-setup.sql` in the shared project (one-time) → then sign in on each device.
2. v2: feed Emil Kowalski's three articles through the editor; add registry demos per
   technique as needed.
3. Image uploads are URL-only for now (Supabase Storage is a possible v2).
4. Drag-reorder (vs nudge) — revisit only with a design that survives long documents.
