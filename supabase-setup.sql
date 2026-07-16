-- designwell — Supabase schema + row-level security
-- Run this ONCE in the SQL editor of the shared project (uauqqdaalnddedgjdgcg),
-- the same project SSaved + Deposits use. It only ADDS the dwd_document table;
-- it never touches their tables.
--
-- PRIVATE model: the whole document is one JSON row. Only the owner emails below
-- can READ or WRITE it, so the doc is invisible to anyone else even though the
-- repo/site are public. The bundle ships no content — it lives only in this row.
-- Keep this allowlist in sync with src/lib/owner.ts.

create table if not exists public.dwd_document (
  id          text primary key,                  -- always 'main'
  user_id     uuid default auth.uid(),
  doc         jsonb not null,
  updated_at  timestamptz not null default now() -- last-write-wins
);

alter table public.dwd_document enable row level security;

drop policy if exists "public read"  on public.dwd_document;
drop policy if exists "owner read"    on public.dwd_document;
drop policy if exists "owner write"   on public.dwd_document;
drop policy if exists "owner update"  on public.dwd_document;

-- owner-only read: the content is private
create policy "owner read" on public.dwd_document
  for select to authenticated
  using ((auth.jwt() ->> 'email') = any (array[
    'marilynliewpj@gmail.com',
    'marilyn@wearemakerlab.com'
  ]));

create policy "owner write" on public.dwd_document
  for insert to authenticated
  with check ((auth.jwt() ->> 'email') = any (array[
    'marilynliewpj@gmail.com',
    'marilyn@wearemakerlab.com'
  ]));

create policy "owner update" on public.dwd_document
  for update to authenticated
  using ((auth.jwt() ->> 'email') = any (array[
    'marilynliewpj@gmail.com',
    'marilyn@wearemakerlab.com'
  ]))
  with check ((auth.jwt() ->> 'email') = any (array[
    'marilynliewpj@gmail.com',
    'marilyn@wearemakerlab.com'
  ]));
