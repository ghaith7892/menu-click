-- =============================================
-- Run this in Supabase SQL Editor to fix registration
-- =============================================

-- 1. Trigger function: auto-creates user profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'restaurant')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 2. Attach trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Fix restaurant insert policy (allow owner to insert their own restaurant)
drop policy if exists "Owners can manage own restaurants" on public.restaurants;
create policy "Owners can read/update/delete own restaurants" on public.restaurants
  for select using (auth.uid() = owner_id);
create policy "Owners can update own restaurants" on public.restaurants
  for update using (auth.uid() = owner_id);
create policy "Owners can delete own restaurants" on public.restaurants
  for delete using (auth.uid() = owner_id);
create policy "Owners can insert own restaurants" on public.restaurants
  for insert with check (auth.uid() = owner_id);
create policy "Anyone can read active restaurants" on public.restaurants
  for select using (is_active = true);

-- Done! Email confirmation can be disabled in:
-- Supabase Dashboard → Authentication → Providers → Email → "Confirm email" OFF
