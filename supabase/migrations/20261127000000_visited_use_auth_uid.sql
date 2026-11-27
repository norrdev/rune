-- Visit functions trusted the client-supplied p_user_id and anon could call them,
-- so anyone could read or change any user's visits. Use auth.uid() instead.
-- p_user_id is kept (and ignored) so already-shipped app builds keep working.

create unique index if not exists visited_user_signature_key on public.visited (user_id, signature_id);

create or replace function public.get_all_visited_runestones(p_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  return (
    select jsonb_agg(row_to_json(t)) from (
      select v.signature_id as id, v.created_at
      from visited v
      where v.user_id = auth.uid()
      order by v.created_at desc, v.signature_id
    ) t
  );
end;
$$;

create or replace function public.mark_runestone_as_visited(p_signature_id integer, p_user_id uuid default null)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from signatures where id = p_signature_id) then
    raise exception 'Runestone with signature_id % does not exist', p_signature_id;
  end if;
  insert into visited (signature_id, user_id) values (p_signature_id, auth.uid())
  on conflict (user_id, signature_id) do nothing;
  return true; -- visited now, whether or not it already was
end;
$$;

create or replace function public.delete_runestone_visited(p_signature_id integer, p_user_id uuid default null)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  delete from visited where signature_id = p_signature_id and user_id = auth.uid();
  return true; -- not visited now, whether or not it was
end;
$$;

revoke execute on function public.get_all_visited_runestones(uuid) from public, anon;
revoke execute on function public.mark_runestone_as_visited(integer, uuid) from public, anon;
revoke execute on function public.delete_runestone_visited(integer, uuid) from public, anon;
grant execute on function public.get_all_visited_runestones(uuid) to authenticated;
grant execute on function public.mark_runestone_as_visited(integer, uuid) to authenticated;
grant execute on function public.delete_runestone_visited(integer, uuid) to authenticated;

-- Direct table access: users may only write rows for themselves.
alter policy "Allow authenticated users to insert records" on public.visited
  with check ((select auth.uid()) = user_id);
alter policy "Allow authenticated users to update their own records" on public.visited
  with check ((select auth.uid()) = user_id);
