-- =====================================================================
--  LexDesk database schema (v2)
--  Run this whole file in Supabase Dashboard > SQL Editor.
--  Safe to run more than once, and safe to run on top of the v1 schema:
--  it never wipes data.
--
--  Roles:  super_admin (platform owner) > lawyer (firm owner) > junior (firm staff)
--          client (belongs to one firm)
--  Every rule that protects client confidentiality is enforced HERE
--  (row level security), not only in the app.
-- =====================================================================

-- ---------- Types & profiles ----------
do $$ begin
  create type public.user_role as enum ('super_admin', 'lawyer', 'client');
exception when duplicate_object then null;
end $$;

-- 'junior' = staff member of a firm. IMPORTANT: a freshly added enum value cannot be used
-- in the same transaction, so everywhere below compares role::text instead.
alter type public.user_role add value if not exists 'junior';

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        public.user_role not null,
  lawyer_id   uuid references public.profiles(id) on delete restrict, -- clients and juniors: the firm owner
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.profiles add column if not exists password_set_at timestamptz;
alter table public.profiles add column if not exists notify_email boolean not null default true;
alter table public.profiles add column if not exists mfa_enabled boolean not null default false;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists firm_name text;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;

-- clients and juniors must have a lawyer (their firm owner); lawyers/admins must not
alter table public.profiles drop constraint if exists client_needs_lawyer;
alter table public.profiles add constraint client_needs_lawyer
  check ((role::text in ('client', 'junior')) = (lawyer_id is not null));

update public.profiles p
set password_set_at = u.last_sign_in_at
from auth.users u
where u.id = p.id and u.last_sign_in_at is not null and p.password_set_at is null;

create index if not exists profiles_lawyer_id_idx on public.profiles(lawyer_id);
create index if not exists profiles_role_idx on public.profiles(role);
create unique index if not exists profiles_email_key on public.profiles(lower(email));

alter table public.profiles enable row level security;

-- Browser (authenticated) can only READ profiles; all writes go through server actions
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- ---------- Subscription tables (needed by the access helpers below) ----------
create table if not exists public.platform_settings (
  id                  int primary key default 1 check (id = 1),
  bank_name           text,
  account_title       text,
  account_number      text,
  iban                text,
  branch              text,
  payment_instructions text,
  support_whatsapp    text,
  support_email       text,
  trial_days          int not null default 14 check (trial_days between 0 and 90),
  grace_days          int not null default 5 check (grace_days between 0 and 60),
  updated_at          timestamptz not null default now()
);
insert into public.platform_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.subscriptions (
  firm_id            uuid primary key references public.profiles(id) on delete cascade,
  plan               text not null default 'starter',
  status             text not null default 'trial' check (status in ('trial', 'active', 'past_due', 'suspended', 'canceled')),
  trial_ends_at      timestamptz,
  current_period_end timestamptz,
  grace_days         int not null default 5 check (grace_days between 0 and 60),
  notes              text,
  last_reminder_at   timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
alter table public.subscriptions add column if not exists last_reminder_at timestamptz;

-- When does the current paid/trial period end? (null = never expires)
create or replace function public.sub_end(s public.subscriptions)
returns timestamptz language sql immutable as $$
  select case when s.status = 'trial' then s.trial_ends_at
              else coalesce(s.current_period_end, s.trial_ends_at) end
$$;

-- What state is the subscription REALLY in right now? (works even if the daily job never ran)
--   trial | active | past_due (inside the grace window, still usable) | suspended | canceled
create or replace function public.sub_effective(s public.subscriptions)
returns text language sql stable as $$
  select case
    when s.status in ('suspended', 'canceled') then s.status
    when public.sub_end(s) is null then case when s.status = 'past_due' then 'active' else s.status end
    when now() <= public.sub_end(s) then case when s.status = 'past_due' then 'active' else s.status end
    when now() <= public.sub_end(s) + make_interval(days => s.grace_days) then 'past_due'
    else 'suspended'
  end
$$;

-- ok = normal, grace = overdue but still usable (banner), locked = only the subscription page works
create or replace function public.firm_billing_state(p_firm uuid)
returns text
language sql stable security definer set search_path = public as $$
  select coalesce((
    select case public.sub_effective(s)
             when 'past_due' then 'grace'
             when 'suspended' then 'locked'
             when 'canceled' then 'locked'
             else 'ok' end
    from public.subscriptions s where s.firm_id = p_firm
  ), 'ok')
$$;

-- ---------- Firm settings (one row per firm, created automatically) ----------
-- firm_settings: shown on letters and invoices, readable by the firm and its clients
create table if not exists public.firm_settings (
  firm_id        uuid primary key references public.profiles(id) on delete cascade,
  firm_name      text,
  address        text,
  phone          text,
  email          text,
  ntn            text,
  bank_details   text,
  invoice_terms  text,
  letter_footer  text,
  updated_at     timestamptz not null default now()
);
-- firm_prefs: private to the firm's staff (rates, defaults, onboarding progress)
create table if not exists public.firm_prefs (
  firm_id           uuid primary key references public.profiles(id) on delete cascade,
  default_currency  text not null default 'PKR',
  hourly_rate_cents bigint not null default 0 check (hourly_rate_cents >= 0),
  default_due_days  int not null default 14 check (default_due_days between 0 and 365),
  onboarded_at      timestamptz,
  updated_at        timestamptz not null default now()
);

-- ---------- Helper functions (security definer = no recursive RLS) ----------
create or replace function public.auth_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- For clients and juniors: the firm owner. (Lawyers: null)
create or replace function public.auth_lawyer_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select lawyer_id from public.profiles where id = auth.uid()
$$;

-- The firm the caller WORKS FOR: lawyer -> themselves, junior -> their lawyer, everyone else -> null.
-- Use this (never auth_lawyer_id) to scope staff data, so a client can never match it.
create or replace function public.auth_staff_firm()
returns uuid
language sql stable security definer set search_path = public as $$
  select case when role::text = 'lawyer' then id
              when role::text = 'junior' then lawyer_id end
  from public.profiles where id = auth.uid()
$$;

create or replace function public.auth_is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role::text in ('lawyer', 'junior') from public.profiles where id = auth.uid()), false)
$$;

-- Two-factor: TRUE if the person has no verified authenticator app, or this session
-- already passed the 6-digit check (JWT claim aal2).
create or replace function public.mfa_ok()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors
                     where user_id = auth.uid() and status = 'verified')
$$;

-- Role + "is this account allowed in right now?"
--  my_active  : the account is on AND (for clients/juniors) the firm owner's account is on
--  my_mfa_ok  : false = password entered but the 2FA code is still needed
--  my_billing : ok | grace | locked  (the firm's subscription)
drop function if exists public.my_access();
create or replace function public.my_access()
returns table (my_role public.user_role, my_active boolean, my_mfa_ok boolean, my_billing text)
language sql stable security definer set search_path = public as $$
  select
    p.role,
    p.is_active and (
      p.role::text not in ('client', 'junior')
      or coalesce((select l.is_active from public.profiles l where l.id = p.lawyer_id), false)
    ),
    public.mfa_ok(),
    case when p.role::text = 'super_admin' then 'ok'
         else public.firm_billing_state(case when p.role::text = 'lawyer' then p.id else p.lawyer_id end) end
  from public.profiles p
  where p.id = auth.uid()
$$;

-- Use in every data policy: account on + 2FA passed + subscription not locked.
create or replace function public.auth_is_active()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select a.my_active and a.my_mfa_ok and a.my_billing <> 'locked' from public.my_access() a), false)
$$;

