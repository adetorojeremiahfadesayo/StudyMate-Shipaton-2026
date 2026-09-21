alter table public.courses
add column if not exists readiness_score integer not null default 0;

update public.courses
set readiness_score = coalesce(readiness_score, 0);

