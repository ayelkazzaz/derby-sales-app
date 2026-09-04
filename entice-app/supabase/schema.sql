-- ============================================================
-- ENTICE — COUPLE OS: SUPABASE SCHEMA
-- Run this once, in full, in the Supabase SQL Editor on a
-- fresh project. Supabase Auth (email/password) is enabled by
-- default on every new project — nothing to configure there.
--
-- This has been written carefully but NOT executed against a
-- live Postgres instance. When you (or Claude Code) run it for
-- real, fix any small syntax issues that surface — that's a
-- normal part of standing this up, not a sign anything upstream
-- was wrong.
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- PROFILES, COUPLES, MEMBERSHIP
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;

create table couples (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'waiting' check (status in ('waiting','paired','disbanded')),
  created_at timestamptz not null default now(),
  paired_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table couples enable row level security;

create table couple_members (
  couple_id uuid not null references couples(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('A','B')),
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id),
  unique (couple_id, role)
);
alter table couple_members enable row level security;

-- Helper used throughout: is the current user a member of this couple?
create or replace function is_couple_member(p_couple_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from couple_members
    where couple_id = p_couple_id and user_id = auth.uid()
  );
$$;

-- Generic trigger: bump couples.updated_at whenever couple-scoped
-- data changes, so clients can subscribe to ONE realtime channel
-- per couple and refetch whatever they need, rather than exposing
-- raw row payloads for privacy-sensitive tables over realtime.
create or replace function touch_couple() returns trigger
language plpgsql as $$
begin
  update couples set updated_at = now() where id = coalesce(new.couple_id, old.couple_id);
  return coalesce(new, old);
end;
$$;

create policy "profiles_select_self_or_partner" on profiles for select
  using (
    id = auth.uid()
    or id in (
      select cm2.user_id from couple_members cm1
      join couple_members cm2 on cm2.couple_id = cm1.couple_id
      where cm1.user_id = auth.uid()
    )
  );
create policy "profiles_update_self" on profiles for update using (id = auth.uid());
create policy "profiles_insert_self" on profiles for insert with check (id = auth.uid());

create policy "couples_select_members" on couples for select using (is_couple_member(id));

create policy "couple_members_select" on couple_members for select
  using (couple_id in (select couple_id from couple_members where user_id = auth.uid()));

create trigger trg_touch_members after insert or update on couple_members
  for each row execute function touch_couple();

-- ============================================================
-- PAIRING (invite codes)
-- ============================================================

create table pairing_invites (
  code text primary key,
  couple_id uuid not null references couples(id) on delete cascade,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);
alter table pairing_invites enable row level security;
create policy "invites_select_authenticated" on pairing_invites for select using (auth.uid() is not null);

-- Creates a couple space + a fresh 6-character invite code, atomically.
create or replace function create_couple_space()
returns table (couple_id uuid, invite_code text, expires_at timestamptz)
language plpgsql security definer as $$
declare
  v_couple_id uuid;
  v_code text;
  v_expires timestamptz := now() + interval '24 hours';
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_attempt int := 0;
begin
  insert into couples (status) values ('waiting') returning id into v_couple_id;
  insert into couple_members (couple_id, user_id, role) values (v_couple_id, auth.uid(), 'A');

  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(v_chars, (floor(random() * length(v_chars)) + 1)::int, 1);
    end loop;
    begin
      insert into pairing_invites (code, couple_id, created_by, expires_at)
        values (v_code, v_couple_id, auth.uid(), v_expires);
      exit;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt > 5 then raise exception 'Could not generate a unique code'; end if;
    end;
  end loop;

  return query select v_couple_id, v_code, v_expires;
end;
$$;

-- Validates + redeems a code, atomically. Raises 'invalid_code' /
-- 'expired_code' / 'already_used' so the client can show the right message.
create or replace function redeem_invite(p_code text)
returns uuid
language plpgsql security definer as $$
declare
  v_invite pairing_invites%rowtype;
