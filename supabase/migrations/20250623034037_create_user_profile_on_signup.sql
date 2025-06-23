-- This function is triggered when a new user signs up.
-- It creates a corresponding row in the public.profiles table and
-- a role-specific row in either talent_profiles or client_profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  user_role text;
  user_first_name text;
  user_last_name text;
begin
  -- Extract role and name from the user's metadata.
  -- The metadata is passed from the client-side signUp function.
  user_role := new.raw_user_meta_data->>'role';
  user_first_name := new.raw_user_meta_data->>'first_name';
  user_last_name := new.raw_user_meta_data->>'last_name';

  -- Create a general profile for the new user.
  insert into public.profiles (id, role)
  values (new.id, user_role::user_role);

  -- Create a role-specific profile.
  if user_role = 'talent' then
    insert into public.talent_profiles (user_id, first_name, last_name)
    values (new.id, user_first_name, user_last_name);
  elsif user_role = 'client' then
    -- Assumes company_name would be passed in metadata for clients
    insert into public.client_profiles (user_id, company_name)
    values (new.id, new.raw_user_meta_data->>'company_name');
  end if;
  
  return new;
end;
$$;

-- This trigger calls the handle_new_user function every time a new user is created.
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
