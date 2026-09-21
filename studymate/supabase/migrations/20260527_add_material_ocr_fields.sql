alter table materials add column if not exists file_size bigint;
alter table materials add column if not exists storage_path text;
alter table materials add column if not exists mime_type text;
alter table materials add column if not exists ocr_status text not null default 'pending';
alter table materials add column if not exists ocr_text text;
alter table materials add column if not exists error_message text;

create index if not exists idx_materials_course_id on materials (course_id);
create index if not exists idx_materials_ocr_status on materials (ocr_status);