begin
  select * into v_invite from pairing_invites where code = upper(p_code);
  if not found then raise exception 'invalid_code'; end if;
  if v_invite.expires_at < now() then raise exception 'expired_code'; end if;
  if v_invite.used_at is not null then raise exception 'already_used'; end if;
  if exists (select 1 from couple_members where couple_id = v_invite.couple_id and role = 'B') then
    raise exception 'already_used';
  end if;

  insert into couple_members (couple_id, user_id, role) values (v_invite.couple_id, auth.uid(), 'B');
  update couples set status = 'paired', paired_at = now(), updated_at = now() where id = v_invite.couple_id;
  update pairing_invites set used_at = now() where code = v_invite.code;

  return v_invite.couple_id;
end;
$$;

create or replace function leave_couple_space(p_couple_id uuid)
returns void language plpgsql security definer as $$
begin
  if not is_couple_member(p_couple_id) then raise exception 'not_a_member'; end if;
  update couples set status = 'disbanded', updated_at = now() where id = p_couple_id;
end;
$$;

-- ============================================================
-- MOOD PULSE
-- ============================================================

create table moods (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  user_id uuid not null references profiles(id),
  mood text not null check (mood in ('connected','good','neutral','distant','tense')),
  note text,
  note_privacy text not null default 'private' check (note_privacy in ('private','shared')),
  created_at timestamptz not null default now()
);
alter table moods enable row level security;
create policy "moods_select" on moods for select
  using (is_couple_member(couple_id) and (note_privacy = 'shared' or user_id = auth.uid()));
create policy "moods_insert_self" on moods for insert
  with check (is_couple_member(couple_id) and user_id = auth.uid());
create trigger trg_touch_moods after insert on moods for each row execute function touch_couple();

