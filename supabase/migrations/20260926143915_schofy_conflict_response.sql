create or replace function public.save_school_workspace(workspace_id uuid, expected_revision integer, next_data jsonb)
returns integer language plpgsql security invoker set search_path = '' as $$
declare saved_revision integer;
begin
  if auth.uid() is null then raise exception 'Sign in to save your school'; end if;
  update public.school_workspaces set data = next_data, revision = revision + 1
    where id = workspace_id and owner_id = auth.uid() and revision = expected_revision
    returning revision into saved_revision;
  if saved_revision is null then
    raise exception 'Your workspace changed in another session. Reload the saved version before editing.' using errcode = 'PT409';
  end if;
  return saved_revision;
end;
$$;