-- Same, but ignores the subscription (so a lawyer with an expired plan can still pay).
create or replace function public.auth_account_ok()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select a.my_active and a.my_mfa_ok from public.my_access() a), false)
$$;

-- ONE round trip for everything the app needs to know about the signed-in person.
-- (The app used to make five separate calls per page.) Returns null when not signed in.
drop function if exists public.my_context();
create or replace function public.my_context()
returns jsonb
language sql stable security definer set search_path = public as $$
  select to_jsonb(p)
    || jsonb_build_object(
         'firm_id', f.firm_id,
         'access_active', p.is_active and (
            p.role::text not in ('client', 'junior')
            or coalesce((select l.is_active from public.profiles l where l.id = p.lawyer_id), false)),
         'mfa_ok', public.mfa_ok(),
         'billing', case when p.role::text = 'super_admin' then 'ok' else public.firm_billing_state(f.firm_id) end,
         'billing_status', (select public.sub_effective(s) from public.subscriptions s where s.firm_id = f.firm_id),
         'billing_ends_at', (select public.sub_end(s) from public.subscriptions s where s.firm_id = f.firm_id),
         'plan', (select s.plan from public.subscriptions s where s.firm_id = f.firm_id),
         'onboarded', coalesce((select fp.onboarded_at is not null from public.firm_prefs fp where fp.firm_id = f.firm_id), true)
       )
  from public.profiles p
  cross join lateral (
    select case when p.role::text = 'lawyer' then p.id
                when p.role::text in ('junior', 'client') then p.lawyer_id end as firm_id
  ) f
  where p.id = auth.uid()
$$;

revoke execute on function public.auth_role(), public.auth_lawyer_id(), public.auth_staff_firm(),
  public.auth_is_staff(), public.my_access(), public.auth_is_active(), public.auth_account_ok(),
  public.mfa_ok(), public.my_context(), public.firm_billing_state(uuid) from public, anon;
grant execute on function public.auth_role(), public.auth_lawyer_id(), public.auth_staff_firm(),
  public.auth_is_staff(), public.my_access(), public.auth_is_active(), public.auth_account_ok(),
  public.mfa_ok(), public.my_context(), public.firm_billing_state(uuid) to authenticated;

-- ---------- New firms: record, preferences and free trial are created automatically ----------
-- Every new lawyer gets a firm record, preferences and a free trial automatically.
create or replace function public.profiles_after_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare ps public.platform_settings;
begin
  if new.role::text = 'lawyer' then
    select * into ps from public.platform_settings where id = 1;
    insert into public.firm_settings (firm_id, firm_name, email) values (new.id, new.firm_name, new.email)
      on conflict (firm_id) do nothing;
    insert into public.firm_prefs (firm_id) values (new.id) on conflict (firm_id) do nothing;
    insert into public.subscriptions (firm_id, status, trial_ends_at, grace_days)
      values (new.id, 'trial', now() + make_interval(days => coalesce(ps.trial_days, 14)), coalesce(ps.grace_days, 5))
      on conflict (firm_id) do nothing;
  end if;
  return new;
end $$;
drop trigger if exists profiles_after_insert on public.profiles;
create trigger profiles_after_insert after insert on public.profiles
  for each row execute function public.profiles_after_insert();

-- Backfill for lawyers created before this version (existing firms are treated as already onboarded)
insert into public.firm_settings (firm_id, firm_name, email)
  select id, firm_name, email from public.profiles where role::text = 'lawyer'
  on conflict (firm_id) do nothing;
insert into public.firm_prefs (firm_id, onboarded_at)
  select id, now() from public.profiles where role::text = 'lawyer'
  on conflict (firm_id) do nothing;
insert into public.subscriptions (firm_id, status, trial_ends_at, grace_days)
  select id, 'trial', now() + interval '14 days', 5 from public.profiles where role::text = 'lawyer'
  on conflict (firm_id) do nothing;

-- ---------- Integrity: clients and juniors must belong to a real lawyer ----------
create or replace function public.profiles_validate()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.role::text in ('client', 'junior') then
    if not exists (select 1 from public.profiles where id = new.lawyer_id and role::text = 'lawyer') then
      raise exception 'A client or junior must belong to a lawyer';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists profiles_validate on public.profiles;
create trigger profiles_validate
  before insert or update of role, lawyer_id on public.profiles
  for each row execute function public.profiles_validate();

-- ---------- Profile policies (read-only from the browser) ----------
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "super admin reads all" on public.profiles;
create policy "super admin reads all" on public.profiles
  for select to authenticated
  using ((select public.auth_role())::text = 'super_admin' and (select public.mfa_ok()));

-- a lawyer reads their firm: clients AND juniors
drop policy if exists "lawyer reads own clients" on public.profiles;
create policy "lawyer reads own clients" on public.profiles
  for select to authenticated
  using ((select public.auth_role())::text = 'lawyer' and lawyer_id = (select auth.uid()) and (select public.mfa_ok()));

-- a client reads their lawyer; a junior reads the owner
drop policy if exists "client reads own lawyer" on public.profiles;
create policy "client reads own lawyer" on public.profiles
  for select to authenticated
  using (id = (select public.auth_lawyer_id()) and (select public.mfa_ok()));

-- a junior reads the rest of the firm (other juniors and the firm's clients)
drop policy if exists "junior reads own firm" on public.profiles;
create policy "junior reads own firm" on public.profiles
  for select to authenticated
  using ((select public.auth_role())::text = 'junior'
         and lawyer_id = (select public.auth_lawyer_id()) and (select public.mfa_ok()));

-- a client sees the names of their firm's juniors (they appear as message authors)
drop policy if exists "client reads firm staff" on public.profiles;
create policy "client reads firm staff" on public.profiles
  for select to authenticated
  using ((select public.auth_role())::text = 'client' and role::text = 'junior'
         and lawyer_id = (select public.auth_lawyer_id()) and (select public.mfa_ok()));

-- ---------- Rate limiting (login, password reset, invites, uploads) ----------
create table if not exists public.rate_limits (
  id     bigserial primary key,
  key    text not null,
  hit_at timestamptz not null default now()
);
create index if not exists rate_limits_key_idx on public.rate_limits(key, hit_at desc);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;
grant all on public.rate_limits to service_role;
grant usage, select on sequence public.rate_limits_id_seq to service_role;

create or replace function public.rate_limit_hit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  perform pg_advisory_xact_lock(hashtext(p_key)); -- count + insert must not race
  if random() < 0.02 then
    delete from public.rate_limits where hit_at < now() - interval '1 day';
  end if;
  select count(*) into n from public.rate_limits
   where key = p_key and hit_at > now() - make_interval(secs => p_window_seconds);
  if n >= p_max then return false; end if;
  insert into public.rate_limits(key) values (p_key);
  return true;
end $$;
revoke execute on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, int, int) to service_role;

