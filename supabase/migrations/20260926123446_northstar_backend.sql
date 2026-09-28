begin;

create table public.school_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.school_workspaces enable row level security;
revoke all on public.school_workspaces from anon, authenticated;
grant select, insert, update on public.school_workspaces to authenticated;

create policy "Owners read their own school" on public.school_workspaces
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "Owners create their own school" on public.school_workspaces
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "Owners update their own school" on public.school_workspaces
  for update to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- Prevent direct API writes from bypassing revision/conflict detection.
create function public.guard_school_workspace() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    new.revision := 0;
    new.created_at := now();
    new.updated_at := now();
  else
    if new.id is distinct from old.id or new.owner_id is distinct from old.owner_id then
      raise exception 'Workspace ownership cannot be changed';
    end if;
    if new.revision <> old.revision + 1 then
      raise exception 'Workspace revision must increase by one';
    end if;
    new.created_at := old.created_at;
    new.updated_at := now();
  end if;
  return new;
end;
$$;
revoke all on function public.guard_school_workspace() from public, anon, authenticated;
create trigger guard_school_workspace before insert or update on public.school_workspaces
  for each row execute function public.guard_school_workspace();

create function public.save_school_workspace(workspace_id uuid, expected_revision integer, next_data jsonb)
returns integer language plpgsql security invoker set search_path = '' as $$
declare saved_revision integer;
begin
  if auth.uid() is null then raise exception 'Sign in to save your school'; end if;
  update public.school_workspaces set data = next_data, revision = revision + 1
    where id = workspace_id and owner_id = auth.uid() and revision = expected_revision
    returning revision into saved_revision;
  if saved_revision is null then
    raise exception 'Your workspace changed in another session. Reload the saved version before editing.' using errcode = '40001';
  end if;
  return saved_revision;
end;
$$;
revoke all on function public.save_school_workspace(uuid, integer, jsonb) from public, anon;
grant execute on function public.save_school_workspace(uuid, integer, jsonb) to authenticated;

commit;
