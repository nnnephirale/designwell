-- designwell — Supabase schema + row-level security
-- Run this ONCE in the SQL editor of the shared project (uauqqdaalnddedgjdgcg),
-- the same project SSaved + Deposits use. It only ADDS the dwd_document table;
-- it never touches their tables.
--
-- Model: the whole document is one JSON row. Anyone (anon key) can READ it —
-- that's how the public site shows the latest edits without a redeploy.
-- Only marilyn@wearemakerlab.com can WRITE, so open OTP signups can't let a
-- stranger edit the doc.

create table if not exists public.dwd_document (
  id          text primary key,                  -- always 'main'
  user_id     uuid default auth.uid(),
  doc         jsonb not null,
  updated_at  timestamptz not null default now() -- last-write-wins
);

alter table public.dwd_document enable row level security;

drop policy if exists "public read"  on public.dwd_document;
drop policy if exists "owner write"  on public.dwd_document;
drop policy if exists "owner update" on public.dwd_document;

create policy "public read" on public.dwd_document
  for select to anon, authenticated
  using (true);

create policy "owner write" on public.dwd_document
  for insert to authenticated
  with check ((auth.jwt() ->> 'email') = 'marilyn@wearemakerlab.com');

create policy "owner update" on public.dwd_document
  for update to authenticated
  using ((auth.jwt() ->> 'email') = 'marilyn@wearemakerlab.com')
  with check ((auth.jwt() ->> 'email') = 'marilyn@wearemakerlab.com');
