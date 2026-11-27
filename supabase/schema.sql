-- FKBC Coaches Console – live database (Supabase / Postgres)
-- Security model: devices sign in anonymously, then prove they know the club code with claim_membership().
-- The server checks the code (bcrypt) – it is never stored in the app. Every table is row-level-secured so only
-- members can read/write; admin actions need claim_admin(). Run once; safe to re-run.

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table if not exists private.club_config (key text primary key, value text not null);
create table if not exists private.claim_attempts (id bigserial primary key, uid uuid, ok boolean not null, at timestamptz not null default now());
create index if not exists claim_attempts_at on private.claim_attempts (at);

-- ---------- members ----------
create table if not exists public.members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  coach_id text not null check (coach_id in ('joe','jack','paul','bigjohn','justin','gracie','john','eden')),
  admin_until timestamptz,
  joined_at timestamptz not null default now()
);
alter table public.members enable row level security;

create or replace function private.my_coach() returns text language sql stable security definer set search_path = public as
$$ select coach_id from public.members where user_id = auth.uid() $$;
create or replace function private.is_member() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.members where user_id = auth.uid()) $$;
create or replace function private.is_admin() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.members where user_id = auth.uid() and admin_until > now()) $$;
create or replace function private.room_ok(p_room text) returns boolean language sql stable security definer set search_path = public as
$$ select p_room = 'all' or (private.my_coach() is not null and private.my_coach() = any ((string_to_array(p_room, ':'))[2:3])) $$;
revoke all on function private.my_coach(), private.is_member(), private.is_admin(), private.room_ok(text) from public, anon;
grant execute on function private.my_coach(), private.is_member(), private.is_admin(), private.room_ok(text) to authenticated;

drop policy if exists members_read on public.members;
create policy members_read on public.members for select to authenticated using (private.is_member());
grant select on public.members to authenticated;

-- ---------- joining with the club code ----------
create or replace function public.claim_membership(p_code text, p_coach text) returns jsonb
language plpgsql security definer set search_path = public, private, extensions as $$
declare v_uid uuid := auth.uid(); v_hash text; v_user int; v_all int;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'not_signed_in'); end if;
  if p_coach not in ('joe','jack','paul','bigjohn','justin','gracie','john','eden') then return jsonb_build_object('ok', false, 'error', 'bad_coach'); end if;
  select count(*) into v_user from private.claim_attempts where uid = v_uid and not ok and at > now() - interval '10 minutes';
  select count(*) into v_all  from private.claim_attempts where not ok and at > now() - interval '10 minutes';
  if v_user >= 6 or v_all >= 200 then return jsonb_build_object('ok', false, 'error', 'too_many_attempts'); end if;
  select value into v_hash from private.club_config where key = 'access_hash';
  if v_hash is null or extensions.crypt(upper(trim(coalesce(p_code, ''))), v_hash) <> v_hash then
    insert into private.claim_attempts (uid, ok) values (v_uid, false);
    return jsonb_build_object('ok', false, 'error', 'bad_code');
  end if;
  insert into private.claim_attempts (uid, ok) values (v_uid, true);
  insert into public.members (user_id, coach_id) values (v_uid, p_coach)
    on conflict (user_id) do update set coach_id = excluded.coach_id;
  return jsonb_build_object('ok', true, 'coach', p_coach);
end $$;

create or replace function public.claim_admin(p_code text) returns jsonb
language plpgsql security definer set search_path = public, private, extensions as $$
declare v_uid uuid := auth.uid(); v_hash text; v_user int; v_all int;
begin
  if v_uid is null or not private.is_member() then return jsonb_build_object('ok', false, 'error', 'not_a_member'); end if;
  select count(*) into v_user from private.claim_attempts where uid = v_uid and not ok and at > now() - interval '10 minutes';
  select count(*) into v_all  from private.claim_attempts where not ok and at > now() - interval '10 minutes';
  if v_user >= 6 or v_all >= 200 then return jsonb_build_object('ok', false, 'error', 'too_many_attempts'); end if;
  select value into v_hash from private.club_config where key = 'admin_hash';
  if v_hash is null or extensions.crypt(upper(trim(coalesce(p_code, ''))), v_hash) <> v_hash then
    insert into private.claim_attempts (uid, ok) values (v_uid, false);
    return jsonb_build_object('ok', false, 'error', 'bad_code');
  end if;
  insert into private.claim_attempts (uid, ok) values (v_uid, true);
  update public.members set admin_until = now() + interval '30 minutes' where user_id = v_uid;
  return jsonb_build_object('ok', true, 'minutes', 30);