-- ============================================================
-- CONSENT SETTINGS (After Dark requires BOTH partners' confirmation)
-- ============================================================

create table consent_settings (
  couple_id uuid primary key references couples(id) on delete cascade,
  spicy boolean not null default false,
  bold boolean not null default false,
  after_dark_confirmed_a boolean not null default false,
  after_dark_confirmed_b boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table consent_settings enable row level security;
create policy "consent_all" on consent_settings for all
  using (is_couple_member(couple_id)) with check (is_couple_member(couple_id));
create trigger trg_touch_consent after insert or update on consent_settings
  for each row execute function touch_couple();
-- Client computes: after_dark_enabled = after_dark_confirmed_a AND after_dark_confirmed_b

-- ============================================================
-- COUPLE DNA — raw answers are NEVER selectable by a partner.
-- Only get_dna_view() can read across both rows, and it never
-- reveals which role picked which value beyond "mine vs partner's".
-- ============================================================

create table dna_answers (
  user_id uuid not null references profiles(id),
  couple_id uuid not null references couples(id) on delete cascade,
  connection text, stress text, conflict text, play text, desire text, dream text,
  updated_at timestamptz not null default now(),
  primary key (user_id, couple_id)
);
alter table dna_answers enable row level security;
create policy "dna_select_own_only" on dna_answers for select using (user_id = auth.uid());
create policy "dna_upsert_own" on dna_answers for all
  using (user_id = auth.uid() and is_couple_member(couple_id)) with check (user_id = auth.uid());
create trigger trg_touch_dna after insert or update on dna_answers
  for each row execute function touch_couple();

create or replace function get_dna_view(p_couple_id uuid)
returns table (dimension text, my_value text, partner_value text)
language plpgsql security definer as $$
declare
  v_my_id uuid := auth.uid();
  v_partner_id uuid;
  v_mine dna_answers%rowtype;
  v_theirs dna_answers%rowtype;
begin
  if not is_couple_member(p_couple_id) then raise exception 'not_a_member'; end if;
  select user_id into v_partner_id from couple_members
    where couple_id = p_couple_id and user_id != v_my_id limit 1;

  select * into v_mine from dna_answers where couple_id = p_couple_id and user_id = v_my_id;
  select * into v_theirs from dna_answers where couple_id = p_couple_id and user_id = v_partner_id;

  return query
    select d.key, d.mine, d.theirs
    from (values
      ('connection', v_mine.connection, v_theirs.connection),
      ('stress', v_mine.stress, v_theirs.stress),
      ('conflict', v_mine.conflict, v_theirs.conflict),
      ('play', v_mine.play, v_theirs.play),
      ('desire', v_mine.desire, v_theirs.desire)
    ) as d(key, mine, theirs);
end;
$$;
-- Note: 'dream' is intentionally excluded — it stays fully private,
-- matching the prototype, since the spec treats it as share-if-you-choose.

-- ============================================================
-- SECRET MATCH — one-sided picks are never selectable by a partner.
-- ============================================================

create table secret_selections (
  user_id uuid not null references profiles(id),
  couple_id uuid not null references couples(id) on delete cascade,
  option_key text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, couple_id, option_key)
);
alter table secret_selections enable row level security;
create policy "secret_select_own" on secret_selections for select using (user_id = auth.uid());
create policy "secret_insert_own" on secret_selections for insert
  with check (user_id = auth.uid() and is_couple_member(couple_id));
create policy "secret_delete_own" on secret_selections for delete using (user_id = auth.uid());
create trigger trg_touch_secret after insert or delete on secret_selections
  for each row execute function touch_couple();

create or replace function get_secret_matches(p_couple_id uuid)
returns table (option_key text)
language sql security definer as $$
  select a.option_key from secret_selections a
  join secret_selections b on a.option_key = b.option_key and a.couple_id = b.couple_id and a.user_id != b.user_id
  where a.couple_id = p_couple_id
  and a.couple_id in (select couple_id from couple_members where user_id = auth.uid());
$$;

-- ============================================================
-- REPAIR MODE — unshared fields are nulled out server-side.
-- ============================================================

create table repair_sessions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  action text, action_set_at timestamptz, follow_up_at timestamptz, follow_up_result text,
  created_at timestamptz not null default now()
);
alter table repair_sessions enable row level security;
create policy "repair_sessions_all" on repair_sessions for all
  using (is_couple_member(couple_id)) with check (is_couple_member(couple_id));
create trigger trg_touch_repair_sessions after insert or update on repair_sessions
  for each row execute function touch_couple();

create table repair_entries (
  session_id uuid not null references repair_sessions(id) on delete cascade,
  couple_id uuid not null references couples(id) on delete cascade,
  user_id uuid not null references profiles(id),
  what text, felt text, needed text,
  share_what boolean not null default false,
  share_felt boolean not null default false,
  share_needed boolean not null default false,
  submitted_at timestamptz,
  primary key (session_id, user_id)
);
alter table repair_entries enable row level security;
create policy "repair_entries_select_own" on repair_entries for select using (user_id = auth.uid());
create policy "repair_entries_upsert_own" on repair_entries for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger trg_touch_repair_entries after insert or update on repair_entries
  for each row execute function touch_couple();

create or replace function get_repair_reflection(p_session_id uuid)
returns table (is_me boolean, what text, felt text, needed text, submitted_at timestamptz)
language plpgsql security definer as $$
declare v_couple_id uuid;
begin
  select couple_id into v_couple_id from repair_sessions where id = p_session_id;
  if not is_couple_member(v_couple_id) then raise exception 'not_a_member'; end if;

  return query
    select (user_id = auth.uid()),
      case when user_id = auth.uid() or share_what then what else null end,
      case when user_id = auth.uid() or share_felt then felt else null end,
      case when user_id = auth.uid() or share_needed then needed else null end,
      submitted_at
    from repair_entries where session_id = p_session_id;
end;
$$;

-- ============================================================
-- EVERYTHING ELSE — couple-scoped, no cross-partner privacy split
-- ============================================================

