update public.project_memberships
set status = 'disabled',
    deactivated_at = now(),
    updated_at = now()
where plan = 'basic'
  and status = 'active'
  and trial_ends_at is not null
  and trial_ends_at < now();
