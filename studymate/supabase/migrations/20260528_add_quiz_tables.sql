create extension if not exists "uuid-ossp";

create table if not exists public.quiz_questions (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid not null references public.courses(id) on delete cascade,
  quiz_session_id uuid not null,
  type text not null,
  question text not null,
  options jsonb,
  correct_answer text,
  explanation text,
  model_answer text,
  key_points text[] not null default '{}',
  marks integer not null default 1,
  topic text,
  source_material text,
  created_at timestamp with time zone default now()
);

create index if not exists quiz_questions_course_id_idx
  on public.quiz_questions (course_id);

create index if not exists quiz_questions_session_id_idx
  on public.quiz_questions (quiz_session_id);

create index if not exists quiz_questions_type_idx
  on public.quiz_questions (type);

alter table public.quiz_questions enable row level security;

drop policy if exists "Users can read their own quiz questions" on public.quiz_questions;
drop policy if exists "Users can create quiz questions for their own courses" on public.quiz_questions;
drop policy if exists "Users can update their own quiz questions" on public.quiz_questions;
drop policy if exists "Users can delete their own quiz questions" on public.quiz_questions;

create policy "Users can read their own quiz questions"
on public.quiz_questions
for select
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = quiz_questions.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can create quiz questions for their own courses"
on public.quiz_questions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.courses c
    where c.id = quiz_questions.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can update their own quiz questions"
on public.quiz_questions
for update
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = quiz_questions.course_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.courses c
    where c.id = quiz_questions.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can delete their own quiz questions"
on public.quiz_questions
for delete
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = quiz_questions.course_id
      and c.user_id = auth.uid()
  )
);

create table if not exists public.quiz_attempts (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid not null references public.courses(id) on delete cascade,
  quiz_session_id uuid not null,
  quiz_type text not null,
  question_count integer not null,
  score integer not null default 0,
  max_score integer not null default 0,
  percentage numeric not null default 0,
  grade text not null default 'F',
  feedback text,
  strengths text[] not null default '{}',
  improvements text[] not null default '{}',
  key_points_covered text[] not null default '{}',
  key_points_missed text[] not null default '{}',
  questions_snapshot jsonb not null default '[]'::jsonb,
  answers_snapshot jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

create index if not exists quiz_attempts_course_id_idx
  on public.quiz_attempts (course_id);

create index if not exists quiz_attempts_session_id_idx
  on public.quiz_attempts (quiz_session_id);

create index if not exists quiz_attempts_created_at_idx
  on public.quiz_attempts (created_at desc);

alter table public.quiz_attempts enable row level security;

drop policy if exists "Users can read their own quiz attempts" on public.quiz_attempts;
drop policy if exists "Users can create quiz attempts for their own courses" on public.quiz_attempts;
drop policy if exists "Users can update their own quiz attempts" on public.quiz_attempts;
drop policy if exists "Users can delete their own quiz attempts" on public.quiz_attempts;

create policy "Users can read their own quiz attempts"
on public.quiz_attempts
for select
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = quiz_attempts.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can create quiz attempts for their own courses"
on public.quiz_attempts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.courses c
    where c.id = quiz_attempts.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can update their own quiz attempts"
on public.quiz_attempts
for update
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = quiz_attempts.course_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.courses c
    where c.id = quiz_attempts.course_id
      and c.user_id = auth.uid()
  )
);

create policy "Users can delete their own quiz attempts"
on public.quiz_attempts
for delete
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = quiz_attempts.course_id
      and c.user_id = auth.uid()
  )
);
