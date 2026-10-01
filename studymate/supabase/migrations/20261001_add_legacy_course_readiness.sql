-- Preserve existing courses; null lets the report calculate readiness from saved activity.
begin;
alter table public.courses add column if not exists readiness_score integer;
notify pgrst, 'reload schema';
commit;
