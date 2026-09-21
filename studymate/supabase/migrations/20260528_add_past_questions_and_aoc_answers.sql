create extension if not exists "uuid-ossp";

create table if not exists public.past_questions (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid not null references public.courses(id) on delete cascade,
  question text not null,
  answer text,
  confidence text not null default 'medium',
  warning_message text,
  source_pages text[] not null default '{}',
  created_at timestamp with time zone default now()
);

create index if not exists past_questions_course_id_idx
  on public.past_questions (course_id);

create index if not exists past_questions_created_at_idx
  on public.past_questions (created_at desc);

alter table public.past_questions enable row level security;

drop policy if exists "Users can read their own past questions" on public.past_questions;
drop policy if exists "Users can create past questions for their own courses" on public.past_questions;
drop policy if exists "Users can update their own past questions" on public.past_questions;
drop policy if exists "Users can delete their own past questions" on public.past_questions;

create policy "Users can read their own past questions"
on public.past_questions
for select
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = past_questions.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can create past questions for their own courses"
on public.past_questions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.courses c
    where c.id = past_questions.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can update their own past questions"
on public.past_questions
for update
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = past_questions.course_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.courses c
    where c.id = past_questions.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can delete their own past questions"
on public.past_questions
for delete
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = past_questions.course_id
      and c.user_id = auth.uid()
  )
);

create table if not exists public.aoc_answers (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid not null references public.courses(id) on delete cascade,
  topic text not null,
  answer text not null,
  confidence text not null default 'medium',
  warning_message text,
  created_at timestamp with time zone default now()
);

create index if not exists aoc_answers_course_id_idx
  on public.aoc_answers (course_id);

create index if not exists aoc_answers_created_at_idx
  on public.aoc_answers (created_at desc);

alter table public.aoc_answers enable row level security;

drop policy if exists "Users can read their own aoc answers" on public.aoc_answers;
drop policy if exists "Users can create aoc answers for their own courses" on public.aoc_answers;
drop policy if exists "Users can update their own aoc answers" on public.aoc_answers;
drop policy if exists "Users can delete their own aoc answers" on public.aoc_answers;

create policy "Users can read their own aoc answers"
on public.aoc_answers
for select
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = aoc_answers.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can create aoc answers for their own courses"
on public.aoc_answers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.courses c
    where c.id = aoc_answers.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can update their own aoc answers"
on public.aoc_answers
for update
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = aoc_answers.course_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.courses c
    where c.id = aoc_answers.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can delete their own aoc answers"
on public.aoc_answers
for delete
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = aoc_answers.course_id
      and c.user_id = auth.uid()
  )
);
