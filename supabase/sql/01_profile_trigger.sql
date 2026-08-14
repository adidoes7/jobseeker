-- Run this manually in the Supabase SQL editor (or via psql against DIRECT_URL)
-- after `npm run db:push` has created the `profiles` table.
-- Drizzle Kit does not manage the `auth` schema, so this trigger is applied
-- out of band: it auto-creates a `profiles` row whenever Supabase creates a
-- new `auth.users` row, so every signed-up user has a profile from their
-- first request with no client-side provisioning logic needed.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
