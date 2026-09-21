create table if not exists public.material_processing_jobs (
  id uuid default uuid_generate_v4() primary key,
  material_id uuid not null unique references public.materials(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'queued',
  attempts integer not null default 0,
  last_error text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create index if not exists material_processing_jobs_status_created_at_idx
  on public.material_processing_jobs (status, created_at);

create index if not exists material_processing_jobs_course_id_idx
  on public.material_processing_jobs (course_id);
