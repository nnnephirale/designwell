# designwell — living doc of interface craft

A **private, self-reference** doc of good UI / design-engineering practice, with live
reproductions of every technique. v1 content = Jakub Krehel's "Details That Make
Interfaces Feel Better" (12 techniques), rewritten in the doc's own voice with
per-section credit chips linking to the originals. Emil Kowalski's articles (clip-path,
7 animation tips, train your judgement) are the planned v2 feed, entered through the
site's own editor.

**Status (16 Jul 2026):** live at **https://nnnephirale.github.io/designwell/**
(repo `nnnephirale/designwell`, public). Deployed and building green. The content is
**gated behind owner login** — see Privacy below; a signed-out visitor sees only a
locked screen.

**Copyright / privacy stance:** prose is original (techniques/facts aren't copyrightable,
article text is); demos are re-implemented from scratch; every section credits + links the
source. It's kept private anyway — self-reference only, not distributed.

## Stack & layout

Vite + React + TS. Static build (`base: './'`) → GitHub Pages via Actions
(`.github/workflows/deploy.yml`). No router — one long document.

- `src/content/seed.json` — **intentionally empty** (topics only, `sections: []`, old
  `updatedAt` so any real remote wins). Content is NOT bundled — it lives only in the
  private Supabase row, so the public bundle leaks nothing (see Privacy). On first paint a
  signed-in owner pulls the real doc; a fresh device shows the locked screen until sign-in.
  Backups are the Settings → export `content.json` (keep private, do NOT commit — it's the
  content) and the gitignored `content-restore.json` / `supabase-seed-content.sql`.
- `src/types.ts` — Doc/Section/Block model. Section = `{title, topicId, source{author,article,url}, blocks[]}`.
- `src/lib/store.ts` — localStorage-first store (`dwd-doc` key), mutations, quiet-undo
  stack (6s pill), export. localStorage is the **source of truth**.
- `src/lib/sync.ts` — Supabase layered on top (Deposits pattern, never a dependency).
  One row (`dwd_document`, id `main`) = whole doc JSON; last-write-wins on `updatedAt`;
  pull-on-open + ~1.2s debounced push (only when signed in). **Empty-doc guard:** pushNow
  refuses to sync a doc with zero sections — added 16 Jul 2026 after a fresh device
  (empty bundle + empty localStorage) synced over the remote row and wiped the content.
  Recovery: content regenerated into `supabase-seed-content.sql` (gitignored) from git
  `2314a08` + the three Emil Kowalski v2 sections; run it once in the SQL editor and
  every signed-in device pulls it (fresh `updatedAt` wins).
- `src/lib/import.ts` + `components/ImportSheet.tsx` — **the lazy capture path** (16 Jul
  2026): header "import" button → paste a URL → `r.jina.ai/<url>` returns the page as
  clean markdown (free, CORS-open, no key) → line-based parser chunks it into sections
  (one per h1/h2; paragraphs/code fences/images/blockquotes → blocks; h3+ → heading
  blocks) with the credit auto-filled (author guessed from domain, title from the reader).
  Reader h2s arrive as self-links (`## [Title](url#anchor)`) — parse with a GREEDY regex,
  titles can contain parens like `scale(0)`. "Embed live demos" (default on) appends one
  **croppable live embed** per section (see below) with a rough stepped starting offset —
  scrub OFFSET/HEIGHT in edit mode to frame each demo. (Anchored `url#anchor` iframes were
  v1 and failed: most pages ignore the anchor → whole site from the top.)
  Tweet/x status URLs skip the reader → single section with a
  `platform.twitter.com/embed/Tweet.html?id=…` iframe. Everything lands editable; the
  editor is for fine control after capture. This replaces hand-authoring content — the
  doc is a private, login-gated clippings archive (read-it-later pattern).
- `src/lib/groups.ts` — shared grouping for TOC + canvas (topic mode / author→article mode).
- `src/components/` — Sidebar (TOC, scroll-spy), SectionView (credit chip + block list +
  edit chrome), BlockView (all block renderers, read+edit), AddMenu (video-style add-block
  dropdown), SettingsSheet (OTP sign-in, sync now, export).
- **Croppable live embeds (17 Jul 2026 — the finesse answer):** the `iframe` block takes
  `offsetY` (how far down the original page the window starts), `height` (window height,
  page px) and `pageW` (freezes the embedded page's layout width; scales to fit our column
  so crops hold on mobile). `CroppedFrame` in BlockView renders a tall iframe
  (`offsetY+height+400`) shifted by `transform: scale(cw/pageW) translateY(-offsetY)` —
  shows the REAL original, pixel-perfect, cropped to just its demo. Reproductions can't
  match the source's finesse; embedding the original is the only honest replication.
  Guards: (1) iframe mounts only within 900px of the viewport (IntersectionObserver) and
  unmounts when far — N crops of the same page would otherwise be N live site instances
  (froze the tab at 12); (2) a transparent "click to interact" shield sits on top — a
  cross-origin iframe swallows wheel events, so without it, page scrolling stalls whenever
  the cursor crosses an embed. Check `frame-ancestors` before relying on a site
  (`curl -sI url | grep -i frame`); jakub.kr + emilkowal.ski are both embeddable.
  Jakub's 12 sections in `content-restore.json` now use calibrated crops (measured on his
  page at 700px viewport, 17 Jul 2026) instead of the registry reproductions.
