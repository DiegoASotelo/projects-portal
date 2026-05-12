create extension if not exists pgcrypto;

drop policy if exists "users read own profile" on public.app_users;
drop policy if exists "users update own profile" on public.app_users;
drop policy if exists "users read own memberships" on public.project_memberships;
drop policy if exists "users read own checklists" on public.checklists;
drop policy if exists "users insert own checklists" on public.checklists;
drop policy if exists "users update own checklists" on public.checklists;
drop policy if exists "users read own checklist cards" on public.checklist_cards;
drop policy if exists "users upsert own checklist cards" on public.checklist_cards;

create table if not exists public.platform_projects (
  id uuid primary key default gen_random_uuid(),
  project_key text not null unique,
  name text not null,
  status text not null default 'active' check (status in ('active','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  role text not null default 'user' check (role in ('admin','user')),
  status text not null default 'active' check (status in ('active','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_memberships (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.platform_projects(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  role text not null default 'user' check (role in ('admin','user')),
  status text not null default 'active' check (status in ('active','disabled')),
  plan text not null default 'basic',
  checklist_limit integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, user_id)
);

create table if not exists public.checklists (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.platform_projects(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  collection_key text not null,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, user_id, collection_key)
);

create table if not exists public.checklist_cards (
  checklist_id uuid not null references public.checklists(id) on delete cascade,
  card_number integer not null,
  owned_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key(checklist_id, card_number)
);

insert into public.platform_projects (project_key, name)
values ('checklist-adrenalyn-xl-worldcup-26', 'Checklist Adrenaline XL WorlCup 26')
on conflict (project_key) do update set name = excluded.name, updated_at = now();

alter table public.platform_projects enable row level security;
alter table public.app_users enable row level security;
alter table public.project_memberships enable row level security;
alter table public.checklists enable row level security;
alter table public.checklist_cards enable row level security;

create policy "users read own profile" on public.app_users
for select using (auth.uid() = id);

create policy "users update own profile" on public.app_users
for update using (auth.uid() = id);

create policy "users read own memberships" on public.project_memberships
for select using (auth.uid() = user_id);

create policy "users read own checklists" on public.checklists
for select using (auth.uid() = user_id);

create policy "users insert own checklists" on public.checklists
for insert with check (auth.uid() = user_id);

create policy "users update own checklists" on public.checklists
for update using (auth.uid() = user_id);

create policy "users read own checklist cards" on public.checklist_cards
for select using (
  exists (
    select 1 from public.checklists c
    where c.id = checklist_cards.checklist_id and c.user_id = auth.uid()
  )
);

create policy "users upsert own checklist cards" on public.checklist_cards
for all using (
  exists (
    select 1 from public.checklists c
    where c.id = checklist_cards.checklist_id and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.checklists c
    where c.id = checklist_cards.checklist_id and c.user_id = auth.uid()
  )
);