-- ---------- Audit log (append-only, written by the server) ----------
create table if not exists public.audit_log (
  id         bigserial primary key,
  actor_id   uuid,
  action     text not null,
  target_id  uuid,
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_created_idx on public.audit_log(created_at desc);
create index if not exists audit_log_action_idx on public.audit_log(action, created_at desc);
alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
grant all on public.audit_log to service_role;
grant usage, select on sequence public.audit_log_id_seq to service_role;

drop policy if exists "super admin reads audit" on public.audit_log;
create policy "super admin reads audit" on public.audit_log
  for select to authenticated
  using ((select public.auth_role())::text = 'super_admin' and (select public.mfa_ok()));
grant select on public.audit_log to authenticated;

-- =====================================================================
--  PRACTICE MANAGEMENT
-- =====================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- Gap-free-ish, delete-proof numbering (case and invoice numbers never repeat)
create table if not exists public.counters (
  lawyer_id uuid not null references public.profiles(id) on delete cascade,
  kind      text not null,
  year      int  not null,
  last      int  not null default 0,
  primary key (lawyer_id, kind, year)
);
alter table public.counters enable row level security;
revoke all on public.counters from anon, authenticated;
grant all on public.counters to service_role;

create or replace function public.next_number(p_lawyer uuid, p_kind text)
returns int language plpgsql security definer set search_path = public as $$
declare n int; y int := extract(year from now())::int;
begin
  insert into public.counters (lawyer_id, kind, year, last) values (p_lawyer, p_kind, y, 1)
  on conflict (lawyer_id, kind, year) do update set last = public.counters.last + 1
  returning last into n;
  return n;
end $$;
revoke execute on function public.next_number(uuid, text) from public, anon, authenticated;

-- ---------- Tables ----------
create table if not exists public.cases (
  id             uuid primary key default gen_random_uuid(),
  lawyer_id      uuid not null references public.profiles(id) on delete restrict,
  client_id      uuid not null references public.profiles(id) on delete restrict,
  case_number    text not null,
  title          text not null check (char_length(title) between 1 and 200),
  case_type      text not null default 'Other',
  status         text not null default 'open' check (status in ('open','in_progress','on_hold','closed')),
  court          text,
  opposing_party text,
  description    text,
  opened_on      date not null default current_date,
  closed_on      date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (lawyer_id, case_number)
);
alter table public.cases add column if not exists court_case_number text; -- the number the COURT gave it
alter table public.cases add column if not exists judge text;
alter table public.cases add column if not exists stage text;             -- e.g. "Evidence", "Arguments"
create index if not exists cases_lawyer_idx on public.cases(lawyer_id, updated_at desc);
create index if not exists cases_client_idx on public.cases(client_id);
create index if not exists cases_opposing_idx on public.cases(lawyer_id, lower(opposing_party));

create table if not exists public.case_messages (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid not null references public.cases(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete restrict,
  body       text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists case_messages_case_idx on public.case_messages(case_id, created_at);

create table if not exists public.case_notes (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid not null references public.cases(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete restrict,
  body       text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists case_notes_case_idx on public.case_notes(case_id, created_at desc);

create table if not exists public.documents (
  id                uuid primary key default gen_random_uuid(),
  case_id           uuid not null references public.cases(id) on delete cascade,
  uploaded_by       uuid not null references public.profiles(id) on delete restrict,
  name              text not null check (char_length(name) between 1 and 200),
  storage_path      text not null,
  size_bytes        bigint not null default 0,
  mime_type         text,
  visible_to_client boolean not null default false,
  created_at        timestamptz not null default now()
);
-- folders and versions
alter table public.documents add column if not exists folder text not null default 'General';
alter table public.documents add column if not exists group_id uuid;
alter table public.documents add column if not exists version int not null default 1;
alter table public.documents add column if not exists is_current boolean not null default true;
update public.documents set group_id = id where group_id is null;
create index if not exists documents_case_idx on public.documents(case_id, created_at desc);
create index if not exists documents_group_idx on public.documents(group_id, version desc);
create index if not exists documents_current_idx on public.documents(case_id, is_current, created_at desc);

-- A file path must live inside its own case folder (stops pointing a row at someone else's file)
do $$ begin
  alter table public.documents add constraint documents_path_in_case
    check (storage_path like case_id::text || '/%') not valid;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public.documents add constraint documents_folder_len check (char_length(folder) between 1 and 60);
exception when duplicate_object then null;
end $$;

create table if not exists public.events (
  id                uuid primary key default gen_random_uuid(),
  lawyer_id         uuid not null references public.profiles(id) on delete restrict,
  case_id           uuid references public.cases(id) on delete cascade,
  title             text not null check (char_length(title) between 1 and 200),
  kind              text not null default 'meeting' check (kind in ('hearing','meeting','deadline','other')),
  starts_at         timestamptz not null,
  location          text,
  notes             text,
  visible_to_client boolean not null default false,
  created_at        timestamptz not null default now()
);
alter table public.events add column if not exists outcome text;       -- what happened at the hearing
alter table public.events add column if not exists reminded_at timestamptz;
create index if not exists events_lawyer_idx on public.events(lawyer_id, starts_at);
create index if not exists events_case_idx on public.events(case_id);
create index if not exists events_kind_idx on public.events(lawyer_id, kind, starts_at);

create table if not exists public.tasks (
  id         uuid primary key default gen_random_uuid(),
  lawyer_id  uuid not null references public.profiles(id) on delete restrict,
  case_id    uuid references public.cases(id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 200),
  due_date   date,
  priority   text not null default 'medium' check (priority in ('low','medium','high')),
  done       boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.tasks add column if not exists reminded_at timestamptz;
alter table public.tasks add column if not exists assigned_to uuid references public.profiles(id) on delete set null;
create index if not exists tasks_lawyer_idx on public.tasks(lawyer_id, done, due_date);
create index if not exists tasks_assigned_idx on public.tasks(assigned_to, done);

create table if not exists public.invoices (
  id           uuid primary key default gen_random_uuid(),
  lawyer_id    uuid not null references public.profiles(id) on delete restrict,
  client_id    uuid not null references public.profiles(id) on delete restrict,
  case_id      uuid references public.cases(id) on delete set null,
  number       text not null,
  description  text,
  amount_cents bigint not null check (amount_cents > 0),
  currency     text not null default 'USD',
  status       text not null default 'draft' check (status in ('draft','sent','paid','void')),
  issued_on    date not null default current_date,
  due_on       date,
  paid_on      date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (lawyer_id, number)
);
create index if not exists invoices_lawyer_idx on public.invoices(lawyer_id, created_at desc);
create index if not exists invoices_client_idx on public.invoices(client_id);

-- Time tracking / billable hours
create table if not exists public.time_entries (
  id                  uuid primary key default gen_random_uuid(),
  lawyer_id           uuid not null references public.profiles(id) on delete restrict, -- the firm
  user_id             uuid not null references public.profiles(id) on delete restrict, -- who did the work
  case_id             uuid not null references public.cases(id) on delete cascade,
  entry_date          date not null default current_date,
  minutes             int  not null check (minutes between 1 and 1440),
  description         text not null check (char_length(description) between 1 and 500),
  billable            boolean not null default true,
  rate_cents          bigint not null default 0 check (rate_cents >= 0), -- per hour
  invoiced_invoice_id uuid references public.invoices(id) on delete set null,
  created_at          timestamptz not null default now()
);
create index if not exists time_firm_idx on public.time_entries(lawyer_id, entry_date desc);
create index if not exists time_case_idx on public.time_entries(case_id, entry_date desc);
create index if not exists time_user_idx on public.time_entries(user_id, entry_date desc);

-- Letter and invoice templates (the firm's own; built-in starters live in the app)
create table if not exists public.templates (
  id           uuid primary key default gen_random_uuid(),
  lawyer_id    uuid not null references public.profiles(id) on delete cascade,
  kind         text not null check (kind in ('letter', 'invoice')),
  name         text not null check (char_length(name) between 1 and 120),
  body         text not null check (char_length(body) between 1 and 20000),
  amount_cents bigint check (amount_cents is null or amount_cents > 0),
  currency     text,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists templates_firm_idx on public.templates(lawyer_id, kind, name);

-- Payments the firm made to the platform by bank transfer (confirmed by the super admin)
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  firm_id      uuid not null references public.profiles(id) on delete cascade,
  plan         text not null,
  months       int  not null check (months between 1 and 36),
  amount_cents bigint not null check (amount_cents > 0),
  currency     text not null default 'PKR',
  method       text not null default 'bank_transfer',
  reference    text,
  paid_on      date,
  proof_path   text,
  note         text,
  status       text not null default 'pending' check (status in ('pending','confirmed','rejected')),
  reviewed_by  uuid references public.profiles(id) on delete set null,
  reviewed_at  timestamptz,
  review_note  text,
  created_at   timestamptz not null default now()
);
create index if not exists payments_firm_idx on public.payments(firm_id, created_at desc);
create index if not exists payments_status_idx on public.payments(status, created_at desc);

-- People who asked for a demo on the public website
create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  email      text,
  phone      text,
  firm_name  text,
  city       text,
  message    text,
  status     text not null default 'new' check (status in ('new','contacted','won','lost')),
  created_at timestamptz not null default now()
);
create index if not exists leads_created_idx on public.leads(created_at desc);

alter table public.cases         enable row level security;
alter table public.case_messages enable row level security;
alter table public.case_notes    enable row level security;
alter table public.documents     enable row level security;
alter table public.events        enable row level security;
alter table public.tasks         enable row level security;
alter table public.invoices      enable row level security;
alter table public.time_entries  enable row level security;
alter table public.templates     enable row level security;
alter table public.firm_settings enable row level security;
alter table public.firm_prefs    enable row level security;
alter table public.subscriptions enable row level security;
alter table public.platform_settings enable row level security;
alter table public.payments      enable row level security;
alter table public.leads         enable row level security;

-- ---------- Case access helpers ----------
create or replace function public.is_my_client(p_client uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = p_client and role::text = 'client'
                   and lawyer_id = public.auth_staff_firm())
$$;

-- "Is this case handled by MY firm?" (lawyer or junior)
create or replace function public.owns_case(p_case uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.cases where id = p_case and lawyer_id = public.auth_staff_firm())
$$;

create or replace function public.client_of_case(p_case uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.cases where id = p_case and client_id = auth.uid())
$$;

create or replace function public.can_access_case(p_case uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.cases
                 where id = p_case and (lawyer_id = public.auth_staff_firm() or client_id = auth.uid()))
$$;

-- is this person one of MY firm's staff? (for assigning tasks)
create or replace function public.is_my_staff(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = p_user and role::text in ('lawyer', 'junior')
                   and (id = public.auth_staff_firm() or lawyer_id = public.auth_staff_firm()))
$$;

revoke execute on function public.is_my_client(uuid), public.owns_case(uuid), public.client_of_case(uuid),
  public.can_access_case(uuid), public.is_my_staff(uuid) from public, anon;
grant execute on function public.is_my_client(uuid), public.owns_case(uuid), public.client_of_case(uuid),
  public.can_access_case(uuid), public.is_my_staff(uuid) to authenticated;

-- ---------- Triggers: numbering + integrity (run for everyone, even the service role) ----------
create or replace function public.cases_before_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not exists (select 1 from public.profiles
                 where id = new.client_id and role::text = 'client' and lawyer_id = new.lawyer_id) then
    raise exception 'This client does not belong to this firm';
  end if;
  if tg_op = 'INSERT' and (new.case_number is null or new.case_number = '') then
    loop
      n := public.next_number(new.lawyer_id, 'case');
      new.case_number := 'CASE-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 4, '0');
      exit when not exists (select 1 from public.cases where lawyer_id = new.lawyer_id and case_number = new.case_number);
    end loop;
  end if;
  if tg_op = 'UPDATE' and new.lawyer_id <> old.lawyer_id then
    raise exception 'A case cannot move to another firm';
  end if;
  if new.status = 'closed' and new.closed_on is null then new.closed_on := current_date; end if;
  if new.status <> 'closed' then new.closed_on := null; end if;
  return new;
end $$;
drop trigger if exists cases_before_write on public.cases;
create trigger cases_before_write before insert or update on public.cases
  for each row execute function public.cases_before_write();
drop trigger if exists cases_touch on public.cases;
create trigger cases_touch before update on public.cases
  for each row execute function public.touch_updated_at();

create or replace function public.invoices_before_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not exists (select 1 from public.profiles
                 where id = new.client_id and role::text = 'client' and lawyer_id = new.lawyer_id) then
    raise exception 'This client does not belong to this firm';
  end if;
  if new.case_id is not null and not exists (
       select 1 from public.cases
       where id = new.case_id and lawyer_id = new.lawyer_id and client_id = new.client_id) then
    raise exception 'That case does not belong to this client';
  end if;
  if tg_op = 'INSERT' and (new.number is null or new.number = '') then
    loop
      n := public.next_number(new.lawyer_id, 'invoice');
      new.number := 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 4, '0');
      exit when not exists (select 1 from public.invoices where lawyer_id = new.lawyer_id and number = new.number);
    end loop;
  end if;
  if tg_op = 'UPDATE' then
    if new.lawyer_id <> old.lawyer_id or new.number <> old.number then
      raise exception 'Invoice number and owner cannot be changed';
    end if;
    -- status can only move forward: draft -> sent/void, sent -> paid/void
    if new.status <> old.status and not (
         (old.status = 'draft' and new.status in ('sent', 'void'))
         or (old.status = 'sent' and new.status in ('paid', 'void'))) then
      raise exception 'That invoice status change is not allowed.';
    end if;
    if old.status <> 'draft' and (
         new.amount_cents <> old.amount_cents or new.currency <> old.currency
         or new.client_id <> old.client_id or new.case_id is distinct from old.case_id) then
      raise exception 'Only draft invoices can be edited. Void it and create a new one instead.';
    end if;
  end if;
  if new.status = 'paid' and new.paid_on is null then new.paid_on := current_date; end if;
  if new.status <> 'paid' then new.paid_on := null; end if;
  return new;
end $$;
drop trigger if exists invoices_before_write on public.invoices;
create trigger invoices_before_write before insert or update on public.invoices
  for each row execute function public.invoices_before_write();
drop trigger if exists invoices_touch on public.invoices;
create trigger invoices_touch before update on public.invoices
  for each row execute function public.touch_updated_at();

-- tasks: the assignee must be one of the firm's own staff
create or replace function public.tasks_before_write()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.assigned_to is not null and not exists (
       select 1 from public.profiles
       where id = new.assigned_to and role::text in ('lawyer', 'junior')
         and (id = new.lawyer_id or lawyer_id = new.lawyer_id)) then
    raise exception 'A task can only be assigned to someone in your firm';
  end if;
  return new;
end $$;
drop trigger if exists tasks_before_write on public.tasks;
create trigger tasks_before_write before insert or update on public.tasks
  for each row execute function public.tasks_before_write();

-- time entries: case must belong to the firm; invoiced entries are frozen
create or replace function public.time_before_write()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.cases where id = new.case_id and lawyer_id = new.lawyer_id) then
    raise exception 'That case does not belong to this firm';
  end if;
  if tg_op = 'UPDATE' and old.invoiced_invoice_id is not null and (
       new.minutes <> old.minutes or new.rate_cents <> old.rate_cents or new.billable <> old.billable
       or new.case_id <> old.case_id) then
    raise exception 'This time entry is already on an invoice and cannot be changed.';
  end if;
  return new;
end $$;
drop trigger if exists time_before_write on public.time_entries;
create trigger time_before_write before insert or update on public.time_entries
  for each row execute function public.time_before_write();

-- documents: versions. Uploading "version 2" of a file keeps version 1 in the history.
create or replace function public.documents_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare v int;
begin
  new.group_id := coalesce(new.group_id, new.id);
  if new.group_id <> new.id then
    if auth.uid() is not null and not public.auth_is_staff() then
      raise exception 'Only your lawyer can upload a new version of a document';
    end if;
    select max(version) into v from public.documents where group_id = new.group_id and case_id = new.case_id;
    if v is null then raise exception 'The original document was not found'; end if;
    new.version := v + 1;
    update public.documents set is_current = false where group_id = new.group_id;
  else
    new.version := 1;
  end if;
  new.is_current := true;
  return new;
end $$;
drop trigger if exists documents_before_insert on public.documents;
create trigger documents_before_insert before insert on public.documents
  for each row execute function public.documents_before_insert();

-- deleting the newest version promotes the previous one
create or replace function public.documents_after_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.is_current then
    update public.documents set is_current = true
    where id = (select id from public.documents where group_id = old.group_id order by version desc limit 1);
  end if;
  return old;
end $$;
drop trigger if exists documents_after_delete on public.documents;
create trigger documents_after_delete after delete on public.documents
  for each row execute function public.documents_after_delete();

drop trigger if exists templates_touch on public.templates;
create trigger templates_touch before update on public.templates
  for each row execute function public.touch_updated_at();

-- ---------- Table privileges (browser can only do what RLS allows) ----------
revoke all on public.cases, public.case_messages, public.case_notes, public.documents, public.events,
  public.tasks, public.invoices, public.time_entries, public.templates, public.firm_settings,
  public.firm_prefs, public.subscriptions, public.platform_settings, public.payments, public.leads
  from anon, authenticated;

grant select, insert, delete on public.cases to authenticated;
grant update (client_id, title, case_type, status, court, court_case_number, judge, stage,
              opposing_party, description, opened_on) on public.cases to authenticated;
grant select, insert on public.case_messages to authenticated;
grant select, insert, delete on public.case_notes to authenticated;
grant select, insert, delete on public.documents to authenticated;
grant update (name, folder, visible_to_client) on public.documents to authenticated;
grant select, insert, delete on public.events to authenticated;
grant update (case_id, title, kind, starts_at, location, notes, visible_to_client, outcome) on public.events to authenticated;
grant select, insert, delete on public.tasks to authenticated;
grant update (case_id, title, due_date, priority, done, assigned_to) on public.tasks to authenticated;
grant select, insert, delete on public.invoices to authenticated;
grant update (case_id, description, amount_cents, currency, status, due_on) on public.invoices to authenticated;
grant select, insert, delete on public.time_entries to authenticated;
grant update (description, minutes, billable, rate_cents, entry_date, invoiced_invoice_id) on public.time_entries to authenticated;
grant select, insert, update, delete on public.templates to authenticated;
grant select, insert, update on public.firm_settings to authenticated;
grant select, insert, update on public.firm_prefs to authenticated;
grant select on public.subscriptions to authenticated;
grant select on public.platform_settings to authenticated;
grant select, insert on public.payments to authenticated;
grant select on public.leads to authenticated;

grant all on public.cases, public.case_messages, public.case_notes, public.documents, public.events,
  public.tasks, public.invoices, public.time_entries, public.templates, public.firm_settings,
  public.firm_prefs, public.subscriptions, public.platform_settings, public.payments, public.leads
  to service_role;

-- ---------- RLS policies ----------
-- cases: staff of the firm see all the firm's cases; a client sees only their own
drop policy if exists "cases read" on public.cases;
create policy "cases read" on public.cases for select to authenticated
  using ((select public.auth_is_active())
         and (lawyer_id = (select public.auth_staff_firm()) or client_id = (select auth.uid())));
drop policy if exists "cases insert" on public.cases;
create policy "cases insert" on public.cases for insert to authenticated
  with check ((select public.auth_is_active()) and (select public.auth_is_staff())
              and lawyer_id = (select public.auth_staff_firm()) and public.is_my_client(client_id));
drop policy if exists "cases update" on public.cases;
create policy "cases update" on public.cases for update to authenticated
  using ((select public.auth_is_active()) and (select public.auth_is_staff())
         and lawyer_id = (select public.auth_staff_firm()))
  with check ((select public.auth_is_active()) and (select public.auth_is_staff())
              and lawyer_id = (select public.auth_staff_firm()) and public.is_my_client(client_id));
-- only the firm owner may delete a case
drop policy if exists "cases delete" on public.cases;
create policy "cases delete" on public.cases for delete to authenticated
  using ((select public.auth_is_active()) and (select public.auth_role())::text = 'lawyer'
         and lawyer_id = (select auth.uid()));

-- messages (both sides of a case)
drop policy if exists "messages read" on public.case_messages;
create policy "messages read" on public.case_messages for select to authenticated
  using ((select public.auth_is_active()) and public.can_access_case(case_id));
drop policy if exists "messages insert" on public.case_messages;
create policy "messages insert" on public.case_messages for insert to authenticated
  with check ((select public.auth_is_active()) and public.can_access_case(case_id) and author_id = (select auth.uid()));

-- private notes (firm staff only; clients can never read these)
drop policy if exists "notes read" on public.case_notes;
create policy "notes read" on public.case_notes for select to authenticated
  using ((select public.auth_is_active()) and (select public.auth_is_staff()) and public.owns_case(case_id));
drop policy if exists "notes insert" on public.case_notes;
create policy "notes insert" on public.case_notes for insert to authenticated
  with check ((select public.auth_is_active()) and (select public.auth_is_staff())
              and public.owns_case(case_id) and author_id = (select auth.uid()));
drop policy if exists "notes delete" on public.case_notes;
create policy "notes delete" on public.case_notes for delete to authenticated
  using ((select public.auth_is_active()) and (select public.auth_is_staff()) and public.owns_case(case_id)
         and (author_id = (select auth.uid()) or (select public.auth_role())::text = 'lawyer'));

-- documents (clients only see what the firm shared, plus their own uploads)
drop policy if exists "documents read" on public.documents;
create policy "documents read" on public.documents for select to authenticated
  using ((select public.auth_is_active()) and (
    public.owns_case(case_id) or (visible_to_client and public.client_of_case(case_id))));
drop policy if exists "documents insert" on public.documents;
create policy "documents insert" on public.documents for insert to authenticated
  with check ((select public.auth_is_active()) and uploaded_by = (select auth.uid()) and (
    public.owns_case(case_id) or (visible_to_client and public.client_of_case(case_id))));
drop policy if exists "documents update" on public.documents;
create policy "documents update" on public.documents for update to authenticated
  using ((select public.auth_is_active()) and (select public.auth_is_staff()) and public.owns_case(case_id))
  with check ((select public.auth_is_active()) and (select public.auth_is_staff()) and public.owns_case(case_id));
drop policy if exists "documents delete" on public.documents;
create policy "documents delete" on public.documents for delete to authenticated
  using ((select public.auth_is_active()) and (public.owns_case(case_id) or uploaded_by = (select auth.uid())));

-- events (clients see only events marked visible, on their own cases)
drop policy if exists "events read" on public.events;
create policy "events read" on public.events for select to authenticated
  using ((select public.auth_is_active()) and (
    lawyer_id = (select public.auth_staff_firm())
    or (visible_to_client and case_id is not null and public.client_of_case(case_id))));
drop policy if exists "events insert" on public.events;
create policy "events insert" on public.events for insert to authenticated
  with check ((select public.auth_is_active()) and (select public.auth_is_staff())
              and lawyer_id = (select public.auth_staff_firm())
              and (case_id is null or public.owns_case(case_id)));
drop policy if exists "events update" on public.events;
create policy "events update" on public.events for update to authenticated
  using ((select public.auth_is_active()) and (select public.auth_is_staff())
         and lawyer_id = (select public.auth_staff_firm()))
  with check ((select public.auth_is_active()) and (select public.auth_is_staff())
              and lawyer_id = (select public.auth_staff_firm())
              and (case_id is null or public.owns_case(case_id)));
drop policy if exists "events delete" on public.events;
create policy "events delete" on public.events for delete to authenticated
  using ((select public.auth_is_active()) and (select public.auth_is_staff())
         and lawyer_id = (select public.auth_staff_firm()));

-- tasks (the firm's staff)
drop policy if exists "tasks read" on public.tasks;
create policy "tasks read" on public.tasks for select to authenticated
  using ((select public.auth_is_active()) and (select public.auth_is_staff())
         and lawyer_id = (select public.auth_staff_firm()));
drop policy if exists "tasks insert" on public.tasks;
create policy "tasks insert" on public.tasks for insert to authenticated
  with check ((select public.auth_is_active()) and (select public.auth_is_staff())
              and lawyer_id = (select public.auth_staff_firm())
              and (case_id is null or public.owns_case(case_id)));
drop policy if exists "tasks update" on public.tasks;
create policy "tasks update" on public.tasks for update to authenticated
  using ((select public.auth_is_active()) and (select public.auth_is_staff())
         and lawyer_id = (select public.auth_staff_firm()))
  with check ((select public.auth_is_active()) and (select public.auth_is_staff())
              and lawyer_id = (select public.auth_staff_firm())
              and (case_id is null or public.owns_case(case_id)));
drop policy if exists "tasks delete" on public.tasks;
create policy "tasks delete" on public.tasks for delete to authenticated
  using ((select public.auth_is_active()) and (select public.auth_is_staff())
         and lawyer_id = (select public.auth_staff_firm()));

-- invoices: the firm OWNER only (juniors never see billing); clients never see drafts
drop policy if exists "invoices read" on public.invoices;
create policy "invoices read" on public.invoices for select to authenticated
  using ((select public.auth_is_active()) and (
    lawyer_id = (select auth.uid())
    or (client_id = (select auth.uid()) and status <> 'draft')));
drop policy if exists "invoices insert" on public.invoices;
create policy "invoices insert" on public.invoices for insert to authenticated
  with check ((select public.auth_is_active()) and (select public.auth_role())::text = 'lawyer'
              and lawyer_id = (select auth.uid())
              and public.is_my_client(client_id) and (case_id is null or public.owns_case(case_id)));
drop policy if exists "invoices update" on public.invoices;
create policy "invoices update" on public.invoices for update to authenticated
  using ((select public.auth_is_active()) and (select public.auth_role())::text = 'lawyer'
         and lawyer_id = (select auth.uid()))
  with check ((select public.auth_is_active()) and (select public.auth_role())::text = 'lawyer'
              and lawyer_id = (select auth.uid()) and public.is_my_client(client_id));
-- only DRAFTS can be deleted (anything sent must be voided so the record stays)
drop policy if exists "invoices delete" on public.invoices;
create policy "invoices delete" on public.invoices for delete to authenticated
  using ((select public.auth_is_active()) and (select public.auth_role())::text = 'lawyer'
         and lawyer_id = (select auth.uid()) and status = 'draft');

-- time entries: the owner sees the whole firm's; a junior sees only their own
drop policy if exists "time read" on public.time_entries;
create policy "time read" on public.time_entries for select to authenticated
  using ((select public.auth_is_active()) and (select public.auth_is_staff())
         and lawyer_id = (select public.auth_staff_firm())
         and ((select public.auth_role())::text = 'lawyer' or user_id = (select auth.uid())));
drop policy if exists "time insert" on public.time_entries;
create policy "time insert" on public.time_entries for insert to authenticated
  with check ((select public.auth_is_active()) and (select public.auth_is_staff())
              and lawyer_id = (select public.auth_staff_firm()) and user_id = (select auth.uid())
              and public.owns_case(case_id));
drop policy if exists "time update" on public.time_entries;
create policy "time update" on public.time_entries for update to authenticated
  using ((select public.auth_is_active()) and (select public.auth_is_staff())
         and lawyer_id = (select public.auth_staff_firm())
         and ((select public.auth_role())::text = 'lawyer' or user_id = (select auth.uid())))
  with check ((select public.auth_is_active()) and (select public.auth_is_staff())
              and lawyer_id = (select public.auth_staff_firm()));
drop policy if exists "time delete" on public.time_entries;
create policy "time delete" on public.time_entries for delete to authenticated
  using ((select public.auth_is_active()) and (select public.auth_is_staff())
         and lawyer_id = (select public.auth_staff_firm()) and invoiced_invoice_id is null
         and ((select public.auth_role())::text = 'lawyer' or user_id = (select auth.uid())));

-- templates: letters for all staff, invoice templates for the owner
drop policy if exists "templates read" on public.templates;
create policy "templates read" on public.templates for select to authenticated
  using ((select public.auth_is_active()) and (select public.auth_is_staff())
         and lawyer_id = (select public.auth_staff_firm()));
drop policy if exists "templates write" on public.templates;
create policy "templates write" on public.templates for all to authenticated
  using ((select public.auth_is_active()) and lawyer_id = (select public.auth_staff_firm())
         and (kind = 'letter' or (select public.auth_role())::text = 'lawyer'))
  with check ((select public.auth_is_active()) and lawyer_id = (select public.auth_staff_firm())
              and (kind = 'letter' or (select public.auth_role())::text = 'lawyer'));

-- firm settings: the firm and its clients read (clients need the bank details on invoices); owner writes
drop policy if exists "firm settings read" on public.firm_settings;
create policy "firm settings read" on public.firm_settings for select to authenticated
  using ((select public.auth_is_active())
         and (firm_id = (select public.auth_staff_firm()) or firm_id = (select public.auth_lawyer_id())));
drop policy if exists "firm settings write" on public.firm_settings;
create policy "firm settings write" on public.firm_settings for insert to authenticated
  with check ((select public.auth_is_active()) and (select public.auth_role())::text = 'lawyer' and firm_id = (select auth.uid()));
drop policy if exists "firm settings update" on public.firm_settings;
create policy "firm settings update" on public.firm_settings for update to authenticated
  using ((select public.auth_is_active()) and (select public.auth_role())::text = 'lawyer' and firm_id = (select auth.uid()))
  with check ((select public.auth_is_active()) and (select public.auth_role())::text = 'lawyer' and firm_id = (select auth.uid()));

drop policy if exists "firm prefs read" on public.firm_prefs;
create policy "firm prefs read" on public.firm_prefs for select to authenticated
  using ((select public.auth_is_active()) and (select public.auth_is_staff()) and firm_id = (select public.auth_staff_firm()));
drop policy if exists "firm prefs write" on public.firm_prefs;
create policy "firm prefs write" on public.firm_prefs for insert to authenticated
  with check ((select public.auth_is_active()) and (select public.auth_role())::text = 'lawyer' and firm_id = (select auth.uid()));
drop policy if exists "firm prefs update" on public.firm_prefs;
create policy "firm prefs update" on public.firm_prefs for update to authenticated
  using ((select public.auth_is_active()) and (select public.auth_role())::text = 'lawyer' and firm_id = (select auth.uid()))
  with check ((select public.auth_is_active()) and (select public.auth_role())::text = 'lawyer' and firm_id = (select auth.uid()));

-- subscriptions & payments: the owner (even when locked, so they can pay) and the super admin
drop policy if exists "subscription read" on public.subscriptions;
create policy "subscription read" on public.subscriptions for select to authenticated
  using ((select public.auth_account_ok())
         and (firm_id = (select auth.uid()) or (select public.auth_role())::text = 'super_admin'));

drop policy if exists "platform settings read" on public.platform_settings;
create policy "platform settings read" on public.platform_settings for select to authenticated
  using ((select public.auth_account_ok()));

drop policy if exists "payments read" on public.payments;
create policy "payments read" on public.payments for select to authenticated
  using ((select public.auth_account_ok())
         and (firm_id = (select auth.uid()) or (select public.auth_role())::text = 'super_admin'));
drop policy if exists "payments insert" on public.payments;
create policy "payments insert" on public.payments for insert to authenticated
  with check ((select public.auth_account_ok()) and (select public.auth_role())::text = 'lawyer'
              and firm_id = (select auth.uid()) and status = 'pending'
              and reviewed_by is null and reviewed_at is null);

drop policy if exists "leads read" on public.leads;
create policy "leads read" on public.leads for select to authenticated
  using ((select public.auth_role())::text = 'super_admin' and (select public.mfa_ok()));

-- ---------- Payment confirmation (called by the server for the super admin) ----------
create or replace function public.confirm_payment(p_payment uuid, p_reviewer uuid)
returns void language plpgsql security definer set search_path = public as $$
declare pay public.payments; s public.subscriptions; base timestamptz;
begin
  select * into pay from public.payments where id = p_payment for update;
  if not found or pay.status <> 'pending' then raise exception 'This payment is not waiting for review'; end if;
  select * into s from public.subscriptions where firm_id = pay.firm_id for update;
  if not found then raise exception 'This firm has no subscription record'; end if;

  -- renewing early adds time on top of what is left; otherwise the new period starts today
  base := now();
  if s.status = 'active' and s.current_period_end is not null and s.current_period_end > now() then
    base := s.current_period_end;
  end if;

  update public.subscriptions
     set status = 'active', plan = pay.plan,
         current_period_end = base + make_interval(months => pay.months),
         updated_at = now()
   where firm_id = pay.firm_id;
  update public.payments
     set status = 'confirmed', reviewed_by = p_reviewer, reviewed_at = now()
   where id = p_payment;
end $$;
revoke execute on function public.confirm_payment(uuid, uuid) from public, anon, authenticated;
grant execute on function public.confirm_payment(uuid, uuid) to service_role;

-- ---------- Super admin: aggregate numbers ONLY (never case contents) ----------
create or replace function public.admin_platform_stats()
returns table (
  lawyers bigint, active_lawyers bigint, clients bigint,
  cases bigint, open_cases bigint, documents bigint, storage_bytes bigint
)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.profiles where role::text = 'lawyer'),
    (select count(*) from public.profiles where role::text = 'lawyer' and is_active),
    (select count(*) from public.profiles where role::text = 'client'),
    (select count(*) from public.cases),
    (select count(*) from public.cases where status <> 'closed'),
    (select count(*) from public.documents),
    (select coalesce(sum(size_bytes), 0)::bigint from public.documents)
  where public.auth_role()::text = 'super_admin' and public.mfa_ok()
$$;

drop function if exists public.admin_lawyer_stats();
create or replace function public.admin_lawyer_stats()
returns table (lawyer_id uuid, client_count bigint, case_count bigint, open_case_count bigint)
language sql stable security definer set search_path = public as $$
  select p.id,
    (select count(*) from public.profiles c where c.lawyer_id = p.id and c.role::text = 'client'),
    (select count(*) from public.cases x where x.lawyer_id = p.id),
    (select count(*) from public.cases x where x.lawyer_id = p.id and x.status <> 'closed')
  from public.profiles p
  where p.role::text = 'lawyer' and public.auth_role()::text = 'super_admin' and public.mfa_ok()
$$;

-- Subscription overview numbers for the billing dashboard
create or replace function public.admin_billing_overview()
returns table (
  trial bigint, active bigint, past_due bigint, suspended bigint,
  pending_payments bigint, expiring_soon bigint, revenue_30d bigint, new_leads bigint
)
language sql stable security definer set search_path = public as $$
  select
    count(*) filter (where e = 'trial'),
    count(*) filter (where e = 'active'),
    count(*) filter (where e = 'past_due'),
    count(*) filter (where e in ('suspended', 'canceled')),
    (select count(*) from public.payments where status = 'pending'),
    count(*) filter (where e in ('trial', 'active') and public.sub_end(s) is not null and public.sub_end(s) < now() + interval '7 days'),
    (select coalesce(sum(amount_cents), 0)::bigint from public.payments
       where status = 'confirmed' and reviewed_at > now() - interval '30 days'),
    (select count(*) from public.leads where status = 'new')
  from (select s, public.sub_effective(s) as e from public.subscriptions s) t(s, e)
  where public.auth_role()::text = 'super_admin' and public.mfa_ok()
$$;

-- Firms list (one row per lawyer) with subscription state, search and paging. total = all matches.
create or replace function public.admin_firms(p_q text default '', p_limit int default 20, p_offset int default 0)
returns table (
  firm_id uuid, email text, full_name text, firm_name text, is_active boolean, created_at timestamptz,
  password_set_at timestamptz, mfa_enabled boolean, plan text, sub_status text, effective text,
  ends_at timestamptz, junior_count bigint, client_count bigint, case_count bigint,
  open_case_count bigint, storage_bytes bigint, total bigint
)
language sql stable security definer set search_path = public as $$
  select p.id, p.email, p.full_name, p.firm_name, p.is_active, p.created_at, p.password_set_at, p.mfa_enabled,
    s.plan, s.status, public.sub_effective(s), public.sub_end(s),
    (select count(*) from public.profiles c where c.lawyer_id = p.id and c.role::text = 'junior'),
    (select count(*) from public.profiles c where c.lawyer_id = p.id and c.role::text = 'client'),
    (select count(*) from public.cases x where x.lawyer_id = p.id),
    (select count(*) from public.cases x where x.lawyer_id = p.id and x.status <> 'closed'),
    (select coalesce(sum(d.size_bytes), 0)::bigint from public.documents d
       join public.cases x on x.id = d.case_id where x.lawyer_id = p.id),
    count(*) over ()
  from public.profiles p
  left join public.subscriptions s on s.firm_id = p.id
  where p.role::text = 'lawyer'
    and public.auth_role()::text = 'super_admin' and public.mfa_ok()
    and (coalesce(p_q, '') = '' or p.email ilike '%' || p_q || '%' or p.full_name ilike '%' || p_q || '%'
         or p.firm_name ilike '%' || p_q || '%')
  order by p.created_at desc
  limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0)
$$;

-- New lawyers / clients / cases / documents per week (counts only, for the admin charts)
create or replace function public.admin_weekly_activity(p_weeks int default 8)
returns table (week_start date, new_lawyers bigint, new_clients bigint, new_cases bigint, new_documents bigint)
language sql stable security definer set search_path = public as $$
  with weeks as (
    select (date_trunc('week', now()) - make_interval(weeks => g))::date as ws
    from generate_series(least(greatest(p_weeks, 1), 26) - 1, 0, -1) as g
  )
  select w.ws,
    (select count(*) from public.profiles p where p.role::text = 'lawyer' and p.created_at >= w.ws and p.created_at < w.ws + 7),
    (select count(*) from public.profiles p where p.role::text = 'client' and p.created_at >= w.ws and p.created_at < w.ws + 7),
    (select count(*) from public.cases c where c.created_at >= w.ws and c.created_at < w.ws + 7),
    (select count(*) from public.documents d where d.created_at >= w.ws and d.created_at < w.ws + 7)
  from weeks w
  where public.auth_role()::text = 'super_admin' and public.mfa_ok()
  order by w.ws
$$;

-- ---------- Lawyer dashboard numbers: counted in the database, not by downloading rows ----------
create or replace function public.firm_dashboard()
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'cases_total',   (select count(*) from public.cases where lawyer_id = f.id),
    'cases_open',    (select count(*) from public.cases where lawyer_id = f.id and status <> 'closed'),
    'cases_by_status', (select coalesce(jsonb_object_agg(status, n), '{}'::jsonb)
                          from (select status, count(*) n from public.cases where lawyer_id = f.id group by status) s),
    'clients_total', (select count(*) from public.profiles where lawyer_id = f.id and role::text = 'client'),
    'tasks_open',    (select count(*) from public.tasks where lawyer_id = f.id and not done),
    'tasks_overdue', (select count(*) from public.tasks where lawyer_id = f.id and not done and due_date < current_date),
    'unbilled_minutes', (select coalesce(sum(minutes), 0) from public.time_entries
                          where lawyer_id = f.id and billable and invoiced_invoice_id is null
                            and (public.auth_role()::text = 'lawyer' or user_id = auth.uid())),
    'week_cases',    (select coalesce(jsonb_agg(n order by w), '[]'::jsonb) from (
                        select g.w, (select count(*) from public.cases c where c.lawyer_id = f.id
                                       and c.created_at >= g.w and c.created_at < g.w + 7) n
                        from (select (date_trunc('week', now()) - make_interval(weeks => k))::date w
                                from generate_series(7, 0, -1) k) g) x),
    'week_clients',  (select coalesce(jsonb_agg(n order by w), '[]'::jsonb) from (
                        select g.w, (select count(*) from public.profiles c where c.lawyer_id = f.id
                                       and c.role::text = 'client' and c.created_at < g.w + 7) n
                        from (select (date_trunc('week', now()) - make_interval(weeks => k))::date w
                                from generate_series(7, 0, -1) k) g) x),
    'week_invoices', (select coalesce(jsonb_agg(n order by w), '[]'::jsonb) from (
                        select g.w, (select count(*) from public.invoices i where i.lawyer_id = f.id
                                       and i.issued_on >= g.w and i.issued_on < g.w + 7) n
                        from (select (date_trunc('week', now()) - make_interval(weeks => k))::date w
                                from generate_series(7, 0, -1) k) g) x),
    'outstanding',   (select coalesce(jsonb_object_agg(currency, total), '{}'::jsonb) from (
                        select currency, sum(amount_cents) total from public.invoices
                         where lawyer_id = f.id and status = 'sent' group by currency) o),
    'outstanding_count', (select count(*) from public.invoices where lawyer_id = f.id and status = 'sent')
  )
  from (select public.auth_staff_firm() as id) f
  where f.id is not null and public.auth_is_active()
$$;

revoke execute on function public.admin_platform_stats(), public.admin_lawyer_stats(), public.admin_weekly_activity(int),
  public.admin_billing_overview(), public.admin_firms(text, int, int), public.firm_dashboard() from public, anon;
grant execute on function public.admin_platform_stats(), public.admin_lawyer_stats(), public.admin_weekly_activity(int),
  public.admin_billing_overview(), public.admin_firms(text, int, int), public.firm_dashboard() to authenticated;


-- Storage used by one firm (for plan limits); service-role only
create or replace function public.firm_storage_bytes(p_firm uuid)
returns bigint language sql stable security definer set search_path = public as $$
  select coalesce(sum(d.size_bytes), 0)::bigint
  from public.documents d join public.cases c on c.id = d.case_id
  where c.lawyer_id = p_firm
$$;
revoke execute on function public.firm_storage_bytes(uuid) from public, anon, authenticated;
grant execute on function public.firm_storage_bytes(uuid) to service_role;

-- ---------- Private file storage ----------
-- No storage policies on purpose: the browser can never touch files directly.
-- The server checks your permission (RLS above) and then hands out a short-lived signed link.
insert into storage.buckets (id, name, public, file_size_limit)
values ('case-documents', 'case-documents', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = 10485760;

insert into storage.buckets (id, name, public, file_size_limit)
values ('payment-proofs', 'payment-proofs', false, 5242880)
on conflict (id) do update set public = false, file_size_limit = 5242880;

-- ---------- Your super admin ----------
-- From the project folder run:
--   npm run create-admin -- you@example.com "YourStrongPassword" "Your Name"
-- (see SETUP.md). No SQL needed.
