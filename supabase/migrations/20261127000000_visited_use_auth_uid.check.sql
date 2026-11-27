-- Self-check for the migration above. Runs as two fake users and rolls back.
-- Run in the SQL editor after applying the migration; it raises if user B can touch user A's rows.
begin;
do $$
declare a uuid; b uuid; sig int; n int;
begin
  select id into a from auth.users order by created_at limit 1;
  select id into b from auth.users where id <> a order by created_at limit 1;
  select id into sig from signatures limit 1;

  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', a)::text, true);
  perform public.mark_runestone_as_visited(sig);
  if not public.mark_runestone_as_visited(sig) then raise exception 'repeat mark must return true'; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', b)::text, true);
  perform public.delete_runestone_visited(sig, a); -- B passes A's id: must be ignored

  perform set_config('role', 'postgres', true);
  select count(*) into n from visited where user_id = a and signature_id = sig;
  if n <> 1 then raise exception 'user B changed user A''s visits (rows=%)', n; end if;
  raise notice 'OK';
end $$;
rollback;
