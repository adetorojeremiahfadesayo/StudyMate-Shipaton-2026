create extension if not exists "uuid-ossp";

create table if not exists public.key_points (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid not null references public.courses(id) on delete cascade,
  type text not null,
  title text not null,
  content text not null,
  source_material text,
  created_at timestamp with time zone default now()
);

create index if not exists key_points_course_id_idx
  on public.key_points (course_id);

create index if not exists key_points_type_idx
  on public.key_points (type);

alter table public.key_points enable row level security;

create policy "Users can read their own key points"
on public.key_points
for select
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = key_points.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can create key points for their own courses"
on public.key_points
for insert
to authenticated
with check (
  exists (
    select 1
    from public.courses c
    where c.id = key_points.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can update their own key points"
on public.key_points
for update
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = key_points.course_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.courses c
    where c.id = key_points.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can delete their own key points"
on public.key_points
for delete
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = key_points.course_id
      and c.user_id = auth.uid()
  )
);

create table if not exists public.flashcards (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid not null references public.courses(id) on delete cascade,
  key_point_id uuid not null references public.key_points(id) on delete cascade,
  front text not null,
  back text not null,
  status text not null default 'review',
  created_at timestamp with time zone default now()
);

create index if not exists flashcards_course_id_idx
  on public.flashcards (course_id);

create index if not exists flashcards_key_point_id_idx
  on public.flashcards (key_point_id);

create index if not exists flashcards_status_idx
  on public.flashcards (status);

alter table public.flashcards enable row level security;

create policy "Users can read their own flashcards"
on public.flashcards
for select
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = flashcards.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can create flashcards for their own courses"
on public.flashcards
for insert
to authenticated
with check (
  exists (
    select 1
    from public.courses c
    where c.id = flashcards.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can update their own flashcards"
on public.flashcards
for update
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = flashcards.course_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.courses c
    where c.id = flashcards.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can delete their own flashcards"
on public.flashcards
for delete
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = flashcards.course_id
      and c.user_id = auth.uid()
  )
);