end $$;
revoke all on function public.claim_membership(text, text), public.claim_admin(text) from public, anon;
grant execute on function public.claim_membership(text, text), public.claim_admin(text) to authenticated;

-- ---------- generic updated_at trigger ----------
create or replace function private.touch() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if tg_table_name = 'lessons' then new.owner_uid := old.owner_uid; new.owner_coach := old.owner_coach; new.created_at := old.created_at; end if;
  if tg_table_name = 'timetable' and not private.is_admin() then new.data := jsonb_set(old.data, '{lesson}', coalesce(new.data -> 'lesson', 'null'::jsonb)); end if;
  if tg_table_name in ('timetable', 'club_library') then new.updated_by := private.my_coach(); end if;
  return new;
end $$;

-- ---------- chat ----------
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  room text not null check (room = 'all' or room ~ '^p:[a-z]+:[a-z]+$'),
  coach_id text not null default private.my_coach(),
  body text not null check (char_length(body) between 1 and 2000),
  client_id text check (char_length(client_id) <= 64),
  created_at timestamptz not null default now()
);
create index if not exists messages_room_time on public.messages (room, created_at);
create unique index if not exists messages_client_once on public.messages (coach_id, client_id) where client_id is not null;
alter table public.messages enable row level security;
drop policy if exists msg_read on public.messages;
drop policy if exists msg_write on public.messages;
drop policy if exists msg_admin_delete on public.messages;
create policy msg_read on public.messages for select to authenticated using (private.is_member() and private.room_ok(room));
create policy msg_write on public.messages for insert to authenticated with check (private.is_member() and private.room_ok(room) and coach_id = private.my_coach());
create policy msg_admin_delete on public.messages for delete to authenticated using (private.is_admin());
grant select, insert, delete on public.messages to authenticated;

