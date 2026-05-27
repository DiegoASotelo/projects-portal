create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  role text not null default 'user' check (role in ('admin','user')),
  status text not null default 'active' check (status in ('active','disabled')),
  plan text not null default 'basic',
  checklist_limit integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checklists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  collection_key text not null default 'adrenalyn-xl-worldcup-26',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, collection_key)
);

create table if not exists public.checklist_cards (
  checklist_id uuid not null references public.checklists(id) on delete cascade,
  card_number integer not null,
  owned_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key(checklist_id, card_number)
);

alter table public.app_users enable row level security;
alter table public.checklists enable row level security;
alter table public.checklist_cards enable row level security;

create policy "user can read own app_user" on public.app_users
for select using (auth.uid() = id);

create policy "user can update own app_user" on public.app_users
for update using (auth.uid() = id);

create policy "user can read own checklist" on public.checklists
for select using (auth.uid() = user_id);

create policy "user can insert own checklist" on public.checklists
for insert with check (auth.uid() = user_id);

create policy "user can update own checklist" on public.checklists
for update using (auth.uid() = user_id);

create policy "user can read own checklist cards" on public.checklist_cards
for select using (
  exists (
    select 1 from public.checklists c
    where c.id = checklist_cards.checklist_id and c.user_id = auth.uid()
  )
);

create policy "user can upsert own checklist cards" on public.checklist_cards
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
