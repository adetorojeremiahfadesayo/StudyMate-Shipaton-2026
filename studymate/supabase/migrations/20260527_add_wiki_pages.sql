create extension if not exists "uuid-ossp";

create table if not exists public.wiki_pages (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  type text not null,
  content text not null,
  related_pages text[] not null default '{}',
  source_material text,
  created_at timestamp with time zone default now()
);

create index if not exists wiki_pages_course_id_idx
  on public.wiki_pages (course_id);

create index if not exists wiki_pages_type_idx
  on public.wiki_pages (type);

alter table public.wiki_pages enable row level security;

create policy "Users can read their own wiki pages"
on public.wiki_pages
for select
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = wiki_pages.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can create wiki pages for their own courses"
on public.wiki_pages
for insert
to authenticated
with check (
  exists (
    select 1
    from public.courses c
    where c.id = wiki_pages.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can update their own wiki pages"
on public.wiki_pages
for update
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = wiki_pages.course_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.courses c
    where c.id = wiki_pages.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can delete their own wiki pages"
on public.wiki_pages
for delete
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = wiki_pages.course_id
      and c.user_id = auth.uid()
  )
);
