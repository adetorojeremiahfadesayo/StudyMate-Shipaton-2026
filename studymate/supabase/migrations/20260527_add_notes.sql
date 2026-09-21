create extension if not exists "uuid-ossp";

create table if not exists public.notes (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid not null references public.courses(id) on delete cascade,
  content text not null default '',
  generated_at timestamp with time zone default now(),
  edited_at timestamp with time zone
);

create index if not exists notes_course_id_idx
  on public.notes (course_id);

alter table public.notes enable row level security;

create policy "Users can read their own notes"
on public.notes
for select
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = notes.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can create notes for their own courses"
on public.notes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.courses c
    where c.id = notes.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can update their own notes"
on public.notes
for update
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = notes.course_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.courses c
    where c.id = notes.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can delete their own notes"
on public.notes
for delete
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = notes.course_id
      and c.user_id = auth.uid()
  )
);