-- ---------- lessons (shared club library of saved lessons) ----------
create table if not exists public.lessons (
  id text primary key check (char_length(id) between 4 and 64),
  owner_uid uuid not null default auth.uid(),
  owner_coach text not null default private.my_coach(),
  name text not null default '',
  style text,
  duration integer,
  data jsonb not null,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.lessons enable row level security;
drop policy if exists les_read on public.lessons;
drop policy if exists les_insert on public.lessons;
drop policy if exists les_update on public.lessons;
drop policy if exists les_admin_delete on public.lessons;
create policy les_read on public.lessons for select to authenticated using (private.is_member());
create policy les_insert on public.lessons for insert to authenticated with check (private.is_member() and owner_uid = auth.uid() and owner_coach = private.my_coach());
create policy les_update on public.lessons for update to authenticated using (private.is_member() and (owner_coach = private.my_coach() or private.is_admin())) with check (private.is_member());
create policy les_admin_delete on public.lessons for delete to authenticated using (private.is_admin());
grant select, insert, update, delete on public.lessons to authenticated;
drop trigger if exists lessons_touch on public.lessons;
create trigger lessons_touch before update on public.lessons for each row execute function private.touch();

-- ---------- timetable ----------
create table if not exists public.timetable (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);
alter table public.timetable enable row level security;
drop policy if exists tt_read on public.timetable;
drop policy if exists tt_insert on public.timetable;
drop policy if exists tt_update on public.timetable;
drop policy if exists tt_delete on public.timetable;
create policy tt_read on public.timetable for select to authenticated using (private.is_member());
create policy tt_insert on public.timetable for insert to authenticated with check (private.is_admin());
create policy tt_update on public.timetable for update to authenticated
  using (private.is_member() and (private.is_admin() or private.my_coach() in (select jsonb_array_elements_text(data -> 'coaches'))))
  with check (private.is_member());
create policy tt_delete on public.timetable for delete to authenticated using (private.is_admin());
grant select, insert, update, delete on public.timetable to authenticated;
drop trigger if exists timetable_touch on public.timetable;
create trigger timetable_touch before update on public.timetable for each row execute function private.touch();

-- ---------- shared library additions ----------
create table if not exists public.club_library (
  id text primary key default 'main' check (id = 'main'),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);
alter table public.club_library enable row level security;
drop policy if exists lib_read on public.club_library;
drop policy if exists lib_insert on public.club_library;
drop policy if exists lib_update on public.club_library;
create policy lib_read on public.club_library for select to authenticated using (private.is_member());
create policy lib_insert on public.club_library for insert to authenticated with check (private.is_member());
create policy lib_update on public.club_library for update to authenticated using (private.is_member()) with check (private.is_member());
grant select, insert, update on public.club_library to authenticated;
drop trigger if exists library_touch on public.club_library;
create trigger library_touch before update on public.club_library for each row execute function private.touch();

-- ---------- nothing is readable without signing in ----------
revoke all on public.members, public.messages, public.lessons, public.timetable, public.club_library from anon;

-- ---------- live updates ----------
do $$ begin
  begin alter publication supabase_realtime add table public.messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.lessons; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.timetable; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.club_library; exception when duplicate_object then null; end;
end $$;

-- ---------- coach check-in ("who's down tonight") ----------
create table if not exists public.checkins (
  day date not null,
  session_id text not null check (char_length(session_id) between 1 and 64),
  coach_id text not null default private.my_coach(),
  start_time text not null check (start_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  created_at timestamptz not null default now(),
  primary key (day, session_id, coach_id)
);
alter table public.checkins enable row level security;
drop policy if exists ck_read on public.checkins;
drop policy if exists ck_insert on public.checkins;
drop policy if exists ck_delete on public.checkins;
-- you can only check YOURSELF in, only on the day, and only until the session starts (UK time)
create policy ck_read on public.checkins for select to authenticated using (private.is_member());
create policy ck_insert on public.checkins for insert to authenticated with check (
  private.is_member() and coach_id = private.my_coach()
  and day = (now() at time zone 'Europe/London')::date
  and (now() at time zone 'Europe/London')::time <= start_time::time);
create policy ck_delete on public.checkins for delete to authenticated using (
  private.is_member() and (coach_id = private.my_coach() or private.is_admin())
  and day >= (now() at time zone 'Europe/London')::date);
grant select, insert, delete on public.checkins to authenticated;
revoke all on public.checkins from anon;
do $$ begin
  begin alter publication supabase_realtime add table public.checkins; exception when duplicate_object then null; end;
end $$;

-- ---------- coach profile details (belt / grade, qualifications, short bio) ----------
create table if not exists public.coach_profiles (
  coach_id text primary key check (char_length(coach_id) between 1 and 32),
  belt text not null default '' check (char_length(belt) <= 40),
  quals text not null default '' check (char_length(quals) <= 200),
  bio text not null default '' check (char_length(bio) <= 400),
  updated_at timestamptz not null default now()
);
alter table public.coach_profiles enable row level security;
drop policy if exists cp_read on public.coach_profiles;
drop policy if exists cp_insert on public.coach_profiles;
drop policy if exists cp_update on public.coach_profiles;
create policy cp_read on public.coach_profiles for select to authenticated using (private.is_member());
-- you edit your own card; an admin can edit anyone's
create policy cp_insert on public.coach_profiles for insert to authenticated with check (private.is_member() and (coach_id = private.my_coach() or private.is_admin()));
create policy cp_update on public.coach_profiles for update to authenticated using (private.is_member() and (coach_id = private.my_coach() or private.is_admin())) with check (private.is_member() and (coach_id = private.my_coach() or private.is_admin()));
grant select, insert, update on public.coach_profiles to authenticated;
revoke all on public.coach_profiles from anon;
do $$ begin
  begin alter publication supabase_realtime add table public.coach_profiles; exception when duplicate_object then null; end;
end $$;