create table game_completions (
  couple_id uuid not null references couples(id) on delete cascade,
  game_key text not null,
  completed_at timestamptz not null default now(),
  primary key (couple_id, game_key)
);
alter table game_completions enable row level security;
create policy "games_all" on game_completions for all
  using (is_couple_member(couple_id)) with check (is_couple_member(couple_id));
create trigger trg_touch_games after insert on game_completions for each row execute function touch_couple();

create table achievements (
  couple_id uuid not null references couples(id) on delete cascade,
  key text not null,
  unlocked_at timestamptz not null default now(),
  primary key (couple_id, key)
);
alter table achievements enable row level security;
create policy "achievements_select" on achievements for select using (is_couple_member(couple_id));
create policy "achievements_insert" on achievements for insert with check (is_couple_member(couple_id));
create trigger trg_touch_achievements after insert on achievements for each row execute function touch_couple();

create table daily_progress (
  couple_id uuid primary key references couples(id) on delete cascade,
  last_date date,
  streak int not null default 0
);
alter table daily_progress enable row level security;
create policy "daily_all" on daily_progress for all
  using (is_couple_member(couple_id)) with check (is_couple_member(couple_id));
create trigger trg_touch_daily after insert or update on daily_progress for each row execute function touch_couple();

create table dreams (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  created_by uuid not null references profiles(id),
  title text not null, category text, description text, first_step text,
  status text not null default 'Idea' check (status in ('Idea','Planning','In progress','Achieved','Archived')),
  created_at timestamptz not null default now()
);
alter table dreams enable row level security;
create policy "dreams_all" on dreams for all
  using (is_couple_member(couple_id)) with check (is_couple_member(couple_id));
create trigger trg_touch_dreams after insert or update on dreams for each row execute function touch_couple();

create table vault_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  created_by uuid not null references profiles(id),
  title text not null, body text, type text,
  visibility text not null default 'shared' check (visibility in ('shared','private')),
  created_at timestamptz not null default now()
);
alter table vault_items enable row level security;
create policy "vault_select" on vault_items for select
  using (is_couple_member(couple_id) and (visibility = 'shared' or created_by = auth.uid()));
create policy "vault_insert" on vault_items for insert
  with check (is_couple_member(couple_id) and created_by = auth.uid());
create policy "vault_delete_own" on vault_items for delete using (created_by = auth.uid());
create trigger trg_touch_vault after insert on vault_items for each row execute function touch_couple();

create table challenge_progress (
  couple_id uuid not null references couples(id) on delete cascade,
  mission_id text not null,
  status text not null check (status in ('saved','completed')),
  reflection text,
  updated_at timestamptz not null default now(),
  primary key (couple_id, mission_id, status)
);
alter table challenge_progress enable row level security;
create policy "challenge_all" on challenge_progress for all
  using (is_couple_member(couple_id)) with check (is_couple_member(couple_id));
create trigger trg_touch_challenge after insert on challenge_progress for each row execute function touch_couple();

create table enticeus_progress (
  couple_id uuid not null references couples(id) on delete cascade,
  mission_id text not null,
  status text not null check (status in ('saved','completed')),
  updated_at timestamptz not null default now(),
  primary key (couple_id, mission_id, status)
);
alter table enticeus_progress enable row level security;
create policy "enticeus_all" on enticeus_progress for all
  using (is_couple_member(couple_id)) with check (is_couple_member(couple_id));
create trigger trg_touch_enticeus after insert on enticeus_progress for each row execute function touch_couple();

-- ============================================================
-- REALTIME
-- In the Supabase dashboard (Database > Replication), enable
-- realtime on: couples. That single table is enough — every
-- trigger above bumps its updated_at, so subscribing to ONE
-- channel per couple tells the client "something changed, go
-- refetch" without ever broadcasting privacy-sensitive row
-- content directly.
-- ============================================================
