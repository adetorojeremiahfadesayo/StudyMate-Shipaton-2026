begin;
alter table public.courses add column if not exists archived_at timestamptz;
alter table public.quiz_attempts add column if not exists server_verified boolean not null default false;
revoke insert,update,delete on public.quiz_questions from authenticated,anon;
create function public.study_protect_verified_attempt() returns trigger language plpgsql as $$
begin
  if current_user<>'service_role' and (new.server_verified or (tg_op='UPDATE' and old.server_verified)) then raise exception 'SERVER_VERIFIED_ATTEMPT'; end if;
  return new;
end $$;
create trigger study_protect_verified_attempt before insert or update on public.quiz_attempts for each row execute function public.study_protect_verified_attempt();

create table public.study_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro','school')),
  verified_until timestamptz not null default now(),
  credits integer not null default 0
);
create table public.schools (
  id uuid primary key default gen_random_uuid(), name text not null,
  owner_id uuid not null references auth.users(id),
  status text not null default 'pilot' check (status in ('pilot','licensed','suspended')),
  expires_at timestamptz not null default now() + interval '30 days',
  seat_limit integer not null default 25 check (seat_limit between 1 and 10000),
  monthly_pool integer not null default 300 check (monthly_pool > 0),
  created_at timestamptz not null default now()
);
create table public.school_pilot_claims (user_id uuid primary key references auth.users(id), created_at timestamptz not null default now());
create table public.school_members (
  school_id uuid references public.schools(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','teacher','student')),
  display_name text not null default 'Student',
  active boolean not null default true, primary key(school_id,user_id)
);
create table public.school_classes (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete cascade,
  name text not null, teacher_id uuid not null references auth.users(id)
);
create table public.school_class_members (
  class_id uuid references public.school_classes(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade, primary key(class_id,user_id)
);
create table public.school_invites (
  token_hash text primary key, school_id uuid not null references public.schools(id) on delete cascade,
  email text not null, role text not null check(role in ('teacher','student')),
  class_id uuid references public.school_classes(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '7 days', accepted_by uuid references auth.users(id)
);
create table public.school_assignments (
  id uuid primary key default gen_random_uuid(), class_id uuid not null references public.school_classes(id) on delete cascade,
  title text not null, topic text not null, target_minutes integer not null check(target_minutes between 1 and 120),
  due_at timestamptz, created_at timestamptz not null default now()
);
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null, topic text not null default '',
  request_key text not null, period date not null default date_trunc('month',now() at time zone 'UTC')::date,
  plan text not null check(plan in ('free','pro','school')),
  school_id uuid references public.schools(id) on delete set null,
  assignment_id uuid references public.school_assignments(id) on delete set null,
  source text not null check(source in ('included','credit','school')),
  status text not null default 'reserved' check(status in ('reserved','active','completed','released')),
  created_at timestamptz not null default now(), expires_at timestamptz not null default now() + interval '15 minutes',
  unique(user_id,request_key)
);
create index study_sessions_usage_idx on public.study_sessions(user_id,period,status);
create index study_sessions_pool_idx on public.study_sessions(school_id,period,status);
create table public.study_operations (
  session_id uuid references public.study_sessions(id) on delete cascade,
  operation text not null, input_hash text not null, token uuid not null default gen_random_uuid(),
  status text not null default 'processing' check(status in ('processing','complete','failed')),
  result jsonb, lease_until timestamptz not null default now() + interval '10 minutes',
  primary key(session_id,operation)
);
create table public.study_credit_purchases (
  transaction_key text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null, state text not null check(state in ('granted','refunded')),
  units integer not null check(units > 0), environment text not null, created_at timestamptz not null default now()
);
create table public.study_credit_ledger (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  reference text not null unique, delta integer not null, reason text not null, created_at timestamptz not null default now()
);
create table public.study_billing_events (id text primary key, type text not null, processed_at timestamptz not null default now());
create table public.school_runs (
  id uuid primary key default gen_random_uuid(), assignment_id uuid not null references public.school_assignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null unique references public.study_sessions(id) on delete cascade,
  state text not null default 'paused' check(state in ('active','paused','completed')),
  active_seconds integer not null default 0, last_seen timestamptz not null default now(),
  last_sequence bigint not null default -1, pause_reason text, started_at timestamptz not null default now(), ended_at timestamptz,
  unique(assignment_id,user_id)
);

-- All commercial and school records are exposed through authenticated, scoped APIs.
-- No client can directly mint credits, change plans, seats or timer totals.
do $$ declare t text; begin
  foreach t in array array['study_accounts','schools','school_pilot_claims','school_members','school_classes','school_class_members','school_invites','school_assignments','study_sessions','study_operations','study_credit_purchases','study_credit_ledger','study_billing_events','school_runs'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;

create function public.study_course_limit() returns trigger language plpgsql security definer set search_path=public as $$
declare cap integer; begin
  if tg_op='UPDATE' and new.user_id<>old.user_id then raise exception 'Course ownership cannot be transferred'; end if;
  if new.archived_at is not null then return new; end if;
  if tg_op='UPDATE' and old.archived_at is null then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text,0));
  select case when plan in ('pro','school') and verified_until>now() then 5 else 1 end into cap from study_accounts where user_id=new.user_id;
  cap:=coalesce(cap,1);
  if (select count(*) from courses where user_id=new.user_id and archived_at is null and id<>new.id)>=cap then
    raise exception 'COURSE_LIMIT';
  end if;
  return new;
end $$;
create trigger study_course_limit before insert or update of archived_at,user_id on public.courses for each row execute function public.study_course_limit();

create function public.study_reserve(p_user uuid,p_course uuid,p_key text,p_topic text,p_school uuid default null,p_assignment uuid default null)
returns jsonb language plpgsql set search_path=public as $$
declare s study_sessions; a study_accounts; org schools; lim integer; used integer; src text; pl text; stale record;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
  if not exists(select 1 from courses where id=p_course and user_id=p_user and archived_at is null) then raise exception 'COURSE_NOT_ACTIVE'; end if;
  insert into study_accounts(user_id) values(p_user) on conflict do nothing;
  select * into a from study_accounts where user_id=p_user for update;
  for stale in select * from study_sessions where user_id=p_user and status='reserved' and expires_at<now() loop
    update study_sessions set status='released' where id=stale.id;
    if stale.source='credit' then
      insert into study_credit_ledger(user_id,reference,delta,reason) values(p_user,'release:'||stale.id,1,'expired reservation') on conflict do nothing;
      update study_accounts set credits=credits+1 where user_id=p_user;
    end if;
  end loop;
  select * into s from study_sessions where user_id=p_user and request_key=p_key;
  if found then
    if s.course_id<>p_course or (p_topic<>'' and lower(s.topic)<>lower(p_topic)) or s.assignment_id is distinct from p_assignment then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
    if s.status='released' then raise exception 'SESSION_RELEASED'; end if;
    return to_jsonb(s);
  end if;
  pl:=case when a.verified_until>now() and a.plan='pro' then 'pro' else 'free' end;
  if p_school is not null then
    select * into org from schools where id=p_school for update;
    if not found or org.status='suspended' or org.expires_at<=now() or not exists(select 1 from school_members where school_id=p_school and user_id=p_user and active) then raise exception 'SCHOOL_INACTIVE'; end if;
    pl:='school';
  end if;
  if p_assignment is not null and not exists(
    select 1 from school_assignments x join school_classes c on c.id=x.class_id join school_class_members m on m.class_id=c.id
    where x.id=p_assignment and c.school_id=p_school and m.user_id=p_user
  ) then raise exception 'ASSIGNMENT_FORBIDDEN'; end if;
  lim:=case when pl='free' then 3 else 30 end;
  select count(*) into used from study_sessions where user_id=p_user and period=date_trunc('month',now() at time zone 'UTC')::date and status in ('reserved','active','completed') and (status<>'reserved' or expires_at>now()) and source<>'credit';
  if used<lim and (pl<>'school' or (select count(*) from study_sessions where school_id=p_school and period=date_trunc('month',now() at time zone 'UTC')::date and status in ('reserved','active','completed') and (status<>'reserved' or expires_at>now()) and source='school')<org.monthly_pool) then
    src:=case when pl='school' then 'school' else 'included' end;
  else
    select * into a from study_accounts where user_id=p_user;
    if a.credits<=0 then raise exception 'SESSION_LIMIT'; end if;
    src:='credit'; update study_accounts set credits=credits-1 where user_id=p_user;
  end if;
  insert into study_sessions(user_id,course_id,request_key,topic,plan,school_id,assignment_id,source)
    values(p_user,p_course,p_key,p_topic,pl,p_school,p_assignment,src) returning * into s;
  if src='credit' then insert into study_credit_ledger(user_id,reference,delta,reason) values(p_user,'reserve:'||s.id,-1,'study session'); end if;
  if p_assignment is not null then
    if exists(select 1 from school_runs r join study_sessions previous on previous.id=r.session_id where r.assignment_id=p_assignment and r.user_id=p_user and r.state='completed') then raise exception 'ASSIGNMENT_COMPLETED'; end if;
    insert into school_runs(assignment_id,user_id,session_id) values(p_assignment,p_user,s.id)
    on conflict(assignment_id,user_id) do update set session_id=excluded.session_id,state='paused',last_seen=now()
      where not exists(select 1 from study_sessions previous where previous.id=school_runs.session_id and previous.status<>'released' and previous.expires_at>now());
    if not found then raise exception 'ASSIGNMENT_ALREADY_STARTED'; end if;
  end if;
  return to_jsonb(s);
end $$;

create function public.study_begin_operation(p_user uuid,p_session uuid,p_operation text,p_hash text,p_topic text default '')
returns jsonb language plpgsql set search_path=public as $$
declare s study_sessions; op study_operations;
begin
  select * into s from study_sessions where id=p_session and user_id=p_user for update;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;
  select * into op from study_operations where session_id=p_session and operation=p_operation;
  if found and op.status='complete' then
    if op.input_hash<>p_hash then raise exception 'OPERATION_CONFLICT'; end if;
    return jsonb_build_object('cached',true,'result',op.result);
  end if;
  if not exists(select 1 from courses where id=s.course_id and user_id=p_user and archived_at is null) then raise exception 'COURSE_NOT_ACTIVE'; end if;
  if (s.status not in ('reserved','active') and not(s.status='completed' and p_operation in ('retry_quiz','retry_feedback'))) or s.expires_at<=now() or s.period<>date_trunc('month',now() at time zone 'UTC')::date then raise exception 'SESSION_EXPIRED'; end if;
  if s.school_id is not null and not exists(select 1 from schools o join school_members m on m.school_id=o.id where o.id=s.school_id and o.expires_at>now() and o.status<>'suspended' and m.user_id=p_user and m.active) then raise exception 'SCHOOL_INACTIVE'; end if;
  if s.topic<>'' and p_topic<>'' and lower(s.topic)<>lower(p_topic) then raise exception 'TOPIC_CONFLICT'; end if;
  if s.topic='' and p_topic<>'' then update study_sessions set topic=p_topic where id=s.id; end if;
  if op.status='processing' and op.lease_until>now() then raise exception 'OPERATION_BUSY'; end if;
  if op.session_id is not null and op.input_hash<>p_hash then raise exception 'OPERATION_CONFLICT'; end if;
  insert into study_operations(session_id,operation,input_hash) values(p_session,p_operation,p_hash)
    on conflict(session_id,operation) do update set status='processing',token=gen_random_uuid(),lease_until=now()+interval '10 minutes'
    returning * into op;
  -- Keep an in-flight first generation reserved until its lease expires.
  if s.status='reserved' then update study_sessions set expires_at=greatest(expires_at,op.lease_until) where id=s.id; end if;
  return jsonb_build_object('cached',false,'token',op.token);
end $$;

create function public.study_finish_operation(p_user uuid,p_session uuid,p_operation text,p_token uuid,p_result jsonb,p_success boolean)
returns boolean language plpgsql set search_path=public as $$
declare s study_sessions; begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
  select * into s from study_sessions where id=p_session and user_id=p_user for update;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;
  update study_operations set status=case when p_success then 'complete' else 'failed' end,result=p_result
    where session_id=p_session and operation=p_operation and token=p_token and status='processing';
  if not found then raise exception 'OPERATION_LEASE_LOST'; end if;
  if p_success then
    update study_sessions set status=case when p_operation in ('feedback','retry_feedback') then 'completed' else 'active' end,expires_at=now()+interval '24 hours' where id=s.id and status<>'released';
  elsif s.status='reserved' and not exists(select 1 from study_operations where session_id=s.id and status in ('complete','processing')) then
    update study_sessions set status='released' where id=s.id;
    if s.source='credit' then
      insert into study_credit_ledger(user_id,reference,delta,reason) values(p_user,'release:'||s.id,1,'failed first generation') on conflict do nothing;
      if found then update study_accounts set credits=credits+1 where user_id=p_user; end if;
    end if;
  end if;
  return true;
end $$;

create function public.study_credit_event(p_event text,p_type text,p_user uuid,p_transaction text,p_product text,p_units integer,p_environment text,p_refund boolean)
returns boolean language plpgsql set search_path=public as $$
declare prior study_credit_purchases; delta integer:=0; begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
  -- Serialize the same transaction even if delivered under two account aliases.
  perform pg_advisory_xact_lock(hashtextextended(p_transaction,1));
  insert into study_billing_events(id,type) values(p_event,p_type) on conflict do nothing;
  if not found then return false; end if;
  select * into prior from study_credit_purchases where transaction_key=p_transaction for update;
  if found and prior.user_id<>p_user then raise exception 'TRANSACTION_OWNER_CONFLICT'; end if;
  if prior.transaction_key is null then
    insert into study_credit_purchases(transaction_key,user_id,product_id,units,environment,state)
      values(p_transaction,p_user,p_product,p_units,p_environment,case when p_refund then 'refunded' else 'granted' end);
    if not p_refund then delta:=p_units; end if;
  elsif p_refund and prior.state='granted' then
    update study_credit_purchases set state='refunded' where transaction_key=p_transaction; delta:=-prior.units;
  end if;
  if delta<>0 then
    insert into study_accounts(user_id,credits) values(p_user,delta) on conflict(user_id) do update set credits=study_accounts.credits+excluded.credits;
    insert into study_credit_ledger(user_id,reference,delta,reason) values(p_user,'event:'||p_event,delta,case when p_refund then 'purchase refund' else 'verified purchase' end);
  end if;
  return true;
end $$;

create function public.school_create_pilot(p_user uuid,p_name text) returns uuid language plpgsql set search_path=public as $$
declare sid uuid; begin
  if exists(select 1 from school_pilot_claims where user_id=p_user) then raise exception 'PILOT_ALREADY_CLAIMED'; end if;
  insert into school_pilot_claims(user_id) values(p_user); -- One lifetime pilot per approved owner.
  insert into schools(owner_id,name) values(p_user,p_name) returning id into sid;
  insert into school_members(school_id,user_id,role) values(sid,p_user,'admin');
  return sid;
end $$;

create function public.school_accept_invite(p_user uuid,p_email text,p_hash text) returns uuid language plpgsql set search_path=public as $$
declare inv school_invites; org schools; begin
  select * into inv from school_invites where token_hash=p_hash for update;
  if not found or inv.expires_at<=now() or lower(inv.email)<>lower(p_email) then raise exception 'INVITE_INVALID'; end if;
  if inv.accepted_by is not null then
    if inv.accepted_by=p_user then return inv.school_id; end if;
    raise exception 'INVITE_USED';
  end if;
  select * into org from schools where id=inv.school_id for update;
  if org.expires_at<=now() or org.status='suspended' then raise exception 'SCHOOL_INACTIVE'; end if;
  if not exists(select 1 from school_members where school_id=org.id and user_id=p_user and active) and (select count(*) from school_members where school_id=org.id and active)>=org.seat_limit then raise exception 'SEAT_LIMIT'; end if;
  insert into school_members(school_id,user_id,role,display_name) values(org.id,p_user,inv.role,p_email)
    on conflict(school_id,user_id) do update set active=true; -- An invite cannot overwrite an existing role.
  if inv.class_id is not null then insert into school_class_members(class_id,user_id) values(inv.class_id,p_user) on conflict do nothing; end if;
  update school_invites set accepted_by=p_user where token_hash=p_hash;
  return org.id;
end $$;

create function public.school_timer_event(p_user uuid,p_session uuid,p_sequence bigint,p_action text,p_reason text default null)
returns jsonb language plpgsql set search_path=public as $$
declare r school_runs; s study_sessions; target integer; elapsed integer; begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
  select * into s from study_sessions where id=p_session and user_id=p_user;
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;
  if not exists(select 1 from schools o join school_members m on m.school_id=o.id where o.id=s.school_id and o.expires_at>now() and o.status<>'suspended' and m.user_id=p_user and m.active) then raise exception 'SCHOOL_INACTIVE'; end if;
  select * into r from school_runs where session_id=p_session and user_id=p_user for update;
  if not found then raise exception 'ASSIGNMENT_NOT_FOUND'; end if;
  if p_sequence<=r.last_sequence or r.state='completed' then return to_jsonb(r); end if;
  if p_action<>'pause' and (s.status='released' or s.expires_at<=now()) then raise exception 'SESSION_EXPIRED'; end if;
  if p_action not in ('heartbeat','pause','finish') then raise exception 'TIMER_ACTION_INVALID'; end if;
  if p_action='pause' and coalesce(length(trim(p_reason)),0)=0 then raise exception 'PAUSE_REASON_REQUIRED'; end if;
  if p_action='heartbeat' and exists(select 1 from school_runs where user_id=p_user and id<>r.id and state='active' and last_seen>now()-interval '45 seconds') then raise exception 'TIMER_ALREADY_ACTIVE'; end if;
  elapsed:=case when r.state='active' then least(45,greatest(0,floor(extract(epoch from now()-r.last_seen))::integer)) else 0 end;
  select target_minutes*60 into target from school_assignments where id=r.assignment_id;
  if p_action='finish' and (r.active_seconds+elapsed<target or not exists(select 1 from study_operations where session_id=p_session and operation='feedback' and status='complete')) then raise exception 'ASSIGNMENT_INCOMPLETE'; end if;
  update school_runs set active_seconds=active_seconds+elapsed,last_sequence=p_sequence,last_seen=now(),
    state=case when p_action='heartbeat' then 'active' when p_action='finish' then 'completed' else 'paused' end,
    pause_reason=case when p_action='pause' then left(p_reason,200) else null end,
    ended_at=case when p_action='finish' then now() else null end where id=r.id returning * into r;
  return to_jsonb(r);
end $$;

-- Functions take trusted identities from the backend and must never be client-callable.
revoke all on function public.study_course_limit() from public,anon,authenticated;
revoke all on function public.study_reserve(uuid,uuid,text,text,uuid,uuid) from public,anon,authenticated;
revoke all on function public.study_begin_operation(uuid,uuid,text,text,text) from public,anon,authenticated;
revoke all on function public.study_finish_operation(uuid,uuid,text,uuid,jsonb,boolean) from public,anon,authenticated;
revoke all on function public.study_credit_event(text,text,uuid,text,text,integer,text,boolean) from public,anon,authenticated;
revoke all on function public.school_create_pilot(uuid,text) from public,anon,authenticated;
revoke all on function public.school_accept_invite(uuid,text,text) from public,anon,authenticated;
revoke all on function public.school_timer_event(uuid,uuid,bigint,text,text) from public,anon,authenticated;
grant execute on function public.study_reserve(uuid,uuid,text,text,uuid,uuid), public.study_begin_operation(uuid,uuid,text,text,text), public.study_finish_operation(uuid,uuid,text,uuid,jsonb,boolean), public.study_credit_event(text,text,uuid,text,text,integer,text,boolean), public.school_create_pilot(uuid,text), public.school_accept_invite(uuid,text,text), public.school_timer_event(uuid,uuid,bigint,text,text) to service_role;
notify pgrst,'reload schema';
commit;
