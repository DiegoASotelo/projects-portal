alter table public.project_memberships
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists deactivated_at timestamptz,
  add column if not exists payment_note text;

update public.project_memberships
set trial_started_at = coalesce(trial_started_at, created_at),
    trial_ends_at = coalesce(trial_ends_at, created_at + interval '14 days')
where plan = 'basic';
