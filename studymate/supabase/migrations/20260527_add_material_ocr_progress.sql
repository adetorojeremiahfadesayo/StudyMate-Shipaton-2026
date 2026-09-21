alter table if exists public.materials
add column if not exists ocr_progress integer not null default 0;

update public.materials
set ocr_progress = case
  when ocr_status = 'complete' then 100
  when ocr_status = 'processing' then greatest(coalesce(ocr_progress, 0), 35)
  when ocr_status = 'failed' then 100
  else coalesce(ocr_progress, 0)
end;