- `src/demos/` — the 12 built-in reproductions remain registered in `registry.tsx`
  (offline/file:// fallback, still in the add-menu), but the doc now prefers cropped
  originals. A demo block is either `demoId` (registry) or custom `html` in a sandboxed
  srcdoc iframe with an "inherit site styles" toggle (default on; off = respect the
  original's own fonts/spacing).

## Privacy / auth / sync (Deposits pattern — see 19_DEPOSITS handover for rationale)

**Private model.** Content is owner-only. It lives ONLY in the Supabase row; the bundle
ships empty; a non-owner sees the locked "a private notebook" screen. Repo is public, but
holds no content (git history from before `a7a929d` still does — re-authored public
article material, not secret, so left as-is).

- **Owner allowlist:** `src/lib/owner.ts` = `marilynliewpj@gmail.com`,
  `marilyn@wearemakerlab.com`. Must stay in sync with the RLS allowlist in
  `supabase-setup.sql`. Marilyn signs in with the **gmail**.
- **Gating (App.tsx):** `local = DEV || location.protocol === 'file:'`;
  `isOwner = isOwnerEmail(session.email)`; `canView = canEdit = local || isOwner`.
  Locally (dev or the built file opened from disk) it's always unlocked. On the hosted
  site, only the signed-in owner sees content + the read/edit toggle; everyone else gets
  the locked screen with a sign-in button.
- **RLS (owner-only read AND write):** `supabase-setup.sql` gates select/insert/update to
  the allowlist via `auth.jwt() ->> 'email'`. Idempotent (`drop policy if exists` first) —
  Supabase's "destructive" warning is just those drops; safe, scoped to `dwd_document`.
- Email OTP **typed code, never magic link** (iOS home-screen container issue).
  Don't hardcode code length (project setting; hers is 8 digits).
- `persistSession + autoRefreshToken` → one sign-in per device/surface, permanent.
- Shared Supabase project `uauqqdaalnddedgjdgcg` (same as SSaved/Deposits — keeps the
  free tier alive; the keep-alive cron lives in the deposits repo).
- **Sign-in UI:** a visible header **sync button** ("sign in" → "synced" + green dot when
  authed) opens the Settings sheet. The old long-press-the-title affordance was removed.
  The sign-in email field is blank by default (don't expose the owner address).

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
- Type: **Cursor Gothic** self-hosted in `src/fonts/` (NOT `public/` — routed through the
  CSS asset pipeline so the single-file build base64-inlines them). `@font-face` lives in
  `src/index.css`; index.html no longer has font markup. All 4 weights (400/700 ×
  roman/italic). Has `tnum` (tabular demo needs it).
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
- **Single-file build** (`vite-plugin-singlefile` + `assetsInlineLimit: MAX`): `npm run
  build` emits one self-contained `dist/index.html` — JS, CSS, and all 4 Cursor Gothic
  fonts (base64) inlined, zero external refs. Fonts live in `src/fonts/` and route through
  the CSS asset pipeline so they inline (NOT `public/` — public assets are copied verbatim,
  never inlined). Open `dist/index.html` straight from disk (`file://`) with no server; the
  inline `<script type=module>` runs from disk fine.
- **Editing from a local file:** `canEdit` is true when signed in, in dev, OR when
  `location.protocol === 'file:'` — so opening the built file locally gives full edit +
  localStorage persistence + export-to-JSON with no backend. (Served over http without a
  session, it's read-only until sign-in.)
- Deploy = push to `main` → Actions builds → Pages. The single file deploys as-is.
  **Verify the build actually served** (builds silently stall):
  `curl -s https://nnnephirale.github.io/designwell/ | grep -o 'data:font/woff2' | head -1`
  (should echo once — proves the inlined bundle, not a stale build).

## Open items

1. **Restore the content** — push this build, open the site signed in, Settings →
   "import content.json" → pick `content-restore.json` (repo root, gitignored: the
   recovered 12 Jakub sections + 3 hand-written Emil sections). It stamps a fresh
   updatedAt and syncs everywhere — no SQL editor. (`supabase-seed-content.sql` remains
   as the alternative path.) Then re-capture Emil's three articles properly via the new
   import button if the full-text clippings are preferred over the hand-written digests.
2. Push before editing on a fresh device (empty-doc sync guard + importer live only
   after deploy). Credit chips are hover-revealed on the section title (visible on touch).
3. Image uploads are URL-only for now (Supabase Storage is a possible v2).
4. Drag-reorder (vs nudge) — revisit only with a design that survives long documents.
