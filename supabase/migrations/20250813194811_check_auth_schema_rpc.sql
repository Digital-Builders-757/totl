-- Create a safe, SECURITY DEFINER function to access information_schema
create or replace function public.check_auth_schema()
returns jsonb
language sql
security definer
set search_path = public
as $$
select jsonb_build_object(
  'schemas', (select jsonb_agg(schema_name) from information_schema.schemata where schema_name in ('auth','public')),
  'auth_tables', (select jsonb_agg(table_name) from information_schema.tables where table_schema = 'auth')
);
$$;

revoke all on function public.check_auth_schema() from public;
grant execute on function public.check_auth_schema() to authenticated, service_role;
