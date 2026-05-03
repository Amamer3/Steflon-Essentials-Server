-- Function to manually promote a user to admin
-- Usage: SELECT make_user_admin('user@example.com', 'admin');
create or replace function public.make_user_admin(user_email text, new_role text default 'admin')
returns void as $$
declare
  target_user_id uuid;
begin
  -- Get user ID from email
  select id into target_user_id from auth.users where email = user_email;
  
  if target_user_id is null then
    raise exception 'User with email % not found', user_email;
  end if;

  -- Update public.users table
  update public.users 
  set role = new_role 
  where id = target_user_id;

  -- Update auth.users metadata for consistency
  update auth.users 
  set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', new_role)
  where id = target_user_id;
end;
$$ language plpgsql security definer;

-- Example: Replace with your actual email
-- SELECT make_user_admin('tisyastephen@gmail.com', 'admin');
